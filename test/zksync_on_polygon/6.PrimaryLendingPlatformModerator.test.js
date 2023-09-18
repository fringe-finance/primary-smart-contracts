require("dotenv").config();
const chainConfigs = require('../../chain.config');
const chainConfig = chainConfigs[chainConfigs.chain];
const hre = require("hardhat");
const path = require("path");
const configTestingFile = path.join(__dirname, `../../scripts/config/hardhat_zksync_on_polygon_mainnet/config_testing.json`);
const configTesting = require(configTestingFile);
const { deployment } = require("../../scripts/deployPLP_V2/deploymentPLP");
const { ethers } = require("ethers");
const { expect } = require("chai");
const { deploymentMockToken } = require("../../scripts/deployPLP_V2/deploymentMockToken");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { getPriceFeedsUpdateData } = require("./utils/utilities");

const INFURA_KEY = process.env.INFURA_KEY;

const toBN = (num) => hre.ethers.BigNumber.from(num);

describe("PrimaryLendingPlatformModerator", function () {
    this.timeout(86400000);

    let signers;
    let firstSigner;
    let deployMaster;
    let addresses;

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
    let firstSignerAddress;
    let MockToken;

    let bLendingTokenAddress;
    let bLendingTokenInstance;


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
        firstSigner = signers[1];

        {
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
            priceProviderAggregatorAddress = addresses.priceProviderAggregatorAddress;

            prj1Address = ethers.utils.getAddress(addresses.projectTokens[0]);
            prj2Address = ethers.utils.getAddress(addresses.projectTokens[1]);
            prj3Address = ethers.utils.getAddress(addresses.projectTokens[2]);

            wstEthAddress = ethers.utils.getAddress(addresses.projectTokens[projectTokens.length - 1]);

            usdcAddress = ethers.utils.getAddress(addresses.lendingTokens[0]);
            usbAddress = ethers.utils.getAddress(addresses.lendingTokens[1]);
            wethAddress = ethers.utils.getAddress(addresses.lendingTokens[2]);

            masterAddress = deployMaster.address;
            firstSignerAddress = firstSigner.address;
        }
        {
            let PLP = await hre.ethers.getContractFactory("PrimaryLendingPlatformV2Zksync");
            let PLPAtomicRepay = await hre.ethers.getContractFactory("PrimaryLendingPlatformAtomicRepaymentZksync");
            let PLPLeverage = await hre.ethers.getContractFactory("PrimaryLendingPlatformLeverageZksync");
            let PLPLiquidation = await hre.ethers.getContractFactory("PrimaryLendingPlatformLiquidationZksync");
            let PLPWTG = await hre.ethers.getContractFactory("PrimaryLendingPlatformWrappedTokenGatewayZksync");
            let PLPModerator = await hre.ethers.getContractFactory("PrimaryLendingPlatformModerator");
            let ChainlinkPriceProvider = await hre.ethers.getContractFactory("ChainlinkPriceProvider");
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
        {
            bLendingTokenAddress = (await plpInstance.lendingTokenInfo(usdcAddress)).bLendingToken;
            bLendingTokenInstance = MockToken.attach(bLendingTokenAddress).connect(deployMaster);
        }
    }

    let ADMIN_BYTES_32;
    let MODERATOR_BYTES_32;

    let projectTokenId;
    let projectTokenAddress;

    let lendingTokenId;
    let lendingTokenAddress;

    let numerator;
    let denominator;

    describe("admin functions", async function () {
        before(async function () {
            await loadFixture();
            ADMIN_BYTES_32 = await plpModeratorInstance.DEFAULT_ADMIN_ROLE();
            MODERATOR_BYTES_32 = await plpModeratorInstance.MODERATOR_ROLE();
        });

        describe("grandModerator", async function () {
            before(async function () {
                await loadFixture();
            });

            it('1. Failure: Should revert when sender is not admin', async () => {
                await expect(plpModeratorInstance.connect(firstSigner).grandModerator(firstSignerAddress))
                    .to.be.revertedWith("PITModerator: Caller is not the Admin'");
            });

            it('2.1. Failure: Should throw error when newModerator is invalid address', async () => {
                newModerator = "Not address";
                expect(plpModeratorInstance.grandModerator(newModerator))
                    .to.throw;
            });

            it('2.2. Failure: Should revert when newModerator is address zero', async () => {
                newModerator = ethers.constants.AddressZero;
                await expect(plpModeratorInstance.grandModerator(newModerator))
                    .to.be.revertedWith("PITModerator: Invalid address");
            });

            it('3. Success: Should grant the moderator role to newModerator successfully', async () => {
                await expect(plpModeratorInstance.grandModerator(firstSignerAddress))
                    .to.be.emit(plpModeratorInstance, "GrandModerator").withArgs(firstSignerAddress);

                expect(await plpModeratorInstance.hasRole(MODERATOR_BYTES_32, firstSignerAddress)).to.be.equal(true);
            });
        });

        describe("revokeModerator", async function () {
            before(async function () {
                await loadFixture();
            });

            it('1. Failure: Should revert when sender is not admin', async () => {
                await expect(plpModeratorInstance.connect(firstSigner).revokeModerator(firstSignerAddress))
                    .to.be.revertedWith("PITModerator: Caller is not the Admin'");
            });

            it('2.1. Failure: Should throw error when moderator is invalid address', async () => {
                moderator = "Not address";
                expect(plpModeratorInstance.revokeModerator(moderator))
                    .to.throw;
            });

            it('2.2. Failure: Should revert when moderator is address zero', async () => {
                moderator = ethers.constants.AddressZero;
                await expect(plpModeratorInstance.revokeModerator(moderator))
                    .to.be.revertedWith("PITModerator: Invalid address");
            });

            it('3. Success: Should revoke moderator successfully', async () => {
                await plpModeratorInstance.grandModerator(firstSignerAddress);

                await expect(plpModeratorInstance.revokeModerator(firstSignerAddress))
                    .to.be.emit(plpModeratorInstance, "RevokeModerator").withArgs(firstSignerAddress);

                expect(await plpModeratorInstance.hasRole(MODERATOR_BYTES_32, firstSignerAddress)).to.be.equal(false);
            });
        });

        describe("transferAdminRole", async function () {
            before(async function () {
                await loadFixture();
            });

            it('1. Failure: Should revert when sender is not admin', async () => {
                await expect(plpModeratorInstance.connect(firstSigner).transferAdminRole(firstSignerAddress))
                    .to.be.revertedWith("PITModerator: Caller is not the Admin'");
            });

            it('2.1. Failure: Should throw error when newAdmin is invalid address', async () => {
                newAdmin = "Not address";
                expect(plpModeratorInstance.transferAdminRole(newAdmin))
                    .to.throw;
            });

            it('2.2. Failure: Should revert when newAdmin is address zero', async () => {
                newAdmin = ethers.constants.AddressZero;
                await expect(plpModeratorInstance.transferAdminRole(newAdmin))
                    .to.be.revertedWith("PITModerator: Invalid newAdmin");
            });

            it('3. Success: Should transfer admin role to newAdmin successfully', async () => {
                newAdmin = firstSignerAddress;
                await plpModeratorInstance.transferAdminRole(firstSignerAddress);

                expect(await plpModeratorInstance.hasRole(ADMIN_BYTES_32, masterAddress)).to.be.equal(false);
                expect(await plpModeratorInstance.hasRole(ADMIN_BYTES_32, firstSignerAddress)).to.be.equal(true);
            });
        });

        describe("transferAdminRoleForPIT", async function () {
            before(async function () {
                await loadFixture();
            });

            it('1. Failure: Should revert when sender is not admin', async () => {
                await expect(plpModeratorInstance.connect(firstSigner)
                    .transferAdminRoleForPIT(masterAddress, firstSignerAddress))
                    .to.be.revertedWith("PITModerator: Caller is not the Admin'");
            });

            it('2.1. Failure: Should throw error when newAdmin is invalid address', async () => {
                newAdmin = "Not address";
                expect(plpModeratorInstance.transferAdminRoleForPIT(masterAddress, newAdmin))
                    .to.throw;
            });

            it('2.2. Failure: Should revert when newAdmin is address zero', async () => {
                newAdmin = ethers.constants.AddressZero;
                await expect(plpModeratorInstance.transferAdminRoleForPIT(masterAddress, newAdmin))
                    .to.be.revertedWith("PITModerator: Invalid addresses");
            });

            it('3. Success: Should transfer admin role for PIT to newAdmin successfully', async () => {
                newAdmin = firstSignerAddress;

                await plpInstance.grantRole(ADMIN_BYTES_32, plpModeratorAddress);
                await plpModeratorInstance.transferAdminRoleForPIT(masterAddress, newAdmin);

                expect(await plpInstance.hasRole(ADMIN_BYTES_32, newAdmin)).to.be.equal(true);
                expect(await plpInstance.hasRole(ADMIN_BYTES_32, masterAddress)).to.be.equal(false);
            });
        });

        describe("removeProjectToken", async function () {
            before(async function () {
                await loadFixture();
                projectTokenId = 0;
            });

            it('1. Failure: Should revert when sender is not admin', async () => {
                await expect(plpModeratorInstance.connect(firstSigner).removeProjectToken(projectTokenId))
                    .to.be.revertedWith("PITModerator: Caller is not the Admin'");
            });

            it('2. Failure: Should throw error when projectTokenId < 0', async () => {
                expect(plpModeratorInstance.connect(firstSigner).removeProjectToken(-1))
                    .to.throw;
            });

            it('3. Failure: Should throw error when projectTokenId > maxUint256', async () => {
                expect(plpModeratorInstance.connect(firstSigner).removeProjectToken(ethers.constants.MaxUint256.add(toBN(1))))
                    .to.throw;
            });

            it('4. Failure: Should throw error when projectTokenId is not uint', async () => {
                expect(plpModeratorInstance.connect(firstSigner).removeProjectToken(1.1))
                    .to.throw;
            });

            it('5. Failure: Should throw error when projectTokenId > numOfProjectTokens', async () => {
                numOfProjectTokens = await plpInstance.projectTokensLength();
                expect(plpModeratorInstance.connect(firstSigner)
                    .removeProjectToken(Number(numOfProjectTokens) + 1)).to.throw;
            });

            it('6. Failure: Should revert when token is deposited', async () => {
                depositPrj1Amount = ethers.utils.parseUnits("100", prj1Decimals);
                await prj1.mintTo(masterAddress, depositPrj1Amount);
                await prj1.connect(deployMaster).approve(plpAddress, depositPrj1Amount);
                await plpInstance.deposit(prj1Address, depositPrj1Amount);

                await expect(plpModeratorInstance.removeProjectToken(projectTokenId))
                    .to.be.revertedWith("PITModerator: ProjectToken amount exist on PIT");
            });

            it('7. Success: Should remove project toke successfully', async () => {
                await loadFixture();
                numOfProjectTokensBeforeRemove = await plpInstance.projectTokensLength();

                projectTokenAddress = await plpInstance.projectTokens(projectTokenId);

                await expect(plpModeratorInstance.removeProjectToken(projectTokenId))
                    .to.be.emit(plpModeratorInstance, "RemoveProjectToken").withArgs(projectTokenAddress);

                numOfProjectTokensAfterRemove = await plpInstance.projectTokensLength();
                projectTokenInfo = await plpInstance.projectTokenInfo(projectTokenAddress);

                expect(numOfProjectTokensAfterRemove).to.be.equal(numOfProjectTokensBeforeRemove.sub(1));
                expect(projectTokenInfo.isListed).to.be.equal(false);
            });

            it.skip('8. Failure: Should revert when isProjectTokenListed = FALSE', async () => { });
        });

        describe("addProjectToken", async function () {
            before(async function () {
                await loadFixture();
                projectTokenId = 0;

                projectTokenAddress = await plpInstance.projectTokens(projectTokenId);
                await (plpModeratorInstance.removeProjectToken(projectTokenId));

                numerator = 6;
                denominator = 10;
            });

            it('1. Failure: Should revert when sender is not admin', async () => {
                projectToken = await plpInstance.projectTokens(projectTokenId);
                await expect(plpModeratorInstance.connect(firstSigner)
                    .addProjectToken(projectToken, numerator, denominator))
                    .to.be.revertedWith("PITModerator: Caller is not the Admin'");
            });

            it('2. Failure: Should throw error when project token is invalid address', async () => {
                projectToken = "Not address";
                expect(plpModeratorInstance.addProjectToken(projectToken, numerator, denominator))
                    .to.throw;
            });

            it('3. Failure: Should revert when project token is address zero', async () => {
                projectToken = ethers.constants.AddressZero;
                await expect(plpModeratorInstance.addProjectToken(projectToken, numerator, denominator))
                    .to.be.revertedWith("PITModerator: Invalid token");
            });

            it('4. Failure: Should throw error when loanToValueRatioNumerator < 0', async () => {
                loanToValueRatioNumerator = -1;
                expect(plpModeratorInstance.addProjectToken(projectTokenAddress, loanToValueRatioNumerator, denominator)).to.throw;
            });

            it('5. Failure: Should throw error when loanToValueRatioNumerator > maxUint8', async () => {
                loanToValueRatioNumerator = ethers.constants.MaxUint256;
                expect(plpModeratorInstance.addProjectToken(projectTokenAddress, loanToValueRatioNumerator, denominator)).to.throw;
            });

            it('6. Failure: Should throw error when loanToValueRatioNumerator is not a uint', async () => {
                loanToValueRatioNumerator = 1.1;
                expect(plpModeratorInstance.addProjectToken(projectTokenAddress, loanToValueRatioNumerator, denominator)).to.throw;
            });

            it('7. Failure: Should throw error when loanToValueRatioDenominator < 0', async () => {
                loanToValueRatioDenominator = -1;
                expect(plpModeratorInstance.addProjectToken(projectTokenAddress, numerator, loanToValueRatioDenominator)).to.throw;
            });

            it('8. Failure: Should throw error when loanToValueRatioDenominator > maxUint8', async () => {
                loanToValueRatioDenominator = ethers.constants.MaxUint256;
                expect(plpModeratorInstance.addProjectToken(projectTokenAddress, numerator, loanToValueRatioDenominator)).to.throw;
            });

            it('9. Failure: Should throw error when loanToValueRatioDenominator is not a uint', async () => {
                loanToValueRatioDenominator = 1.1;
                expect(plpModeratorInstance.addProjectToken(projectTokenAddress, numerator, loanToValueRatioDenominator)).to.throw;
            });

            it('10. Success: Should add project token successfully', async () => {
                projectTokenName = await prj1.name();
                projectTokenSymbol = await prj1.symbol();

                numOfProjectTokensBeforeAdd = await plpInstance.projectTokensLength();

                await expect(plpModeratorInstance.addProjectToken(projectTokenAddress, numerator, denominator))
                    .to.be.emit(plpModeratorInstance, "AddPrjToken")
                    .withArgs(projectTokenAddress, projectTokenName, projectTokenSymbol);

                projectTokenInfo = await plpInstance.projectTokenInfo(projectTokenAddress);
                loanToValueRatio = projectTokenInfo.loanToValueRatio;

                numOfProjectTokensAfterAdd = await plpInstance.projectTokensLength();

                expect(numOfProjectTokensBeforeAdd).to.be.equal(numOfProjectTokensAfterAdd.sub(1));
                expect(projectTokenInfo.isListed).to.be.equal(true);
                expect(projectTokenInfo.isDepositPaused).to.be.equal(false);
                expect(projectTokenInfo.isWithdrawPaused).to.be.equal(false);
                expect(loanToValueRatio.numerator).to.be.equal(numerator);
                expect(loanToValueRatio.denominator).to.be.equal(denominator);
            });
        });

        describe("removeLendingToken", async function () {
            before(async function () {
                await loadFixture();
                lendingTokenId = 0;

                {
                    // deposit prj1, prj2
                    let depositPrj1Amount = ethers.utils.parseUnits("100", prj1Decimals);
                    await prj1.mintTo(masterAddress, depositPrj1Amount);
                    await prj1.connect(deployMaster).approve(plpAddress, depositPrj1Amount);
                    await plpInstance.deposit(prj1Address, depositPrj1Amount);
                }
                {
                    // supply usdc
                    let borrowAmount = ethers.utils.parseUnits("100000000", usdcDecimals); //100.000.000
                    await usdc.mint(masterAddress, borrowAmount);
                    await usdc.connect(deployMaster).approve(bLendingTokenAddress, borrowAmount);
                    await plpInstance.supply(usdcAddress, borrowAmount);

                    // borrow usdc
                    let timeBeforeExpiration = 15;
                    let { priceIds, updateFee } = await priceProviderAggregatorInstance.getExpiredPriceFeeds([prj1Address, usdcAddress], timeBeforeExpiration);
                    let updateData = await getPriceFeedsUpdateData(priceIds);
                    await plpInstance.borrow(
                        prj1Address, usdcAddress,
                        await plpInstance.callStatic.getLendingAvailableToBorrowWithUpdatePrices(masterAddress, prj1Address, usdcAddress, priceIds, updateData, { value: updateFee }),
                        priceIds,
                        updateData,
                        { value: updateFee }
                    );
                }
            });

            it('1. Failure: Should revert when sender is not admin', async () => {
                await expect(plpModeratorInstance.connect(firstSigner).removeLendingToken(lendingTokenId))
                    .to.be.revertedWith("PITModerator: Caller is not the Admin'");
            });

            it('2. Failure: Should throw error when lendingTokenId < 0', async () => {
                expect(plpModeratorInstance.removeLendingToken(-1)).to.throw;
            });

            it('3. Failure: Should throw error when lendingTokenId > maxUint256', async () => {
                expect(plpModeratorInstance.removeLendingToken(ethers.constants.MaxUint256.add(toBN(1)))).to.throw;
            });

            it('4. Failure: Should throw error when lendingTokenId is not uint', async () => {
                expect(plpModeratorInstance.removeLendingToken(1.1)).to.throw;
            });

            it('5. Failure: Should throw error when lendingTokenId > numOfLendingTokens', async () => {
                numOfLendingTokens = await plpInstance.lendingTokensLength();
                expect(plpModeratorInstance.removeLendingToken(Number(numOfLendingTokens) + 1))
                    .to.throw;
            });

            it('6. Failure: Should revert when token is borrowed', async () => {
                await expect(plpModeratorInstance.removeLendingToken(lendingTokenId))
                    .to.be.revertedWith("PITModerator: Exist borrow of lendingToken");
            });

            it('7. Success: Should remove lending token successfully', async () => {
                await loadFixture();

                numOfLendingTokensBeforeRemove = await plpInstance.lendingTokensLength();
                lendingTokenAddress = await plpInstance.lendingTokens(lendingTokenId);

                await expect(plpModeratorInstance.removeLendingToken(lendingTokenId))
                    .to.be.emit(plpModeratorInstance, "RemoveLendingToken").withArgs(lendingTokenAddress);

                numOfLendingTokensAfterRemove = await plpInstance.lendingTokensLength();
                lendingTokenInfo = await plpInstance.lendingTokenInfo(lendingTokenAddress);

                expect(numOfLendingTokensAfterRemove).to.be.equal(numOfLendingTokensBeforeRemove.sub(1));
                expect(lendingTokenInfo.isListed).to.be.equal(false);
            });

            it.skip('8. Failure: Should revert when islendingTokenListed = FALSE', async () => { });
        });

        describe("addLendingToken", async function () {
            before(async function () {
                await loadFixture();
                lendingTokenId = 0;

                lendingTokenAddress = await plpInstance.lendingTokens(lendingTokenId);
                await plpModeratorInstance.removeLendingToken(lendingTokenId);

                isPaused = false;
                numerator = 6;
                denominator = 10;
            });

            it('1. Failure: Should revert when sender is not admin', async () => {
                await expect(plpModeratorInstance.connect(firstSigner).addLendingToken(
                    usdcAddress, bLendingTokenAddress, isPaused, numerator, denominator
                )).to.be.revertedWith("PITModerator: Caller is not the Admin");
            });

            it('2. Failure: Should throw error when lendingTokenAddress is invalid', async () => {
                let lendingToken = "Not address";
                expect(plpModeratorInstance.addLendingToken(
                    lendingToken, bLendingTokenAddress, isPaused, numerator, denominator
                )).to.throw;
            });

            it('3. Failure: Should revert when lendingTokenAddress zero', async () => {
                let lendingToken = ethers.constants.AddressZero;
                await expect(plpModeratorInstance.addLendingToken(
                    lendingToken, bLendingTokenAddress, isPaused, numerator, denominator
                )).to.be.revertedWith("PITModerator: Invalid address");
            });

            it('4. Failure: Should throw error when bLendingTokenAddress is invalid', async () => {
                let bLendingToken = "Not address";
                expect(plpModeratorInstance.addLendingToken(
                    usdcAddress, bLendingToken, isPaused, numerator, denominator
                )).to.throw;
            });

            it('5. Failure: Should revert when bLendingTokenAddress is zero', async () => {
                let bLendingToken = ethers.constants.AddressZero;
                await expect(plpModeratorInstance.addLendingToken(
                    usdcAddress, bLendingToken, isPaused, numerator, denominator
                )).to.be.revertedWith("PITModerator: Invalid address");
            });

            it('6. Failure: Should throw error when loanToValueRatioNumerator < 0', async () => {
                loanToValueRatioNumerator = -1;
                expect(plpModeratorInstance.addLendingToken(
                    usdcAddress, bLendingTokenAddress, isPaused, loanToValueRatioNumerator, denominator
                )).to.throw;
            });

            it('7. Failure: Should throw error when loanToValueRatioNumerator > maxUint8', async () => {
                loanToValueRatioNumerator = ethers.constants.MaxUint256;
                expect(plpModeratorInstance.addLendingToken(
                    usdcAddress, bLendingTokenAddress, isPaused, loanToValueRatioNumerator, denominator
                )).to.throw;
            });

            it('8. Failure: Should throw error when loanToValueRatioNumerator is not a uint', async () => {
                loanToValueRatioNumerator = 1.1;
                expect(plpModeratorInstance.addLendingToken(
                    usdcAddress, bLendingTokenAddress, isPaused, loanToValueRatioNumerator, denominator
                )).to.throw;
            });

            it('9. Failure: Should throw error when loanToValueRatioDenominator < 0', async () => {
                loanToValueRatioDenominator = -1;
                expect(plpModeratorInstance.addLendingToken(
                    usdcAddress, bLendingTokenAddress, isPaused, numerator, loanToValueRatioDenominator
                )).to.throw;
            });

            it('10. Failure: Should throw error when loanToValueRatioDenominator > maxUint8', async () => {
                loanToValueRatioDenominator = ethers.constants.MaxUint256;
                expect(plpModeratorInstance.addLendingToken(
                    usdcAddress, bLendingTokenAddress, isPaused, numerator, loanToValueRatioDenominator
                )).to.throw;
            });

            it('11. Failure: Should throw error when loanToValueRatioDenominator is not a uint', async () => {
                loanToValueRatioDenominator = 1.1;
                expect(plpModeratorInstance.addLendingToken(
                    usdcAddress, bLendingTokenAddress, isPaused, numerator, loanToValueRatioDenominator
                )).to.throw;
            });

            it('12. Success: Should add lending token successfully', async () => {
                lendingTokenName = await usdc.name();
                lendingTokenSymbol = await usdc.symbol();

                numOfLendingTokensBeforeAdd = await plpInstance.lendingTokensLength();

                await expect(plpModeratorInstance.addLendingToken(lendingTokenAddress, bLendingTokenAddress, isPaused, numerator, denominator))
                    .to.be.emit(plpModeratorInstance, "AddLendingToken")
                    .withArgs(lendingTokenAddress, lendingTokenName, lendingTokenSymbol);

                lendingTokenInfo = await plpInstance.lendingTokenInfo(lendingTokenAddress);
                loanToValueRatio = lendingTokenInfo.loanToValueRatio;
                numOfLendingTokensAfterAdd = await plpInstance.lendingTokensLength();

                expect(numOfLendingTokensAfterAdd).to.be.equal(numOfLendingTokensBeforeAdd.add(1));
                expect(lendingTokenInfo.isListed).to.be.equal(true);
                expect(lendingTokenInfo.isPaused).to.be.equal(isPaused);
                expect(lendingTokenInfo.bLendingToken).to.be.equal(bLendingTokenAddress);
                expect(loanToValueRatio.numerator).to.be.equal(numerator);
                expect(loanToValueRatio.denominator).to.be.equal(denominator);
            });
        });

        describe("setPrimaryLendingPlatformLeverage", async function () {
            before(async function () {
                await loadFixture();
            });

            it('1. Failure: Should revert when sender is not admin', async () => {
                newPrimaryLendingPlatformLeverageAddress = plpLeverageAddress;
                await expect(plpModeratorInstance.connect(firstSigner)
                    .setPrimaryLendingPlatformLeverage(newPrimaryLendingPlatformLeverageAddress))
                    .to.be.revertedWith("PITModerator: Caller is not the Admin'");
            });

            it('2.1. Failure: Should throw error when newPrimaryLendingPlatformLeverage is invalid address', async () => {
                newPrimaryLendingPlatformLeverageAddress = "Not address";
                expect(plpModeratorInstance.setPrimaryLendingPlatformLeverage(newPrimaryLendingPlatformLeverageAddress))
                    .to.throw;
            });

            it('2.2. Failure: Should revert when newPrimaryLendingPlatformLeverage is address zero', async () => {
                newPrimaryLendingPlatformLeverageAddress = ethers.constants.AddressZero;
                await expect(plpModeratorInstance.setPrimaryLendingPlatformLeverage(newPrimaryLendingPlatformLeverageAddress))
                    .to.be.revertedWith("PITModerator: Invalid address");
            });

            it('3. Success: Should revoke newAdmin successfully', async () => {
                newPrimaryLendingPlatformLeverageAddress = signers[2].address;
                await expect(plpModeratorInstance.setPrimaryLendingPlatformLeverage(newPrimaryLendingPlatformLeverageAddress))
                    .to.be.emit(plpModeratorInstance, "SetPrimaryLendingPlatformLeverage")
                    .withArgs(newPrimaryLendingPlatformLeverageAddress);

                isRelatedContract = await plpInstance.isRelatedContract(newPrimaryLendingPlatformLeverageAddress);
                expect(isRelatedContract).to.be.equal(true);
            });
        });

        describe("setPriceOracle", async function () {
            before(async function () {
                await loadFixture();
            });

            it('1. Failure: Should revert when sender is not admin', async () => {
                newPriceOracleAddress = signers[2].address;
                await expect(plpModeratorInstance.connect(firstSigner)
                    .setPriceOracle(newPriceOracleAddress))
                    .to.be.revertedWith("PITModerator: Caller is not the Admin'");
            });

            it('2.1. Failure: Should throw error when newPriceOracle is invalid address', async () => {
                newPriceOracleAddress = "Not address";
                expect(plpModeratorInstance.setPriceOracle(newPriceOracleAddress))
                    .to.throw;
            });

            it('2.1. Failure: Should revert when newPriceOracle is invalid address', async () => {
                newPriceOracleAddress = ethers.constants.AddressZero;
                expect(plpModeratorInstance.setPriceOracle(newPriceOracleAddress))
                    .to.be.revertedWith("PITModerator: Invalid address");
            });

            it('3. Success: Should set the price oracle successfully', async () => {
                newPriceOracleAddress = signers[2].address;
                await expect(plpModeratorInstance.setPriceOracle(newPriceOracleAddress))
                    .to.be.emit(plpModeratorInstance, "SetPriceOracle")
                    .withArgs(newPriceOracleAddress);
            });
        });

        describe("addRelatedContracts", async function () {
            before(async function () {
                await loadFixture();
            });

            it('1. Failure: Should revert when sender is not admin', async () => {
                newRelatedContract = signers[2].address;
                await expect(plpModeratorInstance.connect(firstSigner)
                    .addRelatedContracts(newRelatedContract))
                    .to.be.revertedWith("PITModerator: Caller is not the Admin'");
            });

            it('2.1. Failure: Should throw error when newPrimaryLendingPlatformLeverage is invalid address', async () => {
                newRelatedContract = "Not address";
                expect(plpModeratorInstance.addRelatedContracts(newRelatedContract))
                    .to.throw;
            });

            it('2.2. Failure: Should revert when newPrimaryLendingPlatformLeverage is address zero', async () => {
                newRelatedContract = ethers.constants.AddressZero;
                await expect(plpModeratorInstance.addRelatedContracts(newRelatedContract))
                    .to.be.revertedWith("PITModerator: Invalid address");
            });

            it('3. Success: Should add new related contract successfully', async () => {
                newRelatedContract = signers[2].address;
                await expect(plpModeratorInstance.addRelatedContracts(newRelatedContract))
                    .to.be.emit(plpModeratorInstance, "AddRelatedContracts")
                    .withArgs(newRelatedContract);

                isRelatedContract = await plpInstance.isRelatedContract(newRelatedContract);
                expect(isRelatedContract).to.be.equal(true);
            });
        });

        describe("removeRelatedContracts", async function () {
            before(async function () {
                await loadFixture();
            });

            it('1. Failure: Should revert when sender is not admin', async () => {
                relatedContract = signers[2].address;
                await expect(plpModeratorInstance.connect(firstSigner)
                    .removeRelatedContracts(relatedContract)).to.be.revertedWith("PITModerator: Caller is not the Admin'");
            });

            it('2.1. Failure: Should throw error when newPrimaryLendingPlatformLeverage is invalid address', async () => {
                relatedContract = "Not address";
                expect(plpModeratorInstance.removeRelatedContracts(relatedContract)).to.throw;
            });

            it('2.2. Failure: Should revert when newPrimaryLendingPlatformLeverage is address zero', async () => {
                relatedContract = ethers.constants.AddressZero;
                await expect(plpModeratorInstance.removeRelatedContracts(relatedContract))
                    .to.be.revertedWith("PITModerator: Invalid address");
            });

            it('3. Success: Should remove related contract successfully', async () => {
                relatedContract = signers[2].address;
                await expect(plpModeratorInstance.removeRelatedContracts(relatedContract))
                    .to.be.emit(plpModeratorInstance, "RemoveRelatedContracts")
                    .withArgs(relatedContract);

                isRelatedContract = await plpInstance.isRelatedContract(relatedContract);
                expect(isRelatedContract).to.be.equal(false);
            });
        });
    });

    describe("moderator functions", async function () {
        this.timeout(24 * 3600 * 1000);

        before(async function () {
            await loadFixture();
            MODERATOR_BYTES_32 = await plpModeratorInstance.MODERATOR_ROLE();
        });

        describe("setProjectTokenInfo", async function () {
            before(async function () {
                await loadFixture();

                isDepositPaused = false;
                isWithdrawPaused = false;
                numerator = 6;
                denominator = 10;
            });

            it('1. Failure: Should revert when sender is not moderator', async () => {
                await expect(plpModeratorInstance.connect(firstSigner).setProjectTokenInfo(
                    prj1Address,
                    isDepositPaused,
                    isWithdrawPaused,
                    numerator,
                    denominator,
                )).to.be.revertedWith("PITModerator: Caller is not the Moderator");
            });

            it('2. Failure: Should throw error when project token is invalid address', async () => {
                expect(plpModeratorInstance.setProjectTokenInfo(
                    "Not address",
                    isDepositPaused,
                    isWithdrawPaused,
                    numerator,
                    denominator,
                )).to.throw;
            });

            it('3. Failure: Should throw error when loanToValueRatioNumerator < 0', async () => {
                loanToValueRatioNumerator = -1;
                expect(plpModeratorInstance.setProjectTokenInfo(
                    prj1Address,
                    isDepositPaused,
                    isWithdrawPaused,
                    loanToValueRatioNumerator,
                    denominator,
                )).to.throw;
            });

            it('4. Failure: Should throw error when loanToValueRatioNumerator > maxUint8', async () => {
                loanToValueRatioNumerator = ethers.constants.MaxUint256;
                expect(plpModeratorInstance.setProjectTokenInfo(
                    prj1Address,
                    isDepositPaused,
                    isWithdrawPaused,
                    loanToValueRatioNumerator,
                    denominator,
                )).to.throw;
            });

            it('5. Failure: Should throw error when loanToValueRatioNumerator is not a uint', async () => {
                loanToValueRatioNumerator = 1.1;
                expect(plpModeratorInstance.setProjectTokenInfo(
                    prj1Address,
                    isDepositPaused,
                    isWithdrawPaused,
                    loanToValueRatioNumerator,
                    denominator,
                )).to.throw;
            });

            it('6. Failure: Should throw error when loanToValueRatioDenominator < 0', async () => {
                loanToValueRatioDenominator = -1;
                expect(plpModeratorInstance.setProjectTokenInfo(
                    prj1Address,
                    isDepositPaused,
                    isWithdrawPaused,
                    numerator,
                    loanToValueRatioDenominator,
                )).to.throw;
            });

            it('7. Failure: Should throw error when loanToValueRatioDenominator > maxUint8', async () => {
                loanToValueRatioDenominator = ethers.constants.MaxUint256;
                expect(plpModeratorInstance.setProjectTokenInfo(
                    prj1Address,
                    isDepositPaused,
                    isWithdrawPaused,
                    numerator,
                    loanToValueRatioDenominator,
                )).to.throw;
            });

            it('8. Failure: Should throw error when loanToValueRatioDenominator is not a uint', async () => {
                loanToValueRatioDenominator = 1.1;
                expect(plpModeratorInstance.setProjectTokenInfo(
                    prj1Address,
                    isDepositPaused,
                    isWithdrawPaused,
                    numerator,
                    loanToValueRatioDenominator,
                )).to.throw;
            });

            it('9. Failure: Should revert when loanToValueRatioNumerator > loanToValueRatioDenominator', async () => {
                loanToValueRatioNumerator = 6;
                loanToValueRatioDenominator = 1;
                await expect(plpModeratorInstance.setProjectTokenInfo(
                    prj1Address,
                    isDepositPaused,
                    isWithdrawPaused,
                    loanToValueRatioNumerator,
                    loanToValueRatioDenominator,
                )).to.be.revertedWith("PITModerator: Invalid loanToValueRatio");
            });

            it('10. Success: Should set project token info successfully', async () => {
                await expect(plpModeratorInstance.setProjectTokenInfo(
                    prj1Address,
                    isDepositPaused,
                    isWithdrawPaused,
                    numerator,
                    denominator,
                ))
                    .to.be.emit(plpModeratorInstance, "SetProjectTokenInfo")
                    .withArgs(prj1Address, isDepositPaused, isWithdrawPaused)
                    .to.be.emit(plpModeratorInstance, "LoanToValueRatioSet")
                    .withArgs(prj1Address, numerator, denominator);

                projectTokenInfo = await plpInstance.projectTokenInfo(prj1Address);
                loanToValueRatio = projectTokenInfo.loanToValueRatio;

                expect(projectTokenInfo.isListed).to.be.equal(true);
                expect(projectTokenInfo.isDepositPaused).to.be.equal(isDepositPaused);
                expect(projectTokenInfo.isWithdrawPaused).to.be.equal(isWithdrawPaused);
                expect(loanToValueRatio.numerator).to.be.equal(numerator);
                expect(loanToValueRatio.denominator).to.be.equal(denominator);
            });
        });

        describe("setPausedProjectToken", async function () {
            before(async function () {
                await loadFixture();
                isDepositPaused = false;
                isWithdrawPaused = false;
            });

            it('1. Failure: Should revert when sender is not moderator', async () => {
                await expect(plpModeratorInstance.connect(firstSigner).setPausedProjectToken(
                    prj1Address,
                    isDepositPaused,
                    isWithdrawPaused
                )).to.be.revertedWith("PITModerator: Caller is not the Moderator");
            });

            it('2. Failure: Should revert when isProjectTokenListed = FALSE', async () => {
                await expect(plpModeratorInstance.setPausedProjectToken(
                    ethers.constants.AddressZero,
                    isDepositPaused,
                    isWithdrawPaused
                )).to.be.revertedWith("PITModerator: Project token is not listed");
            });

            it('3. Failure: Should throw error when projectToken is invalid address', async () => {
                expect(plpModeratorInstance.setPausedProjectToken(
                    "Not address",
                    isDepositPaused,
                    isWithdrawPaused
                )).to.throw;
            });

            it('4. Success: Should set project token info successfully', async () => {
                await expect(plpModeratorInstance.setPausedProjectToken(
                    prj1Address,
                    isDepositPaused,
                    isWithdrawPaused
                ))
                    .to.be.emit(plpModeratorInstance, "SetPausedProjectToken")
                    .withArgs(prj1Address, isDepositPaused, isWithdrawPaused);

                projectTokenInfo = await plpInstance.projectTokenInfo(prj1Address);

                expect(projectTokenInfo.isListed).to.be.equal(true);
                expect(projectTokenInfo.isDepositPaused).to.be.equal(isDepositPaused);
                expect(projectTokenInfo.isWithdrawPaused).to.be.equal(isWithdrawPaused);
            });
        });

        describe("setLendingTokenInfo", async function () {
            before(async function () {
                await loadFixture();
                isPaused = false;
                numerator = 6;
                denominator = 10;
            });

            it('1. Failure: Should revert when sender is not moderator', async () => {
                await expect(plpModeratorInstance.connect(firstSigner).setLendingTokenInfo(
                    usdcAddress,
                    bLendingTokenAddress,
                    isPaused,
                    numerator,
                    denominator,
                )).to.be.revertedWith("PITModerator: Caller is not the Moderator");
            });

            it('2. Failure: Should throw error when lendingToken is invalid address', async () => {
                lendingToken = "Not address";
                expect(plpModeratorInstance.setLendingTokenInfo(
                    lendingToken,
                    bLendingTokenAddress,
                    isPaused,
                    numerator,
                    denominator,
                )).to.throw;
            });

            it('3. Failure: Should throw error when bLendingToken is invalid address', async () => {
                bLendingToken = "Not address";
                expect(plpModeratorInstance.setLendingTokenInfo(
                    usdcAddress,
                    bLendingToken,
                    isPaused,
                    numerator,
                    denominator,
                )).to.throw;
            });

            it('4. Failure: Should throw error when loanToValueRatioNumerator < 0', async () => {
                loanToValueRatioNumerator = -1;
                expect(plpModeratorInstance.setLendingTokenInfo(
                    usdcAddress,
                    bLendingTokenAddress,
                    isPaused,
                    loanToValueRatioNumerator,
                    denominator,
                )).to.throw;
            });

            it('5. Failure: Should throw error when loanToValueRatioNumerator > maxUint8', async () => {
                loanToValueRatioNumerator = ethers.constants.MaxUint256;
                expect(plpModeratorInstance.setLendingTokenInfo(
                    usdcAddress,
                    bLendingTokenAddress,
                    isPaused,
                    loanToValueRatioNumerator,
                    denominator,
                )).to.throw;
            });

            it('6. Failure: Should throw error when loanToValueRatioNumerator is not a uint', async () => {
                loanToValueRatioNumerator = 1.1;
                expect(plpModeratorInstance.setLendingTokenInfo(
                    usdcAddress,
                    bLendingTokenAddress,
                    isPaused,
                    loanToValueRatioNumerator,
                    denominator,
                )).to.throw;
            });

            it('7. Failure: Should throw error when loanToValueRatioDenominator < 0', async () => {
                loanToValueRatioDenominator = -1;
                expect(plpModeratorInstance.setLendingTokenInfo(
                    usdcAddress,
                    bLendingTokenAddress,
                    isPaused,
                    numerator,
                    loanToValueRatioDenominator,
                )).to.throw;
            });

            it('8. Failure: Should throw error when loanToValueRatioDenominator > maxUint8', async () => {
                loanToValueRatioDenominator = ethers.constants.MaxUint256;
                expect(plpModeratorInstance.setLendingTokenInfo(
                    usdcAddress,
                    bLendingTokenAddress,
                    isPaused,
                    numerator,
                    loanToValueRatioDenominator,
                )).to.throw;
            });

            it('9. Failure: Should throw error when loanToValueRatioDenominator is not a uint', async () => {
                loanToValueRatioDenominator = 1.1;
                expect(plpModeratorInstance.setLendingTokenInfo(
                    usdcAddress,
                    bLendingTokenAddress,
                    isPaused,
                    numerator,
                    loanToValueRatioDenominator,
                )).to.throw;
            });

            it('10. Failure: Should revert when UnderlyingOfbLendingToken != lendingToken', async () => {
                await expect(plpModeratorInstance.setLendingTokenInfo(
                    usbAddress,
                    bLendingTokenAddress,
                    isPaused,
                    numerator,
                    denominator,
                )).to.be.revertedWith("PITModerator: UnderlyingOfbLendingToken!=lendingToken");
            });

            it('11. Success: Should set project token info successfully', async () => {
                await expect(plpModeratorInstance.setLendingTokenInfo(
                    usdcAddress,
                    bLendingTokenAddress,
                    isPaused,
                    numerator,
                    denominator,
                ))
                    .to.be.emit(plpModeratorInstance, "SetPausedLendingToken")
                    .withArgs(usdcAddress, isPaused)
                    .to.be.emit(plpModeratorInstance, "LoanToValueRatioSet")
                    .withArgs(usdcAddress, numerator, denominator);

                lendingTokenInfo = await plpInstance.lendingTokenInfo(usdcAddress);
                loanToValueRatio = lendingTokenInfo.loanToValueRatio;

                expect(lendingTokenInfo.isListed).to.be.equal(true);
                expect(lendingTokenInfo.isPaused).to.be.equal(isPaused);
                expect(lendingTokenInfo.bLendingToken).to.be.equal(bLendingTokenAddress);
                expect(loanToValueRatio.numerator).to.be.equal(numerator);
                expect(loanToValueRatio.denominator).to.be.equal(denominator);
            });
        });

        describe("setPausedLendingToken", async function () {
            before(async function () {
                await loadFixture();
                isPaused = false;
            });

            it('1. Failure: Should revert when sender is not moderator', async () => {
                await expect(plpModeratorInstance.connect(firstSigner).setPausedLendingToken(
                    usdcAddress,
                    isPaused
                )).to.be.revertedWith("PITModerator: Caller is not the Moderator");
            });

            it('2. Failure: Should revert when isProjectTokenListed = FALSE', async () => {
                lendingToken = ethers.constants.AddressZero;
                await expect(plpModeratorInstance.setPausedLendingToken(
                    lendingToken,
                    isPaused
                )).to.be.revertedWith("PITModerator: Lending token is not listed");
            });

            it('3. Failure: Should throw error when projectToken is invalid address', async () => {
                lendingToken = "Not address";
                expect(plpModeratorInstance.setPausedLendingToken(
                    lendingToken,
                    isPaused
                )).to.throw;
            });

            it('4. Success: Should set project token info successfully', async () => {
                await expect(plpModeratorInstance.setPausedLendingToken(
                    usdcAddress,
                    isPaused,
                ))
                    .to.be.emit(plpModeratorInstance, "SetPausedLendingToken")
                    .withArgs(usdcAddress, isPaused);

                lendingTokenInfo = await plpInstance.lendingTokenInfo(prj1Address);

                expect(lendingTokenInfo.isListed).to.be.equal(false);
                expect(lendingTokenInfo.isPaused).to.be.equal(isPaused);
            });
        });

        describe("setBorrowLimitPerCollateralAsset", async function () {
            before(async function () {
                await loadFixture();
                // set borrow limit per collateral asset
                borrowLimitPerCollateralAsset = toBN(100);
            });

            it('1. Failure: Should revert when sender is not moderator', async () => {
                await expect(plpModeratorInstance.connect(firstSigner).setBorrowLimitPerCollateralAsset(
                    prj1Address,
                    borrowLimitPerCollateralAsset
                )).to.be.revertedWith("PITModerator: Caller is not the Moderator");
            });

            it('2. Failure: Should throw error when project token is invalid address', async () => {
                projectToken = "Not address";
                expect(plpModeratorInstance.setBorrowLimitPerCollateralAsset(
                    projectToken,
                    borrowLimitPerCollateralAsset
                )).to.throw;
            });

            it('3. Failure: Should revert when isProjectTokenListed = FALSE', async () => {
                projectToken = ethers.constants.AddressZero;
                expect(plpModeratorInstance.setBorrowLimitPerCollateralAsset(
                    projectToken,
                    borrowLimitPerCollateralAsset
                )).to.be.revertedWith("PITModerator: Project token is not listed");
            });

            it('4. Failure: Should throw error when borrowLimit < 0', async () => {
                borrowLimit = -1;
                expect(plpModeratorInstance.setBorrowLimitPerCollateralAsset(
                    prj1Address,
                    borrowLimit
                )).to.throw;
            });

            it('5. Failure: Should throw error when borrowLimit > maxUint8', async () => {
                borrowLimit = ethers.constants.MaxUint256;
                expect(plpModeratorInstance.setBorrowLimitPerCollateralAsset(
                    prj1Address,
                    borrowLimit
                )).to.throw;
            });

            it('6. Failure: Should throw error when borrowLimit = 0', async () => {
                borrowLimit = 0;
                expect(plpModeratorInstance.setBorrowLimitPerCollateralAsset(
                    prj1Address,
                    borrowLimit
                )).to.be.revertedWith("PITModerator: BorrowLimit = 0");
            });

            it('7. Success: Should set the borrow limit per lending asset successfully', async () => {
                expect(plpModeratorInstance.setBorrowLimitPerCollateralAsset(
                    prj1Address,
                    borrowLimitPerCollateralAsset
                )).to.be.emit(plpModeratorInstance, "SetBorrowLimitPerCollateralAsset")
                    .withArgs(prj1Address, borrowLimitPerCollateralAsset);
            });
        });

        describe("setBorrowLimitPerLendingAsset", async function () {
            before(async function () {
                await loadFixture();
                // set borrow limit per lending asset
                borrowLimitPerLendingAsset = toBN(100);
            });

            it('1. Failure: Should revert when sender is not moderator', async () => {
                await expect(plpModeratorInstance.connect(firstSigner).setBorrowLimitPerLendingAsset(
                    usdcAddress,
                    borrowLimitPerLendingAsset
                )).to.be.revertedWith("PITModerator: Caller is not the Moderator");
            });

            it('2. Failure: Should throw error when project token is invalid address', async () => {
                lendingToken = "Not address";
                expect(plpModeratorInstance.setBorrowLimitPerLendingAsset(
                    lendingToken,
                    borrowLimitPerLendingAsset
                )).to.throw;
            });

            it('3. Failure: Should revert when isLendingTokenListed = FALSE', async () => {
                lendingToken = ethers.constants.AddressZero;
                expect(plpModeratorInstance.setBorrowLimitPerLendingAsset(
                    lendingToken,
                    borrowLimitPerLendingAsset
                )).to.be.revertedWith("PITModerator: Lending token is not listed");
            });

            it('4. Failure: Should throw error when borrowLimit < 0', async () => {
                borrowLimit = -1;
                expect(plpModeratorInstance.setBorrowLimitPerLendingAsset(
                    usdcAddress,
                    borrowLimit
                )).to.throw;
            });

            it('5. Failure: Should throw error when borrowLimit > maxUint8', async () => {
                borrowLimit = ethers.constants.MaxUint256;
                expect(plpModeratorInstance.setBorrowLimitPerLendingAsset(
                    usdcAddress,
                    borrowLimit
                )).to.throw;
            });

            it('6. Failure: Should throw error when borrowLimit = 0', async () => {
                borrowLimit = 0;
                expect(plpModeratorInstance.setBorrowLimitPerLendingAsset(
                    usdcAddress,
                    borrowLimit
                )).to.be.revertedWith("PITModerator: BorrowLimit = 0");
            });

            it('7. Success: Should set the borrow limit per lending asset successfully', async () => {
                expect(plpModeratorInstance.setBorrowLimitPerLendingAsset(
                    usdcAddress,
                    borrowLimitPerLendingAsset
                )).to.be.emit(plpModeratorInstance, "SetBorrowLimitPerLendingAsset")
                    .withArgs(usdcAddress, borrowLimitPerLendingAsset);
            });
        });
    });
});