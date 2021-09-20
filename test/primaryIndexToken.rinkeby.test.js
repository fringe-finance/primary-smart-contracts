const ERC20Upgradeable = artifacts.require("ERC20Upgradeable");
const IPRJ = artifacts.require("IPRJ");
const IUSDCTest = artifacts.require("IUSDCTest");
const IUniswapV2Router02 = artifacts.require("IUniswapV2Router02");
const IUniswapV2Factory = artifacts.require("IUniswapV2Factory");
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");
const PrimaryIndexToken = artifacts.require("PrimaryIndexToken");
const Comptroller = artifacts.require("Comptroller");
const ICLendingToken = artifacts.require("ICLendingToken");
const CUSDC = artifacts.require("CUSDC");
const CPrimaryIndexToken = artifacts.require("CPrimaryIndexToken");
const SimplePriceOracle = artifacts.require("SimplePriceOracle");

const bigDecimal = require('js-big-decimal');
const BN = web3.utils.BN;
const chai = require('chai');
const expect = chai.expect;
chai.use(require('bn-chai')(BN));
chai.use(require('chai-match'));
const truffleAssert = require('truffle-assertions');
const fs = require('fs');


const log4js = require("log4js");
const { get } = require('http');
log4js.configure({
    appenders: {
        primaryIndexToken: { 
            type: "file",
            filename: "test/logs/primaryIndexTokenRinkeby.log"
        }
    },
    categories: {
        default: { 
            appenders: ["primaryIndexToken"], 
            level: "error" 
        }
    }
});
const pitLogger = log4js.getLogger("primaryIndexToken");
pitLogger.level = "debug";
pitLogger.info("===============================================================================================");


contract('PrimaryIndexToken', (accounts) => {
    
    

    const uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
    const uniswapFactoryAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
    const USDCaddress = '0x5236aAB9f4b49Bfd93a9500E427B042f65005E6A';
    const WETHaddress = '0xc778417E063141139Fce010982780140Aa0cD5Ab';
    let PRJsAddresses = [
                        '0x40EA2e5c5b2104124944282d8db39C5D13ac6770',//PRJ1
                        '0x69648Ef43B7496B1582E900569cd9dDEc49C045e',//PRJ2
                        '0xfA91A86700508806AD2A49Bebce34a08c6ad7a65',//PRJ3
                        '0xc6636b088AB0f794DDfc1204e7C58D8148f62203',//PRJ4
                        '0x37a7D483d2dfe97d0C00cEf6F257e25d321e6D4e',//PRJ5
                        '0x16E2f279A9BabD4CE133745DdA69C910CBe2e490' //PRJ6
                        ];
    let PRJaddress = PRJsAddresses[0];
    let primaryIndexTokenAddress = JSON.parse(fs.readFileSync('migrations/primaryIndexTokenProxyAddress.json', 'utf8')).primaryIndexTokenProxyAddress;
    let comptrollerAddress = JSON.parse(fs.readFileSync('migrations/comptrollerProxyAddress.json', 'utf8')).comptrollerProxyAddress;
    let cPrimaryIndexTokenAddress = JSON.parse(fs.readFileSync('migrations/cPrimaryIndexTokenProxyAddress.json', 'utf8')).cPrimaryIndexTokenProxyAddress;
    let cUSDCAddress = JSON.parse(fs.readFileSync('migrations/cUsdcProxyAddress.json', 'utf8')).cUsdcProxyAddress;

    let deployMaster = accounts[0];
    let moderator = accounts[1];
    let supplier1 = accounts[2];
    let borrower1 = accounts[3];
    let borrower2 = accounts[4];
    let liquidator1 = accounts[5];

    let lendingTokenId = new BN(0);
    let prjId = new BN(0);
    
    console.log("DEPLOY MASTER: "+deployMaster);
    console.log("SUPPLIER1: "+supplier1);
    console.log("BORROWER1: "+borrower1);

    let uniswapRouter;
    let uniswapFactory;
    let primaryIndexToken;
    let cPrimaryIndexToken;
    let cUsdc;
    let comptroller;
    let priceOracle;

    let ten = new BN(10);
    let PRJmultiplier;
    let USDCmultiplier;

    before(async () => {
        primaryIndexToken = await PrimaryIndexToken.at(primaryIndexTokenAddress);
        cPrimaryIndexToken = await CPrimaryIndexToken.at(cPrimaryIndexTokenAddress);

        uniswapRouter = await IUniswapV2Router02.at(uniswapRouterAddress);
        uniswapFactory = await IUniswapV2Factory.at(uniswapFactoryAddress);

        let prj = await IPRJ.at(PRJaddress);
        let PRJdecimals = await prj.decimals({from:deployMaster});
        PRJmultiplier = ten.pow(PRJdecimals);
        let deployMasterPRJamount = PRJmultiplier.mul(new BN(10_000_000_000_000));
        let moderatorPRJamount = PRJmultiplier.mul(new BN(10_000_000_000_000));
        let supplier1PRJamount = PRJmultiplier.mul(new BN(10_000_000_000_000));
        let borrower1PRJamount = PRJmultiplier.mul(new BN(10_000_000_000_000));
        let borrower2PRJamount = PRJmultiplier.mul(new BN(10_000_000_000_000));
        await prj.mintTo(deployMaster,deployMasterPRJamount,{from:deployMaster});
        await prj.mintTo(moderator,moderatorPRJamount,{from:deployMaster});
        await prj.mintTo(supplier1,supplier1PRJamount,{from:deployMaster});
        await prj.mintTo(borrower1, borrower1PRJamount,{from:deployMaster});
        await prj.mintTo(borrower2, borrower2PRJamount,{from:deployMaster});

        let usdctest = await IUSDCTest.at(USDCaddress);
        let USDCdecimals = await usdctest.decimals({from:deployMaster});
        USDCmultiplier = ten.pow(USDCdecimals);
        let amountUSDCdeployMaster =USDCmultiplier.mul(new BN(100_000_000_000)); 
        let amountUSDCsupplier1   = USDCmultiplier.mul(new BN(100_000_000_000));
        let amountUSDCborrower1   = USDCmultiplier.mul(new BN(100_000));
        let amountUSDCliquidator1 = USDCmultiplier.mul(new BN(1_000_000));
        await usdctest.mintTo(deployMaster,amountUSDCdeployMaster,{from:deployMaster});
        await usdctest.mintTo(supplier1,amountUSDCsupplier1,{from:deployMaster});
        await usdctest.mintTo(borrower1,amountUSDCborrower1,{from:deployMaster});
        await usdctest.mintTo(liquidator1,amountUSDCliquidator1,{from:deployMaster});

        cUsdc = await CUSDC.at(cUSDCAddress);
        comptroller = await Comptroller.at(comptrollerAddress);
        priceOracle = await SimplePriceOracle.at(SimplePriceOracle.address);

    });

    //deposit tests
    {
    it('Moderator deposits PRJ',async()=>{
        pitLogger.info();
        pitLogger.info("*******Moderator deposits PRJ Test******* ");

        let moderatorPRJbalanceBefore = await getERC20balance(PRJaddress,moderator);
        await printERC20balance(moderatorPRJbalanceBefore);

        let moderatorPRJdepositedBefore = await getDepositedPrjAmount(moderator,prjId);
        await printDepositedPrjAmount(moderatorPRJdepositedBefore);

        let amountPrjToDeposit = PRJmultiplier.mul(new BN(9_000_000));
        await approveTransferFrom(PRJaddress,primaryIndexTokenAddress,moderator,amountPrjToDeposit);
        await primaryIndexToken.deposit(prjId,amountPrjToDeposit,{from:moderator});
        pitLogger.info("Deposited "+  amountPrjToDeposit +" PRJ");

        let moderatorPRJbalanceAfter = await getERC20balance(PRJaddress,moderator);
        await printERC20balance(moderatorPRJbalanceAfter);

        let moderatorPRJdepositedAfter = await getDepositedPrjAmount(moderator,prjId);
        await printDepositedPrjAmount(moderatorPRJdepositedAfter);
    });  

    it('Moderator withdraw PRJ',async()=>{
        pitLogger.info();
        pitLogger.info("*******Moderator withdraw PRJ Test******* ");

        let moderatorPRJbalanceBefore = await getERC20balance(PRJaddress,moderator);
        await printERC20balance(moderatorPRJbalanceBefore);

        let moderatorPRJdepositedBefore = await getDepositedPrjAmount(moderator,prjId);
        await printDepositedPrjAmount(moderatorPRJdepositedBefore);

        let amountPrjToWithdraw = PRJmultiplier.mul(new BN(9_000_000));
        
        await primaryIndexToken.withdraw(prjId, amountPrjToWithdraw, {from:moderator});
        pitLogger.info("Withdrawed "+  amountPrjToWithdraw +" PRJ");

        let moderatorPRJbalanceAfter = await getERC20balance(PRJaddress,moderator);
        await printERC20balance(moderatorPRJbalanceAfter);

        let moderatorPRJdepositedAfter = await getDepositedPrjAmount(moderator,prjId);
        await printDepositedPrjAmount(moderatorPRJdepositedAfter);

    });
    }

    it('Supplier1 supply USDCTest', async()=>{
        pitLogger.info();
        pitLogger.info("*******Supply Test******* ");
        let lendingTokenId = new BN(0);

        let supplier1USDCbalanceBefore = await getERC20balance(USDCaddress,supplier1);
        let supplier1CUSDCbalanceBefore = await getERC20balance(cUSDCAddress,supplier1);
        await printERC20balance(supplier1USDCbalanceBefore);
        await printERC20balance(supplier1CUSDCbalanceBefore);
        
        let amountLendingToken = USDCmultiplier.mul(new BN(1_000_000));
        await approveTransferFrom(USDCaddress,cUSDCAddress,supplier1,amountLendingToken);
        let supplyRes = await primaryIndexToken.supply(lendingTokenId,amountLendingToken,{from:supplier1});
        {
                // for(var log of supplyRes['logs']){
                //     if(log['event']=="Test1"){
                //         console.log("mint:  "+log['args']['mintedAmount']);
                        
                //     }
                // }
        }
        let supplier1USDCbalanceAfter = await getERC20balance(USDCaddress,supplier1);
        let supplier1CUSDCbalanceAfter = await getERC20balance(cUSDCAddress,supplier1);
        await printERC20balance(supplier1USDCbalanceAfter);
        await printERC20balance(supplier1CUSDCbalanceAfter);

    });



    //redeem tests
    {
    it('Supplier1 redeem USDCTest',async()=>{
        pitLogger.info();
        pitLogger.info("*******Redeem Test******* ");
        let lendingTokenId = new BN(0);

        let supplier1USDCbalanceBefore = await getERC20balance(USDCaddress,supplier1);
        let supplier1CUSDCbalanceBefore = await getERC20balance(cUSDCAddress,supplier1);
        await printERC20balance(supplier1USDCbalanceBefore);
        await printERC20balance(supplier1CUSDCbalanceBefore);
        
       
        let amountCUSDCtoRedeem = supplier1CUSDCbalanceBefore.balance.div(new BN(4));
        let redeemResult = await primaryIndexToken.redeem(lendingTokenId,amountCUSDCtoRedeem,{from:supplier1});
        {
            for(var log of redeemResult['logs']){
                if(log['event']=="Test1"){
                    console.log("mint:  "+log['args']['mintedAmount']);
                }
            }
        }
        let supplier1UsdctestAmountAfter = await getERC20balance(USDCaddress,supplier1);
        let supplier1CUSDCbalanceAfter = await getERC20balance(cUSDCAddress,supplier1);
        await printERC20balance(supplier1UsdctestAmountAfter);
        await printERC20balance(supplier1CUSDCbalanceAfter);
    });

    it('Supplier1 redeemUnderlying USDCTest',async()=>{
        pitLogger.info();
        pitLogger.info("*******RedeemUnderlying Test******* ");
        let lendingTokenId = new BN(0);

        let supplier1USDCbalanceBefore = await getERC20balance(USDCaddress,supplier1);
        let supplier1CUSDCbalanceBefore = await getERC20balance(cUSDCAddress,supplier1);
        await printERC20balance(supplier1USDCbalanceBefore);
        await printERC20balance(supplier1CUSDCbalanceBefore);
        
        let amountUSDCtoRedeem = USDCmultiplier.mul(new BN(250_000));
        let redeemResult = await primaryIndexToken.redeemUnderlying(lendingTokenId,amountUSDCtoRedeem,{from:supplier1});
        {
            for(var log of redeemResult['logs']){
                if(log['event']=="Test1"){
                    console.log("mint:  "+log['args']['mintedAmount']);
                }
            }
        }
        let supplier1UsdctestAmountAfter = await getERC20balance(USDCaddress,supplier1);
        let supplier1CUSDCbalanceAfter = await getERC20balance(cUSDCAddress,supplier1);
        await printERC20balance(supplier1UsdctestAmountAfter);
        await printERC20balance(supplier1CUSDCbalanceAfter);
    });
    }

    //borrow test;
    {
    it('Borrower1 deposit PRJ',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower1 Deposit Test******* ");

        let prjId = new BN(0);
        
        let borrower1PRJbalanceBefore = await getERC20balance(PRJaddress,borrower1);
        await printERC20balance(borrower1PRJbalanceBefore);

        let borrower1PRJdepositedBefore = await getDepositedPrjAmount(borrower1,prjId);
        await printDepositedPrjAmount(borrower1PRJdepositedBefore);

       
        let amountPrjToDeposit = PRJmultiplier.mul(new BN(2_000_000));
        await approveTransferFrom(PRJaddress,primaryIndexTokenAddress,borrower1,amountPrjToDeposit);
        await primaryIndexToken.deposit(prjId,amountPrjToDeposit,{from:borrower1});
        pitLogger.info("Deposited "+  amountPrjToDeposit +" PRJ");

        let borrower1PRJbalanceAfter = await getERC20balance(PRJaddress,borrower1);
        await printERC20balance(borrower1PRJbalanceAfter);

        let borrower1PRJdepositedAfter = await getDepositedPrjAmount(borrower1,prjId);
        await printDepositedPrjAmount(borrower1PRJdepositedAfter);

    });

    

    it('Borrower1 borrow USDC',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower1 borrow Test******* ");

        let borrower1USDCbalanceBefore = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceBefore);

        let borrower1BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId);
        await printBorrowPosition(borrower1BorrowPositionBefore);

        let borrower1CPITbalanceBefore = await getERC20balance(cPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1CPITbalanceBefore);

        let borrower1LiquidityBefore = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityBefore);
        
        let amountLendingTokenToBorrow = USDCmultiplier.mul(new BN(200_000));
        pitLogger.info("Borrowed "+ amountLendingTokenToBorrow+" tokens");
        let borrowRes = await primaryIndexToken.borrow(lendingTokenId,amountLendingTokenToBorrow,{from:borrower1});


        let borrower1USDCbalanceAfter = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceAfter);

        let borrower1BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId);
        await printBorrowPosition(borrower1BorrowPositionAfter);

        let borrower1CPITbalanceAfter = await getERC20balance(cPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1CPITbalanceAfter);

        let borrower1LiquidityAfter = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityAfter);

    });

    it('Borrower1 borrow extra USDC',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower1 extra borrow Test******* ");

        let borrower1USDCbalanceBefore = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceBefore);

        let borrower1BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId);
        await printBorrowPosition(borrower1BorrowPositionBefore);

        let borrower1PITbalanceBefore = await getERC20balance(primaryIndexTokenAddress, borrower1);
        await printERC20balance(borrower1PITbalanceBefore);

        let borrower1CPITbalanceBefore = await getERC20balance(cPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1CPITbalanceBefore);

        let borrower1LiquidityBefore = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityBefore);
        
        let amountLendingTokenToBorrow = USDCmultiplier.mul(new BN(50_000));
        let borrowRes = await primaryIndexToken.borrow(lendingTokenId,amountLendingTokenToBorrow,{from:borrower1});
        pitLogger.info("Borrowed "+ amountLendingTokenToBorrow+" tokens");

        let borrower1USDCbalanceAfter = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceAfter);

        let borrower1BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId);
        await printBorrowPosition(borrower1BorrowPositionAfter);

        let borrower1PITbalanceAfter = await getERC20balance(primaryIndexTokenAddress, borrower1);
        await printERC20balance(borrower1PITbalanceAfter);

        let borrower1CPITbalanceAfter = await getERC20balance(cPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1CPITbalanceAfter);

        let borrower1LiquidityAfter = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityAfter);
    });

    it('Borrower1 repay half borrow',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower1 repay half borrow Test******* ");

        let borrower1USDCbalanceBefore = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceBefore);

        let borrower1BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId);
        await printBorrowPosition(borrower1BorrowPositionBefore);

        let borrower1PITbalanceBefore = await getERC20balance(primaryIndexTokenAddress, borrower1);
        await printERC20balance(borrower1PITbalanceBefore);

        let borrower1CPITbalanceBefore = await getERC20balance(cPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1CPITbalanceBefore);

        let borrower1LiquidityBefore = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityBefore);
        
        let amountLendingTokenToRepay = USDCmultiplier.mul(new BN(125_000));
        await approveTransferFrom(USDCaddress,cUSDCAddress,borrower1,amountLendingTokenToRepay);
        let borrowRes = await primaryIndexToken.repayBorrow(lendingTokenId, amountLendingTokenToRepay, {from:borrower1});
        pitLogger.info("Repayed "+ amountLendingTokenToRepay+" tokens");

        let borrower1USDCbalanceAfter = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceAfter);

        let borrower1BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId);
        await printBorrowPosition(borrower1BorrowPositionAfter);

        let borrower1PITbalanceAfter = await getERC20balance(primaryIndexTokenAddress, borrower1);
        await printERC20balance(borrower1PITbalanceAfter);

        let borrower1CPITbalanceAfter = await getERC20balance(cPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1CPITbalanceAfter);

        let borrower1LiquidityAfter = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityAfter);

    });

    it('Borrower1 repay all borrow',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower1 repay all borrow Test******* ");

        let borrower1USDCbalanceBefore = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceBefore);

        let borrower1BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId);
        await printBorrowPosition(borrower1BorrowPositionBefore);

        let borrower1PITbalanceBefore = await getERC20balance(primaryIndexTokenAddress, borrower1);
        await printERC20balance(borrower1PITbalanceBefore);

        let borrower1CPITbalanceBefore = await getERC20balance(cPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1CPITbalanceBefore);

        let borrower1LiquidityBefore = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityBefore);
        
        let amountLendingTokenToRepay = (new BN(2)).pow(new BN(256)).sub(new BN(1));//USDCmultiplier.mul(new BN(125_000));
        await approveTransferFrom(USDCaddress,cUSDCAddress,borrower1,amountLendingTokenToRepay);
        let borrowRes = await primaryIndexToken.repayBorrow(lendingTokenId, amountLendingTokenToRepay, {from:borrower1});
        pitLogger.info("Repayed "+ amountLendingTokenToRepay+" tokens");

        let borrower1USDCbalanceAfter = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceAfter);

        let borrower1BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId);
        await printBorrowPosition(borrower1BorrowPositionAfter);

        let borrower1PITbalanceAfter = await getERC20balance(primaryIndexTokenAddress, borrower1);
        await printERC20balance(borrower1PITbalanceAfter);

        let borrower1CPITbalanceAfter = await getERC20balance(cPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1CPITbalanceAfter);

        let borrower1LiquidityAfter = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityAfter);

    });

    }
    
    it('Borrower2 deposit PRJ',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower2 Deposit Test******* ");
        
        let borrower2PRJbalanceBefore = await getERC20balance(PRJaddress,borrower2);
        await printERC20balance(borrower2PRJbalanceBefore);

        let borrower2PRJdepositedBefore = await getDepositedPrjAmount(borrower2,prjId);
        await printDepositedPrjAmount(borrower2PRJdepositedBefore);

       
        let amountPrjToDeposit = PRJmultiplier.mul(new BN(1_000_000));
        await approveTransferFrom(PRJaddress,primaryIndexTokenAddress,borrower2,amountPrjToDeposit);
        await primaryIndexToken.deposit(prjId,amountPrjToDeposit,{from:borrower2});
        pitLogger.info("Deposited "+  amountPrjToDeposit +" PRJ");

        let borrower2PRJbalanceAfter = await getERC20balance(PRJaddress,borrower2);
        await printERC20balance(borrower2PRJbalanceAfter);

        let borrower2PRJdepositedAfter = await getDepositedPrjAmount(borrower2,prjId);
        await printDepositedPrjAmount(borrower2PRJdepositedAfter);
    });

    it('Borrower2 borrowed USDC',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower2 borrow Test******* ");

        let borrower2USDCbalanceBefore = await getERC20balance(USDCaddress,borrower2);
        await printERC20balance(borrower2USDCbalanceBefore);

        let borrower2BorrowPositionBefore = await getBorrowPosition(borrower2,lendingTokenId);
        await printBorrowPosition(borrower2BorrowPositionBefore);

        let borrower2CPITbalanceBefore = await getERC20balance(cPrimaryIndexTokenAddress,borrower2);
        await printERC20balance(borrower2CPITbalanceBefore);

        let borrower2LiquidityBefore = await getLiquidity(borrower2);
        await printLiquidity(borrower2LiquidityBefore);

        let borrower2PitBalanceBefore = await getBalanceOfPit(borrower2);
        await printBalanceOfPit(borrower2PitBalanceBefore);

        let borrower2AccountHealthBefore = await getAccountHealth(borrower2,lendingTokenId);
        await printAccountHealth(borrower2AccountHealthBefore);
        
        let amountLendingTokenToBorrow = borrower2PitBalanceBefore;//USDCmultiplier.mul(new BN(405_000));
        pitLogger.info("Borrowed "+ amountLendingTokenToBorrow+" tokens");
        let borrowRes = await primaryIndexToken.borrow(lendingTokenId,amountLendingTokenToBorrow,{from:borrower2});

        let borrower2USDCbalanceAfter = await getERC20balance(USDCaddress,borrower2);
        await printERC20balance(borrower2USDCbalanceAfter);

        let borrower2BorrowPositionAfter = await getBorrowPosition(borrower2,lendingTokenId);
        await printBorrowPosition(borrower2BorrowPositionAfter);

        let borrower2CPITbalanceAfter = await getERC20balance(cPrimaryIndexTokenAddress,borrower2);
        await printERC20balance(borrower2CPITbalanceAfter);

        let borrower2LiquidityAfter = await getLiquidity(borrower2);
        await printLiquidity(borrower2LiquidityAfter);
        
        let borrower2PitBalanceAfter = await getBalanceOfPit(borrower2);
        await printBalanceOfPit(borrower2PitBalanceAfter);

        let borrower2AccountHealthAfter = await getAccountHealth(borrower2,lendingTokenId);
        await printAccountHealth(borrower2AccountHealthAfter);

    });

    it('Borrower2 withdraws some part of PRJ',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower2 withdraws some part of PRJ Test******* ");

        let borrower2PRJbalanceBefore = await getERC20balance(PRJaddress,borrower2);
        await printERC20balance(borrower2PRJbalanceBefore);

        let borrower2PRJdepositedBefore = await getDepositedPrjAmount(borrower2,prjId);
        await printDepositedPrjAmount(borrower2PRJdepositedBefore);

        let borrower2AccountHealthBefore = await getAccountHealth(borrower2,lendingTokenId);
        await printAccountHealth(borrower2AccountHealthBefore);

        let amoutPRJtoWithdraw = PRJmultiplier.mul(new BN(200_000));
        pitLogger.info("Withdrawed "+ amoutPRJtoWithdraw+" PRJ");
        let withdrawResult = await primaryIndexToken.withdraw(prjId,amoutPRJtoWithdraw,{from:borrower2});
        for(var log of withdrawResult['logs']){
            if(log['event']=="Test4"){
                console.log("prevNum:    "+log['args']['prevNum']);
                console.log("prevDenom:  "+log['args']['prevDenom']);
                console.log("newNum:     "+log['args']['newNum']);
                console.log("newDenom:   "+log['args']['newDenom']);
            }
        }

        let borrower2PRJbalanceAfter = await getERC20balance(PRJaddress,borrower2);
        await printERC20balance(borrower2PRJbalanceAfter);

        let borrower2PRJdepositedAfter = await getDepositedPrjAmount(borrower2,prjId);
        await printDepositedPrjAmount(borrower2PRJdepositedAfter);

        let borrower2AccountHealthAfter = await getAccountHealth(borrower2,lendingTokenId);
        await printAccountHealth(borrower2AccountHealthAfter);

    });

    it('Increase price of PRJ',async()=>{
        pitLogger.info();
        pitLogger.info("*******Increased price of PRJ Test******* ");
    
        let borrower2AccountHealthBefore = await getAccountHealth(borrower2,lendingTokenId);
        await printAccountHealth(borrower2AccountHealthBefore);

        let amountUSDC = USDCmultiplier.mul(new BN(500_000));
        await increasePriceOfPrj(USDCaddress,PRJaddress,amountUSDC,deployMaster);

        let borrower2AccountHealthAfter = await getAccountHealth(borrower2,lendingTokenId);
        await printAccountHealth(borrower2AccountHealthAfter);

    });

    it('First try to liquidate borrower2 position',async()=>{
        pitLogger.info();
        pitLogger.info("*******First try to liquidate borrower2 Test******* ");
        
        let liquidator1PRJbalanceBefore = await getERC20balance(PRJaddress,liquidator1);
        await printERC20balance(liquidator1PRJbalanceBefore);

        let liquidator1USDCbalanceBefore = await getERC20balance(USDCaddress,liquidator1);
        await printERC20balance(liquidator1USDCbalanceBefore);

        let borrower2AccountHealthBefore = await getAccountHealth(borrower2,lendingTokenId);
        await printAccountHealth(borrower2AccountHealthBefore);

        let amountPRJtoLiquidate = PRJmultiplier.mul(new BN(500_000));
        let liquidateResult = await primaryIndexToken.liquidate(borrower2,lendingTokenId,prjId,{from:liquidator1});

        for(var log of liquidateResult['logs']){
            if(log['event']=="Test3"){
                console.log("mint:  "+log['args']['mintedAmount']);
            }
        }

        let liquidator1PRJbalanceAfter = await getERC20balance(PRJaddress,liquidator1);
        await printERC20balance(liquidator1PRJbalanceAfter);

        let liquidator1USDCbalanceAfter = await getERC20balance(USDCaddress,liquidator1);
        await printERC20balance(liquidator1USDCbalanceAfter);

        let borrower2AccountHealthAfter = await getAccountHealth(borrower2,lendingTokenId);
        await printAccountHealth(borrower2AccountHealthAfter);

    });

    it('Decrease price of PRJ',async()=>{
        pitLogger.info();
        pitLogger.info("*******Decrease price of PRJ Test******* ");

        let borrower2AccountHealthBefore = await getAccountHealth(borrower2,lendingTokenId);
        await printAccountHealth(borrower2AccountHealthBefore);

        let amountPRJ = PRJmultiplier.mul(new BN(500_000));
        await decreasePriceOfPrj(USDCaddress,PRJaddress,amountPRJ,deployMaster);

        let borrower2AccountHealthAfter = await getAccountHealth(borrower2,lendingTokenId);
        await printAccountHealth(borrower2AccountHealthAfter);

    });

    it('Second try to liquidate borrower2 position',async()=>{
        pitLogger.info();
        pitLogger.info("*******Second try to liquidate borrower2 Test******* ");
        
        let liquidator1PRJbalanceBefore = await getERC20balance(PRJaddress,liquidator1);
        await printERC20balance(liquidator1PRJbalanceBefore);

        let liquidator1USDCbalanceBefore = await getERC20balance(USDCaddress,liquidator1);
        await printERC20balance(liquidator1USDCbalanceBefore);

        let borrower2AccountHealthBefore = await getAccountHealth(borrower2,lendingTokenId);
        await printAccountHealth(borrower2AccountHealthBefore);

        let amountPRJtoLiquidate = await primaryIndexToken.getDepositedPrjAmount(borrower2,prjId,{from:liquidator1});
        let amountLendingTokenToSend = await primaryIndexToken.getPrjEvaluationInLendingTokenWithSale(USDCaddress,PRJaddress,amountPRJtoLiquidate,{from:liquidator1});
        pitLogger.info("Amount liquidator1 send: "+amountLendingTokenToSend);
        await approveTransferFrom(USDCaddress,primaryIndexTokenAddress,liquidator1,amountLendingTokenToSend);
        let liquidateResult = await primaryIndexToken.liquidate(borrower2,lendingTokenId,prjId,{from:liquidator1});

        for(var log of liquidateResult['logs']){
            if(log['event']=="Test3"){
                console.log("amoutLendingTokenToReceive:  "+log['args']['amoutLendingTokenToReceive']);
                console.log("amountBorrowed:              "+log['args']['amountBorrowed']);

            }
        }

        let liquidator1PRJbalanceAfter = await getERC20balance(PRJaddress,liquidator1);
        await printERC20balance(liquidator1PRJbalanceAfter);

        let liquidator1USDCbalanceAfter = await getERC20balance(USDCaddress,liquidator1);
        await printERC20balance(liquidator1USDCbalanceAfter);

        let borrower2AccountHealthAfter = await getAccountHealth(borrower2,lendingTokenId);
        await printAccountHealth(borrower2AccountHealthAfter);
    });



    it('blank test',async()=>{
        console.log("blank test");
    });

    async function getAccountHealth(account, lendingTokenId){
        let accHealth = await primaryIndexToken.healthFactor(account,lendingTokenId);
        return accHealth;
    }

    async function printAccountHealth(data){
        pitLogger.info("Account Health:");
        pitLogger.info("    numerator:   "+data['0']);
        pitLogger.info("    denominator: "+data['1']);
        
        if(data['1'].cmp(new BN(0)) !=0){
            pitLogger.info("    health factor: "+bigDecimal.divide(data['0'],data['1'],new BN(4)));
        }else{
            pitLogger.info("    health factor cant be calculated because division by zero is forbidden");
        }
    }
       
    async function getBorrowPosition(account, lendingTokenId){
        let position = await primaryIndexToken.getBorrowPosition(account,lendingTokenId,{from:account});
        return position;
    }

    async function printBorrowPosition(data){
        pitLogger.info("Borrow position:");
        pitLogger.info("    amountBorrowed: "+data['0'])
        pitLogger.info("    amountPit: "+data['1'])
    }

    async function getLiquidity(account){
        let liquidity = await primaryIndexToken.getLiquidity(account,{from:account});
        return liquidity;
    }

    async function printLiquidity(data){
        pitLogger.info("Account Liquidity: "+data);
    }

    async function getDepositedPrjAmount(account, prjId){
        let position = await primaryIndexToken.getDepositedPrjAmount(account,prjId,{from:account});
        return position;
    }

    async function printDepositedPrjAmount(data){
        pitLogger.info("Deposited PRJ amount: "+data);
    }

    async function getBalanceOfPit(account){
        let PITbalance = await primaryIndexToken.balanceOfPit(account);
        return PITbalance;
    }

    async function printBalanceOfPit(data){
        pitLogger.info("Account PIT balance: "+data);
    }

    async function getTotalSupplyPit(){
        let pitTotalSupply = await primaryIndexToken.totalSupplyPit();
        return pitTotalSupply;
    }

    async function printTotalSupplyPit(data){
        pitLogger.info("Total Supply Pit: "+data);
    }

    async function printUniswapPoolReserves(token0Address,token1Address){
        let pairAddress = await uniswapFactory.getPair(token0Address,token1Address,{from:deployMaster});
        let uniswapPair = await IUniswapV2Pair.at(pairAddress);
        let token0address = await uniswapPair.token0();
        let token1address = await uniswapPair.token1();
        let reserves = await uniswapPair.getReserves();
        let token0 = await ERC20Upgradeable.at(token0address);
        let token1 = await ERC20Upgradeable.at(token1address);
        let token0decimals = await token0.decimals();
        let token1decimals = await token1.decimals();
        pitLogger.info("Pair reserves: "+(await token0.symbol())+"/"+(await token1.symbol()));
        pitLogger.info("   "+(await token0.symbol())+": "+bigDecimal.divide(reserves.reserve0,ten.pow(token0decimals),Number(token0decimals)));
        pitLogger.info("   "+(await token1.symbol())+": "+bigDecimal.divide(reserves.reserve1,ten.pow(token1decimals),Number(token1decimals)));
        // pitLogger.info("   token0 raw: "+reserves.reserve0.toString())
        // pitLogger.info("   token1 raw: "+reserves.reserve1.toString())
    }

    async function decreasePriceOfPrj(USDCaddress,PRJaddress,PRJamount,sender){
        await approveTransferFrom(PRJaddress,uniswapRouterAddress,sender,PRJamount);
        await uniswapRouter.swapExactTokensForTokens(
            PRJamount,
            new BN(0),
            [PRJaddress,USDCaddress],
            sender,
            new BN(new Date().getTime() + (60 * 60 * 1000)),
            {from:sender}
        );
        pitLogger.info("Decreased price of PRJ. PRJ amount given: "+PRJamount);
    }

    async function increasePriceOfPrj(USDCaddress,PRJaddress,USDCamount,sender){
        await approveTransferFrom(USDCaddress,uniswapRouterAddress,sender,USDCamount);
        await uniswapRouter.swapExactTokensForTokens(
            USDCamount,
            new BN(0),
            [USDCaddress,PRJaddress],
            sender,
            new BN(new Date().getTime() + (60 * 60 * 1000)),
            {from:sender}
        );
        pitLogger.info("Increased price of PRJ. USDC amount given: "+USDCamount);
    }

    async function getERC20balance(ERC20address, account){
        let token = await ERC20Upgradeable.at(ERC20address);
        let name = await token.name();
        let symbol = await token.symbol();
        let decimals = await token.decimals();
        let balance = await token.balanceOf(account);
        let data = {
            "name" : name,
            "symbol" : symbol,
            "decimals" : decimals,
            "balance" : balance
        }
        return data;
    }

    async function printERC20balance(data){
        let tokenBalanceHumanReadable = bigDecimal.divide(data.balance, 10 ** data.decimals, Number(data.decimals));
        pitLogger.info("Account Balance:");
        pitLogger.info("    "+data.symbol+" balance raw: "+data.balance);
        pitLogger.info("    "+data.symbol+" balance    : "+tokenBalanceHumanReadable);
    }

    async function approveTransferFrom(tokenAddress,spenderAccount,ownerAccount,amount){
        let tokenInstance = await ERC20Upgradeable.at(tokenAddress);
        await tokenInstance.approve(
            spenderAccount,
            amount,
            {from: ownerAccount}
        );
    }

   
});