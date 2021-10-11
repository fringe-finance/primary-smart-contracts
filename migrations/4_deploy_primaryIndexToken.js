const PrimaryIndexToken = artifacts.require("PrimaryIndexToken");
const ProxyAdmin = artifacts.require("ProxyAdmin");
const TransparentUpgradeableProxy = artifacts.require("TransparentUpgradeableProxy");
const UniswapPathFinder = artifacts.require("UniswapPathFinder");
const Comptroller = artifacts.require("Comptroller");
const SimplePriceOracle = artifacts.require("SimplePriceOracle");
const BUSDC = artifacts.require("BUSDC");

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

    let proxyAdminAddress = JSON.parse(fs.readFileSync('migrations/proxyAdminAddress.json', 'utf8')).proxyAdminAddress;
    let uniswapRouterAddress;
//============================================================================

    if(network == 'testmainnet' || network == 'mainnet' || network == 'mainnet-fork'){
    }
    if(network == 'testrinkeby' || network == 'rinkeby'|| network == 'rinkeby-fork'){
        uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
    }
    let uniswapPathFinderMasterCopyAddress;
    await deployer.deploy(UniswapPathFinder,{from:deployMaster}).then(function(){
        console.log("UniswapPathFinder master copy: " , UniswapPathFinder.address);
        uniswapPathFinderMasterCopyAddress = UniswapPathFinder.address;
    });
    
    let uniswapPathFinderProxyAddress;
    await deployer.deploy(  TransparentUpgradeableProxy,
                            uniswapPathFinderMasterCopyAddress, 
                            proxyAdminAddress,
                            web3.utils.hexToBytes('0x'),
                            {from:deployMaster})
    .then(function(instance){
        console.log ("UniswapPathFinder Proxy Instance Address: "+ instance.address);
        uniswapPathFinderProxyAddress = instance.address;
    });

    const uniswapPathFinderProxyAddress_data = {
        "uniswapPathFinderProxyAddress": uniswapPathFinderProxyAddress
    }
    fs.writeFileSync('migrations/uniswapPathFinderProxyAddress.json', JSON.stringify(uniswapPathFinderProxyAddress_data, null, '\t'));


    let uniswapPathFinder = await UniswapPathFinder.at(uniswapPathFinderProxyAddress);
    
    await uniswapPathFinder.initialize(uniswapRouterAddress,{from:deployMaster}).then(function(){
        console.log ("UniswapPathFinder: call initialize at "+ uniswapPathFinderProxyAddress);
    });

//============================================================================

    let primaryIndexTokenMasterCopyAddress;
    await deployer.deploy(PrimaryIndexToken,{from:deployMaster})
    .then(function(instance){
        console.log("PrimaryIndexToken master copy: "+instance.address);
        primaryIndexTokenMasterCopyAddress = instance.address;
    });

    let primaryIndexTokenProxyAddress;
    await deployer.deploy(  TransparentUpgradeableProxy,
                            primaryIndexTokenMasterCopyAddress, 
                            proxyAdminAddress,
                            web3.utils.hexToBytes('0x'),
                            {from:deployMaster})
    .then(function(instance){
        console.log ("PrimaryIndexToken Proxy Instance Address: "+ instance.address);
        primaryIndexTokenProxyAddress = instance.address;
    });

    const data = {
        "primaryIndexTokenProxyAddress": primaryIndexTokenProxyAddress
    }
    fs.writeFileSync('migrations/primaryIndexTokenProxyAddress.json', JSON.stringify(data, null, '\t'));
    primaryIndexTokenProxyAddress = JSON.parse(fs.readFileSync('migrations/primaryIndexTokenProxyAddress.json', 'utf8')).primaryIndexTokenProxyAddress;
    let primaryIndexToken = await PrimaryIndexToken.at(primaryIndexTokenProxyAddress);
    let basicTokenAddress;
    let uniswapPathFinderAddress;
    let trustedForwarder;
    let bBasicTokenAddress;
    let comptrollerAddress;
    let priceOracleAddress;
    let bUsdcAddress;

    if(network == 'testmainnet' || network == 'mainnet' || network == 'mainnet-fork'){
    }
    if(network == 'testrinkeby' || network == 'rinkeby'|| network == 'rinkeby-fork'){
        //look at ProxyAdmin address!!!!
        basicTokenAddress = '0x5236aAB9f4b49Bfd93a9500E427B042f65005E6A';
        uniswapPathFinderAddress = JSON.parse(fs.readFileSync('migrations/uniswapPathFinderProxyAddress.json', 'utf8')).uniswapPathFinderProxyAddress;
        moderator = deployMaster;
        trustedForwarder = '0x83A54884bE4657706785D7309cf46B58FE5f6e8a';
        bUsdcAddress = JSON.parse(fs.readFileSync('migrations/bUsdcProxyAddress.json', 'utf8')).bUsdcProxyAddress;
        comptrollerAddress = JSON.parse(fs.readFileSync('migrations/comptrollerProxyAddress.json', 'utf8')).comptrollerProxyAddress;
        bBasicTokenAddress = JSON.parse(fs.readFileSync('migrations/bUsdcProxyAddress.json', 'utf8')).bUsdcProxyAddress;
        priceOracleAddress = JSON.parse(fs.readFileSync('migrations/simplePriceOracleProxyAddress.json', 'utf8')).simplePriceOracleProxyAddress;

        let PRJsAddresses = [
            '0x40EA2e5c5b2104124944282d8db39C5D13ac6770',//PRJ1
            '0x69648Ef43B7496B1582E900569cd9dDEc49C045e',//PRJ2
            '0xfA91A86700508806AD2A49Bebce34a08c6ad7a65',//PRJ3
            '0xc6636b088AB0f794DDfc1204e7C58D8148f62203',//PRJ4
            '0x37a7D483d2dfe97d0C00cEf6F257e25d321e6D4e',//PRJ5
            '0x16E2f279A9BabD4CE133745DdA69C910CBe2e490' //PRJ6
            ];
        let lvrNumerator = new BN(6);
        let lvrDenominator = new BN(10);
        let ltfNumerator = new BN(12);
        let ltfDenominator = new BN(10);
        let saleNumerator = new BN(8);
        let saleDenominator = new BN(10);

        await primaryIndexToken.init(basicTokenAddress, uniswapPathFinderAddress, moderator, trustedForwarder, {from:deployMaster});

        for(var i = 0; i < PRJsAddresses.length; i++){
            await primaryIndexToken.addPrjToken(PRJsAddresses[i],
                                                lvrNumerator,lvrDenominator,
                                                ltfNumerator,ltfDenominator,
                                                saleNumerator,saleDenominator,
                                                {from:deployMaster});
            console.log("Added prj token: "+PRJsAddresses[i]+" with values:");
            console.log("   Numerator:   "+lvrNumerator);
            console.log("   Denominator: "+lvrDenominator);
        }

       
        await primaryIndexToken.addLendingToken(basicTokenAddress,{from:deployMaster}).then(function(){
            console.log("Added lending token: "+basicTokenAddress);
        });
        

        await primaryIndexToken.addCLendingToken(basicTokenAddress, bBasicTokenAddress, {from:deployMaster}).then(function(){
            console.log("Added bLending token: "+bBasicTokenAddress);
        });
        

        await primaryIndexToken.setComptroller(comptrollerAddress,{from:deployMaster}).then(function(){
            console.log("Set comptroller: "+comptrollerAddress);
        });
        
       
        await primaryIndexToken.setPriceOracle(priceOracleAddress,{from:deployMaster}).then(function(){
            console.log("Set price oracle: "+priceOracleAddress);
        });
       

        let comptroller = await Comptroller.at(comptrollerAddress);
        await comptroller._setPrimaryIndexTokenAddress(primaryIndexTokenProxyAddress,{from:deployMaster}).then(function(){
            console.log("comptroller setPrimaryIndexToken at "+comptrollerAddress);
        });
        
        let bUsdc = await BUSDC.at(bUsdcAddress);
        await bUsdc.setPrimaryIndexToken(primaryIndexTokenProxyAddress,{from:deployMaster}).then(function(){
            console.log("cUsdc set primaryIndexToken at "+bUsdcAddress);
        });
        
    }
//============================================================================
   

   
};
