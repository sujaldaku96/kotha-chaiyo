const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('notifications unreadNotifications')
      .lean();

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Sort notifications by date
    const sortedNotifications = user.notifications.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      success: true,
      notifications: sortedNotifications,
      unreadCount: user.unreadNotifications
    });
  } catch (err) {
    console.error('Notifications error:', {
      userId: req.user.id,
      error: err.message,
      stack: err.stack
    });
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching notifications',
      code: 'SERVER_ERROR'
    });
  }
});

// Mark notifications as read
router.patch('/mark-read', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $set: { unreadNotifications: 0 }
    });
    
    res.json({ 
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (err) {
    console.error('Mark as read error:', {
      userId: req.user.id,
      error: err.message
    });
    res.status(500).json({ 
      success: false,
      message: 'Error updating notifications',
      code: 'UPDATE_ERROR'
    });
  }
});

module.exports = router;