# Comprehensive Guide to Smart Contract Testing Across Multiple Networks

## Introduction

- Testing smart contracts ensures the reliability of their functions, detects errors, and assesses compatibility, sustainability across different networks.

- The guidelines assist in configuring and conducting testing across different networks.

## Table of Contents


[1. Setup the environment](#1-setup-the-environment)

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

Create a new `.env` file based on the `.env.example` file, fill all keys into `.env` file.

```
ETHERSCAN_API_KEY=      // Etherscan key to verify the smart contract --> update here
POLYGONSCAN_API_KEY=    // --> Update here (the perpose of the key) 
OPTIMISM_API_KEY=       // --> Update here (the perpose of the key) 
ARBISCAN_API_KEY=       // --> Update here (the perpose of the key)  
INFURA_KEY=             // --> Update here (the perpose of the key) 
PRIVATE_KEY=            // --> Update here (the perpose of the key) 
```

## 2. Deploy smart contract  

### 2.1 Install package dependencies

Install packages by running:
```
yarn
```

### 2.2 Setup config general

The configuration information is stored in the `scripts/config/` folder for ethereum networks and in the `deploy/config_*/` folder for zksync network. This folder contains subfolders that correspond to the networks used for testing and deploy. 

Each subfolder contains:

- `config_general.example:`Copy the entire content from this file to a file named `config_general.json` for reuse with the new gerenal config.

```
{
    "liquidationBot": {
        "uniswapV2Factory": "" // Address of Uniswap V2 Factory contract
    },
    "priceOracle": { // Configure oracle prices
        "priceProcessingOracle": {
            "volatilityCapUpPercent": "",   // Defines the up maximum threshold of price
                                            movement since the previously-stored
                                            mostRecentGovernedPrice, above which the
                                            price is capped.

            "volatilityCapDownPercent": "",   // Defines the down maximum threshold of price
                                               movement since the previously-stored
                                               mostRecentGovernedPrice, above which the
                                               price is capped.
        },
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
            "pricePointTWAPperiod": "",// The price point TWAP period.
            "tokensUseUniswap": [],    // List of address tokens uses prices from Uniswap.

            "uniswapPairs": []         // List of address uniswapPair used to get the price for
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

            "timeOuts": []             // List of the timeout value array is used to check
                                       // if the time elapsed since the last price update
                                       // is valid (corresponds to wstETHAggregatorPath).                
        },
        "priceDecimals": {}, // Price decimals correspond to each token.
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
    "liquidationBot": {
        "uniswapV2Factory": "0x7eec0663b4f0bae379200ccd944ad521af7d5f58"
    },
    "priceOracle": {
        "priceProcessingOracle": {
            "volatilityCapUpPercent": "1000",       // 10%
            "volatilityCapDownPercent": "1000",    // 10%
        },
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
            "pricePointTWAPperiod": "10",
            "tokensUseUniswap": [
              "0xA0126016B2cFcAf60df67579C81F68C02bc237d8",
              "0x2A36e1454f333fCB866009AF058c2B2B985dF8f7",
              "0x2fCabB640BDc5E23dD469f2b8F625236d063456c"
            ],
            "uniswapPairs": [
              "0x9DE6200BAA0BFfEC839647B6d9C8FE28c91Ee60E",
              "0x591A038bB59174535dc898c4f90B8C5C5E487Ece",
              "0x8484E5f7684F5B2F0f61C5C2e1aC7d49c32877C2"
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
            ],
            "timeOuts": ["180"]
        },
        "priceDecimals": {
            "0xA0126016B2cFcAf60df67579C81F68C02bc237d8": "18",
            "0x2A36e1454f333fCB866009AF058c2B2B985dF8f7": "18",
            "0x2fCabB640BDc5E23dD469f2b8F625236d063456c": "18",
            "0x55f88B32D47f7BA13e969749e1D6fc3aba691914": "18",
            "0x0B574E6e9cd6f159dB6062e220c3976e63FAc126": "18",
            "0xD20ee3d5c9EE0924429268d994149963ded6c72A": "18",
            "0x5ecf82A8e520f1c280694AfBe639ebD06A7dE249": "18"
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
  "PriceOracleLogic": "",
  "PriceOracleProxy": "",
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
  "UniswapV3PriceProviderLogic": "",
  "UniswapV3PriceProviderProxy": "",
  "PairFlashLogic": "",
  "PairFlashProxy": ""
}
```

**Note:** When we run the deploy contract script, we will ignore contracts that already have addresses in the `config.json` file. So to deploy all new contracts, copy the content from file `config_example.json` to file `config.json`.

- `verify.json:` Change the value to `false` for which contracts need to be verified. After the verification is completed, value of contracts which are verified will turn to be `true`.

```
{
  "PRIMARY_PROXY_ADMIN": true,
  "PriceOracleLogic": true,
  "PriceOracleProxy": true,
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
  "UniswapV3PriceProviderLogic": true,
  "UniswapV3PriceProviderProxy": true,
  "PairFlashLogic": true,
  "PairFlashProxy": true
}
```
**Note:** To verify the smart contract, configure the `verify.json` file with the contracts that need verification (Only mainnet and testnet).

## 2.3 Compile contract

Before deploying the contract, run the following command to compile the contract:
### Ethereum networks (Ethereum, Polygon, Optimsim and Arbitrum)
```
yarn compile
```
 or
```
npm run compile
```
### Zksync network
```
yarn compile:zksync
```
 or
```
npm run compile:zksync
```
## 2.4 Run script deploy

Deploying a smart contract for network-specific testing follows the example using the Arbitrum network:

- In the `scripts/config/arbitrum_goerli` folder, copy the entire content from the `config.example.json` file to a file named `config.json`.

- Execute the script by running the command specified in the `scripts` section of the `package.json` file.

**Note:** The table below presents the scripts necessary for deploying smart contracts on specific networks. Testing is supported on four networks:

### Deploy PLP Contracts

#### Mainnet

| ID | Network   | Deploy smart contract command                                                           |
|----|-----------|-----------------------------------------------------------------------------------------|
| 1  | Ethereum  | `npm run deploy:v2:mainnet` <br> or <br> `yarn deploy:v2:mainnet`                           |
| 2  | Polygon   | `npm run deploy:v2:polygon-mainnet` <br> or <br> `yarn deploy:v2:polygon-mainnet`           |
| 3  | Optimsim  | `npm run deploy:v2:optimism-mainnet` <br> or <br> `yarn deploy:v2:optimism-mainnet`         |
| 4  | Arbitrum  | `npm run deploy:v2:arbitrum-mainnet` <br> or <br> `yarn deploy:v2:arbitrum-mainnet`         |
| 5  | Zksync           | `npm run deploy:v2:zksync-mainnet` <br> or <br> `yarn deploy:v2:zksync-mainnet`        |

#### Testnet

| ID | Network          | Deploy smart contract command                                                       |
|----|------------------|-------------------------------------------------------------------------------------|
| 1  | Goerli           | `npm run deploy:v2:goerli` <br> or <br> `yarn deploy:v2:goerli`                          |
| 2  | Polygon Mumbai   | `npm run deploy:v2:polygon-mumbai` <br> or <br> `yarn deploy:v2:polygon-mumbai`         |
| 3  | Optimsim         | `npm run deploy:v2:optimism-goerli` <br> or <br> `yarn deploy:v2:optimism-goerli`       |
| 4  | Arbitrum         | `npm run deploy:v2:arbitrum-goerli` <br> or <br> `yarn deploy:v2:arbitrum-goerli`       |
| 5  | Zksync           | `npm run deploy:v2:zksync-goerli` <br> or <br> `yarn deploy:v2:zksync-goerli`        |

#### Fork Testnet

**Note**: We support the deployment of smart contracts on corresponding fork networks, for the purpose of checking whether there are errors when deploying the system with the values configured in the `config_general` file. For example, before deploying the system on goerli testnet, you can use that `config_gerenal` to deploy first on goerli's fork network, to see if it encounters errors or not (similar to mainnet).

| ID | Network          | Deploy smart contract command                                                       |
|----|------------------|-------------------------------------------------------------------------------------|
| 1  | Goerli           | `npm run deploy:v2:fork-goerli` <br> or <br> `yarn deploy:v2:fork-goerli`                          |
| 2  | Polygon Mumbai   | `npm run deploy:v2:fork-mumbai` <br> or <br> `yarn deploy:v2:fork-mumbai`         |
| 3  | Optimsim         | `npm run deploy:v2:fork-optimism-goerli` <br> or <br> `yarn deploy:v2:fork-optimism-goerli`       |
| 4  | Arbitrum         | `npm run deploy:v2:fork-arbitrum-goerli` <br> or <br> `yarn deploy:v2:fork-arbitrum-goerli`       |

Currently, we have pre-configured `config_gerenal` (***Please do not change these files***) files that we used to deploy on the testnet of goerli, mumbai, optimism-goerli and arbitrum-goerli networks. You can run these deploy fork testnet commands immediately to better understand how they work. 

#### Fork Mainnet

| ID | Network   | Deploy smart contract command                                                           |
|----|-----------|-----------------------------------------------------------------------------------------|
| 1  | Ethereum  | `npm run deploy:v2:fork-mainnet` <br> or <br> `yarn deploy:v2:fork-mainnet`                           |
| 2  | Polygon   | `npm run deploy:v2:fork-polygon` <br> or <br> `yarn deploy:v2:fork-polygon`           |
| 3  | Optimsim  | `npm run deploy:v2:fork-optimism` <br> or <br> `yarn deploy:v2:fork-optimism`         |
| 4  | Arbitrum  | `npm run deploy:v2:fork-arbitrum` <br> or <br> `yarn deploy:v2:fork-arbitrum`         |

**Note**: We recommend that you first try deploying the system with the mainnet `config_general` file onto mainnet forks, to check if the values in the `config_gerenal` file do not lead to errors during the process. For example, a wrong address of a lending token will result in a failed deployment.

### Deploy PairFlash Contract

#### Mainnet

| ID | Network   | Deploy smart contract command                                                           |
|----|-----------|-----------------------------------------------------------------------------------------|
| 1  | Ethereum  | `npm run deploy:liquidate-bot:mainnet` <br> or <br> `yarn deploy:liquidate-bot:mainnet`                           |
| 2  | Polygon   | `npm run deploy:liquidate-bot:polygon-mainnet` <br> or <br> `yarn deploy:liquidate-bot:polygon-mainnet`           |
| 3  | Optimsim  | `npm run deploy:liquidate-bot:optimism-mainnet` <br> or <br> `yarn deploy:liquidate-bot:optimism-mainnet`         |
| 4  | Arbitrum  | `npm run deploy:liquidate-bot:arbitrum-mainnet` <br> or <br> `yarn deploy:liquidate-bot:arbitrum-mainnet`         |

#### Testnet

| ID | Network          | Deploy smart contract command                                                       |
|----|------------------|-------------------------------------------------------------------------------------|
| 1  | Goerli           | `npm run deploy:liquidate-bot:goerli` <br> or <br> `yarn deploy:liquidate-bot:goerli`                          |
| 2  | Polygon Mumbai   | `npm run deploy:liquidate-bot:polygon-mumbai` <br> or <br> `yarn deploy:liquidate-bot:polygon-mumbai`         |
| 3  | Optimsim         | `npm run deploy:liquidate-bot:optimism-goerli` <br> or <br> `yarn deploy:liquidate-bot:optimism-goerli`       |
| 4  | Arbitrum         | `npm run deploy:liquidate-bot:arbitrum-goerli` <br> or <br> `yarn deploy:liquidate-bot:arbitrum-goerli`       |

## 3. Test case setup

Setup test cases for all main functions in each smart contract. Document for the test case [here](). 

## 4. Test scripts

Test scripts are written based on the test cases in [section 3](#3-test-case-setup) and stored in the `test/ethereum` folder.

## 5. Running tests and coverage

Each network has a different configuration for testing. In this document, we support four types of network:

| ID | Network          | Configuration                                                             |
|----|------------------|---------------------------------------------------------------------------|
| 1  | Goerli           | BLOCKNUMBER=9560000 TESTING=true CHAIN=goerli LAYER2=false                |
| 2  | Polygon Mumbai   | BLOCKNUMBER=39540000 TESTING=true CHAIN=polygon_mumbai LAYER2=false       |
| 3  | Optimsim         | BLOCKNUMBER=13975000 TESTING=true CHAIN=optimsim_goerli LAYER2=true       |
| 4  | Arbitrum         | BLOCKNUMBER=37650000 TESTING=true CHAIN=arbitrum_goerli LAYER2=true       |
| 5  | Zksync           | BLOCKNUMBER=47250000 TESTING=true CHAIN=polygon_mainnet TESTING_FOR_ZKSYNC=true

**Note**: Since hardhat does not support the `zksync` network fork, we have tested the logic of the contracts that will be deployed for zksync on the `polygon-mainnet` fork network.

**Customize Chain Settings**:
- `BLOCKNUMBER`: ***Do not change the block number*** as it may affect test results accuracy. The provided block numbers in the configuration file are critical for accurate testing and forking.
- `TESTING`: Set this to `true` in testing. (When set to `true`, `console.log` will be disabled and will not write addresses when deploying the contract to the `config` file).
- `LAYER2`: Set this to `true` if the network is a layer2 that supports sequencer feeds.
- `TESTING_FOR_ZKSYNC`: To differentiate from other networks.

These environment variables are set in cmd scripts in the package.json file. ***Please do not make changes***.

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

### 5.1 Running tests

There are 6 script test files to test 6 contracts. When running the command for each network, all test files are executed simultaneously in sequence from 1 to 6. Change the method of running the script test in the `package.json` file.

### Running test

| ID | Network          | Testing smart contract command                                                       |
|----|------------------|-------------------------------------------------------------------------------------|
| 1  | Goerli           | `npm run test:v2:fork-goerli` or `yarn test:v2:fork-goerli`                          |
| 2  | Polygon Mumbai   | `npm run test:v2:fork-mumbai` or `yarn test:v2:fork-mumbai`         |
| 3  | Optimsim         | `npm run test:v2:fork-optimism-goerli` or `yarn test:v2:fork-optimism-goerli`       |
| 4  | Arbitrum         | `npm run test:v2:fork-arbitrum-goerli` or `yarn test:v2:fork-arbitrum-goerli`       |
| 5  | Zksync           | `npm run test:v2:fork-polygon-zksync` or `yarn test:v2:fork-polygon-zksync`        |

### Running test coverage

| ID | Network          | Testing smart contract command                                                       |
|----|------------------|-------------------------------------------------------------------------------------|
| 1  | Goerli           | `npm run coverage:v2:fork-goerli` or `yarn coverage:v2:fork-goerli`                          |
| 2  | Polygon Mumbai   | `npm run coverage:v2:fork-mumbai` or `yarn coverage:v2:fork-mumbai`         |
| 3  | Optimsim         | `npm run coverage:v2:fork-optimism-goerli` or `yarn coverage:v2:fork-optimism-goerli`       |
| 4  | Arbitrum         | `npm run coverage:v2:fork-arbitrum-goerli` or `yarn coverage:v2:fork-arbitrum-goerli`       |
| 5  | Zksync           | `npm run coverage:v2:fork-polygon-zksync` or `yarn coverage:v2:fork-polygon-zksync`        |


### 5.2. Measuring test coverage

When the testing process is complete, a detailed testing table is presented. Check the percentage number to assess the reliability of the testing script.

## 6. Conclusion

Users should follow the provided guidelines for effective smart contract testing.