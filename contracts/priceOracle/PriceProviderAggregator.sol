// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./priceproviders/PriceProvider.sol";
import "../interfaces/IPriceOracle.sol";

/**
 * @title PriceProviderAggregator
 * @notice The PriceProviderAggregator contract is the contract that provides the functionality of getting the latest price from different price providers.
 * @dev Contract that provides the functionality of getting the latest price from different price providers.
 */
contract PriceProviderAggregator is Initializable, AccessControlUpgradeable {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    uint8 public usdDecimals;

    IPriceOracle public priceOracle;

    /**
     * @notice Employ TWAP price processing or non-TWAP price processing.
     * Mapping address of token => enabled TWAP for this token.
     */
    mapping(address => bool) public twapEnabledForAsset;

    mapping(address => PriceProviderInfo) public tokenPriceProvider; // address of project token => priceProvider address

    struct PriceProviderInfo {
        address priceProvider;
        uint8 priceDecimals;
    }

    /**
     * @dev Emitted when the moderator role is granted to a new account.
     * @param newModerator The address to which moderator role is granted.
     */
    event GrantModeratorRole(address indexed newModerator);

    /**
     * @dev Emitted when the moderator role is revoked from an account.
     * @param moderator The address from which moderator role is revoked.
     */
    event RevokeModeratorRole(address indexed moderator);

    /**
     * @dev Emitted when the price provider is set to a token.
     * @param token The address of the token whose price provider is set.
     * @param priceProvider The address of the price provider.
     */
    event SetTokenAndPriceProvider(address indexed token, address indexed priceProvider, uint8 indexed priceDecimals);

    /**
     * @dev Emitted when the priceOracle is set.
     * @param priceOracle The address of priceOracle contract.
     */
    event SetPriceOracle(address indexed priceOracle);

    /**
     * @dev Emitted when the asset is flagged as employ TWAP price processing or not.
     * @param token The address of asset.
     * @param isEnable Employ TWAP price processing is TRUE or FALSE.
     */
    event SetTwapEnabledForAsset(address indexed token, bool isEnable);

    /**
     * @dev Emitted when the active status of a token changes.
     * @param token The address of the token whose active status has changed.
     * @param active The new active status of the token.
     */
    event ChangeActive(address indexed priceProvider, address indexed token, bool active);

    /**
     * @dev Initializes the contract by setting up the access control roles and assigning the default and moderator roles to the contract deployer.
     * @notice This function should only be called once during contract deployment.
     */
    function initialize() public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        usdDecimals = 6;
    }

    
    /**
     * @dev Modifier to check if the caller has the DEFAULT_ADMIN_ROLE.
     */
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the Admin");
        _;
    }

    /**
     * @dev Modifier to check if the caller has the MODERATOR_ROLE.
     */
    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "Caller is not the Moderator");
        _;
    }

    /****************** Admin functions ****************** */

    /**
     * @dev Grants the moderator role to a new address.
     * @param newModerator The address of the new moderator.
     */
    function grantModerator(address newModerator) public onlyAdmin {
        grantRole(MODERATOR_ROLE, newModerator);
        emit GrantModeratorRole(newModerator);
    }

    /**
     * @dev Revokes the moderator role from an address.
     * @param moderator The address of the moderator to be revoked.
     */
    function revokeModerator(address moderator) public onlyAdmin {
        revokeRole(MODERATOR_ROLE, moderator);
        emit RevokeModeratorRole(moderator);
    }

    /****************** end Admin functions ****************** */

    /****************** Moderator functions ****************** */

    /**
     * @dev Sets price provider to `token` and its corresponding price provider.
     *
     * Requirements:
     * - The caller must be the moderator.
     * - `token` cannot be the zero address.
     * - `priceProvider` cannot be the zero address.
     * @param token the address of token.
     * @param priceProvider the address of price provider. Should implement the interface of `PriceProvider`.
     * @param priceDecimals the decimals of token price.
     */
    function setTokenAndPriceProvider(address token, address priceProvider, uint8 priceDecimals) public onlyModerator {
        require(token != address(0), "PriceProviderAggregator: Invalid token");
        require(priceProvider != address(0), "PriceProviderAggregator: Invalid priceProvider");
        PriceProviderInfo storage priceProviderInfo = tokenPriceProvider[token];
        priceProviderInfo.priceProvider = priceProvider;
        if (priceProviderInfo.priceDecimals == 0) {
            priceProviderInfo.priceDecimals = priceDecimals;
        }
        emit SetTokenAndPriceProvider(token, priceProvider, priceProviderInfo.priceDecimals);
    }

    /**
     * @dev Sets new priceOracle contract.
     * Requirements:
     * - The caller must be the moderator.
     * - `newPriceOracle` cannot be the zero address.
     * @param newPriceOracle The address of new PriceOracle contract.
     */
    function setPriceOracle(address newPriceOracle) external onlyModerator {
        require(newPriceOracle != address(0), "PriceProviderAggregator: invalid priceOracle");
        priceOracle = IPriceOracle(newPriceOracle);
        emit SetPriceOracle(newPriceOracle);
    }

    /**
     * @dev Sets TWAP enabled state for `token`
     * Requirements:
     *  The caller must be the moderator.
     * - `token` cannot be the zero address.
     * @param token the address of token
     * @param enabled the new TWAP enabled state
     */
    function setTwapEnabledForAsset(address token, bool enabled) external onlyModerator {
        require(token != address(0), "PriceProviderAggregatorV2: invalid address");
        twapEnabledForAsset[token] = enabled;
        emit SetTwapEnabledForAsset(token, enabled);
    }

    /**
     * @dev Allows the moderator to change the active status of a price provider for a specific token.
     *
     * Requirements:
     * - The caller must be the moderator.
     * - The token's current price provider must match the provided price provider address.
     * @param priceProvider The address of the price provider to change the active status for.
     * @param token The address of the token to change the active status for.
     * @param active The new active status to set for the price provider.
     */
    function changeActive(address priceProvider, address token, bool active) public onlyModerator {
        require(tokenPriceProvider[token].priceProvider == priceProvider, "PriceProviderAggregator: Mismatch token`s price provider");
        PriceProvider(priceProvider).changeActive(token, active);
        emit ChangeActive(priceProvider, token, active);
    }

    /****************** main functions ****************** */

    /**
    * @dev Calculates and update multiple the final TWAP prices of a token.
    * @param token The token array needs to update the price.
    */
    function updateMultiFinalPrices(address[] memory token) external {
        for (uint256 i = 0; i < token.length; i++) {
            priceOracle.updateFinalPrices(token[i]);
        }
    }

    /**
     * @dev Returns the most recent TWAP price or non-TWAP price of a token.
     * 
     * Formula: price = priceMantissa / (10 ** priceDecimals)
     * @param token The address of the token.
     * @param useForLiquidate Flag to indicate whether the price is used for liquidation.
     * @return priceDecimals The decimals of the price.
     * @return timestamp The last updated timestamp of the price.
     * @return collateralPrice The collateral price of the token.
     * @return capitalPrice The capital price of the token.
     */
    function getPrice(address token, bool useForLiquidate) external view returns (uint8 priceDecimals, uint32 timestamp, uint256 collateralPrice, uint256 capitalPrice) {
        if (useForLiquidate) {
            return priceOracle.getNonTWAPprice(token);
        } else {
            return priceOracle.getMostTWAPprice(token);
        }
    }

    /**
     * @dev returns the most TWAP price or non-TWAP price in USD evaluation of token by its `tokenAmount`
     * @param token the address of token to evaluate
     * @param tokenAmount the amount of token to evaluate
     * @param useForLiquidate Flag to indicate whether the price is used for liquidation.
     * @return collateralEvaluation the USD evaluation of token by its `tokenAmount` in collateral price
     * @return capitalEvaluation the USD evaluation of token by its `tokenAmount` in capital price
     */
    function getEvaluation(address token, uint256 tokenAmount, bool useForLiquidate) external view returns(uint256 collateralEvaluation, uint256 capitalEvaluation){
        if (useForLiquidate) {
            return priceOracle.getNonTWAPEvaluation(token, tokenAmount);
        } else {
            return priceOracle.getEvaluation(token, tokenAmount);
        }
    }
}
