import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { DEEPSEEK_API_KEY, DEEPSEEK_MODEL } from '../config/deepseek';

const mockFallback = {
  values: [
    { icon: '🚀', title: 'Рост', description: 'Постоянное развитие' },
    { icon: '🤝', title: 'Команда', description: 'Поддержка и доверие' },
    { icon: '🎯', title: 'Результат', description: 'Фокус на цели' },
  ],
  mission: 'Мы создаем культуру роста и успеха.',
  recommendations: '1. Еженедельные митинги\n2. Ретроспективы',
};

export default function Results() {
  const { answers } = useStore();  // ← ОТВЕТЫ ИЗ ОПРОСА
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [aiValues, setAiValues] = useState(mockFallback.values);
  const [aiMission, setAiMission] = useState(mockFallback.mission);
  const [recommendations, setRecommendations] = useState(mockFallback.recommendations);

  const analyzeWithDeepSeek = async () => {
    if (answers.length < 3) {
      toast.error('Пройдите опрос!');
      setIsAnalyzing(false);
      return;
    }

    const prompt = `Коротко проанализируй:
${answers.join('. ')}

Верни ТОЛЬКО JSON:
{"values": [{"icon": "🚀", "title": "Рост", "description": "Развитие"}], "mission": "Мы растём", "recommendations": "1. Митинги"}`;

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) throw new Error('API ошибка');

      const data = await response.json();
      const content = data.choices[0].message.content.replace(/```json|```/g, '').trim();
      const json = JSON.parse(content);

      setAiValues(json.values || mockFallback.values);
      setAiMission(json.mission || mockFallback.mission);
      setRecommendations(json.recommendations || mockFallback.recommendations);
      toast.success('DeepSeek анализ готов! 🧠');
    } catch (error) {
      console.error(error);
      toast.error('Mock данные');
      setAiValues(mockFallback.values);
      setAiMission(mockFallback.mission);
      setRecommendations(mockFallback.recommendations);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    analyzeWithDeepSeek();
  }, []);

  if (answers.length === 0) {
    navigate('/survey');
    return null;
  }

  return (
    <div className="space-y-12">
      <motion.div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          DeepSeek анализ <Sparkles className="inline w-8 h-8 text-primary" />
        </h1>
        <p className="text-lg text-gray-600">ИИ на основе ваших ответов</p>
      </motion.div>

      {isAnalyzing ? (
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-xl">DeepSeek думает...</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            {aiValues.map((v, i) => (
              <motion.div key={i} className="card text-center">
                <div className="text-5xl mb-4">{v.icon}</div>
                <h3 className="text-xl font-bold mb-2">{v.title}</h3>
                <p className="text-gray-600">{v.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Миссия</h2>
            <p className="text-lg">{aiMission}</p>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Рекомендации</h2>
            <pre className="text-gray-700 whitespace-pre-wrap">{recommendations}</pre>
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