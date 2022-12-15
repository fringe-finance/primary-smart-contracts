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
  },
  solidity: {
    version: "0.8.9",
  },
};