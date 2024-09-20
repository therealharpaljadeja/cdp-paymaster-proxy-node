const express = require("express");
const cors = require("cors");
const { paymasterClient } = require("./config.js");
const { willSponsor } = require("./utils.js");

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        // if (!origin) return callback(null, true);

        // List of allowed origins
        const allowedOrigins = [
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "http://localhost:5001",
            "http://127.0.0.1:5001",
        ];
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["POST"], // Allow only POST method
};

// Apply CORS middleware
app.use(cors(corsOptions));

app.use(express.json());

app.post("/paymaster", async (req, res) => {
    const { method, params } = req.body;
    const [userOp, entrypoint, chainId] = params;

    // if (!willSponsor({ chainId: parseInt(chainId), entrypoint, userOp })) {
    //     return res.json({ error: "Not a sponsorable operation" });
    // }

    console.log("userOp", userOp);
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
            console.log("Result", result);
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
