
const { deploymentPrimaryLendingPlatform } = require("./deploymentPrimaryLendingPlatform.js");

async function main() {
    await deploymentPrimaryLendingPlatform();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});