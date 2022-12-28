// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IPrimaryIndexToken {
    function _depositPosition(address, address, address) external returns (uint);
    function usdcToken() external view returns(address);

    function lendingTokenPerCollateral(address projectToken, address lendingToken) external view returns(address);

    function totalOutstandingInUSD(address account, address projectToken, address lendingToken) external view returns (uint256);

    function getDepositedAmount(address projectToken, address account) external view returns(uint);

    /**
     * @dev return evaluation in USD of `tokenAmount`
     * @param token - address of token
     * @param tokenAmount - amount of token
     */
    function getTokenEvaluation(address token, uint256 tokenAmount) external view returns (uint256);

    /**
     * @dev return keccak("MODERATOR_ROLE")
     */
    function MODERATOR_ROLE() external view returns(bytes32);
    
    /**
     * @dev return address of price oracle with interface of PriceProviderAggregator
     */
    function priceOracle() external view returns(address);

    /**
     * @dev return address project token in array `projectTokens`
     * @param projectTokenId - index of project token in array `projectTokens`. Numetates from 0 to array length - 1
     */
    function projectTokens(uint256 projectTokenId) external view returns(address);

    /**
     * @dev return info of project token, that declared in struct ProjectTokenInfo
     * @param projectToken - address of project token in array `projectTokens`. Numetates from 0 to array length - 1
     */
    function projectTokenInfo(address projectToken) external view returns(ProjectTokenInfo memory);
    
    /**
     * @dev return address lending token in array `lendingTokens`
     * @param lendingTokenId - index of lending token in array `lendingTokens`. Numetates from 0 to array length - 1
     */
    function lendingTokens(uint256 lendingTokenId) external view returns(address);
    
    /**
     * @dev return info of lending token, that declared in struct LendingTokenInfo
     * @param lendingToken - address of lending token in array `lendingTokens`. Numetates from 0 to array length - 1
     */
    function lendingTokenInfo(address lendingToken) external view returns(LendingTokenInfo memory);
    
    /**
     * @dev return total amount of deposited project token
     * @param projectToken - address of project token in array `projectTokens`. Numetates from 0 to array length - 1
     */
    function totalDepositedProjectToken(address projectToken) external view returns(uint256);
    
    /**
     * @dev return deposit position struct
     * @param account - address of depositor
     * @param projectToken - address of project token
     * @param lendingToken - address of lending token
     */
    function depositPosition(address account, address projectToken, address lendingToken) external view returns(DepositPosition memory);
    
    /**
     * @dev return borrow position struct
     * @param account - address of borrower
     * @param projectToken - address of project token
     * @param lendingToken - address of lending token
     */
    function borrowPosition(address account, address projectToken, address lendingToken) external view returns(BorrowPosition memory);

    /**
     * @dev return total borrow amount of `lendingToken` by `projectToken`
     * @param projectToken - address of project token
     * @param lendingToken - address of lending token
     */
    function totalBorrow(address projectToken, address lendingToken) external view returns(uint256);
    
    /**
     * @dev return borrow limit amount of `lendingToken` by `projectToken`
     * @param projectToken - address of project token
     * @param lendingToken - address of lending token
     */
    function borrowLimit(address projectToken, address lendingToken) external view returns(uint256);

    struct Ratio {
        uint8 numerator;
        uint8 denominator;
    }

    struct ProjectTokenInfo {
        bool isListed;
        bool isDepositPaused; // true - paused, false - not paused
        bool isWithdrawPaused; // true - paused, false - not paused
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

    event Deposit(address indexed who, address indexed tokenPrj, uint256 prjDepositAmount, address indexed beneficiar);

    event Withdraw(address indexed who, address indexed tokenPrj, uint256 prjWithdrawAmount, address indexed beneficiar);

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
        uint8 _loanToValueRatioNumerator,
        uint8 _loanToValueRatioDenominator,
        uint8 _liquidationTresholdFactorNumerator,
        uint8 _liquidationTresholdFactorDenominator,
        uint8 _liquidationIncentiveNumerator,
        uint8 _liquidationIncentiveDenominator
    )  external;

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

    /**
     * @dev sets borrow limit
     * @param projectToken - address of project token
     * @param lendingToken - address of lending token
     * @param _borrowLimit - limit amount of lending token
     */
    function setBorrowLimit(
        address projectToken, 
        address lendingToken, 
        uint256 _borrowLimit
    ) external;

    /**
     * @dev sets project token info
     * @param _projectToken - address of project token
     * @param _loanToValueRatioNumerator - numerator of loan to value ratio
     * @param _loanToValueRatioDenominator - denominator of loan to value ratio
     * @param _liquidationTresholdFactorNumerator - numerator of liquidation treshold factor
     * @param _liquidationTresholdFactorDenominator - denominator of liquidation treshold factor
     * @param _liquidationIncentiveNumerator - numerator of liquidation incentive
     * @param _liquidationIncentiveDenominator - denominator of liquidation incentive
     */
    function setProjectTokenInfo(
        address _projectToken,
        uint8 _loanToValueRatioNumerator,
        uint8 _loanToValueRatioDenominator,
        uint8 _liquidationTresholdFactorNumerator,
        uint8 _liquidationTresholdFactorDenominator,
        uint8 _liquidationIncentiveNumerator,
        uint8 _liquidationIncentiveDenominator
    ) external;

    /**
     * @dev sets pause of project token
     * @param _projectToken - address of project token
     * @param _isDepositPaused - true - if pause, false - if unpause
     * @param _isWithdrawPaused - true - if pause, false - if unpause
     */
    function setPausedProjectToken(
        address _projectToken, 
        bool _isDepositPaused, 
        bool _isWithdrawPaused
    ) external;

    /**
     * @dev sets pause of project token
     * @param _lendingToken - address of lending token
     * @param _bLendingToken - address of bLendingToken
     * @param _isPaused - true - if pause, false - if unpause
     */
    function setLendingTokenInfo(
        address _lendingToken, 
        address _bLendingToken,
        bool _isPaused
    ) external;

    /**
     * @dev sets pause of lending token
     * @param _lendingToken - address of lending token
     * @param _isPaused - true - if pause, false - if unpause
     */
    function setPausedLendingToken(
        address _lendingToken, 
        bool _isPaused
    ) external;
    
    //************* PUBLIC FUNCTIONS ********************************

    /**
     * @dev deposit project token to PrimaryIndexToken
     * @param projectToken - address of project token
     * @param projectTokenAmount - amount of project token to deposit
     */
    function deposit(address projectToken, uint256 projectTokenAmount, address user) external;

    /**
     * @dev withdraw project token from PrimaryIndexToken
     * @param projectToken - address of project token
     * @param lendingToken - address of lending token
     * @param projectTokenAmount - amount of project token to deposit
     */
    function withdraw(address projectToken, address lendingToken, uint256 projectTokenAmount) external;

    /**
     * @dev supply lending token
     * @param lendingToken - address of lending token
     * @param lendingTokenAmount - amount of lending token to supply
     */
    function supply(address lendingToken, uint256 lendingTokenAmount) external;

    /**
     * @dev redeem lending token
     * @param lendingToken - address of lending token
     * @param bLendingTokenAmount - amount of fLending token to redeem
     */
    function redeem(address lendingToken, uint256 bLendingTokenAmount) external;

    /**
     * @dev redeem underlying lending token
     * @param lendingToken - address of lending token
     * @param lendingTokenAmount - amount of lending token to redeem
     */
    function redeemUnderlying(address lendingToken, uint256 lendingTokenAmount) external;

    /**
     * @dev borrow lending token
     * @param projectToken - address of project token
     * @param lendingToken - address of lending token
     * @param lendingTokenAmount - amount of lending token
     */
    function borrow(address projectToken, address lendingToken, uint256 lendingTokenAmount) external;
    
    /**
     * @dev repay lending token
     * @param projectToken - address of project token
     * @param lendingToken - address of lending token
     * @param lendingTokenAmount - amount of lending token
     * @param repairer - address of repairer
     * @param borrower - address of borrower
     */
    function repay(address projectToken, address lendingToken, uint256 lendingTokenAmount, address repairer, address borrower) external returns (uint256);

    /**
     * @dev liquidate borrow
     * @param account - address of borrower
     * @param projectToken - address of project token
     * @param lendingToken - address of lending token
     */
    function liquidate(address account, address projectToken, address lendingToken) external;

    /**
     * @dev update borrow position
     * @param account - address of borrower
     * @param projectToken - address of project token
     * @param lendingToken - address of lending token
     */
    function updateInterestInBorrowPosition(address account, address projectToken, address lendingToken) external;
    //************* VIEW FUNCTIONS ********************************

     /**
     * @dev return pit amount of borrow position
     * @param account - address of borrower
     * @param projectToken - address of project token
     * @param lendingToken - address of lending token
     */
    function pit(address account, address projectToken, address lendingToken) external view returns (uint256);

    /**
     * @dev return pit remaining amount of borrow position
     * @param account - address of borrower
     * @param projectToken - address of project token
     * @param lendingToken - address of lending token
     */
    function pitRemaining(address account, address projectToken, address lendingToken) external view returns (uint256);

    /**
     * @dev return liquidationThreshold of borrow position
     * @param account - address of borrower
     * @param projectToken - address of project token
     * @param lendingToken - address of lending token
     */
    function liquidationThreshold(address account, address projectToken, address lendingToken) external view returns (uint256);

    /**
     * @dev return total outstanding of borrow position
     * @param account - address of borrower
     * @param projectToken - address of project token
     * @param lendingToken - address of lending token
     */
    function totalOutstanding(address account, address projectToken, address lendingToken) external view returns (uint256);

    /**
     * @dev return health factor of borrow position
     * @param account - address of borrower
     * @param projectToken - address of project token
     * @param lendingToken - address of lending token
     */
    function healthFactor(address account, address projectToken, address lendingToken) external view returns (uint256 numerator, uint256 denominator);

    /**
     * @dev return evaluation in USD of `projectTokenAmount`
     * @param projectToken - address of project token
     * @param projectTokenAmount - amount of project token
     */
    function getProjectTokenEvaluation(address projectToken, uint256 projectTokenAmount) external view returns (uint256);

    /**
     * @dev return length of array `lendingTokens`
     */
    function lendingTokensLength() external view returns (uint256);

    /**
     * @dev return length of array `projectTokens`
     */
    function projectTokensLength() external view returns (uint256);

    /**
     * @dev return deposit position and borrow position and instant health factor
     * @param account - address of borrower
     * @param projectToken - address of project token
     * @param lendingToken - address of lending token
     */
    function getPosition(address account, address projectToken, address lendingToken) external view returns (uint256 depositedProjectTokenAmount, uint256 loanBody, uint256 accrual, uint256 healthFactorNumerator, uint256 healthFactorDenominator);

    /**
     * @dev return decimals of PrimaryIndexToken
     */
    function decimals() external view returns (uint8);

    function calcDepositPositionWhenAtomicRepay(address projectToken, uint256 projectTokenAmount, address user) external;
    
    /**
     * @dev update borrow position
     * @param account - address of borrower
     * @param lendingToken - address of lending token
     */
    function updateInterestInBorrowPositions(address account, address lendingToken) external;

    /**
     * @dev set deposited position
     * @param account - address of borrower
     * @param projectToken - address of project token
     * @param newDepositedAmount - new deposited amount
     */
    function setDepositedPosition(address account, address projectToken, uint newDepositedAmount) external;

    /**
     * @dev set total deposited project token
     * @param projectToken - address of project token
     * @param newTotalDepositedAmount - new total deposited amount
     */
    function setTotalDepositedProjectToken(address projectToken, uint newTotalDepositedAmount) external;

    /**
     * @dev distribute reward to liquidator
     * @param account - address of borrower
     * @param projectToken - address of project token
     * @param amount - amount of reward
     */
    function distributeReward(address account, address projectToken, uint amount) external;
}