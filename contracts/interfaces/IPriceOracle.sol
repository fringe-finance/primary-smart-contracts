//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IPriceOracle {

    struct PriceInfo {
        uint8 priceDecimals;
        uint32 timestamp;
        uint256 collateralPrice;
        uint256 capitalPrice;
    }
    
    function MODERATOR_ROLE() external view returns(bytes32);
    
    function volatilityCapFixedPercent() external view returns(address priceProvider);

    function minSampleInterval(address token) external view returns(bool);

    function logMaturingAge(address token) external view returns(bool);

    function longTWAPperiod(address token) external view returns(bool);

    /****************** Admin functions ****************** */

    function grantModerator(address newModerator) external;

    function revokeModerator(address moderator) external;

    /****************** end Admin functions ****************** */

    /****************** Moderator functions ****************** */

    /**
    * @dev Set the price provider aggregator contract address
    * @param newPriceProviderAggregator The address of the new price provider aggregator contract
    */
    function setPriceProviderAggregator(address newPriceProviderAggregator) external;

    /**
     * @dev Set the volatility cap fixed percent
     * @param _volatilityCapFixedPercent The new volatility cap fixed percent
     */
    function setVolatilityCapFixedPercent(uint16 _volatilityCapFixedPercent) external;

    /** 
     * @dev Set the minimum sample interval
     * @param _minSampleInterval The new minimum sample interval
     */
    function setMinSampleInterval(uint256 _minSampleInterval) external;

    /**
     * @dev Set the log maturing age
     * @param _logMaturingAge The new log maturing age
     */
    function setLogMaturingAge(uint256 _logMaturingAge) external;

    /**
     * @dev Set the long TWAP period
     * @param _longTWAPperiod The new long TWAP period
     */
    function setLongTWAPperiod(uint256 _longTWAPperiod) external;

    /****************** main functions ****************** */

    /**
    * @dev Calculates the final TWAP prices of a token.
    * @param token The address of the token.
    */
    function updateFinalPrices(address token) external ;

    /**
     * @dev Returns the most recent TWAP price of a token.
     * @param token The address of the token.
     * @return priceDecimals The decimals of the price.
     * @return timestamp The last updated timestamp of the price.
     * @return collateralPrice The collateral price of the token.
     * @return capitalPrice The capital price of the token.
     */
    function getMostTWAPprice(address token) external view returns (uint8 priceDecimals, uint32 timestamp, uint256 collateralPrice, uint256 capitalPrice);

    /**
     * @dev returns the most TWAP price in USD evaluation of token by its `tokenAmount`
     * @param token the address of token to evaluate
     * @param tokenAmount the amount of token to evaluate
     * @return collateralEvaluation the USD evaluation of token by its `tokenAmount` in collateral price
     * @return capitalEvaluation the USD evaluation of token by its `tokenAmount` in capital price
     */
    function getEvaluation(address token, uint256 tokenAmount) external view returns(uint256 collateralEvaluation, uint256 capitalEvaluation);

    /**
     * @dev returns tuple (priceMantissa, priceDecimals)
     * @notice price = priceMantissa / (10 ** priceDecimals)
     * @param token the address of token which price is to return
     */
    function getReportedPrice(address token) external view returns(uint256 priceMantissa, uint8 priceDecimals);
}