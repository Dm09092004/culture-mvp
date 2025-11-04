import BaseModel from './BaseModel.js';

class NotificationsModel extends BaseModel {
  constructor() {
    super();
    super.set('notifications', []); // Используем super.set
    super.set('settings', { // Используем super.set
      frequency: 'weekly',
      types: ['value_reminder', 'mission_quote', 'team_shoutout']
    });
    this.nextId = 1;
  }

  async getAll() {
    return super.get('notifications') || []; // Используем super.get
  }

  async add(notificationData) {
    const notifications = super.get('notifications') || []; // Используем super.get
    const newNotification = {
      id: this.nextId.toString(),
      date: new Date().toLocaleDateString('ru-RU'),
      status: 'sent',
      ...notificationData
    };
    
    notifications.unshift(newNotification); // Add to beginning
    super.set('notifications', notifications); // Используем super.set
    this.nextId++;
    
    return newNotification;
  }

  async getSettings() {
    return super.get('settings'); // Используем super.get
  }

  async updateSettings(newSettings) {
    const currentSettings = super.get('settings'); // Используем super.get
    const updatedSettings = { ...currentSettings, ...newSettings };
    super.set('settings', updatedSettings); // Используем super.set
    return updatedSettings;
  }
}

export default new NotificationsModel();