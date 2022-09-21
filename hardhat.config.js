require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require('hardhat-contract-sizer');
require('solidity-docgen');
require('@primitivefi/hardhat-dodoc');
require("@matterlabs/hardhat-zksync-deploy");
require("@matterlabs/hardhat-zksync-solc");

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
  // zksolc: {
  //   version: "0.1.0",
  //   // docker的编译器源：matterlabs/zksolc
  //   // Docker's compiler source: matterlabs/zksolc
  //   compilerSource: "docker",
  //   settings: {
  //     optimizer: {
  //       enabled: true,
  //     },
  //     experimental: {
  //       dockerImage: "matterlabs/zksolc",
  //     },
  //   },
  // },
  // zkSyncDeploy: {
  //   // zkSync testnet：https://portal.zksync.io/
  //   zkSyncNetwork: "https://zksync2-testnet.zksync.dev",
  //   // goerli testnet：https://goerli-faucet.mudit.blog/
  //   // Can also be the RPC URL of the network (e.g. `https://goerli.infura.io/v3/<API_KEY>`)
  //   ethNetwork: "goerli",
  // },
  networks: {
    // hardhat: {
    //   zksync: true,
    //   accounts: {mnemonic: MNEMONIC} 
    // },
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
    mainnet :{
      url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
      allowUnlimitedContractSize:false,
      timeout: 99999999,
      blockGasLimit: 100_000_000,
      gas: 100_000_000,
      gasMultiplier: 1,
      gasPrice: 90_000_000_000, // 90 gwei
      accounts: {mnemonic: MNEMONIC}
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
      gas: 6_000_000,
      gasMultiplier: 50,
      gasPrice: 90000000000,
      timeout: 99999999,
      accounts: {mnemonic: MNEMONIC}
    },
    polygon_main: {
      url: `https://polygon-rpc.com/`,
      accounts: {mnemonic: MNEMONIC}
    },
    polygon_test: {
      url: `https://rpc-mumbai.maticvigil.com/v1/8ec24f48b4472038e2b1d8522ae4cb5b4c9ca621`,
      accounts: {mnemonic: MNEMONIC}
    },
    optimism_test: {
      url: `https://goerli.optimism.io`,
      network_id:420,
      accounts: {mnemonic: MNEMONIC}
    },
    arbitrum_rinkeby: {
      url: 'https://rinkeby.arbitrum.io/rpc',
      accounts: {mnemonic: MNEMONIC}
    },
    zksyn_test: {
      url: 'https://zksync2-testnet.zksync.dev',
      accounts: {mnemonic: MNEMONIC},
    },
    zksync: {
      url: 'https://zksync2-testnet.zksync.dev',
      accounts: {mnemonic: MNEMONIC}
    },
    goerli: {
      url: "https://goerli.infura.io/v3/3848cfba853a40f4910a45e1d18caca3",
      gas: 10_000_000,
      gasMultiplier: 50,
      gasPrice: 100000000000,
      timeout: 99999999,
      accounts: {mnemonic: MNEMONIC}
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  mocha: {
    timeout: 60000
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  polygonscan: {
    apiKey: POLYGONSCAN_KEY
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
  solidity: {
    compilers: [
      { 
        version: "0.8.9", 
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
      }
  }]
  },
};
