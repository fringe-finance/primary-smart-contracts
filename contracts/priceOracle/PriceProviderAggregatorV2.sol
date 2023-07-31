// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./priceproviders/PriceProvider.sol";
import "./../interfaces/NewPriceOracle/IPriceOracle.sol";

contract PriceProviderAggregatorV2 is Initializable, AccessControlUpgradeable
{
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    IPriceOracle public priceOracle;
    
    mapping(address => bool) public twapEnabledForAsset;   // address of token => enabled TWAP for this token
    mapping(address => address) public tokenPriceProvider; // address of token => priceProvider address

    event GrandModeratorRole(address indexed who, address indexed newModerator);
    event RevokeModeratorRole(address indexed who, address indexed moderator);
    event SetTokenAndPriceProvider(address indexed who, address indexed token, address indexed priceProvider);
    event ChangeActive(address indexed who, address indexed priceProvider, address indexed token, bool active);
    event SetTwapEnabledForAsset(address token, bool enabled);
    event SetPriceOracle(address priceOracle);

    function initialize() public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the Admin");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "Caller is not the Moderator");
        _;
    }

    /****************** Admin functions ****************** */

    function grandModerator(address newModerator) public onlyAdmin {
        grantRole(MODERATOR_ROLE, newModerator);
        emit GrandModeratorRole(msg.sender, newModerator);
    }

    function revokeModerator(address moderator) public onlyAdmin {
        revokeRole(MODERATOR_ROLE, moderator);
        emit RevokeModeratorRole(msg.sender, moderator);
    }    

    /****************** end Admin functions ****************** */


    /****************** Moderator functions ****************** */

    function setPriceOracle(address newPriceOracle) public onlyModerator {
        require(newPriceOracle != address(0), "PriceProviderAggregator: invalid priceOracle");
        priceOracle = IPriceOracle(newPriceOracle);
        emit SetPriceOracle(newPriceOracle);
    }

    /**
     * @dev sets price provider to `token`
     * @param token the address of token
     * @param priceProvider the address of price provider. Should implememnt the interface of `PriceProvider`
     */
    function setTokenAndPriceProvider(address token, address priceProvider) public onlyModerator {
        require(token != address(0), "PriceProviderAggregator: invalid token");
        require(priceProvider != address(0), "PriceProviderAggregator: invalid priceProvider");
        tokenPriceProvider[token] = priceProvider;
        emit SetTokenAndPriceProvider(msg.sender, token, priceProvider);
    }

    /**
     * @dev changes the active state of `token` in `priceProvider`
     * @param priceProvider the address of price provider. Should implememnt the interface of `PriceProvider`
     * @param token the address of token
     * @param active the new active state
     */
    function changeActive(address priceProvider, address token, bool active) public onlyModerator {
        require(tokenPriceProvider[token] == priceProvider, "PriceProviderAggregator: mismatch token`s price provider");
        PriceProvider(priceProvider).changeActive(token, active);
        emit ChangeActive(msg.sender, priceProvider, token, active);
    }

    /**
     * @dev sets TWAP enabled state for `token`
     * @param token the address of token
     * @param enabled the new TWAP enabled state
     */
    function setTwapEnabledForAsset(address token, bool enabled) public onlyModerator {
        twapEnabledForAsset[token] = enabled;
        emit SetTwapEnabledForAsset(token, enabled);
    }

    /****************** end Moderator functions ****************** */


    /****************** main functions ****************** */

    /**
     * @dev updates the most recent TWAP price of a token.
     * @param token The address of the token.
     */
    function updatePrice(address token) external {
        priceOracle.calcFinalPrices(token);
    }

    /**
     * @dev Returns the most recent TWAP price of a token.
     * @param token The address of the token.
     * @return priceDecimals The decimals of the price.
     * @return timestamp The last updated timestamp of the price.
     * @return collateralPrice The collateral price of the token.
     * @return capitalPrice The capital price of the token.
     */
    function getPrice(address token) external view returns (uint8 priceDecimals, uint32 timestamp, uint256 collateralPrice, uint256 capitalPrice) {
        return priceOracle.getMostTWAPprice(token);
    }

    /**
     * @dev returns the most TWAP price in USD evaluation of token by its `tokenAmount`
     * @param token the address of token to evaluate
     * @param tokenAmount the amount of token to evaluate
     * @return collateralEvaluation the USD evaluation of token by its `tokenAmount` in collateral price
     * @return capitalEvaluation the USD evaluation of token by its `tokenAmount` in capital price
     */
    function getEvaluation(address token, uint256 tokenAmount) external view returns(uint256 collateralEvaluation, uint256 capitalEvaluation){
        return priceOracle.getEvaluation(token, tokenAmount);
    }
}
