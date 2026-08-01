const multer = require('multer');

// Memory storage buffers uploaded files into req.files / req.file as Buffer objects
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB limit
  }
});

module.exports = upload;
