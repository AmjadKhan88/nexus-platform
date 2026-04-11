const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['entrepreneur', 'investor'],
      required: true,
    },
    avatarUrl: {
      type: String,
      default: function () {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random`;
      },
    },
    bio: { type: String, default: '', maxlength: 500 },
    isOnline: { type: Boolean, default: false },

    // ── Entrepreneur-specific fields ───────────────────────────────────────
    startupName: { type: String, default: '' },
    pitchSummary: { type: String, default: '' },
    fundingNeeded: { type: String, default: '' },
    industry: { type: String, default: '' },
    location: { type: String, default: '' },
    foundedYear: { type: Number },
    teamSize: { type: Number, default: 1 },

    // ── Investor-specific fields ────────────────────────────────────────────
    investmentInterests: { type: [String], default: [] },
    investmentStage: { type: [String], default: [] },
    portfolioCompanies: { type: [String], default: [] },
    totalInvestments: { type: Number, default: 0 },
    minimumInvestment: { type: String, default: '' },
    maximumInvestment: { type: String, default: '' },

    // ── Security ────────────────────────────────────────────────────────────
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    twoFAEnabled: { type: Boolean, default: false },
    twoFACode: String,
    twoFACodeExpire: Date,
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
