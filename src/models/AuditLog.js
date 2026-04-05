const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    action: {
      type: DataTypes.ENUM(
        "shift_created",
        "shift_updated",
        "shift_deleted",
        "shift_assigned",
        "shift_unassigned",
        "schedule_published",
        "schedule_unpublished",
        "swap_approved",
        "swap_rejected",
        "user_created",
        "user_updated",
        "location_created",
        "location_updated",
      ),
      allowNull: false,
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: false, // 'shift', 'user', 'location', etc.
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    locationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "Locations",
        key: "id",
      },
    },
    oldValues: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    newValues: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
    },
    userAgent: {
      type: DataTypes.TEXT,
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ["userId", "createdAt"],
      },
      {
        fields: ["entityType", "entityId"],
      },
      {
        fields: ["locationId", "createdAt"],
      },
    ],
  },
);

module.exports = AuditLog;
