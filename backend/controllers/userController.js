const User = require('../models/User');

// @desc    Get all users (with optional role filter)
// @route   GET /api/users
exports.getUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;

    const users = await User.find(filter).select('-password');
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all entrepreneurs
// @route   GET /api/users/entrepreneurs
exports.getEntrepreneurs = async (req, res, next) => {
  try {
    const { industry, location, search } = req.query;
    const filter = { role: 'entrepreneur' };

    if (industry) filter.industry = { $regex: industry, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { startupName: { $regex: search, $options: 'i' } },
        { pitchSummary: { $regex: search, $options: 'i' } },
      ];
    }

    const entrepreneurs = await User.find(filter).select('-password');
    res.status(200).json({ success: true, count: entrepreneurs.length, entrepreneurs });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all investors
// @route   GET /api/users/investors
exports.getInvestors = async (req, res, next) => {
  try {
    const { investmentStage, search } = req.query;
    const filter = { role: 'investor' };

    if (investmentStage) filter.investmentStage = { $in: [investmentStage] };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
      ];
    }

    const investors = await User.find(filter).select('-password');
    res.status(200).json({ success: true, count: investors.length, investors });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc    Update current user's profile
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    // Fields that cannot be changed via this endpoint
    const disallowed = ['password', 'email', 'role', 'resetPasswordToken'];
    disallowed.forEach((f) => delete req.body[f]);

    const user = await User.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc    Update avatar
// @route   PUT /api/users/avatar
exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl },
      { new: true }
    ).select('-password');

    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
