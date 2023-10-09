// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./PriceProvider.sol";
import "./uniswapV2/IUniswapV2Pair.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * @title UniswapV2 price provider Mock
 * @dev This implementation can be affected by price manipulation due to not using TWAP.
 * For development purposes only
 */
contract UniswapV2PriceProviderMock is PriceProvider, Initializable, AccessControlUpgradeable {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string public constant DESCRIPTION = "Price provider that uses uniswapV2";

    uint8 public usdDecimals;

    mapping(address => UniswapV2Metadata) public uniswapV2Metadata; // address of token => metadata for uniswapV2
    mapping(address => PriceInfo) public tokenPrice;
    struct PriceInfo {
        uint256 price;
        uint8 tokenDecimals;
    }
    struct UniswapV2Metadata {
        bool isActive;
        address pair; // address of uniswap liquidity pool token for pair
        address pairAsset; // address of second token in pair with token
        uint8 tokenDecimals; // decimals of project token
        uint8 pairAssetDecimals; // decimals of second token in pair with token
    }

    event GrantModeratorRole(address indexed newModerator);
    event RevokeModeratorRole(address indexed moderator);
    event SetTokenAndPrice(address indexed token, uint256 price);
    event ChangeActive(address indexed token, bool active);

    function initialize() public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        usdDecimals = 6;
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the Admin");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "Caller is not the moderator");
        _;
    }

    /****************** Admin functions ****************** */

    function grantModerator(address newModerator) public onlyAdmin {
        grantRole(MODERATOR_ROLE, newModerator);
        emit GrantModeratorRole(newModerator);
    }

    function revokeModerator(address moderator) public onlyAdmin {
        revokeRole(MODERATOR_ROLE, moderator);
        emit RevokeModeratorRole(moderator);
    }

    /****************** Moderator functions ****************** */

    function setTokenAndPrice(address token, uint256 price) public onlyModerator {
        require(token != address(0), "UniswapV2PriceProvider: Invalid token!");
        tokenPrice[token].price = price;
        tokenPrice[token].tokenDecimals = ERC20Upgradeable(token).decimals();
        emit SetTokenAndPrice(token, price);
    }

    function changeActive(address token, bool active) public override onlyModerator {
        require(uniswapV2Metadata[token].pair != address(0), "UniswapV2PriceProvider: Token is not listed!");
        uniswapV2Metadata[token].isActive = active;
        emit ChangeActive(token, active);
    }

    /****************** view functions ****************** */

    function isListed(address token) public view override returns (bool) {
        if (uniswapV2Metadata[token].pair != address(0)) {
            return true;
        } else {
            return false;
        }
    }

    function isActive(address token) public view override returns (bool) {
        return uniswapV2Metadata[token].isActive;
    }

    function getPrice(address token) public view override returns (uint256 price, uint8 priceDecimals) {
        priceDecimals = 6;
        price = tokenPrice[token].price;
    }

    function getEvaluation(address token, uint256 tokenAmount) public view override returns (uint256 evaluation) {
        (uint256 price, uint8 priceDecimals) = getPrice(token);
        evaluation = (tokenAmount * price) / (10 ** priceDecimals);
        uint8 tokenDecimals = tokenPrice[token].tokenDecimals;
        if (tokenDecimals >= usdDecimals) {
            evaluation = evaluation / (10 ** (tokenDecimals - usdDecimals)); //get the evaluation in USD.
        } else {
            evaluation = evaluation * (10 ** (usdDecimals - tokenDecimals));
        }
    }

    function getReserves(address uniswapPair, address tokenA, address tokenB) public view returns (uint256 reserveA, uint256 reserveB) {
        (address token0, ) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA); //sort tokens
        (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(uniswapPair).getReserves(); //getting reserves
        (reserveA, reserveB) = (tokenA == token0) ? (reserve0, reserve1) : (reserve1, reserve0); //form the correct order of reserves
    }

    function getPriceDecimals() public view override returns (uint8) {
        return usdDecimals;
    }
}
