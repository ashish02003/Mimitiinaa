import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as fabric from 'fabric';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { resizeImage } from '../utils/imageUtils';
import { processImageForShape } from '../utils/customizationApi';

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

        initCanvas.on('selection:created', handleSelection);
        initCanvas.on('selection:updated', handleSelection);
        initCanvas.on('selection:cleared', handleCleared);

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
                    fileInputRef.current.click();
                    initCanvas.activePlaceholder = opt.target;
                } else if (opt.target.role === 'placeholder-label') {
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
                        const role = item.role || originalObj.role;
                        const id = item.id || originalObj.id;

                        // Placeholder logic
                        if (role === 'placeholder' || id === 'user_photo_area') {
                            item.set({
                                role: 'placeholder',
                                id: id, // Ensure ID is set
                                selectable: true,
                                evented: true, // CRITICAL: Must be evented to receive clicks
                                lockMovementX: true,
                                lockMovementY: true,
                                lockScalingX: true,
                                lockScalingY: true,
                                lockRotation: true,
                                stroke: '#3498db',
                                strokeWidth: 2,
                                strokeDashArray: [5, 5],
                                fill: 'rgba(52, 152, 219, 0.05)', // Very light blue tint
                                originX: 'center',
                                originY: 'center',
                                hoverCursor: 'pointer'
                            });

                            const center = item.getCenterPoint();
                            const label = new fabric.IText('Select\nPhoto', {
                                fontSize: Math.min(item.width, item.height) / 5, // Responsive text size
                                fill: '#ffffff',
                                backgroundColor: '#3498db',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                originX: 'center',
                                originY: 'center',
                                left: center.x,
                                top: center.y,
                                selectable: false,
                                evented: false, // Let clicks pass through to the placeholder
                                role: 'placeholder-label',
                                placeholderRef: item,
                                padding: 10,
                                rx: 5, // Rounded corners (if supported or simulated)
                                ry: 5
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
        if (!file || !canvas) return;
        const loadingToast = toast.loading('Uploading...');
        try {
            const resized = await resizeImage(file, 1500, 1500);
            const localUrl = URL.createObjectURL(resized);

            let placeholder = canvas.activePlaceholder || canvas.getActiveObject();
            if (!placeholder || placeholder.role !== 'placeholder') {
                placeholder = canvas.getObjects().find(o => o.role === 'placeholder');
            }
            if (!placeholder) return toast.error("Select area", { id: loadingToast });

            const img = await fabric.FabricImage.fromURL(localUrl);
            const mask = await placeholder.clone();
            mask.set({ absolutePositioned: false, left: 0, top: 0, originX: 'center', originY: 'center', scaleX: 1, scaleY: 1 });

            const scale = Math.max(placeholder.width / img.width, placeholder.height / img.height);
            img.set({ scaleX: scale, scaleY: scale, originX: 'center', originY: 'center', role: 'clipped-image' });

            const group = new fabric.Group([img], {
                left: placeholder.getCenterPoint().x, top: placeholder.getCenterPoint().y,
                scaleX: placeholder.scaleX, scaleY: placeholder.scaleY, angle: placeholder.angle,
                originX: 'center', originY: 'center', clipPath: mask, role: 'image-group', maskRef: placeholder
            });

            placeholder.set({ visible: false, selectable: false });
            canvas.getObjects().filter(o => o.role === 'placeholder-label' && o.placeholderRef === placeholder).forEach(l => l.set('visible', false));

            canvas.add(group);
            canvas.setActiveObject(group);
            if (canvas.overlayImage) canvas.bringObjectToFront(canvas.overlayImage);
            canvas.renderAll();
            toast.success("Design Applied!", { id: loadingToast });
        } catch (err) { toast.error("Error", { id: loadingToast }); }
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
                addItemToCart(payload);
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
            <div className="bg-white p-6 rounded-xl max-w-2xl w-full relative">
                <button className="absolute top-4 right-4 text-2xl font-bold" onClick={() => setPreviewModalOpen(false)}>×</button>
                <h2 className="text-xl font-bold mb-4 text-center">Design Preview</h2>
                <div className="relative flex justify-center bg-gray-100 rounded p-4 h-[400px]">
                    <img src={previewImage} alt="Final" className="h-full object-contain" />
                    {template.overlayImageUrl && <img src={template.overlayImageUrl} alt="Mockup" className="absolute h-full object-contain pointer-events-none" />}
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button className="px-4 py-2 border rounded" onClick={() => setPreviewModalOpen(false)}>Close</button>
                    <button className="px-6 py-2 bg-blue-600 text-white font-bold rounded" onClick={() => { setPreviewModalOpen(false); handleAddToCart(true); }}>Buy Now</button>
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
                        <button onClick={() => addToCanvas(new fabric.IText('Your Text', { fontFamily: 'Arial', fontSize: 24 }))} className="w-full bg-white border py-3 rounded hover:bg-gray-100 font-serif text-lg">Add Heading</button>
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




