const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let bondtrollerAddress = '0x34C227E897e8C039ecD8e38a2921786C73cFaD64';
let busdc = '0xe137572e83f93aE50F3C1F4762135E2D9A8f384A'
let primaryIndexTokenProxyAddress = '0x8D492475D2136Ae64b172b23F519840d5775C8Cd'
let isBorrowPaused = false;
let isMintPaused = false;
let isTransferPaused = false; 

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
    let PrimaryIndexToken = await hre.ethers.getContractFactory("PrimaryIndexToken");
    
   
    let bondtroller = await Bondtroller.attach(bondtrollerAddress).connect(deployMaster);
    let primaryIndexToken = await PrimaryIndexToken.attach(primaryIndexTokenProxyAddress).connect(deployMaster);

    let tx = await bondtroller.setBorrowPaused(busdc ,isBorrowPaused).then(function(instance){
        console.log("Bondtroller set borrow pause state: " + isBorrowPaused);
        return instance;
    });

    await tx.wait();
    console.log(tx);

    tx = await bondtroller.setMintPaused(busdc ,isMintPaused).then(function(instance){
        console.log("Bondtroller set mint pause state: " + isMintPaused);
        return instance;
    });

    await tx.wait();
    console.log(tx);

    tx = await bondtroller.setTransferPaused(isTransferPaused).then(function(instance){
        console.log("Bondtroller set mint pause state: " + isMintPaused);
        return instance;
    });

    await tx.wait();
    console.log(tx);

    tx = await primaryIndexToken.unpause()
    .then(function(instance){
        console.log("PrimaryIndexToken unpause contract ");
        return instance;
    });
    await tx.wait();
    console.log(tx);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
