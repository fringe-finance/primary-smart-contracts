require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require('hardhat-contract-sizer');
require('solidity-docgen');
require('@primitivefi/hardhat-dodoc');

const {
  INFURA_KEY, 
  MNEMONIC,
  ETHERSCAN_API_KEY,
  POLYGONSCAN_KEY,
  OPTIMISM_API,
  ARBISCAN_API
    } = process.env;


// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      { 
        version: "0.8.9", 
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
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
      accounts: {mnemonic: MNEMONIC}
    },
    
    ethereum_mainnet :{
      url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
      allowUnlimitedContractSize:false,
      timeout: 99999999,
      blockGasLimit: 100_000_000,
      gas: 100_000_000,
      gasMultiplier: 1,
      gasPrice: 90_000_000_000, // 90 gwei
      accounts: {mnemonic: MNEMONIC}
    },

    polygon_mainnet: {
      url: `https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`,
      accounts: {mnemonic: MNEMONIC}
    },

    arbitrum_mainnet: {
      url: `https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`,
      accounts: {mnemonic: MNEMONIC}
    },

    optimism_mainnet: {
      url: `https://optimism-mainnet.infura.io/v3/${INFURA_KEY}`,
      network_id:420,
      accounts: {mnemonic: MNEMONIC}
    },

    polygon_mumbai: {
      url: `https://rpc-mumbai.maticvigil.com/v1/8ec24f48b4472038e2b1d8522ae4cb5b4c9ca621`,
      accounts: {mnemonic: MNEMONIC}
    },
    optimism_goerli: {
      url: `https://goerli.optimism.io`,
      network_id:420,
      accounts: {mnemonic: MNEMONIC}
    },
    
    ethereum_goerli: {
      url: "https://goerli.infura.io/v3/4da55396843c4f4581209cf10076a551",
      gas: 10_000_000,
      gasMultiplier: 50,
      gasPrice: 2_000_000_000,
      timeout: 99999999,
      accounts: {mnemonic: MNEMONIC}
    },
    arbitrum_goerli: {
      url: 'https://goerli-rollup.arbitrum.io/rpc',
      accounts: {mnemonic: MNEMONIC}
    },
    
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  mocha: {
    timeout: 60000
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: true,
    only: [],
  },
  docgen:{
    path: './docs',
    clear: true,
    runOnCompile: true,
    pages: 'files',
  },
  dodoc: {
    runOnCompile: false,
    debugMode: false,
  },
};
