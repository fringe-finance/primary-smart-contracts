
const {upgradePrimaryIndexTokenModerator} = require("./upgradePrimaryIndexTokenModerator.js");

async function main() {
    console.log("***** PRIMARY INDEX TOKEN MODERATOR DEPLOYMENT *****");
    await upgradePrimaryIndexTokenModerator();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});