const ShiftService = require("../services/shiftService");
const { Shift, ShiftAssignment, User, Location, Skill } = require("../models");
const { Op } = require("sequelize");
const moment = require("moment-timezone");

class ShiftController {
  static async createShift(req, res) {
    try {
      const shiftData = req.body;
      shiftData.locationId = req.params.locationId;

      const shift = await ShiftService.createShift(shiftData, req.user.id);

      // Notify location about new shift
      const socketService = req.app.get("socketService");
      if (socketService) {
        socketService.notifyLocation(shift.locationId, "shift_created", {
          shift: shift.toJSON(),
          createdBy: req.user.id,
        });
      }

      res.status(201).json(shift);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getShifts(req, res) {
    try {
      const { locationId } = req.params;
      const { startDate, endDate, skillId, isPublished } = req.query;

      const whereClause = { locationId };

      if (startDate && endDate) {
        whereClause.startTime = {
          [Op.gte]: moment(startDate).startOf("day").toDate(),
          [Op.lt]: moment(endDate).endOf("day").toDate(),
        };
      }

      if (skillId) {
        whereClause.skillId = skillId;
      }

      if (isPublished !== undefined) {
        whereClause.isPublished = isPublished === "true";
      }

      const shifts = await Shift.findAll({
        where: whereClause,
        include: [
          { model: Location, as: "location" },
          { model: Skill, as: "skill" },
          {
            model: User,
            as: "assignedUsers",
            through: { attributes: [] },
            attributes: ["id", "firstName", "lastName"],
          },
        ],
        order: [["startTime", "ASC"]],
      });

      res.json(shifts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get shifts" });
    }
  }

  static async getShift(req, res) {
    try {
      const { shiftId } = req.params;

      const shift = await Shift.findByPk(shiftId, {
        include: [
          { model: Location, as: "location" },
          { model: Skill, as: "skill" },
          {
            model: User,
            as: "assignedUsers",
            through: { attributes: [] },
            attributes: ["id", "firstName", "lastName", "email"],
          },
          {
            model: ShiftAssignment,
            as: "assignments",
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "firstName", "lastName"],
              },
              {
                model: User,
                as: "assignedByUser",
                attributes: ["id", "firstName", "lastName"],
              },
            ],
          },
        ],
      });

      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }

      res.json(shift);
    } catch (error) {
      res.status(500).json({ error: "Failed to get shift" });
    }
  }

  static async updateShift(req, res) {
    try {
      const { shiftId } = req.params;
      const updateData = req.body;

      const shift = await Shift.findByPk(shiftId);
      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }

      // Check if can be edited
      if (shift.isPublished && !shift.canBeEdited()) {
        return res
          .status(400)
          .json({ error: "Cannot edit published shift within cutoff period" });
      }

      const oldValues = shift.toJSON();
      await shift.update(updateData);

      // Notify about shift update
      const socketService = req.app.get("socketService");
      if (socketService) {
        const affectedUsers = await ShiftAssignment.findAll({
          where: { shiftId },
          attributes: ["userId"],
        }).then((assignments) => assignments.map((a) => a.userId));

        await socketService.notifyShiftUpdate(
          shiftId,
          shift.locationId,
          "changed",
          {
            title: "Shift Updated",
            message: `Shift on ${moment(shift.startTime).format("MMM D, h:mm A")} has been updated`,
            affectedUsers,
            oldValues,
            newValues: shift.toJSON(),
          },
        );
      }

      res.json(shift);
    } catch (error) {
      res.status(500).json({ error: "Failed to update shift" });
    }
  }

  static async deleteShift(req, res) {
    try {
      const { shiftId } = req.params;

      const shift = await Shift.findByPk(shiftId);
      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }

      // Check if can be edited
      if (shift.isPublished && !shift.canBeEdited()) {
        return res.status(400).json({
          error: "Cannot delete published shift within cutoff period",
        });
      }

      await shift.destroy();

      // Notify about shift deletion
      const socketService = req.app.get("socketService");
      if (socketService) {
        const affectedUsers = await ShiftAssignment.findAll({
          where: { shiftId },
          attributes: ["userId"],
        }).then((assignments) => assignments.map((a) => a.userId));

        await io.notifyShiftUpdate(shiftId, shift.locationId, "deleted", {
          title: "Shift Cancelled",
          message: `Shift on ${moment(shift.startTime).format("MMM D, h:mm A")} has been cancelled`,
          affectedUsers,
        });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete shift" });
    }
  }

  static async assignStaff(req, res) {
    try {
      const { shiftId } = req.params;
      const { userId } = req.body;

      const assignment = await ShiftService.assignStaffToShift(
        shiftId,
        userId,
        req.user.id,
      );

      // Notify user about assignment
      const socketService = req.app.get("socketService");
      if (socketService) {
        await socketService.notifyShiftUpdate(
          shiftId,
          assignment.shift.locationId,
          "assigned",
          {
            title: "Shift Assigned",
            message: `You have been assigned to a shift on ${moment(assignment.shift.startTime).format("MMM D, h:mm A")}`,
            affectedUsers: [userId],
          },
        );
      }

      res.status(201).json(assignment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async unassignStaff(req, res) {
    try {
      const { shiftId, userId } = req.params;

      const assignment = await ShiftAssignment.findOne({
        where: { shiftId, userId },
        include: [{ model: Shift, as: "shift" }],
      });

      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      const shift = assignment.shift;

      // Check if can be edited
      if (shift.isPublished && !shift.canBeEdited()) {
        return res.status(400).json({
          error: "Cannot modify published shift within cutoff period",
        });
      }

      await assignment.destroy();
      await shift.decrement("assignedStaff");

      // Notify user about unassignment
      const socketService = req.app.get("socketService");
      if (socketService) {
        await socketService.notifyShiftUpdate(
          shiftId,
          shift.locationId,
          "unassigned",
          {
            title: "Shift Unassigned",
            message: `You have been unassigned from a shift on ${moment(shift.startTime).format("MMM D, h:mm A")}`,
            affectedUsers: [userId],
          },
        );
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to unassign staff" });
    }
  }

  static async publishSchedule(req, res) {
    try {
      const { locationId } = req.params;
      const { weekStart } = req.body;

      const startDate = moment(weekStart).startOf("isoWeek");
      const endDate = startDate.clone().endOf("isoWeek");

      const shifts = await Shift.findAll({
        where: {
          locationId,
          startTime: {
            [Op.gte]: startDate.toDate(),
            [Op.lt]: endDate.toDate(),
          },
          isPublished: false,
        },
      });

      for (const shift of shifts) {
        await shift.update({ isPublished: true });
      }

      // Notify all staff about published schedule
      const socketService = req.app.get("socketService");
      if (socketService) {
        socketService.notifyLocation(locationId, "schedule_published", {
          weekStart: startDate.format(),
          publishedBy: req.user.id,
          shiftCount: shifts.length,
        });
      }

      res.json({ message: `Published ${shifts.length} shifts` });
    } catch (error) {
      res.status(500).json({ error: "Failed to publish schedule" });
    }
  }

  static async unpublishSchedule(req, res) {
    try {
      const { locationId } = req.params;
      const { weekStart } = req.body;

      const startDate = moment(weekStart).startOf("isoWeek");
      const endDate = startDate.clone().endOf("isoWeek");

      const shifts = await Shift.findAll({
        where: {
          locationId,
          startTime: {
            [Op.gte]: startDate.toDate(),
            [Op.lt]: endDate.toDate(),
          },
          isPublished: true,
        },
      });

      for (const shift of shifts) {
        if (shift.canBeEdited()) {
          await shift.update({ isPublished: false });
        }
      }

      res.json({ message: "Schedule unpublished where possible" });
    } catch (error) {
      res.status(500).json({ error: "Failed to unpublish schedule" });
    }
  }

  static async getEligibleStaff(req, res) {
    try {
      const { shiftId } = req.params;

      const shift = await Shift.findByPk(shiftId, {
        include: [{ model: Skill, as: "skill" }],
      });

      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }

      // Get users with the required skill and location access
      const { User, UserSkill, UserLocation } = require("../models");

      const eligibleUsers = await User.findAll({
        include: [
          {
            model: UserSkill,
            where: { skillId: shift.skillId },
            required: true,
          },
          {
            model: UserLocation,
            where: { locationId: shift.locationId },
            required: true,
          },
        ],
      });

      const staff = eligibleUsers.map((user) => ({
        id: user.id,
        name: user.name,
        skill: shift.skill.name,
      }));

      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ShiftController;
