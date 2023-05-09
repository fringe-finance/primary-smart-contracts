
const { upgradePrimaryIndexToken } = require("./upgradePrimaryIndexToken.js");

async function main() {
    console.log("***** PRIMARY INDEX TOKEN DEPLOYMENT *****");
    await upgradePrimaryIndexToken();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});