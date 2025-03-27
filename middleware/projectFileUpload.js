const multer = require("multer");

// Configure multer storage and file name
const storage = multer.memoryStorage();

// Create multer upload instance for project files
const projectFileUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10, // Maximum number of files
  },
  fileFilter: (req, file, cb) => {
    // Accept images and documents
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only images (JPEG, PNG, GIF) and documents (PDF, DOC, DOCX) are allowed!"
        ),
        false
      );
    }
  },
});

module.exports = projectFileUpload;
