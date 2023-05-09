
const { upgradePrimaryIndexToken } = require("./primaryIndexToken/upgradePrimaryIndexToken.js");
const {upgradePrimaryIndexTokenModerator} = require("./primaryIndexTokenModerator/upgradePrimaryIndexTokenModerator.js");
const { upgradePrimaryIndexTokenAtomicRepayment } = require("./primaryIndexTokenAtomicRepayment/upgradePrimaryIndexTokenAtomicRepayment.js");
const { upgradePrimaryIndexTokenLeverage } = require("./primaryIndexTokenLeverage/upgradePrimaryIndexTokenLeverage.js");
const { upgradePrimaryIndexTokenLiquidation } = require("./primaryIndexTokenLiquidation/upgradePrimaryIndexTokenLiquidation.js");
const { upgradePrimaryIndexTokenWrappedTokenGateway } = require("./primaryIndexTokenWrappedTokenGateway/upgradePrimaryIndexTokenWrappedTokenGateway.js");

async function main() {
    console.log("***** PRIMARY INDEX TOKEN DEPLOYMENT *****");
    await upgradePrimaryIndexToken();

    console.log();
    console.log("***** PRIMARY INDEX TOKEN MODERATOR DEPLOYMENT *****");
    await upgradePrimaryIndexTokenModerator();

    console.log();
    console.log("***** PRIMARY INDEX TOKEN ATOMIC REPAYMENT DEPLOYMENT *****");
    await upgradePrimaryIndexTokenAtomicRepayment();

    console.log();
    console.log("***** PRIMARY INDEX TOKEN LEVERAGE DEPLOYMENT *****");
    await upgradePrimaryIndexTokenLeverage();

    console.log();
    console.log("***** PRIMARY INDEX TOKEN LIQUIDATION DEPLOYMENT *****");
    await upgradePrimaryIndexTokenLiquidation();

    console.log();
    console.log("***** PRIMARY INDEX TOKEN WRAPPED TOKEN GATEWAY DEPLOYMENT *****");
    await upgradePrimaryIndexTokenWrappedTokenGateway();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});