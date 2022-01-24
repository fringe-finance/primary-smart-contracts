require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require('hardhat-contract-sizer');

const {
    INFURA_KEY, 
    MNEMONIC,
    ETHERSCAN_API_KEY
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
      blockGasLimit: 100000000,
      gas: 100000000,
      accounts: {mnemonic: MNEMONIC}
    },
    
    mainnet :{
      url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
      gas: 1_000_000,
      gasPrice: 90000000000,
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
  }
};
