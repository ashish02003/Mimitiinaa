const Template = require('../models/Template');

// @desc    Create a new product template
// @route   POST /api/templates
// @access  Private/Admin
const createTemplate = async (req, res) => {
    try {
        const {
            name,
            category,
            canvasSettings,
            previewImage,
            demoImageUrl,
            overlayImageUrl,
            backgroundImageUrl,
            maskImageUrl,
            printArea,
            basePrice,
            brand,
            modelName,
            caseType,
            variantNo,
            productSize,
            printSize,
            moq,
            packingCharges,
            shippingCharges
        } = req.body;

        const template = await Template.create({
            name,
            category,
            canvasSettings,
            previewImage,
            demoImageUrl,
            overlayImageUrl,
            backgroundImageUrl,
            maskImageUrl,
            printArea,
            basePrice,
            brand,
            modelName,
            caseType,
            variantNo,
            productSize,
            printSize,
            moq,
            packingCharges: packingCharges || 0,
            shippingCharges: shippingCharges || 0,
            createdBy: req.user?._id
        });

        res.status(201).json(template);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get all templates
// @route   GET /api/templates
// @access  Public
const getTemplates = async (req, res) => {
    try {
        const query = { isActive: true };

        // Add filters if provided in query params
        if (req.query.category) query.category = req.query.category;
        if (req.query.brand) query.brand = req.query.brand;
        if (req.query.modelName) query.modelName = req.query.modelName;
        if (req.query.caseType) query.caseType = req.query.caseType;

        const templates = await Template.find(query);
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get single template
// @route   GET /api/templates/:id
// @access  Public
const getTemplateById = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);

        if (template) {
            res.json(template);
        } else {
            res.status(404).json({ message: 'Template not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Update template
// @route   PUT /api/templates/:id
// @access  Private/Admin
const updateTemplate = async (req, res) => {
    try {
        const {
            name,
            category,
            canvasSettings,
            previewImage,
            demoImageUrl,
            overlayImageUrl,
            backgroundImageUrl,
            maskImageUrl,
            printArea,
            basePrice,
            brand,
            modelName,
            caseType,
            variantNo,
            productSize,
            printSize,
            moq,
            packingCharges,
            shippingCharges
        } = req.body;

        const template = await Template.findById(req.params.id);

        if (template) {
            template.name = name || template.name;
            template.category = category || template.category;
            template.canvasSettings = canvasSettings || template.canvasSettings;
            template.previewImage = previewImage || template.previewImage;
            template.demoImageUrl = demoImageUrl !== undefined ? demoImageUrl : template.demoImageUrl;
            template.overlayImageUrl = overlayImageUrl !== undefined ? overlayImageUrl : template.overlayImageUrl;
            template.backgroundImageUrl = backgroundImageUrl !== undefined ? backgroundImageUrl : template.backgroundImageUrl;
            template.maskImageUrl = maskImageUrl !== undefined ? maskImageUrl : template.maskImageUrl;
            template.printArea = printArea || template.printArea;
            template.basePrice = basePrice || template.basePrice;
            template.brand = brand || template.brand;
            template.modelName = modelName || template.modelName;
            template.caseType = caseType || template.caseType;
            template.variantNo = variantNo || template.variantNo;
            template.productSize = productSize || template.productSize;
            template.printSize = printSize || template.printSize;
            template.moq = moq || template.moq;
            template.packingCharges = packingCharges !== undefined ? packingCharges : template.packingCharges;
            template.shippingCharges = shippingCharges !== undefined ? shippingCharges : template.shippingCharges;

            const updatedTemplate = await template.save();
            res.json(updatedTemplate);
        } else {
            res.status(404).json({ message: 'Template not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Delete template
// @route   DELETE /api/templates/:id
// @access  Private/Admin
const deleteTemplate = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);

        if (template) {
            await template.deleteOne();
            res.json({ message: 'Template removed' });
        } else {
            res.status(404).json({ message: 'Template not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get unique brands
// @route   GET /api/templates/brands
// @access  Public
const getUniqueBrands = async (req, res) => {
    try {
        const brands = await Template.distinct('brand', { isActive: true, category: 'Mobile Cover', brand: { $ne: null } });
        res.json(brands);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get models for a specific brand
// @route   GET /api/templates/models/:brand
// @access  Public
const getModelsForBrand = async (req, res) => {
    try {
        const models = await Template.distinct('modelName', {
            isActive: true,
            category: 'Mobile Cover',
            brand: req.params.brand
        });
        res.json(models);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    getUniqueBrands,
    getModelsForBrand
};
