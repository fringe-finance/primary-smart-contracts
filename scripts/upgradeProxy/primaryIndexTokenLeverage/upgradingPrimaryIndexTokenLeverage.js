const { upgradePrimaryIndexTokenLeverage } = require("./upgradePrimaryIndexTokenLeverage.js");

async function main() {
    console.log("***** PRIMARY INDEX TOKEN LEVERAGE DEPLOYMENT *****");
    await upgradePrimaryIndexTokenLeverage();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});