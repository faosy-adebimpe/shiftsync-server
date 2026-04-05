const express = require("express");
const AvailabilityController = require("../controllers/availabilityController");
const authenticate = require("../middleware/auth");

const router = express.Router();

// All availability routes require authentication
router.use(authenticate);

// Get user's availability
router.get("/", AvailabilityController.getAvailability);

// Save user's availability
router.post("/", AvailabilityController.saveAvailability);

module.exports = router;
