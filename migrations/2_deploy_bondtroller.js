const ProxyAdmin = artifacts.require("ProxyAdmin");
const TransparentUpgradeableProxy = artifacts.require("TransparentUpgradeableProxy");
const Bondtroller = artifacts.require("Bondtroller");
const JumpRateModelV2 = artifacts.require("JumpRateModelV2");
const web3 = require("web3");
const BN = web3.utils.BN;

const fs = require('fs');

module.exports = async function (deployer,network,accounts) {
    
    let deployMaster = accounts[0];
   
    console.log("Network: "+network);
    console.log("DEPLOYMASTER: "+deployMaster);

    let proxyAdminAddress;
    await deployer.deploy(ProxyAdmin,{from:deployMaster})
    .then(function () {
        proxyAdminAddress = ProxyAdmin.address;
        console.log("ProxyAdmin Address: "+ProxyAdmin.address)
    });

    const proxyAdmin_data = {
        "proxyAdminAddress": proxyAdminAddress
    }
    fs.writeFileSync('migrations/addresses/proxyAdminAddress.json', JSON.stringify(proxyAdmin_data, null, '\t'));

//=========================================================

    //parametrs from cAAVE interest model https://etherscan.io/address/0xd956188795ca6f4a74092ddca33e0ea4ca3a1395#readContract
    let multiplier = (new BN(10)).pow(new BN(18));
    let baseRatePerBlock = new BN(9512937595);
    let blocksPerYear = new BN(2102400);
    let jumpMultiplierPerBlock = new BN(1902587519025);
    let multiplierPerBlock = new BN(107020547945);
    let kink = new BN("800000000000000000");

    let baseRatePerYear = baseRatePerBlock.mul(blocksPerYear);
    let multiplierPerYear = multiplierPerBlock.mul(blocksPerYear.mul(kink)).div(multiplier);
    let jumpMultiplierPerYear = jumpMultiplierPerBlock.mul(blocksPerYear);
    let owner = deployMaster;
    let jumpRateModelAddress;

    await deployer.deploy(JumpRateModelV2, baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink, owner,{from:deployMaster}).then(function(){
        jumpRateModelAddress = JumpRateModelV2.address;
        console.log("JumpRateModelV2 address: "+JumpRateModelV2.address);
    });

    const jumpRateModelAddress_data = {
        "jumpRateModelAddress": jumpRateModelAddress
    }
    fs.writeFileSync('migrations/addresses/jumpRateModelAddress.json', JSON.stringify(jumpRateModelAddress_data, null, '\t'));

    // let jumpRate = await JumpRateModelV2.at(jumpRateModelAddress);
    // let brpb = await jumpRate.baseRatePerBlock();
    // let bpy = await jumpRate.blocksPerYear();
    // let mpb = await jumpRate.multiplierPerBlock();
    // let jmpb = await jumpRate.jumpMultiplierPerBlock();
    // console.log("BaseRatePerBlock: "+ brpb);
    // console.log("BlocksPerYear: "+bpy);
    // console.log("MultiplierPerBlock: "+mpb);
    // console.log("JumpMultiplierPerBlock: "+jmpb);

    // console.log("baseRatePerYear: "+baseRatePerYear);
    // console.log("multiplierPerYear:"+multiplierPerYear);
    // console.log("jumpMultiplierPerYear: "+jumpMultiplierPerYear);

//=========================================================

    let bondtrollerMasterCopyAddress;
    await deployer.deploy(Bondtroller,{from:deployMaster}).then(function (instance) {
        bondtrollerMasterCopyAddress = instance.address;
        console.log("Bondtroller address: "+instance.address);
    });

    let bondtrollerProxyAddress;
    await deployer.deploy(  TransparentUpgradeableProxy,
                            bondtrollerMasterCopyAddress, 
                            proxyAdminAddress,
                            web3.utils.hexToBytes('0x'),
                            {from:deployMaster})
        .then(function(instance){
            console.log ("Bondtroller Proxy Instance Address: "+ instance.address);
            bondtrollerProxyAddress = instance.address;
    }); 

    const bondtrollerProxyAddress_data = {
        "bondtrollerProxyAddress":bondtrollerProxyAddress
    }
    fs.writeFileSync('migrations/addresses/bondtrollerProxyAddress.json', JSON.stringify(bondtrollerProxyAddress_data, null, '\t'));
    
    let bondtroller = await Bondtroller.at(bondtrollerProxyAddress);
    await bondtroller.init({from:deployMaster}).then(function(){
        console.log("Bondtroller called init at "+bondtrollerProxyAddress);
    });






};
