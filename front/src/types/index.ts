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