const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const locationRoutes = require("./locationRoutes");
const shiftRoutes = require("./shiftRoutes");
const skillRoutes = require("./skillRoutes");
const swapRoutes = require("./swapRoutes");
const notificationRoutes = require("./notificationRoutes");
const analyticsRoutes = require("./analyticsRoutes");
const availabilityRoutes = require("./availabilityRoutes");

const router = express.Router();

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/locations", locationRoutes);
router.use("/shifts", shiftRoutes);
router.use("/skills", skillRoutes);
router.use("/swaps", swapRoutes);
router.use("/notifications", notificationRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/availability", availabilityRoutes);

module.exports = router;
