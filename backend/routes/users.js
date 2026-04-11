const express = require('express');
const router = express.Router();
const {
  getUsers, getEntrepreneurs, getInvestors,
  getUserById, updateProfile, updateAvatar,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getUsers);
router.get('/entrepreneurs', protect, getEntrepreneurs);
router.get('/investors', protect, getInvestors);
router.get('/:id', protect, getUserById);
router.put('/profile', protect, updateProfile);
router.put('/avatar', protect, upload.single('avatar'), updateAvatar);

module.exports = router;
