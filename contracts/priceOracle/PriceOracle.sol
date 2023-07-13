// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../openzeppelin/contracts-upgradeable/interfaces/IERC20MetadataUpgradeable.sol";
import "./priceproviders/PriceProvider.sol";

contract PriceOracle is Initializable, AccessControlUpgradeable
{
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    uint8 public usdDecimals;
    
    uint16 public priceCapPercentPerHour;   // the maximum per-hour threshold of price movement, above which the price is capped
    uint256 public minSampleInterval;   // The period time that represent the minimum age of  mostRecentAccumLog before another entry is created in the longTWAPaccumLogs
    uint256 public logMaturingAge;  // TWAP calculations can only be calculated if the oldest longTWAPaccumLogs entry is older than logMaturingAge
    uint256 public longTWAPperiod;  // The period time for the long TWAP we produce from the series of logged reported prices.

    mapping(address => address) public tokenPriceProvider; // address of token => priceProvider address
    mapping(address => MostGovernedPrice) public mostGovernedPrice; // address of token => price
    mapping(address => AccumLog[]) public longTWAPaccumLogs; // address of token => AccumLog
    mapping(address => AccumLog) public mostRecentAccumLog; // address of token => AccumLog
    mapping(address => PriceInfo) public priceInfo; // address of token => PriceInfo
    mapping(address => bool) public twapEnabledForAsset;

    uint16 public constant PERCENTAGE_DECIMALS = 10000;
    uint16 public constant SECONDS_PER_HOUR = 3600;

    struct MostGovernedPrice {
        uint256 price;
        uint256 timestamp;
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

    event GrandModeratorRole(address indexed who, address indexed newModerator);
    event RevokeModeratorRole(address indexed who, address indexed moderator);
    event SetTokenAndPriceProvider(address indexed who, address indexed token, address indexed priceProvider);
    event ChangeActive(address indexed who, address indexed priceProvider, address indexed token, bool active);

    function initialize() public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);

        usdDecimals = 6;

        priceCapPercentPerHour = 1000; // 10%
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
     * @dev sets price provider to `token`
     * @param token the address of token
     * @param priceProvider the address of price provider. Should implememnt the interface of `PriceProvider`
     */
    function setTokenAndPriceProvider(address token, address priceProvider) public onlyModerator {
        require(token != address(0), "PriceOracle: invalid token");
        require(priceProvider != address(0), "PriceOracle: invalid priceProvider");
        tokenPriceProvider[token] = priceProvider;
        emit SetTokenAndPriceProvider(msg.sender, token, priceProvider);
    }

    function changeActive(address priceProvider, address token, bool active) public onlyModerator {
        require(tokenPriceProvider[token] == priceProvider, "PriceOracle: mismatch token`s price provider");
        PriceProvider(priceProvider).changeActive(token, active);
        emit ChangeActive(msg.sender, priceProvider, token, active);
    }

    function setPriceCapPercentPerHour(uint16 _priceCapPercentPerHour) public onlyModerator {
        require(_priceCapPercentPerHour <= PERCENTAGE_DECIMALS, "PriceOracle: invalid priceCapPercentPerHour");
        priceCapPercentPerHour = _priceCapPercentPerHour;
    }

    function setMinSampleInterval(uint256 _minSampleInterval) public onlyModerator {
        require(_minSampleInterval >= 0, "PriceOracle: invalid minSampleInterval");
        minSampleInterval = _minSampleInterval;
    }

    function setLogMaturingAge(uint256 _logMaturingAge) public onlyModerator {
        require(_logMaturingAge >= 0, "PriceOracle: invalid logMaturingAge");
        logMaturingAge = _logMaturingAge;
    }

    function setLongTWAPperiod(uint256 _longTWAPperiod) public onlyModerator {
        require(_longTWAPperiod >= 0, "PriceOracle: invalid longTWAPperiod");
        longTWAPperiod = _longTWAPperiod;
    }

    function setTwapEnabledForAsset(address token, bool enabled) public onlyModerator {
        twapEnabledForAsset[token] = enabled;
    }

    /****************** end Moderator functions ****************** */

    /****************** main functions ****************** */

    /**
     * @dev returns tuple (priceMantissa, priceDecimals)
     * @notice price = priceMantissa / (10 ** priceDecimals)
     * @param token the address of token wich price is to return
     */
    function getPrice(address token) public view returns(uint256 priceMantissa, uint8 priceDecimals){
        return PriceProvider(tokenPriceProvider[token]).getPrice(token);
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
     * @dev returns the most TWAP price in USD evaluation of token by its `tokenAmount`
     * @param token the address of token to evaluate
     * @param tokenAmount the amount of token to evaluate
     */
    function getEvaluation(address token, uint256 tokenAmount) public view returns(uint256 collateralEvaluation, uint256 capitalEvaluation){
        PriceInfo memory info = priceInfo[token];
        collateralEvaluation = _calEvaluation(token, tokenAmount, info.collateralPrice, info.priceDecimals);
        capitalEvaluation = _calEvaluation(token, tokenAmount, info.capitalPrice, info.priceDecimals);
    }

    /**
    * @dev Transforms a new accumulator log when having new price sample
    * @param mostLog The most recent accumulator log.
    * @param priceCurrent The current price.
    * @param currentTime The current time.
    * @return The transformed accumulator log.
    */
    function _transformAccumLog(AccumLog memory mostLog, uint256 priceCurrent, uint32 currentTime) private pure returns(AccumLog memory){
        uint32 deltaTime = currentTime - mostLog.timestamp;
        return AccumLog({
            timestamp: currentTime,
            totalWeights: deltaTime + mostLog.totalWeights,
            totalWeightedPrices: priceCurrent * deltaTime + mostLog.totalWeightedPrices
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
    function _applyVolatilityCap(address token, uint256 reportedPrice, uint32 currentTime) internal returns(uint256 governedPrice) {
        MostGovernedPrice storage mostGovernedPriceInfo = mostGovernedPrice[token];
        uint256 deltaTime = currentTime - mostGovernedPriceInfo.timestamp;
        uint256 allowedPriceVariance = mostGovernedPriceInfo.price * priceCapPercentPerHour * deltaTime / SECONDS_PER_HOUR / PERCENTAGE_DECIMALS;
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
    * @param governedPrice The governed price of the token.
    * @param currentTime The current time.
    */
    function _updateAccumLogs(address token, uint256 governedPrice, uint32 currentTime) internal {
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
                currentLog = _transformAccumLog(mostLog, governedPrice, currentTime);
            }
        }
        if (currentLog.timestamp != 0) {
            mostRecentAccumLog[token] = currentLog;
            longTWAPaccumLogs[token].push(currentLog);
        }
    }

    /**
    * @dev Derives the long TWAP price of a token.
    * @param token The address of the token.
    * @param currentTime The current time.
    * @return longTWAPprice The long TWAP price of the token.
    */
    function _deriveLongTWAPprice(address token, uint32 currentTime) internal view returns (uint256 longTWAPprice) {
        AccumLog[] memory accumLogs = longTWAPaccumLogs[token];
        if (accumLogs.length <= 1) {
            return 0;
        }

        AccumLog memory mostLog = mostRecentAccumLog[token];
        AccumLog memory lastLog;
        uint256 oldestTime = currentTime - longTWAPperiod;
        if (oldestTime <= accumLogs[0].timestamp) {
            lastLog = accumLogs[0];
        } else if (mostLog.timestamp <= oldestTime) {
            return 0;
        } else {
            uint256 count = 0;
            uint256 index = 0;
            for (uint256 i = accumLogs.length - 2; i > 0; i--) {
                if (accumLogs[i].timestamp >= oldestTime) {
                    index = i;
                    count++;
                } else {                    
                    break;
                }
            }
            if (count > 0) {
                lastLog = accumLogs[index];
            } else {
                return 0;
            }
        }
        longTWAPprice = _calArithmeticMean(lastLog, mostLog);
    }

    /**
    * @dev Derives the final prices of a token.
    * @param governedPrice The governed price of the token.
    * @param longTWAPprice The long TWAP price of the token.
    * @return collateralPrice The collateral price of the token.
    * @return capitalPrice The capital price of the token.
    */
    function _deriveFinalPrices(uint256 governedPrice, uint256 longTWAPprice) internal pure returns (uint256 collateralPrice, uint256 capitalPrice) {
        collateralPrice = governedPrice < longTWAPprice ? governedPrice : longTWAPprice;
        capitalPrice = governedPrice > longTWAPprice ? governedPrice : longTWAPprice;
    }

    /**
    * @dev Calculates the final TWAP prices of a token.
    * @param token The address of the token.
    * @return twapCollateralPrice The collateral price of the token.
    * @return twapCapitalPrice The capital price of the token.
    */
    function calcFinalPrices(address token) public returns (uint256 twapCollateralPrice, uint256 twapCapitalPrice) {
        uint32 currentTime = uint32(block.timestamp);
        (uint256 reportedPrice, uint8 priceDecimals) = getPrice(token);
        uint256 governedPrice = _applyVolatilityCap(token, reportedPrice, currentTime);
        
        if (!twapEnabledForAsset[token]) {
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
    }

    function getMostTWAPprice(address token) public view returns (PriceInfo memory) {
        return priceInfo[token];
    }
}
