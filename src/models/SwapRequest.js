const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SwapRequest = sequelize.define(
  "SwapRequest",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    shiftId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Shifts",
        key: "id",
      },
    },
    requesterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    targetUserId: {
      type: DataTypes.UUID, // For swap requests
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
    type: {
      type: DataTypes.ENUM("swap", "drop"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "expired",
      ),
      defaultValue: "pending",
    },
    requestedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ["shiftId", "status"],
      },
      {
        fields: ["requesterId", "status"],
      },
      {
        fields: ["targetUserId", "status"],
      },
    ],
  },
);

module.exports = SwapRequest;
