/**
 * Testing chain configuration file
 * The option to overwrite depends on the chain being used
 * Bellow is the default setup information for the currently supported chain
 */
module.exports = {

  // Define chain to run script test
  chain: 'polygon_mainnet',
  isZksync: false,
  isTestingForZksync: true,

  /**
   * Mainnet configuration for deployment
   */
  // Setting of ethereum mainnet
  mainnet: {
    isTesting: false,
    isLayer2: false
  },

  // Setting of mumbai chain
  optimism_mainnet: {
    isTesting: false,
    isLayer2: true
  },


  // Setting of polygon mainnet
  polygon_mainnet: {
    blockNumber: '47250000',
    isTesting: true,
    isLayer2: false
  },

  // Setting of arbitrum mainnet chain 
  arbitrum_mainnet: {
    isTesting: false,
    isLayer2: true
  },

  /**
   * Testnet configuration for testing and deployment
   */
  // Setting of goerli chain
  goerli: {
    blockNumber: '9560000',
    isTesting: true, // Please set it to false before running the deployment script on testnet (Default: true).
    isLayer2: false
  },

  // Setting of optimism goerli chain
  optimism_goerli: {
    blockNumber: '13970000',
    isTesting: false, // Please set it to false before running the deployment script on testnet (Default: true).
    isLayer2: true
  },

  // Setting of polygon chain
  polygon_mumbai: {
    blockNumber: '39540000',
    isTesting: true, // Please set it to false before running the deployment script on testnet (Default: true).
    isLayer2: false
  },

  // Setting of arbitrum chain 
  arbitrum_goerli: {
    blockNumber: '37650000',
    isTesting: false, // Please set it to false before running the deployment script on testnet (Default: true).
    isLayer2: true
  },
   // Setting of zksync goerli 
   zksync_goerli: {
    isTesting: false, // Please set it to false before running the deployment script on testnet (Default: true).
  },
};