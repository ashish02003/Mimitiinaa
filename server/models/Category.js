const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    image: {
        type: String, // URL from Cloudinary (optional)
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    stock: {
        type: Number,
        default: 0
    },
    dimensions: {
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 }
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);


