// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../openzeppelin/contracts/utils/math/SafeMath.sol";
import "./../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./InterestRateModel.sol";
import "../bToken/BTokenInterfaces.sol";

/**
  * @title Logic for Compound's JumpRateModel Contract V2.
  * @author Compound (modified by Dharma Labs, refactored by Arr00)
  * @notice Version 2 modifies Version 1 by enabling updateable parameters.
  */
contract JumpRateModelV3 is Initializable, InterestRateModel, AccessControlUpgradeable {
    using SafeMath for uint;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    event NewInterestParams(uint multiplierPerBlock, uint jumpMultiplierPerBlock, uint kink);
    event NewOwner(address newOner);
    event NewInterest(uint appliedBlock, uint interestRate);

    struct BlendingTokenInfo {
        uint gainPerBlock;
        uint jumGainPerBlock;
        uint targetUtil;
    }

    struct RateInfo {
        uint lastInterestRate;
        uint lastAccrualBlockNumber;
        uint maxBorrowRate;
    }

    /**
     * @notice The approximate number of blocks per year that is assumed by the interest rate model
     */
    uint public blocksPerYear;
    mapping(address => BlendingTokenInfo) public blendingTokenInfo;
    mapping (address => RateInfo) public rateInfo;
    mapping(address => bool) public isBlendingTokenSupport;

    modifier onlyBlendingToken() {
        require(isBlendingTokenSupport[msg.sender] , "Caller is not Blending token");
        _;
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the Admin");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "Caller is not the Moderator");
        _;
    }

    /**
     * @notice Construct an interest rate model
     */
    function initialize(uint blocksPerYear_) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        blocksPerYear = blocksPerYear_;
    }

    //************* ADMIN FUNCTIONS ********************************

    function grandModerator(address newModerator) public onlyAdmin {
        grantRole(MODERATOR_ROLE, newModerator);
    }

    function revokeModerator(address moderator) public onlyAdmin {
        revokeRole(MODERATOR_ROLE, moderator);
    }
   //************* MODERATOR FUNCTIONS ********************************

    /**
     * @notice Update the parameters of the interest rate model (only callable by owner, i.e. Timelock)
     * @param gainPerYear The rate of increase in interest rate wrt utilization (scaled by 1e18)
     * @param jumGainPerYear The jumGainPerBlock after hitting a specified utilization point
     * @param targetUtil_ The utilization point at which the jump multiplier is applied
     */
    function updateJumpRateModel(uint gainPerYear, uint jumGainPerYear, uint targetUtil_, address blendingToken) external onlyModerator() {
        updateJumpRateModelInternal(gainPerYear, jumGainPerYear, targetUtil_, blendingToken);
    }

    function setBlockPerYear(uint blocksPerYear_) external onlyModerator() {
        blocksPerYear = blocksPerYear_;
    }

    function addBLendingTokenSuport(address _blending) external onlyModerator() {
        require(_blending != address(0), "invalid address");
        isBlendingTokenSupport[_blending] = true;
    }

    function removeBLendingTokenSuport(address _blending) external onlyModerator() {
        require(_blending != address(0), "invalid address");
        require(isBlendingTokenSupport[_blending], "not found");
        isBlendingTokenSupport[_blending] = false;
    }

    function setMaxBorrowRate(address blendingToken, uint newMaxBorrow) external onlyModerator() {
        require(isBlendingTokenSupport[blendingToken], "not found");
        rateInfo[blendingToken].maxBorrowRate = newMaxBorrow;
    }

    function updateBlockNumber(address blendingToken) external onlyModerator() {
        require(isBlendingTokenSupport[blendingToken], "not found");
        uint blockNumber = BTokenInterface(blendingToken).accrualBlockNumber();
        rateInfo[blendingToken].lastAccrualBlockNumber = blockNumber;
    }

    /**
     * @notice Calculates the utilization rate of the market: `borrows / (cash + borrows - reserves)`
     * @param cash The amount of cash in the market
     * @param borrows The amount of borrows in the market
     * @param reserves The amount of reserves in the market (currently unused)
     * @return The utilization rate as a mantissa between [0, 1e18]
     */
    function utilizationRate(uint cash, uint borrows, uint reserves) public pure returns (uint) {
        // Utilization rate is 0 when there are no borrows
        if (borrows == 0) {
            return 0;
        }

        return borrows.mul(1e18).div(cash.add(borrows).sub(reserves));
    }

    /**
     * @notice Calculates the change in the interest rate per block per block
     * @param cash The amount of cash in the market
     * @param borrows The amount of borrows in the market
     * @param reserves The amount of reserves in the market
     * @return The change in the interest rate per block per block as a mantissa (scaled by 1e18)
     */
    function getInterestRateChange(uint cash, uint borrows, uint reserves, address blendingToken) public view returns(int) {
        BlendingTokenInfo memory info = blendingTokenInfo[blendingToken];
        /* 
         * E = Cu - Tu
         */
        uint currentUtil = utilizationRate(cash, borrows, reserves);
        int utilErr = int(currentUtil) - int(info.targetUtil);

        /* Calculate delta interest rate
         * Cu > Tu => Dir = E * G * Jg
         * Cu < Tu => Dir = E * G 
         * Cu = Tu => Dir = 0
         */
        int interestRateChange;

        if (currentUtil > info.targetUtil) {
            interestRateChange = utilErr * int(info.gainPerBlock.mul(info.jumGainPerBlock)) / 1e36; // utilErr, Dir : positive 
        } else if (currentUtil < info.targetUtil) {
            interestRateChange = utilErr * int(info.gainPerBlock) / 1e18; // utilErr, Dir : negative  
        }
        return interestRateChange;
    }

    function getElapsedBlocks(address blendingToken) internal view returns(uint elapsedBlocks) {
        /* Calculate the number of blocks elapsed since the last accrual */
        elapsedBlocks = getBlockNumber().sub(rateInfo[blendingToken].lastAccrualBlockNumber);
    }

    /**
     * @notice Calculates the current borrow rate, with the error code expected by the market
     * @param cash The amount of cash in the market
     * @param borrows The amount of borrows in the market
     * @param reserves The amount of reserves in the market
     * @return The borrow rate percentage as a mantissa (scaled by 1e18)
     */
    function getBorrowRateInternal(uint cash, uint borrows, uint reserves, address blendingToken) internal view returns (uint) {
        RateInfo memory borrowRateInfo = rateInfo[blendingToken];


        int interestRateChange = getInterestRateChange(cash, borrows, reserves, blendingToken);

        /* Calculate the number of blocks elapsed since the last accrual */
        uint elapsedBlocks = getElapsedBlocks(blendingToken);

        /* Calculate interest rate
         * IR = Lir + (Dt * Dir)
         * Cu > Tu => IR increase
         * Cu < Tu => IR decrease
         * Cu = Tu => IR not change
         * IR < 0 => IR = 0
         * IR > maxIR => IR = maxIR
         */
        int normalRate = int(borrowRateInfo.lastInterestRate) + (int(elapsedBlocks) * interestRateChange);

        uint interestRate = normalRate > 0 ? uint(normalRate) : 0;

        if (interestRate > borrowRateInfo.maxBorrowRate) {
            interestRate = borrowRateInfo.maxBorrowRate;
        } 
        return interestRate;
    }

    /**
     * @dev Function to simply retrieve block number
     *  This exists mainly for inheriting test contracts to stub this result.
     */
    function getBlockNumber() public view returns (uint) {
        return block.number;
    }

    /**
     * @notice Calculates the current borrow rate per block, with the error code expected by the market
     * @param cash The amount of cash in the market
     * @param borrows The amount of borrows in the market
     * @param reserves The amount of reserves in the market
     * @return The borrow rate percentage per block as a mantissa (scaled by 1e18)
     */
    function storeBorrowRate(uint cash, uint borrows, uint reserves) public onlyBlendingToken() override returns (uint) {
        RateInfo storage borrowRateInfo = rateInfo[msg.sender];

        uint interestRate = getBorrowRateInternal(cash, borrows, reserves, msg.sender);

        borrowRateInfo.lastInterestRate = interestRate;

        borrowRateInfo.lastAccrualBlockNumber = block.number;

        return interestRate;
    }

    /**
     * @notice Calculates the current supply rate per block
     * @param cash The amount of cash in the market
     * @param borrows The amount of borrows in the market
     * @param reserves The amount of reserves in the market
     * @param reserveFactorMantissa The current reserve factor for the market
     * @return The supply rate percentage per block as a mantissa (scaled by 1e18)
     */
    function getSupplyRate(uint cash, uint borrows, uint reserves, uint reserveFactorMantissa, address blendingToken) public view override returns (uint) {
        /* Calculate suply rate
         * oneMinusReserveFactor: percentage remaining after subtracting ReserveFactor
         * rateToPool = IR * oneMinusReserveFactor 
         * supplyrate = Cu * rateToPool
         */
        uint oneMinusReserveFactor = uint(1e18).sub(reserveFactorMantissa);
        uint borrowRate = getBorrowRateInternal(cash, borrows, reserves, blendingToken);
        uint rateToPool = borrowRate.mul(oneMinusReserveFactor).div(1e18);
        return utilizationRate(cash, borrows, reserves).mul(rateToPool).div(1e18);
    }

    /**
     * @notice Calculates the current borrow rate per block
     * @param cash The amount of cash in the market
     * @param borrows The amount of borrows in the market
     * @param reserves The amount of reserves in the market
     * @return The borrow rate percentage per block as a mantissa (scaled by 1e18)
     */
    function getBorrowRate(uint cash, uint borrows, uint reserves, address blendingToken) external override view returns (uint) {
        return getBorrowRateInternal(cash, borrows, reserves, blendingToken);
    }

    /**
     * @notice Internal function to update the parameters of the interest rate model
     * gainPerYear The gain factor
     * jumGainPerYear The jump gain that only applies if Cu > Tu
     * targetUtil_ The target utilisation rate
     */
    function updateJumpRateModelInternal(uint gainPerYear, uint jumGainPerYear, uint targetUtil_, address blendingToken) internal {
        BlendingTokenInfo storage info = blendingTokenInfo[blendingToken];
        info.gainPerBlock = (gainPerYear).div(blocksPerYear); 
        info.jumGainPerBlock = jumGainPerYear.div(blocksPerYear);
        info.targetUtil = targetUtil_;

        emit NewInterestParams(info.gainPerBlock, info.jumGainPerBlock, info.targetUtil);
    }

}