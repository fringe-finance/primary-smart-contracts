require("dotenv").config();
const hre = require("hardhat");
const { ethers } = require("ethers");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { swapFromLPToERC20 } = require("./estimate-scripts/swapFromLPToERC20");
const { swapFromERC20ToLP } = require("./estimate-scripts/swapFromERC20ToLP");
const { DAI, USDC, USDT, DAI_USDC } = require("./utils/constants");

const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);

describe("EstimateScript", function () {

    async function loadFixture() {
        signers = await hre.ethers.getSigners();
        deployMaster = signers[0];
        await setBalance(DAI, deployMaster.address, toBN("100000000000000000000000"));
        await setBalance(USDC, deployMaster.address, toBN("100000000000000000000000"));
        await setBalance(USDT, deployMaster.address, toBN("100000000000000000000000"));
    }
    async function setBalance(token, user, newBalance) {
        for (let i = 0; i < 20; i++) {
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
    beforeEach(async function(){
        await loadFixture();
    });

    it("swap LP => ERC20 with Paraswap", async function () {
        const estimateData = await swapFromLPToERC20(
            DAI_USDC,
            toBN("10000000000000000"),
            USDT,
            toBN("123456"),
            deployMaster.address,
            "0.05",
            "1",
            0,
            0,
            deployMaster
        );

        console.log({
            tokenIn: estimateData.tokenIn,
            estimateAmountIn: estimateData.estimateAmountIn.toString(),
            tokenOut: estimateData.tokenOut,
            expectedAmountOut: estimateData.expectedAmountOut.toString(),
            actualAmountOut: estimateData.actualAmountOut.toString(),
            // buyCallData: estimateData.buyCallData,
            status: estimateData.status
        });
    });

    it("swap LP => ERC20 with OpenOcean", async function () {
        const estimateData = await swapFromLPToERC20(
            DAI_USDC,
            toBN("10000000000000000"),
            USDT,
            toBN("123456"),
            deployMaster.address,
            "0.05",
            "1",
            1,
            0,
            deployMaster
        );

        console.log({
            tokenIn: estimateData.tokenIn,
            estimateAmountIn: estimateData.estimateAmountIn.toString(),
            tokenOut: estimateData.tokenOut,
            expectedAmountOut: estimateData.expectedAmountOut.toString(),
            actualAmountOut: estimateData.actualAmountOut.toString(),
            // buyCallData: estimateData.buyCallData,
            status: estimateData.status
        });
    });


    it("swap ERC20 => LP with Paraswap", async function () {
        const estimateData = await swapFromERC20ToLP(
            USDT,
            toBN("100000000000000"),
            DAI_USDC,
            toBN("1000000000000"),
            deployMaster.address,
            "0.05",
            "1",
            0,
            0,
            deployMaster
        );

        console.log({
            tokenIn: estimateData.tokenIn,
            estimateAmountIn: estimateData.estimateAmountIn.toString(),
            estimateAmountInBuyToken0: estimateData.estimateAmountInBuyToken0.toString(),
            estimateAmountInBuyToken1: estimateData.estimateAmountInBuyToken1.toString(),
            tokenOut: estimateData.tokenOut,
            expectedAmountOut: estimateData.expectedAmountOut.toString(),
            actualAmountOut: estimateData.actualAmountOut.toString(),
            // buyCallData: estimateData.buyCallData,
            status: estimateData.status
        });
    });

    it("swap ERC20 => LP with OpenOcean", async function () {
        const estimateData = await swapFromERC20ToLP(
            USDT,
            toBN("100000000000000"),
            DAI_USDC,
            toBN("1000000000000"),
            deployMaster.address,
            "0.05",
            "1",
            1,
            0,
            deployMaster
        );
        
        console.log({
            tokenIn: estimateData.tokenIn,
            estimateAmountIn: estimateData.estimateAmountIn.toString(),
            estimateAmountInBuyToken0: estimateData.estimateAmountInBuyToken0.toString(),
            estimateAmountInBuyToken1: estimateData.estimateAmountInBuyToken1.toString(),
            tokenOut: estimateData.tokenOut,
            expectedAmountOut: estimateData.expectedAmountOut.toString(),
            actualAmountOut: estimateData.actualAmountOut.toString(),
            // buyCallData: estimateData.buyCallData,
            status: estimateData.status
        });
    });
});
