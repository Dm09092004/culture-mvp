import { useState, useEffect } from 'react';
import { Plus, Upload, Trash2, ArrowRight, Download, Loader2, Edit2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { Employee } from '../types';
import toast from 'react-hot-toast';

export default function Employees() {
  const { 
    employees, 
    addEmployee, 
    deleteEmployee, 
    updateEmployee,
    loadEmployees,
    loading 
  } = useStore();
  
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: '', email: '', department: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '', department: '' });
  const [isImporting, setIsImporting] = useState(false);

  // Загружаем сотрудников при монтировании компонента
  useEffect(() => {
    const initializeData = async () => {
      try {
        await loadEmployees();
      } catch (error) {
        console.error('Error loading employees:', error);
        toast.error('Ошибка загрузки сотрудников');
      }
    };

    initializeData();
  }, [loadEmployees]);

  // === ЭКСПОРТ В EXCEL ===
  const exportToExcel = () => {
    if (employees.length === 0) {
      toast.error('Нет данных для экспорта');
      return;
    }

    try {
      const data = employees.map((emp: Employee) => ({
        Имя: emp.name,
        Email: emp.email,
        Отдел: emp.department,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Сотрудники');
      XLSX.writeFile(wb, 'employees.xlsx');
      toast.success('Данные экспортированы в Excel');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Ошибка экспорта данных');
    }
  };

  // === ИМПОРТ ИЗ EXCEL/CSV ===
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const reader = new FileReader();
      
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          if (!bstr) {
            throw new Error('Failed to read file');
          }

          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws) as any[];

          if (data.length === 0) {
            toast.error('Файл не содержит данных');
            return;
          }

          let importedCount = 0;
          let errorCount = 0;

          for (const row of data) {
            try {
              const name = row['Имя'] || row['Name'] || row['name'] || row['имя'];
              const email = row['Email'] || row['email'] || row['Почта'] || row['почта'];
              const department = row['Отдел'] || row['Department'] || row['department'] || row['отдел'];

              if (!name || !email || !department) {
                console.warn('Skipping row with missing data:', row);
                errorCount++;
                continue;
              }

              // Валидация email
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(email)) {
                console.warn('Skipping row with invalid email:', row);
                errorCount++;
                continue;
              }

              await addEmployee({ name, email, department });
              importedCount++;
            } catch (error) {
              console.error('Error importing row:', row, error);
              errorCount++;
            }
          }

          // Перезагружаем список сотрудников
          await loadEmployees();

          if (importedCount > 0) {
            toast.success(`Импортировано ${importedCount} сотрудников`);
          }
          if (errorCount > 0) {
            toast.error(`Не удалось импортировать ${errorCount} записей`);
          }
        } catch (error) {
          console.error('Import processing error:', error);
          toast.error('Ошибка обработки файла');
        } finally {
          setIsImporting(false);
        }
      };

      reader.onerror = () => {
        toast.error('Ошибка чтения файла');
        setIsImporting(false);
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Ошибка импорта данных');
      setIsImporting(false);
    }

    // Сбрасываем значение input чтобы можно было выбрать тот же файл снова
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addEmployee(form);
      setForm({ name: '', email: '', department: '' });
      setShowModal(false);
      toast.success('Сотрудник добавлен');
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Ошибка при добавлении сотрудника');
    }
  };

  const handleEditClick = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditForm({
      name: employee.name,
      email: employee.email,
      department: employee.department
    });
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEmployee) return;

    try {
      await updateEmployee(editingEmployee.id, editForm);
      setShowEditModal(false);
      setEditingEmployee(null);
      toast.success('Данные сотрудника обновлены');
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Ошибка при обновлении данных сотрудника');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить сотрудника?')) {
      return;
    }

    try {
      await deleteEmployee(id);
      toast.success('Сотрудник удален');
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Ошибка при удалении сотрудника');
    }
  };

  if (loading.employees && employees.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Загрузка сотрудников...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-text">Сотрудники</h1>
        <div className="flex gap-3">
          {/* ИМПОРТ */}
          <label className={`btn-secondary flex items-center space-x-2 cursor-pointer ${isImporting ? 'opacity-50' : ''}`}>
            {isImporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>{isImporting ? 'Импорт...' : 'Импорт'}</span>
            <input 
              type="file" 
              accept=".xlsx,.csv" 
              onChange={handleImport} 
              className="hidden" 
              disabled={isImporting}
            />
          </label>

          {/* ЭКСПОРТ */}
          <button 
            onClick={exportToExcel} 
            className="btn-secondary flex items-center space-x-2"
            disabled={employees.length === 0}
          >
            <Download className="w-4 h-4" />
            <span>Экспорт</span>
          </button>

          <button 
            onClick={() => setShowModal(true)} 
            className="btn-primary flex items-center space-x-2"
          >
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
              {employees.map((emp: Employee) => (
                <tr key={emp.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{emp.name}</td>
                  <td className="py-3 px-4">{emp.email}</td>
                  <td className="py-3 px-4">{emp.department}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditClick(emp)} 
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Редактировать сотрудника"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteEmployee(emp.id)} 
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Удалить сотрудника"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t text-sm text-gray-500">
            Всего сотрудников: {employees.length}
          </div>
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
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">Добавить сотрудника</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Имя *</label>
                <input 
                  type="text" 
                  placeholder="Введите имя" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  className="input" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input 
                  type="email" 
                  placeholder="Введите email" 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  className="input" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Отдел *</label>
                <input 
                  type="text" 
                  placeholder="Введите отдел" 
                  value={form.department} 
                  onChange={(e) => setForm({ ...form, department: e.target.value })} 
                  className="input" 
                  required 
                />
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
                  disabled={!form.name || !form.email || !form.department}
                >
                  Сохранить
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Модалка редактирования */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">Редактировать сотрудника</h2>
            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Имя *</label>
                <input 
                  type="text" 
                  placeholder="Введите имя" 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                  className="input" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input 
                  type="email" 
                  placeholder="Введите email" 
                  value={editForm.email} 
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} 
                  className="input" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Отдел *</label>
                <input 
                  type="text" 
                  placeholder="Введите отдел" 
                  value={editForm.department} 
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} 
                  className="input" 
                  required 
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEmployee(null);
                  }} 
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={!editForm.name || !editForm.email || !editForm.department}
                >
                  Сохранить изменения
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
