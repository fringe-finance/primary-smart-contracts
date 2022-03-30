
const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let primaryIndexTokenAddress = '0x8d53a40f809B83729167Cf1eAB21fec12017667E'
let priceOracleAddress = '0x6ba6416c2f7BfbcC23E5522F7C6883b26CD617FD'

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let PrimaryIndexToken = await hre.ethers.getContractFactory("PrimaryIndexToken");

    let primaryIndexToken = await PrimaryIndexToken.attach(primaryIndexTokenAddress).connect(deployMaster);
    
    await primaryIndexToken.setPriceOracle(priceOracleAddress).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash)
        console.log("PrimaryIndexToken set price oracle: "+ priceOracleAddress)
    })

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
