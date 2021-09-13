// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;


interface ICPrimaryIndexToken{
    

    /**
     * @notice Sender supplies assets into the market and receives cTokens in exchange
     * @dev Accrues interest whether or not the operation succeeds, unless reverted
     * @param minter the address of account which earn liquidity
     * @param mintAmount The amount of the underlying asset to supply to minter
     * return uint 0=success, otherwise a failure (see ErrorReporter.sol for details)
     * return uint minted amount
     */
    function mintTo(address minter, uint mintAmount) external returns (uint err, uint mintedAmount);

    /**
     * @notice Sender redeems cTokens in exchange for the underlying asset
     * @dev Accrues interest whether or not the operation succeeds, unless reverted
     * @param redeemTokens The number of cTokens to redeem into underlying
     * @return uint 0=success, otherwise a failure (see ErrorReporter.sol for details)
     */
    function redeemTo(address redeemer, uint redeemTokens) external returns (uint);

    /**
     * @notice Sender redeems cTokens in exchange for a specified amount of underlying asset
     * @dev Accrues interest whether or not the operation succeeds, unless reverted
     * @param redeemAmount The amount of underlying to redeem
     * @return uint 0=success, otherwise a failure (see ErrorReporter.sol for details)
     */
    function redeemUnderlyingTo(uint redeemAmount) external returns (uint);

   
     /**
     * @notice Get the token balance of the `owner`
     * @param owner The address of the account to query
     * @return The number of tokens owned by `owner`
     */
    function balanceOf(address owner) external view returns (uint256);

    // /**
    //  * @notice Get the underlying balance of the `owner`
    //  * @dev This also accrues interest in a transaction
    //  * @param owner The address of the account to query
    //  * @return The amount of underlying owned by `owner`
    //  */
    // function accountTokens(address owner) external returns (uint);
    
    
}
