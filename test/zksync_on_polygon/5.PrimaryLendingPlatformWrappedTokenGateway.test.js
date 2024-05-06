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
const toBN = (num) => hre.ethers.BigNumber.from(num);

describe("PrimaryLendingPlatformWrappedTokenGateway", function () {
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
    let timeBeforeExpiration = 15;
    let masterAddress;
    let bLendingTokenAddress;
    let bLendingTokenInstance;

    let bToken;
    let exchangeRate;

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
        masterAddress = deployMaster.address;
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
            {
                bLendingTokenAddress = (await plpInstance.lendingTokenInfo(wethAddress)).bLendingToken;
                bLendingTokenInstance = MockToken.attach(bLendingTokenAddress).connect(deployMaster);

                bToken = await loadBtokenInstance(bLendingTokenAddress, deployMaster);
                exchangeRate = Number((await bToken.callStatic.exchangeRateCurrent()).div(ethers.utils.parseEther("1")));
            }
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
    async function loadBtokenInstance(bTokenAddress, deployMaster) {
        let BToken = await hre.ethers.getContractFactory("BLendingToken");
        return BToken.attach(bTokenAddress).connect(deployMaster);
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
            )).to.be.revertedWith("Token is paused");

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
            )).to.be.revertedWith("Token is paused");

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
            )).to.be.revertedWith("Invalid amount");
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
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpWTGInstance.withdraw(
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("2. Failure: Should throw error when projectTokenAmount > maxUint256", async function () {
            let projectTokenAmount = ethers.constants.MaxUint256.add(toBN(1));
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpWTGInstance.withdraw(
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("3. Failure: Should throw error when typeof projectTokenAmount is NOT UINT", async function () {
            let projectTokenAmount = 1.1;
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpWTGInstance.withdraw(
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("4. Failure: Should throw error when priceIds is NOT ARRAY BYTES32", async function () {
            let projectTokenAmount = 1;
            let priceIds = "Not array bytes32";
            let updateData = [];
            let updateFee = 0;

            expect(plpWTGInstance.withdraw(
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("5. Failure: Should throw error when updateData is NOT ARRAY BYTES", async function () {
            let projectTokenAmount = 1;
            let priceIds = [];
            let updateData = "Not array bytes";
            let updateFee = 0;

            expect(plpWTGInstance.withdraw(
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("6. Failure: Should throw error when msg.value < 0", async function () {
            let projectTokenAmount = 1;
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(-1);

            expect(plpWTGInstance.withdraw(
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("7. Failure: Should throw error when msg.value > maxUint256", async function () {
            let projectTokenAmount = 1;
            let priceIds = [];
            let updateData = [];
            let updateFee = ethers.constants.MaxUint256.add(1);

            expect(plpWTGInstance.withdraw(
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("8. Failure: Should throw error when typeof msg.value is NOT UINT", async function () {
            let projectTokenAmount = 1;
            let priceIds = [];
            let updateData = [];
            let updateFee = 1.1;

            expect(plpWTGInstance.withdraw(
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("9. Failure: Should revert when priceIds.length == 0 and msg.value > 0", async function () {
            let projectTokenAmount = toBN(1);
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(1);

            await expect(plpWTGInstance.withdraw(
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("PriceProviderAggregatorPyth: Msg.value!=0!");
        });
        it.skip("10. Failure: Should revert when priceIds.length != updateData.length", async function () {
            let projectToken = prj1.address;
            let projectTokenAmount = toBN(1);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken], timeBeforeExpiration);
            let updateData = [];

            expect(priceIds).to.not.eq(updateData.length);
            await expect(plpWTGInstance.withdraw(
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("PythPriceProvider: Mismatched array sizes!");
        });
        it("11. Failure: Should revert when updateFee != priceIds.length * singleUpdateFeeInWei", async function () {
            let projectToken = prj1.address;
            let projectTokenAmount = toBN(1);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken], timeBeforeExpiration);
            let updateData = ["0x"];

            expect(priceIds.length).to.gt(0);
            await expect(plpWTGInstance.withdraw(
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee.sub(1) }
            )).to.be.revertedWith("PythPriceProvider: Incorrect updateFee!");
        });
        it("12. Failure: Should revert when updateData is invalid", async function () {
            let projectToken = prj1.address;
            let projectTokenAmount = toBN(1);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken], timeBeforeExpiration);
            let updateData = ["0x"];

            expect(priceIds.length).to.gt(0);
            await expect(plpWTGInstance.withdraw(
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.reverted;
        });
        it("13. Failure: Should revert when isWithdrawPaused == TRUE", async function () {
            let projectToken = weth.address;
            let projectTokenAmount = toBN(1);
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            await plpModeratorInstance.setPausedProjectToken(
                projectToken,
                false,
                true
            );

            await expect(plpWTGInstance.withdraw(
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("Token is paused");

            await plpModeratorInstance.setPausedProjectToken(
                projectToken,
                false,
                false
            );
        });
        it("14. Failure: Should revert when projectTokenAmount == 0", async function () {
            let projectTokenAmount = toBN(0);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([wethAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            await expect(plpWTGInstance.withdraw(
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("Invalid amount or deposit doesn't exist");
        });
        it("15. Failure: Should revert when depositedProjectTokenAmount == 0", async function () {
            await loadFixture();

            let projectToken = weth.address;
            let projectTokenAmount = toBN(1);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([wethAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            expect(await plpInstance.getDepositedAmount(projectToken, deployMaster.address)).to.eq(toBN(0));

            await expect(plpWTGInstance.withdraw(
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("Invalid amount or deposit doesn't exist");
        });
        it("16. Failure: Should revert when withdrawableAmount == 0", async function () {
            await loadFixture();

            let projectToken = weth.address;
            let projectTokenAmount = toBN(1);
            {
                {
                    let depositAmount = ethers.utils.parseEther("100");
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

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    await plpInstance.borrow(
                        projectToken,
                        usdcAddress,
                        ethers.constants.MaxUint256,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    await plpWTGInstance.withdraw(
                        ethers.constants.MaxUint256,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                    await pythPriceProviderInstance.setValidTimePeriod(ethers.constants.MaxUint256);
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = [];
            if (priceIds.length > 0) updateData = await getPriceFeedsUpdateData(priceIds);

            let withdrawableAmount = await plpInstance.callStatic.getCollateralAvailableToWithdrawWithUpdatePrices(
                deployMaster.address,
                projectToken,
                usdcAddress,
                priceIds,
                updateData,
                { value: updateFee }
            );
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(withdrawableAmount).to.eq(0);
            expect(actualLendingToken).to.eq(usdcAddress);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                actualLendingToken
            )).loanBody).to.gt(toBN(0));

            await expect(plpWTGInstance.withdraw(
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("Withdrawable amount is 0");
        });
        it("17. Success (Single-user): Should withdraw available amount ETH when withdrawableAmount >= projectTokenAmount and loanBody > 0", async function () {
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
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let withdrawableAmount = await plpInstance.callStatic.getCollateralAvailableToWithdrawWithUpdatePrices(
                deployMaster.address,
                projectToken,
                usdcAddress,
                priceIds,
                updateData,
                { value: updateFee }
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
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
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

            expect(balanceETHAfterWithdraw).eq(balanceETHBeforeWithdraw.add(projectTokenAmount).sub(transactionFee).sub(updateFee));
            expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(projectTokenAmount));
            expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(projectTokenAmount));
        });
        it("17. Success (Multi-user): Should withdraw available amount ETH when withdrawableAmount >= projectTokenAmount and loanBody > 0", async function () {
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

                        let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                        let updateData = await getPriceFeedsUpdateData(priceIds);

                        await plpInstance.connect(signers[i]).borrow(
                            projectToken,
                            usdcAddress,
                            borrowAmount,
                            priceIds,
                            updateData,
                            { value: updateFee }
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                let withdrawableAmount = await plpInstance.callStatic.getCollateralAvailableToWithdrawWithUpdatePrices(
                    signers[i].address,
                    projectToken,
                    usdcAddress,
                    priceIds,
                    updateData,
                    { value: updateFee }
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
                    projectTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
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

                expect(balanceETHAfterWithdraw).eq(balanceETHBeforeWithdraw.add(projectTokenAmount).sub(transactionFee).sub(updateFee));
                expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(projectTokenAmount));
                expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(projectTokenAmount));
            }
        });
        it("18. Success (Single-user): Should withdraw available amount ETH when withdrawableAmount < projectTokenAmount and loanBody > 0", async function () {
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
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let withdrawableAmount = await plpInstance.callStatic.getCollateralAvailableToWithdrawWithUpdatePrices(
                deployMaster.address,
                projectToken,
                usdcAddress,
                priceIds,
                updateData,
                { value: updateFee }
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
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
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

            expect(balanceETHAfterWithdraw).eq(balanceETHBeforeWithdraw.add(withdrawableAmount).sub(transactionFee).sub(updateFee));
            expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(withdrawableAmount));
            expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(withdrawableAmount));
        });
        it("18. Success (Multi-user): Should withdraw available amount ETH when withdrawableAmount < projectTokenAmount and loanBody > 0", async function () {
            await loadFixture();

            let projectToken = weth.address;
            {
                for (let i = 0; i < signers.length; i++) {
                    let depositAmount = ethers.utils.parseEther("1000");
                    await plpWTGInstance.connect(signers[i]).deposit(
                        { value: depositAmount }
                    );
                    {
                        let borrowAmount = ethers.utils.parseUnits("1", usdcDecimals);
                        await usdc.mint(signers[i].address, borrowAmount);
                        let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                        await usdc.connect(signers[i]).approve(blendingToken, borrowAmount);
                        await plpInstance.connect(signers[i]).supply(usdcAddress, borrowAmount);

                        let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                        let updateData = await getPriceFeedsUpdateData(priceIds);

                        await plpInstance.connect(signers[i]).borrow(
                            projectToken,
                            usdcAddress,
                            borrowAmount,
                            priceIds,
                            updateData,
                            { value: updateFee }
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                let withdrawableAmount = await plpInstance.callStatic.getCollateralAvailableToWithdrawWithUpdatePrices(
                    signers[i].address,
                    projectToken,
                    usdcAddress,
                    priceIds,
                    updateData,
                    { value: updateFee }
                );
                let projectTokenAmount = withdrawableAmount.add(1);
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);

                expect(withdrawableAmount).gt(toBN(0));
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
                    projectTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
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

                expect(balanceETHAfterWithdraw).eq(balanceETHBeforeWithdraw.add(withdrawableAmount).sub(transactionFee).sub(updateFee));
                expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(withdrawableAmount));
                expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(withdrawableAmount));
            }
        });
        it("19. Success (Single-user): Should withdraw available amount ETH when withdrawableAmount >= projectTokenAmount and loanBody == 0", async function () {
            await loadFixture();

            let projectToken = weth.address;
            {
                let depositAmount = ethers.utils.parseEther("10");
                await plpWTGInstance.deposit(
                    { value: depositAmount }
                );
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let withdrawableAmount = await plpInstance.callStatic.getCollateralAvailableToWithdrawWithUpdatePrices(
                deployMaster.address,
                projectToken,
                usdcAddress,
                priceIds,
                updateData,
                { value: updateFee }
            );
            let projectTokenAmount = withdrawableAmount;
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(withdrawableAmount).gt(toBN(0));
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
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
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

            expect(balanceETHAfterWithdraw).eq(balanceETHBeforeWithdraw.add(projectTokenAmount).sub(transactionFee).sub(updateFee));
            expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(projectTokenAmount));
            expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(projectTokenAmount));
        });
        it("19. Success (Multi-user): Should withdraw available amount ETH when withdrawableAmount >= projectTokenAmount and loanBody == 0", async function () {
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
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                let withdrawableAmount = await plpInstance.callStatic.getCollateralAvailableToWithdrawWithUpdatePrices(
                    signers[i].address,
                    projectToken,
                    usdcAddress,
                    priceIds,
                    updateData,
                    { value: updateFee }
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
                    projectTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
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

                expect(balanceETHAfterWithdraw).eq(balanceETHBeforeWithdraw.add(projectTokenAmount).sub(transactionFee).sub(updateFee));
                expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(projectTokenAmount));
                expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(projectTokenAmount));
            }
        });
        it("20. Success (Single-user): Should withdraw available amount ETH when withdrawableAmount < projectTokenAmount and loanBody == 0", async function () {
            await loadFixture();

            let projectToken = weth.address;
            {
                let depositAmount = ethers.utils.parseEther("10");
                await plpWTGInstance.deposit(
                    { value: depositAmount }
                );
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let withdrawableAmount = await plpInstance.callStatic.getCollateralAvailableToWithdrawWithUpdatePrices(
                deployMaster.address,
                projectToken,
                usdcAddress,
                priceIds,
                updateData,
                { value: updateFee }
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
                projectTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
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

            expect(balanceETHAfterWithdraw).eq(balanceETHBeforeWithdraw.add(withdrawableAmount).sub(transactionFee).sub(updateFee));
            expect(depositedAmountAfterWithdraw).eq(depositedAmountBeforeWithdraw.sub(withdrawableAmount));
            expect(totalDepositedProjectTokenAfterWithdraw).eq(totalDepositedProjectTokenBeforeWithdraw.sub(withdrawableAmount));
        });
        it("20. Success (Multi-user): Should withdraw available amount ETH when withdrawableAmount < projectTokenAmount and loanBody == 0", async function () {
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
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                let withdrawableAmount = await plpInstance.callStatic.getCollateralAvailableToWithdrawWithUpdatePrices(
                    signers[i].address,
                    projectToken,
                    usdcAddress,
                    priceIds,
                    updateData,
                    { value: updateFee }
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
                    projectTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
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

                expect(balanceETHAfterWithdraw).eq(balanceETHBeforeWithdraw.add(withdrawableAmount).sub(transactionFee).sub(updateFee));
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
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("2. Failure: Should throw error when lendingTokenAmount < 0", async function () {
            let projectToken = prj1.address;
            let lendingTokenAmount = -1;
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("3. Failure: Should throw error when lendingTokenAmount > maxUint256", async function () {
            let projectToken = prj1.address;
            let lendingTokenAmount = ethers.constants.MaxUint256.add(toBN(1));
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("4. Failure: Should throw error when typeof projectTokenAmount is NOT UINT", async function () {
            let projectToken = prj1.address;
            let lendingTokenAmount = 1.1;
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("5. Failure: Should throw error when priceIds is NOT ARRAY BYTES32", async function () {
            let projectToken = prj1.address;
            let lendingTokenAmount = 1;
            let priceIds = "Not array bytes32";
            let updateData = [];
            let updateFee = 0;

            expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("6. Failure: Should throw error when updateData is NOT ARRAY BYTES", async function () {
            let projectToken = prj1.address;
            let lendingTokenAmount = 1;
            let priceIds = [];
            let updateData = "Not array bytes";
            let updateFee = 0;

            expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("7. Failure: Should throw error when msg.value < 0", async function () {
            let projectToken = prj1.address;
            let lendingTokenAmount = 1;
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(-1);

            expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("8. Failure: Should throw error when msg.value > maxUint256", async function () {
            let projectToken = prj1.address;
            let lendingTokenAmount = 1;
            let priceIds = [];
            let updateData = [];
            let updateFee = ethers.constants.MaxUint256.add(1);

            expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("9. Failure: Should throw error when typeof msg.value is NOT UINT", async function () {
            let projectToken = prj1.address;
            let lendingTokenAmount = 1;
            let priceIds = [];
            let updateData = [];
            let updateFee = 1.1;

            expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.throw;
        });
        it("10. Failure: Should revert when isProjectTokenListed == FALSE", async function () {
            let projectToken = ethers.constants.AddressZero;
            let lendingTokenAmount = toBN(1);
            let priceIds = [];
            let updateData = [];
            let updateFee = 0;

            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("Prj token isn't listed");
        });
        it("11. Failure: Should revert when isLeveragePosition == TRUE", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = toBN(1);
            {
                {
                    let depositAmount = ethers.utils.parseUnits("1", prj1Decimals);
                    await setBalance(prj1Address, deployMaster.address, ethers.constants.MaxUint256);
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
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowETHAmount = ethers.utils.parseEther("5");
                    let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowETHAmount, priceIds, updateData, { value: updateFee });
                    let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, borrowETHAmount);
                    let buyCalldata = configTesting.encodeDataTestingForBorrowWTG;
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
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            expect(isLeveragePosition).to.eq(true);
            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("Invalid position");
        });
        it("12. Failure: Should revert when priceIds.length == 0 and msg.value > 0", async function () {
            let projectToken = prj1.address;
            let lendingTokenAmount = toBN(1);
            let priceIds = [];
            let updateData = [];
            let updateFee = 1;

            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("PriceProviderAggregatorPyth: Msg.value!=0!");
        });
        it.skip("13. Failure: Should revert when priceIds.length != updateData.length", async function () {
            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = toBN(1);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = [];

            expect(priceIds).to.not.eq(updateData.length);
            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("PythPriceProvider: Mismatched array sizes!");
        });
        it("14. Failure: Should revert when incorrect updateFee", async function () {
            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = toBN(1);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            expect(priceIds.length).to.gt(0);
            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee.sub(1) }
            )).to.be.revertedWith("PythPriceProvider: Incorrect updateFee!");
        });
        it("15. Failure: Should revert when updateData is invalid", async function () {
            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = toBN(1);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = ["0x"];

            expect(priceIds.length).to.gt(0);
            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.reverted;
        });
        it("16. Failure: Should revert when lendingTokenAmount == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingTokenAmount = toBN(0);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, wethAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("Invalid lending amount");
        });
        it("17. Failure: Should revert when lendingToken != actualLendingToken", async function () {
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
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            expect(actualLendingToken).to.not.eq(lendingToken);
            expect(actualLendingToken).to.not.eq(ethers.constants.AddressZero);
            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("Invalid lending token");
        });
        it("18. Failure : Should revert when allowance WETH of user for WTG contract < lendingTokenAmount loanBody == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.constants.MaxUint256;
            {
                {
                    let depositAmount = ethers.utils.parseUnits("500", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseEther("10000");
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await weth.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpWTGInstance.supply({ value: supplyAmount });
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            expect(actualLendingToken).to.eq(ethers.constants.AddressZero);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let availableToBorrow = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                deployMaster.address,
                projectToken,
                lendingToken,
                priceIds,
                updateData,
                { value: updateFee }
            );
            expect(availableToBorrow).lt(lendingTokenAmount);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                lendingToken
            )).loanBody).to.eq(toBN(0));

            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.reverted;
        });
        it("19. Failure : Should revert when allowance WETH of user for WTG contract < lendingTokenAmount loanBody > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.constants.MaxUint256;
            {
                {
                    let depositAmount = ethers.utils.parseUnits("50", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseEther("100000");
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await weth.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpWTGInstance.supply({ value: supplyAmount });
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowAmount = (await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                        deployMaster.address,
                        projectToken,
                        lendingToken,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    )).div(2);
                    await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                    await plpWTGInstance.borrow(
                        projectToken,
                        borrowAmount,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            expect(actualLendingToken).to.eq(lendingToken);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);
            let availableToBorrow = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                deployMaster.address,
                projectToken,
                lendingToken,
                priceIds,
                updateData,
                { value: updateFee }
            );
            expect(availableToBorrow).lt(lendingTokenAmount);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                lendingToken
            )).loanBody).to.gt(toBN(0));

            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.reverted;
        });
        it("20. Failure: Should revert when availableToBorrow == 0 and loanBody == 0", async function () {
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

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, wethAddress], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("Available amount to borrow is 0");
        });
        it("21. Failure: Should revert when availableToBorrow == 0 and loanBody > 0", async function () {

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
                    let borrowAmount = ethers.utils.parseEther("100000000000");
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await weth.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpWTGInstance.supply({ value: borrowAmount });

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, wethAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    await plpInstance.borrow(
                        projectToken,
                        lendingToken,
                        await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                            deployMaster.address,
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
                    await pythPriceProviderInstance.setValidTimePeriod(ethers.constants.MaxUint256);
                    {
                        let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, wethAddress], timeBeforeExpiration);
                        let updateData = [];
                        if (priceIds.length > 0) updateData = await getPriceFeedsUpdateData(priceIds);
                        let availableToWithdraw = await plpInstance.callStatic.getCollateralAvailableToWithdrawWithUpdatePrices(
                            deployMaster.address,
                            projectToken,
                            lendingToken,
                            priceIds,
                            updateData,
                            { value: updateFee }
                        );
                        if (availableToWithdraw.gt(0)) {
                            await plpInstance.withdraw(projectToken, ethers.constants.MaxUint256, priceIds, updateData, { value: updateFee });
                        }
                    }
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, wethAddress], timeBeforeExpiration);
            let updateData = [];
            if (priceIds.length > 0) updateData = await getPriceFeedsUpdateData(priceIds);
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(actualLendingToken).to.eq(lendingToken);
            expect(await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                deployMaster.address,
                projectToken,
                actualLendingToken,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.eq(toBN(0));
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                actualLendingToken
            )).loanBody).to.gt(toBN(0));

            await expect(plpWTGInstance.borrow(
                projectToken,
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
            )).to.be.revertedWith("Available amount to borrow is 0");
        });
        it("22. Success (Single-user): Should borrow available amount WETH when availableToBorrow < lendingTokenAmount loanBody == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.constants.MaxUint256;
            {
                {
                    let depositAmount = ethers.utils.parseUnits("50", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseEther("10000");
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await weth.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpWTGInstance.supply({ value: supplyAmount });
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let availableToBorrow = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                deployMaster.address,
                projectToken,
                lendingToken,
                priceIds,
                updateData,
                { value: updateFee }
            );

            expect(actualLendingToken).to.eq(ethers.constants.AddressZero);
            expect(availableToBorrow).lt(lendingTokenAmount);
            expect((await plpInstance.borrowPosition(
                deployMaster.address,
                projectToken,
                lendingToken
            )).loanBody).to.eq(toBN(0));

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
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
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

            expect(balanceETHAfterBorrow).eq(balanceETHBeforeBorrow.add(availableToBorrow).sub(transactionFee).sub(updateFee));
            expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(availableToBorrow));
            expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(availableToBorrow));
            expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(availableToBorrow));
            expect(allowanceWETHAfterBorrow).eq(allowanceWETHBeforeBorrow.sub(availableToBorrow));
        });
        it("22. Success (Multi-user): Should borrow available amount WETH when availableToBorrow < lendingTokenAmount loanBody == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.constants.MaxUint256;
            {
                for (let i = 0; i < signers.length; i++) {
                    {
                        let depositAmount = ethers.utils.parseUnits("50", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                    }
                    {
                        let supplyAmount = ethers.utils.parseEther("1000");
                        let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                        await weth.connect(signers[i]).approve(blendingToken, supplyAmount);
                        await plpWTGInstance.connect(signers[i]).supply({ value: supplyAmount });
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);
                let availableToBorrow = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                    signers[i].address,
                    projectToken,
                    lendingToken,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )

                expect(actualLendingToken).to.eq(ethers.constants.AddressZero);
                expect(availableToBorrow).lt(lendingTokenAmount);
                expect((await plpInstance.borrowPosition(
                    signers[i].address,
                    projectToken,
                    lendingToken
                )).loanBody).to.eq(toBN(0));

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
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
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

                expect(balanceETHAfterBorrow).eq(balanceETHBeforeBorrow.add(availableToBorrow).sub(transactionFee).sub(updateFee));
                expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(availableToBorrow));
                expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(availableToBorrow));
                expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(availableToBorrow));
                expect(allowanceWETHAfterBorrow).eq(allowanceWETHBeforeBorrow.sub(availableToBorrow));
            }
        });
        it("23. Success (Single-user): Should borrow available amount WETH when availableToBorrow < lendingTokenAmount loanBody > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.constants.MaxUint256;
            {
                {
                    let depositAmount = ethers.utils.parseUnits("50", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseEther("1000");
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await weth.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpWTGInstance.supply({ value: supplyAmount });
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowAmount = (await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                        deployMaster.address,
                        projectToken,
                        lendingToken,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    )).div(2);
                    await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                    await plpWTGInstance.borrow(
                        projectToken,
                        borrowAmount,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            expect(actualLendingToken).to.eq(lendingToken);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);
            let availableToBorrow = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                deployMaster.address,
                projectToken,
                lendingToken,
                priceIds,
                updateData,
                { value: updateFee }
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
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
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

            expect(balanceETHAfterBorrow).eq(balanceETHBeforeBorrow.add(availableToBorrow).sub(transactionFee).sub(updateFee));
            expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(availableToBorrow));
            expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(availableToBorrow));
            expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(availableToBorrow));
            expect(allowanceWETHAfterBorrow).eq(allowanceWETHBeforeBorrow.sub(availableToBorrow));
        });
        it("23. Success (Multi-user): Should borrow available amount WETH when availableToBorrow < lendingTokenAmount loanBody > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.constants.MaxUint256;
            {
                for (let i = 0; i < signers.length; i++) {
                    {
                        let depositAmount = ethers.utils.parseUnits("50", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                    }
                    {
                        let supplyAmount = ethers.utils.parseEther("1000");
                        let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                        await weth.connect(signers[i]).approve(blendingToken, supplyAmount);
                        await plpWTGInstance.connect(signers[i]).supply({ value: supplyAmount });
                    }
                    {
                        let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                        let updateData = await getPriceFeedsUpdateData(priceIds);

                        let borrowAmount = (await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                            signers[i].address,
                            projectToken,
                            lendingToken,
                            priceIds,
                            updateData,
                            { value: updateFee }
                        )).div(2);
                        await weth.connect(signers[i]).approve(plpWTGAddress, borrowAmount);
                        await plpWTGInstance.connect(signers[i]).borrow(
                            projectToken,
                            borrowAmount,
                            priceIds,
                            updateData,
                            { value: updateFee }
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);
                expect(actualLendingToken).to.eq(lendingToken);

                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);
                let availableToBorrow = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                    signers[i].address,
                    projectToken,
                    lendingToken,
                    priceIds,
                    updateData,
                    { value: updateFee }
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
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
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

                expect(balanceETHAfterBorrow).eq(balanceETHBeforeBorrow.add(availableToBorrow).sub(transactionFee).sub(updateFee));
                expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(availableToBorrow));
                expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(availableToBorrow));
                expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(availableToBorrow));
                expect(allowanceWETHAfterBorrow).eq(allowanceWETHBeforeBorrow.sub(availableToBorrow));
            }
        });
        it("24. Success (Single-user): Should borrow 5 WETH when availableToBorrow >= lendingTokenAmount loanBody == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.utils.parseEther("5");
            {
                {
                    let depositAmount = ethers.utils.parseUnits("50", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseEther("1000");
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await weth.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpWTGInstance.supply({ value: supplyAmount });
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);
            let availableToBorrow = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                deployMaster.address,
                projectToken,
                lendingToken,
                priceIds,
                updateData,
                { value: updateFee }
            );
            expect(actualLendingToken).to.eq(ethers.constants.AddressZero);
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
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
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

            expect(balanceETHAfterBorrow).eq(balanceETHBeforeBorrow.add(lendingTokenAmount).sub(transactionFee).sub(updateFee));
            expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(lendingTokenAmount));
            expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(lendingTokenAmount));
            expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(lendingTokenAmount));
            expect(allowanceWETHAfterBorrow).eq(allowanceWETHBeforeBorrow.sub(lendingTokenAmount));
        });
        it("24. Success (Multi-user): Should borrow 5 WETH when availableToBorrow >= lendingTokenAmount loanBody == 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.utils.parseEther("5");
            {
                for (let i = 0; i < signers.length; i++) {
                    {
                        let depositAmount = ethers.utils.parseUnits("50", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                    }
                    {
                        let supplyAmount = ethers.utils.parseEther("1000");
                        let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                        await weth.connect(signers[i]).approve(blendingToken, supplyAmount);
                        await plpWTGInstance.connect(signers[i]).supply({ value: supplyAmount });
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);
                let availableToBorrow = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                    signers[i].address,
                    projectToken,
                    lendingToken,
                    priceIds,
                    updateData,
                    { value: updateFee }
                );

                expect(actualLendingToken).to.eq(ethers.constants.AddressZero);
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
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
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

                expect(balanceETHAfterBorrow).eq(balanceETHBeforeBorrow.add(lendingTokenAmount).sub(transactionFee).sub(updateFee));
                expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(lendingTokenAmount));
                expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(lendingTokenAmount));
                expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(lendingTokenAmount));
                expect(allowanceWETHAfterBorrow).eq(allowanceWETHBeforeBorrow.sub(lendingTokenAmount));
            }
        });
        it("25. Success (Single-user): Should borrow 5 WETH when availableToBorrow >= lendingTokenAmount loanBody > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.utils.parseEther("5");
            {
                {
                    let depositAmount = ethers.utils.parseUnits("50", prj1Decimals);
                    await prj1.mintTo(deployMaster.address, depositAmount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositAmount);
                    await plpInstance.deposit(
                        projectToken,
                        depositAmount
                    );
                }
                {
                    let supplyAmount = ethers.utils.parseEther("1000");
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await weth.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpWTGInstance.supply({ value: supplyAmount });
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowAmount = (await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                        deployMaster.address,
                        projectToken,
                        lendingToken,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    )).div(2);
                    await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                    await plpWTGInstance.borrow(
                        projectToken,
                        borrowAmount,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let actualLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);
            let availableToBorrow = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                deployMaster.address,
                projectToken,
                lendingToken,
                priceIds,
                updateData,
                { value: updateFee }
            );

            expect(actualLendingToken).to.eq(lendingToken);
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
                lendingTokenAmount,
                priceIds,
                updateData,
                { value: updateFee }
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

            expect(balanceETHAfterBorrow).eq(balanceETHBeforeBorrow.add(lendingTokenAmount).sub(transactionFee).sub(updateFee));
            expect(totalOutstandingAfterBorrow).eq(totalOutstandingBeforeBorrow.add(lendingTokenAmount));
            expect(totalBorrowAfterBorrow).eq(totalBorrowBeforeBorrow.add(lendingTokenAmount));
            expect(totalBorrowPerLendingTokenAfterBorrow).eq(totalBorrowPerLendingTokenBeforeBorrow.add(lendingTokenAmount));
            expect(allowanceWETHAfterBorrow).eq(allowanceWETHBeforeBorrow.sub(lendingTokenAmount));
        });
        it("25. Success (Multi-user): Should borrow 5 WETH when availableToBorrow >= lendingTokenAmount loanBody > 0", async function () {
            await loadFixture();

            let projectToken = prj1.address;
            let lendingToken = weth.address;
            let lendingTokenAmount = ethers.utils.parseEther("5");
            {
                for (let i = 0; i < signers.length; i++) {
                    {
                        let depositAmount = ethers.utils.parseUnits("50", prj1Decimals);
                        await prj1.mintTo(signers[i].address, depositAmount);
                        await prj1.connect(signers[i]).approve(plpAddress, depositAmount);
                        await plpInstance.connect(signers[i]).deposit(
                            projectToken,
                            depositAmount
                        );
                    }
                    {
                        let supplyAmount = ethers.utils.parseEther("1000");
                        let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                        await weth.connect(signers[i]).approve(blendingToken, supplyAmount);
                        await plpWTGInstance.connect(signers[i]).supply({ value: supplyAmount });
                    }
                    {
                        let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                        let updateData = await getPriceFeedsUpdateData(priceIds);

                        let borrowAmount = (await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                            signers[i].address,
                            projectToken,
                            lendingToken,
                            priceIds,
                            updateData,
                            { value: updateFee }
                        )).div(2);
                        await weth.connect(signers[i]).approve(plpWTGAddress, borrowAmount);
                        await plpWTGInstance.connect(signers[i]).borrow(
                            projectToken,
                            borrowAmount,
                            priceIds,
                            updateData,
                            { value: updateFee }
                        );
                    }
                }
            }
            for (let i = 0; i < signers.length; i++) {
                let actualLendingToken = await plpInstance.getLendingToken(signers[i].address, projectToken);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);
                let availableToBorrow = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(
                    signers[i].address,
                    projectToken,
                    lendingToken,
                    priceIds,
                    updateData,
                    { value: updateFee }
                );

                expect(actualLendingToken).to.eq(lendingToken);
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
                    lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
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

                expect(balanceETHAfterBorrow).eq(balanceETHBeforeBorrow.add(lendingTokenAmount).sub(transactionFee).sub(updateFee));
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
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.throw;
        });
        it("2. Failure: Should throw error when notionalExposure < 0", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(-1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.throw;
        });
        it("3. Failure: Should throw error when notionalExposure > maxUint256", async function () {
            let lendingToken = usdc.address;
            let exp = ethers.constants.MaxUint256.add(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.throw;
        });
        it("4. Failure: Should throw error when typeof notionalExposure is NOT UINT", async function () {
            let lendingToken = usdc.address;
            let exp = 1.1;
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.throw;
        });
        it("5. Failure: Should throw error when marginCollateralAmount < 0", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(-1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.throw;
        });
        it("6. Failure: Should throw error when marginCollateralAmount > maxUint256", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = ethers.constants.MaxUint256.add(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(0)

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.throw;
        });
        it("7. Failure: Should throw error when typeof marginCollateralAmount is NOT UINT", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = 1.1;
            let buyCalldata = "0x";
            let type = toBN(0);
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.throw;
        });
        it("8. Failure: Should throw error when buyCalldata is NOT BYTES", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "NOT BYTES.";
            let type = toBN(0);
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.throw;
        });
        it("9. Failure: Should throw error when leverageType < 0", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(-1);
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.throw;
        });
        it("10. Failure: Should throw error when leverageType > 255 (uint8)", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(256);
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.throw;
        });
        it("11. Failure: Should throw error when typeof leverageType is NOT UINT", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = 1.1;
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.throw;
        });
        it("12. Failure: Should revert when leverageType > 1", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(2);
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = [];
            let updateFee = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.throw;
        });
        it("13. Failure: Should throw error when priceIds is NOT ARRAY BYTES32", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let addingAmount = toBN(0);
            let priceIds = "Not array bytes32";
            let updateData = [];
            let updateFee = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.throw;
        });
        it("14. Failure: Should throw error when updateData is NOT ARRAY BYTES", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = "Not array bytes";
            let updateFee = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.throw;
        });
        it("15. Failure: Should throw error when updateFee < 0", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = "Not array bytes";
            let updateFee = toBN(-1);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: 0 }
            )).to.throw;
        });
        it("16. Failure: Should throw error when updateFee > maxUint256", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = "Not array bytes";
            let updateFee = ethers.constants.MaxUint256.add(1);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: 0 }
            )).to.throw;
        });
        it("17. Failure: Should throw error when typeof updateFee is NOT UINT", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = "Not array bytes";
            let updateFee = 1.1;

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: 0 }
            )).to.throw;
        });
        it("18. Failure: Should throw error when msg.value < 0", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = "Not array bytes";
            let updateFee = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: toBN(-1) }
            )).to.throw;
        });
        it("19. Failure: Should throw error when msg.value > maxUint256", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = "Not array bytes";
            let updateFee = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: ethers.constants.MaxUint256.add(1) }
            )).to.throw;
        });
        it("20. Failure: Should throw error when typeof msg.value is NOT UINT", async function () {
            let lendingToken = usdc.address;
            let exp = toBN(1);
            let margin = toBN(1);
            let buyCalldata = "0x";
            let type = toBN(0);
            let addingAmount = toBN(0);
            let priceIds = [];
            let updateData = "Not array bytes";
            let updateFee = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: 1.1 }
            )).to.throw;
        });
        it("21. Failure: Should revert when msg.value != addingAmount", async function () {
            let projectToken = weth.address;
            let lendingToken = usdc.address;

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = "0x";
            let type = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee).sub(1) }
            )).to.be.revertedWith("WTG: Invalid value");
        });
        it("22. Failure: Should revert when priceIds.length == 0 and msg.value > 0", async function () {
            let projectToken = weth.address;
            let lendingToken = usdc.address;

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = "0x";
            let type = toBN(0);

            priceIds = [];

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.be.revertedWith("PriceProviderAggregatorPyth: Msg.value!=0!");
        });
        it.skip("23. Failure: Should revert when priceIds.length != updateData.length", async function () {
            let projectToken = weth.address;
            let lendingToken = usdc.address;

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = "0x";
            let type = toBN(0);

            updateData = [];

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.be.revertedWith("PythPriceProvider: Mismatched array sizes!");
        });
        it("24. Failure: Should revert when updateFee != priceIds.length * singleUpdateFeeInWei", async function () {
            let projectToken = weth.address;
            let lendingToken = usdc.address;

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = "0x";
            let type = toBN(0);

            updateFee = toBN(0);

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.be.revertedWith("PythPriceProvider: Incorrect updateFee!");
        });
        it("25. Failure: Should revert when updateData is invalid", async function () {
            let projectToken = weth.address;
            let lendingToken = usdc.address;

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = "0x";
            let type = toBN(0);

            updateData = ["0x", "0x"];

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.be.reverted;
        });
        it("26. Failure: Should revert when notionalExposure == 0", async function () {
            let projectToken = weth.address;
            let lendingToken = usdc.address;

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = "0x";
            let type = toBN(0);

            exp = 0;

            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.be.revertedWith("PITLeverage: Invalid amount");
        });
        it("27. Failure: Should revert when lendingToken != currentLendingToken and currentLendingToken != ZERO ADDRESS", async function () {
            let projectToken = weth.address;
            let lendingToken = usb.address;
            {
                {
                    let depositAmount = ethers.utils.parseEther("1000");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let borrowAmount = ethers.utils.parseUnits("100", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
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
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usbDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = "0x";
            let type = toBN(0);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(currentLendingToken).to.not.eq(lendingToken);
            expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.be.revertedWith("PITLeverage: Invalid lending token");
        });
        it("28. Failure: Should revert when lendingToken == currentLendingToken, isLeveragePosition == FALSE and loadBody > 0", async function () {
            await loadFixture();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            {
                {
                    let depositAmount = ethers.utils.parseEther("1000");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let borrowAmount = ethers.utils.parseUnits("100", usdcDecimals);
                    await usdc.mint(deployMaster.address, borrowAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);

                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
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
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);

            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = "0x";
            let type = toBN(0);

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
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.be.revertedWith("PITLeverage: Invalid position");
        });
        it("29. Failure: Should revert when currentLendingToken == ZERO ADDRESS and marginCollateralAmount < depositedProjectTokenAmount", async function () {
            await loadFixture();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
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
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.revertedWith("PITLeverage: Invalid amount");
        });
        it("30. Failure: Should revert when marginCollateralAmount < depositedProjectTokenAmount and isLeveragePosition == TRUE", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;

            {
                {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.deposit({ value: depositAmount });
                    await weth.connect(deployMaster).deposit({ value: depositAmount.mul(100) });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        0,
                        priceIds,
                        updateData,
                        updateFee,
                        { value: addingAmount.add(updateFee) }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = "0x";
            let type = toBN(0);

            let depositedTokenAmount = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            margin = depositedTokenAmount.sub(1);
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
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.revertedWith("PITLeverage: Invalid amount");
        });
        it("31. Failure: Should revert when buyOnExchangeAggregator fails", async function () {
            await loadFixture();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
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
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = "0x";
            let type = toBN(0);

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
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.be.reverted;
        });
        it.skip("32. Failure: Should revert when isLendingTokenListed == FALSE", async function () {

        });
        it("33. Failure: Should revert when allowance lendingToken < lendingTokenCount and isLeveragePosition == FALSE", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

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
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
        });
        it("34. Failure: Should revert when allowance lendingToken < lendingTokenCount and isLeveragePosition == TRUE", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        updateFee,
                        { value: addingAmount.add(updateFee) }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(500), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount.sub(1));

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
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
        });
        it("35. Failure: Should revert when allowance projectToken < addingAmount and isLeveragePosition == FALSE", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

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
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.be.revertedWith("SafeERC20: low-level call failed");
        });
        it("36. Failure: Should revert when allowance projectToken < addingAmount and isLeveragePosition == TRUE", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);

                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        updateFee,
                        { value: addingAmount.add(updateFee) }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(500), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount.sub(1));
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);

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
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.be.revertedWith("SafeERC20: low-level call failed")
        });
        it("37. Failure: Should revert when totalOutstandingInUSD > pit, isLeveragePosition == FALSE and addingAmount > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);

            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            await pythPriceProviderInstance.updatePrices(priceIds, updateData, { value: updateFee });
            {
                await setLowPrice(wethAddress);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);
                await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                    lendingToken,
                    exp,
                    margin,
                    buyCalldata,
                    type,
                    priceIds,
                    updateData,
                    updateFee,
                    { value: addingAmount.add(updateFee) }
                )).to.be.revertedWith("PITLeverage: LendingTokenAmount exceeds pit remaining");
            }
        });
        it("38. Failure: Should revert when totalOutstandingInUSD > pit, isLeveragePosition == TRUE and addingAmount > 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        updateFee,
                        { value: addingAmount.add(updateFee) }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(500), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);

            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.gt(0);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            await pythPriceProviderInstance.updatePrices(priceIds, updateData, { value: updateFee });
            {
                await setLowPrice(wethAddress);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);
                await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                    lendingToken,
                    exp,
                    margin,
                    buyCalldata,
                    type,
                    priceIds,
                    updateData,
                    updateFee,
                    { value: addingAmount.add(updateFee) }
                )).to.be.revertedWith("PITLeverage: LendingTokenAmount exceeds pit remaining");
            }
        });
        it("39. Failure: Should revert when totalOutstandingInUSD > pit, isLeveragePosition == FALSE and addingAmount == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("10000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

            await plpWTGInstance.deposit({ value: addingAmount });
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);

            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePosition).to.eq(false);
            expect(currentLendingToken).to.eq(ethers.constants.AddressZero);

            await pythPriceProviderInstance.updatePrices(priceIds, updateData, { value: updateFee });
            {
                await setLowPrice(wethAddress);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);
                await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                    lendingToken,
                    exp,
                    margin,
                    buyCalldata,
                    type,
                    priceIds,
                    updateData,
                    updateFee,
                    { value: addingAmount.add(updateFee) }
                )).to.be.revertedWith("PITLeverage: LendingTokenAmount exceeds pit remaining");
            }
        });
        it("40. Failure: Should revert when totalOutstandingInUSD > pit, isLeveragePosition == TRUE and addingAmount == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);

                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        updateFee,
                        { value: addingAmount.add(updateFee) }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(500), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;
            await plpWTGInstance.deposit({ value: addingAmount });
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);

            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
            let isLeveragePosition = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePosition).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            await pythPriceProviderInstance.updatePrices(priceIds, updateData, { value: updateFee });
            {
                await setLowPrice(wethAddress);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);
                await expect(plpWTGInstance.leveragedBorrowWithProjectETH(
                    lendingToken,
                    exp,
                    margin,
                    buyCalldata,
                    type,
                    priceIds,
                    updateData,
                    updateFee,
                    { value: addingAmount.add(updateFee) }
                )).to.be.revertedWith("PITLeverage: LendingTokenAmount exceeds pit remaining");
            }
        });
        it("41. Failure: Should revert when totalBorrowPerCollateral > borrowLimitPerCollateral, isLeveragePosition == FALSE and addingAmount > 0", async function () {

            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    {
                        let depositAmount = ethers.utils.parseEther("10");
                        await plpWTGInstance.deposit({ value: depositAmount });
                    }
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowLimitPerCollateral = await plpInstance.borrowLimitPerCollateral(projectToken);
                    await plpModeratorInstance.setBorrowLimitPerCollateralAsset(
                        weth.address,
                        borrowLimitPerCollateral.div(10000)
                    );
                    borrowLimitPerCollateral = await plpInstance.borrowLimitPerCollateral(projectToken);
                    let lendingTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(lendingToken, borrowLimitPerCollateral, priceIds, updateData, { value: updateFee });
                    let supplyAmount = lendingTokenCount.mul(10000);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let projectTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(prj1.address, borrowLimitPerCollateral, priceIds, updateData, { value: updateFee });
                    await plpWTGInstance.connect(signers[1]).deposit({ value: projectTokenCount });
                    await plpInstance.connect(signers[1]).borrow(
                        weth.address,
                        lendingToken,
                        ethers.constants.MaxUint256,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

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
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.be.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        });
        it("42. Failure: Should revert when totalBorrowPerCollateral > borrowLimitPerCollateral, isLeveragePosition == TRUE and addingAmount > 0", async function () {

            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);

                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        updateFee,
                        { value: addingAmount.add(updateFee) }
                    );
                    await plpModeratorInstance.setBorrowLimitPerCollateralAsset(
                        weth.address,
                        exp
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(500), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);

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
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        });
        it("43. Failure: Should revert when totalBorrowPerCollateral > borrowLimitPerCollateral, isLeveragePosition == FALSE and addingAmount == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    {
                        let depositAmount = ethers.utils.parseEther("10");
                        await plpWTGInstance.deposit({ value: depositAmount });
                    }
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowLimitPerCollateral = await plpInstance.borrowLimitPerCollateral(projectToken);
                    await plpModeratorInstance.setBorrowLimitPerCollateralAsset(
                        weth.address,
                        borrowLimitPerCollateral.div(10000)
                    );
                    borrowLimitPerCollateral = await plpInstance.borrowLimitPerCollateral(projectToken);
                    let lendingTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(lendingToken, borrowLimitPerCollateral, priceIds, updateData, { value: updateFee });
                    let supplyAmount = lendingTokenCount.mul(10000);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);

                    let projectTokenCount = await plpLeverageInstance.callStatic.calculateLendingTokenCountWithUpdatePrices(prj1.address, borrowLimitPerCollateral, priceIds, updateData, { value: updateFee });
                    await plpWTGInstance.connect(signers[1]).deposit({ value: projectTokenCount });
                    await plpInstance.connect(signers[1]).borrow(
                        weth.address,
                        lendingToken,
                        ethers.constants.MaxUint256,
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

            await plpWTGInstance.deposit({ value: addingAmount });
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
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
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.be.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        });
        it("44. Failure: Should revert when totalBorrowPerCollateral > borrowLimitPerCollateral, isLeveragePosition == TRUE and addingAmount == 0", async function () {
            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);

                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        updateFee,
                        { value: addingAmount.add(updateFee) }
                    );
                    await plpModeratorInstance.setBorrowLimitPerCollateralAsset(
                        weth.address,
                        exp
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(500), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

            await plpWTGInstance.deposit({ value: addingAmount });
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);

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
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        });
        it("45. Failure: Should revert when totalBorrowLendingToken > borrowLimitPerLendingToken, isLeveragePosition == FALSE and addingAmount > 0", async function () {

            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    {
                        let depositAmount = ethers.utils.parseEther("10");
                        await plpWTGInstance.deposit({ value: depositAmount });
                    }
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            await plpModeratorInstance.setBorrowLimitPerLendingAsset(
                lendingToken,
                exp.sub(1)
            );
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

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
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.be.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
        });
        it("46. Failure: Should revert when totalBorrowPerLendingToken > borrowLimitPerLendingToken, isLeveragePosition == TRUE and addingAmount > 0", async function () {

            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        updateFee,
                        { value: addingAmount.add(updateFee) }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            await plpModeratorInstance.setBorrowLimitPerLendingAsset(
                usdc.address,
                exp.sub(1)
            );
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(500), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);

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
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
        });
        it("47. Failure: Should revert when totalBorrowLendingToken > borrowLimitPerLendingToken, isLeveragePosition == FALSE and addingAmount == 0", async function () {

            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    {
                        let depositAmount = ethers.utils.parseEther("10");
                        await plpWTGInstance.deposit({ value: depositAmount });
                    }
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            await plpModeratorInstance.setBorrowLimitPerLendingAsset(
                lendingToken,
                exp.sub(1)
            );
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;
            await plpWTGInstance.deposit({ value: addingAmount });
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);

            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
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
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.be.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
        });
        it("48. Failure: Should revert when totalBorrowPerLendingToken > borrowLimitPerLendingToken, isLeveragePosition == TRUE and addingAmount == 0", async function () {

            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("100000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);
                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        updateFee,
                        { value: addingAmount.add(updateFee) }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            await plpModeratorInstance.setBorrowLimitPerLendingAsset(
                usdc.address,
                exp.sub(1)
            );
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(500), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;
            await plpWTGInstance.deposit({ value: addingAmount });
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);

            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);

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
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
            )).to.revertedWith("PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
        });
        it("49. Success (Single-user): Should borrow 50 USDC when isLeveragePosition == FALSE and addingAmount > 0", async function () {

            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

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
            // let totalBorrowPerCollateralBeforeLeverage = await plpInstance.callStatic.getTotalBorrowPerCollateralWithUpdatePrices(projectToken, priceIds, updateData, { value: updateFee });
            let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.callStatic.getTotalBorrowPerLendingTokenWithUpdatePrices(lendingToken, priceIds, updateData, { value: updateFee });
            let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            let tx = await plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
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
            // let totalBorrowPerCollateralAfterLeverage = await plpInstance.callStatic.getTotalBorrowPerCollateralWithUpdatePrices(projectToken, priceIds, updateData, { value: updateFee });
            let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.callStatic.getTotalBorrowPerLendingTokenWithUpdatePrices(lendingToken, priceIds, updateData, { value: updateFee });
            let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(isLeveragePositionAfterLeverage).to.eq(true);
            expect(balanceETHAfterLeverage).to.eq(balanceETHBeforeLeverage.sub(addingAmount).sub(transactionFee).sub(updateFee));
            expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
            expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
            // expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
            expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
            expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
            expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
        });
        it("50. Success (Single-user): Should borrow 50 USDC when isLeveragePosition == TRUE and addingAmount > 0", async function () {

            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);

                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        updateFee,
                        { value: addingAmount.add(updateFee) }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(500), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

            await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);

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
            // let totalBorrowPerCollateralBeforeLeverage = await plpInstance.callStatic.getTotalBorrowPerCollateralWithUpdatePrices(projectToken, priceIds, updateData, { value: updateFee });
            let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.callStatic.getTotalBorrowPerLendingTokenWithUpdatePrices(lendingToken, priceIds, updateData, { value: updateFee });
            let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            let tx = await plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
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
            // let totalBorrowPerCollateralAfterLeverage = await plpInstance.callStatic.getTotalBorrowPerCollateralWithUpdatePrices(projectToken, priceIds, updateData, { value: updateFee });
            let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.callStatic.getTotalBorrowPerLendingTokenWithUpdatePrices(lendingToken, priceIds, updateData, { value: updateFee });
            let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(isLeveragePositionAfterLeverage).to.eq(true);
            expect(balanceETHAfterLeverage).to.eq(balanceETHBeforeLeverage.sub(addingAmount).sub(transactionFee).sub(updateFee));
            expect(allowanceProjectTokenAfterLeverage).to.eq(allowanceProjectTokenBeforeLeverage.sub(addingAmount));
            expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
            expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
            // expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
            expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
            expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
            expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
        });
        it("51. Success (Single-user): Should borrow 50 USDC when isLeveragePosition == FALSE and addingAmount == 0", async function () {

            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;
            await plpWTGInstance.deposit({ value: addingAmount });

            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
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
            // let totalBorrowPerCollateralBeforeLeverage = await plpInstance.callStatic.getTotalBorrowPerCollateralWithUpdatePrices(projectToken, priceIds, updateData, { value: updateFee });
            let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.callStatic.getTotalBorrowPerLendingTokenWithUpdatePrices(lendingToken, priceIds, updateData, { value: updateFee });
            let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            let tx = await plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
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
            // let totalBorrowPerCollateralAfterLeverage = await plpInstance.callStatic.getTotalBorrowPerCollateralWithUpdatePrices(projectToken, priceIds, updateData, { value: updateFee });
            let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.callStatic.getTotalBorrowPerLendingTokenWithUpdatePrices(lendingToken, priceIds, updateData, { value: updateFee });
            let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(isLeveragePositionAfterLeverage).to.eq(true);
            expect(balanceETHAfterLeverage).to.eq(balanceETHBeforeLeverage.sub(addingAmount).sub(transactionFee).sub(updateFee));
            expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
            expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
            // expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
            expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
            expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
            expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
        });
        it("52. Success (Single-user): Should borrow 50 USDC when isLeveragePosition == TRUE and addingAmount == 0", async function () {

            await loadFixtureCanSwapOnOpenOcean();

            let projectToken = weth.address;
            let lendingToken = usdc.address;
            let type = toBN(0);
            {
                {
                    let depositAmount = ethers.utils.parseEther("10");
                    await plpWTGInstance.deposit({ value: depositAmount });
                }
                {
                    let supplyAmount = ethers.utils.parseUnits("1000", usdcDecimals);
                    await setBalance(usdcAddress, deployMaster.address, supplyAmount);
                    let blendingToken = (await plpInstance.lendingTokenInfo(lendingToken)).bLendingToken;
                    await usdc.connect(deployMaster).approve(blendingToken, supplyAmount);
                    await plpInstance.supply(lendingToken, supplyAmount);
                }
                {
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
                    let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
                    let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });
                    let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
                    let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

                    await weth.connect(deployMaster).approve(plpLeverageInstance.address, addingAmount);
                    await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);

                    await plpWTGInstance.leveragedBorrowWithProjectETH(
                        lendingToken,
                        exp,
                        margin,
                        buyCalldata,
                        type,
                        priceIds,
                        updateData,
                        updateFee,
                        { value: addingAmount.add(updateFee) }
                    );
                }
            }
            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
            let updateData = await getPriceFeedsUpdateData(priceIds);

            let borrowUSDCAmount = ethers.utils.parseUnits("50", usdcDecimals);
            let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(lendingToken, borrowUSDCAmount, priceIds, updateData, { value: updateFee });
            let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(projectToken, lendingToken, toBN(500), toBN(10), exp, priceIds, updateData, { value: updateFee });
            let addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            let buyCalldata = configTesting.encodeDataTestingForLeverageWTG;

            await plpWTGInstance.deposit({ value: addingAmount });
            addingAmount = await plpLeverageInstance.calculateAddingAmount(deployMaster.address, projectToken, margin);
            await usdc.connect(deployMaster).approve(plpLeverageInstance.address, borrowUSDCAmount);

            let isLeveragePositionBeforeLeverage = await plpLeverageInstance.isLeveragePosition(deployMaster.address, projectToken);
            let currentLendingToken = await plpInstance.getLendingToken(deployMaster.address, projectToken);

            expect(addingAmount).to.eq(0);
            expect(isLeveragePositionBeforeLeverage).to.eq(true);
            expect(currentLendingToken).to.eq(lendingToken);

            let balanceETHBeforeLeverage = await deployMaster.getBalance();
            let allowanceLendingTokenBeforeLeverage = await usdc.allowance(deployMaster.address, plpLeverageAddress);
            let totalOutstandingBeforeLeverage = await plpInstance.totalOutstanding(deployMaster.address, projectToken, lendingToken);
            let totalBorrowBeforeLeverage = await plpInstance.totalBorrow(projectToken, lendingToken);
            // let totalBorrowPerCollateralBeforeLeverage = await plpInstance.callStatic.getTotalBorrowPerCollateralWithUpdatePrices(projectToken, priceIds, updateData, { value: updateFee });
            let totalBorrowPerLendingTokenBeforeLeverage = await plpInstance.callStatic.getTotalBorrowPerLendingTokenWithUpdatePrices(lendingToken, priceIds, updateData, { value: updateFee });
            let depositedAmountBeforeLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountBeforeLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            let tx = await plpWTGInstance.leveragedBorrowWithProjectETH(
                lendingToken,
                exp,
                margin,
                buyCalldata,
                type,
                priceIds,
                updateData,
                updateFee,
                { value: addingAmount.add(updateFee) }
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
            // let totalBorrowPerCollateralAfterLeverage = await plpInstance.callStatic.getTotalBorrowPerCollateralWithUpdatePrices(projectToken, priceIds, updateData, { value: updateFee });
            let totalBorrowPerLendingTokenAfterLeverage = await plpInstance.callStatic.getTotalBorrowPerLendingTokenWithUpdatePrices(lendingToken, priceIds, updateData, { value: updateFee });
            let depositedAmountAfterLeverage = await plpInstance.getDepositedAmount(projectToken, deployMaster.address);
            let totalDepositedAmountAfterLeverage = await plpInstance.totalDepositedProjectToken(projectToken);

            expect(isLeveragePositionAfterLeverage).to.eq(true);
            expect(balanceETHAfterLeverage).to.eq(balanceETHBeforeLeverage.sub(addingAmount).sub(transactionFee).sub(updateFee));
            expect(allowanceLendingTokenAfterLeverage).to.eq(allowanceLendingTokenBeforeLeverage.sub(borrowUSDCAmount));
            expect(totalOutstandingAfterLeverage).to.eq(totalOutstandingBeforeLeverage.add(borrowUSDCAmount));
            expect(totalBorrowAfterLeverage).to.eq(totalBorrowBeforeLeverage.add(borrowUSDCAmount));
            // expect(totalBorrowPerCollateralAfterLeverage).to.eq(totalBorrowPerCollateralBeforeLeverage.add(exp));
            expect(totalBorrowPerLendingTokenAfterLeverage).to.eq(totalBorrowPerLendingTokenBeforeLeverage.add(exp));
            expect(depositedAmountAfterLeverage).to.eq(depositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
            expect(totalDepositedAmountAfterLeverage).to.eq(totalDepositedAmountBeforeLeverage.add(args.amountReceive).add(addingAmount));
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
            await expect(plpWTGInstance.supply({ value: 0 })).to.be.revertedWith("Invalid amount");
        });

        it("5. Failure: Should revert when isPaused = TRUE", async function () {
            await plpModeratorInstance.setPausedLendingToken(wethAddress, true);

            await expect(plpWTGInstance.supply({ value: ethers.utils.parseEther("100") }))
                .to.be.revertedWith("Token is paused");

            await plpModeratorInstance.setPausedLendingToken(wethAddress, false,);
        });

        it("6. Failure: Should throw error when balance < value", async function () {
            await helpers.setBalance(deployMaster.address, ethers.constants.MaxUint256.div(2));
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
                .to.be.revertedWith("Token is paused");

            await plpModeratorInstance.setPausedLendingToken(wethAddress, false,);
        });

        it("6. Failure: Should revert when bLendingTokenAmount = 0", async function () {
            bLendingTokenAmount = toBN(0);
            await expect(plpWTGInstance.redeem(bLendingTokenAmount)).to.be.revertedWith("BLendingTokenAmount==0");
        });

        it("7. Failure: Should revert when weth balance of bLendingToken < bLendingTokenAmount", async function () {
            balanceOfUserBLendingToken = await bLendingTokenInstance.balanceOf(masterAddress);
            bLendingTokenAmount = balanceOfUserBLendingToken.add(toBN(100));

            await expect(plpWTGInstance.redeem(bLendingTokenAmount)).to.be.revertedWith("RedeemError!=0. redeem>=supply.");
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
                .to.be.revertedWith("Token is paused");

            await plpModeratorInstance.setPausedLendingToken(wethAddress, false,);
        });

        it("6. Failure: Should revert when lendingTokenAmount == 0", async function () {
            lendingTokenAmount = toBN(0);
            await expect(plpWTGInstance.redeemUnderlying(lendingTokenAmount)).to.be.revertedWith("Invalid amount");
        });

        it("7. Failure: Should revert when weth balance of lendingToken < lendingTokenAmount", async function () {
            balanceOfBLendingToken = await weth.balanceOf(bLendingTokenAddress);
            lendingTokenAmount = balanceOfBLendingToken.add(toBN(100));
            await expect(plpWTGInstance.redeemUnderlying(lendingTokenAmount)).to.be.revertedWith("Redeem>=supply");
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
            )).to.be.revertedWith("Prj token isn't listed");
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
            )).to.be.revertedWith("Invalid amount");
        });

        it("10. Failure: Should revert when lendingTokenAmount = 0", async function () {
            lendingTokenAmount = ethers.utils.parseEther("0");
            await expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: lendingTokenAmount }
            )).to.be.revertedWith("Invalid amount");
        });

        it("11. Failure: Should revert when borrowPositionAmount = 0", async function () {
            lendingTokenAmount = ethers.utils.parseEther("100");
            await expect(plpWTGInstance.repay(
                prj1Address,
                lendingTokenAmount,
                { value: lendingTokenAmount }
            )).to.be.revertedWith("Invalid amount");
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
                        let supplyAmount = ethers.utils.parseEther("100000000000"); //1000 eth
                        await weth.connect(deployMaster).approve(bLendingTokenAddress, supplyAmount);
                        await plpWTGInstance.supply({ value: supplyAmount });
                    }
                    {
                        // borrow prj1
                        let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, wethAddress], timeBeforeExpiration);
                        let updateData = await getPriceFeedsUpdateData(priceIds);

                        let borrowAmount = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(masterAddress, prj1Address, wethAddress, priceIds, updateData, { value: updateFee });
                        await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                        await plpWTGInstance.borrow(prj1Address, borrowAmount, priceIds, updateData, { value: updateFee });
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
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj2Address, wethAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowAmount = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(masterAddress, prj2Address, wethAddress, priceIds, updateData, { value: updateFee });
                    await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                    await plpWTGInstance.borrow(prj2Address, borrowAmount, priceIds, updateData, { value: updateFee });
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
                await loadFixtureCanSwapOnOpenOcean();
                {
                    {
                        // deposit prj1 and prj2
                        let depositPrj1Amount = ethers.utils.parseUnits("1", prj1Decimals);
                        await setBalance(prj1Address, deployMaster.address, ethers.constants.MaxUint256)
                        await prj1.connect(deployMaster).approve(plpAddress, depositPrj1Amount);
                        await plpInstance.deposit(prj1Address, depositPrj1Amount);

                        let depositPrj2Amount = ethers.utils.parseUnits("100000", prj2Decimals);
                        await prj2.mintTo(masterAddress, depositPrj2Amount.mul(10));
                        await prj2.connect(deployMaster).approve(plpAddress, depositPrj2Amount);
                        await plpInstance.deposit(prj2Address, depositPrj2Amount);
                    }
                    {
                        // supply weth token
                        let supplyAmount = ethers.utils.parseEther("10000000000000"); //1000 eth
                        await weth.connect(deployMaster).approve(bLendingTokenAddress, supplyAmount);
                        await plpWTGInstance.supply({ value: supplyAmount });
                    }
                    {
                        let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, wethAddress], timeBeforeExpiration);
                        let updateData = await getPriceFeedsUpdateData(priceIds);

                        let borrowETHAmount = ethers.utils.parseEther("5");
                        let exp = await plpInstance.callStatic.getTokenEvaluationWithUpdatePrices(wethAddress, borrowETHAmount, priceIds, updateData, { value: updateFee });
                        let margin = await plpLeverageInstance.callStatic.calculateMarginWithUpdatePrices(prj1Address, wethAddress, toBN(50), toBN(10), exp, priceIds, updateData, { value: updateFee });

                        await prj1.connect(deployMaster).approve(plpLeverageInstance.address, ethers.constants.MaxUint256);
                        await weth.connect(deployMaster).approve(plpLeverageInstance.address, borrowETHAmount);
                        let buyCalldata = configTesting.encodeDataTestingForBorrowWTG;
                        await plpLeverageInstance.leveragedBorrow(
                            prj1Address,
                            wethAddress,
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
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj2Address, wethAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);

                    let borrowAmount = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(masterAddress, prj2Address, wethAddress, priceIds, updateData, { value: updateFee });
                    await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                    await plpWTGInstance.borrow(prj2Address, borrowAmount, priceIds, updateData, { value: updateFee });
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

        describe("Liquidate with invalid input", async function () {
            before(async function () {
                await loadFixture();
            });

            it("1. Failure: Should throw error when account is invalid", async function () {
                account = "Not Address.";
                lendingTokenAmount = ethers.utils.parseEther("100");
                value = ethers.utils.parseEther("100");
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpWTGInstance.liquidateWithLendingETH(
                    account, prj1Address, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee,
                    { value: value.add(updateFee) }
                )).to.throw;
            });

            it("2. Failure: Should throw error when projectToken is invalid", async function () {
                projectTokenAddress = "Not Address.";
                lendingTokenAmount = ethers.utils.parseEther("100");
                value = ethers.utils.parseEther("100");
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, projectTokenAddress, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee,
                    { value: value.add(updateFee) }
                )).to.throw;
            });

            it("3. Failure: Should throw error when lendingTokenAmount < 0", async function () {
                lendingTokenAmount = -1;
                value = ethers.utils.parseEther("100");
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee,
                    { value: value.add(updateFee) }
                )).to.throw;
            });

            it("4. Failure: Should throw error when lendingTokenAmount > maxUint256", async function () {
                lendingTokenAmount = ethers.constants.MaxUint256.add(toBN(1));
                value = ethers.utils.parseEther("100");
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee,
                    { value: value.add(updateFee) }
                )).to.throw;
            });

            it("5. Failure: Should throw error when lendingTokenAmount is not uint", async function () {
                lendingTokenAmount = 1.1;
                value = ethers.utils.parseEther("100");
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee,
                    { value: value.add(updateFee) }
                )).to.throw;
            });

            it("6. Failure: Should throw error when priceIds is NOT ARRAY BYTES32", async function () {
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                value = ethers.utils.parseEther("100");
                let priceIds = "Not array bytes32";
                let updateData = [];
                let updateFee = 0;

                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee,
                    { value: value.add(updateFee) }
                )).to.throw;
            });

            it("7. Failure: Should throw error when updateData is NOT ARRAY BYTES", async function () {
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                value = ethers.utils.parseEther("100");
                let priceIds = [];
                let updateData = "Not array bytes";
                let updateFee = 0;

                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee,
                    { value: value.add(updateFee) }
                )).to.throw;
            });

            it("8. Failure: Should throw error when updateFee < 0", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                value = toBN(0);
                let priceIds = [];
                let updateData = [];
                let updateFee = -1;

                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee,
                    { value }
                )).to.throw;
            });

            it("9. Failure: Should throw error when updateFee > maxUint256", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                value = 0;
                let priceIds = [];
                let updateData = [];
                let updateFee = ethers.constants.MaxUint256.add(toBN(1));

                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee,
                    { value }
                )).to.throw;
            });

            it("10. Failure: Should throw error when typeof updateFee is NOT UINT", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                let value = 0;
                let priceIds = [];
                let updateData = [];
                let updateFee = 1.1;

                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee,
                    { value }
                )).to.throw;
            });

            it("11. Failure: Should throw error when value < 0", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                value = toBN(-1);
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee,
                    { value: value.add(updateFee) }
                )).to.throw;
            });

            it("12. Failure: Should throw error when value > maxUint256", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                value = ethers.constants.MaxUint256.add(toBN(1));
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee,
                    { value: value.add(updateFee) }
                )).to.throw;
            });

            it("13. Failure: Should throw error when typeof msg.value is NOT UINT", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                let value = 1.1;
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee,
                    { value }
                )).to.throw;
            });

            it("14. Failure: Should revert when priceIds.length == 0 and msg.value > 0", async function () {
                let projectToken = prj1.address;
                let lendingTokenAmount = ethers.utils.parseEther("100");
                let priceIds = [];
                let updateData = [];
                let updateFee = toBN(1);

                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, projectToken, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee,
                    { value: lendingTokenAmount.add(updateFee) }
                )).to.be.revertedWith("PriceProviderAggregatorPyth: Msg.value!=0!");
            });

            it.skip("15. Failure: Should revert when priceIds.length != updateData.length", async function () {
                let projectToken = prj1.address;
                let lendingToken = weth.address;
                let lendingTokenAmount = ethers.utils.parseEther("100");
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = [];

                expect(priceIds).to.not.eq(updateData.length);
                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee,
                    { value: lendingTokenAmount.add(updateFee) }
                )).to.be.revertedWith("PythPriceProvider: Mismatched array sizes!");
            });

            it("16. Failure: Should revert when updateFee != priceIds.length * singleUpdateFeeInWei", async function () {
                let projectToken = prj1.address;
                let lendingToken = weth.address;
                let lendingTokenAmount = ethers.utils.parseEther("100");
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                expect(priceIds.length).to.gt(0);
                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee.sub(1),
                    { value: lendingTokenAmount.add(updateFee).sub(1) }
                )).to.be.revertedWith("PythPriceProvider: Incorrect updateFee!");
            });

            it("17. Failure: Should revert when updateData is invalid", async function () {
                let projectToken = prj1.address;
                let lendingToken = weth.address;
                let lendingTokenAmount = ethers.utils.parseEther("100");
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = ["0x"];

                expect(priceIds.length).to.gt(0);
                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee,
                    { value: lendingTokenAmount.add(updateFee) }
                )).to.be.reverted;
            });

            it("18. Failure: Should throw error when lendingTokenAmount = 0", async function () {
                lendingTokenAmount = toBN(0);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, wethAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);
                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds,
                    updateData,
                    updateFee,
                    { value: lendingTokenAmount.add(updateFee) }
                )).to.throw;
            });

            it("19. Failure: Should revert when isProjectTokenListed = FALSE", async function () {
                projectTokenAddress = ethers.constants.AddressZero;
                lendingTokenAmount = ethers.utils.parseEther("100");
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([wethAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds)

                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, projectTokenAddress, lendingTokenAmount,
                    priceIds, updateData, updateFee,
                    { value: lendingTokenAmount.add(updateFee) }
                )).to.be.revertedWith("PITLiquidation: Project token is not listed");
            });

            it("20. Failure: Should revert when value < lendingTokenAmount", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, wethAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds, updateData, updateFee,
                    { value: lendingTokenAmount }
                )).to.be.revertedWith("WTG: invalid value");
            });

            it("21. Failure: Should revert when value > lendingTokenAmount", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, wethAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds, updateData, updateFee,
                    { value: lendingTokenAmount.add(updateFee).add(1) }
                )).to.be.revertedWith("WTG: invalid value");
            });

            it("22. Failure: Should revert when HF >= 1", async function () {
                lendingTokenAmount = ethers.utils.parseEther("100");
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, wethAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds, updateData, updateFee,
                    { value: lendingTokenAmount.add(updateFee) }
                )).to.be.revertedWith("PITLiquidation: HealthFactor>=1");
            });
        });
        describe("Liquidate when HF < 1", async function () {

            let bLendingTokenAddress;

            before(async function () {
                await loadFixture();
                {
                    {
                        // deposit prj1
                        let depositPrj1Amount = ethers.utils.parseUnits("10", prj1Decimals); // 100 prj1
                        await prj1.mintTo(masterAddress, depositPrj1Amount);
                        await prj1.connect(deployMaster).approve(plpAddress, depositPrj1Amount);
                        await plpInstance.deposit(prj1Address, depositPrj1Amount);
                    }
                    {
                        // supply weth token
                        let supplyAmount = ethers.utils.parseEther("1000"); //1000 eth
                        bLendingTokenAddress = (await plpInstance.lendingTokenInfo(wethAddress)).bLendingToken;
                        await weth.connect(deployMaster).approve(bLendingTokenAddress, supplyAmount);
                        await plpWTGInstance.supply({ value: supplyAmount });
                    }
                    {
                        // borrow weth
                        let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, wethAddress], timeBeforeExpiration);
                        let updateData = await getPriceFeedsUpdateData(priceIds);

                        let borrowAmount = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(masterAddress, prj1Address, wethAddress, priceIds, updateData, { value: updateFee });
                        await weth.connect(deployMaster).approve(plpWTGAddress, borrowAmount);
                        await plpWTGInstance.borrow(prj1Address, borrowAmount, priceIds, updateData, { value: updateFee });

                        // check HF and liquidation amount
                        {
                            await setLowPrice(prj1Address);
                            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, wethAddress], timeBeforeExpiration);
                            let updateData = await getPriceFeedsUpdateData(priceIds);
                            let currentHealthFactor = await plpLiquidationInstance.callStatic.getCurrentHealthFactorWithUpdatePrices(masterAddress, prj1Address, wethAddress, priceIds, updateData, { value: updateFee });
                            let liquidationAmount = await plpLiquidationInstance.callStatic.getLiquidationAmountWithUpdatePrices(masterAddress, prj1Address, wethAddress, priceIds, updateData, { value: updateFee });

                            healthFactorNumerator = currentHealthFactor.healthFactorNumerator;
                            healthFactorDenominator = currentHealthFactor.healthFactorDenominator;
                            maxLA = liquidationAmount.maxLA;
                            minLA = liquidationAmount.minLA;
                        }
                    }
                }
            });

            it("23. Failure: Should revert when lendingTokenAmount < minLA", async function () {
                lendingTokenAmount = minLA.sub(toBN(1));
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, wethAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds, updateData, updateFee,
                    { value: lendingTokenAmount.add(updateFee) }
                )).to.be.revertedWith("PITLiquidation: Invalid amount");
            });

            it("24. Failure: Should revert when lendingTokenAmount > maxLA", async function () {
                lendingTokenAmount = maxLA.add(toBN(1));
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, wethAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds, updateData, updateFee,
                    { value: lendingTokenAmount.add(updateFee) }
                )).to.be.revertedWith("PITLiquidation: Invalid amount");
            });

            it("26. Failure: Should throw error when allowance < lendingTokenAmount", async function () {
                lendingTokenAmount = minLA.add(toBN(100));
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, wethAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                expect(plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds, updateData, updateFee,
                    { value: lendingTokenAmount.add(updateFee) }
                )).to.throw;
            });

            it("26. Success: Should liquidate successfully", async function () {
                lendingTokenAmount = minLA.add(toBN(100));
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, wethAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                weth.connect(deployMaster).approve(bLendingTokenAddress, lendingTokenAmount);

                let masterEthBalanceBeforeLiquidateLendingETH = await hre.ethers.provider.getBalance(masterAddress);
                let wethBalanceBeforeLiquidateLendingETH = await hre.ethers.provider.getBalance(wethAddress);
                let balanceWETHOfBLendingTokenBeforeLiquidateLendingETH = await weth.balanceOf(bLendingTokenAddress);
                let totalBorrowedWethTokenBeforeLiquidateLendingETH = await plpInstance.totalBorrowPerLendingToken(wethAddress);
                let totalBorrowPrj1BeforeLiquidateLendingETH = await plpInstance.totalBorrow(prj1Address, wethAddress);

                await (plpWTGInstance.liquidateWithLendingETH(
                    masterAddress, prj1Address, lendingTokenAmount,
                    priceIds, updateData, updateFee,
                    { value: lendingTokenAmount.add(updateFee) }
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

        describe("Liquidate with invalid input", async function () {
            before(async function () {
                await loadFixture();
            });

            it("1. Failure: Should throw error when account is invalid", async function () {
                account = "Not Address.";
                lendingTokenAmount = ethers.utils.parseUnits("100", usdcDecimals);
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpWTGInstance.liquidateWithProjectETH(account, usdcAddress, lendingTokenAmount, priceIds, updateData, { value: updateFee })).to.throw;
            });

            it("2. Failure: Should throw error when lendingToken is invalid", async function () {
                lendingToken = "Not Address.";
                lendingTokenAmount = ethers.utils.parseEther("100");
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpWTGInstance.liquidateWithProjectETH(masterAddress, lendingToken, lendingTokenAmount, priceIds, updateData, { value: updateFee })).to.throw;
            });

            it("3. Failure: Should throw error when lendingTokenAmount < 0", async function () {
                lendingTokenAmount = -1;
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpWTGInstance.liquidateWithProjectETH(masterAddress, usdcAddress, lendingTokenAmount, priceIds, updateData, { value: updateFee })).to.throw;
            });

            it("4. Failure: Should throw error when lendingTokenAmount > maxUint256", async function () {
                lendingTokenAmount = ethers.constants.MaxUint256.add(toBN(1));
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpWTGInstance.liquidateWithProjectETH(masterAddress, usdcAddress, lendingTokenAmount, priceIds, updateData, { value: updateFee })).to.throw;
            });

            it("5. Failure: Should throw error when lendingTokenAmount is not uint", async function () {
                lendingTokenAmount = 1.1;
                let priceIds = [];
                let updateData = [];
                let updateFee = 0;

                expect(plpWTGInstance.liquidateWithProjectETH(masterAddress, usdcAddress, lendingTokenAmount, priceIds, updateData, { value: updateFee })).to.throw;
            });

            it("6. Failure: Should throw error when priceIds is NOT ARRAY BYTES32", async function () {
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                let priceIds = "Not array bytes32";
                let updateData = [];
                let updateFee = 0;

                expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.throw;
            });

            it("7. Failure: Should throw error when updateData is NOT ARRAY BYTES", async function () {
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                let priceIds = [];
                let updateData = "Not array bytes";
                let updateFee = 0;

                expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.throw;
            });

            it("8. Failure: Should throw error when value < 0", async function () {
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                let priceIds = [];
                let updateData = [];
                let updateFee = toBN(-1);

                expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.throw;
            });

            it("9. Failure: Should throw error when value > maxUint256", async function () {
                lendingTokenAmount = ethers.utils.parseUnits("10", usdcDecimals);
                let priceIds = [];
                let updateData = [];
                let updateFee = ethers.constants.MaxUint256;

                expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.throw;
            });

            it("10. Failure: Should throw error when typeof msg.value is NOT UINT", async function () {
                lendingTokenAmount = ethers.utils.parseUnits("100", usdcDecimals);
                let priceIds = [];
                let updateData = [];
                let updateFee = 1.1;

                expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.throw;
            });

            it("11. Failure: Should revert when priceIds.length == 0 and msg.value > 0", async function () {
                lendingTokenAmount = ethers.utils.parseUnits("100", usdcDecimals);
                let priceIds = [];
                let updateData = [];
                let updateFee = 1;

                await expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.revertedWith("PriceProviderAggregatorPyth: Msg.value!=0!");
            });

            it.skip("12. Failure: Should revert when priceIds.length != updateData.length", async function () {
                let projectToken = weth.address;
                let lendingToken = usdc.address;
                let lendingTokenAmount = ethers.utils.parseUnits("100", usdcDecimals);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = [];

                expect(priceIds).to.not.eq(updateData.length);
                await expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.revertedWith("PythPriceProvider: Mismatched array sizes!");
            });

            it("13. Failure: Should revert when updateFee != priceIds.length * singleUpdateFeeInWei", async function () {
                let projectToken = weth.address;
                let lendingToken = usdc.address;
                let lendingTokenAmount = ethers.utils.parseUnits("100", usdcDecimals);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                expect(priceIds.length).to.gt(0);
                await expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee.sub(1) }
                )).to.be.revertedWith("PythPriceProvider: Incorrect updateFee!");
            });

            it("14. Failure: Should revert when updateData is invalid", async function () {
                let projectToken = weth.address;
                let lendingToken = usdc.address;
                let lendingTokenAmount = ethers.utils.parseUnits("100", usdcDecimals);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([projectToken, lendingToken], timeBeforeExpiration);
                let updateData = ["0x"];

                expect(priceIds.length).to.gt(0);
                await expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount,
                    priceIds,
                    updateData,
                    { value: updateFee }
                )).to.be.reverted;
            });

            it("15. Failure: Should throw error when lendingTokenAmount = 0", async function () {
                lendingTokenAmount = 0;
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([wethAddress, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount,
                    priceIds, updateData, { value: updateFee }
                )).to.be.revertedWith("PITLiquidation: LendingTokenAmount must be greater than 0");
            });

            it("16. Failure: Should revert when isLendingTokenList = FALSE", async function () {
                lendingToken = ethers.constants.AddressZero;
                lendingTokenAmount = ethers.utils.parseEther("100");
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([wethAddress, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, lendingToken, lendingTokenAmount,
                    priceIds, updateData, { value: updateFee }
                )).to.be.revertedWith("PITLiquidation: Lending token is not listed");
            });

            it("17. Failure: Should revert when HF >= 1", async function () {
                lendingTokenAmount = ethers.utils.parseUnits("100", usdcDecimals);
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([wethAddress, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount,
                    priceIds, updateData, { value: updateFee }
                )).to.be.revertedWith("PITLiquidation: HealthFactor>=1");
            });
        });

        describe("Liquidate when HF < 1", async function () {
            before(async function () {
                await loadFixture();
                {
                    {
                        isLeveragePosition = await plpLeverageInstance.isLeveragePosition(masterAddress, prj1Address);
                    }
                    {
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
                        let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([wethAddress, usdcAddress], timeBeforeExpiration);
                        let updateData = await getPriceFeedsUpdateData(priceIds);

                        let borrowAmount = await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(masterAddress, wethAddress, usdcAddress, priceIds, updateData, { value: updateFee });
                        await plpInstance.borrow(wethAddress, usdcAddress, borrowAmount, priceIds, updateData, { value: updateFee });

                        // check HF and liquidation amount
                        {
                            await setLowPrice(wethAddress);

                            let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([wethAddress, usdcAddress], timeBeforeExpiration);
                            let updateData = await getPriceFeedsUpdateData(priceIds);

                            let currentHealthFactor = await plpLiquidationInstance.callStatic.getCurrentHealthFactorWithUpdatePrices(masterAddress, wethAddress, usdcAddress, priceIds, updateData, { value: updateFee });
                            let liquidationAmount = await plpLiquidationInstance.callStatic.getLiquidationAmountWithUpdatePrices(masterAddress, wethAddress, usdcAddress, priceIds, updateData, { value: updateFee });

                            healthFactorNumerator = currentHealthFactor.healthFactorNumerator;
                            healthFactorDenominator = currentHealthFactor.healthFactorDenominator;
                            maxLA = liquidationAmount.maxLA;
                            minLA = liquidationAmount.minLA;
                        }
                    }
                }
            });

            it("18. Failure: Should revert when lendingTokenAmount < minLA", async function () {
                lendingTokenAmount = minLA.sub(toBN(1));
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([wethAddress, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount,
                    priceIds, updateData, { value: updateFee }
                )).to.be.revertedWith("PITLiquidation: Invalid amount");
            });

            it("19. Failure: Should revert when lendingTokenAmount > maxLA", async function () {
                lendingTokenAmount = maxLA.add(toBN(1));
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([wethAddress, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount,
                    priceIds, updateData, { value: updateFee }
                )).to.be.revertedWith("PITLiquidation: Invalid amount");
            });

            it("20. Failure: Should revert when allowance < lendingTokenAmount", async function () {
                lendingTokenAmount = minLA.add(toBN(100));
                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([wethAddress, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount,
                    priceIds, updateData, { value: updateFee }
                )).to.be.revertedWith("ERC20: insufficient allowance");
            });

            it("21. Success: Should liquidate successfully", async function () {
                bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                lendingTokenAmount = minLA.add(toBN(100));

                usdc.connect(deployMaster).approve(bLendingTokenAddress, ethers.utils.parseEther("10000000"));
                weth.connect(deployMaster).approve(plpWTGAddress, ethers.utils.parseEther("10000000"));

                let balanceProjectTokenBeforeLiquidate = await usdc.balanceOf(bLendingTokenAddress);
                let totalBorrowedUsdcTokenBeforeLiquidate = await plpInstance.totalBorrowPerLendingToken(usdcAddress);
                let totalBorrowWethBeforeLiquidate = await plpInstance.totalBorrow(wethAddress, usdcAddress);
                let ethBalanceuUserBeforeLiquidate = await hre.ethers.provider.getBalance(masterAddress);
                let ethBalanceWethBeforeLiquidate = await hre.ethers.provider.getBalance(wethAddress);

                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([wethAddress, usdcAddress], timeBeforeExpiration);
                let updateData = await getPriceFeedsUpdateData(priceIds);

                await plpWTGInstance.liquidateWithProjectETH(masterAddress, usdcAddress, lendingTokenAmount, priceIds, updateData, { value: updateFee });

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

            it("22. Failure: Should revert when balance user < lendingTokenAmount", async function () {
                bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
                lendingTokenAmount = minLA.add(toBN(100));

                let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([wethAddress, usdcAddress], timeBeforeExpiration);
                let updateData = [];
                if (priceIds.length > 0) updateData = await getPriceFeedsUpdateData(priceIds);

                usdc.connect(deployMaster).approve(bLendingTokenAddress, ethers.utils.parseEther("10000000"));
                weth.connect(deployMaster).approve(plpWTGAddress, ethers.utils.parseEther("10000000"));
                usdc.connect(deployMaster).transfer(bLendingTokenAddress, await usdc.balanceOf(masterAddress));

                await expect(plpWTGInstance.liquidateWithProjectETH(
                    masterAddress, usdcAddress, lendingTokenAmount,
                    priceIds, updateData, { value: updateFee }
                )).to.be.revertedWith("ERC20: transfer amount exceeds balance");
            });
        });
    });
});