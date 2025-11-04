// server/controllers/cultureController.js
import CultureModel from '../models/CultureModel.js';
import GigaChatService from '../services/gigachat.js';

const mockFallback = {
  values: [
    { 
      id: '1', 
      icon: '🚀', 
      title: 'Рост и развитие', 
      description: 'Стремимся к постоянному обучению и профессиональному росту' 
    },
    { 
      id: '2', 
      icon: '🤝', 
      title: 'Командная работа', 
      description: 'Ценим взаимопомощь, доверие и совместное достижение целей' 
    },
    { 
      id: '3', 
      icon: '🎯', 
      title: 'Ориентация на результат', 
      description: 'Фокусируемся на достижении измеримых и значимых результатов' 
    },
  ],
  mission: 'Создавать среду, где каждый сотрудник может раскрыть свой потенциал, развиваться профессионально и достигать выдающихся результатов вместе с командой.',
  recommendations: '1. Внедрите еженедельные планёрки для синхронизации команды\n2. Организуйте программу менторства и наставничества\n3. Регулярно проводите ретроспективы для улучшения процессов\n4. Создайте систему признания достижений сотрудников\n5. Развивайте культуру открытой обратной связи'
};

export const analyzeCulture = async (req, res) => {
  try {
    const { answers } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Answers array is required'
      });
    }

    if (answers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Answers array cannot be empty'
      });
    }

    console.log('Starting culture analysis with', answers.length, 'answers');

    // Проверяем статус токена перед началом анализа
    const tokenStatus = GigaChatService.getTokenStatus();
    console.log('GigaChat token status:', tokenStatus);

    let analysis;
    let source = 'gigachat';
    
    try {
      analysis = await GigaChatService.analyzeSurvey(answers);
      console.log('GigaChat analysis completed successfully');
    } catch (gigaChatError) {
      console.warn('GigaChat analysis failed, using fallback data:', gigaChatError.message);
      analysis = mockFallback;
      source = 'fallback';
    }

    // Валидация ответа
    if (!analysis.values || !analysis.mission || !analysis.recommendations) {
      console.warn('Invalid analysis format, using fallback');
      analysis = mockFallback;
      source = 'fallback';
    }

    await CultureModel.saveAnalysis(analysis);
    
    res.json({ 
      success: true, 
      data: analysis,
      source: source,
      tokenStatus: tokenStatus
    });
  } catch (error) {
    console.error('Culture analysis error:', error);
    
    // Всегда возвращаем данные, даже если это fallback
    await CultureModel.saveAnalysis(mockFallback);
    
    res.json({ 
      success: true, 
      data: mockFallback,
      source: 'fallback',
      note: 'Analysis completed with fallback data due to service unavailability'
    });
  }
};

export const getCulture = async (req, res) => {
  try {
    const culture = await CultureModel.get();
    
    if (!culture || !culture.values || culture.values.length === 0) {
      return res.json({
        success: true,
        data: mockFallback,
        source: 'fallback'
      });
    }
    
    res.json({ 
      success: true, 
      data: culture 
    });
  } catch (error) {
    console.error('Get culture error:', error);
    
    res.json({
      success: true,
      data: mockFallback,
      source: 'fallback',
      error: 'Using fallback data due to server error'
    });
  }
};