# Solidity API

## IERC1363Spender

### onApprovalReceived

```solidity
function onApprovalReceived(address owner, uint256 value, bytes data) external returns (bytes4)
```

Handle the approval of ERC1363 tokens

_Any ERC1363 smart contract calls this function on the recipient
after an &#x60;approve&#x60;. This function MAY throw to revert and reject the
approval. Return of other than the magic value MUST result in the
transaction being reverted.
Note: the token contract address is always the message sender._

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | address The address which called &#x60;approveAndCall&#x60; function |
| value | uint256 | uint256 The amount of tokens to be spent |
| data | bytes | bytes Additional data with no specified format |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes4 | &#x60;bytes4(keccak256(&quot;onApprovalReceived(address,uint256,bytes)&quot;))&#x60;  unless throwing |

## IBErc20Token

### mint

```solidity
function mint(uint256 mintAmount) external returns (uint256)
```

Sender supplies assets into the market and receives cTokens in exchange

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| mintAmount | uint256 | The amount of the underlying asset to supply |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### redeem

```solidity
function redeem(uint256 redeemTokens) external returns (uint256)
```

Sender redeems cTokens in exchange for the underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemTokens | uint256 | The number of cTokens to redeem into underlying |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### redeemUnderlying

```solidity
function redeemUnderlying(uint256 redeemAmount) external returns (uint256)
```

Sender redeems cTokens in exchange for a specified amount of underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemAmount | uint256 | The amount of underlying to redeem |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### borrow

```solidity
function borrow(uint256 borrowAmount) external returns (uint256)
```

Sender borrows assets from the protocol to their own address

| Name | Type | Description |
| ---- | ---- | ----------- |
| borrowAmount | uint256 | The amount of the underlying asset to borrow |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### repayBorrow

```solidity
function repayBorrow(uint256 repayAmount) external returns (uint256)
```

Sender repays their own borrow

| Name | Type | Description |
| ---- | ---- | ----------- |
| repayAmount | uint256 | The amount to repay |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### repayBorrowBehalf

```solidity
function repayBorrowBehalf(address borrower, uint256 repayAmount) external returns (uint256)
```

Sender repays a borrow belonging to borrower

| Name | Type | Description |
| ---- | ---- | ----------- |
| borrower | address | the account with the debt being payed off |
| repayAmount | uint256 | The amount to repay |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### liquidateBorrow

```solidity
function liquidateBorrow(address borrower, uint256 repayAmount, address cTokenCollateral) external returns (uint256)
```

The sender liquidates the borrowers collateral.
 The collateral seized is transferred to the liquidator.

| Name | Type | Description |
| ---- | ---- | ----------- |
| borrower | address | The borrower of this cToken to be liquidated |
| repayAmount | uint256 | The amount of the underlying borrowed asset to repay |
| cTokenCollateral | address | The market in which to seize collateral from the borrower |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```

Get the token balance of the &#x60;owner&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of the account to query |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of tokens owned by &#x60;owner&#x60; |

### accountTokens

```solidity
function accountTokens(address owner) external returns (uint256)
```

Get the underlying balance of the &#x60;owner&#x60;

_This also accrues interest in a transaction_

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of the account to query |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of underlying owned by &#x60;owner&#x60; |

## Initializable

_This is a base contract to aid in writing upgradeable contracts, or any kind of contract that will be deployed
behind a proxy. Since a proxied contract can&#x27;t have a constructor, it&#x27;s common to move constructor logic to an
external initializer function, usually called &#x60;initialize&#x60;. It then becomes necessary to protect this initializer
function so it can only be called once. The {initializer} modifier provided by this contract will have this effect.

TIP: To avoid leaving the proxy in an uninitialized state, the initializer function should be called as early as
possible by providing the encoded function call as the &#x60;_data&#x60; argument to {ERC1967Proxy-constructor}.

CAUTION: When used with inheritance, manual care must be taken to not invoke a parent initializer twice, or to ensure
that all initializers are idempotent. This is not verified automatically as constructors are by Solidity._

### _initialized

```solidity
bool _initialized
```

_Indicates that the contract has been initialized._

### _initializing

```solidity
bool _initializing
```

_Indicates that the contract is in the process of being initialized._

### initializer

```solidity
modifier initializer()
```

_Modifier to protect an initializer function from being invoked twice._

## ReentrancyGuard

_Contract module that helps prevent reentrant calls to a function.

Inheriting from &#x60;ReentrancyGuard&#x60; will make the {nonReentrant} modifier
available, which can be applied to functions to make sure there are no nested
(reentrant) calls to them.

Note that because there is a single &#x60;nonReentrant&#x60; guard, functions marked as
&#x60;nonReentrant&#x60; may not call one another. This can be worked around by making
those functions &#x60;private&#x60;, and then adding &#x60;external&#x60; &#x60;nonReentrant&#x60; entry
points to them.

TIP: If you would like to learn more about reentrancy and alternative ways
to protect against it, check out our blog post
https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul]._

### _NOT_ENTERED

```solidity
uint256 _NOT_ENTERED
```

### _ENTERED

```solidity
uint256 _ENTERED
```

### _status

```solidity
uint256 _status
```

### constructor

```solidity
constructor() internal
```

### nonReentrant

```solidity
modifier nonReentrant()
```

_Prevents a contract from calling itself, directly or indirectly.
Calling a &#x60;nonReentrant&#x60; function from another &#x60;nonReentrant&#x60;
function is not supported. It is possible to prevent this from happening
by making the &#x60;nonReentrant&#x60; function external, and make it call a
&#x60;private&#x60; function that does the actual work._

## MerkleProof

_These functions deal with verification of Merkle Trees proofs.

The proofs can be generated using the JavaScript library
https://github.com/miguelmota/merkletreejs[merkletreejs].
Note: the hashing algorithm should be keccak256 and pair sorting should be enabled.

See &#x60;test/utils/cryptography/MerkleProof.test.js&#x60; for some examples._

### verify

```solidity
function verify(bytes32[] proof, bytes32 root, bytes32 leaf) internal pure returns (bool)
```

_Returns true if a &#x60;leaf&#x60; can be proved to be a part of a Merkle tree
defined by &#x60;root&#x60;. For this, a &#x60;proof&#x60; must be provided, containing
sibling hashes on the branch from the leaf to the root of the tree. Each
pair of leaves and each pair of pre-images are assumed to be sorted._

## Create2

_Helper to make usage of the &#x60;CREATE2&#x60; EVM opcode easier and safer.
&#x60;CREATE2&#x60; can be used to compute in advance the address where a smart
contract will be deployed, which allows for interesting new mechanisms known
as &#x27;counterfactual interactions&#x27;.

See the https://eips.ethereum.org/EIPS/eip-1014#motivation[EIP] for more
information._

### deploy

```solidity
function deploy(uint256 amount, bytes32 salt, bytes bytecode) internal returns (address)
```

_Deploys a contract using &#x60;CREATE2&#x60;. The address where the contract
will be deployed can be known in advance via {computeAddress}.

The bytecode for a contract can be obtained from Solidity with
&#x60;type(contractName).creationCode&#x60;.

Requirements:

- &#x60;bytecode&#x60; must not be empty.
- &#x60;salt&#x60; must have not been used for &#x60;bytecode&#x60; already.
- the factory must have a balance of at least &#x60;amount&#x60;.
- if &#x60;amount&#x60; is non-zero, &#x60;bytecode&#x60; must have a &#x60;payable&#x60; constructor._

### computeAddress

```solidity
function computeAddress(bytes32 salt, bytes32 bytecodeHash) internal view returns (address)
```

_Returns the address where a contract will be stored if deployed via {deploy}. Any change in the
&#x60;bytecodeHash&#x60; or &#x60;salt&#x60; will result in a new destination address._

### computeAddress

```solidity
function computeAddress(bytes32 salt, bytes32 bytecodeHash, address deployer) internal pure returns (address)
```

_Returns the address where a contract will be stored if deployed via {deploy} from a contract located at
&#x60;deployer&#x60;. If &#x60;deployer&#x60; is this contract&#x27;s address, returns the same value as {computeAddress}._

## IUniswapV2Factory

### PairCreated

```solidity
event PairCreated(address token0, address token1, address pair, uint256)
```

### feeTo

```solidity
function feeTo() external view returns (address)
```

### feeToSetter

```solidity
function feeToSetter() external view returns (address)
```

### getPair

```solidity
function getPair(address tokenA, address tokenB) external view returns (address pair)
```

### allPairs

```solidity
function allPairs(uint256) external view returns (address pair)
```

### allPairsLength

```solidity
function allPairsLength() external view returns (uint256)
```

### createPair

```solidity
function createPair(address tokenA, address tokenB) external returns (address pair)
```

### setFeeTo

```solidity
function setFeeTo(address) external
```

### setFeeToSetter

```solidity
function setFeeToSetter(address) external
```

## MerkleProofUpgradeable

_These functions deal with verification of Merkle Trees proofs.

The proofs can be generated using the JavaScript library
https://github.com/miguelmota/merkletreejs[merkletreejs].
Note: the hashing algorithm should be keccak256 and pair sorting should be enabled.

See &#x60;test/utils/cryptography/MerkleProof.test.js&#x60; for some examples._

### verify

```solidity
function verify(bytes32[] proof, bytes32 root, bytes32 leaf) internal pure returns (bool)
```

_Returns true if a &#x60;leaf&#x60; can be proved to be a part of a Merkle tree
defined by &#x60;root&#x60;. For this, a &#x60;proof&#x60; must be provided, containing
sibling hashes on the branch from the leaf to the root of the tree. Each
pair of leaves and each pair of pre-images are assumed to be sorted._

## ClonesUpgradeable

_https://eips.ethereum.org/EIPS/eip-1167[EIP 1167] is a standard for
deploying minimal proxy contracts, also known as &quot;clones&quot;.

&gt; To simply and cheaply clone contract functionality in an immutable way, this standard specifies
&gt; a minimal bytecode implementation that delegates all calls to a known, fixed address.

The library includes functions to deploy a proxy using either &#x60;create&#x60; (traditional deployment) or &#x60;create2&#x60;
(salted deterministic deployment). It also includes functions to predict the addresses of clones deployed using the
deterministic method.

_Available since v3.4.__

### clone

```solidity
function clone(address implementation) internal returns (address instance)
```

_Deploys and returns the address of a clone that mimics the behaviour of &#x60;implementation&#x60;.

This function uses the create opcode, which should never revert._

### cloneDeterministic

```solidity
function cloneDeterministic(address implementation, bytes32 salt) internal returns (address instance)
```

_Deploys and returns the address of a clone that mimics the behaviour of &#x60;implementation&#x60;.

This function uses the create2 opcode and a &#x60;salt&#x60; to deterministically deploy
the clone. Using the same &#x60;implementation&#x60; and &#x60;salt&#x60; multiple time will revert, since
the clones cannot be deployed twice at the same address._

### predictDeterministicAddress

```solidity
function predictDeterministicAddress(address implementation, bytes32 salt, address deployer) internal pure returns (address predicted)
```

_Computes the address of a clone deployed using {Clones-cloneDeterministic}._

### predictDeterministicAddress

```solidity
function predictDeterministicAddress(address implementation, bytes32 salt) internal view returns (address predicted)
```

_Computes the address of a clone deployed using {Clones-cloneDeterministic}._

## PrimaryIndexToken

### MODERATOR_ROLE

```solidity
bytes32 MODERATOR_ROLE
```

### name

```solidity
string name
```

### symbol

```solidity
string symbol
```

### priceOracle

```solidity
contract IPriceProviderAggregator priceOracle
```

### projectTokens

```solidity
address[] projectTokens
```

### projectTokenInfo

```solidity
mapping(address &#x3D;&gt; struct PrimaryIndexToken.ProjectTokenInfo) projectTokenInfo
```

### lendingTokens

```solidity
address[] lendingTokens
```

### lendingTokenInfo

```solidity
mapping(address &#x3D;&gt; struct PrimaryIndexToken.LendingTokenInfo) lendingTokenInfo
```

### totalDepositedProjectToken

```solidity
mapping(address &#x3D;&gt; uint256) totalDepositedProjectToken
```

### depositPosition

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; struct PrimaryIndexToken.DepositPosition))) depositPosition
```

### borrowPosition

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; struct PrimaryIndexToken.BorrowPosition))) borrowPosition
```

### totalBorrow

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) totalBorrow
```

### borrowLimit

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) borrowLimit
```

### Ratio

```solidity
struct Ratio {
  uint8 numerator;
  uint8 denominator;
}
```

### ProjectTokenInfo

```solidity
struct ProjectTokenInfo {
  bool isListed;
  bool isDepositPaused;
  bool isWithdrawPaused;
  struct PrimaryIndexToken.Ratio loanToValueRatio;
  struct PrimaryIndexToken.Ratio liquidationThresholdFactor;
  struct PrimaryIndexToken.Ratio liquidationIncentive;
}
```

### LendingTokenInfo

```solidity
struct LendingTokenInfo {
  bool isListed;
  bool isPaused;
  contract BLendingToken bLendingToken;
}
```

### DepositPosition

```solidity
struct DepositPosition {
  uint256 depositedProjectTokenAmount;
}
```

### BorrowPosition

```solidity
struct BorrowPosition {
  uint256 loanBody;
  uint256 accrual;
}
```

### AddPrjToken

```solidity
event AddPrjToken(address tokenPrj)
```

### LoanToValueRatioSet

```solidity
event LoanToValueRatioSet(address tokenPrj, uint8 lvrNumerator, uint8 lvrDenominator)
```

### LiquidationThresholdFactorSet

```solidity
event LiquidationThresholdFactorSet(address tokenPrj, uint8 ltfNumerator, uint8 ltfDenominator)
```

### LiquidationIncentiveSet

```solidity
event LiquidationIncentiveSet(address tokenPrj, uint8 ltfNumerator, uint8 ltfDenominator)
```

### Deposit

```solidity
event Deposit(address who, address tokenPrj, address lendingToken, uint256 prjDepositAmount, address beneficiary)
```

### Withdraw

```solidity
event Withdraw(address who, address tokenPrj, address lendingToken, uint256 prjWithdrawAmount, address beneficiary)
```

### Supply

```solidity
event Supply(address who, address supplyToken, uint256 supplyAmount, address supplyBToken, uint256 amountSupplyBTokenReceived)
```

### Redeem

```solidity
event Redeem(address who, address redeemToken, address redeemBToken, uint256 redeemAmount)
```

### RedeemUnderlying

```solidity
event RedeemUnderlying(address who, address redeemToken, address redeemBToken, uint256 redeemAmountUnderlying)
```

### Borrow

```solidity
event Borrow(address who, address borrowToken, uint256 borrowAmount, address prjAddress, uint256 prjAmount)
```

### RepayBorrow

```solidity
event RepayBorrow(address who, address borrowToken, uint256 borrowAmount, address prjAddress, bool isPositionFullyRepaid)
```

### Liquidate

```solidity
event Liquidate(address liquidator, address borrower, address lendingToken, address prjAddress, uint256 amountPrjLiquidated)
```

### initialize

```solidity
function initialize() public
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

### onlyModerator

```solidity
modifier onlyModerator()
```

### isProjectTokenListed

```solidity
modifier isProjectTokenListed(address projectToken)
```

### isLendingTokenListed

```solidity
modifier isLendingTokenListed(address lendingToken)
```

### addProjectToken

```solidity
function addProjectToken(address _projectToken, uint8 _loanToValueRatioNumerator, uint8 _loanToValueRatioDenominator, uint8 _liquidationThresholdFactorNumerator, uint8 _liquidationThresholdFactorDenominator, uint8 _liquidationIncentiveNumerator, uint8 _liquidationIncentiveDenominator) public
```

### removeProjectToken

```solidity
function removeProjectToken(uint256 _projectTokenId) public
```

### addLendingToken

```solidity
function addLendingToken(address _lendingToken, address _bLendingToken, bool _isPaused) public
```

### removeLendingToken

```solidity
function removeLendingToken(uint256 _lendingTokenId) public
```

### setPriceOracle

```solidity
function setPriceOracle(address _priceOracle) public
```

### grandModerator

```solidity
function grandModerator(address newModerator) public
```

### revokeModerator

```solidity
function revokeModerator(address moderator) public
```

### setBorrowLimit

```solidity
function setBorrowLimit(address projectToken, address lendingToken, uint256 _borrowLimit) public
```

### setProjectTokenInfo

```solidity
function setProjectTokenInfo(address _projectToken, uint8 _loanToValueRatioNumerator, uint8 _loanToValueRatioDenominator, uint8 _liquidationThresholdFactorNumerator, uint8 _liquidationThresholdFactorDenominator, uint8 _liquidationIncentiveNumerator, uint8 _liquidationIncentiveDenominator) public
```

### setPausedProjectToken

```solidity
function setPausedProjectToken(address _projectToken, bool _isDepositPaused, bool _isWithdrawPaused) public
```

### setLendingTokenInfo

```solidity
function setLendingTokenInfo(address _lendingToken, address _bLendingToken, bool _isPaused) public
```

### setPausedLendingToken

```solidity
function setPausedLendingToken(address _lendingToken, bool _isPaused) public
```

### deposit

```solidity
function deposit(address projectToken, address lendingToken, uint256 projectTokenAmount) public
```

### withdraw

```solidity
function withdraw(address projectToken, address lendingToken, uint256 projectTokenAmount) public
```

### supply

```solidity
function supply(address lendingToken, uint256 lendingTokenAmount) public
```

### redeem

```solidity
function redeem(address lendingToken, uint256 bLendingTokenAmount) public
```

### redeemUnderlying

```solidity
function redeemUnderlying(address lendingToken, uint256 lendingTokenAmount) public
```

### borrow

```solidity
function borrow(address projectToken, address lendingToken, uint256 lendingTokenAmount) public
```

### repay

```solidity
function repay(address projectToken, address lendingToken, uint256 lendingTokenAmount) public returns (uint256)
```

### repayInternal

```solidity
function repayInternal(address repairer, address borrower, address projectToken, address lendingToken, uint256 lendingTokenAmount) internal returns (uint256)
```

### liquidate

```solidity
function liquidate(address account, address projectToken, address lendingToken) public
```

### updateInterestInBorrowPositions

```solidity
function updateInterestInBorrowPositions(address account, address lendingToken) public
```

### pit

```solidity
function pit(address account, address projectToken, address lendingToken) public view returns (uint256)
```

### pitRemaining

```solidity
function pitRemaining(address account, address projectToken, address lendingToken) public view returns (uint256)
```

### liquidationThreshold

```solidity
function liquidationThreshold(address account, address projectToken, address lendingToken) public view returns (uint256)
```

### totalOutstanding

```solidity
function totalOutstanding(address account, address projectToken, address lendingToken) public view returns (uint256)
```

### healthFactor

```solidity
function healthFactor(address account, address projectToken, address lendingToken) public view returns (uint256 numerator, uint256 denominator)
```

### getProjectTokenEvaluation

```solidity
function getProjectTokenEvaluation(address projectToken, uint256 projectTokenAmount) public view returns (uint256)
```

### lendingTokensLength

```solidity
function lendingTokensLength() public view returns (uint256)
```

### projectTokensLength

```solidity
function projectTokensLength() public view returns (uint256)
```

### getPosition

```solidity
function getPosition(address account, address projectToken, address lendingToken) public view returns (uint256 depositedProjectTokenAmount, uint256 loanBody, uint256 accrual, uint256 healthFactorNumerator, uint256 healthFactorDenominator)
```

### decimals

```solidity
function decimals() public pure returns (uint8)
```

## PrimaryLendingPlatformProxyAdmin

### minimumDelayPeriod

```solidity
uint256 minimumDelayPeriod
```

### delayPeriod

```solidity
uint256 delayPeriod
```

### UpgradeData

```solidity
struct UpgradeData {
  uint256 appendTimestamp;
  uint256 delayPeriod;
  address oldImplementation;
  address newImplementation;
}
```

### upgradeData

```solidity
mapping(address &#x3D;&gt; struct PrimaryLendingPlatformProxyAdmin.UpgradeData) upgradeData
```

### SetDelayPeriod

```solidity
event SetDelayPeriod(uint256 oldDelayPeriod, uint256 newDelayPeriod)
```

### AppendUpgrade

```solidity
event AppendUpgrade(address proxy, uint256 appendTimestamp, uint256 delayPeriod, address oldImplementation, address newImplementation)
```

### Upgrade

```solidity
event Upgrade(address proxy, uint256 upgradeTimestamp, address oldImplementation, address newImplementation)
```

### constructor

```solidity
constructor() public
```

### setDelayPeriod

```solidity
function setDelayPeriod(uint256 _delayPeriod) public
```

### changeProxyAdmin

```solidity
function changeProxyAdmin(contract TransparentUpgradeableProxy proxy, address newAdmin) public
```

_Changes the admin of &#x60;proxy&#x60; to &#x60;newAdmin&#x60;.

Requirements:

- This contract must be the current admin of &#x60;proxy&#x60;._

### appendUpgrade

```solidity
function appendUpgrade(contract TransparentUpgradeableProxy proxy, address newImplementation) public
```

### upgrade

```solidity
function upgrade(contract TransparentUpgradeableProxy proxy, address implementation) public
```

_Upgrades &#x60;proxy&#x60; to &#x60;implementation&#x60;. See {TransparentUpgradeableProxy-upgradeTo}.

Requirements:

- This contract must be the admin of &#x60;proxy&#x60;._

### upgradeAndCall

```solidity
function upgradeAndCall(contract TransparentUpgradeableProxy proxy, address implementation, bytes data) public payable
```

_Upgrades &#x60;proxy&#x60; to &#x60;implementation&#x60; and calls a function on the new implementation. See
{TransparentUpgradeableProxy-upgradeToAndCall}.

Requirements:

- This contract must be the admin of &#x60;proxy&#x60;._

## BErc20

CTokens which wrap an EIP-20 underlying

### initialize

```solidity
function initialize(address underlying_, contract Bondtroller comptroller_, contract InterestRateModel interestRateModel_, uint256 initialExchangeRateMantissa_, string name_, string symbol_, uint8 decimals_) public
```

Initialize the new money market

| Name | Type | Description |
| ---- | ---- | ----------- |
| underlying_ | address | The address of the underlying asset |
| comptroller_ | contract Bondtroller | The address of the Comptroller |
| interestRateModel_ | contract InterestRateModel | The address of the interest rate model |
| initialExchangeRateMantissa_ | uint256 | The initial exchange rate, scaled by 1e18 |
| name_ | string | ERC-20 name of this token |
| symbol_ | string | ERC-20 symbol of this token |
| decimals_ | uint8 | ERC-20 decimal precision of this token |

### sweepToken

```solidity
function sweepToken(contract EIP20NonStandardInterface token) external
```

A public function to sweep accidental ERC-20 transfers to this contract. Tokens are sent to admin (timelock)

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | contract EIP20NonStandardInterface | The address of the ERC-20 token to sweep |

### _addReserves

```solidity
function _addReserves(uint256 addAmount) external returns (uint256)
```

The sender adds to reserves.

| Name | Type | Description |
| ---- | ---- | ----------- |
| addAmount | uint256 | The amount fo underlying token to add as reserves |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### getCashPrior

```solidity
function getCashPrior() internal view returns (uint256)
```

Gets balance of this contract in terms of the underlying

_This excludes the value of the current message, if any_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The quantity of underlying tokens owned by this contract |

### doTransferIn

```solidity
function doTransferIn(address from, uint256 amount) internal returns (uint256)
```

_Similar to EIP20 transfer, except it handles a False result from &#x60;transferFrom&#x60; and reverts in that case.
     This will revert due to insufficient balance or insufficient allowance.
     This function returns the actual amount received,
     which may be less than &#x60;amount&#x60; if there is a fee attached to the transfer.

     Note: This wrapper safely handles non-standard ERC-20 tokens that do not return a value.
           See here: https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca_

### doTransferOut

```solidity
function doTransferOut(address payable to, uint256 amount) internal
```

_Similar to EIP20 transfer, except it handles a False success from &#x60;transfer&#x60; and returns an explanatory
     error code rather than reverting. If caller has not called checked protocol&#x27;s balance, this may revert due to
     insufficient cash held in this contract. If caller has checked protocol&#x27;s balance prior to this call, and verified
     it is &gt;&#x3D; amount, this should not revert in normal conditions.

     Note: This wrapper safely handles non-standard ERC-20 tokens that do not return a value.
           See here: https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca_

## BEther

CToken which wraps Ether

### constructor

```solidity
constructor(contract Bondtroller bondtroller_, contract InterestRateModel interestRateModel_, uint256 initialExchangeRateMantissa_, string name_, string symbol_, uint8 decimals_, address payable admin_) public
```

Construct a new CEther money market

| Name | Type | Description |
| ---- | ---- | ----------- |
| bondtroller_ | contract Bondtroller | The address of the Comptroller |
| interestRateModel_ | contract InterestRateModel | The address of the interest rate model |
| initialExchangeRateMantissa_ | uint256 | The initial exchange rate, scaled by 1e18 |
| name_ | string | ERC-20 name of this token |
| symbol_ | string | ERC-20 symbol of this token |
| decimals_ | uint8 | ERC-20 decimal precision of this token |
| admin_ | address payable | Address of the administrator of this token |

### mint

```solidity
function mint() external payable
```

Sender supplies assets into the market and receives cTokens in exchange

_Reverts upon any failure_

### redeem

```solidity
function redeem(uint256 redeemTokens) external returns (uint256)
```

Sender redeems cTokens in exchange for the underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemTokens | uint256 | The number of cTokens to redeem into underlying |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### redeemUnderlying

```solidity
function redeemUnderlying(uint256 redeemAmount) external returns (uint256)
```

Sender redeems cTokens in exchange for a specified amount of underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemAmount | uint256 | The amount of underlying to redeem |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### borrow

```solidity
function borrow(uint256 borrowAmount) external returns (uint256)
```

Sender borrows assets from the protocol to their own address

| Name | Type | Description |
| ---- | ---- | ----------- |
| borrowAmount | uint256 | The amount of the underlying asset to borrow |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### repayBorrow

```solidity
function repayBorrow() external payable
```

Sender repays their own borrow

_Reverts upon any failure_

### repayBorrowBehalf

```solidity
function repayBorrowBehalf(address borrower) external payable
```

Sender repays a borrow belonging to borrower

_Reverts upon any failure_

| Name | Type | Description |
| ---- | ---- | ----------- |
| borrower | address | the account with the debt being payed off |

### _addReserves

```solidity
function _addReserves() external payable returns (uint256)
```

The sender adds to reserves.

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### fallback

```solidity
fallback() external payable
```

Send Ether to CEther to mint

### receive

```solidity
receive() external payable
```

### getCashPrior

```solidity
function getCashPrior() internal view returns (uint256)
```

Gets balance of this contract in terms of Ether, before this message

_This excludes the value of the current message, if any_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The quantity of Ether owned by this contract |

### doTransferIn

```solidity
function doTransferIn(address from, uint256 amount) internal returns (uint256)
```

Perform the actual transfer in, which is a no-op

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | Address sending the Ether |
| amount | uint256 | Amount of Ether being sent |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The actual amount of Ether transferred |

### doTransferOut

```solidity
function doTransferOut(address payable to, uint256 amount) internal
```

_Performs a transfer out, ideally returning an explanatory error code upon failure tather than reverting.
 If caller has not called checked protocol&#x27;s balance, may revert due to insufficient cash held in the contract.
 If caller has checked protocol&#x27;s balance, and verified it is &gt;&#x3D; amount, this should not revert in normal conditions.
/
    f_

### requireNoError

```solidity
function requireNoError(uint256 errCode, string message) internal pure
```

## BLendingToken

### MODERATOR_ROLE

```solidity
bytes32 MODERATOR_ROLE
```

### primaryIndexToken

```solidity
address primaryIndexToken
```

### SetPrimaryIndexToken

```solidity
event SetPrimaryIndexToken(address oldPrimaryIndexToken, address newPrimaryIndexToken)
```

### init

```solidity
function init(address underlying_, contract Bondtroller bondtroller_, contract InterestRateModel interestRateModel_, uint256 initialExchangeRateMantissa_, string name_, string symbol_, uint8 decimals_, address admin_) public
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

### onlyPrimaryIndexToken

```solidity
modifier onlyPrimaryIndexToken()
```

### onlyModerator

```solidity
modifier onlyModerator()
```

### setPrimaryIndexToken

```solidity
function setPrimaryIndexToken(address _primaryIndexToken) public
```

### grandModerator

```solidity
function grandModerator(address newModerator) public
```

### revokeModerator

```solidity
function revokeModerator(address moderator) public
```

### setReserveFactor

```solidity
function setReserveFactor(uint256 reserveFactorMantissa) public
```

### mintTo

```solidity
function mintTo(address minter, uint256 mintAmount) external returns (uint256 err, uint256 mintedAmount)
```

### redeemTo

```solidity
function redeemTo(address redeemer, uint256 redeemTokens) external returns (uint256 redeemErr)
```

### redeemUnderlyingTo

```solidity
function redeemUnderlyingTo(address redeemer, uint256 redeemAmount) external returns (uint256 redeemUnderlyingError)
```

### borrowTo

```solidity
function borrowTo(address borrower, uint256 borrowAmount) external returns (uint256 borrowError)
```

### repayTo

```solidity
function repayTo(address payer, address borrower, uint256 repayAmount) external returns (uint256 repayBorrowError, uint256 amountRepayed)
```

### getEstimatedBorrowIndex

```solidity
function getEstimatedBorrowIndex() public view returns (uint256)
```

### getEstimatedBorrowBalanceStored

```solidity
function getEstimatedBorrowBalanceStored(address account) public view returns (uint256 accrual)
```

## BToken

Abstract base for CTokens

### initialize

```solidity
function initialize(contract Bondtroller bondtroller_, contract InterestRateModel interestRateModel_, uint256 initialExchangeRateMantissa_, string name_, string symbol_, uint8 decimals_) public
```

Initialize the money market

| Name | Type | Description |
| ---- | ---- | ----------- |
| bondtroller_ | contract Bondtroller | The address of the Bondtroller |
| interestRateModel_ | contract InterestRateModel | The address of the interest rate model |
| initialExchangeRateMantissa_ | uint256 | The initial exchange rate, scaled by 1e18 |
| name_ | string | EIP-20 name of this token |
| symbol_ | string | EIP-20 symbol of this token |
| decimals_ | uint8 | EIP-20 decimal precision of this token |

### transferTokens

```solidity
function transferTokens(address spender, address src, address dst, uint256 tokens) internal returns (uint256)
```

Transfer &#x60;tokens&#x60; tokens from &#x60;src&#x60; to &#x60;dst&#x60; by &#x60;spender&#x60;

_Called by both &#x60;transfer&#x60; and &#x60;transferFrom&#x60; internally_

| Name | Type | Description |
| ---- | ---- | ----------- |
| spender | address | The address of the account performing the transfer |
| src | address | The address of the source account |
| dst | address | The address of the destination account |
| tokens | uint256 | The number of tokens to transfer |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Whether or not the transfer succeeded |

### transfer

```solidity
function transfer(address dst, uint256 amount) external returns (bool)
```

Transfer &#x60;amount&#x60; tokens from &#x60;msg.sender&#x60; to &#x60;dst&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| dst | address | The address of the destination account |
| amount | uint256 | The number of tokens to transfer |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | Whether or not the transfer succeeded |

### transferFrom

```solidity
function transferFrom(address src, address dst, uint256 amount) external returns (bool)
```

Transfer &#x60;amount&#x60; tokens from &#x60;src&#x60; to &#x60;dst&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| src | address | The address of the source account |
| dst | address | The address of the destination account |
| amount | uint256 | The number of tokens to transfer |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | Whether or not the transfer succeeded |

### approve

```solidity
function approve(address spender, uint256 amount) external returns (bool)
```

Approve &#x60;spender&#x60; to transfer up to &#x60;amount&#x60; from &#x60;src&#x60;

_This will overwrite the approval amount for &#x60;spender&#x60;
 and is subject to issues noted [here](https://eips.ethereum.org/EIPS/eip-20#approve)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| spender | address | The address of the account which may transfer tokens |
| amount | uint256 | The number of tokens that are approved (-1 means infinite) |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | Whether or not the approval succeeded |

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```

Get the current allowance from &#x60;owner&#x60; for &#x60;spender&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of the account which owns the tokens to be spent |
| spender | address | The address of the account which may transfer tokens |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of tokens allowed to be spent (-1 means infinite) |

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```

Get the token balance of the &#x60;owner&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of the account to query |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of tokens owned by &#x60;owner&#x60; |

### balanceOfUnderlying

```solidity
function balanceOfUnderlying(address owner) external returns (uint256)
```

Get the underlying balance of the &#x60;owner&#x60;

_This also accrues interest in a transaction_

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of the account to query |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of underlying owned by &#x60;owner&#x60; |

### balanceOfUnderlyingView

```solidity
function balanceOfUnderlyingView(address owner) external view returns (uint256)
```

### getAccountSnapshot

```solidity
function getAccountSnapshot(address account) external view returns (uint256, uint256, uint256, uint256)
```

Get a snapshot of the account&#x27;s balances, and the cached exchange rate

_This is used by bondtroller to more efficiently perform liquidity checks._

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the account to snapshot |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | (possible error, token balance, borrow balance, exchange rate mantissa) |
| [1] | uint256 |  |
| [2] | uint256 |  |
| [3] | uint256 |  |

### getBlockNumber

```solidity
function getBlockNumber() internal view returns (uint256)
```

_Function to simply retrieve block number
 This exists mainly for inheriting test contracts to stub this result._

### borrowRatePerBlock

```solidity
function borrowRatePerBlock() external view returns (uint256)
```

Returns the current per-block borrow interest rate for this cToken

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The borrow interest rate per block, scaled by 1e18 |

### supplyRatePerBlock

```solidity
function supplyRatePerBlock() external view returns (uint256)
```

Returns the current per-block supply interest rate for this cToken

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The supply interest rate per block, scaled by 1e18 |

### totalBorrowsCurrent

```solidity
function totalBorrowsCurrent() external returns (uint256)
```

Returns the current total borrows plus accrued interest

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total borrows with interest |

### borrowBalanceCurrent

```solidity
function borrowBalanceCurrent(address account) external returns (uint256)
```

Accrue interest to updated borrowIndex and then calculate account&#x27;s borrow balance using the updated borrowIndex

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address whose balance should be calculated after updating borrowIndex |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The calculated balance |

### borrowBalanceStored

```solidity
function borrowBalanceStored(address account) public view returns (uint256)
```

Return the borrow balance of account based on stored data

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address whose balance should be calculated |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The calculated balance |

### borrowBalanceStoredInternal

```solidity
function borrowBalanceStoredInternal(address account) internal view returns (enum CarefulMath.MathError, uint256)
```

Return the borrow balance of account based on stored data

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address whose balance should be calculated |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum CarefulMath.MathError | (error code, the calculated balance or 0 if error code is non-zero) |
| [1] | uint256 |  |

### exchangeRateCurrent

```solidity
function exchangeRateCurrent() public returns (uint256)
```

Accrue interest then return the up-to-date exchange rate

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Calculated exchange rate scaled by 1e18 |

### exchangeRateStored

```solidity
function exchangeRateStored() public view returns (uint256)
```

Calculates the exchange rate from the underlying to the CToken

_This function does not accrue interest before calculating the exchange rate_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Calculated exchange rate scaled by 1e18 |

### exchangeRateStoredInternal

```solidity
function exchangeRateStoredInternal() internal view returns (enum CarefulMath.MathError, uint256)
```

Calculates the exchange rate from the underlying to the CToken

_This function does not accrue interest before calculating the exchange rate_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum CarefulMath.MathError | (error code, calculated exchange rate scaled by 1e18) |
| [1] | uint256 |  |

### getCash

```solidity
function getCash() external view returns (uint256)
```

Get cash balance of this cToken in the underlying asset

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The quantity of underlying asset owned by this contract |

### accrueInterest

```solidity
function accrueInterest() public returns (uint256)
```

Applies accrued interest to total borrows and reserves

_This calculates interest accrued from the last checkpointed block
  up to the current block and writes new checkpoint to storage._

### mintInternal

```solidity
function mintInternal(uint256 mintAmount) internal returns (uint256, uint256)
```

Sender supplies assets into the market and receives cTokens in exchange

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| mintAmount | uint256 | The amount of the underlying asset to supply |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | (uint, uint) An error code (0&#x3D;success, otherwise a failure, see ErrorReporter.sol), and the actual mint amount. |
| [1] | uint256 |  |

### MintLocalVars

```solidity
struct MintLocalVars {
  enum TokenErrorReporter.Error err;
  enum CarefulMath.MathError mathErr;
  uint256 exchangeRateMantissa;
  uint256 mintTokens;
  uint256 totalSupplyNew;
  uint256 accountTokensNew;
  uint256 actualMintAmount;
}
```

### mintFresh

```solidity
function mintFresh(address minter, uint256 mintAmount) internal returns (uint256, uint256)
```

User supplies assets into the market and receives cTokens in exchange

_Assumes interest has already been accrued up to the current block_

| Name | Type | Description |
| ---- | ---- | ----------- |
| minter | address | The address of the account which is supplying the assets |
| mintAmount | uint256 | The amount of the underlying asset to supply |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | (uint, uint) An error code (0&#x3D;success, otherwise a failure, see ErrorReporter.sol), and the actual mint amount. |
| [1] | uint256 |  |

### redeemInternal

```solidity
function redeemInternal(uint256 redeemTokens) internal returns (uint256)
```

Sender redeems cTokens in exchange for the underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemTokens | uint256 | The number of cTokens to redeem into underlying |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### redeemUnderlyingInternal

```solidity
function redeemUnderlyingInternal(uint256 redeemAmount) internal returns (uint256)
```

Sender redeems cTokens in exchange for a specified amount of underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemAmount | uint256 | The amount of underlying to receive from redeeming cTokens |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### RedeemLocalVars

```solidity
struct RedeemLocalVars {
  enum TokenErrorReporter.Error err;
  enum CarefulMath.MathError mathErr;
  uint256 exchangeRateMantissa;
  uint256 redeemTokens;
  uint256 redeemAmount;
  uint256 totalSupplyNew;
  uint256 accountTokensNew;
}
```

### redeemFresh

```solidity
function redeemFresh(address payable redeemer, uint256 redeemTokensIn, uint256 redeemAmountIn) internal returns (uint256)
```

User redeems cTokens in exchange for the underlying asset

_Assumes interest has already been accrued up to the current block_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemer | address payable | The address of the account which is redeeming the tokens |
| redeemTokensIn | uint256 | The number of cTokens to redeem into underlying (only one of redeemTokensIn or redeemAmountIn may be non-zero) |
| redeemAmountIn | uint256 | The number of underlying tokens to receive from redeeming cTokens (only one of redeemTokensIn or redeemAmountIn may be non-zero) |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### borrowInternal

```solidity
function borrowInternal(uint256 borrowAmount) internal returns (uint256)
```

Sender borrows assets from the protocol to their own address

| Name | Type | Description |
| ---- | ---- | ----------- |
| borrowAmount | uint256 | The amount of the underlying asset to borrow |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### BorrowLocalVars

```solidity
struct BorrowLocalVars {
  enum CarefulMath.MathError mathErr;
  uint256 accountBorrows;
  uint256 accountBorrowsNew;
  uint256 totalBorrowsNew;
}
```

### borrowFresh

```solidity
function borrowFresh(address payable borrower, uint256 borrowAmount) internal returns (uint256)
```

Users borrow assets from the protocol to their own address

| Name | Type | Description |
| ---- | ---- | ----------- |
| borrower | address payable |  |
| borrowAmount | uint256 | The amount of the underlying asset to borrow |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### repayBorrowInternal

```solidity
function repayBorrowInternal(uint256 repayAmount) internal returns (uint256, uint256)
```

Sender repays their own borrow

| Name | Type | Description |
| ---- | ---- | ----------- |
| repayAmount | uint256 | The amount to repay |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | (uint, uint) An error code (0&#x3D;success, otherwise a failure, see ErrorReporter.sol), and the actual repayment amount. |
| [1] | uint256 |  |

### repayBorrowBehalfInternal

```solidity
function repayBorrowBehalfInternal(address borrower, uint256 repayAmount) internal returns (uint256, uint256)
```

Sender repays a borrow belonging to borrower

| Name | Type | Description |
| ---- | ---- | ----------- |
| borrower | address | the account with the debt being payed off |
| repayAmount | uint256 | The amount to repay |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | (uint, uint) An error code (0&#x3D;success, otherwise a failure, see ErrorReporter.sol), and the actual repayment amount. |
| [1] | uint256 |  |

### RepayBorrowLocalVars

```solidity
struct RepayBorrowLocalVars {
  enum TokenErrorReporter.Error err;
  enum CarefulMath.MathError mathErr;
  uint256 repayAmount;
  uint256 borrowerIndex;
  uint256 accountBorrows;
  uint256 accountBorrowsNew;
  uint256 totalBorrowsNew;
  uint256 actualRepayAmount;
}
```

### repayBorrowFresh

```solidity
function repayBorrowFresh(address payer, address borrower, uint256 repayAmount) internal returns (uint256, uint256)
```

Borrows are repaid by another user (possibly the borrower).

| Name | Type | Description |
| ---- | ---- | ----------- |
| payer | address | the account paying off the borrow |
| borrower | address | the account with the debt being payed off |
| repayAmount | uint256 | the amount of undelrying tokens being returned |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | (uint, uint) An error code (0&#x3D;success, otherwise a failure, see ErrorReporter.sol), and the actual repayment amount. |
| [1] | uint256 |  |

### _setPendingAdmin

```solidity
function _setPendingAdmin(address payable newPendingAdmin) external returns (uint256)
```

Begins transfer of admin rights. The newPendingAdmin must call &#x60;_acceptAdmin&#x60; to finalize the transfer.

_Admin function to begin change of admin. The newPendingAdmin must call &#x60;_acceptAdmin&#x60; to finalize the transfer._

| Name | Type | Description |
| ---- | ---- | ----------- |
| newPendingAdmin | address payable | New pending admin. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### _acceptAdmin

```solidity
function _acceptAdmin() external returns (uint256)
```

Accepts transfer of admin rights. msg.sender must be pendingAdmin

_Admin function for pending admin to accept role and update admin_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### _setBondtroller

```solidity
function _setBondtroller(contract Bondtroller newBondtroller) public returns (uint256)
```

Sets a new bondtroller for the market

_Admin function to set a new bondtroller_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) / |

### _setReserveFactor

```solidity
function _setReserveFactor(uint256 newReserveFactorMantissa) external returns (uint256)
```

accrues interest and sets a new reserve factor for the protocol using _setReserveFactorFresh

_Admin function to accrue interest and set a new reserve factor_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) / |

### _setReserveFactorFresh

```solidity
function _setReserveFactorFresh(uint256 newReserveFactorMantissa) internal returns (uint256)
```

Sets a new reserve factor for the protocol (*requires fresh interest accrual)

_Admin function to set a new reserve factor_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) / |

### _addReservesInternal

```solidity
function _addReservesInternal(uint256 addAmount) internal returns (uint256)
```

Accrues interest and reduces reserves by transferring from msg.sender

| Name | Type | Description |
| ---- | ---- | ----------- |
| addAmount | uint256 | Amount of addition to reserves |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) / |

### _addReservesFresh

```solidity
function _addReservesFresh(uint256 addAmount) internal returns (uint256, uint256)
```

Add reserves by transferring from caller

_Requires fresh interest accrual_

| Name | Type | Description |
| ---- | ---- | ----------- |
| addAmount | uint256 | Amount of addition to reserves |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | (uint, uint) An error code (0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details)) and the actual amount added, net token fees / |
| [1] | uint256 |  |

### _reduceReserves

```solidity
function _reduceReserves(uint256 reduceAmount) external returns (uint256)
```

Accrues interest and reduces reserves by transferring to admin

| Name | Type | Description |
| ---- | ---- | ----------- |
| reduceAmount | uint256 | Amount of reduction to reserves |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) / |

### _reduceReservesFresh

```solidity
function _reduceReservesFresh(uint256 reduceAmount) internal returns (uint256)
```

Reduces reserves by transferring to admin

_Requires fresh interest accrual_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reduceAmount | uint256 | Amount of reduction to reserves |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) / |

### _setInterestRateModel

```solidity
function _setInterestRateModel(contract InterestRateModel newInterestRateModel) public returns (uint256)
```

accrues interest and updates the interest rate model using _setInterestRateModelFresh

_Admin function to accrue interest and update the interest rate model_

| Name | Type | Description |
| ---- | ---- | ----------- |
| newInterestRateModel | contract InterestRateModel | the new interest rate model to use |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) /     f |

### _setInterestRateModelFresh

```solidity
function _setInterestRateModelFresh(contract InterestRateModel newInterestRateModel) internal returns (uint256)
```

updates the interest rate model (*requires fresh interest accrual)

_Admin function to update the interest rate model_

| Name | Type | Description |
| ---- | ---- | ----------- |
| newInterestRateModel | contract InterestRateModel | the new interest rate model to use |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) /     f |

### getCashPrior

```solidity
function getCashPrior() internal view virtual returns (uint256)
```

Gets balance of this contract in terms of the underlying

_This excludes the value of the current message, if any_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The quantity of underlying owned by this contract /     f |

### doTransferIn

```solidity
function doTransferIn(address from, uint256 amount) internal virtual returns (uint256)
```

_Performs a transfer in, reverting upon failure. Returns the amount actually transferred to the protocol, in case of a fee.
 This may revert due to insufficient balance or insufficient allowance.
/
    f_

### doTransferOut

```solidity
function doTransferOut(address payable to, uint256 amount) internal virtual
```

_Performs a transfer out, ideally returning an explanatory error code upon failure tather than reverting.
 If caller has not called checked protocol&#x27;s balance, may revert due to insufficient cash held in the contract.
 If caller has checked protocol&#x27;s balance, and verified it is &gt;&#x3D; amount, this should not revert in normal conditions.
/
    f_

### nonReentrant

```solidity
modifier nonReentrant()
```

_Prevents a contract from calling itself, directly or indirectly.
/
    m_

## BTokenStorage

### _notEntered

```solidity
bool _notEntered
```

_Guard variable for re-entrancy checks_

### name

```solidity
string name
```

EIP-20 token name for this token

### symbol

```solidity
string symbol
```

EIP-20 token symbol for this token

### decimals

```solidity
uint8 decimals
```

EIP-20 token decimals for this token

### borrowRateMaxMantissa

```solidity
uint256 borrowRateMaxMantissa
```

Maximum borrow rate that can ever be applied (.0005% / block)

### reserveFactorMaxMantissa

```solidity
uint256 reserveFactorMaxMantissa
```

Maximum fraction of interest that can be set aside for reserves

### admin

```solidity
address payable admin
```

Administrator for this contract

### pendingAdmin

```solidity
address payable pendingAdmin
```

Pending administrator for this contract

### bondtroller

```solidity
contract Bondtroller bondtroller
```

Contract which oversees inter-cToken operations

### interestRateModel

```solidity
contract InterestRateModel interestRateModel
```

Model which tells what the current interest rate should be

### initialExchangeRateMantissa

```solidity
uint256 initialExchangeRateMantissa
```

Initial exchange rate used when minting the first CTokens (used when totalSupply &#x3D; 0)

### reserveFactorMantissa

```solidity
uint256 reserveFactorMantissa
```

Fraction of interest currently set aside for reserves

### accrualBlockNumber

```solidity
uint256 accrualBlockNumber
```

Block number that interest was last accrued at

### borrowIndex

```solidity
uint256 borrowIndex
```

Accumulator of the total earned interest rate since the opening of the market

### totalBorrows

```solidity
uint256 totalBorrows
```

Total amount of outstanding borrows of the underlying in this market

### totalReserves

```solidity
uint256 totalReserves
```

Total amount of reserves of the underlying held in this market

### totalSupply

```solidity
uint256 totalSupply
```

Total number of tokens in circulation

### accountTokens

```solidity
mapping(address &#x3D;&gt; uint256) accountTokens
```

Official record of token balances for each account

### transferAllowances

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) transferAllowances
```

Approved token transfer amounts on behalf of others

### BorrowSnapshot

```solidity
struct BorrowSnapshot {
  uint256 principal;
  uint256 interestIndex;
}
```

### accountBorrows

```solidity
mapping(address &#x3D;&gt; struct BTokenStorage.BorrowSnapshot) accountBorrows
```

Mapping of account addresses to outstanding borrow balances

### protocolSeizeShareMantissa

```solidity
uint256 protocolSeizeShareMantissa
```

Share of seized collateral that is added to reserves

## BTokenInterface

### isCToken

```solidity
bool isCToken
```

Indicator that this is a CToken contract (for inspection)

### AccrueInterest

```solidity
event AccrueInterest(uint256 cashPrior, uint256 interestAccumulated, uint256 borrowIndex, uint256 totalBorrows)
```

Event emitted when interest is accrued

### Mint

```solidity
event Mint(address minter, uint256 mintAmount, uint256 mintTokens)
```

Event emitted when tokens are minted

### Redeem

```solidity
event Redeem(address redeemer, uint256 redeemAmount, uint256 redeemTokens)
```

Event emitted when tokens are redeemed

### Borrow

```solidity
event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)
```

Event emitted when underlying is borrowed

### RepayBorrow

```solidity
event RepayBorrow(address payer, address borrower, uint256 repayAmount, uint256 accountBorrows, uint256 totalBorrows)
```

Event emitted when a borrow is repaid

### LiquidateBorrow

```solidity
event LiquidateBorrow(address liquidator, address borrower, uint256 repayAmount, address cTokenCollateral, uint256 seizeTokens)
```

Event emitted when a borrow is liquidated

### NewPendingAdmin

```solidity
event NewPendingAdmin(address oldPendingAdmin, address newPendingAdmin)
```

Event emitted when pendingAdmin is changed

### NewAdmin

```solidity
event NewAdmin(address oldAdmin, address newAdmin)
```

Event emitted when pendingAdmin is accepted, which means admin is updated

### NewBondtroller

```solidity
event NewBondtroller(contract Bondtroller oldBondtroller, contract Bondtroller newBondtroller)
```

Event emitted when bondtroller is changed

### NewMarketInterestRateModel

```solidity
event NewMarketInterestRateModel(contract InterestRateModel oldInterestRateModel, contract InterestRateModel newInterestRateModel)
```

Event emitted when interestRateModel is changed

### NewReserveFactor

```solidity
event NewReserveFactor(uint256 oldReserveFactorMantissa, uint256 newReserveFactorMantissa)
```

Event emitted when the reserve factor is changed

### ReservesAdded

```solidity
event ReservesAdded(address benefactor, uint256 addAmount, uint256 newTotalReserves)
```

Event emitted when the reserves are added

### ReservesReduced

```solidity
event ReservesReduced(address admin, uint256 reduceAmount, uint256 newTotalReserves)
```

Event emitted when the reserves are reduced

### Transfer

```solidity
event Transfer(address from, address to, uint256 amount)
```

EIP20 Transfer event

### Approval

```solidity
event Approval(address owner, address spender, uint256 amount)
```

EIP20 Approval event

### transfer

```solidity
function transfer(address dst, uint256 amount) external virtual returns (bool)
```

Failure event

### transferFrom

```solidity
function transferFrom(address src, address dst, uint256 amount) external virtual returns (bool)
```

### approve

```solidity
function approve(address spender, uint256 amount) external virtual returns (bool)
```

### allowance

```solidity
function allowance(address owner, address spender) external view virtual returns (uint256)
```

### balanceOf

```solidity
function balanceOf(address owner) external view virtual returns (uint256)
```

### balanceOfUnderlying

```solidity
function balanceOfUnderlying(address owner) external virtual returns (uint256)
```

### getAccountSnapshot

```solidity
function getAccountSnapshot(address account) external view virtual returns (uint256, uint256, uint256, uint256)
```

### borrowRatePerBlock

```solidity
function borrowRatePerBlock() external view virtual returns (uint256)
```

### supplyRatePerBlock

```solidity
function supplyRatePerBlock() external view virtual returns (uint256)
```

### totalBorrowsCurrent

```solidity
function totalBorrowsCurrent() external virtual returns (uint256)
```

### borrowBalanceCurrent

```solidity
function borrowBalanceCurrent(address account) external virtual returns (uint256)
```

### borrowBalanceStored

```solidity
function borrowBalanceStored(address account) public view virtual returns (uint256)
```

### exchangeRateCurrent

```solidity
function exchangeRateCurrent() public virtual returns (uint256)
```

### exchangeRateStored

```solidity
function exchangeRateStored() public view virtual returns (uint256)
```

### getCash

```solidity
function getCash() external view virtual returns (uint256)
```

### accrueInterest

```solidity
function accrueInterest() public virtual returns (uint256)
```

### _setPendingAdmin

```solidity
function _setPendingAdmin(address payable newPendingAdmin) external virtual returns (uint256)
```

### _acceptAdmin

```solidity
function _acceptAdmin() external virtual returns (uint256)
```

### _setBondtroller

```solidity
function _setBondtroller(contract Bondtroller newBondtroller) public virtual returns (uint256)
```

### _setReserveFactor

```solidity
function _setReserveFactor(uint256 newReserveFactorMantissa) external virtual returns (uint256)
```

### _reduceReserves

```solidity
function _reduceReserves(uint256 reduceAmount) external virtual returns (uint256)
```

### _setInterestRateModel

```solidity
function _setInterestRateModel(contract InterestRateModel newInterestRateModel) public virtual returns (uint256)
```

## BErc20Storage

### underlying

```solidity
address underlying
```

Underlying asset for this CToken

## BErc20Interface

### sweepToken

```solidity
function sweepToken(contract EIP20NonStandardInterface token) external virtual
```

### _addReserves

```solidity
function _addReserves(uint256 addAmount) external virtual returns (uint256)
```

## Bondtroller

### MarketListed

```solidity
event MarketListed(contract BToken bToken)
```

Emitted when an admin supports a market

### MarketEntered

```solidity
event MarketEntered(contract BToken bToken, address account)
```

Emitted when an account enters a market

### MarketExited

```solidity
event MarketExited(contract BToken bToken, address account)
```

Emitted when an account exits a market

### NewPriceOracle

```solidity
event NewPriceOracle(address oldPriceOracle, address newPriceOracle)
```

Emitted when price oracle is changed

### NewPauseGuardian

```solidity
event NewPauseGuardian(address oldPauseGuardian, address newPauseGuardian)
```

Emitted when pause guardian is changed

### ActionPaused

```solidity
event ActionPaused(string action, bool pauseState)
```

Emitted when an action is paused globally

### ActionPaused

```solidity
event ActionPaused(contract BToken bToken, string action, bool pauseState)
```

Emitted when an action is paused on a market

### NewBorrowCap

```solidity
event NewBorrowCap(contract BToken bToken, uint256 newBorrowCap)
```

Emitted when borrow cap for a bToken is changed

### NewBorrowCapGuardian

```solidity
event NewBorrowCapGuardian(address oldBorrowCapGuardian, address newBorrowCapGuardian)
```

Emitted when borrow cap guardian is changed

### CompGranted

```solidity
event CompGranted(address recipient, uint256 amount)
```

Emitted when COMP is granted by admin

### NewPrimaryIndexToken

```solidity
event NewPrimaryIndexToken(address oldPrimaryIndexToken, address newPrimaryIndexToken)
```

### primaryIndexToken

```solidity
address primaryIndexToken
```

the address of primary index token

### init

```solidity
function init() public
```

### onlyPrimaryIndexToken

```solidity
modifier onlyPrimaryIndexToken()
```

### getPrimaryIndexTokenAddress

```solidity
function getPrimaryIndexTokenAddress() external view returns (address)
```

### getAssetsIn

```solidity
function getAssetsIn(address account) external view returns (contract BToken[])
```

Returns the assets an account has entered

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the account to pull assets for |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract BToken[] | A dynamic list with the assets the account has entered |

### checkMembership

```solidity
function checkMembership(address account, contract BToken bToken) external view returns (bool)
```

Returns whether the given account is entered in the given asset

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the account to check |
| bToken | contract BToken | The bToken to check |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the account is in the asset, otherwise false. |

### enterMarkets

```solidity
function enterMarkets(address[] bTokens) public returns (uint256[])
```

Add assets to be included in account liquidity calculation

| Name | Type | Description |
| ---- | ---- | ----------- |
| bTokens | address[] | The list of addresses of the bToken markets to be enabled |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256[] | Success indicator for whether each corresponding market was entered |

### enterMarket

```solidity
function enterMarket(address bToken, address borrower) public returns (enum BondtrollerErrorReporter.Error)
```

Add asset to be included in account liquidity calculation

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | The address of the bToken markets to be enabled |
| borrower | address | The address of user, which enters to market |

### addToMarketInternal

```solidity
function addToMarketInternal(contract BToken bToken, address borrower) internal returns (enum BondtrollerErrorReporter.Error)
```

Add the market to the borrower&#x27;s &quot;assets in&quot; for liquidity calculations

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | contract BToken | The market to enter |
| borrower | address | The address of the account to modify |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum BondtrollerErrorReporter.Error | Success indicator for whether the market was entered |

### exitMarket

```solidity
function exitMarket(address cTokenAddress) external returns (uint256)
```

Removes asset from sender&#x27;s account liquidity calculation

_Sender must not have an outstanding borrow balance in the asset,
 or be providing necessary collateral for an outstanding borrow._

| Name | Type | Description |
| ---- | ---- | ----------- |
| cTokenAddress | address | The address of the asset to be removed |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Whether or not the account successfully exited the market |

### mintAllowed

```solidity
function mintAllowed(address bToken, address minter, uint256 mintAmount) external view returns (uint256)
```

Checks if the account should be allowed to mint tokens in the given market

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | The market to verify the mint against |
| minter | address | The account which would get the minted tokens |
| mintAmount | uint256 | The amount of underlying being supplied to the market in exchange for tokens |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | 0 if the mint is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol) /     f |

### mintVerify

```solidity
function mintVerify(address bToken, address minter, uint256 actualMintAmount, uint256 mintTokens) external
```

Validates mint and reverts on rejection. May emit logs.

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | Asset being minted |
| minter | address | The address minting the tokens |
| actualMintAmount | uint256 | The amount of the underlying asset being minted |
| mintTokens | uint256 | The number of tokens being minted /     f |

### redeemAllowed

```solidity
function redeemAllowed(address bToken, address redeemer, uint256 redeemTokens) external view returns (uint256)
```

Checks if the account should be allowed to redeem tokens in the given market

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | The market to verify the redeem against |
| redeemer | address | The account which would redeem the tokens |
| redeemTokens | uint256 | The number of bTokens to exchange for the underlying asset in the market |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | 0 if the redeem is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol) /     f |

### redeemAllowedInternal

```solidity
function redeemAllowedInternal(address bToken, address redeemer, uint256 redeemTokens) internal view returns (uint256)
```

### redeemVerify

```solidity
function redeemVerify(address bToken, address redeemer, uint256 redeemAmount, uint256 redeemTokens) external pure
```

Validates redeem and reverts on rejection. May emit logs.

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | Asset being redeemed |
| redeemer | address | The address redeeming the tokens |
| redeemAmount | uint256 | The amount of the underlying asset being redeemed |
| redeemTokens | uint256 | The number of tokens being redeemed /     f |

### borrowAllowed

```solidity
function borrowAllowed(address bToken, address borrower, uint256 borrowAmount) external returns (uint256)
```

Checks if the account should be allowed to borrow the underlying asset of the given market

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | The market to verify the borrow against |
| borrower | address | The account which would borrow the asset |
| borrowAmount | uint256 | The amount of underlying the account would borrow |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | 0 if the borrow is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol) /     f |

### borrowVerify

```solidity
function borrowVerify(address bToken, address borrower, uint256 borrowAmount) external
```

Validates borrow and reverts on rejection. May emit logs.

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | Asset whose underlying is being borrowed |
| borrower | address | The address borrowing the underlying |
| borrowAmount | uint256 | The amount of the underlying asset requested to borrow /     f |

### repayBorrowAllowed

```solidity
function repayBorrowAllowed(address bToken, address payer, address borrower, uint256 repayAmount) external view returns (uint256)
```

Checks if the account should be allowed to repay a borrow in the given market

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | The market to verify the repay against |
| payer | address | The account which would repay the asset |
| borrower | address | The account which would borrowed the asset |
| repayAmount | uint256 | The amount of the underlying asset the account would repay |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | 0 if the repay is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol) /     f |

### repayBorrowVerify

```solidity
function repayBorrowVerify(address bToken, address payer, address borrower, uint256 actualRepayAmount, uint256 borrowerIndex) external
```

Validates repayBorrow and reverts on rejection. May emit logs.

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | Asset being repaid |
| payer | address | The address repaying the borrow |
| borrower | address | The address of the borrower |
| actualRepayAmount | uint256 | The amount of underlying being repaid /     f |
| borrowerIndex | uint256 |  |

### transferAllowed

```solidity
function transferAllowed(address bToken, address src, address dst, uint256 transferTokens) external returns (uint256)
```

Checks if the account should be allowed to transfer tokens in the given market

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | The market to verify the transfer against |
| src | address | The account which sources the tokens |
| dst | address | The account which receives the tokens |
| transferTokens | uint256 | The number of bTokens to transfer |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | 0 if the transfer is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol) /     f |

### transferVerify

```solidity
function transferVerify(address bToken, address src, address dst, uint256 transferTokens) external
```

Validates transfer and reverts on rejection. May emit logs.

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | Asset being transferred |
| src | address | The account which sources the tokens |
| dst | address | The account which receives the tokens |
| transferTokens | uint256 | The number of bTokens to transfer /     f |

### setPriceOracle

```solidity
function setPriceOracle(address newOracle) public returns (uint256)
```

Sets a new price oracle for the bondtroller

_Admin function to set a new price oracle_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) /     f |

### setPrimaryIndexTokenAddress

```solidity
function setPrimaryIndexTokenAddress(address _newPrimaryIndexToken) external returns (uint256)
```

### supportMarket

```solidity
function supportMarket(contract BToken bToken) external returns (uint256)
```

Add the market to the markets mapping and set it as listed

_Admin function to set isListed and add support for the market_

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | contract BToken | The address of the market (token) to list |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure. (See enum Error for details) /     f |

### _addMarketInternal

```solidity
function _addMarketInternal(address bToken) internal
```

### setMarketBorrowCaps

```solidity
function setMarketBorrowCaps(contract BToken[] bTokens, uint256[] newBorrowCaps) external
```

Set the given borrow caps for the given bToken markets. Borrowing that brings total borrows to or above borrow cap will revert.

_Admin or borrowCapGuardian function to set the borrow caps. A borrow cap of 0 corresponds to unlimited borrowing._

| Name | Type | Description |
| ---- | ---- | ----------- |
| bTokens | contract BToken[] | The addresses of the markets (tokens) to change the borrow caps for |
| newBorrowCaps | uint256[] | The new borrow cap values in underlying to be set. A value of 0 corresponds to unlimited borrowing. /     f |

### setBorrowCapGuardian

```solidity
function setBorrowCapGuardian(address newBorrowCapGuardian) external
```

Admin function to change the Borrow Cap Guardian

| Name | Type | Description |
| ---- | ---- | ----------- |
| newBorrowCapGuardian | address | The address of the new Borrow Cap Guardian /     f |

### setPauseGuardian

```solidity
function setPauseGuardian(address newPauseGuardian) public returns (uint256)
```

Admin function to change the Pause Guardian

| Name | Type | Description |
| ---- | ---- | ----------- |
| newPauseGuardian | address | The address of the new Pause Guardian |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure. (See enum Error for details) /     f |

### setMintPaused

```solidity
function setMintPaused(contract BToken bToken, bool state) public returns (bool)
```

### setBorrowPaused

```solidity
function setBorrowPaused(contract BToken bToken, bool state) public returns (bool)
```

### setTransferPaused

```solidity
function setTransferPaused(bool state) public returns (bool)
```

### setSeizePaused

```solidity
function setSeizePaused(bool state) public returns (bool)
```

### adminOrInitializing

```solidity
function adminOrInitializing() internal view returns (bool)
```

Checks caller is admin, or this contract is becoming the new implementation
/
    f

### getAllMarkets

```solidity
function getAllMarkets() public view returns (contract BToken[])
```

Return all of the markets

_The automatic getter may be used to access an individual market._

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract BToken[] | The list of market addresses /     f |

### isDeprecated

```solidity
function isDeprecated(contract BToken bToken) public view returns (bool)
```

Returns true if the given bToken market has been deprecated

_All borrows in a deprecated bToken market can be immediately liquidated_

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | contract BToken | The market to check if deprecated /     f |

### getBlockNumber

```solidity
function getBlockNumber() public view returns (uint256)
```

## BondtrollerV1Storage

### isBondtroller

```solidity
bool isBondtroller
```

watermark that says that this is Bondtroller

### admin

```solidity
address admin
```

Administrator for this contract

### oracle

```solidity
address oracle
```

Oracle which gives the price of any given asset

### closeFactorMantissa

```solidity
uint256 closeFactorMantissa
```

Multiplier used to calculate the maximum repayAmount when liquidating a borrow

### liquidationIncentiveMantissa

```solidity
uint256 liquidationIncentiveMantissa
```

Multiplier representing the discount on collateral that a liquidator receives

### maxAssets

```solidity
uint256 maxAssets
```

Max number of assets a single account can participate in (borrow or use as collateral)

### accountAssets

```solidity
mapping(address &#x3D;&gt; contract BToken[]) accountAssets
```

Per-account mapping of &quot;assets you are in&quot;, capped by maxAssets

## BondtrollerV2Storage

### Market

```solidity
struct Market {
  bool isListed;
  uint256 collateralFactorMantissa;
  bool isComped;
}
```

### accountMembership

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; bool)) accountMembership
```

Per-market mapping of &quot;accounts in this asset&quot;

### markets

```solidity
mapping(address &#x3D;&gt; struct BondtrollerV2Storage.Market) markets
```

Official mapping of BTokens -&gt; Market metadata

_Used e.g. to determine if a market is supported_

### pauseGuardian

```solidity
address pauseGuardian
```

The Pause Guardian can pause certain actions as a safety mechanism.
 Actions which allow users to remove their own assets cannot be paused.
 Liquidation / seizing / transfer can only be paused globally, not by market.

### _mintGuardianPaused

```solidity
bool _mintGuardianPaused
```

### _borrowGuardianPaused

```solidity
bool _borrowGuardianPaused
```

### transferGuardianPaused

```solidity
bool transferGuardianPaused
```

### seizeGuardianPaused

```solidity
bool seizeGuardianPaused
```

### mintGuardianPaused

```solidity
mapping(address &#x3D;&gt; bool) mintGuardianPaused
```

### borrowGuardianPaused

```solidity
mapping(address &#x3D;&gt; bool) borrowGuardianPaused
```

## BondtrollerV3Storage

### CompMarketState

```solidity
struct CompMarketState {
  uint224 index;
  uint32 block;
}
```

### allMarkets

```solidity
contract BToken[] allMarkets
```

A list of all markets

### compRate

```solidity
uint256 compRate
```

The rate at which the flywheel distributes COMP, per block

### compSpeeds

```solidity
mapping(address &#x3D;&gt; uint256) compSpeeds
```

The portion of compRate that each market currently receives

### compSupplyState

```solidity
mapping(address &#x3D;&gt; struct BondtrollerV3Storage.CompMarketState) compSupplyState
```

The COMP market supply state for each market

### compBorrowState

```solidity
mapping(address &#x3D;&gt; struct BondtrollerV3Storage.CompMarketState) compBorrowState
```

The COMP market borrow state for each market

### compSupplierIndex

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) compSupplierIndex
```

The COMP borrow index for each market for each supplier as of the last time they accrued COMP

### compBorrowerIndex

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) compBorrowerIndex
```

The COMP borrow index for each market for each borrower as of the last time they accrued COMP

### compAccrued

```solidity
mapping(address &#x3D;&gt; uint256) compAccrued
```

The COMP accrued but not yet transferred to each user

## BondtrollerV4Storage

### borrowCapGuardian

```solidity
address borrowCapGuardian
```

### borrowCaps

```solidity
mapping(address &#x3D;&gt; uint256) borrowCaps
```

## BondtrollerV5Storage

### compContributorSpeeds

```solidity
mapping(address &#x3D;&gt; uint256) compContributorSpeeds
```

The portion of COMP that each contributor receives per block

### lastContributorBlock

```solidity
mapping(address &#x3D;&gt; uint256) lastContributorBlock
```

Last block at which a contributor&#x27;s COMP rewards have been allocated

## BaseJumpRateModelV2

Version 2 modifies Version 1 by enabling updateable parameters.

### NewInterestParams

```solidity
event NewInterestParams(uint256 baseRatePerBlock, uint256 multiplierPerBlock, uint256 jumpMultiplierPerBlock, uint256 kink)
```

### owner

```solidity
address owner
```

The address of the owner, i.e. the Timelock contract, which can update parameters directly

### blocksPerYear

```solidity
uint256 blocksPerYear
```

The approximate number of blocks per year that is assumed by the interest rate model

### multiplierPerBlock

```solidity
uint256 multiplierPerBlock
```

The multiplier of utilization rate that gives the slope of the interest rate

### baseRatePerBlock

```solidity
uint256 baseRatePerBlock
```

The base interest rate which is the y-intercept when utilization rate is 0

### jumpMultiplierPerBlock

```solidity
uint256 jumpMultiplierPerBlock
```

The multiplierPerBlock after hitting a specified utilization point

### kink

```solidity
uint256 kink
```

The utilization point at which the jump multiplier is applied

### constructor

```solidity
constructor(uint256 baseRatePerYear, uint256 multiplierPerYear, uint256 jumpMultiplierPerYear, uint256 kink_, address owner_) public
```

Construct an interest rate model

| Name | Type | Description |
| ---- | ---- | ----------- |
| baseRatePerYear | uint256 | The approximate target base APR, as a mantissa (scaled by 1e18) |
| multiplierPerYear | uint256 | The rate of increase in interest rate wrt utilization (scaled by 1e18) |
| jumpMultiplierPerYear | uint256 | The multiplierPerBlock after hitting a specified utilization point |
| kink_ | uint256 | The utilization point at which the jump multiplier is applied |
| owner_ | address | The address of the owner, i.e. the Timelock contract (which has the ability to update parameters directly) |

### updateJumpRateModel

```solidity
function updateJumpRateModel(uint256 baseRatePerYear, uint256 multiplierPerYear, uint256 jumpMultiplierPerYear, uint256 kink_) external
```

Update the parameters of the interest rate model (only callable by owner, i.e. Timelock)

| Name | Type | Description |
| ---- | ---- | ----------- |
| baseRatePerYear | uint256 | The approximate target base APR, as a mantissa (scaled by 1e18) |
| multiplierPerYear | uint256 | The rate of increase in interest rate wrt utilization (scaled by 1e18) |
| jumpMultiplierPerYear | uint256 | The multiplierPerBlock after hitting a specified utilization point |
| kink_ | uint256 | The utilization point at which the jump multiplier is applied |

### utilizationRate

```solidity
function utilizationRate(uint256 cash, uint256 borrows, uint256 reserves) public pure returns (uint256)
```

Calculates the utilization rate of the market: &#x60;borrows / (cash + borrows - reserves)&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| cash | uint256 | The amount of cash in the market |
| borrows | uint256 | The amount of borrows in the market |
| reserves | uint256 | The amount of reserves in the market (currently unused) |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The utilization rate as a mantissa between [0, 1e18] |

### getBorrowRateInternal

```solidity
function getBorrowRateInternal(uint256 cash, uint256 borrows, uint256 reserves) internal view returns (uint256)
```

Calculates the current borrow rate per block, with the error code expected by the market

| Name | Type | Description |
| ---- | ---- | ----------- |
| cash | uint256 | The amount of cash in the market |
| borrows | uint256 | The amount of borrows in the market |
| reserves | uint256 | The amount of reserves in the market |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The borrow rate percentage per block as a mantissa (scaled by 1e18) |

### getSupplyRate

```solidity
function getSupplyRate(uint256 cash, uint256 borrows, uint256 reserves, uint256 reserveFactorMantissa) public view virtual returns (uint256)
```

Calculates the current supply rate per block

| Name | Type | Description |
| ---- | ---- | ----------- |
| cash | uint256 | The amount of cash in the market |
| borrows | uint256 | The amount of borrows in the market |
| reserves | uint256 | The amount of reserves in the market |
| reserveFactorMantissa | uint256 | The current reserve factor for the market |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The supply rate percentage per block as a mantissa (scaled by 1e18) |

### updateJumpRateModelInternal

```solidity
function updateJumpRateModelInternal(uint256 baseRatePerYear, uint256 multiplierPerYear, uint256 jumpMultiplierPerYear, uint256 kink_) internal
```

Internal function to update the parameters of the interest rate model

| Name | Type | Description |
| ---- | ---- | ----------- |
| baseRatePerYear | uint256 | The approximate target base APR, as a mantissa (scaled by 1e18) |
| multiplierPerYear | uint256 | The rate of increase in interest rate wrt utilization (scaled by 1e18) |
| jumpMultiplierPerYear | uint256 | The multiplierPerBlock after hitting a specified utilization point |
| kink_ | uint256 | The utilization point at which the jump multiplier is applied |

## FringeInterestRateModel

### MODERATOR_ROLE

```solidity
bytes32 MODERATOR_ROLE
```

### borrowRate

```solidity
uint256 borrowRate
```

### supplyRate

```solidity
uint256 supplyRate
```

### initialize

```solidity
function initialize() public
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

### onlyModerator

```solidity
modifier onlyModerator()
```

### grandModerator

```solidity
function grandModerator(address newModerator) public
```

### revokeModerator

```solidity
function revokeModerator(address moderator) public
```

### setBorrowRate

```solidity
function setBorrowRate(uint256 newBorrowRate) public
```

### setSupplyRate

```solidity
function setSupplyRate(uint256 newSupplyRate) public
```

### getBorrowRate

```solidity
function getBorrowRate(uint256 cash, uint256 borrows, uint256 reserves) external view returns (uint256)
```

Calculates the current borrow rate per block

| Name | Type | Description |
| ---- | ---- | ----------- |
| cash | uint256 | The amount of cash in the market |
| borrows | uint256 | The amount of borrows in the market |
| reserves | uint256 | The amount of reserves in the market |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The borrow rate percentage per block as a mantissa (scaled by 1e18) |

### getSupplyRate

```solidity
function getSupplyRate(uint256 cash, uint256 borrows, uint256 reserves, uint256 reserveFactorMantissa) public view returns (uint256)
```

Calculates the current supply interest rate per block

| Name | Type | Description |
| ---- | ---- | ----------- |
| cash | uint256 | The total amount of cash the market has |
| borrows | uint256 | The total amount of borrows the market has outstanding |
| reserves | uint256 | The total amount of reserves the market has |
| reserveFactorMantissa | uint256 | The current reserve factor the market has |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The supply rate per block (as a percentage, and scaled by 1e18) |

## InterestRateModel

### isInterestRateModel

```solidity
bool isInterestRateModel
```

Indicator that this is an InterestRateModel contract (for inspection)

### getBorrowRate

```solidity
function getBorrowRate(uint256 cash, uint256 borrows, uint256 reserves) external view virtual returns (uint256)
```

Calculates the current borrow interest rate per block

| Name | Type | Description |
| ---- | ---- | ----------- |
| cash | uint256 | The total amount of cash the market has |
| borrows | uint256 | The total amount of borrows the market has outstanding |
| reserves | uint256 | The total amount of reserves the market has |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The borrow rate per block (as a percentage, and scaled by 1e18) |

### getSupplyRate

```solidity
function getSupplyRate(uint256 cash, uint256 borrows, uint256 reserves, uint256 reserveFactorMantissa) external view virtual returns (uint256)
```

Calculates the current supply interest rate per block

| Name | Type | Description |
| ---- | ---- | ----------- |
| cash | uint256 | The total amount of cash the market has |
| borrows | uint256 | The total amount of borrows the market has outstanding |
| reserves | uint256 | The total amount of reserves the market has |
| reserveFactorMantissa | uint256 | The current reserve factor the market has |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The supply rate per block (as a percentage, and scaled by 1e18) |

## JumpRateModelV2

Supports only for V2 cTokens

### getBorrowRate

```solidity
function getBorrowRate(uint256 cash, uint256 borrows, uint256 reserves) external view returns (uint256)
```

Calculates the current borrow rate per block

| Name | Type | Description |
| ---- | ---- | ----------- |
| cash | uint256 | The amount of cash in the market |
| borrows | uint256 | The amount of borrows in the market |
| reserves | uint256 | The amount of reserves in the market |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The borrow rate percentage per block as a mantissa (scaled by 1e18) |

### getSupplyRate

```solidity
function getSupplyRate(uint256 cash, uint256 borrows, uint256 reserves, uint256 reserveFactorMantissa) public view returns (uint256)
```

### constructor

```solidity
constructor(uint256 baseRatePerYear, uint256 multiplierPerYear, uint256 jumpMultiplierPerYear, uint256 kink_, address owner_) public
```

## EIP20Interface

### name

```solidity
function name() external view returns (string)
```

### symbol

```solidity
function symbol() external view returns (string)
```

### decimals

```solidity
function decimals() external view returns (uint8)
```

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

Get the total number of tokens in circulation

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The supply of tokens |

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256 balance)
```

Gets the balance of the specified address

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address from which the balance will be retrieved return The &#x60;balance&#x60; |

### transfer

```solidity
function transfer(address dst, uint256 amount) external returns (bool success)
```

Transfer &#x60;amount&#x60; tokens from &#x60;msg.sender&#x60; to &#x60;dst&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| dst | address | The address of the destination account |
| amount | uint256 | The number of tokens to transfer return Whether or not the transfer succeeded |

### transferFrom

```solidity
function transferFrom(address src, address dst, uint256 amount) external returns (bool success)
```

Transfer &#x60;amount&#x60; tokens from &#x60;src&#x60; to &#x60;dst&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| src | address | The address of the source account |
| dst | address | The address of the destination account |
| amount | uint256 | The number of tokens to transfer return Whether or not the transfer succeeded |

### approve

```solidity
function approve(address spender, uint256 amount) external returns (bool success)
```

Approve &#x60;spender&#x60; to transfer up to &#x60;amount&#x60; from &#x60;src&#x60;

_This will overwrite the approval amount for &#x60;spender&#x60;
 and is subject to issues noted [here](https://eips.ethereum.org/EIPS/eip-20#approve)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| spender | address | The address of the account which may transfer tokens |
| amount | uint256 | The number of tokens that are approved (-1 means infinite) return Whether or not the approval succeeded |

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256 remaining)
```

Get the current allowance from &#x60;owner&#x60; for &#x60;spender&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of the account which owns the tokens to be spent |
| spender | address | The address of the account which may transfer tokens return The number of tokens allowed to be spent (-1 means infinite) |

### Transfer

```solidity
event Transfer(address from, address to, uint256 amount)
```

### Approval

```solidity
event Approval(address owner, address spender, uint256 amount)
```

## EIP20NonStandardInterface

_Version of ERC20 with no return values for &#x60;transfer&#x60; and &#x60;transferFrom&#x60;
 See https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca_

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

Get the total number of tokens in circulation

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The supply of tokens |

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256 balance)
```

Gets the balance of the specified address

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address from which the balance will be retrieved |

### transfer

```solidity
function transfer(address dst, uint256 amount) external
```

Transfer &#x60;amount&#x60; tokens from &#x60;msg.sender&#x60; to &#x60;dst&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| dst | address | The address of the destination account |
| amount | uint256 | The number of tokens to transfer |

### transferFrom

```solidity
function transferFrom(address src, address dst, uint256 amount) external
```

Transfer &#x60;amount&#x60; tokens from &#x60;src&#x60; to &#x60;dst&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| src | address | The address of the source account |
| dst | address | The address of the destination account |
| amount | uint256 | The number of tokens to transfer |

### approve

```solidity
function approve(address spender, uint256 amount) external returns (bool success)
```

Approve &#x60;spender&#x60; to transfer up to &#x60;amount&#x60; from &#x60;src&#x60;

_This will overwrite the approval amount for &#x60;spender&#x60;
 and is subject to issues noted [here](https://eips.ethereum.org/EIPS/eip-20#approve)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| spender | address | The address of the account which may transfer tokens |
| amount | uint256 | The number of tokens that are approved return Whether or not the approval succeeded |

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256 remaining)
```

Get the current allowance from &#x60;owner&#x60; for &#x60;spender&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of the account which owns the tokens to be spent |
| spender | address | The address of the account which may transfer tokens return The number of tokens allowed to be spent |

### Transfer

```solidity
event Transfer(address from, address to, uint256 amount)
```

### Approval

```solidity
event Approval(address owner, address spender, uint256 amount)
```

## IPriceProviderAggregator

### MODERATOR_ROLE

```solidity
function MODERATOR_ROLE() external view returns (bytes32)
```

### usdDecimals

```solidity
function usdDecimals() external view returns (uint8)
```

### tokenPriceProvider

```solidity
function tokenPriceProvider(address projectToken) external view returns (address priceProvider, bool hasSignedFunction)
```

### GrandModeratorRole

```solidity
event GrandModeratorRole(address who, address newModerator)
```

### RevokeModeratorRole

```solidity
event RevokeModeratorRole(address who, address moderator)
```

### SetTokenAndPriceProvider

```solidity
event SetTokenAndPriceProvider(address who, address token, address priceProvider)
```

### ChangeActive

```solidity
event ChangeActive(address who, address priceProvider, address token, bool active)
```

### initialize

```solidity
function initialize() external
```

### grandModerator

```solidity
function grandModerator(address newModerator) external
```

### revokeModerator

```solidity
function revokeModerator(address moderator) external
```

### setTokenAndPriceProvider

```solidity
function setTokenAndPriceProvider(address token, address priceProvider, bool hasFunctionWithSign) external
```

### changeActive

```solidity
function changeActive(address priceProvider, address token, bool active) external
```

### getPrice

```solidity
function getPrice(address token) external view returns (uint256 priceMantissa, uint8 priceDecimals)
```

price &#x3D; priceMantissa / (10 ** priceDecimals)

_returns tuple (priceMantissa, priceDecimals)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token wich price is to return |

### getPriceSigned

```solidity
function getPriceSigned(address token, uint256 _priceMantissa, uint8 _priceDecimals, uint256 validTo, bytes signature) external view returns (uint256 priceMantissa, uint8 priceDecimals)
```

_returns the price of token multiplied by 10 ** priceDecimals given by price provider.
price can be calculated as  priceMantissa / (10 ** priceDecimals)
i.e. price &#x3D; priceMantissa / (10 ** priceDecimals)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token |
| _priceMantissa | uint256 | - the price of token (used in verifying the signature) |
| _priceDecimals | uint8 | - the price decimals (used in verifying the signature) |
| validTo | uint256 | - the timestamp in seconds (used in verifying the signature) |
| signature | bytes | - the backend signature of secp256k1. length is 65 bytes |

### getEvaluation

```solidity
function getEvaluation(address token, uint256 tokenAmount) external view returns (uint256 evaluation)
```

_returns the USD evaluation of token by its &#x60;tokenAmount&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token to evaluate |
| tokenAmount | uint256 | the amount of token to evaluate |

### getEvaluationSigned

```solidity
function getEvaluationSigned(address token, uint256 tokenAmount, uint256 priceMantissa, uint8 priceDecimals, uint256 validTo, bytes signature) external view returns (uint256 evaluation)
```

_returns the USD evaluation of token by its &#x60;tokenAmount&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token |
| tokenAmount | uint256 | the amount of token including decimals |
| priceMantissa | uint256 | - the price of token (used in verifying the signature) |
| priceDecimals | uint8 | - the price decimals (used in verifying the signature) |
| validTo | uint256 | - the timestamp in seconds (used in verifying the signature) |
| signature | bytes | - the backend signature of secp256k1. length is 65 bytes |

## PRJ

### init

```solidity
function init(string name, string symbol) public
```

### mint

```solidity
function mint(uint256 amount) public
```

### mintTo

```solidity
function mintTo(address to, uint256 amount) public
```

## AccessControlEnumerableUpgradeable

_Extension of {AccessControl} that allows enumerating the members of each role._

### __AccessControlEnumerable_init

```solidity
function __AccessControlEnumerable_init() internal
```

### __AccessControlEnumerable_init_unchained

```solidity
function __AccessControlEnumerable_init_unchained() internal
```

### _roleMembers

```solidity
mapping(bytes32 &#x3D;&gt; struct EnumerableSetUpgradeable.AddressSet) _roleMembers
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### getRoleMember

```solidity
function getRoleMember(bytes32 role, uint256 index) public view returns (address)
```

_Returns one of the accounts that have &#x60;role&#x60;. &#x60;index&#x60; must be a
value between 0 and {getRoleMemberCount}, non-inclusive.

Role bearers are not sorted in any particular way, and their ordering may
change at any point.

WARNING: When using {getRoleMember} and {getRoleMemberCount}, make sure
you perform all queries on the same block. See the following
https://forum.openzeppelin.com/t/iterating-over-elements-on-enumerableset-in-openzeppelin-contracts/2296[forum post]
for more information._

### getRoleMemberCount

```solidity
function getRoleMemberCount(bytes32 role) public view returns (uint256)
```

_Returns the number of accounts that have &#x60;role&#x60;. Can be used
together with {getRoleMember} to enumerate all bearers of a role._

### grantRole

```solidity
function grantRole(bytes32 role, address account) public virtual
```

_Overload {grantRole} to track enumerable memberships_

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) public virtual
```

_Overload {revokeRole} to track enumerable memberships_

### renounceRole

```solidity
function renounceRole(bytes32 role, address account) public virtual
```

_Overload {renounceRole} to track enumerable memberships_

### _setupRole

```solidity
function _setupRole(bytes32 role, address account) internal virtual
```

_Overload {_setupRole} to track enumerable memberships_

### __gap

```solidity
uint256[49] __gap
```

## AccessControlUpgradeable

_Contract module that allows children to implement role-based access
control mechanisms. This is a lightweight version that doesn&#x27;t allow enumerating role
members except through off-chain means by accessing the contract event logs. Some
applications may benefit from on-chain enumerability, for those cases see
{AccessControlEnumerable}.

Roles are referred to by their &#x60;bytes32&#x60; identifier. These should be exposed
in the external API and be unique. The best way to achieve this is by
using &#x60;public constant&#x60; hash digests:

&#x60;&#x60;&#x60;
bytes32 public constant MY_ROLE &#x3D; keccak256(&quot;MY_ROLE&quot;);
&#x60;&#x60;&#x60;

Roles can be used to represent a set of permissions. To restrict access to a
function call, use {hasRole}:

&#x60;&#x60;&#x60;
function foo() public {
    require(hasRole(MY_ROLE, msg.sender));
    ...
}
&#x60;&#x60;&#x60;

Roles can be granted and revoked dynamically via the {grantRole} and
{revokeRole} functions. Each role has an associated admin role, and only
accounts that have a role&#x27;s admin role can call {grantRole} and {revokeRole}.

By default, the admin role for all roles is &#x60;DEFAULT_ADMIN_ROLE&#x60;, which means
that only accounts with this role will be able to grant or revoke other
roles. More complex role relationships can be created by using
{_setRoleAdmin}.

WARNING: The &#x60;DEFAULT_ADMIN_ROLE&#x60; is also its own admin: it has permission to
grant and revoke this role. Extra precautions should be taken to secure
accounts that have been granted it._

### __AccessControl_init

```solidity
function __AccessControl_init() internal
```

### __AccessControl_init_unchained

```solidity
function __AccessControl_init_unchained() internal
```

### RoleData

```solidity
struct RoleData {
  mapping(address &#x3D;&gt; bool) members;
  bytes32 adminRole;
}
```

### _roles

```solidity
mapping(bytes32 &#x3D;&gt; struct AccessControlUpgradeable.RoleData) _roles
```

### DEFAULT_ADMIN_ROLE

```solidity
bytes32 DEFAULT_ADMIN_ROLE
```

### onlyRole

```solidity
modifier onlyRole(bytes32 role)
```

_Modifier that checks that an account has a specific role. Reverts
with a standardized message including the required role.

The format of the revert reason is given by the following regular expression:

 /^AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})$/

_Available since v4.1.__

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### hasRole

```solidity
function hasRole(bytes32 role, address account) public view returns (bool)
```

_Returns &#x60;true&#x60; if &#x60;account&#x60; has been granted &#x60;role&#x60;._

### _checkRole

```solidity
function _checkRole(bytes32 role, address account) internal view
```

_Revert with a standard message if &#x60;account&#x60; is missing &#x60;role&#x60;.

The format of the revert reason is given by the following regular expression:

 /^AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})$/_

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 role) public view returns (bytes32)
```

_Returns the admin role that controls &#x60;role&#x60;. See {grantRole} and
{revokeRole}.

To change a role&#x27;s admin, use {_setRoleAdmin}._

### grantRole

```solidity
function grantRole(bytes32 role, address account) public virtual
```

_Grants &#x60;role&#x60; to &#x60;account&#x60;.

If &#x60;account&#x60; had not been already granted &#x60;role&#x60;, emits a {RoleGranted}
event.

Requirements:

- the caller must have &#x60;&#x60;role&#x60;&#x60;&#x27;s admin role._

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) public virtual
```

_Revokes &#x60;role&#x60; from &#x60;account&#x60;.

If &#x60;account&#x60; had been granted &#x60;role&#x60;, emits a {RoleRevoked} event.

Requirements:

- the caller must have &#x60;&#x60;role&#x60;&#x60;&#x27;s admin role._

### renounceRole

```solidity
function renounceRole(bytes32 role, address account) public virtual
```

_Revokes &#x60;role&#x60; from the calling account.

Roles are often managed via {grantRole} and {revokeRole}: this function&#x27;s
purpose is to provide a mechanism for accounts to lose their privileges
if they are compromised (such as when a trusted device is misplaced).

If the calling account had been granted &#x60;role&#x60;, emits a {RoleRevoked}
event.

Requirements:

- the caller must be &#x60;account&#x60;._

### _setupRole

```solidity
function _setupRole(bytes32 role, address account) internal virtual
```

_Grants &#x60;role&#x60; to &#x60;account&#x60;.

If &#x60;account&#x60; had not been already granted &#x60;role&#x60;, emits a {RoleGranted}
event. Note that unlike {grantRole}, this function doesn&#x27;t perform any
checks on the calling account.

[WARNING]
&#x3D;&#x3D;&#x3D;&#x3D;
This function should only be called from the constructor when setting
up the initial roles for the system.

Using this function in any other way is effectively circumventing the admin
system imposed by {AccessControl}.
&#x3D;&#x3D;&#x3D;&#x3D;_

### _setRoleAdmin

```solidity
function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual
```

_Sets &#x60;adminRole&#x60; as &#x60;&#x60;role&#x60;&#x60;&#x27;s admin role.

Emits a {RoleAdminChanged} event._

### _grantRole

```solidity
function _grantRole(bytes32 role, address account) private
```

### _revokeRole

```solidity
function _revokeRole(bytes32 role, address account) private
```

### __gap

```solidity
uint256[49] __gap
```

## IAccessControlEnumerableUpgradeable

_External interface of AccessControlEnumerable declared to support ERC165 detection._

### getRoleMember

```solidity
function getRoleMember(bytes32 role, uint256 index) external view returns (address)
```

_Returns one of the accounts that have &#x60;role&#x60;. &#x60;index&#x60; must be a
value between 0 and {getRoleMemberCount}, non-inclusive.

Role bearers are not sorted in any particular way, and their ordering may
change at any point.

WARNING: When using {getRoleMember} and {getRoleMemberCount}, make sure
you perform all queries on the same block. See the following
https://forum.openzeppelin.com/t/iterating-over-elements-on-enumerableset-in-openzeppelin-contracts/2296[forum post]
for more information._

### getRoleMemberCount

```solidity
function getRoleMemberCount(bytes32 role) external view returns (uint256)
```

_Returns the number of accounts that have &#x60;role&#x60;. Can be used
together with {getRoleMember} to enumerate all bearers of a role._

## IAccessControlUpgradeable

_External interface of AccessControl declared to support ERC165 detection._

### RoleAdminChanged

```solidity
event RoleAdminChanged(bytes32 role, bytes32 previousAdminRole, bytes32 newAdminRole)
```

_Emitted when &#x60;newAdminRole&#x60; is set as &#x60;&#x60;role&#x60;&#x60;&#x27;s admin role, replacing &#x60;previousAdminRole&#x60;

&#x60;DEFAULT_ADMIN_ROLE&#x60; is the starting admin for all roles, despite
{RoleAdminChanged} not being emitted signaling this.

_Available since v3.1.__

### RoleGranted

```solidity
event RoleGranted(bytes32 role, address account, address sender)
```

_Emitted when &#x60;account&#x60; is granted &#x60;role&#x60;.

&#x60;sender&#x60; is the account that originated the contract call, an admin role
bearer except when using {AccessControl-_setupRole}._

### RoleRevoked

```solidity
event RoleRevoked(bytes32 role, address account, address sender)
```

_Emitted when &#x60;account&#x60; is revoked &#x60;role&#x60;.

&#x60;sender&#x60; is the account that originated the contract call:
  - if using &#x60;revokeRole&#x60;, it is the admin role bearer
  - if using &#x60;renounceRole&#x60;, it is the role bearer (i.e. &#x60;account&#x60;)_

### hasRole

```solidity
function hasRole(bytes32 role, address account) external view returns (bool)
```

_Returns &#x60;true&#x60; if &#x60;account&#x60; has been granted &#x60;role&#x60;._

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 role) external view returns (bytes32)
```

_Returns the admin role that controls &#x60;role&#x60;. See {grantRole} and
{revokeRole}.

To change a role&#x27;s admin, use {AccessControl-_setRoleAdmin}._

### grantRole

```solidity
function grantRole(bytes32 role, address account) external
```

_Grants &#x60;role&#x60; to &#x60;account&#x60;.

If &#x60;account&#x60; had not been already granted &#x60;role&#x60;, emits a {RoleGranted}
event.

Requirements:

- the caller must have &#x60;&#x60;role&#x60;&#x60;&#x27;s admin role._

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) external
```

_Revokes &#x60;role&#x60; from &#x60;account&#x60;.

If &#x60;account&#x60; had been granted &#x60;role&#x60;, emits a {RoleRevoked} event.

Requirements:

- the caller must have &#x60;&#x60;role&#x60;&#x60;&#x27;s admin role._

### renounceRole

```solidity
function renounceRole(bytes32 role, address account) external
```

_Revokes &#x60;role&#x60; from the calling account.

Roles are often managed via {grantRole} and {revokeRole}: this function&#x27;s
purpose is to provide a mechanism for accounts to lose their privileges
if they are compromised (such as when a trusted device is misplaced).

If the calling account had been granted &#x60;role&#x60;, emits a {RoleRevoked}
event.

Requirements:

- the caller must be &#x60;account&#x60;._

## OwnableUpgradeable

_Contract module which provides a basic access control mechanism, where
there is an account (an owner) that can be granted exclusive access to
specific functions.

By default, the owner account will be the one that deploys the contract. This
can later be changed with {transferOwnership}.

This module is used through inheritance. It will make available the modifier
&#x60;onlyOwner&#x60;, which can be applied to your functions to restrict their use to
the owner._

### _owner

```solidity
address _owner
```

### OwnershipTransferred

```solidity
event OwnershipTransferred(address previousOwner, address newOwner)
```

### __Ownable_init

```solidity
function __Ownable_init() internal
```

_Initializes the contract setting the deployer as the initial owner._

### __Ownable_init_unchained

```solidity
function __Ownable_init_unchained() internal
```

### owner

```solidity
function owner() public view virtual returns (address)
```

_Returns the address of the current owner._

### onlyOwner

```solidity
modifier onlyOwner()
```

_Throws if called by any account other than the owner._

### renounceOwnership

```solidity
function renounceOwnership() public virtual
```

_Leaves the contract without owner. It will not be possible to call
&#x60;onlyOwner&#x60; functions anymore. Can only be called by the current owner.

NOTE: Renouncing ownership will leave the contract without an owner,
thereby removing any functionality that is only available to the owner._

### transferOwnership

```solidity
function transferOwnership(address newOwner) public virtual
```

_Transfers ownership of the contract to a new account (&#x60;newOwner&#x60;).
Can only be called by the current owner._

### _setOwner

```solidity
function _setOwner(address newOwner) private
```

### __gap

```solidity
uint256[49] __gap
```

## PaymentSplitterUpgradeable

_This contract allows to split Ether payments among a group of accounts. The sender does not need to be aware
that the Ether will be split in this way, since it is handled transparently by the contract.

The split can be in equal parts or in any other arbitrary proportion. The way this is specified is by assigning each
account to a number of shares. Of all the Ether that this contract receives, each account will then be able to claim
an amount proportional to the percentage of total shares they were assigned.

&#x60;PaymentSplitter&#x60; follows a _pull payment_ model. This means that payments are not automatically forwarded to the
accounts but kept in this contract, and the actual transfer is triggered as a separate step by calling the {release}
function._

### PayeeAdded

```solidity
event PayeeAdded(address account, uint256 shares)
```

### PaymentReleased

```solidity
event PaymentReleased(address to, uint256 amount)
```

### PaymentReceived

```solidity
event PaymentReceived(address from, uint256 amount)
```

### _totalShares

```solidity
uint256 _totalShares
```

### _totalReleased

```solidity
uint256 _totalReleased
```

### _shares

```solidity
mapping(address &#x3D;&gt; uint256) _shares
```

### _released

```solidity
mapping(address &#x3D;&gt; uint256) _released
```

### _payees

```solidity
address[] _payees
```

### __PaymentSplitter_init

```solidity
function __PaymentSplitter_init(address[] payees, uint256[] shares_) internal
```

_Creates an instance of &#x60;PaymentSplitter&#x60; where each account in &#x60;payees&#x60; is assigned the number of shares at
the matching position in the &#x60;shares&#x60; array.

All addresses in &#x60;payees&#x60; must be non-zero. Both arrays must have the same non-zero length, and there must be no
duplicates in &#x60;payees&#x60;._

### __PaymentSplitter_init_unchained

```solidity
function __PaymentSplitter_init_unchained(address[] payees, uint256[] shares_) internal
```

### receive

```solidity
receive() external payable virtual
```

_The Ether received will be logged with {PaymentReceived} events. Note that these events are not fully
reliable: it&#x27;s possible for a contract to receive Ether without triggering this function. This only affects the
reliability of the events, and not the actual splitting of Ether.

To learn more about this see the Solidity documentation for
https://solidity.readthedocs.io/en/latest/contracts.html#fallback-function[fallback
functions]._

### totalShares

```solidity
function totalShares() public view returns (uint256)
```

_Getter for the total shares held by payees._

### totalReleased

```solidity
function totalReleased() public view returns (uint256)
```

_Getter for the total amount of Ether already released._

### shares

```solidity
function shares(address account) public view returns (uint256)
```

_Getter for the amount of shares held by an account._

### released

```solidity
function released(address account) public view returns (uint256)
```

_Getter for the amount of Ether already released to a payee._

### payee

```solidity
function payee(uint256 index) public view returns (address)
```

_Getter for the address of the payee number &#x60;index&#x60;._

### release

```solidity
function release(address payable account) public virtual
```

_Triggers a transfer to &#x60;account&#x60; of the amount of Ether they are owed, according to their percentage of the
total shares and their previous withdrawals._

### _addPayee

```solidity
function _addPayee(address account, uint256 shares_) private
```

_Add a new payee to the contract._

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the payee to add. |
| shares_ | uint256 | The number of shares owned by the payee. |

### __gap

```solidity
uint256[45] __gap
```

## GovernorUpgradeable

_Core of the governance system, designed to be extended though various modules.

This contract is abstract and requires several function to be implemented in various modules:

- A counting module must implement {quorum}, {_quorumReached}, {_voteSucceeded} and {_countVote}
- A voting module must implement {getVotes}
- Additionanly, the {votingPeriod} must also be implemented

_Available since v4.3.__

### BALLOT_TYPEHASH

```solidity
bytes32 BALLOT_TYPEHASH
```

### ProposalCore

```solidity
struct ProposalCore {
  struct TimersUpgradeable.BlockNumber voteStart;
  struct TimersUpgradeable.BlockNumber voteEnd;
  bool executed;
  bool canceled;
}
```

### _name

```solidity
string _name
```

### _proposals

```solidity
mapping(uint256 &#x3D;&gt; struct GovernorUpgradeable.ProposalCore) _proposals
```

### onlyGovernance

```solidity
modifier onlyGovernance()
```

_Restrict access to governor executing address. Some module might override the _executor function to make
sure this modifier is consistant with the execution model._

### __Governor_init

```solidity
function __Governor_init(string name_) internal
```

_Sets the value for {name} and {version}_

### __Governor_init_unchained

```solidity
function __Governor_init_unchained(string name_) internal
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### name

```solidity
function name() public view virtual returns (string)
```

_See {IGovernor-name}._

### version

```solidity
function version() public view virtual returns (string)
```

_See {IGovernor-version}._

### hashProposal

```solidity
function hashProposal(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public pure virtual returns (uint256)
```

_See {IGovernor-hashProposal}.

The proposal id is produced by hashing the RLC encoded &#x60;targets&#x60; array, the &#x60;values&#x60; array, the &#x60;calldatas&#x60; array
and the descriptionHash (bytes32 which itself is the keccak256 hash of the description string). This proposal id
can be produced from the proposal data which is part of the {ProposalCreated} event. It can even be computed in
advance, before the proposal is submitted.

Note that the chainId and the governor address are not part of the proposal id computation. Consequently, the
same proposal (with same operation and same description) will have the same id if submitted on multiple governors
accross multiple networks. This also means that in order to execute the same operation twice (on the same
governor) the proposer will have to change the description in order to avoid proposal id conflicts._

### state

```solidity
function state(uint256 proposalId) public view virtual returns (enum IGovernorUpgradeable.ProposalState)
```

_See {IGovernor-state}._

### proposalSnapshot

```solidity
function proposalSnapshot(uint256 proposalId) public view virtual returns (uint256)
```

_See {IGovernor-proposalSnapshot}._

### proposalDeadline

```solidity
function proposalDeadline(uint256 proposalId) public view virtual returns (uint256)
```

_See {IGovernor-proposalDeadline}._

### _quorumReached

```solidity
function _quorumReached(uint256 proposalId) internal view virtual returns (bool)
```

_Amount of votes already cast passes the threshold limit._

### _voteSucceeded

```solidity
function _voteSucceeded(uint256 proposalId) internal view virtual returns (bool)
```

_Is the proposal successful or not._

### _countVote

```solidity
function _countVote(uint256 proposalId, address account, uint8 support, uint256 weight) internal virtual
```

_Register a vote with a given support and voting weight.

Note: Support is generic and can represent various things depending on the voting system used._

### propose

```solidity
function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) public virtual returns (uint256)
```

_See {IGovernor-propose}._

### execute

```solidity
function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public payable virtual returns (uint256)
```

_See {IGovernor-execute}._

### _execute

```solidity
function _execute(uint256, address[] targets, uint256[] values, bytes[] calldatas, bytes32) internal virtual
```

_Internal execution mechanism. Can be overriden to implement different execution mechanism_

### _cancel

```solidity
function _cancel(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) internal virtual returns (uint256)
```

_Internal cancel mechanism: locks up the proposal timer, preventing it from being re-submitted. Marks it as
canceled to allow distinguishing it from executed proposals.

Emits a {IGovernor-ProposalCanceled} event._

### castVote

```solidity
function castVote(uint256 proposalId, uint8 support) public virtual returns (uint256)
```

_See {IGovernor-castVote}._

### castVoteWithReason

```solidity
function castVoteWithReason(uint256 proposalId, uint8 support, string reason) public virtual returns (uint256)
```

_See {IGovernor-castVoteWithReason}._

### castVoteBySig

```solidity
function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s) public virtual returns (uint256)
```

_See {IGovernor-castVoteBySig}._

### _castVote

```solidity
function _castVote(uint256 proposalId, address account, uint8 support, string reason) internal virtual returns (uint256)
```

_Internal vote casting mechanism: Check that the vote is pending, that it has not been cast yet, retrieve
voting weight using {IGovernor-getVotes} and call the {_countVote} internal function.

Emits a {IGovernor-VoteCast} event._

### _executor

```solidity
function _executor() internal view virtual returns (address)
```

_Address through which the governor executes action. Will be overloaded by module that execute actions
through another contract such as a timelock._

### __gap

```solidity
uint256[48] __gap
```

## IGovernorUpgradeable

_Interface of the {Governor} core.

_Available since v4.3.__

### __IGovernor_init

```solidity
function __IGovernor_init() internal
```

### __IGovernor_init_unchained

```solidity
function __IGovernor_init_unchained() internal
```

### ProposalState

```solidity
enum ProposalState {
  Pending,
  Active,
  Canceled,
  Defeated,
  Succeeded,
  Queued,
  Expired,
  Executed
}
```

### ProposalCreated

```solidity
event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)
```

_Emitted when a proposal is created._

### ProposalCanceled

```solidity
event ProposalCanceled(uint256 proposalId)
```

_Emitted when a proposal is canceled._

### ProposalExecuted

```solidity
event ProposalExecuted(uint256 proposalId)
```

_Emitted when a proposal is executed._

### VoteCast

```solidity
event VoteCast(address voter, uint256 proposalId, uint8 support, uint256 weight, string reason)
```

_Emitted when a vote is cast.

Note: &#x60;support&#x60; values should be seen as buckets. There interpretation depends on the voting module used._

### name

```solidity
function name() public view virtual returns (string)
```

module:core

_Name of the governor instance (used in building the ERC712 domain separator)._

### version

```solidity
function version() public view virtual returns (string)
```

module:core

_Version of the governor instance (used in building the ERC712 domain separator). Default: &quot;1&quot;_

### COUNTING_MODE

```solidity
function COUNTING_MODE() public pure virtual returns (string)
```

module:voting

_A description of the possible &#x60;support&#x60; values for {castVote} and the way these votes are counted, meant to
be consumed by UIs to show correct vote options and interpret the results. The string is a URL-encoded sequence of
key-value pairs that each describe one aspect, for example &#x60;support&#x3D;bravo&amp;quorum&#x3D;for,abstain&#x60;.

There are 2 standard keys: &#x60;support&#x60; and &#x60;quorum&#x60;.

- &#x60;support&#x3D;bravo&#x60; refers to the vote options 0 &#x3D; For, 1 &#x3D; Against, 2 &#x3D; Abstain, as in &#x60;GovernorBravo&#x60;.
- &#x60;quorum&#x3D;bravo&#x60; means that only For votes are counted towards quorum.
- &#x60;quorum&#x3D;for,abstain&#x60; means that both For and Abstain votes are counted towards quorum.

NOTE: The string can be decoded by the standard
https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams[&#x60;URLSearchParams&#x60;]
JavaScript class._

### hashProposal

```solidity
function hashProposal(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public pure virtual returns (uint256)
```

module:core

_Hashing function used to (re)build the proposal id from the proposal details.._

### state

```solidity
function state(uint256 proposalId) public view virtual returns (enum IGovernorUpgradeable.ProposalState)
```

module:core

_Current state of a proposal, following Compound&#x27;s convention_

### proposalSnapshot

```solidity
function proposalSnapshot(uint256 proposalId) public view virtual returns (uint256)
```

module:core

_block number used to retrieve user&#x27;s votes and quorum._

### proposalDeadline

```solidity
function proposalDeadline(uint256 proposalId) public view virtual returns (uint256)
```

module:core

_timestamp at which votes close._

### votingDelay

```solidity
function votingDelay() public view virtual returns (uint256)
```

module:user-config

_delay, in number of block, between the proposal is created and the vote starts. This can be increassed to
leave time for users to buy voting power, of delegate it, before the voting of a proposal starts._

### votingPeriod

```solidity
function votingPeriod() public view virtual returns (uint256)
```

module:user-config

_delay, in number of blocks, between the vote start and vote ends.

Note: the {votingDelay} can delay the start of the vote. This must be considered when setting the voting
duration compared to the voting delay._

### quorum

```solidity
function quorum(uint256 blockNumber) public view virtual returns (uint256)
```

module:user-config

_Minimum number of cast voted required for a proposal to be successful.

Note: The &#x60;blockNumber&#x60; parameter corresponds to the snaphot used for counting vote. This allows to scale the
quroum depending on values such as the totalSupply of a token at this block (see {ERC20Votes})._

### getVotes

```solidity
function getVotes(address account, uint256 blockNumber) public view virtual returns (uint256)
```

module:reputation

_Voting power of an &#x60;account&#x60; at a specific &#x60;blockNumber&#x60;.

Note: this can be implemented in a number of ways, for example by reading the delegated balance from one (or
multiple), {ERC20Votes} tokens._

### hasVoted

```solidity
function hasVoted(uint256 proposalId, address account) public view virtual returns (bool)
```

module:voting

_Returns weither &#x60;account&#x60; has cast a vote on &#x60;proposalId&#x60;._

### propose

```solidity
function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) public virtual returns (uint256 proposalId)
```

_Create a new proposal. Vote start {IGovernor-votingDelay} blocks after the proposal is created and ends
{IGovernor-votingPeriod} blocks after the voting starts.

Emits a {ProposalCreated} event._

### execute

```solidity
function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public payable virtual returns (uint256 proposalId)
```

_Execute a successful proposal. This requires the quorum to be reached, the vote to be successful, and the
deadline to be reached.

Emits a {ProposalExecuted} event.

Note: some module can modify the requirements for execution, for example by adding an additional timelock._

### castVote

```solidity
function castVote(uint256 proposalId, uint8 support) public virtual returns (uint256 balance)
```

_Cast a vote

Emits a {VoteCast} event._

### castVoteWithReason

```solidity
function castVoteWithReason(uint256 proposalId, uint8 support, string reason) public virtual returns (uint256 balance)
```

_Cast a with a reason

Emits a {VoteCast} event._

### castVoteBySig

```solidity
function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s) public virtual returns (uint256 balance)
```

_Cast a vote using the user cryptographic signature.

Emits a {VoteCast} event._

### __gap

```solidity
uint256[50] __gap
```

## TimelockControllerUpgradeable

_Contract module which acts as a timelocked controller. When set as the
owner of an &#x60;Ownable&#x60; smart contract, it enforces a timelock on all
&#x60;onlyOwner&#x60; maintenance operations. This gives time for users of the
controlled contract to exit before a potentially dangerous maintenance
operation is applied.

By default, this contract is self administered, meaning administration tasks
have to go through the timelock process. The proposer (resp executor) role
is in charge of proposing (resp executing) operations. A common use case is
to position this {TimelockController} as the owner of a smart contract, with
a multisig or a DAO as the sole proposer.

_Available since v3.3.__

### TIMELOCK_ADMIN_ROLE

```solidity
bytes32 TIMELOCK_ADMIN_ROLE
```

### PROPOSER_ROLE

```solidity
bytes32 PROPOSER_ROLE
```

### EXECUTOR_ROLE

```solidity
bytes32 EXECUTOR_ROLE
```

### _DONE_TIMESTAMP

```solidity
uint256 _DONE_TIMESTAMP
```

### _timestamps

```solidity
mapping(bytes32 &#x3D;&gt; uint256) _timestamps
```

### _minDelay

```solidity
uint256 _minDelay
```

### CallScheduled

```solidity
event CallScheduled(bytes32 id, uint256 index, address target, uint256 value, bytes data, bytes32 predecessor, uint256 delay)
```

_Emitted when a call is scheduled as part of operation &#x60;id&#x60;._

### CallExecuted

```solidity
event CallExecuted(bytes32 id, uint256 index, address target, uint256 value, bytes data)
```

_Emitted when a call is performed as part of operation &#x60;id&#x60;._

### Cancelled

```solidity
event Cancelled(bytes32 id)
```

_Emitted when operation &#x60;id&#x60; is cancelled._

### MinDelayChange

```solidity
event MinDelayChange(uint256 oldDuration, uint256 newDuration)
```

_Emitted when the minimum delay for future operations is modified._

### __TimelockController_init

```solidity
function __TimelockController_init(uint256 minDelay, address[] proposers, address[] executors) internal
```

_Initializes the contract with a given &#x60;minDelay&#x60;._

### __TimelockController_init_unchained

```solidity
function __TimelockController_init_unchained(uint256 minDelay, address[] proposers, address[] executors) internal
```

### onlyRoleOrOpenRole

```solidity
modifier onlyRoleOrOpenRole(bytes32 role)
```

_Modifier to make a function callable only by a certain role. In
addition to checking the sender&#x27;s role, &#x60;address(0)&#x60; &#x27;s role is also
considered. Granting a role to &#x60;address(0)&#x60; is equivalent to enabling
this role for everyone._

### receive

```solidity
receive() external payable
```

_Contract might receive/hold ETH as part of the maintenance process._

### isOperation

```solidity
function isOperation(bytes32 id) public view virtual returns (bool pending)
```

_Returns whether an id correspond to a registered operation. This
includes both Pending, Ready and Done operations._

### isOperationPending

```solidity
function isOperationPending(bytes32 id) public view virtual returns (bool pending)
```

_Returns whether an operation is pending or not._

### isOperationReady

```solidity
function isOperationReady(bytes32 id) public view virtual returns (bool ready)
```

_Returns whether an operation is ready or not._

### isOperationDone

```solidity
function isOperationDone(bytes32 id) public view virtual returns (bool done)
```

_Returns whether an operation is done or not._

### getTimestamp

```solidity
function getTimestamp(bytes32 id) public view virtual returns (uint256 timestamp)
```

_Returns the timestamp at with an operation becomes ready (0 for
unset operations, 1 for done operations)._

### getMinDelay

```solidity
function getMinDelay() public view virtual returns (uint256 duration)
```

_Returns the minimum delay for an operation to become valid.

This value can be changed by executing an operation that calls &#x60;updateDelay&#x60;._

### hashOperation

```solidity
function hashOperation(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt) public pure virtual returns (bytes32 hash)
```

_Returns the identifier of an operation containing a single
transaction._

### hashOperationBatch

```solidity
function hashOperationBatch(address[] targets, uint256[] values, bytes[] datas, bytes32 predecessor, bytes32 salt) public pure virtual returns (bytes32 hash)
```

_Returns the identifier of an operation containing a batch of
transactions._

### schedule

```solidity
function schedule(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt, uint256 delay) public virtual
```

_Schedule an operation containing a single transaction.

Emits a {CallScheduled} event.

Requirements:

- the caller must have the &#x27;proposer&#x27; role._

### scheduleBatch

```solidity
function scheduleBatch(address[] targets, uint256[] values, bytes[] datas, bytes32 predecessor, bytes32 salt, uint256 delay) public virtual
```

_Schedule an operation containing a batch of transactions.

Emits one {CallScheduled} event per transaction in the batch.

Requirements:

- the caller must have the &#x27;proposer&#x27; role._

### _schedule

```solidity
function _schedule(bytes32 id, uint256 delay) private
```

_Schedule an operation that is to becomes valid after a given delay._

### cancel

```solidity
function cancel(bytes32 id) public virtual
```

_Cancel an operation.

Requirements:

- the caller must have the &#x27;proposer&#x27; role._

### execute

```solidity
function execute(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt) public payable virtual
```

_Execute an (ready) operation containing a single transaction.

Emits a {CallExecuted} event.

Requirements:

- the caller must have the &#x27;executor&#x27; role._

### executeBatch

```solidity
function executeBatch(address[] targets, uint256[] values, bytes[] datas, bytes32 predecessor, bytes32 salt) public payable virtual
```

_Execute an (ready) operation containing a batch of transactions.

Emits one {CallExecuted} event per transaction in the batch.

Requirements:

- the caller must have the &#x27;executor&#x27; role._

### _beforeCall

```solidity
function _beforeCall(bytes32 id, bytes32 predecessor) private view
```

_Checks before execution of an operation&#x27;s calls._

### _afterCall

```solidity
function _afterCall(bytes32 id) private
```

_Checks after execution of an operation&#x27;s calls._

### _call

```solidity
function _call(bytes32 id, uint256 index, address target, uint256 value, bytes data) private
```

_Execute an operation&#x27;s call.

Emits a {CallExecuted} event._

### updateDelay

```solidity
function updateDelay(uint256 newDelay) external virtual
```

_Changes the minimum timelock duration for future operations.

Emits a {MinDelayChange} event.

Requirements:

- the caller must be the timelock itself. This can only be achieved by scheduling and later executing
an operation where the timelock is the target and the data is the ABI-encoded call to this function._

### __gap

```solidity
uint256[48] __gap
```

## GovernorCompatibilityBravoUpgradeable

_Compatibility layer that implements GovernorBravo compatibility on to of {Governor}.

This compatibility layer includes a voting system and requires a {IGovernorTimelock} compatible module to be added
through inheritance. It does not include token bindings, not does it include any variable upgrade patterns.

_Available since v4.3.__

### __GovernorCompatibilityBravo_init

```solidity
function __GovernorCompatibilityBravo_init() internal
```

### __GovernorCompatibilityBravo_init_unchained

```solidity
function __GovernorCompatibilityBravo_init_unchained() internal
```

### VoteType

```solidity
enum VoteType {
  Against,
  For,
  Abstain
}
```

### ProposalDetails

```solidity
struct ProposalDetails {
  address proposer;
  address[] targets;
  uint256[] values;
  string[] signatures;
  bytes[] calldatas;
  uint256 forVotes;
  uint256 againstVotes;
  uint256 abstainVotes;
  mapping(address &#x3D;&gt; struct IGovernorCompatibilityBravoUpgradeable.Receipt) receipts;
  bytes32 descriptionHash;
}
```

### _proposalDetails

```solidity
mapping(uint256 &#x3D;&gt; struct GovernorCompatibilityBravoUpgradeable.ProposalDetails) _proposalDetails
```

### COUNTING_MODE

```solidity
function COUNTING_MODE() public pure virtual returns (string)
```

module:voting

_A description of the possible &#x60;support&#x60; values for {castVote} and the way these votes are counted, meant to
be consumed by UIs to show correct vote options and interpret the results. The string is a URL-encoded sequence of
key-value pairs that each describe one aspect, for example &#x60;support&#x3D;bravo&amp;quorum&#x3D;for,abstain&#x60;.

There are 2 standard keys: &#x60;support&#x60; and &#x60;quorum&#x60;.

- &#x60;support&#x3D;bravo&#x60; refers to the vote options 0 &#x3D; For, 1 &#x3D; Against, 2 &#x3D; Abstain, as in &#x60;GovernorBravo&#x60;.
- &#x60;quorum&#x3D;bravo&#x60; means that only For votes are counted towards quorum.
- &#x60;quorum&#x3D;for,abstain&#x60; means that both For and Abstain votes are counted towards quorum.

NOTE: The string can be decoded by the standard
https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams[&#x60;URLSearchParams&#x60;]
JavaScript class._

### propose

```solidity
function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) public virtual returns (uint256)
```

_See {IGovernor-propose}._

### propose

```solidity
function propose(address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description) public virtual returns (uint256)
```

_See {IGovernorCompatibilityBravo-propose}._

### queue

```solidity
function queue(uint256 proposalId) public virtual
```

_See {IGovernorCompatibilityBravo-queue}._

### execute

```solidity
function execute(uint256 proposalId) public payable virtual
```

_See {IGovernorCompatibilityBravo-execute}._

### cancel

```solidity
function cancel(uint256 proposalId) public virtual
```

_Cancels a proposal only if sender is the proposer, or proposer delegates dropped below proposal threshold._

### _encodeCalldata

```solidity
function _encodeCalldata(string[] signatures, bytes[] calldatas) private pure returns (bytes[])
```

_Encodes calldatas with optional function signature._

### _storeProposal

```solidity
function _storeProposal(address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description) private
```

_Store proposal metadata for later lookup_

### proposalThreshold

```solidity
function proposalThreshold() public view virtual returns (uint256)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;The number of votes required in order for a voter to become a proposer&quot;_._

### proposals

```solidity
function proposals(uint256 proposalId) public view virtual returns (uint256 id, address proposer, uint256 eta, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed)
```

_See {IGovernorCompatibilityBravo-proposals}._

### getActions

```solidity
function getActions(uint256 proposalId) public view virtual returns (address[] targets, uint256[] values, string[] signatures, bytes[] calldatas)
```

_See {IGovernorCompatibilityBravo-getActions}._

### getReceipt

```solidity
function getReceipt(uint256 proposalId, address voter) public view virtual returns (struct IGovernorCompatibilityBravoUpgradeable.Receipt)
```

_See {IGovernorCompatibilityBravo-getReceipt}._

### quorumVotes

```solidity
function quorumVotes() public view virtual returns (uint256)
```

_See {IGovernorCompatibilityBravo-quorumVotes}._

### hasVoted

```solidity
function hasVoted(uint256 proposalId, address account) public view virtual returns (bool)
```

_See {IGovernor-hasVoted}._

### _quorumReached

```solidity
function _quorumReached(uint256 proposalId) internal view virtual returns (bool)
```

_See {Governor-_quorumReached}. In this module, only forVotes count toward the quorum._

### _voteSucceeded

```solidity
function _voteSucceeded(uint256 proposalId) internal view virtual returns (bool)
```

_See {Governor-_voteSucceeded}. In this module, the forVotes must be scritly over the againstVotes._

### _countVote

```solidity
function _countVote(uint256 proposalId, address account, uint8 support, uint256 weight) internal virtual
```

_See {Governor-_countVote}. In this module, the support follows Governor Bravo._

### __gap

```solidity
uint256[49] __gap
```

## IGovernorCompatibilityBravoUpgradeable

_Interface extension that adds missing functions to the {Governor} core to provide &#x60;GovernorBravo&#x60; compatibility.

_Available since v4.3.__

### __IGovernorCompatibilityBravo_init

```solidity
function __IGovernorCompatibilityBravo_init() internal
```

### __IGovernorCompatibilityBravo_init_unchained

```solidity
function __IGovernorCompatibilityBravo_init_unchained() internal
```

### Proposal

```solidity
struct Proposal {
  uint256 id;
  address proposer;
  uint256 eta;
  address[] targets;
  uint256[] values;
  string[] signatures;
  bytes[] calldatas;
  uint256 startBlock;
  uint256 endBlock;
  uint256 forVotes;
  uint256 againstVotes;
  uint256 abstainVotes;
  bool canceled;
  bool executed;
  mapping(address &#x3D;&gt; struct IGovernorCompatibilityBravoUpgradeable.Receipt) receipts;
}
```

### Receipt

```solidity
struct Receipt {
  bool hasVoted;
  uint8 support;
  uint96 votes;
}
```

### quorumVotes

```solidity
function quorumVotes() public view virtual returns (uint256)
```

_Part of the Governor Bravo&#x27;s interface._

### proposals

```solidity
function proposals(uint256) public view virtual returns (uint256 id, address proposer, uint256 eta, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;The official record of all proposals ever proposed&quot;_._

### propose

```solidity
function propose(address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description) public virtual returns (uint256)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;Function used to propose a new proposal&quot;_._

### queue

```solidity
function queue(uint256 proposalId) public virtual
```

_Part of the Governor Bravo&#x27;s interface: _&quot;Queues a proposal of state succeeded&quot;_._

### execute

```solidity
function execute(uint256 proposalId) public payable virtual
```

_Part of the Governor Bravo&#x27;s interface: _&quot;Executes a queued proposal if eta has passed&quot;_._

### cancel

```solidity
function cancel(uint256 proposalId) public virtual
```

_Cancels a proposal only if sender is the proposer, or proposer delegates dropped below proposal threshold._

### getActions

```solidity
function getActions(uint256 proposalId) public view virtual returns (address[] targets, uint256[] values, string[] signatures, bytes[] calldatas)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;Gets actions of a proposal&quot;_._

### getReceipt

```solidity
function getReceipt(uint256 proposalId, address voter) public view virtual returns (struct IGovernorCompatibilityBravoUpgradeable.Receipt)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;Gets the receipt for a voter on a given proposal&quot;_._

### proposalThreshold

```solidity
function proposalThreshold() public view virtual returns (uint256)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;The number of votes required in order for a voter to become a proposer&quot;_._

### __gap

```solidity
uint256[50] __gap
```

## GovernorCountingSimpleUpgradeable

_Extension of {Governor} for simple, 3 options, vote counting.

_Available since v4.3.__

### __GovernorCountingSimple_init

```solidity
function __GovernorCountingSimple_init() internal
```

### __GovernorCountingSimple_init_unchained

```solidity
function __GovernorCountingSimple_init_unchained() internal
```

### VoteType

```solidity
enum VoteType {
  Against,
  For,
  Abstain
}
```

### ProposalVote

```solidity
struct ProposalVote {
  uint256 againstVotes;
  uint256 forVotes;
  uint256 abstainVotes;
  mapping(address &#x3D;&gt; bool) hasVoted;
}
```

### _proposalVotes

```solidity
mapping(uint256 &#x3D;&gt; struct GovernorCountingSimpleUpgradeable.ProposalVote) _proposalVotes
```

### COUNTING_MODE

```solidity
function COUNTING_MODE() public pure virtual returns (string)
```

_See {IGovernor-COUNTING_MODE}._

### hasVoted

```solidity
function hasVoted(uint256 proposalId, address account) public view virtual returns (bool)
```

_See {IGovernor-hasVoted}._

### proposalVotes

```solidity
function proposalVotes(uint256 proposalId) public view virtual returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)
```

_Accessor to the internal vote counts._

### _quorumReached

```solidity
function _quorumReached(uint256 proposalId) internal view virtual returns (bool)
```

_See {Governor-_quorumReached}._

### _voteSucceeded

```solidity
function _voteSucceeded(uint256 proposalId) internal view virtual returns (bool)
```

_See {Governor-_voteSucceeded}. In this module, the forVotes must be scritly over the againstVotes._

### _countVote

```solidity
function _countVote(uint256 proposalId, address account, uint8 support, uint256 weight) internal virtual
```

_See {Governor-_countVote}. In this module, the support follows the &#x60;VoteType&#x60; enum (from Governor Bravo)._

### __gap

```solidity
uint256[49] __gap
```

## GovernorProposalThresholdUpgradeable

_Extension of {Governor} for proposal restriction to token holders with a minimum balance.

_Available since v4.3.__

### __GovernorProposalThreshold_init

```solidity
function __GovernorProposalThreshold_init() internal
```

### __GovernorProposalThreshold_init_unchained

```solidity
function __GovernorProposalThreshold_init_unchained() internal
```

### propose

```solidity
function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) public virtual returns (uint256)
```

_See {IGovernor-propose}._

### proposalThreshold

```solidity
function proposalThreshold() public view virtual returns (uint256)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;The number of votes required in order for a voter to become a proposer&quot;_._

### __gap

```solidity
uint256[50] __gap
```

## ICompoundTimelockUpgradeable

https://github.com/compound-finance/compound-protocol/blob/master/contracts/Timelock.sol[Compound&#x27;s timelock] interface

### receive

```solidity
receive() external payable
```

### GRACE_PERIOD

```solidity
function GRACE_PERIOD() external view returns (uint256)
```

### MINIMUM_DELAY

```solidity
function MINIMUM_DELAY() external view returns (uint256)
```

### MAXIMUM_DELAY

```solidity
function MAXIMUM_DELAY() external view returns (uint256)
```

### admin

```solidity
function admin() external view returns (address)
```

### pendingAdmin

```solidity
function pendingAdmin() external view returns (address)
```

### delay

```solidity
function delay() external view returns (uint256)
```

### queuedTransactions

```solidity
function queuedTransactions(bytes32) external view returns (bool)
```

### setDelay

```solidity
function setDelay(uint256) external
```

### acceptAdmin

```solidity
function acceptAdmin() external
```

### setPendingAdmin

```solidity
function setPendingAdmin(address) external
```

### queueTransaction

```solidity
function queueTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) external returns (bytes32)
```

### cancelTransaction

```solidity
function cancelTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) external
```

### executeTransaction

```solidity
function executeTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) external payable returns (bytes)
```

## GovernorTimelockCompoundUpgradeable

_Extension of {Governor} that binds the execution process to a Compound Timelock. This adds a delay, enforced by
the external timelock to all successful proposal (in addition to the voting duration). The {Governor} needs to be
the admin of the timelock for any operation to be performed. A public, unrestricted,
{GovernorTimelockCompound-__acceptAdmin} is available to accept ownership of the timelock.

Using this model means the proposal will be operated by the {TimelockController} and not by the {Governor}. Thus,
the assets and permissions must be attached to the {TimelockController}. Any asset sent to the {Governor} will be
inaccessible.

_Available since v4.3.__

### ProposalTimelock

```solidity
struct ProposalTimelock {
  struct TimersUpgradeable.Timestamp timer;
}
```

### _timelock

```solidity
contract ICompoundTimelockUpgradeable _timelock
```

### _proposalTimelocks

```solidity
mapping(uint256 &#x3D;&gt; struct GovernorTimelockCompoundUpgradeable.ProposalTimelock) _proposalTimelocks
```

### TimelockChange

```solidity
event TimelockChange(address oldTimelock, address newTimelock)
```

_Emitted when the timelock controller used for proposal execution is modified._

### __GovernorTimelockCompound_init

```solidity
function __GovernorTimelockCompound_init(contract ICompoundTimelockUpgradeable timelockAddress) internal
```

_Set the timelock._

### __GovernorTimelockCompound_init_unchained

```solidity
function __GovernorTimelockCompound_init_unchained(contract ICompoundTimelockUpgradeable timelockAddress) internal
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### state

```solidity
function state(uint256 proposalId) public view virtual returns (enum IGovernorUpgradeable.ProposalState)
```

_Overriden version of the {Governor-state} function with added support for the &#x60;Queued&#x60; and &#x60;Expired&#x60; status._

### timelock

```solidity
function timelock() public view virtual returns (address)
```

_Public accessor to check the address of the timelock_

### proposalEta

```solidity
function proposalEta(uint256 proposalId) public view virtual returns (uint256)
```

_Public accessor to check the eta of a queued proposal_

### queue

```solidity
function queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public virtual returns (uint256)
```

_Function to queue a proposal to the timelock._

### _execute

```solidity
function _execute(uint256 proposalId, address[] targets, uint256[] values, bytes[] calldatas, bytes32) internal virtual
```

_Overriden execute function that run the already queued proposal through the timelock._

### _cancel

```solidity
function _cancel(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) internal virtual returns (uint256)
```

_Overriden version of the {Governor-_cancel} function to cancel the timelocked proposal if it as already
been queued._

### _executor

```solidity
function _executor() internal view virtual returns (address)
```

_Address through which the governor executes action. In this case, the timelock._

### __acceptAdmin

```solidity
function __acceptAdmin() public
```

_Accept admin right over the timelock._

### updateTimelock

```solidity
function updateTimelock(contract ICompoundTimelockUpgradeable newTimelock) external virtual
```

_Public endpoint to update the underlying timelock instance. Restricted to the timelock itself, so updates
must be proposed, scheduled and executed using the {Governor} workflow.

For security reason, the timelock must be handed over to another admin before setting up a new one. The two
operations (hand over the timelock) and do the update can be batched in a single proposal.

Note that if the timelock admin has been handed over in a previous operation, we refuse updates made through the
timelock if admin of the timelock has already been accepted and the operation is executed outside the scope of
governance._

### _updateTimelock

```solidity
function _updateTimelock(contract ICompoundTimelockUpgradeable newTimelock) private
```

### __gap

```solidity
uint256[48] __gap
```

## GovernorTimelockControlUpgradeable

_Extension of {Governor} that binds the execution process to an instance of {TimelockController}. This adds a
delay, enforced by the {TimelockController} to all successful proposal (in addition to the voting duration). The
{Governor} needs the proposer (an ideally the executor) roles for the {Governor} to work properly.

Using this model means the proposal will be operated by the {TimelockController} and not by the {Governor}. Thus,
the assets and permissions must be attached to the {TimelockController}. Any asset sent to the {Governor} will be
inaccessible.

_Available since v4.3.__

### _timelock

```solidity
contract TimelockControllerUpgradeable _timelock
```

### _timelockIds

```solidity
mapping(uint256 &#x3D;&gt; bytes32) _timelockIds
```

### TimelockChange

```solidity
event TimelockChange(address oldTimelock, address newTimelock)
```

_Emitted when the timelock controller used for proposal execution is modified._

### __GovernorTimelockControl_init

```solidity
function __GovernorTimelockControl_init(contract TimelockControllerUpgradeable timelockAddress) internal
```

_Set the timelock._

### __GovernorTimelockControl_init_unchained

```solidity
function __GovernorTimelockControl_init_unchained(contract TimelockControllerUpgradeable timelockAddress) internal
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### state

```solidity
function state(uint256 proposalId) public view virtual returns (enum IGovernorUpgradeable.ProposalState)
```

_Overriden version of the {Governor-state} function with added support for the &#x60;Queued&#x60; status._

### timelock

```solidity
function timelock() public view virtual returns (address)
```

_Public accessor to check the address of the timelock_

### proposalEta

```solidity
function proposalEta(uint256 proposalId) public view virtual returns (uint256)
```

_Public accessor to check the eta of a queued proposal_

### queue

```solidity
function queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public virtual returns (uint256)
```

_Function to queue a proposal to the timelock._

### _execute

```solidity
function _execute(uint256, address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) internal virtual
```

_Overriden execute function that run the already queued proposal through the timelock._

### _cancel

```solidity
function _cancel(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) internal virtual returns (uint256)
```

_Overriden version of the {Governor-_cancel} function to cancel the timelocked proposal if it as already
been queued._

### _executor

```solidity
function _executor() internal view virtual returns (address)
```

_Address through which the governor executes action. In this case, the timelock._

### updateTimelock

```solidity
function updateTimelock(contract TimelockControllerUpgradeable newTimelock) external virtual
```

_Public endpoint to update the underlying timelock instance. Restricted to the timelock itself, so updates
must be proposed, scheduled and executed using the {Governor} workflow._

### _updateTimelock

```solidity
function _updateTimelock(contract TimelockControllerUpgradeable newTimelock) private
```

### __gap

```solidity
uint256[48] __gap
```

## GovernorVotesCompUpgradeable

_Extension of {Governor} for voting weight extraction from a Comp token.

_Available since v4.3.__

### token

```solidity
contract ERC20VotesCompUpgradeable token
```

### __GovernorVotesComp_init

```solidity
function __GovernorVotesComp_init(contract ERC20VotesCompUpgradeable token_) internal
```

### __GovernorVotesComp_init_unchained

```solidity
function __GovernorVotesComp_init_unchained(contract ERC20VotesCompUpgradeable token_) internal
```

### getVotes

```solidity
function getVotes(address account, uint256 blockNumber) public view virtual returns (uint256)
```

Read the voting weight from the token&#x27;s built in snapshot mechanism (see {IGovernor-getVotes}).

### __gap

```solidity
uint256[50] __gap
```

## GovernorVotesQuorumFractionUpgradeable

_Extension of {Governor} for voting weight extraction from an {ERC20Votes} token and a quorum expressed as a
fraction of the total supply.

_Available since v4.3.__

### _quorumNumerator

```solidity
uint256 _quorumNumerator
```

### QuorumNumeratorUpdated

```solidity
event QuorumNumeratorUpdated(uint256 oldQuorumNumerator, uint256 newQuorumNumerator)
```

### __GovernorVotesQuorumFraction_init

```solidity
function __GovernorVotesQuorumFraction_init(uint256 quorumNumeratorValue) internal
```

### __GovernorVotesQuorumFraction_init_unchained

```solidity
function __GovernorVotesQuorumFraction_init_unchained(uint256 quorumNumeratorValue) internal
```

### quorumNumerator

```solidity
function quorumNumerator() public view virtual returns (uint256)
```

### quorumDenominator

```solidity
function quorumDenominator() public view virtual returns (uint256)
```

### quorum

```solidity
function quorum(uint256 blockNumber) public view virtual returns (uint256)
```

module:user-config

_Minimum number of cast voted required for a proposal to be successful.

Note: The &#x60;blockNumber&#x60; parameter corresponds to the snaphot used for counting vote. This allows to scale the
quroum depending on values such as the totalSupply of a token at this block (see {ERC20Votes})._

### updateQuorumNumerator

```solidity
function updateQuorumNumerator(uint256 newQuorumNumerator) external virtual
```

### _updateQuorumNumerator

```solidity
function _updateQuorumNumerator(uint256 newQuorumNumerator) internal virtual
```

### __gap

```solidity
uint256[49] __gap
```

## GovernorVotesUpgradeable

_Extension of {Governor} for voting weight extraction from an {ERC20Votes} token.

_Available since v4.3.__

### token

```solidity
contract ERC20VotesUpgradeable token
```

### __GovernorVotes_init

```solidity
function __GovernorVotes_init(contract ERC20VotesUpgradeable tokenAddress) internal
```

### __GovernorVotes_init_unchained

```solidity
function __GovernorVotes_init_unchained(contract ERC20VotesUpgradeable tokenAddress) internal
```

### getVotes

```solidity
function getVotes(address account, uint256 blockNumber) public view virtual returns (uint256)
```

Read the voting weight from the token&#x27;s built in snapshot mechanism (see {IGovernor-getVotes}).

### __gap

```solidity
uint256[50] __gap
```

## IGovernorTimelockUpgradeable

_Extension of the {IGovernor} for timelock supporting modules.

_Available since v4.3.__

### __IGovernorTimelock_init

```solidity
function __IGovernorTimelock_init() internal
```

### __IGovernorTimelock_init_unchained

```solidity
function __IGovernorTimelock_init_unchained() internal
```

### ProposalQueued

```solidity
event ProposalQueued(uint256 proposalId, uint256 eta)
```

### timelock

```solidity
function timelock() public view virtual returns (address)
```

### proposalEta

```solidity
function proposalEta(uint256 proposalId) public view virtual returns (uint256)
```

### queue

```solidity
function queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public virtual returns (uint256 proposalId)
```

### __gap

```solidity
uint256[50] __gap
```

## IERC1271Upgradeable

_Interface of the ERC1271 standard signature validation method for
contracts as defined in https://eips.ethereum.org/EIPS/eip-1271[ERC-1271].

_Available since v4.1.__

### isValidSignature

```solidity
function isValidSignature(bytes32 hash, bytes signature) external view returns (bytes4 magicValue)
```

_Should return whether the signature provided is valid for the provided data_

| Name | Type | Description |
| ---- | ---- | ----------- |
| hash | bytes32 | Hash of the data to be signed |
| signature | bytes | Signature byte array associated with _data |

## IERC1363Upgradeable

### transferAndCall

```solidity
function transferAndCall(address to, uint256 value) external returns (bool)
```

_Transfer tokens from &#x60;msg.sender&#x60; to another address and then call &#x60;onTransferReceived&#x60; on receiver_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address The address which you want to transfer to |
| value | uint256 | uint256 The amount of tokens to be transferred |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true unless throwing |

### transferAndCall

```solidity
function transferAndCall(address to, uint256 value, bytes data) external returns (bool)
```

_Transfer tokens from &#x60;msg.sender&#x60; to another address and then call &#x60;onTransferReceived&#x60; on receiver_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address The address which you want to transfer to |
| value | uint256 | uint256 The amount of tokens to be transferred |
| data | bytes | bytes Additional data with no specified format, sent in call to &#x60;to&#x60; |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true unless throwing |

### transferFromAndCall

```solidity
function transferFromAndCall(address from, address to, uint256 value) external returns (bool)
```

_Transfer tokens from one address to another and then call &#x60;onTransferReceived&#x60; on receiver_

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | address The address which you want to send tokens from |
| to | address | address The address which you want to transfer to |
| value | uint256 | uint256 The amount of tokens to be transferred |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true unless throwing |

### transferFromAndCall

```solidity
function transferFromAndCall(address from, address to, uint256 value, bytes data) external returns (bool)
```

_Transfer tokens from one address to another and then call &#x60;onTransferReceived&#x60; on receiver_

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | address The address which you want to send tokens from |
| to | address | address The address which you want to transfer to |
| value | uint256 | uint256 The amount of tokens to be transferred |
| data | bytes | bytes Additional data with no specified format, sent in call to &#x60;to&#x60; |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true unless throwing |

### approveAndCall

```solidity
function approveAndCall(address spender, uint256 value) external returns (bool)
```

_Approve the passed address to spend the specified amount of tokens on behalf of msg.sender
and then call &#x60;onApprovalReceived&#x60; on spender._

| Name | Type | Description |
| ---- | ---- | ----------- |
| spender | address | address The address which will spend the funds |
| value | uint256 | uint256 The amount of tokens to be spent |

### approveAndCall

```solidity
function approveAndCall(address spender, uint256 value, bytes data) external returns (bool)
```

_Approve the passed address to spend the specified amount of tokens on behalf of msg.sender
and then call &#x60;onApprovalReceived&#x60; on spender._

| Name | Type | Description |
| ---- | ---- | ----------- |
| spender | address | address The address which will spend the funds |
| value | uint256 | uint256 The amount of tokens to be spent |
| data | bytes | bytes Additional data with no specified format, sent in call to &#x60;spender&#x60; |

## IERC2981Upgradeable

_Interface for the NFT Royalty Standard_

### royaltyInfo

```solidity
function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount)
```

_Called with the sale price to determine how much royalty is owed and to whom._

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | - the NFT asset queried for royalty information |
| salePrice | uint256 | - the sale price of the NFT asset specified by &#x60;tokenId&#x60; |

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | address | - address of who should be sent the royalty payment |
| royaltyAmount | uint256 | - the royalty payment amount for &#x60;salePrice&#x60; |

## IERC3156FlashBorrowerUpgradeable

_Interface of the ERC3156 FlashBorrower, as defined in
https://eips.ethereum.org/EIPS/eip-3156[ERC-3156].

_Available since v4.1.__

### onFlashLoan

```solidity
function onFlashLoan(address initiator, address token, uint256 amount, uint256 fee, bytes data) external returns (bytes32)
```

_Receive a flash loan._

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The initiator of the loan. |
| token | address | The loan currency. |
| amount | uint256 | The amount of tokens lent. |
| fee | uint256 | The additional amount of tokens to repay. |
| data | bytes | Arbitrary data structure, intended to contain user-defined parameters. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | The keccak256 hash of &quot;ERC3156FlashBorrower.onFlashLoan&quot; |

## IERC3156FlashLenderUpgradeable

_Interface of the ERC3156 FlashLender, as defined in
https://eips.ethereum.org/EIPS/eip-3156[ERC-3156].

_Available since v4.1.__

### maxFlashLoan

```solidity
function maxFlashLoan(address token) external view returns (uint256)
```

_The amount of currency available to be lended._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The loan currency. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of &#x60;token&#x60; that can be borrowed. |

### flashFee

```solidity
function flashFee(address token, uint256 amount) external view returns (uint256)
```

_The fee to be charged for a given loan._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The loan currency. |
| amount | uint256 | The amount of tokens lent. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of &#x60;token&#x60; to be charged for the loan, on top of the returned principal. |

### flashLoan

```solidity
function flashLoan(contract IERC3156FlashBorrowerUpgradeable receiver, address token, uint256 amount, bytes data) external returns (bool)
```

_Initiate a flash loan._

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | contract IERC3156FlashBorrowerUpgradeable | The receiver of the tokens in the loan, and the receiver of the callback. |
| token | address | The loan currency. |
| amount | uint256 | The amount of tokens lent. |
| data | bytes | Arbitrary data structure, intended to contain user-defined parameters. |

## IERC2612Upgradeable

## ERC2771ContextUpgradeable

_Context variant with ERC2771 support._

### _trustedForwarder

```solidity
address _trustedForwarder
```

### __ERC2771Context_init

```solidity
function __ERC2771Context_init(address trustedForwarder) internal
```

### __ERC2771Context_init_unchained

```solidity
function __ERC2771Context_init_unchained(address trustedForwarder) internal
```

### isTrustedForwarder

```solidity
function isTrustedForwarder(address forwarder) public view virtual returns (bool)
```

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address sender)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

### __gap

```solidity
uint256[49] __gap
```

## MinimalForwarderUpgradeable

_Simple minimal forwarder to be used together with an ERC2771 compatible contract. See {ERC2771Context}._

### ForwardRequest

```solidity
struct ForwardRequest {
  address from;
  address to;
  uint256 value;
  uint256 gas;
  uint256 nonce;
  bytes data;
}
```

### _TYPEHASH

```solidity
bytes32 _TYPEHASH
```

### _nonces

```solidity
mapping(address &#x3D;&gt; uint256) _nonces
```

### __MinimalForwarder_init

```solidity
function __MinimalForwarder_init() internal
```

### __MinimalForwarder_init_unchained

```solidity
function __MinimalForwarder_init_unchained() internal
```

### getNonce

```solidity
function getNonce(address from) public view returns (uint256)
```

### verify

```solidity
function verify(struct MinimalForwarderUpgradeable.ForwardRequest req, bytes signature) public view returns (bool)
```

### execute

```solidity
function execute(struct MinimalForwarderUpgradeable.ForwardRequest req, bytes signature) public payable returns (bool, bytes)
```

### __gap

```solidity
uint256[49] __gap
```

## ERC1967UpgradeUpgradeable

_This abstract contract provides getters and event emitting update functions for
https://eips.ethereum.org/EIPS/eip-1967[EIP1967] slots.

_Available since v4.1.__

### __ERC1967Upgrade_init

```solidity
function __ERC1967Upgrade_init() internal
```

### __ERC1967Upgrade_init_unchained

```solidity
function __ERC1967Upgrade_init_unchained() internal
```

### _ROLLBACK_SLOT

```solidity
bytes32 _ROLLBACK_SLOT
```

### _IMPLEMENTATION_SLOT

```solidity
bytes32 _IMPLEMENTATION_SLOT
```

_Storage slot with the address of the current implementation.
This is the keccak-256 hash of &quot;eip1967.proxy.implementation&quot; subtracted by 1, and is
validated in the constructor._

### Upgraded

```solidity
event Upgraded(address implementation)
```

_Emitted when the implementation is upgraded._

### _getImplementation

```solidity
function _getImplementation() internal view returns (address)
```

_Returns the current implementation address._

### _setImplementation

```solidity
function _setImplementation(address newImplementation) private
```

_Stores a new address in the EIP1967 implementation slot._

### _upgradeTo

```solidity
function _upgradeTo(address newImplementation) internal
```

_Perform implementation upgrade

Emits an {Upgraded} event._

### _upgradeToAndCall

```solidity
function _upgradeToAndCall(address newImplementation, bytes data, bool forceCall) internal
```

_Perform implementation upgrade with additional setup call.

Emits an {Upgraded} event._

### _upgradeToAndCallSecure

```solidity
function _upgradeToAndCallSecure(address newImplementation, bytes data, bool forceCall) internal
```

_Perform implementation upgrade with security checks for UUPS proxies, and additional setup call.

Emits an {Upgraded} event._

### _ADMIN_SLOT

```solidity
bytes32 _ADMIN_SLOT
```

_Storage slot with the admin of the contract.
This is the keccak-256 hash of &quot;eip1967.proxy.admin&quot; subtracted by 1, and is
validated in the constructor._

### AdminChanged

```solidity
event AdminChanged(address previousAdmin, address newAdmin)
```

_Emitted when the admin account has changed._

### _getAdmin

```solidity
function _getAdmin() internal view returns (address)
```

_Returns the current admin._

### _setAdmin

```solidity
function _setAdmin(address newAdmin) private
```

_Stores a new address in the EIP1967 admin slot._

### _changeAdmin

```solidity
function _changeAdmin(address newAdmin) internal
```

_Changes the admin of the proxy.

Emits an {AdminChanged} event._

### _BEACON_SLOT

```solidity
bytes32 _BEACON_SLOT
```

_The storage slot of the UpgradeableBeacon contract which defines the implementation for this proxy.
This is bytes32(uint256(keccak256(&#x27;eip1967.proxy.beacon&#x27;)) - 1)) and is validated in the constructor._

### BeaconUpgraded

```solidity
event BeaconUpgraded(address beacon)
```

_Emitted when the beacon is upgraded._

### _getBeacon

```solidity
function _getBeacon() internal view returns (address)
```

_Returns the current beacon._

### _setBeacon

```solidity
function _setBeacon(address newBeacon) private
```

_Stores a new beacon in the EIP1967 beacon slot._

### _upgradeBeaconToAndCall

```solidity
function _upgradeBeaconToAndCall(address newBeacon, bytes data, bool forceCall) internal
```

_Perform beacon upgrade with additional setup call. Note: This upgrades the address of the beacon, it does
not upgrade the implementation contained in the beacon (see {UpgradeableBeacon-_setImplementation} for that).

Emits a {BeaconUpgraded} event._

### _functionDelegateCall

```solidity
function _functionDelegateCall(address target, bytes data) private returns (bytes)
```

_Same as {xref-Address-functionCall-address-bytes-string-}[&#x60;functionCall&#x60;],
but performing a delegate call.

_Available since v3.4.__

### __gap

```solidity
uint256[50] __gap
```

## IBeaconUpgradeable

_This is the interface that {BeaconProxy} expects of its beacon._

### implementation

```solidity
function implementation() external view returns (address)
```

_Must return an address that can be used as a delegate call target.

{BeaconProxy} will check that this address is a contract._

## Initializable

_This is a base contract to aid in writing upgradeable contracts, or any kind of contract that will be deployed
behind a proxy. Since a proxied contract can&#x27;t have a constructor, it&#x27;s common to move constructor logic to an
external initializer function, usually called &#x60;initialize&#x60;. It then becomes necessary to protect this initializer
function so it can only be called once. The {initializer} modifier provided by this contract will have this effect.

TIP: To avoid leaving the proxy in an uninitialized state, the initializer function should be called as early as
possible by providing the encoded function call as the &#x60;_data&#x60; argument to {ERC1967Proxy-constructor}.

CAUTION: When used with inheritance, manual care must be taken to not invoke a parent initializer twice, or to ensure
that all initializers are idempotent. This is not verified automatically as constructors are by Solidity._

### _initialized

```solidity
bool _initialized
```

_Indicates that the contract has been initialized._

### _initializing

```solidity
bool _initializing
```

_Indicates that the contract is in the process of being initialized._

### initializer

```solidity
modifier initializer()
```

_Modifier to protect an initializer function from being invoked twice._

## UUPSUpgradeable

_An upgradeability mechanism designed for UUPS proxies. The functions included here can perform an upgrade of an
{ERC1967Proxy}, when this contract is set as the implementation behind such a proxy.

A security mechanism ensures that an upgrade does not turn off upgradeability accidentally, although this risk is
reinstated if the upgrade retains upgradeability but removes the security mechanism, e.g. by replacing
&#x60;UUPSUpgradeable&#x60; with a custom implementation of upgrades.

The {_authorizeUpgrade} function must be overridden to include access restriction to the upgrade mechanism.

_Available since v4.1.__

### __UUPSUpgradeable_init

```solidity
function __UUPSUpgradeable_init() internal
```

### __UUPSUpgradeable_init_unchained

```solidity
function __UUPSUpgradeable_init_unchained() internal
```

### upgradeTo

```solidity
function upgradeTo(address newImplementation) external virtual
```

_Upgrade the implementation of the proxy to &#x60;newImplementation&#x60;.

Calls {_authorizeUpgrade}.

Emits an {Upgraded} event._

### upgradeToAndCall

```solidity
function upgradeToAndCall(address newImplementation, bytes data) external payable virtual
```

_Upgrade the implementation of the proxy to &#x60;newImplementation&#x60;, and subsequently execute the function call
encoded in &#x60;data&#x60;.

Calls {_authorizeUpgrade}.

Emits an {Upgraded} event._

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal virtual
```

_Function that should revert when &#x60;msg.sender&#x60; is not authorized to upgrade the contract. Called by
{upgradeTo} and {upgradeToAndCall}.

Normally, this function will use an xref:access.adoc[access control] modifier such as {Ownable-onlyOwner}.

&#x60;&#x60;&#x60;solidity
function _authorizeUpgrade(address) internal override onlyOwner {}
&#x60;&#x60;&#x60;_

### __gap

```solidity
uint256[50] __gap
```

## PausableUpgradeable

_Contract module which allows children to implement an emergency stop
mechanism that can be triggered by an authorized account.

This module is used through inheritance. It will make available the
modifiers &#x60;whenNotPaused&#x60; and &#x60;whenPaused&#x60;, which can be applied to
the functions of your contract. Note that they will not be pausable by
simply including this module, only once the modifiers are put in place._

### Paused

```solidity
event Paused(address account)
```

_Emitted when the pause is triggered by &#x60;account&#x60;._

### Unpaused

```solidity
event Unpaused(address account)
```

_Emitted when the pause is lifted by &#x60;account&#x60;._

### _paused

```solidity
bool _paused
```

### __Pausable_init

```solidity
function __Pausable_init() internal
```

_Initializes the contract in unpaused state._

### __Pausable_init_unchained

```solidity
function __Pausable_init_unchained() internal
```

### paused

```solidity
function paused() public view virtual returns (bool)
```

_Returns true if the contract is paused, and false otherwise._

### whenNotPaused

```solidity
modifier whenNotPaused()
```

_Modifier to make a function callable only when the contract is not paused.

Requirements:

- The contract must not be paused._

### whenPaused

```solidity
modifier whenPaused()
```

_Modifier to make a function callable only when the contract is paused.

Requirements:

- The contract must be paused._

### _pause

```solidity
function _pause() internal virtual
```

_Triggers stopped state.

Requirements:

- The contract must not be paused._

### _unpause

```solidity
function _unpause() internal virtual
```

_Returns to normal state.

Requirements:

- The contract must be paused._

### __gap

```solidity
uint256[49] __gap
```

## PullPaymentUpgradeable

_Simple implementation of a
https://consensys.github.io/smart-contract-best-practices/recommendations/#favor-pull-over-push-for-external-calls[pull-payment]
strategy, where the paying contract doesn&#x27;t interact directly with the
receiver account, which must withdraw its payments itself.

Pull-payments are often considered the best practice when it comes to sending
Ether, security-wise. It prevents recipients from blocking execution, and
eliminates reentrancy concerns.

TIP: If you would like to learn more about reentrancy and alternative ways
to protect against it, check out our blog post
https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].

To use, derive from the &#x60;PullPayment&#x60; contract, and use {_asyncTransfer}
instead of Solidity&#x27;s &#x60;transfer&#x60; function. Payees can query their due
payments with {payments}, and retrieve them with {withdrawPayments}._

### _escrow

```solidity
contract EscrowUpgradeable _escrow
```

### __PullPayment_init

```solidity
function __PullPayment_init() internal
```

### __PullPayment_init_unchained

```solidity
function __PullPayment_init_unchained() internal
```

### withdrawPayments

```solidity
function withdrawPayments(address payable payee) public virtual
```

_Withdraw accumulated payments, forwarding all gas to the recipient.

Note that _any_ account can call this function, not just the &#x60;payee&#x60;.
This means that contracts unaware of the &#x60;PullPayment&#x60; protocol can still
receive funds this way, by having a separate account call
{withdrawPayments}.

WARNING: Forwarding all gas opens the door to reentrancy vulnerabilities.
Make sure you trust the recipient, or are either following the
checks-effects-interactions pattern or using {ReentrancyGuard}._

| Name | Type | Description |
| ---- | ---- | ----------- |
| payee | address payable | Whose payments will be withdrawn. |

### payments

```solidity
function payments(address dest) public view returns (uint256)
```

_Returns the payments owed to an address._

| Name | Type | Description |
| ---- | ---- | ----------- |
| dest | address | The creditor&#x27;s address. |

### _asyncTransfer

```solidity
function _asyncTransfer(address dest, uint256 amount) internal virtual
```

_Called by the payer to store the sent amount as credit to be pulled.
Funds sent in this way are stored in an intermediate {Escrow} contract, so
there is no danger of them being spent before withdrawal._

| Name | Type | Description |
| ---- | ---- | ----------- |
| dest | address | The destination address of the funds. |
| amount | uint256 | The amount to transfer. |

### __gap

```solidity
uint256[50] __gap
```

## ReentrancyGuardUpgradeable

_Contract module that helps prevent reentrant calls to a function.

Inheriting from &#x60;ReentrancyGuard&#x60; will make the {nonReentrant} modifier
available, which can be applied to functions to make sure there are no nested
(reentrant) calls to them.

Note that because there is a single &#x60;nonReentrant&#x60; guard, functions marked as
&#x60;nonReentrant&#x60; may not call one another. This can be worked around by making
those functions &#x60;private&#x60;, and then adding &#x60;external&#x60; &#x60;nonReentrant&#x60; entry
points to them.

TIP: If you would like to learn more about reentrancy and alternative ways
to protect against it, check out our blog post
https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul]._

### _NOT_ENTERED

```solidity
uint256 _NOT_ENTERED
```

### _ENTERED

```solidity
uint256 _ENTERED
```

### _status

```solidity
uint256 _status
```

### __ReentrancyGuard_init

```solidity
function __ReentrancyGuard_init() internal
```

### __ReentrancyGuard_init_unchained

```solidity
function __ReentrancyGuard_init_unchained() internal
```

### nonReentrant

```solidity
modifier nonReentrant()
```

_Prevents a contract from calling itself, directly or indirectly.
Calling a &#x60;nonReentrant&#x60; function from another &#x60;nonReentrant&#x60;
function is not supported. It is possible to prevent this from happening
by making the &#x60;nonReentrant&#x60; function external, and make it call a
&#x60;private&#x60; function that does the actual work._

### __gap

```solidity
uint256[49] __gap
```

## ERC1155Upgradeable

_Implementation of the basic standard multi-token.
See https://eips.ethereum.org/EIPS/eip-1155
Originally based on code by Enjin: https://github.com/enjin/erc-1155

_Available since v3.1.__

### _balances

```solidity
mapping(uint256 &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) _balances
```

### _operatorApprovals

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; bool)) _operatorApprovals
```

### _uri

```solidity
string _uri
```

### __ERC1155_init

```solidity
function __ERC1155_init(string uri_) internal
```

_See {_setURI}._

### __ERC1155_init_unchained

```solidity
function __ERC1155_init_unchained(string uri_) internal
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### uri

```solidity
function uri(uint256) public view virtual returns (string)
```

_See {IERC1155MetadataURI-uri}.

This implementation returns the same URI for *all* token types. It relies
on the token type ID substitution mechanism
https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].

Clients calling this function must replace the &#x60;\{id\}&#x60; substring with the
actual token type ID._

### balanceOf

```solidity
function balanceOf(address account, uint256 id) public view virtual returns (uint256)
```

_See {IERC1155-balanceOf}.

Requirements:

- &#x60;account&#x60; cannot be the zero address._

### balanceOfBatch

```solidity
function balanceOfBatch(address[] accounts, uint256[] ids) public view virtual returns (uint256[])
```

_See {IERC1155-balanceOfBatch}.

Requirements:

- &#x60;accounts&#x60; and &#x60;ids&#x60; must have the same length._

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) public virtual
```

_See {IERC1155-setApprovalForAll}._

### isApprovedForAll

```solidity
function isApprovedForAll(address account, address operator) public view virtual returns (bool)
```

_See {IERC1155-isApprovedForAll}._

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) public virtual
```

_See {IERC1155-safeTransferFrom}._

### safeBatchTransferFrom

```solidity
function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data) public virtual
```

_See {IERC1155-safeBatchTransferFrom}._

### _safeTransferFrom

```solidity
function _safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) internal virtual
```

_Transfers &#x60;amount&#x60; tokens of token type &#x60;id&#x60; from &#x60;from&#x60; to &#x60;to&#x60;.

Emits a {TransferSingle} event.

Requirements:

- &#x60;to&#x60; cannot be the zero address.
- &#x60;from&#x60; must have a balance of tokens of type &#x60;id&#x60; of at least &#x60;amount&#x60;.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
acceptance magic value._

### _safeBatchTransferFrom

```solidity
function _safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

_xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {_safeTransferFrom}.

Emits a {TransferBatch} event.

Requirements:

- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
acceptance magic value._

### _setURI

```solidity
function _setURI(string newuri) internal virtual
```

_Sets a new URI for all token types, by relying on the token type ID
substitution mechanism
https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].

By this mechanism, any occurrence of the &#x60;\{id\}&#x60; substring in either the
URI or any of the amounts in the JSON file at said URI will be replaced by
clients with the token type ID.

For example, the &#x60;https://token-cdn-domain/\{id\}.json&#x60; URI would be
interpreted by clients as
&#x60;https://token-cdn-domain/000000000000000000000000000000000000000000000000000000000004cce0.json&#x60;
for token type ID 0x4cce0.

See {uri}.

Because these URIs cannot be meaningfully represented by the {URI} event,
this function emits no events._

### _mint

```solidity
function _mint(address account, uint256 id, uint256 amount, bytes data) internal virtual
```

_Creates &#x60;amount&#x60; tokens of token type &#x60;id&#x60;, and assigns them to &#x60;account&#x60;.

Emits a {TransferSingle} event.

Requirements:

- &#x60;account&#x60; cannot be the zero address.
- If &#x60;account&#x60; refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
acceptance magic value._

### _mintBatch

```solidity
function _mintBatch(address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

_xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {_mint}.

Requirements:

- &#x60;ids&#x60; and &#x60;amounts&#x60; must have the same length.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
acceptance magic value._

### _burn

```solidity
function _burn(address account, uint256 id, uint256 amount) internal virtual
```

_Destroys &#x60;amount&#x60; tokens of token type &#x60;id&#x60; from &#x60;account&#x60;

Requirements:

- &#x60;account&#x60; cannot be the zero address.
- &#x60;account&#x60; must have at least &#x60;amount&#x60; tokens of token type &#x60;id&#x60;._

### _burnBatch

```solidity
function _burnBatch(address account, uint256[] ids, uint256[] amounts) internal virtual
```

_xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {_burn}.

Requirements:

- &#x60;ids&#x60; and &#x60;amounts&#x60; must have the same length._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

_Hook that is called before any token transfer. This includes minting
and burning, as well as batched variants.

The same hook is called on both single and batched variants. For single
transfers, the length of the &#x60;id&#x60; and &#x60;amount&#x60; arrays will be 1.

Calling conditions (for each &#x60;id&#x60; and &#x60;amount&#x60; pair):

- When &#x60;from&#x60; and &#x60;to&#x60; are both non-zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens
of token type &#x60;id&#x60; will be  transferred to &#x60;to&#x60;.
- When &#x60;from&#x60; is zero, &#x60;amount&#x60; tokens of token type &#x60;id&#x60; will be minted
for &#x60;to&#x60;.
- when &#x60;to&#x60; is zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens of token type &#x60;id&#x60;
will be burned.
- &#x60;from&#x60; and &#x60;to&#x60; are never both zero.
- &#x60;ids&#x60; and &#x60;amounts&#x60; have the same, non-zero length.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### _doSafeTransferAcceptanceCheck

```solidity
function _doSafeTransferAcceptanceCheck(address operator, address from, address to, uint256 id, uint256 amount, bytes data) private
```

### _doSafeBatchTransferAcceptanceCheck

```solidity
function _doSafeBatchTransferAcceptanceCheck(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) private
```

### _asSingletonArray

```solidity
function _asSingletonArray(uint256 element) private pure returns (uint256[])
```

### __gap

```solidity
uint256[47] __gap
```

## IERC1155ReceiverUpgradeable

__Available since v3.1.__

### onERC1155Received

```solidity
function onERC1155Received(address operator, address from, uint256 id, uint256 value, bytes data) external returns (bytes4)
```

_Handles the receipt of a single ERC1155 token type. This function is
        called at the end of a &#x60;safeTransferFrom&#x60; after the balance has been updated.
        To accept the transfer, this must return
        &#x60;bytes4(keccak256(&quot;onERC1155Received(address,address,uint256,uint256,bytes)&quot;))&#x60;
        (i.e. 0xf23a6e61, or its own function selector).
        @param operator The address which initiated the transfer (i.e. msg.sender)
        @param from The address which previously owned the token
        @param id The ID of the token being transferred
        @param value The amount of tokens being transferred
        @param data Additional data with no specified format
        @return &#x60;bytes4(keccak256(&quot;onERC1155Received(address,address,uint256,uint256,bytes)&quot;))&#x60; if transfer is allowed_

### onERC1155BatchReceived

```solidity
function onERC1155BatchReceived(address operator, address from, uint256[] ids, uint256[] values, bytes data) external returns (bytes4)
```

_Handles the receipt of a multiple ERC1155 token types. This function
        is called at the end of a &#x60;safeBatchTransferFrom&#x60; after the balances have
        been updated. To accept the transfer(s), this must return
        &#x60;bytes4(keccak256(&quot;onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)&quot;))&#x60;
        (i.e. 0xbc197c81, or its own function selector).
        @param operator The address which initiated the batch transfer (i.e. msg.sender)
        @param from The address which previously owned the token
        @param ids An array containing ids of each token being transferred (order and length must match values array)
        @param values An array containing amounts of each token being transferred (order and length must match ids array)
        @param data Additional data with no specified format
        @return &#x60;bytes4(keccak256(&quot;onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)&quot;))&#x60; if transfer is allowed_

## IERC1155Upgradeable

_Required interface of an ERC1155 compliant contract, as defined in the
https://eips.ethereum.org/EIPS/eip-1155[EIP].

_Available since v3.1.__

### TransferSingle

```solidity
event TransferSingle(address operator, address from, address to, uint256 id, uint256 value)
```

_Emitted when &#x60;value&#x60; tokens of token type &#x60;id&#x60; are transferred from &#x60;from&#x60; to &#x60;to&#x60; by &#x60;operator&#x60;._

### TransferBatch

```solidity
event TransferBatch(address operator, address from, address to, uint256[] ids, uint256[] values)
```

_Equivalent to multiple {TransferSingle} events, where &#x60;operator&#x60;, &#x60;from&#x60; and &#x60;to&#x60; are the same for all
transfers._

### ApprovalForAll

```solidity
event ApprovalForAll(address account, address operator, bool approved)
```

_Emitted when &#x60;account&#x60; grants or revokes permission to &#x60;operator&#x60; to transfer their tokens, according to
&#x60;approved&#x60;._

### URI

```solidity
event URI(string value, uint256 id)
```

_Emitted when the URI for token type &#x60;id&#x60; changes to &#x60;value&#x60;, if it is a non-programmatic URI.

If an {URI} event was emitted for &#x60;id&#x60;, the standard
https://eips.ethereum.org/EIPS/eip-1155#metadata-extensions[guarantees] that &#x60;value&#x60; will equal the value
returned by {IERC1155MetadataURI-uri}._

### balanceOf

```solidity
function balanceOf(address account, uint256 id) external view returns (uint256)
```

_Returns the amount of tokens of token type &#x60;id&#x60; owned by &#x60;account&#x60;.

Requirements:

- &#x60;account&#x60; cannot be the zero address._

### balanceOfBatch

```solidity
function balanceOfBatch(address[] accounts, uint256[] ids) external view returns (uint256[])
```

_xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {balanceOf}.

Requirements:

- &#x60;accounts&#x60; and &#x60;ids&#x60; must have the same length._

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) external
```

_Grants or revokes permission to &#x60;operator&#x60; to transfer the caller&#x27;s tokens, according to &#x60;approved&#x60;,

Emits an {ApprovalForAll} event.

Requirements:

- &#x60;operator&#x60; cannot be the caller._

### isApprovedForAll

```solidity
function isApprovedForAll(address account, address operator) external view returns (bool)
```

_Returns true if &#x60;operator&#x60; is approved to transfer &#x60;&#x60;account&#x60;&#x60;&#x27;s tokens.

See {setApprovalForAll}._

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) external
```

_Transfers &#x60;amount&#x60; tokens of token type &#x60;id&#x60; from &#x60;from&#x60; to &#x60;to&#x60;.

Emits a {TransferSingle} event.

Requirements:

- &#x60;to&#x60; cannot be the zero address.
- If the caller is not &#x60;from&#x60;, it must be have been approved to spend &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens via {setApprovalForAll}.
- &#x60;from&#x60; must have a balance of tokens of type &#x60;id&#x60; of at least &#x60;amount&#x60;.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
acceptance magic value._

### safeBatchTransferFrom

```solidity
function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data) external
```

_xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {safeTransferFrom}.

Emits a {TransferBatch} event.

Requirements:

- &#x60;ids&#x60; and &#x60;amounts&#x60; must have the same length.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
acceptance magic value._

## ERC1155BurnableUpgradeable

_Extension of {ERC1155} that allows token holders to destroy both their
own tokens and those that they have been approved to use.

_Available since v3.1.__

### __ERC1155Burnable_init

```solidity
function __ERC1155Burnable_init() internal
```

### __ERC1155Burnable_init_unchained

```solidity
function __ERC1155Burnable_init_unchained() internal
```

### burn

```solidity
function burn(address account, uint256 id, uint256 value) public virtual
```

### burnBatch

```solidity
function burnBatch(address account, uint256[] ids, uint256[] values) public virtual
```

### __gap

```solidity
uint256[50] __gap
```

## ERC1155PausableUpgradeable

_ERC1155 token with pausable token transfers, minting and burning.

Useful for scenarios such as preventing trades until the end of an evaluation
period, or having an emergency switch for freezing all token transfers in the
event of a large bug.

_Available since v3.1.__

### __ERC1155Pausable_init

```solidity
function __ERC1155Pausable_init() internal
```

### __ERC1155Pausable_init_unchained

```solidity
function __ERC1155Pausable_init_unchained() internal
```

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

_See {ERC1155-_beforeTokenTransfer}.

Requirements:

- the contract must not be paused._

### __gap

```solidity
uint256[50] __gap
```

## ERC1155SupplyUpgradeable

_Extension of ERC1155 that adds tracking of total supply per id.

Useful for scenarios where Fungible and Non-fungible tokens have to be
clearly identified. Note: While a totalSupply of 1 might mean the
corresponding is an NFT, there is no guarantees that no other token with the
same id are not going to be minted._

### __ERC1155Supply_init

```solidity
function __ERC1155Supply_init() internal
```

### __ERC1155Supply_init_unchained

```solidity
function __ERC1155Supply_init_unchained() internal
```

### _totalSupply

```solidity
mapping(uint256 &#x3D;&gt; uint256) _totalSupply
```

### totalSupply

```solidity
function totalSupply(uint256 id) public view virtual returns (uint256)
```

_Total amount of tokens in with a given id._

### exists

```solidity
function exists(uint256 id) public view virtual returns (bool)
```

_Indicates weither any token exist with a given id, or not._

### _mint

```solidity
function _mint(address account, uint256 id, uint256 amount, bytes data) internal virtual
```

_See {ERC1155-_mint}._

### _mintBatch

```solidity
function _mintBatch(address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

_See {ERC1155-_mintBatch}._

### _burn

```solidity
function _burn(address account, uint256 id, uint256 amount) internal virtual
```

_See {ERC1155-_burn}._

### _burnBatch

```solidity
function _burnBatch(address account, uint256[] ids, uint256[] amounts) internal virtual
```

_See {ERC1155-_burnBatch}._

### __gap

```solidity
uint256[49] __gap
```

## IERC1155MetadataURIUpgradeable

_Interface of the optional ERC1155MetadataExtension interface, as defined
in the https://eips.ethereum.org/EIPS/eip-1155#metadata-extensions[EIP].

_Available since v3.1.__

### uri

```solidity
function uri(uint256 id) external view returns (string)
```

_Returns the URI for token type &#x60;id&#x60;.

If the &#x60;\{id\}&#x60; substring is present in the URI, it must be replaced by
clients with the actual token type ID._

## ERC1155PresetMinterPauserUpgradeable

_{ERC1155} token, including:

 - ability for holders to burn (destroy) their tokens
 - a minter role that allows for token minting (creation)
 - a pauser role that allows to stop all token transfers

This contract uses {AccessControl} to lock permissioned functions using the
different roles - head to its documentation for details.

The account that deploys the contract will be granted the minter and pauser
roles, as well as the default admin role, which will let it grant both minter
and pauser roles to other accounts._

### initialize

```solidity
function initialize(string uri) public virtual
```

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### PAUSER_ROLE

```solidity
bytes32 PAUSER_ROLE
```

### __ERC1155PresetMinterPauser_init

```solidity
function __ERC1155PresetMinterPauser_init(string uri) internal
```

_Grants &#x60;DEFAULT_ADMIN_ROLE&#x60;, &#x60;MINTER_ROLE&#x60;, and &#x60;PAUSER_ROLE&#x60; to the account that
deploys the contract._

### __ERC1155PresetMinterPauser_init_unchained

```solidity
function __ERC1155PresetMinterPauser_init_unchained(string uri) internal
```

### mint

```solidity
function mint(address to, uint256 id, uint256 amount, bytes data) public virtual
```

_Creates &#x60;amount&#x60; new tokens for &#x60;to&#x60;, of token type &#x60;id&#x60;.

See {ERC1155-_mint}.

Requirements:

- the caller must have the &#x60;MINTER_ROLE&#x60;._

### mintBatch

```solidity
function mintBatch(address to, uint256[] ids, uint256[] amounts, bytes data) public virtual
```

_xref:ROOT:erc1155.adoc#batch-operations[Batched] variant of {mint}._

### pause

```solidity
function pause() public virtual
```

_Pauses all token transfers.

See {ERC1155Pausable} and {Pausable-_pause}.

Requirements:

- the caller must have the &#x60;PAUSER_ROLE&#x60;._

### unpause

```solidity
function unpause() public virtual
```

_Unpauses all token transfers.

See {ERC1155Pausable} and {Pausable-_unpause}.

Requirements:

- the caller must have the &#x60;PAUSER_ROLE&#x60;._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

### __gap

```solidity
uint256[50] __gap
```

## ERC1155HolderUpgradeable

__Available since v3.1.__

### __ERC1155Holder_init

```solidity
function __ERC1155Holder_init() internal
```

### __ERC1155Holder_init_unchained

```solidity
function __ERC1155Holder_init_unchained() internal
```

### onERC1155Received

```solidity
function onERC1155Received(address, address, uint256, uint256, bytes) public virtual returns (bytes4)
```

### onERC1155BatchReceived

```solidity
function onERC1155BatchReceived(address, address, uint256[], uint256[], bytes) public virtual returns (bytes4)
```

### __gap

```solidity
uint256[50] __gap
```

## ERC1155ReceiverUpgradeable

__Available since v3.1.__

### __ERC1155Receiver_init

```solidity
function __ERC1155Receiver_init() internal
```

### __ERC1155Receiver_init_unchained

```solidity
function __ERC1155Receiver_init_unchained() internal
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### __gap

```solidity
uint256[50] __gap
```

## ERC20Upgradeable

_Implementation of the {IERC20} interface.

This implementation is agnostic to the way tokens are created. This means
that a supply mechanism has to be added in a derived contract using {_mint}.
For a generic mechanism see {ERC20PresetMinterPauser}.

TIP: For a detailed writeup see our guide
https://forum.zeppelin.solutions/t/how-to-implement-erc20-supply-mechanisms/226[How
to implement supply mechanisms].

We have followed general OpenZeppelin Contracts guidelines: functions revert
instead returning &#x60;false&#x60; on failure. This behavior is nonetheless
conventional and does not conflict with the expectations of ERC20
applications.

Additionally, an {Approval} event is emitted on calls to {transferFrom}.
This allows applications to reconstruct the allowance for all accounts just
by listening to said events. Other implementations of the EIP may not emit
these events, as it isn&#x27;t required by the specification.

Finally, the non-standard {decreaseAllowance} and {increaseAllowance}
functions have been added to mitigate the well-known issues around setting
allowances. See {IERC20-approve}._

### _balances

```solidity
mapping(address &#x3D;&gt; uint256) _balances
```

### _allowances

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) _allowances
```

### _totalSupply

```solidity
uint256 _totalSupply
```

### _name

```solidity
string _name
```

### _symbol

```solidity
string _symbol
```

### __ERC20_init

```solidity
function __ERC20_init(string name_, string symbol_) internal
```

_Sets the values for {name} and {symbol}.

The default value of {decimals} is 18. To select a different value for
{decimals} you should overload it.

All two of these values are immutable: they can only be set once during
construction._

### __ERC20_init_unchained

```solidity
function __ERC20_init_unchained(string name_, string symbol_) internal
```

### name

```solidity
function name() public view virtual returns (string)
```

_Returns the name of the token._

### symbol

```solidity
function symbol() public view virtual returns (string)
```

_Returns the symbol of the token, usually a shorter version of the
name._

### decimals

```solidity
function decimals() public view virtual returns (uint8)
```

_Returns the number of decimals used to get its user representation.
For example, if &#x60;decimals&#x60; equals &#x60;2&#x60;, a balance of &#x60;505&#x60; tokens should
be displayed to a user as &#x60;5.05&#x60; (&#x60;505 / 10 ** 2&#x60;).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless this function is
overridden;

NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}._

### totalSupply

```solidity
function totalSupply() public view virtual returns (uint256)
```

_See {IERC20-totalSupply}._

### balanceOf

```solidity
function balanceOf(address account) public view virtual returns (uint256)
```

_See {IERC20-balanceOf}._

### transfer

```solidity
function transfer(address recipient, uint256 amount) public virtual returns (bool)
```

_See {IERC20-transfer}.

Requirements:

- &#x60;recipient&#x60; cannot be the zero address.
- the caller must have a balance of at least &#x60;amount&#x60;._

### allowance

```solidity
function allowance(address owner, address spender) public view virtual returns (uint256)
```

_See {IERC20-allowance}._

### approve

```solidity
function approve(address spender, uint256 amount) public virtual returns (bool)
```

_See {IERC20-approve}.

Requirements:

- &#x60;spender&#x60; cannot be the zero address._

### transferFrom

```solidity
function transferFrom(address sender, address recipient, uint256 amount) public virtual returns (bool)
```

_See {IERC20-transferFrom}.

Emits an {Approval} event indicating the updated allowance. This is not
required by the EIP. See the note at the beginning of {ERC20}.

Requirements:

- &#x60;sender&#x60; and &#x60;recipient&#x60; cannot be the zero address.
- &#x60;sender&#x60; must have a balance of at least &#x60;amount&#x60;.
- the caller must have allowance for &#x60;&#x60;sender&#x60;&#x60;&#x27;s tokens of at least
&#x60;amount&#x60;._

### increaseAllowance

```solidity
function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool)
```

_Atomically increases the allowance granted to &#x60;spender&#x60; by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- &#x60;spender&#x60; cannot be the zero address._

### decreaseAllowance

```solidity
function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool)
```

_Atomically decreases the allowance granted to &#x60;spender&#x60; by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- &#x60;spender&#x60; cannot be the zero address.
- &#x60;spender&#x60; must have allowance for the caller of at least
&#x60;subtractedValue&#x60;._

### _transfer

```solidity
function _transfer(address sender, address recipient, uint256 amount) internal virtual
```

_Moves &#x60;amount&#x60; of tokens from &#x60;sender&#x60; to &#x60;recipient&#x60;.

This internal function is equivalent to {transfer}, and can be used to
e.g. implement automatic token fees, slashing mechanisms, etc.

Emits a {Transfer} event.

Requirements:

- &#x60;sender&#x60; cannot be the zero address.
- &#x60;recipient&#x60; cannot be the zero address.
- &#x60;sender&#x60; must have a balance of at least &#x60;amount&#x60;._

### _mint

```solidity
function _mint(address account, uint256 amount) internal virtual
```

_Creates &#x60;amount&#x60; tokens and assigns them to &#x60;account&#x60;, increasing
the total supply.

Emits a {Transfer} event with &#x60;from&#x60; set to the zero address.

Requirements:

- &#x60;account&#x60; cannot be the zero address._

### _burn

```solidity
function _burn(address account, uint256 amount) internal virtual
```

_Destroys &#x60;amount&#x60; tokens from &#x60;account&#x60;, reducing the
total supply.

Emits a {Transfer} event with &#x60;to&#x60; set to the zero address.

Requirements:

- &#x60;account&#x60; cannot be the zero address.
- &#x60;account&#x60; must have at least &#x60;amount&#x60; tokens._

### _approve

```solidity
function _approve(address owner, address spender, uint256 amount) internal virtual
```

_Sets &#x60;amount&#x60; as the allowance of &#x60;spender&#x60; over the &#x60;owner&#x60; s tokens.

This internal function is equivalent to &#x60;approve&#x60;, and can be used to
e.g. set automatic allowances for certain subsystems, etc.

Emits an {Approval} event.

Requirements:

- &#x60;owner&#x60; cannot be the zero address.
- &#x60;spender&#x60; cannot be the zero address._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Hook that is called before any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when &#x60;from&#x60; and &#x60;to&#x60; are both non-zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens
will be transferred to &#x60;to&#x60;.
- when &#x60;from&#x60; is zero, &#x60;amount&#x60; tokens will be minted for &#x60;to&#x60;.
- when &#x60;to&#x60; is zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens will be burned.
- &#x60;from&#x60; and &#x60;to&#x60; are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### _afterTokenTransfer

```solidity
function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Hook that is called after any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when &#x60;from&#x60; and &#x60;to&#x60; are both non-zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens
has been transferred to &#x60;to&#x60;.
- when &#x60;from&#x60; is zero, &#x60;amount&#x60; tokens have been minted for &#x60;to&#x60;.
- when &#x60;to&#x60; is zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens have been burned.
- &#x60;from&#x60; and &#x60;to&#x60; are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### __gap

```solidity
uint256[45] __gap
```

## IERC20Upgradeable

_Interface of the ERC20 standard as defined in the EIP._

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

_Returns the amount of tokens in existence._

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```

_Returns the amount of tokens owned by &#x60;account&#x60;._

### transfer

```solidity
function transfer(address recipient, uint256 amount) external returns (bool)
```

_Moves &#x60;amount&#x60; tokens from the caller&#x27;s account to &#x60;recipient&#x60;.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```

_Returns the remaining number of tokens that &#x60;spender&#x60; will be
allowed to spend on behalf of &#x60;owner&#x60; through {transferFrom}. This is
zero by default.

This value changes when {approve} or {transferFrom} are called._

### approve

```solidity
function approve(address spender, uint256 amount) external returns (bool)
```

_Sets &#x60;amount&#x60; as the allowance of &#x60;spender&#x60; over the caller&#x27;s tokens.

Returns a boolean value indicating whether the operation succeeded.

IMPORTANT: Beware that changing an allowance with this method brings the risk
that someone may use both the old and the new allowance by unfortunate
transaction ordering. One possible solution to mitigate this race
condition is to first reduce the spender&#x27;s allowance to 0 and set the
desired value afterwards:
https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

Emits an {Approval} event._

### transferFrom

```solidity
function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)
```

_Moves &#x60;amount&#x60; tokens from &#x60;sender&#x60; to &#x60;recipient&#x60; using the
allowance mechanism. &#x60;amount&#x60; is then deducted from the caller&#x27;s
allowance.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### Transfer

```solidity
event Transfer(address from, address to, uint256 value)
```

_Emitted when &#x60;value&#x60; tokens are moved from one account (&#x60;from&#x60;) to
another (&#x60;to&#x60;).

Note that &#x60;value&#x60; may be zero._

### Approval

```solidity
event Approval(address owner, address spender, uint256 value)
```

_Emitted when the allowance of a &#x60;spender&#x60; for an &#x60;owner&#x60; is set by
a call to {approve}. &#x60;value&#x60; is the new allowance._

## ERC20BurnableUpgradeable

_Extension of {ERC20} that allows token holders to destroy both their own
tokens and those that they have an allowance for, in a way that can be
recognized off-chain (via event analysis)._

### __ERC20Burnable_init

```solidity
function __ERC20Burnable_init() internal
```

### __ERC20Burnable_init_unchained

```solidity
function __ERC20Burnable_init_unchained() internal
```

### burn

```solidity
function burn(uint256 amount) public virtual
```

_Destroys &#x60;amount&#x60; tokens from the caller.

See {ERC20-_burn}._

### burnFrom

```solidity
function burnFrom(address account, uint256 amount) public virtual
```

_Destroys &#x60;amount&#x60; tokens from &#x60;account&#x60;, deducting from the caller&#x27;s
allowance.

See {ERC20-_burn} and {ERC20-allowance}.

Requirements:

- the caller must have allowance for &#x60;&#x60;accounts&#x60;&#x60;&#x27;s tokens of at least
&#x60;amount&#x60;._

### __gap

```solidity
uint256[50] __gap
```

## ERC20CappedUpgradeable

_Extension of {ERC20} that adds a cap to the supply of tokens._

### _cap

```solidity
uint256 _cap
```

### __ERC20Capped_init

```solidity
function __ERC20Capped_init(uint256 cap_) internal
```

_Sets the value of the &#x60;cap&#x60;. This value is immutable, it can only be
set once during construction._

### __ERC20Capped_init_unchained

```solidity
function __ERC20Capped_init_unchained(uint256 cap_) internal
```

### cap

```solidity
function cap() public view virtual returns (uint256)
```

_Returns the cap on the token&#x27;s total supply._

### _mint

```solidity
function _mint(address account, uint256 amount) internal virtual
```

_See {ERC20-_mint}._

### __gap

```solidity
uint256[50] __gap
```

## ERC20FlashMintUpgradeable

_Implementation of the ERC3156 Flash loans extension, as defined in
https://eips.ethereum.org/EIPS/eip-3156[ERC-3156].

Adds the {flashLoan} method, which provides flash loan support at the token
level. By default there is no fee, but this can be changed by overriding {flashFee}.

_Available since v4.1.__

### __ERC20FlashMint_init

```solidity
function __ERC20FlashMint_init() internal
```

### __ERC20FlashMint_init_unchained

```solidity
function __ERC20FlashMint_init_unchained() internal
```

### _RETURN_VALUE

```solidity
bytes32 _RETURN_VALUE
```

### maxFlashLoan

```solidity
function maxFlashLoan(address token) public view returns (uint256)
```

_Returns the maximum amount of tokens available for loan._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The address of the token that is requested. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amont of token that can be loaned. |

### flashFee

```solidity
function flashFee(address token, uint256 amount) public view virtual returns (uint256)
```

_Returns the fee applied when doing flash loans. By default this
implementation has 0 fees. This function can be overloaded to make
the flash loan mechanism deflationary._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The token to be flash loaned. |
| amount | uint256 | The amount of tokens to be loaned. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The fees applied to the corresponding flash loan. |

### flashLoan

```solidity
function flashLoan(contract IERC3156FlashBorrowerUpgradeable receiver, address token, uint256 amount, bytes data) public virtual returns (bool)
```

_Performs a flash loan. New tokens are minted and sent to the
&#x60;receiver&#x60;, who is required to implement the {IERC3156FlashBorrower}
interface. By the end of the flash loan, the receiver is expected to own
amount + fee tokens and have them approved back to the token contract itself so
they can be burned._

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | contract IERC3156FlashBorrowerUpgradeable | The receiver of the flash loan. Should implement the {IERC3156FlashBorrower.onFlashLoan} interface. |
| token | address | The token to be flash loaned. Only &#x60;address(this)&#x60; is supported. |
| amount | uint256 | The amount of tokens to be loaned. |
| data | bytes | An arbitrary datafield that is passed to the receiver. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | &#x60;true&#x60; is the flash loan was successful. |

### __gap

```solidity
uint256[50] __gap
```

## ERC20PausableUpgradeable

_ERC20 token with pausable token transfers, minting and burning.

Useful for scenarios such as preventing trades until the end of an evaluation
period, or having an emergency switch for freezing all token transfers in the
event of a large bug._

### __ERC20Pausable_init

```solidity
function __ERC20Pausable_init() internal
```

### __ERC20Pausable_init_unchained

```solidity
function __ERC20Pausable_init_unchained() internal
```

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_See {ERC20-_beforeTokenTransfer}.

Requirements:

- the contract must not be paused._

### __gap

```solidity
uint256[50] __gap
```

## ERC20SnapshotUpgradeable

_This contract extends an ERC20 token with a snapshot mechanism. When a snapshot is created, the balances and
total supply at the time are recorded for later access.

This can be used to safely create mechanisms based on token balances such as trustless dividends or weighted voting.
In naive implementations it&#x27;s possible to perform a &quot;double spend&quot; attack by reusing the same balance from different
accounts. By using snapshots to calculate dividends or voting power, those attacks no longer apply. It can also be
used to create an efficient ERC20 forking mechanism.

Snapshots are created by the internal {_snapshot} function, which will emit the {Snapshot} event and return a
snapshot id. To get the total supply at the time of a snapshot, call the function {totalSupplyAt} with the snapshot
id. To get the balance of an account at the time of a snapshot, call the {balanceOfAt} function with the snapshot id
and the account address.

NOTE: Snapshot policy can be customized by overriding the {_getCurrentSnapshotId} method. For example, having it
return &#x60;block.number&#x60; will trigger the creation of snapshot at the begining of each new block. When overridding this
function, be careful about the monotonicity of its result. Non-monotonic snapshot ids will break the contract.

Implementing snapshots for every block using this method will incur significant gas costs. For a gas-efficient
alternative consider {ERC20Votes}.

&#x3D;&#x3D;&#x3D;&#x3D; Gas Costs

Snapshots are efficient. Snapshot creation is _O(1)_. Retrieval of balances or total supply from a snapshot is _O(log
n)_ in the number of snapshots that have been created, although _n_ for a specific account will generally be much
smaller since identical balances in subsequent snapshots are stored as a single entry.

There is a constant overhead for normal ERC20 transfers due to the additional snapshot bookkeeping. This overhead is
only significant for the first transfer that immediately follows a snapshot for a particular account. Subsequent
transfers will have normal cost until the next snapshot, and so on._

### __ERC20Snapshot_init

```solidity
function __ERC20Snapshot_init() internal
```

### __ERC20Snapshot_init_unchained

```solidity
function __ERC20Snapshot_init_unchained() internal
```

### Snapshots

```solidity
struct Snapshots {
  uint256[] ids;
  uint256[] values;
}
```

### _accountBalanceSnapshots

```solidity
mapping(address &#x3D;&gt; struct ERC20SnapshotUpgradeable.Snapshots) _accountBalanceSnapshots
```

### _totalSupplySnapshots

```solidity
struct ERC20SnapshotUpgradeable.Snapshots _totalSupplySnapshots
```

### _currentSnapshotId

```solidity
struct CountersUpgradeable.Counter _currentSnapshotId
```

### Snapshot

```solidity
event Snapshot(uint256 id)
```

_Emitted by {_snapshot} when a snapshot identified by &#x60;id&#x60; is created._

### _snapshot

```solidity
function _snapshot() internal virtual returns (uint256)
```

_Creates a new snapshot and returns its snapshot id.

Emits a {Snapshot} event that contains the same id.

{_snapshot} is &#x60;internal&#x60; and you have to decide how to expose it externally. Its usage may be restricted to a
set of accounts, for example using {AccessControl}, or it may be open to the public.

[WARNING]
&#x3D;&#x3D;&#x3D;&#x3D;
While an open way of calling {_snapshot} is required for certain trust minimization mechanisms such as forking,
you must consider that it can potentially be used by attackers in two ways.

First, it can be used to increase the cost of retrieval of values from snapshots, although it will grow
logarithmically thus rendering this attack ineffective in the long term. Second, it can be used to target
specific accounts and increase the cost of ERC20 transfers for them, in the ways specified in the Gas Costs
section above.

We haven&#x27;t measured the actual numbers; if this is something you&#x27;re interested in please reach out to us.
&#x3D;&#x3D;&#x3D;&#x3D;_

### _getCurrentSnapshotId

```solidity
function _getCurrentSnapshotId() internal view virtual returns (uint256)
```

_Get the current snapshotId_

### balanceOfAt

```solidity
function balanceOfAt(address account, uint256 snapshotId) public view virtual returns (uint256)
```

_Retrieves the balance of &#x60;account&#x60; at the time &#x60;snapshotId&#x60; was created._

### totalSupplyAt

```solidity
function totalSupplyAt(uint256 snapshotId) public view virtual returns (uint256)
```

_Retrieves the total supply at the time &#x60;snapshotId&#x60; was created._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Hook that is called before any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when &#x60;from&#x60; and &#x60;to&#x60; are both non-zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens
will be transferred to &#x60;to&#x60;.
- when &#x60;from&#x60; is zero, &#x60;amount&#x60; tokens will be minted for &#x60;to&#x60;.
- when &#x60;to&#x60; is zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens will be burned.
- &#x60;from&#x60; and &#x60;to&#x60; are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### _valueAt

```solidity
function _valueAt(uint256 snapshotId, struct ERC20SnapshotUpgradeable.Snapshots snapshots) private view returns (bool, uint256)
```

### _updateAccountSnapshot

```solidity
function _updateAccountSnapshot(address account) private
```

### _updateTotalSupplySnapshot

```solidity
function _updateTotalSupplySnapshot() private
```

### _updateSnapshot

```solidity
function _updateSnapshot(struct ERC20SnapshotUpgradeable.Snapshots snapshots, uint256 currentValue) private
```

### _lastSnapshotId

```solidity
function _lastSnapshotId(uint256[] ids) private view returns (uint256)
```

### __gap

```solidity
uint256[46] __gap
```

## ERC20VotesCompUpgradeable

_Extension of ERC20 to support Compound&#x27;s voting and delegation. This version exactly matches Compound&#x27;s
interface, with the drawback of only supporting supply up to (2^96^ - 1).

NOTE: You should use this contract if you need exact compatibility with COMP (for example in order to use your token
with Governor Alpha or Bravo) and if you are sure the supply cap of 2^96^ is enough for you. Otherwise, use the
{ERC20Votes} variant of this module.

This extension keeps a history (checkpoints) of each account&#x27;s vote power. Vote power can be delegated either
by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}. Voting
power can be queried through the public accessors {getCurrentVotes} and {getPriorVotes}.

By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it
requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked.
Enabling self-delegation can easily be done by overriding the {delegates} function. Keep in mind however that this
will significantly increase the base gas cost of transfers.

_Available since v4.2.__

### __ERC20VotesComp_init_unchained

```solidity
function __ERC20VotesComp_init_unchained() internal
```

### getCurrentVotes

```solidity
function getCurrentVotes(address account) external view returns (uint96)
```

_Comp version of the {getVotes} accessor, with &#x60;uint96&#x60; return type._

### getPriorVotes

```solidity
function getPriorVotes(address account, uint256 blockNumber) external view returns (uint96)
```

_Comp version of the {getPastVotes} accessor, with &#x60;uint96&#x60; return type._

### _maxSupply

```solidity
function _maxSupply() internal view virtual returns (uint224)
```

_Maximum token supply. Reduced to &#x60;type(uint96).max&#x60; (2^96^ - 1) to fit COMP interface._

### __gap

```solidity
uint256[50] __gap
```

## ERC20VotesUpgradeable

_Extension of ERC20 to support Compound-like voting and delegation. This version is more generic than Compound&#x27;s,
and supports token supply up to 2^224^ - 1, while COMP is limited to 2^96^ - 1.

NOTE: If exact COMP compatibility is required, use the {ERC20VotesComp} variant of this module.

This extension keeps a history (checkpoints) of each account&#x27;s vote power. Vote power can be delegated either
by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}. Voting
power can be queried through the public accessors {getVotes} and {getPastVotes}.

By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it
requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked.
Enabling self-delegation can easily be done by overriding the {delegates} function. Keep in mind however that this
will significantly increase the base gas cost of transfers.

_Available since v4.2.__

### __ERC20Votes_init_unchained

```solidity
function __ERC20Votes_init_unchained() internal
```

### Checkpoint

```solidity
struct Checkpoint {
  uint32 fromBlock;
  uint224 votes;
}
```

### _DELEGATION_TYPEHASH

```solidity
bytes32 _DELEGATION_TYPEHASH
```

### _delegates

```solidity
mapping(address &#x3D;&gt; address) _delegates
```

### _checkpoints

```solidity
mapping(address &#x3D;&gt; struct ERC20VotesUpgradeable.Checkpoint[]) _checkpoints
```

### _totalSupplyCheckpoints

```solidity
struct ERC20VotesUpgradeable.Checkpoint[] _totalSupplyCheckpoints
```

### DelegateChanged

```solidity
event DelegateChanged(address delegator, address fromDelegate, address toDelegate)
```

_Emitted when an account changes their delegate._

### DelegateVotesChanged

```solidity
event DelegateVotesChanged(address delegate, uint256 previousBalance, uint256 newBalance)
```

_Emitted when a token transfer or delegate change results in changes to an account&#x27;s voting power._

### checkpoints

```solidity
function checkpoints(address account, uint32 pos) public view virtual returns (struct ERC20VotesUpgradeable.Checkpoint)
```

_Get the &#x60;pos&#x60;-th checkpoint for &#x60;account&#x60;._

### numCheckpoints

```solidity
function numCheckpoints(address account) public view virtual returns (uint32)
```

_Get number of checkpoints for &#x60;account&#x60;._

### delegates

```solidity
function delegates(address account) public view virtual returns (address)
```

_Get the address &#x60;account&#x60; is currently delegating to._

### getVotes

```solidity
function getVotes(address account) public view returns (uint256)
```

_Gets the current votes balance for &#x60;account&#x60;_

### getPastVotes

```solidity
function getPastVotes(address account, uint256 blockNumber) public view returns (uint256)
```

_Retrieve the number of votes for &#x60;account&#x60; at the end of &#x60;blockNumber&#x60;.

Requirements:

- &#x60;blockNumber&#x60; must have been already mined_

### getPastTotalSupply

```solidity
function getPastTotalSupply(uint256 blockNumber) public view returns (uint256)
```

_Retrieve the &#x60;totalSupply&#x60; at the end of &#x60;blockNumber&#x60;. Note, this value is the sum of all balances.
It is but NOT the sum of all the delegated votes!

Requirements:

- &#x60;blockNumber&#x60; must have been already mined_

### _checkpointsLookup

```solidity
function _checkpointsLookup(struct ERC20VotesUpgradeable.Checkpoint[] ckpts, uint256 blockNumber) private view returns (uint256)
```

_Lookup a value in a list of (sorted) checkpoints._

### delegate

```solidity
function delegate(address delegatee) public virtual
```

_Delegate votes from the sender to &#x60;delegatee&#x60;._

### delegateBySig

```solidity
function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) public virtual
```

_Delegates votes from signer to &#x60;delegatee&#x60;_

### _maxSupply

```solidity
function _maxSupply() internal view virtual returns (uint224)
```

_Maximum token supply. Defaults to &#x60;type(uint224).max&#x60; (2^224^ - 1)._

### _mint

```solidity
function _mint(address account, uint256 amount) internal virtual
```

_Snapshots the totalSupply after it has been increased._

### _burn

```solidity
function _burn(address account, uint256 amount) internal virtual
```

_Snapshots the totalSupply after it has been decreased._

### _afterTokenTransfer

```solidity
function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Move voting power when tokens are transferred.

Emits a {DelegateVotesChanged} event._

### _delegate

```solidity
function _delegate(address delegator, address delegatee) internal virtual
```

_Change delegation for &#x60;delegator&#x60; to &#x60;delegatee&#x60;.

Emits events {DelegateChanged} and {DelegateVotesChanged}._

### _moveVotingPower

```solidity
function _moveVotingPower(address src, address dst, uint256 amount) private
```

### _writeCheckpoint

```solidity
function _writeCheckpoint(struct ERC20VotesUpgradeable.Checkpoint[] ckpts, function (uint256,uint256) view returns (uint256) op, uint256 delta) private returns (uint256 oldWeight, uint256 newWeight)
```

### _add

```solidity
function _add(uint256 a, uint256 b) private pure returns (uint256)
```

### _subtract

```solidity
function _subtract(uint256 a, uint256 b) private pure returns (uint256)
```

### __gap

```solidity
uint256[47] __gap
```

## ERC20WrapperUpgradeable

_Extension of the ERC20 token contract to support token wrapping.

Users can deposit and withdraw &quot;underlying tokens&quot; and receive a matching number of &quot;wrapped tokens&quot;. This is useful
in conjunction with other modules. For example, combining this wrapping mechanism with {ERC20Votes} will allow the
wrapping of an existing &quot;basic&quot; ERC20 into a governance token.

_Available since v4.2.__

### underlying

```solidity
contract IERC20Upgradeable underlying
```

### __ERC20Wrapper_init

```solidity
function __ERC20Wrapper_init(contract IERC20Upgradeable underlyingToken) internal
```

### __ERC20Wrapper_init_unchained

```solidity
function __ERC20Wrapper_init_unchained(contract IERC20Upgradeable underlyingToken) internal
```

### depositFor

```solidity
function depositFor(address account, uint256 amount) public virtual returns (bool)
```

_Allow a user to deposit underlying tokens and mint the corresponding number of wrapped tokens._

### withdrawTo

```solidity
function withdrawTo(address account, uint256 amount) public virtual returns (bool)
```

_Allow a user to burn a number of wrapped tokens and withdraw the corresponding number of underlying tokens._

### _recover

```solidity
function _recover(address account) internal virtual returns (uint256)
```

_Mint wrapped token to cover any underlyingTokens that would have been transfered by mistake. Internal
function that can be exposed with access control if desired._

### __gap

```solidity
uint256[50] __gap
```

## IERC20MetadataUpgradeable

_Interface for the optional metadata functions from the ERC20 standard.

_Available since v4.1.__

### name

```solidity
function name() external view returns (string)
```

_Returns the name of the token._

### symbol

```solidity
function symbol() external view returns (string)
```

_Returns the symbol of the token._

### decimals

```solidity
function decimals() external view returns (uint8)
```

_Returns the decimals places of the token._

## ERC20PermitUpgradeable

_Implementation of the ERC20 Permit extension allowing approvals to be made via signatures, as defined in
https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].

Adds the {permit} method, which can be used to change an account&#x27;s ERC20 allowance (see {IERC20-allowance}) by
presenting a message signed by the account. By not relying on &#x60;{IERC20-approve}&#x60;, the token holder account doesn&#x27;t
need to send a transaction, and thus is not required to hold Ether at all.

_Available since v3.4.__

### _nonces

```solidity
mapping(address &#x3D;&gt; struct CountersUpgradeable.Counter) _nonces
```

### _PERMIT_TYPEHASH

```solidity
bytes32 _PERMIT_TYPEHASH
```

### __ERC20Permit_init

```solidity
function __ERC20Permit_init(string name) internal
```

_Initializes the {EIP712} domain separator using the &#x60;name&#x60; parameter, and setting &#x60;version&#x60; to &#x60;&quot;1&quot;&#x60;.

It&#x27;s a good idea to use the same &#x60;name&#x60; that is defined as the ERC20 token name._

### __ERC20Permit_init_unchained

```solidity
function __ERC20Permit_init_unchained(string name) internal
```

### permit

```solidity
function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public virtual
```

_See {IERC20Permit-permit}._

### nonces

```solidity
function nonces(address owner) public view virtual returns (uint256)
```

_See {IERC20Permit-nonces}._

### DOMAIN_SEPARATOR

```solidity
function DOMAIN_SEPARATOR() external view returns (bytes32)
```

_See {IERC20Permit-DOMAIN_SEPARATOR}._

### _useNonce

```solidity
function _useNonce(address owner) internal virtual returns (uint256 current)
```

_&quot;Consume a nonce&quot;: return the current value and increment.

_Available since v4.1.__

### __gap

```solidity
uint256[49] __gap
```

## IERC20PermitUpgradeable

_Interface of the ERC20 Permit extension allowing approvals to be made via signatures, as defined in
https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].

Adds the {permit} method, which can be used to change an account&#x27;s ERC20 allowance (see {IERC20-allowance}) by
presenting a message signed by the account. By not relying on {IERC20-approve}, the token holder account doesn&#x27;t
need to send a transaction, and thus is not required to hold Ether at all._

### permit

```solidity
function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external
```

_Sets &#x60;value&#x60; as the allowance of &#x60;spender&#x60; over &#x60;&#x60;owner&#x60;&#x60;&#x27;s tokens,
given &#x60;&#x60;owner&#x60;&#x60;&#x27;s signed approval.

IMPORTANT: The same issues {IERC20-approve} has related to transaction
ordering also apply here.

Emits an {Approval} event.

Requirements:

- &#x60;spender&#x60; cannot be the zero address.
- &#x60;deadline&#x60; must be a timestamp in the future.
- &#x60;v&#x60;, &#x60;r&#x60; and &#x60;s&#x60; must be a valid &#x60;secp256k1&#x60; signature from &#x60;owner&#x60;
over the EIP712-formatted function arguments.
- the signature must use &#x60;&#x60;owner&#x60;&#x60;&#x27;s current nonce (see {nonces}).

For more information on the signature format, see the
https://eips.ethereum.org/EIPS/eip-2612#specification[relevant EIP
section]._

### nonces

```solidity
function nonces(address owner) external view returns (uint256)
```

_Returns the current nonce for &#x60;owner&#x60;. This value must be
included whenever a signature is generated for {permit}.

Every successful call to {permit} increases &#x60;&#x60;owner&#x60;&#x60;&#x27;s nonce by one. This
prevents a signature from being used multiple times._

### DOMAIN_SEPARATOR

```solidity
function DOMAIN_SEPARATOR() external view returns (bytes32)
```

_Returns the domain separator used in the encoding of the signature for {permit}, as defined by {EIP712}._

## ERC20PresetFixedSupplyUpgradeable

_{ERC20} token, including:

 - Preminted initial supply
 - Ability for holders to burn (destroy) their tokens
 - No access control mechanism (for minting/pausing) and hence no governance

This contract uses {ERC20Burnable} to include burn capabilities - head to
its documentation for details.

_Available since v3.4.__

### initialize

```solidity
function initialize(string name, string symbol, uint256 initialSupply, address owner) public virtual
```

### __ERC20PresetFixedSupply_init

```solidity
function __ERC20PresetFixedSupply_init(string name, string symbol, uint256 initialSupply, address owner) internal
```

_Mints &#x60;initialSupply&#x60; amount of token and transfers them to &#x60;owner&#x60;.

See {ERC20-constructor}._

### __ERC20PresetFixedSupply_init_unchained

```solidity
function __ERC20PresetFixedSupply_init_unchained(string name, string symbol, uint256 initialSupply, address owner) internal
```

### __gap

```solidity
uint256[50] __gap
```

## ERC20PresetMinterPauserUpgradeable

_{ERC20} token, including:

 - ability for holders to burn (destroy) their tokens
 - a minter role that allows for token minting (creation)
 - a pauser role that allows to stop all token transfers

This contract uses {AccessControl} to lock permissioned functions using the
different roles - head to its documentation for details.

The account that deploys the contract will be granted the minter and pauser
roles, as well as the default admin role, which will let it grant both minter
and pauser roles to other accounts._

### initialize

```solidity
function initialize(string name, string symbol) public virtual
```

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### PAUSER_ROLE

```solidity
bytes32 PAUSER_ROLE
```

### __ERC20PresetMinterPauser_init

```solidity
function __ERC20PresetMinterPauser_init(string name, string symbol) internal
```

_Grants &#x60;DEFAULT_ADMIN_ROLE&#x60;, &#x60;MINTER_ROLE&#x60; and &#x60;PAUSER_ROLE&#x60; to the
account that deploys the contract.

See {ERC20-constructor}._

### __ERC20PresetMinterPauser_init_unchained

```solidity
function __ERC20PresetMinterPauser_init_unchained(string name, string symbol) internal
```

### mint

```solidity
function mint(address to, uint256 amount) public virtual
```

_Creates &#x60;amount&#x60; new tokens for &#x60;to&#x60;.

See {ERC20-_mint}.

Requirements:

- the caller must have the &#x60;MINTER_ROLE&#x60;._

### pause

```solidity
function pause() public virtual
```

_Pauses all token transfers.

See {ERC20Pausable} and {Pausable-_pause}.

Requirements:

- the caller must have the &#x60;PAUSER_ROLE&#x60;._

### unpause

```solidity
function unpause() public virtual
```

_Unpauses all token transfers.

See {ERC20Pausable} and {Pausable-_unpause}.

Requirements:

- the caller must have the &#x60;PAUSER_ROLE&#x60;._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual
```

### __gap

```solidity
uint256[50] __gap
```

## SafeERC20Upgradeable

_Wrappers around ERC20 operations that throw on failure (when the token
contract returns false). Tokens that return no value (and instead revert or
throw on failure) are also supported, non-reverting calls are assumed to be
successful.
To use this library you can add a &#x60;using SafeERC20 for IERC20;&#x60; statement to your contract,
which allows you to call the safe operations as &#x60;token.safeTransfer(...)&#x60;, etc._

### safeTransfer

```solidity
function safeTransfer(contract IERC20Upgradeable token, address to, uint256 value) internal
```

### safeTransferFrom

```solidity
function safeTransferFrom(contract IERC20Upgradeable token, address from, address to, uint256 value) internal
```

### safeApprove

```solidity
function safeApprove(contract IERC20Upgradeable token, address spender, uint256 value) internal
```

_Deprecated. This function has issues similar to the ones found in
{IERC20-approve}, and its usage is discouraged.

Whenever possible, use {safeIncreaseAllowance} and
{safeDecreaseAllowance} instead._

### safeIncreaseAllowance

```solidity
function safeIncreaseAllowance(contract IERC20Upgradeable token, address spender, uint256 value) internal
```

### safeDecreaseAllowance

```solidity
function safeDecreaseAllowance(contract IERC20Upgradeable token, address spender, uint256 value) internal
```

### _callOptionalReturn

```solidity
function _callOptionalReturn(contract IERC20Upgradeable token, bytes data) private
```

_Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
on the return value: the return value is optional (but if data is returned, it must not be false)._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | contract IERC20Upgradeable | The token targeted by the call. |
| data | bytes | The call data (encoded using abi.encode or one of its variants). |

## TokenTimelockUpgradeable

_A token holder contract that will allow a beneficiary to extract the
tokens after a given release time.

Useful for simple vesting schedules like &quot;advisors get all of their tokens
after 1 year&quot;._

### _token

```solidity
contract IERC20Upgradeable _token
```

### _beneficiary

```solidity
address _beneficiary
```

### _releaseTime

```solidity
uint256 _releaseTime
```

### __TokenTimelock_init

```solidity
function __TokenTimelock_init(contract IERC20Upgradeable token_, address beneficiary_, uint256 releaseTime_) internal
```

### __TokenTimelock_init_unchained

```solidity
function __TokenTimelock_init_unchained(contract IERC20Upgradeable token_, address beneficiary_, uint256 releaseTime_) internal
```

### token

```solidity
function token() public view virtual returns (contract IERC20Upgradeable)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IERC20Upgradeable | the token being held. |

### beneficiary

```solidity
function beneficiary() public view virtual returns (address)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | the beneficiary of the tokens. |

### releaseTime

```solidity
function releaseTime() public view virtual returns (uint256)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the time when the tokens are released. |

### release

```solidity
function release() public virtual
```

Transfers tokens held by timelock to beneficiary.

### __gap

```solidity
uint256[50] __gap
```

## ERC721Upgradeable

_Implementation of https://eips.ethereum.org/EIPS/eip-721[ERC721] Non-Fungible Token Standard, including
the Metadata extension, but not including the Enumerable extension, which is available separately as
{ERC721Enumerable}._

### _name

```solidity
string _name
```

### _symbol

```solidity
string _symbol
```

### _owners

```solidity
mapping(uint256 &#x3D;&gt; address) _owners
```

### _balances

```solidity
mapping(address &#x3D;&gt; uint256) _balances
```

### _tokenApprovals

```solidity
mapping(uint256 &#x3D;&gt; address) _tokenApprovals
```

### _operatorApprovals

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; bool)) _operatorApprovals
```

### __ERC721_init

```solidity
function __ERC721_init(string name_, string symbol_) internal
```

_Initializes the contract by setting a &#x60;name&#x60; and a &#x60;symbol&#x60; to the token collection._

### __ERC721_init_unchained

```solidity
function __ERC721_init_unchained(string name_, string symbol_) internal
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### balanceOf

```solidity
function balanceOf(address owner) public view virtual returns (uint256)
```

_See {IERC721-balanceOf}._

### ownerOf

```solidity
function ownerOf(uint256 tokenId) public view virtual returns (address)
```

_See {IERC721-ownerOf}._

### name

```solidity
function name() public view virtual returns (string)
```

_See {IERC721Metadata-name}._

### symbol

```solidity
function symbol() public view virtual returns (string)
```

_See {IERC721Metadata-symbol}._

### tokenURI

```solidity
function tokenURI(uint256 tokenId) public view virtual returns (string)
```

_See {IERC721Metadata-tokenURI}._

### _baseURI

```solidity
function _baseURI() internal view virtual returns (string)
```

_Base URI for computing {tokenURI}. If set, the resulting URI for each
token will be the concatenation of the &#x60;baseURI&#x60; and the &#x60;tokenId&#x60;. Empty
by default, can be overriden in child contracts._

### approve

```solidity
function approve(address to, uint256 tokenId) public virtual
```

_See {IERC721-approve}._

### getApproved

```solidity
function getApproved(uint256 tokenId) public view virtual returns (address)
```

_See {IERC721-getApproved}._

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) public virtual
```

_See {IERC721-setApprovalForAll}._

### isApprovedForAll

```solidity
function isApprovedForAll(address owner, address operator) public view virtual returns (bool)
```

_See {IERC721-isApprovedForAll}._

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 tokenId) public virtual
```

_See {IERC721-transferFrom}._

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId) public virtual
```

_See {IERC721-safeTransferFrom}._

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data) public virtual
```

_See {IERC721-safeTransferFrom}._

### _safeTransfer

```solidity
function _safeTransfer(address from, address to, uint256 tokenId, bytes _data) internal virtual
```

_Safely transfers &#x60;tokenId&#x60; token from &#x60;from&#x60; to &#x60;to&#x60;, checking first that contract recipients
are aware of the ERC721 protocol to prevent tokens from being forever locked.

&#x60;_data&#x60; is additional data, it has no specified format and it is sent in call to &#x60;to&#x60;.

This internal function is equivalent to {safeTransferFrom}, and can be used to e.g.
implement alternative mechanisms to perform token transfer, such as signature-based.

Requirements:

- &#x60;from&#x60; cannot be the zero address.
- &#x60;to&#x60; cannot be the zero address.
- &#x60;tokenId&#x60; token must exist and be owned by &#x60;from&#x60;.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.

Emits a {Transfer} event._

### _exists

```solidity
function _exists(uint256 tokenId) internal view virtual returns (bool)
```

_Returns whether &#x60;tokenId&#x60; exists.

Tokens can be managed by their owner or approved accounts via {approve} or {setApprovalForAll}.

Tokens start existing when they are minted (&#x60;_mint&#x60;),
and stop existing when they are burned (&#x60;_burn&#x60;)._

### _isApprovedOrOwner

```solidity
function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool)
```

_Returns whether &#x60;spender&#x60; is allowed to manage &#x60;tokenId&#x60;.

Requirements:

- &#x60;tokenId&#x60; must exist._

### _safeMint

```solidity
function _safeMint(address to, uint256 tokenId) internal virtual
```

_Safely mints &#x60;tokenId&#x60; and transfers it to &#x60;to&#x60;.

Requirements:

- &#x60;tokenId&#x60; must not exist.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.

Emits a {Transfer} event._

### _safeMint

```solidity
function _safeMint(address to, uint256 tokenId, bytes _data) internal virtual
```

_Same as {xref-ERC721-_safeMint-address-uint256-}[&#x60;_safeMint&#x60;], with an additional &#x60;data&#x60; parameter which is
forwarded in {IERC721Receiver-onERC721Received} to contract recipients._

### _mint

```solidity
function _mint(address to, uint256 tokenId) internal virtual
```

_Mints &#x60;tokenId&#x60; and transfers it to &#x60;to&#x60;.

WARNING: Usage of this method is discouraged, use {_safeMint} whenever possible

Requirements:

- &#x60;tokenId&#x60; must not exist.
- &#x60;to&#x60; cannot be the zero address.

Emits a {Transfer} event._

### _burn

```solidity
function _burn(uint256 tokenId) internal virtual
```

_Destroys &#x60;tokenId&#x60;.
The approval is cleared when the token is burned.

Requirements:

- &#x60;tokenId&#x60; must exist.

Emits a {Transfer} event._

### _transfer

```solidity
function _transfer(address from, address to, uint256 tokenId) internal virtual
```

_Transfers &#x60;tokenId&#x60; from &#x60;from&#x60; to &#x60;to&#x60;.
 As opposed to {transferFrom}, this imposes no restrictions on msg.sender.

Requirements:

- &#x60;to&#x60; cannot be the zero address.
- &#x60;tokenId&#x60; token must be owned by &#x60;from&#x60;.

Emits a {Transfer} event._

### _approve

```solidity
function _approve(address to, uint256 tokenId) internal virtual
```

_Approve &#x60;to&#x60; to operate on &#x60;tokenId&#x60;

Emits a {Approval} event._

### _checkOnERC721Received

```solidity
function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes _data) private returns (bool)
```

_Internal function to invoke {IERC721Receiver-onERC721Received} on a target address.
The call is not executed if the target address is not a contract._

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | address representing the previous owner of the given token ID |
| to | address | target address that will receive the tokens |
| tokenId | uint256 | uint256 ID of the token to be transferred |
| _data | bytes | bytes optional data to send along with the call |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool whether the call correctly returned the expected magic value |

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual
```

_Hook that is called before any token transfer. This includes minting
and burning.

Calling conditions:

- When &#x60;from&#x60; and &#x60;to&#x60; are both non-zero, &#x60;&#x60;from&#x60;&#x60;&#x27;s &#x60;tokenId&#x60; will be
transferred to &#x60;to&#x60;.
- When &#x60;from&#x60; is zero, &#x60;tokenId&#x60; will be minted for &#x60;to&#x60;.
- When &#x60;to&#x60; is zero, &#x60;&#x60;from&#x60;&#x60;&#x27;s &#x60;tokenId&#x60; will be burned.
- &#x60;from&#x60; and &#x60;to&#x60; are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### __gap

```solidity
uint256[44] __gap
```

## IERC721ReceiverUpgradeable

_Interface for any contract that wants to support safeTransfers
from ERC721 asset contracts._

### onERC721Received

```solidity
function onERC721Received(address operator, address from, uint256 tokenId, bytes data) external returns (bytes4)
```

_Whenever an {IERC721} &#x60;tokenId&#x60; token is transferred to this contract via {IERC721-safeTransferFrom}
by &#x60;operator&#x60; from &#x60;from&#x60;, this function is called.

It must return its Solidity selector to confirm the token transfer.
If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.

The selector can be obtained in Solidity with &#x60;IERC721.onERC721Received.selector&#x60;._

## IERC721Upgradeable

_Required interface of an ERC721 compliant contract._

### Transfer

```solidity
event Transfer(address from, address to, uint256 tokenId)
```

_Emitted when &#x60;tokenId&#x60; token is transferred from &#x60;from&#x60; to &#x60;to&#x60;._

### Approval

```solidity
event Approval(address owner, address approved, uint256 tokenId)
```

_Emitted when &#x60;owner&#x60; enables &#x60;approved&#x60; to manage the &#x60;tokenId&#x60; token._

### ApprovalForAll

```solidity
event ApprovalForAll(address owner, address operator, bool approved)
```

_Emitted when &#x60;owner&#x60; enables or disables (&#x60;approved&#x60;) &#x60;operator&#x60; to manage all of its assets._

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256 balance)
```

_Returns the number of tokens in &#x60;&#x60;owner&#x60;&#x60;&#x27;s account._

### ownerOf

```solidity
function ownerOf(uint256 tokenId) external view returns (address owner)
```

_Returns the owner of the &#x60;tokenId&#x60; token.

Requirements:

- &#x60;tokenId&#x60; must exist._

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId) external
```

_Safely transfers &#x60;tokenId&#x60; token from &#x60;from&#x60; to &#x60;to&#x60;, checking first that contract recipients
are aware of the ERC721 protocol to prevent tokens from being forever locked.

Requirements:

- &#x60;from&#x60; cannot be the zero address.
- &#x60;to&#x60; cannot be the zero address.
- &#x60;tokenId&#x60; token must exist and be owned by &#x60;from&#x60;.
- If the caller is not &#x60;from&#x60;, it must be have been allowed to move this token by either {approve} or {setApprovalForAll}.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.

Emits a {Transfer} event._

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 tokenId) external
```

_Transfers &#x60;tokenId&#x60; token from &#x60;from&#x60; to &#x60;to&#x60;.

WARNING: Usage of this method is discouraged, use {safeTransferFrom} whenever possible.

Requirements:

- &#x60;from&#x60; cannot be the zero address.
- &#x60;to&#x60; cannot be the zero address.
- &#x60;tokenId&#x60; token must be owned by &#x60;from&#x60;.
- If the caller is not &#x60;from&#x60;, it must be approved to move this token by either {approve} or {setApprovalForAll}.

Emits a {Transfer} event._

### approve

```solidity
function approve(address to, uint256 tokenId) external
```

_Gives permission to &#x60;to&#x60; to transfer &#x60;tokenId&#x60; token to another account.
The approval is cleared when the token is transferred.

Only a single account can be approved at a time, so approving the zero address clears previous approvals.

Requirements:

- The caller must own the token or be an approved operator.
- &#x60;tokenId&#x60; must exist.

Emits an {Approval} event._

### getApproved

```solidity
function getApproved(uint256 tokenId) external view returns (address operator)
```

_Returns the account approved for &#x60;tokenId&#x60; token.

Requirements:

- &#x60;tokenId&#x60; must exist._

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool _approved) external
```

_Approve or remove &#x60;operator&#x60; as an operator for the caller.
Operators can call {transferFrom} or {safeTransferFrom} for any token owned by the caller.

Requirements:

- The &#x60;operator&#x60; cannot be the caller.

Emits an {ApprovalForAll} event._

### isApprovedForAll

```solidity
function isApprovedForAll(address owner, address operator) external view returns (bool)
```

_Returns if the &#x60;operator&#x60; is allowed to manage all of the assets of &#x60;owner&#x60;.

See {setApprovalForAll}_

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) external
```

_Safely transfers &#x60;tokenId&#x60; token from &#x60;from&#x60; to &#x60;to&#x60;.

Requirements:

- &#x60;from&#x60; cannot be the zero address.
- &#x60;to&#x60; cannot be the zero address.
- &#x60;tokenId&#x60; token must exist and be owned by &#x60;from&#x60;.
- If the caller is not &#x60;from&#x60;, it must be approved to move this token by either {approve} or {setApprovalForAll}.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.

Emits a {Transfer} event._

## ERC721BurnableUpgradeable

_ERC721 Token that can be irreversibly burned (destroyed)._

### __ERC721Burnable_init

```solidity
function __ERC721Burnable_init() internal
```

### __ERC721Burnable_init_unchained

```solidity
function __ERC721Burnable_init_unchained() internal
```

### burn

```solidity
function burn(uint256 tokenId) public virtual
```

_Burns &#x60;tokenId&#x60;. See {ERC721-_burn}.

Requirements:

- The caller must own &#x60;tokenId&#x60; or be an approved operator._

### __gap

```solidity
uint256[50] __gap
```

## ERC721EnumerableUpgradeable

_This implements an optional extension of {ERC721} defined in the EIP that adds
enumerability of all the token ids in the contract as well as all token ids owned by each
account._

### __ERC721Enumerable_init

```solidity
function __ERC721Enumerable_init() internal
```

### __ERC721Enumerable_init_unchained

```solidity
function __ERC721Enumerable_init_unchained() internal
```

### _ownedTokens

```solidity
mapping(address &#x3D;&gt; mapping(uint256 &#x3D;&gt; uint256)) _ownedTokens
```

### _ownedTokensIndex

```solidity
mapping(uint256 &#x3D;&gt; uint256) _ownedTokensIndex
```

### _allTokens

```solidity
uint256[] _allTokens
```

### _allTokensIndex

```solidity
mapping(uint256 &#x3D;&gt; uint256) _allTokensIndex
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### tokenOfOwnerByIndex

```solidity
function tokenOfOwnerByIndex(address owner, uint256 index) public view virtual returns (uint256)
```

_See {IERC721Enumerable-tokenOfOwnerByIndex}._

### totalSupply

```solidity
function totalSupply() public view virtual returns (uint256)
```

_See {IERC721Enumerable-totalSupply}._

### tokenByIndex

```solidity
function tokenByIndex(uint256 index) public view virtual returns (uint256)
```

_See {IERC721Enumerable-tokenByIndex}._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual
```

_Hook that is called before any token transfer. This includes minting
and burning.

Calling conditions:

- When &#x60;from&#x60; and &#x60;to&#x60; are both non-zero, &#x60;&#x60;from&#x60;&#x60;&#x27;s &#x60;tokenId&#x60; will be
transferred to &#x60;to&#x60;.
- When &#x60;from&#x60; is zero, &#x60;tokenId&#x60; will be minted for &#x60;to&#x60;.
- When &#x60;to&#x60; is zero, &#x60;&#x60;from&#x60;&#x60;&#x27;s &#x60;tokenId&#x60; will be burned.
- &#x60;from&#x60; cannot be the zero address.
- &#x60;to&#x60; cannot be the zero address.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### _addTokenToOwnerEnumeration

```solidity
function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private
```

_Private function to add a token to this extension&#x27;s ownership-tracking data structures._

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address representing the new owner of the given token ID |
| tokenId | uint256 | uint256 ID of the token to be added to the tokens list of the given address |

### _addTokenToAllTokensEnumeration

```solidity
function _addTokenToAllTokensEnumeration(uint256 tokenId) private
```

_Private function to add a token to this extension&#x27;s token tracking data structures._

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | uint256 ID of the token to be added to the tokens list |

### _removeTokenFromOwnerEnumeration

```solidity
function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private
```

_Private function to remove a token from this extension&#x27;s ownership-tracking data structures. Note that
while the token is not assigned a new owner, the &#x60;_ownedTokensIndex&#x60; mapping is _not_ updated: this allows for
gas optimizations e.g. when performing a transfer operation (avoiding double writes).
This has O(1) time complexity, but alters the order of the _ownedTokens array._

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | address representing the previous owner of the given token ID |
| tokenId | uint256 | uint256 ID of the token to be removed from the tokens list of the given address |

### _removeTokenFromAllTokensEnumeration

```solidity
function _removeTokenFromAllTokensEnumeration(uint256 tokenId) private
```

_Private function to remove a token from this extension&#x27;s token tracking data structures.
This has O(1) time complexity, but alters the order of the _allTokens array._

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | uint256 ID of the token to be removed from the tokens list |

### __gap

```solidity
uint256[46] __gap
```

## ERC721PausableUpgradeable

_ERC721 token with pausable token transfers, minting and burning.

Useful for scenarios such as preventing trades until the end of an evaluation
period, or having an emergency switch for freezing all token transfers in the
event of a large bug._

### __ERC721Pausable_init

```solidity
function __ERC721Pausable_init() internal
```

### __ERC721Pausable_init_unchained

```solidity
function __ERC721Pausable_init_unchained() internal
```

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual
```

_See {ERC721-_beforeTokenTransfer}.

Requirements:

- the contract must not be paused._

### __gap

```solidity
uint256[50] __gap
```

## ERC721URIStorageUpgradeable

_ERC721 token with storage based token URI management._

### __ERC721URIStorage_init

```solidity
function __ERC721URIStorage_init() internal
```

### __ERC721URIStorage_init_unchained

```solidity
function __ERC721URIStorage_init_unchained() internal
```

### _tokenURIs

```solidity
mapping(uint256 &#x3D;&gt; string) _tokenURIs
```

### tokenURI

```solidity
function tokenURI(uint256 tokenId) public view virtual returns (string)
```

_See {IERC721Metadata-tokenURI}._

### _setTokenURI

```solidity
function _setTokenURI(uint256 tokenId, string _tokenURI) internal virtual
```

_Sets &#x60;_tokenURI&#x60; as the tokenURI of &#x60;tokenId&#x60;.

Requirements:

- &#x60;tokenId&#x60; must exist._

### _burn

```solidity
function _burn(uint256 tokenId) internal virtual
```

_Destroys &#x60;tokenId&#x60;.
The approval is cleared when the token is burned.

Requirements:

- &#x60;tokenId&#x60; must exist.

Emits a {Transfer} event._

### __gap

```solidity
uint256[49] __gap
```

## IERC721EnumerableUpgradeable

_See https://eips.ethereum.org/EIPS/eip-721_

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

_Returns the total amount of tokens stored by the contract._

### tokenOfOwnerByIndex

```solidity
function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)
```

_Returns a token ID owned by &#x60;owner&#x60; at a given &#x60;index&#x60; of its token list.
Use along with {balanceOf} to enumerate all of &#x60;&#x60;owner&#x60;&#x60;&#x27;s tokens._

### tokenByIndex

```solidity
function tokenByIndex(uint256 index) external view returns (uint256)
```

_Returns a token ID at a given &#x60;index&#x60; of all the tokens stored by the contract.
Use along with {totalSupply} to enumerate all tokens._

## IERC721MetadataUpgradeable

_See https://eips.ethereum.org/EIPS/eip-721_

### name

```solidity
function name() external view returns (string)
```

_Returns the token collection name._

### symbol

```solidity
function symbol() external view returns (string)
```

_Returns the token collection symbol._

### tokenURI

```solidity
function tokenURI(uint256 tokenId) external view returns (string)
```

_Returns the Uniform Resource Identifier (URI) for &#x60;tokenId&#x60; token._

## ERC721PresetMinterPauserAutoIdUpgradeable

_{ERC721} token, including:

 - ability for holders to burn (destroy) their tokens
 - a minter role that allows for token minting (creation)
 - a pauser role that allows to stop all token transfers
 - token ID and URI autogeneration

This contract uses {AccessControl} to lock permissioned functions using the
different roles - head to its documentation for details.

The account that deploys the contract will be granted the minter and pauser
roles, as well as the default admin role, which will let it grant both minter
and pauser roles to other accounts._

### initialize

```solidity
function initialize(string name, string symbol, string baseTokenURI) public virtual
```

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### PAUSER_ROLE

```solidity
bytes32 PAUSER_ROLE
```

### _tokenIdTracker

```solidity
struct CountersUpgradeable.Counter _tokenIdTracker
```

### _baseTokenURI

```solidity
string _baseTokenURI
```

### __ERC721PresetMinterPauserAutoId_init

```solidity
function __ERC721PresetMinterPauserAutoId_init(string name, string symbol, string baseTokenURI) internal
```

_Grants &#x60;DEFAULT_ADMIN_ROLE&#x60;, &#x60;MINTER_ROLE&#x60; and &#x60;PAUSER_ROLE&#x60; to the
account that deploys the contract.

Token URIs will be autogenerated based on &#x60;baseURI&#x60; and their token IDs.
See {ERC721-tokenURI}._

### __ERC721PresetMinterPauserAutoId_init_unchained

```solidity
function __ERC721PresetMinterPauserAutoId_init_unchained(string name, string symbol, string baseTokenURI) internal
```

### _baseURI

```solidity
function _baseURI() internal view virtual returns (string)
```

_Base URI for computing {tokenURI}. If set, the resulting URI for each
token will be the concatenation of the &#x60;baseURI&#x60; and the &#x60;tokenId&#x60;. Empty
by default, can be overriden in child contracts._

### mint

```solidity
function mint(address to) public virtual
```

_Creates a new token for &#x60;to&#x60;. Its token ID will be automatically
assigned (and available on the emitted {IERC721-Transfer} event), and the token
URI autogenerated based on the base URI passed at construction.

See {ERC721-_mint}.

Requirements:

- the caller must have the &#x60;MINTER_ROLE&#x60;._

### pause

```solidity
function pause() public virtual
```

_Pauses all token transfers.

See {ERC721Pausable} and {Pausable-_pause}.

Requirements:

- the caller must have the &#x60;PAUSER_ROLE&#x60;._

### unpause

```solidity
function unpause() public virtual
```

_Unpauses all token transfers.

See {ERC721Pausable} and {Pausable-_unpause}.

Requirements:

- the caller must have the &#x60;PAUSER_ROLE&#x60;._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### __gap

```solidity
uint256[48] __gap
```

## ERC721HolderUpgradeable

_Implementation of the {IERC721Receiver} interface.

Accepts all token transfers.
Make sure the contract is able to use its token with {IERC721-safeTransferFrom}, {IERC721-approve} or {IERC721-setApprovalForAll}._

### __ERC721Holder_init

```solidity
function __ERC721Holder_init() internal
```

### __ERC721Holder_init_unchained

```solidity
function __ERC721Holder_init_unchained() internal
```

### onERC721Received

```solidity
function onERC721Received(address, address, uint256, bytes) public virtual returns (bytes4)
```

_See {IERC721Receiver-onERC721Received}.

Always returns &#x60;IERC721Receiver.onERC721Received.selector&#x60;._

### __gap

```solidity
uint256[50] __gap
```

## ERC777Upgradeable

_Implementation of the {IERC777} interface.

This implementation is agnostic to the way tokens are created. This means
that a supply mechanism has to be added in a derived contract using {_mint}.

Support for ERC20 is included in this contract, as specified by the EIP: both
the ERC777 and ERC20 interfaces can be safely used when interacting with it.
Both {IERC777-Sent} and {IERC20-Transfer} events are emitted on token
movements.

Additionally, the {IERC777-granularity} value is hard-coded to &#x60;1&#x60;, meaning that there
are no special restrictions in the amount of tokens that created, moved, or
destroyed. This makes integration with ERC20 applications seamless._

### _ERC1820_REGISTRY

```solidity
contract IERC1820RegistryUpgradeable _ERC1820_REGISTRY
```

### _balances

```solidity
mapping(address &#x3D;&gt; uint256) _balances
```

### _totalSupply

```solidity
uint256 _totalSupply
```

### _name

```solidity
string _name
```

### _symbol

```solidity
string _symbol
```

### _TOKENS_SENDER_INTERFACE_HASH

```solidity
bytes32 _TOKENS_SENDER_INTERFACE_HASH
```

### _TOKENS_RECIPIENT_INTERFACE_HASH

```solidity
bytes32 _TOKENS_RECIPIENT_INTERFACE_HASH
```

### _defaultOperatorsArray

```solidity
address[] _defaultOperatorsArray
```

### _defaultOperators

```solidity
mapping(address &#x3D;&gt; bool) _defaultOperators
```

### _operators

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; bool)) _operators
```

### _revokedDefaultOperators

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; bool)) _revokedDefaultOperators
```

### _allowances

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) _allowances
```

### __ERC777_init

```solidity
function __ERC777_init(string name_, string symbol_, address[] defaultOperators_) internal
```

_&#x60;defaultOperators&#x60; may be an empty array._

### __ERC777_init_unchained

```solidity
function __ERC777_init_unchained(string name_, string symbol_, address[] defaultOperators_) internal
```

### name

```solidity
function name() public view virtual returns (string)
```

_See {IERC777-name}._

### symbol

```solidity
function symbol() public view virtual returns (string)
```

_See {IERC777-symbol}._

### decimals

```solidity
function decimals() public pure virtual returns (uint8)
```

_See {ERC20-decimals}.

Always returns 18, as per the
[ERC777 EIP](https://eips.ethereum.org/EIPS/eip-777#backward-compatibility)._

### granularity

```solidity
function granularity() public view virtual returns (uint256)
```

_See {IERC777-granularity}.

This implementation always returns &#x60;1&#x60;._

### totalSupply

```solidity
function totalSupply() public view virtual returns (uint256)
```

_See {IERC777-totalSupply}._

### balanceOf

```solidity
function balanceOf(address tokenHolder) public view virtual returns (uint256)
```

_Returns the amount of tokens owned by an account (&#x60;tokenHolder&#x60;)._

### send

```solidity
function send(address recipient, uint256 amount, bytes data) public virtual
```

_See {IERC777-send}.

Also emits a {IERC20-Transfer} event for ERC20 compatibility._

### transfer

```solidity
function transfer(address recipient, uint256 amount) public virtual returns (bool)
```

_See {IERC20-transfer}.

Unlike &#x60;send&#x60;, &#x60;recipient&#x60; is _not_ required to implement the {IERC777Recipient}
interface if it is a contract.

Also emits a {Sent} event._

### burn

```solidity
function burn(uint256 amount, bytes data) public virtual
```

_See {IERC777-burn}.

Also emits a {IERC20-Transfer} event for ERC20 compatibility._

### isOperatorFor

```solidity
function isOperatorFor(address operator, address tokenHolder) public view virtual returns (bool)
```

_See {IERC777-isOperatorFor}._

### authorizeOperator

```solidity
function authorizeOperator(address operator) public virtual
```

_See {IERC777-authorizeOperator}._

### revokeOperator

```solidity
function revokeOperator(address operator) public virtual
```

_See {IERC777-revokeOperator}._

### defaultOperators

```solidity
function defaultOperators() public view virtual returns (address[])
```

_See {IERC777-defaultOperators}._

### operatorSend

```solidity
function operatorSend(address sender, address recipient, uint256 amount, bytes data, bytes operatorData) public virtual
```

_See {IERC777-operatorSend}.

Emits {Sent} and {IERC20-Transfer} events._

### operatorBurn

```solidity
function operatorBurn(address account, uint256 amount, bytes data, bytes operatorData) public virtual
```

_See {IERC777-operatorBurn}.

Emits {Burned} and {IERC20-Transfer} events._

### allowance

```solidity
function allowance(address holder, address spender) public view virtual returns (uint256)
```

_See {IERC20-allowance}.

Note that operator and allowance concepts are orthogonal: operators may
not have allowance, and accounts with allowance may not be operators
themselves._

### approve

```solidity
function approve(address spender, uint256 value) public virtual returns (bool)
```

_See {IERC20-approve}.

Note that accounts cannot have allowance issued by their operators._

### transferFrom

```solidity
function transferFrom(address holder, address recipient, uint256 amount) public virtual returns (bool)
```

_See {IERC20-transferFrom}.

Note that operator and allowance concepts are orthogonal: operators cannot
call &#x60;transferFrom&#x60; (unless they have allowance), and accounts with
allowance cannot call &#x60;operatorSend&#x60; (unless they are operators).

Emits {Sent}, {IERC20-Transfer} and {IERC20-Approval} events._

### _mint

```solidity
function _mint(address account, uint256 amount, bytes userData, bytes operatorData) internal virtual
```

_Creates &#x60;amount&#x60; tokens and assigns them to &#x60;account&#x60;, increasing
the total supply.

If a send hook is registered for &#x60;account&#x60;, the corresponding function
will be called with &#x60;operator&#x60;, &#x60;data&#x60; and &#x60;operatorData&#x60;.

See {IERC777Sender} and {IERC777Recipient}.

Emits {Minted} and {IERC20-Transfer} events.

Requirements

- &#x60;account&#x60; cannot be the zero address.
- if &#x60;account&#x60; is a contract, it must implement the {IERC777Recipient}
interface._

### _mint

```solidity
function _mint(address account, uint256 amount, bytes userData, bytes operatorData, bool requireReceptionAck) internal virtual
```

_Creates &#x60;amount&#x60; tokens and assigns them to &#x60;account&#x60;, increasing
the total supply.

If &#x60;requireReceptionAck&#x60; is set to true, and if a send hook is
registered for &#x60;account&#x60;, the corresponding function will be called with
&#x60;operator&#x60;, &#x60;data&#x60; and &#x60;operatorData&#x60;.

See {IERC777Sender} and {IERC777Recipient}.

Emits {Minted} and {IERC20-Transfer} events.

Requirements

- &#x60;account&#x60; cannot be the zero address.
- if &#x60;account&#x60; is a contract, it must implement the {IERC777Recipient}
interface._

### _send

```solidity
function _send(address from, address to, uint256 amount, bytes userData, bytes operatorData, bool requireReceptionAck) internal virtual
```

_Send tokens_

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | address token holder address |
| to | address | address recipient address |
| amount | uint256 | uint256 amount of tokens to transfer |
| userData | bytes | bytes extra information provided by the token holder (if any) |
| operatorData | bytes | bytes extra information provided by the operator (if any) |
| requireReceptionAck | bool | if true, contract recipients are required to implement ERC777TokensRecipient |

### _burn

```solidity
function _burn(address from, uint256 amount, bytes data, bytes operatorData) internal virtual
```

_Burn tokens_

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | address token holder address |
| amount | uint256 | uint256 amount of tokens to burn |
| data | bytes | bytes extra information provided by the token holder |
| operatorData | bytes | bytes extra information provided by the operator (if any) |

### _move

```solidity
function _move(address operator, address from, address to, uint256 amount, bytes userData, bytes operatorData) private
```

### _approve

```solidity
function _approve(address holder, address spender, uint256 value) internal
```

_See {ERC20-_approve}.

Note that accounts cannot have allowance issued by their operators._

### _callTokensToSend

```solidity
function _callTokensToSend(address operator, address from, address to, uint256 amount, bytes userData, bytes operatorData) private
```

_Call from.tokensToSend() if the interface is registered_

| Name | Type | Description |
| ---- | ---- | ----------- |
| operator | address | address operator requesting the transfer |
| from | address | address token holder address |
| to | address | address recipient address |
| amount | uint256 | uint256 amount of tokens to transfer |
| userData | bytes | bytes extra information provided by the token holder (if any) |
| operatorData | bytes | bytes extra information provided by the operator (if any) |

### _callTokensReceived

```solidity
function _callTokensReceived(address operator, address from, address to, uint256 amount, bytes userData, bytes operatorData, bool requireReceptionAck) private
```

_Call to.tokensReceived() if the interface is registered. Reverts if the recipient is a contract but
tokensReceived() was not registered for the recipient_

| Name | Type | Description |
| ---- | ---- | ----------- |
| operator | address | address operator requesting the transfer |
| from | address | address token holder address |
| to | address | address recipient address |
| amount | uint256 | uint256 amount of tokens to transfer |
| userData | bytes | bytes extra information provided by the token holder (if any) |
| operatorData | bytes | bytes extra information provided by the operator (if any) |
| requireReceptionAck | bool | if true, contract recipients are required to implement ERC777TokensRecipient |

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address operator, address from, address to, uint256 amount) internal virtual
```

_Hook that is called before any token transfer. This includes
calls to {send}, {transfer}, {operatorSend}, minting and burning.

Calling conditions:

- when &#x60;from&#x60; and &#x60;to&#x60; are both non-zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens
will be to transferred to &#x60;to&#x60;.
- when &#x60;from&#x60; is zero, &#x60;amount&#x60; tokens will be minted for &#x60;to&#x60;.
- when &#x60;to&#x60; is zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens will be burned.
- &#x60;from&#x60; and &#x60;to&#x60; are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### __gap

```solidity
uint256[41] __gap
```

## IERC777RecipientUpgradeable

_Interface of the ERC777TokensRecipient standard as defined in the EIP.

Accounts can be notified of {IERC777} tokens being sent to them by having a
contract implement this interface (contract holders can be their own
implementer) and registering it on the
https://eips.ethereum.org/EIPS/eip-1820[ERC1820 global registry].

See {IERC1820Registry} and {ERC1820Implementer}._

### tokensReceived

```solidity
function tokensReceived(address operator, address from, address to, uint256 amount, bytes userData, bytes operatorData) external
```

_Called by an {IERC777} token contract whenever tokens are being
moved or created into a registered account (&#x60;to&#x60;). The type of operation
is conveyed by &#x60;from&#x60; being the zero address or not.

This call occurs _after_ the token contract&#x27;s state is updated, so
{IERC777-balanceOf}, etc., can be used to query the post-operation state.

This function may revert to prevent the operation from being executed._

## IERC777SenderUpgradeable

_Interface of the ERC777TokensSender standard as defined in the EIP.

{IERC777} Token holders can be notified of operations performed on their
tokens by having a contract implement this interface (contract holders can be
their own implementer) and registering it on the
https://eips.ethereum.org/EIPS/eip-1820[ERC1820 global registry].

See {IERC1820Registry} and {ERC1820Implementer}._

### tokensToSend

```solidity
function tokensToSend(address operator, address from, address to, uint256 amount, bytes userData, bytes operatorData) external
```

_Called by an {IERC777} token contract whenever a registered holder&#x27;s
(&#x60;from&#x60;) tokens are about to be moved or destroyed. The type of operation
is conveyed by &#x60;to&#x60; being the zero address or not.

This call occurs _before_ the token contract&#x27;s state is updated, so
{IERC777-balanceOf}, etc., can be used to query the pre-operation state.

This function may revert to prevent the operation from being executed._

## IERC777Upgradeable

_Interface of the ERC777Token standard as defined in the EIP.

This contract uses the
https://eips.ethereum.org/EIPS/eip-1820[ERC1820 registry standard] to let
token holders and recipients react to token movements by using setting implementers
for the associated interfaces in said registry. See {IERC1820Registry} and
{ERC1820Implementer}._

### name

```solidity
function name() external view returns (string)
```

_Returns the name of the token._

### symbol

```solidity
function symbol() external view returns (string)
```

_Returns the symbol of the token, usually a shorter version of the
name._

### granularity

```solidity
function granularity() external view returns (uint256)
```

_Returns the smallest part of the token that is not divisible. This
means all token operations (creation, movement and destruction) must have
amounts that are a multiple of this number.

For most token contracts, this value will equal 1._

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

_Returns the amount of tokens in existence._

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```

_Returns the amount of tokens owned by an account (&#x60;owner&#x60;)._

### send

```solidity
function send(address recipient, uint256 amount, bytes data) external
```

_Moves &#x60;amount&#x60; tokens from the caller&#x27;s account to &#x60;recipient&#x60;.

If send or receive hooks are registered for the caller and &#x60;recipient&#x60;,
the corresponding functions will be called with &#x60;data&#x60; and empty
&#x60;operatorData&#x60;. See {IERC777Sender} and {IERC777Recipient}.

Emits a {Sent} event.

Requirements

- the caller must have at least &#x60;amount&#x60; tokens.
- &#x60;recipient&#x60; cannot be the zero address.
- if &#x60;recipient&#x60; is a contract, it must implement the {IERC777Recipient}
interface._

### burn

```solidity
function burn(uint256 amount, bytes data) external
```

_Destroys &#x60;amount&#x60; tokens from the caller&#x27;s account, reducing the
total supply.

If a send hook is registered for the caller, the corresponding function
will be called with &#x60;data&#x60; and empty &#x60;operatorData&#x60;. See {IERC777Sender}.

Emits a {Burned} event.

Requirements

- the caller must have at least &#x60;amount&#x60; tokens._

### isOperatorFor

```solidity
function isOperatorFor(address operator, address tokenHolder) external view returns (bool)
```

_Returns true if an account is an operator of &#x60;tokenHolder&#x60;.
Operators can send and burn tokens on behalf of their owners. All
accounts are their own operator.

See {operatorSend} and {operatorBurn}._

### authorizeOperator

```solidity
function authorizeOperator(address operator) external
```

_Make an account an operator of the caller.

See {isOperatorFor}.

Emits an {AuthorizedOperator} event.

Requirements

- &#x60;operator&#x60; cannot be calling address._

### revokeOperator

```solidity
function revokeOperator(address operator) external
```

_Revoke an account&#x27;s operator status for the caller.

See {isOperatorFor} and {defaultOperators}.

Emits a {RevokedOperator} event.

Requirements

- &#x60;operator&#x60; cannot be calling address._

### defaultOperators

```solidity
function defaultOperators() external view returns (address[])
```

_Returns the list of default operators. These accounts are operators
for all token holders, even if {authorizeOperator} was never called on
them.

This list is immutable, but individual holders may revoke these via
{revokeOperator}, in which case {isOperatorFor} will return false._

### operatorSend

```solidity
function operatorSend(address sender, address recipient, uint256 amount, bytes data, bytes operatorData) external
```

_Moves &#x60;amount&#x60; tokens from &#x60;sender&#x60; to &#x60;recipient&#x60;. The caller must
be an operator of &#x60;sender&#x60;.

If send or receive hooks are registered for &#x60;sender&#x60; and &#x60;recipient&#x60;,
the corresponding functions will be called with &#x60;data&#x60; and
&#x60;operatorData&#x60;. See {IERC777Sender} and {IERC777Recipient}.

Emits a {Sent} event.

Requirements

- &#x60;sender&#x60; cannot be the zero address.
- &#x60;sender&#x60; must have at least &#x60;amount&#x60; tokens.
- the caller must be an operator for &#x60;sender&#x60;.
- &#x60;recipient&#x60; cannot be the zero address.
- if &#x60;recipient&#x60; is a contract, it must implement the {IERC777Recipient}
interface._

### operatorBurn

```solidity
function operatorBurn(address account, uint256 amount, bytes data, bytes operatorData) external
```

_Destroys &#x60;amount&#x60; tokens from &#x60;account&#x60;, reducing the total supply.
The caller must be an operator of &#x60;account&#x60;.

If a send hook is registered for &#x60;account&#x60;, the corresponding function
will be called with &#x60;data&#x60; and &#x60;operatorData&#x60;. See {IERC777Sender}.

Emits a {Burned} event.

Requirements

- &#x60;account&#x60; cannot be the zero address.
- &#x60;account&#x60; must have at least &#x60;amount&#x60; tokens.
- the caller must be an operator for &#x60;account&#x60;._

### Sent

```solidity
event Sent(address operator, address from, address to, uint256 amount, bytes data, bytes operatorData)
```

### Minted

```solidity
event Minted(address operator, address to, uint256 amount, bytes data, bytes operatorData)
```

### Burned

```solidity
event Burned(address operator, address from, uint256 amount, bytes data, bytes operatorData)
```

### AuthorizedOperator

```solidity
event AuthorizedOperator(address operator, address tokenHolder)
```

### RevokedOperator

```solidity
event RevokedOperator(address operator, address tokenHolder)
```

## ERC777PresetFixedSupplyUpgradeable

_{ERC777} token, including:

 - Preminted initial supply
 - No access control mechanism (for minting/pausing) and hence no governance

_Available since v3.4.__

### initialize

```solidity
function initialize(string name, string symbol, address[] defaultOperators, uint256 initialSupply, address owner) public virtual
```

### __ERC777PresetFixedSupply_init

```solidity
function __ERC777PresetFixedSupply_init(string name, string symbol, address[] defaultOperators, uint256 initialSupply, address owner) internal
```

_Mints &#x60;initialSupply&#x60; amount of token and transfers them to &#x60;owner&#x60;.

See {ERC777-constructor}._

### __ERC777PresetFixedSupply_init_unchained

```solidity
function __ERC777PresetFixedSupply_init_unchained(string name, string symbol, address[] defaultOperators, uint256 initialSupply, address owner) internal
```

### __gap

```solidity
uint256[50] __gap
```

## AddressUpgradeable

_Collection of functions related to the address type_

### isContract

```solidity
function isContract(address account) internal view returns (bool)
```

_Returns true if &#x60;account&#x60; is a contract.

[IMPORTANT]
&#x3D;&#x3D;&#x3D;&#x3D;
It is unsafe to assume that an address for which this function returns
false is an externally-owned account (EOA) and not a contract.

Among others, &#x60;isContract&#x60; will return false for the following
types of addresses:

 - an externally-owned account
 - a contract in construction
 - an address where a contract will be created
 - an address where a contract lived, but was destroyed
&#x3D;&#x3D;&#x3D;&#x3D;_

### sendValue

```solidity
function sendValue(address payable recipient, uint256 amount) internal
```

_Replacement for Solidity&#x27;s &#x60;transfer&#x60;: sends &#x60;amount&#x60; wei to
&#x60;recipient&#x60;, forwarding all available gas and reverting on errors.

https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
of certain opcodes, possibly making contracts go over the 2300 gas limit
imposed by &#x60;transfer&#x60;, making them unable to receive funds via
&#x60;transfer&#x60;. {sendValue} removes this limitation.

https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].

IMPORTANT: because control is transferred to &#x60;recipient&#x60;, care must be
taken to not create reentrancy vulnerabilities. Consider using
{ReentrancyGuard} or the
https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern]._

### functionCall

```solidity
function functionCall(address target, bytes data) internal returns (bytes)
```

_Performs a Solidity function call using a low level &#x60;call&#x60;. A
plain &#x60;call&#x60; is an unsafe replacement for a function call: use this
function instead.

If &#x60;target&#x60; reverts with a revert reason, it is bubbled up by this
function (like regular Solidity function calls).

Returns the raw returned data. To convert to the expected return value,
use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight&#x3D;abi.decode#abi-encoding-and-decoding-functions[&#x60;abi.decode&#x60;].

Requirements:

- &#x60;target&#x60; must be a contract.
- calling &#x60;target&#x60; with &#x60;data&#x60; must not revert.

_Available since v3.1.__

### functionCall

```solidity
function functionCall(address target, bytes data, string errorMessage) internal returns (bytes)
```

_Same as {xref-Address-functionCall-address-bytes-}[&#x60;functionCall&#x60;], but with
&#x60;errorMessage&#x60; as a fallback revert reason when &#x60;target&#x60; reverts.

_Available since v3.1.__

### functionCallWithValue

```solidity
function functionCallWithValue(address target, bytes data, uint256 value) internal returns (bytes)
```

_Same as {xref-Address-functionCall-address-bytes-}[&#x60;functionCall&#x60;],
but also transferring &#x60;value&#x60; wei to &#x60;target&#x60;.

Requirements:

- the calling contract must have an ETH balance of at least &#x60;value&#x60;.
- the called Solidity function must be &#x60;payable&#x60;.

_Available since v3.1.__

### functionCallWithValue

```solidity
function functionCallWithValue(address target, bytes data, uint256 value, string errorMessage) internal returns (bytes)
```

_Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[&#x60;functionCallWithValue&#x60;], but
with &#x60;errorMessage&#x60; as a fallback revert reason when &#x60;target&#x60; reverts.

_Available since v3.1.__

### functionStaticCall

```solidity
function functionStaticCall(address target, bytes data) internal view returns (bytes)
```

_Same as {xref-Address-functionCall-address-bytes-}[&#x60;functionCall&#x60;],
but performing a static call.

_Available since v3.3.__

### functionStaticCall

```solidity
function functionStaticCall(address target, bytes data, string errorMessage) internal view returns (bytes)
```

_Same as {xref-Address-functionCall-address-bytes-string-}[&#x60;functionCall&#x60;],
but performing a static call.

_Available since v3.3.__

### verifyCallResult

```solidity
function verifyCallResult(bool success, bytes returndata, string errorMessage) internal pure returns (bytes)
```

_Tool to verifies that a low level call was successful, and revert if it wasn&#x27;t, either by bubbling the
revert reason using the provided one.

_Available since v4.3.__

## ArraysUpgradeable

_Collection of functions related to array types._

### findUpperBound

```solidity
function findUpperBound(uint256[] array, uint256 element) internal view returns (uint256)
```

_Searches a sorted &#x60;array&#x60; and returns the first index that contains
a value greater or equal to &#x60;element&#x60;. If no such index exists (i.e. all
values in the array are strictly less than &#x60;element&#x60;), the array length is
returned. Time complexity O(log n).

&#x60;array&#x60; is expected to be sorted in ascending order, and to contain no
repeated elements._

## ContextUpgradeable

_Provides information about the current execution context, including the
sender of the transaction and its data. While these are generally available
via msg.sender and msg.data, they should not be accessed in such a direct
manner, since when dealing with meta-transactions the account sending and
paying for execution may not be the actual sender (as far as an application
is concerned).

This contract is only required for intermediate, library-like contracts._

### __Context_init

```solidity
function __Context_init() internal
```

### __Context_init_unchained

```solidity
function __Context_init_unchained() internal
```

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

### __gap

```solidity
uint256[50] __gap
```

## CountersUpgradeable

_Provides counters that can only be incremented, decremented or reset. This can be used e.g. to track the number
of elements in a mapping, issuing ERC721 ids, or counting request ids.

Include with &#x60;using Counters for Counters.Counter;&#x60;_

### Counter

```solidity
struct Counter {
  uint256 _value;
}
```

### current

```solidity
function current(struct CountersUpgradeable.Counter counter) internal view returns (uint256)
```

### increment

```solidity
function increment(struct CountersUpgradeable.Counter counter) internal
```

### decrement

```solidity
function decrement(struct CountersUpgradeable.Counter counter) internal
```

### reset

```solidity
function reset(struct CountersUpgradeable.Counter counter) internal
```

## MulticallUpgradeable

_Provides a function to batch together multiple calls in a single external call.

_Available since v4.1.__

### __Multicall_init

```solidity
function __Multicall_init() internal
```

### __Multicall_init_unchained

```solidity
function __Multicall_init_unchained() internal
```

### multicall

```solidity
function multicall(bytes[] data) external returns (bytes[] results)
```

_Receives and executes a batch of function calls on this contract._

### _functionDelegateCall

```solidity
function _functionDelegateCall(address target, bytes data) private returns (bytes)
```

_Same as {xref-Address-functionCall-address-bytes-string-}[&#x60;functionCall&#x60;],
but performing a delegate call.

_Available since v3.4.__

### __gap

```solidity
uint256[50] __gap
```

## StorageSlotUpgradeable

_Library for reading and writing primitive types to specific storage slots.

Storage slots are often used to avoid storage conflict when dealing with upgradeable contracts.
This library helps with reading and writing to such slots without the need for inline assembly.

The functions in this library return Slot structs that contain a &#x60;value&#x60; member that can be used to read or write.

Example usage to set ERC1967 implementation slot:
&#x60;&#x60;&#x60;
contract ERC1967 {
    bytes32 internal constant _IMPLEMENTATION_SLOT &#x3D; 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    function _getImplementation() internal view returns (address) {
        return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;
    }

    function _setImplementation(address newImplementation) internal {
        require(Address.isContract(newImplementation), &quot;ERC1967: new implementation is not a contract&quot;);
        StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value &#x3D; newImplementation;
    }
}
&#x60;&#x60;&#x60;

_Available since v4.1 for &#x60;address&#x60;, &#x60;bool&#x60;, &#x60;bytes32&#x60;, and &#x60;uint256&#x60;.__

### AddressSlot

```solidity
struct AddressSlot {
  address value;
}
```

### BooleanSlot

```solidity
struct BooleanSlot {
  bool value;
}
```

### Bytes32Slot

```solidity
struct Bytes32Slot {
  bytes32 value;
}
```

### Uint256Slot

```solidity
struct Uint256Slot {
  uint256 value;
}
```

### getAddressSlot

```solidity
function getAddressSlot(bytes32 slot) internal pure returns (struct StorageSlotUpgradeable.AddressSlot r)
```

_Returns an &#x60;AddressSlot&#x60; with member &#x60;value&#x60; located at &#x60;slot&#x60;._

### getBooleanSlot

```solidity
function getBooleanSlot(bytes32 slot) internal pure returns (struct StorageSlotUpgradeable.BooleanSlot r)
```

_Returns an &#x60;BooleanSlot&#x60; with member &#x60;value&#x60; located at &#x60;slot&#x60;._

### getBytes32Slot

```solidity
function getBytes32Slot(bytes32 slot) internal pure returns (struct StorageSlotUpgradeable.Bytes32Slot r)
```

_Returns an &#x60;Bytes32Slot&#x60; with member &#x60;value&#x60; located at &#x60;slot&#x60;._

### getUint256Slot

```solidity
function getUint256Slot(bytes32 slot) internal pure returns (struct StorageSlotUpgradeable.Uint256Slot r)
```

_Returns an &#x60;Uint256Slot&#x60; with member &#x60;value&#x60; located at &#x60;slot&#x60;._

## StringsUpgradeable

_String operations._

### _HEX_SYMBOLS

```solidity
bytes16 _HEX_SYMBOLS
```

### toString

```solidity
function toString(uint256 value) internal pure returns (string)
```

_Converts a &#x60;uint256&#x60; to its ASCII &#x60;string&#x60; decimal representation._

### toHexString

```solidity
function toHexString(uint256 value) internal pure returns (string)
```

_Converts a &#x60;uint256&#x60; to its ASCII &#x60;string&#x60; hexadecimal representation._

### toHexString

```solidity
function toHexString(uint256 value, uint256 length) internal pure returns (string)
```

_Converts a &#x60;uint256&#x60; to its ASCII &#x60;string&#x60; hexadecimal representation with fixed length._

## TimersUpgradeable

_Tooling for timepoints, timers and delays_

### Timestamp

```solidity
struct Timestamp {
  uint64 _deadline;
}
```

### getDeadline

```solidity
function getDeadline(struct TimersUpgradeable.Timestamp timer) internal pure returns (uint64)
```

### setDeadline

```solidity
function setDeadline(struct TimersUpgradeable.Timestamp timer, uint64 timestamp) internal
```

### reset

```solidity
function reset(struct TimersUpgradeable.Timestamp timer) internal
```

### isUnset

```solidity
function isUnset(struct TimersUpgradeable.Timestamp timer) internal pure returns (bool)
```

### isStarted

```solidity
function isStarted(struct TimersUpgradeable.Timestamp timer) internal pure returns (bool)
```

### isPending

```solidity
function isPending(struct TimersUpgradeable.Timestamp timer) internal view returns (bool)
```

### isExpired

```solidity
function isExpired(struct TimersUpgradeable.Timestamp timer) internal view returns (bool)
```

### BlockNumber

```solidity
struct BlockNumber {
  uint64 _deadline;
}
```

### getDeadline

```solidity
function getDeadline(struct TimersUpgradeable.BlockNumber timer) internal pure returns (uint64)
```

### setDeadline

```solidity
function setDeadline(struct TimersUpgradeable.BlockNumber timer, uint64 timestamp) internal
```

### reset

```solidity
function reset(struct TimersUpgradeable.BlockNumber timer) internal
```

### isUnset

```solidity
function isUnset(struct TimersUpgradeable.BlockNumber timer) internal pure returns (bool)
```

### isStarted

```solidity
function isStarted(struct TimersUpgradeable.BlockNumber timer) internal pure returns (bool)
```

### isPending

```solidity
function isPending(struct TimersUpgradeable.BlockNumber timer) internal view returns (bool)
```

### isExpired

```solidity
function isExpired(struct TimersUpgradeable.BlockNumber timer) internal view returns (bool)
```

## ECDSAUpgradeable

_Elliptic Curve Digital Signature Algorithm (ECDSA) operations.

These functions can be used to verify that a message was signed by the holder
of the private keys of a given address._

### RecoverError

```solidity
enum RecoverError {
  NoError,
  InvalidSignature,
  InvalidSignatureLength,
  InvalidSignatureS,
  InvalidSignatureV
}
```

### _throwError

```solidity
function _throwError(enum ECDSAUpgradeable.RecoverError error) private pure
```

### tryRecover

```solidity
function tryRecover(bytes32 hash, bytes signature) internal pure returns (address, enum ECDSAUpgradeable.RecoverError)
```

_Returns the address that signed a hashed message (&#x60;hash&#x60;) with
&#x60;signature&#x60; or error string. This address can then be used for verification purposes.

The &#x60;ecrecover&#x60; EVM opcode allows for malleable (non-unique) signatures:
this function rejects them by requiring the &#x60;s&#x60; value to be in the lower
half order, and the &#x60;v&#x60; value to be either 27 or 28.

IMPORTANT: &#x60;hash&#x60; _must_ be the result of a hash operation for the
verification to be secure: it is possible to craft signatures that
recover to arbitrary addresses for non-hashed data. A safe way to ensure
this is by receiving a hash of the original message (which may otherwise
be too long), and then calling {toEthSignedMessageHash} on it.

Documentation for signature generation:
- with https://web3js.readthedocs.io/en/v1.3.4/web3-eth-accounts.html#sign[Web3.js]
- with https://docs.ethers.io/v5/api/signer/#Signer-signMessage[ethers]

_Available since v4.3.__

### recover

```solidity
function recover(bytes32 hash, bytes signature) internal pure returns (address)
```

_Returns the address that signed a hashed message (&#x60;hash&#x60;) with
&#x60;signature&#x60;. This address can then be used for verification purposes.

The &#x60;ecrecover&#x60; EVM opcode allows for malleable (non-unique) signatures:
this function rejects them by requiring the &#x60;s&#x60; value to be in the lower
half order, and the &#x60;v&#x60; value to be either 27 or 28.

IMPORTANT: &#x60;hash&#x60; _must_ be the result of a hash operation for the
verification to be secure: it is possible to craft signatures that
recover to arbitrary addresses for non-hashed data. A safe way to ensure
this is by receiving a hash of the original message (which may otherwise
be too long), and then calling {toEthSignedMessageHash} on it._

### tryRecover

```solidity
function tryRecover(bytes32 hash, bytes32 r, bytes32 vs) internal pure returns (address, enum ECDSAUpgradeable.RecoverError)
```

_Overload of {ECDSA-tryRecover} that receives the &#x60;r&#x60; and &#x60;vs&#x60; short-signature fields separately.

See https://eips.ethereum.org/EIPS/eip-2098[EIP-2098 short signatures]

_Available since v4.3.__

### recover

```solidity
function recover(bytes32 hash, bytes32 r, bytes32 vs) internal pure returns (address)
```

_Overload of {ECDSA-recover} that receives the &#x60;r and &#x60;vs&#x60; short-signature fields separately.

_Available since v4.2.__

### tryRecover

```solidity
function tryRecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) internal pure returns (address, enum ECDSAUpgradeable.RecoverError)
```

_Overload of {ECDSA-tryRecover} that receives the &#x60;v&#x60;,
&#x60;r&#x60; and &#x60;s&#x60; signature fields separately.

_Available since v4.3.__

### recover

```solidity
function recover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) internal pure returns (address)
```

_Overload of {ECDSA-recover} that receives the &#x60;v&#x60;,
&#x60;r&#x60; and &#x60;s&#x60; signature fields separately.
/_

### toEthSignedMessageHash

```solidity
function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32)
```

_Returns an Ethereum Signed Message, created from a &#x60;hash&#x60;. This
produces hash corresponding to the one signed with the
https://eth.wiki/json-rpc/API#eth_sign[&#x60;eth_sign&#x60;]
JSON-RPC method as part of EIP-191.

See {recover}.
/_

### toTypedDataHash

```solidity
function toTypedDataHash(bytes32 domainSeparator, bytes32 structHash) internal pure returns (bytes32)
```

_Returns an Ethereum Signed Typed Data, created from a
&#x60;domainSeparator&#x60; and a &#x60;structHash&#x60;. This produces hash corresponding
to the one signed with the
https://eips.ethereum.org/EIPS/eip-712[&#x60;eth_signTypedData&#x60;]
JSON-RPC method as part of EIP-712.

See {recover}.
/_

## SignatureCheckerUpgradeable

_Signature verification helper: Provide a single mechanism to verify both private-key (EOA) ECDSA signature and
ERC1271 contract sigantures. Using this instead of ECDSA.recover in your contract will make them compatible with
smart contract wallets such as Argent and Gnosis.

Note: unlike ECDSA signatures, contract signature&#x27;s are revocable, and the outcome of this function can thus change
through time. It could return true at block N and false at block N+1 (or the opposite).

_Available since v4.1.__

### isValidSignatureNow

```solidity
function isValidSignatureNow(address signer, bytes32 hash, bytes signature) internal view returns (bool)
```

## EIP712Upgradeable

_https://eips.ethereum.org/EIPS/eip-712[EIP 712] is a standard for hashing and signing of typed structured data.

The encoding specified in the EIP is very generic, and such a generic implementation in Solidity is not feasible,
thus this contract does not implement the encoding itself. Protocols need to implement the type-specific encoding
they need in their contracts using a combination of &#x60;abi.encode&#x60; and &#x60;keccak256&#x60;.

This contract implements the EIP 712 domain separator ({_domainSeparatorV4}) that is used as part of the encoding
scheme, and the final step of the encoding to obtain the message digest that is then signed via ECDSA
({_hashTypedDataV4}).

The implementation of the domain separator was designed to be as efficient as possible while still properly updating
the chain id to protect against replay attacks on an eventual fork of the chain.

NOTE: This contract implements the version of the encoding known as &quot;v4&quot;, as implemented by the JSON RPC method
https://docs.metamask.io/guide/signing-data.html[&#x60;eth_signTypedDataV4&#x60; in MetaMask].

_Available since v3.4.__

### _HASHED_NAME

```solidity
bytes32 _HASHED_NAME
```

### _HASHED_VERSION

```solidity
bytes32 _HASHED_VERSION
```

### _TYPE_HASH

```solidity
bytes32 _TYPE_HASH
```

### __EIP712_init

```solidity
function __EIP712_init(string name, string version) internal
```

_Initializes the domain separator and parameter caches.

The meaning of &#x60;name&#x60; and &#x60;version&#x60; is specified in
https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator[EIP 712]:

- &#x60;name&#x60;: the user readable name of the signing domain, i.e. the name of the DApp or the protocol.
- &#x60;version&#x60;: the current major version of the signing domain.

NOTE: These parameters cannot be changed except through a xref:learn::upgrading-smart-contracts.adoc[smart
contract upgrade]._

### __EIP712_init_unchained

```solidity
function __EIP712_init_unchained(string name, string version) internal
```

### _domainSeparatorV4

```solidity
function _domainSeparatorV4() internal view returns (bytes32)
```

_Returns the domain separator for the current chain._

### _buildDomainSeparator

```solidity
function _buildDomainSeparator(bytes32 typeHash, bytes32 nameHash, bytes32 versionHash) private view returns (bytes32)
```

### _hashTypedDataV4

```solidity
function _hashTypedDataV4(bytes32 structHash) internal view virtual returns (bytes32)
```

_Given an already https://eips.ethereum.org/EIPS/eip-712#definition-of-hashstruct[hashed struct], this
function returns the hash of the fully encoded EIP712 message for this domain.

This hash can be used together with {ECDSA-recover} to obtain the signer of a message. For example:

&#x60;&#x60;&#x60;solidity
bytes32 digest &#x3D; _hashTypedDataV4(keccak256(abi.encode(
    keccak256(&quot;Mail(address to,string contents)&quot;),
    mailTo,
    keccak256(bytes(mailContents))
)));
address signer &#x3D; ECDSA.recover(digest, signature);
&#x60;&#x60;&#x60;_

### _EIP712NameHash

```solidity
function _EIP712NameHash() internal view virtual returns (bytes32)
```

_The hash of the name parameter for the EIP712 domain.

NOTE: This function reads from storage by default, but can be redefined to return a constant value if gas costs
are a concern._

### _EIP712VersionHash

```solidity
function _EIP712VersionHash() internal view virtual returns (bytes32)
```

_The hash of the version parameter for the EIP712 domain.

NOTE: This function reads from storage by default, but can be redefined to return a constant value if gas costs
are a concern._

### __gap

```solidity
uint256[50] __gap
```

## ConditionalEscrowUpgradeable

_Base abstract escrow to only allow withdrawal if a condition is met.
Intended usage: See {Escrow}. Same usage guidelines apply here._

### __ConditionalEscrow_init

```solidity
function __ConditionalEscrow_init() internal
```

### __ConditionalEscrow_init_unchained

```solidity
function __ConditionalEscrow_init_unchained() internal
```

### withdrawalAllowed

```solidity
function withdrawalAllowed(address payee) public view virtual returns (bool)
```

_Returns whether an address is allowed to withdraw their funds. To be
implemented by derived contracts._

| Name | Type | Description |
| ---- | ---- | ----------- |
| payee | address | The destination address of the funds. |

### withdraw

```solidity
function withdraw(address payable payee) public virtual
```

_Withdraw accumulated balance for a payee, forwarding all gas to the
recipient.

WARNING: Forwarding all gas opens the door to reentrancy vulnerabilities.
Make sure you trust the recipient, or are either following the
checks-effects-interactions pattern or using {ReentrancyGuard}._

| Name | Type | Description |
| ---- | ---- | ----------- |
| payee | address payable | The address whose funds will be withdrawn and transferred to. |

### __gap

```solidity
uint256[50] __gap
```

## EscrowUpgradeable

_Base escrow contract, holds funds designated for a payee until they
withdraw them.

Intended usage: This contract (and derived escrow contracts) should be a
standalone contract, that only interacts with the contract that instantiated
it. That way, it is guaranteed that all Ether will be handled according to
the &#x60;Escrow&#x60; rules, and there is no need to check for payable functions or
transfers in the inheritance tree. The contract that uses the escrow as its
payment method should be its owner, and provide public methods redirecting
to the escrow&#x27;s deposit and withdraw._

### initialize

```solidity
function initialize() public virtual
```

### __Escrow_init

```solidity
function __Escrow_init() internal
```

### __Escrow_init_unchained

```solidity
function __Escrow_init_unchained() internal
```

### Deposited

```solidity
event Deposited(address payee, uint256 weiAmount)
```

### Withdrawn

```solidity
event Withdrawn(address payee, uint256 weiAmount)
```

### _deposits

```solidity
mapping(address &#x3D;&gt; uint256) _deposits
```

### depositsOf

```solidity
function depositsOf(address payee) public view returns (uint256)
```

### deposit

```solidity
function deposit(address payee) public payable virtual
```

_Stores the sent amount as credit to be withdrawn._

| Name | Type | Description |
| ---- | ---- | ----------- |
| payee | address | The destination address of the funds. |

### withdraw

```solidity
function withdraw(address payable payee) public virtual
```

_Withdraw accumulated balance for a payee, forwarding all gas to the
recipient.

WARNING: Forwarding all gas opens the door to reentrancy vulnerabilities.
Make sure you trust the recipient, or are either following the
checks-effects-interactions pattern or using {ReentrancyGuard}._

| Name | Type | Description |
| ---- | ---- | ----------- |
| payee | address payable | The address whose funds will be withdrawn and transferred to. |

### __gap

```solidity
uint256[49] __gap
```

## RefundEscrowUpgradeable

_Escrow that holds funds for a beneficiary, deposited from multiple
parties.
Intended usage: See {Escrow}. Same usage guidelines apply here.
The owner account (that is, the contract that instantiates this
contract) may deposit, close the deposit period, and allow for either
withdrawal by the beneficiary, or refunds to the depositors. All interactions
with &#x60;RefundEscrow&#x60; will be made through the owner contract._

### State

```solidity
enum State {
  Active,
  Refunding,
  Closed
}
```

### RefundsClosed

```solidity
event RefundsClosed()
```

### RefundsEnabled

```solidity
event RefundsEnabled()
```

### _state

```solidity
enum RefundEscrowUpgradeable.State _state
```

### _beneficiary

```solidity
address payable _beneficiary
```

### __RefundEscrow_init

```solidity
function __RefundEscrow_init(address payable beneficiary_) internal
```

_Constructor._

| Name | Type | Description |
| ---- | ---- | ----------- |
| beneficiary_ | address payable | The beneficiary of the deposits. |

### __RefundEscrow_init_unchained

```solidity
function __RefundEscrow_init_unchained(address payable beneficiary_) internal
```

### state

```solidity
function state() public view virtual returns (enum RefundEscrowUpgradeable.State)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum RefundEscrowUpgradeable.State | The current state of the escrow. |

### beneficiary

```solidity
function beneficiary() public view virtual returns (address payable)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address payable | The beneficiary of the escrow. |

### deposit

```solidity
function deposit(address refundee) public payable virtual
```

_Stores funds that may later be refunded._

| Name | Type | Description |
| ---- | ---- | ----------- |
| refundee | address | The address funds will be sent to if a refund occurs. |

### close

```solidity
function close() public virtual
```

_Allows for the beneficiary to withdraw their funds, rejecting
further deposits._

### enableRefunds

```solidity
function enableRefunds() public virtual
```

_Allows for refunds to take place, rejecting further deposits._

### beneficiaryWithdraw

```solidity
function beneficiaryWithdraw() public virtual
```

_Withdraws the beneficiary&#x27;s funds._

### withdrawalAllowed

```solidity
function withdrawalAllowed(address) public view returns (bool)
```

_Returns whether refundees can withdraw their deposits (be refunded). The overridden function receives a
&#x27;payee&#x27; argument, but we ignore it here since the condition is global, not per-payee._

### __gap

```solidity
uint256[49] __gap
```

## ERC165CheckerUpgradeable

_Library used to query support of an interface declared via {IERC165}.

Note that these functions return the actual result of the query: they do not
&#x60;revert&#x60; if an interface is not supported. It is up to the caller to decide
what to do in these cases._

### _INTERFACE_ID_INVALID

```solidity
bytes4 _INTERFACE_ID_INVALID
```

### supportsERC165

```solidity
function supportsERC165(address account) internal view returns (bool)
```

_Returns true if &#x60;account&#x60; supports the {IERC165} interface,_

### supportsInterface

```solidity
function supportsInterface(address account, bytes4 interfaceId) internal view returns (bool)
```

_Returns true if &#x60;account&#x60; supports the interface defined by
&#x60;interfaceId&#x60;. Support for {IERC165} itself is queried automatically.

See {IERC165-supportsInterface}._

### getSupportedInterfaces

```solidity
function getSupportedInterfaces(address account, bytes4[] interfaceIds) internal view returns (bool[])
```

_Returns a boolean array where each value corresponds to the
interfaces passed in and whether they&#x27;re supported or not. This allows
you to batch check interfaces for a contract where your expectation
is that some interfaces may not be supported.

See {IERC165-supportsInterface}.

_Available since v3.4.__

### supportsAllInterfaces

```solidity
function supportsAllInterfaces(address account, bytes4[] interfaceIds) internal view returns (bool)
```

_Returns true if &#x60;account&#x60; supports all the interfaces defined in
&#x60;interfaceIds&#x60;. Support for {IERC165} itself is queried automatically.

Batch-querying can lead to gas savings by skipping repeated checks for
{IERC165} support.

See {IERC165-supportsInterface}._

### _supportsERC165Interface

```solidity
function _supportsERC165Interface(address account, bytes4 interfaceId) private view returns (bool)
```

Query if a contract implements an interface, does not check ERC165 support

_Assumes that account contains a contract that supports ERC165, otherwise
the behavior of this method is undefined. This precondition can be checked
with {supportsERC165}.
Interface identification is specified in ERC-165._

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the contract to query for support of an interface |
| interfaceId | bytes4 | The interface identifier, as specified in ERC-165 |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the contract at account indicates support of the interface with identifier interfaceId, false otherwise |

## ERC165StorageUpgradeable

_Storage based implementation of the {IERC165} interface.

Contracts may inherit from this and call {_registerInterface} to declare
their support of an interface._

### __ERC165Storage_init

```solidity
function __ERC165Storage_init() internal
```

### __ERC165Storage_init_unchained

```solidity
function __ERC165Storage_init_unchained() internal
```

### _supportedInterfaces

```solidity
mapping(bytes4 &#x3D;&gt; bool) _supportedInterfaces
```

_Mapping of interface ids to whether or not it&#x27;s supported._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### _registerInterface

```solidity
function _registerInterface(bytes4 interfaceId) internal virtual
```

_Registers the contract as an implementer of the interface defined by
&#x60;interfaceId&#x60;. Support of the actual ERC165 interface is automatic and
registering its interface id is not required.

See {IERC165-supportsInterface}.

Requirements:

- &#x60;interfaceId&#x60; cannot be the ERC165 invalid interface (&#x60;0xffffffff&#x60;)._

### __gap

```solidity
uint256[49] __gap
```

## ERC165Upgradeable

_Implementation of the {IERC165} interface.

Contracts that want to implement ERC165 should inherit from this contract and override {supportsInterface} to check
for the additional interface id that will be supported. For example:

&#x60;&#x60;&#x60;solidity
function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId &#x3D;&#x3D; type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
}
&#x60;&#x60;&#x60;

Alternatively, {ERC165Storage} provides an easier to use but more expensive implementation._

### __ERC165_init

```solidity
function __ERC165_init() internal
```

### __ERC165_init_unchained

```solidity
function __ERC165_init_unchained() internal
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### __gap

```solidity
uint256[50] __gap
```

## ERC1820ImplementerUpgradeable

_Implementation of the {IERC1820Implementer} interface.

Contracts may inherit from this and call {_registerInterfaceForAddress} to
declare their willingness to be implementers.
{IERC1820Registry-setInterfaceImplementer} should then be called for the
registration to be complete._

### __ERC1820Implementer_init

```solidity
function __ERC1820Implementer_init() internal
```

### __ERC1820Implementer_init_unchained

```solidity
function __ERC1820Implementer_init_unchained() internal
```

### _ERC1820_ACCEPT_MAGIC

```solidity
bytes32 _ERC1820_ACCEPT_MAGIC
```

### _supportedInterfaces

```solidity
mapping(bytes32 &#x3D;&gt; mapping(address &#x3D;&gt; bool)) _supportedInterfaces
```

### canImplementInterfaceForAddress

```solidity
function canImplementInterfaceForAddress(bytes32 interfaceHash, address account) public view virtual returns (bytes32)
```

_See {IERC1820Implementer-canImplementInterfaceForAddress}._

### _registerInterfaceForAddress

```solidity
function _registerInterfaceForAddress(bytes32 interfaceHash, address account) internal virtual
```

_Declares the contract as willing to be an implementer of
&#x60;interfaceHash&#x60; for &#x60;account&#x60;.

See {IERC1820Registry-setInterfaceImplementer} and
{IERC1820Registry-interfaceHash}._

### __gap

```solidity
uint256[49] __gap
```

## IERC165Upgradeable

_Interface of the ERC165 standard, as defined in the
https://eips.ethereum.org/EIPS/eip-165[EIP].

Implementers can declare support of contract interfaces, which can then be
queried by others ({ERC165Checker}).

For an implementation, see {ERC165}._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```

_Returns true if this contract implements the interface defined by
&#x60;interfaceId&#x60;. See the corresponding
https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]
to learn more about how these ids are created.

This function call must use less than 30 000 gas._

## IERC1820ImplementerUpgradeable

_Interface for an ERC1820 implementer, as defined in the
https://eips.ethereum.org/EIPS/eip-1820#interface-implementation-erc1820implementerinterface[EIP].
Used by contracts that will be registered as implementers in the
{IERC1820Registry}._

### canImplementInterfaceForAddress

```solidity
function canImplementInterfaceForAddress(bytes32 interfaceHash, address account) external view returns (bytes32)
```

_Returns a special value (&#x60;ERC1820_ACCEPT_MAGIC&#x60;) if this contract
implements &#x60;interfaceHash&#x60; for &#x60;account&#x60;.

See {IERC1820Registry-setInterfaceImplementer}._

## IERC1820RegistryUpgradeable

_Interface of the global ERC1820 Registry, as defined in the
https://eips.ethereum.org/EIPS/eip-1820[EIP]. Accounts may register
implementers for interfaces in this registry, as well as query support.

Implementers may be shared by multiple accounts, and can also implement more
than a single interface for each account. Contracts can implement interfaces
for themselves, but externally-owned accounts (EOA) must delegate this to a
contract.

{IERC165} interfaces can also be queried via the registry.

For an in-depth explanation and source code analysis, see the EIP text._

### setManager

```solidity
function setManager(address account, address newManager) external
```

_Sets &#x60;newManager&#x60; as the manager for &#x60;account&#x60;. A manager of an
account is able to set interface implementers for it.

By default, each account is its own manager. Passing a value of &#x60;0x0&#x60; in
&#x60;newManager&#x60; will reset the manager to this initial state.

Emits a {ManagerChanged} event.

Requirements:

- the caller must be the current manager for &#x60;account&#x60;._

### getManager

```solidity
function getManager(address account) external view returns (address)
```

_Returns the manager for &#x60;account&#x60;.

See {setManager}._

### setInterfaceImplementer

```solidity
function setInterfaceImplementer(address account, bytes32 _interfaceHash, address implementer) external
```

_Sets the &#x60;implementer&#x60; contract as &#x60;&#x60;account&#x60;&#x60;&#x27;s implementer for
&#x60;interfaceHash&#x60;.

&#x60;account&#x60; being the zero address is an alias for the caller&#x27;s address.
The zero address can also be used in &#x60;implementer&#x60; to remove an old one.

See {interfaceHash} to learn how these are created.

Emits an {InterfaceImplementerSet} event.

Requirements:

- the caller must be the current manager for &#x60;account&#x60;.
- &#x60;interfaceHash&#x60; must not be an {IERC165} interface id (i.e. it must not
end in 28 zeroes).
- &#x60;implementer&#x60; must implement {IERC1820Implementer} and return true when
queried for support, unless &#x60;implementer&#x60; is the caller. See
{IERC1820Implementer-canImplementInterfaceForAddress}._

### getInterfaceImplementer

```solidity
function getInterfaceImplementer(address account, bytes32 _interfaceHash) external view returns (address)
```

_Returns the implementer of &#x60;interfaceHash&#x60; for &#x60;account&#x60;. If no such
implementer is registered, returns the zero address.

If &#x60;interfaceHash&#x60; is an {IERC165} interface id (i.e. it ends with 28
zeroes), &#x60;account&#x60; will be queried for support of it.

&#x60;account&#x60; being the zero address is an alias for the caller&#x27;s address._

### interfaceHash

```solidity
function interfaceHash(string interfaceName) external pure returns (bytes32)
```

_Returns the interface hash for an &#x60;interfaceName&#x60;, as defined in the
corresponding
https://eips.ethereum.org/EIPS/eip-1820#interface-name[section of the EIP]._

### updateERC165Cache

```solidity
function updateERC165Cache(address account, bytes4 interfaceId) external
```

Updates the cache with whether the contract implements an ERC165 interface or not.

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the contract for which to update the cache. |
| interfaceId | bytes4 | ERC165 interface for which to update the cache. |

### implementsERC165Interface

```solidity
function implementsERC165Interface(address account, bytes4 interfaceId) external view returns (bool)
```

Checks whether a contract implements an ERC165 interface or not.
If the result is not cached a direct lookup on the contract address is performed.
If the result is not cached or the cached value is out-of-date, the cache MUST be updated manually by calling
{updateERC165Cache} with the contract address.

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the contract to check. |
| interfaceId | bytes4 | ERC165 interface to check. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if &#x60;account&#x60; implements &#x60;interfaceId&#x60;, false otherwise. |

### implementsERC165InterfaceNoCache

```solidity
function implementsERC165InterfaceNoCache(address account, bytes4 interfaceId) external view returns (bool)
```

Checks whether a contract implements an ERC165 interface or not without using nor updating the cache.

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the contract to check. |
| interfaceId | bytes4 | ERC165 interface to check. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if &#x60;account&#x60; implements &#x60;interfaceId&#x60;, false otherwise. |

### InterfaceImplementerSet

```solidity
event InterfaceImplementerSet(address account, bytes32 interfaceHash, address implementer)
```

### ManagerChanged

```solidity
event ManagerChanged(address account, address newManager)
```

## MathUpgradeable

_Standard math utilities missing in the Solidity language._

### max

```solidity
function max(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the largest of two numbers._

### min

```solidity
function min(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the smallest of two numbers._

### average

```solidity
function average(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the average of two numbers. The result is rounded towards
zero._

### ceilDiv

```solidity
function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the ceiling of the division of two numbers.

This differs from standard division with &#x60;/&#x60; in that it rounds up instead
of rounding down._

## SafeCastUpgradeable

_Wrappers over Solidity&#x27;s uintXX/intXX casting operators with added overflow
checks.

Downcasting from uint256/int256 in Solidity does not revert on overflow. This can
easily result in undesired exploitation or bugs, since developers usually
assume that overflows raise errors. &#x60;SafeCast&#x60; restores this intuition by
reverting the transaction when such an operation overflows.

Using this library instead of the unchecked operations eliminates an entire
class of bugs, so it&#x27;s recommended to use it always.

Can be combined with {SafeMath} and {SignedSafeMath} to extend it to smaller types, by performing
all math on &#x60;uint256&#x60; and &#x60;int256&#x60; and then downcasting._

### toUint224

```solidity
function toUint224(uint256 value) internal pure returns (uint224)
```

_Returns the downcasted uint224 from uint256, reverting on
overflow (when the input is greater than largest uint224).

Counterpart to Solidity&#x27;s &#x60;uint224&#x60; operator.

Requirements:

- input must fit into 224 bits_

### toUint128

```solidity
function toUint128(uint256 value) internal pure returns (uint128)
```

_Returns the downcasted uint128 from uint256, reverting on
overflow (when the input is greater than largest uint128).

Counterpart to Solidity&#x27;s &#x60;uint128&#x60; operator.

Requirements:

- input must fit into 128 bits_

### toUint96

```solidity
function toUint96(uint256 value) internal pure returns (uint96)
```

_Returns the downcasted uint96 from uint256, reverting on
overflow (when the input is greater than largest uint96).

Counterpart to Solidity&#x27;s &#x60;uint96&#x60; operator.

Requirements:

- input must fit into 96 bits_

### toUint64

```solidity
function toUint64(uint256 value) internal pure returns (uint64)
```

_Returns the downcasted uint64 from uint256, reverting on
overflow (when the input is greater than largest uint64).

Counterpart to Solidity&#x27;s &#x60;uint64&#x60; operator.

Requirements:

- input must fit into 64 bits_

### toUint32

```solidity
function toUint32(uint256 value) internal pure returns (uint32)
```

_Returns the downcasted uint32 from uint256, reverting on
overflow (when the input is greater than largest uint32).

Counterpart to Solidity&#x27;s &#x60;uint32&#x60; operator.

Requirements:

- input must fit into 32 bits_

### toUint16

```solidity
function toUint16(uint256 value) internal pure returns (uint16)
```

_Returns the downcasted uint16 from uint256, reverting on
overflow (when the input is greater than largest uint16).

Counterpart to Solidity&#x27;s &#x60;uint16&#x60; operator.

Requirements:

- input must fit into 16 bits_

### toUint8

```solidity
function toUint8(uint256 value) internal pure returns (uint8)
```

_Returns the downcasted uint8 from uint256, reverting on
overflow (when the input is greater than largest uint8).

Counterpart to Solidity&#x27;s &#x60;uint8&#x60; operator.

Requirements:

- input must fit into 8 bits._

### toUint256

```solidity
function toUint256(int256 value) internal pure returns (uint256)
```

_Converts a signed int256 into an unsigned uint256.

Requirements:

- input must be greater than or equal to 0._

### toInt128

```solidity
function toInt128(int256 value) internal pure returns (int128)
```

_Returns the downcasted int128 from int256, reverting on
overflow (when the input is less than smallest int128 or
greater than largest int128).

Counterpart to Solidity&#x27;s &#x60;int128&#x60; operator.

Requirements:

- input must fit into 128 bits

_Available since v3.1.__

### toInt64

```solidity
function toInt64(int256 value) internal pure returns (int64)
```

_Returns the downcasted int64 from int256, reverting on
overflow (when the input is less than smallest int64 or
greater than largest int64).

Counterpart to Solidity&#x27;s &#x60;int64&#x60; operator.

Requirements:

- input must fit into 64 bits

_Available since v3.1.__

### toInt32

```solidity
function toInt32(int256 value) internal pure returns (int32)
```

_Returns the downcasted int32 from int256, reverting on
overflow (when the input is less than smallest int32 or
greater than largest int32).

Counterpart to Solidity&#x27;s &#x60;int32&#x60; operator.

Requirements:

- input must fit into 32 bits

_Available since v3.1.__

### toInt16

```solidity
function toInt16(int256 value) internal pure returns (int16)
```

_Returns the downcasted int16 from int256, reverting on
overflow (when the input is less than smallest int16 or
greater than largest int16).

Counterpart to Solidity&#x27;s &#x60;int16&#x60; operator.

Requirements:

- input must fit into 16 bits

_Available since v3.1.__

### toInt8

```solidity
function toInt8(int256 value) internal pure returns (int8)
```

_Returns the downcasted int8 from int256, reverting on
overflow (when the input is less than smallest int8 or
greater than largest int8).

Counterpart to Solidity&#x27;s &#x60;int8&#x60; operator.

Requirements:

- input must fit into 8 bits.

_Available since v3.1.__

### toInt256

```solidity
function toInt256(uint256 value) internal pure returns (int256)
```

_Converts an unsigned uint256 into a signed int256.

Requirements:

- input must be less than or equal to maxInt256._

## SafeMathUpgradeable

_Wrappers over Solidity&#x27;s arithmetic operations.

NOTE: &#x60;SafeMath&#x60; is no longer needed starting with Solidity 0.8. The compiler
now has built in overflow checking._

### tryAdd

```solidity
function tryAdd(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

_Returns the addition of two unsigned integers, with an overflow flag.

_Available since v3.4.__

### trySub

```solidity
function trySub(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

_Returns the substraction of two unsigned integers, with an overflow flag.

_Available since v3.4.__

### tryMul

```solidity
function tryMul(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

_Returns the multiplication of two unsigned integers, with an overflow flag.

_Available since v3.4.__

### tryDiv

```solidity
function tryDiv(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

_Returns the division of two unsigned integers, with a division by zero flag.

_Available since v3.4.__

### tryMod

```solidity
function tryMod(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

_Returns the remainder of dividing two unsigned integers, with a division by zero flag.

_Available since v3.4.__

### add

```solidity
function add(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the addition of two unsigned integers, reverting on
overflow.

Counterpart to Solidity&#x27;s &#x60;+&#x60; operator.

Requirements:

- Addition cannot overflow._

### sub

```solidity
function sub(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the subtraction of two unsigned integers, reverting on
overflow (when the result is negative).

Counterpart to Solidity&#x27;s &#x60;-&#x60; operator.

Requirements:

- Subtraction cannot overflow._

### mul

```solidity
function mul(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the multiplication of two unsigned integers, reverting on
overflow.

Counterpart to Solidity&#x27;s &#x60;*&#x60; operator.

Requirements:

- Multiplication cannot overflow._

### div

```solidity
function div(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the integer division of two unsigned integers, reverting on
division by zero. The result is rounded towards zero.

Counterpart to Solidity&#x27;s &#x60;/&#x60; operator.

Requirements:

- The divisor cannot be zero._

### mod

```solidity
function mod(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
reverting when dividing by zero.

Counterpart to Solidity&#x27;s &#x60;%&#x60; operator. This function uses a &#x60;revert&#x60;
opcode (which leaves remaining gas untouched) while Solidity uses an
invalid opcode to revert (consuming all remaining gas).

Requirements:

- The divisor cannot be zero._

### sub

```solidity
function sub(uint256 a, uint256 b, string errorMessage) internal pure returns (uint256)
```

_Returns the subtraction of two unsigned integers, reverting with custom message on
overflow (when the result is negative).

CAUTION: This function is deprecated because it requires allocating memory for the error
message unnecessarily. For custom revert reasons use {trySub}.

Counterpart to Solidity&#x27;s &#x60;-&#x60; operator.

Requirements:

- Subtraction cannot overflow._

### div

```solidity
function div(uint256 a, uint256 b, string errorMessage) internal pure returns (uint256)
```

_Returns the integer division of two unsigned integers, reverting with custom message on
division by zero. The result is rounded towards zero.

Counterpart to Solidity&#x27;s &#x60;/&#x60; operator. Note: this function uses a
&#x60;revert&#x60; opcode (which leaves remaining gas untouched) while Solidity
uses an invalid opcode to revert (consuming all remaining gas).

Requirements:

- The divisor cannot be zero._

### mod

```solidity
function mod(uint256 a, uint256 b, string errorMessage) internal pure returns (uint256)
```

_Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
reverting with custom message when dividing by zero.

CAUTION: This function is deprecated because it requires allocating memory for the error
message unnecessarily. For custom revert reasons use {tryMod}.

Counterpart to Solidity&#x27;s &#x60;%&#x60; operator. This function uses a &#x60;revert&#x60;
opcode (which leaves remaining gas untouched) while Solidity uses an
invalid opcode to revert (consuming all remaining gas).

Requirements:

- The divisor cannot be zero._

## EnumerableMapUpgradeable

_Library for managing an enumerable variant of Solidity&#x27;s
https://solidity.readthedocs.io/en/latest/types.html#mapping-types[&#x60;mapping&#x60;]
type.

Maps have the following properties:

- Entries are added, removed, and checked for existence in constant time
(O(1)).
- Entries are enumerated in O(n). No guarantees are made on the ordering.

&#x60;&#x60;&#x60;
contract Example {
    // Add the library methods
    using EnumerableMap for EnumerableMap.UintToAddressMap;

    // Declare a set state variable
    EnumerableMap.UintToAddressMap private myMap;
}
&#x60;&#x60;&#x60;

As of v3.0.0, only maps of type &#x60;uint256 -&gt; address&#x60; (&#x60;UintToAddressMap&#x60;) are
supported._

### Map

```solidity
struct Map {
  struct EnumerableSetUpgradeable.Bytes32Set _keys;
  mapping(bytes32 &#x3D;&gt; bytes32) _values;
}
```

### _set

```solidity
function _set(struct EnumerableMapUpgradeable.Map map, bytes32 key, bytes32 value) private returns (bool)
```

_Adds a key-value pair to a map, or updates the value for an existing
key. O(1).

Returns true if the key was added to the map, that is if it was not
already present._

### _remove

```solidity
function _remove(struct EnumerableMapUpgradeable.Map map, bytes32 key) private returns (bool)
```

_Removes a key-value pair from a map. O(1).

Returns true if the key was removed from the map, that is if it was present._

### _contains

```solidity
function _contains(struct EnumerableMapUpgradeable.Map map, bytes32 key) private view returns (bool)
```

_Returns true if the key is in the map. O(1)._

### _length

```solidity
function _length(struct EnumerableMapUpgradeable.Map map) private view returns (uint256)
```

_Returns the number of key-value pairs in the map. O(1)._

### _at

```solidity
function _at(struct EnumerableMapUpgradeable.Map map, uint256 index) private view returns (bytes32, bytes32)
```

_Returns the key-value pair stored at position &#x60;index&#x60; in the map. O(1).

Note that there are no guarantees on the ordering of entries inside the
array, and it may change when more entries are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### _tryGet

```solidity
function _tryGet(struct EnumerableMapUpgradeable.Map map, bytes32 key) private view returns (bool, bytes32)
```

_Tries to returns the value associated with &#x60;key&#x60;.  O(1).
Does not revert if &#x60;key&#x60; is not in the map._

### _get

```solidity
function _get(struct EnumerableMapUpgradeable.Map map, bytes32 key) private view returns (bytes32)
```

_Returns the value associated with &#x60;key&#x60;.  O(1).

Requirements:

- &#x60;key&#x60; must be in the map._

### _get

```solidity
function _get(struct EnumerableMapUpgradeable.Map map, bytes32 key, string errorMessage) private view returns (bytes32)
```

_Same as {_get}, with a custom error message when &#x60;key&#x60; is not in the map.

CAUTION: This function is deprecated because it requires allocating memory for the error
message unnecessarily. For custom revert reasons use {_tryGet}._

### UintToAddressMap

```solidity
struct UintToAddressMap {
  struct EnumerableMapUpgradeable.Map _inner;
}
```

### set

```solidity
function set(struct EnumerableMapUpgradeable.UintToAddressMap map, uint256 key, address value) internal returns (bool)
```

_Adds a key-value pair to a map, or updates the value for an existing
key. O(1).

Returns true if the key was added to the map, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableMapUpgradeable.UintToAddressMap map, uint256 key) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the key was removed from the map, that is if it was present._

### contains

```solidity
function contains(struct EnumerableMapUpgradeable.UintToAddressMap map, uint256 key) internal view returns (bool)
```

_Returns true if the key is in the map. O(1)._

### length

```solidity
function length(struct EnumerableMapUpgradeable.UintToAddressMap map) internal view returns (uint256)
```

_Returns the number of elements in the map. O(1)._

### at

```solidity
function at(struct EnumerableMapUpgradeable.UintToAddressMap map, uint256 index) internal view returns (uint256, address)
```

_Returns the element stored at position &#x60;index&#x60; in the set. O(1).
Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### tryGet

```solidity
function tryGet(struct EnumerableMapUpgradeable.UintToAddressMap map, uint256 key) internal view returns (bool, address)
```

_Tries to returns the value associated with &#x60;key&#x60;.  O(1).
Does not revert if &#x60;key&#x60; is not in the map.

_Available since v3.4.__

### get

```solidity
function get(struct EnumerableMapUpgradeable.UintToAddressMap map, uint256 key) internal view returns (address)
```

_Returns the value associated with &#x60;key&#x60;.  O(1).

Requirements:

- &#x60;key&#x60; must be in the map._

### get

```solidity
function get(struct EnumerableMapUpgradeable.UintToAddressMap map, uint256 key, string errorMessage) internal view returns (address)
```

_Same as {get}, with a custom error message when &#x60;key&#x60; is not in the map.

CAUTION: This function is deprecated because it requires allocating memory for the error
message unnecessarily. For custom revert reasons use {tryGet}._

## EnumerableSetUpgradeable

_Library for managing
https://en.wikipedia.org/wiki/Set_(abstract_data_type)[sets] of primitive
types.

Sets have the following properties:

- Elements are added, removed, and checked for existence in constant time
(O(1)).
- Elements are enumerated in O(n). No guarantees are made on the ordering.

&#x60;&#x60;&#x60;
contract Example {
    // Add the library methods
    using EnumerableSet for EnumerableSet.AddressSet;

    // Declare a set state variable
    EnumerableSet.AddressSet private mySet;
}
&#x60;&#x60;&#x60;

As of v3.3.0, sets of type &#x60;bytes32&#x60; (&#x60;Bytes32Set&#x60;), &#x60;address&#x60; (&#x60;AddressSet&#x60;)
and &#x60;uint256&#x60; (&#x60;UintSet&#x60;) are supported._

### Set

```solidity
struct Set {
  bytes32[] _values;
  mapping(bytes32 &#x3D;&gt; uint256) _indexes;
}
```

### _add

```solidity
function _add(struct EnumerableSetUpgradeable.Set set, bytes32 value) private returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### _remove

```solidity
function _remove(struct EnumerableSetUpgradeable.Set set, bytes32 value) private returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### _contains

```solidity
function _contains(struct EnumerableSetUpgradeable.Set set, bytes32 value) private view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### _length

```solidity
function _length(struct EnumerableSetUpgradeable.Set set) private view returns (uint256)
```

_Returns the number of values on the set. O(1)._

### _at

```solidity
function _at(struct EnumerableSetUpgradeable.Set set, uint256 index) private view returns (bytes32)
```

_Returns the value stored at position &#x60;index&#x60; in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### _values

```solidity
function _values(struct EnumerableSetUpgradeable.Set set) private view returns (bytes32[])
```

_Return the entire set in an array

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block._

### Bytes32Set

```solidity
struct Bytes32Set {
  struct EnumerableSetUpgradeable.Set _inner;
}
```

### add

```solidity
function add(struct EnumerableSetUpgradeable.Bytes32Set set, bytes32 value) internal returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableSetUpgradeable.Bytes32Set set, bytes32 value) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### contains

```solidity
function contains(struct EnumerableSetUpgradeable.Bytes32Set set, bytes32 value) internal view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### length

```solidity
function length(struct EnumerableSetUpgradeable.Bytes32Set set) internal view returns (uint256)
```

_Returns the number of values in the set. O(1)._

### at

```solidity
function at(struct EnumerableSetUpgradeable.Bytes32Set set, uint256 index) internal view returns (bytes32)
```

_Returns the value stored at position &#x60;index&#x60; in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### values

```solidity
function values(struct EnumerableSetUpgradeable.Bytes32Set set) internal view returns (bytes32[])
```

_Return the entire set in an array

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block._

### AddressSet

```solidity
struct AddressSet {
  struct EnumerableSetUpgradeable.Set _inner;
}
```

### add

```solidity
function add(struct EnumerableSetUpgradeable.AddressSet set, address value) internal returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableSetUpgradeable.AddressSet set, address value) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### contains

```solidity
function contains(struct EnumerableSetUpgradeable.AddressSet set, address value) internal view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### length

```solidity
function length(struct EnumerableSetUpgradeable.AddressSet set) internal view returns (uint256)
```

_Returns the number of values in the set. O(1)._

### at

```solidity
function at(struct EnumerableSetUpgradeable.AddressSet set, uint256 index) internal view returns (address)
```

_Returns the value stored at position &#x60;index&#x60; in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### values

```solidity
function values(struct EnumerableSetUpgradeable.AddressSet set) internal view returns (address[])
```

_Return the entire set in an array

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block._

### UintSet

```solidity
struct UintSet {
  struct EnumerableSetUpgradeable.Set _inner;
}
```

### add

```solidity
function add(struct EnumerableSetUpgradeable.UintSet set, uint256 value) internal returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableSetUpgradeable.UintSet set, uint256 value) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### contains

```solidity
function contains(struct EnumerableSetUpgradeable.UintSet set, uint256 value) internal view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### length

```solidity
function length(struct EnumerableSetUpgradeable.UintSet set) internal view returns (uint256)
```

_Returns the number of values on the set. O(1)._

### at

```solidity
function at(struct EnumerableSetUpgradeable.UintSet set, uint256 index) internal view returns (uint256)
```

_Returns the value stored at position &#x60;index&#x60; in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### values

```solidity
function values(struct EnumerableSetUpgradeable.UintSet set) internal view returns (uint256[])
```

_Return the entire set in an array

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block._

## AccessControl

_Contract module that allows children to implement role-based access
control mechanisms. This is a lightweight version that doesn&#x27;t allow enumerating role
members except through off-chain means by accessing the contract event logs. Some
applications may benefit from on-chain enumerability, for those cases see
{AccessControlEnumerable}.

Roles are referred to by their &#x60;bytes32&#x60; identifier. These should be exposed
in the external API and be unique. The best way to achieve this is by
using &#x60;public constant&#x60; hash digests:

&#x60;&#x60;&#x60;
bytes32 public constant MY_ROLE &#x3D; keccak256(&quot;MY_ROLE&quot;);
&#x60;&#x60;&#x60;

Roles can be used to represent a set of permissions. To restrict access to a
function call, use {hasRole}:

&#x60;&#x60;&#x60;
function foo() public {
    require(hasRole(MY_ROLE, msg.sender));
    ...
}
&#x60;&#x60;&#x60;

Roles can be granted and revoked dynamically via the {grantRole} and
{revokeRole} functions. Each role has an associated admin role, and only
accounts that have a role&#x27;s admin role can call {grantRole} and {revokeRole}.

By default, the admin role for all roles is &#x60;DEFAULT_ADMIN_ROLE&#x60;, which means
that only accounts with this role will be able to grant or revoke other
roles. More complex role relationships can be created by using
{_setRoleAdmin}.

WARNING: The &#x60;DEFAULT_ADMIN_ROLE&#x60; is also its own admin: it has permission to
grant and revoke this role. Extra precautions should be taken to secure
accounts that have been granted it._

### RoleData

```solidity
struct RoleData {
  mapping(address &#x3D;&gt; bool) members;
  bytes32 adminRole;
}
```

### _roles

```solidity
mapping(bytes32 &#x3D;&gt; struct AccessControl.RoleData) _roles
```

### DEFAULT_ADMIN_ROLE

```solidity
bytes32 DEFAULT_ADMIN_ROLE
```

### onlyRole

```solidity
modifier onlyRole(bytes32 role)
```

_Modifier that checks that an account has a specific role. Reverts
with a standardized message including the required role.

The format of the revert reason is given by the following regular expression:

 /^AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})$/

_Available since v4.1.__

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### hasRole

```solidity
function hasRole(bytes32 role, address account) public view returns (bool)
```

_Returns &#x60;true&#x60; if &#x60;account&#x60; has been granted &#x60;role&#x60;._

### _checkRole

```solidity
function _checkRole(bytes32 role, address account) internal view
```

_Revert with a standard message if &#x60;account&#x60; is missing &#x60;role&#x60;.

The format of the revert reason is given by the following regular expression:

 /^AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})$/_

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 role) public view returns (bytes32)
```

_Returns the admin role that controls &#x60;role&#x60;. See {grantRole} and
{revokeRole}.

To change a role&#x27;s admin, use {_setRoleAdmin}._

### grantRole

```solidity
function grantRole(bytes32 role, address account) public virtual
```

_Grants &#x60;role&#x60; to &#x60;account&#x60;.

If &#x60;account&#x60; had not been already granted &#x60;role&#x60;, emits a {RoleGranted}
event.

Requirements:

- the caller must have &#x60;&#x60;role&#x60;&#x60;&#x27;s admin role._

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) public virtual
```

_Revokes &#x60;role&#x60; from &#x60;account&#x60;.

If &#x60;account&#x60; had been granted &#x60;role&#x60;, emits a {RoleRevoked} event.

Requirements:

- the caller must have &#x60;&#x60;role&#x60;&#x60;&#x27;s admin role._

### renounceRole

```solidity
function renounceRole(bytes32 role, address account) public virtual
```

_Revokes &#x60;role&#x60; from the calling account.

Roles are often managed via {grantRole} and {revokeRole}: this function&#x27;s
purpose is to provide a mechanism for accounts to lose their privileges
if they are compromised (such as when a trusted device is misplaced).

If the calling account had been granted &#x60;role&#x60;, emits a {RoleRevoked}
event.

Requirements:

- the caller must be &#x60;account&#x60;._

### _setupRole

```solidity
function _setupRole(bytes32 role, address account) internal virtual
```

_Grants &#x60;role&#x60; to &#x60;account&#x60;.

If &#x60;account&#x60; had not been already granted &#x60;role&#x60;, emits a {RoleGranted}
event. Note that unlike {grantRole}, this function doesn&#x27;t perform any
checks on the calling account.

[WARNING]
&#x3D;&#x3D;&#x3D;&#x3D;
This function should only be called from the constructor when setting
up the initial roles for the system.

Using this function in any other way is effectively circumventing the admin
system imposed by {AccessControl}.
&#x3D;&#x3D;&#x3D;&#x3D;_

### _setRoleAdmin

```solidity
function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual
```

_Sets &#x60;adminRole&#x60; as &#x60;&#x60;role&#x60;&#x60;&#x27;s admin role.

Emits a {RoleAdminChanged} event._

### _grantRole

```solidity
function _grantRole(bytes32 role, address account) private
```

### _revokeRole

```solidity
function _revokeRole(bytes32 role, address account) private
```

## AccessControlEnumerable

_Extension of {AccessControl} that allows enumerating the members of each role._

### _roleMembers

```solidity
mapping(bytes32 &#x3D;&gt; struct EnumerableSet.AddressSet) _roleMembers
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### getRoleMember

```solidity
function getRoleMember(bytes32 role, uint256 index) public view returns (address)
```

_Returns one of the accounts that have &#x60;role&#x60;. &#x60;index&#x60; must be a
value between 0 and {getRoleMemberCount}, non-inclusive.

Role bearers are not sorted in any particular way, and their ordering may
change at any point.

WARNING: When using {getRoleMember} and {getRoleMemberCount}, make sure
you perform all queries on the same block. See the following
https://forum.openzeppelin.com/t/iterating-over-elements-on-enumerableset-in-openzeppelin-contracts/2296[forum post]
for more information._

### getRoleMemberCount

```solidity
function getRoleMemberCount(bytes32 role) public view returns (uint256)
```

_Returns the number of accounts that have &#x60;role&#x60;. Can be used
together with {getRoleMember} to enumerate all bearers of a role._

### grantRole

```solidity
function grantRole(bytes32 role, address account) public virtual
```

_Overload {grantRole} to track enumerable memberships_

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) public virtual
```

_Overload {revokeRole} to track enumerable memberships_

### renounceRole

```solidity
function renounceRole(bytes32 role, address account) public virtual
```

_Overload {renounceRole} to track enumerable memberships_

### _setupRole

```solidity
function _setupRole(bytes32 role, address account) internal virtual
```

_Overload {_setupRole} to track enumerable memberships_

## IAccessControl

_External interface of AccessControl declared to support ERC165 detection._

### RoleAdminChanged

```solidity
event RoleAdminChanged(bytes32 role, bytes32 previousAdminRole, bytes32 newAdminRole)
```

_Emitted when &#x60;newAdminRole&#x60; is set as &#x60;&#x60;role&#x60;&#x60;&#x27;s admin role, replacing &#x60;previousAdminRole&#x60;

&#x60;DEFAULT_ADMIN_ROLE&#x60; is the starting admin for all roles, despite
{RoleAdminChanged} not being emitted signaling this.

_Available since v3.1.__

### RoleGranted

```solidity
event RoleGranted(bytes32 role, address account, address sender)
```

_Emitted when &#x60;account&#x60; is granted &#x60;role&#x60;.

&#x60;sender&#x60; is the account that originated the contract call, an admin role
bearer except when using {AccessControl-_setupRole}._

### RoleRevoked

```solidity
event RoleRevoked(bytes32 role, address account, address sender)
```

_Emitted when &#x60;account&#x60; is revoked &#x60;role&#x60;.

&#x60;sender&#x60; is the account that originated the contract call:
  - if using &#x60;revokeRole&#x60;, it is the admin role bearer
  - if using &#x60;renounceRole&#x60;, it is the role bearer (i.e. &#x60;account&#x60;)_

### hasRole

```solidity
function hasRole(bytes32 role, address account) external view returns (bool)
```

_Returns &#x60;true&#x60; if &#x60;account&#x60; has been granted &#x60;role&#x60;._

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 role) external view returns (bytes32)
```

_Returns the admin role that controls &#x60;role&#x60;. See {grantRole} and
{revokeRole}.

To change a role&#x27;s admin, use {AccessControl-_setRoleAdmin}._

### grantRole

```solidity
function grantRole(bytes32 role, address account) external
```

_Grants &#x60;role&#x60; to &#x60;account&#x60;.

If &#x60;account&#x60; had not been already granted &#x60;role&#x60;, emits a {RoleGranted}
event.

Requirements:

- the caller must have &#x60;&#x60;role&#x60;&#x60;&#x27;s admin role._

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) external
```

_Revokes &#x60;role&#x60; from &#x60;account&#x60;.

If &#x60;account&#x60; had been granted &#x60;role&#x60;, emits a {RoleRevoked} event.

Requirements:

- the caller must have &#x60;&#x60;role&#x60;&#x60;&#x27;s admin role._

### renounceRole

```solidity
function renounceRole(bytes32 role, address account) external
```

_Revokes &#x60;role&#x60; from the calling account.

Roles are often managed via {grantRole} and {revokeRole}: this function&#x27;s
purpose is to provide a mechanism for accounts to lose their privileges
if they are compromised (such as when a trusted device is misplaced).

If the calling account had been granted &#x60;role&#x60;, emits a {RoleRevoked}
event.

Requirements:

- the caller must be &#x60;account&#x60;._

## IAccessControlEnumerable

_External interface of AccessControlEnumerable declared to support ERC165 detection._

### getRoleMember

```solidity
function getRoleMember(bytes32 role, uint256 index) external view returns (address)
```

_Returns one of the accounts that have &#x60;role&#x60;. &#x60;index&#x60; must be a
value between 0 and {getRoleMemberCount}, non-inclusive.

Role bearers are not sorted in any particular way, and their ordering may
change at any point.

WARNING: When using {getRoleMember} and {getRoleMemberCount}, make sure
you perform all queries on the same block. See the following
https://forum.openzeppelin.com/t/iterating-over-elements-on-enumerableset-in-openzeppelin-contracts/2296[forum post]
for more information._

### getRoleMemberCount

```solidity
function getRoleMemberCount(bytes32 role) external view returns (uint256)
```

_Returns the number of accounts that have &#x60;role&#x60;. Can be used
together with {getRoleMember} to enumerate all bearers of a role._

## Ownable

_Contract module which provides a basic access control mechanism, where
there is an account (an owner) that can be granted exclusive access to
specific functions.

By default, the owner account will be the one that deploys the contract. This
can later be changed with {transferOwnership}.

This module is used through inheritance. It will make available the modifier
&#x60;onlyOwner&#x60;, which can be applied to your functions to restrict their use to
the owner._

### _owner

```solidity
address _owner
```

### OwnershipTransferred

```solidity
event OwnershipTransferred(address previousOwner, address newOwner)
```

### constructor

```solidity
constructor() internal
```

_Initializes the contract setting the deployer as the initial owner._

### owner

```solidity
function owner() public view virtual returns (address)
```

_Returns the address of the current owner._

### onlyOwner

```solidity
modifier onlyOwner()
```

_Throws if called by any account other than the owner._

### renounceOwnership

```solidity
function renounceOwnership() public virtual
```

_Leaves the contract without owner. It will not be possible to call
&#x60;onlyOwner&#x60; functions anymore. Can only be called by the current owner.

NOTE: Renouncing ownership will leave the contract without an owner,
thereby removing any functionality that is only available to the owner._

### transferOwnership

```solidity
function transferOwnership(address newOwner) public virtual
```

_Transfers ownership of the contract to a new account (&#x60;newOwner&#x60;).
Can only be called by the current owner._

### _setOwner

```solidity
function _setOwner(address newOwner) private
```

## PaymentSplitter

_This contract allows to split Ether payments among a group of accounts. The sender does not need to be aware
that the Ether will be split in this way, since it is handled transparently by the contract.

The split can be in equal parts or in any other arbitrary proportion. The way this is specified is by assigning each
account to a number of shares. Of all the Ether that this contract receives, each account will then be able to claim
an amount proportional to the percentage of total shares they were assigned.

&#x60;PaymentSplitter&#x60; follows a _pull payment_ model. This means that payments are not automatically forwarded to the
accounts but kept in this contract, and the actual transfer is triggered as a separate step by calling the {release}
function._

### PayeeAdded

```solidity
event PayeeAdded(address account, uint256 shares)
```

### PaymentReleased

```solidity
event PaymentReleased(address to, uint256 amount)
```

### PaymentReceived

```solidity
event PaymentReceived(address from, uint256 amount)
```

### _totalShares

```solidity
uint256 _totalShares
```

### _totalReleased

```solidity
uint256 _totalReleased
```

### _shares

```solidity
mapping(address &#x3D;&gt; uint256) _shares
```

### _released

```solidity
mapping(address &#x3D;&gt; uint256) _released
```

### _payees

```solidity
address[] _payees
```

### constructor

```solidity
constructor(address[] payees, uint256[] shares_) public payable
```

_Creates an instance of &#x60;PaymentSplitter&#x60; where each account in &#x60;payees&#x60; is assigned the number of shares at
the matching position in the &#x60;shares&#x60; array.

All addresses in &#x60;payees&#x60; must be non-zero. Both arrays must have the same non-zero length, and there must be no
duplicates in &#x60;payees&#x60;._

### receive

```solidity
receive() external payable virtual
```

_The Ether received will be logged with {PaymentReceived} events. Note that these events are not fully
reliable: it&#x27;s possible for a contract to receive Ether without triggering this function. This only affects the
reliability of the events, and not the actual splitting of Ether.

To learn more about this see the Solidity documentation for
https://solidity.readthedocs.io/en/latest/contracts.html#fallback-function[fallback
functions]._

### totalShares

```solidity
function totalShares() public view returns (uint256)
```

_Getter for the total shares held by payees._

### totalReleased

```solidity
function totalReleased() public view returns (uint256)
```

_Getter for the total amount of Ether already released._

### shares

```solidity
function shares(address account) public view returns (uint256)
```

_Getter for the amount of shares held by an account._

### released

```solidity
function released(address account) public view returns (uint256)
```

_Getter for the amount of Ether already released to a payee._

### payee

```solidity
function payee(uint256 index) public view returns (address)
```

_Getter for the address of the payee number &#x60;index&#x60;._

### release

```solidity
function release(address payable account) public virtual
```

_Triggers a transfer to &#x60;account&#x60; of the amount of Ether they are owed, according to their percentage of the
total shares and their previous withdrawals._

### _addPayee

```solidity
function _addPayee(address account, uint256 shares_) private
```

_Add a new payee to the contract._

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the payee to add. |
| shares_ | uint256 | The number of shares owned by the payee. |

## Governor

_Core of the governance system, designed to be extended though various modules.

This contract is abstract and requires several function to be implemented in various modules:

- A counting module must implement {quorum}, {_quorumReached}, {_voteSucceeded} and {_countVote}
- A voting module must implement {getVotes}
- Additionanly, the {votingPeriod} must also be implemented

_Available since v4.3.__

### BALLOT_TYPEHASH

```solidity
bytes32 BALLOT_TYPEHASH
```

### ProposalCore

```solidity
struct ProposalCore {
  struct Timers.BlockNumber voteStart;
  struct Timers.BlockNumber voteEnd;
  bool executed;
  bool canceled;
}
```

### _name

```solidity
string _name
```

### _proposals

```solidity
mapping(uint256 &#x3D;&gt; struct Governor.ProposalCore) _proposals
```

### onlyGovernance

```solidity
modifier onlyGovernance()
```

_Restrict access to governor executing address. Some module might override the _executor function to make
sure this modifier is consistant with the execution model._

### constructor

```solidity
constructor(string name_) internal
```

_Sets the value for {name} and {version}_

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### name

```solidity
function name() public view virtual returns (string)
```

_See {IGovernor-name}._

### version

```solidity
function version() public view virtual returns (string)
```

_See {IGovernor-version}._

### hashProposal

```solidity
function hashProposal(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public pure virtual returns (uint256)
```

_See {IGovernor-hashProposal}.

The proposal id is produced by hashing the RLC encoded &#x60;targets&#x60; array, the &#x60;values&#x60; array, the &#x60;calldatas&#x60; array
and the descriptionHash (bytes32 which itself is the keccak256 hash of the description string). This proposal id
can be produced from the proposal data which is part of the {ProposalCreated} event. It can even be computed in
advance, before the proposal is submitted.

Note that the chainId and the governor address are not part of the proposal id computation. Consequently, the
same proposal (with same operation and same description) will have the same id if submitted on multiple governors
accross multiple networks. This also means that in order to execute the same operation twice (on the same
governor) the proposer will have to change the description in order to avoid proposal id conflicts._

### state

```solidity
function state(uint256 proposalId) public view virtual returns (enum IGovernor.ProposalState)
```

_See {IGovernor-state}._

### proposalSnapshot

```solidity
function proposalSnapshot(uint256 proposalId) public view virtual returns (uint256)
```

_See {IGovernor-proposalSnapshot}._

### proposalDeadline

```solidity
function proposalDeadline(uint256 proposalId) public view virtual returns (uint256)
```

_See {IGovernor-proposalDeadline}._

### _quorumReached

```solidity
function _quorumReached(uint256 proposalId) internal view virtual returns (bool)
```

_Amount of votes already cast passes the threshold limit._

### _voteSucceeded

```solidity
function _voteSucceeded(uint256 proposalId) internal view virtual returns (bool)
```

_Is the proposal successful or not._

### _countVote

```solidity
function _countVote(uint256 proposalId, address account, uint8 support, uint256 weight) internal virtual
```

_Register a vote with a given support and voting weight.

Note: Support is generic and can represent various things depending on the voting system used._

### propose

```solidity
function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) public virtual returns (uint256)
```

_See {IGovernor-propose}._

### execute

```solidity
function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public payable virtual returns (uint256)
```

_See {IGovernor-execute}._

### _execute

```solidity
function _execute(uint256, address[] targets, uint256[] values, bytes[] calldatas, bytes32) internal virtual
```

_Internal execution mechanism. Can be overriden to implement different execution mechanism_

### _cancel

```solidity
function _cancel(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) internal virtual returns (uint256)
```

_Internal cancel mechanism: locks up the proposal timer, preventing it from being re-submitted. Marks it as
canceled to allow distinguishing it from executed proposals.

Emits a {IGovernor-ProposalCanceled} event._

### castVote

```solidity
function castVote(uint256 proposalId, uint8 support) public virtual returns (uint256)
```

_See {IGovernor-castVote}._

### castVoteWithReason

```solidity
function castVoteWithReason(uint256 proposalId, uint8 support, string reason) public virtual returns (uint256)
```

_See {IGovernor-castVoteWithReason}._

### castVoteBySig

```solidity
function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s) public virtual returns (uint256)
```

_See {IGovernor-castVoteBySig}._

### _castVote

```solidity
function _castVote(uint256 proposalId, address account, uint8 support, string reason) internal virtual returns (uint256)
```

_Internal vote casting mechanism: Check that the vote is pending, that it has not been cast yet, retrieve
voting weight using {IGovernor-getVotes} and call the {_countVote} internal function.

Emits a {IGovernor-VoteCast} event._

### _executor

```solidity
function _executor() internal view virtual returns (address)
```

_Address through which the governor executes action. Will be overloaded by module that execute actions
through another contract such as a timelock._

## IGovernor

_Interface of the {Governor} core.

_Available since v4.3.__

### ProposalState

```solidity
enum ProposalState {
  Pending,
  Active,
  Canceled,
  Defeated,
  Succeeded,
  Queued,
  Expired,
  Executed
}
```

### ProposalCreated

```solidity
event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)
```

_Emitted when a proposal is created._

### ProposalCanceled

```solidity
event ProposalCanceled(uint256 proposalId)
```

_Emitted when a proposal is canceled._

### ProposalExecuted

```solidity
event ProposalExecuted(uint256 proposalId)
```

_Emitted when a proposal is executed._

### VoteCast

```solidity
event VoteCast(address voter, uint256 proposalId, uint8 support, uint256 weight, string reason)
```

_Emitted when a vote is cast.

Note: &#x60;support&#x60; values should be seen as buckets. There interpretation depends on the voting module used._

### name

```solidity
function name() public view virtual returns (string)
```

module:core

_Name of the governor instance (used in building the ERC712 domain separator)._

### version

```solidity
function version() public view virtual returns (string)
```

module:core

_Version of the governor instance (used in building the ERC712 domain separator). Default: &quot;1&quot;_

### COUNTING_MODE

```solidity
function COUNTING_MODE() public pure virtual returns (string)
```

module:voting

_A description of the possible &#x60;support&#x60; values for {castVote} and the way these votes are counted, meant to
be consumed by UIs to show correct vote options and interpret the results. The string is a URL-encoded sequence of
key-value pairs that each describe one aspect, for example &#x60;support&#x3D;bravo&amp;quorum&#x3D;for,abstain&#x60;.

There are 2 standard keys: &#x60;support&#x60; and &#x60;quorum&#x60;.

- &#x60;support&#x3D;bravo&#x60; refers to the vote options 0 &#x3D; For, 1 &#x3D; Against, 2 &#x3D; Abstain, as in &#x60;GovernorBravo&#x60;.
- &#x60;quorum&#x3D;bravo&#x60; means that only For votes are counted towards quorum.
- &#x60;quorum&#x3D;for,abstain&#x60; means that both For and Abstain votes are counted towards quorum.

NOTE: The string can be decoded by the standard
https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams[&#x60;URLSearchParams&#x60;]
JavaScript class._

### hashProposal

```solidity
function hashProposal(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public pure virtual returns (uint256)
```

module:core

_Hashing function used to (re)build the proposal id from the proposal details.._

### state

```solidity
function state(uint256 proposalId) public view virtual returns (enum IGovernor.ProposalState)
```

module:core

_Current state of a proposal, following Compound&#x27;s convention_

### proposalSnapshot

```solidity
function proposalSnapshot(uint256 proposalId) public view virtual returns (uint256)
```

module:core

_block number used to retrieve user&#x27;s votes and quorum._

### proposalDeadline

```solidity
function proposalDeadline(uint256 proposalId) public view virtual returns (uint256)
```

module:core

_timestamp at which votes close._

### votingDelay

```solidity
function votingDelay() public view virtual returns (uint256)
```

module:user-config

_delay, in number of block, between the proposal is created and the vote starts. This can be increassed to
leave time for users to buy voting power, of delegate it, before the voting of a proposal starts._

### votingPeriod

```solidity
function votingPeriod() public view virtual returns (uint256)
```

module:user-config

_delay, in number of blocks, between the vote start and vote ends.

Note: the {votingDelay} can delay the start of the vote. This must be considered when setting the voting
duration compared to the voting delay._

### quorum

```solidity
function quorum(uint256 blockNumber) public view virtual returns (uint256)
```

module:user-config

_Minimum number of cast voted required for a proposal to be successful.

Note: The &#x60;blockNumber&#x60; parameter corresponds to the snaphot used for counting vote. This allows to scale the
quroum depending on values such as the totalSupply of a token at this block (see {ERC20Votes})._

### getVotes

```solidity
function getVotes(address account, uint256 blockNumber) public view virtual returns (uint256)
```

module:reputation

_Voting power of an &#x60;account&#x60; at a specific &#x60;blockNumber&#x60;.

Note: this can be implemented in a number of ways, for example by reading the delegated balance from one (or
multiple), {ERC20Votes} tokens._

### hasVoted

```solidity
function hasVoted(uint256 proposalId, address account) public view virtual returns (bool)
```

module:voting

_Returns weither &#x60;account&#x60; has cast a vote on &#x60;proposalId&#x60;._

### propose

```solidity
function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) public virtual returns (uint256 proposalId)
```

_Create a new proposal. Vote start {IGovernor-votingDelay} blocks after the proposal is created and ends
{IGovernor-votingPeriod} blocks after the voting starts.

Emits a {ProposalCreated} event._

### execute

```solidity
function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public payable virtual returns (uint256 proposalId)
```

_Execute a successful proposal. This requires the quorum to be reached, the vote to be successful, and the
deadline to be reached.

Emits a {ProposalExecuted} event.

Note: some module can modify the requirements for execution, for example by adding an additional timelock._

### castVote

```solidity
function castVote(uint256 proposalId, uint8 support) public virtual returns (uint256 balance)
```

_Cast a vote

Emits a {VoteCast} event._

### castVoteWithReason

```solidity
function castVoteWithReason(uint256 proposalId, uint8 support, string reason) public virtual returns (uint256 balance)
```

_Cast a with a reason

Emits a {VoteCast} event._

### castVoteBySig

```solidity
function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s) public virtual returns (uint256 balance)
```

_Cast a vote using the user cryptographic signature.

Emits a {VoteCast} event._

## TimelockController

_Contract module which acts as a timelocked controller. When set as the
owner of an &#x60;Ownable&#x60; smart contract, it enforces a timelock on all
&#x60;onlyOwner&#x60; maintenance operations. This gives time for users of the
controlled contract to exit before a potentially dangerous maintenance
operation is applied.

By default, this contract is self administered, meaning administration tasks
have to go through the timelock process. The proposer (resp executor) role
is in charge of proposing (resp executing) operations. A common use case is
to position this {TimelockController} as the owner of a smart contract, with
a multisig or a DAO as the sole proposer.

_Available since v3.3.__

### TIMELOCK_ADMIN_ROLE

```solidity
bytes32 TIMELOCK_ADMIN_ROLE
```

### PROPOSER_ROLE

```solidity
bytes32 PROPOSER_ROLE
```

### EXECUTOR_ROLE

```solidity
bytes32 EXECUTOR_ROLE
```

### _DONE_TIMESTAMP

```solidity
uint256 _DONE_TIMESTAMP
```

### _timestamps

```solidity
mapping(bytes32 &#x3D;&gt; uint256) _timestamps
```

### _minDelay

```solidity
uint256 _minDelay
```

### CallScheduled

```solidity
event CallScheduled(bytes32 id, uint256 index, address target, uint256 value, bytes data, bytes32 predecessor, uint256 delay)
```

_Emitted when a call is scheduled as part of operation &#x60;id&#x60;._

### CallExecuted

```solidity
event CallExecuted(bytes32 id, uint256 index, address target, uint256 value, bytes data)
```

_Emitted when a call is performed as part of operation &#x60;id&#x60;._

### Cancelled

```solidity
event Cancelled(bytes32 id)
```

_Emitted when operation &#x60;id&#x60; is cancelled._

### MinDelayChange

```solidity
event MinDelayChange(uint256 oldDuration, uint256 newDuration)
```

_Emitted when the minimum delay for future operations is modified._

### constructor

```solidity
constructor(uint256 minDelay, address[] proposers, address[] executors) public
```

_Initializes the contract with a given &#x60;minDelay&#x60;._

### onlyRoleOrOpenRole

```solidity
modifier onlyRoleOrOpenRole(bytes32 role)
```

_Modifier to make a function callable only by a certain role. In
addition to checking the sender&#x27;s role, &#x60;address(0)&#x60; &#x27;s role is also
considered. Granting a role to &#x60;address(0)&#x60; is equivalent to enabling
this role for everyone._

### receive

```solidity
receive() external payable
```

_Contract might receive/hold ETH as part of the maintenance process._

### isOperation

```solidity
function isOperation(bytes32 id) public view virtual returns (bool pending)
```

_Returns whether an id correspond to a registered operation. This
includes both Pending, Ready and Done operations._

### isOperationPending

```solidity
function isOperationPending(bytes32 id) public view virtual returns (bool pending)
```

_Returns whether an operation is pending or not._

### isOperationReady

```solidity
function isOperationReady(bytes32 id) public view virtual returns (bool ready)
```

_Returns whether an operation is ready or not._

### isOperationDone

```solidity
function isOperationDone(bytes32 id) public view virtual returns (bool done)
```

_Returns whether an operation is done or not._

### getTimestamp

```solidity
function getTimestamp(bytes32 id) public view virtual returns (uint256 timestamp)
```

_Returns the timestamp at with an operation becomes ready (0 for
unset operations, 1 for done operations)._

### getMinDelay

```solidity
function getMinDelay() public view virtual returns (uint256 duration)
```

_Returns the minimum delay for an operation to become valid.

This value can be changed by executing an operation that calls &#x60;updateDelay&#x60;._

### hashOperation

```solidity
function hashOperation(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt) public pure virtual returns (bytes32 hash)
```

_Returns the identifier of an operation containing a single
transaction._

### hashOperationBatch

```solidity
function hashOperationBatch(address[] targets, uint256[] values, bytes[] datas, bytes32 predecessor, bytes32 salt) public pure virtual returns (bytes32 hash)
```

_Returns the identifier of an operation containing a batch of
transactions._

### schedule

```solidity
function schedule(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt, uint256 delay) public virtual
```

_Schedule an operation containing a single transaction.

Emits a {CallScheduled} event.

Requirements:

- the caller must have the &#x27;proposer&#x27; role._

### scheduleBatch

```solidity
function scheduleBatch(address[] targets, uint256[] values, bytes[] datas, bytes32 predecessor, bytes32 salt, uint256 delay) public virtual
```

_Schedule an operation containing a batch of transactions.

Emits one {CallScheduled} event per transaction in the batch.

Requirements:

- the caller must have the &#x27;proposer&#x27; role._

### _schedule

```solidity
function _schedule(bytes32 id, uint256 delay) private
```

_Schedule an operation that is to becomes valid after a given delay._

### cancel

```solidity
function cancel(bytes32 id) public virtual
```

_Cancel an operation.

Requirements:

- the caller must have the &#x27;proposer&#x27; role._

### execute

```solidity
function execute(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt) public payable virtual
```

_Execute an (ready) operation containing a single transaction.

Emits a {CallExecuted} event.

Requirements:

- the caller must have the &#x27;executor&#x27; role._

### executeBatch

```solidity
function executeBatch(address[] targets, uint256[] values, bytes[] datas, bytes32 predecessor, bytes32 salt) public payable virtual
```

_Execute an (ready) operation containing a batch of transactions.

Emits one {CallExecuted} event per transaction in the batch.

Requirements:

- the caller must have the &#x27;executor&#x27; role._

### _beforeCall

```solidity
function _beforeCall(bytes32 id, bytes32 predecessor) private view
```

_Checks before execution of an operation&#x27;s calls._

### _afterCall

```solidity
function _afterCall(bytes32 id) private
```

_Checks after execution of an operation&#x27;s calls._

### _call

```solidity
function _call(bytes32 id, uint256 index, address target, uint256 value, bytes data) private
```

_Execute an operation&#x27;s call.

Emits a {CallExecuted} event._

### updateDelay

```solidity
function updateDelay(uint256 newDelay) external virtual
```

_Changes the minimum timelock duration for future operations.

Emits a {MinDelayChange} event.

Requirements:

- the caller must be the timelock itself. This can only be achieved by scheduling and later executing
an operation where the timelock is the target and the data is the ABI-encoded call to this function._

## GovernorCompatibilityBravo

_Compatibility layer that implements GovernorBravo compatibility on to of {Governor}.

This compatibility layer includes a voting system and requires a {IGovernorTimelock} compatible module to be added
through inheritance. It does not include token bindings, not does it include any variable upgrade patterns.

_Available since v4.3.__

### VoteType

```solidity
enum VoteType {
  Against,
  For,
  Abstain
}
```

### ProposalDetails

```solidity
struct ProposalDetails {
  address proposer;
  address[] targets;
  uint256[] values;
  string[] signatures;
  bytes[] calldatas;
  uint256 forVotes;
  uint256 againstVotes;
  uint256 abstainVotes;
  mapping(address &#x3D;&gt; struct IGovernorCompatibilityBravo.Receipt) receipts;
  bytes32 descriptionHash;
}
```

### _proposalDetails

```solidity
mapping(uint256 &#x3D;&gt; struct GovernorCompatibilityBravo.ProposalDetails) _proposalDetails
```

### COUNTING_MODE

```solidity
function COUNTING_MODE() public pure virtual returns (string)
```

module:voting

_A description of the possible &#x60;support&#x60; values for {castVote} and the way these votes are counted, meant to
be consumed by UIs to show correct vote options and interpret the results. The string is a URL-encoded sequence of
key-value pairs that each describe one aspect, for example &#x60;support&#x3D;bravo&amp;quorum&#x3D;for,abstain&#x60;.

There are 2 standard keys: &#x60;support&#x60; and &#x60;quorum&#x60;.

- &#x60;support&#x3D;bravo&#x60; refers to the vote options 0 &#x3D; For, 1 &#x3D; Against, 2 &#x3D; Abstain, as in &#x60;GovernorBravo&#x60;.
- &#x60;quorum&#x3D;bravo&#x60; means that only For votes are counted towards quorum.
- &#x60;quorum&#x3D;for,abstain&#x60; means that both For and Abstain votes are counted towards quorum.

NOTE: The string can be decoded by the standard
https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams[&#x60;URLSearchParams&#x60;]
JavaScript class._

### propose

```solidity
function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) public virtual returns (uint256)
```

_See {IGovernor-propose}._

### propose

```solidity
function propose(address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description) public virtual returns (uint256)
```

_See {IGovernorCompatibilityBravo-propose}._

### queue

```solidity
function queue(uint256 proposalId) public virtual
```

_See {IGovernorCompatibilityBravo-queue}._

### execute

```solidity
function execute(uint256 proposalId) public payable virtual
```

_See {IGovernorCompatibilityBravo-execute}._

### cancel

```solidity
function cancel(uint256 proposalId) public virtual
```

_Cancels a proposal only if sender is the proposer, or proposer delegates dropped below proposal threshold._

### _encodeCalldata

```solidity
function _encodeCalldata(string[] signatures, bytes[] calldatas) private pure returns (bytes[])
```

_Encodes calldatas with optional function signature._

### _storeProposal

```solidity
function _storeProposal(address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description) private
```

_Store proposal metadata for later lookup_

### proposalThreshold

```solidity
function proposalThreshold() public view virtual returns (uint256)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;The number of votes required in order for a voter to become a proposer&quot;_._

### proposals

```solidity
function proposals(uint256 proposalId) public view virtual returns (uint256 id, address proposer, uint256 eta, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed)
```

_See {IGovernorCompatibilityBravo-proposals}._

### getActions

```solidity
function getActions(uint256 proposalId) public view virtual returns (address[] targets, uint256[] values, string[] signatures, bytes[] calldatas)
```

_See {IGovernorCompatibilityBravo-getActions}._

### getReceipt

```solidity
function getReceipt(uint256 proposalId, address voter) public view virtual returns (struct IGovernorCompatibilityBravo.Receipt)
```

_See {IGovernorCompatibilityBravo-getReceipt}._

### quorumVotes

```solidity
function quorumVotes() public view virtual returns (uint256)
```

_See {IGovernorCompatibilityBravo-quorumVotes}._

### hasVoted

```solidity
function hasVoted(uint256 proposalId, address account) public view virtual returns (bool)
```

_See {IGovernor-hasVoted}._

### _quorumReached

```solidity
function _quorumReached(uint256 proposalId) internal view virtual returns (bool)
```

_See {Governor-_quorumReached}. In this module, only forVotes count toward the quorum._

### _voteSucceeded

```solidity
function _voteSucceeded(uint256 proposalId) internal view virtual returns (bool)
```

_See {Governor-_voteSucceeded}. In this module, the forVotes must be scritly over the againstVotes._

### _countVote

```solidity
function _countVote(uint256 proposalId, address account, uint8 support, uint256 weight) internal virtual
```

_See {Governor-_countVote}. In this module, the support follows Governor Bravo._

## IGovernorCompatibilityBravo

_Interface extension that adds missing functions to the {Governor} core to provide &#x60;GovernorBravo&#x60; compatibility.

_Available since v4.3.__

### Proposal

```solidity
struct Proposal {
  uint256 id;
  address proposer;
  uint256 eta;
  address[] targets;
  uint256[] values;
  string[] signatures;
  bytes[] calldatas;
  uint256 startBlock;
  uint256 endBlock;
  uint256 forVotes;
  uint256 againstVotes;
  uint256 abstainVotes;
  bool canceled;
  bool executed;
  mapping(address &#x3D;&gt; struct IGovernorCompatibilityBravo.Receipt) receipts;
}
```

### Receipt

```solidity
struct Receipt {
  bool hasVoted;
  uint8 support;
  uint96 votes;
}
```

### quorumVotes

```solidity
function quorumVotes() public view virtual returns (uint256)
```

_Part of the Governor Bravo&#x27;s interface._

### proposals

```solidity
function proposals(uint256) public view virtual returns (uint256 id, address proposer, uint256 eta, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;The official record of all proposals ever proposed&quot;_._

### propose

```solidity
function propose(address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description) public virtual returns (uint256)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;Function used to propose a new proposal&quot;_._

### queue

```solidity
function queue(uint256 proposalId) public virtual
```

_Part of the Governor Bravo&#x27;s interface: _&quot;Queues a proposal of state succeeded&quot;_._

### execute

```solidity
function execute(uint256 proposalId) public payable virtual
```

_Part of the Governor Bravo&#x27;s interface: _&quot;Executes a queued proposal if eta has passed&quot;_._

### cancel

```solidity
function cancel(uint256 proposalId) public virtual
```

_Cancels a proposal only if sender is the proposer, or proposer delegates dropped below proposal threshold._

### getActions

```solidity
function getActions(uint256 proposalId) public view virtual returns (address[] targets, uint256[] values, string[] signatures, bytes[] calldatas)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;Gets actions of a proposal&quot;_._

### getReceipt

```solidity
function getReceipt(uint256 proposalId, address voter) public view virtual returns (struct IGovernorCompatibilityBravo.Receipt)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;Gets the receipt for a voter on a given proposal&quot;_._

### proposalThreshold

```solidity
function proposalThreshold() public view virtual returns (uint256)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;The number of votes required in order for a voter to become a proposer&quot;_._

## GovernorCountingSimple

_Extension of {Governor} for simple, 3 options, vote counting.

_Available since v4.3.__

### VoteType

```solidity
enum VoteType {
  Against,
  For,
  Abstain
}
```

### ProposalVote

```solidity
struct ProposalVote {
  uint256 againstVotes;
  uint256 forVotes;
  uint256 abstainVotes;
  mapping(address &#x3D;&gt; bool) hasVoted;
}
```

### _proposalVotes

```solidity
mapping(uint256 &#x3D;&gt; struct GovernorCountingSimple.ProposalVote) _proposalVotes
```

### COUNTING_MODE

```solidity
function COUNTING_MODE() public pure virtual returns (string)
```

_See {IGovernor-COUNTING_MODE}._

### hasVoted

```solidity
function hasVoted(uint256 proposalId, address account) public view virtual returns (bool)
```

_See {IGovernor-hasVoted}._

### proposalVotes

```solidity
function proposalVotes(uint256 proposalId) public view virtual returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)
```

_Accessor to the internal vote counts._

### _quorumReached

```solidity
function _quorumReached(uint256 proposalId) internal view virtual returns (bool)
```

_See {Governor-_quorumReached}._

### _voteSucceeded

```solidity
function _voteSucceeded(uint256 proposalId) internal view virtual returns (bool)
```

_See {Governor-_voteSucceeded}. In this module, the forVotes must be scritly over the againstVotes._

### _countVote

```solidity
function _countVote(uint256 proposalId, address account, uint8 support, uint256 weight) internal virtual
```

_See {Governor-_countVote}. In this module, the support follows the &#x60;VoteType&#x60; enum (from Governor Bravo)._

## GovernorProposalThreshold

_Extension of {Governor} for proposal restriction to token holders with a minimum balance.

_Available since v4.3.__

### propose

```solidity
function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) public virtual returns (uint256)
```

_See {IGovernor-propose}._

### proposalThreshold

```solidity
function proposalThreshold() public view virtual returns (uint256)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;The number of votes required in order for a voter to become a proposer&quot;_._

## ICompoundTimelock

https://github.com/compound-finance/compound-protocol/blob/master/contracts/Timelock.sol[Compound&#x27;s timelock] interface

### receive

```solidity
receive() external payable
```

### GRACE_PERIOD

```solidity
function GRACE_PERIOD() external view returns (uint256)
```

### MINIMUM_DELAY

```solidity
function MINIMUM_DELAY() external view returns (uint256)
```

### MAXIMUM_DELAY

```solidity
function MAXIMUM_DELAY() external view returns (uint256)
```

### admin

```solidity
function admin() external view returns (address)
```

### pendingAdmin

```solidity
function pendingAdmin() external view returns (address)
```

### delay

```solidity
function delay() external view returns (uint256)
```

### queuedTransactions

```solidity
function queuedTransactions(bytes32) external view returns (bool)
```

### setDelay

```solidity
function setDelay(uint256) external
```

### acceptAdmin

```solidity
function acceptAdmin() external
```

### setPendingAdmin

```solidity
function setPendingAdmin(address) external
```

### queueTransaction

```solidity
function queueTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) external returns (bytes32)
```

### cancelTransaction

```solidity
function cancelTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) external
```

### executeTransaction

```solidity
function executeTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) external payable returns (bytes)
```

## GovernorTimelockCompound

_Extension of {Governor} that binds the execution process to a Compound Timelock. This adds a delay, enforced by
the external timelock to all successful proposal (in addition to the voting duration). The {Governor} needs to be
the admin of the timelock for any operation to be performed. A public, unrestricted,
{GovernorTimelockCompound-__acceptAdmin} is available to accept ownership of the timelock.

Using this model means the proposal will be operated by the {TimelockController} and not by the {Governor}. Thus,
the assets and permissions must be attached to the {TimelockController}. Any asset sent to the {Governor} will be
inaccessible.

_Available since v4.3.__

### ProposalTimelock

```solidity
struct ProposalTimelock {
  struct Timers.Timestamp timer;
}
```

### _timelock

```solidity
contract ICompoundTimelock _timelock
```

### _proposalTimelocks

```solidity
mapping(uint256 &#x3D;&gt; struct GovernorTimelockCompound.ProposalTimelock) _proposalTimelocks
```

### TimelockChange

```solidity
event TimelockChange(address oldTimelock, address newTimelock)
```

_Emitted when the timelock controller used for proposal execution is modified._

### constructor

```solidity
constructor(contract ICompoundTimelock timelockAddress) internal
```

_Set the timelock._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### state

```solidity
function state(uint256 proposalId) public view virtual returns (enum IGovernor.ProposalState)
```

_Overriden version of the {Governor-state} function with added support for the &#x60;Queued&#x60; and &#x60;Expired&#x60; status._

### timelock

```solidity
function timelock() public view virtual returns (address)
```

_Public accessor to check the address of the timelock_

### proposalEta

```solidity
function proposalEta(uint256 proposalId) public view virtual returns (uint256)
```

_Public accessor to check the eta of a queued proposal_

### queue

```solidity
function queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public virtual returns (uint256)
```

_Function to queue a proposal to the timelock._

### _execute

```solidity
function _execute(uint256 proposalId, address[] targets, uint256[] values, bytes[] calldatas, bytes32) internal virtual
```

_Overriden execute function that run the already queued proposal through the timelock._

### _cancel

```solidity
function _cancel(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) internal virtual returns (uint256)
```

_Overriden version of the {Governor-_cancel} function to cancel the timelocked proposal if it as already
been queued._

### _executor

```solidity
function _executor() internal view virtual returns (address)
```

_Address through which the governor executes action. In this case, the timelock._

### __acceptAdmin

```solidity
function __acceptAdmin() public
```

_Accept admin right over the timelock._

### updateTimelock

```solidity
function updateTimelock(contract ICompoundTimelock newTimelock) external virtual
```

_Public endpoint to update the underlying timelock instance. Restricted to the timelock itself, so updates
must be proposed, scheduled and executed using the {Governor} workflow.

For security reason, the timelock must be handed over to another admin before setting up a new one. The two
operations (hand over the timelock) and do the update can be batched in a single proposal.

Note that if the timelock admin has been handed over in a previous operation, we refuse updates made through the
timelock if admin of the timelock has already been accepted and the operation is executed outside the scope of
governance._

### _updateTimelock

```solidity
function _updateTimelock(contract ICompoundTimelock newTimelock) private
```

## GovernorTimelockControl

_Extension of {Governor} that binds the execution process to an instance of {TimelockController}. This adds a
delay, enforced by the {TimelockController} to all successful proposal (in addition to the voting duration). The
{Governor} needs the proposer (an ideally the executor) roles for the {Governor} to work properly.

Using this model means the proposal will be operated by the {TimelockController} and not by the {Governor}. Thus,
the assets and permissions must be attached to the {TimelockController}. Any asset sent to the {Governor} will be
inaccessible.

_Available since v4.3.__

### _timelock

```solidity
contract TimelockController _timelock
```

### _timelockIds

```solidity
mapping(uint256 &#x3D;&gt; bytes32) _timelockIds
```

### TimelockChange

```solidity
event TimelockChange(address oldTimelock, address newTimelock)
```

_Emitted when the timelock controller used for proposal execution is modified._

### constructor

```solidity
constructor(contract TimelockController timelockAddress) internal
```

_Set the timelock._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### state

```solidity
function state(uint256 proposalId) public view virtual returns (enum IGovernor.ProposalState)
```

_Overriden version of the {Governor-state} function with added support for the &#x60;Queued&#x60; status._

### timelock

```solidity
function timelock() public view virtual returns (address)
```

_Public accessor to check the address of the timelock_

### proposalEta

```solidity
function proposalEta(uint256 proposalId) public view virtual returns (uint256)
```

_Public accessor to check the eta of a queued proposal_

### queue

```solidity
function queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public virtual returns (uint256)
```

_Function to queue a proposal to the timelock._

### _execute

```solidity
function _execute(uint256, address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) internal virtual
```

_Overriden execute function that run the already queued proposal through the timelock._

### _cancel

```solidity
function _cancel(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) internal virtual returns (uint256)
```

_Overriden version of the {Governor-_cancel} function to cancel the timelocked proposal if it as already
been queued._

### _executor

```solidity
function _executor() internal view virtual returns (address)
```

_Address through which the governor executes action. In this case, the timelock._

### updateTimelock

```solidity
function updateTimelock(contract TimelockController newTimelock) external virtual
```

_Public endpoint to update the underlying timelock instance. Restricted to the timelock itself, so updates
must be proposed, scheduled and executed using the {Governor} workflow._

### _updateTimelock

```solidity
function _updateTimelock(contract TimelockController newTimelock) private
```

## GovernorVotes

_Extension of {Governor} for voting weight extraction from an {ERC20Votes} token.

_Available since v4.3.__

### token

```solidity
contract ERC20Votes token
```

### constructor

```solidity
constructor(contract ERC20Votes tokenAddress) internal
```

### getVotes

```solidity
function getVotes(address account, uint256 blockNumber) public view virtual returns (uint256)
```

Read the voting weight from the token&#x27;s built in snapshot mechanism (see {IGovernor-getVotes}).

## GovernorVotesComp

_Extension of {Governor} for voting weight extraction from a Comp token.

_Available since v4.3.__

### token

```solidity
contract ERC20VotesComp token
```

### constructor

```solidity
constructor(contract ERC20VotesComp token_) internal
```

### getVotes

```solidity
function getVotes(address account, uint256 blockNumber) public view virtual returns (uint256)
```

Read the voting weight from the token&#x27;s built in snapshot mechanism (see {IGovernor-getVotes}).

## GovernorVotesQuorumFraction

_Extension of {Governor} for voting weight extraction from an {ERC20Votes} token and a quorum expressed as a
fraction of the total supply.

_Available since v4.3.__

### _quorumNumerator

```solidity
uint256 _quorumNumerator
```

### QuorumNumeratorUpdated

```solidity
event QuorumNumeratorUpdated(uint256 oldQuorumNumerator, uint256 newQuorumNumerator)
```

### constructor

```solidity
constructor(uint256 quorumNumeratorValue) internal
```

### quorumNumerator

```solidity
function quorumNumerator() public view virtual returns (uint256)
```

### quorumDenominator

```solidity
function quorumDenominator() public view virtual returns (uint256)
```

### quorum

```solidity
function quorum(uint256 blockNumber) public view virtual returns (uint256)
```

module:user-config

_Minimum number of cast voted required for a proposal to be successful.

Note: The &#x60;blockNumber&#x60; parameter corresponds to the snaphot used for counting vote. This allows to scale the
quroum depending on values such as the totalSupply of a token at this block (see {ERC20Votes})._

### updateQuorumNumerator

```solidity
function updateQuorumNumerator(uint256 newQuorumNumerator) external virtual
```

### _updateQuorumNumerator

```solidity
function _updateQuorumNumerator(uint256 newQuorumNumerator) internal virtual
```

## IGovernorTimelock

_Extension of the {IGovernor} for timelock supporting modules.

_Available since v4.3.__

### ProposalQueued

```solidity
event ProposalQueued(uint256 proposalId, uint256 eta)
```

### timelock

```solidity
function timelock() public view virtual returns (address)
```

### proposalEta

```solidity
function proposalEta(uint256 proposalId) public view virtual returns (uint256)
```

### queue

```solidity
function queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public virtual returns (uint256 proposalId)
```

## IERC1271

_Interface of the ERC1271 standard signature validation method for
contracts as defined in https://eips.ethereum.org/EIPS/eip-1271[ERC-1271].

_Available since v4.1.__

### isValidSignature

```solidity
function isValidSignature(bytes32 hash, bytes signature) external view returns (bytes4 magicValue)
```

_Should return whether the signature provided is valid for the provided data_

| Name | Type | Description |
| ---- | ---- | ----------- |
| hash | bytes32 | Hash of the data to be signed |
| signature | bytes | Signature byte array associated with _data |

## IERC1363

### transferAndCall

```solidity
function transferAndCall(address to, uint256 value) external returns (bool)
```

_Transfer tokens from &#x60;msg.sender&#x60; to another address and then call &#x60;onTransferReceived&#x60; on receiver_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address The address which you want to transfer to |
| value | uint256 | uint256 The amount of tokens to be transferred |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true unless throwing |

### transferAndCall

```solidity
function transferAndCall(address to, uint256 value, bytes data) external returns (bool)
```

_Transfer tokens from &#x60;msg.sender&#x60; to another address and then call &#x60;onTransferReceived&#x60; on receiver_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address The address which you want to transfer to |
| value | uint256 | uint256 The amount of tokens to be transferred |
| data | bytes | bytes Additional data with no specified format, sent in call to &#x60;to&#x60; |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true unless throwing |

### transferFromAndCall

```solidity
function transferFromAndCall(address from, address to, uint256 value) external returns (bool)
```

_Transfer tokens from one address to another and then call &#x60;onTransferReceived&#x60; on receiver_

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | address The address which you want to send tokens from |
| to | address | address The address which you want to transfer to |
| value | uint256 | uint256 The amount of tokens to be transferred |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true unless throwing |

### transferFromAndCall

```solidity
function transferFromAndCall(address from, address to, uint256 value, bytes data) external returns (bool)
```

_Transfer tokens from one address to another and then call &#x60;onTransferReceived&#x60; on receiver_

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | address The address which you want to send tokens from |
| to | address | address The address which you want to transfer to |
| value | uint256 | uint256 The amount of tokens to be transferred |
| data | bytes | bytes Additional data with no specified format, sent in call to &#x60;to&#x60; |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true unless throwing |

### approveAndCall

```solidity
function approveAndCall(address spender, uint256 value) external returns (bool)
```

_Approve the passed address to spend the specified amount of tokens on behalf of msg.sender
and then call &#x60;onApprovalReceived&#x60; on spender._

| Name | Type | Description |
| ---- | ---- | ----------- |
| spender | address | address The address which will spend the funds |
| value | uint256 | uint256 The amount of tokens to be spent |

### approveAndCall

```solidity
function approveAndCall(address spender, uint256 value, bytes data) external returns (bool)
```

_Approve the passed address to spend the specified amount of tokens on behalf of msg.sender
and then call &#x60;onApprovalReceived&#x60; on spender._

| Name | Type | Description |
| ---- | ---- | ----------- |
| spender | address | address The address which will spend the funds |
| value | uint256 | uint256 The amount of tokens to be spent |
| data | bytes | bytes Additional data with no specified format, sent in call to &#x60;spender&#x60; |

## IERC2981

_Interface for the NFT Royalty Standard_

### royaltyInfo

```solidity
function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount)
```

_Called with the sale price to determine how much royalty is owed and to whom._

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | - the NFT asset queried for royalty information |
| salePrice | uint256 | - the sale price of the NFT asset specified by &#x60;tokenId&#x60; |

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | address | - address of who should be sent the royalty payment |
| royaltyAmount | uint256 | - the royalty payment amount for &#x60;salePrice&#x60; |

## IERC3156FlashBorrower

_Interface of the ERC3156 FlashBorrower, as defined in
https://eips.ethereum.org/EIPS/eip-3156[ERC-3156].

_Available since v4.1.__

### onFlashLoan

```solidity
function onFlashLoan(address initiator, address token, uint256 amount, uint256 fee, bytes data) external returns (bytes32)
```

_Receive a flash loan._

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The initiator of the loan. |
| token | address | The loan currency. |
| amount | uint256 | The amount of tokens lent. |
| fee | uint256 | The additional amount of tokens to repay. |
| data | bytes | Arbitrary data structure, intended to contain user-defined parameters. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | The keccak256 hash of &quot;ERC3156FlashBorrower.onFlashLoan&quot; |

## IERC3156FlashLender

_Interface of the ERC3156 FlashLender, as defined in
https://eips.ethereum.org/EIPS/eip-3156[ERC-3156].

_Available since v4.1.__

### maxFlashLoan

```solidity
function maxFlashLoan(address token) external view returns (uint256)
```

_The amount of currency available to be lended._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The loan currency. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of &#x60;token&#x60; that can be borrowed. |

### flashFee

```solidity
function flashFee(address token, uint256 amount) external view returns (uint256)
```

_The fee to be charged for a given loan._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The loan currency. |
| amount | uint256 | The amount of tokens lent. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of &#x60;token&#x60; to be charged for the loan, on top of the returned principal. |

### flashLoan

```solidity
function flashLoan(contract IERC3156FlashBorrower receiver, address token, uint256 amount, bytes data) external returns (bool)
```

_Initiate a flash loan._

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | contract IERC3156FlashBorrower | The receiver of the tokens in the loan, and the receiver of the callback. |
| token | address | The loan currency. |
| amount | uint256 | The amount of tokens lent. |
| data | bytes | Arbitrary data structure, intended to contain user-defined parameters. |

## IERC2612

## ERC2771Context

_Context variant with ERC2771 support._

### _trustedForwarder

```solidity
address _trustedForwarder
```

### constructor

```solidity
constructor(address trustedForwarder) internal
```

### isTrustedForwarder

```solidity
function isTrustedForwarder(address forwarder) public view virtual returns (bool)
```

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address sender)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

## MinimalForwarder

_Simple minimal forwarder to be used together with an ERC2771 compatible contract. See {ERC2771Context}._

### ForwardRequest

```solidity
struct ForwardRequest {
  address from;
  address to;
  uint256 value;
  uint256 gas;
  uint256 nonce;
  bytes data;
}
```

### _TYPEHASH

```solidity
bytes32 _TYPEHASH
```

### _nonces

```solidity
mapping(address &#x3D;&gt; uint256) _nonces
```

### constructor

```solidity
constructor() public
```

### getNonce

```solidity
function getNonce(address from) public view returns (uint256)
```

### verify

```solidity
function verify(struct MinimalForwarder.ForwardRequest req, bytes signature) public view returns (bool)
```

### execute

```solidity
function execute(struct MinimalForwarder.ForwardRequest req, bytes signature) public payable returns (bool, bytes)
```

## ERC1967Proxy

_This contract implements an upgradeable proxy. It is upgradeable because calls are delegated to an
implementation address that can be changed. This address is stored in storage in the location specified by
https://eips.ethereum.org/EIPS/eip-1967[EIP1967], so that it doesn&#x27;t conflict with the storage layout of the
implementation behind the proxy._

### constructor

```solidity
constructor(address _logic, bytes _data) public payable
```

_Initializes the upgradeable proxy with an initial implementation specified by &#x60;_logic&#x60;.

If &#x60;_data&#x60; is nonempty, it&#x27;s used as data in a delegate call to &#x60;_logic&#x60;. This will typically be an encoded
function call, and allows initializating the storage of the proxy like a Solidity constructor._

### _implementation

```solidity
function _implementation() internal view virtual returns (address impl)
```

_Returns the current implementation address._

## ERC1967Upgrade

_This abstract contract provides getters and event emitting update functions for
https://eips.ethereum.org/EIPS/eip-1967[EIP1967] slots.

_Available since v4.1.__

### _ROLLBACK_SLOT

```solidity
bytes32 _ROLLBACK_SLOT
```

### _IMPLEMENTATION_SLOT

```solidity
bytes32 _IMPLEMENTATION_SLOT
```

_Storage slot with the address of the current implementation.
This is the keccak-256 hash of &quot;eip1967.proxy.implementation&quot; subtracted by 1, and is
validated in the constructor._

### Upgraded

```solidity
event Upgraded(address implementation)
```

_Emitted when the implementation is upgraded._

### _getImplementation

```solidity
function _getImplementation() internal view returns (address)
```

_Returns the current implementation address._

### _setImplementation

```solidity
function _setImplementation(address newImplementation) private
```

_Stores a new address in the EIP1967 implementation slot._

### _upgradeTo

```solidity
function _upgradeTo(address newImplementation) internal
```

_Perform implementation upgrade

Emits an {Upgraded} event._

### _upgradeToAndCall

```solidity
function _upgradeToAndCall(address newImplementation, bytes data, bool forceCall) internal
```

_Perform implementation upgrade with additional setup call.

Emits an {Upgraded} event._

### _upgradeToAndCallSecure

```solidity
function _upgradeToAndCallSecure(address newImplementation, bytes data, bool forceCall) internal
```

_Perform implementation upgrade with security checks for UUPS proxies, and additional setup call.

Emits an {Upgraded} event._

### _ADMIN_SLOT

```solidity
bytes32 _ADMIN_SLOT
```

_Storage slot with the admin of the contract.
This is the keccak-256 hash of &quot;eip1967.proxy.admin&quot; subtracted by 1, and is
validated in the constructor._

### AdminChanged

```solidity
event AdminChanged(address previousAdmin, address newAdmin)
```

_Emitted when the admin account has changed._

### _getAdmin

```solidity
function _getAdmin() internal view returns (address)
```

_Returns the current admin._

### _setAdmin

```solidity
function _setAdmin(address newAdmin) private
```

_Stores a new address in the EIP1967 admin slot._

### _changeAdmin

```solidity
function _changeAdmin(address newAdmin) internal
```

_Changes the admin of the proxy.

Emits an {AdminChanged} event._

### _BEACON_SLOT

```solidity
bytes32 _BEACON_SLOT
```

_The storage slot of the UpgradeableBeacon contract which defines the implementation for this proxy.
This is bytes32(uint256(keccak256(&#x27;eip1967.proxy.beacon&#x27;)) - 1)) and is validated in the constructor._

### BeaconUpgraded

```solidity
event BeaconUpgraded(address beacon)
```

_Emitted when the beacon is upgraded._

### _getBeacon

```solidity
function _getBeacon() internal view returns (address)
```

_Returns the current beacon._

### _setBeacon

```solidity
function _setBeacon(address newBeacon) private
```

_Stores a new beacon in the EIP1967 beacon slot._

### _upgradeBeaconToAndCall

```solidity
function _upgradeBeaconToAndCall(address newBeacon, bytes data, bool forceCall) internal
```

_Perform beacon upgrade with additional setup call. Note: This upgrades the address of the beacon, it does
not upgrade the implementation contained in the beacon (see {UpgradeableBeacon-_setImplementation} for that).

Emits a {BeaconUpgraded} event._

## Proxy

_This abstract contract provides a fallback function that delegates all calls to another contract using the EVM
instruction &#x60;delegatecall&#x60;. We refer to the second contract as the _implementation_ behind the proxy, and it has to
be specified by overriding the virtual {_implementation} function.

Additionally, delegation to the implementation can be triggered manually through the {_fallback} function, or to a
different contract through the {_delegate} function.

The success and return data of the delegated call will be returned back to the caller of the proxy._

### _delegate

```solidity
function _delegate(address implementation) internal virtual
```

_Delegates the current call to &#x60;implementation&#x60;.

This function does not return to its internall call site, it will return directly to the external caller._

### _implementation

```solidity
function _implementation() internal view virtual returns (address)
```

_This is a virtual function that should be overriden so it returns the address to which the fallback function
and {_fallback} should delegate._

### _fallback

```solidity
function _fallback() internal virtual
```

_Delegates the current call to the address returned by &#x60;_implementation()&#x60;.

This function does not return to its internall call site, it will return directly to the external caller._

### fallback

```solidity
fallback() external payable virtual
```

_Fallback function that delegates calls to the address returned by &#x60;_implementation()&#x60;. Will run if no other
function in the contract matches the call data._

### receive

```solidity
receive() external payable virtual
```

_Fallback function that delegates calls to the address returned by &#x60;_implementation()&#x60;. Will run if call data
is empty._

### _beforeFallback

```solidity
function _beforeFallback() internal virtual
```

_Hook that is called before falling back to the implementation. Can happen as part of a manual &#x60;_fallback&#x60;
call, or as part of the Solidity &#x60;fallback&#x60; or &#x60;receive&#x60; functions.

If overriden should call &#x60;super._beforeFallback()&#x60;._

## BeaconProxy

_This contract implements a proxy that gets the implementation address for each call from a {UpgradeableBeacon}.

The beacon address is stored in storage slot &#x60;uint256(keccak256(&#x27;eip1967.proxy.beacon&#x27;)) - 1&#x60;, so that it doesn&#x27;t
conflict with the storage layout of the implementation behind the proxy.

_Available since v3.4.__

### constructor

```solidity
constructor(address beacon, bytes data) public payable
```

_Initializes the proxy with &#x60;beacon&#x60;.

If &#x60;data&#x60; is nonempty, it&#x27;s used as data in a delegate call to the implementation returned by the beacon. This
will typically be an encoded function call, and allows initializating the storage of the proxy like a Solidity
constructor.

Requirements:

- &#x60;beacon&#x60; must be a contract with the interface {IBeacon}._

### _beacon

```solidity
function _beacon() internal view virtual returns (address)
```

_Returns the current beacon address._

### _implementation

```solidity
function _implementation() internal view virtual returns (address)
```

_Returns the current implementation address of the associated beacon._

### _setBeacon

```solidity
function _setBeacon(address beacon, bytes data) internal virtual
```

_Changes the proxy to use a new beacon. Deprecated: see {_upgradeBeaconToAndCall}.

If &#x60;data&#x60; is nonempty, it&#x27;s used as data in a delegate call to the implementation returned by the beacon.

Requirements:

- &#x60;beacon&#x60; must be a contract.
- The implementation returned by &#x60;beacon&#x60; must be a contract._

## IBeacon

_This is the interface that {BeaconProxy} expects of its beacon._

### implementation

```solidity
function implementation() external view returns (address)
```

_Must return an address that can be used as a delegate call target.

{BeaconProxy} will check that this address is a contract._

## UpgradeableBeacon

_This contract is used in conjunction with one or more instances of {BeaconProxy} to determine their
implementation contract, which is where they will delegate all function calls.

An owner is able to change the implementation the beacon points to, thus upgrading the proxies that use this beacon._

### _implementation

```solidity
address _implementation
```

### Upgraded

```solidity
event Upgraded(address implementation)
```

_Emitted when the implementation returned by the beacon is changed._

### constructor

```solidity
constructor(address implementation_) public
```

_Sets the address of the initial implementation, and the deployer account as the owner who can upgrade the
beacon._

### implementation

```solidity
function implementation() public view virtual returns (address)
```

_Returns the current implementation address._

### upgradeTo

```solidity
function upgradeTo(address newImplementation) public virtual
```

_Upgrades the beacon to a new implementation.

Emits an {Upgraded} event.

Requirements:

- msg.sender must be the owner of the contract.
- &#x60;newImplementation&#x60; must be a contract._

### _setImplementation

```solidity
function _setImplementation(address newImplementation) private
```

_Sets the implementation contract address for this beacon

Requirements:

- &#x60;newImplementation&#x60; must be a contract._

## ProxyAdmin

_This is an auxiliary contract meant to be assigned as the admin of a {TransparentUpgradeableProxy}. For an
explanation of why you would want to use this see the documentation for {TransparentUpgradeableProxy}._

### getProxyImplementation

```solidity
function getProxyImplementation(contract TransparentUpgradeableProxy proxy) public view virtual returns (address)
```

_Returns the current implementation of &#x60;proxy&#x60;.

Requirements:

- This contract must be the admin of &#x60;proxy&#x60;._

### getProxyAdmin

```solidity
function getProxyAdmin(contract TransparentUpgradeableProxy proxy) public view virtual returns (address)
```

_Returns the current admin of &#x60;proxy&#x60;.

Requirements:

- This contract must be the admin of &#x60;proxy&#x60;._

### changeProxyAdmin

```solidity
function changeProxyAdmin(contract TransparentUpgradeableProxy proxy, address newAdmin) public virtual
```

_Changes the admin of &#x60;proxy&#x60; to &#x60;newAdmin&#x60;.

Requirements:

- This contract must be the current admin of &#x60;proxy&#x60;._

### upgrade

```solidity
function upgrade(contract TransparentUpgradeableProxy proxy, address implementation) public virtual
```

_Upgrades &#x60;proxy&#x60; to &#x60;implementation&#x60;. See {TransparentUpgradeableProxy-upgradeTo}.

Requirements:

- This contract must be the admin of &#x60;proxy&#x60;._

### upgradeAndCall

```solidity
function upgradeAndCall(contract TransparentUpgradeableProxy proxy, address implementation, bytes data) public payable virtual
```

_Upgrades &#x60;proxy&#x60; to &#x60;implementation&#x60; and calls a function on the new implementation. See
{TransparentUpgradeableProxy-upgradeToAndCall}.

Requirements:

- This contract must be the admin of &#x60;proxy&#x60;._

## TransparentUpgradeableProxy

_This contract implements a proxy that is upgradeable by an admin.

To avoid https://medium.com/nomic-labs-blog/malicious-backdoors-in-ethereum-proxies-62629adf3357[proxy selector
clashing], which can potentially be used in an attack, this contract uses the
https://blog.openzeppelin.com/the-transparent-proxy-pattern/[transparent proxy pattern]. This pattern implies two
things that go hand in hand:

1. If any account other than the admin calls the proxy, the call will be forwarded to the implementation, even if
that call matches one of the admin functions exposed by the proxy itself.
2. If the admin calls the proxy, it can access the admin functions, but its calls will never be forwarded to the
implementation. If the admin tries to call a function on the implementation it will fail with an error that says
&quot;admin cannot fallback to proxy target&quot;.

These properties mean that the admin account can only be used for admin actions like upgrading the proxy or changing
the admin, so it&#x27;s best if it&#x27;s a dedicated account that is not used for anything else. This will avoid headaches due
to sudden errors when trying to call a function from the proxy implementation.

Our recommendation is for the dedicated account to be an instance of the {ProxyAdmin} contract. If set up this way,
you should think of the &#x60;ProxyAdmin&#x60; instance as the real administrative interface of your proxy._

### constructor

```solidity
constructor(address _logic, address admin_, bytes _data) public payable
```

_Initializes an upgradeable proxy managed by &#x60;_admin&#x60;, backed by the implementation at &#x60;_logic&#x60;, and
optionally initialized with &#x60;_data&#x60; as explained in {ERC1967Proxy-constructor}._

### ifAdmin

```solidity
modifier ifAdmin()
```

_Modifier used internally that will delegate the call to the implementation unless the sender is the admin._

### admin

```solidity
function admin() external returns (address admin_)
```

_Returns the current admin.

NOTE: Only the admin can call this function. See {ProxyAdmin-getProxyAdmin}.

TIP: To get this value clients can read directly from the storage slot shown below (specified by EIP1967) using the
https://eth.wiki/json-rpc/API#eth_getstorageat[&#x60;eth_getStorageAt&#x60;] RPC call.
&#x60;0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103&#x60;_

### implementation

```solidity
function implementation() external returns (address implementation_)
```

_Returns the current implementation.

NOTE: Only the admin can call this function. See {ProxyAdmin-getProxyImplementation}.

TIP: To get this value clients can read directly from the storage slot shown below (specified by EIP1967) using the
https://eth.wiki/json-rpc/API#eth_getstorageat[&#x60;eth_getStorageAt&#x60;] RPC call.
&#x60;0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc&#x60;_

### changeAdmin

```solidity
function changeAdmin(address newAdmin) external virtual
```

_Changes the admin of the proxy.

Emits an {AdminChanged} event.

NOTE: Only the admin can call this function. See {ProxyAdmin-changeProxyAdmin}._

### upgradeTo

```solidity
function upgradeTo(address newImplementation) external
```

_Upgrade the implementation of the proxy.

NOTE: Only the admin can call this function. See {ProxyAdmin-upgrade}._

### upgradeToAndCall

```solidity
function upgradeToAndCall(address newImplementation, bytes data) external payable
```

_Upgrade the implementation of the proxy, and then call a function from the new implementation as specified
by &#x60;data&#x60;, which should be an encoded function call. This is useful to initialize new storage variables in the
proxied contract.

NOTE: Only the admin can call this function. See {ProxyAdmin-upgradeAndCall}._

### _admin

```solidity
function _admin() internal view virtual returns (address)
```

_Returns the current admin._

### _beforeFallback

```solidity
function _beforeFallback() internal virtual
```

_Makes sure the admin cannot access the fallback function. See {Proxy-_beforeFallback}._

## UUPSUpgradeable

_An upgradeability mechanism designed for UUPS proxies. The functions included here can perform an upgrade of an
{ERC1967Proxy}, when this contract is set as the implementation behind such a proxy.

A security mechanism ensures that an upgrade does not turn off upgradeability accidentally, although this risk is
reinstated if the upgrade retains upgradeability but removes the security mechanism, e.g. by replacing
&#x60;UUPSUpgradeable&#x60; with a custom implementation of upgrades.

The {_authorizeUpgrade} function must be overridden to include access restriction to the upgrade mechanism.

_Available since v4.1.__

### upgradeTo

```solidity
function upgradeTo(address newImplementation) external virtual
```

_Upgrade the implementation of the proxy to &#x60;newImplementation&#x60;.

Calls {_authorizeUpgrade}.

Emits an {Upgraded} event._

### upgradeToAndCall

```solidity
function upgradeToAndCall(address newImplementation, bytes data) external payable virtual
```

_Upgrade the implementation of the proxy to &#x60;newImplementation&#x60;, and subsequently execute the function call
encoded in &#x60;data&#x60;.

Calls {_authorizeUpgrade}.

Emits an {Upgraded} event._

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal virtual
```

_Function that should revert when &#x60;msg.sender&#x60; is not authorized to upgrade the contract. Called by
{upgradeTo} and {upgradeToAndCall}.

Normally, this function will use an xref:access.adoc[access control] modifier such as {Ownable-onlyOwner}.

&#x60;&#x60;&#x60;solidity
function _authorizeUpgrade(address) internal override onlyOwner {}
&#x60;&#x60;&#x60;_

## Pausable

_Contract module which allows children to implement an emergency stop
mechanism that can be triggered by an authorized account.

This module is used through inheritance. It will make available the
modifiers &#x60;whenNotPaused&#x60; and &#x60;whenPaused&#x60;, which can be applied to
the functions of your contract. Note that they will not be pausable by
simply including this module, only once the modifiers are put in place._

### Paused

```solidity
event Paused(address account)
```

_Emitted when the pause is triggered by &#x60;account&#x60;._

### Unpaused

```solidity
event Unpaused(address account)
```

_Emitted when the pause is lifted by &#x60;account&#x60;._

### _paused

```solidity
bool _paused
```

### constructor

```solidity
constructor() internal
```

_Initializes the contract in unpaused state._

### paused

```solidity
function paused() public view virtual returns (bool)
```

_Returns true if the contract is paused, and false otherwise._

### whenNotPaused

```solidity
modifier whenNotPaused()
```

_Modifier to make a function callable only when the contract is not paused.

Requirements:

- The contract must not be paused._

### whenPaused

```solidity
modifier whenPaused()
```

_Modifier to make a function callable only when the contract is paused.

Requirements:

- The contract must be paused._

### _pause

```solidity
function _pause() internal virtual
```

_Triggers stopped state.

Requirements:

- The contract must not be paused._

### _unpause

```solidity
function _unpause() internal virtual
```

_Returns to normal state.

Requirements:

- The contract must be paused._

## PullPayment

_Simple implementation of a
https://consensys.github.io/smart-contract-best-practices/recommendations/#favor-pull-over-push-for-external-calls[pull-payment]
strategy, where the paying contract doesn&#x27;t interact directly with the
receiver account, which must withdraw its payments itself.

Pull-payments are often considered the best practice when it comes to sending
Ether, security-wise. It prevents recipients from blocking execution, and
eliminates reentrancy concerns.

TIP: If you would like to learn more about reentrancy and alternative ways
to protect against it, check out our blog post
https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].

To use, derive from the &#x60;PullPayment&#x60; contract, and use {_asyncTransfer}
instead of Solidity&#x27;s &#x60;transfer&#x60; function. Payees can query their due
payments with {payments}, and retrieve them with {withdrawPayments}._

### _escrow

```solidity
contract Escrow _escrow
```

### constructor

```solidity
constructor() internal
```

### withdrawPayments

```solidity
function withdrawPayments(address payable payee) public virtual
```

_Withdraw accumulated payments, forwarding all gas to the recipient.

Note that _any_ account can call this function, not just the &#x60;payee&#x60;.
This means that contracts unaware of the &#x60;PullPayment&#x60; protocol can still
receive funds this way, by having a separate account call
{withdrawPayments}.

WARNING: Forwarding all gas opens the door to reentrancy vulnerabilities.
Make sure you trust the recipient, or are either following the
checks-effects-interactions pattern or using {ReentrancyGuard}._

| Name | Type | Description |
| ---- | ---- | ----------- |
| payee | address payable | Whose payments will be withdrawn. |

### payments

```solidity
function payments(address dest) public view returns (uint256)
```

_Returns the payments owed to an address._

| Name | Type | Description |
| ---- | ---- | ----------- |
| dest | address | The creditor&#x27;s address. |

### _asyncTransfer

```solidity
function _asyncTransfer(address dest, uint256 amount) internal virtual
```

_Called by the payer to store the sent amount as credit to be pulled.
Funds sent in this way are stored in an intermediate {Escrow} contract, so
there is no danger of them being spent before withdrawal._

| Name | Type | Description |
| ---- | ---- | ----------- |
| dest | address | The destination address of the funds. |
| amount | uint256 | The amount to transfer. |

## ERC1155

_Implementation of the basic standard multi-token.
See https://eips.ethereum.org/EIPS/eip-1155
Originally based on code by Enjin: https://github.com/enjin/erc-1155

_Available since v3.1.__

### _balances

```solidity
mapping(uint256 &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) _balances
```

### _operatorApprovals

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; bool)) _operatorApprovals
```

### _uri

```solidity
string _uri
```

### constructor

```solidity
constructor(string uri_) public
```

_See {_setURI}._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### uri

```solidity
function uri(uint256) public view virtual returns (string)
```

_See {IERC1155MetadataURI-uri}.

This implementation returns the same URI for *all* token types. It relies
on the token type ID substitution mechanism
https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].

Clients calling this function must replace the &#x60;\{id\}&#x60; substring with the
actual token type ID._

### balanceOf

```solidity
function balanceOf(address account, uint256 id) public view virtual returns (uint256)
```

_See {IERC1155-balanceOf}.

Requirements:

- &#x60;account&#x60; cannot be the zero address._

### balanceOfBatch

```solidity
function balanceOfBatch(address[] accounts, uint256[] ids) public view virtual returns (uint256[])
```

_See {IERC1155-balanceOfBatch}.

Requirements:

- &#x60;accounts&#x60; and &#x60;ids&#x60; must have the same length._

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) public virtual
```

_See {IERC1155-setApprovalForAll}._

### isApprovedForAll

```solidity
function isApprovedForAll(address account, address operator) public view virtual returns (bool)
```

_See {IERC1155-isApprovedForAll}._

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) public virtual
```

_See {IERC1155-safeTransferFrom}._

### safeBatchTransferFrom

```solidity
function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data) public virtual
```

_See {IERC1155-safeBatchTransferFrom}._

### _safeTransferFrom

```solidity
function _safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) internal virtual
```

_Transfers &#x60;amount&#x60; tokens of token type &#x60;id&#x60; from &#x60;from&#x60; to &#x60;to&#x60;.

Emits a {TransferSingle} event.

Requirements:

- &#x60;to&#x60; cannot be the zero address.
- &#x60;from&#x60; must have a balance of tokens of type &#x60;id&#x60; of at least &#x60;amount&#x60;.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
acceptance magic value._

### _safeBatchTransferFrom

```solidity
function _safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

_xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {_safeTransferFrom}.

Emits a {TransferBatch} event.

Requirements:

- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
acceptance magic value._

### _setURI

```solidity
function _setURI(string newuri) internal virtual
```

_Sets a new URI for all token types, by relying on the token type ID
substitution mechanism
https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].

By this mechanism, any occurrence of the &#x60;\{id\}&#x60; substring in either the
URI or any of the amounts in the JSON file at said URI will be replaced by
clients with the token type ID.

For example, the &#x60;https://token-cdn-domain/\{id\}.json&#x60; URI would be
interpreted by clients as
&#x60;https://token-cdn-domain/000000000000000000000000000000000000000000000000000000000004cce0.json&#x60;
for token type ID 0x4cce0.

See {uri}.

Because these URIs cannot be meaningfully represented by the {URI} event,
this function emits no events._

### _mint

```solidity
function _mint(address account, uint256 id, uint256 amount, bytes data) internal virtual
```

_Creates &#x60;amount&#x60; tokens of token type &#x60;id&#x60;, and assigns them to &#x60;account&#x60;.

Emits a {TransferSingle} event.

Requirements:

- &#x60;account&#x60; cannot be the zero address.
- If &#x60;account&#x60; refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
acceptance magic value._

### _mintBatch

```solidity
function _mintBatch(address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

_xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {_mint}.

Requirements:

- &#x60;ids&#x60; and &#x60;amounts&#x60; must have the same length.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
acceptance magic value._

### _burn

```solidity
function _burn(address account, uint256 id, uint256 amount) internal virtual
```

_Destroys &#x60;amount&#x60; tokens of token type &#x60;id&#x60; from &#x60;account&#x60;

Requirements:

- &#x60;account&#x60; cannot be the zero address.
- &#x60;account&#x60; must have at least &#x60;amount&#x60; tokens of token type &#x60;id&#x60;._

### _burnBatch

```solidity
function _burnBatch(address account, uint256[] ids, uint256[] amounts) internal virtual
```

_xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {_burn}.

Requirements:

- &#x60;ids&#x60; and &#x60;amounts&#x60; must have the same length._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

_Hook that is called before any token transfer. This includes minting
and burning, as well as batched variants.

The same hook is called on both single and batched variants. For single
transfers, the length of the &#x60;id&#x60; and &#x60;amount&#x60; arrays will be 1.

Calling conditions (for each &#x60;id&#x60; and &#x60;amount&#x60; pair):

- When &#x60;from&#x60; and &#x60;to&#x60; are both non-zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens
of token type &#x60;id&#x60; will be  transferred to &#x60;to&#x60;.
- When &#x60;from&#x60; is zero, &#x60;amount&#x60; tokens of token type &#x60;id&#x60; will be minted
for &#x60;to&#x60;.
- when &#x60;to&#x60; is zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens of token type &#x60;id&#x60;
will be burned.
- &#x60;from&#x60; and &#x60;to&#x60; are never both zero.
- &#x60;ids&#x60; and &#x60;amounts&#x60; have the same, non-zero length.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### _doSafeTransferAcceptanceCheck

```solidity
function _doSafeTransferAcceptanceCheck(address operator, address from, address to, uint256 id, uint256 amount, bytes data) private
```

### _doSafeBatchTransferAcceptanceCheck

```solidity
function _doSafeBatchTransferAcceptanceCheck(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) private
```

### _asSingletonArray

```solidity
function _asSingletonArray(uint256 element) private pure returns (uint256[])
```

## IERC1155

_Required interface of an ERC1155 compliant contract, as defined in the
https://eips.ethereum.org/EIPS/eip-1155[EIP].

_Available since v3.1.__

### TransferSingle

```solidity
event TransferSingle(address operator, address from, address to, uint256 id, uint256 value)
```

_Emitted when &#x60;value&#x60; tokens of token type &#x60;id&#x60; are transferred from &#x60;from&#x60; to &#x60;to&#x60; by &#x60;operator&#x60;._

### TransferBatch

```solidity
event TransferBatch(address operator, address from, address to, uint256[] ids, uint256[] values)
```

_Equivalent to multiple {TransferSingle} events, where &#x60;operator&#x60;, &#x60;from&#x60; and &#x60;to&#x60; are the same for all
transfers._

### ApprovalForAll

```solidity
event ApprovalForAll(address account, address operator, bool approved)
```

_Emitted when &#x60;account&#x60; grants or revokes permission to &#x60;operator&#x60; to transfer their tokens, according to
&#x60;approved&#x60;._

### URI

```solidity
event URI(string value, uint256 id)
```

_Emitted when the URI for token type &#x60;id&#x60; changes to &#x60;value&#x60;, if it is a non-programmatic URI.

If an {URI} event was emitted for &#x60;id&#x60;, the standard
https://eips.ethereum.org/EIPS/eip-1155#metadata-extensions[guarantees] that &#x60;value&#x60; will equal the value
returned by {IERC1155MetadataURI-uri}._

### balanceOf

```solidity
function balanceOf(address account, uint256 id) external view returns (uint256)
```

_Returns the amount of tokens of token type &#x60;id&#x60; owned by &#x60;account&#x60;.

Requirements:

- &#x60;account&#x60; cannot be the zero address._

### balanceOfBatch

```solidity
function balanceOfBatch(address[] accounts, uint256[] ids) external view returns (uint256[])
```

_xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {balanceOf}.

Requirements:

- &#x60;accounts&#x60; and &#x60;ids&#x60; must have the same length._

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) external
```

_Grants or revokes permission to &#x60;operator&#x60; to transfer the caller&#x27;s tokens, according to &#x60;approved&#x60;,

Emits an {ApprovalForAll} event.

Requirements:

- &#x60;operator&#x60; cannot be the caller._

### isApprovedForAll

```solidity
function isApprovedForAll(address account, address operator) external view returns (bool)
```

_Returns true if &#x60;operator&#x60; is approved to transfer &#x60;&#x60;account&#x60;&#x60;&#x27;s tokens.

See {setApprovalForAll}._

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) external
```

_Transfers &#x60;amount&#x60; tokens of token type &#x60;id&#x60; from &#x60;from&#x60; to &#x60;to&#x60;.

Emits a {TransferSingle} event.

Requirements:

- &#x60;to&#x60; cannot be the zero address.
- If the caller is not &#x60;from&#x60;, it must be have been approved to spend &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens via {setApprovalForAll}.
- &#x60;from&#x60; must have a balance of tokens of type &#x60;id&#x60; of at least &#x60;amount&#x60;.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
acceptance magic value._

### safeBatchTransferFrom

```solidity
function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data) external
```

_xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {safeTransferFrom}.

Emits a {TransferBatch} event.

Requirements:

- &#x60;ids&#x60; and &#x60;amounts&#x60; must have the same length.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
acceptance magic value._

## IERC1155Receiver

__Available since v3.1.__

### onERC1155Received

```solidity
function onERC1155Received(address operator, address from, uint256 id, uint256 value, bytes data) external returns (bytes4)
```

_Handles the receipt of a single ERC1155 token type. This function is
        called at the end of a &#x60;safeTransferFrom&#x60; after the balance has been updated.
        To accept the transfer, this must return
        &#x60;bytes4(keccak256(&quot;onERC1155Received(address,address,uint256,uint256,bytes)&quot;))&#x60;
        (i.e. 0xf23a6e61, or its own function selector).
        @param operator The address which initiated the transfer (i.e. msg.sender)
        @param from The address which previously owned the token
        @param id The ID of the token being transferred
        @param value The amount of tokens being transferred
        @param data Additional data with no specified format
        @return &#x60;bytes4(keccak256(&quot;onERC1155Received(address,address,uint256,uint256,bytes)&quot;))&#x60; if transfer is allowed_

### onERC1155BatchReceived

```solidity
function onERC1155BatchReceived(address operator, address from, uint256[] ids, uint256[] values, bytes data) external returns (bytes4)
```

_Handles the receipt of a multiple ERC1155 token types. This function
        is called at the end of a &#x60;safeBatchTransferFrom&#x60; after the balances have
        been updated. To accept the transfer(s), this must return
        &#x60;bytes4(keccak256(&quot;onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)&quot;))&#x60;
        (i.e. 0xbc197c81, or its own function selector).
        @param operator The address which initiated the batch transfer (i.e. msg.sender)
        @param from The address which previously owned the token
        @param ids An array containing ids of each token being transferred (order and length must match values array)
        @param values An array containing amounts of each token being transferred (order and length must match ids array)
        @param data Additional data with no specified format
        @return &#x60;bytes4(keccak256(&quot;onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)&quot;))&#x60; if transfer is allowed_

## ERC1155Burnable

_Extension of {ERC1155} that allows token holders to destroy both their
own tokens and those that they have been approved to use.

_Available since v3.1.__

### burn

```solidity
function burn(address account, uint256 id, uint256 value) public virtual
```

### burnBatch

```solidity
function burnBatch(address account, uint256[] ids, uint256[] values) public virtual
```

## ERC1155Pausable

_ERC1155 token with pausable token transfers, minting and burning.

Useful for scenarios such as preventing trades until the end of an evaluation
period, or having an emergency switch for freezing all token transfers in the
event of a large bug.

_Available since v3.1.__

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

_See {ERC1155-_beforeTokenTransfer}.

Requirements:

- the contract must not be paused._

## ERC1155Supply

_Extension of ERC1155 that adds tracking of total supply per id.

Useful for scenarios where Fungible and Non-fungible tokens have to be
clearly identified. Note: While a totalSupply of 1 might mean the
corresponding is an NFT, there is no guarantees that no other token with the
same id are not going to be minted._

### _totalSupply

```solidity
mapping(uint256 &#x3D;&gt; uint256) _totalSupply
```

### totalSupply

```solidity
function totalSupply(uint256 id) public view virtual returns (uint256)
```

_Total amount of tokens in with a given id._

### exists

```solidity
function exists(uint256 id) public view virtual returns (bool)
```

_Indicates weither any token exist with a given id, or not._

### _mint

```solidity
function _mint(address account, uint256 id, uint256 amount, bytes data) internal virtual
```

_See {ERC1155-_mint}._

### _mintBatch

```solidity
function _mintBatch(address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

_See {ERC1155-_mintBatch}._

### _burn

```solidity
function _burn(address account, uint256 id, uint256 amount) internal virtual
```

_See {ERC1155-_burn}._

### _burnBatch

```solidity
function _burnBatch(address account, uint256[] ids, uint256[] amounts) internal virtual
```

_See {ERC1155-_burnBatch}._

## IERC1155MetadataURI

_Interface of the optional ERC1155MetadataExtension interface, as defined
in the https://eips.ethereum.org/EIPS/eip-1155#metadata-extensions[EIP].

_Available since v3.1.__

### uri

```solidity
function uri(uint256 id) external view returns (string)
```

_Returns the URI for token type &#x60;id&#x60;.

If the &#x60;\{id\}&#x60; substring is present in the URI, it must be replaced by
clients with the actual token type ID._

## ERC1155PresetMinterPauser

_{ERC1155} token, including:

 - ability for holders to burn (destroy) their tokens
 - a minter role that allows for token minting (creation)
 - a pauser role that allows to stop all token transfers

This contract uses {AccessControl} to lock permissioned functions using the
different roles - head to its documentation for details.

The account that deploys the contract will be granted the minter and pauser
roles, as well as the default admin role, which will let it grant both minter
and pauser roles to other accounts._

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### PAUSER_ROLE

```solidity
bytes32 PAUSER_ROLE
```

### constructor

```solidity
constructor(string uri) public
```

_Grants &#x60;DEFAULT_ADMIN_ROLE&#x60;, &#x60;MINTER_ROLE&#x60;, and &#x60;PAUSER_ROLE&#x60; to the account that
deploys the contract._

### mint

```solidity
function mint(address to, uint256 id, uint256 amount, bytes data) public virtual
```

_Creates &#x60;amount&#x60; new tokens for &#x60;to&#x60;, of token type &#x60;id&#x60;.

See {ERC1155-_mint}.

Requirements:

- the caller must have the &#x60;MINTER_ROLE&#x60;._

### mintBatch

```solidity
function mintBatch(address to, uint256[] ids, uint256[] amounts, bytes data) public virtual
```

_xref:ROOT:erc1155.adoc#batch-operations[Batched] variant of {mint}._

### pause

```solidity
function pause() public virtual
```

_Pauses all token transfers.

See {ERC1155Pausable} and {Pausable-_pause}.

Requirements:

- the caller must have the &#x60;PAUSER_ROLE&#x60;._

### unpause

```solidity
function unpause() public virtual
```

_Unpauses all token transfers.

See {ERC1155Pausable} and {Pausable-_unpause}.

Requirements:

- the caller must have the &#x60;PAUSER_ROLE&#x60;._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

## ERC1155Holder

__Available since v3.1.__

### onERC1155Received

```solidity
function onERC1155Received(address, address, uint256, uint256, bytes) public virtual returns (bytes4)
```

### onERC1155BatchReceived

```solidity
function onERC1155BatchReceived(address, address, uint256[], uint256[], bytes) public virtual returns (bytes4)
```

## ERC1155Receiver

__Available since v3.1.__

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

## ERC20

_Implementation of the {IERC20} interface.

This implementation is agnostic to the way tokens are created. This means
that a supply mechanism has to be added in a derived contract using {_mint}.
For a generic mechanism see {ERC20PresetMinterPauser}.

TIP: For a detailed writeup see our guide
https://forum.zeppelin.solutions/t/how-to-implement-erc20-supply-mechanisms/226[How
to implement supply mechanisms].

We have followed general OpenZeppelin Contracts guidelines: functions revert
instead returning &#x60;false&#x60; on failure. This behavior is nonetheless
conventional and does not conflict with the expectations of ERC20
applications.

Additionally, an {Approval} event is emitted on calls to {transferFrom}.
This allows applications to reconstruct the allowance for all accounts just
by listening to said events. Other implementations of the EIP may not emit
these events, as it isn&#x27;t required by the specification.

Finally, the non-standard {decreaseAllowance} and {increaseAllowance}
functions have been added to mitigate the well-known issues around setting
allowances. See {IERC20-approve}._

### _balances

```solidity
mapping(address &#x3D;&gt; uint256) _balances
```

### _allowances

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) _allowances
```

### _totalSupply

```solidity
uint256 _totalSupply
```

### _name

```solidity
string _name
```

### _symbol

```solidity
string _symbol
```

### constructor

```solidity
constructor(string name_, string symbol_) public
```

_Sets the values for {name} and {symbol}.

The default value of {decimals} is 18. To select a different value for
{decimals} you should overload it.

All two of these values are immutable: they can only be set once during
construction._

### name

```solidity
function name() public view virtual returns (string)
```

_Returns the name of the token._

### symbol

```solidity
function symbol() public view virtual returns (string)
```

_Returns the symbol of the token, usually a shorter version of the
name._

### decimals

```solidity
function decimals() public view virtual returns (uint8)
```

_Returns the number of decimals used to get its user representation.
For example, if &#x60;decimals&#x60; equals &#x60;2&#x60;, a balance of &#x60;505&#x60; tokens should
be displayed to a user as &#x60;5.05&#x60; (&#x60;505 / 10 ** 2&#x60;).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless this function is
overridden;

NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}._

### totalSupply

```solidity
function totalSupply() public view virtual returns (uint256)
```

_See {IERC20-totalSupply}._

### balanceOf

```solidity
function balanceOf(address account) public view virtual returns (uint256)
```

_See {IERC20-balanceOf}._

### transfer

```solidity
function transfer(address recipient, uint256 amount) public virtual returns (bool)
```

_See {IERC20-transfer}.

Requirements:

- &#x60;recipient&#x60; cannot be the zero address.
- the caller must have a balance of at least &#x60;amount&#x60;._

### allowance

```solidity
function allowance(address owner, address spender) public view virtual returns (uint256)
```

_See {IERC20-allowance}._

### approve

```solidity
function approve(address spender, uint256 amount) public virtual returns (bool)
```

_See {IERC20-approve}.

Requirements:

- &#x60;spender&#x60; cannot be the zero address._

### transferFrom

```solidity
function transferFrom(address sender, address recipient, uint256 amount) public virtual returns (bool)
```

_See {IERC20-transferFrom}.

Emits an {Approval} event indicating the updated allowance. This is not
required by the EIP. See the note at the beginning of {ERC20}.

Requirements:

- &#x60;sender&#x60; and &#x60;recipient&#x60; cannot be the zero address.
- &#x60;sender&#x60; must have a balance of at least &#x60;amount&#x60;.
- the caller must have allowance for &#x60;&#x60;sender&#x60;&#x60;&#x27;s tokens of at least
&#x60;amount&#x60;._

### increaseAllowance

```solidity
function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool)
```

_Atomically increases the allowance granted to &#x60;spender&#x60; by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- &#x60;spender&#x60; cannot be the zero address._

### decreaseAllowance

```solidity
function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool)
```

_Atomically decreases the allowance granted to &#x60;spender&#x60; by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- &#x60;spender&#x60; cannot be the zero address.
- &#x60;spender&#x60; must have allowance for the caller of at least
&#x60;subtractedValue&#x60;._

### _transfer

```solidity
function _transfer(address sender, address recipient, uint256 amount) internal virtual
```

_Moves &#x60;amount&#x60; of tokens from &#x60;sender&#x60; to &#x60;recipient&#x60;.

This internal function is equivalent to {transfer}, and can be used to
e.g. implement automatic token fees, slashing mechanisms, etc.

Emits a {Transfer} event.

Requirements:

- &#x60;sender&#x60; cannot be the zero address.
- &#x60;recipient&#x60; cannot be the zero address.
- &#x60;sender&#x60; must have a balance of at least &#x60;amount&#x60;._

### _mint

```solidity
function _mint(address account, uint256 amount) internal virtual
```

_Creates &#x60;amount&#x60; tokens and assigns them to &#x60;account&#x60;, increasing
the total supply.

Emits a {Transfer} event with &#x60;from&#x60; set to the zero address.

Requirements:

- &#x60;account&#x60; cannot be the zero address._

### _burn

```solidity
function _burn(address account, uint256 amount) internal virtual
```

_Destroys &#x60;amount&#x60; tokens from &#x60;account&#x60;, reducing the
total supply.

Emits a {Transfer} event with &#x60;to&#x60; set to the zero address.

Requirements:

- &#x60;account&#x60; cannot be the zero address.
- &#x60;account&#x60; must have at least &#x60;amount&#x60; tokens._

### _approve

```solidity
function _approve(address owner, address spender, uint256 amount) internal virtual
```

_Sets &#x60;amount&#x60; as the allowance of &#x60;spender&#x60; over the &#x60;owner&#x60; s tokens.

This internal function is equivalent to &#x60;approve&#x60;, and can be used to
e.g. set automatic allowances for certain subsystems, etc.

Emits an {Approval} event.

Requirements:

- &#x60;owner&#x60; cannot be the zero address.
- &#x60;spender&#x60; cannot be the zero address._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Hook that is called before any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when &#x60;from&#x60; and &#x60;to&#x60; are both non-zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens
will be transferred to &#x60;to&#x60;.
- when &#x60;from&#x60; is zero, &#x60;amount&#x60; tokens will be minted for &#x60;to&#x60;.
- when &#x60;to&#x60; is zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens will be burned.
- &#x60;from&#x60; and &#x60;to&#x60; are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### _afterTokenTransfer

```solidity
function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Hook that is called after any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when &#x60;from&#x60; and &#x60;to&#x60; are both non-zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens
has been transferred to &#x60;to&#x60;.
- when &#x60;from&#x60; is zero, &#x60;amount&#x60; tokens have been minted for &#x60;to&#x60;.
- when &#x60;to&#x60; is zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens have been burned.
- &#x60;from&#x60; and &#x60;to&#x60; are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

## IERC20

_Interface of the ERC20 standard as defined in the EIP._

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

_Returns the amount of tokens in existence._

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```

_Returns the amount of tokens owned by &#x60;account&#x60;._

### transfer

```solidity
function transfer(address recipient, uint256 amount) external returns (bool)
```

_Moves &#x60;amount&#x60; tokens from the caller&#x27;s account to &#x60;recipient&#x60;.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```

_Returns the remaining number of tokens that &#x60;spender&#x60; will be
allowed to spend on behalf of &#x60;owner&#x60; through {transferFrom}. This is
zero by default.

This value changes when {approve} or {transferFrom} are called._

### approve

```solidity
function approve(address spender, uint256 amount) external returns (bool)
```

_Sets &#x60;amount&#x60; as the allowance of &#x60;spender&#x60; over the caller&#x27;s tokens.

Returns a boolean value indicating whether the operation succeeded.

IMPORTANT: Beware that changing an allowance with this method brings the risk
that someone may use both the old and the new allowance by unfortunate
transaction ordering. One possible solution to mitigate this race
condition is to first reduce the spender&#x27;s allowance to 0 and set the
desired value afterwards:
https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

Emits an {Approval} event._

### transferFrom

```solidity
function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)
```

_Moves &#x60;amount&#x60; tokens from &#x60;sender&#x60; to &#x60;recipient&#x60; using the
allowance mechanism. &#x60;amount&#x60; is then deducted from the caller&#x27;s
allowance.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### Transfer

```solidity
event Transfer(address from, address to, uint256 value)
```

_Emitted when &#x60;value&#x60; tokens are moved from one account (&#x60;from&#x60;) to
another (&#x60;to&#x60;).

Note that &#x60;value&#x60; may be zero._

### Approval

```solidity
event Approval(address owner, address spender, uint256 value)
```

_Emitted when the allowance of a &#x60;spender&#x60; for an &#x60;owner&#x60; is set by
a call to {approve}. &#x60;value&#x60; is the new allowance._

## ERC20Burnable

_Extension of {ERC20} that allows token holders to destroy both their own
tokens and those that they have an allowance for, in a way that can be
recognized off-chain (via event analysis)._

### burn

```solidity
function burn(uint256 amount) public virtual
```

_Destroys &#x60;amount&#x60; tokens from the caller.

See {ERC20-_burn}._

### burnFrom

```solidity
function burnFrom(address account, uint256 amount) public virtual
```

_Destroys &#x60;amount&#x60; tokens from &#x60;account&#x60;, deducting from the caller&#x27;s
allowance.

See {ERC20-_burn} and {ERC20-allowance}.

Requirements:

- the caller must have allowance for &#x60;&#x60;accounts&#x60;&#x60;&#x27;s tokens of at least
&#x60;amount&#x60;._

## ERC20Capped

_Extension of {ERC20} that adds a cap to the supply of tokens._

### _cap

```solidity
uint256 _cap
```

### constructor

```solidity
constructor(uint256 cap_) internal
```

_Sets the value of the &#x60;cap&#x60;. This value is immutable, it can only be
set once during construction._

### cap

```solidity
function cap() public view virtual returns (uint256)
```

_Returns the cap on the token&#x27;s total supply._

### _mint

```solidity
function _mint(address account, uint256 amount) internal virtual
```

_See {ERC20-_mint}._

## ERC20FlashMint

_Implementation of the ERC3156 Flash loans extension, as defined in
https://eips.ethereum.org/EIPS/eip-3156[ERC-3156].

Adds the {flashLoan} method, which provides flash loan support at the token
level. By default there is no fee, but this can be changed by overriding {flashFee}.

_Available since v4.1.__

### _RETURN_VALUE

```solidity
bytes32 _RETURN_VALUE
```

### maxFlashLoan

```solidity
function maxFlashLoan(address token) public view returns (uint256)
```

_Returns the maximum amount of tokens available for loan._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The address of the token that is requested. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amont of token that can be loaned. |

### flashFee

```solidity
function flashFee(address token, uint256 amount) public view virtual returns (uint256)
```

_Returns the fee applied when doing flash loans. By default this
implementation has 0 fees. This function can be overloaded to make
the flash loan mechanism deflationary._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The token to be flash loaned. |
| amount | uint256 | The amount of tokens to be loaned. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The fees applied to the corresponding flash loan. |

### flashLoan

```solidity
function flashLoan(contract IERC3156FlashBorrower receiver, address token, uint256 amount, bytes data) public virtual returns (bool)
```

_Performs a flash loan. New tokens are minted and sent to the
&#x60;receiver&#x60;, who is required to implement the {IERC3156FlashBorrower}
interface. By the end of the flash loan, the receiver is expected to own
amount + fee tokens and have them approved back to the token contract itself so
they can be burned._

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | contract IERC3156FlashBorrower | The receiver of the flash loan. Should implement the {IERC3156FlashBorrower.onFlashLoan} interface. |
| token | address | The token to be flash loaned. Only &#x60;address(this)&#x60; is supported. |
| amount | uint256 | The amount of tokens to be loaned. |
| data | bytes | An arbitrary datafield that is passed to the receiver. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | &#x60;true&#x60; is the flash loan was successful. |

## ERC20Pausable

_ERC20 token with pausable token transfers, minting and burning.

Useful for scenarios such as preventing trades until the end of an evaluation
period, or having an emergency switch for freezing all token transfers in the
event of a large bug._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_See {ERC20-_beforeTokenTransfer}.

Requirements:

- the contract must not be paused._

## ERC20Snapshot

_This contract extends an ERC20 token with a snapshot mechanism. When a snapshot is created, the balances and
total supply at the time are recorded for later access.

This can be used to safely create mechanisms based on token balances such as trustless dividends or weighted voting.
In naive implementations it&#x27;s possible to perform a &quot;double spend&quot; attack by reusing the same balance from different
accounts. By using snapshots to calculate dividends or voting power, those attacks no longer apply. It can also be
used to create an efficient ERC20 forking mechanism.

Snapshots are created by the internal {_snapshot} function, which will emit the {Snapshot} event and return a
snapshot id. To get the total supply at the time of a snapshot, call the function {totalSupplyAt} with the snapshot
id. To get the balance of an account at the time of a snapshot, call the {balanceOfAt} function with the snapshot id
and the account address.

NOTE: Snapshot policy can be customized by overriding the {_getCurrentSnapshotId} method. For example, having it
return &#x60;block.number&#x60; will trigger the creation of snapshot at the begining of each new block. When overridding this
function, be careful about the monotonicity of its result. Non-monotonic snapshot ids will break the contract.

Implementing snapshots for every block using this method will incur significant gas costs. For a gas-efficient
alternative consider {ERC20Votes}.

&#x3D;&#x3D;&#x3D;&#x3D; Gas Costs

Snapshots are efficient. Snapshot creation is _O(1)_. Retrieval of balances or total supply from a snapshot is _O(log
n)_ in the number of snapshots that have been created, although _n_ for a specific account will generally be much
smaller since identical balances in subsequent snapshots are stored as a single entry.

There is a constant overhead for normal ERC20 transfers due to the additional snapshot bookkeeping. This overhead is
only significant for the first transfer that immediately follows a snapshot for a particular account. Subsequent
transfers will have normal cost until the next snapshot, and so on._

### Snapshots

```solidity
struct Snapshots {
  uint256[] ids;
  uint256[] values;
}
```

### _accountBalanceSnapshots

```solidity
mapping(address &#x3D;&gt; struct ERC20Snapshot.Snapshots) _accountBalanceSnapshots
```

### _totalSupplySnapshots

```solidity
struct ERC20Snapshot.Snapshots _totalSupplySnapshots
```

### _currentSnapshotId

```solidity
struct Counters.Counter _currentSnapshotId
```

### Snapshot

```solidity
event Snapshot(uint256 id)
```

_Emitted by {_snapshot} when a snapshot identified by &#x60;id&#x60; is created._

### _snapshot

```solidity
function _snapshot() internal virtual returns (uint256)
```

_Creates a new snapshot and returns its snapshot id.

Emits a {Snapshot} event that contains the same id.

{_snapshot} is &#x60;internal&#x60; and you have to decide how to expose it externally. Its usage may be restricted to a
set of accounts, for example using {AccessControl}, or it may be open to the public.

[WARNING]
&#x3D;&#x3D;&#x3D;&#x3D;
While an open way of calling {_snapshot} is required for certain trust minimization mechanisms such as forking,
you must consider that it can potentially be used by attackers in two ways.

First, it can be used to increase the cost of retrieval of values from snapshots, although it will grow
logarithmically thus rendering this attack ineffective in the long term. Second, it can be used to target
specific accounts and increase the cost of ERC20 transfers for them, in the ways specified in the Gas Costs
section above.

We haven&#x27;t measured the actual numbers; if this is something you&#x27;re interested in please reach out to us.
&#x3D;&#x3D;&#x3D;&#x3D;_

### _getCurrentSnapshotId

```solidity
function _getCurrentSnapshotId() internal view virtual returns (uint256)
```

_Get the current snapshotId_

### balanceOfAt

```solidity
function balanceOfAt(address account, uint256 snapshotId) public view virtual returns (uint256)
```

_Retrieves the balance of &#x60;account&#x60; at the time &#x60;snapshotId&#x60; was created._

### totalSupplyAt

```solidity
function totalSupplyAt(uint256 snapshotId) public view virtual returns (uint256)
```

_Retrieves the total supply at the time &#x60;snapshotId&#x60; was created._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Hook that is called before any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when &#x60;from&#x60; and &#x60;to&#x60; are both non-zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens
will be transferred to &#x60;to&#x60;.
- when &#x60;from&#x60; is zero, &#x60;amount&#x60; tokens will be minted for &#x60;to&#x60;.
- when &#x60;to&#x60; is zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens will be burned.
- &#x60;from&#x60; and &#x60;to&#x60; are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### _valueAt

```solidity
function _valueAt(uint256 snapshotId, struct ERC20Snapshot.Snapshots snapshots) private view returns (bool, uint256)
```

### _updateAccountSnapshot

```solidity
function _updateAccountSnapshot(address account) private
```

### _updateTotalSupplySnapshot

```solidity
function _updateTotalSupplySnapshot() private
```

### _updateSnapshot

```solidity
function _updateSnapshot(struct ERC20Snapshot.Snapshots snapshots, uint256 currentValue) private
```

### _lastSnapshotId

```solidity
function _lastSnapshotId(uint256[] ids) private view returns (uint256)
```

## ERC20Votes

_Extension of ERC20 to support Compound-like voting and delegation. This version is more generic than Compound&#x27;s,
and supports token supply up to 2^224^ - 1, while COMP is limited to 2^96^ - 1.

NOTE: If exact COMP compatibility is required, use the {ERC20VotesComp} variant of this module.

This extension keeps a history (checkpoints) of each account&#x27;s vote power. Vote power can be delegated either
by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}. Voting
power can be queried through the public accessors {getVotes} and {getPastVotes}.

By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it
requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked.
Enabling self-delegation can easily be done by overriding the {delegates} function. Keep in mind however that this
will significantly increase the base gas cost of transfers.

_Available since v4.2.__

### Checkpoint

```solidity
struct Checkpoint {
  uint32 fromBlock;
  uint224 votes;
}
```

### _DELEGATION_TYPEHASH

```solidity
bytes32 _DELEGATION_TYPEHASH
```

### _delegates

```solidity
mapping(address &#x3D;&gt; address) _delegates
```

### _checkpoints

```solidity
mapping(address &#x3D;&gt; struct ERC20Votes.Checkpoint[]) _checkpoints
```

### _totalSupplyCheckpoints

```solidity
struct ERC20Votes.Checkpoint[] _totalSupplyCheckpoints
```

### DelegateChanged

```solidity
event DelegateChanged(address delegator, address fromDelegate, address toDelegate)
```

_Emitted when an account changes their delegate._

### DelegateVotesChanged

```solidity
event DelegateVotesChanged(address delegate, uint256 previousBalance, uint256 newBalance)
```

_Emitted when a token transfer or delegate change results in changes to an account&#x27;s voting power._

### checkpoints

```solidity
function checkpoints(address account, uint32 pos) public view virtual returns (struct ERC20Votes.Checkpoint)
```

_Get the &#x60;pos&#x60;-th checkpoint for &#x60;account&#x60;._

### numCheckpoints

```solidity
function numCheckpoints(address account) public view virtual returns (uint32)
```

_Get number of checkpoints for &#x60;account&#x60;._

### delegates

```solidity
function delegates(address account) public view virtual returns (address)
```

_Get the address &#x60;account&#x60; is currently delegating to._

### getVotes

```solidity
function getVotes(address account) public view returns (uint256)
```

_Gets the current votes balance for &#x60;account&#x60;_

### getPastVotes

```solidity
function getPastVotes(address account, uint256 blockNumber) public view returns (uint256)
```

_Retrieve the number of votes for &#x60;account&#x60; at the end of &#x60;blockNumber&#x60;.

Requirements:

- &#x60;blockNumber&#x60; must have been already mined_

### getPastTotalSupply

```solidity
function getPastTotalSupply(uint256 blockNumber) public view returns (uint256)
```

_Retrieve the &#x60;totalSupply&#x60; at the end of &#x60;blockNumber&#x60;. Note, this value is the sum of all balances.
It is but NOT the sum of all the delegated votes!

Requirements:

- &#x60;blockNumber&#x60; must have been already mined_

### _checkpointsLookup

```solidity
function _checkpointsLookup(struct ERC20Votes.Checkpoint[] ckpts, uint256 blockNumber) private view returns (uint256)
```

_Lookup a value in a list of (sorted) checkpoints._

### delegate

```solidity
function delegate(address delegatee) public virtual
```

_Delegate votes from the sender to &#x60;delegatee&#x60;._

### delegateBySig

```solidity
function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) public virtual
```

_Delegates votes from signer to &#x60;delegatee&#x60;_

### _maxSupply

```solidity
function _maxSupply() internal view virtual returns (uint224)
```

_Maximum token supply. Defaults to &#x60;type(uint224).max&#x60; (2^224^ - 1)._

### _mint

```solidity
function _mint(address account, uint256 amount) internal virtual
```

_Snapshots the totalSupply after it has been increased._

### _burn

```solidity
function _burn(address account, uint256 amount) internal virtual
```

_Snapshots the totalSupply after it has been decreased._

### _afterTokenTransfer

```solidity
function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Move voting power when tokens are transferred.

Emits a {DelegateVotesChanged} event._

### _delegate

```solidity
function _delegate(address delegator, address delegatee) internal virtual
```

_Change delegation for &#x60;delegator&#x60; to &#x60;delegatee&#x60;.

Emits events {DelegateChanged} and {DelegateVotesChanged}._

### _moveVotingPower

```solidity
function _moveVotingPower(address src, address dst, uint256 amount) private
```

### _writeCheckpoint

```solidity
function _writeCheckpoint(struct ERC20Votes.Checkpoint[] ckpts, function (uint256,uint256) view returns (uint256) op, uint256 delta) private returns (uint256 oldWeight, uint256 newWeight)
```

### _add

```solidity
function _add(uint256 a, uint256 b) private pure returns (uint256)
```

### _subtract

```solidity
function _subtract(uint256 a, uint256 b) private pure returns (uint256)
```

## ERC20VotesComp

_Extension of ERC20 to support Compound&#x27;s voting and delegation. This version exactly matches Compound&#x27;s
interface, with the drawback of only supporting supply up to (2^96^ - 1).

NOTE: You should use this contract if you need exact compatibility with COMP (for example in order to use your token
with Governor Alpha or Bravo) and if you are sure the supply cap of 2^96^ is enough for you. Otherwise, use the
{ERC20Votes} variant of this module.

This extension keeps a history (checkpoints) of each account&#x27;s vote power. Vote power can be delegated either
by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}. Voting
power can be queried through the public accessors {getCurrentVotes} and {getPriorVotes}.

By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it
requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked.
Enabling self-delegation can easily be done by overriding the {delegates} function. Keep in mind however that this
will significantly increase the base gas cost of transfers.

_Available since v4.2.__

### getCurrentVotes

```solidity
function getCurrentVotes(address account) external view returns (uint96)
```

_Comp version of the {getVotes} accessor, with &#x60;uint96&#x60; return type._

### getPriorVotes

```solidity
function getPriorVotes(address account, uint256 blockNumber) external view returns (uint96)
```

_Comp version of the {getPastVotes} accessor, with &#x60;uint96&#x60; return type._

### _maxSupply

```solidity
function _maxSupply() internal view virtual returns (uint224)
```

_Maximum token supply. Reduced to &#x60;type(uint96).max&#x60; (2^96^ - 1) to fit COMP interface._

## ERC20Wrapper

_Extension of the ERC20 token contract to support token wrapping.

Users can deposit and withdraw &quot;underlying tokens&quot; and receive a matching number of &quot;wrapped tokens&quot;. This is useful
in conjunction with other modules. For example, combining this wrapping mechanism with {ERC20Votes} will allow the
wrapping of an existing &quot;basic&quot; ERC20 into a governance token.

_Available since v4.2.__

### underlying

```solidity
contract IERC20 underlying
```

### constructor

```solidity
constructor(contract IERC20 underlyingToken) internal
```

### depositFor

```solidity
function depositFor(address account, uint256 amount) public virtual returns (bool)
```

_Allow a user to deposit underlying tokens and mint the corresponding number of wrapped tokens._

### withdrawTo

```solidity
function withdrawTo(address account, uint256 amount) public virtual returns (bool)
```

_Allow a user to burn a number of wrapped tokens and withdraw the corresponding number of underlying tokens._

### _recover

```solidity
function _recover(address account) internal virtual returns (uint256)
```

_Mint wrapped token to cover any underlyingTokens that would have been transfered by mistake. Internal
function that can be exposed with access control if desired._

## IERC20Metadata

_Interface for the optional metadata functions from the ERC20 standard.

_Available since v4.1.__

### name

```solidity
function name() external view returns (string)
```

_Returns the name of the token._

### symbol

```solidity
function symbol() external view returns (string)
```

_Returns the symbol of the token._

### decimals

```solidity
function decimals() external view returns (uint8)
```

_Returns the decimals places of the token._

## ERC20Permit

_Implementation of the ERC20 Permit extension allowing approvals to be made via signatures, as defined in
https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].

Adds the {permit} method, which can be used to change an account&#x27;s ERC20 allowance (see {IERC20-allowance}) by
presenting a message signed by the account. By not relying on &#x60;{IERC20-approve}&#x60;, the token holder account doesn&#x27;t
need to send a transaction, and thus is not required to hold Ether at all.

_Available since v3.4.__

### _nonces

```solidity
mapping(address &#x3D;&gt; struct Counters.Counter) _nonces
```

### _PERMIT_TYPEHASH

```solidity
bytes32 _PERMIT_TYPEHASH
```

### constructor

```solidity
constructor(string name) internal
```

_Initializes the {EIP712} domain separator using the &#x60;name&#x60; parameter, and setting &#x60;version&#x60; to &#x60;&quot;1&quot;&#x60;.

It&#x27;s a good idea to use the same &#x60;name&#x60; that is defined as the ERC20 token name._

### permit

```solidity
function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public virtual
```

_See {IERC20Permit-permit}._

### nonces

```solidity
function nonces(address owner) public view virtual returns (uint256)
```

_See {IERC20Permit-nonces}._

### DOMAIN_SEPARATOR

```solidity
function DOMAIN_SEPARATOR() external view returns (bytes32)
```

_See {IERC20Permit-DOMAIN_SEPARATOR}._

### _useNonce

```solidity
function _useNonce(address owner) internal virtual returns (uint256 current)
```

_&quot;Consume a nonce&quot;: return the current value and increment.

_Available since v4.1.__

## IERC20Permit

_Interface of the ERC20 Permit extension allowing approvals to be made via signatures, as defined in
https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].

Adds the {permit} method, which can be used to change an account&#x27;s ERC20 allowance (see {IERC20-allowance}) by
presenting a message signed by the account. By not relying on {IERC20-approve}, the token holder account doesn&#x27;t
need to send a transaction, and thus is not required to hold Ether at all._

### permit

```solidity
function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external
```

_Sets &#x60;value&#x60; as the allowance of &#x60;spender&#x60; over &#x60;&#x60;owner&#x60;&#x60;&#x27;s tokens,
given &#x60;&#x60;owner&#x60;&#x60;&#x27;s signed approval.

IMPORTANT: The same issues {IERC20-approve} has related to transaction
ordering also apply here.

Emits an {Approval} event.

Requirements:

- &#x60;spender&#x60; cannot be the zero address.
- &#x60;deadline&#x60; must be a timestamp in the future.
- &#x60;v&#x60;, &#x60;r&#x60; and &#x60;s&#x60; must be a valid &#x60;secp256k1&#x60; signature from &#x60;owner&#x60;
over the EIP712-formatted function arguments.
- the signature must use &#x60;&#x60;owner&#x60;&#x60;&#x27;s current nonce (see {nonces}).

For more information on the signature format, see the
https://eips.ethereum.org/EIPS/eip-2612#specification[relevant EIP
section]._

### nonces

```solidity
function nonces(address owner) external view returns (uint256)
```

_Returns the current nonce for &#x60;owner&#x60;. This value must be
included whenever a signature is generated for {permit}.

Every successful call to {permit} increases &#x60;&#x60;owner&#x60;&#x60;&#x27;s nonce by one. This
prevents a signature from being used multiple times._

### DOMAIN_SEPARATOR

```solidity
function DOMAIN_SEPARATOR() external view returns (bytes32)
```

_Returns the domain separator used in the encoding of the signature for {permit}, as defined by {EIP712}._

## ERC20PresetFixedSupply

_{ERC20} token, including:

 - Preminted initial supply
 - Ability for holders to burn (destroy) their tokens
 - No access control mechanism (for minting/pausing) and hence no governance

This contract uses {ERC20Burnable} to include burn capabilities - head to
its documentation for details.

_Available since v3.4.__

### constructor

```solidity
constructor(string name, string symbol, uint256 initialSupply, address owner) public
```

_Mints &#x60;initialSupply&#x60; amount of token and transfers them to &#x60;owner&#x60;.

See {ERC20-constructor}._

## ERC20PresetMinterPauser

_{ERC20} token, including:

 - ability for holders to burn (destroy) their tokens
 - a minter role that allows for token minting (creation)
 - a pauser role that allows to stop all token transfers

This contract uses {AccessControl} to lock permissioned functions using the
different roles - head to its documentation for details.

The account that deploys the contract will be granted the minter and pauser
roles, as well as the default admin role, which will let it grant both minter
and pauser roles to other accounts._

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### PAUSER_ROLE

```solidity
bytes32 PAUSER_ROLE
```

### constructor

```solidity
constructor(string name, string symbol) public
```

_Grants &#x60;DEFAULT_ADMIN_ROLE&#x60;, &#x60;MINTER_ROLE&#x60; and &#x60;PAUSER_ROLE&#x60; to the
account that deploys the contract.

See {ERC20-constructor}._

### mint

```solidity
function mint(address to, uint256 amount) public virtual
```

_Creates &#x60;amount&#x60; new tokens for &#x60;to&#x60;.

See {ERC20-_mint}.

Requirements:

- the caller must have the &#x60;MINTER_ROLE&#x60;._

### pause

```solidity
function pause() public virtual
```

_Pauses all token transfers.

See {ERC20Pausable} and {Pausable-_pause}.

Requirements:

- the caller must have the &#x60;PAUSER_ROLE&#x60;._

### unpause

```solidity
function unpause() public virtual
```

_Unpauses all token transfers.

See {ERC20Pausable} and {Pausable-_unpause}.

Requirements:

- the caller must have the &#x60;PAUSER_ROLE&#x60;._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual
```

## SafeERC20

_Wrappers around ERC20 operations that throw on failure (when the token
contract returns false). Tokens that return no value (and instead revert or
throw on failure) are also supported, non-reverting calls are assumed to be
successful.
To use this library you can add a &#x60;using SafeERC20 for IERC20;&#x60; statement to your contract,
which allows you to call the safe operations as &#x60;token.safeTransfer(...)&#x60;, etc._

### safeTransfer

```solidity
function safeTransfer(contract IERC20 token, address to, uint256 value) internal
```

### safeTransferFrom

```solidity
function safeTransferFrom(contract IERC20 token, address from, address to, uint256 value) internal
```

### safeApprove

```solidity
function safeApprove(contract IERC20 token, address spender, uint256 value) internal
```

_Deprecated. This function has issues similar to the ones found in
{IERC20-approve}, and its usage is discouraged.

Whenever possible, use {safeIncreaseAllowance} and
{safeDecreaseAllowance} instead._

### safeIncreaseAllowance

```solidity
function safeIncreaseAllowance(contract IERC20 token, address spender, uint256 value) internal
```

### safeDecreaseAllowance

```solidity
function safeDecreaseAllowance(contract IERC20 token, address spender, uint256 value) internal
```

### _callOptionalReturn

```solidity
function _callOptionalReturn(contract IERC20 token, bytes data) private
```

_Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
on the return value: the return value is optional (but if data is returned, it must not be false)._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | contract IERC20 | The token targeted by the call. |
| data | bytes | The call data (encoded using abi.encode or one of its variants). |

## TokenTimelock

_A token holder contract that will allow a beneficiary to extract the
tokens after a given release time.

Useful for simple vesting schedules like &quot;advisors get all of their tokens
after 1 year&quot;._

### _token

```solidity
contract IERC20 _token
```

### _beneficiary

```solidity
address _beneficiary
```

### _releaseTime

```solidity
uint256 _releaseTime
```

### constructor

```solidity
constructor(contract IERC20 token_, address beneficiary_, uint256 releaseTime_) public
```

### token

```solidity
function token() public view virtual returns (contract IERC20)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IERC20 | the token being held. |

### beneficiary

```solidity
function beneficiary() public view virtual returns (address)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | the beneficiary of the tokens. |

### releaseTime

```solidity
function releaseTime() public view virtual returns (uint256)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the time when the tokens are released. |

### release

```solidity
function release() public virtual
```

Transfers tokens held by timelock to beneficiary.

## ERC721

_Implementation of https://eips.ethereum.org/EIPS/eip-721[ERC721] Non-Fungible Token Standard, including
the Metadata extension, but not including the Enumerable extension, which is available separately as
{ERC721Enumerable}._

### _name

```solidity
string _name
```

### _symbol

```solidity
string _symbol
```

### _owners

```solidity
mapping(uint256 &#x3D;&gt; address) _owners
```

### _balances

```solidity
mapping(address &#x3D;&gt; uint256) _balances
```

### _tokenApprovals

```solidity
mapping(uint256 &#x3D;&gt; address) _tokenApprovals
```

### _operatorApprovals

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; bool)) _operatorApprovals
```

### constructor

```solidity
constructor(string name_, string symbol_) public
```

_Initializes the contract by setting a &#x60;name&#x60; and a &#x60;symbol&#x60; to the token collection._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### balanceOf

```solidity
function balanceOf(address owner) public view virtual returns (uint256)
```

_See {IERC721-balanceOf}._

### ownerOf

```solidity
function ownerOf(uint256 tokenId) public view virtual returns (address)
```

_See {IERC721-ownerOf}._

### name

```solidity
function name() public view virtual returns (string)
```

_See {IERC721Metadata-name}._

### symbol

```solidity
function symbol() public view virtual returns (string)
```

_See {IERC721Metadata-symbol}._

### tokenURI

```solidity
function tokenURI(uint256 tokenId) public view virtual returns (string)
```

_See {IERC721Metadata-tokenURI}._

### _baseURI

```solidity
function _baseURI() internal view virtual returns (string)
```

_Base URI for computing {tokenURI}. If set, the resulting URI for each
token will be the concatenation of the &#x60;baseURI&#x60; and the &#x60;tokenId&#x60;. Empty
by default, can be overriden in child contracts._

### approve

```solidity
function approve(address to, uint256 tokenId) public virtual
```

_See {IERC721-approve}._

### getApproved

```solidity
function getApproved(uint256 tokenId) public view virtual returns (address)
```

_See {IERC721-getApproved}._

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) public virtual
```

_See {IERC721-setApprovalForAll}._

### isApprovedForAll

```solidity
function isApprovedForAll(address owner, address operator) public view virtual returns (bool)
```

_See {IERC721-isApprovedForAll}._

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 tokenId) public virtual
```

_See {IERC721-transferFrom}._

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId) public virtual
```

_See {IERC721-safeTransferFrom}._

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data) public virtual
```

_See {IERC721-safeTransferFrom}._

### _safeTransfer

```solidity
function _safeTransfer(address from, address to, uint256 tokenId, bytes _data) internal virtual
```

_Safely transfers &#x60;tokenId&#x60; token from &#x60;from&#x60; to &#x60;to&#x60;, checking first that contract recipients
are aware of the ERC721 protocol to prevent tokens from being forever locked.

&#x60;_data&#x60; is additional data, it has no specified format and it is sent in call to &#x60;to&#x60;.

This internal function is equivalent to {safeTransferFrom}, and can be used to e.g.
implement alternative mechanisms to perform token transfer, such as signature-based.

Requirements:

- &#x60;from&#x60; cannot be the zero address.
- &#x60;to&#x60; cannot be the zero address.
- &#x60;tokenId&#x60; token must exist and be owned by &#x60;from&#x60;.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.

Emits a {Transfer} event._

### _exists

```solidity
function _exists(uint256 tokenId) internal view virtual returns (bool)
```

_Returns whether &#x60;tokenId&#x60; exists.

Tokens can be managed by their owner or approved accounts via {approve} or {setApprovalForAll}.

Tokens start existing when they are minted (&#x60;_mint&#x60;),
and stop existing when they are burned (&#x60;_burn&#x60;)._

### _isApprovedOrOwner

```solidity
function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool)
```

_Returns whether &#x60;spender&#x60; is allowed to manage &#x60;tokenId&#x60;.

Requirements:

- &#x60;tokenId&#x60; must exist._

### _safeMint

```solidity
function _safeMint(address to, uint256 tokenId) internal virtual
```

_Safely mints &#x60;tokenId&#x60; and transfers it to &#x60;to&#x60;.

Requirements:

- &#x60;tokenId&#x60; must not exist.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.

Emits a {Transfer} event._

### _safeMint

```solidity
function _safeMint(address to, uint256 tokenId, bytes _data) internal virtual
```

_Same as {xref-ERC721-_safeMint-address-uint256-}[&#x60;_safeMint&#x60;], with an additional &#x60;data&#x60; parameter which is
forwarded in {IERC721Receiver-onERC721Received} to contract recipients._

### _mint

```solidity
function _mint(address to, uint256 tokenId) internal virtual
```

_Mints &#x60;tokenId&#x60; and transfers it to &#x60;to&#x60;.

WARNING: Usage of this method is discouraged, use {_safeMint} whenever possible

Requirements:

- &#x60;tokenId&#x60; must not exist.
- &#x60;to&#x60; cannot be the zero address.

Emits a {Transfer} event._

### _burn

```solidity
function _burn(uint256 tokenId) internal virtual
```

_Destroys &#x60;tokenId&#x60;.
The approval is cleared when the token is burned.

Requirements:

- &#x60;tokenId&#x60; must exist.

Emits a {Transfer} event._

### _transfer

```solidity
function _transfer(address from, address to, uint256 tokenId) internal virtual
```

_Transfers &#x60;tokenId&#x60; from &#x60;from&#x60; to &#x60;to&#x60;.
 As opposed to {transferFrom}, this imposes no restrictions on msg.sender.

Requirements:

- &#x60;to&#x60; cannot be the zero address.
- &#x60;tokenId&#x60; token must be owned by &#x60;from&#x60;.

Emits a {Transfer} event._

### _approve

```solidity
function _approve(address to, uint256 tokenId) internal virtual
```

_Approve &#x60;to&#x60; to operate on &#x60;tokenId&#x60;

Emits a {Approval} event._

### _checkOnERC721Received

```solidity
function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes _data) private returns (bool)
```

_Internal function to invoke {IERC721Receiver-onERC721Received} on a target address.
The call is not executed if the target address is not a contract._

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | address representing the previous owner of the given token ID |
| to | address | target address that will receive the tokens |
| tokenId | uint256 | uint256 ID of the token to be transferred |
| _data | bytes | bytes optional data to send along with the call |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool whether the call correctly returned the expected magic value |

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual
```

_Hook that is called before any token transfer. This includes minting
and burning.

Calling conditions:

- When &#x60;from&#x60; and &#x60;to&#x60; are both non-zero, &#x60;&#x60;from&#x60;&#x60;&#x27;s &#x60;tokenId&#x60; will be
transferred to &#x60;to&#x60;.
- When &#x60;from&#x60; is zero, &#x60;tokenId&#x60; will be minted for &#x60;to&#x60;.
- When &#x60;to&#x60; is zero, &#x60;&#x60;from&#x60;&#x60;&#x27;s &#x60;tokenId&#x60; will be burned.
- &#x60;from&#x60; and &#x60;to&#x60; are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

## IERC721

_Required interface of an ERC721 compliant contract._

### Transfer

```solidity
event Transfer(address from, address to, uint256 tokenId)
```

_Emitted when &#x60;tokenId&#x60; token is transferred from &#x60;from&#x60; to &#x60;to&#x60;._

### Approval

```solidity
event Approval(address owner, address approved, uint256 tokenId)
```

_Emitted when &#x60;owner&#x60; enables &#x60;approved&#x60; to manage the &#x60;tokenId&#x60; token._

### ApprovalForAll

```solidity
event ApprovalForAll(address owner, address operator, bool approved)
```

_Emitted when &#x60;owner&#x60; enables or disables (&#x60;approved&#x60;) &#x60;operator&#x60; to manage all of its assets._

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256 balance)
```

_Returns the number of tokens in &#x60;&#x60;owner&#x60;&#x60;&#x27;s account._

### ownerOf

```solidity
function ownerOf(uint256 tokenId) external view returns (address owner)
```

_Returns the owner of the &#x60;tokenId&#x60; token.

Requirements:

- &#x60;tokenId&#x60; must exist._

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId) external
```

_Safely transfers &#x60;tokenId&#x60; token from &#x60;from&#x60; to &#x60;to&#x60;, checking first that contract recipients
are aware of the ERC721 protocol to prevent tokens from being forever locked.

Requirements:

- &#x60;from&#x60; cannot be the zero address.
- &#x60;to&#x60; cannot be the zero address.
- &#x60;tokenId&#x60; token must exist and be owned by &#x60;from&#x60;.
- If the caller is not &#x60;from&#x60;, it must be have been allowed to move this token by either {approve} or {setApprovalForAll}.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.

Emits a {Transfer} event._

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 tokenId) external
```

_Transfers &#x60;tokenId&#x60; token from &#x60;from&#x60; to &#x60;to&#x60;.

WARNING: Usage of this method is discouraged, use {safeTransferFrom} whenever possible.

Requirements:

- &#x60;from&#x60; cannot be the zero address.
- &#x60;to&#x60; cannot be the zero address.
- &#x60;tokenId&#x60; token must be owned by &#x60;from&#x60;.
- If the caller is not &#x60;from&#x60;, it must be approved to move this token by either {approve} or {setApprovalForAll}.

Emits a {Transfer} event._

### approve

```solidity
function approve(address to, uint256 tokenId) external
```

_Gives permission to &#x60;to&#x60; to transfer &#x60;tokenId&#x60; token to another account.
The approval is cleared when the token is transferred.

Only a single account can be approved at a time, so approving the zero address clears previous approvals.

Requirements:

- The caller must own the token or be an approved operator.
- &#x60;tokenId&#x60; must exist.

Emits an {Approval} event._

### getApproved

```solidity
function getApproved(uint256 tokenId) external view returns (address operator)
```

_Returns the account approved for &#x60;tokenId&#x60; token.

Requirements:

- &#x60;tokenId&#x60; must exist._

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool _approved) external
```

_Approve or remove &#x60;operator&#x60; as an operator for the caller.
Operators can call {transferFrom} or {safeTransferFrom} for any token owned by the caller.

Requirements:

- The &#x60;operator&#x60; cannot be the caller.

Emits an {ApprovalForAll} event._

### isApprovedForAll

```solidity
function isApprovedForAll(address owner, address operator) external view returns (bool)
```

_Returns if the &#x60;operator&#x60; is allowed to manage all of the assets of &#x60;owner&#x60;.

See {setApprovalForAll}_

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) external
```

_Safely transfers &#x60;tokenId&#x60; token from &#x60;from&#x60; to &#x60;to&#x60;.

Requirements:

- &#x60;from&#x60; cannot be the zero address.
- &#x60;to&#x60; cannot be the zero address.
- &#x60;tokenId&#x60; token must exist and be owned by &#x60;from&#x60;.
- If the caller is not &#x60;from&#x60;, it must be approved to move this token by either {approve} or {setApprovalForAll}.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.

Emits a {Transfer} event._

## IERC721Receiver

_Interface for any contract that wants to support safeTransfers
from ERC721 asset contracts._

### onERC721Received

```solidity
function onERC721Received(address operator, address from, uint256 tokenId, bytes data) external returns (bytes4)
```

_Whenever an {IERC721} &#x60;tokenId&#x60; token is transferred to this contract via {IERC721-safeTransferFrom}
by &#x60;operator&#x60; from &#x60;from&#x60;, this function is called.

It must return its Solidity selector to confirm the token transfer.
If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.

The selector can be obtained in Solidity with &#x60;IERC721.onERC721Received.selector&#x60;._

## ERC721Burnable

_ERC721 Token that can be irreversibly burned (destroyed)._

### burn

```solidity
function burn(uint256 tokenId) public virtual
```

_Burns &#x60;tokenId&#x60;. See {ERC721-_burn}.

Requirements:

- The caller must own &#x60;tokenId&#x60; or be an approved operator._

## ERC721Enumerable

_This implements an optional extension of {ERC721} defined in the EIP that adds
enumerability of all the token ids in the contract as well as all token ids owned by each
account._

### _ownedTokens

```solidity
mapping(address &#x3D;&gt; mapping(uint256 &#x3D;&gt; uint256)) _ownedTokens
```

### _ownedTokensIndex

```solidity
mapping(uint256 &#x3D;&gt; uint256) _ownedTokensIndex
```

### _allTokens

```solidity
uint256[] _allTokens
```

### _allTokensIndex

```solidity
mapping(uint256 &#x3D;&gt; uint256) _allTokensIndex
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### tokenOfOwnerByIndex

```solidity
function tokenOfOwnerByIndex(address owner, uint256 index) public view virtual returns (uint256)
```

_See {IERC721Enumerable-tokenOfOwnerByIndex}._

### totalSupply

```solidity
function totalSupply() public view virtual returns (uint256)
```

_See {IERC721Enumerable-totalSupply}._

### tokenByIndex

```solidity
function tokenByIndex(uint256 index) public view virtual returns (uint256)
```

_See {IERC721Enumerable-tokenByIndex}._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual
```

_Hook that is called before any token transfer. This includes minting
and burning.

Calling conditions:

- When &#x60;from&#x60; and &#x60;to&#x60; are both non-zero, &#x60;&#x60;from&#x60;&#x60;&#x27;s &#x60;tokenId&#x60; will be
transferred to &#x60;to&#x60;.
- When &#x60;from&#x60; is zero, &#x60;tokenId&#x60; will be minted for &#x60;to&#x60;.
- When &#x60;to&#x60; is zero, &#x60;&#x60;from&#x60;&#x60;&#x27;s &#x60;tokenId&#x60; will be burned.
- &#x60;from&#x60; cannot be the zero address.
- &#x60;to&#x60; cannot be the zero address.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### _addTokenToOwnerEnumeration

```solidity
function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private
```

_Private function to add a token to this extension&#x27;s ownership-tracking data structures._

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address representing the new owner of the given token ID |
| tokenId | uint256 | uint256 ID of the token to be added to the tokens list of the given address |

### _addTokenToAllTokensEnumeration

```solidity
function _addTokenToAllTokensEnumeration(uint256 tokenId) private
```

_Private function to add a token to this extension&#x27;s token tracking data structures._

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | uint256 ID of the token to be added to the tokens list |

### _removeTokenFromOwnerEnumeration

```solidity
function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private
```

_Private function to remove a token from this extension&#x27;s ownership-tracking data structures. Note that
while the token is not assigned a new owner, the &#x60;_ownedTokensIndex&#x60; mapping is _not_ updated: this allows for
gas optimizations e.g. when performing a transfer operation (avoiding double writes).
This has O(1) time complexity, but alters the order of the _ownedTokens array._

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | address representing the previous owner of the given token ID |
| tokenId | uint256 | uint256 ID of the token to be removed from the tokens list of the given address |

### _removeTokenFromAllTokensEnumeration

```solidity
function _removeTokenFromAllTokensEnumeration(uint256 tokenId) private
```

_Private function to remove a token from this extension&#x27;s token tracking data structures.
This has O(1) time complexity, but alters the order of the _allTokens array._

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | uint256 ID of the token to be removed from the tokens list |

## ERC721Pausable

_ERC721 token with pausable token transfers, minting and burning.

Useful for scenarios such as preventing trades until the end of an evaluation
period, or having an emergency switch for freezing all token transfers in the
event of a large bug._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual
```

_See {ERC721-_beforeTokenTransfer}.

Requirements:

- the contract must not be paused._

## ERC721URIStorage

_ERC721 token with storage based token URI management._

### _tokenURIs

```solidity
mapping(uint256 &#x3D;&gt; string) _tokenURIs
```

### tokenURI

```solidity
function tokenURI(uint256 tokenId) public view virtual returns (string)
```

_See {IERC721Metadata-tokenURI}._

### _setTokenURI

```solidity
function _setTokenURI(uint256 tokenId, string _tokenURI) internal virtual
```

_Sets &#x60;_tokenURI&#x60; as the tokenURI of &#x60;tokenId&#x60;.

Requirements:

- &#x60;tokenId&#x60; must exist._

### _burn

```solidity
function _burn(uint256 tokenId) internal virtual
```

_Destroys &#x60;tokenId&#x60;.
The approval is cleared when the token is burned.

Requirements:

- &#x60;tokenId&#x60; must exist.

Emits a {Transfer} event._

## IERC721Enumerable

_See https://eips.ethereum.org/EIPS/eip-721_

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

_Returns the total amount of tokens stored by the contract._

### tokenOfOwnerByIndex

```solidity
function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)
```

_Returns a token ID owned by &#x60;owner&#x60; at a given &#x60;index&#x60; of its token list.
Use along with {balanceOf} to enumerate all of &#x60;&#x60;owner&#x60;&#x60;&#x27;s tokens._

### tokenByIndex

```solidity
function tokenByIndex(uint256 index) external view returns (uint256)
```

_Returns a token ID at a given &#x60;index&#x60; of all the tokens stored by the contract.
Use along with {totalSupply} to enumerate all tokens._

## IERC721Metadata

_See https://eips.ethereum.org/EIPS/eip-721_

### name

```solidity
function name() external view returns (string)
```

_Returns the token collection name._

### symbol

```solidity
function symbol() external view returns (string)
```

_Returns the token collection symbol._

### tokenURI

```solidity
function tokenURI(uint256 tokenId) external view returns (string)
```

_Returns the Uniform Resource Identifier (URI) for &#x60;tokenId&#x60; token._

## ERC721PresetMinterPauserAutoId

_{ERC721} token, including:

 - ability for holders to burn (destroy) their tokens
 - a minter role that allows for token minting (creation)
 - a pauser role that allows to stop all token transfers
 - token ID and URI autogeneration

This contract uses {AccessControl} to lock permissioned functions using the
different roles - head to its documentation for details.

The account that deploys the contract will be granted the minter and pauser
roles, as well as the default admin role, which will let it grant both minter
and pauser roles to other accounts._

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### PAUSER_ROLE

```solidity
bytes32 PAUSER_ROLE
```

### _tokenIdTracker

```solidity
struct Counters.Counter _tokenIdTracker
```

### _baseTokenURI

```solidity
string _baseTokenURI
```

### constructor

```solidity
constructor(string name, string symbol, string baseTokenURI) public
```

_Grants &#x60;DEFAULT_ADMIN_ROLE&#x60;, &#x60;MINTER_ROLE&#x60; and &#x60;PAUSER_ROLE&#x60; to the
account that deploys the contract.

Token URIs will be autogenerated based on &#x60;baseURI&#x60; and their token IDs.
See {ERC721-tokenURI}._

### _baseURI

```solidity
function _baseURI() internal view virtual returns (string)
```

_Base URI for computing {tokenURI}. If set, the resulting URI for each
token will be the concatenation of the &#x60;baseURI&#x60; and the &#x60;tokenId&#x60;. Empty
by default, can be overriden in child contracts._

### mint

```solidity
function mint(address to) public virtual
```

_Creates a new token for &#x60;to&#x60;. Its token ID will be automatically
assigned (and available on the emitted {IERC721-Transfer} event), and the token
URI autogenerated based on the base URI passed at construction.

See {ERC721-_mint}.

Requirements:

- the caller must have the &#x60;MINTER_ROLE&#x60;._

### pause

```solidity
function pause() public virtual
```

_Pauses all token transfers.

See {ERC721Pausable} and {Pausable-_pause}.

Requirements:

- the caller must have the &#x60;PAUSER_ROLE&#x60;._

### unpause

```solidity
function unpause() public virtual
```

_Unpauses all token transfers.

See {ERC721Pausable} and {Pausable-_unpause}.

Requirements:

- the caller must have the &#x60;PAUSER_ROLE&#x60;._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

## ERC721Holder

_Implementation of the {IERC721Receiver} interface.

Accepts all token transfers.
Make sure the contract is able to use its token with {IERC721-safeTransferFrom}, {IERC721-approve} or {IERC721-setApprovalForAll}._

### onERC721Received

```solidity
function onERC721Received(address, address, uint256, bytes) public virtual returns (bytes4)
```

_See {IERC721Receiver-onERC721Received}.

Always returns &#x60;IERC721Receiver.onERC721Received.selector&#x60;._

## ERC777

_Implementation of the {IERC777} interface.

This implementation is agnostic to the way tokens are created. This means
that a supply mechanism has to be added in a derived contract using {_mint}.

Support for ERC20 is included in this contract, as specified by the EIP: both
the ERC777 and ERC20 interfaces can be safely used when interacting with it.
Both {IERC777-Sent} and {IERC20-Transfer} events are emitted on token
movements.

Additionally, the {IERC777-granularity} value is hard-coded to &#x60;1&#x60;, meaning that there
are no special restrictions in the amount of tokens that created, moved, or
destroyed. This makes integration with ERC20 applications seamless._

### _ERC1820_REGISTRY

```solidity
contract IERC1820Registry _ERC1820_REGISTRY
```

### _balances

```solidity
mapping(address &#x3D;&gt; uint256) _balances
```

### _totalSupply

```solidity
uint256 _totalSupply
```

### _name

```solidity
string _name
```

### _symbol

```solidity
string _symbol
```

### _TOKENS_SENDER_INTERFACE_HASH

```solidity
bytes32 _TOKENS_SENDER_INTERFACE_HASH
```

### _TOKENS_RECIPIENT_INTERFACE_HASH

```solidity
bytes32 _TOKENS_RECIPIENT_INTERFACE_HASH
```

### _defaultOperatorsArray

```solidity
address[] _defaultOperatorsArray
```

### _defaultOperators

```solidity
mapping(address &#x3D;&gt; bool) _defaultOperators
```

### _operators

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; bool)) _operators
```

### _revokedDefaultOperators

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; bool)) _revokedDefaultOperators
```

### _allowances

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) _allowances
```

### constructor

```solidity
constructor(string name_, string symbol_, address[] defaultOperators_) public
```

_&#x60;defaultOperators&#x60; may be an empty array._

### name

```solidity
function name() public view virtual returns (string)
```

_See {IERC777-name}._

### symbol

```solidity
function symbol() public view virtual returns (string)
```

_See {IERC777-symbol}._

### decimals

```solidity
function decimals() public pure virtual returns (uint8)
```

_See {ERC20-decimals}.

Always returns 18, as per the
[ERC777 EIP](https://eips.ethereum.org/EIPS/eip-777#backward-compatibility)._

### granularity

```solidity
function granularity() public view virtual returns (uint256)
```

_See {IERC777-granularity}.

This implementation always returns &#x60;1&#x60;._

### totalSupply

```solidity
function totalSupply() public view virtual returns (uint256)
```

_See {IERC777-totalSupply}._

### balanceOf

```solidity
function balanceOf(address tokenHolder) public view virtual returns (uint256)
```

_Returns the amount of tokens owned by an account (&#x60;tokenHolder&#x60;)._

### send

```solidity
function send(address recipient, uint256 amount, bytes data) public virtual
```

_See {IERC777-send}.

Also emits a {IERC20-Transfer} event for ERC20 compatibility._

### transfer

```solidity
function transfer(address recipient, uint256 amount) public virtual returns (bool)
```

_See {IERC20-transfer}.

Unlike &#x60;send&#x60;, &#x60;recipient&#x60; is _not_ required to implement the {IERC777Recipient}
interface if it is a contract.

Also emits a {Sent} event._

### burn

```solidity
function burn(uint256 amount, bytes data) public virtual
```

_See {IERC777-burn}.

Also emits a {IERC20-Transfer} event for ERC20 compatibility._

### isOperatorFor

```solidity
function isOperatorFor(address operator, address tokenHolder) public view virtual returns (bool)
```

_See {IERC777-isOperatorFor}._

### authorizeOperator

```solidity
function authorizeOperator(address operator) public virtual
```

_See {IERC777-authorizeOperator}._

### revokeOperator

```solidity
function revokeOperator(address operator) public virtual
```

_See {IERC777-revokeOperator}._

### defaultOperators

```solidity
function defaultOperators() public view virtual returns (address[])
```

_See {IERC777-defaultOperators}._

### operatorSend

```solidity
function operatorSend(address sender, address recipient, uint256 amount, bytes data, bytes operatorData) public virtual
```

_See {IERC777-operatorSend}.

Emits {Sent} and {IERC20-Transfer} events._

### operatorBurn

```solidity
function operatorBurn(address account, uint256 amount, bytes data, bytes operatorData) public virtual
```

_See {IERC777-operatorBurn}.

Emits {Burned} and {IERC20-Transfer} events._

### allowance

```solidity
function allowance(address holder, address spender) public view virtual returns (uint256)
```

_See {IERC20-allowance}.

Note that operator and allowance concepts are orthogonal: operators may
not have allowance, and accounts with allowance may not be operators
themselves._

### approve

```solidity
function approve(address spender, uint256 value) public virtual returns (bool)
```

_See {IERC20-approve}.

Note that accounts cannot have allowance issued by their operators._

### transferFrom

```solidity
function transferFrom(address holder, address recipient, uint256 amount) public virtual returns (bool)
```

_See {IERC20-transferFrom}.

Note that operator and allowance concepts are orthogonal: operators cannot
call &#x60;transferFrom&#x60; (unless they have allowance), and accounts with
allowance cannot call &#x60;operatorSend&#x60; (unless they are operators).

Emits {Sent}, {IERC20-Transfer} and {IERC20-Approval} events._

### _mint

```solidity
function _mint(address account, uint256 amount, bytes userData, bytes operatorData) internal virtual
```

_Creates &#x60;amount&#x60; tokens and assigns them to &#x60;account&#x60;, increasing
the total supply.

If a send hook is registered for &#x60;account&#x60;, the corresponding function
will be called with &#x60;operator&#x60;, &#x60;data&#x60; and &#x60;operatorData&#x60;.

See {IERC777Sender} and {IERC777Recipient}.

Emits {Minted} and {IERC20-Transfer} events.

Requirements

- &#x60;account&#x60; cannot be the zero address.
- if &#x60;account&#x60; is a contract, it must implement the {IERC777Recipient}
interface._

### _mint

```solidity
function _mint(address account, uint256 amount, bytes userData, bytes operatorData, bool requireReceptionAck) internal virtual
```

_Creates &#x60;amount&#x60; tokens and assigns them to &#x60;account&#x60;, increasing
the total supply.

If &#x60;requireReceptionAck&#x60; is set to true, and if a send hook is
registered for &#x60;account&#x60;, the corresponding function will be called with
&#x60;operator&#x60;, &#x60;data&#x60; and &#x60;operatorData&#x60;.

See {IERC777Sender} and {IERC777Recipient}.

Emits {Minted} and {IERC20-Transfer} events.

Requirements

- &#x60;account&#x60; cannot be the zero address.
- if &#x60;account&#x60; is a contract, it must implement the {IERC777Recipient}
interface._

### _send

```solidity
function _send(address from, address to, uint256 amount, bytes userData, bytes operatorData, bool requireReceptionAck) internal virtual
```

_Send tokens_

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | address token holder address |
| to | address | address recipient address |
| amount | uint256 | uint256 amount of tokens to transfer |
| userData | bytes | bytes extra information provided by the token holder (if any) |
| operatorData | bytes | bytes extra information provided by the operator (if any) |
| requireReceptionAck | bool | if true, contract recipients are required to implement ERC777TokensRecipient |

### _burn

```solidity
function _burn(address from, uint256 amount, bytes data, bytes operatorData) internal virtual
```

_Burn tokens_

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | address token holder address |
| amount | uint256 | uint256 amount of tokens to burn |
| data | bytes | bytes extra information provided by the token holder |
| operatorData | bytes | bytes extra information provided by the operator (if any) |

### _move

```solidity
function _move(address operator, address from, address to, uint256 amount, bytes userData, bytes operatorData) private
```

### _approve

```solidity
function _approve(address holder, address spender, uint256 value) internal
```

_See {ERC20-_approve}.

Note that accounts cannot have allowance issued by their operators._

### _callTokensToSend

```solidity
function _callTokensToSend(address operator, address from, address to, uint256 amount, bytes userData, bytes operatorData) private
```

_Call from.tokensToSend() if the interface is registered_

| Name | Type | Description |
| ---- | ---- | ----------- |
| operator | address | address operator requesting the transfer |
| from | address | address token holder address |
| to | address | address recipient address |
| amount | uint256 | uint256 amount of tokens to transfer |
| userData | bytes | bytes extra information provided by the token holder (if any) |
| operatorData | bytes | bytes extra information provided by the operator (if any) |

### _callTokensReceived

```solidity
function _callTokensReceived(address operator, address from, address to, uint256 amount, bytes userData, bytes operatorData, bool requireReceptionAck) private
```

_Call to.tokensReceived() if the interface is registered. Reverts if the recipient is a contract but
tokensReceived() was not registered for the recipient_

| Name | Type | Description |
| ---- | ---- | ----------- |
| operator | address | address operator requesting the transfer |
| from | address | address token holder address |
| to | address | address recipient address |
| amount | uint256 | uint256 amount of tokens to transfer |
| userData | bytes | bytes extra information provided by the token holder (if any) |
| operatorData | bytes | bytes extra information provided by the operator (if any) |
| requireReceptionAck | bool | if true, contract recipients are required to implement ERC777TokensRecipient |

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address operator, address from, address to, uint256 amount) internal virtual
```

_Hook that is called before any token transfer. This includes
calls to {send}, {transfer}, {operatorSend}, minting and burning.

Calling conditions:

- when &#x60;from&#x60; and &#x60;to&#x60; are both non-zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens
will be to transferred to &#x60;to&#x60;.
- when &#x60;from&#x60; is zero, &#x60;amount&#x60; tokens will be minted for &#x60;to&#x60;.
- when &#x60;to&#x60; is zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens will be burned.
- &#x60;from&#x60; and &#x60;to&#x60; are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

## IERC777

_Interface of the ERC777Token standard as defined in the EIP.

This contract uses the
https://eips.ethereum.org/EIPS/eip-1820[ERC1820 registry standard] to let
token holders and recipients react to token movements by using setting implementers
for the associated interfaces in said registry. See {IERC1820Registry} and
{ERC1820Implementer}._

### name

```solidity
function name() external view returns (string)
```

_Returns the name of the token._

### symbol

```solidity
function symbol() external view returns (string)
```

_Returns the symbol of the token, usually a shorter version of the
name._

### granularity

```solidity
function granularity() external view returns (uint256)
```

_Returns the smallest part of the token that is not divisible. This
means all token operations (creation, movement and destruction) must have
amounts that are a multiple of this number.

For most token contracts, this value will equal 1._

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

_Returns the amount of tokens in existence._

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```

_Returns the amount of tokens owned by an account (&#x60;owner&#x60;)._

### send

```solidity
function send(address recipient, uint256 amount, bytes data) external
```

_Moves &#x60;amount&#x60; tokens from the caller&#x27;s account to &#x60;recipient&#x60;.

If send or receive hooks are registered for the caller and &#x60;recipient&#x60;,
the corresponding functions will be called with &#x60;data&#x60; and empty
&#x60;operatorData&#x60;. See {IERC777Sender} and {IERC777Recipient}.

Emits a {Sent} event.

Requirements

- the caller must have at least &#x60;amount&#x60; tokens.
- &#x60;recipient&#x60; cannot be the zero address.
- if &#x60;recipient&#x60; is a contract, it must implement the {IERC777Recipient}
interface._

### burn

```solidity
function burn(uint256 amount, bytes data) external
```

_Destroys &#x60;amount&#x60; tokens from the caller&#x27;s account, reducing the
total supply.

If a send hook is registered for the caller, the corresponding function
will be called with &#x60;data&#x60; and empty &#x60;operatorData&#x60;. See {IERC777Sender}.

Emits a {Burned} event.

Requirements

- the caller must have at least &#x60;amount&#x60; tokens._

### isOperatorFor

```solidity
function isOperatorFor(address operator, address tokenHolder) external view returns (bool)
```

_Returns true if an account is an operator of &#x60;tokenHolder&#x60;.
Operators can send and burn tokens on behalf of their owners. All
accounts are their own operator.

See {operatorSend} and {operatorBurn}._

### authorizeOperator

```solidity
function authorizeOperator(address operator) external
```

_Make an account an operator of the caller.

See {isOperatorFor}.

Emits an {AuthorizedOperator} event.

Requirements

- &#x60;operator&#x60; cannot be calling address._

### revokeOperator

```solidity
function revokeOperator(address operator) external
```

_Revoke an account&#x27;s operator status for the caller.

See {isOperatorFor} and {defaultOperators}.

Emits a {RevokedOperator} event.

Requirements

- &#x60;operator&#x60; cannot be calling address._

### defaultOperators

```solidity
function defaultOperators() external view returns (address[])
```

_Returns the list of default operators. These accounts are operators
for all token holders, even if {authorizeOperator} was never called on
them.

This list is immutable, but individual holders may revoke these via
{revokeOperator}, in which case {isOperatorFor} will return false._

### operatorSend

```solidity
function operatorSend(address sender, address recipient, uint256 amount, bytes data, bytes operatorData) external
```

_Moves &#x60;amount&#x60; tokens from &#x60;sender&#x60; to &#x60;recipient&#x60;. The caller must
be an operator of &#x60;sender&#x60;.

If send or receive hooks are registered for &#x60;sender&#x60; and &#x60;recipient&#x60;,
the corresponding functions will be called with &#x60;data&#x60; and
&#x60;operatorData&#x60;. See {IERC777Sender} and {IERC777Recipient}.

Emits a {Sent} event.

Requirements

- &#x60;sender&#x60; cannot be the zero address.
- &#x60;sender&#x60; must have at least &#x60;amount&#x60; tokens.
- the caller must be an operator for &#x60;sender&#x60;.
- &#x60;recipient&#x60; cannot be the zero address.
- if &#x60;recipient&#x60; is a contract, it must implement the {IERC777Recipient}
interface._

### operatorBurn

```solidity
function operatorBurn(address account, uint256 amount, bytes data, bytes operatorData) external
```

_Destroys &#x60;amount&#x60; tokens from &#x60;account&#x60;, reducing the total supply.
The caller must be an operator of &#x60;account&#x60;.

If a send hook is registered for &#x60;account&#x60;, the corresponding function
will be called with &#x60;data&#x60; and &#x60;operatorData&#x60;. See {IERC777Sender}.

Emits a {Burned} event.

Requirements

- &#x60;account&#x60; cannot be the zero address.
- &#x60;account&#x60; must have at least &#x60;amount&#x60; tokens.
- the caller must be an operator for &#x60;account&#x60;._

### Sent

```solidity
event Sent(address operator, address from, address to, uint256 amount, bytes data, bytes operatorData)
```

### Minted

```solidity
event Minted(address operator, address to, uint256 amount, bytes data, bytes operatorData)
```

### Burned

```solidity
event Burned(address operator, address from, uint256 amount, bytes data, bytes operatorData)
```

### AuthorizedOperator

```solidity
event AuthorizedOperator(address operator, address tokenHolder)
```

### RevokedOperator

```solidity
event RevokedOperator(address operator, address tokenHolder)
```

## IERC777Recipient

_Interface of the ERC777TokensRecipient standard as defined in the EIP.

Accounts can be notified of {IERC777} tokens being sent to them by having a
contract implement this interface (contract holders can be their own
implementer) and registering it on the
https://eips.ethereum.org/EIPS/eip-1820[ERC1820 global registry].

See {IERC1820Registry} and {ERC1820Implementer}._

### tokensReceived

```solidity
function tokensReceived(address operator, address from, address to, uint256 amount, bytes userData, bytes operatorData) external
```

_Called by an {IERC777} token contract whenever tokens are being
moved or created into a registered account (&#x60;to&#x60;). The type of operation
is conveyed by &#x60;from&#x60; being the zero address or not.

This call occurs _after_ the token contract&#x27;s state is updated, so
{IERC777-balanceOf}, etc., can be used to query the post-operation state.

This function may revert to prevent the operation from being executed._

## IERC777Sender

_Interface of the ERC777TokensSender standard as defined in the EIP.

{IERC777} Token holders can be notified of operations performed on their
tokens by having a contract implement this interface (contract holders can be
their own implementer) and registering it on the
https://eips.ethereum.org/EIPS/eip-1820[ERC1820 global registry].

See {IERC1820Registry} and {ERC1820Implementer}._

### tokensToSend

```solidity
function tokensToSend(address operator, address from, address to, uint256 amount, bytes userData, bytes operatorData) external
```

_Called by an {IERC777} token contract whenever a registered holder&#x27;s
(&#x60;from&#x60;) tokens are about to be moved or destroyed. The type of operation
is conveyed by &#x60;to&#x60; being the zero address or not.

This call occurs _before_ the token contract&#x27;s state is updated, so
{IERC777-balanceOf}, etc., can be used to query the pre-operation state.

This function may revert to prevent the operation from being executed._

## ERC777PresetFixedSupply

_{ERC777} token, including:

 - Preminted initial supply
 - No access control mechanism (for minting/pausing) and hence no governance

_Available since v3.4.__

### constructor

```solidity
constructor(string name, string symbol, address[] defaultOperators, uint256 initialSupply, address owner) public
```

_Mints &#x60;initialSupply&#x60; amount of token and transfers them to &#x60;owner&#x60;.

See {ERC777-constructor}._

## Address

_Collection of functions related to the address type_

### isContract

```solidity
function isContract(address account) internal view returns (bool)
```

_Returns true if &#x60;account&#x60; is a contract.

[IMPORTANT]
&#x3D;&#x3D;&#x3D;&#x3D;
It is unsafe to assume that an address for which this function returns
false is an externally-owned account (EOA) and not a contract.

Among others, &#x60;isContract&#x60; will return false for the following
types of addresses:

 - an externally-owned account
 - a contract in construction
 - an address where a contract will be created
 - an address where a contract lived, but was destroyed
&#x3D;&#x3D;&#x3D;&#x3D;_

### sendValue

```solidity
function sendValue(address payable recipient, uint256 amount) internal
```

_Replacement for Solidity&#x27;s &#x60;transfer&#x60;: sends &#x60;amount&#x60; wei to
&#x60;recipient&#x60;, forwarding all available gas and reverting on errors.

https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
of certain opcodes, possibly making contracts go over the 2300 gas limit
imposed by &#x60;transfer&#x60;, making them unable to receive funds via
&#x60;transfer&#x60;. {sendValue} removes this limitation.

https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].

IMPORTANT: because control is transferred to &#x60;recipient&#x60;, care must be
taken to not create reentrancy vulnerabilities. Consider using
{ReentrancyGuard} or the
https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern]._

### functionCall

```solidity
function functionCall(address target, bytes data) internal returns (bytes)
```

_Performs a Solidity function call using a low level &#x60;call&#x60;. A
plain &#x60;call&#x60; is an unsafe replacement for a function call: use this
function instead.

If &#x60;target&#x60; reverts with a revert reason, it is bubbled up by this
function (like regular Solidity function calls).

Returns the raw returned data. To convert to the expected return value,
use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight&#x3D;abi.decode#abi-encoding-and-decoding-functions[&#x60;abi.decode&#x60;].

Requirements:

- &#x60;target&#x60; must be a contract.
- calling &#x60;target&#x60; with &#x60;data&#x60; must not revert.

_Available since v3.1.__

### functionCall

```solidity
function functionCall(address target, bytes data, string errorMessage) internal returns (bytes)
```

_Same as {xref-Address-functionCall-address-bytes-}[&#x60;functionCall&#x60;], but with
&#x60;errorMessage&#x60; as a fallback revert reason when &#x60;target&#x60; reverts.

_Available since v3.1.__

### functionCallWithValue

```solidity
function functionCallWithValue(address target, bytes data, uint256 value) internal returns (bytes)
```

_Same as {xref-Address-functionCall-address-bytes-}[&#x60;functionCall&#x60;],
but also transferring &#x60;value&#x60; wei to &#x60;target&#x60;.

Requirements:

- the calling contract must have an ETH balance of at least &#x60;value&#x60;.
- the called Solidity function must be &#x60;payable&#x60;.

_Available since v3.1.__

### functionCallWithValue

```solidity
function functionCallWithValue(address target, bytes data, uint256 value, string errorMessage) internal returns (bytes)
```

_Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[&#x60;functionCallWithValue&#x60;], but
with &#x60;errorMessage&#x60; as a fallback revert reason when &#x60;target&#x60; reverts.

_Available since v3.1.__

### functionStaticCall

```solidity
function functionStaticCall(address target, bytes data) internal view returns (bytes)
```

_Same as {xref-Address-functionCall-address-bytes-}[&#x60;functionCall&#x60;],
but performing a static call.

_Available since v3.3.__

### functionStaticCall

```solidity
function functionStaticCall(address target, bytes data, string errorMessage) internal view returns (bytes)
```

_Same as {xref-Address-functionCall-address-bytes-string-}[&#x60;functionCall&#x60;],
but performing a static call.

_Available since v3.3.__

### functionDelegateCall

```solidity
function functionDelegateCall(address target, bytes data) internal returns (bytes)
```

_Same as {xref-Address-functionCall-address-bytes-}[&#x60;functionCall&#x60;],
but performing a delegate call.

_Available since v3.4.__

### functionDelegateCall

```solidity
function functionDelegateCall(address target, bytes data, string errorMessage) internal returns (bytes)
```

_Same as {xref-Address-functionCall-address-bytes-string-}[&#x60;functionCall&#x60;],
but performing a delegate call.

_Available since v3.4.__

### verifyCallResult

```solidity
function verifyCallResult(bool success, bytes returndata, string errorMessage) internal pure returns (bytes)
```

_Tool to verifies that a low level call was successful, and revert if it wasn&#x27;t, either by bubbling the
revert reason using the provided one.

_Available since v4.3.__

## Arrays

_Collection of functions related to array types._

### findUpperBound

```solidity
function findUpperBound(uint256[] array, uint256 element) internal view returns (uint256)
```

_Searches a sorted &#x60;array&#x60; and returns the first index that contains
a value greater or equal to &#x60;element&#x60;. If no such index exists (i.e. all
values in the array are strictly less than &#x60;element&#x60;), the array length is
returned. Time complexity O(log n).

&#x60;array&#x60; is expected to be sorted in ascending order, and to contain no
repeated elements._

## Context

_Provides information about the current execution context, including the
sender of the transaction and its data. While these are generally available
via msg.sender and msg.data, they should not be accessed in such a direct
manner, since when dealing with meta-transactions the account sending and
paying for execution may not be the actual sender (as far as an application
is concerned).

This contract is only required for intermediate, library-like contracts._

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

## Counters

_Provides counters that can only be incremented, decremented or reset. This can be used e.g. to track the number
of elements in a mapping, issuing ERC721 ids, or counting request ids.

Include with &#x60;using Counters for Counters.Counter;&#x60;_

### Counter

```solidity
struct Counter {
  uint256 _value;
}
```

### current

```solidity
function current(struct Counters.Counter counter) internal view returns (uint256)
```

### increment

```solidity
function increment(struct Counters.Counter counter) internal
```

### decrement

```solidity
function decrement(struct Counters.Counter counter) internal
```

### reset

```solidity
function reset(struct Counters.Counter counter) internal
```

## Multicall

_Provides a function to batch together multiple calls in a single external call.

_Available since v4.1.__

### multicall

```solidity
function multicall(bytes[] data) external returns (bytes[] results)
```

_Receives and executes a batch of function calls on this contract._

## StorageSlot

_Library for reading and writing primitive types to specific storage slots.

Storage slots are often used to avoid storage conflict when dealing with upgradeable contracts.
This library helps with reading and writing to such slots without the need for inline assembly.

The functions in this library return Slot structs that contain a &#x60;value&#x60; member that can be used to read or write.

Example usage to set ERC1967 implementation slot:
&#x60;&#x60;&#x60;
contract ERC1967 {
    bytes32 internal constant _IMPLEMENTATION_SLOT &#x3D; 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    function _getImplementation() internal view returns (address) {
        return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;
    }

    function _setImplementation(address newImplementation) internal {
        require(Address.isContract(newImplementation), &quot;ERC1967: new implementation is not a contract&quot;);
        StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value &#x3D; newImplementation;
    }
}
&#x60;&#x60;&#x60;

_Available since v4.1 for &#x60;address&#x60;, &#x60;bool&#x60;, &#x60;bytes32&#x60;, and &#x60;uint256&#x60;.__

### AddressSlot

```solidity
struct AddressSlot {
  address value;
}
```

### BooleanSlot

```solidity
struct BooleanSlot {
  bool value;
}
```

### Bytes32Slot

```solidity
struct Bytes32Slot {
  bytes32 value;
}
```

### Uint256Slot

```solidity
struct Uint256Slot {
  uint256 value;
}
```

### getAddressSlot

```solidity
function getAddressSlot(bytes32 slot) internal pure returns (struct StorageSlot.AddressSlot r)
```

_Returns an &#x60;AddressSlot&#x60; with member &#x60;value&#x60; located at &#x60;slot&#x60;._

### getBooleanSlot

```solidity
function getBooleanSlot(bytes32 slot) internal pure returns (struct StorageSlot.BooleanSlot r)
```

_Returns an &#x60;BooleanSlot&#x60; with member &#x60;value&#x60; located at &#x60;slot&#x60;._

### getBytes32Slot

```solidity
function getBytes32Slot(bytes32 slot) internal pure returns (struct StorageSlot.Bytes32Slot r)
```

_Returns an &#x60;Bytes32Slot&#x60; with member &#x60;value&#x60; located at &#x60;slot&#x60;._

### getUint256Slot

```solidity
function getUint256Slot(bytes32 slot) internal pure returns (struct StorageSlot.Uint256Slot r)
```

_Returns an &#x60;Uint256Slot&#x60; with member &#x60;value&#x60; located at &#x60;slot&#x60;._

## Strings

_String operations._

### _HEX_SYMBOLS

```solidity
bytes16 _HEX_SYMBOLS
```

### toString

```solidity
function toString(uint256 value) internal pure returns (string)
```

_Converts a &#x60;uint256&#x60; to its ASCII &#x60;string&#x60; decimal representation._

### toHexString

```solidity
function toHexString(uint256 value) internal pure returns (string)
```

_Converts a &#x60;uint256&#x60; to its ASCII &#x60;string&#x60; hexadecimal representation._

### toHexString

```solidity
function toHexString(uint256 value, uint256 length) internal pure returns (string)
```

_Converts a &#x60;uint256&#x60; to its ASCII &#x60;string&#x60; hexadecimal representation with fixed length._

## Timers

_Tooling for timepoints, timers and delays_

### Timestamp

```solidity
struct Timestamp {
  uint64 _deadline;
}
```

### getDeadline

```solidity
function getDeadline(struct Timers.Timestamp timer) internal pure returns (uint64)
```

### setDeadline

```solidity
function setDeadline(struct Timers.Timestamp timer, uint64 timestamp) internal
```

### reset

```solidity
function reset(struct Timers.Timestamp timer) internal
```

### isUnset

```solidity
function isUnset(struct Timers.Timestamp timer) internal pure returns (bool)
```

### isStarted

```solidity
function isStarted(struct Timers.Timestamp timer) internal pure returns (bool)
```

### isPending

```solidity
function isPending(struct Timers.Timestamp timer) internal view returns (bool)
```

### isExpired

```solidity
function isExpired(struct Timers.Timestamp timer) internal view returns (bool)
```

### BlockNumber

```solidity
struct BlockNumber {
  uint64 _deadline;
}
```

### getDeadline

```solidity
function getDeadline(struct Timers.BlockNumber timer) internal pure returns (uint64)
```

### setDeadline

```solidity
function setDeadline(struct Timers.BlockNumber timer, uint64 timestamp) internal
```

### reset

```solidity
function reset(struct Timers.BlockNumber timer) internal
```

### isUnset

```solidity
function isUnset(struct Timers.BlockNumber timer) internal pure returns (bool)
```

### isStarted

```solidity
function isStarted(struct Timers.BlockNumber timer) internal pure returns (bool)
```

### isPending

```solidity
function isPending(struct Timers.BlockNumber timer) internal view returns (bool)
```

### isExpired

```solidity
function isExpired(struct Timers.BlockNumber timer) internal view returns (bool)
```

## ECDSA

_Elliptic Curve Digital Signature Algorithm (ECDSA) operations.

These functions can be used to verify that a message was signed by the holder
of the private keys of a given address._

### RecoverError

```solidity
enum RecoverError {
  NoError,
  InvalidSignature,
  InvalidSignatureLength,
  InvalidSignatureS,
  InvalidSignatureV
}
```

### _throwError

```solidity
function _throwError(enum ECDSA.RecoverError error) private pure
```

### tryRecover

```solidity
function tryRecover(bytes32 hash, bytes signature) internal pure returns (address, enum ECDSA.RecoverError)
```

_Returns the address that signed a hashed message (&#x60;hash&#x60;) with
&#x60;signature&#x60; or error string. This address can then be used for verification purposes.

The &#x60;ecrecover&#x60; EVM opcode allows for malleable (non-unique) signatures:
this function rejects them by requiring the &#x60;s&#x60; value to be in the lower
half order, and the &#x60;v&#x60; value to be either 27 or 28.

IMPORTANT: &#x60;hash&#x60; _must_ be the result of a hash operation for the
verification to be secure: it is possible to craft signatures that
recover to arbitrary addresses for non-hashed data. A safe way to ensure
this is by receiving a hash of the original message (which may otherwise
be too long), and then calling {toEthSignedMessageHash} on it.

Documentation for signature generation:
- with https://web3js.readthedocs.io/en/v1.3.4/web3-eth-accounts.html#sign[Web3.js]
- with https://docs.ethers.io/v5/api/signer/#Signer-signMessage[ethers]

_Available since v4.3.__

### recover

```solidity
function recover(bytes32 hash, bytes signature) internal pure returns (address)
```

_Returns the address that signed a hashed message (&#x60;hash&#x60;) with
&#x60;signature&#x60;. This address can then be used for verification purposes.

The &#x60;ecrecover&#x60; EVM opcode allows for malleable (non-unique) signatures:
this function rejects them by requiring the &#x60;s&#x60; value to be in the lower
half order, and the &#x60;v&#x60; value to be either 27 or 28.

IMPORTANT: &#x60;hash&#x60; _must_ be the result of a hash operation for the
verification to be secure: it is possible to craft signatures that
recover to arbitrary addresses for non-hashed data. A safe way to ensure
this is by receiving a hash of the original message (which may otherwise
be too long), and then calling {toEthSignedMessageHash} on it._

### tryRecover

```solidity
function tryRecover(bytes32 hash, bytes32 r, bytes32 vs) internal pure returns (address, enum ECDSA.RecoverError)
```

_Overload of {ECDSA-tryRecover} that receives the &#x60;r&#x60; and &#x60;vs&#x60; short-signature fields separately.

See https://eips.ethereum.org/EIPS/eip-2098[EIP-2098 short signatures]

_Available since v4.3.__

### recover

```solidity
function recover(bytes32 hash, bytes32 r, bytes32 vs) internal pure returns (address)
```

_Overload of {ECDSA-recover} that receives the &#x60;r and &#x60;vs&#x60; short-signature fields separately.

_Available since v4.2.__

### tryRecover

```solidity
function tryRecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) internal pure returns (address, enum ECDSA.RecoverError)
```

_Overload of {ECDSA-tryRecover} that receives the &#x60;v&#x60;,
&#x60;r&#x60; and &#x60;s&#x60; signature fields separately.

_Available since v4.3.__

### recover

```solidity
function recover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) internal pure returns (address)
```

_Overload of {ECDSA-recover} that receives the &#x60;v&#x60;,
&#x60;r&#x60; and &#x60;s&#x60; signature fields separately.
/_

### toEthSignedMessageHash

```solidity
function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32)
```

_Returns an Ethereum Signed Message, created from a &#x60;hash&#x60;. This
produces hash corresponding to the one signed with the
https://eth.wiki/json-rpc/API#eth_sign[&#x60;eth_sign&#x60;]
JSON-RPC method as part of EIP-191.

See {recover}.
/_

### toTypedDataHash

```solidity
function toTypedDataHash(bytes32 domainSeparator, bytes32 structHash) internal pure returns (bytes32)
```

_Returns an Ethereum Signed Typed Data, created from a
&#x60;domainSeparator&#x60; and a &#x60;structHash&#x60;. This produces hash corresponding
to the one signed with the
https://eips.ethereum.org/EIPS/eip-712[&#x60;eth_signTypedData&#x60;]
JSON-RPC method as part of EIP-712.

See {recover}.
/_

## SignatureChecker

_Signature verification helper: Provide a single mechanism to verify both private-key (EOA) ECDSA signature and
ERC1271 contract sigantures. Using this instead of ECDSA.recover in your contract will make them compatible with
smart contract wallets such as Argent and Gnosis.

Note: unlike ECDSA signatures, contract signature&#x27;s are revocable, and the outcome of this function can thus change
through time. It could return true at block N and false at block N+1 (or the opposite).

_Available since v4.1.__

### isValidSignatureNow

```solidity
function isValidSignatureNow(address signer, bytes32 hash, bytes signature) internal view returns (bool)
```

## EIP712

_https://eips.ethereum.org/EIPS/eip-712[EIP 712] is a standard for hashing and signing of typed structured data.

The encoding specified in the EIP is very generic, and such a generic implementation in Solidity is not feasible,
thus this contract does not implement the encoding itself. Protocols need to implement the type-specific encoding
they need in their contracts using a combination of &#x60;abi.encode&#x60; and &#x60;keccak256&#x60;.

This contract implements the EIP 712 domain separator ({_domainSeparatorV4}) that is used as part of the encoding
scheme, and the final step of the encoding to obtain the message digest that is then signed via ECDSA
({_hashTypedDataV4}).

The implementation of the domain separator was designed to be as efficient as possible while still properly updating
the chain id to protect against replay attacks on an eventual fork of the chain.

NOTE: This contract implements the version of the encoding known as &quot;v4&quot;, as implemented by the JSON RPC method
https://docs.metamask.io/guide/signing-data.html[&#x60;eth_signTypedDataV4&#x60; in MetaMask].

_Available since v3.4.__

### _CACHED_DOMAIN_SEPARATOR

```solidity
bytes32 _CACHED_DOMAIN_SEPARATOR
```

### _CACHED_CHAIN_ID

```solidity
uint256 _CACHED_CHAIN_ID
```

### _HASHED_NAME

```solidity
bytes32 _HASHED_NAME
```

### _HASHED_VERSION

```solidity
bytes32 _HASHED_VERSION
```

### _TYPE_HASH

```solidity
bytes32 _TYPE_HASH
```

### constructor

```solidity
constructor(string name, string version) internal
```

_Initializes the domain separator and parameter caches.

The meaning of &#x60;name&#x60; and &#x60;version&#x60; is specified in
https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator[EIP 712]:

- &#x60;name&#x60;: the user readable name of the signing domain, i.e. the name of the DApp or the protocol.
- &#x60;version&#x60;: the current major version of the signing domain.

NOTE: These parameters cannot be changed except through a xref:learn::upgrading-smart-contracts.adoc[smart
contract upgrade]._

### _domainSeparatorV4

```solidity
function _domainSeparatorV4() internal view returns (bytes32)
```

_Returns the domain separator for the current chain._

### _buildDomainSeparator

```solidity
function _buildDomainSeparator(bytes32 typeHash, bytes32 nameHash, bytes32 versionHash) private view returns (bytes32)
```

### _hashTypedDataV4

```solidity
function _hashTypedDataV4(bytes32 structHash) internal view virtual returns (bytes32)
```

_Given an already https://eips.ethereum.org/EIPS/eip-712#definition-of-hashstruct[hashed struct], this
function returns the hash of the fully encoded EIP712 message for this domain.

This hash can be used together with {ECDSA-recover} to obtain the signer of a message. For example:

&#x60;&#x60;&#x60;solidity
bytes32 digest &#x3D; _hashTypedDataV4(keccak256(abi.encode(
    keccak256(&quot;Mail(address to,string contents)&quot;),
    mailTo,
    keccak256(bytes(mailContents))
)));
address signer &#x3D; ECDSA.recover(digest, signature);
&#x60;&#x60;&#x60;_

## ConditionalEscrow

_Base abstract escrow to only allow withdrawal if a condition is met.
Intended usage: See {Escrow}. Same usage guidelines apply here._

### withdrawalAllowed

```solidity
function withdrawalAllowed(address payee) public view virtual returns (bool)
```

_Returns whether an address is allowed to withdraw their funds. To be
implemented by derived contracts._

| Name | Type | Description |
| ---- | ---- | ----------- |
| payee | address | The destination address of the funds. |

### withdraw

```solidity
function withdraw(address payable payee) public virtual
```

_Withdraw accumulated balance for a payee, forwarding all gas to the
recipient.

WARNING: Forwarding all gas opens the door to reentrancy vulnerabilities.
Make sure you trust the recipient, or are either following the
checks-effects-interactions pattern or using {ReentrancyGuard}._

| Name | Type | Description |
| ---- | ---- | ----------- |
| payee | address payable | The address whose funds will be withdrawn and transferred to. |

## Escrow

_Base escrow contract, holds funds designated for a payee until they
withdraw them.

Intended usage: This contract (and derived escrow contracts) should be a
standalone contract, that only interacts with the contract that instantiated
it. That way, it is guaranteed that all Ether will be handled according to
the &#x60;Escrow&#x60; rules, and there is no need to check for payable functions or
transfers in the inheritance tree. The contract that uses the escrow as its
payment method should be its owner, and provide public methods redirecting
to the escrow&#x27;s deposit and withdraw._

### Deposited

```solidity
event Deposited(address payee, uint256 weiAmount)
```

### Withdrawn

```solidity
event Withdrawn(address payee, uint256 weiAmount)
```

### _deposits

```solidity
mapping(address &#x3D;&gt; uint256) _deposits
```

### depositsOf

```solidity
function depositsOf(address payee) public view returns (uint256)
```

### deposit

```solidity
function deposit(address payee) public payable virtual
```

_Stores the sent amount as credit to be withdrawn._

| Name | Type | Description |
| ---- | ---- | ----------- |
| payee | address | The destination address of the funds. |

### withdraw

```solidity
function withdraw(address payable payee) public virtual
```

_Withdraw accumulated balance for a payee, forwarding all gas to the
recipient.

WARNING: Forwarding all gas opens the door to reentrancy vulnerabilities.
Make sure you trust the recipient, or are either following the
checks-effects-interactions pattern or using {ReentrancyGuard}._

| Name | Type | Description |
| ---- | ---- | ----------- |
| payee | address payable | The address whose funds will be withdrawn and transferred to. |

## RefundEscrow

_Escrow that holds funds for a beneficiary, deposited from multiple
parties.
Intended usage: See {Escrow}. Same usage guidelines apply here.
The owner account (that is, the contract that instantiates this
contract) may deposit, close the deposit period, and allow for either
withdrawal by the beneficiary, or refunds to the depositors. All interactions
with &#x60;RefundEscrow&#x60; will be made through the owner contract._

### State

```solidity
enum State {
  Active,
  Refunding,
  Closed
}
```

### RefundsClosed

```solidity
event RefundsClosed()
```

### RefundsEnabled

```solidity
event RefundsEnabled()
```

### _state

```solidity
enum RefundEscrow.State _state
```

### _beneficiary

```solidity
address payable _beneficiary
```

### constructor

```solidity
constructor(address payable beneficiary_) public
```

_Constructor._

| Name | Type | Description |
| ---- | ---- | ----------- |
| beneficiary_ | address payable | The beneficiary of the deposits. |

### state

```solidity
function state() public view virtual returns (enum RefundEscrow.State)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum RefundEscrow.State | The current state of the escrow. |

### beneficiary

```solidity
function beneficiary() public view virtual returns (address payable)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address payable | The beneficiary of the escrow. |

### deposit

```solidity
function deposit(address refundee) public payable virtual
```

_Stores funds that may later be refunded._

| Name | Type | Description |
| ---- | ---- | ----------- |
| refundee | address | The address funds will be sent to if a refund occurs. |

### close

```solidity
function close() public virtual
```

_Allows for the beneficiary to withdraw their funds, rejecting
further deposits._

### enableRefunds

```solidity
function enableRefunds() public virtual
```

_Allows for refunds to take place, rejecting further deposits._

### beneficiaryWithdraw

```solidity
function beneficiaryWithdraw() public virtual
```

_Withdraws the beneficiary&#x27;s funds._

### withdrawalAllowed

```solidity
function withdrawalAllowed(address) public view returns (bool)
```

_Returns whether refundees can withdraw their deposits (be refunded). The overridden function receives a
&#x27;payee&#x27; argument, but we ignore it here since the condition is global, not per-payee._

## ERC165

_Implementation of the {IERC165} interface.

Contracts that want to implement ERC165 should inherit from this contract and override {supportsInterface} to check
for the additional interface id that will be supported. For example:

&#x60;&#x60;&#x60;solidity
function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId &#x3D;&#x3D; type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
}
&#x60;&#x60;&#x60;

Alternatively, {ERC165Storage} provides an easier to use but more expensive implementation._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

## ERC165Checker

_Library used to query support of an interface declared via {IERC165}.

Note that these functions return the actual result of the query: they do not
&#x60;revert&#x60; if an interface is not supported. It is up to the caller to decide
what to do in these cases._

### _INTERFACE_ID_INVALID

```solidity
bytes4 _INTERFACE_ID_INVALID
```

### supportsERC165

```solidity
function supportsERC165(address account) internal view returns (bool)
```

_Returns true if &#x60;account&#x60; supports the {IERC165} interface,_

### supportsInterface

```solidity
function supportsInterface(address account, bytes4 interfaceId) internal view returns (bool)
```

_Returns true if &#x60;account&#x60; supports the interface defined by
&#x60;interfaceId&#x60;. Support for {IERC165} itself is queried automatically.

See {IERC165-supportsInterface}._

### getSupportedInterfaces

```solidity
function getSupportedInterfaces(address account, bytes4[] interfaceIds) internal view returns (bool[])
```

_Returns a boolean array where each value corresponds to the
interfaces passed in and whether they&#x27;re supported or not. This allows
you to batch check interfaces for a contract where your expectation
is that some interfaces may not be supported.

See {IERC165-supportsInterface}.

_Available since v3.4.__

### supportsAllInterfaces

```solidity
function supportsAllInterfaces(address account, bytes4[] interfaceIds) internal view returns (bool)
```

_Returns true if &#x60;account&#x60; supports all the interfaces defined in
&#x60;interfaceIds&#x60;. Support for {IERC165} itself is queried automatically.

Batch-querying can lead to gas savings by skipping repeated checks for
{IERC165} support.

See {IERC165-supportsInterface}._

### _supportsERC165Interface

```solidity
function _supportsERC165Interface(address account, bytes4 interfaceId) private view returns (bool)
```

Query if a contract implements an interface, does not check ERC165 support

_Assumes that account contains a contract that supports ERC165, otherwise
the behavior of this method is undefined. This precondition can be checked
with {supportsERC165}.
Interface identification is specified in ERC-165._

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the contract to query for support of an interface |
| interfaceId | bytes4 | The interface identifier, as specified in ERC-165 |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the contract at account indicates support of the interface with identifier interfaceId, false otherwise |

## ERC165Storage

_Storage based implementation of the {IERC165} interface.

Contracts may inherit from this and call {_registerInterface} to declare
their support of an interface._

### _supportedInterfaces

```solidity
mapping(bytes4 &#x3D;&gt; bool) _supportedInterfaces
```

_Mapping of interface ids to whether or not it&#x27;s supported._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### _registerInterface

```solidity
function _registerInterface(bytes4 interfaceId) internal virtual
```

_Registers the contract as an implementer of the interface defined by
&#x60;interfaceId&#x60;. Support of the actual ERC165 interface is automatic and
registering its interface id is not required.

See {IERC165-supportsInterface}.

Requirements:

- &#x60;interfaceId&#x60; cannot be the ERC165 invalid interface (&#x60;0xffffffff&#x60;)._

## IERC165

_Interface of the ERC165 standard, as defined in the
https://eips.ethereum.org/EIPS/eip-165[EIP].

Implementers can declare support of contract interfaces, which can then be
queried by others ({ERC165Checker}).

For an implementation, see {ERC165}._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```

_Returns true if this contract implements the interface defined by
&#x60;interfaceId&#x60;. See the corresponding
https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]
to learn more about how these ids are created.

This function call must use less than 30 000 gas._

## IERC1820Registry

_Interface of the global ERC1820 Registry, as defined in the
https://eips.ethereum.org/EIPS/eip-1820[EIP]. Accounts may register
implementers for interfaces in this registry, as well as query support.

Implementers may be shared by multiple accounts, and can also implement more
than a single interface for each account. Contracts can implement interfaces
for themselves, but externally-owned accounts (EOA) must delegate this to a
contract.

{IERC165} interfaces can also be queried via the registry.

For an in-depth explanation and source code analysis, see the EIP text._

### setManager

```solidity
function setManager(address account, address newManager) external
```

_Sets &#x60;newManager&#x60; as the manager for &#x60;account&#x60;. A manager of an
account is able to set interface implementers for it.

By default, each account is its own manager. Passing a value of &#x60;0x0&#x60; in
&#x60;newManager&#x60; will reset the manager to this initial state.

Emits a {ManagerChanged} event.

Requirements:

- the caller must be the current manager for &#x60;account&#x60;._

### getManager

```solidity
function getManager(address account) external view returns (address)
```

_Returns the manager for &#x60;account&#x60;.

See {setManager}._

### setInterfaceImplementer

```solidity
function setInterfaceImplementer(address account, bytes32 _interfaceHash, address implementer) external
```

_Sets the &#x60;implementer&#x60; contract as &#x60;&#x60;account&#x60;&#x60;&#x27;s implementer for
&#x60;interfaceHash&#x60;.

&#x60;account&#x60; being the zero address is an alias for the caller&#x27;s address.
The zero address can also be used in &#x60;implementer&#x60; to remove an old one.

See {interfaceHash} to learn how these are created.

Emits an {InterfaceImplementerSet} event.

Requirements:

- the caller must be the current manager for &#x60;account&#x60;.
- &#x60;interfaceHash&#x60; must not be an {IERC165} interface id (i.e. it must not
end in 28 zeroes).
- &#x60;implementer&#x60; must implement {IERC1820Implementer} and return true when
queried for support, unless &#x60;implementer&#x60; is the caller. See
{IERC1820Implementer-canImplementInterfaceForAddress}._

### getInterfaceImplementer

```solidity
function getInterfaceImplementer(address account, bytes32 _interfaceHash) external view returns (address)
```

_Returns the implementer of &#x60;interfaceHash&#x60; for &#x60;account&#x60;. If no such
implementer is registered, returns the zero address.

If &#x60;interfaceHash&#x60; is an {IERC165} interface id (i.e. it ends with 28
zeroes), &#x60;account&#x60; will be queried for support of it.

&#x60;account&#x60; being the zero address is an alias for the caller&#x27;s address._

### interfaceHash

```solidity
function interfaceHash(string interfaceName) external pure returns (bytes32)
```

_Returns the interface hash for an &#x60;interfaceName&#x60;, as defined in the
corresponding
https://eips.ethereum.org/EIPS/eip-1820#interface-name[section of the EIP]._

### updateERC165Cache

```solidity
function updateERC165Cache(address account, bytes4 interfaceId) external
```

Updates the cache with whether the contract implements an ERC165 interface or not.

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the contract for which to update the cache. |
| interfaceId | bytes4 | ERC165 interface for which to update the cache. |

### implementsERC165Interface

```solidity
function implementsERC165Interface(address account, bytes4 interfaceId) external view returns (bool)
```

Checks whether a contract implements an ERC165 interface or not.
If the result is not cached a direct lookup on the contract address is performed.
If the result is not cached or the cached value is out-of-date, the cache MUST be updated manually by calling
{updateERC165Cache} with the contract address.

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the contract to check. |
| interfaceId | bytes4 | ERC165 interface to check. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if &#x60;account&#x60; implements &#x60;interfaceId&#x60;, false otherwise. |

### implementsERC165InterfaceNoCache

```solidity
function implementsERC165InterfaceNoCache(address account, bytes4 interfaceId) external view returns (bool)
```

Checks whether a contract implements an ERC165 interface or not without using nor updating the cache.

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the contract to check. |
| interfaceId | bytes4 | ERC165 interface to check. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if &#x60;account&#x60; implements &#x60;interfaceId&#x60;, false otherwise. |

### InterfaceImplementerSet

```solidity
event InterfaceImplementerSet(address account, bytes32 interfaceHash, address implementer)
```

### ManagerChanged

```solidity
event ManagerChanged(address account, address newManager)
```

## Math

_Standard math utilities missing in the Solidity language._

### max

```solidity
function max(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the largest of two numbers._

### min

```solidity
function min(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the smallest of two numbers._

### average

```solidity
function average(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the average of two numbers. The result is rounded towards
zero._

### ceilDiv

```solidity
function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the ceiling of the division of two numbers.

This differs from standard division with &#x60;/&#x60; in that it rounds up instead
of rounding down._

## SafeCast

_Wrappers over Solidity&#x27;s uintXX/intXX casting operators with added overflow
checks.

Downcasting from uint256/int256 in Solidity does not revert on overflow. This can
easily result in undesired exploitation or bugs, since developers usually
assume that overflows raise errors. &#x60;SafeCast&#x60; restores this intuition by
reverting the transaction when such an operation overflows.

Using this library instead of the unchecked operations eliminates an entire
class of bugs, so it&#x27;s recommended to use it always.

Can be combined with {SafeMath} and {SignedSafeMath} to extend it to smaller types, by performing
all math on &#x60;uint256&#x60; and &#x60;int256&#x60; and then downcasting._

### toUint224

```solidity
function toUint224(uint256 value) internal pure returns (uint224)
```

_Returns the downcasted uint224 from uint256, reverting on
overflow (when the input is greater than largest uint224).

Counterpart to Solidity&#x27;s &#x60;uint224&#x60; operator.

Requirements:

- input must fit into 224 bits_

### toUint128

```solidity
function toUint128(uint256 value) internal pure returns (uint128)
```

_Returns the downcasted uint128 from uint256, reverting on
overflow (when the input is greater than largest uint128).

Counterpart to Solidity&#x27;s &#x60;uint128&#x60; operator.

Requirements:

- input must fit into 128 bits_

### toUint96

```solidity
function toUint96(uint256 value) internal pure returns (uint96)
```

_Returns the downcasted uint96 from uint256, reverting on
overflow (when the input is greater than largest uint96).

Counterpart to Solidity&#x27;s &#x60;uint96&#x60; operator.

Requirements:

- input must fit into 96 bits_

### toUint64

```solidity
function toUint64(uint256 value) internal pure returns (uint64)
```

_Returns the downcasted uint64 from uint256, reverting on
overflow (when the input is greater than largest uint64).

Counterpart to Solidity&#x27;s &#x60;uint64&#x60; operator.

Requirements:

- input must fit into 64 bits_

### toUint32

```solidity
function toUint32(uint256 value) internal pure returns (uint32)
```

_Returns the downcasted uint32 from uint256, reverting on
overflow (when the input is greater than largest uint32).

Counterpart to Solidity&#x27;s &#x60;uint32&#x60; operator.

Requirements:

- input must fit into 32 bits_

### toUint16

```solidity
function toUint16(uint256 value) internal pure returns (uint16)
```

_Returns the downcasted uint16 from uint256, reverting on
overflow (when the input is greater than largest uint16).

Counterpart to Solidity&#x27;s &#x60;uint16&#x60; operator.

Requirements:

- input must fit into 16 bits_

### toUint8

```solidity
function toUint8(uint256 value) internal pure returns (uint8)
```

_Returns the downcasted uint8 from uint256, reverting on
overflow (when the input is greater than largest uint8).

Counterpart to Solidity&#x27;s &#x60;uint8&#x60; operator.

Requirements:

- input must fit into 8 bits._

### toUint256

```solidity
function toUint256(int256 value) internal pure returns (uint256)
```

_Converts a signed int256 into an unsigned uint256.

Requirements:

- input must be greater than or equal to 0._

### toInt128

```solidity
function toInt128(int256 value) internal pure returns (int128)
```

_Returns the downcasted int128 from int256, reverting on
overflow (when the input is less than smallest int128 or
greater than largest int128).

Counterpart to Solidity&#x27;s &#x60;int128&#x60; operator.

Requirements:

- input must fit into 128 bits

_Available since v3.1.__

### toInt64

```solidity
function toInt64(int256 value) internal pure returns (int64)
```

_Returns the downcasted int64 from int256, reverting on
overflow (when the input is less than smallest int64 or
greater than largest int64).

Counterpart to Solidity&#x27;s &#x60;int64&#x60; operator.

Requirements:

- input must fit into 64 bits

_Available since v3.1.__

### toInt32

```solidity
function toInt32(int256 value) internal pure returns (int32)
```

_Returns the downcasted int32 from int256, reverting on
overflow (when the input is less than smallest int32 or
greater than largest int32).

Counterpart to Solidity&#x27;s &#x60;int32&#x60; operator.

Requirements:

- input must fit into 32 bits

_Available since v3.1.__

### toInt16

```solidity
function toInt16(int256 value) internal pure returns (int16)
```

_Returns the downcasted int16 from int256, reverting on
overflow (when the input is less than smallest int16 or
greater than largest int16).

Counterpart to Solidity&#x27;s &#x60;int16&#x60; operator.

Requirements:

- input must fit into 16 bits

_Available since v3.1.__

### toInt8

```solidity
function toInt8(int256 value) internal pure returns (int8)
```

_Returns the downcasted int8 from int256, reverting on
overflow (when the input is less than smallest int8 or
greater than largest int8).

Counterpart to Solidity&#x27;s &#x60;int8&#x60; operator.

Requirements:

- input must fit into 8 bits.

_Available since v3.1.__

### toInt256

```solidity
function toInt256(uint256 value) internal pure returns (int256)
```

_Converts an unsigned uint256 into a signed int256.

Requirements:

- input must be less than or equal to maxInt256._

## SafeMath

_Wrappers over Solidity&#x27;s arithmetic operations.

NOTE: &#x60;SafeMath&#x60; is no longer needed starting with Solidity 0.8. The compiler
now has built in overflow checking._

### tryAdd

```solidity
function tryAdd(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

_Returns the addition of two unsigned integers, with an overflow flag.

_Available since v3.4.__

### trySub

```solidity
function trySub(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

_Returns the substraction of two unsigned integers, with an overflow flag.

_Available since v3.4.__

### tryMul

```solidity
function tryMul(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

_Returns the multiplication of two unsigned integers, with an overflow flag.

_Available since v3.4.__

### tryDiv

```solidity
function tryDiv(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

_Returns the division of two unsigned integers, with a division by zero flag.

_Available since v3.4.__

### tryMod

```solidity
function tryMod(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

_Returns the remainder of dividing two unsigned integers, with a division by zero flag.

_Available since v3.4.__

### add

```solidity
function add(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the addition of two unsigned integers, reverting on
overflow.

Counterpart to Solidity&#x27;s &#x60;+&#x60; operator.

Requirements:

- Addition cannot overflow._

### sub

```solidity
function sub(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the subtraction of two unsigned integers, reverting on
overflow (when the result is negative).

Counterpart to Solidity&#x27;s &#x60;-&#x60; operator.

Requirements:

- Subtraction cannot overflow._

### mul

```solidity
function mul(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the multiplication of two unsigned integers, reverting on
overflow.

Counterpart to Solidity&#x27;s &#x60;*&#x60; operator.

Requirements:

- Multiplication cannot overflow._

### div

```solidity
function div(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the integer division of two unsigned integers, reverting on
division by zero. The result is rounded towards zero.

Counterpart to Solidity&#x27;s &#x60;/&#x60; operator.

Requirements:

- The divisor cannot be zero._

### mod

```solidity
function mod(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
reverting when dividing by zero.

Counterpart to Solidity&#x27;s &#x60;%&#x60; operator. This function uses a &#x60;revert&#x60;
opcode (which leaves remaining gas untouched) while Solidity uses an
invalid opcode to revert (consuming all remaining gas).

Requirements:

- The divisor cannot be zero._

### sub

```solidity
function sub(uint256 a, uint256 b, string errorMessage) internal pure returns (uint256)
```

_Returns the subtraction of two unsigned integers, reverting with custom message on
overflow (when the result is negative).

CAUTION: This function is deprecated because it requires allocating memory for the error
message unnecessarily. For custom revert reasons use {trySub}.

Counterpart to Solidity&#x27;s &#x60;-&#x60; operator.

Requirements:

- Subtraction cannot overflow._

### div

```solidity
function div(uint256 a, uint256 b, string errorMessage) internal pure returns (uint256)
```

_Returns the integer division of two unsigned integers, reverting with custom message on
division by zero. The result is rounded towards zero.

Counterpart to Solidity&#x27;s &#x60;/&#x60; operator. Note: this function uses a
&#x60;revert&#x60; opcode (which leaves remaining gas untouched) while Solidity
uses an invalid opcode to revert (consuming all remaining gas).

Requirements:

- The divisor cannot be zero._

### mod

```solidity
function mod(uint256 a, uint256 b, string errorMessage) internal pure returns (uint256)
```

_Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
reverting with custom message when dividing by zero.

CAUTION: This function is deprecated because it requires allocating memory for the error
message unnecessarily. For custom revert reasons use {tryMod}.

Counterpart to Solidity&#x27;s &#x60;%&#x60; operator. This function uses a &#x60;revert&#x60;
opcode (which leaves remaining gas untouched) while Solidity uses an
invalid opcode to revert (consuming all remaining gas).

Requirements:

- The divisor cannot be zero._

## EnumerableMap

_Library for managing an enumerable variant of Solidity&#x27;s
https://solidity.readthedocs.io/en/latest/types.html#mapping-types[&#x60;mapping&#x60;]
type.

Maps have the following properties:

- Entries are added, removed, and checked for existence in constant time
(O(1)).
- Entries are enumerated in O(n). No guarantees are made on the ordering.

&#x60;&#x60;&#x60;
contract Example {
    // Add the library methods
    using EnumerableMap for EnumerableMap.UintToAddressMap;

    // Declare a set state variable
    EnumerableMap.UintToAddressMap private myMap;
}
&#x60;&#x60;&#x60;

As of v3.0.0, only maps of type &#x60;uint256 -&gt; address&#x60; (&#x60;UintToAddressMap&#x60;) are
supported._

### Map

```solidity
struct Map {
  struct EnumerableSet.Bytes32Set _keys;
  mapping(bytes32 &#x3D;&gt; bytes32) _values;
}
```

### _set

```solidity
function _set(struct EnumerableMap.Map map, bytes32 key, bytes32 value) private returns (bool)
```

_Adds a key-value pair to a map, or updates the value for an existing
key. O(1).

Returns true if the key was added to the map, that is if it was not
already present._

### _remove

```solidity
function _remove(struct EnumerableMap.Map map, bytes32 key) private returns (bool)
```

_Removes a key-value pair from a map. O(1).

Returns true if the key was removed from the map, that is if it was present._

### _contains

```solidity
function _contains(struct EnumerableMap.Map map, bytes32 key) private view returns (bool)
```

_Returns true if the key is in the map. O(1)._

### _length

```solidity
function _length(struct EnumerableMap.Map map) private view returns (uint256)
```

_Returns the number of key-value pairs in the map. O(1)._

### _at

```solidity
function _at(struct EnumerableMap.Map map, uint256 index) private view returns (bytes32, bytes32)
```

_Returns the key-value pair stored at position &#x60;index&#x60; in the map. O(1).

Note that there are no guarantees on the ordering of entries inside the
array, and it may change when more entries are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### _tryGet

```solidity
function _tryGet(struct EnumerableMap.Map map, bytes32 key) private view returns (bool, bytes32)
```

_Tries to returns the value associated with &#x60;key&#x60;.  O(1).
Does not revert if &#x60;key&#x60; is not in the map._

### _get

```solidity
function _get(struct EnumerableMap.Map map, bytes32 key) private view returns (bytes32)
```

_Returns the value associated with &#x60;key&#x60;.  O(1).

Requirements:

- &#x60;key&#x60; must be in the map._

### _get

```solidity
function _get(struct EnumerableMap.Map map, bytes32 key, string errorMessage) private view returns (bytes32)
```

_Same as {_get}, with a custom error message when &#x60;key&#x60; is not in the map.

CAUTION: This function is deprecated because it requires allocating memory for the error
message unnecessarily. For custom revert reasons use {_tryGet}._

### UintToAddressMap

```solidity
struct UintToAddressMap {
  struct EnumerableMap.Map _inner;
}
```

### set

```solidity
function set(struct EnumerableMap.UintToAddressMap map, uint256 key, address value) internal returns (bool)
```

_Adds a key-value pair to a map, or updates the value for an existing
key. O(1).

Returns true if the key was added to the map, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableMap.UintToAddressMap map, uint256 key) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the key was removed from the map, that is if it was present._

### contains

```solidity
function contains(struct EnumerableMap.UintToAddressMap map, uint256 key) internal view returns (bool)
```

_Returns true if the key is in the map. O(1)._

### length

```solidity
function length(struct EnumerableMap.UintToAddressMap map) internal view returns (uint256)
```

_Returns the number of elements in the map. O(1)._

### at

```solidity
function at(struct EnumerableMap.UintToAddressMap map, uint256 index) internal view returns (uint256, address)
```

_Returns the element stored at position &#x60;index&#x60; in the set. O(1).
Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### tryGet

```solidity
function tryGet(struct EnumerableMap.UintToAddressMap map, uint256 key) internal view returns (bool, address)
```

_Tries to returns the value associated with &#x60;key&#x60;.  O(1).
Does not revert if &#x60;key&#x60; is not in the map.

_Available since v3.4.__

### get

```solidity
function get(struct EnumerableMap.UintToAddressMap map, uint256 key) internal view returns (address)
```

_Returns the value associated with &#x60;key&#x60;.  O(1).

Requirements:

- &#x60;key&#x60; must be in the map._

### get

```solidity
function get(struct EnumerableMap.UintToAddressMap map, uint256 key, string errorMessage) internal view returns (address)
```

_Same as {get}, with a custom error message when &#x60;key&#x60; is not in the map.

CAUTION: This function is deprecated because it requires allocating memory for the error
message unnecessarily. For custom revert reasons use {tryGet}._

## EnumerableSet

_Library for managing
https://en.wikipedia.org/wiki/Set_(abstract_data_type)[sets] of primitive
types.

Sets have the following properties:

- Elements are added, removed, and checked for existence in constant time
(O(1)).
- Elements are enumerated in O(n). No guarantees are made on the ordering.

&#x60;&#x60;&#x60;
contract Example {
    // Add the library methods
    using EnumerableSet for EnumerableSet.AddressSet;

    // Declare a set state variable
    EnumerableSet.AddressSet private mySet;
}
&#x60;&#x60;&#x60;

As of v3.3.0, sets of type &#x60;bytes32&#x60; (&#x60;Bytes32Set&#x60;), &#x60;address&#x60; (&#x60;AddressSet&#x60;)
and &#x60;uint256&#x60; (&#x60;UintSet&#x60;) are supported._

### Set

```solidity
struct Set {
  bytes32[] _values;
  mapping(bytes32 &#x3D;&gt; uint256) _indexes;
}
```

### _add

```solidity
function _add(struct EnumerableSet.Set set, bytes32 value) private returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### _remove

```solidity
function _remove(struct EnumerableSet.Set set, bytes32 value) private returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### _contains

```solidity
function _contains(struct EnumerableSet.Set set, bytes32 value) private view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### _length

```solidity
function _length(struct EnumerableSet.Set set) private view returns (uint256)
```

_Returns the number of values on the set. O(1)._

### _at

```solidity
function _at(struct EnumerableSet.Set set, uint256 index) private view returns (bytes32)
```

_Returns the value stored at position &#x60;index&#x60; in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### _values

```solidity
function _values(struct EnumerableSet.Set set) private view returns (bytes32[])
```

_Return the entire set in an array

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block._

### Bytes32Set

```solidity
struct Bytes32Set {
  struct EnumerableSet.Set _inner;
}
```

### add

```solidity
function add(struct EnumerableSet.Bytes32Set set, bytes32 value) internal returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableSet.Bytes32Set set, bytes32 value) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### contains

```solidity
function contains(struct EnumerableSet.Bytes32Set set, bytes32 value) internal view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### length

```solidity
function length(struct EnumerableSet.Bytes32Set set) internal view returns (uint256)
```

_Returns the number of values in the set. O(1)._

### at

```solidity
function at(struct EnumerableSet.Bytes32Set set, uint256 index) internal view returns (bytes32)
```

_Returns the value stored at position &#x60;index&#x60; in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### values

```solidity
function values(struct EnumerableSet.Bytes32Set set) internal view returns (bytes32[])
```

_Return the entire set in an array

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block._

### AddressSet

```solidity
struct AddressSet {
  struct EnumerableSet.Set _inner;
}
```

### add

```solidity
function add(struct EnumerableSet.AddressSet set, address value) internal returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableSet.AddressSet set, address value) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### contains

```solidity
function contains(struct EnumerableSet.AddressSet set, address value) internal view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### length

```solidity
function length(struct EnumerableSet.AddressSet set) internal view returns (uint256)
```

_Returns the number of values in the set. O(1)._

### at

```solidity
function at(struct EnumerableSet.AddressSet set, uint256 index) internal view returns (address)
```

_Returns the value stored at position &#x60;index&#x60; in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### values

```solidity
function values(struct EnumerableSet.AddressSet set) internal view returns (address[])
```

_Return the entire set in an array

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block._

### UintSet

```solidity
struct UintSet {
  struct EnumerableSet.Set _inner;
}
```

### add

```solidity
function add(struct EnumerableSet.UintSet set, uint256 value) internal returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableSet.UintSet set, uint256 value) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### contains

```solidity
function contains(struct EnumerableSet.UintSet set, uint256 value) internal view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### length

```solidity
function length(struct EnumerableSet.UintSet set) internal view returns (uint256)
```

_Returns the number of values on the set. O(1)._

### at

```solidity
function at(struct EnumerableSet.UintSet set, uint256 index) internal view returns (uint256)
```

_Returns the value stored at position &#x60;index&#x60; in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### values

```solidity
function values(struct EnumerableSet.UintSet set) internal view returns (uint256[])
```

_Return the entire set in an array

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block._

## PriceProviderAggregator

### MODERATOR_ROLE

```solidity
bytes32 MODERATOR_ROLE
```

### usdDecimals

```solidity
uint8 usdDecimals
```

### tokenPriceProvider

```solidity
mapping(address &#x3D;&gt; struct PriceProviderAggregator.PriceProviderInfo) tokenPriceProvider
```

### PriceProviderInfo

```solidity
struct PriceProviderInfo {
  address priceProvider;
  bool hasSignedFunction;
}
```

### GrandModeratorRole

```solidity
event GrandModeratorRole(address who, address newModerator)
```

### RevokeModeratorRole

```solidity
event RevokeModeratorRole(address who, address moderator)
```

### SetTokenAndPriceProvider

```solidity
event SetTokenAndPriceProvider(address who, address token, address priceProvider)
```

### ChangeActive

```solidity
event ChangeActive(address who, address priceProvider, address token, bool active)
```

### initialize

```solidity
function initialize() public
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

### onlyModerator

```solidity
modifier onlyModerator()
```

### grandModerator

```solidity
function grandModerator(address newModerator) public
```

### revokeModerator

```solidity
function revokeModerator(address moderator) public
```

### setTokenAndPriceProvider

```solidity
function setTokenAndPriceProvider(address token, address priceProvider, bool hasFunctionWithSign) public
```

_sets price provider to &#x60;token&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token |
| priceProvider | address | the address of price provider. Should implememnt the interface of &#x60;PriceProvider&#x60; |
| hasFunctionWithSign | bool | true - if price provider has function with signatures                            false - if price provider does not have function with signatures |

### changeActive

```solidity
function changeActive(address priceProvider, address token, bool active) public
```

### getPrice

```solidity
function getPrice(address token) public view returns (uint256 priceMantissa, uint8 priceDecimals)
```

price &#x3D; priceMantissa / (10 ** priceDecimals)

_returns tuple (priceMantissa, priceDecimals)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token wich price is to return |

### getPriceSigned

```solidity
function getPriceSigned(address token, uint256 priceMantissa, uint256 validTo, bytes signature) public view returns (uint256 priceMantissa_, uint8 priceDecimals)
```

_returns the tupple (priceMantissa, priceDecimals) of token multiplied by 10 ** priceDecimals given by price provider.
price can be calculated as  priceMantissa / (10 ** priceDecimals)
i.e. price &#x3D; priceMantissa / (10 ** priceDecimals)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token |
| priceMantissa | uint256 | - the price of token (used in verifying the signature) |
| validTo | uint256 | - the timestamp in seconds (used in verifying the signature) |
| signature | bytes | - the backend signature of secp256k1. length is 65 bytes |

### getEvaluation

```solidity
function getEvaluation(address token, uint256 tokenAmount) public view returns (uint256 evaluation)
```

_returns the USD evaluation of token by its &#x60;tokenAmount&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token to evaluate |
| tokenAmount | uint256 | the amount of token to evaluate |

### getEvaluationSigned

```solidity
function getEvaluationSigned(address token, uint256 tokenAmount, uint256 priceMantissa, uint256 validTo, bytes signature) public view returns (uint256 evaluation)
```

_returns the USD evaluation of token by its &#x60;tokenAmount&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token |
| tokenAmount | uint256 | the amount of token including decimals |
| priceMantissa | uint256 | - the price of token (used in verifying the signature) |
| validTo | uint256 | - the timestamp in seconds (used in verifying the signature) |
| signature | bytes | - the backend signature of secp256k1. length is 65 bytes |

## BackendPriceProvider

Backend price verifier.

### TRUSTED_BACKEND_ROLE

```solidity
bytes32 TRUSTED_BACKEND_ROLE
```

### DESCRIPTION

```solidity
string DESCRIPTION
```

### usdDecimals

```solidity
uint8 usdDecimals
```

### backendMetadata

```solidity
mapping(address &#x3D;&gt; struct BackendPriceProvider.BackendMetadata) backendMetadata
```

### BackendMetadata

```solidity
struct BackendMetadata {
  bool isListed;
  bool isActive;
}
```

### GrandTrustedBackendRole

```solidity
event GrandTrustedBackendRole(address who, address newTrustedBackend)
```

### RevokeTrustedBackendRole

```solidity
event RevokeTrustedBackendRole(address who, address trustedBackend)
```

### SetToken

```solidity
event SetToken(address who, address token)
```

### ChangeActive

```solidity
event ChangeActive(address who, address token, bool active)
```

### initialize

```solidity
function initialize() public
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

### onlyTrustedBackend

```solidity
modifier onlyTrustedBackend()
```

### grandTrustedBackendRole

```solidity
function grandTrustedBackendRole(address newTrustedBackend) public
```

### revokeTrustedBackendRole

```solidity
function revokeTrustedBackendRole(address trustedBackend) public
```

### setToken

```solidity
function setToken(address token) public
```

### changeActive

```solidity
function changeActive(address token, bool active) public
```

### getMessageHash

```solidity
function getMessageHash(address token, uint256 priceMantissa, uint256 validTo) public pure returns (bytes32)
```

1. step. Backend creates offchain data and get hash of this data. This data calls message.

_returns the keccak256 of concatenated input data_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of asset |
| priceMantissa | uint256 | the price of asset that include decimals |
| validTo | uint256 | the unix timestamp in seconds that define the validity of given price to &#x60;validTo&#x60; timestamp |

### getEthSignedMessageHash

```solidity
function getEthSignedMessageHash(bytes32 messageHash) public pure returns (bytes32)
```

2. step. Backend formatting the message and get hash of this message.

_returns the keccak256 of formatted message_

| Name | Type | Description |
| ---- | ---- | ----------- |
| messageHash | bytes32 | the keccak256 of message |

### verify

```solidity
function verify(address token, uint256 priceMantissa, uint256 validTo, bytes signature) public view returns (bool)
```

4. step. Smart contract verify the message (tuple)

_returns true if the message is signed by trusted backend. Else returns false._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of asset |
| priceMantissa | uint256 | the price of asset that include decimals |
| validTo | uint256 | the unix timestamp in seconds that define the validity of given price to &#x60;validTo&#x60; timestamp |
| signature | bytes | the sign of message. |

### recoverSigner

```solidity
function recoverSigner(bytes32 ethSignedMessageHash, bytes signature) public pure returns (address)
```

_returns the signer of &#x60;ethSignedMessageHash&#x60;_

### isListed

```solidity
function isListed(address token) public view returns (bool)
```

### isActive

```solidity
function isActive(address token) public view returns (bool)
```

### getPrice

```solidity
function getPrice(address token) public pure returns (uint256 price, uint8 priceDecimals)
```

Returns the latest asset price and price decimals

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the token address |

### getPriceSigned

```solidity
function getPriceSigned(address token, uint256 priceMantissa, uint256 validTo, bytes signature) public view returns (uint256 _priceMantissa, uint8 priceDecimals)
```

### getEvaluation

```solidity
function getEvaluation(address token, uint256 tokenAmount) public pure returns (uint256 evaluation)
```

### getEvaluationSigned

```solidity
function getEvaluationSigned(address token, uint256 tokenAmount, uint256 priceMantissa, uint256 validTo, bytes signature) public view returns (uint256 evaluation)
```

_return the evaluation in $ of &#x60;tokenAmount&#x60; with signed price_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token to get evaluation in $ |
| tokenAmount | uint256 | the amount of token to get evaluation. Amount is scaled by 10 in power token decimals |
| priceMantissa | uint256 | the price multiplied by priceDecimals. The dimension of priceMantissa should be $/token |
| validTo | uint256 | the timestamp in seconds, when price is gonna be not valid. |
| signature | bytes | the ECDSA sign on eliptic curve secp256k1. |

### getPriceDecimals

```solidity
function getPriceDecimals() public view returns (uint8)
```

## ChainlinkPriceProvider

Chainlink price provider

### MODERATOR_ROLE

```solidity
bytes32 MODERATOR_ROLE
```

### DESCRIPTION

```solidity
string DESCRIPTION
```

### usdDecimals

```solidity
uint8 usdDecimals
```

### chainlinkMetadata

```solidity
mapping(address &#x3D;&gt; struct ChainlinkPriceProvider.ChainlinkMetadata) chainlinkMetadata
```

### ChainlinkMetadata

```solidity
struct ChainlinkMetadata {
  bool isActive;
  address[] aggregatorPath;
}
```

### GrandModeratorRole

```solidity
event GrandModeratorRole(address who, address newModerator)
```

### RevokeModeratorRole

```solidity
event RevokeModeratorRole(address who, address moderator)
```

### SetTokenAndAggregator

```solidity
event SetTokenAndAggregator(address who, address token, address[] aggeregatorPath)
```

### ChangeActive

```solidity
event ChangeActive(address who, address token, bool active)
```

### initialize

```solidity
function initialize() public
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

### onlyModerator

```solidity
modifier onlyModerator()
```

### grandModerator

```solidity
function grandModerator(address newModerator) public
```

### revokeModerator

```solidity
function revokeModerator(address moderator) public
```

### setTokenAndAggregator

```solidity
function setTokenAndAggregator(address token, address[] aggregatorPath) public
```

### changeActive

```solidity
function changeActive(address token, bool active) public
```

### isListed

```solidity
function isListed(address token) public view returns (bool)
```

### isActive

```solidity
function isActive(address token) public view returns (bool)
```

### getPrice

```solidity
function getPrice(address token) public view returns (uint256 priceMantissa, uint8 priceDecimals)
```

Returns the latest asset price mantissa and price decimals
[price] &#x3D; USD/token

_First step is get priceMantissa with priceDecimals by this formula:
     price &#x3D; 1 * 10 ** tokenDecimals * (chainlinkPrice_1 / 10 ** priceDecimals_1) * ... * (chainlinkPrice_n / 10 ** priceDecimals_n) &#x3D; 
           &#x3D; 10 ** tokenDecimals (chainlinkPrice_1 * ... * chainlinkPrice_n) / 10 ** (priceDecimals_1 + ... + priceDecimals_n)
     Second step is scale priceMantissa to usdDecimals_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the token address |

### getEvaluation

```solidity
function getEvaluation(address token, uint256 tokenAmount) public view returns (uint256 evaluation)
```

returns the equivalent amount in USD

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token |
| tokenAmount | uint256 | the amount of token |

### getPriceDecimals

```solidity
function getPriceDecimals() public view returns (uint8)
```

## PriceProvider

### changeActive

```solidity
function changeActive(address token, bool active) public virtual
```

### isActive

```solidity
function isActive(address token) public view virtual returns (bool)
```

### isListed

```solidity
function isListed(address token) public view virtual returns (bool)
```

### getPrice

```solidity
function getPrice(address token) public view virtual returns (uint256 priceMantissa, uint8 priceDecimals)
```

### getPriceSigned

```solidity
function getPriceSigned(address token, uint256 priceMantissa, uint256 validTo, bytes signature) public view virtual returns (uint256 _priceMantissa, uint8 _priceDecimals)
```

### getEvaluation

```solidity
function getEvaluation(address token, uint256 tokenAmount) public view virtual returns (uint256 evaluation)
```

### getEvaluationSigned

```solidity
function getEvaluationSigned(address token, uint256 tokenAmount, uint256 priceMantissa, uint256 validTo, bytes signature) public view virtual returns (uint256 evaluation)
```

_return the evaluation in $ of &#x60;tokenAmount&#x60; with signed price_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token to get evaluation in $ |
| tokenAmount | uint256 | the amount of token to get evaluation. Amount is scaled by 10 in power token decimals |
| priceMantissa | uint256 | the price multiplied by priceDecimals. The dimension of priceMantissa should be $/token |
| validTo | uint256 | the timestamp in seconds, when price is gonna be not valid. |
| signature | bytes | the ECDSA sign on eliptic curve secp256k1. |

### getPriceDecimals

```solidity
function getPriceDecimals() public view virtual returns (uint8 priceDecimals)
```

## UniswapV2PriceProvider

UniswapV2 price provider
This implementation can be affected by price manipulation due to not using TWAP
For development purposes only

### MODERATOR_ROLE

```solidity
bytes32 MODERATOR_ROLE
```

### DESCRIPTION

```solidity
string DESCRIPTION
```

### usdDecimals

```solidity
uint8 usdDecimals
```

### uniswapV2Metadata

```solidity
mapping(address &#x3D;&gt; struct UniswapV2PriceProvider.UniswapV2Metadata) uniswapV2Metadata
```

### UniswapV2Metadata

```solidity
struct UniswapV2Metadata {
  bool isActive;
  address pair;
  address pairAsset;
  uint8 tokenDecimals;
  uint8 pairAssetDecimals;
}
```

### GrandModeratorRole

```solidity
event GrandModeratorRole(address who, address newModerator)
```

### RevokeModeratorRole

```solidity
event RevokeModeratorRole(address who, address moderator)
```

### SetTokenAndPair

```solidity
event SetTokenAndPair(address who, address token, address pair)
```

### ChangeActive

```solidity
event ChangeActive(address who, address token, bool active)
```

### initialize

```solidity
function initialize() public
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

### onlyModerator

```solidity
modifier onlyModerator()
```

### grandModerator

```solidity
function grandModerator(address newModerator) public
```

### revokeModerator

```solidity
function revokeModerator(address moderator) public
```

### setTokenAndPair

```solidity
function setTokenAndPair(address token, address pair) public
```

### changeActive

```solidity
function changeActive(address token, bool active) public
```

### isListed

```solidity
function isListed(address token) public view returns (bool)
```

### isActive

```solidity
function isActive(address token) public view returns (bool)
```

### getPrice

```solidity
function getPrice(address token) public view returns (uint256 price, uint8 priceDecimals)
```

### getEvaluation

```solidity
function getEvaluation(address token, uint256 tokenAmount) public view returns (uint256 evaluation)
```

### getReserves

```solidity
function getReserves(address uniswapPair, address tokenA, address tokenB) public view returns (uint256 reserveA, uint256 reserveB)
```

### getPriceDecimals

```solidity
function getPriceDecimals() public view returns (uint8)
```

## AggregatorV3Interface

### decimals

```solidity
function decimals() external view returns (uint8)
```

### description

```solidity
function description() external view returns (string)
```

### version

```solidity
function version() external view returns (uint256)
```

### getRoundData

```solidity
function getRoundData(uint80 _roundId) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
```

### latestRoundData

```solidity
function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
```

### latestAnswer

```solidity
function latestAnswer() external view returns (uint256 answer)
```

## IUniswapV2Pair

### Approval

```solidity
event Approval(address owner, address spender, uint256 value)
```

### Transfer

```solidity
event Transfer(address from, address to, uint256 value)
```

### name

```solidity
function name() external pure returns (string)
```

### symbol

```solidity
function symbol() external pure returns (string)
```

### decimals

```solidity
function decimals() external pure returns (uint8)
```

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```

### approve

```solidity
function approve(address spender, uint256 value) external returns (bool)
```

### transfer

```solidity
function transfer(address to, uint256 value) external returns (bool)
```

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 value) external returns (bool)
```

### DOMAIN_SEPARATOR

```solidity
function DOMAIN_SEPARATOR() external view returns (bytes32)
```

### PERMIT_TYPEHASH

```solidity
function PERMIT_TYPEHASH() external pure returns (bytes32)
```

### nonces

```solidity
function nonces(address owner) external view returns (uint256)
```

### permit

```solidity
function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external
```

### Mint

```solidity
event Mint(address sender, uint256 amount0, uint256 amount1)
```

### Burn

```solidity
event Burn(address sender, uint256 amount0, uint256 amount1, address to)
```

### Swap

```solidity
event Swap(address sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address to)
```

### Sync

```solidity
event Sync(uint112 reserve0, uint112 reserve1)
```

### MINIMUM_LIQUIDITY

```solidity
function MINIMUM_LIQUIDITY() external pure returns (uint256)
```

### factory

```solidity
function factory() external view returns (address)
```

### token0

```solidity
function token0() external view returns (address)
```

### token1

```solidity
function token1() external view returns (address)
```

### getReserves

```solidity
function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)
```

### price0CumulativeLast

```solidity
function price0CumulativeLast() external view returns (uint256)
```

### price1CumulativeLast

```solidity
function price1CumulativeLast() external view returns (uint256)
```

### kLast

```solidity
function kLast() external view returns (uint256)
```

### mint

```solidity
function mint(address to) external returns (uint256 liquidity)
```

### burn

```solidity
function burn(address to) external returns (uint256 amount0, uint256 amount1)
```

### swap

```solidity
function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes data) external
```

### skim

```solidity
function skim(address to) external
```

### sync

```solidity
function sync() external
```

### initialize

```solidity
function initialize(address, address) external
```

## SafeMath

_Wrappers over Solidity&#x27;s arithmetic operations.

NOTE: &#x60;SafeMath&#x60; is generally not needed starting with Solidity 0.8, since the compiler
now has built in overflow checking._

### tryAdd

```solidity
function tryAdd(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

_Returns the addition of two unsigned integers, with an overflow flag.

_Available since v3.4.__

### trySub

```solidity
function trySub(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

_Returns the substraction of two unsigned integers, with an overflow flag.

_Available since v3.4.__

### tryMul

```solidity
function tryMul(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

_Returns the multiplication of two unsigned integers, with an overflow flag.

_Available since v3.4.__

### tryDiv

```solidity
function tryDiv(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

_Returns the division of two unsigned integers, with a division by zero flag.

_Available since v3.4.__

### tryMod

```solidity
function tryMod(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

_Returns the remainder of dividing two unsigned integers, with a division by zero flag.

_Available since v3.4.__

### add

```solidity
function add(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the addition of two unsigned integers, reverting on
overflow.

Counterpart to Solidity&#x27;s &#x60;+&#x60; operator.

Requirements:

- Addition cannot overflow._

### sub

```solidity
function sub(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the subtraction of two unsigned integers, reverting on
overflow (when the result is negative).

Counterpart to Solidity&#x27;s &#x60;-&#x60; operator.

Requirements:

- Subtraction cannot overflow._

### mul

```solidity
function mul(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the multiplication of two unsigned integers, reverting on
overflow.

Counterpart to Solidity&#x27;s &#x60;*&#x60; operator.

Requirements:

- Multiplication cannot overflow._

### div

```solidity
function div(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the integer division of two unsigned integers, reverting on
division by zero. The result is rounded towards zero.

Counterpart to Solidity&#x27;s &#x60;/&#x60; operator.

Requirements:

- The divisor cannot be zero._

### mod

```solidity
function mod(uint256 a, uint256 b) internal pure returns (uint256)
```

_Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
reverting when dividing by zero.

Counterpart to Solidity&#x27;s &#x60;%&#x60; operator. This function uses a &#x60;revert&#x60;
opcode (which leaves remaining gas untouched) while Solidity uses an
invalid opcode to revert (consuming all remaining gas).

Requirements:

- The divisor cannot be zero._

### sub

```solidity
function sub(uint256 a, uint256 b, string errorMessage) internal pure returns (uint256)
```

_Returns the subtraction of two unsigned integers, reverting with custom message on
overflow (when the result is negative).

CAUTION: This function is deprecated because it requires allocating memory for the error
message unnecessarily. For custom revert reasons use {trySub}.

Counterpart to Solidity&#x27;s &#x60;-&#x60; operator.

Requirements:

- Subtraction cannot overflow._

### div

```solidity
function div(uint256 a, uint256 b, string errorMessage) internal pure returns (uint256)
```

_Returns the integer division of two unsigned integers, reverting with custom message on
division by zero. The result is rounded towards zero.

Counterpart to Solidity&#x27;s &#x60;/&#x60; operator. Note: this function uses a
&#x60;revert&#x60; opcode (which leaves remaining gas untouched) while Solidity
uses an invalid opcode to revert (consuming all remaining gas).

Requirements:

- The divisor cannot be zero._

### mod

```solidity
function mod(uint256 a, uint256 b, string errorMessage) internal pure returns (uint256)
```

_Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
reverting with custom message when dividing by zero.

CAUTION: This function is deprecated because it requires allocating memory for the error
message unnecessarily. For custom revert reasons use {tryMod}.

Counterpart to Solidity&#x27;s &#x60;%&#x60; operator. This function uses a &#x60;revert&#x60;
opcode (which leaves remaining gas untouched) while Solidity uses an
invalid opcode to revert (consuming all remaining gas).

Requirements:

- The divisor cannot be zero._

## UniswapV2Library

### sortTokens

```solidity
function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1)
```

### pairFor

```solidity
function pairFor(address factory, address tokenA, address tokenB) internal pure returns (address pair)
```

### getReserves

```solidity
function getReserves(address factory, address tokenA, address tokenB) internal view returns (uint256 reserveA, uint256 reserveB)
```

### quote

```solidity
function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) internal pure returns (uint256 amountB)
```

### getAmountOut

```solidity
function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256 amountOut)
```

### getAmountIn

```solidity
function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256 amountIn)
```

### getAmountsOut

```solidity
function getAmountsOut(address factory, uint256 amountIn, address[] path) internal view returns (uint256[] amounts)
```

### getAmountsIn

```solidity
function getAmountsIn(address factory, uint256 amountOut, address[] path) internal view returns (uint256[] amounts)
```

## CarefulMath

Derived from OpenZeppelin&#x27;s SafeMath library
        https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/math/SafeMath.sol

### MathError

```solidity
enum MathError {
  NO_ERROR,
  DIVISION_BY_ZERO,
  INTEGER_OVERFLOW,
  INTEGER_UNDERFLOW
}
```

### mulUInt

```solidity
function mulUInt(uint256 a, uint256 b) internal pure returns (enum CarefulMath.MathError, uint256)
```

_Multiplies two numbers, returns an error on overflow._

### divUInt

```solidity
function divUInt(uint256 a, uint256 b) internal pure returns (enum CarefulMath.MathError, uint256)
```

_Integer division of two numbers, truncating the quotient._

### subUInt

```solidity
function subUInt(uint256 a, uint256 b) internal pure returns (enum CarefulMath.MathError, uint256)
```

_Subtracts two numbers, returns an error on overflow (i.e. if subtrahend is greater than minuend)._

### addUInt

```solidity
function addUInt(uint256 a, uint256 b) internal pure returns (enum CarefulMath.MathError, uint256)
```

_Adds two numbers, returns an error on overflow._

### addThenSubUInt

```solidity
function addThenSubUInt(uint256 a, uint256 b, uint256 c) internal pure returns (enum CarefulMath.MathError, uint256)
```

_add a and b and then subtract c_

## BondtrollerErrorReporter

### Error

```solidity
enum Error {
  NO_ERROR,
  UNAUTHORIZED,
  BONDTROLLER_MISMATCH,
  INSUFFICIENT_SHORTFALL,
  INSUFFICIENT_LIQUIDITY,
  INVALID_CLOSE_FACTOR,
  INVALID_COLLATERAL_FACTOR,
  INVALID_LIQUIDATION_INCENTIVE,
  MARKET_NOT_ENTERED,
  MARKET_NOT_LISTED,
  MARKET_ALREADY_LISTED,
  MATH_ERROR,
  NONZERO_BORROW_BALANCE,
  PRICE_ERROR,
  REJECTION,
  SNAPSHOT_ERROR,
  TOO_MANY_ASSETS,
  TOO_MUCH_REPAY
}
```

### FailureInfo

```solidity
enum FailureInfo {
  ACCEPT_ADMIN_PENDING_ADMIN_CHECK,
  ACCEPT_PENDING_IMPLEMENTATION_ADDRESS_CHECK,
  EXIT_MARKET_BALANCE_OWED,
  EXIT_MARKET_REJECTION,
  SET_CLOSE_FACTOR_OWNER_CHECK,
  SET_CLOSE_FACTOR_VALIDATION,
  SET_COLLATERAL_FACTOR_OWNER_CHECK,
  SET_COLLATERAL_FACTOR_NO_EXISTS,
  SET_COLLATERAL_FACTOR_VALIDATION,
  SET_COLLATERAL_FACTOR_WITHOUT_PRICE,
  SET_IMPLEMENTATION_OWNER_CHECK,
  SET_LIQUIDATION_INCENTIVE_OWNER_CHECK,
  SET_LIQUIDATION_INCENTIVE_VALIDATION,
  SET_MAX_ASSETS_OWNER_CHECK,
  SET_PENDING_ADMIN_OWNER_CHECK,
  SET_PENDING_IMPLEMENTATION_OWNER_CHECK,
  SET_PRICE_ORACLE_OWNER_CHECK,
  SUPPORT_MARKET_EXISTS,
  SUPPORT_MARKET_OWNER_CHECK,
  SET_PAUSE_GUARDIAN_OWNER_CHECK
}
```

### Failure

```solidity
event Failure(uint256 error, uint256 info, uint256 detail)
```

_&#x60;error&#x60; corresponds to enum Error; &#x60;info&#x60; corresponds to enum FailureInfo, and &#x60;detail&#x60; is an arbitrary
contract-specific code that enables us to report opaque error codes from upgradeable contracts._

### fail

```solidity
function fail(enum BondtrollerErrorReporter.Error err, enum BondtrollerErrorReporter.FailureInfo info) internal returns (uint256)
```

_use this when reporting a known error from the money market or a non-upgradeable collaborator_

### failOpaque

```solidity
function failOpaque(enum BondtrollerErrorReporter.Error err, enum BondtrollerErrorReporter.FailureInfo info, uint256 opaqueError) internal returns (uint256)
```

_use this when reporting an opaque error from an upgradeable collaborator contract_

## TokenErrorReporter

### Error

```solidity
enum Error {
  NO_ERROR,
  UNAUTHORIZED,
  BAD_INPUT,
  COMPTROLLER_REJECTION,
  COMPTROLLER_CALCULATION_ERROR,
  INTEREST_RATE_MODEL_ERROR,
  INVALID_ACCOUNT_PAIR,
  INVALID_CLOSE_AMOUNT_REQUESTED,
  INVALID_COLLATERAL_FACTOR,
  MATH_ERROR,
  MARKET_NOT_FRESH,
  MARKET_NOT_LISTED,
  TOKEN_INSUFFICIENT_ALLOWANCE,
  TOKEN_INSUFFICIENT_BALANCE,
  TOKEN_INSUFFICIENT_CASH,
  TOKEN_TRANSFER_IN_FAILED,
  TOKEN_TRANSFER_OUT_FAILED
}
```

### FailureInfo

```solidity
enum FailureInfo {
  ACCEPT_ADMIN_PENDING_ADMIN_CHECK,
  ACCRUE_INTEREST_ACCUMULATED_INTEREST_CALCULATION_FAILED,
  ACCRUE_INTEREST_BORROW_RATE_CALCULATION_FAILED,
  ACCRUE_INTEREST_NEW_BORROW_INDEX_CALCULATION_FAILED,
  ACCRUE_INTEREST_NEW_TOTAL_BORROWS_CALCULATION_FAILED,
  ACCRUE_INTEREST_NEW_TOTAL_RESERVES_CALCULATION_FAILED,
  ACCRUE_INTEREST_SIMPLE_INTEREST_FACTOR_CALCULATION_FAILED,
  BORROW_ACCUMULATED_BALANCE_CALCULATION_FAILED,
  BORROW_ACCRUE_INTEREST_FAILED,
  BORROW_CASH_NOT_AVAILABLE,
  BORROW_FRESHNESS_CHECK,
  BORROW_NEW_TOTAL_BALANCE_CALCULATION_FAILED,
  BORROW_NEW_ACCOUNT_BORROW_BALANCE_CALCULATION_FAILED,
  BORROW_MARKET_NOT_LISTED,
  BORROW_COMPTROLLER_REJECTION,
  LIQUIDATE_ACCRUE_BORROW_INTEREST_FAILED,
  LIQUIDATE_ACCRUE_COLLATERAL_INTEREST_FAILED,
  LIQUIDATE_COLLATERAL_FRESHNESS_CHECK,
  LIQUIDATE_COMPTROLLER_REJECTION,
  LIQUIDATE_COMPTROLLER_CALCULATE_AMOUNT_SEIZE_FAILED,
  LIQUIDATE_CLOSE_AMOUNT_IS_UINT_MAX,
  LIQUIDATE_CLOSE_AMOUNT_IS_ZERO,
  LIQUIDATE_FRESHNESS_CHECK,
  LIQUIDATE_LIQUIDATOR_IS_BORROWER,
  LIQUIDATE_REPAY_BORROW_FRESH_FAILED,
  LIQUIDATE_SEIZE_BALANCE_INCREMENT_FAILED,
  LIQUIDATE_SEIZE_BALANCE_DECREMENT_FAILED,
  LIQUIDATE_SEIZE_COMPTROLLER_REJECTION,
  LIQUIDATE_SEIZE_LIQUIDATOR_IS_BORROWER,
  LIQUIDATE_SEIZE_TOO_MUCH,
  MINT_ACCRUE_INTEREST_FAILED,
  MINT_COMPTROLLER_REJECTION,
  MINT_EXCHANGE_CALCULATION_FAILED,
  MINT_EXCHANGE_RATE_READ_FAILED,
  MINT_FRESHNESS_CHECK,
  MINT_NEW_ACCOUNT_BALANCE_CALCULATION_FAILED,
  MINT_NEW_TOTAL_SUPPLY_CALCULATION_FAILED,
  MINT_TRANSFER_IN_FAILED,
  MINT_TRANSFER_IN_NOT_POSSIBLE,
  REDEEM_ACCRUE_INTEREST_FAILED,
  REDEEM_COMPTROLLER_REJECTION,
  REDEEM_EXCHANGE_TOKENS_CALCULATION_FAILED,
  REDEEM_EXCHANGE_AMOUNT_CALCULATION_FAILED,
  REDEEM_EXCHANGE_RATE_READ_FAILED,
  REDEEM_FRESHNESS_CHECK,
  REDEEM_NEW_ACCOUNT_BALANCE_CALCULATION_FAILED,
  REDEEM_NEW_TOTAL_SUPPLY_CALCULATION_FAILED,
  REDEEM_TRANSFER_OUT_NOT_POSSIBLE,
  REDUCE_RESERVES_ACCRUE_INTEREST_FAILED,
  REDUCE_RESERVES_ADMIN_CHECK,
  REDUCE_RESERVES_CASH_NOT_AVAILABLE,
  REDUCE_RESERVES_FRESH_CHECK,
  REDUCE_RESERVES_VALIDATION,
  REPAY_BEHALF_ACCRUE_INTEREST_FAILED,
  REPAY_BORROW_ACCRUE_INTEREST_FAILED,
  REPAY_BORROW_ACCUMULATED_BALANCE_CALCULATION_FAILED,
  REPAY_BORROW_COMPTROLLER_REJECTION,
  REPAY_BORROW_FRESHNESS_CHECK,
  REPAY_BORROW_NEW_ACCOUNT_BORROW_BALANCE_CALCULATION_FAILED,
  REPAY_BORROW_NEW_TOTAL_BALANCE_CALCULATION_FAILED,
  REPAY_BORROW_TRANSFER_IN_NOT_POSSIBLE,
  SET_COLLATERAL_FACTOR_OWNER_CHECK,
  SET_COLLATERAL_FACTOR_VALIDATION,
  SET_COMPTROLLER_OWNER_CHECK,
  SET_INTEREST_RATE_MODEL_ACCRUE_INTEREST_FAILED,
  SET_INTEREST_RATE_MODEL_FRESH_CHECK,
  SET_INTEREST_RATE_MODEL_OWNER_CHECK,
  SET_MAX_ASSETS_OWNER_CHECK,
  SET_ORACLE_MARKET_NOT_LISTED,
  SET_PENDING_ADMIN_OWNER_CHECK,
  SET_RESERVE_FACTOR_ACCRUE_INTEREST_FAILED,
  SET_RESERVE_FACTOR_ADMIN_CHECK,
  SET_RESERVE_FACTOR_FRESH_CHECK,
  SET_RESERVE_FACTOR_BOUNDS_CHECK,
  TRANSFER_COMPTROLLER_REJECTION,
  TRANSFER_NOT_ALLOWED,
  TRANSFER_NOT_ENOUGH,
  TRANSFER_TOO_MUCH,
  ADD_RESERVES_ACCRUE_INTEREST_FAILED,
  ADD_RESERVES_FRESH_CHECK,
  ADD_RESERVES_TRANSFER_IN_NOT_POSSIBLE
}
```

### Failure

```solidity
event Failure(uint256 error, uint256 info, uint256 detail)
```

_&#x60;error&#x60; corresponds to enum Error; &#x60;info&#x60; corresponds to enum FailureInfo, and &#x60;detail&#x60; is an arbitrary
contract-specific code that enables us to report opaque error codes from upgradeable contracts._

### fail

```solidity
function fail(enum TokenErrorReporter.Error err, enum TokenErrorReporter.FailureInfo info) internal returns (uint256)
```

_use this when reporting a known error from the money market or a non-upgradeable collaborator_

### failOpaque

```solidity
function failOpaque(enum TokenErrorReporter.Error err, enum TokenErrorReporter.FailureInfo info, uint256 opaqueError) internal returns (uint256)
```

_use this when reporting an opaque error from an upgradeable collaborator contract_

## Exponential

Exp is a struct which stores decimals with a fixed precision of 18 decimal places.
        Thus, if we wanted to store the 5.1, mantissa would store 5.1e18. That is:
        &#x60;Exp({mantissa: 5100000000000000000})&#x60;.

_Legacy contract for compatibility reasons with existing contracts that still use MathError_

### getExp

```solidity
function getExp(uint256 num, uint256 denom) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Creates an exponential from numerator and denominator values.
     Note: Returns an error if (&#x60;num&#x60; * 10e18) &gt; MAX_INT,
           or if &#x60;denom&#x60; is zero._

### addExp

```solidity
function addExp(struct ExponentialNoError.Exp a, struct ExponentialNoError.Exp b) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Adds two exponentials, returning a new exponential._

### subExp

```solidity
function subExp(struct ExponentialNoError.Exp a, struct ExponentialNoError.Exp b) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Subtracts two exponentials, returning a new exponential._

### mulScalar

```solidity
function mulScalar(struct ExponentialNoError.Exp a, uint256 scalar) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Multiply an Exp by a scalar, returning a new Exp._

### mulScalarTruncate

```solidity
function mulScalarTruncate(struct ExponentialNoError.Exp a, uint256 scalar) internal pure returns (enum CarefulMath.MathError, uint256)
```

_Multiply an Exp by a scalar, then truncate to return an unsigned integer._

### mulScalarTruncateAddUInt

```solidity
function mulScalarTruncateAddUInt(struct ExponentialNoError.Exp a, uint256 scalar, uint256 addend) internal pure returns (enum CarefulMath.MathError, uint256)
```

_Multiply an Exp by a scalar, truncate, then add an to an unsigned integer, returning an unsigned integer._

### divScalar

```solidity
function divScalar(struct ExponentialNoError.Exp a, uint256 scalar) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Divide an Exp by a scalar, returning a new Exp._

### divScalarByExp

```solidity
function divScalarByExp(uint256 scalar, struct ExponentialNoError.Exp divisor) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Divide a scalar by an Exp, returning a new Exp._

### divScalarByExpTruncate

```solidity
function divScalarByExpTruncate(uint256 scalar, struct ExponentialNoError.Exp divisor) internal pure returns (enum CarefulMath.MathError, uint256)
```

_Divide a scalar by an Exp, then truncate to return an unsigned integer._

### mulExp

```solidity
function mulExp(struct ExponentialNoError.Exp a, struct ExponentialNoError.Exp b) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Multiplies two exponentials, returning a new exponential._

### mulExp

```solidity
function mulExp(uint256 a, uint256 b) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Multiplies two exponentials given their mantissas, returning a new exponential._

### mulExp3

```solidity
function mulExp3(struct ExponentialNoError.Exp a, struct ExponentialNoError.Exp b, struct ExponentialNoError.Exp c) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Multiplies three exponentials, returning a new exponential._

### divExp

```solidity
function divExp(struct ExponentialNoError.Exp a, struct ExponentialNoError.Exp b) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Divides two exponentials, returning a new exponential.
    (a/scale) / (b/scale) &#x3D; (a/scale) * (scale/b) &#x3D; a/b,
 which we can scale as an Exp by calling getExp(a.mantissa, b.mantissa)_

## ExponentialNoError

Exp is a struct which stores decimals with a fixed precision of 18 decimal places.
        Thus, if we wanted to store the 5.1, mantissa would store 5.1e18. That is:
        &#x60;Exp({mantissa: 5100000000000000000})&#x60;.

### expScale

```solidity
uint256 expScale
```

### doubleScale

```solidity
uint256 doubleScale
```

### halfExpScale

```solidity
uint256 halfExpScale
```

### mantissaOne

```solidity
uint256 mantissaOne
```

### Exp

```solidity
struct Exp {
  uint256 mantissa;
}
```

### Double

```solidity
struct Double {
  uint256 mantissa;
}
```

### truncate

```solidity
function truncate(struct ExponentialNoError.Exp exp) internal pure returns (uint256)
```

_Truncates the given exp to a whole number value.
     For example, truncate(Exp{mantissa: 15 * expScale}) &#x3D; 15_

### mul_ScalarTruncate

```solidity
function mul_ScalarTruncate(struct ExponentialNoError.Exp a, uint256 scalar) internal pure returns (uint256)
```

_Multiply an Exp by a scalar, then truncate to return an unsigned integer._

### mul_ScalarTruncateAddUInt

```solidity
function mul_ScalarTruncateAddUInt(struct ExponentialNoError.Exp a, uint256 scalar, uint256 addend) internal pure returns (uint256)
```

_Multiply an Exp by a scalar, truncate, then add an to an unsigned integer, returning an unsigned integer._

### lessThanExp

```solidity
function lessThanExp(struct ExponentialNoError.Exp left, struct ExponentialNoError.Exp right) internal pure returns (bool)
```

_Checks if first Exp is less than second Exp._

### lessThanOrEqualExp

```solidity
function lessThanOrEqualExp(struct ExponentialNoError.Exp left, struct ExponentialNoError.Exp right) internal pure returns (bool)
```

_Checks if left Exp &lt;&#x3D; right Exp._

### greaterThanExp

```solidity
function greaterThanExp(struct ExponentialNoError.Exp left, struct ExponentialNoError.Exp right) internal pure returns (bool)
```

_Checks if left Exp &gt; right Exp._

### isZeroExp

```solidity
function isZeroExp(struct ExponentialNoError.Exp value) internal pure returns (bool)
```

_returns true if Exp is exactly zero_

### safe224

```solidity
function safe224(uint256 n, string errorMessage) internal pure returns (uint224)
```

### safe32

```solidity
function safe32(uint256 n, string errorMessage) internal pure returns (uint32)
```

### add_

```solidity
function add_(struct ExponentialNoError.Exp a, struct ExponentialNoError.Exp b) internal pure returns (struct ExponentialNoError.Exp)
```

### add_

```solidity
function add_(struct ExponentialNoError.Double a, struct ExponentialNoError.Double b) internal pure returns (struct ExponentialNoError.Double)
```

### add_

```solidity
function add_(uint256 a, uint256 b) internal pure returns (uint256)
```

### add_

```solidity
function add_(uint256 a, uint256 b, string errorMessage) internal pure returns (uint256)
```

### sub_

```solidity
function sub_(struct ExponentialNoError.Exp a, struct ExponentialNoError.Exp b) internal pure returns (struct ExponentialNoError.Exp)
```

### sub_

```solidity
function sub_(struct ExponentialNoError.Double a, struct ExponentialNoError.Double b) internal pure returns (struct ExponentialNoError.Double)
```

### sub_

```solidity
function sub_(uint256 a, uint256 b) internal pure returns (uint256)
```

### sub_

```solidity
function sub_(uint256 a, uint256 b, string errorMessage) internal pure returns (uint256)
```

### mul_

```solidity
function mul_(struct ExponentialNoError.Exp a, struct ExponentialNoError.Exp b) internal pure returns (struct ExponentialNoError.Exp)
```

### mul_

```solidity
function mul_(struct ExponentialNoError.Exp a, uint256 b) internal pure returns (struct ExponentialNoError.Exp)
```

### mul_

```solidity
function mul_(uint256 a, struct ExponentialNoError.Exp b) internal pure returns (uint256)
```

### mul_

```solidity
function mul_(struct ExponentialNoError.Double a, struct ExponentialNoError.Double b) internal pure returns (struct ExponentialNoError.Double)
```

### mul_

```solidity
function mul_(struct ExponentialNoError.Double a, uint256 b) internal pure returns (struct ExponentialNoError.Double)
```

### mul_

```solidity
function mul_(uint256 a, struct ExponentialNoError.Double b) internal pure returns (uint256)
```

### mul_

```solidity
function mul_(uint256 a, uint256 b) internal pure returns (uint256)
```

### mul_

```solidity
function mul_(uint256 a, uint256 b, string errorMessage) internal pure returns (uint256)
```

### div_

```solidity
function div_(struct ExponentialNoError.Exp a, struct ExponentialNoError.Exp b) internal pure returns (struct ExponentialNoError.Exp)
```

### div_

```solidity
function div_(struct ExponentialNoError.Exp a, uint256 b) internal pure returns (struct ExponentialNoError.Exp)
```

### div_

```solidity
function div_(uint256 a, struct ExponentialNoError.Exp b) internal pure returns (uint256)
```

### div_

```solidity
function div_(struct ExponentialNoError.Double a, struct ExponentialNoError.Double b) internal pure returns (struct ExponentialNoError.Double)
```

### div_

```solidity
function div_(struct ExponentialNoError.Double a, uint256 b) internal pure returns (struct ExponentialNoError.Double)
```

### div_

```solidity
function div_(uint256 a, struct ExponentialNoError.Double b) internal pure returns (uint256)
```

### div_

```solidity
function div_(uint256 a, uint256 b) internal pure returns (uint256)
```

### div_

```solidity
function div_(uint256 a, uint256 b, string errorMessage) internal pure returns (uint256)
```

### fraction

```solidity
function fraction(uint256 a, uint256 b) internal pure returns (struct ExponentialNoError.Double)
```

## console

### CONSOLE_ADDRESS

```solidity
address CONSOLE_ADDRESS
```

### _sendLogPayload

```solidity
function _sendLogPayload(bytes payload) private view
```

### log

```solidity
function log() internal view
```

### logInt

```solidity
function logInt(int256 p0) internal view
```

### logUint

```solidity
function logUint(uint256 p0) internal view
```

### logString

```solidity
function logString(string p0) internal view
```

### logBool

```solidity
function logBool(bool p0) internal view
```

### logAddress

```solidity
function logAddress(address p0) internal view
```

### logBytes

```solidity
function logBytes(bytes p0) internal view
```

### logBytes1

```solidity
function logBytes1(bytes1 p0) internal view
```

### logBytes2

```solidity
function logBytes2(bytes2 p0) internal view
```

### logBytes3

```solidity
function logBytes3(bytes3 p0) internal view
```

### logBytes4

```solidity
function logBytes4(bytes4 p0) internal view
```

### logBytes5

```solidity
function logBytes5(bytes5 p0) internal view
```

### logBytes6

```solidity
function logBytes6(bytes6 p0) internal view
```

### logBytes7

```solidity
function logBytes7(bytes7 p0) internal view
```

### logBytes8

```solidity
function logBytes8(bytes8 p0) internal view
```

### logBytes9

```solidity
function logBytes9(bytes9 p0) internal view
```

### logBytes10

```solidity
function logBytes10(bytes10 p0) internal view
```

### logBytes11

```solidity
function logBytes11(bytes11 p0) internal view
```

### logBytes12

```solidity
function logBytes12(bytes12 p0) internal view
```

### logBytes13

```solidity
function logBytes13(bytes13 p0) internal view
```

### logBytes14

```solidity
function logBytes14(bytes14 p0) internal view
```

### logBytes15

```solidity
function logBytes15(bytes15 p0) internal view
```

### logBytes16

```solidity
function logBytes16(bytes16 p0) internal view
```

### logBytes17

```solidity
function logBytes17(bytes17 p0) internal view
```

### logBytes18

```solidity
function logBytes18(bytes18 p0) internal view
```

### logBytes19

```solidity
function logBytes19(bytes19 p0) internal view
```

### logBytes20

```solidity
function logBytes20(bytes20 p0) internal view
```

### logBytes21

```solidity
function logBytes21(bytes21 p0) internal view
```

### logBytes22

```solidity
function logBytes22(bytes22 p0) internal view
```

### logBytes23

```solidity
function logBytes23(bytes23 p0) internal view
```

### logBytes24

```solidity
function logBytes24(bytes24 p0) internal view
```

### logBytes25

```solidity
function logBytes25(bytes25 p0) internal view
```

### logBytes26

```solidity
function logBytes26(bytes26 p0) internal view
```

### logBytes27

```solidity
function logBytes27(bytes27 p0) internal view
```

### logBytes28

```solidity
function logBytes28(bytes28 p0) internal view
```

### logBytes29

```solidity
function logBytes29(bytes29 p0) internal view
```

### logBytes30

```solidity
function logBytes30(bytes30 p0) internal view
```

### logBytes31

```solidity
function logBytes31(bytes31 p0) internal view
```

### logBytes32

```solidity
function logBytes32(bytes32 p0) internal view
```

### log

```solidity
function log(uint256 p0) internal view
```

### log

```solidity
function log(string p0) internal view
```

### log

```solidity
function log(bool p0) internal view
```

### log

```solidity
function log(address p0) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1) internal view
```

### log

```solidity
function log(uint256 p0, string p1) internal view
```

### log

```solidity
function log(uint256 p0, bool p1) internal view
```

### log

```solidity
function log(uint256 p0, address p1) internal view
```

### log

```solidity
function log(string p0, uint256 p1) internal view
```

### log

```solidity
function log(string p0, string p1) internal view
```

### log

```solidity
function log(string p0, bool p1) internal view
```

### log

```solidity
function log(string p0, address p1) internal view
```

### log

```solidity
function log(bool p0, uint256 p1) internal view
```

### log

```solidity
function log(bool p0, string p1) internal view
```

### log

```solidity
function log(bool p0, bool p1) internal view
```

### log

```solidity
function log(bool p0, address p1) internal view
```

### log

```solidity
function log(address p0, uint256 p1) internal view
```

### log

```solidity
function log(address p0, string p1) internal view
```

### log

```solidity
function log(address p0, bool p1) internal view
```

### log

```solidity
function log(address p0, address p1) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, uint256 p2) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, string p2) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, bool p2) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, address p2) internal view
```

### log

```solidity
function log(uint256 p0, string p1, uint256 p2) internal view
```

### log

```solidity
function log(uint256 p0, string p1, string p2) internal view
```

### log

```solidity
function log(uint256 p0, string p1, bool p2) internal view
```

### log

```solidity
function log(uint256 p0, string p1, address p2) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, uint256 p2) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, string p2) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, bool p2) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, address p2) internal view
```

### log

```solidity
function log(uint256 p0, address p1, uint256 p2) internal view
```

### log

```solidity
function log(uint256 p0, address p1, string p2) internal view
```

### log

```solidity
function log(uint256 p0, address p1, bool p2) internal view
```

### log

```solidity
function log(uint256 p0, address p1, address p2) internal view
```

### log

```solidity
function log(string p0, uint256 p1, uint256 p2) internal view
```

### log

```solidity
function log(string p0, uint256 p1, string p2) internal view
```

### log

```solidity
function log(string p0, uint256 p1, bool p2) internal view
```

### log

```solidity
function log(string p0, uint256 p1, address p2) internal view
```

### log

```solidity
function log(string p0, string p1, uint256 p2) internal view
```

### log

```solidity
function log(string p0, string p1, string p2) internal view
```

### log

```solidity
function log(string p0, string p1, bool p2) internal view
```

### log

```solidity
function log(string p0, string p1, address p2) internal view
```

### log

```solidity
function log(string p0, bool p1, uint256 p2) internal view
```

### log

```solidity
function log(string p0, bool p1, string p2) internal view
```

### log

```solidity
function log(string p0, bool p1, bool p2) internal view
```

### log

```solidity
function log(string p0, bool p1, address p2) internal view
```

### log

```solidity
function log(string p0, address p1, uint256 p2) internal view
```

### log

```solidity
function log(string p0, address p1, string p2) internal view
```

### log

```solidity
function log(string p0, address p1, bool p2) internal view
```

### log

```solidity
function log(string p0, address p1, address p2) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, uint256 p2) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, string p2) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, bool p2) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, address p2) internal view
```

### log

```solidity
function log(bool p0, string p1, uint256 p2) internal view
```

### log

```solidity
function log(bool p0, string p1, string p2) internal view
```

### log

```solidity
function log(bool p0, string p1, bool p2) internal view
```

### log

```solidity
function log(bool p0, string p1, address p2) internal view
```

### log

```solidity
function log(bool p0, bool p1, uint256 p2) internal view
```

### log

```solidity
function log(bool p0, bool p1, string p2) internal view
```

### log

```solidity
function log(bool p0, bool p1, bool p2) internal view
```

### log

```solidity
function log(bool p0, bool p1, address p2) internal view
```

### log

```solidity
function log(bool p0, address p1, uint256 p2) internal view
```

### log

```solidity
function log(bool p0, address p1, string p2) internal view
```

### log

```solidity
function log(bool p0, address p1, bool p2) internal view
```

### log

```solidity
function log(bool p0, address p1, address p2) internal view
```

### log

```solidity
function log(address p0, uint256 p1, uint256 p2) internal view
```

### log

```solidity
function log(address p0, uint256 p1, string p2) internal view
```

### log

```solidity
function log(address p0, uint256 p1, bool p2) internal view
```

### log

```solidity
function log(address p0, uint256 p1, address p2) internal view
```

### log

```solidity
function log(address p0, string p1, uint256 p2) internal view
```

### log

```solidity
function log(address p0, string p1, string p2) internal view
```

### log

```solidity
function log(address p0, string p1, bool p2) internal view
```

### log

```solidity
function log(address p0, string p1, address p2) internal view
```

### log

```solidity
function log(address p0, bool p1, uint256 p2) internal view
```

### log

```solidity
function log(address p0, bool p1, string p2) internal view
```

### log

```solidity
function log(address p0, bool p1, bool p2) internal view
```

### log

```solidity
function log(address p0, bool p1, address p2) internal view
```

### log

```solidity
function log(address p0, address p1, uint256 p2) internal view
```

### log

```solidity
function log(address p0, address p1, string p2) internal view
```

### log

```solidity
function log(address p0, address p1, bool p2) internal view
```

### log

```solidity
function log(address p0, address p1, address p2) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, uint256 p2, uint256 p3) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, uint256 p2, string p3) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, uint256 p2, bool p3) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, uint256 p2, address p3) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, string p2, uint256 p3) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, string p2, string p3) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, string p2, bool p3) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, string p2, address p3) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, bool p2, uint256 p3) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, bool p2, string p3) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, bool p2, bool p3) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, bool p2, address p3) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, address p2, uint256 p3) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, address p2, string p3) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, address p2, bool p3) internal view
```

### log

```solidity
function log(uint256 p0, uint256 p1, address p2, address p3) internal view
```

### log

```solidity
function log(uint256 p0, string p1, uint256 p2, uint256 p3) internal view
```

### log

```solidity
function log(uint256 p0, string p1, uint256 p2, string p3) internal view
```

### log

```solidity
function log(uint256 p0, string p1, uint256 p2, bool p3) internal view
```

### log

```solidity
function log(uint256 p0, string p1, uint256 p2, address p3) internal view
```

### log

```solidity
function log(uint256 p0, string p1, string p2, uint256 p3) internal view
```

### log

```solidity
function log(uint256 p0, string p1, string p2, string p3) internal view
```

### log

```solidity
function log(uint256 p0, string p1, string p2, bool p3) internal view
```

### log

```solidity
function log(uint256 p0, string p1, string p2, address p3) internal view
```

### log

```solidity
function log(uint256 p0, string p1, bool p2, uint256 p3) internal view
```

### log

```solidity
function log(uint256 p0, string p1, bool p2, string p3) internal view
```

### log

```solidity
function log(uint256 p0, string p1, bool p2, bool p3) internal view
```

### log

```solidity
function log(uint256 p0, string p1, bool p2, address p3) internal view
```

### log

```solidity
function log(uint256 p0, string p1, address p2, uint256 p3) internal view
```

### log

```solidity
function log(uint256 p0, string p1, address p2, string p3) internal view
```

### log

```solidity
function log(uint256 p0, string p1, address p2, bool p3) internal view
```

### log

```solidity
function log(uint256 p0, string p1, address p2, address p3) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, uint256 p2, uint256 p3) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, uint256 p2, string p3) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, uint256 p2, bool p3) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, uint256 p2, address p3) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, string p2, uint256 p3) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, string p2, string p3) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, string p2, bool p3) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, string p2, address p3) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, bool p2, uint256 p3) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, bool p2, string p3) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, bool p2, bool p3) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, bool p2, address p3) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, address p2, uint256 p3) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, address p2, string p3) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, address p2, bool p3) internal view
```

### log

```solidity
function log(uint256 p0, bool p1, address p2, address p3) internal view
```

### log

```solidity
function log(uint256 p0, address p1, uint256 p2, uint256 p3) internal view
```

### log

```solidity
function log(uint256 p0, address p1, uint256 p2, string p3) internal view
```

### log

```solidity
function log(uint256 p0, address p1, uint256 p2, bool p3) internal view
```

### log

```solidity
function log(uint256 p0, address p1, uint256 p2, address p3) internal view
```

### log

```solidity
function log(uint256 p0, address p1, string p2, uint256 p3) internal view
```

### log

```solidity
function log(uint256 p0, address p1, string p2, string p3) internal view
```

### log

```solidity
function log(uint256 p0, address p1, string p2, bool p3) internal view
```

### log

```solidity
function log(uint256 p0, address p1, string p2, address p3) internal view
```

### log

```solidity
function log(uint256 p0, address p1, bool p2, uint256 p3) internal view
```

### log

```solidity
function log(uint256 p0, address p1, bool p2, string p3) internal view
```

### log

```solidity
function log(uint256 p0, address p1, bool p2, bool p3) internal view
```

### log

```solidity
function log(uint256 p0, address p1, bool p2, address p3) internal view
```

### log

```solidity
function log(uint256 p0, address p1, address p2, uint256 p3) internal view
```

### log

```solidity
function log(uint256 p0, address p1, address p2, string p3) internal view
```

### log

```solidity
function log(uint256 p0, address p1, address p2, bool p3) internal view
```

### log

```solidity
function log(uint256 p0, address p1, address p2, address p3) internal view
```

### log

```solidity
function log(string p0, uint256 p1, uint256 p2, uint256 p3) internal view
```

### log

```solidity
function log(string p0, uint256 p1, uint256 p2, string p3) internal view
```

### log

```solidity
function log(string p0, uint256 p1, uint256 p2, bool p3) internal view
```

### log

```solidity
function log(string p0, uint256 p1, uint256 p2, address p3) internal view
```

### log

```solidity
function log(string p0, uint256 p1, string p2, uint256 p3) internal view
```

### log

```solidity
function log(string p0, uint256 p1, string p2, string p3) internal view
```

### log

```solidity
function log(string p0, uint256 p1, string p2, bool p3) internal view
```

### log

```solidity
function log(string p0, uint256 p1, string p2, address p3) internal view
```

### log

```solidity
function log(string p0, uint256 p1, bool p2, uint256 p3) internal view
```

### log

```solidity
function log(string p0, uint256 p1, bool p2, string p3) internal view
```

### log

```solidity
function log(string p0, uint256 p1, bool p2, bool p3) internal view
```

### log

```solidity
function log(string p0, uint256 p1, bool p2, address p3) internal view
```

### log

```solidity
function log(string p0, uint256 p1, address p2, uint256 p3) internal view
```

### log

```solidity
function log(string p0, uint256 p1, address p2, string p3) internal view
```

### log

```solidity
function log(string p0, uint256 p1, address p2, bool p3) internal view
```

### log

```solidity
function log(string p0, uint256 p1, address p2, address p3) internal view
```

### log

```solidity
function log(string p0, string p1, uint256 p2, uint256 p3) internal view
```

### log

```solidity
function log(string p0, string p1, uint256 p2, string p3) internal view
```

### log

```solidity
function log(string p0, string p1, uint256 p2, bool p3) internal view
```

### log

```solidity
function log(string p0, string p1, uint256 p2, address p3) internal view
```

### log

```solidity
function log(string p0, string p1, string p2, uint256 p3) internal view
```

### log

```solidity
function log(string p0, string p1, string p2, string p3) internal view
```

### log

```solidity
function log(string p0, string p1, string p2, bool p3) internal view
```

### log

```solidity
function log(string p0, string p1, string p2, address p3) internal view
```

### log

```solidity
function log(string p0, string p1, bool p2, uint256 p3) internal view
```

### log

```solidity
function log(string p0, string p1, bool p2, string p3) internal view
```

### log

```solidity
function log(string p0, string p1, bool p2, bool p3) internal view
```

### log

```solidity
function log(string p0, string p1, bool p2, address p3) internal view
```

### log

```solidity
function log(string p0, string p1, address p2, uint256 p3) internal view
```

### log

```solidity
function log(string p0, string p1, address p2, string p3) internal view
```

### log

```solidity
function log(string p0, string p1, address p2, bool p3) internal view
```

### log

```solidity
function log(string p0, string p1, address p2, address p3) internal view
```

### log

```solidity
function log(string p0, bool p1, uint256 p2, uint256 p3) internal view
```

### log

```solidity
function log(string p0, bool p1, uint256 p2, string p3) internal view
```

### log

```solidity
function log(string p0, bool p1, uint256 p2, bool p3) internal view
```

### log

```solidity
function log(string p0, bool p1, uint256 p2, address p3) internal view
```

### log

```solidity
function log(string p0, bool p1, string p2, uint256 p3) internal view
```

### log

```solidity
function log(string p0, bool p1, string p2, string p3) internal view
```

### log

```solidity
function log(string p0, bool p1, string p2, bool p3) internal view
```

### log

```solidity
function log(string p0, bool p1, string p2, address p3) internal view
```

### log

```solidity
function log(string p0, bool p1, bool p2, uint256 p3) internal view
```

### log

```solidity
function log(string p0, bool p1, bool p2, string p3) internal view
```

### log

```solidity
function log(string p0, bool p1, bool p2, bool p3) internal view
```

### log

```solidity
function log(string p0, bool p1, bool p2, address p3) internal view
```

### log

```solidity
function log(string p0, bool p1, address p2, uint256 p3) internal view
```

### log

```solidity
function log(string p0, bool p1, address p2, string p3) internal view
```

### log

```solidity
function log(string p0, bool p1, address p2, bool p3) internal view
```

### log

```solidity
function log(string p0, bool p1, address p2, address p3) internal view
```

### log

```solidity
function log(string p0, address p1, uint256 p2, uint256 p3) internal view
```

### log

```solidity
function log(string p0, address p1, uint256 p2, string p3) internal view
```

### log

```solidity
function log(string p0, address p1, uint256 p2, bool p3) internal view
```

### log

```solidity
function log(string p0, address p1, uint256 p2, address p3) internal view
```

### log

```solidity
function log(string p0, address p1, string p2, uint256 p3) internal view
```

### log

```solidity
function log(string p0, address p1, string p2, string p3) internal view
```

### log

```solidity
function log(string p0, address p1, string p2, bool p3) internal view
```

### log

```solidity
function log(string p0, address p1, string p2, address p3) internal view
```

### log

```solidity
function log(string p0, address p1, bool p2, uint256 p3) internal view
```

### log

```solidity
function log(string p0, address p1, bool p2, string p3) internal view
```

### log

```solidity
function log(string p0, address p1, bool p2, bool p3) internal view
```

### log

```solidity
function log(string p0, address p1, bool p2, address p3) internal view
```

### log

```solidity
function log(string p0, address p1, address p2, uint256 p3) internal view
```

### log

```solidity
function log(string p0, address p1, address p2, string p3) internal view
```

### log

```solidity
function log(string p0, address p1, address p2, bool p3) internal view
```

### log

```solidity
function log(string p0, address p1, address p2, address p3) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, uint256 p2, uint256 p3) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, uint256 p2, string p3) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, uint256 p2, bool p3) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, uint256 p2, address p3) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, string p2, uint256 p3) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, string p2, string p3) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, string p2, bool p3) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, string p2, address p3) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, bool p2, uint256 p3) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, bool p2, string p3) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, bool p2, bool p3) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, bool p2, address p3) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, address p2, uint256 p3) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, address p2, string p3) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, address p2, bool p3) internal view
```

### log

```solidity
function log(bool p0, uint256 p1, address p2, address p3) internal view
```

### log

```solidity
function log(bool p0, string p1, uint256 p2, uint256 p3) internal view
```

### log

```solidity
function log(bool p0, string p1, uint256 p2, string p3) internal view
```

### log

```solidity
function log(bool p0, string p1, uint256 p2, bool p3) internal view
```

### log

```solidity
function log(bool p0, string p1, uint256 p2, address p3) internal view
```

### log

```solidity
function log(bool p0, string p1, string p2, uint256 p3) internal view
```

### log

```solidity
function log(bool p0, string p1, string p2, string p3) internal view
```

### log

```solidity
function log(bool p0, string p1, string p2, bool p3) internal view
```

### log

```solidity
function log(bool p0, string p1, string p2, address p3) internal view
```

### log

```solidity
function log(bool p0, string p1, bool p2, uint256 p3) internal view
```

### log

```solidity
function log(bool p0, string p1, bool p2, string p3) internal view
```

### log

```solidity
function log(bool p0, string p1, bool p2, bool p3) internal view
```

### log

```solidity
function log(bool p0, string p1, bool p2, address p3) internal view
```

### log

```solidity
function log(bool p0, string p1, address p2, uint256 p3) internal view
```

### log

```solidity
function log(bool p0, string p1, address p2, string p3) internal view
```

### log

```solidity
function log(bool p0, string p1, address p2, bool p3) internal view
```

### log

```solidity
function log(bool p0, string p1, address p2, address p3) internal view
```

### log

```solidity
function log(bool p0, bool p1, uint256 p2, uint256 p3) internal view
```

### log

```solidity
function log(bool p0, bool p1, uint256 p2, string p3) internal view
```

### log

```solidity
function log(bool p0, bool p1, uint256 p2, bool p3) internal view
```

### log

```solidity
function log(bool p0, bool p1, uint256 p2, address p3) internal view
```

### log

```solidity
function log(bool p0, bool p1, string p2, uint256 p3) internal view
```

### log

```solidity
function log(bool p0, bool p1, string p2, string p3) internal view
```

### log

```solidity
function log(bool p0, bool p1, string p2, bool p3) internal view
```

### log

```solidity
function log(bool p0, bool p1, string p2, address p3) internal view
```

### log

```solidity
function log(bool p0, bool p1, bool p2, uint256 p3) internal view
```

### log

```solidity
function log(bool p0, bool p1, bool p2, string p3) internal view
```

### log

```solidity
function log(bool p0, bool p1, bool p2, bool p3) internal view
```

### log

```solidity
function log(bool p0, bool p1, bool p2, address p3) internal view
```

### log

```solidity
function log(bool p0, bool p1, address p2, uint256 p3) internal view
```

### log

```solidity
function log(bool p0, bool p1, address p2, string p3) internal view
```

### log

```solidity
function log(bool p0, bool p1, address p2, bool p3) internal view
```

### log

```solidity
function log(bool p0, bool p1, address p2, address p3) internal view
```

### log

```solidity
function log(bool p0, address p1, uint256 p2, uint256 p3) internal view
```

### log

```solidity
function log(bool p0, address p1, uint256 p2, string p3) internal view
```

### log

```solidity
function log(bool p0, address p1, uint256 p2, bool p3) internal view
```

### log

```solidity
function log(bool p0, address p1, uint256 p2, address p3) internal view
```

### log

```solidity
function log(bool p0, address p1, string p2, uint256 p3) internal view
```

### log

```solidity
function log(bool p0, address p1, string p2, string p3) internal view
```

### log

```solidity
function log(bool p0, address p1, string p2, bool p3) internal view
```

### log

```solidity
function log(bool p0, address p1, string p2, address p3) internal view
```

### log

```solidity
function log(bool p0, address p1, bool p2, uint256 p3) internal view
```

### log

```solidity
function log(bool p0, address p1, bool p2, string p3) internal view
```

### log

```solidity
function log(bool p0, address p1, bool p2, bool p3) internal view
```

### log

```solidity
function log(bool p0, address p1, bool p2, address p3) internal view
```

### log

```solidity
function log(bool p0, address p1, address p2, uint256 p3) internal view
```

### log

```solidity
function log(bool p0, address p1, address p2, string p3) internal view
```

### log

```solidity
function log(bool p0, address p1, address p2, bool p3) internal view
```

### log

```solidity
function log(bool p0, address p1, address p2, address p3) internal view
```

### log

```solidity
function log(address p0, uint256 p1, uint256 p2, uint256 p3) internal view
```

### log

```solidity
function log(address p0, uint256 p1, uint256 p2, string p3) internal view
```

### log

```solidity
function log(address p0, uint256 p1, uint256 p2, bool p3) internal view
```

### log

```solidity
function log(address p0, uint256 p1, uint256 p2, address p3) internal view
```

### log

```solidity
function log(address p0, uint256 p1, string p2, uint256 p3) internal view
```

### log

```solidity
function log(address p0, uint256 p1, string p2, string p3) internal view
```

### log

```solidity
function log(address p0, uint256 p1, string p2, bool p3) internal view
```

### log

```solidity
function log(address p0, uint256 p1, string p2, address p3) internal view
```

### log

```solidity
function log(address p0, uint256 p1, bool p2, uint256 p3) internal view
```

### log

```solidity
function log(address p0, uint256 p1, bool p2, string p3) internal view
```

### log

```solidity
function log(address p0, uint256 p1, bool p2, bool p3) internal view
```

### log

```solidity
function log(address p0, uint256 p1, bool p2, address p3) internal view
```

### log

```solidity
function log(address p0, uint256 p1, address p2, uint256 p3) internal view
```

### log

```solidity
function log(address p0, uint256 p1, address p2, string p3) internal view
```

### log

```solidity
function log(address p0, uint256 p1, address p2, bool p3) internal view
```

### log

```solidity
function log(address p0, uint256 p1, address p2, address p3) internal view
```

### log

```solidity
function log(address p0, string p1, uint256 p2, uint256 p3) internal view
```

### log

```solidity
function log(address p0, string p1, uint256 p2, string p3) internal view
```

### log

```solidity
function log(address p0, string p1, uint256 p2, bool p3) internal view
```

### log

```solidity
function log(address p0, string p1, uint256 p2, address p3) internal view
```

### log

```solidity
function log(address p0, string p1, string p2, uint256 p3) internal view
```

### log

```solidity
function log(address p0, string p1, string p2, string p3) internal view
```

### log

```solidity
function log(address p0, string p1, string p2, bool p3) internal view
```

### log

```solidity
function log(address p0, string p1, string p2, address p3) internal view
```

### log

```solidity
function log(address p0, string p1, bool p2, uint256 p3) internal view
```

### log

```solidity
function log(address p0, string p1, bool p2, string p3) internal view
```

### log

```solidity
function log(address p0, string p1, bool p2, bool p3) internal view
```

### log

```solidity
function log(address p0, string p1, bool p2, address p3) internal view
```

### log

```solidity
function log(address p0, string p1, address p2, uint256 p3) internal view
```

### log

```solidity
function log(address p0, string p1, address p2, string p3) internal view
```

### log

```solidity
function log(address p0, string p1, address p2, bool p3) internal view
```

### log

```solidity
function log(address p0, string p1, address p2, address p3) internal view
```

### log

```solidity
function log(address p0, bool p1, uint256 p2, uint256 p3) internal view
```

### log

```solidity
function log(address p0, bool p1, uint256 p2, string p3) internal view
```

### log

```solidity
function log(address p0, bool p1, uint256 p2, bool p3) internal view
```

### log

```solidity
function log(address p0, bool p1, uint256 p2, address p3) internal view
```

### log

```solidity
function log(address p0, bool p1, string p2, uint256 p3) internal view
```

### log

```solidity
function log(address p0, bool p1, string p2, string p3) internal view
```

### log

```solidity
function log(address p0, bool p1, string p2, bool p3) internal view
```

### log

```solidity
function log(address p0, bool p1, string p2, address p3) internal view
```

### log

```solidity
function log(address p0, bool p1, bool p2, uint256 p3) internal view
```

### log

```solidity
function log(address p0, bool p1, bool p2, string p3) internal view
```

### log

```solidity
function log(address p0, bool p1, bool p2, bool p3) internal view
```

### log

```solidity
function log(address p0, bool p1, bool p2, address p3) internal view
```

### log

```solidity
function log(address p0, bool p1, address p2, uint256 p3) internal view
```

### log

```solidity
function log(address p0, bool p1, address p2, string p3) internal view
```

### log

```solidity
function log(address p0, bool p1, address p2, bool p3) internal view
```

### log

```solidity
function log(address p0, bool p1, address p2, address p3) internal view
```

### log

```solidity
function log(address p0, address p1, uint256 p2, uint256 p3) internal view
```

### log

```solidity
function log(address p0, address p1, uint256 p2, string p3) internal view
```

### log

```solidity
function log(address p0, address p1, uint256 p2, bool p3) internal view
```

### log

```solidity
function log(address p0, address p1, uint256 p2, address p3) internal view
```

### log

```solidity
function log(address p0, address p1, string p2, uint256 p3) internal view
```

### log

```solidity
function log(address p0, address p1, string p2, string p3) internal view
```

### log

```solidity
function log(address p0, address p1, string p2, bool p3) internal view
```

### log

```solidity
function log(address p0, address p1, string p2, address p3) internal view
```

### log

```solidity
function log(address p0, address p1, bool p2, uint256 p3) internal view
```

### log

```solidity
function log(address p0, address p1, bool p2, string p3) internal view
```

### log

```solidity
function log(address p0, address p1, bool p2, bool p3) internal view
```

### log

```solidity
function log(address p0, address p1, bool p2, address p3) internal view
```

### log

```solidity
function log(address p0, address p1, address p2, uint256 p3) internal view
```

### log

```solidity
function log(address p0, address p1, address p2, string p3) internal view
```

### log

```solidity
function log(address p0, address p1, address p2, bool p3) internal view
```

### log

```solidity
function log(address p0, address p1, address p2, address p3) internal view
```

## IPRJ

### name

```solidity
function name() external view returns (string)
```

_Returns the name of the token._

### symbol

```solidity
function symbol() external view returns (string)
```

_Returns the symbol of the token, usually a shorter version of the
name._

### decimals

```solidity
function decimals() external view returns (uint8)
```

_Returns the number of decimals used to get its user representation.
For example, if &#x60;decimals&#x60; equals &#x60;2&#x60;, a balance of &#x60;505&#x60; tokens should
be displayed to a user as &#x60;5,05&#x60; (&#x60;505 / 10 ** 2&#x60;).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless this function is
overridden;

NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}._

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

_Returns the amount of tokens in existence._

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```

_Returns the amount of tokens owned by &#x60;account&#x60;._

### transfer

```solidity
function transfer(address recipient, uint256 amount) external returns (bool)
```

_Moves &#x60;amount&#x60; tokens from the caller&#x27;s account to &#x60;recipient&#x60;.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```

_Returns the remaining number of tokens that &#x60;spender&#x60; will be
allowed to spend on behalf of &#x60;owner&#x60; through {transferFrom}. This is
zero by default.

This value changes when {approve} or {transferFrom} are called._

### approve

```solidity
function approve(address spender, uint256 amount) external returns (bool)
```

_Sets &#x60;amount&#x60; as the allowance of &#x60;spender&#x60; over the caller&#x27;s tokens.

Returns a boolean value indicating whether the operation succeeded.

IMPORTANT: Beware that changing an allowance with this method brings the risk
that someone may use both the old and the new allowance by unfortunate
transaction ordering. One possible solution to mitigate this race
condition is to first reduce the spender&#x27;s allowance to 0 and set the
desired value afterwards:
https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

Emits an {Approval} event._

### transferFrom

```solidity
function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)
```

_Moves &#x60;amount&#x60; tokens from &#x60;sender&#x60; to &#x60;recipient&#x60; using the
allowance mechanism. &#x60;amount&#x60; is then deducted from the caller&#x27;s
allowance.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### mint

```solidity
function mint(uint256 amount) external
```

_mints Project tokens to msg.sender_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | - the amount of project tokens to mint |

### mintTo

```solidity
function mintTo(address to, uint256 amount) external
```

_mints Project tokens to &#x60;to&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | - address of user that receive the Project Token |
| amount | uint256 | - the amount of project tokens to mint |

## IUSDCTest

### name

```solidity
function name() external view returns (string)
```

_Returns the name of the token._

### symbol

```solidity
function symbol() external view returns (string)
```

_Returns the symbol of the token, usually a shorter version of the
name._

### decimals

```solidity
function decimals() external view returns (uint8)
```

_Returns the number of decimals used to get its user representation.
For example, if &#x60;decimals&#x60; equals &#x60;2&#x60;, a balance of &#x60;505&#x60; tokens should
be displayed to a user as &#x60;5,05&#x60; (&#x60;505 / 10 ** 2&#x60;).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless this function is
overridden;

NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}._

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

_Returns the amount of tokens in existence._

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```

_Returns the amount of tokens owned by &#x60;account&#x60;._

### transfer

```solidity
function transfer(address recipient, uint256 amount) external returns (bool)
```

_Moves &#x60;amount&#x60; tokens from the caller&#x27;s account to &#x60;recipient&#x60;.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```

_Returns the remaining number of tokens that &#x60;spender&#x60; will be
allowed to spend on behalf of &#x60;owner&#x60; through {transferFrom}. This is
zero by default.

This value changes when {approve} or {transferFrom} are called._

### approve

```solidity
function approve(address spender, uint256 amount) external returns (bool)
```

_Sets &#x60;amount&#x60; as the allowance of &#x60;spender&#x60; over the caller&#x27;s tokens.

Returns a boolean value indicating whether the operation succeeded.

IMPORTANT: Beware that changing an allowance with this method brings the risk
that someone may use both the old and the new allowance by unfortunate
transaction ordering. One possible solution to mitigate this race
condition is to first reduce the spender&#x27;s allowance to 0 and set the
desired value afterwards:
https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

Emits an {Approval} event._

### transferFrom

```solidity
function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)
```

_Moves &#x60;amount&#x60; tokens from &#x60;sender&#x60; to &#x60;recipient&#x60; using the
allowance mechanism. &#x60;amount&#x60; is then deducted from the caller&#x27;s
allowance.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### mint

```solidity
function mint(uint256 amount) external
```

_mints Project tokens to msg.sender_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | - the amount of project tokens to mint |

### mintTo

```solidity
function mintTo(address to, uint256 amount) external
```

_mints Project tokens to &#x60;to&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | - address of user that receive the Project Token |
| amount | uint256 | - the amount of project tokens to mint |

## SignedSafeMathUpgradeable

_Wrappers over Solidity&#x27;s arithmetic operations.

NOTE: &#x60;SignedSafeMath&#x60; is no longer needed starting with Solidity 0.8. The compiler
now has built in overflow checking._

### mul

```solidity
function mul(int256 a, int256 b) internal pure returns (int256)
```

_Returns the multiplication of two signed integers, reverting on
overflow.

Counterpart to Solidity&#x27;s &#x60;*&#x60; operator.

Requirements:

- Multiplication cannot overflow._

### div

```solidity
function div(int256 a, int256 b) internal pure returns (int256)
```

_Returns the integer division of two signed integers. Reverts on
division by zero. The result is rounded towards zero.

Counterpart to Solidity&#x27;s &#x60;/&#x60; operator.

Requirements:

- The divisor cannot be zero._

### sub

```solidity
function sub(int256 a, int256 b) internal pure returns (int256)
```

_Returns the subtraction of two signed integers, reverting on
overflow.

Counterpart to Solidity&#x27;s &#x60;-&#x60; operator.

Requirements:

- Subtraction cannot overflow._

### add

```solidity
function add(int256 a, int256 b) internal pure returns (int256)
```

_Returns the addition of two signed integers, reverting on
overflow.

Counterpart to Solidity&#x27;s &#x60;+&#x60; operator.

Requirements:

- Addition cannot overflow._

## IBLendingToken

### mintTo

```solidity
function mintTo(address minter, uint256 mintAmount) external returns (uint256 err, uint256 mintedAmount)
```

Sender supplies assets into the market and receives cTokens in exchange

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| minter | address | the address of account which earn liquidity |
| mintAmount | uint256 | The amount of the underlying asset to supply to minter return uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) return uint minted amount |

### redeemTo

```solidity
function redeemTo(address redeemer, uint256 redeemTokens) external returns (uint256)
```

Sender redeems cTokens in exchange for the underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemer | address |  |
| redeemTokens | uint256 | The number of cTokens to redeem into underlying |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### redeemUnderlyingTo

```solidity
function redeemUnderlyingTo(address redeemer, uint256 redeemAmount) external returns (uint256)
```

Sender redeems cTokens in exchange for a specified amount of underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemer | address |  |
| redeemAmount | uint256 | The amount of underlying to redeem |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### borrowTo

```solidity
function borrowTo(address projectToken, address borrower, uint256 borrowAmount) external returns (uint256 borrowError)
```

### repayBorrowTo

```solidity
function repayBorrowTo(address projectToken, address payer, uint256 repayAmount) external returns (uint256 repayBorrowError, uint256 amountRepayed)
```

### repayBorrowToBorrower

```solidity
function repayBorrowToBorrower(address projectToken, address payer, address borrower, uint256 repayAmount) external returns (uint256 repayBorrowError, uint256 amountRepayed)
```

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```

Get the token balance of the &#x60;owner&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of the account to query |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of tokens owned by &#x60;owner&#x60; |

### borrowBalanceCurrent

```solidity
function borrowBalanceCurrent(address account) external returns (uint256)
```

### borrowBalanceStored

```solidity
function borrowBalanceStored(address account) external view returns (uint256)
```

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

### totalBorrows

```solidity
function totalBorrows() external view returns (uint256)
```

### exchangeRateStored

```solidity
function exchangeRateStored() external view returns (uint256)
```

## IPrimaryIndexToken

### MODERATOR_ROLE

```solidity
function MODERATOR_ROLE() external view returns (bytes32)
```

_return keccak(&quot;MODERATOR_ROLE&quot;)_

### priceOracle

```solidity
function priceOracle() external view returns (address)
```

_return address of price oracle with interface of PriceProviderAggregator_

### projectTokens

```solidity
function projectTokens(uint256 projectTokenId) external view returns (address)
```

_return address project token in array &#x60;projectTokens&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| projectTokenId | uint256 | - index of project token in array &#x60;projectTokens&#x60;. Numetates from 0 to array length - 1 |

### projectTokenInfo

```solidity
function projectTokenInfo(address projectToken) external view returns (struct IPrimaryIndexToken.ProjectTokenInfo)
```

_return info of project token, that declared in struct ProjectTokenInfo_

| Name | Type | Description |
| ---- | ---- | ----------- |
| projectToken | address | - address of project token in array &#x60;projectTokens&#x60;. Numetates from 0 to array length - 1 |

### lendingTokens

```solidity
function lendingTokens(uint256 lendingTokenId) external view returns (address)
```

_return address lending token in array &#x60;lendingTokens&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| lendingTokenId | uint256 | - index of lending token in array &#x60;lendingTokens&#x60;. Numetates from 0 to array length - 1 |

### lendingTokenInfo

```solidity
function lendingTokenInfo(address lendingToken) external view returns (struct IPrimaryIndexToken.LendingTokenInfo)
```

_return info of lending token, that declared in struct LendingTokenInfo_

| Name | Type | Description |
| ---- | ---- | ----------- |
| lendingToken | address | - address of project token in array &#x60;projectTokens&#x60;. Numetates from 0 to array length - 1 |

### totalDepositedProjectToken

```solidity
function totalDepositedProjectToken(address projectToken) external view returns (uint256)
```

### depositPosition

```solidity
function depositPosition(address account, address projectToken, address lendingToken) external view returns (struct IPrimaryIndexToken.DepositPosition)
```

### borrowPosition

```solidity
function borrowPosition(address account, address projectToken, address lendingToken) external view returns (struct IPrimaryIndexToken.BorrowPosition)
```

### totalBorrow

```solidity
function totalBorrow(address projectToken, address lendingToken) external view returns (uint256)
```

### borrowLimit

```solidity
function borrowLimit(address projectToken, address lendingToken) external view returns (uint256)
```

### Ratio

```solidity
struct Ratio {
  uint8 numerator;
  uint8 denominator;
}
```

### ProjectTokenInfo

```solidity
struct ProjectTokenInfo {
  bool isListed;
  bool isDepositPaused;
  bool isWithdrawPaused;
  struct IPrimaryIndexToken.Ratio loanToValueRatio;
  struct IPrimaryIndexToken.Ratio liquidationThresholdFactor;
  struct IPrimaryIndexToken.Ratio liquidationIncentive;
}
```

### LendingTokenInfo

```solidity
struct LendingTokenInfo {
  bool isListed;
  bool isPaused;
  address bLendingToken;
}
```

### DepositPosition

```solidity
struct DepositPosition {
  uint256 depositedProjectTokenAmount;
}
```

### BorrowPosition

```solidity
struct BorrowPosition {
  uint256 loanBody;
  uint256 accrual;
}
```

### AddPrjToken

```solidity
event AddPrjToken(address tokenPrj)
```

### LoanToValueRatioSet

```solidity
event LoanToValueRatioSet(address tokenPrj, uint8 lvrNumerator, uint8 lvrDenominator)
```

### LiquidationThresholdFactorSet

```solidity
event LiquidationThresholdFactorSet(address tokenPrj, uint8 ltfNumerator, uint8 ltfDenominator)
```

### Deposit

```solidity
event Deposit(address who, address tokenPrj, uint256 prjDepositAmount, address beneficiar)
```

### Withdraw

```solidity
event Withdraw(address who, address tokenPrj, uint256 prjWithdrawAmount, address beneficiar)
```

### Supply

```solidity
event Supply(address who, address supplyToken, uint256 supplyAmount, address supplyBToken, uint256 amountSupplyBTokenReceived)
```

### Redeem

```solidity
event Redeem(address who, address redeemToken, address redeemBToken, uint256 redeemAmount)
```

### RedeemUnderlying

```solidity
event RedeemUnderlying(address who, address redeemToken, address redeemBToken, uint256 redeemAmountUnderlying)
```

### Borrow

```solidity
event Borrow(address who, address borrowToken, uint256 borrowAmount, address prjAddress, uint256 prjAmount)
```

### RepayBorrow

```solidity
event RepayBorrow(address who, address borrowToken, uint256 borrowAmount, address prjAddress, bool isPositionFullyRepaid)
```

### Liquidate

```solidity
event Liquidate(address liquidator, address borrower, address lendingToken, address prjAddress, uint256 amountPrjLiquidated)
```

### initialize

```solidity
function initialize() external
```

### addProjectToken

```solidity
function addProjectToken(address _projectToken, uint8 _loanToValueRatioNumerator, uint8 _loanToValueRatioDenominator, uint8 _liquidationTresholdFactorNumerator, uint8 _liquidationTresholdFactorDenominator, uint8 _liquidationIncentiveNumerator, uint8 _liquidationIncentiveDenominator) external
```

### removeProjectToken

```solidity
function removeProjectToken(uint256 _projectTokenId) external
```

### addLendingToken

```solidity
function addLendingToken(address _lendingToken, address _bLendingToken, bool _isPaused) external
```

### removeLendingToken

```solidity
function removeLendingToken(uint256 _lendingTokenId) external
```

### setPriceOracle

```solidity
function setPriceOracle(address _priceOracle) external
```

### grandModerator

```solidity
function grandModerator(address newModerator) external
```

### revokeModerator

```solidity
function revokeModerator(address moderator) external
```

### setBorrowLimit

```solidity
function setBorrowLimit(address projectToken, address lendingToken, uint256 _borrowLimit) external
```

### setProjectTokenInfo

```solidity
function setProjectTokenInfo(address _projectToken, uint8 _loanToValueRatioNumerator, uint8 _loanToValueRatioDenominator, uint8 _liquidationTresholdFactorNumerator, uint8 _liquidationTresholdFactorDenominator, uint8 _liquidationIncentiveNumerator, uint8 _liquidationIncentiveDenominator) external
```

### setPausedProjectToken

```solidity
function setPausedProjectToken(address _projectToken, bool _isDepositPaused, bool _isWithdrawPaused) external
```

### setLendingTokenInfo

```solidity
function setLendingTokenInfo(address _lendingToken, address _bLendingToken, bool _isPaused) external
```

### setPausedLendingToken

```solidity
function setPausedLendingToken(address _lendingToken, bool _isPaused) external
```

### deposit

```solidity
function deposit(address projectToken, address lendingToken, uint256 projectTokenAmount) external
```

### withdraw

```solidity
function withdraw(address projectToken, address lendingToken, uint256 projectTokenAmount) external
```

### supply

```solidity
function supply(address lendingToken, uint256 lendingTokenAmount) external
```

### redeem

```solidity
function redeem(address lendingToken, uint256 bLendingTokenAmount) external
```

### redeemUnderlying

```solidity
function redeemUnderlying(address lendingToken, uint256 lendingTokenAmount) external
```

### borrow

```solidity
function borrow(address projectToken, address lendingToken, uint256 lendingTokenAmount) external
```

### repay

```solidity
function repay(address projectToken, address lendingToken, uint256 lendingTokenAmount) external
```

### liquidate

```solidity
function liquidate(address account, address projectToken, address lendingToken) external
```

### updateInterestInBorrowPosition

```solidity
function updateInterestInBorrowPosition(address account, address projectToken, address lendingToken) external
```

### pit

```solidity
function pit(address account, address projectToken, address lendingToken) external view returns (uint256)
```

### pitRemaining

```solidity
function pitRemaining(address account, address projectToken, address lendingToken) external view returns (uint256)
```

### liquidationThreshold

```solidity
function liquidationThreshold(address account, address projectToken, address lendingToken) external view returns (uint256)
```

### totalOutstanding

```solidity
function totalOutstanding(address account, address projectToken, address lendingToken) external view returns (uint256)
```

### healthFactor

```solidity
function healthFactor(address account, address projectToken, address lendingToken) external view returns (uint256 numerator, uint256 denominator)
```

### getProjectTokenEvaluation

```solidity
function getProjectTokenEvaluation(address projectToken, uint256 projectTokenAmount) external view returns (uint256)
```

### lendingTokensLength

```solidity
function lendingTokensLength() external view returns (uint256)
```

### projectTokensLength

```solidity
function projectTokensLength() external view returns (uint256)
```

### getPosition

```solidity
function getPosition(address account, address projectToken, address lendingToken) external view returns (uint256 depositedProjectTokenAmount, uint256 loanBody, uint256 accrual, uint256 healthFactorNumerator, uint256 healthFactorDenominator)
```

### decimals

```solidity
function decimals() external view returns (uint8)
```

## IBPrimaryIndexToken

### mintTo

```solidity
function mintTo(address minter, uint256 mintAmount) external returns (uint256 err, uint256 mintedAmount)
```

Sender supplies assets into the market and receives cTokens in exchange

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| minter | address | the address of account which earn liquidity |
| mintAmount | uint256 | The amount of the underlying asset to supply to minter return uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) return uint minted amount |

### redeemTo

```solidity
function redeemTo(address redeemer, uint256 redeemTokens) external returns (uint256)
```

Sender redeems cTokens in exchange for the underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemer | address |  |
| redeemTokens | uint256 | The number of cTokens to redeem into underlying |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### redeemUnderlyingTo

```solidity
function redeemUnderlyingTo(uint256 redeemAmount) external returns (uint256)
```

Sender redeems cTokens in exchange for a specified amount of underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemAmount | uint256 | The amount of underlying to redeem |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```

Get the token balance of the &#x60;owner&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of the account to query |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of tokens owned by &#x60;owner&#x60; |

## IUniswapV2Router02

### factory

```solidity
function factory() external pure returns (address)
```

### WETH

```solidity
function WETH() external pure returns (address)
```

### addLiquidity

```solidity
function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)
```

### addLiquidityETH

```solidity
function addLiquidityETH(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)
```

### removeLiquidity

```solidity
function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB)
```

### removeLiquidityETH

```solidity
function removeLiquidityETH(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external returns (uint256 amountToken, uint256 amountETH)
```

### removeLiquidityWithPermit

```solidity
function removeLiquidityWithPermit(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint256 amountA, uint256 amountB)
```

### removeLiquidityETHWithPermit

```solidity
function removeLiquidityETHWithPermit(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint256 amountToken, uint256 amountETH)
```

### swapExactTokensForTokens

```solidity
function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)
```

### swapTokensForExactTokens

```solidity
function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)
```

### swapExactETHForTokens

```solidity
function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) external payable returns (uint256[] amounts)
```

### swapTokensForExactETH

```solidity
function swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)
```

### swapExactTokensForETH

```solidity
function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)
```

### swapETHForExactTokens

```solidity
function swapETHForExactTokens(uint256 amountOut, address[] path, address to, uint256 deadline) external payable returns (uint256[] amounts)
```

### quote

```solidity
function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) external pure returns (uint256 amountB)
```

### getAmountOut

```solidity
function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) external pure returns (uint256 amountOut)
```

### getAmountIn

```solidity
function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) external pure returns (uint256 amountIn)
```

### getAmountsOut

```solidity
function getAmountsOut(uint256 amountIn, address[] path) external view returns (uint256[] amounts)
```

### getAmountsIn

```solidity
function getAmountsIn(uint256 amountOut, address[] path) external view returns (uint256[] amounts)
```

### removeLiquidityETHSupportingFeeOnTransferTokens

```solidity
function removeLiquidityETHSupportingFeeOnTransferTokens(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external returns (uint256 amountETH)
```

### removeLiquidityETHWithPermitSupportingFeeOnTransferTokens

```solidity
function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint256 amountETH)
```

### swapExactTokensForTokensSupportingFeeOnTransferTokens

```solidity
function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external
```

### swapExactETHForTokensSupportingFeeOnTransferTokens

```solidity
function swapExactETHForTokensSupportingFeeOnTransferTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) external payable
```

### swapExactTokensForETHSupportingFeeOnTransferTokens

```solidity
function swapExactTokensForETHSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external
```

## BitMaps

_Library for managing uint256 to bool mapping in a compact and efficient way, providing the keys are sequential.
Largelly inspired by Uniswap&#x27;s https://github.com/Uniswap/merkle-distributor/blob/master/contracts/MerkleDistributor.sol[merkle-distributor]._

### BitMap

```solidity
struct BitMap {
  mapping(uint256 &#x3D;&gt; uint256) _data;
}
```

### get

```solidity
function get(struct BitMaps.BitMap bitmap, uint256 index) internal view returns (bool)
```

_Returns whether the bit at &#x60;index&#x60; is set._

### setTo

```solidity
function setTo(struct BitMaps.BitMap bitmap, uint256 index, bool value) internal
```

_Sets the bit at &#x60;index&#x60; to the boolean &#x60;value&#x60;._

### set

```solidity
function set(struct BitMaps.BitMap bitmap, uint256 index) internal
```

_Sets the bit at &#x60;index&#x60;._

### unset

```solidity
function unset(struct BitMaps.BitMap bitmap, uint256 index) internal
```

_Unsets the bit at &#x60;index&#x60;._

## SignedSafeMath

_Wrappers over Solidity&#x27;s arithmetic operations.

NOTE: &#x60;SignedSafeMath&#x60; is no longer needed starting with Solidity 0.8. The compiler
now has built in overflow checking._

### mul

```solidity
function mul(int256 a, int256 b) internal pure returns (int256)
```

_Returns the multiplication of two signed integers, reverting on
overflow.

Counterpart to Solidity&#x27;s &#x60;*&#x60; operator.

Requirements:

- Multiplication cannot overflow._

### div

```solidity
function div(int256 a, int256 b) internal pure returns (int256)
```

_Returns the integer division of two signed integers. Reverts on
division by zero. The result is rounded towards zero.

Counterpart to Solidity&#x27;s &#x60;/&#x60; operator.

Requirements:

- The divisor cannot be zero._

### sub

```solidity
function sub(int256 a, int256 b) internal pure returns (int256)
```

_Returns the subtraction of two signed integers, reverting on
overflow.

Counterpart to Solidity&#x27;s &#x60;-&#x60; operator.

Requirements:

- Subtraction cannot overflow._

### add

```solidity
function add(int256 a, int256 b) internal pure returns (int256)
```

_Returns the addition of two signed integers, reverting on
overflow.

Counterpart to Solidity&#x27;s &#x60;+&#x60; operator.

Requirements:

- Addition cannot overflow._

## Create2Upgradeable

_Helper to make usage of the &#x60;CREATE2&#x60; EVM opcode easier and safer.
&#x60;CREATE2&#x60; can be used to compute in advance the address where a smart
contract will be deployed, which allows for interesting new mechanisms known
as &#x27;counterfactual interactions&#x27;.

See the https://eips.ethereum.org/EIPS/eip-1014#motivation[EIP] for more
information._

### deploy

```solidity
function deploy(uint256 amount, bytes32 salt, bytes bytecode) internal returns (address)
```

_Deploys a contract using &#x60;CREATE2&#x60;. The address where the contract
will be deployed can be known in advance via {computeAddress}.

The bytecode for a contract can be obtained from Solidity with
&#x60;type(contractName).creationCode&#x60;.

Requirements:

- &#x60;bytecode&#x60; must not be empty.
- &#x60;salt&#x60; must have not been used for &#x60;bytecode&#x60; already.
- the factory must have a balance of at least &#x60;amount&#x60;.
- if &#x60;amount&#x60; is non-zero, &#x60;bytecode&#x60; must have a &#x60;payable&#x60; constructor._

### computeAddress

```solidity
function computeAddress(bytes32 salt, bytes32 bytecodeHash) internal view returns (address)
```

_Returns the address where a contract will be stored if deployed via {deploy}. Any change in the
&#x60;bytecodeHash&#x60; or &#x60;salt&#x60; will result in a new destination address._

### computeAddress

```solidity
function computeAddress(bytes32 salt, bytes32 bytecodeHash, address deployer) internal pure returns (address)
```

_Returns the address where a contract will be stored if deployed via {deploy} from a contract located at
&#x60;deployer&#x60;. If &#x60;deployer&#x60; is this contract&#x27;s address, returns the same value as {computeAddress}._

## Clones

_https://eips.ethereum.org/EIPS/eip-1167[EIP 1167] is a standard for
deploying minimal proxy contracts, also known as &quot;clones&quot;.

&gt; To simply and cheaply clone contract functionality in an immutable way, this standard specifies
&gt; a minimal bytecode implementation that delegates all calls to a known, fixed address.

The library includes functions to deploy a proxy using either &#x60;create&#x60; (traditional deployment) or &#x60;create2&#x60;
(salted deterministic deployment). It also includes functions to predict the addresses of clones deployed using the
deterministic method.

_Available since v3.4.__

### clone

```solidity
function clone(address implementation) internal returns (address instance)
```

_Deploys and returns the address of a clone that mimics the behaviour of &#x60;implementation&#x60;.

This function uses the create opcode, which should never revert._

### cloneDeterministic

```solidity
function cloneDeterministic(address implementation, bytes32 salt) internal returns (address instance)
```

_Deploys and returns the address of a clone that mimics the behaviour of &#x60;implementation&#x60;.

This function uses the create2 opcode and a &#x60;salt&#x60; to deterministically deploy
the clone. Using the same &#x60;implementation&#x60; and &#x60;salt&#x60; multiple time will revert, since
the clones cannot be deployed twice at the same address._

### predictDeterministicAddress

```solidity
function predictDeterministicAddress(address implementation, bytes32 salt, address deployer) internal pure returns (address predicted)
```

_Computes the address of a clone deployed using {Clones-cloneDeterministic}._

### predictDeterministicAddress

```solidity
function predictDeterministicAddress(address implementation, bytes32 salt) internal view returns (address predicted)
```

_Computes the address of a clone deployed using {Clones-cloneDeterministic}._

## IERC1363ReceiverUpgradeable

### onTransferReceived

```solidity
function onTransferReceived(address operator, address from, uint256 value, bytes data) external returns (bytes4)
```

Handle the receipt of ERC1363 tokens

_Any ERC1363 smart contract calls this function on the recipient
after a &#x60;transfer&#x60; or a &#x60;transferFrom&#x60;. This function MAY throw to revert and reject the
transfer. Return of other than the magic value MUST result in the
transaction being reverted.
Note: the token contract address is always the message sender._

| Name | Type | Description |
| ---- | ---- | ----------- |
| operator | address | address The address which called &#x60;transferAndCall&#x60; or &#x60;transferFromAndCall&#x60; function |
| from | address | address The address which are token transferred from |
| value | uint256 | uint256 The amount of tokens transferred |
| data | bytes | bytes Additional data with no specified format |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes4 | &#x60;bytes4(keccak256(&quot;onTransferReceived(address,address,uint256,bytes)&quot;))&#x60;  unless throwing |

## IComptroller

### isComptroller

```solidity
function isComptroller() external view returns (bool)
```

Indicator that this is a Comptroller contract (for inspection)

### getAssetsIn

```solidity
function getAssetsIn(address account) external view returns (address[])
```

### getAccountLiquidity

```solidity
function getAccountLiquidity(address account) external view returns (uint256, uint256, uint256)
```

### checkMembership

```solidity
function checkMembership(address account, address cToken) external view returns (bool)
```

### getPrimaryIndexTokenAddress

```solidity
function getPrimaryIndexTokenAddress() external view returns (address)
```

### enterMarkets

```solidity
function enterMarkets(address[] cTokens) external returns (uint256[])
```

### enterMarket

```solidity
function enterMarket(address cToken, address borrower) external returns (uint256)
```

### exitMarket

```solidity
function exitMarket(address cToken) external returns (uint256)
```

### mintAllowed

```solidity
function mintAllowed(address cToken, address minter, uint256 mintAmount) external returns (uint256)
```

### mintVerify

```solidity
function mintVerify(address cToken, address minter, uint256 mintAmount, uint256 mintTokens) external
```

### redeemAllowed

```solidity
function redeemAllowed(address cToken, address redeemer, uint256 redeemTokens) external returns (uint256)
```

### redeemVerify

```solidity
function redeemVerify(address cToken, address redeemer, uint256 redeemAmount, uint256 redeemTokens) external
```

### borrowAllowed

```solidity
function borrowAllowed(address cToken, address borrower, uint256 borrowAmount) external returns (uint256)
```

### borrowVerify

```solidity
function borrowVerify(address cToken, address borrower, uint256 borrowAmount) external
```

### repayBorrowAllowed

```solidity
function repayBorrowAllowed(address cToken, address payer, address borrower, uint256 repayAmount) external returns (uint256)
```

### repayBorrowVerify

```solidity
function repayBorrowVerify(address cToken, address payer, address borrower, uint256 repayAmount, uint256 borrowerIndex) external
```

### liquidateBorrowAllowed

```solidity
function liquidateBorrowAllowed(address cTokenBorrowed, address cTokenCollateral, address liquidator, address borrower, uint256 repayAmount) external returns (uint256)
```

### liquidateBorrowVerify

```solidity
function liquidateBorrowVerify(address cTokenBorrowed, address cTokenCollateral, address liquidator, address borrower, uint256 repayAmount, uint256 seizeTokens) external
```

### seizeAllowed

```solidity
function seizeAllowed(address cTokenCollateral, address cTokenBorrowed, address liquidator, address borrower, uint256 seizeTokens) external returns (uint256)
```

### seizeVerify

```solidity
function seizeVerify(address cTokenCollateral, address cTokenBorrowed, address liquidator, address borrower, uint256 seizeTokens) external
```

### transferAllowed

```solidity
function transferAllowed(address cToken, address src, address dst, uint256 transferTokens) external returns (uint256)
```

### transferVerify

```solidity
function transferVerify(address cToken, address src, address dst, uint256 transferTokens) external
```

### liquidateCalculateSeizeTokens

```solidity
function liquidateCalculateSeizeTokens(address cTokenBorrowed, address cTokenCollateral, uint256 repayAmount) external view returns (uint256, uint256)
```

## IERC1363SpenderUpgradeable

### onApprovalReceived

```solidity
function onApprovalReceived(address owner, uint256 value, bytes data) external returns (bytes4)
```

Handle the approval of ERC1363 tokens

_Any ERC1363 smart contract calls this function on the recipient
after an &#x60;approve&#x60;. This function MAY throw to revert and reject the
approval. Return of other than the magic value MUST result in the
transaction being reverted.
Note: the token contract address is always the message sender._

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | address The address which called &#x60;approveAndCall&#x60; function |
| value | uint256 | uint256 The amount of tokens to be spent |
| data | bytes | bytes Additional data with no specified format |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes4 | &#x60;bytes4(keccak256(&quot;onApprovalReceived(address,uint256,bytes)&quot;))&#x60;  unless throwing |

## ISimplePriceOracle

### PricePosted

```solidity
event PricePosted(address asset, uint256 previousPriceMantissa, uint256 requestedPriceMantissa, uint256 newPriceMantissa)
```

### getUnderlyingPrice

```solidity
function getUnderlyingPrice(address cToken) external view returns (uint256)
```

### setUnderlyingPrice

```solidity
function setUnderlyingPrice(address cToken, uint256 underlyingPriceMantissa) external
```

### setDirectPrice

```solidity
function setDirectPrice(address asset, uint256 price) external
```

### assetPrices

```solidity
function assetPrices(address asset) external view returns (uint256)
```

## IERC1363Receiver

### onTransferReceived

```solidity
function onTransferReceived(address operator, address from, uint256 value, bytes data) external returns (bytes4)
```

Handle the receipt of ERC1363 tokens

_Any ERC1363 smart contract calls this function on the recipient
after a &#x60;transfer&#x60; or a &#x60;transferFrom&#x60;. This function MAY throw to revert and reject the
transfer. Return of other than the magic value MUST result in the
transaction being reverted.
Note: the token contract address is always the message sender._

| Name | Type | Description |
| ---- | ---- | ----------- |
| operator | address | address The address which called &#x60;transferAndCall&#x60; or &#x60;transferFromAndCall&#x60; function |
| from | address | address The address which are token transferred from |
| value | uint256 | uint256 The amount of tokens transferred |
| data | bytes | bytes Additional data with no specified format |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes4 | &#x60;bytes4(keccak256(&quot;onTransferReceived(address,address,uint256,bytes)&quot;))&#x60;  unless throwing |

## BitMapsUpgradeable

_Library for managing uint256 to bool mapping in a compact and efficient way, providing the keys are sequential.
Largelly inspired by Uniswap&#x27;s https://github.com/Uniswap/merkle-distributor/blob/master/contracts/MerkleDistributor.sol[merkle-distributor]._

### BitMap

```solidity
struct BitMap {
  mapping(uint256 &#x3D;&gt; uint256) _data;
}
```

### get

```solidity
function get(struct BitMapsUpgradeable.BitMap bitmap, uint256 index) internal view returns (bool)
```

_Returns whether the bit at &#x60;index&#x60; is set._

### setTo

```solidity
function setTo(struct BitMapsUpgradeable.BitMap bitmap, uint256 index, bool value) internal
```

_Sets the bit at &#x60;index&#x60; to the boolean &#x60;value&#x60;._

### set

```solidity
function set(struct BitMapsUpgradeable.BitMap bitmap, uint256 index) internal
```

_Sets the bit at &#x60;index&#x60;._

### unset

```solidity
function unset(struct BitMapsUpgradeable.BitMap bitmap, uint256 index) internal
```

_Unsets the bit at &#x60;index&#x60;._

## ERC1820Implementer

_Implementation of the {IERC1820Implementer} interface.

Contracts may inherit from this and call {_registerInterfaceForAddress} to
declare their willingness to be implementers.
{IERC1820Registry-setInterfaceImplementer} should then be called for the
registration to be complete._

### _ERC1820_ACCEPT_MAGIC

```solidity
bytes32 _ERC1820_ACCEPT_MAGIC
```

### _supportedInterfaces

```solidity
mapping(bytes32 &#x3D;&gt; mapping(address &#x3D;&gt; bool)) _supportedInterfaces
```

### canImplementInterfaceForAddress

```solidity
function canImplementInterfaceForAddress(bytes32 interfaceHash, address account) public view virtual returns (bytes32)
```

_See {IERC1820Implementer-canImplementInterfaceForAddress}._

### _registerInterfaceForAddress

```solidity
function _registerInterfaceForAddress(bytes32 interfaceHash, address account) internal virtual
```

_Declares the contract as willing to be an implementer of
&#x60;interfaceHash&#x60; for &#x60;account&#x60;.

See {IERC1820Registry-setInterfaceImplementer} and
{IERC1820Registry-interfaceHash}._

## IERC1820Implementer

_Interface for an ERC1820 implementer, as defined in the
https://eips.ethereum.org/EIPS/eip-1820#interface-implementation-erc1820implementerinterface[EIP].
Used by contracts that will be registered as implementers in the
{IERC1820Registry}._

### canImplementInterfaceForAddress

```solidity
function canImplementInterfaceForAddress(bytes32 interfaceHash, address account) external view returns (bytes32)
```

_Returns a special value (&#x60;ERC1820_ACCEPT_MAGIC&#x60;) if this contract
implements &#x60;interfaceHash&#x60; for &#x60;account&#x60;.

See {IERC1820Registry-setInterfaceImplementer}._

