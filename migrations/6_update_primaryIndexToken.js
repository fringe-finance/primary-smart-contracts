const PrimaryIndexToken = artifacts.require("PrimaryIndexToken");
const UniswapPathFinder = artifacts.require("UniswapPathFinder");
const Comptroller = artifacts.require("Comptroller");
const BUSDC = artifacts.require("BUSDC");
const ProxyAdmin = artifacts.require("ProxyAdmin");


module.exports = async function (deployer,network,accounts) {
    
    let deployMaster = accounts[0];
    let moderator = accounts[1];
    let supplier = accounts[2];
    
    console.log("Network: "+network);
    console.log("DEPLOYMASTER: "+deployMaster);
    console.log("MODERATOR: "+moderator);
    console.log("SUPPLIER: "+supplier);

    let proxyAdminAddress = '0x91976Ac128B93B21374ecf3A3dD224AEcB1C746A';//'0x436335D964C49FEbd47cda35d2b9499fB7eD9e8B';
    let proxyAdmin = await ProxyAdmin.at(proxyAdminAddress);
//============================================================================

    let primaryIndexTokenMasterCopyAddress;
    await deployer.deploy(PrimaryIndexToken,{from:deployMaster})
    .then(function(instance){
        console.log("PrimaryIndexToken master copy: "+instance.address);
        primaryIndexTokenMasterCopyAddress = instance.address;
    });
    let primaryIndexTokenProxyAddress = '0xA30e247C55C5Fe941FE6790Fe903fB382b06331B';//'0x908d17d8fD57Bc83F9197ab841782C675996650C';
    
    await proxyAdmin.upgrade(primaryIndexTokenProxyAddress,primaryIndexTokenMasterCopyAddress,{from:deployMaster}).then(function(){
        console.log("Proxy admin upgraded primaryIndexToken at "+primaryIndexTokenProxyAddress);
    });
    
  
//============================================================================
   
    // let uniswapPathFinderMasterCopyAddress;
    // await deployer.deploy(UniswapPathFinder,{from:deployMaster}).then(function(instance){
    //     console.log("UniswapPathFinder master copy: " , instance.address);
    //     uniswapPathFinderMasterCopyAddress = instance.address;
    // });

    // let uniswapPathFinderProxyAddress = '0x68af8d954A26D738c71894F83D8DE49018F238db';
    
    // await proxyAdmin.upgrade(uniswapPathFinderProxyAddress,uniswapPathFinderMasterCopyAddress,{from:deployMaster}).then(function(){
    //     console.log("Proxy admin upgraded uniswapPathFinder at "+uniswapPathFinderProxyAddress);
    // });

//============================================================================

    // let bUsdcMasterCopyAddress;
    // await deployer.deploy(BUSDC,{from:deployMaster}).then(function (instance) {
    //     bUsdcMasterCopyAddress = instance.address;
    //     console.log("bUsdctest mastercopy address: "+instance.address);
    // });

    // let bUsdcProxyAddress = '0x31B7645923e0Abc8EaC52355f300DeBB67A7D69e';

    // await proxyAdmin.upgrade(bUsdcProxyAddress,bUsdcMasterCopyAddress,{from:deployMaster}).then(function(){
    //     console.log("Proxy admin upgraded bUsdcProxyAddress at "+bUsdcProxyAddress);
    // });

//============================================================================

    // let comptrollerMasterCopyAddress;
    // await deployer.deploy(Comptroller,{from:deployMaster}).then(function (instance) {
    //     comptrollerMasterCopyAddress = instance.address;
    //     console.log("Comptroller address: "+instance.address);
    // });

    // let comprtollerProxyAddress = '0x58C098EeDA524441A0aA05c55106703749bea36D';

    // await proxyAdmin.upgrade(comprtollerProxyAddress, comptrollerMasterCopyAddress, {from:deployMaster}).then(function(){
    //     console.log("Proxy admin upgraded comptrollerProxyAddress at "+comprtollerProxyAddress);
    // });


};
