const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);


async function main() {
    let network = await hre.network;
    console.log("Network name: "+network.name);
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    let deployMasterAddress = deployMaster.address;

    console.log("DeployMaster: " + deployMasterAddress);

    // Contracts ABI
    let PrimaryLendingPlatformProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
    let TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
    let JumpRateModelV2Upgradeable = await hre.ethers.getContractFactory("JumpRateModelV2Upgradeable");
    let BLendingToken = await hre.ethers.getContractFactory("BLendingToken");

    let jumpRateModelV2
    let busdc

    let proxyAdminAddress = '0xfB872a364E63950f9847a39202Bb4d1C07534466'    // RECHECK
    let busdcAddress = '0x9fD0928A09E8661945767E75576C912023bA384D'         // RECHECK
    let jumpRateModelV2Address


    //====================================================
    //deploy jump rate model v2 upgradeable admin

    console.log();
    console.log("***** JUMP RATE MODELV2 UPGRADEABLE DEPLOYMENT *****");

    let multiplier = toBN(10).pow(toBN(18));
    let baseRatePerBlock = toBN(9512937595);
    let blocksPerYear = toBN(2102400);
    let jumpMultiplierPerBlock = toBN(1902587519025);
    let multiplierPerBlock = toBN(107020547945);
    let kink = toBN("800000000000000000");

    let baseRatePerYear = baseRatePerBlock.mul(blocksPerYear);
    let multiplierPerYear = multiplierPerBlock.mul(blocksPerYear.mul(kink)).div(multiplier);
    let jumpMultiplierPerYear = jumpMultiplierPerBlock.mul(blocksPerYear);
    let owner = deployMasterAddress;

    console.log(baseRatePerYear)
    console.log(multiplierPerYear)
    console.log(jumpMultiplierPerYear)
    console.log(kink)
    

    jumpRateModelV2 = await JumpRateModelV2Upgradeable.connect(deployMaster).deploy();
    await jumpRateModelV2.deployed().then(function(instance){
        console.log("\nTransaction hash: " + instance.deployTransaction.hash);
        console.log("JumpRateModelV2Upgradeable masterCopy address: " + instance.address);
    });
    let jumpRateModelV2MasterCopyAddress = jumpRateModelV2.address;

    let jumpRateModelV2Proxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
        jumpRateModelV2MasterCopyAddress,
        proxyAdminAddress,
        "0x"
    );
    await jumpRateModelV2Proxy.deployed().then(function(instance){
        console.log("\nTransaction hash: " + instance.deployTransaction.hash);
        console.log("JumpRateModelV2Upgradeable proxy address: " + instance.address);
    });
    let jumpRateModelV2ProxyAddress = jumpRateModelV2Proxy.address;
    jumpRateModelV2Address = jumpRateModelV2ProxyAddress;

    jumpRateModelV2 = await JumpRateModelV2Upgradeable.attach(jumpRateModelV2Address).connect(deployMaster);
    await jumpRateModelV2.initialize(
        baseRatePerYear,
        multiplierPerYear,
        jumpMultiplierPerYear,
        kink,
        owner,
    ).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash);
        console.log("JumpRateModelV2Upgradeable call initialize at " + jumpRateModelV2Address);
    })
    
    busdc = await BLendingToken.attach(busdcAddress).connect(deployMaster);
    await busdc.connect(deployMaster)._setInterestRateModel(jumpRateModelV2Address).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash);
        console.log("BUSDC set interestRateModel " + jumpRateModelV2Address);
    });

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
