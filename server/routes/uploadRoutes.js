const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'product-customization',
        allowed_formats: ['jpg', 'png', 'jpeg']
    }
});

const upload = multer({ storage });

router.post('/', upload.single('image'), (req, res) => {
    try {
        res.json({ url: req.file.path });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Upload failed' });
    }
});

module.exports = router;
