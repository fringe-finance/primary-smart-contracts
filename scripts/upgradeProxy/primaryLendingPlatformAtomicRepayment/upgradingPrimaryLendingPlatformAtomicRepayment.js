
const { upgradePrimaryLendingPlatformAtomicRepayment } = require("./upgradePrimaryLendingPlatformAtomicRepayment.js");

async function main() {
    console.log("***** PRIMARY LENDING PLATFORM DEPLOYMENT *****");
    await upgradePrimaryLendingPlatformAtomicRepayment();
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});