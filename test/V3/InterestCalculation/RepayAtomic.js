require("dotenv").config();
const hre = require("hardhat");
const { ethers } = require("ethers");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { DAI, USDC, USDT } = require("../utils/constants");
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
const { deployment } = require("../../../scripts/V3/deployPLP/deploymentPLP");

const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);
const connection = new EvmPriceServiceConnection("https://hermes.pyth.network")

describe("PrimaryLendingPlatformV3", function () {
  let signers;
  let deployMaster;
  let UniswapPriceProviderMock;
  let uniswapPriceProviderMockInstance;

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

  async function setHighPrice(tokenAddress, tokenDecimals, priceProviderAggregatorInstance) {
    let { collateralEvaluation, } = await priceProviderAggregatorInstance.getEvaluation(tokenAddress, toBN("10").pow(tokenDecimals));
    await uniswapPriceProviderMockInstance.setTokenAndPrice(tokenAddress, toBN(collateralEvaluation).mul(10));
    await priceProviderAggregatorInstance.setTokenAndPriceProvider(tokenAddress, uniswapPriceProviderMockInstance.address);
  }
  async function setLowPrice(tokenAddress, tokenDecimals, priceProviderAggregatorInstance, price) {
    await uniswapPriceProviderMockInstance.setTokenAndPrice(tokenAddress, price);
    await priceProviderAggregatorInstance.setTokenAndPriceProvider(tokenAddress, uniswapPriceProviderMockInstance.address);
  }

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
      usdt: loadContractInstance(USDT, ERC20_ABI, deployMaster),
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
      [tokenInstances.usdt.address]: {
        address: tokenInstances.usdt.address,
        tokenType: TokenType.ERC20,
        decimals: 6,
      }
    };

    console.log("Setting up tokens");
    await setBalance(DAI, deployMaster.address, toBN("1000000000000000000000000000000000000000"));
    await setBalance(USDT, deployMaster.address, toBN("1000000000000000000000000000000000000000"));
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

    const addresses = await deployment();
    UniswapPriceProviderMock = await hre.ethers.getContractFactory("UniswapV2PriceProviderMock");
    uniswapPriceProviderMockInstance = UniswapPriceProviderMock.attach(addresses.uniswapV2PriceProviderMockAddress).connect(deployMaster)

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

  describe("Repay atomic", function () {
    it("1. Test when add _deferLiquidityCheck function and isRepayFully == false", async function () {
      const { platform, tokenInstances, tokenInfo } = await helpers.loadFixture(setup);

      const prjToken = tokenInstances.dai;
      const depositAmount = toBN("10").pow(tokenInfo[prjToken.address].decimals);
      const lendingToken = tokenInstances.usdc;
      const supplyAmount = toBN("100").pow(tokenInfo[lendingToken.address].decimals);
      const updatePriceTokens = [prjToken.address, lendingToken.address];

      const { priceIds, updateFee } = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      const updateData = await getPriceFeedsUpdateData(priceIds);
      
      await prjToken.approve(platform.addresses.plpAddress, depositAmount);
      await platform.contractInstance.plpInstance.deposit(prjToken.address, depositAmount, [prjToken.address], [], []);
      const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      await lendingToken.approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})

      const pitRemaining = await platform.contractInstance.plpInstance.convertPitRemaining(deployMaster.address, lendingToken.address);
      const lendingTokenAmount = toBN(100);

      await platform.contractInstance.plpInstance.borrow(lendingToken.address, pitRemaining, updatePriceTokens, priceIds, updateData, {value: updateFee})
      
      let hf = await platform.contractInstance.plpInstance.healthFactor(deployMaster.address);
      while(hf[0].gt(hf[1])) {
        await setHighPrice(lendingToken.address, tokenInfo[lendingToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance)
        hf = await platform.contractInstance.plpInstance.healthFactor(deployMaster.address);
        console.log(hf[0], hf[1])
      }
      
      const estimateData = await estimateBuy(tokenInfo[prjToken.address], tokenInfo[lendingToken.address], lendingTokenAmount, platform.contractInstance.plpAtomicRepayInstance.address, "0.05", "1", Dex.Paraswap, deployMaster.provider);

      await expect(platform.contractInstance.plpAtomicRepayInstance.repayAtomic(getTokenTuple(tokenInfo[lendingToken.address]), getTokenTuple(tokenInfo[prjToken.address]), estimateData.estimateAmountIn.mul(105).div(100), estimateData.buyCallData, false, updatePriceTokens, priceIds, updateData, {value: updateFee})).revertedWith("AtomicRepayment: lendingTokenAmount exceeds pit remaining")
    }).timeout(1000000)

    it("2. Test when add _deferLiquidityCheck function and isRepayFully == true", async function () {
      const { platform, tokenInstances, tokenInfo } = await helpers.loadFixture(setup);

      const prjToken = tokenInstances.dai;
      const depositAmount = toBN("10").pow(tokenInfo[prjToken.address].decimals);
      const lendingToken = tokenInstances.usdc;
      const supplyAmount = toBN("100").pow(tokenInfo[lendingToken.address].decimals);
      const lendingToken2 = tokenInstances.usdt;
      const supplyAmount2 = toBN("100").pow(tokenInfo[lendingToken2.address].decimals);
      const updatePriceTokens = [prjToken.address, lendingToken.address, lendingToken2.address];

      const { priceIds, updateFee } = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address, lendingToken2.address]);
      const updateData = await getPriceFeedsUpdateData(priceIds);
      
      await prjToken.approve(platform.addresses.plpAddress, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.deposit(prjToken.address, depositAmount, [prjToken.address], [], []);
      
      const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      await lendingToken.approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})
      const bToken2 = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken2.address)).bLendingToken;
      await lendingToken2.approve(bToken2, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.supply(lendingToken2.address, supplyAmount2, updatePriceTokens, priceIds, updateData, {value: updateFee})

      const pitRemaining = await platform.contractInstance.plpInstance.convertPitRemaining(deployMaster.address, lendingToken.address);
      await platform.contractInstance.plpInstance.borrow(lendingToken.address, pitRemaining.div(2), updatePriceTokens, priceIds, updateData, {value: updateFee})

      const pitRemaining2 = await platform.contractInstance.plpInstance.convertPitRemaining(deployMaster.address, lendingToken2.address);
      await platform.contractInstance.plpInstance.borrow(lendingToken2.address, pitRemaining2, updatePriceTokens, priceIds, updateData, {value: updateFee})

      const lendingTokenAmount = pitRemaining.add(2);

      const hfBefore = await platform.contractInstance.plpInstance.healthFactor(deployMaster.address);
      
      const estimateData = await estimateBuy(tokenInfo[prjToken.address], tokenInfo[lendingToken.address], lendingTokenAmount, platform.contractInstance.plpAtomicRepayInstance.address, "0.05", "1", Dex.Paraswap, deployMaster.provider);

      await expect(platform.contractInstance.plpAtomicRepayInstance.repayAtomic(getTokenTuple(tokenInfo[lendingToken.address]), getTokenTuple(tokenInfo[prjToken.address]), estimateData.estimateAmountIn.mul(105).div(100), estimateData.buyCallData, true, updatePriceTokens, priceIds, updateData, {value: updateFee})).revertedWith('AtomicRepayment: lendingTokenAmount exceeds pit remaining')

    }).timeout(1000000)
    it("3. Repay successfully after adding _deferLiquidityCheck function", async function () {
      const { platform, tokenInstances, tokenInfo } = await helpers.loadFixture(setup);

      const prjToken = tokenInstances.dai;
      const depositAmount = toBN("10").pow(tokenInfo[prjToken.address].decimals);
      const lendingToken = tokenInstances.usdc;
      const supplyAmount = toBN("100").pow(tokenInfo[lendingToken.address].decimals);
      const updatePriceTokens = [prjToken.address, lendingToken.address];

      const { priceIds, updateFee } = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      const updateData = await getPriceFeedsUpdateData(priceIds);
      
      await prjToken.approve(platform.addresses.plpAddress, depositAmount);
      await platform.contractInstance.plpInstance.deposit(prjToken.address, depositAmount, [prjToken.address], [], []);
      const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      await lendingToken.approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})

      const lendingTokenAmount = toBN(100000);

      await platform.contractInstance.plpInstance.borrow(lendingToken.address, lendingTokenAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})
      
      const estimateData = await estimateBuy(tokenInfo[prjToken.address], tokenInfo[lendingToken.address], lendingTokenAmount, platform.contractInstance.plpAtomicRepayInstance.address, "0.05", "1", Dex.Paraswap, deployMaster.provider);

      const balanceLendingUserBeforeRepay = await lendingToken.balanceOf(deployMaster.address);
      const depositedAmountBefore = await platform.contractInstance.plpInstance.depositedAmount(deployMaster.address, prjToken.address);
      const totalOutstandingBefore = await platform.contractInstance.plpInstance.outstanding(deployMaster.address, lendingToken.address);

      const tx = await platform.contractInstance.plpAtomicRepayInstance.repayAtomic(getTokenTuple(tokenInfo[lendingToken.address]), getTokenTuple(tokenInfo[prjToken.address]), estimateData.estimateAmountIn.mul(105).div(100), estimateData.buyCallData, true, updatePriceTokens, priceIds, updateData, {value: updateFee})

      const rs = await tx.wait();
      const event = rs.events.find((x) => x.event === "AtomicRepayment").args;

      const balanceLendingUserAfterRepay = await lendingToken.balanceOf(deployMaster.address);
      const depositedAmountAfter = await platform.contractInstance.plpInstance.depositedAmount(deployMaster.address, prjToken.address);
      const totalOutstandingAfter = await platform.contractInstance.plpInstance.outstanding(deployMaster.address, lendingToken.address);

      expect(balanceLendingUserBeforeRepay).to.eq(balanceLendingUserAfterRepay)
      expect(depositedAmountBefore.sub(event.amountSold)).to.be.eq(depositedAmountAfter);
      expect(totalOutstandingAfter.add(lendingTokenAmount)).to.be.eq(totalOutstandingBefore)
    }).timeout(1000000)
  })
});