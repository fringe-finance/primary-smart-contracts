const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);


module.exports = {

    // borrowAPY = 1%
    // borrowRatePerBlock = borrowAPY * 10**18 / blocksInYear = 1% * 10**18 / 2102400 = 0.01 * 10**18 / 2102400 = 4756468797
    borrowRateMantissa : toBN("4756468797"), 
    stabilityFeeMantissa : toBN(25).mul(toBN(10).pow(13)),
    liquidatorIncentiveMantissa : toBN(12).mul(toBN(10).pow(17)),
    borrowLimit : toBN(1_000_000).mul(toBN(10).pow(toBN(6))),

    prj1Address : '0x40EA2e5c5b2104124944282d8db39C5D13ac6770',
    prj2Address : '0x69648Ef43B7496B1582E900569cd9dDEc49C045e',
    prj3Address : '0xfA91A86700508806AD2A49Bebce34a08c6ad7a65',
    prj4Address : '0xc6636b088AB0f794DDfc1204e7C58D8148f62203',
    prj5Address : '0x37a7D483d2dfe97d0C00cEf6F257e25d321e6D4e',
    prj6Address : '0x16E2f279A9BabD4CE133745DdA69C910CBe2e490',

    uniswapPairPrj1Address : '0x1E27b2397f5faF5A3e7C318264e605f8DF7e5DeA',
    uniswapPairPrj2Address : '0x271509D9645e04d45801dd4D2Ce6D4b5001762d1',
    uniswapPairPrj3Address : '0xE2E11D0F0D0C8Ca05f223c4a83Bb8eAC50fC9673',
    uniswapPairPrj4Address : '0x6D5e5B430A5ae439c7D5892E26bD539E3b5f8e77',
    uniswapPairPrj5Address : '0x27990Ad43692469531Bf4f8A7f44822A4AE813e0',
    uniswapPairPrj6Address : '0xe5Eb9A95a9b71aEE01914AE2F6C3dCCcB7aC1791',
   
    WETHrinkeby : '0xc778417e063141139fce010982780140aa0cd5ab', // https://rinkeby.etherscan.io/token/0xc778417e063141139fce010982780140aa0cd5ab
    chainlinkAggregatorV3_WETHrinkeby : '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e', // https://docs.chain.link/docs/ethereum-addresses/#Rinkeby%20Testnet

    lvrNumerator : 6,
    lvrDenominator : 10,
    ltfNumerator : 12,
    ltfDenominator : 10,

    governanceTokenAddress :  '0x40EA2e5c5b2104124944282d8db39C5D13ac6770',
}