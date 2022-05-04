const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let bondtrollerAddress = '0x7E87a2D1C7FF51A9904537076749A71044e192AE';
let busdc = '0xCE3156761EF59D1543495B3172FE0e0946206Eb7'
let isMintPaused = false;

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
    let bondtroller = await Bondtroller.attach(bondtrollerAddress).connect(deployMaster);

   
    tx = await bondtroller.setMintPaused(busdc, isMintPaused).then(function(instance){
        console.log("Bondtroller set mint pause state: " + isMintPaused);
        return instance;
    });

    await tx.wait();
    console.log(tx);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
