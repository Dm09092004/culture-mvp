import axios from 'axios';

const GIGACHAT_CONFIG = {
  authKey: process.env.GIGACHAT_AUTH_KEY || "MDE5YTRhNzEtYWEyYy03MjM4LWExMjUtNTZmNTIwNDg1MTRhOjAzZTU1NDNkLWQ1MGQtNDVhMy1iYWU5LWE3ODkxY2Y4MzVkNA==",
  scope: "GIGACHAT_API_PERS"
};

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function getGigaChatToken() {
  try {
    const response = await axios.post(
      'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
      `scope=${GIGACHAT_CONFIG.scope}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'RqUID': generateUUID(),
          'Authorization': `Basic ${GIGACHAT_CONFIG.authKey}`
        },
        httpsAgent: new (await import('https')).Agent({ rejectUnauthorized: false })
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Token error:', error.response?.data || error.message);
    throw new Error('Failed to get GigaChat token');
  }
}

async function chatWithGigaChat(token, userMessage) {
  try {
    const response = await axios.post(
      'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
      {
        model: "GigaChat",
        messages: [{ role: "user", content: userMessage }],
        stream: false,
        repetition_penalty: 1
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        httpsAgent: new (await import('https')).Agent({ rejectUnauthorized: false })
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Chat error:', error.response?.data || error.message);
    throw new Error('Failed to get response from GigaChat');
  }
}

const mockFallback = {
  values: [
    { icon: '🚀', title: 'Рост', description: 'Постоянное развитие и обучение' },
    { icon: '🤝', title: 'Команда', description: 'Взаимная поддержка и доверие' },
    { icon: '🎯', title: 'Результат', description: 'Фокус на достижении целей' },
  ],
  mission: 'Мы создаем среду для роста и развития, где каждый сотрудник может раскрыть свой потенциал и достигать выдающихся результатов вместе с командой.',
  recommendations: '1. Внедрите еженедельные планёрки для синхронизации\n2. Организуйте менторскую программу\n3. Проводите ретроспективы для улучшения процессов'
};

export async function getGigaChatAnalysis(answers) {
  try {
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

    const token = await getGigaChatToken();
    const response = await chatWithGigaChat(token, prompt);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Invalid JSON response');
    }
  } catch (error) {
    console.error('GigaChat analysis failed, using fallback:', error);
    return mockFallback;
  }
}