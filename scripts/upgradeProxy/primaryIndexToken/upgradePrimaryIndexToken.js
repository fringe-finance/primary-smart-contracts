const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, `../../config/${network}/config.json`);
const config = require(configFile);

async function main() {
    const {
      PRIMARY_PROXY_ADMIN,
      PrimaryIndexTokenLogic,
      PrimaryIndexTokenProxy,
      PrimaryIndexTokenAtomicRepaymentLogic,
      PrimaryIndexTokenAtomicRepaymentProxy,
      PrimaryIndexTokenLiquidationLogic,
      PrimaryIndexTokenLiquidationProxy,
      PrimaryIndexTokenModeratorLogic,
      PrimaryIndexTokenModeratorProxy,
      PrimaryIndexTokenWrappedTokenGatewayLogic,
      PrimaryIndexTokenWrappedTokenGatewayProxy,
      PrimaryIndexTokenLeverageLogic,
      PrimaryIndexTokenLeverageProxy,
    } = config;

    let proxyAdminAddress = PRIMARY_PROXY_ADMIN;

    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
    let proxyAdmin = await ProxyAdmin.attach(proxyAdminAddress).connect(deployMaster);

    console.log("process.env.APPEND_UPGRADE: ",process.env.APPEND_UPGRADE);
    if(process.env.APPEND_UPGRADE == 'true') {
      // PIT
      await proxyAdmin
        .appendUpgrade(
          PrimaryIndexTokenProxy,
          PrimaryIndexTokenLogic
        )
        .then(function (instance) {
          console.log("PIT:");
          console.log(
            "ProxyAdmin appendUpgrade " +
              PrimaryIndexTokenProxy +
              " to " +
              PrimaryIndexTokenLogic
          );
          return instance;
        });
      
      // Atomic
      await proxyAdmin
        .appendUpgrade(
          PrimaryIndexTokenAtomicRepaymentProxy,
          PrimaryIndexTokenAtomicRepaymentLogic
        )
        .then(function (instance) {
          console.log("Atomic:");
          console.log(
            "ProxyAdmin appendUpgrade " +
              PrimaryIndexTokenAtomicRepaymentProxy +
              " to " +
              PrimaryIndexTokenAtomicRepaymentLogic
          );
          return instance;
        });

      //Liquidation
      await proxyAdmin
        .appendUpgrade(
          PrimaryIndexTokenLiquidationProxy,
          PrimaryIndexTokenLiquidationLogic
        )
        .then(function (instance) {
          console.log("Liquidation:");
          console.log(
            "ProxyAdmin appendUpgrade " +
              PrimaryIndexTokenLiquidationProxy +
              " to " +
              PrimaryIndexTokenLiquidationLogic
          );
          return instance;
        });

      // Moderator
      await proxyAdmin
        .appendUpgrade(
          PrimaryIndexTokenModeratorProxy,
          PrimaryIndexTokenModeratorLogic
        )
        .then(function (instance) {
          console.log("Moderator:");
          console.log(
            "ProxyAdmin appendUpgrade " +
              PrimaryIndexTokenModeratorProxy +
              " to " +
              PrimaryIndexTokenModeratorLogic
          );
          return instance;
        });

      // WTG
      await proxyAdmin
        .appendUpgrade(
          PrimaryIndexTokenWrappedTokenGatewayProxy,
          PrimaryIndexTokenWrappedTokenGatewayLogic
        )
        .then(function (instance) {
          console.log("WTG:");
          console.log(
            "ProxyAdmin appendUpgrade " +
              PrimaryIndexTokenWrappedTokenGatewayProxy +
              " to " +
              PrimaryIndexTokenWrappedTokenGatewayLogic
          );
          return instance;
        });

      //Leverage
      await proxyAdmin
        .appendUpgrade(
          PrimaryIndexTokenLeverageProxy,
          PrimaryIndexTokenLeverageLogic
        )
        .then(function (instance) {
          console.log("Leverage:");
          console.log(
            "ProxyAdmin appendUpgrade " +
              PrimaryIndexTokenLeverageProxy +
              " to " +
              PrimaryIndexTokenLeverageLogic
          );
          return instance;
        });
    } else {
      // PIT
      await proxyAdmin
        .upgrade(
          PrimaryIndexTokenProxy,
          PrimaryIndexTokenLogic
        )
        .then(function (instance) {
          console.log("PIT:");
          console.log(
            "ProxyAdmin upgrade " +
              PrimaryIndexTokenProxy +
              " to " +
              PrimaryIndexTokenLogic
          );
          return instance;
        });
      
      // Atomic
      await proxyAdmin
        .upgrade(
          PrimaryIndexTokenAtomicRepaymentProxy,
          PrimaryIndexTokenAtomicRepaymentLogic
        )
        .then(function (instance) {
          console.log("Atomic:");
          console.log(
            "ProxyAdmin upgrade " +
              PrimaryIndexTokenAtomicRepaymentProxy +
              " to " +
              PrimaryIndexTokenAtomicRepaymentLogic
          );
          return instance;
        });

      //Liquidation
      await proxyAdmin
        .upgrade(
          PrimaryIndexTokenLiquidationProxy,
          PrimaryIndexTokenLiquidationLogic
        )
        .then(function (instance) {
          console.log("Liquidation:");
          console.log(
            "ProxyAdmin upgrade " +
              PrimaryIndexTokenLiquidationProxy +
              " to " +
              PrimaryIndexTokenLiquidationLogic
          );
          return instance;
        });

      // Moderator
      await proxyAdmin
        .upgrade(
          PrimaryIndexTokenModeratorProxy,
          PrimaryIndexTokenModeratorLogic
        )
        .then(function (instance) {
          console.log("Moderator:");
          console.log(
            "ProxyAdmin upgrade " +
              PrimaryIndexTokenModeratorProxy +
              " to " +
              PrimaryIndexTokenModeratorLogic
          );
          return instance;
        });

      // WTG
      await proxyAdmin
        .upgrade(
          PrimaryIndexTokenWrappedTokenGatewayProxy,
          PrimaryIndexTokenWrappedTokenGatewayLogic
        )
        .then(function (instance) {
          console.log("WTG:");
          console.log(
            "ProxyAdmin upgrade " +
              PrimaryIndexTokenWrappedTokenGatewayProxy +
              " to " +
              PrimaryIndexTokenWrappedTokenGatewayLogic
          );
          return instance;
        });

      //Leverage
      await proxyAdmin
        .upgrade(
          PrimaryIndexTokenLeverageProxy,
          PrimaryIndexTokenLeverageLogic
        )
        .then(function (instance) {
          console.log("Leverage:");
          console.log(
            "ProxyAdmin upgrade " +
              PrimaryIndexTokenLeverageProxy +
              " to " +
              PrimaryIndexTokenLeverageLogic
          );
          return instance;
        });
    }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});