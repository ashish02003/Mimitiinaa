// const express = require('express');
// const router = express.Router();
// const {
//     processImageWithShapeClipping,
//     addToCart,
//     getCart,
//     removeFromCart
// } = require('../controllers/customizationController');
// const { protect } = require('../middleware/authMiddleware');

// // Process image with shape clipping
// router.post('/clip-image', processImageWithShapeClipping);

// // Cart operations
// router.post('/cart', protect, addToCart);
// router.get('/cart/:userId', protect, getCart);
// router.delete('/cart/:userId/:itemId', protect, removeFromCart);

// module.exports = router;


const express = require('express');
const router = express.Router();
const {
    processImageWithShapeClipping
} = require('../controllers/customizationController');

// @route   POST /api/customization/clip-image
// @desc    Clip user-uploaded image to shape
// @access  Public
router.post('/clip-image', processImageWithShapeClipping);

module.exports = router;