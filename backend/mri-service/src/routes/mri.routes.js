// MRI Service - MRI Scan Routes
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { upload } = require('../middleware/upload.middleware');
const { uploadScan, getPatientScans, getScanById, updateStatus } = require('../controllers/mri.controller');

// JWT middleware (inline for MRI service)
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'neuroscan_super_secret_jwt_key_2025');
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
}

router.post('/upload',                      authenticate, upload.single('mriFile'), uploadScan);
router.get('/patient/:patientId',           authenticate, getPatientScans);
router.get('/:id',                          authenticate, getScanById);
router.put('/:id/status',                   authenticate, requireRole('doctor'), updateStatus);

module.exports = router;
