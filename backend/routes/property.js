const express = require('express');
const router = express.Router();
const multer = require('multer');
const Property = require('../models/Property');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Booking = require('../models/Booking');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: {
    files: 3
  }
});

// Add new property
router.post('/add', upload.array('images', 3), async (req, res) => {
  try {
    if (!req.files || req.files.length !== 3) {
      return res.status(400).json({ message: "Exactly 3 images are required" });
    }

    const { 
      propertyType, 
      price, 
      furnishingStatus, 
      title, 
      description, 
      amenities, 
      rooms, 
      contactInfo,
      location
    } = req.body;

    let locationData;
    try {
      locationData = typeof location === 'string' ? JSON.parse(location) : location;
    } catch (err) {
      return res.status(400).json({ message: "Invalid location data format" });
    }

    if (!locationData || 
        !locationData.address || 
        !locationData.city || 
        locationData.latitude === undefined || 
        locationData.longitude === undefined) {
      return res.status(400).json({ 
        message: "Location data must include address, city, latitude, and longitude" 
      });
    }

    let validFurnishingStatus = undefined;
    if (propertyType === "Residential") {
      const validStatuses = ["Unfurnished", "Semi-Furnished", "Furnished"];
      if (!validStatuses.includes(furnishingStatus)) {
        return res.status(400).json({ message: "Invalid furnishingStatus value" });
      }
      validFurnishingStatus = furnishingStatus;
    }

    const images = req.files.map(file => file.filename);

    const newProperty = new Property({
      propertyType,
      price,
      location: {
        address: locationData.address,
        city: locationData.city,
        latitude: parseFloat(locationData.latitude),
        longitude: parseFloat(locationData.longitude),
        exactLocation: locationData.exactLocation || ""
      },
      furnishingStatus: validFurnishingStatus,
      title,
      description,
      amenities: amenities ? JSON.parse(amenities) : [],
      rooms: rooms ? JSON.parse(rooms) : {},
      contactInfo: contactInfo ? JSON.parse(contactInfo) : {},
      images,
      approved: false
    });

    await newProperty.save();
    res.status(201).json({ 
      message: 'Property added successfully! It will be listed after admin approval.', 
      property: newProperty 
    });
  } catch (err) {
    console.error("Error adding property:", err);
    res.status(500).json({ message: 'Error adding property', error: err.message });
  }
});


// Get all properties
router.get('/all', async (req, res) => {
  try {
    const properties = await Property.find({});
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin delete endpoint
router.delete('/:id/admin', auth, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Find property before deletion to get owner's email
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Find all bookings associated with this property
    const bookings = await Booking.find({ property: property._id });

    // For each booking, notify the user and update booking status
    for (const booking of bookings) {
      // Find the user who made the booking
      const bookingUser = await User.findById(booking.user);
      if (bookingUser) {
        // Add notification about property removal
        bookingUser.notifications.push({
          type: 'property_removal',
          message: `The property "${property.title}" you booked has been removed by an administrator. Your booking has been cancelled.`,
          propertyId: property._id,
          bookingId: booking._id,
          createdAt: new Date()
        });
        bookingUser.unreadNotifications += 1;
        await bookingUser.save();

        // Update booking status to cancelled
        await Booking.findByIdAndUpdate(booking._id, { status: 'cancelled' });
      }
    }

    // Find the property owner by email
    const propertyOwner = await User.findOne({ email: property.contactInfo.ownerEmail });
    if (!propertyOwner) {
      return res.status(404).json({ message: 'Property owner not found' });
    }

    // Create notification message for owner
    const notificationMessage = `Your property "${property.title}" has been removed by an administrator.`;

    // Add notification to owner's notifications array
    propertyOwner.notifications.push({
      type: 'property_removal',
      message: notificationMessage,
      propertyId: property._id,
      createdAt: new Date()
    });

    // Increment unread notifications counter
    propertyOwner.unreadNotifications += 1;

    // Save the updated user document
    await propertyOwner.save();

    // Delete the property
    await Property.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'Property deleted successfully, owner notified, and associated bookings cancelled',
      cancelledBookings: bookings.length
    });
  } catch (err) {
    console.error('Error in property route:', err);
    res.status(500).json({ message: err.message });
  }
});



// Get pending properties (for admin)
router.get('/pending', async (req, res) => {
  try {
    const properties = await Property.find({ approved: false });
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve property
router.patch('/:id/approve', async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );
    res.json(property);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Reject property
router.delete('/:id/reject', async (req, res) => {
  try {
    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property rejected and deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all approved properties for public listing
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = { approved: true }; // Only show approved properties

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { propertyType: { $regex: search, $options: 'i' } }
      ];
    }

    const properties = await Property.find(query);
    res.status(200).json(properties);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching properties', error: err });
  }
});

// Get a single property by ID 
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if user is authenticated
    const token = req.headers.authorization?.split(' ')[1];
    let userEmail = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userEmail = decoded.email;
      } catch (err) {
        console.error("Token verification error:", err);
      }
    }

    if (property.approved || (userEmail && property.contactInfo.ownerEmail === userEmail)) {
      return res.status(200).json(property);
    }

    return res.status(403).json({ message: 'Unauthorized access to this property' });
  } catch (err) {
    console.error("Error in property route:", err);
    res.status(500).json({ message: 'Error fetching property', error: err.message });
  }
});

// Serve uploaded images
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Get properties by owner email
router.get('/user/:email', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token and check if requested email matches token's email
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.email !== req.params.email) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Return only properties owned by this user
    const properties = await Property.find({ 
      'contactInfo.ownerEmail': req.params.email 
    });
    
    res.json(properties);
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Update property details with ownership check
router.put('/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const property = await Property.findById(req.params.id);

    // Check if property exists and belongs to user
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    if (property.contactInfo.ownerEmail !== decoded.email) {
      return res.status(403).json({ message: 'Unauthorized to edit this property' });
    }

    // Allow location updates but validate them
    const { location, ...updateData } = req.body;
    
    if (location) {
      if (location.latitude && location.longitude) {
        updateData.location = {
          ...property.location.toObject(),
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
          // Preserve other location fields
          address: location.address || property.location.address,
          city: location.city || property.location.city,
          exactLocation: location.exactLocation || property.location.exactLocation
        };
      } else {
        return res.status(400).json({ 
          message: "Location updates must include latitude and longitude" 
        });
      }
    }
    
    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    res.json(updatedProperty);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete property with ownership check
router.delete('/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const property = await Property.findById(req.params.id);

    // Check if property exists and belongs to user
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    if (property.contactInfo.ownerEmail !== decoded.email) {
      return res.status(403).json({ message: 'Unauthorized to delete this property' });
    }

    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/:id/contact', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ 
        success: false,
        message: 'Property not found',
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    const { name, email, phone, message, propertyTitle } = req.body;

    // Find property owner
    const owner = await User.findOne({ email: property.contactInfo.ownerEmail });
    if (!owner) {
      return res.status(404).json({ 
        success: false,
        message: 'Property owner not found',
        code: 'OWNER_NOT_FOUND'
      });
    }

    // Create detailed notification
    const notificationMessage = `
      New Contact Request for "${propertyTitle}"
      
      From: ${name}
      Email: ${email}
      Phone: ${phone}
      Message: ${message}
      
      Submitted: ${new Date().toLocaleString()}
    `;

    owner.notifications.push({
      type: 'contact_request', // Changed to match enum
      message: notificationMessage,
      propertyId: property._id,
      contactDetails: {
        name,
        email,
        phone,
        message
      },
      createdAt: new Date()
    });

    owner.unreadNotifications += 1;
    await owner.save();

    res.status(200).json({ 
      success: true,
      message: 'Contact message sent successfully' 
    });

  } catch (err) {
    console.error('Contact form error:', {
      propertyId: req.params.id,
      error: err.message,
      stack: err.stack
    });
    res.status(500).json({ 
      success: false,
      message: 'Error processing contact form',
      code: 'SERVER_ERROR'
    });
  }
});

router.get('/owner/:email', auth, async (req, res) => {
  try {
    // Verify requesting user's email matches parameter
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Directly query by ownerEmail
    const properties = await Property.find({ 
      'contactInfo.ownerEmail': req.params.email 
    });
    
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



module.exports = router;