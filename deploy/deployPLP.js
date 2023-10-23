const { deployment } = require("./deploymentPLP")

async function try_deployment() {
    try {
        await deployment();
    } catch (error) {
        await try_deployment();
    }
}

module.exports = async function () {
    await try_deployment();
}