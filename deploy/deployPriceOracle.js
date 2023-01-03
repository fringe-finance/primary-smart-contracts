require('dotenv').config();
const { Wallet, Provider } = require("zksync-web3");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const ethers = require("ethers");
const fs = require('fs');
const path = require('path');
const configGeneralFile = './config/config_general.json';
const configGeneral = require(configGeneralFile);
const configFile = './config/config.json';
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
  PriceProviderAggregatorProxy,
  LPPriceProviderLogic,
  LPPriceProviderProxy,
  wstETHPriceProviderLogic,
  wstETHPriceProviderProxy
} = configs;

module.exports = async function () {
  try {
    const provider = new Provider('https://zksync2-testnet.zksync.dev');
    const mnemonic = process.env.MNEMONIC;
    let  walletOperator = ethers.Wallet.fromMnemonic(mnemonic);
    let OPERATOR_PRIVATE_KEY = walletOperator.privateKey;
    const wallet = new Wallet(OPERATOR_PRIVATE_KEY).connect(provider);
    const deployer = new Deployer(hre, wallet);

    let usdDecimal = 0;
    
    //instances of contracts
    let proxyAdmin;
    let chainlinkPriceProvider;
    let backendPriceProvider;
    let uniswapV2PriceProvider;
    let priceProviderAggregator;
    let lpPriceProvider;
    let wstETHPriceProvider;

    //====================================================
    //initialize deploy parametrs
    const ProxyAdmin = await deployer.loadArtifact("ProxyAdmin");
    const TransparentUpgradeableProxy = await deployer.loadArtifact("TransparentUpgradeableProxy");
    const ChainlinkPriceProvider = await deployer.loadArtifact("ChainlinkPriceProvider");
    const BackendPriceProvider = await deployer.loadArtifact("BackendPriceProvider");
    const UniswapV2PriceProvider = await deployer.loadArtifact("UniswapV2PriceProviderMock");
    const PriceProviderAggregator = await deployer.loadArtifact("PriceProviderAggregator");
    const LPPriceProvider = await deployer.loadArtifact("LPPriceProvider");
    const WstETHPriceProvider = await deployer.loadArtifact("wstETHPriceProvider");

    //interfaces of contracts
    let chainlinkPriceProviderInterface = new ethers.utils.Interface(ChainlinkPriceProvider.abi);
    let backendPriceProviderInterface = new ethers.utils.Interface(BackendPriceProvider.abi);
    let uniswapV2PriceProviderInterface = new ethers.utils.Interface(UniswapV2PriceProvider.abi);
    let priceProviderAggregatorInterface = new ethers.utils.Interface(PriceProviderAggregator.abi);
    let lpPriceProviderInterface = new ethers.utils.Interface(LPPriceProvider.abi);
    let wstETHPriceProviderInterface = new ethers.utils.Interface(WstETHPriceProvider.abi);

    const {
      priceOracle
    } = configGeneral;

    //contracts addresses
    let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
    let chainlinkPriceProviderAddress = ChainlinkPriceProviderProxy;
    let priceProviderAggregatorAddress = PriceProviderAggregatorProxy;
    let backendPriceProviderAddress = BackendPriceProviderProxy;
    let uniswapV2PriceProviderAddress = UniswapV2PriceProviderProxy;
    let lpPriceProviderAddress = LPPriceProviderProxy;
    let wstETHPriceProviderAddress = wstETHPriceProviderProxy;

    let backendPriceProviderLogicAddress = BackendPriceProviderLogic
    let chainlinkPriceProviderLogicAddress = ChainlinkPriceProviderLogic;
    let priceProviderAggregatorLogicAddress = PriceProviderAggregatorLogic;
    let uniswapV2PriceProviderLogicAddress = UniswapV2PriceProviderLogic;
    let lpPriceProviderLogicAddress = LPPriceProviderLogic;
    let wstETHPriceProviderLogicAddress = wstETHPriceProviderLogic;

    let tokensUseUniswap = priceOracle.tokensUseUniswap;
    let uniswapPrices = priceOracle.uniswapPrices;
    let tokensUseChainlink = priceOracle.tokensUseChainlink;
    let chainlinkAggregatorV3 = priceOracle.chainlinkAggregatorV3;
    let tokensUseBackendProvider = priceOracle.tokensUseBackendProvider;
    let tokensUseLPProvider = priceOracle.tokensUseLPProvider;
    let wstETH = priceOracle.wstETH;
    let wstETHAggregatorPath = priceOracle.wstETHAggregatorPath;

    //====================== deploy proxy admin =============================
    console.log();
    console.log("***** PROXY ADMIN DEPLOYMENT *****");
    if (!proxyAdminAddress) {
      proxyAdmin = await deployer.deploy(ProxyAdmin, []);
      configs.PRIMARY_PROXY_ADMIN = proxyAdminAddress = proxyAdmin.address;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`${ProxyAdmin.contractName} was deployed at: ${proxyAdminAddress}`);

    //====================== deploy chainlinkPriceProvider =============================
    console.log();
    console.log("***** CHAINLINK PRICE PROVIDER DEPLOYMENT *****");
    if (!chainlinkPriceProviderLogicAddress) {
      chainlinkPriceProvider = await deployer.deploy(ChainlinkPriceProvider, []);
      configs.ChainlinkPriceProviderLogic = chainlinkPriceProviderLogicAddress = chainlinkPriceProvider.address;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`ChainlinkPriceProvider masterCopy was deployed at: ${chainlinkPriceProviderLogicAddress}`);
    if (!chainlinkPriceProviderAddress) {
      const chainlinkPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [chainlinkPriceProviderLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.ChainlinkPriceProviderProxy = chainlinkPriceProviderAddress = chainlinkPriceProviderProxy.address;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`ChainlinkPriceProvider was deployed at: ${chainlinkPriceProviderAddress}`);

    //====================== deploy backendPriceProvider =============================
    console.log();
    console.log("***** BACKEND PRICE PROVIDER DEPLOYMENT *****");

    // if exist backendPriceProvider, then we need to get interface of it
    if (!backendPriceProviderLogicAddress) {
      backendPriceProvider = await deployer.deploy(BackendPriceProvider, []);
      configs.BackendPriceProviderLogic = backendPriceProviderLogicAddress = backendPriceProvider.address;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`BackendPriceProvider masterCopy was deployed at: ${backendPriceProviderLogicAddress}`);
    if (!backendPriceProviderAddress) {
      const backendPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [backendPriceProviderLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.BackendPriceProviderProxy = backendPriceProviderAddress = backendPriceProviderProxy.address;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`BackendPriceProvider was deployed at: ${backendPriceProviderAddress}`);

    //====================== deploy uniswapV2PriceProvider =============================
    console.log();
    console.log("***** UNISWAPV2 PRICE PROVIDER DEPLOYMENT *****");

    if (!uniswapV2PriceProviderLogicAddress) {
      uniswapV2PriceProvider = await deployer.deploy(UniswapV2PriceProvider, []);
      configs.UniswapV2PriceProviderLogic  = uniswapV2PriceProviderLogicAddress = uniswapV2PriceProvider.address;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`UniswapV2PriceProvider masterCopy was deployed at: ${uniswapV2PriceProviderLogicAddress}`);
    if (!uniswapV2PriceProviderAddress) {
      const uniswapV2PriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [uniswapV2PriceProviderLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.UniswapV2PriceProviderProxy = uniswapV2PriceProviderAddress = uniswapV2PriceProviderProxy.address;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`UniswapV2PriceProvider was deployed at: ${uniswapV2PriceProviderAddress}`);

    //====================== deploy lpPriceProvider =============================
    console.log();
    console.log("***** LP PRICE PROVIDER DEPLOYMENT *****");

    if (!lpPriceProviderLogicAddress) {
      lpPriceProvider = await deployer.deploy(LPPriceProvider, []);
      configs.LPPriceProviderLogic = lpPriceProviderLogicAddress = lpPriceProvider.address;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`lpPriceProvider masterCopy was deployed at: ${lpPriceProviderLogicAddress}`);
    if (!lpPriceProviderAddress) {
      const lpPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [lpPriceProviderLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.LPPriceProviderProxy = lpPriceProviderAddress = lpPriceProviderProxy.address;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`lpPriceProvider was deployed at: ${lpPriceProviderAddress}`);

    //====================== deploy wstETHProvider =============================
    console.log();
    console.log("***** WSTETH PRICE PROVIDER DEPLOYMENT *****");

    if (!wstETHPriceProviderLogicAddress) {
      wstETHPriceProvider = await deployer.deploy(WstETHPriceProvider, []);
      configs.wstETHPriceProviderLogic = wstETHPriceProviderLogicAddress = wstETHPriceProvider.address;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`wstETHPriceProvider masterCopy was deployed at: ${wstETHPriceProviderLogicAddress}`);
    if (!wstETHPriceProviderAddress) {
      const wstETHPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [wstETHPriceProviderLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.wstETHPriceProviderProxy = wstETHPriceProviderAddress = wstETHPriceProviderProxy.address;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`wstETHPriceProvider was deployed at: ${wstETHPriceProviderAddress}`);

    //====================== deploy PriceProviderAggregator =============================
    console.log();
    console.log("***** PRICE PROVIDER DEPLOYMENT *****");
    if (!priceProviderAggregatorLogicAddress) {
      priceProviderAggregator = await deployer.deploy(PriceProviderAggregator, []);
      configs.PriceProviderAggregatorLogic = priceProviderAggregatorLogicAddress = priceProviderAggregator.address;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`PriceProviderAggregator masterCopy was deployed at: ${priceProviderAggregatorLogicAddress}`);
    if (!priceProviderAggregatorAddress) {
      const usbPriceOracleProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [priceProviderAggregatorLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.PriceProviderAggregatorProxy = priceProviderAggregatorAddress = usbPriceOracleProxy.address;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`PriceProviderAggregator was deployed at: ${priceProviderAggregatorAddress}`);

    //====================== setting Params =============================
    chainlinkPriceProvider = new ethers.Contract(chainlinkPriceProviderAddress, chainlinkPriceProviderInterface, wallet);
    backendPriceProvider = new ethers.Contract(backendPriceProviderAddress, backendPriceProviderInterface, wallet);
    uniswapV2PriceProvider = new ethers.Contract(uniswapV2PriceProviderAddress, uniswapV2PriceProviderInterface, wallet);
    priceProviderAggregator = new ethers.Contract(priceProviderAggregatorAddress, priceProviderAggregatorInterface, wallet);
    wstETHPriceProvider = new ethers.Contract(wstETHPriceProviderAddress, wstETHPriceProviderInterface, wallet); 
    lpPriceProvider = new ethers.Contract(lpPriceProviderAddress, lpPriceProviderInterface, wallet);

    //====================== set chainlinkPriceProvider =============================
    console.log();
    console.log("***** set chainlinkPriceProvider *****");
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
    console.log();
    console.log("***** set backendPriceProvider *****");
    usdDecimal = await backendPriceProvider.getPriceDecimals();
    if (usdDecimal == 0) {
      await backendPriceProvider.initialize()
        .then(function (instance) {
          console.log("BackendPriceProvider " + backendPriceProviderAddress + " initialized at tx hash: " + instance.hash);
        });
        console.log(wallet.address);

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
    console.log();
    console.log("***** set uniswapV2PriceProvider *****");
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

    //==============================
    //set lpPriceProvider
    console.log();
    console.log("***** SETTING LP PRICE PROVIDER *****");

    usdDecimal = await lpPriceProvider.getPriceDecimals();

    if(usdDecimal == 0){
        await lpPriceProvider.initialize().then(function(instance){
            console.log("lpPriceProvider initialized at "+ lpPriceProviderAddress + " at tx hash " + instance.hash);
        });

        await lpPriceProvider.grandModerator(priceProviderAggregatorAddress).then(function(instance){
            console.log("lpPriceProvider granded moderator "+ priceProviderAggregatorAddress + " at tx hash " + instance.hash);
        });

        for (var i = 0; i < tokensUseLPProvider.length; i++) {
            await lpPriceProvider.setLPTokenAndProvider(tokensUseLPProvider[i], priceProviderAggregatorAddress).then(function(instance){
                console.log("LPPriceProvider  set token " + tokensUseLPProvider[i] + " and pair " + priceProviderAggregatorAddress + " at tx hash: " + instance.hash);
            });
        }
    }

    //==============================
    //set wstETHPriceProvider
    console.log();
    console.log("***** SETTING STETH PRICE PROVIDER *****");

    // usdDecimal = await wstETHPriceProvider.getPriceDecimals();

    // if(usdDecimal == 0){
    //     await wstETHPriceProvider.initialize(wstETH, wstETHAggregatorPath).then(function(instance){
    //         console.log("wstETHPriceProvider initialized at "+ wstETHPriceProviderAddress + " at tx hash " + instance.hash);
    //     });

    //     await wstETHPriceProvider.grandModerator(priceProviderAggregatorAddress).then(function(instance){
    //         console.log("wstETHPriceProvider granded moderator "+ priceProviderAggregatorAddress + " at tx hash " + instance.hash);
    //     });
    // }

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
      lpPriceProviderAddress : lpPriceProviderAddress,
      wstETHPriceProvider: wstETHPriceProviderAddress,
      priceProviderAggregatorAddress: priceProviderAggregatorAddress,
    }
    console.log(addresses);
  } catch (err) {
    console.log(err);
  } finally {
    fs.writeFileSync(path.resolve(__dirname, configFile), JSON.stringify(configs, null, 4));
  }
};
