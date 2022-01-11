
const ProxyAdmin = artifacts.require("ProxyAdmin");
const TransparentUpgradeableProxy = artifacts.require("TransparentUpgradeableProxy");
const Bondtroller = artifacts.require("Bondtroller");
const BUSDC = artifacts.require("BUSDC");

const web3 = require("web3");
const fs = require('fs');
const BN = web3.utils.BN;


module.exports = async function (deployer,network,accounts) {
    
    let deployMaster = accounts[0];

    console.log("Network: "+network);
    console.log("DEPLOYMASTER: "+deployMaster);
    
    if(network == 'testrinkeby' || network == 'rinkeby' || network == 'rinkeby-fork'){

        let usdctestAddress = '0x5236aAB9f4b49Bfd93a9500E427B042f65005E6A';
        let proxyAdminAddress = JSON.parse(fs.readFileSync('migrations/addresses/proxyAdminAddress.json', 'utf8')).proxyAdminAddress;
        let bondtrollerAddress = JSON.parse(fs.readFileSync('migrations/addresses/bondtrollerProxyAddress.json', 'utf8')).bondtrollerProxyAddress;
        let jumpRateModelAddress = JSON.parse(fs.readFileSync('migrations/addresses/jumpRateModelAddress.json', 'utf8')).jumpRateModelAddress;
        
        let initialExchangeRateMantissa = (new BN(10)).pow(new BN(18));;
        let reserveFactorMantissa = (new BN(25)).mul((new BN(10)).pow((new BN(16))));//same as cAAVE
        let name = "bUSDC Test Token";
        let symbol = "bUSDCTest";
        let decimals = new BN(6);
        let admin = deployMaster;
       

        let bUsdcMasterCopyAddress;
        await deployer.deploy(BUSDC,{from:deployMaster}).then(function (instance) {
            bUsdcMasterCopyAddress = instance.address;
            console.log("bUsdctest mastercopy address: "+instance.address);
        });
        
        let bUsdcProxyAddress;   
        await deployer.deploy(  TransparentUpgradeableProxy,
                                bUsdcMasterCopyAddress, 
                                proxyAdminAddress,
                                web3.utils.hexToBytes('0x'),
                                {from:deployMaster})
            .then(function(instance){
                bUsdcProxyAddress = instance.address;
                console.log ("bUSDC Proxy Instance Address: "+ instance.address);
                
        });

        let bUsdcProxyAddress_data = {
            "bUsdcProxyAddress":bUsdcProxyAddress
        }
        fs.writeFileSync('migrations/addresses/bUsdcProxyAddress.json', JSON.stringify(bUsdcProxyAddress_data, null, '\t'));

        let bUsdc = await BUSDC.at(bUsdcProxyAddress);
        await bUsdc.init(   usdctestAddress,
                            bondtrollerAddress,
                            jumpRateModelAddress,
                            initialExchangeRateMantissa,
                            name,
                            symbol,
                            decimals,
                            admin,
                            {from:deployMaster})
        .then(function(){
            console.log("bUSDC called init at "+bUsdcProxyAddress);
        });

        await bUsdc.setReserveFactor(reserveFactorMantissa,{from:deployMaster}).then(function(){
            console.log("bUSDC set reserve factor at "+bUsdcProxyAddress+" with value "+reserveFactorMantissa);
        });

        let bondtroller = await Bondtroller.at(bondtrollerAddress);
        await bondtroller.supportMarket(bUsdcProxyAddress,{from:deployMaster}).then(function(){
            console.log("Bondtroller support market "+bUsdcProxyAddress);
        });


    }

    


  
};