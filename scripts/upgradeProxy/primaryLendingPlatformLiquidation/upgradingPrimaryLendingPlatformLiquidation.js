const { upgradePrimaryLendingPlatformLiquidation } = require("./upgradePrimaryLendingPlatformLiquidation.js");

async function main() {
    console.log("***** PRIMARY LENDING PLATFORM LIQUIDATION DEPLOYMENT *****");
    await upgradePrimaryLendingPlatformLiquidation();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});