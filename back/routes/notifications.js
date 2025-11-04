import express from 'express';
import {
  getNotifications,
  sendNotifications,
  getSettings,
  updateSettings
} from '../controllers/notificationsController.js';

const router = express.Router();

router.get('/', getNotifications);
router.post('/send', sendNotifications);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;