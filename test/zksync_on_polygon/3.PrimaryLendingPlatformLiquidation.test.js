require("dotenv").config();
const chainConfigs = require('../../chain.config');
const chainConfig = chainConfigs[chainConfigs.chain];
const hre = require("hardhat");
const { deployment } = require("../../scripts/deployPLP_V2/deploymentPLP");
const { ethers } = require("ethers");
const { expect } = require("chai");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { deploymentMockToken } = require("../../scripts/deployPLP_V2/deploymentMockToken");
const { getPriceFeedsUpdateData } = require("./utils/utilities");

const path = require("path");
const configTestingFile = path.join(__dirname, `../../scripts/config/hardhat_zksync_on_polygon_mainnet/config_testing.json`);
const configTesting = require(configTestingFile);

const INFURA_KEY = process.env.INFURA_KEY;
const toBN = (num) => hre.ethers.BigNumber.from(num);

describe("PrimaryLendingPlatformLiquidation", function () {
    this.timeout(86400000);

    let signers;
    let deployMaster;
    let addresses;

    let plpInstance;
    let plpAtomicRepayInstance;
    let plpLeverageInstance;
    let plpLiquidationInstance;
    let plpWTGInstance;
    let plpModeratorInstance;
    let chainlinkPriceProviderInstance;
    let uniswapPriceProviderMockInstance;
    let pythPriceProviderInstance;
    let priceProviderAggregatorInstance;

    let plpAddress;
    let plpAtomicRepayAddress;
    let plpLeverageAddress;
    let plpLiquidationAddress;
    let plpWTGAddress;
    let plpModeratorAddress;
    let chainlinkPriceProviderAddress;
    let uniswapV2PriceProviderAddress;
    let uniswapV2PriceProviderMockAddress;
    let pythPriceProviderAddress;
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

    async function setHighPrice(tokenAddress) {
        await pythPriceProviderInstance.setTokenAndPriceIdPath(
            tokenAddress,
            configTesting.priceIdPath.usingForHighPrice
        );
    }
    async function setLowPrice(tokenAddress) {
        await pythPriceProviderInstance.setTokenAndPriceIdPath(
            tokenAddress,
            configTesting.priceIdPath.usingForLowPrice
        );
    }

    async function resetNetwork() {
        await helpers.reset(
            `https://${chainConfigs.chain.replace("_", "-")}.infura.io/v3/${INFURA_KEY}`,
            Number(chainConfig.blockNumber)
        );
    }
    async function loadFixture() {
        await resetNetwork();
        signers = await hre.ethers.getSigners();
        deployMaster = signers[0];
        {
            await helpers.setBalance(deployMaster.address, ethers.constants.MaxUint256);
            let logFunc = console.log;

            await deploymentMockToken();
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
            pythPriceProviderAddress = addresses.pythPriceProviderAddress;
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
            let PLP = await hre.ethers.getContractFactory("PrimaryLendingPlatformV2Zksync");
            let PLPAtomicRepay = await hre.ethers.getContractFactory("PrimaryLendingPlatformAtomicRepaymentZksync");
            let PLPLeverage = await hre.ethers.getContractFactory("PrimaryLendingPlatformLeverageZksync");
            let PLPLiquidation = await hre.ethers.getContractFactory("PrimaryLendingPlatformLiquidationZksync");
            let PLPWTG = await hre.ethers.getContractFactory("PrimaryLendingPlatformWrappedTokenGatewayZksync");
            let PLPModerator = await hre.ethers.getContractFactory("PrimaryLendingPlatformModerator");
            let ChainlinkPriceProvider = await hre.ethers.getContractFactory("ChainlinkPriceProvider");
            let UniswapPriceProviderMock = await hre.ethers.getContractFactory("UniswapV2PriceProviderMock");
            let PythPriceProvider = await hre.ethers.getContractFactory("PythPriceProvider");
            let PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregatorPyth");

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
            pythPriceProviderInstance = PythPriceProvider.attach(pythPriceProviderAddress).connect(deployMaster);
            priceProviderAggregatorInstance = PriceProviderAggregator.attach(priceProviderAggregatorAddress).connect(deployMaster);

            prj1 = MockPRJ.attach(prj1Address).connect(deployMaster);
            prj2 = MockPRJ.attach(prj2Address).connect(deployMaster);
            prj3 = MockPRJ.attach(prj3Address).connect(deployMaster);

            wstETH = MockWstETH.attach(wstEthAddress).connect(deployMaster);

            usdc = MockToken.attach(usdcAddress).connect(deployMaster);
            usb = MockToken.attach(usbAddress).connect(deployMaster);
            weth = MockWETH.attach(wethAddress).connect(deployMaster);

            prj1Decimals = await prj1.decimals();
            prj2Decimals = await prj2.decimals();
            prj3Decimals = await prj3.decimals();

            wstEthDecimals = await wstETH.decimals();

            usdcDecimals = await usdc.decimals();
            usbDecimals = await usb.decimals();
            wethDecimals = await weth.decimals();
        }
    }

    describe("liquidation", async function () {

        describe("Liquidate with invalid input", async function () {
            before(async function () {
                await loadFixture();
                masterAddress = deployMaster.address;
            });

            it("1. Failure: Should throw error when account is invalid", async function () {
                account = "Not Address.";
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpLiquidationInstance.liquidate(
                    account,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.throw;
            });

            it("2. Failure: Should throw error when projectToken is invalid", async function () {
                projectTokenAddress = "Not Address.";
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    projectTokenAddress,
                    usdcAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.throw;
            });

            it("3. Failure: Should throw error when lending is invalid", async function () {
                lendingTokenAddress = "Not Address.";
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    lendingTokenAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.throw;
            });

            it("4. Failure: Should throw error when lendingTokenAmount < 0", async function () {
                lendingTokenAmount = -1;
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.throw;
            });

            it("5. Failure: Should throw error when lendingTokenAmount > maxUint256", async function () {
                lendingToken = "Not Address.";
                lendingTokenAmount = ethers.constants.MaxUint256.add(toBN(1));
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.throw;
            });

            it("6. Failure: Should throw error when lendingTokenAmount is not uint", async function () {
                lendingTokenAmount = 1.1;
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.throw;
            });

            it("7. Failure: Should throw error when priceIds is NOT ARRAY BYTES32", async function () {
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals)
                let priceIds = "Not array bytes32";
                let updateData = [];
                let updateFee = 0;

                expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.throw;
            });

            it("8. Failure: Should throw error when updateData is NOT ARRAY BYTES", async function () {
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                let priceIds = [];
                let updateData = "Not array bytes";
                let updateFee = 0;

                expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.throw;
            });

            it("9. Failure: Should throw error when msg.value < 0", async function () {
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                let priceIds = [];
                let updateData = [];
                let updateFee = toBN(-1);

                expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.throw;
            });

            it("10. Failure: Should throw error when msg.value > maxUint256", async function () {
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                let priceIds = [];
                let updateData = [];
                let updateFee = ethers.constants.MaxUint256.add(1);

                expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.throw;
            });

            it("11. Failure: Should throw error when typeof msg.value is NOT UINT", async function () {
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                let priceIds = [];
                let updateData = [];
                let updateFee = 1.1;

                expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.throw;
            });

            it("12. Failure: Should revert when isProjectTokenListed = FALSE", async function () {
                projectTokenAddress = ethers.constants.AddressZero;
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    projectTokenAddress,
                    usdcAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.revertedWith("PITLiquidation: Project token is not listed");
            });

            it("13. Failure: Should revert when isLendingTokenListed = FALSE", async function () {
                lendingTokenAddress = ethers.constants.AddressZero;
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    lendingTokenAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.revertedWith("PITLiquidation: Lending token is not listed");
            });

            it("14. Failure: Should revert when priceIds.length == 0 and msg.value > 0", async function () {
                let projectToken = prj1.address;
                let lendingToken = usdc.address;
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                let priceIds = [];
                let updateData = [];
                let updateFee = toBN(1);

                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    projectToken,
                    lendingToken,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.revertedWith("PriceProviderAggregatorPyth: Msg.value!=0!");
            });

            it("15. Failure: Should revert when priceIds.length != updateData.length", async function () {
                let projectToken = prj1.address;
                let lendingToken = usdc.address;
                let lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                let timeBeforeExpiration = 15;
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = [];

                expect(priceIds).to.not.eq(updateData.length);
                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    projectToken,
                    lendingToken,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.revertedWith("PythPriceProvider: Mismatched array sizes!");
            });

            it("16. Failure: Should revert when updateFee != priceIds.length * singleUpdateFeeInWei", async function () {
                let projectToken = prj1.address;
                let lendingToken = usdc.address;
                let lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                let timeBeforeExpiration = 15;
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                expect(priceIds.length).to.gt(0);
                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    projectToken,
                    lendingToken,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee.sub(1) }
                )).to.be.revertedWith("PythPriceProvider: Incorrect updateFee!");
            });

            it("17. Failure: Should revert when updateData is invalid", async function () {
                let projectToken = prj1.address;
                let lendingToken = usdc.address;
                let lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                let timeBeforeExpiration = 15;
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = ["0x"];

                expect(priceIds.length).to.gt(0);
                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    projectToken,
                    lendingToken,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.reverted;
            });

            it("18. Failure: Should revert when lendingTokenAmount = 0", async function () {
                let projectToken = prj1.address;
                let lendingToken = usdc.address;
                let lendingTokenAmount = ethers.utils.parseUnits("0", usdcDecimals);
                let timeBeforeExpiration = 15;
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    projectToken,
                    lendingToken,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.revertedWith("PITLiquidation: LendingTokenAmount must be greater than 0");
            });

            it("19. Failure: Should revert when HF >= 1", async function () {
                let projectToken = prj1.address;
                let lendingToken = usdc.address;
                let lendingTokenAmount = ethers.utils.parseUnits("1", usdcDecimals);
                let timeBeforeExpiration = 15;
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    projectToken,
                    lendingToken,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.revertedWith("PITLiquidation: HealthFactor>=1");
            });
        });

        describe("Liquidate when HF < 1", async function () {
            
            let timeBeforeExpiration = 15;
            
            before(async function () {
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
                        {
                            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, usdcAddress], timeBeforeExpiration);
                            let updateData = await getPriceFeedsUpdateData(priceIds);

                            let borrowAmount = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(masterAddress, prj1Address, usdcAddress, priceIds, updateData, { value: updateFee });
                            await plpInstance.borrow(prj1Address, usdcAddress, borrowAmount, priceIds, updateData, { value: updateFee });
                            await plpInstance.updateInterestInBorrowPositions(masterAddress, usdcAddress);
                        }

                        // check HF and liquidation amount
                        {
                            await setLowPrice(prj1Address);
                            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, usdcAddress], timeBeforeExpiration);
                            let updateData = await getPriceFeedsUpdateData(priceIds);

                            let currentHealthFactor = await plpLiquidationInstance.callStatic.getCurrentHealthFactorWithUpdatePrices(
                                masterAddress,
                                prj1Address,
                                usdcAddress,
                                priceIds,
                                updateData,
                                { value: updateFee }
                            );
                            let liquidationAmount = await plpLiquidationInstance.callStatic.getLiquidationAmountWithUpdatePrices(
                                masterAddress,
                                prj1Address,
                                usdcAddress,
                                priceIds,
                                updateData,
                                { value: updateFee }
                            );

                            healthFactorNumerator = currentHealthFactor.healthFactorNumerator;
                            healthFactorDenominator = currentHealthFactor.healthFactorDenominator;
                            maxLA = liquidationAmount.maxLA;
                            minLA = liquidationAmount.minLA;
                        }
                    }
                }
            });

            it("20. Failure: Should revert when lendingTokenAmount < minLA", async function () {
                lendingTokenAmount = minLA.sub(toBN(1));

                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.revertedWith("PITLiquidation: Invalid amount");
            });

            it("21. Failure: Should revert when lendingTokenAmount > maxLA", async function () {
                lendingTokenAmount = maxLA.add(toBN(1));
                usdc.connect(deployMaster).approve(bLendingTokenAddress, lendingTokenAmount);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.revertedWith("PITLiquidation: Invalid amount");
            });

            it("22. Failure: Should revert when allowance < lendingTokenAmount", async function () {
                lendingTokenAmount = minLA.add(toBN(100));
                usdc.connect(deployMaster).approve(bLendingTokenAddress, lendingTokenAmount.sub(1));

                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.revertedWith("ERC20: insufficient allowance");
            });

            it("23. Success: Should liquidate successfully", async function () {
                lendingTokenAmount = minLA.add(toBN(100));
                usdc.connect(deployMaster).approve(bLendingTokenAddress, lendingTokenAmount);

                let balanceProjectTokenBeforeLiquidate = await usdc.balanceOf(bLendingTokenAddress);
                let borrowPositionBeforeLiquidate = await plpInstance.borrowPosition(masterAddress, prj1Address, usdcAddress);
                let totalBorrowedUsdcTokenBeforeLiquidate = await plpInstance.totalBorrowPerLendingToken(usdcAddress);
                let totalBorrowPrj1BeforeLiquidate = await plpInstance.totalBorrow(prj1Address, usdcAddress);

                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                let liquidateTx = await (plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                ));
                await liquidateTx.wait();

                let balanceProjectTokenAfterLiquidate = await usdc.balanceOf(bLendingTokenAddress);
                let borrowPositionAfterLiquidate = await plpInstance.borrowPosition(masterAddress, prj1Address, usdcAddress);
                let totalBorrowedUsdcTokenAfterLiquidate = await plpInstance.totalBorrowPerLendingToken(usdcAddress);
                let totalBorrowPrj1AfterLiquidate = await plpInstance.totalBorrow(prj1Address, usdcAddress);

                expect(balanceProjectTokenBeforeLiquidate).to.eq(balanceProjectTokenAfterLiquidate.sub(lendingTokenAmount));
                expect(borrowPositionBeforeLiquidate.loanBody).to.eq(borrowPositionAfterLiquidate.loanBody.add(lendingTokenAmount));
                expect(totalBorrowedUsdcTokenBeforeLiquidate).to.eq(totalBorrowedUsdcTokenAfterLiquidate.add(lendingTokenAmount));
                expect(totalBorrowPrj1BeforeLiquidate).to.eq(totalBorrowPrj1AfterLiquidate.add(lendingTokenAmount));
            });

            it("24. Failure: Should revert when balance user < lendingTokenAmount", async function () {
                lendingTokenAmount = minLA.add(toBN(100));
                usdc.connect(deployMaster).approve(bLendingTokenAddress, lendingTokenAmount);
                let balanceUser = await usdc.balanceOf(masterAddress);
                usdc.connect(deployMaster).transfer(bLendingTokenAddress, balanceUser);

                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await expect(plpLiquidationInstance.liquidate(
                    masterAddress,
                    prj1Address,
                    usdcAddress,
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.revertedWith("ERC20: transfer amount exceeds balance'");
            });
        });
    });

    describe("View functions are rewritten into write functions when adding the update prices step", function () {

        let timeBeforeExpiration = 15;
        let projectToken;
        let lendingToken;

        before(async function () {
            await loadFixture();

            projectToken = prj1Address;
            lendingToken = usdcAddress;
        });

        it("1. getCurrentHealthFactorWithUpdatePrices", async function () {
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = [];
            if (priceIds.length > 0) updateData = await getPriceFeedsUpdateData(priceIds);

            await plpLiquidationInstance.getCurrentHealthFactorWithUpdatePrices(
                deployMaster.address,
                projectToken,
                lendingToken,
                priceIds,
                updateData,
                { value: updateFee }
            );
        });
        it("2. getTokenPriceWithUpdatePrices", async function () {
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = [];
            if (priceIds.length > 0) updateData = await getPriceFeedsUpdateData(priceIds);

            await plpLiquidationInstance.getTokenPriceWithUpdatePrices(
                projectToken,
                0,
                priceIds,
                updateData,
                { value: updateFee }
            );
        });
        it("3. liquidatorRewardFactorWithUpdatePrices", async function () {
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = [];
            if (priceIds.length > 0) updateData = await getPriceFeedsUpdateData(priceIds);

            await plpLiquidationInstance.liquidatorRewardFactorWithUpdatePrices(
                deployMaster.address,
                projectToken,
                lendingToken,
                priceIds,
                updateData,
                { value: updateFee }
            );
        });
        it("4. getMaxLiquidationAmountWithUpdatePrices", async function () {
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = [];
            if (priceIds.length > 0) updateData = await getPriceFeedsUpdateData(priceIds);

            await plpLiquidationInstance.getMaxLiquidationAmountWithUpdatePrices(
                deployMaster.address,
                projectToken,
                lendingToken,
                priceIds,
                updateData,
                { value: updateFee }
            );
        });
        it("5. getLiquidationAmountWithUpdatePrices", async function () {
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = [];
            if (priceIds.length > 0) updateData = await getPriceFeedsUpdateData(priceIds);

            await plpLiquidationInstance.getLiquidationAmountWithUpdatePrices(
                deployMaster.address,
                projectToken,
                lendingToken,
                priceIds,
                updateData,
                { value: updateFee }
            );
        });
    });
});