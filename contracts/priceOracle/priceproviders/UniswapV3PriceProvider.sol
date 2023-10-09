// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./PriceProvider.sol";
import "./uniswapV3/v3-core/interfaces/IUniswapV3Pool.sol";
import "./uniswapV3/v3-periphery/libraries/OracleLibrary.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";


/**
 * @title UniswapV3 price provider
 */
contract UniswapV3PriceProvider is PriceProvider, Initializable, AccessControlUpgradeable {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string public constant DESCRIPTION = "Price provider that uses uniswapV3";

    uint8 public decimals;

    uint32 public pricePointTWAPperiod;

    mapping(address => UniswapV3Metadata) public uniswapV3Metadata; // address of token => metadata for uniswapV3

    struct UniswapV3Metadata {
        bool isActive;
        address pair;       // address of uniswap liquidity pool token for pair 
        address pairAsset;  // address of second token in pair with token
        uint8 tokenDecimals;  // decimals of project token
        uint8 pairAssetDecimals; // decimals of second token in pair with token
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
     * @dev Emitted when the token and pair addresses are set for the UniswapV3PriceProvider contract.
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
     *`decimals` is set to 18.
     **/
    function initialize() public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        decimals = 18;
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

    /****************** Moderator functions ****************** */

    /**
     * @dev Sets the token and pair addresses for the UniswapV3PriceProvider contract.
     * #### Requirements:
     * - `token` and `pair` addresses must not be zero.
     * - Only the contract moderator can call this function.
     * - The `token` and `pair` addresses must be valid.
     * - The `metadata` struct for the `token` address must be updated with the `pair` address, `pairAsset` address, `tokenDecimals`, and `pairAssetDecimals`.
     * @param token The address of the token to be set.
     * @param pair The address of the pair to be set.
     */
    function setTokenAndPair(address token, address pair) external onlyModerator {
        require(token != address(0) && pair != address(0),"UniswapV3PriceProvider: Invalid token or pair!");
        UniswapV3Metadata storage metadata = uniswapV3Metadata[token];
        metadata.isActive = true;
        metadata.pair = pair;
        address pairAsset = IUniswapV3Pool(pair).token0();
        if(pairAsset == token){
            pairAsset = IUniswapV3Pool(pair).token1();
        }
        metadata.pairAsset = pairAsset;
        metadata.tokenDecimals = ERC20Upgradeable(token).decimals();
        metadata.pairAssetDecimals = ERC20Upgradeable(pairAsset).decimals();
        emit SetTokenAndPair(token, pair);
    }

    /**
     * @dev Changes the active status of a token in the UniswapV3PriceProvider contract.
     * #### Requirements:
     * - The token must be listed in the UniswapV3PriceProvider contract.
     * - Only the contract moderator can call this function.
     * @param token The address of the token to change the active status for.
     * @param active The new active status of the token.
     */
    function changeActive(address token, bool active) public override onlyModerator {
        require(uniswapV3Metadata[token].pair != address(0), "UniswapV3PriceProvider: token is not listed!");
        uniswapV3Metadata[token].isActive = active;
        emit ChangeActive(token, active);
    }

    /**
     * @dev Sets the price point TWAP period for the UniswapV3PriceProvider contract.
     * #### Requirements:
     * - Only the contract moderator can call this function.
     * @param period The new price point TWAP period.
     */
    function setPricePointTWAPperiod(uint32 period) public onlyModerator {
        require(period > 0, "UniswapV3PriceProvider: Invalid period!");
        pricePointTWAPperiod = period;
    }

    /****************** view functions ****************** */

    /**
     * @dev Check if a token is listed on UniswapV3.
     * @param token The address of the token to check.
     * @return A boolean indicating whether the token is listed or not.
     */
    function isListed(address token) public override view returns(bool){
        if(uniswapV3Metadata[token].pair != address(0)){
            return true;
        }else{
            return false;
        }
    }

    /**
     * @dev Returns whether the specified token is active or not.
     * @param token The address of the token to check.
     * @return A boolean indicating whether the token is active or not.
     */
    function isActive(address token) public override view returns(bool){
        return uniswapV3Metadata[token].isActive;
    }

    /**
     * @dev Returns the price of a given token in pairAsset, and the number of decimals for the price.
     * @param token The address of the token to get the price for.
     * @return price The price of the token in pairAsset.
     * @return priceDecimals The number of decimals for the price.
     * @notice This function requires that the token is active in the price provider.
     */
    function getPrice(address token) public override view returns (uint256 price, uint8 priceDecimals) {
        UniswapV3Metadata memory metadata = uniswapV3Metadata[token];
        require(metadata.isActive, "UniswapV3PriceProvider: token is not active");
        (int24 tick, ) = OracleLibrary.consult(metadata.pair, pricePointTWAPperiod);
        priceDecimals = 18;
        price = OracleLibrary.getQuoteAtTick(
            tick,
            uint128(10 ** (metadata.tokenDecimals + priceDecimals)),
            token,
            metadata.pairAsset
        );
        price /= 10 ** metadata.pairAssetDecimals;
    }

    /**
     * @dev Returns the number of decimals used for the USD price.
     * @return The number of decimals used for the USD price.
     */
    function getPriceDecimals() public override view returns (uint8) {
        return decimals;
    }
}