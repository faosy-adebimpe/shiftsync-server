const { Availability } = require("../models");

class AvailabilityController {
  static async getAvailability(req, res) {
    try {
      const userId = req.user.id;

      const availabilities = await Availability.findAll({
        where: { userId, isAvailable: true },
        order: [
          ["dayOfWeek", "ASC"],
          ["startTime", "ASC"],
        ],
      });

      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      const windows = availabilities.map((avail) => ({
        day: dayNames[avail.dayOfWeek],
        start: avail.startTime,
        end: avail.endTime,
      }));

      res.json(windows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async saveAvailability(req, res) {
    try {
      const userId = req.user.id;
      const { windows } = req.body;

      // Delete existing availability
      await Availability.destroy({ where: { userId } });

      // Map day names to numbers
      const dayMap = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };

      // Insert new availability
      const availabilityData = windows.map((window) => ({
        userId,
        dayOfWeek: dayMap[window.day],
        startTime: window.start,
        endTime: window.end,
        isRecurring: true,
        isAvailable: true,
      }));

      await Availability.bulkCreate(availabilityData);

      res.json(windows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AvailabilityController;
