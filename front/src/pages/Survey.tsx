import { useState, useEffect } from 'react';
import { Mic, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { surveyQuestions } from '../data/surveyQuestions';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export default function Survey() {
  const { 
    currentStep, 
    answers, 
    setAnswer, 
    nextStep, 
    prevStep, 
    loadSurvey,
    loading 
  } = useStore();
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);
  
  const question = surveyQuestions[currentStep];
  const selected = answers[currentStep];

  // Загружаем данные опроса при монтировании компонента
  useEffect(() => {
    const initialize = async () => {
      await loadSurvey();
      setIsInitialized(true);
    };
    
    initialize();
  }, [loadSurvey]);

  const handleNext = () => {
    if (currentStep === surveyQuestions.length - 1) {
      navigate('/results');
    } else {
      nextStep();
    }
  };

  // Показываем индикатор загрузки пока данные загружаются
  if (loading.survey || !isInitialized) {
    return (
      <div className="max-w-4xl mx-auto flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Загрузка опроса...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <div className="text-sm text-gray-600 mb-2">
          Вопрос {currentStep + 1} из {surveyQuestions.length}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / surveyQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      <div
        key={currentStep}
        className="card"
      >
        <h2 className="text-2xl font-bold text-text mb-8 text-center">
          {question.question}
        </h2>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {question.answers.map((answer, i) => (
            <button
              key={`${currentStep}-${i}`}
              onClick={() => setAnswer(currentStep, answer)}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                selected === answer
                  ? 'border-primary bg-blue-50'
                  : 'border-gray-200 hover:border-primary hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{answer}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Назад</span>
          </button>

          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 text-primary hover:text-blue-700">
              <Mic className="w-5 h-5" />
              <span className="hidden sm:inline">Голосом</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!selected}
              className="btn-primary flex items-center space-x-2"
            >
              <span>{currentStep === surveyQuestions.length - 1 ? 'Завершить' : 'Далее'}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}