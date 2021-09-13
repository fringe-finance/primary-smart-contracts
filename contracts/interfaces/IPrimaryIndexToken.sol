// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;


interface IPrimaryIndexToken {
    

    function MODERATOR_ROLE() external view returns(bytes32);

    function uniswapPathFinder() external view returns(address); //contract address of uniswap path finder 

    function basicToken() external view returns(address);  //contract address of USDC by default

    function comptroller() external view returns(address);

    function projectTokens(uint256 projectTokenId) external view returns(address);

    function lendingTokens(uint256 lendingTokenId) external view returns(address);


    // mapping(address => LvrInfo) public lvr; //tokenAddress => Lvr (Loan to Value Ratio)
    // mapping(address => LtfInfo) public ltf; //tokenAddress => Ltf (Liquidation Threshold Factor)
    // mapping(address => uint256) public totalStakedPrj; //tokenAddress => PRJ token staked
    // mapping(address => mapping(uint256 => UserPrjPosition)) public userPrjPosition; // user address => PRJ token index => UserPrjPosition

    // mapping(address => address) public cTokensList; //underlying token address => cToken address
    // mapping(address => uint256) public totalSupplyToken; // Token address => total supply of Token
    // mapping(address => uint256) public totalSupplyCToken; //cToken address => total supply of cToken
    // mapping(address => mapping(uint256 => UserSupplyPosition)) public userSupplyPosition; //user address => lending tokens index => UserSupplyPosition
    // mapping(address => mapping(uint256 => UserBorrowPosition)) public userBorrowPosition; //user address => lending tokens index => UserBorrowPosition

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
        uint256 amountPrjCollateral;
        //amountPrjDeposited + amountPrjCollateral = const
    }

    struct UserSupplyPosition{
        uint256 amountToken;
        uint256 amountCToken;
    }

    struct UserBorrowPosition{
        uint256 amountBorrowed;
    }

    event AddPrjToken(address indexed who, address indexed tokenPrj);

    event LoanToValueRatioSet(address indexed who, address indexed tokenPrj, uint8 lvrNumerator, uint8 lvrDenominator);

    event LiquidationThresholdFactorSet(address indexed who, address indexed tokenPrj, uint8 ltfNumerator, uint8 ltfDenominator);

    event Deposit(address indexed who, uint256 tokenPrjId, address indexed tokenPrj, uint256 prjDepositAmount, address indexed beneficiar);

    event Withdraw(address indexed who, uint256 tokenPrjId, address indexed tokenPrj, uint256 prjWithdrawAmount, address indexed beneficiar);

    event Supply(address indexed who, uint256 suppliedTokenId, address indexed suppliedToken, uint256 suppliedAmount, address indexed beneficiar);

    event Redeem(address indexed who, uint256 suppliedTokenId, address indexed redeemToken, uint256 redeemAmount,address indexed beneficiar);

    // event Borrow(address indexed who, address indexed borrowToken, uint256 borrowAmount);

    // event Liquidate(address indexed who, address indexed borrower, address indexed prjToken, uint256 amountPrjLiquidated);



    //************* ADMIN FUNCTIONS ********************************

    function addPrjToken(address _tokenPRJ, uint8 _lvrNumerator, uint8 _lvrDenominator, uint8 _ltfNumerator, uint8 _ltfDenominator) external;

    function addLendingToken(address _lendingToken) external;

    function addCLendingToken(address _underlyingToken, address _cToken) external;

    function setComptroller(address _comptroller) external;
    
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

    function supply(uint256 lendingTokenId, uint256 amountLendingToken) external;

    function supplyTo(uint256 lendingTokenId, uint256 amountLendingToken, address beneficiar) external;

    /**
     * @notice Sender redeems cTokens in exchange for the underlying asset
     * @param amountCLendingToken The number of cTokens to redeem into underlying
     */
    function redeem(uint256 lendingTokenId, uint256 amountCLendingToken) external;

    function redeemTo(uint256 lendingTokenId, uint256 amountCLendingToken, address beneficiar) external;

    /**
     * @notice Sender redeems cTokens in exchange for a specified amount of underlying asset
     * @param amountLendingToken The amount of underlying to redeem
     */
    function redeemUnderlying(uint256 lendingTokenId, uint256 amountLendingToken) external;

    function redeemUnderlyingTo(uint256 lendingTokenId, uint256 amountLendingToken, address beneficiar) external;

    // function borrow(address borrowToken, uint256 amountToBorrow) public {
    //     emit Borrow(_msgSender(), borrowToken, amountToBorrow);
    // }

    // function repayBorrow() public {

    // }

    // function liquidate(address borrower, uint256 prjId, uint256 amountPrjToLiquidate) public {

    //     address prjToken = projectTokens[prjId];
    //     emit Liquidate(_msgSender(), borrower, prjToken, amountPrjToLiquidate);
    // }

    //************* VIEW FUNCTIONS ********************************

    function getCToken(address underlying) external view returns(address);

    function getDepositedPrjAmount(address account, uint256 prjId) external view returns(uint256);

    function getCollateralPrjAmount(address account, uint256 prjId) external view returns(uint256);

    function getLendingTokenSuppliedAmount(address account, uint256 lendingTokenId) external view returns(uint256);

    function getCLendingTokenSuppliedAmount(address account, uint256 lendingTokenId) external view returns(uint256);

    function liquidationThreshold(address account) external view returns(uint256);

    function liquidationThresholdForPosition(address account, uint256 prjId) external view returns(uint256);

    /**
     * @notice returns the amount of PIT of account
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @notice returns the amount of PIT of account in position `prjId`
     */
    function balanceOfPosition(address account, uint256 prjId) external view returns (uint256);

    function totalSupply() external view returns (uint256);


    function healthFactor(address account) external view returns(uint256, uint256);

}