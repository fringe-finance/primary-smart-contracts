# Comprehensive Guide to Smart Contract Testing Across Multiple Networks

## Introduction

- Testing smart contracts ensures the reliability of their functions, detects errors, and assesses compatibility, sustainability across different networks.

- The guidelines assist in configuring and conducting testing across different networks.

## Table of Contents


[1. Setup the environment](#1-setup-the-environment)  

- [1.1. Setup key](#11-setup-key)
- [1.1. Setup network](#12-setup-network)

[2. Deploy smart contract](#2-deploy-smart-contract)

- [2.1. Install package dependencies](#21-install-package-dependencies)
- [2.2. Setup config general](#22-setup-config-general)
- [2.3. Compile contract](#23-compile-contract)
- [2.4. Run script deploy](#24-run-script-deploy)


[3. Test case setup](#3-test-case-setup)

[4. Test scripts](#4-test-scripts)

[5. Running tests and coverage](#5-running-tests-and-coverage)  

- [5.1. Running tests](#51-running-tests)  
- [5.2. Measuring test coverage](#52-measuring-test-coverage)

[6. Conclusion](#6-conclusion)


## 1. Setup the environment
### 1.1. Setup key

Create a new `.env` file based on the `.env.example` file, fill all keys into `.env` file.

```
ETHERSCAN_API_KEY=      // Etherscan key to verify the smart contract --> update here
POLYGONSCAN_API_KEY=    // --> Update here (the perpose of the key) 
OPTIMISM_API_KEY=       // --> Update here (the perpose of the key) 
ARBISCAN_API_KEY=       // --> Update here (the perpose of the key)  
INFURA_KEY=             // --> Update here (the perpose of the key) 
PRIVATE_KEY=            // --> Update here (the perpose of the key) 
```

### 1.2. Setup network

Each network has a different configuration for testing. In this document, we support four types of network:

| ID | Network          | Configuration                                                             |
|----|------------------|---------------------------------------------------------------------------|
| 1  | Goerli           | BLOCKNUMBER=9560000 TESTING=true CHAIN=goerli LAYER2=false                |
| 2  | Polygon Mumbai   | BLOCKNUMBER=39540000 TESTING=true CHAIN=polygon_mumbai LAYER2=false       |
| 3  | Optimsim         | BLOCKNUMBER=13975000 TESTING=true CHAIN=optimsim_goerli LAYER2=true       |
| 4  | Arbitrum         | BLOCKNUMBER=37650000 TESTING=true CHAIN=arbitrum_goerli LAYER2=true       |

Modify the configuration in the `chain.config.js` file.

**Note:** The `chain` field in the configuration file must precisely match the values below:

- **For Testnet:** Use `goerli`, `polygon_mumbai`, `optimism_goerli`, `arbitrum_goerli`.
- **For Mainnet:** Use `ethereum`, `optimism`, `polygon`, `arbitrum`.

**Usage Instructions**:
- **Select the Chain to Run**: In the `chain` option, specify the name of the blockchain chain you want to configure. This will determine which section of the configuration will be used.

Example:
 ```
//file: ./chain.config.js

  chain: 'arbitrum_goerli',
  isZksync: false, // Set to true if using zksync network.

  arbitrum_goerli: {
    blockNumber: '37650000',
    isTesting: true, 
    isLayer2: true
  },
```
- **Customize Chain Settings**:
    - `blockNumber`: ***Do not change the block number*** as it may affect test results accuracy. The provided block numbers in the configuration file are critical for accurate testing and forking.
    - `isTesting`: Set this to `true` in testing and `false` in deployment. (When set to `true`, `console.log` will be disabled and will not write addresses when deploying the contract to the `config` file).
    - `isLayer2`: Set this to `true` if the network is a layer2 that supports sequencer feeds.

In the folders `scripts/config/hardhat_*/` there are files `config.testing.json`, these files are used to configure parameters when testing, ***Please do not change these files***.

Example: 
```
//file: /hardhat_arbitrum_goerli/config.testing.json

{
    "impersonateAccount": {
        "projectToken": "0x3edef3d7a9b94edb0457613e7cf27e2fb9f5bb3e",
        "usdc": "0x3edef3d7a9b94edb0457613e7cf27e2fb9f5bb3e",
        "usb": "0x8c54240cf91691b1c898b678d61124056b711456",
        "WETH": "0x3edef3d7a9b94edb0457613e7cf27e2fb9f5bb3e"
    },
    "uniswapFactory": "0x7EeC0663B4f0baE379200cCD944AD521af7d5F58",
    "uniswapV2Router": "0xBBE351286cAA73fBc917088E5e3F336a2018FBBB",
    "price": {
        "prj1": "200520",
        "prj2": "6321489",
        "prj3": "9248767792291",
        "usdc": "1000118",
        "usb": "999660",
        "weth": "1662906887"
    }
}
```
- **impersonateAccount**: The address of the contract creator who deployed the token on the testnet used for testing (Mainly to get `mint` role).
- **uniswapFactory**: Address of UniswapFactory contract.
- **uniswapV2Router**: Address of UniswapV2Router contract.
- **price**: The price of the tokens will be hard-configured so that the test cases are suitable for the networks.


## 2. Deploy smart contract  

### 2.1 Install package dependencies

Install packages by running:
```
yarn
```

### 2.2 Setup config general

The configuration information is stored in the `scripts/config/` folder. This folder contains subfolders that correspond to the networks used for testing and deploy. 

Each subfolder contains:

- `config_general.example:`Copy the entire content from this file to a file named `config_general.json` for reuse with the new gerenal config.

```
{
    "priceOracle": { // Configure oracle prices
        "Pyth": {
            "pythOracle": "",    // PythOracle Address.

            "tokensUsePyth": [], // List of address tokens uses prices from Pyth.
            
            "priceIdPath": [[]]  // List of priceId arrays used to get the price for
                                 // each corresponding token in List tokensUsePyth.
        },
        "Chainlink": {
            "sequencerUptimeFeed": "",     // Proxy addresses for the L2 sequencer feeds.

            "gracePeriodTime": "",         // The grace period value after
                                           // the sequencer is backed up.

            "tokensUseChainlink": [],      // List of address tokens uses prices from Chainlink.

            "chainlinkAggregatorV3": [[]], // List of address Aggregator arrays used to
                                           // get the price for each corresponding
                                           // token in List tokensUseChainlink.

            "timeOuts": [[]]               // List of the timeout value array is used to check
                                           // if the time elapsed since the last price update
                                           // is valid (corresponds to chainlinkAggregatorV3).
        },
        "Uniswap": {
            "tokensUseUniswap": [], // List of address tokens uses prices from Uniswap.

            "uniswapPairs": []      // List of address uniswapPair used to get the price for
                                    // each corresponding token in List tokensUseUniswap.
        },
        "BackendProvider": {
            "tokensUseBackendProvider": [] // List of address tokens uses prices from Backend.
        },
        "LPProvider": {
            "tokensUseLPProvider": [] // List of address tokens uses prices from LPProvider.
        },
        "wstETHProvider": {
            "wstETHAggregatorPath": [] // Address Aggregator array used to get
                                       // price for wstETH from Chainlink.
        },
        "wstETH": "", // Address of wstETH token
        "usdc": "",   // Address of USDC token
        "WETH": ""    // Address of WETH token
    },
    "exchangeAggregatorParams": {
        "exchangeAggregator": "", // Address of the Exchange Aggregator contract.
        "registryAggregator": ""  // Address of the Aggregator registry contract.
    },
    "plpModeratorParams": {
        "projectTokens": [],               // List of address project tokens.

        "loanToValueRatioNumerator": [],   // The numerator of the loan-to-value
                                           // ratio for the project token corresponding
                                           // to each token in the tokens list.

        "loanToValueRatioDenominator": [], // The denominator of the loan-to-value 
                                           // ratio for the project token corresponding
                                           // to each token in the tokens list.

        "isPaused": false,                 // A boolean indicating whether the project
                                           // token and lending token is paused or not.

        "borrowLimitPerCollateral": [],    // The borrow limit value (USD)
                                           // per project token corresponding
                                           // to each token in the tokens list.

        "borrowLimitPerLendingToken": [],  // The borrow limit value (USD)
                                           // per lending token corresponding to
                                           // each token in the lendingTokens list.
    },
    "blendingToken": {
        "initialExchangeRateMantissa": [], // ExchangeRate Mantissa value corresponding
                                           // each token in the lendingTokens list.
                                           
        "reserveFactorMantissa": [],       // Reserve Factor Mantissa value corresponding
                                           // each token in the lendingTokens list.

        "lendingTokens": [],               // List of address lending tokens.

        "symbol": [],                      // List of symbol bLendingToken corresponding
                                           // each token in the lendingTokens.

        "decimals": [],                    // List of decimals bLendingToken corresponding
                                           // each token in the lendingTokens.

        "name": [],                        // List of name bLendingToken corresponding
                                           // each token in the lendingTokens.

        "loanToValueRatioNumerator": [],   // The numerator of the loan-to-value
                                           // ratio for the lending token corresponding
                                           // to each token in the lendingTokens list.

        "loanToValueRatioDenominator": []  // The denominator of the loan-to-value 
                                           // ratio for the lending token corresponding
                                           // to each token in the lendingTokens list.
      },
      "jumRateModel": {
        "gainPerYear": [],    // The gain per year for the blending token.
        "jumGainPerYear": [], // The jump gain per year for the blending token.
        "targetUtil": [],     // The target utilization rate for the blending token.
        "newMaxBorrow": [],   // The new maximum borrow rate for the blending token.
        "blocksPerYear": ""   // Number of blocks per year for the JumpRateModelV3
      },
      "plpLiquidationParams": {
        "minPA": "",                       // The minimum partial liquidation amount.
        "maxLRFNumerator": "",             // The numerator of the LRF ratio.
        "maxLRFDenominator": "",           // The denominator of the LRF ratio.
        
        "rewardCalcFactorNumerator": "",   // The numerator of the liquidator 
                                           // reward calculation factor.

        "rewardCalcFactorDenominator": "", // The denominator of the liquidator
                                           // reward calculation factor.

        "targetHFNumerator": "",           // The numerator for the target health factor.
        "targetHFDenominator": ""          // The denominator for the target health factor.
      }
}
```
This is an example of the `config_general.json` file used to deploy to the `Arbitrum Goerli` network.
```
//file: /hardhat_arbitrum_goerli/config_gerenal.json

{
    "priceOracle": {
        "Pyth": {
            "pythOracle": "",
            "tokensUsePyth": [],
            "priceIdPath": []
        },
        "Chainlink": {
            "sequencerUptimeFeed": "0x4da69F028a5790fCCAfe81a75C0D24f46ceCDd69",
            "gracePeriodTime": "3600",
            "tokensUseChainlink": [
              "0x0B574E6e9cd6f159dB6062e220c3976e63FAc126",
              "0xD20ee3d5c9EE0924429268d994149963ded6c72A",
              "0x5ecf82A8e520f1c280694AfBe639ebD06A7dE249"
            ],
            "chainlinkAggregatorV3": [
              ["0x1692Bdd32F31b831caAc1b0c9fAF68613682813b"],
              ["0x103b53E977DA6E4Fa92f76369c8b7e20E7fb7fe1"],
              ["0x62CAe0FA2da220f43a51F86Db2EDb36DcA9A5A08"]
            ],
            "timeOuts": [
              ["86460"],
              ["86460"],
              ["180"]
          ]
        },
        "Uniswap": {
            "tokensUseUniswap": [
              "0xA0126016B2cFcAf60df67579C81F68C02bc237d8",
              "0x2A36e1454f333fCB866009AF058c2B2B985dF8f7",
              "0x2fCabB640BDc5E23dD469f2b8F625236d063456c"
            ],
            "uniswapPairs": [
              "0x92E94754e9bdFaC92f4f376093C6bB38042aEBB2",
              "0xbbE83BF43BBc1185BBFbFdc160C650b549ee9eC7",
              "0x7A4680dF7759A12ea0A7636e0EAC448F90CA6cb5"
            ]
        },
        "BackendProvider": {
            "tokensUseBackendProvider": []
        },
        "LPProvider": {
            "tokensUseLPProvider": [
              "0x92E94754e9bdFaC92f4f376093C6bB38042aEBB2",
              "0x531F9b3df4B7d92D581771252fB3B066Ba08ff06"
            ]
        },
        "wstETHProvider": {
            "wstETHAggregatorPath": [
                "0x6550bc2301936011c1334555e62A87705A81C12C"
            ]
        },
        "wstETH": "0x55f88B32D47f7BA13e969749e1D6fc3aba691914",
        "usdc": "0x0B574E6e9cd6f159dB6062e220c3976e63FAc126",
        "WETH": "0x5ecf82A8e520f1c280694AfBe639ebD06A7dE249"
    },
    "exchangeAggregatorParams": {
        "exchangeAggregator": "0xf69ab19E7152E502a93C2A5F18BE6eD62f6Af35b",
        "registryAggregator": "0x95Df61C595D854ef070277057537950ae9DfC36c"
    },
    "plpModeratorParams": {
      "projectTokens": [
          "0xA0126016B2cFcAf60df67579C81F68C02bc237d8",
          "0x2A36e1454f333fCB866009AF058c2B2B985dF8f7",
          "0x2fCabB640BDc5E23dD469f2b8F625236d063456c",
          "0x92E94754e9bdFaC92f4f376093C6bB38042aEBB2",
          "0x55f88B32D47f7BA13e969749e1D6fc3aba691914",
          "0x531F9b3df4B7d92D581771252fB3B066Ba08ff06",
          "0x5ecf82A8e520f1c280694AfBe639ebD06A7dE249"
      ],
      "loanToValueRatioNumerator": [
          "6",
          "6",
          "6",
          "9",
          "9",
          "6",
          "6"
      ],
      "loanToValueRatioDenominator": [
          "10",
          "10",
          "10",
          "10",
          "10",
          "10",
          "10"
      ],
      "isPaused": false,
      "borrowLimitPerCollateral": [
          "1000000000000",
          "1000000000000",
          "1000000000000",
          "1000000000000",
          "1000000000000",
          "1000000000000",
          "1000000000000"
      ],
      "borrowLimitPerLendingToken": [
          "1000000000000",
          "1000000000000",
          "1000000000000"
      ]
    },
    "blendingToken": {
      "initialExchangeRateMantissa": [
          "10000000000000000000",
          "10000000000000000000",
          "10000000000000000000"
      ],
      "reserveFactorMantissa": [
          "2500000000000000000",
          "2500000000000000000",
          "2500000000000000000"
      ],
      "lendingTokens": [
          "0x0B574E6e9cd6f159dB6062e220c3976e63FAc126",
          "0xD20ee3d5c9EE0924429268d994149963ded6c72A",
          "0x5ecf82A8e520f1c280694AfBe639ebD06A7dE249"
      ],
      "symbol": [
          "fUSDC",
          "fUSB",
          "fWETH"
      ],
      "decimals": [
          "6",
          "18",
          "18"
      ],
      "name": [
          "fUSDC",
          "fUSB",
          "fWETH"
      ],
      "loanToValueRatioNumerator": [
          "9",
          "9",
          "9"
      ],
      "loanToValueRatioDenominator": [
          "10",
          "10",
          "10"
      ]
  },
      "jumRateModel": {
          "gainPerYear": [
              "47564697600",
              "47564697600",
              "47564697600"
          ],
          "jumGainPerYear": [
              "2102400000000000000000000",
              "2102400000000000000000000",
              "2102400000000000000000000"
          ],
          "targetUtil": [
              "500000000000000000",
              "500000000000000000",
              "500000000000000000"
          ],
          "newMaxBorrow": [
              "10000000000000",
              "10000000000000",
              "10000000000000"
          ],
          "blocksPerYear": "2102400"
      },
      "plpLiquidationParams": {
          "minPA": "1000000",
          "maxLRFNumerator": "115",
          "maxLRFDenominator": "100",
          "rewardCalcFactorNumerator": "1",
          "rewardCalcFactorDenominator": "1",
          "targetHFNumerator": "1",
          "targetHFDenominator": "1"
      }
  }
```

- `config_example.json:` Copy the entire content from this file to a file named `config.json` to save the addresses of deployed contracts.
```
{
  "PRIMARY_PROXY_ADMIN": "",
  "PythPriceProviderLogic": "",
  "PythPriceProviderProxy": "",
  "ChainlinkPriceProviderLogic": "",
  "ChainlinkPriceProviderProxy": "",
  "BackendPriceProviderLogic": "",
  "BackendPriceProviderProxy": "",
  "PriceProviderAggregatorLogic": "",
  "PriceProviderAggregatorProxy": "",
  "LPPriceProviderLogic": "",
  "LPPriceProviderProxy": "",
  "wstETHPriceProviderLogic": "",
  "wstETHPriceProviderProxy": "",
  "BondtrollerLogic": "",
  "BondtrollerProxy": "",
  "BLendingTokenLogic": "",
  "BLendingTokenProxies": [],
  "PrimaryLendingPlatformV2Logic": "",
  "PrimaryLendingPlatformV2Proxy": "",
  "JumpRateModelLogic": "",
  "JumpRateModelProxy": "",
  "PrimaryLendingPlatformAtomicRepaymentLogic": "",
  "PrimaryLendingPlatformAtomicRepaymentProxy": "",
  "PrimaryLendingPlatformLiquidationLogic": "",
  "PrimaryLendingPlatformLiquidationProxy": "",
  "PrimaryLendingPlatformModeratorLogic": "",
  "PrimaryLendingPlatformModeratorProxy": "",
  "PrimaryLendingPlatformWrappedTokenGatewayLogic": "",
  "PrimaryLendingPlatformWrappedTokenGatewayProxy": "",
  "PrimaryLendingPlatformLeverageLogic": "",
  "PrimaryLendingPlatformLeverageProxy": "",
  "ZERO_ADDRESS": "0x0000000000000000000000000000000000000000",
  "UniswapV2PriceProviderLogic": "",
  "UniswapV2PriceProviderProxy": ""
}
```

**Note:** When we run the deploy contract script, we will ignore contracts that already have addresses in the `config.json` file. So to deploy all new contracts, copy the content from file `config_example.json` to file `config.json`.

- `verify.json:` Change the value to `false` for which contracts need to be verified. After the verification is completed, value of contracts which are verified will turn to be `true`.

```
{
  "PRIMARY_PROXY_ADMIN": true,
  "PythPriceProviderLogic": true,
  "PythPriceProviderProxy": true,
  "ChainlinkPriceProviderLogic": true,
  "ChainlinkPriceProviderProxy": true,
  "BackendPriceProviderLogic": true,
  "BackendPriceProviderProxy": true,
  "PriceProviderAggregatorLogic": true,
  "PriceProviderAggregatorProxy": true,
  "LPPriceProviderLogic": true,
  "LPPriceProviderProxy": true,
  "wstETHPriceProviderLogic": true,
  "wstETHPriceProviderProxy": true,
  "BondtrollerLogic": true,
  "BondtrollerProxy": true,
  "BLendingTokenLogic": true,
  "BLendingTokenProxies": true,
  "PrimaryLendingPlatformV2Logic": true,
  "PrimaryLendingPlatformV2Proxy": true,
  "JumpRateModelLogic": true,
  "JumpRateModelProxy": true,
  "PrimaryLendingPlatformAtomicRepaymentLogic": true,
  "PrimaryLendingPlatformAtomicRepaymentProxy": true,
  "PrimaryLendingPlatformLiquidationLogic": true,
  "PrimaryLendingPlatformLiquidationProxy": true,
  "PrimaryLendingPlatformModeratorLogic": true,
  "PrimaryLendingPlatformModeratorProxy": true,
  "PrimaryLendingPlatformWrappedTokenGatewayLogic": true,
  "PrimaryLendingPlatformWrappedTokenGatewayProxy": true,
  "PrimaryLendingPlatformLeverageLogic": true,
  "PrimaryLendingPlatformLeverageProxy": true,
  "UniswapV2PriceProviderLogic": true,
  "UniswapV2PriceProviderProxy": true
}
```
**Note:** To verify the smart contract, configure the `verify.json` file with the contracts that need verification (Only mainnet and testnet).

## 2.3 Compile contract

Before deploying the contract, run the following command to compile the contract:
```
yarn compile
```
 or
```
npm run compile
```
## 2.4 Run script deploy

Deploying a smart contract for network-specific testing follows the example using the Arbitrum network:

- In the `scripts/config/arbitrum_goerli` folder, copy the entire content from the `config.example.json` file to a file named `config.json`.

- Execute the script by running the command specified in the `scripts` section of the `package.json` file.

**Note:** The table below presents the scripts necessary for deploying smart contracts on specific networks. Testing is supported on four networks:

### Mainnet

| ID | Network   | Deploy smart contract command                                                           |
|----|-----------|-----------------------------------------------------------------------------------------|
| 1  | Ethereum  | `npm run deployPLP_V2_mainnet` or `yarn deployPLP_V2_mainnet`                           |
| 2  | Polygon   | `npm run deployPLP_V2_polygon_mainnet` or `yarn deployPLP_V2_polygon_mainnet`           |
| 3  | Optimsim  | `npm run deployPLP_V2_optimism_mainnet` or `yarn deployPLP_V2_optimism_mainnet`         |
| 4  | Arbitrum  | `npm run deployPLP_V2_arbitrum_mainnet` or `yarn deployPLP_V2_arbitrum_mainnet`         |

### Testnet

| ID | Network          | Deploy smart contract command                                                       |
|----|------------------|-------------------------------------------------------------------------------------|
| 1  | Goerli           | `npm run deployPLP_V2_goerli` or `yarndeployPLP_V2_goerli`                          |
| 2  | Polygon Mumbai   | `npm run deployPLP_V2_polygon_mumbai` or `yarn deployPLP_V2_polygon_mumbai`         |
| 3  | Optimsim         | `npm run deployPLP_V2_optimism_goerli` or `yarn deployPLP_V2_optimism_goerli`       |
| 4  | Arbitrum         | `npm run deployPLP_V2_arbitrum_goerli` or `yarn deployPLP_V2_arbitrum_goerli`       |

### Fork testnet or mainnet

Run commnad: `npm run deployPLP_V2_fork` or `yarn deployPLP_V2_fork`.

## 3. Test case setup

Setup test cases for all main functions in each smart contract. Document for the test case [here](). 

## 4. Test scripts

Test scripts are written based on the test cases in [section 3](#3-test-case-setup) and stored in the `test/ethereum` folder.

## 5. Running tests and coverage

### 5.1 Running tests

There are 6 script test files to test 6 contracts. When running the command for each network, all test files are executed simultaneously in sequence from 1 to 6. Change the method of running the script test in the `package.json` file.

Run command: `npm run coverage_testingPLP_V2_fork` or `yarn coverage_testingPLP_V2_fork`.

### 5.2. Measuring test coverage

When the testing process is complete, a detailed testing table is presented. Check the percentage number to assess the reliability of the testing script.

## 6. Conclusion

Users should follow the provided guidelines for effective smart contract testing.