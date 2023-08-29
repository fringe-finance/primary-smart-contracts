# BackendPriceProvider

## Contract Description


License: MIT

## 

```solidity
contract BackendPriceProvider is PriceProvider, Initializable, AccessControlUpgradeable
```

The BackendPriceProvider contract is the contract that provides prices for assets using a trusted backend.
## Structs info

### BackendMetadata

```solidity
struct BackendMetadata {
	bool isListed;
	bool isActive;
}
```


## Events info

### GrandTrustedBackendRole

```solidity
event GrandTrustedBackendRole(address indexed newTrustedBackend)
```

Emitted when the trusted backend role is granted to a new trusted backend.


Parameters:

| Name              | Type    | Description                             |
| :---------------- | :------ | :-------------------------------------- |
| newTrustedBackend | address | The address of the new trusted backend. |

### RevokeTrustedBackendRole

```solidity
event RevokeTrustedBackendRole(address indexed trustedBackend)
```

Emitted when the trusted backend role is revoked from a trusted backend.


Parameters:

| Name           | Type    | Description                                                 |
| :------------- | :------ | :---------------------------------------------------------- |
| trustedBackend | address | The address of the trusted backend to revoke the role from. |

### SetToken

```solidity
event SetToken(address indexed token)
```

Emitted when a new token is set as the price provider.


Parameters:

| Name  | Type    | Description                                         |
| :---- | :------ | :-------------------------------------------------- |
| token | address | The address of the token set as the price provider. |

### ChangeActive

```solidity
event ChangeActive(address indexed token, bool active)
```

Emitted when the active status of a token is changed.


Parameters:

| Name   | Type    | Description                                                 |
| :----- | :------ | :---------------------------------------------------------- |
| token  | address | The address of the token to change the active status for.   |
| active | bool    | The new active status for the token.                        |

## Constants info

### TRUSTED_BACKEND_ROLE (0xec39004b)

```solidity
bytes32 constant TRUSTED_BACKEND_ROLE = keccak256("TRUSTED_BACKEND_ROLE")
```


### DESCRIPTION (0xf1ae8856)

```solidity
string constant DESCRIPTION = "Price provider that uses trusted backend"
```


## State variables info

### usdDecimals (0x66a4b6c0)

```solidity
uint8 usdDecimals
```


### backendMetadata (0xa980ff07)

```solidity
mapping(address => struct BackendPriceProvider.BackendMetadata) backendMetadata
```


## Modifiers info

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Modifier to restrict access to only the contract admin.
### onlyTrustedBackend

```solidity
modifier onlyTrustedBackend()
```

Modifier to restrict access to only the trusted backend.
## Functions info

### initialize (0x8129fc1c)

```solidity
function initialize() public initializer
```

Initializes the contract by setting up the access control roles and the number of decimals for the USD price.
### grandTrustedBackendRole (0x6058bde5)

```solidity
function grandTrustedBackendRole(address newTrustedBackend) public onlyAdmin
```

Grants the TRUSTED_BACKEND_ROLE to a new trusted backend address.


Parameters:

| Name              | Type    | Description                             |
| :---------------- | :------ | :-------------------------------------- |
| newTrustedBackend | address | The address of the new trusted backend. |

### revokeTrustedBackendRole (0xabc36444)

```solidity
function revokeTrustedBackendRole(address trustedBackend) public onlyAdmin
```

Revokes the trusted backend role from the specified address.


Parameters:

| Name           | Type    | Description                                                 |
| :------------- | :------ | :---------------------------------------------------------- |
| trustedBackend | address | The address of the trusted backend to revoke the role from. |

### setToken (0x144fa6d7)

```solidity
function setToken(address token) public onlyTrustedBackend
```

Sets the token as listed and active in the backend metadata.


Parameters:

| Name  | Type    | Description                         |
| :---- | :------ | :---------------------------------- |
| token | address | The address of the token to be set. |

### changeActive (0x258a4532)

```solidity
function changeActive(
    address token,
    bool active
) public override onlyTrustedBackend
```

Changes the active status of a token in the backend metadata.


Parameters:

| Name   | Type    | Description                                                 |
| :----- | :------ | :---------------------------------------------------------- |
| token  | address | The address of the token to change the active status for.   |
| active | bool    | The new active status for the token.                        |

### getMessageHash (0xd2b0737b)

```solidity
function getMessageHash(
    address token,
    uint256 priceMantissa,
    uint256 validTo
) public pure returns (bytes32)
```

1. Step. Backend creates offchain data and get hash of this data. This data calls message.

returns the keccak256 of concatenated input data


Parameters:

| Name          | Type    | Description                                                                                  |
| :------------ | :------ | :------------------------------------------------------------------------------------------- |
| token         | address | the address of asset                                                                         |
| priceMantissa | uint256 | the price of asset that include decimals                                                     |
| validTo       | uint256 | the unix timestamp in seconds that define the validity of given price to `validTo` timestamp |

### getEthSignedMessageHash (0xfa540801)

```solidity
function getEthSignedMessageHash(
    bytes32 messageHash
) public pure returns (bytes32)
```

2. Step. Backend formatting the message and get hash of this message.

Returns the keccak256 of formatted message


Parameters:

| Name        | Type    | Description              |
| :---------- | :------ | :----------------------- |
| messageHash | bytes32 | the keccak256 of message |

### verify (0x0deea608)

```solidity
function verify(
    address token,
    uint256 priceMantissa,
    uint256 validTo,
    bytes memory signature
) public view returns (bool)
```

4. Step. Smart contract verify the message (tuple)

Returns true if the message is signed by trusted backend. Else returns false.


Parameters:

| Name          | Type    | Description                                                                                    |
| :------------ | :------ | :--------------------------------------------------------------------------------------------- |
| token         | address | the address of asset                                                                           |
| priceMantissa | uint256 | the price of asset that include decimals                                                       |
| validTo       | uint256 | the unix timestamp in seconds that define the validity of given price to `validTo` timestamp   |
| signature     | bytes   | the sign of message.                                                                           |

### recoverSigner (0x97aba7f9)

```solidity
function recoverSigner(
    bytes32 ethSignedMessageHash,
    bytes memory signature
) public pure returns (address)
```

Recovers the signer of a message signed with the Ethereum signature scheme.


Parameters:

| Name                 | Type    | Description                       |
| :------------------- | :------ | :-------------------------------- |
| ethSignedMessageHash | bytes32 | The hash of the signed message.   |
| signature            | bytes   | The signature of the message.     |


Return values:

| Name | Type    | Description                |
| :--- | :------ | :------------------------- |
| [0]  | address | The address of the signer. |

### isListed (0xf794062e)

```solidity
function isListed(address token) public view override returns (bool)
```

Returns whether a token is listed on the backend price provider.


Parameters:

| Name  | Type    | Description                          |
| :---- | :------ | :----------------------------------- |
| token | address | The address of the token to check.   |


Return values:

| Name | Type | Description                                       |
| :--- | :--- | :------------------------------------------------ |
| [0]  | bool | A boolean indicating whether the token is listed. |

### isActive (0x9f8a13d7)

```solidity
function isActive(address token) public view override returns (bool)
```

Returns whether a token is active or not.


Parameters:

| Name  | Type    | Description                          |
| :---- | :------ | :----------------------------------- |
| token | address | The address of the token to check.   |


Return values:

| Name | Type | Description                                              |
| :--- | :--- | :------------------------------------------------------- |
| [0]  | bool | A boolean indicating whether the token is active or not. |

### getPrice (0x41976e09)

```solidity
function getPrice(
    address token
) public pure override returns (uint256 price, uint8 priceDecimals)
```

Returns the latest asset price and price decimals.


Parameters:

| Name  | Type    | Description        |
| :---- | :------ | :----------------- |
| token | address | the token address. |

### getPriceSigned (0x19ed931d)

```solidity
function getPriceSigned(
    address token,
    uint256 priceMantissa,
    uint256 validTo,
    bytes memory signature
) public view override returns (uint256 _priceMantissa, uint8 priceDecimals)
```

Returns the price of a token as a signed integer, along with the number of decimals for the price.


Parameters:

| Name          | Type    | Description                                           |
| :------------ | :------ | :---------------------------------------------------- |
| token         | address | The address of the token.                             |
| priceMantissa | uint256 | The price of the token as a mantissa.                 |
| validTo       | uint256 | The timestamp until which the price is valid.         |
| signature     | bytes   | The signature of the price provided by a moderator.   |


Return values:

| Name           | Type    | Description                             |
| :------------- | :------ | :-------------------------------------- |
| _priceMantissa | uint256 | The price of the token as a mantissa.   |
| priceDecimals  | uint8   | The number of decimals for the price.   |

### getEvaluation (0x81fd01ea)

```solidity
function getEvaluation(
    address token,
    uint256 tokenAmount
) public pure override returns (uint256 evaluation)
```

This function is deprecated. Use getEvaluationSigned(...) instead.
This function is used to get the evaluation of a token with a given amount.


Parameters:

| Name        | Type    | Description                                 |
| :---------- | :------ | :------------------------------------------ |
| token       | address | The address of the token to be evaluated.   |
| tokenAmount | uint256 | The amount of the token to be evaluated.    |


Return values:

| Name       | Type    | Description                                          |
| :--------- | :------ | :--------------------------------------------------- |
| evaluation | uint256 | The evaluation of the token with the given amount.   |

### getEvaluationSigned (0xa5c68226)

```solidity
function getEvaluationSigned(
    address token,
    uint256 tokenAmount,
    uint256 priceMantissa,
    uint256 validTo,
    bytes memory signature
) public view override returns (uint256 evaluation)
```

ReturnS the evaluation in $ of `tokenAmount` with signed price.


Parameters:

| Name          | Type    | Description                                                                                |
| :------------ | :------ | :----------------------------------------------------------------------------------------- |
| token         | address | the address of token to get evaluation in $.                                               |
| tokenAmount   | uint256 | the amount of token to get evaluation. Amount is scaled by 10 in power token decimals.     |
| priceMantissa | uint256 | the price multiplied by priceDecimals. The dimension of priceMantissa should be $/token.   |
| validTo       | uint256 | the timestamp in seconds, when price is gonna be not valid.                                |
| signature     | bytes   | the ECDSA sign on eliptic curve secp256k1.                                                 |

### getPriceDecimals (0x1b30aafc)

```solidity
function getPriceDecimals() public view override returns (uint8)
```

Returns the number of decimals used for the price returned by this price provider.


Return values:

| Name | Type  | Description                                                                |
| :--- | :---- | :------------------------------------------------------------------------- |
| [0]  | uint8 | The number of decimals used for the price returned by this price provider. |
