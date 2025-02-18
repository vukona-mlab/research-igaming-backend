const { firebaseAuth, firebaseDb } = require('../config/firebase');

// Register user
exports.register = async (req, res) => {
  const { 
    displayName,
    email, 
    password, 
    name,
    surname,
    jobTitle,
    phoneNumber,
    profilePicture,
    dateOfBirth,
    specialities,
    categories,
    bio,
    roles
  } = req.body;

  try {
    // Create auth user
    const userRecord = await firebaseAuth.createUser({ email, password });
    
    // Create user profile in Firestore
    await firebaseDb.collection('users').doc(userRecord.uid).set({
      displayName,
      name,
      surname,
      email,
      jobTitle,
      phoneNumber,
      profilePicture,
      dateOfBirth,
      specialities: specialities || [],
      categories: categories || [],
      bio,
      roles: roles || ['client'],
      files: {},
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({ 
      message: 'User registered successfully', 
      user: userRecord 
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
    await firebaseDb.collection('users').doc(userId).update({
      roles,
      updatedAt: new Date()
    });
    
    res.status(200).json({ 
      message: 'User roles updated successfully' 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const userDoc = await firebaseDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
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
    const userDoc = await firebaseDb.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Create custom token for the user
    const customToken = await firebaseAuth.createCustomToken(userRecord.uid);

    res.status(200).json({
      message: 'Login successful',
      token: customToken,
      user: {
        uid: userRecord.uid,
        ...userDoc.data()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    // Handle specific Firebase auth errors
    let errorMessage = 'Invalid email or password';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'User not found';
    }
    res.status(401).json({ error: errorMessage });
  }
};

