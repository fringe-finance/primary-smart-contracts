// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./PriceProvider.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC4626Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * @title FeelessERC4626PriceProvider
 * @notice This smart contract provides functionality for obtaining the price of a Vault ERC-4626 token in USD.
 * The price is calculated based on the amount of assets obtained by converting one Vault ERC-4626 token using the `convertToAssets` function.
 */
contract FeelessERC4626PriceProvider is PriceProvider, Initializable, AccessControlUpgradeable {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    uint8 public usdDecimals;

    mapping(address => VaultMetadata) public vaultMetadata; // address of token => metadata of vault

    struct VaultMetadata {
        bool isActive;
        address asset;
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
     * @dev Emitted when the Vault ERC-4626 token and its corresponding price provider are set.
     * @param token The address of the Vault ERC-4626 token.
     * @param asset The address of underlying token.
     * @param priceProvider The address of the price provider contract.
     */
    event SetVaultTokenAndProvider(address indexed token, address indexed asset, address indexed priceProvider);

    /**
     * @dev Emitted when the active status of a token changes.
     * @param token The address of the token whose active status has changed.
     * @param active The new active status of the token.
     */
    event ChangeActive(address indexed token, bool active);

    /**
     * @dev Initializes the LPPriceProvider contract by setting up the access control roles and the number of decimals for the USD price.
     */
    function initialize() public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        usdDecimals = 6;
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
     * @dev Sets the Vault ERC-4626 token and price provider for the underlying asset.
     *
     * Requirements:
     * - `vaultToken` cannot be the zero address.
     * - `provider` cannot be the zero address.
     * - Only the moderator can call this function.
     * @param vaultToken The address of the Vault ERC-4626 token.
     * @param provider The address of the price provider for the underlying asset.
     */
    function setVaultTokenAndProvider(address vaultToken, address provider) public onlyModerator {
        require(vaultToken != address(0), "FeelessERC4626PriceProvider: Invalid token");
        require(provider != address(0), "FeelessERC4626PriceProvider: Invalid priceProvider");
        VaultMetadata storage metadata = vaultMetadata[vaultToken];
        metadata.isActive = true;
        metadata.asset = IERC4626Upgradeable(vaultToken).asset();
        metadata.base = provider;
        emit SetVaultTokenAndProvider(vaultToken, metadata.asset, provider);
    }

    /**
     * @dev Changes the active status of a token in the FeelessERC4626PriceProvider contract.
     *
     * Requirements:
     * - The token must be listed in the contract.
     * - Only the moderator can call this function.
     * @param token The address of the token to change the active status for.
     * @param active The new active status of the token.
     */
    function changeActive(address token, bool active) public override onlyModerator {
        require(vaultMetadata[token].base != address(0), "FeelessERC4626PriceProvider: Token is not listed!");
        vaultMetadata[token].isActive = active;
        emit ChangeActive(token, active);
    }

    /****************** View functions ****************** */

    /**
     * @dev Checks if a token is listed in the FeelessERC4626PriceProvider.
     * @param token The address of the token to check.
     * @return A boolean indicating whether the token is listed or not.
     */
    function isListed(address token) public view override returns (bool) {
        if (vaultMetadata[token].base != address(0)) {
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
        return vaultMetadata[token].isActive;
    }

    /**
     * @dev Returns the price of the given Vault ERC-4626 token in USD.
     * * Requirements:
     * - The token must be listed in the contract.
     * - The token must be available in the contract.
     * @param token The address of the Vault ERC-4626 token.
     * @return priceMantissa The price of the Vault ERC-4626 token in USD, represented as a mantissa.
     * @return priceDecimals The number of decimals in the price of the Vault ERC-4626 token in USD.
     */
    function getPrice(address token) public view override returns (uint256 priceMantissa, uint8 priceDecimals) {
        VaultMetadata memory metadata = vaultMetadata[token];
        
        require(metadata.base != address(0), "FeelessERC4626PriceProvider: Token is not listed!");
        require(metadata.isActive, "FeelessERC4626PriceProvider: Token is not available!");
        
        uint256 oneVaultToken = 10 ** IERC4626Upgradeable(token).decimals();
        uint256 assetsAmount = IERC4626Upgradeable(token).convertToAssets(oneVaultToken);

        priceMantissa = PriceProvider(metadata.base).getEvaluation(metadata.asset, assetsAmount);

        uint8 assetPriceDecimals = PriceProvider(metadata.base).getPriceDecimals();
        
        if (assetPriceDecimals >= usdDecimals) {
            priceMantissa /= 10 ** (assetPriceDecimals - usdDecimals);
        } else {
            priceMantissa *= 10 ** (usdDecimals - assetPriceDecimals);
        }
        priceDecimals = usdDecimals;
    }

    /**
     * @dev Returns the evaluation of a given amount of Vault ERC-4626 token in USD.
     * @param token The address of the Vault ERC-4626 token.
     * @param tokenAmount The amount of Vault ERC-4626 tokens to evaluate.
     * @return evaluation The evaluation of the given amount of Vault ERC-4626 token in USD.
     */
    function getEvaluation(address token, uint256 tokenAmount) public view override returns (uint256 evaluation) {
        (uint256 priceMantissa, uint8 priceDecimals) = getPrice(token);
        evaluation = (tokenAmount * priceMantissa);
        uint8 tokenDecimals = IERC4626Upgradeable(token).decimals();
        if (tokenDecimals >= usdDecimals) {
            evaluation = evaluation / (10 ** (tokenDecimals - usdDecimals)); //get the evaluation in USD.
        } else {
            evaluation = evaluation * (10 ** (usdDecimals - tokenDecimals));
        }
        evaluation /= 10 ** (priceDecimals); // get the evaluation scaled by 10**tokenDecimals
    }

    /**
     * @dev Returns the number of decimals used for the price provided by this contract.
     * @return The number of decimals used for the price provided by this contract.
     */
    function getPriceDecimals() public view override returns (uint8) {
        return usdDecimals;
    }
}