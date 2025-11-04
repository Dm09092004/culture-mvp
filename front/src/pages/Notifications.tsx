import { useState, useEffect, useCallback, useRef } from "react";
import { Send, Sparkles, Loader2, RefreshCw, Settings, MessageCircle } from "lucide-react";
import { useStore } from "../store/useStore";
import emailjs from "@emailjs/browser";
import { EMAILJS_CONFIG } from "../config/emailjs";
import { useToastContext } from "../contexts/ToastContext";
import apiService from "../services/api";

// Инициализация
emailjs.init(EMAILJS_CONFIG.publicKey);

const FALLBACK_TEMPLATES = {
  value_reminder: (value: string, mission: string) => `Привет! 🌟

Сегодня хотели напомнить о нашей важной ценности: "${value}".

${mission}

Давай воплотим это в наших действиях сегодня! 💪

С уважением, CultureOS`,

  mission_quote: (value: string, mission: string) => `Добрый день! ✨

Напоминаем о нашей общей миссии: "${mission}".

Ценность "${value}" помогает нам двигаться к этой цели.

Продолжаем в том же духе! 🚀

С уважением, CultureOS`,

  team_shoutout: (value: string, mission: string) => `Приветствую! 👏

Хочу отметить, как здорово мы проявляем ценность "${value}"!

${mission}

Спасибо за ваш вклад! 💙

С уважением, CultureOS`
};

// Типы для Telegram ответа
interface TelegramBroadcastResult {
  chatId: string;
  email: string;
  success: boolean;
  error?: string;
}

interface TelegramBroadcastResponse {
  results: TelegramBroadcastResult[];
  successful: number;
  total: number;
}

export default function Notifications() {
  const {
    settings,
    updateSettings,
    addNotification,
    employees,
    values,
    mission,
  } = useStore();
  
  const { success, error, info } = useToastContext();
  
  const [isSending, setIsSending] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentValue, setCurrentValue] = useState({ title: "", description: "" });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSettings, setGenerationSettings] = useState({
    tone: "friendly" as "friendly" | "professional" | "energetic" | "caring",
    length: "medium" as "short" | "medium" | "long",
    useAI: true
  });
  const [showAISettings, setShowAISettings] = useState(false);
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  const [telegramSubscribers, setTelegramSubscribers] = useState(0);
  const [telegramStatus, setTelegramStatus] = useState<{
    botToken: string;
    chatId: string;
    totalSubscribers: number;
    activeSubscribers: number;
    environment: string;
  } | null>(null);

  // Инициализация при загрузке компонента
  useEffect(() => {
    setIsComponentMounted(true);
    generateNewMessage();
    loadTelegramStatus();

    return () => {
      setIsComponentMounted(false);
    };
  }, []);

  // Загрузка статуса Telegram
  const loadTelegramStatus = useCallback(async () => {
    try {
      const response = await apiService.getTelegramSubscribers();
      if (response.success && response.data) {
        setTelegramSubscribers(response.data.length);
      }
    } catch (err) {
      console.error("Ошибка загрузки статуса Telegram:", err);
    }
  }, []);

  // Генерация нового сообщения через API
  const generateNewMessage = useCallback(async () => {
    if (employees.length === 0) {
      error("Добавьте сотрудников перед генерацией!");
      return;
    }

    setIsGenerating(true);

    try {
      // Выбираем случайный тип из активных
      const activeTypes = settings.types.filter(type => 
        ['value_reminder', 'mission_quote', 'team_shoutout'].includes(type)
      );
      
      const selectedType = activeTypes.length > 0 
        ? activeTypes[Math.floor(Math.random() * activeTypes.length)]
        : 'value_reminder';
      
      // Выбираем случайную ценность
      const availableValues = values.length > 0 ? values : [{ title: "Развитие", description: "" }];
      const randomValue = availableValues[Math.floor(Math.random() * availableValues.length)];
      
      setCurrentValue(randomValue);

      let generatedMessage: string;

      if (generationSettings.useAI) {
        // Используем нейросеть через API
        try {
          const response = await apiService.generateMessage({
            type: selectedType,
            valueTitle: randomValue.title,
            mission: mission || "Мы создаем прекрасную корпоративную культуру вместе!",
            tone: generationSettings.tone,
            length: generationSettings.length
          });

          if (response.success && response.data) {
            generatedMessage = response.data.message;
            success("✨ Сообщение создано нейросетью!");
          } else {
            throw new Error(response.error || 'API returned unsuccessful response');
          }
        } catch (aiError: any) {
          console.error("AI generation failed, using template:", aiError);
          generatedMessage = generateTemplateMessage(selectedType, randomValue.title, mission);
          info("📝 Используем шаблонное сообщение");
        }
      } else {
        // Используем шаблоны
        generatedMessage = generateTemplateMessage(selectedType, randomValue.title, mission);
        info("📝 Шаблонное сообщение создано");
      }

      setCurrentMessage(generatedMessage);
      
    } catch (err) {
      console.error("Ошибка генерации сообщения:", err);
      error("Ошибка генерации сообщения");
    } finally {
      setIsGenerating(false);
    }
  }, [employees, settings.types, values, mission, generationSettings, success, error, info]);

  const generateTemplateMessage = useCallback((type: string, valueTitle: string, missionText?: string) => {
    const template = FALLBACK_TEMPLATES[type as keyof typeof FALLBACK_TEMPLATES] || FALLBACK_TEMPLATES.value_reminder;
    return template(valueTitle, missionText || "Мы создаем прекрасную корпоративную культуру вместе!");
  }, []);

  // Отправка в Telegram
  const handleSendTelegram = async () => {
    if (!currentMessage) {
      error("Сначала сгенерируйте сообщение!");
      return;
    }

    if (telegramSubscribers === 0) {
      error("Нет подписчиков в Telegram!");
      info("Сотрудники могут подписаться отправив /start боту");
      return;
    }

    setIsSendingTelegram(true);

    try {
      // Форматируем сообщение для Telegram
      const telegramMessage = `📧 <b>Уведомление от CultureOS</b>\n\n${currentMessage}\n\n---\n<em>Это сообщение отправлено автоматически</em>`;

      const response = await apiService.broadcastTelegramMessage(telegramMessage);
      
      if (response.success && response.data) {
        const { successful, total } = response.data;
        
        if (successful > 0) {
          success(`✅ Сообщение отправлено ${successful} из ${total} подписчиков в Telegram`);
          
          addNotification({
            type: "telegram_broadcast",
            message: `Telegram: "${currentValue.title}" (${successful}/${total} подписчиков)`,
            status: successful === total ? "sent" : "scheduled", // Используем существующий статус
          });
        } else {
          error("Не удалось отправить сообщение ни одному подписчику");
        }
      } else {
        error("Ошибка при отправке в Telegram");
      }
    } catch (err: any) {
      console.error("Ошибка отправки в Telegram:", err);
      error("Ошибка при отправке в Telegram");
    } finally {
      setIsSendingTelegram(false);
    }
  };

  const handleSend = async () => {
    if (employees.length === 0) {
      error("Добавьте сотрудников!");
      return;
    }

    if (!currentMessage) {
      error("Сначала сгенерируйте сообщение!");
      return;
    }

    setIsSending(true);
    setSendProgress(0);
    let sentCount = 0;
    let failedCount = 0;

    try {
      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        
        // Персонализируем сообщение для каждого сотрудника
        const personalizedMessage = currentMessage.replace(/Привет!|Добрый день!|Приветствую!/, `Привет, ${emp.name}!`);

        const params = {
          to_email: emp.email,
          to_name: emp.name,
          message: personalizedMessage,
          value_title: currentValue.title,
          mission: mission || "Мы создаем прекрасную корпоративную культуру вместе!",
        };

        try {
          console.log("Отправка на:", emp.email);

          const result = await emailjs.send(
            EMAILJS_CONFIG.serviceID,
            EMAILJS_CONFIG.templateID,
            params
          );

          console.log("Успех:", result);
          sentCount++;
        } catch (err: any) {
          console.error("Ошибка отправки на", emp.email, err.text || err);
          failedCount++;
        }

        setSendProgress(((i + 1) / employees.length) * 100);
      }

      addNotification({
        type: "value_reminder",
        message: `Рассылка: "${currentValue.title}" (${sentCount} отправлено)`,
        status: "sent",
      });

      if (failedCount === 0) {
        success(`✅ Успешно отправлено ${sentCount} писем`);
      } else {
        info(`📨 Отправлено: ${sentCount}, Ошибок: ${failedCount}`);
      }
    } catch (err) {
      console.error("Ошибка при отправке:", err);
      error("Произошла ошибка при отправке");
    } finally {
      setIsSending(false);
    }
  };

  const preview = currentMessage || "Сгенерируйте первое сообщение...";

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Левая панель: Настройки */}
      <div className="lg:col-span-1 space-y-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Настройки</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Частота</label>
              <select
                value={settings.frequency}
                onChange={(e) => updateSettings({
                  frequency: e.target.value as 'daily' | 'weekly' | 'monthly',
                  types: settings.types
                })}
                className="input"
              >
                <option value="daily">Ежедневно</option>
                <option value="weekly">Еженедельно</option>
                <option value="monthly">Ежемесячно</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Типы сообщений
              </label>
              <div className="space-y-2">
                {["value_reminder", "mission_quote", "team_shoutout"].map(
                  (type) => (
                    <label
                      key={type}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={settings.types.includes(type)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const newTypes = checked
                            ? [...settings.types, type]
                            : settings.types.filter((t: string) => t !== type);

                          updateSettings({
                            frequency: settings.frequency,
                            types: newTypes
                          });
                        }}
                        className="w-4 h-4 text-primary rounded"
                      />
                      <span className="text-sm">
                        {type === "value_reminder" && "Напоминание о ценности"}
                        {type === "mission_quote" && "Цитата из миссии"}
                        {type === "team_shoutout" && "Благодарность команде"}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Настройки генерации */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Генерация сообщений</h2>
            <button
              onClick={() => setShowAISettings(!showAISettings)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {showAISettings && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generationSettings.useAI}
                    onChange={(e) => setGenerationSettings({
                      ...generationSettings,
                      useAI: e.target.checked
                    })}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm font-medium">Использовать нейросеть (GigaChat)</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {generationSettings.useAI 
                    ? "Сообщения создаются искусственным интеллектом" 
                    : "Используются шаблонные сообщения"}
                </p>
              </div>

              {generationSettings.useAI && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Тон сообщения</label>
                    <select
                      value={generationSettings.tone}
                      onChange={(e) => setGenerationSettings({
                        ...generationSettings,
                        tone: e.target.value as any
                      })}
                      className="input text-sm"
                    >
                      <option value="friendly">Дружелюбный</option>
                      <option value="professional">Профессиональный</option>
                      <option value="energetic">Энергичный</option>
                      <option value="caring">Заботливый</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Длина сообщения</label>
                    <select
                      value={generationSettings.length}
                      onChange={(e) => setGenerationSettings({
                        ...generationSettings,
                        length: e.target.value as any
                      })}
                      className="input text-sm"
                    >
                      <option value="short">Короткое</option>
                      <option value="medium">Среднее</option>
                      <option value="long">Длинное</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* КНОПКИ */}
          <div className="mt-4 space-y-3">
            <button
              onClick={generateNewMessage}
              disabled={isGenerating || isSending || employees.length === 0}
              className="w-full btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Генерация...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>
                    {generationSettings.useAI ? "Сгенерировать нейросетью" : "Новое сообщение"}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={handleSend}
              disabled={isSending || employees.length === 0 || !currentMessage}
              className="w-full btn-primary text-lg flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Отправляем...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Отправить email ({employees.length} чел.)</span>
                </>
              )}
            </button>

            {/* НОВАЯ КНОПКА ДЛЯ TELEGRAM */}
            <button
              onClick={handleSendTelegram}
              disabled={isSendingTelegram || !currentMessage || telegramSubscribers === 0}
              className="w-full bg-telegram-500 hover:bg-telegram-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 transition-all duration-200"
            >
              {isSendingTelegram ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Отправка в Telegram...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  <span>Отправить в Telegram ({telegramSubscribers} подписчиков)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* СТАТУС TELEGRAM */}
        <div className="card bg-telegram-50 border-telegram-200">
          <div className="flex items-center space-x-3 mb-3">
            <MessageCircle className="w-6 h-6 text-telegram-600" />
            <h3 className="font-semibold text-telegram-800">Telegram Бот</h3>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-telegram-700">Подписчиков:</span>
              <span className="font-semibold text-telegram-800">
                {telegramSubscribers}
              </span>
            </div>
            
            <div className="text-xs text-telegram-600">
              Сотрудники могут подписаться отправив <code>/start</code> боту
            </div>
            
            <button
              onClick={loadTelegramStatus}
              className="w-full mt-2 text-xs bg-telegram-100 hover:bg-telegram-200 text-telegram-700 py-1 px-2 rounded transition-colors"
            >
              Обновить статус
            </button>
          </div>
        </div>

        {/* ПРОГРЕСС */}
        {isSending && (
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Отправка email...</span>
              <span className="text-sm text-primary">
                {Math.round(sendProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${sendProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Правая панель: Превью + История */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Превью сообщения</h2>
            <div className="flex items-center space-x-2">
              {generationSettings.useAI && (
                <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">
                  AI
                </span>
              )}
              <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                Ценность: {currentValue.title || values[0]?.title || "Рост"}
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {preview}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">История рассылок</h2>
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
              Отправьте первую рассылку!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}