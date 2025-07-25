const {
  firebaseAuth,
  firebaseDb,
  firebaseBucket,
} = require("../config/firebase");
const jwt = require("jsonwebtoken");
const { FieldValue } = require("firebase-admin/firestore");
const { v4: uuidv4 } = require("uuid");
const axios = require('axios');

exports.submitContactUsForm = async(req, res) => {
  const { firstName, email, lastName, phoneNumber, subject, message } = req.body
  const finalMessage = `
    
  `
}
exports.submitChatReport = async(req, res) => {
  // const 
}

