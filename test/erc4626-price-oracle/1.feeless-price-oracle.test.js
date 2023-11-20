const hre = require("hardhat");
const { expect } = require("chai");
const { deployAndSetup, vaults, loadERC4626ContractInstance } = require("./utils/load-fixture");
const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);

describe("FeelessERC4626PriceProvider", function () {

    let feeLessERC4626PriceProviderInstance;
    let chainlinkPriceProviderInstance;

    before(async function () {

        const contracts = await deployAndSetup();

        feeLessERC4626PriceProviderInstance = contracts.feeLessERC4626PriceProvider;
        chainlinkPriceProviderInstance = contracts.chainlinkPriceProvider;
    });

    Object.keys(vaults).forEach(async (v) => {
        it(`Should return the correct price for ${v} Vault token`, async function () {
            let vault = await loadERC4626ContractInstance(vaults[v]);
            let vaultDecimals = await vault.decimals();
    
            let oneVaultAmount = toBN(10).pow(vaultDecimals);
    
            let assetAmount = await vault.convertToAssets(oneVaultAmount);
            let expectedPrice = await chainlinkPriceProviderInstance.getEvaluation(await vault.asset(), assetAmount);
            let priceData = await feeLessERC4626PriceProviderInstance.getPrice(vaults[v]);

            expect(priceData.priceMantissa).to.eq(expectedPrice);
        });
    });
});