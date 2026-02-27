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

        const Template = require('../models/Template');
        const templateDoc = await Template.findById(template).select('packingCharges shippingCharges');

        // Add new item to items array
        cart.items.push({
            template: template,
            canvasJSON: customizedJson,
            finalDesignUrl: finalImageUrl,
            price: price,
            quantity: qty || 1,
            packingCharges: templateDoc?.packingCharges || 0,
            shippingCharges: templateDoc?.shippingCharges || 0
        });

        await cart.save();

        // Populate for newly added item to get template charges
        await cart.populate({
            path: 'items.template',
            select: 'name packingCharges shippingCharges'
        });

        // Return the last added item enriched with charges
        const addedItem = cart.items[cart.items.length - 1].toObject();
        addedItem.packingCharges = addedItem.template?.packingCharges ?? 0;
        addedItem.shippingCharges = addedItem.template?.shippingCharges ?? 0;

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
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.template', 'name packingCharges shippingCharges');

        if (!cart) {
            return res.json([]);
        }

        // Merge template pricing charges into each cart item for frontend use
        const enrichedItems = cart.items.map(item => {
            const obj = item.toObject();
            obj.packingCharges = item.packingCharges ?? item.template?.packingCharges ?? 0;
            obj.shippingCharges = item.shippingCharges ?? item.template?.shippingCharges ?? 0;
            return obj;
        });

        res.json(enrichedItems);
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
