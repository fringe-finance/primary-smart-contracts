// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./PriceProvider.sol";
import "./uniswapV3/v3-core/interfaces/IUniswapV3Pool.sol";
import "./uniswapV3/v3-periphery/libraries/OracleLibrary.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * @title UniswapV3 price provider
 */
contract UniswapV3PriceProvider is PriceProvider, Initializable, AccessControlUpgradeable {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string public constant DESCRIPTION = "Price provider that uses uniswapV3";

    uint8 public tokenDecimals;

    uint8 public constant MAX_PRICE_PATH_LENGTH = 4;

    mapping(address => UniswapV3Metadata) public uniswapV3Metadata; // address of token => uniswapV3 metadata for token
    mapping(address => UniswapV3MetadataPair) public uniswapV3MetadataPair; // pair address => uniswapV3 metadata for pair

    struct UniswapV3Metadata {
        bool isActive;
        address[] aggregatorPath;
    }

    struct UniswapV3MetadataPair {
        address token; // address of first token in pair
        address pairToken; // address of second token in pair with token
        uint8 tokenDecimals; // decimals of project token
        uint8 pairTokenDecimals; // decimals of second token in pair with token
        uint32 pricePointTWAPperiod;
    }

    /**
     * @dev Emitted when the active status of a token changes.
     * @param token The address of the token whose active status has changed.
     * @param active The new active status of the token.
     */
    event ChangeActive(address indexed token, bool active);

    /**
     * @dev Emitted when the token decimals is set.
     * @param newTokenDecimals The new token decimals.
     */
    event SetTokenDecimals(uint8 newTokenDecimals);

    /**
     * @dev Emitted when a token and its corresponding UniswapV3 aggregator path are set.
     * @param token The address of the token.
     * @param aggregatorPath The array of UniswapV3 aggregator pairs used to get the price of the token.
     */
    event SetTokenAndAggregator(address indexed token, address[] aggregatorPath, uint32[] pricePointPeriod);

    /**
     * @dev Initializes the contract by setting up the access control roles and the number of decimals for the USD token.
     *`decimals` is set to 18.
     **/
    function initialize() public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        tokenDecimals = 18;
    }

    /**
     * @dev Modifier to restrict access to functions to only the contract moderator.
     */
    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "Caller is not the moderator");
        _;
    }

    /****************** Moderator functions ****************** */

    /**
     * @dev Sets the number of decimals used by the token.
     * Only the moderator can call this function.
     * @param newTokenDecimals The new number of decimals used by the token.
     */
    function setTokenDecimals(uint8 newTokenDecimals) public onlyModerator {
        tokenDecimals = newTokenDecimals;
        emit SetTokenDecimals(newTokenDecimals);
    }

    /**
     * @dev Set token and aggregator path.
     * #### Requirements:
     * - The token must be listed in the UniswapV3PriceProvider contract.
     * - Only the contract moderator can call this function.
     * @param token The address of the token.
     * @param aggregatorPath The address of the aggregator path.
     * @param pricePointPeriod The period for the price point.
     */
    function setTokenAndPair(address token, address[] memory aggregatorPath, uint32[] memory pricePointPeriod) external onlyModerator {
        require(token != address(0), "UniswapV3PriceProvider: token address is zero!");
        require(aggregatorPath.length <= MAX_PRICE_PATH_LENGTH, "UniswapV3PriceProvider: Too long path");
        require(aggregatorPath.length == pricePointPeriod.length, "UniswapV3PriceProvider: Invalid period length!");
        address nextToken = token;
        for (uint256 i = 0; i < aggregatorPath.length; i++) {
            address token0 = IUniswapV3Pool(aggregatorPath[i]).token0();
            address token1 = IUniswapV3Pool(aggregatorPath[i]).token1();
            if (nextToken == token0) {
                nextToken = token1;
            } else if (nextToken == token1) {
                nextToken = token0;
            } else {
                revert("UniswapV3PriceProvider: Token and pair token do not match!");
            }
            UniswapV3MetadataPair storage pair = uniswapV3MetadataPair[aggregatorPath[i]];
            if (pair.token != token0 || pair.pairToken != token1) {
                require(pricePointPeriod[i] > 0, "UniswapV3PriceProvider: Invalid period!");
                pair.pricePointTWAPperiod = pricePointPeriod[i];
                pair.token = token0;
                pair.pairToken = token1;
                pair.tokenDecimals = ERC20Upgradeable(token0).decimals();
                pair.pairTokenDecimals = ERC20Upgradeable(token1).decimals();
            }
        }
        UniswapV3Metadata storage metadata = uniswapV3Metadata[token];
        metadata.isActive = true;
        metadata.aggregatorPath = aggregatorPath;

        emit SetTokenAndAggregator(token, aggregatorPath, pricePointPeriod);
    }

    /**
     * @dev Changes the active status of a token in the UniswapV3PriceProvider con
     tract.
     * #### Requirements:
     * - The token must be listed in the UniswapV3PriceProvider contract.
     * - Only the contract moderator can call this function.
     * @param token The address of the token to change the active status for.
     * @param active The new active status of the token.
     */
    function changeActive(address token, bool active) public override onlyModerator {
        require(uniswapV3Metadata[token].aggregatorPath[0] != address(0), "UniswapV3PriceProvider: token is not listed!");
        uniswapV3Metadata[token].isActive = active;
        emit ChangeActive(token, active);
    }

    /****************** view functions ****************** */

    /**
     * @dev Check if a token is listed on UniswapV3.
     * @param token The address of the token to check.
     * @return isListed the is listed status of token.
     */
    function isListed(address token) public view override returns (bool) {
        if (uniswapV3Metadata[token].aggregatorPath[0] != address(0)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Returns whether the specified token is active or not.
     * @param token The address of the token to check.
     * @return A boolean indicating whether the token is active or not.
     */
    function isActive(address token) public view override returns (bool) {
        return uniswapV3Metadata[token].isActive;
    }

    /**
     * @dev Returns the price of a given token in pairAsset, and the number of decimals for the price.
     * @param token The address of the token to get the price for.
     * @return priceMantissa The price of the token in pairAsset.
     * @return priceDecimals The number of decimals for the price.
     * @notice This function requires that the token is active in the price provider.
     */
    function getPrice(address token) public view override returns (uint256 priceMantissa, uint8 priceDecimals) {
        UniswapV3Metadata memory metadata = uniswapV3Metadata[token];
        require(metadata.isActive, "UniswapV3PriceProvider: token is not active");
        address[] memory aggregatorPath = metadata.aggregatorPath;
        priceMantissa = 1;
        priceDecimals = tokenDecimals * uint8(aggregatorPath.length);
        address nextToken = token;
        for (uint8 i = 0; i < aggregatorPath.length; i++) {
            (uint256 price, , address pairAsset) = getUnderlyingTokenPrice(nextToken, aggregatorPath[i]);
            priceMantissa *= price;
            nextToken = pairAsset;
        }
        if (priceDecimals >= tokenDecimals) {
            priceMantissa /= 10 ** (priceDecimals - tokenDecimals);
        } else {
            priceMantissa *= 10 ** (tokenDecimals - priceDecimals);
        }
        priceDecimals = tokenDecimals;
    }

    function getUnderlyingTokenPrice(address token, address pair) public view returns (uint256 price, uint8 priceDecimals, address pairAsset) {
        UniswapV3MetadataPair memory metadata = uniswapV3MetadataPair[pair];
        (int24 tick, ) = OracleLibrary.consult(pair, metadata.pricePointTWAPperiod);
        priceDecimals = tokenDecimals;
        if (token == metadata.token) {
            price = OracleLibrary.getQuoteAtTick(tick, uint128(10 ** (metadata.tokenDecimals + priceDecimals)), token, metadata.pairToken);
            price /= 10 ** metadata.pairTokenDecimals;
            pairAsset = metadata.pairToken;
        } else if (token == metadata.pairToken) {
            price = OracleLibrary.getQuoteAtTick(tick, uint128(10 ** (metadata.pairTokenDecimals + priceDecimals)), token, metadata.token);
            price /= 10 ** metadata.tokenDecimals;
            pairAsset = metadata.token;
        } else {
            revert("UniswapV3PriceProvider: Invalid token address");
        }
    }

    /**
     * @dev Returns the number of decimals used for the USD price.
     * @return The number of decimals used for the USD price.
     */
    function getPriceDecimals() public view override returns (uint8) {
        return tokenDecimals;
    }

    /**
     * @dev Returns the metadata set up for token.
     * @param token The address of the token.
     * @return metadata The metadata includes the active status, pair address, pairAsset address, tokenDecimals, and pairAssetDecimals.
     */
    function getUniswapV3Metadata(address token) public view returns (UniswapV3Metadata memory) {
        UniswapV3Metadata memory metadata = uniswapV3Metadata[token];
        return metadata;
    }
}
