const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

module.exports = {
   
    deploymentAndSettingPrimaryLendingPlatform : async function (input_proxyAdminAddress, input_priceOracleAddress) {
        let network = await hre.network;
        console.log("Network name: "+network.name);
       
        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        let deployMasterAddress = deployMaster.address;
        console.log("DeployMaster: " + deployMasterAddress);

        // Contracts ABI
        let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
        let TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
        let JumpRateModelV2 = await hre.ethers.getContractFactory("JumpRateModelV2");
        let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
        let BLendingToken = await hre.ethers.getContractFactory("BLendingToken");
        let PrimaryIndexToken = await hre.ethers.getContractFactory("PrimaryIndexToken");

        let jumpRateModelV2;
        let bondtroller;
        let busdc;
        let pit;

        let jumpRateModelV2Address;
        let bondtrollerAddress;
        let busdcAddress;
        let pitAddress;

        const {
            borrowLimit
        } = require("../config.js");

    //====================================================
    //deploy proxy admin

        console.log();
        console.log("***** PROXY ADMIN DEPLOYMENT *****");
        if(input_proxyAdminAddress == undefined){
            proxyAdmin = await ProxyAdmin.connect(deployMaster).deploy();
            await proxyAdmin.deployed();
            proxyAdminAddress = proxyAdmin.address;
            console.log("ProxyAdmin deployed at: " + proxyAdminAddress);
        }else{
            proxyAdminAddress = input_proxyAdminAddress;
            console.log("ProxyAdmin is deployed at: " + input_proxyAdminAddress);
        }

    //====================================================

        console.log();
        console.log("***** JUMP RATE MODELV2 DEPLOYMENT *****");
        let multiplier = toBN(10).pow(toBN(18));
        let baseRatePerBlock = toBN(9512937595);
        let blocksPerYear = toBN(2102400);
        let jumpMultiplierPerBlock = toBN(1902587519025);
        let multiplierPerBlock = toBN(107020547945);
        let kink = toBN("800000000000000000");

        let baseRatePerYear = baseRatePerBlock.mul(blocksPerYear);
        let multiplierPerYear = multiplierPerBlock.mul(blocksPerYear.mul(kink)).div(multiplier);
        let jumpMultiplierPerYear = jumpMultiplierPerBlock.mul(blocksPerYear);
        let owner = deployMasterAddress;

        jumpRateModelV2 = await JumpRateModelV2.connect(deployMaster).deploy(
            baseRatePerYear,
            multiplierPerYear,
            jumpMultiplierPerYear,
            kink,
            owner,
        );
        await jumpRateModelV2.deployed();
        let jumpRateModelV2MasterCopyAddress = jumpRateModelV2.address;
        console.log("JumpRateModelV2 masterCopy address: " + jumpRateModelV2MasterCopyAddress);
        jumpRateModelV2Address = jumpRateModelV2MasterCopyAddress;

        // let jumpRateModelV2Proxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
        //     usbControllerMasterCopyAddress,
        //     proxyAdminAddress,
        //     "0x"
        // );
        // await jumpRateModelV2Proxy.deployed();
        // let jumpRateModelV2ProxyAddress = jumpRateModelV2Proxy.address;
        // console.log("JumpRateModelV2 proxy address: " + jumpRateModelV2ProxyAddress);
        // jumpRateModelV2Address = jumpRateModelV2ProxyAddress;

    //====================================================
        console.log();
        console.log("***** BONDTROLLER DEPLOYMENT *****");
        bondtroller = await Bondtroller.connect(deployMaster).deploy();
        await bondtroller.deployed();
        let bondtrollerMasterCopyAddress = bondtroller.address;
        console.log("Bondtroller masterCopy address: " + bondtrollerMasterCopyAddress);
        bondtrollerAddress = bondtrollerMasterCopyAddress;

        let bondtrollerProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            bondtrollerMasterCopyAddress,
            proxyAdminAddress,
            "0x"
        );
        await bondtrollerProxy.deployed();
        let bondtrollerProxyAddress = bondtrollerProxy.address;
        console.log("Bondtroller proxy address: " + bondtrollerProxyAddress);
        bondtrollerAddress = bondtrollerProxyAddress;

        bondtroller = await Bondtroller.attach(bondtrollerAddress).connect(deployMaster);
        
        await bondtroller.init().then(function(){
            console.log("Bondtroller call init at " + bondtrollerAddress);
        });

    //====================================================

        console.log();
        console.log("***** BUSDC DEPLOYMENT *****");

        busdc = await BLendingToken.connect(deployMaster).deploy();
        await busdc.deployed();
        let busdcMasterCopyAddress = busdc.address;
        console.log("BLendingToken masterCopy address: " + busdcMasterCopyAddress);
        busdcAddress = busdcMasterCopyAddress;

        let busdcProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            busdcMasterCopyAddress,
            proxyAdminAddress,
            "0x"
        );
        await busdcProxy.deployed();
        let busdcProxyAddress = busdcProxy.address;
        console.log("BLendingToken proxy address: " + busdcProxyAddress);
        busdcAddress = busdcProxyAddress;

        busdc = await BLendingToken.attach(busdcAddress).connect(deployMaster);
        
        let usdctestAddress = '0x5236aAB9f4b49Bfd93a9500E427B042f65005E6A';
        let initialExchangeRateMantissa = toBN(10).pow(toBN(18));
        let reserveFactorMantissa = toBN(25).mul(toBN(10).pow(toBN(16)));//same as cAAVE
        let name = "bUSDC Test Token";
        let symbol = "bUSDCTest";
        let decimals = toBN(6);
        let admin = deployMasterAddress;

        await busdc.init(
            usdctestAddress,
            bondtrollerAddress,
            jumpRateModelV2Address,
            initialExchangeRateMantissa,
            name,
            symbol,
            decimals,
            admin
        ).then(function(){
            console.log("BUSDC call init at " + busdcAddress);
        });

        await busdc.setReserveFactor(reserveFactorMantissa).then(function(){
            console.log("BUSDC set reserve factor " + reserveFactorMantissa);
        });

        await bondtroller.supportMarket(busdcAddress).then(function(){
            console.log("Bondtroller support market " + busdcAddress);
        });

        //====================================================

        pit = await PrimaryIndexToken.connect(deployMaster).deploy();
        await pit.deployed();
        let pitMasterCopyAddress = pit.address;
        console.log("PrimaryIndexToken masterCopy address: " + pitMasterCopyAddress);
        pitAddress = pitMasterCopyAddress;

        let pitProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            pitMasterCopyAddress,
            proxyAdminAddress,
            "0x"
        );
        await pitProxy.deployed();
        let pitProxyAddress = pitProxy.address;
        console.log("PrimaryIndexToken proxy address: " + pitProxyAddress);
        pitAddress = pitProxyAddress;

        pit = await PrimaryIndexToken.attach(pitAddress).connect(deployMaster);

        let basicTokenAddress = '0x5236aAB9f4b49Bfd93a9500E427B042f65005E6A';
        let moderatorAddress = deployMasterAddress;
        let lvrNumerator = toBN(6);
        let lvrDenominator = toBN(10);
        let ltfNumerator = toBN(1);
        let ltfDenominator = toBN(1);
        let saleNumerator = toBN(8);
        let saleDenominator = toBN(10);

        let PRJsAddresses = [
            '0x40EA2e5c5b2104124944282d8db39C5D13ac6770',//PRJ1
            '0x69648Ef43B7496B1582E900569cd9dDEc49C045e',//PRJ2
            '0xfA91A86700508806AD2A49Bebce34a08c6ad7a65',//PRJ3
            '0xc6636b088AB0f794DDfc1204e7C58D8148f62203',//PRJ4
            '0x37a7D483d2dfe97d0C00cEf6F257e25d321e6D4e',//PRJ5
            '0x16E2f279A9BabD4CE133745DdA69C910CBe2e490' //PRJ6
            ];

        await pit.init(basicTokenAddress,moderatorAddress).then(function(){
            console.log("PrimaryIndexToken call initialize at " + pitAddress)
        });

        await pit.setPriceOracle(input_priceOracleAddress).then(function(){
            console.log("PrimaryIndexToken set priceOracle: " + input_priceOracleAddress);
        });

        for(var i = 0; i < PRJsAddresses.length; i++){
            await pit.addProjectToken(  PRJsAddresses[i],
                                        lvrNumerator,lvrDenominator,
                                        ltfNumerator,ltfDenominator,
                                        saleNumerator,saleDenominator,
                                        );
            console.log("Added prj token: "+PRJsAddresses[i]+" with values:");
            console.log("   Numerator:   "+lvrNumerator);
            console.log("   Denominator: "+lvrDenominator);
        }

        await pit.addLendingToken(basicTokenAddress, busdcAddress)
        .then(function(){
            console.log("Added lending token: "+basicTokenAddress);
        });

        await bondtroller.setPrimaryIndexTokenAddress(pitAddress).then(function(){
            console.log("Bondtroller " + bondtrollerAddress + " set PrimaryIndexToken "+ pitAddress);
        });

        await busdc.setPrimaryIndexToken(pitAddress).then(function(){
            console.log("BUSDC " + busdcAddress +" set primaryIndexToken " + pitAddress);
        });

        // for(var i = 0; i < PRJsAddresses.length; i++){
        //     await busdc.setBorrowLimit(PRJsAddresses[i], borrowLimit)
        //     .then(function(){
        //         console.log("BUSDC set " + PRJsAddresses[i] + " borrow limit " + borrowLimit);
        //     });
        // }
        return {
            bondtrollerAddress: bondtrollerAddress,
            busdcAddress: busdcAddress,
            pitAddress: pitAddress,
        }
        
    }


};
