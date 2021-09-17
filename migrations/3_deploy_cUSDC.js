
const Comptroller = artifacts.require("Comptroller");
const ProxyAdmin = artifacts.require("ProxyAdmin");
const TransparentUpgradeableProxy = artifacts.require("TransparentUpgradeableProxy");
const SimplePriceOracle = artifacts.require("SimplePriceOracle");
const JumpRateModelV2 = artifacts.require("JumpRateModelV2");
const CUSDC = artifacts.require("CUSDC");
const EIP20Interface = artifacts.require("EIP20Interface");

const web3 = require("web3");
const fs = require('fs');
const BN = web3.utils.BN;


module.exports = async function (deployer,network,accounts) {
    
    let deployMaster = accounts[0];
    let multiplier18 = (new BN(10)).pow(new BN(18));

    console.log("Network: "+network);
    console.log("DEPLOYMASTER: "+deployMaster);
    
    if(network == 'testrinkeby' || network == 'rinkeby' || network == 'rinkeby-fork'){

        let usdctestAddress = '0x5236aAB9f4b49Bfd93a9500E427B042f65005E6A';
        let proxyAdminAddress = ProxyAdmin.address;//'0xabb233Bc373D8e61179B33152f8b9C3C0F8262Ba';//
        let comptrollerAddress = JSON.parse(fs.readFileSync('migrations/comptrollerProxyAddress.json', 'utf8')).comptrollerProxyAddress;//'0xC0f988FDa256C92cA28e78F4be85F711b5209945';//
        let simplePriceOracleAddress = JSON.parse(fs.readFileSync('migrations/simplePriceOracleProxyAddress.json', 'utf8')).simplePriceOracleProxyAddress; //'0xd84111ba8FcFd6ffcbA858702289c3E0E93386ea';//
        let jumpRateModelAddress = JumpRateModelV2.address; // '0x8ADb2bb3292e8880C0E76Caa4DfFAe5e5F23f7BB';//
        
        let initialExchangeRateMantissa = multiplier18;
        let name = "cUSDC Test Token";
        let symbol = "cUSDCTest";
        let decimals = new BN(8);
        let admin = deployMaster;
       

        let cUsdcMasterCopyAddress;
        await deployer.deploy(CUSDC,{from:deployMaster}).then(function (instance) {
            cUsdcMasterCopyAddress = instance.address;
            console.log("cUsdctest mastercopy address: "+instance.address);
        });
        
        let cUsdcProxyAddress;   
        await deployer.deploy(  TransparentUpgradeableProxy,
                                cUsdcMasterCopyAddress, 
                                proxyAdminAddress,
                                web3.utils.hexToBytes('0x'),
                                {from:deployMaster})
            .then(function(instance){
                cUsdcProxyAddress = instance.address;
                console.log ("CUSDC Proxy Instance Address: "+ instance.address);
                
        });
        
        let cUsdc = await CUSDC.at(cUsdcProxyAddress);
        await cUsdc.init(   usdctestAddress,
                            comptrollerAddress,
                            jumpRateModelAddress,
                            initialExchangeRateMantissa,
                            name,
                            symbol,
                            decimals,
                            admin,
                            {from:deployMaster}).then(function(){
            console.log("CUSDC called init at "+cUsdcProxyAddress);
        });

        let data = {
            "cUsdcProxyAddress":cUsdcProxyAddress
        }
        fs.writeFileSync('migrations/cUsdcProxyAddress.json', JSON.stringify(data, null, '\t'));

        let simplePriceOracle = await SimplePriceOracle.at(simplePriceOracleAddress);
        await simplePriceOracle.setUnderlyingPrice(cUsdcProxyAddress,multiplier18,{from:deployMaster});
        

        let comptroller = await Comptroller.at(comptrollerAddress);
        await comptroller._supportMarket(cUsdcProxyAddress,{from:deployMaster});
        console.log("Comptroller support market "+cUsdcProxyAddress);
        let collateralFactor = multiplier18.div(new BN(2));
        let collfacres = await comptroller._setCollateralFactor(cUsdcProxyAddress,collateralFactor,{from:deployMaster});
        console.log("Collateral factor set: "+collateralFactor);
        //console.log(collfacres['logs'][0]['args']);

    }

    


  
};