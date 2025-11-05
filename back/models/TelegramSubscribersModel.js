import { BaseModel } from './BaseModel.js';
import { Sequelize } from 'sequelize';

class TelegramSubscribersModel extends BaseModel {
  constructor() {
    super('TelegramSubscriber', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      chatId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      firstName: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true
      },
      lastName: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true
      },
      username: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true
      },
      subscribedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      isActive: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true
      }
    });
  }

  async getAll() {
    const subscribers = await this.model.findAll({
      order: [['subscribedAt', 'DESC']]
    });
    return subscribers.map(sub => sub.toJSON());
  }

  async findByEmail(email) {
    const subscriber = await this.model.findOne({
      where: { email: email.toLowerCase() }
    });
    return subscriber ? subscriber.toJSON() : null;
  }

  async findByChatId(chatId) {
    const subscriber = await this.model.findOne({
      where: { chatId }
    });
    return subscriber ? subscriber.toJSON() : null;
  }

  async subscribe(chatId, email, userData = {}) {
    try {
      const newSubscriber = await this.model.create({
        chatId,
        email: email.toLowerCase(),
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        username: userData.username || '',
        subscribedAt: new Date(),
        isActive: true
      });
      return newSubscriber.toJSON();
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        if (error.fields && error.fields.chatId) {
          throw new Error('Этот Telegram аккаунт уже подписан');
        } else if (error.fields && error.fields.email) {
          throw new Error('Этот email уже используется для другой подписки');
        }
      }
      throw error;
    }
  }

  async unsubscribe(chatId) {
    const result = await this.model.destroy({
      where: { chatId }
    });
    return result > 0;
  }

  async updateSubscription(chatId, updates) {
    const subscriber = await this.model.findOne({
      where: { chatId }
    });
    
    if (!subscriber) {
      throw new Error('Подписка не найдена');
    }

    await subscriber.update({
      ...updates,
      updatedAt: new Date()
    });
    
    return subscriber.toJSON();
  }

  async getSubscriberByEmployeeEmail(employeeEmail) {
    const subscriber = await this.model.findOne({
      where: { 
        email: employeeEmail.toLowerCase(),
        isActive: true
      }
    });
    return subscriber ? subscriber.toJSON() : null;
  }
}

const telegramSubscribersModel = new TelegramSubscribersModel();
await telegramSubscribersModel.init();
export default telegramSubscribersModel;