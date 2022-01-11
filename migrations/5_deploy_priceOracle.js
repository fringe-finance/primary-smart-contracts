const ProxyAdmin = artifacts.require("ProxyAdmin");
const TransparentUpgradeableProxy = artifacts.require("TransparentUpgradeableProxy");
const Bondtroller = artifacts.require("Bondtroller");
const BUSDC = artifacts.require("BUSDC");
const PrimaryIndexToken = artifacts.require("PrimaryIndexToken");

const ChainlinkPriceProvider = artifacts.require("ChainlinkPriceProvider");
const BackendPriceProvider = artifacts.require("BackendPriceProvider");
const UniswapV2PriceProvider = artifacts.require("UniswapV2PriceProvider");
const PriceProviderAggregator = artifacts.require("PriceProviderAggregator");

const BN = web3.utils.BN;
const fs = require('fs');

module.exports = async function (deployer,network,accounts) {
    
    let deployMaster = accounts[0];
    
    console.log("Network: "+network);
    console.log("DEPLOYMASTER: "+deployMaster);

    let proxyAdminAddress;
    let bBasicTokenAddress;
    let bondtrollerAddress;
    let priceOracleAddress;
    let primaryIndexTokenAddress;
    let bUsdcAddress;

    let chainlinkPriceProviderProxyAddress;
    let backendPriceProviderProxyAddress;
    let uniswapV2PriceProviderProxyAddress;
    let priceProviderAggregatorProxyAddress;

    proxyAdminAddress = JSON.parse(fs.readFileSync('migrations/addresses/proxyAdminAddress.json', 'utf8')).proxyAdminAddress;
    bUsdcAddress = JSON.parse(fs.readFileSync('migrations/addresses/bUsdcProxyAddress.json', 'utf8')).bUsdcProxyAddress;
    bondtrollerAddress = JSON.parse(fs.readFileSync('migrations/addresses/bondtrollerProxyAddress.json', 'utf8')).bondtrollerProxyAddress;
    bBasicTokenAddress = JSON.parse(fs.readFileSync('migrations/addresses/bUsdcProxyAddress.json', 'utf8')).bUsdcProxyAddress;
    primaryIndexTokenAddress = JSON.parse(fs.readFileSync('migrations/addresses/primaryIndexTokenProxyAddress.json', 'utf8')).primaryIndexTokenProxyAddress;
    

//=========================================================

    if(network == "rinkeby" || network == "rinkeby-fork" || network == "testrinkeby"){
        let prj1Address = '0x40EA2e5c5b2104124944282d8db39C5D13ac6770';
        let prj2Address = '0x69648Ef43B7496B1582E900569cd9dDEc49C045e';
        let prj3Address = '0xfA91A86700508806AD2A49Bebce34a08c6ad7a65';
        let prj4Address = '0xc6636b088AB0f794DDfc1204e7C58D8148f62203';
        let prj5Address = '0x37a7D483d2dfe97d0C00cEf6F257e25d321e6D4e';
        let prj6Address = '0x16E2f279A9BabD4CE133745DdA69C910CBe2e490';

        let uniswapPairPrj1Address = '0x1E27b2397f5faF5A3e7C318264e605f8DF7e5DeA';
        let uniswapPairPrj2Address = '0x271509D9645e04d45801dd4D2Ce6D4b5001762d1';
        let uniswapPairPrj3Address = '0xE2E11D0F0D0C8Ca05f223c4a83Bb8eAC50fC9673';
        let uniswapPairPrj4Address = '0x6D5e5B430A5ae439c7D5892E26bD539E3b5f8e77';
        let uniswapPairPrj5Address = '0x27990Ad43692469531Bf4f8A7f44822A4AE813e0';
        let uniswapPairPrj6Address = '0xe5Eb9A95a9b71aEE01914AE2F6C3dCCcB7aC1791';
    
        let WETHrinkeby = '0xc778417e063141139fce010982780140aa0cd5ab'; // https://rinkeby.etherscan.io/token/0xc778417e063141139fce010982780140aa0cd5ab
        let chainlinkAggregatorV3_WETHrinkeby = '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e'; // https://docs.chain.link/docs/ethereum-addresses/#Rinkeby%20Testnet
        //--------------
        // let chainlinkPriceProviderMasterCopyAddress;
        // await deployer.deploy(ChainlinkPriceProvider,{from:deployMaster})
        // .then(function(instance){
        //     console.log("ChainlinkPriceProvider master copy: "+instance.address);
        //     chainlinkPriceProviderMasterCopyAddress = instance.address;
        // });

        // await deployer.deploy(  TransparentUpgradeableProxy,
        //                         chainlinkPriceProviderMasterCopyAddress, 
        //                         proxyAdminAddress,
        //                         web3.utils.hexToBytes('0x'),
        //                         {from:deployMaster})
        // .then(function(instance){
        //     console.log ("ChainlinkPriceProvider Proxy Instance Address: "+ instance.address);
        //     chainlinkPriceProviderProxyAddress = instance.address;
        // });

        // let chainlinkPriceProviderProxyAddress_data = {
        //     "chainlinkPriceProviderProxyAddress":chainlinkPriceProviderProxyAddress
        // }
        // fs.writeFileSync('migrations/addresses/chainlinkPriceProviderProxyAddress.json', JSON.stringify(chainlinkPriceProviderProxyAddress_data, null, '\t'));

        // //--------------
        // let backendPriceProviderMasterCopyAddress;
        // await deployer.deploy(BackendPriceProvider,{from:deployMaster})
        // .then(function(instance){
        //     console.log("BackendPriceProvider master copy: "+instance.address);
        //     backendPriceProviderMasterCopyAddress = instance.address;
        // });

        // await deployer.deploy(  TransparentUpgradeableProxy,
        //                         backendPriceProviderMasterCopyAddress, 
        //                         proxyAdminAddress,
        //                         web3.utils.hexToBytes('0x'),
        //                         {from:deployMaster})
        // .then(function(instance){
        //     console.log ("BackendPriceProvider Proxy Instance Address: "+ instance.address);
        //     backendPriceProviderProxyAddress = instance.address;
        // });

        // let backendPriceProviderProxyAddress_data = {
        //     "backendPriceProviderProxyAddress":backendPriceProviderProxyAddress
        // }
        // fs.writeFileSync('migrations/addresses/backendPriceProviderProxyAddress.json', JSON.stringify(backendPriceProviderProxyAddress_data, null, '\t'));


        // //--------------
        // let uniswapV2PriceProviderMasterCopyAddress;
        // await deployer.deploy(UniswapV2PriceProvider,{from:deployMaster})
        // .then(function(instance){
        //     console.log("UniswapV2PriceProvider master copy: "+instance.address);
        //     uniswapV2PriceProviderMasterCopyAddress = instance.address;
        // });

        // await deployer.deploy(  TransparentUpgradeableProxy,
        //                         uniswapV2PriceProviderMasterCopyAddress, 
        //                         proxyAdminAddress,
        //                         web3.utils.hexToBytes('0x'),
        //                         {from:deployMaster})
        // .then(function(instance){
        //     console.log ("UniswapV2PriceProvider Proxy Instance Address: "+ instance.address);
        //     uniswapV2PriceProviderProxyAddress = instance.address;
        // });

        // let uniswapV2PriceProviderProxyAddress_data = {
        //     "uniswapV2PriceProviderProxyAddress":uniswapV2PriceProviderProxyAddress
        // }
        // fs.writeFileSync('migrations/addresses/uniswapV2PriceProviderProxyAddress.json', JSON.stringify(uniswapV2PriceProviderProxyAddress_data, null, '\t'));


        // //--------------
        // let priceProviderAggregatorMasterCopyAddress;
        // await deployer.deploy(PriceProviderAggregator,{from:deployMaster})
        // .then(function(instance){
        //     console.log("PriceProviderAggregator master copy: "+instance.address);
        //     priceProviderAggregatorMasterCopyAddress = instance.address;
        // });

        
        // await deployer.deploy(  TransparentUpgradeableProxy,
        //                         priceProviderAggregatorMasterCopyAddress, 
        //                         proxyAdminAddress,
        //                         web3.utils.hexToBytes('0x'),
        //                         {from:deployMaster})
        // .then(function(instance){
        //     console.log ("PriceProviderAggregator Proxy Instance Address: "+ instance.address);
        //     priceProviderAggregatorProxyAddress = instance.address;
        // });

        // let priceProviderAggregatorProxyAddress_data = {
        //     "priceProviderAggregatorProxyAddress":priceProviderAggregatorProxyAddress
        // }
        // fs.writeFileSync('migrations/addresses/priceProviderAggregatorProxyAddress.json', JSON.stringify(priceProviderAggregatorProxyAddress_data, null, '\t'));


        //--------------

        chainlinkPriceProviderProxyAddress = JSON.parse(fs.readFileSync('migrations/addresses/chainlinkPriceProviderProxyAddress.json', 'utf8')).chainlinkPriceProviderProxyAddress;
        backendPriceProviderProxyAddress = JSON.parse(fs.readFileSync('migrations/addresses/backendPriceProviderProxyAddress.json', 'utf8')).backendPriceProviderProxyAddress;
        uniswapV2PriceProviderProxyAddress = JSON.parse(fs.readFileSync('migrations/addresses/uniswapV2PriceProviderProxyAddress.json', 'utf8')).uniswapV2PriceProviderProxyAddress;
        priceProviderAggregatorProxyAddress = JSON.parse(fs.readFileSync('migrations/addresses/priceProviderAggregatorProxyAddress.json', 'utf8')).priceProviderAggregatorProxyAddress;

        console.log();
        console.log("***** SETTING CHAINLINK PRICE PROVIDER *****");

        // let chainlinkPriceProvider = await ChainlinkPriceProvider.at(chainlinkPriceProviderProxyAddress);
        // await chainlinkPriceProvider.initialize({from:deployMaster})
        // .then(function(){
        //     console.log("ChainlinkPriceProvider calls initialize at "+ chainlinkPriceProviderProxyAddress);
        // });

        // await chainlinkPriceProvider.grandModerator(priceProviderAggregatorProxyAddress,{from:deployMaster})
        // .then(function(){
        //     console.log("ChainlinkPriceProvider granded moderator: "+ priceProviderAggregatorProxyAddress);
        // });

        // await chainlinkPriceProvider.setTokenAndAggregator(WETHrinkeby, chainlinkAggregatorV3_WETHrinkeby,{from:deployMaster})
        // .then(function(){
        //     console.log("ChainlinkPriceProvider set token "+ WETHrinkeby +" and aggregator " + chainlinkAggregatorV3_WETHrinkeby);
        // });
        //--------------
        console.log();
        console.log("***** SETTING BACKEND PRICE PROVIDER *****");

        let backendPriceProvider = await BackendPriceProvider.at(backendPriceProviderProxyAddress);

        // await backendPriceProvider.initialize({from:deployMaster})
        // .then(function(){
        //     console.log("BackendPriceProvider initialized at " + backendPriceProviderProxyAddress);
        // });

        // await backendPriceProvider.grandTrustedBackendRole(deployMaster, {from:deployMaster})
        // .then(function(){
        //     console.log("BackendPriceProvider set trusted backend " + deployMaster);
        // });

        let backendToken1 = WETHrinkeby;
        await backendPriceProvider.setToken(backendToken1, {from:deployMaster})
        .then(function(){
            console.log("BackendPriceProvider set token " + backendToken1)
        });
        //--------------
        console.log();
        console.log("***** SETTING UNISWAPV2 PRICE PROVIDER *****");

         let uniswapV2PriceProvider = await UniswapV2PriceProvider.at(uniswapV2PriceProviderProxyAddress);

        // await uniswapV2PriceProvider.initialize({from:deployMaster})
        // .then(function(){
        //     console.log("UniswapV2PriceProvider initialized at "+ uniswapV2PriceProviderProxyAddress);
        // });

        // await uniswapV2PriceProvider.grandModerator(priceProviderAggregatorProxyAddress, {from:deployMaster})
        // .then(function(){
        //     console.log("UniswapV2PriceProvider granded moderator " + priceProviderAggregatorProxyAddress);
        // });

        // await uniswapV2PriceProvider.setTokenAndPair(prj1Address, uniswapPairPrj1Address, {from:deployMaster})
        // .then(function(){
        //     console.log("UniswapV2PriceProvider set token "+ prj1Address + " and pair "+ uniswapPairPrj1Address);
        // });

        // await uniswapV2PriceProvider.setTokenAndPair(prj2Address, uniswapPairPrj2Address, {from:deployMaster})
        // .then(function(){
        //     console.log("UniswapV2PriceProvider set token "+ prj2Address+" and pair "+ uniswapPairPrj2Address);
        // });

        // await uniswapV2PriceProvider.setTokenAndPair(prj3Address, uniswapPairPrj3Address, {from:deployMaster})
        // .then(function(){
        //     console.log("UniswapV2PriceProvider set token "+ prj3Address+" and pair "+ uniswapPairPrj3Address);
        // });

        // await uniswapV2PriceProvider.setTokenAndPair(prj4Address, uniswapPairPrj4Address, {from:deployMaster})
        // .then(function(){
        //     console.log("UniswapV2PriceProvider set token "+ prj4Address+" and pair "+ uniswapPairPrj4Address);
        // });

        // await uniswapV2PriceProvider.setTokenAndPair(prj5Address, uniswapPairPrj5Address, {from:deployMaster})
        // .then(function(){
        //     console.log("UniswapV2PriceProvider set token "+ prj5Address+" and pair "+ uniswapPairPrj5Address);
        // });

        // await uniswapV2PriceProvider.setTokenAndPair(prj6Address, uniswapPairPrj6Address, {from:deployMaster})
        // .then(function(){
        //     console.log("UniswapV2PriceProvider set token "+ prj6Address+" and pair "+ uniswapPairPrj6Address);
        // });
        //--------------
        console.log();
        console.log("***** SETTING USB PRICE ORACLE *****");

        let priceProviderAggregator = await PriceProviderAggregator.at(priceProviderAggregatorProxyAddress);

        // await priceProviderAggregator.initialize({from:deployMaster})
        // .then(function(){
        //     console.log("USBPriceOracle initialized at " + priceProviderAggregatorProxyAddress);
        // });

        // await priceProviderAggregator.grandModerator(deployMaster, {from:deployMaster})
        // .then(function(){
        //     console.log("USBPriceOracle granded moderator " + deployMaster);
        // });

        // await priceProviderAggregator.setTokenAndPriceProvider(WETHrinkeby, chainlinkPriceProviderProxyAddress, false)
        // .then(function(){
        //     console.log("USBPriceOracle set token "+ WETHrinkeby + " with priceOracle " + chainlinkPriceProviderProxyAddress);
        // });

        // await priceProviderAggregator.setTokenAndPriceProvider(prj1Address, uniswapV2PriceProviderProxyAddress, false)
        // .then(function(){
        //     console.log("USBPriceOracle set token "+ prj1Address + " with priceOracle " + uniswapV2PriceProviderProxyAddress);
        // });

        await priceProviderAggregator.setTokenAndPriceProvider(prj2Address, uniswapV2PriceProviderProxyAddress, false)
        .then(function(){
            console.log("USBPriceOracle set token "+ prj2Address + " with priceOracle " + uniswapV2PriceProviderProxyAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj3Address, uniswapV2PriceProviderProxyAddress, false)
        .then(function(){
            console.log("USBPriceOracle set token "+ prj3Address + " with priceOracle " + uniswapV2PriceProviderProxyAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj4Address, uniswapV2PriceProviderProxyAddress, false)
        .then(function(){
            console.log("USBPriceOracle set token "+ prj4Address + " with priceOracle " + uniswapV2PriceProviderProxyAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj5Address, uniswapV2PriceProviderProxyAddress, false)
        .then(function(){
            console.log("USBPriceOracle set token "+ prj5Address + " with priceOracle " + uniswapV2PriceProviderProxyAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj6Address, uniswapV2PriceProviderProxyAddress, false)
        .then(function(){
            console.log("USBPriceOracle set token "+ prj6Address + " with priceOracle " + uniswapV2PriceProviderProxyAddress);
        });

    }
    if(network == "mainnet" || network == "mainnet-fork" || network == "testmainnet"){

    }

//=========================================================

    priceOracleAddress = priceProviderAggregatorProxyAddress;

    let primaryIndexToken = await PrimaryIndexToken.at(primaryIndexTokenAddress);
    await primaryIndexToken.setPriceOracle(priceOracleAddress,{from:deployMaster}).then(function(){
        console.log("PrimaryIndexToken price oracle: "+priceOracleAddress);
    });

//=========================================================

    let bondtroller = await Bondtroller.at(bondtrollerAddress);
    await bondtroller.setPriceOracle(priceOracleAddress,{from:deployMaster}).then(function(){
        console.log("Bondtroller set price oracle: " + priceOracleAddress);
    })
    
   
};
