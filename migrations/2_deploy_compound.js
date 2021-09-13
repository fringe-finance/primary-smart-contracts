const ProxyAdmin = artifacts.require("ProxyAdmin");
const TransparentUpgradeableProxy = artifacts.require("TransparentUpgradeableProxy");
const Comptroller = artifacts.require("Comptroller");
const SimplePriceOracle = artifacts.require("SimplePriceOracle");
const JumpRateModelV2 = artifacts.require("JumpRateModelV2");
const web3 = require("web3");
const BN = web3.utils.BN;

const fs = require('fs');

module.exports = async function (deployer,network,accounts) {
    
    let deployMaster = accounts[0];
    let multiplier = (new BN(10)).pow(new BN(18));
    
    console.log("Network: "+network);
    console.log("DEPLOYMASTER: "+deployMaster);


    let proxyAdminAddress;
    await deployer.deploy(ProxyAdmin,{from:deployMaster}).then(function () {
        proxyAdminAddress = ProxyAdmin.address;
        console.log("ProxyAdmin Address: "+ProxyAdmin.address)
    });

  
//=========================================================

    let simplePriceOracleAddress;
    await deployer.deploy(SimplePriceOracle,{from:deployMaster}).then(function (instance) {
        simplePriceOracleAddress = instance.address;
        console.log("SimplePriceOracle address: "+instance.address);
    });

//=========================================================

    //parametrs from cAAVE interest model https://etherscan.io/address/0xd956188795ca6f4a74092ddca33e0ea4ca3a1395#readContract
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

    let comptrollerMasterCopyAddress;
    await deployer.deploy(Comptroller,{from:deployMaster}).then(function (instance) {
        comptrollerMasterCopyAddress = instance.address;
        console.log("Comptroller address: "+instance.address);
    });

    let comptrollerProxyAddress;   
    await deployer.deploy(  TransparentUpgradeableProxy,
                            comptrollerMasterCopyAddress, 
                            proxyAdminAddress,
                            web3.utils.hexToBytes('0x'),
                            {from:deployMaster})
        .then(function(instance){
            console.log ("Comptroller Proxy Instance Address: "+ instance.address);
            comptrollerProxyAddress = instance.address;
    }); 

    const data = {
        "comptrollerProxyAddress":comptrollerProxyAddress
    }
    fs.writeFileSync('migrations/comptrollerProxyAddress.json', JSON.stringify(data, null, '\t'));
    
    let comptroller = await Comptroller.at(comptrollerProxyAddress);

    await comptroller.init({from:deployMaster}).then(function(){
        console.log("Comproller called init at "+comptrollerProxyAddress);
    });

    await comptroller._setPriceOracle(simplePriceOracleAddress,{from:deployMaster}).then(function(){
        console.log("Price oracle set: "+simplePriceOracleAddress);
    });

    let closeFactor = multiplier.div(new BN(2));//0.5 * (10 ** 18)
    await comptroller._setCloseFactor(closeFactor,{from:deployMaster}).then(function(){
        console.log("Close factor set: "+closeFactor);
    });

    let liquidationIncentive = (new BN(11)).mul(multiplier.div(new BN(10)));
    await comptroller._setLiquidationIncentive(liquidationIncentive,{from:deployMaster}).then(function(){
        console.log("Liquidation incentive set: "+liquidationIncentive);
    });



};
