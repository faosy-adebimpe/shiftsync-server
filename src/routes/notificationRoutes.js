const express = require("express");
const NotificationController = require("../controllers/notificationController");
const authenticate = require("../middleware/auth");

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// Get user's notifications
router.get("/", NotificationController.getNotifications);

// Mark notification as read
router.post("/:notificationId/read", NotificationController.markRead);

module.exports = router;
