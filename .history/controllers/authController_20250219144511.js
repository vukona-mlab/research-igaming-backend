const {
  firebaseAuth,
  firebaseDb,
  firebaseBucket,
} = require("../config/firebase");
const jwt = require("jsonwebtoken");

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
  const { id } = req.params;
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
          "profile-pictures/" + id + "." + extension
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
          .doc(id)
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
