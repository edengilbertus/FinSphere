const express = require('express');
const router = express.Router();
const SavingsGoal = require('../models/SavingsGoal');
const { authenticateToken } = require('../middleware/auth');

// Create a savings goal
router.post('/', authenticateToken, async (req, res) => {
  try {
    const goal = new SavingsGoal({
      user: req.user.id,
      ...req.body
    });
    await goal.save();
    res.status(201).json({ success: true, data: goal });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get all user's goals
router.get('/', authenticateToken, async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: goals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get a specific goal
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    res.json({ success: true, data: goal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update a goal
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    
    // Auto-complete goal if currentAmount >= targetAmount
    if (goal.currentAmount >= goal.targetAmount && !goal.isCompleted) {
      goal.isCompleted = true;
      await goal.save();
    }
    
    res.json({ success: true, data: goal });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Add money to a goal
router.post('/:id/deposit', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }
    
    const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    
    goal.currentAmount += amount;
    
    // Auto-complete goal if target reached
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
    }
    
    await goal.save();
    res.json({ success: true, data: goal, message: 'Deposit added successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Mark goal as completed
router.patch('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isCompleted: true },
      { new: true }
    );
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    res.json({ success: true, data: goal, message: 'Goal marked as completed' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete a goal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
