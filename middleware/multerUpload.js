const multer = require("multer");

// Configure multer storage and file name
const storage = multer.memoryStorage();

// // Create multer upload instance
const upload = multer({ storage: storage }).single("profilePicture");
const uploads = multer({ storage });

module.exports = upload;
