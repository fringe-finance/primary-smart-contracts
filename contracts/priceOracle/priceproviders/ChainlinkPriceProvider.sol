// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./PriceProvider.sol";
import "./chainlink/AggregatorV3Interface.sol";
import "../../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * Uniswap v2 price provider 
 * This implementation can be affected by price manipulation due to not using TWAP
 * For development purposes only
 */
contract ChainlinkPriceProvider is PriceProvider,
                                   Initializable,
                                   AccessControlUpgradeable
{

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string public constant DESCRIPTION = "Price provider that uses chainlink";

    uint8 public usdDecimals;

    mapping(address => ChainlinkMetadata) public chainlinkMetadata; // address of token => metadata of chainlink

    struct ChainlinkMetadata{
        bool isActive;
        address aggregatorV3; // address of aggregator
        uint8 priceDecimals;  // the decimals of chainlink price
        uint8 tokenDecimals; // the project token decimals
    }

    event GrandModeratorRole(address indexed who, address indexed newModerator);
    event RevokeModeratorRole(address indexed who, address indexed moderator);
    event SetTokenAndAggregator(address indexed who, address indexed token, address indexed aggeregator);
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
        emit GrandModeratorRole(msg.sender, newModerator);
    }

    function revokeModerator(address moderator) public onlyAdmin {
        revokeRole(MODERATOR_ROLE,moderator);
        emit RevokeModeratorRole(msg.sender, moderator);
    }

    /****************** Moderator functions ****************** */

    function setTokenAndAggregator(address token, address aggregatorV3) public onlyModerator {
        ChainlinkMetadata storage metadata = chainlinkMetadata[token];
        metadata.isActive = true;
        metadata.aggregatorV3 = aggregatorV3;
        metadata.priceDecimals = AggregatorV3Interface(aggregatorV3).decimals();
        metadata.tokenDecimals = ERC20Upgradeable(token).decimals();
        emit SetTokenAndAggregator(msg.sender, token, aggregatorV3);
    }

    function changeActive(address token, bool active) public override onlyModerator {
        require(chainlinkMetadata[token].aggregatorV3 != address(0),"ChainlinkPriceProvider: token is not listed!");
        chainlinkMetadata[token].isActive = active;
        emit ChangeActive(msg.sender, token, active);
    }

    /****************** View functions ****************** */

    function isListed(address token) public override view returns(bool){
        if(chainlinkMetadata[token].aggregatorV3 != address(0)){
            return true;
        }else{
            return false;
        }
    }

    function isActive(address token) public override view returns(bool){
        return chainlinkMetadata[token].isActive;
    }

    /**
     * @notice Returns the latest asset price and price decimals
     * @notice [price] = USD/token
     * @param token the token address
     */
    function getPrice(address token) public override view returns (uint256 priceMantissa, uint8 priceDecimals) {
        ChainlinkMetadata memory metadata = chainlinkMetadata[token];
        require(metadata.isActive,"ChainlinkPriceProvider: token is not available!");
        priceMantissa = AggregatorV3Interface(metadata.aggregatorV3).latestAnswer();
        priceDecimals = metadata.priceDecimals;
    }

    /**
     * @notice returns the equivalent amount in USD
     * @param token the address of token
     * @param tokenAmount the amount of token 
     */
    function getEvaluation(address token, uint256 tokenAmount) public override view returns(uint256 evaluation) {
        (uint256 priceMantissa, uint8 priceDecimals) = getPrice(token);
        evaluation = tokenAmount * priceMantissa / 10 ** (priceDecimals); // get the evaluation scaled by 10**tokenDecimals
        uint8 tokenDecimals = chainlinkMetadata[token].tokenDecimals;
        if(tokenDecimals >= usdDecimals){
            evaluation = evaluation / (10 ** (tokenDecimals - usdDecimals)); //get the evaluation in USD.
        }else{
            evaluation = evaluation * (10 ** (usdDecimals - tokenDecimals)); 
        }
    }
}