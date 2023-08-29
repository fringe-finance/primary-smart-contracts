// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./priceproviders/PriceProvider.sol";

/**
 * @title PriceProviderAggregator
 * @notice The PriceProviderAggregator contract is the contract that provides the functionality of getting the latest price from different price providers.
 * @dev Contract that provides the functionality of getting the latest price from different price providers.
 */
contract PriceProviderAggregator is Initializable, AccessControlUpgradeable {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    uint8 public usdDecimals;

    mapping(address => PriceProviderInfo) public tokenPriceProvider; // address of project token => priceProvider address

    struct PriceProviderInfo {
        address priceProvider;
        bool hasSignedFunction;
    }

    /**
     * @dev Emitted when the moderator role is granted to a new account.
     * @param newModerator The address to which moderator role is granted.
     */
    event GrandModeratorRole(address indexed newModerator);

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
    event SetTokenAndPriceProvider(address indexed token, address indexed priceProvider);

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
    function grandModerator(address newModerator) public onlyAdmin {
        grantRole(MODERATOR_ROLE, newModerator);
        emit GrandModeratorRole(newModerator);
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
     * @param hasFunctionWithSign true - if price provider has function with signatures.
     *                            false - if price provider does not have function with signatures.
     */
    function setTokenAndPriceProvider(address token, address priceProvider, bool hasFunctionWithSign) public onlyModerator {
        require(token != address(0), "PriceProviderAggregator: Invalid token");
        require(priceProvider != address(0), "PriceProviderAggregator: Invalid priceProvider");
        PriceProviderInfo storage priceProviderInfo = tokenPriceProvider[token];
        priceProviderInfo.priceProvider = priceProvider;
        priceProviderInfo.hasSignedFunction = hasFunctionWithSign;
        emit SetTokenAndPriceProvider(token, priceProvider);
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
     * @dev Returns the price of a given token.
     *
     * Formula: price = priceMantissa / (10 ** priceDecimals)
     * @param token The address of the token to get the price for.
     * @return priceMantissa The price of the token, represented as a mantissa.
     * @return priceDecimals The number of decimal places in the token's price.
     */
    function getPrice(address token) public view returns (uint256 priceMantissa, uint8 priceDecimals) {
        PriceProviderInfo memory priceProviderInfo = tokenPriceProvider[token];
        require(priceProviderInfo.hasSignedFunction == false, "PriceProviderAggregator: Call getPriceWithSign()");
        return PriceProvider(priceProviderInfo.priceProvider).getPrice(token);
    }

    /**
     * @dev Returns the tupple (priceMantissa, priceDecimals) of token multiplied by 10 ** priceDecimals given by price provider.
     * price can be calculated as  priceMantissa / (10 ** priceDecimals).
     * i.e. price = priceMantissa / (10 ** priceDecimals).
     * @param token The address of token.
     * @param priceMantissa The price of token (used in verifying the signature).
     * @param validTo The timestamp in seconds (used in verifying the signature).
     * @param signature The backend signature of secp256k1. length is 65 bytes.
     * @return priceMantissa_ The price of the token as a signed integer.
     * @return priceDecimals The number of decimals for the price.
     */
    function getPriceSigned(
        address token,
        uint256 priceMantissa,
        uint256 validTo,
        bytes memory signature
    ) public view returns (uint256 priceMantissa_, uint8 priceDecimals) {
        PriceProviderInfo memory priceProviderInfo = tokenPriceProvider[token];
        if (priceProviderInfo.hasSignedFunction) {
            return PriceProvider(priceProviderInfo.priceProvider).getPriceSigned(token, priceMantissa, validTo, signature);
        } else {
            return PriceProvider(priceProviderInfo.priceProvider).getPrice(token);
        }
    }

    /**
     * @dev Returns the evaluation of a given token amount based on the price provided by the registered price provider.
     * @param token The address of the token to evaluate.
     * @param tokenAmount The amount of tokens to evaluate.
     * @return evaluation The evaluation of the token amount.
     */
    function getEvaluation(address token, uint256 tokenAmount) public view returns (uint256 evaluation) {
        PriceProviderInfo memory priceProviderInfo = tokenPriceProvider[token];
        require(priceProviderInfo.hasSignedFunction == false, "PriceProviderAggregator: Call getEvaluationWithSign()");
        return PriceProvider(priceProviderInfo.priceProvider).getEvaluation(token, tokenAmount);
    }

    /**
     * @dev Returns the evaluation of a token based on its price and amount, using a price provider that may or may not require a signature.
     * @param token The address of the token to evaluate.
     * @param tokenAmount The amount of tokens to evaluate.
     * @param priceMantissa The price mantissa of the token.
     * @param validTo The timestamp until which the evaluation is valid.
     * @param signature The signature required by the price provider, if any.
     * @return evaluation The evaluation of the token.
     */
    function getEvaluationSigned(
        address token,
        uint256 tokenAmount,
        uint256 priceMantissa,
        uint256 validTo,
        bytes memory signature
    ) public view returns (uint256 evaluation) {
        PriceProviderInfo memory priceProviderInfo = tokenPriceProvider[token];
        if (priceProviderInfo.hasSignedFunction) {
            return PriceProvider(priceProviderInfo.priceProvider).getEvaluationSigned(token, tokenAmount, priceMantissa, validTo, signature);
        } else {
            return PriceProvider(priceProviderInfo.priceProvider).getEvaluation(token, tokenAmount);
        }
    }
}
