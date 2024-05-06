require("dotenv").config();
const hre = require("hardhat");
const { deployment } = require("../../scripts/deployPLP_V2/deploymentPLP");
const { ethers } = require("ethers");
const { expect } = require("chai");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
let { deploymentMockToken } = require("../../scripts/deployPLP_V2/deploymentMockToken");
const { getPriceFeedsUpdateData, swapEstimateAmountIn } = require("./utils/utilities");

const fs = require("fs");
const path = require("path");
const OOEJson = require("./artifacts-for-testing/OpenOceanExchange.json");
const configGeneralFile = path.join(__dirname, `../../scripts/config/hardhat_zksync_on_polygon_mainnet/config_general.json`);
const configGeneral = require(configGeneralFile);
const configTestingFile = path.join(__dirname, `../../scripts/config/hardhat_zksync_on_polygon_mainnet/config_testing.json`);
const configTesting = require(configTestingFile);

const INFURA_KEY = process.env.INFURA_KEY;
const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);

describe("PrimaryLendingPlatformAtomicRepayment", function () {
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
    let openOceanExchangeInstance;

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
    let openOceanExchangeAddress = configGeneral.exchangeAggregatorParams.exchangeAggregator;

    let prj1;
    let prj2;
    let prj3;

    let wstETH;

    let usdc;
    let usb;
    let weth;

    let prj1Decimals;

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

    let MockPRJ;
    let MockToken;

    async function setTokenCanSwapOnOpenOcean() {
        configGeneral.priceOracle.Pyth.tokensUsePyth[0] = configTesting.uniswapTokenAddress;
        configGeneral.plpModeratorParams.projectTokens[0] = configTesting.uniswapTokenAddress;

        configGeneral.priceOracle.Pyth.tokensUsePyth[4] = configTesting.usdcTokenAddress;
        configGeneral.priceOracle.usdc = configTesting.usdcTokenAddress;
        configGeneral.blendingToken.lendingTokens[0] = configTesting.usdcTokenAddress;
        fs.writeFileSync(path.join(configGeneralFile), JSON.stringify(configGeneral, null, 2));
    }
    async function setHighPrice(tokenAddress) {
        await pythPriceProviderInstance.setTokenAndPriceIdPath(
            tokenAddress,
            configTesting.priceIdPath.usingForHighPrice
        );
        await pythPriceProviderInstance.setValidTimePeriod(ethers.constants.MaxUint256);
    }
    async function setLowPrice(tokenAddress) {
        await pythPriceProviderInstance.setTokenAndPriceIdPath(
            tokenAddress,
            configTesting.priceIdPath.usingForLowPrice
        );
        await pythPriceProviderInstance.setValidTimePeriod(ethers.constants.MaxUint256);
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
            await helpers.setBalance(deployMaster.address, ethers.constants.MaxUint256);
            let logFunc = console.log;
            let writeFileSync = fs.writeFileSync;

            await deploymentMockToken();
            addresses = await deployment();
            console.log = logFunc;
            fs.writeFileSync = writeFileSync;

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

            openOceanExchangeInstance = new hre.ethers.Contract(
                openOceanExchangeAddress,
                OOEJson.abi,
                deployMaster
            );

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
    async function setBalance(token, user, newBalance) {
        const index = ethers.utils.solidityKeccak256(["uint256", "uint256"], [user, 0]);
        await helpers.setStorageAt(
            token,
            index,
            ethers.utils.hexlify(
                ethers.utils.zeroPad(newBalance.toHexString(), 32)
            ).toString()
        );
    }
    async function loadFixtureCanSwapOnOpenOcean() {
        let resetNetWorkTemp = resetNetwork;
        let deploymentMockTokenTemp = deploymentMockToken;

        await resetNetwork();
        await deploymentMockToken();
        await setTokenCanSwapOnOpenOcean();

        resetNetwork = async function () { };
        deploymentMockToken = async function () { };

        await loadFixture();

        resetNetwork = resetNetWorkTemp;
        deploymentMockToken = deploymentMockTokenTemp;
    }

    describe("repayAtomic", async function () {
        let timeBeforeExpiration = 15;

        before(async function () {
            await loadFixture();
        });

        it("1. Failure: Should throw error when prjToken has an invalid address", async function () {
            let projectToken = "Not Address.";
            let collateralAmount = toBN(1);
            let buyCalldata = "0x";
            let isRepayFully = "";
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("2. Failure: Should throw error when collateralAmount < 0", async function () {
            let projectToken = prj1.address;
            let collateralAmount = -1;
            let buyCalldata = "0x";
            let isRepayFully = "";
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("3. Failure: Should throw error when collateralAmount > maxUint256", async function () {
            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata = "0x";
            let isRepayFully = "";
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("4. Failure: Should throw error when collateralAmount is NOT UINT", async function () {
            let projectToken = prj1.address;
            let collateralAmount = 1.1;
            let buyCalldata = "0x";
            let isRepayFully = "";
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("5. Failure: Should throw error when buyCalldata is NOT BYTES", async function () {
            let projectToken = prj1.address;
            let collateralAmount = toBN(1);
            let buyCalldata = "NOT BYTES.";
            let isRepayFully = "";
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("6. Failure: Should throw error when priceIds is NOT ARRAY BYTES32", async function () {
            let projectToken = prj1.address;
            let collateralAmount = toBN(1);
            let buyCalldata = "0x";
            let isRepayFully = "";
            let priceIds = "Not array bytes32";
            let updateData = [];
            let updateFee = 0;

            expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("7. Failure: Should throw error when updateData is NOT ARRAY BYTES", async function () {
            let projectToken = prj1.address;
            let collateralAmount = toBN(1);
            let buyCalldata = "0x";
            let isRepayFully = "";
            let priceIds = [];
            let updateData = "Not array bytes";
            let updateFee = 0;

            expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("8. Failure: Should throw error when msg.value < 0", async function () {
            let projectToken = prj1.address;
            let collateralAmount = toBN(1);
            let buyCalldata = "0x";
            let isRepayFully = "";
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(-1);

            expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("9. Failure: Should throw error when msg.value > maxUint256", async function () {
            let projectToken = prj1.address;
            let collateralAmount = toBN(1);
            let buyCalldata = "0x";
            let isRepayFully = "";
            let priceIds = [];
            let updateData = [];
            let updateFee = ethers.constants.MaxUint256.add(1);

            expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("10. Failure: Should throw error when typeof msg.value is NOT UINT", async function () {
            let projectToken = prj1.address;
            let collateralAmount = toBN(1);
            let buyCalldata = "0x";
            let isRepayFully = "";
            let priceIds = [];
            let updateData = [];
            let updateFee = 1.1;

            expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("11. Failure: Should revert when priceIds.length == 0 and msg.value > 0", async function () {
            let projectToken = prj1.address;
            let collateralAmount = toBN(1);
            let buyCalldata = "0x";
            let isRepayFully = "";
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(1);

            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("PriceProviderAggregatorPyth: Msg.value!=0!");
        });
        it.skip("12. Failure: Should revert when priceIds.length != updateData.length", async function () {
            let projectToken = prj1.address;
            let collateralAmount = toBN(1);
            let buyCalldata = "0x";
            let isRepayFully = "";
            let timeBeforeExpiration = 15;
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken], timeBeforeExpiration);
            let updateData = [];

            expect(priceIds).to.not.eq(updateData.length);
            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("PythPriceProvider: Mismatched array sizes!");
        });
        it("13. Failure: Should revert when updateFee != priceIds.length * singleUpdateFeeInWei", async function () {
            let projectToken = prj1.address;
            let collateralAmount = toBN(1);
            let buyCalldata = "0x";
            let isRepayFully = "";
            let timeBeforeExpiration = 15;
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            expect(priceIds.length).to.gt(0);
            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee.sub(1) }
            )).to.be.revertedWith("PythPriceProvider: Incorrect updateFee!");
        });
        it("14. Failure: Should revert when updateData is invalid", async function () {
            let projectToken = prj1.address;
            let collateralAmount = toBN(1);
            let buyCalldata = "0x";
            let isRepayFully = "";
            let timeBeforeExpiration = 15;
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken], timeBeforeExpiration);
            let updateData = ["0x"];

            expect(priceIds.length).to.gt(0);
            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.reverted;
        });
        it("15. Failure: Should revert when collateralAmount == 0", async function () {
            let projectToken = prj1.address;
            let collateralAmount = toBN(0);
            let buyCalldata = "0x";
            let isRepayFully = "";
            let timeBeforeExpiration = 15;
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("AtomicRepayment: CollateralAmount must be greater than 0");
        });
        it("16. Failure: Should revert when isProjectTokenListed == FALSE and depositedProjectTokenAmount < collateralAmount", async function () {
            let projectToken = ethers.constants.AddressZero;
            let collateralAmount = toBN(1);
            let buyCalldata = "0x";
            let isRepayFully = false;
            let timeBeforeExpiration = 15;
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);

            expect(depositedAmount).to.lt(collateralAmount);

            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("Prj token isn't listed");
        });
        it("17. Failure: Should revert when buyCalldata invalid and depositedProjectTokenAmount < collateralAmount", async function () {
            let projectToken = prj1.address;
            let collateralAmount = toBN(1);
            let buyCalldata = "0x";
            let isRepayFully = false;
            let timeBeforeExpiration = 15;
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);

            expect(depositedAmount).to.lt(collateralAmount);

            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.reverted;
        });
        it("18. Failure: Should revert when buyCalldata invalid and depositedProjectTokenAmount >= collateralAmount", async function () {
            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("10", prj1Decimals);
            let buyCalldata = "0x";
            let isRepayFully = false;
            let timeBeforeExpiration = 15;
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);
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
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.reverted;
        });
        it("19. Failure: Should revert when amountSold > collateralAmount and depositedProjectTokenAmount < collateralAmount", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        ethers.utils.parseUnits("50", usdcDecimals),
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);
            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);

            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldGreaterCollateral;
            expect(depositedAmount).to.lt(collateralAmount);
            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });
        it("20. Failure: Should revert when amountSold > collateralAmount and depositedProjectTokenAmount >= collateralAmount", async function () {

            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("10", prj1Decimals);
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = collateralAmount;
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        ethers.utils.parseUnits("50", usdcDecimals),
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);
            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);

            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldGreaterCollateral;

            expect(depositedAmount).to.gte(collateralAmount);
            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });
        it("21. Failure: Should revert when isRepayFully == TRUE, amountReceive < totalOutStanding and depositedProjectTokenAmount < collateralAmount", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("100", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        ethers.utils.parseUnits("50", usdcDecimals),
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);

            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveLowerTotalOutstanding;
            expect(depositedAmount).to.lt(collateralAmount);

            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("AtomicRepayment: Amount receive not enough to repay fully");
        });
        it("22. Failure: Should revert when isRepayFully == TRUE, amountReceive < totalOutStanding and depositedProjectTokenAmount >= collateralAmount", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = collateralAmount;
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("100", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        ethers.utils.parseUnits("50", usdcDecimals),
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);
            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);

            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveLowerTotalOutstanding;
            expect(depositedAmount).to.gte(collateralAmount);

            await expect(plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("AtomicRepayment: Amount receive not enough to repay fully");
        });
        it("23. Failure: Should revert when healthFactor < 1, isLeveragePosition == FALSE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("100", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        ethers.utils.parseUnits("50", usdcDecimals),
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveLowerTotalOutstanding;
            expect(isLeveragePosition).to.eq(false);
            expect(depositedAmount).to.lt(collateralAmount);

            await pythPriceProviderInstance.updatePrices(priceIds, updateData, { value: updateFee });
            {
                await setLowPrice(prj1Address);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);
                await expect(plpAtomicRepayInstance.repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.revertedWith("AtomicRepayment: Repayable amount makes healthFactor<1");
            }
        });
        it("24. Failure: Should revert when healthFactor < 1, isLeveragePosition == FALSE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = false;
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);
            {
                let depositAmount = collateralAmount;
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("100", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(usdcAddress, supplyAmount);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        ethers.utils.parseUnits("50", usdcDecimals),
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveLowerTotalOutstanding;
            expect(isLeveragePosition).to.eq(false);
            expect(depositedAmount).to.gte(collateralAmount);

            await pythPriceProviderInstance.updatePrices(priceIds, updateData, { value: updateFee });
            {
                await setLowPrice(prj1Address);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);
                await expect(plpAtomicRepayInstance.repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.revertedWith("AtomicRepayment: Repayable amount makes healthFactor<1");
            }
        });
        it("25. Failure: Should revert when healthFactor < 1, isLeveragePosition == TRUE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);

            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveLowerTotalOutstanding;

            expect(isLeveragePosition).to.eq(true);
            expect(depositedAmount).to.lt(collateralAmount);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);
            await pythPriceProviderInstance.updatePrices(priceIds, updateData, { value: updateFee });
            {
                await setLowPrice(prj1Address);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);
                await expect(plpAtomicRepayInstance.repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.revertedWith("AtomicRepayment: Repayable amount makes healthFactor<1");
            }
        });
        it("26. Failure: Should revert when healthFactor < 1, isLeveragePosition == TRUE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("10", prj1Decimals);
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = collateralAmount;
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let depositedAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);

            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveLowerTotalOutstanding;

            expect(isLeveragePosition).to.eq(true);
            expect(depositedAmount).to.gte(collateralAmount);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);
            await pythPriceProviderInstance.updatePrices(priceIds, updateData, { value: updateFee });
            {
                await setLowPrice(prj1Address);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);
                await expect(plpAtomicRepayInstance.repayAtomic(
                    projectToken,
                    collateralAmount,
                    buyCalldata,
                    isRepayFully,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.revertedWith("AtomicRepayment: Repayable amount makes healthFactor<1");
            }
        });
        it("27. Success (Single-user): Should repay when isRepayFully == TRUE, isLeveragePosition == FALSE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        borrowAmount,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let expectAfterLendingBalanceOfAtomicRepayContract = toBN(2);
            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveGreaterTotalOutstanding;
            expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
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
        it("28. Success (Single-user): Should repay when isRepayFully == TRUE, isLeveragePosition == FALSE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = collateralAmount;
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        borrowAmount,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let expectAfterLendingBalanceOfAtomicRepayContract = toBN(2);
            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveGreaterTotalOutstanding;

            expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
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
        it("29. Success (Single-user): Should repay when isRepayFully == TRUE, isLeveragePosition == TRUE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let expectAfterLendingBalanceOfAtomicRepayContract = toBN(2);
            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveGreaterTotalOutstanding;

            expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
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
        it("30. Success (Single-user): Should repay when isRepayFully == TRUE, isLeveragePosition == TRUE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = true;
            {
                let depositAmount = collateralAmount.div(10);
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let expectAfterLendingBalanceOfAtomicRepayContract = toBN(2);
            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveGreaterTotalOutstanding;

            expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
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
        it("31. Success (Single-user): Should repay when isRepayFully == FALSE, isLeveragePosition == FALSE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {

            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        borrowAmount,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveLowerTotalOutstanding;

            expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
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
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
            expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
        });
        it("32. Success (Single-user): Should repay when isRepayFully == FALSE, isLeveragePosition == FALSE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = collateralAmount;
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        borrowAmount,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveLowerTotalOutstanding;

            expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
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
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
            expect(isLeveragePositionAfterRepayAtomic).to.eq(isLeveragePositionBeforeRepayAtomic);
        });
        it("33. Success (Single-user): Should repay when isRepayFully == FALSE, isLeveragePosition == FALSE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = ethers.utils.parseUnits("100", prj1Decimals);
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        borrowAmount,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let expectAfterLendingBalanceOfAtomicRepayContract = toBN(2);
            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveGreaterTotalOutstanding;

            expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
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
        it("34. Success (Single-user): Should repay when isRepayFully == FALSE, isLeveragePosition == FALSE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = collateralAmount;
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        borrowAmount,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let expectAfterLendingBalanceOfAtomicRepayContract = toBN(2);
            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveGreaterTotalOutstanding;

            expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(false);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
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
        it("35. Success (Single-user): Should repay when isRepayFully == FALSE, isLeveragePosition == TRUE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(usdcAddress, borrowAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, usdcAddress, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        usdcAddress,
                        exp,
                        margin,
                        buyCalldata,
                        0,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveLowerTotalOutstanding;

            expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
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
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
            expect(isLeveragePositionAfterRepayAtomic).to.eq(true);
        });
        it("36. Success (Single-user): Should repay when isRepayFully == FALSE, isLeveragePosition == TRUE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("10", prj1Decimals);
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = collateralAmount;
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, borrowAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveLowerTotalOutstanding;

            expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
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
            expect(balanceLendingTokenAfterRepayAtomic).to.eq(balanceLendingTokenBeforeRepayAtomic);
            expect(isLeveragePositionAfterRepayAtomic).to.eq(true);
        });
        it("37. Success (Single-user): Should repay when isRepayFully == FALSE, isLeveragePosition == TRUE, depositedProjectTokenAmount < collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.constants.MaxUint256;
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, borrowAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let expectAfterLendingBalanceOfAtomicRepayContract = toBN(2);
            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveGreaterTotalOutstanding;

            expect(depositedAmountBeforeRepayAtomic).to.lt(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
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
        it("38. Success (Single-user): Should repay when isRepayFully == FALSE, isLeveragePosition == TRUE, depositedProjectTokenAmount >= collateralAmount and afterLendingBalance of PLPAtomicRepayment contract > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let collateralAmount = ethers.utils.parseUnits("100", prj1Decimals);
            let buyCalldata;
            let isRepayFully = false;
            {
                let depositAmount = collateralAmount.div(10);
                await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                await plpInstance.deposit(
                    projectToken,
                    depositAmount
                );
                {
                    let borrowAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, borrowAmount);
                    let lendingToken = usdc.address;
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(100), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            let depositedAmountBeforeRepayAtomic = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeRepayAtomic = await plpInstance.totalDepositedProjectToken(projectToken);
            let totalOutstandingBeforeRepayAtomic = await plpInstance.totalOutstanding(deployMaster.address, projectToken, actualLendingToken);
            let balanceLendingTokenBeforeRepayAtomic = await usdc.balanceOf(deployMaster.address);
            let isLeveragePositionBeforeRepayAtomic = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let expectAfterLendingBalanceOfAtomicRepayContract = toBN(2);
            buyCalldata = configTesting.encodeDataTestingForAtomicRepay.amountSoldLowerOrEqualCollateral.amountReceiveGreaterTotalOutstanding;

            expect(depositedAmountBeforeRepayAtomic).to.gte(collateralAmount);
            expect(isLeveragePositionBeforeRepayAtomic).to.eq(true);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let tx = await plpAtomicRepayInstance.repayAtomic(
                projectToken,
                collateralAmount,
                buyCalldata,
                isRepayFully,
                priceIds,
                updateData,
                { value: updateFee }
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

        it("1. getTotalOutstandingWithUpdatePrices", async function () {
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = [];
            if (priceIds.length > 0) updateData = await getPriceFeedsUpdateData(priceIds);

            await plpAtomicRepayInstance.getTotalOutstandingWithUpdatePrices(
                deployMaster.address,
                projectToken,
                lendingToken,
                priceIds,
                updateData,
                { value: updateFee }
            );
        });
        it("2. getAvailableRepaidAmountWithUpdatePrices", async function () {
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = [];
            if (priceIds.length > 0) updateData = await getPriceFeedsUpdateData(priceIds);

            await plpAtomicRepayInstance.getAvailableRepaidAmountWithUpdatePrices(
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