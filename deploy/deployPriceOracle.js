require('dotenv').config();
const { Wallet, Provider } = require("zksync-web3");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const ethers = require("ethers");
const fs = require('fs');
const path = require('path');
const configGeneralFile = './configs/config_general.json';
const configGeneral = require(configGeneralFile);
const configFile = './configs/configs.json';
let configs = require(configFile);
let {
  PRIMARY_PROXY_ADMIN,
  ChainlinkPriceProviderLogic,
  ChainlinkPriceProviderProxy,
  BackendPriceProviderLogic,
  BackendPriceProviderProxy,
  UniswapV2PriceProviderLogic,
  UniswapV2PriceProviderProxy,
  PriceProviderAggregatorLogic,
  PriceProviderAggregatorProxy
} = configs;

module.exports = async function () {
  try {
    const provider = new Provider('https://zksync2-testnet.zksync.dev');
    const wallet = new Wallet(process.env.OPERATOR_PRIVATE_KEY).connect(provider);
    const deployer = new Deployer(hre, wallet);

    let usdDecimal = 0;
    
    //instances of contracts
    let proxyAdmin;
    let chainlinkPriceProvider;
    let backendPriceProvider;
    let uniswapV2PriceProvider;
    let priceProviderAggregator;

    //====================================================
    //initialize deploy parametrs
    const ProxyAdmin = await deployer.loadArtifact("ProxyAdmin");
    const TransparentUpgradeableProxy = await deployer.loadArtifact("TransparentUpgradeableProxy");
    const ChainlinkPriceProvider = await deployer.loadArtifact("ChainlinkPriceProvider");
    const BackendPriceProvider = await deployer.loadArtifact("BackendPriceProvider");
    const UniswapV2PriceProvider = await deployer.loadArtifact("UniswapV2PriceProviderMock");
    const PriceProviderAggregator = await deployer.loadArtifact("PriceProviderAggregator");

    //interfaces of contracts
    let chainlinkPriceProviderInterface = new ethers.utils.Interface(ChainlinkPriceProvider.abi);
    let backendPriceProviderInterface = new ethers.utils.Interface(BackendPriceProvider.abi);
    let uniswapV2PriceProviderInterface = new ethers.utils.Interface(UniswapV2PriceProvider.abi);
    let priceProviderAggregatorInterface = new ethers.utils.Interface(PriceProviderAggregator.abi);

    const {
      priceOracle
    } = configGeneral;

    //contracts addresses
    let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
    let chainlinkPriceProviderAddress = ChainlinkPriceProviderProxy;
    let priceProviderAggregatorAddress = PriceProviderAggregatorProxy;
    let backendPriceProviderAddress = BackendPriceProviderProxy;
    let uniswapV2PriceProviderAddress = UniswapV2PriceProviderProxy;

    let backendPriceProviderLogicAddress = BackendPriceProviderLogic
    let chainlinkPriceProviderLogicAddress = ChainlinkPriceProviderLogic;
    let priceProviderAggregatorLogicAddress = PriceProviderAggregatorLogic;
    let uniswapV2PriceProviderLogicAddress = UniswapV2PriceProviderLogic;

    let tokensUseUniswap = priceOracle.tokensUseUniswap;
    let uniswapPrices = priceOracle.uniswapPrices;
    let tokensUseChainlink = priceOracle.tokensUseChainlink;
    let chainlinkAggregatorV3 = priceOracle.chainlinkAggregatorV3;
    let tokensUseBackendProvider = priceOracle.tokensUseBackendProvider;

    //====================== deploy proxy admin =============================
    if (!proxyAdminAddress) {
      proxyAdmin = await deployer.deploy(ProxyAdmin, []);
      configs.PRIMARY_PROXY_ADMIN = proxyAdminAddress = proxyAdmin.address;
    }
    console.log(`${ProxyAdmin.contractName} was deployed at: ${proxyAdminAddress}`);

    //====================== deploy chainlinkPriceProvider =============================
    if (!chainlinkPriceProviderLogicAddress) {
      chainlinkPriceProvider = await deployer.deploy(ChainlinkPriceProvider, []);
      configs.ChainlinkPriceProviderLogic = chainlinkPriceProviderLogicAddress = chainlinkPriceProvider.address;
    }
    console.log(`ChainlinkPriceProvider masterCopy was deployed at: ${chainlinkPriceProviderLogicAddress}`);
    if (!chainlinkPriceProviderAddress) {
      const chainlinkPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [chainlinkPriceProviderLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.ChainlinkPriceProviderProxy = chainlinkPriceProviderAddress = chainlinkPriceProviderProxy.address;
    }
    console.log(`ChainlinkPriceProvider was deployed at: ${chainlinkPriceProviderAddress}`);

    //====================== deploy backendPriceProvider =============================

    // if exist backendPriceProvider, then we need to get interface of it
    if (!backendPriceProviderLogicAddress) {
      backendPriceProvider = await deployer.deploy(BackendPriceProvider, []);
      configs.BackendPriceProviderLogic = backendPriceProviderLogicAddress = backendPriceProvider.address;
    }
    console.log(`BackendPriceProvider masterCopy was deployed at: ${backendPriceProviderLogicAddress}`);
    if (!backendPriceProviderAddress) {
      const backendPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [backendPriceProviderLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.ChainlinkPriceProviderProxy = backendPriceProviderAddress = backendPriceProviderProxy.address;
    }
    console.log(`BackendPriceProvider was deployed at: ${backendPriceProviderAddress}`);

    //====================== deploy uniswapV2PriceProvider =============================
    if (!uniswapV2PriceProviderLogicAddress) {
      uniswapV2PriceProvider = await deployer.deploy(UniswapV2PriceProvider, []);
      configs.BackendPriceProviderLogic = uniswapV2PriceProviderLogicAddress = uniswapV2PriceProvider.address;
    }
    console.log(`UniswapV2PriceProvider masterCopy was deployed at: ${uniswapV2PriceProviderLogicAddress}`);
    if (!uniswapV2PriceProviderAddress) {
      const uniswapV2PriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [uniswapV2PriceProviderLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.UniswapV2PriceProviderProxy = uniswapV2PriceProviderAddress = uniswapV2PriceProviderProxy.address;
    }
    console.log(`UniswapV2PriceProvider was deployed at: ${uniswapV2PriceProviderAddress}`);

    //====================== deploy PriceProviderAggregator =============================
    if (!priceProviderAggregatorLogicAddress) {
      priceProviderAggregator = await deployer.deploy(PriceProviderAggregator, []);
      configs.PriceProviderAggregatorLogic = priceProviderAggregatorLogicAddress = priceProviderAggregator.address;
    }
    console.log(`PriceProviderAggregator masterCopy was deployed at: ${priceProviderAggregatorLogicAddress}`);
    if (!priceProviderAggregatorAddress) {
      const usbPriceOracleProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [priceProviderAggregatorLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.PriceProviderAggregatorProxy = priceProviderAggregatorAddress = usbPriceOracleProxy.address;
    }
    console.log(`PriceProviderAggregator was deployed at: ${priceProviderAggregatorAddress}`);

    //====================== setting Params =============================
    chainlinkPriceProvider = new ethers.Contract(chainlinkPriceProviderAddress, chainlinkPriceProviderInterface, wallet);
    backendPriceProvider = new ethers.Contract(backendPriceProviderAddress, backendPriceProviderInterface, wallet);
    uniswapV2PriceProvider = new ethers.Contract(uniswapV2PriceProviderAddress, uniswapV2PriceProviderInterface, wallet);
    priceProviderAggregator = new ethers.Contract(priceProviderAggregatorAddress, priceProviderAggregatorInterface, wallet);

    //====================== set chainlinkPriceProvider =============================
    usdDecimal = await chainlinkPriceProvider.usdDecimals();
    if (usdDecimal == 0) {
      await chainlinkPriceProvider.initialize()
        .then(function (instance) {
          console.log("\nTransaction hash: " + instance.hash)
          console.log("ChainlinkPriceProvider initialized at " + chainlinkPriceProviderAddress);
        });

      await chainlinkPriceProvider.grandModerator(priceProviderAggregatorAddress)
        .then(function (instance) {
          console.log("\nTransaction hash: " + instance.hash)
          console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " granded moderator " + priceProviderAggregatorAddress);
        });

      for (var i = 0; i < tokensUseChainlink.length; i++) {
        await chainlinkPriceProvider.setTokenAndAggregator(
          tokensUseChainlink[i],
          [chainlinkAggregatorV3[i]]
        ).then(function (instance) {
          console.log("\nTransaction hash: " + instance.hash)
          console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token with parameters: ")
          console.log("   token: " + tokensUseChainlink[i])
          console.log("   aggregator path: " + [chainlinkAggregatorV3[i]]);
        });
      }
    }

    //====================== set backendPriceProvider =============================
    usdDecimal = await backendPriceProvider.usdDecimals();
    if (usdDecimal == 0) {
      await backendPriceProvider.initialize()
        .then(function (instance) {
          console.log("BackendPriceProvider " + backendPriceProviderAddress + " initialized at tx hash: " + instance.hash);
        });

      await backendPriceProvider.grandTrustedBackendRole(wallet.address)
        .then(function (instance) {
          console.log("BackendPriceProvider " + backendPriceProvider.address + " set trusted backend " + wallet.address + " at tx hash: " + instance.hash);
        });

      for (var i = 0; i < tokensUseBackendProvider.length; i++) {
        await backendPriceProvider.setToken(tokensUseBackendProvider[i]).then(function (instance) {
          console.log("BackendPriceProvider " + backendPriceProvider.address + " set token " + tokensUseBackendProvider[i] + "at tx hash: " + instance.hash);
        });
      }
    }

    //====================== set uniswapV2PriceProvider =============================
    usdDecimal = await uniswapV2PriceProvider.getPriceDecimals();

    if (usdDecimal == 0) {
      await uniswapV2PriceProvider.initialize().then(function (instance) {
        console.log("UniswapV2PriceProvider initialized at " + uniswapV2PriceProviderAddress + " at tx hash " + instance.hash);
      });

      await uniswapV2PriceProvider.grandModerator(priceProviderAggregatorAddress).then(function (instance) {
        console.log("UniswapV2PriceProvider granded moderator " + priceProviderAggregatorAddress + " at tx hash " + instance.hash);
      });

      for (var i = 0; i < tokensUseUniswap.length; i++) {
        await uniswapV2PriceProvider.setTokenAndPrice(tokensUseUniswap[i], uniswapPrices[i]).then(function (instance) {
          console.log("UniswapV2PriceProvider set token " + tokensUseUniswap[i] + " and price " + uniswapPrices[i] + " at tx hash: " + instance.hash);
        });
      }
    }

    //====================== set priceProviderAggregator =============================
    usdDecimal = await priceProviderAggregator.usdDecimals();
    if (usdDecimal == 0) {
      await priceProviderAggregator.initialize().then(function (instance) {
        console.log("PriceProviderAggregator initialized at " + priceProviderAggregatorAddress + " at tx hash: " + instance.hash);
      });

      await priceProviderAggregator.grandModerator(wallet.address).then(function (instance) {
        console.log("PriceProviderAggregator " + priceProviderAggregator.address + " granded moderator " + wallet.address + " at tx hash: " + instance.hash);
      });

      for (var i = 0; i < tokensUseChainlink.length; i++) {
        await priceProviderAggregator.setTokenAndPriceProvider(tokensUseChainlink[i], chainlinkPriceProviderAddress, false).then(function (instance) {
          console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseChainlink[i] + " with priceOracle " + chainlinkPriceProviderAddress + " at tx hash: " + instance.hash);
        });
      }

      for (var i = 0; i < tokensUseUniswap.length; i++) {
        await priceProviderAggregator.setTokenAndPriceProvider(tokensUseUniswap[i], uniswapV2PriceProviderAddress, false).then(function (instance) {

          console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseUniswap[i] + " with priceOracle " + uniswapV2PriceProviderAddress + " at tx hash: " + instance.hash);
        });
      }
    }

    let addresses = {
      proxyAdminAddress: proxyAdminAddress,
      chainlinkPriceProviderAddress: chainlinkPriceProviderAddress,
      backendPriceProviderAddress: backendPriceProviderAddress,
      uniswapV2PriceProviderAddress: uniswapV2PriceProviderAddress,
      priceProviderAggregatorAddress: priceProviderAggregatorAddress,
    }
    console.log(addresses);
  } catch (err) {
    console.log(err);
  } finally {
    fs.writeFileSync(path.resolve(__dirname, configFile), JSON.stringify(configs, null, 4));
  }
};
