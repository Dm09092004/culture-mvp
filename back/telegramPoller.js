// back/telegramPoller.js
import axios from 'axios';
import { handleTelegramUpdate, deleteWebhook } from './services/telegramService.js';
import dotenv from 'dotenv';

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

class TelegramPoller {
  constructor() {
    this.offset = 0;
    this.isPolling = false;
    this.retryCount = 0;
    this.maxRetries = 5;
  }

  async startPolling() {
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('❌ TELEGRAM_BOT_TOKEN не настроен в .env файле');
      return;
    }

    console.log('🔄 Starting Telegram Long Polling...');
    
    // Сначала убедимся, что вебхук отключен
    try {
      await deleteWebhook();
      console.log('✅ Webhook проверен/отключен');
    } catch (error) {
      console.log('ℹ️ Webhook уже отключен или не был установлен');
    }

    this.isPolling = true;
    this.retryCount = 0;
    await this.poll();
  }

  async poll() {
    while (this.isPolling) {
      try {
        const response = await axios.get(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`,
          {
            params: {
              offset: this.offset,
              timeout: 30, // Ждем 30 секунд
              limit: 100,
              allowed_updates: ['message', 'callback_query'] // Указываем типы обновлений
            },
            timeout: 35000, // 35 секунд (больше чем timeout в параметрах)
            validateStatus: function (status) {
              return status < 500; // Разрешаем только статусы меньше 500
            }
          }
        );

        // Сбрасываем счетчик повторных попыток при успешном запросе
        this.retryCount = 0;

        if (response.data.ok && response.data.result.length > 0) {
          console.log(`📨 Received ${response.data.result.length} updates`);
          
          for (const update of response.data.result) {
            console.log(`🔄 Processing update ${update.update_id}`);
            
            try {
              await handleTelegramUpdate(update);
              // Обновляем offset чтобы не обрабатывать повторно
              this.offset = update.update_id + 1;
            } catch (updateError) {
              console.error(`❌ Error processing update ${update.update_id}:`, updateError.message);
              // Все равно обновляем offset чтобы не застрять
              this.offset = update.update_id + 1;
            }
          }
        } else if (!response.data.ok) {
          console.error('❌ Telegram API error:', response.data);
        }

      } catch (error) {
        this.retryCount++;
        
        if (error.response) {
          // Обработка HTTP ошибок
          const status = error.response.status;
          
          if (status === 409) {
            console.error('❌ Conflict: Вебхук активен. Отключаем вебхук...');
            
            try {
              await deleteWebhook();
              console.log('✅ Webhook отключен, продолжаем поллинг...');
              // Ждем немного перед повторной попыткой
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue; // Продолжаем цикл
            } catch (webhookError) {
              console.error('❌ Не удалось отключить вебхук:', webhookError.message);
            }
          } else if (status === 429) {
            // Too Many Requests
            const retryAfter = error.response.data.parameters?.retry_after || 30;
            console.log(`⏳ Rate limit, waiting ${retryAfter} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            continue;
          } else {
            console.error(`❌ HTTP Error ${status}:`, error.response.data);
          }
        } else if (error.request) {
          // Network error
          console.error('❌ Network error:', error.message);
        } else {
          // Other errors
          console.error('❌ Polling error:', error.message);
        }

        // Если превышено количество повторных попыток, останавливаем поллинг
        if (this.retryCount >= this.maxRetries) {
          console.error(`❌ Превышено максимальное количество попыток (${this.maxRetries}). Останавливаем поллинг.`);
          this.stopPolling();
          break;
        }

        // Экспоненциальная задержка перед повторной попыткой
        const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
        console.log(`⏳ Retrying in ${delay / 1000} seconds... (attempt ${this.retryCount}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  stopPolling() {
    this.isPolling = false;
    console.log('🛑 Stopped Telegram Polling');
  }

  // Метод для перезапуска поллинга
  async restartPolling() {
    this.stopPolling();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.startPolling();
  }
}

export default new TelegramPoller();