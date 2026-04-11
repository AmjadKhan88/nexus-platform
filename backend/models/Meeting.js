const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    description: { type: String, default: '' },
    location: { type: String, default: 'Virtual' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    meetingLink: { type: String, default: '' },
  },
  { timestamps: true }
);

// Prevent double-booking: no two meetings for same organizer overlap
MeetingSchema.index({ organizerId: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('Meeting', MeetingSchema);
