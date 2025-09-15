const multer = require("multer");

// Configure multer storage and file name
const storage = multer.memoryStorage();

// Create multer upload instance for multiple files
const uploadArray = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 6 // Maximum number of files
  },
  fileFilter: (req, file, cb) => {
    // Accept images and documents
    if (file.mimetype.startsWith('image/') || 
        file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed!'), false);
    }
  }
});

module.exports = uploadArray;
