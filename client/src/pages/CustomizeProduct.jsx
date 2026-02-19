import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as fabric from 'fabric';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { processImageForShape } from '../utils/customizationAPI';

const CustomizeProduct = () => {
    const { id } = useParams();
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const [canvas, setCanvas] = useState(null);
    const [template, setTemplate] = useState(null);
    const [activeTab, setActiveTab] = useState('image');
    const [selectedObject, setSelectedObject] = useState(null);
    const [isPanning, setIsPanning] = useState(false);
    const [loadingAction, setLoadingAction] = useState(null);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    const { user } = useAuth();
    const { addToCart } = useCart();
    const navigate = useNavigate();

    // Fetch Template
    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const { data } = await axios.get(`http://localhost:5000/api/templates/${id}`);
                setTemplate(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchTemplate();
    }, [id]);

    // Initialize Canvas
    useEffect(() => {
        if (!template || !canvasRef.current) return;

        const initCanvas = new fabric.Canvas(canvasRef.current, {
            height: 600,
            width: 400,
            backgroundColor: '#ffffff',
            preserveObjectStacking: true
        });

        setCanvas(initCanvas);

        // Selection Events
        const handleSelection = (e) => {
            const obj = e.selected ? e.selected[0] : (e.target || null);
            if (obj && (obj.locked === true || obj.locked === 'true')) {
                initCanvas.discardActiveObject();
                setSelectedObject(null);
                return;
            }
            setSelectedObject(obj);
            setIsPanning(false);
        };

        const handleCleared = () => {
            setSelectedObject(null);
            setIsPanning(false);
        };

        // Constrain dragged images to stay inside their placeholder area
        const handleObjectMoving = (e) => {
            const obj = e.target;
            if (!obj) return;

            // 1) When the user moves the placeholder shape itself,
            // keep the clipped image centered inside it.
            if (obj.role === 'placeholder') {
                const placeholder = obj;
                const linkedImage = initCanvas.getObjects().find(
                    (o) => o.role === 'clipped-image' && o.maskRef === placeholder
                );
                if (linkedImage) {
                    const c = placeholder.getCenterPoint();
                    linkedImage.set({ left: c.x, top: c.y });
                    initCanvas.renderAll();
                }
                return;
            }

            // 2) When the user moves the clipped image, keep it within the bounds of its placeholder
            if (obj.role !== 'clipped-image' || !obj.maskRef) return;

            const placeholder = obj.maskRef;
            if (!placeholder || typeof placeholder.getScaledWidth !== 'function') return;

            const pCenter = placeholder.getCenterPoint();
            const pW = placeholder.getScaledWidth();
            const pH = placeholder.getScaledHeight();
            const oW = obj.getScaledWidth();
            const oH = obj.getScaledHeight();

            if (!pW || !pH || !oW || !oH) return;

            // Allowed center range so that image stays fully within placeholder bounds
            const minX = pCenter.x - (pW - oW) / 2;
            const maxX = pCenter.x + (pW - oW) / 2;
            const minY = pCenter.y - (pH - oH) / 2;
            const maxY = pCenter.y + (pH - oH) / 2;

            const newCenter = obj.getCenterPoint();
            let x = newCenter.x;
            let y = newCenter.y;

            if (pW > oW) {
                x = Math.min(Math.max(x, minX), maxX);
            } else {
                x = pCenter.x;
            }

            if (pH > oH) {
                y = Math.min(Math.max(y, minY), maxY);
            } else {
                y = pCenter.y;
            }

            obj.set({
                left: x,
                top: y
            });
        };

        initCanvas.on('selection:created', handleSelection);
        initCanvas.on('selection:updated', handleSelection);
        initCanvas.on('selection:cleared', handleCleared);
        initCanvas.on('object:moving', handleObjectMoving);

        // Keyboard Delete Logic
        const handleKeyDown = (e) => {
            // CRITICAL FIX: Ignore delete/backspace if user is typing in ANY input or textarea
            const isTyping = e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.isContentEditable;

            if (isTyping) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                const activeObj = initCanvas.getActiveObject();
                if (activeObj && !activeObj.isEditing) {
                    if (activeObj.locked === true || activeObj.locked === 'true' || activeObj.role === 'placeholder') {
                        toast.error("Admin elements cannot be deleted");
                        e.preventDefault();
                        return;
                    }
                    // RESTORE PLACEHOLDER IF DELETING CLIPPED IMAGE OR GROUP
                    if ((activeObj.role === 'clipped-image' || activeObj.role === 'image-group') && activeObj.maskRef) {
                        const mask = activeObj.maskRef;
                        mask.set({ visible: true, selectable: true, evented: true });
                        const label = initCanvas.getObjects().find(obj =>
                            obj.role === 'placeholder-label' &&
                            (obj.placeholderRef === mask || obj.id === `label_${mask.id}`)
                        );
                        if (label) label.set({ visible: true });
                    }

                    initCanvas.remove(activeObj);
                    initCanvas.renderAll();
                    setSelectedObject(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        initCanvas.on('mouse:down', (opt) => {
            if (opt.target) {
                if (opt.target.role === 'placeholder') {
                    // Prevent selection/movement when clicking to upload
                    initCanvas.discardActiveObject();
                    // Don't hide placeholder here - only hide after successful upload
                    fileInputRef.current.click();
                    initCanvas.activePlaceholder = opt.target;
                } else if (opt.target.role === 'placeholder-label') {
                    initCanvas.discardActiveObject();
                    fileInputRef.current.click();
                    initCanvas.activePlaceholder = opt.target.placeholderRef;
                }
            }
        });

        const setupTemplate = async () => {
            // 1. Background Image
            if (template.backgroundImageUrl) {
                try {
                    const isWebUrl = template.backgroundImageUrl.startsWith('http');
                    const bgUrl = isWebUrl
                        ? template.backgroundImageUrl + (template.backgroundImageUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime()
                        : template.backgroundImageUrl;

                    const img = await fabric.FabricImage.fromURL(bgUrl, {
                        crossOrigin: isWebUrl ? 'anonymous' : undefined
                    });

                    const scale = Math.min(initCanvas.width / img.width, initCanvas.height / img.height);
                    img.set({
                        scaleX: scale, scaleY: scale,
                        left: initCanvas.width / 2, top: initCanvas.height / 2,
                        originX: 'center', originY: 'center',
                        selectable: false, evented: false
                    });

                    initCanvas.add(img);
                    initCanvas.sendObjectToBack(img);
                    initCanvas.productImage = img;
                    initCanvas.renderAll();
                } catch (error) {
                    console.error('Failed to load background image:', error);
                }
            }

            // 2. Load Top Overlay
            if (template.overlayImageUrl && template.overlayImageUrl.includes('http')) {
                try {
                    const img = await fabric.FabricImage.fromURL(template.overlayImageUrl, { crossOrigin: 'anonymous' });
                    img.scaleToWidth(300);
                    img.set({
                        left: (initCanvas.width - img.getScaledWidth()) / 2,
                        top: 50, selectable: false, evented: false
                    });
                    initCanvas.overlayImage = img;
                    initCanvas.add(img);
                    initCanvas.bringObjectToFront(img);
                    initCanvas.renderAll();
                } catch (error) {
                    console.error('Failed to load overlay image:', error);
                }
            }

            // 3. Load Objects
            if (template.canvasSettings && template.canvasSettings.objects) {
                try {
                    const objectsToLoad = JSON.parse(JSON.stringify(template.canvasSettings.objects)).map(obj => {
                        if (obj.src && obj.src.startsWith('http')) {
                            obj.src = obj.src + (obj.src.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
                            obj.crossOrigin = 'anonymous';
                        }
                        return obj;
                    });

                    const objs = await fabric.util.enlivenObjects(objectsToLoad);
                    objs.forEach((item, index) => {
                        const originalObj = objectsToLoad[index];
                        if (originalObj.id === 'background_image') return;

                        // Restoration logic: Verify role/id from original JSON if missing on instance
                        let role = item.role || originalObj.role;
                        const id = item.id || originalObj.id;

                        // Heuristic: older templates may not have role="placeholder" saved.
                        // Detect photo areas by their admin styling (red dashed stroke / soft pink fill).
                        const looksLikeAdminPlaceholder =
                            !role &&
                            originalObj.strokeDashArray &&
                            Array.isArray(originalObj.strokeDashArray) &&
                            originalObj.strokeDashArray.length > 0 &&
                            (originalObj.stroke === '#ff6b6b' ||
                                originalObj.fill === 'rgba(255, 228, 225, 0.6)');

                        if (looksLikeAdminPlaceholder) {
                            role = 'placeholder';
                        }

                        // Placeholder logic
                        if (role === 'placeholder' || id === 'user_photo_area') {
                            // Preserve shapeType from original object (star, circle, etc.)
                            const preservedShapeType = item.shapeType || originalObj.shapeType;
                            
                            item.set({
                                role: 'placeholder',
                                id: id || `placeholder_${index}`, // Ensure ID is present
                                shapeType: preservedShapeType, // CRITICAL: Preserve shapeType for clipping
                                selectable: true,
                                evented: true,
                                // Lock movement initially - unlock only after image is uploaded
                                lockMovementX: true,
                                lockMovementY: true,
                                lockScalingX: true,
                                lockScalingY: true,
                                lockRotation: true,
                                // Hide admin red dashed styling on user side
                                strokeWidth: 0,
                                stroke: 'transparent',
                                strokeDashArray: null,
                                fill: 'rgba(0, 0, 0, 0.05)', // Subtle gray fill indicating area
                                originX: 'center',
                                originY: 'center',
                                hoverCursor: 'pointer'
                            });
                            
                            // Also set on instance for serialization
                            item.shapeType = preservedShapeType;

                            const center = item.getCenterPoint();
                            const labelId = `label_${item.id}`;
                            const label = new fabric.IText('Select\nPhoto', {
                                fontSize: Math.min(item.width, item.height) / 5,
                                fill: '#555555',
                                backgroundColor: 'transparent', // Clean formatting
                                fontWeight: 'bold',
                                textAlign: 'center',
                                originX: 'center',
                                originY: 'center',
                                left: center.x,
                                top: center.y,
                                selectable: false,
                                evented: false,
                                role: 'placeholder-label',
                                id: labelId,
                                placeholderRef: item,
                            });
                            initCanvas.add(item, label);
                        } else {
                            item.set({ selectable: false, evented: false });
                            initCanvas.add(item);
                        }
                    });
                    initCanvas.renderAll();
                    if (initCanvas.productImage) initCanvas.sendObjectToBack(initCanvas.productImage);
                } catch (e) { console.error(e); }
            }
        };

        setupTemplate();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            initCanvas.off('selection:created', handleSelection);
            initCanvas.off('selection:updated', handleSelection);
            initCanvas.off('selection:cleared', handleCleared);
            initCanvas.off('object:moving', handleObjectMoving);
            initCanvas.dispose();
        };
    }, [template?._id]);

    // Helpers
    const addToCanvas = (obj) => {
        if (!canvas) return;
        obj.set({
            left: canvas.width / 2, top: canvas.height / 2,
            originX: 'center', originY: 'center'
        });
        canvas.add(obj);
        canvas.setActiveObject(obj);
        if (canvas.overlayImage) canvas.bringObjectToFront(canvas.overlayImage);
        canvas.renderAll();
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !canvas) {
            // If no file selected, clear the active placeholder reference but keep it visible
            canvas.activePlaceholder = null;
            return;
        }

        // Reset input value to allow re-uploading the same file
        e.target.value = '';

        const loadingToast = toast.loading('Uploading...');
        try {
            // 1. Identify Placeholder Logic
            let placeholder = canvas.activePlaceholder || canvas.getActiveObject();

            // Validation: Ensure selected object is actually a placeholder
            if (placeholder && placeholder.role !== 'placeholder') {
                placeholder = null;
            }

            // Fallback 1: Find first visible placeholder by role
            if (!placeholder) {
                const candidates = canvas.getObjects().filter(o => o.role === 'placeholder');
                placeholder = candidates.find(o => o.visible !== false) || candidates[0];
            }

            // Fallback 2: Check by ID (legacy support or specific naming)
            if (!placeholder) {
                placeholder = canvas.getObjects().find(o => o.id && (o.id === 'user_photo_area' || o.id.startsWith('placeholder')));
            }

            // Fallback 3: Heuristic – use largest non-background shape as placeholder (for templates like "Key")
            if (!placeholder) {
                const candidateShapes = canvas.getObjects().filter(o => {
                    if (o.id === 'background_image') return false;
                    if (o.role === 'placeholder-label') return false;
                    if (o.type === 'image') return false;
                    return typeof o.getScaledWidth === 'function' && typeof o.getScaledHeight === 'function';
                });

                if (candidateShapes.length > 0) {
                    candidateShapes.sort((a, b) => {
                        const areaA = (a.getScaledWidth() || 0) * (a.getScaledHeight() || 0);
                        const areaB = (b.getScaledWidth() || 0) * (b.getScaledHeight() || 0);
                        return areaB - areaA;
                    });
                    placeholder = candidateShapes[0];
                    // Mark it as a placeholder for subsequent uploads
                    placeholder.set({ role: 'placeholder' });
                    placeholder.role = 'placeholder';
                }
            }

            if (!placeholder) {
                return toast.error("No photo area found on this design. Please ask admin to mark a placeholder.", { id: loadingToast });
            }

            // 2. Build shape data for backend clipping (supports custom/path placeholders e.g. "Key")
            const width = placeholder.getScaledWidth();
            const height = placeholder.getScaledHeight();

            if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 1 || height <= 1) {
                return toast.error('Invalid placeholder size. Please ask admin to re-save the template.', { id: loadingToast });
            }

            // Map common Fabric/template shapeType values to backend-supported types
            const mapShapeType = (t) => {
                const v = (t || '').toLowerCase();
                if (v === 'rect' || v === 'rectangle') return 'rectangle';
                if (v === 'rounded') return 'rounded';
                if (v === 'circle') return 'circle';
                if (v === 'ellipse') return 'ellipse';
                if (v === 'triangle') return 'polygon';
                if (v === 'polygon') return 'polygon';
                if (v === 'star') return 'star';
                if (v === 'heart') return 'heart';
                if (v === 'custom' || v === 'path' || v === 'key') return 'custom';
                return 'rectangle';
            };

            // Try to extract an SVG path "d" for Fabric Path placeholders
            const extractSvgPathD = (obj) => {
                try {
                    if (!obj || typeof obj.toSVG !== 'function') return null;
                    const svg = obj.toSVG();
                    const match = svg && svg.match(/d="([^"]+)"/);
                    return match?.[1] || null;
                } catch {
                    return null;
                }
            };

            // Get shapeType from placeholder (preserved from admin template)
            let detectedShapeType = placeholder.shapeType;
            
            // Fallback: detect from Fabric object type if shapeType not set
            if (!detectedShapeType) {
                if (placeholder.type === 'polygon') {
                    // Check if it's a star by counting points (stars have 10 points for 5-point star)
                    const points = placeholder.points;
                    if (points && points.length === 10) {
                        detectedShapeType = 'star';
                    } else {
                        detectedShapeType = 'polygon';
                    }
                } else if (placeholder.type === 'path') {
                    detectedShapeType = 'custom';
                } else if (placeholder.type === 'circle') {
                    detectedShapeType = 'circle';
                } else if (placeholder.type === 'rect') {
                    detectedShapeType = 'rectangle';
                } else {
                    detectedShapeType = 'rectangle';
                }
            }
            
            let shapeData = {
                shapeType: mapShapeType(detectedShapeType),
                size: { width, height }
            };
            
            // Debug log for troubleshooting
            console.log('Placeholder info:', {
                type: placeholder.type,
                shapeType: placeholder.shapeType,
                detected: detectedShapeType,
                mapped: shapeData.shapeType,
                size: { width, height }
            });

            // If placeholder itself is a Path (or admin used a key outline), send customPath
            if (placeholder.type === 'path' || shapeData.shapeType === 'custom') {
                const d = extractSvgPathD(placeholder);
                if (d) {
                    shapeData = {
                        ...shapeData,
                        shapeType: 'custom',
                        customPath: d
                    };
                } else {
                    // Fallback to rectangle if we can't serialize the path
                    shapeData = { shapeType: 'rectangle', size: { width, height } };
                }
            }

            // 3. Upload + clip image on backend (Cloudinary + Sharp) with progress
            toast.loading('Uploading 0%', { 
                id: loadingToast,
                style: {
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    color: '#16a34a'
                }
            });
            
            const processed = await processImageForShape(file, shapeData, (percent) => {
                // Update toast with green styling and percentage
                toast.loading(`Uploading ${percent}%`, { 
                    id: loadingToast,
                    style: {
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        color: '#16a34a',
                        fontWeight: 'bold'
                    }
                });
            });
            
            // 4. Load final clipped image from Cloudinary
            const img = await fabric.FabricImage.fromURL(processed.clippedUrl, {
                crossOrigin: 'anonymous'
            });

            // 5. Position inside placeholder area
            const center = placeholder.getCenterPoint();
            const pW = width;
            const pH = height;

            // Ensure image fully covers the placeholder bounds
            const baseW = img.width || pW;
            const baseH = img.height || pH;
            const scale = Math.max(pW / baseW, pH / baseH);

            img.set({
                left: center.x,
                top: center.y,
                originX: 'center',
                originY: 'center',
                angle: placeholder.angle || 0,
                role: 'clipped-image',
                maskRef: placeholder,
                selectable: true,
                evented: true,
                scaleX: scale,
                scaleY: scale
            });

            // 6. After image upload, unlock placeholder movement so user can reposition shape+image together
            // But keep it invisible since image is now showing
            placeholder.set({ 
                visible: false, 
                selectable: true, 
                evented: true,
                lockMovementX: false, // Unlock so user can move shape+image together
                lockMovementY: false
            });

            const labelId = `label_${placeholder.id}`;
            const label = canvas.getObjects().find(o =>
                o.id === labelId ||
                (o.role === 'placeholder-label' && o.placeholderRef === placeholder)
            );
            if (label) label.set({ visible: false });
            
            // Clear active placeholder reference
            canvas.activePlaceholder = null;

            canvas.add(img);
            canvas.setActiveObject(img);
            if (canvas.overlayImage) canvas.bringObjectToFront(canvas.overlayImage);

            canvas.renderAll();
            toast.success("Image uploaded! Drag to adjust position.", { 
                id: loadingToast,
                style: {
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    color: '#16a34a',
                    fontWeight: 'bold'
                }
            });
        } catch (err) {
            console.error(err);
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                'Error processing image';
            toast.error(msg, { id: loadingToast });
        }
    };

    const handleAddToCart = async (directBuy = false) => {
        if (!user || !canvas) return navigate('/login');
        setLoadingAction(directBuy ? 'order' : 'cart');
        const loadingToast = toast.loading('Saving...');
        try {
            const ui = canvas.getObjects().filter(o => o.role === 'placeholder' || o.role === 'placeholder-label');
            ui.forEach(o => o.set('visible', false));
            canvas.discardActiveObject();
            canvas.renderAll();
            const dataUrl = canvas.toDataURL({ multiplier: 2 });
            ui.forEach(o => o.set('visible', true));

            const blob = await (await fetch(dataUrl)).blob();
            const formData = new FormData();
            formData.append('image', blob, 'design.png');
            const { data } = await axios.post('http://localhost:5000/api/upload', formData);

            const payload = { template: template._id, customizedJson: canvas.toJSON(), finalImageUrl: data.url, price: template.basePrice, qty: 1 };
            if (directBuy) {
                await axios.post('http://localhost:5000/api/orders', { orderItems: [payload], totalPrice: template.basePrice, paymentMethod: 'Card' }, { headers: { Authorization: `Bearer ${user.token}` } });
                navigate('/profile');
            } else {
                await addToCart(payload);
            }
            toast.success("Success!", { id: loadingToast });
        } catch (e) { toast.error("Failed", { id: loadingToast }); }
        finally { setLoadingAction(null); }
    };

    const handlePreview = () => {
        const ui = canvas.getObjects().filter(o => o.role === 'placeholder' || o.role === 'placeholder-label');
        ui.forEach(o => o.set('visible', false));
        canvas.discardActiveObject();
        canvas.renderAll();
        setPreviewImage(canvas.toDataURL({ multiplier: 2 }));
        ui.forEach(o => o.set('visible', true));
        setPreviewModalOpen(true);
    };

    if (!template) return <div className="p-20 text-center">Loading...</div>;

    const TabButton = ({ name, icon, label }) => (
        <button className={`flex-1 p-3 text-center border-b-2 font-medium transition-colors ${activeTab === name ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab(name)}>
            <span className="text-xl block mb-1">{icon}</span>
            <span className="text-sm">{label}</span>
        </button>
    );

    const PreviewModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
                <button className="absolute top-4 right-4 text-2xl font-bold hover:text-gray-600" onClick={() => setPreviewModalOpen(false)}>×</button>
                <h2 className="text-xl font-bold mb-4 text-center">Design Preview</h2>
                
                {/* Product Details Section */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                    <h3 className="font-bold text-lg mb-3 text-gray-800">Product Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="font-semibold text-gray-600">Product Name:</span>
                            <span className="ml-2 text-gray-800">{template.name}</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-600">Category:</span>
                            <span className="ml-2 text-gray-800">{template.category}</span>
                        </div>
                        {template.brand && (
                            <div>
                                <span className="font-semibold text-gray-600">Brand:</span>
                                <span className="ml-2 text-gray-800">{template.brand}</span>
                            </div>
                        )}
                        {template.modelName && (
                            <div>
                                <span className="font-semibold text-gray-600">Model:</span>
                                <span className="ml-2 text-gray-800">{template.modelName}</span>
                            </div>
                        )}
                        {template.caseType && template.caseType !== 'None' && (
                            <div>
                                <span className="font-semibold text-gray-600">Case Type:</span>
                                <span className="ml-2 text-gray-800">{template.caseType}</span>
                            </div>
                        )}
                        {template.productSize && (
                            <div>
                                <span className="font-semibold text-gray-600">Product Size:</span>
                                <span className="ml-2 text-gray-800">{template.productSize}</span>
                            </div>
                        )}
                        {template.printSize && (
                            <div>
                                <span className="font-semibold text-gray-600">Print Size:</span>
                                <span className="ml-2 text-gray-800">{template.printSize}</span>
                            </div>
                        )}
                        {template.moq && (
                            <div>
                                <span className="font-semibold text-gray-600">MOQ:</span>
                                <span className="ml-2 text-gray-800">{template.moq}</span>
                            </div>
                        )}
                        <div className="col-span-2">
                            <span className="font-semibold text-gray-600">Price:</span>
                            <span className="ml-2 text-green-600 font-bold text-lg">₹{template.basePrice}</span>
                        </div>
                    </div>
                </div>

                {/* Preview Image */}
                <div className="relative flex justify-center bg-gray-100 rounded p-4 h-[400px] mb-4">
                    <img src={previewImage} alt="Final" className="h-full object-contain" />
                    {template.overlayImageUrl && <img src={template.overlayImageUrl} alt="Mockup" className="absolute h-full object-contain pointer-events-none" />}
                </div>
                
                <div className="flex justify-end gap-2">
                    <button className="px-4 py-2 border rounded hover:bg-gray-50" onClick={() => setPreviewModalOpen(false)}>Close</button>
                    <button className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700" onClick={() => { setPreviewModalOpen(false); handleAddToCart(true); }}>Buy Now</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-4 flex flex-col lg:flex-row h-[calc(100vh-80px)] gap-6">
            {previewModalOpen && <PreviewModal />}
            <div className="flex-1 bg-gray-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="shadow-2xl border-[10px] border-white rounded-[2rem] bg-white">
                    <canvas ref={canvasRef} />
                </div>
                <button onClick={handlePreview} className="absolute top-4 right-4 bg-white px-4 py-2 rounded shadow font-bold">👁️ Preview</button>
            </div>
            <div className="w-full lg:w-[400px] bg-white shadow-xl rounded-xl flex flex-col h-full border">
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold">{template.name}</h1>
                    <p className="text-green-600 font-bold">₹{template.basePrice}</p>
                </div>
                <div className="flex border-b bg-gray-50">
                    <TabButton name="image" icon="📷" label="Images" />
                    <TabButton name="text" icon="T" label="Text" />
                    <TabButton name="emoji" icon="😊" label="Emoji" />
                    <TabButton name="shapes" icon="🔷" label="Shapes" />
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {activeTab === 'image' && (
                        <div className="space-y-4">
                            <button onClick={() => fileInputRef.current.click()} className="w-full border-2 border-dashed border-indigo-300 py-6 rounded-lg text-indigo-600 hover:bg-indigo-50 font-medium">+ Upload Photo</button>
                            <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} />
                        </div>
                    )}
                    {activeTab === 'text' && (
                        <div className="space-y-4">
                            <button onClick={() => addToCanvas(new fabric.IText('Your Text', { fontFamily: 'Arial', fontSize: 24, fill: '#000000' }))} className="w-full bg-white border py-3 rounded hover:bg-gray-100 font-serif text-lg">Add Heading</button>
                            {selectedObject && (selectedObject.type === 'i-text' || selectedObject.type === 'text') && (
                                <div className="p-4 bg-white border rounded space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 mb-1 block">Text Color</label>
                                        <input
                                            type="color"
                                            value={selectedObject.fill || '#000000'}
                                            onChange={(e) => {
                                                selectedObject.set('fill', e.target.value);
                                                canvas.renderAll();
                                            }}
                                            className="w-full h-10 rounded border cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 mb-1 block">Font Size</label>
                                        <input
                                            type="number"
                                            min="8"
                                            max="200"
                                            value={selectedObject.fontSize || 24}
                                            onChange={(e) => {
                                                selectedObject.set('fontSize', Number(e.target.value));
                                                canvas.renderAll();
                                            }}
                                            className="w-full border p-2 rounded"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 mb-1 block">Font Style</label>
                                        <select
                                            value={selectedObject.fontFamily || 'Arial'}
                                            onChange={(e) => {
                                                selectedObject.set('fontFamily', e.target.value);
                                                canvas.renderAll();
                                            }}
                                            className="w-full border p-2 rounded"
                                        >
                                            <option value="Arial">Arial</option>
                                            <option value="Times New Roman">Times New Roman</option>
                                            <option value="Courier New">Courier New</option>
                                            <option value="Georgia">Georgia</option>
                                            <option value="Verdana">Verdana</option>
                                            <option value="Impact">Impact</option>
                                            <option value="Comic Sans MS">Comic Sans MS</option>
                                            <option value="Roboto">Roboto</option>
                                            <option value="Open Sans">Open Sans</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 mb-2 block">Text Formatting</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const isBold = selectedObject.fontWeight === 'bold';
                                                    selectedObject.set('fontWeight', isBold ? 'normal' : 'bold');
                                                    canvas.renderAll();
                                                }}
                                                className={`flex-1 p-2 border rounded text-sm font-semibold ${
                                                    selectedObject.fontWeight === 'bold' 
                                                        ? 'bg-blue-500 text-white' 
                                                        : 'bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            >
                                                <strong>B</strong>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const isItalic = selectedObject.fontStyle === 'italic';
                                                    selectedObject.set('fontStyle', isItalic ? 'normal' : 'italic');
                                                    canvas.renderAll();
                                                }}
                                                className={`flex-1 p-2 border rounded text-sm ${
                                                    selectedObject.fontStyle === 'italic' 
                                                        ? 'bg-blue-500 text-white italic' 
                                                        : 'bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            >
                                                <em>I</em>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'emoji' && (
                        <EmojiPicker onEmojiClick={(d) => addToCanvas(new fabric.IText(d.emoji, { fontSize: 50 }))} width="100%" height={350} />
                    )}
                    {activeTab === 'shapes' && (
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => addToCanvas(new fabric.Rect({ width: 80, height: 80, fill: '#ff4444' }))} className="aspect-square bg-red-500 rounded"></button>
                            <button onClick={() => addToCanvas(new fabric.Circle({ radius: 40, fill: '#44ff44' }))} className="aspect-square bg-green-500 rounded-full"></button>
                            <button onClick={() => addToCanvas(new fabric.Triangle({ width: 80, height: 80, fill: '#4444ff' }))} className="aspect-square bg-blue-500" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></button>
                        </div>
                    )}
                    {selectedObject && (
                        <div className="mt-6 p-4 bg-white border rounded shadow-sm">
                            <p className="text-xs font-bold text-gray-400 mb-3 uppercase">Controls</p>
                            <div className="flex gap-2">
                                <button onClick={() => { canvas.bringToFront(selectedObject); if (canvas.overlayImage) canvas.bringToFront(canvas.overlayImage); canvas.renderAll(); }} className="flex-1 p-2 bg-gray-50 text-[11px] font-bold border rounded">Front</button>
                                <button onClick={() => { canvas.sendToBack(selectedObject); if (canvas.productImage) canvas.sendToBack(canvas.productImage); canvas.renderAll(); }} className="flex-1 p-2 bg-gray-50 text-[11px] font-bold border rounded">Back</button>
                                <button onClick={() => { canvas.remove(selectedObject); setSelectedObject(null); canvas.renderAll(); }} className="flex-1 p-2 bg-red-50 text-red-600 text-[11px] font-bold border rounded">Delete</button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t space-y-3 bg-white">
                    <button onClick={() => handleAddToCart(false)} className="w-full border-2 border-blue-600 text-blue-600 font-bold py-3 rounded-xl disabled:opacity-50" disabled={!!loadingAction}>
                        {loadingAction === 'cart' ? 'ADDING...' : 'ADD TO CART'}
                    </button>
                    <button onClick={() => handleAddToCart(true)} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl text-lg shadow-lg" disabled={!!loadingAction}>
                        {loadingAction === 'order' ? 'PLACING...' : `BUY NOW - ₹${template.basePrice}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomizeProduct;




