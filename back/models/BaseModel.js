import sequelize from '../database.js';

export class BaseModel {
  constructor(modelName, schemaDefinition) {
    this.model = sequelize.define(modelName, schemaDefinition, {
      tableName: modelName.toLowerCase(),
      timestamps: false,
    });
  }

  async init() {
    await this.model.sync();
    return this;
  }

  async set(key, value) {
    // Для обратной совместимости, но лучше использовать специфичные методы
    console.warn('Метод set не рекомендуется для SQLite, используйте специфичные методы моделей');
    return value;
  }

  async get(key) {
    console.warn('Метод get не рекомендуется для SQLite, используйте специфичные методы моделей');
    return null;
  }
}

export default BaseModel;