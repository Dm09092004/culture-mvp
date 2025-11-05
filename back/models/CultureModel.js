import { BaseModel } from './BaseModel.js';
import { Sequelize } from 'sequelize';

class CultureModel extends BaseModel {
  constructor() {
    super('Culture', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      values: {
        type: Sequelize.DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      },
      mission: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
      },
      recommendations: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
      }
    });
  }

  async init() {
    await super.init();
    // Создаем начальную запись если ее нет
    const existing = await this.model.findOne();
    if (!existing) {
      await this.model.create({
        values: [],
        mission: '',
        recommendations: ''
      });
    }
    return this;
  }

  async get() {
    const culture = await this.model.findOne();
    return culture ? culture.toJSON() : null;
  }

  async saveAnalysis(analysis) {
    const cultureWithIds = {
      ...analysis,
      values: analysis.values.map((value, index) => ({
        ...value,
        id: (index + 1).toString()
      }))
    };

    const existing = await this.model.findOne();
    if (existing) {
      await existing.update(cultureWithIds);
      return existing.toJSON();
    } else {
      const newRecord = await this.model.create(cultureWithIds);
      return newRecord.toJSON();
    }
  }
}

const cultureModel = new CultureModel();
await cultureModel.init();
export default cultureModel;