import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Loader2, Edit2, Save, X } from 'lucide-react';
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
  const [editingMission, setEditingMission] = useState(false);
  const [editingRecommendations, setEditingRecommendations] = useState(false);
  const [tempMission, setTempMission] = useState('');
  const [tempRecommendations, setTempRecommendations] = useState('');

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

  useEffect(() => {
    if (culture) {
      setTempMission(culture.mission);
      setTempRecommendations(culture.recommendations);
    } else if (survey?.answers && survey.answers.length > 0) {
      setTempMission(FallbackCulture.mission);
      setTempRecommendations(FallbackCulture.recommendations);
    }
  }, [culture, survey]);

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

  const handleSaveMission = () => {
    // Здесь можно добавить логику сохранения миссии в стор или на сервер
    setEditingMission(false);
    toast.success('Миссия обновлена!');
  };

  const handleSaveRecommendations = () => {
    // Здесь можно добавить логику сохранения рекомендаций в стор или на сервер
    setEditingRecommendations(false);
    toast.success('Рекомендации обновлены!');
  };

  const cancelEditMission = () => {
    setTempMission(culture?.mission || FallbackCulture.mission);
    setEditingMission(false);
  };

  const cancelEditRecommendations = () => {
    setTempRecommendations(culture?.recommendations || FallbackCulture.recommendations);
    setEditingRecommendations(false);
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

  return (
    <div className="space-y-12">
      <motion.div className="text-center">
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
      </motion.div>

      {isAnalyzing ? (
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-xl">GigaChat анализирует ответы...</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            {displayCulture.values.map((value) => (
              <motion.div key={value.id} className="card text-center">
                <div className="text-5xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Mission Section with Edit */}
          <div className="card relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Миссия</h2>
              <button
                onClick={() => setEditingMission(true)}
                className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </div>

            {editingMission ? (
              <div className="space-y-4">
                <textarea
                  value={tempMission}
                  onChange={(e) => setTempMission(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Опишите миссию вашей компании..."
                />
                <div className="flex space-x-3">
                  <button
                    onClick={cancelEditMission}
                    className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Отмена
                  </button>
                  <button
                    onClick={handleSaveMission}
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-lg">{tempMission}</p>
            )}
          </div>

          {/* Recommendations Section with Edit */}
          <div className="card relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Рекомендации</h2>
              <button
                onClick={() => setEditingRecommendations(true)}
                className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </div>

            {editingRecommendations ? (
              <div className="space-y-4">
                <textarea
                  value={tempRecommendations}
                  onChange={(e) => setTempRecommendations(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                  placeholder="Введите рекомендации..."
                />
                <div className="flex space-x-3">
                  <button
                    onClick={cancelEditRecommendations}
                    className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Отмена
                  </button>
                  <button
                    onClick={handleSaveRecommendations}
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить
                  </button>
                </div>
              </div>
            ) : (
              <pre className="text-gray-700 whitespace-pre-wrap">{tempRecommendations}</pre>
            )}
          </div>

          <div className="text-center">
            <Link to="/employees" className="btn-primary text-lg inline-flex items-center space-x-2">
              <span>Добавить сотрудников</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
