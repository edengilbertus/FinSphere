const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  authId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'First name cannot be more than 50 characters']
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Last name cannot be more than 50 characters']
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot be more than 20 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    bio: {
      type: String,
      default: '',
      maxlength: [500, 'Bio cannot be more than 500 characters']
    },
    phoneNumber: {
      type: String,
      sparse: true,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    dateOfBirth: {
      type: Date
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'US'
      }
    },
    interests: [{
      type: String,
      trim: true,
      maxlength: [50, 'Each interest cannot be more than 50 characters']
    }],
    profilePictureUrl: {
      type: String,
      trim: true
    },
    coverPhotoUrl: {
      type: String,
      trim: true
    },
    uploads: [{
      type: {
        type: String,
        enum: ['avatar', 'cover', 'post', 'kyc', 'message'],
        required: true
      },
      url: String,
      filename: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  kyc: {
    status: {
      type: String,
      enum: ['not_started', 'pending', 'approved', 'rejected', 'requires_resubmission'],
      default: 'not_started'
    },
    documents: {
      identity: {
        filename: String,
        originalName: String,
        uploadedAt: Date,
        url: String, // Added to store GCS URL
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending'
        },
        rejectionReason: String,
        size: Number,
        mimeType: String
      },
      address: {
        filename: String,
        originalName: String,
        uploadedAt: Date,
        url: String, // Added to store GCS URL
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending'
        },
        rejectionReason: String,
        size: Number,
        mimeType: String
      },
      income: {
        filename: String,
        originalName: String,
        uploadedAt: Date,
        url: String, // Added to store GCS URL
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending'
        },
        rejectionReason: String,
        size: Number,
        mimeType: String
      }
    },
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    notes: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('profile.fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Index for better query performance
userSchema.index({ email: 1, authId: 1 });
userSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1 });
userSchema.index({ 'profile.interests': 1 });

// Pre-save middleware to update lastLoginAt
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// Static method to find user by authId
userSchema.statics.findByAuthId = function(authId) {
  return this.findOne({ authId, isActive: true });
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
