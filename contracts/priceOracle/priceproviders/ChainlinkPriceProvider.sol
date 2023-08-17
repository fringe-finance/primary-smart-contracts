// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./PriceProvider.sol";
import "./chainlink/AggregatorV3Interface.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * Chainlink price provider
 */
contract ChainlinkPriceProvider is PriceProvider, Initializable, AccessControlUpgradeable {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string public constant DESCRIPTION = "Price provider that uses chainlink";

    uint8 public constant MAX_PRICE_PATH_LENGTH = 5;

    uint8 public usdDecimals;

    mapping(address => ChainlinkMetadata) public chainlinkMetadata; // address of token => metadata of chainlink

    struct ChainlinkMetadata {
        bool isActive;
        address[] aggregatorPath;
    }

    event GrandModeratorRole(address indexed newModerator);
    event RevokeModeratorRole(address indexed moderator);
    event SetTokenAndAggregator(address indexed token, address[] aggregatorPath);
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

    /**
     * @dev Grants the moderator role to a new address.
     * @param newModerator The address of the new moderator.
     */
    function grandModerator(address newModerator) public onlyAdmin {
        grantRole(MODERATOR_ROLE, newModerator);
        emit GrandModeratorRole(newModerator);
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
     * @dev Set token and aggregator path
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
     * @dev Change active status of token
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
     * @notice Returns the is listed status of token
     * @param token the address of token
     * @return isListed the is listed status of token
     */
    function isListed(address token) public view override returns (bool) {
        if (chainlinkMetadata[token].aggregatorPath[0] != address(0)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @notice Returns the is active status of token
     * @param token the address of token
     * @return isActive the is active status of token
     */
    function isActive(address token) public view override returns (bool) {
        return chainlinkMetadata[token].isActive;
    }

    /**
     * @dev Return the latest price after performing sanity check and staleness check.
     * @param aggregatorPath The address of chainlink aggregator contract.
     * @return The latest price (answer).
     */
    function getLatestPrice(address aggregatorPath) public view virtual returns (uint256) {
        (uint80 roundId, int256 answer, , /*uint256 startedAt*/ uint256 updatedAt /*uint80 answeredInRound*/, ) = AggregatorV3Interface(
            aggregatorPath
        ).latestRoundData();
        require(roundId != 0 && answer >= 0 && updatedAt != 0 && updatedAt <= block.timestamp, "ChainlinkPriceProvider: Fetched data is invalid!");
        return uint256(answer);
    }

    /**
     * @notice Returns the latest asset price mantissa and price decimals
     * @notice [price] = USD/token
     * @param token the token address
     * @dev First step is get priceMantissa with priceDecimals by this formula:
     *      price = 1 * 10 ** tokenDecimals * (chainlinkPrice_1 / 10 ** priceDecimals_1) * ... * (chainlinkPrice_n / 10 ** priceDecimals_n) =
     *            = 10 ** tokenDecimals (chainlinkPrice_1 * ... * chainlinkPrice_n) / 10 ** (priceDecimals_1 + ... + priceDecimals_n)
     *      Second step is scale priceMantissa to usdDecimals
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
     * @notice returns the equivalent amount in USD
     * @param token the address of token
     * @param tokenAmount the amount of token
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

    function getPriceDecimals() public view override returns (uint8) {
        return usdDecimals;
    }
}
