// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./PriceProvider.sol";

import "./uniswapV2/IUniswapV2Pair.sol";
import "./uniswapV2/UniswapV2OracleLibrary.sol";

import "../../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";


/**
 * UniswapV2 price provider
 * This implementation can be affected by price manipulation due to not using TWAP
 * For development purposes only
 */
contract UniswapV2PriceProvider is PriceProvider,
                                   Initializable,
                                   AccessControlUpgradeable 
{
    using FixedPoint for *;
    
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string public constant DESCRIPTION = "Price provider that uses uniswapV2";

    uint8 internal usdDecimals;

    mapping(address => UniswapV2Metadata) public uniswapV2Metadata; // address of token => metadata for uniswapV2
 
    mapping(address => OraclesUniV2Metadata) public oraclesUniV2Metadata; // address of pair => metadata for Oracles uinv2

    struct UniswapV2Metadata {
        bool isActive;
        address pair;       // address of uniswap liquidity pool token for pair 
        address pairAsset;  // address of second token in pair with token
        uint8 tokenDecimals;  // decimals of project token
        uint8 pairAssetDecimals; // decimals of second token in pair with token
    }

    struct OraclesUniV2Metadata {
        address token0;
        address token1;
        uint price0CumulativeLast;
        uint price1CumulativeLast;
        uint32 blockTimestampLast;
        FixedPoint.uq112x112 price0Average;
        FixedPoint.uq112x112 price1Average;
        uint PERIOD;
    }

    event GrandModeratorRole(address indexed who, address indexed newModerator);
    event RevokeModeratorRole(address indexed who, address indexed moderator);
    event SetTokenAndPair(address indexed who, address indexed token, address indexed pair, uint period);
    event ChangeActive(address indexed who, address indexed token, bool active);
    event ChangePeriod(uint newPreriod);

    function initialize() public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        usdDecimals = 6;
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the Admin");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "Caller is not the moderator");
        _;
    }

    /****************** Admin functions ****************** */

    function grandModerator(address newModerator) public onlyAdmin {
        grantRole(MODERATOR_ROLE, newModerator);
    }

    function revokeModerator(address moderator) public onlyAdmin {
        revokeRole(MODERATOR_ROLE,moderator);
    }

    /****************** Internal functions ****************** */

    function initOracles(address _pair, uint period) internal {
        OraclesUniV2Metadata storage oracle_metadata = oraclesUniV2Metadata[_pair];
        oracle_metadata.token0 = IUniswapV2Pair(_pair).token0();
        oracle_metadata.token1 = IUniswapV2Pair(_pair).token1();
        oracle_metadata.price0CumulativeLast = IUniswapV2Pair(_pair).price0CumulativeLast();
        oracle_metadata.price1CumulativeLast = IUniswapV2Pair(_pair).price1CumulativeLast();
        uint32 _blockTimestampLast;
        ( , , _blockTimestampLast) = IUniswapV2Pair(_pair).getReserves();
        oracle_metadata.blockTimestampLast = _blockTimestampLast;
        oracle_metadata.PERIOD = period;
    }

    function initUniswapV2Metadata(address token, address pair) internal {
        UniswapV2Metadata storage metadata = uniswapV2Metadata[token];
        metadata.isActive = true;
        metadata.pair = pair;
        address pairAsset = IUniswapV2Pair(pair).token0();
        if(pairAsset == token){
            pairAsset = IUniswapV2Pair(pair).token1();
        }
        metadata.pairAsset = pairAsset;
        metadata.tokenDecimals = ERC20Upgradeable(token).decimals();
        metadata.pairAssetDecimals = ERC20Upgradeable(pairAsset).decimals();
    }

    /****************** External functions ****************** */
    function update(address pair) external {
        OraclesUniV2Metadata storage oracle_metadata = oraclesUniV2Metadata[pair];
        // require(oracle_metadata.blockTimestampLast != 0, "UniswapV2PriceProvider: Invalid pair!");
        (
            uint price0Cumulative,
            uint price1Cumulative,
            uint32 blockTimestamp
        ) = UniswapV2OracleLibrary.currentCumulativePrices(pair);

        uint32 timeElapsed = blockTimestamp - oracle_metadata.blockTimestampLast;

        require(timeElapsed >= oracle_metadata.PERIOD, "time elapsed < min period");

        oracle_metadata.price0Average = FixedPoint.uq112x112(
            uint224((price0Cumulative - oracle_metadata.price0CumulativeLast) / timeElapsed)
        );

        oracle_metadata.price1Average = FixedPoint.uq112x112(
            uint224((price1Cumulative - oracle_metadata.price1CumulativeLast) / timeElapsed)
        );

        oracle_metadata.price0CumulativeLast = price0Cumulative;
        oracle_metadata.price1CumulativeLast = price1Cumulative;
        oracle_metadata.blockTimestampLast = blockTimestamp;
    }

    function updateable(address pair) public view returns (bool) {
        OraclesUniV2Metadata memory oracle_metadata = oraclesUniV2Metadata[pair];
        ( , , uint32 blockTimestamp) = UniswapV2OracleLibrary.currentCumulativePrices(pair);
        return (blockTimestamp - oracle_metadata.blockTimestampLast) > oracle_metadata.PERIOD;
    }

    /****************** Moderator functions ****************** */

    function setTokenAndPair(address token, address pair, uint period) public onlyModerator {
        require(token != address(0) && pair != address(0),"UniswapV2PriceProvider: Invalid token or pair!");
        require(IUniswapV2Pair(pair).token0() == token || IUniswapV2Pair(pair).token1() == token, "UniswapV2PriceProvider: Invalid pair!");
        uint112 reserve0;
        uint112 reserve1;
        (reserve0, reserve1, ) = IUniswapV2Pair(pair).getReserves();
        require(reserve0 != 0 && reserve1 != 0, "UniswapV2PriceProvider: NO_RESERVES"); // ensure that there's liquidity in the pair
        initUniswapV2Metadata(token, pair);
        initOracles(pair, period);
        emit SetTokenAndPair(msg.sender, token, pair, period);
    }

    function changeActive(address token, bool active) public override onlyModerator {
        require(uniswapV2Metadata[token].pair != address(0), "UniswapV2PriceProvider: token is not listed!");
        uniswapV2Metadata[token].isActive = active;
        emit ChangeActive(msg.sender, token, active);
    }

    function changePeriod(address token, uint newPreriod) public onlyModerator {
        address pair = uniswapV2Metadata[token].pair;
        require(newPreriod > 0, "UniswapV2PriceProvider: invalid period!");
        oraclesUniV2Metadata[pair].PERIOD = newPreriod;
        emit ChangePeriod(newPreriod);
    }

    /****************** view functions ****************** */

    function isListed(address token) public override view returns(bool){
        if(uniswapV2Metadata[token].pair != address(0)){
            return true;
        }else{
            return false;
        }
    }

    function isActive(address token) public override view returns(bool){
        return uniswapV2Metadata[token].isActive;
    }

    function getPrice(address token) public override view returns (uint256 price, uint8 priceDecimals) {
        UniswapV2Metadata memory uniswapV2metadata = uniswapV2Metadata[token];
        require(uniswapV2metadata.isActive, "UniswapV2PriceProvider: token is not active");
        address uniswapPair = uniswapV2metadata.pair;
        uint8 tokenDecimals = uniswapV2metadata.tokenDecimals;
        uint8 pairAssetDecimals = uniswapV2metadata.pairAssetDecimals;
        priceDecimals = pairAssetDecimals;
        uint256 tokenUniswapPrice = consult(uniswapPair, token, 10**uint256(tokenDecimals));
        price = tokenUniswapPrice;
    }

    function getEvaluation(address token, uint256 tokenAmount) public override view returns(uint256 evaluation) {
        (uint256 price, uint8 priceDecimals) = getPrice(token);
        evaluation = tokenAmount * price / (10 ** priceDecimals);
        uint8 tokenDecimals = uniswapV2Metadata[token].tokenDecimals;
        if(tokenDecimals >= usdDecimals){
            evaluation = evaluation / (10 ** (tokenDecimals - usdDecimals)); //get the evaluation in USD.
        }else{
            evaluation = evaluation * (10 ** (usdDecimals - tokenDecimals)); 
        }
    }

    function getReserves(address uniswapPair, address tokenA, address tokenB) public view returns (uint256 reserveA, uint256 reserveB){
        (address token0,) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);                  //sort tokens
        (uint256 reserve0, uint256 reserve1,) = IUniswapV2Pair(uniswapPair).getReserves();          //getting reserves
        (reserveA, reserveB) = (tokenA == token0) ? (reserve0, reserve1) : (reserve1, reserve0);    //form the correct order of reserves
    } 

    function getPriceDecimals() public override view returns (uint8) {
        return usdDecimals;
    }

    function consult(address pair, address token, uint amountIn)
        public
        view
        returns (uint amountOut)
    {
        OraclesUniV2Metadata memory oracle_metadata = oraclesUniV2Metadata[pair];
        if (token == oracle_metadata.token0) {
            amountOut = oracle_metadata.price0Average.mul(amountIn).decode144();
        } else {
            require(token == oracle_metadata.token1, "UniswapV2PriceProvider: INVALID_TOKEN");
            amountOut = oracle_metadata.price1Average.mul(amountIn).decode144();
        }
    }
}