// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20MetadataUpgradeable.sol";
import "../interfaces/IPriceProviderAggregator.sol";
import "./priceproviders/PriceProvider.sol";

contract PriceOracle is Initializable, AccessControlUpgradeable {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    IPriceProviderAggregator public priceProviderAggregator;

    uint16 public constant PERCENTAGE_DECIMALS = 10000;

    uint16 public constant SECONDS_PER_HOUR = 1 hours;

    uint8 public usdDecimals;

    /**
     * @notice The up time-based volatility cap (TVC-up) in percentage.
     */
    uint16 public tvcUp;

    /**
     * @notice The down time-based volatility cap (TVC-down) in percentage.
     */
    uint16 public tvcDown;

    /**
     * @notice Used in volatility cap rule calculations.
     * Mapping address of token => GovernedPrice
     */
    mapping(address => GovernedPrice) public mostGovernedPrice;

    /**
     * @notice The final price after update price by calcFinalPrices function.
     * Mapping address of token => PriceInfo.
     */
    mapping(address => PriceInfo) public priceInfo;

    struct GovernedPrice {
        uint64 timestamp;
        uint256 collateralPrice;
        uint256 capitalPrice;
    }

    struct PriceInfo {
        uint64 timestamp;
        uint256 collateralPrice;
        uint256 capitalPrice;
    }

    /**
     * @dev Emitted when the price of a token is updated.
     * @param token The address of the token.
     */
    event PriceUpdated(address indexed token, uint64 currentTime, uint256 twapCollateralPrice, uint256 twapCapitalPrice);

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
     * @param tvcUp The new tvcUp value.
     * @param tvcDown The new tvcDown value.
     */
    event SetVolatilityCapFixedPercent(uint16 tvcUp, uint16 tvcDown);

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
     * @param _tvcUp The tvcUp value.
     * @param _tvcDown The tvcDown value.
     */
    function initialize(address _priceProviderAggregator, uint16 _tvcUp, uint16 _tvcDown) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);

        usdDecimals = 6;
        priceProviderAggregator = IPriceProviderAggregator(_priceProviderAggregator);
        tvcUp = _tvcUp;
        tvcDown = _tvcDown;
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
     * @param _tvcUp The new tvcUp value
     * @param _tvcDown The new tvcDown value
     */
    function setVolatilityCapFixedPercent(uint16 _tvcUp, uint16 _tvcDown) external onlyModerator {
        require(_tvcUp <= PERCENTAGE_DECIMALS && _tvcDown <= PERCENTAGE_DECIMALS, "PriceOracle: invalid volatilityCapFixedPercent");
        tvcUp = _tvcUp;
        tvcDown = _tvcDown;
        emit SetVolatilityCapFixedPercent(_tvcUp, _tvcDown);
    }

    /****************** end Moderator functions ****************** */

    /****************** Main functions ****************** */

    /**
     * @dev Calculates the final TWAP prices of a token.
     * @param token The address of the token.
     */
    function updateFinalPrices(address token) external {
        uint256 reportedPrice = getReportedPrice(token);
        GovernedPrice memory governedPrice = _applyVolatilityCap(token, reportedPrice, uint64(block.timestamp));
        priceInfo[token] = PriceInfo({
            timestamp: governedPrice.timestamp,
            collateralPrice: governedPrice.collateralPrice,
            capitalPrice: governedPrice.capitalPrice
        });

        emit PriceUpdated(token, governedPrice.timestamp, governedPrice.collateralPrice, governedPrice.capitalPrice);
    }

    /**
     * @dev returns tuple (priceMantissa, priceDecimals) after update price.
     * @notice price = priceMantissa / (10 ** priceDecimals)
     * @param token the address of token which price is to return
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function getUpdatedReportedPrice(address token, bytes32[] memory priceIds, bytes[] memory updateData) external payable returns (uint256) {
        priceProviderAggregator.updatePrices{value: msg.value}(priceIds, updateData);
        return getReportedPrice(token);
    }

    /**
     * @dev Returns the most recent TWAP price of a token.
     * @param token The address of the token.
     * @return priceDecimals The decimals of the price.
     * @return timestamp The last updated timestamp of the price.
     * @return collateralPrice The collateral price of the token.
     * @return capitalPrice The capital price of the token.
     */
    function getMostTWAPprice(
        address token
    ) external view returns (uint8 priceDecimals, uint64 timestamp, uint256 collateralPrice, uint256 capitalPrice) {
        PriceInfo memory info = priceInfo[token];
        return (getTokenPriceDecimals(token), info.timestamp, info.collateralPrice, info.capitalPrice);
    }

    /**
     * @dev Returns the non-TWAP price of a token.
     * @param token The address of the token.
     * @return priceDecimals The decimals of the price.
     * @return timestamp The last updated timestamp of the price.
     * @return collateralPrice The collateral price of the token.
     * @return capitalPrice The capital price of the token.
     */
    function getEstimatedTWAPprice(
        address token
    ) public view returns (uint8 priceDecimals, uint64 timestamp, uint256 collateralPrice, uint256 capitalPrice) {
        uint256 reportedPrice = getReportedPrice(token);
        GovernedPrice memory governedPrice = _calcGovernedPrice(mostGovernedPrice[token], reportedPrice, uint64(block.timestamp));
        return (getTokenPriceDecimals(token), governedPrice.timestamp, governedPrice.collateralPrice, governedPrice.capitalPrice);
    }

    /**
     * @dev Returns the decimals price of the token.
     * @param token The address of the token.
     * @return priceDecimals The decimals price of the token.
     */
    function getTokenPriceDecimals(address token) public view returns (uint8 priceDecimals) {
        return priceProviderAggregator.tokenPriceProvider(token).priceDecimals;
    }

    /**
     * @dev returns the most TWAP price in USD evaluation of token by its `tokenAmount`
     * @param token the address of token to evaluate
     * @param tokenAmount the amount of token to evaluate
     * @return collateralEvaluation the USD evaluation of token by its `tokenAmount` in collateral price
     * @return capitalEvaluation the USD evaluation of token by its `tokenAmount` in capital price
     */
    function getEvaluation(address token, uint256 tokenAmount) external view returns (uint256 collateralEvaluation, uint256 capitalEvaluation) {
        PriceInfo memory info = priceInfo[token];
        uint8 priceDecimals = getTokenPriceDecimals(token);
        collateralEvaluation = _calEvaluation(token, tokenAmount, info.collateralPrice, priceDecimals);
        capitalEvaluation = _calEvaluation(token, tokenAmount, info.capitalPrice, priceDecimals);
    }

    /**
     * @dev returns the estimated-TWAP price in USD evaluation of token by its `tokenAmount`
     * @param token the address of token to evaluate
     * @param tokenAmount the amount of token to evaluate
     * @return collateralEvaluation the USD evaluation of token by its `tokenAmount` in collateral price
     * @return capitalEvaluation the USD evaluation of token by its `tokenAmount` in capital price
     */
    function getEstimatedEvaluation(
        address token,
        uint256 tokenAmount
    ) external view returns (uint256 collateralEvaluation, uint256 capitalEvaluation) {
        (uint8 priceDecimals, , uint256 collateralPrice, uint256 capitalPrice) = getEstimatedTWAPprice(token);
        collateralEvaluation = _calEvaluation(token, tokenAmount, collateralPrice, priceDecimals);
        capitalEvaluation = _calEvaluation(token, tokenAmount, capitalPrice, priceDecimals);
    }

    /**
     * @dev returns tuple (priceMantissa, priceDecimals)
     * @notice price = priceMantissa / (10 ** priceDecimals)
     * @param token the address of token which price is to return
     */
    function getReportedPrice(address token) public view returns (uint256 priceMantissa) {
        (uint256 reportedPrice, uint8 priceDecimals) = PriceProvider(priceProviderAggregator.tokenPriceProvider(token).priceProvider).getPrice(token);
        uint8 calculatedPriceDecimals = getTokenPriceDecimals(token);
        priceMantissa = priceDecimals >= calculatedPriceDecimals
            ? reportedPrice / (10 ** (priceDecimals - calculatedPriceDecimals))
            : reportedPrice * (10 ** (calculatedPriceDecimals - priceDecimals));
    }

    /**
     * @dev returns the USD evaluation of token by its `tokenAmount`
     * @param token the address of token to evaluate
     * @param tokenAmount the amount of token to evaluate
     * @param price the price of token
     * @param priceDecimals the decimals of price
     */
    function _calEvaluation(address token, uint256 tokenAmount, uint256 price, uint8 priceDecimals) private view returns (uint256 evaluation) {
        evaluation = (tokenAmount * price) / (10 ** priceDecimals);
        uint8 tokenDecimals = IERC20MetadataUpgradeable(token).decimals();
        if (tokenDecimals >= usdDecimals) {
            evaluation = evaluation / (10 ** (tokenDecimals - usdDecimals));
        } else {
            evaluation = evaluation * (10 ** (usdDecimals - tokenDecimals));
        }
    }

    /**
     * @dev Applies the volatility cap rule to a token's price.
     * @param token The address of the token.
     * @param reportedPrice The reported price of the token.
     * @param currentTime The current time.
     * @return governedPrice The governed price of the token.
     */
    function _applyVolatilityCap(address token, uint256 reportedPrice, uint64 currentTime) internal returns (GovernedPrice memory governedPrice) {
        governedPrice = _calcGovernedPrice(mostGovernedPrice[token], reportedPrice, currentTime);
        mostGovernedPrice[token] = governedPrice;
    }

    /**
     * @notice Calculates the governed price of the token based on the most recent governed price, reported price, and current time.
     * @param mostGovernedPriceInfo The most recent governed price.
     * @param reportedPrice The reported price of the token.
     * @param currentTime The current time.
     * @return governedPrice The governed price of the token.
     */
    function _calcGovernedPrice(
        GovernedPrice memory mostGovernedPriceInfo,
        uint256 reportedPrice,
        uint64 currentTime
    ) internal view returns (GovernedPrice memory governedPrice) {
        if (mostGovernedPriceInfo.timestamp == 0) {
            governedPrice = GovernedPrice({timestamp: currentTime, collateralPrice: reportedPrice, capitalPrice: reportedPrice});
        } else {
            uint256 deltaSeconds = (currentTime - mostGovernedPriceInfo.timestamp);
            governedPrice = GovernedPrice({
                timestamp: currentTime,
                collateralPrice: _applyTimeBasedVolatilityCap(reportedPrice, mostGovernedPriceInfo.collateralPrice, deltaSeconds, true),
                capitalPrice: _applyTimeBasedVolatilityCap(reportedPrice, mostGovernedPriceInfo.capitalPrice, deltaSeconds, false)
            });
        }
    }

    /**
     * @dev Applies the time-based volatility cap rule to a token's price.
     * @param reportedPrice The reported price of the token.
     * @param governedPrice The governed price of the token.
     * @param deltaSeconds The time difference between the current time and the last update time.
     * @param isCollateral A boolean indicating whether the price is collateral or capital.
     * @return calculatedPrice The calculated price of the token.
     */
    function _applyTimeBasedVolatilityCap(
        uint256 reportedPrice,
        uint256 governedPrice,
        uint256 deltaSeconds,
        bool isCollateral
    ) private view returns (uint256 calculatedPrice) {
        uint256 allowedPriceVarianceUp = isCollateral
            ? (governedPrice * tvcUp * deltaSeconds) / SECONDS_PER_HOUR / PERCENTAGE_DECIMALS
            : (governedPrice * tvcDown * deltaSeconds) / SECONDS_PER_HOUR / PERCENTAGE_DECIMALS;

        uint256 allowedPriceVarianceDown = isCollateral
            ? (governedPrice * tvcDown * deltaSeconds) / SECONDS_PER_HOUR / PERCENTAGE_DECIMALS
            : (governedPrice * tvcUp * deltaSeconds) / SECONDS_PER_HOUR / PERCENTAGE_DECIMALS;

        uint256 actualCollateralPriceVariance = reportedPrice > governedPrice ? reportedPrice - governedPrice : governedPrice - reportedPrice;

        if (reportedPrice < governedPrice) {
            calculatedPrice = actualCollateralPriceVariance < allowedPriceVarianceDown ? reportedPrice : governedPrice - allowedPriceVarianceDown;
        } else {
            calculatedPrice = actualCollateralPriceVariance < allowedPriceVarianceUp ? reportedPrice : governedPrice + allowedPriceVarianceUp;
        }
    }
}
