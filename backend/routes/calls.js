const express = require('express');
const router = express.Router();
const {
  getCallHistory,
  getCallDetails,
  initiateCall,
  updateCallStatus,
  recordCallLeave,
  deleteCall,
  getActiveCalls,
} = require('../controllers/callController');
const { protect } = require('../middleware/auth');

// Get call history
router.get('/history', protect, getCallHistory);

// Get active calls
router.get('/active', protect, getActiveCalls);

// Get call details
router.get('/:roomId', protect, getCallDetails);

// Initiate a call
router.post('/initiate', protect, initiateCall);

// Update call status
router.put('/:roomId/status', protect, updateCallStatus);

// Record when user leaves call
router.put('/:roomId/leave', protect, recordCallLeave);

// Delete call record
router.delete('/:roomId', protect, deleteCall);

module.exports = router;
