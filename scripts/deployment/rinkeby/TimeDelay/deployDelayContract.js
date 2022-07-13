
const { deploymentDelayContract } = require("./deploymentIntermediaryTimeDelay.js");

async function main() {;
    await deploymentDelayContract();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
