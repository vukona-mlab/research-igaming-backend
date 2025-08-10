// middleware/auth.js
const jwt = require('jsonwebtoken');
const { firebaseDb } = require('../config/firebase');
// const { doc, getDoc } = require('firebase/firestore');

// Authentication middleware - verifies JWT token and adds user to request
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. No token provided.',
        message: 'Please include Authorization header with Bearer token'
      });
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. Invalid token format.' 
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          error: 'Token expired. Please login again.' 
        });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid token. Please login again.' 
        });
      }
      throw jwtError;
    }

    // Get user data from Firebase (optional - depends on your setup)
    let userData = { uid: decoded.uid };
    
    try {
      const userRef = doc(firebaseDb, 'users', decoded.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        userData = {
          uid: decoded.uid,
          ...userDoc.data()
        };
      } else {
        // User exists in JWT but not in Firebase - still allow but with basic data
        userData = {
          uid: decoded.uid,
          email: decoded.email || null,
          isAdmin: decoded.isAdmin || false
        };
      }
    } catch (firebaseError) {
      console.warn('Firebase user lookup failed, using JWT data only:', firebaseError.message);
      // Fall back to JWT data only
      userData = {
        uid: decoded.uid,
        email: decoded.email || null,
        isAdmin: decoded.isAdmin || false,
        ...decoded
      };
    }

    // Add user data to request object
    req.user = userData;
    
    // Continue to next middleware/route handler
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication error occurred.' 
    });
  }
};

// Admin middleware - checks if authenticated user has admin privileges
const adminMiddleware = (req, res, next) => {
  // Check if user is authenticated first
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required for admin access.' 
    });
  }

  // Check if user has admin privileges
  const isAdmin = req.user.isAdmin === true || 
                  req.user.role === 'admin' || 
                  req.user.userType === 'admin';

  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access required. Insufficient privileges.' 
    });
  }

  // User is admin, continue
  next();
};

// Optional: Middleware to check if user owns the resource
const ownershipMiddleware = (paramName = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required.' 
      });
    }

    const resourceUserId = req.params[paramName];
    const requestingUserId = req.user.uid;

    // Allow if user is admin or owns the resource
    if (req.user.isAdmin || requestingUserId === resourceUserId) {
      next();
    } else {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. You can only access your own resources.' 
      });
    }
  };
};

// Optional: Middleware for optional authentication (sets user if token present)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { uid: decoded.uid, ...decoded };
    } catch (jwtError) {
      // Invalid token, continue without user
      req.user = null;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

module.exports = { 
  authMiddleware, 
  adminMiddleware, 
  ownershipMiddleware,
  optionalAuthMiddleware 
};