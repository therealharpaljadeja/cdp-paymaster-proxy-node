const { abi } = require("./L2ResolverABI");

const { ENTRYPOINT_ADDRESS_V06 } = require("permissionless");
const {
    decodeAbiParameters,
    decodeFunctionData,
    keccak256,
    namehash,
    encodePacked,
    createPublicClient,
    http,
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

function isChainIdBase(chainId) {
    return chainId === base.id;
}

function isEntrypointV6(entrypoint) {
    return entrypoint.toLowerCase() === ENTRYPOINT_ADDRESS_V06.toLowerCase();
}

async function isCoinbaseSmartWalletProxy(userOp) {
    const code = await client.getBytecode({ address: userOp.sender });
    return code == coinbaseSmartWalletProxyBytecode;
}

async function isCoinbaseWalletV1(userOp) {
    const implementation = await client.request({
        method: "eth_getStorageAt",
        params: [userOp.sender, erc1967ProxyImplementationSlot, "latest"],
    });

    const implementationAddress = decodeAbiParameters(
        [{ type: "address" }],
        implementation
    )[0];

    return implementationAddress == coinbaseSmartWalletV1Implementation;
}

function isCallExecuteBatch(userOp) {
    const calldata = decodeFunctionData({
        abi: coinbaseSmartWalletABI,
        data: userOp.callData,
    });

    // keys.coinbase.com always uses executeBatch
    if (calldata.functionName !== "executeBatch") return false;
    if (!calldata.args || calldata.args.length == 0) return false;

    return true;
}

function isBatchCall(userOp) {
    const calldata = decodeFunctionData({
        abi: coinbaseSmartWalletABI,
        data: userOp.callData,
    });

    const calls = calldata.args[0];
    // modify if want to allow batch calls to your contract
    if (calls.length > 2) return true;

    return false;
}

const convertChainIdToCoinType = (chainId) => {
    const cointype = (0x80000000 | chainId) >>> 0;
    return cointype.toString(16).toLocaleUpperCase();
};

const convertReverseNodeToBytes = (address, chainId) => {
    const addressFormatted = address.toLocaleLowerCase();
    const addressNode = keccak256(addressFormatted.substring(2));
    const chainCoinType = convertChainIdToCoinType(chainId);
    const baseReverseNode = namehash(
        `${chainCoinType.toLocaleUpperCase()}.reverse`
    );
    const addressReverseNode = keccak256(
        encodePacked(["bytes32", "bytes32"], [baseReverseNode, addressNode])
    );
    return addressReverseNode;
};

const getName = async ({ address, chain }) => {
    const chainIsBase = chain.id === base.id;

    let client = createPublicClient({
        chain: base,
        transport: http(),
    });

    if (chainIsBase) {
        const addressReverseNode = convertReverseNodeToBytes(address, base.id);
        const basename = await client.readContract({
            abi,
            address: "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD",
            functionName: "name",
            args: [addressReverseNode],
        });

        if (basename) {
            console.log("Basename", basename);
            return basename;
        }
    }

    return false;
};

async function willSponsor({ chainId, entrypoint, userOp }) {
    // check chain id
    if (!isChainIdBase(chainId)) return false;

    // check entrypoint
    // not strictly needed given below check on implementation address, but leaving as example
    if (!isEntrypointV6(entrypoint)) return false;

    try {
        // check the userOp.sender is a proxy with the expected bytecode
        if (!(await isCoinbaseSmartWalletProxy(userOp))) return false;

        // check that userOp.sender proxies to expected implementation
        if (!(await isCoinbaseWalletV1(userOp))) return false;

        // check that userOp.callData is making a call we want to sponsor
        if (!isCallExecuteBatch(userOp)) return false;

        // Does the userOp comprise of multiple calls
        if (isBatchCall(userOp)) return false;

        // Does the userOp sender hold a BaseName?
        if (!getName({ address: userOp.sender, chain: base })) return false;

        return true;
    } catch (e) {
        console.error(`willSponsor check failed: ${e}`);
        return false;
    }
}

module.exports = {
    willSponsor,
};
