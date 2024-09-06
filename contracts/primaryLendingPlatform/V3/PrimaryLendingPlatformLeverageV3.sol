// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./core/PrimaryLendingPlatformLeverageV3Core.sol";
import "../../interfaces/IPriceProviderAggregator.sol";
import "../../util/V3/Asset.sol";

/**
 * @title PrimaryLendingPlatformLeverageZksync.
 * @notice The PrimaryLendingPlatformLeverageZksync contract is the contract that allows users to open leveraged positions for zksync network.
 * @dev Contract that allows users to open leveraged positions using the OpenOcean exchange aggregator. Inherit from PrimaryLendingPlatformLeverageCore.
 */
contract PrimaryLendingPlatformLeverageV3 is PrimaryLendingPlatformLeverageV3Core {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    //************* EXTERNAL FUNCTION ********************************

    /**
     * @notice The function to be called when a user wants to leverage their position.
     * @dev Executes a leveraged borrow for the borrower on the specified projectToken using the given lendingToken and update related token's prices.
     *
     * Requirements:
     * - The project token is listed on the platform.
     * - The lending token is listed on the platform.
     * - Notional exposure must be greater than 0.
     * - The lending token must be the same as the current lending token or the current lending token must be address(0).
     * - The user must have a valid position for the given project token and lending token.
     *
     * Effects:
     * - Update price of related tokens.
     * - Calculates the required `lendingTokenCount` based on `notionalExposure`.
     * - Performs a naked borrow using `_nakedBorrow` function.
     * - Approves the transfer of `lendingToken` to the system.
     * - Buys tokens on an exchange aggregator using `_buyOnExchangeAggregator` function.
     * - Collateralizes the loan with the received tokens using `_collateralizeLoan` function.
     * - Defers liquidity check using `_deferLiquidityCheck` function.
     * @param prjInfo Information about the project token, including its address and type.
     * @param lendingInfo Information about the lending token, including its address and type.
     * @param notionalExposure The notional exposure for the borrow operation.
     * @param marginCollateralAmount The amount of collateral to be deposited by the user.
     * @param buyCalldata The calldata used for buying the project token on the DEX.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     */
    function leveragedBorrow(
        Asset.Info memory prjInfo,
        Asset.Info memory lendingInfo,
        uint256 notionalExposure,
        uint256 marginCollateralAmount,
        bytes[] memory buyCalldata,
        uint8 leverageType,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable nonReentrant isProjectTokenListed(prjInfo.addr) isLendingTokenListed(lendingInfo.addr) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        _leveragedBorrow(prjInfo, lendingInfo, notionalExposure, marginCollateralAmount, buyCalldata, msg.sender, leverageType, updatePriceTokens);
    }

    /**
     * @dev Allows a related contract to borrow funds on behalf of a user to enter a leveraged position and update related token's prices.
     *
     * Requirements:
     * - The project token is listed on the platform.
     * - The lending token is listed on the platform.
     * - Notional exposure must be greater than 0.
     * - The lending token must be the same as the current lending token or the current lending token must be address(0).
     * - The user must have a valid position for the given project token and lending token.
     *
     * Effects:
     * - Update price of related tokens.
     * - Calculates the required `lendingTokenCount` based on `notionalExposure`.
     * - Performs a naked borrow using `_nakedBorrow` function.
     * - Approves the transfer of `lendingToken` to the system.
     * - Buys tokens on an exchange aggregator using `_buyOnExchangeAggregator` function.
     * - Collateralizes the loan with the received tokens using `_collateralizeLoan` function.
     * - Defers liquidity check using `_deferLiquidityCheck` function.
     * @param prjInfo Information about the project token, including its address and type.
     * @param lendingInfo Information about the lending token, including its address and type.
     * @param notionalExposure The notional exposure of the user's investment.
     * @param marginCollateralAmount The amount of collateral to be deposited by the user.
     * @param buyCalldata The calldata used for buying the project token on the DEX.
     * @param borrower The address of the user for whom the funds are being borrowed.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     */
    function leveragedBorrowFromRelatedContract(
        Asset.Info memory prjInfo,
        Asset.Info memory lendingInfo,
        uint256 notionalExposure,
        uint256 marginCollateralAmount,
        bytes[] memory buyCalldata,
        address borrower,
        uint8 leverageType,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable nonReentrant isProjectTokenListed(prjInfo.addr) isLendingTokenListed(lendingInfo.addr) onlyRelatedContracts {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        _leveragedBorrow(prjInfo, lendingInfo, notionalExposure, marginCollateralAmount, buyCalldata, borrower, leverageType, updatePriceTokens);
    }

    /**
     * @notice Allow a user to close the leverage position by long asset.
     * If close successfully will delete the opened position from list of position data
     * @param projectToken The address of long asset.
     * @param lendingToken The address of short asset.
     * @param positionId The id of opened position.
     * @param collateralAmount The long asset amount need to close position.
     * @param buyCalldata Pass to Paraswap to convert from short asset to long asset.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     */
    function closePositionByLongAsset(
        Asset.Info memory projectToken, //any deposited project token
        Asset.Info memory lendingToken,
        bytes32 positionId,
        uint256 collateralAmount,
        address[] memory updatePriceTokens,
        bytes[] memory buyCalldata,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable {
        uint256 amountReceivedLendingToken = _repayAtomicFromRelatedContract(
            msg.sender,
            lendingToken,
            projectToken,
            collateralAmount,
            buyCalldata,
            false,
            positionId,
            updatePriceTokens,
            priceIds,
            updateData
        );

        emit ClosePosition(msg.sender, lendingToken.addr, positionId, amountReceivedLendingToken);
    }

    /**
     * @notice Repay the loan by using the project token as collateral.
     * @param user The address of the user.
     * @param lendingToken The address of the lending token.
     * @param prjToken The address of the project token.
     * @param collateralAmount The amount of collateral to use.
     * @param buyCalldata The calldata for the swap operation.
     * @param isRepayFully A boolean indicating whether the loan should be repaid fully or partially.
     * @param positionId The position ID of the user.
     * @param updatePriceTokens An array of addresses of the tokens to update the price.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return amountReceivedLendingToken The amount of lending tokens received by the user.
     */
    function _repayAtomicFromRelatedContract(
        address user,
        Asset.Info memory lendingToken,
        Asset.Info memory prjToken,
        uint256 collateralAmount,
        bytes[] memory buyCalldata,
        bool isRepayFully,
        bytes32 positionId,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) internal returns (uint256 amountReceivedLendingToken) {
        return primaryLendingPlatformAtomic.repayAtomicFromRelatedContract{value: msg.value}(
            user,
            lendingToken,
            prjToken,
            collateralAmount,
            buyCalldata,
            isRepayFully,
            positionId,
            updatePriceTokens,
            priceIds,
            updateData
        );
    }

    /**
     * @notice Retrieves the price of the given token in USD.
     * @param token The address of the token to retrieve the price for.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return collateralPrice The price of the token in USD.
     * @return capitalPrice The price of the token in USD.
     */
    function getTokenPriceWithUpdatePrices(
        address token,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 collateralPrice, uint256 capitalPrice) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return getTokenPrice(token);
    }

    /**
     * @notice Calculates the lending token count for a given notional value.
     * @param lendingToken The address of the lending token.
     * @param notionalValue The notional value for which the lending token count is to be calculated.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return lendingTokenCount The calculated lending token count.
     */
    function calculateLendingTokenCountWithUpdatePrices(
        address lendingToken,
        uint256 notionalValue,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 lendingTokenCount) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return calculateLendingTokenCount(lendingToken, notionalValue);
    }
}
