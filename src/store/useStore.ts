import { create } from 'zustand';
import { persist } from 'zustand/middleware';  // ← НОВЫЙ ИМПОРТ

type Value = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

type Employee = {
  id: string;
  name: string;
  email: string;
  department: string;
};

type Notification = {
  id: string;
  date: string;
  type: string;
  message: string;
  status: 'sent' | 'scheduled' | 'draft';
};

type Store = {
  currentStep: number;
  answers: string[];
  setAnswer: (index: number, answer: string) => void;
  nextStep: () => void;
  prevStep: () => void;

  values: Value[];
  mission: string;

  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  deleteEmployee: (id: string) => void;

  notifications: Notification[];
  settings: {
    frequency: 'daily' | 'weekly' | 'monthly';
    types: string[];
  };
  updateSettings: <K extends keyof Store['settings']>(key: K, value: Store['settings'][K]) => void;
  addNotification: (notif: Omit<Notification, 'id' | 'date'>) => void;
};

// === АВТОСОХРАНЕНИЕ В LOCALSTORAGE ===
export const useStore = create<Store>()(
  persist(
    (set) => ({
      currentStep: 0,
      answers: [],
      setAnswer: (index, answer) =>
        set((state) => {
          const newAnswers = [...state.answers];
          newAnswers[index] = answer;
          return { answers: newAnswers };
        }),
      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
      prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),

      values: [],
      mission: '',

      employees: [],
      addEmployee: (emp) =>
        set((state) => ({
          employees: [...state.employees, { ...emp, id: Date.now().toString() }],
        })),
      deleteEmployee: (id) =>
        set((state) => ({
          employees: state.employees.filter((e) => e.id !== id),
        })),

      notifications: [],
      settings: {
        frequency: 'weekly',
        types: ['value_reminder', 'mission_quote', 'team_shoutout'],
      },
      updateSettings: (key, value) =>
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        })),
      addNotification: (notif) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            {
              ...notif,
              id: Date.now().toString(),
              date: new Date().toLocaleDateString('ru-RU'),
            },
          ],
        })),
    }),
    {
      name: 'culture-storage', // Ключ в localStorage
      partialize: (state) => ({
        answers: state.answers,
        employees: state.employees,
        notifications: state.notifications,
        settings: state.settings,
        // currentStep НЕ сохраняем — сбрасывается при загрузке
      }),
    }
  )
);