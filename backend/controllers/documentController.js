const path = require('path');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper: human-readable file size
const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

// @desc    Upload document
// @route   POST /api/documents
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const ext = path.extname(req.file.originalname).toUpperCase().replace('.', '');
    const typeMap = {
      PDF: 'PDF', DOCX: 'Document', DOC: 'Document',
      XLSX: 'Spreadsheet', XLS: 'Spreadsheet', PNG: 'Image', JPG: 'Image', SVG: 'Image',
    };

    const document = await Document.create({
      name: req.body.name || req.file.originalname,
      originalName: req.file.originalname,
      type: typeMap[ext] || ext,
      size: formatSize(req.file.size),
      mimeType: req.file.mimetype,
      url: `/uploads/${req.file.filename}`,
      ownerId: req.user._id,
    });

    res.status(201).json({ success: true, document });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all documents for current user
// @route   GET /api/documents
exports.getDocuments = async (req, res, next) => {
  try {
    const { filter } = req.query; // recent | shared | starred | trash
    const query = { ownerId: req.user._id };

    if (filter === 'shared') query.shared = true;
    else if (filter === 'starred') query.starred = true;
    else if (filter === 'trash') query.deleted = true;
    else query.deleted = false; // default: active docs

    const documents = await Document.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: documents.length, documents });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single document
// @route   GET /api/documents/:id
exports.getDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id).populate('ownerId', 'name');
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    const isOwner = String(doc.ownerId._id) === String(req.user._id);
    const isSharedWith = doc.sharedWith.map(String).includes(String(req.user._id));
    if (!isOwner && !isSharedWith) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, document: doc });
  } catch (err) {
    next(err);
  }
};

// @desc    Share document with another user
// @route   PUT /api/documents/:id/share
exports.shareDocument = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    if (String(doc.ownerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    if (!doc.sharedWith.map(String).includes(String(userId))) {
      doc.sharedWith.push(userId);
      doc.shared = true;
      await doc.save();
    }

    await Notification.create({
      userId,
      type: 'document_shared',
      title: 'Document Shared',
      message: `${req.user.name} shared "${doc.name}" with you`,
      link: `/documents`,
      fromUser: req.user._id,
    });

    res.status(200).json({ success: true, document: doc });
  } catch (err) {
    next(err);
  }
};

// @desc    Store e-signature on document
// @route   PUT /api/documents/:id/sign
exports.signDocument = async (req, res, next) => {
  try {
    const { signatureUrl } = req.body; // base64 image from frontend signature pad
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    doc.signatureUrl = signatureUrl;
    doc.signedAt = new Date();
    doc.signedBy = req.user._id;
    doc.status = 'signed';
    await doc.save();

    res.status(200).json({ success: true, document: doc });
  } catch (err) {
    next(err);
  }
};

// @desc    Soft delete document
// @route   DELETE /api/documents/:id
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    if (String(doc.ownerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    doc.deleted = true;
    await doc.save();
    res.status(200).json({ success: true, message: 'Document moved to trash' });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle starred
// @route   PUT /api/documents/:id/star
exports.starDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    if (String(doc.ownerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    doc.starred = !doc.starred;
    await doc.save();
    res.status(200).json({ success: true, document: doc });
  } catch (err) {
    next(err);
  }
};
