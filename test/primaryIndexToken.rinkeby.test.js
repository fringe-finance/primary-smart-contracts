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
        let supplier1PRJamount = PRJmultiplier.mul(new BN(10_000_000_000_000));
        await prj.mintTo(supplier1,supplier1PRJamount,{from:deployMaster});
        let borrower1PRJamount = PRJmultiplier.mul(new BN(10_000_000_000_000));
        await prj.mintTo(borrower1, borrower1PRJamount);

        let usdctest = await IUSDCTest.at(USDCaddress);
        let USDCdecimals = await usdctest.decimals({from:deployMaster});
        USDCmultiplier = ten.pow(USDCdecimals);
        let amountUSDCTestSupplier1 = USDCmultiplier.mul(new BN(100_000_000_000));
        await usdctest.mintTo(supplier1,amountUSDCTestSupplier1,{from:deployMaster});
        let amountUSDCTestBorrower1 = USDCmultiplier.mul(new BN(100_000));
        await usdctest.mintTo(borrower1,amountUSDCTestBorrower1,{from:deployMaster});

        cUsdc = await CUSDC.at(cUSDCAddress);
        comptroller = await Comptroller.at(comptrollerAddress);
        priceOracle = await SimplePriceOracle.at(SimplePriceOracle.address);

    });

  

    it('Supplier1 supply USDCTest', async()=>{
        pitLogger.info();
        pitLogger.info("*******Supply Test******* ");
        let lendingTokenId = new BN(0);

        let supplier1UsdctestAmountBefore = await getERC20balance(USDCaddress,supplier1);
        let supplier1CUSDCBalanceBefore = await getERC20balance(cUSDCAddress,supplier1);
        await printERC20balance(supplier1UsdctestAmountBefore);
        await printERC20balance(supplier1CUSDCBalanceBefore);
        
        let amountLendingToken = USDCmultiplier.mul(new BN(1_000_000));
        await approveTransferFrom(USDCaddress,cUSDCAddress,supplier1,amountLendingToken);
        let supplyRes = await primaryIndexToken.supply(lendingTokenId,amountLendingToken,{from:supplier1});

        for(var log of supplyRes['logs']){
            if(log['event']=="Test1"){
                console.log("mint:  "+log['args']['mintedAmount']);
                
            }
        }

        let supplier1UsdctestAmountAfter = await getERC20balance(USDCaddress,supplier1);
        let supplier1CUSDCBalanceAfter = await getERC20balance(cUSDCAddress,supplier1);
        await printERC20balance(supplier1UsdctestAmountAfter);
        await printERC20balance(supplier1CUSDCBalanceAfter);

    });

    // it('Supplier1 redeem USDCTest',async()=>{
    //     pitLogger.info();
    //     pitLogger.info("*******Redeem Test******* ");
    //     let lendingTokenId = new BN(0);

    //     let supplier1UsdctestAmountBefore = await getERC20balance(USDCaddress,supplier1);
    //     let supplier1CUSDCBalanceBefore = await getERC20balance(cUSDCAddress,supplier1);
    //     await printERC20balance(supplier1UsdctestAmountBefore);
    //     await printERC20balance(supplier1CUSDCBalanceBefore);
        
    //     let amountLendingToken = USDCmultiplier.mul(new BN(1_000));
    //     await approveTransferFrom(USDCaddress,cUSDCAddress,supplier1,amountLendingToken);
    //     let supplyRes = await primaryIndexToken.redeem(lendingTokenId,supplier1CUSDCBalanceBefore.balance,{from:supplier1});

    //     for(var log of supplyRes['logs']){
    //         if(log['event']=="Test1"){
    //             console.log("mint:  "+log['args']['mintedAmount']);
    //         }
    //     }

    //     let supplier1UsdctestAmountAfter = await getERC20balance(USDCaddress,supplier1);
    //     let supplier1CUSDCBalanceAfter = await getERC20balance(cUSDCAddress,supplier1);
    //     await printERC20balance(supplier1UsdctestAmountAfter);
    //     await printERC20balance(supplier1CUSDCBalanceAfter);
    // });


    it('Borrower supply PRJ and borrow USDCTest',async()=>{
        pitLogger.info();
        pitLogger.info("*******Borrow Test******* ");

        let borrowerUSDCBalanceBefore = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrowerUSDCBalanceBefore)

        let pitBalanceBefore = await getAccountPitBalance(borrower1);
        await printAccountPitBalance(pitBalanceBefore);

        let prjBorrowerBalanceBefore = await getERC20balance(PRJaddress,borrower1);
        await printERC20balance(prjBorrowerBalanceBefore);

        let prjId = new BN(0);
        let amountPrjToDeposit = PRJmultiplier.mul(new BN(2_000_000));
        await approveTransferFrom(PRJaddress,primaryIndexTokenAddress,borrower1,amountPrjToDeposit);
        await primaryIndexToken.deposit(prjId,amountPrjToDeposit,{from:borrower1});
        pitLogger.info("Deposited "+  amountPrjToDeposit +" PRJ");

        let pitBalanceAfter = await getAccountPitBalance(borrower1);
        await printAccountPitBalance(pitBalanceAfter);

        let prjBorrowerBalanceAfter = await getERC20balance(PRJaddress,borrower1);
        await printERC20balance(prjBorrowerBalanceAfter);

        let borrower1USDCBalanceBefore = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCBalanceBefore);
        let borrower1CPitBalanceBefore = await getERC20balance(cPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1CPitBalanceBefore);

        // let ctokenmarketinfo = await comptroller.markets(cPrimaryIndexTokenAddress,{from:borrower1});
        // console.log("market info:");
        // console.log(ctokenmarketinfo);

        let assetsInBefore = await comptroller.getAssetsIn(borrower1,{from:borrower1});
        console.log("assets in before:");
        console.log(assetsInBefore);
        
        let borrower1LiquidityBefore = await comptroller.getAccountLiquidity(borrower1,{from:borrower1});
        console.log("borrower1 liquidity before "+borrower1LiquidityBefore['1']);
        
        let borrower1BorrowBalanceBefore = await cUsdc.borrowBalanceStored(borrower1,{from:borrower1});
        console.log("borrow stored before :"+borrower1BorrowBalanceBefore);
        
        let borrower1SnapshotBefore = await cPrimaryIndexToken.getAccountSnapshot(borrower1,{from:borrower1});
        console.log("borrower snapshot before");
        //console.log(borrower1SnapshotBefore);
        console.log("pit balance on contract: "+borrower1SnapshotBefore['1']);


        let lendingTokenId = new BN(0);
        let amountLendingTokenToBorrow = USDCmultiplier.mul(new BN(200_000));
        pitLogger.info("Borrowed "+ amountLendingTokenToBorrow);
        let borrowRes = await primaryIndexToken.borrow(lendingTokenId,amountLendingTokenToBorrow,{from:borrower1});
        //console.log(borrowRes['logs']);

        for(var log of borrowRes['logs']){
            if(log['event']=="Test2"){
                console.log("currentBalancePit:  "+log['args']['currentBalancePitOfMsgSender']);
                console.log("liquidity:          "+log['args']['liquidity']);
                console.log("enterMarketError:   "+log['args']['enterMarketError']);
                console.log("borrowError:        "+log['args']['borrowError']);
                console.log("amtPitEvaluation:   "+log['args']['amountPitEvaluation']); 
            }
        }
       
        let borrower1USDCBalanceAfter = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrower1USDCBalanceAfter);
        let borrower1CPitBalanceAfter = await getERC20balance(cPrimaryIndexTokenAddress,borrower1);
        await printERC20balance(borrower1CPitBalanceAfter);

        let assetsInAfter = await comptroller.getAssetsIn(borrower1,{from:borrower1});
        console.log("assets in after:");
        console.log(assetsInAfter);

        let borrower1SnapshotAfter = await cPrimaryIndexToken.getAccountSnapshot(borrower1,{from:borrower1});
        console.log("borrower snapshot after");
        //console.log(borrower1SnapshotAfter);
        console.log("pit balance on contract: "+borrower1SnapshotAfter['1']);

        let borrower1LiquidityAfter = await comptroller.getAccountLiquidity(borrower1,{from:borrower1});
        console.log("borrower1 liquidity after "+borrower1LiquidityAfter['1']);

        let borrower1BorrowBalanceAfter = await cUsdc.borrowBalanceStored(borrower1,{from:borrower1});
        console.log("borrow stored after :"+borrower1BorrowBalanceAfter);
        
    });
    
    it('Borrower repay USDC',async()=>{
        pitLogger.info();
        pitLogger.info("*******Repay Test******* ");

        let borrowerUSDCBalanceBefore = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrowerUSDCBalanceBefore)

        let lendingTokenId = new BN(0);
        let amountLendingTokenToRepay = USDCmultiplier.mul(new BN(10_000));

        await approveTransferFrom(USDCaddress,cUSDCAddress,borrower1,amountLendingTokenToRepay);
        let repayBorrowRes = await primaryIndexToken.repayBorrow(lendingTokenId,amountLendingTokenToRepay,{from:borrower1});

        let borrowerUSDCBalanceAfter = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrowerUSDCBalanceAfter);

       
    });

    it('Borrower repay all USDC borrow',async()=>{
        pitLogger.info();
        pitLogger.info("*******Repay Test******* ");

        let borrowerUSDCBalanceBefore = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrowerUSDCBalanceBefore)
       

        let lendingTokenId = new BN(0);
        let amountLendingTokenToRepay = (new BN(2)).pow(new BN(256)).sub(new BN(1));//new BN("115792089237316195423570985008687907853269984665640564039457584007913129639935");//USDCmultiplier.mul(new BN(10_000));

        await approveTransferFrom(USDCaddress,cUSDCAddress,borrower1,amountLendingTokenToRepay);
        let repayBorrowRes = await primaryIndexToken.repayBorrow(lendingTokenId,amountLendingTokenToRepay,{from:borrower1});

        let borrowerUSDCBalanceAfter = await getERC20balance(USDCaddress,borrower1);
        await printERC20balance(borrowerUSDCBalanceAfter);

        
    });


    it('blank test',async()=>{
        console.log("blank test");
    });



        async function getAccountLendingTokenSupply(account,lendingTokenId){
            let lendingTokenSuppliedAmount = await primaryIndexToken.getLendingTokenSuppliedAmount(account,lendingTokenId);
            return lendingTokenSuppliedAmount;
        }

        async function printAccountLendingTokenSupply(data){
            pitLogger.info("Account token supply: "+data);
        }

        async function getAccountCLendingTokenSupply(account,lendingTokenId){
            let lendingCTokenSuppliedAmount = await primaryIndexToken.getCLendingTokenSuppliedAmount(account, lendingTokenId);
            return lendingCTokenSuppliedAmount
        }

        async function printAccountCLendingTokenSupply(data){
            pitLogger.info("Account cToken supply: "+data);
        }    
        
        async function getAccountPrjDeposit(account, prjId){
            let position = await primaryIndexToken.getDepositedPrjAmount(account,prjId,{from:account});
            return position;
        }

        async function printAccountPrjDeposit(data){
            pitLogger.info("Account position: "+data);
        }

        async function getAccountPitBalance(account){
            let PITbalance = await primaryIndexToken.balanceOfPit(account);
            return PITbalance;
        }

        async function printAccountPitBalance(data){
            pitLogger.info("primaryIndexToken balance: "+data);
        }

        async function getPitTotalSupply(){
            let pitTotalSupply = await primaryIndexToken.totalSupplyPit();
            return pitTotalSupply;
        }

        async function printPitTotalSupply(data){
            pitLogger.info("Pit Total Supply: "+data);
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
            // pitLogger.info("Given allownance from: "+ownerAccount); 
            // pitLogger.info("                   to: "+spenderAccount);
            // pitLogger.info("                token: "+tokenAddress);
            // pitLogger.info("               amount: "+amount.toString());
        }

   
});