require("dotenv").config();
const hre = require("hardhat");
const { ethers } = require("ethers");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { swapFromLPToERC20 } = require("./estimate-scripts/swapFromLPToERC20");
const { swapFromERC20ToLP } = require("./estimate-scripts/swapFromERC20ToLP");
const { DAI, USDC, USDT, DAI_USDC, OPENOCEAN_EXCHANGE } = require("./utils/constants");
const { deployPlatform } = require("./utils/deployPlatform");
const { loadContractInstance } = require("./estimate-scripts/loadContract");
const { ERC20_ABI } = require("./estimate-scripts/abis/ERC20");

const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);

describe("RepayAtomic", function () {

    let signers;
    let deployMaster;

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
            dai_usdc: loadContractInstance(DAI_USDC, ERC20_ABI, deployMaster)
        };

        await setBalance(DAI, deployMaster.address, toBN("100000000000000000000000"));
        await setBalance(USDC, deployMaster.address, toBN("100000000000000000000000"));
        await setBalance(USDT, deployMaster.address, toBN("100000000000000000000000"));
        await setBalance(DAI_USDC, deployMaster.address, toBN("100000000000000000000000"));

        const platfrom = await deployPlatform();
        return {
            tokenInstances,
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

    async function borrowERC20AndUsingLpToRepayAtomic() {
        const {
            tokenInstances,
            platfrom
        } = await loadFixture();
        // Deposit DAI_USDC
        await tokenInstances.dai_usdc.approve(platfrom.addresses.plpAddress, hre.ethers.constants.MaxUint256);
        const depositAmount = toBN("100000000000000");
        await platfrom.contractInstance.plpInstance.deposit(DAI_USDC, depositAmount);
        // Supply USDT
        const bUSDT = (await platfrom.contractInstance.plpInstance.lendingTokenInfo(USDT)).bLendingToken;
        await tokenInstances.usdt.approve(bUSDT, hre.ethers.constants.MaxUint256);
        await platfrom.contractInstance.plpInstance.supply(USDT, toBN("1000000000000"));
        // Borrow USDT
        const borrowAmount = await platfrom.contractInstance.plpInstance.getLendingAvailableToBorrow(
            deployMaster.address,
            DAI_USDC,
            USDT
        );
        await platfrom.contractInstance.plpInstance.borrow(
            DAI_USDC,
            USDT,
            borrowAmount,
            [],
            []
        );
        return {
            tokenInstances,
            platfrom,
            depositAmount,
            borrowAmount
        }
    }

    async function borrowLPAndUsingERC20ToRepayAtomic() {
        const {
            tokenInstances,
            platfrom
        } = await loadFixture();
        // Deposit USDT
        await tokenInstances.usdt.approve(platfrom.addresses.plpAddress, hre.ethers.constants.MaxUint256);
        let depositAmount = toBN("1000000");
        await platfrom.contractInstance.plpInstance.deposit(USDT, depositAmount);
        // Supply DAI_USDC
        const bDAI_USDC = (await platfrom.contractInstance.plpInstance.lendingTokenInfo(DAI_USDC)).bLendingToken;
        await tokenInstances.dai_usdc.approve(bDAI_USDC, hre.ethers.constants.MaxUint256);
        await platfrom.contractInstance.plpInstance.supply(DAI_USDC, toBN("1257708237255000"));
        // Borrow DAI_USDC
        const borrowAmount = await platfrom.contractInstance.plpInstance.getLendingAvailableToBorrow(
            deployMaster.address,
            USDT,
            DAI_USDC
        );
        await platfrom.contractInstance.plpInstance.borrow(
            USDT,
            DAI_USDC,
            borrowAmount,
            [],
            []
        );
        depositAmount = depositAmount.mul(10000);
        await platfrom.contractInstance.plpInstance.deposit(USDT, depositAmount);
        return {
            tokenInstances,
            platfrom,
            depositAmount,
            borrowAmount
        }
    }


    it("borrow ERC20 And Using LP To RepayAtomic (Paraswap)", async function () {
        const {
            tokenInstances,
            platfrom,
            depositAmount,
            borrowAmount
        } = await helpers.loadFixture(borrowERC20AndUsingLpToRepayAtomic);
        
        const estimateData = await swapFromLPToERC20(
            DAI_USDC,
            depositAmount,
            USDT,
            borrowAmount,
            platfrom.addresses.plpAtomicRepayAddress,
            "0.05",
            "1",
            0,
            0,
            deployMaster
        );

        console.log({
            balanceLP: await tokenInstances.dai_usdc.balanceOf(deployMaster.address),
            balanceDAI: await tokenInstances.dai.balanceOf(deployMaster.address),
            balanceUSDC: await tokenInstances.usdc.balanceOf(deployMaster.address),
            balanceUSDT: await tokenInstances.usdt.balanceOf(deployMaster.address),
            depositedAmount: await platfrom.contractInstance.plpInstance.depositedAmount(
                deployMaster.address,
                DAI_USDC
            ),
            totalOutstanding: await platfrom.contractInstance.plpInstance.totalOutstanding(
                deployMaster.address,
                DAI_USDC,
                USDT
            )
        });

        let tx = await platfrom.contractInstance.plpAtomicRepayInstance.repayAtomic(
            [
                DAI_USDC,
                2
            ],
            estimateData.estimateAmountIn,
            estimateData.buyCallData,
            false,
            [],
            [],
            0
        );
        let receipt = await tx.wait();
        let events = receipt.events;
        let argsEvent;
        for (let i = 0; i < events.length; i++) {
            if (events[i]?.event == "AtomicRepayment") {
                argsEvent = events[i].args;
                break;
            }
        }
        console.log({
            argsEvent
        });

        console.log({
            balanceLP: await tokenInstances.dai_usdc.balanceOf(deployMaster.address),
            balanceDAI: await tokenInstances.dai.balanceOf(deployMaster.address),
            balanceUSDC: await tokenInstances.usdc.balanceOf(deployMaster.address),
            balanceUSDT: await tokenInstances.usdt.balanceOf(deployMaster.address),
            depositedAmount: await platfrom.contractInstance.plpInstance.depositedAmount(
                deployMaster.address,
                DAI_USDC
            ),
            totalOutstanding: await platfrom.contractInstance.plpInstance.totalOutstanding(
                deployMaster.address,
                DAI_USDC,
                USDT
            )
        });
        
    });

    it("borrow ERC20 And Using LP To RepayAtomic (OpenOcean)", async function () {
        const {
            tokenInstances,
            platfrom,
            depositAmount,
            borrowAmount
        } = await helpers.loadFixture(borrowERC20AndUsingLpToRepayAtomic);

        const estimateData = await swapFromLPToERC20(
            DAI_USDC,
            depositAmount,
            USDT,
            borrowAmount,
            platfrom.addresses.plpAtomicRepayAddress,
            "0.05",
            "1",
            1,
            0,
            deployMaster
        );

        await platfrom.contractInstance.plpAtomicRepayInstance.setExchangeAggregator(
            OPENOCEAN_EXCHANGE,
            hre.ethers.constants.AddressZero
        );

        console.log({
            balanceLP: await tokenInstances.dai_usdc.balanceOf(deployMaster.address),
            balanceDAI: await tokenInstances.dai.balanceOf(deployMaster.address),
            balanceUSDC: await tokenInstances.usdc.balanceOf(deployMaster.address),
            balanceUSDT: await tokenInstances.usdt.balanceOf(deployMaster.address),
            depositedAmount: await platfrom.contractInstance.plpInstance.depositedAmount(
                deployMaster.address,
                DAI_USDC
            ),
            totalOutstanding: await platfrom.contractInstance.plpInstance.totalOutstanding(
                deployMaster.address,
                DAI_USDC,
                USDT
            )
        });

        let tx = await platfrom.contractInstance.plpAtomicRepayInstance.repayAtomic(
            [
                DAI_USDC,
                2
            ],
            estimateData.estimateAmountIn,
            estimateData.buyCallData,
            false,
            [],
            [],
            0
        );
        let receipt = await tx.wait();
        let events = receipt.events;
        let argsEvent;
        for (let i = 0; i < events.length; i++) {
            if (events[i]?.event == "AtomicRepayment") {
                argsEvent = events[i].args;
                break;
            }
        }
        console.log({
            argsEvent
        });
        
        console.log({
            balanceLP: await tokenInstances.dai_usdc.balanceOf(deployMaster.address),
            balanceDAI: await tokenInstances.dai.balanceOf(deployMaster.address),
            balanceUSDC: await tokenInstances.usdc.balanceOf(deployMaster.address),
            balanceUSDT: await tokenInstances.usdt.balanceOf(deployMaster.address),
            depositedAmount: await platfrom.contractInstance.plpInstance.depositedAmount(
                deployMaster.address,
                DAI_USDC
            ),
            totalOutstanding: await platfrom.contractInstance.plpInstance.totalOutstanding(
                deployMaster.address,
                DAI_USDC,
                USDT
            )
        });
        
    });

    it("borrow LP And Using ERC20 To RepayAtomic (Paraswap)", async function () {
        const {
            tokenInstances,
            platfrom,
            depositAmount,
            borrowAmount
        } = await helpers.loadFixture(borrowLPAndUsingERC20ToRepayAtomic);
        
        const estimateData = await swapFromERC20ToLP(
            USDT,
            depositAmount,
            DAI_USDC,
            borrowAmount,
            platfrom.addresses.plpAtomicRepayAddress,
            "0.05",
            "1",
            0,
            0,
            deployMaster
        );

        console.log({
            balanceLP: await tokenInstances.dai_usdc.balanceOf(deployMaster.address),
            balanceDAI: await tokenInstances.dai.balanceOf(deployMaster.address),
            balanceUSDC: await tokenInstances.usdc.balanceOf(deployMaster.address),
            balanceUSDT: await tokenInstances.usdt.balanceOf(deployMaster.address),
            depositedAmount: await platfrom.contractInstance.plpInstance.depositedAmount(
                deployMaster.address,
                USDT
            ),
            totalOutstanding: await platfrom.contractInstance.plpInstance.totalOutstanding(
                deployMaster.address,
                USDT,
                DAI_USDC
            )
        });
  
        let tx = await platfrom.contractInstance.plpAtomicRepayInstance.repayAtomic(
            [
                USDT,
                0
            ],
            estimateData.estimateAmountIn,
            estimateData.buyCallData,
            false,
            [],
            [],
            2
        );
        let receipt = await tx.wait();
        let events = receipt.events;
        let argsEvent;
        for (let i = 0; i < events.length; i++) {
            if (events[i]?.event == "AtomicRepayment") {
                argsEvent = events[i].args;
                break;
            }
        }
        console.log({
            argsEvent
        });

        console.log({
            balanceLP: await tokenInstances.dai_usdc.balanceOf(deployMaster.address),
            balanceDAI: await tokenInstances.dai.balanceOf(deployMaster.address),
            balanceUSDC: await tokenInstances.usdc.balanceOf(deployMaster.address),
            balanceUSDT: await tokenInstances.usdt.balanceOf(deployMaster.address),
            depositedAmount: await platfrom.contractInstance.plpInstance.depositedAmount(
                deployMaster.address,
                USDT
            ),
            totalOutstanding: await platfrom.contractInstance.plpInstance.totalOutstanding(
                deployMaster.address,
                USDT,
                DAI_USDC
            )
        });
    });

    it("borrow LP And Using ERC20 To RepayAtomic (OpenOcean)", async function () {
        const {
            tokenInstances,
            platfrom,
            depositAmount,
            borrowAmount
        } = await helpers.loadFixture(borrowLPAndUsingERC20ToRepayAtomic);
        
        const estimateData = await swapFromERC20ToLP(
            USDT,
            depositAmount,
            DAI_USDC,
            borrowAmount,
            platfrom.addresses.plpAtomicRepayAddress,
            "0.05",
            "1",
            1,
            0,
            deployMaster
        );

        await platfrom.contractInstance.plpAtomicRepayInstance.setExchangeAggregator(
            OPENOCEAN_EXCHANGE,
            hre.ethers.constants.AddressZero
        );

        console.log({
            balanceLP: await tokenInstances.dai_usdc.balanceOf(deployMaster.address),
            balanceDAI: await tokenInstances.dai.balanceOf(deployMaster.address),
            balanceUSDC: await tokenInstances.usdc.balanceOf(deployMaster.address),
            balanceUSDT: await tokenInstances.usdt.balanceOf(deployMaster.address),
            depositedAmount: await platfrom.contractInstance.plpInstance.depositedAmount(
                deployMaster.address,
                USDT
            ),
            totalOutstanding: await platfrom.contractInstance.plpInstance.totalOutstanding(
                deployMaster.address,
                USDT,
                DAI_USDC
            )
        });

        let tx = await platfrom.contractInstance.plpAtomicRepayInstance.repayAtomic(
            [
                USDT,
                0
            ],
            estimateData.estimateAmountIn,
            estimateData.buyCallData,
            false,
            [],
            [],
            2
        );
        let receipt = await tx.wait();
        let events = receipt.events;
        let argsEvent;
        for (let i = 0; i < events.length; i++) {
            if (events[i]?.event == "AtomicRepayment") {
                argsEvent = events[i].args;
                break;
            }
        }
        console.log({
            argsEvent
        });

        console.log({
            balanceLP: await tokenInstances.dai_usdc.balanceOf(deployMaster.address),
            balanceDAI: await tokenInstances.dai.balanceOf(deployMaster.address),
            balanceUSDC: await tokenInstances.usdc.balanceOf(deployMaster.address),
            balanceUSDT: await tokenInstances.usdt.balanceOf(deployMaster.address),
            depositedAmount: await platfrom.contractInstance.plpInstance.depositedAmount(
                deployMaster.address,
                USDT
            ),
            totalOutstanding: await platfrom.contractInstance.plpInstance.totalOutstanding(
                deployMaster.address,
                USDT,
                DAI_USDC
            )
        });
    });
});
