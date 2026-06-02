const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { promisify } = require('util');
dotenv.config();
const verifyToken = promisify(jwt.verify);

module.exports = async function(req, res, next) {
  //get token from multiple possible sources
  let token = req.header('x-auth-token') || 
              req.cookies?.token || 
              req.headers?.authorization;

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Authorization token required',
      code: 'UNAUTHORIZED'
    });
  }

  // Remove Bearer prefix if present
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length).trimLeft();
  }

  try {
    const decoded = await verifyToken(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      ignoreExpiration: false,
      maxAge: process.env.JWT_EXPIRE || '1h'
    });

    // Standardize user object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'user'
    };

    // Refresh token if about to expire
    if (decoded.exp - Date.now() / 1000 < 1800) {
      const newToken = jwt.sign(
        { id: decoded.id, email: decoded.email, role: decoded.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '1h' }
      );
      res.setHeader('x-auth-token', newToken);
      res.cookie('token', newToken, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    }

    next();
  } catch (err) {
    let statusCode = 401;
    let errorMessage = 'Invalid authentication token';
    let errorCode = 'INVALID_TOKEN';

    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Session expired, please login again';
      errorCode = 'TOKEN_EXPIRED';
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token format';
      errorCode = 'MALFORMED_TOKEN';
    }

    console.error('Authentication error:', {
      error: err.name,
      message: err.message,
      ip: req.ip,
      path: req.path,
      token: token.substring(0, 10) + '...'
    });

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      code: errorCode
    });
  }
};