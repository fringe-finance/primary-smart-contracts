require("dotenv").config();
const hre = require("hardhat");
const { ethers } = require("ethers");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { Dex } = require("./estimate-scripts/enum/dexType");
const { Pair } = require("./estimate-scripts/enum/pairType");
const { TokenType } = require("./estimate-scripts/enum/tokenType");
const { DAI, USDC, USDT, DAI_USDC, USDC_USDT, USDC_4626, DAI_4626 } = require("./utils/constants");
const { deployPlatform } = require("./utils/deployPlatform");
const { loadContractInstance } = require("./estimate-scripts/utils/loadContract");
const { ERC20_ABI } = require("./estimate-scripts/abis/ERC20");
const { UniswapV2Pair_ABI } = require("./estimate-scripts/abis/UniswapV2Pair");
const { ERC4626_ABI } = require("./estimate-scripts/abis/ERC4626");
const { estimate } = require("./estimate-scripts");

const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);

describe("LeverageBorrow", function () {

    let signers;
    let deployMaster;
    const getTokenTuple = (tokenInfo) => {
        let tokenIndex;
        switch (tokenInfo.tokenType) {
            case TokenType.ERC20 : tokenIndex = 0; break;
            case TokenType.ERC4626 : tokenIndex = 1; break;
            case TokenType.LP : tokenIndex = 2; break;
            default: tokenIndex = 0;
        }
        return [tokenInfo.address, tokenIndex]
    }
    async function resetNetwork() {
        await helpers.reset(
            `https://${process.env.CHAIN.replace("_", "-")}.infura.io/v3/${process.env.INFURA_KEY}`,
            Number(process.env.BLOCK_NUMBER)
        );
    }
    async function loadFixture() {
        await resetNetwork();
        signers = await hre.ethers.getSigners();
        deployMaster = signers[0];
        const tokenInstances = {
            dai: loadContractInstance(DAI, ERC20_ABI, deployMaster),
            usdc: loadContractInstance(USDC, ERC20_ABI, deployMaster),
            usdt: loadContractInstance(USDT, ERC20_ABI, deployMaster),
            dai_usdc: loadContractInstance(DAI_USDC, UniswapV2Pair_ABI, deployMaster),
            usdc_usdt: loadContractInstance(USDC_USDT, UniswapV2Pair_ABI, deployMaster),
            usdc_4626: loadContractInstance(USDC_4626, ERC4626_ABI, deployMaster),
            dai_4626: loadContractInstance(DAI_4626, ERC4626_ABI, deployMaster)
        };

        const tokenInfo = {
            [tokenInstances.dai.address]: { address: tokenInstances.dai.address, tokenType: TokenType.ERC20, decimals: 18 },
            [tokenInstances.usdc.address]: { address: tokenInstances.usdc.address, tokenType: TokenType.ERC20, decimals: 6 },
            [tokenInstances.usdt.address]: { address: tokenInstances.usdt.address, tokenType: TokenType.ERC20, decimals: 6 },
            [tokenInstances.dai_usdc.address]: { address: tokenInstances.dai_usdc.address, tokenType: TokenType.LP, pairType: Pair.Uniswap, decimals: 18 },
            [tokenInstances.usdc_usdt.address]: { address: tokenInstances.usdc_usdt.address, tokenType: TokenType.LP, pairType: Pair.Uniswap, decimals: 18 },
            [tokenInstances.usdc_4626.address]: { address: tokenInstances.usdc_4626.address, tokenType: TokenType.ERC4626, decimals: 18 },
            [tokenInstances.dai_4626.address]: { address: tokenInstances.dai_4626.address, tokenType: TokenType.ERC4626, decimals: 18 },
        }
        console.log("Setting up tokens");
        await setBalance(DAI, deployMaster.address, toBN("1000000000000000000000000000"));
        await setBalance(USDC, deployMaster.address, toBN("1000000000000000000000000000"));
        await setBalance(USDT, deployMaster.address, toBN("1000000000000000000000000000"));
        await setBalance(DAI_USDC, deployMaster.address, toBN("100000000000000000000000"));
        await setBalance(USDC_USDT, deployMaster.address, toBN("100000000000000000000000"));
        
        await tokenInstances.usdc.approve(tokenInstances.usdc_4626.address, hre.ethers.constants.MaxUint256);
        await tokenInstances.usdc_4626.deposit("1000000000000", deployMaster.address);

        await tokenInstances.dai.approve(tokenInstances.dai_4626.address, hre.ethers.constants.MaxUint256);
        await tokenInstances.dai_4626.deposit("100000000000000000000000", deployMaster.address);
        console.log("Completed to set up tokens");
        console.log();

        console.log("Deploying platform");
        process.env.TESTING = "true";
        const platfrom = await deployPlatform();
        console.log("Completed to deploy platform");
        console.log();
        return {
            tokenInstances,
            tokenInfo,
            platfrom
        };
    }
    async function setBalance(token, user, newBalance) {
        for (let i = 0; i < 40; i++) {
            const index = ethers.utils.solidityKeccak256(["uint256", "uint256"], [user, i]);
            await helpers.setStorageAt(
                token,
                index,
                ethers.utils.hexlify(
                    ethers.utils.zeroPad(newBalance.toHexString(), 32)
                ).toString()
            );
        }
    }

    async function setupLeverage(collateralAddress, lendingAddress) {
        const {
            tokenInstances,
            tokenInfo,
            platfrom
        } = await loadFixture();

        const collateral = Object.values(tokenInstances).find(token => token.address.toLowerCase() === collateralAddress.toLowerCase());
        const collateralAmount = tokenInfo[collateral.address].pairType ? 0.0001 : 10000;
        const depositAmount = (toBN("10").pow(tokenInfo[collateral.address].decimals)).mul(collateralAmount * 10e9).div(10e9);
        const lending = Object.values(tokenInstances).find(token => token.address.toLowerCase() === lendingAddress.toLowerCase());
        const lendingAmount = tokenInfo[lending.address].pairType ? 0.001 : 500000;
        const supplyAmount = (toBN("10").pow(tokenInfo[lending.address].decimals)).mul(lendingAmount * 100000).div(100000);

        // Deposit collateral token
        await collateral.approve(platfrom.addresses.plpAddress, hre.ethers.constants.MaxUint256);
        await platfrom.contractInstance.plpInstance.deposit(collateral.address, depositAmount);
        // Supply lending token
        const bToken = (await platfrom.contractInstance.plpInstance.lendingTokenInfo(lending.address)).bLendingToken;
        await lending.approve(bToken, hre.ethers.constants.MaxUint256);
        await platfrom.contractInstance.plpInstance.supply(lending.address, toBN(supplyAmount));

        const borrowAmount = await platfrom.contractInstance.plpInstance.getLendingAvailableToBorrow(
            deployMaster.address,
            collateral.address,
            lending.address
        );

        return {
            platfrom,
            collateral,
            collateralInfo: tokenInfo[collateral.address],
            lending,
            lendingInfo: tokenInfo[lending.address],
            depositAmount,
            supplyAmount,
            borrowAmount
        }
    }

    function depositLPAndSupplyERC20() {
        return setupLeverage(DAI_USDC, USDT);
    }

    function depositERC20AndSupplyLP() {
        return setupLeverage(USDT, DAI_USDC);
    }

    function depositERC20AndSupplyERC4626() {
        return setupLeverage(USDT, USDC_4626);
    }

    function depositERC4626AndSupplyERC20() {
        return setupLeverage(USDC_4626, USDT);
    }

    function depositERC4626AndSupplyERC4626() {
        return setupLeverage(DAI_4626, USDC_4626);
    }

    // it("LP as collateral And ERC20 as lending", async function () {
    //     const {
    //         platfrom,
    //         collateral,
    //         collateralInfo,
    //         depositAmount,
    //         lending,
    //         lendingInfo,
    //         supplyAmount,
    //         borrowAmount
    //     } = await helpers.loadFixture(depositLPAndSupplyERC20);
    //     const { plpInstance, plpLeverageInstance } = platfrom.contractInstance;

    //     console.log({
    //         balanceCollateral: await collateral.balanceOf(deployMaster.address),
    //         balanceLending: await lending.balanceOf(deployMaster.address),
    //         depositedAmount: await plpInstance.depositedAmount(
    //             deployMaster.address,
    //             collateral.address
    //         ),
    //         totalOutstanding: await plpInstance.totalOutstanding(
    //             deployMaster.address,
    //             collateral.address,
    //             lending.address
    //         ),
    //         supplyAmount: supplyAmount.toString(),
    //         borrowAmount: borrowAmount.toString(),
    //     });

    //     const estimateData = await estimate(
    //         lendingInfo,
    //         collateralInfo,
    //         "50000000000000",
    //         plpLeverageInstance.address,
    //         "0.05",
    //         "1",
    //         Dex.Paraswap,
    //         deployMaster.provider
    //     );
    //     const notionalValue = estimateData.estimateAmountIn.mul(110).div(100);
    //     console.log("estimateData", estimateData);
    //     await collateral.approve(plpLeverageInstance.address, hre.ethers.constants.MaxUint256)
    //     await lending.approve(plpLeverageInstance.address, hre.ethers.constants.MaxUint256)
    //     let tx = await plpLeverageInstance.leveragedBorrow(
    //         getTokenTuple(collateralInfo),
    //         getTokenTuple(lendingInfo),
    //         notionalValue,
    //         "110000000000000",
    //         estimateData.buyCallData,
    //         "1",
    //         [],
    //         []
    //     );
    //     let receipt = await tx.wait();
    //     const token0 = await collateral.token0();
    //     const token1 = await collateral.token1();
    //     const token0Instance = loadContractInstance(token0, ERC20_ABI, deployMaster);
    //     const token1Instance = loadContractInstance(token1, ERC20_ABI, deployMaster);
    //     console.log({
    //         collateralAmount: await plpInstance.depositedAmount(
    //             deployMaster.address,
    //             collateral.address
    //         ),
    //         collateralBalanceInContract: await collateral.balanceOf(plpLeverageInstance.address),
    //         lendingBalanceInContract: await lending.balanceOf(plpLeverageInstance.address),
    //         token0BalanceInContract: await token0Instance.balanceOf(plpLeverageInstance.address),
    //         token1BalanceInContract: await token1Instance.balanceOf(plpLeverageInstance.address),
    //     });
    // }).timeout(1000000);

    // it("ERC20 as collateral And LP as lending", async function () {
    //     const {
    //         platfrom,
    //         collateral,
    //         collateralInfo,
    //         depositAmount,
    //         lending,
    //         lendingInfo,
    //         supplyAmount,
    //         borrowAmount
    //     } = await helpers.loadFixture(depositERC20AndSupplyLP);
    //     const { plpInstance, plpLeverageInstance } = platfrom.contractInstance;

    //     console.log({
    //         balanceCollateral: await collateral.balanceOf(deployMaster.address),
    //         balanceLending: await lending.balanceOf(deployMaster.address),
    //         depositedAmount: await plpInstance.depositedAmount(
    //             deployMaster.address,
    //             collateral.address
    //         ),
    //         totalOutstanding: await plpInstance.totalOutstanding(
    //             deployMaster.address,
    //             collateral.address,
    //             lending.address
    //         ),
    //         supplyAmount: supplyAmount.toString(),
    //         borrowAmount: borrowAmount.toString(),
    //     });

    //     const estimateData = await estimate(
    //         lendingInfo,
    //         collateralInfo,
    //         "300000000",
    //         plpLeverageInstance.address,
    //         "0.05",
    //         "1",
    //         Dex.Paraswap,
    //         deployMaster.provider
    //     );
    //     const notionalValue = "350000000";
    //     console.log("estimateData", estimateData);
    //     await collateral.approve(plpLeverageInstance.address, hre.ethers.constants.MaxUint256)
    //     await lending.approve(plpLeverageInstance.address, hre.ethers.constants.MaxUint256)
    //     let tx = await plpLeverageInstance.leveragedBorrow(
    //         getTokenTuple(collateralInfo),
    //         getTokenTuple(lendingInfo),
    //         notionalValue,
    //         "1100000000",
    //         estimateData.buyCallData,
    //         "1",
    //         [],
    //         []
    //     );
    //     let receipt = await tx.wait();
    //     const token0 = await lending.token0();
    //     const token1 = await lending.token1();
    //     const token0Instance = loadContractInstance(token0, ERC20_ABI, deployMaster);
    //     const token1Instance = loadContractInstance(token1, ERC20_ABI, deployMaster);
    //     console.log({
    //         collateralAmount: await plpInstance.depositedAmount(
    //             deployMaster.address,
    //             collateral.address
    //         ),
    //         collateralBalanceInContract: await collateral.balanceOf(plpLeverageInstance.address),
    //         lendingBalanceInContract: await lending.balanceOf(plpLeverageInstance.address),
    //         token0BalanceInContract: await token0Instance.balanceOf(plpLeverageInstance.address),
    //         token1BalanceInContract: await token1Instance.balanceOf(plpLeverageInstance.address),
    //     });
    // }).timeout(1000000);

    // it("ERC20 as collateral And ERC4626 as lending", async function () {
    //     const {
    //         platfrom,
    //         collateral,
    //         collateralInfo,
    //         depositAmount,
    //         lending,
    //         lendingInfo,
    //         supplyAmount,
    //         borrowAmount
    //     } = await helpers.loadFixture(depositERC20AndSupplyERC4626);
    //     const { plpInstance, plpLeverageInstance } = platfrom.contractInstance;

    //     console.log({
    //         balanceCollateral: await collateral.balanceOf(deployMaster.address),
    //         balanceLending: await lending.balanceOf(deployMaster.address),
    //         depositedAmount: await plpInstance.depositedAmount(
    //             deployMaster.address,
    //             collateral.address
    //         ),
    //         totalOutstanding: await plpInstance.totalOutstanding(
    //             deployMaster.address,
    //             collateral.address,
    //             lending.address
    //         ),
    //         supplyAmount: supplyAmount.toString(),
    //         borrowAmount: borrowAmount.toString(),
    //     });

    //     const estimateData = await estimate(
    //         lendingInfo,
    //         collateralInfo,
    //         "300000000",
    //         plpLeverageInstance.address,
    //         "0.05",
    //         "1",
    //         Dex.Paraswap,
    //         deployMaster.provider
    //     );
    //     const notionalValue = "350000000";
    //     console.log("estimateData", estimateData);
    //     await collateral.approve(plpLeverageInstance.address, hre.ethers.constants.MaxUint256)
    //     await lending.approve(plpLeverageInstance.address, hre.ethers.constants.MaxUint256)
    //     let tx = await plpLeverageInstance.leveragedBorrow(
    //         getTokenTuple(collateralInfo),
    //         getTokenTuple(lendingInfo),
    //         notionalValue,
    //         "1100000000",
    //         estimateData.buyCallData,
    //         "1",
    //         [],
    //         []
    //     );
    //     let receipt = await tx.wait();
    //     const token0 = await lending.asset();
    //     const token0Instance = loadContractInstance(token0, ERC20_ABI, deployMaster);
    //     console.log({
    //         collateralAmount: await plpInstance.depositedAmount(
    //             deployMaster.address,
    //             collateral.address
    //         ),
    //         collateralBalanceInContract: await collateral.balanceOf(plpLeverageInstance.address),
    //         lendingBalanceInContract: await lending.balanceOf(plpLeverageInstance.address),
    //         token0BalanceInContract: await token0Instance.balanceOf(plpLeverageInstance.address),
    //     });
    // }).timeout(1000000);

    // it("ERC4626 as collateral And ERC4626 as lending", async function () {
    //     const {
    //         platfrom,
    //         collateral,
    //         collateralInfo,
    //         depositAmount,
    //         lending,
    //         lendingInfo,
    //         supplyAmount,
    //         borrowAmount
    //     } = await helpers.loadFixture(depositERC4626AndSupplyERC4626);
    //     const { plpInstance, plpLeverageInstance } = platfrom.contractInstance;

    //     console.log({
    //         balanceCollateral: await collateral.balanceOf(deployMaster.address),
    //         balanceLending: await lending.balanceOf(deployMaster.address),
    //         depositedAmount: await plpInstance.depositedAmount(
    //             deployMaster.address,
    //             collateral.address
    //         ),
    //         totalOutstanding: await plpInstance.totalOutstanding(
    //             deployMaster.address,
    //             collateral.address,
    //             lending.address
    //         ),
    //         supplyAmount: supplyAmount.toString(),
    //         borrowAmount: borrowAmount.toString(),
    //     });

    //     const estimateData = await estimate(
    //         lendingInfo,
    //         collateralInfo,
    //         "400000000000000000000",
    //         plpLeverageInstance.address,
    //         "0.05",
    //         "1",
    //         Dex.Paraswap,
    //         deployMaster.provider
    //     );
    //     const notionalValue = borrowAmount.div(toBN(`0x${(10**(lendingInfo.decimals - 6)).toString(16)}`));
    //     console.log("estimateData", estimateData);
    //     await collateral.approve(plpLeverageInstance.address, hre.ethers.constants.MaxUint256)
    //     await lending.approve(plpLeverageInstance.address, hre.ethers.constants.MaxUint256)
    //     let tx = await plpLeverageInstance.leveragedBorrow(
    //         getTokenTuple(collateralInfo),
    //         getTokenTuple(lendingInfo),
    //         notionalValue,
    //         depositAmount.mul(110).div(100),
    //         estimateData.buyCallData,
    //         "1",
    //         [],
    //         []
    //     );
    //     let receipt = await tx.wait();
    //     const token0 = await lending.asset();
    //     const token1 = await collateral.asset();
    //     const token0Instance = loadContractInstance(token0, ERC20_ABI, deployMaster);
    //     const token1Instance = loadContractInstance(token1, ERC20_ABI, deployMaster);
    //     console.log({
    //         collateralAmount: await plpInstance.depositedAmount(
    //             deployMaster.address,
    //             collateral.address
    //         ),
    //         collateralBalanceInContract: await collateral.balanceOf(plpLeverageInstance.address),
    //         lendingBalanceInContract: await lending.balanceOf(plpLeverageInstance.address),
    //         token0BalanceInContract: await token0Instance.balanceOf(plpLeverageInstance.address),
    //         token1BalanceInContract: await token1Instance.balanceOf(plpLeverageInstance.address),
    //     });
    // }).timeout(1000000);

    it("ERC4626 as collateral And ERC20 as lending", async function () {
        const {
            platfrom,
            collateral,
            collateralInfo,
            depositAmount,
            lending,
            lendingInfo,
            supplyAmount,
            borrowAmount
        } = await helpers.loadFixture(depositERC4626AndSupplyERC20);
        const { plpInstance, plpLeverageInstance } = platfrom.contractInstance;

        console.log({
            balanceCollateral: await collateral.balanceOf(deployMaster.address),
            balanceLending: await lending.balanceOf(deployMaster.address),
            depositedAmount: await plpInstance.depositedAmount(
                deployMaster.address,
                collateral.address
            ),
            totalOutstanding: await plpInstance.totalOutstanding(
                deployMaster.address,
                collateral.address,
                lending.address
            ),
            supplyAmount: supplyAmount.toString(),
            borrowAmount: borrowAmount.toString(),
        });

        const estimateData = await estimate(
            lendingInfo,
            collateralInfo,
            "300000000000000000000",
            plpLeverageInstance.address,
            "0.05",
            "1",
            Dex.Paraswap,
            deployMaster.provider
        );
        const notionalValue = borrowAmount.div(toBN(`0x${(10**(lendingInfo.decimals - 6)).toString(16)}`));;
        console.log("estimateData", estimateData);
        await collateral.approve(plpLeverageInstance.address, hre.ethers.constants.MaxUint256)
        await lending.approve(plpLeverageInstance.address, hre.ethers.constants.MaxUint256)
        let tx = await plpLeverageInstance.leveragedBorrow(
            getTokenTuple(collateralInfo),
            getTokenTuple(lendingInfo),
            notionalValue,
            depositAmount.mul(110).div(100),
            estimateData.buyCallData,
            "1",
            [],
            []
        );
        let receipt = await tx.wait();
        // const token0 = await lending.asset();
        // const token0Instance = loadContractInstance(token0, ERC20_ABI, deployMaster);
        console.log({
            collateralAmount: await plpInstance.depositedAmount(
                deployMaster.address,
                collateral.address
            ),
            collateralBalanceInContract: await collateral.balanceOf(plpLeverageInstance.address),
            lendingBalanceInContract: await lending.balanceOf(plpLeverageInstance.address),
            // token0BalanceInContract: await token0Instance.balanceOf(plpLeverageInstance.address),
        });
    }).timeout(1000000);
});
