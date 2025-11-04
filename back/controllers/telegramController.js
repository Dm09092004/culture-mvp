// server/controllers/telegramController.js
import { 
  sendTelegramMessage, 
  sendTestMessage,
  sendNotificationAlert,
  sendNewEmployeeAlert,
  sendCultureAnalysisAlert,
  handleTelegramUpdate,
  setWebhook,
  broadcastToSubscribers,
  sendPersonalNotification
} from '../services/telegramService.js';
import TelegramSubscribersModel from '../models/TelegramSubscribersModel.js';

export const testTelegramConnection = async (req, res) => {
  try {
    const result = await sendTestMessage();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Тестовое сообщение отправлено в Telegram',
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error('Telegram test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test message to Telegram'
    });
  }
};

export const setupWebhook = async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'Webhook URL is required'
      });
    }

    const result = await setWebhook(webhookUrl);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Webhook установлен',
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Webhook setup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup webhook'
    });
  }
};

// Обработчик вебхука от Telegram
export const handleWebhook = async (req, res) => {
  try {
    console.log('📨 Received Telegram webhook update');
    
    // Отвечаем Telegram сразу, чтобы избежать таймаута
    res.status(200).json({ status: 'ok' });
    
    // Обрабатываем обновление асинхронно
    await handleTelegramUpdate(req.body);
    
  } catch (error) {
    console.error('Webhook handling error:', error);
    // Уже ответили 200, поэтому логируем ошибку
  }
};

export const sendCustomMessage = async (req, res) => {
  try {
    const { message, chatId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const targetChatId = chatId || process.env.TELEGRAM_CHAT_ID;
    const result = await sendTelegramMessage(targetChatId, message);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Сообщение отправлено в Telegram',
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error('Telegram send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message to Telegram'
    });
  }
};

export const broadcastMessage = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const results = await broadcastToSubscribers(message);
    
    res.json({
      success: true,
      message: `Сообщение отправлено ${results.length} подписчикам`,
      data: results
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast message'
    });
  }
};

export const sendToEmployee = async (req, res) => {
  try {
    const { email, message } = req.body;
    
    if (!email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Email and message are required'
      });
    }

    const result = await sendPersonalNotification(email, message);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Сообщение отправлено сотруднику ${email}`,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Send to employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message to employee'
    });
  }
};

export const getTelegramStatus = async (req, res) => {
  const subscribers = await TelegramSubscribersModel.getAll();
  const activeSubscribers = subscribers.filter(sub => sub.isActive);

  const status = {
    botToken: process.env.TELEGRAM_BOT_TOKEN ? '✅ Настроен' : '❌ Отсутствует',
    chatId: process.env.TELEGRAM_CHAT_ID ? '✅ Настроен' : '❌ Отсутствует',
    totalSubscribers: subscribers.length,
    activeSubscribers: activeSubscribers.length,
    environment: process.env.NODE_ENV || 'development'
  };

  res.json({
    success: true,
    data: status
  });
};

export const getSubscribers = async (req, res) => {
  try {
    const subscribers = await TelegramSubscribersModel.getAll();
    
    res.json({
      success: true,
      data: subscribers
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscribers'
    });
  }
};