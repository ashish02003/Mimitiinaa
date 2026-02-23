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
    const demoImageInputRef = useRef(null);
    const [canvas, setCanvas] = useState(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState(0);
    const [demoImageUrl, setDemoImageUrl] = useState('');
    const [variantNo, setVariantNo] = useState('');
    const [productSize, setProductSize] = useState('');
    const [printSize, setPrintSize] = useState('');
    const [moq, setMoq] = useState(1);
    const [categories, setCategories] = useState([]); // 👈 NEW
    const [activeTab, setActiveTab] = useState('background'); // background, shapes, text, elements

    // Fetch Categories – default to first category so new templates save under correct category
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/categories');
                setCategories(data);
                setCategory(prev => {
                    if (data.length === 0) return prev;
                    if (prev === '' || !data.some(c => c.name === prev)) return data[0].name;
                    return prev;
                });
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

    // Custom Shape Drawing State
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [drawPoints, setDrawPoints] = useState([]);
    const drawPointsRef = useRef([]); // Ref for stable access in event handlers
    const [useSmoothCurve, setUseSmoothCurve] = useState(false); // false = exact points (straight edges), true = smooth curve between points
    const [tempObjects, setTempObjects] = useState([]);
    const [isEditingPoints, setIsEditingPoints] = useState(false);
    const editingShapeRef = useRef(null); // shape being edited (for add-point-on-segment)
    const addPointOnSegmentRef = useRef(() => {});
    const bendingSegmentRef = useRef(null); // segment index when dragging line to make curve (screenshot behaviour)
    const hoveredSegmentRef = useRef(-1);
    const segmentOverlayRef = useRef(null); // highlight overlay for selected/hovered line
    const [wrapType, setWrapType] = useState('none'); // 'none' | 'mug' | 'bottle'

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

    // --- HANDLE CUSTOM SHAPE DRAWING EVENTS ---
    useEffect(() => {
        if (!canvas || !isDrawingMode) return;

        canvas.defaultCursor = 'crosshair';
        canvas.selection = false;
        drawPointsRef.current = []; // Reset ref

        const handleMouseDown = (opt) => {
            if (opt.e.button === 2) return; // Right click ignore

            const pointer = canvas.getPointer(opt.e);
            let x = pointer.x;
            let y = pointer.y;

            // Snap to Grid
            if (objProps.snapToGrid) {
                x = Math.round(x / 10) * 10;
                y = Math.round(y / 10) * 10;
            }

            // Handle clicking first point to close shape
            if (drawPointsRef.current.length > 2) {
                const firstPt = drawPointsRef.current[0];
                const dist = Math.sqrt(Math.pow(x - firstPt.x, 2) + Math.pow(y - firstPt.y, 2));
                if (dist < 15) {
                    finishDrawing();
                    return;
                }
            }

            drawPointsRef.current.push({ x, y });
            setDrawPoints([...drawPointsRef.current]);

            // Add visual dot
            const dot = new fabric.Circle({
                left: x,
                top: y,
                radius: 5,
                fill: '#3498db',
                stroke: 'white',
                strokeWidth: 2,
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
                id: 'draw_dot'
            });
            canvas.add(dot);

            if (drawPointsRef.current.length > 1) {
                const prevPt = drawPointsRef.current[drawPointsRef.current.length - 2];
                const line = new fabric.Line([prevPt.x, prevPt.y, x, y], {
                    stroke: '#3498db',
                    strokeWidth: 2,
                    selectable: false,
                    evented: false,
                    id: 'draw_line'
                });
                canvas.add(line);
            }
            canvas.renderAll();
        };

        const handleMouseMove = (opt) => {
            const pointer = canvas.getPointer(opt.e);
            const pts = drawPointsRef.current;
            if (pts.length === 0) return;

            const lastPt = pts[pts.length - 1];

            // Remove old preview line and add new one from last point to cursor (fixes random dotted line)
            const oldLine = canvas.getObjects().find(o => o.id === 'temp_move_line');
            if (oldLine) canvas.remove(oldLine);

            const moveLine = new fabric.Line([lastPt.x, lastPt.y, pointer.x, pointer.y], {
                stroke: 'rgba(52, 152, 219, 0.6)',
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false,
                id: 'temp_move_line'
            });
            canvas.add(moveLine);

            // Highlight first point if close enough to close
            const firstDot = canvas.getObjects().find(o => o.id === 'draw_dot');
            if (pts.length > 2 && firstDot) {
                const dist = Math.sqrt(Math.pow(pointer.x - pts[0].x, 2) + Math.pow(pointer.y - pts[0].y, 2));
                firstDot.set({ fill: dist < 15 ? '#2ecc71' : '#3498db', radius: dist < 15 ? 8 : 5 });
            }

            canvas.renderAll();
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') finishDrawing();
            if (e.key === 'Escape') cancelDrawing();
        };

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:dblclick', finishDrawing);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:dblclick', finishDrawing);
            window.removeEventListener('keydown', handleKeyDown);
            canvas.defaultCursor = 'default';
            canvas.selection = true;
        };
    }, [canvas, isDrawingMode]);

    // Fetch Template for Edit Mode
    useEffect(() => {
        if (isEdit && canvas) {
            const fetchTemplate = async () => {
                try {
                    const { data } = await axios.get(`http://localhost:5000/api/templates/${id}`);
                    setName(data.name || '');
                    setCategory(data.category || '');
                    setPrice(data.basePrice || 0);
                    setBackgroundImageUrl(data.backgroundImageUrl || '');
                    setVariantNo(data.variantNo || '');
                    setProductSize(data.productSize || '');
                    setPrintSize(data.printSize || '');
                    setMoq(data.moq || 1);
                    setWrapType(data.wrapType || 'none');
                    setDemoImageUrl(data.demoImageUrl || '');

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

    // Generate Demo Image: product + shape with sample photo inside (so user dashboard shows product with photo in shape)
    const handleDemoImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !canvas) return;
        try {
            const placeholders = canvas.getObjects().filter(obj => obj.role === 'placeholder');
            if (placeholders.length === 0) {
                toast.error('Pehle canvas par koi Photo Area (shape) add karein, phir demo photo upload karein.');
                e.target.value = '';
                return;
            }
            toast.loading('Demo bana rahe hain – product + shape me photo...', { id: 'demo-gen' });
            const placeholder = placeholders[0];
            const blobUrl = URL.createObjectURL(file);
            const img = await fabric.FabricImage.fromURL(blobUrl, { crossOrigin: 'anonymous' });
            URL.revokeObjectURL(blobUrl);

            let clipMask;
            try {
                clipMask = await placeholder.clone();
                clipMask.set({
                    absolutePositioned: true,
                    left: placeholder.left,
                    top: placeholder.top,
                    scaleX: placeholder.scaleX,
                    scaleY: placeholder.scaleY,
                    angle: placeholder.angle || 0,
                    originX: placeholder.originX || 'center',
                    originY: placeholder.originY || 'center',
                    visible: false,
                    evented: false,
                    selectable: false
                });
            } catch (err) {
                console.warn('Clip clone failed', err);
            }

            const center = placeholder.getCenterPoint?.() || { x: canvas.width / 2, y: canvas.height / 2 };
            const pW = placeholder.getScaledWidth?.() || 200;
            const pH = placeholder.getScaledHeight?.() || 200;
            const baseW = img.width || pW;
            const baseH = img.height || pH;
            const scale = Math.max(pW / baseW, pH / baseH);
            img.set({
                left: center.x,
                top: center.y,
                originX: 'center',
                originY: 'center',
                angle: placeholder.angle || 0,
                clipPath: clipMask || undefined,
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                evented: false
            });

            placeholders.forEach(p => p.set('visible', false));
            canvas.add(img);
            canvas.renderAll();
            const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 0.5 });
            canvas.remove(img);
            placeholders.forEach(p => p.set('visible', true));
            canvas.renderAll();

            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const demoFile = new File([blob], 'demo.png', { type: 'image/png' });
            const formData = new FormData();
            formData.append('image', demoFile);
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const uploadRes = await axios.post(`${API_BASE}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setDemoImageUrl(uploadRes.data.url);
            toast.success('Demo ready! Ab niche "Save Template" / "Update Template" dabayein taaki user dashboard par ye dikhe.', { id: 'demo-gen', duration: 5000 });
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Demo generate nahi ho paya', { id: 'demo-gen' });
        }
        e.target.value = '';
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
            case 'mug-wrap':
                // Authentically curved Mug Smile Path
                const mugPathStr = createMugSmilePath(340, 200, 22);
                shape = new fabric.Path(mugPathStr, {
                    left: centerX,
                    top: centerY,
                    fill: 'rgba(135, 206, 250, 0.25)',
                    stroke: '#38bdf8',
                    strokeWidth: 2,
                    strokeDashArray: [12, 6],
                    shapeType: 'mug-wrap',
                    role: 'placeholder'
                });
                break;
            case 'wave':
                const pathStr = createWavePath(400, 150, 2, 40);
                shape = new fabric.Path(pathStr, {
                    left: centerX,
                    top: centerY,
                    fill: '#6c5ce7', // Nice purple
                    stroke: null,
                    opacity: 0.85,
                    shapeType: 'wave'
                });
                // Add a subtle gradient by default
                shape.set('fill', new fabric.Gradient({
                    type: 'linear',
                    coords: { x1: 0, y1: 0, x2: 400, y2: 0 },
                    colorStops: [
                        { offset: 0, color: '#a29bfe' },
                        { offset: 1, color: '#6c5ce7' }
                    ]
                }));
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

    // Add a full-width mug wrap placeholder (marks role=placeholder + shapeType=mug-wrap)
    const addMugWrapPlaceholder = () => {
        if (!canvas) return;
        const cW = canvas.width;
        const cH = canvas.height;

        // Custom Smile Path for placeholders
        const w = cW * 0.9;
        const h = cH * 0.6;
        const mugPathStr = createMugSmilePath(w, h, 25);

        const wrap = new fabric.Path(mugPathStr, {
            fill: 'rgba(135, 206, 250, 0.18)',
            stroke: '#38bdf8',
            strokeWidth: 3,
            strokeDashArray: [14, 7],
            originX: 'center',
            originY: 'center',
            left: cW / 2,
            top: cH / 2,
            transparentCorners: false,
            cornerColor: '#38bdf8',
            cornerStyle: 'circle',
            shapeType: 'mug-wrap',
            role: 'placeholder',
            id: 'mug_wrap_area_' + Date.now()
        });

        canvas.add(wrap);
        canvas.setActiveObject(wrap);
        setWrapType('mug');
        canvas.renderAll();
        toast.success('Professional Mug Smile Area added! Photo will curve perfectly.');
    };

    // Helper to create a wave path string
    // Width: 400, Height: 100, Waves: 2, Amplitude: 20
    const createWavePath = (w, h, waves = 2, amplitude = 25) => {
        let path = `M 0 ${h / 2} `;
        const waveWidth = w / waves;
        for (let i = 0; i < waves; i++) {
            const x = i * waveWidth;
            path += `Q ${x + waveWidth / 4} ${h / 2 - amplitude} ${x + waveWidth / 2} ${h / 2} `;
            path += `T ${x + waveWidth} ${h / 2} `;
        }
        path += `V ${h} H 0 Z`; // Close the bottom
        return path;
    };

    // Helper to add a faint mug outline to help admin position the wrap
    const addMugBodyHelper = () => {
        if (!canvas) return;
        const cW = canvas.width;
        const cH = canvas.height;
        const w = 360;
        const h = 220;
        const curve = 25;
        const left = (cW - w) / 2;
        const top = (cH - h) / 2;

        // Create a group for the mug outline
        const rim = new fabric.Ellipse({
            left: cW / 2, top: top + curve, rx: w / 2, ry: curve,
            fill: 'transparent', stroke: '#e5e7eb', strokeWidth: 2, originX: 'center', originY: 'center'
        });
        const body = new fabric.Path(`M ${left} ${top + curve} L ${left} ${top + h} Q ${cW / 2} ${top + h + curve * 1.5} ${left + w} ${top + h} L ${left + w} ${top + curve}`, {
            fill: '#f9fafb', stroke: '#e5e7eb', strokeWidth: 2, opacity: 0.5
        });
        const handle = new fabric.Path(`M ${left + w - 5} ${top + 40} Q ${left + w + 50} ${top + h / 2} ${left + w - 5} ${top + h - 40}`, {
            fill: 'transparent', stroke: '#e5e7eb', strokeWidth: 12, strokeCap: 'round', opacity: 0.5
        });

        const mugGroup = new fabric.Group([body, rim, handle], {
            left: cW / 2, top: cH / 2, originX: 'center', originY: 'center',
            selectable: true, id: 'mug_helper_body', role: 'helper'
        });

        canvas.add(mugGroup);
        canvas.sendToBack(mugGroup);
        canvas.renderAll();
        toast.info('Mug Outline added! Use it to position your photo area.');
    };

    // Helper to create the authentic "Mug Smile" curve path
    const createMugSmilePath = (w, h, curve = 25) => {
        // M top-left, Q control-point(center-lower), end(top-right)
        // L side-right-bottom, Q control-point(center-lower), end(bottom-left)
        return `M 0 ${curve} Q ${w / 2} ${curve * 2.5} ${w} ${curve} L ${w} ${h} Q ${w / 2} ${h + curve * 1.5} 0 ${h} Z`;
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

    // --- CUSTOM SHAPE DRAWING LOGIC ---
    const startCustomShape = () => {
        if (!canvas) return;
        setIsDrawingMode(true);
        setDrawPoints([]);
        canvas.discardActiveObject();
        canvas.renderAll();
        toast('Click to add corners. Press Enter or Double-Click to finish. Esc to cancel.', {
            icon: '✏️',
            duration: 5000
        });
    };

    const cancelDrawing = () => {
        const objectsToRemove = canvas.getObjects().filter(obj =>
            obj.id === 'draw_dot' || obj.id === 'draw_line' || obj.id === 'temp_move_line'
        );
        objectsToRemove.forEach(obj => canvas.remove(obj));
        setIsDrawingMode(false);
        setDrawPoints([]);
        canvas.renderAll();
    };

    const finishDrawing = () => {
        const pts = drawPointsRef.current;
        if (pts.length < 3) {
            cancelDrawing();
            return;
        }

        // Calculate bounding box to center points
        let minX = pts[0].x, minY = pts[0].y, maxX = pts[0].x, maxY = pts[0].y;
        pts.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });

        const centerX = minX + (maxX - minX) / 2;
        const centerY = minY + (maxY - minY) / 2;

        // Remove temp drawing objects first
        const objectsToRemove = canvas.getObjects().filter(obj =>
            obj.id === 'draw_dot' || obj.id === 'draw_line' || obj.id === 'temp_move_line'
        );
        objectsToRemove.forEach(obj => canvas.remove(obj));

        if (useSmoothCurve) {
            // Build smooth curve that PASSES THROUGH every selected point (control points computed so curve goes through pts)
            const n = pts.length;
            const rel = pts.map(p => ({ x: p.x - centerX, y: p.y - centerY }));
            let d = `M ${rel[0].x} ${rel[0].y}`;
            for (let i = 0; i < n; i++) {
                const prev = rel[(i - 1 + n) % n];
                const curr = rel[i];
                const next = rel[(i + 1) % n];
                // Control so curve from curr to next is smooth and passes through curr and next
                const ctrlX = curr.x + (next.x - prev.x) / 4;
                const ctrlY = curr.y + (next.y - prev.y) / 4;
                const endX = next.x;
                const endY = next.y;
                d += ` Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
            }
            d += ' Z';

            const path = new fabric.Path(d, {
                left: centerX,
                top: centerY,
                fill: 'rgba(255, 228, 225, 0.6)',
                stroke: '#333',
                strokeWidth: 2,
                originX: 'center',
                originY: 'center',
                shapeType: 'custom',
                transparentCorners: false,
                cornerColor: '#3498db',
                cornerStyle: 'circle',
                id: 'custom_shape_' + Date.now(),
                objectCaching: false
            });
            // Store points (relative to center) and curveControls for manual curve on any edge (top/bottom etc.)
            const relativePoints = pts.map(p => ({ x: p.x - centerX, y: p.y - centerY }));
            path.set('customPoints', relativePoints);
            path.customPoints = relativePoints;
            path.set('curveControls', new Array(pts.length).fill(null));
            path.curveControls = new Array(pts.length).fill(null);
            canvas.add(path);
            canvas.setActiveObject(path);
            toast.success('Rounded curve shape created! Mark as placeholder for photo.');
        } else {
            // Angled polygon
            const normalizedPoints = pts.map(p => ({
                x: p.x - centerX,
                y: p.y - centerY
            }));
            const polygon = new fabric.Polygon(normalizedPoints, {
                left: centerX,
                top: centerY,
                fill: 'rgba(255, 228, 225, 0.6)',
                stroke: '#333',
                strokeWidth: 2,
                shapeType: 'custom',
                originX: 'center',
                originY: 'center',
                transparentCorners: false,
                cornerColor: '#3498db',
                cornerStyle: 'circle',
                id: 'custom_shape_' + Date.now(),
                objectCaching: false
            });
            canvas.add(polygon);
            canvas.setActiveObject(polygon);
            toast.success('Shape bani – exactly aapke selected points par. Edit Points se kisi bhi point se stretch karein.');
        }

        setIsDrawingMode(false);
        setDrawPoints([]);
        drawPointsRef.current = [];
        canvas.renderAll();
    };

    // Simple parser for path d string (M, Q, L, Z) when fabric.util.parsePath not available
    const parsePathDSimple = (d) => {
        const parts = d.trim().replace(/\s+/g, ' ').split(/(?=[MQZL])/);
        const out = [];
        for (const p of parts) {
            const cmd = p.charAt(0);
            const nums = p.slice(1).trim().split(/\s+/).map(Number);
            if (cmd === 'M' && nums.length >= 2) out.push(['M', nums[0], nums[1]]);
            else if (cmd === 'Q' && nums.length >= 4) out.push(['Q', nums[0], nums[1], nums[2], nums[3]]);
            else if (cmd === 'L' && nums.length >= 2) out.push(['L', nums[0], nums[1]]);
            else if (cmd === 'Z') out.push(['Z']);
        }
        return out.length ? out : null;
    };

    // After updating path data, keep shape at same position (avoid jump when curving from top/other side). Call with oldCenter = path.getCenterPoint() *before* setting new path.
    const preservePathCenter = (pathObj, oldCenter) => {
        if (!pathObj || pathObj.type !== 'path' || !oldCenter) return;
        try {
            pathObj.setCoords();
            const newCenter = pathObj.getCenterPoint();
            if (!newCenter) return;
            const dx = oldCenter.x - newCenter.x, dy = oldCenter.y - newCenter.y;
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                pathObj.set({ left: pathObj.left + dx, top: pathObj.top + dy });
                pathObj.setCoords();
            }
        } catch (e) { console.warn('preservePathCenter', e); }
    };

    // Build path d string. curveControls[i] = manual curve for segment i→i+1; straightEdges = use L when no curve.
    const buildPathDFromPoints = (customPoints, curveControls, straightEdges) => {
        if (!customPoints || customPoints.length < 3) return null;
        const n = customPoints.length;
        let d = `M ${customPoints[0].x} ${customPoints[0].y}`;
        for (let i = 0; i < n; i++) {
            const prev = customPoints[(i - 1 + n) % n];
            const curr = customPoints[i];
            const next = customPoints[(i + 1) % n];
            const ctrl = curveControls && curveControls[i];
            if (ctrl) {
                d += ` Q ${ctrl.x} ${ctrl.y} ${next.x} ${next.y}`;
            } else if (straightEdges) {
                d += ` L ${next.x} ${next.y}`;
            } else {
                const ctrlX = curr.x + (next.x - prev.x) / 4;
                const ctrlY = curr.y + (next.y - prev.y) / 4;
                d += ` Q ${ctrlX} ${ctrlY} ${next.x} ${next.y}`;
            }
        }
        d += ' Z';
        return d;
    };

    // Get editable points from Path (customPoints or extract from path.path for old templates)
    const getPathEditablePoints = (pathObj) => {
        let pts = pathObj.get('customPoints') || pathObj.customPoints;
        if (pts && pts.length >= 3) return pts;
        const pathData = pathObj.path;
        if (!pathData || !Array.isArray(pathData)) return null;
        pts = [];
        for (let i = 0; i < pathData.length; i++) {
            const cmd = pathData[i];
            if (cmd[0] === 'M' && cmd.length >= 3) pts.push({ x: cmd[1], y: cmd[2] });
            else if ((cmd[0] === 'Q' || cmd[0] === 'q') && cmd.length >= 5) pts.push({ x: cmd[3], y: cmd[4] });
            else if ((cmd[0] === 'L' || cmd[0] === 'l') && cmd.length >= 3) pts.push({ x: cmd[1], y: cmd[2] });
        }
        if (pts.length >= 3) {
            pathObj.set('customPoints', pts);
            pathObj.customPoints = pts;
            return pts;
        }
        return null;
    };

    // Create draggable point handles for polygon or path (corners + mid-edge for polygon so "upper middle" etc. stretch)
    const createPointHandles = (obj) => {
        const handles = canvas.getObjects().filter(o => o.id === 'point_handle' || o.id === 'mid_point_handle');
        handles.forEach(h => canvas.remove(h));
        if (obj.type === 'polygon') {
            const points = obj.get('points');
            const transform = obj.calcTransformMatrix();
            // Corner handles (red)
            points.forEach((p, index) => {
                const canvasPt = fabric.util.transformPoint(p, transform);
                const dot = new fabric.Circle({
                    left: canvasPt.x, top: canvasPt.y, radius: 8,
                    fill: '#ff4757', stroke: 'white', strokeWidth: 2,
                    originX: 'center', originY: 'center',
                    hasBorders: false, hasControls: false,
                    id: 'point_handle', pointIndex: index, shapeRef: obj, shapeType: 'polygon',
                    hoverCursor: 'move', selectable: true, evented: true
                });
                dot.on('moving', (options) => {
                    const d = options.target;
                    const invMatrix = fabric.util.invertTransform(obj.calcTransformMatrix());
                    const localPt = fabric.util.transformPoint(new fabric.Point(d.left, d.top), invMatrix);
                    const newPoints = [...obj.points];
                    newPoints[index] = { x: localPt.x, y: localPt.y };
                    obj.set({ points: newPoints });
                    canvas.requestRenderAll();
                });
                canvas.add(dot);
            });
            // Mid-edge handles (light blue) – drag = manual CURVE on that edge (convert to Path with curved segment)
            const n = points.length;
            for (let i = 0; i < n; i++) {
                const a = points[i];
                const b = points[(i + 1) % n];
                const midLocal = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
                const canvasMid = fabric.util.transformPoint(midLocal, transform);
                const midDot = new fabric.Circle({
                    left: canvasMid.x, top: canvasMid.y, radius: 7,
                    fill: '#3498db', stroke: 'white', strokeWidth: 2,
                    originX: 'center', originY: 'center',
                    hasBorders: false, hasControls: false,
                    id: 'mid_point_handle', segmentIndex: i, shapeRef: obj, shapeType: 'polygon',
                    hoverCursor: 'move', selectable: true, evented: true
                });
                midDot.on('mouse:up', (options) => {
                    const target = options.target;
                    if (!canvas.getObjects().includes(obj)) return;
                    const invMatrix = fabric.util.invertTransform(obj.calcTransformMatrix());
                    const localPt = fabric.util.transformPoint(new fabric.Point(target.left, target.top), invMatrix);
                    const polyPoints = obj.get('points').map(p => ({ x: p.x, y: p.y }));
                    const curveCtrls = new Array(n).fill(null);
                    curveCtrls[i] = { x: localPt.x, y: localPt.y };
                    const d = buildPathDFromPoints(polyPoints, curveCtrls, true);
                    if (!d) return;
                    try {
                        const oldHandles = canvas.getObjects().filter(o => o.id === 'point_handle' || o.id === 'mid_point_handle');
                        oldHandles.forEach(h => canvas.remove(h));
                        const path = new fabric.Path(d, {
                            left: obj.left,
                            top: obj.top,
                            originX: 'center',
                            originY: 'center',
                            fill: obj.fill || 'rgba(255, 228, 225, 0.6)',
                            stroke: obj.stroke || '#333',
                            strokeWidth: obj.strokeWidth || 2,
                            shapeType: obj.shapeType || 'custom',
                            role: obj.role,
                            id: obj.id || 'path_from_poly_' + Date.now(),
                            angle: obj.angle || 0,
                            objectCaching: false
                        });
                        path.set('customPoints', polyPoints);
                        path.customPoints = polyPoints;
                        path.set('curveControls', curveCtrls);
                        path.curveControls = curveCtrls;
                        path.set('straightEdges', true);
                        path.straightEdges = true;
                        path.dirty = true;
                        canvas.remove(obj);
                        canvas.add(path);
                        path.setCoords();
                        setSelectedObject(path);
                        editingShapeRef.current = path;
                        createPointHandles(path);
                        canvas.requestRenderAll();
                        toast.success('Curve bana di! Ab kisi bhi point ko drag karke curve badal sakte hain.');
                    } catch (e) {
                        console.warn('Polygon to Path', e);
                    }
                });
                canvas.add(midDot);
            }
        } else if (obj.type === 'path') {
            const pts = obj.get('customPoints') || obj.customPoints || getPathEditablePoints(obj);
            if (!pts || pts.length < 3) return;
            const transform = obj.calcTransformMatrix();
            pts.forEach((p, index) => {
                const canvasPt = fabric.util.transformPoint(new fabric.Point(p.x, p.y), transform);
                const dot = new fabric.Circle({
                    left: canvasPt.x, top: canvasPt.y, radius: 8,
                    fill: '#ff4757', stroke: 'white', strokeWidth: 2,
                    originX: 'center', originY: 'center',
                    hasBorders: false, hasControls: false,
                    id: 'point_handle', pointIndex: index, shapeRef: obj, shapeType: 'path',
                    hoverCursor: 'move', selectable: true, evented: true
                });
                dot.on('moving', (options) => {
                    const target = options.target;
                    const invMatrix = fabric.util.invertTransform(obj.calcTransformMatrix());
                    const localPt = fabric.util.transformPoint(new fabric.Point(target.left, target.top), invMatrix);
                    const newPoints = [...(obj.get('customPoints') || obj.customPoints || pts)];
                    newPoints[index] = { x: localPt.x, y: localPt.y };
                    obj.set('customPoints', newPoints);
                    obj.customPoints = newPoints;
                    const curveCtrls = obj.get('curveControls') || obj.curveControls;
                    const straight = obj.get('straightEdges') || false;
                    const d = buildPathDFromPoints(newPoints, curveCtrls, straight);
                    if (d) {
                        try {
                            const oldCenter = obj.getCenterPoint();
                            const parsed = typeof fabric.util.parsePath === 'function' ? fabric.util.parsePath(d) : parsePathDSimple(d);
                            if (parsed) {
                                obj.set('path', parsed);
                                if (obj.path !== undefined) obj.path = parsed;
                                obj.dirty = true;
                            }
                            obj.setCoords();
                            preservePathCenter(obj, oldCenter);
                        } catch (e) { console.warn('Path update', e); }
                    }
                    canvas.requestRenderAll();
                });
                canvas.add(dot);
            });
            // Mid-edge handles for path (light blue) – drag = manual CURVE on that edge (no new point, smooth curve)
            const curveCtrls = obj.get('curveControls') || obj.curveControls;
            if (!curveCtrls || curveCtrls.length !== pts.length) {
                const arr = new Array(pts.length).fill(null);
                obj.set('curveControls', arr);
                obj.curveControls = arr;
            }
            const ctrls = obj.get('curveControls') || obj.curveControls;
            for (let i = 0; i < pts.length; i++) {
                const a = pts[i];
                const b = pts[(i + 1) % pts.length];
                const midLocal = ctrls[i] ? ctrls[i] : { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
                const canvasMid = fabric.util.transformPoint(new fabric.Point(midLocal.x, midLocal.y), transform);
                const midDot = new fabric.Circle({
                    left: canvasMid.x, top: canvasMid.y, radius: 7,
                    fill: '#3498db', stroke: 'white', strokeWidth: 2,
                    originX: 'center', originY: 'center',
                    hasBorders: false, hasControls: false,
                    id: 'mid_point_handle', segmentIndex: i, shapeRef: obj, shapeType: 'path',
                    hoverCursor: 'move', selectable: true, evented: true
                });
                midDot.on('moving', (options) => {
                    const target = options.target;
                    const invMatrix = fabric.util.invertTransform(obj.calcTransformMatrix());
                    const localPt = fabric.util.transformPoint(new fabric.Point(target.left, target.top), invMatrix);
                    const curveControlsCopy = [...(obj.get('curveControls') || obj.curveControls || ctrls)];
                    curveControlsCopy[i] = { x: localPt.x, y: localPt.y };
                    obj.set('curveControls', curveControlsCopy);
                    obj.curveControls = curveControlsCopy;
                    const currentPts = obj.get('customPoints') || obj.customPoints || pts;
                    const straight = obj.get('straightEdges') || false;
                    const d = buildPathDFromPoints(currentPts, curveControlsCopy, straight);
                    if (d) {
                        try {
                            const oldCenter = obj.getCenterPoint();
                            const parsed = typeof fabric.util.parsePath === 'function' ? fabric.util.parsePath(d) : parsePathDSimple(d);
                            if (parsed) {
                                obj.set('path', parsed);
                                if (obj.path !== undefined) obj.path = parsed;
                                obj.dirty = true;
                            }
                            obj.setCoords();
                            preservePathCenter(obj, oldCenter);
                        } catch (e) { console.warn('Path update', e); }
                        canvas.requestRenderAll();
                    }
                });
                midDot.on('mouse:up', () => {
                    createPointHandles(obj);
                    canvas.requestRenderAll();
                });
                canvas.add(midDot);
            }
        }
        canvas.requestRenderAll();
    };

    // Convert Fabric Rect to Polygon (4 points) so we can edit points / stretch from any edge
    const rectToPolygon = (rect) => {
        const w = (rect.width * (rect.scaleX || 1)) / 2;
        const h = (rect.height * (rect.scaleY || 1)) / 2;
        const points = [
            { x: -w, y: -h },
            { x: w, y: -h },
            { x: w, y: h },
            { x: -w, y: h }
        ];
        const poly = new fabric.Polygon(points, {
            left: rect.left,
            top: rect.top,
            originX: 'center',
            originY: 'center',
            fill: rect.fill || 'rgba(255, 228, 225, 0.6)',
            stroke: rect.stroke || '#333',
            strokeWidth: rect.strokeWidth || 2,
            shapeType: rect.shapeType || 'rect',
            role: rect.role,
            id: rect.id || 'poly_from_rect_' + Date.now()
        });
        if (rect.angle) poly.set('angle', rect.angle);
        return poly;
    };

    // Edit shape points: Polygon, Path, or Rect (Rect is converted to Polygon so every point can stretch).
    const editShapePoints = () => {
        let obj = selectedObject;
        if (!obj) return;
        if (obj.type === 'rect') {
            const poly = rectToPolygon(obj);
            canvas.remove(obj);
            canvas.add(poly);
            poly.setCoords();
            canvas.setActiveObject(poly);
            setSelectedObject(poly);
            obj = poly;
        }
        if (obj.type !== 'polygon' && obj.type !== 'path') return;

        setIsEditingPoints(!isEditingPoints);

        if (!isEditingPoints) {
            obj.set({ selectable: false, evented: true, opacity: 0.6 }); // evented: true so line pe click/drag se curve ban sake
            editingShapeRef.current = obj;
            canvas.discardActiveObject();
            if (obj.type === 'path') {
                const pts = getPathEditablePoints(obj);
                if (!pts || pts.length < 3) {
                    toast.error('Is path me edit ke liye points nahi mile. Naya free-draw shape bana kar try karein.');
                    obj.set({ selectable: true, evented: true, opacity: 1 });
                    setIsEditingPoints(false);
                    return;
                }
            }
            createPointHandles(obj);
            toast('Line ko bhi drag karein: kisi line pe click karke upar/neeche/left/right kheenchien – curve ban jayega (screenshot jaisa). Red/blue point bhi drag kar sakte hain.', { icon: '🎯', duration: 6000 });
        } else {
            const handles = canvas.getObjects().filter(o => o.id === 'point_handle' || o.id === 'mid_point_handle');
            handles.forEach(h => canvas.remove(h));
            if (segmentOverlayRef.current && canvas.getObjects().includes(segmentOverlayRef.current)) {
                canvas.remove(segmentOverlayRef.current);
            }
            segmentOverlayRef.current = null;
            hoveredSegmentRef.current = -1;
            canvas.defaultCursor = 'default';
            obj.set({ selectable: true, evented: true, opacity: 1 });
            obj.setCoords();
            editingShapeRef.current = null;
            canvas.requestRenderAll();
        }
    };

    // Double-click on a line segment to add a new point (stretch from middle)
    const addPointOnSegment = (pointer) => {
        const obj = editingShapeRef.current;
        if (!obj || !canvas) return;
        const threshold = 20;

        if (obj.type === 'polygon') {
            const points = obj.get('points');
            const transform = obj.calcTransformMatrix();
            const canvasPts = points.map(p => fabric.util.transformPoint(p, transform));
            let bestDist = threshold;
            let insertIndex = -1;
            let newLocal = null;
            for (let i = 0; i < canvasPts.length; i++) {
                const a = canvasPts[i];
                const b = canvasPts[(i + 1) % canvasPts.length];
                const d = distToSegment(pointer.x, pointer.y, a.x, a.y, b.x, b.y);
                if (d < bestDist) {
                    bestDist = d;
                    insertIndex = i + 1;
                    const t = Math.max(0, Math.min(1, ((pointer.x - a.x) * (b.x - a.x) + (pointer.y - a.y) * (b.y - a.y)) / ((b.x - a.x) ** 2 + (b.y - a.y) ** 2)));
                    const midX = a.x + t * (b.x - a.x);
                    const midY = a.y + t * (b.y - a.y);
                    const invMatrix = fabric.util.invertTransform(obj.calcTransformMatrix());
                    newLocal = fabric.util.transformPoint(new fabric.Point(midX, midY), invMatrix);
                }
            }
            if (insertIndex >= 0 && newLocal) {
                const newPoints = [...obj.points];
                newPoints.splice(insertIndex, 0, { x: newLocal.x, y: newLocal.y });
                obj.set({ points: newPoints });
                createPointHandles(obj);
                toast('Naya point add ho gaya. Ab ise stretch kar sakte hain.');
            }
        } else if (obj.type === 'path') {
            const pts = obj.get('customPoints') || obj.customPoints;
            if (!pts || pts.length < 3) return;
            const transform = obj.calcTransformMatrix();
            const canvasPts = pts.map(p => fabric.util.transformPoint(new fabric.Point(p.x, p.y), transform));
            let bestDist = threshold;
            let insertIndex = -1;
            let newLocal = null;
            for (let i = 0; i < canvasPts.length; i++) {
                const a = canvasPts[i];
                const b = canvasPts[(i + 1) % canvasPts.length];
                const d = distToSegment(pointer.x, pointer.y, a.x, a.y, b.x, b.y);
                if (d < bestDist) {
                    bestDist = d;
                    insertIndex = i + 1;
                    const t = Math.max(0, Math.min(1, ((pointer.x - a.x) * (b.x - a.x) + (pointer.y - a.y) * (b.y - a.y)) / ((b.x - a.x) ** 2 + (b.y - a.y) ** 2)));
                    const midX = a.x + t * (b.x - a.x);
                    const midY = a.y + t * (b.y - a.y);
                    const invMatrix = fabric.util.invertTransform(obj.calcTransformMatrix());
                    newLocal = fabric.util.transformPoint(new fabric.Point(midX, midY), invMatrix);
                }
            }
            if (insertIndex >= 0 && newLocal) {
                const newPoints = [...pts];
                newPoints.splice(insertIndex, 0, { x: newLocal.x, y: newLocal.y });
                obj.set('customPoints', newPoints);
                obj.customPoints = newPoints;
                const d = buildPathDFromPoints(newPoints);
                if (d) {
                    try {
                        const parsed = typeof fabric.util.parsePath === 'function' ? fabric.util.parsePath(d) : parsePathDSimple(d);
                        if (parsed) obj.set('path', parsed);
                        obj.setCoords();
                    } catch (e) { console.warn(e); }
                }
                createPointHandles(obj);
                toast('Naya point add ho gaya. Ab ise stretch kar sakte hain.');
            }
        }
    };

    function distToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy) || 1e-6;
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (len * len)));
        const projX = x1 + t * dx, projY = y1 + t * dy;
        return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
    }
    addPointOnSegmentRef.current = addPointOnSegment;

    // When editing points, double-click on a line segment to add a new point (stretch from middle)
    useEffect(() => {
        if (!canvas || !isEditingPoints) return;
        const handleDblclick = (opt) => {
            if (opt.target && (opt.target.id === 'point_handle' || opt.target.id === 'mid_point_handle')) return;
            const pointer = canvas.getPointer(opt.e);
            addPointOnSegmentRef.current(pointer);
        };
        canvas.on('mouse:dblclick', handleDblclick);
        return () => { canvas.off('mouse:dblclick', handleDblclick); };
    }, [canvas, isEditingPoints]);

    // Drag line to curve (screenshot behaviour): line pe click karke upar/neeche/left/right kheenchien to curve ban jaye
    useEffect(() => {
        if (!canvas || !isEditingPoints) return;
        const getCanvasPoints = (shape) => {
            const transform = shape.calcTransformMatrix();
            if (shape.type === 'path') {
                const pts = shape.get('customPoints') || shape.customPoints || getPathEditablePoints(shape);
                return (pts || []).map(p => fabric.util.transformPoint(new fabric.Point(p.x, p.y), transform));
            }
            if (shape.type === 'polygon') {
                return (shape.get('points') || []).map(p => fabric.util.transformPoint(p, transform));
            }
            return [];
        };
        const findSegmentAt = (shape, pointer) => {
            const pts = getCanvasPoints(shape);
            if (pts.length < 2) return -1;
            let best = 25, idx = -1;
            for (let i = 0; i < pts.length; i++) {
                const a = pts[i];
                const b = pts[(i + 1) % pts.length];
                const d = distToSegment(pointer.x, pointer.y, a.x, a.y, b.x, b.y);
                if (d < best) { best = d; idx = i; }
            }
            return idx;
        };
        const removeSegmentOverlay = () => {
            if (segmentOverlayRef.current && canvas.getObjects().includes(segmentOverlayRef.current)) {
                canvas.remove(segmentOverlayRef.current);
            }
            segmentOverlayRef.current = null;
        };
        const drawSegmentOverlay = (shape, segIndex, color, isCurve = false, controlPt = null) => {
            removeSegmentOverlay();
            const pts = getCanvasPoints(shape);
            if (segIndex < 0 || segIndex >= pts.length) return;
            const a = pts[segIndex];
            const b = pts[(segIndex + 1) % pts.length];
            let obj;
            if (isCurve && controlPt) {
                const transform = shape.calcTransformMatrix();
                const c = fabric.util.transformPoint(new fabric.Point(controlPt.x, controlPt.y), transform);
                const d = `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`;
                obj = new fabric.Path(d, { stroke: color, strokeWidth: 5, fill: 'transparent', selectable: false, evented: false, id: 'segment_highlight' });
            } else {
                obj = new fabric.Line([a.x, a.y, b.x, b.y], { stroke: color, strokeWidth: 5, selectable: false, evented: false, id: 'segment_highlight' });
            }
            canvas.add(obj);
            segmentOverlayRef.current = obj;
        };
        const handleMouseDown = (opt) => {
            if (bendingSegmentRef.current !== null) return;
            if (opt.target && (opt.target.id === 'point_handle' || opt.target.id === 'mid_point_handle')) return;
            const shape = editingShapeRef.current;
            if (!shape || opt.target !== shape) return;
            const pointer = canvas.getPointer(opt.e);
            const seg = findSegmentAt(shape, pointer);
            if (seg < 0) return;
            const invMatrix = fabric.util.invertTransform(shape.calcTransformMatrix());
            const localPt = fabric.util.transformPoint(new fabric.Point(pointer.x, pointer.y), invMatrix);
            if (shape.type === 'polygon') {
                const polyPoints = shape.get('points').map(p => ({ x: p.x, y: p.y }));
                const curveCtrls = new Array(polyPoints.length).fill(null);
                curveCtrls[seg] = { x: localPt.x, y: localPt.y };
                const d = buildPathDFromPoints(polyPoints, curveCtrls, true);
                if (!d) return;
                try {
                    const oldHandles = canvas.getObjects().filter(o => o.id === 'point_handle' || o.id === 'mid_point_handle');
                    oldHandles.forEach(h => canvas.remove(h));
                    const path = new fabric.Path(d, {
                        left: shape.left, top: shape.top, originX: 'center', originY: 'center',
                        fill: shape.fill || 'rgba(255, 228, 225, 0.6)', stroke: shape.stroke || '#333', strokeWidth: shape.strokeWidth || 2,
                        shapeType: shape.shapeType || 'custom', role: shape.role, id: shape.id || 'path_from_poly_' + Date.now(), angle: shape.angle || 0, objectCaching: false
                    });
                    path.set('customPoints', polyPoints);
                    path.customPoints = polyPoints;
                    path.set('curveControls', curveCtrls);
                    path.curveControls = curveCtrls;
                    path.set('straightEdges', true);
                    path.straightEdges = true;
                    path.dirty = true;
                    canvas.remove(shape);
                    canvas.add(path);
                    path.setCoords();
                    setSelectedObject(path);
                    editingShapeRef.current = path;
                    bendingSegmentRef.current = seg;
                    canvas.defaultCursor = 'ns-resize'; // stretch icon jab line move ho
                    createPointHandles(path);
                    canvas.requestRenderAll();
                } catch (e) { console.warn('Polygon to path on line drag', e); return; }
            } else {
                let ctrls = shape.get('curveControls') || shape.curveControls;
                if (!ctrls || ctrls.length !== (shape.get('customPoints') || shape.customPoints || []).length) {
                    ctrls = new Array((shape.get('customPoints') || shape.customPoints || []).length).fill(null);
                    shape.set('curveControls', ctrls);
                    shape.curveControls = ctrls;
                }
                const curveControlsCopy = [...ctrls];
                curveControlsCopy[seg] = { x: localPt.x, y: localPt.y };
                shape.set('curveControls', curveControlsCopy);
                shape.curveControls = curveControlsCopy;
                const pts = shape.get('customPoints') || shape.customPoints || [];
                const straight = shape.get('straightEdges') || false;
                const d = buildPathDFromPoints(pts, curveControlsCopy, straight);
                if (d) {
                    try {
                        const oldCenter = shape.getCenterPoint();
                        const parsed = typeof fabric.util.parsePath === 'function' ? fabric.util.parsePath(d) : parsePathDSimple(d);
                        if (parsed) { shape.set('path', parsed); if (shape.path !== undefined) shape.path = parsed; shape.dirty = true; }
                        shape.setCoords();
                        preservePathCenter(shape, oldCenter);
                    } catch (e) { console.warn('Path update', e); }
                }
                bendingSegmentRef.current = seg;
                canvas.defaultCursor = 'ns-resize'; // stretch icon jab line move ho
                canvas.requestRenderAll();
            }
        };
        const handleMouseMove = (opt) => {
            const shape = editingShapeRef.current;
            const pointer = canvas.getPointer(opt.e);

            if (bendingSegmentRef.current !== null) {
                if (!shape || shape.type !== 'path') return;
                canvas.defaultCursor = 'ns-resize';
                const invMatrix = fabric.util.invertTransform(shape.calcTransformMatrix());
                const localPt = fabric.util.transformPoint(new fabric.Point(pointer.x, pointer.y), invMatrix);
                const seg = bendingSegmentRef.current;
                const curveControlsCopy = [...(shape.get('curveControls') || shape.curveControls || [])];
                curveControlsCopy[seg] = { x: localPt.x, y: localPt.y };
                shape.set('curveControls', curveControlsCopy);
                shape.curveControls = curveControlsCopy;
                const pts = shape.get('customPoints') || shape.customPoints || [];
                const straight = shape.get('straightEdges') || false;
                const d = buildPathDFromPoints(pts, curveControlsCopy, straight);
                if (d) {
                    try {
                        const oldCenter = shape.getCenterPoint();
                        const parsed = typeof fabric.util.parsePath === 'function' ? fabric.util.parsePath(d) : parsePathDSimple(d);
                        if (parsed) { shape.set('path', parsed); if (shape.path !== undefined) shape.path = parsed; shape.dirty = true; }
                        shape.setCoords();
                        preservePathCenter(shape, oldCenter);
                    } catch (e) { console.warn('Path update', e); }
                }
                drawSegmentOverlay(shape, seg, 'rgba(255, 152, 0, 0.95)', true, curveControlsCopy[seg]);
                canvas.requestRenderAll();
                return;
            }

            if (!shape) {
                removeSegmentOverlay();
                hoveredSegmentRef.current = -1;
                canvas.defaultCursor = 'default';
                canvas.requestRenderAll();
                return;
            }
            const seg = findSegmentAt(shape, pointer);
            if (seg >= 0) {
                if (seg !== hoveredSegmentRef.current) {
                    drawSegmentOverlay(shape, seg, 'rgba(33, 150, 243, 0.95)', false);
                    hoveredSegmentRef.current = seg;
                }
                canvas.defaultCursor = 'ns-resize';
            } else {
                if (hoveredSegmentRef.current >= 0) {
                    removeSegmentOverlay();
                    hoveredSegmentRef.current = -1;
                }
                canvas.defaultCursor = 'default';
            }
            canvas.requestRenderAll();
        };
        const handleMouseUp = () => {
            if (bendingSegmentRef.current !== null) {
                bendingSegmentRef.current = null;
                const shape = editingShapeRef.current;
                if (shape && shape.type === 'path') createPointHandles(shape);
                removeSegmentOverlay();
                hoveredSegmentRef.current = -1;
                canvas.defaultCursor = 'default';
                canvas.requestRenderAll();
            }
        };
        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);
        return () => {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:up', handleMouseUp);
        };
    }, [canvas, isEditingPoints]);

    // --- END CUSTOM SHAPE LOGIC ---

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

            // Save template data (category = selected dropdown value so template shows under correct category)
            // CRITICAL: Before toJSON, force-set shapeType on all placeholders so it serializes correctly.
            // Fabric.js only serializes custom props if they appear in the custom prop list AND are set via .set()
            const allPlaceholders = canvas.getObjects().filter(o => o.role === 'placeholder');
            allPlaceholders.forEach(ph => {
                // Auto-detect shapeType if missing
                if (!ph.shapeType) {
                    let autoType = 'rect';
                    if (ph.type === 'circle') autoType = 'circle';
                    else if (ph.type === 'triangle') autoType = 'triangle';
                    else if (ph.type === 'polygon') {
                        autoType = (ph.points && ph.points.length === 10) ? 'star' : 'polygon';
                    }
                    else if (ph.type === 'path') autoType = 'heart';
                    else if (ph.type === 'rect') autoType = ph.rx ? 'rounded' : 'rect';
                    ph.set('shapeType', autoType);
                    ph.shapeType = autoType;
                }
                // Ensure ID is set
                if (!ph.id) {
                    const newId = 'placeholder_' + Date.now() + '_' + Math.random().toString(36).slice(2);
                    ph.set('id', newId);
                    ph.id = newId;
                }
            });

            const templateData = {
                name,
                category: category || (categories[0]?.name ?? ''),
                basePrice: price,
                previewImage: previewImageUrl,
                demoImageUrl: demoImageUrl || undefined,
                backgroundImageUrl: finalBgUrl,
                printArea: printArea,
                variantNo: variantNo,
                productSize: productSize,
                printSize: printSize,
                moq: moq,
                wrapType: wrapType || 'none',
                canvasSettings: canvas.toJSON(['role', 'locked', 'shapeType', 'id', 'selectable', 'hoverCursor', 'customPoints', 'curveControls', 'straightEdges'])
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
                                    <option value="">{category ? category : 'Loading...'}</option>
                                )}
                            </select>
                            <input
                                type="number"
                                className="w-full border p-2 rounded text-sm"
                                placeholder="Price ($)"
                                value={price}
                                onChange={e => setPrice(Number(e.target.value))}
                            />
                            <div className="mt-3 pt-3 border-t border-amber-200 bg-amber-50/80 rounded-lg p-3 border">
                                <h4 className="font-bold text-sm text-amber-800 mb-1">📷 Demo Photo (Recommended)</h4>
                                <p className="text-xs text-amber-700 mb-2">
                                    <strong>Sirf woh photo</strong> upload karein jo shape ke andar aani hai (e.g. bacche ki photo). App aapke product + shape ke saath is photo ko jod kar <strong>demo image khud bana dega</strong> – user dashboard par product + shape ke andar yahi photo dikhegi.
                                </p>
                                <button
                                    type="button"
                                    className="w-full bg-amber-500 text-white p-2 rounded hover:bg-amber-600 text-xs font-medium"
                                    onClick={() => demoImageInputRef.current?.click()}
                                >
                                    📷 Sample photo upload karein (demo auto banega)
                                </button>
                                <input type="file" ref={demoImageInputRef} hidden accept="image/*" onChange={handleDemoImageUpload} />
                                {demoImageUrl && (
                                    <div className="mt-2 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <img src={demoImageUrl} alt="Demo" className="h-14 w-14 object-cover rounded border border-amber-200" />
                                            <span className="text-xs text-green-700 font-medium">✓ Demo set – product + shape me photo</span>
                                            <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => setDemoImageUrl('')}>Remove</button>
                                        </div>
                                        <p className="text-[10px] text-amber-700">User dashboard par dikhane ke liye niche <strong>Save / Update Template</strong> zaroor dabayein.</p>
                                    </div>
                                )}
                            </div>
                        </div>

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
                            <button
                                className={`flex-1 py-2 text-xs font-medium ${activeTab === 'mug' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                                onClick={() => setActiveTab('mug')}
                            >
                                ☕ Mug/Wrap
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
                                    <button
                                        className="p-3 border bg-sky-50 border-sky-300 hover:bg-sky-100 rounded text-sm font-bold text-sky-700"
                                        onClick={() => addShape('mug-wrap')}
                                    >
                                        ☕ Mug Shape
                                    </button>
                                    <button
                                        className="p-3 border bg-purple-50 border-purple-300 hover:bg-purple-100 rounded text-sm font-bold text-purple-700"
                                        onClick={() => addShape('wave')}
                                    >
                                        🌊 Wave
                                    </button>
                                    <button className="p-3 border bg-blue-50 border-blue-200 rounded hover:bg-blue-100 text-sm font-bold text-blue-700 col-span-2" onClick={startCustomShape}>
                                        ✏️ Free Draw (point by point)
                                    </button>
                                    <label className="col-span-2 flex items-center gap-2 p-2 bg-gray-50 rounded border cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={useSmoothCurve}
                                            onChange={(e) => setUseSmoothCurve(e.target.checked)}
                                        />
                                        <span className="text-xs font-medium">Smooth curve (uncheck = shape exactly on selected points, straight edges)</span>
                                    </label>
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

                            {activeTab === 'mug' && (
                                <div className="space-y-4">
                                    <div className="bg-sky-50 p-4 rounded-xl border-2 border-sky-200">
                                        <h3 className="text-sm font-bold text-sky-800 mb-2">☕ Mug Wrap Tools</h3>
                                        <button
                                            className="w-full bg-sky-600 text-white p-3 rounded-lg hover:bg-sky-700 text-sm font-bold shadow-md mb-3"
                                            onClick={addMugWrapPlaceholder}
                                        >
                                            ✨ Create Automatic Mug Area
                                        </button>
                                        <p className="text-[10px] text-sky-600 leading-tight">
                                            This creates a special curved area that matches a mug surface.
                                        </p>
                                    </div>

                                    <button
                                        className="w-full py-2 px-3 border-2 border-dashed border-sky-300 rounded text-xs text-sky-700 hover:bg-sky-50 font-bold mb-4"
                                        onClick={addMugBodyHelper}
                                    >
                                        ➕ Add Mug Outline Helper
                                    </button>

                                    <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-200">
                                        <label className="text-[10px] font-black uppercase text-amber-700 block mb-2">Live Preview Settings</label>
                                        <select
                                            className="w-full border-2 border-amber-300 p-2 rounded text-sm font-bold text-amber-900 bg-white"
                                            value={wrapType}
                                            onChange={e => setWrapType(e.target.value)}
                                        >
                                            <option value="none">None (Flat Preview)</option>
                                            <option value="mug">☕ Realistic Mug (3D)</option>
                                            <option value="bottle">🫙 Bottle/Sipper (3D)</option>
                                        </select>
                                        <p className="text-[10px] text-amber-600 mt-2">
                                            <b>Note:</b> Choose "Realistic Mug" to show the 3D 'Smile' curve to users.
                                        </p>
                                    </div>

                                    <button
                                        className="w-full py-2 px-3 border-2 border-dashed border-gray-300 rounded text-xs text-gray-500 hover:bg-gray-50"
                                        onClick={() => addShape('mug-wrap')}
                                    >
                                        + Add Manual Curved Shape
                                    </button>
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
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500 uppercase">Color / Fill</label>
                                            <input
                                                type="color"
                                                className="w-full h-8 rounded border p-0.5 cursor-pointer shadow-sm"
                                                value={objProps.fill && typeof objProps.fill === 'string' ? objProps.fill : '#000000'}
                                                onChange={(e) => updateProperty('fill', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500 uppercase">Opacity ({Math.round((objProps.opacity || 1) * 100)}%)</label>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="1"
                                                step="0.05"
                                                className="w-full"
                                                value={objProps.opacity || 1}
                                                onChange={(e) => updateProperty('opacity', parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Text Styles Section - Only for text objects */}
                                {(selectedObject.type === 'i-text' || selectedObject.type === 'text') && (
                                    <div className="mt-4 border-t pt-4">
                                        <h3 className="font-bold text-sm text-gray-700 mb-2">Text Styles</h3>
                                        <div className="space-y-3">
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

                                <div className="mt-4 border-t pt-4">
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
                                                    // Auto-detect shapeType from Fabric object type if not already set
                                                    if (!selectedObject.shapeType) {
                                                        let autoType = 'rect';
                                                        if (selectedObject.type === 'circle') autoType = 'circle';
                                                        else if (selectedObject.type === 'triangle') autoType = 'triangle';
                                                        else if (selectedObject.type === 'polygon') {
                                                            // Detect star by point count (5-pointed star = 10 points)
                                                            autoType = (selectedObject.points && selectedObject.points.length === 10) ? 'star' : 'polygon';
                                                        }
                                                        else if (selectedObject.type === 'path') autoType = 'heart'; // paths are typically heart/custom
                                                        else if (selectedObject.type === 'rect') autoType = selectedObject.rx ? 'rounded' : 'rect';
                                                        // Set shapeType on both Fabric internal state AND the instance directly
                                                        selectedObject.set('shapeType', autoType);
                                                        selectedObject.shapeType = autoType;
                                                    }
                                                    // Ensure ID is set for this placeholder
                                                    if (!selectedObject.id || selectedObject.id === '') {
                                                        const newId = 'placeholder_' + Date.now();
                                                        selectedObject.set('id', newId);
                                                        selectedObject.id = newId;
                                                    }
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

                                    {selectedObject.type === 'polygon' && (
                                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mb-3 space-y-2">
                                            <h3 className="font-bold text-[10px] text-orange-800 uppercase">Polygon Settings</h3>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-gray-500 flex justify-between">
                                                    <span>Corner Rounding</span>
                                                    <span>{selectedObject.cornerRadius || 0}px</span>
                                                </label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="50"
                                                    className="w-full h-1.5 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                                                    value={selectedObject.cornerRadius || 0}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        selectedObject.set('cornerRadius', val);
                                                        // We'll use this for path generation
                                                        canvas.renderAll();
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 mb-3 bg-blue-50 p-2 rounded border border-blue-200">
                                        <input
                                            type="checkbox"
                                            id="snapGrid"
                                            className="w-4 h-4 cursor-pointer"
                                            checked={objProps.snapToGrid || false}
                                            onChange={(e) => {
                                                updateProperty('snapToGrid', e.target.checked);
                                            }}
                                        />
                                        <label htmlFor="snapGrid" className="text-xs font-bold text-blue-700 cursor-pointer">
                                            📏 Snap to Grid (10px)
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        {(selectedObject.type === 'polygon' || selectedObject.type === 'path' || selectedObject.type === 'rect') && (
                                            <button
                                                className={`p-2 border rounded text-xs font-bold ${isEditingPoints ? 'bg-green-100 border-green-400 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}
                                                onClick={editShapePoints}
                                            >
                                                {isEditingPoints ? '✅ Finish Editing' : '🎯 Edit Points (stretch)'}
                                            </button>
                                        )}
                                        {isDrawingMode && (
                                            <button className="p-2 bg-red-100 text-red-600 border border-red-200 rounded text-xs font-bold" onClick={cancelDrawing}>
                                                ❌ Cancel Draw
                                            </button>
                                        )}
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
            </div >
        </div >
    );
};

export default CreateTemplate;


