// middleware/checkProfileCompleted.js
const { firebaseDb } = require('../config/firebase'); 

module.exports = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ 
        error: "Authentication required",
        code: "AUTH_REQUIRED"
      });
    }

    const userId = req.user.uid;
    
    // Get user document from Firestore
    const userDoc = await firebaseDb.collection("users").doc(userId).get();
    
    // Check if user document exists
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: "User profile not found",
        code: "USER_NOT_FOUND"
      });
    }

    const userData = userDoc.data();
    
    // Check if profile is completed
    const profileCompleted = checkIfProfileCompleted(userData);
    
    if (!profileCompleted) {
      return res.status(403).json({ 
        error: "Complete your profile to access this feature",
        code: "PROFILE_INCOMPLETE",
        missingFields: getMissingFields(userData) // Optional: tell user what's missing
      });
    }

    // Attach user data to request for use in route handlers
    req.userData = userData;
    
    next();
  } catch (error) {
    console.error('Profile completion check error:', error);
    return res.status(500).json({ 
      error: "Internal server error",
      code: "SERVER_ERROR"
    });
  }
};

// Helper function to check if profile is completed
function checkIfProfileCompleted(userData) {
  const requiredFields = ['name', 'email', 'profilePicture', 'bio']; // Define required fields
  
  if (!userData) return false;
  
  return requiredFields.every(field => 
    userData[field] && 
    typeof userData[field] === 'string' && 
    userData[field].trim() !== ''
  );
}

// Helper function to identify missing required fields
function getMissingFields(userData) {
  const requiredFields = ['name', 'email', 'profilePicture', 'bio']; // Adjust as needed
  return requiredFields.filter(field => !userData[field] || userData[field] === '');
}