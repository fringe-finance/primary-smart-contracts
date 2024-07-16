# Comprehensive Guide to Deploy Smart Contract Across Multiple Networks

## Introduction

- Deploying smart contracts across multiple networks ensures broader accessibility and increased resilience.

- This guide provides a step-by-step approach to seamlessly execute smart contracts on diverse blockchain platforms.

## Table of Contents

[1. Setup the environment](#1-setup-the-environment)

[2. Deploy smart contract](#2-deploy-smart-contract)

- [2.1. Install package dependencies](#21-install-package-dependencies)
- [2.2. Setup config general](#22-setup-config-general)
- [2.3. Compile contract](#23-compile-contract)
- [2.4. Run script deploy](#24-run-script-deploy)

[3. Conclusion](#3-conclusion)

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

The configuration information is stored in the `scripts/V3/config/{network}_{chain}` folder for ethereum networks and in the `deploy/V3/config_{chain}` folder for zksync network. This folder contains subfolders that correspond to the networks used for testing and deploy.

Each subfolder contains:

- `config_general.example:`Copy the entire content from this file to a file named `config_general.json` for reuse with the new gerenal config.

```
{
    "priceOracle": { // Configure oracle prices
        "priceProcessingOracle": {
            "volatilityCapUpPercent": "",       // Defines the up maximum threshold of price
                                                movement since the previously-stored
                                                mostRecentGovernedPrice, above which the
                                                price is capped.

            "volatilityCapDownPercent": "",     // Defines the down maximum threshold of price
                                                movement since the previously-stored
                                                mostRecentGovernedPrice, above which the
                                                price is capped.
        },
        "Pyth": {
            "pythOracle": "",                   // Pyth Oracle Address 
                                                (https://docs.pyth.network/price-feeds/contract-addresses/evm).

            "tokensUsePyth": [],                // List of address tokens uses prices from Pyth.

            "priceIdPath": [[]],                // List of priceId arrays used to get 
                                                each corresponding token in List tokensUsePyth.
                                                (https://pyth.network/developers/price-feed-ids).

            "priceDecimals": ""                 // The number of decimals for the price.
                                                (Recommended: 10).
        },
        "Chainlink": {
            "sequencerUptimeFeed": "",          // Proxy addresses for the L2 sequencer feeds 
                                                (https://docs.chain.link/data-feeds/l2-sequencer-feeds).

            "gracePeriodTime": "",              // The grace period value after the sequencer is backed up.

            "tokensUseChainlink": [],           // List of address tokens uses prices from Chainlink.

            "chainlinkAggregatorV3": [[]],      // List of address Aggregator arrays used to
                                                get the price for each corresponding
                                                token in List tokensUseChainlink 
                                                (https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum&page=1#networks).

            "timeOuts": [[]],                   // List of the timeout value array is used to check
                                                if the time elapsed since the last price update
                                                is valid (corresponds to chainlinkAggregatorV3).

            "priceDecimals": ""                 // The number of decimals for the price.
                                                (Recommended: 8).
        },
        "UniswapV2": {                          
            "tokensUseUniswap": [],             // List of address tokens uses prices from UniswapV2.

            "uniswapPairs": [],                 // List of address uniswapPair used to get the price for
                                                // each corresponding token in List tokensUseUniswapV3.

            "priceDecimals": ""                 // The number of decimals for the price.
        },
        "UniswapV3": {
            "pricePointTWAPperiod": "",         // The price point TWAP period.

            "tokensUseUniswap": [],             // List of address tokens uses prices from UniswapV3.

            "uniswapPairs": [],                 // List of address uniswapPair used to get the price for
                                                each corresponding token in List tokensUseUniswapV3.

            "priceDecimals": ""                 // The number of decimals for the price.
                                                (Recommended: 18)
        },
        "BackendProvider": {
            "tokensUseBackendProvider": []      // List of address tokens uses prices from Backend.
        },
        "LPProvider": {
            "tokensUseLPProvider": [],          // List of address tokens uses prices from LPProvider.

            "priceDecimals": ""                 // The number of decimals for the price.
        },
        "ERC4626Provider": {
            "tokensUseERC4626Provider": [],     // List of address tokens uses prices from ERC4626Provider.

            "priceDecimals": ""                 // The number of decimals for the price.
        },
        "wstETHProvider": {
            "wstETHAggregatorPath": [],         // Address Aggregator array used to get
                                                price for wstETH from Chainlink.

            "timeOuts": [],                     // List of the timeout value array is used to check
                                                if the time elapsed since the last price update
                                                is valid (corresponds to wstETHAggregatorPath).

            "priceDecimals": ""                 // The number of decimals for the price.
        },
        "wstETH": "",                           // Address of wstETH token
        "usdc": "",                             // Address of USDC token
        "WETH": ""                              // Address of WETH token
    },
    "exchangeAggregatorParams": {
        "exchangeAggregator": "",               // Address of the Exchange Aggregator contract:
                                                    Paraswap: https://developers.paraswap.network/smart-contracts#augustusswapper
                                                    OpenOcean: https://docs.openocean.finance/dev/contracts-of-chains

        "registryAggregator": ""                // Address of the Aggregator registry contract.
                                                    Paraswap: https://developers.paraswap.network/smart-contracts#augustus-registry
                                                    OpenOcean: Leave blank
    },
    "plpModeratorParams": {
        "projectTokens": [],                    // List of address collateral tokens.

        "loanToValueRatioNumerator": [],        // The numerator of the loan-to-value
                                                ratio for the project token corresponding
                                                to each token in the tokens list.

        "loanToValueRatioDenominator": [],      // The denominator of the loan-to-value
                                                ratio for the project token corresponding
                                                to each token in the tokens list.

        "isPaused": false,                      // A boolean indicating whether the project
                                                token and lending token is paused or not.

        "depositLimitPerProjectAsset": [],      // The deposit limit value (USD)
                                                per project token corresponding
                                                to each token in the tokens list.

        "borrowLimitPerLendingToken": [],       // The borrow limit value (USD)
                                                per lending token corresponding to
                                                each token in the lendingTokens list.
    },
    "blendingToken": {
        "initialExchangeRateMantissa": [],      // ExchangeRate Mantissa value corresponding
                                                each token in the lendingTokens list.

        "reserveFactorMantissa": [],            // ReserveFactor Mantissa value corresponding
                                                each token in the lendingTokens list.

        "lendingTokens": [],                    // List of address lending tokens.

        "symbol": [],                           // List of symbol bLendingToken corresponding
                                                each token in the lendingTokens.

        "decimals": [],                         // List of decimals bLendingToken corresponding
                                                each token in the lendingTokens.

        "name": [],                             // List of name bLendingToken corresponding
                                                each token in the lendingTokens.

        "loanToValueRatioNumerator": [],        // The numerator of the loan-to-value
                                                ratio for the lending token corresponding
                                                to each token in the lendingTokens list.

        "loanToValueRatioDenominator": [],      // The denominator of the loan-to-value
                                                ratio for the lending token corresponding
                                                to each token in the lendingTokens list.

        "initialSupplyAmount": []               // The initial supply amount for the blending token. Can leave empty if not used.
      },
      "jumRateModel": {
        "gainPerYear": [],                      // The gain per year for the blending token.

        "jumGainPerYear": [],                   // The jump gain per year for the blending token.

        "targetUtil": [],                       // The target utilization rate for the blending token.

        "newMaxBorrow": [],                     // The new maximum borrow rate for the blending token.

        "blocksPerYear": ""                     // Number of blocks per year for the JumpRateModelV3
      },
      "plpLiquidationParams": {
        "minPA": "",                            // The minimum partial liquidation amount.

        "maxLRFNumerator": "",                  // The numerator of the LRF ratio.

        "maxLRFDenominator": "",                // The denominator of the LRF ratio.

        "rewardCalcFactorNumerator": "",        // The numerator of the liquidator
                                                reward calculation factor.

        "rewardCalcFactorDenominator": "",      // The denominator of the liquidator
                                                reward calculation factor.

        "targetHFNumerator": "",                // The numerator for the target health factor.

        "targetHFDenominator": ""               // The denominator for the target health factor.
      }
}
```

This is an example of the `config_general.json` file used to deploy to the `Arbitrum Goerli` network.

```
//file: ./scripts/V3/config/arbitrum_goerli/config_gerenal.json

{
    "priceOracle": {
        "priceProcessingOracle": {
            "volatilityCapUpPercent": "1000",       // .i.e: 10% (Decimals unit: 2)
            "volatilityCapDownPercent": "1000",     // .i.e: 10% (Decimals unit: 2)
        },
        "Pyth": {
            "pythOracle": "0xff1a0f4744e8582DF1aE09D5611b887B6a12925C",
            "tokensUsePyth": [
                "0x0B574E6e9cd6f159dB6062e220c3976e63FAc126",
                "0xD20ee3d5c9EE0924429268d994149963ded6c72A"
            ],
            "priceIdPath": [
                [
                    "0x374ddb8a25370dc3a997fd3c73103b1ac04c2cfd60103bf7f607fdb56c968e0d", "0xa6416fd4788c8d0f0b5c7d9d93030f4f6b4a012a324771026f4b20d20114fcf4"
                ],
                ["0xa6416fd4788c8d0f0b5c7d9d93030f4f6b4a012a324771026f4b20d20114fcf4"]
            ],
            "priceDecimals": "10"
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
              [
                "0x1692Bdd32F31b831caAc1b0c9fAF68613682813b", 
                "0x103b53E977DA6E4Fa92f76369c8b7e20E7fb7fe1"
              ],
              ["0x103b53E977DA6E4Fa92f76369c8b7e20E7fb7fe1"],
              ["0x62CAe0FA2da220f43a51F86Db2EDb36DcA9A5A08"]
            ],
            "timeOuts": [
              [
                "86460",
                "180"
              ],
              ["86460"],
              ["180"]
            ],
            "priceDecimals": "8"
        },
        "UniswapV2": {
            "tokensUseUniswap": [],
            "uniswapPairs": [],
            "priceDecimals": "10"
        },
        "UniswapV3": {
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
            ],
            "priceDecimals": "18"
        },
        "BackendProvider": {
            "tokensUseBackendProvider": [],
            "priceDecimals": "10"
        },
        "LPProvider": {
            "tokensUseLPProvider": [
              "0x92E94754e9bdFaC92f4f376093C6bB38042aEBB2",
              "0x531F9b3df4B7d92D581771252fB3B066Ba08ff06"
            ],
            "priceDecimals": "10"
        },
        "ERC4626Provider": {
            "tokensUseERC4626Provider": [
                "0xc3dA79e0De523eEf7AC1e4ca9aBFE3aAc9973133",
                "0x0c80F31B840C6564e6c5E18f386FaD96b63514cA"
            ],
            "priceDecimals": "10"
        },
        "wstETHProvider": {
            "wstETHAggregatorPath": [
                "0x6550bc2301936011c1334555e62A87705A81C12C"
            ],
            "timeOuts": ["180"],
            "priceDecimals": "10"
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
      "depositLimitPerProjectAsset": [
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
          "50000000000000000",
          "70000000000000000",
          "100000000000000000"
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
      ],
      "initialSupplyAmount": [
          "1000000",
          "1000000000000000000",
          "1000000000000000000"
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
  "ERC4626PriceProviderLogic": "",
  "ERC4626PriceProviderProxy": "",
  "wstETHPriceProviderLogic": "",
  "wstETHPriceProviderProxy": "",
  "BondtrollerLogic": "",
  "BondtrollerProxy": "",
  "BLendingTokenLogic": "",
  "BLendingTokenProxies": [],
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
  "UniswapV2PriceProviderProxy": "",
  "UniswapV3PriceProviderLogic": "",
  "UniswapV3PriceProviderProxy": "",
  "PairFlashLogic": "",
  "PairFlashProxy": "",
  "PriceOracleLogic": "",
  "PriceOracleProxy": "",
  "PrimaryLendingPlatformV3Logic": "",
  "PrimaryLendingPlatformV3Proxy": ""
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
  "ERC4626PriceProviderLogic": true,
  "ERC4626PriceProviderProxy": true,
  "wstETHPriceProviderLogic": true,
  "wstETHPriceProviderProxy": true,
  "BondtrollerLogic": true,
  "BondtrollerProxy": true,
  "BLendingTokenLogic": true,
  "BLendingTokenProxies": true,
  "PrimaryLendingPlatformV3Logic": true,
  "PrimaryLendingPlatformV3Proxy": true,
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
  "UniswapV2PriceProviderProxy": true,
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

- In the `scripts/V3/config/arbitrum_goerli` folder, copy the entire content from the `config.example.json` file to a file named `config.json`.

- Execute the script by running the command specified in the `scripts` section of the `package.json` file.

**Note:** The table below presents the scripts necessary for deploying smart contracts on specific networks. Testing is supported on four networks:

### Deploy PLP Contracts V3

#### Mainnet

| ID  | Network  | Deploy smart contract command                                             |
| --- | -------- | ------------------------------------------------------------------------- |
| 1   | Ethereum | `npm run deploy:v3:mainnet` or `yarn deploy:v3:mainnet`                   |
| 2   | Polygon  | `npm run deploy:v3:polygon-mainnet` or `yarn deploy:v3:polygon-mainnet`   |
| 3   | Optimsim | `npm run deploy:v3:optimism-mainnet` or `yarn deploy:v3:optimism-mainnet` |
| 4   | Arbitrum | `npm run deploy:v3:arbitrum-mainnet` or `yarn deploy:v3:arbitrum-mainnet` |
| 5   | Zksync   | `npm run deploy:v3:zksync-mainnet` or `yarn deploy:v3:zksync-mainnet`     |

#### Testnet

| ID  | Network        | Deploy smart contract command                                           |
| --- | -------------- | ----------------------------------------------------------------------- |
| 1   | Goerli         | `npm run deploy:v3:goerli` or `yarn deploy:v3:goerli`                   |
| 2   | Polygon Mumbai | `npm run deploy:v3:polygon-mumbai` or `yarn deploy:v3:polygon-mumbai`   |
| 3   | Optimsim       | `npm run deploy:v3:optimism-goerli` or `yarn deploy:v3:optimism-goerli` |
| 4   | Arbitrum       | `npm run deploy:v3:arbitrum-goerli` or `yarn deploy:v3:arbitrum-goerli` |
| 5   | Zksync         | `npm run deploy:v3:zksync-goerli` or `yarn deploy:v3:zksync-goerli`     |

#### Fork Testnet

**Note**: We support the deployment of smart contracts on corresponding fork networks, for the purpose of checking whether there are errors when deploying the system with the values configured in the `config_general` file. For example, before deploying the system on goerli testnet, you can use that `config_gerenal` to deploy first on goerli's fork network, to see if it encounters errors or not (similar to mainnet).

| ID  | Network        | Deploy smart contract command                                                     |
| --- | -------------- | --------------------------------------------------------------------------------- |
| 1   | Goerli         | `npm run deploy:v3:fork-goerli` or `yarn deploy:v3:fork-goerli`                   |
| 2   | Polygon Mumbai | `npm run deploy:v3:fork-mumbai` or `yarn deploy:v3:fork-mumbai`                   |
| 3   | Optimsim       | `npm run deploy:v3:fork-optimism-goerli` or `yarn deploy:v3:fork-optimism-goerli` |
| 4   | Arbitrum       | `npm run deploy:v3:fork-arbitrum-goerli` or `yarn deploy:v3:fork-arbitrum-goerli` |

Currently, we have pre-configured `config_gerenal` (**_Please do not change these files_**) files that we used to deploy on the testnet of goerli, mumbai, optimism-goerli and arbitrum-goerli networks. You can run these deploy fork testnet commands immediately to better understand how they work.

#### Fork Mainnet

| ID  | Network  | Deploy smart contract command                                       |
| --- | -------- | ------------------------------------------------------------------- |
| 1   | Ethereum | `npm run deploy:v3:fork-mainnet` or `yarn deploy:v3:fork-mainnet`   |
| 2   | Polygon  | `npm run deploy:v3:fork-polygon` or `yarn deploy:v3:fork-polygon`   |
| 3   | Optimsim | `npm run deploy:v3:fork-optimism` or `yarn deploy:v3:fork-optimism` |
| 4   | Arbitrum | `npm run deploy:v3:fork-arbitrum` or `yarn deploy:v3:fork-arbitrum` |

**Note**: We recommend that you first try deploying the system with the mainnet `config_general` file onto mainnet forks, to check if the values in the `config_gerenal` file do not lead to errors during the process. For example, a wrong address of a lending token will result in a failed deployment.

## 3. Conclusion

Users should follow the provided guidelines for effective smart contract deploying.
