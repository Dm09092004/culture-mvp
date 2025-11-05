// server/routes/telegram.js
import express from 'express';
import { 
  testTelegramConnection, 
  sendCustomMessage, 
  getTelegramStatus,
  setupWebhook,
  handleWebhook,
  broadcastMessage,
  sendToEmployee,
  getSubscribers
} from '../controllers/telegramController.js';

const router = express.Router();

router.get('/test', testTelegramConnection);
router.get('/status', getTelegramStatus);
router.get('/subscribers', getSubscribers);
router.post('/send', sendCustomMessage);
router.post('/broadcast', broadcastMessage);
router.post('/send-to-employee', sendToEmployee);
router.post('/setup-webhook', setupWebhook);
router.post('/webhook', handleWebhook); // Вебхук для Telegram

export default router;