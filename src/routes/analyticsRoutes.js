const express = require("express");
const router = express.Router();

// TODO: Implement analytics routes
router.get("/", (req, res) => res.json({ message: "Analytics endpoint" }));

module.exports = router;
