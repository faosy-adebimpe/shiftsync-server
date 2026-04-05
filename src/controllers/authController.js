const AuthService = require("../services/authService");

class AuthController {
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const result = await AuthService.login(email, password);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  static async register(req, res) {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Only admins can create admin/manager accounts
      if (
        role &&
        ["admin", "manager"].includes(role) &&
        req.user.role !== "admin"
      ) {
        return res
          .status(403)
          .json({ error: "Insufficient permissions to create this role" });
      }

      const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        role: role || "staff",
      });

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = req.user;
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        timezone: user.timezone,
        desiredHoursPerWeek: user.desiredHoursPerWeek,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get profile" });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { firstName, lastName, phone, timezone, desiredHoursPerWeek } =
        req.body;
      const user = req.user;

      await user.update({
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        phone: phone || user.phone,
        timezone: timezone || user.timezone,
        desiredHoursPerWeek: desiredHoursPerWeek || user.desiredHoursPerWeek,
      });

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        timezone: user.timezone,
        desiredHoursPerWeek: user.desiredHoursPerWeek,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
}

module.exports = AuthController;
