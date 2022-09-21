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

    prj1Address: '0x359d51f1164478C776dC8A71458c7570fC8b6D9D',
    prj2Address: '0x6e59c4a1eD72A9F5bFd12d9f2b172Cc91fcDB97E',
    prj3Address: '0x802B13F8A025357E5560D0FbEAbF7960114b36be',
    prj4Address: '0x8D2A604F483ab446ff36FAb8C7a41C943c773a1a',
    prj5Address: '0xD5443da5EE0cF18021e2cD7c17D4009f0A6BEAD2',
    prj6Address: '0x86E97AC95f5Af248DEBa24400B34E41b21176F83',

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

    prj1Address: '0x359d51f1164478C776dC8A71458c7570fC8b6D9D',
    prj2Address: '0x6e59c4a1eD72A9F5bFd12d9f2b172Cc91fcDB97E',
    prj3Address: '0x802B13F8A025357E5560D0FbEAbF7960114b36be',
    prj4Address: '0x8D2A604F483ab446ff36FAb8C7a41C943c773a1a',
    prj5Address: '0xD5443da5EE0cF18021e2cD7c17D4009f0A6BEAD2',
    prj6Address: '0x86E97AC95f5Af248DEBa24400B34E41b21176F83',
    // uniswapPairPrj1Address : '0x1E27b2397f5faF5A3e7C318264e605f8DF7e5DeA',
    // uniswapPairPrj2Address : '0x271509D9645e04d45801dd4D2Ce6D4b5001762d1',
    // uniswapPairPrj3Address : '0xE2E11D0F0D0C8Ca05f223c4a83Bb8eAC50fC9673',
    // uniswapPairPrj4Address : '0x6D5e5B430A5ae439c7D5892E26bD539E3b5f8e77',
    // uniswapPairPrj5Address : '0x27990Ad43692469531Bf4f8A7f44822A4AE813e0',
    // uniswapPairPrj6Address : '0xe5Eb9A95a9b71aEE01914AE2F6C3dCCcB7aC1791',
   
    WETH : '0xc778417e063141139fce010982780140aa0cd5ab', // https://rinkeby.etherscan.io/token/0xc778417e063141139fce010982780140aa0cd5ab
    chainlinkAggregatorV3_WETH_USD : '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e', // https://docs.chain.link/docs/ethereum-addresses/#Rinkeby%20Testnet pair ETH / USD

    LINK : '0x5183e6Ce9621aF6357649c9873248C341a44Ce5C', // custom token 
    chainlinkAggregatorV3_LINK_USD : '0xd8bD0a1cB028a31AA859A21A3758685a95dE4623', // https://docs.chain.link/docs/ethereum-addresses/#Rinkeby%20Testnet pair LINK / USD

    MATIC: '0x311a110a88664f048E1B08F29BcC7EefBB3c2da7', // custom token
    chainlinkAggregatorV3_MATIC_USD : '0x7794ee502922e2b723432DDD852B3C30A911F021', // https://docs.chain.link/docs/ethereum-addresses/#Rinkeby%20Testnet pair MATIC / USD

    WBTC : '0x37ef20064B0A661043905f862fE3CF9d753eF7Cd', // custom token
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
    USDCTest : '0xd4D6B474af50dF63D7Bc004f86bD4E66A375d3Da',

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

    admin : '0xaB67F661b45e86a4e5120FC39Ce24e42ea3447FD'

}