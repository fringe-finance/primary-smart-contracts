require("dotenv").config();
const hre = require("hardhat");
const { ethers } = require("ethers");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const {
  DAI,
  USDC,
  USDT,
  DAI_USDC,
  OPENOCEAN_EXCHANGE,
  USDC_USDT,
  USDC_4626,
  DAI_4626,
} = require("../utils/constants");
const { TokenType } = require("../estimate-scripts/enum/tokenType");
const { deployPlatform } = require("../utils/deployPlatform");
const {
  loadContractInstance,
} = require("../estimate-scripts/utils/loadContract");
const { ERC20_ABI } = require("../estimate-scripts/abis/ERC20");
const { UniswapV2Pair_ABI } = require("../estimate-scripts/abis/UniswapV2Pair");
const { ERC4626_ABI } = require("../estimate-scripts/abis/ERC4626");
const { estimateBuy } = require("../estimate-scripts");
const { expect } = require("chai");
const { EvmPriceServiceConnection } = require("@pythnetwork/pyth-evm-js");
const { Dex } = require("../estimate-scripts/enum/dexType");
const { Pair } = require("../estimate-scripts/enum/pairType");

const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);
const connection = new EvmPriceServiceConnection("https://hermes.pyth.network");

describe("PrimaryLendingPlatformV3", function () {
  let signers;
  let deployMaster;

  const getTokenTuple = (tokenInfo) => {
    let tokenIndex;
    switch (tokenInfo.tokenType) {
      case TokenType.ERC20:
        tokenIndex = 0;
        break;
      case TokenType.ERC4626:
        tokenIndex = 1;
        break;
      case TokenType.LP:
        tokenIndex = 2;
        break;
      default:
        tokenIndex = 0;
    }
    return [tokenInfo.address, tokenIndex];
  };

  async function getPriceId(PriceContract, tokenAddressList) {
    const { priceIds, updateFee } = await PriceContract.getExpiredPriceFeeds(
      tokenAddressList,
      BN.from(15)
    );
    return { priceIds, updateFee };
  }

  async function getPriceFeedsUpdateData(priceIds) {
    if (priceIds.length === 0) return [];
    const updateData = await connection.getPriceFeedsUpdateData(priceIds);
    return updateData;
  }

  const processing = async (
    collateral,
    collateralInfo,
    lending,
    lendingInfo,
    lendingTokenAmount,
    plpInstance,
    plpAtomicRepayInstance
  ) => {
    const balanceLendingUserBeforeRepay = await lending.balanceOf(deployMaster.address);
    const depositedAmountBefore = await plpInstance.depositedAmount(deployMaster.address, collateral.address);
    const totalOutstandingBefore = await plpInstance.outstanding(deployMaster.address, lending.address);

    console.log("lendingTokenAmount: ", lendingTokenAmount.toString())
    
    const estimateData = await estimateBuy(collateralInfo, lendingInfo, lendingTokenAmount.mul(101).div(100), plpAtomicRepayInstance.address, "0.05", "1", Dex.Paraswap, deployMaster.provider);
    console.log(estimateData)

    const tx = await plpAtomicRepayInstance.repayAtomic(getTokenTuple(lendingInfo), getTokenTuple(collateralInfo), estimateData.estimateAmountIn.mul(105).div(100), estimateData.buyCallData, true, [], []) 

    const rs = await tx.wait();
    const event = rs.events.find((x) => x.event === "AtomicRepayment").args;

    console.log("event: ", event)

    const balanceLendingUserAfterRepay = await lending.balanceOf(deployMaster.address);
    const depositedAmountAfter = await plpInstance.depositedAmount(deployMaster.address, collateral.address);
    const totalOutstandingAfter = await plpInstance.outstanding(deployMaster.address, lending.address);

    console.log({
        balanceLendingUserBeforeRepay: balanceLendingUserBeforeRepay.toString(),
        balanceLendingUserAfterRepay: balanceLendingUserAfterRepay.toString(),
        depositedAmountBefore: depositedAmountBefore.toString(),
        amountSold: event.amountSold.toString(),
        depositedAmountAfter: depositedAmountAfter.toString(),
        totalOutstandingBefore: totalOutstandingBefore.toString(),
        totalOutstandingAfter: totalOutstandingAfter.toString(),
    })
    // expect(balanceLendingUserBeforeRepay).to.eq(balanceLendingUserAfterRepay)
    expect(depositedAmountBefore.sub(event.amountSold)).to.be.eq(depositedAmountAfter);
    expect(totalOutstandingAfter.add(lendingTokenAmount)).to.be.eq(totalOutstandingBefore)

  };

  async function resetNetwork() {
    await helpers.reset(
      `https://${process.env.CHAIN.replace("_", "-")}.infura.io/v3/${
        process.env.INFURA_KEY
      }`,
      Number(process.env.BLOCK_NUMBER)
    );
  }

  async function loadFixture() {
    await resetNetwork();
    signers = await hre.ethers.getSigners();
    deployMaster = signers[0];

    const tokenInstances = {
      dai: loadContractInstance(DAI, ERC20_ABI, deployMaster),
      usdc: loadContractInstance(USDC, ERC20_ABI, deployMaster),
      usdt: loadContractInstance(USDT, ERC20_ABI, deployMaster),
      dai_usdc: loadContractInstance(DAI_USDC, UniswapV2Pair_ABI, deployMaster),
      usdc_usdt: loadContractInstance(USDC_USDT, UniswapV2Pair_ABI, deployMaster),
      usdc_4626: loadContractInstance(USDC_4626, ERC4626_ABI, deployMaster),
      dai_4626: loadContractInstance(DAI_4626, ERC4626_ABI, deployMaster),
    };

    const tokenInfo = {
      [tokenInstances.dai.address]: { address: tokenInstances.dai.address, tokenType: TokenType.ERC20, decimals: 18,},
      [tokenInstances.usdc.address]: { address: tokenInstances.usdc.address, tokenType: TokenType.ERC20, decimals: 6,},
      [tokenInstances.usdt.address]: { address: tokenInstances.usdt.address, tokenType: TokenType.ERC20, decimals: 6,},
      [tokenInstances.dai_usdc.address]: { address: tokenInstances.dai_usdc.address, tokenType: TokenType.LP, pairType: Pair.Uniswap, decimals: 18,},
      [tokenInstances.usdc_usdt.address]: { address: tokenInstances.usdc_usdt.address, tokenType: TokenType.LP, pairType: Pair.Uniswap, decimals: 18,},
      [tokenInstances.usdc_4626.address]: { address: tokenInstances.usdc_4626.address, tokenType: TokenType.ERC4626, decimals: 18,},
      [tokenInstances.dai_4626.address]: { address: tokenInstances.dai_4626.address, tokenType: TokenType.ERC4626, decimals: 18,},
    };

    console.log("Setting up tokens");
    await setBalance( DAI, deployMaster.address, toBN("100000000000000000000000"));
    await setBalance( USDC, deployMaster.address, toBN("100000000000000000000000"));
    await setBalance( USDT, deployMaster.address, toBN("100000000000000000000000"));
    await setBalance( DAI_USDC, deployMaster.address, toBN("100000000000000000000000"));
    await setBalance( USDC_USDT, deployMaster.address, toBN("100000000000000000000000"));

    await tokenInstances.usdc.approve( tokenInstances.usdc_4626.address, hre.ethers.constants.MaxUint256);
    await tokenInstances.usdc_4626.deposit("10000000000", deployMaster.address);

    await tokenInstances.dai.approve( tokenInstances.dai_4626.address, hre.ethers.constants.MaxUint256);
    await tokenInstances.dai_4626.deposit( "10000000000000000000000", deployMaster.address);
    console.log("Completed to set up tokens");

    console.log();
    console.log("Deploying platform");
    process.env.TESTING = true;
    const platform = await deployPlatform();
    console.log("Completed to deploy platform");
    console.log();

    return { platform, tokenInfo, tokenInstances };
  }

  async function setBalance(token, user, newBalance) {
    for (let i = 0; i < 40; i++) {
      const index = ethers.utils.solidityKeccak256(
        ["uint256", "uint256"],
        [user, i]
      );
      await helpers.setStorageAt(
        token,
        index,
        ethers.utils
          .hexlify(ethers.utils.zeroPad(newBalance.toHexString(), 32))
          .toString()
      );
    }
  }

  async function setup(collateralAddress, lendingAddress) {
    const { platform, tokenInfo, tokenInstances } = await loadFixture();

    const collateral = Object.values(tokenInstances).find((token) => token.address.toLowerCase() === collateralAddress.toLowerCase());
    const collateralAmount = tokenInfo[collateral.address].pairType ? 0.000000001 : 1000;
    const depositAmount = toBN("10").pow(tokenInfo[collateral.address].decimals).mul(collateralAmount * 10e9).div(10e9);

    const lending = Object.values(tokenInstances).find((token) => token.address.toLowerCase() === lendingAddress.toLowerCase());
    const lendingAmount = tokenInfo[lending.address].pairType ? 0.00001 : 5000;
    const lendingSupplyAmount = toBN("10").pow(tokenInfo[lending.address].decimals).mul(lendingAmount * 100000).div(100000);

    const updatePriceTokens = [collateral.address, lending.address];
    // Deposit collateral token
    await collateral.approve( platform.addresses.plpAddress, hre.ethers.constants.MaxUint256);
    await platform.contractInstance.plpInstance.deposit(collateral.address, depositAmount);
    // Supply lending token
    const { priceIds, updateFee } = await getPriceId(
      platform.contractInstance.priceProviderAggregatorInstance,
      [collateral.address, lending.address]
    );
    const updateData = await getPriceFeedsUpdateData(priceIds);

    const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lending.address)).bLendingToken;
    await lending.approve(bToken, hre.ethers.constants.MaxUint256);
    await platform.contractInstance.plpInstance.supply(lending.address, lendingSupplyAmount, updatePriceTokens, priceIds, updateData, { value: updateFee });

    const amount = await platform.contractInstance.plpInstance.convertPitRemaining(deployMaster.address, lending.address);
    const lendingTokenAmount = amount.div(10);

    await platform.contractInstance.plpInstance.borrow(lending.address, lendingTokenAmount, updatePriceTokens, priceIds, updateData, { value: updateFee });

    return {
      platform,
      collateral,
      collateralInfo: tokenInfo[collateral.address],
      lending,
      lendingInfo: tokenInfo[lending.address],
      depositAmount,
      lendingTokenAmount,
    };
  }

  function borrowERC20AndUsingERC20ToRepayAtomic() {
    return setup(USDC, USDT);
  }

  function borrowERC4626AndUsingERC4626ToRepayAtomic() {
    return setup(USDC_4626, DAI_4626);
  }

  function borrowERC20AndUsingERC4626ToRepayAtomic() {
    return setup(USDC_4626, DAI);
  }

  function borrowERC4626AndUsingLPToRepayAtomic() {
    return setup(USDC_USDT, USDC_4626);
  }

  function borrowERC20AndUsingLPToRepayAtomic() {
    return setup(USDC_USDT, DAI);
  }

  function borrowLPAndUsingERC20ToRepayAtomic() {
    return setup(DAI, USDC_USDT);
  }

  function borrowLPAndUsingERC4626ToRepayAtomic() {
    return setup(DAI_4626, USDC_USDT);
  }

  function borrowERC4626AndUsingERC20ToRepayAtomic() {
    return setup(DAI, DAI_4626);
  }

  describe("Repay atomic", function () {
    
    it("1. Borrow ERC20 and using ERC20 to repay atomic", async function () {
      const {
        platform,
        lendingTokenAmount,
        collateral,
        collateralInfo,
        lending,
        lendingInfo,
      } = await helpers.loadFixture(borrowERC20AndUsingERC20ToRepayAtomic);

      await processing(
        collateral,
        collateralInfo,
        lending,
        lendingInfo,
        lendingTokenAmount,
        platform.contractInstance.plpInstance,
        platform.contractInstance.plpAtomicRepayInstance
      );
    }).timeout(1000000);

    it("2. Borrow ERC4626 and using ERC4626 to repay atomic", async function () {
        const {
            platform,
            lendingTokenAmount,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
          } = await helpers.loadFixture(borrowERC4626AndUsingERC4626ToRepayAtomic);
    
          await processing(
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            lendingTokenAmount,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpAtomicRepayInstance
          );
    }).timeout(1000000);

    it("3. Borrow ERC20 and using ERC4626 to repay atomic", async function () {
        const {
            platform,
            lendingTokenAmount,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
          } = await helpers.loadFixture(borrowERC20AndUsingERC4626ToRepayAtomic);
    
          await processing(
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            lendingTokenAmount,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpAtomicRepayInstance
          );
    }).timeout(1000000);

    it("4. Borrow ERC4626 and using LP to repay atomic", async function () {
        const {
            platform,
            lendingTokenAmount,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
          } = await helpers.loadFixture(borrowERC4626AndUsingLPToRepayAtomic);
    
          await processing(
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            lendingTokenAmount,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpAtomicRepayInstance
          );
    }).timeout(1000000);

    it("5. Borrow ERC20 and using LP to repay atomic", async function () {
        const {
            platform,
            lendingTokenAmount,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
          } = await helpers.loadFixture(borrowERC20AndUsingLPToRepayAtomic);
    
          await processing(
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            lendingTokenAmount,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpAtomicRepayInstance
          );
    }).timeout(1000000);

    it("6. Borrow LP and using ERC20 to repay atomic", async function () {
        const {
            platform,
            lendingTokenAmount,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
          } = await helpers.loadFixture(borrowLPAndUsingERC20ToRepayAtomic);
    
          await processing(
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            lendingTokenAmount,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpAtomicRepayInstance
          );
    }).timeout(1000000);

    it("7. Borrow LP and using ERC4626 to repay atomic", async function () {
        const {
            platform,
            lendingTokenAmount,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
          } = await helpers.loadFixture(borrowLPAndUsingERC4626ToRepayAtomic);
    
          await processing(
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            lendingTokenAmount,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpAtomicRepayInstance
          );
    }).timeout(1000000);

    it("8. Borrow ERC4626 and using ERC20 to repay atomic", async function () {
        const {
            platform,
            lendingTokenAmount,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
          } = await helpers.loadFixture(borrowERC4626AndUsingERC20ToRepayAtomic);
    
          await processing(
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            lendingTokenAmount,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpAtomicRepayInstance
          );
    }).timeout(1000000);
  });
});