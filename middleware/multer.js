const multer = require('multer');

// Configure Multer storage to store files in memory
const storage = multer.memoryStorage();

// Initialize Multer with the defined storage
const upload = multer({ storage: storage });

module.exports = upload;