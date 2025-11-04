// back/telegramPoller.js
import axios from 'axios';
import { handleTelegramUpdate } from './services/telegramService.js';
import dotenv from 'dotenv';


dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

class TelegramPoller {
  constructor() {
    this.offset = 0;
    this.isPolling = false;
  }

  async startPolling() {
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('❌ TELEGRAM_BOT_TOKEN не настроен в .env файле');
      return;
    }

    console.log('🔄 Starting Telegram Long Polling...');
    this.isPolling = true;
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
              limit: 100
            },
            timeout: 35000
          }
        );
        console.log(response);

        if (response.data.ok && response.data.result.length > 0) {
          for (const update of response.data.result) {
            console.log('📨 Received update:', update.update_id);
            await handleTelegramUpdate(update);
            
            // Обновляем offset чтобы не обрабатывать повторно
            this.offset = update.update_id + 1;
          }
        }
      } catch (error) {
        console.error('❌ Polling error:', error.message);
        
        // Ждем перед повторной попыткой
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  stopPolling() {
    this.isPolling = false;
    console.log('🛑 Stopped Telegram Polling');
  }
}

export default new TelegramPoller();