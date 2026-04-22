// Business Service - Doctor Routes
const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { listDoctors, getDoctorById, getMyProfile, getMyPatients, updateMyProfile } = require('../controllers/doctor.controller');

router.get('/',                authenticate, listDoctors);
router.get('/me/profile',      authenticate, requireRole('doctor'), getMyProfile);
router.get('/me/patients',     authenticate, requireRole('doctor'), getMyPatients);
router.put('/me/profile',      authenticate, requireRole('doctor'), updateMyProfile);
router.get('/:id',             authenticate, getDoctorById);

module.exports = router;
