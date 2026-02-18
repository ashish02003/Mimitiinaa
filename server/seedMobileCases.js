const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Template = require('./models/Template');

dotenv.config({ path: 'server/.env' });

const seedMobileCases = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected to fix broken images');

        // Correct Cloudinary Cloud Name from your .env
        const CLOUD_NAME = 'dzdra4xct';

        const appleModels = [
            'iPhone 17', 'iPhone 17 Pro', 'iPhone 17 Pro Max',
            'iPhone 16', 'iPhone 16 Pro', 'iPhone 15'
        ];

        const allTemplates = [];

        appleModels.forEach(model => {
            // 1. Full Photo Design
            allTemplates.push({
                name: `${model} Full Photo Soft Case`,
                category: 'Mobile Cover',
                brand: 'Apple',
                modelName: model,
                caseType: 'Soft',
                basePrice: 399,
                // Fixed Cloudinary Name
                previewImage: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/previews/full_photo_demo.png`,
                backgroundImageUrl: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/mockups/iphone_case_back.png`,
                overlayImageUrl: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/mockups/iphone_soft_overlay.png`,
                canvasSettings: {
                    version: "5.3.0",
                    objects: [
                        {
                            type: 'rect',
                            version: '5.3.0',
                            originX: 'center',
                            originY: 'center',
                            left: 225,
                            top: 300,
                            width: 320,
                            height: 560,
                            fill: 'rgba(255,255,255,0.1)',
                            stroke: '#3498db',
                            strokeWidth: 1,
                            strokeDashArray: [5, 5],
                            role: 'placeholder',
                            id: 'full_back_area'
                        }
                    ]
                },
                isActive: true
            });

            // 2. Heart Shape Design
            allTemplates.push({
                name: `${model} Valentine Heart Case`,
                category: 'Mobile Cover',
                brand: 'Apple',
                modelName: model,
                caseType: 'Soft',
                basePrice: 449,
                previewImage: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/previews/heart_photo_demo.png`,
                backgroundImageUrl: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/mockups/iphone_case_back.png`,
                overlayImageUrl: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/mockups/iphone_soft_overlay.png`,
                canvasSettings: {
                    version: "5.3.0",
                    objects: [
                        {
                            type: 'path',
                            version: '5.3.0',
                            path: [['M', 0, 0], ['C', -50, -50, -100, 50, 0, 100], ['C', 100, 50, 50, -50, 0, 0], ['z']],
                            originX: 'center',
                            originY: 'center',
                            left: 225,
                            top: 300,
                            scaleX: 2,
                            scaleY: 2,
                            fill: 'rgba(255,100,100,0.2)',
                            role: 'placeholder',
                            id: 'heart_area'
                        }
                    ]
                },
                isActive: true
            });

            // 3. Artistic Brush Stroke
            allTemplates.push({
                name: `${model} Artistic Stroke Case`,
                category: 'Mobile Cover',
                brand: 'Apple',
                modelName: model,
                caseType: 'Glass',
                basePrice: 499,
                previewImage: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/previews/brush_photo_demo.png`,
                backgroundImageUrl: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/mockups/iphone_case_back.png`,
                overlayImageUrl: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/mockups/iphone_glass_overlay.png`,
                canvasSettings: {
                    version: "5.3.0",
                    objects: [
                        {
                            type: 'rect',
                            left: 225,
                            top: 300,
                            width: 250,
                            height: 350,
                            originX: 'center',
                            originY: 'center',
                            angle: -5,
                            role: 'placeholder',
                            id: 'art_area'
                        }
                    ]
                },
                isActive: true
            });
        });

        await Template.deleteMany({ category: 'Mobile Cover' });
        await Template.insertMany(allTemplates);

        console.log(`Successfully seeded ${allTemplates.length} templates with FIXED CLOUD NAME!`);
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedMobileCases();
