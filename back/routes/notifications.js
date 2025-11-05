import express from 'express';
import {
  getNotifications,
  sendNotifications,
  getSettings,
  updateSettings,
  sendScheduledNotifications
} from '../controllers/notificationsController.js';

const router = express.Router();

router.get('/', getNotifications);
router.post('/send', sendNotifications);
router.post('/send-scheduled', sendScheduledNotifications);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;