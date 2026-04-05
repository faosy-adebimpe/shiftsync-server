const { Op } = require("sequelize");
const moment = require("moment-timezone");
const {
  Shift,
  ShiftAssignment,
  User,
  Availability,
  UserSkill,
  UserLocation,
  SwapRequest,
  AuditLog,
} = require("../models");

class ShiftService {
  static async createShift(shiftData, createdBy) {
    const { locationId, skillId, startTime, endTime, requiredStaff, notes } =
      shiftData;

    // Validate times
    const start = moment(startTime);
    const end = moment(endTime);

    if (!end.isAfter(start)) {
      throw new Error("End time must be after start time");
    }

    // Check if shift is premium (Friday/Saturday evening)
    const dayOfWeek = start.day();
    const hour = start.hour();
    const isPremium = (dayOfWeek === 5 || dayOfWeek === 6) && hour >= 17; // Friday/Saturday after 5pm

    const shift = await Shift.create({
      locationId,
      skillId,
      startTime,
      endTime,
      requiredStaff,
      notes,
      isPremium,
    });

    // Audit log
    await AuditLog.create({
      userId: createdBy,
      action: "shift_created",
      entityType: "shift",
      entityId: shift.id,
      locationId,
      newValues: shiftData,
    });

    return shift;
  }

  static async assignStaffToShift(shiftId, userId, assignedBy) {
    const shift = await Shift.findByPk(shiftId, {
      include: [
        { model: require("../models").Location, as: "location" },
        { model: require("../models").Skill, as: "skill" },
      ],
    });

    if (!shift) {
      throw new Error("Shift not found");
    }

    // Check if shift is published and can be edited
    if (shift.isPublished && !shift.canBeEdited()) {
      throw new Error("Cannot modify published shift within cutoff period");
    }

    // Check if user has required skill
    const userSkill = await UserSkill.findOne({
      where: { userId, skillId: shift.skillId },
    });

    if (!userSkill) {
      throw new Error("Staff member does not have required skill");
    }

    // Check if user is certified for location
    const userLocation = await UserLocation.findOne({
      where: { userId, locationId: shift.locationId, isCertified: true },
    });

    if (!userLocation) {
      throw new Error("Staff member is not certified for this location");
    }

    // Check availability
    const isAvailable = await this.checkStaffAvailability(
      userId,
      shift.startTime,
      shift.endTime,
    );
    if (!isAvailable) {
      throw new Error("Staff member is not available during this time");
    }

    // Check for conflicts
    const conflicts = await this.checkShiftConflicts(
      userId,
      shift.startTime,
      shift.endTime,
      shiftId,
    );
    if (conflicts.length > 0) {
      throw new Error("Staff member has conflicting shifts");
    }

    // Check overtime
    const overtimeCheck = await this.checkOvertimeLimits(
      userId,
      shift.startTime,
      shift.endTime,
    );
    if (!overtimeCheck.allowed) {
      throw new Error(overtimeCheck.message);
    }

    // Check if shift is already full
    const currentAssignments = await ShiftAssignment.count({
      where: { shiftId },
    });
    if (currentAssignments >= shift.requiredStaff) {
      throw new Error("Shift is already fully staffed");
    }

    // Create assignment
    const assignment = await ShiftAssignment.create({
      shiftId,
      userId,
      assignedBy,
    });

    // Update assigned count
    await shift.increment("assignedStaff");

    // Cancel any pending swap requests for this shift
    await SwapRequest.update(
      { status: "cancelled" },
      { where: { shiftId, status: "pending" } },
    );

    // Audit log
    await AuditLog.create({
      userId: assignedBy,
      action: "shift_assigned",
      entityType: "shift",
      entityId: shiftId,
      locationId: shift.locationId,
      newValues: { userId, assignedBy },
    });

    return assignment;
  }

  static async checkStaffAvailability(userId, startTime, endTime) {
    const start = moment(startTime);
    const end = moment(endTime);
    const dayOfWeek = start.day();

    // Check recurring availability
    const recurringAvailability = await Availability.findAll({
      where: {
        userId,
        dayOfWeek,
        isRecurring: true,
        isAvailable: true,
      },
    });

    // Check specific date availability
    const specificAvailability = await Availability.findAll({
      where: {
        userId,
        specificDate: start.format("YYYY-MM-DD"),
        isAvailable: true,
      },
    });

    const allAvailability = [...recurringAvailability, ...specificAvailability];

    for (const avail of allAvailability) {
      const availStart = moment(
        `${start.format("YYYY-MM-DD")} ${avail.startTime}`,
      );
      const availEnd = moment(`${start.format("YYYY-MM-DD")} ${avail.endTime}`);

      if (availEnd.isBefore(availStart)) {
        availEnd.add(1, "day"); // Handle overnight availability
      }

      if (
        start.isBetween(availStart, availEnd, null, "[)") &&
        end.isBetween(availStart, availEnd, null, "(]")
      ) {
        return true;
      }
    }

    return false;
  }

  static async checkShiftConflicts(
    userId,
    startTime,
    endTime,
    excludeShiftId = null,
  ) {
    const start = moment(startTime);
    const end = moment(endTime);

    const whereClause = {
      userId,
      [Op.or]: [
        {
          startTime: { [Op.lt]: end.toDate() },
          endTime: { [Op.gt]: start.toDate() },
        },
      ],
    };

    if (excludeShiftId) {
      whereClause.id = { [Op.ne]: excludeShiftId };
    }

    const assignments = await ShiftAssignment.findAll({
      where: whereClause,
      include: [{ model: Shift, as: "shift" }],
    });

    return assignments;
  }

  static async checkOvertimeLimits(userId, startTime, endTime) {
    const start = moment(startTime);
    const end = moment(endTime);
    const duration = end.diff(start, "hours");

    // Get week start (Monday)
    const weekStart = start.clone().startOf("isoWeek");
    const weekEnd = weekStart.clone().endOf("isoWeek");

    // Get existing assignments for the week
    const weeklyAssignments = await ShiftAssignment.findAll({
      where: { userId },
      include: [
        {
          model: Shift,
          as: "shift",
          where: {
            startTime: {
              [Op.gte]: weekStart.toDate(),
              [Op.lt]: weekEnd.toDate(),
            },
          },
        },
      ],
    });

    let weeklyHours = duration;
    let dailyHours = duration;
    let consecutiveDays = 1;
    const workedDays = new Set();

    for (const assignment of weeklyAssignments) {
      const shiftStart = moment(assignment.shift.startTime);
      const shiftEnd = moment(assignment.shift.endTime);
      const shiftDuration = shiftEnd.diff(shiftStart, "hours");

      weeklyHours += shiftDuration;

      // Check daily hours
      if (shiftStart.isSame(start, "day")) {
        dailyHours += shiftDuration;
      }

      // Track worked days
      const dayKey = shiftStart.format("YYYY-MM-DD");
      workedDays.add(dayKey);
    }

    // Check consecutive days
    const currentDay = start.format("YYYY-MM-DD");
    workedDays.add(currentDay);

    const sortedDays = Array.from(workedDays).sort();
    const currentIndex = sortedDays.indexOf(currentDay);

    if (currentIndex > 0) {
      const prevDay = moment(sortedDays[currentIndex - 1]);
      if (start.diff(prevDay, "days") === 1) {
        consecutiveDays++;
      }
    }

    if (currentIndex < sortedDays.length - 1) {
      const nextDay = moment(sortedDays[currentIndex + 1]);
      if (nextDay.diff(start, "days") === 1) {
        consecutiveDays++;
      }
    }

    // Check limits
    if (weeklyHours > 40 && start.isoWeekday() !== 7) {
      // Allow overtime on Sunday
      return { allowed: false, message: "Weekly hours would exceed 40 hours" };
    }

    if (dailyHours > 12) {
      return { allowed: false, message: "Daily hours would exceed 12 hours" };
    }

    if (dailyHours > 8) {
      // Warning for >8 hours
    }

    if (consecutiveDays > 6) {
      return {
        allowed: false,
        message: "Cannot work more than 6 consecutive days",
      };
    }

    if (consecutiveDays > 5) {
      // Warning for 6th consecutive day
    }

    return { allowed: true };
  }
}

module.exports = ShiftService;
