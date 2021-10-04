// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IPrimaryIndexToken {


    /**
     * @dev return keccak("MODERATOR_ROLE")
     */
    function MODERATOR_ROLE() external view returns(bytes32);

    /**
     * @dev return the address of uniswapPathFinder contract
     */
    function uniswapPathFinder() external view returns(address);

    /**
     * @dev returns the basic token. By default, this is the address of USDC.
     */
    function basicToken() external view returns(address);

    /**
     * @dev returns the address of comptroller contract
     */
    function comptroller() external view returns(address);

    /**
     * @dev returns the address of cPrimaryIndexToken
     */
    function cPrimaryIndexToken() external view returns(address);

    /**
     * @dev return the address of price oracle contract
     */
    function priceOracle() external view returns(address);
    
    //address[] public projectTokens;
    /**
     * @dev returns the address of project token
     * @param projectTokenId - id of project token in list.
     *                         starts from 0 to projectTokens.length-1;
     */
    function projectTokens(uint256 projectTokenId) external view returns(address projectToken);

    //address[] public lendingTokens;
     /**
     * @dev returns the address of project token
     * @param lendingTokenId - id of project token in list `lendingTokens`.
     *                         starts from 0 to lendingTokens.length-1;
     */
    function lendingTokens(uint256 lendingTokenId) external view returns(address);

    //mapping(address => LvrInfo) public lvr; //tokenAddress => Lvr (Loan to Value Ratio)
    /**
     * @dev returns the Loan to Value Ratio of project token.
     * @param prjToken - the address of project token
     */
    function lvr(address prjToken) external view returns(uint8 numerator, uint8 denominator);

    //mapping(address => LtfInfo) public ltf; //tokenAddress => Ltf (Liquidation Threshold Factor)
    /**
     * @dev returns the Liquidation Threshold Factor of lending token
     * @param lendingToken the address of lending token
     */
    function ltf(address lendingToken) external view returns(uint8 numerator, uint8 denominator);
    
    //mapping(address => PrjSaleInfo) public prjSales; //prj token address => PRJ sale info
    /**
     * @dev returns the project token sale
     * @param prjToken - the address of project token
     */
    function prjSales(address prjToken) external view returns(uint8 numerator, uint8 denominator);

    //mapping(address => uint256) public totalStakedPrj; //tokenAddress => PRJ token staked
    /**
     * @dev return the total staked of project token
     * @param prjToken - the address of project token
     */
    function totalStakedPrj(address prjToken) external view returns(uint256);

    //mapping(address => mapping(uint256 => UserPrjPosition)) public userPrjPosition; // user address => PRJ token index => UserPrjPosition
    /**
     * @dev return the amount of deposited project token by `user`
     * @param user - the address of depositer
     * @param prjId - the id of project token in list `projectTokens`
     */
    function userPrjPosition(address user,uint256 prjId) external view returns(uint256);
    
    //mapping(address => address) public cTokensList; //underlying token address => cToken address
    /**
     * @dev return the address of cToken of `lendingToken`
     * @param lendingToken - address of lending token.
     */
    function cTokensList(address lendingToken) external view returns(address);

    // mapping(address => mapping(uint256 => UserBorrowPosition)) public userBorrowPosition; //user address => lending tokens index => UserBorrowPosition
    /**
     * @dev 
     * @param user - the address of user, who borrowed lending token
     * @param lendingTokenId - id of project token in list `lendingTokens`.
     *                         starts from 0 to lendingTokens.length-1;
     */
    function userBorrowPosition(address user, uint256 lendingTokenId) external view returns(uint256 amountBorrowed, uint256 amountPit);

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

    event Borrow(address indexed who, uint256 borrowTokenId, address indexed borrowToken, uint256 borrowAmount, address indexed prjAddress, uint256 prjAmount);

    event RepayBorrow(address indexed who, uint256 borrowTokenId, address indexed borrowToken, uint256 borrowAmount);

    event Liquidate(address indexed liquidator, address indexed borrower, uint lendingTokenId, uint prjId, uint amountPrjLiquidated);


    //************* ADMIN FUNCTIONS ********************************

    /**
     * @dev adds the project token to Primary Index Token
     * @param _tokenPRJ - the address of project token
     * @param _lvrNumerator - the numerator of loan to value ratio
     * @param _lvrDenominator - the denominator of loan to value ratio
     * @param _ltfNumerator - the numerator of liquidation treshold factor
     * @param _ltfDenominator - the denominator of liquidation treshold factor
     * @param _saleNumerator - the numerator of project token sale
     * @param _saleDenominator - the denominator of project token sale
     */
    function addPrjToken(address _tokenPRJ, uint8 _lvrNumerator, uint8 _lvrDenominator, uint8 _ltfNumerator, uint8 _ltfDenominator,uint8 _saleNumerator, uint8 _saleDenominator) external;

    /**
     * @dev adds lending token to Primary Index Token
     * @param _lendingToken - the address of lending token
     */
    function addLendingToken(address _lendingToken) external;

    /**
     * @dev adds the cToken of lending token to Primary Index Token
     * @param _lendingToken - the address of lending token
     * @param _cLendingToken - the address of cLending token 
     */
    function addCLendingToken(address _lendingToken, address _cLendingToken) external;

    /**
     * @dev sets comptroller address to Primary Index Token
     * @param _comptroller - the address of comptroller contract
     */
    function setComptroller(address _comptroller) external;

    /**
     * @dev sets the cPrimary Index Token to Primary Index Token
     * @param _cPrimaryIndexToken - the address of cPrimary Index Token
     */
    function setCPrimaryIndexToken(address _cPrimaryIndexToken) external;

    /**
     * @dev sets the price oracle to Primary Index Token
     * @param _priceOracle - the address of price oracle contract
     */
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

    /**
     * @dev calculates the health factor of `account`
     * @param account - the address of user
     * @param lendingTokenId the lending token id in list `lendingTokens`
     */
    function healthFactor(address account,uint256 lendingTokenId) external view returns(uint256 numerator, uint256 denominator);

    /**
     * @dev gets account liquidity
     * @param account - the address of user
     */
    function getLiquidity(address account) external view returns(uint);

    /**
     * @dev get project token evaluation depending on 
     * @param projectToken - the address of project token
     * @param prjAmount - the amount of project token including decimals
     */
    function getPrjEvaluationInBasicToken(address projectToken, uint256 prjAmount) external view returns(uint256);

    /**
     * @dev gets the raw evaluation of project token in dimention of lending token
     * @param lendingToken - the address of lending token
     * @param projectToken - the address of project token
     * @param amountPrj - amount of project token including decimals
     */
    function getPrjEvaluationInLendingTokenWithoutSale(address lendingToken, address projectToken, uint256 amountPrj) external view returns(uint256);

    /**
     * @dev gets the evaluation of project token with sale in dimention of lending token
     * @param lendingToken - the address of lending token
     * @param projectToken - the address of project token
     * @param amountPrj - the amount of project token including decimals
     */
    function getPrjEvaluationInLendingTokenWithSale(address lendingToken, address projectToken, uint256 amountPrj) external view returns(uint256);

    /**
     * @dev get cToken address of underlying
     * @param lendingToken - the address of lending token
     */
    function getCToken(address lendingToken) external view returns(address);

    /**
     * @dev returns the deposited prj amount of `account`
     * @param account - the address of user
     * @param prjId the project token id in list `projectTokens` 
     */
    function getDepositedPrjAmount(address account, uint256 prjId) external view returns(uint256);

    /**
     * @dev get the `account` borrow position
     * @param account - the address of user
     * @param lendingTokenId the lending token id in list `lendingTokens`
     */
    function getBorrowPosition(address account, uint256 lendingTokenId) external view returns(uint256,uint256);
    
    /**
     * @dev get the liquidation treshold factor of `account`
     * @param account - the address of user
     */
    function liquidationThreshold(address account) external view returns(uint256);

    /**
     * @dev get the liquidation treshold factor of `account` for position
     * @param account - the address of user
     * @param prjId the project token id in list `projectTokens` 
     */
    function liquidationThresholdForPosition(address account, uint256 prjId) external view returns(uint256);

    /**
     * @dev returns the amount of PIT of account
     * @param account - the address of user
     */
    function balanceOfPit(address account) external view returns (uint256);

    /**
     * @notice return the pitBalance depending on input prj indexes
     */
    function balanceOfPitDependingOnPrj(address account, uint256[] memory prjIndexes) external view returns(uint256);
 
    /**
     * @dev returns the amount of PIT of account in position `prjId`
     * @param account - the address of user
     * @param prjId the project token id in list `projectTokens` 
     */
    function balanceOfPitPosition(address account, uint256 prjId) external view returns (uint256);

    /**
     * @dev returns the total supply of Primary Index Token
     */
    function totalSupplyPit() external view returns (uint256);

    /**
     * @return the length of listed project tokens
     */
    function projectTokensLength() external view returns(uint256);

    /**
     * @return the length of listed lending tokens
     */
    function lendingTokensLength() external view returns(uint256);

    /**
     * @dev returns the decimals of Primary Index Token
     */
    function decimals() external view returns(uint8);

}