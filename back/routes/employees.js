import express from 'express';
import {
  getEmployees,
  addEmployee,
  deleteEmployee,
  importEmployees
} from '../controllers/employeesController.js';

const router = express.Router();

router.get('/', getEmployees);
router.post('/', addEmployee);
router.delete('/:id', deleteEmployee);
router.post('/import', importEmployees);

export default router;