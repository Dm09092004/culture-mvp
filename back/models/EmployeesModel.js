import BaseModel from './BaseModel.js';

class EmployeesModel extends BaseModel {
  constructor() {
    super();
    super.set('employees', []);
    this.nextId = 1;
  }

  async getAll() {
    return super.get('employees') || []; // Используем super.get
  }

  async add(employeeData) {
    const employees = super.get('employees') || []; // Используем super.get
    const newEmployee = {
      id: this.nextId.toString(),
      ...employeeData,
      createdAt: new Date().toISOString()
    };
    
    employees.push(newEmployee);
    super.set('employees', employees); // Используем super.set
    this.nextId++;
    
    return newEmployee;
  }

  async delete(id) {
    const employees = super.get('employees') || []; // Используем super.get
    const filteredEmployees = employees.filter(emp => emp.id !== id);
    super.set('employees', filteredEmployees); // Используем super.set
  }

  async import(employeesData) {
    const currentEmployees = super.get('employees') || []; // Используем super.get
    const newEmployees = employeesData.map(emp => ({
      id: this.nextId.toString(),
      ...emp,
      createdAt: new Date().toISOString()
    }));

    const allEmployees = [...currentEmployees, ...newEmployees];
    super.set('employees', allEmployees); // Используем super.set
    this.nextId += newEmployees.length;

    return newEmployees;
  }
}

export default new EmployeesModel();