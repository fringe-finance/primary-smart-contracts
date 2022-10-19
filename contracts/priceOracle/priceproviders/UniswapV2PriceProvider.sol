// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./PriceProvider.sol";
import "./uniswapV2/IUniswapV2Pair.sol";
import "../../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../../interfaces/IBaseOracle.sol";


/**
 * UniswapV2 price provider
 * This implementation can be affected by price manipulation due to not using TWAP
 * For development purposes only
 */
contract UniswapV2PriceProvider is PriceProvider,
                                   Initializable,
                                   AccessControlUpgradeable,
                                   IBaseOracle
{
    
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string public constant DESCRIPTION = "Price provider that uses uniswapV2";

    uint8 public usdDecimals;

    mapping(address => UniswapV2Metadata) public uniswapV2Metadata; // address of token => metadata for uniswapV2

    struct UniswapV2Metadata {
        bool isActive;
        address pair;       // address of uniswap liquidity pool token for pair 
        address pairAsset;  // address of second token in pair with token
        uint8 tokenDecimals;  // decimals of project token
        uint8 pairAssetDecimals; // decimals of second token in pair with token
    }

    event GrandModeratorRole(address indexed who, address indexed newModerator);
    event RevokeModeratorRole(address indexed who, address indexed moderator);
    event SetTokenAndPair(address indexed who, address indexed token, address indexed pair);
    event ChangeActive(address indexed who, address indexed token, bool active);

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

    function grandModerator(address newModerator) public onlyAdmin {
        grantRole(MODERATOR_ROLE, newModerator);
    }

    function revokeModerator(address moderator) public onlyAdmin {
        revokeRole(MODERATOR_ROLE,moderator);
    }

    /****************** Moderator functions ****************** */

    function setTokenAndPair(address token, address pair) public onlyModerator {
        require(token != address(0) && pair != address(0),"UniswapV2PriceProvider: Invalid token or pair!");
        UniswapV2Metadata storage metadata = uniswapV2Metadata[token];
        metadata.isActive = true;
        metadata.pair = pair;
        address pairAsset = IUniswapV2Pair(pair).token0();
        if(pairAsset == token){
            pairAsset = IUniswapV2Pair(pair).token1();
        }
        metadata.pairAsset = pairAsset;
        metadata.tokenDecimals = ERC20Upgradeable(token).decimals();
        metadata.pairAssetDecimals = ERC20Upgradeable(pairAsset).decimals();
        emit SetTokenAndPair(msg.sender, token, pair);
    }

    function changeActive(address token, bool active) public override onlyModerator {
        require(uniswapV2Metadata[token].pair != address(0), "UniswapV2PriceProvider: token is not listed!");
        uniswapV2Metadata[token].isActive = active;
        emit ChangeActive(msg.sender, token, active);
    }

    /****************** view functions ****************** */

    function isListed(address token) public override view returns(bool){
        if(uniswapV2Metadata[token].pair != address(0)){
            return true;
        }else{
            return false;
        }
    }

    function isActive(address token) public override view returns(bool){
        return uniswapV2Metadata[token].isActive;
    }

    function getPrice(address token) public override view returns (uint256 price, uint8 priceDecimals) {
        UniswapV2Metadata memory uniswapV2metadata = uniswapV2Metadata[token];
        require(uniswapV2metadata.isActive, "UniswapV2PriceProvider: token is not active");
        address uniswapPair = uniswapV2metadata.pair;
        address pairAsset = uniswapV2metadata.pairAsset;
        (uint256 tokenReserve, uint256 pairAssetReserve) = getReserves(uniswapPair, token, pairAsset);
        uint8 tokenDecimals = uniswapV2metadata.tokenDecimals;
        uint8 pairAssetDecimals = uniswapV2metadata.pairAssetDecimals;
        priceDecimals = 18;
        price = (10 ** priceDecimals) * (pairAssetReserve / (10 ** pairAssetDecimals)) / (tokenReserve / (10 ** tokenDecimals));
    }

    function getEvaluation(address token, uint256 tokenAmount) public override view returns(uint256 evaluation) {
        (uint256 price, uint8 priceDecimals) = getPrice(token);
        evaluation = tokenAmount * price / (10 ** priceDecimals);
        uint8 tokenDecimals = uniswapV2Metadata[token].tokenDecimals;
        if(tokenDecimals >= usdDecimals){
            evaluation = evaluation / (10 ** (tokenDecimals - usdDecimals)); //get the evaluation in USD.
        }else{
            evaluation = evaluation * (10 ** (usdDecimals - tokenDecimals)); 
        }
    }

    function getReserves(address uniswapPair, address tokenA, address tokenB) public view returns (uint256 reserveA, uint256 reserveB){
        (address token0,) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);                  //sort tokens
        (uint256 reserve0, uint256 reserve1,) = IUniswapV2Pair(uniswapPair).getReserves();          //getting reserves
        (reserveA, reserveB) = (tokenA == token0) ? (reserve0, reserve1) : (reserve1, reserve0);    //form the correct order of reserves
    } 

    function getPriceDecimals() public override view returns (uint8) {
        return usdDecimals;
    }

    /**
     * @notice Return token price in USD, multiplied by 2**112
     * @param token Token address to get price of
     */
    function getUSDPx(address token) external view override returns (uint) {
        (uint256 priceMantissa,) = getPrice(token);
        return priceMantissa * (2**112);
    }
}