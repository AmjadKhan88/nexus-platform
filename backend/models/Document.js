const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    originalName: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: String, required: true },
    mimeType: { type: String },
    url: { type: String, required: true },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shared: { type: Boolean, default: false },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // e-signature
    signatureUrl: { type: String, default: null },
    signedAt: { type: Date, default: null },
    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['draft', 'pending_signature', 'signed', 'archived'],
      default: 'draft',
    },
    version: { type: Number, default: 1 },
    starred: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

DocumentSchema.index({ ownerId: 1 });

module.exports = mongoose.model('Document', DocumentSchema);
