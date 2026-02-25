const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { registerUser, loginUser, getUsers, changePassword, updateProfile, uploadAvatar, deleteAvatar } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

// Multer + Cloudinary storage for avatar uploads
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'user-avatars',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
    }
});
const avatarUpload = multer({ storage: avatarStorage });

router.post('/register', registerUser);
router.post('/login', loginUser);

// Admin: get all users
router.get('/users', protect, admin, getUsers);

// Any logged-in user: change own password
router.put('/change-password', protect, changePassword);

// Any logged-in user: update their profile
router.put('/profile', protect, updateProfile);

// Avatar upload & delete
router.put('/avatar', protect, avatarUpload.single('avatar'), uploadAvatar);
router.delete('/avatar', protect, deleteAvatar);

module.exports = router;
