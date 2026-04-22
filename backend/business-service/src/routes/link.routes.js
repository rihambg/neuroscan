// Business Service - Link Request Routes
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { sendRequest, acceptRequest, rejectRequest, getIncomingRequests, getOutgoingRequests } = require('../controllers/link.controller');

router.post('/request',          authenticate, sendRequest);
router.put('/:id/accept',        authenticate, acceptRequest);
router.put('/:id/reject',        authenticate, rejectRequest);
router.get('/incoming',          authenticate, getIncomingRequests);
router.get('/outgoing',          authenticate, getOutgoingRequests);

module.exports = router;
