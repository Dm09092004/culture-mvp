import express from 'express';
import {
  getCulture,
  analyzeCulture
} from '../controllers/cultureController.js';

const router = express.Router();

router.get('/', getCulture);
router.post('/analyze', analyzeCulture);

export default router;