const Category = require('../models/Category');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Helper to upload to Cloudinary
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'categories' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
    try {
        const { name, description, stock, width, height } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const categoryExists = await Category.findOne({ slug });
        if (categoryExists) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        let imageUrl = '';
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            imageUrl = result.secure_url;
        } else if (req.body.image) {
            imageUrl = req.body.image; // Fallback to URL if provided textually
        }

        const category = await Category.create({
            name,
            slug,
            image: imageUrl,
            description,
            stock: Number(stock) || 0,
            dimensions: {
                width: Number(width) || 0,
                height: Number(height) || 0
            }
        });

        res.status(201).json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        console.error('Error in getCategories:', error && error.message ? error.message : error);
        // Include stack during development for easier debugging
        const resp = { message: 'Server Error' };
        if (process.env.NODE_ENV !== 'production') {
            resp.error = { message: error.message, stack: error.stack };
        }
        res.status(500).json(resp);
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await category.deleteOne();
        res.json({ message: 'Category removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const { name, description, stock, width, height } = req.body;

        category.name = name || category.name;
        category.description = description || category.description;
        category.stock = stock !== undefined ? Number(stock) : category.stock;
        category.dimensions.width = width !== undefined ? Number(width) : category.dimensions.width;
        category.dimensions.height = height !== undefined ? Number(height) : category.dimensions.height;

        if (name) {
            category.slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        }

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            category.image = result.secure_url;
        } else if (req.body.image && req.body.image !== category.image) {
            category.image = req.body.image;
        }

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createCategory,
    getCategories,
    deleteCategory,
    updateCategory
};
