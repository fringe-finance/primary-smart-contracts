// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "../../openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "../../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../../util/HomoraMath.sol";
import "./uniswapV2/IUniswapV2Pair.sol";
import "./PriceProvider.sol";

contract LPPriceProvider is
    PriceProvider,
    Initializable,
    AccessControlUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using HomoraMath for uint256;
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    uint8 public usdDecimals;

    mapping(address => LPMetadata) public lpMetadata; // address of token => metadata of chainlink

    struct LPMetadata {
        bool isActive;
        address base;
    }

    event GrandModeratorRole(address indexed who, address indexed newModerator);
    event RevokeModeratorRole(address indexed who, address indexed moderator);
    event SetLPTokenAndPriceProvider(
        address indexed who,
        address indexed token,
        address indexed priceProvider
    );
    event ChangeActive(address indexed who, address indexed token, bool active);

    function initialize() public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        usdDecimals = 6;
    }

    modifier onlyAdmin() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Caller is not the Admin"
        );
        _;
    }

    modifier onlyModerator() {
        require(
            hasRole(MODERATOR_ROLE, msg.sender),
            "Caller is not the Moderator"
        );
        _;
    }

    /****************** Admin functions ****************** */

    function grandModerator(address newModerator) public onlyAdmin {
        grantRole(MODERATOR_ROLE, newModerator);
        emit GrandModeratorRole(msg.sender, newModerator);
    }

    function revokeModerator(address moderator) public onlyAdmin {
        revokeRole(MODERATOR_ROLE, moderator);
        emit RevokeModeratorRole(msg.sender, moderator);
    }

    /****************** end Admin functions ****************** */

    /****************** Moderator functions ****************** */

    function setLPTokenAndProvider(address lpToken, address provider)
        public
        onlyModerator
    {
        require(lpToken != address(0), "USBPriceOracle: invalid token");
        require(
            provider != address(0),
            "USBPriceOracle: invalid priceProvider"
        );
        LPMetadata storage metadata = lpMetadata[lpToken];
        metadata.isActive = true;
        metadata.base = provider;
        emit SetLPTokenAndPriceProvider(msg.sender, lpToken, provider);
    }

    function changeActive(address token, bool active)
        public
        override
        onlyModerator
    {
        require(
            lpMetadata[token].base != address(0),
            "ChainlinkPriceProvider: token is not listed!"
        );
        lpMetadata[token].isActive = active;
        emit ChangeActive(msg.sender, token, active);
    }

    /****************** View functions ****************** */

    function isListed(address token) public view override returns (bool) {
        if (lpMetadata[token].base != address(0)) {
            return true;
        } else {
            return false;
        }
    }

    function isActive(address token) public view override returns (bool) {
        return lpMetadata[token].isActive;
    }

    /// @dev Return the value of the given input as ETH per unit, multiplied by 2**112.
    /// @param lpToken The Uniswap pair to check the value.
    function getUSDPx(address lpToken) public view returns (uint256) {
        uint256 totalSupply = IUniswapV2Pair(lpToken).totalSupply();
        (uint256 r0, uint256 r1, ) = IUniswapV2Pair(lpToken).getReserves();
        uint256 sqrtK = HomoraMath.sqrt(r0.mul(r1)).fdiv(totalSupply); // in 2**112
        (uint px0, uint px1) = calcUSDPx112(lpToken); // in 2**112
        // fair token0 amt: sqrtK * sqrt(px1/px0)
        // fair token1 amt: sqrtK * sqrt(px0/px1)
        // fair lp price = 2 * sqrt(px0 * px1)
        // split into 2 sqrts multiplication to prevent uint overflow (note the 2**112)
        return
            sqrtK
                .mul(2)
                .mul(HomoraMath.sqrt(px0))
                .div(2**56)
                .mul(HomoraMath.sqrt(px1))
                .div(2**56);
    }

    function calcUSDPx112(address lpToken) internal view returns(uint P0x112, uint P1x112) {
        LPMetadata memory metadata = lpMetadata[lpToken];
        address token0 = IUniswapV2Pair(lpToken).token0();
        address token1 = IUniswapV2Pair(lpToken).token1();
        (uint priceMantissa0, ) = PriceProvider(metadata.base).getPrice(token0);
        P0x112 = priceMantissa0.mul(uint(2**112));

        (uint priceMantissa1, ) = PriceProvider(metadata.base).getPrice(token1);
        P1x112 = priceMantissa1.mul(uint(2**112));
    }

    function getPrice(address lpToken)
        public
        view
        override
        returns (uint256 priceMantissa, uint8 priceDecimals)
    {
        uint256 usdPrice = getUSDPx(lpToken);
        priceMantissa = usdPrice.div(uint(2**112));
        priceDecimals = usdDecimals;
    }

    /**
     * @notice returns the equivalent amount in USD
     * @param lpToken the address of token
     * @param tokenAmount the amount of token
     */
    function getEvaluation(address lpToken, uint256 tokenAmount)
        public
        view
        override
        returns (uint256 evaluation)
    {
        (uint256 priceMantissa, uint8 priceDecimals) = getPrice(lpToken);
        evaluation = (tokenAmount * priceMantissa) / 10**(priceDecimals); // get the evaluation scaled by 10**tokenDecimals
        uint8 tokenDecimals = IUniswapV2Pair(lpToken).decimals();
        if (tokenDecimals >= usdDecimals) {
            evaluation = evaluation / (10**(tokenDecimals - usdDecimals)); //get the evaluation in USD.
        } else {
            evaluation = evaluation * (10**(usdDecimals - tokenDecimals));
        }
    }

    function getPriceDecimals() public view override returns (uint8) {
        return usdDecimals;
    }
}
