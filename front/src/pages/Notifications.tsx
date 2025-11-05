import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Send, 
  Sparkles, 
  Loader2, 
  RefreshCw, 
  Settings, 
  MessageCircle, 
  Bell, 
  Calendar, 
  Mail, 
  Trash2, 
  Filter,
  Edit3,
  Save,
  X,
  Wand2,
  Type,
  Zap,
  Languages
} from "lucide-react";
import { useStore } from "../store/useStore";
import emailjs from "@emailjs/browser";
import { EMAILJS_CONFIG } from "../config/emailjs";
import { useToastContext } from "../contexts/ToastContext";
import apiService from "../services/api";
import RegularNotificationsManager from "../components/RegularNotificationsManager";

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

// Типы для редактирования
type EditMode = 'view' | 'edit';
type AIEditType = 'improve' | 'shorten' | 'lengthen' | 'formal' | 'friendly' | 'fix_grammar' | 'rephrase';

export default function Notifications() {
  const {
    settings,
    updateSettings,
    addNotification,
    employees,
    values,
    mission,
    regularNotifications,
    addRegularNotification,
    updateRegularNotification,
    deleteRegularNotification,
    toggleRegularNotification
  } = useStore();
  
  const { success, error, info } = useToastContext();
  
  const [isSending, setIsSending] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [isSendingRegular, setIsSendingRegular] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");
  const [editedMessage, setEditedMessage] = useState("");
  const [currentValue, setCurrentValue] = useState({ title: "", description: "" });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState<EditMode>('view');
  const [isAIEditing, setIsAIEditing] = useState(false);
  const [generationSettings, setGenerationSettings] = useState({
    tone: "friendly" as "friendly" | "professional" | "energetic" | "caring",
    length: "medium" as "short" | "medium" | "long",
    useAI: true
  });
  const [showAISettings, setShowAISettings] = useState(false);
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  const [telegramSubscribers, setTelegramSubscribers] = useState(0);
  const [activeTab, setActiveTab] = useState<'motivational' | 'regular'>('motivational');
  
  // Новые состояния для истории уведомлений
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'email' | 'telegram'>('all');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Загрузка истории уведомлений из localStorage
  const loadNotificationHistory = useCallback(() => {
    setIsLoadingHistory(true);
    try {
      const savedHistory = localStorage.getItem('notificationHistory');
      if (savedHistory) {
        setNotificationHistory(JSON.parse(savedHistory));
      } else {
        // Моковые данные для демонстрации
        const mockHistory = [
          {
            id: '1',
            type: 'value_reminder',
            title: 'Напоминание о ценности "Развитие"',
            message: 'Привет! 🌟\n\nСегодня хотели напомнить о нашей важной ценности: "Развитие".\n\nМы создаем прекрасную корпоративную культуру вместе!\n\nДавай воплотим это в наших действиях сегодня! 💪\n\nС уважением, CultureOS',
            status: 'sent',
            date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            recipients: employees.length,
            successCount: Math.floor(employees.length * 0.9),
            channel: 'email',
            value: 'Развитие'
          },
          {
            id: '2',
            type: 'telegram_broadcast',
            title: 'Мотивационное сообщение',
            message: 'Добрый день! ✨\n\nНапоминаем о нашей общей миссии: "Мы создаем прекрасную корпоративную культуру вместе!".\n\nЦенность "Команда" помогает нам двигаться к этой цели.\n\nПродолжаем в том же духе! 🚀\n\nС уважением, CultureOS',
            status: 'sent',
            date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            recipients: 8,
            successCount: 8,
            channel: 'telegram',
            value: 'Команда'
          },
          {
            id: '3',
            type: 'regular_notification',
            title: 'Еженедельный отчет',
            message: 'Уважаемые коллеги!\n\nПредставляем вашему вниманию еженедельный отчет о наших достижениях...',
            status: 'sent',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            recipients: employees.length,
            successCount: employees.length,
            channel: 'email',
            value: ''
          }
        ];
        setNotificationHistory(mockHistory);
      }
    } catch (err) {
      console.error("Ошибка загрузки истории:", err);
      error("Не удалось загрузить историю уведомлений");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [employees.length, error]);

  // Сохранение истории в localStorage
  const saveNotificationHistory = useCallback((history: any[]) => {
    try {
      localStorage.setItem('notificationHistory', JSON.stringify(history));
    } catch (err) {
      console.error("Ошибка сохранения истории:", err);
    }
  }, []);

  // Инициализация при загрузке компонента
  useEffect(() => {
    setIsComponentMounted(true);
    generateNewMessage();
    loadTelegramStatus();
    loadNotificationHistory();

    return () => {
      setIsComponentMounted(false);
    };
  }, [loadNotificationHistory]);

  // Фокусировка на textarea при переходе в режим редактирования
  useEffect(() => {
    if (isEditing === 'edit' && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

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
    setIsEditing('view');

    try {
      const activeTypes = settings.types.filter(type => 
        ['value_reminder', 'mission_quote', 'team_shoutout'].includes(type)
      );
      
      const selectedType = activeTypes.length > 0 
        ? activeTypes[Math.floor(Math.random() * activeTypes.length)]
        : 'value_reminder';
      
      const availableValues = values.length > 0 ? values : [{ title: "Развитие", description: "" }];
      const randomValue = availableValues[Math.floor(Math.random() * availableValues.length)];
      
      setCurrentValue(randomValue);

      let generatedMessage: string;

      if (generationSettings.useAI) {
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
        generatedMessage = generateTemplateMessage(selectedType, randomValue.title, mission);
        info("📝 Шаблонное сообщение создано");
      }

      setCurrentMessage(generatedMessage);
      setEditedMessage(generatedMessage);
      
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

  // Редактирование с помощью нейросети
  const editWithAI = useCallback(async (editType: AIEditType) => {
    if (!editedMessage.trim()) {
      error("Нет сообщения для редактирования");
      return;
    }

    setIsAIEditing(true);

    try {
      let instruction = '';
      
      switch (editType) {
        case 'improve':
          instruction = 'Улучши текст, сделай его более выразительным и грамотным, сохранив исходный смысл и тон.';
          break;
        case 'shorten':
          instruction = 'Сократи текст, оставив только самую суть, но сохранив основное сообщение.';
          break;
        case 'lengthen':
          instruction = 'Расширь текст, добавь больше деталей и развернутых формулировок, сохранив основную мысль.';
          break;
        case 'formal':
          instruction = 'Сделай текст более формальным и профессиональным, подходящим для деловой переписки.';
          break;
        case 'friendly':
          instruction = 'Сделай текст более дружелюбным, теплым и неформальным.';
          break;
        case 'fix_grammar':
          instruction = 'Исправь грамматические, пунктуационные и стилистические ошибки в тексте.';
          break;
        case 'rephrase':
          instruction = 'Перефразируй текст, сохранив смысл, но изменив формулировки.';
          break;
      }

      const response = await apiService.editMessage({
        message: editedMessage,
        instruction,
        currentValue: currentValue.title,
        currentMission: mission
      });

      if (response.success && response.data) {
        setEditedMessage(response.data.message);
        success(`✅ Сообщение отредактировано нейросетью!`);
      } else {
        throw new Error(response.error || 'API returned unsuccessful response');
      }
    } catch (err: any) {
      console.error("AI edit error:", err);
      error("Ошибка при редактировании нейросетью");
    } finally {
      setIsAIEditing(false);
    }
  }, [editedMessage, currentValue.title, mission, success, error]);

  // Переключение режимов редактирования/просмотра
  const enterEditMode = useCallback(() => {
    setEditedMessage(currentMessage);
    setIsEditing('edit');
  }, [currentMessage]);

  const saveEdit = useCallback(() => {
    setCurrentMessage(editedMessage);
    setIsEditing('view');
    success("✅ Сообщение сохранено");
  }, [editedMessage, success]);

  const cancelEdit = useCallback(() => {
    setEditedMessage(currentMessage);
    setIsEditing('view');
  }, [currentMessage]);

  // Добавление уведомления в историю
  const addToHistory = useCallback((notification: any) => {
    const newNotification = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...notification
    };
    
    setNotificationHistory(prev => {
      const newHistory = [newNotification, ...prev];
      saveNotificationHistory(newHistory);
      return newHistory;
    });
  }, [saveNotificationHistory]);

  // Удаление уведомления из истории
  const removeFromHistory = useCallback((id: string) => {
    setNotificationHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      saveNotificationHistory(newHistory);
      return newHistory;
    });
    success("Уведомление удалено из истории");
  }, [saveNotificationHistory, success]);

  // Очистка всей истории
  const clearHistory = useCallback(() => {
    if (window.confirm("Вы уверены, что хотите очистить всю историю уведомлений?")) {
      setNotificationHistory([]);
      saveNotificationHistory([]);
      success("История уведомлений очищена");
    }
  }, [saveNotificationHistory, success]);

  // Отправка в Telegram
  const handleSendTelegram = async () => {
    const messageToSend = isEditing === 'edit' ? editedMessage : currentMessage;
    
    if (!messageToSend) {
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
      const telegramMessage = `📧 <b>Уведомление от CultureOS</b>\n\n${messageToSend}\n\n---\n<em>Это сообщение отправлено автоматически</em>`;

      const response = await apiService.broadcastTelegramMessage(telegramMessage);
      
      if (response.success && response.data) {
        const { successful, total } = response.data;
        
        if (successful > 0) {
          success(`✅ Сообщение отправлено ${successful} из ${total} подписчиков в Telegram`);
          
          // Добавляем в историю
          addToHistory({
            type: "telegram_broadcast",
            title: `Telegram: "${currentValue.title}"`,
            message: messageToSend,
            status: "sent",
            recipients: total,
            successCount: successful,
            channel: 'telegram',
            value: currentValue.title
          });
          
          addNotification({
            type: "telegram_broadcast",
            message: `Telegram: "${currentValue.title}" (${successful}/${total} подписчиков)`,
            status: successful === total ? "sent" : "scheduled",
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

  // Отправка email
  const handleSend = async () => {
    const messageToSend = isEditing === 'edit' ? editedMessage : currentMessage;
    
    if (employees.length === 0) {
      error("Добавьте сотрудников!");
      return;
    }

    if (!messageToSend) {
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
        
        const personalizedMessage = messageToSend.replace(/Привет!|Добрый день!|Приветствую!/, `Привет, ${emp.name}!`);

        const params = {
          to_email: emp.email,
          to_name: emp.name,
          message: personalizedMessage,
          value_title: currentValue.title,
          mission: mission || "Мы создаем прекрасную корпоративную культуру вместе!",
        };

        try {
          await emailjs.send(
            EMAILJS_CONFIG.serviceID,
            EMAILJS_CONFIG.templateID,
            params
          );
          sentCount++;
        } catch (err: any) {
          console.error("Ошибка отправки на", emp.email, err.text || err);
          failedCount++;
        }

        setSendProgress(((i + 1) / employees.length) * 100);
      }

      // Добавляем в историю
      addToHistory({
        type: "value_reminder",
        title: `Рассылка: "${currentValue.title}"`,
        message: messageToSend,
        status: failedCount === 0 ? "sent" : "partial",
        recipients: employees.length,
        successCount: sentCount,
        channel: 'email',
        value: currentValue.title
      });
      
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

  // Функция для отправки одного обычного уведомления
  const sendSingleRegularNotification = async (notification: any): Promise<number> => {
    let sentCount = 0;
    let failedCount = 0;

    try {
      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        
        const params = {
          to_email: emp.email,
          to_name: emp.name,
          message: `${notification.title}\n\n${notification.message}`,
          subject: notification.title,
          type: 'regular_notification'
        };

        try {
          await emailjs.send(
            EMAILJS_CONFIG.serviceID,
            EMAILJS_CONFIG.templateID,
            params
          );
          sentCount++;
        } catch (err: any) {
          console.error("Ошибка отправки на", emp.email, err.text || err);
          failedCount++;
        }
      }

      // Добавляем в историю
      addToHistory({
        type: "regular_notification",
        title: `Обычное уведомление: "${notification.title}"`,
        message: notification.message,
        status: failedCount === 0 ? "sent" : "partial",
        recipients: employees.length,
        successCount: sentCount,
        channel: 'email',
        value: ''
      });

      addNotification({
        type: "regular_notification",
        message: `Обычное уведомление: "${notification.title}" (${sentCount} отправлено)`,
        status: "sent",
      });

      return sentCount;
    } catch (err) {
      console.error("Ошибка при отправке уведомления:", notification.title, err);
      return 0;
    }
  };

  // Функция для отправки всех активных обычных уведомлений
  const handleSendAllActiveRegularNotifications = async () => {
    const activeNotifications = regularNotifications.filter(n => n.enabled);
    
    if (activeNotifications.length === 0) {
      error("Нет активных обычных уведомлений");
      return;
    }

    if (employees.length === 0) {
      error("Добавьте сотрудников!");
      return;
    }

    setIsSendingRegular(true);
    setSendProgress(0);
    
    let totalSent = 0;
    let totalNotifications = activeNotifications.length;
    
    try {
      for (let i = 0; i < totalNotifications; i++) {
        const notification = activeNotifications[i];
        
        setSendProgress(((i) / totalNotifications) * 100);
        
        const sentCount = await sendSingleRegularNotification(notification);
        totalSent += sentCount;
        
        if (i < totalNotifications - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setSendProgress(100);
      
      if (totalSent > 0) {
        success(`✅ Отправлено ${totalNotifications} обычных уведомлений на ${employees.length} сотрудников`);
      } else {
        error("Не удалось отправить ни одного уведомления");
      }
    } catch (err) {
      console.error("Ошибка при массовой отправке:", err);
      error("Произошла ошибка при отправке уведомлений");
    } finally {
      setIsSendingRegular(false);
      setTimeout(() => setSendProgress(0), 1000);
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} мин. назад`;
    } else if (diffHours < 24) {
      return `${diffHours} ч. назад`;
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дн. назад`;
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  // Получение иконки для типа уведомления
  const getNotificationIcon = (type: string, channel: string) => {
    if (channel === 'telegram') return <MessageCircle className="w-4 h-4 text-blue-500" />;
    if (type === 'regular_notification') return <Bell className="w-4 h-4 text-orange-500" />;
    return <Sparkles className="w-4 h-4 text-purple-500" />;
  };

  // Получение цвета статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Получение текста статуса
  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return 'Отправлено';
      case 'partial': return 'Частично';
      case 'failed': return 'Ошибка';
      default: return status;
    }
  };

  // Фильтрация истории
  const filteredHistory = historyFilter === 'all' 
    ? notificationHistory 
    : notificationHistory.filter(item => item.channel === historyFilter);

  const preview = currentMessage || "Сгенерируйте первое сообщение...";

  return (
    <div className="space-y-6">
      {/* Переключение вкладок */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('motivational')}
          className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-medium text-sm ${
            activeTab === 'motivational'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Мотивационные</span>
        </button>
        <button
          onClick={() => setActiveTab('regular')}
          className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-medium text-sm ${
            activeTab === 'regular'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Обычные уведомления</span>
        </button>
      </div>

      {activeTab === 'motivational' ? (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Левая панель: Настройки мотивационных уведомлений */}
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

                {/* КНОПКА ДЛЯ TELEGRAM */}
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

              {/* РЕЖИМ РЕДАКТИРОВАНИЯ */}
              {isEditing === 'edit' ? (
                <div className="space-y-4">
                  {/* Панель инструментов редактирования */}
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                    <button
                      onClick={() => editWithAI('improve')}
                      disabled={isAIEditing}
                      className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Wand2 className="w-4 h-4 text-purple-600" />
                      <span>Улучшить текст</span>
                    </button>
                    <button
                      onClick={() => editWithAI('shorten')}
                      disabled={isAIEditing}
                      className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Type className="w-4 h-4 text-blue-600" />
                      <span>Сократить</span>
                    </button>
                    <button
                      onClick={() => editWithAI('lengthen')}
                      disabled={isAIEditing}
                      className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4 text-yellow-600" />
                      <span>Расширить</span>
                    </button>
                    <button
                      onClick={() => editWithAI('formal')}
                      disabled={isAIEditing}
                      className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Languages className="w-4 h-4 text-gray-600" />
                      <span>Сделать формальным</span>
                    </button>
                    <button
                      onClick={() => editWithAI('friendly')}
                      disabled={isAIEditing}
                      className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-green-600" />
                      <span>Сделать дружелюбным</span>
                    </button>
                  </div>

                  {/* Индикатор загрузки AI */}
                  {isAIEditing && (
                    <div className="flex items-center justify-center py-2 bg-blue-50 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                      <span className="text-sm text-blue-600">Нейросеть редактирует сообщение...</span>
                    </div>
                  )}

                  {/* Поле редактирования */}
                  <textarea
                    ref={textareaRef}
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    rows={12}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-y font-mono text-sm"
                    placeholder="Введите текст сообщения..."
                  />

                  {/* Кнопки управления редактированием */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="text-sm text-gray-500">
                      {editedMessage.length} символов
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={cancelEdit}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Отмена</span>
                      </button>
                      <button
                        onClick={saveEdit}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Сохранить</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* РЕЖИМ ПРОСМОТРА */
                <div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {preview}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={enterEditMode}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Редактировать сообщение</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ОБНОВЛЕННАЯ СЕКЦИЯ ИСТОРИИ РАССЫЛОК */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">История рассылок</h2>
                <div className="flex items-center space-x-2">
                  {/* Фильтры */}
                  <select
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value as any)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Все</option>
                    <option value="email">Email</option>
                    <option value="telegram">Telegram</option>
                  </select>
                  
                  <button
                    onClick={loadNotificationHistory}
                    disabled={isLoadingHistory}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-primary disabled:opacity-50 p-1"
                    title="Обновить историю"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  </button>
                  
                  {notificationHistory.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800 p-1"
                      title="Очистить историю"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {isLoadingHistory ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2">Загрузка истории...</span>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Нет отправленных уведомлений</p>
                  <p className="text-sm mt-1">Отправьте первую рассылку</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredHistory.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3 flex-1">
                          {getNotificationIcon(notification.type, notification.channel)}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {notification.title}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1 flex-wrap">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span>{formatDate(notification.date)}</span>
                              {notification.channel === 'email' && (
                                <>
                                  <Mail className="w-3 h-3 flex-shrink-0" />
                                  <span>{notification.successCount}/{notification.recipients} отправлено</span>
                                </>
                              )}
                              {notification.channel === 'telegram' && (
                                <>
                                  <MessageCircle className="w-3 h-3 flex-shrink-0" />
                                  <span>{notification.successCount} подписчиков</span>
                                </>
                              )}
                              {notification.value && (
                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                                  {notification.value}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                            {getStatusText(notification.status)}
                          </span>
                          <button
                            onClick={() => removeFromHistory(notification.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all p-1"
                            title="Удалить из истории"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Прогресс-бар для email рассылок */}
                      {notification.channel === 'email' && notification.recipients > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Доставка</span>
                            <span>{Math.round((notification.successCount / notification.recipients) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                notification.successCount === notification.recipients 
                                  ? 'bg-green-500' 
                                  : 'bg-yellow-500'
                              }`}
                              style={{ width: `${(notification.successCount / notification.recipients) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Превью сообщения (раскрывающееся) */}
                      <details className="mt-3">
                        <summary className="text-sm text-gray-600 hover:text-gray-800 cursor-pointer">
                          Показать сообщение
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                          {notification.message}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}

              {filteredHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Всего рассылок: {filteredHistory.length}</span>
                    <span>
                      Успешно: {filteredHistory.filter(n => n.status === 'sent').length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <RegularNotificationsManager />
          
          {/* Кнопка отправки всех активных обычных уведомлений */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Массовая отправка</h3>
                <p className="text-sm text-gray-600">
                  Отправить все активные обычные уведомления ({regularNotifications.filter(n => n.enabled).length} шт.)
                </p>
              </div>
              <button
                onClick={handleSendAllActiveRegularNotifications}
                disabled={isSendingRegular || regularNotifications.filter(n => n.enabled).length === 0 || employees.length === 0}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {isSendingRegular ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Отправка...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Отправить все активные</span>
                  </>
                )}
              </button>
            </div>

            {/* Прогресс-бар для массовой отправки */}
            {isSendingRegular && (
              <div className="mt-4 bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Отправка обычных уведомлений... ({Math.round(sendProgress)}%)
                  </span>
                  <span className="text-sm text-primary">
                    {regularNotifications.filter(n => n.enabled).length} уведомлений
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${sendProgress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Отправка на {employees.length} сотрудников
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}