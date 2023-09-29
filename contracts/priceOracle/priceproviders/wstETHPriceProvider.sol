// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./PriceProvider.sol";
import "./chainlink/AggregatorV3Interface.sol";
import "../../interfaces/IWstETH.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * @title wstETH price provider
 * @notice Price provider that uses chainlink
 * @dev This contract is used to get the price of wstETH in USD.
 */
contract wstETHPriceProvider is PriceProvider, Initializable, AccessControlUpgradeable {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string public constant DESCRIPTION = "Price provider that uses chainlink";

    uint8 public constant MAX_PRICE_PATH_LENGTH = 5;

    uint8 public usdDecimals;

    address public wstETH;

    address[] public aggregatorPath;

    mapping(address => uint256) public timeOuts; // address of aggregatorPath => timeout of aggregatorPath

    uint256 internal constant PRECISION = 10 ** 18;

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
     * @dev Emitted when the wstETH address and aggregator path are set.
     * @param token The address of the wstETH token contract.
     * @param aggregatorPath The array of aggregator addresses to get the price feed for wstETH in USD.
     */
    event SetTokenAndAggregator(address indexed token, address[] aggregatorPath);

    /**
     * @dev Emitted when the time out for a Chainlink aggregator path is set.
     * @param aggregatorPath The address of the Chainlink aggregator path.
     * @param newTimeOut The new time out value in seconds.
     */
    event SetTimeOut(address indexed aggregatorPath, uint256 newTimeOut);

    /**
     * @dev Initializes the wstETH price provider contract with the given wstETH address and aggregator path.
     * @param _wstETH The address of the wstETH token contract.
     * @param _aggregatorPath The array of aggregator addresses to get the price feed for wstETH in USD.
     */
    function initialize(address _wstETH, address[] memory _aggregatorPath) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        wstETH = _wstETH;
        aggregatorPath = _aggregatorPath;
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
     * @dev Modifier to restrict access to functions to only the moderator role.
     * The caller must have the moderator role to execute the function.
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
    function grantModerator(address newModerator) public onlyAdmin {
        grantRole(MODERATOR_ROLE, newModerator);
        emit GrantModeratorRole(newModerator);
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
     * @dev Adds a new aggregator path for the price oracle.
     *
     * Requirements:
     * - Only the moderator can call this function.
     * - The length of the aggregator path must not exceed MAX_PRICE_PATH_LENGTH.
     * @param _aggregatorPath The new aggregator path to be added.
     */
    function addAggregatorPath(address[] memory _aggregatorPath) public onlyModerator {
        require(_aggregatorPath.length <= MAX_PRICE_PATH_LENGTH, "WstETHPriceProvider: Too long path");
        aggregatorPath = _aggregatorPath;
        emit SetTokenAndAggregator(wstETH, aggregatorPath);
    }

    /**
     * @notice Sets the timeout value corresponding to the aggregatorPath.
     * @dev Example: ETH/USD have a new answer is written when the off-chain data moves more than the
     *      0.5% deviation threshold or 3600 seconds have passed since the last answer was written on-chain.
     *      So, the timeOut value for each aggregator will be equal to the heartbeat threshold value plus a
     *      period of time to make the transaction update the price, that time period can be 60s or a little more.
     * @param aggregatorPath_ The address of chainlink aggregator contract.
     * @param newTimeOut It is the amount of time it takes for a new round of aggregation to start after a specified
     * amount of time since the last update plus a period of time waiting for new price update transactions to execute.
     */
    function setTimeOut(address aggregatorPath_, uint256 newTimeOut) external onlyModerator {
        require(aggregatorPath_ != address(0), "WstETHPriceProvider: Invalid aggregatorPath!");
        timeOuts[aggregatorPath_] = newTimeOut;
        emit SetTimeOut(aggregatorPath_, newTimeOut);
    }
    /****************** View functions ****************** */

    /**
     * @dev Checks if the given token is active.
     * @param token The address of the token to check.
     * @return A boolean indicating whether the token is active or not.
     */
    function isActive(address token) public view override returns (bool) {
        if (token == wstETH && wstETH != address(0) && aggregatorPath[0] != address(0)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Returns the price of stETH in USD.
     * @return priceMantissa The price of stETH in USD as a mantissa value.
     */
     function getPriceSTETH() public view returns (uint256 priceMantissa) {
        address[] memory _aggregatorPath = aggregatorPath;
        priceMantissa = 1;
        uint256 priceDecimals = 0;
        for (uint8 i = 0; i < _aggregatorPath.length; i++) {
            priceMantissa *= getLatestPrice(_aggregatorPath[i]); // earn price
            priceDecimals += AggregatorV3Interface(_aggregatorPath[i]).decimals(); // earn price decimals
        }
        if (priceDecimals >= usdDecimals) {
            priceMantissa /= 10 ** (priceDecimals - usdDecimals);
        } else {
            priceMantissa *= 10 ** (usdDecimals - priceDecimals);
        }
    }

    /**
     * @dev Returns the price of the given token in USD.
     * @param token The address of the token to get the price for.
     * @return priceMantissa The price of the token in USD, scaled by 1e18.
     * @return priceDecimals The number of decimals in the USD price.
     */
    function getPrice(address token) public view override returns (uint256 priceMantissa, uint8 priceDecimals) {
        require(isActive(token), "WstETHPriceProvider: Token is not active!");
        uint256 wstETHToStETH = IWstETH(wstETH).stEthPerToken(); // 1wstETH = stETH
        assert(wstETHToStETH > 0);
        uint256 stETHToUSD = getPriceSTETH();
        priceMantissa = (wstETHToStETH * stETHToUSD) / PRECISION;
        priceDecimals = usdDecimals;
    }

    /**
     * @dev Returns the evaluation of a given token amount in USD.
     * @param token The address of the token to evaluate.
     * @param tokenAmount The amount of tokens to evaluate.
     * @return evaluation The evaluation of the token amount in USD.
     */
    function getEvaluation(address token, uint256 tokenAmount) public view override returns (uint256 evaluation) {
        (uint256 priceMantissa, uint8 priceDecimals) = getPrice(token);
        evaluation = (tokenAmount * priceMantissa) / 10 ** (priceDecimals); // get the evaluation scaled by 10**tokenDecimals (decimal = 18)
        uint8 tokenDecimals = ERC20Upgradeable(token).decimals(); // decimal = 18 > usdc = 6
        evaluation = evaluation / (10 ** (tokenDecimals - usdDecimals)); //get the evaluation in USD.
    }

    /**
     * @dev Returns the number of decimals used for the USD price.
     * @return The number of decimals used for the USD price.
     */
    function getPriceDecimals() public view override returns (uint8) {
        return usdDecimals;
    }
    
    /**
     * @dev Returns the latest price after performing sanity check and staleness check.
     * @param aggregatorPath_ The address of chainlink aggregator contract.
     * @return The latest price (answer).
     */
    function getLatestPrice(address aggregatorPath_) public view virtual returns (uint256) {
        (uint80 roundId, int256 answer, , /*uint256 startedAt*/ uint256 updatedAt /*uint80 answeredInRound*/, ) = AggregatorV3Interface(
            aggregatorPath_
        ).latestRoundData();
        require(roundId != 0 && answer >= 0 && updatedAt != 0 && updatedAt <= block.timestamp, "WstETHPriceProvider: Fetched data is invalid!");
        require(block.timestamp - updatedAt <= timeOuts[aggregatorPath_], "WstETHPriceProvider: price is too old!");
        return uint256(answer);
    }
}
