// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IPrimaryIndexToken {
   
    function MODERATOR_ROLE() external view returns(bytes32);

    function uniswapPathFinder() external view returns(address);

    function basicToken() external view returns(address);

    function comptroller() external view returns(address);

    function cPrimaryIndexToken() external view returns(address);

    function priceOracle() external view returns(address);
    
    //address[] public projectTokens;

    function projectTokens(uint256) external view returns(address);

    //address[] public lendingTokens;
    function lendingTokens(uint256) external view returns(address);

    //mapping(address => LvrInfo) public lvr; //tokenAddress => Lvr (Loan to Value Ratio)
    function lvr(address) external view returns(uint8 numerator, uint8 denominator);

    //mapping(address => LtfInfo) public ltf; //tokenAddress => Ltf (Liquidation Threshold Factor)
    function ltf(address) external view returns(uint8 numerator, uint8 denominator);
    
    //mapping(address => uint256) public totalStakedPrj; //tokenAddress => PRJ token staked
    function totalStakedPrj(address) external view returns(uint256);

    //mapping(address => mapping(uint256 => UserPrjPosition)) public userPrjPosition; // user address => PRJ token index => UserPrjPosition
    function userPrjPosition(address user,uint256 prjId) external view returns(uint256);
    
    //mapping(address => address) public cTokensList; //underlying token address => cToken address
    function cTokensList(address token) external view returns(address);

    //mapping(address => uint256) public totalSupplyToken; // Token address => total supply of Token
    function totalSupplyToken(address token) external view returns(uint256);

    //mapping(address => uint256) public totalSupplyCToken; //cToken address => total supply of cToken
    function totalSupplyCToken(address token) external view returns(uint256);

   // mapping(address => mapping(uint256 => UserBorrowPosition)) public userBorrowPosition; //user address => lending tokens index => UserBorrowPosition
    function userBorrowPosition(address token,uint256 lendingTokenId) external view returns(uint256 amountBorrowed, uint256 amountPit);


    //Lvr = Loan to Value Ratio  
    struct LvrInfo{
        uint8 numerator;
        uint8 denominator;
    }

    //Ltf = Liquidation Threshold Factor
    struct LtfInfo{
        uint8 numerator;
        uint8 denominator;
    }

    struct UserPrjPosition{
        uint256 amountPrjDeposited;
        //uint256 amountPrjCollateral;
        //amountPrjDeposited + amountPrjCollateral = const
    }

    struct UserBorrowPosition{
        uint256 amountBorrowed;
        uint256 amountPit;
    }


    event AddPrjToken(address indexed who, address indexed tokenPrj);

    event LoanToValueRatioSet(address indexed who, address indexed tokenPrj, uint8 lvrNumerator, uint8 lvrDenominator);

    event LiquidationThresholdFactorSet(address indexed who, address indexed tokenPrj, uint8 ltfNumerator, uint8 ltfDenominator);

    event Deposit(address indexed who, uint256 tokenPrjId, address indexed tokenPrj, uint256 prjDepositAmount, address indexed beneficiar);

    event Withdraw(address indexed who, uint256 tokenPrjId, address indexed tokenPrj, uint256 prjWithdrawAmount, address indexed beneficiar);

    event Supply(address indexed who, uint256 supplyTokenId, address indexed supplyToken, uint256 supplyAmount, address indexed supplyCToken, uint amountSupplyCTokenReceived);

    event Redeem(address indexed who, uint256 redeemTokenId, address indexed redeemToken, address indexed redeemCToken, uint256 redeemAmount);
    
    event RedeemUnderlying(address indexed who, uint256 redeemTokenId, address indexed redeemToken, address indexed redeemCToken, uint256 redeemAmountUnderlying);

    event Borrow(address indexed who, uint256 borrowTokenId, address indexed borrowToken, uint256 borrowAmount);

    event RepayBorrow(address indexed who, uint256 borrowTokenId, address indexed borrowToken, uint256 borrowAmount);

    // event Liquidate(address indexed who, address indexed borrower, address indexed prjToken, uint256 amountPrjLiquidated);

    //************* ADMIN FUNCTIONS ********************************

    function addPrjToken(address _tokenPRJ, uint8 _lvrNumerator, uint8 _lvrDenominator, uint8 _ltfNumerator, uint8 _ltfDenominator) external;

    function addLendingToken(address _lendingToken) external;

    function addCLendingToken(address _underlyingToken, address _cToken) external;

    function setComptroller(address _comptroller) external;

     function setCPrimaryIndexToken(address _cPrimaryIndexToken) external;

    function setPriceOracle(address _priceOracle) external;
    
    //************* MODERATOR FUNCTIONS ********************************

    function setLvr(address _tokenPRJ, uint8 _lvrNumerator, uint8 _lvrDenominator) external;

    function setLtf(address _tokenPRJ, uint8 _ltfNumerator, uint8 _ltfDenominator) external;

    function pause() external;

    function unpause() external;
  
    //************* PUBLIC FUNCTIONS ********************************

    function deposit(uint256 prjId, uint256 amountPrj) external;

    function depositTo(uint256 prjId, uint256 amountPrj, address beneficiar) external;

    function withdraw(uint256 prjId, uint256 amountPrj) external;
    
    function withdrawTo(uint256 prjId, uint256 amountPrj, address beneficiar) external;

    event Test1(uint256 mintedAmount);

    function supply(uint256 lendingTokenId, uint256 amountLendingToken) external;

    function redeem(uint256 lendingTokenId, uint256 amountCLendingToken) external;

    function redeemUnderlying(uint256 lendingTokenId, uint256 amountLendingToken) external;

    //event Test2(uint currentBalancePitOfMsgSender,uint liquidity, uint borrowError, uint enterMarketError);


    function borrow(uint256 lendingTokenId, uint256 amountLendingToken) external;

    function repayBorrow(uint256 lendingTokenId, uint256 amountLendingToken) external;
 
    //************* VIEW FUNCTIONS ********************************

    function getLiquidity(address account) external view returns(uint);

    function getPrjEvaluationInBasicToken(address tokenPrj, uint256 amount) external view returns(uint256);

    function getCToken(address underlying) external view returns(address) ;

    function getDepositedPrjAmount(address account, uint256 prjId) external view returns(uint256);

    function liquidationThreshold(address account) external view returns(uint256);

    function liquidationThresholdForPosition(address account, uint256 prjId) external view returns(uint256);

    /**
     * @notice returns the amount of PIT of account
     */
    function balanceOfPit(address account) external view returns (uint256);

    /**
     * @notice returns the amount of PIT of account in position `prjId`
     */
    function balanceOfPitPosition(address account, uint256 prjId) external view returns (uint256);

    function totalSupplyPit() external view returns (uint256);


    function healthFactor(address account) external view returns(uint256, uint256);

}