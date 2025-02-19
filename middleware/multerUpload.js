const multer = require("multer");

// Configure multer storage and file name
const storage = multer.memoryStorage();

// // Create multer upload instance
const upload = multer({ storage: storage });

module.exports = upload;
