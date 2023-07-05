// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./PriceProviderV2.sol";
import "../uniswapV3/v3-core/interfaces/IUniswapV3Pool.sol";
import "../uniswapV3/v3-periphery/libraries/OracleLibrary.sol";
import "../../../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../../openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../../../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";


/**
 * UniswapV2 price provider
 * For development purposes only
 */
contract UniswapV3PriceProvider is PriceProviderV2,
                                   Initializable,
                                   AccessControlUpgradeable 
{
    
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string public constant DESCRIPTION = "Price provider that uses uniswapV3";

    uint8 public decimals;

    uint32 public pricePointTWAPperiod; // time period for TWAP

    mapping(address => UniswapV3Metadata) public uniswapV3Metadata; // address of token => metadata for uniswapV3

    struct UniswapV3Metadata {
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
        decimals = 18;
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
        emit SetTokenAndPair(msg.sender, token, pair);
    }

    function changeActive(address token, bool active) public override onlyModerator {
        require(uniswapV3Metadata[token].pair != address(0), "UniswapV3PriceProvider: token is not listed!");
        uniswapV3Metadata[token].isActive = active;
        emit ChangeActive(msg.sender, token, active);
    }

    function setPricePointTWAPperiod(uint32 period) public onlyModerator {
        require(period > 0, "UniswapV3PriceProvider: Invalid period!");
        pricePointTWAPperiod = period;
    }

    /****************** view functions ****************** */

    function isListed(address token) public override view returns(bool){
        if(uniswapV3Metadata[token].pair != address(0)){
            return true;
        }else{
            return false;
        }
    }

    function isActive(address token) public override view returns(bool){
        return uniswapV3Metadata[token].isActive;
    }

    function getPrice(address token) public override view returns (uint256 price, uint8 priceDecimals) {
        UniswapV3Metadata memory metadata = uniswapV3Metadata[token];
        require(metadata.isActive, "UniswapV3PriceProvider: token is not active");
        (int24 tick, ) = OracleLibrary.consult(metadata.pair, pricePointTWAPperiod);
        priceDecimals = decimals;
        price = OracleLibrary.getQuoteAtTick(
            tick,
            uint128(10 ** (metadata.tokenDecimals + priceDecimals)),
            token,
            metadata.pairAsset
        );
        price /= 10 ** metadata.pairAssetDecimals;
    }

    // function getEvaluation(address token, uint256 tokenAmount) public override view returns(uint256 evaluation) {
    //     if (tokenAmount <= type(uint128).max) {
    //         UniswapV3Metadata memory metadata = uniswapV3Metadata[token];
    //         require(metadata.isActive, "UniswapV3PriceProvider: token is not active");
    //         (int24 tick, ) = OracleLibrary.consult(metadata.pair, pricePointTWAPperiod);
    //         evaluation = OracleLibrary.getQuoteAtTick(
    //             tick,
    //             uint128(tokenAmount),
    //             token,
    //             metadata.pairAsset
    //         );
    //     } else {
    //         (uint256 price, uint8 priceDecimals) = getPrice(token);
    //         evaluation = tokenAmount * price / (10 ** priceDecimals);
    //         uint8 tokenDecimals = uniswapV3Metadata[token].tokenDecimals;
    //         if(tokenDecimals >= usdDecimals){
    //             evaluation = evaluation / (10 ** (tokenDecimals - usdDecimals)); //get the evaluation in USD.
    //         }else{
    //             evaluation = evaluation * (10 ** (usdDecimals - tokenDecimals)); 
    //         }
    //     }
    // }

    function getPriceDecimals() public override view returns (uint8) {
        return decimals;
    }
}