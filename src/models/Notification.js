const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notification = sequelize.define(
  "Notification",
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
    type: {
      type: DataTypes.ENUM(
        "shift_assigned",
        "shift_changed",
        "shift_cancelled",
        "swap_request",
        "swap_approved",
        "swap_rejected",
        "drop_request",
        "schedule_published",
        "overtime_warning",
        "fairness_alert",
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    relatedId: {
      type: DataTypes.UUID, // ID of related entity (shift, swap, etc.)
      allowNull: true,
    },
    relatedType: {
      type: DataTypes.STRING, // 'shift', 'swap', etc.
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB, // Additional data
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ["userId", "isRead"],
      },
      {
        fields: ["userId", "createdAt"],
      },
    ],
  },
);

module.exports = Notification;
