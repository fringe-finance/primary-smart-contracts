import { utils, Wallet } from 'zksync-web3';
import * as ethers from 'ethers';
// https://github.com/matter-labs/hardhat-zksync/blob/main/packages/hardhat-zksync-deploy/src/deployer.ts
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import hre from "hardhat";
require('dotenv').config();

const main = async function (hre) {
  console.log('run deploy code for Greeter contract');

  let network = await hre.network;
  console.log("Network name: "+network.name);

  const wallet = new Wallet("0xe5fdde82360d1b2274901f3ebe49824d93a1303cd4ccea21d768565ed7440123");

  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact('Greeter');
  
  const greeting = 'alo alo!';
  const greeterContract = await deployer.deploy(artifact, [greeting]);

  const contractAddress = greeterContract.address;
  console.log(`${artifact.contractName} contract was deployed to ${contractAddress}`);
}

export default main;