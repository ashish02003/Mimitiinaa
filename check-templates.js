const mongoose = require('mongoose');
const path = require('path');

// Use absolute paths to avoid module not found errors
const Template = require(path.join(__dirname, 'server', 'models', 'Template'));

mongoose.connect('mongodb://0.0.0.0:27017/custom-product-new')
    .then(async () => {
        console.log('--- DIAGNOSTIC START ---');
        const templates = await Template.find({ category: { $in: ['Mug', 'Sippers / Bottles'] } });

        if (templates.length === 0) {
            console.log('No Mug or Sipper templates found.');
        } else {
            templates.forEach(t => {
                console.log(`ID: ${t._id}`);
                console.log(`Category: ${t.category}`);
                console.log(`Name: ${t.name}`);
                console.log(`Variant: ${t.variantNo}`);
                console.log(`Size: ${t.productSize}`);
                console.log(`Print Size: ${t.printSize}`);
                console.log(`MOQ: ${t.moq}`);
                console.log('---');
            });
        }

        const anyTemplate = await Template.findOne({ category: { $ne: 'Mobile Cover' } });
        if (anyTemplate) {
            console.log('\nOther Category Template (for comparison):');
            console.log(`Name: ${anyTemplate.name}`);
            console.log(`Preview: ${anyTemplate.previewImage}`);
            console.log(`BG: ${anyTemplate.backgroundImageUrl}`);
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('Diagnostic Failed:', err);
        process.exit(1);
    });
