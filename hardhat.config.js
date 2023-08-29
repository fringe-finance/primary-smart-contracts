const { isCommunityResourcable } = require("@ethersproject/providers");

require("@matterlabs/hardhat-zksync-deploy");
require("@matterlabs/hardhat-zksync-solc");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-contract-sizer");
require("@matterlabs/hardhat-zksync-verify");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("solidity-docgen");

require("@solarity/hardhat-markup");
require('hardhat-output-validator');

require("dotenv").config();

const {
  INFURA_KEY,
  PRIVATE_KEY,
  ETHERSCAN_API_KEY,
  POLYGONSCAN_API_KEY,
  OPTIMISM_API_KEY,
  ARBISCAN_API_KEY,
  ZKSYNCSCAN_API_KEY
} = process.env;

const isZksync = Object.keys(process.env).includes('ZKSYNC');
const chain = process.env.CHAIN ? process.env.CHAIN : "no-chain";
const blockNumber = process.env.BLOCKNUMBER;
const isTesting = Object.keys(process.env).includes('TESTING');

console.log("isZksync", isZksync);
console.log("chain", chain);
console.log("blockNumber", blockNumber);
console.log("isTesting", isTesting);


let hardhatConfig;
if (isZksync) {
  hardhatConfig = {
    zksolc: {
      version: "1.3.6",
      compilerSource: "binary",
      settings: {},
    },
    defaultNetwork: "zkSyncTestnet",
    networks: {
      hardhat: {
        zksync: false,
      },
      zkSyncTestnet: {
        url: "https://zksync2-testnet.zksync.dev",
        ethNetwork: "goerli",
        zksync: true,
        verifyURL: 'https://zksync2-testnet-explorer.zksync.dev/contract_verification'
      },
    },
    etherscan: {
      apiKey: ZKSYNCSCAN_API_KEY
    },
    solidity: {
      version: "0.8.19",
    },
  };
} else {
  require("@primitivefi/hardhat-dodoc");
  hardhatConfig = {
    solidity: {
      compilers: [
        {
          version: "0.8.19",
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
          url: `https://${chain.replace("_", "-")}.infura.io/v3/${INFURA_KEY}`,
          blockNumber: Number(blockNumber)
        } 
      },

      ethereum_mainnet: {
        url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
        allowUnlimitedContractSize: false,
        timeout: 99999999,
        accounts: [PRIVATE_KEY],
      },

      polygon_mainnet: {
        url: `https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`,
        accounts: [PRIVATE_KEY],
      },

      arbitrum_mainnet: {
        url: `https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`,
        accounts: [PRIVATE_KEY],
      },

      optimism_mainnet: {
        url: `https://optimism-mainnet.infura.io/v3/${INFURA_KEY}`,
        network_id: 420,
        accounts: [PRIVATE_KEY],
      },

      polygon_mumbai: {
        url: `https://polygon-mumbai.infura.io/v3/${INFURA_KEY}`,
        accounts: [PRIVATE_KEY]
      },
      optimism_goerli: {
        url: `https://optimism-goerli.infura.io/v3${INFURA_KEY}`,
        network_id: 420,
        accounts: [PRIVATE_KEY],
        timeout: 99999999,
        gasPrice: 500_000_000, // 500 gwei
      },

      ethereum_goerli: {
        url: "https://rpc.ankr.com/eth_goerli",
        timeout: 99999999,
        accounts: [PRIVATE_KEY],
        network_id: 5,
      },
      arbitrum_goerli: {
        url: "https://goerli-rollup.arbitrum.io/rpc",
        accounts: [PRIVATE_KEY],
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
    markup: {
      outdir: "./generated-markups",
      onlyFiles: [
        "contracts",
      ],
      skipFiles: [],
      noCompile: false,
      verbose: false,
    },
    // outputValidator: {
    //   runOnCompile: true,
    //   errorMode: true,
    //   checks: {
    //     title: "error",
    //     details: "error",
    //     params: "error",
    //     returns: "error",
    //     compilationWarnings: "warning",
    //     variables: false,
    //     events: true,
    //   },
    //   include: [],
    // },
  };
}

module.exports = hardhatConfig;
