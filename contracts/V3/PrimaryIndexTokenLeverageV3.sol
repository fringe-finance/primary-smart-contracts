// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../AtomicRepayment/paraswap/interfaces/IParaSwapAugustus.sol";
import "../AtomicRepayment/paraswap/interfaces/IParaSwapAugustusRegistry.sol";
import "../openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/V3/IPrimaryIndexTokenV3.sol";
import "../interfaces/V3/IPrimaryIndexTokenAtomicRepaymentV3.sol";

contract PrimaryIndexTokenLeverageV3 is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    uint constant decimalPercent = 1000;
    IPrimaryIndexTokenV3 public primaryIndexToken;
    IPrimaryIndexTokenAtomicRepaymentV3 public pitAtomicRepayment;
    address public augustusParaswap;
    address public AUGUSTUS_REGISTRY;

    mapping(address => PositionData[]) public positionData;
    mapping(address => uint256) public maxTotalLongAssetCount;
    mapping(address => uint256) public currentTotalLongAssetCount;
    mapping(address => uint256) public maxTotalShotAssetCount;
    mapping(address => uint256) public currentShotAssetCount;

    struct Ratio {
        uint8 numerator;
        uint8 denominator;
    }

    struct PositionData {
        uint256 positionId;
        address longAsset;
        address shortAsset;
        uint256 longCount;
        uint256 shortCount;
        LeverageType leverageType;
    }

    enum LeverageType {
        AMPLIFY,
        MARGIN_TRADE
    }

    event LeveragedBorrow(
        address indexed user,
        address projectToken,
        address lendingToken,
        uint notionalExposure,
        uint lendingAmount,
        uint margin,
        uint addingAmount,
        uint totalDepositedAmount,
        uint amountRecive
    );
    event SetPrimaryIndexToken(
        address indexed oldPrimaryIndexToken,
        address indexed newPrimaryIndexToken
    );
    event SetAugustusParaswap(
        address indexed augustusParaswap,
        address indexed augustusRegistry
    );

    /**
     * @notice Initializes the contract with the given parameters.
     * @dev This function is called only once when deploying the contract.
     * @param _pit The address of the primary index token contract.
     * @param _augustusParaswap The address of the ParaSwap Augustus contract.
     * @param _AUGUSTUS_REGISTRY The address of the ParaSwap Augustus registry contract.
     */
    function initialize(
        address _pit,
        address _pitAtomicRepayment,
        address _augustusParaswap,
        address _AUGUSTUS_REGISTRY
    ) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        primaryIndexToken = IPrimaryIndexTokenV3(_pit);
        pitAtomicRepayment = IPrimaryIndexTokenAtomicRepaymentV3(
            _pitAtomicRepayment
        );
        augustusParaswap = _augustusParaswap;
        AUGUSTUS_REGISTRY = _AUGUSTUS_REGISTRY;
    }

    modifier onlyAdmin() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "PITLeverage: Caller is not the Admin"
        );
        _;
    }

    modifier onlyModerator() {
        require(
            hasRole(MODERATOR_ROLE, msg.sender),
            "PITLeverage: Caller is not the Moderator"
        );
        _;
    }

    modifier isProjectTokenListed(address _projectToken) {
        require(
            primaryIndexToken.projectTokenInfo(_projectToken).isListed,
            "PITLeverage: project token is not listed"
        );
        _;
    }

    modifier isLendingTokenListed(address _lendingToken) {
        require(
            primaryIndexToken.lendingTokenInfo(_lendingToken).isListed,
            "PITLeverage: lending token is not listed"
        );
        _;
    }

    modifier isPrimaryIndexToken() {
        require(
            msg.sender == address(primaryIndexToken),
            "PITLeverage: caller is not primaryIndexToken"
        );
        _;
    }

    modifier onlyRelatedContracts() {
        require(
            primaryIndexToken.getRelatedContract(msg.sender),
            "PITLeverage: caller is not related Contract"
        );
        _;
    }

    /**
     * @notice Updates the primary index token contract address.
     * @dev Only a moderator can call this function.
     * @param _newPrimaryIndexToken The new address of the primary index token contract.
     */
    function setPrimaryIndexTokenAddress(
        address _newPrimaryIndexToken
    ) external onlyModerator {
        require(
            _newPrimaryIndexToken != address(0),
            "PITLeverage: invalid address"
        );
        emit SetPrimaryIndexToken(
            address(primaryIndexToken),
            _newPrimaryIndexToken
        );
        primaryIndexToken = IPrimaryIndexTokenV3(_newPrimaryIndexToken);
    }

    /**
     * @notice Updates the ParaSwap Augustus contract and registry contract addresses.
     * @dev Only a moderator can call this function.
     * @param augustusParaswap_ The new address of the ParaSwap Augustus contract.
     * @param AUGUSTUS_REGISTRY_ The new address of the ParaSwap Augustus registry contract.
     */
    function setAugustusParaswap(
        address augustusParaswap_,
        address AUGUSTUS_REGISTRY_
    ) public onlyModerator {
        require(
            augustusParaswap_ != address(0) && AUGUSTUS_REGISTRY_ != address(0),
            "PITLeverage: invalid address"
        );
        augustusParaswap = augustusParaswap_;
        AUGUSTUS_REGISTRY = AUGUSTUS_REGISTRY_;
        emit SetAugustusParaswap(augustusParaswap_, AUGUSTUS_REGISTRY_);
    }

    /**
     * @notice Retrieves the price of the given token in USD.
     * @param token The address of the token to retrieve the price for.
     * @return price The price of the token in USD.
     */
    function getTokenPrice(address token) public view returns (uint price) {
        uint tokenMultiplier = 10 ** ERC20Upgradeable(token).decimals();
        price = primaryIndexToken.getTokenEvaluation(token, tokenMultiplier);
    }

    /**
     * @notice Checks if the given margin, exposure, and LVR values form a valid collateralization.
     * @param margin The margin amount.
     * @param exp The exposure amount.
     * @param lvrNumerator The numerator of the loan-to-value ratio.
     * @param lvrDenominator The denominator of the loan-to-value ratio.
     * @return isValid True if the collateralization is valid, false otherwise.
     */
    function isValidCollateralization(
        uint margin,
        uint exp,
        uint lvrNumerator,
        uint lvrDenominator
    ) public pure returns (bool isValid) {
        uint ratioNumerator = (margin + exp) * lvrNumerator;
        uint ratioDenominator = exp * lvrDenominator;
        isValid = ratioNumerator > ratioDenominator ? true : false;
    }

    /**
     * @notice Calculates the lending token count for a given notional value.
     * @param _lendingToken The address of the lending token.
     * @param notionalValue The notional value for which the lending token count is to be calculated.
     * @return lendingTokenCount The calculated lending token count.
     */
    function calculateLendingTokenCount(
        address _lendingToken,
        uint notionalValue
    ) public view returns (uint lendingTokenCount) {
        lendingTokenCount =
            (notionalValue * 10 ** ERC20Upgradeable(_lendingToken).decimals()) /
            getTokenPrice(_lendingToken);
    }

    /**
     * @notice Calculates the health factor numerator and denominator based on the given parameters.
     * @param expAmount The exposure amount.
     * @param margin The margin amount.
     * @param borrowAmount The borrowed amount.
     * @param lvrNumerator The numerator of the loan-to-value ratio.
     * @param lvrDenominator The denominator of the loan-to-value ratio.
     * @return hfNumerator The calculated health factor numerator.
     * @return hfDenominator The calculated health factor denominator.
     */
    function calculateHF(
        uint expAmount,
        uint margin,
        uint borrowAmount,
        uint lvrNumerator,
        uint lvrDenominator
    ) public pure returns (uint hfNumerator, uint hfDenominator) {
        hfNumerator = (expAmount + margin) * lvrNumerator;
        hfDenominator = borrowAmount * lvrDenominator;
    }

    /**
     * @notice Calculates the margin amount for a given position and safety margin.
     * Margin = ((Notional / LVR) * (1 + SafetyMargin)) - Notional
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @param safetyMarginNumerator The numerator of the safety margin ratio.
     * @param safetyMarginDenominator The denominator of the safety margin ratio.
     * @param expAmount The exposure amount.
     * @return marginAmount The calculated margin amount.
     */
    function calculateMargin(
        address projectToken,
        address lendingToken,
        uint safetyMarginNumerator,
        uint safetyMarginDenominator,
        uint expAmount
    ) public view returns (uint marginAmount) {
        (uint256 lvrNumerator, uint256 lvrDenominator) = primaryIndexToken
            .getLoanToValueRatio(projectToken, lendingToken);
        uint margin = ((expAmount *
            (lvrDenominator *
                (safetyMarginDenominator + safetyMarginNumerator) -
                lvrNumerator *
                safetyMarginDenominator)) /
            (lvrNumerator * safetyMarginDenominator));
        marginAmount =
            (margin * 10 ** ERC20Upgradeable(projectToken).decimals()) /
            getTokenPrice(projectToken);
    }

    /**
     * @notice Calculates the safety margin numerator and denominator for a given position, margin, and exposure.
     * Safety Margin = ((Margin + Notional) / (Notional / LVR)) - 1
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @param margin The margin amount.
     * @param exp The exposure amount.
     * @return safetyMarginNumerator The calculated safety margin numerator.
     * @return safetyMarginDenominator The calculated safety margin denominator.
     */
    function calculateSafetyMargin(
        address projectToken,
        address lendingToken,
        uint margin,
        uint exp
    )
        public
        view
        returns (uint safetyMarginNumerator, uint safetyMarginDenominator)
    {
        (uint256 lvrNumerator, uint256 lvrDenominator) = primaryIndexToken
            .getLoanToValueRatio(projectToken, lendingToken);
        uint marginPrice = primaryIndexToken.getTokenEvaluation(
            projectToken,
            margin
        );
        safetyMarginNumerator =
            (marginPrice + exp) *
            lvrNumerator -
            exp *
            lvrDenominator;
        safetyMarginDenominator = (exp * lvrDenominator);
    }

    /**
     * @notice Defers the liquidity check for a given user, project token, and lending token.
     * @param user The address of the user.
     * @param lendingToken The address of the lending token.
     */
    function _deferLiquidityCheck(
        address user,
        address lendingToken
    ) internal view {
        uint totalPit = primaryIndexToken.totalPIT(user);
        uint totalOutstandingInUSD = primaryIndexToken.totalOutstandingInUSD(
            user
        );
        require(
            totalOutstandingInUSD <= totalPit,
            "PITLeverage: lendingTokenAmount exceeds pit remaining"
        );

        uint newTotalBorrowPerLendingToken = primaryIndexToken
            .getBorrowedPerLendingTokenInUSD(lendingToken);
        uint borrowLimitPerLendingToken = primaryIndexToken
            .borrowLimitPerLendingToken(lendingToken);

        require(
            newTotalBorrowPerLendingToken <= borrowLimitPerLendingToken,
            "PITLeverage: totalBorrow exceeded borrowLimit per lending asset"
        );
    }

    /**
     * @notice Performs a naked borrow operation for a user with the given lending token and amount.
     * @param user The address of the user.
     * @param lendingToken The address of the lending token.
     * @param lendingTokenAmount The amount of lending token to be borrowed.
     */
    function _nakedBorrow(
        address user,
        address lendingToken,
        uint lendingTokenAmount
    ) internal {
        primaryIndexToken.updateInterestInAllBorrowPositions(user);

        primaryIndexToken.calcBorrowPosition(
            user,
            lendingToken,
            lendingTokenAmount
        );
        ERC20Upgradeable(lendingToken).safeTransferFrom(
            user,
            address(this),
            lendingTokenAmount
        );
    }

    /**
     * @notice Buys tokens on ParaSwap and returns the received amount.
     * @param tokenTo The address of the token to buy.
     * @param _target The target address for the ParaSwap operation.
     * @param buyCalldata The calldata required for the ParaSwap operation.
     * @return amountRecive The amount of tokens received after the ParaSwap operation.
     */
    function _buyOnParaSwap(
        address tokenTo,
        address _target,
        bytes memory buyCalldata
    ) internal returns (uint amountRecive) {
        uint beforeBalanceTo = ERC20Upgradeable(tokenTo).balanceOf(
            address(this)
        );
        // solium-disable-next-line security/no-call-value
        (bool success, ) = _target.call(buyCalldata);
        if (!success) {
            // Copy revert reason from call
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
        uint afterBalanceTo = ERC20Upgradeable(tokenTo).balanceOf(
            address(this)
        );
        amountRecive = afterBalanceTo - beforeBalanceTo;
    }

    /**
     * @notice Approves a specified amount of tokens to be transferred by the token transfer proxy.
     * @param token The address of the ERC20 token to be approved.
     * @param tokenTransferProxy The address of the token transfer proxy.
     * @param tokenAmount The amount of tokens to be approved for transfer.
     */
    function _approve(
        address token,
        address tokenTransferProxy,
        uint tokenAmount
    ) internal {
        if (
            ERC20Upgradeable(token).allowance(
                address(this),
                tokenTransferProxy
            ) <= tokenAmount
        ) {
            ERC20Upgradeable(token).safeApprove(
                tokenTransferProxy,
                type(uint256).max
            );
        }
    }

    /**
     * @notice Collateralize a loan with the specified parameters.
     * @param user The address of the user taking the loan.
     * @param projectToken The address of the project token to be collateralize.
     * @param collateralTokenCount The amount of collateral tokens being provided.
     * @param marginCollateralCount The margin collateral amount.
     * @return totalCollateral The total amount of collateral tokens.
     * @return addingAmount The additional collateral amount needed.
     */
    function _collateralizeLoan(
        address user,
        address projectToken,
        uint collateralTokenCount,
        uint marginCollateralCount
    ) internal returns (uint totalCollateral, uint addingAmount) {
        addingAmount = calculateAddingAmount(
            user,
            projectToken,
            marginCollateralCount
        );
        totalCollateral = collateralTokenCount + addingAmount;
        primaryIndexToken.calcDepositPosition(
            projectToken,
            totalCollateral,
            user
        );
        ERC20Upgradeable(projectToken).safeTransfer(
            address(primaryIndexToken),
            collateralTokenCount
        );
        if (addingAmount > 0) {
            ERC20Upgradeable(projectToken).safeTransferFrom(
                user,
                address(primaryIndexToken),
                addingAmount
            );
        }
    }

    /**
     * @notice Calculates the additional collateral amount needed for the specified user and project token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @param marginCollateralCount The margin collateral amount.
     * @return addingAmount The additional collateral amount needed.
     */
    function calculateAddingAmount(
        address user,
        address projectToken,
        uint marginCollateralCount
    ) public view returns (uint256 addingAmount) {
        uint depositedAmount = primaryIndexToken.depositedAmount(
            user,
            projectToken
        );
        addingAmount = marginCollateralCount > depositedAmount
            ? marginCollateralCount - depositedAmount
            : 0;
    }

    /**
     * @notice Checks if the specified user has a valid position for the given project and lending tokens.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @param notionalExposure The margin collateral amount.
     */
    function _checkIsValidPosition(
        address user,
        address projectToken,
        uint256 notionalExposure
    ) internal view {
        IPrimaryIndexTokenV3.Ratio memory lvrProjectToken = primaryIndexToken
            .projectTokenInfo(projectToken)
            .loanToValueRatio;
        uint256 collaterallPIT = (notionalExposure *
            lvrProjectToken.numerator) / lvrProjectToken.denominator;
        uint256 totalPitRemaining = primaryIndexToken.totalPITRemaining(user);
        require(
            totalPitRemaining + collaterallPIT >= notionalExposure,
            "Leverage: not enough total pit remaing"
        );
    }

    /**
     * @notice Executes a leveraged borrow operation for the specified project token, lending token, and notional exposure.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @param notionalExposure The notional exposure for the borrow operation.
     * @param marginCollateralAmount The amount of collateral to be deposited by the user.
     * @param buyCalldata The calldata used for buying the project token on the DEX.
     */
    function leveragedBorrow(
        address projectToken,
        address lendingToken,
        uint notionalExposure,
        uint marginCollateralAmount,
        bytes memory buyCalldata,
        uint8 leverageType
    ) public nonReentrant {
        _leveragedBorrow(
            projectToken,
            lendingToken,
            notionalExposure,
            marginCollateralAmount,
            buyCalldata,
            msg.sender,
            leverageType
        );
    }

    /**
     * @dev Allows a related contract to borrow funds on behalf of a user to enter a leveraged position.
     * @param projectToken The address of the project token the user wants to invest in.
     * @param lendingToken The address of the lending token used for collateral.
     * @param notionalExposure The notional exposure of the user's investment.
     * @param marginCollateralAmount The amount of collateral to be deposited by the user.
     * @param buyCalldata The calldata used for buying the project token on the DEX.
     * @param borrower The address of the user for whom the funds are being borrowed.
     */
    function leveragedBorrowFromRelatedContract(
        address projectToken,
        address lendingToken,
        uint notionalExposure,
        uint marginCollateralAmount,
        bytes memory buyCalldata,
        address borrower,
        uint8 leverageType
    ) public nonReentrant onlyRelatedContracts {
        _leveragedBorrow(
            projectToken,
            lendingToken,
            notionalExposure,
            marginCollateralAmount,
            buyCalldata,
            borrower,
            leverageType
        );
    }

    /**
     * @notice Executes a leveraged borrow for the borrower on the specified projectToken using the given lendingToken.
     * @dev This function checks for a valid lending token, a valid Augustus address, calculates the lendingTokenCount, and performs a naked borrow.
     * It also approves the token transfer proxy, buys tokens on ParaSwap, collateralize the loan, and defers liquidity check.
     * Finally, it emits a LeveragedBorrow event.
     * @param projectToken The address of the token being borrowed.
     * @param lendingToken The address of the token being used as collateral.
     * @param notionalExposure The desired notional exposure for the leverage position.
     * @param marginCollateralAmount The amount of collateral to be added to the position as margin.
     * @param buyCalldata The calldata for the ParaSwap buy operation.
     * @param borrower The address of the borrower who's creating the leverage position.
     */
    function _leveragedBorrow(
        address projectToken,
        address lendingToken,
        uint notionalExposure,
        uint marginCollateralAmount,
        bytes memory buyCalldata,
        address borrower,
        uint8 leverageType
    ) internal {
        require(
            IParaSwapAugustusRegistry(AUGUSTUS_REGISTRY).isValidAugustus(
                augustusParaswap
            ),
            "PITLeverage: INVALID_AUGUSTUS"
        );
        _checkIsValidPosition(borrower, projectToken, notionalExposure);

        uint lendingTokenCount = calculateLendingTokenCount(
            lendingToken,
            notionalExposure
        );

        address tokenTransferProxy = IParaSwapAugustus(augustusParaswap)
            .getTokenTransferProxy();

        _nakedBorrow(borrower, lendingToken, lendingTokenCount);

        _approve(lendingToken, tokenTransferProxy, lendingTokenCount);

        uint amountRecive = _buyOnParaSwap(
            projectToken,
            augustusParaswap,
            buyCalldata
        );

        {
            PositionData[] storage _positionDatas = positionData[borrower];
            PositionData memory _positionData = PositionData({
                positionId: _positionDatas.length,
                longAsset: projectToken,
                shortAsset: lendingToken,
                longCount: amountRecive,
                shortCount: lendingTokenCount,
                leverageType: LeverageType(leverageType)
            });

            currentTotalLongAssetCount[projectToken] += amountRecive;
            maxTotalLongAssetCount[projectToken] = currentTotalLongAssetCount[
                projectToken
            ];
            currentShotAssetCount[lendingToken] += lendingTokenCount;
            maxTotalShotAssetCount[lendingToken] = currentShotAssetCount[
                lendingToken
            ];
            _positionDatas.push(_positionData);
        }

        (uint totalCollateral, uint addingAmount) = _collateralizeLoan(
            borrower,
            projectToken,
            amountRecive,
            marginCollateralAmount
        );

        _deferLiquidityCheck(borrower, lendingToken);

        emit LeveragedBorrow(
            borrower,
            projectToken,
            lendingToken,
            notionalExposure,
            lendingTokenCount,
            marginCollateralAmount,
            addingAmount,
            totalCollateral,
            amountRecive
        );
    }

    // /**
    //  * @notice Get type of Leverage Position for given borrower and projectToken.
    //  * @param borrower The address of the borrower who's creating the leverage position
    //  * @param projectToken The address of the token being used as collateral.
    //  * @return type of leverage position or max of uint8 if leverage position is not exist.
    //  */
    // function getLeverageType(
    //     address borrower,
    //     address projectToken
    // ) public view returns (uint8) {
    //     if (isLeveragePosition[borrower][projectToken])
    //         return uint8(typeOfLeveragePosition[borrower][projectToken]);
    //     return type(uint8).max;
    // }

    //withdrawn check
    function reduceDepositedLongAsset(
        address account,
        address projectToken
    ) external isPrimaryIndexToken {
        uint256 remainingDepositedCount = primaryIndexToken.depositedAmount(
            account,
            projectToken
        );
        uint256 totalLongAssetCountOfProjectToken = currentTotalLongAssetCount[
            projectToken
        ];
        if (remainingDepositedCount < totalLongAssetCountOfProjectToken) {
            currentTotalLongAssetCount[projectToken] = remainingDepositedCount;
            PositionData[] storage _positionDatas = positionData[account];
            for (uint256 i = 0; i < _positionDatas.length; i++) {
                PositionData storage _positionData = _positionDatas[i];
                if (_positionData.longAsset == projectToken) {
                    _positionData.longCount =
                        (_positionData.longCount * remainingDepositedCount) /
                        totalLongAssetCountOfProjectToken;
                }
            }
        }
    }

    //deposited check
    function addDepositedLongAsset(
        address account,
        address projectToken
    ) external isPrimaryIndexToken {
        uint256 remainingDepositedCount = primaryIndexToken.depositedAmount(
            account,
            projectToken
        );
        uint256 currentLongAssetCountOfProjectToken = currentTotalLongAssetCount[
                projectToken
            ];
        uint256 maxLongAssetCountOfProjectToken = maxTotalLongAssetCount[
            projectToken
        ];
        if (
            currentLongAssetCountOfProjectToken ==
            maxLongAssetCountOfProjectToken
        ) return;

        if (remainingDepositedCount > maxLongAssetCountOfProjectToken) {
            remainingDepositedCount = maxLongAssetCountOfProjectToken;
        }
        PositionData[] storage _positionDatas = positionData[account];
        currentTotalLongAssetCount[projectToken] = remainingDepositedCount;
        for (uint256 i = 0; i < _positionDatas.length; i++) {
            PositionData storage _positionData = _positionDatas[i];
            if (_positionData.longAsset == projectToken) {
                _positionData.longCount =
                    (_positionData.longCount * remainingDepositedCount) /
                    currentLongAssetCountOfProjectToken;
            }
        }
    }

    //repay check
    function reduceShotAsset(
        address account,
        address lendingToken
    ) external isPrimaryIndexToken {
        IPrimaryIndexTokenV3.BorrowPosition
            memory borrowPosition = primaryIndexToken.borrowPosition(
                account,
                lendingToken
            );
        uint256 totalBorrowCount = borrowPosition.loanBody;
        uint256 totalShotAssetCountOfLendingToken = currentShotAssetCount[
            lendingToken
        ];
        if (totalBorrowCount < totalShotAssetCountOfLendingToken) {
            currentShotAssetCount[lendingToken] = totalBorrowCount;
            PositionData[] storage _positionDatas = positionData[account];
            for (uint256 i = 0; i < _positionDatas.length; i++) {
                PositionData storage _positionData = _positionDatas[i];
                if (_positionData.shortAsset == lendingToken) {
                    _positionData.shortCount =
                        (_positionData.shortCount * totalBorrowCount) /
                        totalShotAssetCountOfLendingToken;
                }
            }
        }
    }

    function addShotAsset(
        address account,
        address lendingToken
    ) external isPrimaryIndexToken {
        IPrimaryIndexTokenV3.BorrowPosition
            memory borrowPosition = primaryIndexToken.borrowPosition(
                account,
                lendingToken
            );
        uint256 totalBorrowCount = borrowPosition.loanBody;
        uint256 currentShotAssetCountOfLendingToken = currentShotAssetCount[
            lendingToken
        ];
        uint256 maxShortAssetCountOfLendingToken = maxTotalShotAssetCount[
            lendingToken
        ];
        if (
            currentShotAssetCountOfLendingToken ==
            maxShortAssetCountOfLendingToken
        ) return;

        if (totalBorrowCount > maxShortAssetCountOfLendingToken) {
            totalBorrowCount = maxShortAssetCountOfLendingToken;
        }
        currentShotAssetCount[lendingToken] = totalBorrowCount;
        PositionData[] storage _positionDatas = positionData[account];
        for (uint256 i = 0; i < _positionDatas.length; i++) {
            PositionData storage _positionData = _positionDatas[i];
            if (_positionData.shortAsset == lendingToken) {
                _positionData.shortCount =
                    (_positionData.shortCount * totalBorrowCount) /
                    currentShotAssetCountOfLendingToken;
            }
        }
    }

    function isNeedToUpdatePositionData(
        address account,
        address projectToken,
        address lendingToken
    ) external view returns (bool) {
        PositionData[] memory _positionDatas = positionData[account];
        for (uint256 i = 0; i < _positionDatas.length; i++) {
            PositionData memory _positionData = _positionDatas[i];
            if (
                (_positionData.longAsset == projectToken ||
                    _positionData.shortAsset == lendingToken) &&
                _positionData.longCount > 0 &&
                _positionData.shortCount > 0
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Deletes a leverage position for a user and project token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     */
    function deleteLeveragePosition(
        address user,
        address projectToken,
        address lendingToken,
        uint256 positionId
    ) internal {
        PositionData[] storage _positionDatas = positionData[user];
        for (uint256 i = 0; i < _positionDatas.length; i++) {
            PositionData storage _positionData = _positionDatas[i];
            if (
                (_positionData.longAsset == projectToken &&
                    _positionData.shortAsset == lendingToken) &&
                _positionData.longCount > 0 &&
                _positionData.shortCount > 0 &&
                _positionData.positionId == positionId
            ) {
                // delete _positionDatas[i];
                _positionDatas[i] = _positionDatas[_positionDatas.length - 1];
                _positionDatas.pop();
            }
        }
    }

    function closePosition(
        address projectToken,
        address lendingToken,
        uint256 positionId,
        uint256 collateralAmount,
        bytes memory buyCalldata
    ) external {
        pitAtomicRepayment.repayAtomicFromRelatedContract(
            msg.sender,
            lendingToken,
            projectToken,
            collateralAmount,
            buyCalldata,
            true
        );
        deleteLeveragePosition(
            msg.sender,
            projectToken,
            lendingToken,
            positionId
        );
    }

    // Update document for Leverage
}
