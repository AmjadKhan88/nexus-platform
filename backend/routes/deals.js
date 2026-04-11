const express = require('express');
const router = express.Router();
const {
  createDeal, getDeals, getDeal, updateDeal, deleteDeal,
} = require('../controllers/dealController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createDeal);
router.get('/', protect, getDeals);
router.get('/:id', protect, getDeal);
router.put('/:id', protect, updateDeal);
router.delete('/:id', protect, deleteDeal);

module.exports = router;
