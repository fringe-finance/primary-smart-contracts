
const { deploymentPriceProividerAggregator } = require("./deploymentPriceProividerAggregator.js");

async function main() {
    let proxyAdminAddress;
    await deploymentPriceProividerAggregator(proxyAdminAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
