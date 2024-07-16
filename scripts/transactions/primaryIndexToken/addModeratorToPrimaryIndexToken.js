
const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let primaryIndexTokenProxyAddress = '0xD83125995B2D8d04556894C528e10e99473751cc';
let moderatorAddress = '0x0978C0a76Ea13C318875Df7e87Bc3959d3Ad2816';

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let PrimaryIndexToken = await hre.ethers.getContractFactory("PrimaryIndexToken");
    
    let primaryIndexToken = await PrimaryIndexToken.attach(primaryIndexTokenProxyAddress).connect(deployMaster);
    let tx = await primaryIndexToken.grandModerator(moderatorAddress)
    .then(function(instance){
        console.log("PrimaryIndexToken set moderator " + moderatorAddress);
        return instance;
    });
    console.log(tx);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
