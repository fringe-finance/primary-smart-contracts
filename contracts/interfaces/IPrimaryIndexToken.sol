// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IPrimaryIndexToken {


    /**
     * @dev return keccak("MODERATOR_ROLE")
     */
    function MODERATOR_ROLE() external view returns(bytes32);

    /**
     * @dev returns the basic token. By default, this is the address of USDC.
     */
    function basicToken() external view returns(address);

    /**
     * @dev return the address of price oracle contract
     */
    function priceOracle() external view returns(address);
    
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
    
    /**
     * @dev returns the project token sale
     * @param prjToken - the address of project token
     */
    function prjSales(address prjToken) external view returns(uint8 numerator, uint8 denominator);

    /**
     * @dev return the total staked of project token
     * @param prjToken - the address of project token
     */
    function totalStakedPrj(address prjToken) external view returns(uint256);

    /**
     * @dev return the amount of deposited project token by `user`
     * @param user - the address of depositer
     * @param prjId - the id of project token in list `projectTokens`
     */
    function userPrjPosition(address user,uint256 prjId) external view returns(uint256);
    
    /**
     * @dev return the address of cToken of `lendingToken`
     * @param lendingToken - address of lending token.
     */
    function bTokensList(address lendingToken) external view returns(address);

    // mapping(address => mapping(uint256 => UserBorrowPosition)) public userBorrowPosition; //user address => lending tokens index => UserBorrowPosition
    /**
     * @dev 
     * @param user - the address of user, who borrowed lending token
     * @param lendingTokenId - id of lending token in list `lendingTokens`.
     *                         starts from 0 to lendingTokens.length-1;
     * @param projectTokenId - id of project token in list `projectTokens`.
     *                         starts from 0 to lendingTokens.length-1;
     */
    function userBorrowPosition(address user, uint256 lendingTokenId,uint256 projectTokenId) external view returns(uint256 amountBorrowed, uint256 amountPit);

    /**
     * @dev
     * @param user - the address of user, who borrowed lending token
     * @param lendingTokenId - id of project token in list `lendingTokens`.
     *                         starts from 0 to lendingTokens.length-1;
     */
    function suppliedLendingToken(address user, uint256 lendingTokenId) external view returns(uint256 amountSupplied);

    /**
     * @dev returns the index of address of project token in list `projectTokens`
     * @param prj - address of project token
     */
    function indexPrjToken(address prj) external view returns(uint256 prjId);
    
    //mapping(address => uint256) public indexLendingToken;//lending token address => index lending token in list `lendingTokens`
    /**
     * @dev returns the index of address of lending token in list `lendingTokens`
     * @param lendingToken - address of lending token
     */
    function indexLendingToken(address lendingToken) external view returns(uint256 lendingTokenId);

    struct Ratio{
        uint8 numerator;
        uint8 denominator;
    }

    struct UserPrjPosition{
        uint256 amountPrjDeposited;
    }

    struct UserBorrowPosition{
        uint256 amountBorrowed;
        uint256 amountPit;
    }

    /**
     * @param who - the initiator of event
     * @param tokenPrj - the address of project token
     */
    event AddPrjToken(address indexed who, address indexed tokenPrj);

    /**
     * @param who - the initiator of event
     * @param tokenPrj - the address of project token
     * @param lvrNumerator - the numerator of loan to value ratio
     * @param lvrDenominator - the denominator of loan to value ratio
     */
    event LoanToValueRatioSet(address indexed who, address indexed tokenPrj, uint8 lvrNumerator, uint8 lvrDenominator);

    /**
     * @param who - the initiator of event
     * @param tokenPrj - the address of project token
     * @param ltfNumerator - the numerator of liquidation threshold factor ratio
     * @param ltfDenominator - the denominator of liquidation threshold factor ratio
     */
    event LiquidationThresholdFactorSet(address indexed who, address indexed tokenPrj, uint8 ltfNumerator, uint8 ltfDenominator);

    /**
     * @param who - the initiator of event
     * @param tokenPrj - the address of project token
     * @param saleNumerator - the numerator of sale
     * @param saleDenominator - the denominator of sale
     */
    event PrjSaleSet(address indexed who, address indexed tokenPrj, uint8 saleNumerator, uint8 saleDenominator);

    /**
     * @param who - the initiator of event
     * @param tokenPrjId - the id of address of project token in list `projectTokens`
     * @param tokenPrj - the address of project token
     * @param prjDepositAmount - the amount of project token deposited
     * @param beneficiar - the receiver address of prj position
     */
    event Deposit(address indexed who, uint256 tokenPrjId, address indexed tokenPrj, uint256 prjDepositAmount, address indexed beneficiar);

    /**
     * @param who - the initiator of event
     * @param tokenPrjId - the id of address of project token in list `projectTokens`
     * @param tokenPrj - the address of project token
     * @param prjWithdrawAmount - the amount of project token withdrawed
     * @param beneficiar - the receiver address of project tokens
     */
    event Withdraw(address indexed who, uint256 tokenPrjId, address indexed tokenPrj, uint256 prjWithdrawAmount, address indexed beneficiar);

    /**
     * @param who - the initiator of event
     * @param supplyTokenId - the id of address of lending token in list `lendingTokens`
     * @param supplyToken - the address of lending token
     * @param supplyAmount - the amount of lending token including decimals
     * @param supplyCToken - the address of lending cToken 
     * @param amountSupplyCTokenReceived - the amount of cToken received by `who`
     */
    event Supply(address indexed who, uint256 supplyTokenId, address indexed supplyToken, uint256 supplyAmount, address indexed supplyCToken, uint amountSupplyCTokenReceived);

    /**
     * @param who - the initiator of event
     * @param redeemTokenId - the id of address of lending token in list `lendingTokens`
     * @param redeemToken - the address of lending token
     * @param redeemCToken - the address of lending cToken 
     * @param redeemAmount - the amount of lending cToken redeemed by `who`
     */
    event Redeem(address indexed who, uint256 redeemTokenId, address indexed redeemToken, address indexed redeemCToken, uint256 redeemAmount);
    
    /**
     * @param who - the initiator of event
     * @param redeemTokenId - the id of address of lending token in list `lendingTokens`
     * @param redeemToken - the address of lending token
     * @param redeemCToken - the address of lending cToken 
     * @param redeemAmountUnderlying - the amount of lending token redeemed by `who`
     */
    event RedeemUnderlying(address indexed who, uint256 redeemTokenId, address indexed redeemToken, address indexed redeemCToken, uint256 redeemAmountUnderlying);

    /**
     * @param who - the initiator of event
     * @param borrowTokenId - the id of address of lending token in list `lendingTokens`
     * @param borrowToken - the address of lending token
     * @param borrowAmount - the amount of lending token borrowed
     * @param prjAddress - the address of project token that forwarded by frontend or backend
     * @param prjAmount - the amount of project token that forwarded by frontend or backend
     */
    event Borrow(address indexed who, uint256 borrowTokenId, address indexed borrowToken, uint256 borrowAmount, address indexed prjAddress, uint256 prjAmount);

    /**
     * @param who - the initiator of event
     * @param borrowTokenId - the id of address of lending token in list `lendingTokens`
     * @param borrowToken - the address of lending token
     * @param borrowAmount - the amount of lending token borrowed
     * @param prjAddress - the address of project token that forwarded by frontend or backend
     * noparam prjAmount - the amount of project token that forwarded by frontend or backend
     */
    event RepayBorrow(address indexed who, uint256 borrowTokenId, address indexed borrowToken, uint256 borrowAmount, address indexed prjAddress, bool isPositionFullyRepaid);

    /**
     * @param liquidator - the initiator of event
     * @param borrower - the address of lending token
     * @param lendingTokenId - the id of address of lending token in list `lendingTokens`
     * @param prjId - the id of address of project token in list `projectTokens`
     * @param amountPrjLiquidated - the amount of project tokens that is liquidated by liquidator
     */
    event Liquidate(address indexed liquidator, address indexed borrower, uint lendingTokenId, uint prjId, uint amountPrjLiquidated);

    event Transfer(address indexed from, address indexed to, uint256 value);

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
     * @param _bLendingToken - the address of bLending token
     */
    function addLendingToken(address _lendingToken, address _bLendingToken) external;

    /**
     * @dev sets the price oracle to Primary Index Token
     * @param _priceOracle - the address of price oracle contract
     */
    function setPriceOracle(address _priceOracle) external;
    
    //************* MODERATOR FUNCTIONS ********************************

    /**
     * @dev sets loan to value ratio
     * @param _tokenPRJ - address of project token
     * @param _lvrNumerator - the numetaror of loan to value ratio
     * @param _lvrDenominator - the denominator of loan to value ratio
     */
    function setLvr(address _tokenPRJ, uint8 _lvrNumerator, uint8 _lvrDenominator) external;

    /**
     * @dev sets liquidation treshold factor
     * @param _tokenPRJ - address of project token
     * @param _ltfNumerator - the numetaror of liquidation treshold factor
     * @param _ltfDenominator - the denominator of liquidation treshold factor
     */
    function setLtf(address _tokenPRJ, uint8 _ltfNumerator, uint8 _ltfDenominator) external;

    /**
     * @dev sets the sale to liquidation
     * @param _tokenPRJ - address of project token
     * @param _saleNumerator - the numetaror of sale to liquidation
     * @param _saleDenominator - the denominator of sale to liquidation
     */
    function setPrjSale(address _tokenPRJ, uint8 _saleNumerator, uint8 _saleDenominator) external;

    /**
     * @dev pause the part of contract`s function 
     */
    function pause() external;

    /**
     * @dev unpause the part of contract`s function 
     */
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
     * @param amountBLendingToken the amount of Blending token to redeem
     */
    function redeem(uint256 lendingTokenId, uint256 amountBLendingToken) external;

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
     * @param prj the address of project token
     * @param prjAmount amount of project token.
     */
    function borrow(uint256 lendingTokenId, uint256 amountLendingToken, address prj, uint256 prjAmount) external;

    /**
     * @dev repay the lending token from pool
     * @param lendingTokenId the lending token id in list `lendingTokens`
     * @param amountLendingToken the amount of lending token to repay.
     * @param prj the address of project token
     * @param prjAmount amount of project token.
     */
    function repayBorrow(uint256 lendingTokenId, uint256 amountLendingToken, address prj,uint256 prjAmount) external;
 
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
     * @dev returns the amount of PIT of account in position `prjId`
     * @param account - the address of user
     * @param prjId the project token id in list `projectTokens` 
     */
    function balanceOfPitPosition(address account, uint256 prjId) external view returns (uint256);

    /**
     * @dev get the liquidation treshold factor of `account` for position
     * @param account - the address of user
     * @param prjId the project token id in list `projectTokens` 
     */
    function liquidationThresholdForPosition(address account, uint256 prjId) external view returns(uint256);

    /**
     * @param account - the address of user
     * @param lendingTokenId the lending token id in list `lendingTokens`
     * @param prjId the project token id in list `projectTokens` 
     */
    function healthFactorForPosition(address account,uint256 lendingTokenId,uint prjId) external view returns(uint256 numerator, uint256 denominator);

    /**
     * @dev calculates the health factor of `account`
     * @param account - the address of user
     * @param lendingTokenId the lending token id in list `lendingTokens`
     */
    function healthFactor(address account,uint256 lendingTokenId) external view returns(uint256 numerator, uint256 denominator);

    /**
     * @dev get project token evaluation depending on 
     * @param projectToken - the address of project token
     * @param prjAmount - the amount of project token including decimals
     */
    function getPrjEvaluationInBasicToken(address projectToken, uint256 prjAmount) external view returns(uint256);

    /**
     * @dev gets the raw evaluation of project token in dimention of lending token
     * @param projectToken - the address of project token
     * @param amountPrj - amount of project token including decimals
     */
    function getPrjEvaluationInBasicTokenWithSale (address projectToken, uint256 amountPrj) external view returns(uint256);

    /**
     * @dev get cToken address of underlying
     * @param lendingToken - the address of lending token
     */
    function getBToken(address lendingToken) external view returns(address);

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
    function getBorrowPosition(address account, uint256 lendingTokenId, uint256 prjId) external view returns(uint256 amountBorrowed,uint256 amountPit);

   
    /**
     * @dev get the liquidation treshold factor of `account`
     * @param account - the address of user
     */
    function liquidationThreshold(address account) external view returns(uint256);

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
     * @dev returns the uniswap reserves.
     * @param prj address of project token
     */
    function getUniswapReserves(address prj) external view returns(uint reserve1,uint reserve2);

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

    function totalSupply() external view returns (uint256);
}