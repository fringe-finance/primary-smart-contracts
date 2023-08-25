require("dotenv").config();
const chain = process.env.CHAIN ? "_" + process.env.CHAIN : "";
const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const path = require("path");
const configTestingFile = path.join(__dirname, `../../scripts/config/${network}${chain}/config_testing.json`);
const configTesting = require(configTestingFile);
const { deployment } = require("../../scripts/deployPLP_V2/deploymentPLP");
const { ethers } = require("ethers");
const { expect, util } = require("chai");
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

describe("PrimaryLendingPlatformModerator", function () {
    this.timeout(86400000);

    let signers;
    let firstSigner;
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
    let firstSignerAddress;
    let MockToken;

    let bLendingTokenAddress;
    let bLendingTokenInstance;

    async function setHighPricePrj1() {
        await priceProviderAggregatorInstance.setTokenAndPriceProvider(
            prj1Address,
            chainlinkPriceProviderAddress,
            false
        );
    };

    async function setLowPricePrj1() {
        await priceProviderAggregatorInstance.setTokenAndPriceProvider(
            prj1Address,
            uniswapV2PriceProviderAddress,
            false
        );
    }
    async function setLowPriceUSDC() {
        await priceProviderAggregatorInstance.setTokenAndPriceProvider(
            usdcAddress,
            chainlinkPriceProviderAddress,
            false
        );
    };

    async function setHighPriceUSDC() {
        await priceProviderAggregatorInstance.setTokenAndPriceProvider(
            usdcAddress,
            uniswapV2PriceProviderAddress,
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
        firstSigner = signers[1];

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
            firstSignerAddress = firstSigner.address;
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
            // console.log("usdc: " + (await plpInstance.getTokenEvaluation(usdcAddress, ethers.utils.parseUnits("1", usdcDecimals))).toString());
            // console.log("weth: " + (await plpInstance.getTokenEvaluation(wethAddress, ethers.utils.parseUnits("1", wethDecimals))).toString());
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
        this.timeout(24 * 3600);

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

            it('2. Failure: Should revert when newModerator is invalid address', async () => {
                newModerator = ethers.constants.AddressZero;
                await expect(plpModeratorInstance.grandModerator(newModerator))
                    .to.be.revertedWith("PITModerator: Invalid address");
            });

            it('3. Success: Should grant the moderator role to newModerator successfully', async () => {
                await expect(plpModeratorInstance.grandModerator(firstSignerAddress))
                    .to.be.emit(plpModeratorInstance, "GrandModerator").withArgs(firstSignerAddress);
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

            it('2. Failure: Should revert when moderator is invalid address', async () => {
                moderator = ethers.constants.AddressZero;
                await expect(plpModeratorInstance.revokeModerator(moderator))
                    .to.be.revertedWith("PITModerator: Invalid address");
            });

            it('3. Success: Should revoke moderator successfully', async () => {
                await expect(plpModeratorInstance.revokeModerator(firstSignerAddress))
                    .to.be.emit(plpModeratorInstance, "RevokeModerator").withArgs(firstSignerAddress);
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

            it('2. Failure: Should revert when newAdmin is invalid address', async () => {
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

            it('2. Failure: Should revert when newAdmin is invalid address', async () => {
                newAdmin = ethers.constants.AddressZero;
                await expect(plpModeratorInstance.transferAdminRoleForPIT(masterAddress, newAdmin))
                    .to.be.revertedWith("PITModerator: Invalid newAdmin");
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

            it('2. Failure: Should revert when projectTokenId < 0', async () => {
                expect(plpModeratorInstance.connect(firstSigner).removeProjectToken(-1))
                    .to.throw;
            });

            it('3. Failure: Should revert when projectTokenId > maxUint256', async () => {
                expect(plpModeratorInstance.connect(firstSigner).removeProjectToken(ethers.constants.MaxUint256.add(toBN(1))))
                    .to.throw;
            });

            it('4. Failure: Should revert when projectTokenId is not uint', async () => {
                expect(plpModeratorInstance.connect(firstSigner).removeProjectToken(1.1))
                    .to.throw;
            });

            it('5. Failure: Should revert when token is deposited', async () => {
                depositPrj1Amount = ethers.utils.parseUnits("100", prj1Decimals);
                await prj1.mintTo(masterAddress, depositPrj1Amount);
                await prj1.connect(deployMaster).approve(plpAddress, depositPrj1Amount);
                await plpInstance.deposit(prj1Address, depositPrj1Amount);

                await expect(plpModeratorInstance.removeProjectToken(projectTokenId))
                    .to.be.revertedWith("PITModerator: ProjectToken amount exist on PIT");
            });

            it('6. Success: Should remove project toke successfully', async () => {
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

            it.skip('7. Failure: Should revert when isProjectTokenListed = FALSE', async () => { });
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

            it('2. Failure: Should revert when project token is invalid address', async () => {
                projectToken = ethers.constants.AddressZero;
                await expect(plpModeratorInstance.addProjectToken(projectToken, numerator, denominator))
                    .to.be.revertedWith("PITModerator: Invalid token");
            });

            it('3. Failure: Should throw error when loanToValueRatioNumerator < 0', async () => {
                loanToValueRatioNumerator = -1;
                expect(plpModeratorInstance.addProjectToken(projectTokenAddress, loanToValueRatioNumerator, denominator)).to.throw;
            });

            it('4. Failure: Should throw error when loanToValueRatioNumerator > maxUint8', async () => {
                loanToValueRatioNumerator = ethers.constants.MaxUint256;
                expect(plpModeratorInstance.addProjectToken(projectTokenAddress, loanToValueRatioNumerator, denominator)).to.throw;
            });

            it('5. Failure: Should throw error when loanToValueRatioNumerator is not a uint', async () => {
                loanToValueRatioNumerator = 1.1;
                expect(plpModeratorInstance.addProjectToken(projectTokenAddress, loanToValueRatioNumerator, denominator)).to.throw;
            });

            it('6. Failure: Should throw error when loanToValueRatioDenominator < 0', async () => {
                loanToValueRatioDenominator = -1;
                expect(plpModeratorInstance.addProjectToken(projectTokenAddress, numerator, loanToValueRatioDenominator)).to.throw;
            });

            it('7. Failure: Should throw error when loanToValueRatioDenominator > maxUint8', async () => {
                loanToValueRatioDenominator = ethers.constants.MaxUint256;
                expect(plpModeratorInstance.addProjectToken(projectTokenAddress, numerator, loanToValueRatioDenominator)).to.throw;
            });

            it('8. Failure: Should throw error when loanToValueRatioDenominator is not a uint', async () => {
                loanToValueRatioDenominator = 1.1;
                expect(plpModeratorInstance.addProjectToken(projectTokenAddress, numerator, loanToValueRatioDenominator)).to.throw;
            });

            it('9. Success: Should add project token successfully', async () => {
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
                    await plpInstance.borrow(
                        prj1Address, usdcAddress,
                        await plpInstance.getLendingAvailableToBorrow(masterAddress, prj1Address, usdcAddress)
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

            it('5. Failure: Should revert when token is not deposited', async () => {
                await expect(plpModeratorInstance.removeLendingToken(lendingTokenId))
                    .to.be.revertedWith("PITModerator: Exist borrow of lendingToken");
            });

            it('6. Success: Should remove lending token successfully', async () => {
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

            it.skip('7. Failure: Should revert when islendingTokenListed = FALSE', async () => { });
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

            it('2. Failure: Should revert when lendingTokenAddress is invalid', async () => {
                let lendingToken = ethers.constants.AddressZero;
                await expect(plpModeratorInstance.addLendingToken(
                    lendingToken, bLendingTokenAddress, isPaused, numerator, denominator
                )).to.be.revertedWith("PITModerator: Invalid address");
            });

            it('3. Failure: Should revert when bLendingTokenAddress is invalid', async () => {
                let bLendingToken = ethers.constants.AddressZero;
                await expect(plpModeratorInstance.addLendingToken(
                    usdcAddress, bLendingToken, isPaused, numerator, denominator
                )).to.be.revertedWith("PITModerator: Invalid address");
            });

            it.skip('4. Failure: Should throw error when isPaused is not boolean', async () => {
                expect(plpModeratorInstance.addLendingToken(
                    usdcAddress, bLendingTokenAddress, "false", numerator, denominator
                )).to.throw;
            });

            it('5. Failure: Should throw error when loanToValueRatioNumerator < 0', async () => {
                loanToValueRatioNumerator = -1;
                expect(plpModeratorInstance.addLendingToken(
                    usdcAddress, bLendingTokenAddress, isPaused, loanToValueRatioNumerator, denominator
                )).to.throw;
            });

            it('6. Failure: Should throw error when loanToValueRatioNumerator > maxUint8', async () => {
                loanToValueRatioNumerator = ethers.constants.MaxUint256;
                expect(plpModeratorInstance.addLendingToken(
                    usdcAddress, bLendingTokenAddress, isPaused, loanToValueRatioNumerator, denominator
                )).to.throw;
            });

            it('7. Failure: Should throw error when loanToValueRatioNumerator is not a uint', async () => {
                loanToValueRatioNumerator = 1.1;
                expect(plpModeratorInstance.addLendingToken(
                    usdcAddress, bLendingTokenAddress, isPaused, loanToValueRatioNumerator, denominator
                )).to.throw;
            });

            it('8. Failure: Should throw error when loanToValueRatioDenominator < 0', async () => {
                loanToValueRatioDenominator = -1;
                expect(plpModeratorInstance.addLendingToken(
                    usdcAddress, bLendingTokenAddress, isPaused, numerator, loanToValueRatioDenominator
                )).to.throw;
            });

            it('9. Failure: Should throw error when loanToValueRatioDenominator > maxUint8', async () => {
                loanToValueRatioDenominator = ethers.constants.MaxUint256;
                expect(plpModeratorInstance.addLendingToken(
                    usdcAddress, bLendingTokenAddress, isPaused, numerator, loanToValueRatioDenominator
                )).to.throw;
            });

            it('10. Failure: Should throw error when loanToValueRatioDenominator is not a uint', async () => {
                loanToValueRatioDenominator = 1.1;
                expect(plpModeratorInstance.addLendingToken(
                    usdcAddress, bLendingTokenAddress, isPaused, numerator, loanToValueRatioDenominator
                )).to.throw;
            });

            it('11. Success: Should add lending token successfully', async () => {
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

        // describe("setPrimaryLendingPlatformLeverage", async function () {
        //     it('1. Failure: Should revert when sender is not admin', async () => {
        //         await expect(plpModeratorInstance.connect(firstSigner).transferAdminRole(firstSignerAddress))
        //             .to.be.revertedWith("PITModerator: Caller is not the Admin'");
        //     });

        //     it('2. Failure: Should revert when newAdmin is invalid address', async () => {
        //         newAdmin = ethers.constants.AddressZero;
        //         await expect(plpModeratorInstance.transferAdminRole(newAdmin))
        //             .to.be.revertedWith("PITModerator: Invalid newAdmin");
        //     });

        //     it('3. Success: Should revoke newAdmin successfully', async () => {
        //         await expect(plpModeratorInstance.transferAdminRole(firstSignerAddress))
        //             .to.be.emit(plpModeratorInstance, "RevokeModerator").withArgs(firstSignerAddress);
        //     });
        // });

        // describe("setPriceOracle", async function () {
        //     it('1. Failure: Should revert when sender is not admin', async () => {
        //         await expect(plpModeratorInstance.connect(firstSigner).transferAdminRole(firstSignerAddress))
        //             .to.be.revertedWith("PITModerator: Caller is not the Admin'");
        //     });

        //     it('2. Failure: Should revert when newAdmin is invalid address', async () => {
        //         newAdmin = ethers.constants.AddressZero;
        //         await expect(plpModeratorInstance.transferAdminRole(newAdmin))
        //             .to.be.revertedWith("PITModerator: Invalid newAdmin");
        //     });

        //     it('3. Success: Should revoke newAdmin successfully', async () => {
        //         await expect(plpModeratorInstance.transferAdminRole(firstSignerAddress))
        //             .to.be.emit(plpModeratorInstance, "RevokeModerator").withArgs(firstSignerAddress);
        //     });
        // });

        // describe("addRelatedContracts", async function () {
        //     it('1. Failure: Should revert when sender is not admin', async () => {
        //         await expect(plpModeratorInstance.connect(firstSigner).transferAdminRole(firstSignerAddress))
        //             .to.be.revertedWith("PITModerator: Caller is not the Admin'");
        //     });

        //     it('2. Failure: Should revert when newAdmin is invalid address', async () => {
        //         newAdmin = ethers.constants.AddressZero;
        //         await expect(plpModeratorInstance.transferAdminRole(newAdmin))
        //             .to.be.revertedWith("PITModerator: Invalid newAdmin");
        //     });

        //     it('3. Success: Should revoke newAdmin successfully', async () => {
        //         await expect(plpModeratorInstance.transferAdminRole(firstSignerAddress))
        //             .to.be.emit(plpModeratorInstance, "RevokeModerator").withArgs(firstSignerAddress);
        //     });
        // });

        // describe("removeRelatedContracts", async function () {
        //     it('1. Failure: Should revert when sender is not admin', async () => {
        //         await expect(plpModeratorInstance.connect(firstSigner).transferAdminRole(firstSignerAddress))
        //             .to.be.revertedWith("PITModerator: Caller is not the Admin'");
        //     });

        //     it('2. Failure: Should revert when newAdmin is invalid address', async () => {
        //         newAdmin = ethers.constants.AddressZero;
        //         await expect(plpModeratorInstance.transferAdminRole(newAdmin))
        //             .to.be.revertedWith("PITModerator: Invalid newAdmin");
        //     });

        //     it('3. Success: Should revoke newAdmin successfully', async () => {
        //         await expect(plpModeratorInstance.transferAdminRole(firstSignerAddress))
        //             .to.be.emit(plpModeratorInstance, "RevokeModerator").withArgs(firstSignerAddress);
        //     });
        // });
    });

    describe("moderator functions", async function () {
        describe("setProjectTokenInfo", async function () { });

        describe("setPausedProjectToken", async function () { });

        describe("setLendingTokenInfo", async function () { });

        describe("setPausedLendingToken", async function () { });

        describe("setBorrowLimitPerCollateralAsset", async function () { });

        describe("setBorrowLimitPerLendingAsset", async function () { });
    });
});