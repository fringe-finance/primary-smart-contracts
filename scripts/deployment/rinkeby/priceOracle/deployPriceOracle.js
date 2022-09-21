
const { deploymentPriceOracle } = require("./deploymentUniSwapV2Provider.js");

async function main() {
    await deploymentPriceOracle();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
