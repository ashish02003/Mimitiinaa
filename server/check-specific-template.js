const mongoose = require('mongoose');
const Template = require('./models/Template');

const checkTemplate = async () => {
    try {
        const mongoUri = 'mongodb://0.0.0.0:27017/custom-product-new';
        await mongoose.connect(mongoUri);

        const templateId = '6994144da9e8f7edae08bd7e';
        const template = await Template.findById(templateId).lean();

        if (!template) {
            console.log(JSON.stringify({ error: 'Template not found' }));
        } else {
            const result = {
                name: template.name,
                category: template.category,
                backgroundImageUrl: template.backgroundImageUrl,
                canvasObjects: template.canvasSettings?.objects?.map(obj => ({
                    type: obj.type,
                    id: obj.id,
                    role: obj.role,
                    src: obj.src ? (obj.src.length > 50 ? obj.src.substring(0, 50) + '...' : obj.src) : undefined
                }))
            };
            console.log(JSON.stringify(result, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
    }
};

checkTemplate();
