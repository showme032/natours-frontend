const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    minLength: 8,
    // So its not returned to the user with data
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm the password'],
    minLength: 8,
    validate: {
      // Will work only on create & save, and not on ie. update
      validator: function(val) {
        return val === this.password;
      },
      message: 'Password confirmation must match with password',
    },
  },
  passwordChanged: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Hook for encrypting pass before saving the doc
// Pass hashing is cpu intensive, we want it async
userSchema.pre('save', async function(next) {
  // this refers to the current document = user, run only if pass modified
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChanged = Date.now() - 1000;
  next();
});

// Compare stored with input password
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Check for password/JWT authenticity
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChanged) {
    // parse as int after converting from ms to s, with a base of 10
    const changedTimeStamp = parseInt(
      this.passwordChanged.getTime() / 1000,
      10,
    );

    return JWTTimestamp < changedTimeStamp;
  }

  return false;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// For all querries starting with 'find'
userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
