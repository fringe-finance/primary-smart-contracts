require("dotenv").config();
const hre = require("hardhat");
const { ethers } = require("ethers");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { DAI, USDC } = require("./utils/constants");
const { TokenType } = require("./estimate-scripts/enum/tokenType") 
const { deployPlatform } = require("./utils/deployPlatform");
const {
  loadContractInstance,
} = require("./estimate-scripts/utils/loadContract");
const { ERC20_ABI } = require("./estimate-scripts/abis/ERC20");
const { UniswapV2Pair_ABI } = require("./estimate-scripts/abis/UniswapV2Pair");
const { ERC4626_ABI } = require("./estimate-scripts/abis/ERC4626");
const { estimate } = require("./estimate-scripts");
const { expect } = require("chai");
const { EvmPriceServiceConnection } = require("@pythnetwork/pyth-evm-js");
const { deployment } = require("../../scripts/V3/deployPLP/deploymentPLP");

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
    await setBalance(DAI, deployMaster.address, toBN("10000000000000000000000000000000000000000"));
    await setBalance(
      USDC,
      deployMaster.address,
      toBN("10000000000000000000000000000000000000000")
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

  describe("deposit", function () {
    it("1. Should revert when deposit > depositLimitPerProjectToken", async function () {
      const { platform, tokenInstances, tokenInfo } = await helpers.loadFixture(setup);
      const prjToken = tokenInstances.dai;
      const depositAmount = toBN("100").pow(tokenInfo[prjToken.address].decimals);

      await prjToken.approve(platform.addresses.plpAddress, depositAmount);
      await expect(platform.contractInstance.plpInstance.deposit(prjToken.address, depositAmount, [prjToken.address], [], [])).to.be.revertedWith("TotalDepositExceededLimit()");

    }).timeout(1000000)

    it("2. Deposit successfully", async function () {
      const { platform, tokenInstances, tokenInfo } = await helpers.loadFixture(setup);
      const prjToken = tokenInstances.dai;
      const depositAmount = toBN("10").pow(tokenInfo[prjToken.address].decimals);

      const balanceBeforeDeposit = await prjToken.balanceOf(deployMaster.address);
      const balancePLPBeforeDeposit = await prjToken.balanceOf(platform.addresses.plpAddress);

      await prjToken.approve(platform.addresses.plpAddress, depositAmount);
      await platform.contractInstance.plpInstance.deposit(prjToken.address, depositAmount, [prjToken.address], [], []);

      const balanceAfterDeposit = await prjToken.balanceOf(deployMaster.address);
      const balancePLPAfterDeposit = await prjToken.balanceOf(platform.addresses.plpAddress);

      expect(balanceBeforeDeposit.sub(depositAmount)).to.be.equal(balanceAfterDeposit);
      expect(balancePLPBeforeDeposit.add(depositAmount)).to.be.equal(balancePLPAfterDeposit);
    })
  })

  describe("withdraw", function () {
    it("1. Should revert when collateralAvailableToWithdraw == 0", async function () {
      const { platform, tokenInstances, tokenInfo } = await helpers.loadFixture(setup);

      const prjToken = tokenInstances.dai;
      const depositAmount = toBN("10").pow(tokenInfo[prjToken.address].decimals);
      const prjTokenAmount = ethers.constants.MaxUint256;
      const lendingToken = tokenInstances.usdc;
      const supplyAmount = toBN("10").pow(tokenInfo[lendingToken.address].decimals);
      const updatePriceTokens = [prjToken.address, lendingToken.address];

      const { priceIds, updateFee } = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      const updateData = await getPriceFeedsUpdateData(priceIds);
      
      await prjToken.approve(platform.addresses.plpAddress, depositAmount);
      await platform.contractInstance.plpInstance.deposit(prjToken.address, depositAmount, [prjToken.address], [], []);
      const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      await lendingToken.approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})
      
      const lendingTokenAmount = await platform.contractInstance.plpInstance.convertPitRemaining(deployMaster.address, lendingToken.address);
      await platform.contractInstance.plpInstance.borrow(lendingToken.address, lendingTokenAmount.add(10000000), updatePriceTokens, priceIds, updateData, {value: updateFee})

      let hf = await platform.contractInstance.plpInstance.healthFactor(deployMaster.address);

      while(hf[0].gt(hf[1])) {
        await setHighPrice(lendingToken.address, tokenInfo[lendingToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance)
        hf = await platform.contractInstance.plpInstance.healthFactor(deployMaster.address);
      }

      const availableToWithdraw = await platform.contractInstance.plpInstance.getCollateralAvailableToWithdraw(deployMaster.address, prjToken.address);

      await expect(platform.contractInstance.plpInstance.withdraw(prjToken.address, prjTokenAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})).to.be.revertedWith("WithdrawableAmountIsZero()");
      
    }).timeout(1000000)

    it("2. Withdraw successfully", async function () {
      const { platform, tokenInstances, tokenInfo } = await helpers.loadFixture(setup);
      const prjToken = tokenInstances.dai;
      const depositAmount = toBN("10").pow(tokenInfo[prjToken.address].decimals);
      const lendingToken = tokenInstances.usdc;
      const updatePriceTokens = [prjToken.address, lendingToken.address];

      const { priceIds, updateFee } = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      const updateData = await getPriceFeedsUpdateData(priceIds);
      
      await prjToken.approve(platform.addresses.plpAddress, depositAmount);
      await platform.contractInstance.plpInstance.deposit(prjToken.address, depositAmount, [prjToken.address], [], []);

      const availableToWithdraw = await platform.contractInstance.plpInstance.getCollateralAvailableToWithdraw(deployMaster.address, prjToken.address);

      const balanceUserBeforeWithdraw = await prjToken.balanceOf(deployMaster.address);
      const balancePLPBeforeWithdraw = await prjToken.balanceOf(platform.addresses.plpAddress);
      const depositedAmountBeforeWithdraw = await platform.contractInstance.plpInstance.depositedAmount(deployMaster.address, prjToken.address);

      await platform.contractInstance.plpInstance.withdraw(prjToken.address, availableToWithdraw, updatePriceTokens, priceIds, updateData, {value: updateFee});

      const balanceUserAfterWithdraw = await prjToken.balanceOf(deployMaster.address);
      const balancePLPAfterWithdraw = await prjToken.balanceOf(platform.addresses.plpAddress);
      const depositedAmountAfterWithdraw = await platform.contractInstance.plpInstance.depositedAmount(deployMaster.address, prjToken.address);

      expect(balanceUserBeforeWithdraw.add(availableToWithdraw)).to.be.equal(balanceUserAfterWithdraw);
      expect(balancePLPBeforeWithdraw.sub(availableToWithdraw)).to.be.equal(balancePLPAfterWithdraw);
      expect(depositedAmountBeforeWithdraw.sub(availableToWithdraw)).to.be.equal(depositedAmountAfterWithdraw);
    }).timeout(1000000)
  })

  describe("supply", function () {
    it("1. Supply successfully", async function () {
      const { platform, tokenInstances, tokenInfo } = await helpers.loadFixture(setup);

      const prjToken = tokenInstances.dai;
      const lendingToken = tokenInstances.usdc;
      const supplyAmount = toBN("10").pow(tokenInfo[lendingToken.address].decimals);
      const updatePriceTokens = [lendingToken.address]

      const { priceIds, updateFee } = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      const updateData = await getPriceFeedsUpdateData(priceIds);
      
      const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      let blt = await hre.ethers.getContractFactory("BLendingToken");
      let bltInstance = blt.attach(bToken).connect(deployMaster);
      
      const balanceUserBeforeSupply = await lendingToken.balanceOf(deployMaster.address);
      const balanceUserBTokenBeforeSupply = await bltInstance.balanceOf(deployMaster.address);
      const balanceBTokenBeforeSupply = await lendingToken.balanceOf(bToken);
      const totalSupplyTokenBeforeSupply = await bltInstance.totalSupply();
      
      await lendingToken.approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})
      const exchangeRate = Number((await bltInstance.exchangeRateStored()).div(toBN(10).pow(18)))

      const balanceUserAfterSupply = await lendingToken.balanceOf(deployMaster.address);
      const balanceUserBTokenAfterSupply = await bltInstance.balanceOf(deployMaster.address);
      const balanceBTokenAfterSupply = await lendingToken.balanceOf(bToken);
      const totalSupplyTokenAfterSupply = await bltInstance.totalSupply();

      expect(balanceUserBeforeSupply.sub(supplyAmount)).to.be.equal(balanceUserAfterSupply);
      expect(balanceUserBTokenBeforeSupply.add(supplyAmount.div(exchangeRate))).to.be.equal(balanceUserBTokenAfterSupply);
      expect(balanceBTokenBeforeSupply.add(supplyAmount)).to.be.equal(balanceBTokenAfterSupply);
      expect(totalSupplyTokenBeforeSupply.add(supplyAmount.div(exchangeRate))).to.be.equal(totalSupplyTokenAfterSupply);
    }).timeout(1000000)
  })

  describe("redeem", function () {
    it("1. Redeem successfully", async function () {
      const { platform, tokenInstances, tokenInfo } = await helpers.loadFixture(setup);
      const prjToken = tokenInstances.dai;
      const lendingToken = tokenInstances.usdc;
      const supplyAmount = toBN("10").pow(tokenInfo[lendingToken.address].decimals);
      const updatePriceTokens = [prjToken.address, lendingToken.address];
      const redeemAmount = toBN(10);
      
      const { priceIds, updateFee } = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      const updateData = await getPriceFeedsUpdateData(priceIds);

      const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      let blt = await hre.ethers.getContractFactory("BLendingToken");
      let bltInstance = blt.attach(bToken).connect(deployMaster);
      const exchangeRate = Number((await bltInstance.exchangeRateStored()).div(toBN(10).pow(18)))

      await lendingToken.approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})

      const balanceUserBeforeRedeem = await lendingToken.balanceOf(deployMaster.address);
      const balanceUserBTokenBeforeRedeem = await bltInstance.balanceOf(deployMaster.address);
      const balanceBTokenBeforeRedeem = await lendingToken.balanceOf(bToken);

      await platform.contractInstance.plpInstance.redeem(lendingToken.address, redeemAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})

      const balanceUserAfterRedeem = await lendingToken.balanceOf(deployMaster.address);
      const balanceUserBTokenAfterRedeem = await bltInstance.balanceOf(deployMaster.address);
      const balanceBTokenAfterRedeem = await lendingToken.balanceOf(bToken);

      expect(balanceUserBeforeRedeem.add(redeemAmount.mul(exchangeRate))).to.be.equal(balanceUserAfterRedeem);
      expect(balanceUserBTokenBeforeRedeem.sub(redeemAmount)).to.be.equal(balanceUserBTokenAfterRedeem);
      expect(balanceBTokenBeforeRedeem.sub(redeemAmount.mul(exchangeRate))).to.be.equal(balanceBTokenAfterRedeem);

    }).timeout(1000000)
  })

  describe("redeemUnderlying", function () {
    it("1. Redeem underlying successfully", async function () {
      const { platform, tokenInstances, tokenInfo } = await helpers.loadFixture(setup);
      
      const prjToken = tokenInstances.dai;
      const lendingToken = tokenInstances.usdc;
      const supplyAmount = toBN("10").pow(tokenInfo[lendingToken.address].decimals);
      const updatePriceTokens = [prjToken.address, lendingToken.address];
      const redeemAmount = toBN(10)

      const { priceIds, updateFee } = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      const updateData = await getPriceFeedsUpdateData(priceIds);

      const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      let blt = await hre.ethers.getContractFactory("BLendingToken");
      let bltInstance = blt.attach(bToken).connect(deployMaster);
      const exchangeRate = Number((await bltInstance.exchangeRateStored()).div(toBN(10).pow(18)))

      await lendingToken.approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})

      const balanceUserBeforeRedeemUnderlying = await lendingToken.balanceOf(deployMaster.address);
      const balanceUserBTokenBeforeRedeemUnderlying = await bltInstance.balanceOf(deployMaster.address);
      const balanceBTokenBeforeRedeemUnderlying = await lendingToken.balanceOf(bToken);

      await platform.contractInstance.plpInstance.redeemUnderlying(lendingToken.address, redeemAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})

      const balanceUserAfterRedeemUnderlying = await lendingToken.balanceOf(deployMaster.address);
      const balanceUserBTokenAfterRedeemUnderlying = await bltInstance.balanceOf(deployMaster.address);
      const balanceBTokenAfterRedeemUnderlying = await lendingToken.balanceOf(bToken);

      expect(balanceUserBeforeRedeemUnderlying.add(redeemAmount)).to.be.equal(balanceUserAfterRedeemUnderlying);
      expect(balanceUserBTokenBeforeRedeemUnderlying.sub(redeemAmount/exchangeRate)).to.be.equal(balanceUserBTokenAfterRedeemUnderlying);
      expect(balanceBTokenBeforeRedeemUnderlying.sub(redeemAmount)).to.be.equal(balanceBTokenAfterRedeemUnderlying);
    }).timeout(1000000)
  })

  describe("borrow", function () {
    it("1. Should revert when pitRemaining == 0", async function () {
      const { platform, tokenInstances, tokenInfo } = await helpers.loadFixture(setup);

      const prjToken = tokenInstances.dai;
      const depositAmount = toBN("10").pow(tokenInfo[prjToken.address].decimals);
      const lendingToken = tokenInstances.usdc;
      const supplyAmount = toBN("10").pow(tokenInfo[lendingToken.address].decimals);
      const updatePriceTokens = [prjToken.address, lendingToken.address];

      const { priceIds, updateFee } = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      const updateData = await getPriceFeedsUpdateData(priceIds);
      
      await prjToken.approve(platform.addresses.plpAddress, depositAmount);
      await platform.contractInstance.plpInstance.deposit(prjToken.address, depositAmount, [prjToken.address], [], []);
      const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      await lendingToken.approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})

      const convertPitRemaining = await platform.contractInstance.plpInstance.convertPitRemaining(deployMaster.address, lendingToken.address);
      
      await platform.contractInstance.plpInstance.borrow(lendingToken.address, convertPitRemaining, updatePriceTokens, priceIds, updateData, {value: updateFee})

      const pitRemaining = await platform.contractInstance.plpInstance.convertPitRemaining(deployMaster.address, lendingToken.address);
      await expect(platform.contractInstance.plpInstance.borrow(lendingToken.address, pitRemaining.add(10), updatePriceTokens, priceIds, updateData, {value: updateFee})).to.be.revertedWith('PitRemainingIsZero()')
    }).timeout(1000000)

    it("2. Should revert when total borrow exceeded limit borrow", async function () {
      const { platform, tokenInstances, tokenInfo } = await helpers.loadFixture(setup);

      const prjToken = tokenInstances.dai;
      const depositAmount = toBN("15").pow(tokenInfo[prjToken.address].decimals);
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

      const totalPITRemaining = await platform.contractInstance.plpInstance.totalPITRemaining(deployMaster.address);
      const lendingTokenAmount = toBN("30").pow(tokenInfo[lendingToken.address].decimals);

      const lendingTokenAmountInUSD = await platform.contractInstance.plpInstance.getTokenEvaluation(lendingToken.address, lendingTokenAmount);

      await expect(platform.contractInstance.plpInstance.borrow(lendingToken.address, lendingTokenAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})).to.be.revertedWith('TotalBorrowExceededLimit()')
    })

    it("3. Borrow successfully", async function () {
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

      const lendingTokenAmount = toBN(10);

      const balanceUserBeforeBorrow = await lendingToken.balanceOf(deployMaster.address);
      const availableToWithdrawBeforeBorrow = await platform.contractInstance.plpInstance.getCollateralAvailableToWithdraw(deployMaster.address, prjToken.address);

      await platform.contractInstance.plpInstance.borrow(lendingToken.address, lendingTokenAmount, updatePriceTokens, priceIds, updateData, {value: updateFee})

      const balanceUserAfterBorrow = await lendingToken.balanceOf(deployMaster.address);
      const availableToWithdrawAfterBorrow = await platform.contractInstance.plpInstance.getCollateralAvailableToWithdraw(deployMaster.address, prjToken.address);

      expect(balanceUserBeforeBorrow.add(lendingTokenAmount)).to.be.equal(balanceUserAfterBorrow);
      expect(availableToWithdrawBeforeBorrow).to.be.gt(availableToWithdrawAfterBorrow);
    })
  })
});