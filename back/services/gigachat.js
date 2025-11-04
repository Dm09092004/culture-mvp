import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

class GigaChatService {
  constructor() {
    this.authKey = process.env.GIGACHAT_AUTH_KEY;
    this.scope = "GIGACHAT_API_PERS";
    this.token = null;
    this.tokenExpiry = null;
    this.isRefreshing = false;
    this.refreshQueue = [];
  }

  async getToken(forceRefresh = false) {
    // Если токен есть и не истек, и не запрошено принудительное обновление
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry && !forceRefresh) {
      return this.token;
    }

    // Если уже идет обновление токена, добавляем запрос в очередь
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const rqUid = uuidv4();

      console.log('Requesting new GigaChat token...', {
        clientId: '019a4a71-aa2c-7238-a125-56f52048514a',
        rqUid
      });

      const response = await axios.post(
        'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
        `scope=${this.scope}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'RqUID': rqUid,
            'Authorization': `Basic ${this.authKey}`
          },
          httpsAgent: new (await import('https')).Agent({ 
            rejectUnauthorized: false 
          }),
          timeout: 10000
        }
      );

      if (!response.data.access_token) {
        throw new Error('No access token in response');
      }

      this.token = response.data.access_token;
      // Токен действует 30 минут, устанавливаем expiry на 25 минут для запаса
      this.tokenExpiry = Date.now() + (25 * 60 * 1000);
      
      console.log('GigaChat token obtained successfully, expires at:', new Date(this.tokenExpiry).toISOString());

      // Разрешаем все ожидающие запросы
      this.refreshQueue.forEach(({ resolve }) => resolve(this.token));
      this.refreshQueue = [];
      
      return this.token;
    } catch (error) {
      console.error('GigaChat token error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.config?.headers // Логируем заголовки для отладки
      });

      // Отклоняем все ожидающие запросы
      this.refreshQueue.forEach(({ reject }) => reject(error));
      this.refreshQueue = [];
      
      throw new Error(`Failed to get GigaChat token: ${error.message}`);
    } finally {
      this.isRefreshing = false;
    }
  }

  async chatWithGigaChat(token, userMessage) {
    try {
      console.log('Sending request to GigaChat API...');
      
      const response = await axios.post(
        'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
        {
          model: "GigaChat",
          messages: [{ role: "user", content: userMessage }],
          stream: false,
          repetition_penalty: 1,
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          httpsAgent: new (await import('https')).Agent({ 
            rejectUnauthorized: false 
          }),
          timeout: 30000
        }
      );

      console.log('GigaChat API response received');
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('GigaChat API error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 401) {
        // Токен истек, принудительно обновляем
        this.token = null;
        this.tokenExpiry = null;
        throw new Error('Token expired, please retry');
      }
      
      throw new Error(`GigaChat API request failed: ${error.message}`);
    }
  }

  async analyzeSurvey(answers) {
    const prompt = `Проанализируй ответы сотрудников и создай корпоративные ценности и миссию компании.

Ответы сотрудников:
${answers.join('\n')}

Верни ТОЛЬКО JSON в следующем формате:
{
  "values": [
    {"icon": "🚀", "title": "Название ценности", "description": "Описание ценности"},
    {"icon": "🤝", "title": "Название ценности", "description": "Описание ценности"},
    {"icon": "🎯", "title": "Название ценности", "description": "Описание ценности"}
  ],
  "mission": "Краткая миссия компании основанная на ответах",
  "recommendations": "1. Первая рекомендация\\n2. Вторая рекомендация\\n3. Третья рекомендация"
}

Используй эмодзи для иконок ценностей. Будь креативным и точным.`;

    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        const token = await this.getToken(retryCount > 0);
        console.log('Token obtained, sending analysis request...');
        
        const response = await this.chatWithGigaChat(token, prompt);
        
        console.log('Raw GigaChat response:', response);
        
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('Parsed analysis result:', parsed);
          return parsed;
        } else {
          throw new Error('Invalid JSON response from GigaChat');
        }
      } catch (error) {
        retryCount++;
        console.error(`GigaChat analysis attempt ${retryCount} failed:`, error.message);
        
        if (retryCount > maxRetries) {
          throw new Error(`GigaChat analysis failed after ${maxRetries} retries: ${error.message}`);
        }
        
        // Ждем перед повторной попыткой
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
  }

  // Метод для принудительного обновления токена
  async refreshToken() {
    this.token = null;
    this.tokenExpiry = null;
    return await this.getToken(true);
  }

  // Метод для проверки статуса токена
  getTokenStatus() {
    return {
      hasToken: !!this.token,
      expiresAt: this.tokenExpiry ? new Date(this.tokenExpiry).toISOString() : null,
      isExpired: this.tokenExpiry ? Date.now() >= this.tokenExpiry : true,
      timeUntilExpiry: this.tokenExpiry ? this.tokenExpiry - Date.now() : null
    };
  }
}

export default new GigaChatService();