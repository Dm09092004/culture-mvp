import { useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Clock, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { RegularNotification } from '../types';

const notificationTypes = [
  { value: 'lunch', label: 'Обед', emoji: '🍽️' },
  { value: 'meeting', label: 'Совещание', emoji: '📅' },
  { value: 'reminder', label: 'Напоминание', emoji: '⏰' },
  { value: 'announcement', label: 'Объявление', emoji: '📢' },
  { value: 'custom', label: 'Свое', emoji: '✏️' }
];

const daysOfWeek = [
  { value: 0, label: 'Вс' },
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' }
];

export default function RegularNotificationsManager() {
  const { 
    regularNotifications, 
    addRegularNotification, 
    updateRegularNotification, 
    deleteRegularNotification,
    toggleRegularNotification,
    employees 
  } = useStore();
  
  const [showModal, setShowModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState<RegularNotification | null>(null);
  const [form, setForm] = useState({
    type: 'reminder' as RegularNotification['type'],
    title: '',
    message: '',
    time: '12:00',
    days: [1, 2, 3, 4, 5], // Пн-Пт по умолчанию
    enabled: true,
    recipients: ['all']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingNotification) {
      updateRegularNotification(editingNotification.id, form);
    } else {
      addRegularNotification(form);
    }
    
    setForm({
      type: 'reminder',
      title: '',
      message: '',
      time: '12:00',
      days: [1, 2, 3, 4, 5],
      enabled: true,
      recipients: ['all']
    });
    setEditingNotification(null);
    setShowModal(false);
  };

  const handleEdit = (notification: RegularNotification) => {
    setEditingNotification(notification);
    setForm({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      time: notification.time,
      days: notification.days,
      enabled: notification.enabled,
      recipients: notification.recipients
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingNotification(null);
    setForm({
      type: 'reminder',
      title: '',
      message: '',
      time: '12:00',
      days: [1, 2, 3, 4, 5],
      enabled: true,
      recipients: ['all']
    });
    setShowModal(true);
  };

  const toggleDay = (day: number) => {
    const newDays = form.days.includes(day)
      ? form.days.filter(d => d !== day)
      : [...form.days, day];
    setForm({ ...form, days: newDays.sort() });
  };

  const getTypeEmoji = (type: string) => {
    return notificationTypes.find(t => t.value === type)?.emoji || '📋';
  };

  const formatDays = (days: number[]) => {
    if (days.length === 7) return 'Ежедневно';
    if (days.length === 5 && days.every(d => [1,2,3,4,5].includes(d))) return 'По будням';
    if (days.length === 2 && days.every(d => [0,6].includes(d))) return 'По выходным';
    return days.map(d => daysOfWeek.find(day => day.value === d)?.label).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Обычные уведомления</h3>
        <button
          onClick={handleAddNew}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить уведомление</span>
        </button>
      </div>

      {regularNotifications.length === 0 ? (
        <div className="card text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Нет обычных уведомлений</p>
          <p className="text-sm text-gray-500">Добавьте уведомления о обедах, совещаниях и других событиях</p>
        </div>
      ) : (
        <div className="space-y-4">
          {regularNotifications.map((notification) => (
            <div key={notification.id} className="card flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">
                  {getTypeEmoji(notification.type)}
                </div>
                <div>
                  <h4 className="font-semibold">{notification.title}</h4>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{notification.time}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDays(notification.days)}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleRegularNotification(notification.id)}
                  className="text-2xl text-gray-500 hover:text-primary"
                  title={notification.enabled ? 'Отключить' : 'Включить'}
                >
                  {notification.enabled ? <ToggleRight className="text-primary" /> : <ToggleLeft />}
                </button>
                
                <button
                  onClick={() => handleEdit(notification)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
                  title="Редактировать"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => deleteRegularNotification(notification.id)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно добавления/редактирования */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingNotification ? 'Редактировать уведомление' : 'Добавить уведомление'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Тип уведомления</label>
                <div className="grid grid-cols-3 gap-2">
                  {notificationTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setForm({ ...form, type: type.value as any })}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        form.type === type.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-300 hover:border-primary/50'
                      }`}
                    >
                      <div className="text-lg mb-1">{type.emoji}</div>
                      <div className="text-xs">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Заголовок</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input"
                  placeholder="Например: Обед, Совещание..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Сообщение</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  className="input resize-none"
                  placeholder="Текст уведомления..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Время отправки</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Дни отправки</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                        form.days.includes(day.value)
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-300 hover:border-primary/50'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm">Активно</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingNotification ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}