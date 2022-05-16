const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let bondtrollerAddress = '0x7E87a2D1C7FF51A9904537076749A71044e192AE';
let isTransferPaused = false;

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
    let bondtroller = await Bondtroller.attach(bondtrollerAddress).connect(deployMaster);

   
    tx = await bondtroller.setTransferPaused(isTransferPaused).then(function(instance){
        console.log("Bondtroller set mint pause state: " + isTransferPaused);
        return instance;
    });

    await tx.wait();
    console.log(tx);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
