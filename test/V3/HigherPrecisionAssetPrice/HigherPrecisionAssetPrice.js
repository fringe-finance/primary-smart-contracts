require("dotenv").config();
const hre = require("hardhat");
const { ethers } = require("ethers");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { Dex } = require("../estimate-scripts/enum/dexType");
const { Pair } = require("../estimate-scripts/enum/pairType");
const { TokenType } = require("../estimate-scripts/enum/tokenType");
const { DAI, USDC } = require("../utils/constants");
const { deployPlatform } = require("../utils/deployPlatform");
const {
  loadContractInstance,
} = require("../estimate-scripts/utils/loadContract");
const { ERC20_ABI } = require("../estimate-scripts/abis/ERC20");
const { UniswapV2Pair_ABI } = require("../estimate-scripts/abis/UniswapV2Pair");
const { ERC4626_ABI } = require("../estimate-scripts/abis/ERC4626");
const { estimate } = require("../estimate-scripts");
const { deployment } = require("../../../scripts/V3/deployPLP/deploymentPLP");
const { expect } = require("chai");

const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);

describe("Price Oracle", function () {
  let signers;
  let deployMaster;
  let priceOracle;
  let priceOracleInstance;
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
      toBN("10000000000000000000000000")
    );
    await setBalance(
      USDC,
      deployMaster.address,
      toBN("10000000000000000000000000")
    );
    console.log("Completed to set up tokens");
    console.log();

    console.log("Deploying platform");
    process.env.TESTING = "true";
    const platform = await deployPlatform();
    console.log("Completed to deploy platform");
    console.log();

    const addresses = await deployment();
    priceOracle = await hre.ethers.getContractFactory("PriceOracle");
    priceOracleInstance = priceOracle.attach(addresses.priceOracleAddress).connect(deployMaster);
    UniswapPriceProviderMock = await hre.ethers.getContractFactory("UniswapV2PriceProviderMock");
    uniswapPriceProviderMockInstance = UniswapPriceProviderMock.attach(addresses.uniswapV2PriceProviderMockAddress).connect(deployMaster)

    return {
      tokenInstances,
      tokenInfo,
      platform,
      addresses,
    };
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
    const { tokenInstances, tokenInfo, platform, addresses } = await loadFixture();

    return {
      platform,
      tokenInstances,
      tokenInfo,
      addresses
    };
  }

  describe("Increase price decimals", function () {
      it("Check getMostTWAPprice after increase price decimals", async function () {
        const { platform, tokenInstances, tokenInfo, addresses } = await helpers.loadFixture(setup);
    
        const prjToken = tokenInstances.dai;
    
        const priceInfo = await priceOracleInstance.getMostTWAPprice(prjToken.address);
        console.log("priceInfo: ", priceInfo.toString());
    
      }).timeout(1000000);

      it("Check getEvaluation after increase price decimals", async function () {
        const { platform, tokenInstances, tokenInfo, addresses } = await helpers.loadFixture(setup);

        const prjToken = tokenInstances.usdc;

        const evaluation = await priceOracleInstance.getEvaluation(prjToken.address, toBN(10).pow(tokenInfo[prjToken.address].decimals));
        console.log("evaluation: ", evaluation.toString());
      }).timeout(1000000)

      it("Check getReportedPrice after increase price decimals", async function () {
        const { platform, tokenInstances, tokenInfo, addresses } = await helpers.loadFixture(setup);

        const prjToken = tokenInstances.usdc;

        const reportedPrice = await priceOracleInstance.getReportedPrice(prjToken.address);
        console.log("reportedPrice: ", reportedPrice.toString());
      })
  })
});
