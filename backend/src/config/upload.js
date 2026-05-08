const multer = require("multer");
const path = require("path");

// Storage configuration
const storage = multer.memoryStorage();

// File filter (images only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error("Hanya file gambar (JPEG/PNG) yang diperbolehkan!"));
};

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
  fileFilter,
});

module.exports = upload;
