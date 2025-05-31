const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  borrower: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  lender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  }, // Optional at first - when loan is requested
  amount: { 
    type: Number, 
    required: true,
    min: [1, 'Loan amount must be at least $1'],
    max: [1000000, 'Loan amount cannot exceed $1,000,000']
  },
  interestRate: { 
    type: Number, 
    default: 0,
    min: [0, 'Interest rate cannot be negative'],
    max: [100, 'Interest rate cannot exceed 100%']
  },
  status: {
    type: String,
    enum: ['requested', 'funded', 'repaid', 'defaulted', 'cancelled'],
    default: 'requested',
    index: true
  },
  termMonths: {
    type: Number,
    min: [1, 'Loan term must be at least 1 month'],
    max: [360, 'Loan term cannot exceed 30 years']
  },
  purpose: {
    type: String,
    trim: true,
    maxlength: [500, 'Purpose cannot exceed 500 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  paymentSchedule: {
    type: String,
    enum: ['monthly', 'quarterly', 'annually', 'lump-sum'],
    default: 'monthly'
  },
  fundedAt: Date,
  dueDate: Date,
  repaidAt: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for monthly payment calculation (simple interest)
loanSchema.virtual('monthlyPayment').get(function() {
  if (!this.amount || !this.termMonths || this.termMonths === 0) return 0;
  
  const monthlyInterestRate = this.interestRate / 100 / 12;
  if (monthlyInterestRate === 0) {
    return this.amount / this.termMonths;
  }
  
  const monthlyPayment = this.amount * 
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, this.termMonths)) /
    (Math.pow(1 + monthlyInterestRate, this.termMonths) - 1);
  
  return Math.round(monthlyPayment * 100) / 100;
});

// Virtual for total interest
loanSchema.virtual('totalInterest').get(function() {
  if (!this.monthlyPayment || !this.termMonths) return 0;
  return Math.round((this.monthlyPayment * this.termMonths - this.amount) * 100) / 100;
});

// Indexes for better query performance
loanSchema.index({ borrower: 1, status: 1, createdAt: -1 });
loanSchema.index({ lender: 1, status: 1, createdAt: -1 });
loanSchema.index({ status: 1, amount: 1 });

// Static method to get available loan requests
loanSchema.statics.getAvailableLoans = function(limit = 20, skip = 0) {
  return this.find({ status: 'requested', isActive: true })
    .populate('borrower', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get user's loans
loanSchema.statics.getUserLoans = function(userId, type = 'all') {
  let query = { isActive: true };
  
  switch (type) {
    case 'borrowed':
      query.borrower = userId;
      break;
    case 'lent':
      query.lender = userId;
      break;
    default:
      query.$or = [{ borrower: userId }, { lender: userId }];
  }
  
  return this.find(query)
    .populate('borrower', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl')
    .populate('lender', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl')
    .sort({ createdAt: -1 });
};

// Instance method to fund a loan
loanSchema.methods.fundLoan = function(lenderId) {
  if (this.status !== 'requested') {
    throw new Error('Loan is not available for funding');
  }
  
  this.lender = lenderId;
  this.status = 'funded';
  this.fundedAt = new Date();
  
  // Calculate due date
  if (this.termMonths) {
    this.dueDate = new Date();
    this.dueDate.setMonth(this.dueDate.getMonth() + this.termMonths);
  }
  
  return this.save();
};

// Instance method to repay a loan
loanSchema.methods.repayLoan = function() {
  if (this.status !== 'funded') {
    throw new Error('Loan is not in funded status');
  }
  
  this.status = 'repaid';
  this.repaidAt = new Date();
  return this.save();
};

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;
