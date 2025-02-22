const {
  firebaseAuth,
  firebaseDb,
  firebaseBucket,
} = require("../config/firebase");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { OAuth2Client } = require('google-auth-library');

// Initialize the OAuth2 client
const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

// Register user
exports.register = async (req, res) => {
  const { email, password, roles } = req.body;
  try {
    // Create auth user
    const userRecord = await firebaseAuth.createUser({ email, password });

    // Create user profile in Firestore
    await firebaseDb
      .collection("users")
      .doc(userRecord.uid)
      .set({
        displayName: "",
        name: "",
        surname: "",
        email: email,
        jobTitle: "",
        phoneNumber: "",
        profilePicture: "",
        dateOfBirth: "",
        specialities: [],
        categories: [],
        bio: "",
        roles: roles || ["client"],
        files: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    res.status(201).json({
      message: "User registered successfully",
      user: userRecord,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update user role
exports.updateRole = async (req, res) => {
  const { userId } = req.params;
  const { roles } = req.body;

  try {
    await firebaseDb.collection("users").doc(userId).update({
      roles,
      updatedAt: new Date(),
    });

    res.status(200).json({
      message: "User roles updated successfully",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  const { userId } = req.params;

  try {
    const userDoc = await firebaseDb.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user: userDoc.data() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Get user by email
    const userRecord = await firebaseAuth.getUserByEmail(email);

    // Get user profile from Firestore
    const userDoc = await firebaseDb
      .collection("users")
      .doc(userRecord.uid)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User profile not found" });
    }

    // Generate JWT token
    const payload = { uid: userRecord.uid };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    }); // expires in 1 hour

    res.status(200).json({
      message: "Login successful",
      token: `Bearer ${token}`,
      user: {
        uid: userRecord.uid,
        ...userDoc.data(),
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    // Handle specific Firebase auth errors
    let errorMessage = "Invalid email or password";
    if (error.code === "auth/user-not-found") {
      errorMessage = "User not found";
    }
    res.status(401).json({ error: errorMessage });
  }
};

exports.update = async (req, res) => {
  const { userId } = req.params;
  try {
    const {
      name,
      surname,
      displayName,
      phoneNumber,
      email,
      dateOfBirth,
      bio,
      speciality,
      category,
      extraAmount,
      jobTitle,
    } = req.body;
    if (JSON.stringify(req.body) === "{}" && typeof req.file === "undefined") {
      res.status(500).json({ error: "Must have atleast one field to update" });
    }
    let updateObj = {};
    if (req.file !== "undefined") {
      try {
        //upload image and get url

        const buffer = req.file.buffer;
        const extension = req.file.originalname.substring(
          req.file.originalname.indexOf(".") + 1
        );
        const file = firebaseBucket.file(
          "profile-pictures/" + userId + "." + extension
        );
        const resp = await file.save(buffer, {});
        const imageUrl = await file.getSignedUrl({
          action: "read",
          expires: "03-09-2491",
        });

        updateObj.profilePicture = imageUrl;
      } catch (err) {}
    }
    if (name !== "" && typeof name !== "undefined") {
      updateObj.name = name;
    }
    if (surname !== "" && typeof surname !== "undefined") {
      updateObj.surname = surname;
    }
    if (displayName !== "" && typeof displayName !== "undefined") {
      updateObj.surname = surname;
    }
    if (phoneNumber !== "" && typeof phoneNumber !== "undefined") {
      updateObj.phoneNumber = phoneNumber;
    }
    if (email !== "" && typeof email !== "undefined") {
      updateObj.email = email;
    }
    if (dateOfBirth !== "" && typeof dateOfBirth !== "undefined") {
      updateObj.dateOfBirth = dateOfBirth;
    }
    if (bio !== "" && typeof bio !== "undefined") {
      updateObj.bio = bio;
    }
    if (speciality !== "" && typeof speciality !== "undefined") {
      updateObj.speciality = speciality;
    }
    if (category !== "" && typeof category !== "undefined") {
      updateObj.category = category;
    }
    if (extraAmount !== "" && typeof extraAmount !== "undefined") {
      updateObj.extraAmount = extraAmount;
    }
    if (jobTitle !== "" && typeof jobTitle !== "undefined") {
      updateObj.jobTitle = jobTitle;
    }

    if (JSON.stringify(updateObj) !== "{}") {
      try {
        const result = await firebaseDb
          .collection("users")
          .doc(userId)
          .update(updateObj);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }

    res.status(201).json({ message: "User has been updated succesfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occured during update" });
  }
};

// Google Sign In
exports.googleSignIn = async (req, res, next) => {
  const { idToken } = req.body;
  console.log('Received ID token:', idToken?.substring(0, 20) + '...'); 

  try {
    // Verify the Google ID token first
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.VITE_GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    
    // Use email as unique identifier
    const { email, name, picture, sub: googleId } = payload;

    try {
      // Try to get existing Firebase user
      const userRecord = await firebaseAuth.getUserByEmail(email);
      const uid = userRecord.uid;
      
      // Check if user exists in Firestore
      const userDoc = await firebaseDb.collection("users").doc(uid).get();

      if (!userDoc.exists) {
        // Create user profile if it doesn't exist
        await firebaseDb.collection("users").doc(uid).set({
          displayName: name || "",
          email: email,
          profilePicture: picture || "",
          roles: ["client"],
          googleId: googleId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Generate JWT token
      const token = jwt.sign({ uid }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.status(200).json({
        message: "Google sign-in successful",
        token: `Bearer ${token}`,
        user: {
          uid,
          ...(userDoc.exists ? userDoc.data() : {}),
        },
      });

    } catch (firebaseError) {
      // User doesn't exist in Firebase, create new user
      const newUserRecord = await firebaseAuth.createUser({
        email: email,
        displayName: name,
        photoURL: picture,
      });

      // Create user profile in Firestore
      await firebaseDb.collection("users").doc(newUserRecord.uid).set({
        displayName: name || "",
        email: email,
        profilePicture: picture || "",
        roles: ["client"],
        googleId: googleId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Generate JWT token
      const token = jwt.sign({ uid: newUserRecord.uid }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.status(200).json({
        message: "Google sign-in successful",
        token: `Bearer ${token}`,
        user: {
          uid: newUserRecord.uid,
          displayName: name,
          email: email,
          profilePicture: picture,
          roles: ["client"],
        },
      });
    }

  } catch (error) {
    console.error("Detailed Google Sign-in Error:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(401).json({ 
      error: "Invalid Google token",
      details: error.message 
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, displayName } = req.body;
    firebaseAuth
      .generatePasswordResetLink(email)
      .then((link) => {
        //return sendCustomPasswordResetEmail(email, displayName, link);
      })
      .catch((error) => {
        // Some error occurred.
      });

    res.status(200).json({ message: "Reset email sent" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.deleteAccount = async (req, res) => {
  const { id } = req.params;

  // Ensure user can only delete their own account
  if (req.user.uid !== id) {
    return res
      .status(403)
      .json({ error: "Forbidden: You can only delete your own account" });
  }

  try {
    // Get user profile from Firestore
    const userDoc = await firebaseDb.collection("users").doc(id).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    // Delete profile picture from Firebase Storage (if exists)
    if (userData.profilePicture) {
      try {
        const filePath = userData.profilePicture.split("/").pop(); // Extract file name
        await firebaseBucket.file(`profile-pictures/${filePath}`).delete();
      } catch (err) {
        console.warn("Profile picture deletion failed:", err.message);
      }
    }

    // Delete user document from Firestore
    await firebaseDb.collection("users").doc(id).delete();

    // Delete user from Firebase Authentication
    await firebaseAuth.deleteUser(id);

    res.status(200).json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the account" });
  }
};
