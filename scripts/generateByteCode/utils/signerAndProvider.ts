import "dotenv/config";
import { ethers } from "ethers";

export const provider = new ethers.providers.JsonRpcProvider(process.env.RPC);
export const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);
