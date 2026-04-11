const CollaborationRequest = require('../models/CollaborationRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Send collaboration request (investor → entrepreneur)
// @route   POST /api/collaborations
exports.sendRequest = async (req, res, next) => {
  try {
    const { entrepreneurId, message } = req.body;

    if (req.user.role !== 'investor') {
      return res.status(403).json({ success: false, message: 'Only investors can send requests' });
    }

    const entrepreneur = await User.findById(entrepreneurId);
    if (!entrepreneur || entrepreneur.role !== 'entrepreneur') {
      return res.status(404).json({ success: false, message: 'Entrepreneur not found' });
    }

    // Prevent duplicate pending request
    const existing = await CollaborationRequest.findOne({
      investorId: req.user._id,
      entrepreneurId,
      status: 'pending',
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A pending request already exists' });
    }

    const request = await CollaborationRequest.create({
      investorId: req.user._id,
      entrepreneurId,
      message,
    });

    await Notification.create({
      userId: entrepreneurId,
      type: 'collaboration_request',
      title: 'New Collaboration Request',
      message: `${req.user.name} wants to collaborate with you`,
      link: `/notifications`,
      fromUser: req.user._id,
    });

    await request.populate('investorId', 'name avatarUrl');
    await request.populate('entrepreneurId', 'name avatarUrl startupName');

    res.status(201).json({ success: true, request });
  } catch (err) {
    next(err);
  }
};

// @desc    Get requests for current user (both roles)
// @route   GET /api/collaborations
exports.getRequests = async (req, res, next) => {
  try {
    const filter =
      req.user.role === 'entrepreneur'
        ? { entrepreneurId: req.user._id }
        : { investorId: req.user._id };

    const requests = await CollaborationRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('investorId', 'name avatarUrl')
      .populate('entrepreneurId', 'name avatarUrl startupName');

    res.status(200).json({ success: true, count: requests.length, requests });
  } catch (err) {
    next(err);
  }
};

// @desc    Update request status (entrepreneur accepts/rejects)
// @route   PUT /api/collaborations/:id
exports.updateRequest = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be accepted or rejected' });
    }

    const request = await CollaborationRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (String(request.entrepreneurId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    request.status = status;
    await request.save();

    // Notify the investor
    await Notification.create({
      userId: request.investorId,
      type: status === 'accepted' ? 'collaboration_accepted' : 'collaboration_rejected',
      title: `Collaboration Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `${req.user.name} has ${status} your collaboration request`,
      link: `/notifications`,
      fromUser: req.user._id,
    });

    await request.populate('investorId', 'name avatarUrl');
    await request.populate('entrepreneurId', 'name avatarUrl startupName');

    res.status(200).json({ success: true, request });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a request
// @route   DELETE /api/collaborations/:id
exports.deleteRequest = async (req, res, next) => {
  try {
    const request = await CollaborationRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (String(request.investorId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    await request.deleteOne();
    res.status(200).json({ success: true, message: 'Request deleted' });
  } catch (err) {
    next(err);
  }
};
