const PrimaryIndexToken = artifacts.require("PrimaryIndexToken");
const UniswapPathFinder = artifacts.require("UniswapPathFinder");
const ProxyAdmin = artifacts.require("ProxyAdmin");


module.exports = async function (deployer,network,accounts) {
    
    let deployMaster = accounts[0];
    let moderator = accounts[1];
    let supplier = accounts[2];
    
    console.log("Network: "+network);
    console.log("DEPLOYMASTER: "+deployMaster);
    console.log("MODERATOR: "+moderator);
    console.log("SUPPLIER: "+supplier);

    let proxyAdminAddress = '0x966981cDf9A94487078DD44E30e02a7063299d55';
    let proxyAdmin = await ProxyAdmin.at(proxyAdminAddress);
//============================================================================

    let primaryIndexTokenMasterCopyAddress;
    await deployer.deploy(PrimaryIndexToken,{from:deployMaster})
    .then(function(instance){
        console.log("PrimaryIndexToken master copy: "+instance.address);
        primaryIndexTokenMasterCopyAddress = instance.address;
    });
    let primaryIndexTokenProxyAddress = '0xBDC93176a2Bea09fd4509FEbc2ceDAfb9BD60934';
    
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
    //     console.log("Proxy admin upgraded primaryIndexToken at "+uniswapPathFinderProxyAddress);
    // });

//============================================================================
   
};
