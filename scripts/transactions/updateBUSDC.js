
const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let proxyAdmingAddress = '0xa9D799AF1c4B0aF6a927bC864ffbf35Aef42177a';
let busdcProxyAddress = '0xe1b0273C21d509D6D3D7a02bFEaa694dd9363168';

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    let BUSDC = await hre.ethers.getContractFactory("BLendingToken");
    
    let busdc = await BUSDC.connect(deployMaster).deploy();
    await busdc.deployed();
    let busdcMasterCopyAddress = busdc.address;
    console.log("BUSDC masterCopy address: " + busdcMasterCopyAddress);
  
    let proxyAdmin = await ProxyAdmin.attach(proxyAdmingAddress).connect(deployMaster);
    await proxyAdmin.upgrade(busdcProxyAddress, busdcMasterCopyAddress)
    .then(function(instance){
        console.log("ProxyAdmin upgraded " + busdcProxyAddress + " to " + busdcMasterCopyAddress);
        return instance;
    });


}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
