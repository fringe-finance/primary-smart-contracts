const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let USDCmultiplier = toBN(10).pow(toBN(6))

let BONDmultiplier = toBN(10).mul(8)
let LINKmultiplier = toBN(10).mul(18)

let RENmultiplier = toBN(10).mul(18)
let MATICmultiplier = toBN(10).mul(18)
let OGNmultiplier = toBN(10).mul(18)
let UNNmultiplier = toBN(10).mul(18)

let PROSmultiplier = toBN(10).mul(18)
let IOTXmultiplier = toBN(10).mul(18)
 
let STAKmultiplier = toBN(10).mul(18)
let KAMPAYmultiplier = toBN(10).mul(18)
let TOMOmultiplier = toBN(10).mul(18)
 
let GLCHmultiplier = toBN(10).mul(18)
let GTONmultiplier = toBN(10).mul(18)
let DFYNmultiplier = toBN(10).mul(18)

module.exports = {

    //===== JUMP RATE MODEL PARAMS =====//
    multiplier : toBN(10).pow(toBN(18)),
    baseRatePerBlock : toBN(9512937595),
    blocksPerYear : toBN(2102400),
    jumpMultiplierPerBlock : toBN(1902587519025),
    multiplierPerBlock : toBN(107020547945),
    kink : toBN("800000000000000000"),
    //===== END JUMP RATE MODEL PARAMS =====//

    //===== LENDING TOKEN =====//

    USDC : '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    

    //===== END LENDING TOKEN =====//

    //===== BUSDC PARAMS =====//

    initialExchangeRateMantissa : toBN(10).pow(toBN(18)),
    reserveFactorMantissa : toBN(25).mul(toBN(10).pow(toBN(16))),
    name : "BUSDC Token",
    symbol : "BUSDC",
    decimals : toBN(6),

    //===== END BUSDC PARAMS =====//

    //===== PROJECT TOKENS =====//
    
    BOND : '0x5dc02ea99285e17656b8350722694c35154db1e8',
    LINK : '0x514910771af9ca656af840dff83e8264ecf986ca',

    REN : '0x408e41876cCCDC0F92210600ef50372656052a38',
    MATIC : '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
    OGN : '0x8207c1FfC5B6804F6024322CcF34F29c3541Ae26',
    UNN : '0x226f7b842E0F0120b7E194D05432b3fd14773a9D',


    PROS : '0x8642A849D0dcb7a15a974794668ADcfbe4794B56',
    IOTX : '0x6fB3e0A217407EFFf7Ca062D46c26E5d60a14d69',

    STAK : '0x1F8A626883d7724DBd59eF51CBD4BF1Cf2016D13',
    KAMPAY : '0x3907e6ff436e2b2B05D6B929fb05F14c0ee18d90',
    TOMO : '0x05d3606d5c81eb9b7b18530995ec9b29da05faba',

    GLCH : '0x038a68ff68c393373ec894015816e33ad41bd564',
    GTON : '0x01e0e2e61f554ecaaec0cc933e739ad90f24a86d',
    DFYN : '0x9695e0114e12c0d3a3636fab5a18e6b737529023',

    //===== END PROJECT TOKENS =====//

    //===== PROJECT TOKENS multipliers=====//

    // BONDmultiplier : toBN(10).mul(8),
    // LINKmultiplier : toBN(10).mul(18),

    // RENmultiplier : toBN(10).mul(18),
    // MATICmultiplier : toBN(10).mul(18),
    // OGNmultiplier : toBN(10).mul(18),
    // UNNmultiplier : toBN(10).mul(18),


    // PROSmultiplier : toBN(10).mul(18),
    // IOTXmultiplier : toBN(10).mul(18),

    // STAKmultiplier : toBN(10).mul(18),
    // KAMPAYmultiplier : toBN(10).mul(18),
    // TOMOmultiplier : toBN(10).mul(18),

    // GLCHmultiplier : toBN(10).mul(18),
    // GTONmultiplier : toBN(10).mul(18),
    // DFYNmultiplier : toBN(10).mul(18),    

    //===== END PROJECT TOKENS multipliers=====//

    //===== PROJECT TOKENS PARAMS =====//
    
    MATIC_loanToValueRatioNumerator : toBN(6),
    MATIC_loanToValueRatioDenominator : toBN(10),
    MATIC_liquidationTresholdFactorNumerator : toBN(1),
    MATIC_liquidationTresholdFactorDenominator : toBN(1),
    MATIC_liquidationIncentiveNumerator : toBN(115),
    MATIC_liquidationIncentiveDenominator : toBN(100),
    MATIC_borrowLimit : toBN(1_000_000).mul(MATICmultiplier),
    
    LINK_loanToValueRatioNumerator : toBN(6),
    LINK_loanToValueRatioDenominator : toBN(10),
    LINK_liquidationTresholdFactorNumerator : toBN(1),
    LINK_liquidationTresholdFactorDenominator : toBN(1),
    LINK_liquidationIncentiveNumerator : toBN(115),
    LINK_liquidationIncentiveDenominator : toBN(100),
    LINK_borrowLimit : toBN(1_000_000).mul(LINKmultiplier),

    REN_loanToValueRatioNumerator : toBN(6),
    REN_loanToValueRatioDenominator : toBN(10),
    REN_liquidationTresholdFactorNumerator : toBN(1),
    REN_liquidationTresholdFactorDenominator : toBN(1),
    REN_liquidationIncentiveNumerator : toBN(115),
    REN_liquidationIncentiveDenominator : toBN(100),
    REN_borrowLimit : toBN(1_000_000).mul(RENmultiplier),

    OGN_loanToValueRatioNumerator : toBN(6),
    OGN_loanToValueRatioDenominator : toBN(10),
    OGN_liquidationTresholdFactorNumerator : toBN(1),
    OGN_liquidationTresholdFactorDenominator : toBN(1),
    OGN_liquidationIncentiveNumerator : toBN(115),
    OGN_liquidationIncentiveDenominator : toBN(100),
    OGN_borrowLimit : toBN(1_000_000).mul(OGNmultiplier),

    //===== END  PROJECT TOKENS PARAMS =====//

    //===== CHAINLINK PRICE FEED =====//
    // chainlink price feeds https://docs.chain.link/docs/ethereum-addresses/

    chainlinkAggregatorV3_LINK_USD : '0x2c1d072e956affc0d435cb7ac38ef18d24d9127c', // https://docs.chain.link/docs/ethereum-addresses/#Ethereum%20Mainnet pair LINK/USD
    chainlinkAggregatorV3_REN_USD : '0x0f59666ede214281e956cb3b2d0d69415aff4a01', // https://docs.chain.link/docs/ethereum-addresses/#Ethereum%20Mainnet pair REN/USD
    chainlinkAggregatorV3_MATIC_USD : '0x7bac85a8a13a4bcd8abb3eb7d6b4d632c5a57676', // https://docs.chain.link/docs/ethereum-addresses/#Ethereum%20Mainnet pair MATIC/USD
    chainlinkAggregatorV3_OGN_ETH : '0x2c881B6f3f6B5ff6C975813F87A4dad0b241C15b', // https://docs.chain.link/docs/ethereum-addresses/#Ethereum%20Mainnet pair OGN/ETH
    chainlinkAggregatorV3_ETH_USD : '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // https://docs.chain.link/docs/ethereum-addresses/#Ethereum%20Mainnet pair ETH/USD


    //===== END CHAINLINK PRICE FEED =====//
}