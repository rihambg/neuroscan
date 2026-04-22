// Business Service - Patient Routes
const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { getMyProfile, getPatientById, updateMyProfile, getAssignedDoctor } = require('../controllers/patient.controller');

router.get('/me/profile',        authenticate, requireRole('patient'), getMyProfile);
router.get('/me/assigned-doctor', authenticate, requireRole('patient'), getAssignedDoctor);
router.put('/me/profile',        authenticate, requireRole('patient'), updateMyProfile);
router.get('/:id',               authenticate, requireRole('doctor'), getPatientById);

module.exports = router;
