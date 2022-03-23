// https://compound.finance/docs#protocol-math

function compoundCodeForApy(){
    const ethMantissa = 1e18;
    const blocksPerDay = 6570; // 13.15 seconds per block
    const daysPerYear = 365;
    
    // const supplyRatePerBlock = await cToken.methods.supplyRatePerBlock().call();
    // const borrowRatePerBlock = await cToken.methods.borrowRatePerBlock().call();
    const supplyApy = (((Math.pow((supplyRatePerBlock / ethMantissa * blocksPerDay) + 1, daysPerYear))) - 1) * 100;
    const borrowApy = (((Math.pow((borrowRatePerBlock / ethMantissa * blocksPerDay) + 1, daysPerYear))) - 1) * 100;
    console.log(`Supply APY for ETH ${supplyApy} %`);
    console.log(`Borrow APY for ETH ${borrowApy} %`);
}


function calculateSupplyApy(supplyRatePerBlock) {
    const ethMantissa = 1e18;
    const blocksPerDay = 6570; // 13.15 seconds per block
    const daysPerYear = 365;
    return (((Math.pow((supplyRatePerBlock / ethMantissa * blocksPerDay) + 1, daysPerYear))) - 1) * 100;
}

function calculateBorrowyApy(borrowRatePerBlock) {
    const ethMantissa = 1e18;
    const blocksPerDay = 6570; // 13.15 seconds per block
    const daysPerYear = 365;
    return (((Math.pow((borrowRatePerBlock / ethMantissa * blocksPerDay) + 1, daysPerYear))) - 1) * 100;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param wishedApy - the percent of wished APY. Max value: 1000000000. If enter the bigger value - the result will be uncontrolled
 * @returns borrowRatePerBlock which fits to wished APY 
 */
async function findBorrowRatePerBlock(wishedApy) {
    let borrowRateLeft = 0
    let borrowRateRight = 1e13//290000000000
    let borrowRateMiddle
    let tempApy = calculateBorrowyApy(borrowRateRight)
    while (Math.abs(wishedApy - tempApy) > 0.0001) {
        borrowRateMiddle = (borrowRateRight + borrowRateLeft) / 2
        tempApy = calculateBorrowyApy(borrowRateMiddle)
        if (tempApy > wishedApy) {
            borrowRateRight = borrowRateMiddle;
        } else {
            borrowRateLeft = borrowRateMiddle;
        }
        // console.log()
        // console.log("wishedApy: " + wishedApy);
        // console.log("tempApy: " + tempApy);
        // console.log("borrowRateLeft: " + borrowRateLeft)
        // console.log("borrowRateMiddle: " + borrowRateMiddle)
        // console.log("borrowRateRight: " + borrowRateRight)
        //await sleep(500)
    }
    return Math.floor(borrowRateMiddle)
}

/**
 * @param wishedApy - the percent of wished APY. Max value: 1000000000. If enter the bigger value - the result will be uncontrolled
 * @returns borrowRatePerBlock which fits to wished APY 
 */
 async function findSupplyRatePerBlock(wishedApy) {
    let supplyRateLeft = 0
    let supplyRateRight = 1e13//290000000000
    let supplyRateMiddle
    let tempApy = calculateBorrowyApy(supplyRateRight)
    while (Math.abs(wishedApy - tempApy) > 0.0001) {
        supplyRateMiddle = (supplyRateRight + supplyRateLeft) / 2
        tempApy = calculateBorrowyApy(supplyRateMiddle)
        if (tempApy > wishedApy) {
            supplyRateRight = supplyRateMiddle;
        } else {
            supplyRateLeft = supplyRateMiddle;
        }
        // console.log()
        // console.log("wishedApy: " + wishedApy);
        // console.log("tempApy: " + tempApy);
        // console.log("supplyRateLeft: " + supplyRateLeft)
        // console.log("supplyRateMiddle: " + supplyRateMiddle)
        // console.log("supplyRateRight: " + supplyRateRight)
        //await sleep(500)
    }
    return Math.floor(supplyRateMiddle)
}

async function main() {
    let wishedBorrowAPY = 0.25 //[APY] = %
    let borrowRatePerBlock = await findBorrowRatePerBlock(wishedBorrowAPY)
    console.log("borrowRatePerBlock: " + borrowRatePerBlock)
    let borrowAPY = calculateBorrowyApy(borrowRatePerBlock)
    console.log("borrowAPY: " + borrowAPY)

    let wishedSupplyAPY = 1.1 //[APY] = %
    let supplyRatePerBlock = await findSupplyRatePerBlock(wishedSupplyAPY)
    console.log("supplyRatePerBlock: " + supplyRatePerBlock)
    let supplyAPY = calculateSupplyApy(supplyRatePerBlock)
    console.log("supplyAPY: " + supplyAPY)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
