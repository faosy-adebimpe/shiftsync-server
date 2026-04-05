const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserLocation = sequelize.define(
  "UserLocation",
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
    locationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Locations",
        key: "id",
      },
    },
    isCertified: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    certifiedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "locationId"],
      },
    ],
  },
);

module.exports = UserLocation;
