const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const moment = require("moment-timezone");

const Shift = sequelize.define(
  "Shift",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    locationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Locations",
        key: "id",
      },
    },
    skillId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Skills",
        key: "id",
      },
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    requiredStaff: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    assignedStaff: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    publishCutoffHours: {
      type: DataTypes.INTEGER,
      defaultValue: 48, // hours before shift
    },
    notes: {
      type: DataTypes.TEXT,
    },
    isPremium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ["locationId", "startTime"],
      },
      {
        fields: ["skillId"],
      },
    ],
  },
);

// Virtual fields
Shift.prototype.getDuration = function () {
  return moment(this.endTime).diff(moment(this.startTime), "hours", true);
};

Shift.prototype.isOvernight = function () {
  const start = moment(this.startTime);
  const end = moment(this.endTime);
  return end.isBefore(start, "day");
};

Shift.prototype.canBeEdited = function () {
  const now = moment();
  const cutoff = moment(this.startTime).subtract(
    this.publishCutoffHours,
    "hours",
  );
  return now.isBefore(cutoff);
};

module.exports = Shift;
