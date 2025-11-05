import {
  ApiResponse,
  SurveyState,
  CompanyCulture,
  Employee,
  Notification,
  Settings,
  AnalyzeCultureRequest,
  AddEmployeeRequest,
  UpdateSettingsRequest,
} from "../types";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// Добавьте эти типы в существующие
export type GenerateMessageRequest = {
  type: string;
  valueTitle: string;
  mission: string;
  tone?: "friendly" | "professional" | "energetic" | "caring";
  length?: "short" | "medium" | "long";
};

export type GenerateMessageData = {
  message: string;
  type: string;
  valueTitle: string;
  generated: boolean;
};

export type GenerateMessageResponse = {
  success: boolean;
  data: GenerateMessageData;
  error?: string;
};

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Добавьте этот метод в класс ApiService
  async generateMessage(
    request: GenerateMessageRequest
  ): Promise<ApiResponse<GenerateMessageData>> {
    return this.request<GenerateMessageData>("/messages/generate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async editMessage(request: {
    message: string;
    instruction: string;
    currentValue?: string;
    currentMission?: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>("/messages/edit", {
      method: "POST",
      body: JSON.stringify(request), // Сериализуем объект в JSON строку
    });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    // Создаем конфиг с правильной обработкой body
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Обрабатываем body отдельно чтобы избежать проблем с типами
    if (options.body) {
      config.body = options.body;
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Survey endpoints
  async getSurvey(): Promise<ApiResponse<SurveyState>> {
    return this.request<SurveyState>("/survey");
  }

  async updateSurvey(
    updates: Partial<SurveyState>
  ): Promise<ApiResponse<SurveyState>> {
    return this.request<SurveyState>("/survey", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async resetSurvey(): Promise<ApiResponse<SurveyState>> {
    return this.request<SurveyState>("/survey/reset", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  // Culture endpoints
  async analyzeCulture(
    request: AnalyzeCultureRequest
  ): Promise<ApiResponse<CompanyCulture>> {
    return this.request<CompanyCulture>("/culture/analyze", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getCulture(): Promise<ApiResponse<CompanyCulture>> {
    return this.request<CompanyCulture>("/culture");
  }

  // Employees endpoints
  async getEmployees(): Promise<ApiResponse<Employee[]>> {
    return this.request<Employee[]>("/employees");
  }

  async addEmployee(
    employee: AddEmployeeRequest
  ): Promise<ApiResponse<Employee>> {
    return this.request<Employee>("/employees", {
      method: "POST",
      body: JSON.stringify(employee),
    });
  }

  async deleteEmployee(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/employees/${id}`, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
  }

  async importEmployees(
    file: File
  ): Promise<ApiResponse<{ imported: Employee[]; errors: string[] }>> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.baseURL}/employees/import`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Notifications endpoints
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    return this.request<Notification[]>("/notifications");
  }

  async sendNotifications(
    notificationData: any
  ): Promise<ApiResponse<{ notification: Notification; results: any }>> {
    return this.request("/notifications/send", {
      method: "POST",
      body: JSON.stringify(notificationData),
    });
  }

  async getSettings(): Promise<ApiResponse<Settings>> {
    return this.request<Settings>("/notifications/settings");
  }

  async updateSettings(
    settings: UpdateSettingsRequest
  ): Promise<ApiResponse<Settings>> {
    return this.request<Settings>("/notifications/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  // Отправка мотивационных уведомлений
  async sendMotivationalNotification(request: {
    employees: Employee[];
    message: string;
    valueTitle: string;
    mission: string;
    type?: string;
    subject?: string;
    personalization?: boolean;
  }): Promise<ApiResponse<{ notification: Notification; results: any }>> {
    return this.request("/notifications/send", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Отправка обычных уведомлений
  async sendRegularNotifications(request: {
    notifications: any[];
    employees: Employee[];
  }): Promise<ApiResponse<any>> {
    return this.request("/notifications/send-regular", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Отправка запланированных уведомлений
  async sendScheduledNotifications(): Promise<ApiResponse<any>> {
    return this.request("/notifications/send-scheduled", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  // Telegram endpoints
  async broadcastTelegramMessage(message: string): Promise<
    ApiResponse<{
      results: Array<{
        chatId: string;
        email: string;
        success: boolean;
        error?: string;
      }>;
      successful: number;
      total: number;
    }>
  > {
    return this.request("/telegram/broadcast", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  async sendTelegramTest(): Promise<ApiResponse<void>> {
    return this.request("/telegram/test", {
      method: "GET",
    });
  }

  async getTelegramSubscribers(): Promise<
    ApiResponse<
      Array<{
        id: string;
        chatId: string;
        email: string;
        firstName: string;
        lastName: string;
        username: string;
        subscribedAt: string;
        isActive: boolean;
      }>
    >
  > {
    return this.request("/telegram/subscribers", {
      method: "GET",
    });
  }

  // Получить все регулярные уведомления
  async getRegularNotifications(): Promise<ApiResponse<any[]>> {
    return this.request("/notifications/regular");
  }

  // Получить активные регулярные уведомления
  async getActiveRegularNotifications(): Promise<ApiResponse<any[]>> {
    return this.request("/notifications/regular/active");
  }

  // Создать регулярное уведомление
  async createRegularNotification(
    notification: any
  ): Promise<ApiResponse<any>> {
    return this.request("/notifications/regular", {
      method: "POST",
      body: JSON.stringify(notification),
    });
  }

  // Обновить регулярное уведомление
  async updateRegularNotification(
    id: string,
    updates: any
  ): Promise<ApiResponse<any>> {
    return this.request(`/notifications/regular/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  // Удалить регулярное уведомление
  async deleteRegularNotification(id: string): Promise<ApiResponse<void>> {
    return this.request(`/notifications/regular/${id}`, {
      method: "DELETE",
    });
  }

  // Включить/выключить регулярное уведомление
  async toggleRegularNotification(id: string): Promise<ApiResponse<any>> {
    return this.request(`/notifications/regular/${id}/toggle`, {
      method: "PATCH",
    });
  }
}

export default new ApiService();
