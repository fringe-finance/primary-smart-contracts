require("@matterlabs/hardhat-zksync-deploy");
require("@matterlabs/hardhat-zksync-solc");

module.exports = {
  zksolc: {
    version: "1.2.1",
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
  zkSyncDeploy: {
    zkSyncNetwork: "https://zksync2-testnet.zksync.dev",
    ethNetwork: "https://goerli.infura.io/v3/1629e80003614d94915133a1ed88f25c", // Can also be the RPC URL of the network (e.g. `https://goerli.infura.io/v3/<API_KEY>`)
  },
  networks: {
    hardhat: {
      zksync: true,
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
  solidity: {
    version: "0.8.9",
  },
};