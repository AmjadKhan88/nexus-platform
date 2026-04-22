const { v4: uuidv4 } = require('uuid');
const CallRoom = require('../models/CallRoom');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get call history for current user
// @route   GET /api/calls/history
exports.getCallHistory = async (req, res, next) => {
  try {
    const { limit = 20, skip = 0, type } = req.query;
    const query = {
      $or: [{ initiatorId: req.user._id }, { participantId: req.user._id }],
    };

    if (type && ['audio', 'video'].includes(type)) {
      query.callType = type;
    }

    const calls = await CallRoom.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('initiatorId', 'name avatarUrl')
      .populate('participantId', 'name avatarUrl');

    const total = await CallRoom.countDocuments(query);

    res.status(200).json({
      success: true,
      count: calls.length,
      total,
      calls,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get call details
// @route   GET /api/calls/:roomId
exports.getCallDetails = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const call = await CallRoom.findOne({ roomId })
      .populate('initiatorId', 'name avatarUrl email')
      .populate('participantId', 'name avatarUrl email');

    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    res.status(200).json({ success: true, call });
  } catch (err) {
    next(err);
  }
};

// @desc    Initiate a call (REST endpoint)
// @route   POST /api/calls/initiate
exports.initiateCall = async (req, res, next) => {
  try {
    const { participantId, callType } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required',
      });
    }

    if (!['audio', 'video'].includes(callType)) {
      return res.status(400).json({
        success: false,
        message: 'Call type must be audio or video',
      });
    }

    // Check if participant exists and is online
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found',
      });
    }

    if (!participant.isOnline) {
      return res.status(400).json({
        success: false,
        message: 'Participant is offline',
      });
    }

    // Create a new call room
    const roomId = uuidv4();
    const callRoom = await CallRoom.create({
      roomId,
      initiatorId: req.user._id,
      participantId,
      callType,
      status: 'ringing',
    });

    // Create notification for participant
    await Notification.create({
      userId: participantId,
      type: 'call_incoming',
      message: `${req.user.name} is calling you`,
      link: `/call/${roomId}`,
      metadata: {
        callType,
        initiatorId: req.user._id,
        initiatorName: req.user.name,
        initiatorAvatar: req.user.avatarUrl,
        roomId,
      },
    });

    res.status(201).json({
      success: true,
      roomId,
      callRoom,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update call status
// @route   PUT /api/calls/:roomId/status
exports.updateCallStatus = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { status } = req.body;

    const validStatuses = ['ringing', 'active', 'ended', 'missed', 'declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const callRoom = await CallRoom.findOne({ roomId });
    if (!callRoom) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    // Update status
    callRoom.status = status;

    if (status === 'active' && !callRoom.startTime) {
      callRoom.startTime = new Date();
    }

    if (status === 'ended' && !callRoom.endTime) {
      callRoom.endTime = new Date();
      if (callRoom.startTime) {
        callRoom.duration = Math.floor(
          (callRoom.endTime - callRoom.startTime) / 1000
        );
      }
    }

    await callRoom.save();

    res.status(200).json({
      success: true,
      callRoom,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Record when a user leaves the call
// @route   PUT /api/calls/:roomId/leave
exports.recordCallLeave = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const callRoom = await CallRoom.findOne({ roomId });
    if (!callRoom) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    const userId = req.user._id;

    if (String(callRoom.initiatorId) === String(userId)) {
      callRoom.initiatorLeftAt = new Date();
    } else if (String(callRoom.participantId) === String(userId)) {
      callRoom.participantLeftAt = new Date();
    }

    // If both users have left, mark call as ended
    if (
      callRoom.initiatorLeftAt &&
      callRoom.participantLeftAt &&
      callRoom.status !== 'ended'
    ) {
      callRoom.status = 'ended';
      callRoom.endTime = new Date();
      if (callRoom.startTime) {
        callRoom.duration = Math.floor(
          (callRoom.endTime - callRoom.startTime) / 1000
        );
      }
    }

    await callRoom.save();

    res.status(200).json({
      success: true,
      callRoom,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete call history
// @route   DELETE /api/calls/:roomId
exports.deleteCall = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const callRoom = await CallRoom.findOne({ roomId });
    if (!callRoom) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    // Check if user is part of this call
    if (
      String(callRoom.initiatorId) !== String(req.user._id) &&
      String(callRoom.participantId) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this call',
      });
    }

    await CallRoom.findOneAndDelete({ roomId });

    res.status(200).json({
      success: true,
      message: 'Call record deleted',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get active calls for current user
// @route   GET /api/calls/active
exports.getActiveCalls = async (req, res, next) => {
  try {
    const activeCalls = await CallRoom.find({
      $or: [{ initiatorId: req.user._id }, { participantId: req.user._id }],
      status: { $in: ['ringing', 'active'] },
    })
      .populate('initiatorId', 'name avatarUrl')
      .populate('participantId', 'name avatarUrl');

    res.status(200).json({
      success: true,
      count: activeCalls.length,
      calls: activeCalls,
    });
  } catch (err) {
    next(err);
  }
};
