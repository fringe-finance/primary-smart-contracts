// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IPrimaryIndexToken {
    /**
     * @dev return keccak("MODERATOR_ROLE")
     */
    function MODERATOR_ROLE() external view returns(bytes32);

    function name() external view returns(string memory);

    function symbol() external view returns(string memory);

    function priceOracle() external view returns(address); // address of price oracle with interface of PriceProviderAggregator

    function projectTokens(uint256 projectTokenId) external view returns(address);
    function projectTokenInfo(address projectToken) external view returns(ProjectTokenInfo memory);
    
    function lendingTokens(uint256 lendingTokenId) external view returns(address);
    function lendingTokenInfo(address lendingToken) external view returns(LendingTokenInfo memory);
    
    function totalDepositedProjectToken(address projectToken) external view returns(uint256);
    function depositPosition(address account, address projectToken, address lendingToken) external view returns(DepositPosition memory);
    function borrowPosition(address account, address projectToken, address lendingToken) external view returns(BorrowPosition memory);

    function totalBorrow(address projectToken, address lendingToken) external view returns(uint256);
    function borrowLimit(address projectToken, address lendingToken) external view returns(uint256);

    struct Ratio {
        uint8 numerator;
        uint8 denominator;
    }

    struct ProjectTokenInfo {
        bool isListed;
        bool isPaused;
        Ratio loanToValueRatio;
        Ratio liquidationThresholdFactor;
        Ratio liquidationIncentive;
    }

    struct LendingTokenInfo {
        bool isListed;
        bool isPaused;
        address bLendingToken;
    }
    
    struct DepositPosition {
        uint256 depositedProjectTokenAmount;
    }

    struct BorrowPosition {
        uint256 loanBody;   // [loanBody] = lendingToken
        uint256 accrual;   // [accrual] = lendingToken
    }

    event AddPrjToken(address indexed tokenPrj);

    event LoanToValueRatioSet(address indexed tokenPrj, uint8 lvrNumerator, uint8 lvrDenominator);

    event LiquidationThresholdFactorSet(address indexed tokenPrj, uint8 ltfNumerator, uint8 ltfDenominator);

    event Deposit(address indexed who, address indexed tokenPrj, address lendingToken, uint256 prjDepositAmount, address indexed beneficiary);

    event Withdraw(address indexed who, address indexed tokenPrj, address lendingToken, uint256 prjWithdrawAmount, address indexed beneficiary);

    event Supply(address indexed who, address indexed supplyToken, uint256 supplyAmount, address indexed supplyBToken, uint256 amountSupplyBTokenReceived);

    event Redeem(address indexed who, address indexed redeemToken, address indexed redeemBToken, uint256 redeemAmount);

    event RedeemUnderlying(address indexed who, address indexed redeemToken, address indexed redeemBToken, uint256 redeemAmountUnderlying);

    event Borrow(address indexed who, address indexed borrowToken, uint256 borrowAmount, address indexed prjAddress, uint256 prjAmount);

    event RepayBorrow(address indexed who, address indexed borrowToken, uint256 borrowAmount, address indexed prjAddress, bool isPositionFullyRepaid);

    event Liquidate(address indexed liquidator, address indexed borrower, address lendingToken, address indexed prjAddress, uint256 amountPrjLiquidated);

    function initialize() external;

    //************* ADMIN FUNCTIONS ********************************

    function addProjectToken(
        address _projectToken,
        bool _isPaused,
        uint8 _loanToValueRatioNumerator,
        uint8 _loanToValueRatioDenominator,
        uint8 _liquidationThresholdFactorNumerator,
        uint8 _liquidationThresholdFactorDenominator,
        uint8 _liquidationIncentiveNumerator,
        uint8 _liquidationIncentiveDenominator
    ) external;

    function removeProjectToken(
        uint256 _projectTokenId
    ) external;

    function addLendingToken(
        address _lendingToken, 
        address _bLendingToken,
        bool _isPaused
    ) external;

    function removeLendingToken(
        uint256 _lendingTokenId
    ) external;

    function setPriceOracle(
        address _priceOracle
    ) external;

    function grandModerator(
        address newModerator
    ) external;

    function revokeModerator(
        address moderator
    ) external;

    //************* MODERATOR FUNCTIONS ********************************

    function setBorrowLimit(
        address projectToken, 
        address lendingToken, 
        uint256 _borrowLimit
    ) external;

     function setProjectTokenInfo(
        address _projectToken,
        bool _isPaused,
        uint8 _loanToValueRatioNumerator,
        uint8 _loanToValueRatioDenominator,
        uint8 _liquidationThresholdFactorNumerator,
        uint8 _liquidationThresholdFactorDenominator,
        uint8 _liquidationIncentiveNumerator,
        uint8 _liquidationIncentiveDenominator
    ) external;

    function setPausedProjectToken(address _projectToken, bool _isPaused) external;

    function setLendingTokenInfo(
        address _lendingToken, 
        address _bLendingToken,
        bool _isPaused
    ) external;

    function setPausedLendingToken(address _lendingToken, bool _isPaused) external;
    
    //************* PUBLIC FUNCTIONS ********************************

    function deposit(address projectToken, address lendingToken, uint256 projectTokenAmount) external;

    function withdraw(address projectToken, address lendingToken, uint256 projectTokenAmount) external;

    function supply(address lendingToken, uint256 lendingTokenAmount) external;

    function redeem(address lendingToken, uint256 bLendingTokenAmount) external;

    function redeemUnderlying(address lendingToken, uint256 lendingTokenAmount) external;

    function borrow(address projectToken, address lendingToken, uint256 lendingTokenAmount) external;
    
    function repay(address projectToken, address lendingToken, uint256 lendingTokenAmount) external;

    function liquidate(address account, address projectToken, address lendingToken) external;

    function updateInterestInBorrowPosition(address account, address projectToken, address lendingToken) external;
    //************* VIEW FUNCTIONS ********************************

    function pit(address account, address projectToken, address lendingToken) external view returns (uint256);

    function pitRemaining(address account, address projectToken, address lendingToken) external view returns (uint256);

    function liquidationThreshold(address account, address projectToken, address lendingToken) external view returns (uint256);

    function totalOutstanding(address account, address projectToken, address lendingToken) external view returns (uint256);

    function healthFactor(address account, address projectToken, address lendingToken) external view returns (uint256 numerator, uint256 denominator);

    function getProjectTokenEvaluation(address projectToken, uint256 projectTokenAmount) external view returns (uint256);

    function lendingTokensLength() external view returns (uint256);

    function projectTokensLength() external view returns (uint256);

    function getPosition(address account, address projectToken, address lendingToken) external view returns (uint256 depositedProjectTokenAmount, uint256 loanBody, uint256 accrual, uint256 healthFactorNumerator, uint256 healthFactorDenominator);

    function decimals() external view returns (uint8);
}
