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

describe("PrimaryLendingPlatformLiquidation", function () {
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

    async function setHighPricePrj1() {
        await priceProviderAggregatorInstance.setTokenAndPriceProvider(
            prj1Address,
            chainlinkPriceProviderAddress,
            false
        );
    }
    async function setLowPricePrj1() {
        await priceProviderAggregatorInstance.setTokenAndPriceProvider(
            prj1Address,
            uniswapV2PriceProviderAddress,
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
        }
    }

    describe("liquidation", async function () {
        this.timeout(24 * 36000 * 100000);

        describe("Liquidate with invalid input", async function () {
            before(async function () {
                await loadFixture();
            });

            it("1. Failure: Should throw error when account is invalid", async function () {
                account = "Not Address.";
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);

                expect(plpLiquidationInstance.liquidate(
                    account,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount
                )).to.throw;
            });

            it("2. Failure: Should throw error when projectToken is invalid", async function () {
                projectTokenAddress = "Not Address.";
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);

                expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    projectTokenAddress,
                    usdcAddress,
                    lendingTokenAmount
                )).to.throw;
            });

            it("3. Failure: Should throw error when lending is invalid", async function () {
                lendingTokenAddress = "Not Address.";
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);

                expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    lendingTokenAddress,
                    lendingTokenAmount
                )).to.throw;
            });

            it("4. Failure: Should throw error when lendingTokenAmount < 0", async function () {
                lendingTokenAmount = -1;

                expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount
                )).to.throw;
            });

            it("5. Failure: Should throw error when lendingTokenAmount > maxUint256", async function () {
                lendingToken = "Not Address.";
                lendingTokenAmount = ethers.constants.MaxUint256.add(toBN(1));

                expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount
                )).to.throw;
            });

            it("6. Failure: Should throw error when lendingTokenAmount is not uint", async function () {
                lendingToken = "Not Address.";
                lendingTokenAmount = 1.1;

                expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount
                )).to.throw;
            });

            it("7. Failure: Should throw error when value != 0", async function () {
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);

                expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                    {
                        value: toBN(100)
                    }
                )).to.throw;
            });

            it("8. Failure: Should revert when isProjectTokenList = FALSE", async function () {
                projectTokenAddress = ethers.constants.AddressZero;
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);

                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    projectTokenAddress,
                    usdcAddress,
                    lendingTokenAmount,
                )).to.be.revertedWith("PITLiquidation: Project token is not listed");
            });

            it("9. Failure: Should revert when isLendingTokenList = FALSE", async function () {
                lendingTokenAddress = ethers.constants.AddressZero;
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);

                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    lendingTokenAddress,
                    lendingTokenAmount,
                )).to.be.revertedWith("PITLiquidation: Lending token is not listed");
            });

            it("10. Failure: Should revert when lendingTokenAmount = 0", async function () {
                lendingTokenAmount = ethers.utils.parseUnits("0", usdcDecimals);

                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                )).to.be.revertedWith("PITLiquidation: LendingTokenAmount must be greater than 0");
            });

            it("11. Failure: Should revert when HF >= 1", async function () {
                lendingTokenAmount = ethers.utils.parseUnits("1", usdcDecimals);

                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                )).to.be.revertedWith("PITLiquidation: HealthFactor>=1");
            });
        });

        describe("Liquidate when HF < 1", async function () {
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
                        // supply usdc
                        bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                        bLendingTokenInstance = await MockToken.attach(bLendingTokenAddress).connect(deployMaster);

                        let supplyAmount = ethers.utils.parseUnits("100000000", usdcDecimals); //100.000.000 usdc
                        await usdc.mint(masterAddress, supplyAmount);
                        await usdc.connect(deployMaster).approve(bLendingTokenAddress, supplyAmount);
                        await plpInstance.supply(usdcAddress, supplyAmount);
                    }
                    {
                        // borrow usdc
                        let borrowAmount = await plpInstance.getLendingAvailableToBorrow(masterAddress, prj1Address, usdcAddress);
                        await plpInstance.borrow(prj1Address, usdcAddress, borrowAmount);
                        await plpInstance.updateInterestInBorrowPositions(masterAddress, usdcAddress);

                        // check HF and liquidation amount
                        await setLowPricePrj1();
                        let currentHealthFactor = await plpLiquidationInstance.getCurrentHealthFactor(masterAddress, prj1Address, usdcAddress);
                        let liquidationAmount = await plpLiquidationInstance.getLiquidationAmount(masterAddress, prj1Address, usdcAddress);

                        healthFactorNumerator = currentHealthFactor.healthFactorNumerator;
                        healthFactorDenominator = currentHealthFactor.healthFactorDenominator;
                        maxLA = liquidationAmount.maxLA;
                        minLA = liquidationAmount.minLA;
                    }
                }
            });

            it("12. Failure: Should revert when lendingTokenAmount < minLA", async function () {
                lendingTokenAmount = minLA.sub(toBN(1));

                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                )).to.be.revertedWith("PITLiquidation: Invalid amount");
            });

            it("13. Failure: Should revert when lendingTokenAmount > maxLA", async function () {
                lendingTokenAmount = maxLA.add(toBN(1));

                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                )).to.be.revertedWith("PITLiquidation: Invalid amount");
            });

            it("14. Failure: Should revert when allowance < lendingTokenAmount", async function () {
                lendingTokenAmount = minLA.add(toBN(100));

                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                )).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
            });

            it("15. Success: Should liquidate successfully", async function () {
                lendingTokenAmount = minLA.add(toBN(100));
                usdc.connect(deployMaster).approve(bLendingTokenAddress, lendingTokenAmount);

                let balanceProjectTokenBeforeLiquidate = await usdc.balanceOf(bLendingTokenAddress);
                let borrowPositionBeforeLiquidate = await plpInstance.borrowPosition(masterAddress, prj1Address, usdcAddress);
                let isLeveragePositionBeforeLiquidate = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);
                let totalBorrowedUsdcTokenBeforeLiquidate = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                let totalBorrowPrj1BeforeLiquidate = await plpInstance.getTotalBorrowPerCollateral(prj1Address);

                let liquidateTx = await (plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                ));
                await liquidateTx.wait();

                let balanceProjectTokenAfterLiquidate = await usdc.balanceOf(bLendingTokenAddress);
                let borrowPositionAfterLiquidate = await plpInstance.borrowPosition(masterAddress, prj1Address, usdcAddress);
                let isLeveragePositionAfterLiquidate = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);
                let totalBorrowedUsdcTokenAfterLiquidate = await plpInstance.getTotalBorrowPerLendingToken(usdcAddress);
                let totalBorrowPrj1AfterLiquidate = await plpInstance.getTotalBorrowPerCollateral(prj1Address);

                expect(balanceProjectTokenBeforeLiquidate).to.eq(balanceProjectTokenAfterLiquidate.sub(lendingTokenAmount));
                expect(borrowPositionBeforeLiquidate.loanBody).to.eq(borrowPositionAfterLiquidate.loanBody.add(lendingTokenAmount));
            });

            it("16. Failure: Should revert when balance user < lendingTokenAmount", async function () {
                lendingTokenAmount = minLA.add(toBN(100));
                usdc.connect(deployMaster).approve(bLendingTokenAddress, lendingTokenAmount);
                let balanceUser = await usdc.balanceOf(masterAddress);
                usdc.connect(deployMaster).transfer(bLendingTokenAddress, balanceUser);

                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                )).to.be.revertedWith("ERC20: transfer amount exceeds balance'");
            });
        });
    });
});