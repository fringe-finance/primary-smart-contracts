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
const { deployment } = require("../../../scripts/V3/deployPLP/deploymentPLP");

const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);
const connection = new EvmPriceServiceConnection("https://hermes.pyth.network");

describe("PrimaryLendingPlatformV3", function () {
  let signers;
  let deployMaster;
  let weth;

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
    platform,
    tokenInfo,
    lending,
    lendingInfo,
    notionalExposure,
    margin,
    type,
    updatePriceTokens,
    plpInstance,
    plpWTGInstance
  ) => {

    const { priceIds, updateFee } = await getPriceId(
        platform.contractInstance.priceProviderAggregatorInstance,
        [lending.address]
      );
    const updateData = await getPriceFeedsUpdateData(priceIds);

    const lendingTokenCount = await platform.contractInstance.plpLeverageInstance.calculateLendingTokenCount(lendingInfo.address,  lendingInfo.tokenType === TokenType.LP ? notionalExposure[1].div(1000000) : notionalExposure[1]);
    console.log(lendingTokenCount.toString())

    const addingAmount = await platform.contractInstance.plpLeverageInstance.calculateAddingAmount(deployMaster.address, weth.address, margin);

    const estimateData = await estimateSell(lendingInfo, tokenInfo[weth.address], lendingTokenCount, "0.05", plpWTGInstance.address, "1", Dex.Paraswap, deployMaster.provider);
    console.log(estimateData)

    await weth.approve(platform.contractInstance.plpLeverageInstance.address, hre.ethers.constants.MaxUint256);
    await lending.approve(platform.contractInstance.plpLeverageInstance.address, hre.ethers.constants.MaxUint256);

    const totalBorrowedPerLendingTokenBefore = await plpInstance.totalBorrowedPerLendingToken(lending.address)
    const depositedAmountBefore = await plpInstance.depositedAmount(deployMaster.address, weth.address)
    const totalDepositedPerProjectTokenBefore = await plpInstance.totalDepositedPerProjectToken(weth.address)
    const balanceCollateralBefore = await deployMaster.getBalance();

    const tx = await plpWTGInstance.leveragedBorrowWithProjectETH(getTokenTuple(lendingInfo), lendingInfo.tokenType === TokenType.LP ? notionalExposure[1].div(1000000) : notionalExposure[1], margin, estimateData.buyCallData, type, priceIds, updateData, updateFee, updatePriceTokens, {value: addingAmount}) 
    let receipt = await tx.wait();
    let cumulativeGasUsed = receipt.cumulativeGasUsed;
    let effectiveGasPrice = receipt.effectiveGasPrice;
    let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

    console.log({
        transactionFee: transactionFee.toString(),
        cumulativeGasUsed: cumulativeGasUsed.toString(),
        effectiveGasPrice: effectiveGasPrice.toString()
    })

    let args;
    for (let log of receipt.logs) {
        try {
            let decodedLog = platform.contractInstance.plpLeverageInstance.interface.parseLog(log);
            if (decodedLog.name === "LeveragedBorrow") {
                args = decodedLog.args
                console.log(args)
            }
        } catch (error) { }
    }

    const totalBorrowedPerLendingTokenAfter = await plpInstance.totalBorrowedPerLendingToken(lending.address)
    const depositedAmountAfter = await plpInstance.depositedAmount(deployMaster.address, weth.address)
    const totalDepositedPerProjectTokenAfter = await plpInstance.totalDepositedPerProjectToken(weth.address)
    const balanceCollateralAfter = await deployMaster.getBalance();

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
    expect(depositedAmountBefore.add(args.amountReceive).add(args.addingAmount)).to.eq(depositedAmountAfter)
    expect(totalDepositedPerProjectTokenBefore.add(args.amountReceive).add(args.addingAmount)).to.eq(totalDepositedPerProjectTokenAfter)
    expect(balanceCollateralBefore.sub(transactionFee.add(addingAmount))).to.eq(balanceCollateralAfter)
    
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

    const addresses = await deployment();
    wethAddress = ethers.utils.getAddress(addresses.lendingTokens[7]);
    let MockWeth = await hre.ethers.getContractFactory("WETH9");
    weth = MockWeth.attach(wethAddress).connect(deployMaster);

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
      [weth.address]: { address: weth.address, tokenType: TokenType.ERC20, decimals: 18,}
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

  async function setup(lendingAddress) {
    const { platform, tokenInfo, tokenInstances } = await loadFixture();

    const msgValue = ethers.utils.parseEther("10");
    console.log(msgValue.toString())
    const fee = toBN(0)
    await platform.contractInstance.plpWTGInstance.deposit(msgValue, [weth.address], [], [], fee, { value: msgValue });

    const lending = Object.values(tokenInstances).find((token) => token.address.toLowerCase() === lendingAddress.toLowerCase());
    const lendingAmount = tokenInfo[lending.address].pairType ? 0.001 : 5000;
    const lendingSupplyAmount = toBN("10").pow(tokenInfo[lending.address].decimals).mul(lendingAmount * 100000).div(100000);

    const notionalExposure = await platform.contractInstance.plpInstance.getTokenEvaluation(lending.address, toBN(10).pow(tokenInfo[lending.address].decimals));
    
    const type = toBN(0)

    const updatePriceTokens = [weth.address, lending.address];
    
    // Supply lending token
    const { priceIds, updateFee } = await getPriceId(
      platform.contractInstance.priceProviderAggregatorInstance,
      [lending.address]
    );
    const updateData = await getPriceFeedsUpdateData(priceIds);

    const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(lending.address)).bLendingToken;
    await lending.approve(bToken, hre.ethers.constants.MaxUint256);
    await platform.contractInstance.plpInstance.supply(lending.address, lendingSupplyAmount, updatePriceTokens, priceIds, updateData, { value: updateFee });

    const margin = await platform.contractInstance.plpLeverageInstance.calculateMargin(weth.address, lendingAddress, toBN(20), toBN(10), notionalExposure[1]);

    return {
      platform,
      lending,
      lendingInfo: tokenInfo[lending.address],
      notionalExposure,
      margin,
      type,
      updatePriceTokens,
      tokenInfo
    };
  }
  
  function depositWETHAndSupplyERC20() {
    return setup(USDC)
  }

  function depositWETHAndSupplyERC4626() {
    return setup(USDC_4626)
  }

  function depositWETHAndSupplyLP() {
    return setup(DAI_USDC)
  }

  describe("Leverage Borrow", function () {
    
    it("1. Deposite WETH and Supply ERC20", async function () {
        const {
            platform,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens,
            tokenInfo
        } = await helpers.loadFixture(depositWETHAndSupplyERC20);

        await processing(
            platform,
            tokenInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpWTGInstance
        );
    }).timeout(1000000);

    it("2. Deposite WETH and Supply ERC4626", async function () {
        const {
            platform,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens,
            tokenInfo
          } = await helpers.loadFixture(depositWETHAndSupplyERC4626);
    
          await processing(
            platform,
            tokenInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpWTGInstance
          );
    }).timeout(1000000);

    it("3. Deposit WETH and Supply LP", async function () {
        const {
            platform,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens,
            tokenInfo
          } = await helpers.loadFixture(depositWETHAndSupplyLP);
    
          await processing(
            platform,
            tokenInfo,
            lending,
            lendingInfo,
            notionalExposure,
            margin,
            type,
            updatePriceTokens,
            platform.contractInstance.plpInstance,
            platform.contractInstance.plpWTGInstance
          );
    }).timeout(1000000);
  });
});