import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';

// Routes
import surveyRoutes from './routes/survey.js';
import employeesRoutes from './routes/employees.js';
import cultureRoutes from './routes/culture.js';
import notificationsRoutes from './routes/notifications.js';
import gigachatRouters from './routes/gigachat.js';
import messageRoutes from './routes/messages.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  abortOnLimit: true
}));
app.use('/api/messages', messageRoutes);
app.use('/api/survey', surveyRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/culture', cultureRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/gig', gigachatRouters);

// Health check with detailed info
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CultureOS Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});