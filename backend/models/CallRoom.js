const mongoose = require('mongoose');

const CallRoomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true }, // UUID
    initiatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    callType: {
      type: String,
      enum: ['audio', 'video'],
      required: true,
    },
    status: {
      type: String,
      enum: ['ringing', 'active', 'ended', 'missed', 'declined'],
      default: 'ringing',
    },
    startTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number, default: 0 }, // in seconds
    initiatorLeftAt: { type: Date }, // when initiator left
    participantLeftAt: { type: Date }, // when participant left
  },
  { timestamps: true }
);

// Index for quick queries
CallRoomSchema.index({ roomId: 1 });
CallRoomSchema.index({ initiatorId: 1, participantId: 1 });
CallRoomSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CallRoom', CallRoomSchema);
