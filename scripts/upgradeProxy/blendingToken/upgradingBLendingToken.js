
const { upgradeBLendingToken } = require("./upgradeBLendingToken.js");

async function main() {
    console.log("***** BLENDING TOKEN UPGRADE *****");
    await upgradeBLendingToken();
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});