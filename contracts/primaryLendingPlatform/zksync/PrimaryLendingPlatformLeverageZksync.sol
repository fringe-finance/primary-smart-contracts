// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../PrimaryLendingPlatformLeverageCore.sol";
import "../../interfaces/IPriceProviderAggregator.sol";

contract PrimaryLendingPlatformLeverageZksync is PrimaryLendingPlatformLeverageCore {
    using SafeERC20Upgradeable for ERC20Upgradeable;
    
    event SetOpenOceanExchangeProxy(address indexed newOpenOceanExchangeProxy);

    /**
     * @notice Updates the Exchange Aggregator contract and registry contract addresses.
     * @dev Only a moderator can call this function.
     * @param exchangeAggregatorAddress The new address of the Exchange Aggregator contract.
     */
    function setExchangeAggregator(address exchangeAggregatorAddress) external onlyModerator {
        require(exchangeAggregatorAddress != address(0), "AtomicRepayment: Invalid address");
        exchangeAggregator = exchangeAggregatorAddress;
        emit SetOpenOceanExchangeProxy(exchangeAggregatorAddress);
    }

    /** 
     * @notice Executes a leveraged borrow operation for the specified project token, lending token, and notional exposure. 
     * @param projectToken The address of the project token. 
     * @param lendingToken The address of the lending token. 
     * @param notionalExposure The notional exposure for the borrow operation. 
     * @param marginCollateralAmount The amount of collateral to be deposited by the user. 
     * @param buyCalldata The calldata used for buying the project token on the DEX. 
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function leveragedBorrow(address projectToken, address lendingToken, uint notionalExposure, uint marginCollateralAmount, bytes memory buyCalldata, uint8 leverageType, bytes32[] memory priceIds, bytes[] calldata updateData) external payable nonReentrant{
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{ value: msg.value }(priceIds, updateData);
        _leveragedBorrow(projectToken, lendingToken, notionalExposure, marginCollateralAmount, buyCalldata, msg.sender, leverageType);
    }

    /** 
     * @dev Allows a related contract to borrow funds on behalf of a user to enter a leveraged position. 
     * @param projectToken The address of the project token the user wants to invest in. 
     * @param lendingToken The address of the lending token used for collateral. 
     * @param notionalExposure The notional exposure of the user's investment. 
     * @param marginCollateralAmount The amount of collateral to be deposited by the user. 
     * @param buyCalldata The calldata used for buying the project token on the DEX. 
     * @param borrower The address of the user for whom the funds are being borrowed. 
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function leveragedBorrowFromRelatedContract(address projectToken, address lendingToken, uint notionalExposure, uint marginCollateralAmount, bytes memory buyCalldata, address borrower, uint8 leverageType, bytes32[] memory priceIds, bytes[] calldata updateData) external payable nonReentrant onlyRelatedContracts() {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{ value: msg.value }(priceIds, updateData);
        _leveragedBorrow(projectToken, lendingToken, notionalExposure, marginCollateralAmount, buyCalldata, borrower, leverageType);
    }

    /**
     * @notice Approves a specified amount of tokens to be transferred by the token transfer proxy.
     * @param token The address of the ERC20 token to be approved.
     * @param tokenAmount The amount of tokens to be approved for transfer.
     */
    function _approveTokenTransfer(address token, uint256 tokenAmount) internal override {
        if (ERC20Upgradeable(token).allowance(address(this), exchangeAggregator) <= tokenAmount) {
            ERC20Upgradeable(token).safeApprove(exchangeAggregator, type(uint256).max);
        }
    }

    /** 
     * @notice Retrieves the price of the given token in USD after update price. 
     * @param token The address of the token to retrieve the price for. 
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork. 
     * @return price The price of the token in USD. 
     */
    function getTokenPriceWithUpdatePrices(
        address token,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
        ) external payable returns(uint price) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{ value: msg.value }(priceIds, updateData);
        return getTokenPrice(token);
    }

    /** 
     * @notice Calculates the lending token count for a given notional value after update price. 
     * @param _lendingToken The address of the lending token. 
     * @param notionalValue The notional value for which the lending token count is to be calculated. 
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork. 
     * @return lendingTokenCount The calculated lending token count. 
     */
    function calculateLendingTokenCountWithUpdatePrices(
        address _lendingToken, 
        uint notionalValue,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
        ) external payable returns(uint lendingTokenCount) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{ value: msg.value }(priceIds, updateData);
        return calculateLendingTokenCount(_lendingToken, notionalValue);
    }

    /** 
     * @notice Calculates the margin amount for a given position and safety margin after update price.
     * Margin = ((Notional / LVR) * (1 + SafetyMargin)) - Notional
     * @param projectToken The address of the project token. 
     * @param lendingToken The address of the lending token.
     * @param safetyMarginNumerator The numerator of the safety margin ratio. 
     * @param safetyMarginDenominator The denominator of the safety margin ratio. 
     * @param expAmount The exposure amount. 
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork. 
     * @return marginAmount The calculated margin amount. 
     */
    function calculateMarginWithUpdatePrices(
        address projectToken, 
        address lendingToken, 
        uint safetyMarginNumerator, 
        uint safetyMarginDenominator, 
        uint expAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
        ) external payable returns(uint marginAmount) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{ value: msg.value }(priceIds, updateData);
        return calculateMargin(projectToken, lendingToken, safetyMarginNumerator, safetyMarginDenominator, expAmount);
    }

    /** 
     * @notice Calculates the safety margin numerator and denominator for a given position, margin, and exposure after update price. 
     * Safety Margin = ((Margin + Notional) / (Notional / LVR)) - 1
     * @param projectToken The address of the project token. 
     * @param lendingToken The address of the lending token.
     * @param margin The margin amount. 
     * @param exp The exposure amount.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork. 
     * @return safetyMarginNumerator The calculated safety margin numerator.
     * @return safetyMarginDenominator The calculated safety margin denominator.
     */
    function calculateSafetyMarginWithUpdatePrices(
        address projectToken, 
        address lendingToken, 
        uint margin, 
        uint exp,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
        ) external payable returns(uint safetyMarginNumerator, uint safetyMarginDenominator){
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{ value: msg.value }(priceIds, updateData);
        return calculateSafetyMargin(projectToken, lendingToken, margin, exp);
     }
}
