
const { deploymentPriceOracle } = require("./deploymentPriceOracle.js");

async function main() {
    await deploymentPriceOracle();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
