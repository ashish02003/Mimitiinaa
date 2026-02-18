const mongoose = require('mongoose');

// Relative path since we'll run from server dir
const Template = require('./models/Template');

const migrate = async () => {
    try {
        const mongoUri = 'mongodb://0.0.0.0:27017/custom-product-new';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB:', mongoUri);

        const result = await Template.updateMany(
            { category: 'Sippers / Bottels' },
            { category: 'Sippers / Bottles' }
        );

        console.log(`Updated ${result.modifiedCount} templates with corrected category name.`);

        const result2 = await Template.updateMany(
            { variantDetails: 'White Temprature Bottel' },
            { variantDetails: 'White Temprature Bottle' }
        );
        console.log(`Updated ${result2.modifiedCount} templates with corrected variant details.`);

        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
