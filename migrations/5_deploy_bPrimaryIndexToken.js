
const ProxyAdmin = artifacts.require("ProxyAdmin");
const TransparentUpgradeableProxy = artifacts.require("TransparentUpgradeableProxy");
const PrimaryIndexToken = artifacts.require("PrimaryIndexToken");
const Comptroller = artifacts.require("Comptroller");
const SimplePriceOracle = artifacts.require("SimplePriceOracle");
const JumpRateModelV2 = artifacts.require("JumpRateModelV2");
const BPrimaryIndexToken = artifacts.require("BPrimaryIndexToken");
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
    
        let proxyAdminAddress = JSON.parse(fs.readFileSync('migrations/proxyAdminAddress.json', 'utf8')).proxyAdminAddress;
        let primaryIndexTokenAddress = JSON.parse(fs.readFileSync('migrations/primaryIndexTokenProxyAddress.json', 'utf8')).primaryIndexTokenProxyAddress;
        let comptrollerAddress = JSON.parse(fs.readFileSync('migrations/comptrollerProxyAddress.json', 'utf8')).comptrollerProxyAddress;
        let jumpRateModelAddress = JSON.parse(fs.readFileSync('migrations/jumpRateModelAddress.json', 'utf8')).jumpRateModelAddress;
        let simplePriceOracleAddress = JSON.parse(fs.readFileSync('migrations/simplePriceOracleProxyAddress.json', 'utf8')).simplePriceOracleProxyAddress;
        let initialExchangeRateMantissa = multiplier18.mul(new BN(1));//.div(new BN(100));
        let name = "bPrimaryIndexToken";
        let symbol = "bPIT";
        let decimals = new BN(6);
        let admin = deployMaster;


        let bPrimaryIndexTokenMasterCopyAddress;
        await deployer.deploy(BPrimaryIndexToken,{from:deployMaster}).then(function (instance) {
            bPrimaryIndexTokenMasterCopyAddress = instance.address;
            console.log("bPrimaryIndexToken master copy address: "+instance.address);
        });

        let bPrimaryIndexTokenProxyAddress;   
        await deployer.deploy(  TransparentUpgradeableProxy,
                                bPrimaryIndexTokenMasterCopyAddress, 
                                proxyAdminAddress,
                                web3.utils.hexToBytes('0x'),
                                {from:deployMaster})
            .then(function(instance){
                bPrimaryIndexTokenProxyAddress = instance.address;
                console.log ("bPrimaryIndexToken Proxy Instance Address: "+ instance.address);
        });

        let data = {
            "bPrimaryIndexTokenProxyAddress":bPrimaryIndexTokenProxyAddress
        }
        fs.writeFileSync('migrations/bPrimaryIndexTokenProxyAddress.json', JSON.stringify(data, null, '\t'));
        

        let bPrimaryIndexToken = await BPrimaryIndexToken.at(bPrimaryIndexTokenProxyAddress);
        await bPrimaryIndexToken.init(  primaryIndexTokenAddress,
                                        comptrollerAddress,
                                        jumpRateModelAddress,
                                        initialExchangeRateMantissa,
                                        name,
                                        symbol,
                                        decimals,
                                        admin,
                                        {from:deployMaster}).then(function(){
            console.log("bPrimaryIndexToken called init at "+bPrimaryIndexTokenProxyAddress);
        });

        await bPrimaryIndexToken.setPrimaryIndexToken(primaryIndexTokenAddress,{from:deployMaster}).then(function(){
            console.log("Set primaryIndexToken for bPrimaryIndexToken at "+bPrimaryIndexTokenProxyAddress);
        });
       
        let simplePriceOracle = await SimplePriceOracle.at(simplePriceOracleAddress);
        await simplePriceOracle.setUnderlyingPrice(bPrimaryIndexTokenProxyAddress, multiplier18, {from:deployMaster}).then(function(){
            console.log("set underlying price of bPrimaryIndexToken at "+simplePriceOracleAddress);
        });
        
        
        let comptroller = await Comptroller.at(comptrollerAddress);
        await comptroller._supportMarket(bPrimaryIndexTokenProxyAddress,{from:deployMaster}).then(function(){
            console.log("Comptroller support market "+bPrimaryIndexTokenProxyAddress);
        });
        
        let collateralFactor = multiplier18//.div(new BN(2));
        let collfacres = await comptroller._setCollateralFactor(bPrimaryIndexTokenProxyAddress, collateralFactor, {from:deployMaster}).then(function(){
            console.log("Collateral factor set: "+collateralFactor);
        });
        // console.log(collfacres);
        // console.log(collfacres['logs']['0']['args']);
        
        let primaryIndexToken = await PrimaryIndexToken.at(primaryIndexTokenAddress);
        await primaryIndexToken.setCPrimaryIndexToken(bPrimaryIndexTokenProxyAddress,{from:deployMaster}).then(function(){
            console.log("Primary Index Token set bPrimaryIndexToken at "+primaryIndexTokenAddress);
        });

       
    }

};