
const { upgradePrimaryIndexTokenAtomicRepayment } = require("./upgradePrimaryIndexTokenAtomicRepayment.js");

async function main() {
    console.log("***** PRIMARY INDEX TOKEN DEPLOYMENT *****");
    await upgradePrimaryIndexTokenAtomicRepayment();
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});