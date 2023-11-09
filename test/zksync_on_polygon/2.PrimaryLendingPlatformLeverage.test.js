require("dotenv").config();
const hre = require("hardhat");
const { deployment } = require("../../scripts/deployPLP_V2/deploymentPLP");
const { ethers } = require("ethers");
const { expect } = require("chai");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
let { deploymentMockToken } = require("../../scripts/deployPLP_V2/deploymentMockToken");
const { getPriceFeedsUpdateData } = require("./utils/utilities");

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

describe("PrimaryLendingPlatformLeverage", function () {
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

    describe("leveragedBorrow", async function () {
        before(async function () {
            await loadFixture();
        });
        let timeBeforeExpiration = 15;

        it("1. Failure: Should throw error when projectToken has an invalid address", async function () {
            let projectToken = "Not Address.";
            let lendingToken = usdcAddress;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("2. Failure: Should throw error when lendingToken has an invalid address", async function () {
            let projectToken = prj1.address;
            let lendingToken = "Not Address.";
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("3. Failure: Should throw error when notionalExposure < 0", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(-1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("4. Failure: Should throw error when notionalExposure > maxUint256", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = ethers.constants.MaxUint256.add(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("5. Failure: Should throw error when typeof notionalExposure is NOT UINT", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = 1.1;
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("6. Failure: Should throw error when marginCollateralAmount < 0", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(-1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("7. Failure: Should throw error when marginCollateralAmount > maxUint256", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = ethers.constants.MaxUint256.add(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("8. Failure: Should throw error when typeof marginCollateralAmount is NOT UINT", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = 1.1;
            let buyCalldata = "0x";
            let type = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("9. Failure: Should throw error when buyCalldata is NOT BYTES", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "NOT BYTES.";
            let type = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("10. Failure: Should throw error when leverageType < 0", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(-1);
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("11. Failure: Should throw error when leverageType > 255 (uint8)", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(256);
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("12. Failure: Should throw error when typeof leverageType is NOT UINT", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = 1.1;
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("13. Failure: Should throw error when priceIds is NOT ARRAY BYTES32", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let priceIds = "Not array bytes32";
            let updateData = [];
            let updateFee = 0;

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("14. Failure: Should throw error when updateData is NOT ARRAY BYTES", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let priceIds = [];
            let updateData = "Not array bytes";
            let updateFee = 0;

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("15. Failure: Should throw error when msg.value < 0", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(-1);

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("16. Failure: Should throw error when msg.value > maxUint256", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = ethers.constants.MaxUint256.add(1);

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("17. Failure: Should throw error when typeof msg.value is NOT UINT", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = 1.1;

            expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("18. Failure: Should revert when leverageType > 1", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(2);
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.reverted;
        });
        it("19. Failure: Should revert when priceIds.length == 0 and msg.value > 0", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(1);

            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("PriceProviderAggregatorPyth: Msg.value!=0!");
        });
        it.skip("20. Failure: Should revert when priceIds.length != updateData.length", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken], timeBeforeExpiration);
            let updateData = [];

            expect(priceIds).to.not.eq(updateData.length);
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("PythPriceProvider: Mismatched array sizes!");
        });
        it("21. Failure: Should revert when updateFee != priceIds.length * singleUpdateFeeInWei", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            expect(priceIds.length).to.gt(0);
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee.sub(1) }
            )).to.be.revertedWith("PythPriceProvider: Incorrect updateFee!");
        });
        it("22. Failure: Should revert when updateData is invalid", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken], timeBeforeExpiration);
            let updateData = ["0x"];

            expect(priceIds.length).to.gt(0);
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.reverted;
        });
        it("23. Failure: Should revert when notionalExposure == 0", async function () {
            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp = toBN(0);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("PITLeverage: Invalid amount");
        });
        it("24. Failure: Should revert when lendingToken != currentLendingToken and currentLendingToken != ZERO ADDRESS", async function () {
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
                    let borrowAmount = ethers.utils.parseUnits("1000000", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);
                    let availableToBorrow = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                        deployMaster.address,
                        projectToken,
                        usdcAddress,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        availableToBorrow.div(2),
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(currentLendingToken).to.not.eq(lendingToken);
            await expect(plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("PITLeverage: Invalid lending token");
        });
        it("25. Failure: Should revert when lendingToken == currentLendingToken, isLeveragePosition == FALSE and loadBody > 0", async function () {
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
                    let borrowAmount = ethers.utils.parseUnits("1000000", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);
                    let availableToBorrow = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                        deployMaster.address,
                        projectToken,
                        usdcAddress,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        availableToBorrow.div(2),
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("PITLeverage: Invalid position");
        });
        it("26. Failure: Should revert when currentLendingToken == ZERO ADDRESS and marginCollateralAmount < depositedProjectTokenAmount", async function () {
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
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("PITLeverage: Invalid amount");
        });
        it("27. Failure: Should revert when marginCollateralAmount < depositedProjectTokenAmount and isLeveragePosition == TRUE", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);

            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);

                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let depositedTokenAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            margin = depositedTokenAmount.sub(1);
            buyCalldata = "0x";
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("PITLeverage: Invalid amount");
        });
        it("28. Failure: Should revert when buyOnExchangeAggregator fails", async function () {
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
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);
            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.reverted;
        });
        it.skip("29. Failure: Should revert when isProjectTokenListed == FALSE", async function () {
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("Prj token isn't listed");
        });
        it.skip("30. Failure: Should revert when isLendingTokenListed == FALSE", async function () {
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("Lending token isn't listed");
        });
        it("31. Failure: Should revert when allowance lendingToken < lendingTokenCount and isLeveragePosition == FALSE", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);

            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount.sub(1));
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("ERC20: transfer amount exceeds allowance");
        });
        it("32. Failure: Should revert when allowance lendingToken < lendingTokenCount and isLeveragePosition == TRUE", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);

            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(200), toBN(10), exp, priceIds, updateData, { value: updateFee });
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount.sub(1));
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("ERC20: transfer amount exceeds allowance");
        });
        it("33. Failure: Should revert when allowance projectToken < addingAmount and isLeveragePosition == FALSE", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);

            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount.sub(1));
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("ERC20: transfer amount exceeds allowance");
        });
        it("34. Failure: Should revert when allowance projectToken < addingAmount and isLeveragePosition == TRUE", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);

            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(200), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount.sub(1));
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("ERC20: transfer amount exceeds allowance");
        });
        it("35. Failure: Should revert when balance projectToken < addingAmount and isLeveragePosition == FALSE", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);

            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    await prj1.connect(deployMaster).transfer(signers[1].address, (await prj1.balanceOf(deployMaster.address)));
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(200), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("ERC20: transfer amount exceeds balance");
        });
        it("36. Failure: Should revert when balance projectToken < addingAmount and isLeveragePosition == TRUE", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);

            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
                {
                    await prj1.connect(deployMaster).transfer(signers[1].address, (await prj1.balanceOf(deployMaster.address)));
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(200), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("ERC20: transfer amount exceeds balance");
        });
        it("37. Failure: Should revert when totalOutstandingInUSD > pit, isLeveragePosition == FALSE and addingAmount > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);

            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            await pythPriceProviderInstance.updatePrices(priceIds, updateData, { value: updateFee });
            {
                await setLowPrice(projectToken);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);
                await expect(plpLeverageInstance.leveragedBorrow(
                    projectToken,
                    lendingToken,
                    exp,
                    margin,
                    buyCalldata,
                    type,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.revertedWith("PITLeverage: LendingTokenAmount exceeds pit remaining");
            }
        });
        it("38. Failure: Should revert when totalOutstandingInUSD > pit, isLeveragePosition == TRUE and addingAmount > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);

            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(500), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            await pythPriceProviderInstance.updatePrices(priceIds, updateData, { value: updateFee });
            {
                await setLowPrice(projectToken);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);
                await expect(plpLeverageInstance.leveragedBorrow(
                    projectToken,
                    lendingToken,
                    exp,
                    margin,
                    buyCalldata,
                    type,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.revertedWith("PITLeverage: LendingTokenAmount exceeds pit remaining");
            }
        });
        it("39. Failure: Should revert when totalOutstandingInUSD > pit, isLeveragePosition == FALSE and addingAmount == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpInstance.address, addingAmount);
            await plpInstance.deposit(projectToken, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            await pythPriceProviderInstance.updatePrices(priceIds, updateData, { value: updateFee });
            {
                await setLowPrice(projectToken);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);
                await expect(plpLeverageInstance.leveragedBorrow(
                    projectToken,
                    lendingToken,
                    exp,
                    margin,
                    buyCalldata,
                    type,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.revertedWith("PITLeverage: LendingTokenAmount exceeds pit remaining");
            }
        });
        it("40. Failure: Should revert when totalOutstandingInUSD > pit, isLeveragePosition == TRUE and addingAmount == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(500), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpInstance.address, addingAmount);
            await plpInstance.deposit(projectToken, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            await pythPriceProviderInstance.updatePrices(priceIds, updateData, { value: updateFee });
            {
                await setLowPrice(projectToken);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);
                await expect(plpLeverageInstance.leveragedBorrow(
                    projectToken,
                    lendingToken,
                    exp,
                    margin,
                    buyCalldata,
                    type,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.revertedWith("PITLeverage: LendingTokenAmount exceeds pit remaining");
            }
        });
        it("41. Failure: Should revert when totalBorrowPerCollateral > borrowLimitPerCollateral, isLeveragePosition == FALSE and addingAmount > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowLimitPerCollateral = await plpInstance.borrowLimitPerCollateral(projectToken);
                    let lendingTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(lendingToken, borrowLimitPerCollateral, priceIds, updateData, { value: updateFee });
                    let supplyAmount = lendingTokenCount.mul(10);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let projectTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(projectToken, borrowLimitPerCollateral, priceIds, updateData, { value: updateFee });
                    await setBalance(prj1.address, signers[1].address, ethers.constants.MaxUint256);
                    await prj1.connect(signers[1]).approve(plpAddress, projectTokenCount.mul(10));
                    await plpInstance.connect(signers[1]).deposit(
                        projectToken,
                        projectTokenCount.mul(10)
                    );
                    await plpInstance.connect(signers[1]).borrow(
                        projectToken,
                        lendingToken,
                        await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                            signers[1].address,
                            projectToken,
                            lendingToken,
                            priceIds,
                            updateData,
                            { value: updateFee }
                        ),
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        });
        it("42. Failure: Should revert when totalBorrowPerCollateral > borrowLimitPerCollateral, isLeveragePosition == TRUE and addingAmount > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowLimitPerCollateral = await plpInstance.borrowLimitPerCollateral(projectToken);
                    let projectTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(projectToken, borrowLimitPerCollateral, priceIds, updateData, { value: updateFee });
                    await setBalance(prj1.address, signers[1].address, ethers.constants.MaxUint256);
                    await prj1.connect(signers[1]).approve(plpAddress, projectTokenCount.mul(10));
                    await plpInstance.connect(signers[1]).deposit(
                        projectToken,
                        projectTokenCount.mul(10)
                    );
                    await plpInstance.connect(signers[1]).borrow(
                        projectToken,
                        lendingToken,
                        await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                            signers[1].address,
                            projectToken,
                            lendingToken,
                            priceIds,
                            updateData,
                            { value: updateFee }
                        ),
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(200), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        });
        it("43. Failure: Should revert when totalBorrowPerCollateral > borrowLimitPerCollateral, isLeveragePosition == FALSE and addingAmount == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowLimitPerCollateral = await plpInstance.borrowLimitPerCollateral(projectToken);
                    let lendingTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(lendingToken, borrowLimitPerCollateral, priceIds, updateData, { value: updateFee });
                    let supplyAmount = lendingTokenCount.mul(10);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let projectTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(projectToken, borrowLimitPerCollateral, priceIds, updateData, { value: updateFee });
                    await setBalance(prj1.address, signers[1].address, ethers.constants.MaxUint256);
                    await prj1.connect(signers[1]).approve(plpAddress, projectTokenCount.mul(10));
                    await plpInstance.connect(signers[1]).deposit(
                        projectToken,
                        projectTokenCount.mul(10)
                    );
                    await plpInstance.connect(signers[1]).borrow(
                        projectToken,
                        lendingToken,
                        await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                            signers[1].address,
                            projectToken,
                            lendingToken,
                            priceIds,
                            updateData,
                            { value: updateFee }
                        ),
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpAddress, addingAmount);
            await plpInstance.deposit(projectToken, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        });
        it("44. Failure: Should revert when totalBorrowPerCollateral > borrowLimitPerCollateral, isLeveragePosition == TRUE and addingAmount == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowLimitPerCollateral = await plpInstance.borrowLimitPerCollateral(projectToken);
                    let projectTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(projectToken, borrowLimitPerCollateral, priceIds, updateData, { value: updateFee });
                    await setBalance(prj1.address, signers[1].address, ethers.constants.MaxUint256);
                    await prj1.connect(signers[1]).approve(plpAddress, projectTokenCount.mul(10));
                    await plpInstance.connect(signers[1]).deposit(
                        projectToken,
                        projectTokenCount.mul(10)
                    );
                    await plpInstance.connect(signers[1]).borrow(
                        projectToken,
                        lendingToken,
                        await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                            signers[1].address,
                            projectToken,
                            lendingToken,
                            priceIds,
                            updateData,
                            { value: updateFee }
                        ),
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(200), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpAddress, addingAmount);
            await plpInstance.deposit(projectToken, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        });
        it("45. Failure: Should revert when totalBorrowPerLendingToken > borrowLimitPerLendingToken, isLeveragePosition == FALSE and addingAmount > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken, prj2Address], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let lendingTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(lendingToken, borrowLimitPerLendingToken, priceIds, updateData, { value: updateFee });
                    let supplyAmount = lendingTokenCount.mul(10);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let projectTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(prj2.address, borrowLimitPerLendingToken, priceIds, updateData, { value: updateFee });
                    await prj2.mintTo(signers[1].address, projectTokenCount.mul(10));
                    await prj2.connect(signers[1]).approve(plpAddress, projectTokenCount.mul(10));
                    await plpInstance.connect(signers[1]).deposit(
                        prj2.address,
                        projectTokenCount.mul(10)
                    );
                    await plpInstance.connect(signers[1]).borrow(
                        prj2.address,
                        lendingToken,
                        await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                            signers[1].address,
                            prj2.address,
                            lendingToken,
                            priceIds,
                            updateData,
                            { value: updateFee }
                        ),
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
        });
        it("46. Failure: Should revert when totalBorrowPerLendingToken > borrowLimitPerLendingToken, isLeveragePosition == TRUE and addingAmount > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken, prj2Address], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let projectTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(prj2.address, borrowLimitPerLendingToken, priceIds, updateData, { value: updateFee });
                    await prj2.mintTo(signers[1].address, projectTokenCount.mul(10));
                    await prj2.connect(signers[1]).approve(plpAddress, projectTokenCount.mul(10));
                    await plpInstance.connect(signers[1]).deposit(
                        prj2.address,
                        projectTokenCount.mul(10)
                    );
                    await plpInstance.connect(signers[1]).borrow(
                        prj2.address,
                        lendingToken,
                        await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                            signers[1].address,
                            prj2.address,
                            lendingToken,
                            priceIds,
                            updateData,
                            { value: updateFee }
                        ),
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(200), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
        });
        it("47. Failure: Should revert when totalBorrowPerLendingToken > borrowLimitPerLendingToken, isLeveragePosition == FALSE and addingAmount == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken, prj2Address], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let lendingTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(lendingToken, borrowLimitPerLendingToken, priceIds, updateData, { value: updateFee });
                    let supplyAmount = lendingTokenCount.mul(10);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let projectTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(prj2.address, borrowLimitPerLendingToken, priceIds, updateData, { value: updateFee });
                    await prj2.mintTo(signers[1].address, projectTokenCount.mul(10));
                    await prj2.connect(signers[1]).approve(plpAddress, projectTokenCount.mul(10));
                    await plpInstance.connect(signers[1]).deposit(
                        prj2.address,
                        projectTokenCount.mul(10)
                    );
                    await plpInstance.connect(signers[1]).borrow(
                        prj2.address,
                        lendingToken,
                        await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                            signers[1].address,
                            prj2.address,
                            lendingToken,
                            priceIds,
                            updateData,
                            { value: updateFee }
                        ),
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpAddress, addingAmount);
            await plpInstance.deposit(projectToken, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
        });
        it("48. Failure: Should revert when totalBorrowPerLendingToken > borrowLimitPerLendingToken, isLeveragePosition == TRUE and addingAmount == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let lendingTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(lendingToken, borrowLimitPerLendingToken, priceIds, updateData, { value: updateFee });
                    let supplyAmount = lendingTokenCount.mul(10);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken, prj2.address], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let projectTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(projectToken, borrowLimitPerLendingToken, priceIds, updateData, { value: updateFee });
                    await prj2.mintTo(signers[1].address, projectTokenCount.mul(10));
                    await prj2.connect(signers[1]).approve(plpAddress, projectTokenCount.mul(10));
                    await plpInstance.connect(signers[1]).deposit(
                        prj2.address,
                        projectTokenCount.mul(10)
                    );
                    await plpInstance.connect(signers[1]).borrow(
                        prj2.address,
                        lendingToken,
                        await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                            signers[1].address,
                            prj2.address,
                            lendingToken,
                            priceIds,
                            updateData,
                            { value: updateFee }
                        ),
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken, prj2.address], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(200), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpAddress, addingAmount);
            await plpInstance.deposit(projectToken, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
                type,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
        });
        it("49. Success (Single-user): Should leveraged borrow 50 USDC when isLeveragePosition == FALSE and addingAmount > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let lendingTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(lendingToken, borrowLimitPerLendingToken, priceIds, updateData, { value: updateFee });
                    await setBalance(usdc.address, deployMaster.address, lendingTokenCount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, lendingTokenCount);
                    await plpInstance.supply(lendingToken, lendingTokenCount);
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
            // let totalBorrowPerCollateralBeforeLeverage = await plpInstance.callStatic.getTotalBorrowPerCollateralWithUpdatePrices(projectToken, priceIds, updateData, { value: updateFee });
            let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.callStatic.getTotalBorrowPerLendingTokenWithUpdatePrices(lendingToken, priceIds, updateData, { value: updateFee });
            let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            let tx = await plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
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
            // let totalBorrowPerCollateralAfterLeverage = await plpInstance.callStatic.getTotalBorrowPerCollateralWithUpdatePrices(projectToken, priceIds, updateData, { value: updateFee });
            let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.callStatic.getTotalBorrowPerLendingTokenWithUpdatePrices(lendingToken, priceIds, updateData, { value: updateFee });
            let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(isLeveragePositionAfterLeverage).to.eq(true);
            expect(balanceProjectTokenAfterLeverage).to.eq(balanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
            expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
            // expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
            expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
            expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
            expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
        });
        it("50. Success (Single-user): Should leveraged borrow 50 USDC when isLeveragePosition == TRUE and addingAmount > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000000", usdcDecimals);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(200), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
            // let totalBorrowPerCollateralBeforeLeverage = await plpInstance.callStatic.getTotalBorrowPerCollateralWithUpdatePrices(projectToken, priceIds, updateData, { value: updateFee });
            let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.callStatic.getTotalBorrowPerLendingTokenWithUpdatePrices(lendingToken, priceIds, updateData, { value: updateFee });
            let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            let tx = await plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
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
            // let totalBorrowPerCollateralAfterLeverage = await plpInstance.callStatic.getTotalBorrowPerCollateralWithUpdatePrices(projectToken, priceIds, updateData, { value: updateFee });
            let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.callStatic.getTotalBorrowPerLendingTokenWithUpdatePrices(lendingToken, priceIds, updateData, { value: updateFee });
            let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(isLeveragePositionAfterLeverage).to.eq(true);
            expect(balanceProjectTokenAfterLeverage).to.eq(balanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
            expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
            // expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
            expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
            expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
            expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
        });
        it("51. Success (Single-user): Should leveraged borrow 50 USDC when isLeveragePosition == FALSE and addingAmount == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256)
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);


                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let lendingTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(lendingToken, borrowLimitPerLendingToken, priceIds, updateData, { value: updateFee });
                    let supplyAmount = lendingTokenCount.mul(10);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount)
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpAddress, addingAmount);
            await plpInstance.deposit(projectToken, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
            // let totalBorrowPerCollateralBeforeLeverage = await plpInstance.callStatic.getTotalBorrowPerCollateralWithUpdatePrices(projectToken, priceIds, updateData, { value: updateFee });
            let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.callStatic.getTotalBorrowPerLendingTokenWithUpdatePrices(lendingToken, priceIds, updateData, { value: updateFee });
            let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            let tx = await plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
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
            // let totalBorrowPerCollateralAfterLeverage = await plpInstance.callStatic.getTotalBorrowPerCollateralWithUpdatePrices(projectToken, priceIds, updateData, { value: updateFee });
            let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.callStatic.getTotalBorrowPerLendingTokenWithUpdatePrices(lendingToken, priceIds, updateData, { value: updateFee });
            let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(isLeveragePositionAfterLeverage).to.eq(true);
            expect(balanceProjectTokenAfterLeverage).to.eq(balanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
            expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
            // expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
            expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
            expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
            expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
        });
        it("52. Success (Single-user): Should leveraged borrow 50 USDC when isLeveragePosition == TRUE and addingAmount == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = usdc.address;
            let exp;
            let margin;
            let buyCalldata;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("10", prj1Decimals);
                    await setBalance(prj1.address, deployMaster.address, ethers.constants.MaxUint256);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowLimitPerLendingToken = await plpInstance.borrowLimitPerLendingToken(lendingToken);
                    let lendingTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(lendingToken, borrowLimitPerLendingToken, priceIds, updateData, { value: updateFee });
                    let supplyAmount = lendingTokenCount.mul(10);
                    await setBalance(usdc.address, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(20), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    let buyCalldata = configTesting.encodeDataTestingForLeverage;
                    await plpLeverageInstance.leveragedBorrow(
                        projectToken,
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(200), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await prj1.connect(deployMaster).approve(plpAddress, addingAmount);
            await plpInstance.deposit(projectToken, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            buyCalldata = configTesting.encodeDataTestingForLeverage;
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
            // let totalBorrowPerCollateralBeforeLeverage = await plpInstance.callStatic.getTotalBorrowPerCollateralWithUpdatePrices(projectToken, priceIds, updateData, { value: updateFee });
            let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.callStatic.getTotalBorrowPerLendingTokenWithUpdatePrices(lendingToken, priceIds, updateData, { value: updateFee });
            let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            let tx = await plpLeverageInstance.leveragedBorrow(
                projectToken,
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                { value: updateFee }
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
            // let totalBorrowPerCollateralAfterLeverage = await plpInstance.callStatic.getTotalBorrowPerCollateralWithUpdatePrices(projectToken, priceIds, updateData, { value: updateFee });
            let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.callStatic.getTotalBorrowPerLendingTokenWithUpdatePrices(lendingToken, priceIds, updateData, { value: updateFee });
            let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(isLeveragePositionAfterLeverage).to.eq(true);
            expect(balanceProjectTokenAfterLeverage).to.eq(balanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
            expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
            // expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
            expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
            expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
            expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(argsEvent.amountReceive).add(addingAmount));
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

        it("1. getTokenPriceWithUpdatePrices", async function () {
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = [];
            if (priceIds.length > 0) updateData = await getPriceFeedsUpdateData(priceIds);

            await plpLeverageInstance.getTokenPriceWithUpdatePrices(
                projectToken,
                priceIds,
                updateData,
                { value: updateFee }
            );
        });
        it("2. calculateLendingTokenCountWithUpdatePrices", async function () {
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = [];
            if (priceIds.length > 0) updateData = await getPriceFeedsUpdateData(priceIds);

            await plpLeverageInstance.calculateLendingTokenCountWithUpdatePrices(
                lendingToken,
                0,
                priceIds,
                updateData,
                { value: updateFee }
            );
        });
        it("3. calculateMarginWithUpdatePrices", async function () {
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = [];
            if (priceIds.length > 0) updateData = await getPriceFeedsUpdateData(priceIds);

            await plpLeverageInstance.calculateMarginWithUpdatePrices(
                projectToken,
                lendingToken,
                0,
                1,
                0,
                priceIds,
                updateData,
                { value: updateFee }
            );
        });
        it("4. calculateSafetyMarginWithUpdatePrices", async function () {
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = [];
            if (priceIds.length > 0) updateData = await getPriceFeedsUpdateData(priceIds);

            await plpLeverageInstance.calculateSafetyMarginWithUpdatePrices(
                projectToken,
                lendingToken,
                0,
                0,
                priceIds,
                updateData,
                { value: updateFee }
            );
        });
    });
});