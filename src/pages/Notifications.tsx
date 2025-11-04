// src/pages/Notifications.tsx
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

export default function Notifications() {
  const {
    employees,
    aiValues,
    aiMission,
    frequency,
    setFrequency,
    notifications,
    addNotification,
  } = useStore();

  const sendNotification = () => {
    if (employees.length === 0) {
      toast.error('Добавьте сотрудников!');
      return;
    }

    const value = aiValues[Math.floor(Math.random() * aiValues.length)];
    const message = `Ценность дня: ${value.title}\n\n"${value.description}"`;

    employees.forEach(emp => {
      addNotification({
        to: emp.email,
        message,
        type: 'reminder', // Только fact | quote | reminder
      });
    });

    toast.success('Рассылка отправлена!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Рассылка</h1>

      <div className="mb-6">
        <label>Частота:</label>
        <select
          value={frequency}
          onChange={e => setFrequency(e.target.value as 'daily' | 'weekly' | 'manual')}
          className="ml-2 p-2 border rounded"
        >
          <option value="daily">Ежедневно</option>
          <option value="weekly">Еженедельно</option>
          <option value="manual">Вручную</option>
        </select>
      </div>

      <button onClick={sendNotification} className="btn-primary mb-6">
        Отправить сейчас
      </button>

      <h2 className="text-xl font-bold mb-4">История</h2>
      <div className="space-y-2">
        {notifications.map(n => (
          <div key={n.id} className="bg-white p-3 rounded shadow">
            <p><strong>Кому:</strong> {n.to}</p>
            <p><strong>Сообщение:</strong> {n.message}</p>
            <p><strong>Когда:</strong> {n.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}