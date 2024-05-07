require("dotenv").config();
const hre = require("hardhat");
const { ethers } = require("ethers");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { Dex } = require("./estimate-scripts/enum/dexType");
const { Pair } = require("./estimate-scripts/enum/pairType");
const { TokenType } = require("./estimate-scripts/enum/tokenType");
const {
  DAI,
  USDC,
  USDT,
  DAI_USDC,
  USDC_USDT,
  USDC_4626,
  DAI_4626,
} = require("./utils/constants");
const { deployPlatform } = require("./utils/deployPlatform");
const {
  loadContractInstance,
} = require("./estimate-scripts/utils/loadContract");
const { ERC20_ABI } = require("./estimate-scripts/abis/ERC20");
const { UniswapV2Pair_ABI } = require("./estimate-scripts/abis/UniswapV2Pair");
const { ERC4626_ABI } = require("./estimate-scripts/abis/ERC4626");
const { estimate } = require("./estimate-scripts");

const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);

describe("LeverageBorrow", function () {
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
      usdc_usdt: loadContractInstance(
        USDC_USDT,
        UniswapV2Pair_ABI,
        deployMaster
      ),
      usdc_4626: loadContractInstance(USDC_4626, ERC4626_ABI, deployMaster),
      dai_4626: loadContractInstance(DAI_4626, ERC4626_ABI, deployMaster),
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
      },
      [tokenInstances.dai_usdc.address]: {
        address: tokenInstances.dai_usdc.address,
        tokenType: TokenType.LP,
        pairType: Pair.Uniswap,
        decimals: 18,
      },
      [tokenInstances.usdc_usdt.address]: {
        address: tokenInstances.usdc_usdt.address,
        tokenType: TokenType.LP,
        pairType: Pair.Uniswap,
        decimals: 18,
      },
      [tokenInstances.usdc_4626.address]: {
        address: tokenInstances.usdc_4626.address,
        tokenType: TokenType.ERC4626,
        decimals: 18,
      },
      [tokenInstances.dai_4626.address]: {
        address: tokenInstances.dai_4626.address,
        tokenType: TokenType.ERC4626,
        decimals: 18,
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
    await setBalance(
      USDT,
      deployMaster.address,
      toBN("10000000000000000000000000")
    );
    await setBalance(
      DAI_USDC,
      deployMaster.address,
      toBN("100000000000000000000000")
    );
    await setBalance(
      USDC_USDT,
      deployMaster.address,
      toBN("100000000000000000000000")
    );

    await tokenInstances.usdc.approve(
      tokenInstances.usdc_4626.address,
      hre.ethers.constants.MaxUint256
    );
    await tokenInstances.usdc_4626.deposit("10000000000", deployMaster.address);

    await tokenInstances.dai.approve(
      tokenInstances.dai_4626.address,
      hre.ethers.constants.MaxUint256
    );
    await tokenInstances.dai_4626.deposit(
      "10000000000000000000000",
      deployMaster.address
    );
    console.log("Completed to set up tokens");
    console.log();

    console.log("Deploying platform");
    process.env.TESTING = "true";
    const platfrom = await deployPlatform();
    console.log("Completed to deploy platform");
    console.log();
    return {
      tokenInstances,
      tokenInfo,
      platfrom,
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
    const { tokenInstances, tokenInfo, platfrom } = await loadFixture();

    return {
      platfrom,
      tokenInstances,
      tokenInfo,
    };
  }

  it("LP as collateral And ERC20 as lending", async function () {
    const { platfrom, tokenInstances } = await helpers.loadFixture(
      setup
    );
    const { priceProviderAggregatorInstance } = platfrom.contractInstance;
    const { dai_usdc: token } = tokenInstances;

    const tokenPrice = await priceProviderAggregatorInstance.getPrice(token.address);
    console.log(tokenPrice);
  }).timeout(1000000);
});
