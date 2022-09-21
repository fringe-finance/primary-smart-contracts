const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/config.json';
const config = require(configFile);

let {
    DELAY_CONTRACT,
    PrimaryIndexTokenProxy,
    BondtrollerProxy,
    BLendingTokenProxy,
    JumpRateModelProxy,
    PriceProviderAggregatorProxy,
    BackendPriceProviderProxy,
    UniswapV3PriceProviderProxy,
    ChainlinkPriceProviderProxy,
    operators
} = config;

async function main() {
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let PrimaryIndexToken = await hre.ethers.getContractFactory("PrimaryIndexToken");
    let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
    let BLendingToken = await hre.ethers.getContractFactory("BLendingToken");
    let JumpRateModel = await hre.ethers.getContractFactory("JumpRateModelV3");
    let ChainlinkPriceProvider = await hre.ethers.getContractFactory("ChainlinkPriceProvider");
    let BackendPriceProvider = await hre.ethers.getContractFactory("BackendPriceProvider");
    let PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregator");
    let UniswapV3PriceProvider = await hre.ethers.getContractFactory("UniswapV3PriceProvider");
    let TimeDelay = await hre.ethers.getContractFactory("IntermediaryTimeDelay");

    let PITInstance = await PrimaryIndexToken.attach(PrimaryIndexTokenProxy).connect(deployMaster);
    let BondtrollerInstance = await Bondtroller.attach(BondtrollerProxy).connect(deployMaster);
    let BLendingTokenInstance = await BLendingToken.attach(BLendingTokenProxy).connect(deployMaster);
    let JumpRateModelInstance = await JumpRateModel.attach(JumpRateModelProxy).connect(deployMaster);
    let ChainlinkPriceProviderInstance = await ChainlinkPriceProvider.attach(ChainlinkPriceProviderProxy).connect(deployMaster);
    let BackendPriceProviderInstance = await BackendPriceProvider.attach(BackendPriceProviderProxy).connect(deployMaster);
    let PriceProviderAggregatorInstance = await PriceProviderAggregator.attach(PriceProviderAggregatorProxy).connect(deployMaster);
    let UniswapV3PriceProviderInstance = await UniswapV3PriceProvider.attach(UniswapV3PriceProviderProxy).connect(deployMaster);
    let TimeDelayInstance = await TimeDelay.attach(DELAY_CONTRACT).connect(deployMaster);

    console.log("***** 1. PIT grant role to TimeDelay contract *****")
    let adminRole = await PITInstance.DEFAULT_ADMIN_ROLE();
    let moderatorRole = await PITInstance.MODERATOR_ROLE();
    let isAdminOfPit = await PITInstance.hasRole(adminRole, DELAY_CONTRACT);
    let isModerator = await PITInstance.hasRole(moderatorRole, DELAY_CONTRACT);
    if(!isAdminOfPit) {
        await PITInstance.grantRole(adminRole, DELAY_CONTRACT).then(function(instance){
            console.log("PIT granted ADMIN permission to Timedelay contract at txhash: "+ instance.hash);
        });
    }

    if(!isModerator) {
        await PITInstance.grandModerator(DELAY_CONTRACT).then(function(instance){
            console.log("PIT granted MODERATOR permission to Timedelay contract at txhash: "+ instance.hash);
        });
    }

    console.log("***** 2. Bondtroller grant role to TimeDelay contract *****")
    let adminOfBondtroller =  await BondtrollerInstance.admin()
    let pauseGuardian = await BondtrollerInstance.pauseGuardian();
    if(pauseGuardian != DELAY_CONTRACT) {
        await BondtrollerInstance.setPauseGuardian(DELAY_CONTRACT).then(function(instance){
            console.log("Bondtroller set PauseGuardian to Timedelay contract at txhash: "+ instance.hash);
        });
    }
    
    if(adminOfBondtroller != DELAY_CONTRACT) {
        await BondtrollerInstance.changeAdmin(DELAY_CONTRACT).then(function(instance){
            console.log("Bondtroller granted ADMIN permission to Timedelay contract at txhash: "+ instance.hash);
        });
    }

    console.log("***** 3. BLendingToken grant role to TimeDelay contract *****")
    let adminRoleOfBLendingToken = await BLendingTokenInstance.DEFAULT_ADMIN_ROLE();
    let isAdminOfBLendingToken = await BLendingTokenInstance.hasRole(adminRoleOfBLendingToken, DELAY_CONTRACT);
    let moderatorRoleOfBLendingToken = await BLendingTokenInstance.MODERATOR_ROLE();
    let isModeratorOfBLendingToken = await BLendingTokenInstance.hasRole(moderatorRoleOfBLendingToken, DELAY_CONTRACT);
    if(!isAdminOfBLendingToken) {
        await BLendingTokenInstance.grantRole(adminRole, DELAY_CONTRACT).then(function(instance){
            console.log("Bondtroller granted ADMIN permission to Timedelay contract at txhash: "+ instance.hash);
        });
    }

    if(!isModeratorOfBLendingToken) {
        await BLendingTokenInstance.grandModerator(DELAY_CONTRACT).then(function(instance){
            console.log("Bondtroller set PauseGuardian to Timedelay contract at txhash: "+ instance.hash);
        });
    }

    console.log("***** 4. JumpRateModel grant role to TimeDelay contract *****")
    let ownerOfJumpRate = await JumpRateModelInstance.owner();
    if(ownerOfJumpRate != DELAY_CONTRACT) {
        await JumpRateModelInstance.changeOwner(DELAY_CONTRACT).then(function(instance){
            console.log("JumpRateModel transfer owner permission to Timedelay contract at txhash: "+ instance.hash);
        });
    }

    console.log("***** 5. PriceProviderAggregator grant role to TimeDelay contract *****")
    let adminRoleOfPriceProviderAggregator = await PriceProviderAggregatorInstance.DEFAULT_ADMIN_ROLE();
    let isAdminOfPriceProviderAggregator = await PriceProviderAggregatorInstance.hasRole(adminRoleOfPriceProviderAggregator, DELAY_CONTRACT);
    let moderatorRoleOfPriceProviderAggregator = await PriceProviderAggregatorInstance.MODERATOR_ROLE();
    let isModeratorOfPriceProviderAggregator = await PriceProviderAggregatorInstance.hasRole(moderatorRoleOfPriceProviderAggregator, DELAY_CONTRACT);
    if(!isAdminOfPriceProviderAggregator) {
        await PriceProviderAggregatorInstance.grantRole(adminRole, DELAY_CONTRACT).then(function(instance){
            console.log("PriceProviderAggregator granted ADMIN permission to Timedelay contract at txhash: "+ instance.hash);
        });
    }

    if(!isModeratorOfPriceProviderAggregator) {
        await PriceProviderAggregatorInstance.grandModerator(DELAY_CONTRACT).then(function(instance){
            console.log("PriceProviderAggregator granted MODERATOR permission to Timedelay contract at txhash: "+ instance.hash);
        });
    }

    console.log("***** 6. ChainlinkPriceProvider grant role to TimeDelay contract *****")
    let adminRoleOfChainlinkPriceProvider = await ChainlinkPriceProviderInstance.DEFAULT_ADMIN_ROLE();
    let isAdminOfChainlinkPriceProvider = await ChainlinkPriceProviderInstance.hasRole(adminRoleOfChainlinkPriceProvider, DELAY_CONTRACT);
    let moderatorRoleOfChainlinkPriceProvider = await ChainlinkPriceProviderInstance.MODERATOR_ROLE();
    let isModeratorOfChainlinkPriceProvider = await ChainlinkPriceProviderInstance.hasRole(moderatorRoleOfChainlinkPriceProvider, DELAY_CONTRACT);
    if(!isAdminOfChainlinkPriceProvider) {
        await ChainlinkPriceProviderInstance.grantRole(adminRole, DELAY_CONTRACT).then(function(instance){
            console.log("ChainlinkPriceProvider granted ADMIN permission to Timedelay contract at txhash: "+ instance.hash);
        });
    }

    if(!isModeratorOfChainlinkPriceProvider) {
        await ChainlinkPriceProviderInstance.grandModerator(DELAY_CONTRACT).then(function(instance){
            console.log("ChainlinkPriceProvider granted MODERATOR permission to Timedelay contract at txhash: "+ instance.hash);
        });
    }

    console.log("***** 7. BackendPriceProvider grant role to TimeDelay contract *****")
    let adminRoleOfBackendPriceProvider = await BackendPriceProviderInstance.DEFAULT_ADMIN_ROLE();
    let isAdminOfBackendPriceProvider = await BackendPriceProviderInstance.hasRole(adminRoleOfBackendPriceProvider, DELAY_CONTRACT);
    let trustedBackendOfBackendPriceProvider = await BackendPriceProviderInstance.TRUSTED_BACKEND_ROLE();
    let isTrustedBackendOfBackendPriceProvider = await BackendPriceProviderInstance.hasRole(trustedBackendOfBackendPriceProvider, DELAY_CONTRACT);
    if(!isAdminOfBackendPriceProvider) {
        await BackendPriceProviderInstance.grantRole(adminRole, DELAY_CONTRACT).then(function(instance){
            console.log("BackendPriceProvider granted ADMIN permission to Timedelay contract at txhash: "+ instance.hash);
        });
    }

    if(!isTrustedBackendOfBackendPriceProvider) {
        await BackendPriceProviderInstance.grandTrustedBackendRole(DELAY_CONTRACT).then(function(instance){
            console.log("BackendPriceProvider granted MODERATOR permission to Timedelay contract at txhash: "+ instance.hash);
        });
    }

    console.log("***** 8. UniswapV3PriceProvider grant role to TimeDelay contract *****")
    let adminRoleOfUniswapV3PriceProvider = await UniswapV3PriceProviderInstance.DEFAULT_ADMIN_ROLE();
    let isAdminOfUniswapV3PriceProvider = await UniswapV3PriceProviderInstance.hasRole(adminRoleOfUniswapV3PriceProvider, DELAY_CONTRACT);
    let moderatorRoleOfUniswapV3PriceProvider = await UniswapV3PriceProviderInstance.MODERATOR_ROLE();
    let isModeratorRoleOfUniswapV3PriceProvider = await UniswapV3PriceProviderInstance.hasRole(moderatorRoleOfUniswapV3PriceProvider, DELAY_CONTRACT);
    if(!isAdminOfUniswapV3PriceProvider) {
        await UniswapV3PriceProviderInstance.grantRole(adminRole, DELAY_CONTRACT).then(function(instance){
            console.log("UniswapV3PriceProvider granted ADMIN permission to Timedelay contract at txhash: "+ instance.hash);
        });
    }

    if(!isModeratorRoleOfUniswapV3PriceProvider) {
        await UniswapV3PriceProviderInstance.grandModerator(DELAY_CONTRACT).then(function(instance){
            console.log("UniswapV3PriceProvider granted MODERATOR permission to Timedelay contract at txhash: "+ instance.hash);
        });
    }

    console.log("***** 9. TimeDelay contract add list operators *****")
    for(var i = 0; i < operators.length; i++){
        let isOperatorsOfTimeDelay = await TimeDelayInstance.operators(operators[i]);
        if(!isOperatorsOfTimeDelay) {
            await TimeDelayInstance.addOperator(operators[i]).then(function(instance){
                console.log("TimeDelay addOperator " + operators[i] + " at txhash: "+ instance.hash);
            });
        }
    }

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});