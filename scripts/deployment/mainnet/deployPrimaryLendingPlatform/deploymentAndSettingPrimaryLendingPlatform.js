const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

module.exports = {
   
    deploymentAndSettingPrimaryLendingPlatform : async function (input_primaryLendingPlatformProxyAdminAddress, input_priceOracleAddress) {
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

        let jumpRateModelV2;
        let bondtroller;
        let busdc;
        let primaryIndexToken;

        let jumpRateModelV2Address;
        let bondtrollerAddress;
        let busdcAddress;
        let primaryIndexTokenAddress;

        let isPaused;

        let {
            multiplier,
            baseRatePerBlock,
            blocksPerYear,
            jumpMultiplierPerBlock,
            multiplierPerBlock,
            kink,
            
            USDC,
            USDCmultiplier,

            initialExchangeRateMantissa,
            reserveFactorMantissa,
            name,
            symbol,
            decimals,

            MATIC,
            REN,
            LINK,

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
            });
            primaryLendingPlatformProxyAdminAddress = primaryLendingPlatformProxyAdmin.address;
            console.log("PrimaryLendingPlatformProxyAdmin deployed at: " + primaryLendingPlatformProxyAdminAddress);
        }else{
            primaryLendingPlatformProxyAdminAddress = input_primaryLendingPlatformProxyAdminAddress;
            console.log("PrimaryLendingPlatformProxyAdmin is deployed at: " + input_primaryLendingPlatformProxyAdminAddress);
        }

    //====================================================

        console.log();
        console.log("***** JUMP RATE MODELV2 DEPLOYMENT *****");
      
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
        await jumpRateModelV2.deployed()
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash);
        });
        let jumpRateModelV2MasterCopyAddress = jumpRateModelV2.address;
        console.log("JumpRateModelV2 masterCopy address: " + jumpRateModelV2MasterCopyAddress);
        jumpRateModelV2Address = jumpRateModelV2MasterCopyAddress;

    //====================================================
        console.log();
        console.log("***** BONDTROLLER DEPLOYMENT *****");

        bondtroller = await Bondtroller.connect(deployMaster).deploy();
        await bondtroller.deployed()
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash);
        });

        let bondtrollerMasterCopyAddress = bondtroller.address;
        console.log("Bondtroller masterCopy address: " + bondtrollerMasterCopyAddress);
        bondtrollerAddress = bondtrollerMasterCopyAddress;

        let bondtrollerProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            bondtrollerMasterCopyAddress,
            primaryLendingPlatformProxyAdminAddress,
            "0x"
        );
        await bondtrollerProxy.deployed()
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash);
        });

        let bondtrollerProxyAddress = bondtrollerProxy.address;
        console.log("Bondtroller proxy address: " + bondtrollerProxyAddress);
        bondtrollerAddress = bondtrollerProxyAddress;

        bondtroller = await Bondtroller.attach(bondtrollerAddress).connect(deployMaster);
        
        await bondtroller.init()
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("Bondtroller call init at " + bondtrollerAddress);
        });

    //====================================================

        console.log();
        console.log("***** BUSDC DEPLOYMENT *****");

        busdc = await BLendingToken.connect(deployMaster).deploy();
        await busdc.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash);
        });
        
        let busdcMasterCopyAddress = busdc.address;
        console.log("BLendingToken masterCopy address: " + busdcMasterCopyAddress);
        busdcAddress = busdcMasterCopyAddress;

        let busdcProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            busdcMasterCopyAddress,
            primaryLendingPlatformProxyAdminAddress,
            "0x"
        );
        await busdcProxy.deployed()
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash);
        });
        
        let busdcProxyAddress = busdcProxy.address;
        console.log("BUSDC proxy address: " + busdcProxyAddress);
        busdcAddress = busdcProxyAddress;

        busdc = await BLendingToken.attach(busdcAddress).connect(deployMaster);
        
        let admin = deployMasterAddress;

        await busdc.init(
            USDC,
            bondtrollerAddress,
            jumpRateModelV2Address,
            initialExchangeRateMantissa,
            name,
            symbol,
            decimals,
            admin
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BUSDC call init at " + busdcAddress);
        });

        await busdc.setReserveFactor(reserveFactorMantissa)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BUSDC set reserve factor " + reserveFactorMantissa);
        });

        await bondtroller.supportMarket(busdcAddress)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("Bondtroller support market " + busdcAddress);
        });

        //====================================================
        console.log();
        console.log("***** PRIMARY INDEX TOKEN DEPLOYMENT *****");

        primaryIndexToken = await PrimaryIndexToken.connect(deployMaster).deploy();
        await primaryIndexToken.deployed()
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash);
        });
        let pitMasterCopyAddress = primaryIndexToken.address;
        console.log("PrimaryIndexToken masterCopy address: " + pitMasterCopyAddress);
        primaryIndexTokenAddress = pitMasterCopyAddress;

        let pitProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            pitMasterCopyAddress,
            primaryLendingPlatformProxyAdminAddress,
            "0x"
        );
        await pitProxy.deployed()
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash);
        });
        let pitProxyAddress = pitProxy.address;
        console.log("PrimaryIndexToken proxy address: " + pitProxyAddress);
        primaryIndexTokenAddress = pitProxyAddress;

        primaryIndexToken = await PrimaryIndexToken.attach(primaryIndexTokenAddress).connect(deployMaster);

        await primaryIndexToken.initialize()
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PrimaryIndexToken call initialize at " + primaryIndexTokenAddress)
        });

        await primaryIndexToken.setPriceOracle(input_priceOracleAddress)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PrimaryIndexToken set priceOracle: " + input_priceOracleAddress);
        });

        isPaused = false;
        await primaryIndexToken.addLendingToken(USDC, busdcAddress, isPaused)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("Added lending token " + USDC + " with BLendingToken " + busdcAddress);
        });

        isPaused = false;
        await primaryIndexToken.addProjectToken(
            MATIC,
            isPaused,
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

        isPaused = false;
        await primaryIndexToken.addProjectToken(
            LINK,
            isPaused,
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

        isPaused = false;
        await primaryIndexToken.addProjectToken(
            REN,
            isPaused,
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

        await primaryIndexToken.setBorrowLimit(MATIC, USDC, MATIC_borrowLimit)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PrimaryIndexToken set to " + MATIC + " borrow limit " + MATIC_borrowLimit);
        });

        await primaryIndexToken.setBorrowLimit(LINK, USDC, LINK_borrowLimit)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PrimaryIndexToken set to " + LINK + " borrow limit " + LINK_borrowLimit);
        });

        await primaryIndexToken.setBorrowLimit(REN, USDC, REN_borrowLimit)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PrimaryIndexToken set to " + REN + " borrow limit " + REN_borrowLimit);
        });

        await bondtroller.setPrimaryIndexTokenAddress(primaryIndexTokenAddress)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("Bondtroller " + bondtrollerAddress + " set PrimaryIndexToken "+ primaryIndexTokenAddress);
        });

        await busdc.setPrimaryIndexToken(primaryIndexTokenAddress)
        .then(function(instance){
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
