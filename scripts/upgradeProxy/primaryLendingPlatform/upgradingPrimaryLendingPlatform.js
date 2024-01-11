
const { upgradePrimaryLendingPlatform } = require("./upgradePrimaryLendingPlatform.js");

async function main() {
    console.log("***** PRIMARY LENDING PLATFORM DEPLOYMENT *****");
    await upgradePrimaryLendingPlatform();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});