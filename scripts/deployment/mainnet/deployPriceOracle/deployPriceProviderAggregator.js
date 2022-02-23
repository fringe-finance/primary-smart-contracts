
const { deploymentAndSettingPriceProividerAggregator } = require("./deploymentAndSettingPriceProividerAggregator.js");

async function main() {
    let proxyAdminAddress;
    await deploymentAndSettingPriceProividerAggregator(proxyAdminAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
