require('dotenv').config();
const { Wallet, Provider, utils } = require("zksync-web3");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const ethers = require("ethers");
const fs = require('fs');
const path = require("path");
const configGeneralFile = './config/config_general.json';
const configGeneral = require(configGeneralFile);
const configFile = './config/config.json';
let configs = require(configFile);
const verifyFilePath = path.join(__dirname, `./config/verify.json`);
const verifyFile = require(verifyFilePath);

let {
  PRIMARY_PROXY_ADMIN,
  PriceProviderAggregatorProxy,
  BondtrollerLogic,
  BondtrollerProxy,
  BLendingTokenLogic,
  BLendingTokenProxies,
  PrimaryIndexTokenLogic,
  PrimaryIndexTokenProxy,
  JumpRateModelLogic,
  JumpRateModelProxy,
  PrimaryIndexTokenAtomicRepaymentLogic,
  PrimaryIndexTokenAtomicRepaymentProxy,
  PrimaryIndexTokenLiquidationLogic,
  PrimaryIndexTokenLiquidationProxy,
  PrimaryIndexTokenLeverageLogic,
  PrimaryIndexTokenLeverageProxy,
  PrimaryIndexTokenModeratorLogic,
  PrimaryIndexTokenModeratorProxy,
  PrimaryIndexTokenWrappedTokenGatewayLogic,
  PrimaryIndexTokenWrappedTokenGatewayProxy,
  ZERO_ADDRESS
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
    const mnemonic = process.env.MNEMONIC;
    let walletOperator = ethers.Wallet.fromMnemonic(mnemonic);
    let OPERATOR_PRIVATE_KEY = walletOperator.privateKey;
    const wallet = new Wallet(OPERATOR_PRIVATE_KEY).connect(provider);
    const deployer = new Deployer(hre, wallet);
    const deployMasterAddress = wallet.address;

    //instances of contracts
    let jumpRateModel;
    let bondtroller;
    let blending;
    let pit;
    let pitAtomicRepayment;
    let pitLiquidation;
    let pitLeverage;
    let pitModerator;
    let pitWrappedTokenGateway;

    //====================================================
    //initialize deploy parametrs
    let ProxyAdmin = await deployer.loadArtifact("ProxyAdmin");
    let TransparentUpgradeableProxy = await deployer.loadArtifact("TransparentUpgradeableProxy");
    let JumpRateModel = await deployer.loadArtifact("JumpRateModelV3");
    let Bondtroller = await deployer.loadArtifact("Bondtroller");
    let BLendingToken = await deployer.loadArtifact("BLendingToken");
    let PrimaryIndexToken = await deployer.loadArtifact("PrimaryIndexToken");
    let PrimaryIndexTokenAtomicRepayment = await deployer.loadArtifact("PrimaryIndexTokenAtomicRepayment");
    let PrimaryIndexTokenLiquidation = await deployer.loadArtifact("PrimaryIndexTokenLiquidation");
    let PrimaryIndexTokenLeverage = await deployer.loadArtifact("PrimaryIndexTokenLeverage");
    let PrimaryIndexTokenModerator = await deployer.loadArtifact("PrimaryIndexTokenModerator");
    let PrimaryIndexTokenWrappedTokenGateway = await deployer.loadArtifact("PrimaryIndexTokenWrappedTokenGateway");

    //interfaces of contracts
    let bondtrollerInterface = new ethers.utils.Interface(Bondtroller.abi);
    let jumpRateModelInterface = new ethers.utils.Interface(JumpRateModel.abi);
    let pitInterface = new ethers.utils.Interface(PrimaryIndexToken.abi);
    let blendingInterface = new ethers.utils.Interface(BLendingToken.abi);
    let pitAtomicRepaymentInterface = new ethers.utils.Interface(PrimaryIndexTokenAtomicRepayment.abi);
    let pitLiquidationInterface = new ethers.utils.Interface(PrimaryIndexTokenLiquidation.abi);
    let pitLeverageInterface = new ethers.utils.Interface(PrimaryIndexTokenLeverage.abi);
    let pitModeratorInterface = new ethers.utils.Interface(PrimaryIndexTokenModerator.abi);
    let pitWrappedTokenGatewayInterface = new ethers.utils.Interface(PrimaryIndexTokenWrappedTokenGateway.abi);


    const {
      priceOracle,
      blendingToken,
      jumRateModel,
      pitLiquidationParams,
      pitModeratorParams,
      pitAtomicRepaymentParams,
    } = configGeneral;

    //Address
    let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
    let blendingTokenLogicAddress = BLendingTokenLogic;
    let blendingTokenProxyAddresses = BLendingTokenProxies;

    let bondtrollerLogicAddress = BondtrollerLogic;
    let bondtrollerProxyAddress = BondtrollerProxy;

    let jumpRateModelLogicAddress = JumpRateModelLogic;
    let jumpRateModelProxyAddress = JumpRateModelProxy;

    let primaryIndexTokenLogicAddress = PrimaryIndexTokenLogic;
    let primaryIndexTokenProxyAddress = PrimaryIndexTokenProxy;

    let atomicRepaymentLogicAddress = PrimaryIndexTokenAtomicRepaymentLogic;
    let atomicRepaymentProxyAddress = PrimaryIndexTokenAtomicRepaymentProxy;

    let liquidationLogicAddress = PrimaryIndexTokenLiquidationLogic;
    let liquidationProxyAddress = PrimaryIndexTokenLiquidationProxy;

    let leverageLogicAddress = PrimaryIndexTokenLeverageLogic;
    let leverageProxyAddress = PrimaryIndexTokenLeverageProxy;

    let primaryIndexTokenModeratorLogicAddress = PrimaryIndexTokenModeratorLogic;
    let primaryIndexTokenModeratorProxyAddress = PrimaryIndexTokenModeratorProxy;

    let primaryIndexTokenWrappedTokenGatewayLogicAddress = PrimaryIndexTokenWrappedTokenGatewayLogic;
    let primaryIndexTokenWrappedTokenGatewayProxyAddress = PrimaryIndexTokenWrappedTokenGatewayProxy;

    let gainPerYear = jumRateModel.gainPerYear;
    let jumGainPerYear = jumRateModel.jumGainPerYear;
    let targetUtil = jumRateModel.targetUtil;
    let newMaxBorrow = jumRateModel.newMaxBorrow;
    let blocksPerYear = jumRateModel.blocksPerYear;

    //config 
    let lendingTokens = blendingToken.lendingTokens;
    let initialExchangeRateMantissa = blendingToken.initialExchangeRateMantissa;
    let reserveFactorMantissa = blendingToken.reserveFactorMantissa;
    let name = blendingToken.name;
    let symbol = blendingToken.symbol;
    let decimals = blendingToken.decimals;
    let loanToValueRatioNumeratorLendingToken = blendingToken.loanToValueRatioNumerator;
    let loanToValueRatioDenominatorLendingToken = blendingToken.loanToValueRatioDenominator;

    let tokens = pitModeratorParams.tokens;
    let borrowLimitPerCollateral = pitModeratorParams.borrowLimitPerCollateral;
    let borrowLimitPerLendingToken = pitModeratorParams.borrowLimitPerLendingToken;
    let loanToValueRatioNumerator = pitModeratorParams.loanToValueRatioNumerator;
    let loanToValueRatioDenominator = pitModeratorParams.loanToValueRatioDenominator;
    let liquidationTresholdFactorNumerator = pitModeratorParams.liquidationTresholdFactorNumerator;
    let liquidationTresholdFactorDenominator = pitModeratorParams.liquidationTresholdFactorDenominator;
    let liquidationIncentiveNumerator = pitModeratorParams.liquidationIncentiveNumerator;
    let liquidationIncentiveDenominator = pitModeratorParams.liquidationIncentiveDenominator;
    let isPaused = pitModeratorParams.isPaused;
    let usdc = pitModeratorParams.usdc;

    let minPA = pitLiquidationParams.minPA;
    let maxLRFNumerator = pitLiquidationParams.maxLRFNumerator;
    let maxLRFDenominator = pitLiquidationParams.maxLRFDenominator;
    let rewardCalcFactorNumerator = pitLiquidationParams.rewardCalcFactorNumerator;
    let rewardCalcFactorDenominator = pitLiquidationParams.rewardCalcFactorDenominator;
    let targetHFNumerator = pitLiquidationParams.targetHFNumerator;
    let targetHFDenominator = pitLiquidationParams.targetHFDenominator;

    let augustusParaswap = pitAtomicRepaymentParams.augustusParaswap;
    let AUGUSTUS_REGISTRY = pitAtomicRepaymentParams.AUGUSTUS_REGISTRY;

    let WETH = priceOracle.WETH;

    //====================== deploy proxy admin =============================
    console.log();
    console.log("***** PROXY ADMIN DEPLOYMENT *****");
    if (!proxyAdminAddress) {
      const proxyAdmin = await deployer.deploy(ProxyAdmin, []);
      configs.PRIMARY_PROXY_ADMIN = proxyAdminAddress = proxyAdmin.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`${ProxyAdmin.contractName} was deployed at: ${proxyAdminAddress}`);
    await verify(proxyAdminAddress, [], "PRIMARY_PROXY_ADMIN");

    //====================== deploy Bondtroller =============================
    console.log();
    console.log("***** BONDTROLLER DEPLOYMENT *****");
    if (!bondtrollerLogicAddress) {
      bondtroller = await deployer.deploy(Bondtroller, []);
      configs.BondtrollerLogic = bondtrollerLogicAddress = bondtroller.address;
    }
    console.log(`Bondtroller masterCopy was deployed at: ${bondtrollerLogicAddress}`);
    await verify(bondtrollerLogicAddress, [], "BondtrollerLogic");

    if (!bondtrollerProxyAddress) {
      const bondtrollerProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [bondtrollerLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.BondtrollerProxy = bondtrollerProxyAddress = bondtrollerProxy.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`Bondtroller was deployed at: ${bondtrollerProxyAddress}`);
    await verify(bondtrollerProxyAddress, [
      bondtrollerLogicAddress,
      proxyAdminAddress,
      "0x"
    ], "BondtrollerProxy");

    //====================== deploy JumpRateModel =============================
    console.log();
    console.log("***** JUMP RATE MODEL DEPLOYMENT *****");
    if (!jumpRateModelLogicAddress) {
      jumpRateModel = await deployer.deploy(JumpRateModel, []);
      configs.JumpRateModelLogic = jumpRateModelLogicAddress = jumpRateModel.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`JumpRateModel masterCopy was deployed at: ${jumpRateModelLogicAddress}`);
    await verify(jumpRateModelLogicAddress, [], "JumpRateModelLogic");

    if (!jumpRateModelProxyAddress) {
      const jumpRateModelProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [jumpRateModelLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.JumpRateModelProxy = jumpRateModelProxyAddress = jumpRateModelProxy.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`JumpRateModel was deployed at: ${jumpRateModelProxyAddress}`);
    await verify(jumpRateModelProxyAddress, [
      jumpRateModelLogicAddress,
      proxyAdminAddress,
      "0x"
    ], "JumpRateModelProxy");

    // //====================== deploy BLendingToken =============================
    console.log();
    console.log("***** BLENDING TOKEN DEPLOYMENT *****");
    if (!blendingTokenLogicAddress) {
      blending = await deployer.deploy(BLendingToken, []);
      configs.BLendingTokenLogic = blendingTokenLogicAddress = blending.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`BLendingToken masterCopy was deployed at: ${blendingTokenLogicAddress}`);
    await verify(blendingTokenLogicAddress, [], "BLendingTokenLogic");

    for (var i = 0; i < lendingTokens.length; i++) {
      if (blendingTokenProxyAddresses.length < lendingTokens.length) {
        let blendingProxy = await deployer.deploy(TransparentUpgradeableProxy,
          [blendingTokenLogicAddress, proxyAdminAddress, "0x"]
        );
        blendingTokenProxyAddresses.push(blendingProxy.address);
      }
    }
    configs.BLendingTokenProxies = blendingTokenProxyAddresses;
    fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    console.log("BLendingToken proxy address: " + blendingTokenProxyAddresses);
    await verify(blendingTokenProxyAddresses[0], [
      blendingTokenLogicAddress,
      proxyAdminAddress,
      "0x"
    ], "BLendingTokenProxies");

    // ====================== deploy PrimaryIndexToken =============================
    console.log();
    console.log("***** PRIMARY INDEX TOKEN DEPLOYMENT *****");
    if (!primaryIndexTokenLogicAddress) {
      pit = await deployer.deploy(PrimaryIndexToken, []);
      configs.PrimaryIndexTokenLogic = primaryIndexTokenLogicAddress = pit.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`PrimaryIndexToken masterCopy was deployed at: ${primaryIndexTokenLogicAddress}`);
    await verify(primaryIndexTokenLogicAddress, [], "PrimaryIndexTokenLogic");

    if (!primaryIndexTokenProxyAddress) {
      const pitProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [primaryIndexTokenLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.PrimaryIndexTokenProxy = primaryIndexTokenProxyAddress = pitProxy.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`PrimaryIndexToken was deployed at: ${primaryIndexTokenProxyAddress}`);
    await verify(primaryIndexTokenProxyAddress, [
      primaryIndexTokenLogicAddress,
      proxyAdminAddress,
      "0x"
    ], "PrimaryIndexTokenProxy");

    // ====================== deploy PrimaryIndexTokenModerator =============================
    console.log();
    console.log("***** PRIMARY INDEX TOKEN MODERATOR DEPLOYMENT *****");
    if (!primaryIndexTokenModeratorLogicAddress) {
      pitModerator = await deployer.deploy(PrimaryIndexTokenModerator, []);
      configs.PrimaryIndexTokenModeratorLogic = primaryIndexTokenModeratorLogicAddress = pitModerator.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`PrimaryIndexTokenModerator masterCopy was deployed at: ${primaryIndexTokenModeratorLogicAddress}`);
    await verify(primaryIndexTokenModeratorLogicAddress, [], "PrimaryIndexTokenModeratorLogic");

    if (!primaryIndexTokenModeratorProxyAddress) {
      const pitModeratorProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [primaryIndexTokenModeratorLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.PrimaryIndexTokenModeratorProxy = primaryIndexTokenModeratorProxyAddress = pitModeratorProxy.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`PrimaryIndexTokenModerator was deployed at: ${primaryIndexTokenModeratorProxyAddress}`);
    await verify(primaryIndexTokenModeratorProxyAddress, [
      primaryIndexTokenModeratorLogicAddress,
      proxyAdminAddress,
      "0x"
    ], "PrimaryIndexTokenModeratorProxy");

    // ====================== deploy PrimaryIndexToken Atomic repayment =============================
    console.log();
    console.log("***** PrimaryIndexTokenAtomicRepayment DEPLOYMENT *****");
    if (!atomicRepaymentLogicAddress) {
      pitAtomicRepayment = await deployer.deploy(PrimaryIndexTokenAtomicRepayment, []);
      configs.PrimaryIndexTokenAtomicRepaymentLogic = atomicRepaymentLogicAddress = pitAtomicRepayment.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`PrimaryIndexToken masterCopy was deployed at: ${atomicRepaymentLogicAddress}`);
    await verify(atomicRepaymentLogicAddress, [], "PrimaryIndexTokenAtomicRepaymentLogic");

    if (!atomicRepaymentProxyAddress) {
      const pitAtomicProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [atomicRepaymentLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.PrimaryIndexTokenAtomicRepaymentProxy = atomicRepaymentProxyAddress = pitAtomicProxy.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`PrimaryIndexToken atomic repayment was deployed at: ${atomicRepaymentProxyAddress}`);
    await verify(atomicRepaymentProxyAddress, [
      atomicRepaymentLogicAddress,
      proxyAdminAddress,
      "0x"
    ], "PrimaryIndexTokenAtomicRepaymentProxy");

    // ====================== deploy PrimaryIndexToken liquidation =============================
    console.log();
    console.log("***** PrimaryIndexTokenLiquidation DEPLOYMENT *****")
    if (!liquidationLogicAddress) {
      pitLiquidation = await deployer.deploy(PrimaryIndexTokenLiquidation, []);
      configs.PrimaryIndexTokenLiquidationLogic = liquidationLogicAddress = pitLiquidation.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`PrimaryIndexToken liquidation masterCopy was deployed at: ${liquidationLogicAddress}`);
    await verify(liquidationLogicAddress, [], "PrimaryIndexTokenLiquidationLogic");

    if (!liquidationProxyAddress) {
      const pitLiquidationProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [liquidationLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.PrimaryIndexTokenLiquidationProxy = liquidationProxyAddress = pitLiquidationProxy.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`PrimaryIndexToken liquidation was deployed at: ${liquidationProxyAddress}`);
    await verify(liquidationProxyAddress, [
      liquidationLogicAddress,
      proxyAdminAddress,
      "0x"
    ], "PrimaryIndexTokenLiquidationProxy");

    // ====================== deploy PrimaryIndexToken leverage =============================
    console.log();
    console.log("***** PrimaryIndexTokenLeverage DEPLOYMENT *****");
    if (!leverageLogicAddress) {
      pitLeverage = await deployer.deploy(PrimaryIndexTokenLeverage, []);
      configs.PrimaryIndexTokenLeverageLogic = leverageLogicAddress = pitLeverage.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`PrimaryIndexToken leverage masterCopy was deployed at: ${leverageLogicAddress}`);
    await verify(leverageLogicAddress, [], "PrimaryIndexTokenLeverageLogic");

    if (!leverageProxyAddress) {
      const pitLeverageProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [leverageLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.PrimaryIndexTokenLeverageProxy = leverageProxyAddress = pitLeverageProxy.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`PrimaryIndexToken leverage was deployed at: ${leverageProxyAddress}`);
    await verify(leverageProxyAddress, [
      leverageLogicAddress,
      proxyAdminAddress,
      "0x"
    ], "PrimaryIndexTokenLeverageProxy");

    // ====================== deploy PrimaryIndexTokenWrappedTokenGateway =============================
    console.log();
    console.log("***** PrimaryIndexTokenWrappedTokenGateway DEPLOYMENT *****");
    if (!primaryIndexTokenWrappedTokenGatewayLogicAddress) {
      pitWrappedTokenGateway = await deployer.deploy(PrimaryIndexTokenWrappedTokenGateway, []);
      configs.PrimaryIndexTokenWrappedTokenGatewayLogic = primaryIndexTokenWrappedTokenGatewayLogicAddress = pitWrappedTokenGateway.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`PrimaryIndexTokenWrappedTokenGateway leverage masterCopy was deployed at: ${primaryIndexTokenWrappedTokenGatewayLogicAddress}`);
    await verify(PrimaryIndexTokenWrappedTokenGatewayLogic, [], "PrimaryIndexTokenWrappedTokenGatewayLogic");

    if (!primaryIndexTokenWrappedTokenGatewayProxyAddress) {
      const pitWrappedTokenGatewayProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [primaryIndexTokenWrappedTokenGatewayLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.PrimaryIndexTokenWrappedTokenGatewayProxy = primaryIndexTokenWrappedTokenGatewayLogicAddress = pitWrappedTokenGatewayProxy.address;
      fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(configs, null, 2));
    }
    console.log(`PrimaryIndexTokenWrappedTokenGateway leverage was deployed at: ${primaryIndexTokenWrappedTokenGatewayLogicAddress}`);
    await verify(PrimaryIndexTokenWrappedTokenGatewayProxy, [
      primaryIndexTokenWrappedTokenGatewayLogicAddress,
      proxyAdminAddress,
      "0x"
    ], "PrimaryIndexTokenWrappedTokenGatewayProxy");

    //====================== setting Params =============================
    bondtroller = new ethers.Contract(bondtrollerProxyAddress, bondtrollerInterface, wallet);
    jumpRateModel = new ethers.Contract(jumpRateModelProxyAddress, jumpRateModelInterface, wallet);
    pit = new ethers.Contract(primaryIndexTokenProxyAddress, pitInterface, wallet);
    pitAtomicRepayment = new ethers.Contract(atomicRepaymentProxyAddress, pitAtomicRepaymentInterface, wallet);
    pitLiquidation = new ethers.Contract(liquidationProxyAddress, pitLiquidationInterface, wallet);
    pitLeverage = new ethers.Contract(leverageProxyAddress, pitLeverageInterface, wallet);
    pitModerator = new ethers.Contract(primaryIndexTokenModeratorProxyAddress, pitModeratorInterface, wallet);
    pitWrappedTokenGateway = new ethers.Contract(primaryIndexTokenWrappedTokenGatewayLogicAddress, pitWrappedTokenGatewayInterface, wallet);


    console.log();
    console.log("***** 1. Setting Bondtroller *****");
    let adminBondtroller = await bondtroller.admin();
    if (adminBondtroller == ZERO_ADDRESS) {
      await bondtroller.init().then(function (instance) {
        console.log("Bondtroller " + bondtroller.address + "call init at tx hash: " + instance.hash);
      });
    }

    {
      let primaryIndexTokenAddress = await bondtroller.getPrimaryIndexTokenAddress();
      if (primaryIndexTokenAddress != primaryIndexTokenProxyAddress) {
        await bondtroller.setPrimaryIndexTokenAddress(primaryIndexTokenProxyAddress).then(function () {
          console.log("Bondtroller set PIT " + primaryIndexTokenProxyAddress);
        });
      }
    }

    {
      let allMarkets = await bondtroller.getAllMarkets();
      for (var i = 0; i < blendingTokenProxyAddresses.length; i++) {
        if (allMarkets.indexOf(blendingTokenProxyAddresses[i]) == -1) {
          await bondtroller.supportMarket(blendingTokenProxyAddresses[i]).then(function () {
            console.log("Bondtroller support market " + blendingTokenProxyAddresses[i]);
          });
        }
      }
    }

    console.log();
    console.log("***** 2. Setting JumRateModel *****");

    let MODERATOR_ROLE = await jumpRateModel.MODERATOR_ROLE();
    let isMODERATOR = await jumpRateModel.hasRole(MODERATOR_ROLE, deployMasterAddress);
    if (!isMODERATOR) {
      await jumpRateModel.initialize(blocksPerYear).then(function (instance) {
        console.log("JumpRateModel " + jumpRateModelProxyAddress + " call initialize at tx hash " + instance.hash);
      })
    }

    for (var i = 0; i < BLendingTokenProxies.length; i++) {
      let blendingTokenInfo = await jumpRateModel.blendingTokenInfo(BLendingTokenProxies[i]);
      let rateInfo = await jumpRateModel.rateInfo(BLendingTokenProxies[i]);
      let blocksPerYear = await jumpRateModel.blocksPerYear();

      let blocksPerYearValue = ethers.BigNumber.from(blocksPerYear.toString());
      let gainPerYearValue = ethers.BigNumber.from(gainPerYear[i].toString());
      let jumGainPerYearValue = ethers.BigNumber.from(jumGainPerYear[i].toString());

      let gainPerBlock = gainPerYearValue.div(blocksPerYearValue);
      let jumGainPerBlock = jumGainPerYearValue.div(blocksPerYearValue);

      if (blendingTokenInfo.targetUtil != targetUtil[i] || rateInfo.maxBorrowRate != newMaxBorrow[i] || gainPerBlock.toString() != blendingTokenInfo.gainPerBlock || jumGainPerBlock.toString() != blendingTokenInfo.jumGainPerBlock) {
        await jumpRateModel.addBLendingTokenSuport(BLendingTokenProxies[i], gainPerYear[i], jumGainPerYear[i], targetUtil[i], newMaxBorrow[i]).then(function (instance) {
          console.log("JumpRateModel " + jumpRateModelProxyAddress + " add BLendingToken Suport " + BLendingTokenProxies[i] + " with params: " + gainPerYear[i] + ", " + jumGainPerYear[i] + ", " + targetUtil[i] + " at tx hash " + instance.hash);
        })
      }
    }

    console.log();
    console.log("***** 3. Setting BLending token *****");

    for (let i = 0; i < lendingTokens.length; i++) {
      blending = new ethers.Contract(blendingTokenProxyAddresses[i], blendingInterface, wallet);
      let adminBlendingToken = await blending.admin();
      if (adminBlendingToken == ZERO_ADDRESS) {
        let admin = wallet.address;
        await blending.init(
          lendingTokens[i],
          bondtrollerProxyAddress,
          jumpRateModelProxyAddress,
          initialExchangeRateMantissa[i],
          name[i],
          symbol[i],
          decimals[i],
          admin
        ).then(function () {
          console.log("blending call init at " + blending.address);
        });
      }
      {
        let pitAddress = await blending.primaryIndexToken();
        if (pitAddress != primaryIndexTokenProxyAddress) {
          await blending.setPrimaryIndexToken(primaryIndexTokenProxyAddress).then(function () {
            console.log("blending " + blending.address + " set primaryIndexToken " + primaryIndexTokenProxyAddress);
          });
        }
      }
    }

    console.log();
    console.log("***** 4. Setting PIT token *****");
    let namePit = await pit.name();
    if (!namePit) {
      await pit.initialize()
        .then(function () {
          console.log("PrimaryIndexToken call initialize at " + pit.address)
        });
    }

    {
      let pitModerator = await pit.primaryIndexTokenModerator();
      if (pitModerator != primaryIndexTokenModeratorProxyAddress) {
        await pit.setPrimaryIndexTokenModerator(primaryIndexTokenModeratorProxyAddress)
          .then(function () {
            console.log("PrimaryIndexToken set moderator contract: " + primaryIndexTokenModeratorProxyAddress);
          });
      }
    }

    console.log();
    console.log("***** 5. Setting PIT Moderator token *****");
    let primaryIndexToken = await pitModerator.primaryIndexToken();
    if (primaryIndexToken == ZERO_ADDRESS) {
      await pitModerator.initialize(primaryIndexTokenProxyAddress)
        .then(function () {
          console.log("PrimaryIndexToken call initialize at " + pitModerator.address)
        });
    }
    {
      let priceOracle = await pit.priceOracle();
      if (priceOracle != PriceProviderAggregatorProxy) {
        await pitModerator.setPriceOracle(PriceProviderAggregatorProxy).then(function () {
          console.log("PrimaryIndexToken set priceOracle: " + PriceProviderAggregatorProxy);
        });
      }
    }
    {
      let usdcToken = await pit.usdcToken();
      if (usdcToken != usdc) {
        await pitModerator.setUSDCToken(usdc).then(function () {
          console.log("PrimaryIndexToken set usdc: " + usdc);
        });
      }
    }

    for (var i = 0; i < tokens.length; i++) {
      let projectTokenInfo = await pit.projectTokenInfo(tokens[i]);
      if (projectTokenInfo.isListed == false
        || projectTokenInfo.loanToValueRatio.numerator != loanToValueRatioNumerator[i]
        || projectTokenInfo.loanToValueRatio.denominator != loanToValueRatioDenominator[i]
        || projectTokenInfo.liquidationThresholdFactor.numerator != liquidationTresholdFactorNumerator[i]
        || projectTokenInfo.liquidationThresholdFactor.denominator != liquidationTresholdFactorDenominator[i]
        || projectTokenInfo.liquidationIncentive.numerator != liquidationIncentiveNumerator[i]
        || projectTokenInfo.liquidationIncentive.denominator != liquidationIncentiveDenominator[i]
      ) {
        await pitModerator.addProjectToken(
          tokens[i],
          loanToValueRatioNumerator[i],
          loanToValueRatioDenominator[i],
          liquidationTresholdFactorNumerator[i],
          liquidationTresholdFactorDenominator[i],
          liquidationIncentiveNumerator[i],
          liquidationIncentiveDenominator[i],
        ).then(function () {
          console.log("Added prj token: " + tokens[i] + " with:");
          console.log("LoanToValueRatio: ")
          console.log("   Numerator:   " + loanToValueRatioNumerator[i]);
          console.log("   Denominator: " + loanToValueRatioDenominator[i]);
          console.log("LiquidationTresholdFactor: ")
          console.log("   Numerator:   " + liquidationTresholdFactorNumerator[i]);
          console.log("   Denominator: " + liquidationTresholdFactorDenominator[i]);
          console.log("LiquidationIncentive: ");
          console.log("   Numerator:   " + liquidationIncentiveNumerator[i]);
          console.log("   Denominator: " + liquidationIncentiveDenominator[i]);
        });
      }
    }

    for (var i = 0; i < lendingTokens.length; i++) {
      let lendingTokenInfo = await pit.lendingTokenInfo(lendingTokens[i]);
      let lendingTokenLoanToValueRatio = await pit.lendingTokenLoanToValueRatio(lendingTokens[i]);
      if (lendingTokenInfo.isListed == false
        || lendingTokenInfo.isPaused != isPaused
        || lendingTokenInfo.bLendingToken != blendingTokenProxyAddresses[i]
        || lendingTokenLoanToValueRatio.numerator != loanToValueRatioNumeratorLendingToken[i]
        || lendingTokenLoanToValueRatio.denominator != loanToValueRatioDenominatorLendingToken[i]
      )
        await pitModerator.addLendingToken(
          lendingTokens[i],
          blendingTokenProxyAddresses[i],
          isPaused,
          loanToValueRatioNumeratorLendingToken[i],
          loanToValueRatioDenominatorLendingToken[i],
        ).then(function () {
          console.log("Added lending token: " + lendingTokens[i]);
          console.log("LoanToValueRatio: ")
          console.log("   Numerator:   " + loanToValueRatioNumeratorLendingToken[i]);
          console.log("   Denominator: " + loanToValueRatioDenominatorLendingToken[i]);
        });
    }

    for (var i = 0; i < tokens.length; i++) {
      let borrowLimitPerCollateralValue = await pit.borrowLimitPerCollateral(tokens[i]);
      if (borrowLimitPerCollateralValue.toString() != borrowLimitPerCollateral[i]) {
        await pitModerator.setBorrowLimitPerCollateral(
          tokens[i],
          borrowLimitPerCollateral[i]
        ).then(function () {
          console.log("PrimaryIndexToken set " + tokens[i] + " borrow limit " + borrowLimitPerCollateral[i]);
        });
      }
    }

    for (var i = 0; i < lendingTokens.length; i++) {
      let borrowLimitPerLendingTokenValue = await pit.borrowLimitPerLendingToken(lendingTokens[i]);
      if (borrowLimitPerLendingTokenValue.toString() != borrowLimitPerLendingToken[i]) {
        await pitModerator.setBorrowLimitPerLendingAsset(
          lendingTokens[i],
          borrowLimitPerLendingToken[i]
        ).then(function () {
          console.log("PrimaryIndexToken set " + lendingTokens[i] + " borrow limit " + borrowLimitPerLendingToken[i]);
        });
      }
    }

    {
      let primaryIndexTokenLeverage = await pit.primaryIndexTokenLeverage();
      if (primaryIndexTokenLeverage != leverageProxyAddress) {
        await pitModerator.setPrimaryIndexTokenLeverage(leverageProxyAddress).then(function () {
          console.log("PrimaryIndexToken set Leverage contract " + leverageProxyAddress);
        })
      }
    }

    {
      let isRelatedContract = await pit.getRelatedContract(atomicRepaymentProxyAddress);
      if (isRelatedContract == false) {
        await pitModerator.addRelatedContracts(atomicRepaymentProxyAddress).then(function () {
          console.log("PrimaryIndexToken set role for atomic repayment contract " + atomicRepaymentProxyAddress);
        })
      }
    }

    {
      let isRelatedContract = await pit.getRelatedContract(liquidationProxyAddress);
      if (isRelatedContract == false) {
        await pitModerator.addRelatedContracts(liquidationProxyAddress).then(function () {
          console.log("PrimaryIndexToken set role for liquidation contract " + liquidationProxyAddress);
        })
      }
    }

    {
      let isRelatedContract = await pit.getRelatedContract(leverageProxyAddress);
      if (isRelatedContract == false) {
        await pitModerator.addRelatedContracts(leverageProxyAddress).then(function () {
          console.log("PrimaryIndexToken set role for Leverage contract " + leverageProxyAddress);
        })
      }
    }

    {
      let isRelatedContract = await pit.getRelatedContract(primaryIndexTokenWrappedTokenGatewayProxyAddress);
      if (isRelatedContract == false) {
        await pitModerator.addRelatedContracts(primaryIndexTokenWrappedTokenGatewayProxyAddress).then(function () {
          console.log("PrimaryIndexToken set role for Wrapped Token Gateway contract " + primaryIndexTokenWrappedTokenGatewayProxyAddress);
        })
      }
    }

    console.log();
    console.log("***** 6. Setting PIT Liquidation *****");
    let moderatorRoleLiquidation = await pitLiquidation.MODERATOR_ROLE();
    let isModeratorLiquidation = await pitLiquidation.hasRole(moderatorRoleLiquidation, deployMasterAddress);
    if (!isModeratorLiquidation) {
      await pitLiquidation.initialize(primaryIndexTokenProxyAddress)
        .then(function () {
          console.log("PrimaryIndexTokenLiquidation call initialize at " + pitLiquidation.address)
        });
    }

    {
      let minPartialLiquidationAmount = await pitLiquidation.minPartialLiquidationAmount();
      if (minPartialLiquidationAmount != minPA) {
        await pitLiquidation.setMinPartialLiquidationAmount(minPA).then(function () {
          console.log("PrimaryIndexTokenLiquidation set minPA " + minPA);
        })
      }
    }

    {
      let maxLRF = await pitLiquidation.maxLRF();
      if (maxLRF.numerator != maxLRFNumerator || maxLRF.denominator != maxLRFDenominator) {
        await pitLiquidation.setMaxLRF(maxLRFNumerator, maxLRFDenominator).then(function () {
          console.log("PrimaryIndexTokenLiquidation set maxLRF " + maxLRFNumerator + "/" + maxLRFDenominator);
        })
      }
    }

    {
      let liquidatorRewardCalcFactor = await pitLiquidation.liquidatorRewardCalcFactor();
      if (liquidatorRewardCalcFactor.numerator != rewardCalcFactorNumerator || liquidatorRewardCalcFactor.denominator != rewardCalcFactorDenominator) {
        await pitLiquidation.setLiquidatorRewardCalculationFactor(rewardCalcFactorNumerator, rewardCalcFactorDenominator).then(function () {
          console.log("PrimaryIndexTokenLiquidation set rewardCalcFactor " + rewardCalcFactorNumerator + "/" + rewardCalcFactorDenominator);
        })
      }
    }

    {
      let targetHealthFactor = await pitLiquidation.targetHealthFactor();
      if (targetHealthFactor.numerator != targetHFNumerator || targetHealthFactor.denominator != targetHFDenominator) {
        await pitLiquidation.setTargetHealthFactor(targetHFNumerator, targetHFDenominator).then(function () {
          console.log("PrimaryIndexTokenLiquidation set targetHF " + targetHFNumerator + "/" + targetHFDenominator);
        })
      }
    }

    console.log();
    console.log("***** 7. Setting PIT atomic repayment *****");
    let moderatorRoleAtomic = await pitAtomicRepayment.MODERATOR_ROLE();
    let isModeratorAtomic = await pitAtomicRepayment.hasRole(moderatorRoleAtomic, deployMasterAddress);
    if (!isModeratorAtomic) {
      await pitAtomicRepayment.initialize(primaryIndexTokenProxyAddress, augustusParaswap, AUGUSTUS_REGISTRY)
        .then(function () {
          console.log("PrimaryIndexTokenAtomicRepayment call initialize at " + pitAtomicRepayment.address)
        });
    }

    console.log();
    console.log("***** 8. Setting PIT leverage *****");
    let moderatorRoleLeverage = await pitLeverage.MODERATOR_ROLE();
    let isModeratorLeverage = await pitLeverage.hasRole(moderatorRoleLeverage, deployMasterAddress);
    if (!isModeratorLeverage) {
      await pitLeverage.initialize(primaryIndexTokenProxyAddress, augustusParaswap, AUGUSTUS_REGISTRY)
        .then(function () {
          console.log("PrimaryIndexTokenLeverage call initialize at " + pitLeverage.address)
        });
    }

    console.log();
    console.log("***** 9. Setting PIT Wrapped Token Gateway *****");
    let moderatorRoleWrappedTokenGateway = await pitWrappedTokenGateway.MODERATOR_ROLE();
    let isModeratorWrappedTokenGateway = await pitWrappedTokenGateway.hasRole(moderatorRoleWrappedTokenGateway, deployMasterAddress);
    if (!isModeratorWrappedTokenGateway) {
      await pitWrappedTokenGateway.initialize(primaryIndexTokenProxyAddress, WETH, liquidationProxyAddress, leverageProxyAddress)
        .then(function () {
          console.log("PrimaryIndexTokenWrappedTokenGateway call initialize at " + pitWrappedTokenGateway.address)
        });
    }


    let addresses = {
      bondtrollerAddress: bondtrollerProxyAddress,
      jumpRateModelAddress: jumpRateModelProxyAddress,
      blendingAddress: blendingTokenProxyAddresses,
      pitAddress: primaryIndexTokenProxyAddress,
      pitLiquidationAddress: liquidationProxyAddress,
      pitAtomicRepaymentAddress: atomicRepaymentProxyAddress,
      pitLeverageAddress: leverageProxyAddress,
      pitModerator: primaryIndexTokenModeratorProxyAddress,
      pitWrappedTokenGateway: primaryIndexTokenWrappedTokenGatewayProxyAddress
    }
    console.log(addresses);
  } catch (err) {
    console.log(err);
  }
};
