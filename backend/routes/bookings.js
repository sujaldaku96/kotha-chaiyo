const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const User = require('../models/User');
const auth = require('../middleware/auth');
const axios = require('axios');
const crypto = require('crypto');

// Create a new booking
router.post('/', auth, async (req, res) => {
  try {
    const { property, check_in, check_out, amount } = req.body;
    
    // Calculate full months between dates
    const months = Math.ceil(
      (new Date(check_out) - new Date(check_in)) / 
      (1000 * 60 * 60 * 24 * 30)
    );

    const booking = await Booking.create({
      property: property._id,
      user: req.user.id,
      userEmail: req.user.email,
      check_in,
      check_out,
      amount,
      status: "pending"
    });

    res.json({
      success: true,
      booking,
      message: "Booking created successfully. Proceed to payment."
    });
    
  } catch (err) {
    res.status(400).json({ 
      success: false,
      error: err?.message || "Booking creation failed" 
    });
  }
});

// Verify booking status
router.get('/verify/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    res.json({
      verified: booking.status === 'paid',
      booking
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user bookings
router.get('/user/:email', auth, async (req, res) => {
  try {
    // Verify requesting user matches the email parameter
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const bookings = await Booking.find({ userEmail: req.params.email })
      .populate({
        path: 'property',
        select: 'title images location price'
      })
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Attempting to cancel booking:', req.params.id);
    console.log('User email:', req.user.email);

    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'property',
        select: 'title images location price contactInfo'
      })
      .populate({
        path: 'user',
        select: '_id email firstName lastName'
      });
    
    if (!booking) {
      console.log('Booking not found:', req.params.id);
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }

    console.log('Found booking:', {
      bookingId: booking._id,
      propertyId: booking.property?._id,
      userId: booking.user?._id,
      userEmail: booking.user?.email,
      ownerEmail: booking.property?.contactInfo?.ownerEmail
    });

    // Check if user and property are properly populated
    if (!booking.user || !booking.property) {
      console.log('Incomplete booking data:', {
        hasUser: !!booking.user,
        hasProperty: !!booking.property
      });
      return res.status(400).json({ 
        success: false,
        message: 'Booking data incomplete' 
      });
    }

    // Verify authorization
    const isBooker = booking.user.email === req.user.email;
    const isOwner = booking.property.contactInfo.ownerEmail === req.user.email;
    
    console.log('Authorization check:', {
      requestingUserEmail: req.user.email,
      bookerEmail: booking.user.email,
      ownerEmail: booking.property.contactInfo.ownerEmail,
      isBooker,
      isOwner
    });

    if (!isBooker && !isOwner) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized to cancel this booking' 
      });
    }

    // Get the cancelling user's details
    const cancellingUser = await User.findOne({ email: req.user.email });
    if (!cancellingUser) {
      console.log('Cancelling user not found:', req.user.email);
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    console.log('Found cancelling user:', {
      userId: cancellingUser._id,
      email: cancellingUser.email,
      name: `${cancellingUser.firstName} ${cancellingUser.lastName}`
    });
    
    // Update booking status using findByIdAndUpdate to preserve all fields
    const updatedBooking = await Booking.findByIdAndUpdate(
      booking._id,
      { status: 'cancelled' },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update booking status'
      });
    }
    
    // Update property status
    await Property.findByIdAndUpdate(booking.property._id, {
      bookingStatus: 'available',
      currentBooking: null
    });

    // Prepare appropriate notification
    const notificationMessage = isBooker
      ? `Booking Cancellation for "${booking.property.title}"\n\n` +
        `Cancelled by: ${cancellingUser.firstName} ${cancellingUser.lastName}\n` +
        `Dates: ${new Date(booking.check_in).toLocaleDateString()} - ${new Date(booking.check_out).toLocaleDateString()}\n` +
        `Amount: Rs ${booking.amount.toLocaleString()}\n\n` +
        `Cancelled on: ${new Date().toLocaleString()}`
      : `Your booking has been cancelled by the owner\n\n` +
        `Property: "${booking.property.title}"\n` +
        `Dates: ${new Date(booking.check_in).toLocaleDateString()} - ${new Date(booking.check_out).toLocaleDateString()}\n` +
        `Amount: Rs ${booking.amount.toLocaleString()}\n\n` +
        `Cancelled on: ${new Date().toLocaleString()}`;

    // Send notification to the other party
    const recipient = isBooker
      ? await User.findOne({ email: booking.property.contactInfo.ownerEmail }) // Notify owner
      : await User.findById(booking.user._id); // Notify renter

    if (recipient) {
      recipient.notifications.push({
        type: 'booking_cancellation',
        message: notificationMessage,
        propertyId: booking.property._id,
        bookingId: booking._id,
        createdAt: new Date()
      });
      recipient.unreadNotifications += 1;
      await recipient.save();
    }

    console.log('Successfully cancelled booking');

    res.json({ 
      success: true,
      message: 'Booking cancelled successfully',
      cancelledBy: isBooker ? 'booker' : 'owner'
    });
  } catch (err) {
    console.error('Booking cancellation error:', {
      error: err.message,
      stack: err.stack,
      bookingId: req.params.id,
      userEmail: req.user?.email
    });
    res.status(400).json({ 
      success: false,
      message: err.message || 'Failed to cancel booking' 
    });
  }
});

router.post('/khalti/initiate', auth, async (req, res) => {
  try {
    const { property, check_in, check_out, amount } = req.body;
    
    // Get user and property details
    const [user, propertyDetails] = await Promise.all([
      User.findById(req.user.id),
      Property.findById(property._id)
    ]);

    if (!user || !propertyDetails) {
      return res.status(404).json({ message: 'User or property not found' });
    }

    // Create booking
    const booking = await Booking.create({
      property: property._id,
      user: req.user.id,
      userEmail: user.email,
      check_in,
      check_out,
      amount,
      status: "pending"
    });

    // Prepare initial Khalti payload without pidx
    const payload = {
      return_url: `${process.env.FRONTEND_URL}/payment-success?bookingId=${booking._id}`,
      website_url: process.env.FRONTEND_URL,
      amount: amount * 100, 
      purchase_order_id: booking._id,
      purchase_order_name: `Booking for ${propertyDetails.title}`,
      customer_info: {
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email
      }
    };

    // Initiate Khalti payment
    const khaltiResponse = await axios.post(
      'https://a.khalti.com/api/v2/epayment/initiate/',
      payload,
      {
        headers: {
          'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Update booking with payment reference
    booking.paymentId = khaltiResponse.data.pidx;
    await booking.save();

    res.json({
      payment_url: khaltiResponse.data.payment_url,
      bookingId: booking._id
    });

  } catch (err) {
    console.error('Khalti initiation error:', err);
    res.status(400).json({
      message: err.response?.data?.detail || 'Payment initiation failed'
    });
  }
});


router.get('/verify-payment/:pidx', async (req, res) => {
  try {
    const { pidx } = req.params;
    const { bookingId } = req.query;

    //find the booking by pidx or bookingId
    const booking = await Booking.findOne({
      $or: [
        { _id: bookingId },
        { paymentId: pidx }
      ]
    }).populate('property').populate('user');

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    //If booking is already paid return success
    if (booking.status === 'paid') {
      return res.json({ 
        success: true, 
        booking,
        message: 'Payment already verified' 
      });
    }

    //Verify payment with Khalti
    const verification = await axios.post(
      'https://a.khalti.com/api/v2/epayment/lookup/',
      { pidx },
      {
        headers: {
          'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (verification.data.status !== 'Completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment not completed' 
      });
    }

    //Update booking status
    booking.status = 'paid';
    booking.paymentDetails = {
      method: 'khalti',
      transactionId: verification.data.transaction_id,
      pidx,
      completedAt: new Date(),
      khaltiData: verification.data,
      payerDetails: {
        name: `${booking.user.firstName} ${booking.user.lastName}`,
        email: booking.user.email
      },
      receiverDetails: {
        name: booking.property.contactInfo.ownerName,
        email: booking.property.contactInfo.ownerEmail
      },
      paymentStatus: 'completed',
      paymentTimestamp: new Date()
    };
    await booking.save();

    //Update property status
    await Property.findByIdAndUpdate(
      booking.property._id,
      {
        bookingStatus: 'booked',
        currentBooking: booking._id
      }
    );

    //Send notifications
    const notifyUser = async (user, message) => {
      if (!user) return;
      
      try {
        user.notifications.push({
          type: 'booking_confirmation',
          message: message,
          propertyId: booking.property._id,
          bookingId: booking._id,
          createdAt: new Date(),
          amount: booking.amount,
          paymentMethod: 'khalti' 
        });
        user.unreadNotifications += 1;
        await user.save();
      } catch (err) {
        console.error('Notification error:', err);
      }
    };

    // Notify owner
    const owner = await User.findOne({ email: booking.property.contactInfo.ownerEmail });
    await notifyUser(
      owner,
      `New Booking for "${booking.property.title}"\n\n` +
      `From: ${booking.user.firstName} ${booking.user.lastName}\n` +
      `Dates: ${new Date(booking.check_in).toLocaleDateString()} - ${new Date(booking.check_out).toLocaleDateString()}\n` +
      `Amount: Rs ${booking.amount.toLocaleString()}`
    );

    // Notify renter
    await notifyUser(
      booking.user,
      `Your booking for "${booking.property.title}" is confirmed!\n\n` +
      `Dates: ${new Date(booking.check_in).toLocaleDateString()} - ${new Date(booking.check_out).toLocaleDateString()}\n` +
      `Paid: Rs ${booking.amount.toLocaleString()} via Khalti`
    );

    return res.json({ success: true, booking });

  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.response?.data?.detail || 'Payment verification failed',
      error: err.message 
    });
  }
});

// Get bookings by property owner
router.get('/owner/:email', auth, async (req, res) => {
  try {
    // Verify requesting user matches the email parameter
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Find all properties owned by this user
    const properties = await Property.find({ 
      'contactInfo.ownerEmail': req.params.email 
    });

    // Get property IDs
    const propertyIds = properties.map(property => property._id);

    // Find all bookings for these properties
    const bookings = await Booking.find({ 
      property: { $in: propertyIds } 
    })
    .populate({
      path: 'property',
      select: 'title images location price contactInfo'
    })
    .populate({
      path: 'user',
      select: 'firstName lastName email'
    })
    .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all payments (admin only)
router.get('/payments', auth, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Find all paid bookings with payment details
    const payments = await Booking.find({ 
      status: 'paid',
      paymentDetails: { $exists: true }
    })
    .populate({
      path: 'property',
      select: 'title location price contactInfo'
    })
    .populate({
      path: 'user',
      select: 'firstName lastName email'
    })
    .sort({ 'paymentDetails.paymentTimestamp': -1 });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get canceled bookings for a user
router.get('/canceled/:email', auth, async (req, res) => {
  try {
    // Verify requesting user matches the email parameter
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Find all properties owned by this user
    const properties = await Property.find({ 
      'contactInfo.ownerEmail': req.params.email 
    });

    // Get property IDs
    const propertyIds = properties.map(property => property._id);

    // Find all canceled bookings for these properties AND bookings made by this user
    const bookings = await Booking.find({ 
      $or: [
        { property: { $in: propertyIds }, status: 'cancelled' }, // Bookings for properties owned by user
        { userEmail: req.params.email, status: 'cancelled' }     // Bookings made by user
      ]
    })
    .populate({
      path: 'property',
      select: 'title images location price contactInfo'
    })
    .populate({
      path: 'user',
      select: 'firstName lastName email'
    })
    .sort({ updatedAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error('Error fetching canceled bookings:', err);
    res.status(500).json({ message: err.message });
  }
});

// Process refund for a canceled booking
router.post('/refund/:bookingId', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('property')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only property owner can initiate refund
    const isOwner = booking.property.contactInfo.ownerEmail === req.user.email;
    if (!isOwner) {
      return res.status(403).json({ 
        success: false,
        message: 'Only property owner can process refunds' 
      });
    }

    // Check if booking has been cancelled
    if (booking.status !== 'cancelled') {
      return res.status(400).json({ 
        success: false,
        message: 'Booking must be cancelled before refund can be processed' 
      });
    }

    // Check if booking has payment details and transaction ID
    if (!booking.paymentDetails?.transactionId) {
      return res.status(400).json({ 
        success: false,
        message: 'No payment details found for refund' 
      });
    }

    // Check if booking is already refunded
    if (booking.paymentDetails?.paymentStatus === 'refunded') {
      return res.status(400).json({ 
        success: false,
        message: 'Booking already refunded' 
      });
    }

    // Process refund through Khalti sandbox API
    try {
      const refundResponse = await axios.post(
        `https://dev.khalti.com/api/merchant-transaction/${booking.paymentDetails.transactionId}/refund/`,
        {
          amount: booking.amount * 100 
        },
        {
          headers: {
            'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update booking payment status
      booking.paymentDetails.paymentStatus = 'refunded';
      booking.paymentDetails.refundedAt = new Date().toISOString();
      booking.paymentDetails.refundDetails = refundResponse.data;
      await booking.save();

      // Send notifications
      const notifyUser = async (user, message) => {
        if (!user) return;
        
        try {
          user.notifications.push({
            type: 'booking_cancellation',
            message: message,
            propertyId: booking.property._id,
            bookingId: booking._id,
            createdAt: new Date()
          });
          user.unreadNotifications += 1;
          await user.save();
        } catch (err) {
          console.error('Notification error:', err);
        }
      };

      // Notify both parties about the refund
      const ownerMessage = `You have successfully refunded Rs ${booking.amount.toLocaleString()} to ${booking.user.firstName} ${booking.user.lastName} for "${booking.property.title}"\n\n` +
        `Refunded on: ${new Date().toLocaleString()}`;

      const renterMessage = `You have received a refund of Rs ${booking.amount.toLocaleString()} from ${booking.property.contactInfo.ownerName} for "${booking.property.title}"\n\n` +
        `Refunded on: ${new Date().toLocaleString()}`;

      // Notify owner
      const owner = await User.findOne({ email: booking.property.contactInfo.ownerEmail });
      await notifyUser(owner, ownerMessage);

      // Notify renter
      await notifyUser(booking.user, renterMessage);

      return res.json({
        success: true,
        message: 'Refund processed successfully',
        refund: booking.paymentDetails.refundDetails
      });

    } catch (err) {
      console.error('Khalti API error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to process refund. Please try again.',
        error: err.message
      });
    }

  } catch (err) {
    console.error('Refund error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: err.message
    });
  }
});

// Verify refund status
router.get('/verify-refund/:pidx', async (req, res) => {
  try {
    const { pidx } = req.params;
    const { bookingId } = req.query;

    // Find the booking
    const booking = await Booking.findById(bookingId)
      .populate('property')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify refund with Khalti sandbox API
    const verification = await axios.post(
      'https://dev.khalti.com/api/merchant-transaction/refund/lookup/',
      { pidx },
      {
        headers: {
          'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (verification.data.status === 'Completed') {
      // Update booking payment status
      booking.paymentDetails.paymentStatus = 'refunded';
      booking.paymentDetails.refundedAt = new Date().toISOString();
      booking.paymentDetails.refundDetails = verification.data;
      await booking.save();

      // Send notifications
      const notifyUser = async (user, message) => {
        if (!user) return;
        
        try {
          user.notifications.push({
            type: 'booking_cancellation',
            message: message,
            propertyId: booking.property._id,
            bookingId: booking._id,
            createdAt: new Date()
          });
          user.unreadNotifications += 1;
          await user.save();
        } catch (err) {
          console.error('Notification error:', err);
        }
      };

      // Notify both parties about the refund
      const ownerMessage = `You have successfully refunded Rs ${booking.amount.toLocaleString()} to ${booking.user.firstName} ${booking.user.lastName} for "${booking.property.title}"\n\n` +
        `Refunded on: ${new Date().toLocaleString()}`;

      const renterMessage = `You have received a refund of Rs ${booking.amount.toLocaleString()} from ${booking.property.contactInfo.ownerName} for "${booking.property.title}"\n\n` +
        `Refunded on: ${new Date().toLocaleString()}`;

      // Notify owner
      const owner = await User.findOne({ email: booking.property.contactInfo.ownerEmail });
      await notifyUser(owner, ownerMessage);

      // Notify renter
      await notifyUser(booking.user, renterMessage);

      return res.json({ 
        success: true, 
        booking,
        message: 'Refund verified successfully' 
      });
    }

    return res.status(400).json({ 
      success: false, 
      message: 'Refund not completed' 
    });

  } catch (err) {
    console.error('Refund verification error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Refund verification failed',
      error: err.message 
    });
  }
});

// Get all canceled and refunded bookings (admin only)
router.get('/admin/canceled-refunds', auth, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Find all canceled bookings with payment details
    const bookings = await Booking.find({ 
      status: 'cancelled',
      paymentDetails: { $exists: true }
    })
    .populate({
      path: 'property',
      select: 'title location price contactInfo'
    })
    .populate({
      path: 'user',
      select: 'firstName lastName email'
    })
    .sort({ updatedAt: -1 });

    // Format the response to include refund status
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      property: booking.property,
      user: booking.user,
      check_in: booking.check_in,
      check_out: booking.check_out,
      amount: booking.amount,
      status: booking.status,
      canceledAt: booking.updatedAt,
      paymentDetails: {
        paymentMethod: booking.paymentDetails?.method,
        transactionId: booking.paymentDetails?.transactionId,
        paymentStatus: booking.paymentDetails?.paymentStatus,
        paymentTimestamp: booking.paymentDetails?.paymentTimestamp,
        refundStatus: booking.paymentDetails?.paymentStatus === 'refunded' ? 'refunded' : 'pending',
        refundedAt: booking.paymentDetails?.refundedAt,
        refundDetails: booking.paymentDetails?.refundDetails
      }
    }));

    res.json({
      success: true,
      total: formattedBookings.length,
      bookings: formattedBookings
    });

  } catch (err) {
    console.error('Error fetching canceled and refunded bookings:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// Request refund for a canceled booking
router.post('/request-refund/:bookingId', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('property')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }

    // Verify that the requesting user is the one who made the booking
    if (booking.userEmail !== req.user.email) {
      return res.status(403).json({ 
        success: false,
        message: 'Only the booking owner can request a refund' 
      });
    }

    // Check if booking has been cancelled
    if (booking.status !== 'cancelled') {
      return res.status(400).json({ 
        success: false,
        message: 'Booking must be cancelled before requesting a refund' 
      });
    }

    // Check if booking is already refunded
    if (booking.paymentDetails?.paymentStatus === 'refunded') {
      return res.status(400).json({ 
        success: false,
        message: 'Booking already refunded' 
      });
    }

    // Find the property owner
    const owner = await User.findOne({ email: booking.property.contactInfo.ownerEmail });
    if (!owner) {
      return res.status(404).json({ 
        success: false,
        message: 'Property owner not found' 
      });
    }

    // Create refund request notification
    const notificationMessage = `Refund Request for "${booking.property.title}"\n\n` +
      `From: ${booking.user.firstName} ${booking.user.lastName}\n` +
      `Amount: Rs ${booking.amount.toLocaleString()}\n` +
      `Dates: ${new Date(booking.check_in).toLocaleDateString()} - ${new Date(booking.check_out).toLocaleDateString()}\n\n` +
      `Please process the refund for this canceled booking.`;

    // Add notification to owner's notifications
    owner.notifications.push({
      type: 'refund_request',
      message: notificationMessage,
      propertyId: booking.property._id,
      bookingId: booking._id,
      createdAt: new Date()
    });
    owner.unreadNotifications += 1;
    await owner.save();

    res.json({
      success: true,
      message: 'Refund request sent successfully to the property owner'
    });

  } catch (err) {
    console.error('Refund request error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to send refund request',
      error: err.message
    });
  }
});

module.exports = router;