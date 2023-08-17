// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IComptroller {
    /// @notice Indicator that this is a Comptroller contract (for inspection)
    function isComptroller() external view returns (bool);

    function getAssetsIn(address account) external view returns (address[] memory);

    function getAccountLiquidity(address account) external view returns (uint, uint, uint);

    function checkMembership(address account, address cToken) external view returns (bool);

    function getPrimaryLendingPlatformAddress() external view returns (address);

    /*** Assets You Are In ***/

    function enterMarkets(address[] memory cTokens) external returns (uint256[] memory);

    function enterMarket(address cToken, address borrower) external returns (uint);

    function exitMarket(address cToken) external returns (uint);

    /*** Policy Hooks ***/

    function mintAllowed(address cToken, address minter, uint256 mintAmount) external returns (uint);

    function mintVerify(address cToken, address minter, uint256 mintAmount, uint256 mintTokens) external;

    function redeemAllowed(address cToken, address redeemer, uint256 redeemTokens) external returns (uint);

    function redeemVerify(address cToken, address redeemer, uint256 redeemAmount, uint256 redeemTokens) external;

    function borrowAllowed(address cToken, address borrower, uint256 borrowAmount) external returns (uint);

    function borrowVerify(address cToken, address borrower, uint256 borrowAmount) external;

    function repayBorrowAllowed(address cToken, address payer, address borrower, uint256 repayAmount) external returns (uint);

    function repayBorrowVerify(address cToken, address payer, address borrower, uint256 repayAmount, uint256 borrowerIndex) external;

    function liquidateBorrowAllowed(
        address cTokenBorrowed,
        address cTokenCollateral,
        address liquidator,
        address borrower,
        uint256 repayAmount
    ) external returns (uint);

    function liquidateBorrowVerify(
        address cTokenBorrowed,
        address cTokenCollateral,
        address liquidator,
        address borrower,
        uint256 repayAmount,
        uint256 seizeTokens
    ) external;

    function seizeAllowed(
        address cTokenCollateral,
        address cTokenBorrowed,
        address liquidator,
        address borrower,
        uint256 seizeTokens
    ) external returns (uint);

    function seizeVerify(address cTokenCollateral, address cTokenBorrowed, address liquidator, address borrower, uint256 seizeTokens) external;

    function transferAllowed(address cToken, address src, address dst, uint256 transferTokens) external returns (uint);

    function transferVerify(address cToken, address src, address dst, uint256 transferTokens) external;

    /*** Liquidity/Liquidation Calculations ***/

    function liquidateCalculateSeizeTokens(address cTokenBorrowed, address cTokenCollateral, uint256 repayAmount) external view returns (uint, uint);
}
