import { motion } from 'framer-motion';
import { Mic, ChevronLeft, ChevronRight } from 'lucide-react';
import { surveyQuestions } from '../data/surveyQuestions';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export default function Survey() {
  const { currentStep, nextStep, prevStep, answers, setAnswer } = useStore();
  const navigate = useNavigate();
  const question = surveyQuestions[currentStep];
  const selected = answers[currentStep];

  const handleNext = () => {
    if (currentStep === surveyQuestions.length - 1) {
      // Генерация результатов (заглушка)
      navigate('/results');
    } else {
      nextStep();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <div className="text-sm text-gray-600 mb-2">
          Вопрос {currentStep + 1} из {surveyQuestions.length}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-primary h-2 rounded-full transition-all"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / surveyQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="card"
      >
        <h2 className="text-2xl font-bold text-text mb-8 text-center">
          {question.question}
        </h2>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {question.answers.map((answer, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setAnswer(currentStep, answer)}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                selected === answer
                  ? 'border-primary bg-blue-50'
                  : 'border-gray-200 hover:border-primary hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{answer}</span>
            </motion.button>
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
      </motion.div>
    </div>
  );
}