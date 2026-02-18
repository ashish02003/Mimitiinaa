const express = require('express');
const router = express.Router();
const {
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    getUniqueBrands,
    getModelsForBrand
} = require('../controllers/templateController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getTemplates)
    .post(protect, admin, createTemplate);

router.get('/brands', getUniqueBrands);
router.get('/models/:brand', getModelsForBrand);

router.route('/:id')
    .get(getTemplateById)
    .delete(protect, admin, deleteTemplate)
    .put(protect, admin, updateTemplate);

module.exports = router;
