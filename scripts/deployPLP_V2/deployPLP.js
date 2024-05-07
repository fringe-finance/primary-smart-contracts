
const { deployment } = require("./deploymentPLP.js");

async function main() {
 
    await deployment();
    process.exit();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});