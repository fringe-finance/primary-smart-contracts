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
const { time, expectRevert } = require('@openzeppelin/test-helpers');
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
    let bPrimaryIndexTokenAddress = JSON.parse(fs.readFileSync('migrations/bPrimaryIndexTokenProxyAddress.json', 'utf8')).bPrimaryIndexTokenProxyAddress;
    let bUSDCAddress = JSON.parse(fs.readFileSync('migrations/bUsdcProxyAddress.json', 'utf8')).bUsdcProxyAddress;

    let deployMaster = accounts[0];
    let moderator = accounts[1];
    let supplier1 = accounts[2];
    let borrower1 = accounts[3];
    let borrower2 = accounts[4];
    let liquidator1 = accounts[5];

    let lendingTokenId = new BN(0);
    let prjId = new BN(0);
    let prj1Id = new BN(0);
    let PRJ1address = PRJsAddresses[0];
    
    console.log("DEPLOY MASTER: "+deployMaster);
    console.log("SUPPLIER1: "+supplier1);
    console.log("BORROWER1: "+borrower1);

    let uniswapRouter;
    let uniswapFactory;
    let primaryIndexToken;
    let cPrimaryIndexToken;
    let bUsdc;
    let comptroller;
    let priceOracle;

    let ten = new BN(10);
    let PRJmultiplier;
    let USDCmultiplier;

    before(async () => {
        primaryIndexToken = await PrimaryIndexToken.at(primaryIndexTokenAddress);
        cPrimaryIndexToken = await BPrimaryIndexToken.at(bPrimaryIndexTokenAddress);

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

        bUsdc = await BUSDC.at(bUSDCAddress);
        comptroller = await Comptroller.at(comptrollerAddress);
        priceOracle = await SimplePriceOracle.at(SimplePriceOracle.address);

    });

    //deposit tests
    
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
    

    it('Supplier1 supply USDCTest', async()=>{
        pitLogger.info();
        pitLogger.info("*******Supply Test******* ");
        let lendingTokenId = new BN(0);

        let supplier1USDCbalanceBefore = await getERC20balance(USDCaddress,supplier1);
        let supplier1BUSDCbalanceBefore = await getERC20balance(bUSDCAddress,supplier1);
        await printERC20balance(supplier1USDCbalanceBefore);
        await printERC20balance(supplier1BUSDCbalanceBefore);
        
        let amountLendingToken = USDCmultiplier.mul(new BN(1_000_000));
        await approveTransferFrom(USDCaddress,bUSDCAddress,supplier1,amountLendingToken);
        let supplyRes = await primaryIndexToken.supply(lendingTokenId,amountLendingToken,{from:supplier1});
        {
                // for(var log of supplyRes['logs']){
                //     if(log['event']=="Test1"){
                //         console.log("mint:  "+log['args']['mintedAmount']);
                        
                //     }
                // }
        }
        let supplier1USDCbalanceAfter = await getERC20balance(USDCaddress,supplier1);
        let supplier1BUSDCbalanceAfter = await getERC20balance(bUSDCAddress,supplier1);
        await printERC20balance(supplier1USDCbalanceAfter);
        await printERC20balance(supplier1BUSDCbalanceAfter);

    });

    //redeem tests
    
    it('Supplier1 redeem USDCTest',async()=>{
        pitLogger.info();
        pitLogger.info("*******Redeem Test******* ");
        let lendingTokenId = new BN(0);

        let supplier1USDCbalanceBefore = await getERC20balance(USDCaddress,supplier1);
        let supplier1BUSDCbalanceBefore = await getERC20balance(bUSDCAddress,supplier1);
        await printERC20balance(supplier1USDCbalanceBefore);
        await printERC20balance(supplier1BUSDCbalanceBefore);
        let supplier1USDCsuppliedLendingTokenBefore = await primaryIndexToken.suppliedLendingToken(supplier1,lendingTokenId,{from:supplier1});
        pitLogger.info("Supplied lending token before: "+supplier1USDCsuppliedLendingTokenBefore);

        let amountBUSDCtoRedeem = supplier1BUSDCbalanceBefore.balance.div(new BN(4));
        let redeemResult = await primaryIndexToken.redeem(lendingTokenId,amountBUSDCtoRedeem,{from:supplier1});
        {
            for(var log of redeemResult['logs']){
                if(log['event']=="Test1"){
                    console.log("mint:  "+log['args']['mintedAmount']);
                }
            }
        }
        let supplier1UsdctestAmountAfter = await getERC20balance(USDCaddress,supplier1);
        let supplier1BUSDCbalanceAfter = await getERC20balance(bUSDCAddress,supplier1);
        await printERC20balance(supplier1UsdctestAmountAfter);
        await printERC20balance(supplier1BUSDCbalanceAfter);

        let supplier1USDCsuppliedLendingTokenAfter = await primaryIndexToken.suppliedLendingToken(supplier1,lendingTokenId,{from:supplier1});
        pitLogger.info("Supplied lending token after : "+supplier1USDCsuppliedLendingTokenAfter)
    });

    it('Supplier1 redeemUnderlying USDCTest',async()=>{
        pitLogger.info();
        pitLogger.info("*******RedeemUnderlying Test******* ");
        let lendingTokenId = new BN(0);

        let supplier1USDCbalanceBefore = await getERC20balance(USDCaddress,supplier1);
        let supplier1BUSDCbalanceBefore = await getERC20balance(bUSDCAddress,supplier1);
        await printERC20balance(supplier1USDCbalanceBefore);
        await printERC20balance(supplier1BUSDCbalanceBefore);
        
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
        let supplier1BUSDCbalanceAfter = await getERC20balance(bUSDCAddress,supplier1);
        await printERC20balance(supplier1UsdctestAmountAfter);
        await printERC20balance(supplier1BUSDCbalanceAfter);
    });
    
    it('Supplier redeem all USDCTest',async()=>{
        pitLogger.info();
        pitLogger.info("*******Redeem Test******* ");
        let lendingTokenId = new BN(0);

        let supplier1USDCbalanceBefore = await getERC20balance(USDCaddress,supplier1);
        let supplier1BUSDCbalanceBefore = await getERC20balance(bUSDCAddress,supplier1);
        await printERC20balance(supplier1USDCbalanceBefore);
        await printERC20balance(supplier1BUSDCbalanceBefore);
        let supplier1USDCsuppliedLendingTokenBefore = await primaryIndexToken.suppliedLendingToken(supplier1,lendingTokenId,{from:supplier1});
        pitLogger.info("Supplied lending token before: "+supplier1USDCsuppliedLendingTokenBefore);

        let amountBUSDCtoRedeem = supplier1BUSDCbalanceBefore.balance;
        let redeemResult = await primaryIndexToken.redeem(lendingTokenId,amountBUSDCtoRedeem,{from:supplier1});
        {
            for(var log of redeemResult['logs']){
                if(log['event']=="Test1"){
                    console.log("mint:  "+log['args']['mintedAmount']);
                }
            }
        }
        let supplier1UsdctestAmountAfter = await getERC20balance(USDCaddress,supplier1);
        let supplier1BUSDCbalanceAfter = await getERC20balance(bUSDCAddress,supplier1);
        await printERC20balance(supplier1UsdctestAmountAfter);
        await printERC20balance(supplier1BUSDCbalanceAfter);

        let supplier1USDCsuppliedLendingTokenAfter = await primaryIndexToken.suppliedLendingToken(supplier1,lendingTokenId,{from:supplier1});
        pitLogger.info("Supplied lending token after : "+supplier1USDCsuppliedLendingTokenAfter);
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

    function toBN(number) {
        return web3.utils.toBN(number);
    }
});