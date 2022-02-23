
const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let bondtrollerAddress = '0x34C227E897e8C039ecD8e38a2921786C73cFaD64';
let pauser =             '0x0978C0a76Ea13C318875Df7e87Bc3959d3Ad2816';

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
    let bondtroller = await Bondtroller.attach(bondtrollerAddress).connect(deployMaster);

    let tx = await bondtroller.setPauseGuardian(pauser).then(function(instance){
        console.log("Bondtroller set pauser: " + pauser);
        return instance;
    });

    await tx.wait();
    console.log(tx);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
