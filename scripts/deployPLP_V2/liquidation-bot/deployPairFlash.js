
const { deploymentPairFlash } = require("./deploymentPairFlash.js");

async function main() {
    await deploymentPairFlash();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});