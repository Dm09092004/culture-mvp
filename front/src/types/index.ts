// Базовые типы данных
export type Value = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  department: string;
};

export type Notification = {
  id: string;
  date: string;
  type: string;
  message: string;
  status: 'sent' | 'scheduled' | 'draft';
};

export type Settings = {
  frequency: 'daily' | 'weekly' | 'monthly';
  types: string[];
};

// API Response типы
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type CompanyCulture = {
  values: Value[];
  mission: string;
  recommendations: string;
};

// Payload типы для API запросов
export type AnalyzeCultureRequest = {
  answers: string[];
};

export type AddEmployeeRequest = {
  name: string;
  email: string;
  department: string;
};

// Store типы
export type LoadingState = {
  survey: boolean;
  culture: boolean;
  employees: boolean;
  notifications: boolean;
};

export type UIState = {
  isLoading: boolean;
  modals: {
    addEmployee: boolean;
    [key: string]: boolean;
  };
};

// Добавим недостающие типы
export type SurveyState = {
  currentStep: number;
  answers: string[];
};

// Добавим тип для обновления настроек
export type UpdateSettingsRequest = {
  frequency: 'daily' | 'weekly' | 'monthly';
  types: string[];
};

// Типы для обычных уведомлений
// export type RegularNotification = {
//   id: string;
//   type: 'lunch' | 'meeting' | 'reminder' | 'announcement' | 'custom';
//   title: string;
//   message: string;
//   time: string; // HH:mm format
//   days: number[]; // 0-6 (Sunday-Saturday)
//   enabled: boolean;
//   recipients: string[]; // employee emails or 'all'
// };

// Расширенные типы для AppState
export type AppState = {
  // Survey
  currentStep: number;
  answers: string[];
  
  // Company Culture
  values: Value[];
  mission: string;
  
  // Employees
  employees: Employee[];
  
  // Notifications
  notifications: Notification[];
  regularNotifications: RegularNotification[];
  notificationSettings: Settings;
  
  // UI State
  loading: LoadingState;
  
  // Actions
  setAnswer: (index: number, answer: string) => Promise<void>;
  nextStep: () => Promise<void>;
  prevStep: () => Promise<void>;
  addEmployee: (employee: AddEmployeeRequest) => void;
  deleteEmployee: (id: string) => void;
  updateEmployee: (id: string, updates: Partial<Omit<Employee, 'id'>>) => void;
  updateMission: (mission: string) => void;
  updateValue: (id: string, updates: Partial<Value>) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  
  // Regular Notifications Actions
  addRegularNotification: (notification: Omit<RegularNotification, 'id'>) => void;
  updateRegularNotification: (id: string, updates: Partial<RegularNotification>) => void;
  deleteRegularNotification: (id: string) => void;
  toggleRegularNotification: (id: string) => void;
  
  // Loading states
  setLoading: (key: keyof LoadingState, value: boolean) => void;
};

// Типы для серверного хранилища
export type ServerState = {
  survey: SurveyState | null;
  culture: CompanyCulture | null;
  employees: Employee[];
  notifications: Notification[];
  settings: Settings | null;
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
  updateEmployee: (id: string, updates: Partial<Omit<Employee, 'id'>>) => Promise<void>;
  
  // Notifications actions
  loadNotifications: () => Promise<Notification[]>;
  loadSettings: () => Promise<Settings>;
  updateSettings: (settings: UpdateSettingsRequest) => Promise<Settings>;
  sendNotifications: (notificationData: any) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'date'>) => Promise<Notification>;
  
  // Loading states
  setLoading: (key: keyof LoadingState, value: boolean) => void;
};

// Типы для UI хранилища
export type UIStoreState = {
  isLoading: boolean;
  modals: {
    addEmployee: boolean;
    [key: string]: boolean;
  };
  setLoading: (loading: boolean) => void;
  openModal: (modalName: string) => void;
  closeModal: (modalName: string) => void;
};

export interface RegularNotification {
  id: string;
  title: string;
  message: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
  enabled: boolean;
  time?: string; // Время отправки в формате "HH:MM"
  dayOfWeek?: number; // 0-6 для дней недели (0 - воскресенье)
  dayOfMonth?: number; // 1-31 для дня месяца
  createdAt: string;
  updatedAt: string;
}

// Типы для локального хранилища (обычные уведомления)
export interface LocalStore {
  regularNotifications: RegularNotification[];
  addRegularNotification: (notification: Omit<RegularNotification, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRegularNotification: (id: string, updates: Partial<RegularNotification>) => void;
  deleteRegularNotification: (id: string) => void;
  toggleRegularNotification: (id: string) => void;
  getActiveRegularNotifications: () => RegularNotification[];
}

