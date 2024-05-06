require("dotenv").config();
const hre = require("hardhat");
const { ethers } = require("ethers");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { estimate } = require("./estimate-scripts");
const { DAI, USDC, USDT, DAI_USDC, OPENOCEAN_EXCHANGE, USDC_USDT, USDC_4626, DAI_4626 } = require("./utils/constants");
const { deployPlatform } = require("./utils/deployPlatform");
const { loadContractInstance } = require("./estimate-scripts/utils/loadContract");
const { ERC20_ABI } = require("./estimate-scripts/abis/ERC20");
const { ERC4626_ABI } = require("./estimate-scripts/abis/ERC4626");
const { Dex } = require("./estimate-scripts/enum/dexType");
const { Pair } = require("./estimate-scripts/enum/pairType");
const { UniswapV2Pair_ABI } = require("./estimate-scripts/abis/UniswapV2Pair");
const { TokenType } = require("./estimate-scripts/enum/tokenType");

const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);

describe("RepayAtomic", function () {

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
    const borrow = async (
        collateral, collateralInfo, 
        lending, lendingInfo, 
        borrowAmount,
        plpInstance,
        plpAtomicRepayInstance,
    ) => {
        console.log({
            borrowAmount: borrowAmount.toString(),
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
            )
        });

        const estimateData = await estimate(
            collateralInfo,
            lendingInfo,
            borrowAmount,
            plpAtomicRepayInstance.address,
            "0.05",
            "1",
            Dex.Paraswap,
            deployMaster.provider
        );

        console.log("estimateData", estimateData)
        const tx = await plpAtomicRepayInstance.repayAtomic(
            getTokenTuple(collateralInfo),
            getTokenTuple(lendingInfo),
            estimateData.estimateAmountIn.mul(110).div(100),
            estimateData.buyCallData,
            false,
            [],
            []
        );
        return tx;
    }
    const logRepayTransactionResult = async (tx, collateralInstance, lendingInstance, plpInstance, plpAtomicRepayInstance) => {
        let receipt = await tx.wait();
        let events = receipt.events;
        let argsEvent;
        for (const element of events) {
            if (element?.event == "AtomicRepayment") {
                argsEvent = element.args;
                break;
            }
        }
        console.log({
            argsEvent
        });
        console.log({
            balanceCollateral: await collateralInstance.balanceOf(deployMaster.address),
            balanceLending: await lendingInstance.balanceOf(deployMaster.address),
            depositedAmount: await plpInstance.depositedAmount(
                deployMaster.address,
                collateralInstance.address
            ),
            totalOutstanding: await plpInstance.totalOutstanding(
                deployMaster.address,
                collateralInstance.address,
                lendingInstance.address
            ),
            balanceLendingInContract: await lendingInstance.balanceOf(plpAtomicRepayInstance.address),
            balanceCollateralInContract: await collateralInstance.balanceOf(plpAtomicRepayInstance.address),
        });
    }
    async function resetNetwork() {
        console.log("Forking network");
        const rpc = `https://${process.env.CHAIN.replace("_", "-")}.infura.io/v3/${process.env.INFURA_KEY}`;
        const currentBlock = process.env.BLOCK_NUMBER;
        console.log("Fork network from block", currentBlock);
        await helpers.reset(rpc, Number(currentBlock));
        console.log("Completed to fork network");
        console.log();
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
        await setBalance(DAI, deployMaster.address, toBN("100000000000000000000000"));
        await setBalance(USDC, deployMaster.address, toBN("100000000000000000000000"));
        await setBalance(USDT, deployMaster.address, toBN("100000000000000000000000"));
        await setBalance(DAI_USDC, deployMaster.address, toBN("100000000000000000000000"));
        await setBalance(USDC_USDT, deployMaster.address, toBN("100000000000000000000000"));
        
        await tokenInstances.usdc.approve(tokenInstances.usdc_4626.address, hre.ethers.constants.MaxUint256);
        await tokenInstances.usdc_4626.deposit("10000000000", deployMaster.address);

        await tokenInstances.dai.approve(tokenInstances.dai_4626.address, hre.ethers.constants.MaxUint256);
        await tokenInstances.dai_4626.deposit("10000000000000000000000", deployMaster.address);
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
        const promises = []
        for (let i = 0; i < 40; i++) {
            const index = ethers.utils.solidityKeccak256(["uint256", "uint256"], [user, i]);
            promises.push(
                helpers.setStorageAt(
                    token,
                    index,
                    ethers.utils.hexlify(
                        ethers.utils.zeroPad(newBalance.toHexString(), 32)
                    ).toString()
                )
            );
        }
        await Promise.all(promises);
    }
    async function setupBorrow(collateralAddress, lendingAddress) {
        const {
            tokenInstances,
            tokenInfo,
            platfrom
        } = await loadFixture();

        const collateral = Object.values(tokenInstances).find(token => token.address.toLowerCase() === collateralAddress.toLowerCase());
        const collateralAmount = tokenInfo[collateral.address].pairType ? 0.000000001 : 1000;
        const depositAmount = (toBN("10").pow(tokenInfo[collateral.address].decimals)).mul(collateralAmount * 10e9).div(10e9);
        const lending = Object.values(tokenInstances).find(token => token.address.toLowerCase() === lendingAddress.toLowerCase());
        const lendingAmount = tokenInfo[lending.address].pairType ? 0.00001 : 5000;
        const lendingSupplyAmount = (toBN("10").pow(tokenInfo[lending.address].decimals)).mul(lendingAmount * 100000).div(100000);

        // Deposit collateral token
        await collateral.approve(platfrom.addresses.plpAddress, hre.ethers.constants.MaxUint256);
        await platfrom.contractInstance.plpInstance.deposit(collateral.address, depositAmount);
        // Supply lending token
        const bToken = (await platfrom.contractInstance.plpInstance.lendingTokenInfo(lending.address)).bLendingToken;
        await lending.approve(bToken, hre.ethers.constants.MaxUint256);
        await platfrom.contractInstance.plpInstance.supply(lending.address, toBN(lendingSupplyAmount));
        // Borrow lending token by collateral token
        const borrowAmount = await platfrom.contractInstance.plpInstance.getLendingAvailableToBorrow(
            deployMaster.address,
            collateral.address,
            lending.address
        );
        console.log({borrowAmount})
        await platfrom.contractInstance.plpInstance.borrow(
            collateral.address,
            lending.address,
            borrowAmount,
            [],
            []
        );
        return {
            platfrom,
            collateral,
            collateralInfo: tokenInfo[collateral.address],
            lending,
            lendingInfo: tokenInfo[lending.address],
            depositAmount,
            borrowAmount
        }
    }
    function borrowERC4626AndUsingERC4626ToRepayAtomic() {
        return setupBorrow(USDC_4626, DAI_4626);
    }
    function borrowERC20AndUsingERC4626ToRepayAtomic() {
        return setupBorrow(USDC_4626, DAI);
    }
    function borrowERC4626AndUsingLPToRepayAtomic() {
        return setupBorrow(USDC_USDT, USDC_4626);
    }

    it("borrow ERC4626 And Using ERC4626 To RepayAtomic (Paraswap)", async function () {
        const {
            platfrom,
            borrowAmount,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
        } = await helpers.loadFixture(borrowERC4626AndUsingERC4626ToRepayAtomic);
        
       const tx = await borrow(
            collateral, collateralInfo,
            lending, lendingInfo,
            borrowAmount,
            platfrom.contractInstance.plpInstance,
            platfrom.contractInstance.plpAtomicRepayInstance
        )
        await logRepayTransactionResult(
            tx,
            collateral, lending,
            platfrom.contractInstance.plpInstance,
            platfrom.contractInstance.plpAtomicRepayInstance
        );
    }).timeout(1000000);

    it("borrow ERC20 And Using ERC4626 To RepayAtomic (Paraswap)", async function () {
        const {
            platfrom,
            borrowAmount,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
        } = await helpers.loadFixture(borrowERC20AndUsingERC4626ToRepayAtomic);
        
       const tx = await borrow(
            collateral, collateralInfo,
            lending, lendingInfo,
            borrowAmount,
            platfrom.contractInstance.plpInstance,
            platfrom.contractInstance.plpAtomicRepayInstance
        )
        await logRepayTransactionResult(
            tx,
            collateral, lending,
            platfrom.contractInstance.plpInstance,
            platfrom.contractInstance.plpAtomicRepayInstance
        );
    }).timeout(1000000);

    it("borrow ERC4626 And Using LP To RepayAtomic (Paraswap)", async function () {
        const {
            platfrom,
            borrowAmount,
            collateral,
            collateralInfo,
            lending,
            lendingInfo,
        } = await helpers.loadFixture(borrowERC4626AndUsingLPToRepayAtomic);
        
       const tx = await borrow(
            collateral, collateralInfo,
            lending, lendingInfo,
            borrowAmount,
            platfrom.contractInstance.plpInstance,
            platfrom.contractInstance.plpAtomicRepayInstance
        )
        await logRepayTransactionResult(
            tx,
            collateral, lending,
            platfrom.contractInstance.plpInstance,
            platfrom.contractInstance.plpAtomicRepayInstance
        );
    }).timeout(1000000);

});
