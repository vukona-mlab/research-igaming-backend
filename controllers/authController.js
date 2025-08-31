const {
  firebaseAuth,
  firebaseDb,
  firebaseBucket,
} = require("../config/firebase");
const jwt = require("jsonwebtoken");
const { FieldValue } = require("firebase-admin/firestore");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

// Helper to determine if a user profile is complete
function isProfileCompleted(user) {
  return Boolean(
    user.displayName &&
      user.name &&
      user.surname &&
      user.email &&
      user.profilePicture &&
      user.bio &&
      typeof user.bio === "string" &&
      user.bio.trim().length > 0 &&
      user.phoneNumber &&
      user.phoneNumber !== "undefined"
  );
}

// Register user
exports.register = async (req, res) => {
  const { email, password, jobTitle, experience, jobInterest, roles } =
    req.body;
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
        jobTitle: jobTitle || "",
        phoneNumber: "",
        profilePicture: "",
        dateOfBirth: "",
        specialities: [],
        categories: [],
        bio: "",
        yearsOfExperience: experience || "",
        jobInterest: jobInterest || "",
        extraAmount: {},
        packages: {},
        roles: roles || ["client"],
        files: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        activeStatus: false,
        lastSeen: new Date(),
      });

    // Fetch the created user profile for completeness check
    const userDoc = await firebaseDb
      .collection("users")
      .doc(userRecord.uid)
      .get();
    const userData = userDoc.data();
    const profileCompleted = isProfileCompleted(userData);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        ...userRecord,
        ...userData,
        profileCompleted,
      },
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
exports.updateStatus = async (req, res) => {
  const { userId } = req.params;
  const { blocked } = req.body;
  console.log({ blocked, userId });
  
  try {
    await firebaseDb.collection("users").doc(userId).update({
      blocked,
      updatedAt: new Date(),
    });

    res.status(200).json({
      message: "User status updated successfully",
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
    const userData = userDoc.data();
    const profileCompleted = isProfileCompleted(userData);
    res.status(200).json({ user: { ...userData, profileCompleted } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password, deviceToken } = req.body;

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
    const userData = userDoc.data();
    const profileCompleted = isProfileCompleted(userData);
    const devices = userDoc.data().devices ?? [];
    console.log({ devices });
    console.log({ includes: devices.includes(deviceToken) });
    if (deviceToken !== undefined) {
      if (devices === undefined || !devices.includes(deviceToken)) {
        console.log("trying to push device");
        console.log({ deviceToken });

        devices.push(deviceToken);
        console.log({ devices });
      }
    }
    //update active status
    await firebaseDb.collection("users").doc(userRecord.uid).update({
      activeStatus: true,
      updatedAt: new Date(),
      lastSeen: new Date(),
      devices: devices,
    });
    setImmediate(async () => {
      firebaseDb.collection("users");
    });
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
        ...userData,
        profileCompleted,
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
      categories,
      packages,
      jobTitle,
    } = req.body;
    console.log({ packages });
    console.log(req.body);

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
        updateObj.profilePicture = imageUrl[0];
      } catch (err) {}
    }
    if (name !== "" && typeof name !== "undefined") {
      updateObj.name = name;
    }
    if (surname !== "" && typeof surname !== "undefined") {
      updateObj.surname = surname;
    }
    if (displayName !== "" && typeof displayName !== "undefined") {
      updateObj.displayName = displayName;
    }
    // Phone number: only update if valid (not empty, not 'undefined', not whitespace)
    // In your backend update function, replace the phoneNumber validation with:
    if (
      typeof phoneNumber !== "undefined" &&
      typeof phoneNumber === "string" &&
      phoneNumber.trim() !== "" &&
      phoneNumber !== "undefined" &&
      phoneNumber.toLowerCase() !== "undefined"
    ) {
      const phonePattern = /^\+?[0-9]{7,15}$/;
      if (phonePattern.test(phoneNumber.trim())) {
        updateObj.phoneNumber = phoneNumber.trim();
      }
    } else if (phoneNumber === "undefined" || phoneNumber === "") {
      updateObj.phoneNumber = "";
    }

    // Specialities: always store as array
    if (typeof speciality !== "undefined" && speciality !== "") {
      if (Array.isArray(speciality)) {
        updateObj.specialities = speciality
          .filter((s) => typeof s === "string" && s.trim() !== "")
          .map((s) => s.trim());
      } else if (typeof speciality === "string") {
        // If comma-separated, split; else, single value
        if (speciality.includes(",")) {
          updateObj.specialities = speciality
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        } else {
          updateObj.specialities = [speciality.trim()];
        }
      }
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
    if (categories !== "" && typeof categories !== "undefined") {
      console.log("running c");
      updateObj.categories = categories;
    }
    if (packages !== "" && typeof packages !== "undefined") {
      updateObj.packages = packages;
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
        const updatedUserDoc = await firebaseDb
          .collection("users")
          .doc(userId)
          .get();
        const updatedUser = updatedUserDoc.data();
        const profileCompleted = isProfileCompleted(updatedUser);
        res.status(200).json({ user: { ...updatedUser, profileCompleted } });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occured during update" });
  }
};

// Google Sign In
exports.googleSignIn = async (req, res) => {
  try {
    const { idToken, roles, deviceToken } = req.body;
    console.log({ deviceToken });

    // Verify the Google ID token
    const credential = await firebaseAuth.verifyIdToken(idToken);
    const { uid, email, name, picture } = credential;

    // Check if user exists in Firestore
    const userDoc = await firebaseDb.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      // Create new user profile if doesn't exist
      await firebaseDb
        .collection("users")
        .doc(uid)
        .set({
          displayName: name || "",
          email: email,
          profilePicture: picture || "",
          roles: roles || ["client"],
          createdAt: new Date(),
          updatedAt: new Date(),
          activeStatus: false,
          lastSeen: new Date(),
        });
    }
    const userData = userDoc.data();
    const profileCompleted = isProfileCompleted(userData);
    const devices = userDoc.data().devices ?? [];
    console.log({ devices });
    console.log({ includes: devices.includes(deviceToken) });
    if (deviceToken !== undefined) {
      if (devices === undefined || !devices.includes(deviceToken)) {
        console.log("trying to push device");
        console.log({ deviceToken });

        devices.push(deviceToken);
        console.log({ devices });
      }
    }

    console.log("checking device");
    console.log({ devices });
    //update active status
    await firebaseDb.collection("users").doc(uid).update({
      activeStatus: true,
      updatedAt: new Date(),
      lastSeen: new Date(),
      devices: devices,
    });

    // Generate JWT token
    const token = jwt.sign({ uid }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Google sign-in successful",
      token: `Bearer ${token}`,
      user: {
        uid,
        ...userData,
        profileCompleted,
      },
    });
  } catch (error) {
    console.error("Google Sign-in Error:", error);
    res.status(401).json({ error: "Invalid Google token" });
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

exports.uploadDocuments = async (req, res) => {
  try {
    const { documentsArr } = req.body;
    const userId = req.user.uid;
    console.log({ documentsArr });

    let documents = [];
    if (!documentsArr) {
      return res.status(403).json({ error: "Missing field required" });
    }
    const updatedDocs = documentsArr.map((document) => {
      if (typeof document === "string") {
        let parsedDoc = JSON.parse(document);
        return parsedDoc;
      }
      return document;
    });
    const userDoc = await firebaseDb.collection("users").doc(userId).get();
    const userData = userDoc.data();
    const existingDocs = userData.documents;
    documents = [...existingDocs];
    if (typeof req.files !== "undefined") {
      await Promise.all(
        req.files.map(async (file) => {
          const buffer = file.buffer;
          const extension = file.originalname.substring(
            file.originalname.indexOf(".") + 1
          );
          const doc = updatedDocs.find(
            (obj) => obj.documentName === file.originalname
          );

          const docExist = existingDocs.filter(
            (d) => d.id && doc && d.documentType == doc.documentType
          );
          console.log({ doc, docExist });

          const id = docExist.length > 0 ? docExist[0].id : uuidv4();

          const uploadedFile = firebaseBucket.file(
            `documents/${userId}/` + id + "." + extension
          );
          const resp = await uploadedFile.save(buffer, {});
          const [documentUrl] = await uploadedFile.getSignedUrl({
            action: "read",
            expires: "03-09-2491",
          });
          let updatedDocsArr = [];
          if (docExist.length > 0) {
            console.log("running");
            updatedDocsArr = documents.map((obj) => {
              if (obj.id === docExist[0].id) {
                let newObj = {
                  ...docExist[0],
                  documentName: file.originalname,
                  dateAdded: (doc && doc.dateAdded) || "",
                  status: "pending",
                  url: documentUrl,
                };
                return newObj;
              }
              return obj;
            });
            documents = updatedDocsArr;
          } else {
            documents.push({
              id: id,
              documentName: file.originalname,
              documentType: (doc && doc.documentType) || "",
              dateAdded: (doc && doc.dateAdded) || "",
              status: "pending",
              url: documentUrl,
            });
          }
        })
      );
    }

    let updateObj = {};
    if (documents.length !== 0 && typeof documents !== "undefined") {
      updateObj.documents = documents;
    }

    if (JSON.stringify(updateObj) !== "{}") {
      try {
        const result = await firebaseDb
          .collection("users")
          .doc(userId)
          .update("documents", documents);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
    res.status(201).json({ message: "User documents uploaded succesfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { docId } = req.body;
    const userId = req.user.uid;
    if (!docId) {
      return res.status(403).json({ error: "Missing field required" });
    }
    const userDoc = await firebaseDb.collection("users").doc(userId).get();
    const user = userDoc.data();
    const documents = user.documents;

    if (!documents || documents.length === 0) {
      return res.status(403).json({ error: "User has no documents" });
    }
    firebaseBucket.deleteFiles({
      prefix: `documents/${userId}/` + docId,
    });
    const filteredArr = documents.filter((doc) => doc.id !== docId);

    const result = await firebaseDb
      .collection("users")
      .doc(userId)
      .update("documents", filteredArr);
    res
      .status(201)
      .json({ message: "User document has been deleted succesfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// Create admin account (only super admins can create other admins)
exports.createAdmin = async (req, res) => {
  const { email, password, name, surname } = req.body;

  try {
    // Check if requester is a super admin
    const requesterDoc = await firebaseDb
      .collection("admins")
      .doc(req.user.uid)
      .get();
    if (
      !requesterDoc.exists ||
      !requesterDoc.data().roles.includes("super_admin")
    ) {
      return res
        .status(403)
        .json({ error: "Only super admins can create admin accounts" });
    }

    // Create auth user
    const userRecord = await firebaseAuth.createUser({ email, password });

    // Create admin profile in Firestore
    await firebaseDb
      .collection("admins")
      .doc(userRecord.uid)
      .set({
        displayName: `${name} ${surname}`,
        name,
        surname,
        email,
        roles: ["admin"],
        createdAt: new Date(),
        updatedAt: new Date(),
        activeStatus: false,
        lastSeen: new Date(),
        createdBy: req.user.uid,
      });

    res.status(201).json({
      message: "Admin account created successfully",
      user: userRecord,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Get all admins (super admin and admin only)
exports.getAllAdminIds = async (req, res) => {
  try {
    // Check if requester is a super admin or admin

    const adminsSnapshot = await firebaseDb
      .collection("admins")
      .where("roles", "in", [["super_admin"]])
      .get();

    const admins = [];
    adminsSnapshot.forEach((doc) => {
      admins.push({ id: doc.id });
    });

    res.status(200).json({ admins });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all admins (super admin and admin only)
exports.getAllAdmins = async (req, res) => {
  try {
    // Check if requester is a super admin or admin
    const requesterDoc = await firebaseDb
      .collection("admins")
      .doc(req.user.uid)
      .get();
    if (
      !requesterDoc.exists ||
      (!requesterDoc.data().roles.includes("super_admin") &&
        !requesterDoc.data().roles.includes("admin"))
    ) {
      return res
        .status(403)
        .json({ error: "Only admins can view the admin list" });
    }

    const adminsSnapshot = await firebaseDb
      .collection("admins")
      .where("roles", "in", [["admin"], ["super_admin"]])
      .get();

    const admins = [];
    adminsSnapshot.forEach((doc) => {
      admins.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json({ admins });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update admin (super admin only)
exports.updateAdmin = async (req, res) => {
  const { adminId } = req.params;
  const updateData = req.body;

  try {
    // Check if requester is a super admin
    const requesterDoc = await firebaseDb
      .collection("admins")
      .doc(req.user.uid)
      .get();
    if (
      !requesterDoc.exists ||
      !requesterDoc.data().roles.includes("super_admin")
    ) {
      return res
        .status(403)
        .json({ error: "Only super admins can update admin accounts" });
    }

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.roles;
    delete updateData.createdAt;
    delete updateData.createdBy;

    await firebaseDb
      .collection("admins")
      .doc(adminId)
      .update({
        ...updateData,
        updatedAt: new Date(),
      });

    res.status(200).json({ message: "Admin updated successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete admin (super admin only)
exports.deleteAdmin = async (req, res) => {
  const { adminId } = req.params;

  try {
    // Check if requester is a super admin
    const requesterDoc = await firebaseDb
      .collection("admins")
      .doc(req.user.uid)
      .get();
    if (
      !requesterDoc.exists ||
      !requesterDoc.data().roles.includes("super_admin")
    ) {
      return res
        .status(403)
        .json({ error: "Only super admins can delete admin accounts" });
    }

    // Delete from Authentication
    await firebaseAuth.deleteUser(adminId);

    // Delete from Firestore
    await firebaseDb.collection("admins").doc(adminId).delete();

    res.status(200).json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Admin login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Verify credentials using Firebase Auth REST API
    try {
      const response = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      );

      const { localId: uid } = response.data;

      // Check if user exists in admins collection
      const adminDoc = await firebaseDb.collection("admins").doc(uid).get();

      if (!adminDoc.exists) {
        console.error(
          "Admin login attempt failed: User not found in admins collection"
        );
        return res
          .status(403)
          .json({ error: "Unauthorized - Admin access only" });
      }

      const adminData = adminDoc.data();
      const roles = adminData.roles || [];

      // Generate JWT token
      const token = jwt.sign(
        {
          uid,
          email,
          roles,
          type: "admin",
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(200).json({
        message: "Admin login successful",
        token: `Bearer ${token}`,
        user: {
          uid,
          email,
          roles,
          displayName: adminData.displayName,
        },
      });
    } catch (authError) {
      console.error(
        "Admin authentication error:",
        authError.response?.data || authError
      );
      return res.status(401).json({
        error: "Invalid email or password",
        details:
          process.env.NODE_ENV === "development"
            ? authError.message
            : undefined,
      });
    }
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({
      error: "Login failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Initialize Super Admin (can only be used once when no super admin exists)
exports.initializeSuperAdmin = async (req, res) => {
  try {
    const { email, password, name, surname, secretKey } = req.body;

    // Verify secret key from environment variable
    if (secretKey !== process.env.SUPER_ADMIN_SECRET_KEY) {
      return res.status(403).json({ error: "Invalid secret key" });
    }

    // Check if any super admin already exists
    const superAdminCheck = await firebaseDb
      .collection("admins")
      .where("roles", "array-contains", "super_admin")
      .get();

    if (!superAdminCheck.empty) {
      return res.status(403).json({ error: "Super admin already exists" });
    }

    // Create auth user
    const userRecord = await firebaseAuth.createUser({
      email,
      password,
      displayName: `${name} ${surname}`,
    });

    // Create super admin profile in Firestore
    await firebaseDb
      .collection("admins")
      .doc(userRecord.uid)
      .set({
        displayName: `${name} ${surname}`,
        name,
        surname,
        email,
        roles: ["super_admin"],
        createdAt: new Date(),
        updatedAt: new Date(),
        activeStatus: false,
        lastSeen: new Date(),
        isInitialSuperAdmin: true,
      });

    res.status(201).json({
      message: "Super admin initialized successfully",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get admin profile
exports.getAdminProfile = async (req, res) => {
  const { adminId } = req.params;

  try {
    // Check if requester is an admin or super admin
    const requesterDoc = await firebaseDb
      .collection("admins")
      .doc(req.user.uid)
      .get();
    if (!requesterDoc.exists) {
      return res.status(403).json({ error: "Access denied" });
    }

    const requesterData = requesterDoc.data();
    const isSuperAdmin = requesterData.roles.includes("super_admin");
    const isAdmin = requesterData.roles.includes("admin");

    // Allow access if user is super_admin or admin
    if (!isSuperAdmin && !isAdmin) {
      return res
        .status(403)
        .json({ error: "Access denied - Admin privileges required" });
    }

    // Get admin profile
    const adminDoc = await firebaseDb.collection("admins").doc(adminId).get();
    if (!adminDoc.exists) {
      return res.status(404).json({ error: "Admin profile not found" });
    }

    const adminData = adminDoc.data();
    // Remove sensitive information
    delete adminData.createdBy;

    res.status(200).json({
      profile: {
        id: adminDoc.id,
        ...adminData,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update admin profile
exports.updateAdminProfile = async (req, res) => {
  const { adminId } = req.params;
  const updateData = req.body;

  try {
    // Check if requester is an admin or super admin
    const requesterDoc = await firebaseDb
      .collection("admins")
      .doc(req.user.uid)
      .get();
    if (!requesterDoc.exists) {
      return res.status(403).json({ error: "Access denied" });
    }

    const requesterData = requesterDoc.data();
    const isSuperAdmin = requesterData.roles.includes("super_admin");

    // Regular admins can only update their own profile
    if (!isSuperAdmin && req.user.uid !== adminId) {
      return res
        .status(403)
        .json({ error: "You can only update your own profile" });
    }

    // Get admin profile
    const adminDoc = await firebaseDb.collection("admins").doc(adminId).get();
    if (!adminDoc.exists) {
      return res.status(404).json({ error: "Admin profile not found" });
    }

    // Handle profile picture upload if present
    if (req.file) {
      try {
        const buffer = req.file.buffer;
        const extension = req.file.originalname.split(".").pop();
        const fileName = `admin-profile-pictures/${adminId}.${extension}`;
        const file = firebaseBucket.file(fileName);

        await file.save(buffer, {
          metadata: {
            contentType: req.file.mimetype,
          },
        });

        const [url] = await file.getSignedUrl({
          action: "read",
          expires: "03-09-2491",
        });

        updateData.profilePicture = url;
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        return res
          .status(500)
          .json({ error: "Failed to upload profile picture" });
      }
    }

    // Remove fields that shouldn't be updated
    const protectedFields = ["roles", "createdAt", "createdBy", "email"];
    protectedFields.forEach((field) => delete updateData[field]);

    // Additional protected fields for non-super admins
    if (!isSuperAdmin) {
      delete updateData.isInitialSuperAdmin;
    }

    // Validate required fields
    if (updateData.name === "" || updateData.surname === "") {
      return res
        .status(400)
        .json({ error: "Name and surname cannot be empty" });
    }

    // Validate Date of Birth (YYYY-MM-DD format)
    if (updateData.dob && !/^\d{4}-\d{2}-\d{2}$/.test(updateData.dob)) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    // Update the profile
    await firebaseDb
      .collection("admins")
      .doc(adminId)
      .update({
        ...updateData,
        displayName: `${updateData.name || adminDoc.data().name} ${
          updateData.surname || adminDoc.data().surname
        }`,
        updatedAt: new Date(),
      });

    res.status(200).json({
      message: "Profile updated successfully",
      updatedFields: Object.keys(updateData),
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    res.status(400).json({ error: error.message });
  }
};
