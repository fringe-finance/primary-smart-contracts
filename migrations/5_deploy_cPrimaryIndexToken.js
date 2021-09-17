
const ProxyAdmin = artifacts.require("ProxyAdmin");
const TransparentUpgradeableProxy = artifacts.require("TransparentUpgradeableProxy");
const PrimaryIndexToken = artifacts.require("PrimaryIndexToken");
const Comptroller = artifacts.require("Comptroller");
const SimplePriceOracle = artifacts.require("SimplePriceOracle");
const JumpRateModelV2 = artifacts.require("JumpRateModelV2");
const CPrimaryIndexToken = artifacts.require("CPrimaryIndexToken");
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
    
        let proxyAdminAddress = ProxyAdmin.address;//'0xabb233Bc373D8e61179B33152f8b9C3C0F8262Ba';//
        let primaryIndexTokenAddress = JSON.parse(fs.readFileSync('migrations/primaryIndexTokenProxyAddress.json', 'utf8')).primaryIndexTokenProxyAddress;//'0xA33652B9d55a5c061316c2D1B749a1C98e51C001';//
        let comptrollerAddress = JSON.parse(fs.readFileSync('migrations/comptrollerProxyAddress.json', 'utf8')).comptrollerProxyAddress;//'0xC0f988FDa256C92cA28e78F4be85F711b5209945';//
        let jumpRateModelAddress = JumpRateModelV2.address;//'0x8ADb2bb3292e8880C0E76Caa4DfFAe5e5F23f7BB';//
        let simplePriceOracleAddress = JSON.parse(fs.readFileSync('migrations/simplePriceOracleProxyAddress.json', 'utf8')).simplePriceOracleProxyAddress;;//'0xd84111ba8FcFd6ffcbA858702289c3E0E93386ea';//
        let initialExchangeRateMantissa = multiplier18.mul(new BN(1));//.div(new BN(100));
        let name = "cPrimaryIndexToken";
        let symbol = "cPIT";
        let decimals = new BN(8);
        let admin = deployMaster;


        let cPrimaryIndexTokenMasterCopyAddress;
        await deployer.deploy(CPrimaryIndexToken,{from:deployMaster}).then(function (instance) {
            cPrimaryIndexTokenMasterCopyAddress = instance.address;
            console.log("cPrimaryIndexToken master copy address: "+instance.address);
        });

        let cPrimaryIndexTokenProxyAddress;   
        await deployer.deploy(  TransparentUpgradeableProxy,
                                cPrimaryIndexTokenMasterCopyAddress, 
                                proxyAdminAddress,
                                web3.utils.hexToBytes('0x'),
                                {from:deployMaster})
            .then(function(instance){
                cPrimaryIndexTokenProxyAddress = instance.address;
                console.log ("cPrimaryIndexToken Proxy Instance Address: "+ instance.address);
        });

        let data = {
            "cPrimaryIndexTokenProxyAddress":cPrimaryIndexTokenProxyAddress
        }
        fs.writeFileSync('migrations/cPrimaryIndexTokenProxyAddress.json', JSON.stringify(data, null, '\t'));
        

        let cPrimaryIndexToken = await CPrimaryIndexToken.at(cPrimaryIndexTokenProxyAddress);
        await cPrimaryIndexToken.init(  primaryIndexTokenAddress,
                                        comptrollerAddress,
                                        jumpRateModelAddress,
                                        initialExchangeRateMantissa,
                                        name,
                                        symbol,
                                        decimals,
                                        admin,
                                        {from:deployMaster}).then(function(){
            console.log("cPrimaryIndexToken called init at "+cPrimaryIndexTokenProxyAddress);
        });

        await cPrimaryIndexToken.setPrimaryIndexToken(primaryIndexTokenAddress,{from:deployMaster}).then(function(){
            console.log("Set primaryIndexToken for cPrimaryIndexToken at "+cPrimaryIndexTokenProxyAddress);
        });
       
        let simplePriceOracle = await SimplePriceOracle.at(simplePriceOracleAddress);
        await simplePriceOracle.setUnderlyingPrice(cPrimaryIndexTokenProxyAddress, multiplier18, {from:deployMaster});
        
        
        let comptroller = await Comptroller.at(comptrollerAddress);
        await comptroller._supportMarket(cPrimaryIndexTokenProxyAddress,{from:deployMaster});
        console.log("Comptroller support market "+cPrimaryIndexTokenProxyAddress);
        let collateralFactor = multiplier18//.div(new BN(2));
        let collfacres = await comptroller._setCollateralFactor(cPrimaryIndexTokenProxyAddress, collateralFactor, {from:deployMaster});
        // console.log(collfacres);
        // console.log(collfacres['logs']['0']['args']);
        console.log("Collateral factor set: "+collateralFactor);


        let primaryIndexToken = await PrimaryIndexToken.at(primaryIndexTokenAddress);
        await primaryIndexToken.setCPrimaryIndexToken(cPrimaryIndexTokenProxyAddress,{from:deployMaster});

       
    }

};