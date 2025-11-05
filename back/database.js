import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
  define: {
    timestamps: true,
  }
});

export const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite подключена успешно');
    await sequelize.sync(); // Создает таблицы если их нет
    return sequelize;
  } catch (error) {
    console.error('❌ Ошибка подключения к SQLite:', error);
    throw error;
  }
};

export default sequelize;