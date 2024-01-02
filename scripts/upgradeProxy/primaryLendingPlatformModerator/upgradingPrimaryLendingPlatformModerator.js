
const {upgradePrimaryLendingPlatformModerator} = require("./upgradePrimaryLendingPlatformModerator.js");

async function main() {
    console.log("***** PRIMARY LENDING PLATFORM MODERATOR DEPLOYMENT *****");
    await upgradePrimaryLendingPlatformModerator();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});