const express = require("express");
const { paymasterClient } = require("./config.js");
const { willSponsor } = require("./utils.js");

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.post("/paymaster", async (req, res) => {
    const { method, params } = req.body;
    const [userOp, entrypoint, chainId] = params;

    const willSponsorUserOp = await willSponsor({
        chainId: parseInt(chainId),
        entrypoint,
        userOp,
    });

    if (!willSponsorUserOp) {
        return res.json({ error: "Not a sponsorable operation" });
    }

    if (method === "pm_getPaymasterStubData") {
        try {
            const result = await paymasterClient.getPaymasterStubData({
                userOperation: userOp,
            });
            return res.json({ result });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    } else if (method === "pm_getPaymasterData") {
        try {
            const result = await paymasterClient.getPaymasterData({
                userOperation: userOp,
            });
            return res.json({ result });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    return res.json({ error: "Method not found" });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
