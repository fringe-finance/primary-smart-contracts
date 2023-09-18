// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./InterestRateModel.sol";
import "../bToken/BTokenInterfaces.sol";

/**
 * @title JumpRateModel Contract V3.
 * @notice V3 interest rate Model.
 */
contract JumpRateModelV3 is Initializable, InterestRateModel, AccessControlUpgradeable {
    using SafeMath for uint;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    /**
     * @dev Emitted when the owner of the interest rate model is updated.
     * @param gainPerBlock The new gainPerBlock.
     * @param jumGainPerBlock The new jumGainPerBlock.
     * @param targetUtil The new targetUtil.
     */
    event NewInterestParams(uint256 gainPerBlock, uint256 jumGainPerBlock, uint256 targetUtil);

    /**
     * @dev Emitted when the owner of the contract is updated.
     * @param newOwner The address of the new owner.
     */
    event NewOwner(address newOwner);

    /**
     * @dev Emitted when a new interest rate is set.
     * @param appliedBlock The block number at which the interest rate was applied.
     * @param interestRate The new interest rate.
     */
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
     * @dev The approximate number of blocks per year that is assumed by the interest rate model.
     */
    uint256 public blocksPerYear;
    mapping(address => BlendingTokenInfo) public blendingTokenInfo;
    mapping(address => RateInfo) public rateInfo;
    mapping(address => bool) public isBlendingTokenSupport;

    /**
     * @dev Modifier to restrict access to only the blending token contract.
     */
    modifier onlyBlendingToken() {
        require(isBlendingTokenSupport[msg.sender], "Caller is not Blending token");
        _;
    }

    /**
     * @dev Modifier to check if the caller is the default admin role.
     */
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the Admin");
        _;
    }

    /**
     * @dev Modifier to check if the caller has the moderator role.
     */
    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "Caller is not the Moderator");
        _;
    }

    /**
     * @dev Constructs an interest rate model.
     * @param blocksPerYear_ Number of blocks in a year for compounding.
     */
    function initialize(uint256 blocksPerYear_) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        blocksPerYear = blocksPerYear_;
    }

    //************* ADMIN FUNCTIONS ********************************

    /**
     * @dev Grants the `MODERATOR_ROLE` to a new address.
     * The caller must have the `ADMIN_ROLE`.
     * @param newModerator The address to grant the role to.
     */
    function grandModerator(address newModerator) public onlyAdmin {
        grantRole(MODERATOR_ROLE, newModerator);
    }

    /**
     * @dev Revokes the moderator role from the specified address.
     * The caller must have the admin role.
     * @param moderator The address of the moderator to revoke the role from.
     */
    function revokeModerator(address moderator) public onlyAdmin {
        revokeRole(MODERATOR_ROLE, moderator);
    }

    //************* MODERATOR FUNCTIONS ********************************

    /**
     * @dev Updates the parameters of the interest rate model (only callable by owner, i.e. Timelock).
     * Only the contract moderator can call this function.
     * @param gainPerYear The rate of increase in interest rate wrt utilization (scaled by 1e18).
     * @param jumGainPerYear The jumGainPerBlock after hitting a specified utilization point.
     * @param targetUtil_ The utilization point at which the jump multiplier is applied.
     */
    function updateJumpRateModel(uint256 gainPerYear, uint256 jumGainPerYear, uint256 targetUtil_, address blendingToken) external onlyModerator {
        updateJumpRateModelInternal(gainPerYear, jumGainPerYear, targetUtil_, blendingToken);
    }

    /**
     * @dev Sets the number of blocks per year for the JumpRateModelV3 contract.
     * Only the contract moderator can call this function.
     * @param blocksPerYear_ The new number of blocks per year.
     */
    function setBlockPerYear(uint256 blocksPerYear_) external onlyModerator {
        blocksPerYear = blocksPerYear_;
    }

    /**
     * @dev Adds support for a new blending token to the JumpRateModelV3 contract.
     *
     * Requirements:
     * - `blendingToken` cannot be the zero address.
     * - Only the contract moderator can call this function.
     * @param blendingToken The address of the blending token to add support for.
     * @param gainPerYear The gain per year for the blending token.
     * @param jumGainPerYear The jump gain per year for the blending token.
     * @param targetUtil_ The target utilization rate for the blending token.
     * @param newMaxBorrow The new maximum borrow rate for the blending token.
     */
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

    /**
     * @dev Removes blending token support for the specified blending token address.
     *
     * Requirements:
     * - `_blending` cannot be the zero address.
     * - `_blending` must be a supported blending token.
     * @param _blending The address of the blending token to remove support for.
     */
    function removeBLendingTokenSuport(address _blending) external onlyModerator {
        require(_blending != address(0), "JumpRateModelV3: Invalid address");
        require(isBlendingTokenSupport[_blending], "JumpRateModelV3: Not found");
        isBlendingTokenSupport[_blending] = false;
    }

    /**
     * @dev Sets the maximum borrow rate for a blending token.
     *
     * Requirements:
     * - The caller must have the `onlyModerator` modifier.
     * - The blending token must be supported by the contract.
     * @param blendingToken The address of the blending token.
     * @param newMaxBorrow The new maximum borrow rate to be set.
     */
    function setMaxBorrowRate(address blendingToken, uint256 newMaxBorrow) external onlyModerator {
        require(isBlendingTokenSupport[blendingToken], "JumpRateModelV3: Not found");
        rateInfo[blendingToken].maxBorrowRate = newMaxBorrow;
    }

    /**
     * @dev Updates the block number for a given blending token.
     *
     * Requirements:
     * - The caller must have the `onlyModerator` modifier.
     * - The blending token must be supported.
     * @param blendingToken The address of the blending token to update.
     */
    function updateBlockNumber(address blendingToken) public onlyModerator {
        require(isBlendingTokenSupport[blendingToken], "JumpRateModelV3: Not found");
        uint256 blockNumber = BTokenInterface(blendingToken).accrualBlockNumber();
        rateInfo[blendingToken].lastAccrualBlockNumber = blockNumber;
    }

    /**
     * @dev Calculates the utilization rate of the market: `borrows / (cash + borrows - reserves)`.
     * @param cash The amount of cash in the market.
     * @param borrows The amount of borrows in the market.
     * @param reserves The amount of reserves in the market (currently unused).
     * @return The utilization rate as a mantissa between [0, 1e18].
     */
    function utilizationRate(uint256 cash, uint256 borrows, uint256 reserves) public pure returns (uint) {
        // Utilization rate is 0 when there are no borrows
        if (borrows == 0) {
            return 0;
        }

        return borrows.mul(1e18).div(cash.add(borrows).sub(reserves));
    }

    /**
     * @dev Calculates the change in the interest rate per block per block.
     * @param cash The amount of cash in the market.
     * @param borrows The amount of borrows in the market.
     * @param reserves The amount of reserves in the market.
     * @return The change in the interest rate per block per block as a mantissa (scaled by 1e18).
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

    /**
     * @dev Calculates the number of blocks elapsed since the last accrual.
     * @param blendingToken The address of the blending token.
     * @return elapsedBlocks The number of elapsed blocks.
     */
    function getElapsedBlocks(address blendingToken) internal view returns (uint256 elapsedBlocks) {
        /* Calculate the number of blocks elapsed since the last accrual */
        elapsedBlocks = getBlockNumber().sub(rateInfo[blendingToken].lastAccrualBlockNumber);
    }

    /**
     * @dev Calculates the current borrow rate, with the error code expected by the market.
     * @param cash The amount of cash in the market.
     * @param borrows The amount of borrows in the market.
     * @param reserves The amount of reserves in the market.
     * @return The borrow rate percentage as a mantissa (scaled by 1e18).
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
     * @dev Function to simply retrieve block number.
     * This exists mainly for inheriting test contracts to stub this result.
     */
    function getBlockNumber() public view returns (uint) {
        return block.number;
    }

    /**
     * @dev Calculates the current borrow rate per block, with the error code expected by the market.
     * @param cash The amount of cash in the market.
     * @param borrows The amount of borrows in the market.
     * @param reserves The amount of reserves in the market.
     * @return The borrow rate percentage per block as a mantissa (scaled by 1e18).
     */
    function storeBorrowRate(uint256 cash, uint256 borrows, uint256 reserves) public override onlyBlendingToken returns (uint) {
        RateInfo storage borrowRateInfo = rateInfo[msg.sender];

        uint256 interestRate = getBorrowRateInternal(cash, borrows, reserves, msg.sender);

        borrowRateInfo.lastInterestRate = interestRate;

        borrowRateInfo.lastAccrualBlockNumber = block.number;

        return interestRate;
    }

    /**
     * @dev Calculates the current supply rate per block.
     * @param cash The amount of cash in the market.
     * @param borrows The amount of borrows in the market.
     * @param reserves The amount of reserves in the market.
     * @param reserveFactorMantissa The current reserve factor for the market.
     * @return The supply rate percentage per block as a mantissa (scaled by 1e18).
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
     * @dev Calculates the current borrow rate per block.
     * @param cash The amount of cash in the market.
     * @param borrows The amount of borrows in the market.
     * @param reserves The amount of reserves in the market.
     * @return The borrow rate percentage per block as a mantissa (scaled by 1e18).
     */
    function getBorrowRate(uint256 cash, uint256 borrows, uint256 reserves, address blendingToken) external view override returns (uint) {
        return getBorrowRateInternal(cash, borrows, reserves, blendingToken);
    }

    /**
     * @dev Internal function to update the parameters of the interest rate model.
     * gainPerYear The gain factor.
     * jumGainPerYear The jump gain that only applies if Cu > Tu.
     * targetUtil_ The target utilization rate.
     */
    function updateJumpRateModelInternal(uint256 gainPerYear, uint256 jumGainPerYear, uint256 targetUtil_, address blendingToken) internal {
        BlendingTokenInfo storage info = blendingTokenInfo[blendingToken];
        info.gainPerBlock = (gainPerYear).div(blocksPerYear);
        info.jumGainPerBlock = jumGainPerYear.div(blocksPerYear);
        info.targetUtil = targetUtil_;

        emit NewInterestParams(info.gainPerBlock, info.jumGainPerBlock, info.targetUtil);
    }
}
