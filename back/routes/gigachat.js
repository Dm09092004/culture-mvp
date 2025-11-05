// server/routes/gigachat.js
import express from 'express';
import { refreshToken, getTokenStatus, testConnection } from '../controllers/gigachatController.js';

const router = express.Router();

router.post('/refresh-token', refreshToken);
router.get('/token-status', getTokenStatus);
router.get('/test-connection', testConnection);

export default router;