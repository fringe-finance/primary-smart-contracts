
const { deploymentPriceProviderAggregator } = require("./deploymentPriceProviderAggregator.js");

module.exports = async function() {
  await deploymentPriceProviderAggregator();
}