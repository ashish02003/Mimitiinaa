const Order = require('../models/Order');
const Cart = require('../models/Cart');
const axios = require('axios');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create new order (called after payment verification)
// @route   POST /api/orders
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const createOrder = async (req, res) => {
    try {
        const {
            orderItems,
            shippingAddress,
            subtotal,
            packingChargesTotal,
            shippingChargesTotal,
            totalPrice,
            paymentResult   // { razorpay_order_id, razorpay_payment_id, razorpay_signature, status }
        } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        const order = new Order({
            user: req.user._id,
            orderItems,
            shippingAddress,
            subtotal,
            packingChargesTotal: packingChargesTotal || 0,
            shippingChargesTotal: shippingChargesTotal || 0,
            totalPrice,
            paymentMethod: 'razorpay',
            paymentResult,
            isPaid: true,
            paidAt: Date.now(),
            orderStatus: 'Order Confirmed'
        });

        const created = await order.save();

        // Clear the user's cart after order is placed
        try {
            await Cart.findOneAndUpdate(
                { user: req.user._id },
                { $set: { items: [] } }
            );
        } catch (cartErr) {
            console.warn('Could not clear cart after order:', cartErr.message);
        }

        res.status(201).json(created);
    } catch (error) {
        console.error('createOrder error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('orderItems.template', 'name basePrice previewImage')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private (owner or admin)
// ─────────────────────────────────────────────────────────────────────────────
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('orderItems.template', 'name basePrice previewImage');

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Only allow owner or admin
        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'name email phone')
            .populate('orderItems.template', 'name basePrice')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
    try {
        const { orderStatus } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.orderStatus = orderStatus;
        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Mark order as Packed → Create shipment on NimbusPost
// @route   PUT /api/orders/:id/pack
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const markAsPacked = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('orderItems.template', 'name basePrice');

        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (!order.isPaid) return res.status(400).json({ message: 'Order is not paid yet' });

        // ── Create NimbusPost Shipment ────────────────────────────────────────
        const token = process.env.NIMBUSPOST_TOKEN;
        const addr = order.shippingAddress;

        // Build product name string
        const productName = order.orderItems
            .map(i => i.template?.name || 'Custom Product')
            .join(', ');

        const totalQty = order.orderItems.reduce((s, i) => s + (i.quantity || 1), 0);

        // Approximate weight: 500g per item (adjust as needed)
        const weight = (totalQty * 0.5).toFixed(2);

        const nimbusPayload = {
            order_number: order._id.toString(),
            product_name: productName,
            product_quantity: totalQty,
            product_price: order.totalPrice,
            weight: parseFloat(weight),
            payment_mode: 'prepaid',
            length: 15,
            breadth: 12,
            height: 10,
            seller_name: process.env.NIMBUSPOST_SELLER_NAME,
            seller_address: process.env.NIMBUSPOST_SELLER_ADDRESS,
            seller_city: process.env.NIMBUSPOST_SELLER_CITY,
            seller_state: process.env.NIMBUSPOST_SELLER_STATE,
            seller_pincode: process.env.NIMBUSPOST_SELLER_PINCODE,
            seller_phone: process.env.NIMBUSPOST_SELLER_PHONE,
            seller_email: process.env.NIMBUSPOST_SELLER_EMAIL,
            buyer_name: addr.fullName,
            buyer_address: addr.addressLine1 + (addr.addressLine2 ? `, ${addr.addressLine2}` : ''),
            buyer_city: addr.city,
            buyer_state: addr.state,
            buyer_pincode: addr.pincode,
            buyer_phone: addr.phone,
        };

        try {
            const nimbusRes = await axios.post(
                'https://api.nimbuspost.com/v1/shipments',
                nimbusPayload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const nimbusData = nimbusRes.data;
            console.log('NimbusPost response:', nimbusData);

            order.shippingInfo = {
                awbCode: nimbusData.data?.awb_code || nimbusData.awb_code || '',
                courier: nimbusData.data?.courier_name || nimbusData.courier_name || '',
                nimbusOrderId: nimbusData.data?.order_id || nimbusData.order_id || '',
                trackingUrl: nimbusData.data?.tracking_url || nimbusData.tracking_url || '',
                lastStatus: 'Packed',
                lastUpdated: new Date()
            };
        } catch (nimbusErr) {
            // Don't block status update if NimbusPost fails — log and continue
            console.error('NimbusPost API error:', nimbusErr?.response?.data || nimbusErr.message);
            order.shippingInfo = {
                awbCode: '',
                courier: '',
                lastStatus: 'Packed (NimbusPost pending)',
                lastUpdated: new Date()
            };
        }

        order.orderStatus = 'Packed';
        await order.save();

        res.json({
            message: 'Order marked as Packed',
            order,
            awbCode: order.shippingInfo?.awbCode || null
        });
    } catch (error) {
        console.error('markAsPacked error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    markAsPacked
};
