
const { upgradeBackendProvider } = require("./upgradeBackendProvider.js");

async function main() {
    console.log("***** BACKEND PROVIDER UPGRADE *****");
    await upgradeBackendProvider();
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});