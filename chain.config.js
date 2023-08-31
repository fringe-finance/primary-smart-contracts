/**
 * Testing chain configuration file
 * The option to overwrite depends on the chain being used
 * Bellow is the default setup information for the currently supported chain
 */
module.exports = {

  // Define chain to run script test
  chain: 'arbitrum_goerli',
  isZksync: false,

  /**
   * Mainnet configuration for deployment
   */
  // Setting of goerli chain
  ethereum: {
    isTesting: false,
    isLayer2: false
  },

  // Setting of mumbai chain
  optimism: {
    isTesting: false,
    isLayer2: true
  },

  // Setting of polygon chain
  polygon: {
    isTesting: false,
    isLayer2: false
  },

  // Setting of arbitrum mainnet chain 
  arbitrum: {
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
    isTesting: true, // Please set it to false before running the deployment script on testnet (Default: true).
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

  // Setting of zksync chain fork mainnet 
  zksync_fork_mainnet: {
    blockNumber: '12490000',
    isTesting: false, // Please set it to false before running the deployment script on testnet (Default: true).
  },
};