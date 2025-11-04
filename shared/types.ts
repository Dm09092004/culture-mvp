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

export type SurveyAnswers = {
  answers: string[];
  currentStep: number;
};

export type CompanyCulture = {
  values: Value[];
  mission: string;
  recommendations: string;
};

export type Settings = {
  frequency: 'daily' | 'weekly' | 'monthly';
  types: string[];
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};