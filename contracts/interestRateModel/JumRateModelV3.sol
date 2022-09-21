// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../openzeppelin/contracts/utils/math/SafeMath.sol";
import "./../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./InterestRateModelV2.sol";
// import "./../bToken/BTokenInterfaces.sol";

interface BTokenInterfaces {
    function accrualBlockNumber() external view returns (uint);
    function borrowIndex() external view returns (uint);
}

/**
  * @title Logic for Compound's JumpRateModel Contract V2.
  * @author Compound (modified by Dharma Labs, refactored by Arr00)
  * @notice Version 2 modifies Version 1 by enabling updateable parameters.
  */
contract JumpRateModelV3 is Initializable, InterestRateModelV2 {
    using SafeMath for uint;

    event NewInterestParams(uint multiplierPerBlock, uint jumpMultiplierPerBlock, uint kink);
    event NewOwner(address newOner);
    event NewInterest(uint appliedBlock, uint interestRate);


    /**
     * @notice The address of the owner, i.e. the Timelock contract, which can update parameters directly
     */
    address public owner;

    /**
     * @notice The approximate number of blocks per year that is assumed by the interest rate model
     */
    uint public constant blocksPerYear = 2102400;

    /**
     * @notice The gain factor of utilization rate that gives the slope of the interest rate
     */
    uint public gainPerBlock;

    /**
     * @notice The jump gain after hitting a specified utilization point
     */
    uint public jumGainPerBlock;

    /**
     * @notice The target utilisation rate at which the jump gain is applied
     */
    uint public targetUtil;

    address bLendingToken;

    uint lastInterestRate;

    uint lastSupplyRate;

    uint public lastCalcBorrowRateBlock;

    modifier onlyBlendingToken() {
        require(msg.sender == bLendingToken, "Caller is not Blending token");
        _;
    }

    /**
     * @notice Construct an interest rate model
     * @param gainPerYear The rate of increase in interest rate wrt utilization (scaled by 1e18)
     * @param jumGainPerYear The multiplierPerBlock after hitting a specified utilization point
     * @param targetUtil_ The utilization point at which the jump multiplier is applied
     * @param owner_ The address of the owner, i.e. the Timelock contract (which has the ability to update parameters directly)
     */
    function initialize(
        uint gainPerYear, 
        uint jumGainPerYear, 
        uint targetUtil_, 
        address owner_
    ) public initializer {
        owner = owner_;

        updateJumpRateModelInternal(gainPerYear, jumGainPerYear, targetUtil_);
    }
    /**
     * @notice Change the owner address (only callable by previous owner)
     * @param _newOwner new owner address
     */
    function changeOwner(address _newOwner) external {
        require(msg.sender == owner && _newOwner != address(0), "invalid sender or new owner");
        owner =  _newOwner;
        emit NewOwner(_newOwner);
    }

    /**
     * @notice Update the parameters of the interest rate model (only callable by owner, i.e. Timelock)
     * @param multiplierPerYear The rate of increase in interest rate wrt utilization (scaled by 1e18)
     * @param jumpMultiplierPerYear The multiplierPerBlock after hitting a specified utilization point
     * @param kink_ The utilization point at which the jump multiplier is applied
     */
    function updateJumpRateModel(uint multiplierPerYear, uint jumpMultiplierPerYear, uint kink_) external {
        require(msg.sender == owner, "only the owner may call this function.");

        updateJumpRateModelInternal(multiplierPerYear, jumpMultiplierPerYear, kink_);
    }

    function setBLendingToken(address _blending) external {
        require(msg.sender == owner, "only the owner may call this function.");
        bLendingToken = _blending;
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
    // uint public lastCalcBorrowRateBlock;
    // uint public lastInterestRate;

    // function setLastCalcBorrowRateBlock(uint lastblock, uint rate) external {
    //     lastCalcBorrowRateBlock = lastblock;
    //     lastInterestRate = rate;
    // }

    // function update(uint cash, uint borrows, uint reserves) public {
    //     lastInterestRate = getBorrowRateInternal(cash, borrows, reserves);
    //     lastCalcBorrowRateBlock = getBlockNumber();

    // }

    // function getUtilErr(uint currentUtil) public view returns(int) {
    //     return int(currentUtil) - int(targetUtil);
    // } 

    // function getElapsedBlocks(uint lastCalcBorrowRateBlock) public view returns(uint) { 
    //     return getBlockNumber().sub(lastCalcBorrowRateBlock);
    // }

    // function getBlendingInfo() public view returns(uint lastCalcBorrowRateBlock, uint lastInterestRate_) {
    //     lastCalcBorrowRateBlock = BTokenInterfaces(bLendingToken).accrualBlockNumber();
    //     lastInterestRate_ = BTokenInterfaces(bLendingToken).borrowIndex();
    // }

    // function getRateChangeLess(int utilErr, uint elapsedBlocks, uint lastInterestRate_) public view returns(int interestRateChange, uint interestRate) {
    //     interestRateChange = utilErr * int(gainPerBlock) / 1e18;

    //     int normalRate = int(lastInterestRate_) + (int(elapsedBlocks) * interestRateChange);

    //     interestRate = normalRate > 0 ? uint(normalRate) : 0;

    // }

    // function getRateChangeGreater(int utilErr, uint elapsedBlocks, uint lastInterestRate) public view returns(int interestRateChange, uint interestRate) {

    //     interestRateChange = utilErr * int(gainPerBlock.mul(jumGainPerBlock)) / 1e36;

    //     int normalRate = int(lastInterestRate) + (int(elapsedBlocks) * interestRateChange);

    //     interestRate = normalRate > 0 ? uint(normalRate) : 0;
    // }

    // function getInterestRateChange(uint currentUtil, int utilErr, uint elapsedBlocks, uint lastInterestRate) public view returns(int interestRateChange, uint interestRate) {
    //     if (currentUtil <= targetUtil) {
    //         interestRateChange = utilErr * int(gainPerBlock) / 1e18;
    //     } else {
    //         interestRateChange = utilErr * int(gainPerBlock.mul(jumGainPerBlock).div(1e18));
    //     }

    //     int normalRate = int(lastInterestRate) + (int(elapsedBlocks) * interestRateChange);

    //     interestRate = normalRate > 0 ? uint(normalRate) : 0;
    // }

    // function getNormalRate(int interestRateChange, uint elapsedBlocks, uint lastInterestRate) public pure returns(int normalRate) {
    //     normalRate = int(lastInterestRate) + (int(elapsedBlocks) * interestRateChange);
    // }

    /**
     * @notice Calculates the current borrow rate per block, with the error code expected by the market
     * @param cash The amount of cash in the market
     * @param borrows The amount of borrows in the market
     * @param reserves The amount of reserves in the market
     * @return The borrow rate percentage per block as a mantissa (scaled by 1e18)
     */
    function calcBorrowRate(uint cash, uint borrows, uint reserves) public override returns (uint) { 
        uint currentUtil = utilizationRate(cash, borrows, reserves);
        int utilErr = int(currentUtil) - int(targetUtil);
        uint elapsedBlocks = getBlockNumber().sub(lastCalcBorrowRateBlock);

        int interestRateChange;

        if (currentUtil > targetUtil) {
            interestRateChange = utilErr * int(gainPerBlock.mul(jumGainPerBlock)) / 1e36;
        } else {
            interestRateChange = utilErr * int(gainPerBlock) / 1e18;
        }
        int normalRate = int(lastInterestRate) + (int(elapsedBlocks) * interestRateChange);

        uint interestRate = normalRate > 0 ? uint(normalRate) : 0;

        lastInterestRate = interestRate;

        lastCalcBorrowRateBlock = block.number;

        return interestRate;
    }

    function calcSupplyRate(uint cash, uint borrows, uint reserves, uint reserveFactorMantissa) external override returns (uint) {
        uint oneMinusReserveFactor = uint(1e18).sub(reserveFactorMantissa);
        uint borrowRate = calcBorrowRate(cash, borrows, reserves);
        uint rateToPool = borrowRate.mul(oneMinusReserveFactor).div(1e18);
        uint supplyRate = utilizationRate(cash, borrows, reserves).mul(rateToPool).div(1e18);
        lastSupplyRate = supplyRate;
        return supplyRate;
    }

    /**
     * @dev Function to simply retrieve block number
     *  This exists mainly for inheriting test contracts to stub this result.
     */
    function getBlockNumber() public view returns (uint) {
        return block.number;
    }

    /**
     * @notice Calculates the current supply rate per block
     * @return The supply rate percentage per block as a mantissa (scaled by 1e18)
     */
    function getSupplyRate() public view override returns (uint) {
        return lastSupplyRate;
    }

    /**
     * @notice Calculates the current borrow rate per block
     */
    function getBorrowRate() external override view returns (uint) {
        return lastInterestRate;
    }

    /**
     * @notice Internal function to update the parameters of the interest rate model
     * baseRatePerYear The approximate target base APR, as a mantissa (scaled by 1e18)
     * multiplierPerYear The rate of increase in interest rate wrt utilization (scaled by 1e18)
     * jumpMultiplierPerYear The multiplierPerBlock after hitting a specified utilization point
     * kink_ The utilization point at which the jump multiplier is applied
     */
    function updateJumpRateModelInternal(uint gainPerYear, uint jumGainPerYear, uint targetUtil_) internal {
        gainPerBlock = (gainPerYear).div(blocksPerYear); 
        jumGainPerBlock = jumGainPerYear.div(blocksPerYear);
        targetUtil = targetUtil_;

        emit NewInterestParams(gainPerBlock, jumGainPerBlock, targetUtil);
    }

}
