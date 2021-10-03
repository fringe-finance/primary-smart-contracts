const PrimaryIndexToken = artifacts.require("PrimaryIndexToken");
const ProxyAdmin = artifacts.require("ProxyAdmin");
const TransparentUpgradeableProxy = artifacts.require("TransparentUpgradeableProxy");
const UniswapPathFinder = artifacts.require("UniswapPathFinder");
const Comptroller = artifacts.require("Comptroller");
const SimplePriceOracle = artifacts.require("SimplePriceOracle");
const CUSDC = artifacts.require("CUSDC");

const BN = web3.utils.BN;
const fs = require('fs');

module.exports = async function (deployer,network,accounts) {
    
    let deployMaster = accounts[0];
    let moderator = accounts[1];
    let supplier = accounts[2];
    
    console.log("Network: "+network);
    console.log("DEPLOYMASTER: "+deployMaster);
    console.log("MODERATOR: "+moderator);
    console.log("SUPPLIER: "+supplier);

    let proxyAdminAddress = '0xfb7be79479d721d451ff3CCB7B26ddE84E96E276';

//============================================================================

    let primaryIndexTokenMasterCopyAddress;
    await deployer.deploy(PrimaryIndexToken,{from:deployMaster})
    .then(function(instance){
        console.log("PrimaryIndexToken master copy: "+instance.address);
        primaryIndexTokenMasterCopyAddress = instance.address;
    });
    let primaryIndexTokenProxyAddress = '0xBdF47AB5c94341BebC47BEBe3E72560801D26538';
    
    let proxyAdmin = await ProxyAdmin.at(proxyAdminAddress);

    await proxyAdmin.upgrade(primaryIndexTokenProxyAddress,primaryIndexTokenMasterCopyAddress,{from:deployMaster}).then(function(){
        console.log("Proxy admin upgraded primaryIndexToken at "+primaryIndexTokenProxyAddress);
    });
    
  
//============================================================================
   

   
};
