// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../../util/HomoraMath.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC4626Upgradeable.sol";
import "./PriceProvider.sol";
import "../../interfaces/IPriceProviderAggregator.sol";

/**
 * @title ERC4626PriceProvider
 * @notice The ERC4626PriceProvider contract is the contract that provides the functionality of getting the latest price from ERC-4626 tokens.
 * @dev Contract that provides the functionality of getting the latest price from ERC-4626 tokens. Inherit from PriceProvider.
 */
contract ERC4626PriceProvider is PriceProvider, Initializable, AccessControlUpgradeable {
    using SafeMathUpgradeable for uint256;
    using HomoraMath for uint256;
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    uint8 public tokenDecimals;

    mapping(address => ERC4626Metadata) public erc4626Metadata;

    struct ERC4626Metadata {
        bool isActive;
        address base;
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
     * @dev Emitted when the ERC-4626P token and its corresponding price provider are set.
     * @param token The address of the ERC-4626 token.
     * @param priceProvider The address of the price provider contract.
     */
    event SetERC4626TokenAndPriceProvider(address indexed token, address indexed priceProvider);

    /**
     * @dev Emitted when the active status of a token changes.
     * @param token The address of the token whose active status has changed.
     * @param active The new active status of the token.
     */
    event ChangeActive(address indexed token, bool active);

    /**
     * @dev Emitted when the token decimals is set.
     * @param newTokenDecimals The new token decimals.
     */
    event SetTokenDecimals(uint8 newTokenDecimals);

    /**
     * @dev Initializes the LPPriceProvider contract by setting up the access control roles and the number of decimals for the USD price.
     */
    function initialize() public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        tokenDecimals = 10;
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
        require(hasRole(MODERATOR_ROLE, msg.sender), "Caller is not the Moderator");
        _;
    }

    /****************** Admin functions ****************** */

    /**
     * @dev Grants the MODERATOR_ROLE to a new address.
     * Caller must be the admin.
     * @param newModerator The address to grant the role to.
     */
    function grantModerator(address newModerator) public onlyAdmin {
        grantRole(MODERATOR_ROLE, newModerator);
        emit GrantModeratorRole(newModerator);
    }

    /**
     * @dev Revokes the MODERATOR_ROLE from an address.
     * Caller must be the admin.
     * @param moderator The address to revoke the role from.
     */
    function revokeModerator(address moderator) public onlyAdmin {
        revokeRole(MODERATOR_ROLE, moderator);
        emit RevokeModeratorRole(moderator);
    }

    /****************** end Admin functions ****************** */

    /****************** Moderator functions ****************** */

    /**
     * @dev Sets the number of decimals used by the token.
     * Only the moderator can call this function.
     * @param newTokenDecimals The new number of decimals used by the token.
     */
    function setTokenDecimals(uint8 newTokenDecimals) public onlyModerator {
        tokenDecimals = newTokenDecimals;
        emit SetTokenDecimals(newTokenDecimals);
    }

    /**
     * @dev Sets the ERC-4626 token and price provider for the given LP token address.
     *
     * Requirements:
     * - `erc4626Token` cannot be the zero address.
     * - `provider` cannot be the zero address.
     * @param erc4626Token The address of the ERC-4626 token.
     * @param provider The address of the price provider.
     */
    function setERC4626TokenAndProvider(address erc4626Token, address provider) public onlyModerator {
        require(erc4626Token != address(0), "USBPriceOracle: Invalid token");
        require(provider != address(0), "USBPriceOracle: Invalid priceProvider");
        ERC4626Metadata storage metadata = erc4626Metadata[erc4626Token];
        metadata.isActive = true;
        metadata.base = provider;
        emit SetERC4626TokenAndPriceProvider(erc4626Token, provider);
    }

    /**
     * @dev Changes the active status of a token in the ERC4626PriceProvider contract.
     *
     * Requirements:
     * - The token must be listed in the contract.
     * - Only the contract moderator can call this function.
     * @param token The address of the token to change the active status for.
     * @param active The new active status of the token.
     */
    function changeActive(address token, bool active) public override onlyModerator {
        require(erc4626Metadata[token].base != address(0), "USBPriceOracle: Token is not listed!");
        erc4626Metadata[token].isActive = active;
        emit ChangeActive(token, active);
    }

    /****************** View functions ****************** */

    /**
     * @dev Checks if a token is listed in the ERC4626PriceProvider.
     * @param token The address of the token to check.
     * @return A boolean indicating whether the token is listed or not.
     */
    function isListed(address token) public view override returns (bool) {
        if (erc4626Metadata[token].base != address(0)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Returns whether a token is active or not.
     * @param token The address of the token to check.
     * @return A boolean indicating whether the token is active or not.
     */
    function isActive(address token) public view override returns (bool) {
        return erc4626Metadata[token].isActive;
    }

    /**
     * @dev Converts the given price to USD.
     * @param priceBase The address of the price provider.
     * @param token The address of the token to convert.
     * @return The price of the token in USD, represented as a mantissa.
     */
     function _convertToUSD(address priceBase, address token) internal view returns (uint256) {
        address priceProvider = IPriceProviderAggregator(priceBase).tokenPriceProvider(token);
        (uint256 priceMantissa, uint8 priceDecimals) = PriceProvider(priceProvider).getPrice(token);
        uint8 decimals = ERC20Upgradeable(token).decimals();
        priceMantissa = decimals + priceDecimals >= tokenDecimals
            ? priceMantissa.mul(uint256(2 ** 112)) / (10 ** (decimals + priceDecimals - tokenDecimals))
            : priceMantissa.mul(uint256(2 ** 112)) * (10 ** (tokenDecimals - decimals - priceDecimals));
        return priceMantissa;
    }

    /**
     * @dev Returns the price of the given ERC-4626 token in USD.
     * @param erc4626Token The address of the ERC-4626 token.
     * @return priceMantissa The price of the ERC-4626 token in USD, represented as a mantissa.
     * @return priceDecimals The number of decimals in the price of the ERC-4626 token in USD.
     */
    function getPrice(address erc4626Token) public view override returns (uint256 priceMantissa, uint8 priceDecimals) {
        uint8 decimals = IERC4626Upgradeable(erc4626Token).decimals();
        address assetToken = IERC4626Upgradeable(erc4626Token).asset();
        uint256 assets = IERC4626Upgradeable(erc4626Token).convertToAssets(10**decimals);
        ERC4626Metadata memory metadata = erc4626Metadata[erc4626Token];
        uint256 price = _convertToUSD(metadata.base, assetToken);
        priceMantissa = price.mul(assets).div(2**112);
        priceDecimals = tokenDecimals;
    }

    /**
     * @dev Returns the evaluation of a given amount of ERC-4626 tokens in USD.
     * @param erc4626Token The address of the ERC-4626 token.
     * @param tokenAmount The amount of ERC-4626 tokens to evaluate.
     * @return evaluation The evaluation of the given amount of ERC-4626 tokens in USD.
     */
    function getEvaluation(address erc4626Token, uint256 tokenAmount) public view override returns (uint256 evaluation) {
        (uint256 priceMantissa, uint8 priceDecimals) = getPrice(erc4626Token);
        evaluation = (tokenAmount * priceMantissa) / 10 ** (priceDecimals); // get the evaluation scaled by 10**tokenDecimals
        uint8 decimals = IERC4626Upgradeable(erc4626Token).decimals();
        if (decimals >= tokenDecimals) {
            evaluation = evaluation / (10 ** (decimals - tokenDecimals)); //get the evaluation in USD.
        } else {
            evaluation = evaluation * (10 ** (tokenDecimals - decimals));
        }
    }

    /**
     * @dev Returns the number of decimals used for the price provided by this contract.
     * @return The number of decimals used for the price provided by this contract.
     */
    function getPriceDecimals() public view override returns (uint8) {
        return tokenDecimals;
    }
}
