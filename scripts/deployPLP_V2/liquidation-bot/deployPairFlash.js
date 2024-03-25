
const { deploymentPairFlash } = require("./deploymentPairFlash.js");

async function main() {
    await deploymentPairFlash();
    process.exit();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});