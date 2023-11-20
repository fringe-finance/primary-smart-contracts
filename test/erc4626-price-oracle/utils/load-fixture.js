const ChainlinkPriceProviderArtifacts = require("../../../artifacts/contracts/priceOracle/priceproviders/ChainlinkPriceProvider.sol/ChainlinkPriceProvider.json");
const FeeLessERC4626PriceProviderArtifacts = require("../../../artifacts/contracts/priceOracle/priceproviders/FeelessERC4626PriceProvider.sol/FeelessERC4626PriceProvider.json");
const IERC4626Artifacts = require("../../../artifacts/@openzeppelin/contracts-upgradeable/interfaces/IERC4626Upgradeable.sol/IERC4626Upgradeable.json");
const hre = require("hardhat");




///////////////////////////////////////////////////////////////////////////
//  ADDRESSES OF VAULT ERC-4626 TOKENS ON ETHEREUM MAINNET
///////////////////////////////////////////////////////////////////////////
const vaults = {
    sFrax: "0xA663B02CF0a4b149d2aD41910CB81e23e1c41c32",
    ma3WETH: "0x39Dd7790e75C6F663731f7E1FdC0f35007D3879b",
    maWBTC: "0xd508F85F1511aAeC63434E26aeB6d10bE0188dC7",
    maWETH: "0x490BBbc2485e99989Ba39b34802faFa58e26ABa4",
    maDAI: "0x36F8d0D0573ae92326827C4a82Fe4CE4C244cAb6",
    maUSDC: "0xA5269A8e31B93Ff27B887B56720A25F844db0529",
    maUSDT: "0xAFe7131a57E44f832cb2dE78ade38CaD644aaC2f",
    maCRV: "0x9dc7094530cB1bcf5442c3b9389ee386738A190c",
    mcWBTC: "0xF31AC95fe692190b9C67112d8c912bA9973944F2",
    mcWETH: "0x676E1B7d5856f4f69e10399685e17c2299370E95",
    mcDAI: "0x8F88EaE3e1c01d60bccdc3DB3CBD5362Dd55d707",
    mcUSDC: "0xba9E3b3b684719F80657af1A19DEbc3C772494a0",
    mcUSDT: "0xC2A4fBA93d4120d304c94E4fd986e0f9D213eD8A",
    mcCOMP: "0xaA768b85eC827cCc36D882c1814bcd27ec4A8593",
    mcUNI: "0x496da625C736a2fF122638Dc26dCf1bFdEf1778c"
}

///////////////////////////////////////////////////////////////////////////
//  CHAINLINK AGGREGATORPATH ON ETHEREUM MAINNET
///////////////////////////////////////////////////////////////////////////
const chainlinkAggregatorPathFrax = ["0xB9E1E3A9feFf48998E45Fa90847ed4D467E8BcfD"]; // aggregatorPath Frax/USD
const chainlinkAggregatorPathWETH = ["0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"]; // aggregatorPath ETH/USD
const chainlinkAggregatorPathWBTC = ["0xfdFD9C85aD200c506Cf9e21F1FD8dd01932FBB23", "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c"]; // aggregatorPath WBTC/BTC & BTC/USD
const chainlinkAggregatorPathDAI = ["0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9"]; // aggregatorPath DAI/USD
const chainlinkAggregatorPathUSDC = ["0x986b5E1e1755e3C2440e960477f25201B0a8bbD4"]; // aggregatorPath USDC/USD
const chainlinkAggregatorPathUSDT = ["0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46"]; // aggregatorPath USDT/USD
const chainlinkAggregatorPathCRV = ["0xCd627aA160A6fA45Eb793D19Ef54f5062F20f33f"]; // aggregatorPath CRV/USD
const chainlinkAggregatorPathCOMP = ["0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5"]; // aggregatorPath COMP/USD
const chainlinkAggregatorPathUNI = ["0x553303d460EE0afB37EdFf9bE42922D8FF63220e"]; // aggregatorPath UNI/USD

async function getSigners() {
    return await hre.ethers.getSigners();
}
async function deployContract(abi, bytecode, args) {
    const signers = await getSigners();
    const factory = new hre.ethers.ContractFactory(abi, bytecode, signers[0]);
    return await factory.deploy(...args);
}
async function setupChainlinkPriceProvider(contract, token, aggregatorPath) {
    let tx = await contract.setTokenAndAggregator(token, aggregatorPath);
    await tx.wait();
    for (const a of aggregatorPath) {
        tx = await contract.setTimeOut(a, ethers.constants.MaxUint256);
        await tx.wait();
    }
}
async function loadERC4626ContractInstance(token) {
    const signers = await getSigners();
    return new hre.ethers.Contract(
        token,
        IERC4626Artifacts.abi,
        signers[0]
    );
}
async function deployAndSetupChainlinkPriceProvider() {
    const contract = await deployContract(ChainlinkPriceProviderArtifacts.abi, ChainlinkPriceProviderArtifacts.bytecode, []);
    let tx = await contract.initialize();
    await tx.wait();

    await setupChainlinkPriceProvider(contract, (await loadERC4626ContractInstance(vaults.sFrax)).asset(), chainlinkAggregatorPathFrax);
    await setupChainlinkPriceProvider(contract, (await loadERC4626ContractInstance(vaults.ma3WETH)).asset(), chainlinkAggregatorPathWETH);
    await setupChainlinkPriceProvider(contract, (await loadERC4626ContractInstance(vaults.maWBTC)).asset(), chainlinkAggregatorPathWBTC);
    await setupChainlinkPriceProvider(contract, (await loadERC4626ContractInstance(vaults.maDAI)).asset(), chainlinkAggregatorPathDAI);
    await setupChainlinkPriceProvider(contract, (await loadERC4626ContractInstance(vaults.maUSDC)).asset(), chainlinkAggregatorPathUSDC);
    await setupChainlinkPriceProvider(contract, (await loadERC4626ContractInstance(vaults.maUSDT)).asset(), chainlinkAggregatorPathUSDT);
    await setupChainlinkPriceProvider(contract, (await loadERC4626ContractInstance(vaults.maCRV)).asset(), chainlinkAggregatorPathCRV);
    await setupChainlinkPriceProvider(contract, (await loadERC4626ContractInstance(vaults.mcCOMP)).asset(), chainlinkAggregatorPathCOMP);
    await setupChainlinkPriceProvider(contract, (await loadERC4626ContractInstance(vaults.mcUNI)).asset(), chainlinkAggregatorPathUNI);

    return contract;
}
async function setVaultTokenAndProvider(contract, token, chainlinkPriceProviderAddress) {
    let tx = await contract.setVaultTokenAndProvider(token, chainlinkPriceProviderAddress);
    await tx.wait();
} 

async function deployAndSetup() {
    const feeLessERC4626PriceProvider = await deployContract(FeeLessERC4626PriceProviderArtifacts.abi, FeeLessERC4626PriceProviderArtifacts.bytecode, []);
    let tx = await feeLessERC4626PriceProvider.initialize();
    await tx.wait();

    const chainlinkPriceProvider = await deployAndSetupChainlinkPriceProvider();
    const chainlinkPriceProviderAddress = chainlinkPriceProvider.address;

    await setVaultTokenAndProvider(feeLessERC4626PriceProvider, vaults.sFrax, chainlinkPriceProviderAddress);
    await setVaultTokenAndProvider(feeLessERC4626PriceProvider, vaults.ma3WETH, chainlinkPriceProviderAddress);
    await setVaultTokenAndProvider(feeLessERC4626PriceProvider, vaults.maWBTC, chainlinkPriceProviderAddress);
    await setVaultTokenAndProvider(feeLessERC4626PriceProvider, vaults.maWETH, chainlinkPriceProviderAddress);
    await setVaultTokenAndProvider(feeLessERC4626PriceProvider, vaults.maDAI, chainlinkPriceProviderAddress);
    await setVaultTokenAndProvider(feeLessERC4626PriceProvider, vaults.maUSDC, chainlinkPriceProviderAddress);
    await setVaultTokenAndProvider(feeLessERC4626PriceProvider, vaults.maUSDT, chainlinkPriceProviderAddress);
    await setVaultTokenAndProvider(feeLessERC4626PriceProvider, vaults.maCRV, chainlinkPriceProviderAddress);
    await setVaultTokenAndProvider(feeLessERC4626PriceProvider, vaults.mcWBTC, chainlinkPriceProviderAddress);
    await setVaultTokenAndProvider(feeLessERC4626PriceProvider, vaults.mcWETH, chainlinkPriceProviderAddress);
    await setVaultTokenAndProvider(feeLessERC4626PriceProvider, vaults.mcDAI, chainlinkPriceProviderAddress);
    await setVaultTokenAndProvider(feeLessERC4626PriceProvider, vaults.mcUSDC, chainlinkPriceProviderAddress);
    await setVaultTokenAndProvider(feeLessERC4626PriceProvider, vaults.mcUSDT, chainlinkPriceProviderAddress);
    await setVaultTokenAndProvider(feeLessERC4626PriceProvider, vaults.mcCOMP, chainlinkPriceProviderAddress);
    await setVaultTokenAndProvider(feeLessERC4626PriceProvider, vaults.mcUNI, chainlinkPriceProviderAddress);

    const contracts = {
        feeLessERC4626PriceProvider,
        chainlinkPriceProvider
    }

    return contracts;
}

module.exports = {
    vaults,
    getSigners,
    loadERC4626ContractInstance,
    deployAndSetup
 }