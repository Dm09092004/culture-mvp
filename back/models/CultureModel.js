import BaseModel from './BaseModel.js';

class CultureModel extends BaseModel {
  constructor() {
    super();
    // Initial state
    super.set('culture', {
      values: [],
      mission: '',
      recommendations: ''
    });
  }

  async get() {
    return super.get('culture'); // Используем super.get вместо this.get
  }

  async saveAnalysis(analysis) {
    const cultureWithIds = {
      ...analysis,
      values: analysis.values.map((value, index) => ({
        ...value,
        id: (index + 1).toString()
      }))
    };
    super.set('culture', cultureWithIds); // Используем super.set
    return cultureWithIds;
  }
}

export default new CultureModel();