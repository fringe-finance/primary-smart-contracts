const ERC20Upgradeable = artifacts.require("ERC20Upgradeable");
const IPRJ = artifacts.require("IPRJ");
const IUSDCTest = artifacts.require("IUSDCTest");
const IUniswapV2Router02 = artifacts.require("IUniswapV2Router02");
const IUniswapV2Factory = artifacts.require("IUniswapV2Factory");
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");
const PrimaryIndexToken = artifacts.require("PrimaryIndexToken");
const Comptroller = artifacts.require("Comptroller");
const IBLendingToken = artifacts.require("IBLendingToken");
const BUSDC = artifacts.require("BUSDC");
const BPrimaryIndexToken = artifacts.require("BPrimaryIndexToken");
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
            filename: "test/logs/borrowcase1Rinkeby.log"
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
    let PRJ1address = PRJsAddresses[0];
    let PRJ2address = PRJsAddresses[1];
    let PRJ3address = PRJsAddresses[2];
    let PRJ4address = PRJsAddresses[3];
    let PRJ5address = PRJsAddresses[4];
    let PRJ6address = PRJsAddresses[5];
    let prj1Id = new BN(0);
    let prj2Id = new BN(1);
    let prj3Id = new BN(2);
    let prj4Id = new BN(3);
    let prj5Id = new BN(4);
    let prj6Id = new BN(5);


    let lendingTokenId = new BN(0);

    let primaryIndexTokenAddress = JSON.parse(fs.readFileSync('migrations/primaryIndexTokenProxyAddress.json', 'utf8')).primaryIndexTokenProxyAddress;
    let comptrollerAddress = JSON.parse(fs.readFileSync('migrations/comptrollerProxyAddress.json', 'utf8')).comptrollerProxyAddress;
    let bPrimaryIndexTokenAddress = JSON.parse(fs.readFileSync('migrations/bPrimaryIndexTokenProxyAddress.json', 'utf8')).bPrimaryIndexTokenProxyAddress;
    let bUSDCAddress = JSON.parse(fs.readFileSync('migrations/bUsdcProxyAddress.json', 'utf8')).bUsdcProxyAddress;

    let deployMaster = accounts[0];
    let moderator = accounts[1];
    let supplier1 = accounts[2];
    let borrower1 = accounts[3];
    let borrower2 = accounts[4];
    
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
    let PRJ1multiplier;
    let PRJ2multiplier;
    let PRJ3multiplier;
    let PRJ4multiplier;
    let PRJ5multiplier;
    let PRJ6multiplier;
    let USDCmultiplier;

    before(async () => {
        pitLogger.info("*******Initial parametrs******* ")
        primaryIndexToken = await PrimaryIndexToken.at(primaryIndexTokenAddress);
        cPrimaryIndexToken = await BPrimaryIndexToken.at(bPrimaryIndexTokenAddress);

        uniswapRouter = await IUniswapV2Router02.at(uniswapRouterAddress);
        uniswapFactory = await IUniswapV2Factory.at(uniswapFactoryAddress);

        let prj1 = await IPRJ.at(PRJ1address);
        let prj2 = await IPRJ.at(PRJ2address);
        let prj3 = await IPRJ.at(PRJ3address);
        let prj4 = await IPRJ.at(PRJ4address);
        let prj5 = await IPRJ.at(PRJ5address);
        let prj6 = await IPRJ.at(PRJ6address);
        let PRJ1decimals = await prj1.decimals({from:deployMaster});
        let PRJ2decimals = await prj2.decimals({from:deployMaster});
        let PRJ3decimals = await prj3.decimals({from:deployMaster});
        let PRJ4decimals = await prj4.decimals({from:deployMaster});
        let PRJ5decimals = await prj5.decimals({from:deployMaster});
        let PRJ6decimals = await prj6.decimals({from:deployMaster});
        PRJ1multiplier = ten.pow(PRJ1decimals);
        PRJ2multiplier = ten.pow(PRJ2decimals);
        PRJ3multiplier = ten.pow(PRJ3decimals);
        PRJ4multiplier = ten.pow(PRJ4decimals);
        PRJ5multiplier = ten.pow(PRJ5decimals);
        PRJ6multiplier = ten.pow(PRJ6decimals);
        
        let borrower1PRJ1amount = PRJ1multiplier.mul(toBN(30));
        await prj1.mintTo(borrower1, borrower1PRJ1amount,{from:deployMaster});
        let balancePRJ1borrower1 = await getERC20balance(PRJ1address,borrower1);
        pitLogger.info("PRJ1 balance borrower1:");
        await printERC20balance(balancePRJ1borrower1);

        let borrower1PRJ2amount = PRJ2multiplier.mul(toBN(50));
        await prj2.mintTo(borrower1, borrower1PRJ2amount,{from:deployMaster});
        let balancePRJ2borrower1 = await getERC20balance(PRJ2address,borrower1);
        pitLogger.info("PRJ2 balance borrower1:");
        await printERC20balance(balancePRJ2borrower1);

        let borrower1PRJ3amount = PRJ3multiplier.mul(toBN(100));
        await prj3.mintTo(borrower1, borrower1PRJ3amount,{from:deployMaster});
        let balancePRJ3borrower1 = await getERC20balance(PRJ3address,borrower1);
        pitLogger.info("PRJ3 balance borrower1:");
        await printERC20balance(balancePRJ3borrower1);
    
        let usdctest = await IUSDCTest.at(USDCaddress);
        let USDCdecimals = await usdctest.decimals({from:deployMaster});
        USDCmultiplier = ten.pow(USDCdecimals);
        let amountUSDCsupplier1   = USDCmultiplier.mul(new BN(100_000_000_000));
        let amountUSDCborrower1   = USDCmultiplier.mul(new BN(100));
        await usdctest.mintTo(supplier1,amountUSDCsupplier1,{from:deployMaster});
        await usdctest.mintTo(borrower1,amountUSDCborrower1,{from:deployMaster});

        cUsdc = await BUSDC.at(bUSDCAddress);
        comptroller = await Comptroller.at(comptrollerAddress);
        priceOracle = await SimplePriceOracle.at(SimplePriceOracle.address);

    });

    it('Supplier1 supply USDCTest', async()=>{
        pitLogger.info();
        pitLogger.info("*******Supply Test******* ");
        let lendingTokenId = new BN(0);

        let supplier1USDCbalanceBefore = await getERC20balance(USDCaddress,supplier1);
        let supplier1CUSDCbalanceBefore = await getERC20balance(bUSDCAddress,supplier1);
        await printERC20balance(supplier1USDCbalanceBefore);
        await printERC20balance(supplier1CUSDCbalanceBefore);
        
        let amountLendingToken = USDCmultiplier.mul(new BN(19_000_000_000));
        await approveTransferFrom(USDCaddress,bUSDCAddress,supplier1,amountLendingToken);
        let supplyRes = await primaryIndexToken.supply(lendingTokenId,amountLendingToken,{from:supplier1});
        pitLogger.info("Supplied "+amountLendingToken+" USDCTest");

        let supplier1USDCbalanceAfter = await getERC20balance(USDCaddress,supplier1);
        let supplier1CUSDCbalanceAfter = await getERC20balance(bUSDCAddress,supplier1);
        await printERC20balance(supplier1USDCbalanceAfter);
        await printERC20balance(supplier1CUSDCbalanceAfter);

    });

    //borrow test;
    it('Borrower1 deposit PRJ1',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower1 deposit PRJ1 Test******* ");

        let prjId = prj1Id;
        let PRJaddress = PRJ1address

        let borrower1PRJ1balanceBefore = await getERC20balance(PRJaddress,borrower1);
        await printERC20balance(borrower1PRJ1balanceBefore);

        let borrower1PRJ1depositedBefore = await getDepositedPrjAmount(borrower1,prjId);
        await printDepositedPrjAmount(borrower1PRJ1depositedBefore);

        let amountPrj1ToDeposit = borrower1PRJ1balanceBefore.balance;
        await approveTransferFrom(PRJ1address,primaryIndexTokenAddress,borrower1,amountPrj1ToDeposit);
        await primaryIndexToken.deposit(prjId,amountPrj1ToDeposit,{from:borrower1});
        pitLogger.info("Deposited "+  amountPrj1ToDeposit +" PRJ1");

        let borrower1PRJ1balanceAfter = await getERC20balance(PRJaddress,borrower1);
        await printERC20balance(borrower1PRJ1balanceAfter);

        let borrower1PRJ1depositedAfter = await getDepositedPrjAmount(borrower1,prjId);
        await printDepositedPrjAmount(borrower1PRJ1depositedAfter);

    });

    it('Borrower1 deposit PRJ2',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower1 deposit PRJ2 Test******* ");

        let prjId = prj2Id;
        let PRJaddress = PRJ2address;

        let borrower1PRJ2balanceBefore = await getERC20balance(PRJaddress,borrower1);
        await printERC20balance(borrower1PRJ2balanceBefore);

        let borrower1PRJ2depositedBefore = await getDepositedPrjAmount(borrower1,prjId);
        await printDepositedPrjAmount(borrower1PRJ2depositedBefore);

        let amountPrj2ToDeposit = borrower1PRJ2balanceBefore.balance;
        await approveTransferFrom(PRJaddress,primaryIndexTokenAddress,borrower1,amountPrj2ToDeposit);
        await primaryIndexToken.deposit(prjId,amountPrj2ToDeposit,{from:borrower1});
        pitLogger.info("Deposited "+  amountPrj2ToDeposit +" PRJ2");

        let borrower1PRJ2balanceAfter = await getERC20balance(PRJaddress,borrower1);
        await printERC20balance(borrower1PRJ2balanceAfter);

        let borrower1PRJ2depositedAfter = await getDepositedPrjAmount(borrower1,prjId);
        await printDepositedPrjAmount(borrower1PRJ2depositedAfter);

    });

    it('Borrower1 deposit PRJ3',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower1 deposit PRJ3 Test******* ");

        let prjId = prj3Id;
        let PRJaddress = PRJ3address;

        let borrower1PRJ3balanceBefore = await getERC20balance(PRJaddress,borrower1);
        await printERC20balance(borrower1PRJ3balanceBefore);

        let borrower1PRJ3depositedBefore = await getDepositedPrjAmount(borrower1,prjId);
        await printDepositedPrjAmount(borrower1PRJ3depositedBefore);

        let amountPrj3ToDeposit = borrower1PRJ3balanceBefore.balance;
        await approveTransferFrom(PRJaddress,primaryIndexTokenAddress,borrower1,amountPrj3ToDeposit);
        await primaryIndexToken.deposit(prjId,amountPrj3ToDeposit,{from:borrower1});
        pitLogger.info("Deposited "+  amountPrj3ToDeposit +" PRJ4");

        let borrower1PRJ3balanceAfter = await getERC20balance(PRJaddress,borrower1);
        await printERC20balance(borrower1PRJ3balanceAfter);

        let borrower1PRJ3depositedAfter = await getDepositedPrjAmount(borrower1,prjId);
        await printDepositedPrjAmount(borrower1PRJ3depositedAfter);

    });



    it('Borrower1 borrow USDC with collateral PRJ1',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower1 borrow USDC with collateral PRJ1 Test******* ");

        let prjId = prj1Id;
        let PRJaddress = PRJ1address;

        let borrower1USDCbalanceBefore = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceBefore);

        let borrower1PRJdepositedBefore = await getDepositedPrjAmount(borrower1,prjId);
        await printDepositedPrjAmount(borrower1PRJdepositedBefore);

       

        await printUniswapPoolReserves(USDCaddress,PRJaddress);

        let borrower1BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prjId);
        await printBorrowPosition(borrower1BorrowPositionBefore);

        let borrower1PITbalanceBefore = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceBefore);

        let borrower1BPITbalanceBefore = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceBefore);

        let borrower1LiquidityBefore = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityBefore);
        
        let amountLendingTokenToBorrow = borrower1PITbalanceBefore;
        pitLogger.info("Borrowed "+ amountLendingTokenToBorrow+" tokens");
        let borrowRes = await primaryIndexToken.borrow(lendingTokenId,amountLendingTokenToBorrow,PRJaddress,toBN(10),{from:borrower1});
        
        let borrower1USDCbalanceAfter = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceAfter);

        let borrower1BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prjId);
        await printBorrowPosition(borrower1BorrowPositionAfter);

        let borrower1PITbalanceAfter = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceAfter);

        let borrower1BPITbalanceAfter = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceAfter);

        let borrower1LiquidityAfter = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityAfter);

    });

    it('Borrower1 borrow USDC with collateral PRJ2',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower1 borrow USDC with collateral PRJ2 Test******* ");

        let prjId = prj2Id;
        let PRJaddress = PRJ2address;

        let borrower1USDCbalanceBefore = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceBefore);

        let borrower1PRJdepositedBefore = await getDepositedPrjAmount(borrower1,prjId);
        await printDepositedPrjAmount(borrower1PRJdepositedBefore);

        await printUniswapPoolReserves(USDCaddress,PRJaddress);
        
        let borrower1BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prjId);
        await printBorrowPosition(borrower1BorrowPositionBefore);

        let borrower1PITbalanceBefore = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceBefore);

        let borrower1BPITbalanceBefore = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceBefore);

        let borrower1LiquidityBefore = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityBefore);
        
        let amountLendingTokenToBorrow = borrower1PITbalanceBefore;
        pitLogger.info("Borrowed "+ amountLendingTokenToBorrow+" tokens");
        let borrowRes = await primaryIndexToken.borrow(lendingTokenId,amountLendingTokenToBorrow,PRJaddress,toBN(10),{from:borrower1});
        
        let borrower1USDCbalanceAfter = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceAfter);

        let borrower1BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prjId);
        await printBorrowPosition(borrower1BorrowPositionAfter);

        let borrower1PITbalanceAfter = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceAfter);

        let borrower1BPITbalanceAfter = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceAfter);

        let borrower1LiquidityAfter = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityAfter);

    });

    it('Borrower1 borrow USDC with collateral PRJ3',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower1 borrow USDC with collateral PRJ3 Test******* ");

        let prjId = prj3Id;
        let PRJaddress = PRJ3address;

        let borrower1USDCbalanceBefore = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceBefore);

        let borrower1PRJdepositedBefore = await getDepositedPrjAmount(borrower1,prjId);
        await printDepositedPrjAmount(borrower1PRJdepositedBefore);
  
        await printUniswapPoolReserves(USDCaddress,PRJaddress);

        let borrower1BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prjId);
        await printBorrowPosition(borrower1BorrowPositionBefore);

        let borrower1PITbalanceBefore = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceBefore);

        let borrower1BPITbalanceBefore = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceBefore);

        let borrower1LiquidityBefore = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityBefore);
        
        let amountLendingTokenToBorrow = borrower1PITbalanceBefore;
        pitLogger.info("Borrowed "+ amountLendingTokenToBorrow+" tokens");
        let borrowRes = await primaryIndexToken.borrow(lendingTokenId,amountLendingTokenToBorrow,PRJaddress,toBN(10),{from:borrower1});
      
        let borrower1USDCbalanceAfter = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceAfter);

        let borrower1BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prjId);
        await printBorrowPosition(borrower1BorrowPositionAfter);

        let borrower1PITbalanceAfter = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceAfter);

        let borrower1BPITbalanceAfter = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceAfter);

        let borrower1LiquidityAfter = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityAfter);

    });
    
     it('Borrower1 repay half USDCTest borrow for PRJ1 position',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower1 repay half USDCTest borrow for PRJ1 position Test******* ");

        let prjId = prj1Id;
        let PRJaddress = PRJ1address;

        let borrower1USDCbalanceBefore = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceBefore);

        let borrower1PRJ1BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj1Id);
        await printBorrowPosition(borrower1PRJ1BorrowPositionBefore);

        let borrower1PRJ2BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj2Id);
        await printBorrowPosition(borrower1PRJ2BorrowPositionBefore);

        let borrower1PRJ3BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj3Id);
        await printBorrowPosition(borrower1PRJ3BorrowPositionBefore);


        let borrower1PITbalanceBefore = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceBefore);

        let borrower1BPITbalanceBefore = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceBefore);

        let borrower1LiquidityBefore = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityBefore);
        
        let amountLendingTokenToRepay = borrower1PRJ1BorrowPositionBefore['0'].div(toBN(2));
        pitLogger.info("Amount lending token to repay: "+amountLendingTokenToRepay);
        await approveTransferFrom(USDCaddress,bUSDCAddress,borrower1,amountLendingTokenToRepay);
        let repayRes = await primaryIndexToken.repayBorrow(lendingTokenId,amountLendingTokenToRepay,PRJaddress,toBN(10),{from:borrower1});
        for(var log of repayRes['logs']){
            if(log['event']=="Test5"){
                console.log("amountLendingToken:         "+log['args']['amountLendingToken']);
                console.log("currentBorrowBalance:       "+log['args']['currentBorrowBalance']);
                console.log("cumulativeBorrowBalance:    "+log['args']['cumulativeBorrowBalance']);
                console.log("repayed:                    "+log['args']['repayed']);
                console.log("borrowedPositions:          "+log['args']['borrowedPositions']);
                console.log("estimateInterest:           "+log['args']['estimateInterest']);
                console.log("");
            }
        }
        pitLogger.info("Repayed "+ amountLendingTokenToRepay+" tokens");

        let borrower1USDCbalanceAfter = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceAfter);

        let borrower1PRJ1BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj1Id);
        await printBorrowPosition(borrower1PRJ1BorrowPositionAfter);

        let borrower1PRJ2BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj2Id);
        await printBorrowPosition(borrower1PRJ2BorrowPositionAfter);

        let borrower1PRJ3BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj3Id);
        await printBorrowPosition(borrower1PRJ3BorrowPositionAfter);

        let borrower1PITbalanceAfter = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceAfter);

        let borrower1BPITbalanceAfter = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceAfter);

        let borrower1LiquidityAfter = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityAfter);
    });

    it('Borrower1 repay all USDCTest borrow for PRJ1 position',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower1 repay all USDCTest borrow for PRJ1 position Test******* ");

        let prjId = prj1Id;
        let PRJaddress = PRJ1address;

        let borrower1USDCbalanceBefore = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceBefore);

        let borrower1PRJ1BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj1Id);
        await printBorrowPosition(borrower1PRJ1BorrowPositionBefore);

        let borrower1PRJ2BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj2Id);
        await printBorrowPosition(borrower1PRJ2BorrowPositionBefore);

        let borrower1PRJ3BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj3Id);
        await printBorrowPosition(borrower1PRJ3BorrowPositionBefore);


        let borrower1PITbalanceBefore = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceBefore);

        let borrower1BPITbalanceBefore = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceBefore);

        let borrower1LiquidityBefore = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityBefore);
        
        let amountLendingTokenToRepay = toBN(2).pow(toBN(256)).sub(toBN(1));//borrower1PRJ1BorrowPositionBefore['0'].div(toBN(2));
        pitLogger.info("Amount lending token to repay: "+amountLendingTokenToRepay);
        await approveTransferFrom(USDCaddress,bUSDCAddress,borrower1,amountLendingTokenToRepay);
        let repayRes = await primaryIndexToken.repayBorrow(lendingTokenId,amountLendingTokenToRepay,PRJaddress,toBN(10),{from:borrower1});
        for(var log of repayRes['logs']){
            if(log['event']=="Test5"){
                console.log("amountLendingToken:         "+log['args']['amountLendingToken']);
                console.log("currentBorrowBalance:       "+log['args']['currentBorrowBalance']);
                console.log("cumulativeBorrowBalance:    "+log['args']['cumulativeBorrowBalance']);
                console.log("repayed:                    "+log['args']['repayed']);
                console.log("borrowedPositions:          "+log['args']['borrowedPositions']);
                console.log("estimateInterest:           "+log['args']['estimateInterest']);
                console.log("");
            }
        }
        pitLogger.info("Repayed "+ amountLendingTokenToRepay+" tokens");

        let borrower1USDCbalanceAfter = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceAfter);

        let borrower1PRJ1BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj1Id);
        await printBorrowPosition(borrower1PRJ1BorrowPositionAfter);

        let borrower1PRJ2BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj2Id);
        await printBorrowPosition(borrower1PRJ2BorrowPositionAfter);

        let borrower1PRJ3BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj3Id);
        await printBorrowPosition(borrower1PRJ3BorrowPositionAfter);

        let borrower1PITbalanceAfter = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceAfter);

        let borrower1BPITbalanceAfter = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceAfter);

        let borrower1LiquidityAfter = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityAfter);
    });

    it('Borrower1 repay 2/3 USDCTest borrow for PRJ2 position',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower1 repay 2/3 USDCTest borrow for PRJ2 position Test******* ");

        let prjId = prj2Id;
        let PRJaddress = PRJ2address;

        let borrower1USDCbalanceBefore = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceBefore);

        let borrower1PRJ1BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj1Id);
        await printBorrowPosition(borrower1PRJ1BorrowPositionBefore);

        let borrower1PRJ2BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj2Id);
        await printBorrowPosition(borrower1PRJ2BorrowPositionBefore);

        let borrower1PRJ3BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj3Id);
        await printBorrowPosition(borrower1PRJ3BorrowPositionBefore);


        let borrower1PITbalanceBefore = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceBefore);

        let borrower1BPITbalanceBefore = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceBefore);

        let borrower1LiquidityBefore = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityBefore);
        
        let amountLendingTokenToRepay = borrower1PRJ2BorrowPositionBefore['0'].mul(toBN(2)).div(toBN(3));
        pitLogger.info("Amount lending token to repay: "+amountLendingTokenToRepay);
        await approveTransferFrom(USDCaddress,bUSDCAddress,borrower1,amountLendingTokenToRepay);
        let repayRes = await primaryIndexToken.repayBorrow(lendingTokenId,amountLendingTokenToRepay,PRJaddress,toBN(10),{from:borrower1});
        for(var log of repayRes['logs']){
            if(log['event']=="Test5"){
                console.log("amountLendingToken:         "+log['args']['amountLendingToken']);
                console.log("currentBorrowBalance:       "+log['args']['currentBorrowBalance']);
                console.log("cumulativeBorrowBalance:    "+log['args']['cumulativeBorrowBalance']);
                console.log("repayed:                    "+log['args']['repayed']);
                console.log("borrowedPositions:          "+log['args']['borrowedPositions']);
                console.log("estimateInterest:           "+log['args']['estimateInterest']);
                console.log("");
            }
        }
        pitLogger.info("Repayed "+ amountLendingTokenToRepay+" tokens");

        let borrower1USDCbalanceAfter = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceAfter);

        let borrower1PRJ1BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj1Id);
        await printBorrowPosition(borrower1PRJ1BorrowPositionAfter);

        let borrower1PRJ2BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj2Id);
        await printBorrowPosition(borrower1PRJ2BorrowPositionAfter);

        let borrower1PRJ3BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj3Id);
        await printBorrowPosition(borrower1PRJ3BorrowPositionAfter);

        let borrower1PITbalanceAfter = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceAfter);

        let borrower1BPITbalanceAfter = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceAfter);

        let borrower1LiquidityAfter = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityAfter);
    });

    it('Borrower1 repay all USDCTest borrow for PRJ2 position',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower1 repay all USDCTest borrow for PRJ2 position Test******* ");

        let prjId = prj2Id;
        let PRJaddress = PRJ2address;

        let borrower1USDCbalanceBefore = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceBefore);

        let borrower1PRJ1BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj1Id);
        await printBorrowPosition(borrower1PRJ1BorrowPositionBefore);

        let borrower1PRJ2BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj2Id);
        await printBorrowPosition(borrower1PRJ2BorrowPositionBefore);

        let borrower1PRJ3BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj3Id);
        await printBorrowPosition(borrower1PRJ3BorrowPositionBefore);


        let borrower1PITbalanceBefore = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceBefore);

        let borrower1BPITbalanceBefore = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceBefore);

        let borrower1LiquidityBefore = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityBefore);
        
        let amountLendingTokenToRepay = toBN(2).pow(toBN(256)).sub(toBN(1));//borrower1PRJ2BorrowPositionBefore['0'].div(toBN(2));
        pitLogger.info("Amount lending token to repay: "+amountLendingTokenToRepay);
        await approveTransferFrom(USDCaddress,bUSDCAddress,borrower1,amountLendingTokenToRepay);
        let repayRes = await primaryIndexToken.repayBorrow(lendingTokenId,amountLendingTokenToRepay,PRJaddress,toBN(10),{from:borrower1});
        for(var log of repayRes['logs']){
            if(log['event']=="Test5"){
                console.log("amountLendingToken:         "+log['args']['amountLendingToken']);
                console.log("currentBorrowBalance:       "+log['args']['currentBorrowBalance']);
                console.log("cumulativeBorrowBalance:    "+log['args']['cumulativeBorrowBalance']);
                console.log("repayed:                    "+log['args']['repayed']);
                console.log("borrowedPositions:          "+log['args']['borrowedPositions']);
                console.log("estimateInterest:           "+log['args']['estimateInterest']);
                console.log("");
            }
        }
        pitLogger.info("Repayed "+ amountLendingTokenToRepay+" tokens");

        let borrower1USDCbalanceAfter = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceAfter);

        let borrower1PRJ1BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj1Id);
        await printBorrowPosition(borrower1PRJ1BorrowPositionAfter);

        let borrower1PRJ2BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj2Id);
        await printBorrowPosition(borrower1PRJ2BorrowPositionAfter);

        let borrower1PRJ3BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj3Id);
        await printBorrowPosition(borrower1PRJ3BorrowPositionAfter);

        let borrower1PITbalanceAfter = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceAfter);

        let borrower1BPITbalanceAfter = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceAfter);

        let borrower1LiquidityAfter = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityAfter);
    });

    it('Borrower1 repay 1/4 USDCTest borrow for PRJ3 position',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower1 repay 1/4 USDCTest borrow for PRJ3 position Test******* ");

        let prjId = prj3Id;
        let PRJaddress = PRJ3address;

        let borrower1USDCbalanceBefore = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceBefore);

        let borrower1PRJ1BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj1Id);
        await printBorrowPosition(borrower1PRJ1BorrowPositionBefore);

        let borrower1PRJ2BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj2Id);
        await printBorrowPosition(borrower1PRJ2BorrowPositionBefore);

        let borrower1PRJ3BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj3Id);
        await printBorrowPosition(borrower1PRJ3BorrowPositionBefore);


        let borrower1PITbalanceBefore = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceBefore);

        let borrower1BPITbalanceBefore = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceBefore);

        let borrower1LiquidityBefore = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityBefore);
        
        let amountLendingTokenToRepay = borrower1PRJ3BorrowPositionBefore['0'].div(toBN(4));
        pitLogger.info("Amount lending token to repay: "+amountLendingTokenToRepay);
        await approveTransferFrom(USDCaddress,bUSDCAddress,borrower1,amountLendingTokenToRepay);
        let repayRes = await primaryIndexToken.repayBorrow(lendingTokenId,amountLendingTokenToRepay,PRJaddress,toBN(10),{from:borrower1});
        for(var log of repayRes['logs']){
            if(log['event']=="Test5"){
                console.log("amountLendingToken:         "+log['args']['amountLendingToken']);
                console.log("currentBorrowBalance:       "+log['args']['currentBorrowBalance']);
                console.log("cumulativeBorrowBalance:    "+log['args']['cumulativeBorrowBalance']);
                console.log("repayed:                    "+log['args']['repayed']);
                console.log("borrowedPositions:          "+log['args']['borrowedPositions']);
                console.log("estimateInterest:           "+log['args']['estimateInterest']);
                console.log("");
            }
        }
        pitLogger.info("Repayed "+ amountLendingTokenToRepay+" tokens");

        let borrower1USDCbalanceAfter = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceAfter);

        let borrower1PRJ1BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj1Id);
        await printBorrowPosition(borrower1PRJ1BorrowPositionAfter);

        let borrower1PRJ2BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj2Id);
        await printBorrowPosition(borrower1PRJ2BorrowPositionAfter);

        let borrower1PRJ3BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj3Id);
        await printBorrowPosition(borrower1PRJ3BorrowPositionAfter);

        let borrower1PITbalanceAfter = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceAfter);

        let borrower1BPITbalanceAfter = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceAfter);

        let borrower1LiquidityAfter = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityAfter);
    });

    it('Borrower1 repay all USDCTest borrow for PRJ3 position',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrower1 repay all USDCTest borrow for PRJ3 position Test******* ");

        let prjId = prj3Id;
        let PRJaddress = PRJ3address;

        let borrower1USDCbalanceBefore = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceBefore);

        let borrower1PRJ1BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj1Id);
        await printBorrowPosition(borrower1PRJ1BorrowPositionBefore);

        let borrower1PRJ2BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj2Id);
        await printBorrowPosition(borrower1PRJ2BorrowPositionBefore);

        let borrower1PRJ3BorrowPositionBefore = await getBorrowPosition(borrower1,lendingTokenId,prj3Id);
        await printBorrowPosition(borrower1PRJ3BorrowPositionBefore);


        let borrower1PITbalanceBefore = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceBefore);

        let borrower1BPITbalanceBefore = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceBefore);

        let borrower1LiquidityBefore = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityBefore);
        
        let amountLendingTokenToRepay = toBN(2).pow(toBN(256)).sub(toBN(1));//borrower1PRJ3BorrowPositionBefore['0'].div(toBN(4));
        pitLogger.info("Amount lending token to repay: "+amountLendingTokenToRepay);
        await approveTransferFrom(USDCaddress,bUSDCAddress,borrower1,amountLendingTokenToRepay);
        let repayRes = await primaryIndexToken.repayBorrow(lendingTokenId,amountLendingTokenToRepay,PRJaddress,toBN(10),{from:borrower1});
        for(var log of repayRes['logs']){
            if(log['event']=="Test5"){
                console.log("amountLendingToken:         "+log['args']['amountLendingToken']);
                console.log("currentBorrowBalance:       "+log['args']['currentBorrowBalance']);
                console.log("cumulativeBorrowBalance:    "+log['args']['cumulativeBorrowBalance']);
                console.log("repayed:                    "+log['args']['repayed']);
                console.log("borrowedPositions:          "+log['args']['borrowedPositions']);
                console.log("estimateInterest:           "+log['args']['estimateInterest']);
                console.log("");
            }
        }
        pitLogger.info("Repayed "+ amountLendingTokenToRepay+" tokens");

        let borrower1USDCbalanceAfter = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCbalanceAfter);

        let borrower1PRJ1BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj1Id);
        await printBorrowPosition(borrower1PRJ1BorrowPositionAfter);

        let borrower1PRJ2BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj2Id);
        await printBorrowPosition(borrower1PRJ2BorrowPositionAfter);

        let borrower1PRJ3BorrowPositionAfter = await getBorrowPosition(borrower1,lendingTokenId,prj3Id);
        await printBorrowPosition(borrower1PRJ3BorrowPositionAfter);

        let borrower1PITbalanceAfter = await getBalanceOfPitPosition(borrower1,prjId);
        await printBalanceOfPitForPosition(borrower1PITbalanceAfter);

        let borrower1BPITbalanceAfter = await getERC20balance(bPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1BPITbalanceAfter);

        let borrower1LiquidityAfter = await getLiquidity(borrower1);
        await printLiquidity(borrower1LiquidityAfter);
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
       
    async function getBorrowPosition(account, lendingTokenId,prjId){
        let position = await primaryIndexToken.getBorrowPosition(account,lendingTokenId,prjId,{from:account});
        return position;
    }

    async function printBorrowPosition(data){
        pitLogger.info("Borrow position:");
        pitLogger.info("    amountBorrowed: "+data['0'])
        pitLogger.info("    amountPit: "+data['1'])
    }

    async function getLiquidity(account){
        let liquidity = await comptroller.getAccountLiquidity(account,{from:account});
        return liquidity;
    }

    async function printLiquidity(data){
        pitLogger.info("Account Liquidity: "+data['1']);
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

    async function getBalanceOfPitPosition(account,prjId){
        let PITbalanceForPosition = await primaryIndexToken.balanceOfPitPosition(account,prjId);
        return PITbalanceForPosition;
    }
    async function printBalanceOfPitForPosition(data){
        pitLogger.info("Account PIT balance for position: "+data);
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

    async function decreasePriceOfPrj(USDCaddress,PRJ1address,PRJamount,sender){
        await approveTransferFrom(PRJ1address,uniswapRouterAddress,sender,PRJamount);
        await uniswapRouter.swapExactTokensForTokens(
            PRJamount,
            new BN(0),
            [PRJ1address,USDCaddress],
            sender,
            new BN(new Date().getTime() + (60 * 60 * 1000)),
            {from:sender}
        );
        pitLogger.info("Decreased price of PRJ. PRJ amount given: "+PRJamount);
    }

    async function increasePriceOfPrj(USDCaddress,PRJ1address,USDCamount,sender){
        await approveTransferFrom(USDCaddress,uniswapRouterAddress,sender,USDCamount);
        await uniswapRouter.swapExactTokensForTokens(
            USDCamount,
            new BN(0),
            [USDCaddress,PRJ1address],
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

    function toBN(number) {
        return web3.utils.toBN(number);
    }
});