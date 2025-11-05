import express from 'express';
import { generateMessage,editMessage } from '../controllers/messageController.js';

const router = express.Router();

router.post('/generate', generateMessage);
router.post('/edit', editMessage);

export default router;