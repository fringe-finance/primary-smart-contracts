// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../../util/V3/Asset.sol";

interface IPrimaryLendingPlatformAtomicRepaymentV3 {

	/**
	 * @dev Repays a loan atomically using the given project token as collateral.
	 * @param user The borrower's address.
	 * @param lendingToken The lending token to be repaid.
	 * @param prjToken The project token to use as collateral.
	 * @param collateralAmount The amount of collateral to use.
	 * @param buyCalldata The calldata for the swap operation.
	 * @param isRepayFully A boolean indicating whether the loan should be repaid fully or partially.
	 * @param positionId The position ID of the user.
	 * @param updatePriceTokens An array of addresses of the tokens to update the price.
	 * @param priceIds An array of bytes32 price identifiers to update.
	 * @param updateData An array of bytes update data for the corresponding price identifiers.
	 */
	function repayAtomicFromRelatedContract(
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
	) external payable returns (uint256 amountReceivedLendingToken);
}
