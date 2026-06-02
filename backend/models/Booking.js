const mongoose = require('mongoose');

const paymentDetailsSchema = new mongoose.Schema({
  method: { 
    type: String, 
    enum: ['khalti'], 
    required: true 
  },
  transactionId: String,
  pidx: String,
  completedAt: Date,
  khaltiData: Object,
  payerDetails: {
    name: String,
    email: String
  },
  receiverDetails: {
    name: String,
    email: String
  },
  paymentStatus: {
    type: String,
    enum: ['completed', 'refunded', 'failed'],
    default: 'completed'
  },
  paymentTimestamp: {
    type: Date,
    default: Date.now
  },
  refundedAt: {
    type: Date
  }
});

const bookingSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {  
    type: String,
    required: true
  },
  check_in: {
    type: Date,
    required: true
  },
  check_out: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
   paymentDetails: paymentDetailsSchema,
  status: {
    type: String,
    required: true,
    enum: ["pending", "paid", "cancelled", "completed"],
    default: "pending"
  },
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Booking', bookingSchema);