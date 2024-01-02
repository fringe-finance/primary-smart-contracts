import { ethers } from "ethers";

export const tryDecodeFuncData = (data: string, abi: any[], iface: ethers.utils.Interface) => {
    for (let i = 0; i < abi.length; i++) {
        try {
            return iface.decodeFunctionData(abi[i].name, data).desc.guaranteedAmount;
        } catch (error) {
            continue;
        }
    }
    return 0;
};
