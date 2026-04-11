const express = require('express');
const router = express.Router();
const {
  scheduleMeeting, getMeetings, updateMeeting, deleteMeeting,
} = require('../controllers/meetingController');
const { protect } = require('../middleware/auth');

router.post('/', protect, scheduleMeeting);
router.get('/', protect, getMeetings);
router.put('/:id', protect, updateMeeting);
router.delete('/:id', protect, deleteMeeting);

module.exports = router;
