
const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];

    let bondtrollerAddress = '0x34C227E897e8C039ecD8e38a2921786C73cFaD64';
    let pauser = '';

    let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
    let bondtroller = await Bondtroller.attach(bondtrollerAddress).connect(deployMaster);

    await bondtroller.setPauseGuardian(pauser).then(function(){
        console.log("Bondtroller set pauser: " + pauser);
    });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
