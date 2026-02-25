const Cart = require('../models/Cart');

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
    // Map incoming field names to schema names
    const {
        template,
        customizedJson,
        finalImageUrl,
        price,
        qty
    } = req.body;

    try {
        // Find existing cart for user or create new one
        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = new Cart({
                user: req.user._id,
                items: []
            });
        }

        // Add new item to items array
        // We use the mappings to ensure compatibility with frontend and backend schema
        cart.items.push({
            template: template,
            canvasJSON: customizedJson,
            finalDesignUrl: finalImageUrl,
            price: price,
            quantity: qty || 1
        });

        await cart.save();

        // Return the last added item to match frontend expectation
        const addedItem = cart.items[cart.items.length - 1];
        res.status(201).json(addedItem);
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user cart items
// @route   GET /api/cart
// @access  Private
const getCartItems = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id }).populate('items.template', 'name');

        if (!cart) {
            return res.json([]);
        }

        res.json(cart.items);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
const deleteCartItem = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (cart) {
            cart.items = cart.items.filter(item => item._id.toString() !== req.params.id);
            await cart.save();
            res.json({ message: 'Item removed from cart' });
        } else {
            res.status(404).json({ message: 'Cart not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Clear user cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        res.json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:id
// @access  Private
const updateCartItemQuantity = async (req, res) => {
    const { quantity } = req.body;
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (cart) {
            const item = cart.items.find(item => item._id.toString() === req.params.id);
            if (item) {
                item.quantity = quantity;
                await cart.save();
                res.json(item);
            } else {
                res.status(404).json({ message: 'Item not found in cart' });
            }
        } else {
            res.status(404).json({ message: 'Cart not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addToCart,
    getCartItems,
    deleteCartItem,
    updateCartItemQuantity,
    clearCart
};
