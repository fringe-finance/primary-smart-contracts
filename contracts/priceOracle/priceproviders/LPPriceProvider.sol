// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "../../openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "../../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../../util/HomoraMath.sol";
import "../../interfaces/IBaseOracle.sol";
import "./uniswapV2/IUniswapV2Pair.sol";
import "./PriceProvider.sol";

contract LPPriceProvider is
    PriceProvider,
    Initializable,
    AccessControlUpgradeable,
    IBaseOracle
{
    using SafeMathUpgradeable for uint256;
    using HomoraMath for uint256;
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    uint8 public usdDecimals;
    address public usdcToken;

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

    function initialize(address _usdcToken) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        usdDecimals = 6;
        usdcToken = _usdcToken;
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
    function getUSDPx(address lpToken) public view override returns (uint256) {
        LPMetadata memory metadata = lpMetadata[lpToken];
        address token0 = IUniswapV2Pair(lpToken).token0();
        address token1 = IUniswapV2Pair(lpToken).token1();
        uint256 totalSupply = IUniswapV2Pair(lpToken).totalSupply();
        (uint256 r0, uint256 r1, ) = IUniswapV2Pair(lpToken).getReserves();
        uint256 sqrtK = HomoraMath.sqrt(r0.mul(r1)).fdiv(totalSupply); // in 2**112
        uint256 px0 = token0 == usdcToken ? uint(2**112).mul(1e6) : IBaseOracle(metadata.base).getUSDPx(token0); // in 2**112
        uint256 px1 = token1 == usdcToken ? uint(2**112).mul(1e6) : IBaseOracle(metadata.base).getUSDPx(token1); // in 2**112
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

    function getInfo(address lpToken) public view returns(address token0, address token1, uint total, uint256 r0, uint256 r1, uint256 sqrtK, uint256 px0, uint256 px1, uint price112, uint priceMantissa ) {
        LPMetadata memory metadata = lpMetadata[lpToken];
        token0 = IUniswapV2Pair(lpToken).token0();
        token1 = IUniswapV2Pair(lpToken).token1();
        total = IUniswapV2Pair(lpToken).totalSupply();
        (r0, r1, ) = IUniswapV2Pair(lpToken).getReserves();
        sqrtK = HomoraMath.sqrt(r0.mul(r1)).fdiv(total); // in 2**112
        px0 = token0 == usdcToken ? uint(2**112).mul(1e6) : IBaseOracle(metadata.base).getUSDPx(token0); // in 2**112
        px1 = token1 == usdcToken ? uint(2**112).mul(1e6) : IBaseOracle(metadata.base).getUSDPx(token1); // in 2**11
        price112 = sqrtK
                .mul(2)
                .mul(HomoraMath.sqrt(px0))
                .div(2**56)
                .mul(HomoraMath.sqrt(px1))
                .div(2**56);
        priceMantissa = price112.div(uint(2**112));
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
