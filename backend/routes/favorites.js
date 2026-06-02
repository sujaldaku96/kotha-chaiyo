const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Property = require('../models/Property');
const User = require('../models/User');

// Add property to favorites
router.post('/', auth, async (req, res) => {
  try {
    const { propertyId } = req.body;
    
    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Add to user's favorites if not already there
    const user = await User.findById(req.user.id);
    if (!user.favorites.includes(propertyId)) {
      user.favorites.push(propertyId);
      await user.save();
    }
    
    res.json({ message: 'Property added to favorites' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove property from favorites
router.delete('/:propertyId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.favorites = user.favorites.filter(
      favId => favId.toString() !== req.params.propertyId
    );
    await user.save();
    
    res.json({ message: 'Property removed from favorites' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's favorites
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check if property is favorite
router.get('/check/:propertyId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const isFavorite = user.favorites.some(
      favId => favId.toString() === req.params.propertyId
    );
    res.json({ isFavorite });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;