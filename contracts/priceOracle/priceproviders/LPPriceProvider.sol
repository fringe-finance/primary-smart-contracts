// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../../util/HomoraMath.sol";
import "./uniswapV2/IUniswapV2Pair.sol";
import "./PriceProvider.sol";

/**
 * @title LPPriceProvider
 * @notice The LPPriceProvider contract is the contract that provides the functionality of getting the latest price from Uniswap V2 LP tokens.
 * @dev Contract that provides the functionality of getting the latest price from Uniswap V2 LP tokens. Inherit from PriceProvider.
 */
contract LPPriceProvider is PriceProvider, Initializable, AccessControlUpgradeable {
    using SafeMathUpgradeable for uint256;
    using HomoraMath for uint256;
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    uint8 public usdDecimals;

    mapping(address => LPMetadata) public lpMetadata; // address of token => metadata of chainlink

    struct LPMetadata {
        bool isActive;
        address base;
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
     * @dev Emitted when the LPToken and its corresponding price provider are set.
     * @param token The address of the LPToken.
     * @param priceProvider The address of the price provider contract.
     */
    event SetLPTokenAndPriceProvider(address indexed token, address indexed priceProvider);

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
    function grandModerator(address newModerator) public onlyAdmin {
        grantRole(MODERATOR_ROLE, newModerator);
        emit GrandModeratorRole(newModerator);
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
     * @dev Sets the LP token and price provider for the given LP token address.
     * #### Requirements:
     * - `lpToken` cannot be the zero address.
     * - `provider` cannot be the zero address.
     * @param lpToken The address of the LP token.
     * @param provider The address of the price provider.
     */
    function setLPTokenAndProvider(address lpToken, address provider) public onlyModerator {
        require(lpToken != address(0), "USBPriceOracle: Invalid token");
        require(provider != address(0), "USBPriceOracle: Invalid priceProvider");
        LPMetadata storage metadata = lpMetadata[lpToken];
        metadata.isActive = true;
        metadata.base = provider;
        emit SetLPTokenAndPriceProvider(lpToken, provider);
    }

    /**
     * @dev Changes the active status of a token in the LPPriceProvider contract.
     * #### Requirements:
     * - The token must be listed in the contract.
     * - Only the contract moderator can call this function.
     * @param token The address of the token to change the active status for.
     * @param active The new active status of the token.
     */
    function changeActive(address token, bool active) public override onlyModerator {
        require(lpMetadata[token].base != address(0), "ChainlinkPriceProvider: Token is not listed!");
        lpMetadata[token].isActive = active;
        emit ChangeActive(token, active);
    }

    /****************** View functions ****************** */

    /**
     * @dev Checks if a token is listed in the LPPriceProvider.
     * @param token The address of the token to check.
     * @return A boolean indicating whether the token is listed or not.
     */
    function isListed(address token) public view override returns (bool) {
        if (lpMetadata[token].base != address(0)) {
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
        return lpMetadata[token].isActive;
    }

    /**
     * @dev Returns the value of the given input as ETH per unit, multiplied by 2**112.
     * @param lpToken The address of the LP token.
     * @return The USD price of the LP token in uint256 format.
     */
    function getUSDPx(address lpToken) public view returns (uint256) {
        uint256 totalSupply = IUniswapV2Pair(lpToken).totalSupply();
        (uint256 r0, uint256 r1, ) = IUniswapV2Pair(lpToken).getReserves();
        uint256 sqrtK = HomoraMath.sqrt(r0.mul(r1)).fdiv(totalSupply); // in 2**112
        (uint256 px0, uint256 px1) = calcUSDPx112(lpToken); // in 2**112
        // fair token0 amt: sqrtK * sqrt(px1/px0)
        // fair token1 amt: sqrtK * sqrt(px0/px1)
        // fair lp price = 2 * sqrt(px0 * px1)
        // split into 2 sqrts multiplication to prevent uint256 overflow (note the 2**112)
        return sqrtK.mul(2).mul(HomoraMath.sqrt(px0)).div(2 ** 56).mul(HomoraMath.sqrt(px1)).div(2 ** 56);
    }

    /**
     * @dev Calculates the USD price of a given LP token.
     * @param lpToken The address of the LP token.
     * @return P0x112 The USD price of token0 in the LP token multiplied by 2^112.
     * @return P1x112 The USD price of token1 in the LP token multiplied by 2^112.
     */
    function calcUSDPx112(address lpToken) internal view returns (uint256 P0x112, uint256 P1x112) {
        LPMetadata memory metadata = lpMetadata[lpToken];
        address token0 = IUniswapV2Pair(lpToken).token0();
        address token1 = IUniswapV2Pair(lpToken).token1();
        (uint256 priceMantissa0, ) = PriceProvider(metadata.base).getPrice(token0);
        P0x112 = priceMantissa0.mul(uint256(2 ** 112));

        (uint256 priceMantissa1, ) = PriceProvider(metadata.base).getPrice(token1);
        P1x112 = priceMantissa1.mul(uint256(2 ** 112));
    }

    /**
     * @dev Returns the price of the given LP token in USD.
     * @param lpToken The address of the LP token.
     * @return priceMantissa The price of the LP token in USD, represented as a mantissa.
     * @return priceDecimals The number of decimals in the price of the LP token in USD.
     */
    function getPrice(address lpToken) public view override returns (uint256 priceMantissa, uint8 priceDecimals) {
        uint256 usdPrice = getUSDPx(lpToken);
        priceMantissa = usdPrice.div(uint256(2 ** 112));
        priceDecimals = usdDecimals;
    }

    /**
     * @dev Returns the evaluation of a given amount of LP tokens in USD.
     * @param lpToken The address of the LP token.
     * @param tokenAmount The amount of LP tokens to evaluate.
     * @return evaluation The evaluation of the given amount of LP tokens in USD.
     */
    function getEvaluation(address lpToken, uint256 tokenAmount) public view override returns (uint256 evaluation) {
        (uint256 priceMantissa, uint8 priceDecimals) = getPrice(lpToken);
        evaluation = (tokenAmount * priceMantissa) / 10 ** (priceDecimals); // get the evaluation scaled by 10**tokenDecimals
        uint8 tokenDecimals = IUniswapV2Pair(lpToken).decimals();
        if (tokenDecimals >= usdDecimals) {
            evaluation = evaluation / (10 ** (tokenDecimals - usdDecimals)); //get the evaluation in USD.
        } else {
            evaluation = evaluation * (10 ** (usdDecimals - tokenDecimals));
        }
    }

    /**
     * @dev Returns the number of decimals used for the price provided by this contract.
     * @return The number of decimals used for the price provided by this contract.
     */
    function getPriceDecimals() public view override returns (uint8) {
        return usdDecimals;
    }
}
