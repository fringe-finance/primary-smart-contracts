
const Comptroller = artifacts.require("Comptroller");
const ProxyAdmin = artifacts.require("ProxyAdmin");
const TransparentUpgradeableProxy = artifacts.require("TransparentUpgradeableProxy");
const SimplePriceOracle = artifacts.require("SimplePriceOracle");
const JumpRateModelV2 = artifacts.require("JumpRateModelV2");
const BUSDC = artifacts.require("BUSDC");
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
        let proxyAdminAddress = JSON.parse(fs.readFileSync('migrations/proxyAdminAddress.json', 'utf8')).proxyAdminAddress;
        let comptrollerAddress = JSON.parse(fs.readFileSync('migrations/comptrollerProxyAddress.json', 'utf8')).comptrollerProxyAddress;
        let simplePriceOracleAddress =JSON.parse(fs.readFileSync('migrations/simplePriceOracleProxyAddress.json', 'utf8')).simplePriceOracleProxyAddress;
        let jumpRateModelAddress = JSON.parse(fs.readFileSync('migrations/jumpRateModelAddress.json', 'utf8')).jumpRateModelAddress;
        
        let initialExchangeRateMantissa = multiplier18;
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
        fs.writeFileSync('migrations/bUsdcProxyAddress.json', JSON.stringify(bUsdcProxyAddress_data, null, '\t'));

        let bUsdc = await BUSDC.at(bUsdcProxyAddress);
        await bUsdc.init(   usdctestAddress,
                            comptrollerAddress,
                            jumpRateModelAddress,
                            initialExchangeRateMantissa,
                            name,
                            symbol,
                            decimals,
                            admin,
                            {from:deployMaster}).then(function(){
            console.log("bUSDC called init at "+bUsdcProxyAddress);
        });

        await bUsdc.setReserveFactor(reserveFactorMantissa,{from:deployMaster}).then(function(){
            console.log("bUSDC set reserve factor at "+bUsdcProxyAddress+" with value "+reserveFactorMantissa);
        })

        let simplePriceOracle = await SimplePriceOracle.at(simplePriceOracleAddress);
        await simplePriceOracle.setUnderlyingPrice(bUsdcProxyAddress,multiplier18,{from:deployMaster})
        .then(function(){
            console.log("Setted underlying price for bUSDC");
        });
        

        let comptroller = await Comptroller.at(comptrollerAddress);
        await comptroller._supportMarket(bUsdcProxyAddress,{from:deployMaster}).then(function(){
            console.log("Comptroller support market "+bUsdcProxyAddress);
        });
        let collateralFactor = multiplier18.div(new BN(2));
        let collfacres = await comptroller._setCollateralFactor(bUsdcProxyAddress,collateralFactor,{from:deployMaster}).then(function(){
            console.log("Collateral factor set: "+collateralFactor);
        });
        
        //console.log(collfacres['logs'][0]['args']);

    }

    


  
};