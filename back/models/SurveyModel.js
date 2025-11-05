import { BaseModel } from './BaseModel.js';
import { Sequelize } from 'sequelize';

class SurveyModel extends BaseModel {
  constructor() {
    super('Survey', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      currentStep: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      answers: {
        type: Sequelize.DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      },
      completed: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    });
  }

  async init() {
    await super.init();
    // Создаем начальную запись если ее нет
    const existing = await this.model.findOne();
    if (!existing) {
      await this.model.create({
        currentStep: 0,
        answers: [],
        completed: false
      });
    }
    return this;
  }

  async getState() {
    const survey = await this.model.findOne();
    return survey ? survey.toJSON() : null;
  }

  async updateState(updates) {
    const survey = await this.model.findOne();
    if (survey) {
      await survey.update(updates);
      return survey.toJSON();
    }
    return null;
  }

  async reset() {
    const survey = await this.model.findOne();
    if (survey) {
      await survey.update({
        currentStep: 0,
        answers: [],
        completed: false
      });
      return survey.toJSON();
    }
    return null;
  }
}

const surveyModel = new SurveyModel();
await surveyModel.init();
export default surveyModel;