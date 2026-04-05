const jwt = require("jsonwebtoken");
const { User } = require("../models");

class AuthService {
  static generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );
  }

  static async login(email, password) {
    const user = await User.findOne({ where: { email, isActive: true } });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        timezone: user.timezone,
      },
      token,
    };
  }

  static async register(userData) {
    const { email, password, firstName, lastName, role = "staff" } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
    });

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
    };
  }
}

module.exports = AuthService;
