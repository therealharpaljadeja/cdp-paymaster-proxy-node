const coinbaseSmartWalletProxyBytecode =
    "0x363d3d373d3d363d7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc545af43d6000803e6038573d6000fd5b3d6000f3";
const coinbaseSmartWalletV1Implementation =
    "0x000100abaad02f1cfC8Bbe32bD5a564817339E72";
const magicSpendAddress = "0x011A61C07DbF256A68256B1cB51A5e246730aB92";
const erc1967ProxyImplementationSlot =
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

const coinbaseSmartWalletABI = [
    {
        type: "function",
        name: "executeBatch",
        inputs: [
            {
                name: "calls",
                type: "tuple[]",
                internalType: "struct CoinbaseSmartWallet.Call[]",
                components: [
                    {
                        name: "target",
                        type: "address",
                        internalType: "address",
                    },
                    {
                        name: "value",
                        type: "uint256",
                        internalType: "uint256",
                    },
                    {
                        name: "data",
                        type: "bytes",
                        internalType: "bytes",
                    },
                ],
            },
        ],
        outputs: [],
        stateMutability: "payable",
    },
];

module.exports = {
    coinbaseSmartWalletProxyBytecode,
    coinbaseSmartWalletV1Implementation,
    magicSpendAddress,
    erc1967ProxyImplementationSlot,
    coinbaseSmartWalletABI,
};
