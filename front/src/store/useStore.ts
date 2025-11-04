import { create } from "zustand";
import apiService from "../services/api";
import {
  UIState,
  SurveyState,
  CompanyCulture,
  Employee,
  Notification,
  Settings,
  LoadingState,
  AddEmployeeRequest,
  UpdateSettingsRequest,
} from "../types";

// UI Store для локального состояния
interface UIStore extends UIState {
  setLoading: (isLoading: boolean) => void;
  openModal: (modalName: string) => void;
  closeModal: (modalName: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isLoading: false,
  modals: {
    addEmployee: false,
  },
  setLoading: (isLoading) => set({ isLoading }),
  openModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: true },
    })),
  closeModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: false },
    })),
}));

// Server Store для синхронизации с бэкендом
interface ServerStore {
  // Data
  survey: SurveyState | null;
  culture: CompanyCulture | null;
  employees: Employee[];
  notifications: Notification[];
  settings: Settings | null;

  // Loading states
  loading: LoadingState;

  // Survey actions
  loadSurvey: () => Promise<SurveyState>;
  updateSurvey: (updates: Partial<SurveyState>) => Promise<SurveyState>;
  setAnswer: (index: number, answer: string) => Promise<void>;
  nextStep: () => Promise<void>;
  prevStep: () => Promise<void>;

  // Culture actions
  loadCulture: () => Promise<CompanyCulture>;
  analyzeCulture: (answers: string[]) => Promise<CompanyCulture>;

  // Employees actions
  loadEmployees: () => Promise<Employee[]>;
  addEmployee: (employee: AddEmployeeRequest) => Promise<Employee>;
  deleteEmployee: (id: string) => Promise<void>;

  // Notifications actions
  loadNotifications: () => Promise<Notification[]>;
  loadSettings: () => Promise<Settings>;
  updateSettings: (settings: UpdateSettingsRequest) => Promise<Settings>;
  sendNotifications: (notificationData: any) => Promise<void>;
  addNotification: (
    notification: Omit<Notification, "id" | "date">
  ) => Promise<Notification>;
}

export const useServerStore = create<ServerStore>((set, get) => ({
  // Initial state
  survey: {
    currentStep: 0,
    answers: [],
  }, // Инициализируем начальным состоянием вместо null
  culture: null,
  employees: [],
  notifications: [],
  settings: null,
  loading: {
    survey: false,
    culture: false,
    employees: false,
    notifications: false,
  },

  // Survey actions
  loadSurvey: async (): Promise<SurveyState> => {
    set((state) => ({ loading: { ...state.loading, survey: true } }));
    try {
      const response = await apiService.getSurvey();
      const survey = response.data!;
      set({ survey, loading: { ...get().loading, survey: false } });
      return survey;
    } catch (error) {
      console.error("Failed to load survey, using local state:", error);
      set((state) => ({ loading: { ...state.loading, survey: false } }));
      // Возвращаем текущее состояние если загрузка не удалась
      return get().survey!;
    }
  },

  updateSurvey: async (updates: Partial<SurveyState>): Promise<SurveyState> => {
    try {
      const response = await apiService.updateSurvey(updates);
      const survey = response.data!;
      set({ survey });
      return survey;
    } catch (error) {
      console.error(
        "Failed to update survey on server, updating locally:",
        error
      );
      // Если обновление на сервере не удалось, обновляем локально
      const currentSurvey = get().survey!;
      const updatedSurvey = { ...currentSurvey, ...updates };
      set({ survey: updatedSurvey });
      return updatedSurvey;
    }
  },

  setAnswer: async (index: number, answer: string): Promise<void> => {
    try {
      const { survey, updateSurvey } = get();

      // Если survey еще null (не загружен), создаем начальное состояние
      const currentSurvey = survey || {
        currentStep: 0,
        answers: [],
      };

      const answers = [...currentSurvey.answers];

      // Убедимся, что массив answers достаточно длинный
      while (answers.length <= index) {
        answers.push("");
      }

      answers[index] = answer;
      await updateSurvey({ ...currentSurvey, answers });
    } catch (error) {
      console.error("Error in setAnswer:", error);
    }
  },

  nextStep: async (): Promise<void> => {
    const { survey, updateSurvey } = get();
    const currentSurvey = survey || {
      currentStep: 0,
      answers: [],
    };

    const currentStep = currentSurvey.currentStep + 1;
    await updateSurvey({ ...currentSurvey, currentStep });
  },

  prevStep: async (): Promise<void> => {
    const { survey, updateSurvey } = get();
    const currentSurvey = survey || {
      currentStep: 0,
      answers: [],
    };

    const currentStep = Math.max(0, currentSurvey.currentStep - 1);
    await updateSurvey({ ...currentSurvey, currentStep });
  },

  // Culture actions
  loadCulture: async (): Promise<CompanyCulture> => {
    set((state) => ({ loading: { ...state.loading, culture: true } }));
    try {
      const response = await apiService.getCulture();
      const culture = response.data!;
      set({ culture, loading: { ...get().loading, culture: false } });
      return culture;
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, culture: false } }));
      throw error;
    }
  },

  analyzeCulture: async (answers: string[]): Promise<CompanyCulture> => {
    set((state) => ({ loading: { ...state.loading, culture: true } }));
    try {
      const response = await apiService.analyzeCulture({ answers });
      const culture = response.data!;
      set({ culture, loading: { ...get().loading, culture: false } });
      return culture;
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, culture: false } }));
      throw error;
    }
  },

  // Employees actions
  loadEmployees: async (): Promise<Employee[]> => {
    set((state) => ({ loading: { ...state.loading, employees: true } }));
    try {
      const response = await apiService.getEmployees();
      const employees = response.data!;
      set({ employees, loading: { ...get().loading, employees: false } });
      return employees;
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, employees: false } }));
      throw error;
    }
  },

  addEmployee: async (employee: AddEmployeeRequest): Promise<Employee> => {
    try {
      const response = await apiService.addEmployee(employee);
      const newEmployee = response.data!;
      set((state) => ({ employees: [...state.employees, newEmployee] }));
      return newEmployee;
    } catch (error) {
      throw error;
    }
  },

  deleteEmployee: async (id: string): Promise<void> => {
    try {
      await apiService.deleteEmployee(id);
      set((state) => ({
        employees: state.employees.filter((emp) => emp.id !== id),
      }));
    } catch (error) {
      throw error;
    }
  },

  // Notifications actions
  loadNotifications: async (): Promise<Notification[]> => {
    set((state) => ({ loading: { ...state.loading, notifications: true } }));
    try {
      const response = await apiService.getNotifications();
      const notifications = response.data!;
      set({
        notifications,
        loading: { ...get().loading, notifications: false },
      });
      return notifications;
    } catch (error) {
      set((state) => ({ loading: { ...state.loading, notifications: false } }));
      throw error;
    }
  },

  loadSettings: async (): Promise<Settings> => {
    try {
      const response = await apiService.getSettings();
      const settings = response.data!;
      set({ settings });
      return settings;
    } catch (error) {
      throw error;
    }
  },

  updateSettings: async (
    settings: UpdateSettingsRequest
  ): Promise<Settings> => {
    try {
      const response = await apiService.updateSettings(settings);
      const updatedSettings = response.data!;
      set({ settings: updatedSettings });
      return updatedSettings;
    } catch (error) {
      throw error;
    }
  },

  sendNotifications: async (notificationData: any): Promise<void> => {
    try {
      await apiService.sendNotifications(notificationData);
      // Refresh notifications after sending
      await get().loadNotifications();
    } catch (error) {
      throw error;
    }
  },

  addNotification: async (
    notification: Omit<Notification, "id" | "date">
  ): Promise<Notification> => {
    try {
      // For now, we'll create a local notification since we don't have a backend endpoint for this
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        date: new Date().toLocaleDateString("ru-RU"),
      };

      set((state) => ({
        notifications: [newNotification, ...state.notifications],
      }));

      return newNotification;
    } catch (error) {
      throw error;
    }
  },
}));

// Совместимый store для обратной совместимости со старыми компонентами
export const useStore = () => {
  const serverStore = useServerStore();
  const uiStore = useUIStore();

  return {
    // Survey
    currentStep: serverStore.survey?.currentStep || 0,
    answers: serverStore.survey?.answers || [],
    setAnswer: serverStore.setAnswer,
    nextStep: serverStore.nextStep,
    prevStep: serverStore.prevStep,

    // Culture
    values: serverStore.culture?.values || [],
    mission: serverStore.culture?.mission || "",

    // Employees
    employees: serverStore.employees,
    addEmployee: serverStore.addEmployee,
    deleteEmployee: serverStore.deleteEmployee,

    // Notifications
    notifications: serverStore.notifications,
    settings: serverStore.settings || {
      frequency: "weekly",
      types: ["value_reminder", "mission_quote", "team_shoutout"],
    },
    updateSettings: serverStore.updateSettings,
    addNotification: serverStore.addNotification,

    // Добавим методы для загрузки данных
    loadSurvey: serverStore.loadSurvey,
    loadCulture: serverStore.loadCulture,
    loadEmployees: serverStore.loadEmployees,
    loading: serverStore.loading,
  };
};
