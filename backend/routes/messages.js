const express = require('express');
const router = express.Router();
const {
  getConversations, getMessages, sendMessage, deleteMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get('/conversations', protect, getConversations);
router.get('/:userId', protect, getMessages);
router.post('/', protect, sendMessage);
router.delete('/:id', protect, deleteMessage);

module.exports = router;
