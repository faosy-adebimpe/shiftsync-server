const express = require("express");
const ShiftController = require("../controllers/shiftController");
const authenticate = require("../middleware/auth");
const {
  requireManager,
  requireLocationAccess,
} = require("../middleware/authorize");

const router = express.Router();

// All shift routes require authentication
router.use(authenticate);

// Create shift (managers only)
router.post(
  "/locations/:locationId/shifts",
  requireManager,
  requireLocationAccess(":locationId"),
  ShiftController.createShift,
);

// Get shifts for a location
router.get(
  "/locations/:locationId/shifts",
  requireLocationAccess(":locationId"),
  ShiftController.getShifts,
);

// Get specific shift
router.get("/:shiftId", ShiftController.getShift);

// Update shift (managers only)
router.put("/:shiftId", requireManager, ShiftController.updateShift);

// Delete shift (managers only)
router.delete("/:shiftId", requireManager, ShiftController.deleteShift);

// Assign staff to shift (managers only)
router.post("/:shiftId/assign", requireManager, ShiftController.assignStaff);

// Get eligible staff for shift (managers only)
router.get(
  "/:shiftId/eligible",
  requireManager,
  ShiftController.getEligibleStaff,
);

// Unassign staff from shift (managers only)
router.delete(
  "/:shiftId/assign/:userId",
  requireManager,
  ShiftController.unassignStaff,
);

// Publish/unpublish schedule (managers only)
router.post(
  "/locations/:locationId/publish",
  requireManager,
  requireLocationAccess(":locationId"),
  ShiftController.publishSchedule,
);
router.post(
  "/locations/:locationId/unpublish",
  requireManager,
  requireLocationAccess(":locationId"),
  ShiftController.unpublishSchedule,
);

module.exports = router;
