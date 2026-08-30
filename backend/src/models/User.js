import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const identityProofSchema = new mongoose.Schema({
  proofType: {
    type: String,
    enum: ['Aadhaar', 'Passport', 'Driving License', 'Voter ID', 'PAN', 'Other'],
    required: true,
  },
  proofNumber: { type: String, trim: true },
  documentUrl: { type: String },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  rejectionReason: { type: String },
}, { _id: true });

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['super_admin', 'block_admin', 'receptionist', 'resident', 'security'],
    default: 'resident',
  },
  registrationId: { type: String, sparse: true, trim: true, index: true }, // Format: REG-YYYY-XXXXXX
  employeeId: { type: String, sparse: true, trim: true }, // Format: BA-XXXX or REC-XXXX
  assignedBlock: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending_verification', 'blocked'],
    default: 'active',
  },
  joiningDate: { type: Date, default: Date.now },
  dob: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  emergencyContact: {
    name: { type: String },
    mobile: { type: String },
    relationship: { type: String },
  },
  address: {
    houseNo: { type: String },
    street: { type: String },
    landmark: { type: String },
    villageCity: { type: String },
    mandal: { type: String },
    district: { type: String },
    state: { type: String },
    country: { type: String, default: 'India' },
    pincode: { type: String },
  },
  identityProofs: [identityProofSchema],
  isDocumentVerified: { type: Boolean, default: false },

  // Mandatory Login 2FA OTP Fields (Section 1, 2, 3, 4, 5)
  loginOtpHash: { type: String },
  loginOtpExpiresAt: { type: Date },
  loginOtpAttempts: { type: Number, default: 0 },
  loginOtpCooldownUntil: { type: Date },

  // Email Verification / Account Activation OTP Fields (Section 6, 21)
  isEmailVerified: { type: Boolean, default: false },
  emailVerifiedAt: { type: Date },
  emailOtpHash: { type: String },
  emailOtpExpiresAt: { type: Date },
  emailOtpAttempts: { type: Number, default: 0 },
  emailOtpCooldownUntil: { type: Date },

  // Changing Email Later OTP Fields
  pendingEmail: { type: String, lowercase: true, trim: true },
  pendingEmailOtpHash: { type: String },
  pendingEmailOtpExpiresAt: { type: Date },
  pendingEmailOtpAttempts: { type: Number, default: 0 },

  // Password Setup & Reset (Email OTP)
  setupPasswordToken: { type: String },
  setupPasswordExpiresAt: { type: Date },
  resetPasswordOtpHash: { type: String },
  resetPasswordOtpExpiresAt: { type: Date },
  resetPasswordOtpAttempts: { type: Number, default: 0 },
  resetPasswordOtpCooldownUntil: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  activationToken: { type: String },
  activationExpires: { type: Date },

  avatar: { type: String },
  mustChangePassword: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', userSchema);
