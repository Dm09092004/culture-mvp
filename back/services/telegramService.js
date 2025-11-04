// server/services/telegramService.js
import axios from 'axios';
import TelegramSubscribersModel from '../models/TelegramSubscribersModel.js';
import EmployeesModel from '../models/EmployeesModel.js';

import dotenv from 'dotenv';

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Состояния пользователей (для обработки диалога)
const userStates = new Map();

// Основные функции отправки сообщений (оставляем без изменений)
export const sendTelegramMessage = async (chatId, text, parseMode = 'HTML') => {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('❌ Telegram токен не установлен.');
    return { success: false, error: 'Telegram token not configured' };
  }

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: text,
        parse_mode: parseMode,
        reply_markup: parseMode === 'HTML' ? undefined : { remove_keyboard: true }
      },
      {
        timeout: 10000
      }
    );

    console.log(`✅ Telegram сообщение отправлено в чат ${chatId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`❌ Ошибка отправки Telegram сообщения в чат ${chatId}:`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return { 
      success: false, 
      error: error.message,
      details: error.response?.data 
    };
  }
};

// Функция для отправки сообщения с клавиатурой
export const sendTelegramMessageWithKeyboard = async (chatId, text, keyboard) => {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('❌ Telegram токен не установлен.');
    return { success: false, error: 'Telegram token not configured' };
  }

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: keyboard
      },
      {
        timeout: 10000
      }
    );

    console.log(`✅ Telegram сообщение с клавиатурой отправлено в чат ${chatId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`❌ Ошибка отправки Telegram сообщения с клавиатурой:`, error.message);
    return { success: false, error: error.message };
  }
};

// Обработка входящих сообщений от Telegram
export const handleTelegramUpdate = async (update) => {
  if (!update.message) {
    return { success: false, error: 'No message in update' };
  }

  const { message } = update;
  const chatId = message.chat.id;
  const text = message.text || '';
  const user = message.from;

  console.log(`📨 Входящее сообщение от ${user.first_name} (${chatId}): ${text}`);

  try {
    // Обработка команды /start
    if (text.startsWith('/start')) {
      return await handleStartCommand(chatId, user);
    }

    // Обработка команды /stop
    if (text.startsWith('/stop')) {
      return await handleStopCommand(chatId);
    }

    // Обработка команды /status
    if (text.startsWith('/status')) {
      return await handleStatusCommand(chatId);
    }

    // Проверяем состояние пользователя
    const userState = userStates.get(chatId);
    
    if (userState && userState.waitingForEmail) {
      return await handleEmailInput(chatId, text, user);
    }

    // Если сообщение не распознано
    return await sendTelegramMessage(
      chatId,
      `🤖 <b>CultureOS Bot</b>\n\n` +
      `Используйте команды:\n` +
      `/start - начать работу\n` +
      `/status - проверить статус\n` +
      `/stop - отписаться\n\n` +
      `Или просто отправьте свой email для подписки.`
    );

  } catch (error) {
    console.error('Ошибка обработки сообщения:', error);
    return await sendTelegramMessage(
      chatId,
      `❌ Произошла ошибка: ${error.message}\n\nПопробуйте еще раз или обратитесь к администратору.`
    );
  }
};

// Обработка команды /start
const handleStartCommand = async (chatId, user) => {
  // Проверяем, есть ли уже подписка
  const existingSubscription = await TelegramSubscribersModel.findByChatId(chatId);
  
  if (existingSubscription) {
    return await sendTelegramMessage(
      chatId,
      `✅ <b>Вы уже подписаны!</b>\n\n` +
      `Ваш email: <code>${existingSubscription.email}</code>\n` +
      `Подписка активна с: ${new Date(existingSubscription.subscribedAt).toLocaleDateString('ru-RU')}\n\n` +
      `Используйте /status для проверки статуса или /stop для отписки.`
    );
  }

  // Устанавливаем состояние ожидания email
  userStates.set(chatId, { 
    waitingForEmail: true,
    userData: user
  });

  return await sendTelegramMessage(
    chatId,
    `👋 <b>Добро пожаловать в CultureOS!</b>\n\n` +
    `Я буду присылать вам уведомления о корпоративных ценностях, миссии и важных событиях компании.\n\n` +
    `📧 <b>Пожалуйста, отправьте ваш рабочий email:</b>\n` +
    `(тот, который вы используете в компании)`
  );
};

// Обработка ввода email
const handleEmailInput = async (chatId, email, user) => {
  try {
    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return await sendTelegramMessage(
        chatId,
        `❌ <b>Неверный формат email</b>\n\n` +
        `Пожалуйста, отправьте корректный email адрес.\n` +
        `Пример: ivan.ivanov@company.com`
      );
    }

    // Проверяем, есть ли сотрудник с таким email в базе
    const employees = await EmployeesModel.getAll();
    const employee = employees.find(emp => emp.email.toLowerCase() === email.toLowerCase());

    if (!employee) {
      userStates.delete(chatId);
      return await sendTelegramMessage(
        chatId,
        `❌ <b>Сотрудник не найден</b>\n\n` +
        `Email <code>${email}</code> не найден в базе сотрудников.\n\n` +
        `Пожалуйста, проверьте правильность email или обратитесь к администратору для добавления в систему.`
      );
    }

    // Создаем подписку
    const subscription = await TelegramSubscribersModel.subscribe(chatId, email, {
      firstName: user.first_name,
      lastName: user.last_name || '',
      username: user.username || ''
    });

    // Очищаем состояние
    userStates.delete(chatId);

    return await sendTelegramMessage(
      chatId,
      `🎉 <b>Подписка оформлена!</b>\n\n` +
      `✅ <b>Email подтвержден:</b> <code>${email}</code>\n` +
      `👤 <b>Сотрудник:</b> ${employee.name}\n` +
      `🏢 <b>Отдел:</b> ${employee.department}\n\n` +
      `Теперь вы будете получать уведомления о:\n` +
      `• Корпоративных ценностях\n` +
      `• Миссии компании\n` +
      `• Важных событиях\n` +
      `• Персональных напоминаниях\n\n` +
      `Используйте /status для проверки статуса или /stop для отписки.`
    );

  } catch (error) {
    userStates.delete(chatId);
    throw error;
  }
};

// Обработка команды /stop
const handleStopCommand = async (chatId) => {
  const existingSubscription = await TelegramSubscribersModel.findByChatId(chatId);
  
  if (!existingSubscription) {
    return await sendTelegramMessage(
      chatId,
      `ℹ️ <b>У вас нет активной подписки</b>\n\n` +
      `Используйте /start для начала работы.`
    );
  }

  await TelegramSubscribersModel.unsubscribe(chatId);

  return await sendTelegramMessage(
    chatId,
    `👋 <b>Подписка отменена</b>\n\n` +
    `Вы больше не будете получать уведомления от CultureOS.\n\n` +
    `Если передумаете - всегда можете возобновить подписку с помощью /start.`
  );
};

// Обработка команды /status
const handleStatusCommand = async (chatId) => {
  const existingSubscription = await TelegramSubscribersModel.findByChatId(chatId);
  
  if (!existingSubscription) {
    return await sendTelegramMessage(
      chatId,
      `ℹ️ <b>Статус подписки</b>\n\n` +
      `У вас нет активной подписки.\n\n` +
      `Используйте /start для подписки на уведомления.`
    );
  }

  const employees = await EmployeesModel.getAll();
  const employee = employees.find(emp => emp.email.toLowerCase() === existingSubscription.email.toLowerCase());

  let statusMessage = `✅ <b>Подписка активна</b>\n\n`;
  statusMessage += `📧 <b>Email:</b> <code>${existingSubscription.email}</code>\n`;
  
  if (employee) {
    statusMessage += `👤 <b>Сотрудник:</b> ${employee.name}\n`;
    statusMessage += `🏢 <b>Отдел:</b> ${employee.department}\n`;
  }
  
  statusMessage += `📅 <b>Подписка с:</b> ${new Date(existingSubscription.subscribedAt).toLocaleDateString('ru-RU')}\n\n`;
  statusMessage += `Используйте /stop для отмены подписки.`;

  return await sendTelegramMessage(chatId, statusMessage);
};

// Функция для отправки персональных уведомлений сотрудникам
export const sendPersonalNotification = async (employeeEmail, message) => {
  const subscriber = await TelegramSubscribersModel.getSubscriberByEmployeeEmail(employeeEmail);
  
  if (!subscriber) {
    console.log(`ℹ️ Сотрудник ${employeeEmail} не подписан на Telegram уведомления`);
    return { success: false, error: 'Employee not subscribed' };
  }

  return await sendTelegramMessage(subscriber.chatId, message);
};

// Функция для массовой рассылки всем подписанным сотрудникам
export const broadcastToSubscribers = async (message) => {
  const subscribers = await TelegramSubscribersModel.getAll();
  const activeSubscribers = subscribers.filter(sub => sub.isActive);
  
  console.log(`📢 Рассылка сообщения ${activeSubscribers.length} подписчикам`);

  const results = [];
  
  for (const subscriber of activeSubscribers) {
    try {
      const result = await sendTelegramMessage(subscriber.chatId, message);
      results.push({
        chatId: subscriber.chatId,
        email: subscriber.email,
        success: result.success,
        error: result.error
      });
    } catch (error) {
      results.push({
        chatId: subscriber.chatId,
        email: subscriber.email,
        success: false,
        error: error.message
      });
    }
  }

  return results;
};

// Функции для административных уведомлений (оставляем без изменений)
export const sendNotificationAlert = async (notificationData) => {
  const { sentCount, failedCount, total, type } = notificationData;
  
  const message = `
📧 <b>Новая рассылка отправлена!</b>

📊 <b>Статистика:</b>
✅ Успешно: ${sentCount}
❌ Ошибок: ${failedCount}
📨 Всего: ${total}

🎯 <b>Тип:</b> ${type || 'Уведомление о ценности'}

⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
  `;

  return await sendTelegramMessage(TELEGRAM_CHAT_ID, message);
};

export const sendNewEmployeeAlert = async (employeeData) => {
  const { name, email, department } = employeeData;
  
  const message = `
👤 <b>Новый сотрудник добавлен!</b>

📝 <b>Имя:</b> ${name}
📧 <b>Email:</b> ${email}
🏢 <b>Отдел:</b> ${department}

⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
  `;

  return await sendTelegramMessage(TELEGRAM_CHAT_ID, message);
};

export const sendCultureAnalysisAlert = async (analysisData) => {
  const { values, mission, source } = analysisData;
  
  const message = `
🎯 <b>Анализ культуры завершен!</b>

📊 <b>Созданы ценности:</b>
${values.map((v, i) => `${i + 1}. ${v.icon} ${v.title}`).join('\n')}

🎯 <b>Миссия:</b> ${mission.substring(0, 100)}...

🔧 <b>Источник:</b> ${source === 'gigachat' ? 'GigaChat AI' : 'Резервные данные'}

⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
  `;

  return await sendTelegramMessage(TELEGRAM_CHAT_ID, message);
};

export const sendTestMessage = async () => {
  const message = `
🧪 <b>Тестовое сообщение от CultureOS</b>

✅ Бот успешно подключен и работает!

⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
🔧 <b>Окружение:</b> ${process.env.NODE_ENV || 'development'}
  `;

  return await sendTelegramMessage(TELEGRAM_CHAT_ID, message);
};

// Функция для настройки вебхука
export const setWebhook = async (webhookUrl) => {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('Telegram token not configured');
  }

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        url: webhookUrl
      }
    );

    console.log('✅ Webhook установлен:', webhookUrl);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Ошибка установки webhook:', error.message);
    return { success: false, error: error.message };
  }
};