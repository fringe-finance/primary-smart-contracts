
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/config.json';
const config = require(configFile);
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let {
    PRIMARY_PROXY_ADMIN, 
    BLendingTokenLogic, 
    BLendingTokenProxy,
    USDCTest,
    BondtrollerProxy,
    JumpRateModelProxy
} = config;

let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let blendingTokenLogicAddress = BLendingTokenLogic;
let blendingTokenProxyAddress = BLendingTokenProxy;
let bondtrollerProxyAddress = BondtrollerProxy;
let jumpRateModelV2Address = JumpRateModelProxy;

let usdctestAddress = USDCTest;
let initialExchangeRateMantissa = toBN(10).pow(toBN(18));
let reserveFactorMantissa = toBN(25).mul(toBN(10).pow(toBN(16)));//same as cAAVE
let symbol = "fUSDC";
let decimals = toBN(6);
let name = "fUSDC";

async function verify(contractAddress, constructor) {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructor,
    }).catch((err) => console.log(err.message));
    console.log("Contract verified at: ", contractAddress);
}

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    let admin = deployMaster.address;
    console.log("DeployMaster: " + deployMaster.address);

    let BLendingToken = await hre.ethers.getContractFactory("BLendingToken");
    let TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
    let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");

    if(!blendingTokenLogicAddress) {
      let blendingToken = await BLendingToken.connect(deployMaster).deploy();
      await blendingToken.deployed();
      blendingTokenLogicAddress = blendingToken.address;
      config.BLendingTokenLogic = blendingTokenLogicAddress;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("blendingToken masterCopy address: " + blendingTokenLogicAddress);
    
    if(!blendingTokenProxyAddress) {
        let BLendingTokenProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            blendingTokenLogicAddress,
            proxyAdmingAddress,
            "0x"
        );
        await BLendingTokenProxy.deployed().then(function(instance){
            blendingTokenProxyAddress = instance.address;
            config.BLendingTokenProxy = blendingTokenProxyAddress;
            fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
        });
    }
    console.log("blendingToken proxy address: " + blendingTokenProxyAddress);

    let blendingToken = await BLendingToken.attach(blendingTokenProxyAddress).connect(deployMaster);
    let bondtroller = await Bondtroller.attach(bondtrollerProxyAddress).connect(deployMaster); 

    await blendingToken.init(
        usdctestAddress,
        bondtrollerProxyAddress,
        jumpRateModelV2Address,
        initialExchangeRateMantissa,
        name,
        symbol,
        decimals,
        admin
    ).then(function(){
        console.log("BUSDC call init at " + blendingToken.address);
    });

    await blendingToken.connect(deployMaster).setReserveFactor(reserveFactorMantissa).then(function(){
        console.log("BUSDC set reserve factor " + reserveFactorMantissa);
    });

    await bondtroller.supportMarket(blendingTokenProxyAddress).then(function(){
        console.log("Bondtroller support market " + blendingTokenProxyAddress);
    });

    await verify(blendingTokenLogicAddress, []);
    await verify(blendingTokenProxyAddress, [blendingTokenLogicAddress, proxyAdmingAddress, "0x"]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
