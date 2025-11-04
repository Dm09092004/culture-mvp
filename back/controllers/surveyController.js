import SurveyModel from '../models/SurveyModel.js';

/**
 * Get current survey state
 */
export const getSurveyState = async (req, res) => {
  try {
    const state = await SurveyModel.getState();
    res.json({ 
      success: true, 
      data: state 
    });
  } catch (error) {
    console.error('Get survey error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get survey state' 
    });
  }
};

/**
 * Update survey answers and current step
 */
export const updateSurveyAnswers = async (req, res) => {
  try {
    const { answers, currentStep } = req.body;
    
    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Answers must be an array'
      });
    }

    const state = await SurveyModel.updateState({ 
      answers, 
      currentStep: currentStep || 0 
    });
    
    res.json({ 
      success: true, 
      data: state 
    });
  } catch (error) {
    console.error('Update survey error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update survey' 
    });
  }
};

/**
 * Reset survey to initial state
 */
export const resetSurvey = async (req, res) => {
  try {
    const state = await SurveyModel.reset();
    res.json({ 
      success: true, 
      data: state 
    });
  } catch (error) {
    console.error('Reset survey error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reset survey' 
    });
  }
};