import { BaseModel } from './BaseModel.js';
import { Sequelize } from 'sequelize';
import sequelize from '../database.js';

class NotificationsModel extends BaseModel {
  constructor() {
    super('Notification', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'sent'
      },
      date: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      }
    });

    this.settingsModel = sequelize.define('NotificationSettings', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      frequency: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'weekly'
      },
      types: {
        type: Sequelize.DataTypes.JSON,
        allowNull: false,
        defaultValue: ['value_reminder', 'mission_quote', 'team_shoutout']
      }
    });
  }

  async init() {
    await super.init();
    await this.settingsModel.sync();
    
    // Создаем настройки по умолчанию если их нет
    const existingSettings = await this.settingsModel.findOne();
    if (!existingSettings) {
      await this.settingsModel.create({
        frequency: 'weekly',
        types: ['value_reminder', 'mission_quote', 'team_shoutout']
      });
    }
    
    return this;
  }

  async getAll() {
    const notifications = await this.model.findAll({
      order: [['id', 'DESC']]
    });
    return notifications.map(notif => notif.toJSON());
  }

  async add(notificationData) {
    const newNotification = await this.model.create({
      ...notificationData,
      date: new Date().toLocaleDateString('ru-RU')
    });
    return newNotification.toJSON();
  }

  async getSettings() {
    const settings = await this.settingsModel.findOne();
    return settings ? settings.toJSON() : null;
  }

  async updateSettings(newSettings) {
    const settings = await this.settingsModel.findOne();
    if (settings) {
      await settings.update(newSettings);
      return settings.toJSON();
    }
    return null;
  }
}

const notificationsModel = new NotificationsModel();
await notificationsModel.init();
export default notificationsModel;