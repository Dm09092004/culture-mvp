import { useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../config/emailjs';
import toast from 'react-hot-toast';

// Инициализация
emailjs.init(EMAILJS_CONFIG.publicKey);

const generateMessage = (employeeName: string, value: string, mission: string) => `
Привет, ${employeeName}! 💙

📍 **Ценность дня: "${value}"**

"${mission}"

Воплотим это сегодня! 🚀

С любовью,  
CultureOS
`;

export default function Notifications() {
  const { settings, updateSettings, addNotification, employees, values, mission } = useStore();
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);

  const preview = generateMessage('Команда', values[0]?.title || 'Рост', mission || 'Мы растём вместе!');

  const handleSend = async () => {
    if (employees.length === 0) {
      toast.error('Добавьте сотрудников!');
      return;
    }

    setIsSending(true);
    setSendProgress(0);
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const params = {
        to_email: emp.email,      // ← ОБЯЗАТЕЛЬНО!
        to_name: emp.name,        // ← ОБЯЗАТЕЛЬНО!
        message: generateMessage(emp.name, values[0]?.title || 'Рост', mission),
        value_title: values[0]?.title || 'Рост',
        mission: mission || 'Мы растём вместе!',
      };

      try {
        console.log('Отправка на:', emp.email, params); // ← ЛОГ ДЛЯ ОТЛАДКИ

        const result = await emailjs.send(
          EMAILJS_CONFIG.serviceID,
          EMAILJS_CONFIG.templateID,
          params
        );

        console.log('Успех:', result); // ← УСПЕХ!
        sentCount++;
      } catch (error: any) {
        console.error('Ошибка отправки на', emp.email, error.text || error);
        failedCount++;
      }

      setSendProgress(((i + 1) / employees.length) * 100);
    }

    addNotification({
      type: 'value_reminder',
      message: `Ценность: ${values[0]?.title} (${sentCount} отправлено)`,
      status: 'sent',
    });

    setIsSending(false);
    toast.success(`✅ Отправлено: ${sentCount}, Ошибок: ${failedCount}`);
  };

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
                onChange={(e) => updateSettings('frequency', e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="input"
              >
                <option value="daily">Ежедневно</option>
                <option value="weekly">Еженедельно</option>
                <option value="monthly">Ежемесячно</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Типы сообщений</label>
              <div className="space-y-2">
                {['value_reminder', 'mission_quote', 'team_shoutout'].map((type) => (
                  <label key={type} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.types.includes(type)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        updateSettings('types', checked
                          ? [...settings.types, type]
                          : settings.types.filter((t: string) => t !== type)
                        );
                      }}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span className="text-sm">
                      {type === 'value_reminder' && 'Напоминание о ценности'}
                      {type === 'mission_quote' && 'Цитата из миссии'}
                      {type === 'team_shoutout' && 'Крик души команды'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* КНОПКИ */}
        <button 
          className="w-full btn-secondary flex items-center justify-center space-x-2" 
          disabled={isSending}
        >
          <Sparkles className="w-4 h-4" />
          <span>Сгенерировать новое</span>
        </button>

        <button
          onClick={handleSend}
          disabled={isSending || employees.length === 0}
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
              <span>Отправить сейчас ({employees.length} чел.)</span>
            </>
          )}
        </button>

        {/* ПРОГРЕСС */}
        {isSending && (
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Отправка...</span>
              <span className="text-sm text-primary">{Math.round(sendProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${sendProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Правая панель: Превью + История */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Превью сообщения</h2>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="prose max-w-none whitespace-pre-wrap text-sm leading-relaxed">
              {preview}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">История рассылок</h2>
          { /* История из Zustand */ }
          <div className="space-y-3">
            { /* Пока пусто — заполнится после отправки */ }
            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
              Отправьте первую рассылку!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}