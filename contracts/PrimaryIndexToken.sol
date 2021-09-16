// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "../openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

import "../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "../openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import "./uniswap/UniswapPathFinder.sol";
import "./interfaces/ICPrimaryIndexToken.sol";
import "./interfaces/ICLendingToken.sol";
import "./interfaces/IComptroller.sol";
import "./interfaces/ISimplePriceOracle.sol";

contract PrimaryIndexToken is Initializable,
                              ERC20Upgradeable,
                              PausableUpgradeable,
                              AccessControlUpgradeable,
                              ERC2771ContextUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    UniswapPathFinder public uniswapPathFinder; //contract address of uniswap path finder 

    address public basicToken;  //contract address of USDC by default or any stablecoin

    IComptroller public comptroller;

    ICPrimaryIndexToken public cPrimaryIndexToken;

    ISimplePriceOracle public priceOracle;

    address[] public projectTokens;

    address[] public lendingTokens;

    mapping(address => LvrInfo) public lvr; //prj token address => Lvr (Loan to Value Ratio)
    mapping(address => LtfInfo) public ltf; //prj token address => Ltf (Liquidation Threshold Factor)
    mapping(address => PrjSaleInfo) public prjSales; //prj token address => PRJ sale info
    mapping(address => uint256) public totalStakedPrj; //tokenAddress => PRJ token staked
    mapping(address => mapping(uint256 => UserPrjPosition)) public userPrjPosition; // user address => PRJ token index => UserPrjPosition

    mapping(address => address) public cTokensList; //underlying token address => cToken address
    mapping(address => uint256) public totalSupplyToken; // underlying token address => total supply of Token
    mapping(address => uint256) public totalSupplyCToken; //cToken address => total supply of cToken
    mapping(address => mapping(uint256 => UserBorrowPosition)) public userBorrowPosition; //user address => lending tokens index => UserBorrowPosition

    struct PrjSaleInfo{
        uint8 numerator;
        uint8 denominator;
    }
    
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

    // event Liquidate(address indexed who, address indexed borrower, address indexed prjToken, uint256 amountPrjLiquidated);


    function init(address _basicToken, address _uniswapPathFinder, address _moderator, address _trustedForwarder) public initializer{
        require(_basicToken != 0xdAC17F958D2ee523a2206206994597C13D831ec7, "_basicToken shouldnt be USDT!");
        __ERC20_init("Primary Index Token", "PIT");
        require(this.decimals() >= ERC20Upgradeable(_basicToken).decimals(), "Primary Index Token: basic token should have decimals less than PIT");
        __Pausable_init_unchained();
        __AccessControl_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MODERATOR_ROLE, _moderator);
        __ERC2771Context_init_unchained(_trustedForwarder);
        basicToken = _basicToken;
        uniswapPathFinder = UniswapPathFinder(_uniswapPathFinder);
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Caller is not the Admin");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, _msgSender()), "Caller is not the Moderator");
        _;
    }

    //************* ADMIN FUNCTIONS ********************************

    function addPrjToken(address _tokenPRJ, uint8 _lvrNumerator, uint8 _lvrDenominator, uint8 _ltfNumerator, uint8 _ltfDenominator,uint8 _saleNumerator, uint8 _saleDenominator) public onlyAdmin {
        require(_lvrNumerator <= _lvrDenominator, "Primary Index Token: _lvrNumerator should be less than _lvrDenominator!");
        projectTokens.push(_tokenPRJ);
        emit AddPrjToken(_msgSender(), _tokenPRJ);
        _setLvr(_tokenPRJ, _lvrNumerator, _lvrDenominator);
        _setLtf(_tokenPRJ, _ltfNumerator, _ltfDenominator);
        _setPrjSale(_tokenPRJ, _saleNumerator, _saleDenominator);
    }

    function addLendingToken(address _lendingToken) public onlyAdmin{
        require(_lendingToken != address(0),"Primary Index Token: invalid _lendingToken address!");
        lendingTokens.push(_lendingToken);
    }

    function addCLendingToken(address _underlyingToken, address _cToken) public onlyAdmin{
        require(_underlyingToken != address(0),"Primary Index Token: invalid underlying address!");
        require(_cToken != address(0),"Primary Index Token: invalid cToken address!");
        cTokensList[_underlyingToken] = _cToken;
    }

    function setComptroller(address _comptroller) public onlyAdmin{
        comptroller = IComptroller(_comptroller);
    }

     function setCPrimaryIndexToken(address _cPrimaryIndexToken) public onlyAdmin{
        cPrimaryIndexToken = ICPrimaryIndexToken(_cPrimaryIndexToken);
        
    }

    function setPriceOracle(address _priceOracle) public onlyAdmin{
        priceOracle = ISimplePriceOracle(_priceOracle);
    }
    
    //************* MODERATOR FUNCTIONS ********************************

    function setLvr(address _tokenPRJ, uint8 _lvrNumerator, uint8 _lvrDenominator) public onlyModerator{
        require(_lvrNumerator <= _lvrDenominator, "Primary Index Token: _lvrNumerator should be less than _lvrDenominator!");
        _setLvr(_tokenPRJ, _lvrNumerator, _lvrDenominator);
    }

    function setLtf(address _tokenPRJ, uint8 _ltfNumerator, uint8 _ltfDenominator) public onlyModerator{
        require(_ltfNumerator <= _ltfDenominator, "Primary Index Token: _ltfNumerator should be less than _ltfDenominator!");
        _setLtf(_tokenPRJ, _ltfNumerator, _ltfDenominator);
    }

    function setPrjSale(address _tokenPRJ, uint8 _saleNumerator, uint8 _saleDenominator) public onlyModerator{
        require(_saleNumerator <= _saleDenominator, "Primary Index Token: _ltfNumerator should be less than _ltfDenominator!");
        _setPrjSale(_tokenPRJ,_saleNumerator, _saleDenominator);
    }

    function _setLvr(address _tokenPRJ, uint8 _lvrNumerator, uint8 _lvrDenominator) private {
        lvr[_tokenPRJ] = LvrInfo({numerator:_lvrNumerator,denominator:_lvrDenominator});
        emit LoanToValueRatioSet(_msgSender(), _tokenPRJ, _lvrNumerator, _lvrDenominator);
    }

    function _setLtf(address _tokenPRJ, uint8 _ltfNumerator, uint8 _ltfDenominator) private {
        ltf[_tokenPRJ] = LtfInfo({numerator:_ltfNumerator,denominator:_ltfDenominator});
        emit LiquidationThresholdFactorSet(_msgSender(), _tokenPRJ, _ltfNumerator, _ltfDenominator);
    }

    function _setPrjSale(address _tokenPRJ, uint8 _saleNumerator, uint8 _saleDenominator) private {
        prjSales[_tokenPRJ] = PrjSaleInfo({numerator:_saleNumerator,denominator:_saleDenominator});
        emit PrjSaleSet(_msgSender(), _tokenPRJ, _saleNumerator, _saleDenominator);
    }

    function pause() public onlyModerator {
        _pause();
    }

    function unpause() public onlyModerator{
        _unpause();
    }
  
    //************* PUBLIC FUNCTIONS ********************************

    function deposit(uint256 prjId, uint256 amountPrj) public {
        depositTo(prjId, amountPrj, _msgSender());
    }

    function depositTo(uint256 prjId, uint256 amountPrj, address beneficiar) public {
        require(prjId < projectTokens.length,"Primary Index Token: invalid prjId. ");
        require(amountPrj > 0, "Primary Index Token: amountPrj should be greated than zero!");
        address tokenPrj = projectTokens[prjId];
        UserPrjPosition storage beneficiarDepositPosition = userPrjPosition[beneficiar][prjId];
        IERC20Upgradeable(tokenPrj).safeTransferFrom(_msgSender(), address(this), amountPrj);
        beneficiarDepositPosition.amountPrjDeposited += amountPrj;
        totalStakedPrj[tokenPrj] += amountPrj;
        emit Deposit(_msgSender(), prjId, tokenPrj, amountPrj, beneficiar);
    }

    function withdraw(uint256 prjId, uint256 amountPrj) public {
        withdrawTo(prjId, amountPrj, _msgSender());
    }
    
    event Test4(uint prevNum, uint prevDenom, uint newNum, uint newDenom);

    function withdrawTo(uint256 prjId, uint256 amountPrj, address beneficiar) public {
        require(prjId < projectTokens.length,"Primary Index Token: invalid prjId. ");
        require(amountPrj > 0 && amountPrj <= userPrjPosition[_msgSender()][prjId].amountPrjDeposited, "Primary Index Token: amountPrj should be greated than zero and less equal than position staked!");
        address tokenPrj = projectTokens[prjId];

        UserPrjPosition storage msgSenderPosition = userPrjPosition[_msgSender()][prjId];
        for(uint i=0;i < lendingTokens.length; i++){
            UserBorrowPosition storage msgSenderBorrowPosition = userBorrowPosition[_msgSender()][i];
            if(msgSenderBorrowPosition.amountBorrowed > 0){
                (uint prevNum, uint prevDenom) = healthFactor(_msgSender(), i);
                msgSenderPosition.amountPrjDeposited -= amountPrj;
                (uint newNum, uint newDenom) = healthFactor(_msgSender(), i);
                if(newNum >= newDenom){
                    totalStakedPrj[tokenPrj] -= amountPrj;
                    IERC20Upgradeable(tokenPrj).safeTransfer(beneficiar, amountPrj);
                    emit Withdraw(_msgSender(), prjId, tokenPrj, amountPrj, beneficiar);
                }
                else{
                    msgSenderPosition.amountPrjDeposited += amountPrj;
                }
                msgSenderBorrowPosition.amountBorrowed = ICLendingToken(cTokensList[lendingTokens[i]]).borrowBalanceCurrent(_msgSender());
                emit Test4(prevNum, prevDenom, newNum, newDenom);
                return;
            }
        }
        msgSenderPosition.amountPrjDeposited -= amountPrj;
        totalStakedPrj[tokenPrj] -= amountPrj;
        IERC20Upgradeable(tokenPrj).safeTransfer(beneficiar, amountPrj);
        emit Withdraw(_msgSender(), prjId, tokenPrj, amountPrj, beneficiar);
         
    }

    function supply(uint256 lendingTokenId, uint256 amountLendingToken) public {
        require(lendingTokenId < lendingTokens.length, "Primary Index Token: invalid lendingTokenId!");
        require(amountLendingToken > 0, "Primary Index Token: amountLendingToken should be greated than zero!");
        address lendingToken = lendingTokens[lendingTokenId];
        address cLendingToken = cTokensList[lendingToken];
           
        (, uint256 mintedAmount) = ICLendingToken(cLendingToken).mintTo(_msgSender(),amountLendingToken);

        emit Supply(_msgSender(), lendingTokenId, lendingToken, amountLendingToken,cLendingToken,mintedAmount);
    }


    function redeem(uint256 lendingTokenId, uint256 amountCLendingToken) public {
        require(lendingTokenId < lendingTokens.length, "Primary Index Token: invalid lendingTokenId!");
        require(amountCLendingToken > 0, "Primary Index Token: amountLendingToken should be greated than zero!");
        address lendingToken = lendingTokens[lendingTokenId];
        address cLendingToken = cTokensList[lendingToken];

        (uint redeemError) = ICLendingToken(cLendingToken).redeemTo(_msgSender(), amountCLendingToken);
        require(redeemError == 0,"Primary Index Token: redeemError is not zero!.It may be caused trying to redeem more than user supply.");
        emit Redeem(_msgSender(), lendingTokenId, lendingToken, cLendingToken, amountCLendingToken);
    }

    function redeemUnderlying(uint256 lendingTokenId, uint256 amountLendingToken) public {
        require(lendingTokenId < lendingTokens.length, "Primary Index Token: invalid lendingTokenId!");
        require(amountLendingToken > 0, "Primary Index Token: amountLendingToken should be greated than zero!");
        address lendingToken = lendingTokens[lendingTokenId];
        address cLendingToken = cTokensList[lendingToken];

        uint redeemUnderlyingError = ICLendingToken(cLendingToken).redeemUnderlyingTo(_msgSender(), amountLendingToken);
        require(redeemUnderlyingError == 0,"Primary Index Token: redeemUnderlyingError not zero! It may be caused by trying to redeem more than user supply");

        emit RedeemUnderlying(_msgSender(), lendingTokenId, lendingToken, cLendingToken, amountLendingToken);
    }

    //event Test2(uint currentBalancePitOfMsgSender,uint liquidity, uint borrowError, uint amountBorrowed);


    function borrow(uint256 lendingTokenId, uint256 amountLendingToken) public {
        require(lendingTokenId < lendingTokens.length, "Primary Index Token: invalid lendingTokenId!");
        require(amountLendingToken > 0, "Primary Index Token: amountLendingToken should be greated than zero!");
        address lendingToken = lendingTokens[lendingTokenId];
        address cLendingToken = cTokensList[lendingToken];
        UserBorrowPosition storage position = userBorrowPosition[_msgSender()][lendingTokenId];
        if(position.amountBorrowed == 0){
            uint enterMarketError = comptroller.enterMarket(address(cPrimaryIndexToken), _msgSender());
            uint currentBalancePitOfMsgSender = balanceOfPit(_msgSender());
          
            _mint(_msgSender(), currentBalancePitOfMsgSender);
            _approve(_msgSender(),address(cPrimaryIndexToken), currentBalancePitOfMsgSender);
            cPrimaryIndexToken.mintTo(_msgSender(),currentBalancePitOfMsgSender);

            (,uint liquidity,) = comptroller.getAccountLiquidity(_msgSender());
            uint borrowError = ICLendingToken(cLendingToken).borrowTo(_msgSender(), amountLendingToken);
            
            position.amountBorrowed = amountLendingToken;
            position.amountPit = currentBalancePitOfMsgSender;
            require(borrowError == 0,"Primary Index Token: borrow error");
            //emit Test2(0, liquidity, borrowError, position.amountBorrowed);
        }
        else{
            uint borrowError = ICLendingToken(cLendingToken).borrowTo(_msgSender(), amountLendingToken);
            require(borrowError == 0,"Primary Index Token: borrow error");
          
            position.amountBorrowed = ICLendingToken(cLendingToken).borrowBalanceCurrent(_msgSender());
            //emit Test2(0, 0, borrowError, position.amountBorrowed);
        }

        emit Borrow(_msgSender(),lendingTokenId, lendingToken, amountLendingToken);
    }


    function repayBorrow(uint256 lendingTokenId, uint256 amountLendingToken) public {
        require(lendingTokenId < lendingTokens.length, "Primary Index Token: invalid lendingTokenId!");
        require(amountLendingToken > 0, "Primary Index Token: amountLendingToken should be greated than zero!");
        address lendingToken = lendingTokens[lendingTokenId];
        address cLendingToken = cTokensList[lendingToken];
        UserBorrowPosition storage position = userBorrowPosition[_msgSender()][lendingTokenId];
        
        (uint borrowError, uint amountRepayed)  = ICLendingToken(cLendingToken).repayBorrowTo(_msgSender(), amountLendingToken);

        if(amountLendingToken == ((2 ** 256) - 1)){
            position.amountBorrowed = 0;
            position.amountPit = 0;

        }
        else{
            position.amountBorrowed = ICLendingToken(cLendingToken).borrowBalanceCurrent(_msgSender());
        }
        emit RepayBorrow(_msgSender(),lendingTokenId, lendingToken, amountLendingToken);
       
    }

    event Test3(uint amoutLendingTokenToReceive, uint amountBorrowed);

    function liquidate(address user, uint lendingTokenId, uint prjId/** , uint amountPrj*/) public {
        require(prjId < projectTokens.length, "Primary Index Token: invalid lendingTokenId!");
        //require(amountPrj > 0, "Primary Index Token: amountPrj should be greater than zero!");
        address lendingToken = lendingTokens[lendingTokenId];
        address cLendingToken = cTokensList[lendingToken];
        address projectToken = projectTokens[prjId];

        UserBorrowPosition storage borrowPosition = userBorrowPosition[user][lendingTokenId];
        if(borrowPosition.amountBorrowed == 0){
            return;
        }

        borrowPosition.amountBorrowed = ICLendingToken(cLendingToken).borrowBalanceCurrent(user);
        
        (uint hf_numerator, uint hf_denominator) = healthFactor(user, lendingTokenId);

        if (hf_numerator >= hf_denominator){
            return;
        }else{
            UserPrjPosition storage prjPosition = userPrjPosition[user][prjId];
            
            //require(amountPrj <= prjPosition.amountPrjDeposited,"Primary Index Token: amountPrj exeeded deposited balance");
            uint prjDeposited = prjPosition.amountPrjDeposited;
            uint amoutLendingTokenToReceive = getPrjEvaluationInLendingTokenWithSale(lendingToken, projectToken, prjDeposited);
            IERC20Upgradeable(lendingToken).safeTransferFrom(_msgSender(),address(this),amoutLendingTokenToReceive);
            
            emit Test3(amoutLendingTokenToReceive, borrowPosition.amountBorrowed);
            
            IERC20Upgradeable(lendingToken).approve(cLendingToken,amoutLendingTokenToReceive);
            (, uint256 mintedAmount) = ICLendingToken(cLendingToken).mintTo(address(this),amoutLendingTokenToReceive);
            
            IERC20Upgradeable(projectToken).safeTransfer(_msgSender(),prjDeposited);
            prjPosition.amountPrjDeposited -= prjDeposited;
            borrowPosition.amountBorrowed = 0;
            borrowPosition.amountPit = 0;

        }

    }

    //************* VIEW FUNCTIONS ********************************


    function healthFactor(address account,uint256 lendingTokenId) public view returns(uint256 numerator, uint256 denominator){
        uint256 lt = liquidationThreshold(account);
        uint256 borrowed = userBorrowPosition[account][lendingTokenId].amountBorrowed;
        return (lt, borrowed);
    }

    function getLiquidity(address account) public view returns(uint){
        (,uint liquidity,) = comptroller.getAccountLiquidity(account);
        return liquidity;
    }

    function getPrjEvaluationInBasicToken(address projectToken, uint256 amount) public view returns(uint256){
        return uniswapPathFinder.getAssetValuation(basicToken, projectToken, amount);
    }

     function getPrjEvaluationInLendingTokenWithoutSale(address lendingToken, address projectToken, uint256 amountPrj) public view returns(uint256){ 
        uint amoutLendingTokenRaw = uniswapPathFinder.getAssetValuation(lendingToken, projectToken, amountPrj);
        return amoutLendingTokenRaw;
    }

    function getPrjEvaluationInLendingTokenWithSale(address lendingToken, address projectToken, uint256 amountPrj) public view returns(uint256){ 
        PrjSaleInfo storage sale = prjSales[projectToken];
        uint amoutLendingTokenRaw = uniswapPathFinder.getAssetValuation(lendingToken, projectToken, amountPrj);
        uint amoutLendingTokenWithSale = amoutLendingTokenRaw * sale.numerator / sale.denominator;

        return amoutLendingTokenWithSale;
    }

    function getCToken(address underlying) public view returns(address) {
        return cTokensList[underlying];
    }

    function getDepositedPrjAmount(address account, uint256 prjId) public view returns(uint256){
        return userPrjPosition[account][prjId].amountPrjDeposited;
    }

    function getBorrowPosition(address account, uint256 lendingTokenId) public view returns(uint256,uint256){
        UserBorrowPosition storage borrowPosition = userBorrowPosition[account][lendingTokenId];
        return (borrowPosition.amountBorrowed, borrowPosition.amountPit);
    }

    function liquidationThreshold(address account) public view returns(uint256){
        uint256 lt;
        for(uint256 prjId=0; prjId < projectTokens.length; prjId++){
            lt += liquidationThresholdForPosition(account,prjId);
        }
        return lt;
    }

    function liquidationThresholdForPosition(address account, uint256 prjId) public view returns(uint256){
        address tokenPrj = projectTokens[prjId];
        uint8 ltfNumerator = ltf[tokenPrj].numerator;
        uint8 ltfDenominator = ltf[tokenPrj].denominator;
        uint256 pitCurrentBalance = balanceOfPitPosition(account,prjId);
        return pitCurrentBalance * ltfNumerator / ltfDenominator;
    }

    /**
     * @notice returns the amount of PIT of account
     */
    function balanceOfPit(address account) public view returns (uint256){
        uint256 pitBalance;
        for(uint256 prjId = 0; prjId < projectTokens.length; prjId++){
            pitBalance += balanceOfPitPosition(account,prjId);
        }
        return pitBalance;
    }

    /**
     * @notice returns the amount of PIT of account in position `prjId`
     */
    function balanceOfPitPosition(address account, uint256 prjId) public view returns (uint256){
        address tokenPrj = projectTokens[prjId];
        uint8 lvrNumerator = lvr[tokenPrj].numerator;
        uint8 lvrDenominator = lvr[tokenPrj].denominator;
        uint256 prjInPosition = getDepositedPrjAmount(account, prjId);
        uint256 positionEvaluation = uniswapPathFinder.getAssetValuation(basicToken, tokenPrj, prjInPosition);
        return positionEvaluation * lvrNumerator / lvrDenominator;
    }

    function totalSupplyPit() public view virtual returns (uint256) {
        uint256 pitTotalSupply;
        address tokenPrj;
        uint8 lvrNumerator;
        uint8 lvrDenominator;
        uint256 basicTokenEvaluation;
        uint256 totalStaked;
        for(uint256 prjId=0; prjId < projectTokens.length; prjId++){
            tokenPrj = projectTokens[prjId];
            lvrNumerator = lvr[tokenPrj].numerator;
            lvrDenominator = lvr[tokenPrj].denominator;
            totalStaked = totalStakedPrj[tokenPrj];
            basicTokenEvaluation = uniswapPathFinder.getAssetValuation(basicToken, tokenPrj, totalStaked);
            pitTotalSupply += basicTokenEvaluation * lvrNumerator / lvrDenominator;
        }
        return pitTotalSupply;
    }

    //************* HELP FUNCTIONS ********************************

    function _msgSender() internal override(ContextUpgradeable, ERC2771ContextUpgradeable) view returns (address) {
        return ERC2771ContextUpgradeable._msgSender();
    }

    function _msgData() internal override(ContextUpgradeable, ERC2771ContextUpgradeable) view returns (bytes calldata) {
        return ERC2771ContextUpgradeable._msgData();
    }

    //************* ERC UNUSED FUNCTIONS ********************************

    // function approve(address spender, uint256 amount) public virtual override returns (bool) {
    //     spender; amount;
    //     return false;
    // }

    // function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
    //     recipient; amount;
    //     return false;
    // }

    // function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
    //     sender; recipient; amount;
    //     return false;
    // }

    // function increaseAllowance(address spender, uint256 addedValue) public virtual override returns (bool) {
    //     spender; addedValue;
    //     return false;
    // }

    // function decreaseAllowance(address spender, uint256 subtractedValue) public virtual override returns (bool) {
    //     spender; subtractedValue;
    //     return false;
    // }
}