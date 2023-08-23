// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./ChainlinkPriceProvider.sol";

/**
 * Chainlink price provider
 */
contract ChainlinkPriceProviderL2 is ChainlinkPriceProvider {
    uint32 public gracePeriodTime;

    address public sequencerUptimeFeed;

    event SetSequencerUptimeFeed(address indexed newSequencerUptimeFeed);
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
