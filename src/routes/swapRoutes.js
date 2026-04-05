const express = require("express");
const router = express.Router();

// TODO: Implement swap routes
router.get("/", (req, res) => res.json({ message: "Swaps endpoint" }));

module.exports = router;
