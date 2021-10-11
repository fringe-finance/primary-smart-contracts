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
import "./interfaces/IBPrimaryIndexToken.sol";
import "./interfaces/ISimplePriceOracle.sol";
import "./interfaces/EIP20Interface.sol";
import "./interfaces/IBLendingToken.sol";
import "./interfaces/IComptroller.sol";



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

    IBPrimaryIndexToken public bPrimaryIndexToken;

    ISimplePriceOracle public priceOracle;

    address[] public projectTokens;

    address[] public lendingTokens;

    mapping(address => LvrInfo) public lvr; //prj token address => Lvr (Loan to Value Ratio)
    mapping(address => LtfInfo) public ltf; //prj token address => Ltf (Liquidation Threshold Factor)
    mapping(address => PrjSaleInfo) public prjSales; //prj token address => PRJ sale info
    mapping(address => uint256) public totalStakedPrj; //tokenAddress => PRJ token staked
    mapping(address => mapping(uint256 => UserPrjPosition)) public userPrjPosition; // user address => PRJ token index => UserPrjPosition

    mapping(address => address) public bTokensList; //underlying token address => cToken address
    
    mapping(address => mapping(uint256 => mapping(uint256 => UserBorrowPosition))) public userBorrowPosition; //user address => lending tokens index => project token collateral => UserBorrowPosition
    mapping(address => mapping(uint256 => uint256)) public suppliedLendingToken; // user address => lendingTokenId => amount supplied
    mapping(address => uint256) public indexPrjToken;   //prj address => index of prj in list `projectTokens`
    mapping(address => uint256) public indexLendingToken;//lending token address => index lending token in list `lendingTokens`

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

    event RepayBorrow(address indexed who, uint256 borrowTokenId, address indexed borrowToken, uint256 borrowAmount, address indexed prjAddress, uint256 prjAmount);

    event Liquidate(address indexed liquidator, address indexed borrower, uint lendingTokenId, uint prjId, uint amountPrjLiquidated);

    function init(address _basicToken, address _uniswapPathFinder, address _moderator, address _trustedForwarder) public initializer{
        require(_basicToken != 0xdAC17F958D2ee523a2206206994597C13D831ec7, "_basicToken shouldnt be USDT!");
        basicToken = _basicToken;
        require(this.decimals() >= ERC20Upgradeable(_basicToken).decimals(), "Primary Index Token: basic token should have decimals less than PIT");
        __ERC20_init("Primary Index Token", "PIT");
        __Pausable_init_unchained();
        __AccessControl_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MODERATOR_ROLE, _moderator);
        __ERC2771Context_init_unchained(_trustedForwarder);
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
        indexPrjToken[_tokenPRJ] = projectTokens.length;
        projectTokens.push(_tokenPRJ);
        emit AddPrjToken(_msgSender(), _tokenPRJ);
        _setLvr(_tokenPRJ, _lvrNumerator, _lvrDenominator);
        _setLtf(_tokenPRJ, _ltfNumerator, _ltfDenominator);
        _setPrjSale(_tokenPRJ, _saleNumerator, _saleDenominator);
    }

    function addLendingToken(address _lendingToken) public onlyAdmin{
        require(_lendingToken != address(0),"Primary Index Token: invalid _lendingToken address!");
        indexLendingToken[_lendingToken] = lendingTokens.length;
        lendingTokens.push(_lendingToken);
    }

    function addCLendingToken(address _underlyingToken, address _cToken) public onlyAdmin{
        require(_underlyingToken != address(0),"Primary Index Token: invalid underlying address!");
        require(_cToken != address(0),"Primary Index Token: invalid cToken address!");
        bTokensList[_underlyingToken] = _cToken;
    }

    function setComptroller(address _comptroller) public onlyAdmin{
        comptroller = IComptroller(_comptroller);
    }

     function setCPrimaryIndexToken(address _cPrimaryIndexToken) public onlyAdmin{
        bPrimaryIndexToken = IBPrimaryIndexToken(_cPrimaryIndexToken);
        
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
    
    function withdrawTo(uint256 prjId, uint256 amountPrj, address beneficiar) public {
        require(prjId < projectTokens.length,"Primary Index Token: invalid prjId. ");
        require(amountPrj > 0 && amountPrj <= userPrjPosition[_msgSender()][prjId].amountPrjDeposited, "Primary Index Token: amountPrj should be greated than zero and less equal than position staked!");
        address tokenPrj = projectTokens[prjId];
        bool withdrawerIsBorrower = false;
        uint256 possibleLendingTokenIndexes = 0;

        UserPrjPosition storage msgSenderPrjPosition = userPrjPosition[_msgSender()][prjId];
        for(uint i=0; i < lendingTokens.length; i++){
            UserBorrowPosition storage msgSenderBorrowPosition = userBorrowPosition[_msgSender()][i][prjId];
            if(msgSenderBorrowPosition.amountBorrowed > 0){
                withdrawerIsBorrower = true;
                msgSenderBorrowPosition.amountBorrowed = IBLendingToken(bTokensList[lendingTokens[i]]).borrowBalanceCurrent(_msgSender());
                msgSenderBorrowPosition.amountPit = balanceOfPit(_msgSender());
                //(uint prevNum, uint prevDenom) = healthFactor(_msgSender(), i);
                msgSenderPrjPosition.amountPrjDeposited -= amountPrj;
                (uint newNum, uint newDenom) = healthFactor(_msgSender(), i);
                if(newNum >= newDenom){
                    possibleLendingTokenIndexes++;
                }
            }
        }
        if(!withdrawerIsBorrower){
            msgSenderPrjPosition.amountPrjDeposited -= amountPrj;
            totalStakedPrj[tokenPrj] -= amountPrj;
            IERC20Upgradeable(tokenPrj).safeTransfer(beneficiar, amountPrj);
            emit Withdraw(_msgSender(), prjId, tokenPrj, amountPrj, beneficiar);
            return;
        }
        if(possibleLendingTokenIndexes > 0){
            totalStakedPrj[tokenPrj] -= amountPrj;
            IERC20Upgradeable(tokenPrj).safeTransfer(beneficiar, amountPrj);
            emit Withdraw(_msgSender(), prjId, tokenPrj, amountPrj, beneficiar);

        }else{
            revert("Primary Index Token: the new account health is less than 1 when withdrawing this amount of PRJ");
        }
         
    }

    function supply(uint256 lendingTokenId, uint256 amountLendingToken) public {
        require(lendingTokenId < lendingTokens.length, "Primary Index Token: invalid lendingTokenId!");
        require(amountLendingToken > 0, "Primary Index Token: amountLendingToken should be greated than zero!");
        address lendingToken = lendingTokens[lendingTokenId];
        address bLendingToken = bTokensList[lendingToken];
        
        (uint256 mintError, uint256 mintedAmount) = IBLendingToken(bLendingToken).mintTo(_msgSender(),amountLendingToken);
        require(mintError == 0,"Primary Index Token: supply error: minting btoken is failed!");
        suppliedLendingToken[_msgSender()][lendingTokenId] += amountLendingToken;

        emit Supply(_msgSender(), lendingTokenId, lendingToken, amountLendingToken,bLendingToken,mintedAmount);
    }

    function redeem(uint256 lendingTokenId, uint256 amountBLendingToken) public {
        require(lendingTokenId < lendingTokens.length, "Primary Index Token: invalid lendingTokenId!");
        require(amountBLendingToken > 0, "Primary Index Token: amountLendingToken should be greated than zero!");
        address lendingToken = lendingTokens[lendingTokenId];
        address bLendingToken = bTokensList[lendingToken];
        
        uint256 balanceOfMsgSenderBefore = IERC20Upgradeable(lendingToken).balanceOf(_msgSender());
        (uint redeemError) = IBLendingToken(bLendingToken).redeemTo(_msgSender(), amountBLendingToken);
        require(redeemError == 0,"Primary Index Token: redeemError is not zero!.It may be caused trying to redeem more than user supply.");
        uint256 balanceOfMsgSenderAfter = IERC20Upgradeable(lendingToken).balanceOf(_msgSender());
        suppliedLendingToken[_msgSender()][lendingTokenId] -= (balanceOfMsgSenderAfter - balanceOfMsgSenderBefore);
        emit Redeem(_msgSender(), lendingTokenId, lendingToken, bLendingToken, amountBLendingToken);
    }

    function redeemUnderlying(uint256 lendingTokenId, uint256 amountLendingToken) public {
        require(lendingTokenId < lendingTokens.length, "Primary Index Token: invalid lendingTokenId!");
        require(amountLendingToken > 0, "Primary Index Token: amountLendingToken should be greated than zero!");
        address lendingToken = lendingTokens[lendingTokenId];
        address bLendingToken = bTokensList[lendingToken];

        uint redeemUnderlyingError = IBLendingToken(bLendingToken).redeemUnderlyingTo(_msgSender(), amountLendingToken);
        require(redeemUnderlyingError == 0,"Primary Index Token: redeemUnderlyingError not zero! It may be caused by trying to redeem more than user supply");
        suppliedLendingToken[_msgSender()][lendingTokenId] -= amountLendingToken;


        emit RedeemUnderlying(_msgSender(), lendingTokenId, lendingToken, bLendingToken, amountLendingToken);
    }

    //event Test2(uint currentBalancePitOfMsgSender,uint liquidity,uint shortfall, uint borrowError);

    function borrow(uint256 lendingTokenId, uint256 amountLendingToken, address prj, uint256 prjAmount) public {
        require(lendingTokenId < lendingTokens.length, "Primary Index Token: invalid lendingTokenId!");
        require(amountLendingToken > 0, "Primary Index Token: amountLendingToken should be greated than zero!");
        address lendingToken = lendingTokens[lendingTokenId];
        address bLendingToken = bTokensList[lendingToken];
        uint256 prjId = indexPrjToken[prj];
        UserBorrowPosition storage borrowPosition = userBorrowPosition[_msgSender()][lendingTokenId][prjId];
        if(borrowPosition.amountBorrowed == 0){
            uint enterMarketError = comptroller.enterMarket(address(bPrimaryIndexToken), _msgSender());
            require(enterMarketError == 0,"Primary Index Token: enterMarket error!");
            uint currentBalancePitOfMsgSender = balanceOfPitPosition(_msgSender(), prjId);
          
            _mint(_msgSender(), currentBalancePitOfMsgSender);
            _approve(_msgSender(),address(bPrimaryIndexToken), currentBalancePitOfMsgSender);
            bPrimaryIndexToken.mintTo(_msgSender(),currentBalancePitOfMsgSender);
            //(,uint liquidity,uint shortfall) = comptroller.getAccountLiquidity(_msgSender());
            
            uint borrowError = IBLendingToken(bLendingToken).borrowTo(_msgSender(), amountLendingToken);
            //emit Test2(currentBalancePitOfMsgSender,liquidity,shortfall,borrowError);
            require(borrowError == 0,"Primary Index Token: borrow error. It may be causes by trying to borrow more than PIT balance in borrowPosition.");

            borrowPosition.amountBorrowed = amountLendingToken;
            borrowPosition.amountPit = currentBalancePitOfMsgSender;
        }
        else{
            uint borrowError = IBLendingToken(bLendingToken).borrowTo(_msgSender(), amountLendingToken);
            require(borrowError == 0,"Primary Index Token: borrow error");
          
            borrowPosition.amountBorrowed = IBLendingToken(bLendingToken).borrowBalanceCurrent(_msgSender());
            borrowPosition.amountPit = balanceOfPitPosition(_msgSender(), prjId);
        }

        emit Borrow(_msgSender(),lendingTokenId, lendingToken, amountLendingToken,prj,prjAmount);
    }

    function repayBorrow(uint256 lendingTokenId, uint256 amountLendingToken, address prj,uint256 prjAmount) public {
        require(lendingTokenId < lendingTokens.length, "Primary Index Token: invalid lendingTokenId!");
        require(amountLendingToken > 0, "Primary Index Token: amountLendingToken should be greated than zero!");
        address lendingToken = lendingTokens[lendingTokenId];
        address bLendingToken = bTokensList[lendingToken];
        uint256 projectTokenId = indexPrjToken[prj];

        if(amountLendingToken == ((2 ** 256) - 1)){
            //repay for all positions
            (uint repayBorrowError, uint amountRepayed)  = IBLendingToken(bLendingToken).repayBorrowTo(_msgSender(), amountLendingToken);
            require(repayBorrowError == 0,"Primary Index Token: repayBorrowError not zero!");
            require(amountRepayed > 0,"Primary Index Token: amount repayed should be greater than zero!");
            
            for(uint256 prjId = 0; prjId < projectTokens.length;prjId++){
                UserBorrowPosition storage borrowPosition = userBorrowPosition[_msgSender()][lendingTokenId][prjId];
                borrowPosition.amountBorrowed = 0;
                borrowPosition.amountPit = 0;
            }
            return;
        }

        UserBorrowPosition storage msgSenderBorrowPosition = userBorrowPosition[_msgSender()][lendingTokenId][projectTokenId];
        uint256 borrowedPositions = 0;
        uint256 cumulativeBorrowBalance = 0;
        for(uint256 prjId = 0; prjId < projectTokens.length;prjId++){
            UserBorrowPosition storage borrowPosition = userBorrowPosition[_msgSender()][lendingTokenId][prjId];
            if(borrowPosition.amountBorrowed > 0){
                cumulativeBorrowBalance += borrowPosition.amountBorrowed;
                borrowedPositions++;
            }
        }
        uint256 currentBorrowBalance = IBLendingToken(bLendingToken).borrowBalanceCurrent(_msgSender());
        uint256 estimateInterest = (currentBorrowBalance - cumulativeBorrowBalance) / borrowedPositions;
        if(amountLendingToken == ((2 ** 256) - 2)){
            if(borrowedPositions == 1){
                //if user has 1 position, than repay all.
                (uint repayBorrowError, uint amountRepayed)  = IBLendingToken(bLendingToken).repayBorrowTo(_msgSender(), (2 ** 256) - 1);
                require(repayBorrowError == 0,"Primary Index Token: repayBorrowError not zero!");
                require(amountRepayed > 0,"Primary Index Token: amount repayed should be greater than zero!");
                msgSenderBorrowPosition.amountBorrowed = 0;
                msgSenderBorrowPosition.amountPit = 0;
            }else{
                //else repay only for one prj position
                uint amountLendingTokenToRepay = msgSenderBorrowPosition.amountBorrowed + estimateInterest;
                (uint repayBorrowError, uint amountRepayed)  = IBLendingToken(bLendingToken).repayBorrowTo(_msgSender(), amountLendingTokenToRepay);
                require(repayBorrowError == 0,"Primary Index Token: repayBorrowError not zero!");
                require(amountRepayed > 0,"Primary Index Token: amount repayed should be greater than zero!");
                msgSenderBorrowPosition.amountBorrowed = 0;
                msgSenderBorrowPosition.amountPit = 0;
            }
        }else{
            require(amountLendingToken <= msgSenderBorrowPosition.amountBorrowed);
            (uint repayBorrowError, uint amountRepayed)  = IBLendingToken(bLendingToken).repayBorrowTo(_msgSender(), amountLendingToken);
            require(repayBorrowError == 0,"Primary Index Token: repayBorrowError not zero!");
            require(amountRepayed > 0,"Primary Index Token: amount repayed should be greater than zero!");
            
            msgSenderBorrowPosition.amountBorrowed = msgSenderBorrowPosition.amountBorrowed - amountLendingToken + estimateInterest;
            msgSenderBorrowPosition.amountPit = balanceOfPitPosition(_msgSender(),projectTokenId);
            
        }
        
        emit RepayBorrow(_msgSender(), lendingTokenId, lendingToken, amountLendingToken, prj, prjAmount);
    }

    
    function liquidate(address user, uint lendingTokenId, uint prjId) public {
        require(prjId < projectTokens.length, "Primary Index Token: invalid lendingTokenId!");
        address lendingToken = lendingTokens[lendingTokenId];
        address bLendingToken = bTokensList[lendingToken];
        address projectToken = projectTokens[prjId];

        UserBorrowPosition storage borrowPosition = userBorrowPosition[user][lendingTokenId][prjId];
        if(borrowPosition.amountBorrowed == 0){
            revert("Primary Index Token:  no position to liquidate.");
        }

        borrowPosition.amountBorrowed = IBLendingToken(bLendingToken).borrowBalanceCurrent(user);
        
        (uint hf_numerator, uint hf_denominator) = healthFactorForPosition(user, lendingTokenId, prjId);

        if (hf_numerator >= hf_denominator){
            revert("Primary Index Token: health factor bigger than 1. Liquidation is forbidden by this condition.");
        }else{
            UserPrjPosition storage prjPosition = userPrjPosition[user][prjId];
            
            //require(amountPrj <= prjPosition.amountPrjDeposited,"Primary Index Token: amountPrj exeeded deposited balance");
            uint prjDeposited = prjPosition.amountPrjDeposited;
            uint amoutLendingTokenToReceive = getPrjEvaluationInLendingTokenWithSale(lendingToken, projectToken, prjDeposited);
            IERC20Upgradeable(lendingToken).safeTransferFrom(_msgSender(),address(this), amoutLendingTokenToReceive);
            
            IERC20Upgradeable(lendingToken).approve(bLendingToken,amoutLendingTokenToReceive);
            (, uint256 mintedAmount) = IBLendingToken(bLendingToken).mintTo(address(this),amoutLendingTokenToReceive);
            require(mintedAmount > 0,"Primary Index Token: minted amount should be non zero!");

            IERC20Upgradeable(projectToken).safeTransfer(_msgSender(),prjDeposited);
            prjPosition.amountPrjDeposited -= prjDeposited;
            borrowPosition.amountBorrowed = 0;
            borrowPosition.amountPit = 0;

            emit Liquidate(_msgSender(),user,lendingTokenId,prjId,prjDeposited);
        }

    }

    //************* VIEW FUNCTIONS ********************************

    function healthFactor(address account,uint256 lendingTokenId) public view returns(uint256 numerator, uint256 denominator){
        uint256 lt = liquidationThreshold(account);
        uint256 borrowedLendingToken;
        for(uint256 prjId = 0; prjId < projectTokens.length; prjId++){
            borrowedLendingToken += userBorrowPosition[account][lendingTokenId][prjId].amountBorrowed;
        }
        return (lt, borrowedLendingToken);
    }

    function healthFactorForPosition(address account,uint256 lendingTokenId,uint prjId) public view returns(uint256 numerator, uint256 denominator){
        uint256 lt = liquidationThresholdForPosition(account, prjId);
        uint256 borrowedLendingToken = userBorrowPosition[account][lendingTokenId][prjId].amountBorrowed;
        return (lt,borrowedLendingToken);
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
        return bTokensList[underlying];
    }

    function getDepositedPrjAmount(address account, uint256 prjId) public view returns(uint256){
        return userPrjPosition[account][prjId].amountPrjDeposited;
    }

    function getBorrowPosition(address account, uint256 lendingTokenId, uint256 prjId) public view returns(uint256,uint256){
        UserBorrowPosition storage borrowPosition = userBorrowPosition[account][lendingTokenId][prjId];
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
     * @notice returns the amount of PIT of account in position `prjId`
     */
    function balanceOfPitPosition(address account, uint256 prjId) public view returns (uint256){
        address tokenPrj = projectTokens[prjId];
        uint8 lvrNumerator = lvr[tokenPrj].numerator;
        uint8 lvrDenominator = lvr[tokenPrj].denominator;
        uint256 prjInPosition = getDepositedPrjAmount(account, prjId);
        (uint reserve1, uint256 reserve2) = getUniswapReserves(projectTokens[prjId]);
        uint256 positionEvaluation = prjInPosition * reserve1 / reserve2;//uniswapPathFinder.getAssetValuation(basicToken, tokenPrj, prjInPosition);
        return positionEvaluation * lvrNumerator / lvrDenominator;
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
     * @notice return the pitBalance depending on input prj indexes
     */
    function balanceOfPitDependingOnPrj(address account, uint256[] memory prjIndexes) public view returns(uint256){
        uint256 prjIndexesLength = prjIndexes.length;
        require(prjIndexesLength <= projectTokens.length,"Invalid length of prj Indexes");
        uint256 pitBalance;
        for(uint256 i = 0; i < prjIndexesLength; i++){
            pitBalance += balanceOfPitPosition(account,prjIndexes[i]);
        }
        return pitBalance;
    }

    function getUniswapReserves(address prj) public view returns(uint reserve1,uint reserve2){
        address factory = uniswapPathFinder.uniswapFactory();
        (reserve1, reserve2) = uniswapPathFinder.getReserves(factory, basicToken, prj);
        return (reserve1, reserve2);
    }

    function totalSupplyPit() public view virtual returns (uint256) {
        uint256 pitTotalSupply;
        address tokenPrj;
        uint8 lvrNumerator;
        uint8 lvrDenominator;
        uint256 basicTokenEvaluation;
        uint256 totalStaked;
        uint256 reserve1;
        uint256 reserve2;
        for(uint256 prjId=0; prjId < projectTokens.length; prjId++){
            tokenPrj = projectTokens[prjId];
            lvrNumerator = lvr[tokenPrj].numerator;
            lvrDenominator = lvr[tokenPrj].denominator;
            totalStaked = totalStakedPrj[tokenPrj];
            (reserve1,reserve2) = getUniswapReserves(projectTokens[prjId]);
            basicTokenEvaluation = totalStaked * reserve1 / reserve2;//uniswapPathFinder.getAssetValuation(basicToken, tokenPrj, totalStaked);
            pitTotalSupply += basicTokenEvaluation * lvrNumerator / lvrDenominator;
        }
        return pitTotalSupply;
    }

    function projectTokensLength() public view returns(uint256){
        return projectTokens.length;
    }

    function lendingTokensLength() public view returns(uint256){
        return lendingTokens.length;
    }

    function decimals() public override view returns(uint8){
        return EIP20Interface(basicToken).decimals();
    }

    //************* HELP FUNCTIONS ********************************

    function _msgSender() internal override(ContextUpgradeable, ERC2771ContextUpgradeable) view returns (address) {
        return ERC2771ContextUpgradeable._msgSender();
    }

    function _msgData() internal override(ContextUpgradeable, ERC2771ContextUpgradeable) view returns (bytes calldata) {
        return ERC2771ContextUpgradeable._msgData();
    }

    //************* ERC20 FUNCTIONS ********************************

   
}