// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./PriceProvider.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * @title BackendPriceProvider
 * @notice The BackendPriceProvider contract is the contract that provides prices for assets using a trusted backend.
 */
contract BackendPriceProvider is PriceProvider, Initializable, AccessControlUpgradeable {
    bytes32 public constant TRUSTED_BACKEND_ROLE = keccak256("TRUSTED_BACKEND_ROLE");

    string public constant DESCRIPTION = "Price provider that uses trusted backend";

    uint8 public usdDecimals;

    mapping(address => BackendMetadata) public backendMetadata;

    struct BackendMetadata {
        bool isListed; // true - listed, false - not listed
        bool isActive; // true - active, false - not active
    }

    /**
     * @dev Emitted when the trusted backend role is granted to a new trusted backend.
     * @param newTrustedBackend The address of the new trusted backend.
     */
    event GrantTrustedBackendRole(address indexed newTrustedBackend);

    /**
     * @dev Emitted when the trusted backend role is revoked from a trusted backend.
     * @param trustedBackend The address of the trusted backend to revoke the role from.
     */
    event RevokeTrustedBackendRole(address indexed trustedBackend);

    
    /**
     * @dev Emitted when a new token is set as the price provider.
     * @param token The address of the token set as the price provider.
     */
    event SetToken(address indexed token);

    /**
     * @dev Emitted when the active status of a token is changed.
     * @param token The address of the token to change the active status for.
     * @param active The new active status for the token.
     */
    event ChangeActive(address indexed token, bool active);

    /**
     * @dev Initializes the contract by setting up the access control roles and the number of decimals for the USD price.
     */
    function initialize() public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(TRUSTED_BACKEND_ROLE, msg.sender);
        usdDecimals = 6;
    }

    /**
     * @dev Modifier to restrict access to only the contract admin.
     */
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the Admin");
        _;
    }

    /**
     * @dev Modifier to restrict access to only the trusted backend.
     */
    modifier onlyTrustedBackend() {
        require(hasRole(TRUSTED_BACKEND_ROLE, msg.sender), "Caller is not the trusted backend");
        _;
    }

    /****************** Admin functions ****************** */

    /**
     * @dev Grants the TRUSTED_BACKEND_ROLE to a new trusted backend address.
     * @param newTrustedBackend The address of the new trusted backend.
     */
    function grantTrustedBackendRole(address newTrustedBackend) public onlyAdmin {
        grantRole(TRUSTED_BACKEND_ROLE, newTrustedBackend);
        emit GrantTrustedBackendRole(newTrustedBackend);
    }

    /**
     * @dev Revokes the trusted backend role from the specified address.
     * @param trustedBackend The address of the trusted backend to revoke the role from.
     */
    function revokeTrustedBackendRole(address trustedBackend) public onlyAdmin {
        revokeRole(TRUSTED_BACKEND_ROLE, trustedBackend);
        emit RevokeTrustedBackendRole(trustedBackend);
    }

    /****************** TrustedBackendRole functions ****************** */

    /**
     * @dev Sets the token as listed and active in the backend metadata.
     * @param token The address of the token to be set.
     */
    function setToken(address token) public onlyTrustedBackend {
        backendMetadata[token].isListed = true;
        backendMetadata[token].isActive = true;
        emit SetToken(token);
    }

    /**
     * @dev Changes the active status of a token in the backend metadata.
     * @param token The address of the token to change the active status for.
     * @param active The new active status for the token.
     */
    function changeActive(address token, bool active) public override onlyTrustedBackend {
        backendMetadata[token].isActive = active;
        emit ChangeActive(token, active);
    }

    /****************** sign steps ****************** */

    /**
     * @notice 1. Step. Backend creates offchain data and get hash of this data. This data calls message.
     * @dev returns the keccak256 of concatenated input data
     * @param token the address of asset
     * @param priceMantissa the price of asset that include decimals
     * @param validTo the unix timestamp in seconds that define the validity of given price to `validTo` timestamp
     */
    function getMessageHash(address token, uint256 priceMantissa, uint256 validTo) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(token, priceMantissa, validTo));
    }

    /**
     * @notice 2. Step. Backend formatting the message and get hash of this message.
     * @dev Returns the keccak256 of formatted message
     * @param messageHash the keccak256 of message
     */
    function getEthSignedMessageHash(bytes32 messageHash) public pure returns (bytes32) {
        /*
        Signature is produced by signing a keccak256 hash with the following format:
        "\x19Ethereum Signed Message\n" + len(msg) + msg
        Where   + (plus) is concatenation operation
                \x19 is 0x19
                len(msg) = 32, because keccak256 returns 32 bytes, i.e. length of data is 32 bytes
                msg is hash of massage
        */
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
    }

    /**
     * @notice 3. Step. Backend sign the message using web3 library and get signature.
        #### Using browser
        account = "copy paste account of signer here"
        ethereum.request({ method: "personal_sign", params: [account, hash]}).then(console.log)

        #### Using web3
        web3.personal.sign(hash, web3.eth.defaultAccount, console.log)
        
        #### Using rust secp256k1 and web3:
        let signature = secret_key.sign(&ethSignedMessageHash,None).unwrap();

        Signature will be different for different accounts
        Example of sign:
        0x993dab3dd91f5c6dc28e17439be475478f5635c92a56e17e82349d3fb2f166196f466c0b4e0c146f285204f0dcb13e5ae67bc33f4b888ec32dfe0a063e8f3f781b
        
        Than backend provide the tuple:
        (token, priceMantissa, priceDecimals, validTo, signature)
     */

    /**
     * @notice 4. Step. Smart contract verify the message (tuple)
     * @dev Returns true if the message is signed by trusted backend. Else returns false.
     * @param token the address of asset
     * @param priceMantissa the price of asset that include decimals
     * @param validTo the unix timestamp in seconds that define the validity of given price to `validTo` timestamp
     * @param signature the sign of message.
     */
    function verify(address token, uint256 priceMantissa, uint256 validTo, bytes memory signature) public view returns (bool) {
        require(block.timestamp <= validTo, "BackendPriceProvider: Expired price!");

        bytes32 messageHash = getMessageHash(token, priceMantissa, validTo);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        address messageSigner = recoverSigner(ethSignedMessageHash, signature);
        return hasRole(TRUSTED_BACKEND_ROLE, messageSigner);
    }

    /**
     * @dev Recovers the signer of a message signed with the Ethereum signature scheme.
     * @param ethSignedMessageHash The hash of the signed message.
     * @param signature The signature of the message.
     * @return The address of the signer.
     */
    function recoverSigner(bytes32 ethSignedMessageHash, bytes memory signature) public pure returns (address) {
        require(signature.length == 65, "BackendPriceProvider: Invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v; //splitting signature in (r,s,v)
        assembly {
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */
            // first 32 bytes, after the length prefix
            r := mload(add(signature, 32))
            // second 32 bytes
            s := mload(add(signature, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(signature, 96)))
        }
        //return the signer by ecrecover
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    /****************** end sign functions ****************** */

    /****************** View functions ****************** */

    /**
     * @dev Returns whether a token is listed on the backend price provider.
     * @param token The address of the token to check.
     * @return A boolean indicating whether the token is listed.
     */
    function isListed(address token) public view override returns (bool) {
        return backendMetadata[token].isListed;
    }

    /**
     * @dev Returns whether a token is active or not.
     * @param token The address of the token to check.
     * @return A boolean indicating whether the token is active or not.
     */
    function isActive(address token) public view override returns (bool) {
        return backendMetadata[token].isActive;
    }

    /**
     * @notice Returns the latest asset price and price decimals.
     * @param token the token address.
     */
    function getPrice(address token) public pure override returns (uint256 price, uint8 priceDecimals) {
        token;
        price;
        priceDecimals;
        revert("Use getPriceSigned(...)");
    }

    /**
     * @dev Returns the price of a token as a signed integer, along with the number of decimals for the price.
     * @param token The address of the token.
     * @param priceMantissa The price of the token as a mantissa.
     * @param validTo The timestamp until which the price is valid.
     * @param signature The signature of the price provided by a moderator.
     * @return _priceMantissa The price of the token as a mantissa.
     * @return priceDecimals The number of decimals for the price.
     */
    function getPriceSigned(
        address token,
        uint256 priceMantissa,
        uint256 validTo,
        bytes memory signature
    ) public view override returns (uint256 _priceMantissa, uint8 priceDecimals) {
        require(isActive(token), "BackendPriceProvider: Token is not active!");
        require(verify(token, priceMantissa, validTo, signature), "BackendPriceProvider: Signer is not moderator");
        return (priceMantissa, getPriceDecimals());
    }

    /**
     * @dev This function is used to get the evaluation of a token with a given amount.
     * @param token The address of the token to be evaluated.
     * @param tokenAmount The amount of the token to be evaluated.
     * @return evaluation The evaluation of the token with the given amount.
     * @notice This function is deprecated. Use getEvaluationSigned(...) instead.
     */
    function getEvaluation(address token, uint256 tokenAmount) public pure override returns (uint256 evaluation) {
        token;
        tokenAmount;
        evaluation;
        revert("Use getEvaluationSigned(...)");
    }

    /**
     * @dev ReturnS the evaluation in $ of `tokenAmount` with signed price.
     * @param token the address of token to get evaluation in $.
     * @param tokenAmount the amount of token to get evaluation. Amount is scaled by 10 in power token decimals.
     * @param priceMantissa the price multiplied by priceDecimals. The dimension of priceMantissa should be $/token.
     * @param validTo the timestamp in seconds, when price is gonna be not valid.
     * @param signature the ECDSA sign on eliptic curve secp256k1.
     */
    function getEvaluationSigned(
        address token,
        uint256 tokenAmount,
        uint256 priceMantissa,
        uint256 validTo,
        bytes memory signature
    ) public view override returns (uint256 evaluation) {
        require(isActive(token), "BackendPriceProvider: Token is not active!");
        require(verify(token, priceMantissa, validTo, signature), "BackendPriceProvider: Signer is not moderator");
        evaluation = (tokenAmount * priceMantissa) / (10 ** getPriceDecimals());
        uint8 tokenDecimals = ERC20Upgradeable(token).decimals();
        if (tokenDecimals >= usdDecimals) {
            evaluation = evaluation / (10 ** (tokenDecimals - usdDecimals)); //get the evaluation in USD.
        } else {
            evaluation = evaluation * (10 ** (usdDecimals - tokenDecimals));
        }
    }

    /**
     * @dev Returns the number of decimals used for the price returned by this price provider.
     * @return The number of decimals used for the price returned by this price provider.
     */
    function getPriceDecimals() public view override returns (uint8) {
        return usdDecimals;
    }
}
