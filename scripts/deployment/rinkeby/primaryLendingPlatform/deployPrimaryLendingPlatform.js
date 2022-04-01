
const { deploymentPrimaryLendingPlatform } = require("./deploymentPrimaryLendingPlatform.js");

async function main() {
    let proxyAdminAddress
    let priceProviderAggregatorAddress
    await deploymentPrimaryLendingPlatform(proxyAdminAddress, priceProviderAggregatorAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
