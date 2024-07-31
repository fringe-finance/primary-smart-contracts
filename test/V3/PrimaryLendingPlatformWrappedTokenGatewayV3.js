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
const { estimate } = require("./estimate-scripts");
const { expect } = require("chai");
const { EvmPriceServiceConnection } = require("@pythnetwork/pyth-evm-js");
const { deployment } = require("../../scripts/V3/deployPLP/deploymentPLP");

const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);
const connection = new EvmPriceServiceConnection("https://hermes.pyth.network");

describe("PrimaryLendingPlatformLiquidationV3", function () {
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
    await setBalance(
      DAI,
      deployMaster.address,
      toBN("10000000000000000000000000000000000000000")
    );
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

    const addresses = await deployment();
    UniswapPriceProviderMock = await hre.ethers.getContractFactory(
      "UniswapV2PriceProviderMock"
    );
    uniswapPriceProviderMockInstance = UniswapPriceProviderMock.attach(
      addresses.uniswapV2PriceProviderMockAddress
    ).connect(deployMaster);

    return { platform, tokenInfo, tokenInstances, addresses };
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
    const { tokenInstances, tokenInfo, platform, addresses } =
      await loadFixture();

    return {
      platform,
      tokenInfo,
      tokenInstances,
      addresses,
    };
  }

  describe("Wrapped Token Gateway", async function () {
    it("1. Deposit successfully", async function () {
      const { platform, tokenInstances, tokenInfo, addresses } =
        await helpers.loadFixture(setup);
      wethAddress = ethers.utils.getAddress(addresses.lendingTokens[7]);
      let MockWeth = await hre.ethers.getContractFactory("WETH9");
      let weth = MockWeth.attach(wethAddress).connect(deployMaster);

      let prjToken = weth.address;

      const msgValue = ethers.utils.parseEther("10");
      const updateFee = ethers.utils.parseEther("0");

      const balanceUserBeforeDeposit = await deployMaster.getBalance();

      const tx = await platform.contractInstance.plpWTGInstance.deposit(msgValue, [prjToken], [], [], updateFee, {
        value: msgValue,
      });
      const receipt = await tx.wait();
      let cumulativeGasUsed = receipt.cumulativeGasUsed;
      let effectiveGasPrice = receipt.effectiveGasPrice;
      let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

      const balanceUserAfterDeposit = await deployMaster.getBalance();

      expect(balanceUserBeforeDeposit.sub(msgValue.add(transactionFee))).to.eq(
        balanceUserAfterDeposit
      );
    }).timeout(1000000);

    it("2. Supply successfully", async function () {
      const { platform, tokenInstances, tokenInfo, addresses } = await helpers.loadFixture(setup);
      wethAddress = ethers.utils.getAddress(addresses.lendingTokens[7]);
      const MockWeth = await hre.ethers.getContractFactory("WETH9");
      const weth = MockWeth.attach(wethAddress).connect(deployMaster);
      const updatePriceTokens = [weth.address];

      const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(wethAddress)).bLendingToken;
      let blt = await hre.ethers.getContractFactory("BLendingToken");
      let bltInstance = blt.attach(bToken).connect(deployMaster);
      const exchangeRate = Number((await bltInstance.exchangeRateStored()).div(toBN(10).pow(18)));

      const value = ethers.utils.parseEther("10");
      const updateFee = ethers.utils.parseEther("0");

      const wethBalanceBeforeSupply = await hre.ethers.provider.getBalance(wethAddress);
      const balanceOfBLendingTokenBeforeSupply = await bltInstance.balanceOf(deployMaster.address);

      await weth.connect(deployMaster).approve(bToken, value);
      const tx = await platform.contractInstance.plpWTGInstance.supply(value, [], [], updatePriceTokens, updateFee, {value: value});

      const receipt = await tx.wait();

      const wethBalanceAfterSupply = await hre.ethers.provider.getBalance(wethAddress);
      const balanceOfBLendingTokenAfterSupply = await bltInstance.balanceOf(deployMaster.address);

      expect(wethBalanceBeforeSupply.add(value)).to.eq(wethBalanceAfterSupply);
      expect(balanceOfBLendingTokenBeforeSupply).to.eq(balanceOfBLendingTokenAfterSupply.sub(value.div(exchangeRate)))
    }).timeout(1000000);

    it("3. Redeem successfully", async function () {
      const { platform, tokenInstances, tokenInfo, addresses } = await helpers.loadFixture(setup);
      wethAddress = ethers.utils.getAddress(addresses.lendingTokens[7]);
      const MockWeth = await hre.ethers.getContractFactory("WETH9");
      const weth = MockWeth.attach(wethAddress).connect(deployMaster);
      const updatePriceTokens = [weth.address];

      const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(wethAddress)).bLendingToken;
      let blt = await hre.ethers.getContractFactory("BLendingToken");
      let bltInstance = blt.attach(bToken).connect(deployMaster);
      const exchangeRate = Number((await bltInstance.exchangeRateStored()).div(toBN(10).pow(18)));

      const value = ethers.utils.parseEther("10");
      const updateFee = ethers.utils.parseEther("0");

      await weth.connect(deployMaster).approve(bToken, value);
      await weth.connect(deployMaster).approve(platform.contractInstance.plpWTGInstance.address, value);
      const tx = await platform.contractInstance.plpWTGInstance.supply(value, [], [], updatePriceTokens, updateFee, {value: value});

      const bLendingTokenAmount = ethers.utils.parseEther("1");
      
      const balanceOfBLendingTokenUserBeforeRedeem = await bltInstance.balanceOf(deployMaster.address);
      const balanceOfBLendingTokenBeforeRedeem = await weth.balanceOf(bToken);
      const wethBalanceBeforeRedeem = await hre.ethers.provider.getBalance(wethAddress);

      await platform.contractInstance.plpWTGInstance.redeem(bLendingTokenAmount, updatePriceTokens, [], [])

      const balanceOfBLendingTokenUserAfterRedeem = await bltInstance.balanceOf(deployMaster.address);
      const balanceOfBLendingTokenAfterRedeem = await weth.balanceOf(bToken);
      const wethBalanceAfterRedeem = await hre.ethers.provider.getBalance(wethAddress);

      expect(balanceOfBLendingTokenUserBeforeRedeem.sub(bLendingTokenAmount)).to.eq(balanceOfBLendingTokenUserAfterRedeem);
      expect(balanceOfBLendingTokenAfterRedeem.add(bLendingTokenAmount.mul(exchangeRate))).to.eq(balanceOfBLendingTokenBeforeRedeem);
      expect(wethBalanceBeforeRedeem).to.eq(wethBalanceAfterRedeem.add(bLendingTokenAmount.mul(exchangeRate)));

    }).timeout(1000000);

    it("4. redeemUnderlying sucessfully", async function () {
      const { platform, tokenInstances, tokenInfo, addresses } = await helpers.loadFixture(setup);
      wethAddress = ethers.utils.getAddress(addresses.lendingTokens[7]);
      const MockWeth = await hre.ethers.getContractFactory("WETH9");
      const weth = MockWeth.attach(wethAddress).connect(deployMaster);
      const updatePriceTokens = [weth.address];

      const bToken = (await platform.contractInstance.plpInstance.lendingTokenInfo(wethAddress)).bLendingToken;
      let blt = await hre.ethers.getContractFactory("BLendingToken");
      let bltInstance = blt.attach(bToken).connect(deployMaster);
      const exchangeRate = Number((await bltInstance.exchangeRateStored()).div(toBN(10).pow(18)));

      const value = ethers.utils.parseEther("10");
      const updateFee = ethers.utils.parseEther("0");

      await weth.connect(deployMaster).approve(bToken, value);
      await weth.connect(deployMaster).approve(platform.contractInstance.plpWTGInstance.address, value);
      const tx = await platform.contractInstance.plpWTGInstance.supply(value, [], [], updatePriceTokens, updateFee, {value: value});

      const lendingTokenAmount = ethers.utils.parseEther("1");

      const wethBalanceBeforeRedeemUnderlying = await hre.ethers.provider.getBalance(wethAddress);
      const balanceOfBLendingTokenBeforeRedeemUnderlying = await weth.balanceOf(bToken);
      const balanceOfBLendingTokenUserBeforeRedeemUnderlying = await bltInstance.balanceOf(deployMaster.address);

      await platform.contractInstance.plpWTGInstance.redeemUnderlying(lendingTokenAmount, updatePriceTokens, [], [])

      const wethBalanceAfterRedeemUnderlying = await hre.ethers.provider.getBalance(wethAddress);
      const balanceOfBLendingTokenAfterRedeemUnderlying = await weth.balanceOf(bToken);
      const balanceOfBLendingTokenUserAfterRedeemUnderlying = await bltInstance.balanceOf(deployMaster.address);

      expect(wethBalanceBeforeRedeemUnderlying).to.eq(wethBalanceAfterRedeemUnderlying.add(lendingTokenAmount));
      expect(balanceOfBLendingTokenBeforeRedeemUnderlying).to.eq(balanceOfBLendingTokenAfterRedeemUnderlying.add(lendingTokenAmount));
      expect(balanceOfBLendingTokenUserBeforeRedeemUnderlying).to.eq(balanceOfBLendingTokenUserAfterRedeemUnderlying.add(lendingTokenAmount.div(exchangeRate)));
    }).timeout(1000000)
  });
});
