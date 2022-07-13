
const { deploymentProxyAdmin } = require("./deploymentProxyAdmin.js");

async function main() {;
    await deploymentProxyAdmin();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
