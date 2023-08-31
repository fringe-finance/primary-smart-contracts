require("dotenv").config();
const chainConfigs = require('../../chain.config');
const chainConfig = chainConfigs[chainConfigs.chain];
const chain =chainConfigs.chain ? "_" +chainConfigs.chain : "";
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
const  INFURA_KEY = process.env.INFURA_KEY;
const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);

describe("PrimaryLendingPlatformAtomicRepayment", function () {
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
    let uniswapPriceProviderMockInstance;
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
    let uniswapV2PriceProviderMockAddress;
    let priceProviderAggregatorAddress;

    let prj1;
    let prj2;
    let prj3;

    let wstETH;

    let usdc;
    let usb;
    let weth;

    let prj1Decimals;
    let prj2Decimals;
    let prj3Decimals;

    let wstEthDecimals;

    let usdcDecimals;
    let usbDecimals;
    let wethDecimals;

    let prj1Address;
    let prj2Address;
    let prj3Address;

    let wstEthAddress;

    let usdcAddress;
    let usbAddress;
    let wethAddress;

    async function setHighPrice(tokenAddress, tokenDecimal) {
        let currentPrice = await priceProviderAggregatorInstance.getEvaluation(
            tokenAddress,
            ethers.utils.parseUnits("1", tokenDecimal)
        );
        await uniswapPriceProviderMockInstance.setTokenAndPrice(
            tokenAddress,
            currentPrice.mul(10)
        );
        await priceProviderAggregatorInstance.setTokenAndPriceProvider(
            tokenAddress,
            uniswapV2PriceProviderMockAddress,
            false
        );
    }
    async function setLowPrice(tokenAddress, tokenDecimal) {
        let currentPrice = await priceProviderAggregatorInstance.getEvaluation(
            tokenAddress,
            ethers.utils.parseUnits("1", tokenDecimal)
        );
        await uniswapPriceProviderMockInstance.setTokenAndPrice(
            tokenAddress,
            currentPrice.div(10)
        );
        await priceProviderAggregatorInstance.setTokenAndPriceProvider(
            tokenAddress,
            uniswapV2PriceProviderMockAddress,
            false
        );
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
                deployMaster
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
                deployMaster
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
            `https://${chainConfig.chain.replace("_", "-")}.infura.io/v3/${INFURA_KEY}`,
            Number(chainConfig.blockNumber)
        );
    }
    async function loadFixture() {
        await resetNetwork();
        signers = await hre.ethers.getSigners();
        deployMaster = signers[0];
        {
            let logFunc = console.log;
            addresses = await deployment();
            // console.log = logFunc;

            plpAddress = addresses.plpAddress;
            plpAtomicRepayAddress = addresses.plpAtomicRepaymentAddress;
            plpLeverageAddress = addresses.plpLeverageAddress;
            plpLiquidationAddress = addresses.plpLiquidationAddress;
            plpWTGAddress = addresses.plpWrappedTokenGateway;
            plpModeratorAddress = addresses.plpModerator;
            chainlinkPriceProviderAddress = addresses.chainlinkPriceProviderAddress;
            uniswapV2PriceProviderAddress = addresses.uniswapV2PriceProviderAddress;
            uniswapV2PriceProviderMockAddress = addresses.uniswapV2PriceProviderMockAddress;
            priceProviderAggregatorAddress = addresses.priceProviderAggregatorAddress;

            prj1Address = ethers.utils.getAddress(addresses.projectTokens[0]);
            prj2Address = ethers.utils.getAddress(addresses.projectTokens[1]);
            prj3Address = ethers.utils.getAddress(addresses.projectTokens[2]);

            wstEthAddress = ethers.utils.getAddress(addresses.projectTokens[projectTokens.length - 1]);

            usdcAddress = ethers.utils.getAddress(addresses.lendingTokens[0]);
            usbAddress = ethers.utils.getAddress(addresses.lendingTokens[1]);
            wethAddress = ethers.utils.getAddress(addresses.lendingTokens[2]);
        }

        {
            let PLP = await hre.ethers.getContractFactory("PrimaryLendingPlatformV2");
            let PLPAtomicRepay = await hre.ethers.getContractFactory("PrimaryLendingPlatformAtomicRepayment");
            let PLPLeverage = await hre.ethers.getContractFactory("PrimaryLendingPlatformLeverage");
            let PLPLiquidation = await hre.ethers.getContractFactory("PrimaryLendingPlatformLiquidation");
            let PLPWTG = await hre.ethers.getContractFactory("PrimaryLendingPlatformWrappedTokenGateway");
            let PLPModerator = await hre.ethers.getContractFactory("PrimaryLendingPlatformModerator");
            let ChainlinkPriceProvider = await hre.ethers.getContractFactory("ChainlinkPriceProvider");
            let UniswapPriceProviderMock = await hre.ethers.getContractFactory("UniswapV2PriceProviderMock");
            let PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregator");

            let MockPRJ = await hre.ethers.getContractFactory("PRJ");
            let MockToken = await hre.ethers.getContractFactory("MockToken");
            let MockWstETH = await hre.ethers.getContractFactory("MockWstETH");
            let MockWETH = await hre.ethers.getContractFactory("WETH9");

            plpInstance = PLP.attach(plpAddress).connect(deployMaster);
            plpAtomicRepayInstance = PLPAtomicRepay.attach(plpAtomicRepayAddress).connect(deployMaster);
            plpLeverageInstance = PLPLeverage.attach(plpLeverageAddress).connect(deployMaster);
            plpLiquidationInstance = PLPLiquidation.attach(plpLiquidationAddress).connect(deployMaster);
            plpWTGInstance = PLPWTG.attach(plpWTGAddress).connect(deployMaster);
            plpModeratorInstance = PLPModerator.attach(plpModeratorAddress).connect(deployMaster);
            chainlinkPriceProviderInstance = ChainlinkPriceProvider.attach(chainlinkPriceProviderAddress).connect(deployMaster);
            uniswapPriceProviderMockInstance = UniswapPriceProviderMock.attach(uniswapV2PriceProviderMockAddress).connect(deployMaster);
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

            wstETH = MockWstETH.attach(wstEthAddress).connect(projectTokenDeployer);

            usdc = MockToken.attach(usdcAddress).connect(usdcDeployer);
            usb = MockToken.attach(usbAddress).connect(usbDeployer);
            weth = MockWETH.attach(wethAddress).connect(wethDeployer);

            prj1Decimals = await prj1.decimals();
            prj2Decimals = await prj2.decimals();
            prj3Decimals = await prj3.decimals();

            wstEthDecimals = await wstETH.decimals();

            usdcDecimals = await usdc.decimals();
            usbDecimals = await usb.decimals();
            wethDecimals = await weth.decimals();

            await uniswapPriceProviderMockInstance.setTokenAndPrice(prj1Address, configTesting.price.prj1);
            await uniswapPriceProviderMockInstance.setTokenAndPrice(prj2Address, configTesting.price.prj2);
            await uniswapPriceProviderMockInstance.setTokenAndPrice(prj3Address, configTesting.price.prj3);
            await uniswapPriceProviderMockInstance.setTokenAndPrice(usdcAddress, configTesting.price.usdc);
            await uniswapPriceProviderMockInstance.setTokenAndPrice(usbAddress, configTesting.price.usb);
            await uniswapPriceProviderMockInstance.setTokenAndPrice(wethAddress, configTesting.price.weth);

            await priceProviderAggregatorInstance.setTokenAndPriceProvider(prj1Address, uniswapV2PriceProviderMockAddress, false);
            await priceProviderAggregatorInstance.setTokenAndPriceProvider(prj2Address, uniswapV2PriceProviderMockAddress, false);
            await priceProviderAggregatorInstance.setTokenAndPriceProvider(prj3Address, uniswapV2PriceProviderMockAddress, false);
            await priceProviderAggregatorInstance.setTokenAndPriceProvider(usdcAddress, uniswapV2PriceProviderMockAddress, false);
            await priceProviderAggregatorInstance.setTokenAndPriceProvider(usbAddress, uniswapV2PriceProviderMockAddress, false);
            await priceProviderAggregatorInstance.setTokenAndPriceProvider(wethAddress, uniswapV2PriceProviderMockAddress, false);
        }
    }

    describe("repayAtomic", async function () {
        before(async function () {
            await loadFixture();
        });

        it("1. Failure: Should throw error when prjToken has an invalid address", async function () {
            let projectToken = "Not Address.";
            let collateralAmount = toBN(1);
            let buyCalldata = "0x";
            let isRepayFully = "";

            expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            )).to.throw;
        });
        it("2. Failure: Should throw error when collateralAmount < 0", async function () {
            let projectToken = prj1.address;
            let collateralAmount = -1;
            let buyCalldata = "0x";
            let isRepayFully = "";

            expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            )).to.throw;
        });
        it("3. Failure: Should throw error when collateralAmount > maxUint256", async function () {
            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata = "0x";
            let isRepayFully = "";

            expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            )).to.throw;
        });
        it("4. Failure: Should throw error when collateralAmount is NOT UINT", async function () {
            let projectToken = prj1.address;
            let collateralAmount = 1.1;
            let buyCalldata = "0x";
            let isRepayFully = "";

            expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            )).to.throw;
        });
        it("5. Failure: Should throw error when buyCalldata is NOT BYTES", async function () {
            let projectToken = prj1.address;
            let collateralAmount = toBN(1);
            let buyCalldata = "NOT BYTES.";
            let isRepayFully = "";

            expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            )).to.throw;
        });
        it("6. Failure: Should throw error when msg.value != 0", async function () {
            let projectToken = prj1.address;
            let collateralAmount = toBN(1);
            let buyCalldata = "0x";
            let isRepayFully = "";

            expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                {
                    value: toBN(1)
                }
            )).to.throw;
        });
        it("7. Failure: Should revert when collateralAmount == 0", async function () {
            let projectToken = prj1.address;
            let collateralAmount = toBN(0);
            let buyCalldata = "0x";
            let isRepayFully = "";

            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            )).to.be.revertedWith("AtomicRepayment: CollateralAmount must be greater than 0");
        });
        it("8. Failure: Should revert when isProjectTokenListed == FALSE and depositedProjectTokenAmount < collateralAmount", async function () {
            let projectToken = ethers.constants.AddressZero;
            let collateralAmount = toBN(1);
            let buyCalldata = "0x";
            let isRepayFully = false;

            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);

            expect(depositedAmount).to.lt(collateralAmount);

            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            )).to.be.revertedWith("PIT: Project token is not listed");
        });
        it("9. Failure: Should revert when buyCalldata invalid and depositedProjectTokenAmount < collateralAmount", async function () {
            let projectToken = prj1.address;
            let collateralAmount = toBN(1);
            let buyCalldata = "0x";
            let isRepayFully = false;

            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);

            expect(depositedAmount).to.lt(collateralAmount);

            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            )).to.be.reverted;
        });
        it("10. Failure: Should revert when buyCalldata invalid and depositedProjectTokenAmount >= collateralAmount", async function () {
            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("10", prj1Decimals);
            let buyCalldata = "0x";
            let isRepayFully = false;

            {
                let depositAmount = collateralAmount;
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
            }

            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);

            expect(depositedAmount).to.gte(collateralAmount);

            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            )).to.be.reverted;
        });
        it("11. Failure: Should revert when amountSold > collateralAmount and depositedProjectTokenAmount < collateralAmount", async function () {

            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = ethers.utils.parseUnits("1", prj1Decimals);
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);
                    let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                        deployMaster.address,
                        projectToken,
                        usdcAddress
                    );
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        availableToBorrow
                    );
                }
            }
            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let totalOutStanding = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);

            let amountSoldMax = depositedAmount.mul(1000);
            let amountReceive = totalOutStanding.mul(100);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmount).to.lt(collateralAmount);
            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            )).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });
        it("12. Failure: Should revert when amountSold > collateralAmount and depositedProjectTokenAmount >= collateralAmount", async function () {

            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("1", prj1Decimals);
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = collateralAmount;
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);
                    let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                        deployMaster.address,
                        projectToken,
                        usdcAddress
                    );
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        availableToBorrow
                    );
                }
            }
            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let totalOutStanding = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);

            let amountSoldMax = depositedAmount.mul(1000);
            let amountReceive = totalOutStanding.mul(100);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );

            expect(depositedAmount).to.gte(collateralAmount);
            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            )).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });
        it("13. Failure: Should revert when isRepayFully == TRUE, amountReceive < totalOutStanding and depositedProjectTokenAmount < collateralAmount", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("100", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);
                    let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                        deployMaster.address,
                        projectToken,
                        usdcAddress
                    );
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        availableToBorrow
                    );
                }
            }
            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let totalOutStanding = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let amountSoldMax = depositedAmount;
            let amountReceive = totalOutStanding.sub(1);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmount).to.lt(collateralAmount);

            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            )).to.be.revertedWith("AtomicRepayment: Amount receive not enough to repay fully");
        });
        it("14. Failure: Should revert when isRepayFully == TRUE, amountReceive < totalOutStanding and depositedProjectTokenAmount >= collateralAmount", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = collateralAmount;
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("100", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);
                    let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                        deployMaster.address,
                        projectToken,
                        usdcAddress
                    );
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        availableToBorrow
                    );
                }
            }
            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let amountSoldMax = depositedAmount;
            let amountReceive = 1;
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmount).to.gte(collateralAmount);

            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            )).to.be.revertedWith("AtomicRepayment: Amount receive not enough to repay fully");
        });
        it("15. Failure: Should revert when healthFactor < 1, isLeveragePosition == FALSE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            await setHighPrice(prj1Address, prj1Decimals);
            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = ethers.utils.parseUnits("0.01", prj1Decimals);
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("100", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);
                    let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                        deployMaster.address,
                        projectToken,
                        usdcAddress
                    );
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        availableToBorrow
                    );
                }
            }
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let amountSoldMax = depositedAmount;
            let amountReceive = 1;
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(isLeveragePosition).to.eq(false);
            expect(depositedAmount).to.lt(collateralAmount);
            await setLowPrice(prj1Address, prj1Decimals);
            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            )).to.be.revertedWith("AtomicRepayment: Repayable amount makes healthFactor<1");
        });
        it("16. Failure: Should revert when healthFactor < 1, isLeveragePosition == FALSE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            await setHighPrice(prj1Address, prj1Decimals);
            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("0.01", prj1Decimals);
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = collateralAmount;
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("100", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);
                    let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                        deployMaster.address,
                        projectToken,
                        usdcAddress
                    );
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        availableToBorrow
                    );
                }
            }
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let amountSoldMax = depositedAmount;
            let amountReceive = 1;
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(isLeveragePosition).to.eq(false);
            expect(depositedAmount).to.gte(collateralAmount);
            await setLowPrice(prj1Address, prj1Decimals);
            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            )).to.be.revertedWith("AtomicRepayment: Repayable amount makes healthFactor<1");
        });
        it("17. Failure: Should revert when healthFactor < 1, isLeveragePosition == TRUE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            await setHighPrice(prj1Address, prj1Decimals);
            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let borrowAmount = ethers.utils.parseUnits("500", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    await prj1.mintTo(deployMaster.address, addingAmount);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowAmount,
                        0,
                        ethers.constants.AddressZero,
                        [await factory.getPair(projectToken, lendingToken)]
                    );
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0
                    );
                }
            }
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let amountSoldMax = depositedAmount;
            let amountReceive = 1;
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(isLeveragePosition).to.eq(true);
            expect(depositedAmount).to.lt(collateralAmount);
            await setLowPrice(prj1Address, prj1Decimals);
            await setLowPrice(prj1Address, prj1Decimals);
            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            )).to.be.revertedWith("AtomicRepayment: Repayable amount makes healthFactor<1");
        });
        it("18. Failure: Should revert when healthFactor < 1, isLeveragePosition == TRUE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            await setHighPrice(prj1Address, prj1Decimals);
            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = collateralAmount;
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let borrowAmount = ethers.utils.parseUnits("500", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    await prj1.mintTo(deployMaster.address, addingAmount);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowAmount,
                        0,
                        ethers.constants.AddressZero,
                        [await factory.getPair(projectToken, lendingToken)]
                    );
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0
                    );
                }
            }
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let amountSoldMax = depositedAmount;
            let amountReceive = 1;
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(isLeveragePosition).to.eq(true);
            expect(depositedAmount).to.gte(collateralAmount);
            await setLowPrice(prj1Address, prj1Decimals);
            await setLowPrice(prj1Address, prj1Decimals);
            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            )).to.be.revertedWith("AtomicRepayment: Repayable amount makes healthFactor<1");
        });
        it("19. Success (Single-user): Should repay 5 USDC when isRepayFully == TRUE, isLeveragePosition == FALSE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        borrowAmount
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let amountSoldMax = depositedAmountBeforeRepayAtomic;
            let amountReceive = ethers.utils.parseUnits("5", usdcDecimals);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            );
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

            let projectTokenEmitFromEvent = event.collateral;
            let lendingTokenEmitFromEvent = event.lendingAsset;
            let amountSoldEmitFromEvent = event.amountSold;
            let amountReceiveEmitFromEvent = event.amountReceive;

            let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(projectTokenEmitFromEvent).to.eq(projectToken);
            expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
            expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
            expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
        });
        it("19. Success (Multi-user): Should repay 5 USDC when isRepayFully == TRUE, isLeveragePosition == FALSE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = true;
            {
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    let supplyAmount = borrowAmount.mul(signers.length);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);

                    for (let i = 0; i < signers.length; i++) {
                        let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                        await plpInstance.connect(signers[i]).borrow(
                            projectToken,
                            usdcAddress,
                            borrowAmount
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                let amountSoldMax = depositedAmountBeforeRepayAtomic;
                let amountReceive = ethers.utils.parseUnits("5", usdcDecimals);
                buyCalldata = await createBuyCallData(
                    projectToken,
                    amountSoldMax,
                    amountReceive,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, actualLendingToken)]
                );
                expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
                expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

                let tx = await plpAtomicRepayInstance.connect(signers[i]).repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully
                );
                const rc = await tx.wait();
                const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

                let projectTokenEmitFromEvent = event.collateral;
                let lendingTokenEmitFromEvent = event.lendingAsset;
                let amountSoldEmitFromEvent = event.amountSold;
                let amountReceiveEmitFromEvent = event.amountReceive;

                let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                expect(projectTokenEmitFromEvent).to.eq(projectToken);
                expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
                expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
                expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
                expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
            }
        });
        it("20. Success (Single-user): Should repay 5 USDC when isRepayFully == TRUE, isLeveragePosition == FALSE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = collateralAmount;
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        borrowAmount
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let amountSoldMax = depositedAmountBeforeRepayAtomic;
            let amountReceive = ethers.utils.parseUnits("5", usdcDecimals);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            );
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

            let projectTokenEmitFromEvent = event.collateral;
            let lendingTokenEmitFromEvent = event.lendingAsset;
            let amountSoldEmitFromEvent = event.amountSold;
            let amountReceiveEmitFromEvent = event.amountReceive;

            let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(projectTokenEmitFromEvent).to.eq(projectToken);
            expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
            expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
            expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
        });
        it("20. Success (Multi-user): Should repay 5 USDC when isRepayFully == TRUE, isLeveragePosition == FALSE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = true;
            {
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    let supplyAmount = borrowAmount.mul(signers.length);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);

                    for (let i = 0; i < signers.length; i++) {
                        let depositAmount = collateralAmount;
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                        await plpInstance.connect(signers[i]).borrow(
                            projectToken,
                            usdcAddress,
                            borrowAmount
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                let amountSoldMax = depositedAmountBeforeRepayAtomic;
                let amountReceive = ethers.utils.parseUnits("5", usdcDecimals);
                buyCalldata = await createBuyCallData(
                    projectToken,
                    amountSoldMax,
                    amountReceive,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, actualLendingToken)]
                );
                expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
                expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

                let tx = await plpAtomicRepayInstance.connect(signers[i]).repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully
                );
                const rc = await tx.wait();
                const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

                let projectTokenEmitFromEvent = event.collateral;
                let lendingTokenEmitFromEvent = event.lendingAsset;
                let amountSoldEmitFromEvent = event.amountSold;
                let amountReceiveEmitFromEvent = event.amountReceive;

                let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                expect(projectTokenEmitFromEvent).to.eq(projectToken);
                expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
                expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
                expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
                expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
            }
        });
        it("21. Success (Single-user): Should repay 5 USDC when isRepayFully == TRUE, isLeveragePosition == FALSE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        borrowAmount
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let expectAfterLendingBalanceOfAtomicRepayContract = ethers.utils.parseUnits("1", usdcDecimals);
            let amountSoldMax = depositedAmountBeforeRepayAtomic;
            let amountReceive = ethers.utils.parseUnits("5", usdcDecimals).add(expectAfterLendingBalanceOfAtomicRepayContract);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            );
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

            let projectTokenEmitFromEvent = event.collateral;
            let lendingTokenEmitFromEvent = event.lendingAsset;
            let amountSoldEmitFromEvent = event.amountSold;
            let amountReceiveEmitFromEvent = event.amountReceive;

            let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(projectTokenEmitFromEvent).to.eq(projectToken);
            expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
            expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent.sub(expectAfterLendingBalanceOfAtomicRepayContract)));
            expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic.add(expectAfterLendingBalanceOfAtomicRepayContract));
            expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
        });
        it("21. Success (Multi-user): Should repay 5 USDC when isRepayFully == TRUE, isLeveragePosition == FALSE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = true;
            {
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    let supplyAmount = borrowAmount.mul(signers.length);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);

                    for (let i = 0; i < signers.length; i++) {
                        let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                        await plpInstance.connect(signers[i]).borrow(
                            projectToken,
                            usdcAddress,
                            borrowAmount
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                let expectAfterLendingBalanceOfAtomicRepayContract = ethers.utils.parseUnits("1", usdcDecimals);
                let amountSoldMax = depositedAmountBeforeRepayAtomic;
                let amountReceive = ethers.utils.parseUnits("5", usdcDecimals).add(expectAfterLendingBalanceOfAtomicRepayContract);
                buyCalldata = await createBuyCallData(
                    projectToken,
                    amountSoldMax,
                    amountReceive,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, actualLendingToken)]
                );
                expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
                expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

                let tx = await plpAtomicRepayInstance.connect(signers[i]).repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully
                );
                const rc = await tx.wait();
                const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

                let projectTokenEmitFromEvent = event.collateral;
                let lendingTokenEmitFromEvent = event.lendingAsset;
                let amountSoldEmitFromEvent = event.amountSold;
                let amountReceiveEmitFromEvent = event.amountReceive;

                let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                expect(projectTokenEmitFromEvent).to.eq(projectToken);
                expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
                expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent.sub(expectAfterLendingBalanceOfAtomicRepayContract)));
                expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
                expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic.add(expectAfterLendingBalanceOfAtomicRepayContract));
                expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
            }
        });
        it("22. Success (Single-user): Should repay 5 USDC when isRepayFully == TRUE, isLeveragePosition == FALSE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("1000", prj1Decimals);
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = collateralAmount;
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        borrowAmount
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let expectAfterLendingBalanceOfAtomicRepayContract = ethers.utils.parseUnits("1", usdcDecimals);
            let amountSoldMax = depositedAmountBeforeRepayAtomic;
            let amountReceive = ethers.utils.parseUnits("5", usdcDecimals).add(expectAfterLendingBalanceOfAtomicRepayContract);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            );
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

            let projectTokenEmitFromEvent = event.collateral;
            let lendingTokenEmitFromEvent = event.lendingAsset;
            let amountSoldEmitFromEvent = event.amountSold;
            let amountReceiveEmitFromEvent = event.amountReceive;

            let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(projectTokenEmitFromEvent).to.eq(projectToken);
            expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
            expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent.sub(expectAfterLendingBalanceOfAtomicRepayContract)));
            expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic.add(expectAfterLendingBalanceOfAtomicRepayContract));
            expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
        });
        it("22. Success (Multi-user): Should repay 5 USDC when isRepayFully == TRUE, isLeveragePosition == FALSE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("1000", prj1Decimals);
            let buyCalldata;
            let isRepayFully = true;
            {
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    let supplyAmount = borrowAmount.mul(signers.length);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);

                    for (let i = 0; i < signers.length; i++) {
                        let depositAmount = collateralAmount;
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                        await plpInstance.connect(signers[i]).borrow(
                            projectToken,
                            usdcAddress,
                            borrowAmount
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                let expectAfterLendingBalanceOfAtomicRepayContract = ethers.utils.parseUnits("1", usdcDecimals);
                let amountSoldMax = depositedAmountBeforeRepayAtomic;
                let amountReceive = ethers.utils.parseUnits("5", usdcDecimals).add(expectAfterLendingBalanceOfAtomicRepayContract);
                buyCalldata = await createBuyCallData(
                    projectToken,
                    amountSoldMax,
                    amountReceive,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, actualLendingToken)]
                );
                expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
                expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

                let tx = await plpAtomicRepayInstance.connect(signers[i]).repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully
                );
                const rc = await tx.wait();
                const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

                let projectTokenEmitFromEvent = event.collateral;
                let lendingTokenEmitFromEvent = event.lendingAsset;
                let amountSoldEmitFromEvent = event.amountSold;
                let amountReceiveEmitFromEvent = event.amountReceive;

                let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                expect(projectTokenEmitFromEvent).to.eq(projectToken);
                expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
                expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent.sub(expectAfterLendingBalanceOfAtomicRepayContract)));
                expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
                expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic.add(expectAfterLendingBalanceOfAtomicRepayContract));
                expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
            }
        });
        it("23. Success (Single-user): Should repay 5 USDC when isRepayFully == TRUE, isLeveragePosition == TRUE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    await prj1.mintTo(deployMaster.address, addingAmount);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowAmount,
                        0,
                        ethers.constants.AddressZero,
                        [await factory.getPair(projectToken, lendingToken)]
                    );
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let amountSoldMax = depositedAmountBeforeRepayAtomic;
            let amountReceive = ethers.utils.parseUnits("5", usdcDecimals);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            );
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

            let projectTokenEmitFromEvent = event.collateral;
            let lendingTokenEmitFromEvent = event.lendingAsset;
            let amountSoldEmitFromEvent = event.amountSold;
            let amountReceiveEmitFromEvent = event.amountReceive;

            let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(projectTokenEmitFromEvent).to.eq(projectToken);
            expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
            expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
            expect(isLeveragePositionAfterRepayAtomic).to.eq(false);
        });
        it("23. Success (Multi-user): Should repay 5 USDC when isRepayFully == TRUE, isLeveragePosition == TRUE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = true;
            {
                let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                await usdc.mint(deployMaster.address, supplyAmount);
                let lendingToken = usdc.address;
                let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                await plpInstance.supply(lendingToken, supplyAmount);

                for (let i = 0; i < signers.length; i++) {
                    let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                    await prj1.mintTo(signers[i].address, depositAmount);
                    await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                    await plpInstance.connect(signers[i]).deposit(
                        projectToken,
                        depositAmount
                    );


                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                    await prj1.mintTo(signers[i].address, addingAmount);
                    await prj1.connect(signers[i]).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowAmount,
                        0,
                        ethers.constants.AddressZero,
                        [await factory.getPair(projectToken, lendingToken)]
                    );
                    await plpLeverageInstance.connect(signers[i]).leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0
                    );
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                let amountSoldMax = depositedAmountBeforeRepayAtomic;
                let amountReceive = ethers.utils.parseUnits("5", usdcDecimals);
                buyCalldata = await createBuyCallData(
                    projectToken,
                    amountSoldMax,
                    amountReceive,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, actualLendingToken)]
                );
                expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
                expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

                let tx = await plpAtomicRepayInstance.connect(signers[i]).repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully
                );
                const rc = await tx.wait();
                const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

                let projectTokenEmitFromEvent = event.collateral;
                let lendingTokenEmitFromEvent = event.lendingAsset;
                let amountSoldEmitFromEvent = event.amountSold;
                let amountReceiveEmitFromEvent = event.amountReceive;

                let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                expect(projectTokenEmitFromEvent).to.eq(projectToken);
                expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
                expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
                expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
                expect(isLeveragePositionAfterRepayAtomic).to.eq(false);
            }
        });
        it("24. Success (Single-user): Should repay 5 USDC when isRepayFully == TRUE, isLeveragePosition == TRUE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = collateralAmount;
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    await prj1.mintTo(deployMaster.address, addingAmount);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowAmount,
                        0,
                        ethers.constants.AddressZero,
                        [await factory.getPair(projectToken, lendingToken)]
                    );
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let amountSoldMax = depositedAmountBeforeRepayAtomic;
            let amountReceive = ethers.utils.parseUnits("5", usdcDecimals);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            );
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

            let projectTokenEmitFromEvent = event.collateral;
            let lendingTokenEmitFromEvent = event.lendingAsset;
            let amountSoldEmitFromEvent = event.amountSold;
            let amountReceiveEmitFromEvent = event.amountReceive;

            let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(projectTokenEmitFromEvent).to.eq(projectToken);
            expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
            expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
            expect(isLeveragePositionAfterRepayAtomic).to.eq(false);
        });
        it("24. Success (Multi-user): Should repay 5 USDC when isRepayFully == TRUE, isLeveragePosition == TRUE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = true;
            {
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    let supplyAmount = borrowAmount.mul(signers.length);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);

                    for (let i = 0; i < signers.length; i++) {
                        let depositAmount = collateralAmount;
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );


                        let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                        exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                        margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                        let addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                        await prj1.mintTo(signers[i].address, addingAmount);
                        await prj1.connect(signers[i]).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                        await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowAmount);
                        let buyCalldata = await createSellCallData(
                            lendingToken,
                            borrowAmount,
                            0,
                            ethers.constants.AddressZero,
                            [await factory.getPair(projectToken, lendingToken)]
                        );
                        await plpLeverageInstance.connect(signers[i]).leveragedBorrow(
                            projectToken,
                            lendingToken,
                            exp,
                            margin,
                            buyCalldata,
                            0
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                let amountSoldMax = depositedAmountBeforeRepayAtomic;
                let amountReceive = ethers.utils.parseUnits("5", usdcDecimals);
                buyCalldata = await createBuyCallData(
                    projectToken,
                    amountSoldMax,
                    amountReceive,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, actualLendingToken)]
                );
                expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
                expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

                let tx = await plpAtomicRepayInstance.connect(signers[i]).repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully
                );
                const rc = await tx.wait();
                const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

                let projectTokenEmitFromEvent = event.collateral;
                let lendingTokenEmitFromEvent = event.lendingAsset;
                let amountSoldEmitFromEvent = event.amountSold;
                let amountReceiveEmitFromEvent = event.amountReceive;

                let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                expect(projectTokenEmitFromEvent).to.eq(projectToken);
                expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
                expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
                expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
                expect(isLeveragePositionAfterRepayAtomic).to.eq(false);
            }
        });
        it("25. Success (Single-user): Should repay 5 USDC when isRepayFully == TRUE, isLeveragePosition == TRUE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    await prj1.mintTo(deployMaster.address, addingAmount);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowAmount,
                        0,
                        ethers.constants.AddressZero,
                        [await factory.getPair(projectToken, lendingToken)]
                    );
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let expectAfterLendingBalanceOfAtomicRepayContract = ethers.utils.parseUnits("1", usdcDecimals);
            let amountSoldMax = depositedAmountBeforeRepayAtomic;
            let amountReceive = ethers.utils.parseUnits("5", usdcDecimals).add(expectAfterLendingBalanceOfAtomicRepayContract);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            );
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

            let projectTokenEmitFromEvent = event.collateral;
            let lendingTokenEmitFromEvent = event.lendingAsset;
            let amountSoldEmitFromEvent = event.amountSold;
            let amountReceiveEmitFromEvent = event.amountReceive;

            let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(projectTokenEmitFromEvent).to.eq(projectToken);
            expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
            expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent.sub(expectAfterLendingBalanceOfAtomicRepayContract)));
            expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic.add(expectAfterLendingBalanceOfAtomicRepayContract));
            expect(isLeveragePositionAfterRepayAtomic).to.eq(false);
        });
        it("25. Success (Multi-user): Should repay 5 USDC when isRepayFully == TRUE, isLeveragePosition == TRUE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = true;
            {
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    let supplyAmount = borrowAmount.mul(signers.length);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);

                    for (let i = 0; i < signers.length; i++) {
                        let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                        exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                        margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                        let addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                        await prj1.mintTo(signers[i].address, addingAmount);
                        await prj1.connect(signers[i]).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                        await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowAmount);
                        let buyCalldata = await createSellCallData(
                            lendingToken,
                            borrowAmount,
                            0,
                            ethers.constants.AddressZero,
                            [await factory.getPair(projectToken, lendingToken)]
                        );
                        await plpLeverageInstance.connect(signers[i]).leveragedBorrow(
                            projectToken,
                            lendingToken,
                            exp,
                            margin,
                            buyCalldata,
                            0
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                let expectAfterLendingBalanceOfAtomicRepayContract = ethers.utils.parseUnits("1", usdcDecimals);
                let amountSoldMax = depositedAmountBeforeRepayAtomic;
                let amountReceive = ethers.utils.parseUnits("5", usdcDecimals).add(expectAfterLendingBalanceOfAtomicRepayContract);
                buyCalldata = await createBuyCallData(
                    projectToken,
                    amountSoldMax,
                    amountReceive,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, actualLendingToken)]
                );
                expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
                expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

                let tx = await plpAtomicRepayInstance.connect(signers[i]).repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully
                );
                const rc = await tx.wait();
                const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

                let projectTokenEmitFromEvent = event.collateral;
                let lendingTokenEmitFromEvent = event.lendingAsset;
                let amountSoldEmitFromEvent = event.amountSold;
                let amountReceiveEmitFromEvent = event.amountReceive;

                let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                expect(projectTokenEmitFromEvent).to.eq(projectToken);
                expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
                expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent.sub(expectAfterLendingBalanceOfAtomicRepayContract)));
                expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
                expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic.add(expectAfterLendingBalanceOfAtomicRepayContract));
                expect(isLeveragePositionAfterRepayAtomic).to.eq(false);
            }
        });
        it("26. Success (Single-user): Should repay 5 USDC when isRepayFully == TRUE, isLeveragePosition == TRUE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = collateralAmount;
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    await prj1.mintTo(deployMaster.address, addingAmount);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowAmount,
                        0,
                        ethers.constants.AddressZero,
                        [await factory.getPair(projectToken, lendingToken)]
                    );
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let expectAfterLendingBalanceOfAtomicRepayContract = ethers.utils.parseUnits("1", usdcDecimals);
            let amountSoldMax = depositedAmountBeforeRepayAtomic;
            let amountReceive = ethers.utils.parseUnits("5", usdcDecimals).add(expectAfterLendingBalanceOfAtomicRepayContract);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            );
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

            let projectTokenEmitFromEvent = event.collateral;
            let lendingTokenEmitFromEvent = event.lendingAsset;
            let amountSoldEmitFromEvent = event.amountSold;
            let amountReceiveEmitFromEvent = event.amountReceive;

            let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(projectTokenEmitFromEvent).to.eq(projectToken);
            expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
            expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent.sub(expectAfterLendingBalanceOfAtomicRepayContract)));
            expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic.add(expectAfterLendingBalanceOfAtomicRepayContract));
            expect(isLeveragePositionAfterRepayAtomic).to.eq(false);
        });
        it("26. Success (Multi-user): Should repay 5 USDC when isRepayFully == TRUE, isLeveragePosition == TRUE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = true;
            {
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    let supplyAmount = borrowAmount.mul(signers.length);
                    let lendingToken = usdc.address;
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);

                    for (let i = 0; i < signers.length; i++) {
                        let depositAmount = collateralAmount;
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                        let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                        exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                        margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                        let addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                        await prj1.mintTo(signers[i].address, addingAmount);
                        await prj1.connect(signers[i]).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                        await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowAmount);
                        let buyCalldata = await createSellCallData(
                            lendingToken,
                            borrowAmount,
                            0,
                            ethers.constants.AddressZero,
                            [await factory.getPair(projectToken, lendingToken)]
                        );
                        await plpLeverageInstance.connect(signers[i]).leveragedBorrow(
                            projectToken,
                            lendingToken,
                            exp,
                            margin,
                            buyCalldata,
                            0
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                let expectAfterLendingBalanceOfAtomicRepayContract = ethers.utils.parseUnits("1", usdcDecimals);
                let amountSoldMax = depositedAmountBeforeRepayAtomic;
                let amountReceive = ethers.utils.parseUnits("5", usdcDecimals).add(expectAfterLendingBalanceOfAtomicRepayContract);
                buyCalldata = await createBuyCallData(
                    projectToken,
                    amountSoldMax,
                    amountReceive,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, actualLendingToken)]
                );
                expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
                expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

                let tx = await plpAtomicRepayInstance.connect(signers[i]).repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully
                );
                const rc = await tx.wait();
                const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

                let projectTokenEmitFromEvent = event.collateral;
                let lendingTokenEmitFromEvent = event.lendingAsset;
                let amountSoldEmitFromEvent = event.amountSold;
                let amountReceiveEmitFromEvent = event.amountReceive;

                let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                expect(projectTokenEmitFromEvent).to.eq(projectToken);
                expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
                expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent.sub(expectAfterLendingBalanceOfAtomicRepayContract)));
                expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
                expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic.add(expectAfterLendingBalanceOfAtomicRepayContract));
                expect(isLeveragePositionAfterRepayAtomic).to.eq(false);
            }
        });
        it("27. Success (Single-user): Should repay 5 USDC when isRepayFully == FALSE, isLeveragePosition == FALSE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        borrowAmount
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let amountSoldMax = depositedAmountBeforeRepayAtomic;
            let amountReceive = ethers.utils.parseUnits("5", usdcDecimals);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            );
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

            let projectTokenEmitFromEvent = event.collateral;
            let lendingTokenEmitFromEvent = event.lendingAsset;
            let amountSoldEmitFromEvent = event.amountSold;
            let amountReceiveEmitFromEvent = event.amountReceive;

            let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(projectTokenEmitFromEvent).to.eq(projectToken);
            expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
            expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
            expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
        });
        it("27. Success (Multi-user): Should repay 5 USDC when isRepayFully == FALSE, isLeveragePosition == FALSE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            {
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    let supplyAmount = borrowAmount.mul(signers.length);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);

                    for (let i = 0; i < signers.length; i++) {
                        let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                        await plpInstance.connect(signers[i]).borrow(
                            projectToken,
                            usdcAddress,
                            borrowAmount
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                let amountSoldMax = depositedAmountBeforeRepayAtomic;
                let amountReceive = ethers.utils.parseUnits("5", usdcDecimals);
                buyCalldata = await createBuyCallData(
                    projectToken,
                    amountSoldMax,
                    amountReceive,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, actualLendingToken)]
                );
                expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
                expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

                let tx = await plpAtomicRepayInstance.connect(signers[i]).repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully
                );
                const rc = await tx.wait();
                const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

                let projectTokenEmitFromEvent = event.collateral;
                let lendingTokenEmitFromEvent = event.lendingAsset;
                let amountSoldEmitFromEvent = event.amountSold;
                let amountReceiveEmitFromEvent = event.amountReceive;

                let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                expect(projectTokenEmitFromEvent).to.eq(projectToken);
                expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
                expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
                expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
                expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
            }
        });
        it("28. Success (Single-user): Should repay 5 USDC when isRepayFully == FALSE, isLeveragePosition == FALSE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = collateralAmount;
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        borrowAmount
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let amountSoldMax = depositedAmountBeforeRepayAtomic;
            let amountReceive = ethers.utils.parseUnits("5", usdcDecimals);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            );
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

            let projectTokenEmitFromEvent = event.collateral;
            let lendingTokenEmitFromEvent = event.lendingAsset;
            let amountSoldEmitFromEvent = event.amountSold;
            let amountReceiveEmitFromEvent = event.amountReceive;

            let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(projectTokenEmitFromEvent).to.eq(projectToken);
            expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
            expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
            expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
        });
        it("28. Success (Multi-user): Should repay 5 USDC when isRepayFully == FALSE, isLeveragePosition == FALSE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = false;
            {
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    let supplyAmount = borrowAmount.mul(signers.length);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);

                    for (let i = 0; i < signers.length; i++) {
                        let depositAmount = collateralAmount;
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                        await plpInstance.connect(signers[i]).borrow(
                            projectToken,
                            usdcAddress,
                            borrowAmount
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                let amountSoldMax = depositedAmountBeforeRepayAtomic;
                let amountReceive = ethers.utils.parseUnits("5", usdcDecimals);
                buyCalldata = await createBuyCallData(
                    projectToken,
                    amountSoldMax,
                    amountReceive,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, actualLendingToken)]
                );
                expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
                expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

                let tx = await plpAtomicRepayInstance.connect(signers[i]).repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully
                );
                const rc = await tx.wait();
                const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

                let projectTokenEmitFromEvent = event.collateral;
                let lendingTokenEmitFromEvent = event.lendingAsset;
                let amountSoldEmitFromEvent = event.amountSold;
                let amountReceiveEmitFromEvent = event.amountReceive;

                let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                expect(projectTokenEmitFromEvent).to.eq(projectToken);
                expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
                expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
                expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
                expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
            }
        });
        it("29. Success (Single-user): Should repay 5 USDC when isRepayFully == FALSE, isLeveragePosition == FALSE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        borrowAmount
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let expectAfterLendingBalanceOfAtomicRepayContract = ethers.utils.parseUnits("1", usdcDecimals);
            let amountSoldMax = depositedAmountBeforeRepayAtomic;
            let amountReceive = ethers.utils.parseUnits("5", usdcDecimals).add(expectAfterLendingBalanceOfAtomicRepayContract);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            );
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

            let projectTokenEmitFromEvent = event.collateral;
            let lendingTokenEmitFromEvent = event.lendingAsset;
            let amountSoldEmitFromEvent = event.amountSold;
            let amountReceiveEmitFromEvent = event.amountReceive;

            let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(projectTokenEmitFromEvent).to.eq(projectToken);
            expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
            expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent.sub(expectAfterLendingBalanceOfAtomicRepayContract)));
            expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic.add(expectAfterLendingBalanceOfAtomicRepayContract));
            expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
        });
        it("29. Success (Multi-user): Should repay 5 USDC when isRepayFully == FALSE, isLeveragePosition == FALSE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            {
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    let supplyAmount = borrowAmount.mul(signers.length);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);

                    for (let i = 0; i < signers.length; i++) {
                        let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                        await plpInstance.connect(signers[i]).borrow(
                            projectToken,
                            usdcAddress,
                            borrowAmount
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                let expectAfterLendingBalanceOfAtomicRepayContract = ethers.utils.parseUnits("1", usdcDecimals);
                let amountSoldMax = depositedAmountBeforeRepayAtomic;
                let amountReceive = ethers.utils.parseUnits("5", usdcDecimals).add(expectAfterLendingBalanceOfAtomicRepayContract);
                buyCalldata = await createBuyCallData(
                    projectToken,
                    amountSoldMax,
                    amountReceive,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, actualLendingToken)]
                );
                expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
                expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

                let tx = await plpAtomicRepayInstance.connect(signers[i]).repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully
                );
                const rc = await tx.wait();
                const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

                let projectTokenEmitFromEvent = event.collateral;
                let lendingTokenEmitFromEvent = event.lendingAsset;
                let amountSoldEmitFromEvent = event.amountSold;
                let amountReceiveEmitFromEvent = event.amountReceive;

                let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                expect(projectTokenEmitFromEvent).to.eq(projectToken);
                expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
                expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent.sub(expectAfterLendingBalanceOfAtomicRepayContract)));
                expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
                expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic.add(expectAfterLendingBalanceOfAtomicRepayContract));
                expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
            }
        });
        it("30. Success (Single-user): Should repay 5 USDC when isRepayFully == FALSE, isLeveragePosition == FALSE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("1000", prj1Decimals);
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = collateralAmount;
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        borrowAmount
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let expectAfterLendingBalanceOfAtomicRepayContract = ethers.utils.parseUnits("1", usdcDecimals);
            let amountSoldMax = depositedAmountBeforeRepayAtomic;
            let amountReceive = ethers.utils.parseUnits("5", usdcDecimals).add(expectAfterLendingBalanceOfAtomicRepayContract);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            );
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

            let projectTokenEmitFromEvent = event.collateral;
            let lendingTokenEmitFromEvent = event.lendingAsset;
            let amountSoldEmitFromEvent = event.amountSold;
            let amountReceiveEmitFromEvent = event.amountReceive;

            let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(projectTokenEmitFromEvent).to.eq(projectToken);
            expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
            expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent.sub(expectAfterLendingBalanceOfAtomicRepayContract)));
            expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic.add(expectAfterLendingBalanceOfAtomicRepayContract));
            expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
        });
        it("30. Success (Multi-user): Should repay 5 USDC when isRepayFully == FALSE, isLeveragePosition == FALSE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("1000", prj1Decimals);
            let buyCalldata;
            let isRepayFully = false;
            {
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    let supplyAmount = borrowAmount.mul(signers.length);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);

                    for (let i = 0; i < signers.length; i++) {
                        let depositAmount = collateralAmount;
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                        await plpInstance.connect(signers[i]).borrow(
                            projectToken,
                            usdcAddress,
                            borrowAmount
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                let expectAfterLendingBalanceOfAtomicRepayContract = ethers.utils.parseUnits("1", usdcDecimals);
                let amountSoldMax = depositedAmountBeforeRepayAtomic;
                let amountReceive = ethers.utils.parseUnits("5", usdcDecimals).add(expectAfterLendingBalanceOfAtomicRepayContract);
                buyCalldata = await createBuyCallData(
                    projectToken,
                    amountSoldMax,
                    amountReceive,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, actualLendingToken)]
                );
                expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
                expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

                let tx = await plpAtomicRepayInstance.connect(signers[i]).repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully
                );
                const rc = await tx.wait();
                const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

                let projectTokenEmitFromEvent = event.collateral;
                let lendingTokenEmitFromEvent = event.lendingAsset;
                let amountSoldEmitFromEvent = event.amountSold;
                let amountReceiveEmitFromEvent = event.amountReceive;

                let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                expect(projectTokenEmitFromEvent).to.eq(projectToken);
                expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
                expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent.sub(expectAfterLendingBalanceOfAtomicRepayContract)));
                expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
                expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic.add(expectAfterLendingBalanceOfAtomicRepayContract));
                expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
            }
        });
        it("31. Success (Single-user): Should repay 5 USDC when isRepayFully == FALSE, isLeveragePosition == TRUE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);

                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    await prj1.mintTo(deployMaster.address, addingAmount);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowAmount,
                        0,
                        ethers.constants.AddressZero,
                        [await factory.getPair(projectToken, lendingToken)]
                    );
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let amountSoldMax = depositedAmountBeforeRepayAtomic;
            let amountReceive = ethers.utils.parseUnits("5", usdcDecimals);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            );
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

            let projectTokenEmitFromEvent = event.collateral;
            let lendingTokenEmitFromEvent = event.lendingAsset;
            let amountSoldEmitFromEvent = event.amountSold;
            let amountReceiveEmitFromEvent = event.amountReceive;

            let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(projectTokenEmitFromEvent).to.eq(projectToken);
            expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
            expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
            expect(isLeveragePositionAfterRepayAtomic).to.eq(false);
        });
        it("31. Success (Multi-user): Should repay 5 USDC when isRepayFully == FALSE, isLeveragePosition == TRUE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            {
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    let supplyAmount = borrowAmount.mul(signers.length);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);

                    for (let i = 0; i < signers.length; i++) {
                        let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                        exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                        margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                        let addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                        await prj1.mintTo(signers[i].address, addingAmount);
                        await prj1.connect(signers[i]).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                        await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowAmount);
                        let buyCalldata = await createSellCallData(
                            lendingToken,
                            borrowAmount,
                            0,
                            ethers.constants.AddressZero,
                            [await factory.getPair(projectToken, lendingToken)]
                        );
                        await plpLeverageInstance.connect(signers[i]).leveragedBorrow(
                            projectToken,
                            lendingToken,
                            exp,
                            margin,
                            buyCalldata,
                            0
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                let amountSoldMax = depositedAmountBeforeRepayAtomic;
                let amountReceive = ethers.utils.parseUnits("5", usdcDecimals);
                buyCalldata = await createBuyCallData(
                    projectToken,
                    amountSoldMax,
                    amountReceive,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, actualLendingToken)]
                );
                expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
                expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

                let tx = await plpAtomicRepayInstance.connect(signers[i]).repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully
                );
                const rc = await tx.wait();
                const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

                let projectTokenEmitFromEvent = event.collateral;
                let lendingTokenEmitFromEvent = event.lendingAsset;
                let amountSoldEmitFromEvent = event.amountSold;
                let amountReceiveEmitFromEvent = event.amountReceive;

                let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                expect(projectTokenEmitFromEvent).to.eq(projectToken);
                expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
                expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
                expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
                expect(isLeveragePositionAfterRepayAtomic).to.eq(false);
            }
        });
        it("32. Success (Single-user): Should repay 5 USDC when isRepayFully == FALSE, isLeveragePosition == TRUE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = collateralAmount;
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);

                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    await prj1.mintTo(deployMaster.address, addingAmount);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowAmount,
                        0,
                        ethers.constants.AddressZero,
                        [await factory.getPair(projectToken, lendingToken)]
                    );
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let amountSoldMax = depositedAmountBeforeRepayAtomic;
            let amountReceive = ethers.utils.parseUnits("5", usdcDecimals);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            );
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

            let projectTokenEmitFromEvent = event.collateral;
            let lendingTokenEmitFromEvent = event.lendingAsset;
            let amountSoldEmitFromEvent = event.amountSold;
            let amountReceiveEmitFromEvent = event.amountReceive;

            let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(projectTokenEmitFromEvent).to.eq(projectToken);
            expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
            expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
            expect(isLeveragePositionAfterRepayAtomic).to.eq(false);
        });
        it("32. Success (Multi-user): Should repay 5 USDC when isRepayFully == FALSE, isLeveragePosition == TRUE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = false;
            {
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    let supplyAmount = borrowAmount.mul(signers.length);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);

                    for (let i = 0; i < signers.length; i++) {
                        let depositAmount = collateralAmount;
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );

                        exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                        margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                        let addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                        await prj1.mintTo(signers[i].address, addingAmount);
                        await prj1.connect(signers[i]).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                        await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowAmount);
                        let buyCalldata = await createSellCallData(
                            lendingToken,
                            borrowAmount,
                            0,
                            ethers.constants.AddressZero,
                            [await factory.getPair(projectToken, lendingToken)]
                        );
                        await plpLeverageInstance.connect(signers[i]).leveragedBorrow(
                            projectToken,
                            lendingToken,
                            exp,
                            margin,
                            buyCalldata,
                            0
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                let amountSoldMax = depositedAmountBeforeRepayAtomic;
                let amountReceive = ethers.utils.parseUnits("5", usdcDecimals);
                buyCalldata = await createBuyCallData(
                    projectToken,
                    amountSoldMax,
                    amountReceive,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, actualLendingToken)]
                );
                expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
                expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

                let tx = await plpAtomicRepayInstance.connect(signers[i]).repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully
                );
                const rc = await tx.wait();
                const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

                let projectTokenEmitFromEvent = event.collateral;
                let lendingTokenEmitFromEvent = event.lendingAsset;
                let amountSoldEmitFromEvent = event.amountSold;
                let amountReceiveEmitFromEvent = event.amountReceive;

                let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                expect(projectTokenEmitFromEvent).to.eq(projectToken);
                expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
                expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
                expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
                expect(isLeveragePositionAfterRepayAtomic).to.eq(false);
            }
        });
        it("33. Success (Single-user): Should repay 5 USDC when isRepayFully == FALSE, isLeveragePosition == TRUE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);

                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    await prj1.mintTo(deployMaster.address, addingAmount);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowAmount,
                        0,
                        ethers.constants.AddressZero,
                        [await factory.getPair(projectToken, lendingToken)]
                    );
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let expectAfterLendingBalanceOfAtomicRepayContract = ethers.utils.parseUnits("1", usdcDecimals);
            let amountSoldMax = depositedAmountBeforeRepayAtomic;
            let amountReceive = ethers.utils.parseUnits("5", usdcDecimals).add(expectAfterLendingBalanceOfAtomicRepayContract);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            );
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

            let projectTokenEmitFromEvent = event.collateral;
            let lendingTokenEmitFromEvent = event.lendingAsset;
            let amountSoldEmitFromEvent = event.amountSold;
            let amountReceiveEmitFromEvent = event.amountReceive;

            let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(projectTokenEmitFromEvent).to.eq(projectToken);
            expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
            expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent.sub(expectAfterLendingBalanceOfAtomicRepayContract)));
            expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic.add(expectAfterLendingBalanceOfAtomicRepayContract));
            expect(isLeveragePositionAfterRepayAtomic).to.eq(false);
        });
        it("33. Success (Multi-user): Should repay 5 USDC when isRepayFully == FALSE, isLeveragePosition == TRUE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            {
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    let supplyAmount = borrowAmount.mul(signers.length);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);

                    for (let i = 0; i < signers.length; i++) {
                        let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );

                        exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                        margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                        let addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                        await prj1.mintTo(signers[i].address, addingAmount);
                        await prj1.connect(signers[i]).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                        await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowAmount);
                        let buyCalldata = await createSellCallData(
                            lendingToken,
                            borrowAmount,
                            0,
                            ethers.constants.AddressZero,
                            [await factory.getPair(projectToken, lendingToken)]
                        );
                        await plpLeverageInstance.connect(signers[i]).leveragedBorrow(
                            projectToken,
                            lendingToken,
                            exp,
                            margin,
                            buyCalldata,
                            0
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                let expectAfterLendingBalanceOfAtomicRepayContract = ethers.utils.parseUnits("1", usdcDecimals);
                let amountSoldMax = depositedAmountBeforeRepayAtomic;
                let amountReceive = ethers.utils.parseUnits("5", usdcDecimals).add(expectAfterLendingBalanceOfAtomicRepayContract);
                buyCalldata = await createBuyCallData(
                    projectToken,
                    amountSoldMax,
                    amountReceive,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, actualLendingToken)]
                );
                expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
                expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

                let tx = await plpAtomicRepayInstance.connect(signers[i]).repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully
                );
                const rc = await tx.wait();
                const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

                let projectTokenEmitFromEvent = event.collateral;
                let lendingTokenEmitFromEvent = event.lendingAsset;
                let amountSoldEmitFromEvent = event.amountSold;
                let amountReceiveEmitFromEvent = event.amountReceive;

                let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                expect(projectTokenEmitFromEvent).to.eq(projectToken);
                expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
                expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent.sub(expectAfterLendingBalanceOfAtomicRepayContract)));
                expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
                expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic.add(expectAfterLendingBalanceOfAtomicRepayContract));
                expect(isLeveragePositionAfterRepayAtomic).to.eq(false);
            }
        });
        it("34. Success (Single-user): Should repay 5 USDC when isRepayFully == FALSE, isLeveragePosition == TRUE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = collateralAmount;
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);

                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    await prj1.mintTo(deployMaster.address, addingAmount);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowAmount,
                        0,
                        ethers.constants.AddressZero,
                        [await factory.getPair(projectToken, lendingToken)]
                    );
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let expectAfterLendingBalanceOfAtomicRepayContract = ethers.utils.parseUnits("1", usdcDecimals);
            let amountSoldMax = depositedAmountBeforeRepayAtomic;
            let amountReceive = ethers.utils.parseUnits("5", usdcDecimals).add(expectAfterLendingBalanceOfAtomicRepayContract);
            buyCalldata = await createBuyCallData(
                projectToken,
                amountSoldMax,
                amountReceive,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, actualLendingToken)]
            );
            expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully
            );
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

            let projectTokenEmitFromEvent = event.collateral;
            let lendingTokenEmitFromEvent = event.lendingAsset;
            let amountSoldEmitFromEvent = event.amountSold;
            let amountReceiveEmitFromEvent = event.amountReceive;

            let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(projectTokenEmitFromEvent).to.eq(projectToken);
            expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
            expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
            expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent.sub(expectAfterLendingBalanceOfAtomicRepayContract)));
            expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic.add(expectAfterLendingBalanceOfAtomicRepayContract));
            expect(isLeveragePositionAfterRepayAtomic).to.eq(false);
        });
        it("34. Success (Multi-user): Should repay 5 USDC when isRepayFully == FALSE, isLeveragePosition == TRUE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = false;
            {
                {
                    let borrowAmount = ethers.utils.parseUnits("5", usdcDecimals);
                    let supplyAmount = borrowAmount.mul(signers.length);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);

                    for (let i = 0; i < signers.length; i++) {
                        let depositAmount = collateralAmount;
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );

                        exp = await plpInstance.getTokenEvaluation(lendingToken, borrowAmount);
                        margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                        let addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                        await prj1.mintTo(signers[i].address, addingAmount);
                        await prj1.connect(signers[i]).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                        await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowAmount);
                        let buyCalldata = await createSellCallData(
                            lendingToken,
                            borrowAmount,
                            0,
                            ethers.constants.AddressZero,
                            [await factory.getPair(projectToken, lendingToken)]
                        );
                        await plpLeverageInstance.connect(signers[i]).leveragedBorrow(
                            projectToken,
                            lendingToken,
                            exp,
                            margin,
                            buyCalldata,
                            0
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                let expectAfterLendingBalanceOfAtomicRepayContract = ethers.utils.parseUnits("1", usdcDecimals);
                let amountSoldMax = depositedAmountBeforeRepayAtomic;
                let amountReceive = ethers.utils.parseUnits("5", usdcDecimals).add(expectAfterLendingBalanceOfAtomicRepayContract);
                buyCalldata = await createBuyCallData(
                    projectToken,
                    amountSoldMax,
                    amountReceive,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, actualLendingToken)]
                );
                expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
                expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

                let tx = await plpAtomicRepayInstance.connect(signers[i]).repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully
                );
                const rc = await tx.wait();
                const event = rc.events.find(event => event.event === 'AtomicRepayment').args;

                let projectTokenEmitFromEvent = event.collateral;
                let lendingTokenEmitFromEvent = event.lendingAsset;
                let amountSoldEmitFromEvent = event.amountSold;
                let amountReceiveEmitFromEvent = event.amountReceive;

                let depositedAmountAfterRepayAtomic = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
                let totalOutstandingAfterRepayAtomic = await plpInstance.totalOutstanding(signers[i].address, projectToken, actualLendingToken);
                let balanceLendingTokenAfterRepayAtomic = await usdc.balanceOf(signers[i].address);
                let isLeveragePositionAfterRepayAtomic = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);

                expect(projectTokenEmitFromEvent).to.eq(projectToken);
                expect(lendingTokenEmitFromEvent).to.eq(actualLendingToken);
                expect(depositedAmountAfterRepayAtomic).to.eq(depositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalDepositedAmountAfterRepayAtomic).to.eq(totalDepositedAmountBeforeRepayAtomic.sub(amountSoldEmitFromEvent));
                expect(totalOutstandingAfterRepayAtomic).to.eq(totalOutstandingBeforeRepayAtomic.sub(amountReceiveEmitFromEvent.sub(expectAfterLendingBalanceOfAtomicRepayContract)));
                expect(totalOutstandingAfterRepayAtomic).to.eq(toBN(0));
                expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic.add(expectAfterLendingBalanceOfAtomicRepayContract));
                expect(isLeveragePositionAfterRepayAtomic).to.eq(false);
            }
        });
    });
});