import NotificationsModel from '../models/NotificationsModel.js';
import emailjs from '@emailjs/browser';

/**
 * Get all notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const notifications = await NotificationsModel.getAll();
    res.json({ 
      success: true, 
      data: notifications 
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get notifications' 
    });
  }
};

/**
 * Send notifications to employees
 */
export const sendNotifications = async (req, res) => {
  try {
    const { 
      employees, 
      message, 
      subject,
      type = 'value_reminder' 
    } = req.body;

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Employees array is required'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const results = {
      sent: 0,
      failed: 0,
      details: []
    };

    // Send emails (mock implementation - in real app integrate with email service)
    for (const employee of employees) {
      try {
        // Simulate email sending
        console.log(`Sending email to ${employee.email}: ${message}`);
        
        // In real implementation, use your email service here
        // await emailService.send(employee.email, subject, message);
        
        results.sent++;
        results.details.push({
          employee: employee.name,
          email: employee.email,
          status: 'sent'
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          employee: employee.name,
          email: employee.email,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Save notification record
    const notification = await NotificationsModel.add({
      type,
      message: `Sent to ${results.sent} employees`,
      status: results.failed === 0 ? 'sent' : 'partial'
    });

    res.json({
      success: true,
      data: {
        notification,
        results
      }
    });

  } catch (error) {
    console.error('Send notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notifications'
    });
  }
};

/**
 * Get notification settings
 */
export const getSettings = async (req, res) => {
  try {
    const settings = await NotificationsModel.getSettings();
    res.json({ 
      success: true, 
      data: settings 
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get settings' 
    });
  }
};

/**
 * Update notification settings
 */
export const updateSettings = async (req, res) => {
  try {
    const { frequency, types } = req.body;
    
    if (!frequency || !types || !Array.isArray(types)) {
      return res.status(400).json({
        success: false,
        error: 'Frequency and types array are required'
      });
    }

    const allowedFrequencies = ['daily', 'weekly', 'monthly'];
    if (!allowedFrequencies.includes(frequency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid frequency value'
      });
    }

    const settings = await NotificationsModel.updateSettings({
      frequency,
      types
    });

    res.json({ 
      success: true, 
      data: settings 
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update settings' 
    });
  }
};