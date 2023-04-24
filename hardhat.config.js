const { isCommunityResourcable } = require("@ethersproject/providers");

require("@matterlabs/hardhat-zksync-deploy");
require("@matterlabs/hardhat-zksync-solc");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-contract-sizer");

require("hardhat-gas-reporter");
require("solidity-coverage");
require("solidity-docgen");

require("dotenv").config();

const {
  INFURA_KEY,
  MNEMONIC,
  ETHERSCAN_API_KEY,
  POLYGONSCAN_API_KEY,
  OPTIMISM_API_KEY,
  ARBISCAN_API_KEY,
} = process.env;

const isZksync = Object.keys(process.env).includes('ZKSYNC');
console.log(isZksync)
let hardhatConfig;
if (isZksync) {
  hardhatConfig = {
    zksolc: {
      version: "1.3.1",
      compilerSource: "binary",
      settings: {
        optimizer: {
          enabled: true,
        },
        solidity: {
          version: "0.8.9",
        },
        experimental: {
          dockerImage: "matterlabs/zksolc",
          tag: "v1.2.0"
        },
      },
    },
    defaultNetwork: "zkTestnet",
    networks: {
      zkTestnet: {
        url: "https://zksync2-testnet.zksync.dev", // URL of the zkSync network RPC
        ethNetwork: "https://goerli.infura.io/v3/1629e80003614d94915133a1ed88f25c", // URL of the Ethereum Web3 RPC, or the identifier of the network (e.g. `mainnet` or `goerli`)
        zksync: true
      }
    },
    solidity: {
      version: "0.8.9",
    },
  };
} else {
  require("@primitivefi/hardhat-dodoc");
  hardhatConfig = {
    solidity: {
      compilers: [
        {
          version: "0.8.9",
          settings: {
            optimizer: {
              enabled: true,
              runs: 200,
            },
          },
        },
      ],
    },
    networks: {
      hardhat: {
        forking: {
          url: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
        },
        allowUnlimitedContractSize: false,
        timeout: 99999999,
        blockGasLimit: 100_000_000,
        gas: 100_000_000,
        gasMultiplier: 1,
        gasPrice: 500_000_000_000, // 500 gwei
        accounts: { mnemonic: MNEMONIC },
      },

      ethereum_mainnet: {
        url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
        allowUnlimitedContractSize: false,
        timeout: 99999999,
        accounts: { mnemonic: MNEMONIC },
      },

      polygon_mainnet: {
        url: `https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`,
        accounts: { mnemonic: MNEMONIC },
      },

      arbitrum_mainnet: {
        url: `https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`,
        accounts: { mnemonic: MNEMONIC },
      },

      optimism_mainnet: {
        url: `https://optimism-mainnet.infura.io/v3/${INFURA_KEY}`,
        network_id: 420,
        accounts: { mnemonic: MNEMONIC },
      },

      polygon_mumbai: {
        url: `https://rpc-mumbai.maticvigil.com/v1/8ec24f48b4472038e2b1d8522ae4cb5b4c9ca621`,
        accounts: { mnemonic: MNEMONIC },
      },
      optimism_goerli: {
        url: `https://goerli.optimism.io`,
        network_id: 420,
        accounts: { mnemonic: MNEMONIC },
      },

      ethereum_goerli: {
        url: "https://rpc.ankr.com/eth_goerli",
        timeout: 99999999,
        accounts: { mnemonic: MNEMONIC },
        network_id: 5,
      },
      arbitrum_goerli: {
        url: "https://goerli-rollup.arbitrum.io/rpc",
        accounts: { mnemonic: MNEMONIC },
      },
    },
    gasReporter: {
      enabled: process.env.REPORT_GAS !== undefined,
      currency: "USD",
    },
    mocha: {
      timeout: 60000,
    },
    etherscan: {
      apiKey: {
        mainnet: ETHERSCAN_API_KEY,
        goerli: ETHERSCAN_API_KEY,
        polygon: POLYGONSCAN_API_KEY,
        polygonMumbai: POLYGONSCAN_API_KEY,
        arbitrumOne: ARBISCAN_API_KEY,
        arbitrumGoerli: ARBISCAN_API_KEY,
        optimisticEthereum: OPTIMISM_API_KEY,
        optimisticGoerli: OPTIMISM_API_KEY,
      },
      
    },
    contractSizer: {
      alphaSort: true,
      disambiguatePaths: false,
      runOnCompile: false,
      strict: true,
      only: [],
    },
    docgen: {
      path: "./docs",
      clear: true,
      runOnCompile: true,
      pages: "files",
    },
    dodoc: {
      runOnCompile: false,
      debugMode: false,
    },
  };
}

module.exports = hardhatConfig;
