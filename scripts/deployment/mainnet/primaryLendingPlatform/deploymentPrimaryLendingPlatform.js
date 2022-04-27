const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

module.exports = {
   
    deploymentPrimaryLendingPlatform : async function (input_primaryLendingPlatformProxyAdminAddress, input_priceOracleAddress) {
        let network = await hre.network;
        console.log("Network name: "+network.name);
       
        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        let deployMasterAddress = deployMaster.address;

        console.log("DeployMaster: " + deployMasterAddress);

        // Contracts ABI
        let PrimaryLendingPlatformProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        let TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
        let JumpRateModelV2 = await hre.ethers.getContractFactory("JumpRateModelV2");
        let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
        let BLendingToken = await hre.ethers.getContractFactory("BLendingToken");
        let PrimaryIndexToken = await hre.ethers.getContractFactory("PrimaryIndexToken");

        let jumpRateModelV2
        let bondtroller
        let busdc
        let primaryIndexToken

        let proxyAdminAddress
        let jumpRateModelV2Address
        let bondtrollerAddress
        let busdcAddress
        let primaryIndexTokenAddress
        let priceOracleAddress


        let {
            multiplier,
            baseRatePerBlock,
            blocksPerYear,
            jumpMultiplierPerBlock,
            multiplierPerBlock,
            kink,
            
            USDC,
            USDCmultiplier,

            // initialExchangeRateMantissa,
            // reserveFactorMantissa,
            // name,
            // symbol,
            // decimals,

            MATIC,
            REN,
            LINK,
            OGN,

            MATIC_loanToValueRatioNumerator,
            MATIC_loanToValueRatioDenominator,
            MATIC_liquidationTresholdFactorNumerator,
            MATIC_liquidationTresholdFactorDenominator,
            MATIC_liquidationIncentiveNumerator,
            MATIC_liquidationIncentiveDenominator,
            MATIC_borrowLimit,
            
            LINK_loanToValueRatioNumerator,
            LINK_loanToValueRatioDenominator,
            LINK_liquidationTresholdFactorNumerator,
            LINK_liquidationTresholdFactorDenominator,
            LINK_liquidationIncentiveNumerator,
            LINK_liquidationIncentiveDenominator,
            LINK_borrowLimit,
        
            REN_loanToValueRatioNumerator,
            REN_loanToValueRatioDenominator,
            REN_liquidationTresholdFactorNumerator,
            REN_liquidationTresholdFactorDenominator,
            REN_liquidationIncentiveNumerator,
            REN_liquidationIncentiveDenominator,
            REN_borrowLimit,

            OGN_loanToValueRatioNumerator,
            OGN_loanToValueRatioDenominator,
            OGN_liquidationTresholdFactorNumerator,
            OGN_liquidationTresholdFactorDenominator,
            OGN_liquidationIncentiveNumerator,
            OGN_liquidationIncentiveDenominator,
            OGN_borrowLimit
            
        } = require("../config.js");

    //====================================================
    //deploy proxy admin

        console.log();
        console.log("***** PRIMARY LENDING PLATFORM PROXY ADMIN DEPLOYMENT *****");
        if(input_primaryLendingPlatformProxyAdminAddress == undefined){
            primaryLendingPlatformProxyAdmin = await PrimaryLendingPlatformProxyAdmin.connect(deployMaster).deploy();
            await primaryLendingPlatformProxyAdmin.deployed()
            .then(function(instance){
                console.log("\nTransaction hash: " + instance.deployTransaction.hash);
                console.log("PrimaryLendingPlatformProxyAdmin deployed at: " + instance.address);
            });
            proxyAdminAddress = primaryLendingPlatformProxyAdmin.address;
            
        }else{
            console.log("PrimaryLendingPlatformProxyAdmin is deployed at: " + input_primaryLendingPlatformProxyAdminAddress);
            proxyAdminAddress = input_primaryLendingPlatformProxyAdminAddress
        }   

    //====================================================
    //deploy price oracle

        console.log();
        console.log("***** PRICE ORACLE DEPLOYMENT *****");
        if (input_priceOracleAddress == undefined) {
            const { deploymentPriceProividerAggregator } = require('../priceOracle/deploymentPriceProividerAggregator.js')
            let priceOracleAddresses = await deploymentPriceProividerAggregator(proxyAdminAddress)
            priceOracleAddress = priceOracleAddresses.priceProviderAggregatorAddress
        } else {
            priceOracleAddress = input_priceOracleAddress;
            console.log("PriceOracle is deployed at: " + input_priceOracleAddress);
        }

    //====================================================

        console.log();
        console.log("***** JUMP RATE MODELV2 DEPLOYMENT *****");
        // let multiplier = toBN(10).pow(toBN(18));
        // let baseRatePerBlock = toBN(9512937595);
        // let blocksPerYear = toBN(2102400);
        // let jumpMultiplierPerBlock = toBN(1902587519025);
        // let multiplierPerBlock = toBN(107020547945);
        // let kink = toBN("800000000000000000");

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
        await jumpRateModelV2.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("JumpRateModelV2 masterCopy address: " + instance.address);
        });
        let jumpRateModelV2MasterCopyAddress = jumpRateModelV2.address;

        let jumpRateModelV2Proxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            jumpRateModelV2MasterCopyAddress,
            proxyAdminAddress,
            "0x"
        );
        await jumpRateModelV2Proxy.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("JumpRateModelV2 proxy address: " + instance.address);
        });
        let jumpRateModelV2ProxyAddress = jumpRateModelV2Proxy.address;
        jumpRateModelV2Address = jumpRateModelV2ProxyAddress;

    //====================================================
    //deploy Bondtroller

        console.log();
        console.log("***** BONDTROLLER DEPLOYMENT *****");

        bondtroller = await Bondtroller.connect(deployMaster).deploy();
        await bondtroller.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("Bondtroller masterCopy address: " + instance.address);
        });
        let bondtrollerMasterCopyAddress = bondtroller.address;

        let bondtrollerProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            bondtrollerMasterCopyAddress,
            proxyAdminAddress,
            "0x"
        );
        await bondtrollerProxy.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("Bondtroller proxy address: " + instance.address);
        });
        let bondtrollerProxyAddress = bondtrollerProxy.address;
        bondtrollerAddress = bondtrollerProxyAddress;

        bondtroller = await Bondtroller.attach(bondtrollerAddress).connect(deployMaster);
        
        await bondtroller.init().then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("Bondtroller call init at " + bondtroller.address);
        });

    //====================================================
    // deploy BUSDC

        console.log();
        console.log("***** BUSDC DEPLOYMENT *****");

        busdc = await BLendingToken.connect(deployMaster).deploy();
        await busdc.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BLendingToken masterCopy address: " + instance.address);
        });
        let busdcMasterCopyAddress = busdc.address;

        let busdcProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            busdcMasterCopyAddress,
            proxyAdminAddress,
            "0x"
        );
        await busdcProxy.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BLendingToken proxy address: " + instance.address);
        });
        let busdcProxyAddress = busdcProxy.address;
        busdcAddress = busdcProxyAddress;

        busdc = await BLendingToken.attach(busdcAddress).connect(deployMaster);
        
        let underlying = USDC
        let initialExchangeRateMantissa = toBN(10).pow(toBN(18));
        let reserveFactorMantissa = toBN(25).mul(toBN(10).pow(toBN(16)));//same as cAAVE
        let name = "fUSDC";
        let symbol = "fUSDC";
        let decimals = toBN(6);
        let admin = deployMasterAddress;

        await busdc.init(
            underlying,
            bondtrollerAddress,
            jumpRateModelV2Address,
            initialExchangeRateMantissa,
            name,
            symbol,
            decimals,
            admin
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BUSDC call init at " + busdc.address);
        });

        await busdc.connect(deployMaster).setReserveFactor(reserveFactorMantissa).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BUSDC set reserve factor " + reserveFactorMantissa);
        });

        await bondtroller.supportMarket(busdcAddress).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("Bondtroller support market " + busdcAddress);
        });

        //====================================================
        // deploy PrimaryIndexToken

        console.log();
        console.log("***** PRIMARY INDEX TOKEN DEPLOYMENT *****");

        primaryIndexToken = await PrimaryIndexToken.connect(deployMaster).deploy();
        await primaryIndexToken.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PrimaryIndexToken masterCopy address: " + instance.address);
        });
        let pitMasterCopyAddress = primaryIndexToken.address;

        let pitProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            pitMasterCopyAddress,
            proxyAdminAddress,
            "0x"
        );
        await pitProxy.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PrimaryIndexToken proxy address: " + instance.address);
        });
        let pitProxyAddress = pitProxy.address;
        primaryIndexTokenAddress = pitProxyAddress;

        primaryIndexToken = await PrimaryIndexToken.attach(primaryIndexTokenAddress).connect(deployMaster);


        await primaryIndexToken.initialize().then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PrimaryIndexToken call initialize at " + primaryIndexToken.address)
        });

        await primaryIndexToken.setPriceOracle(priceOracleAddress).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PrimaryIndexToken set priceOracle: " + priceOracleAddress);
        });


        await primaryIndexToken.addLendingToken(
            USDC, 
            busdcAddress, 
            false // isPause = false. this meant that lendingToken is not pause
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("Added lending token " + USDC + " with BLendingToken " + busdcAddress);
        });

        await primaryIndexToken.addProjectToken(
            MATIC,
            MATIC_loanToValueRatioNumerator,
            MATIC_loanToValueRatioDenominator,
            MATIC_liquidationTresholdFactorNumerator,
            MATIC_liquidationTresholdFactorDenominator,
            MATIC_liquidationIncentiveNumerator,
            MATIC_liquidationIncentiveDenominator
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("Added projent token: " + MATIC + " with:");
            console.log("LoanToValueRatio: ")
            console.log("   Numerator:   " + MATIC_loanToValueRatioNumerator);
            console.log("   Denominator: " + MATIC_loanToValueRatioDenominator);
            console.log("LiquidationTresholdFactor: ")
            console.log("   Numerator:   " + MATIC_liquidationTresholdFactorNumerator);
            console.log("   Denominator: " + MATIC_liquidationTresholdFactorDenominator);
            console.log("LiquidationIncentive: ");
            console.log("   Numerator:   " + MATIC_liquidationIncentiveNumerator);
            console.log("   Denominator: " + MATIC_liquidationIncentiveDenominator);
        });

        await primaryIndexToken.addProjectToken(
            LINK,
            LINK_loanToValueRatioNumerator,
            LINK_loanToValueRatioDenominator,
            LINK_liquidationTresholdFactorNumerator,
            LINK_liquidationTresholdFactorDenominator,
            LINK_liquidationIncentiveNumerator,
            LINK_liquidationIncentiveDenominator
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("Added projent token: " + LINK + " with:");
            console.log("LoanToValueRatio: ")
            console.log("   Numerator:   " + LINK_loanToValueRatioNumerator);
            console.log("   Denominator: " + LINK_loanToValueRatioDenominator);
            console.log("LiquidationTresholdFactor: ")
            console.log("   Numerator:   " + LINK_liquidationTresholdFactorNumerator);
            console.log("   Denominator: " + LINK_liquidationTresholdFactorDenominator);
            console.log("LiquidationIncentive: ");
            console.log("   Numerator:   " + LINK_liquidationIncentiveNumerator);
            console.log("   Denominator: " + LINK_liquidationIncentiveDenominator);
        });

        await primaryIndexToken.addProjectToken(
            REN,
            REN_loanToValueRatioNumerator,
            REN_loanToValueRatioDenominator,
            REN_liquidationTresholdFactorNumerator,
            REN_liquidationTresholdFactorDenominator,
            REN_liquidationIncentiveNumerator,
            REN_liquidationIncentiveDenominator
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("Added projent token: " + REN + " with:");
            console.log("LoanToValueRatio: ")
            console.log("   Numerator:   " + REN_loanToValueRatioNumerator);
            console.log("   Denominator: " + REN_loanToValueRatioDenominator);
            console.log("LiquidationTresholdFactor: ")
            console.log("   Numerator:   " + REN_liquidationTresholdFactorNumerator);
            console.log("   Denominator: " + REN_liquidationTresholdFactorDenominator);
            console.log("LiquidationIncentive: ");
            console.log("   Numerator:   " + REN_liquidationIncentiveNumerator);
            console.log("   Denominator: " + REN_liquidationIncentiveDenominator);
        });

        await primaryIndexToken.addProjectToken(
            OGN,
            OGN_loanToValueRatioNumerator,
            OGN_loanToValueRatioDenominator,
            OGN_liquidationTresholdFactorNumerator,
            OGN_liquidationTresholdFactorDenominator,
            OGN_liquidationIncentiveNumerator,
            OGN_liquidationIncentiveDenominator
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("Added projent token: " + REN + " with:");
            console.log("LoanToValueRatio: ")
            console.log("   Numerator:   " + REN_loanToValueRatioNumerator);
            console.log("   Denominator: " + REN_loanToValueRatioDenominator);
            console.log("LiquidationTresholdFactor: ")
            console.log("   Numerator:   " + REN_liquidationTresholdFactorNumerator);
            console.log("   Denominator: " + REN_liquidationTresholdFactorDenominator);
            console.log("LiquidationIncentive: ");
            console.log("   Numerator:   " + REN_liquidationIncentiveNumerator);
            console.log("   Denominator: " + REN_liquidationIncentiveDenominator);
        });

        await primaryIndexToken.setBorrowLimit(MATIC, USDC, MATIC_borrowLimit).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PrimaryIndexToken set to " + MATIC + " borrow limit " + MATIC_borrowLimit);
        });

        await primaryIndexToken.setBorrowLimit(LINK, USDC, LINK_borrowLimit).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PrimaryIndexToken set to " + LINK + " borrow limit " + LINK_borrowLimit);
        });

        await primaryIndexToken.setBorrowLimit(REN, USDC, REN_borrowLimit).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PrimaryIndexToken set to " + REN + " borrow limit " + REN_borrowLimit);
        });

        await primaryIndexToken.setBorrowLimit(OGN, USDC, OGN_borrowLimit).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PrimaryIndexToken set to " + OGN + " borrow limit " + OGN_borrowLimit);
        });

        await bondtroller.setPrimaryIndexTokenAddress(primaryIndexTokenAddress).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("Bondtroller " + bondtrollerAddress + " set PrimaryIndexToken "+ primaryIndexTokenAddress);
        });

        await busdc.setPrimaryIndexToken(primaryIndexTokenAddress).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BUSDC " + busdcAddress +" set primaryIndexToken " + primaryIndexTokenAddress);
        });

        let addresses = {
            bondtrollerAddress: bondtrollerAddress,
            busdcAddress: busdcAddress,
            primaryIndexTokenAddress: primaryIndexTokenAddress,
        };

        console.log(addresses);

        return addresses;
    }
};
