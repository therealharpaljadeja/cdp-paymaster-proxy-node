const { ENTRYPOINT_ADDRESS_V06, UserOperation } = require("permissionless");
const {
    Address,
    BlockTag,
    Hex,
    decodeAbiParameters,
    decodeFunctionData,
} = require("viem");
const { base } = require("viem/chains");
const { client } = require("./config");
const {
    coinbaseSmartWalletABI,
    coinbaseSmartWalletProxyBytecode,
    coinbaseSmartWalletV1Implementation,
    erc1967ProxyImplementationSlot,
    magicSpendAddress,
} = require("./constants");

async function willSponsor({ chainId, entrypoint, userOp }) {
    // check chain id
    if (chainId !== base.id) return false;
    // check entrypoint
    // not strictly needed given below check on implementation address, but leaving as example
    if (entrypoint.toLowerCase() !== ENTRYPOINT_ADDRESS_V06.toLowerCase())
        return false;

    try {
        // check the userOp.sender is a proxy with the expected bytecode
        const code = await client.getBytecode({ address: userOp.sender });
        if (code != coinbaseSmartWalletProxyBytecode) return false;

        // check that userOp.sender proxies to expected implementation
        const implementation = await client.request({
            method: "eth_getStorageAt",
            params: [userOp.sender, erc1967ProxyImplementationSlot, "latest"],
        });
        const implementationAddress = decodeAbiParameters(
            [{ type: "address" }],
            implementation
        )[0];
        if (implementationAddress != coinbaseSmartWalletV1Implementation)
            return false;

        // check that userOp.callData is making a call we want to sponsor
        const calldata = decodeFunctionData({
            abi: coinbaseSmartWalletABI,
            data: userOp.callData,
        });

        // keys.coinbase.com always uses executeBatch
        if (calldata.functionName !== "executeBatch") return false;
        if (!calldata.args || calldata.args.length == 0) return false;

        const calls = calldata.args[0];
        // modify if want to allow batch calls to your contract
        if (calls.length > 2) return false;

        let callToCheckIndex = 0;
        if (calls.length > 1) {
            // if there is more than one call, check if the first is a magic spend call
            if (
                calls[0].target.toLowerCase() !==
                magicSpendAddress.toLowerCase()
            )
                return false;
            callToCheckIndex = 1;
        }

        return true;
    } catch (e) {
        console.error(`willSponsor check failed: ${e}`);
        return false;
    }
}

module.exports = {
    willSponsor,
};
