const Stripe = require('stripe');
const Transaction = require('../models/Transaction');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// @desc    Deposit – create Stripe PaymentIntent (sandbox)
// @route   POST /api/payments/deposit
exports.deposit = async (req, res, next) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // Create Stripe PaymentIntent (amount in cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: { userId: String(req.user._id), type: 'deposit' },
    });

    // Record transaction as pending
    const transaction = await Transaction.create({
      userId: req.user._id,
      type: 'deposit',
      amount,
      currency: currency.toUpperCase(),
      status: 'Pending',
      stripePaymentIntentId: paymentIntent.id,
      description: `Deposit of ${currency.toUpperCase()} ${amount}`,
    });

    res.status(201).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      transaction,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Withdraw (mock – no real payout in sandbox)
// @route   POST /api/payments/withdraw
exports.withdraw = async (req, res, next) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // Mock: instantly complete
    const transaction = await Transaction.create({
      userId: req.user._id,
      type: 'withdraw',
      amount,
      currency: currency.toUpperCase(),
      status: 'Completed',
      description: `Withdrawal of ${currency.toUpperCase()} ${amount}`,
    });

    res.status(201).json({ success: true, transaction });
  } catch (err) {
    next(err);
  }
};

// @desc    Transfer between users (mock)
// @route   POST /api/payments/transfer
exports.transfer = async (req, res, next) => {
  try {
    const { recipientId, amount, currency = 'usd', description } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const transaction = await Transaction.create({
      userId: req.user._id,
      type: 'transfer',
      amount,
      currency: currency.toUpperCase(),
      status: 'Completed',
      description: description || `Transfer to user`,
      recipientId,
    });

    res.status(201).json({ success: true, transaction });
  } catch (err) {
    next(err);
  }
};

// @desc    Get transaction history for current user
// @route   GET /api/payments/transactions
exports.getTransactions = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const filter = { userId: req.user._id };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .populate('recipientId', 'name avatarUrl');

    res.status(200).json({ success: true, count: transactions.length, transactions });
  } catch (err) {
    next(err);
  }
};

// @desc    Stripe webhook – mark transaction complete on payment_intent.succeeded
// @route   POST /api/payments/webhook
exports.stripeWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ success: false, message: `Webhook error: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    await Transaction.findOneAndUpdate(
      { stripePaymentIntentId: pi.id },
      { status: 'Completed' }
    );
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object;
    await Transaction.findOneAndUpdate(
      { stripePaymentIntentId: pi.id },
      { status: 'Failed' }
    );
  }

  res.json({ received: true });
};
