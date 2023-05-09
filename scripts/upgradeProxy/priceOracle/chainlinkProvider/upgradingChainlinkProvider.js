
const { upgradeChainlinkProvider } = require("./upgradeChainlinkProvider.js");

async function main() {
    console.log("***** PRICE CHAINLINK PROVIDER UPGRADE *****");
    await upgradeChainlinkProvider();
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});