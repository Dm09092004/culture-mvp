import BaseModel from './BaseModel.js';

class SurveyModel extends BaseModel {
  constructor() {
    super();
    // Initial state
    super.set('survey', {
      currentStep: 0,
      answers: []
    });
  }

  async getState() {
    return super.get('survey'); // Используем super.get
  }

  async updateState(updates) {
    const current = super.get('survey'); // Используем super.get
    const updated = { ...current, ...updates };
    super.set('survey', updated); // Используем super.set
    return updated;
  }

  async reset() {
    const resetState = {
      currentStep: 0,
      answers: []
    };
    super.set('survey', resetState); // Используем super.set
    return resetState;
  }
}

export default new SurveyModel();