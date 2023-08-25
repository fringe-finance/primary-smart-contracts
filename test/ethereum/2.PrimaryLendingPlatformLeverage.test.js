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
const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);

describe("PrimaryLendingPlatformLeverage", function () {
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
            // console.log(addresses);

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

    describe("leveragedBorrow", async function () {
        before(async function () {
            await loadFixture();
        });

        it("1. Failure: Should throw error when projectToken has an invalid address", async function () {
            let projectToken = "Not Address.";
            let lendingToken = usdcAddress;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.throw;
        });
        it("2. Failure: Should throw error when lendingToken has an invalid address", async function () {
            let projectToken = prj1.address;
            let lendingToken = "Not Address.";
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.throw;
        });
        it("3. Failure: Should throw error when notionalExposure < 0", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(-1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.throw;
        });
        it("4. Failure: Should throw error when notionalExposure > maxUint256", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = ethers.constants.MaxUint256.add(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.throw;
        });
        it("5. Failure: Should throw error when typeof notionalExposure is NOT UINT", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = 1.1;
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.throw;
        });
        it("6. Failure: Should throw error when marginCollateralAmount < 0", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(-1);
            let buyCalldata = "0x";
            let type = toBN(0);

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.throw;
        });
        it("7. Failure: Should throw error when marginCollateralAmount > maxUint256", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = ethers.constants.MaxUint256.add(1);
            let buyCalldata = "0x";
            let type = toBN(0);

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.throw;
        });
        it("8. Failure: Should throw error when typeof marginCollateralAmount is NOT UINT", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = 1.1;
            let buyCalldata = "0x";
            let type = toBN(0);

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.throw;
        });
        it("9. Failure: Should throw error when buyCalldata is NOT BYTES", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "NOT BYTES.";
            let type = toBN(0);

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.throw;
        });
        it("10. Failure: Should throw error when leverageType < 0", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(-1);

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.throw;
        });
        it("11. Failure: Should throw error when leverageType > 255 (uint8)", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(256);

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.throw;
        });
        it("12. Failure: Should throw error when typeof leverageType is NOT UINT", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = 1.1;

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.throw;
        });
        it("13. Failure: Should revert when leverageType > 1", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(2);

            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.reverted;
        });
        it("14. Failure: Should throw error when msg.value != 0", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                {
                    value: toBN(1)
                }
            )).to.throw;
        });
        it("15. Failure: Should revert when notionalExposure == 0", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(0);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);

            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PITLeverage: Invalid amount");
        });
        it("16. Failure: Should revert when lendingToken != currentLendingToken and currentLendingToken != ZERO ADDRESS", async function () {
            let projectToken = prj1.address;
            let lendingToken = usb.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
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
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PITLeverage: Invalid lending token");
        });
        it("17. Failure: Should revert when lendingToken == currentLendingToken, isLeveragePosition == FALSE and loadBody > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
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

            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(lendingToken);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                lendingToken
            )).loanBody).to.gt(toBN(0));
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PITLeverage: Invalid position");
        });
        it("18. Failure: Should revert when currentLendingToken == ZERO ADDRESS and marginCollateralAmount < depositedProjectTokenAmount", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin;
            let buyCalldata = "0x";
            let type = toBN(0);
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
            }
            let depositedTokenAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            margin = depositedTokenAmount.sub(1);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                lendingToken
            )).loanBody).to.eq(toBN(0));
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PITLeverage: Invalid amount");
        });
        it("19. Failure: Should revert when marginCollateralAmount < depositedProjectTokenAmount and isLeveragePosition == TRUE", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
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
                        type
                    );
                }
            }
            let depositedTokenAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            margin = depositedTokenAmount.sub(1);
            buyCalldata = "0x";
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                lendingToken
            )).loanBody).to.gt(toBN(0));
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PITLeverage: Invalid amount");
        });
        it("20. Failure: Should revert when buyOnExchangeAggregator fails", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata = "0x";
            let type = toBN(0);
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
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.reverted;
        });
        it.skip("21. Failure: Should revert when isProjectTokenListed == FALSE", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);

            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PIT: Project token is not listed");
        });
        it.skip("22. Failure: Should revert when isLendingTokenListed == FALSE", async function () {
            let projectToken = prj1.address;
            let lendingToken = ethers.constants.AddressZero;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);

            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PIT: Lending token is not listed");
        });
        it("23. Failure: Should revert when allowance lendingToken < lendingTokenCount and isLeveragePosition == FALSE", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount.sub(1));
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("ERC20: transfer amount exceeds allowance");
        });
        it("24. Failure: Should revert when allowance lendingToken < lendingTokenCount and isLeveragePosition == TRUE", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
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
                        type
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(200), toBN(10), exp);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount.sub(1));
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("ERC20: transfer amount exceeds allowance");
        });
        it("25. Failure: Should revert when allowance projectToken < addingAmount and isLeveragePosition == FALSE", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount.sub(1));
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("ERC20: transfer amount exceeds allowance");
        });
        it("26. Failure: Should revert when allowance projectToken < addingAmount and isLeveragePosition == TRUE", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
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
                        type
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(200), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount.sub(1));
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("ERC20: transfer amount exceeds allowance");
        });
        it("27. Failure: Should revert when balance projectToken < addingAmount and isLeveragePosition == FALSE", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
                    await prj1.connect(deployMaster).transfer(signers[1].address, (await prj1.balanceOf(deployMaster.address)));
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount.sub(1));
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let balanceSender = await prj1.balanceOf(deployMaster.address);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(balanceSender).to.lt(addingAmount);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("ERC20: transfer amount exceeds balance");
        });
        it("28. Failure: Should revert when balance projectToken < addingAmount and isLeveragePosition == TRUE", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
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
                        type
                    );
                }
                {
                    await prj1.connect(deployMaster).transfer(signers[1].address, (await prj1.balanceOf(deployMaster.address)));
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(200), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let balanceSender = await prj1.balanceOf(deployMaster.address);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(balanceSender).to.lt(addingAmount);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("ERC20: transfer amount exceeds balance");
        });
        it("29. Failure: Should revert when totalOutstandingInUSD > pit, isLeveragePosition == FALSE and addingAmount > 0", async function () {
            await loadFixture();

            await setHighPricePrj1();
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
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
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            await setLowPricePrj1();
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PITLeverage: LendingTokenAmount exceeds pit remaining");
        });
        it("30. Failure: Should revert when totalOutstandingInUSD > pit, isLeveragePosition == TRUE and addingAmount > 0", async function () {
            await loadFixture();

            await setHighPricePrj1();
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
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
                    let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
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
                        type
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(200), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            await setLowPricePrj1();
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PITLeverage: LendingTokenAmount exceeds pit remaining");
        });
        it("31. Failure: Should revert when totalOutstandingInUSD > pit, isLeveragePosition == FALSE and addingAmount == 0", async function () {
            await loadFixture();

            await setHighPricePrj1();
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
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
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpInstance.address, addingAmount);
            await plpInstance.deposit(projectToken, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            await setLowPricePrj1();
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PITLeverage: LendingTokenAmount exceeds pit remaining");
        });
        it("32. Failure: Should revert when totalOutstandingInUSD > pit, isLeveragePosition == TRUE and addingAmount == 0", async function () {
            await loadFixture();

            await setHighPricePrj1();
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
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
                    let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
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
                        type
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(200), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpInstance.address, addingAmount);
            await plpInstance.deposit(projectToken, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            await setLowPricePrj1();
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PITLeverage: LendingTokenAmount exceeds pit remaining");
        });
        it("33. Failure: Should revert when totalBorrowPerCollateral > borrowLimitPerCollateral, isLeveragePosition == FALSE and addingAmount > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
                    let borrowLimitPerCollateral = await plpInstance.borrowLimitPerCollateral(projectToken);
                    let lendingTokenCount = await plpLeverageInstance.calculateLendingTokenCount(lendingToken, borrowLimitPerCollateral);
                    let supplyAmount = lendingTokenCount.mul(10);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let projectTokenCount = await plpLeverageInstance.calculateLendingTokenCount(projectToken, borrowLimitPerCollateral);
                    await prj1.mintTo(signers[1].address, projectTokenCount.mul(10));
                    await prj1.connect(signers[1]).approve(plpAddress, projectTokenCount.mul(10));
                    await plpInstance.connect(signers[1]).deposit(
                        projectToken,
                        projectTokenCount.mul(10)
                    );
                    await plpInstance.connect(signers[1]).borrow(
                        projectToken,
                        lendingToken,
                        await plpInstance.getLendingAvailableToBorrow(
                            signers[1].address,
                            projectToken,
                            lendingToken
                        )
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        });
        it("34. Failure: Should revert when totalBorrowPerCollateral > borrowLimitPerCollateral, isLeveragePosition == TRUE and addingAmount > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
                    let supplyAmount = ethers.utils.parseUnits("10000000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    await prj1.mintTo(deployMaster.address, addingAmount);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
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
                        type
                    );
                }
                {
                    let borrowLimitPerCollateral = await plpInstance.borrowLimitPerCollateral(projectToken);
                    let projectTokenCount = await plpLeverageInstance.calculateLendingTokenCount(projectToken, borrowLimitPerCollateral);
                    await prj1.mintTo(signers[1].address, projectTokenCount.mul(10));
                    await prj1.connect(signers[1]).approve(plpAddress, projectTokenCount.mul(10));
                    await plpInstance.connect(signers[1]).deposit(
                        projectToken,
                        projectTokenCount.mul(10)
                    );
                    await plpInstance.connect(signers[1]).borrow(
                        projectToken,
                        lendingToken,
                        await plpInstance.getLendingAvailableToBorrow(
                            signers[1].address,
                            projectToken,
                            lendingToken
                        )
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(200), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.mintTo(deployMaster.address, addingAmount);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        });
        it("35. Failure: Should revert when totalBorrowPerCollateral > borrowLimitPerCollateral, isLeveragePosition == FALSE and addingAmount == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
                    let borrowLimitPerCollateral = await plpInstance.borrowLimitPerCollateral(projectToken);
                    let lendingTokenCount = await plpLeverageInstance.calculateLendingTokenCount(lendingToken, borrowLimitPerCollateral);
                    let supplyAmount = lendingTokenCount.mul(10);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let projectTokenCount = await plpLeverageInstance.calculateLendingTokenCount(projectToken, borrowLimitPerCollateral);
                    await prj1.mintTo(signers[1].address, projectTokenCount.mul(10));
                    await prj1.connect(signers[1]).approve(plpAddress, projectTokenCount.mul(10));
                    await plpInstance.connect(signers[1]).deposit(
                        projectToken,
                        projectTokenCount.mul(10)
                    );
                    await plpInstance.connect(signers[1]).borrow(
                        projectToken,
                        lendingToken,
                        await plpInstance.getLendingAvailableToBorrow(
                            signers[1].address,
                            projectToken,
                            lendingToken
                        )
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.mintTo(deployMaster.address, addingAmount);
            await prj1.connect(deployMaster).approve(plpAddress, addingAmount);
            await plpInstance.deposit(projectToken, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        });
        it("36. Failure: Should revert when totalBorrowPerCollateral > borrowLimitPerCollateral, isLeveragePosition == TRUE and addingAmount == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
                    let supplyAmount = ethers.utils.parseUnits("10000000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    await prj1.mintTo(deployMaster.address, addingAmount);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
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
                        type
                    );
                }
                {
                    let borrowLimitPerCollateral = await plpInstance.borrowLimitPerCollateral(projectToken);
                    let projectTokenCount = await plpLeverageInstance.calculateLendingTokenCount(projectToken, borrowLimitPerCollateral);
                    await prj1.mintTo(signers[1].address, projectTokenCount.mul(10));
                    await prj1.connect(signers[1]).approve(plpAddress, projectTokenCount.mul(10));
                    await plpInstance.connect(signers[1]).deposit(
                        projectToken,
                        projectTokenCount.mul(10)
                    );
                    await plpInstance.connect(signers[1]).borrow(
                        projectToken,
                        lendingToken,
                        await plpInstance.getLendingAvailableToBorrow(
                            signers[1].address,
                            projectToken,
                            lendingToken
                        )
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(200), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.mintTo(deployMaster.address, addingAmount);
            await prj1.connect(deployMaster).approve(plpAddress, addingAmount);
            await plpInstance.deposit(projectToken, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        });
        it("37. Failure: Should revert when totalBorrowPerLendingToken > borrowLimitPerLendingToken, isLeveragePosition == FALSE and addingAmount > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let lendingTokenCount = await plpLeverageInstance.calculateLendingTokenCount(lendingToken, borrowLimitPerLendingToken);
                    let supplyAmount = lendingTokenCount.mul(10);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let projectTokenCount = await plpLeverageInstance.calculateLendingTokenCount(prj2.address, borrowLimitPerLendingToken);
                    await prj2.mintTo(signers[1].address, projectTokenCount.mul(10));
                    await prj2.connect(signers[1]).approve(plpAddress, projectTokenCount.mul(10));
                    await plpInstance.connect(signers[1]).deposit(
                        prj2.address,
                        projectTokenCount.mul(10)
                    );
                    await plpInstance.connect(signers[1]).borrow(
                        prj2.address,
                        lendingToken,
                        await plpInstance.getLendingAvailableToBorrow(
                            signers[1].address,
                            prj2.address,
                            lendingToken
                        )
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
        });
        it("38. Failure: Should revert when totalBorrowPerLendingToken > borrowLimitPerLendingToken, isLeveragePosition == TRUE and addingAmount > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
                    let supplyAmount = ethers.utils.parseUnits("10000000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    await prj1.mintTo(deployMaster.address, addingAmount);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
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
                        type
                    );
                }
                {
                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let projectTokenCount = await plpLeverageInstance.calculateLendingTokenCount(prj2.address, borrowLimitPerLendingToken);
                    await prj2.mintTo(signers[1].address, projectTokenCount.mul(10));
                    await prj2.connect(signers[1]).approve(plpAddress, projectTokenCount.mul(10));
                    await plpInstance.connect(signers[1]).deposit(
                        prj2.address,
                        projectTokenCount.mul(10)
                    );
                    await plpInstance.connect(signers[1]).borrow(
                        prj2.address,
                        lendingToken,
                        await plpInstance.getLendingAvailableToBorrow(
                            signers[1].address,
                            prj2.address,
                            lendingToken
                        )
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(200), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.mintTo(deployMaster.address, addingAmount);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
        });
        it("39. Failure: Should revert when totalBorrowPerLendingToken > borrowLimitPerLendingToken, isLeveragePosition == FALSE and addingAmount == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let lendingTokenCount = await plpLeverageInstance.calculateLendingTokenCount(lendingToken, borrowLimitPerLendingToken);
                    let supplyAmount = lendingTokenCount.mul(10);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let projectTokenCount = await plpLeverageInstance.calculateLendingTokenCount(prj2.address, borrowLimitPerLendingToken);
                    await prj2.mintTo(signers[1].address, projectTokenCount.mul(10));
                    await prj2.connect(signers[1]).approve(plpAddress, projectTokenCount.mul(10));
                    await plpInstance.connect(signers[1]).deposit(
                        prj2.address,
                        projectTokenCount.mul(10)
                    );
                    await plpInstance.connect(signers[1]).borrow(
                        prj2.address,
                        lendingToken,
                        await plpInstance.getLendingAvailableToBorrow(
                            signers[1].address,
                            prj2.address,
                            lendingToken
                        )
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.mintTo(deployMaster.address, addingAmount);
            await prj1.connect(deployMaster).approve(plpAddress, addingAmount);
            await plpInstance.deposit(projectToken, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
        });
        it("40. Failure: Should revert when totalBorrowPerLendingToken > borrowLimitPerLendingToken, isLeveragePosition == TRUE and addingAmount == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let lendingTokenCount = await plpLeverageInstance.calculateLendingTokenCount(lendingToken, borrowLimitPerLendingToken);
                    let supplyAmount = lendingTokenCount.mul(10);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    await prj1.mintTo(deployMaster.address, addingAmount);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
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
                        type
                    );
                }
                {
                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let projectTokenCount = await plpLeverageInstance.calculateLendingTokenCount(prj2.address, borrowLimitPerLendingToken);
                    await prj2.mintTo(signers[1].address, projectTokenCount.mul(10));
                    await prj2.connect(signers[1]).approve(plpAddress, projectTokenCount.mul(10));
                    await plpInstance.connect(signers[1]).deposit(
                        prj2.address,
                        projectTokenCount.mul(10)
                    );
                    await plpInstance.connect(signers[1]).borrow(
                        prj2.address,
                        lendingToken,
                        await plpInstance.getLendingAvailableToBorrow(
                            signers[1].address,
                            prj2.address,
                            lendingToken
                        )
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("500", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(200), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.mintTo(deployMaster.address, addingAmount);
            await prj1.connect(deployMaster).approve(plpAddress, addingAmount);
            await plpInstance.deposit(projectToken, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
        });
        it("41. Success (Single-user): Should leveraged borrow 50 USDC when isLeveragePosition == FALSE and addingAmount > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let lendingTokenCount = await plpLeverageInstance.calculateLendingTokenCount(lendingToken, borrowLimitPerLendingToken);
                    await usdc.mint(deployMaster.address, lendingTokenCount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, lendingTokenCount);
                    await plpInstance.supply(lendingToken, lendingTokenCount);
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePositionBeforeLeverage = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePositionBeforeLeverage).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);


            let balanceProjectTokenBeforeLeverage = await prj1.balanceOf(deployMaster.address);
            let allowanceProjectTokenBeforeLeverage = await prj1.allowance(deployMaster.address, plpLeverageAddress);
            let allowanceLendingTokenBeforeLeverage = await usdc.allowance(deployMaster.address, plpLeverageAddress);
            let totalOutstandingBeforeLeverage = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowBeforeLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerCollateralBeforeLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
            let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
            let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            let tx = await plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            );
            let receipt = await tx.wait();
            let events = receipt.events;
            let argsEvent;
            for (let i = 0; i < events.length; i++) {
                if (events[i]?.event == "LeveragedBorrow") {
                    argsEvent = events[i].args;
                    break;
                }
            }
            let isLeveragePositionAfterLeverage = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let balanceProjectTokenAfterLeverage = await prj1.balanceOf(deployMaster.address);
            let allowanceProjectTokenAfterLeverage = await prj1.allowance(deployMaster.address, plpLeverageAddress);
            let allowanceLendingTokenAfterLeverage = await usdc.allowance(deployMaster.address, plpLeverageAddress);
            let totalOutstandingAfterLeverage = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowAfterLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerCollateralAfterLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
            let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
            let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(isLeveragePositionAfterLeverage).to.eq(true);
            expect(balanceProjectTokenAfterLeverage).to.eq(balanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
            expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
            expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
            expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
            expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
        });
        it("41. Success (Multi-user): Should leveraged borrow 50 USDC when isLeveragePosition == FALSE and addingAmount > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                for (let i = 0; i < signers.length; i++) {
                    let depositAmount = ethers.utils.parseUnits("1000", prj1Decimals);
                    await prj1.mintTo(signers[i].address, depositAmount.mul(10));
                    await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                    await plpInstance.connect(signers[i]).deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let lendingTokenCount = await plpLeverageInstance.calculateLendingTokenCount(lendingToken, borrowLimitPerLendingToken);
                    await usdc.mint(deployMaster.address, lendingTokenCount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, lendingTokenCount);
                    await plpInstance.supply(lendingToken, lendingTokenCount);
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
                let addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                await prj1.connect(signers[i]).approve(plpLeverageInstance.address, addingAmount);
                await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowUSDCAmount);
                buyCalldata = await createSellCallData(
                    lendingToken,
                    borrowUSDCAmount,
                    0,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, lendingToken)]
                );
                let isLeveragePositionBeforeLeverage = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);
                let currentLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                expect(addingAmount).to.gt(0);
                expect(isLeveragePositionBeforeLeverage).to.eq(false);
                expect(currentLendingToken).to.eq(ethers.constants.AddressZero);


                let balanceProjectTokenBeforeLeverage = await prj1.balanceOf(signers[i].address);
                let allowanceProjectTokenBeforeLeverage = await prj1.allowance(signers[i].address, plpLeverageAddress);
                let allowanceLendingTokenBeforeLeverage = await usdc.allowance(signers[i].address, plpLeverageAddress);
                let totalOutstandingBeforeLeverage = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowBeforeLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerCollateralBeforeLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
                let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
                let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

                let tx = await plpLeverageInstance.connect(signers[i]).leveragedBorrow(
                    projectToken,
                    lendingToken,
                    exp,
                    margin,
                    buyCalldata,
                    type
                );
                let receipt = await tx.wait();
                let events = receipt.events;
                let argsEvent;
                for (let i = 0; i < events.length; i++) {
                    if (events[i]?.event == "LeveragedBorrow") {
                        argsEvent = events[i].args;
                        break;
                    }
                }
                let isLeveragePositionAfterLeverage = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);
                let balanceProjectTokenAfterLeverage = await prj1.balanceOf(signers[i].address);
                let allowanceProjectTokenAfterLeverage = await prj1.allowance(signers[i].address, plpLeverageAddress);
                let allowanceLendingTokenAfterLeverage = await usdc.allowance(signers[i].address, plpLeverageAddress);
                let totalOutstandingAfterLeverage = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowAfterLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerCollateralAfterLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
                let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
                let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(isLeveragePositionAfterLeverage).to.eq(true);
                expect(balanceProjectTokenAfterLeverage).to.eq(balanceProjectTokenBeforeLeverage.sub(addingAmount));
                expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
                expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
                expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
                expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
                expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
                expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
                expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
                expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
            }
        });
        it("42. Success (Single-user): Should leveraged borrow 50 USDC when isLeveragePosition == TRUE and addingAmount > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
                    let supplyAmount = ethers.utils.parseUnits("10000000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    await prj1.mintTo(deployMaster.address, addingAmount);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
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
                        type
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(200), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.mintTo(deployMaster.address, addingAmount);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePositionBeforeLeverage = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePositionBeforeLeverage).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);


            let balanceProjectTokenBeforeLeverage = await prj1.balanceOf(deployMaster.address);
            let allowanceProjectTokenBeforeLeverage = await prj1.allowance(deployMaster.address, plpLeverageAddress);
            let allowanceLendingTokenBeforeLeverage = await usdc.allowance(deployMaster.address, plpLeverageAddress);
            let totalOutstandingBeforeLeverage = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowBeforeLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerCollateralBeforeLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
            let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
            let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            let tx = await plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            );
            let receipt = await tx.wait();
            let events = receipt.events;
            let argsEvent;
            for (let i = 0; i < events.length; i++) {
                if (events[i]?.event == "LeveragedBorrow") {
                    argsEvent = events[i].args;
                    break;
                }
            }
            let isLeveragePositionAfterLeverage = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let balanceProjectTokenAfterLeverage = await prj1.balanceOf(deployMaster.address);
            let allowanceProjectTokenAfterLeverage = await prj1.allowance(deployMaster.address, plpLeverageAddress);
            let allowanceLendingTokenAfterLeverage = await usdc.allowance(deployMaster.address, plpLeverageAddress);
            let totalOutstandingAfterLeverage = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowAfterLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerCollateralAfterLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
            let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
            let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(isLeveragePositionAfterLeverage).to.eq(true);
            expect(balanceProjectTokenAfterLeverage).to.eq(balanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
            expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
            expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
            expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
            expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
        });
        it("42. Success (Multi-user): Should leveraged borrow 50 USDC when isLeveragePosition == TRUE and addingAmount > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let supplyAmount = ethers.utils.parseUnits("10000000", usdcDecimals);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                for (let i = 0; i < signers.length; i++) {
                    {
                        let depositAmount = ethers.utils.parseUnits("1000", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount.mul(10));
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                    }
                    {
                        let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                        exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                        margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
                        let addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                        await prj1.mintTo(signers[i].address, addingAmount);
                        await prj1.connect(signers[i]).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                        await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowUSDCAmount);
                        let buyCalldata = await createSellCallData(
                            lendingToken,
                            borrowUSDCAmount,
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
                            type
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(200), toBN(10), exp);
                let addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                await prj1.mintTo(signers[i].address, addingAmount);
                await prj1.connect(signers[i]).approve(plpLeverageInstance.address, addingAmount);
                await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowUSDCAmount);
                buyCalldata = await createSellCallData(
                    lendingToken,
                    borrowUSDCAmount,
                    0,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, lendingToken)]
                );
                let isLeveragePositionBeforeLeverage = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);
                let currentLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                expect(addingAmount).to.gt(0);
                expect(isLeveragePositionBeforeLeverage).to.eq(true);
                expect(currentLendingToken).to.eq(lendingToken);


                let balanceProjectTokenBeforeLeverage = await prj1.balanceOf(signers[i].address);
                let allowanceProjectTokenBeforeLeverage = await prj1.allowance(signers[i].address, plpLeverageAddress);
                let allowanceLendingTokenBeforeLeverage = await usdc.allowance(signers[i].address, plpLeverageAddress);
                let totalOutstandingBeforeLeverage = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowBeforeLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerCollateralBeforeLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
                let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
                let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

                let tx = await plpLeverageInstance.connect(signers[i]).leveragedBorrow(
                    projectToken,
                    lendingToken,
                    exp,
                    margin,
                    buyCalldata,
                    type
                );
                let receipt = await tx.wait();
                let events = receipt.events;
                let argsEvent;
                for (let i = 0; i < events.length; i++) {
                    if (events[i]?.event == "LeveragedBorrow") {
                        argsEvent = events[i].args;
                        break;
                    }
                }
                let isLeveragePositionAfterLeverage = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);
                let balanceProjectTokenAfterLeverage = await prj1.balanceOf(signers[i].address);
                let allowanceProjectTokenAfterLeverage = await prj1.allowance(signers[i].address, plpLeverageAddress);
                let allowanceLendingTokenAfterLeverage = await usdc.allowance(signers[i].address, plpLeverageAddress);
                let totalOutstandingAfterLeverage = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowAfterLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerCollateralAfterLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
                let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
                let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(isLeveragePositionAfterLeverage).to.eq(true);
                expect(balanceProjectTokenAfterLeverage).to.eq(balanceProjectTokenBeforeLeverage.sub(addingAmount));
                expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
                expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
                expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
                expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
                expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
                expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
                expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
                expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
            }
        });
        it("43. Success (Single-user): Should leveraged borrow 50 USDC when isLeveragePosition == FALSE and addingAmount == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let lendingTokenCount = await plpLeverageInstance.calculateLendingTokenCount(lendingToken, borrowLimitPerLendingToken);
                    let supplyAmount = lendingTokenCount.mul(10);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.mintTo(deployMaster.address, addingAmount);
            await prj1.connect(deployMaster).approve(plpAddress, addingAmount);
            await plpInstance.deposit(projectToken, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePositionBeforeLeverage = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePositionBeforeLeverage).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);


            let balanceProjectTokenBeforeLeverage = await prj1.balanceOf(deployMaster.address);
            let allowanceProjectTokenBeforeLeverage = await prj1.allowance(deployMaster.address, plpLeverageAddress);
            let allowanceLendingTokenBeforeLeverage = await usdc.allowance(deployMaster.address, plpLeverageAddress);
            let totalOutstandingBeforeLeverage = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowBeforeLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerCollateralBeforeLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
            let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
            let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            let tx = await plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            );
            let receipt = await tx.wait();
            let events = receipt.events;
            let argsEvent;
            for (let i = 0; i < events.length; i++) {
                if (events[i]?.event == "LeveragedBorrow") {
                    argsEvent = events[i].args;
                    break;
                }
            }
            let isLeveragePositionAfterLeverage = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let balanceProjectTokenAfterLeverage = await prj1.balanceOf(deployMaster.address);
            let allowanceProjectTokenAfterLeverage = await prj1.allowance(deployMaster.address, plpLeverageAddress);
            let allowanceLendingTokenAfterLeverage = await usdc.allowance(deployMaster.address, plpLeverageAddress);
            let totalOutstandingAfterLeverage = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowAfterLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerCollateralAfterLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
            let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
            let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(isLeveragePositionAfterLeverage).to.eq(true);
            expect(balanceProjectTokenAfterLeverage).to.eq(balanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
            expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
            expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
            expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
            expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
        });
        it("43. Success (Multi-user): Should leveraged borrow 50 USDC when isLeveragePosition == FALSE and addingAmount == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                for (let i = 0; i < signers.length; i++) {
                    let depositAmount = ethers.utils.parseUnits("1000", prj1Decimals);
                    await prj1.mintTo(signers[i].address, depositAmount.mul(10));
                    await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                    await plpInstance.connect(signers[i]).deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let lendingTokenCount = await plpLeverageInstance.calculateLendingTokenCount(lendingToken, borrowLimitPerLendingToken);
                    let supplyAmount = lendingTokenCount.mul(10);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
                let addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                await prj1.mintTo(signers[i].address, addingAmount);
                await prj1.connect(signers[i]).approve(plpAddress, addingAmount);
                await plpInstance.connect(signers[i]).deposit(projectToken, addingAmount);
                await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowUSDCAmount);
                buyCalldata = await createSellCallData(
                    lendingToken,
                    borrowUSDCAmount,
                    0,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, lendingToken)]
                );
                let isLeveragePositionBeforeLeverage = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);
                let currentLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);
                addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);

                expect(addingAmount).to.eq(0);
                expect(isLeveragePositionBeforeLeverage).to.eq(false);
                expect(currentLendingToken).to.eq(ethers.constants.AddressZero);


                let balanceProjectTokenBeforeLeverage = await prj1.balanceOf(signers[i].address);
                let allowanceProjectTokenBeforeLeverage = await prj1.allowance(signers[i].address, plpLeverageAddress);
                let allowanceLendingTokenBeforeLeverage = await usdc.allowance(signers[i].address, plpLeverageAddress);
                let totalOutstandingBeforeLeverage = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowBeforeLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerCollateralBeforeLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
                let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
                let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

                let tx = await plpLeverageInstance.connect(signers[i]).leveragedBorrow(
                    projectToken,
                    lendingToken,
                    exp,
                    margin,
                    buyCalldata,
                    type
                );
                let receipt = await tx.wait();
                let events = receipt.events;
                let argsEvent;
                for (let i = 0; i < events.length; i++) {
                    if (events[i]?.event == "LeveragedBorrow") {
                        argsEvent = events[i].args;
                        break;
                    }
                }
                let isLeveragePositionAfterLeverage = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);
                let balanceProjectTokenAfterLeverage = await prj1.balanceOf(signers[i].address);
                let allowanceProjectTokenAfterLeverage = await prj1.allowance(signers[i].address, plpLeverageAddress);
                let allowanceLendingTokenAfterLeverage = await usdc.allowance(signers[i].address, plpLeverageAddress);
                let totalOutstandingAfterLeverage = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowAfterLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerCollateralAfterLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
                let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
                let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(isLeveragePositionAfterLeverage).to.eq(true);
                expect(balanceProjectTokenAfterLeverage).to.eq(balanceProjectTokenBeforeLeverage.sub(addingAmount));
                expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
                expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
                expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
                expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
                expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
                expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
                expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
                expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
            }
        });
        it("44. Success (Single-user): Should leveraged borrow 50 USDC when isLeveragePosition == TRUE and addingAmount == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
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
                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let lendingTokenCount = await plpLeverageInstance.calculateLendingTokenCount(lendingToken, borrowLimitPerLendingToken);
                    let supplyAmount = lendingTokenCount.mul(10);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                    margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    await prj1.mintTo(deployMaster.address, addingAmount);
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
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
                        type
                    );
                }
            }
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
            margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(200), toBN(10), exp);
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.mintTo(deployMaster.address, addingAmount);
            await prj1.connect(deployMaster).approve(plpAddress, addingAmount);
            await plpInstance.deposit(projectToken, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = await createSellCallData(
                lendingToken,
                borrowUSDCAmount,
                0,
                ethers.constants.AddressZero,
                [await factory.getPair(projectToken, lendingToken)]
            );
            let isLeveragePositionBeforeLeverage = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePositionBeforeLeverage).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);


            let balanceProjectTokenBeforeLeverage = await prj1.balanceOf(deployMaster.address);
            let allowanceProjectTokenBeforeLeverage = await prj1.allowance(deployMaster.address, plpLeverageAddress);
            let allowanceLendingTokenBeforeLeverage = await usdc.allowance(deployMaster.address, plpLeverageAddress);
            let totalOutstandingBeforeLeverage = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowBeforeLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerCollateralBeforeLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
            let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
            let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            let tx = await plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type
            );
            let receipt = await tx.wait();
            let events = receipt.events;
            let argsEvent;
            for (let i = 0; i < events.length; i++) {
                if (events[i]?.event == "LeveragedBorrow") {
                    argsEvent = events[i].args;
                    break;
                }
            }
            let isLeveragePositionAfterLeverage = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let balanceProjectTokenAfterLeverage = await prj1.balanceOf(deployMaster.address);
            let allowanceProjectTokenAfterLeverage = await prj1.allowance(deployMaster.address, plpLeverageAddress);
            let allowanceLendingTokenAfterLeverage = await usdc.allowance(deployMaster.address, plpLeverageAddress);
            let totalOutstandingAfterLeverage = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowAfterLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
            let totalBorrowPerCollateralAfterLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
            let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
            let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(isLeveragePositionAfterLeverage).to.eq(true);
            expect(balanceProjectTokenAfterLeverage).to.eq(balanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
            expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
            expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
            expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
            expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
        });
        it("44. Success (Multi-user): Should leveraged borrow 50 USDC when isLeveragePosition == TRUE and addingAmount == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let lendingTokenCount = await plpLeverageInstance.calculateLendingTokenCount(lendingToken, borrowLimitPerLendingToken);
                    let supplyAmount = lendingTokenCount.mul(10);
                    await usdc.mint(deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                for (let i = 0; i < signers.length; i++) {
                    {
                        let depositAmount = ethers.utils.parseUnits("1000", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount.mul(10));
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                    }
                    {
                        let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                        exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                        margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(20), toBN(10), exp);
                        let addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                        await prj1.mintTo(signers[i].address, addingAmount);
                        await prj1.connect(signers[i]).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                        await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowUSDCAmount);
                        let buyCalldata = await createSellCallData(
                            lendingToken,
                            borrowUSDCAmount,
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
                            type
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                exp = await plpInstance.getTokenEvaluation(lendingToken, borrowUSDCAmount);
                margin = await plpLeverageInstance.calculateMargin(projectToken, lendingToken, toBN(200), toBN(10), exp);
                let addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);
                await prj1.mintTo(signers[i].address, addingAmount);
                await prj1.connect(signers[i]).approve(plpAddress, addingAmount);
                await plpInstance.connect(signers[i]).deposit(projectToken, addingAmount);
                await usdc.connect(signers[i]).approve(plpLeverageInstance.address, borrowUSDCAmount);
                buyCalldata = await createSellCallData(
                    lendingToken,
                    borrowUSDCAmount,
                    0,
                    ethers.constants.AddressZero,
                    [await factory.getPair(projectToken, lendingToken)]
                );
                let isLeveragePositionBeforeLeverage = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);
                let currentLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);
                addingAmount = await plpLeverageInstance.calculateAddingAmount(signers[i].address, projectToken, margin);

                expect(addingAmount).to.eq(0);
                expect(isLeveragePositionBeforeLeverage).to.eq(true);
                expect(currentLendingToken).to.eq(lendingToken);


                let balanceProjectTokenBeforeLeverage = await prj1.balanceOf(signers[i].address);
                let allowanceProjectTokenBeforeLeverage = await prj1.allowance(signers[i].address, plpLeverageAddress);
                let allowanceLendingTokenBeforeLeverage = await usdc.allowance(signers[i].address, plpLeverageAddress);
                let totalOutstandingBeforeLeverage = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowBeforeLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerCollateralBeforeLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
                let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
                let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

                let tx = await plpLeverageInstance.connect(signers[i]).leveragedBorrow(
                    projectToken,
                    lendingToken,
                    exp,
                    margin,
                    buyCalldata,
                    type
                );
                let receipt = await tx.wait();
                let events = receipt.events;
                let argsEvent;
                for (let i = 0; i < events.length; i++) {
                    if (events[i]?.event == "LeveragedBorrow") {
                        argsEvent = events[i].args;
                        break;
                    }
                }
                let isLeveragePositionAfterLeverage = await plpLeverageInstance.isLeveragePosition(signers[i].address, projectToken);
                let balanceProjectTokenAfterLeverage = await prj1.balanceOf(signers[i].address);
                let allowanceProjectTokenAfterLeverage = await prj1.allowance(signers[i].address, plpLeverageAddress);
                let allowanceLendingTokenAfterLeverage = await usdc.allowance(signers[i].address, plpLeverageAddress);
                let totalOutstandingAfterLeverage = await plpInstance.totalOutstanding(signers[i].address, projectToken, lendingToken);
                let totalBorrowAfterLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
                let totalBorrowPerCollateralAfterLeverage = await plpInstance.getTotalBorrowPerCollateral(projectToken);
                let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.getTotalBorrowPerLendingToken(lendingToken);
                let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, signers[i].address);
                let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

                expect(isLeveragePositionAfterLeverage).to.eq(true);
                expect(balanceProjectTokenAfterLeverage).to.eq(balanceProjectTokenBeforeLeverage.sub(addingAmount));
                expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
                expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
                expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
                expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
                expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
                expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
                expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
                expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
            }
        });
    });
});