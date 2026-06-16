const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Review = require('../models/Review');
const Notification = require('../models/Notification');

// 1. Get current user's notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving notifications' });
  }
});

// 2. Mark notification as read
router.post('/notifications/read/:id', auth, async (req, res) => {
  try {
    const notify = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notify) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notify);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating notification status' });
  }
});

// 3. Get all users (HR can see everyone, Managers can see direct reports)
router.get('/all', auth, async (req, res) => {
  try {
    let users;
    if (req.user.role === 'hr') {
      users = await User.find().populate('managerId', 'name email');
    } else if (req.user.role === 'manager') {
      users = await User.find({ managerId: req.user.id });
    } else {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving users list' });
  }
});

// 4. Get general statistics dashboard aggregated info
router.get('/dashboard-stats', auth, async (req, res) => {
  try {
    const totalUsersCount = await User.countDocuments();
    const reviewsCount = await Review.countDocuments();
    const finalizedCount = await Review.countDocuments({ status: 'HR Finalized' });
    const pendingHRCount = await Review.countDocuments({ status: 'Manager Reviewed' });
    const pendingManagerCount = await Review.countDocuments({ status: 'Submitted' });

    res.json({
      totalUsers: totalUsersCount,
      totalReviews: reviewsCount,
      finalizedReviews: finalizedCount,
      pendingHR: pendingHRCount,
      pendingManager: pendingManagerCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

module.exports = router;
