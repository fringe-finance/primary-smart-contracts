require('dotenv').config();
const hre = require("hardhat");
const { Wallet, Provider } = require("zksync-web3");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const ethers = require("ethers");
const fs = require('fs');
const path = require('path');
const configGeneralFile = './config/config_general.json';
const configGeneral = require(configGeneralFile);
const configFile = './config/config.json';
let configs = require(configFile);
const verifyFilePath = path.join(__dirname, `./config/verify.json`);
const verifyFile = require(verifyFilePath);

let {
  PRIMARY_PROXY_ADMIN,
  ChainlinkPriceProviderLogic,
  ChainlinkPriceProviderProxy,
  BackendPriceProviderLogic,
  BackendPriceProviderProxy,
  UniswapV2PriceProviderLogic,
  UniswapV2PriceProviderProxy,
  UniswapV2PriceProviderMockLogic,
  UniswapV2PriceProviderMockProxy,
  PriceProviderAggregatorLogic,
  PriceProviderAggregatorProxy,
  LPPriceProviderLogic,
  LPPriceProviderProxy,
  wstETHPriceProviderLogic,
  wstETHPriceProviderProxy
} = configs;

const verify = async (address, constructorArguments, keyInConfig) => {
  console.log("Verifying " + address);
  if (!verifyFile[keyInConfig]) {
    await hre.run(`verify:verify`, {
      address,
      constructorArguments,
    });
    verifyFile[keyInConfig] = true;
    fs.writeFileSync(path.join(verifyFilePath), JSON.stringify(verifyFile, null, 2));
  }
  console.log("Verified " + address);
}

module.exports = async function () {
  try {
    const provider = new Provider('https://zksync2-testnet.zksync.dev');
    const ethProvider = ethers.getDefaultProvider("goerli");
    const mnemonic = process.env.MNEMONIC;
    let walletOperator = ethers.Wallet.fromMnemonic(mnemonic);
    let OPERATOR_PRIVATE_KEY = walletOperator.privateKey;
    // const wallet = new Wallet("0xe5fdde82360d1b2274901f3ebe49824d93a1303cd4ccea21d768565ed7440123").connect(provider);
    const wallet = new Wallet(OPERATOR_PRIVATE_KEY, provider, ethProvider);

    console.log("DeployMaster: " + wallet.address);
    const deployer = new Deployer(hre, wallet);
    const deployMasterAddress = wallet.address;

    //instances of contracts
    let proxyAdmin;
    let chainlinkPriceProvider;
    let backendPriceProvider;
    let uniswapV2PriceProvider;
    let uniswapV2PriceProviderMock;
    let priceProviderAggregator;
    let lpPriceProvider;
    let wstETHPriceProvider;

    //====================================================
    //initialize deploy parametrs
    const ProxyAdmin = await deployer.loadArtifact("ProxyAdmin");
    const TransparentUpgradeableProxy = await deployer.loadArtifact("TransparentUpgradeableProxy");
    const ChainlinkPriceProvider = await deployer.loadArtifact("ChainlinkPriceProvider");
    const BackendPriceProvider = await deployer.loadArtifact("BackendPriceProvider");
    const UniswapV2PriceProvider = await deployer.loadArtifact("UniswapV2PriceProvider");
    const UniswapV2PriceProviderMock = await deployer.loadArtifact("UniswapV2PriceProviderMock");
    const PriceProviderAggregator = await deployer.loadArtifact("PriceProviderAggregator");
    const LPPriceProvider = await deployer.loadArtifact("LPPriceProvider");
    const WstETHPriceProvider = await deployer.loadArtifact("wstETHPriceProvider");

    //interfaces of contracts
    let chainlinkPriceProviderInterface = new ethers.utils.Interface(ChainlinkPriceProvider.abi);
    let backendPriceProviderInterface = new ethers.utils.Interface(BackendPriceProvider.abi);
    let uniswapV2PriceProviderInterface = new ethers.utils.Interface(UniswapV2PriceProvider.abi);
    let uniswapV2PriceProviderMockInterface = new ethers.utils.Interface(UniswapV2PriceProviderMock.abi);
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
    let uniswapV2PriceProviderMockAddress = UniswapV2PriceProviderMockProxy;
    let lpPriceProviderAddress = LPPriceProviderProxy;
    let wstETHPriceProviderAddress = wstETHPriceProviderProxy;

    let backendPriceProviderLogicAddress = BackendPriceProviderLogic
    let chainlinkPriceProviderLogicAddress = ChainlinkPriceProviderLogic;
    let priceProviderAggregatorLogicAddress = PriceProviderAggregatorLogic;
    let uniswapV2PriceProviderLogicAddress = UniswapV2PriceProviderLogic;
    let uniswapV2PriceProviderMockLogicAddress = UniswapV2PriceProviderMockLogic;
    let lpPriceProviderLogicAddress = LPPriceProviderLogic;
    let wstETHPriceProviderLogicAddress = wstETHPriceProviderLogic;

    let tokensUseUniswap = priceOracle.tokensUseUniswap;
    let uniswapPairs = priceOracle.uniswapPairs;
    let tokensUseUniswapMock = priceOracle.tokensUseUniswapMock;
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
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`${ProxyAdmin.contractName} was deployed at: ${proxyAdminAddress}`);
    await verify(proxyAdminAddress, [], "PRIMARY_PROXY_ADMIN");

    //====================== deploy chainlinkPriceProvider =============================
    console.log();
    console.log("***** CHAINLINK PRICE PROVIDER DEPLOYMENT *****");
    if (!chainlinkPriceProviderLogicAddress) {
      chainlinkPriceProvider = await deployer.deploy(ChainlinkPriceProvider, []);
      configs.ChainlinkPriceProviderLogic = chainlinkPriceProviderLogicAddress = chainlinkPriceProvider.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`ChainlinkPriceProvider masterCopy was deployed at: ${chainlinkPriceProviderLogicAddress}`);
    await verify(chainlinkPriceProviderLogicAddress, [], "ChainlinkPriceProviderLogic");

    if (!chainlinkPriceProviderAddress) {
      const chainlinkPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [chainlinkPriceProviderLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.ChainlinkPriceProviderProxy = chainlinkPriceProviderAddress = chainlinkPriceProviderProxy.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`ChainlinkPriceProvider was deployed at: ${chainlinkPriceProviderAddress}`);
    await verify(chainlinkPriceProviderAddress, [
      chainlinkPriceProviderLogicAddress,
      proxyAdminAddress,
      "0x"
    ], "ChainlinkPriceProviderProxy");

    //====================== deploy backendPriceProvider =============================
    console.log();
    console.log("***** BACKEND PRICE PROVIDER DEPLOYMENT *****");

    // if exist backendPriceProvider, then we need to get interface of it
    if (!backendPriceProviderLogicAddress) {
      backendPriceProvider = await deployer.deploy(BackendPriceProvider, []);
      configs.BackendPriceProviderLogic = backendPriceProviderLogicAddress = backendPriceProvider.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`BackendPriceProvider masterCopy was deployed at: ${backendPriceProviderLogicAddress}`);
    await verify(backendPriceProviderLogicAddress, [], "BackendPriceProviderLogic");

    if (!backendPriceProviderAddress) {
      const backendPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [backendPriceProviderLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.BackendPriceProviderProxy = backendPriceProviderAddress = backendPriceProviderProxy.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`BackendPriceProvider was deployed at: ${backendPriceProviderAddress}`);
    await verify(backendPriceProviderAddress, [
      backendPriceProviderLogicAddress,
      proxyAdminAddress,
      "0x"
    ], "BackendPriceProviderProxy");

    //====================== deploy uniswapV2PriceProvider =============================
    console.log();
    console.log("***** UNISWAPV2 PRICE PROVIDER DEPLOYMENT *****");

    if (!uniswapV2PriceProviderLogicAddress) {
      uniswapV2PriceProvider = await deployer.deploy(UniswapV2PriceProvider, []);
      configs.UniswapV2PriceProviderLogic = uniswapV2PriceProviderLogicAddress = uniswapV2PriceProvider.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`UniswapV2PriceProvider masterCopy was deployed at: ${uniswapV2PriceProviderLogicAddress}`);
    await verify(uniswapV2PriceProviderLogicAddress, [], "UniswapV2PriceProviderLogic");

    if (!uniswapV2PriceProviderAddress) {
      const uniswapV2PriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [uniswapV2PriceProviderLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.UniswapV2PriceProviderProxy = uniswapV2PriceProviderAddress = uniswapV2PriceProviderProxy.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`UniswapV2PriceProvider was deployed at: ${uniswapV2PriceProviderAddress}`);
    await verify(uniswapV2PriceProviderAddress, [
      uniswapV2PriceProviderLogicAddress,
      proxyAdminAddress,
      "0x"
    ], "UniswapV2PriceProviderProxy");

    //====================== deploy uniswapV2PriceProviderMock =============================
    console.log();
    console.log("***** UNISWAPV2 PRICE PROVIDER MOCK DEPLOYMENT *****");

    if (!uniswapV2PriceProviderMockLogicAddress) {
      uniswapV2PriceProviderMock = await deployer.deploy(UniswapV2PriceProviderMock, []);
      configs.UniswapV2PriceProviderMockLogic = uniswapV2PriceProviderMockLogicAddress = uniswapV2PriceProviderMock.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`UniswapV2PriceProviderMock masterCopy was deployed at: ${uniswapV2PriceProviderMockLogicAddress}`);
    await verify(uniswapV2PriceProviderMockLogicAddress, [], "UniswapV2PriceProviderMockLogic");

    if (!uniswapV2PriceProviderMockAddress) {
      const uniswapV2PriceProviderMockProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [uniswapV2PriceProviderMockLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.UniswapV2PriceProviderMockProxy = uniswapV2PriceProviderMockAddress = uniswapV2PriceProviderMockProxy.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`UniswapV2PriceProviderMock was deployed at: ${uniswapV2PriceProviderMockAddress}`);
    await verify(uniswapV2PriceProviderMockAddress, [
      uniswapV2PriceProviderMockLogicAddress,
      proxyAdminAddress,
      "0x"
    ], "UniswapV2PriceProviderMockProxy");

    //====================== deploy lpPriceProvider =============================
    console.log();
    console.log("***** LP PRICE PROVIDER DEPLOYMENT *****");

    if (!lpPriceProviderLogicAddress) {
      lpPriceProvider = await deployer.deploy(LPPriceProvider, []);
      configs.LPPriceProviderLogic = lpPriceProviderLogicAddress = lpPriceProvider.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`lpPriceProvider masterCopy was deployed at: ${lpPriceProviderLogicAddress}`);
    await verify(lpPriceProviderLogicAddress, [], "LPPriceProviderLogic");

    if (!lpPriceProviderAddress) {
      const lpPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [lpPriceProviderLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.LPPriceProviderProxy = lpPriceProviderAddress = lpPriceProviderProxy.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`lpPriceProvider was deployed at: ${lpPriceProviderAddress}`);
    await verify(lpPriceProviderAddress, [
      lpPriceProviderLogicAddress,
      proxyAdminAddress,
      "0x"
    ], "LPPriceProviderProxy");

    //====================== deploy wstETHProvider =============================
    console.log();
    console.log("***** WSTETH PRICE PROVIDER DEPLOYMENT *****");

    if (!wstETHPriceProviderLogicAddress) {
      wstETHPriceProvider = await deployer.deploy(WstETHPriceProvider, []);
      configs.wstETHPriceProviderLogic = wstETHPriceProviderLogicAddress = wstETHPriceProvider.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`wstETHPriceProvider masterCopy was deployed at: ${wstETHPriceProviderLogicAddress}`);
    await verify(wstETHPriceProviderLogicAddress, [], "wstETHPriceProviderLogic");

    if (!wstETHPriceProviderAddress) {
      const wstETHPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [wstETHPriceProviderLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.wstETHPriceProviderProxy = wstETHPriceProviderAddress = wstETHPriceProviderProxy.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`wstETHPriceProvider was deployed at: ${wstETHPriceProviderAddress}`);
    await verify(wstETHPriceProviderAddress, [
      wstETHPriceProviderLogicAddress,
      proxyAdminAddress,
      "0x"
    ], "wstETHPriceProviderProxy")

    //====================== deploy PriceProviderAggregator =============================
    console.log();
    console.log("***** PRICE PROVIDER DEPLOYMENT *****");
    if (!priceProviderAggregatorLogicAddress) {
      priceProviderAggregator = await deployer.deploy(PriceProviderAggregator, []);
      configs.PriceProviderAggregatorLogic = priceProviderAggregatorLogicAddress = priceProviderAggregator.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`PriceProviderAggregator masterCopy was deployed at: ${priceProviderAggregatorLogicAddress}`);
    await verify(priceProviderAggregatorLogicAddress, [], "PriceProviderAggregatorLogic");

    if (!priceProviderAggregatorAddress) {
      const usbPriceOracleProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [priceProviderAggregatorLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.PriceProviderAggregatorProxy = priceProviderAggregatorAddress = usbPriceOracleProxy.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`PriceProviderAggregator was deployed at: ${priceProviderAggregatorAddress}`);
    await verify(priceProviderAggregatorAddress, [
      priceProviderAggregatorLogicAddress,
      proxyAdminAddress,
      "0x"
    ], "PriceProviderAggregatorProxy");

    //====================== setting Params =============================
    chainlinkPriceProvider = new ethers.Contract(chainlinkPriceProviderAddress, chainlinkPriceProviderInterface, wallet);
    backendPriceProvider = new ethers.Contract(backendPriceProviderAddress, backendPriceProviderInterface, wallet);
    uniswapV2PriceProvider = new ethers.Contract(uniswapV2PriceProviderAddress, uniswapV2PriceProviderInterface, wallet);
    uniswapV2PriceProviderMock = new ethers.Contract(uniswapV2PriceProviderMockAddress, uniswapV2PriceProviderMockInterface, wallet);
    priceProviderAggregator = new ethers.Contract(priceProviderAggregatorAddress, priceProviderAggregatorInterface, wallet);
    wstETHPriceProvider = new ethers.Contract(wstETHPriceProviderAddress, wstETHPriceProviderInterface, wallet);
    lpPriceProvider = new ethers.Contract(lpPriceProviderAddress, lpPriceProviderInterface, wallet);

    //====================== set chainlinkPriceProvider =============================
    console.log();
    console.log("***** SETTING CHAINLINK PRICE PROVIDER *****");
    {
      let usdDecimal = await chainlinkPriceProvider.usdDecimals();
      if (usdDecimal == 0) {
        await chainlinkPriceProvider.initialize()
          .then(function (instance) {
            console.log("\nTransaction hash: " + instance.hash)
            console.log("ChainlinkPriceProvider initialized at " + chainlinkPriceProviderAddress);
          });
      }
    }

    {
      let moderatorRole = await chainlinkPriceProvider.MODERATOR_ROLE();
      let isModeratorRole = await chainlinkPriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
      if (!isModeratorRole) {
        await chainlinkPriceProvider.grandModerator(priceProviderAggregatorAddress)
          .then(function (instance) {
            console.log("\nTransaction hash: " + instance.hash)
            console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " granded moderator " + priceProviderAggregatorAddress);
          });
      }
    }

    for (var i = 0; i < tokensUseChainlink.length; i++) {
      let chainlinkMetadata = await chainlinkPriceProvider.chainlinkMetadata(tokensUseChainlink[i]);
      if (chainlinkMetadata.isActive == false) {
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
    console.log("***** SETTING BACKEND PRICE PROVIDER *****");
    {
      let usdDecimal = await backendPriceProvider.usdDecimals();
      if (usdDecimal == 0) {
        await backendPriceProvider.initialize()
          .then(function (instance) {
            console.log("BackendPriceProvider " + backendPriceProviderAddress + " initialized at tx hash: " + instance.hash);
          });
      }
    }

    {
      let moderatorRole = await backendPriceProvider.TRUSTED_BACKEND_ROLE();
      let isModeratorRole = await backendPriceProvider.hasRole(moderatorRole, wallet.address);
      if (!isModeratorRole) {
        await backendPriceProvider.grandTrustedBackendRole(wallet.address)
          .then(function (instance) {
            console.log("BackendPriceProvider " + backendPriceProvider.address + " set trusted backend " + wallet.address + " at tx hash: " + instance.hash);
          });
      }
    }

    //====================== set uniswapV2PriceProvider =============================
    console.log();
    console.log("***** SETTING UNISWAPV2 PRICE PROVIDER *****");
    {
      let usdDecimal = await uniswapV2PriceProvider.getPriceDecimals();
      if (usdDecimal == 0) {
        await uniswapV2PriceProvider.initialize().then(function (instance) {
          console.log("UniswapV2PriceProvider initialized at " + uniswapV2PriceProviderAddress + " at tx hash " + instance.hash);
        });
      }
    }

    {
      let moderatorRole = await uniswapV2PriceProvider.MODERATOR_ROLE();
      let isModeratorRole = await uniswapV2PriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
      if (!isModeratorRole) {
        await uniswapV2PriceProvider.grandModerator(priceProviderAggregatorAddress).then(function (instance) {
          console.log("UniswapV2PriceProvider granded moderator " + priceProviderAggregatorAddress + " at tx hash " + instance.hash);
        });
      }
    }

    for (var i = 0; i < tokensUseUniswap.length; i++) {
      let uniswapV2Metadata = await uniswapV2PriceProvider.uniswapV2Metadata(tokensUseUniswap[i]);
      if (uniswapV2Metadata.isActive == false || uniswapV2Metadata.pair != uniswapPairs[i]) {
        await uniswapV2PriceProvider.setTokenAndPair(tokensUseUniswap[i], uniswapPairs[i]).then(function (instance) {
          console.log("UniswapV2PriceProvider  set token " + tokensUseUniswap[i] + " and pair " + uniswapPairs[i] + " at tx hash: " + instance.hash);
        });
      }
    }

    //====================== set uniswapV2PriceProviderMock =============================
    console.log();
    console.log("***** SETTING UNISWAPV2 PRICE PROVIDER MOCK *****");
    {
      let usdDecimal = await uniswapV2PriceProviderMock.getPriceDecimals();
      if (usdDecimal == 0) {
        await uniswapV2PriceProviderMock.initialize().then(function (instance) {
          console.log("UniswapV2PriceProviderMock initialized at " + uniswapV2PriceProviderMockAddress + " at tx hash " + instance.hash);
        });
      }
    }

    {
      let moderatorRole = await uniswapV2PriceProviderMock.MODERATOR_ROLE();
      let isModeratorRole = await uniswapV2PriceProviderMock.hasRole(moderatorRole, priceProviderAggregatorAddress);
      if (!isModeratorRole) {
        await uniswapV2PriceProviderMock.grandModerator(priceProviderAggregatorAddress).then(function (instance) {
          console.log("UniswapV2PriceProviderMock granded moderator " + priceProviderAggregatorAddress + " at tx hash " + instance.hash);
        });
      }
    }

    for (var i = 0; i < tokensUseUniswapMock.length; i++) {
      let uniswapV2Metadata = await uniswapV2PriceProviderMock.tokenPrice(tokensUseUniswapMock[i]);
      if (uniswapV2Metadata.price != uniswapPrices[i]) {
        await uniswapV2PriceProviderMock.setTokenAndPrice(tokensUseUniswapMock[i], uniswapPrices[i]).then(function (instance) {
          console.log("UniswapV2PriceProviderMock set token " + tokensUseUniswapMock[i] + " and price " + uniswapPrices[i] + " at tx hash: " + instance.hash);
        });
      }
    }

    //==============================
    //set lpPriceProvider
    console.log();
    console.log("***** SETTING LP PRICE PROVIDER *****");

    {
      let usdDecimal = await lpPriceProvider.getPriceDecimals();

      if (usdDecimal == 0) {
        await lpPriceProvider.initialize().then(function (instance) {
          console.log("lpPriceProvider initialized at " + lpPriceProviderAddress + " at tx hash " + instance.hash);
        });
      }
    }

    {
      let moderatorRole = await lpPriceProvider.MODERATOR_ROLE();
      let isModeratorRole = await lpPriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
      if (!isModeratorRole) {
        await lpPriceProvider.grandModerator(priceProviderAggregatorAddress).then(function (instance) {
          console.log("lpPriceProvider granded moderator " + priceProviderAggregatorAddress + " at tx hash " + instance.hash);
        });
      }
    }

    for (var i = 0; i < tokensUseLPProvider.length; i++) {
      let lpMetadata = await lpPriceProvider.lpMetadata(tokensUseLPProvider[i]);
      if (lpMetadata.isActive == false || lpMetadata.base != priceProviderAggregatorAddress) {
        await lpPriceProvider.setLPTokenAndProvider(tokensUseLPProvider[i], priceProviderAggregatorAddress).then(function (instance) {
          console.log("LPPriceProvider  set token " + tokensUseLPProvider[i] + " and pair " + priceProviderAggregatorAddress + " at tx hash: " + instance.hash);
        });
      }
    }

    //==============================
    //set wstETHPriceProvider
    // console.log();
    // console.log("***** SETTING WSTETH PRICE PROVIDER *****");
    // {
    //   let usdDecimal = await wstETHPriceProvider.getPriceDecimals();
    //   if (usdDecimal == 0) {
    //     await wstETHPriceProvider.initialize(wstETH, wstETHAggregatorPath).then(function (instance) {
    //       console.log("wstETHPriceProvider initialized at " + wstETHPriceProviderAddress + " at tx hash " + instance.hash);
    //     });
    //   }
    // }

    // {
    //   let moderatorRole = await wstETHPriceProvider.MODERATOR_ROLE();
    //   let isModeratorRole = await wstETHPriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
    //   if (!isModeratorRole) {
    //     await wstETHPriceProvider.grandModerator(priceProviderAggregatorAddress).then(function (instance) {
    //       console.log("wstETHPriceProvider granded moderator " + priceProviderAggregatorAddress + " at tx hash " + instance.hash);
    //     });
    //   }
    // }

    //====================== set priceProviderAggregator =============================
    console.log();
    console.log("***** SETTING USB PRICE ORACLE *****");
    {
      let usdDecimal = await priceProviderAggregator.usdDecimals();
      if (usdDecimal == 0) {
        await priceProviderAggregator.initialize().then(function (instance) {
          console.log("PriceProviderAggregator initialized at " + priceProviderAggregatorAddress + " at tx hash: " + instance.hash);
        });
      }
    }

    {
      let moderatorRole = await priceProviderAggregator.MODERATOR_ROLE();
      let isModeratorRole = await priceProviderAggregator.hasRole(moderatorRole, deployMasterAddress);
      if (!isModeratorRole) {
        await priceProviderAggregator.grandModerator(deployMasterAddress).then(function (instance) {
          console.log("PriceProviderAggregator " + priceProviderAggregator.address + " granded moderator " + deployMasterAddress + " at tx hash: " + instance.hash);
        });
      }
    }

    for (var i = 0; i < tokensUseChainlink.length; i++) {
      let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseChainlink[i]);
      if (tokenPriceProvider.priceProvider != chainlinkPriceProviderAddress) {
        await priceProviderAggregator.setTokenAndPriceProvider(tokensUseChainlink[i], chainlinkPriceProviderAddress, false).then(function (instance) {
          console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseChainlink[i] + " with priceOracle " + chainlinkPriceProviderAddress + " at tx hash: " + instance.hash);
        });
      }
    }

    for (var i = 0; i < tokensUseUniswap.length; i++) {
      let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseUniswap[i]);
      if (tokenPriceProvider.priceProvider != uniswapV2PriceProviderAddress) {
        await priceProviderAggregator.setTokenAndPriceProvider(tokensUseUniswap[i], uniswapV2PriceProviderAddress, false).then(function (instance) {
          console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseUniswap[i] + " with priceOracle " + uniswapV2PriceProviderAddress + " at tx hash: " + instance.hash);
        });
      }
    }

    for (var i = 0; i < tokensUseUniswapMock.length; i++) {
      let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseUniswapMock[i]);
      if (tokenPriceProvider.priceProvider != uniswapV2PriceProviderMockAddress) {
        await priceProviderAggregator.setTokenAndPriceProvider(tokensUseUniswapMock[i], uniswapV2PriceProviderMockAddress, false).then(function (instance) {
          console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseUniswapMock[i] + " with priceOracle " + uniswapV2PriceProviderMockAddress + " at tx hash: " + instance.hash);
        });
      }
    }

    for (var i = 0; i < tokensUseLPProvider.length; i++) {
      let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseLPProvider[i]);
      if (tokenPriceProvider.priceProvider != lpPriceProviderAddress) {
        await priceProviderAggregator.setTokenAndPriceProvider(tokensUseLPProvider[i], lpPriceProviderAddress, false).then(function (instance) {
          console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseLPProvider[i] + " with priceOracle " + lpPriceProviderAddress + " at tx hash: " + instance.hash);
        });
      }
    }

    // let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(wstETH);
    // if (tokenPriceProvider.priceProvider != wstETHPriceProviderAddress) {
    //   await priceProviderAggregator.setTokenAndPriceProvider(wstETH, wstETHPriceProviderAddress, false).then(function (instance) {
    //     console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + wstETH + " with priceOracle " + wstETHPriceProviderAddress + " at tx hash: " + instance.hash);
    //   });
    // }

    let addresses = {
      proxyAdminAddress: proxyAdminAddress,
      chainlinkPriceProviderAddress: chainlinkPriceProviderAddress,
      backendPriceProviderAddress: backendPriceProviderAddress,
      uniswapV2PriceProviderAddress: uniswapV2PriceProviderAddress,
      uniswapV2PriceProviderMockAddress: uniswapV2PriceProviderMockAddress,
      lpPriceProviderAddress: lpPriceProviderAddress,
      // wstETHPriceProvider: wstETHPriceProviderAddress,
      priceProviderAggregatorAddress: priceProviderAggregatorAddress,
    }
    console.log(addresses);
  } catch (err) {
    console.log(err);
  } finally {
    fs.writeFileSync(path.resolve(__dirname, configFile), JSON.stringify(configs, null, 4));
  }
};
