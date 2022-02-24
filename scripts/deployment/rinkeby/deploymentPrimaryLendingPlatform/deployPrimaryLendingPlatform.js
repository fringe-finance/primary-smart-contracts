
const { deploymentAndSettingPIT } = require("./deploymentAndSettingPIT.js");

async function main() {
    let proxyAdminAddress;// = '0xc6636b088AB0f794DDfc1204e7C58D8148f62203';
    let priceProviderAggregatorAddress = '0xB7D77809d1Ef631FCaeA6b151d6453dBA727F6EC';
    await deploymentAndSettingPIT(proxyAdminAddress, priceProviderAggregatorAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
