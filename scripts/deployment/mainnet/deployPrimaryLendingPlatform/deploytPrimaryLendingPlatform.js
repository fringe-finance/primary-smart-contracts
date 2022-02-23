
const { deploymentAndSettingPrimaryLendingPlatform } = require("./deploymentAndSettingPrimaryLendingPlatform.js");

async function main() {
    let proxyAdminAddress;
    let priceProviderAggregatorAddress = '0xB7D77809d1Ef631FCaeA6b151d6453dBA727F6EC';
    await deploymentAndSettingPrimaryLendingPlatform(proxyAdminAddress, priceProviderAggregatorAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
