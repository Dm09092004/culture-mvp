// back/getChatId.js
import axios from 'axios';

const TELEGRAM_BOT_TOKEN = "8508178545:AAHr_i40uPVvvJzlO62Pykx20skTSSTTUyQ";

async function getChatId() {
  try {
    console.log('🔍 Получаем обновления от бота...');
    
    const response = await axios.get(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`
    );

    console.log('📨 Полученные обновления:', JSON.stringify(response.data, null, 2));

    if (response.data.result && response.data.result.length > 0) {
      console.log('\n✅ Найденные чаты:');
      response.data.result.forEach((update, index) => {
        const chat = update.message?.chat || update.my_chat_member?.chat;
        if (chat) {
          console.log(`\n${index + 1}.`);
          console.log(`   ID: ${chat.id}`);
          console.log(`   Тип: ${chat.type}`);
          console.log(`   Имя: ${chat.first_name || chat.title}`);
          console.log(`   Username: @${chat.username || 'не указан'}`);
        }
      });
    } else {
      console.log('❌ Нет обновлений. Напишите боту сообщение в Telegram и запустите скрипт снова.');
    }
  } catch (error) {
    console.error('❌ Ошибка при получении chat_id:', error.response?.data || error.message);
  }
}

getChatId();