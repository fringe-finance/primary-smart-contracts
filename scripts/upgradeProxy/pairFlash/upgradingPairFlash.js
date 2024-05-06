const { upgradePairFlash } = require("./upgradePairFlash.js");

async function main() {
    console.log("***** PAIRFLASH DEPLOYMENT *****");
    await upgradePairFlash();
    process.exit();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});