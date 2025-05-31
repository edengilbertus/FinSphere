const mongoose = require('mongoose');

const savingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  goalName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Goal name cannot exceed 100 characters']
  },
  targetAmount: {
    type: Number,
    required: true,
    min: [1, 'Target amount must be at least $1']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative']
  },
  targetDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Target date must be in the future'
    }
  },
  category: {
    type: String,
    enum: [
      'emergency_fund',
      'vacation',
      'home_purchase',
      'car_purchase',
      'education',
      'retirement',
      'wedding',
      'business',
      'medical',
      'other'
    ],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  autoDeposit: {
    enabled: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      min: [1, 'Auto deposit amount must be at least $1']
    },
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'monthly'
    },
    nextDeposit: Date
  },
  deposits: [{
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Deposit must be at least $0.01']
    },
    note: {
      type: String,
      maxlength: [200, 'Note cannot exceed 200 characters']
    },
    depositedAt: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['manual', 'auto', 'bonus'],
      default: 'manual'
    }
  }],
  withdrawals: [{
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Withdrawal must be at least $0.01']
    },
    reason: {
      type: String,
      required: true,
      maxlength: [200, 'Reason cannot exceed 200 characters']
    },
    withdrawnAt: {
      type: Date,
      default: Date.now
    }
  }],
  privacy: {
    type: String,
    enum: ['private', 'friends', 'public'],
    default: 'private'
  },
  milestones: [{
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    achievedAt: Date,
    celebration: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for progress percentage
savingsSchema.virtual('progressPercentage').get(function() {
  if (this.targetAmount <= 0) return 0;
  return Math.min(Math.round((this.currentAmount / this.targetAmount) * 100), 100);
});

// Virtual for remaining amount
savingsSchema.virtual('remainingAmount').get(function() {
  return Math.max(this.targetAmount - this.currentAmount, 0);
});

// Virtual for total deposits
savingsSchema.virtual('totalDeposits').get(function() {
  return this.deposits.reduce((sum, deposit) => sum + deposit.amount, 0);
});

// Virtual for total withdrawals
savingsSchema.virtual('totalWithdrawals').get(function() {
  return this.withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
});

// Virtual for days remaining
savingsSchema.virtual('daysRemaining').get(function() {
  if (!this.targetDate) return null;
  const now = new Date();
  const diffTime = this.targetDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for suggested monthly savings
savingsSchema.virtual('suggestedMonthlySavings').get(function() {
  if (!this.targetDate) return null;
  const remainingAmount = this.remainingAmount;
  const daysRemaining = this.daysRemaining;
  
  if (daysRemaining <= 0) return remainingAmount;
  
  const monthsRemaining = daysRemaining / 30.44; // Average days per month
  return Math.ceil(remainingAmount / monthsRemaining);
});

// Indexes for better query performance
savingsSchema.index({ user: 1, status: 1 });
savingsSchema.index({ user: 1, category: 1 });
savingsSchema.index({ targetDate: 1 });
savingsSchema.index({ 'autoDeposit.enabled': 1, 'autoDeposit.nextDeposit': 1 });

// Instance method to add deposit
savingsSchema.methods.addDeposit = function(amount, note = '', method = 'manual') {
  this.deposits.push({
    amount,
    note,
    method,
    depositedAt: new Date()
  });
  
  this.currentAmount += amount;
  
  // Check if goal is completed
  if (this.currentAmount >= this.targetAmount && this.status === 'active') {
    this.status = 'completed';
  }
  
  // Add milestone if reached
  const progressPercentage = this.progressPercentage;
  const milestoneThresholds = [25, 50, 75, 100];
  
  for (const threshold of milestoneThresholds) {
    const alreadyAchieved = this.milestones.some(m => m.percentage === threshold);
    if (!alreadyAchieved && progressPercentage >= threshold) {
      this.milestones.push({
        percentage: threshold,
        achievedAt: new Date(),
        celebration: `Reached ${threshold}% of your savings goal! 🎉`
      });
    }
  }
  
  return this.save();
};

// Instance method to add withdrawal
savingsSchema.methods.addWithdrawal = function(amount, reason) {
  if (amount > this.currentAmount) {
    throw new Error('Withdrawal amount cannot exceed current savings');
  }
  
  this.withdrawals.push({
    amount,
    reason,
    withdrawnAt: new Date()
  });
  
  this.currentAmount -= amount;
  
  // Update status if needed
  if (this.status === 'completed' && this.currentAmount < this.targetAmount) {
    this.status = 'active';
  }
  
  return this.save();
};

// Static method to get user's savings summary
savingsSchema.statics.getUserSummary = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), isActive: true } },
    {
      $group: {
        _id: '$user',
        totalGoals: { $sum: 1 },
        activeGoals: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completedGoals: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalSaved: { $sum: '$currentAmount' },
        totalTargetAmount: { $sum: '$targetAmount' }
      }
    }
  ]);
};

// Pre-save middleware to recalculate current amount
savingsSchema.pre('save', function(next) {
  if (this.isModified('deposits') || this.isModified('withdrawals')) {
    const totalDeposits = this.deposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    const totalWithdrawals = this.withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
    this.currentAmount = totalDeposits - totalWithdrawals;
  }
  next();
});

const Savings = mongoose.model('Savings', savingsSchema);

module.exports = Savings;
