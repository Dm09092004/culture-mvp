import express from 'express';
import {
  getNotifications,
  sendNotifications,
  sendRegularNotifications,
  sendScheduledNotifications,
  getSettings,
  updateSettings,
  getRegularNotifications,
  createRegularNotification,
  updateRegularNotification,
  deleteRegularNotification,
  toggleRegularNotification,
  getActiveRegularNotifications
} from '../controllers/notificationsController.js';

const router = express.Router();

// Существующие роуты
router.get('/', getNotifications);
router.post('/send', sendNotifications);
router.post('/send-regular', sendRegularNotifications);
router.post('/send-scheduled', sendScheduledNotifications);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Роуты для регулярных уведомлений
router.get('/regular', getRegularNotifications);
router.get('/regular/active', getActiveRegularNotifications);
router.post('/regular', createRegularNotification);
router.put('/regular/:id', updateRegularNotification);
router.delete('/regular/:id', deleteRegularNotification);
router.patch('/regular/:id/toggle', toggleRegularNotification);

export default router;