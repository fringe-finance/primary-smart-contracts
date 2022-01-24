
const { deploymentAndSettingPrimaryLendingPlatform } = require("./deploymentAndSettingPrimaryLendingPlatform.js");

async function main() {
    let proxyAdminAddress;// = '0xc6636b088AB0f794DDfc1204e7C58D8148f62203';
    let priceProviderAggregatorAddress;
    await deploymentAndSettingPrimaryLendingPlatform(proxyAdminAddress, priceProviderAggregatorAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
