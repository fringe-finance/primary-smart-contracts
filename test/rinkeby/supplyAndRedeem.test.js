const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");

const BN = hre.ethers.BigNumber;

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

      
        describe("Suply/Redeem", async function(){
            it('DeployMaster supply all USDC', async function(){
                await printSeparator();
                console.log("=====BEFORE======")
                let deployMasterUsdcAmountBefore = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
                let deployMasterBusdcAmountBefore = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
                await usdc.approve(busdcAddress, deployMasterUsdcAmountBefore);
                await pit.supply(usdcAddress, deployMasterUsdcAmountBefore);
                console.log("=====AFTER======")
                let deployMasterUsdcAmountAfter = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
                let deployMasterBusdcAmountAfter = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
                await printSeparator();
            });

            it('DeployMaster redeem half supply', async function(){
                await printSeparator();
                console.log("=====BEFORE======")
                let deployMasterUsdcAmountBefore = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
                let deployMasterBusdcAmountBefore = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
                let amountBusdcToRedeem = deployMasterBusdcAmountBefore.div(toBN(2));
                await pit.redeem(usdcAddress, amountBusdcToRedeem);
                console.log("=====AFTER======")
                let deployMasterUsdcAmountAfter = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
                let deployMasterBusdcAmountAfter = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
                await printSeparator();
            });
            
            it('DeployMaster redeem all supply', async function(){
                await printSeparator();
                console.log("=====BEFORE======")
                let deployMasterUsdcAmountBefore = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
                let deployMasterBusdcAmountBefore = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
                let amountBusdcToRedeem = deployMasterBusdcAmountBefore;
                await pit.redeem(usdcAddress, amountBusdcToRedeem);
                console.log("=====AFTER======")
                let deployMasterUsdcAmountAfter = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
                let deployMasterBusdcAmountAfter = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
                await printSeparator();
            });

            it('DeployMaster supply 1_000_000 USDC', async function(){
                await printSeparator();
                console.log("=====BEFORE======")
                let deployMasterUsdcAmountBefore = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
                let deployMasterBusdcAmountBefore = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
                let usdcAmount = toBN(1_000_000).mul(usdcMultiplier);
                await usdc.approve(busdcAddress, usdcAmount);
                await pit.supply(usdcAddress, usdcAmount);
                console.log("=====AFTER======")
                let deployMasterUsdcAmountAfter = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
                let deployMasterBusdcAmountAfter = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
                await printSeparator();
            });

            it('Supplier supply 10_000_000',async function(){
                await printSeparator();
                console.log("=====BEFORE======")
                let deployMasterUsdcAmountBefore = await getAndPrintERC20Balance(usdcAddress, supplierAddress);
                let deployMasterBusdcAmountBefore = await getAndPrintERC20Balance(busdcAddress, supplierAddress);
                let usdcAmount = toBN(1_000_000).mul(usdcMultiplier);
                await usdc.connect(supplier).approve(busdcAddress, usdcAmount);
                await pit.connect(supplier).supply(usdcAddress, usdcAmount);
                console.log("=====AFTER======")
                let deployMasterUsdcAmountAfter = await getAndPrintERC20Balance(usdcAddress, supplierAddress);
                let deployMasterBusdcAmountAfter = await getAndPrintERC20Balance(busdcAddress, supplierAddress);
                await printSeparator();
            });

            it('Mine 50 blocks', async function(){
                await mineBlocks(50);
            });

            it('DeployMaster redeem all his supply', async function(){
                await printSeparator();
                console.log("=====BEFORE======")
                let deployMasterUsdcAmountBefore = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
                let deployMasterBusdcAmountBefore = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
                let amountBusdcToRedeem = deployMasterBusdcAmountBefore;
                await pit.redeem(usdcAddress, amountBusdcToRedeem);
                console.log("=====AFTER======")
                let deployMasterUsdcAmountAfter = await getAndPrintERC20Balance(usdcAddress, deployMasterAddress);
                let deployMasterBusdcAmountAfter = await getAndPrintERC20Balance(busdcAddress, deployMasterAddress);
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
            console.log("   accrual:   " + borrowPosition.accrual);
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
