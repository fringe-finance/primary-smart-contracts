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
          
            const { deploymentPrimaryLendingPlatform } = require("../../scripts/deployment/rinkeby/primaryLendingPlatform/deploymentPrimaryLendingPlatform.js")
            
            let proxyAdminAddress = '0xaB31DB6Fea864760Ab1F2870E0B3849Ece9C2CE1' 
            let priceOracleAddress = '0xB7D77809d1Ef631FCaeA6b151d6453dBA727F6EC'
            let addresses = await deploymentPrimaryLendingPlatform(proxyAdminAddress, priceOracleAddress);
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

        it("DeployMaster supply 1_000_000 USDC", async function(){
            await printSeparator();
            let deployMasterUsdcAmountBefore = await getAndPrintPRJBalance(usdcAddress, deployMasterAddress);
            let deployMasterBusdcAmountBefore = await getAndPrintPRJBalance(busdcAddress, deployMasterAddress);
            let usdcToSupply = toBN(1_000_000).mul(usdcMultiplier);
            await usdc.connect(deployMaster).approve(busdcAddress, usdcToSupply);
            await pit.connect(deployMaster).supply(usdcAddress, usdcToSupply);
            console.log("=====NEW STATE======")
            let deployMasterUsdcAmountAfter = await getAndPrintPRJBalance(usdcAddress, deployMasterAddress);
            let deployMasterBusdcAmountAfter = await getAndPrintPRJBalance(busdcAddress, deployMasterAddress);
            await printSeparator();
        });


        describe("Liquidate one borrow PRJ1 position", async function(){
            
            it("Borrower deposits PRJ1", async function(){
                await printSeparator();
                let prj1BalanceBefore = await getAndPrintPRJBalance(prj1Address, borrowerAddress);
                let depositPositionBefore = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                let pitRemainingBefore = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);

                let amountPRJ1ToDeposit = toBN(14_000).mul(prj1Multiplier);
                await prj1.connect(borrower).mintTo(borrowerAddress, amountPRJ1ToDeposit);
                await prj1.connect(borrower).approve(pitAddress, amountPRJ1ToDeposit);
                await pit.connect(borrower).deposit(prj1Address, usdcAddress,  amountPRJ1ToDeposit);
                console.log("Deposit: " + amountPRJ1ToDeposit);
    
                let prj1BalanceAfter = await getAndPrintPRJBalance(prj1Address, borrowerAddress);
                let depositPositionAfter = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                let pitRemainingAfter = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);

                await printSeparator();
            });

            it("Borrower borrow less than all possible USDC by PRJ1 collateral", async function(){
                await printSeparator();
                let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
                let depositPositionBefore = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                let borrowPositionBefore = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
                let usdcBalanceBefore = await getAndPrintPRJBalance(usdcAddress, borrowerAddress);
                let pitRemainingBefore = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
                let healthFactorBefore = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

                let amountUsdcToBorrow = pitRemainingBefore.sub(toBN(1000));//toBN(4_000).mul(usdcMultiplier);
                await pit.connect(borrower).borrow(prj1Address, usdcAddress, amountUsdcToBorrow);
                console.log("Borrowed: " + amountUsdcToBorrow);
                
                let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
                let depositPositionAfter = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                let borrowPositionAfter = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
                let usdcBalanceAfter = await getAndPrintPRJBalance(usdcAddress, borrowerAddress);
                let pitRemainingAfter = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
                let healthFactorAfter = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

                await printSeparator();
            });

            it("Mine 50 blocks", async function(){
                await mineBlocks(50);
                await pit.connect(liquidator).updateInterestInBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
            });

            it("Liquidator liquidates borrower PRJ1 position", async function(){
                await printSeparator();

                let amountUsdcToLiquidate = toBN(1_000_000).mul(usdcMultiplier);
                let liquidatorUSDCBalance = await usdc.connect(liquidator).balanceOf(liquidatorAddress);
                let liquidatorPRJ1Balance = await prj1.connect(liquidator).balanceOf(liquidatorAddress);
                await prj1.connect(liquidator).transfer(deployMasterAddress, liquidatorPRJ1Balance)
                await usdc.connect(liquidator).transfer(deployMasterAddress, liquidatorUSDCBalance);
                await usdc.connect(liquidator).mintTo(liquidatorAddress, amountUsdcToLiquidate);
                await usdc.connect(liquidator).approve(pitAddress, amountUsdcToLiquidate);

                console.log("=====borrower=====")
                let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
                let depositPositionBefore = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                let borrowPositionBefore = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
                let usdcBalanceBefore = await getAndPrintPRJBalance(usdcAddress, borrowerAddress);
                let pitRemainingBefore = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
                let healthFactorBefore = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);
                console.log("=====liquidator=====")
                let liquidatorPRJ1BalanceBefore = await getAndPrintPRJBalance(prj1Address, liquidatorAddress);
                let liquidatorUSDCBalanceBefore = await getAndPrintPRJBalance(usdcAddress, liquidatorAddress);

                let PRJ1eval = await getAndPrintProjectTokenEvaluation(prj1Address, prj1Multiplier);
                await usdc.connect(liquidator).approve(busdcAddress, liquidatorUSDCBalanceBefore);
                await pit.connect(liquidator).liquidate(borrowerAddress, prj1Address, usdcAddress);
                console.log("Liquidated");

                console.log("=====borrower=====")
                let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
                let depositPositionAfter = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                let borrowPositionAfter = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
                let usdcBalanceAfter = await getAndPrintPRJBalance(usdcAddress, borrowerAddress);
                let pitRemainingAfter = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
                let healthFactorAfter = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);
                console.log("=====liquidator=====")
                let liquidatorPRJ1BalanceAfter = await getAndPrintPRJBalance(prj1Address, liquidatorAddress);
                let liquidatorUSDCBalanceAfter = await getAndPrintPRJBalance(usdcAddress, liquidatorAddress);
                
                await printSeparator();
            });

            it("Borrower borrow again all possible USDC by PRJ1 collateral", async function(){
                await printSeparator();
                let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
                let depositPositionBefore = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                let borrowPositionBefore = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
                let usdcBalanceBefore = await getAndPrintPRJBalance(usdcAddress, borrowerAddress);
                let pitRemainingBefore = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
                let healthFactorBefore = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

                let amountUsdcToBorrow = pitRemainingBefore;
                await pit.connect(borrower).borrow(prj1Address, usdcAddress, amountUsdcToBorrow);
                console.log("Borrowed: " + amountUsdcToBorrow);

                let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
                let depositPositionAfter = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                let borrowPositionAfter = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
                let usdcBalanceAfter = await getAndPrintPRJBalance(usdcAddress, borrowerAddress);
                let pitRemainingAfter = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
                let healthFactorAfter = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);

                await printSeparator();
            });

            it("Liquidator liquidates again borrower PRJ1 position", async function(){
                await printSeparator();

                console.log("=====borrower=====")
                let borrowBalanceStoredBefore = await getAndPrintBorrowBalanceStored(borrowerAddress);
                let depositPositionBefore = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                let borrowPositionBefore = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
                let usdcBalanceBefore = await getAndPrintPRJBalance(usdcAddress, borrowerAddress);
                let pitRemainingBefore = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
                let healthFactorBefore = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);
                console.log("=====liquidator=====")
                let liquidatorPRJ1BalanceBefore = await getAndPrintPRJBalance(prj1Address, liquidatorAddress);
                let liquidatorUSDCBalanceBefore = await getAndPrintPRJBalance(usdcAddress, liquidatorAddress);

                let PRJ1eval = await getAndPrintProjectTokenEvaluation(prj1Address, prj1Multiplier);
                await usdc.connect(liquidator).approve(busdcAddress, liquidatorUSDCBalanceBefore);
                await pit.connect(liquidator).liquidate(borrowerAddress, prj1Address, usdcAddress);
                console.log("Liquidated");

                console.log("=====borrower=====")
                let borrowBalanceStoredAfter = await getAndPrintBorrowBalanceStored(borrowerAddress);
                let depositPositionAfter = await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                let borrowPositionAfter = await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress);
                let usdcBalanceAfter = await getAndPrintPRJBalance(usdcAddress, borrowerAddress);
                let pitRemainingAfter = await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);
                let healthFactorAfter = await getAndPrintHealthFactor(borrowerAddress, prj1Address, usdcAddress);
                console.log("=====liquidator=====")
                let liquidatorPRJ1BalanceAfter = await getAndPrintPRJBalance(prj1Address, liquidatorAddress);
                let liquidatorUSDCBalanceAfter = await getAndPrintPRJBalance(usdcAddress, liquidatorAddress);
                
                await printSeparator();
            });

        });

        describe('Liquidate PRJ1 when borrow PRJ1 and PRJ2', async function(){
            it("Borrower deposits PRJ1 and PRJ2", async function(){
                await printSeparator("Borrower deposits PRJ1 and PRJ2");

                await getAndPrintPRJBalance(prj1Address, borrowerAddress);
                await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);

                await getAndPrintPRJBalance(prj2Address, borrowerAddress);
                await getAndPrintDepositPosition(borrowerAddress, prj2Address, usdcAddress);
                await getAndPrintPitRemaining(borrowerAddress, prj2Address, usdcAddress);

                let amountPRJ1ToDeposit = toBN(14_000).mul(prj1Multiplier);
                await prj1.connect(borrower).mintTo(borrowerAddress, amountPRJ1ToDeposit);
                await prj1.connect(borrower).approve(pitAddress, amountPRJ1ToDeposit);
                await pit.connect(borrower).deposit(prj1Address, usdcAddress,  amountPRJ1ToDeposit);
                console.log("\nDeposit PRJ1: " + amountPRJ1ToDeposit);

                let amountPRJ2ToDeposit = toBN(10_000).mul(prj2Multiplier);
                await prj2.connect(borrower).mintTo(borrowerAddress, amountPRJ2ToDeposit);
                await prj2.connect(borrower).approve(pitAddress, amountPRJ2ToDeposit);
                await pit.connect(borrower).deposit(prj2Address, usdcAddress, amountPRJ2ToDeposit);
                console.log("\nDeposit PRJ1: " + amountPRJ1ToDeposit);
    
                await getAndPrintPRJBalance(prj1Address, borrowerAddress);
                await getAndPrintDepositPosition(borrowerAddress, prj1Address, usdcAddress);
                await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress);

                await getAndPrintPRJBalance(prj2Address, borrowerAddress);
                await getAndPrintDepositPosition(borrowerAddress, prj2Address, usdcAddress);
                await getAndPrintPitRemaining(borrowerAddress, prj2Address, usdcAddress);

                await printSeparator();
            });

            it('Borrower borrow USDC using all PRJ1 and half of PRJ2', async function(){
                console.log("\n*** DEPOSIT PRJ1 ***")
                await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress)
                await getAndPrintPRJBalance(prj1Address, borrowerAddress)
                await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress)
                await getAndPrintPRJBalance(usdcAddress, borrowerAddress)

                let amountUsdcToBorrowByPrj1Collateral = toBN(2).pow(toBN(256)).sub(toBN(1))
                await pit.connect(borrower).borrow(prj1Address, usdcAddress, amountUsdcToBorrowByPrj1Collateral)
                console.log("\nBorrowed: " + amountUsdcToBorrowByPrj1Collateral)

                await getAndPrintBorrowPosition(borrowerAddress, prj1Address, usdcAddress)
                await getAndPrintPRJBalance(prj1Address, borrowerAddress)
                await getAndPrintPitRemaining(borrowerAddress, prj1Address, usdcAddress)
                await getAndPrintPRJBalance(usdcAddress, borrowerAddress)

                console.log("\n*** DEPOSIT PRJ2 ***")

                await getAndPrintBorrowPosition(borrowerAddress, prj2Address, usdcAddress)
                await getAndPrintPRJBalance(prj2Address, borrowerAddress)
                let pitRemainingPRJ2Before = await getAndPrintPitRemaining(borrowerAddress, prj2Address, usdcAddress)
                await getAndPrintPRJBalance(usdcAddress, borrowerAddress)

                let amountUsdcToBorrowByPrj2Collateral = pitRemainingPRJ2Before
                await pit.connect(borrower).borrow(prj2Address, usdcAddress, amountUsdcToBorrowByPrj2Collateral)
                console.log("\nBorrowed: " + amountUsdcToBorrowByPrj2Collateral)

                await getAndPrintBorrowPosition(borrowerAddress, prj2Address, usdcAddress)
                await getAndPrintPRJBalance(prj2Address, borrowerAddress)
                let pitRemainingPRJ2After = await getAndPrintPitRemaining(borrowerAddress, prj2Address, usdcAddress)
                await getAndPrintPRJBalance(usdcAddress, borrowerAddress)
            })



        });


        async function printSeparator(text){
            console.log("==========================================");
            if(text != undefined){
                console.log(text)
            }
        }

        async function getAndPrintHealthFactor(accountAddress, projectTokenAddress, lendingTokenAddress) {
            let healthFactor = await pit.healthFactor(accountAddress, projectTokenAddress, lendingTokenAddress);
            
            console.log("\nHealth factor: ");
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
            console.log("\nPIT_remaining: ")
            console.log("   account: " + accountAddress)
            console.log("   pitRemaining: " + pitRemaining)
            return pitRemaining;
        }

        async function getAndPrintBorrowBalanceStored(accountAddress) {
            let borrowStored = await busdc.borrowBalanceStored(accountAddress);
            console.log("\nBorrowBalanceStored: ")
            console.log("   accountAddress" + accountAddress)
            console.log("   borrowStored: " + borrowStored)
            return borrowStored;
        }

        async function getAndPrintTotalOutstanding(accountAddress, projectTokenAddress, lendingTokenAddress) {
            let totalOutstanding = await pit.totalOutstanding(accountAddress, projectTokenAddress, lendingTokenAddress);
            console.log("\nTotalOutstanging: ")
            console.log("   accountAddress: " + accountAddress);
            console.log("   projectTokenAddress: " + projectTokenAddress)
            console.log("   lendingTokenAddress: " + lendingTokenAddress)
            console.log("   total outstanding: " + totalOutstanding)
            return totalOutstanding;
        }

        async function getAndPrintProjectTokenEvaluation(projectTokenAddress, projectTokenAmount) {
            let projectTokenEvaluation = await pit.getProjectTokenEvaluation(projectTokenAddress, projectTokenAmount);
            console.log("\nEvaluation:")
            console.log("   projectToken: " + projectTokenAddress)
            console.log("   projectTokenAmount: " + projectTokenAmount)
            console.log("   projectTokenEvaluation: " + projectTokenEvaluation)
            return projectTokenEvaluation;
        }

        async function getAndPrintDepositPosition(accountAddress, projectTokenAddress, lendingTokenAddress) {
            let depositPosition = await pit.depositPosition(accountAddress, projectTokenAddress, lendingTokenAddress);
            console.log("\nDeposit position: ");
            console.log("   accountAddress: " + accountAddress)
            console.log("   projectTokenAddress: " + projectTokenAddress)
            console.log("   lendingTokenAddress: " + lendingTokenAddress)
            console.log("   depositedProjectTokenAmount: " + depositPosition)
            return depositPosition;
        }   

        async function getAndPrintBorrowPosition(accountAddress, projectTokenAddress, lendingTokenAddress) {
            let borrowPosition = await pit.borrowPosition(accountAddress, projectTokenAddress, lendingTokenAddress);
            console.log("\nBorrow position: ");
            console.log("   account: " + accountAddress)
            console.log("   projectTokenAddress: "+ projectTokenAddress)
            console.log("   loanBody:   " + borrowPosition.loanBody)
            console.log("   accrual:   " + borrowPosition.accrual)
            return borrowPosition;
        }

        async function getAndPrintPRJBalance(tokenAddress, accountAddress) {
            let token = await ERC20.attach(tokenAddress).connect(deployMaster);
            let balance = await token.balanceOf(accountAddress);
            console.log("\nERC20 account balance: ")
            console.log("   Address: " + tokenAddress);
            console.log("   Account: " + accountAddress);
            console.log("   Balance: " + balance);
            return balance;
        }

        async function mineBlocks(blockNumbers) {
            console.log("\nMined "+ (blockNumbers+1) + " blocks");
            for(var i = 0; i < blockNumbers; i++){
                await ethers.provider.send('evm_mine');
            }
        }


    });
   
});
