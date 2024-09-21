const { createClient, createPublicClient, http } = require("viem");
const { base } = require("viem/chains");
const { ENTRYPOINT_ADDRESS_V06 } = require("permissionless");
const { paymasterActionsEip7677 } = require("permissionless/experimental");

const client = createPublicClient({
    chain: base,
    transport: http(process.env.PAYMASTER_SERVICE_URL),
});

const paymasterService = process.env.PAYMASTER_SERVICE_URL;

const paymasterClient = createClient({
    chain: base,
    transport: http(paymasterService),
}).extend(paymasterActionsEip7677(ENTRYPOINT_ADDRESS_V06));

module.exports = {
    client,
    paymasterClient,
};
