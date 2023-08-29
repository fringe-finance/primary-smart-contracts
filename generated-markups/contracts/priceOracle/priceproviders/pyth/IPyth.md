# IPyth

## Interface Description


License: MIT

## 

```solidity
interface IPyth
```

Author: Pyth Data Association
Please refer to the guidance at https://docs.pyth.network/consumers/best-practices for how to consume prices safely.

## Functions info

### latestPriceInfoPublishTime (0x4c469d8c)

```solidity
function latestPriceInfoPublishTime(
    bytes32 priceId
) external view returns (uint64)
```


### singleUpdateFeeInWei (0x48b6404d)

```solidity
function singleUpdateFeeInWei() external view returns (uint256)
```


### getEmaPriceUnsafe (0x9474f45b)

```solidity
function getEmaPriceUnsafe(
    bytes32 id
) external view returns (PythStructs.Price memory price)
```

Returns the exponentially-weighted moving average price of a price feed without any sanity checks.

This function returns the same price as `getEmaPrice` in the case where the price is available.
However, if the price is not recent this function returns the latest available price.

The returned price can be from arbitrarily far in the past; this function makes no guarantees that
the returned price is recent or useful for any particular application.

Users of this function should check the `publishTime` in the price to ensure that the returned price is
sufficiently recent for their application. If you are considering using this function, it may be
safer / easier to use either `getEmaPrice` or `getEmaPriceNoOlderThan`.


Return values:

| Name  | Type                     | Description                                                                                |
| :---- | :----------------------- | :----------------------------------------------------------------------------------------- |
| price | struct PythStructs.Price | - please read the documentation of PythStructs.Price to understand how to use this safely. |

### getEmaPriceNoOlderThan (0x711a2e28)

```solidity
function getEmaPriceNoOlderThan(
    bytes32 id,
    uint256 age
) external view returns (PythStructs.Price memory price)
```

Returns the exponentially-weighted moving average price that is no older than `age` seconds
of the current time.

This function is a sanity-checked version of `getEmaPriceUnsafe` which is useful in
applications that require a sufficiently-recent price. Reverts if the price wasn't updated sufficiently
recently.


Return values:

| Name  | Type                     | Description                                                                                |
| :---- | :----------------------- | :----------------------------------------------------------------------------------------- |
| price | struct PythStructs.Price | - please read the documentation of PythStructs.Price to understand how to use this safely. |

### updatePriceFeeds (0xef9e5e28)

```solidity
function updatePriceFeeds(bytes[] calldata updateData) external payable
```

Update price feeds with given update messages.
This method requires the caller to pay a fee in wei; the required fee can be computed by calling
`getUpdateFee` with the length of the `updateData` array.
Prices will be updated if they are more recent than the current stored prices.
The call will succeed even if the update is not the most recent.

Reverts if the transferred fee is not sufficient or the updateData is invalid.


Parameters:

| Name       | Type    | Description                 |
| :--------- | :------ | :-------------------------- |
| updateData | bytes[] | Array of price update data. |
