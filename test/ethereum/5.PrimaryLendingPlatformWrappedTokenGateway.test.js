require("dotenv").config();
const hre = require("hardhat");
const network = hre.hardhatArguments.network;
let chain = process.env.CHAIN && network == 'hardhat' ? "_" + process.env.CHAIN : "";

const path = require("path");
const configTestingFile = path.join(__dirname, `../../scripts/config/${network}${chain}/config_testing.json`);
const configGeneralFile = path.join(__dirname, `../../scripts/config/${network}${chain}/config_general.json`);
const configTesting = require(configTestingFile);
const configGeneral = require(configGeneralFile);
const { deployment } = require("../../scripts/deployPLP_V2/deploymentPLP");
const { ethers } = require("ethers");
const { expect } = require("chai");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const ParaSwapAdapter_ARTIFACT = require("./artifacts-for-testing/NewUniswapV2Router.json");
const UniSwapV2Pair_ARTIFACT = require("./artifacts-for-testing/UniswapV2Pair.json");
const UniswapV2FACTORY_ARTIFACT = require("./artifacts-for-testing/UniswapV2Factory.json");
const UniswapV2ROUTER_ARTIFACT = require("./artifacts-for-testing/UniswapV2Router.json");

const INFURA_KEY = process.env.INFURA_KEY;
const toBN = (num) => hre.ethers.BigNumber.from(num);

describe("PrimaryLendingPlatformWrappedTokenGateway", function () {
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
    let uniswapV2PriceProviderInstance;
    let uniswapPriceProviderMockInstance;
    let priceProviderAggregatorInstance;

    let factory;
    let factoryAddress = configTesting.uniswapFactory;
    let uniswapV2Router;
    let uniswapV2RouterAddress = configTesting.uniswapV2Router;

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

    let masterAddress;
    let MockToken;

    let bLendingTokenAddress;
    let bLendingTokenInstance;

    let bToken;
    let exchangeRate;

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


    async function loadBtokenInstance(bTokenAddress, deployMaster) {
        let BToken = await hre.ethers.getContractFactory("BLendingToken");
        return BToken.attach(bTokenAddress).connect(deployMaster);
    }

    async function impersonateAccount(account) {
        await helpers.impersonateAccount(account);
        return await hre.ethers.getSigner(account);
    }
    async function createPairPrj1AndWETH() {
        let pairAddress = await factory.getPair(prj1Address, wethAddress);
        if (pairAddress === ethers.constants.AddressZero) {
            await factory.createPair(
                prj1Address,
                wethAddress
            );
            let projectToken1Amount = ethers.utils.parseUnits("1000000", prj1Decimals);
            await prj1.mintTo(deployMaster.address, projectToken1Amount);
            await prj1.connect(deployMaster).approve(uniswapV2RouterAddress, ethers.constants.MaxUint256);
            let ETHAmount = ethers.utils.parseEther("100");
            await uniswapV2Router.addLiquidityETH(
                prj1Address,
                projectToken1Amount,
                projectToken1Amount,
                ETHAmount,
                deployMaster.address,
                ethers.constants.MaxUint256,
                { value: ETHAmount }
            );
        }
        pairAddress = await factory.getPair(prj1Address, wethAddress);
        return new hre.ethers.Contract(
            pairAddress,
            UniSwapV2Pair_ARTIFACT.abi,
            deployMaster
        );
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

    async function resetNetwork() {
        await helpers.reset(
            `https://${process.env.CHAIN.replace("_", "-")}.infura.io/v3/${INFURA_KEY}`,
            Number(process.env.BLOCK_NUMBER)
        );
    }

    async function loadFixture() {
        await resetNetwork();
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
            uniswapV2PriceProviderMockAddress = addresses.uniswapV2PriceProviderMockAddress;
            priceProviderAggregatorAddress = addresses.priceProviderAggregatorAddress;

            prj1Address = ethers.utils.getAddress(addresses.projectTokens[0]);
            prj2Address = ethers.utils.getAddress(addresses.projectTokens[1]);
            prj3Address = ethers.utils.getAddress(addresses.projectTokens[2]);

            wstEthAddress = ethers.utils.getAddress(addresses.projectTokens[projectTokens.length - 1]);

            usdcAddress = ethers.utils.getAddress(addresses.lendingTokens[0]);
            usbAddress = ethers.utils.getAddress(addresses.lendingTokens[1]);
            wethAddress = ethers.utils.getAddress(addresses.lendingTokens[2]);

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
            let UniswapV2PriceProvider = await hre.ethers.getContractFactory("UniswapV2PriceProvider");
            let UniswapPriceProviderMock = await hre.ethers.getContractFactory("UniswapV2PriceProviderMock");
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
            uniswapV2PriceProviderInstance = UniswapV2PriceProvider.attach(uniswapV2PriceProviderAddress).connect(deployMaster);
            uniswapPriceProviderMockInstance = UniswapPriceProviderMock.attach(uniswapV2PriceProviderMockAddress).connect(deployMaster);
            priceProviderAggregatorInstance = PriceProviderAggregator.attach(priceProviderAggregatorAddress).connect(deployMaster);

            factory = new hre.ethers.Contract(
                factoryAddress,
                UniswapV2FACTORY_ARTIFACT.abi,
                deployMaster
            );
            uniswapV2Router = new hre.ethers.Contract(
                uniswapV2RouterAddress,
                UniswapV2ROUTER_ARTIFACT.abi,
                deployMaster
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
        {
            bLendingTokenAddress = (await plpInstance.lendingTokenInfo(wethAddress)).bLendingToken;
            bLendingTokenInstance = MockToken.attach(bLendingTokenAddress).connect(deployMaster);

            bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
            exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));
        }
    }

    describe("deposit", function () {

        before(async function () {
            await loadFixture();
        });

        it("1. Failure: Should throw error when msg.value < 0", async function () {
            let msgValue = toBN(-1);

            expect(plpWTGInstance.deposit(
                {
                    value: msgValue
                }
            )).to.throw;
        });
        it("2. Failure: Should throw error when msg.value > maxUint256", async function () {
            let msgValue = ethers.constants.MaxUint256.add(1);

            expect(plpWTGInstance.deposit(
                {
                    value: msgValue
                }
            )).to.throw;
        });
        it("3. Failure: Should throw error when typeof msg.value is NOT UINT", async function () {
            let msgValue = 1.1;

            expect(plpWTGInstance.deposit(
                {
                    value: msgValue
                }
            )).to.throw;
        });
        it("4. Failure: Should throw error when msg.value < balance ETH of user + transaction fee", async function () {
            let msgValue = (await deployMaster.getBalance());

            expect(plpWTGInstance.deposit(
                {
                    value: msgValue
                }
            )).to.throw;
        });
        it("5. Failure: Should revert when isDepositPaused == TRUE and allowance WETH of WTG contract for PLP contract < msg.value", async function () {
            let projectToken = weth.address;
            let msgValue = toBN(1);

            await plpModeratorInstance.setPausedProjectToken(
                projectToken,
                true,
                false
            );
            let currentAllowance = await weth.allowance(plpWTGAddress, plpAddress);
            expect(currentAllowance).lt(msgValue);
            await expect(plpWTGInstance.deposit(
                {
                    value: msgValue
                }
            )).to.be.revertedWith("PIT: ProjectToken is paused");

            await plpModeratorInstance.setPausedProjectToken(
                projectToken,
                false,
                false
            );
        });
        it("6. Failure: Should revert when isDepositPaused == TRUE and allowance WETH of WTG contract for PLP contract >= msg.value", async function () {
            let projectToken = weth.address;
            let msgValue = toBN(1);

            {
                await plpWTGInstance.deposit({ value: msgValue });
            }
            await plpModeratorInstance.setPausedProjectToken(
                projectToken,
                true,
                false
            );

            let currentAllowance = await weth.allowance(plpWTGAddress, plpAddress);
            expect(currentAllowance).gte(msgValue);
            await expect(plpWTGInstance.deposit(
                {
                    value: msgValue
                }
            )).to.be.revertedWith("PIT: ProjectToken is paused");

            await plpModeratorInstance.setPausedProjectToken(
                projectToken,
                false,
                false
            );
        });
        it("7. Failure: Should revert when msg.value == 0 and allowance WETH of WTG contract for PLP contract >= msg.value", async function () {
            let msgValue = toBN(0);

            {
                await plpWTGInstance.deposit({ value: 1 });
            }
            let currentAllowance = await weth.allowance(plpWTGAddress, plpAddress);
            expect(currentAllowance).gte(msgValue);
            await expect(plpWTGInstance.deposit(
                {
                    value: msgValue
                }
            )).to.be.revertedWith("PIT: ProjectTokenAmount==0");
        });
        it("8. Success (Single-user): Should deposit 10 ETH and allowance WETH of WTG contract for PLP contract < msg.value", async function () {
            await loadFixture();

            let projectToken = weth.address;
            let msgValue = ethers.utils.parseEther("10");

            let balanceETHBeforeDeposit = await deployMaster.getBalance();
            let depositedAmountBeforeDeposit = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenBeforeDeposit = await plpInstance.totalDepositedProjectToken(projectToken);
            let tx;

            let currentAllowance = await weth.allowance(plpWTGAddress, plpAddress);
            expect(currentAllowance).lt(msgValue);

            await expect(tx = await plpWTGInstance.deposit(
                {
                    value: msgValue
                }
            )).to.emit(plpInstance, "Deposit").withArgs(
                plpWTGInstance.address,
                projectToken,
                msgValue,
                deployMaster.address
            );
            let receipt = await tx.wait();
            let cumulativeGasUsed = receipt.cumulativeGasUsed;
            let effectiveGasPrice = receipt.effectiveGasPrice;
            let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

            let balanceETHAfterDeposit = await deployMaster.getBalance();
            let depositedAmountAfterDeposit = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenAfterDeposit = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(balanceETHAfterDeposit).to.eq(balanceETHBeforeDeposit.sub(msgValue.add(transactionFee)));
            expect(depositedAmountAfterDeposit).to.eq(depositedAmountBeforeDeposit.add(msgValue));
            expect(totalDepositedProjectTokenAfterDeposit).to.eq(totalDepositedProjectTokenBeforeDeposit.add(msgValue));
        });
        it("9. Success (Single-user): Should deposit 10 ETH and allowance WETH of WTG contract for PLP contract >= msg.value", async function () {
            await loadFixture();

            let projectToken = weth.address;
            let msgValue = ethers.utils.parseEther("10");

            {
                await plpWTGInstance.deposit({ value: msgValue });
            }
            let balanceETHBeforeDeposit = await deployMaster.getBalance();
            let depositedAmountBeforeDeposit = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenBeforeDeposit = await plpInstance.totalDepositedProjectToken(projectToken);
            let tx;

            let currentAllowance = await weth.allowance(plpWTGAddress, plpAddress);
            expect(currentAllowance).gte(msgValue);
            await expect(tx = await plpWTGInstance.deposit(
                {
                    value: msgValue
                }
            )).to.emit(plpInstance, "Deposit").withArgs(
                plpWTGInstance.address,
                projectToken,
                msgValue,
                deployMaster.address
            );
            let receipt = await tx.wait();
            let cumulativeGasUsed = receipt.cumulativeGasUsed;
            let effectiveGasPrice = receipt.effectiveGasPrice;
            let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

            let balanceETHAfterDeposit = await deployMaster.getBalance();
            let depositedAmountAfterDeposit = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenAfterDeposit = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(balanceETHAfterDeposit).to.eq(balanceETHBeforeDeposit.sub(msgValue.add(transactionFee)));
            expect(depositedAmountAfterDeposit).to.eq(depositedAmountBeforeDeposit.add(msgValue));
            expect(totalDepositedProjectTokenAfterDeposit).to.eq(totalDepositedProjectTokenBeforeDeposit.add(msgValue));
        });
        it("9. Success (Multi-user): Should deposit 10 ETH and allowance WETH of WTG contract for PLP contract >= msg.value", async function () {
            await loadFixture();

            let projectToken = weth.address;
            let msgValue = ethers.utils.parseEther("10");
            {
                await plpWTGInstance.deposit({ value: msgValue });
            }
            for (let i = 0; i < signers.length; i++) {
                let balanceETHBeforeDeposit = await signers[i].getBalance();
                let depositedAmountBeforeDeposit = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenBeforeDeposit = await plpInstance.totalDepositedProjectToken(projectToken);
                let tx;

                let currentAllowance = await weth.allowance(plpWTGAddress, plpAddress);
                expect(currentAllowance).gte(msgValue);
                await expect(tx = await plpWTGInstance.connect(signers[i]).deposit(
                    {
                        value: msgValue
                    }
                )).to.emit(plpInstance, "Deposit").withArgs(
                    plpWTGInstance.address,
                    projectToken,
                    msgValue,
                    signers[i].address
                );
                let receipt = await tx.wait();
                let cumulativeGasUsed = receipt.gasUsed;
                let effectiveGasPrice = receipt.effectiveGasPrice;
                let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

                let balanceETHAfterDeposit = await signers[i].getBalance();
                let depositedAmountAfterDeposit = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenAfterDeposit = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(balanceETHAfterDeposit).to.eq(balanceETHBeforeDeposit.sub(msgValue.add(transactionFee)));
                expect(depositedAmountAfterDeposit).to.eq(depositedAmountBeforeDeposit.add(msgValue));
                expect(totalDepositedProjectTokenAfterDeposit).to.eq(totalDepositedProjectTokenBeforeDeposit.add(msgValue));
            }
        });
    });

    describe("withdraw", function () {
        before(async function () {
            await loadFixture();
        });
        it("1. Failure: Should throw error when projectTokenAmount < 0", async function () {
            let projectTokenAmount = -1;

            expect(plpWTGInstance.withdraw(
                projectTokenAmount
            )).to.throw;
        });
        it("2. Failure: Should throw error when projectTokenAmount > maxUint256", async function () {
            let projectTokenAmount = ethers.constants.MaxUint256.add(toBN(1));

            expect(plpWTGInstance.withdraw(
                projectTokenAmount
            )).to.throw;
        });
        it("3. Failure: Should throw error when typeof projectTokenAmount is NOT UINT", async function () {
            let projectTokenAmount = 1.1;

            expect(plpWTGInstance.withdraw(
                projectTokenAmount
            )).to.throw;
        });
        it("4. Failure: Should throw error when msg.value != 0", async function () {
            let projectTokenAmount = toBN(1);

            expect(plpWTGInstance.withdraw(
                projectTokenAmount,
                {
                    value: toBN(1)
                }
            )).to.throw;
        });
        it("5. Failure: Should revert when isWithdrawPaused == TRUE", async function () {
            let projectToken = weth.address;
            let projectTokenAmount = toBN(1);

            await plpModeratorInstance.setPausedProjectToken(
                projectToken,
                false,
                true
            );

            await expect(plpWTGInstance.withdraw(
                projectTokenAmount
            )).to.be.revertedWith("PIT: ProjectToken is paused");

            await plpModeratorInstance.setPausedProjectToken(
                projectToken,
                false,
                false
            );
        });
        it("6. Failure: Should revert when projectTokenAmount == 0", async function () {
            let projectTokenAmount = toBN(0);

            await expect(plpWTGInstance.withdraw(
                projectTokenAmount
            )).to.be.revertedWith("PIT: Invalid PRJ token amount or depositPosition doesn't exist");
        });
        it("7. Failure: Should revert when depositedProjectTokenAmount == 0", async function () {
            await loadFixture();

            let projectToken = weth.address;
            let projectTokenAmount = toBN(1);

            expect(await plpInstance.getDepositedAmount(projectToken, deployMaster.address)).to.eq(toBN(0));

            await expect(plpWTGInstance.withdraw(
                projectTokenAmount
            )).to.be.revertedWith("PIT: Invalid PRJ token amount or depositPosition doesn't exist");
        });
        it("8. Failure: Should revert when withdrawableAmount == 0", async function () {
            await loadFixture();

            let projectToken = weth.address;
            let projectTokenAmount = toBN(1);
            {
                {
                    let depositAmount = ethers.utils.parseEther("1");
                    await plpWTGInstance.deposit(
                        {
                            value: depositAmount
                        }
                    );
                }
                {
                    let borrowAmount = ethers.utils.parseUnits("1000000", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        await plpInstance.getLendingAvailableToBorrow(
                            deployMaster.address,
                            projectToken,
                            usdcAddress
                        )
                    );
                }
            }
            let withdrawableAmount = await plpInstance.getCollateralAvailableToWithdraw(
                deployMaster.address,
                projectToken,
                usdcAddress
            );
            {
                await plpWTGInstance.withdraw(
                    withdrawableAmount
                );
            }
            withdrawableAmount = await plpInstance.getCollateralAvailableToWithdraw(
                deployMaster.address,
                projectToken,
                usdcAddress
            );
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            expect(actualLendingToken).to.eq(usdcAddress);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                actualLendingToken
            )).loanBody).to.gt(toBN(0));

            await expect(plpWTGInstance.withdraw(
                projectTokenAmount
            )).to.be.revertedWith("PIT: Withdrawable amount is 0");
        });
        it("9. Success (Single-user): Should withdraw available amount ETH when withdrawableAmount >= projectTokenAmount and loanBody > 0", async function () {
            await loadFixture();

            let projectToken = weth.address;
            {
                let depositAmount = ethers.utils.parseEther("10");
                await plpWTGInstance.deposit(
                    { value: depositAmount }
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("1", usdcDecimals);
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
            let withdrawableAmount = await plpInstance.getCollateralAvailableToWithdraw(
                deployMaster.address,
                projectToken,
                usdcAddress
            );
            let projectTokenAmount = withdrawableAmount;
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(withdrawableAmount.gt(toBN(0)));
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                actualLendingToken
            )).loanBody).to.gt(toBN(0));

            let balanceETHBeforeWithdraw = await deployMaster.getBalance();
            let depositedAmountBeforeWithdraw = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenBeforeWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);
            let tx;
            await expect(tx = await plpWTGInstance.withdraw(
                projectTokenAmount
            )).to.emit(plpInstance, "Withdraw").withArgs(
                deployMaster.address,
                projectToken,
                actualLendingToken,
                projectTokenAmount,
                plpWTGInstance.address
            );
            let receipt = await tx.wait();
            let cumulativeGasUsed = receipt.cumulativeGasUsed;
            let effectiveGasPrice = receipt.effectiveGasPrice;
            let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

            let balanceETHAfterWithdraw = await deployMaster.getBalance();
            let depositedAmountAfterWithdraw = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenAfterWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(balanceETHAfterWithdraw).eq(balanceETHBeforeWithdraw.add(projectTokenAmount).sub(transactionFee));
            expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(projectTokenAmount));
            expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(projectTokenAmount));
        });
        it("9. Success (Multi-user): Should withdraw available amount ETH when withdrawableAmount >= projectTokenAmount and loanBody > 0", async function () {
            await loadFixture();

            let projectToken = weth.address;
            {
                for (let i = 0; i < signers.length; i++) {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.connect(signers[i]).deposit(
                        { value: depositAmount }
                    );
                    {
                        let borrowAmount = ethers.utils.parseUnits("1", usdcDecimals);
                        await usdc.mint(signers[i].address, borrowAmount);
                        let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                        await usdc.connect(signers[i]).approve(blendingToken, borrowAmount);
                        await plpInstance.connect(signers[i]).supply(usdcAddress, borrowAmount);
                        await plpInstance.connect(signers[i]).borrow(
                            projectToken,
                            usdcAddress,
                            borrowAmount
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let withdrawableAmount = await plpInstance.getCollateralAvailableToWithdraw(
                    signers[i].address,
                    projectToken,
                    usdcAddress
                );
                let projectTokenAmount = withdrawableAmount;
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                expect(withdrawableAmount.gt(toBN(0)));
                expect((await plpInstance.borrowPosition(
                    signers[i].address,
                    projectToken,
                    actualLendingToken
                )).loanBody).to.gt(toBN(0));

                let balanceETHBeforeWithdraw = await signers[i].getBalance();
                let depositedAmountBeforeWithdraw = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenBeforeWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);
                let tx;
                await expect(tx = await plpWTGInstance.connect(signers[i]).withdraw(
                    projectTokenAmount
                )).to.emit(plpInstance, "Withdraw").withArgs(
                    signers[i].address,
                    projectToken,
                    actualLendingToken,
                    projectTokenAmount,
                    plpWTGInstance.address
                );
                let receipt = await tx.wait();
                let cumulativeGasUsed = receipt.cumulativeGasUsed;
                let effectiveGasPrice = receipt.effectiveGasPrice;
                let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

                let balanceETHAfterWithdraw = await signers[i].getBalance();
                let depositedAmountAfterWithdraw = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenAfterWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(balanceETHAfterWithdraw).eq(balanceETHBeforeWithdraw.add(projectTokenAmount).sub(transactionFee));
                expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(projectTokenAmount));
                expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(projectTokenAmount));
            }
        });
        it("10. Success (Single-user): Should withdraw available amount ETH when withdrawableAmount < projectTokenAmount and loanBody > 0", async function () {
            await loadFixture();

            let projectToken = weth.address;
            {
                let depositAmount = ethers.utils.parseEther("10");
                await plpWTGInstance.deposit(
                    { value: depositAmount }
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("100", usdcDecimals);
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
            let withdrawableAmount = await plpInstance.getCollateralAvailableToWithdraw(
                deployMaster.address,
                projectToken,
                usdcAddress
            );
            let projectTokenAmount = withdrawableAmount.add(1);
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(withdrawableAmount.gt(toBN(0)));
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                actualLendingToken
            )).loanBody).to.gt(toBN(0));

            let balanceETHBeforeWithdraw = await deployMaster.getBalance();
            let depositedAmountBeforeWithdraw = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenBeforeWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);
            let tx;
            await expect(tx = await plpWTGInstance.withdraw(
                projectTokenAmount
            )).to.emit(plpInstance, "Withdraw").withArgs(
                deployMaster.address,
                projectToken,
                actualLendingToken,
                withdrawableAmount,
                plpWTGInstance.address
            );
            let receipt = await tx.wait();
            let cumulativeGasUsed = receipt.cumulativeGasUsed;
            let effectiveGasPrice = receipt.effectiveGasPrice;
            let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

            let balanceETHAfterWithdraw = await deployMaster.getBalance();
            let depositedAmountAfterWithdraw = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenAfterWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(balanceETHAfterWithdraw).eq(balanceETHBeforeWithdraw.add(withdrawableAmount).sub(transactionFee));
            expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(withdrawableAmount));
            expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(withdrawableAmount));
        });
        it("10. Success (Multi-user): Should withdraw available amount ETH when withdrawableAmount < projectTokenAmount and loanBody > 0", async function () {
            await loadFixture();

            let projectToken = weth.address;
            {
                for (let i = 0; i < signers.length; i++) {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.connect(signers[i]).deposit(
                        { value: depositAmount }
                    );
                    {
                        let borrowAmount = ethers.utils.parseUnits("100", usdcDecimals);
                        await usdc.mint(signers[i].address, borrowAmount);
                        let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                        await usdc.connect(signers[i]).approve(blendingToken, borrowAmount);
                        await plpInstance.connect(signers[i]).supply(usdcAddress, borrowAmount);
                        await plpInstance.connect(signers[i]).borrow(
                            projectToken,
                            usdcAddress,
                            borrowAmount
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let withdrawableAmount = await plpInstance.getCollateralAvailableToWithdraw(
                    signers[i].address,
                    projectToken,
                    usdcAddress
                );
                let projectTokenAmount = withdrawableAmount.add(1);
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                expect(withdrawableAmount.gt(toBN(0)));
                expect((await plpInstance.borrowPosition(
                    signers[i].address,
                    projectToken,
                    actualLendingToken
                )).loanBody).to.gt(toBN(0));

                let balanceETHBeforeWithdraw = await signers[i].getBalance();
                let depositedAmountBeforeWithdraw = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenBeforeWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);
                let tx;
                await expect(tx = await plpWTGInstance.connect(signers[i]).withdraw(
                    projectTokenAmount
                )).to.emit(plpInstance, "Withdraw").withArgs(
                    signers[i].address,
                    projectToken,
                    actualLendingToken,
                    withdrawableAmount,
                    plpWTGInstance.address
                );
                let receipt = await tx.wait();
                let cumulativeGasUsed = receipt.cumulativeGasUsed;
                let effectiveGasPrice = receipt.effectiveGasPrice;
                let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

                let balanceETHAfterWithdraw = await signers[i].getBalance();
                let depositedAmountAfterWithdraw = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenAfterWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(balanceETHAfterWithdraw).eq(balanceETHBeforeWithdraw.add(withdrawableAmount).sub(transactionFee));
                expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(withdrawableAmount));
                expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(withdrawableAmount));
            }
        });
        it("11. Success (Single-user): Should withdraw available amount ETH when withdrawableAmount >= projectTokenAmount and loanBody == 0", async function () {
            await loadFixture();

            let projectToken = weth.address;
            {
                let depositAmount = ethers.utils.parseEther("10");
                await plpWTGInstance.deposit(
                    { value: depositAmount }
                );
            }
            let withdrawableAmount = await plpInstance.getCollateralAvailableToWithdraw(
                deployMaster.address,
                projectToken,
                usdcAddress
            );
            let projectTokenAmount = withdrawableAmount;
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(withdrawableAmount.gt(toBN(0)));
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                actualLendingToken
            )).loanBody).to.eq(toBN(0));

            let balanceETHBeforeWithdraw = await deployMaster.getBalance();
            let depositedAmountBeforeWithdraw = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenBeforeWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);
            let tx;
            await expect(tx = await plpWTGInstance.withdraw(
                projectTokenAmount
            )).to.emit(plpInstance, "Withdraw").withArgs(
                deployMaster.address,
                projectToken,
                actualLendingToken,
                projectTokenAmount,
                plpWTGInstance.address
            );
            let receipt = await tx.wait();
            let cumulativeGasUsed = receipt.cumulativeGasUsed;
            let effectiveGasPrice = receipt.effectiveGasPrice;
            let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

            let balanceETHAfterWithdraw = await deployMaster.getBalance();
            let depositedAmountAfterWithdraw = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenAfterWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(balanceETHAfterWithdraw).eq(balanceETHBeforeWithdraw.add(projectTokenAmount).sub(transactionFee));
            expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(projectTokenAmount));
            expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(projectTokenAmount));
        });
        it("11. Success (Multi-user): Should withdraw available amount ETH when withdrawableAmount >= projectTokenAmount and loanBody == 0", async function () {
            await loadFixture();

            let projectToken = weth.address;
            {
                for (let i = 0; i < signers.length; i++) {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.connect(signers[i]).deposit(
                        { value: depositAmount }
                    );
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let withdrawableAmount = await plpInstance.getCollateralAvailableToWithdraw(
                    signers[i].address,
                    projectToken,
                    usdcAddress
                );
                let projectTokenAmount = withdrawableAmount;
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                expect(withdrawableAmount.gt(toBN(0)));
                expect((await plpInstance.borrowPosition(
                    signers[i].address,
                    projectToken,
                    actualLendingToken
                )).loanBody).to.eq(toBN(0));

                let balanceETHBeforeWithdraw = await signers[i].getBalance();
                let depositedAmountBeforeWithdraw = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenBeforeWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);
                let tx;
                await expect(tx = await plpWTGInstance.connect(signers[i]).withdraw(
                    projectTokenAmount
                )).to.emit(plpInstance, "Withdraw").withArgs(
                    signers[i].address,
                    projectToken,
                    actualLendingToken,
                    projectTokenAmount,
                    plpWTGInstance.address
                );
                let receipt = await tx.wait();
                let cumulativeGasUsed = receipt.cumulativeGasUsed;
                let effectiveGasPrice = receipt.effectiveGasPrice;
                let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

                let balanceETHAfterWithdraw = await signers[i].getBalance();
                let depositedAmountAfterWithdraw = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenAfterWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(balanceETHAfterWithdraw).eq(balanceETHBeforeWithdraw.add(projectTokenAmount).sub(transactionFee));
                expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(projectTokenAmount));
                expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(projectTokenAmount));
            }
        });
        it("12. Success (Single-user): Should withdraw available amount ETH when withdrawableAmount < projectTokenAmount and loanBody == 0", async function () {
            await loadFixture();

            let projectToken = weth.address;
            {
                let depositAmount = ethers.utils.parseEther("10");
                await plpWTGInstance.deposit(
                    { value: depositAmount }
                );
            }
            let withdrawableAmount = await plpInstance.getCollateralAvailableToWithdraw(
                deployMaster.address,
                projectToken,
                usdcAddress
            );
            let projectTokenAmount = withdrawableAmount.add(1);
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(withdrawableAmount.gt(toBN(0)));
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                actualLendingToken
            )).loanBody).to.eq(toBN(0));

            let balanceETHBeforeWithdraw = await deployMaster.getBalance();
            let depositedAmountBeforeWithdraw = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenBeforeWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);
            let tx;
            await expect(tx = await plpWTGInstance.withdraw(
                projectTokenAmount
            )).to.emit(plpInstance, "Withdraw").withArgs(
                deployMaster.address,
                projectToken,
                actualLendingToken,
                withdrawableAmount,
                plpWTGInstance.address
            );
            let receipt = await tx.wait();
            let cumulativeGasUsed = receipt.cumulativeGasUsed;
            let effectiveGasPrice = receipt.effectiveGasPrice;
            let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

            let balanceETHAfterWithdraw = await deployMaster.getBalance();
            let depositedAmountAfterWithdraw = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenAfterWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(balanceETHAfterWithdraw).eq(balanceETHBeforeWithdraw.add(withdrawableAmount).sub(transactionFee));
            expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(withdrawableAmount));
            expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(withdrawableAmount));
        });
        it("12. Success (Multi-user): Should withdraw available amount ETH when withdrawableAmount < projectTokenAmount and loanBody == 0", async function () {
            await loadFixture();

            let projectToken = weth.address;
            {
                for (let i = 0; i < signers.length; i++) {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.connect(signers[i]).deposit(
                        { value: depositAmount }
                    );
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let withdrawableAmount = await plpInstance.getCollateralAvailableToWithdraw(
                    signers[i].address,
                    projectToken,
                    usdcAddress
                );
                let projectTokenAmount = withdrawableAmount.add(1);
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                expect(withdrawableAmount.gt(toBN(0)));
                expect((await plpInstance.borrowPosition(
                    signers[i].address,
                    projectToken,
                    actualLendingToken
                )).loanBody).to.eq(toBN(0));

                let balanceETHBeforeWithdraw = await signers[i].getBalance();
                let depositedAmountBeforeWithdraw = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenBeforeWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);
                let tx;
                await expect(tx = await plpWTGInstance.connect(signers[i]).withdraw(
                    projectTokenAmount
                )).to.emit(plpInstance, "Withdraw").withArgs(
                    signers[i].address,
                    projectToken,
                    actualLendingToken,
                    withdrawableAmount,
                    plpWTGInstance.address
                );
                let receipt = await tx.wait();
                let cumulativeGasUsed = receipt.cumulativeGasUsed;
                let effectiveGasPrice = receipt.effectiveGasPrice;
                let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

                let balanceETHAfterWithdraw = await signers[i].getBalance();
                let depositedAmountAfterWithdraw = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenAfterWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(balanceETHAfterWithdraw).eq(balanceETHBeforeWithdraw.add(withdrawableAmount).sub(transactionFee));
                expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(withdrawableAmount));
                expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(withdrawableAmount));
            }
        });
    });

    describe("borrow", function () {
        before(async function () {
            await loadFixture();
        });
        it("1. Failure: Should throw error when projectToken has an invalid address", async function () {
            let projectToken = "Not Address.";
            let lendingTokenAmount = toBN(1);

            expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount
            )).to.throw;
        });
        it("2. Failure: Should throw error when lendingTokenAmount < 0", async function () {
            let projectToken = prj1.address;
            let lendingTokenAmount = -1;

            expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount
            )).to.throw;
        });
        it("3. Failure: Should throw error when lendingTokenAmount > maxUint256", async function () {
            let projectToken = prj1.address;
            let lendingTokenAmount = ethers.constants.MaxUint256.add(toBN(1));

            expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount
            )).to.throw;
        });
        it("4. Failure: Should throw error when typeof projectTokenAmount is NOT UINT", async function () {
            let projectToken = prj1.address;
            let lendingTokenAmount = 1.1;

            expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount
            )).to.throw;
        });
        it("5. Failure: Should throw error when msg.value != 0", async function () {
            let projectToken = prj1.address;
            let lendingTokenAmount = toBN(1);

            expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                {
                    value: toBN(1)
                }
            )).to.throw;
        });
        it("6. Failure: Should revert when isProjectTokenListed == FALSE", async function () {
            let projectToken = ethers.constants.AddressZero;
            let lendingTokenAmount = toBN(1);

            expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: Project token is not listed");
        });
        it("7. Failure: Should revert when isLeveragePosition == TRUE", async function () {
            let pair = await createPairPrj1AndWETH();
            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = toBN(1);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("100000", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount.mul(100));
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseEther("100");
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await weth.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpWTGInstance.supply({ value: supplyAmount });
                }
                {
                    let borrowETHAmount = ethers.utils.parseEther("5");
                    let exp = await plpInstance.getTokenEvaluation(lendingToken, borrowETHAmount);
                    let margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, borrowETHAmount);
                    let buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowETHAmount,
                        0,
                        ethers.constants.AddressZero,
                        [pair.address]
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
            expect(isLeveragePosition).to.eq(true);
            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: Invalid position");
        });
        it("8. Failure: Should revert when lendingTokenAmount == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingTokenAmount = toBN(0);

            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: Invalid lending amount");
        });
        it("9. Failure: Should revert when lendingToken != actualLendingToken", async function () {
            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = toBN(1);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("1000", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let borrowAmount = ethers.utils.parseEther("1", usdcDecimals);
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
            expect(actualLendingToken).to.not.eq(lendingToken);
            expect(actualLendingToken).to.not.eq(ethers.constants.AddressZero);
            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: Invalid lending token");
        });
        it("10. Failure : Should revert when allowance WETH of user for WTG contract < lendingTokenAmount loanBody == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.utils.parseEther("5");
            {
                {
                    let depositAmount = ethers.utils.parseUnits("50000", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseEther("100");
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await weth.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpWTGInstance.supply({ value: supplyAmount });
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            expect(actualLendingToken).to.eq(ethers.constants.AddressZero);
            let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                deployMaster.address,
                projectToken,
                lendingToken
            );
            expect(availableToBorrow).lt(lendingTokenAmount);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                lendingToken
            )).loanBody).to.eq(toBN(0));

            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount
            )).to.be.reverted;
        });
        it("11. Failure : Should revert when allowance WETH of user for WTG contract < lendingTokenAmount loanBody > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.utils.parseEther("5");
            {
                {
                    let depositAmount = ethers.utils.parseUnits("50000", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseEther("100");
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await weth.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpWTGInstance.supply({ value: supplyAmount });
                }
                {
                    let borrowAmount = (await plpInstance.getLendingAvailableToBorrow(
                        deployMaster.address,
                        projectToken,
                        lendingToken
                    )).div(2);
                    await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                    await plpWTGInstance.borrow(
                        projectToken,
                        borrowAmount
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            expect(actualLendingToken).to.eq(lendingToken);
            let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                deployMaster.address,
                projectToken,
                lendingToken
            );
            expect(availableToBorrow).lt(lendingTokenAmount);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                lendingToken
            )).loanBody).to.gt(toBN(0));

            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount
            )).to.be.reverted;
        });
        it("12. Failure: Should revert when availableToBorrow == 0 and loanBody == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingTokenAmount = toBN(1);
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            expect(actualLendingToken).to.eq(ethers.constants.AddressZero);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                actualLendingToken
            )).loanBody).to.eq(toBN(0));

            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: Available amount to borrow is 0");
        });
        it("13. Failure: Should revert when availableToBorrow == 0 and loanBody > 0", async function () {
            
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = toBN(1);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let borrowAmount = ethers.utils.parseEther("1");
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await weth.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpWTGInstance.supply({ value: borrowAmount });
                    await plpInstance.borrow(
                        projectToken,
                        lendingToken,
                        await plpInstance.getLendingAvailableToBorrow(
                            deployMaster.address,
                            projectToken,
                            lendingToken
                        )
                    );
                    let availableToWithdraw = await plpInstance.getCollateralAvailableToWithdraw(
                        deployMaster.address,
                        projectToken,
                        lendingToken
                    );
                    await plpInstance.withdraw(projectToken, availableToWithdraw);
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            expect(actualLendingToken).to.eq(lendingToken);
            expect(await plpInstance.getLendingAvailableToBorrow(
                deployMaster.address,
                projectToken,
                actualLendingToken
            )).to.eq(toBN(0));
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                actualLendingToken
            )).loanBody).to.gt(toBN(0));

            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: Available amount to borrow is 0");
        });
        it("14. Success (Single-user): Should borrow available amount WETH when availableToBorrow < lendingTokenAmount loanBody == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.utils.parseEther("5");
            {
                {
                    let depositAmount = ethers.utils.parseUnits("50000", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseEther("100");
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await weth.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpWTGInstance.supply({ value: supplyAmount });
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            expect(actualLendingToken).to.eq(ethers.constants.AddressZero);
            let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                deployMaster.address,
                projectToken,
                lendingToken
            );
            expect(availableToBorrow).lt(lendingTokenAmount);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                lendingToken
            )).loanBody).to.eq(toBN(0));

            await weth.connect(deployMaster).approve(plpWTGAddress, lendingTokenAmount);

            let depositedAmount = await plpInstance.depositedAmount(deployMaster.address, projectToken);
            let balanceETHBeforeBorrow = await deployMaster.getBalance();
            let totalOutstandingBeforeBorrow = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowBeforeBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerLendingTokenBeforeBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);
            let allowanceWETHBeforeBorrow = await weth.allowance(deployMaster.address, plpWTGAddress);
            let tx;

            await expect(tx = await plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount
            )).to.emit(plpInstance, "Borrow").withArgs(
                deployMaster.address,
                lendingToken,
                availableToBorrow,
                projectToken,
                depositedAmount
            );
            let receipt = await tx.wait();
            let cumulativeGasUsed = receipt.cumulativeGasUsed;
            let effectiveGasPrice = receipt.effectiveGasPrice;
            let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

            let balanceETHAfterBorrow = await deployMaster.getBalance();
            let totalOutstandingAfterBorrow = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowAfterBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerLendingTokenAfterBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);
            let allowanceWETHAfterBorrow = await weth.allowance(deployMaster.address, plpWTGAddress);

            expect(balanceETHAfterBorrow).eq(balanceETHBeforeBorrow.add(availableToBorrow).sub(transactionFee));
            expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(availableToBorrow));
            expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(availableToBorrow));
            expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(availableToBorrow));
            expect(allowanceWETHAfterBorrow).eq(allowanceWETHBeforeBorrow.sub(availableToBorrow));
        });
        it("14. Success (Multi-user): Should borrow available amount WETH when availableToBorrow < lendingTokenAmount loanBody == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.utils.parseEther("5");
            {
                for (let i = 0; i < signers.length; i++) {
                    {
                        let depositAmount = ethers.utils.parseUnits("50000", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                    }
                    {
                        let supplyAmount = ethers.utils.parseEther("100");
                        let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                        await weth.connect(signers[i]).approve(blendingToken, supplyAmount);
                        await plpWTGInstance.connect(signers[i]).supply({ value: supplyAmount });
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);
                expect(actualLendingToken).to.eq(ethers.constants.AddressZero);
                let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                    signers[i].address,
                    projectToken,
                    lendingToken
                );
                expect(availableToBorrow).lt(lendingTokenAmount);
                expect((await plpInstance.borrowPosition(
                    signers[i].address,
                    projectToken,
                    lendingToken
                )).loanBody).to.eq(toBN(0));

                await weth.connect(signers[i]).approve(plpWTGAddress, lendingTokenAmount);

                let depositedAmount = await plpInstance.depositedAmount(signers[i].address, projectToken);
                let balanceETHBeforeBorrow = await signers[i].getBalance();
                let totalOutstandingBeforeBorrow = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowBeforeBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerLendingTokenBeforeBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);
                let allowanceWETHBeforeBorrow = await weth.allowance(signers[i].address, plpWTGAddress);
                let tx;

                await expect(tx = await plpWTGInstance.connect(signers[i]).borrow(
                    projectToken,
                    lendingTokenAmount
                )).to.emit(plpInstance, "Borrow").withArgs(
                    signers[i].address,
                    lendingToken,
                    availableToBorrow,
                    projectToken,
                    depositedAmount
                );
                let receipt = await tx.wait();
                let cumulativeGasUsed = receipt.cumulativeGasUsed;
                let effectiveGasPrice = receipt.effectiveGasPrice;
                let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

                let balanceETHAfterBorrow = await signers[i].getBalance();
                let totalOutstandingAfterBorrow = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowAfterBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerLendingTokenAfterBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);
                let allowanceWETHAfterBorrow = await weth.allowance(signers[i].address, plpWTGAddress);

                expect(balanceETHAfterBorrow).eq(balanceETHBeforeBorrow.add(availableToBorrow).sub(transactionFee));
                expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(availableToBorrow));
                expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(availableToBorrow));
                expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(availableToBorrow));
                expect(allowanceWETHAfterBorrow).eq(allowanceWETHBeforeBorrow.sub(availableToBorrow));
            }
        });
        it("15. Success (Single-user): Should borrow available amount WETH when availableToBorrow < lendingTokenAmount loanBody > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.utils.parseEther("5");
            {
                {
                    let depositAmount = ethers.utils.parseUnits("50000", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseEther("100");
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await weth.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpWTGInstance.supply({ value: supplyAmount });
                }
                {
                    let borrowAmount = (await plpInstance.getLendingAvailableToBorrow(
                        deployMaster.address,
                        projectToken,
                        lendingToken
                    )).div(2);
                    await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                    await plpWTGInstance.borrow(
                        projectToken,
                        borrowAmount
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            expect(actualLendingToken).to.eq(lendingToken);
            let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                deployMaster.address,
                projectToken,
                lendingToken
            );
            expect(availableToBorrow).lt(lendingTokenAmount);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                lendingToken
            )).loanBody).to.gt(toBN(0));

            await weth.connect(deployMaster).approve(plpWTGAddress, availableToBorrow);

            let depositedAmount = await plpInstance.depositedAmount(deployMaster.address, projectToken);
            let balanceETHBeforeBorrow = await deployMaster.getBalance();
            let totalOutstandingBeforeBorrow = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowBeforeBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerLendingTokenBeforeBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);
            let allowanceWETHBeforeBorrow = await weth.allowance(deployMaster.address, plpWTGAddress);
            let tx;

            await expect(tx = await plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount
            )).to.emit(plpInstance, "Borrow").withArgs(
                deployMaster.address,
                lendingToken,
                availableToBorrow,
                projectToken,
                depositedAmount
            );
            let receipt = await tx.wait();
            let cumulativeGasUsed = receipt.cumulativeGasUsed;
            let effectiveGasPrice = receipt.effectiveGasPrice;
            let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

            let balanceETHAfterBorrow = await deployMaster.getBalance();
            let totalOutstandingAfterBorrow = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowAfterBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerLendingTokenAfterBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);
            let allowanceWETHAfterBorrow = await weth.allowance(deployMaster.address, plpWTGAddress);

            expect(balanceETHAfterBorrow).eq(balanceETHBeforeBorrow.add(availableToBorrow).sub(transactionFee));
            expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(availableToBorrow));
            expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(availableToBorrow));
            expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(availableToBorrow));
            expect(allowanceWETHAfterBorrow).eq(allowanceWETHBeforeBorrow.sub(availableToBorrow));
        });
        it("15. Success (Multi-user): Should borrow available amount WETH when availableToBorrow < lendingTokenAmount loanBody > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.utils.parseEther("5");
            {
                for (let i = 0; i < signers.length; i++) {
                    {
                        let depositAmount = ethers.utils.parseUnits("50000", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                    }
                    {
                        let supplyAmount = ethers.utils.parseEther("100");
                        let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                        await weth.connect(signers[i]).approve(blendingToken, supplyAmount);
                        await plpWTGInstance.connect(signers[i]).supply({ value: supplyAmount });
                    }
                    {
                        let borrowAmount = (await plpInstance.getLendingAvailableToBorrow(
                            signers[i].address,
                            projectToken,
                            lendingToken
                        )).div(2);
                        await weth.connect(signers[i]).approve(plpWTGAddress, borrowAmount);
                        await plpWTGInstance.connect(signers[i]).borrow(
                            projectToken,
                            borrowAmount
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);
                expect(actualLendingToken).to.eq(lendingToken);
                let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                    signers[i].address,
                    projectToken,
                    lendingToken
                );
                expect(availableToBorrow).lt(lendingTokenAmount);
                expect((await plpInstance.borrowPosition(
                    signers[i].address,
                    projectToken,
                    lendingToken
                )).loanBody).to.gt(toBN(0));

                await weth.connect(signers[i]).approve(plpWTGAddress, availableToBorrow);

                let depositedAmount = await plpInstance.depositedAmount(signers[i].address, projectToken);
                let balanceETHBeforeBorrow = await signers[i].getBalance();
                let totalOutstandingBeforeBorrow = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowBeforeBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerLendingTokenBeforeBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);
                let allowanceWETHBeforeBorrow = await weth.allowance(signers[i].address, plpWTGAddress);
                let tx;

                await expect(tx = await plpWTGInstance.connect(signers[i]).borrow(
                    projectToken,
                    lendingTokenAmount
                )).to.emit(plpInstance, "Borrow").withArgs(
                    signers[i].address,
                    lendingToken,
                    availableToBorrow,
                    projectToken,
                    depositedAmount
                );
                let receipt = await tx.wait();
                let cumulativeGasUsed = receipt.cumulativeGasUsed;
                let effectiveGasPrice = receipt.effectiveGasPrice;
                let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

                let balanceETHAfterBorrow = await signers[i].getBalance();
                let totalOutstandingAfterBorrow = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowAfterBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerLendingTokenAfterBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);
                let allowanceWETHAfterBorrow = await weth.allowance(signers[i].address, plpWTGAddress);

                expect(balanceETHAfterBorrow).eq(balanceETHBeforeBorrow.add(availableToBorrow).sub(transactionFee));
                expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(availableToBorrow));
                expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(availableToBorrow));
                expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(availableToBorrow));
                expect(allowanceWETHAfterBorrow).eq(allowanceWETHBeforeBorrow.sub(availableToBorrow));
            }
        });
        it("16. Success (Single-user): Should borrow 5 WETH when availableToBorrow >= lendingTokenAmount loanBody == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.utils.parseEther("5");
            {
                {
                    let depositAmount = ethers.utils.parseUnits("100000", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseEther("5");
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await weth.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpWTGInstance.supply({ value: supplyAmount });
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            expect(actualLendingToken).to.eq(ethers.constants.AddressZero);
            let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                deployMaster.address,
                projectToken,
                lendingToken
            );
            expect(availableToBorrow).gte(lendingTokenAmount);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                lendingToken
            )).loanBody).to.eq(toBN(0));

            await weth.connect(deployMaster).approve(plpWTGAddress, lendingTokenAmount);

            let depositedAmount = await plpInstance.depositedAmount(deployMaster.address, projectToken);
            let balanceETHBeforeBorrow = await deployMaster.getBalance();
            let totalOutstandingBeforeBorrow = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowBeforeBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerLendingTokenBeforeBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);
            let allowanceWETHBeforeBorrow = await weth.allowance(deployMaster.address, plpWTGAddress);
            let tx;

            await expect(tx = await plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount
            )).to.emit(plpInstance, "Borrow").withArgs(
                deployMaster.address,
                lendingToken,
                lendingTokenAmount,
                projectToken,
                depositedAmount
            );
            let receipt = await tx.wait();
            let cumulativeGasUsed = receipt.cumulativeGasUsed;
            let effectiveGasPrice = receipt.effectiveGasPrice;
            let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

            let balanceETHAfterBorrow = await deployMaster.getBalance();
            let totalOutstandingAfterBorrow = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowAfterBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerLendingTokenAfterBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);
            let allowanceWETHAfterBorrow = await weth.allowance(deployMaster.address, plpWTGAddress);

            expect(balanceETHAfterBorrow).eq(balanceETHBeforeBorrow.add(lendingTokenAmount).sub(transactionFee));
            expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(lendingTokenAmount));
            expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(lendingTokenAmount));
            expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(lendingTokenAmount));
            expect(allowanceWETHAfterBorrow).eq(allowanceWETHBeforeBorrow.sub(lendingTokenAmount));
        });
        it("16. Success (Multi-user): Should borrow 5 WETH when availableToBorrow >= lendingTokenAmount loanBody == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.utils.parseEther("5");
            {
                for (let i = 0; i < signers.length; i++) {
                    {
                        let depositAmount = ethers.utils.parseUnits("100000", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                    }
                    {
                        let supplyAmount = ethers.utils.parseEther("5");
                        let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                        await weth.connect(signers[i]).approve(blendingToken, supplyAmount);
                        await plpWTGInstance.connect(signers[i]).supply({ value: supplyAmount });
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);
                expect(actualLendingToken).to.eq(ethers.constants.AddressZero);
                let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                    signers[i].address,
                    projectToken,
                    lendingToken
                );
                expect(availableToBorrow).gte(lendingTokenAmount);
                expect((await plpInstance.borrowPosition(
                    signers[i].address,
                    projectToken,
                    lendingToken
                )).loanBody).to.eq(toBN(0));

                await weth.connect(signers[i]).approve(plpWTGAddress, lendingTokenAmount);

                let depositedAmount = await plpInstance.depositedAmount(signers[i].address, projectToken);
                let balanceETHBeforeBorrow = await signers[i].getBalance();
                let totalOutstandingBeforeBorrow = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowBeforeBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerLendingTokenBeforeBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);
                let allowanceWETHBeforeBorrow = await weth.allowance(signers[i].address, plpWTGAddress);
                let tx;

                await expect(tx = await plpWTGInstance.connect(signers[i]).borrow(
                    projectToken,
                    lendingTokenAmount
                )).to.emit(plpInstance, "Borrow").withArgs(
                    signers[i].address,
                    lendingToken,
                    lendingTokenAmount,
                    projectToken,
                    depositedAmount
                );
                let receipt = await tx.wait();
                let cumulativeGasUsed = receipt.cumulativeGasUsed;
                let effectiveGasPrice = receipt.effectiveGasPrice;
                let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

                let balanceETHAfterBorrow = await signers[i].getBalance();
                let totalOutstandingAfterBorrow = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowAfterBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerLendingTokenAfterBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);
                let allowanceWETHAfterBorrow = await weth.allowance(signers[i].address, plpWTGAddress);

                expect(balanceETHAfterBorrow).eq(balanceETHBeforeBorrow.add(lendingTokenAmount).sub(transactionFee));
                expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(lendingTokenAmount));
                expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(lendingTokenAmount));
                expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(lendingTokenAmount));
                expect(allowanceWETHAfterBorrow).eq(allowanceWETHBeforeBorrow.sub(lendingTokenAmount));
            }
        });
        it("17. Success (Single-user): Should borrow 5 WETH when availableToBorrow >= lendingTokenAmount loanBody > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.utils.parseEther("5");
            {
                {
                    let depositAmount = ethers.utils.parseUnits("100000", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseEther("100");
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await weth.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpWTGInstance.supply({ value: supplyAmount });
                }
                {
                    let borrowAmount = (await plpInstance.getLendingAvailableToBorrow(
                        deployMaster.address,
                        projectToken,
                        lendingToken
                    )).div(10);
                    await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                    await plpWTGInstance.borrow(
                        projectToken,
                        borrowAmount
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            expect(actualLendingToken).to.eq(lendingToken);
            let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                deployMaster.address,
                projectToken,
                lendingToken
            );
            expect(availableToBorrow).gte(lendingTokenAmount);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                lendingToken
            )).loanBody).to.gt(toBN(0));

            await weth.connect(deployMaster).approve(plpWTGAddress, lendingTokenAmount);

            let depositedAmount = await plpInstance.depositedAmount(deployMaster.address, projectToken);
            let balanceETHBeforeBorrow = await deployMaster.getBalance();
            let totalOutstandingBeforeBorrow = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowBeforeBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerLendingTokenBeforeBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);
            let allowanceWETHBeforeBorrow = await weth.allowance(deployMaster.address, plpWTGAddress);
            let tx;

            await expect(tx = await plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount
            )).to.emit(plpInstance, "Borrow").withArgs(
                deployMaster.address,
                lendingToken,
                lendingTokenAmount,
                projectToken,
                depositedAmount
            );
            let receipt = await tx.wait();
            let cumulativeGasUsed = receipt.cumulativeGasUsed;
            let effectiveGasPrice = receipt.effectiveGasPrice;
            let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

            let balanceETHAfterBorrow = await deployMaster.getBalance();
            let totalOutstandingAfterBorrow = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowAfterBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerLendingTokenAfterBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);
            let allowanceWETHAfterBorrow = await weth.allowance(deployMaster.address, plpWTGAddress);

            expect(balanceETHAfterBorrow).eq(balanceETHBeforeBorrow.add(lendingTokenAmount).sub(transactionFee));
            expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(lendingTokenAmount));
            expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(lendingTokenAmount));
            expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(lendingTokenAmount));
            expect(allowanceWETHAfterBorrow).eq(allowanceWETHBeforeBorrow.sub(lendingTokenAmount));
        });
        it("17. Success (Multi-user): Should borrow 5 WETH when availableToBorrow >= lendingTokenAmount loanBody > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.utils.parseEther("5");
            {
                for (let i = 0; i < signers.length; i++) {
                    {
                        let depositAmount = ethers.utils.parseUnits("100000", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                    }
                    {
                        let supplyAmount = ethers.utils.parseEther("100");
                        let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                        await weth.connect(signers[i]).approve(blendingToken, supplyAmount);
                        await plpWTGInstance.connect(signers[i]).supply({ value: supplyAmount });
                    }
                    {
                        let borrowAmount = (await plpInstance.getLendingAvailableToBorrow(
                            signers[i].address,
                            projectToken,
                            lendingToken
                        )).div(10);
                        await weth.connect(signers[i]).approve(plpWTGAddress, borrowAmount);
                        await plpWTGInstance.connect(signers[i]).borrow(
                            projectToken,
                            borrowAmount
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);
                expect(actualLendingToken).to.eq(lendingToken);
                let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                    signers[i].address,
                    projectToken,
                    lendingToken
                );
                expect(availableToBorrow).gte(lendingTokenAmount);
                expect((await plpInstance.borrowPosition(
                    signers[i].address,
                    projectToken,
                    lendingToken
                )).loanBody).to.gt(toBN(0));

                await weth.connect(signers[i]).approve(plpWTGAddress, lendingTokenAmount);

                let depositedAmount = await plpInstance.depositedAmount(signers[i].address, projectToken);
                let balanceETHBeforeBorrow = await signers[i].getBalance();
                let totalOutstandingBeforeBorrow = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowBeforeBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerLendingTokenBeforeBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);
                let allowanceWETHBeforeBorrow = await weth.allowance(signers[i].address, plpWTGAddress);
                let tx;

                await expect(tx = await plpWTGInstance.connect(signers[i]).borrow(
                    projectToken,
                    lendingTokenAmount
                )).to.emit(plpInstance, "Borrow").withArgs(
                    signers[i].address,
                    lendingToken,
                    lendingTokenAmount,
                    projectToken,
                    depositedAmount
                );
                let receipt = await tx.wait();
                let cumulativeGasUsed = receipt.cumulativeGasUsed;
                let effectiveGasPrice = receipt.effectiveGasPrice;
                let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);

                let balanceETHAfterBorrow = await signers[i].getBalance();
                let totalOutstandingAfterBorrow = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowAfterBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerLendingTokenAfterBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);
                let allowanceWETHAfterBorrow = await weth.allowance(signers[i].address, plpWTGAddress);

                expect(balanceETHAfterBorrow).eq(balanceETHBeforeBorrow.add(lendingTokenAmount).sub(transactionFee));
                expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(lendingTokenAmount));
                expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(lendingTokenAmount));
                expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(lendingTokenAmount));
                expect(allowanceWETHAfterBorrow).eq(allowanceWETHBeforeBorrow.sub(lendingTokenAmount));
            }
        });
    });

    describe("leveragedBorrowWithProjectETH", function () {
        before(async function () {
            await loadFixture();
        });
        it("1. Failure: Should throw error when lendingToken has an invalid address", async function () {
            let lendingToken = "Not Address.";
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let msgValue = toBN(1);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.throw;
        });
        it("2. Failure: Should throw error when notionalExposure < 0", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(-1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let msgValue = toBN(1);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.throw;
        });
        it("3. Failure: Should throw error when notionalExposure > maxUint256", async function () {
            let lendingToken = usdc.address;
            let exp = ethers.constants.MaxUint256.add(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let msgValue = toBN(1);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.throw;
        });
        it("4. Failure: Should throw error when typeof notionalExposure is NOT UINT", async function () {
            let lendingToken = usdc.address;
            let exp = 1.1;
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let msgValue = toBN(1);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.throw;
        });
        it("5. Failure: Should throw error when marginCollateralAmount < 0", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(-1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let msgValue = toBN(1);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.throw;
        });
        it("6. Failure: Should throw error when marginCollateralAmount > maxUint256", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = ethers.constants.MaxUint256.add(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let msgValue = toBN(1);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.throw;
        });
        it("7. Failure: Should throw error when typeof marginCollateralAmount is NOT UINT", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = 1.1;
            let buyCalldata = "0x";
            let type = toBN(0);
            let msgValue = toBN(1);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.throw;
        });
        it("8. Failure: Should throw error when buyCalldata is NOT BYTES", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "NOT BYTES.";
            let type = toBN(0);
            let msgValue = toBN(1);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.throw;
        });
        it("9. Failure: Should throw error when leverageType < 0", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(-1);
            let msgValue = toBN(1);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.throw;
        });
        it("10. Failure: Should throw error when leverageType > 255 (uint8)", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(256);
            let msgValue = toBN(1);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.throw;
        });
        it("11. Failure: Should throw error when typeof leverageType is NOT UINT", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = 1.1;
            let msgValue = toBN(1);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.throw;
        });
        it("12. Failure: Should revert when leverageType > 1", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(2);
            let msgValue = toBN(1);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.throw;
        });
        it("13. Failure: Should throw error when msg.value < 0", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let msgValue = toBN(-1);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.throw;
        });
        it("14. Failure: Should throw error when msg.value > maxUint256", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let msgValue = ethers.constants.MaxUint256.add(1);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.throw;
        });
        it("15. Failure: Should throw error when typeof msg.value is NOT UINT", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let msgValue = 1.1;

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.throw;
        });
        it("16. Failure: Should throw error when typeof msg.value is NOT UINT", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            let margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = "0x";
            let type = toBN(0);
            let msgValue = addingAmount.sub(1);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.revertedWith("WTG: Invalid value");
        });
        it("17. Failure: Should revert when notionalExposure == 0", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            let margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = "0x";
            let type = toBN(0);
            let msgValue = addingAmount;
            exp = 0;

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.revertedWith("PITLeverage: Invalid amount");
        });
        it("18. Failure: Should revert when lendingToken != currentLendingToken and currentLendingToken != ZERO ADDRESS", async function () {
            let projectToken = weth.address;
            let lendingToken = usb.address;
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            let margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = "0x";
            let type = toBN(0);
            let msgValue = addingAmount;
            {
                {
                    let depositAmount = ethers.utils.parseEther("1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let borrowAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);
                    let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                        deployMaster.address,
                        projectToken,
                        usdcAddress
                    );
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        availableToBorrow.div(2)
                    );
                }
            }
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(currentLendingToken).to.not.eq(lendingToken);
            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.revertedWith("PITLeverage: Invalid lending token");
        });
        it("19. Failure: Should revert when lendingToken == currentLendingToken, isLeveragePosition == FALSE and loadBody > 0", async function () {
            await loadFixture();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            {
                {
                    let depositAmount = ethers.utils.parseEther("1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let borrowAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);
                    let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                        deployMaster.address,
                        projectToken,
                        usdcAddress
                    );
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        availableToBorrow.div(2)
                    );
                }
            }
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            let margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = "0x";
            let type = toBN(0);
            let msgValue = addingAmount;

            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(lendingToken);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                lendingToken
            )).loanBody).to.gt(toBN(0));
            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.revertedWith("PITLeverage: Invalid position");
        });
        it("20. Failure: Should revert when currentLendingToken == ZERO ADDRESS and marginCollateralAmount < depositedProjectTokenAmount", async function () {
            await loadFixture();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            {
                {
                    let depositAmount = ethers.utils.parseEther("1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
            }
            let depositedTokenAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            margin = depositedTokenAmount.sub(1);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = "0x";
            let type = toBN(0);
            let msgValue = addingAmount;

            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                lendingToken
            )).loanBody).to.eq(toBN(0));
            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.revertedWith("PITLeverage: Invalid amount");
        });
        it("21. Failure: Should revert when marginCollateralAmount < depositedProjectTokenAmount and isLeveragePosition == TRUE", async function () {
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let depositAmount = ethers.utils.parseEther("1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                    await weth.connect(deployMaster).deposit({ value: depositAmount.mul(100) });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("2000", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowUSDCAmount,
                        0,
                        ethers.constants.AddressZero,
                        [
                            await factory.getPair(usdcAddress, prj1Address),
                            await factory.getPair(prj1Address, wethAddress)
                        ]
                    );
                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        { value: addingAmount }
                    );
                }
            }
            let depositedTokenAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            margin = depositedTokenAmount.sub(1);
            buyCalldata = "0x";
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                lendingToken
            )).loanBody).to.gt(toBN(0));
            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.revertedWith("PITLeverage: Invalid amount");
        });
        it("22. Failure: Should revert when buyOnExchangeAggregator fails", async function () {
            await loadFixture();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata = "0x";
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseEther("1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);
            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.reverted;
        });
        it.skip("23. Failure: Should revert when isLendingTokenListed == FALSE", async function () {
            let lendingToken = ethers.constants.AddressZero;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let msgValue = toBN(1);

            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.revertedWith("PIT: Lending token is not listed");
        });
        it("24. Failure: Should revert when allowance lendingToken < lendingTokenCount and isLeveragePosition == FALSE", async function () {
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let depositAmount = ethers.utils.parseEther("1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("5000", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount.sub(1));
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);
            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
        });
        it("25. Failure: Should revert when allowance lendingToken < lendingTokenCount and isLeveragePosition == TRUE", async function () {
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let depositAmount = ethers.utils.parseEther("0.1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    msgValue = addingAmount;
                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowUSDCAmount,
                        0,
                        ethers.constants.AddressZero,
                        [
                            await factory.getPair(usdcAddress, prj1Address),
                            await factory.getPair(prj1Address, wethAddress)
                        ]
                    );
                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        { value: msgValue }
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("10000", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount.sub(1));
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);
            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
        });
        it("26. Failure: Should revert when allowance projectToken < addingAmount and isLeveragePosition == FALSE", async function () {
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let depositAmount = ethers.utils.parseEther("1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("5000", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount.sub(1));
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);
            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.reverted;
        });
        it("27. Failure: Should revert when allowance projectToken < addingAmount and isLeveragePosition == TRUE", async function () {
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let depositAmount = ethers.utils.parseEther("0.1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    msgValue = addingAmount;
                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowUSDCAmount,
                        0,
                        ethers.constants.AddressZero,
                        [
                            await factory.getPair(usdcAddress, prj1Address),
                            await factory.getPair(prj1Address, wethAddress)
                        ]
                    );
                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        { value: msgValue }
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("10000", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount.sub(1));
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);
            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.reverted;
        });
        it("28. Failure: Should revert when totalOutstandingInUSD > pit, isLeveragePosition == FALSE and addingAmount > 0", async function () {
            await loadFixture();
            await createPairPrj1AndWETH();
            await setHighPrice(wethAddress, wethDecimals);

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let depositAmount = ethers.utils.parseEther("1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("5000", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            await setLowPrice(wethAddress, wethDecimals);
            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.revertedWith("PITLeverage: LendingTokenAmount exceeds pit remaining");
        });
        it("29. Failure: Should revert when totalOutstandingInUSD > pit, isLeveragePosition == TRUE and addingAmount > 0", async function () {
            await loadFixture();
            await createPairPrj1AndWETH();
            await setHighPrice(wethAddress, wethDecimals);

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let depositAmount = ethers.utils.parseEther("0.1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    msgValue = addingAmount;
                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowUSDCAmount,
                        0,
                        ethers.constants.AddressZero,
                        [
                            await factory.getPair(usdcAddress, prj1Address),
                            await factory.getPair(prj1Address, wethAddress)
                        ]
                    );
                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        { value: msgValue }
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("10000", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            await setLowPrice(wethAddress, wethDecimals);
            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.revertedWith("PITLeverage: LendingTokenAmount exceeds pit remaining");
        });
        it("30. Failure: Should revert when totalOutstandingInUSD > pit, isLeveragePosition == FALSE and addingAmount == 0", async function () {
            await loadFixture();
            await createPairPrj1AndWETH();
            await setHighPrice(wethAddress, wethDecimals);

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let depositAmount = ethers.utils.parseEther("1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("5000", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await plpWTGInstance.deposit({ value: addingAmount });
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            await setLowPrice(wethAddress, wethDecimals);
            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.revertedWith("PITLeverage: LendingTokenAmount exceeds pit remaining");
        });
        it("31. Failure: Should revert when totalOutstandingInUSD > pit, isLeveragePosition == TRUE and addingAmount == 0", async function () {
            await loadFixture();
            await createPairPrj1AndWETH();
            await setHighPrice(wethAddress, wethDecimals);

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let depositAmount = ethers.utils.parseEther("0.1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    msgValue = addingAmount;
                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowUSDCAmount,
                        0,
                        ethers.constants.AddressZero,
                        [
                            await factory.getPair(usdcAddress, prj1Address),
                            await factory.getPair(prj1Address, wethAddress)
                        ]
                    );
                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        { value: msgValue }
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("10000", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await plpWTGInstance.deposit({ value: addingAmount });
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            await setLowPrice(wethAddress, wethDecimals);
            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.revertedWith("PITLeverage: LendingTokenAmount exceeds pit remaining");
        });
        it("32. Failure: Should revert when totalBorrowPerCollateral > borrowLimitPerCollateral, isLeveragePosition == FALSE and addingAmount > 0", async function () {
            
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    {
                        let depositAmount = ethers.utils.parseEther("0.1");
                        await plpWTGInstance.deposit({ value: depositAmount });
                    }
                }
                {
                    let borrowLimitPerCollateral = await plpInstance.borrowLimitPerCollateral(projectToken);
                    await plpModeratorInstance.setBorrowLimitPerCollateralAsset(
                        weth.address,
                        borrowLimitPerCollateral.div(10000)
                    );
                    borrowLimitPerCollateral = await plpInstance.borrowLimitPerCollateral(projectToken);
                    let lendingTokenCount = await plpLeverageInstance.calculateLendingTokenCount(lendingToken, borrowLimitPerCollateral);
                    let supplyAmount = lendingTokenCount.mul(10);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let projectTokenCount = await plpLeverageInstance.calculateLendingTokenCount(prj1.address, borrowLimitPerCollateral);
                    await plpWTGInstance.connect(signers[1]).deposit({ value: projectTokenCount });
                    await plpInstance.connect(signers[1]).borrow(
                        weth.address,
                        lendingToken,
                        await plpInstance.getLendingAvailableToBorrow(
                            signers[1].address,
                            weth.address,
                            lendingToken
                        )
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        });
        it("33. Failure: Should revert when totalBorrowPerCollateral > borrowLimitPerCollateral, isLeveragePosition == TRUE and addingAmount > 0", async function () {
            
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let depositAmount = ethers.utils.parseEther("0.1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    msgValue = addingAmount;
                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowUSDCAmount,
                        0,
                        ethers.constants.AddressZero,
                        [
                            await factory.getPair(usdcAddress, prj1Address),
                            await factory.getPair(prj1Address, wethAddress)
                        ]
                    );
                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        { value: msgValue }
                    );
                }
            }
            await plpModeratorInstance.setBorrowLimitPerCollateralAsset(
                weth.address,
                exp
            );
            let borrowUSDCAmount = ethers.utils.parseUnits("10000", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        });
        it("34. Failure: Should revert when totalBorrowPerCollateral > borrowLimitPerCollateral, isLeveragePosition == FALSE and addingAmount == 0", async function () {
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    {
                        let depositAmount = ethers.utils.parseEther("0.1");
                        await plpWTGInstance.deposit({ value: depositAmount });
                    }
                }
                {
                    let borrowLimitPerCollateral = await plpInstance.borrowLimitPerCollateral(projectToken);
                    await plpModeratorInstance.setBorrowLimitPerCollateralAsset(
                        weth.address,
                        borrowLimitPerCollateral.div(10000)
                    );
                    borrowLimitPerCollateral = await plpInstance.borrowLimitPerCollateral(projectToken);
                    let lendingTokenCount = await plpLeverageInstance.calculateLendingTokenCount(lendingToken, borrowLimitPerCollateral);
                    let supplyAmount = lendingTokenCount.mul(10);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let projectTokenCount = await plpLeverageInstance.calculateLendingTokenCount(prj1.address, borrowLimitPerCollateral);
                    await plpWTGInstance.connect(signers[1]).deposit({ value: projectTokenCount });
                    await plpInstance.connect(signers[1]).borrow(
                        weth.address,
                        lendingToken,
                        await plpInstance.getLendingAvailableToBorrow(
                            signers[1].address,
                            weth.address,
                            lendingToken
                        )
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await plpWTGInstance.deposit({ value: addingAmount });
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        });
        it("35. Failure: Should revert when totalBorrowPerCollateral > borrowLimitPerCollateral, isLeveragePosition == TRUE and addingAmount == 0", async function () {
            
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let depositAmount = ethers.utils.parseEther("0.1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    msgValue = addingAmount;
                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowUSDCAmount,
                        0,
                        ethers.constants.AddressZero,
                        [
                            await factory.getPair(usdcAddress, prj1Address),
                            await factory.getPair(prj1Address, wethAddress)
                        ]
                    );
                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        { value: msgValue }
                    );
                }
            }
            await plpModeratorInstance.setBorrowLimitPerCollateralAsset(
                weth.address,
                exp
            );
            let borrowUSDCAmount = ethers.utils.parseUnits("10000", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await plpWTGInstance.deposit({ value: addingAmount });
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        });
        it("36. Failure: Should revert when totalBorrowLendingToken > borrowLimitPerLendingToken, isLeveragePosition == FALSE and addingAmount > 0", async function () {
            
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    {
                        let depositAmount = ethers.utils.parseEther("0.1");
                        await plpWTGInstance.deposit({ value: depositAmount });
                    }
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            await plpModeratorInstance.setBorrowLimitPerLendingAsset(
                lendingToken,
                exp.sub(1)
            );
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
        });
        it("37. Failure: Should revert when totalBorrowPerLendingToken > borrowLimitPerLendingToken, isLeveragePosition == TRUE and addingAmount > 0", async function () {
            
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let depositAmount = ethers.utils.parseEther("0.1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    msgValue = addingAmount;
                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowUSDCAmount,
                        0,
                        ethers.constants.AddressZero,
                        [
                            await factory.getPair(usdcAddress, prj1Address),
                            await factory.getPair(prj1Address, wethAddress)
                        ]
                    );
                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        { value: msgValue }
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("10000", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            await plpModeratorInstance.setBorrowLimitPerLendingAsset(
                usdc.address,
                exp.sub(1)
            );
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
        });
        it("38. Failure: Should revert when totalBorrowLendingToken > borrowLimitPerLendingToken, isLeveragePosition == FALSE and addingAmount == 0", async function () {
            
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    {
                        let depositAmount = ethers.utils.parseEther("0.1");
                        await plpWTGInstance.deposit({ value: depositAmount });
                    }
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            await plpModeratorInstance.setBorrowLimitPerLendingAsset(
                lendingToken,
                exp.sub(1)
            );
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await plpWTGInstance.deposit({ value: addingAmount });
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.be.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
        });
        it("39. Failure: Should revert when totalBorrowPerLendingToken > borrowLimitPerLendingToken, isLeveragePosition == TRUE and addingAmount == 0", async function () {
            
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let depositAmount = ethers.utils.parseEther("0.1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    msgValue = addingAmount;
                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowUSDCAmount,
                        0,
                        ethers.constants.AddressZero,
                        [
                            await factory.getPair(usdcAddress, prj1Address),
                            await factory.getPair(prj1Address, wethAddress)
                        ]
                    );
                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        { value: msgValue }
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("10000", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            await plpModeratorInstance.setBorrowLimitPerLendingAsset(
                usdc.address,
                exp.sub(1)
            );
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await plpWTGInstance.deposit({ value: addingAmount });
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
        });
        it("40. Success (Single-user): Should borrow 500 USDC when isLeveragePosition == FALSE and addingAmount > 0", async function () {
            
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let depositAmount = ethers.utils.parseEther("0.1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);

            let isLeveragePositionBeforeLeverage = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePositionBeforeLeverage).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            let balanceETHBeforeLeverage = await deployMaster.getBalance();
            let allowanceProjectTokenBeforeLeverage = await weth.allowance(deployMaster.address, plpLeverageAddress);
            let allowanceLendingTokenBeforeLeverage = await usdc.allowance(deployMaster.address, plpLeverageAddress);
            let totalOutstandingBeforeLeverage = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowBeforeLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerCollateralBeforeLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
            let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
            let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            let tx = await plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            );
            let receipt = await tx.wait();
            let cumulativeGasUsed = receipt.cumulativeGasUsed;
            let effectiveGasPrice = receipt.effectiveGasPrice;
            let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);
            let args;

            for (let log of receipt.logs) {
                try {
                    let decodedLog = plpLeverageInstance.interface.parseLog(log);
                    if (decodedLog.name === "LeveragedBorrow") args = decodedLog.args;
                } catch (error) { }
            }

            let isLeveragePositionAfterLeverage = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let balanceETHAfterLeverage = await deployMaster.getBalance();
            let allowanceProjectTokenAfterLeverage = await weth.allowance(deployMaster.address, plpLeverageAddress);
            let allowanceLendingTokenAfterLeverage = await usdc.allowance(deployMaster.address, plpLeverageAddress);
            let totalOutstandingAfterLeverage = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowAfterLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerCollateralAfterLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
            let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
            let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(isLeveragePositionAfterLeverage).to.eq(true);
            expect(balanceETHAfterLeverage).to.eq(balanceETHBeforeLeverage.sub(addingAmount).sub(transactionFee));
            expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
            expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
            expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
            expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
            expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
        });
        it("40. Success (Multi-user): Should borrow 500 USDC when isLeveragePosition == FALSE and addingAmount > 0", async function () {
            
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                for (let i = 0; i < signers.length; i++) {
                    let depositAmount = ethers.utils.parseEther("0.1");
                    await plpWTGInstance.connect(signers[i]).deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
                exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                msgValue = addingAmount;
                buyCalldata = await createSellCallData(
                    lendingToken,
                    borrowUSDCAmount,
                    0,
                    ethers.constants.AddressZero,
                    [
                        await factory.getPair(usdcAddress, prj1Address),
                        await factory.getPair(prj1Address, wethAddress)
                    ]
                );
                await weth.connect(signers[i]).approve(plpLeverageInstance.address, addingAmount);
                await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowUSDCAmount);

                let isLeveragePositionBeforeLeverage = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);
                let currentLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                expect(addingAmount).to.gt(0);
                expect(isLeveragePositionBeforeLeverage).to.eq(false);
                expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

                let balanceETHBeforeLeverage = await signers[i].getBalance();
                let allowanceProjectTokenBeforeLeverage = await weth.allowance(signers[i].address, plpLeverageAddress);
                let allowanceLendingTokenBeforeLeverage = await usdc.allowance(signers[i].address, plpLeverageAddress);
                let totalOutstandingBeforeLeverage = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowBeforeLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerCollateralBeforeLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
                let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
                let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

                let tx = await plpWTGInstance.connect(signers[i]).leveragedBorrowWithProjectETH(
                    lendingToken,
                    exp,
                    margin,
                    buyCalldata,
                    type,
                    { value: msgValue }
                );
                let receipt = await tx.wait();
                let cumulativeGasUsed = receipt.cumulativeGasUsed;
                let effectiveGasPrice = receipt.effectiveGasPrice;
                let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);
                let args;

                for (let log of receipt.logs) {
                    try {
                        let decodedLog = plpLeverageInstance.interface.parseLog(log);
                        if (decodedLog.name === "LeveragedBorrow") args = decodedLog.args;
                    } catch (error) { }
                }

                let isLeveragePositionAfterLeverage = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);
                let balanceETHAfterLeverage = await signers[i].getBalance();
                let allowanceProjectTokenAfterLeverage = await weth.allowance(signers[i].address, plpLeverageAddress);
                let allowanceLendingTokenAfterLeverage = await usdc.allowance(signers[i].address, plpLeverageAddress);
                let totalOutstandingAfterLeverage = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowAfterLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerCollateralAfterLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
                let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
                let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(isLeveragePositionAfterLeverage).to.eq(true);
                expect(balanceETHAfterLeverage).to.eq(balanceETHBeforeLeverage.sub(addingAmount).sub(transactionFee));
                expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
                expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
                expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
                expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
                expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
                expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
                expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
                expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
            }
        });
        it("41. Success (Single-user): Should borrow 500 USDC when isLeveragePosition == TRUE and addingAmount > 0", async function () {
            
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let depositAmount = ethers.utils.parseEther("0.01");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    msgValue = addingAmount;
                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowUSDCAmount,
                        0,
                        ethers.constants.AddressZero,
                        [
                            await factory.getPair(usdcAddress, prj1Address),
                            await factory.getPair(prj1Address, wethAddress)
                        ]
                    );
                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        { value: msgValue }
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            let isLeveragePositionBeforeLeverage = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePositionBeforeLeverage).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            let balanceETHBeforeLeverage = await deployMaster.getBalance();
            let allowanceProjectTokenBeforeLeverage = await weth.allowance(deployMaster.address, plpLeverageAddress);
            let allowanceLendingTokenBeforeLeverage = await usdc.allowance(deployMaster.address, plpLeverageAddress);
            let totalOutstandingBeforeLeverage = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowBeforeLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerCollateralBeforeLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
            let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
            let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            let tx = await plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            );
            let receipt = await tx.wait();
            let cumulativeGasUsed = receipt.cumulativeGasUsed;
            let effectiveGasPrice = receipt.effectiveGasPrice;
            let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);
            let args;

            for (let log of receipt.logs) {
                try {
                    let decodedLog = plpLeverageInstance.interface.parseLog(log);
                    if (decodedLog.name === "LeveragedBorrow") args = decodedLog.args;
                } catch (error) { }
            }

            let isLeveragePositionAfterLeverage = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let balanceETHAfterLeverage = await deployMaster.getBalance();
            let allowanceProjectTokenAfterLeverage = await weth.allowance(deployMaster.address, plpLeverageAddress);
            let allowanceLendingTokenAfterLeverage = await usdc.allowance(deployMaster.address, plpLeverageAddress);
            let totalOutstandingAfterLeverage = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowAfterLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerCollateralAfterLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
            let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
            let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(isLeveragePositionAfterLeverage).to.eq(true);
            expect(balanceETHAfterLeverage).to.eq(balanceETHBeforeLeverage.sub(addingAmount).sub(transactionFee));
            expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
            expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
            expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
            expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
            expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
        });
        it("41. Success (Multi-user): Should borrow 500 USDC when isLeveragePosition == TRUE and addingAmount > 0", async function () {
            
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let supplyAmount = ethers.utils.parseUnits("1000000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                for (let i = 0; i < signers.length; i++) {
                    {
                        let depositAmount = ethers.utils.parseEther("0.01");
                        await plpWTGInstance.connect(signers[i]).deposit({ value: depositAmount });
                    }
                    {
                        let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                        exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                        margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                        addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                        msgValue = addingAmount;
                        await weth.connect(signers[i]).approve(plpLeverageInstance.address, addingAmount);
                        await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowUSDCAmount);
                        buyCalldata = await createSellCallData(
                            lendingToken,
                            borrowUSDCAmount,
                            0,
                            ethers.constants.AddressZero,
                            [
                                await factory.getPair(usdcAddress, prj1Address),
                                await factory.getPair(prj1Address, wethAddress)
                            ]
                        );
                        await plpWTGInstance.connect(signers[i]).leveragedBorrowWithProjectETH(
                            lendingToken,
                            exp,
                            margin,
                            buyCalldata,
                            type,
                            { value: msgValue }
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
                exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                msgValue = addingAmount;
                await weth.connect(signers[i]).approve(plpLeverageInstance.address, addingAmount);
                await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowUSDCAmount);
                buyCalldata = await createSellCallData(
                    lendingToken,
                    borrowUSDCAmount,
                    0,
                    ethers.constants.AddressZero,
                    [
                        await factory.getPair(usdcAddress, prj1Address),
                        await factory.getPair(prj1Address, wethAddress)
                    ]
                );
                let isLeveragePositionBeforeLeverage = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);
                let currentLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                expect(addingAmount).to.gt(0);
                expect(isLeveragePositionBeforeLeverage).to.eq(true);
                expect(currentLendingToken).to.eq(lendingToken);

                let balanceETHBeforeLeverage = await signers[i].getBalance();
                let allowanceProjectTokenBeforeLeverage = await weth.allowance(signers[i].address, plpLeverageAddress);
                let allowanceLendingTokenBeforeLeverage = await usdc.allowance(signers[i].address, plpLeverageAddress);
                let totalOutstandingBeforeLeverage = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowBeforeLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerCollateralBeforeLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
                let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
                let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

                let tx = await plpWTGInstance.connect(signers[i]).leveragedBorrowWithProjectETH(
                    lendingToken,
                    exp,
                    margin,
                    buyCalldata,
                    type,
                    { value: msgValue }
                );
                let receipt = await tx.wait();
                let cumulativeGasUsed = receipt.cumulativeGasUsed;
                let effectiveGasPrice = receipt.effectiveGasPrice;
                let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);
                let args;

                for (let log of receipt.logs) {
                    try {
                        let decodedLog = plpLeverageInstance.interface.parseLog(log);
                        if (decodedLog.name === "LeveragedBorrow") args = decodedLog.args;
                    } catch (error) { }
                }

                let isLeveragePositionAfterLeverage = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);
                let balanceETHAfterLeverage = await signers[i].getBalance();
                let allowanceProjectTokenAfterLeverage = await weth.allowance(signers[i].address, plpLeverageAddress);
                let allowanceLendingTokenAfterLeverage = await usdc.allowance(signers[i].address, plpLeverageAddress);
                let totalOutstandingAfterLeverage = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowAfterLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerCollateralAfterLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
                let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
                let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(isLeveragePositionAfterLeverage).to.eq(true);
                expect(balanceETHAfterLeverage).to.eq(balanceETHBeforeLeverage.sub(addingAmount).sub(transactionFee));
                expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
                expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
                expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
                expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
                expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
                expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
                expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
                expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
            }
        });
        it("42. Success (Single-user): Should borrow 500 USDC when isLeveragePosition == FALSE and addingAmount == 0", async function () {
            
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let depositAmount = ethers.utils.parseEther("0.1");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await plpWTGInstance.deposit({ value: addingAmount });
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);

            let isLeveragePositionBeforeLeverage = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePositionBeforeLeverage).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            let balanceETHBeforeLeverage = await deployMaster.getBalance();
            let allowanceLendingTokenBeforeLeverage = await usdc.allowance(deployMaster.address, plpLeverageAddress);
            let totalOutstandingBeforeLeverage = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowBeforeLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerCollateralBeforeLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
            let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
            let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            let tx = await plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            );
            let receipt = await tx.wait();
            let cumulativeGasUsed = receipt.cumulativeGasUsed;
            let effectiveGasPrice = receipt.effectiveGasPrice;
            let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);
            let args;

            for (let log of receipt.logs) {
                try {
                    let decodedLog = plpLeverageInstance.interface.parseLog(log);
                    if (decodedLog.name === "LeveragedBorrow") args = decodedLog.args;
                } catch (error) { }
            }

            let isLeveragePositionAfterLeverage = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let balanceETHAfterLeverage = await deployMaster.getBalance();
            let allowanceLendingTokenAfterLeverage = await usdc.allowance(deployMaster.address, plpLeverageAddress);
            let totalOutstandingAfterLeverage = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowAfterLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerCollateralAfterLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
            let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
            let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(isLeveragePositionAfterLeverage).to.eq(true);
            expect(balanceETHAfterLeverage).to.eq(balanceETHBeforeLeverage.sub(addingAmount).sub(transactionFee));
            expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
            expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
            expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
            expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
            expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
        });
        it("42. Success (Multi-user): Should borrow 500 USDC when isLeveragePosition == FALSE and addingAmount == 0", async function () {
            
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                for (let i = 0; i < signers.length; i++) {
                    let depositAmount = ethers.utils.parseEther("0.1");
                    await plpWTGInstance.connect(signers[i]).deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
                exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                await plpWTGInstance.connect(signers[i]).deposit({ value: addingAmount });
                addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                msgValue = addingAmount;
                buyCalldata = await createSellCallData(
                    lendingToken,
                    borrowUSDCAmount,
                    0,
                    ethers.constants.AddressZero,
                    [
                        await factory.getPair(usdcAddress, prj1Address),
                        await factory.getPair(prj1Address, wethAddress)
                    ]
                );
                await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowUSDCAmount);

                let isLeveragePositionBeforeLeverage = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);
                let currentLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                expect(addingAmount).to.eq(0);
                expect(isLeveragePositionBeforeLeverage).to.eq(false);
                expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

                let balanceETHBeforeLeverage = await signers[i].getBalance();
                let allowanceLendingTokenBeforeLeverage = await usdc.allowance(signers[i].address, plpLeverageAddress);
                let totalOutstandingBeforeLeverage = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowBeforeLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerCollateralBeforeLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
                let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
                let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

                let tx = await plpWTGInstance.connect(signers[i]).leveragedBorrowWithProjectETH(
                    lendingToken,
                    exp,
                    margin,
                    buyCalldata,
                    type,
                    { value: msgValue }
                );
                let receipt = await tx.wait();
                let cumulativeGasUsed = receipt.cumulativeGasUsed;
                let effectiveGasPrice = receipt.effectiveGasPrice;
                let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);
                let args;

                for (let log of receipt.logs) {
                    try {
                        let decodedLog = plpLeverageInstance.interface.parseLog(log);
                        if (decodedLog.name === "LeveragedBorrow") args = decodedLog.args;
                    } catch (error) { }
                }

                let isLeveragePositionAfterLeverage = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);
                let balanceETHAfterLeverage = await signers[i].getBalance();
                let allowanceLendingTokenAfterLeverage = await usdc.allowance(signers[i].address, plpLeverageAddress);
                let totalOutstandingAfterLeverage = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowAfterLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerCollateralAfterLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
                let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
                let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(isLeveragePositionAfterLeverage).to.eq(true);
                expect(balanceETHAfterLeverage).to.eq(balanceETHBeforeLeverage.sub(addingAmount).sub(transactionFee));
                expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
                expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
                expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
                expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
                expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
                expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
                expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
            }
        });
        it("43. Success (Single-user): Should borrow 500 USDC when isLeveragePosition == TRUE and addingAmount == 0", async function () {
            
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let depositAmount = ethers.utils.parseEther("0.01");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                    addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    msgValue = addingAmount;
                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowUSDCAmount,
                        0,
                        ethers.constants.AddressZero,
                        [
                            await factory.getPair(usdcAddress, prj1Address),
                            await factory.getPair(prj1Address, wethAddress)
                        ]
                    );
                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        { value: msgValue }
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await plpWTGInstance.deposit({ value: addingAmount });
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            msgValue = addingAmount;
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [
                    await factory.getPair(usdcAddress, prj1Address),
                    await factory.getPair(prj1Address, wethAddress)
                ]
            );
            let isLeveragePositionBeforeLeverage = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePositionBeforeLeverage).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            let balanceETHBeforeLeverage = await deployMaster.getBalance();
            let allowanceLendingTokenBeforeLeverage = await usdc.allowance(deployMaster.address, plpLeverageAddress);
            let totalOutstandingBeforeLeverage = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowBeforeLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerCollateralBeforeLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
            let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
            let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            let tx = await plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                { value: msgValue }
            );
            let receipt = await tx.wait();
            let cumulativeGasUsed = receipt.cumulativeGasUsed;
            let effectiveGasPrice = receipt.effectiveGasPrice;
            let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);
            let args;

            for (let log of receipt.logs) {
                try {
                    let decodedLog = plpLeverageInstance.interface.parseLog(log);
                    if (decodedLog.name === "LeveragedBorrow") args = decodedLog.args;
                } catch (error) { }
            }

            let isLeveragePositionAfterLeverage = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let balanceETHAfterLeverage = await deployMaster.getBalance();
            let allowanceLendingTokenAfterLeverage = await usdc.allowance(deployMaster.address, plpLeverageAddress);
            let totalOutstandingAfterLeverage = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowAfterLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerCollateralAfterLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
            let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
            let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(isLeveragePositionAfterLeverage).to.eq(true);
            expect(balanceETHAfterLeverage).to.eq(balanceETHBeforeLeverage.sub(addingAmount).sub(transactionFee));
            expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
            expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
            expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
            expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
            expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
        });
        it("43. Success (Multi-user): Should borrow 500 USDC when isLeveragePosition == TRUE and addingAmount == 0", async function () {
            
            await loadFixture();
            await createPairPrj1AndWETH();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            let msgValue;
            {
                {
                    let supplyAmount = ethers.utils.parseUnits("1000000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                for (let i = 0; i < signers.length; i++) {
                    {
                        let depositAmount = ethers.utils.parseEther("0.01");
                        await plpWTGInstance.connect(signers[i]).deposit({ value: depositAmount });
                    }
                    {
                        let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                        exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                        margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                        addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                        msgValue = addingAmount;
                        await weth.connect(signers[i]).approve(plpLeverageInstance.address, addingAmount);
                        await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowUSDCAmount);
                        buyCalldata = await createSellCallData(
                            lendingToken,
                            borrowUSDCAmount,
                            0,
                            ethers.constants.AddressZero,
                            [
                                await factory.getPair(usdcAddress, prj1Address),
                                await factory.getPair(prj1Address, wethAddress)
                            ]
                        );
                        await plpWTGInstance.connect(signers[i]).leveragedBorrowWithProjectETH(
                            lendingToken,
                            exp,
                            margin,
                            buyCalldata,
                            type,
                            { value: msgValue }
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
                exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(50), toBN(10), exp);
                addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                await plpWTGInstance.connect(signers[i]).deposit({ value: addingAmount });
                addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                msgValue = addingAmount;
                await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowUSDCAmount);
                buyCalldata = await createSellCallData(
                    lendingToken,
                    borrowUSDCAmount,
                    0,
                    ethers.constants.AddressZero,
                    [
                        await factory.getPair(usdcAddress, prj1Address),
                        await factory.getPair(prj1Address, wethAddress)
                    ]
                );
                let isLeveragePositionBeforeLeverage = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);
                let currentLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                expect(addingAmount).to.eq(0);
                expect(isLeveragePositionBeforeLeverage).to.eq(true);
                expect(currentLendingToken).to.eq(lendingToken);

                let balanceETHBeforeLeverage = await signers[i].getBalance();
                let allowanceLendingTokenBeforeLeverage = await usdc.allowance(signers[i].address, plpLeverageAddress);
                let totalOutstandingBeforeLeverage = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowBeforeLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerCollateralBeforeLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
                let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
                let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

                let tx = await plpWTGInstance.connect(signers[i]).leveragedBorrowWithProjectETH(
                    lendingToken,
                    exp,
                    margin,
                    buyCalldata,
                    type,
                    { value: msgValue }
                );
                let receipt = await tx.wait();
                let cumulativeGasUsed = receipt.cumulativeGasUsed;
                let effectiveGasPrice = receipt.effectiveGasPrice;
                let transactionFee = cumulativeGasUsed.mul(effectiveGasPrice);
                let args;

                for (let log of receipt.logs) {
                    try {
                        let decodedLog = plpLeverageInstance.interface.parseLog(log);
                        if (decodedLog.name === "LeveragedBorrow") args = decodedLog.args;
                    } catch (error) { }
                }

                let isLeveragePositionAfterLeverage = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);
                let balanceETHAfterLeverage = await signers[i].getBalance();
                let allowanceLendingTokenAfterLeverage = await usdc.allowance(signers[i].address, plpLeverageAddress);
                let totalOutstandingAfterLeverage = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowAfterLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerCollateralAfterLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
                let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
                let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(isLeveragePositionAfterLeverage).to.eq(true);
                expect(balanceETHAfterLeverage).to.eq(balanceETHBeforeLeverage.sub(addingAmount).sub(transactionFee));
                expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
                expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
                expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
                expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
                expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
                expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
                expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
            }
        });
    });

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
            value = ethers.utils.parseEther("100");
            await weth.connect(deployMaster).approve(bLendingTokenAddress, value);

            masterEthBalance = await hre.ethers.provider.getBalance(masterAddress);
            wethBalanceBeforeSupply = await hre.ethers.provider.getBalance(wethAddress);
            totalSupplyTokenBeforeSupply = await bLendingTokenInstance.totalSupply();
            balanceBLendingTokenUserBeforeSupply = await bLendingTokenInstance.balanceOf(masterAddress);
            allowanceLendingTokenBeforeSupply = await weth.allowance(masterAddress, bLendingTokenAddress);

            let supplyTx = await (plpWTGInstance.supply({ value }));
            let receipt = await supplyTx.wait();
            let args;

            // Get the Supply event arguments
            for (let log of receipt.logs) {
                try {
                    let decodedLog = plpInstance.interface.parseLog(log);
                    if (decodedLog.name === "Supply") args = decodedLog.args;
                } catch (error) { }
            }

            mintedAmount = args.amountSupplyBTokenReceived;
            exchangedMintedAmount = mintedAmount.div(exchangeRate);

            masterEthBalance = await hre.ethers.provider.getBalance(masterAddress);
            wethBalanceAfterSupply = await hre.ethers.provider.getBalance(wethAddress);
            totalSupplyTokenAfterSupply = await bLendingTokenInstance.totalSupply();
            balanceBLendingTokenUserAfterSupply = await bLendingTokenInstance.balanceOf(masterAddress);
            allowanceLendingTokenAfterSupply = await weth.allowance(masterAddress, bLendingTokenAddress);

            expect(wethBalanceBeforeSupply).to.eq(wethBalanceAfterSupply.sub(value));
            expect(totalSupplyTokenBeforeSupply).to.eq(totalSupplyTokenAfterSupply.sub(exchangedMintedAmount));
            expect(balanceBLendingTokenUserBeforeSupply).to.eq(balanceBLendingTokenUserAfterSupply.sub(exchangedMintedAmount));
            expect(allowanceLendingTokenBeforeSupply).to.eq(allowanceLendingTokenAfterSupply.add(value));
        });
    });

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

            bLendingTokenAmount = ethers.utils.parseEther("100");
            exchangedBLendingToken = ethers.utils.parseEther((100 / exchangeRate).toString());

            // Supply weth token
            await weth.connect(deployMaster).approve(bLendingTokenAddress, bLendingTokenAmount);
            await weth.connect(deployMaster).approve(plpWTGAddress, bLendingTokenAmount);
            await plpWTGInstance.supply({ value: bLendingTokenAmount });

            masterEthBalanceBeforeRedeem = await hre.ethers.provider.getBalance(masterAddress);
            wethBalanceBeforeRedeem = await hre.ethers.provider.getBalance(wethAddress);
            balanceOfBLendingTokenBeforeRedeem = await weth.balanceOf(bLendingTokenAddress);
            balanceOfBLendingTokenUserBeforeRedeem = await bLendingTokenInstance.balanceOf(masterAddress);

            await expect(plpWTGInstance.redeem(
                exchangedBLendingToken
            )).to.emit(plpInstance, 'Redeem').withArgs(masterAddress, wethAddress, bLendingTokenAddress, exchangedBLendingToken);

            masterEthBalanceAfterRedeem = await hre.ethers.provider.getBalance(masterAddress);
            wethBalanceAfterRedeem = await hre.ethers.provider.getBalance(wethAddress);
            balanceOfBLendingTokenAfterRedeem = await weth.balanceOf(bLendingTokenAddress);
            balanceOfBLendingTokenUserAfterRedeem = await bLendingTokenInstance.balanceOf(masterAddress);

            expect(wethBalanceBeforeRedeem).to.eq(wethBalanceAfterRedeem.add(bLendingTokenAmount));
            expect(balanceOfBLendingTokenBeforeRedeem).to.eq(balanceOfBLendingTokenAfterRedeem.add(bLendingTokenAmount));
            expect(balanceOfBLendingTokenUserBeforeRedeem).to.eq(balanceOfBLendingTokenUserAfterRedeem.add(exchangedBLendingToken));
        });
    });

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
            balanceOfBLendingTokenBeforeRedeemUnderlying = await weth.balanceOf(bLendingTokenAddress);
            balanceOfBLendingTokenUserBeforeRedeemUnderlying = await bLendingTokenInstance.balanceOf(masterAddress);

            await expect(plpWTGInstance.redeemUnderlying(
                lendingTokenAmount
            )).to.emit(plpInstance, 'RedeemUnderlying').withArgs(masterAddress, wethAddress, bLendingTokenAddress, lendingTokenAmount);

            masterEthBalanceAfterRedeemUnderlying = await hre.ethers.provider.getBalance(masterAddress);
            wethBalanceAfterRedeemUnderlying = await hre.ethers.provider.getBalance(wethAddress);
            balanceOfBLendingTokenAfterRedeemUnderlying = await weth.balanceOf(bLendingTokenAddress);
            balanceOfBLendingTokenUserAfterRedeemUnderlying = await bLendingTokenInstance.balanceOf(masterAddress);

            expect(wethBalanceBeforeRedeemUnderlying).to.eq(wethBalanceAfterRedeemUnderlying.add(lendingTokenAmount));
            expect(balanceOfBLendingTokenBeforeRedeemUnderlying).to.eq(balanceOfBLendingTokenAfterRedeemUnderlying.add(lendingTokenAmount));
            expect(balanceOfBLendingTokenUserBeforeRedeemUnderlying).to.eq(balanceOfBLendingTokenUserAfterRedeemUnderlying.add(exchangedLendingToken));
        });
    });

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

        it("2. Failure: Should throw error when isProjectTokenListed = FALSE", async function () {
            projectTokenAddress = ethers.constants.AddressZero;
            lendingTokenAmount = ethers.utils.parseEther("100");
            await expect(plpWTGInstance.repay(
                projectTokenAddress,
                lendingTokenAmount,
                { value: ethers.utils.parseEther("100") }
            )).to.be.revertedWith("PIT: Project token is not listed");
        });

        it("3. Failure: Should throw error when lendingTokenAmount < 0", async function () {
            lendingTokenAmount = -1;
            expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: ethers.utils.parseEther("100") }
            )).to.throw;
        });

        it("4. Failure: Should throw error when lendingTokenAmount > maxUint256", async function () {
            lendingTokenAmount = ethers.constants.MaxUint256.add(toBN(1));
            expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: ethers.utils.parseEther("100") }
            )).to.throw;
        });

        it("5. Failure: Should throw error lendingTokenAmount is not uint256", async function () {
            lendingTokenAmount = 1.1;
            expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: ethers.utils.parseEther("100") }
            )).to.throw;
        });

        it("6. Failure: Should throw error when msg.value < 0", async function () {
            lendingTokenAmount = ethers.utils.parseEther("100");
            expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: -1 }
            )).to.throw;
        });

        it("7. Failure: Should throw error when msg.value > maxUint256", async function () {
            lendingTokenAmount = ethers.utils.parseEther("100");
            expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: ethers.constants.MaxUint256.add(toBN(1)) }
            )).to.throw;
        });

        it("8. Failure: Should throw error when msg.value is not uint", async function () {
            lendingTokenAmount = ethers.utils.parseEther("100");
            expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: 1.1 }
            )).to.throw;
        });

        it("9. Failure: Should revert when msg.value = 0", async function () {
            lendingTokenAmount = ethers.utils.parseEther("100");
            await expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: 0 }
            )).to.be.revertedWith("PIT: LendingTokenAmount==0");
        });

        it("10. Failure: Should revert when lendingTokenAmount = 0", async function () {
            lendingTokenAmount = ethers.utils.parseEther("0");
            await expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: lendingTokenAmount }
            )).to.be.revertedWith("PIT: LendingTokenAmount==0");
        });

        it("11. Failure: Should revert when borrowPositionAmount = 0", async function () {
            lendingTokenAmount = ethers.utils.parseEther("100");
            await expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: lendingTokenAmount }
            )).to.be.revertedWith("PIT: LendingTokenAmount==0");
        });

        describe("Repay with isLeveragePosition = FALSE cases:", async function () {
            beforeEach(async function () {
                await loadFixture();
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
                        // borrow prj1
                        let borrowAmount = await plpInstance.getLendingAvailableToBorrow(masterAddress, prj1Address, wethAddress);
                        await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                        await plpWTGInstance.borrow(prj1Address, borrowAmount);
                    }
                }
            });

            describe("12. Repay with borrowPositionAmount = 1", function () {
                it("12.1. Failure: Should revert when value < repayment amount", async function () {
                    totalOutstanding = await plpWTGInstance.getTotalOutstanding(masterAddress, prj1Address);
                    lendingTokenAmount = totalOutstanding;
                    value = totalOutstanding.sub(toBN(100));
                    await expect(plpWTGInstance.repay(
                        prj1Address, lendingTokenAmount, { value }
                    )).to.be.revertedWith("WTG: Msg value is less than repayment amount");
                });

                it("12.2. Success: Repay with borrowBalanceStored < lendingTokenAmount", async function () {
                    borrowBalanceStored = await bToken.borrowBalanceStored(masterAddress);
                    totalOutstanding = await plpInstance.totalOutstanding(masterAddress, prj1Address, wethAddress);
                    lendingTokenAmount = borrowBalanceStored.add(toBN(100));
                    weth.connect(deployMaster).approve(plpWTGAddress, lendingTokenAmount);

                    let ethBalanceOfUserBeforeRepay = await hre.ethers.provider.getBalance(masterAddress);
                    let ethBalanceOfLendingTokenBeforeRepay = await hre.ethers.provider.getBalance(wethAddress);
                    let wethBalanceOfBLendingTokenBeforeRepay = await weth.balanceOf(bLendingTokenAddress);
                    let totalBorrowedWethTokenBeforeRepay = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.totalBorrow(prj1Address, wethAddress);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(masterAddress, prj1Address, wethAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                    let repayTx = await plpWTGInstance.repay(prj1Address, lendingTokenAmount, { value: lendingTokenAmount });
                    let receipt = await repayTx.wait();
                    let args;

                    // Get the RepayBorrow event arguments
                    for (let log of receipt.logs) {
                        try {
                            let decodedLog = plpInstance.interface.parseLog(log);
                            if (decodedLog.name === "RepayBorrow") args = decodedLog.args;
                        } catch (error) { }
                    }

                    let ethBalanceOfUserAfterRepay = await hre.ethers.provider.getBalance(masterAddress);
                    let ethBalanceOfLendingTokenAfterRepay = await hre.ethers.provider.getBalance(wethAddress);
                    let wethBalanceOfBLendingTokenAfterRepay = await weth.balanceOf(bLendingTokenAddress);
                    let totalBorrowedWethTokenAfterRepay = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                    let totalBorrowPrj1AfterRepay = await plpInstance.totalBorrow(prj1Address, wethAddress);
                    let borrowPositionAfterRepay = await plpInstance.borrowPosition(masterAddress, prj1Address, wethAddress);
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                    expect(ethBalanceOfLendingTokenBeforeRepay).to.eq(ethBalanceOfLendingTokenAfterRepay.sub(args.borrowAmount));
                    expect(wethBalanceOfBLendingTokenBeforeRepay).to.eq(wethBalanceOfBLendingTokenAfterRepay.sub(args.borrowAmount));
                    expect(totalBorrowedWethTokenBeforeRepay).to.eq(totalBorrowedWethTokenAfterRepay.add(args.borrowAmount));
                    expect(totalBorrowPrj1BeforeRepay).to.eq(totalBorrowPrj1AfterRepay.add(args.borrowAmount));
                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(borrowBalanceStored);
                    expect(args.isPositionFullyRepaid).to.eq(true);
                });

                it("12.3. Success: Repay with borrowBalanceStored >= lendingTokenAmount && _totalOutstanding >= lendingTokenAmount", async function () {
                    borrowBalanceStored = await bToken.borrowBalanceStored(masterAddress);
                    totalOutstanding = await plpInstance.totalOutstanding(masterAddress, prj1Address, wethAddress);
                    lendingTokenAmount = borrowBalanceStored.sub(toBN(100));
                    weth.connect(deployMaster).approve(plpWTGAddress, lendingTokenAmount);

                    let ethBalanceOfUserBeforeRepay = await hre.ethers.provider.getBalance(masterAddress);
                    let ethBalanceOfLendingTokenBeforeRepay = await hre.ethers.provider.getBalance(wethAddress);
                    let wethBalanceOfBLendingTokenBeforeRepay = await weth.balanceOf(bLendingTokenAddress);
                    let totalBorrowedWethTokenBeforeRepay = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.totalBorrow(prj1Address, wethAddress);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(masterAddress, prj1Address, wethAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                    let repayTx = await plpWTGInstance.repay(prj1Address, lendingTokenAmount, { value: lendingTokenAmount });
                    let receipt = await repayTx.wait();
                    let args;

                    // Get the RepayBorrow event arguments
                    for (let log of receipt.logs) {
                        try {
                            let decodedLog = plpInstance.interface.parseLog(log);
                            if (decodedLog.name === "RepayBorrow") args = decodedLog.args;
                        } catch (error) { }
                    }

                    let ethBalanceOfUserAfterRepay = await hre.ethers.provider.getBalance(masterAddress);
                    let ethBalanceOfLendingTokenAfterRepay = await hre.ethers.provider.getBalance(wethAddress);
                    let wethBalanceOfBLendingTokenAfterRepay = await weth.balanceOf(bLendingTokenAddress);
                    let totalBorrowedWethTokenAfterRepay = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                    let totalBorrowPrj1AfterRepay = await plpInstance.totalBorrow(prj1Address, wethAddress);
                    let borrowPositionAfterRepay = await plpInstance.borrowPosition(masterAddress, prj1Address, wethAddress);
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                    expect(ethBalanceOfLendingTokenBeforeRepay).to.eq(ethBalanceOfLendingTokenAfterRepay.sub(args.borrowAmount));
                    expect(wethBalanceOfBLendingTokenBeforeRepay).to.eq(wethBalanceOfBLendingTokenAfterRepay.sub(args.borrowAmount));
                    expect(totalBorrowedWethTokenBeforeRepay).to.eq(totalBorrowedWethTokenAfterRepay.add(args.borrowAmount));
                    expect(totalBorrowPrj1BeforeRepay).to.eq(totalBorrowPrj1AfterRepay.add(args.borrowAmount));
                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(lendingTokenAmount);
                    expect(args.isPositionFullyRepaid).to.eq(false);
                });
            });

            describe("13. Repay with borrowPositionAmount > 1", function () {
                beforeEach(async function () {
                    // borrow prj2
                    let borrowAmount = await plpInstance.getLendingAvailableToBorrow(masterAddress, prj2Address, wethAddress);
                    await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                    await plpWTGInstance.borrow(prj2Address, borrowAmount);
                });

                it("13.1. Success: Repay with _totalOutstanding < lendingTokenAmount", async function () {
                    borrowBalanceStored = await bToken.borrowBalanceStored(masterAddress);
                    totalOutstanding = await plpInstance.totalOutstanding(masterAddress, prj1Address, wethAddress);
                    lendingTokenAmount = totalOutstanding.add(toBN(100));
                    weth.connect(deployMaster).approve(plpWTGAddress, lendingTokenAmount);

                    let ethBalanceOfUserBeforeRepay = await hre.ethers.provider.getBalance(masterAddress);
                    let ethBalanceOfLendingTokenBeforeRepay = await hre.ethers.provider.getBalance(wethAddress);
                    let wethBalanceOfBLendingTokenBeforeRepay = await weth.balanceOf(bLendingTokenAddress);
                    let totalBorrowedWethTokenBeforeRepay = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.totalBorrow(prj1Address, wethAddress);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(masterAddress, prj1Address, wethAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                    let repayTx = await plpWTGInstance.repay(prj1Address, lendingTokenAmount, { value: lendingTokenAmount });
                    let receipt = await repayTx.wait();
                    let args;

                    // Get the RepayBorrow event arguments
                    for (let log of receipt.logs) {
                        try {
                            let decodedLog = plpInstance.interface.parseLog(log);
                            if (decodedLog.name === "RepayBorrow") args = decodedLog.args;
                        } catch (error) { }
                    }

                    let ethBalanceOfUserAfterRepay = await hre.ethers.provider.getBalance(masterAddress);
                    let ethBalanceOfLendingTokenAfterRepay = await hre.ethers.provider.getBalance(wethAddress);
                    let wethBalanceOfBLendingTokenAfterRepay = await weth.balanceOf(bLendingTokenAddress);
                    let totalBorrowedWethTokenAfterRepay = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                    let totalBorrowPrj1AfterRepay = await plpInstance.totalBorrow(prj1Address, wethAddress);
                    let borrowPositionAfterRepay = await plpInstance.borrowPosition(masterAddress, prj1Address, wethAddress);
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                    expect(ethBalanceOfLendingTokenBeforeRepay).to.eq(ethBalanceOfLendingTokenAfterRepay.sub(args.borrowAmount));
                    expect(wethBalanceOfBLendingTokenBeforeRepay).to.eq(wethBalanceOfBLendingTokenAfterRepay.sub(args.borrowAmount));
                    expect(totalBorrowedWethTokenBeforeRepay).to.eq(totalBorrowedWethTokenAfterRepay.add(args.borrowAmount));
                    expect(totalBorrowPrj1BeforeRepay).to.eq(totalBorrowPrj1AfterRepay.add(args.borrowAmount));
                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(totalOutstanding);
                    expect(args.isPositionFullyRepaid).to.eq(true);
                });

                it("13.2. Success: Repay with _totalOutstanding >= lendingTokenAmount", async function () {

                    borrowBalanceStored = await bToken.borrowBalanceStored(masterAddress);
                    totalOutstanding = await plpInstance.totalOutstanding(masterAddress, prj1Address, wethAddress);
                    lendingTokenAmount = totalOutstanding.sub(toBN(100));
                    weth.connect(deployMaster).approve(plpWTGAddress, lendingTokenAmount);

                    let ethBalanceOfUserBeforeRepay = await hre.ethers.provider.getBalance(masterAddress);
                    let ethBalanceOfLendingTokenBeforeRepay = await hre.ethers.provider.getBalance(wethAddress);
                    let wethBalanceOfBLendingTokenBeforeRepay = await weth.balanceOf(bLendingTokenAddress);
                    let totalBorrowedWethTokenBeforeRepay = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.totalBorrow(prj1Address, wethAddress);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(masterAddress, prj1Address, wethAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                    let repayTx = await plpWTGInstance.repay(prj1Address, lendingTokenAmount, { value: lendingTokenAmount });
                    let receipt = await repayTx.wait();
                    let args;

                    // Get the RepayBorrow event arguments
                    for (let log of receipt.logs) {
                        try {
                            let decodedLog = plpInstance.interface.parseLog(log);
                            if (decodedLog.name === "RepayBorrow") args = decodedLog.args;
                        } catch (error) { }
                    }

                    let ethBalanceOfUserAfterRepay = await hre.ethers.provider.getBalance(masterAddress);
                    let ethBalanceOfLendingTokenAfterRepay = await hre.ethers.provider.getBalance(wethAddress);
                    let wethBalanceOfBLendingTokenAfterRepay = await weth.balanceOf(bLendingTokenAddress);
                    let totalBorrowedWethTokenAfterRepay = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                    let totalBorrowPrj1AfterRepay = await plpInstance.totalBorrow(prj1Address, wethAddress);
                    let borrowPositionAfterRepay = await plpInstance.borrowPosition(masterAddress, prj1Address, wethAddress);
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                    expect(ethBalanceOfLendingTokenBeforeRepay).to.eq(ethBalanceOfLendingTokenAfterRepay.sub(args.borrowAmount));
                    expect(wethBalanceOfBLendingTokenBeforeRepay).to.eq(wethBalanceOfBLendingTokenAfterRepay.sub(args.borrowAmount));
                    expect(totalBorrowedWethTokenBeforeRepay).to.eq(totalBorrowedWethTokenAfterRepay.add(args.borrowAmount));
                    expect(totalBorrowPrj1BeforeRepay).to.eq(totalBorrowPrj1AfterRepay.add(args.borrowAmount));
                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(lendingTokenAmount);
                    expect(args.isPositionFullyRepaid).to.eq(false);
                });
            });
        });

        describe("Repay with isLeveragePosition = TRUE cases:", async function () {
            beforeEach(async function () {
                await loadFixture();
                let pair = await createPairPrj1AndWETH();
                {
                    {
                        // deposit prj1 and prj2
                        let depositPrj1Amount = ethers.utils.parseUnits("100000", prj1Decimals);
                        await prj1.mintTo(masterAddress, depositPrj1Amount.mul(10));
                        await prj1.connect(deployMaster).approve(plpAddress, depositPrj1Amount);
                        await plpInstance.deposit(prj1Address, depositPrj1Amount);

                        let depositPrj2Amount = ethers.utils.parseUnits("100000", prj2Decimals);
                        await prj2.mintTo(masterAddress, depositPrj2Amount.mul(10));
                        await prj2.connect(deployMaster).approve(plpAddress, depositPrj2Amount);
                        await plpInstance.deposit(prj2Address, depositPrj2Amount);
                    }
                    {
                        // supply weth token
                        let supplyAmount = ethers.utils.parseEther("1000"); //1000 eth
                        await weth.connect(deployMaster).approve(bLendingTokenAddress, supplyAmount);
                        await plpWTGInstance.supply({ value: supplyAmount });
                    }
                    {
                        let borrowETHAmount = ethers.utils.parseEther("5");
                        let exp = await plpInstance.getTokenEvaluation(wethAddress, borrowETHAmount);

                        let margin = await plpLeverageInstance.calculateMargin(prj1Address, wethAddress, toBN(50), toBN(10), exp);
                        await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                        await weth.connect(deployMaster).approve(plpLeverageInstance.address, borrowETHAmount);
                        let buyCalldata = await createSellCallData(
                            wethAddress,
                            borrowETHAmount,
                            0,
                            ethers.constants.AddressZero,
                            [pair.address]
                        );
                        await plpLeverageInstance.leveragedBorrow(
                            prj1Address,
                            wethAddress,
                            exp,
                            margin,
                            buyCalldata,
                            0
                        );
                    }
                }
            });

            describe("14. Repay with borrowPositionAmount = 1", function () {
                it("14.1. Failure: Should revert when value < repayment amount", async function () {
                    totalOutstanding = await plpWTGInstance.getTotalOutstanding(masterAddress, prj1Address);
                    lendingTokenAmount = totalOutstanding;
                    value = totalOutstanding.sub(toBN(100));
                    await expect(plpWTGInstance.repay(
                        prj1Address, lendingTokenAmount, { value }
                    )).to.be.revertedWith("WTG: Msg value is less than repayment amount");
                });

                it("14.2. Success: Repay with borrowBalanceStored < lendingTokenAmount", async function () {
                    borrowBalanceStored = await bToken.borrowBalanceStored(masterAddress);
                    totalOutstanding = await plpInstance.totalOutstanding(masterAddress, prj1Address, wethAddress);
                    lendingTokenAmount = borrowBalanceStored.add(toBN(100));
                    weth.connect(deployMaster).approve(plpWTGAddress, lendingTokenAmount);

                    let ethBalanceOfUserBeforeRepay = await hre.ethers.provider.getBalance(masterAddress);
                    let ethBalanceOfLendingTokenBeforeRepay = await hre.ethers.provider.getBalance(wethAddress);
                    let wethBalanceOfBLendingTokenBeforeRepay = await weth.balanceOf(bLendingTokenAddress);
                    let totalBorrowedWethTokenBeforeRepay = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.totalBorrow(prj1Address, wethAddress);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(masterAddress, prj1Address, wethAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                    let repayTx = await plpWTGInstance.repay(prj1Address, lendingTokenAmount, { value: lendingTokenAmount });
                    let receipt = await repayTx.wait();
                    let args;

                    // Get the RepayBorrow event arguments
                    for (let log of receipt.logs) {
                        try {
                            let decodedLog = plpInstance.interface.parseLog(log);
                            if (decodedLog.name === "RepayBorrow") args = decodedLog.args;
                        } catch (error) { }
                    }

                    let ethBalanceOfUserAfterRepay = await hre.ethers.provider.getBalance(masterAddress);
                    let ethBalanceOfLendingTokenAfterRepay = await hre.ethers.provider.getBalance(wethAddress);
                    let wethBalanceOfBLendingTokenAfterRepay = await weth.balanceOf(bLendingTokenAddress);
                    let totalBorrowedWethTokenAfterRepay = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                    let totalBorrowPrj1AfterRepay = await plpInstance.totalBorrow(prj1Address, wethAddress);
                    let borrowPositionAfterRepay = await plpInstance.borrowPosition(masterAddress, prj1Address, wethAddress);
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                    expect(ethBalanceOfLendingTokenBeforeRepay).to.eq(ethBalanceOfLendingTokenAfterRepay.sub(args.borrowAmount));
                    expect(wethBalanceOfBLendingTokenBeforeRepay).to.eq(wethBalanceOfBLendingTokenAfterRepay.sub(args.borrowAmount));
                    expect(totalBorrowedWethTokenBeforeRepay).to.eq(totalBorrowedWethTokenAfterRepay.add(args.borrowAmount));
                    expect(totalBorrowPrj1BeforeRepay).to.eq(totalBorrowPrj1AfterRepay.add(args.borrowAmount));
                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(borrowBalanceStored);
                    expect(args.isPositionFullyRepaid).to.eq(true);
                });

                it("14.3. Success: Repay with borrowBalanceStored >= lendingTokenAmount && _totalOutstanding >= lendingTokenAmount", async function () {
                    borrowBalanceStored = await bToken.borrowBalanceStored(masterAddress);
                    totalOutstanding = await plpInstance.totalOutstanding(masterAddress, prj1Address, wethAddress);
                    lendingTokenAmount = borrowBalanceStored.sub(toBN(100));
                    weth.connect(deployMaster).approve(plpWTGAddress, lendingTokenAmount);

                    let ethBalanceOfUserBeforeRepay = await hre.ethers.provider.getBalance(masterAddress);
                    let ethBalanceOfLendingTokenBeforeRepay = await hre.ethers.provider.getBalance(wethAddress);
                    let wethBalanceOfBLendingTokenBeforeRepay = await weth.balanceOf(bLendingTokenAddress);
                    let totalBorrowedWethTokenBeforeRepay = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.totalBorrow(prj1Address, wethAddress);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(masterAddress, prj1Address, wethAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                    let repayTx = await plpWTGInstance.repay(prj1Address, lendingTokenAmount, { value: lendingTokenAmount });
                    let receipt = await repayTx.wait();
                    let args;

                    // Get the RepayBorrow event arguments
                    for (let log of receipt.logs) {
                        try {
                            let decodedLog = plpInstance.interface.parseLog(log);
                            if (decodedLog.name === "RepayBorrow") args = decodedLog.args;
                        } catch (error) { }
                    }

                    let ethBalanceOfUserAfterRepay = await hre.ethers.provider.getBalance(masterAddress);
                    let ethBalanceOfLendingTokenAfterRepay = await hre.ethers.provider.getBalance(wethAddress);
                    let wethBalanceOfBLendingTokenAfterRepay = await weth.balanceOf(bLendingTokenAddress);
                    let totalBorrowedWethTokenAfterRepay = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                    let totalBorrowPrj1AfterRepay = await plpInstance.totalBorrow(prj1Address, wethAddress);
                    let borrowPositionAfterRepay = await plpInstance.borrowPosition(masterAddress, prj1Address, wethAddress);
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                    expect(ethBalanceOfLendingTokenBeforeRepay).to.eq(ethBalanceOfLendingTokenAfterRepay.sub(args.borrowAmount));
                    expect(wethBalanceOfBLendingTokenBeforeRepay).to.eq(wethBalanceOfBLendingTokenAfterRepay.sub(args.borrowAmount));
                    expect(totalBorrowedWethTokenBeforeRepay).to.eq(totalBorrowedWethTokenAfterRepay.add(args.borrowAmount));
                    expect(totalBorrowPrj1BeforeRepay).to.eq(totalBorrowPrj1AfterRepay.add(args.borrowAmount));
                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(lendingTokenAmount);
                    expect(args.isPositionFullyRepaid).to.eq(false);
                });
            });

            describe("15. Repay with borrowPositionAmount > 1", function () {
                beforeEach(async function () {
                    // borrow prj2
                    let borrowAmount = await plpInstance.getLendingAvailableToBorrow(masterAddress, prj2Address, wethAddress);
                    await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                    await plpWTGInstance.borrow(prj2Address, borrowAmount);
                });

                it("15.1. Success: Repay with _totalOutstanding < lendingTokenAmount", async function () {
                    borrowBalanceStored = await bToken.borrowBalanceStored(masterAddress);
                    totalOutstanding = await plpInstance.totalOutstanding(masterAddress, prj1Address, wethAddress);
                    lendingTokenAmount = totalOutstanding.add(toBN(100));
                    weth.connect(deployMaster).approve(plpWTGAddress, lendingTokenAmount);

                    let ethBalanceOfUserBeforeRepay = await hre.ethers.provider.getBalance(masterAddress);
                    let ethBalanceOfLendingTokenBeforeRepay = await hre.ethers.provider.getBalance(wethAddress);
                    let wethBalanceOfBLendingTokenBeforeRepay = await weth.balanceOf(bLendingTokenAddress);
                    let totalBorrowedWethTokenBeforeRepay = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.totalBorrow(prj1Address, wethAddress);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(masterAddress, prj1Address, wethAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                    let repayTx = await plpWTGInstance.repay(prj1Address, lendingTokenAmount, { value: lendingTokenAmount });
                    let receipt = await repayTx.wait();
                    let args;

                    // Get the RepayBorrow event arguments
                    for (let log of receipt.logs) {
                        try {
                            let decodedLog = plpInstance.interface.parseLog(log);
                            if (decodedLog.name === "RepayBorrow") args = decodedLog.args;
                        } catch (error) { }
                    }

                    let ethBalanceOfUserAfterRepay = await hre.ethers.provider.getBalance(masterAddress);
                    let ethBalanceOfLendingTokenAfterRepay = await hre.ethers.provider.getBalance(wethAddress);
                    let wethBalanceOfBLendingTokenAfterRepay = await weth.balanceOf(bLendingTokenAddress);
                    let totalBorrowedWethTokenAfterRepay = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                    let totalBorrowPrj1AfterRepay = await plpInstance.totalBorrow(prj1Address, wethAddress);
                    let borrowPositionAfterRepay = await plpInstance.borrowPosition(masterAddress, prj1Address, wethAddress);
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                    expect(ethBalanceOfLendingTokenBeforeRepay).to.eq(ethBalanceOfLendingTokenAfterRepay.sub(args.borrowAmount));
                    expect(wethBalanceOfBLendingTokenBeforeRepay).to.eq(wethBalanceOfBLendingTokenAfterRepay.sub(args.borrowAmount));
                    expect(totalBorrowedWethTokenBeforeRepay).to.eq(totalBorrowedWethTokenAfterRepay.add(args.borrowAmount));
                    expect(totalBorrowPrj1BeforeRepay).to.eq(totalBorrowPrj1AfterRepay.add(args.borrowAmount));
                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(totalOutstanding);
                    expect(args.isPositionFullyRepaid).to.eq(true);
                });

                it("15.2. Success: Repay with _totalOutstanding >= lendingTokenAmount", async function () {

                    borrowBalanceStored = await bToken.borrowBalanceStored(masterAddress);
                    totalOutstanding = await plpInstance.totalOutstanding(masterAddress, prj1Address, wethAddress);
                    lendingTokenAmount = totalOutstanding.sub(toBN(100));
                    weth.connect(deployMaster).approve(plpWTGAddress, lendingTokenAmount);

                    let ethBalanceOfUserBeforeRepay = await hre.ethers.provider.getBalance(masterAddress);
                    let ethBalanceOfLendingTokenBeforeRepay = await hre.ethers.provider.getBalance(wethAddress);
                    let wethBalanceOfBLendingTokenBeforeRepay = await weth.balanceOf(bLendingTokenAddress);
                    let totalBorrowedWethTokenBeforeRepay = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.totalBorrow(prj1Address, wethAddress);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(masterAddress, prj1Address, wethAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                    let repayTx = await plpWTGInstance.repay(prj1Address, lendingTokenAmount, { value: lendingTokenAmount });
                    let receipt = await repayTx.wait();
                    let args;

                    // Get the RepayBorrow event arguments
                    for (let log of receipt.logs) {
                        try {
                            let decodedLog = plpInstance.interface.parseLog(log);
                            if (decodedLog.name === "RepayBorrow") args = decodedLog.args;
                        } catch (error) { }
                    }

                    let ethBalanceOfUserAfterRepay = await hre.ethers.provider.getBalance(masterAddress);
                    let ethBalanceOfLendingTokenAfterRepay = await hre.ethers.provider.getBalance(wethAddress);
                    let wethBalanceOfBLendingTokenAfterRepay = await weth.balanceOf(bLendingTokenAddress);
                    let totalBorrowedWethTokenAfterRepay = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                    let totalBorrowPrj1AfterRepay = await plpInstance.totalBorrow(prj1Address, wethAddress);
                    let borrowPositionAfterRepay = await plpInstance.borrowPosition(masterAddress, prj1Address, wethAddress);
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);

                    expect(ethBalanceOfLendingTokenBeforeRepay).to.eq(ethBalanceOfLendingTokenAfterRepay.sub(args.borrowAmount));
                    expect(wethBalanceOfBLendingTokenBeforeRepay).to.eq(wethBalanceOfBLendingTokenAfterRepay.sub(args.borrowAmount));
                    expect(totalBorrowedWethTokenBeforeRepay).to.eq(totalBorrowedWethTokenAfterRepay.add(args.borrowAmount));
                    expect(totalBorrowPrj1BeforeRepay).to.eq(totalBorrowPrj1AfterRepay.add(args.borrowAmount));
                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(lendingTokenAmount);
                    expect(args.isPositionFullyRepaid).to.eq(false);
                });
            });
        });
    });

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
                        await setHighPrice(prj1Address, prj1Decimals);
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
                        await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                        await plpWTGInstance.borrow(prj1Address, borrowAmount);

                        // check HF and liquidation amount
                        await setLowPrice(prj1Address, prj1Decimals);
                        let currentHealthFactor = await plpLiquidationInstance.getCurrentHealthFactor(masterAddress, prj1Address, wethAddress);
                        let liquidationAmount = await plpLiquidationInstance.getLiquidationAmount(masterAddress, prj1Address, wethAddress);

                        healthFactorNumerator = currentHealthFactor.healthFactorNumerator;
                        healthFactorDenominator = currentHealthFactor.healthFactorDenominator;
                        maxLA = liquidationAmount.maxLA;
                        minLA = liquidationAmount.minLA;
                    }
                }
            });

            it("15. Failure: Should revert when lendingTokenAmount < minLA", async function () {
                lendingTokenAmount = minLA.sub(toBN(1));
                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value: lendingTokenAmount }
                )).to.be.revertedWith("PITLiquidation: Invalid amount");
            });

            it("16. Failure: Should revert when lendingTokenAmount > maxLA", async function () {
                lendingTokenAmount = maxLA.add(toBN(1));
                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value: lendingTokenAmount }
                )).to.be.revertedWith("PITLiquidation: Invalid amount");
            });

            it("17. Failure: Should throw error when allowance < lendingTokenAmount", async function () {
                lendingTokenAmount = minLA.add(toBN(100));
                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value: lendingTokenAmount }
                )).to.throw;
            });

            it("18. Success: Should liquidate successfully", async function () {
                lendingTokenAmount = minLA.add(toBN(100));
                weth.connect(deployMaster).approve(bLendingTokenAddress, lendingTokenAmount);

                let masterEthBalanceBeforeLiquidateLendingETH = await hre.ethers.provider.getBalance(masterAddress);
                let wethBalanceBeforeLiquidateLendingETH = await hre.ethers.provider.getBalance(wethAddress);
                let balanceWETHOfBLendingTokenBeforeLiquidateLendingETH = await weth.balanceOf(bLendingTokenAddress);
                let totalBorrowedWethTokenBeforeLiquidateLendingETH = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                let totalBorrowPrj1BeforeLiquidateLendingETH = await plpInstance.totalBorrow(prj1Address, wethAddress);

                await (plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    { value: lendingTokenAmount }
                ));

                let masterEthBalanceAfterLiquidateLendingETH = await hre.ethers.provider.getBalance(masterAddress);
                let wethBalanceAfterLiquidateLendingETH = await hre.ethers.provider.getBalance(wethAddress);
                let balanceWETHOfBLendingTokenAfterLiquidateLendingETH = await weth.balanceOf(bLendingTokenAddress);
                let totalBorrowedWethTokenAfterLiquidateLendingETH = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                let totalBorrowPrj1AfterLiquidateLendingETH = await plpInstance.totalBorrow(prj1Address, wethAddress);

                expect(totalBorrowedWethTokenAfterLiquidateLendingETH).to.eq(totalBorrowedWethTokenBeforeLiquidateLendingETH.sub(lendingTokenAmount));
                expect(totalBorrowPrj1AfterLiquidateLendingETH).to.eq(totalBorrowPrj1BeforeLiquidateLendingETH.sub(lendingTokenAmount));
                expect(wethBalanceBeforeLiquidateLendingETH).to.eq(wethBalanceAfterLiquidateLendingETH.sub(lendingTokenAmount));
                expect(balanceWETHOfBLendingTokenBeforeLiquidateLendingETH).to.eq(balanceWETHOfBLendingTokenAfterLiquidateLendingETH.sub(lendingTokenAmount));

                weth.connect(deployMaster).approve(bLendingTokenAddress, 0);
            });
        });
    });

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
        });

        describe("Liquidate when HF < 1", async function () {
            before(async function () {
                this.timeout(24 * 36000 * 100000);
                await loadFixture();
                {
                    {
                        isLeveragePosition = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);
                    }
                    {
                        await setLowPrice(usdcAddress, usdcDecimals);
                        // deposit prj1
                        let depositPrj1Amount = ethers.utils.parseUnits("100", prj1Decimals); // 100 prj1
                        await prj1.mintTo(masterAddress, depositPrj1Amount);
                        await prj1.connect(deployMaster).approve(plpAddress, depositPrj1Amount);
                        await plpWTGInstance.deposit({ value: depositPrj1Amount });
                    }
                    {
                        // supply weth token
                        let supplyAmount = ethers.utils.parseUnits("100000000", usdcDecimals);
                        bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                        bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);

                        await usdc.mint(masterAddress, supplyAmount);
                        await usdc.connect(deployMaster).approve(bLendingTokenAddress, supplyAmount);
                        await plpInstance.supply(usdcAddress, supplyAmount);
                    }
                    {
                        // borrow weth
                        let borrowAmount = await plpInstance.getLendingAvailableToBorrow(masterAddress, wethAddress, usdcAddress);
                        await plpInstance.borrow(wethAddress, usdcAddress, borrowAmount);

                        // check HF and liquidation amount
                        await setHighPrice(usdcAddress, usdcDecimals);
                        let currentHealthFactor = await plpLiquidationInstance.getCurrentHealthFactor(masterAddress, wethAddress, usdcAddress);
                        let liquidationAmount = await plpLiquidationInstance.getLiquidationAmount(masterAddress, wethAddress, usdcAddress);

                        healthFactorNumerator = currentHealthFactor.healthFactorNumerator;
                        healthFactorDenominator = currentHealthFactor.healthFactorDenominator;
                        maxLA = liquidationAmount.maxLA;
                        minLA = liquidationAmount.minLA;
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
                await expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount
                )).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
            });

            it("13. Success: Should liquidate successfully", async function () {
                bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                lendingTokenAmount = minLA.add(toBN(100));

                usdc.connect(deployMaster).approve(bLendingTokenAddress, ethers.utils.parseEther("10000000"));
                weth.connect(deployMaster).approve(plpWTGAddress, ethers.utils.parseEther("10000000"));

                let balanceProjectTokenBeforeLiquidate = await usdc.balanceOf(bLendingTokenAddress);
                let totalBorrowedUsdcTokenBeforeLiquidate = await plpInstance.totalBorrowPerLendingToken(usdcAddress);
                let totalBorrowWethBeforeLiquidate = await plpInstance.totalBorrow(wethAddress, usdcAddress);
                let ethBalanceuUserBeforeLiquidate = await hre.ethers.provider.getBalance(masterAddress);
                let ethBalanceWethBeforeLiquidate = await hre.ethers.provider.getBalance(wethAddress);

                await (plpWTGInstance.liquidateWithProjectETH(masterAddress, usdcAddress, lendingTokenAmount));

                let balanceProjectTokenAfterLiquidate = await usdc.balanceOf(bLendingTokenAddress);
                let totalBorrowedUsdcTokenAfterLiquidate = await plpInstance.totalBorrowPerLendingToken(usdcAddress);
                let totalBorrowWethAfterLiquidate = await plpInstance.totalBorrow(wethAddress, usdcAddress);
                let ethBalanceuUserAftereLiquidate = await hre.ethers.provider.getBalance(masterAddress);
                let ethBalanceWethAftereLiquidate = await hre.ethers.provider.getBalance(wethAddress);

                expect(balanceProjectTokenBeforeLiquidate).to.eq(balanceProjectTokenAfterLiquidate.sub(lendingTokenAmount));
                expect(totalBorrowedUsdcTokenBeforeLiquidate).to.eq(totalBorrowedUsdcTokenAfterLiquidate.add(lendingTokenAmount));
                expect(totalBorrowWethBeforeLiquidate).to.eq(totalBorrowWethAfterLiquidate.add(lendingTokenAmount));

                usdc.connect(deployMaster).approve(bLendingTokenAddress, 0);
                weth.connect(deployMaster).approve(plpWTGAddress, 0);
            });

            it("14. Failure: Should revert when balance user < lendingTokenAmount", async function () {
                bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                lendingTokenAmount = minLA.add(toBN(100));

                usdc.connect(deployMaster).approve(bLendingTokenAddress, ethers.utils.parseEther("10000000"));
                weth.connect(deployMaster).approve(plpWTGAddress, ethers.utils.parseEther("10000000"));
                usdc.connect(deployMaster).transfer(bLendingTokenAddress, await usdc.balanceOf(masterAddress));

                await expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount
                )).to.be.revertedWith("ERC20: transfer amount exceeds balance");
            });
        });
    });
});