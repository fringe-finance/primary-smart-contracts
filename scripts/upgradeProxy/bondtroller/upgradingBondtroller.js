
const { upgradeBondtroller } = require("./upgradeBondtroller.js");

async function main() {
    console.log("***** BONDTROLLER UPGRADE *****");
    await upgradeBondtroller();
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});