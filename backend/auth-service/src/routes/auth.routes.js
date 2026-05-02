// Auth Service - Routes
const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { register, login, validateToken, createPatientAccount, me } = require('../controllers/auth.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

// Validation helper
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

// Register validation rules
const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['doctor', 'patient']).withMessage('Role must be doctor or patient'),
  body('firstName').notEmpty().trim().withMessage('First name required'),
  body('lastName').notEmpty().trim().withMessage('Last name required'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

// Public Routes 
router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/validate', validateToken);

// Protected Routes 
router.get('/me', authenticate, me);
router.post('/create-patient', authenticate, requireRole('doctor'), createPatientAccount);

module.exports = router;
