import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const CreateTemplate = () => {
    const canvasRef = useRef(null);
    const bgImageInputRef = useRef(null);
    const graphicInputRef = useRef(null);
    const [canvas, setCanvas] = useState(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Mobile Cover');
    const [price, setPrice] = useState(0);
    const [brand, setBrand] = useState('');
    const [modelName, setModelName] = useState('');
    const [caseType, setCaseType] = useState('None');
    const [variantNo, setVariantNo] = useState('');
    const [productSize, setProductSize] = useState('');
    const [printSize, setPrintSize] = useState('');
    const [moq, setMoq] = useState(1);
    const [categories, setCategories] = useState([]); // 👈 NEW
    const [activeTab, setActiveTab] = useState('background'); // background, shapes, text, elements

    // Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/categories');
                setCategories(data);
                // Set default category if none selected and categories exist
                if (data.length > 0 && !category) {
                    setCategory(data[0].name);
                }
            } catch (error) {
                console.error('Failed to fetch categories', error);
                toast.error('Failed to load categories');
            }
        };
        fetchCategories();
    }, []);
    const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
    const [selectedObject, setSelectedObject] = useState(null);
    const [objProps, setObjProps] = useState({
        width: 0,
        height: 0,
        angle: 0,
        fill: '#000000',
        fontSize: 40,
        fontFamily: 'Arial',
        locked: false
    });
    const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Impact', 'Comic Sans MS'];
    const { user } = useAuth();
    const navigate = useNavigate();
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingBg, setIsUploadingBg] = useState(false);
    const { id } = useParams();
    const isEdit = !!id;

    // Initialize Canvas
    useEffect(() => {
        const initCanvas = new fabric.Canvas(canvasRef.current, {
            height: 600,
            width: 400,
            backgroundColor: '#ffffff',
            selection: true
        });
        setCanvas(initCanvas);

        // Selection events
        const updateSelectionProps = (e) => {
            const obj = e.selected ? e.selected[0] : (e.target || null);
            setSelectedObject(obj);
            if (obj) {
                setObjProps({
                    width: Math.round(obj.getScaledWidth()),
                    height: Math.round(obj.getScaledHeight()),
                    angle: Math.round(obj.angle || 0),
                    fill: obj.fill || '#000000',
                    fontSize: obj.fontSize || 40,
                    fontFamily: obj.fontFamily || 'Arial',
                    locked: obj.locked || false,
                    role: obj.role || null
                });
            } else {
                setObjProps({ width: 0, height: 0, angle: 0, fill: '#000000', fontSize: 40, fontFamily: 'Arial', locked: false, role: null });
            }
        };

        const updateFromTransform = (e) => {
            const obj = e.target;
            if (obj) {
                setObjProps(prev => ({
                    ...prev,
                    width: Math.round(obj.getScaledWidth()),
                    height: Math.round(obj.getScaledHeight()),
                    angle: Math.round(obj.angle || 0)
                }));
            }
        };

        initCanvas.on('selection:created', updateSelectionProps);
        initCanvas.on('selection:updated', updateSelectionProps);
        initCanvas.on('selection:cleared', updateSelectionProps);

        // Transform events
        initCanvas.on('object:modified', updateFromTransform);
        initCanvas.on('object:scaling', updateFromTransform);
        initCanvas.on('object:rotating', updateFromTransform);
        initCanvas.on('object:moving', updateFromTransform);

        return () => {
            initCanvas.dispose();
        }
    }, []);

    // Fetch Template for Edit Mode
    useEffect(() => {
        if (isEdit && canvas) {
            const fetchTemplate = async () => {
                try {
                    const { data } = await axios.get(`http://localhost:5000/api/templates/${id}`);
                    setName(data.name || '');
                    setCategory(data.category || 'Mobile Cover');
                    setPrice(data.basePrice || 0);
                    setBackgroundImageUrl(data.backgroundImageUrl || '');
                    setBrand(data.brand || '');
                    setModelName(data.modelName || '');
                    setCaseType(data.caseType || 'None');
                    setVariantNo(data.variantNo || '');
                    setProductSize(data.productSize || '');
                    setPrintSize(data.printSize || '');
                    setMoq(data.moq || 1);

                    // Load canvas state
                    if (data.canvasSettings) {
                        // Deep clone and add cache busters and crossOrigin to all images in JSON
                        if (data.canvasSettings.objects) {
                            data.canvasSettings.objects = data.canvasSettings.objects.map(obj => {
                                if ((obj.type === 'image' || obj.type === 'fabric.Image') && obj.src && obj.src.startsWith('http')) {
                                    obj.src = obj.src + (obj.src.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
                                    obj.crossOrigin = 'anonymous';
                                }
                                return obj;
                            });
                        }

                        await canvas.loadFromJSON(data.canvasSettings);
                        canvas.renderAll();
                        console.log('Canvas loaded from JSON');
                    }
                } catch (error) {
                    console.error('Error fetching template:', error);
                    toast.error('Failed to load template data');
                }
            };
            fetchTemplate();
        }
    }, [isEdit, canvas, id]);

    // Upload Background Image
    const handleBackgroundUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. Instant Local Preview
        const reader = new FileReader();
        reader.onload = async (f) => {
            const localUrl = f.target.result;

            // Add to canvas immediately
            const img = await fabric.FabricImage.fromURL(localUrl);

            const scale = Math.min(
                canvas.width / img.width,
                canvas.height / img.height
            );

            img.set({
                scaleX: scale,
                scaleY: scale,
                left: canvas.width / 2,
                top: canvas.height / 2,
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
                id: 'background_image'
            });
            // Also set on instance for direct access
            img.id = 'background_image';

            // Remove existing background if any
            const existingBg = canvas.getObjects().find(obj => obj.id === 'background_image');
            if (existingBg) canvas.remove(existingBg);

            canvas.add(img);
            canvas.sendObjectToBack(img);
            canvas.renderAll();

            // 2. Background Upload to Cloudinary
            try {
                setIsUploadingBg(true);
                const formData = new FormData();
                formData.append('image', file);

                const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                const uploadRes = await axios.post(`${API_BASE}/upload`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const imageUrl = uploadRes.data.url;
                setBackgroundImageUrl(imageUrl);

                // Update the canvas image object with the real URL for saving
                // In Fabric 6, we use a different approach to update source
                const validUrl = imageUrl + (imageUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();

                // Remove the temporary local image and add the server one
                // This is safer than trying to mutate the existing object in Fabric 6
                const newImg = await fabric.FabricImage.fromURL(validUrl, {
                    crossOrigin: 'anonymous'
                });

                newImg.set({
                    scaleX: img.scaleX,
                    scaleY: img.scaleY,
                    left: img.left,
                    top: img.top,
                    originX: img.originX,
                    originY: img.originY,
                    selectable: false,
                    evented: false,
                    id: 'background_image'
                });
                newImg.id = 'background_image';
                // Fabric 6 sometimes needs the src property set on the instance for serialization
                newImg.src = validUrl;

                canvas.remove(img);
                canvas.add(newImg);
                canvas.sendObjectToBack(newImg);
                canvas.renderAll();

                console.log('Background upload complete and synced');
            } catch (error) {
                console.error('SYNC ERROR:', error);
                alert('Failed to sync background to server: ' + (error.response?.data?.message || error.message));
            } finally {
                setIsUploadingBg(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // Add Shape
    const addShape = (type) => {
        if (!canvas) return;

        let shape;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        switch (type) {
            case 'rect':
                shape = new fabric.Rect({
                    left: centerX,
                    top: centerY,
                    width: 150,
                    height: 100,
                    fill: '#ff6b6b',
                    stroke: '#333',
                    strokeWidth: 2,
                    shapeType: 'rect'
                });
                break;
            case 'circle':
                shape = new fabric.Circle({
                    left: centerX,
                    top: centerY,
                    radius: 50,
                    fill: '#4ecdc4',
                    stroke: '#333',
                    strokeWidth: 2,
                    shapeType: 'circle'
                });
                break;
            case 'triangle':
                shape = new fabric.Triangle({
                    left: centerX,
                    top: centerY,
                    width: 100,
                    height: 100,
                    fill: '#95e1d3',
                    stroke: '#333',
                    strokeWidth: 2,
                    shapeType: 'triangle'
                });
                break;
            case 'star':
                // Create star using polygon
                const starPoints = createStarPoints(5, 50, 25);
                shape = new fabric.Polygon(starPoints, {
                    left: centerX,
                    top: centerY,
                    fill: '#f9ca24',
                    stroke: '#333',
                    strokeWidth: 2,
                    shapeType: 'star'
                });
                break;
            case 'heart':
                // Create heart using path
                shape = new fabric.Path('M 272.70141,238.71731 \
                    C 206.46141,238.71731 152.70146,292.4773 152.70146,358.71731 \
                    C 152.70146,493.47282 288.63461,528.80461 381.26391,662.02535 \
                    C 468.83815,529.62199 609.82641,489.17075 609.82641,358.71731 \
                    C 609.82641,292.47731 556.06651,238.71731 489.82641,238.71731 \
                    C 441.77851,238.71731 400.42481,267.08774 381.26391,307.90481 \
                    C 362.10311,267.08773 320.74941,238.71731 272.70141,238.71731 z', {
                    left: centerX,
                    top: centerY,
                    fill: '#e74c3c',
                    stroke: '#333',
                    strokeWidth: 2,
                    scaleX: 0.15,
                    scaleY: 0.15,
                    shapeType: 'heart'
                });
                break;
            case 'rounded':
                // Create rounded rectangle
                shape = new fabric.Rect({
                    left: centerX,
                    top: centerY,
                    width: 150,
                    height: 100,
                    rx: 20, // Horizontal radius for rounded corners
                    ry: 20, // Vertical radius for rounded corners
                    fill: '#9b59b6',
                    stroke: '#333',
                    strokeWidth: 2,
                    shapeType: 'rounded'
                });
                break;
        }

        if (shape) {
            shape.set({
                originX: 'center',
                originY: 'center',
                // Default props for any shape
                transparentCorners: false,
                cornerColor: '#3498db',
                cornerStyle: 'circle'
            });
            canvas.add(shape);
            canvas.setActiveObject(shape);
            canvas.renderAll();
        }
    };

    // Helper function to create star points
    const createStarPoints = (points, outerRadius, innerRadius) => {
        const step = Math.PI / points;
        const starPoints = [];

        for (let i = 0; i < 2 * points; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = i * step - Math.PI / 2;
            starPoints.push({
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle)
            });
        }

        return starPoints;
    };

    // Add Text
    const addText = () => {
        if (!canvas) return;

        const text = new fabric.IText('Your Text', {
            left: canvas.width / 2,
            top: canvas.height / 2,
            fontFamily: 'Arial',
            fill: '#000000',
            fontSize: 40,
            originX: 'center',
            originY: 'center'
        });

        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
    };

    // Add Placeholder Area
    const addPlaceholder = () => {
        if (!canvas) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const rect = new fabric.Rect({
            left: centerX,
            top: centerY,
            width: 200,
            height: 250,
            fill: 'rgba(255, 228, 225, 0.6)',
            stroke: '#ff6b6b',
            strokeWidth: 3,
            strokeDashArray: [10, 5],
            originX: 'center',
            originY: 'center',
            role: 'placeholder',
            shapeType: 'rect',
            id: 'user_photo_area'
        });

        canvas.add(rect);
        canvas.setActiveObject(rect);
        canvas.renderAll();
    };

    // Upload Graphic/Clipart
    const handleGraphicUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (f) => {
            const localUrl = f.target.result;
            const img = await fabric.FabricImage.fromURL(localUrl);

            img.scaleToWidth(150);
            img.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                originX: 'center',
                originY: 'center'
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();

            // Note: If graphics also need server-side persistence independent of canvas settings, 
            // you could add axios upload here. Currently, Fabric's toJSON handles the dataUrl or URL.
        };
        reader.readAsDataURL(file);
    };

    // Layer Controls
    const bringToFront = () => {
        if (!selectedObject) return;
        canvas.bringObjectToFront(selectedObject);
        canvas.renderAll();
    };

    const sendToBack = () => {
        if (!selectedObject) return;
        canvas.sendObjectToBack(selectedObject);
        canvas.renderAll();
    };

    const deleteObject = () => {
        if (!selectedObject) return;

        // If it's the background image, clear state too
        if (selectedObject.id === 'background_image') {
            setBackgroundImageUrl('');
        }

        canvas.remove(selectedObject);
        setSelectedObject(null);
        canvas.renderAll();
    };

    // Set selected object as background
    const setAsBackground = () => {
        if (!selectedObject) return;

        // Try to get URL
        const url = selectedObject.src ||
            (selectedObject.getSrc && selectedObject.getSrc()) ||
            (selectedObject._element && selectedObject._element.src);

        if (!url) return toast.error("Could not determine image source");

        // Confirm if it's a data URL
        if (url.startsWith('data:')) {
            toast.error("Please wait for background sync or upload via the 'Background' tab for persistent Cloudinary storage.");
            // We can still proceed if the user insists, but state won't have the Cloudinary URL yet
        }

        // Set as background
        selectedObject.set({
            id: 'background_image',
            selectable: false,
            evented: false,
            lockMovementX: true,
            lockMovementY: true,
            lockScalingX: true,
            lockScalingY: true,
            lockRotation: true
        });
        selectedObject.id = 'background_image';

        canvas.sendObjectToBack(selectedObject);
        setBackgroundImageUrl(url);
        canvas.renderAll();
        setSelectedObject(null);
        toast.success("Object set as background image!");
    };

    // Object Property Updates
    const updateProperty = (prop, value) => {
        if (!selectedObject) return;

        // Use set for Fabric internal state
        selectedObject.set(prop, value);

        // Explicitly set on instance as well for serialization safety in Fabric 6
        const criticalProps = ['role', 'id', 'locked', 'shapeType', 'selectable', 'evented'];
        if (criticalProps.includes(prop)) {
            selectedObject[prop] = value;
        }

        // Update local object properties state for UI reactivity
        setObjProps(prev => ({
            ...prev,
            width: Math.round(selectedObject.getScaledWidth()),
            height: Math.round(selectedObject.getScaledHeight()),
            angle: Math.round(selectedObject.angle || 0),
            fill: selectedObject.fill || '#000000',
            fontSize: selectedObject.fontSize || 40,
            fontFamily: selectedObject.fontFamily || 'Arial',
            locked: selectedObject.locked || false,
            role: selectedObject.role || null,
            [prop]: value
        }));

        canvas.renderAll();
    };

    // Save Template
    const saveTemplate = async () => {
        if (!name) return alert('Please enter a template name');

        // Find background image on canvas if state is somehow out of sync
        let finalBgUrl = backgroundImageUrl;
        if (!finalBgUrl && canvas) {
            const bgObj = canvas.getObjects().find(obj => obj.id === 'background_image' || obj.role === 'background');
            if (bgObj) {
                // VERY ROBUST FALLBACK FOR FABRIC 6
                finalBgUrl = bgObj.src ||
                    (bgObj.getSrc && bgObj.getSrc()) ||
                    (bgObj._element && bgObj._element.src) ||
                    (bgObj.toObject && bgObj.toObject(['src']).src);
            }
        }

        if (!finalBgUrl) {
            return alert('Please upload a background image using the "Background" tab.\n\nNote: If you uploaded it as a graphic, select the image and click "📷 Set as Background" in the property panel.');
        }
        if (!canvas) return;

        try {
            console.log('--- PRE-SAVE CHECK ---');
            const allObjs = canvas.getObjects();
            console.log('Total Objects:', allObjs.length);
            allObjs.forEach((o, i) => console.log(`Object ${i}:`, o.type, 'Role:', o.role));

            // 1. Temporarily hide design-only elements for a clean preview
            const placeholders = allObjs.filter(obj => obj.role === 'placeholder');
            console.log('Detected Placeholders:', placeholders.length);

            if (placeholders.length === 0) {
                console.warn('WARNING: No placeholders detected! Masking will NOT work.');
            }

            placeholders.forEach(ph => ph.set('visible', false));
            canvas.discardActiveObject(); // Deselect everything
            canvas.renderAll();

            // Generate preview image
            const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 0.5 });

            // 2. Restore visibility for continued editing
            placeholders.forEach(ph => ph.set('visible', true));
            canvas.renderAll();

            setIsSaving(true);
            setUploadProgress(0);

            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], 'preview.png', { type: 'image/png' });

            // Upload preview to Cloudinary
            const formData = new FormData();
            formData.append('image', file);

            const uploadRes = await axios.post('http://localhost:5000/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            const previewImageUrl = uploadRes.data.url;

            // Extract coordinates correctly accounting for scaling/centering/angle
            // For saving, we use the first placeholder as the primary print area
            const primaryPlaceholder = placeholders[0];
            const printArea = primaryPlaceholder ? {
                x: primaryPlaceholder.left - (primaryPlaceholder.getScaledWidth() / 2),
                y: primaryPlaceholder.top - (primaryPlaceholder.getScaledHeight() / 2),
                width: primaryPlaceholder.getScaledWidth(),
                height: primaryPlaceholder.getScaledHeight(),
                angle: primaryPlaceholder.angle || 0
            } : { x: 100, y: 200, width: 250, height: 200 };

            // Save template data
            const templateData = {
                name,
                category,
                basePrice: price,
                previewImage: previewImageUrl,
                backgroundImageUrl: finalBgUrl,
                printArea: printArea,
                brand: brand,
                modelName: modelName,
                caseType: caseType,
                variantNo: variantNo,
                productSize: productSize,
                printSize: printSize,
                moq: moq,
                canvasSettings: canvas.toJSON(['role', 'locked', 'shapeType', 'id', 'selectable'])
            };

            console.log('SAVING TEMPLATE JSON:', JSON.stringify(templateData.canvasSettings, null, 2));

            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            };

            if (isEdit) {
                await axios.put(`http://localhost:5000/api/templates/${id}`, templateData, config);
                toast.success('Template Updated Successfully!');
            } else {
                await axios.post('http://localhost:5000/api/templates', templateData, config);
                toast.success('Template Saved Successfully!');
            }

            navigate('/admin/dashboard');

        } catch (error) {
            console.error('SAVE ERROR:', error);
            const errMsg = error.response?.data?.message || error.message;
            toast.error(`Error saving template: ${errMsg}`);
        } finally {
            setIsSaving(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Top Toolbar */}
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
                <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Template' : 'Template Designer'}</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={() => navigate('/admin/dashboard')} disabled={isSaving}>
                        Cancel
                    </button>
                    <button
                        className={`px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold flex items-center gap-2 ${(isSaving || isUploadingBg) ? 'opacity-70 cursor-not-allowed' : ''}`}
                        onClick={saveTemplate}
                        disabled={isSaving || isUploadingBg}
                    >
                        {isSaving ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Saving {uploadProgress}%
                            </>
                        ) : isUploadingBg ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Uploading Background...
                            </>
                        ) : (
                            isEdit ? '💾 Update Template' : '💾 Save Template'
                        )}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Tools */}
                <div className="w-64 bg-white border-r overflow-y-auto">
                    <div className="p-4 space-y-4">
                        {/* Template Info */}
                        <div>
                            <h3 className="font-bold text-sm text-gray-700 mb-2">Template Info</h3>
                            <input
                                type="text"
                                className="w-full border p-2 rounded text-sm mb-2"
                                placeholder="Template Name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                            <select className="w-full border p-2 rounded text-sm mb-2" value={category} onChange={e => setCategory(e.target.value)}>
                                {categories.length > 0 ? (
                                    categories.map(cat => (
                                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                                    ))
                                ) : (
                                    <option>Loading...</option>
                                )}
                            </select>
                            <input
                                type="number"
                                className="w-full border p-2 rounded text-sm"
                                placeholder="Price ($)"
                                value={price}
                                onChange={e => setPrice(Number(e.target.value))}
                            />
                        </div>

                        {/* Mobile Case Specific Info */}
                        {category === 'Mobile Cover' && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <h3 className="font-bold text-sm text-blue-800 mb-2">Mobile Case Details</h3>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded text-sm mb-2"
                                    placeholder="Brand (e.g. Apple)"
                                    value={brand}
                                    onChange={e => setBrand(e.target.value)}
                                />
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded text-sm mb-2"
                                    placeholder="Model (e.g. iPhone 15)"
                                    value={modelName}
                                    onChange={e => setModelName(e.target.value)}
                                />
                                <select
                                    className="w-full border p-2 rounded text-sm"
                                    value={caseType}
                                    onChange={e => setCaseType(e.target.value)}
                                >
                                    <option value="None">Common Case</option>
                                    <option value="Soft">Soft Case</option>
                                    <option value="Glass">Glass Case</option>
                                    <option value="Metal">Metal Case</option>
                                </select>
                            </div>
                        )}

                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-3">
                            <h3 className="font-bold text-sm text-gray-700 mb-2">Product Specifications</h3>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400">Variant No</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded text-sm"
                                    placeholder="e.g., 1.1"
                                    value={variantNo}
                                    onChange={e => setVariantNo(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400">Product Size</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded text-sm"
                                    placeholder="e.g., 11 Oz / 750 ML"
                                    value={productSize}
                                    onChange={e => setProductSize(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400">Print Size</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded text-sm"
                                    placeholder="e.g., 19.6 x 9 cm"
                                    value={printSize}
                                    onChange={e => setPrintSize(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400">MOQ</label>
                                <input
                                    type="number"
                                    className="w-full border p-2 rounded text-sm"
                                    value={moq}
                                    onChange={e => setMoq(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* Tool Tabs */}
                        <div className="flex border-b">
                            <button
                                className={`flex-1 py-2 text-xs font-medium ${activeTab === 'background' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                                onClick={() => setActiveTab('background')}
                            >
                                Background
                            </button>
                            <button
                                className={`flex-1 py-2 text-xs font-medium ${activeTab === 'shapes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                                onClick={() => setActiveTab('shapes')}
                            >
                                Shapes
                            </button>
                            <button
                                className={`flex-1 py-2 text-xs font-medium ${activeTab === 'text' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                                onClick={() => setActiveTab('text')}
                            >
                                Text
                            </button>
                            <button
                                className={`flex-1 py-2 text-xs font-medium ${activeTab === 'elements' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                                onClick={() => setActiveTab('elements')}
                            >
                                Elements
                            </button>
                        </div>

                        {/* Tool Content */}
                        <div className="space-y-2">
                            {activeTab === 'background' && (
                                <div>
                                    <button
                                        className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 text-sm font-medium"
                                        onClick={() => bgImageInputRef.current.click()}
                                    >
                                        📷 Upload Product Image
                                    </button>
                                    <input type="file" ref={bgImageInputRef} hidden onChange={handleBackgroundUpload} accept="image/*" />
                                    {backgroundImageUrl && (
                                        <p className="text-xs text-green-600 mt-2">✓ Background uploaded</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'shapes' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="p-3 border rounded hover:bg-gray-50 text-sm" onClick={() => addShape('rect')}>
                                        ⬜ Rectangle
                                    </button>
                                    <button className="p-3 border rounded hover:bg-gray-50 text-sm" onClick={() => addShape('rounded')}>
                                        🔲 Rounded
                                    </button>
                                    <button className="p-3 border rounded hover:bg-gray-50 text-sm" onClick={() => addShape('circle')}>
                                        ⚫ Circle
                                    </button>
                                    <button className="p-3 border rounded hover:bg-gray-50 text-sm" onClick={() => addShape('triangle')}>
                                        🔺 Triangle
                                    </button>
                                    <button className="p-3 border rounded hover:bg-gray-50 text-sm" onClick={() => addShape('star')}>
                                        ⭐ Star
                                    </button>
                                    <button className="p-3 border rounded hover:bg-gray-50 text-sm" onClick={() => addShape('heart')}>
                                        ❤️ Heart
                                    </button>
                                </div>
                            )}

                            {activeTab === 'text' && (
                                <div>
                                    <button className="w-full bg-indigo-500 text-white p-3 rounded hover:bg-indigo-600 text-sm font-medium" onClick={addText}>
                                        T Add Text
                                    </button>
                                </div>
                            )}

                            {activeTab === 'elements' && (
                                <div className="space-y-2">
                                    <button
                                        className="w-full bg-purple-500 text-white p-3 rounded hover:bg-purple-600 text-sm font-medium"
                                        onClick={addPlaceholder}
                                    >
                                        📷 Add Photo Placeholder
                                    </button>
                                    <button
                                        className="w-full bg-pink-500 text-white p-3 rounded hover:bg-pink-600 text-sm font-medium"
                                        onClick={() => graphicInputRef.current.click()}
                                    >
                                        🎨 Upload Graphic
                                    </button>
                                    <input type="file" ref={graphicInputRef} hidden onChange={handleGraphicUpload} accept="image/*" />
                                </div>
                            )}
                        </div>

                        {/* Layer Controls & Properties */}
                        {selectedObject && (
                            <div className="border-t pt-4 space-y-4 text-left">
                                <div>
                                    <h3 className="font-bold text-sm text-gray-700 mb-2">Adjust Size & Angle</h3>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500 uppercase">Width</label>
                                            <input
                                                type="number"
                                                className="w-full border p-1 rounded text-xs"
                                                value={objProps.width}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    const ratio = val / selectedObject.getScaledWidth();
                                                    updateProperty('scaleX', selectedObject.scaleX * ratio);
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500 uppercase">Height</label>
                                            <input
                                                type="number"
                                                className="w-full border p-1 rounded text-xs"
                                                value={objProps.height}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    const ratio = val / selectedObject.getScaledHeight();
                                                    updateProperty('scaleY', selectedObject.scaleY * ratio);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 uppercase">Rotation (°)</label>
                                        <input
                                            type="number"
                                            className="w-full border p-1 rounded text-xs"
                                            value={objProps.angle}
                                            onChange={(e) => updateProperty('angle', Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                {/* Text Styles Section - Only for text objects */}
                                {(selectedObject.type === 'i-text' || selectedObject.type === 'text') && (
                                    <div>
                                        <h3 className="font-bold text-sm text-gray-700 mb-2">Text Styles</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <label className="text-[10px] text-gray-500 uppercase w-12">Color</label>
                                                <input
                                                    type="color"
                                                    className="flex-1 h-8 rounded border p-0.5 cursor-pointer"
                                                    value={objProps.fill}
                                                    onChange={(e) => updateProperty('fill', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-[10px] text-gray-500 uppercase w-12">Size</label>
                                                <input
                                                    type="number"
                                                    className="flex-1 border p-1 rounded text-xs"
                                                    value={objProps.fontSize}
                                                    onChange={(e) => updateProperty('fontSize', Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-[10px] text-gray-500 uppercase w-12">Font</label>
                                                <select
                                                    className="flex-1 border p-1 rounded text-xs"
                                                    value={objProps.fontFamily}
                                                    onChange={(e) => updateProperty('fontFamily', e.target.value)}
                                                >
                                                    {fonts.map(font => (
                                                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="font-bold text-sm text-gray-700 mb-2">Layer Order & Locking</h3>
                                    <div className="flex items-center gap-2 mb-1 bg-gray-50 p-2 rounded border">
                                        <input
                                            type="checkbox"
                                            id="lockObj"
                                            className="w-4 h-4 cursor-pointer"
                                            checked={objProps.locked}
                                            onChange={(e) => updateProperty('locked', e.target.checked)}
                                        />
                                        <label htmlFor="lockObj" className="text-xs font-bold text-gray-700 cursor-pointer flex items-center gap-1">
                                            {objProps.locked ? '🔒 Locked' : '🔓 Unlocked'}
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3 bg-indigo-50 p-2 rounded border border-indigo-200">
                                        <input
                                            type="checkbox"
                                            id="isPlaceholder"
                                            className="w-4 h-4 cursor-pointer"
                                            checked={objProps.role === 'placeholder'}
                                            onChange={(e) => {
                                                const isPlaceholder = e.target.checked;
                                                updateProperty('role', isPlaceholder ? 'placeholder' : null);

                                                if (isPlaceholder) {
                                                    // Apply placeholder visual style
                                                    updateProperty('fill', 'rgba(255, 228, 225, 0.6)');
                                                    updateProperty('stroke', '#ff6b6b');
                                                    updateProperty('strokeWidth', 3);
                                                    updateProperty('strokeDashArray', [10, 5]);
                                                    updateProperty('locked', false);
                                                } else {
                                                    // Revert to default style
                                                    updateProperty('stroke', '#333');
                                                    updateProperty('strokeWidth', 2);
                                                    updateProperty('strokeDashArray', null);
                                                    updateProperty('fill', '#cccccc');
                                                }
                                            }}
                                        />
                                        <div className="flex flex-col">
                                            <label htmlFor="isPlaceholder" className="text-xs font-bold text-indigo-700 cursor-pointer flex items-center gap-1">
                                                📷 Is Placeholder?
                                            </label>
                                            <span className="text-[10px] text-gray-500">Allow users to upload photos here</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button className="p-2 border rounded hover:bg-gray-50 text-xs" onClick={bringToFront} title="Bring to Front">
                                            ⬆️ Up
                                        </button>
                                        <button className="p-2 border rounded hover:bg-gray-50 text-xs" onClick={sendToBack} title="Send to Back">
                                            ⬇️ Down
                                        </button>
                                        <button className="p-2 border rounded hover:bg-red-50 text-red-600 text-xs font-bold" onClick={deleteObject} title="Delete">
                                            🗑️ Del
                                        </button>
                                    </div>
                                    {(selectedObject.type === 'image' || selectedObject.type === 'fabric.Image') && selectedObject.id !== 'background_image' && (
                                        <button
                                            className="w-full mt-2 p-2 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-bold hover:bg-blue-100"
                                            onClick={setAsBackground}
                                        >
                                            📷 Set as Background
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Center - Canvas */}
                <div className="flex-1 flex items-center justify-center bg-gray-100 p-8">
                    <div className="shadow-2xl border-4 border-white rounded">
                        <canvas ref={canvasRef} />
                    </div>
                </div>

                {/* Right Sidebar - Layers (Future Enhancement) */}
                <div className="w-64 bg-white border-l p-4">
                    <h3 className="font-bold text-sm text-gray-700 mb-3">Layers</h3>
                    <p className="text-xs text-gray-500">Layers panel coming soon...</p>
                </div>
            </div>
        </div>
    );
};

export default CreateTemplate;
