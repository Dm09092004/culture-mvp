// server/controllers/notificationsController.js
import NotificationsModel from '../models/NotificationsModel.js';
import EmployeesModel from '../models/EmployeesModel.js';
import CultureModel from '../models/CultureModel.js';
import nodemailer from 'nodemailer';

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
 * Create email transporter
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Send email via SMTP
 */
async function sendEmailViaSMTP(emailOptions) {
  let transporter;
  
  try {
    transporter = createTransporter();
    
    const mailOptions = {
      from: `"CultureOS" <${process.env.SMTP_USER}>`,
      to: emailOptions.to_email,
      subject: emailOptions.subject || 'Уведомление от CultureOS',
      text: emailOptions.message,
      html: convertTextToHTML(emailOptions.message)
    };

    console.log('Sending email to:', emailOptions.to_email);
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', emailOptions.to_email);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('SMTP send error for', emailOptions.to_email, ':', error.message);
    return { 
      success: false, 
      error: error.message 
    };
  } finally {
    if (transporter) {
      transporter.close();
    }
  }
}

/**
 * Convert plain text to HTML for email
 */
function convertTextToHTML(text) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px;
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 20px; 
          text-align: center; 
          border-radius: 10px 10px 0 0;
        }
        .content { 
          padding: 20px; 
          background: #f9f9f9; 
          border-radius: 0 0 10px 10px;
        }
        .footer { 
          text-align: center; 
          margin-top: 20px; 
          padding: 20px; 
          color: #666; 
          font-size: 14px;
        }
        .value-highlight {
          background: #e3f2fd; 
          padding: 10px; 
          border-left: 4px solid #2196f3; 
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎯 CultureOS</h1>
        <p>Корпоративная культура и ценности</p>
      </div>
      <div class="content">
        ${text.split('\n').map(line => {
          if (line.trim() === '') return '<br>';
          
          // Bold text between ** **
          line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          
          // Highlight values
          if (line.includes('ценност') || line.includes('Ценност')) {
            return `<div class="value-highlight">${line}</div>`;
          }
          
          // Add paragraph for longer lines
          if (line.length > 50) {
            return `<p style="margin: 10px 0; line-height: 1.5;">${line}</p>`;
          }
          
          return `<div style="margin: 5px 0;">${line}</div>`;
        }).join('')}
      </div>
      <div class="footer">
        <p>С уважением,<br><strong>Команда CultureOS</strong></p>
        <p><small>Это сообщение отправлено автоматически. Пожалуйста, не отвечайте на него.</small></p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send notifications to employees
 */
export const sendNotifications = async (req, res) => {
  try {
    const { 
      employees, 
      message, 
      subject,
      type = 'value_reminder',
      valueTitle = '',
      mission = '',
      personalization = true
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

    // Проверяем SMTP настройки
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return res.status(500).json({
        success: false,
        error: 'SMTP configuration is missing. Please configure SMTP_USER and SMTP_PASSWORD in .env file.'
      });
    }

    const results = {
      sent: 0,
      failed: 0,
      total: employees.length,
      details: []
    };

    console.log(`Starting to send ${type} notifications to ${employees.length} employees`);

    // Отправка писем через SMTP
    for (const employee of employees) {
      try {
        let personalizedMessage = message;
        
        // Персонализация сообщения
        if (personalization) {
          personalizedMessage = personalizeMessage(message, employee.name);
        }

        const emailOptions = {
          to_email: employee.email,
          to_name: employee.name,
          message: personalizedMessage,
          value_title: valueTitle,
          mission: mission || "Мы создаем прекрасную корпоративную культуру вместе!",
          subject: subject || `CultureOS: ${valueTitle || 'Уведомление'}`
        };

        const emailResult = await sendEmailViaSMTP(emailOptions);

        if (emailResult.success) {
          results.sent++;
          results.details.push({
            employee: employee.name,
            email: employee.email,
            status: 'sent'
          });
        } else {
          throw new Error(emailResult.error);
        }
      } catch (error) {
        console.error(`Failed to send email to ${employee.email}:`, error.message);
        results.failed++;
        results.details.push({
          employee: employee.name,
          email: employee.email,
          status: 'failed',
          error: error.message || 'Unknown error'
        });
      }
    }

    // Save notification record
    const notification = await NotificationsModel.add({
      type,
      message: `Отправлено ${results.sent} из ${results.total} сотрудников`,
      status: results.failed === 0 ? 'sent' : results.sent === 0 ? 'failed' : 'partial',
      metadata: {
        valueTitle,
        mission,
        totalEmployees: results.total,
        successful: results.sent,
        failed: results.failed
      }
    });

    console.log(`Notification sending completed: ${results.sent} sent, ${results.failed} failed`);

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
      error: 'Failed to send notifications: ' + error.message
    });
  }
};

/**
 * Send regular notifications
 */
export const sendRegularNotifications = async (req, res) => {
  try {
    const { 
      notifications,
      employees
    } = req.body;

    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Notifications array is required'
      });
    }

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Employees array is required'
      });
    }

    // Проверяем SMTP настройки
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return res.status(500).json({
        success: false,
        error: 'SMTP configuration is missing. Please configure SMTP_USER and SMTP_PASSWORD in .env file.'
      });
    }

    const overallResults = {
      totalNotifications: notifications.length,
      totalEmails: employees.length * notifications.length,
      sent: 0,
      failed: 0,
      notifications: []
    };

    console.log(`Starting to send ${notifications.length} regular notifications to ${employees.length} employees`);

    // Отправка каждого обычного уведомления
    for (const notification of notifications) {
      const notificationResults = {
        notificationId: notification.id,
        notificationTitle: notification.title,
        sent: 0,
        failed: 0,
        details: []
      };

      for (const employee of employees) {
        try {
          const emailOptions = {
            to_email: employee.email,
            to_name: employee.name,
            message: `${notification.title}\n\n${notification.message}`,
            subject: notification.title,
            type: 'regular_notification'
          };

          const emailResult = await sendEmailViaSMTP(emailOptions);

          if (emailResult.success) {
            notificationResults.sent++;
            overallResults.sent++;
          } else {
            throw new Error(emailResult.error);
          }
        } catch (error) {
          console.error(`Failed to send regular notification to ${employee.email}:`, error.message);
          notificationResults.failed++;
          overallResults.failed++;
          notificationResults.details.push({
            employee: employee.name,
            email: employee.email,
            error: error.message || 'Unknown error'
          });
        }
      }

      overallResults.notifications.push(notificationResults);

      // Сохраняем запись об уведомлении
      await NotificationsModel.add({
        type: 'regular_notification',
        message: `Обычное уведомление: "${notification.title}" - отправлено ${notificationResults.sent} из ${employees.length}`,
        status: notificationResults.failed === 0 ? 'sent' : 'partial',
        metadata: {
          notificationTitle: notification.title,
          totalEmployees: employees.length,
          successful: notificationResults.sent,
          failed: notificationResults.failed
        }
      });
    }

    console.log(`Regular notifications sending completed: ${overallResults.sent} sent, ${overallResults.failed} failed`);

    res.json({
      success: true,
      data: overallResults
    });

  } catch (error) {
    console.error('Send regular notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send regular notifications: ' + error.message
    });
  }
};

/**
 * Test SMTP connection
 */
export const testSMTPConnection = async (req, res) => {
  let transporter;
  
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return res.status(400).json({
        success: false,
        error: 'SMTP configuration is missing. Please set SMTP_USER and SMTP_PASSWORD in .env file.'
      });
    }

    console.log('Testing SMTP connection with:', {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      user: process.env.SMTP_USER
    });

    transporter = createTransporter();
    
    // Verify connection configuration
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    // Try to send a test email
    const testMailOptions = {
      from: `"CultureOS" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // send to yourself
      subject: 'CultureOS - SMTP Connection Test',
      text: 'Это тестовое письмо для проверки SMTP подключения CultureOS.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #667eea;">🎯 CultureOS</h2>
          <p>Это тестовое письмо подтверждает, что SMTP подключение работает корректно.</p>
          <p><strong>Время отправки:</strong> ${new Date().toLocaleString('ru-RU')}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Если вы получили это письмо, значит настройки SMTP работают правильно.
          </p>
        </div>
      `
    };

    const testResult = await transporter.sendMail(testMailOptions);
    console.log('Test email sent successfully:', testResult.messageId);
    
    res.json({
      success: true,
      message: 'SMTP connection successful and test email sent',
      config: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        user: process.env.SMTP_USER
      },
      testEmail: {
        sent: true,
        messageId: testResult.messageId
      }
    });
  } catch (error) {
    console.error('SMTP connection test failed:', error.message);
    
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Check your SMTP_USER and SMTP_PASSWORD.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed. Check SMTP_HOST and SMTP_PORT.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Connection timeout. Check your network and SMTP settings.';
    }
    
    res.status(500).json({
      success: false,
      error: 'SMTP connection failed: ' + errorMessage,
      details: {
        code: error.code,
        command: error.command
      }
    });
  } finally {
    if (transporter) {
      transporter.close();
    }
  }
};

/**
 * Send scheduled notifications
 */
export const sendScheduledNotifications = async (req, res) => {
  try {
    // Получаем настройки и сотрудников
    const settings = await NotificationsModel.getSettings();
    const employees = await EmployeesModel.getAll();
    const culture = await CultureModel.get();
    
    if (employees.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No employees to notify',
        data: { sent: 0, failed: 0, total: 0 }
      });
    }

    // Проверяем SMTP настройки
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return res.status(500).json({
        success: false,
        error: 'SMTP configuration is missing. Cannot send scheduled notifications.'
      });
    }

    // Генерируем сообщение на основе текущих ценностей и миссии
    const currentValue = culture?.values?.[0] || { title: "Развитие", description: "" };
    const missionText = culture?.mission || "Мы создаем прекрасную корпоративную культуру вместе!";
    
    const message = generateScheduledMessage(settings.types, currentValue.title, missionText);

    // Отправляем уведомления
    const results = {
      sent: 0,
      failed: 0,
      total: employees.length,
      details: []
    };

    console.log(`Starting scheduled notifications for ${employees.length} employees`);

    for (const employee of employees) {
      try {
        const personalizedMessage = personalizeMessage(message, employee.name);

        const emailOptions = {
          to_email: employee.email,
          to_name: employee.name,
          message: personalizedMessage,
          value_title: currentValue.title,
          mission: missionText,
          subject: `CultureOS: ${currentValue.title}`
        };

        const emailResult = await sendEmailViaSMTP(emailOptions);

        if (emailResult.success) {
          results.sent++;
        } else {
          throw new Error(emailResult.error);
        }
      } catch (error) {
        console.error(`Failed to send scheduled email to ${employee.email}:`, error.message);
        results.failed++;
        results.details.push({
          employee: employee.name,
          email: employee.email,
          error: error.message
        });
      }
    }

    // Сохраняем в историю
    await NotificationsModel.add({
      type: 'scheduled',
      message: `Автоматическая рассылка: ${results.sent} отправлено из ${results.total}`,
      status: results.failed === 0 ? 'sent' : 'partial',
      metadata: {
        valueTitle: currentValue.title,
        frequency: settings.frequency,
        totalEmployees: results.total,
        successful: results.sent,
        failed: results.failed
      }
    });

    console.log(`Scheduled notifications completed: ${results.sent} sent, ${results.failed} failed`);

    res.json({ 
      success: true, 
      data: results,
      message: `Scheduled notifications sent: ${results.sent} successful, ${results.failed} failed`
    });
  } catch (error) {
    console.error('Scheduled notifications error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send scheduled notifications: ' + error.message 
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

// Вспомогательные функции

/**
 * Персонализация сообщения
 */
function personalizeMessage(message, employeeName) {
  return message.replace(/Привет!|Добрый день!|Приветствую!/, `Привет, ${employeeName}!`);
}

/**
 * Генерация сообщения для автоматической рассылки
 */
function generateScheduledMessage(types, valueTitle, mission) {
  const activeTypes = types.filter(type => 
    ['value_reminder', 'mission_quote', 'team_shoutout'].includes(type)
  );
  
  const selectedType = activeTypes.length > 0 
    ? activeTypes[Math.floor(Math.random() * activeTypes.length)]
    : 'value_reminder';

  const templates = {
    value_reminder: `Привет! 🌟

Сегодня хотели напомнить о нашей важной ценности: "${valueTitle}".

${mission}

Давай воплотим это в наших действиях сегодня! 💪

С уважением, CultureOS`,

    mission_quote: `Добрый день! ✨

Напоминаем о нашей общей миссии: "${mission}".

Ценность "${valueTitle}" помогает нам двигаться к этой цели.

Продолжаем в том же духе! 🚀

С уважением, CultureOS`,

    team_shoutout: `Приветствую! 👏

Хочу отметить, как здорово мы проявляем ценность "${valueTitle}"!

${mission}

Спасибо за ваш вклад! 💙

С уважением, CultureOS`
  };

  return templates[selectedType] || templates.value_reminder;
}
export const checkScheduledRegularNotifications = async () => {
  try {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0-6 (0 - воскресенье)
    const currentDayOfMonth = now.getDate(); // 1-31
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    console.log(`Checking scheduled notifications at ${currentTime}, day ${currentDayOfWeek}, date ${currentDayOfMonth}`);

    // Получаем все активные регулярные уведомления из базы данных
    const regularNotifications = await NotificationsModel.getActiveRegularNotifications();
    
    if (regularNotifications.length === 0) {
      return {
        success: true,
        sent: 0,
        notifications: [],
        message: 'No active regular notifications found'
      };
    }

    console.log(`Found ${regularNotifications.length} active regular notifications`);

    const notificationsToSend = [];
    const skippedNotifications = [];

    // Фильтруем уведомления по расписанию
    for (const notification of regularNotifications) {
      if (!notification.enabled) {
        skippedNotifications.push(`${notification.title} - disabled`);
        continue;
      }

      let shouldSend = false;
      let reason = '';

      switch (notification.schedule) {
        case 'daily':
          if (notification.time === currentTime) {
            shouldSend = true;
            reason = 'daily schedule matched';
          }
          break;

        case 'weekly':
          // Приводим день недели к формату 0-6 (0 - воскресенье)
          const notificationDay = notification.dayOfWeek !== undefined ? 
            (notification.dayOfWeek === 0 ? 0 : notification.dayOfWeek) : 1;
          
          if (notificationDay === currentDayOfWeek && notification.time === currentTime) {
            shouldSend = true;
            reason = 'weekly schedule matched';
          }
          break;

        case 'monthly':
          if (notification.dayOfMonth === currentDayOfMonth && notification.time === currentTime) {
            shouldSend = true;
            reason = 'monthly schedule matched';
          }
          break;

        case 'manual':
          // Ручные уведомления не отправляются автоматически
          skippedNotifications.push(`${notification.title} - manual schedule`);
          continue;

        default:
          skippedNotifications.push(`${notification.title} - unknown schedule: ${notification.schedule}`);
          continue;
      }

      if (shouldSend) {
        // Проверяем, не отправляли ли мы уже это уведомление сегодня
        const lastSent = notification.lastSent ? new Date(notification.lastSent) : null;
        const today = new Date();
        
        if (lastSent && 
            lastSent.getDate() === today.getDate() &&
            lastSent.getMonth() === today.getMonth() &&
            lastSent.getFullYear() === today.getFullYear()) {
          skippedNotifications.push(`${notification.title} - already sent today`);
          continue;
        }

        notificationsToSend.push({
          notification,
          reason
        });
      } else {
        skippedNotifications.push(`${notification.title} - schedule not matched`);
      }
    }

    console.log(`Notifications to send: ${notificationsToSend.length}, Skipped: ${skippedNotifications.length}`);

    if (notificationsToSend.length === 0) {
      return {
        success: true,
        sent: 0,
        notifications: [],
        skipped: skippedNotifications,
        message: 'No notifications matched current schedule'
      };
    }

    // Получаем всех сотрудников для отправки
    const employees = await EmployeesModel.getAll();
    
    if (employees.length === 0) {
      return {
        success: true,
        sent: 0,
        notifications: notificationsToSend.map(n => n.notification.title),
        skipped: skippedNotifications,
        message: 'No employees found to send notifications to'
      };
    }

    // Проверяем SMTP настройки
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return {
        success: false,
        error: 'SMTP configuration is missing. Cannot send scheduled notifications.',
        notifications: notificationsToSend.map(n => n.notification.title)
      };
    }

    const results = {
      totalNotifications: notificationsToSend.length,
      totalEmails: employees.length * notificationsToSend.length,
      sent: 0,
      failed: 0,
      notifications: []
    };

    // Отправляем каждое подходящее уведомление
    for (const { notification, reason } of notificationsToSend) {
      console.log(`Sending scheduled notification: ${notification.title} (${reason})`);

      const notificationResults = {
        notificationId: notification.id,
        notificationTitle: notification.title,
        sent: 0,
        failed: 0,
        details: []
      };

      // Отправляем каждому сотруднику
      for (const employee of employees) {
        try {
          const emailOptions = {
            to_email: employee.email,
            to_name: employee.name,
            message: `${notification.title}\n\n${notification.message}`,
            subject: notification.title,
            type: 'regular_scheduled_notification'
          };

          const emailResult = await sendEmailViaSMTP(emailOptions);

          if (emailResult.success) {
            notificationResults.sent++;
            results.sent++;
          } else {
            throw new Error(emailResult.error);
          }
        } catch (error) {
          console.error(`Failed to send scheduled notification to ${employee.email}:`, error.message);
          notificationResults.failed++;
          results.failed++;
          notificationResults.details.push({
            employee: employee.name,
            email: employee.email,
            error: error.message || 'Unknown error'
          });
        }
      }

      results.notifications.push(notificationResults);

      // Обновляем время последней отправки
      await NotificationsModel.updateRegularNotification(notification.id, {
        lastSent: new Date()
      });

      // Сохраняем запись об отправке в историю
      await NotificationsModel.add({
        type: 'regular_scheduled',
        message: `Автоматическая отправка: "${notification.title}" - отправлено ${notificationResults.sent} из ${employees.length}`,
        status: notificationResults.failed === 0 ? 'sent' : 'partial',
        metadata: {
          notificationTitle: notification.title,
          schedule: notification.schedule,
          reason: reason,
          totalEmployees: employees.length,
          successful: notificationResults.sent,
          failed: notificationResults.failed,
          sentAt: new Date().toISOString()
        }
      });

      console.log(`Completed sending notification "${notification.title}": ${notificationResults.sent} sent, ${notificationResults.failed} failed`);
    }

    console.log(`Scheduled regular notifications completed: ${results.sent} total emails sent, ${results.failed} failed`);

    return {
      success: true,
      sent: results.sent,
      failed: results.failed,
      notifications: notificationsToSend.map(n => n.notification.title),
      details: results.notifications,
      skipped: skippedNotifications,
      message: `Sent ${results.sent} emails across ${notificationsToSend.length} notifications`
    };

  } catch (error) {
    console.error('Error checking scheduled regular notifications:', error);
    return { 
      success: false, 
      error: error.message,
      sent: 0,
      notifications: []
    };
  }
};
/**
 * Логирование деталей планировщика
 */
function logSchedulerDetails(notificationsToSend, skippedNotifications, employees) {
  console.log('=== SCHEDULER DETAILS ===');
  console.log(`Time: ${new Date().toLocaleString('ru-RU')}`);
  console.log(`Employees: ${employees.length}`);
  console.log(`Notifications to send: ${notificationsToSend.length}`);
  
  if (notificationsToSend.length > 0) {
    console.log('SENDING:');
    notificationsToSend.forEach(({ notification, reason }) => {
      console.log(`  - ${notification.title} (${notification.schedule} at ${notification.time}) - ${reason}`);
    });
  }
  
  if (skippedNotifications.length > 0) {
    console.log('SKIPPED:');
    skippedNotifications.forEach(skipped => {
      console.log(`  - ${skipped}`);
    });
  }
  console.log('=========================');
}

/**
 * Get all regular notifications
 */
export const getRegularNotifications = async (req, res) => {
  try {
    const notifications = await NotificationsModel.getAllRegularNotifications();
    res.json({ 
      success: true, 
      data: notifications 
    });
  } catch (error) {
    console.error('Get regular notifications error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get regular notifications' 
    });
  }
};

/**
 * Create regular notification
 */
export const createRegularNotification = async (req, res) => {
  try {
    const { title, message, schedule, enabled = true, time, dayOfWeek, dayOfMonth } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required'
      });
    }

    const notificationData = {
      title,
      message,
      schedule: schedule || 'manual',
      enabled: enabled !== false,
      time: schedule !== 'manual' ? (time || '09:00') : null,
      dayOfWeek: schedule === 'weekly' ? dayOfWeek : null,
      dayOfMonth: schedule === 'monthly' ? dayOfMonth : null
    };

    const newNotification = await NotificationsModel.createRegularNotification(notificationData);

    res.json({
      success: true,
      data: newNotification
    });

  } catch (error) {
    console.error('Create regular notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create regular notification'
    });
  }
};

/**
 * Update regular notification
 */
export const updateRegularNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Notification ID is required'
      });
    }

    const updatedNotification = await NotificationsModel.updateRegularNotification(id, updates);

    if (!updatedNotification) {
      return res.status(404).json({
        success: false,
        error: 'Regular notification not found'
      });
    }

    res.json({
      success: true,
      data: updatedNotification
    });

  } catch (error) {
    console.error('Update regular notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update regular notification'
    });
  }
};

/**
 * Delete regular notification
 */
export const deleteRegularNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Notification ID is required'
      });
    }

    const deleted = await NotificationsModel.deleteRegularNotification(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Regular notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Regular notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete regular notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete regular notification'
    });
  }
};

/**
 * Toggle regular notification status
 */
export const toggleRegularNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Notification ID is required'
      });
    }

    const updatedNotification = await NotificationsModel.toggleRegularNotification(id);
    if (!updatedNotification) {
      return res.status(404).json({
        success: false,
        error: 'Regular notification not found'
      });
    }

    res.json({
      success: true,
      data: updatedNotification,
      message: 'Regular notification status updated'
    });

  } catch (error) {
    console.error('Toggle regular notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle regular notification'
    });
  }
};

/**
 * Get active regular notifications
 */
export const getActiveRegularNotifications = async (req, res) => {
  try {
    const notifications = await NotificationsModel.getActiveRegularNotifications();
    res.json({ 
      success: true, 
      data: notifications 
    });
  } catch (error) {
    console.error('Get active regular notifications error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get active regular notifications' 
    });
  }
};