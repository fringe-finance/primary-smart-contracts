// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./ChainlinkPriceProvider.sol";

/**
 * Chainlink price provider
 */
contract ChainlinkPriceProviderL2 is ChainlinkPriceProvider {
    uint32 public gracePeriodTime;

    address public sequencerUptimeFeed;

    mapping(address => uint256) public timeOuts; // address of aggregatorPath => timeout of aggregatorPath

    event SetSequencerUptimeFeed(address indexed newSequencerUptimeFeed);
    event SetTimeOut(address indexed aggregatorPath, uint256 newTimeOut);
    event SetGracePeriodTime(uint32 newGracePeriodTime);

    /****************** Moderator functions ****************** */

    /**
     * @dev Sets proxy addresses for the L2 sequencer feeds.
     * @param newSequencerUptimeFeed The address of new SequencerUptimeFeed contract.
     */
    function setSequencerUptimeFeed(address newSequencerUptimeFeed) external onlyModerator {
        require(newSequencerUptimeFeed != address(0), "ChainlinkPriceProvider: Invalid sequencerUptimeFeed!");
        sequencerUptimeFeed = newSequencerUptimeFeed;
        emit SetSequencerUptimeFeed(newSequencerUptimeFeed);
    }

    /**
     * @dev Sets the grace period after the sequencer is backed up.
     * @param newGracePeriodTime The new grace period time value.
     */
    function setGracePeriodTime(uint32 newGracePeriodTime) external onlyModerator {
        gracePeriodTime = newGracePeriodTime;
        emit SetGracePeriodTime(newGracePeriodTime);
    }

    /**
     * @notice Sets the timeout value corresponding to the aggregatorPath.
     * @param aggregatorPath The address of chainlink aggregator contract.
     * @param newTimeOut It is the amount of time it takes for a new round of aggregation to start after a specified
     * amount of time since the last update plus a period of time waiting for new price update transactions to execute.
     * @dev Example: ETH/USD have a new answer is written when the off-chain data moves more than the
     *      0.5% deviation threshold or 3600 seconds have passed since the last answer was written on-chain.
     *      So, the timeOut value for each aggregator will be equal to the heartbeat threshold value plus a
     *      period of time to make the transaction update the price, that time period can be 60s or a little more.
     */
    function setTimeOut(address aggregatorPath, uint256 newTimeOut) external onlyModerator {
        require(aggregatorPath != address(0), "ChainlinkPriceProvider: Invalid aggregatorPath!");
        timeOuts[aggregatorPath] = newTimeOut;
        emit SetTimeOut(aggregatorPath, newTimeOut);
    }

    /****************** View functions ****************** */

    /**
     * @dev Return the latest price after performing sanity check and staleness check.
     * @param aggregatorPath The address of chainlink aggregator contract.
     * @return answer The latest price (answer).
     */
    function getLatestPrice(address aggregatorPath) public view override returns (uint256 answer) {
        _checkSequencerStatus();
        answer = super.getLatestPrice(aggregatorPath);
    }

    /**
     * @notice check the sequencer status
     */
    function _checkSequencerStatus() internal view {
        (, /*uint80 roundId*/ int256 answer, uint256 startedAt /*uint256 updatedAt*/ /*uint80 answeredInRound*/, , ) = AggregatorV3Interface(
            sequencerUptimeFeed
        ).latestRoundData();

        bool isSequencerUp = answer == 0;
        if (!isSequencerUp) {
            revert("ChainlinkPriceProvider: Sequencer is down!");
        }
        uint256 timeSinceUp = block.timestamp - startedAt;
        if (timeSinceUp <= gracePeriodTime) {
            revert("ChainlinkPriceProvider: Grace period is not over!");
        }
    }
}
