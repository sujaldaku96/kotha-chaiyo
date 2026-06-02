const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');

// Get user profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/', 
  authMiddleware,
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email } = req.body;

    try {
      let user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Check if email is being changed
      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      // Update user fields
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.email = email || user.email;

      await user.save();

      // Get updated user data without password
      const updatedUser = await User.findById(req.user.id).select('-password');
      
      res.json({ 
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Change password
router.put('/password', 
  authMiddleware,
  [
    check('currentPassword', 'Current password is required').exists().notEmpty(),
    check('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
      // Find user and explicitly select the password field
      const user = await User.findById(req.user.id).select('+password');
      if (!user) {
        console.log('Password change failed: User not found');
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('Password change details:', {
        email: user.email,
        storedHashPrefix: user.password ? user.password.substring(0, 15) + '...' : 'none',
        currentPasswordLength: currentPassword ? currentPassword.length : 0,
        newPasswordLength: newPassword ? newPassword.length : 0
      });

      // Verify current password exists in database
      if (!user.password) {
        console.log('Password change failed: No password set for account');
        return res.status(400).json({ 
          message: 'No password set for this account',
          field: 'currentPassword'
        });
      }

      // Trim current password to handle accidental whitespace
      const trimmedCurrentPassword = currentPassword.trim();
      const isMatch = await bcrypt.compare(trimmedCurrentPassword, user.password);
      console.log('Current password match result:', isMatch);

      if (!isMatch) {
        console.log('Password change failed: Current password incorrect');
        return res.status(400).json({ 
          message: 'Current password is incorrect',
          field: 'currentPassword'
        });
      }

      // Hash new password with additional validation
      if (!newPassword || newPassword.length < 6) {
        console.log('Password change failed: Invalid new password');
        return res.status(400).json({
          message: 'New password must be at least 6 characters',
          field: 'newPassword'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const newHashedPassword = await bcrypt.hash(newPassword.trim(), salt);
      console.log('New hashed password:', newHashedPassword.substring(0, 15) + '...');

      // Bypass the pre-save hook for this operation
      await User.findByIdAndUpdate(user._id, {
        $set: { password: newHashedPassword }
      });

      // Verify the update
      const updatedUser = await User.findById(user._id).select('+password');
      console.log('Updated user password:', updatedUser.password.substring(0, 15) + '...');
      
      // Compare the hashes to ensure they match
      if (updatedUser.password !== newHashedPassword) {
        console.error('Password hash mismatch after update!');
        throw new Error('Password hash verification failed');
      }

      console.log('Password updated successfully for:', user.email);
      
      // Return updated user data without password
      const userWithoutPassword = await User.findById(req.user.id).select('-password');
      
      res.json({ 
        success: true,
        message: 'Password updated successfully',
        user: userWithoutPassword
      });

    } catch (error) {
      console.error('Password change error details:', {
        message: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      res.status(500).json({ 
        success: false,
        message: 'Failed to update password',
        error: error.message
      });
    }
  }
);

module.exports = router;