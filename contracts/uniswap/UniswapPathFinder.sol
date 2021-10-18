// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;


import "../../openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "../../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../../openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "./RouterInterface.sol";
import "./IUniswapV2Pair.sol";

contract UniswapPathFinder is Initializable{
    using SafeMathUpgradeable for uint256;

    address[] internal intermediateTokens;

    address router;

    function initialize(address _router) public initializer {
      intermediateTokens.push(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2); //weth
      intermediateTokens.push(0xdAC17F958D2ee523a2206206994597C13D831ec7); //usdt
      intermediateTokens.push(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48); //usdc
      router = _router;
    }

    function findPath(address fromToken, address toToken) public view returns (address[] memory path) {
      (, path) = evaluatePath(fromToken, toToken, 1000);
    }

    function evaluate(address fromToken, address toToken, uint256 fromTokenAmt) public view returns (uint256, address[] memory) {
      return evaluatePath(fromToken, toToken, fromTokenAmt);
    }

    function getAssetValuation(address basicToken, address assetToken, uint256 assetAmount) public view returns (uint256 valuation) {
        (valuation, ) = evaluatePath(assetToken, basicToken, assetAmount);
    }

    function getAssetUSDValuation(address assetToken, uint256 assetTokenAmt) public view returns (uint256 assetTokenOut) {
      address usdPeggedCoinAddress = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; //usdc
      if(assetToken == usdPeggedCoinAddress){
        assetTokenOut = assetTokenAmt;
      }
      else {
      (assetTokenOut,) = evaluatePath(assetToken, usdPeggedCoinAddress, assetTokenAmt);
      }
    }

    function uniswapPositionCap(address basicToken, address toToken, uint256 liquidity) internal view returns (uint256){
        (uint reserveB, uint reserveA) = getReserves(IUniswapV2Router01(uniswapRouter()).factory(), basicToken, toToken);
        return getAmountOut(liquidity, reserveA, reserveB);
    }

    function uniswapRouter() public view returns (address){
        return router;
    }

    function uniswapFactory() public view returns (address){
        return IUniswapV2Router01(uniswapRouter()).factory();
    } 

    function evaluatePath(address fromToken, address toToken, uint256 fromTokenAmt) internal view returns (uint256, address[] memory) {
        if(fromToken == toToken)
            return (fromTokenAmt, new address[](0));
          address[] memory path = new address[](2);
          path[0] = fromToken;
          path[1] = toToken;
          uint256 resultingAmt = getAmountsOut(uniswapFactory(),fromTokenAmt,path)[1];

          address[] memory internalPath = new address[](3);
          internalPath[0] = fromToken;
          internalPath[2] = toToken;
          for(uint i =0;i < intermediateTokens.length; i++){
            if(fromToken != intermediateTokens[i] && toToken!= intermediateTokens[i]){
              internalPath[1] = intermediateTokens[i];
              uint256 internalResultAmt = getAmountsOut(uniswapFactory(),fromTokenAmt,internalPath)[internalPath.length-1];
              if(internalResultAmt > resultingAmt){
                resultingAmt = internalResultAmt;
                path = new address[](3);
                path[1] = intermediateTokens[i];
              }
            }
      }

      if(path.length == 3 && resultingAmt>0) { //avoid trying path[4] if intermediate was not successful && direct path gives non zero result
        internalPath = new address[](4);
        internalPath[0] = fromToken;
        internalPath[3] = toToken;
        for(uint i = 0;i < intermediateTokens.length; i++){
          for (uint j = 0; j < intermediateTokens.length; j++){
            if( i != j && fromToken != intermediateTokens[i] && toToken!= intermediateTokens[i] && fromToken != intermediateTokens[j] && toToken != intermediateTokens[j]) {
              internalPath[1] = intermediateTokens[i];
              internalPath[2] = intermediateTokens[j];
              uint256 internalResultAmt = getAmountsOut(uniswapFactory(),fromTokenAmt,internalPath)[internalPath.length-1];
              if(internalResultAmt > resultingAmt){
                resultingAmt = internalResultAmt;
                path = new address[](4);
                path[1] = intermediateTokens[i];
                path[2] = intermediateTokens[j];
              }
            }
          }
        }
      }

      path[0] = fromToken;
      path[path.length-1] = toToken;

      return (resultingAmt,path);
    }

  // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, 'UniswapV2Library: IDENTICAL_ADDRESSES');
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'UniswapV2Library: ZERO_ADDRESS');
    }

    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(address factory, address tokenA, address tokenB) internal pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(uint160(uint(keccak256(abi.encodePacked(
                hex'ff',
                factory,
                keccak256(abi.encodePacked(token0, token1)),
                hex'96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f' // init code hash
            )))));
    }

    // fetches and sorts the reserves for a pair
    function getReserves(address factory, address tokenA, address tokenB) public view returns (uint reserveA, uint reserveB) {
        (address token0,) = sortTokens(tokenA, tokenB);
        address pairAddress = pairFor(factory, tokenA, tokenB);
        if(!AddressUpgradeable.isContract(pairAddress)){
          (reserveA, reserveB) = (0,0);
        } else{ 
          (uint reserve0, uint reserve1,) = IUniswapV2Pair(pairAddress).getReserves();
          (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
        }
        
    }

    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
        // require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
        // require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        if(amountIn>0 && reserveIn > 0 && reserveOut > 0 ){
          uint amountInWithFee = amountIn.mul(997);
          uint numerator = amountInWithFee.mul(reserveOut);
          uint denominator = reserveIn.mul(1000).add(amountInWithFee);
          amountOut = numerator / denominator;
        }else {
          amountOut = 0;
        }
    }

    // performs chained getAmountOut calculations on any number of pairs
    function getAmountsOut(address factory, uint amountIn, address[] memory path) internal view returns (uint[] memory amounts) {
        require(path.length >= 2, 'UniswapV2Library: INVALID_PATH');
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        for (uint i; i < path.length - 1; i++) {
            (uint reserveIn, uint reserveOut) = getReserves(factory, path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    function getUniswapPoolReserves(address tokenA,address tokenB) public view returns(uint256 reserveA, uint256 reserveB){
        (reserveA,reserveB) = getReserves(uniswapFactory(), tokenA, tokenB);
    }

    function getPrice(address basicToken, address prj) public view returns(uint256 priceOfPrjScaledBy10pow18){
        (uint reserveBasicToken,uint reservePrj) = getReserves(uniswapFactory(), basicToken, prj);
        uint8 basicTokenDecimals = ERC20Upgradeable(basicToken).decimals();
        uint8 prjDecimals = ERC20Upgradeable(prj).decimals();
        priceOfPrjScaledBy10pow18 = (10 ** 18) * (reserveBasicToken * (10 ** basicTokenDecimals)) / (reservePrj * (10 ** prjDecimals));
        return priceOfPrjScaledBy10pow18;
    }
  

    

}
