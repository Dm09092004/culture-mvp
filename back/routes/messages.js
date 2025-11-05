import express from 'express';
import { generateMessage } from '../controllers/messageController.js';

const router = express.Router();

router.post('/generate', generateMessage);

export default router;