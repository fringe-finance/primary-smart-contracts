
const { upgradePriceProviderAggregator } = require("./upgradePriceProviderAggregator.js");

async function main() {
    console.log("***** PRICE PROVIDER AGGREGATOR UPGRADE *****");
    await upgradePriceProviderAggregator();
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});