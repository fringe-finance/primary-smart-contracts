
const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let primaryIndexTokenAddress = '0xD83125995B2D8d04556894C528e10e99473751cc';
let projectTokenAddress = '';
let borrowLimit = toBN(1000).mul(toBN(10).pow(toBN(6)));

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let PrimaryIndexToken = await hre.ethers.getContractFactory("PrimaryIndexToken");

    let primaryIndexToken = await PrimaryIndexToken.attach(primaryIndexTokenProxyAddress).connect(deployMaster);
    
    let PRJtokens = [
        '0x40EA2e5c5b2104124944282d8db39C5D13ac6770',
        '0x69648Ef43B7496B1582E900569cd9dDEc49C045e',
        '0xfA91A86700508806AD2A49Bebce34a08c6ad7a65',
        '0xc6636b088AB0f794DDfc1204e7C58D8148f62203',
        '0x37a7D483d2dfe97d0C00cEf6F257e25d321e6D4e',
        '0x16E2f279A9BabD4CE133745DdA69C910CBe2e490'
    ];
    let i = 0;
    let tx = await primaryIndexToken.setBorrowLimit(PRJtokens[i], borrowLimit)
    .then(function(instance){
        console.log("PrimaryIndexToken set " + PRJtokens[i] + " borrow limit " + borrowLimit);
        return instance;
    });

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
