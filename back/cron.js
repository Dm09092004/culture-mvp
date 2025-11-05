import cron from 'node-cron';
import { checkScheduledRegularNotifications } from './controllers/notificationsController.js';

// Проверка каждую минуту для отправки уведомлений по расписанию
cron.schedule('* * * * *', async () => {
  console.log('Checking for scheduled notifications...');
  const result = await checkScheduledRegularNotifications();
  
  if (result.success) {
    if (result.sent > 0) {
      console.log(`✅ Sent ${result.sent} scheduled notifications:`, result.notifications);
    } else {
      console.log('ℹ️ No notifications to send at this time');
    }
    
    if (result.skipped && result.skipped.length > 0) {
      console.log('Skipped notifications:', result.skipped);
    }
  } else {
    console.error('❌ Error in scheduled notifications:', result.error);
  }
});

export default cron;