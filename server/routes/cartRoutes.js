const express = require('express');
const router = express.Router();
const { addToCart, getCartItems, deleteCartItem, clearCart } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, addToCart)
    .get(protect, getCartItems)
    .delete(protect, clearCart);

router.route('/:id')
    .delete(protect, deleteCartItem);

module.exports = router;
