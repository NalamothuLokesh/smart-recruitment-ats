const db = require('../config/db');

/**
 * Notification Service
 * Dispatches simulated transactional emails and logs to notification_logs
 */
class NotificationService {
  /**
   * Log and simulate dispatch of email notification
   * @param {Object} options
   * @param {string} options.recipientEmail
   * @param {string} options.eventType
   * @param {string} options.subject
   * @param {Object} [options.payload]
   */
  async sendNotification({ recipientEmail, eventType, subject, payload = {} }) {
    try {
      const providerResponse = {
        dispatchedAt: new Date().toISOString(),
        provider: 'ATS-Transactional-Engine',
        recipient: recipientEmail,
        eventType,
        payload
      };

      const [result] = await db.query(
        `INSERT INTO notification_logs (recipient_email, event_type, subject, delivery_status, provider_response, created_at)
         VALUES (?, ?, ?, 'SIMULATED', ?, NOW())`,
        [recipientEmail, eventType, subject, JSON.stringify(providerResponse)]
      );

      return {
        id: result.insertId,
        recipientEmail,
        eventType,
        subject,
        deliveryStatus: 'SIMULATED'
      };
    } catch (error) {
      console.error('[NotificationService] Error logging notification:', error.message);
      // Fail silently to avoid breaking primary transaction flow
      return null;
    }
  }
}

module.exports = new NotificationService();

