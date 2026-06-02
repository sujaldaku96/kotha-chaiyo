const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: [true, 'First name is required'] 
  },  
  lastName: { 
    type: String, 
    required: [true, 'Last name is required'] 
  },   
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: { 
    type: String, 
    enum: ["user", "admin"], 
    default: "user" 
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    select: false
  },
  verificationCodeExpires: {
    type: Date,
    select: false
  },
  resetPasswordCode: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  notifications: [{
    type: {
      type: String,
      enum: ['booking_request', 'booking_confirmation', 'booking_cancellation', 'contact_request', 'property_removal', 'refund_request'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      required: function() {
        return this.type === 'booking_confirmation';
      }
    },
    paymentMethod: {
      type: String,
      enum: ['khalti', 'cash', 'bank-transfer','esewa'],
      required: function() {
        return this.type === 'booking_confirmation';
      }
    }
  }],
  unreadNotifications: {
    type: Number,
    default: 0
  },
  contactDetails: {
    name: String,
    email: String,
    phone: String
  },

   favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  }],
  
});
userSchema.post('save', function(doc, next) {
  console.log('User saved:', {
    email: doc.email,
    passwordHash: doc.password ? doc.password.substring(0, 15) + '...' : 'none'
  });
  next();
});

// Password encryption before saving user
userSchema.pre('save', async function(next) {
  // Only hash if password was modified and it's not already hashed
  if (!this.isModified('password') || this.password.startsWith('$2b$')) {
    return next();
  }

  try {
    console.log('Original password before hash:', this.password);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Hashed password:', this.password.substring(0, 15) + '...');
    next();
  } catch (err) {
    console.error('Hashing error:', err);
    next(err);
  }
});

// Track modifications
userSchema.pre('save', function(next) {
  console.log('Modified fields:', this.modifiedPaths());
  next();
});


// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!candidatePassword || !this.password) {
      throw new Error('Missing password for comparison');
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    console.error('Comparison error:', {
      candidateLength: candidatePassword?.length,
      storedHash: this.password?.substring(0, 10) + '...',
      error: err.message
    });
    throw err;
  }
};

// Transform output to remove sensitive data
userSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);