const { upgradePrimaryIndexTokenLiquidation } = require("./upgradePrimaryIndexTokenLiquidation.js");

async function main() {
    console.log("***** PRIMARY INDEX TOKEN LIQUIDATION DEPLOYMENT *****");
    await upgradePrimaryIndexTokenLiquidation();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});