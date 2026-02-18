const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    orderItems: [
        {
            template: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Template'
            },
            customizedJson: {
                type: Object, // The final Fabric.js JSON state
                required: true
            },
            finalImageUrl: {
                type: String, // The rendered image URL
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            qty: {
                type: Number,
                required: true,
                default: 1
            }

        }
    ],
    totalPrice: {
        type: Number,
        required: true
    },
    isPaid: {
        type: Boolean,
        required: true,
        default: false
    },
    paidAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
