const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'product-customization',
        // Allow common phone/browser image formats too (e.g. WebP/HEIC)
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'heic', 'heif']
    }
});

const upload = multer({ storage });

router.post('/', (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({
                message: err.message || 'Upload failed',
                error: err.message
            });
        }
        if (!req.file?.path) {
            return res.status(400).json({ message: 'No file uploaded. Field name must be "image".' });
        }
        return res.json({ url: req.file.path });
    });
});

module.exports = router;
