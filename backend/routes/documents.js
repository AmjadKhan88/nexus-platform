const express = require('express');
const router = express.Router();
const {
  uploadDocument, getDocuments, getDocument,
  shareDocument, signDocument, deleteDocument, starDocument,
} = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, upload.single('file'), uploadDocument);
router.get('/', protect, getDocuments);
router.get('/:id', protect, getDocument);
router.put('/:id/share', protect, shareDocument);
router.put('/:id/sign', protect, signDocument);
router.put('/:id/star', protect, starDocument);
router.delete('/:id', protect, deleteDocument);

module.exports = router;
