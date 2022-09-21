// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./PriceProvider.sol";

import "./uniswapV2/IUniswapV2Pair.sol";
import "./uniswapV2/IUniswapV2Factory.sol";
import "./uniswapV2/lib/FixedPoint.sol";

import "./uniswapV2/UniswapV2OracleLibrary.sol";
import "./uniswapV2/UniswapV2Library.sol";

import "../../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../../openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";


/**
 * UniswapV2 price providerare sliding window oracles that use observations collected over a window to provide moving price averages in the past windowSize with a precision of windowSize / granularity.
 */
contract UniswapV2PriceProviderV2 is PriceProvider,
                                   Initializable,
                                   AccessControlUpgradeable 
{
    using FixedPoint for *;
    using SafeMathUpgradeable for uint256;
    
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
        uint periodSize;
        uint windowSize;
        uint granularity;
        Observation[] observations;
    }

    struct Observation {
        uint32 timestamp;
        uint256 price0Cumulative;
        uint256 price1Cumulative;
    }

    event GrandModeratorRole(address indexed who, address indexed newModerator);
    event RevokeModeratorRole(address indexed who, address indexed moderator);
    event SetTokenAndPair(address indexed who, address indexed token, address indexed pair);
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
        oracle_metadata.periodSize = period;
        (uint256 price0Cumulative, uint256 price1Cumulative, uint32 blockTimestamp) = UniswapV2OracleLibrary
            .currentCumulativePrices(_pair);
        oracle_metadata.observations.push(Observation(blockTimestamp, price0Cumulative, price1Cumulative));
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
    function _update(address pair) internal returns(bool) {
        OraclesUniV2Metadata storage oracle_metadata = oraclesUniV2Metadata[pair];
        Observation memory observation = lastObservation(pair);
        // we only want to commit updates once per period (i.e. windowSize / granularity)
        uint32 timeElapsed = uint32(block.timestamp) - observation.timestamp;
        if (timeElapsed > oracle_metadata.periodSize) {
            (uint price0Cumulative, uint price1Cumulative,) = UniswapV2OracleLibrary.currentCumulativePrices(pair);
            oracle_metadata.observations.push(Observation(uint32(block.timestamp), price0Cumulative, price1Cumulative));
            observation.timestamp = uint32(block.timestamp);
            // lastUpdated[pair] = block.timestamp;
            observation.price0Cumulative = price0Cumulative;
            observation.price1Cumulative = price1Cumulative;
            return true;
        }
        
        return false;
    }

    function updatePair(address pair) external {
        require(_update(pair), "UniswapV2Oracle: PERIOD_NOT_ELAPSED");
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
        emit SetTokenAndPair(msg.sender, token, pair);
    }

    function changeActive(address token, bool active) public override onlyModerator {
        require(uniswapV2Metadata[token].pair != address(0), "UniswapV2PriceProvider: token is not listed!");
        uniswapV2Metadata[token].isActive = active;
        emit ChangeActive(msg.sender, token, active);
    }

    function changePeriod(address token, uint newPreriod) public onlyModerator {
        address pair = uniswapV2Metadata[token].pair;
        require(newPreriod > 0, "UniswapV2PriceProvider: invalid period!");
        oraclesUniV2Metadata[pair].periodSize = newPreriod;
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
        uint256 tokenUniswapPrice = consult(token, uniswapPair, 10**uint256(tokenDecimals));
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

    function observationLength(address pair) external view returns (uint256) {
        OraclesUniV2Metadata memory oracle_metadata = oraclesUniV2Metadata[pair];
        return oracle_metadata.observations.length;
    }

    function lastObservation(address pair) public view returns (Observation memory) {
        OraclesUniV2Metadata memory oracle_metadata = oraclesUniV2Metadata[pair];
        return oracle_metadata.observations[oracle_metadata.observations.length - 1];
    }
    function quote(address token, address pair, uint256 amountIn, uint256 granularity) external view returns (uint256 amountOut) {
        OraclesUniV2Metadata memory oracle_metadata = oraclesUniV2Metadata[pair];
        uint256 priceAverageCumulative = 0;
        uint256 length = oracle_metadata.observations.length - 1;
        uint256 i = length.sub(granularity);

        uint256 nextIndex = 0;
        if (token == oracle_metadata.token0) {
            for (; i < length; i++) {
                nextIndex = i + 1;
                priceAverageCumulative += computeAmountOut(
                    oracle_metadata.observations[i].price0Cumulative,
                    oracle_metadata.observations[nextIndex].price0Cumulative,
                    oracle_metadata.observations[nextIndex].timestamp - oracle_metadata.observations[i].timestamp,
                    amountIn
                );
            }
        } else if (token == oracle_metadata.token1) {
            for (; i < length; i++) {
                nextIndex = i + 1;
                priceAverageCumulative += computeAmountOut(
                    oracle_metadata.observations[i].price1Cumulative,
                    oracle_metadata.observations[nextIndex].price1Cumulative,
                    oracle_metadata.observations[nextIndex].timestamp - oracle_metadata.observations[i].timestamp,
                    amountIn
                );
            }
        }
        amountOut = priceAverageCumulative.div(granularity);
    }

    // given the cumulative prices of the start and end of a period, and the length of the period, compute the average
    // price in terms of how much amount out is received for the amount in
    function computeAmountOut(
        uint priceCumulativeStart, 
        uint priceCumulativeEnd,
        uint timeElapsed, 
        uint amountIn
    ) private pure returns (uint amountOut) {
        // overflow is desired.
        FixedPoint.uq112x112 memory priceAverage = FixedPoint.uq112x112(
            uint224((priceCumulativeEnd - priceCumulativeStart) / timeElapsed)
        );
        amountOut = priceAverage.mul(amountIn).decode144();
    }

    function updateable(address pair) public view returns (bool) {
        OraclesUniV2Metadata memory oracle_metadata = oraclesUniV2Metadata[pair];
        return (block.timestamp - lastObservation(pair).timestamp) > oracle_metadata.periodSize;
    }

    function consult(address token, address pair, uint256 amountIn) public view returns (uint256 amountOut) {
        Observation memory _observation = lastObservation(pair);
        OraclesUniV2Metadata memory oracle_metadata = oraclesUniV2Metadata[pair];
        (uint256 price0Cumulative, uint256 price1Cumulative, uint32 blockTimestamp) = UniswapV2OracleLibrary
            .currentCumulativePrices(address(pair));
        if (blockTimestamp == _observation.timestamp) {
            _observation = oracle_metadata.observations[oracle_metadata.observations.length - 2];
        }

        uint32 timeElapsed = blockTimestamp - _observation.timestamp;
        timeElapsed = timeElapsed == 0 ? 1 : timeElapsed;
        if (token == oracle_metadata.token0) {
            amountOut = computeAmountOut(
                _observation.price0Cumulative,
                price0Cumulative,
                timeElapsed,
                amountIn
            );
        } else if (token == oracle_metadata.token1) {
            amountOut = computeAmountOut(
                _observation.price1Cumulative,
                price1Cumulative,
                timeElapsed,
                amountIn
            );
        }
    }

    function getObservation (address pair, uint index) public view returns(Observation memory) {
        return oraclesUniV2Metadata[pair].observations[index];
    }
}