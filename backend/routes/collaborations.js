const express = require('express');
const router = express.Router();
const {
  sendRequest, getRequests, updateRequest, deleteRequest,
} = require('../controllers/collaborationController');
const { protect } = require('../middleware/auth');

router.post('/', protect, sendRequest);
router.get('/', protect, getRequests);
router.put('/:id', protect, updateRequest);
router.delete('/:id', protect, deleteRequest);

module.exports = router;
