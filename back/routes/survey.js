import express from 'express';
import {
  getSurveyState,
  updateSurveyAnswers,
  resetSurvey
} from '../controllers/surveyController.js';

const router = express.Router();

router.get('/', getSurveyState);
router.put('/', updateSurveyAnswers);
router.post('/reset', resetSurvey);

export default router;