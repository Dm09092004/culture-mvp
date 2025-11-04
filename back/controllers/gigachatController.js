// server/controllers/gigachatController.js
import GigaChatService from '../services/gigachat.js';

export const refreshToken = async (req, res) => {
  try {
    const token = await GigaChatService.refreshToken();
    const status = GigaChatService.getTokenStatus();
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      ...status
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
};

export const getTokenStatus = async (req, res) => {
  try {
    const status = GigaChatService.getTokenStatus();
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Token status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token status'
    });
  }
};

export const testConnection = async (req, res) => {
  try {
    const token = await GigaChatService.getToken();
    const status = GigaChatService.getTokenStatus();
    
    res.json({
      success: true,
      message: 'GigaChat connection successful',
      ...status
    });
  } catch (error) {
    console.error('Connection test error:', error);
    res.status(500).json({
      success: false,
      error: 'GigaChat connection failed: ' + error.message
    });
  }
};