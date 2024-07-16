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
const { estimateBuy, estimateSell } = require("../estimate-scripts");
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
    notionalExposure,
    margin,
    type,
    updatePriceTokens,
    plpInstance,
    plpLeverageInstance
  ) => {
    console.log({
        collateralInfo: collateralInfo,
        lendingInfo: lendingInfo,
        notionalExposure: notionalExposure.toString(),
        margin: margin,
        type: type,
        updatePriceTokens: updatePriceTokens,
        plpLeverageInstance: plpLeverageInstance.address
    })

    const lendingTokenCount = await plpLeverageInstance.calculateLendingTokenCount(lendingInfo.address,  lendingInfo.tokenType === TokenType.LP ? notionalExposure[1].div(1000000) : notionalExposure[1]);
    console.log("lendingTokenCount", lendingTokenCount.toString());
    
    const estimateData = await estimateSell(lendingInfo, collateralInfo, lendingTokenCount, "0.05", plpLeverageInstance.address, "1", Dex.Paraswap, deployMaster.provider);

    await collateral.approve(plpLeverageInstance.address, hre.ethers.constants.MaxUint256);
    await lending.approve(plpLeverageInstance.address, hre.ethers.constants.MaxUint256);

    const totalBorrowedPerLendingTokenBefore = await plpInstance.totalBorrowedPerLendingToken(lending.address)
    const depositedAmountBefore = await plpInstance.depositedAmount(deployMaster.address, collateral.address)
    const totalDepositedPerProjectTokenBefore = await plpInstance.totalDepositedPerProjectToken(collateral.address)
    const balanceCollateralBefore = await collateral.balanceOf(deployMaster.address)

    const tx = await plpLeverageInstance.leveragedBorrow(getTokenTuple(collateralInfo), getTokenTuple(lendingInfo), lendingInfo.tokenType === TokenType.LP ? notionalExposure[1].div(1000000) : notionalExposure[1], margin, estimateData.buyCallData, type, updatePriceTokens, [], []) 
    const receipt = await tx.wait();
    const events = receipt.events;
    let argsEvent;
    for (let i = 0; i < events.length; i++) {
        if (events[i]?.event == "LeveragedBorrow") {
        argsEvent = events[i].args;
        console.log(argsEvent)
        break;
        }
    }

    const totalBorrowedPerLendingTokenAfter = await plpInstance.totalBorrowedPerLendingToken(lending.address)
    const depositedAmountAfter = await plpInstance.depositedAmount(deployMaster.address, collateral.address)
    const totalDepositedPerProjectTokenAfter = await plpInstance.totalDepositedPerProjectToken(collateral.address)
    const balanceCollateralAfter = await collateral.balanceOf(deployMaster.address)

    console.log({
        totalBorrowedPerLendingTokenBefore: totalBorrowedPerLendingTokenBefore.toString(),
        totalBorrowedPerLendingTokenAfter: totalBorrowedPerLendingTokenAfter.toString(),
        depositedAmountBefore: depositedAmountBefore.toString(),
        depositedAmountAfter: depositedAmountAfter.toString(),
        totalDepositedPerProjectTokenBefore: totalDepositedPerProjectTokenBefore.toString(),
        totalDepositedPerProjectTokenAfter: totalDepositedPerProjectTokenAfter.toString(),
        balanceCollateralBefore: balanceCollateralBefore.toString(),
        balanceCollateralAfter: balanceCollateralAfter.toString()
    })

    expect(totalBorrowedPerLendingTokenBefore.add(toBN(lendingTokenCount))).to.eq(totalBorrowedPerLendingTokenAfter)
    expect(depositedAmountBefore.add(argsEvent.amountReceive).add(argsEvent.addingAmount)).to.eq(depositedAmountAfter)
    expect(balanceCollateralBefore.sub(argsEvent.addingAmount)).to.eq(balanceCollateralAfter)
    
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
    await setBalance( DAI, deployMaster.address, toBN("10000000000000000000000000000000000000000000000000000000000"));
    await setBalance( USDC, deployMaster.address, toBN("10000000000000000000000000000000000000000000000000000000000"));
    await setBalance( USDT, deployMaster.address, toBN("10000000000000000000000000000000000000000000000000000000000"));
    await setBalance( DAI_USDC, deployMaster.address, toBN("10000000000000000000000000000000000000000000000000000000000"));
    await setBalance( USDC_USDT, deployMaster.address, toBN("10000000000000000000000000000000000000000000000000000000000"));

    await tokenInstances.usdc.approve( tokenInstances.usdc_4626.address, hre.ethers.constants.MaxUint256);
    await tokenInstances.usdc_4626.deposit("10000000000000000000000", deployMaster.address);

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
    const collateralAmount = tokenInfo[collateral.address].pairType ? 0.0001 : 1000;
    const depositAmount = toBN("10").pow(tokenInfo[collateral.address].decimals).mul(collateralAmount * 10e9).div(10e9);

    const lending = Object.values(tokenInstances).find((token) => token.address.toLowerCase() === lendingAddress.toLowerCase());
    const lendingAmount = tokenInfo[lending.address].pairType ? 0.001 : 5000;
    const lendingSupplyAmount = toBN("10").pow(tokenInfo[lending.address].decimals).mul(lendingAmount * 100000).div(100000);

    const notionalExposure = await platform.contractInstance.plpInstance.getTokenEvaluation(lending.address, toBN(10).pow(tokenInfo[lending.address].decimals));
    
    const type = toBN(0)

    const updatePriceTokens = [collateral.address, lending.address];
    // Deposit collateral token
    await collateral.approve( platform.addresses.plpAddress, hre.ethers.constants.MaxUint256);
    await platform.contractInstance.plpInstance.deposit(collateral.address, depositAmount, [], [], []);
    // Supply lending token
    const { priceIds, updateFee } = await getPriceId(
      platform.contractInstance.priceProviderAggregatorInstance,
      [collateral.address, lending.address]
    );
    const updateData = await getPriceFeedsUpdateData(priceIds);

    const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lending.address)).bLendingToken;
    await lending.approve(bToken, hre.ethers.constants.MaxUint256);
    await platform.contractInstance.plpInstance.supply(lending.address, lendingSupplyAmount, updatePriceTokens, priceIds, updateData, { value: updateFee });

    const margin = await platform.contractInstance.plpLeverageInstance.calculateMargin(collateralAddress, lendingAddress, toBN(20), toBN(10), notionalExposure[1]);

    return {
      platform,
      collateral,
      collateralInfo: tokenInfo[collateral.address],
      lending,
      lendingInfo: tokenInfo[lending.address],
      notionalExposure,
      margin,
      type,
      updatePriceTokens
    };
  }

  function depositLPAndSupplyERC20() {
    return setup(DAI_USDC, USDT);
  }

  function depositERC20AndSupplyLP() {
    return setup(USDT, DAI_USDC);
  }

  function depositERC20AndSupplyERC4626() {
    return setup(USDT, USDC_4626);
  }

  function depositERC4626AndSupplyERC20() {
    return setup(USDC_4626, USDT);
  }

  function depositERC4626AndSupplyERC4626() {
    return setup(DAI_4626, USDC_4626);
  }

  function depositERC20AndSupplyERC20() {
    return setup(USDT, USDC);
  }

  function depositLPAndSupplyERC4626() {
    return setup(DAI_USDC, USDC_4626);
  }

  function depositERC4626AndSupplyLP() {
    return setup(USDC_4626, DAI_USDC);
  }

  describe("Leverage Borrow", function () {
    
    it("1. Deposit LP and Supply ERC20", async function () {
        const {
            platform,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens
        } = await helpers.loadFixture(depositLPAndSupplyERC20);

        await processing(
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpLeverageInstance
        );
    }).timeout(1000000);

    it("2. Deposit ERC20 and Supply LP", async function () {
        const {
            platform,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens
          } = await helpers.loadFixture(depositERC20AndSupplyLP);
    
          await processing(
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpLeverageInstance
          );
    }).timeout(1000000);

    it("3. Deposit ERC20 and Supply ERC4626", async function () {
        const {
            platform,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens
          } = await helpers.loadFixture(depositERC20AndSupplyERC4626);
    
          await processing(
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpLeverageInstance
          );
    }).timeout(1000000);

    it("4. Deposit ERC4626 and Supply ERC20", async function () {
        const {
            platform,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens
          } = await helpers.loadFixture(depositERC4626AndSupplyERC20);
    
          await processing(
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpLeverageInstance
          );
    }).timeout(1000000);

    it("5. Deposit ERC4626 and Supply ERC4626", async function () {
        const {
            platform,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens
        } = await helpers.loadFixture(depositERC4626AndSupplyERC4626);

        await processing(
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpLeverageInstance
        );
    }).timeout(1000000);

    it("6. Deposit ERC20 and Supply ERC20", async function () {
        const {
            platform,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens
        } = await helpers.loadFixture(depositERC20AndSupplyERC20);

        await processing(
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpLeverageInstance
        );
    }).timeout(1000000);

    it("7. Deposit LP and Supply ERC4626", async function () {
        const {
            platform,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens
        } = await helpers.loadFixture(depositLPAndSupplyERC4626);

        await processing(
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpLeverageInstance
        );
    }).timeout(1000000);

    it("8. Deposit ERC4626 and Supply LP", async function () {
        const {
            platform,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens
        } = await helpers.loadFixture(depositERC4626AndSupplyLP);

        await processing(
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpLeverageInstance
        );
    }).timeout(1000000);
  });
});