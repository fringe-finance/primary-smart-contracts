const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = "../../../config/config_mockToken.json";
const config = require(configFile);

async function verify(contractAddress, constructor) {
  await run("verify:verify", {
    address: contractAddress,
    constructorArguments: constructor,
  }).catch((err) => console.log(err.message));
  console.log("Contract verified at: ", contractAddress);
}

async function main() {
  //====================================================
  //declare parametrs

  let network = await hre.network;
  console.log("Network name: " + network.name);
  let {
    USDCTest,
    LINK,
    MATIC,
    WBTC,
    prjTokenLogicAddress,
    prj1Address,
    prj2Address,
    prj3Address,
    prj4Address,
    prj5Address,
    prj6Address,

    nameUSD,
    symbolUSD,
    decimalUSD,

    namePRJ1,
    symboPRJ1,

    namePRJ2,
    symboPRJ2,

    namePRJ3,
    symboPRJ3,

    namePRJ4,
    symboPRJ4,

    namePRJ5,
    symboPRJ5,

    namePRJ6,
    symboPRJ6,

    nameLINK,
    symbolLINK,
    decimalLINK,

    nameMatic,
    symbolMatic,
    decimalMatic,

    nameWbtc,
    symbolWbtc,
    decimalWbtc,
    PRIMARY_PROXY_ADMIN,
  } = config;

  let signers = await hre.ethers.getSigners();
  let deployMaster = signers[0];

  console.log("DeployMaster: " + deployMaster.address);

  let deployMasterAddress = deployMaster.address;

  // Contracts ABI
  let ProxyAdmin;
  let MockToken;
  let PRJToken;

  //instances of contracts
  let proxyAdmin;
  let mockToken;
  let prjToken;

  //contracts addresses
  let usdcTestAddress = USDCTest;
  let linkAddress = LINK;
  let maticAddress = MATIC;
  let wbtcAddress = WBTC;
  let prjTokenAddress = prjTokenLogicAddress;
  let prj1TokenAddress = prj1Address;
  let prj2TokenAddress = prj2Address;
  let prj3TokenAddress = prj3Address;
  let prj4TokenAddress = prj4Address;
  let prj5TokenAddress = prj5Address;
  let prj6TokenAddress = prj6Address;
  let proxyAdminAddress = PRIMARY_PROXY_ADMIN;

  //====================================================
  //initialize deploy parametrs

  ProxyAdmin = await hre.ethers.getContractFactory(
    "PrimaryLendingPlatformProxyAdmin"
  );
  MockToken = await hre.ethers.getContractFactory("MockToken");
  PRJToken = await hre.ethers.getContractFactory("PRJ");
  TransparentUpgradeableProxy = await hre.ethers.getContractFactory(
    "TransparentUpgradeableProxy"
  );

  // //====================================================
  //deploy chainlinkPriceProvider
  console.log();
  console.log("***** USDC TOKEN DEPLOYMENT *****");
  if (!usdcTestAddress) {
    mockToken = await MockToken.connect(deployMaster).deploy(
      nameUSD,
      symbolUSD,
      decimalUSD
    );
    await mockToken.deployed().then(function (instance) {
      console.log("usdc: " + instance.address);
      usdcTestAddress = instance.address;
      config.USDCTest = usdcTestAddress;
      fs.writeFileSync(
        path.join(__dirname, configFile),
        JSON.stringify(config, null, 2)
      );
    });
    // await verify(usdcTestAddress, [nameUSD, symbolUSD, decimalUSD]);
  }

  console.log();
  console.log("***** LINK TOKEN DEPLOYMENT *****");
  if (!linkAddress) {
    mockToken = await MockToken.connect(deployMaster).deploy(
      nameLINK,
      symbolLINK,
      decimalLINK
    );
    await mockToken.deployed().then(function (instance) {
      console.log("link: " + instance.address);
      linkAddress = instance.address;
      config.LINK = linkAddress;
      fs.writeFileSync(
        path.join(__dirname, configFile),
        JSON.stringify(config, null, 2)
      );
    });
    // await verify(linkAddress, [nameLINK, symbolLINK, decimalLINK]);
  }

  console.log();
  console.log("***** MATIC TOKEN DEPLOYMENT *****");

  if (!maticAddress) {
    mockToken = await MockToken.connect(deployMaster).deploy(
      nameMatic,
      symbolMatic,
      decimalMatic
    );
    await mockToken.deployed().then(function (instance) {
      console.log("matic: " + instance.address);
      maticAddress = instance.address;
      config.MATIC = maticAddress;
      fs.writeFileSync(
        path.join(__dirname, configFile),
        JSON.stringify(config, null, 2)
      );
    });
    // await verify(maticAddress, [nameMatic, symbolMatic, decimalMatic]);
  }

  console.log();
  console.log("***** WBTC TOKEN DEPLOYMENT *****");
  if (!wbtcAddress) {
    mockToken = await MockToken.connect(deployMaster).deploy(
      nameWbtc,
      symbolWbtc,
      decimalWbtc
    );
    await mockToken.deployed().then(function (instance) {
      console.log("Wbtc: " + instance.address);
      wbtcAddress = instance.address;
      config.WBTC = wbtcAddress;
      fs.writeFileSync(
        path.join(__dirname, configFile),
        JSON.stringify(config, null, 2)
      );
    });
    // await verify(wbtcAddress, [nameWbtc, symbolWbtc, decimalWbtc]);
  }

  console.log();
  console.log("***** PRJ TOKEN LOGIC DEPLOYMENT *****");
  if (!prjTokenAddress) {
    prjToken = await PRJToken.connect(deployMaster).deploy();
    await prjToken.deployed().then(function (instance) {
      console.log("PRJ logic: " + instance.address);
      prjTokenAddress = instance.address;
      config.prjTokenLogicAddress = prjTokenAddress;
      fs.writeFileSync(
        path.join(__dirname, configFile),
        JSON.stringify(config, null, 2)
      );
    });
    // await verify(prjTokenAddress, []);
  }

  console.log();
  console.log("***** PRJ1 TOKEN DEPLOYMENT *****");
  if (!prj1TokenAddress) {
    let prjToken1Proxy = await TransparentUpgradeableProxy.connect(
      deployMaster
    ).deploy(prjTokenAddress, proxyAdminAddress, "0x");
    await prjToken1Proxy.deployed().then(function (instance) {
      console.log("prjToken 1 proxy address: " + instance.address);
      prj1TokenAddress = instance.address;
      config.prj1Address = prj1TokenAddress;
      fs.writeFileSync(
        path.join(__dirname, configFile),
        JSON.stringify(config, null, 2)
      );
    });

    prjToken = await PRJToken.attach(prj1TokenAddress).connect(deployMaster);
    await prjToken.init(namePRJ1, symboPRJ1).then(function (instance) {
      console.log("\nTransaction hash: " + instance.hash);
      console.log("prjToken initd at " + prj1TokenAddress);
    });
    // await verify (prj1TokenAddress, [prjTokenAddress, proxyAdminAddress, "0x"]);
  }
  console.log("Done prj1");

  console.log("***** PRJ2 TOKEN DEPLOYMENT *****");

  if (!prj2TokenAddress) {
    let prjToken2Proxy = await TransparentUpgradeableProxy.connect(
      deployMaster
    ).deploy(prjTokenAddress, proxyAdminAddress, "0x");
    await prjToken2Proxy.deployed().then(function (instance) {
      console.log("prjToken 2 proxy address: " + instance.address);
      prj2TokenAddress = instance.address;
      config.prj2Address = prj2TokenAddress;
      fs.writeFileSync(
        path.join(__dirname, configFile),
        JSON.stringify(config, null, 2)
      );
    });

    prjToken = await PRJToken.attach(prj2TokenAddress).connect(deployMaster);
    await prjToken.init(namePRJ2, symboPRJ2).then(function (instance) {
      console.log("\nTransaction hash: " + instance.hash);
      console.log("prjToken 2 initd at " + prj2TokenAddress);
    });
    // await verify (prj2TokenAddress, [prjTokenAddress, proxyAdminAddress, "0x"]);
  }
  console.log("Done prj2");
  console.log("***** PRJ3 TOKEN DEPLOYMENT *****");

  if (!prj3TokenAddress) {
    let prjToken3Proxy = await TransparentUpgradeableProxy.connect(
      deployMaster
    ).deploy(prjTokenAddress, proxyAdminAddress, "0x");
    await prjToken3Proxy.deployed().then(function (instance) {
      console.log("prjToken 3 proxy address: " + instance.address);
      prj3TokenAddress = instance.address;
      config.prj3Address = prj3TokenAddress;
      fs.writeFileSync(
        path.join(__dirname, configFile),
        JSON.stringify(config, null, 2)
      );
    });

    prjToken = await PRJToken.attach(prj3TokenAddress).connect(deployMaster);
    await prjToken.init(namePRJ3, symboPRJ3).then(function (instance) {
      console.log("\nTransaction hash: " + instance.hash);
      console.log("prjToken 3 initd at " + prj3TokenAddress);
    });
    // await verify (prj3TokenAddress, [prjTokenAddress, proxyAdminAddress, "0x"]);
  }
  console.log("Done prj3");
  console.log("***** PRJ4 TOKEN DEPLOYMENT *****");

  if (!prj4TokenAddress) {
    let prjToken4Proxy = await TransparentUpgradeableProxy.connect(
      deployMaster
    ).deploy(prjTokenAddress, proxyAdminAddress, "0x");
    await prjToken4Proxy.deployed().then(function (instance) {
      console.log("prjToken 4 proxy address: " + instance.address);
      prj4TokenAddress = instance.address;
      config.prj4Address = prj4TokenAddress;
      fs.writeFileSync(
        path.join(__dirname, configFile),
        JSON.stringify(config, null, 2)
      );
    });

    prjToken = await PRJToken.attach(prj4TokenAddress).connect(deployMaster);
    await prjToken.init(namePRJ4, symboPRJ4).then(function (instance) {
      console.log("\nTransaction hash: " + instance.hash);
      console.log("prjToken 4 initd at " + prj4TokenAddress);
    });
    // await verify (prj4TokenAddress, [prjTokenAddress, proxyAdminAddress, "0x"]);
  }
  console.log("Done prj4");

  console.log("***** PRJ5 TOKEN DEPLOYMENT *****");
  if (!prj5TokenAddress) {
    let prjToken5Proxy = await TransparentUpgradeableProxy.connect(
      deployMaster
    ).deploy(prjTokenAddress, proxyAdminAddress, "0x");
    await prjToken5Proxy.deployed().then(function (instance) {
      console.log("prjToken 5 proxy address: " + instance.address);
      prj5TokenAddress = instance.address;
      config.prj5Address = prj5TokenAddress;
      fs.writeFileSync(
        path.join(__dirname, configFile),
        JSON.stringify(config, null, 2)
      );
    });

    prjToken = await PRJToken.attach(prj5TokenAddress).connect(deployMaster);
    await prjToken.init(namePRJ5, symboPRJ5).then(function (instance) {
      console.log("\nTransaction hash: " + instance.hash);
      console.log("prjToken 5 initd at " + prj5TokenAddress);
    });
    // await verify (prj5TokenAddress, [prjTokenAddress, proxyAdminAddress, "0x"]);
  }
  console.log("Done prj6");

  console.log("***** PRJ6 TOKEN DEPLOYMENT *****");

  if (!prj6TokenAddress) {
    let prjToken6Proxy = await TransparentUpgradeableProxy.connect(
      deployMaster
    ).deploy(prjTokenAddress, proxyAdminAddress, "0x");
    await prjToken6Proxy.deployed().then(function (instance) {
      console.log("prjToken 6 proxy address: " + instance.address);
      prj6TokenAddress = instance.address;
      config.prj6Address = prj6TokenAddress;
      fs.writeFileSync(
        path.join(__dirname, configFile),
        JSON.stringify(config, null, 2)
      );
    });

    prjToken = await PRJToken.attach(prj6TokenAddress).connect(deployMaster);
    await prjToken.init(namePRJ6, symboPRJ6).then(function (instance) {
      console.log("\nTransaction hash: " + instance.hash);
      console.log("prjToken 6 initialized at " + prj6TokenAddress);
    });
    // await verify (prj6TokenAddress, [prjTokenAddress, proxyAdminAddress, "0x"]);
  }
  console.log("Done prj6");
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});