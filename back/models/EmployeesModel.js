import { BaseModel } from './BaseModel.js';
import { Sequelize } from 'sequelize';

class EmployeesModel extends BaseModel {
  constructor() {
    super('Employee', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      department: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  }

  async getAll() {
    const employees = await this.model.findAll({
      order: [['createdAt', 'DESC']]
    });
    return employees.map(emp => emp.toJSON());
  }

  async add(employeeData) {
    const newEmployee = await this.model.create({
      ...employeeData,
      createdAt: new Date()
    });
    return newEmployee.toJSON();
  }

  async delete(id) {
    const result = await this.model.destroy({
      where: { id }
    });
    return result > 0;
  }

  async import(employeesData) {
    const results = [];
    
    for (const empData of employeesData) {
      try {
        const employee = await this.add(empData);
        results.push(employee);
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          console.warn(`Сотрудник с email ${empData.email} уже существует`);
        } else {
          throw error;
        }
      }
    }
    
    return results;
  }

  async findByEmail(email) {
    const employee = await this.model.findOne({
      where: { email: email.toLowerCase() }
    });
    return employee ? employee.toJSON() : null;
  }
}

const employeesModel = new EmployeesModel();
await employeesModel.init();
export default employeesModel;