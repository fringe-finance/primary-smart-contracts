const { upgradePrimaryIndexTokenWrappedTokenGateway } = require("./upgradePrimaryIndexTokenWrappedTokenGateway.js");

async function main() {
    console.log("***** PRIMARY INDEX TOKEN WRAPPED TOKEN GATEWAY DEPLOYMENT *****");
    await upgradePrimaryIndexTokenWrappedTokenGateway();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});