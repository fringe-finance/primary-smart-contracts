// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./PriceProvider.sol";
import "./uniswapV2/IUniswapV2Pair.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * @title UniswapV2 price provider
 * @dev This implementation can be affected by price manipulation due to not using TWAP.
 * For development purposes only
 */
contract UniswapV2PriceProvider is PriceProvider, Initializable, AccessControlUpgradeable {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string public constant DESCRIPTION = "Price provider that uses uniswapV2";

    uint8 public usdDecimals;

    mapping(address => UniswapV2Metadata) public uniswapV2Metadata; // address of token => metadata for uniswapV2

    struct UniswapV2Metadata {
        bool isActive;
        address pair; // address of uniswap liquidity pool token for pair
        address pairAsset; // address of second token in pair with token
        uint8 tokenDecimals; // decimals of project token
        uint8 pairAssetDecimals; // decimals of second token in pair with token
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
     * @dev Emitted when the token and pair addresses are set for the UniswapV2PriceProvider contract.
     * @param token The address of the token that is set.
     * @param pair The address of the pair that is set.
     */
    event SetTokenAndPair(address indexed token, address indexed pair);
    
    /**
     * @dev Emitted when the active status of a token changes.
     * @param token The address of the token whose active status has changed.
     * @param active The new active status of the token.
     */
    event ChangeActive(address indexed token, bool active);

    /**
     * @dev Initializes the contract by setting up the access control roles and the number of decimals for the USD token.
     */
    function initialize() public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        usdDecimals = 6;
    }

    /**
     * @dev Modifier to restrict access to functions to only the contract admin.
     */
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the Admin");
        _;
    }

    /**
     * @dev Modifier to restrict access to functions to only the contract moderator.
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

    /****************** Moderator functions ****************** */

    /**
     * @dev Sets the token and pair addresses for the UniswapV2PriceProvider contract.
     *
     * Requirements:
     * - `token` and `pair` addresses must not be zero.
     * - Only the contract moderator can call this function.
     * - The `token` and `pair` addresses must be valid.
     * - The `metadata` struct for the `token` address must be updated with the `pair` address, `pairAsset` address, `tokenDecimals`, and `pairAssetDecimals`.
     * @param token The address of the token to be set.
     * @param pair The address of the pair to be set.
     */
    function setTokenAndPair(address token, address pair) public onlyModerator {
        require(token != address(0) && pair != address(0), "UniswapV2PriceProvider: Invalid token or pair!");
        UniswapV2Metadata storage metadata = uniswapV2Metadata[token];
        metadata.isActive = true;
        metadata.pair = pair;
        address pairAsset = IUniswapV2Pair(pair).token0();
        if (pairAsset == token) {
            pairAsset = IUniswapV2Pair(pair).token1();
        }
        metadata.pairAsset = pairAsset;
        metadata.tokenDecimals = ERC20Upgradeable(token).decimals();
        metadata.pairAssetDecimals = ERC20Upgradeable(pairAsset).decimals();
        emit SetTokenAndPair(token, pair);
    }

    /**
     * @dev Changes the active status of a token in the UniswapV2PriceProvider contract.
     *
     * Requirements:
     * - The token must be listed in the UniswapV2PriceProvider contract.
     * - Only the contract moderator can call this function.
     * @param token The address of the token to change the active status for.
     * @param active The new active status of the token.
     */
    function changeActive(address token, bool active) public override onlyModerator {
        require(uniswapV2Metadata[token].pair != address(0), "UniswapV2PriceProvider: Token is not listed!");
        uniswapV2Metadata[token].isActive = active;
        emit ChangeActive(token, active);
    }

    /****************** view functions ****************** */

    /**
     * @dev Check if a token is listed on UniswapV2.
     * @param token The address of the token to check.
     * @return A boolean indicating whether the token is listed or not.
     */
    function isListed(address token) public view override returns (bool) {
        if (uniswapV2Metadata[token].pair != address(0)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Returns whether the specified token is active or not.
     * @param token The address of the token to check.
     * @return A boolean indicating whether the token is active or not.
     */
    function isActive(address token) public view override returns (bool) {
        return uniswapV2Metadata[token].isActive;
    }

    /**
     * @dev Returns the price of a given token in pairAsset, and the number of decimals for the price.
     * @param token The address of the token to get the price for.
     * @return price The price of the token in pairAsset.
     * @return priceDecimals The number of decimals for the price.
     * @notice This function requires that the token is active in the price provider.
     */
    function getPrice(address token) public view override returns (uint256 price, uint8 priceDecimals) {
        UniswapV2Metadata memory uniswapV2metadata = uniswapV2Metadata[token];
        require(uniswapV2metadata.isActive, "UniswapV2PriceProvider: Token is not active");
        address uniswapPair = uniswapV2metadata.pair;
        address pairAsset = uniswapV2metadata.pairAsset;
        (uint256 tokenReserve, uint256 pairAssetReserve) = getReserves(uniswapPair, token, pairAsset);
        uint8 tokenDecimals = uniswapV2metadata.tokenDecimals;
        uint8 pairAssetDecimals = uniswapV2metadata.pairAssetDecimals;
        priceDecimals = 18;
        price = ((10 ** priceDecimals) * ((pairAssetReserve * 1e12) / (10 ** pairAssetDecimals))) / ((tokenReserve * 1e12) / (10 ** tokenDecimals));
    }

    /**
     * @dev Returns the evaluation of a given token amount in USD using the UniswapV2 price oracle.
     * @param token The address of the token to evaluate.
     * @param tokenAmount The amount of tokens to evaluate.
     * @return evaluation The evaluation of the token amount in USD.
     */
    function getEvaluation(address token, uint256 tokenAmount) public view override returns (uint256 evaluation) {
        (uint256 price, uint8 priceDecimals) = getPrice(token);
        evaluation = (tokenAmount * price) / (10 ** priceDecimals);
        uint8 tokenDecimals = uniswapV2Metadata[token].tokenDecimals;
        if (tokenDecimals >= usdDecimals) {
            evaluation = evaluation / (10 ** (tokenDecimals - usdDecimals)); //get the evaluation in USD.
        } else {
            evaluation = evaluation * (10 ** (usdDecimals - tokenDecimals));
        }
    }

    /**
     * @dev Returns the reserves of the specified Uniswap V2 pair for the given tokens.
     * @param uniswapPair The address of the Uniswap V2 pair.
     * @param tokenA The address of the first token.
     * @param tokenB The address of the second token.
     * @return reserveA The reserve of the first token.
     * @return reserveB The reserve of the second token.
     */
    function getReserves(address uniswapPair, address tokenA, address tokenB) public view returns (uint256 reserveA, uint256 reserveB) {
        (address token0, ) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA); //sort tokens
        (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(uniswapPair).getReserves(); //getting reserves
        (reserveA, reserveB) = (tokenA == token0) ? (reserve0, reserve1) : (reserve1, reserve0); //form the correct order of reserves
    }

    /**
     * @dev Returns the number of decimals used for the USD price.
     * @return The number of decimals used for the USD price.
     */
    function getPriceDecimals() public view override returns (uint8) {
        return usdDecimals;
    }
}
