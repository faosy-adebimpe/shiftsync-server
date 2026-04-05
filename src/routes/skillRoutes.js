const express = require("express");
const router = express.Router();

// TODO: Implement skill routes
router.get("/", (req, res) => res.json({ message: "Skills endpoint" }));

module.exports = router;
