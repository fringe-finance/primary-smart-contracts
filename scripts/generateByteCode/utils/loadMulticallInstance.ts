import { Multicall } from "ethereum-multicall";

export const loadMulticallInstance = (provider: any) => {
  try {
    const multicall = new Multicall({ ethersProvider: provider, tryAggregate: true });
    return multicall;
  } catch {
    const multicall = new Multicall({ ethersProvider: provider, tryAggregate: true, multicallCustomContractAddress: "0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441" });
    return multicall;
  }
  
};
