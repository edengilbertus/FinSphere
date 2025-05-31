const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// @desc    Request a loan
// @route   POST /api/v1/loans
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { amount, interestRate, termMonths, purpose, description, paymentSchedule } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid loan amount is required'
      });
    }

    if (amount > 1000000) {
      return res.status(400).json({
        success: false,
        message: 'Loan amount cannot exceed $1,000,000'
      });
    }

    if (!purpose || purpose.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Loan purpose is required'
      });
    }

    const loan = new Loan({
      borrower: req.user._id,
      amount,
      interestRate: interestRate || 0,
      termMonths,
      purpose: purpose.trim(),
      description: description?.trim(),
      paymentSchedule: paymentSchedule || 'monthly'
    });

    await loan.save();
    
    // Populate borrower details
    await loan.populate('borrower', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl');

    res.status(201).json({
      success: true,
      message: 'Loan request created successfully',
      data: { loan }
    });

  } catch (error) {
    console.error('Create loan error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating loan request'
    });
  }
});

// @desc    Get all available loan requests
// @route   GET /api/v1/loans
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const loans = await Loan.getAvailableLoans(limit, skip);
    
    const total = await Loan.countDocuments({ status: 'requested', isActive: true });

    res.json({
      success: true,
      data: {
        loans,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalLoans: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching loans'
    });
  }
});

// @desc    Get user's loans (borrowed and lent)
// @route   GET /api/v1/loans/me
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const type = req.query.type || 'all'; // 'all', 'borrowed', 'lent'
    
    const loans = await Loan.getUserLoans(req.user._id, type);

    // Separate into categories for easier frontend handling
    const borrowedLoans = loans.filter(loan => 
      loan.borrower._id.toString() === req.user._id.toString()
    );
    
    const lentLoans = loans.filter(loan => 
      loan.lender && loan.lender._id.toString() === req.user._id.toString()
    );

    res.json({
      success: true,
      data: {
        borrowed: borrowedLoans,
        lent: lentLoans,
        total: loans.length
      }
    });

  } catch (error) {
    console.error('Get user loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user loans'
    });
  }
});

// @desc    Get specific loan details
// @route   GET /api/v1/loans/:id
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('borrower', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl')
      .populate('lender', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl');

    if (!loan || !loan.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    res.json({
      success: true,
      data: { loan }
    });

  } catch (error) {
    console.error('Get loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching loan'
    });
  }
});

// @desc    Fund a loan (become the lender)
// @route   POST /api/v1/loans/:id/fund
// @access  Private
router.post('/:id/fund', authenticateToken, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan || !loan.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (loan.borrower.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot fund your own loan request'
      });
    }

    if (loan.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: 'Loan is not available for funding'
      });
    }

    await loan.fundLoan(req.user._id);
    
    // Populate for response
    await loan.populate('borrower', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl');
    await loan.populate('lender', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl');

    res.json({
      success: true,
      message: 'Loan funded successfully',
      data: { loan }
    });

  } catch (error) {
    console.error('Fund loan error:', error);
    
    if (error.message === 'Loan is not available for funding') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while funding loan'
    });
  }
});

// @desc    Repay a loan
// @route   POST /api/v1/loans/:id/repay
// @access  Private
router.post('/:id/repay', authenticateToken, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan || !loan.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (loan.borrower.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only repay your own loans'
      });
    }

    if (loan.status !== 'funded') {
      return res.status(400).json({
        success: false,
        message: 'Loan is not in funded status'
      });
    }

    await loan.repayLoan();
    
    // Populate for response
    await loan.populate('borrower', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl');
    await loan.populate('lender', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl');

    res.json({
      success: true,
      message: 'Loan repaid successfully',
      data: { loan }
    });

  } catch (error) {
    console.error('Repay loan error:', error);
    
    if (error.message === 'Loan is not in funded status') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while repaying loan'
    });
  }
});

// @desc    Cancel a loan request
// @route   DELETE /api/v1/loans/:id
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan || !loan.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (loan.borrower.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own loan requests'
      });
    }

    if (loan.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel loan that is already funded'
      });
    }

    loan.status = 'cancelled';
    loan.isActive = false;
    await loan.save();

    res.json({
      success: true,
      message: 'Loan request cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling loan'
    });
  }
});

module.exports = router;
