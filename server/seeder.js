require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Template = require('./models/Template');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

const seedData = async () => {
    try {
        // Clear existing data
        await User.deleteMany();
        await Template.deleteMany();

        // Create Admin User
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin'
        });

        console.log('Admin User Created');
        console.log('Email: admin@example.com');
        console.log('Password: password123');

        // Create Templates with simple, clean backgrounds

        // iPhone Case Template
        await Template.create({
            name: 'iPhone 13 Case',
            category: 'Mobile Cover',
            basePrice: 19.99,
            previewImage: 'https://picsum.photos/seed/phonepreview/400/600',
            // Background: Random image for phone case
            backgroundImageUrl: 'https://picsum.photos/seed/phone123/450/600',
            createdBy: adminUser._id,
            isActive: true,
            printArea: {
                x: 125,
                y: 150,
                width: 200,
                height: 300
            },
            canvasSettings: {
                "version": "5.3.0",
                "objects": [
                    {
                        "type": "rect",
                        "left": 125,
                        "top": 150,
                        "width": 200,
                        "height": 300,
                        "fill": "rgba(240, 240, 240, 0.7)",
                        "stroke": "#cccccc",
                        "strokeWidth": 2,
                        "strokeDashArray": [5, 5],
                        "selectable": false,
                        "evented": true,
                        "role": "placeholder",
                        "id": "image_placeholder"
                    },
                    {
                        "type": "text",
                        "left": 225,
                        "top": 290,
                        "text": "📱 Click to Upload\nYour Photo",
                        "fontSize": 18,
                        "fill": "#666666",
                        "fontWeight": "bold",
                        "textAlign": "center",
                        "originX": "center",
                        "originY": "center",
                        "selectable": false,
                        "evented": false,
                        "id": "placeholder_text"
                    }
                ]
            }
        });

        // Coffee Mug Template
        await Template.create({
            name: 'Coffee Mug',
            category: 'Mug',
            basePrice: 14.99,
            previewImage: 'https://picsum.photos/seed/mugpreview/400/400',
            // Background: Random image for mug
            backgroundImageUrl: 'https://picsum.photos/seed/mug456/450/600',
            createdBy: adminUser._id,
            isActive: true,
            printArea: {
                x: 100,
                y: 200,
                width: 250,
                height: 200
            },
            canvasSettings: {
                "version": "5.3.0",
                "objects": [
                    {
                        "type": "rect",
                        "left": 100,
                        "top": 200,
                        "width": 250,
                        "height": 200,
                        "fill": "rgba(255, 228, 225, 0.8)",
                        "stroke": "#ff6b6b",
                        "strokeWidth": 3,
                        "strokeDashArray": [10, 5],
                        "selectable": false,
                        "evented": true,
                        "role": "placeholder",
                        "id": "mug_design_area"
                    },
                    {
                        "type": "text",
                        "left": 225,
                        "top": 290,
                        "text": "☕ Click to Upload\nYour Design",
                        "fontSize": 22,
                        "fill": "#ff6b6b",
                        "fontWeight": "bold",
                        "textAlign": "center",
                        "originX": "center",
                        "originY": "center",
                        "selectable": false,
                        "evented": false,
                        "id": "mug_placeholder_text"
                    }
                ]
            }
        });

        // T-Shirt Template
        await Template.create({
            name: 'T-Shirt Design',
            category: 'T-Shirt',
            basePrice: 24.99,
            previewImage: 'https://picsum.photos/seed/tshirtpreview/400/500',
            // Background: Random image for t-shirt
            backgroundImageUrl: 'https://picsum.photos/seed/tshirt789/450/600',
            createdBy: adminUser._id,
            isActive: true,
            printArea: {
                x: 150,
                y: 180,
                width: 150,
                height: 200
            },
            canvasSettings: {
                "version": "5.3.0",
                "objects": [
                    {
                        "type": "rect",
                        "left": 150,
                        "top": 180,
                        "width": 150,
                        "height": 200,
                        "fill": "rgba(227, 242, 253, 0.8)",
                        "stroke": "#2196f3",
                        "strokeWidth": 3,
                        "strokeDashArray": [8, 4],
                        "selectable": false,
                        "evented": true,
                        "role": "placeholder",
                        "id": "tshirt_design_area"
                    },
                    {
                        "type": "text",
                        "left": 225,
                        "top": 270,
                        "text": "👕 Click to Upload\nYour Design",
                        "fontSize": 22,
                        "fill": "#2196f3",
                        "fontWeight": "bold",
                        "textAlign": "center",
                        "originX": "center",
                        "originY": "center",
                        "selectable": false,
                        "evented": false,
                        "id": "tshirt_placeholder_text"
                    }
                ]
            }
        });

        console.log('Sample Templates Created (3 templates with clean backgrounds)');

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedData();
