
const { deploymentPriceOracle } = require("./deploymentPriceOracle.js");

async function main() {
    let proxyAdminAddress;// = '0xc6636b088AB0f794DDfc1204e7C58D8148f62203';
    await deploymentPriceOracle(proxyAdminAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
