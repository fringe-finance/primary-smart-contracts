
const { deploymentRinkeby } = require("./deploymentRinkeby.js");

async function main() {
 
    await deploymentRinkeby();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
