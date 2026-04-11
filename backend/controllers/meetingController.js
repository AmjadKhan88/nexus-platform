const Meeting = require('../models/Meeting');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Schedule a meeting
// @route   POST /api/meetings
exports.scheduleMeeting = async (req, res, next) => {
  try {
    const { title, attendees, startTime, endTime, description, location } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    // Conflict detection: organiser cannot have overlapping meetings
    const conflict = await Meeting.findOne({
      organizerId: req.user._id,
      status: { $in: ['pending', 'accepted'] },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } },
      ],
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: 'You already have a meeting during that time slot',
      });
    }

    const meeting = await Meeting.create({
      title,
      organizerId: req.user._id,
      attendees,
      startTime: start,
      endTime: end,
      description,
      location,
    });

    // Notify all attendees
    if (attendees && attendees.length) {
      await Promise.all(
        attendees.map((attendeeId) =>
          Notification.create({
            userId: attendeeId,
            type: 'meeting_scheduled',
            title: 'New Meeting Invitation',
            message: `${req.user.name} has scheduled a meeting: "${title}"`,
            link: `/meetings`,
            fromUser: req.user._id,
          })
        )
      );
    }

    await meeting.populate('organizerId', 'name avatarUrl');
    await meeting.populate('attendees', 'name avatarUrl');

    res.status(201).json({ success: true, meeting });
  } catch (err) {
    next(err);
  }
};

// @desc    Get meetings for current user
// @route   GET /api/meetings
exports.getMeetings = async (req, res, next) => {
  try {
    const meetings = await Meeting.find({
      $or: [{ organizerId: req.user._id }, { attendees: req.user._id }],
    })
      .sort({ startTime: 1 })
      .populate('organizerId', 'name avatarUrl')
      .populate('attendees', 'name avatarUrl');

    res.status(200).json({ success: true, count: meetings.length, meetings });
  } catch (err) {
    next(err);
  }
};

// @desc    Update meeting status (accept / reject / cancel)
// @route   PUT /api/meetings/:id
exports.updateMeeting = async (req, res, next) => {
  try {
    const { status } = req.body;
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    const isOrganizer = String(meeting.organizerId) === String(req.user._id);
    const isAttendee = meeting.attendees.map(String).includes(String(req.user._id));

    if (!isOrganizer && !isAttendee) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    meeting.status = status;
    await meeting.save();

    // Notify organiser if attendee responds
    if (!isOrganizer) {
      await Notification.create({
        userId: meeting.organizerId,
        type: status === 'accepted' ? 'meeting_accepted' : 'meeting_rejected',
        title: `Meeting ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `${req.user.name} has ${status} your meeting invitation`,
        link: `/meetings`,
        fromUser: req.user._id,
      });
    }

    res.status(200).json({ success: true, meeting });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete meeting
// @route   DELETE /api/meetings/:id
exports.deleteMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    if (String(meeting.organizerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the organiser can delete' });
    }
    await meeting.deleteOne();
    res.status(200).json({ success: true, message: 'Meeting deleted' });
  } catch (err) {
    next(err);
  }
};
