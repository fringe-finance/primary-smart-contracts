// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./PriceProvider.sol";
import "./pyth/IPyth.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * Pyth price provider
 */
contract PythPriceProvider is PriceProvider, Initializable, AccessControlUpgradeable {

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string public constant DESCRIPTION = "Price provider that uses pyth";

    uint8 public constant MAX_LENGTH_PRICE_ID_PATH = 5;

    uint8 public tokenDecimals;

    address public pythOracle;

    uint256 public validTimePeriod;

    mapping(address => PythMetadata) public pythMetadata; // address of token => metadata of pyth

    struct PythMetadata{
        bytes32[] priceIdPath;
        bool isActive;
    }

    event GrandModeratorRole(address indexed newModerator);
    event RevokeModeratorRole(address indexed moderator);
    event SetTokenAndPriceIdPath(address indexed token, bytes32[] priceIdPath);
    event SetPythOracle(address indexed newPythOracle);
    event ChangeActive(address indexed token, bool active);


    function initialize() public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        tokenDecimals = 8;
        validTimePeriod = 60;
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
        emit GrandModeratorRole(newModerator);
    }

    function revokeModerator(address moderator) public onlyAdmin {
        revokeRole(MODERATOR_ROLE,moderator);
        emit RevokeModeratorRole(moderator);
    }

    /****************** Moderator functions ****************** */

    /**
     * @notice Set token and priceIdPath.
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
     * @notice Set PythOracle contract.
     * @param newPythOracle The address of PythOracle contract.
     */
    function setPythOracle(address newPythOracle) public onlyModerator {
        require(newPythOracle != address(0), "PythPriceProvider: Invalid priceProvider!");
        pythOracle = newPythOracle;
        emit SetPythOracle(newPythOracle);
    }

    /**
     * @notice Set ValidTimePeriod is used to check if price is older than ValidTimePeriod to perform price update.
     * @param newValidTimePeriod The validity period for which the price cannot be older to be used.
     */
    function setValidTimePeriod(uint256 newValidTimePeriod) public onlyModerator {
        validTimePeriod = newValidTimePeriod;
    }

    function changeActive(address token, bool active) public override onlyModerator {
        require(pythMetadata[token].priceIdPath[0] != bytes32(0),"PythPriceProvider: Token is not listed!");
        pythMetadata[token].isActive = active;
        emit ChangeActive(token, active);
    }

    /****************** Write functions ****************** */

    /**
     * @notice Perform a price update if the price is no longer valid.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function updatePrices(bytes32[] memory priceIds, bytes[] calldata updateData) external override payable {

        uint256 lenPriceId = priceIds.length;

        require(lenPriceId == updateData.length, "PythPriceProvider: Mismatched array sizes!");

        for (uint256 i = 0; i < lenPriceId; i++){

            bytes32 priceId = priceIds[i];

            try IPyth(pythOracle).getEmaPriceNoOlderThan(priceId, validTimePeriod) {} 
            catch {

                uint256 updateFee = IPyth(pythOracle).singleUpdateFeeInWei() * lenPriceId;
                
                require(updateFee == msg.value, "PythPriceProvider: Incorrect updateFee!");
            
                IPyth(pythOracle).updatePriceFeeds{ value: msg.value }(updateData);

                break;
            }
        }
    }

    /****************** View functions ****************** */
    function isListed(address token) public override view returns(bool){
        if(pythMetadata[token].priceIdPath[0] != bytes32(0)){
            return true;
        }else{
            return false;
        }
    }

    function isActive(address token) public override view returns(bool){
        return pythMetadata[token].isActive;
    }

    /**
     * @notice Returns the latest asset price mantissa and price decimals
     * @notice [price] = USD/token
     * @param token the token address
     */
    function getPrice(address token) public override view returns (uint256 priceMantissa, uint8 priceDecimals) {
        PythMetadata memory metadata = pythMetadata[token];
        require(metadata.isActive,"PythPriceProvider: Token is not available!");
        
        priceMantissa = 1;
        priceDecimals = 0;

        for (uint256 i = 0 ; i < metadata.priceIdPath.length; i++){
            
            bytes32 priceId = metadata.priceIdPath[i];

            PythStructs.Price memory emaPrice = IPyth(pythOracle).getEmaPriceUnsafe(priceId);

            uint256 publishTime = emaPrice.publishTime;

            if (block.timestamp > publishTime) {
                try IPyth(pythOracle).getEmaPriceNoOlderThan(priceId, validTimePeriod) {}
                catch {
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
     * @notice returns the equivalent amount in USD
     * @param token the address of token
     * @param tokenAmount the amount of token 
     */
    function getEvaluation(address token, uint256 tokenAmount) public override view returns(uint256 evaluation) {
        (uint256 priceMantissa, uint8 priceDecimals) = getPrice(token);
        evaluation = tokenAmount * priceMantissa / 10 ** (priceDecimals); // get the evaluation scaled by 10**tokenDecimals
        uint8 decimals = ERC20Upgradeable(token).decimals();
        if(decimals >= tokenDecimals){
            evaluation = evaluation / (10 ** (decimals - tokenDecimals)); //get the evaluation in USD.
        }else{
            evaluation = evaluation * (10 ** (tokenDecimals - decimals)); 
        }
    }

    function getPriceDecimals() public view override returns (uint8) {
        return tokenDecimals;
    }

    /**
     * @notice Returns the priceId array to update the price before expiration and the update fee.
     * @param token The address array of tokens needs to check if the price is about to expire.
     * @param timeBeforeExpiration Time before expiration.
     * @return priceIds The priceId array needs to update the price.
     * @return updateFee The update fee.
     */
    function getExpiredPriceFeeds(address[] memory token, uint256 timeBeforeExpiration) external override view returns(bytes32[] memory priceIds, uint256 updateFee) {
        uint256 cntTokenNeedUpdate = 0;
        uint256 priceIdNeedUpdateLength = token.length * MAX_LENGTH_PRICE_ID_PATH;
        bytes32[] memory priceIdNeedUpdate = new bytes32[](priceIdNeedUpdateLength);

        for (uint256 i = 0; i < token.length; i++){
        
            bytes32[] memory priceIdPath = pythMetadata[token[i]].priceIdPath;

            for (uint256 j = 0; j < priceIdPath.length; j++){

                bytes32 priceId = priceIdPath[j];

                try IPyth(pythOracle).getEmaPriceNoOlderThan(priceId, _diff(validTimePeriod, timeBeforeExpiration)) {}
                catch {

                    bool isAlreadyExist = false;

                    for (uint256 k = 0; k < cntTokenNeedUpdate; k++){
                        if (priceIdNeedUpdate[k] == priceId){
                            isAlreadyExist = true;
                            break;
                        }
                    }
                    if (!isAlreadyExist){
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

    function _diff(uint256 x, uint256 y) internal pure returns(uint256) {
        if (x > y) {
            return x - y;
        } else {
            return y - x;
        }
    }
}