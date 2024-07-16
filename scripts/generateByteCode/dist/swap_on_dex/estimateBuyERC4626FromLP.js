"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateBuyERC4626FromLP = void 0;
const ERC4626_1 = require("../abis/ERC4626");
const loadContract_1 = require("../utils/loadContract");
const estimateBuyERC20FromLP_1 = require("./estimateBuyERC20FromLP");
const helpers_1 = require("../utils/helpers");
const estimateBuyERC4626FromLP = (lpAddress, erc4626Address, erc4626ExpectedAmount, receiver, maxDiscrepancy, chainId, dexType, pairType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const erc4626Instance = (0, loadContract_1.loadContractInstance)(erc4626Address, ERC4626_1.ERC4626_ABI, provider);
    const erc20Address = yield erc4626Instance.asset();
    const erc20ExpectedAmount = yield erc4626Instance.convertToAssets(erc4626ExpectedAmount);
    return (0, estimateBuyERC20FromLP_1.estimateBuyERC20FromLP)(lpAddress, erc20Address, (0, helpers_1.toBN)(erc20ExpectedAmount), receiver, maxDiscrepancy, chainId, dexType, pairType, provider);
});
exports.estimateBuyERC4626FromLP = estimateBuyERC4626FromLP;
