// back/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import './cron.js';
import { initializeDatabase } from './database.js';

// Загружаем переменные окружения
dotenv.config();

// Импортируем поллинг
import telegramPoller from './telegramPoller.js';

// Routes
import surveyRoutes from './routes/survey.js';
import employeesRoutes from './routes/employees.js';
import cultureRoutes from './routes/culture.js';
import notificationsRoutes from './routes/notifications.js';
import gigachatRoutes from './routes/gigachat.js';
import telegramRoutes from './routes/telegram.js';
import messageRoutes from './routes/messages.js';

const app = express();
const PORT = process.env.PORT || 3001;

await initializeDatabase();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 },
  abortOnLimit: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Routes
app.use('/api/survey', surveyRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/culture', cultureRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/gigachat', gigachatRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const services = {
    telegram: !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID,
    gigachat: !!process.env.GIGACHAT_AUTH_KEY,
    environment: process.env.NODE_ENV || 'development'
  };

  res.json({ 
    status: 'OK', 
    message: 'CultureOS Server is running',
    timestamp: new Date().toISOString(),
    services: services
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Запускаем сервер и поллинг
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 GigaChat: ${process.env.GIGACHAT_AUTH_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`📱 Telegram: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Configured' : '❌ Missing'}`);
  
  // Запускаем Telegram поллинг
  if (process.env.TELEGRAM_BOT_TOKEN) {
    console.log('🔄 Starting Telegram poller...');
    telegramPoller.startPolling().catch(error => {
      console.error('❌ Failed to start Telegram poller:', error.message);
    });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...');
  telegramPoller.stopPolling();
  process.exit(0);
});