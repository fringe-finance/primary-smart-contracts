require("dotenv").config();
const hre = require("hardhat");
const { ethers } = require("ethers");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { DAI, USDC } = require("./utils/constants");
const { TokenType } = require("./estimate-scripts/enum/tokenType");
const { deployPlatform } = require("./utils/deployPlatform");
const {
  loadContractInstance,
} = require("./estimate-scripts/utils/loadContract");
const { ERC20_ABI } = require("./estimate-scripts/abis/ERC20");
const { UniswapV2Pair_ABI } = require("./estimate-scripts/abis/UniswapV2Pair");
const { ERC4626_ABI } = require("./estimate-scripts/abis/ERC4626");
const { estimateBuy, estimateSell } = require("./estimate-scripts");
const { expect } = require("chai");
const { EvmPriceServiceConnection } = require("@pythnetwork/pyth-evm-js");
const { Dex } = require("./estimate-scripts/enum/dexType");

const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);
const connection = new EvmPriceServiceConnection("https://hermes.pyth.network")

describe("PrimaryLendingPlatformLeverageV3", function () {
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
      tokenAddressList, BN.from(15)
    )
    return { priceIds, updateFee }
  }

  async function getPriceFeedsUpdateData(priceIds) {
    if (priceIds.length === 0) return [];
    const updateData = await connection.getPriceFeedsUpdateData(priceIds);
    return updateData;
  }

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
    };

    const tokenInfo = {
      [tokenInstances.dai.address]: {
        address: tokenInstances.dai.address,
        tokenType: TokenType.ERC20,
        decimals: 18,
      },
      [tokenInstances.usdc.address]: {
        address: tokenInstances.usdc.address,
        tokenType: TokenType.ERC20,
        decimals: 6,
      },
    };

    console.log("Setting up tokens");
    await setBalance(DAI, deployMaster.address, toBN("1000000000000000000000000000000000000000"));
    await setBalance(
      USDC,
      deployMaster.address,
      toBN("1000000000000000000000000000000000000000")
    );
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

  async function setup() {
    const { tokenInstances, tokenInfo, platform } = await loadFixture();

    return {
        platform, tokenInfo, tokenInstances
    }
  }

  describe("leveragedBorrow", function () {
    it("1. Should revert when totalPitRemaining + collateralPIT >= notionalExposure", async function () {
      const { platform, tokenInfo, tokenInstances } = await helpers.loadFixture(setup);

      const prjToken = tokenInstances.dai;
      const depositAmount = toBN("10").pow(tokenInfo[prjToken.address].decimals);
      const lendingToken = tokenInstances.usdc;
      const supplyAmount = toBN("100").pow(tokenInfo[lendingToken.address].decimals);
      const updatePriceTokens = [prjToken.address, lendingToken.address];
      const buyCalldata = ['0x'];
      const type = toBN(0);
      const notionalExposure = await platform.contractInstance.plpInstance.getTokenEvaluation(lendingToken.address, toBN(20).pow(tokenInfo[lendingToken.address].decimals))
      const margin = toBN(1000);

      const { priceIds, updateFee } = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      const updateData = await getPriceFeedsUpdateData(priceIds);
      
      await prjToken.approve(platform.addresses.plpAddress, depositAmount);
      await platform.contractInstance.plpInstance.deposit(prjToken.address, depositAmount, [], [], []);
      const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      await lendingToken.approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})

      const totalPITRemaining = await platform.contractInstance.plpInstance.totalPITRemaining(deployMaster.address)
      const collateralPIT = toBN(notionalExposure[1]).mul(60).div(100)
      
      expect(totalPITRemaining.add(collateralPIT)).to.be.lt(notionalExposure[1]);
      await expect(platform.contractInstance.plpLeverageInstance.leveragedBorrow(getTokenTuple(tokenInfo[prjToken.address]), getTokenTuple(tokenInfo[lendingToken.address]), notionalExposure[1], margin, buyCalldata, type, updatePriceTokens, priceIds, updateData, {value: updateFee})).to.be.revertedWith('Leverage: not enough total pit remaining')

    }).timeout(1000000)

    it("2. Should revert when lendingTokenAmount exceeds pit remaining", async function () {
      const { platform, tokenInfo, tokenInstances } = await helpers.loadFixture(setup);

      const prjToken = tokenInstances.dai;
      const depositAmount = toBN("10").pow(tokenInfo[prjToken.address].decimals);
      const lendingToken = tokenInstances.usdc;
      const supplyAmount = toBN("100").pow(tokenInfo[lendingToken.address].decimals);
      const updatePriceTokens = [prjToken.address, lendingToken.address];
      const buyCalldata = ['0x'];
      const type = toBN(0);
      const notionalExposure = await platform.contractInstance.plpInstance.getTokenEvaluation(lendingToken.address, toBN(10).pow(tokenInfo[lendingToken.address].decimals))
      const margin = toBN(1000);

      const { priceIds, updateFee } = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      const updateData = await getPriceFeedsUpdateData(priceIds);
      
      await prjToken.approve(platform.addresses.plpAddress, depositAmount);
      await platform.contractInstance.plpInstance.deposit(prjToken.address, depositAmount, [], [], []);
      const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      await lendingToken.approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})

      const totalPIT = await platform.contractInstance.plpInstance.totalPIT(deployMaster.address)

      await lendingToken.approve(platform.addresses.plpLeverageAddress, hre.ethers.constants.MaxUint256);
      await prjToken.approve(platform.addresses.plpLeverageAddress, hre.ethers.constants.MaxUint256);
      await expect(platform.contractInstance.plpLeverageInstance.leveragedBorrow(getTokenTuple(tokenInfo[prjToken.address]), getTokenTuple(tokenInfo[lendingToken.address]), notionalExposure[1], margin, buyCalldata, type, updatePriceTokens, priceIds, updateData, {value: updateFee})).to.be.revertedWith('PLPLeverage: lendingTokenAmount exceeds pit remaining')
      // await platform.contractInstance.plpLeverageInstance.leveragedBorrow(prjToken.address, lendingToken.address, notionalExposure[1], margin, buyCalldata, type, updatePriceTokens, priceIds, updateData, {value: updateFee})

      const outStandingInUSD = await platform.contractInstance.plpInstance.outstandingInUSD(deployMaster.address, lendingToken.address)
      const totalWeightedInUSD = toBN(outStandingInUSD).mul(100).div(90)

    }).timeout(1000000)

    it("3. Should revert when totalBorrow exceeded borrowLimit per lending asset", async function () {
      const { platform, tokenInfo, tokenInstances } = await helpers.loadFixture(setup);

      const prjToken = tokenInstances.dai;
      const depositAmount = toBN("15").pow(tokenInfo[prjToken.address].decimals);
      const lendingToken = tokenInstances.usdc;
      const supplyAmount = toBN("100").pow(tokenInfo[lendingToken.address].decimals);
      const updatePriceTokens = [prjToken.address, lendingToken.address];
      const buyCalldata = ['0x'];
      const type = toBN(0);
      const notionalExposure = await platform.contractInstance.plpInstance.getTokenEvaluation(lendingToken.address, toBN(30).pow(tokenInfo[lendingToken.address].decimals))
      const margin = toBN(1000);

      const { priceIds, updateFee } = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      const updateData = await getPriceFeedsUpdateData(priceIds);
      
      await prjToken.approve(platform.addresses.plpAddress, depositAmount);
      await platform.contractInstance.plpInstance.deposit(prjToken.address, depositAmount, [], [], []);
      const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      await lendingToken.approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})

      await lendingToken.approve(platform.addresses.plpLeverageAddress, hre.ethers.constants.MaxUint256);
      await prjToken.approve(platform.addresses.plpLeverageAddress, hre.ethers.constants.MaxUint256);
      await expect(platform.contractInstance.plpLeverageInstance.leveragedBorrow(getTokenTuple(tokenInfo[prjToken.address]), getTokenTuple(tokenInfo[lendingToken.address]), notionalExposure[1], margin, buyCalldata, type, updatePriceTokens, priceIds, updateData, {value: updateFee})).to.be.revertedWith('PLPLeverage: totalBorrow exceeded borrowLimit per lending asset')

      // const borrowedPerLendingTokenInUSD = await platform.contractInstance.plpInstance.getBorrowedPerLendingTokenInUSD(lendingToken.address);
      // console.log('borrowedPerLendingTokenInUSD', borrowedPerLendingTokenInUSD.toString());

      // const borrowLimitPerLendingTokenInUSD = await platform.contractInstance.plpInstance.borrowLimitPerLendingToken(lendingToken.address);
      // console.log('borrowLimitPerLendingTokenInUSD', borrowLimitPerLendingTokenInUSD.toString());

    }).timeout(1000000)

    it("4. Should revert when totalDeposit exceeded depositLimit per collateral asset", async function () {
      const { platform, tokenInfo, tokenInstances } = await helpers.loadFixture(setup);

      const prjToken = tokenInstances.dai;
      const depositAmount = toBN("100").pow(tokenInfo[prjToken.address].decimals);
      const lendingToken = tokenInstances.usdc;
      const supplyAmount = toBN("100").pow(tokenInfo[lendingToken.address].decimals);
      const updatePriceTokens = [prjToken.address, lendingToken.address];
      const buyCalldata = ['0x'];
      const type = toBN(0);
      const notionalExposure = await platform.contractInstance.plpInstance.getTokenEvaluation(lendingToken.address, toBN(10).pow(tokenInfo[lendingToken.address].decimals))
      const margin = toBN(1000);

      const { priceIds, updateFee } = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      const updateData = await getPriceFeedsUpdateData(priceIds);
      
      await prjToken.approve(platform.addresses.plpAddress, depositAmount);
      await expect(platform.contractInstance.plpInstance.deposit(prjToken.address, depositAmount, [], [], [])).to.be.revertedWith('TotalDepositExceededLimit()')
      const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      await lendingToken.approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})

      await lendingToken.approve(platform.addresses.plpLeverageAddress, hre.ethers.constants.MaxUint256);
      await prjToken.approve(platform.addresses.plpLeverageAddress, hre.ethers.constants.MaxUint256);

      await expect(platform.contractInstance.plpLeverageInstance.leveragedBorrow(getTokenTuple(tokenInfo[prjToken.address]), getTokenTuple(tokenInfo[lendingToken.address]), notionalExposure[1], margin, buyCalldata, type, updatePriceTokens, priceIds, updateData, {value: updateFee})).to.be.revertedWith('PLPLeverage: totalBorrow exceeded borrowLimit per lending asset').to.be.revertedWith('Leverage: not enough total pit remaining')
      
      // const depositedPerProjectTokenInUSD = await platform.contractInstance.plpInstance.getDepositedPerProjectTokenInUSD(prjToken.address);
      // console.log('depositedPerProjectTokenInUSD', depositedPerProjectTokenInUSD.toString());

      // const depositLimitPerProjectToken = await platform.contractInstance.plpInstance.depositLimitPerProjectToken(prjToken.address);
      // console.log('depositLimitPerProjectToken', depositLimitPerProjectToken.toString());

    }).timeout(1000000)

    it("5. Leveraged Borrow successfully", async function () {
      const { platform, tokenInfo, tokenInstances } = await helpers.loadFixture(setup);

      const prjToken = tokenInstances.dai;
      const depositAmount = toBN("15").pow(tokenInfo[prjToken.address].decimals);
      const lendingToken = tokenInstances.usdc;
      const supplyAmount = toBN("100").pow(tokenInfo[lendingToken.address].decimals);
      const updatePriceTokens = [prjToken.address, lendingToken.address];
      const type = toBN(0);

      const notionalExposure = await platform.contractInstance.plpInstance.getTokenEvaluation(lendingToken.address, toBN(10).pow(tokenInfo[lendingToken.address].decimals))

      const margin = await platform.contractInstance.plpLeverageInstance.calculateMargin(prjToken.address, lendingToken.address, toBN(20), toBN(10), notionalExposure[1]);
      
      const { priceIds, updateFee } = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      const updateData = await getPriceFeedsUpdateData(priceIds);
      
      await prjToken.approve(platform.addresses.plpAddress, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.deposit(prjToken.address, depositAmount, [], [], []);
      
      const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      await lendingToken.approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})

      const totalBorrowedPerLendingTokenBefore = await platform.contractInstance.plpInstance.totalBorrowedPerLendingToken(lendingToken.address)
      const depositedAmountBefore = await platform.contractInstance.plpInstance.depositedAmount(deployMaster.address, prjToken.address)
      const totalDepositedPerProjectTokenBefore = await platform.contractInstance.plpInstance.totalDepositedPerProjectToken(prjToken.address)

      const estimateData = await estimateSell(tokenInfo[lendingToken.address], tokenInfo[prjToken.address], toBN(1000000), "0.05", platform.addresses.plpLeverageAddress, "1", Dex.Paraswap, deployMaster.provider);

      await lendingToken.approve(platform.addresses.plpLeverageAddress, hre.ethers.constants.MaxUint256);
      await prjToken.approve(platform.addresses.plpLeverageAddress, hre.ethers.constants.MaxUint256);
      const tx = await platform.contractInstance.plpLeverageInstance.leveragedBorrow(getTokenTuple(tokenInfo[prjToken.address]), getTokenTuple(tokenInfo[lendingToken.address]), notionalExposure[1], margin, estimateData.buyCallData, type, updatePriceTokens, priceIds, updateData, {value: updateFee})
      const receipt = await tx.wait();
      const events = receipt.events;
      let argsEvent;
      for (let i = 0; i < events.length; i++) {
        if (events[i]?.event == "LeveragedBorrow") {
          argsEvent = events[i].args;
          break;
        }
      }

      const totalBorrowedPerLendingTokenAfter = await platform.contractInstance.plpInstance.totalBorrowedPerLendingToken(lendingToken.address)
      const depositedAmountAfter = await platform.contractInstance.plpInstance.depositedAmount(deployMaster.address, prjToken.address)
      const totalDepositedPerProjectTokenAfter = await platform.contractInstance.plpInstance.totalDepositedPerProjectToken(prjToken.address)

      expect(totalBorrowedPerLendingTokenBefore.add(toBN(1000000))).to.eq(totalBorrowedPerLendingTokenAfter)
      expect(depositedAmountBefore.add(argsEvent.amountReceive)).to.eq(depositedAmountAfter)

    }).timeout(1000000)
  })
});