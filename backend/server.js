require('dns').setServers(['8.8.8.8', '1.1.1.1']);


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/property');
const contactRoutes = require('./routes/contact');
const profileRoutes = require('./routes/profile');
const bookingRoutes = require('./routes/bookings');
const notificationRoutes = require('./routes/notifications');
const favoritesRouter = require('./routes/favorites');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'x-auth-token',
      'X-Debug-Request'
    ],
    credentials: true
};
app.options('*', cors(corsOptions)); // Handle preflight for all routes mount

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/favorites', favoritesRouter);

app.use((req, res, next) => {
    console.log(`Incoming ${req.method} request to ${req.path}`);
    next();
  });
  
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK',
        services: {
            database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
        }
    });
});

app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});