"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genelparaProxy = void 0;
const functions = require("firebase-functions");
const node_fetch_1 = require("node-fetch");
exports.genelparaProxy = functions.https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    try {
        const response = await (0, node_fetch_1.default)("https://api.genelpara.com/embed/doviz.json");
        if (!response.ok) {
            res.status(response.status).send("Upstream error");
            return;
        }
        const data = await response.json();
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).send("Proxy error");
    }
});
//# sourceMappingURL=genelparaProxy.js.map