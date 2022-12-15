require('dotenv').config();
const { Wallet, Provider, utils } = require("zksync-web3");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const ethers = require("ethers");
const fs = require('fs');
const path = require("path");
const configGeneralFile = './configs/config_general.json';
const configGeneral = require(configGeneralFile);
const configFile = './configs/configs.json';
let configs = require(configFile);
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
  ZERO_ADDRESS
} = configs;

module.exports = async function () {
  try {
    const provider = new Provider('https://zksync2-testnet.zksync.dev');
    const wallet = new Wallet(process.env.OPERATOR_PRIVATE_KEY).connect(provider);
    const deployer = new Deployer(hre, wallet);

    //instances of contracts
    let jumpRateModelV2;
    let bondtroller;
    let blending;
    let pit;

    //====================================================
    //initialize deploy parametrs
    let ProxyAdmin = await deployer.loadArtifact("ProxyAdmin");
    let TransparentUpgradeableProxy = await deployer.loadArtifact("TransparentUpgradeableProxy");
    let JumpRateModelV2 = await deployer.loadArtifact("JumpRateModelV2Upgradeable");
    let Bondtroller = await deployer.loadArtifact("Bondtroller");
    let BLendingToken = await deployer.loadArtifact("BLendingToken");
    let PrimaryIndexToken = await deployer.loadArtifact("PrimaryIndexToken");

    //interfaces of contracts
    let bondtrollerInterface = new ethers.utils.Interface(Bondtroller.abi);
    let jumpRateModelV2Interface = new ethers.utils.Interface(JumpRateModelV2.abi);
    let pitInterface = new ethers.utils.Interface(PrimaryIndexToken.abi);


    const {
      pitToken,
      blendingToken,
      jumRateModel
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

    let kink = jumRateModel.kink;
    let baseRatePerYear = jumRateModel.baseRatePerYear;
    let multiplierPerYear = jumRateModel.multiplierPerYear;
    let jumpMultiplierPerYear = jumRateModel.jumpMultiplierPerYear;

    //config 
    let lendingTokens = blendingToken.lendingTokens;
    let initialExchangeRateMantissa = blendingToken.initialExchangeRateMantissa;
    let reserveFactorMantissa = blendingToken.reserveFactorMantissa;
    let name = blendingToken.name;
    let symbol = blendingToken.symbol;
    let decimals = blendingToken.decimals;

    let tokens = pitToken.tokens;
    let borrowLimitPerCollateral = pitToken.borrowLimitPerCollateral;
    let borrowLimitPerLendingToken = pitToken.borrowLimitPerLendingToken;
    let loanToValueRatioNumerator = pitToken.loanToValueRatioNumerator;
    let loanToValueRatioDenominator = pitToken.loanToValueRatioDenominator;
    let liquidationTresholdFactorNumerator = pitToken.liquidationTresholdFactorNumerator;
    let liquidationTresholdFactorDenominator = pitToken.liquidationTresholdFactorDenominator;
    let liquidationIncentiveNumerator = pitToken.liquidationIncentiveNumerator;
    let liquidationIncentiveDenominator = pitToken.liquidationIncentiveDenominator;
    let isPaused = pitToken.isPaused;

    //====================== deploy proxy admin =============================
    if (!proxyAdminAddress) {
      const proxyAdmin = await deployer.deploy(ProxyAdmin, []);
      configs.PRIMARY_PROXY_ADMIN = proxyAdminAddress = proxyAdmin.address;
    }
    console.log(`${ProxyAdmin.contractName} was deployed at: ${proxyAdminAddress}`);

    //====================== deploy JumpRateModel =============================
    if (!jumpRateModelLogicAddress) {
      jumpRateModelV2 = await deployer.deploy(JumpRateModelV2, []);
      configs.JumpRateModelLogic = jumpRateModelLogicAddress = jumpRateModelV2.address;
    }
    console.log(`JumpRateModel masterCopy was deployed at: ${jumpRateModelLogicAddress}`);
    if (!jumpRateModelProxyAddress) {
      const jumpRateModelProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [jumpRateModelLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.JumpRateModelProxy = jumpRateModelProxyAddress = jumpRateModelProxy.address;
    }
    console.log(`JumpRateModel was deployed at: ${jumpRateModelProxyAddress}`);

    //====================== deploy Bondtroller =============================
    if (!bondtrollerLogicAddress) {
      bondtroller = await deployer.deploy(Bondtroller, []);
      configs.BondtrollerLogic = bondtrollerLogicAddress = bondtroller.address;
    }
    console.log(`Bondtroller masterCopy was deployed at: ${bondtrollerLogicAddress}`);
    if (!bondtrollerProxyAddress) {
      const bondtrollerProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [bondtrollerLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.BondtrollerProxy = bondtrollerProxyAddress = bondtrollerProxy.address;
    }
    console.log(`Bondtroller was deployed at: ${bondtrollerProxyAddress}`);

    // //====================== deploy BLendingToken =============================
    if (!blendingTokenLogicAddress) {
      blending = await deployer.deploy(BLendingToken, []);
      configs.BLendingTokenLogic = blendingTokenLogicAddress = blending.address;
    }
    console.log(`BLendingToken masterCopy was deployed at: ${blendingTokenLogicAddress}`);
    for (var i = 0; i < lendingTokens.length; i++) {
      if (blendingTokenProxyAddresses.length < lendingTokens.length) {
        let blendingProxy = await deployer.deploy(TransparentUpgradeableProxy,
          [blendingTokenLogicAddress, proxyAdminAddress, "0x"]
        );
        blendingTokenProxyAddresses.push(blendingProxy.address);
      }
    }
    configs.BLendingTokenProxies = blendingTokenProxyAddresses;
    console.log("BLendingToken proxy address: " + blendingTokenProxyAddresses);

    // ====================== deploy PrimaryIndexToken =============================
    if (!primaryIndexTokenLogicAddress) {
      pit = await deployer.deploy(PrimaryIndexToken, []);
      configs.PrimaryIndexTokenLogic = primaryIndexTokenLogicAddress = pit.address;
    }
    console.log(`PrimaryIndexToken masterCopy was deployed at: ${primaryIndexTokenLogicAddress}`);
    if (!primaryIndexTokenProxyAddress) {
      const pitProxy = await deployer.deploy(TransparentUpgradeableProxy,
        [primaryIndexTokenLogicAddress, proxyAdminAddress, "0x"]
      );
      configs.PrimaryIndexTokenProxy = primaryIndexTokenProxyAddress = pitProxy.address;
    }
    console.log(`PrimaryIndexToken was deployed at: ${primaryIndexTokenProxyAddress}`);

    //====================== setting Params =============================
    bondtroller = new ethers.Contract(bondtrollerProxyAddress, bondtrollerInterface, wallet);
    jumpRateModelV2 = new ethers.Contract(jumpRateModelProxyAddress, jumpRateModelV2Interface, wallet);
    pit = new ethers.Contract(primaryIndexTokenProxyAddress, pitInterface, wallet);

    console.log();
    console.log("***** 1. Setting Bondtroller *****");
    let adminBondtroller = await bondtroller.admin();
    if (adminBondtroller == ZERO_ADDRESS) {
      await bondtroller.init().then(function (instance) {
        console.log("Bondtroller " + bondtroller.address + "call init at tx hash: " + instance.hash);
      });
      await bondtroller.setPrimaryIndexTokenAddress(primaryIndexTokenProxyAddress).then(function () {
        console.log("Bondtroller set PIT " + primaryIndexTokenProxyAddress);
      });
      for (var i = 0; i < blendingTokenProxyAddresses.length; i++) {
        await bondtroller.supportMarket(blendingTokenProxyAddresses[i]).then(function () {
          console.log("Bondtroller support market " + blendingTokenProxyAddresses[i]);
        });
      }
    }

    console.log();
    console.log("***** 2. Setting JumRateModel *****");

    let ownerJumRateModel = await jumpRateModelV2.owner();
    if (ownerJumRateModel == ZERO_ADDRESS) {
      await jumpRateModelV2.initialize(
        baseRatePerYear,
        multiplierPerYear,
        jumpMultiplierPerYear,
        kink,
        wallet.address
      ).then(function (instance) {
        console.log("JumRateModel " + bondtroller.address + " call init at tx hash: " + instance.hash);
      });
    }

    console.log();
    console.log("***** 3. Setting BLending token *****");

    for (var i = 0; i < lendingTokens.length; i++) {
      blending = new ethers.Contract(blendingTokenProxyAddresses[i], blending.interface, wallet);
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

        await blending.setReserveFactor(reserveFactorMantissa[i]).then(function () {
          console.log("blending set reserve factor " + reserveFactorMantissa[i]);
        });

        await blending.setPrimaryIndexToken(primaryIndexTokenProxyAddress).then(function () {
          console.log("blending " + blending.address + " set primaryIndexToken " + primaryIndexTokenProxyAddress);
        });
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

      await pit.setPriceOracle(PriceProviderAggregatorProxy).then(function () {
        console.log("PrimaryIndexToken set priceOracle: " + PriceProviderAggregatorProxy);
      });

      for (var i = 0; i < tokens.length; i++) {
        await pit.addProjectToken(
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

      for (var i = 0; i < lendingTokens.length; i++) {
        await pit.addLendingToken(
          lendingTokens[i],
          blendingTokenProxyAddresses[i],
          isPaused
        ).then(function () {
          console.log("Added lending token: " + lendingTokens[i]);
        });

      }

      for (var i = 0; i < tokens.length; i++) {
        await pit.setBorrowLimitPerCollateral(
          tokens[i],
          borrowLimitPerCollateral[i]
        ).then(function () {
          console.log("PrimaryIndexToken set " + tokens[i] + " borrow limit " + borrowLimitPerCollateral[i]);
        });
      }

      for (var i = 0; i < lendingTokens.length; i++) {
        await pit.setBorrowLimitPerLendingAsset(
          lendingTokens[i],
          borrowLimitPerLendingToken[i]
        ).then(function () {
          console.log("PrimaryIndexToken set " + lendingTokens[i] + " borrow limit " + borrowLimitPerLendingToken[i]);
        });
      }
    }

    let addresses = {
      bondtrollerAddress: bondtrollerProxyAddress,
      blendingAddress: blendingTokenProxyAddresses,
      pitAddress: primaryIndexTokenProxyAddress
    }
    console.log(addresses);
  } catch (err) {
    console.log(err);
  } finally {
    fs.writeFileSync(path.resolve(__dirname, configFile), JSON.stringify(configs, null, 2));
  }
};
