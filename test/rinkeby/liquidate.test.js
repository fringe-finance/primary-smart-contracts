const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");
const BD = require("js-big-decimal");

const BN = hre.ethers.BigNumber;

const toBD = (num) => new BD(num);
const toBN = (num) => BN.from(num);


describe("Tests for PrimaryIndexToken contract", async function () {
    
    let deployMaster, supplier, borrower, liquidator;
    let deployMasterAddress, supplierAddress, borrowerAddress, liquidatorAddress;

    let usdcAddress = '0x5236aAB9f4b49Bfd93a9500E427B042f65005E6A';
    let prj1Address = '0x40EA2e5c5b2104124944282d8db39C5D13ac6770';
    let prj2Address = '0x69648Ef43B7496B1582E900569cd9dDEc49C045e';
    let prj3Address = '0xfA91A86700508806AD2A49Bebce34a08c6ad7a65';
    let prj4Address = '0xc6636b088AB0f794DDfc1204e7C58D8148f62203';
    let prj5Address = '0x37a7D483d2dfe97d0C00cEf6F257e25d321e6D4e';
    let prj6Address = '0x16E2f279A9BabD4CE133745DdA69C910CBe2e490';

    let prj1, prj2, prj3, prj4, prj5, prj6;
    let prj1Multiplier, prj2Multiplier, prj3Multiplier, prj4Multiplier, prj5Multiplier, prj6Multiplier, usdcMultiplier;
    
    let prjAddresses = [prj1Address,prj2Address,prj3Address,prj4Address,prj5Address,prj6Address];

    let PrimaryIndexToken, PRJ, BUSDC, USDC, ERC20;

    let pitAddress;
    let busdcAddress;

    let pit;
    let usdc;
    let busdc;


    describe("PrimaryIndexToken ", async function(){

        it("Deploy PrimaryIndexToken", async function(){
            let signers = await hre.ethers.getSigners();
            deployMaster = signers[0];
            supplier = signers[1];
            borrower = signers[2];
            liquidator = signers[3];

            deployMasterAddress = deployMaster.address;
            supplierAddress = supplier.address;
            borrowerAddress = borrower.address;
            liquidatorAddress = liquidator.address;
          
            const { deploymentAndSettingPIT } = require("../../scripts/deployment/rinkeby/deploymentPIT/deploymentAndSettingPIT.js")
            
            let proxyAdminAddress;
            let priceOracleAddress = '0xB7D77809d1Ef631FCaeA6b151d6453dBA727F6EC';
            let addresses = await deploymentAndSettingPIT(proxyAdminAddress, priceOracleAddress);
            console.log(addresses);

            console.log("DeployMasterAddress: " + deployMasterAddress);
            
            pitAddress = addresses.pitAddress;
            busdcAddress = addresses.busdcAddress;

            PrimaryIndexToken = await hre.ethers.getContractFactory("PrimaryIndexToken");
            PRJ = await hre.ethers.getContractFactory("PRJ");
            USDC = await hre.ethers.getContractFactory("PRJ");
            BUSDC = await hre.ethers.getContractFactory("BLendingToken");
            ERC20 = await hre.ethers.getContractFactory("ERC20");

            pit = await PrimaryIndexToken.attach(addresses.pitAddress).connect(deployMaster);
            prj1 = await PRJ.attach(prj1Address).connect(deployMaster);
            prj2 = await PRJ.attach(prj2Address).connect(deployMaster);
            usdc = await PRJ.attach(usdcAddress).connect(deployMaster);
            busdc = await BUSDC.attach(busdcAddress).connect(deployMaster);
           
            prj1Multiplier = toBN(10).pow(toBN(18));
            prj2Multiplier = toBN(10).pow(toBN(18));
            usdcMultiplier = toBN(10).pow(toBN(6));

            await prj1.mint(toBN(15000).mul(prj1Multiplier));
            await prj1

        });

       
        // describe.skip("Borrow and Repay by one borrow position by PRJ1 collateral", async function(){
            
        //     it("DeployMaster supply 1_000_000 USDC", async function(){
        //         await printSeparator();
        //         let deployMasterUsdcAmountBefore = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
        //         let deployMasterBusdcAmountBefore = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
        //         let usdcToSupply = toBN(1_000_000).mul(usdcMultiplier);
        //         await usdc.connect(deployMaster).approve(busdcAddress, usdcToSupply);
        //         await pit.connect(deployMaster).supply(usdcAddress, usdcToSupply);
        //         console.log("=====NEW STATE======")
        //         let deployMasterUsdcAmountAfter = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
        //         let deployMasterBusdcAmountAfter = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
        //         await printSeparator();
        //     });

        //     it("Borrower deposits PRJ1", async function(){
        //         await printSeparator();
        //         let prj1BalanceBefore = await getAndPrintERC20Balance(prj1Address, borrowerAddress);
        //         let depositPositionBefore = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let pitRemainingBefore = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);

        //         let amountPRJ1ToDeposit = toBN(14_000).mul(prj1Multiplier);
        //         await prj1.connect(borrower).mintTo(borrowerAddress, amountPRJ1ToDeposit);
        //         await prj1.connect(borrower).approve(pitAddress, amountPRJ1ToDeposit);
        //         await pit.connect(borrower).deposit(prj1Address, usdcAddress,  amountPRJ1ToDeposit);
        //         console.log("Deposit: " + amountPRJ1ToDeposit);
    
        //         let prj1BalanceAfter = await getAndPrintERC20Balance(prj1Address, borrowerAddress);
        //         let depositPositionAfter = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let pitRemainingAfter = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);

        //         await printSeparator();
        //     });

        //     it("First borrower USDC borrow by PRJ1 collateral", async function(){
        //         await printSeparator();
        //         let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionBefore = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionBefore = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalanceBefore = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingBefore = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorBefore = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

        //         let amountUsdcToBorrow = toBN(4_000).mul(usdcMultiplier);
        //         await pit.connect(borrower).borrow(prj1Address, usdcAddress, amountUsdcToBorrow);
        //         console.log("Borrowed: " + amountUsdcToBorrow);
                
        //         let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionAfter = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionAfter = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalanceAfter = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingAfter = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorAfter = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

        //         await printSeparator();
        //     });


        //     it("Second borrower USDC borrow by PRJ1 collateral", async function(){
        //         await printSeparator();
        //         let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionBefore = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionBefore = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalanceBefore = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingBefore = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorBefore = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

        //         let amountUsdcToBorrow = toBN(500).mul(usdcMultiplier);
        //         await pit.connect(borrower).borrow(prj1Address, usdcAddress, amountUsdcToBorrow);
        //         console.log("Borrowed: " + amountUsdcToBorrow);
                
        //         let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionAfter = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionAfter = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalanceAfter = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingAfter = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorAfter = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

        //         await printSeparator();
        //     });
            
        //     it("Mine 50 blocks", async function(){
        //         await mineBlocks(50);
        //     });

        //     it("Third borrower USDC borrow by PRJ1 collateral", async function(){
        //         await printSeparator();
        //         let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionBefore = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionBefore = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalanceBefore = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingBefore = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorBefore = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

        //         let amountUsdcToBorrow = toBN(200).mul(usdcMultiplier);
        //         await pit.connect(borrower).borrow(prj1Address, usdcAddress, amountUsdcToBorrow);
        //         console.log("Borrowed: " + amountUsdcToBorrow);
                
        //         let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionAfter = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionAfter = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalanceAfter = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingAfter = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorAfter = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

        //         await printSeparator();
        //     });


        //     it("borrower repays some part of accrued interest in borrow position", async function() {
        //         await printSeparator();
        //         let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionBefore = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionBefore = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalanceBefore = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingBefore = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorBefore = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

        //         let amountUsdcToRepay = borrowPositionBefore.interest.div(toBN(2));
        //         await usdc.connect(borrower).approve(busdcAddress, amountUsdcToRepay);
        //         console.log("Repayed: " + amountUsdcToRepay);
        //         await pit.connect(borrower).repay(prj1Address, usdcAddress, amountUsdcToRepay);

        //         let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionAfter = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionAfter = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalanceAfter = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingAfter = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorAfter = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

        //         await printSeparator();
        //     });

        //     it("borrower repays all interest and some part of loan in borrow position", async function(){
        //         await printSeparator();
        //         let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionBefore = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionBefore = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalanceBefore = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingBefore = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorBefore = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);


        //         let amountUsdcToRepay = borrowPositionBefore.loanBody.div(toBN(2)).add(borrowPositionBefore.interest);
        //         await usdc.connect(borrower).approve(busdcAddress, amountUsdcToRepay);
        //         console.log("Repayed: " + amountUsdcToRepay);
        //         await pit.connect(borrower).repay(prj1Address, usdcAddress, amountUsdcToRepay);

        //         let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionAfter = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionAfter = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalanceAfter = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingAfter = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorAfter = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

        //         await printSeparator();
        //     });

        //     it("borrower repays all borrow in borrow position", async function(){
        //         // TODO to see that in BToken there are no borrow.
        //         await printSeparator();
        //         let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionBefore = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionBefore = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalanceBefore = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingBefore = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorBefore = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

        //         let amountUsdcToRepay = toBN(2).pow(toBN(256)).sub(toBN(1));
        //         await usdc.connect(borrower).approve(busdcAddress, amountUsdcToRepay);
        //         console.log("Repayed: " + amountUsdcToRepay);
        //         await pit.connect(borrower).repay(prj1Address, usdcAddress, amountUsdcToRepay);

        //         let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionAfter = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionAfter = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalanceAfter = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingAfter = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorAfter = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);


        //         await printSeparator();
        //     });

        //     it("DeployMaster redeem all his supply", async function(){
        //         await printSeparator();
        //         let deployMasterUsdcAmountBefore = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
        //         let deployMasterBusdcAmountBefore = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
                
        //         let amountBusdcToRedeem = deployMasterBusdcAmountBefore;
        //         await pit.connect(deployMaster).redeem(usdcAddress, amountBusdcToRedeem);
                
        //         console.log("=====NEW STATE======")
        //         let deployMasterUsdcAmountAfter = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
        //         let deployMasterBusdcAmountAfter = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
        //         await printSeparator();
        //     });

        // });

        // describe.skip("Borrow and Repay by two borrow positions by PRJ1, PRJ2 collaterals", async function(){
            
        //     it("DeployMaster supply 1_000_000 USDC", async function(){
        //         await printSeparator();
        //         let deployMasterUsdcAmountBefore = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
        //         let deployMasterBusdcAmountBefore = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
        //         let usdcToSupply = toBN(1_000_000).mul(usdcMultiplier);
        //         await usdc.connect(deployMaster).approve(busdcAddress, usdcToSupply);
        //         await pit.connect(deployMaster).supply(usdcAddress, usdcToSupply);
        //         console.log("=====NEW STATE======")
        //         let deployMasterUsdcAmountAfter = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
        //         let deployMasterBusdcAmountAfter = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
        //         await printSeparator();
        //     });

        //     it("Borrower deposits PRJ1 and PRJ2", async function(){
        //         await printSeparator();
        //         console.log("=====PRJ1=====")
        //         let prj1BalanceBefore = await getAndPrintERC20Balance(prj1Address, borrowerAddress);
        //         let depositPositionPRJ1Before = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let pitRemainingPRJ1Before = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         console.log("=====PRJ2=====")
        //         let prj2BalanceBefore = await getAndPrintERC20Balance(prj2Address, borrowerAddress);
        //         let depositPositionPRJ2Before = await getAndPrintDepositPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let pitRemainingPRJ2Before = await getAndPrintPitRemaining(borrowerAddress, prj2Address, usdcAddress);


        //         let amountPRJ1ToDeposit = toBN(14_000).mul(prj1Multiplier);
        //         await prj1.connect(borrower).mintTo(borrowerAddress, amountPRJ1ToDeposit);
        //         await prj1.connect(borrower).approve(pitAddress, amountPRJ1ToDeposit);
        //         await pit.connect(borrower).deposit(prj1Address, usdcAddress,  amountPRJ1ToDeposit);
        //         console.log("Deposited PRJ1: " + amountPRJ1ToDeposit);

        //         let amountPRJ2ToDeposit = toBN(14_000).mul(prj2Multiplier);
        //         await prj2.connect(borrower).mintTo(borrowerAddress, amountPRJ2ToDeposit);
        //         await prj2.connect(borrower).approve(pitAddress, amountPRJ2ToDeposit);
        //         await pit.connect(borrower).deposit(prj2Address, usdcAddress,  amountPRJ2ToDeposit);
        //         console.log("Deposited PRJ2: " + amountPRJ1ToDeposit);

        //         console.log("=====PRJ1=====")
        //         let prj1BalanceAfter = await getAndPrintERC20Balance(prj1Address, borrowerAddress);
        //         let depositPositionPRJ1After = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let pitRemainingPRJ1After = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         console.log("=====PRJ2=====")
        //         let prj2BalanceAfter = await getAndPrintERC20Balance(prj2Address, borrowerAddress);
        //         let depositPositionPRJ2After = await getAndPrintDepositPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let pitRemainingPRJ2After = await getAndPrintPitRemaining(borrowerAddress, prj2Address, usdcAddress);

        //         await printSeparator();
        //     });

        //     it("Borrower borrow USDC by PRJ1", async function(){
        //         await printSeparator();
        //         console.log("=====PRJ1=====")
        //         let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionPRJ1Before = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionPRJ1Before = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalancePRJ1Before = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingPRJ1Before = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorPRJ1Before = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);
                
        //         let amountUsdcToBorrowByPRJ1 = toBN(4_000).mul(usdcMultiplier);
        //         await pit.connect(borrower).borrow(prj1Address, usdcAddress, amountUsdcToBorrowByPRJ1);
        //         console.log("Borrowed: " + amountUsdcToBorrowByPRJ1);
               
                
        //         console.log("=====PRJ1=====")
        //         let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionPRJ1After = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionPRJ1After = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalancePRJ1After = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingPRJ1After = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorPRJ1After = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);
               
        //         await printSeparator();
        //     });

        //     it("Borrower borrow USDC by PRJ2", async function(){
        //         await printSeparator();
        //         console.log("=====PRJ2=====")
        //         let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionPRJ2Before = await getAndPrintDepositPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let borrowPositionPRJ2Before = await getAndPrintBorrowPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let usdcBalancePRJ2Before = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingPRJ2Before = await getAndPrintPitRemaining(borrowerAddress, prj2Address, usdcAddress);
        //         let healthFactorPRJ2Before = await getAndPrintHealthFactor(borrowerAddress, prj2Address, usdcAddress);
                
        //         let amountUsdcToBorrowByPRJ2 = toBN(7_000).mul(usdcMultiplier);
        //         await pit.connect(borrower).borrow(prj2Address, usdcAddress, amountUsdcToBorrowByPRJ2);
        //         console.log("Borrowed: " + amountUsdcToBorrowByPRJ2);

        //         console.log("=====PRJ2=====")
        //         let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionPRJ2After = await getAndPrintDepositPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let borrowPositionPRJ2After = await getAndPrintBorrowPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let usdcBalancePRJ2After = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingPRJ2After = await getAndPrintPitRemaining(borrowerAddress, prj2Address, usdcAddress);
        //         let healthFactorPRJ2After = await getAndPrintHealthFactor(borrowerAddress, prj2Address, usdcAddress);
        //         await printSeparator();
        //     });

        //     it("Mine 50 blocks", async function(){
        //         await mineBlocks(50);
        //         await pit.updateInterestInBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //     });

        //     it("Borrower repays some part of accrued interest in PRJ1 position", async function() {
        //         await printSeparator();
        //         console.log("=====PRJ1=====")
        //         let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionPRJ1Before = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionPRJ1Before = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalancePRJ1Before = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingPRJ1Before = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorPRJ1Before = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

        //         let amountUsdcToRepayPRJ1position = toBN(100);
        //         await usdc.connect(borrower).approve(busdcAddress, amountUsdcToRepayPRJ1position);
        //         await pit.connect(borrower).repay(prj1Address, usdcAddress, amountUsdcToRepayPRJ1position);
        //         console.log("Repayed: " + amountUsdcToRepayPRJ1position);

        //         console.log("=====PRJ1=====")
        //         let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionPRJ1After = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionPRJ1After = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalancePRJ1After = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingPRJ2After = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorPRJ1After = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

        //         await printSeparator();
        //     });

        //     it("Borrower repays all interest and some part of loan in PRJ1 position", async function(){
        //         await printSeparator();
        //         console.log("=====PRJ1=====")
        //         let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionPRJ1Before = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionPRJ1Before = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalancePRJ1Before = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingPRJ1Before = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorPRJ1Before = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

        //         let amountUsdcToRepay = borrowPositionPRJ1Before.loanBody.div(toBN(2)).add(borrowPositionPRJ1Before.interest);
        //         await usdc.connect(borrower).approve(busdcAddress, amountUsdcToRepay);
        //         console.log("Repayed: " + amountUsdcToRepay);
        //         await pit.connect(borrower).repay(prj1Address, usdcAddress, amountUsdcToRepay);

        //         console.log("=====PRJ1=====")
        //         let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionPRJ1After = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionPRJ1After = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalancePRJ1After = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingPRJ1After = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorPRJ1After = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

        //         await printSeparator();
        //     });

        //     it("borrower repays all borrow in borrow PRJ1", async function(){
                
        //         await printSeparator();
        //         console.log("=====PRJ1=====")
        //         let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionPRJ1Before = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionPRJ1Before = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalanceBefore = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingPRJ1Before = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorPRJ1Before = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

        //         let amountUsdcToRepay = toBN(2).pow(toBN(256)).sub(toBN(1));
        //         await usdc.connect(borrower).approve(busdcAddress, amountUsdcToRepay);
        //         console.log("Repayed: " + amountUsdcToRepay);
        //         await pit.connect(borrower).repay(prj1Address, usdcAddress, amountUsdcToRepay);

        //         console.log("=====PRJ1=====")
        //         let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionPRJ1After = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let borrowPositionPRJ1After = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
        //         let usdcBalanceAfter = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingPRJ1After = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
        //         let healthFactorPRJ1After = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

        //         await printSeparator();
        //     });

        //     it("Borrower repays all interest and some part of loan in PRJ2 position", async function(){
        //         await printSeparator();

        //         console.log("=====PRJ2=====")
        //         let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionPRJ2Before = await getAndPrintDepositPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let borrowPositionPRJ2Before = await getAndPrintBorrowPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let usdcBalancePRJ2Before = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingPRJ2Before = await getAndPrintPitRemaining(borrowerAddress, prj2Address, usdcAddress);
        //         let healthFactorPRJ2Before = await getAndPrintHealthFactor(borrowerAddress, prj2Address, usdcAddress);

        //         let amountUsdcToRepay = borrowPositionPRJ2Before.loanBody.div(toBN(2)).add(borrowPositionPRJ2Before.interest);
        //         await usdc.connect(borrower).approve(busdcAddress, amountUsdcToRepay);
        //         console.log("Repayed: " + amountUsdcToRepay);
        //         await pit.connect(borrower).repay(prj2Address, usdcAddress, amountUsdcToRepay);

        //         console.log("=====PRJ2=====")
        //         let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionPRJ2After = await getAndPrintDepositPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let borrowPositionPRJ2After = await getAndPrintBorrowPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let usdcBalancePRJ2After = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingPRJ2After = await getAndPrintPitRemaining(borrowerAddress, prj2Address, usdcAddress);
        //         let healthFactorPRJ2After = await getAndPrintHealthFactor(borrowerAddress, prj2Address, usdcAddress);

        //         await printSeparator();
        //     });

        //     it("Mine 50 blocks", async function(){
        //         await mineBlocks(50);
        //         await pit.updateInterestInBorrowPosition(borrowerAddress, prj2Address, usdcAddress);
        //     });

        //     it("Borrower borrow extra USDC by PRJ2", async function(){
        //         await printSeparator();
        //         console.log("=====PRJ2=====")
        //         let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionPRJ2Before = await getAndPrintDepositPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let borrowPositionPRJ2Before = await getAndPrintBorrowPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let usdcBalancePRJ2Before = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingPRJ2Before = await getAndPrintPitRemaining(borrowerAddress, prj2Address, usdcAddress);
        //         let healthFactorPRJ2Before = await getAndPrintHealthFactor(borrowerAddress, prj2Address, usdcAddress);
                
        //         let amountUsdcToBorrowByPRJ2 = toBN(7_000).mul(usdcMultiplier);
        //         await pit.connect(borrower).borrow(prj2Address, usdcAddress, amountUsdcToBorrowByPRJ2);
        //         console.log("Borrowed: " + amountUsdcToBorrowByPRJ2);

        //         console.log("=====PRJ2=====")
        //         let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionPRJ2After = await getAndPrintDepositPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let borrowPositionPRJ2After = await getAndPrintBorrowPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let usdcBalancePRJ2After = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingPRJ2After = await getAndPrintPitRemaining(borrowerAddress, prj2Address, usdcAddress);
        //         let healthFactorPRJ2After = await getAndPrintHealthFactor(borrowerAddress, prj2Address, usdcAddress);
        //         await printSeparator();
        //     });

        //     it("Mine 50 blocks", async function(){
        //         await mineBlocks(50);
        //         await pit.updateInterestInBorrowPosition(borrowerAddress, prj2Address, usdcAddress);
        //     });

        //     it("borrower repays all borrow in borrow PRJ2", async function(){
                
        //         await printSeparator();
        //         console.log("=====PRJ2=====")
        //         let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionPRJ2Before = await getAndPrintDepositPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let borrowPositionPRJ2Before = await getAndPrintBorrowPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let usdcBalanceBefore = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingPRJ2Before = await getAndPrintPitRemaining(borrowerAddress, prj2Address, usdcAddress);
        //         let healthFactorPRJ2Before = await getAndPrintHealthFactor(borrowerAddress, prj2Address, usdcAddress);

        //         let amountUsdcToRepay = toBN(2).pow(toBN(256)).sub(toBN(1));
        //         await usdc.connect(borrower).approve(busdcAddress, amountUsdcToRepay);
        //         console.log("Repayed: " + amountUsdcToRepay);
        //         await pit.connect(borrower).repay(prj2Address, usdcAddress, amountUsdcToRepay);

        //         console.log("=====PRJ2=====")
        //         let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
        //         let depositPositionPRJ2After = await getAndPrintDepositPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let borrowPositionPRJ2After = await getAndPrintBorrowPosition(borrowerAddress, prj2Address, usdcAddress);
        //         let usdcBalanceAfter = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
        //         let pitRemainingPRJ2After = await getAndPrintPitRemaining(borrowerAddress, prj2Address, usdcAddress);
        //         let healthFactorPRJ2After = await getAndPrintHealthFactor(borrowerAddress, prj2Address, usdcAddress);

        //         await printSeparator();
        //     });

        //     it("DeployMaster redeem all his supply", async function(){
        //         await printSeparator();
        //         let deployMasterUsdcAmountBefore = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
        //         let deployMasterBusdcAmountBefore = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
                
        //         let amountBusdcToRedeem = deployMasterBusdcAmountBefore;
        //         await pit.connect(deployMaster).redeem(usdcAddress, amountBusdcToRedeem);
                
        //         console.log("=====NEW STATE======")
        //         let deployMasterUsdcAmountAfter = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
        //         let deployMasterBusdcAmountAfter = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
        //         await printSeparator();
        //     });
            
        // });

        describe("Liquidate one borrow PRJ1 position", async function(){
            it("DeployMaster supply 1_000_000 USDC", async function(){
                await printSeparator();
                let deployMasterUsdcAmountBefore = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
                let deployMasterBusdcAmountBefore = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
                let usdcToSupply = toBN(1_000_000).mul(usdcMultiplier);
                await usdc.connect(deployMaster).approve(busdcAddress, usdcToSupply);
                await pit.connect(deployMaster).supply(usdcAddress, usdcToSupply);
                console.log("=====NEW STATE======")
                let deployMasterUsdcAmountAfter = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
                let deployMasterBusdcAmountAfter = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
                await printSeparator();
            });

            it("Borrower deposits PRJ1", async function(){
                await printSeparator();
                let prj1BalanceBefore = await getAndPrintERC20Balance(prj1Address, borrowerAddress);
                let depositPositionBefore = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                let pitRemainingBefore = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);

                let amountPRJ1ToDeposit = toBN(14_000).mul(prj1Multiplier);
                await prj1.connect(borrower).mintTo(borrowerAddress, amountPRJ1ToDeposit);
                await prj1.connect(borrower).approve(pitAddress, amountPRJ1ToDeposit);
                await pit.connect(borrower).deposit(prj1Address, usdcAddress,  amountPRJ1ToDeposit);
                console.log("Deposit: " + amountPRJ1ToDeposit);
    
                let prj1BalanceAfter = await getAndPrintERC20Balance(prj1Address, borrowerAddress);
                let depositPositionAfter = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                let pitRemainingAfter = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);

                await printSeparator();
            });

            it("Borrower borrow all possible USDC by PRJ1 collateral", async function(){
                await printSeparator();
                let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
                let depositPositionBefore = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                let borrowPositionBefore = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
                let usdcBalanceBefore = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
                let pitRemainingBefore = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
                let healthFactorBefore = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

                let amountUsdcToBorrow = pitRemainingBefore;//toBN(4_000).mul(usdcMultiplier);
                await pit.connect(borrower).borrow(prj1Address, usdcAddress, amountUsdcToBorrow);
                console.log("Borrowed: " + amountUsdcToBorrow);
                
                let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
                let depositPositionAfter = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                let borrowPositionAfter = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
                let usdcBalanceAfter = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
                let pitRemainingAfter = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
                let healthFactorAfter = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

                await printSeparator();
            });

            it("Mine 50 blocks", async function(){
                await mineBlocks(5000);
                await pit.updateInterestInBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
            });

            it("Liquidator liquidates borrower PRJ1 position", async function(){
                await printSeparator();
                let amountUsdcToLiquidate = toBN(1_000_000).mul(usdcMultiplier);
                await pit.connect(liquidator).updateInterestInBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
                await usdc.connect(liquidator).mintTo(liquidatorAddress, amountUsdcToLiquidate);
                await usdc.connect(liquidator).approve(pitAddress, amountUsdcToLiquidate);

                console.log("=====borrower=====")
                let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
                let depositPositionBefore = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                let borrowPositionBefore = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
                let usdcBalanceBefore = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
                let pitRemainingBefore = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
                let healthFactorBefore = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);
                console.log("=====liquidator=====")
                let liquidatorPRJ1BalanceBefore = await getAndPrintERC20Balance(prj1Address, liquidatorAddress);
                let liquidatorUSDCBalanceBefore = await getAndPrintERC20Balance(usdcAddress, liquidatorAddress);

                await pit.connect(liquidator).liquidate(borrowerAddress, prj1Address, usdcAddress);
                console.log("Liquidated");

                console.log("=====borrower=====")
                let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
                let depositPositionAfter = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                let borrowPositionAfter = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
                let usdcBalanceAfter = await getAndPrintERC20Balance(usdcAddress, borrowerAddress);
                let pitRemainingAfter = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
                let healthFactorAfter = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);
                console.log("=====liquidator=====")
                let liquidatorPRJ1BalanceAfter = await getAndPrintERC20Balance(prj1Address, liquidatorAddress);
                let liquidatorUSDCBalanceAfter = await getAndPrintERC20Balance(usdcAddress, liquidatorAddress);
                
                await printSeparator();
            });


        });


        async function printSeparator(){
            console.log("==========================================");
        }

        async function getAndPrintHealthFactor(accountAddress, projectTokenAddress, lendingTokenAddress) {
            let healthFactor = await pit.healthFactor(accountAddress, projectTokenAddress, lendingTokenAddress);
            
            console.log("Health factor: ");
            console.log("   numerator:   " + healthFactor.numerator);
            console.log("   denominator: " + healthFactor.denominator);

            if (healthFactor.denominator != 0){
                let ratio = toBD(healthFactor.numerator).divide(toBD(healthFactor.denominator));
                //console.log(ratio);
                console.log("   ratio value: " + ratio.value);
            } else {
                console.log("   ratio value: dividing by zero");
            }
        }

        async function getAndPrintPitRemaining(accountAddress, projectTokenAddress, lendingTokenAddress) {
            let pitRemaining = await pit.pitRemaining(accountAddress, projectTokenAddress, lendingTokenAddress);
            console.log("pitRemaining: " + pitRemaining);
            return pitRemaining;
        }

        async function getAndPrintBorrowBalanceStored(accountAddress) {
            let borrowStored = await busdc.borrowBalanceStored(accountAddress);
            console.log("Borrow stored: " + borrowStored);
            return borrowStored;
        }

        async function getAndPrintTotalOutstanding(accountAddress, projectTokenAddress, lendingTokenAddress) {
            let totalOutstanding = await pit.totalOutstanding(accountAddress, projectTokenAddress, lendingTokenAddress);
            console.log("TotalOutstanging: " + totalOutstanding);
            return totalOutstanding;
        }

        async function getAndPrintProjectTokenEvaluation(projectTokenAddress, projectTokenAmount) {
            let projectTokenEvaluation = await pit.getProjectTokenEvaluation(projectTokenAddress, projectTokenAmount);
            console.log("Evaluation: " + projectTokenEvaluation);
            return projectTokenEvaluation;
        }

        async function getAndPrintDepositPosition(accountAddress, projectTokenAddress, lendingTokenAddress) {
            let depositPosition = await pit.depositPosition(accountAddress, projectTokenAddress, lendingTokenAddress);
            //console.log(depositPosition)
            console.log("Deposit position: ");
            console.log("   depositedProjectTokenAmount: " + depositPosition);
            return depositPosition;
        }   

        async function getAndPrintBorrowPosition(accountAddress, projectTokenAddress, lendingTokenAddress) {
            let borrowPosition = await pit.borrowPosition(accountAddress, projectTokenAddress, lendingTokenAddress);
            console.log("Borrow position: ");
            console.log("   loanBody:   " + borrowPosition.loanBody);
            console.log("   interest:   " + borrowPosition.interest);
            return borrowPosition;
        }

        async function getAndPrintERC20Balance(tokenAddress, accountAddress) {
            let token = await ERC20.attach(tokenAddress).connect(deployMaster);
            let balance = await token.balanceOf(accountAddress);
            console.log("ERC20 account balance: ")
            console.log("   Address: " + tokenAddress);
            console.log("   Account: " + accountAddress);
            console.log("   Balance: " + balance);
            return balance;
        }

        async function mineBlocks(blockNumbers) {
            console.log("Mined "+ (blockNumbers+1) + " blocks");
            for(var i = 0; i < blockNumbers; i++){
                await ethers.provider.send('evm_mine');
            }
        }


    });
   
});
