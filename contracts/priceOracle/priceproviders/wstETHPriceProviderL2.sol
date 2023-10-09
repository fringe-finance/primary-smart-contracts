// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./wstETHPriceProvider.sol";

/**
 * @title wstETH price provider L2
 * @notice Price provider that uses chainlink
 * @dev This contract is used to get the price of wstETH in USD.
 */
contract wstETHPriceProviderL2 is wstETHPriceProvider {
    uint32 public gracePeriodTime;

    address public sequencerUptimeFeed;

    /**
     * @dev Emitted when the address of the L2 sequencer uptime feed is set.
     * @param newSequencerUptimeFeed The address of the new L2 sequencer uptime feed.
     */
    event SetSequencerUptimeFeed(address indexed newSequencerUptimeFeed);

    /**
     * @dev Emitted when the grace period time is set.
     * @param newGracePeriodTime The new grace period time value.
     */
    event SetGracePeriodTime(uint32 newGracePeriodTime);

    /****************** Moderator functions ****************** */

    /**
     * @dev Sets proxy addresses for the L2 sequencer feeds.
     * Caller must be the moderator.
     * @param newSequencerUptimeFeed The address of new SequencerUptimeFeed contract.
     */
    function setSequencerUptimeFeed(address newSequencerUptimeFeed) external onlyModerator {
        require(newSequencerUptimeFeed != address(0), "ChainlinkPriceProvider: Invalid sequencerUptimeFeed!");
        sequencerUptimeFeed = newSequencerUptimeFeed;
        emit SetSequencerUptimeFeed(newSequencerUptimeFeed);
    }

    /**
     * @dev Sets the grace period after the sequencer is backed up.
     * Caller must be the moderator.
     * @param newGracePeriodTime The new grace period time value.
     */
    function setGracePeriodTime(uint32 newGracePeriodTime) external onlyModerator {
        gracePeriodTime = newGracePeriodTime;
        emit SetGracePeriodTime(newGracePeriodTime);
    }

    /****************** View functions ****************** */

    /**
     * @dev ReturnS the latest price after performing sanity check and staleness check.
     * @param aggregatorPath_ The address of chainlink aggregator contract.
     * @return answer The latest price (answer).
     */
    function getLatestPrice(address aggregatorPath_) public view override returns (uint256 answer) {
        _checkSequencerStatus();
        answer = super.getLatestPrice(aggregatorPath_);
    }

    /**
     * @dev Internal function to check the status of the sequencer and the grace period time.
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