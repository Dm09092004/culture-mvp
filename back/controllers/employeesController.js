import EmployeesModel from '../models/EmployeesModel.js';
import XLSX from 'xlsx';

/**
 * Get all employees
 */
export const getEmployees = async (req, res) => {
  try {
    const employees = await EmployeesModel.getAll();
    res.json({ 
      success: true, 
      data: employees 
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get employees' 
    });
  }
};

/**
 * Add new employee
 */
export const addEmployee = async (req, res) => {
  try {
    const { name, email, department } = req.body;
    
    if (!name || !email || !department) {
      return res.status(400).json({
        success: false,
        error: 'Name, email and department are required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const employee = await EmployeesModel.add({ name, email, department });
    
    res.json({ 
      success: true, 
      data: employee 
    });
  } catch (error) {
    console.error('Add employee error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add employee' 
    });
  }
};

/**
 * Delete employee by ID
 */
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID is required'
      });
    }

    await EmployeesModel.delete(id);
    
    res.json({ 
      success: true, 
      message: 'Employee deleted successfully' 
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete employee' 
    });
  }
};

/**
 * Import employees from Excel/CSV file
 */
export const importEmployees = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const file = req.files.file;
    
    // Check file type
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Please upload Excel or CSV file'
      });
    }

    // Read the file
    const workbook = XLSX.read(file.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data found in file'
      });
    }

    const importedEmployees = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Map different possible column names
      const name = row['Имя'] || row['Name'] || row['name'] || row['имя'];
      const email = row['Email'] || row['email'] || row['Почта'] || row['почта'];
      const department = row['Отдел'] || row['Department'] || row['department'] || row['отдел'];

      if (!name || !email || !department) {
        errors.push(`Row ${i + 2}: Missing required fields`);
        continue;
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push(`Row ${i + 2}: Invalid email format`);
        continue;
      }

      try {
        const employee = await EmployeesModel.add({ name, email, department });
        importedEmployees.push(employee);
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      data: {
        imported: importedEmployees,
        errors: errors,
        totalImported: importedEmployees.length,
        totalErrors: errors.length
      }
    });

  } catch (error) {
    console.error('Import employees error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import employees'
    });
  }
};