// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../openzeppelin/contracts-upgradeable/interfaces/IERC20MetadataUpgradeable.sol";
import "./priceproviders/PriceProvider.sol";
import "./../interfaces/NewPriceOracle/IPriceProviderAggregatorV2.sol";

contract PriceOracle is Initializable, AccessControlUpgradeable
{
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    uint16 public constant PERCENTAGE_DECIMALS = 10000;
    uint16 public constant SECONDS_PER_HOUR = 1 hours;

    uint8 public usdDecimals;
    
    uint16 public volatilityCapFixedPercent;    // the maximum per-hour threshold of price movement, above which the price is capped
    uint256 public minSampleInterval;           // The period time that represent the minimum age of  mostRecentAccumLog before another entry is created in the longTWAPaccumLogs
    uint256 public logMaturingAge;              // TWAP calculations can only be calculated if the oldest longTWAPaccumLogs entry is older than logMaturingAge
    uint256 public longTWAPperiod;              // The period time for the long TWAP we produce from the series of logged reported prices.

    mapping(address => GovernedPrice) public mostGovernedPrice;             // address of token => price
    mapping(address => GovernedPrice) public mostAccumLogGovernedPrice;     // address of token => price
    mapping(address => AccumLog[]) public longTWAPaccumLogs;                // address of token => AccumLog
    mapping(address => AccumLog) public mostRecentAccumLog;                 // address of token => AccumLog
    mapping(address => PriceInfo) public priceInfo;                         // address of token => PriceInfo

    IPriceProviderAggregatorV2 public priceProviderAggregator;

    struct GovernedPrice {
        uint32 timestamp;
        uint256 price;
    }

    struct AccumLog {
        uint32 timestamp;
        uint256 totalWeights;
        uint256 totalWeightedPrices;
    }

    struct PriceInfo {
        uint8 priceDecimals;
        uint32 timestamp;
        uint256 collateralPrice;
        uint256 capitalPrice;
    }

    event PriceUpdated(address indexed token, uint8 priceDecimals, uint32 currentTime, uint256 twapCollateralPrice, uint256 twapCapitalPrice);
    event GrandModeratorRole(address indexed who, address indexed newModerator);
    event RevokeModeratorRole(address indexed who, address indexed moderator);
    event SetVolatilityCapFixedPercent(uint16 volatilityCapFixedPercent);
    event SetMinSampleInterval(uint256 minSampleInterval);
    event SetLogMaturingAge(uint256 logMaturingAge);
    event SetLongTWAPperiod(uint256 longTWAPperiod);
    event SetPriceProviderAggregator(address newPriceProviderAggregator);

    function initialize() public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);

        usdDecimals = 6;

        volatilityCapFixedPercent = 1000; // 10%
        minSampleInterval = 1 hours;
        logMaturingAge = 1 days;
        longTWAPperiod = 1 days;
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "PriceOracle: Caller is not the Admin");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "PriceOracle: Caller is not the Moderator");
        _;
    }

    /****************** Admin functions ****************** */

    function grandModerator(address newModerator) public onlyAdmin {
        grantRole(MODERATOR_ROLE, newModerator);
        emit GrandModeratorRole(msg.sender, newModerator);
    }

    function revokeModerator(address moderator) public onlyAdmin {
        revokeRole(MODERATOR_ROLE, moderator);
        emit RevokeModeratorRole(msg.sender, moderator);
    }    

    /****************** end Admin functions ****************** */

    /****************** Moderator functions ****************** */

    /**
    * @dev Set the price provider aggregator contract address
    * @param newPriceProviderAggregator The address of the new price provider aggregator contract
    */
    function setPriceProviderAggregator(address newPriceProviderAggregator) public onlyModerator {
        require(newPriceProviderAggregator != address(0), "PriceOracle: invalid priceProviderAggregator");
        priceProviderAggregator = IPriceProviderAggregatorV2(newPriceProviderAggregator);
        emit SetPriceProviderAggregator(newPriceProviderAggregator);
    }

    /**
     * @dev Set the volatility cap fixed percent
     * @param _volatilityCapFixedPercent The new volatility cap fixed percent
     */
    function setVolatilityCapFixedPercent(uint16 _volatilityCapFixedPercent) public onlyModerator {
        require(_volatilityCapFixedPercent <= PERCENTAGE_DECIMALS, "PriceOracle: invalid volatilityCapFixedPercent");
        volatilityCapFixedPercent = _volatilityCapFixedPercent;
        emit SetVolatilityCapFixedPercent(_volatilityCapFixedPercent);
    }

    /** 
     * @dev Set the minimum sample interval
     * @param _minSampleInterval The new minimum sample interval
     */
    function setMinSampleInterval(uint256 _minSampleInterval) public onlyModerator {
        minSampleInterval = _minSampleInterval;
        emit SetMinSampleInterval(_minSampleInterval);
    }

    /**
     * @dev Set the log maturing age
     * @param _logMaturingAge The new log maturing age
     */
    function setLogMaturingAge(uint256 _logMaturingAge) public onlyModerator {
        logMaturingAge = _logMaturingAge;
        emit SetLogMaturingAge(_logMaturingAge);
    }

    /**
     * @dev Set the long TWAP period
     * @param _longTWAPperiod The new long TWAP period
     */
    function setLongTWAPperiod(uint256 _longTWAPperiod) public onlyModerator {
        longTWAPperiod = _longTWAPperiod;
        emit SetLongTWAPperiod(_longTWAPperiod);
    }

    /****************** end Moderator functions ****************** */

    /****************** Main functions ****************** */

    /**
    * @dev Calculates the final TWAP prices of a token.
    * @param token The address of the token.
    */
    function calcFinalPrices(address token) external {
        uint256 twapCollateralPrice = 0;
        uint256 twapCapitalPrice = 0;

        uint32 currentTime = uint32(block.timestamp);
        (uint256 reportedPrice, uint8 priceDecimals) = getReportedPrice(token);
        uint256 governedPrice = _applyVolatilityCap(token, reportedPrice, currentTime);

        if (!priceProviderAggregator.twapEnabledForAsset(token)) {
            (twapCollateralPrice, twapCapitalPrice) = (governedPrice, governedPrice);
        } else {
            _updateAccumLogs(token, governedPrice, currentTime);
            uint256 longTWAPprice = _deriveLongTWAPprice(token, currentTime);
            (twapCollateralPrice, twapCapitalPrice) = longTWAPprice == 0 ? (governedPrice, governedPrice) : _deriveFinalPrices(governedPrice, longTWAPprice);
        }
        priceInfo[token] = PriceInfo({
            timestamp: currentTime,
            priceDecimals: priceDecimals,
            collateralPrice: twapCollateralPrice,
            capitalPrice: twapCapitalPrice
        });

        emit PriceUpdated(token, priceDecimals, currentTime, twapCollateralPrice, twapCapitalPrice);
    }

    /**
     * @dev Returns the most recent TWAP price of a token.
     * @param token The address of the token.
     * @return priceDecimals The decimals of the price.
     * @return timestamp The last updated timestamp of the price.
     * @return collateralPrice The collateral price of the token.
     * @return capitalPrice The capital price of the token.
     */
    function getMostTWAPprice(address token) external view returns (uint8 priceDecimals, uint32 timestamp, uint256 collateralPrice, uint256 capitalPrice) {
        PriceInfo memory info = priceInfo[token];
        return (info.priceDecimals, info.timestamp, info.collateralPrice, info.capitalPrice);
    }

    /**
     * @dev returns the most TWAP price in USD evaluation of token by its `tokenAmount`
     * @param token the address of token to evaluate
     * @param tokenAmount the amount of token to evaluate
     * @return collateralEvaluation the USD evaluation of token by its `tokenAmount` in collateral price
     * @return capitalEvaluation the USD evaluation of token by its `tokenAmount` in capital price
     */
    function getEvaluation(address token, uint256 tokenAmount) external view returns(uint256 collateralEvaluation, uint256 capitalEvaluation){
        PriceInfo memory info = priceInfo[token];
        collateralEvaluation = _calEvaluation(token, tokenAmount, info.collateralPrice, info.priceDecimals);
        capitalEvaluation = _calEvaluation(token, tokenAmount, info.capitalPrice, info.priceDecimals);
    }

    /**
     * @dev returns tuple (priceMantissa, priceDecimals)
     * @notice price = priceMantissa / (10 ** priceDecimals)
     * @param token the address of token which price is to return
     */
    function getReportedPrice(address token) public view returns(uint256 priceMantissa, uint8 priceDecimals){
        return PriceProvider(priceProviderAggregator.tokenPriceProvider(token)).getPrice(token);
    }
    
    /**
     * @dev returns the USD evaluation of token by its `tokenAmount`
     * @param token the address of token to evaluate
     * @param tokenAmount the amount of token to evaluate
     * @param price the price of token
     * @param priceDecimals the decimals of price
     */
    function _calEvaluation(address token, uint256 tokenAmount, uint256 price, uint8 priceDecimals) private view returns(uint256 evaluation){
        evaluation = tokenAmount * price / (10 ** priceDecimals);
        uint8 tokenDecimals = IERC20MetadataUpgradeable(token).decimals();
        if(tokenDecimals >= usdDecimals){
            evaluation = evaluation / (10 ** (tokenDecimals - usdDecimals));
        }else{
            evaluation = evaluation * (10 ** (usdDecimals - tokenDecimals)); 
        }
    }

    /**
    * @dev Transforms a new accumulator log when having new price sample
    * @param mostLog The most recent accumulator log.
    * @param mostAccumLogPrice The most recent accumulator log governed price.
    * @param currentTime The current time.
    * @return The transformed accumulator log.
    */
    function _transformAccumLog(AccumLog memory mostLog, GovernedPrice memory mostAccumLogPrice, uint32 currentTime) private pure returns(AccumLog memory){
        uint32 deltaTime = currentTime - mostAccumLogPrice.timestamp;
        return AccumLog({
            timestamp: mostAccumLogPrice.timestamp,
            totalWeights: deltaTime + mostLog.totalWeights,
            totalWeightedPrices: mostAccumLogPrice.price * deltaTime + mostLog.totalWeightedPrices
        });
    }

    /**
    * @dev Calculates the arithmetic mean of two accumulator logs.
    * @param lastLog The last accumulator log.
    * @param currentLog The current accumulator log.
    * @return The arithmetic mean of the two accumulator logs.
    */
    function _calArithmeticMean(AccumLog memory lastLog, AccumLog memory currentLog) private pure returns(uint256) {
        uint256 deltaWeightedPrices  = currentLog.totalWeightedPrices - lastLog.totalWeightedPrices;
        uint256 deltaWeights = currentLog.totalWeights - lastLog.totalWeights;
        return deltaWeights == 0 ? 0 : deltaWeightedPrices / deltaWeights;
    }

    /**
    * @dev Applies the volatility cap rule to a token's price.
    * @param token The address of the token.
    * @param reportedPrice The reported price of the token.
    * @param currentTime The current time.
    * @return governedPrice The governed price of the token.
    */
    function _applyVolatilityCap(address token, uint256 reportedPrice, uint32 currentTime) private returns(uint256 governedPrice) {
        GovernedPrice storage mostGovernedPriceInfo = mostGovernedPrice[token];
        uint256 deltaHours = (currentTime - mostGovernedPriceInfo.timestamp) / SECONDS_PER_HOUR;
        uint256 allowedPriceVariance = mostGovernedPriceInfo.price * volatilityCapFixedPercent * deltaHours / PERCENTAGE_DECIMALS;
        uint256 actualPriceVariance = reportedPrice > mostGovernedPriceInfo.price ? reportedPrice - mostGovernedPriceInfo.price : mostGovernedPriceInfo.price - reportedPrice;
        if (reportedPrice < mostGovernedPriceInfo.price) {
            governedPrice = actualPriceVariance < allowedPriceVariance ? reportedPrice : mostGovernedPriceInfo.price - actualPriceVariance;
        } else {
            governedPrice = actualPriceVariance < allowedPriceVariance ? reportedPrice : mostGovernedPriceInfo.price + actualPriceVariance;
        }
        mostGovernedPriceInfo.price = governedPrice;
        mostGovernedPriceInfo.timestamp = currentTime;
    }

    /**
    * @dev Derives a new long TWAP accumulator log and updates accumulator logs.
    * @param token The address of the token.
    * @param currentGovernedPrice The current governed price of the token.
    * @param currentTime The current time.
    */
    function _updateAccumLogs(address token, uint256 currentGovernedPrice, uint32 currentTime) private {
        AccumLog memory currentLog;
        AccumLog memory mostLog = mostRecentAccumLog[token];
        if (mostLog.timestamp == 0) {
            currentLog = AccumLog({
                timestamp: currentTime,
                totalWeights: 0,
                totalWeightedPrices: 0
            });
        } else {
            if (currentTime - mostLog.timestamp >= minSampleInterval) {
                currentLog = _transformAccumLog(mostLog, mostAccumLogGovernedPrice[token], currentTime);
            }
        }
        if (currentLog.timestamp != 0) {
            mostRecentAccumLog[token] = currentLog;
            longTWAPaccumLogs[token].push(currentLog);
            mostAccumLogGovernedPrice[token] = GovernedPrice({
                price: currentGovernedPrice,
                timestamp: currentTime
            });
        }
    }

    /**
    * @dev Derives the long TWAP price of a token.
    * @param token The address of the token.
    * @param currentTime The current time.
    * @return longTWAPprice The long TWAP price of the token.
    */
    function _deriveLongTWAPprice(address token, uint32 currentTime) private view returns (uint256 longTWAPprice) {
        AccumLog[] memory accumLogs = longTWAPaccumLogs[token];
        if (accumLogs.length < 1) {
            return 0;
        }

        GovernedPrice memory mostAccumLogPrice = mostAccumLogGovernedPrice[token];
        AccumLog memory mostLog = mostRecentAccumLog[token];
        AccumLog memory currentLog;
        AccumLog memory lastLog;
        uint256 oldestTime = currentTime - longTWAPperiod;
        if (oldestTime <= accumLogs[0].timestamp) {
            lastLog = accumLogs[0];
        } else if (mostLog.timestamp < oldestTime) {
            return 0;
        } else {
            uint256 index = 0;
            for (uint256 i = accumLogs.length - 1; i > 0; i--) {
                if (oldestTime <= accumLogs[i].timestamp) {
                    index = i;
                } else {                    
                    break;
                }
            }
            lastLog = accumLogs[index];
        }

        if (mostLog.timestamp == mostAccumLogPrice.timestamp) {
            currentLog = mostLog;
        } else {
            currentLog = _transformAccumLog(mostLog, mostAccumLogPrice, currentTime);
        }
        if (lastLog.timestamp == currentLog.timestamp) {
            return 0;
        }
        longTWAPprice = _calArithmeticMean(lastLog, currentLog);
    }

    /**
    * @dev Derives the final prices of a token.
    * @param governedPrice The governed price of the token.
    * @param longTWAPprice The long TWAP price of the token.
    * @return collateralPrice The collateral price of the token.
    * @return capitalPrice The capital price of the token.
    */
    function _deriveFinalPrices(uint256 governedPrice, uint256 longTWAPprice) private pure returns (uint256 collateralPrice, uint256 capitalPrice) {
        collateralPrice = governedPrice < longTWAPprice ? governedPrice : longTWAPprice;
        capitalPrice = governedPrice > longTWAPprice ? governedPrice : longTWAPprice;
    }
}
