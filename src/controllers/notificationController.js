const { Notification } = require("../models");

class NotificationController {
  static async getNotifications(req, res) {
    try {
      const userId = req.user.id;

      const notifications = await Notification.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
      });

      const formatted = notifications.map((notif) => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        createdAt: notif.createdAt.toISOString(),
        read: notif.isRead,
        type: notif.type,
      }));

      res.json(formatted);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async markRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOne({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      await notification.update({
        isRead: true,
        readAt: new Date(),
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = NotificationController;
