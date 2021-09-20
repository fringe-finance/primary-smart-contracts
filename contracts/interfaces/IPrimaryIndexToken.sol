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
    
    //mapping(address => PrjSaleInfo) public prjSales; //prj token address => PRJ sale info
    function prjSales(address) external view returns(uint8 numerator, uint8 denominator);

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

    event PrjSaleSet(address indexed who, address indexed tokenPrj, uint8 saleNumerator, uint8 saleDenominator);

    event Deposit(address indexed who, uint256 tokenPrjId, address indexed tokenPrj, uint256 prjDepositAmount, address indexed beneficiar);

    event Withdraw(address indexed who, uint256 tokenPrjId, address indexed tokenPrj, uint256 prjWithdrawAmount, address indexed beneficiar);

    event Supply(address indexed who, uint256 supplyTokenId, address indexed supplyToken, uint256 supplyAmount, address indexed supplyCToken, uint amountSupplyCTokenReceived);

    event Redeem(address indexed who, uint256 redeemTokenId, address indexed redeemToken, address indexed redeemCToken, uint256 redeemAmount);
    
    event RedeemUnderlying(address indexed who, uint256 redeemTokenId, address indexed redeemToken, address indexed redeemCToken, uint256 redeemAmountUnderlying);

    event Borrow(address indexed who, uint256 borrowTokenId, address indexed borrowToken, uint256 borrowAmount);

    event RepayBorrow(address indexed who, uint256 borrowTokenId, address indexed borrowToken, uint256 borrowAmount);

    event Liquidate(address indexed liquidator, address indexed borrower, uint lendingTokenId, uint prjId, uint amountPrjLiquidated);


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

    function setPrjSale(address _tokenPRJ, uint8 _saleNumerator, uint8 _saleDenominator) external;

    function pause() external;

    function unpause() external;
  
    //************* PUBLIC FUNCTIONS ********************************
    
    /**
     * @dev deposit the project token to Bonded primary index token.
     *      The position will be supplied to msg.sender
     * @param prjId the project token id in list `projectTokens`
     * @param amountPrj the amount of project token included decimals
     */
    function deposit(uint256 prjId, uint256 amountPrj) external;

    /**
     * @dev deposit the project token to Bonded primary index token.
     *      The position will be supplied to `beneficiar`
     * @param prjId the project token id in list `projectTokens`
     * @param amountPrj the amount of project token included decimals
     * @param beneficiar the address of receiver of project token position
     */
    function depositTo(uint256 prjId, uint256 amountPrj, address beneficiar) external;

    /**
     * @dev withdraw the project token from position.
     *      The project tokens will be withdrawn to msg.sender
     * @param prjId the project token id in list `projectTokens`
     * @param amountPrj the amount of project token included decimals
     */
    function withdraw(uint256 prjId, uint256 amountPrj) external;
    
    /**
     * @dev withdraw the project token from position.
     *      The project tokens will be withdrawn to `beneficiar`
     * @param prjId the project token id in list `projectTokens`
     * @param amountPrj the amount of project token included decimals
     */
    function withdrawTo(uint256 prjId, uint256 amountPrj, address beneficiar) external;

    /**
     * @dev supply the lending token to pool.
     *      The msg.sender will receive cToken of lending token.
     * @param lendingTokenId the lending token id in list `lendingTokens`
     * @param amountLendingToken the amount of lending token
     */
    function supply(uint256 lendingTokenId, uint256 amountLendingToken) external;

    /**
     * @dev redeem the lending token from pool.
     *      The msg.sender should approve cToken to transferFrom.
     * @param lendingTokenId the lending token id in list `lendingTokens`
     * @param amountCLendingToken the amount of Clending token to redeem
     */
    function redeem(uint256 lendingTokenId, uint256 amountCLendingToken) external;

    /**
     * @dev redeem the lending token from pool.
     * @param lendingTokenId the lending token id in list `lendingTokens`
     * @param amountLendingToken the amount of lending token to redeem
     */
    function redeemUnderlying(uint256 lendingTokenId, uint256 amountLendingToken) external;

    /**
     * @dev borrow the lending token from pool
     * @param lendingTokenId the lending token id in list `lendingTokens`
     * @param amountLendingToken the amount of lending token to borrow.
     */
    function borrow(uint256 lendingTokenId, uint256 amountLendingToken) external;

    /**
     * @dev repay the lending token from pool
     * @param lendingTokenId the lending token id in list `lendingTokens`
     * @param amountLendingToken the amount of lending token to repay.
     */
    function repayBorrow(uint256 lendingTokenId, uint256 amountLendingToken) external;
 
    /**
     * @dev liquidate the borrower position.
            Liquidates all project token position of borrower
     * @param user the address of borrower
     * @param lendingTokenId the lending token id in list `lendingTokens`
     * @param prjId the project token id in list `projectTokens` 
     */
    function liquidate(address user, uint lendingTokenId, uint prjId) external;

   
    //************* VIEW FUNCTIONS ********************************

    function healthFactor(address account,uint256 lendingTokenId) external view returns(uint256 numerator, uint256 denominator);

    function getLiquidity(address account) external view returns(uint);

    function getPrjEvaluationInBasicToken(address projectToken, uint256 amount) external view returns(uint256);

    function getPrjEvaluationInLendingTokenWithoutSale(address lendingToken, address projectToken, uint256 amountPrj) external view returns(uint256);

    function getPrjEvaluationInLendingTokenWithSale(address lendingToken, address projectToken, uint256 amountPrj) external view returns(uint256);

    function getCToken(address underlying) external view returns(address);

    function getDepositedPrjAmount(address account, uint256 prjId) external view returns(uint256);

    function getBorrowPosition(address account, uint256 lendingTokenId) external view returns(uint256,uint256);
    
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

    function projectTokensLength() external view returns(uint256);

    function lendingTokensLength() external view returns(uint256);

}