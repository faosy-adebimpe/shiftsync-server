const express = require("express");
const AuthController = require("../controllers/authController");
const authenticate = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/login", AuthController.login);
router.post("/register", AuthController.register);

// Protected routes
router.get("/profile", authenticate, AuthController.getProfile);
router.put("/profile", authenticate, AuthController.updateProfile);

module.exports = router;
