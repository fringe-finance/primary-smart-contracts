# SignatureChecker







*Signature verification helper: Provide a single mechanism to verify both private-key (EOA) ECDSA signature and ERC1271 contract sigantures. Using this instead of ECDSA.recover in your contract will make them compatible with smart contract wallets such as Argent and Gnosis. Note: unlike ECDSA signatures, contract signature&#39;s are revocable, and the outcome of this function can thus change through time. It could return true at block N and false at block N+1 (or the opposite). _Available since v4.1._*



