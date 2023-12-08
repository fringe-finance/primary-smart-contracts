// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./PriceProvider.sol";
import "./chainlink/AggregatorV3Interface.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * @title ChainlinkPriceProvider
 * @notice The ChainlinkPriceProvider contract is the contract that provides the functionality for getting the price of a token using Chainlink.
 */
contract ChainlinkPriceProvider is PriceProvider, Initializable, AccessControlUpgradeable {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string public constant DESCRIPTION = "Price provider that uses chainlink";

    uint8 public constant MAX_PRICE_PATH_LENGTH = 5;

    uint8 public usdDecimals;

    mapping(address => uint256) public timeOuts; // address of aggregatorPath => timeout of aggregatorPath
    mapping(address => ChainlinkMetadata) public chainlinkMetadata; // address of token => metadata of chainlink

    struct ChainlinkMetadata {
        bool isActive;
        address[] aggregatorPath;
    }

    /**
     * @dev Emitted when the moderator role is granted to a new address.
     * @param newModerator The address of the new moderator.
     */
    event GrantModeratorRole(address indexed newModerator);

    /**
     * @dev Emitted when the moderator role is revoked from an address.
     * @param moderator The address of the moderator to be revoked.
     */
    event RevokeModeratorRole(address indexed moderator);

    /**
     * @dev Emitted when a token and its corresponding Chainlink aggregator path are set.
     * @param token The address of the token.
     * @param aggregatorPath The array of Chainlink aggregator addresses used to get the price of the token.
     */
    event SetTokenAndAggregator(address indexed token, address[] aggregatorPath);

    /**
     * @dev Emitted when the active status of a token is changed.
     * @param token The address of the token whose active status is changed.
     * @param active The new active status of the token.
     */
    event ChangeActive(address indexed token, bool active);

    /**
     * @dev Emitted when the time out for a Chainlink aggregator path is set.
     * @param aggregatorPath The address of the Chainlink aggregator path.
     * @param newTimeOut The new time out value in seconds.
     */
    event SetTimeOut(address indexed aggregatorPath, uint256 newTimeOut);

    /**
     * @dev Initializes the contract by setting up the access control roles and assigning them to the contract deployer.
     * The `DEFAULT_ADMIN_ROLE` and `MODERATOR_ROLE` roles are set up with the contract deployer as the initial role bearer.
     * `usdDecimals` is set to 6.
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
     * @notice Sets the timeout value corresponding to the aggregatorPath.
     * @dev Example: ETH/USD have a new answer is written when the off-chain data moves more than the
     *      0.5% deviation threshold or 3600 seconds have passed since the last answer was written on-chain.
     *      So, the timeOut value for each aggregator will be equal to the heartbeat threshold value plus a
     *      period of time to make the transaction update the price, that time period can be 60s or a little more.
     * @param aggregatorPath The address of chainlink aggregator contract.
     * @param newTimeOut It is the amount of time it takes for a new round of aggregation to start after a specified
     * amount of time since the last update plus a period of time waiting for new price update transactions to execute.
     */
    function setTimeOut(address aggregatorPath, uint256 newTimeOut) external onlyModerator {
        require(aggregatorPath != address(0), "ChainlinkPriceProvider: Invalid aggregatorPath!");
        timeOuts[aggregatorPath] = newTimeOut;
        emit SetTimeOut(aggregatorPath, newTimeOut);
    }

    /**
     * @dev Set token and aggregator path.
     * @param token The address of the token.
     * @param aggregatorPath The address of the aggregator path.
     */
    function setTokenAndAggregator(address token, address[] memory aggregatorPath) public onlyModerator {
        ChainlinkMetadata storage metadata = chainlinkMetadata[token];
        metadata.isActive = true;
        require(aggregatorPath.length <= 5, "ChainlinkPriceProvider: Too long path");
        metadata.aggregatorPath = aggregatorPath;
        emit SetTokenAndAggregator(token, aggregatorPath);
    }

    /**
     * @dev Change active status of token.
     * @param token The address of the token.
     * @param active The active status of token.
     */
    function changeActive(address token, bool active) public override onlyModerator {
        require(chainlinkMetadata[token].aggregatorPath[0] != address(0), "ChainlinkPriceProvider: Token is not listed!");
        chainlinkMetadata[token].isActive = active;
        emit ChangeActive(token, active);
    }

    /****************** View functions ****************** */

    /**
     * @dev Returns the is listed status of token.
     * @param token the address of token.
     * @return isListed the is listed status of token.
     */
    function isListed(address token) public view override returns (bool) {
        if (chainlinkMetadata[token].aggregatorPath[0] != address(0)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Returns the is active status of token.
     * @param token the address of token.
     * @return isActive the is active status of token.
     */
    function isActive(address token) public view override returns (bool) {
        return chainlinkMetadata[token].isActive;
    }

    /**
     * @dev ReturnS the latest price after performing sanity check and staleness check.
     * @param aggregatorPath The address of chainlink aggregator contract.
     * @return The latest price (answer).
     */
    function getLatestPrice(address aggregatorPath) public view virtual returns (uint256) {
        (uint80 roundId, int256 answer, , /*uint256 startedAt*/ uint256 updatedAt /*uint80 answeredInRound*/, ) = AggregatorV3Interface(
            aggregatorPath
        ).latestRoundData();
        require(roundId != 0 && answer >= 0 && updatedAt != 0 && updatedAt <= block.timestamp, "ChainlinkPriceProvider: Fetched data is invalid!");
        require(block.timestamp - updatedAt <= timeOuts[aggregatorPath], "ChainlinkPriceProvider: price is too old!");
        return uint256(answer);
    }

    /**
     * @notice Returns the latest asset price mantissa and price decimals. 
     * @dev [price] = USD/token
     * - First step is get priceMantissa with priceDecimals by this formula:
     *      price = 1 * 10 ** tokenDecimals * (chainlinkPrice_1 / 10 ** priceDecimals_1) * ... * (chainlinkPrice_n / 10 ** priceDecimals_n) =
     *            = 10 ** tokenDecimals (chainlinkPrice_1 * ... * chainlinkPrice_n) / 10 ** (priceDecimals_1 + ... + priceDecimals_n)
     * - Second step is scale priceMantissa to usdDecimals.
     * @param token the token address.
     */
    function getPrice(address token) public view override returns (uint256 priceMantissa, uint8 priceDecimals) {
        ChainlinkMetadata memory metadata = chainlinkMetadata[token];
        require(metadata.isActive, "ChainlinkPriceProvider: Token is not available!");
        address[] memory aggregatorPath = metadata.aggregatorPath;
        priceMantissa = 1;
        priceDecimals = 0;
        for (uint8 i = 0; i < aggregatorPath.length; i++) {
            priceMantissa *= getLatestPrice(aggregatorPath[i]); // earn price
            priceDecimals += AggregatorV3Interface(aggregatorPath[i]).decimals(); // earn price decimals
        }
        if (priceDecimals >= usdDecimals) {
            priceMantissa /= 10 ** (priceDecimals - usdDecimals);
        } else {
            priceMantissa *= 10 ** (usdDecimals - priceDecimals);
        }
        priceDecimals = usdDecimals;
    }

    /**
     * @dev Returns the evaluation of a given token amount in USD using the Chainlink price feed.
     * @param token The address of the token to evaluate.
     * @param tokenAmount The amount of tokens to evaluate.
     * @return evaluation The evaluation of the token amount in USD.
     */
    function getEvaluation(address token, uint256 tokenAmount) public view override returns (uint256 evaluation) {
        (uint256 priceMantissa, uint8 priceDecimals) = getPrice(token);
        evaluation = (tokenAmount * priceMantissa) / 10 ** (priceDecimals); // get the evaluation scaled by 10**tokenDecimals
        uint8 tokenDecimals = ERC20Upgradeable(token).decimals();
        if (tokenDecimals >= usdDecimals) {
            evaluation = evaluation / (10 ** (tokenDecimals - usdDecimals)); //get the evaluation in USD.
        } else {
            evaluation = evaluation * (10 ** (usdDecimals - tokenDecimals));
        }
    }

    /**
     * @dev Returns the number of decimals used for the price provided by the Chainlink oracle.
     * @return The number of decimals used for the price.
     */
    function getPriceDecimals() public view override returns (uint8) {
        return usdDecimals;
    }

    /**
     * @dev Returns the metadata set up for token.
     * @param token The address of the token.
     * @return metadata The metadata includes active status of token and array of Chainlink aggregator addresses used to get the price of the token.
     */
    function getChainlinkMetadata(address token) public view returns (ChainlinkMetadata memory) {
        ChainlinkMetadata memory metadata = chainlinkMetadata[token];
        return metadata;
    }
}
