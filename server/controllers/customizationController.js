// const cloudinary = require('cloudinary').v2;
// const Cart = require('../models/Cart');
// const Template = require('../models/Template');
// const sharp = require('sharp');
// const axios = require('axios');

// // Helper function to download image from URL
// const downloadImage = async (url) => {
//     const response = await axios.get(url, { responseType: 'arraybuffer' });
//     return Buffer.from(response.data, 'binary');
// };

// // Create SVG mask for different shapes
// const createShapeMask = (shapeType, width, height) => {
//     let svgPath;
    
//     switch (shapeType) {
//         case 'star':
//             // 5-point star path
//             const points = [];
//             const outerRadius = Math.min(width, height) / 2;
//             const innerRadius = outerRadius * 0.4;
//             const centerX = width / 2;
//             const centerY = height / 2;
            
//             for (let i = 0; i < 10; i++) {
//                 const radius = i % 2 === 0 ? outerRadius : innerRadius;
//                 const angle = (i * Math.PI / 5) - Math.PI / 2;
//                 const x = centerX + radius * Math.cos(angle);
//                 const y = centerY + radius * Math.sin(angle);
//                 points.push(`${x},${y}`);
//             }
            
//             svgPath = `<polygon points="${points.join(' ')}" fill="white"/>`;
//             break;
            
//         case 'heart':
//             const w = width;
//             const h = height;
//             svgPath = `<path d="M ${w/2} ${h*0.3} 
//                        C ${w/2} ${h*0.1}, ${w*0.2} ${h*0.1}, ${w*0.2} ${h*0.3}
//                        C ${w*0.2} ${h*0.5}, ${w/2} ${h*0.7}, ${w/2} ${h*0.9}
//                        C ${w/2} ${h*0.7}, ${w*0.8} ${h*0.5}, ${w*0.8} ${h*0.3}
//                        C ${w*0.8} ${h*0.1}, ${w/2} ${h*0.1}, ${w/2} ${h*0.3} Z" 
//                        fill="white"/>`;
//             break;
            
//         case 'circle':
//             const radius = Math.min(width, height) / 2;
//             svgPath = `<circle cx="${width/2}" cy="${height/2}" r="${radius}" fill="white"/>`;
//             break;
            
//         case 'rectangle':
//         default:
//             svgPath = `<rect x="0" y="0" width="${width}" height="${height}" fill="white"/>`;
//             break;
//     }
    
//     return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${svgPath}</svg>`;
// };

// // Process and clip image to shape
// const clipImageToShape = async (imageUrl, shapeType, width = 400, height = 400) => {
//     try {
//         // Download the image
//         const imageBuffer = await downloadImage(imageUrl);
        
//         // Create shape mask
//         const maskSVG = createShapeMask(shapeType, width, height);
//         const maskBuffer = Buffer.from(maskSVG);
        
//         // Resize image to fit the shape (cover mode)
//         const resizedImage = await sharp(imageBuffer)
//             .resize(width, height, {
//                 fit: 'cover',
//                 position: 'center'
//             })
//             .toBuffer();
        
//         // Apply mask to create clipped image
//         const clippedImage = await sharp(resizedImage)
//             .composite([{
//                 input: maskBuffer,
//                 blend: 'dest-in'
//             }])
//             .png()
//             .toBuffer();
        
//         return clippedImage;
//     } catch (error) {
//         console.error('Error clipping image:', error);
//         throw error;
//     }
// };

// // Upload clipped image to Cloudinary
// const uploadClippedImageToCloudinary = async (imageBuffer, shapeType) => {
//     return new Promise((resolve, reject) => {
//         const uploadStream = cloudinary.uploader.upload_stream(
//             {
//                 folder: 'product-customization/clipped',
//                 resource_type: 'image',
//                 format: 'png',
//                 transformation: [
//                     { quality: 'auto:good' }
//                 ]
//             },
//             (error, result) => {
//                 if (error) {
//                     console.error('Cloudinary upload error:', error);
//                     reject(error);
//                 } else {
//                     resolve(result);
//                 }
//             }
//         );
        
//         uploadStream.end(imageBuffer);
//     });
// };

// // Main function: Process user-uploaded image with shape clipping
// const processImageWithShapeClipping = async (req, res) => {
//     try {
//         const { imageUrl, shapeType, width, height } = req.body;
        
//         if (!imageUrl || !shapeType) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'imageUrl and shapeType are required'
//             });
//         }
        
//         const shapeWidth = parseInt(width) || 400;
//         const shapeHeight = parseInt(height) || 400;
        
//         // Clip the image to the shape
//         const clippedImageBuffer = await clipImageToShape(
//             imageUrl,
//             shapeType,
//             shapeWidth,
//             shapeHeight
//         );
        
//         // Upload to Cloudinary
//         const uploadResult = await uploadClippedImageToCloudinary(
//             clippedImageBuffer,
//             shapeType
//         );
        
//         res.status(200).json({
//             success: true,
//             data: {
//                 originalUrl: imageUrl,
//                 clippedUrl: uploadResult.secure_url,
//                 publicId: uploadResult.public_id,
//                 shapeType: shapeType,
//                 dimensions: {
//                     width: shapeWidth,
//                     height: shapeHeight
//                 }
//             }
//         });
        
//     } catch (error) {
//         console.error('Error processing image:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to process image',
//             error: error.message
//         });
//     }
// };

// // Add customized product to cart
// const addToCart = async (req, res) => {
//     try {
//         const { userId, templateId, customizations, finalImageUrl, canvasJSON, price } = req.body;
        
//         if (!userId || !templateId) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'userId and templateId are required'
//             });
//         }
        
//         // Find or create cart
//         let cart = await Cart.findOne({ user: userId });
        
//         if (!cart) {
//             cart = new Cart({
//                 user: userId,
//                 items: []
//             });
//         }
        
//         // Add item to cart
//         const cartItem = {
//             template: templateId,
//             customizations: customizations || [],
//             finalDesignUrl: finalImageUrl,
//             canvasJSON: canvasJSON,
//             quantity: 1,
//             price: price
//         };
        
//         cart.items.push(cartItem);
//         await cart.save();
        
//         res.status(200).json({
//             success: true,
//             message: 'Item added to cart successfully',
//             data: cart
//         });
        
//     } catch (error) {
//         console.error('Error adding to cart:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to add to cart',
//             error: error.message
//         });
//     }
// };

// // Get cart items
// const getCart = async (req, res) => {
//     try {
//         const { userId } = req.params;
        
//         const cart = await Cart.findOne({ user: userId })
//             .populate('items.template');
        
//         if (!cart) {
//             return res.status(200).json({
//                 success: true,
//                 data: { items: [], totalPrice: 0 }
//             });
//         }
        
//         res.status(200).json({
//             success: true,
//             data: cart
//         });
        
//     } catch (error) {
//         console.error('Error fetching cart:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to fetch cart',
//             error: error.message
//         });
//     }
// };

// // Remove item from cart
// const removeFromCart = async (req, res) => {
//     try {
//         const { userId, itemId } = req.params;
        
//         const cart = await Cart.findOne({ user: userId });
        
//         if (!cart) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Cart not found'
//             });
//         }
        
//         cart.items = cart.items.filter(item => item._id.toString() !== itemId);
//         await cart.save();
        
//         res.status(200).json({
//             success: true,
//             message: 'Item removed from cart',
//             data: cart
//         });
        
//     } catch (error) {
//         console.error('Error removing from cart:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to remove item',
//             error: error.message
//         });
//     }
// };

// module.exports = {
//     processImageWithShapeClipping,
//     addToCart,
//     getCart,
//     removeFromCart
// };


const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');
const axios = require('axios');

// Download image from Cloudinary URL
const downloadImage = async (url) => {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
};

// Create SVG mask for different shapes
const createShapeMask = (shapeData) => {
    const { shapeType, size, customPath, starPoints, polygonSides } = shapeData;
    const { width, height } = size;
    
    let svgContent;
    
    switch (shapeType) {
        case 'star':
            svgContent = createStarSVG(width, height, starPoints || 5);
            break;
            
        case 'heart':
            svgContent = createHeartSVG(width, height);
            break;
            
        case 'circle':
            const radius = Math.min(width, height) / 2;
            svgContent = `<circle cx="${width/2}" cy="${height/2}" r="${radius}" fill="white"/>`;
            break;
            
        case 'ellipse':
            svgContent = `<ellipse cx="${width/2}" cy="${height/2}" rx="${width/2}" ry="${height/2}" fill="white"/>`;
            break;
            
        case 'rectangle':
            svgContent = `<rect x="0" y="0" width="${width}" height="${height}" fill="white"/>`;
            break;
            
        case 'rounded':
            // Rounded rectangle with rx/ry = 10% of smaller dimension
            const rx = Math.min(width, height) * 0.1;
            const ry = rx;
            svgContent = `<rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" ry="${ry}" fill="white"/>`;
            break;
            
        case 'polygon':
            svgContent = createPolygonSVG(width, height, polygonSides || 6);
            break;
            
        case 'custom':
            if (customPath) {
                // Path from Fabric is often center-based (-w/2 to w/2); use viewBox so mask fits
                const vb = [-width / 2, -height / 2, width, height].join(' ');
                svgContent = `<path d="${customPath}" fill="white"/>`;
                return `<svg width="${width}" height="${height}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
            } else {
                svgContent = `<rect x="0" y="0" width="${width}" height="${height}" fill="white"/>`;
            }
            break;
            
        default:
            svgContent = `<rect x="0" y="0" width="${width}" height="${height}" fill="white"/>`;
    }
    
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
};

// Create star SVG path
const createStarSVG = (width, height, numPoints) => {
    const cx = width / 2;
    const cy = height / 2;
    const outerRadius = Math.min(width, height) / 2;
    const innerRadius = outerRadius * 0.4;
    const points = [];
    const step = Math.PI / numPoints;
    
    for (let i = 0; i < numPoints * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = i * step - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    
    return `<polygon points="${points.join(' ')}" fill="white"/>`;
};

// Create heart SVG path
const createHeartSVG = (width, height) => {
    const w = width;
    const h = height;
    return `<path d="M ${w/2} ${h*0.3} 
           C ${w/2} ${h*0.1}, ${w*0.2} ${h*0.1}, ${w*0.2} ${h*0.3}
           C ${w*0.2} ${h*0.5}, ${w/2} ${h*0.7}, ${w/2} ${h*0.9}
           C ${w/2} ${h*0.7}, ${w*0.8} ${h*0.5}, ${w*0.8} ${h*0.3}
           C ${w*0.8} ${h*0.1}, ${w/2} ${h*0.1}, ${w/2} ${h*0.3} Z" 
           fill="white"/>`;
};

// Create polygon SVG
const createPolygonSVG = (width, height, sides) => {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2;
    const points = [];
    const angle = (2 * Math.PI) / sides;
    
    for (let i = 0; i < sides; i++) {
        const x = cx + radius * Math.cos(i * angle - Math.PI / 2);
        const y = cy + radius * Math.sin(i * angle - Math.PI / 2);
        points.push(`${x},${y}`);
    }
    
    return `<polygon points="${points.join(' ')}" fill="white"/>`;
};

// Main clipping function
const clipImageToShape = async (imageUrl, shapeData) => {
    try {
        const { size } = shapeData;
        const { width, height } = size;
        
        // Download image from Cloudinary
        const imageBuffer = await downloadImage(imageUrl);
        
        // Create SVG mask for the shape
        const maskSVG = createShapeMask(shapeData);
        const maskBuffer = Buffer.from(maskSVG);
        
        // Resize image to fit the shape (cover mode)
        const resizedImage = await sharp(imageBuffer)
            .resize(Math.round(width), Math.round(height), {
                fit: 'cover',
                position: 'center'
            })
            .toBuffer();
        
        // Apply mask to clip the image
        const clippedImage = await sharp(resizedImage)
            .composite([{
                input: maskBuffer,
                blend: 'dest-in'
            }])
            .png()
            .toBuffer();
        
        return clippedImage;
    } catch (error) {
        console.error('Error clipping image:', error);
        throw error;
    }
};

// Upload clipped image to Cloudinary
const uploadToCloudinary = async (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'product-customization/clipped',
                resource_type: 'image',
                format: 'png',
                transformation: [
                    { quality: 'auto:good' }
                ]
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
        uploadStream.end(buffer);
    });
};

// @desc    Process image with shape clipping
// @route   POST /api/customization/clip-image
// @access  Public
const processImageWithShapeClipping = async (req, res) => {
    try {
        const { imageUrl, shapeData } = req.body;
        
        if (!imageUrl || !shapeData) {
            return res.status(400).json({
                success: false,
                message: 'imageUrl and shapeData are required'
            });
        }
        
        // Clip the image to the shape
        const clippedBuffer = await clipImageToShape(imageUrl, shapeData);
        
        // Upload clipped image to Cloudinary
        const uploadResult = await uploadToCloudinary(clippedBuffer);
        
        res.status(200).json({
            success: true,
            data: {
                originalUrl: imageUrl,
                clippedUrl: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                shapeType: shapeData.shapeType
            }
        });
        
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process image',
            error: error.message
        });
    }
};

module.exports = {
    processImageWithShapeClipping
};