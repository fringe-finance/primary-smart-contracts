// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./PriceProvider.sol";
import "./chainlink/AggregatorV3Interface.sol";
import "../../interfaces/IWstETH.sol";
import "../../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * Chainlink price provider
 */
contract wstETHPriceProvider is PriceProvider, Initializable, AccessControlUpgradeable {

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string public constant DESCRIPTION = "Price provider that uses chainlink";

    uint8 public usdDecimals;

    address public wstETH;

    address[] public aggregatorPath;

    uint256 internal constant PRECISION = 10 ** 18;


    event GrandModeratorRole(address indexed who, address indexed newModerator);
    event RevokeModeratorRole(address indexed who, address indexed moderator);
    event SetTokenAndAggregator(address indexed who, address indexed token, address[] aggeregatorPath);

    function initialize(address _wstETH, address[] memory _aggregatorPath) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        wstETH = _wstETH;
        aggregatorPath = _aggregatorPath;
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

    function addAggregatorPath(address[] memory _aggregatorPath) public onlyModerator {
        require(_aggregatorPath.length <= 5, "ChainlinkPriceProvider: too long path");
        aggregatorPath = _aggregatorPath;
        emit SetTokenAndAggregator(msg.sender, wstETH, aggregatorPath);
    }

    /****************** View functions ****************** */

    function isListed(address token) public override view returns(bool){
        require(token == wstETH, "ChainlinkPriceProvider: invalid token");
        if(wstETH != address(0) && aggregatorPath[0] != address(0)){
            return true;
        }else{
            return false;
        }
    }

    function isActive(address token) public override view returns(bool){
        require(token == wstETH, "ChainlinkPriceProvider: invalid token");
        if(wstETH != address(0) && aggregatorPath[0] != address(0)){
            return true;
        }else{
            return false;
        }
    }

    function getPriceSTETH() public view returns (uint256 priceMantissa) {
        address[] memory _aggregatorPath = aggregatorPath;
        priceMantissa = 1;
        uint priceDecimals = 0;
        for(uint8 i = 0; i < _aggregatorPath.length; i++) {
            priceMantissa *= AggregatorV3Interface(_aggregatorPath[i]).latestAnswer();   // earn price
            priceDecimals += AggregatorV3Interface(_aggregatorPath[i]).decimals();       // earn price decimals
        }
        priceMantissa /= 10 ** (priceDecimals - usdDecimals);
    }
    /**
     * @notice Get price of one wstETH expressed in USD.
     * @param token the address of wstETH token
     */
    function getPrice(address token) public override view returns (uint256 priceMantissa, uint8 priceDecimals) {
        require(token == wstETH, "invalid token");
        uint256 wstETHToStETH = IWstETH(wstETH).stEthPerToken(); // 1wstETH = stETH
        assert(wstETHToStETH > 0);
        uint256 stETHToUSD = getPriceSTETH();
        priceMantissa = wstETHToStETH * stETHToUSD / PRECISION;
        priceDecimals = usdDecimals;
    }
    /**
     * @notice returns the equivalent amount in USD
     * @param token the address of wstETH token
     * @param tokenAmount the amount of token 
     */
    function getEvaluation(address token, uint256 tokenAmount) public override view returns(uint256 evaluation) {
        (uint256 priceMantissa, uint8 priceDecimals) = getPrice(token);
        evaluation = tokenAmount * priceMantissa / 10 ** (priceDecimals); // get the evaluation scaled by 10**tokenDecimals (decimal = 18)
        uint8 tokenDecimals = ERC20Upgradeable(token).decimals(); // decimal = 18 > usdc = 6
        evaluation = evaluation / (10 ** (tokenDecimals - usdDecimals)); //get the evaluation in USD.
    }
    function getPriceDecimals() public view override returns (uint8) {
        return usdDecimals;
    }
    
}