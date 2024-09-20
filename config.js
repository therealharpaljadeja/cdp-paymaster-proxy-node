const { createClient, createPublicClient, http } = require("viem");
const { baseSepolia } = require("viem/chains");
const { ENTRYPOINT_ADDRESS_V06 } = require("permissionless");
const { paymasterActionsEip7677 } = require("permissionless/experimental");

const client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
});

const paymasterService = process.env.PAYMASTER_SERVICE_URL;

const paymasterClient = createClient({
    chain: baseSepolia,
    transport: http(paymasterService),
}).extend(paymasterActionsEip7677(ENTRYPOINT_ADDRESS_V06));

module.exports = {
    client,
    paymasterClient,
};
