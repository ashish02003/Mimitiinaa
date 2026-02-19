const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');

dotenv.config();

const categories = [
    { name: 'Mobile Cover', image: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400', description: 'Custom mobile cases' },
    { name: 'Mug', image: 'https://img.freepik.com/premium-psd/white-mug-mockup_1310-721.jpg', description: 'Personalized mugs' },
    { name: 'Sippers / Bottles', image: 'https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=400', description: 'Custom sippers and bottles' },
    { name: 'T-Shirt', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', description: 'Custom printed t-shirts' },
    { name: 'Photo Albums', image: 'https://images.unsplash.com/photo-1544273677-277914c9ad3a?w=400', description: 'Memory photo albums' },
    { name: 'Name Pencils', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400', description: 'Engraved pencils' },
    { name: 'Fridge Magnets', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400', description: 'Custom magnets' },
    { name: 'Metal Name', image: 'https://images.unsplash.com/photo-1534670007418-fbb7f6cf32c3?w=400', description: 'Metal name cutouts' }
];

const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        await Category.deleteMany(); // Clear existing
        console.log('Cleared existing categories');

        for (const cat of categories) {
            const slug = cat.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            await Category.create({ ...cat, slug });
        }

        console.log('Categories seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
};

seedCategories();
