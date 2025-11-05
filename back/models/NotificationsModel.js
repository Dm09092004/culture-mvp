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

    // Модель для регулярных уведомлений с полным набором полей
    this.regularNotificationsModel = sequelize.define('RegularNotification', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      schedule: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'manual'
      },
      enabled: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      time: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true
      },
      dayOfWeek: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true
      },
      dayOfMonth: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true
      },
      lastSent: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true
      },
      metadata: {
        type: Sequelize.DataTypes.JSON,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  }

  async init() {
    await super.init();
    await this.settingsModel.sync();
    await this.regularNotificationsModel.sync(); 

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

  // Методы для регулярных уведомлений
  async getAllRegularNotifications() {
    const notifications = await this.regularNotificationsModel.findAll({
      order: [['createdAt', 'DESC']]
    });
    return notifications.map(notif => notif.toJSON());
  }

  async createRegularNotification(notificationData) {
    const newNotification = await this.regularNotificationsModel.create({
      ...notificationData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return newNotification.toJSON();
  }

  async updateRegularNotification(id, updates) {
    const notification = await this.regularNotificationsModel.findByPk(id);
    if (notification) {
      await notification.update({
        ...updates,
        updatedAt: new Date()
      });
      return notification.toJSON();
    }
    return null;
  }

  async deleteRegularNotification(id) {
    const result = await this.regularNotificationsModel.destroy({
      where: { id }
    });
    return result > 0;
  }

  async toggleRegularNotification(id) {
    const notification = await this.regularNotificationsModel.findByPk(id);
    if (notification) {
      const newEnabled = !notification.enabled;
      await notification.update({ 
        enabled: newEnabled,
        updatedAt: new Date()
      });
      return notification.toJSON();
    }
    return null;
  }

  async getActiveRegularNotifications() {
    const notifications = await this.regularNotificationsModel.findAll({
      where: { enabled: true },
      order: [['createdAt', 'DESC']]
    });
    return notifications.map(notif => notif.toJSON());
  }

  // Остальные методы остаются без изменений
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