# IPrimaryLendingPlatformLiquidation

## Interface Description


License: MIT

## 

```solidity
interface IPrimaryLendingPlatformLiquidation
```


## Functions info

### liquidateFromModerator (0xfc879bcb)

```solidity
function liquidateFromModerator(
    address _account,
    address _projectToken,
    address _lendingToken,
    uint256 _lendingTokenAmount,
    address liquidator
) external returns (uint256 projectTokenLiquidatorReceived)
```

Liquidates a portion of the borrower's debt using the lending token, called by a related contract.


Parameters:

| Name                | Type    | Description                                               |
| :------------------ | :------ | :-------------------------------------------------------- |
| _account            | address | The address of the borrower                               |
| _projectToken       | address | The address of the project token                          |
| _lendingToken       | address | The address of the lending token                          |
| _lendingTokenAmount | uint256 | The amount of lending tokens to be used for liquidation   |
| liquidator          | address | The address of the liquidator                             |


Return values:

| Name                           | Type    | Description                                             |
| :----------------------------- | :------ | :------------------------------------------------------ |
| projectTokenLiquidatorReceived | uint256 | The amount of project tokens received by the liquidator |

### liquidateFromModerator (0x6cc6d47e)

```solidity
function liquidateFromModerator(
    address _account,
    address _projectToken,
    address _lendingToken,
    uint256 _lendingTokenAmount,
    address liquidator,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256)
```

Liquidates a portion of the borrower's debt using the lending token, called by a related contract.


Parameters:

| Name                | Type      | Description                                               |
| :------------------ | :-------- | :-------------------------------------------------------- |
| _account            | address   | The address of the borrower                               |
| _projectToken       | address   | The address of the project token                          |
| _lendingToken       | address   | The address of the lending token                          |
| _lendingTokenAmount | uint256   | The amount of lending tokens to be used for liquidation   |
| liquidator          | address   | The address of the liquidator                             |
| priceIds            | bytes32[] | The priceIds need to update.                              |
| updateData          | bytes[]   | The updateData provided by PythNetwork.                   |


Return values:

| Name | Type    | Description                                                                            |
| :--- | :------ | :------------------------------------------------------------------------------------- |
| [0]  | uint256 | projectTokenLiquidatorReceived The amount of project tokens received by the liquidator |
