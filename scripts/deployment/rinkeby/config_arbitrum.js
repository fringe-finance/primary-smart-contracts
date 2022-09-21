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

    prj1Address: '0x05Fa68d88f8c170E5e64D0734969D43f541D5fB7',
    prj2Address: '0x54fA7A66720bb64190B6C72393D2367B8083a777',
    prj3Address: '0x2fCabB640BDc5E23dD469f2b8F625236d063456c',
    prj4Address: '0x3299658b4b870D28905A3948DFF1d76644bE2424',
    prj5Address: '0x26BEadfB1fee6b78C7cE433d279D8c4b585936b6',
    prj6Address: '0x38fa53caee0DA949eE7896dda2F40c60DC8AE0be',

    // uniswapPairPrj1Address : '0x1E27b2397f5faF5A3e7C318264e605f8DF7e5DeA',
    // uniswapPairPrj2Address : '0x271509D9645e04d45801dd4D2Ce6D4b5001762d1',
    // uniswapPairPrj3Address : '0xE2E11D0F0D0C8Ca05f223c4a83Bb8eAC50fC9673',
    // uniswapPairPrj4Address : '0x6D5e5B430A5ae439c7D5892E26bD539E3b5f8e77',
    // uniswapPairPrj5Address : '0x27990Ad43692469531Bf4f8A7f44822A4AE813e0',
    // uniswapPairPrj6Address : '0xe5Eb9A95a9b71aEE01914AE2F6C3dCCcB7aC1791',
   
   
    // borrowAPY = 1%
    // borrowRatePerBlock = borrowAPY * 10**18 / blocksInYear = 1% * 10**18 / 2102400 = 0.01 * 10**18 / 2102400 = 4756468797
    borrowRateMantissa : toBN("4756468797"), 
    stabilityFeeMantissa : toBN(25).mul(toBN(10).pow(13)),
    liquidatorIncentiveMantissa : toBN(12).mul(toBN(10).pow(17)),
    borrowCap: toBN(2).pow(toBN(255)),

    prj1Address: '0x05Fa68d88f8c170E5e64D0734969D43f541D5fB7',
    prj2Address: '0x54fA7A66720bb64190B6C72393D2367B8083a777',
    prj3Address: '0x2fCabB640BDc5E23dD469f2b8F625236d063456c',
    prj4Address: '0x3299658b4b870D28905A3948DFF1d76644bE2424',
    prj5Address: '0x26BEadfB1fee6b78C7cE433d279D8c4b585936b6',
    prj6Address: '0x38fa53caee0DA949eE7896dda2F40c60DC8AE0be',
    // uniswapPairPrj1Address : '0x1E27b2397f5faF5A3e7C318264e605f8DF7e5DeA',
    // uniswapPairPrj2Address : '0x271509D9645e04d45801dd4D2Ce6D4b5001762d1',
    // uniswapPairPrj3Address : '0xE2E11D0F0D0C8Ca05f223c4a83Bb8eAC50fC9673',
    // uniswapPairPrj4Address : '0x6D5e5B430A5ae439c7D5892E26bD539E3b5f8e77',
    // uniswapPairPrj5Address : '0x27990Ad43692469531Bf4f8A7f44822A4AE813e0',
    // uniswapPairPrj6Address : '0xe5Eb9A95a9b71aEE01914AE2F6C3dCCcB7aC1791',
   
    WETH : '0x69D6Aca3ee6223bd5E30059d94B267d9b3c16841', // https://rinkeby.etherscan.io/token/0xc778417e063141139fce010982780140aa0cd5ab
    chainlinkAggregatorV3_WETH_USD : '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e', // https://docs.chain.link/docs/ethereum-addresses/#Rinkeby%20Testnet pair ETH / USD

    LINK : '0xBBE351286cAA73fBc917088E5e3F336a2018FBBB', // custom token 
    chainlinkAggregatorV3_LINK_USD : '0xd8bD0a1cB028a31AA859A21A3758685a95dE4623', // https://docs.chain.link/docs/ethereum-addresses/#Rinkeby%20Testnet pair LINK / USD

    MATIC: '0x0B574E6e9cd6f159dB6062e220c3976e63FAc126', // custom token
    chainlinkAggregatorV3_MATIC_USD : '0x7794ee502922e2b723432DDD852B3C30A911F021', // https://docs.chain.link/docs/ethereum-addresses/#Rinkeby%20Testnet pair MATIC / USD

    WBTC : '0x00FA31D99329E08D59859AC7452845A8bfEeccaC', // custom token
    chainlinkAggregatorV3_WBTC_WETH : '0x2431452A0010a43878bF198e170F6319Af6d27F4', // https://docs.chain.link/docs/ethereum-addresses/#Rinkeby%20Testnet pari BTC / ETH


    lvrNumerator : 6,
    lvrDenominator : 10,
    ltfNumerator : 12,
    ltfDenominator : 10,
    lvrNumerator : 6,
    lvrDenominator : 10,
    ltfNumerator : 12,
    ltfDenominator : 10,

    exchange : '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    USDCTest : '0x5ecf82A8e520f1c280694AfBe639ebD06A7dE249',

    nameUSD: 'USDCTest',
    symbolUSD : 'USDC',
    decimalUSD : '6',

    namePRJ1: 'ProjectToken1',
    symboPRJ1 : 'PRJ1',

    namePRJ2: 'ProjectToken2',
    symboPRJ2 : 'PRJ2',

    namePRJ3: 'ProjectToken3',
    symboPRJ3 : 'PRJ3',

    namePRJ4: 'ProjectToken4',
    symboPRJ4 : 'PRJ4',

    namePRJ5: 'ProjectToken5',
    symboPRJ5 : 'PRJ5',

    namePRJ6: 'ProjectToken6',
    symboPRJ6 : 'PRJ6',
    
    nameLINK: 'LINK',
    symbolLINK : 'LINK',
    decimalLINK : '18',

    nameMatic: 'MATIC',
    symbolMatic : 'MATIC',
    decimalMatic : '18',

    nameWbtc: 'WBTC',
    symbolWbtc : 'WBTC',
    decimalWbtc : '18',

    admin : '0x7EeC0663B4f0baE379200cCD944AD521af7d5F58'

}