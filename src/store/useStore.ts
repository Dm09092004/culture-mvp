// src/store/useStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

// === ТИПЫ ===
export interface Value {
  icon: string;
  title: string;
  description: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  points: number;
  badges: string[];
}

export interface NotificationHistory {
  id: string;
  to: string;
  message: string;
  date: string;
  type: 'fact' | 'quote' | 'reminder';
}

export interface GameState {
  valueOfDay: { value: Value; date: string } | null;
  lastDayCheck: string;
}

// === ХРАНИЛИЩЕ ===
interface CultureStore {
  // Опрос
  answers: string[];
  currentStep: number;
  setAnswer: (index: number, answer: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetAnswers: () => void;

  // Результаты
  aiValues: Value[];
  aiMission: string;
  setAiValues: (values: Value[]) => void;
  setAiMission: (mission: string) => void;
  editValue: (index: number, updated: Partial<Value>) => void;

  // Сотрудники
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id' | 'points' | 'badges'>) => void;
  removeEmployee: (id: string) => void;

  // Геймификация
  game: GameState;
  setValueOfDay: (value: Value | null, date: string) => void;
  addPoints: (empId: string, points: number) => void;
  awardBadge: (empId: string, badge: string) => void;

  // Рассылка
  notifications: NotificationHistory[];
  addNotification: (notif: Omit<NotificationHistory, 'id' | 'date'>) => void;
  frequency: 'daily' | 'weekly' | 'manual';
  setFrequency: (freq: 'daily' | 'weekly' | 'manual') => void;
}

// === РЕАЛИЗАЦИЯ ===
export const useStore = create<CultureStore>()(
  persist(
    (set, get) => ({
      // Опрос
      answers: [],
      currentStep: 0,
      setAnswer: (index, answer) =>
        set(state => {
          const newAnswers = [...state.answers];
          newAnswers[index] = answer;
          return { answers: newAnswers };
        }),
      nextStep: () => set(state => ({ currentStep: state.currentStep + 1 })),
      prevStep: () => set(state => ({ currentStep: Math.max(0, state.currentStep - 1) })),
      resetAnswers: () => set({ answers: [], currentStep: 0 }),

      // Результаты
      aiValues: [],
      aiMission: '',
      setAiValues: values => set({ aiValues: values }),
      setAiMission: mission => set({ aiMission: mission }),
      editValue: (index, updated) =>
        set(state => ({
          aiValues: state.aiValues.map((v, i) =>
            i === index ? { ...v, ...updated } : v
          ),
        })),

      // Сотрудники
      employees: [],
      addEmployee: emp =>
        set(state => ({
          employees: [
            ...state.employees,
            {
              ...emp,
              id: Date.now().toString(),
              points: 0,
              badges: [],
            },
          ],
        })),
      removeEmployee: id =>
        set(state => ({
          employees: state.employees.filter(e => e.id !== id),
        })),

      // Геймификация
      game: { valueOfDay: null, lastDayCheck: '' },
      setValueOfDay: (value, date) =>
        set({
          game: {
            valueOfDay: value ? { value, date } : null,
            lastDayCheck: date,
          },
        }),
      addPoints: (empId, points) =>
        set(state => {
          const updated = state.employees.map(e =>
            e.id === empId
              ? {
                  ...e,
                  points: e.points + points,
                  badges: e.points + points >= 50 && !e.badges.includes('Мастер')
                    ? [...e.badges, 'Мастер']
                    : e.badges,
                }
              : e
          );
          toast.success(`+${points} баллов!`);
          return { employees: updated };
        }),
      awardBadge: (empId, badge) =>
        set(state => {
          const updated = state.employees.map(e =>
            e.id === empId && !e.badges.includes(badge)
              ? { ...e, badges: [...e.badges, badge] }
              : e
          );
          toast.success(`Бейдж: ${badge}`);
          return { employees: updated };
        }),

      // Рассылка
      notifications: [],
      addNotification: notif =>
        set(state => ({
          notifications: [
            ...state.notifications,
            {
              ...notif,
              id: Date.now().toString(),
              date: new Date().toLocaleString('ru'),
            },
          ],
        })),
      frequency: 'manual',
      setFrequency: freq => set({ frequency: freq }),
    }),
    {
      name: 'culture-storage',
    }
  )
);

// === Авто-выбор ценности дня ===
import { useEffect } from 'react';

export const useValueOfDay = () => {
  const { aiValues, game, setValueOfDay } = useStore();

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (game.lastDayCheck !== today && aiValues.length > 0) {
      const random = aiValues[Math.floor(Math.random() * aiValues.length)];
      setValueOfDay(random, today);
      toast.success(`Ценность дня: ${random.title}`);
    }
  }, [aiValues, game.lastDayCheck, setValueOfDay]);
};