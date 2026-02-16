/**
 * Notification Scheduler
 * Checks and processes scheduled notifications daily
 * This can be run as a background job or triggered periodically
 */

const Notification = require('../models/Notification');
const Program = require('../models/Program');

/**
 * Check for programs starting today and ensure notifications are ready
 * This function can be called daily via cron job or manually
 */
async function checkDailyProgramNotifications() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log(`🔔 Checking program notifications for ${today.toDateString()}`);
    
    // Find all notifications scheduled for today
    const todaysNotifications = await Notification.find({
      type: 'program_reminder',
      scheduledFor: {
        $gte: today,
        $lt: tomorrow
      },
      isRead: false
    }).populate('targetUsers');
    
    console.log(`✅ Found ${todaysNotifications.length} program notifications scheduled for today`);
    
    // Log details for monitoring
    todaysNotifications.forEach(notification => {
      console.log(`  - ${notification.title} for ${notification.targetUsers.length} users`);
    });
    
    return {
      success: true,
      count: todaysNotifications.length,
      notifications: todaysNotifications
    };
  } catch (error) {
    console.error('❌ Error checking daily notifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send immediate notification to a user
 * Used for urgent or real-time notifications
 */
async function sendImmediateNotification(userId, notificationData) {
  try {
    const notification = new Notification({
      ...notificationData,
      targetAudience: 'specific_users',
      targetUsers: [userId],
      scheduledFor: new Date() // Send immediately
    });
    
    await notification.save();
    console.log(`✅ Immediate notification sent to user ${userId}`);
    
    return {
      success: true,
      notification
    };
  } catch (error) {
    console.error('❌ Error sending immediate notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Clean up old notifications (older than 30 days)
 */
async function cleanupOldNotifications() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      isRead: true
    });
    
    console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
    
    return {
      success: true,
      deletedCount: result.deletedCount
    };
  } catch (error) {
    console.error('❌ Error cleaning up notifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Initialize daily scheduler
 * This runs daily at 6 AM to check for today's program notifications
 */
function initializeDailyScheduler() {
  // Run once immediately on startup
  checkDailyProgramNotifications();
  
  // Then run daily at 6 AM
  const runDailyAt6AM = () => {
    const now = new Date();
    const target = new Date();
    target.setHours(6, 0, 0, 0);
    
    // If it's already past 6 AM today, schedule for tomorrow
    if (now > target) {
      target.setDate(target.getDate() + 1);
    }
    
    const timeUntilTarget = target - now;
    
    setTimeout(() => {
      checkDailyProgramNotifications();
      // Schedule next run (24 hours later)
      setInterval(checkDailyProgramNotifications, 24 * 60 * 60 * 1000);
    }, timeUntilTarget);
    
    console.log(`⏰ Daily notification scheduler initialized. Next run at ${target.toLocaleString()}`);
  };
  
  runDailyAt6AM();
  
  // Clean up old notifications weekly (every Sunday at midnight)
  const runWeeklyCleanup = () => {
    const now = new Date();
    const target = new Date();
    
    // Find next Sunday
    const daysUntilSunday = (7 - now.getDay()) % 7;
    target.setDate(target.getDate() + daysUntilSunday);
    target.setHours(0, 0, 0, 0);
    
    const timeUntilTarget = target - now;
    
    setTimeout(() => {
      cleanupOldNotifications();
      // Schedule next run (weekly)
      setInterval(cleanupOldNotifications, 7 * 24 * 60 * 60 * 1000);
    }, timeUntilTarget);
    
    console.log(`🧹 Weekly cleanup scheduler initialized. Next run at ${target.toLocaleString()}`);
  };
  
  runWeeklyCleanup();
}

module.exports = {
  checkDailyProgramNotifications,
  sendImmediateNotification,
  cleanupOldNotifications,
  initializeDailyScheduler
};
