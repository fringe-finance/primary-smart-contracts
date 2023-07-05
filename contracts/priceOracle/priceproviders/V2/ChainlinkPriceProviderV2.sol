// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./PriceProviderV2.sol";
import "../chainlink/AggregatorV3Interface.sol";
import "../../../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../../openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../../../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * Chainlink price provider
 */
contract ChainlinkPriceProviderV2 is PriceProviderV2, Initializable, AccessControlUpgradeable {

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string public constant DESCRIPTION = "Price provider that uses chainlink";

    uint8 public decimals;

    mapping(address => ChainlinkMetadata) public chainlinkMetadata; // address of token => metadata of chainlink

    struct ChainlinkMetadata{
        bool isActive;
        address[] aggregatorPath;
    }

    event GrandModeratorRole(address indexed who, address indexed newModerator);
    event RevokeModeratorRole(address indexed who, address indexed moderator);
    event SetTokenAndAggregator(address indexed who, address indexed token, address[] aggeregatorPath);
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
        emit GrandModeratorRole(msg.sender, newModerator);
    }

    function revokeModerator(address moderator) public onlyAdmin {
        revokeRole(MODERATOR_ROLE,moderator);
        emit RevokeModeratorRole(msg.sender, moderator);
    }

    /****************** Moderator functions ****************** */

    function setTokenAndAggregator(address token, address[] memory aggregatorPath) public onlyModerator {
        ChainlinkMetadata storage metadata = chainlinkMetadata[token];
        metadata.isActive = true;
        require(aggregatorPath.length <= 5, "ChainlinkPriceProvider: too long path");
        metadata.aggregatorPath = aggregatorPath;
        emit SetTokenAndAggregator(msg.sender, token, aggregatorPath);
    }

    function changeActive(address token, bool active) public override onlyModerator {
        require(chainlinkMetadata[token].aggregatorPath[0] != address(0),"ChainlinkPriceProvider: token is not listed!");
        chainlinkMetadata[token].isActive = active;
        emit ChangeActive(msg.sender, token, active);
    }

    /****************** View functions ****************** */

    function isListed(address token) public override view returns(bool){
        if(chainlinkMetadata[token].aggregatorPath[0] != address(0)){
            return true;
        }else{
            return false;
        }
    }

    function isActive(address token) public override view returns(bool){
        return chainlinkMetadata[token].isActive;
    }

    /**
     * Returns the latest price (answer).
     */
    function getLatestPrice(address aggregatorPath) public view returns (uint256) {
        (
            /* uint80 roundID */,
            int256 answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = AggregatorV3Interface(aggregatorPath).latestRoundData();
        return uint256(answer);
    }

    /**
     * @notice Returns the latest asset price mantissa and price decimals
     * @notice [price] = USD/token
     * @param token the token address
     * @dev First step is get priceMantissa with priceDecimals by this formula:
     *      price = 1 * 10 ** tokenDecimals * (chainlinkPrice_1 / 10 ** priceDecimals_1) * ... * (chainlinkPrice_n / 10 ** priceDecimals_n) = 
     *            = 10 ** tokenDecimals (chainlinkPrice_1 * ... * chainlinkPrice_n) / 10 ** (priceDecimals_1 + ... + priceDecimals_n)
     *      Second step is scale priceMantissa to default decimals
     */
    function getPrice(address token) public override view returns (uint256 priceMantissa, uint8 priceDecimals) {
        ChainlinkMetadata memory metadata = chainlinkMetadata[token];
        require(metadata.isActive,"ChainlinkPriceProvider: token is not available!");
        address[] memory aggregatorPath = metadata.aggregatorPath;
        priceMantissa = 1;
        priceDecimals = 0;
        for(uint8 i = 0; i < aggregatorPath.length; i++) {
            priceMantissa *= getLatestPrice(aggregatorPath[i]);                         // earn price
            priceDecimals += AggregatorV3Interface(aggregatorPath[i]).decimals();       // earn price decimals
        }
        if (priceDecimals >= decimals) {
            priceMantissa /= 10 ** (priceDecimals - decimals);
        } else {
            priceMantissa *= 10 ** (decimals - priceDecimals);
        }
        priceDecimals = decimals;
    }

    function getPriceDecimals() public view override returns (uint8) {
        return decimals;
    }
}