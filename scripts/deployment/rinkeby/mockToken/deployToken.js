
const { deploymentToken } = require("./deploymentToken.js");

async function main() {
    let proxyAdminAddress //= '0xaB67F661b45e86a4e5120FC39Ce24e42ea3447FD';
    await deploymentToken(proxyAdminAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
