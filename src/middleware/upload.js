const path = require('path');
const fs = require('fs');
const multer = require('multer');
const env = require('../config/env');

const uploadDir = path.resolve(env.upload.dir);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image files are allowed'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.upload.maxSizeMb * 1024 * 1024 },
});

module.exports = upload;
