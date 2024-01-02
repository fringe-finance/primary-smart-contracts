
const { upgradePrimaryLendingPlatform } = require("./primaryLendingPlatform/upgradePrimaryLendingPlatform.js");
const {upgradePrimaryLendingPlatformModerator} = require("./primaryLendingPlatformModerator/upgradePrimaryLendingPlatformModerator.js");
const { upgradePrimaryLendingPlatformAtomicRepayment } = require("./primaryLendingPlatformAtomicRepayment/upgradePrimaryLendingPlatformAtomicRepayment.js");
const { upgradePrimaryLendingPlatformLeverage } = require("./primaryLendingPlatformLeverage/upgradePrimaryLendingPlatformLeverage.js");
const { upgradePrimaryLendingPlatformLiquidation } = require("./primaryLendingPlatformLiquidation/upgradePrimaryLendingPlatformLiquidation.js");
const { upgradePrimaryLendingPlatformWrappedTokenGateway } = require("./primaryLendingPlatformWrappedTokenGateway/upgradePrimaryLendingPlatformWrappedTokenGateway.js");

async function main() {
    console.log("***** PRIMARY LENDING PLATFORM DEPLOYMENT *****");
    await upgradePrimaryLendingPlatform();

    console.log();
    console.log("***** PRIMARY LENDING PLATFORM MODERATOR DEPLOYMENT *****");
    await upgradePrimaryLendingPlatformModerator();

    console.log();
    console.log("***** PRIMARY LENDING PLATFORM ATOMIC REPAYMENT DEPLOYMENT *****");
    await upgradePrimaryLendingPlatformAtomicRepayment();

    console.log();
    console.log("***** PRIMARY LENDING PLATFORM LEVERAGE DEPLOYMENT *****");
    await upgradePrimaryLendingPlatformLeverage();

    console.log();
    console.log("***** PRIMARY LENDING PLATFORM LIQUIDATION DEPLOYMENT *****");
    await upgradePrimaryLendingPlatformLiquidation();

    console.log();
    console.log("***** PRIMARY LENDING PLATFORM WRAPPED TOKEN GATEWAY DEPLOYMENT *****");
    await upgradePrimaryLendingPlatformWrappedTokenGateway();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});