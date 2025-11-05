import GigaChatService from '../services/gigachat.js';

/**
 * Generate email message using AI
 */
export const generateMessage = async (req, res) => {
  try {
    const { 
      type = 'value_reminder', 
      valueTitle, 
      mission, 
      tone = 'friendly',
      length = 'medium'
    } = req.body;

    if (!valueTitle || !mission) {
      return res.status(400).json({
        success: false,
        error: 'Value title and mission are required'
      });
    }

    const prompt = generatePrompt(type, valueTitle, mission, tone, length);
    console.log('Generating message with prompt:', prompt);

    let generatedMessage;
    try {
      generatedMessage = await GigaChatService.generateMessage(prompt);
    } catch (gigaError) {
      console.error('GigaChat message generation failed, using template:', gigaError.message);
      generatedMessage = generateTemplateMessage(type, valueTitle, mission);
    }

    res.json({
      success: true,
      data: {
        message: generatedMessage,
        type,
        valueTitle,
        generated: true
      }
    });

  } catch (error) {
    console.error('Generate message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate message'
    });
  }
};

function generatePrompt(type, valueTitle, mission, tone, length) {
  const toneMap = {
    friendly: 'дружелюбный и мотивирующий',
    professional: 'профессиональный и вдохновляющий',
    energetic: 'энергичный и воодушевляющий',
    caring: 'заботливый и поддерживающий'
  };

  const lengthMap = {
    short: 'короткое (2-3 предложения)',
    medium: 'средней длины (4-5 предложений)',
    long: 'подробное (6-7 предложений)'
  };

  const typeMap = {
    value_reminder: `напоминание о корпоративной ценности "${valueTitle}"`,
    mission_quote: `цитата или напоминание о миссии компании`,
    team_shoutout: `благодарность команде и признание их работы`
  };

  return `Создай ${lengthMap[length]} email-сообщение для сотрудников компании.

Тон: ${toneMap[tone]}
Тип: ${typeMap[type]}
Ценность компании: "${valueTitle}"
Миссия компании: "${mission}"

Требования к сообщению:
- Начни с персонального обращения (используй местоимение "ты" или "вы")
- Упомяни ценность компании органично
- Свяжи с миссией компании
- Добавь мотивирующий призыв к действию
- Используй 1-2 уместных эмодзи
- Закончи подписью "С уважением, CultureOS"

Сообщение должно звучать естественно и искренне.`;
}

function generateTemplateMessage(type, valueTitle, mission) {
  const templates = {
    value_reminder: `Привет! 🌟

Сегодня хотели напомнить о нашей важной ценности: "${valueTitle}".

${mission}

Давай воплотим это в наших действиях сегодня! 💪

С уважением, CultureOS`,

    mission_quote: `Добрый день! ✨

Напоминаем о нашей общей миссии: "${mission}".

Ценность "${valueTitle}" помогает нам двигаться к этой цели.

Продолжаем в том же духе! 🚀

С уважением, CultureOS`,

    team_shoutout: `Приветствую! 👏

Хочу отметить, как здорово мы проявляем ценность "${valueTitle}"!

${mission}

Спасибо за ваш вклад! 💙

С уважением, CultureOS`
  };

  return templates[type] || templates.value_reminder;
}