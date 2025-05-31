const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Savings = require('../models/Savings');
const User = require('../models/User');

const router = express.Router();

// @desc    Create a new savings goal
// @route   POST /api/v1/savings
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      goalName,
      targetAmount,
      targetDate,
      category,
      autoDeposit
    } = req.body;

    // Validation
    if (!goalName || !targetAmount) {
      return res.status(400).json({
        success: false,
        message: 'Goal name and target amount are required'
      });
    }

    if (targetAmount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Target amount must be at least $1'
      });
    }

    const savingsGoal = new Savings({
      user: req.user._id,
      goalName: goalName.trim(),
      targetAmount,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      category: category || 'other',
      autoDeposit: autoDeposit || { enabled: false }
    });

    await savingsGoal.save();
    
    // Populate user details
    await savingsGoal.populate('user', 'profile.firstName profile.lastName profile.username');

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      data: { savingsGoal }
    });

  } catch (error) {
    console.error('Create savings goal error:', error);
    
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
      message: 'Server error while creating savings goal'
    });
  }
});

// @desc    Get user's savings goals
// @route   GET /api/v1/savings
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    
    const query = { user: req.user._id, isActive: true };
    
    if (status) query.status = status;
    if (category) query.category = category;
    
    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort: { createdAt: -1 }
    };

    const savingsGoals = await Savings.find(query, null, options)
      .populate('user', 'profile.firstName profile.lastName profile.username');

    const total = await Savings.countDocuments(query);

    res.json({
      success: true,
      data: {
        savingsGoals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get savings goals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching savings goals'
    });
  }
});

// @desc    Get specific savings goal
// @route   GET /api/v1/savings/:id
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const savingsGoal = await Savings.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    }).populate('user', 'profile.firstName profile.lastName profile.username');

    if (!savingsGoal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    res.json({
      success: true,
      data: { savingsGoal }
    });

  } catch (error) {
    console.error('Get savings goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching savings goal'
    });
  }
});

// @desc    Update savings goal
// @route   PUT /api/v1/savings/:id
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { goalName, targetAmount, targetDate, category, autoDeposit, status } = req.body;
    
    const savingsGoal = await Savings.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    });

    if (!savingsGoal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    // Update fields
    if (goalName) savingsGoal.goalName = goalName.trim();
    if (targetAmount) savingsGoal.targetAmount = targetAmount;
    if (targetDate) savingsGoal.targetDate = new Date(targetDate);
    if (category) savingsGoal.category = category;
    if (autoDeposit) savingsGoal.autoDeposit = { ...savingsGoal.autoDeposit, ...autoDeposit };
    if (status) savingsGoal.status = status;

    await savingsGoal.save();
    await savingsGoal.populate('user', 'profile.firstName profile.lastName profile.username');

    res.json({
      success: true,
      message: 'Savings goal updated successfully',
      data: { savingsGoal }
    });

  } catch (error) {
    console.error('Update savings goal error:', error);
    
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
      message: 'Server error while updating savings goal'
    });
  }
});

// @desc    Add deposit to savings goal
// @route   POST /api/v1/savings/:id/deposit
// @access  Private
router.post('/:id/deposit', authenticateToken, async (req, res) => {
  try {
    const { amount, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid deposit amount is required'
      });
    }

    const savingsGoal = await Savings.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    });

    if (!savingsGoal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    if (savingsGoal.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add deposit to cancelled goal'
      });
    }

    await savingsGoal.addDeposit(amount, note || '');
    await savingsGoal.populate('user', 'profile.firstName profile.lastName profile.username');

    res.json({
      success: true,
      message: 'Deposit added successfully',
      data: { 
        savingsGoal,
        newDeposit: savingsGoal.deposits[savingsGoal.deposits.length - 1]
      }
    });

  } catch (error) {
    console.error('Add deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding deposit'
    });
  }
});

// @desc    Add withdrawal from savings goal
// @route   POST /api/v1/savings/:id/withdraw
// @access  Private
router.post('/:id/withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid withdrawal amount is required'
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal reason is required'
      });
    }

    const savingsGoal = await Savings.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    });

    if (!savingsGoal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    if (amount > savingsGoal.currentAmount) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal amount cannot exceed current savings'
      });
    }

    await savingsGoal.addWithdrawal(amount, reason.trim());
    await savingsGoal.populate('user', 'profile.firstName profile.lastName profile.username');

    res.json({
      success: true,
      message: 'Withdrawal processed successfully',
      data: { 
        savingsGoal,
        newWithdrawal: savingsGoal.withdrawals[savingsGoal.withdrawals.length - 1]
      }
    });

  } catch (error) {
    console.error('Add withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while processing withdrawal'
    });
  }
});

// @desc    Get user's savings summary
// @route   GET /api/v1/savings/summary
// @access  Private
router.get('/summary/user', authenticateToken, async (req, res) => {
  try {
    const summary = await Savings.getUserSummary(req.user._id);
    
    const userSummary = summary.length > 0 ? summary[0] : {
      totalGoals: 0,
      activeGoals: 0,
      completedGoals: 0,
      totalSaved: 0,
      totalTargetAmount: 0
    };

    // Calculate overall progress
    userSummary.overallProgress = userSummary.totalTargetAmount > 0 
      ? Math.round((userSummary.totalSaved / userSummary.totalTargetAmount) * 100)
      : 0;

    res.json({
      success: true,
      data: { summary: userSummary }
    });

  } catch (error) {
    console.error('Get savings summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching savings summary'
    });
  }
});

// @desc    Delete savings goal
// @route   DELETE /api/v1/savings/:id
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const savingsGoal = await Savings.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    });

    if (!savingsGoal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    // Soft delete
    savingsGoal.isActive = false;
    savingsGoal.status = 'cancelled';
    await savingsGoal.save();

    res.json({
      success: true,
      message: 'Savings goal deleted successfully'
    });

  } catch (error) {
    console.error('Delete savings goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting savings goal'
    });
  }
});

module.exports = router;
