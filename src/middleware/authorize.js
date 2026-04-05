const { User, ManagerLocation, UserLocation } = require("../models");

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
};

// Check if user is manager or admin
const requireManager = (req, res, next) => {
  if (!["admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({ error: "Manager access required." });
  }
  next();
};

// Check if user can access specific location
const requireLocationAccess = (locationId) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === "admin") {
        return next();
      }

      if (req.user.role === "manager") {
        const managerLocation = await ManagerLocation.findOne({
          where: { managerId: req.user.id, locationId },
        });

        if (!managerLocation) {
          return res
            .status(403)
            .json({ error: "Access denied to this location." });
        }

        return next();
      }

      if (req.user.role === "staff") {
        const userLocation = await UserLocation.findOne({
          where: { userId: req.user.id, locationId, isCertified: true },
        });

        if (!userLocation) {
          return res
            .status(403)
            .json({ error: "Access denied to this location." });
        }

        return next();
      }

      res.status(403).json({ error: "Access denied." });
    } catch (error) {
      res.status(500).json({ error: "Authorization check failed." });
    }
  };
};

// Check if user can manage specific staff member
const requireStaffManagementAccess = (staffId) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === "admin") {
        return next();
      }

      if (req.user.role === "manager") {
        // Managers can manage staff at their locations
        const staffLocations = await UserLocation.findAll({
          where: { userId: staffId, isCertified: true },
          attributes: ["locationId"],
        });

        const locationIds = staffLocations.map((ul) => ul.locationId);

        const managerLocations = await ManagerLocation.findAll({
          where: { managerId: req.user.id, locationId: locationIds },
          attributes: ["locationId"],
        });

        if (managerLocations.length === 0) {
          return res
            .status(403)
            .json({ error: "Cannot manage this staff member." });
        }

        return next();
      }

      res.status(403).json({ error: "Access denied." });
    } catch (error) {
      res.status(500).json({ error: "Authorization check failed." });
    }
  };
};

module.exports = {
  requireAdmin,
  requireManager,
  requireLocationAccess,
  requireStaffManagementAccess,
};
