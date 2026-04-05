const { Notification } = require("../models");

class SocketService {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // userId -> socket.id
    this.socketUsers = new Map(); // socket.id -> userId
  }

  initialize() {
    this.io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      // Authenticate socket
      socket.on("authenticate", (userId) => {
        this.userSockets.set(userId, socket.id);
        this.socketUsers.set(socket.id, userId);
        socket.join(`user_${userId}`);
        console.log(`User ${userId} authenticated on socket ${socket.id}`);
      });

      // Join location room
      socket.on("join_location", (locationId) => {
        socket.join(`location_${locationId}`);
      });

      // Leave location room
      socket.on("leave_location", (locationId) => {
        socket.leave(`location_${locationId}`);
      });

      socket.on("disconnect", () => {
        const userId = this.socketUsers.get(socket.id);
        if (userId) {
          this.userSockets.delete(userId);
          this.socketUsers.delete(socket.id);
        }
        console.log("User disconnected:", socket.id);
      });
    });
  }

  // Send notification to specific user
  notifyUser(userId, event, data) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }

    // Also emit to user's room
    this.io.to(`user_${userId}`).emit(event, data);
  }

  // Send notification to all users in a location
  notifyLocation(locationId, event, data) {
    this.io.to(`location_${locationId}`).emit(event, data);
  }

  // Broadcast to all connected users
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  // Send real-time updates for shift changes
  async notifyShiftUpdate(shiftId, locationId, action, data) {
    const eventData = {
      shiftId,
      action,
      ...data,
      timestamp: new Date(),
    };

    // Notify location
    this.notifyLocation(locationId, "shift_update", eventData);

    // Create persistent notification if needed
    if (data.affectedUsers) {
      for (const userId of data.affectedUsers) {
        await Notification.create({
          userId,
          type: `shift_${action}`,
          title: data.title,
          message: data.message,
          relatedId: shiftId,
          relatedType: "shift",
          metadata: eventData,
        });

        this.notifyUser(userId, "notification", {
          type: `shift_${action}`,
          title: data.title,
          message: data.message,
        });
      }
    }
  }

  // Notify about swap requests
  async notifySwapUpdate(swapId, action, data) {
    const eventData = {
      swapId,
      action,
      ...data,
      timestamp: new Date(),
    };

    // Notify involved parties
    if (data.requesterId) {
      this.notifyUser(data.requesterId, "swap_update", eventData);
    }

    if (data.targetUserId) {
      this.notifyUser(data.targetUserId, "swap_update", eventData);
    }

    if (data.managerId) {
      this.notifyUser(data.managerId, "swap_update", eventData);
    }

    // Create notifications
    const notifications = [];
    if (data.requesterId && data.requesterId !== data.notifiedBy) {
      notifications.push({
        userId: data.requesterId,
        type: `swap_${action}`,
        title: data.title,
        message: data.message,
        relatedId: swapId,
        relatedType: "swap",
      });
    }

    if (data.targetUserId && data.targetUserId !== data.notifiedBy) {
      notifications.push({
        userId: data.targetUserId,
        type: `swap_${action}`,
        title: data.title,
        message: data.message,
        relatedId: swapId,
        relatedType: "swap",
      });
    }

    if (data.managerId && data.managerId !== data.notifiedBy) {
      notifications.push({
        userId: data.managerId,
        type: `swap_${action}`,
        title: data.title,
        message: data.message,
        relatedId: swapId,
        relatedType: "swap",
      });
    }

    for (const notif of notifications) {
      await Notification.create(notif);
      this.notifyUser(notif.userId, "notification", {
        type: notif.type,
        title: notif.title,
        message: notif.message,
      });
    }
  }
}

module.exports = (io) => {
  const socketService = new SocketService(io);
  socketService.initialize();
  return socketService;
};
