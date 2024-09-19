const { deployment } = require("./deploymentPLP")

async function try_deployment() {
    await deployment();
    process.exit();
}

module.exports = async function () {
    await try_deployment();
}