
const { deploymentPriceOracle } = require("./deploymentPriceProividerAggregator.js");

async function main() {
    await deploymentPriceOracle();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});