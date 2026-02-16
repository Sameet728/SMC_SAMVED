const mongoose = require("mongoose");

/**
 * Notification Schema
 * Stores system alerts and notifications for citizens and admins
 */
const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["outbreak_alert", "vaccination", "emergency", "medicine_stock", "appointment", "general", "program_reminder"],
    required: true,
  },

  priority: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },

  title: {
    type: String,
    required: true,
  },

  message: {
    type: String,
    required: true,
  },

  targetAudience: {
    type: String,
    enum: ["all", "ward", "zone", "specific_users"],
    default: "all",
  },

  ward: {
    type: String, // If targeting specific ward
  },

  zone: {
    type: String, // If targeting specific zone
  },

  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],

  isRead: {
    type: Boolean,
    default: false,
  },

  isBroadcast: {
    type: Boolean,
    default: false,
  },

  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Admin who sent the notification
  },

  relatedEntity: {
    entityType: {
      type: String,
      enum: ["outbreak", "appointment", "hospital", "medicine", "program"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },

  // For program notifications: date to show the notification
  scheduledFor: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for quick retrieval
NotificationSchema.index({ targetAudience: 1, ward: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ priority: 1, isRead: 1 });

module.exports = mongoose.model("Notification", NotificationSchema);
