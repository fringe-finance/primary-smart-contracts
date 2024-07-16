require("dotenv").config();
const hre = require("hardhat");
const { ethers } = require("ethers");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { DAI, USDC, WETH, USDC_USDT, USDC_4626 } = require("./utils/constants");
const { TokenType } = require("./estimate-scripts/enum/tokenType")
const { deployPlatform } = require("./utils/deployPlatform");
const {
  loadContractInstance,
} = require("./estimate-scripts/utils/loadContract");
const { ERC20_ABI } = require("./estimate-scripts/abis/ERC20");
const { UniswapV2Pair_ABI } = require("./estimate-scripts/abis/UniswapV2Pair");
const { ERC4626_ABI } = require("./estimate-scripts/abis/ERC4626");
const { estimate, estimateBuy } = require("./estimate-scripts");
const { expect } = require("chai");
const { EvmPriceServiceConnection } = require("@pythnetwork/pyth-evm-js");
const { deployment } = require("../../scripts/V3/deployPLP/deploymentPLP");
const { Dex } = require("./estimate-scripts/enum/dexType");
const { Pair } = require("./estimate-scripts/enum/pairType");

const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);
const connection = new EvmPriceServiceConnection("https://hermes.pyth.network")

//-----------------------------------SET UP BEFORE RUN SCRIPT TEST-------------------------------------------
//-----------------------------------------------------------------------------------------------------------
//------Set file config_general.json:------------------------------------------------------------------------
//------priceOracle.priceProcessingOracle.volatilityCapUpPercent: 65000--------------------------------------
//------priceOracle.priceProcessingOracle.volatilityCapDownPercent: 65000------------------------------------
//------priceOracle.Chainlink.timeOuts: [["864600000000000"], ["864600000000000"],.....]---------------------
//-----------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------
//------set SECONDS_PER_HOUR = 1s at the contract PriceOracle.sol before run these following tests-----------
//-----------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------

describe("PrimaryLendingPlatformLiquidationV3", function () {
  let signers;
  let signer1;
  let signer2;
  let liquidator;
  let deployMaster;
  let UniswapPriceProviderMock;
  let uniswapPriceProviderMockInstance;

  const getAssetInfo = (tokenAddress, tokenType) => {
    let tokenIndex;
    switch (tokenType) {
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
    return [tokenAddress, tokenIndex];
  };

  async function getPriceId(PriceContract, tokenAddressList) {
    const { priceIds, updateFee } = await PriceContract.getExpiredPriceFeeds(
      tokenAddressList, BN.from(150000000000000)
    )
    return { priceIds, updateFee }
  }

  async function getPriceFeedsUpdateData(priceIds) {
    if (priceIds.length === 0) return [];
    const updateData = await connection.getPriceFeedsUpdateData(priceIds);
    return updateData;
  }

  async function setHighPrice(tokenAddress, tokenDecimals, priceProviderAggregatorInstance) {
    let { collateralEvaluation, } = await priceProviderAggregatorInstance.getEvaluation(tokenAddress, toBN("10").pow(tokenDecimals));
    await uniswapPriceProviderMockInstance.setTokenAndPrice(tokenAddress, toBN(collateralEvaluation).mul(10));
    await priceProviderAggregatorInstance.setTokenAndPriceProvider(tokenAddress, uniswapPriceProviderMockInstance.address);
  }
  async function setLowPrice(tokenAddress, tokenDecimals, priceProviderAggregatorInstance, price) {
    await uniswapPriceProviderMockInstance.setTokenAndPrice(tokenAddress, price);
    await priceProviderAggregatorInstance.setTokenAndPriceProvider(tokenAddress, uniswapPriceProviderMockInstance.address);
  }

  async function resetNetwork() {
    await helpers.reset(
      `https://${process.env.CHAIN.replace("_", "-")}.infura.io/v3/${process.env.INFURA_KEY
      }`,
      Number(process.env.BLOCK_NUMBER)
    );
  }

  async function loadFixture() {
    await resetNetwork();
    signers = await hre.ethers.getSigners();
    deployMaster = signers[0];
    signer1 = signers[1];
    signer2 = signers[2];
    liquidator = signers[3];

    console.log("deployMaster: ", deployMaster.address);
    console.log("signer1: ", signer1.address);
    console.log("signer2: ", signer2.address);
    console.log("liquidator: ", liquidator.address);
    console.log()

    const tokenInstances = {
      dai: loadContractInstance(DAI, ERC20_ABI, deployMaster),
      usdc: loadContractInstance(USDC, ERC20_ABI, deployMaster),
      weth: loadContractInstance(WETH, ERC20_ABI, deployMaster),
      usdc_usdt: loadContractInstance(USDC_USDT, UniswapV2Pair_ABI, deployMaster),
      usdc_4626: loadContractInstance(USDC_4626, ERC4626_ABI, deployMaster),
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
      [tokenInstances.weth.address]: {
        address: tokenInstances.weth.address,
        tokenType: TokenType.ERC20,
        decimals: 18,
      },
      [tokenInstances.usdc_usdt.address]: { address: tokenInstances.usdc_usdt.address, tokenType: TokenType.LP, pairType: Pair.Uniswap, decimals: 18, },
      [tokenInstances.usdc_4626.address]: { address: tokenInstances.usdc_4626.address, tokenType: TokenType.ERC4626, decimals: 18, },
    };

    console.log("Setting up tokens");
    await setBalance(DAI, liquidator, toBN("10000000000000000000000000000000000000000"));
    await setBalance(USDC, liquidator, toBN("10000000000000000000000000000000000000000"));
    await setBalance(USDC_USDT, liquidator, toBN("10000000000000000000000000000000000000000"));
    await tokenInstances.usdc.connect(liquidator).approve(tokenInstances.usdc_4626.address, hre.ethers.constants.MaxUint256);
    await tokenInstances.usdc_4626.connect(liquidator).deposit("10000000000", liquidator.address, [], [], []);

    await setBalance(DAI, signer1, toBN("10000000000000000000000000000000000000000"));
    await setBalance(USDC, signer1, toBN("10000000000000000000000000000000000000000"));
    await setBalance(USDC_USDT, signer1, toBN("10000000000000000000000000000000000000000"));
    await tokenInstances.usdc.connect(signer1).approve(tokenInstances.usdc_4626.address, hre.ethers.constants.MaxUint256);
    await tokenInstances.usdc_4626.connect(signer1).deposit("10000000000", signer1.address, [], [], []);

    await setBalance(USDC, signer2, toBN("10000000000000000000000000000000000000000"));
    await setBalance(USDC_USDT, signer2, toBN("10000000000000000000000000000000000000000"));
    await tokenInstances.usdc.connect(signer2).approve(tokenInstances.usdc_4626.address, hre.ethers.constants.MaxUint256);
    await tokenInstances.usdc_4626.connect(signer2).deposit("10000000000", signer2.address, [], [], []);

    console.log("Completed to set up tokens");

    console.log();
    console.log("Deploying platform");
    process.env.TESTING = true;
    const platform = await deployPlatform();
    console.log("Completed to deploy platform");
    console.log()

    const addresses = await deployment();
    UniswapPriceProviderMock = await hre.ethers.getContractFactory("UniswapV2PriceProviderMock");
    uniswapPriceProviderMockInstance = UniswapPriceProviderMock.attach(addresses.uniswapV2PriceProviderMockAddress).connect(deployMaster)

    return { platform, tokenInfo, tokenInstances };
  }

  async function setBalance(token, user, newBalance) {
    for (let i = 0; i < 40; i++) {
      const index = ethers.utils.solidityKeccak256(
        ["uint256", "uint256"],
        [user.address, i]
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

  describe("Liquidation", async function () {
    let platform;
    let tokenInstances;
    let tokenInfo;
    let prjToken;
    let lendingToken;
    let updatePriceTokens;
    let priceIds;
    let updateFee;
    let updateData;
    let bToken;

    before(async () => {
      const fixture = await helpers.loadFixture(setup);
      platform = fixture.platform;
      tokenInstances = fixture.tokenInstances;
      tokenInfo = fixture.tokenInfo;
      prjToken = tokenInstances.dai;
      const depositAmount = toBN("10").pow(tokenInfo[prjToken.address].decimals);
      lendingToken = tokenInstances.usdc;
      const supplyAmount = toBN("100").pow(tokenInfo[lendingToken.address].decimals);
      updatePriceTokens = [prjToken.address, lendingToken.address];

      let price = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      priceIds = price.priceIds;
      updateFee = price.updateFee;
      updateData = await getPriceFeedsUpdateData(priceIds);

      await prjToken.connect(signer1).approve(platform.addresses.plpAddress, depositAmount);
      await platform.contractInstance.plpInstance.connect(signer1).deposit(prjToken.address, depositAmount, [], [], []);
      console.log(signer1.address + " deposited: ", depositAmount.toString());

      bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      await lendingToken.connect(signer2).approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.connect(signer2).supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, { value: updateFee });
      console.log(signer2.address + " supplied: ", supplyAmount.toString());

      const PITRemaining = await platform.contractInstance.plpInstance.convertPitRemaining(signer1.address, lendingToken.address)
      console.log("PITRemaining of signer1: ", PITRemaining.toString());

      const borrowAmount = PITRemaining.div(100);
      await platform.contractInstance.plpInstance.connect(signer1).borrow(lendingToken.address, PITRemaining, updatePriceTokens, priceIds, updateData, { value: updateFee })
      await platform.contractInstance.plpInstance.updateInterestInBorrowPosition(signer1.address, lendingToken.address)
    })

    it("1. Should revert when lendingTokenAmount < minLA", async function () {
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('9000000000'))
        // await setLowPrice(lendingToken.address, tokenInfo[lendingToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('100000000000000000'));
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, lendingToken.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = minLA.sub(100);
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceUserBefore = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenBefore = await lendingToken.balanceOf(bToken);

      await expect(
        platform.contractInstance.plpLiquidationInstance.connect(liquidator).liquidate(
          signer1.address,
          getAssetInfo(prjToken.address),
          getAssetInfo(lendingToken.address),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          [],
          { value: updateFee }
        )
      ).to.be.revertedWith("NotIncludedAmount()");

      const balanceUserAfter = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenAfter = await lendingToken.balanceOf(bToken);

      expect(balanceUserAfter).to.be.eq(balanceUserBefore)
      expect(balanceBTokenBefore).to.be.eq(balanceBTokenAfter)

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)

    it("2. Should revert when lendingTokenAmount > maxLA", async function () {
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('9000000000'))
        // await setLowPrice(lendingToken.address, tokenInfo[lendingToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('100000000000000000'));
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, lendingToken.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = maxLA.add(100);
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceUserBefore = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenBefore = await lendingToken.balanceOf(bToken);
      await expect(
        platform.contractInstance.plpLiquidationInstance.connect(liquidator).liquidate(
          signer1.address,
          getAssetInfo(prjToken.address),
          getAssetInfo(lendingToken.address),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          [],
          { value: updateFee }
        )
      ).to.be.revertedWith("NotIncludedAmount()");
      const balanceUserAfter = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenAfter = await lendingToken.balanceOf(bToken);

      expect(balanceUserAfter).to.be.eq(balanceUserBefore)
      expect(balanceBTokenBefore).to.be.eq(balanceBTokenAfter)

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
      console.log()
    }).timeout(1000000)

    it("3. Should revert when lendingTokenAmount == 0", async function () {
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('9000000000'))
        //await setLowPrice(lendingToken.address, tokenInfo[lendingToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('100000000000000000'));
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, lendingToken.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      lendingTokenAmount = 0;
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceUserBefore = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenBefore = await lendingToken.balanceOf(bToken);
      await expect(
        platform.contractInstance.plpLiquidationInstance.connect(liquidator).liquidate(
          signer1.address,
          getAssetInfo(prjToken.address),
          getAssetInfo(lendingToken.address),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          [],
          { value: updateFee }
        )
      ).to.be.revertedWith("InvalidLendingAmount()");
      const balanceUserAfter = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenAfter = await lendingToken.balanceOf(bToken);

      expect(balanceUserAfter).to.be.eq(balanceUserBefore)
      expect(balanceBTokenBefore).to.be.eq(balanceBTokenAfter)

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)

    it("4. Should success when liquidate with no borrow MinLA", async function () {
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('9000000000'))
        //await setLowPrice(lendingToken.address, tokenInfo[lendingToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('100000000000000000'));
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, lendingToken.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = minLA;
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceLendingUserBefore = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenBefore = await lendingToken.balanceOf(bToken);
      const balancePrjTokenUserBefore = await prjToken.balanceOf(liquidator.address);

      await lendingToken.connect(liquidator).approve(bToken, lendingTokenAmount);
      console.log("Liquidator approved Lending token for bLendingToken: ", lendingTokenAmount.toString())

      const estimatedRewardAmount = await platform.contractInstance.plpLiquidationInstance.connect(liquidator).getEstimatedRewardAmount(
        signer1.address,
        prjToken.address,
        lendingToken.address,
        lendingTokenAmount
      )
      console.log("estimatedRewardAmount:", estimatedRewardAmount[1].toString())
      console.log("priceIds", priceIds)
      await expect(
        platform.contractInstance.plpLiquidationInstance.connect(liquidator).liquidate(
          signer1.address,
          getAssetInfo(prjToken.address),
          getAssetInfo(lendingToken.address),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          [],
          { value: updateFee }
        )
      ).not.to.be.reverted;


      // const depositedAmount = await platform.contractInstance.plpInstance.connect(liquidator).depositedAmount(
      //   signer1.address,
      //   prjToken.address
      // )
      // console.log("depositedAmount:  ", depositedAmount.toString())

      const balanceLendingUserAfter = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenAfter = await lendingToken.balanceOf(bToken);
      const balancePrjTokenUserAfter = await prjToken.balanceOf(liquidator.address)


      console.log("balanceLendingUserBefore: ", balanceLendingUserBefore.toString())
      console.log("balanceBTokenBefore: ", balanceBTokenBefore.toString())
      console.log("balancePrjTokenUserBefore: ", balancePrjTokenUserBefore.toString())

      console.log("balanceLendingUserAfter: ", balanceLendingUserAfter.toString())
      console.log("balanceBTokenAfter: ", balanceBTokenAfter.toString())
      console.log("balancePrjTokenUserAfter: ", balancePrjTokenUserAfter.toString())

      expect(balanceLendingUserAfter.add(lendingTokenAmount)).to.be.eq(balanceLendingUserBefore)
      expect(balanceBTokenBefore.add(lendingTokenAmount)).to.be.eq(balanceBTokenAfter)
      expect(balancePrjTokenUserBefore.add(estimatedRewardAmount[1])).to.be.eq(balancePrjTokenUserAfter)

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)

    it("5. Should success when liquidate with no borrow MaxLA", async function () {
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('9000000000'))
        //await setLowPrice(lendingToken.address, tokenInfo[lendingToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('100000000000000000'));
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, lendingToken.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = maxLA;
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceLendingUserBefore = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenBefore = await lendingToken.balanceOf(bToken);
      const balancePrjTokenUserBefore = await prjToken.balanceOf(liquidator.address);

      await lendingToken.connect(liquidator).approve(bToken, lendingTokenAmount);
      console.log("Liquidator approved Lending token for bLendingToken: ", lendingTokenAmount.toString())

      const estimatedRewardAmount = await platform.contractInstance.plpLiquidationInstance.connect(liquidator).getEstimatedRewardAmount(
        signer1.address,
        prjToken.address,
        lendingToken.address,
        lendingTokenAmount
      )
      console.log("estimatedRewardAmount:", estimatedRewardAmount[1].toString())

      await expect(
        platform.contractInstance.plpLiquidationInstance.connect(liquidator).liquidate(
          signer1.address,
          getAssetInfo(prjToken.address),
          getAssetInfo(lendingToken.address),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          [],
          { value: updateFee }
        )
      ).not.to.be.reverted;


      // const depositedAmount = await platform.contractInstance.plpInstance.connect(liquidator).depositedAmount(
      //   signer1.address,
      //   prjToken.address
      // )
      // console.log("depositedAmount:  ", depositedAmount.toString())

      const balanceLendingUserAfter = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenAfter = await lendingToken.balanceOf(bToken);
      const balancePrjTokenUserAfter = await prjToken.balanceOf(liquidator.address)


      console.log("balanceLendingUserBefore: ", balanceLendingUserBefore.toString())
      console.log("balanceBTokenBefore: ", balanceBTokenBefore.toString())
      console.log("balancePrjTokenUserBefore: ", balancePrjTokenUserBefore.toString())

      console.log("balanceLendingUserAfter: ", balanceLendingUserAfter.toString())
      console.log("balanceBTokenAfter: ", balanceBTokenAfter.toString())
      console.log("balancePrjTokenUserAfter: ", balancePrjTokenUserAfter.toString())

      expect(balanceLendingUserAfter.add(lendingTokenAmount)).to.be.eq(balanceLendingUserBefore)
      expect(balanceBTokenBefore.add(lendingTokenAmount)).to.be.eq(balanceBTokenAfter)
      expect(balancePrjTokenUserBefore.add(estimatedRewardAmount[1])).to.be.eq(balancePrjTokenUserAfter)

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)

    it("6. Should revert when hf >1", async function () {
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].lt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('100000000000000000'))
        // await setLowPrice(lendingToken.address, tokenInfo[lendingToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, 100);
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, lendingToken.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = minLA.add(100);
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceUserBefore = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenBefore = await lendingToken.balanceOf(bToken);
      await expect(
        platform.contractInstance.plpLiquidationInstance.connect(liquidator).liquidate(
          signer1.address,
          getAssetInfo(prjToken.address),
          getAssetInfo(lendingToken.address),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          [],
          { value: updateFee }
        )
      ).to.be.revertedWith("InvalidHealthFactor()");
      const balanceUserAfter = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenAfter = await lendingToken.balanceOf(bToken);

      expect(balanceUserAfter).to.be.eq(balanceUserBefore)
      expect(balanceBTokenBefore).to.be.eq(balanceBTokenAfter)

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)

    it("7. Should success when liquidate with hot borrow MinLA", async function () {
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('5000000000'))
        // await setLowPrice(lendingToken.address, tokenInfo[lendingToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('100000000000000000000'));
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())
      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, lendingToken.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = minLA;
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceLendingUserBefore = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenBefore = await lendingToken.balanceOf(bToken);
      const balancePrjTokenUserBefore = await prjToken.balanceOf(liquidator.address);

      await lendingToken.connect(liquidator).approve(bToken, lendingTokenAmount);
      console.log("Liquidator approved Lending token for bLendingToken: ", lendingTokenAmount.toString())

      const estimatedRewardAmount = await platform.contractInstance.plpLiquidationInstance.connect(liquidator).getEstimatedRewardAmount(
        signer1.address,
        prjToken.address,
        lendingToken.address,
        lendingTokenAmount
      )
      console.log("estimatedRewardAmount:", estimatedRewardAmount[1].toString())

      const { buyCallData } = await estimateBuy({
        address: prjToken.address,
        tokenType: TokenType.ERC20
      },
        {
          address: lendingToken.address,
          tokenType: TokenType.ERC20
        },
        lendingTokenAmount,
        platform.addresses.plpLiquidationAddress,
        "0.05",
        "1",
        Dex.Paraswap,
        new ethers.providers.AlchemyProvider(1, "LWIW1vEKXkNnNNU2bdguPCXfGGOrksh1")
      )

      await expect(
        platform.contractInstance.plpLiquidationInstance.connect(liquidator).liquidate(
          signer1.address,
          getAssetInfo(prjToken.address),
          getAssetInfo(lendingToken.address),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          buyCallData,
          { value: updateFee }
        )
      ).not.to.be.reverted;

      const balanceLendingUserAfter = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenAfter = await lendingToken.balanceOf(bToken);
      const balancePrjTokenUserAfter = await prjToken.balanceOf(liquidator.address)

      console.log("balanceLendingUserBefore: ", balanceLendingUserBefore.toString())
      console.log("balanceBTokenBefore: ", balanceBTokenBefore.toString())
      console.log("balancePrjTokenUserBefore: ", balancePrjTokenUserBefore.toString())

      console.log("balanceLendingUserAfter: ", balanceLendingUserAfter.toString())
      console.log("balanceBTokenAfter: ", balanceBTokenAfter.toString())
      console.log("balancePrjTokenUserAfter: ", balancePrjTokenUserAfter.toString())

      expect(balanceLendingUserAfter).to.be.eq(balanceLendingUserBefore)
      expect(balanceBTokenBefore.add(lendingTokenAmount)).to.be.eq(balanceBTokenAfter)
      expect(balancePrjTokenUserAfter).to.be.lte(balancePrjTokenUserBefore.add(estimatedRewardAmount[1]))

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)

    it("8. Should success when liquidate with hot borrow MaxLA", async function () {
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('5000000000'))
        // await setLowPrice(lendingToken.address, tokenInfo[lendingToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('100000000000000000'));
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, lendingToken.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = maxLA;
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceLendingUserBefore = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenBefore = await lendingToken.balanceOf(bToken);
      const balancePrjTokenUserBefore = await prjToken.balanceOf(liquidator.address);

      await lendingToken.connect(liquidator).approve(bToken, lendingTokenAmount);
      console.log("Liquidator approved Lending token for bLendingToken: ", lendingTokenAmount.toString())

      const estimatedRewardAmount = await platform.contractInstance.plpLiquidationInstance.connect(liquidator).getEstimatedRewardAmount(
        signer1.address,
        prjToken.address,
        lendingToken.address,
        lendingTokenAmount
      )
      console.log("estimatedRewardAmount:", estimatedRewardAmount[1].toString())

      const { buyCallData } = await estimateBuy({
        address: prjToken.address,
        tokenType: TokenType.ERC20
      },
        {
          address: lendingToken.address,
          tokenType: TokenType.ERC20
        },
        lendingTokenAmount,
        platform.addresses.plpLiquidationAddress,
        "0.05",
        "1",
        Dex.Paraswap,
        new ethers.providers.AlchemyProvider(1, "LWIW1vEKXkNnNNU2bdguPCXfGGOrksh1")
      )

      await expect(
        platform.contractInstance.plpLiquidationInstance.connect(liquidator).liquidate(
          signer1.address,
          getAssetInfo(prjToken.address),
          getAssetInfo(lendingToken.address),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          buyCallData,
          { value: updateFee }
        )
      ).not.to.be.reverted;

      const balanceLendingUserAfter = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenAfter = await lendingToken.balanceOf(bToken);
      const balancePrjTokenUserAfter = await prjToken.balanceOf(liquidator.address)

      console.log("balanceLendingUserBefore: ", balanceLendingUserBefore.toString())
      console.log("balanceBTokenBefore: ", balanceBTokenBefore.toString())
      console.log("balancePrjTokenUserBefore: ", balancePrjTokenUserBefore.toString())

      console.log("balanceLendingUserAfter: ", balanceLendingUserAfter.toString())
      console.log("balanceBTokenAfter: ", balanceBTokenAfter.toString())
      console.log("balancePrjTokenUserAfter: ", balancePrjTokenUserAfter.toString())

      expect(balanceLendingUserAfter).to.be.eq(balanceLendingUserBefore)
      expect(balanceBTokenBefore.add(lendingTokenAmount)).to.be.eq(balanceBTokenAfter)
      expect(balancePrjTokenUserAfter).to.be.lte(balancePrjTokenUserBefore.add(estimatedRewardAmount[1]))

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)
  })

  describe("Liquidation Wrapped Token Gateway, Lending Token is ETH", async function () {
    let platform;
    let tokenInstances;
    let tokenInfo;
    let prjToken;
    let updatePriceTokens;
    let priceIds;
    let updateFee;
    let updateData;
    let bToken;
    let weth;

    before(async () => {
      const fixture = await helpers.loadFixture(setup);
      platform = fixture.platform;
      tokenInstances = fixture.tokenInstances;
      tokenInfo = fixture.tokenInfo;
      prjToken = tokenInstances.dai;
      const depositAmount = toBN("10").pow(tokenInfo[prjToken.address].decimals);

      weth = tokenInstances.weth;
      let msgValue = ethers.utils.parseEther("1");

      updatePriceTokens = [prjToken.address, weth.address];

      let price = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, weth.address]);
      priceIds = price.priceIds;
      updateFee = price.updateFee;
      updateData = await getPriceFeedsUpdateData(priceIds);

      await prjToken.connect(signer1).approve(platform.addresses.plpAddress, depositAmount);
      await platform.contractInstance.plpInstance.connect(signer1).deposit(prjToken.address, depositAmount, [], [], []);
      console.log(signer1.address + " deposited: ", depositAmount.toString());

      bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(weth.address)).bLendingToken;
      await weth.connect(signer2).approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpWrappedTokenGatewayInstance.connect(signer2).supply(msgValue, priceIds, updateData, updatePriceTokens, updateFee, { value: updateFee.add(msgValue) });
      console.log(signer2.address + " supplied: ", msgValue.toString());

      const PITRemaining = await platform.contractInstance.plpInstance.convertPitRemaining(signer1.address, weth.address)
      console.log("PITRemaining of signer1: ", PITRemaining.toString());

      const borrowAmount = PITRemaining.div(100);
      await weth.connect(signer1).approve(platform.addresses.plpWrappedTokenGatewayAddress, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpWrappedTokenGatewayInstance.connect(signer1).borrow(PITRemaining, updatePriceTokens, priceIds, updateData, { value: updateFee })
      await platform.contractInstance.plpInstance.updateInterestInBorrowPosition(signer1.address, weth.address)
    })

    it("1. Should revert when lendingTokenAmount < minLA", async function () {
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('9000000000'))
        // await setLowPrice(weth.address, tokenInfo[weth.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('100000000000000000'));
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, weth.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = minLA.sub(100);
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceUserBefore = await liquidator.getBalance();
      const balanceBTokenBefore = await weth.balanceOf(bToken);

      await expect(
        platform.contractInstance.plpWrappedTokenGatewayInstance.connect(liquidator).liquidateWithLendingETH(
          signer1.address,
          getAssetInfo(prjToken.address),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          updateFee,
          [],
          { value: updateFee.add(lendingTokenAmount) }
        )
      ).to.be.revertedWith("NotIncludedAmount()");

      const balanceUserAfter = await liquidator.getBalance();
      const balanceBTokenAfter = await weth.balanceOf(bToken);

      expect(balanceUserAfter).to.be.lt(balanceUserBefore)
      expect(balanceBTokenBefore).to.be.eq(balanceBTokenAfter)

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)

    it("2. Should revert when lendingTokenAmount > maxLA", async function () {
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('9000000000'))
        // await setLowPrice(weth.address, tokenInfo[weth.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('100000000000000000'));
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, weth.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = maxLA.add(100);
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceUserBefore = await liquidator.getBalance();
      const balanceBTokenBefore = await weth.balanceOf(bToken);
      await expect(
        platform.contractInstance.plpWrappedTokenGatewayInstance.connect(liquidator).liquidateWithLendingETH(
          signer1.address,
          getAssetInfo(prjToken.address),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          updateFee,
          [],
          { value: updateFee.add(lendingTokenAmount) }
        )
      ).to.be.revertedWith("NotIncludedAmount()");
      const balanceUserAfter = await liquidator.getBalance();
      const balanceBTokenAfter = await weth.balanceOf(bToken);

      expect(balanceUserAfter).to.be.lt(balanceUserBefore)
      expect(balanceBTokenBefore).to.be.eq(balanceBTokenAfter)

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
      console.log()
    }).timeout(1000000)

    it("3. Should revert when lendingTokenAmount == 0", async function () {
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('9000000000'))
        // await setLowPrice(weth.address, tokenInfo[weth.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('100000000000000000'));
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, weth.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      lendingTokenAmount = 0;
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceUserBefore = await liquidator.getBalance();
      const balanceBTokenBefore = await weth.balanceOf(bToken);
      await expect(
        platform.contractInstance.plpWrappedTokenGatewayInstance.connect(liquidator).liquidateWithLendingETH(
          signer1.address,
          getAssetInfo(prjToken.address),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          updateFee,
          [],
          { value: updateFee.add(lendingTokenAmount) }
        )
      ).to.be.revertedWith("InvalidLendingAmount()");
      const balanceUserAfter = await liquidator.getBalance();
      const balanceBTokenAfter = await weth.balanceOf(bToken);

      expect(balanceUserAfter).to.be.lt(balanceUserBefore)
      expect(balanceBTokenBefore).to.be.eq(balanceBTokenAfter)

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)

    it("4. Should success when liquidate with no borrow MinLA", async function () {
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('9000000000'))
        // await setLowPrice(weth.address, tokenInfo[weth.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('100000000000000000'));
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, weth.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = minLA;
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceLendingUserBefore = await liquidator.getBalance();
      const balanceBTokenBefore = await weth.balanceOf(bToken);
      const balancePrjTokenUserBefore = await prjToken.balanceOf(liquidator.address);

      await weth.connect(liquidator).approve(bToken, lendingTokenAmount);
      console.log("Liquidator approved Lending token for bLendingToken: ", lendingTokenAmount.toString())

      const estimatedRewardAmount = await platform.contractInstance.plpLiquidationInstance.connect(liquidator).getEstimatedRewardAmount(
        signer1.address,
        prjToken.address,
        weth.address,
        lendingTokenAmount
      )
      console.log("estimatedRewardAmount:", estimatedRewardAmount[1].toString())
      console.log("priceIds", priceIds)
      await expect(
        platform.contractInstance.plpWrappedTokenGatewayInstance.connect(liquidator).liquidateWithLendingETH(
          signer1.address,
          getAssetInfo(prjToken.address),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          updateFee,
          [],
          { value: updateFee.add(lendingTokenAmount) }
        )
      ).not.to.be.reverted;

      const balanceLendingUserAfter = await liquidator.getBalance();
      const balanceBTokenAfter = await weth.balanceOf(bToken);
      const balancePrjTokenUserAfter = await prjToken.balanceOf(liquidator.address)


      console.log("balanceLendingUserBefore: ", balanceLendingUserBefore.toString())
      console.log("balanceBTokenBefore: ", balanceBTokenBefore.toString())
      console.log("balancePrjTokenUserBefore: ", balancePrjTokenUserBefore.toString())

      console.log("balanceLendingUserAfter: ", balanceLendingUserAfter.toString())
      console.log("balanceBTokenAfter: ", balanceBTokenAfter.toString())
      console.log("balancePrjTokenUserAfter: ", balancePrjTokenUserAfter.toString())

      expect(balanceLendingUserAfter.add(lendingTokenAmount)).to.be.lt(balanceLendingUserBefore)
      expect(balanceBTokenBefore.add(lendingTokenAmount)).to.be.eq(balanceBTokenAfter)
      expect(balancePrjTokenUserBefore.add(estimatedRewardAmount[1])).to.be.eq(balancePrjTokenUserAfter)

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)

    it("5. Should success when liquidate with no borrow MaxLA", async function () {
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('9000000000'))
        // await setLowPrice(weth.address, tokenInfo[weth.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('100000000000000000'));
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, weth.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = maxLA;
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceLendingUserBefore = await liquidator.getBalance();
      const balanceBTokenBefore = await weth.balanceOf(bToken);
      const balancePrjTokenUserBefore = await prjToken.balanceOf(liquidator.address);

      await weth.connect(liquidator).approve(bToken, lendingTokenAmount);
      console.log("Liquidator approved Lending token for bLendingToken: ", lendingTokenAmount.toString())

      const estimatedRewardAmount = await platform.contractInstance.plpLiquidationInstance.connect(liquidator).getEstimatedRewardAmount(
        signer1.address,
        prjToken.address,
        weth.address,
        lendingTokenAmount
      )
      console.log("estimatedRewardAmount:", estimatedRewardAmount[1].toString())

      await expect(
        platform.contractInstance.plpWrappedTokenGatewayInstance.connect(liquidator).liquidateWithLendingETH(
          signer1.address,
          getAssetInfo(prjToken.address),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          updateFee,
          [],
          { value: updateFee.add(lendingTokenAmount) }
        )
      ).not.to.be.reverted;

      const balanceLendingUserAfter = await liquidator.getBalance();
      const balanceBTokenAfter = await weth.balanceOf(bToken);
      const balancePrjTokenUserAfter = await prjToken.balanceOf(liquidator.address)


      console.log("balanceLendingUserBefore: ", balanceLendingUserBefore.toString())
      console.log("balanceBTokenBefore: ", balanceBTokenBefore.toString())
      console.log("balancePrjTokenUserBefore: ", balancePrjTokenUserBefore.toString())

      console.log("balanceLendingUserAfter: ", balanceLendingUserAfter.toString())
      console.log("balanceBTokenAfter: ", balanceBTokenAfter.toString())
      console.log("balancePrjTokenUserAfter: ", balancePrjTokenUserAfter.toString())

      expect(balanceLendingUserAfter.add(lendingTokenAmount)).to.be.lt(balanceLendingUserBefore)
      expect(balanceBTokenBefore.add(lendingTokenAmount)).to.be.eq(balanceBTokenAfter)
      expect(balancePrjTokenUserBefore.add(estimatedRewardAmount[1])).to.be.eq(balancePrjTokenUserAfter)

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)

    it("6. Should revert when hf >1", async function () {
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].lt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('100000000000000000'))
        // await setLowPrice(weth.address, tokenInfo[weth.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, 100);
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, weth.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = minLA.add(100);
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceUserBefore = await liquidator.getBalance();
      const balanceBTokenBefore = await weth.balanceOf(bToken);
      await expect(
        platform.contractInstance.plpWrappedTokenGatewayInstance.connect(liquidator).liquidateWithLendingETH(
          signer1.address,
          getAssetInfo(prjToken.address),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          updateFee,
          [],
          { value: updateFee.add(lendingTokenAmount) }
        )
      ).to.be.revertedWith("InvalidHealthFactor()");
      const balanceUserAfter = await liquidator.getBalance();
      const balanceBTokenAfter = await weth.balanceOf(bToken);

      expect(balanceUserAfter).to.be.lt(balanceUserBefore)
      expect(balanceBTokenBefore).to.be.eq(balanceBTokenAfter)

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)

    it("7. Should success when liquidate with hot borrow MinLA", async function () {
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('5000000000'))
        // await setLowPrice(weth.address, tokenInfo[weth.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('100000000000000000000'));
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())
      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, weth.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = minLA;
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceLendingUserBefore = await liquidator.getBalance();
      const balanceBTokenBefore = await weth.balanceOf(bToken);
      const balancePrjTokenUserBefore = await prjToken.balanceOf(liquidator.address);

      await weth.connect(liquidator).approve(bToken, lendingTokenAmount);
      console.log("Liquidator approved Lending token for bLendingToken: ", lendingTokenAmount.toString())

      const estimatedRewardAmount = await platform.contractInstance.plpLiquidationInstance.connect(liquidator).getEstimatedRewardAmount(
        signer1.address,
        prjToken.address,
        weth.address,
        lendingTokenAmount
      )
      console.log("estimatedRewardAmount:", estimatedRewardAmount[1].toString())

      const { buyCallData } = await estimateBuy({
        address: prjToken.address,
        tokenType: TokenType.ERC20
      },
        {
          address: weth.address,
          tokenType: TokenType.ERC20
        },
        lendingTokenAmount,
        platform.addresses.plpLiquidationAddress,
        "0.05",
        "1",
        Dex.Paraswap,
        new ethers.providers.AlchemyProvider(1, "LWIW1vEKXkNnNNU2bdguPCXfGGOrksh1")
      )

      await expect(
        platform.contractInstance.plpWrappedTokenGatewayInstance.connect(liquidator).liquidateWithLendingETH(
          signer1.address,
          getAssetInfo(prjToken.address),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          updateFee,
          buyCallData,
          { value: updateFee.add(lendingTokenAmount) }
        )
      ).not.to.be.reverted;

      const balanceLendingUserAfter = await liquidator.getBalance();
      const balanceBTokenAfter = await weth.balanceOf(bToken);
      const balancePrjTokenUserAfter = await prjToken.balanceOf(liquidator.address)

      console.log("balanceLendingUserBefore: ", balanceLendingUserBefore.toString())
      console.log("balanceBTokenBefore: ", balanceBTokenBefore.toString())
      console.log("balancePrjTokenUserBefore: ", balancePrjTokenUserBefore.toString())

      console.log("balanceLendingUserAfter: ", balanceLendingUserAfter.toString())
      console.log("balanceBTokenAfter: ", balanceBTokenAfter.toString())
      console.log("balancePrjTokenUserAfter: ", balancePrjTokenUserAfter.toString())

      expect(balanceLendingUserAfter).to.be.lt(balanceLendingUserBefore)
      expect(balanceBTokenBefore.add(lendingTokenAmount)).to.be.eq(balanceBTokenAfter)
      expect(balancePrjTokenUserAfter).to.be.lte(balancePrjTokenUserBefore.add(estimatedRewardAmount[1]))

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)

    it("8. Should success when liquidate with hot borrow MaxLA", async function () {
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('9000000000'))
        // await setLowPrice(weth.address, tokenInfo[weth.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('100000000000000000'));
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, weth.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = maxLA;
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceLendingUserBefore = await liquidator.getBalance();
      const balanceBTokenBefore = await weth.balanceOf(bToken);
      const balancePrjTokenUserBefore = await prjToken.balanceOf(liquidator.address);

      await weth.connect(liquidator).approve(bToken, lendingTokenAmount);
      console.log("Liquidator approved Lending token for bLendingToken: ", lendingTokenAmount.toString())

      const estimatedRewardAmount = await platform.contractInstance.plpLiquidationInstance.connect(liquidator).getEstimatedRewardAmount(
        signer1.address,
        prjToken.address,
        weth.address,
        lendingTokenAmount
      )
      console.log("estimatedRewardAmount:", estimatedRewardAmount[1].toString())

      const { buyCallData } = await estimateBuy({
        address: prjToken.address,
        tokenType: TokenType.ERC20
      },
        {
          address: weth.address,
          tokenType: TokenType.ERC20
        },
        lendingTokenAmount,
        platform.addresses.plpLiquidationAddress,
        "0.05",
        "1",
        Dex.Paraswap,
        new ethers.providers.AlchemyProvider(1, "LWIW1vEKXkNnNNU2bdguPCXfGGOrksh1")
      )

      await expect(
        platform.contractInstance.plpWrappedTokenGatewayInstance.connect(liquidator).liquidateWithLendingETH(
          signer1.address,
          getAssetInfo(prjToken.address),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          updateFee,
          buyCallData,
          { value: updateFee.add(lendingTokenAmount) }
        )
      ).not.to.be.reverted;

      const balanceLendingUserAfter = await liquidator.getBalance();
      const balanceBTokenAfter = await weth.balanceOf(bToken);
      const balancePrjTokenUserAfter = await prjToken.balanceOf(liquidator.address)

      console.log("balanceLendingUserBefore: ", balanceLendingUserBefore.toString())
      console.log("balanceBTokenBefore: ", balanceBTokenBefore.toString())
      console.log("balancePrjTokenUserBefore: ", balancePrjTokenUserBefore.toString())

      console.log("balanceLendingUserAfter: ", balanceLendingUserAfter.toString())
      console.log("balanceBTokenAfter: ", balanceBTokenAfter.toString())
      console.log("balancePrjTokenUserAfter: ", balancePrjTokenUserAfter.toString())

      expect(balanceLendingUserAfter).to.be.lt(balanceLendingUserBefore)
      expect(balanceBTokenBefore.add(lendingTokenAmount)).to.be.eq(balanceBTokenAfter)
      expect(balancePrjTokenUserAfter).to.be.lte(balancePrjTokenUserBefore.add(estimatedRewardAmount[1]))

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)
  })

  describe("Liquidation: LP Support, ERC4626 Support", async function () {
    it("1. Should success when liquidate with no borrow MaxLA, Project token is LP token", async function () {
      let platform;
      let tokenInstances;
      let tokenInfo;
      let prjToken;
      let lendingToken;
      let updatePriceTokens;
      let priceIds;
      let updateFee;
      let updateData;
      let bToken;
      let depositAmount;
      let supplyAmount;

      const fixture = await helpers.loadFixture(setup);
      platform = fixture.platform;
      tokenInstances = fixture.tokenInstances;
      tokenInfo = fixture.tokenInfo;
      prjToken = tokenInstances?.usdc_usdt;
      depositAmount = toBN("10").pow(tokenInfo[prjToken.address].decimals - 10);
      lendingToken = tokenInstances.usdc;
      supplyAmount = toBN("100").pow(tokenInfo[lendingToken.address].decimals);
      updatePriceTokens = [prjToken.address, lendingToken.address];

      let price = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      priceIds = price.priceIds;
      updateFee = price.updateFee;
      updateData = await getPriceFeedsUpdateData(priceIds);
      console.log("depositAmount", depositAmount)
      await prjToken.connect(signer1).approve(platform.addresses.plpAddress, depositAmount);
      await platform.contractInstance.plpInstance.connect(signer1).deposit(prjToken.address, depositAmount, [], [], []);
      console.log(signer1.address + " deposited: ", depositAmount.toString());

      bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      await lendingToken.connect(signer2).approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.connect(signer2).supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, { value: updateFee });
      console.log(signer2.address + " supplied: ", supplyAmount.toString());

      const PITRemaining = await platform.contractInstance.plpInstance.convertPitRemaining(signer1.address, lendingToken.address)
      console.log("PITRemaining of signer1: ", PITRemaining.toString());

      const borrowAmount = PITRemaining.div(100);
      await platform.contractInstance.plpInstance.connect(signer1).borrow(lendingToken.address, PITRemaining, updatePriceTokens, priceIds, updateData, { value: updateFee })
      await platform.contractInstance.plpInstance.updateInterestInBorrowPosition(signer1.address, lendingToken.address)
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('20000000000000000000000'))
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, lendingToken.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = maxLA;
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceLendingUserBefore = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenBefore = await lendingToken.balanceOf(bToken);
      const balancePrjTokenUserBefore = await prjToken.balanceOf(liquidator.address);

      await lendingToken.connect(liquidator).approve(bToken, lendingTokenAmount);
      console.log("Liquidator approved Lending token for bLendingToken: ", lendingTokenAmount.toString())

      const estimatedRewardAmount = await platform.contractInstance.plpLiquidationInstance.connect(liquidator).getEstimatedRewardAmount(
        signer1.address,
        prjToken.address,
        lendingToken.address,
        lendingTokenAmount
      )
      console.log("estimatedRewardAmount:", estimatedRewardAmount[1].toString())

      await expect(
        platform.contractInstance.plpLiquidationInstance.connect(liquidator).liquidate(
          signer1.address,
          getAssetInfo(prjToken.address, TokenType.LP),
          getAssetInfo(lendingToken.address, TokenType.ERC20),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          [],
          { value: updateFee }
        )
      ).not.to.be.reverted;

      const balanceLendingUserAfter = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenAfter = await lendingToken.balanceOf(bToken);
      const balancePrjTokenUserAfter = await prjToken.balanceOf(liquidator.address)

      console.log("balanceLendingUserBefore: ", balanceLendingUserBefore.toString())
      console.log("balanceBTokenBefore: ", balanceBTokenBefore.toString())
      console.log("balancePrjTokenUserBefore: ", balancePrjTokenUserBefore.toString())

      console.log("balanceLendingUserAfter: ", balanceLendingUserAfter.toString())
      console.log("balanceBTokenAfter: ", balanceBTokenAfter.toString())
      console.log("balancePrjTokenUserAfter: ", balancePrjTokenUserAfter.toString())

      expect(balanceLendingUserAfter.add(lendingTokenAmount)).to.be.eq(balanceLendingUserBefore)
      expect(balanceBTokenBefore.add(lendingTokenAmount)).to.be.eq(balanceBTokenAfter)
      expect(balancePrjTokenUserBefore.add(estimatedRewardAmount[1])).to.be.eq(balancePrjTokenUserAfter)

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)

    it("2. Should success when liquidate with no borrow MaxLA, Project token is ERC4626", async function () {
      let platform;
      let tokenInstances;
      let tokenInfo;
      let prjToken;
      let lendingToken;
      let updatePriceTokens;
      let priceIds;
      let updateFee;
      let updateData;
      let bToken;
      let depositAmount;
      let supplyAmount;

      const fixture = await helpers.loadFixture(setup);
      platform = fixture.platform;
      tokenInstances = fixture.tokenInstances;
      tokenInfo = fixture.tokenInfo;
      prjToken = tokenInstances?.usdc_4626;
      depositAmount = toBN("10").pow(tokenInfo[prjToken.address].decimals);
      lendingToken = tokenInstances.usdc;
      supplyAmount = toBN("100").pow(tokenInfo[lendingToken.address].decimals);
      updatePriceTokens = [prjToken.address, lendingToken.address];

      let price = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      priceIds = price.priceIds;
      updateFee = price.updateFee;
      updateData = await getPriceFeedsUpdateData(priceIds);
      console.log("depositAmount", depositAmount)
      await prjToken.connect(signer1).approve(platform.addresses.plpAddress, depositAmount);
      await platform.contractInstance.plpInstance.connect(signer1).deposit(prjToken.address, depositAmount, [], [], []);
      console.log(signer1.address + " deposited: ", depositAmount.toString());

      bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      await lendingToken.connect(signer2).approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.connect(signer2).supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, { value: updateFee });
      console.log(signer2.address + " supplied: ", supplyAmount.toString());

      const PITRemaining = await platform.contractInstance.plpInstance.convertPitRemaining(signer1.address, lendingToken.address)
      console.log("PITRemaining of signer1: ", PITRemaining.toString());

      const borrowAmount = PITRemaining.div(100);
      await platform.contractInstance.plpInstance.connect(signer1).borrow(lendingToken.address, PITRemaining, updatePriceTokens, priceIds, updateData, { value: updateFee })
      await platform.contractInstance.plpInstance.updateInterestInBorrowPosition(signer1.address, lendingToken.address)

      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('10000000000'))
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, lendingToken.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = maxLA;
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceLendingUserBefore = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenBefore = await lendingToken.balanceOf(bToken);
      const balancePrjTokenUserBefore = await prjToken.balanceOf(liquidator.address);

      await lendingToken.connect(liquidator).approve(bToken, lendingTokenAmount);
      console.log("Liquidator approved Lending token for bLendingToken: ", lendingTokenAmount.toString())

      const estimatedRewardAmount = await platform.contractInstance.plpLiquidationInstance.connect(liquidator).getEstimatedRewardAmount(
        signer1.address,
        prjToken.address,
        lendingToken.address,
        lendingTokenAmount
      )
      console.log("estimatedRewardAmount:", estimatedRewardAmount[1].toString())

      await expect(
        platform.contractInstance.plpLiquidationInstance.connect(liquidator).liquidate(
          signer1.address,
          getAssetInfo(prjToken.address, TokenType.ERC4626),
          getAssetInfo(lendingToken.address, TokenType.ERC20),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          [],
          { value: updateFee }
        )
      ).not.to.be.reverted;

      const balanceLendingUserAfter = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenAfter = await lendingToken.balanceOf(bToken);
      const balancePrjTokenUserAfter = await prjToken.balanceOf(liquidator.address)

      console.log("balanceLendingUserBefore: ", balanceLendingUserBefore.toString())
      console.log("balanceBTokenBefore: ", balanceBTokenBefore.toString())
      console.log("balancePrjTokenUserBefore: ", balancePrjTokenUserBefore.toString())

      console.log("balanceLendingUserAfter: ", balanceLendingUserAfter.toString())
      console.log("balanceBTokenAfter: ", balanceBTokenAfter.toString())
      console.log("balancePrjTokenUserAfter: ", balancePrjTokenUserAfter.toString())

      expect(balanceLendingUserAfter.add(lendingTokenAmount)).to.be.eq(balanceLendingUserBefore)
      expect(balanceBTokenBefore.add(lendingTokenAmount)).to.be.eq(balanceBTokenAfter)
      expect(balancePrjTokenUserBefore.add(estimatedRewardAmount[1])).to.be.eq(balancePrjTokenUserAfter)

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)

    it("3. Should success when liquidate with hot borrow MaxLA, Project token is LP token", async function () {
      let platform;
      let tokenInstances;
      let tokenInfo;
      let prjToken;
      let lendingToken;
      let updatePriceTokens;
      let priceIds;
      let updateFee;
      let updateData;
      let bToken;
      let depositAmount;
      let supplyAmount;

      const fixture = await helpers.loadFixture(setup);
      platform = fixture.platform;
      tokenInstances = fixture.tokenInstances;
      tokenInfo = fixture.tokenInfo;
      prjToken = tokenInstances?.usdc_usdt;
      depositAmount = toBN("10").pow(tokenInfo[prjToken.address].decimals - 10);
      lendingToken = tokenInstances.usdc;
      supplyAmount = toBN("100").pow(tokenInfo[lendingToken.address].decimals);
      updatePriceTokens = [prjToken.address, lendingToken.address];

      let price = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      priceIds = price.priceIds;
      updateFee = price.updateFee;
      updateData = await getPriceFeedsUpdateData(priceIds);
      console.log("depositAmount", depositAmount)
      await prjToken.connect(signer1).approve(platform.addresses.plpAddress, depositAmount);
      await platform.contractInstance.plpInstance.connect(signer1).deposit(prjToken.address, depositAmount, [], [], []);
      console.log(signer1.address + " deposited: ", depositAmount.toString());

      bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      await lendingToken.connect(signer2).approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.connect(signer2).supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, { value: updateFee });
      console.log(signer2.address + " supplied: ", supplyAmount.toString());

      const PITRemaining = await platform.contractInstance.plpInstance.convertPitRemaining(signer1.address, lendingToken.address)
      console.log("PITRemaining of signer1: ", PITRemaining.toString());

      const borrowAmount = PITRemaining.div(100);
      await platform.contractInstance.plpInstance.connect(signer1).borrow(lendingToken.address, PITRemaining, updatePriceTokens, priceIds, updateData, { value: updateFee })
      await platform.contractInstance.plpInstance.updateInterestInBorrowPosition(signer1.address, lendingToken.address)
      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('20000000000000000000000'))
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, lendingToken.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = maxLA;
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceLendingUserBefore = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenBefore = await lendingToken.balanceOf(bToken);
      const balancePrjTokenUserBefore = await prjToken.balanceOf(liquidator.address);

      await lendingToken.connect(liquidator).approve(bToken, lendingTokenAmount);
      console.log("Liquidator approved Lending token for bLendingToken: ", lendingTokenAmount.toString())

      const estimatedRewardAmount = await platform.contractInstance.plpLiquidationInstance.connect(liquidator).getEstimatedRewardAmount(
        signer1.address,
        prjToken.address,
        lendingToken.address,
        lendingTokenAmount
      )
      console.log("estimatedRewardAmount:", estimatedRewardAmount[1].toString())

      const { buyCallData } = await estimateBuy({
        address: prjToken.address,
        tokenType: TokenType.LP
      },
        {
          address: lendingToken.address,
          tokenType: TokenType.ERC20
        },
        lendingTokenAmount,
        platform.addresses.plpLiquidationAddress,
        "0.05",
        "1",
        Dex.Paraswap,
        new ethers.providers.AlchemyProvider(1, "LWIW1vEKXkNnNNU2bdguPCXfGGOrksh1")
      )

      await expect(
        platform.contractInstance.plpLiquidationInstance.connect(liquidator).liquidate(
          signer1.address,
          getAssetInfo(prjToken.address, TokenType.LP),
          getAssetInfo(lendingToken.address, TokenType.ERC20),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          buyCallData,
          { value: updateFee }
        )
      ).not.to.be.reverted;

      const balanceLendingUserAfter = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenAfter = await lendingToken.balanceOf(bToken);
      const balancePrjTokenUserAfter = await prjToken.balanceOf(liquidator.address)

      console.log("balanceLendingUserBefore: ", balanceLendingUserBefore.toString())
      console.log("balanceBTokenBefore: ", balanceBTokenBefore.toString())
      console.log("balancePrjTokenUserBefore: ", balancePrjTokenUserBefore.toString())

      console.log("balanceLendingUserAfter: ", balanceLendingUserAfter.toString())
      console.log("balanceBTokenAfter: ", balanceBTokenAfter.toString())
      console.log("balancePrjTokenUserAfter: ", balancePrjTokenUserAfter.toString())

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)

    it("4. Should success when liquidate with hot borrow MaxLA, Project token is ERC4626", async function () {
      let platform;
      let tokenInstances;
      let tokenInfo;
      let prjToken;
      let lendingToken;
      let updatePriceTokens;
      let priceIds;
      let updateFee;
      let updateData;
      let bToken;
      let depositAmount;
      let supplyAmount;

      const fixture = await helpers.loadFixture(setup);
      platform = fixture.platform;
      tokenInstances = fixture.tokenInstances;
      tokenInfo = fixture.tokenInfo;
      prjToken = tokenInstances?.usdc_4626;
      depositAmount = toBN("10").pow(tokenInfo[prjToken.address].decimals);
      lendingToken = tokenInstances.usdc;
      supplyAmount = toBN("100").pow(tokenInfo[lendingToken.address].decimals);
      updatePriceTokens = [prjToken.address, lendingToken.address];

      let price = await getPriceId(platform.contractInstance.priceProviderAggregatorInstance, [prjToken.address, lendingToken.address]);
      priceIds = price.priceIds;
      updateFee = price.updateFee;
      updateData = await getPriceFeedsUpdateData(priceIds);
      console.log("depositAmount", depositAmount)
      await prjToken.connect(signer1).approve(platform.addresses.plpAddress, depositAmount);
      await platform.contractInstance.plpInstance.connect(signer1).deposit(prjToken.address, depositAmount, [], [], []);
      console.log(signer1.address + " deposited: ", depositAmount.toString());

      bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lendingToken.address)).bLendingToken;
      await lendingToken.connect(signer2).approve(bToken, hre.ethers.constants.MaxUint256);
      await platform.contractInstance.plpInstance.connect(signer2).supply(lendingToken.address, supplyAmount, updatePriceTokens, priceIds, updateData, { value: updateFee });
      console.log(signer2.address + " supplied: ", supplyAmount.toString());

      const PITRemaining = await platform.contractInstance.plpInstance.convertPitRemaining(signer1.address, lendingToken.address)
      console.log("PITRemaining of signer1: ", PITRemaining.toString());

      const borrowAmount = PITRemaining.div(100);
      await platform.contractInstance.plpInstance.connect(signer1).borrow(lendingToken.address, PITRemaining, updatePriceTokens, priceIds, updateData, { value: updateFee })
      await platform.contractInstance.plpInstance.updateInterestInBorrowPosition(signer1.address, lendingToken.address)

      console.log()
      let estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      while (estimatedHfBefore[0].gt(estimatedHfBefore[1])) {
        await setLowPrice(prjToken.address, tokenInfo[prjToken.address].decimals, platform.contractInstance.priceProviderAggregatorInstance, toBN('10000000000'))
        estimatedHfBefore = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      }
      console.log("Estimated Health Factor before: ", estimatedHfBefore.toString())

      const { maxLA, minLA } = await platform.contractInstance.plpLiquidationInstance.getLimitLiquidationAmount(signer1.address, prjToken.address, lendingToken.address)
      console.log("Max Liquidation Amount: ", maxLA.toString())
      console.log("Min Liquidation Amount: ", minLA.toString())

      let lendingTokenAmount = maxLA;
      console.log("Lending Amount: ", lendingTokenAmount.toString())

      const balanceLendingUserBefore = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenBefore = await lendingToken.balanceOf(bToken);
      const balancePrjTokenUserBefore = await prjToken.balanceOf(liquidator.address);

      await lendingToken.connect(liquidator).approve(bToken, lendingTokenAmount);
      console.log("Liquidator approved Lending token for bLendingToken: ", lendingTokenAmount.toString())

      const estimatedRewardAmount = await platform.contractInstance.plpLiquidationInstance.connect(liquidator).getEstimatedRewardAmount(
        signer1.address,
        prjToken.address,
        lendingToken.address,
        lendingTokenAmount
      )
      console.log("estimatedRewardAmount:", estimatedRewardAmount[1].toString())
      const { buyCallData } = await estimateBuy({
        address: prjToken.address,
        tokenType: TokenType.ERC4626
      },
        {
          address: lendingToken.address,
          tokenType: TokenType.ERC20
        },
        lendingTokenAmount,
        platform.addresses.plpLiquidationAddress,
        "0.05",
        "1",
        Dex.Paraswap,
        new ethers.providers.AlchemyProvider(1, "LWIW1vEKXkNnNNU2bdguPCXfGGOrksh1")
      )

      await expect(
        platform.contractInstance.plpLiquidationInstance.connect(liquidator).liquidate(
          signer1.address,
          getAssetInfo(prjToken.address, TokenType.ERC4626),
          getAssetInfo(lendingToken.address, TokenType.ERC20),
          lendingTokenAmount,
          updatePriceTokens,
          priceIds,
          updateData,
          buyCallData,
          { value: updateFee }
        )
      ).not.to.be.reverted;

      const balanceLendingUserAfter = await lendingToken.balanceOf(liquidator.address);
      const balanceBTokenAfter = await lendingToken.balanceOf(bToken);
      const balancePrjTokenUserAfter = await prjToken.balanceOf(liquidator.address)

      console.log("balanceLendingUserBefore: ", balanceLendingUserBefore.toString())
      console.log("balanceBTokenBefore: ", balanceBTokenBefore.toString())
      console.log("balancePrjTokenUserBefore: ", balancePrjTokenUserBefore.toString())

      console.log("balanceLendingUserAfter: ", balanceLendingUserAfter.toString())
      console.log("balanceBTokenAfter: ", balanceBTokenAfter.toString())
      console.log("balancePrjTokenUserAfter: ", balancePrjTokenUserAfter.toString())

      expect(balanceLendingUserAfter.add(lendingTokenAmount)).to.be.eq(balanceLendingUserBefore)
      expect(balanceBTokenBefore.add(lendingTokenAmount)).to.be.eq(balanceBTokenAfter)
      expect(balancePrjTokenUserBefore.add(estimatedRewardAmount[1])).to.be.eq(balancePrjTokenUserAfter)

      const estimatedHfAfter = await platform.contractInstance.plpInstance.healthFactor(signer1.address);
      console.log("Estimated Health Factor after: ", estimatedHfAfter.toString())
    }).timeout(1000000)
  })
});