const express = require("express");
const { Location, UserLocation } = require("../models");
const authenticate = require("../middleware/auth");

const router = express.Router();

// All location routes require authentication
router.use(authenticate);

// Get locations accessible to the user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;

    const userLocations = await UserLocation.findAll({
      where: { userId },
      include: [{ model: Location, as: "location" }],
    });

    const locations = userLocations.map((ul) => ({
      id: ul.location.id,
      name: ul.location.name,
      timezone: ul.location.timezone,
    }));

    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
