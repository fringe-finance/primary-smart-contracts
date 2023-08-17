// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
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

    event NewInterestParams(uint256 gainPerBlock, uint256 jumGainPerBlock, uint256 targetUtil);
    event NewOwner(address newOner);
    event NewInterest(uint256 appliedBlock, uint256 interestRate);

    struct BlendingTokenInfo {
        uint256 gainPerBlock;
        uint256 jumGainPerBlock;
        uint256 targetUtil;
    }

    struct RateInfo {
        uint256 lastInterestRate;
        uint256 lastAccrualBlockNumber;
        uint256 maxBorrowRate;
    }

    /**
     * @notice The approximate number of blocks per year that is assumed by the interest rate model
     */
    uint256 public blocksPerYear;
    mapping(address => BlendingTokenInfo) public blendingTokenInfo;
    mapping(address => RateInfo) public rateInfo;
    mapping(address => bool) public isBlendingTokenSupport;

    modifier onlyBlendingToken() {
        require(isBlendingTokenSupport[msg.sender], "Caller is not Blending token");
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
    function initialize(uint256 blocksPerYear_) public initializer {
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
    function updateJumpRateModel(uint256 gainPerYear, uint256 jumGainPerYear, uint256 targetUtil_, address blendingToken) external onlyModerator {
        updateJumpRateModelInternal(gainPerYear, jumGainPerYear, targetUtil_, blendingToken);
    }

    function setBlockPerYear(uint256 blocksPerYear_) external onlyModerator {
        blocksPerYear = blocksPerYear_;
    }

    function addBLendingTokenSuport(
        address blendingToken,
        uint256 gainPerYear,
        uint256 jumGainPerYear,
        uint256 targetUtil_,
        uint256 newMaxBorrow
    ) external onlyModerator {
        require(blendingToken != address(0), "JumpRateModelV3: Invalid address");
        isBlendingTokenSupport[blendingToken] = true;
        updateJumpRateModelInternal(gainPerYear, jumGainPerYear, targetUtil_, blendingToken);
        rateInfo[blendingToken].maxBorrowRate = newMaxBorrow;
        updateBlockNumber(blendingToken);
    }

    function removeBLendingTokenSuport(address _blending) external onlyModerator {
        require(_blending != address(0), "JumpRateModelV3: Invalid address");
        require(isBlendingTokenSupport[_blending], "JumpRateModelV3: Not found");
        isBlendingTokenSupport[_blending] = false;
    }

    function setMaxBorrowRate(address blendingToken, uint256 newMaxBorrow) external onlyModerator {
        require(isBlendingTokenSupport[blendingToken], "JumpRateModelV3: Not found");
        rateInfo[blendingToken].maxBorrowRate = newMaxBorrow;
    }

    function updateBlockNumber(address blendingToken) public onlyModerator {
        require(isBlendingTokenSupport[blendingToken], "JumpRateModelV3: Not found");
        uint256 blockNumber = BTokenInterface(blendingToken).accrualBlockNumber();
        rateInfo[blendingToken].lastAccrualBlockNumber = blockNumber;
    }

    /**
     * @notice Calculates the utilization rate of the market: `borrows / (cash + borrows - reserves)`
     * @param cash The amount of cash in the market
     * @param borrows The amount of borrows in the market
     * @param reserves The amount of reserves in the market (currently unused)
     * @return The utilization rate as a mantissa between [0, 1e18]
     */
    function utilizationRate(uint256 cash, uint256 borrows, uint256 reserves) public pure returns (uint) {
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
    function getInterestRateChange(uint256 cash, uint256 borrows, uint256 reserves, address blendingToken) public view returns (int) {
        BlendingTokenInfo memory info = blendingTokenInfo[blendingToken];
        /*
         * E = Cu - Tu
         */
        uint256 currentUtil = utilizationRate(cash, borrows, reserves);
        int utilErr = int(currentUtil) - int(info.targetUtil);

        /* Calculate delta interest rate
         * Cu > Tu => Dir = E * G * Jg
         * Cu < Tu => Dir = E * G
         * Cu = Tu => Dir = 0
         */
        int interestRateChange;

        if (currentUtil > info.targetUtil) {
            interestRateChange = (utilErr * int(info.gainPerBlock.mul(info.jumGainPerBlock))) / 1e36; // utilErr, Dir : positive
        } else if (currentUtil < info.targetUtil) {
            interestRateChange = (utilErr * int(info.gainPerBlock)) / 1e18; // utilErr, Dir : negative
        }
        return interestRateChange;
    }

    function getElapsedBlocks(address blendingToken) internal view returns (uint256 elapsedBlocks) {
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
    function getBorrowRateInternal(uint256 cash, uint256 borrows, uint256 reserves, address blendingToken) internal view returns (uint) {
        RateInfo memory borrowRateInfo = rateInfo[blendingToken];

        int interestRateChange = getInterestRateChange(cash, borrows, reserves, blendingToken);

        /* Calculate the number of blocks elapsed since the last accrual */
        uint256 elapsedBlocks = getElapsedBlocks(blendingToken);

        /* Calculate interest rate
         * IR = Lir + (Dt * Dir)
         * Cu > Tu => IR increase
         * Cu < Tu => IR decrease
         * Cu = Tu => IR not change
         * IR < 0 => IR = 0
         * IR > maxIR => IR = maxIR
         */
        int normalRate = int(borrowRateInfo.lastInterestRate) + (int(elapsedBlocks) * interestRateChange);

        uint256 interestRate = normalRate > 0 ? uint256(normalRate) : 0;

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
    function storeBorrowRate(uint256 cash, uint256 borrows, uint256 reserves) public override onlyBlendingToken returns (uint) {
        RateInfo storage borrowRateInfo = rateInfo[msg.sender];

        uint256 interestRate = getBorrowRateInternal(cash, borrows, reserves, msg.sender);

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
    function getSupplyRate(
        uint256 cash,
        uint256 borrows,
        uint256 reserves,
        uint256 reserveFactorMantissa,
        address blendingToken
    ) public view override returns (uint) {
        /* Calculate suply rate
         * oneMinusReserveFactor: percentage remaining after subtracting ReserveFactor
         * rateToPool = IR * oneMinusReserveFactor
         * supplyrate = Cu * rateToPool
         */
        uint256 oneMinusReserveFactor = uint256(1e18).sub(reserveFactorMantissa);
        uint256 borrowRate = getBorrowRateInternal(cash, borrows, reserves, blendingToken);
        uint256 rateToPool = borrowRate.mul(oneMinusReserveFactor).div(1e18);
        return utilizationRate(cash, borrows, reserves).mul(rateToPool).div(1e18);
    }

    /**
     * @notice Calculates the current borrow rate per block
     * @param cash The amount of cash in the market
     * @param borrows The amount of borrows in the market
     * @param reserves The amount of reserves in the market
     * @return The borrow rate percentage per block as a mantissa (scaled by 1e18)
     */
    function getBorrowRate(uint256 cash, uint256 borrows, uint256 reserves, address blendingToken) external view override returns (uint) {
        return getBorrowRateInternal(cash, borrows, reserves, blendingToken);
    }

    /**
     * @notice Internal function to update the parameters of the interest rate model
     * gainPerYear The gain factor
     * jumGainPerYear The jump gain that only applies if Cu > Tu
     * targetUtil_ The target utilisation rate
     */
    function updateJumpRateModelInternal(uint256 gainPerYear, uint256 jumGainPerYear, uint256 targetUtil_, address blendingToken) internal {
        BlendingTokenInfo storage info = blendingTokenInfo[blendingToken];
        info.gainPerBlock = (gainPerYear).div(blocksPerYear);
        info.jumGainPerBlock = jumGainPerYear.div(blocksPerYear);
        info.targetUtil = targetUtil_;

        emit NewInterestParams(info.gainPerBlock, info.jumGainPerBlock, info.targetUtil);
    }
}
