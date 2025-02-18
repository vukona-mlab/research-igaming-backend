const firebase = require("firebase-admin");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Construct service account object from environment variables
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Handle escaped newlines
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

// Initialize Firebase
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
});

// Export both auth and firestore
const firebaseAuth = firebase.auth();
const firebaseDb = firebase.firestore();

module.exports = { firebaseAuth, firebaseDb };
