const multer = require('multer');
const os = require('os');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(os.tmpdir(), 'mini-insta-uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Keep the original extension so Cloudinary knows if it's an image or video
        const ext = path.extname(file.originalname) || '';
        cb(null, file.fieldname + '-' + Date.now() + ext);
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
