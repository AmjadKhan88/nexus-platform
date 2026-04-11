const express = require('express');
const router = express.Router();
const {
  deposit, withdraw, transfer, getTransactions, stripeWebhook,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Stripe webhook needs raw body – must come before express.json()
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

router.post('/deposit', protect, deposit);
router.post('/withdraw', protect, withdraw);
router.post('/transfer', protect, transfer);
router.get('/transactions', protect, getTransactions);

module.exports = router;
