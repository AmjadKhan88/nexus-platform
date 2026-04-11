const Deal = require('../models/Deal');
const Notification = require('../models/Notification');

// @desc    Create a deal
// @route   POST /api/deals
exports.createDeal = async (req, res, next) => {
  try {
    if (req.user.role !== 'investor') {
      return res.status(403).json({ success: false, message: 'Only investors can create deals' });
    }

    const deal = await Deal.create({ ...req.body, investorId: req.user._id });

    await Notification.create({
      userId: req.body.entrepreneurId,
      type: 'deal_updated',
      title: 'New Deal Proposal',
      message: `${req.user.name} has added a deal for your startup`,
      link: `/deals`,
      fromUser: req.user._id,
    });

    await deal.populate('investorId', 'name avatarUrl');
    await deal.populate('entrepreneurId', 'name avatarUrl startupName');

    res.status(201).json({ success: true, deal });
  } catch (err) {
    next(err);
  }
};

// @desc    Get deals for current user
// @route   GET /api/deals
exports.getDeals = async (req, res, next) => {
  try {
    const filter =
      req.user.role === 'investor'
        ? { investorId: req.user._id }
        : { entrepreneurId: req.user._id };

    if (req.query.status) filter.status = req.query.status;

    const deals = await Deal.find(filter)
      .sort({ lastActivity: -1 })
      .populate('investorId', 'name avatarUrl')
      .populate('entrepreneurId', 'name avatarUrl startupName');

    // Summary stats
    const totalValue = deals.reduce((acc, d) => {
      const num = parseFloat((d.amountValue || 0).toString());
      return acc + num;
    }, 0);

    res.status(200).json({
      success: true,
      count: deals.length,
      stats: {
        totalDeals: deals.length,
        activeDeals: deals.filter((d) => !['Closed', 'Passed'].includes(d.status)).length,
        closedDeals: deals.filter((d) => d.status === 'Closed').length,
      },
      deals,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single deal
// @route   GET /api/deals/:id
exports.getDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate('investorId', 'name avatarUrl')
      .populate('entrepreneurId', 'name avatarUrl startupName');

    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });

    res.status(200).json({ success: true, deal });
  } catch (err) {
    next(err);
  }
};

// @desc    Update deal
// @route   PUT /api/deals/:id
exports.updateDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });
    if (String(deal.investorId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    req.body.lastActivity = new Date();
    const updated = await Deal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('investorId', 'name avatarUrl')
      .populate('entrepreneurId', 'name avatarUrl startupName');

    res.status(200).json({ success: true, deal: updated });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete deal
// @route   DELETE /api/deals/:id
exports.deleteDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });
    if (String(deal.investorId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }
    await deal.deleteOne();
    res.status(200).json({ success: true, message: 'Deal deleted' });
  } catch (err) {
    next(err);
  }
};
