const multer = require("multer");
const path = require("path");
const fs = require("fs");

/**
 * Multer Configuration for Profile Image Upload
 * Stores images in /public/uploads/profiles with timestamp-based naming
 */

// Ensure upload directory exists
const uploadDir = "public/uploads/profiles";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const userId = req.user ? req.user._id : "guest";
    const timestamp = Date.now();
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `citizen-${userId}-${timestamp}${extension}`;
    cb(null, filename);
  },
});

// File filter - only allow image files
const fileFilter = function (req, file, cb) {
  // Allowed image types
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extension = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extension && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, jpg, png, gif, webp) are allowed!"), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: fileFilter,
});

/**
 * Middleware to handle profile image upload
 * Usage: upload.single('profileImage')
 */
const uploadProfileImage = upload.single("profileImage");

/**
 * Error handling middleware for multer errors
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File size too large. Maximum size is 5MB.",
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  next();
};

module.exports = {
  upload,
  uploadProfileImage,
  handleUploadError,
};
