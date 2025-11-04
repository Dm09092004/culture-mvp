// src/pages/ValueOfDay.tsx
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { Trophy, Clock } from 'lucide-react';
import toast from 'react-hot-toast'; // УБЕРИ, если уже в useStore
// toast.success() — работает! 

export default function ValueOfDay() {
  const { aiValues, game, employees, addPoints } = useStore();

  const today = new Date().toISOString().split('T')[0];
  const value = game.valueOfDay?.date === today ? game.valueOfDay.value : null;

  const confirmValue = (empId: string) => {
    addPoints(empId, 10);
    toast.success('Отлично! +10 баллов');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Trophy className="text-yellow-500" /> Ценность дня
      </h1>

      {value ? (
        <motion.div
          initial={{ scale: 0.9 }} animate={{ scale: 1 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 text-center"
        >
          <div className="text-6xl mb-4">{value.icon}</div>
          <h2 className="text-2xl font-bold">{value.title}</h2>
          <p className="text-lg mt-2">{value.description}</p>

          <div className="mt-8">
            <p className="mb-4">Подтверди, что живёшь этой ценностью:</p>
            {employees.map(emp => (
              <button
                key={emp.id}
                onClick={() => confirmValue(emp.id)}
                className="btn-primary m-1"
              >
                {emp.name} — Подтвердить
              </button>
            ))}
          </div>
        </motion.div>
      ) : (
        <p>Ценность дня ещё не выбрана. Обновите страницу завтра!</p>
      )}

      <div className="mt-12">
        <h3 className="text-xl font-bold mb-4">Лидерборд</h3>
        <div className="space-y-2">
          {employees
            .sort((a, b) => b.points - a.points)
            .slice(0, 3)
            .map((e, i) => (
              <div key={e.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow">
                <span>{i + 1}. {e.name}</span>
                <span className="font-bold">{e.points} баллов</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}