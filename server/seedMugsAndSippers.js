const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Template = require('./models/Template');

dotenv.config({ path: 'server/.env' });

const seedMugsAndSippers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const templates = [
            // Mugs (Variant 1.x)
            {
                name: 'White Mug',
                category: 'Mug',
                variantNo: '1.1',
                variantDetails: 'White Mugs',
                productSize: '11 Oz',
                printSize: '19.6 x 9 cm',
                moq: 1,
                basePrice: 299,
                previewImage: 'https://via.placeholder.com/400?text=White+Mug',
                canvasSettings: { version: "5.3.0", objects: [] },
                isActive: true
            },
            {
                name: 'Magic Mug',
                category: 'Mug',
                variantNo: '1.2',
                variantDetails: 'Magic Mugs',
                productSize: '11 Oz',
                printSize: '19.6 x 9 cm',
                moq: 1,
                basePrice: 399,
                previewImage: 'https://via.placeholder.com/400?text=Magic+Mug',
                canvasSettings: { version: "5.3.0", objects: [] },
                isActive: true
            },
            {
                name: 'Patch Mug',
                category: 'Mug',
                variantNo: '1.3',
                variantDetails: 'Patch Mugs',
                productSize: '11 Oz',
                printSize: '',
                moq: 1,
                basePrice: 349,
                previewImage: 'https://via.placeholder.com/400?text=Patch+Mug',
                canvasSettings: { version: "5.3.0", objects: [] },
                isActive: true
            },
            {
                name: 'Steel Mug',
                category: 'Mug',
                variantNo: '1.4',
                variantDetails: 'Steel Mugs',
                productSize: '11 Oz',
                printSize: '19.6 x 6 cm',
                moq: 1,
                basePrice: 499,
                previewImage: 'https://via.placeholder.com/400?text=Steel+Mug',
                canvasSettings: { version: "5.3.0", objects: [] },
                isActive: true
            },
            // Sippers / Bottles (Variant 2.x)
            {
                name: 'Normal Sipper',
                category: 'Sippers / Bottles',
                variantNo: '2.1',
                variantDetails: '750 ML Normal sipper',
                productSize: '750 ML',
                printSize: '23.5 x 17 cm',
                moq: 1,
                basePrice: 599,
                previewImage: 'https://via.placeholder.com/400?text=Normal+Sipper',
                canvasSettings: { version: "5.3.0", objects: [] },
                isActive: true
            },
            {
                name: 'Temperature Bottle',
                category: 'Sippers / Bottles',
                variantNo: '2.2',
                variantDetails: 'White Temprature Bottle',
                productSize: '',
                printSize: '20.4 x 18 cm',
                moq: 1,
                basePrice: 899,
                previewImage: 'https://via.placeholder.com/400?text=Temperature+Bottle',
                canvasSettings: { version: "5.3.0", objects: [] },
                isActive: true
            },
            {
                name: 'Slim Sipper',
                category: 'Sippers / Bottles',
                variantNo: '2.3',
                variantDetails: 'White Slim Sipper w straw',
                productSize: '',
                printSize: '23.5 x 19.5 cm',
                moq: 1,
                basePrice: 699,
                previewImage: 'https://via.placeholder.com/400?text=Slim+Sipper',
                canvasSettings: { version: "5.3.0", objects: [] },
                isActive: true
            }
        ];

        // Instead of deleteMany({}), we'll just insert these. 
        // If we want to avoid duplicates on re-run, we should handle that.
        // For now, let's just insert.
        await Template.insertMany(templates);

        console.log('Mugs and Sippers Seeded Successfully');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedMugsAndSippers();
