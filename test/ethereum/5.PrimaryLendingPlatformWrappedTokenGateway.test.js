require("dotenv").config();
const chain = process.env.CHAIN ? "_" + process.env.CHAIN : "";
const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const path = require("path");
const configTestingFile = path.join(__dirname, `../../scripts/config/${network}${chain}/config_testing.json`);
const configTesting = require(configTestingFile);
const { deployment } = require("../../scripts/deployPLP_V2/deploymentPLP");
const { ethers } = require("ethers");
const { expect } = require("chai");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const ParaSwapAdapter_ARTIFACT = require("./artifacts/NewUniswapV2Router.json");
const UniSwapV2Pair_ARTIFACT = require("./artifacts/UniswapV2Pair.json");
const UniswapV2FACTORY_ARTIFACT = require("./artifacts/UniswapV2Factory.json");
const {
    INFURA_KEY,
    CHAIN,
    BLOCKNUMBER
  } = process.env;
const toBN = (num) => hre.ethers.BigNumber.from(num);

describe.skip("PrimaryLendingPlatformWrappedTokenGateway", function () {
    this.timeout(86400000);

    let signers;
    let deployMaster;
    let addresses;

    let projectTokenDeployer;
    let usdcDeployer;
    let usbDeployer;
    let wethDeployer;

    let projectTokenDeployerAddress = configTesting.impersonateAccount.projectToken;
    let usdcDeployerAddress = configTesting.impersonateAccount.usdc;
    let usbDeployerAddress = configTesting.impersonateAccount.usb;
    let wethDeployerAddress = configTesting.impersonateAccount.WETH;

    let plpInstance;
    let plpAtomicRepayInstance;
    let plpLeverageInstance;
    let plpLiquidationInstance;
    let plpWTGInstance;
    let plpModeratorInstance;
    let chainlinkPriceProviderInstance;
    let priceProviderAggregatorInstance;

    let factory;
    let factoryAddress = configTesting.uniswapFactory;

    let plpAddress;
    let plpAtomicRepayAddress;
    let plpLeverageAddress;
    let plpLiquidationAddress;
    let plpWTGAddress;
    let plpModeratorAddress;
    let chainlinkPriceProviderAddress;
    let uniswapV2PriceProviderAddress;
    let priceProviderAggregatorAddress;

    let prj1;
    let prj2;
    let prj3;
    let prj1Usdc;
    let prj1Prj2;
    let wstETH;

    let usdc;
    let usb;
    let weth;

    let prj1Decimals;
    let prj2Decimals;
    let prj3Decimals;
    let prj1UsdcDecimals;
    let prj1Prj2Decimals;
    let wstEthDecimals;

    let usdcDecimals;
    let usbDecimals;
    let wethDecimals;

    let prj1Address;
    let prj2Address;
    let prj3Address;
    let prj1UsdcAddress;
    let prj1Prj2Address;
    let wstEthAddress;

    let usdcAddress;
    let usbAddress;
    let wethAddress;

    let masterAddress;
    let MockToken;

    let bLendingTokenAddress;
    let bLendingTokenInstance;

    async function setHighPricePrj1() {
        await priceProviderAggregatorInstance.setTokenAndPriceProvider(
            prj1Address,
            chainlinkPriceProviderAddress,
            false
        );
    };

    async function setLowPricePrj1() {
        await priceProviderAggregatorInstance.setTokenAndPriceProvider(
            prj1Address,
            uniswapV2PriceProviderAddress,
            false
        );
    }
    async function setLowPriceUSDC() {
        await priceProviderAggregatorInstance.setTokenAndPriceProvider(
            usdcAddress,
            chainlinkPriceProviderAddress,
            false
        );
    };

    async function setHighPriceUSDC() {
        await priceProviderAggregatorInstance.setTokenAndPriceProvider(
            usdcAddress,
            uniswapV2PriceProviderAddress,
            false
        );
    }

    async function loadBtokenInstance(bTokenAddress, deployMaster) {
        let BToken = await hre.ethers.getContractFactory("BLendingToken");
        return BToken.attach(bTokenAddress).connect(deployMaster);
    }

    async function impersonateAccount(account) {
        await helpers.impersonateAccount(account);
        return await hre.ethers.getSigner(account);
    }

    async function createSellCallData(
        tokenIn,
        amountIn,
        amountOutMin,
        weth,
        pools
    ) {
        signers = await hre.ethers.getSigners();
        let poolsList = new Array();
        let tokenInNext;
        for (let i = 0; i < pools.length; i++) {
            let pairToken = new hre.ethers.Contract(
                pools[i],
                UniSwapV2Pair_ARTIFACT.abi,
                signers[0]
            );
            let token0 = await pairToken.token0();
            let token1 = await pairToken.token1();
            let prefix;
            if (i == 0) {
                if (tokenIn.toLowerCase() == token0.toLowerCase()) {
                    prefix = "4de4";
                    tokenInNext = token1.toLowerCase();
                } else {
                    prefix = "4de5";
                    tokenInNext = token0.toLowerCase();
                }
            } else {
                if (tokenInNext.toLowerCase() == token0.toLowerCase()) {
                    prefix = "4de4";
                    tokenInNext = token1.toLowerCase();
                } else {
                    prefix = "4de5";
                    tokenInNext = token0.toLowerCase();
                }
            }
            let convertedPool = pools[i].slice(0, 2) + prefix + pools[i].slice(2);
            poolsList.push(convertedPool);
        }

        let iface = new ethers.utils.Interface(ParaSwapAdapter_ARTIFACT.abi);
        return result = iface.encodeFunctionData("swapOnUniswapV2Fork", [
            tokenIn,
            amountIn,
            amountOutMin,
            weth,
            poolsList
        ]);
    }
    async function createBuyCallData(
        tokenIn,
        amountInMax,
        amountOut,
        weth,
        pools
    ) {
        signers = await hre.ethers.getSigners();
        let poolsList = new Array();
        let tokenInNext;
        for (let i = 0; i < pools.length; i++) {
            let pairToken = new hre.ethers.Contract(
                pools[i],
                UniSwapV2Pair_ARTIFACT.abi,
                signers[0]
            );
            let token0 = await pairToken.token0();
            let token1 = await pairToken.token1();
            let prefix;
            if (i == 0) {
                if (tokenIn == token0) {
                    prefix = "4de4";
                    tokenInNext = token1;
                } else {
                    prefix = "4de5";
                    tokenInNext = token0;
                }
            } else {
                if (tokenInNext == token0) {
                    prefix = "4de4";
                    tokenInNext = token1;
                } else {
                    prefix = "4de5";
                    tokenInNext = token0;
                }
            }
            let convertedPool = pools[i].slice(0, 2) + prefix + pools[i].slice(2);
            poolsList.push(convertedPool);
        }


        let iface = new ethers.utils.Interface(ParaSwapAdapter_ARTIFACT.abi);
        return iface.encodeFunctionData("buyOnUniswapV2Fork", [
            tokenIn,
            amountInMax,
            amountOut,
            weth,
            poolsList
        ]);
    }
    async function resetNetwork() {
        await helpers.reset(
            `https://${CHAIN.replace("_", "-")}.infura.io/v3/${INFURA_KEY}`,
            Number(BLOCKNUMBER)
        )
    }
    after(async function(){
        await resetNetwork();
    });
    async function loadFixture() {
        signers = await hre.ethers.getSigners();
        deployMaster = signers[0];
        {
            let logFunc = console.log;
            addresses = await deployment();
            console.log = logFunc;

            plpAddress = addresses.plpAddress;
            plpAtomicRepayAddress = addresses.plpAtomicRepaymentAddress;
            plpLeverageAddress = addresses.plpLeverageAddress;
            plpLiquidationAddress = addresses.plpLiquidationAddress;
            plpWTGAddress = addresses.plpWrappedTokenGateway;
            plpModeratorAddress = addresses.plpModerator;
            chainlinkPriceProviderAddress = addresses.chainlinkPriceProviderAddress;
            uniswapV2PriceProviderAddress = addresses.uniswapV2PriceProviderAddress;
            priceProviderAggregatorAddress = addresses.priceProviderAggregatorAddress;

            prj1Address = addresses.projectTokens[0];
            prj2Address = addresses.projectTokens[1];
            prj3Address = addresses.projectTokens[2];
            prj1UsdcAddress = addresses.projectTokens[3];
            prj1Prj2Address = addresses.projectTokens[4];
            wstEthAddress = addresses.projectTokens[5];

            usdcAddress = addresses.lendingTokens[0];
            usbAddress = addresses.lendingTokens[1];
            wethAddress = addresses.lendingTokens[2];

            masterAddress = deployMaster.address;
        }
        {
            let PLP = await hre.ethers.getContractFactory("PrimaryLendingPlatformV2");
            let PLPAtomicRepay = await hre.ethers.getContractFactory("PrimaryLendingPlatformAtomicRepayment");
            let PLPLeverage = await hre.ethers.getContractFactory("PrimaryLendingPlatformLeverage");
            let PLPLiquidation = await hre.ethers.getContractFactory("PrimaryLendingPlatformLiquidation");
            let PLPWTG = await hre.ethers.getContractFactory("PrimaryLendingPlatformWrappedTokenGateway");
            let PLPModerator = await hre.ethers.getContractFactory("PrimaryLendingPlatformModerator");
            let ChainlinkPriceProvider = await hre.ethers.getContractFactory("ChainlinkPriceProvider");
            let PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregator");

            let MockPRJ = await hre.ethers.getContractFactory("PRJ");
            MockToken = await hre.ethers.getContractFactory("MockToken");
            let MockWstETH = await hre.ethers.getContractFactory("MockWstETH");
            let MockWETH = await hre.ethers.getContractFactory("WETH9");

            plpInstance = PLP.attach(plpAddress).connect(deployMaster);
            plpAtomicRepayInstance = PLPAtomicRepay.attach(plpAtomicRepayAddress).connect(deployMaster);
            plpLeverageInstance = PLPLeverage.attach(plpLeverageAddress).connect(deployMaster);
            plpLiquidationInstance = PLPLiquidation.attach(plpLiquidationAddress).connect(deployMaster);
            plpWTGInstance = PLPWTG.attach(plpWTGAddress).connect(deployMaster);
            plpModeratorInstance = PLPModerator.attach(plpModeratorAddress).connect(deployMaster);
            chainlinkPriceProviderInstance = ChainlinkPriceProvider.attach(chainlinkPriceProviderAddress).connect(deployMaster);
            priceProviderAggregatorInstance = PriceProviderAggregator.attach(priceProviderAggregatorAddress).connect(deployMaster);

            factory = new hre.ethers.Contract(
                factoryAddress,
                UniswapV2FACTORY_ARTIFACT.abi,
                signers[0]
            );

            projectTokenDeployer = await impersonateAccount(projectTokenDeployerAddress);
            usdcDeployer = await impersonateAccount(usdcDeployerAddress);
            usbDeployer = await impersonateAccount(usbDeployerAddress);
            wethDeployer = await impersonateAccount(wethDeployerAddress);

            prj1 = MockPRJ.attach(prj1Address).connect(projectTokenDeployer);
            prj2 = MockPRJ.attach(prj2Address).connect(projectTokenDeployer);
            prj3 = MockPRJ.attach(prj3Address).connect(projectTokenDeployer);
            prj1Usdc = MockPRJ.attach(prj1UsdcAddress).connect(projectTokenDeployer);
            prj1Prj2 = MockPRJ.attach(prj1Prj2Address).connect(projectTokenDeployer);
            wstETH = MockWstETH.attach(wstEthAddress).connect(projectTokenDeployer);

            usdc = MockToken.attach(usdcAddress).connect(usdcDeployer);
            usb = MockToken.attach(usbAddress).connect(usbDeployer);
            weth = MockWETH.attach(wethAddress).connect(wethDeployer);

            prj1Decimals = await prj1.decimals();
            prj2Decimals = await prj2.decimals();
            prj3Decimals = await prj3.decimals();
            prj1UsdcDecimals = await prj1Usdc.decimals();
            prj1Prj2Decimals = await prj1Prj2.decimals();
            wstEthDecimals = await wstETH.decimals();

            usdcDecimals = await usdc.decimals();
            usbDecimals = await usb.decimals();
            wethDecimals = await weth.decimals();
            console.log("usdc: " + (await plpInstance.getTokenEvaluation(usdcAddress, ethers.utils.parseUnits("1", usdcDecimals))).toString());
            console.log("weth: " + (await plpInstance.getTokenEvaluation(wethAddress, ethers.utils.parseUnits("1", wethDecimals))).toString());
        }
        {
            bLendingTokenAddress = (await plpInstance.lendingTokenInfo(wethAddress)).bLendingToken;
            bLendingTokenInstance = MockToken.attach(bLendingTokenAddress).connect(deployMaster);
        }
    }

    describe("deposit", function () { });

    describe("withdraw", function () { });

    describe("borrow", function () { });

    //TODO edit the expectation base on event arguments
    describe("supply", async function () {
        before(async function () {
            await loadFixture();
        });

        it("1. Failure: Should throw error when value < 0", async function () {
            expect(plpWTGInstance.supply({ value: -1 })).to.throw;
        });

        it("2. Failure: Should throw error when value > maxUint256", async function () {
            expect(plpWTGInstance.supply({ value: ethers.constants.MaxUint256 })).to.throw;
        });

        it("3. Failure: Should throw error when value is not uint", async function () {
            expect(plpWTGInstance.supply({ value: 1.1 })).to.throw;
        });

        it("4. Failure: Should revert when value = 0", async function () {
            await expect(plpWTGInstance.supply({ value: 0 })).to.be.revertedWith("PIT: LendingTokenAmount==0");
        });

        it("5. Failure: Should revert when isPaused = TRUE", async function () {
            await plpModeratorInstance.setPausedLendingToken(wethAddress, true);

            await expect(plpWTGInstance.supply({ value: ethers.utils.parseEther("100") }))
                .to.be.revertedWith("PIT: Lending token is paused'");

            await plpModeratorInstance.setPausedLendingToken(wethAddress, false,);
        });

        it("6. Failure: Should throw error when balance < value", async function () {
            masterEthBalance = await hre.ethers.provider.getBalance(masterAddress);
            value = masterEthBalance.add(ethers.utils.parseEther("1"));

            await weth.connect(deployMaster).approve(bLendingTokenAddress, value);

            expect(plpWTGInstance.supply({ value })).to.throw;

            await weth.connect(deployMaster).approve(bLendingTokenAddress, 0);
        });

        it("7. Failure: Should throw error when allowance < value", async function () {
            value = ethers.utils.parseUnits("1");
            expect(plpWTGInstance.supply({ value })).to.throw;
        });

        it("8. Success: Should supply token successfully", async function () {

            bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
            exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));

            value = ethers.utils.parseEther("100");
            await weth.connect(deployMaster).approve(bLendingTokenAddress, value);

            console.log(await weth.balanceOf(masterAddress));
            console.log((await hre.ethers.provider.getBalance(deployMaster.address)).toString());
            console.log(await weth.allowance(masterAddress, bLendingTokenAddress));
            console.log(await bLendingTokenInstance.balanceOf(masterAddress));
            console.log(await weth.balanceOf(masterAddress));

            console.log('-----------');
            console.log('-----------');

            masterEthBalance = await hre.ethers.provider.getBalance(masterAddress);
            wethBalance = await hre.ethers.provider.getBalance(wethAddress);
            totalSupplyTokenBeforeSupply = await bLendingTokenInstance.totalSupply(); // correct
            balanceLendingTokenUserBeforeSupply = await weth.balanceOf(masterAddress);
            balanceBLendingTokenUserBeforeSupply = await bLendingTokenInstance.balanceOf(masterAddress); // correct
            balanceLendingTokenBeforeSupply = await bLendingTokenInstance.balanceOf(wethAddress);
            allowanceLendingTokenBeforeSupply = await weth.allowance(masterAddress, bLendingTokenAddress); // correct

            console.log({
                masterEthBalance,
                wethBalance,
                totalSupplyTokenBeforeSupply,
                balanceLendingTokenUserBeforeSupply,
                balanceBLendingTokenUserBeforeSupply,
                balanceLendingTokenBeforeSupply,
                allowanceLendingTokenBeforeSupply,
            });

            let supplyTx = await (plpWTGInstance.supply({ value }));
            let receipt = await supplyTx.wait();
            let args;

            // Iterate through the logs in the receipt
            for (let log of receipt.logs) {
                try {
                    let decodedLog = plpInstance.interface.parseLog(log);
                    if (decodedLog.name === "Supply") {
                        args = decodedLog.args;
                    }
                } catch (error) { }
            }


            // let events = receipt.events;
            // let args;
            // for (let i = 0; i < events.length; i++) {
            //     if (events[i]?.event == "Supply") {
            //         args = events[i].args;
            //     }
            // }
            console.log({ args });

            // mintedAmount = args.amountSupplyBTokenReceived;
            // exchangedMintedAmount = mintedAmount.div(exchangeRate);
            masterEthBalance = await hre.ethers.provider.getBalance(masterAddress);
            wethBalance = await hre.ethers.provider.getBalance(wethAddress);
            totalSupplyTokenAfterSupply = await bLendingTokenInstance.totalSupply();
            balanceLendingTokenUserAfterSupply = await weth.balanceOf(masterAddress);
            balanceBLendingTokenUserAfterSupply = await bLendingTokenInstance.balanceOf(masterAddress);
            balanceLendingTokenAfterSupply = await bLendingTokenInstance.balanceOf(wethAddress);
            allowanceLendingTokenAfterSupply = await weth.allowance(masterAddress, bLendingTokenAddress);

            console.log({
                masterEthBalance,
                wethBalance,
                totalSupplyTokenAfterSupply,
                balanceLendingTokenUserAfterSupply,
                balanceBLendingTokenUserAfterSupply,
                balanceLendingTokenAfterSupply,
                allowanceLendingTokenAfterSupply,
            });

            // expect(totalSupplyTokenBeforeSupply).to.eq(totalSupplyTokenAfterSupply.sub(exchangedMintedAmount));
            // expect(balanceLendingTokenUserBeforeSupply).to.eq(balanceLendingTokenUserAfterSupply.add(lendingTokenAmount));
            // expect(balanceBLendingTokenUserBeforeSupply).to.eq(balanceBLendingTokenUserAfterSupply.sub(exchangedMintedAmount));
            // expect(allowanceLendingTokenBeforeSupply).to.eq(allowanceLendingTokenAfterSupply.add(lendingTokenAmount));
        });
    });

    //TODO edit the expectation of success case
    describe("redeem", function () {
        before(async function () {
            await loadFixture();
        });

        it("1. Failure: Should throw error when bLendingTokenAmount < 0", async function () {
            bLendingTokenAmount = -1;
            expect(plpWTGInstance.redeem(bLendingTokenAmount)).to.throw;
        });

        it("2. Failure: Should throw error when bLendingTokenAmount > maxUint256", async function () {
            bLendingTokenAmount = ethers.constants.MaxUint256.add(toBN(1));
            expect(plpWTGInstance.redeem(bLendingTokenAmount)).to.throw;
        });

        it("3. Failure: Should throw error bLendingTokenAmount is not uint256", async function () {
            bLendingTokenAmount = 1.1;
            expect(plpWTGInstance.redeem(bLendingTokenAmount)).to.throw;
        });

        it("4. Failure: Should throw error when msg.value != 0", async function () {
            bLendingTokenAmount = toBN(1);
            expect(plpWTGInstance.redeem(bLendingTokenAmount, { value: toBN(1) })).to.throw;
        });

        it("5. Failure: Should revert when isPaused = TRUE", async function () {
            await plpModeratorInstance.setPausedLendingToken(wethAddress, true);

            bLendingTokenAmount = toBN(1);
            expect(plpWTGInstance.redeem(bLendingTokenAmount, { value: toBN(1) }))
                .to.be.revertedWith("PIT: Lending token is paused'");

            await plpModeratorInstance.setPausedLendingToken(wethAddress, false,);
        });

        it("6. Failure: Should revert when bLendingTokenAmount = 0", async function () {
            bLendingTokenAmount = toBN(0);
            await expect(plpWTGInstance.redeem(bLendingTokenAmount)).to.be.revertedWith("PIT: BLendingTokenAmount==0");
        });

        it("7. Failure: Should revert when weth balance of bLendingToken < bLendingTokenAmount", async function () {
            balanceOfUserBLendingToken = await bLendingTokenInstance.balanceOf(masterAddress);
            bLendingTokenAmount = balanceOfUserBLendingToken.add(toBN(100));

            await expect(plpWTGInstance.redeem(bLendingTokenAmount)).to.be.revertedWith("PIT: RedeemError!=0. redeem>=supply.");
        });

        it("8. Success: Should redeem success weth token", async function () {

            bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
            exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));

            bLendingTokenAmount = ethers.utils.parseEther("100");
            exchangedBLendingToken = ethers.utils.parseEther((100 / exchangeRate).toString());

            // Supply weth token
            await weth.connect(deployMaster).approve(bLendingTokenAddress, bLendingTokenAmount);
            await weth.connect(deployMaster).approve(plpWTGAddress, bLendingTokenAmount);
            await plpWTGInstance.supply({ value: bLendingTokenAmount });

            masterEthBalanceBeforeRedeem = await hre.ethers.provider.getBalance(masterAddress);
            wethBalanceBeforeRedeem = await hre.ethers.provider.getBalance(wethAddress);
            balanceOfBLendingTokenBeforeRedeem = await weth.balanceOf(bLendingTokenAddress);
            balanceOfLendingTokenUserBeforeRedeem = await weth.balanceOf(masterAddress);
            balanceOfBLendingTokenUserBeforeRedeem = await bLendingTokenInstance.balanceOf(masterAddress);

            console.log({
                masterEthBalanceBeforeRedeem,
                wethBalanceBeforeRedeem,
                balanceOfBLendingTokenBeforeRedeem,
                balanceOfLendingTokenUserBeforeRedeem,
                balanceOfBLendingTokenUserBeforeRedeem,
            });

            await expect(plpWTGInstance.redeem(
                exchangedBLendingToken
            )).to.emit(plpInstance, 'Redeem').withArgs(masterAddress, wethAddress, bLendingTokenAddress, exchangedBLendingToken);

            masterEthBalanceAfterRedeem = await hre.ethers.provider.getBalance(masterAddress);
            wethBalanceAfterRedeem = await hre.ethers.provider.getBalance(wethAddress);
            balanceOfBLendingTokenAfterRedeem = await weth.balanceOf(bLendingTokenAddress);
            balanceOfLendingTokenUserAfterRedeem = await weth.balanceOf(masterAddress);
            balanceOfBLendingTokenUserAfterRedeem = await bLendingTokenInstance.balanceOf(masterAddress);

            console.log({
                masterEthBalanceAfterRedeem,
                wethBalanceAfterRedeem,
                balanceOfBLendingTokenAfterRedeem,
                balanceOfLendingTokenUserAfterRedeem,
                balanceOfBLendingTokenUserAfterRedeem,
            });

            expect(balanceOfBLendingTokenBeforeRedeem).to.eq(balanceOfBLendingTokenAfterRedeem.add(bLendingTokenAmount));
            expect(balanceOfLendingTokenUserBeforeRedeem).to.eq(balanceOfLendingTokenUserAfterRedeem.sub(bLendingTokenAmount));
            expect(balanceOfBLendingTokenUserBeforeRedeem).to.eq(balanceOfBLendingTokenUserAfterRedeem.add(exchangedBLendingToken));
        });
    });

    //TODO edit the expectation of success case
    describe("redeemUnderlying", function () {
        before(async function () {
            await loadFixture();
        });

        it("1. Failure: Should throw error when lendingTokenAmount < 0", async function () {
            lendingTokenAmount = -1;
            expect(plpWTGInstance.redeemUnderlying(lendingTokenAmount)).to.throw;
        });

        it("2. Failure: Should throw error when lendingTokenAmount > maxUint256", async function () {
            lendingTokenAmount = ethers.constants.MaxUint256.add(toBN(1));
            expect(plpWTGInstance.redeemUnderlying(lendingTokenAmount)).to.throw;
        });

        it("3. Failure: Should throw error lendingTokenAmount is not uint256", async function () {
            lendingTokenAmount = 1.1;
            expect(plpWTGInstance.redeemUnderlying(lendingTokenAmount)).to.throw;
        });

        it("4. Failure: Should throw error when msg.value != 0", async function () {
            lendingTokenAmount = toBN(1);
            expect(plpWTGInstance.redeemUnderlying(lendingTokenAmount, { value: toBN(1) })).to.throw;
        });

        it("5. Failure: Should revert when isPaused = TRUE", async function () {
            await plpModeratorInstance.setPausedLendingToken(wethAddress, true);

            bLendingTokenAmount = toBN(1);
            expect(plpWTGInstance.redeemUnderlying(bLendingTokenAmount, { value: toBN(1) }))
                .to.be.revertedWith("PIT: Lending token is paused'");

            await plpModeratorInstance.setPausedLendingToken(wethAddress, false,);
        });

        it("6. Failure: Should revert when lendingTokenAmount == 0", async function () {
            lendingTokenAmount = toBN(0);
            await expect(plpWTGInstance.redeemUnderlying(lendingTokenAmount)).to.be.revertedWith("PIT: LendingTokenAmount==0");
        });

        it("7. Failure: Should revert when weth balance of lendingToken < lendingTokenAmount", async function () {
            balanceOfBLendingToken = await weth.balanceOf(bLendingTokenAddress);
            lendingTokenAmount = balanceOfBLendingToken.add(toBN(100));
            await expect(plpWTGInstance.redeemUnderlying(lendingTokenAmount)).to.be.revertedWith("PIT:Redeem>=supply");
        });

        it("8. Success: Should redeemUnderlying success weth token", async function () {
            bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
            exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));

            lendingTokenAmount = ethers.utils.parseEther("100");
            exchangedLendingToken = ethers.utils.parseEther((100 / exchangeRate).toString());

            // Supply lending token
            await weth.connect(deployMaster).approve(bLendingTokenAddress, lendingTokenAmount);
            await weth.connect(deployMaster).approve(plpWTGAddress, lendingTokenAmount);
            await plpWTGInstance.supply({ value: lendingTokenAmount });

            // RedeemUnderlying lending token
            masterEthBalanceBeforeRedeemUnderlying = await hre.ethers.provider.getBalance(masterAddress);
            wethBalanceBeforeRedeemUnderlying = await hre.ethers.provider.getBalance(wethAddress);
            balanceOfBLendingTokenBeforeRedeemUnderlying = await usdc.balanceOf(bLendingTokenAddress);
            balanceOfLendingTokenUserBeforeRedeemUnderlying = await usdc.balanceOf(masterAddress);
            balanceOfBLendingTokenUserBeforeRedeemUnderlying = await bLendingTokenInstance.balanceOf(masterAddress);

            console.log({
                masterEthBalanceBeforeRedeemUnderlying,
                wethBalanceBeforeRedeemUnderlying,
                balanceOfBLendingTokenBeforeRedeemUnderlying,
                balanceOfLendingTokenUserBeforeRedeemUnderlying,
                balanceOfBLendingTokenUserBeforeRedeemUnderlying,
            });

            await expect(plpWTGInstance.redeemUnderlying(
                lendingTokenAmount
            )).to.emit(plpInstance, 'RedeemUnderlying').withArgs(masterAddress, wethAddress, bLendingTokenAddress, lendingTokenAmount);

            masterEthBalanceAfterRedeemUnderlying = await hre.ethers.provider.getBalance(masterAddress);
            wethBalanceAfterRedeemUnderlying = await hre.ethers.provider.getBalance(wethAddress);
            balanceOfBLendingTokenAfterRedeemUnderlying = await usdc.balanceOf(bLendingTokenAddress);
            balanceOfLendingTokenUserAfterRedeemUnderlying = await usdc.balanceOf(masterAddress);
            balanceOfBLendingTokenUserAfterRedeemUnderlying = await bLendingTokenInstance.balanceOf(masterAddress);

            console.log({
                masterEthBalanceAfterRedeemUnderlying,
                wethBalanceAfterRedeemUnderlying,
                balanceOfBLendingTokenAfterRedeemUnderlying,
                balanceOfLendingTokenUserAfterRedeemUnderlying,
                balanceOfBLendingTokenUserAfterRedeemUnderlying,
            });

            expect(balanceOfBLendingTokenBeforeRedeemUnderlying).to.eq(balanceOfBLendingTokenAfterRedeemUnderlying.add(lendingTokenAmount));
            expect(balanceOfLendingTokenUserBeforeRedeemUnderlying).to.eq(balanceOfUserAfterRedeemUnderlying.sub(lendingTokenAmount));
            expect(balanceOfBLendingTokenUserBeforeRedeemUnderlying).to.eq(balanceOfBLendingTokenUserAfterRedeemUnderlying.add(exchangedLendingToken));
        });
    });

    //TODO test success cases and new added cases
    describe("repay", function () {
        before(async function () {
            await loadFixture();
        });

        it("1. Failure: Should throw error when projectToken has an invalid address", async function () {
            projectTokenAddress = "Not Address.";
            lendingTokenAmount = ethers.utils.parseEther("100");
            expect(plpWTGInstance.repay(
                projectTokenAddress,
                lendingTokenAmount,
                { value: ethers.utils.parseEther("100") }
            )).to.throw;
        });

        it("2. Failure: Should throw error when lendingTokenAmount < 0", async function () {
            lendingTokenAmount = -1;
            expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: ethers.utils.parseEther("100") }
            )).to.throw;
        });

        it("3. Failure: Should throw error when lendingTokenAmount > maxUint256", async function () {
            lendingTokenAmount = ethers.constants.MaxUint256.add(toBN(1));
            expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: ethers.utils.parseEther("100") }
            )).to.throw;
        });

        it("4. Failure: Should throw error lendingTokenAmount is not uint256", async function () {
            lendingTokenAmount = 1.1;
            expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: ethers.utils.parseEther("100") }
            )).to.throw;
        });

        it("5. Failure: Should throw error when msg.value < 0", async function () {
            lendingTokenAmount = ethers.utils.parseEther("100");
            expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: 0 - 1 }
            )).to.throw;
        });

        it("6. Failure: Should throw error when msg.value > maxUint256", async function () {
            lendingTokenAmount = ethers.utils.parseEther("100");
            expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: ethers.constants.MaxUint256.add(toBN(1)) }
            )).to.throw;
        });

        it("7. Failure: Should throw error when msg.value < 0", async function () {
            lendingTokenAmount = ethers.utils.parseEther("100");
            expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: 1.1 }
            )).to.throw;
        });

        it("8. Failure: Should throw error when msg.value = 0", async function () {
            lendingTokenAmount = ethers.utils.parseEther("100");
            expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: 0 }
            )).to.throw;
        });

        it("9. Failure: Should revert when lendingTokenAmount = 0", async function () {
            lendingTokenAmount = ethers.utils.parseEther("0");
            await expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: lendingTokenAmount }
            )).to.be.revertedWith("PIT: LendingTokenAmount==0");
        });

        describe("Borrowed cases:", async function () {
            beforeEach(async function () {
                await loadFixture();

                bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
                exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));

                {
                    {
                        // deposit prj1 and prj2
                        let depositPrj1Amount = ethers.utils.parseUnits("100", prj1Decimals);
                        await prj1.mintTo(masterAddress, depositPrj1Amount);
                        await prj1.connect(deployMaster).approve(plpAddress, depositPrj1Amount);
                        await plpInstance.deposit(prj1Address, depositPrj1Amount);

                        let depositPrj2Amount = ethers.utils.parseUnits("100", prj2Decimals);
                        await prj2.mintTo(masterAddress, depositPrj2Amount);
                        await prj2.connect(deployMaster).approve(plpAddress, depositPrj2Amount);
                        await plpInstance.deposit(prj2Address, depositPrj2Amount);
                    }
                    {
                        // supply weth token
                        let supplyAmount = ethers.utils.parseEther("100"); //1000 eth
                        await weth.connect(deployMaster).approve(bLendingTokenAddress, supplyAmount);
                        await plpWTGInstance.supply({ value: supplyAmount });
                    }
                    {
                        console.log('====================');
                        // borrow prj1
                        let borrowAmount = await plpInstance.getLendingAvailableToBorrow(masterAddress, prj1Address, wethAddress);
                        console.log({ borrowAmount });
                        await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                        await plpWTGInstance.borrow(prj1Address, borrowAmount);
                    }
                }
            });

            it("7.1. Success: Repay with borrowBalanceStored < lendingTokenAmount", async function () {
                // let totalOutStanding = plpWTGInstance.getTotalOutstanding(masterAddress, prj1Address);

                console.log({ totalOutStanding });

                // borrowAmount = ethers.utils.parseUnits("100000000", usdcDecimals); //100.000.000
                // repayAmount = borrowAmount.add(ethers.utils.parseUnits("100000000", usdcDecimals));

                // masterAddress = deployMaster.address;
                // bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                // bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);

                // bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
                // exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));

                // await usdc.connect(deployMaster).approve(bLendingTokenAddress, repayAmount);

                // borrowBalanceStored = await bToken.borrowBalanceStored(masterAddress);

                // let totalBorrowedUsdcTokenBeforeRepay = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                // let totalBorrowPrj1BeforeRepay = await plpInstance.getTotalBorrowPerCollateral(prj1Address);
                // let borrowPositionBeforeRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                // let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                // let repayTx = await plpInstance.repay(prj1Address, usdcAddress, repayAmount);
                // let receipt = await repayTx.wait();
                // let events = receipt.events;
                // let args;
                // for (let i = 0; i < events.length; i++) {
                //     if (events[i]?.event == "RepayBorrow") {
                //         args = events[i].args;
                //     }
                // }

                // let totalBorrowedUsdcTokenAfterRepay = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                // let totalBorrowPrj1AfterRepay = await plpInstance.getTotalBorrowPerCollateral(prj1Address);
                // let borrowPositionAfterRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                // let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                // expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                // expect(args.borrowAmount).to.eq(borrowBalanceStored);
                // expect(args.isPositionFullyRepaid).to.eq(true);

            });

            it("7.2. Success: Repay with borrowBalanceStored >= lendingTokenAmount && _totalOutstanding < lendingTokenAmount", async function () {
                totalOutstanding = await plpInstance.totalOutstanding(masterAddress, prj1Address, usdcAddress);
                repayAmount = totalOutstanding.add(ethers.utils.parseUnits("1", usdcDecimals));

                masterAddress = deployMaster.address;
                bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);

                bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
                exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));

                await usdc.connect(deployMaster).approve(bLendingTokenAddress, repayAmount);

                borrowBalanceStored = await bToken.borrowBalanceStored(masterAddress);

                let totalBorrowedUsdcTokenBeforeRepay = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                let totalBorrowPrj1BeforeRepay = await plpInstance.getTotalBorrowPerCollateral(prj1Address);
                let borrowPositionBeforeRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                let repayTx = await plpInstance.repay(prj1Address, usdcAddress, repayAmount);
                let receipt = await repayTx.wait();
                let events = receipt.events;
                let args;
                for (let i = 0; i < events.length; i++) {
                    if (events[i]?.event == "RepayBorrow") {
                        args = events[i].args;
                    }
                }

                let totalBorrowedUsdcTokenAfterRepay = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                let totalBorrowPrj1AfterRepay = await plpInstance.getTotalBorrowPerCollateral(prj1Address);
                let borrowPositionAfterRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                expect(args.borrowAmount).to.eq(borrowBalanceStored);
                expect(args.isPositionFullyRepaid).to.eq(true);
            });

            it("7.3. Success: Repay with borrowBalanceStored >= lendingTokenAmount && _totalOutstanding >= lendingTokenAmount", async function () {
                repayAmount = ethers.utils.parseUnits("1", usdcDecimals);

                masterAddress = deployMaster.address;
                bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);

                bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
                exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));

                await usdc.connect(deployMaster).approve(bLendingTokenAddress, repayAmount);

                borrowBalanceStored = await bToken.borrowBalanceStored(masterAddress);
                totalOutstanding = await plpInstance.totalOutstanding(masterAddress, prj1Address, usdcAddress);

                let totalBorrowedUsdcTokenBeforeRepay = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                let totalBorrowPrj1BeforeRepay = await plpInstance.getTotalBorrowPerCollateral(prj1Address);
                let borrowPositionBeforeRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                let repayTx = await plpInstance.repay(prj1Address, usdcAddress, repayAmount);
                let receipt = await repayTx.wait();
                let events = receipt.events;
                let args;
                for (let i = 0; i < events.length; i++) {
                    if (events[i]?.event == "RepayBorrow") {
                        args = events[i].args;
                    }
                }

                let totalBorrowedUsdcTokenAfterRepay = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                let totalBorrowPrj1AfterRepay = await plpInstance.getTotalBorrowPerCollateral(prj1Address);
                let borrowPositionAfterRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                expect(args.borrowAmount).to.eq(repayAmount);
                expect(args.isPositionFullyRepaid).to.eq(false);
            });
        });
    });

    //TODO edit the expectation of success case
    describe("liquidate with lending ETH", async function () {
        this.timeout(24 * 36000 * 100000);

        describe("Liquidate with invalid input", async function () {
            before(async function () {
                await loadFixture();
            });

            it("1. Failure: Should throw error when account is invalid", async function () {
                account = "Not Address.";
                lendingTokenAmount = ethers.utils.parseEther("100");
                value = ethers.utils.parseEther("100");
                expect(plpWTGInstance.liquidateWithLendingETH(
                    account, prj1Address, lendingTokenAmount,
                    { value }
                )).to.throw;
            });

            it("2. Failure: Should throw error when projectToken is invalid", async function () {
                projectTokenAddress = "Not Address.";
                lendingTokenAmount = ethers.utils.parseEther("100");
                value = ethers.utils.parseEther("100");
                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, projectTokenAddress, lendingTokenAmount,
                    { value }
                )).to.throw;
            });

            it("3. Failure: Should throw error when lendingTokenAmount < 0", async function () {
                lendingTokenAmount = -1;
                value = ethers.utils.parseEther("100");
                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value }
                )).to.throw;
            });

            it("4. Failure: Should throw error when lendingTokenAmount > maxUint256", async function () {
                lendingTokenAmount = ethers.constants.MaxUint256.add(toBN(1));
                value = ethers.utils.parseEther("100");
                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value }
                )).to.throw;
            });

            it("5. Failure: Should throw error when lendingTokenAmount is not uint", async function () {
                lendingTokenAmount = 1.1;
                value = ethers.utils.parseEther("100");
                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value }
                )).to.throw;
            });

            it("6. Failure: Should throw error when value < 0", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                value = -1;
                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value }
                )).to.throw;
            });

            it("7. Failure: Should throw error when value > maxUint256", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                value = ethers.constants.MaxUint256.add(toBN(1));
                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value }
                )).to.throw;
            });

            it("8. Failure: Should throw error when value is not uint", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                value = 1.1;
                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value }
                )).to.throw;
            });

            it("9. Failure: Should throw error when value = 0", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                value = 0;
                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value }
                )).to.throw;
            });

            it("10. Failure: Should throw error when lendingTokenAmount = 0", async function () {
                lendingTokenAmount = 0;
                value = ethers.utils.parseEther("100");
                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value }
                )).to.throw;
            });

            it("11. Failure: Should revert when isProjectTokenList = FALSE", async function () {
                projectTokenAddress = ethers.constants.AddressZero;
                lendingTokenAmount = ethers.utils.parseEther("100");
                value = ethers.utils.parseEther("100");
                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, projectTokenAddress, lendingTokenAmount,
                    { value }
                )).to.be.revertedWith("PITLiquidation: Project token is not listed");
            });

            it("12. Failure: Should revert when value < lendingTokenAmount", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                value = ethers.utils.parseEther("10");
                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value }
                )).to.be.revertedWith("WTG: Invalid value");
            });

            it("13. Failure: Should revert when value > lendingTokenAmount", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                value = ethers.utils.parseEther("110");
                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value }
                )).to.be.revertedWith("WTG: Invalid value");
            });

            it("14. Failure: Should revert when HF >= 1", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                value = ethers.utils.parseEther("100");
                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value }
                )).to.be.revertedWith("PITLiquidation: HealthFactor>=1");
            });
        });

        describe("Liquidate when HF < 1", async function () {
            before(async function () {
                this.timeout(24 * 36000 * 100000);
                await loadFixture();
                {
                    {
                        await setHighPrice(prj1Address);
                        // deposit prj1
                        let depositPrj1Amount = ethers.utils.parseUnits("100", prj1Decimals); // 100 prj1
                        await prj1.mintTo(masterAddress, depositPrj1Amount);
                        await prj1.connect(deployMaster).approve(plpAddress, depositPrj1Amount);
                        await plpInstance.deposit(prj1Address, depositPrj1Amount);
                    }
                    {
                        // supply weth token
                        let supplyAmount = ethers.utils.parseEther("100"); //1000 eth
                        await weth.connect(deployMaster).approve(bLendingTokenAddress, supplyAmount);
                        await plpWTGInstance.supply({ value: supplyAmount });
                    }
                    {
                        // borrow weth
                        let borrowAmount = await plpInstance.getLendingAvailableToBorrow(masterAddress, prj1Address, wethAddress);
                        console.log({ borrowAmount });
                        await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                        await plpWTGInstance.borrow(prj1Address, borrowAmount);

                        // check HF and liquidation amount
                        await setLowPrice(prj1Address);
                        let currentHealthFactor = await plpLiquidationInstance.getCurrentHealthFactor(masterAddress, prj1Address, wethAddress);
                        let liquidationAmount = await plpLiquidationInstance.getLiquidationAmount(masterAddress, prj1Address, wethAddress);

                        healthFactorNumerator = currentHealthFactor.healthFactorNumerator;
                        healthFactorDenominator = currentHealthFactor.healthFactorDenominator;
                        maxLA = liquidationAmount.maxLA;
                        minLA = liquidationAmount.minLA;

                        console.log({
                            healthFactorNumerator,
                            healthFactorDenominator,
                            maxLA,
                            minLA,
                        });
                    }
                }
            });

            it("12. Failure: Should revert when lendingTokenAmount < minLA", async function () {
                lendingTokenAmount = minLA.sub(toBN(1));
                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value: lendingTokenAmount }
                )).to.be.revertedWith("PITLiquidation: Invalid amount");
            });

            it("13. Failure: Should revert when lendingTokenAmount > maxLA", async function () {
                lendingTokenAmount = maxLA.add(toBN(1));
                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value: lendingTokenAmount }
                )).to.be.revertedWith("PITLiquidation: Invalid amount");
            });

            it("14. Failure: Should revert when allowance < lendingTokenAmount", async function () {
                lendingTokenAmount = minLA.add(toBN(100));
                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value: lendingTokenAmount }
                )).to.throw;
            });

            it("15. Success: Should liquidate successfully", async function () {
                lendingTokenAmount = minLA.add(toBN(100));
                weth.connect(deployMaster).approve(bLendingTokenAddress, lendingTokenAmount);

                let balanceProjectTokenBeforeLiquidate = await usdc.balanceOf(bLendingTokenAddress);
                let borrowPositionBeforeLiquidate = await plpInstance.borrowPosition(masterAddress, prj1Address, usdcAddress);
                let isLeveragePositionBeforeLiquidate = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);
                let totalBorrowedUsdcTokenBeforeLiquidate = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                let totalBorrowPrj1BeforeLiquidate = await plpInstance.getTotalBorrowPerCollateral(prj1Address);

                let liquidateTx = await (plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value: lendingTokenAmount }
                ));
                await liquidateTx.wait();

                let balanceProjectTokenAfterLiquidate = await usdc.balanceOf(bLendingTokenAddress);
                let borrowPositionAfterLiquidate = await plpInstance.borrowPosition(masterAddress, prj1Address, usdcAddress);
                let isLeveragePositionAfterLiquidate = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);
                let totalBorrowedUsdcTokenAfterLiquidate = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                let totalBorrowPrj1AfterLiquidate = await plpInstance.getTotalBorrowPerCollateral(prj1Address);

                // expect(balanceProjectTokenBeforeLiquidate).to.eq(balanceProjectTokenAfterLiquidate.sub(lendingTokenAmount));
                // expect(borrowPositionBeforeLiquidate.loanBody).to.eq(borrowPositionAfterLiquidate.loanBody.add(lendingTokenAmount));
            });

            it("16. Failure: Should revert when balance user < lendingTokenAmount", async function () {
                masterEthBalance = await hre.ethers.provider.getBalance(masterAddress);
                lendingTokenAmount = masterEthBalance.add(toBN(100));
                weth.connect(deployMaster).approve(bLendingTokenAddress, lendingTokenAmount);
                let balanceUser = await weth.balanceOf(masterAddress);
                weth.connect(deployMaster).transfer(bLendingTokenAddress, balanceUser);

                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value: lendingTokenAmount }
                )).to.throw;
            });
        });
    });

    //TODO edit the expectation of success case
    describe('liquidate with project ETH', () => {
        this.timeout(24 * 36000 * 100000);

        describe("Liquidate with invalid input", async function () {
            before(async function () {
                await loadFixture();
            });

            it("1. Failure: Should throw error when account is invalid", async function () {
                account = "Not Address.";
                lendingTokenAmount = ethers.utils.parseUnits("100", usdcDecimals);
                expect(plpWTGInstance.liquidateWithProjectETH(account, usdcAddress, lendingTokenAmount)).to.throw;
            });

            it("2. Failure: Should throw error when lendingToken is invalid", async function () {
                lendingToken = "Not Address.";
                lendingTokenAmount = ethers.utils.parseEther("100");
                expect(plpWTGInstance.liquidateWithProjectETH(masterAddress, lendingToken, lendingTokenAmount)).to.throw;
            });

            it("3. Failure: Should throw error when lendingTokenAmount < 0", async function () {
                lendingTokenAmount = -1;
                expect(plpWTGInstance.liquidateWithProjectETH(masterAddress, usdcAddress, lendingTokenAmount)).to.throw;
            });

            it("4. Failure: Should throw error when lendingTokenAmount > maxUint256", async function () {
                lendingTokenAmount = ethers.constants.MaxUint256.add(toBN(1));
                expect(plpWTGInstance.liquidateWithProjectETH(masterAddress, usdcAddress, lendingTokenAmount)).to.throw;
            });

            it("5. Failure: Should throw error when lendingTokenAmount is not uint", async function () {
                lendingTokenAmount = 1.1;
                expect(plpWTGInstance.liquidateWithProjectETH(masterAddress, usdcAddress, lendingTokenAmount)).to.throw;
            });

            it("6. Failure: Should throw error when value != 0", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                expect(plpWTGInstance.liquidateWithProjectETH(masterAddress, usdcAddress, lendingTokenAmount)).to.throw;
            });

            it("7. Failure: Should throw error when lendingTokenAmount = 0", async function () {
                lendingTokenAmount = 0;
                await expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount
                )).to.be.revertedWith("PITLiquidation: LendingTokenAmount must be greater than 0");
            });

            it("8. Failure: Should revert when isLendingTokenList = FALSE", async function () {
                lendingToken = ethers.constants.AddressZero;
                lendingTokenAmount = ethers.utils.parseEther("100");
                await expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, lendingToken, lendingTokenAmount
                )).to.be.revertedWith("PITLiquidation: Lending token is not listed");
            });

            it("9. Failure: Should revert when HF >= 1", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                await expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount
                )).to.be.revertedWith("PITLiquidation: HealthFactor>=1");
            });

            describe("Liquidate when HF < 1 and isLeveragePosition = FALSE", async function () {
                before(async function () {
                    this.timeout(24 * 36000 * 100000);
                    await loadFixture();
                    {
                        {
                            isLeveragePosition = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);
                            console.log({ isLeveragePosition });
                        }
                        {
                            await setLowPriceUSDC(wethAddress);
                            // deposit prj1
                            let depositPrj1Amount = ethers.utils.parseUnits("100", prj1Decimals); // 100 prj1
                            await prj1.mintTo(masterAddress, depositPrj1Amount);
                            await prj1.connect(deployMaster).approve(plpAddress, depositPrj1Amount);
                            await plpWTGInstance.deposit({ value: depositPrj1Amount });
                        }
                        {
                            // supply weth token
                            // let supplyAmount = ethers.utils.parseEther("100"); //1000 eth
                            let supplyAmount = ethers.utils.parseUnits("100000000", usdcDecimals); //100.000.000

                            // await weth.connect(deployMaster).approve(bLendingTokenAddress, supplyAmount);
                            // await plpWTGInstance.supply({ value: supplyAmount });

                            bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                            bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);

                            await usdc.mint(masterAddress, supplyAmount);
                            await usdc.connect(deployMaster).approve(bLendingTokenAddress, supplyAmount);
                            await plpInstance.supply(usdcAddress, supplyAmount);
                        }
                        {
                            // borrow weth
                            let borrowAmount = await plpInstance.getLendingAvailableToBorrow(masterAddress, wethAddress, usdcAddress);
                            // await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                            await plpInstance.borrow(wethAddress, usdcAddress, borrowAmount);

                            // check HF and liquidation amount
                            await setHighPriceUSDC(wethAddress);
                            let currentHealthFactor = await plpLiquidationInstance.getCurrentHealthFactor(masterAddress, wethAddress, usdcAddress);
                            let liquidationAmount = await plpLiquidationInstance.getLiquidationAmount(masterAddress, wethAddress, usdcAddress);

                            healthFactorNumerator = currentHealthFactor.healthFactorNumerator;
                            healthFactorDenominator = currentHealthFactor.healthFactorDenominator;
                            maxLA = liquidationAmount.maxLA;
                            minLA = liquidationAmount.minLA;

                            console.log({
                                healthFactorNumerator,
                                healthFactorDenominator,
                                maxLA,
                                minLA,
                            });
                        }
                    }
                });

                it("10. Failure: Should revert when lendingTokenAmount < minLA", async function () {
                    lendingTokenAmount = minLA.sub(toBN(1));
                    await expect(plpWTGInstance.liquidateWithProjectETH(
                        masterAddress, usdcAddress, lendingTokenAmount
                    )).to.be.revertedWith("PITLiquidation: Invalid amount");
                });

                it("11. Failure: Should revert when lendingTokenAmount > maxLA", async function () {
                    lendingTokenAmount = maxLA.add(toBN(1));
                    await expect(plpWTGInstance.liquidateWithProjectETH(
                        masterAddress, usdcAddress, lendingTokenAmount
                    )).to.be.revertedWith("PITLiquidation: Invalid amount");
                });

                it("12. Failure: Should revert when allowance < lendingTokenAmount", async function () {
                    lendingTokenAmount = minLA.add(toBN(100));
                    expect(plpWTGInstance.liquidateWithProjectETH(
                        masterAddress, usdcAddress, lendingTokenAmount
                    )).to.throw;
                });

                it("13. Success: Should liquidate successfully", async function () {
                    bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;

                    lendingTokenAmount = minLA.add(toBN(100));

                    usdc.connect(deployMaster).approve(bLendingTokenAddress, ethers.utils.parseEther("10000000"));

                    weth.connect(deployMaster).approve(plpWTGAddress, ethers.utils.parseEther("10000000"));




                    let balanceProjectTokenBeforeLiquidate = await usdc.balanceOf(bLendingTokenAddress);
                    let borrowPositionBeforeLiquidate = await plpInstance.borrowPosition(masterAddress, prj1Address, usdcAddress);
                    let isLeveragePositionBeforeLiquidate = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);
                    let totalBorrowedUsdcTokenBeforeLiquidate = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1BeforeLiquidate = await plpInstance.getTotalBorrowPerCollateral(prj1Address);

                    console.log({
                        balanceProjectTokenBeforeLiquidate,
                        borrowPositionBeforeLiquidate,
                        isLeveragePositionBeforeLiquidate,
                        totalBorrowedUsdcTokenBeforeLiquidate,
                        totalBorrowPrj1BeforeLiquidate,
                    });

                    console.log({ masterAddress });

                    await (plpWTGInstance.liquidateWithProjectETH(
                        masterAddress, usdcAddress, lendingTokenAmount
                    ));

                    let balanceProjectTokenAfterLiquidate = await usdc.balanceOf(bLendingTokenAddress);
                    let borrowPositionAfterLiquidate = await plpInstance.borrowPosition(masterAddress, prj1Address, usdcAddress);
                    let isLeveragePositionAfterLiquidate = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);
                    let totalBorrowedUsdcTokenAfterLiquidate = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1AfterLiquidate = await plpInstance.getTotalBorrowPerCollateral(prj1Address);

                    console.log({
                        balanceProjectTokenAfterLiquidate,
                        borrowPositionAfterLiquidate,
                        isLeveragePositionAfterLiquidate,
                        totalBorrowedUsdcTokenAfterLiquidate,
                        totalBorrowPrj1AfterLiquidate,
                    });

                    // expect(balanceProjectTokenBeforeLiquidate).to.eq(balanceProjectTokenAfterLiquidate.sub(lendingTokenAmount));
                    // expect(borrowPositionBeforeLiquidate.loanBody).to.eq(borrowPositionAfterLiquidate.loanBody.add(lendingTokenAmount));
                });

                it("14. Failure: Should revert when balance user < lendingTokenAmount", async function () {
                    bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;


                    masterEthBalance = await hre.ethers.provider.getBalance(masterAddress);
                    lendingTokenAmount = minLA.add(toBN(100));

                    weth.connect(deployMaster).approve(bLendingTokenAddress, lendingTokenAmount);
                    balanceUser = await weth.balanceOf(masterAddress);
                    weth.connect(deployMaster).transfer(bLendingTokenAddress, balanceUser);
                    console.log({ lendingTokenAmount });

                    await expect(plpWTGInstance.liquidateWithProjectETH(
                        masterAddress, usdcAddress, lendingTokenAmount
                    )).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
                });
            });

            describe.skip("Liquidate when HF < 1 and isLeveragePosition = TRUE", async function () {
                before(async function () {
                    this.timeout(24 * 36000 * 100000);
                    await loadFixture();
                    {
                        {
                            await setHighPricePrj1();
                            // deposit prj1
                            let depositPrj1Amount = ethers.utils.parseUnits("100", prj1Decimals); // 100 prj1
                            await prj1.mintTo(masterAddress, depositPrj1Amount);
                            await prj1.connect(deployMaster).approve(plpAddress, depositPrj1Amount);
                            await plpInstance.deposit(prj1Address, depositPrj1Amount);
                        }
                        {
                            // supply weth token
                            let supplyAmount = ethers.utils.parseEther("100"); //1000 eth
                            await weth.connect(deployMaster).approve(bLendingTokenAddress, supplyAmount);
                            await plpWTGInstance.supply({ value: supplyAmount });
                        }
                        {
                            // borrow weth
                            let borrowAmount = await plpInstance.getLendingAvailableToBorrow(masterAddress, prj1Address, wethAddress);
                            console.log({ borrowAmount });
                            await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                            await plpWTGInstance.borrow(prj1Address, borrowAmount);

                            // check HF and liquidation amount
                            await setLowPricePrj1();
                            let currentHealthFactor = await plpLiquidationInstance.getCurrentHealthFactor(masterAddress, prj1Address, wethAddress);
                            let liquidationAmount = await plpLiquidationInstance.getLiquidationAmount(masterAddress, prj1Address, wethAddress);

                            healthFactorNumerator = currentHealthFactor.healthFactorNumerator;
                            healthFactorDenominator = currentHealthFactor.healthFactorDenominator;
                            maxLA = liquidationAmount.maxLA;
                            minLA = liquidationAmount.minLA;

                            console.log({
                                healthFactorNumerator,
                                healthFactorDenominator,
                                maxLA,
                                minLA,
                            });
                        }
                    }
                });

                it("10. Failure: Should revert when lendingTokenAmount < minLA", async function () {
                    lendingTokenAmount = minLA.sub(toBN(1));
                    await expect(plpWTGInstance.liquidateWithProjectETH(
                        masterAddress, prj1Address, lendingTokenAmount
                    )).to.be.revertedWith("PITLiquidation: Invalid amount");
                });

                it("11. Failure: Should revert when lendingTokenAmount > maxLA", async function () {
                    lendingTokenAmount = maxLA.add(toBN(1));
                    await expect(plpWTGInstance.liquidateWithProjectETH(
                        masterAddress, prj1Address, lendingTokenAmount,
                        { value: lendingTokenAmount }
                    )).to.be.revertedWith("PITLiquidation: Invalid amount");
                });

                it("12. Failure: Should revert when allowance < lendingTokenAmount", async function () {
                    lendingTokenAmount = minLA.add(toBN(100));
                    expect(plpWTGInstance.liquidateWithProjectETH(
                        masterAddress, prj1Address, lendingTokenAmount,
                        { value: lendingTokenAmount }
                    )).to.throw;
                });

                it("13. Success: Should liquidate successfully", async function () {
                    lendingTokenAmount = minLA.add(toBN(100));
                    weth.connect(deployMaster).approve(bLendingTokenAddress, lendingTokenAmount);
                    weth.connect(deployMaster).approve(plpWTGAddress, lendingTokenAmount);

                    let balanceProjectTokenBeforeLiquidate = await usdc.balanceOf(bLendingTokenAddress);
                    let borrowPositionBeforeLiquidate = await plpInstance.borrowPosition(masterAddress, prj1Address, usdcAddress);
                    let isLeveragePositionBeforeLiquidate = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);
                    let totalBorrowedUsdcTokenBeforeLiquidate = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1BeforeLiquidate = await plpInstance.getTotalBorrowPerCollateral(prj1Address);

                    let liquidateTx = await (plpWTGInstance.liquidateWithProjectETH(
                        masterAddress, prj1Address, lendingTokenAmount,
                        { value: lendingTokenAmount }
                    ));
                    await liquidateTx.wait();

                    let balanceProjectTokenAfterLiquidate = await usdc.balanceOf(bLendingTokenAddress);
                    let borrowPositionAfterLiquidate = await plpInstance.borrowPosition(masterAddress, prj1Address, usdcAddress);
                    let isLeveragePositionAfterLiquidate = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);
                    let totalBorrowedUsdcTokenAfterLiquidate = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1AfterLiquidate = await plpInstance.getTotalBorrowPerCollateral(prj1Address);

                    // expect(balanceProjectTokenBeforeLiquidate).to.eq(balanceProjectTokenAfterLiquidate.sub(lendingTokenAmount));
                    // expect(borrowPositionBeforeLiquidate.loanBody).to.eq(borrowPositionAfterLiquidate.loanBody.add(lendingTokenAmount));
                });

                it("15. Failure: Should revert when balance user < lendingTokenAmount", async function () {
                    masterEthBalance = await hre.ethers.provider.getBalance(masterAddress);
                    lendingTokenAmount = masterEthBalance.add(toBN(100));
                    weth.connect(deployMaster).approve(bLendingTokenAddress, lendingTokenAmount);
                    let balanceUser = await weth.balanceOf(masterAddress);
                    weth.connect(deployMaster).transfer(bLendingTokenAddress, balanceUser);

                    expect(plpWTGInstance.liquidateWithProjectETH(
                        masterAddress, prj1Address, lendingTokenAmount,
                        { value: lendingTokenAmount }
                    )).to.throw;
                });
            });
        });
    });
});