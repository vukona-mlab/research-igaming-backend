const { firebaseDb } = require("../config/firebase");

// Input validation and sanitization
const validateAndSanitizeBio = (bio) => {
  if (!bio || typeof bio !== 'string') {
    throw new Error("Bio must be a valid string");
  }
  
  const trimmedBio = bio.trim();
  
//   if (trimmedBio.length === 0) {
//     throw new Error("Bio content is required");
//   }
  
  if (trimmedBio.length > 1000) {
    throw new Error("Bio must be less than 1000 characters");
  }
  
  // Basic XSS protection - remove script tags and dangerous HTML
  const sanitized = trimmedBio
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/<[^>]*>/g, ''); // Remove any remaining HTML tags
  
  return sanitized;
};

// Authentication check middleware
const requireAuth = (req, res, next) => {
  if (!req.user || !req.user.uid) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Request validation middleware
const validateRequest = (req, res, next) => {
  // Check Content-Type for POST/PUT requests
  if ((req.method === 'POST' || req.method === 'PUT') && 
      req.headers['content-type'] !== 'application/json') {
    return res.status(400).json({ error: "Content-Type must be application/json" });
  }
  
  // Check request body size (limit to 10KB)
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > 10240) { // 10KB limit
    return res.status(413).json({ error: "Request body too large" });
  }
  
  next();
};

// Create bio
exports.createBio = [requireAuth, validateRequest, async (req, res) => {
  try {
    const { bio } = req.body;
    const userId = req.user.uid;

    // Validate and sanitize input
    let sanitizedBio;
    try {
      sanitizedBio = validateAndSanitizeBio(bio);
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message });
    }

    // Use transaction to prevent race conditions
    const userRef = firebaseDb.collection("users").doc(userId);
    
    try {
      await firebaseDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          throw new Error("User not found");
        }

        const userData = userDoc.data();
        if (userData.bio && userData.bio.trim().length > 0) {
          throw new Error("Bio already exists. Use PUT to update.");
        }

        transaction.update(userRef, {
          bio: sanitizedBio,
          updatedAt: new Date(),
        });
      });

      res.status(201).json({
        message: "Bio created successfully",
        bio: sanitizedBio,
      });

    } catch (transactionError) {
      if (transactionError.message === "User not found") {
        return res.status(404).json({ error: "User not found" });
      }
      if (transactionError.message.includes("Bio already exists")) {
        return res.status(400).json({ error: transactionError.message });
      }
      throw transactionError; // Re-throw for general error handling
    }

  } catch (error) {
    console.error("Bio creation error:", {
      userId: req.user?.uid,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: "Internal server error" });
  }
}];

// Read bio
exports.getBio = [requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.uid;

    // Validate user ID format
    if (!id || typeof id !== 'string' || id.length === 0) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Basic ID format validation (adjust based on your user ID format)
    if (id.length < 10 || id.length > 50) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const userDoc = await firebaseDb.collection("users").doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    
    if (userData.bio) {
      res.status(200).json({
        bio: userData.bio,
        userId: id,
        isOwnBio: requestingUserId === id,
      });
    } else {
      res.status(404).json({ error: "Bio not found for this user" });
    }
  } catch (error) {
    console.error("Bio retrieval error:", {
      requestingUserId: req.user?.uid,
      targetUserId: req.params?.id,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: "Internal server error" });
  }
}];

// Update bio
exports.updateBio = [requireAuth, validateRequest, async (req, res) => {
  try {
    const { bio } = req.body;
    const userId = req.user.uid;

    // Validate and sanitize input
    let sanitizedBio;
    try {
      sanitizedBio = validateAndSanitizeBio(bio);
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message });
    }

    // Use transaction for atomic update
    const userRef = firebaseDb.collection("users").doc(userId);
    
    try {
      await firebaseDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          throw new Error("User not found");
        }

        const userData = userDoc.data();
        if (!userData.bio) {
          throw new Error("Bio not found. Use POST to create.");
        }

        transaction.update(userRef, {
          bio: sanitizedBio,
          updatedAt: new Date(),
        });
      });

      res.status(200).json({
        message: "Bio updated successfully",
        bio: sanitizedBio,
      });

    } catch (transactionError) {
      if (transactionError.message === "User not found") {
        return res.status(404).json({ error: "User not found" });
      }
      if (transactionError.message.includes("Bio not found")) {
        return res.status(404).json({ error: transactionError.message });
      }
      throw transactionError;
    }

  } catch (error) {
    console.error("Bio update error:", {
      userId: req.user?.uid,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: "Internal server error" });
  }
}];

// Delete bio
exports.deleteBio = [requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;

    const userRef = firebaseDb.collection("users").doc(userId);
    
    try {
      await firebaseDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          throw new Error("User not found");
        }

        const userData = userDoc.data();
        if (!userData.bio) {
          throw new Error("Bio not found");
        }

        transaction.update(userRef, {
          bio: "",
          updatedAt: new Date(),
        });
      });

      res.status(200).json({
        message: "Bio deleted successfully",
      });

    } catch (transactionError) {
      if (transactionError.message === "User not found") {
        return res.status(404).json({ error: "User not found" });
      }
      if (transactionError.message === "Bio not found") {
        return res.status(404).json({ error: "Bio not found" });
      }
      throw transactionError;
    }

  } catch (error) {
    console.error("Bio deletion error:", {
      userId: req.user?.uid,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: "Internal server error" });
  }
}];

// Get own bio
exports.getOwnBio = [requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;

    const userDoc = await firebaseDb.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    
    res.status(200).json({
      bio: userData.bio || "",
      hasBio: !!userData.bio,
    });
  } catch (error) {
    console.error("Own bio retrieval error:", {
      userId: req.user?.uid,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: "Internal server error" });
  }
}]; 