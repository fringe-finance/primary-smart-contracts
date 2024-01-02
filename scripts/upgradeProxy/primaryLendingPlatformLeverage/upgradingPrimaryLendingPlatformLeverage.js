const { upgradePrimaryLendingPlatformLeverage } = require("./upgradePrimaryLendingPlatformLeverage.js");

async function main() {
    console.log("***** PRIMARY LENDING PLATFORM LEVERAGE DEPLOYMENT *****");
    await upgradePrimaryLendingPlatformLeverage();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});