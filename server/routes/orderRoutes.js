// const express = require('express');
// const router = express.Router();
// const { addOrderItems, getMyOrders, getOrders } = require('../controllers/orderController');
// const { protect, admin } = require('../middleware/authMiddleware');

// router.route('/')
//     .post(protect, addOrderItems)
//     .get(protect, admin, getOrders);

// router.route('/myorders').get(protect, getMyOrders);

// module.exports = router;


const mongoose = require('mongoose');

const customizationSchema = new mongoose.Schema({
    shapeId: {
        type: String,
        required: true
    },
    shapeType: {
        type: String,
        enum: ['star', 'heart', 'circle', 'rectangle', 'custom'],
        required: true
    },
    uploadedImageUrl: {
        type: String, // Original uploaded image from Cloudinary
        required: true
    },
    clippedImageUrl: {
        type: String, // Processed image clipped to shape from Cloudinary
        required: true
    },
    cloudinaryPublicId: {
        type: String // For deletion if needed
    },
    position: {
        x: Number,
        y: Number
    },
    size: {
        width: Number,
        height: Number
    }
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
    template: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
        required: true
    },
    customizations: [customizationSchema],
    finalDesignUrl: {
        type: String // Composite image with all customizations
    },
    canvasJSON: {
        type: Object // Fabric.js canvas state for editing
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    price: {
        type: Number,
        required: true
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [orderItemSchema],
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'cancelled'],
        default: 'pending'
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);