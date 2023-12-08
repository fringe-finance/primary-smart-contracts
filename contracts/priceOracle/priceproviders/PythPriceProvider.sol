// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./PriceProvider.sol";
import "./pyth/IPyth.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * @title PythPriceProvider
 * @notice The PythPriceProvider contract is the contract that provides the functionality of getting the latest price from PythNetwork.
 * @dev Contract that provides the functionality of getting the latest price from PythNetwork. Inherit from PriceProvider.
 */
contract PythPriceProvider is PriceProvider, Initializable, AccessControlUpgradeable {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string public constant DESCRIPTION = "Price provider that uses pyth";

    uint8 public constant MAX_LENGTH_PRICE_ID_PATH = 5;

    uint8 public tokenDecimals;

    address public pythOracle;

    uint256 public validTimePeriod;

    mapping(address => PythMetadata) public pythMetadata; // address of token => metadata of pyth

    struct PythMetadata {
        bytes32[] priceIdPath;
        bool isActive;
    }

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
     * @dev Emitted when the token and its corresponding price ID path are set.
     * @param token The address of the token.
     * @param priceIdPath The array of bytes32 representing the path to the token's price ID.
     */
    event SetTokenAndPriceIdPath(address indexed token, bytes32[] priceIdPath);

    /**
     * @dev Emitted when a new Pyth oracle address is set.
     * @param newPythOracle The address of the new Pyth oracle.
     */
    event SetPythOracle(address indexed newPythOracle);

    /**
     * @dev Emitted when the active status of a token changes.
     * @param token The address of the token whose active status has changed.
     * @param active The new active status of the token.
     */
    event ChangeActive(address indexed token, bool active);

    /**
     * @dev Initializes the contract by setting up the access control roles and default values for tokenDecimals and validTimePeriod.
     */
    function initialize() public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        tokenDecimals = 8;
        validTimePeriod = 60;
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
     * @notice Sets token and priceIdPath.
     * @param token The address of token.
     * @param newPriceIdPath The priceIdPath array used to get the price for the token.
     */
    function setTokenAndPriceIdPath(address token, bytes32[] memory newPriceIdPath) public onlyModerator {
        PythMetadata storage metadata = pythMetadata[token];
        metadata.isActive = true;
        require(newPriceIdPath.length <= MAX_LENGTH_PRICE_ID_PATH, "PythPriceProvider: Too long priceIdPath!");
        metadata.priceIdPath = newPriceIdPath;

        emit SetTokenAndPriceIdPath(token, newPriceIdPath);
    }

    /**
     * @dev Sets PythOracle contract.
     *
     * Requirements:
     * - Only the moderator can call this function.
     * - The address of PythOracle contract must not be zero.
     * @param newPythOracle The address of PythOracle contract.
     */
    function setPythOracle(address newPythOracle) public onlyModerator {
        require(newPythOracle != address(0), "PythPriceProvider: Invalid priceProvider!");
        pythOracle = newPythOracle;
        emit SetPythOracle(newPythOracle);
    }

    /**
     * @dev Sets ValidTimePeriod is used to check if price is older than ValidTimePeriod to perform price update.
     * Only the moderator can call this function.
     * @param newValidTimePeriod The validity period for which the price cannot be older to be used.
     */
    function setValidTimePeriod(uint256 newValidTimePeriod) public onlyModerator {
        validTimePeriod = newValidTimePeriod;
    }

    /**
     * @dev Changes the active status of a token in the Pyth price provider.
     *
     * Requirements:
     * - The token must be listed in the Pyth price provider.
     * - Only the moderator can call this function.
     * @param token The address of the token to change the active status for.
     * @param active The new active status for the token.
     */
    function changeActive(address token, bool active) public override onlyModerator {
        require(pythMetadata[token].priceIdPath[0] != bytes32(0), "PythPriceProvider: Token is not listed!");
        pythMetadata[token].isActive = active;
        emit ChangeActive(token, active);
    }

    /****************** Write functions ****************** */

    /**
     * @dev Perform a price update if the price is no longer valid.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function updatePrices(bytes32[] memory priceIds, bytes[] calldata updateData) external payable override {
        uint256 lenPriceId = priceIds.length;

        for (uint256 i = 0; i < lenPriceId; i++) {
            bytes32 priceId = priceIds[i];

            try IPyth(pythOracle).getEmaPriceNoOlderThan(priceId, validTimePeriod) {} catch {
                uint256 updateFee = IPyth(pythOracle).singleUpdateFeeInWei() * lenPriceId;

                require(updateFee == msg.value, "PythPriceProvider: Incorrect updateFee!");

                IPyth(pythOracle).updatePriceFeeds{value: msg.value}(updateData);

                break;
            }
        }
    }

    /**
     * @dev Returns the latest price of a given token in USD after update price.
     * @param token The address of the token to get the price of.
     * @param updateData The updateData provided by PythNetwork.
     * @return priceMantissa The price of the token in USD, represented as a mantissa.
     * @return priceDecimals The number of decimal places in the price of the token.
     */
    function getUpdatedPrice(
        address token,
        bytes[] calldata updateData
    ) external payable override returns (uint256 priceMantissa, uint8 priceDecimals) {
        if (updateData.length > 0) {
            IPyth(pythOracle).updatePriceFeeds{value: msg.value}(updateData);
        }
        return getPrice(token);    
    }

    /****************** View functions ****************** */

    /**
     * @dev Returns a boolean indicating whether the given token is listed in the Pyth price provider.
     * @param token The address of the token to check.
     * @return A boolean indicating whether the token is listed in the Pyth price provider.
     */
    function isListed(address token) public view override returns (bool) {
        if (pythMetadata[token].priceIdPath[0] != bytes32(0)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Returns a boolean indicating whether the specified token is active or not.
     * @param token The address of the token to check.
     * @return A boolean indicating whether the specified token is active or not.
     */
    function isActive(address token) public view override returns (bool) {
        return pythMetadata[token].isActive;
    }

    /**
     * @dev Returns the latest price of a given token in USD.
     *
     * Requirements:
     * - This function retrieves the price of a token from the Pyth oracle and calculates the price in USD.
     * - If the retrieved price is too old, the function reverts.
     * - If the number of decimal places in the retrieved price is greater than the number of decimal places in the token, the function adjusts the price accordingly.
     * - This function is view-only and does not modify the state of the contract.
     * @param token The address of the token to get the price of.
     * @return priceMantissa The price of the token in USD, represented as a mantissa.
     * @return priceDecimals The number of decimal places in the price of the token.
     */
    function getPrice(address token) public view override returns (uint256 priceMantissa, uint8 priceDecimals) {
        PythMetadata memory metadata = pythMetadata[token];
        require(metadata.isActive, "PythPriceProvider: Token is not available!");

        priceMantissa = 1;
        priceDecimals = 0;

        for (uint256 i = 0; i < metadata.priceIdPath.length; i++) {
            bytes32 priceId = metadata.priceIdPath[i];

            PythStructs.Price memory emaPrice = IPyth(pythOracle).getEmaPriceUnsafe(priceId);

            uint256 publishTime = emaPrice.publishTime;

            if (block.timestamp > publishTime) {
                try IPyth(pythOracle).getEmaPriceNoOlderThan(priceId, validTimePeriod) {} catch {
                    revert("PythPriceProvider: Price too old!");
                }
            }

            priceMantissa *= uint256(uint64(emaPrice.price));
            priceDecimals += uint8(uint32(-emaPrice.expo));
        }
        if (priceDecimals >= tokenDecimals) {
            priceMantissa /= 10 ** (priceDecimals - tokenDecimals);
        } else {
            priceMantissa *= 10 ** (tokenDecimals - priceDecimals);
        }
        priceDecimals = tokenDecimals;
    }

    /**
     * @dev Returns the evaluation of a given token amount in USD.
     * @param token The address of the token to evaluate.
     * @param tokenAmount The amount of tokens to evaluate.
     * @return evaluation The evaluation of the token amount in USD.
     */
    function getEvaluation(address token, uint256 tokenAmount) public view override returns (uint256 evaluation) {
        (uint256 priceMantissa, uint8 priceDecimals) = getPrice(token);
        evaluation = (tokenAmount * priceMantissa);
        uint8 decimals = ERC20Upgradeable(token).decimals();
        if (decimals >= tokenDecimals) {
            evaluation = evaluation / (10 ** (decimals - tokenDecimals)); //get the evaluation in USD.
        } else {
            evaluation = evaluation * (10 ** (tokenDecimals - decimals));
        }
        evaluation = evaluation / 10 ** (priceDecimals); // get the evaluation scaled by 10**tokenDecimals
    }

    /**
     * @dev Returns the evaluation of a given token amount based on the last updated price.
     * @param token The address of the token to evaluate.
     * @param tokenAmount The amount of tokens to evaluate.
     * @return evaluation The evaluation of the token amount.
     */
    function getEvaluationUnsafe(address token, uint256 tokenAmount) public override view returns(uint256 evaluation) {
        PythMetadata memory metadata = pythMetadata[token];
        require(metadata.isActive, "PythPriceProvider: Token is not available!");

        uint256 priceMantissa = 1;
        uint256 priceDecimals = 0;

        for (uint256 i = 0; i < metadata.priceIdPath.length; i++) {
            bytes32 priceId = metadata.priceIdPath[i];

            PythStructs.Price memory emaPrice = IPyth(pythOracle).getEmaPriceUnsafe(priceId);

            priceMantissa *= uint256(uint64(emaPrice.price));
            priceDecimals += uint8(uint32(-emaPrice.expo));
        }
        if (priceDecimals >= tokenDecimals) {
            priceMantissa /= 10 ** (priceDecimals - tokenDecimals);
        } else {
            priceMantissa *= 10 ** (tokenDecimals - priceDecimals);
        }
        priceDecimals = tokenDecimals;

        evaluation = (tokenAmount * priceMantissa);
        uint8 decimals = ERC20Upgradeable(token).decimals();
        if (decimals >= tokenDecimals) {
            evaluation = evaluation / (10 ** (decimals - tokenDecimals)); //get the evaluation in USD.
        } else {
            evaluation = evaluation * (10 ** (tokenDecimals - decimals));
        }
        evaluation = evaluation / 10 ** (priceDecimals); // get the evaluation scaled by 10**tokenDecimals
    }

    /**
     * @dev Returns the number of decimals used by the token.
     * @return The number of decimals used by the token.
     */
    function getPriceDecimals() public view override returns (uint8) {
        return tokenDecimals;
    }

    /**
     * @dev Returns the priceId array to update the price before expiration and the update fee.
     * @param token The address array of tokens needs to check if the price is about to expire.
     * @param timeBeforeExpiration Time before expiration.
     * @return priceIds The priceId array needs to update the price.
     * @return updateFee The update fee.
     */
    function getExpiredPriceFeeds(
        address[] memory token,
        uint256 timeBeforeExpiration
    ) external view override returns (bytes32[] memory priceIds, uint256 updateFee) {
        uint256 cntTokenNeedUpdate = 0;
        uint256 priceIdNeedUpdateLength = token.length * MAX_LENGTH_PRICE_ID_PATH;
        bytes32[] memory priceIdNeedUpdate = new bytes32[](priceIdNeedUpdateLength);

        for (uint256 i = 0; i < token.length; i++) {
            bytes32[] memory priceIdPath = pythMetadata[token[i]].priceIdPath;

            for (uint256 j = 0; j < priceIdPath.length; j++) {
                bytes32 priceId = priceIdPath[j];

                try IPyth(pythOracle).getEmaPriceNoOlderThan(priceId, _diff(validTimePeriod, timeBeforeExpiration)) {} catch {
                    bool isAlreadyExist = false;

                    for (uint256 k = 0; k < cntTokenNeedUpdate; k++) {
                        if (priceIdNeedUpdate[k] == priceId) {
                            isAlreadyExist = true;
                            break;
                        }
                    }
                    if (!isAlreadyExist) {
                        priceIdNeedUpdate[cntTokenNeedUpdate] = priceId;
                        cntTokenNeedUpdate++;
                    }
                }
            }
        }
        priceIds = new bytes32[](cntTokenNeedUpdate);
        for (uint256 i = 0; i < cntTokenNeedUpdate; i++) {
            priceIds[i] = priceIdNeedUpdate[i];
        }
        updateFee = IPyth(pythOracle).singleUpdateFeeInWei() * cntTokenNeedUpdate;
    }

    /**
     * @dev Returns the metadata set up for token.
     * @param token The address of the token.
     * @return metadata The metadata includes active status of token and array of bytes32 representing the path to the token's price Pyth ID.
     */
    function getPythMetadata(address token) public view returns (PythMetadata memory) {
        PythMetadata memory metadata = pythMetadata[token];
        return metadata;
    }

    /**
     * @dev Calculates the absolute difference between two unsigned integers.
     * @param x The first unsigned integer.
     * @param y The second unsigned integer.
     * @return The absolute difference between x and y.
     */
    function _diff(uint256 x, uint256 y) internal pure returns (uint256) {
        if (x > y) {
            return x - y;
        } else {
            return y - x;
        }
    }
}
