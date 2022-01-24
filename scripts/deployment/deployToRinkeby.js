
const { deploymentAllToRinkeby } = require("./rinkeby/deploymentAllToRinkeby.js");

async function main() {
    await deploymentAllToRinkeby();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
