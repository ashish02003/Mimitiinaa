const express = require('express');
const router = express.Router();
const { addToCart, getCartItems, deleteCartItem, clearCart, updateCartItemQuantity } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, addToCart)
    .get(protect, getCartItems)
    .delete(protect, clearCart);

router.route('/:id')
    .put(protect, updateCartItemQuantity)
    .delete(protect, deleteCartItem);

module.exports = router;
