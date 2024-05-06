const { upgradePrimaryLendingPlatformWrappedTokenGateway } = require("./upgradePrimaryLendingPlatformWrappedTokenGateway.js");

async function main() {
    console.log("***** PRIMARY LENDING PLATFORM WRAPPED TOKEN GATEWAY DEPLOYMENT *****");
    await upgradePrimaryLendingPlatformWrappedTokenGateway();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});