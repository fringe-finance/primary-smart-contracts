// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20MetadataUpgradeable.sol";
import "../interfaces/IPriceProviderAggregator.sol";
import "./priceproviders/PriceProvider.sol";

contract PriceOracle is Initializable, AccessControlUpgradeable {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    uint16 public constant PERCENTAGE_DECIMALS = 10000;

    uint16 public constant SECONDS_PER_HOUR = 1 hours;

    uint8 public usdDecimals;
    
    /**
     * @notice Defines the maximum threshold of price movement since the previously-stored mostRecentGovernedPrice, above which the price is capped.
     */
    uint16 public volatilityCapFixedPercent;

    /**
     * @notice The period time that represent the minimum age of mostRecentAccumLog before another entry is created in the longTWAPaccumLogs.
     */ 
    uint256 public minSampleInterval;

    /**
     * @notice TWAP calculations can only be calculated if the oldest longTWAPaccumLogs entry is older than logMaturingAge.
     */          
    uint256 public logMaturingAge;

    /**
     * @notice The period time for the long TWAP we produce from the series of logged reported prices.
     */              
    uint256 public longTWAPperiod;

    /**
     * @notice Used in volatility cap rule calculations.
     * Mapping address of token => GovernedPrice
     */
    mapping(address => GovernedPrice) public mostGovernedPrice;

    /**
     * @notice Used in long TWAP price calculations.
     * Mapping address of token => GovernedPrice.
     */
    mapping(address => GovernedPrice) public mostAccumLogGovernedPrice;

    /**
     * @notice Series of long TWAP accumulators.
     * Mapping address of token => AccumLog[].
     */
    mapping(address => AccumLog[]) public longTWAPaccumLogs;               

    /**
     * @notice This most recent longTWAPaccumulatorLog entry for use when deriving future newLongTWAPaccumulator.
     * Mapping address of token => AccumLog.
     */
    mapping(address => AccumLog) public mostRecentAccumLog;                

    /**
     * @notice The final price after update price by calcFinalPrices function.
     * Mapping address of token => PriceInfo.
     */
    mapping(address => PriceInfo) public priceInfo;                       

    IPriceProviderAggregator public priceProviderAggregator;

    /**
     * @dev The Index of oldest longTWAPaccumulatorLog entry isn't older than longTWAPperiod.
     */
    uint256 internal _accumLogOldestIndex;

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
        uint32 timestamp;
        uint256 collateralPrice;
        uint256 capitalPrice;
    }

    event PriceUpdated(
        address indexed token, 
        uint32 currentTime,
        uint256 twapCollateralPrice, 
        uint256 twapCapitalPrice
    );
    
    /**
     * @dev Emitted when the moderator role is granted to a new address.
     * @param newModerator The address of the new moderator.
     */
    event GrantModeratorRole(address indexed newModerator);

    /**
     * @dev Emitted when the moderator role is revoked from an address.
     * @param moderator The address of the moderator to be revoked.
     */
    event RevokeModeratorRole(address indexed moderator);
    
     /**
     * @dev Emitted when the new volatilityCapFixedPercent value is set.
     * @param volatilityCapFixedPercent The new volatilityCapFixedPercent value.
     */
    event SetVolatilityCapFixedPercent(uint16 volatilityCapFixedPercent);
    
    /**
     * @dev Emitted when the new minSampleInterval value is set.
     * @param newMinSampleInterval The new minSampleInterval value.
     */
    event SetMinSampleInterval(uint256 newMinSampleInterval);
    
    /**
     * @dev Emitted when the new logMaturingAge value is set.
     * @param newLogMaturingAge The new logMaturingAge value.
     */
    event SetLogMaturingAge(uint256 newLogMaturingAge);
    
    /**
     * @dev Emitted when the new longTWAPperiod value is set.
     * @param newLongTWAPperiod The new longTWAPperiod value.
     */
    event SetLongTWAPperiod(uint256 newLongTWAPperiod);
    
    /**
     * @dev Emitted when the PriceProviderAggregator contract is set.
     * @param newPriceProviderAggregator The address of PriceProviderAggregator contract.
     */
    event SetPriceProviderAggregator(address newPriceProviderAggregator);

    /**
     * @dev Initializes the contract by setting up the access control roles and assigning them to the contract deployer.
     * The `DEFAULT_ADMIN_ROLE` and `MODERATOR_ROLE` roles are set up with the contract deployer as the initial role bearer.
     * `usdDecimals` is set to 6.
     * @param _priceProviderAggregator The address of PriceProviderAggregator contract.
     * @param _volatilityCapFixedPercent The volatilityCapFixedPercent value.
     * @param _minSampleInterval The minSampleInterval value.
     * @param _logMaturingAge The logMaturingAge value.
     * @param _longTWAPperiod The longTWAPperiod value.
     */
    function initialize(
        address _priceProviderAggregator,
        uint16 _volatilityCapFixedPercent,
        uint256 _minSampleInterval,
        uint256 _logMaturingAge,
        uint256 _longTWAPperiod
    ) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);

        usdDecimals = 6;
        priceProviderAggregator = IPriceProviderAggregator(_priceProviderAggregator);

        volatilityCapFixedPercent = _volatilityCapFixedPercent;
        minSampleInterval = _minSampleInterval;
        logMaturingAge = _logMaturingAge;
        longTWAPperiod = _longTWAPperiod;
    }

    /**
     * @dev Modifier to restrict access to functions to only the contract's admin.
     */
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the Admin");
        _;
    }

    /**
     * @dev Modifier to restrict access to functions to only the contract's moderator.
     */
    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "Caller is not the moderator");
        _;
    }

    /****************** Admin functions ****************** */

    /**
     * @dev Grants the moderator role to a new address.
     * @param newModerator The address of the new moderator.
     */
    function grantModerator(address newModerator) external onlyAdmin {
        grantRole(MODERATOR_ROLE, newModerator);
        emit GrantModeratorRole(newModerator);
    }

    /**
     * @dev Revokes the moderator role from an address.
     * @param moderator The address of the moderator to be revoked.
     */
    function revokeModerator(address moderator) external onlyAdmin {
        revokeRole(MODERATOR_ROLE, moderator);
        emit RevokeModeratorRole(moderator);
    }    

    /****************** end Admin functions ****************** */

    /****************** Moderator functions ****************** */

    /**
    * @dev Set the price provider aggregator contract address
    * 
    * Requirements:
    * - The caller must be the moderator.
    * - `newPriceProviderAggregator` cannot be the zero address.
    * @param newPriceProviderAggregator The address of the new price provider aggregator contract
    */
    function setPriceProviderAggregator(address newPriceProviderAggregator) external onlyModerator {
        require(newPriceProviderAggregator != address(0), "PriceOracle: invalid priceProviderAggregator");
        priceProviderAggregator = IPriceProviderAggregator(newPriceProviderAggregator);
        emit SetPriceProviderAggregator(newPriceProviderAggregator);
    }

    /**
     * @dev Set the volatility cap fixed percent
     * 
     * Requirements:
     * - The caller must be the moderator.
     * - `_volatilityCapFixedPercent` cannot be greater PERCENTAGE_DECIMALS.
     * @param _volatilityCapFixedPercent The new volatility cap fixed percent
     */
    function setVolatilityCapFixedPercent(uint16 _volatilityCapFixedPercent) external onlyModerator {
        require(_volatilityCapFixedPercent <= PERCENTAGE_DECIMALS, "PriceOracle: invalid volatilityCapFixedPercent");
        volatilityCapFixedPercent = _volatilityCapFixedPercent;
        emit SetVolatilityCapFixedPercent(_volatilityCapFixedPercent);
    }

    /** 
     * @dev Set the minimum sample interval
     * @param _minSampleInterval The new minimum sample interval
     */
    function setMinSampleInterval(uint256 _minSampleInterval) external onlyModerator {
        minSampleInterval = _minSampleInterval;
        emit SetMinSampleInterval(_minSampleInterval);
    }

    /**
     * @dev Set the log maturing age
     * @param _logMaturingAge The new log maturing age
     */
    function setLogMaturingAge(uint256 _logMaturingAge) external onlyModerator {
        logMaturingAge = _logMaturingAge;
        emit SetLogMaturingAge(_logMaturingAge);
    }

    /**
     * @dev Set the long TWAP period
     * @param _longTWAPperiod The new long TWAP period
     */
    function setLongTWAPperiod(uint256 _longTWAPperiod) external onlyModerator {
        longTWAPperiod = _longTWAPperiod;
        emit SetLongTWAPperiod(_longTWAPperiod);
    }

    /****************** end Moderator functions ****************** */

    /****************** Main functions ****************** */

    /**
    * @dev Calculates the final TWAP prices of a token.
    * @param token The address of the token.
    */
    function updateFinalPrices(address token) external {
        uint256 twapCollateralPrice = 0;
        uint256 twapCapitalPrice = 0;

        uint32 currentTime = uint32(block.timestamp);
        uint256 reportedPrice = getReportedPrice(token);
        uint256 governedPrice = _applyVolatilityCap(token, reportedPrice, currentTime);

        if (!priceProviderAggregator.twapEnabledForAsset(token)) {
            (twapCollateralPrice, twapCapitalPrice) = (governedPrice, governedPrice);
        } else {
            _updateAccumLogs(token, governedPrice, currentTime);
            _updateAccumLogOldestIndex(token);
            uint256 longTWAPprice = _deriveLongTWAPprice(token, currentTime);
            (twapCollateralPrice, twapCapitalPrice) = longTWAPprice == 0 ? (governedPrice, governedPrice) : _deriveFinalPrices(governedPrice, longTWAPprice);
        }
        priceInfo[token] = PriceInfo({
            timestamp: currentTime,
            collateralPrice: twapCollateralPrice,
            capitalPrice: twapCapitalPrice
        });

        emit PriceUpdated(token, currentTime, twapCollateralPrice, twapCapitalPrice);
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
        return (getTokenPriceDecimals(token), info.timestamp, info.collateralPrice, info.capitalPrice);
    }

    /**
     * @dev Returns the decimals price of the token.
     * @param token The address of the token.
     * @return priceDecimals The decimals price of the token.
     */
    function getTokenPriceDecimals(address token) public view returns(uint8 priceDecimals){
        return priceProviderAggregator.tokenPriceProvider(token).priceDecimals;
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
        uint8 priceDecimals = getTokenPriceDecimals(token);
        collateralEvaluation = _calEvaluation(token, tokenAmount, info.collateralPrice, priceDecimals);
        capitalEvaluation = _calEvaluation(token, tokenAmount, info.capitalPrice, priceDecimals);
    }

    /**
     * @dev returns tuple (priceMantissa, priceDecimals)
     * @notice price = priceMantissa / (10 ** priceDecimals)
     * @param token the address of token which price is to return
     */
    function getReportedPrice(address token) public view returns(uint256 priceMantissa) {
        (uint256 reportedPrice, uint8 priceDecimals) = PriceProvider(priceProviderAggregator.tokenPriceProvider(token).priceProvider).getPrice(token);
        uint8 calculatedPriceDecimals = getTokenPriceDecimals(token);
        priceMantissa = priceDecimals >= calculatedPriceDecimals
            ? reportedPrice / (10 ** (priceDecimals - calculatedPriceDecimals))
            : reportedPrice / (10 ** (calculatedPriceDecimals - priceDecimals));
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
        if (mostGovernedPriceInfo.timestamp == 0) {
            governedPrice = reportedPrice;
        } else {
            uint256 deltaSeconds = (currentTime - mostGovernedPriceInfo.timestamp);
            uint256 allowedPriceVariance = mostGovernedPriceInfo.price * volatilityCapFixedPercent * deltaSeconds / SECONDS_PER_HOUR / PERCENTAGE_DECIMALS;
            uint256 actualPriceVariance = reportedPrice > mostGovernedPriceInfo.price ? reportedPrice - mostGovernedPriceInfo.price : mostGovernedPriceInfo.price - reportedPrice;
            if (reportedPrice < mostGovernedPriceInfo.price) {
                governedPrice = actualPriceVariance < allowedPriceVariance ? reportedPrice : mostGovernedPriceInfo.price - allowedPriceVariance;
            } else {
                governedPrice = actualPriceVariance < allowedPriceVariance ? reportedPrice : mostGovernedPriceInfo.price + allowedPriceVariance;
            }
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
        uint256 accumLogsLength = longTWAPaccumLogs[token].length;
        
        if (accumLogsLength < 1) {
            return 0;
        }

        AccumLog memory lastLog = longTWAPaccumLogs[token][_accumLogOldestIndex];

        uint256 lastLogAge = currentTime - lastLog.timestamp;
        if (lastLogAge <= logMaturingAge || lastLogAge > longTWAPperiod) {
            return 0;
        }

        GovernedPrice memory mostAccumLogPrice = mostAccumLogGovernedPrice[token];
        AccumLog memory mostLog = mostRecentAccumLog[token];
        AccumLog memory currentLog;

        if (currentTime == mostAccumLogPrice.timestamp) {
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
     * @dev Update the accumLog index with the oldest age not older than longTWAPPeriod.
     * @param token The address of the token.
     */
    function _updateAccumLogOldestIndex(address token) internal {
        uint256 accumLogsLength = longTWAPaccumLogs[token].length;
        uint256 newestLogAge = block.timestamp - longTWAPaccumLogs[token][accumLogsLength - 1].timestamp;
            
        if (newestLogAge >= longTWAPperiod) {
            _accumLogOldestIndex = accumLogsLength - 1;
        } else {
            for (uint256 i = _accumLogOldestIndex; i < accumLogsLength; i++) {
                uint256 accumLogAge = block.timestamp - longTWAPaccumLogs[token][i].timestamp;
                if (accumLogAge > longTWAPperiod) {
                    continue;
                } else {
                    _accumLogOldestIndex = i;
                    break;
                }
            }
        }
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
