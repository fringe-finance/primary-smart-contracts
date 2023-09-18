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

const INFURA_KEY = process.env.INFURA_KEY;

const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);

describe("PrimaryLendingPlatformV2", function () {
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

    let MockToken;

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
    describe("deposit", function () {

        before(async function () {
            await loadFixture();
        });

        it("1. Failure: Should throw error when projectToken has an invalid address", async function () {
            let projectToken = "Not Address.";
            let projectTokenAmount = toBN(1);

            expect(plpInstance.deposit(
                projectToken,
                projectTokenAmount
            )).to.throw;
        });
        it("2. Failure: Should throw error when projectTokenAmount < 0", async function () {
            let projectToken = prj1.address;
            let projectTokenAmount = -1;

            expect(plpInstance.deposit(
                projectToken,
                projectTokenAmount
            )).to.throw;
        });
        it("3. Failure: Should throw error when projectTokenAmount > maxUint256", async function () {
            let projectToken = prj1.address;
            let projectTokenAmount = ethers.constants.MaxUint256.add(toBN(1));

            expect(plpInstance.deposit(
                projectToken,
                projectTokenAmount
            )).to.throw;
        });
        it("4. Failure: Should throw error when typeof projectTokenAmount is NOT UINT", async function () {
            let projectToken = prj1.address;
            let projectTokenAmount = 1.1;

            expect(plpInstance.deposit(
                projectToken,
                projectTokenAmount
            )).to.throw;
        });
        it("5. Failure: Should throw error when msg.value != 0", async function () {
            let projectToken = prj1.address;
            let projectTokenAmount = toBN(1);

            expect(plpInstance.deposit(
                projectToken,
                projectTokenAmount,
                {
                    value: toBN(1)
                }
            )).to.throw;
        });
        it("6. Failure: Should revert when isProjectTokenListed == FALSE", async function () {
            let projectToken = ethers.constants.AddressZero;
            let projectTokenAmount = toBN(1);

            await expect(plpInstance.deposit(
                projectToken,
                projectTokenAmount
            )).to.be.revertedWith("PIT: Project token is not listed");

        });
        it("7. Failure: Should revert when isDepositPaused == TRUE", async function () {
            let projectToken = prj1.address;
            let projectTokenAmount = toBN(1);

            await plpModeratorInstance.setPausedProjectToken(
                projectToken,
                true,
                false
            );

            await expect(plpInstance.deposit(
                projectToken,
                projectTokenAmount
            )).to.be.revertedWith("PIT: ProjectToken is paused");

            await plpModeratorInstance.setPausedProjectToken(
                projectToken,
                false,
                false
            );
        });
        it("8. Failure: Should revert when projectTokenAmount == 0", async function () {
            let projectToken = prj1.address;
            let projectTokenAmount = toBN(0);

            await expect(plpInstance.deposit(
                projectToken,
                projectTokenAmount
            )).to.be.revertedWith("PIT: ProjectTokenAmount==0");
        });
        it("9. Failure: Should revert when allowance < projectTokenAmount", async function () {
            let projectToken = prj1.address;
            let projectTokenAmount = toBN(100);

            await prj1.connect(deployMaster).approve(
                plpInstance.address,
                projectTokenAmount.sub(1)
            );
            await prj1.mintTo(
                deployMaster.address,
                projectTokenAmount
            );
            await expect(plpInstance.deposit(
                projectToken,
                projectTokenAmount
            )).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
        });
        it("10. Failure: Should revert when balance projectToken of user < projectTokenAmount", async function () {
            let projectToken = prj1.address;
            let projectTokenAmount = toBN(200);

            await prj1.connect(deployMaster).approve(
                plpInstance.address,
                projectTokenAmount
            );

            await expect(plpInstance.deposit(
                projectToken,
                projectTokenAmount
            )).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });
        it("11. Success (Single-user): Should deposit 10 projectToken1", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let projectTokenAmount = ethers.utils.parseUnits("10", prj1Decimals);

            await prj1.mintTo(deployMaster.address, projectTokenAmount);
            await prj1.connect(deployMaster).approve(
                plpInstance.address,
                projectTokenAmount
            );
            let balanceTokenBeforeDeposit = await prj1.balanceOf(deployMaster.address);
            let allowanceBeforeDepoist = await prj1.allowance(deployMaster.address, plpInstance.address);
            let depositedAmountBeforeDeposit = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenBeforeDeposit = await plpInstance.totalDepositedProjectToken(projectToken);

            await expect(plpInstance.deposit(
                projectToken,
                projectTokenAmount
            )).to.emit(plpInstance, "Deposit").withArgs(
                deployMaster.address,
                projectToken,
                projectTokenAmount,
                deployMaster.address
            );

            let balanceTokenAfterDeposit = await prj1.balanceOf(deployMaster.address);
            let allowanceAfterDepoist = await prj1.allowance(deployMaster.address, plpInstance.address);
            let depositedAmountAfterDeposit = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenAfterDeposit = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(balanceTokenAfterDeposit).to.eq(balanceTokenBeforeDeposit.sub(projectTokenAmount));
            expect(allowanceAfterDepoist).to.eq(allowanceBeforeDepoist.sub(projectTokenAmount));
            expect(depositedAmountAfterDeposit).to.eq(depositedAmountBeforeDeposit.add(projectTokenAmount));
            expect(totalDepositedProjectTokenAfterDeposit).to.eq(totalDepositedProjectTokenBeforeDeposit.add(projectTokenAmount));
        });
        it("11. Success (Multi-user): Should deposit 10 projectToken1", async function () {
            await loadFixture();

            for (let i = 0; i < signers.length; i++) {
                let projectToken = prj1.address;
                let projectTokenAmount = ethers.utils.parseUnits("10", prj1Decimals);

                await prj1.mintTo(signers[i].address, projectTokenAmount);
                await prj1.connect(signers[i]).approve(
                    plpInstance.address,
                    projectTokenAmount
                );
                let balanceTokenBeforeDeposit = await prj1.balanceOf(signers[i].address);
                let allowanceBeforeDepoist = await prj1.allowance(signers[i].address, plpInstance.address);
                let depositedAmountBeforeDeposit = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenBeforeDeposit = await plpInstance.totalDepositedProjectToken(projectToken);

                await expect(plpInstance.connect(signers[i]).deposit(
                    projectToken,
                    projectTokenAmount
                )).to.emit(plpInstance, "Deposit").withArgs(
                    signers[i].address,
                    projectToken,
                    projectTokenAmount,
                    signers[i].address
                );

                let balanceTokenAfterDeposit = await prj1.balanceOf(signers[i].address);
                let allowanceAfterDepoist = await prj1.allowance(signers[i].address, plpInstance.address);
                let depositedAmountAfterDeposit = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenAfterDeposit = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(balanceTokenAfterDeposit).to.eq(balanceTokenBeforeDeposit.sub(projectTokenAmount));
                expect(allowanceAfterDepoist).to.eq(allowanceBeforeDepoist.sub(projectTokenAmount));
                expect(depositedAmountAfterDeposit).to.eq(depositedAmountBeforeDeposit.add(projectTokenAmount));
                expect(totalDepositedProjectTokenAfterDeposit).to.eq(totalDepositedProjectTokenBeforeDeposit.add(projectTokenAmount));
            }
        });
    });

    describe("withdraw", function () {

        before(async function () {
            await loadFixture();
        });

        it("1. Failure: Should throw error when projectToken has an invalid address", async function () {
            let projectToken = "Not Address.";
            let projectTokenAmount = toBN(1);

            expect(plpInstance.withdraw(
                projectToken,
                projectTokenAmount
            )).to.throw;
        });
        it("2. Failure: Should throw error when projectTokenAmount < 0", async function () {
            let projectToken = prj1.address;
            let projectTokenAmount = -1;

            expect(plpInstance.withdraw(
                projectToken,
                projectTokenAmount
            )).to.throw;
        });
        it("3. Failure: Should throw error when projectTokenAmount > maxUint256", async function () {
            let projectToken = prj1.address;
            let projectTokenAmount = ethers.constants.MaxUint256.add(toBN(1));

            expect(plpInstance.withdraw(
                projectToken,
                projectTokenAmount
            )).to.throw;
        });
        it("4. Failure: Should throw error when typeof projectTokenAmount is NOT UINT", async function () {
            let projectToken = prj1.address;
            let projectTokenAmount = 1.1;

            expect(plpInstance.withdraw(
                projectToken,
                projectTokenAmount
            )).to.throw;
        });
        it("5. Failure: Should throw error when msg.value != 0", async function () {
            let projectToken = prj1.address;
            let projectTokenAmount = toBN(1);

            expect(plpInstance.withdraw(
                projectToken,
                projectTokenAmount,
                {
                    value: toBN(1)
                }
            )).to.throw;
        });
        it("6. Failure: Should revert when isProjectTokenListed == FALSE", async function () {
            let projectToken = ethers.constants.AddressZero;
            let projectTokenAmount = toBN(1);

            await expect(plpInstance.withdraw(
                projectToken,
                projectTokenAmount
            )).to.be.revertedWith("PIT: Project token is not listed");
        });
        it("7. Failure: Should revert when isWithdrawPaused == TRUE", async function () {
            let projectToken = prj1.address;
            let projectTokenAmount = toBN(1);

            await plpModeratorInstance.setPausedProjectToken(
                projectToken,
                false,
                true
            );

            await expect(plpInstance.withdraw(
                projectToken,
                projectTokenAmount
            )).to.be.revertedWith("PIT: ProjectToken is paused");

            await plpModeratorInstance.setPausedProjectToken(
                projectToken,
                false,
                false
            );
        });
        it("8. Failure: Should revert when projectTokenAmount == 0", async function () {
            let projectToken = prj1.address;
            let projectTokenAmount = toBN(0);

            await expect(plpInstance.withdraw(
                projectToken,
                projectTokenAmount
            )).to.be.revertedWith("PIT: Invalid PRJ token amount or depositPosition doesn't exist");
        });
        it("9. Failure: Should revert when depositedProjectTokenAmount == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let projectTokenAmount = toBN(1);

            expect(await plpInstance.getDepositedAmount(projectToken, deployMaster.address)).to.eq(toBN(0));

            await expect(plpInstance.withdraw(
                projectToken,
                projectTokenAmount
            )).to.be.revertedWith("PIT: Invalid PRJ token amount or depositPosition doesn't exist");
        });
        it("10. Failure: Should revert when withdrawableAmount == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let projectTokenAmount = toBN(1);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let borrowAmount = ethers.utils.parseUnits("100000000", usdcDecimals);
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
                await plpInstance.withdraw(
                    projectToken,
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
            expect(withdrawableAmount).to.eq(toBN(0));
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                actualLendingToken
            )).loanBody).to.gt(toBN(0));

            await expect(plpInstance.withdraw(
                projectToken,
                projectTokenAmount
            )).to.be.revertedWith("PIT: Withdrawable amount is 0");
        });
        it("11. Success (Single-user): Should withdraw available amount projectToken1 when withdrawableAmount >= projectTokenAmount and loanBody > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            {
                let depositAmount = ethers.utils.parseUnits("1000", prj1Decimals);
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
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

            let balanceTokenBeforeWithdraw = await prj1.balanceOf(deployMaster.address);
            let depositedAmountBeforeWithdraw = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenBeforeWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

            await expect(plpInstance.withdraw(
                projectToken,
                projectTokenAmount
            )).to.emit(plpInstance, "Withdraw").withArgs(
                deployMaster.address,
                projectToken,
                actualLendingToken,
                projectTokenAmount,
                deployMaster.address
            );

            let balanceTokenAfterWithdraw = await prj1.balanceOf(deployMaster.address);
            let depositedAmountAfterWithdraw = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenAfterWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(balanceTokenAfterWithdraw).eq(balanceTokenBeforeWithdraw.add(projectTokenAmount));
            expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(projectTokenAmount));
            expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(projectTokenAmount));
        });
        it("11. Success (Multi-user): Should withdraw available amount projectToken1 when withdrawableAmount >= projectTokenAmount and loanBody > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            {
                for (let i = 0; i < signers.length; i++) {
                    let depositAmount = ethers.utils.parseUnits("1000", prj1Decimals);
                    await prj1.mintTo(signers[i].address, depositAmount);
                    await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                    await plpInstance.connect(signers[i]).deposit(
                        projectToken,
                        depositAmount
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

                let balanceTokenBeforeWithdraw = await prj1.balanceOf(signers[i].address);
                let depositedAmountBeforeWithdraw = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenBeforeWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

                await expect(plpInstance.connect(signers[i]).withdraw(
                    projectToken,
                    projectTokenAmount
                )).to.emit(plpInstance, "Withdraw").withArgs(
                    signers[i].address,
                    projectToken,
                    actualLendingToken,
                    projectTokenAmount,
                    signers[i].address
                );

                let balanceTokenAfterWithdraw = await prj1.balanceOf(signers[i].address);
                let depositedAmountAfterWithdraw = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenAfterWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(balanceTokenAfterWithdraw).eq(balanceTokenBeforeWithdraw.add(projectTokenAmount));
                expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(projectTokenAmount));
                expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(projectTokenAmount));
            }
        });
        it("12. Success (Single-user): Should withdraw available amount projectToken1 when withdrawableAmount < projectTokenAmount and loanBody > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            {
                let depositAmount = ethers.utils.parseUnits("1000", prj1Decimals);
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
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
            let projectTokenAmount = withdrawableAmount.add(1);
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(withdrawableAmount.gt(toBN(0)));
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                actualLendingToken
            )).loanBody).to.gt(toBN(0));

            let balanceTokenBeforeWithdraw = await prj1.balanceOf(deployMaster.address);
            let depositedAmountBeforeWithdraw = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenBeforeWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

            await expect(plpInstance.withdraw(
                projectToken,
                projectTokenAmount
            )).to.emit(plpInstance, "Withdraw").withArgs(
                deployMaster.address,
                projectToken,
                actualLendingToken,
                withdrawableAmount,
                deployMaster.address
            );

            let balanceTokenAfterWithdraw = await prj1.balanceOf(deployMaster.address);
            let depositedAmountAfterWithdraw = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenAfterWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(balanceTokenAfterWithdraw).eq(balanceTokenBeforeWithdraw.add(withdrawableAmount));
            expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(withdrawableAmount));
            expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(withdrawableAmount));
        });
        it("12. Success (Multi-user): Should withdraw available amount projectToken1 when withdrawableAmount < projectTokenAmount and loanBody > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            {
                for (let i = 0; i < signers.length; i++) {
                    let depositAmount = ethers.utils.parseUnits("1000", prj1Decimals);
                    await prj1.mintTo(signers[i].address, depositAmount);
                    await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                    await plpInstance.connect(signers[i]).deposit(
                        projectToken,
                        depositAmount
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
                let projectTokenAmount = withdrawableAmount.add(1);
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                expect(withdrawableAmount.gt(toBN(0)));
                expect((await plpInstance.borrowPosition(
                    signers[i].address,
                    projectToken,
                    actualLendingToken
                )).loanBody).to.gt(toBN(0));

                let balanceTokenBeforeWithdraw = await prj1.balanceOf(signers[i].address);
                let depositedAmountBeforeWithdraw = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenBeforeWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

                await expect(plpInstance.connect(signers[i]).withdraw(
                    projectToken,
                    projectTokenAmount
                )).to.emit(plpInstance, "Withdraw").withArgs(
                    signers[i].address,
                    projectToken,
                    actualLendingToken,
                    withdrawableAmount,
                    signers[i].address
                );

                let balanceTokenAfterWithdraw = await prj1.balanceOf(signers[i].address);
                let depositedAmountAfterWithdraw = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenAfterWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(balanceTokenAfterWithdraw).eq(balanceTokenBeforeWithdraw.add(withdrawableAmount));
                expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(withdrawableAmount));
                expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(withdrawableAmount));
            }
        });
        it("13. Success (Single-user): Should withdraw available amount projectToken1 when withdrawableAmount >= projectTokenAmount and loanBody == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
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

            let balanceTokenBeforeWithdraw = await prj1.balanceOf(deployMaster.address);
            let depositedAmountBeforeWithdraw = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenBeforeWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

            await expect(plpInstance.withdraw(
                projectToken,
                projectTokenAmount
            )).to.emit(plpInstance, "Withdraw").withArgs(
                deployMaster.address,
                projectToken,
                actualLendingToken,
                projectTokenAmount,
                deployMaster.address
            );

            let balanceTokenAfterWithdraw = await prj1.balanceOf(deployMaster.address);
            let depositedAmountAfterWithdraw = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenAfterWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(balanceTokenAfterWithdraw).eq(balanceTokenBeforeWithdraw.add(projectTokenAmount));
            expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(projectTokenAmount));
            expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(projectTokenAmount));
        });
        it("13. Success (Multi-user): Should withdraw available amount projectToken1 when withdrawableAmount >= projectTokenAmount and loanBody == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            {
                for (let i = 0; i < signers.length; i++) {
                    let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                    await prj1.mintTo(signers[i].address, depositAmount);
                    await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                    await plpInstance.connect(signers[i]).deposit(
                        projectToken,
                        depositAmount
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

                let balanceTokenBeforeWithdraw = await prj1.balanceOf(signers[i].address);
                let depositedAmountBeforeWithdraw = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenBeforeWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

                await expect(plpInstance.connect(signers[i]).withdraw(
                    projectToken,
                    projectTokenAmount
                )).to.emit(plpInstance, "Withdraw").withArgs(
                    signers[i].address,
                    projectToken,
                    actualLendingToken,
                    projectTokenAmount,
                    signers[i].address
                );

                let balanceTokenAfterWithdraw = await prj1.balanceOf(signers[i].address);
                let depositedAmountAfterWithdraw = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenAfterWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(balanceTokenAfterWithdraw).eq(balanceTokenBeforeWithdraw.add(projectTokenAmount));
                expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(projectTokenAmount));
                expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(projectTokenAmount));
            }
        });
        it("14. Success (Single-user): Should withdraw available amount projectToken1 when withdrawableAmount < projectTokenAmount and loanBody == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await prj1.mintTo(deployMaster.address, depositAmount);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
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

            let balanceTokenBeforeWithdraw = await prj1.balanceOf(deployMaster.address);
            let depositedAmountBeforeWithdraw = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenBeforeWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

            await expect(plpInstance.withdraw(
                projectToken,
                projectTokenAmount
            )).to.emit(plpInstance, "Withdraw").withArgs(
                deployMaster.address,
                projectToken,
                actualLendingToken,
                withdrawableAmount,
                deployMaster.address
            );

            let balanceTokenAfterWithdraw = await prj1.balanceOf(deployMaster.address);
            let depositedAmountAfterWithdraw = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedProjectTokenAfterWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(balanceTokenAfterWithdraw).eq(balanceTokenBeforeWithdraw.add(withdrawableAmount));
            expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(withdrawableAmount));
            expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(withdrawableAmount));
        });
        it("14. Success (Multi-user): Should withdraw available amount projectToken1 when withdrawableAmount < projectTokenAmount and loanBody == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            {
                for (let i = 0; i < signers.length; i++) {
                    let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                    await prj1.mintTo(signers[i].address, depositAmount);
                    await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                    await plpInstance.connect(signers[i]).deposit(
                        projectToken,
                        depositAmount
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

                let balanceTokenBeforeWithdraw = await prj1.balanceOf(signers[i].address);
                let depositedAmountBeforeWithdraw = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenBeforeWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

                await expect(plpInstance.connect(signers[i]).withdraw(
                    projectToken,
                    projectTokenAmount
                )).to.emit(plpInstance, "Withdraw").withArgs(
                    signers[i].address,
                    projectToken,
                    actualLendingToken,
                    withdrawableAmount,
                    signers[i].address
                );

                let balanceTokenAfterWithdraw = await prj1.balanceOf(signers[i].address);
                let depositedAmountAfterWithdraw = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedProjectTokenAfterWithdraw = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(balanceTokenAfterWithdraw).eq(balanceTokenBeforeWithdraw.add(withdrawableAmount));
                expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(withdrawableAmount));
                expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(withdrawableAmount));
            }
        });
    });

    describe("supply", function () {
        before(async function () {
            await loadFixture();
        });

        let projectToken;
        let projectTokenAmount;

        let balanceTokenBeforeDeposit;
        let allowanceBeforeDepoist;
        let depositedAmountBeforeDeposit;
        let totalDepositedProjectTokenBeforeDeposit;

        let balanceTokenAfterDeposit;
        let allowanceAfterDepoist;
        let depositedAmountAfterDeposit;
        let totalDepositedProjectTokenAfterDeposit;

        it("1. Failure: Should throw error when lendingToken has an invalid address", async function () {
            lendingToken = "Not Address.";
            lendingTokenAmount = toBN(1);

            expect(plpInstance.supply(
                lendingToken,
                lendingTokenAmount
            )).to.throw;
        });

        it("2. Failure: Should throw error when lendingTokenAmount < 0", async function () {
            lendingToken = usdc.address;
            lendingTokenAmount = -1;

            expect(plpInstance.supply(
                lendingToken,
                lendingTokenAmount
            )).to.throw;
        });

        it("3. Failure: Should throw error when lendingTokenAmount > maxUint256", async function () {
            lendingToken = usdc.address;
            lendingTokenAmount = ethers.constants.MaxUint256.add(toBN(1));

            expect(plpInstance.supply(
                lendingToken,
                lendingTokenAmount
            )).to.throw;
        });

        it("4. Failure: Should throw error when lendingTokenAmount is not uint", async function () {
            lendingToken = usdc.address;
            lendingTokenAmount = 1.1;

            expect(plpInstance.supply(
                lendingToken,
                lendingTokenAmount
            )).to.throw;
        });

        it("5. Failure: Should throw error when msg.value != 0", async function () {
            lendingToken = usdc.address;
            lendingTokenAmount = toBN(1);

            expect(plpInstance.supply(
                lendingToken,
                lendingTokenAmount,
                {
                    value: toBN(1)
                }
            )).to.throw;
        });

        it("6. Failure: Should revert when isLendingTokenListed == FALSE", async function () {
            lendingToken = ethers.constants.AddressZero;
            lendingTokenAmount = toBN(1);

            await expect(plpInstance.supply(
                lendingToken,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: Lending token is not listed");
        });

        it("7. Failure: Should revert when isPaused == TRUE", async function () {
            lendingToken = usdc.address;
            lendingTokenAmount = toBN(1);

            await plpModeratorInstance.setPausedLendingToken(
                lendingToken,
                true,
            );

            await expect(plpInstance.supply(
                lendingToken,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: Lending token is paused");

            await plpModeratorInstance.setPausedLendingToken(
                lendingToken,
                false,
            );
        });

        it("8. Failure: Should revert when lendingTokenAmount == 0", async function () {
            lendingToken = usdc.address;
            lendingTokenAmount = toBN(0);

            await expect(plpInstance.supply(
                lendingToken,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: LendingTokenAmount==0");
        });

        it("9. Failure: Should revert when balance < lendingTokenAmount", async function () {
            lendingTokenAddress = usdc.address;
            userAddress = deployMaster.address;
            bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
            bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);

            userLendingTokenBalance = await usdc.balanceOf(userAddress);
            lendingTokenAmount = userLendingTokenBalance.add(toBN(100));

            await usdc.connect(deployMaster).approve(bLendingTokenAddress, lendingTokenAmount);

            await expect(plpInstance.supply(
                lendingTokenAddress,
                lendingTokenAmount
            )).to.be.revertedWith("ERC20: transfer amount exceeds balance");

            await usdc.connect(deployMaster).approve(bLendingTokenAddress, 0);
        });

        it("10. Failure: Should revert when allowance < lendingTokenAmount", async function () {
            lendingTokenAddress = usdc.address;
            userAddress = deployMaster.address;
            bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;

            lendingTokenAmount = toBN(100);

            await usdc.mint(userAddress, lendingTokenAmount);

            await expect(plpInstance.supply(
                lendingTokenAddress,
                lendingTokenAmount
            )).to.be.revertedWith("ERC20: transfer amount exceeds allowance'");
        });

        it("11. Success: Should supply success usdc token", async function () {
            lendingTokenAddress = usdc.address;
            userAddress = deployMaster.address;

            bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
            bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);

            bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
            exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));

            lendingTokenAmount = toBN(100);

            await usdc.mint(userAddress, lendingTokenAmount);
            await usdc.connect(deployMaster).approve(bLendingTokenAddress, lendingTokenAmount);

            totalSupplyTokenBeforeSupply = await bLendingTokenInstance.totalSupply();
            balanceLendingTokenUserBeforeSupply = await usdc.balanceOf(userAddress);
            balanceBLendingTokenUserBeforeSupply = await bLendingTokenInstance.balanceOf(userAddress);
            balanceLendingTokenBeforeSupply = await bLendingTokenInstance.balanceOf(lendingTokenAddress);
            allowanceLendingTokenBeforeSupply = await usdc.allowance(userAddress, bLendingTokenAddress);

            let supplyTx = await (plpInstance.supply(
                lendingTokenAddress,
                lendingTokenAmount
            ));
            let receipt = await supplyTx.wait();
            let events = receipt.events;
            let args;
            for (let i = 0; i < events.length; i++) {
                if (events[i]?.event == "Supply") {
                    args = events[i].args;
                }
            }

            mintedAmount = args.amountSupplyBTokenReceived;
            exchangedMintedAmount = mintedAmount.div(exchangeRate);

            totalSupplyTokenAfterSupply = await bLendingTokenInstance.totalSupply();
            balanceLendingTokenUserAfterSupply = await usdc.balanceOf(userAddress);
            balanceBLendingTokenUserAfterSupply = await bLendingTokenInstance.balanceOf(userAddress);
            allowanceLendingTokenAfterSupply = await usdc.allowance(userAddress, bLendingTokenAddress);

            expect(totalSupplyTokenBeforeSupply).to.eq(totalSupplyTokenAfterSupply.sub(exchangedMintedAmount));
            expect(balanceLendingTokenUserBeforeSupply).to.eq(balanceLendingTokenUserAfterSupply.add(lendingTokenAmount));
            expect(balanceBLendingTokenUserBeforeSupply).to.eq(balanceBLendingTokenUserAfterSupply.sub(exchangedMintedAmount));
            expect(allowanceLendingTokenBeforeSupply).to.eq(allowanceLendingTokenAfterSupply.add(lendingTokenAmount));
        });
    });

    describe("redeem", function () {
        before(async function () {
            await loadFixture();
        });

        it("1. Failure: Should throw error when lendingToken has an invalid address", async function () {
            lendingToken = "Not Address.";
            bLendingTokenAmount = toBN(1);

            expect(plpInstance.redeem(
                lendingToken,
                bLendingTokenAmount
            )).to.throw;
        });

        it("2. Failure: Should throw error when bLendingTokenAmount < 0", async function () {
            lendingToken = usdc.address;
            bLendingTokenAmount = -1;

            expect(plpInstance.redeem(
                lendingToken,
                bLendingTokenAmount
            )).to.throw;
        });

        it("3. Failure: Should throw error when bLendingTokenAmount > maxUint256", async function () {
            lendingToken = usdc.address;
            bLendingTokenAmount = ethers.constants.MaxUint256.add(toBN(1));

            expect(plpInstance.redeem(
                lendingToken,
                bLendingTokenAmount
            )).to.throw;
        });

        it("4. Failure: Should throw error bLendingTokenAmount is not uint256", async function () {
            lendingToken = usdc.address;
            bLendingTokenAmount = 1.1;

            expect(plpInstance.redeem(
                lendingToken,
                bLendingTokenAmount
            )).to.throw;
        });

        it("5. Failure: Should throw error when msg.value != 0", async function () {
            lendingToken = usdc.address;
            bLendingTokenAmount = toBN(1);

            expect(plpInstance.redeem(
                lendingToken,
                bLendingTokenAmount,
                {
                    value: toBN(1)
                }
            )).to.throw;
        });

        it("6. Failure: Should revert when isLendingTokenListed == FALSE", async function () {
            lendingToken = ethers.constants.AddressZero;
            bLendingTokenAmount = toBN(1);

            await expect(plpInstance.redeem(
                lendingToken,
                bLendingTokenAmount
            )).to.be.revertedWith("PIT: Lending token is not listed");
        });

        it("7. Failure: Should revert when isPaused == TRUE", async function () {
            lendingToken = usdc.address;
            bLendingTokenAmount = toBN(1);

            await plpModeratorInstance.setPausedLendingToken(
                lendingToken,
                true,
            );

            await expect(plpInstance.redeem(
                lendingToken,
                bLendingTokenAmount
            )).to.be.revertedWith("PIT: Lending token is paused");

            await plpModeratorInstance.setPausedLendingToken(
                lendingToken,
                false,
            );
        });

        it("8. Failure: Should revert when bLendingTokenAmount == 0", async function () {
            lendingToken = usdc.address;
            bLendingTokenAmount = toBN(0);

            await expect(plpInstance.redeem(
                lendingToken,
                bLendingTokenAmount
            )).to.be.revertedWith("PIT: BLendingTokenAmount==0");
        });

        it("9. Failure: Should revert when usdc balance of bLendingToken < bLendingTokenAmount", async function () {
            userAddress = deployMaster.address;
            lendingTokenAddress = usdc.address;

            bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdc.address)).bLendingToken;
            bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);
            balanceOfUserBLendingToken = await bLendingTokenInstance.balanceOf(userAddress);

            bLendingTokenAmount = balanceOfUserBLendingToken.add(toBN(100));

            await expect(plpInstance.redeem(
                lendingToken,
                bLendingTokenAmount
            )).to.be.revertedWith("PIT: RedeemError!=0. redeem>=supply.");
        });

        it("10. Success: Should redeem success usdc token", async function () {
            userAddress = deployMaster.address;
            lendingTokenAddress = usdc.address;

            bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdc.address)).bLendingToken;
            bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);

            bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
            exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));

            bLendingTokenAmount = toBN(100);
            exchangedBLendingToken = toBN(100 / exchangeRate);

            // Supply lending token
            await usdc.mint(userAddress, bLendingTokenAmount);
            await usdc.connect(deployMaster).approve(bLendingTokenAddress, bLendingTokenAmount);
            let supplyTx = await (plpInstance.supply(lendingTokenAddress, bLendingTokenAmount));
            await supplyTx.wait();

            balanceOfBLendingTokenBeforeRedeem = await usdc.balanceOf(bLendingTokenAddress);
            balanceOfLendingTokenUserBeforeRedeem = await usdc.balanceOf(userAddress);
            balanceOfBLendingTokenUserBeforeRedeem = await bLendingTokenInstance.balanceOf(userAddress);

            await expect(plpInstance.redeem(
                lendingToken,
                exchangedBLendingToken
            )).to.emit(plpInstance, 'Redeem').withArgs(userAddress, lendingTokenAddress, bLendingTokenAddress, exchangedBLendingToken);

            balanceOfBLendingTokenAfterRedeem = await usdc.balanceOf(bLendingTokenAddress);
            balanceOfLendingTokenUserAfterRedeem = await usdc.balanceOf(userAddress);
            balanceOfBLendingTokenUserAfterRedeem = await bLendingTokenInstance.balanceOf(userAddress);

            expect(balanceOfBLendingTokenBeforeRedeem).to.eq(balanceOfBLendingTokenAfterRedeem.add(bLendingTokenAmount));
            expect(balanceOfLendingTokenUserBeforeRedeem).to.eq(balanceOfLendingTokenUserAfterRedeem.sub(bLendingTokenAmount));
            expect(balanceOfBLendingTokenUserBeforeRedeem).to.eq(balanceOfBLendingTokenUserAfterRedeem.add(exchangedBLendingToken));
        });
    });

    describe("redeemUnderlying", function () {
        before(async function () {
            await loadFixture();
        });

        it("1. Failure: Should throw error when lendingToken has an invalid address", async function () {
            lendingToken = "Not Address.";
            bLendingTokenAmount = toBN(1);

            expect(plpInstance.redeemUnderlying(
                lendingToken,
                bLendingTokenAmount
            )).to.throw;
        });

        it("2. Failure: Should throw error when bLendingTokenAmount < 0", async function () {
            lendingToken = usdc.address;
            bLendingTokenAmount = -1;

            expect(plpInstance.redeemUnderlying(
                lendingToken,
                bLendingTokenAmount
            )).to.throw;
        });

        it("3. Failure: Should throw error when bLendingTokenAmount > maxUint256", async function () {
            lendingToken = usdc.address;
            bLendingTokenAmount = ethers.constants.MaxUint256.add(toBN(1));

            expect(plpInstance.redeemUnderlying(
                lendingToken,
                bLendingTokenAmount
            )).to.throw;
        });

        it("4. Failure: Should throw error bLendingTokenAmount is not uint256", async function () {
            lendingToken = usdc.address;
            bLendingTokenAmount = 1.1;

            expect(plpInstance.redeemUnderlying(
                lendingToken,
                bLendingTokenAmount
            )).to.throw;
        });

        it("5. Failure: Should throw error when msg.value != 0", async function () {
            lendingToken = usdc.address;
            bLendingTokenAmount = toBN(1);

            expect(plpInstance.redeemUnderlying(
                lendingToken,
                bLendingTokenAmount,
                {
                    value: toBN(1)
                }
            )).to.throw;
        });

        it("6. Failure: Should revert when isLendingTokenListed == FALSE", async function () {
            lendingToken = ethers.constants.AddressZero;
            bLendingTokenAmount = toBN(1);

            await expect(plpInstance.redeemUnderlying(
                lendingToken,
                bLendingTokenAmount
            )).to.be.revertedWith("PIT: Lending token is not listed");
        });

        it("7. Failure: Should revert when isPaused == TRUE", async function () {
            lendingToken = usdc.address;
            bLendingTokenAmount = toBN(1);

            await plpModeratorInstance.setPausedLendingToken(
                lendingToken,
                true,
            );

            await expect(plpInstance.redeemUnderlying(
                lendingToken,
                bLendingTokenAmount
            )).to.be.revertedWith("PIT: Lending token is paused");

            await plpModeratorInstance.setPausedLendingToken(
                lendingToken,
                false,
            );
        });

        it("8. Failure: Should revert when lendingTokenAmount == 0", async function () {
            lendingToken = usdc.address;
            bLendingTokenAmount = toBN(0);

            await expect(plpInstance.redeemUnderlying(
                lendingToken,
                bLendingTokenAmount
            )).to.be.revertedWith("PIT: LendingTokenAmount==0");
        });

        it("9. Failure: Should revert when usdc balance of bLendingToken < lendingTokenAmount", async function () {
            lendingTokenAddress = usdc.address;
            bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdc.address)).bLendingToken;
            balanceOfBLendingToken = await usdc.balanceOf(bLendingTokenAddress);
            lendingTokenAmount = balanceOfBLendingToken.add(toBN(100));

            await expect(plpInstance.redeemUnderlying(
                lendingToken,
                lendingTokenAmount
            )).to.be.revertedWith("PIT:Redeem>=supply");
        });

        it("10. Success: Should redeemUnderlying success usdc token", async function () {
            lendingTokenAddress = usdc.address;
            userAddress = deployMaster.address;

            bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdc.address)).bLendingToken;
            bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);

            bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
            exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));

            lendingTokenAmount = toBN(100);
            exchangedLendingToken = toBN(100 / exchangeRate);

            // Supply lending token
            await usdc.mint(userAddress, lendingTokenAmount);
            await usdc.connect(deployMaster).approve(bLendingTokenAddress, lendingTokenAmount);
            let supplyTx = await (plpInstance.supply(lendingTokenAddress, lendingTokenAmount));
            await supplyTx.wait();

            // Redeem lending token
            balanceOfBLendingTokenBeforeRedeemUnderlying = await usdc.balanceOf(bLendingTokenAddress);
            balanceOfLendingTokenUserBeforeRedeemUnderlying = await usdc.balanceOf(userAddress);
            balanceOfBLendingTokenUserBeforeRedeemUnderlying = await bLendingTokenInstance.balanceOf(userAddress);

            await expect(plpInstance.redeemUnderlying(
                lendingToken,
                lendingTokenAmount
            )).to.emit(plpInstance, 'RedeemUnderlying').withArgs(userAddress, lendingTokenAddress, bLendingTokenAddress, lendingTokenAmount);

            balanceOfBLendingTokenAfterRedeemUnderlying = await usdc.balanceOf(bLendingTokenAddress);
            balanceOfUserAfterRedeemUnderlying = await usdc.balanceOf(userAddress);
            balanceOfBLendingTokenUserAfterRedeemUnderlying = await bLendingTokenInstance.balanceOf(userAddress);

            expect(balanceOfBLendingTokenBeforeRedeemUnderlying).to.eq(balanceOfBLendingTokenAfterRedeemUnderlying.add(lendingTokenAmount));
            expect(balanceOfLendingTokenUserBeforeRedeemUnderlying).to.eq(balanceOfUserAfterRedeemUnderlying.sub(lendingTokenAmount));
            expect(balanceOfBLendingTokenUserBeforeRedeemUnderlying).to.eq(balanceOfBLendingTokenUserAfterRedeemUnderlying.add(exchangedLendingToken));
        });
    });

    describe("repay", function () {
        before(async function () {
            await loadFixture();
        });

        it("1. Failure: Should throw error when projectToken has an invalid address", async function () {
            projectTokenAddress = "Not Address.";
            lendingTokenAddress = usdc.address;
            lendingTokenAmount = toBN(1);

            expect(plpInstance.repay(
                projectTokenAddress,
                lendingTokenAddress,
                lendingTokenAmount
            )).to.throw;
        });

        it("2. Failure: Should throw error when lendingToken has an invalid address", async function () {
            projectTokenAddress = prj1.address;
            lendingTokenAddress = "Not Address.";
            lendingTokenAmount = toBN(1);

            expect(plpInstance.repay(
                projectTokenAddress,
                lendingTokenAddress,
                lendingTokenAmount
            )).to.throw;
        });

        it("3. Failure: Should throw error when lendingTokenAmount < 0", async function () {
            projectTokenAddress = prj1.address;
            lendingTokenAddress = usdc.address;
            lendingTokenAmount = toBN(1);

            lendingTokenAmount = -1;

            expect(plpInstance.repay(
                projectTokenAddress,
                lendingTokenAddress,
                lendingTokenAmount
            )).to.throw;
        });

        it("4. Failure: Should throw error when lendingTokenAmount > maxUint256", async function () {
            projectTokenAddress = prj1.address;
            lendingTokenAddress = usdc.address;
            lendingTokenAmount = toBN(1);

            lendingTokenAmount = ethers.constants.MaxUint256.add(toBN(1));

            expect(plpInstance.repay(
                projectTokenAddress,
                lendingTokenAddress,
                lendingTokenAmount
            )).to.throw;
        });

        it("5. Failure: Should throw error lendingTokenAmount is not uint256", async function () {
            projectTokenAddress = prj1.address;
            lendingTokenAddress = usdc.address;
            lendingTokenAmount = 1.1;

            expect(plpInstance.repay(
                projectTokenAddress,
                lendingTokenAddress,
                lendingTokenAmount
            )).to.throw;
        });

        it("6. Failure: Should throw error when msg.value != 0", async function () {
            projectTokenAddress = prj1.address;
            lendingTokenAddress = usdc.address;
            lendingTokenAmount = toBN(100);

            expect(plpInstance.repay(
                projectTokenAddress,
                lendingTokenAddress,
                lendingTokenAmount,
                {
                    value: toBN(1)
                }
            )).to.throw;
        });

        it("7. Failure: Should revert when isProjectTokenListed == FALSE", async function () {
            projectTokenAddress = ethers.constants.AddressZero;
            lendingTokenAddress = usdc.address;
            lendingTokenAmount = toBN(100);

            await expect(plpInstance.repay(
                projectTokenAddress,
                lendingTokenAddress,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: Project token is not listed");
        });

        it("8. Failure: Should revert when isLendingTokenListed == FALSE", async function () {
            projectTokenAddress = prj1.address;
            lendingTokenAddress = ethers.constants.AddressZero;
            lendingTokenAmount = toBN(100);

            await expect(plpInstance.repay(
                projectTokenAddress,
                lendingTokenAddress,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: Lending token is not listed");
        });

        it("9. Failure: Should revert when lendingTokenAmount = 0", async function () {
            projectTokenAddress = prj1.address;
            lendingTokenAddress = usdc.address;
            lendingTokenAmount = toBN(0);

            await expect(plpInstance.repay(
                projectTokenAddress,
                lendingTokenAddress,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: LendingTokenAmount==0");
        });

        it("10. Failure: Should revert when borrowPositionAmount == 0", async function () {
            repayAmount = ethers.utils.parseUnits("1", usdcDecimals);

            await expect(plpInstance.repay(
                prj1Address,
                usdcAddress,
                repayAmount
            )).to.be.revertedWith("PIT: No borrow position");
        });

        it("11. Failure: Should revert when _borrowPosition.loanBody == 0", async function () {
            repayAmount = ethers.utils.parseUnits("1", usdcDecimals);

            // deposiut prj1
            let depositPrj1Amount = ethers.utils.parseUnits("100", prj1Decimals);
            await prj1.mintTo(deployMaster.address, depositPrj1Amount);
            await prj1.connect(deployMaster).approve(plpAddress, depositPrj1Amount);
            await plpInstance.deposit(prj1Address, depositPrj1Amount);

            await expect(plpInstance.repay(
                prj1Address,
                usdcAddress,
                repayAmount
            )).to.be.revertedWith("PIT: No borrow position");
        });

        describe("Repay with isLeveragePosition = FALSE cases:", async function () {
            beforeEach(async function () {
                await loadFixture();

                userAddress = deployMaster.address;
                bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);

                bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
                exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));

                {
                    {
                        // deposit prj1, prj2
                        let depositPrj1Amount = ethers.utils.parseUnits("100", prj1Decimals);
                        await prj1.mintTo(userAddress, depositPrj1Amount);
                        await prj1.connect(deployMaster).approve(plpAddress, depositPrj1Amount);
                        await plpInstance.deposit(prj1Address, depositPrj1Amount);

                        let depositPrj2Amount = ethers.utils.parseUnits("100", prj2Decimals);
                        await prj2.mintTo(userAddress, depositPrj2Amount);
                        await prj2.connect(deployMaster).approve(plpAddress, depositPrj2Amount);
                        await plpInstance.deposit(prj2Address, depositPrj2Amount);
                    }
                    {
                        // supply usdc
                        let borrowAmount = ethers.utils.parseUnits("100000000", usdcDecimals); //100.000.000
                        await usdc.mint(userAddress, borrowAmount);
                        await usdc.connect(deployMaster).approve(bLendingTokenAddress, borrowAmount);
                        await plpInstance.supply(usdcAddress, borrowAmount);
                        await plpInstance.borrow(
                            prj1Address, usdcAddress,
                            await plpInstance.getLendingAvailableToBorrow(userAddress, prj1Address, usdcAddress)
                        );
                    }
                }
            });

            describe("12. Repay with borrowPositionAmount = 1", function () {
                it("12.1. Success: Repay with borrowBalanceStored < lendingTokenAmount", async function () {
                    borrowAmount = ethers.utils.parseUnits("100000000", usdcDecimals); //100.000.000
                    repayAmount = borrowAmount.add(ethers.utils.parseUnits("100000000", usdcDecimals));

                    userAddress = deployMaster.address;
                    bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);

                    bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
                    exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));

                    await usdc.connect(deployMaster).approve(bLendingTokenAddress, repayAmount);

                    borrowBalanceStored = await bToken.borrowBalanceStored(userAddress);

                    let totalBorrowedUsdcTokenBeforeRepay = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.getTotalBorrowPerCollateral(prj1Address);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

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
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(borrowBalanceStored);
                    expect(args.isPositionFullyRepaid).to.eq(true);

                });

                it("12.2. Success: Repay with borrowBalanceStored >= lendingTokenAmount && _totalOutstanding < lendingTokenAmount", async function () {
                    totalOutstanding = await plpInstance.totalOutstanding(userAddress, prj1Address, usdcAddress);
                    repayAmount = totalOutstanding.add(ethers.utils.parseUnits("1", usdcDecimals));

                    userAddress = deployMaster.address;
                    bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);

                    bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
                    exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));

                    await usdc.connect(deployMaster).approve(bLendingTokenAddress, repayAmount);

                    borrowBalanceStored = await bToken.borrowBalanceStored(userAddress);

                    let totalBorrowedUsdcTokenBeforeRepay = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.getTotalBorrowPerCollateral(prj1Address);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

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
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(borrowBalanceStored);
                    expect(args.isPositionFullyRepaid).to.eq(true);
                });

                it("12.3. Success: Repay with borrowBalanceStored >= lendingTokenAmount && _totalOutstanding >= lendingTokenAmount", async function () {
                    repayAmount = ethers.utils.parseUnits("1", usdcDecimals);

                    userAddress = deployMaster.address;
                    bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);

                    bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
                    exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));

                    await usdc.connect(deployMaster).approve(bLendingTokenAddress, repayAmount);

                    borrowBalanceStored = await bToken.borrowBalanceStored(userAddress);
                    totalOutstanding = await plpInstance.totalOutstanding(userAddress, prj1Address, usdcAddress);

                    let totalBorrowedUsdcTokenBeforeRepay = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.getTotalBorrowPerCollateral(prj1Address);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

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
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(repayAmount);
                    expect(args.isPositionFullyRepaid).to.eq(false);
                });
            });

            describe("13. Repay with borrowPositionAmount > 1", function () {
                beforeEach(async function () {
                    // deposit prj1 
                    depositPrj1Amount = ethers.utils.parseUnits("100", prj1Decimals);
                    await prj1.mintTo(userAddress, depositPrj1Amount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositPrj1Amount);
                    await plpInstance.deposit(prj1Address, depositPrj1Amount);

                    // borrow prj1, prj2 --> usdc
                    await plpInstance.borrow(
                        prj1Address, usdcAddress,
                        await plpInstance.getLendingAvailableToBorrow(userAddress, prj1Address, usdcAddress)
                    );

                    await plpInstance.borrow(
                        prj2Address, usdcAddress,
                        await plpInstance.getLendingAvailableToBorrow(userAddress, prj2Address, usdcAddress)
                    );
                });

                it("13.1. Success: Repay with _totalOutstanding < lendingTokenAmount", async function () {
                    totalOutstanding = await plpInstance.totalOutstanding(userAddress, prj1Address, usdcAddress);
                    repayAmount = totalOutstanding.add(ethers.utils.parseUnits("1", usdcDecimals));

                    userAddress = deployMaster.address;
                    bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);

                    bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
                    exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));

                    await usdc.connect(deployMaster).approve(bLendingTokenAddress, repayAmount);

                    borrowBalanceStored = await bToken.borrowBalanceStored(userAddress);

                    let totalBorrowedUsdcTokenBeforeRepay = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.getTotalBorrowPerCollateral(prj1Address);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

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
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(totalOutstanding);
                    expect(args.isPositionFullyRepaid).to.eq(true);
                });

                it("13.2. Success: Repay with _totalOutstanding >= lendingTokenAmount", async function () {

                    totalOutstanding = await plpInstance.totalOutstanding(userAddress, prj1Address, usdcAddress);
                    repayAmount = totalOutstanding.sub(ethers.utils.parseUnits("1", usdcDecimals));

                    userAddress = deployMaster.address;
                    bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);

                    bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
                    exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));

                    await usdc.connect(deployMaster).approve(bLendingTokenAddress, repayAmount);

                    borrowBalanceStored = await bToken.borrowBalanceStored(userAddress);

                    let totalBorrowedUsdcTokenBeforeRepay = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.getTotalBorrowPerCollateral(prj1Address);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

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
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(repayAmount);
                    expect(args.isPositionFullyRepaid).to.eq(false);
                });
            });
        });

        describe("Repay with isLeveragePosition = TRUE cases:", async function () {

            beforeEach(async function () {
                
                await loadFixture();
                let exp;
                let margin;
                let buyCalldata;
                let type = toBN(0);

                {
                    {
                        let depositAmount = ethers.utils.parseUnits("1000", prj1Decimals);
                        await prj1.mintTo(deployMaster.address, depositAmount.mul(10));
                        await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                        await plpInstance.deposit(prj1Address, depositAmount);
                    }
                    {
                        let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(usdcAddress);
                        let lendingTokenCount = await plpLeverageInstance.calculateLendingTokenCount(usdcAddress, borrowLimitPerLendingToken);
                        usdcAmountToMint = ethers.utils.parseUnits("100000000", usdcDecimals);

                        await usdc.mint(deployMaster.address, usdcAmountToMint);
                        let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                        await usdc.connect(deployMaster).approve(blendingToken, lendingTokenCount);
                        await plpInstance.supply(usdcAddress, lendingTokenCount);
                    }
                }
                let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                exp = await plpInstance.getTokenEvaluation(usdcAddress, borrowUSDCAmount);
                margin = await plpLeverageInstance.calculateMargin(prj1Address, usdcAddress, toBN(20), toBN(10), exp);
                let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, prj1Address, margin);
                await prj1.connect(deployMaster).approve(plpLeverageAddress, addingAmount);
                await usdc.connect(deployMaster).approve(plpLeverageAddress, borrowUSDCAmount);
                buyCalldata = await createSellCallData(
                    usdcAddress,
                    borrowUSDCAmount,
                    0,
                    ethers.constants.AddressZero,
                    [await factory.getPair(prj1Address, usdcAddress)]
                );

                await plpLeverageInstance.leveragedBorrow(
                    prj1Address,
                    usdcAddress,
                    exp,
                    margin,
                    buyCalldata,
                    type
                );
            });

            describe("14. Repay with borrowPositionAmount = 1", function () {
                it("14.1. Success: Repay with borrowBalanceStored < lendingTokenAmount", async function () {

                    userAddress = deployMaster.address;
                    bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);
                    bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);

                    borrowBalanceStored = await bToken.borrowBalanceStored(userAddress);
                    repayAmount = borrowBalanceStored.add(toBN(100));

                    await usdc.connect(deployMaster).approve(bLendingTokenAddress, repayAmount);

                    let usdcBalanceOfUserBeforeRepay = await usdc.balanceOf(userAddress);
                    let usdcBalanceOfBLendingTokenBeforeRepay = await usdc.balanceOf(bLendingTokenAddress);
                    let totalBorrowedUsdcTokenBeforeRepay = await plpInstance.totalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.totalBorrow(prj1Address, usdcAddress);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

                    let repayTx = await plpInstance.repay(prj1Address, usdcAddress, repayAmount);
                    let receipt = await repayTx.wait();
                    let events = receipt.events;
                    let args;
                    for (let i = 0; i < events.length; i++)  if (events[i]?.event == "RepayBorrow") args = events[i].args;

                    let usdcBalanceOfUserAfterRepay = await usdc.balanceOf(userAddress);
                    let usdcBalanceOfBLendingTokenAfterRepay = await usdc.balanceOf(bLendingTokenAddress);
                    let totalBorrowedUsdcTokenAfterRepay = await plpInstance.totalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1AfterRepay = await plpInstance.totalBorrow(prj1Address, usdcAddress);
                    let borrowPositionAfterRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

                    expect(usdcBalanceOfUserAfterRepay).to.eq(usdcBalanceOfUserBeforeRepay.sub(args.borrowAmount));
                    expect(usdcBalanceOfBLendingTokenAfterRepay).to.eq(usdcBalanceOfBLendingTokenBeforeRepay.add(args.borrowAmount));
                    expect(totalBorrowedUsdcTokenAfterRepay).to.eq(totalBorrowedUsdcTokenBeforeRepay.sub(args.borrowAmount));
                    expect(totalBorrowPrj1AfterRepay).to.eq(totalBorrowPrj1BeforeRepay.sub(args.borrowAmount));
                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(borrowBalanceStored);
                    expect(args.isPositionFullyRepaid).to.eq(true);
                    expect(isLeveragePositionAfterRepay).to.eq(false);
                });

                it("14.2. Success: Repay with borrowBalanceStored >= lendingTokenAmount && _totalOutstanding < lendingTokenAmount", async function () {
                    userAddress = deployMaster.address;
                    totalOutstanding = await plpInstance.totalOutstanding(userAddress, prj1Address, usdcAddress);
                    bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);
                    bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);

                    borrowBalanceStored = await bToken.borrowBalanceStored(userAddress);
                    repayAmount = totalOutstanding.add(toBN(100));

                    await usdc.connect(deployMaster).approve(bLendingTokenAddress, repayAmount);

                    let usdcBalanceOfUserBeforeRepay = await usdc.balanceOf(userAddress);
                    let usdcBalanceOfBLendingTokenBeforeRepay = await usdc.balanceOf(bLendingTokenAddress);
                    let totalBorrowedUsdcTokenBeforeRepay = await plpInstance.totalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.totalBorrow(prj1Address, usdcAddress);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

                    let repayTx = await plpInstance.repay(prj1Address, usdcAddress, repayAmount);
                    let receipt = await repayTx.wait();
                    let events = receipt.events;
                    let args;
                    for (let i = 0; i < events.length; i++)  if (events[i]?.event == "RepayBorrow") args = events[i].args;

                    let usdcBalanceOfUserAfterRepay = await usdc.balanceOf(userAddress);
                    let usdcBalanceOfBLendingTokenAfterRepay = await usdc.balanceOf(bLendingTokenAddress);
                    let totalBorrowedUsdcTokenAfterRepay = await plpInstance.totalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1AfterRepay = await plpInstance.totalBorrow(prj1Address, usdcAddress);
                    let borrowPositionAfterRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

                    expect(usdcBalanceOfUserAfterRepay).to.eq(usdcBalanceOfUserBeforeRepay.sub(args.borrowAmount));
                    expect(usdcBalanceOfBLendingTokenAfterRepay).to.eq(usdcBalanceOfBLendingTokenBeforeRepay.add(args.borrowAmount));
                    expect(totalBorrowedUsdcTokenAfterRepay).to.eq(totalBorrowedUsdcTokenBeforeRepay.sub(args.borrowAmount));
                    expect(totalBorrowPrj1AfterRepay).to.eq(totalBorrowPrj1BeforeRepay.sub(args.borrowAmount));
                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(borrowBalanceStored);
                    expect(args.isPositionFullyRepaid).to.eq(true);
                    expect(isLeveragePositionAfterRepay).to.eq(false);
                });

                it("14.3. Success: Repay with borrowBalanceStored >= lendingTokenAmount && _totalOutstanding >= lendingTokenAmount", async function () {
                    userAddress = deployMaster.address;
                    totalOutstanding = await plpInstance.totalOutstanding(userAddress, prj1Address, usdcAddress);
                    bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);
                    bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);

                    borrowBalanceStored = await bToken.borrowBalanceStored(userAddress);
                    repayAmount = totalOutstanding.sub(toBN(100));

                    await usdc.connect(deployMaster).approve(bLendingTokenAddress, repayAmount);

                    let usdcBalanceOfUserBeforeRepay = await usdc.balanceOf(userAddress);
                    let usdcBalanceOfBLendingTokenBeforeRepay = await usdc.balanceOf(bLendingTokenAddress);
                    let totalBorrowedUsdcTokenBeforeRepay = await plpInstance.totalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.totalBorrow(prj1Address, usdcAddress);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

                    let repayTx = await plpInstance.repay(prj1Address, usdcAddress, repayAmount);
                    let receipt = await repayTx.wait();
                    let events = receipt.events;
                    let args;
                    for (let i = 0; i < events.length; i++)  if (events[i]?.event == "RepayBorrow") args = events[i].args;

                    let usdcBalanceOfUserAfterRepay = await usdc.balanceOf(userAddress);
                    let usdcBalanceOfBLendingTokenAfterRepay = await usdc.balanceOf(bLendingTokenAddress);
                    let totalBorrowedUsdcTokenAfterRepay = await plpInstance.totalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1AfterRepay = await plpInstance.totalBorrow(prj1Address, usdcAddress);
                    let borrowPositionAfterRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

                    expect(usdcBalanceOfUserAfterRepay).to.eq(usdcBalanceOfUserBeforeRepay.sub(args.borrowAmount));
                    expect(usdcBalanceOfBLendingTokenAfterRepay).to.eq(usdcBalanceOfBLendingTokenBeforeRepay.add(args.borrowAmount));
                    expect(totalBorrowedUsdcTokenAfterRepay).to.eq(totalBorrowedUsdcTokenBeforeRepay.sub(args.borrowAmount));
                    expect(totalBorrowPrj1AfterRepay).to.eq(totalBorrowPrj1BeforeRepay.sub(args.borrowAmount));
                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(repayAmount);
                    expect(args.isPositionFullyRepaid).to.eq(false);
                    expect(isLeveragePositionAfterRepay).to.eq(true);
                });
            });

            describe("15. Repay with borrowPositionAmount > 1", function () {
                beforeEach(async function () {
                    // deposit prj2
                    depositPrj2Amount = ethers.utils.parseUnits("100", prj2Decimals);
                    await prj2.mintTo(deployMaster.address, depositPrj2Amount);
                    await prj2.connect(deployMaster).approve(plpAddress, depositPrj2Amount);
                    await plpInstance.deposit(prj2Address, depositPrj2Amount);

                    // borrow prj2
                    await plpInstance.borrow(
                        prj2Address, usdcAddress,
                        await plpInstance.getLendingAvailableToBorrow(deployMaster.address, prj2Address, usdcAddress)
                    );
                });

                it("15.1. Success: Repay with _totalOutstanding < lendingTokenAmount", async function () {
                    userAddress = deployMaster.address;
                    totalOutstanding = await plpInstance.totalOutstanding(userAddress, prj1Address, usdcAddress);
                    bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);
                    bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);

                    borrowBalanceStored = await bToken.borrowBalanceStored(userAddress);
                    repayAmount = totalOutstanding.add(toBN(100));

                    await usdc.connect(deployMaster).approve(bLendingTokenAddress, repayAmount);

                    let usdcBalanceOfUserBeforeRepay = await usdc.balanceOf(userAddress);
                    let usdcBalanceOfBLendingTokenBeforeRepay = await usdc.balanceOf(bLendingTokenAddress);
                    let totalBorrowedUsdcTokenBeforeRepay = await plpInstance.totalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.totalBorrow(prj1Address, usdcAddress);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

                    let repayTx = await plpInstance.repay(prj1Address, usdcAddress, repayAmount);
                    let receipt = await repayTx.wait();
                    let events = receipt.events;
                    let args;
                    for (let i = 0; i < events.length; i++)  if (events[i]?.event == "RepayBorrow") args = events[i].args;

                    let usdcBalanceOfUserAfterRepay = await usdc.balanceOf(userAddress);
                    let usdcBalanceOfBLendingTokenAfterRepay = await usdc.balanceOf(bLendingTokenAddress);
                    let totalBorrowedUsdcTokenAfterRepay = await plpInstance.totalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1AfterRepay = await plpInstance.totalBorrow(prj1Address, usdcAddress);
                    let borrowPositionAfterRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

                    expect(usdcBalanceOfUserAfterRepay).to.eq(usdcBalanceOfUserBeforeRepay.sub(args.borrowAmount));
                    expect(usdcBalanceOfBLendingTokenAfterRepay).to.eq(usdcBalanceOfBLendingTokenBeforeRepay.add(args.borrowAmount));
                    expect(totalBorrowedUsdcTokenAfterRepay).to.eq(totalBorrowedUsdcTokenBeforeRepay.sub(args.borrowAmount));
                    expect(totalBorrowPrj1AfterRepay).to.eq(totalBorrowPrj1BeforeRepay.sub(args.borrowAmount));
                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(totalOutstanding);
                    expect(args.isPositionFullyRepaid).to.eq(true);
                    expect(isLeveragePositionAfterRepay).to.eq(false);
                });

                it("15.2. Success: Repay with _totalOutstanding >= lendingTokenAmount", async function () {

                    userAddress = deployMaster.address;
                    totalOutstanding = await plpInstance.totalOutstanding(userAddress, prj1Address, usdcAddress);
                    bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);
                    bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);

                    borrowBalanceStored = await bToken.borrowBalanceStored(userAddress);
                    repayAmount = totalOutstanding.sub(toBN(100));

                    await usdc.connect(deployMaster).approve(bLendingTokenAddress, repayAmount);

                    let usdcBalanceOfUserBeforeRepay = await usdc.balanceOf(userAddress);
                    let usdcBalanceOfBLendingTokenBeforeRepay = await usdc.balanceOf(bLendingTokenAddress);
                    let totalBorrowedUsdcTokenBeforeRepay = await plpInstance.totalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1BeforeRepay = await plpInstance.totalBorrow(prj1Address, usdcAddress);
                    let borrowPositionBeforeRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                    let isLeveragePositionBeforeRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

                    let repayTx = await plpInstance.repay(prj1Address, usdcAddress, repayAmount);
                    let receipt = await repayTx.wait();
                    let events = receipt.events;
                    let args;
                    for (let i = 0; i < events.length; i++)  if (events[i]?.event == "RepayBorrow") args = events[i].args;

                    let usdcBalanceOfUserAfterRepay = await usdc.balanceOf(userAddress);
                    let usdcBalanceOfBLendingTokenAfterRepay = await usdc.balanceOf(bLendingTokenAddress);
                    let totalBorrowedUsdcTokenAfterRepay = await plpInstance.totalBorrowPerLendingToken(usdcAddress);
                    let totalBorrowPrj1AfterRepay = await plpInstance.totalBorrow(prj1Address, usdcAddress);
                    let borrowPositionAfterRepay = await plpInstance.borrowPosition(deployMaster.address, prj1Address, usdcAddress);
                    let isLeveragePositionAfterRepay = await plpLeverageInstance.isLeveragePosition(userAddress, prj1Address);

                    expect(usdcBalanceOfUserAfterRepay).to.eq(usdcBalanceOfUserBeforeRepay.sub(args.borrowAmount));
                    expect(usdcBalanceOfBLendingTokenAfterRepay).to.eq(usdcBalanceOfBLendingTokenBeforeRepay.add(args.borrowAmount));
                    expect(totalBorrowedUsdcTokenAfterRepay).to.eq(totalBorrowedUsdcTokenBeforeRepay.sub(args.borrowAmount));
                    expect(totalBorrowPrj1AfterRepay).to.eq(totalBorrowPrj1BeforeRepay.sub(args.borrowAmount));
                    expect(borrowPositionBeforeRepay.loanBody).to.eq(borrowPositionAfterRepay.loanBody.add(args.borrowAmount));
                    expect(args.borrowAmount).to.eq(repayAmount);
                    expect(args.isPositionFullyRepaid).to.eq(false);
                    expect(isLeveragePositionAfterRepay).to.eq(true);
                });
            });
        });
    });

    describe("borrow", function () {

        before(async function () {
            await loadFixture();
        });

        it("1. Failure: Should throw error when projectToken has an invalid address", async function () {
            let projectToken = "Not Address.";
            let lendingToken = usdcAddress;
            let lendingTokenAmount = toBN(1);

            expect(plpInstance.borrow(
                projectToken,
                lendingToken,
                lendingTokenAmount
            )).to.throw;
        });
        it("2. Failure: Should throw error when lendingToken has an invalid address", async function () {
            let projectToken = prj1.address;
            let lendingToken = "Not Address.";
            let lendingTokenAmount = toBN(1);

            expect(plpInstance.borrow(
                projectToken,
                lendingToken,
                lendingTokenAmount
            )).to.throw;
        });
        it("3. Failure: Should throw error when lendingTokenAmount < 0", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let lendingTokenAmount = -1;

            expect(plpInstance.borrow(
                projectToken,
                lendingToken,
                lendingTokenAmount
            )).to.throw;
        });
        it("4. Failure: Should throw error when lendingTokenAmount > maxUint256", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let lendingTokenAmount = ethers.constants.MaxUint256.add(toBN(1));

            expect(plpInstance.borrow(
                projectToken,
                lendingToken,
                lendingTokenAmount
            )).to.throw;
        });
        it("5. Failure: Should throw error when typeof projectTokenAmount is NOT UINT", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let lendingTokenAmount = 1.1;

            expect(plpInstance.borrow(
                projectToken,
                lendingToken,
                lendingTokenAmount
            )).to.throw;
        });
        it("6. Failure: Should throw error when msg.value != 0", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let lendingTokenAmount = toBN(1);

            expect(plpInstance.borrow(
                projectToken,
                lendingToken,
                lendingTokenAmount,
                {
                    value: toBN(1)
                }
            )).to.throw;
        });
        it("7. Failure: Should revert when isProjectTokenListed == FALSE", async function () {
            let projectToken = ethers.constants.AddressZero;
            let lendingToken = usdc.address;
            let lendingTokenAmount = toBN(1);

            expect(plpInstance.borrow(
                projectToken,
                lendingToken,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: Project token is not listed");
        });
        it("8. Failure: Should revert when isLendingTokenListed == FALSE", async function () {
            let projectToken = prj1.address;
            let lendingToken = ethers.constants.AddressZero;
            let lendingTokenAmount = toBN(1);

            await expect(plpInstance.borrow(
                projectToken,
                lendingToken,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: Lending token is not listed");
        });
        it("9. Failure: Should revert when isLeveragePosition == TRUE", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let lendingTokenAmount = toBN(1);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("1000", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount.mul(10));
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    let exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    let margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    let buyCalldata = await createSellCallData(
                        lendingToken,
                        borrowUSDCAmount,
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
            expect(isLeveragePosition).to.eq(true);
            await expect(plpInstance.borrow(
                projectToken,
                lendingToken,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: Invalid position");
        });
        it("10. Failure: Should revert when lendingTokenAmount == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let lendingTokenAmount = toBN(0);

            await expect(plpInstance.borrow(
                projectToken,
                lendingToken,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: Invalid lending amount");
        });
        it("11. Failure: Should revert when lendingToken != actualLendingToken", async function () {
            let projectToken = prj1.address;
            let lendingToken = usb.address;
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
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            expect(actualLendingToken).to.not.eq(lendingToken);
            expect(actualLendingToken).to.not.eq(ethers.constants.AddressZero);
            await expect(plpInstance.borrow(
                projectToken,
                lendingToken,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: Invalid lending token");
        });
        it("12. Failure: Should revert when availableToBorrow == 0 and loanBody == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let lendingTokenAmount = toBN(1);
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            expect(actualLendingToken).to.eq(ethers.constants.AddressZero);
            expect(await plpInstance.getLendingAvailableToBorrow(
                deployMaster.address,
                projectToken,
                lendingToken
            )).to.eq(toBN(0));
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                lendingToken
            )).loanBody).to.eq(toBN(0));

            await expect(plpInstance.borrow(
                projectToken,
                lendingToken,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: Available amount to borrow is 0");
        });
        it("13. Failure: Should revert when availableToBorrow == 0 and loanBody > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
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
                    let borrowAmount = ethers.utils.parseUnits("100000000", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);
                    await plpInstance.borrow(
                        projectToken,
                        lendingToken,
                        await plpInstance.getLendingAvailableToBorrow(
                            deployMaster.address,
                            projectToken,
                            lendingToken
                        )
                    );
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

            await expect(plpInstance.borrow(
                projectToken,
                lendingToken,
                lendingTokenAmount
            )).to.be.revertedWith("PIT: Available amount to borrow is 0");
        });
        it("14. Success (Single-user): Should borrow available amount USDC when loanBody == 0 and availableToBorrow < lendingTokenAmount", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let lendingTokenAmount = ethers.utils.parseUnits("100", usdcDecimals);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let borrowAmount = ethers.utils.parseUnits("100", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(lendingToken, borrowAmount);
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

            let depositedAmount = await plpInstance.depositedAmount(deployMaster.address, projectToken);
            let balanceTokenBeforeBorrow = await usdc.balanceOf(deployMaster.address);
            let totalOutstandingBeforeBorrow = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowBeforeBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerLendingTokenBeforeBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);

            await expect(plpInstance.borrow(
                projectToken,
                lendingToken,
                lendingTokenAmount
            )).to.emit(plpInstance, "Borrow").withArgs(
                deployMaster.address,
                lendingToken,
                availableToBorrow,
                projectToken,
                depositedAmount
            );

            let balanceTokenAfterBorrow = await usdc.balanceOf(deployMaster.address);
            let totalOutstandingAfterBorrow = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowAfterBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerLendingTokenAfterBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);

            expect(balanceTokenAfterBorrow).eq(balanceTokenBeforeBorrow.add(availableToBorrow));
            expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(availableToBorrow));
            expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(availableToBorrow));
            expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(availableToBorrow));
        });
        it("14. Success (Multi-user): Should borrow available amount USDC when loanBody == 0 and availableToBorrow < lendingTokenAmount", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let lendingTokenAmount = ethers.utils.parseUnits("100", usdcDecimals);
            {
                for (let i = 0; i < signers.length; i++) {
                    {
                        let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                    }
                }
                {
                    let borrowAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(lendingToken, borrowAmount);
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                    signers[i].address,
                    projectToken,
                    lendingToken
                );
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);
                expect(actualLendingToken).to.eq(ethers.constants.AddressZero);
                expect(availableToBorrow).lt(lendingTokenAmount);
                expect((await plpInstance.borrowPosition(
                    signers[i].address,
                    projectToken,
                    lendingToken
                )).loanBody).to.eq(toBN(0));

                let depositedAmount = await plpInstance.depositedAmount(signers[i].address, projectToken);
                let balanceTokenBeforeBorrow = await usdc.balanceOf(signers[i].address);
                let totalOutstandingBeforeBorrow = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowBeforeBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerLendingTokenBeforeBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);

                await expect(plpInstance.connect(signers[i]).borrow(
                    projectToken,
                    lendingToken,
                    lendingTokenAmount
                )).to.emit(plpInstance, "Borrow").withArgs(
                    signers[i].address,
                    lendingToken,
                    availableToBorrow,
                    projectToken,
                    depositedAmount
                );

                let balanceTokenAfterBorrow = await usdc.balanceOf(signers[i].address);
                let totalOutstandingAfterBorrow = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowAfterBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerLendingTokenAfterBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);

                expect(balanceTokenAfterBorrow).eq(balanceTokenBeforeBorrow.add(availableToBorrow));
                expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(availableToBorrow));
                expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(availableToBorrow));
                expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(availableToBorrow));
            }
        });
        it("15. Success (Single-user): Should borrow available amount USDC when loanBody > 0 and availableToBorrow < lendingTokenAmount", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let lendingTokenAmount = ethers.utils.parseUnits("100", usdcDecimals);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let borrowAmount = ethers.utils.parseUnits("100", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(lendingToken, borrowAmount);
                    let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                        deployMaster.address,
                        projectToken,
                        lendingToken
                    );
                    await plpInstance.borrow(
                        projectToken,
                        lendingToken,
                        availableToBorrow.div(2)
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

            let depositedAmount = await plpInstance.depositedAmount(deployMaster.address, projectToken);
            let balanceTokenBeforeBorrow = await usdc.balanceOf(deployMaster.address);
            let totalOutstandingBeforeBorrow = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowBeforeBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerLendingTokenBeforeBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);

            await expect(plpInstance.borrow(
                projectToken,
                lendingToken,
                ethers.constants.MaxUint256
            )).to.emit(plpInstance, "Borrow").withArgs(
                deployMaster.address,
                lendingToken,
                availableToBorrow,
                projectToken,
                depositedAmount
            );

            let balanceTokenAfterBorrow = await usdc.balanceOf(deployMaster.address);
            let totalOutstandingAfterBorrow = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowAfterBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerLendingTokenAfterBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);

            expect(balanceTokenAfterBorrow).eq(balanceTokenBeforeBorrow.add(availableToBorrow));
            expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(availableToBorrow));
            expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(availableToBorrow));
            expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(availableToBorrow));
        });
        it("15. Success (Multi-user): Should borrow available amount USDC when loanBody > 0 and availableToBorrow < lendingTokenAmount", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let lendingTokenAmount = ethers.utils.parseUnits("100", usdcDecimals);
            {
                let borrowAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                await usdc.mint(deployMaster.address, borrowAmount);
                let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                await plpInstance.supply(lendingToken, borrowAmount);
                for (let i = 0; i < signers.length; i++) {
                    {
                        let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                    }
                    {
                        let availableToBorrow = await plpInstance.getLendingAvailableToBorrow(
                            signers[i].address,
                            projectToken,
                            lendingToken
                        );
                        await plpInstance.connect(signers[i]).borrow(
                            projectToken,
                            lendingToken,
                            availableToBorrow.div(2)
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

                let depositedAmount = await plpInstance.depositedAmount(signers[i].address, projectToken);
                let balanceTokenBeforeBorrow = await usdc.balanceOf(signers[i].address);
                let totalOutstandingBeforeBorrow = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowBeforeBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerLendingTokenBeforeBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);

                await expect(plpInstance.connect(signers[i]).borrow(
                    projectToken,
                    lendingToken,
                    lendingTokenAmount
                )).to.emit(plpInstance, "Borrow").withArgs(
                    signers[i].address,
                    lendingToken,
                    availableToBorrow,
                    projectToken,
                    depositedAmount
                );

                let balanceTokenAfterBorrow = await usdc.balanceOf(signers[i].address);
                let totalOutstandingAfterBorrow = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowAfterBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerLendingTokenAfterBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);

                expect(balanceTokenAfterBorrow).eq(balanceTokenBeforeBorrow.add(availableToBorrow));
                expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(availableToBorrow));
                expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(availableToBorrow));
                expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(availableToBorrow));
            }
        });
        it("16. Success (Single-user): Should borrow 100 USDC when loanBody == 0 and availableToBorrow >= lendingTokenAmount", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let lendingTokenAmount = ethers.utils.parseUnits("100", usdcDecimals);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("1000000", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let borrowAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(lendingToken, borrowAmount);
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

            let depositedAmount = await plpInstance.depositedAmount(deployMaster.address, projectToken);
            let balanceTokenBeforeBorrow = await usdc.balanceOf(deployMaster.address);
            let totalOutstandingBeforeBorrow = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowBeforeBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerLendingTokenBeforeBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);

            await expect(plpInstance.borrow(
                projectToken,
                lendingToken,
                lendingTokenAmount
            )).to.emit(plpInstance, "Borrow").withArgs(
                deployMaster.address,
                lendingToken,
                lendingTokenAmount,
                projectToken,
                depositedAmount
            );

            let balanceTokenAfterBorrow = await usdc.balanceOf(deployMaster.address);
            let totalOutstandingAfterBorrow = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowAfterBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerLendingTokenAfterBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);

            expect(balanceTokenAfterBorrow).eq(balanceTokenBeforeBorrow.add(lendingTokenAmount));
            expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(lendingTokenAmount));
            expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(lendingTokenAmount));
            expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(lendingTokenAmount));
        });
        it("16. Success (Multi-user): Should borrow 100 USDC when loanBody == 0 and availableToBorrow >= lendingTokenAmount", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let lendingTokenAmount = ethers.utils.parseUnits("100", usdcDecimals);
            {
                for (let i = 0; i < signers.length; i++) {
                    {
                        let depositAmount = ethers.utils.parseUnits("1000000", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                    }
                    {
                        let borrowAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                        await usdc.mint(signers[i].address, borrowAmount);
                        let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                        await usdc.connect(signers[i]).approve(blendingToken, borrowAmount);
                        await plpInstance.connect(signers[i]).supply(lendingToken, borrowAmount);
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

                let depositedAmount = await plpInstance.depositedAmount(signers[i].address, projectToken);
                let balanceTokenBeforeBorrow = await usdc.balanceOf(signers[i].address);
                let totalOutstandingBeforeBorrow = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowBeforeBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerLendingTokenBeforeBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);

                await expect(plpInstance.connect(signers[i]).borrow(
                    projectToken,
                    lendingToken,
                    lendingTokenAmount
                )).to.emit(plpInstance, "Borrow").withArgs(
                    signers[i].address,
                    lendingToken,
                    lendingTokenAmount,
                    projectToken,
                    depositedAmount
                );

                let balanceTokenAfterBorrow = await usdc.balanceOf(signers[i].address);
                let totalOutstandingAfterBorrow = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowAfterBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerLendingTokenAfterBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);

                expect(balanceTokenAfterBorrow).eq(balanceTokenBeforeBorrow.add(lendingTokenAmount));
                expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(lendingTokenAmount));
                expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(lendingTokenAmount));
                expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(lendingTokenAmount));
            }
        });
        it("17. Success (Single-user): Should borrow available amount USDC when loanBody > 0 and availableToBorrow >= lendingTokenAmount", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let lendingTokenAmount = ethers.utils.parseUnits("100", usdcDecimals);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("1000000", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let borrowAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(lendingToken, borrowAmount);
                    await plpInstance.borrow(
                        projectToken,
                        lendingToken,
                        lendingTokenAmount
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

            let depositedAmount = await plpInstance.depositedAmount(deployMaster.address, projectToken);
            let balanceTokenBeforeBorrow = await usdc.balanceOf(deployMaster.address);
            let totalOutstandingBeforeBorrow = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowBeforeBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerLendingTokenBeforeBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);

            await expect(plpInstance.borrow(
                projectToken,
                lendingToken,
                lendingTokenAmount
            )).to.emit(plpInstance, "Borrow").withArgs(
                deployMaster.address,
                lendingToken,
                lendingTokenAmount,
                projectToken,
                depositedAmount
            );

            let balanceTokenAfterBorrow = await usdc.balanceOf(deployMaster.address);
            let totalOutstandingAfterBorrow = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowAfterBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerLendingTokenAfterBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);

            expect(balanceTokenAfterBorrow).eq(balanceTokenBeforeBorrow.add(lendingTokenAmount));
            expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(lendingTokenAmount));
            expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(lendingTokenAmount));
            expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(lendingTokenAmount));
        });
        it("17. Success (Multi-user): Should borrow available amount USDC when loanBody > 0 and availableToBorrow >= lendingTokenAmount", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let lendingTokenAmount = ethers.utils.parseUnits("100", usdcDecimals);
            {
                for (let i = 0; i < signers.length; i++) {
                    {
                        let depositAmount = ethers.utils.parseUnits("1000000", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                    }
                    {
                        let borrowAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                        await usdc.mint(signers[i].address, borrowAmount);
                        let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                        await usdc.connect(signers[i]).approve(blendingToken, borrowAmount);
                        await plpInstance.connect(signers[i]).supply(lendingToken, borrowAmount);
                        await plpInstance.connect(signers[i]).borrow(
                            projectToken,
                            lendingToken,
                            lendingTokenAmount
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

                let depositedAmount = await plpInstance.depositedAmount(signers[i].address, projectToken);
                let balanceTokenBeforeBorrow = await usdc.balanceOf(signers[i].address);
                let totalOutstandingBeforeBorrow = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowBeforeBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerLendingTokenBeforeBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);

                await expect(plpInstance.connect(signers[i]).borrow(
                    projectToken,
                    lendingToken,
                    lendingTokenAmount
                )).to.emit(plpInstance, "Borrow").withArgs(
                    signers[i].address,
                    lendingToken,
                    lendingTokenAmount,
                    projectToken,
                    depositedAmount
                );

                let balanceTokenAfterBorrow = await usdc.balanceOf(signers[i].address);
                let totalOutstandingAfterBorrow = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowAfterBorrow = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerLendingTokenAfterBorrow = await plpInstance.totalBorrowPerLendingToken(lendingToken);

                expect(balanceTokenAfterBorrow).eq(balanceTokenBeforeBorrow.add(lendingTokenAmount));
                expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(lendingTokenAmount));
                expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(lendingTokenAmount));
                expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(lendingTokenAmount));
            }
        });
    });
});