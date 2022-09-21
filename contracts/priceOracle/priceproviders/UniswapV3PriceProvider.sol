// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./PriceProvider.sol";

import "./uniswapV3/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "./uniswapV3/v3-periphery/contracts/libraries/OracleLibrary.sol";
import "./uniswapV3/v3-periphery/contracts/libraries/SafeCast.sol";
import "./uniswapV3/v3-core/contracts/libraries/TickMath.sol";

import "../../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../../openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "../../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";


contract UniswapV3PriceProvider is PriceProvider,
                                   Initializable,
                                   AccessControlUpgradeable 
{  
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string public constant DESCRIPTION = "Price provider that uses uniswapV2";

    uint8 internal usdDecimals;

    address public uniswapV3Factory;
    mapping(bytes32 => address) public overriddenPoolForRoute;

    struct UniswapV3Metadata {
        bool isActive;
        address pool;       // address of uniswap liquidity pool token for pair 
        address pairAsset;  // address of second token in pair with token
        uint8 tokenDecimals;  // decimals of project token
        uint8 pairAssetDecimals; // decimals of second token in pair with token
        uint32 period;
    }

    mapping(address => UniswapV3Metadata) public uniswapV3Metadata; // address of token => metadata for uniswapV2
 
    event GrandModeratorRole(address indexed who, address indexed newModerator);
    event RevokeModeratorRole(address indexed who, address indexed moderator);
    event SetTokenAndPair(address indexed who, address indexed token, address indexed pair);
    event ChangeActive(address indexed who, address indexed token, bool active);
    event ChangePeriod(uint newPreriod);
    event ChangePool (address indexed pool);

    function initialize(address _uniswapV3Factory) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        uniswapV3Factory = _uniswapV3Factory;
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
    
    /****************** Moderator functions ****************** */
    function setTokenAndPair(address token, address pool, uint32 _period) public onlyModerator {
        require(token != address(0) && pool != address(0) && _period > 0,"UniswapV3PriceProvider: Invalid address");
        require(IUniswapV3Pool(pool).token0() == token || IUniswapV3Pool(pool).token1() == token, "UniswapV3PriceProvider: Invalid pool!");
        UniswapV3Metadata storage tokenInfo = uniswapV3Metadata[token];
        tokenInfo.isActive = true;
        tokenInfo.pool = pool;
        if(IUniswapV3Pool(pool).token0() == token) {
            tokenInfo.pairAsset = IUniswapV3Pool(pool).token1();
        } else {
            tokenInfo.pairAsset = IUniswapV3Pool(pool).token0();
        }
        tokenInfo.tokenDecimals = ERC20Upgradeable(token).decimals();
        tokenInfo.pairAssetDecimals = ERC20Upgradeable(tokenInfo.pairAsset).decimals();
        tokenInfo.period = _period;
        
        emit SetTokenAndPair(msg.sender, token, pool);
    }

    function changeActive(address token, bool active) public override onlyModerator {
        UniswapV3Metadata storage tokenInfo = uniswapV3Metadata[token];
        require(tokenInfo.pairAsset != address(0) && tokenInfo.pool != address(0), "UniswapV3PriceProvider: token is not listed!");
        tokenInfo.isActive = active;
        emit ChangeActive(msg.sender, token, active);
    }

    function changePeriod(address token, uint32 _period) public onlyModerator {
        UniswapV3Metadata storage tokenInfo = uniswapV3Metadata[token];
        require(tokenInfo.pool != address(0), "UniswapV3PriceProvider: token is not listed!");
        tokenInfo.period = _period;
        emit ChangePeriod(_period);
    }

    function changePool(address token, address pool) public onlyModerator {
        UniswapV3Metadata storage tokenInfo = uniswapV3Metadata[token];
        require(tokenInfo.pool != address(0), "UniswapV3PriceProvider: token is not listed!");
        require(IUniswapV3Pool(pool).token0() == token || IUniswapV3Pool(pool).token1() == token, "UniswapV3PriceProvider: Invalid pool!");
        tokenInfo.pool = pool;
        emit ChangePool(pool);
    }

    /****************** view functions ****************** */
    function getTwapTick(address token) public view returns (int24 twapTick) {
        UniswapV3Metadata memory tokenInfo = uniswapV3Metadata[token];
        address _pool = tokenInfo.pool;
        uint32 duration = tokenInfo.period;
        twapTick = OracleLibrary.consult(
            _pool,
            duration
        );
    }

    function isListed(address token) public override view returns(bool){
        if(uniswapV3Metadata[token].pool != address(0)){
            return true;
        }else{
            return false;
        }
    }

    function isActive(address token) public override view returns(bool){
        return uniswapV3Metadata[token].isActive;
    }

    function getPrice(address token) public override view returns (uint256 price, uint8 priceDecimals) {
        UniswapV3Metadata memory tokenInfo = uniswapV3Metadata[token];
        require(tokenInfo.pool != address(0) && tokenInfo.isActive, "UniswapV3PriceProvider: token is not active");
        address uniswapPair = tokenInfo.pairAsset;
        uint8 tokenDecimals = tokenInfo.tokenDecimals;
        uint8 pairAssetDecimals = tokenInfo.pairAssetDecimals;
        priceDecimals = pairAssetDecimals;
        int24 timeWeightedAverageTick = getTwapTick(token);
        uint128 amountIn = uint128(10 ** tokenDecimals);
        uint256 tokenUniswapPrice = getAmountOut(timeWeightedAverageTick, amountIn, token, uniswapPair);
        price = tokenUniswapPrice;
    }

    function getCurrentTicks(address pool, uint32 _twapPeriod) public view returns(int24 spotTick, int24 twapTick) {
        spotTick = OracleLibrary.getBlockStartingTick(pool);
        twapTick = OracleLibrary.consult(pool, _twapPeriod);
    }

    function getAmountOut(int24 tick, uint128 amountIn, address tokenIn, address tokenOut) public pure returns (uint amountOut) {
        amountOut = OracleLibrary.getQuoteAtTick(tick, amountIn, tokenIn, tokenOut);
    }

    function getEvaluation(address token, uint256 tokenAmount) public override view returns(uint256) {
        UniswapV3Metadata memory tokenInfo = uniswapV3Metadata[token];
        require(tokenInfo.pool != address(0) && tokenInfo.isActive, "UniswapV3PriceProvider: token is not active");
        address uniswapPair = tokenInfo.pairAsset;
        int256 twapTick = getTwapTick(token);
        return
            OracleLibrary.getQuoteAtTick(
                int24(twapTick),
                SafeCast.toUint128(tokenAmount),
                token,
                uniswapPair
            );
    } 

    function getPriceDecimals() public override view returns (uint8) {
        return usdDecimals;
    }

    function getPoolDetails(address pool)
        public
        view
        returns (
            address token0,
            address token1,
            uint24 fee,
            uint16 poolCardinality,
            uint128 liquidity,
            uint160 sqrtPriceX96,
            int24 currentTick,
            int24 tickSpacing
        )
    {
        IUniswapV3Pool uniswapPool = IUniswapV3Pool(pool);
        token0 = uniswapPool.token0();
        token1 = uniswapPool.token1();
        fee = uniswapPool.fee();
        liquidity = uniswapPool.liquidity();
        (sqrtPriceX96, currentTick, , poolCardinality, , , ) = uniswapPool.slot0();
        tickSpacing = uniswapPool.tickSpacing();
    }

    function getTick(uint160 sqrtPriceX96) public pure returns(int24 tick) {
        return TickMath.getTickAtSqrtRatio(sqrtPriceX96);
    }

    function getSqrtPriceX96(int24 tick) public pure returns(uint160 sqrtPriceX96) {
        return TickMath.getSqrtRatioAtTick(tick);
    }

    function getUnit128Max(uint tokenAmount) public pure returns (uint128 amountIn, uint128 max) {
        amountIn = SafeCast.toUint128(tokenAmount);
        max = type(uint128).max;
    }

}