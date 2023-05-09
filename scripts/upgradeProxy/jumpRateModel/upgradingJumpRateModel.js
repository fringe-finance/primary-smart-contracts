
const { upgradeJumpRateModel } = require("./upgradeJumpRateModel.js");

async function main() {
    console.log("***** JUMP RATE UPGRADE *****");
    await upgradeJumpRateModel();
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});