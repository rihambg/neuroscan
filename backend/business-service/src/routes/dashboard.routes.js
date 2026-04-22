// Business Service - Dashboard Routes
const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { getDoctorDashboard, getPatientDashboard } = require('../controllers/dashboard.controller');

router.get('/doctor',  authenticate, requireRole('doctor'), getDoctorDashboard);
router.get('/patient', authenticate, requireRole('patient'), getPatientDashboard);

module.exports = router;
