const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  propertyType: { type: String, required: true, enum: ["Residential", "Commercial"] },
  price: { type: Number, required: true },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    exactLocation: { type: String, default: "" }
  },
  furnishingStatus: { type: String, enum: ["Unfurnished", "Semi-Furnished", "Furnished"] },
  title: { type: String, required: true },
  description: { type: String, required: true },
  amenities: [{ type: String }],
  images: [{ type: String }],
  rooms: {
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    kitchen: { type: Number, default: 0 },
    livingRoom: { type: Number, default: 0 }
  },
  contactInfo: {
    ownerName: { type: String, required: true },
    ownerPhone: { type: String, required: true },
    ownerEmail: { type: String, required: true },
    ownerLocation: { type: String, required: true },
    wardNo: { type: Number, required: true }
  },
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },

  bookingStatus: {
    type: String,
    enum: ['available', 'booked'],
    default: 'available'
  },
  currentBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }
});

const Property = mongoose.model('Property', propertySchema);
module.exports = Property;