const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Template = require('./models/Template');

dotenv.config({ path: 'server/.env' });

const seedTemplates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const templates = [
            {
                name: 'Abstract Phone Case',
                category: 'Mobile Cover',
                previewImage: 'https://via.placeholder.com/300x600.png?text=Preview+Case',
                overlayImageUrl: 'https://via.placeholder.com/300x600.png/000000/FFFFFF?text=Overlay+Frame', // In real app, this should be a transparent PNG
                maskImageUrl: '',
                basePrice: 499,
                canvasSettings: {
                    version: "5.3.0",
                    objects: [] // Empty fabric objects for now
                },
                isActive: true
            },
            {
                name: 'Classic White T-Shirt',
                category: 'T-Shirt',
                basePrice: 499,
                previewImage: 'https://img.freepik.com/premium-psd/t-shirt-mockup-design_1310-252.jpg',
                overlayImageUrl: 'https://img.freepik.com/premium-psd/t-shirt-mockup-design_1310-252.jpg', // Using same for demo
                canvasSettings: {
                    version: "5.3.0",
                    objects: []
                },
                printArea: { x: 120, y: 150, width: 220, height: 300 }, // Define Chest Area
                isActive: true
            },
            {
                name: 'Family Photo Frame',
                category: 'Mobile Cover',
                previewImage: 'https://via.placeholder.com/300x600.png?text=Family+Preview',
                overlayImageUrl: 'https://via.placeholder.com/300x600.png/FF0000/FFFFFF?text=Heart+Frame',
                basePrice: 599,
                canvasSettings: {
                    version: "5.3.0",
                    objects: []
                },
                isActive: true
            },
            {
                name: 'Valentine Love Mug',
                category: 'Mug',
                basePrice: 299,
                // 3D Overlay (Mug with transparent middle) - For Preview Modal
                overlayImageUrl: 'https://img.freepik.com/premium-psd/white-mug-mockup_1310-721.jpg',
                canvasSettings: {
                    version: "5.3.0",
                    objects: [
                        // Placeholder Box 1
                        {
                            type: 'rect',
                            version: '5.3.0',
                            originX: 'center',
                            originY: 'center',
                            left: 100,
                            top: 150,
                            width: 150,
                            height: 150,
                            fill: '#e0e0e0',
                            stroke: '#999',
                            strokeDashArray: [5, 5],
                            role: 'placeholder', // Custom property for logic
                            label: 'Select Photo'
                        },
                        // Text Label for Placeholder
                        {
                            type: 'text',
                            version: '5.3.0',
                            originX: 'center',
                            originY: 'center',
                            left: 100,
                            top: 150,
                            text: 'Select Photo',
                            fontSize: 14,
                            fill: '#666',
                            selectable: false,
                            evented: false
                        }
                    ]
                },
                isActive: true
            }
        ];

        await Template.deleteMany({}); // Clear existing templates
        await Template.insertMany(templates);

        console.log('Templates Seeded Successfully');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedTemplates();
