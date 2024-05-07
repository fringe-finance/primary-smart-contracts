import { ethers } from "ethers";

export const loadContractInstance = (address: string, abi: any, signerOrProvider: any) => {
    return new ethers.Contract(address, new ethers.utils.Interface(abi), signerOrProvider);
};
