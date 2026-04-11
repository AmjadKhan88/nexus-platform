const mongoose = require('mongoose');

const DealSchema = new mongoose.Schema(
  {
    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    entrepreneurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: { type: String, required: true },      // e.g. "$1.5M"
    amountValue: { type: Number },                  // numeric value for queries
    equity: { type: String, default: '' },          // e.g. "15%"
    stage: {
      type: String,
      enum: ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Other'],
      default: 'Seed',
    },
    status: {
      type: String,
      enum: ['Due Diligence', 'Term Sheet', 'Negotiation', 'Closed', 'Passed'],
      default: 'Due Diligence',
    },
    notes: { type: String, default: '' },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deal', DealSchema);
