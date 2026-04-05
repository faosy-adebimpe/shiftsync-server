const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Availability = sequelize.define(
  "Availability",
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
    dayOfWeek: {
      type: DataTypes.INTEGER, // 0 = Sunday, 1 = Monday, etc.
      allowNull: false,
      validate: {
        min: 0,
        max: 6,
      },
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    specificDate: {
      type: DataTypes.DATEONLY, // For one-off availability
      allowNull: true,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ["userId", "dayOfWeek"],
      },
      {
        fields: ["userId", "specificDate"],
      },
    ],
  },
);

module.exports = Availability;
