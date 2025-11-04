import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useServerStore } from '../store/useStore';
import { useUIStore } from '../store/useStore';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const FallbackCulture = {
  values: [
    { id: '1', icon: '🚀', title: 'Рост', description: 'Постоянное развитие' },
    { id: '2', icon: '🤝', title: 'Команда', description: 'Поддержка и доверие' },
    { id: '3', icon: '🎯', title: 'Результат', description: 'Фокус на цели' },
  ],
  mission: 'Мы создаем культуру роста и успеха.',
  recommendations: '1. Еженедельные митинги\n2. Ретроспективы',
};

export default function Results() {
  const navigate = useNavigate();
  const { 
    survey, 
    culture, 
    loading, 
    loadSurvey, 
    analyzeCulture, 
    loadCulture 
  } = useServerStore();
  const { setLoading } = useUIStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await loadSurvey();
        await loadCulture();
        
        // Если есть ответы но нет анализа - запускаем анализ
        if (survey?.answers && survey.answers.length > 0 && !culture) {
          startAnalysis();
        }
      } catch (error) {
        console.error('Initialization error:', error);
        toast.error('Ошибка загрузки данных');
      }
    };

    initializeData();
  }, []);

  const startAnalysis = async () => {
    if (!survey?.answers || survey.answers.length === 0) {
      toast.error('Пройдите опрос сначала!');
      navigate('/survey');
      return;
    }

    setIsAnalyzing(true);
    setLoading(true);

    try {
      await analyzeCulture(survey.answers);
      toast.success('Анализ завершен! 🧠');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Ошибка анализа. Используем стандартные значения.');
    } finally {
      setIsAnalyzing(false);
      setLoading(false);
    }
  };

  if (!survey || loading.survey) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-xl">Загрузка...</p>
      </div>
    );
  }

  if (survey.answers.length === 0) {
    navigate('/survey');
    return null;
  }

  const displayCulture = culture || FallbackCulture;

  return  (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Анализ культуры <Sparkles className="inline w-8 h-8 text-primary" />
        </h1>
        <p className="text-lg text-gray-600">На основе ответов вашей команды</p>
        
        {!culture && !isAnalyzing && (
          <button
            onClick={startAnalysis}
            className="btn-primary mt-4 inline-flex items-center space-x-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>Запустить анализ ИИ</span>
          </button>
        )}
      </div>

      {isAnalyzing ? (
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-xl">GigaChat анализирует ответы...</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            {displayCulture.values.map((value, index) => (
              <div 
                key={value.id} 
                className="card text-center"
                style={{
                  opacity: 0,
                  animation: `fadeIn 0.5s ease-out ${index * 0.1}s forwards`
                }}
              >
                <div className="text-5xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>

          <div 
            className="card"
            style={{
              opacity: 0,
              animation: 'fadeIn 0.5s ease-out 0.3s forwards'
            }}
          >
            <h2 className="text-2xl font-bold mb-4">Миссия</h2>
            <p className="text-lg">{displayCulture.mission}</p>
          </div>

          <div 
            className="card"
            style={{
              opacity: 0,
              animation: 'fadeIn 0.5s ease-out 0.5s forwards'
            }}
          >
            <h2 className="text-2xl font-bold mb-4">Рекомендации</h2>
            <pre className="text-gray-700 whitespace-pre-wrap">{displayCulture.recommendations}</pre>
          </div>

          <div 
            className="text-center"
            style={{
              opacity: 0,
              animation: 'fadeIn 0.5s ease-out 0.7s forwards'
            }}
          >
            <Link to="/employees" className="btn-primary text-lg inline-flex items-center space-x-2">
              <span>Добавить сотрудников</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}