import { useEffect, useState } from "react";
import { Plus, Calendar, Clock, Trash2, Edit3, ToggleLeft, ToggleRight } from "lucide-react";
import { useStore } from "../store/useStore";
import { useToastContext } from "../contexts/ToastContext";

interface RegularNotificationForm {
  title: string;
  message: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
  time: string;
  dayOfWeek: number;
  dayOfMonth: number;
  enabled: boolean;
}

export default function RegularNotificationsManager() {
  const { 
    regularNotifications, 
    addRegularNotification, 
    updateRegularNotification, 
    deleteRegularNotification, 
    toggleRegularNotification,
    loadRegularNotifications 
  } = useStore();
  
  const { success, error } = useToastContext();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RegularNotificationForm>({
    title: '',
    message: '',
    schedule: 'manual',
    time: '09:00',
    dayOfWeek: 1, // Понедельник
    dayOfMonth: 1,
    enabled: true
  });

  const [isLoading, setIsLoading] = useState(false);

  // Загрузка регулярных уведомлений при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await loadRegularNotifications();
      } catch (error) {
        console.error('Failed to load regular notifications:', error);
        // error("Не удалось загрузить регулярные уведомления");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [loadRegularNotifications]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim() || !form.message.trim()) {
      error("Заполните название и сообщение");
      return;
    }

    // Подготавливаем данные для уведомления
    const baseData = {
      title: form.title.trim(),
      message: form.message.trim(),
      schedule: form.schedule,
      enabled: form.enabled
    };

    // Добавляем опциональные поля в зависимости от типа расписания
    const notificationData = {
      ...baseData,
      ...(form.schedule !== 'manual' && { time: form.time }),
      ...(form.schedule === 'weekly' && { dayOfWeek: form.dayOfWeek }),
      ...(form.schedule === 'monthly' && { dayOfMonth: form.dayOfMonth }),
    };

    if (editingId) {
      // Для обновления
      updateRegularNotification(editingId, notificationData);
      success("Уведомление обновлено");
    } else {
      // Для создания
      addRegularNotification(notificationData);
      success("Уведомление создано");
    }

    resetForm();
  };

  const resetForm = () => {
    setForm({
      title: '',
      message: '',
      schedule: 'manual',
      time: '09:00',
      dayOfWeek: 1,
      dayOfMonth: 1,
      enabled: true
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (notification: any) => {
    setForm({
      title: notification.title,
      message: notification.message,
      schedule: notification.schedule,
      time: notification.time || '09:00',
      dayOfWeek: notification.dayOfWeek || 1,
      dayOfMonth: notification.dayOfMonth || 1,
      enabled: notification.enabled
    });
    setEditingId(notification.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Удалить это уведомление?")) {
      deleteRegularNotification(id);
      success("Уведомление удалено");
    }
  };

  const getScheduleText = (notification: any) => {
    switch (notification.schedule) {
      case 'daily':
        return `Ежедневно в ${notification.time || '09:00'}`;
      case 'weekly':
        const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        return `Еженедельно в ${days[notification.dayOfWeek || 1]} в ${notification.time || '09:00'}`;
      case 'monthly':
        return `Ежемесячно ${notification.dayOfMonth || 1}-го в ${notification.time || '09:00'}`;
      case 'manual':
        return 'Ручная отправка';
      default:
        return 'Не указано';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка добавления */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Регулярные уведомления</h2>
          <p className="text-gray-600">
            Создавайте шаблоны для автоматической отправки
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Создать уведомление</span>
        </button>
      </div>

      {/* Форма создания/редактирования */}
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Редактировать уведомление' : 'Создать уведомление'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Название уведомления *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input"
                placeholder="Например: Еженедельный отчет"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Сообщение *
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
                className="input"
                placeholder="Текст уведомления..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Расписание
                </label>
                <select
                  value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value as any })}
                  className="input"
                >
                  <option value="manual">Ручная отправка</option>
                  <option value="daily">Ежедневно</option>
                  <option value="weekly">Еженедельно</option>
                  <option value="monthly">Ежемесячно</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Время отправки
                </label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="input"
                  disabled={form.schedule === 'manual'}
                />
              </div>
            </div>

            {form.schedule === 'weekly' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  День недели
                </label>
                <select
                  value={form.dayOfWeek}
                  onChange={(e) => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })}
                  className="input"
                >
                  <option value={1}>Понедельник</option>
                  <option value={2}>Вторник</option>
                  <option value={3}>Среда</option>
                  <option value={4}>Четверг</option>
                  <option value={5}>Пятница</option>
                  <option value={6}>Суббота</option>
                  <option value={0}>Воскресенье</option>
                </select>
              </div>
            )}

            {form.schedule === 'monthly' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  День месяца
                </label>
                <select
                  value={form.dayOfMonth}
                  onChange={(e) => setForm({ ...form, dayOfMonth: parseInt(e.target.value) })}
                  className="input"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, enabled: !form.enabled })}
                className="flex items-center space-x-2"
              >
                {form.enabled ? (
                  <ToggleRight className="w-6 h-6 text-green-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                )}
                <span className="text-sm">
                  {form.enabled ? 'Включено' : 'Выключено'}
                </span>
              </button>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingId ? 'Обновить' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список уведомлений */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">
          Мои уведомления ({regularNotifications.length})
        </h3>

        {regularNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Нет созданных уведомлений</p>
            <p className="text-sm mt-1">Создайте первое уведомление</p>
          </div>
        ) : (
          <div className="space-y-4">
            {regularNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg ${
                  notification.enabled 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold">{notification.title}</h4>
                      <button
                        onClick={() => toggleRegularNotification(notification.id)}
                        className="flex items-center space-x-1 text-sm"
                      >
                        {notification.enabled ? (
                          <ToggleRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-xs">
                          {notification.enabled ? 'Включено' : 'Выключено'}
                        </span>
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{getScheduleText(notification)}</span>
                      </div>
                      {notification.schedule !== 'manual' && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{notification.time}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                      {notification.message}
                    </p>

                    <div className="text-xs text-gray-500">
                      Создано: {formatDate(notification.createdAt)}
                      {notification.updatedAt !== notification.createdAt && (
                        <span>, обновлено: {formatDate(notification.updatedAt)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(notification)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Редактировать"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}