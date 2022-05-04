const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let bondtrollerAddress = '0xEC95473b15d52c7b62f3002B402a5dBF4fC8fa03';
let busdc = '0xCC105E057044Fd7F9108C23a1AEBa43661a15492'
let isBorrowPaused = false;

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
    let bondtroller = await Bondtroller.attach(bondtrollerAddress).connect(deployMaster);

    let tx = await bondtroller.setBorrowPaused(busdc ,isBorrowPaused).then(function(instance){
        console.log("Bondtroller set borrow pause state: " + isBorrowPaused);
        return instance;
    });

    await tx.wait();
    console.log(tx);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});