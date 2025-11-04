import { useState } from 'react';
import { Plus, Upload, Trash2, ArrowRight, Download } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';  // ← НОВАЯ БИБЛИОТЕКА

export default function Employees() {
  const { employees, addEmployee, deleteEmployee } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', department: '' });

  // === ЭКСПОРТ В EXCEL ===
  const exportToExcel = () => {
    const data = employees.map(e => ({
      Имя: e.name,
      Email: e.email,
      Отдел: e.department,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Сотрудники');
    XLSX.writeFile(wb, 'employees.xlsx');
  };

  // === ИМПОРТ ИЗ EXCEL/CSV ===
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      data.forEach(row => {
        addEmployee({
          name: row['Имя'] || row['name'] || '',
          email: row['Email'] || row['email'] || '',
          department: row['Отдел'] || row['department'] || '',
        });
      });
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEmployee(form);
    setForm({ name: '', email: '', department: '' });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-text">Сотрудники</h1>
        <div className="flex gap-3">
          {/* ИМПОРТ */}
          <label className="btn-secondary flex items-center space-x-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Импорт</span>
            <input type="file" accept=".xlsx,.csv" onChange={handleImport} className="hidden" />
          </label>

          {/* ЭКСПОРТ */}
          <button onClick={exportToExcel} className="btn-secondary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Экспорт</span>
          </button>

          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Добавить</span>
          </button>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-400 mb-4">👥</div>
          <p className="text-gray-600">Список сотрудников пуст</p>
          <label className="mt-4 text-primary hover:text-blue-700 cursor-pointer">
            <Upload className="w-5 h-5 inline mr-2" />
            Импортировать из Excel
            <input type="file" accept=".xlsx,.csv" onChange={handleImport} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Имя</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Отдел</th>
                <th className="text-left py-3 px-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{emp.name}</td>
                  <td className="py-3 px-4">{emp.email}</td>
                  <td className="py-3 px-4">{emp.department}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => deleteEmployee(emp.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-center">
        <Link to="/notifications" className="btn-primary inline-flex items-center space-x-2">
          <span>Перейти к рассылке</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Модалка добавления */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Добавить сотрудника</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Имя" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" required />
              <input type="text" placeholder="Отдел" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input" required />
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Отмена</button>
                <button type="submit" className="btn-primary">Сохранить</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}