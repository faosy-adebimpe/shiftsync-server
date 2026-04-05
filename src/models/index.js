const sequelize = require("../config/database");

// Import models
const User = require("./User");
const Location = require("./Location");
const Skill = require("./Skill");
const Shift = require("./Shift");
const ShiftAssignment = require("./ShiftAssignment");
const Availability = require("./Availability");
const UserSkill = require("./UserSkill");
const UserLocation = require("./UserLocation");
const ManagerLocation = require("./ManagerLocation");
const SwapRequest = require("./SwapRequest");
const Notification = require("./Notification");
const AuditLog = require("./AuditLog");

// Define associations

// User associations
User.belongsToMany(Skill, {
  through: UserSkill,
  foreignKey: "userId",
  as: "skills",
});
User.belongsToMany(Location, {
  through: UserLocation,
  foreignKey: "userId",
  as: "certifiedLocations",
});
User.belongsToMany(Location, {
  through: ManagerLocation,
  foreignKey: "managerId",
  as: "managedLocations",
});
User.belongsToMany(Shift, {
  through: ShiftAssignment,
  foreignKey: "userId",
  otherKey: "shiftId",
  as: "assignedShifts",
});

// Location associations
Location.belongsToMany(User, {
  through: UserLocation,
  foreignKey: "locationId",
  as: "certifiedStaff",
});
Location.belongsToMany(User, {
  through: ManagerLocation,
  foreignKey: "locationId",
  as: "managers",
});
Location.hasMany(Shift, { foreignKey: "locationId", as: "shifts" });

// Skill associations
Skill.belongsToMany(User, {
  through: UserSkill,
  foreignKey: "skillId",
  as: "users",
});
Skill.hasMany(Shift, { foreignKey: "skillId", as: "shifts" });

// Shift associations
Shift.belongsTo(Location, { foreignKey: "locationId", as: "location" });
Shift.belongsTo(Skill, { foreignKey: "skillId", as: "skill" });
Shift.belongsToMany(User, {
  through: ShiftAssignment,
  foreignKey: "shiftId",
  otherKey: "userId",
  as: "assignedUsers",
});
Shift.hasMany(ShiftAssignment, { foreignKey: "shiftId", as: "assignments" });
Shift.hasMany(SwapRequest, { foreignKey: "shiftId", as: "swapRequests" });

// ShiftAssignment associations
ShiftAssignment.belongsTo(Shift, { foreignKey: "shiftId", as: "shift" });
ShiftAssignment.belongsTo(User, { foreignKey: "userId", as: "user" });
ShiftAssignment.belongsTo(User, {
  foreignKey: "assignedBy",
  as: "assignedByUser",
});

// Availability associations
Availability.belongsTo(User, { foreignKey: "userId", as: "user" });

// UserSkill associations
UserSkill.belongsTo(User, { foreignKey: "userId", as: "user" });
UserSkill.belongsTo(Skill, { foreignKey: "skillId", as: "skill" });

// UserLocation associations
UserLocation.belongsTo(User, { foreignKey: "userId", as: "user" });
UserLocation.belongsTo(Location, { foreignKey: "locationId", as: "location" });

// ManagerLocation associations
ManagerLocation.belongsTo(User, { foreignKey: "managerId", as: "manager" });
ManagerLocation.belongsTo(Location, {
  foreignKey: "locationId",
  as: "location",
});

// SwapRequest associations
SwapRequest.belongsTo(Shift, { foreignKey: "shiftId", as: "shift" });
SwapRequest.belongsTo(User, { foreignKey: "requesterId", as: "requester" });
SwapRequest.belongsTo(User, { foreignKey: "targetUserId", as: "targetUser" });
SwapRequest.belongsTo(User, { foreignKey: "approvedBy", as: "approvedByUser" });

// Notification associations
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });

// AuditLog associations
AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });
AuditLog.belongsTo(Location, { foreignKey: "locationId", as: "location" });

module.exports = {
  sequelize,
  User,
  Location,
  Skill,
  Shift,
  ShiftAssignment,
  Availability,
  UserSkill,
  UserLocation,
  ManagerLocation,
  SwapRequest,
  Notification,
  AuditLog,
};
