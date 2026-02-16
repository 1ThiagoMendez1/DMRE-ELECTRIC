'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as fabric from 'fabric';
import { usePlans, generateElementId } from '@/components/providers/plans-provider';
import { PoleElement, BoxElement, NetworkLine, DuctElement } from '@/types/plans';

// Extend fabric object to support custom data
interface FabricObjectWithData extends fabric.FabricObject {
    customData?: Record<string, unknown>;
}

// Connection point interface
interface ConnectionPoint {
    element: fabric.FabricObject;
    x: number;
    y: number;
}

export function PlanCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [connectionStart, setConnectionStart] = useState<ConnectionPoint | null>(null);
    const tempLineRef = useRef<fabric.Line | null>(null);

    const {
        toolState,
        setSelectedElementIds,
        addElement,
        updateElement,
        setZoomLevel,
        activeLayerId,
        layers,
        pushHistory,
        undo,
        redo,
        setActiveTool,
        fabricCanvasRef: providerCanvasRef,
        setCanvasReady,
        isLoadingCanvas,
    } = usePlans();

    // Compute state from toolState
    const isConnecting = toolState.activeTool === 'connect';

    // Get active layer color
    const getActiveLayerColor = () => {
        const layer = layers.find(l => l.id === activeLayerId);
        return layer?.color || '#2196F3';
    };

    // Grid is rendered via CSS backgroundImage on the container - no fabric.js objects needed


    // Initialize Fabric.js canvas
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: container.clientWidth,
            height: container.clientHeight,
            backgroundColor: 'transparent',
            selection: true,
            preserveObjectStacking: true,
            renderOnAddRemove: false, // Optimize: manual render control
            centeredScaling: true,
            centeredRotation: true,
            enableRetinaScaling: false, // Faster rendering
        });

        // Configure freehand brush
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = '#1a1a1a';
        canvas.freeDrawingBrush.width = 2;

        fabricCanvasRef.current = canvas;
        providerCanvasRef.current = canvas; // Sync with provider for undo/redo

        // Render initial canvas
        canvas.renderAll();

        // Mark canvas as ready for restoration
        setCanvasReady(true);


        // Selection events
        canvas.on('selection:created', () => {
            const selected = canvas.getActiveObjects();
            const ids = selected
                .map(obj => (obj as FabricObjectWithData).customData?.id as string)
                .filter(Boolean);
            setSelectedElementIds(ids);
        });

        canvas.on('selection:updated', () => {
            const selected = canvas.getActiveObjects();
            const ids = selected
                .map(obj => (obj as FabricObjectWithData).customData?.id as string)
                .filter(Boolean);
            setSelectedElementIds(ids);
        });

        canvas.on('selection:cleared', () => {
            setSelectedElementIds([]);
        });

        // Object movement with snap-to-grid
        canvas.on('object:moving', (e) => {
            if (!e.target) return;

            // Snap to grid
            if (toolState.snapToGrid) {
                const target = e.target;
                const gridSize = toolState.gridSize;
                target.set({
                    left: Math.round((target.left || 0) / gridSize) * gridSize,
                    top: Math.round((target.top || 0) / gridSize) * gridSize,
                });
            }

            // Update connected lines
            updateConnectedLines(canvas, e.target);
        });

        // Object modified - sync with state and push to history
        canvas.on('object:modified', (e) => {
            const target = e.target as FabricObjectWithData;
            if (target && target.customData?.id) {
                updateElement(target.customData.id as string, {
                    x: target.left || 0,
                    y: target.top || 0,
                    rotation: target.angle || 0,
                });
            }
            updateConnectedLines(canvas, e.target!);
            pushHistory(); // Save state for undo/redo
        });

        // Object added - only render, history is handled by debounced pushHistory elsewhere
        canvas.on('object:added', () => {
            canvas.requestRenderAll();
        });

        // Object removed - push to history
        canvas.on('object:removed', (e) => {
            const target = e.target as FabricObjectWithData;
            if (target && !target.customData?.isGrid) {
                pushHistory();
            }
        });

        // Mouse wheel zoom
        canvas.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY;
            let zoom = canvas.getZoom();
            zoom *= 0.999 ** delta;
            zoom = Math.min(4, Math.max(0.1, zoom)); // 10% to 400%

            const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
            canvas.zoomToPoint(point, zoom);

            // Sync provider state (debounced to avoid loop)
            const newZoomLevel = Math.round(zoom * 100);
            setZoomLevel(newZoomLevel);

            opt.e.preventDefault();
            opt.e.stopPropagation();
        });

        // Pan with tool or middle mouse or space+drag
        let isPanning = false;
        let lastPosX = 0;
        let lastPosY = 0;

        canvas.on('mouse:down', (opt) => {
            const evt = opt.e as MouseEvent;
            const isPanTool = toolState.activeTool === 'pan';
            if (evt.button === 1 || (evt.altKey && evt.button === 0) || (isPanTool && evt.button === 0)) {
                isPanning = true;
                lastPosX = evt.clientX;
                lastPosY = evt.clientY;
                canvas.selection = false;
                canvas.defaultCursor = 'grabbing';
            }
        });

        canvas.on('mouse:move', (opt) => {
            const evt = opt.e as MouseEvent;
            if (isPanning) {
                const vpt = canvas.viewportTransform;
                if (vpt) {
                    vpt[4] += evt.clientX - lastPosX;
                    vpt[5] += evt.clientY - lastPosY;
                    lastPosX = evt.clientX;
                    lastPosY = evt.clientY;
                    canvas.requestRenderAll();
                }
            }
        });

        canvas.on('mouse:up', () => {
            isPanning = false;
            canvas.selection = toolState.activeTool === 'select';
            canvas.defaultCursor = toolState.activeTool === 'pan' ? 'grab' : 'default';
        });

        // Handle path creation (freehand drawing complete)
        canvas.on('path:created', (e) => {
            const path = e.path as FabricObjectWithData;
            if (path) {
                const id = generateElementId();
                path.customData = { id, type: 'drawing' };
                path.set({
                    selectable: true,
                    hasControls: true,
                });
            }
        });

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
            canvas.setDimensions({
                width: container.clientWidth,
                height: container.clientHeight,
            });
            canvas.renderAll();
        });
        resizeObserver.observe(container);

        // Keyboard shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const activeObjects = canvas.getActiveObjects();
                activeObjects.forEach(obj => {
                    if (!(obj as FabricObjectWithData).customData?.isGrid) {
                        canvas.remove(obj);
                    }
                });
                canvas.discardActiveObject();
                canvas.renderAll();
            }

            // Zoom shortcuts
            if ((e.metaKey || e.ctrlKey) && e.key === '=') {
                e.preventDefault();
                const zoom = Math.min(4, canvas.getZoom() * 1.1);
                canvas.setZoom(zoom);
                setZoomLevel(Math.round(zoom * 100));
            }
            if ((e.metaKey || e.ctrlKey) && e.key === '-') {
                e.preventDefault();
                const zoom = Math.max(0.1, canvas.getZoom() * 0.9);
                canvas.setZoom(zoom);
                setZoomLevel(Math.round(zoom * 100));
            }

            // Undo/Redo shortcuts
            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
            if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                redo();
            }

            // Toggle drawing mode with 'D' key
            if (e.key === 'd' || e.key === 'D') {
                setIsDrawingMode(prev => !prev);
            }

            // Escape to cancel connecting
            if (e.key === 'Escape') {
                if (toolState.activeTool === 'connect') {
                    setActiveTool('select');
                }
                setConnectionStart(null);
                if (tempLineRef.current && fabricCanvasRef.current) {
                    fabricCanvasRef.current.remove(tempLineRef.current);
                    tempLineRef.current = null;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Cleanup
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            resizeObserver.disconnect();
            setCanvasReady(false); // Mark canvas as not ready
            canvas.dispose();
            fabricCanvasRef.current = null;
        };
    }, [toolState.activeTool]); // Re-run when tool changes to update cursor/selection

    // Sync zoom from provider to fabric
    useEffect(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        const currentZoom = canvas.getZoom();
        const targetZoom = toolState.zoomLevel / 100;

        if (Math.abs(currentZoom - targetZoom) > 0.01) {
            // Zoom to the center of the visible viewport
            const center = canvas.getVpCenter();
            canvas.zoomToPoint(center, targetZoom);
            canvas.requestRenderAll();
        }
    }, [toolState.zoomLevel]);

    // Update cursor based on tool
    useEffect(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        canvas.defaultCursor = toolState.activeTool === 'pan' ? 'grab' : 'default';
        canvas.selection = toolState.activeTool === 'select';
        canvas.renderAll();
    }, [toolState.activeTool]);

    // Update connected lines when element moves
    const updateConnectedLines = (canvas: fabric.Canvas, movedObject: fabric.FabricObject) => {
        const movedData = (movedObject as FabricObjectWithData).customData;
        if (!movedData?.id) return;

        const lines = canvas.getObjects().filter(obj => {
            const data = (obj as FabricObjectWithData).customData;
            return data?.type === 'connection' &&
                (data?.startId === movedData.id || data?.endId === movedData.id);
        });

        lines.forEach(lineObj => {
            const line = lineObj as fabric.Line;
            const lineData = (line as FabricObjectWithData).customData;

            if (lineData?.startId === movedData.id) {
                const center = movedObject.getCenterPoint();
                line.set({ x1: center.x, y1: center.y });
            }
            if (lineData?.endId === movedData.id) {
                const center = movedObject.getCenterPoint();
                line.set({ x2: center.x, y2: center.y });
            }
            line.setCoords();
        });

        canvas.renderAll();
    };

    // Toggle drawing mode
    useEffect(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        canvas.isDrawingMode = isDrawingMode;

        if (isDrawingMode && canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = getActiveLayerColor();
            canvas.freeDrawingBrush.width = 2;
        }
    }, [isDrawingMode, activeLayerId, layers]);

    // Grid is rendered via CSS backgroundImage on the container - no fabric.js grid needed

    // Handle drop from sidebar
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;
        const data = e.dataTransfer.getData('application/json');

        if (!data) return;

        try {
            const elementData = JSON.parse(data);
            const canvasRect = containerRef.current?.getBoundingClientRect();
            if (!canvasRect) return;

            // Convert screen coordinates to canvas coordinates
            const x = e.clientX - canvasRect.left;
            const y = e.clientY - canvasRect.top;

            // Snap to grid if enabled
            const snapX = toolState.snapToGrid ? Math.round(x / toolState.gridSize) * toolState.gridSize : x;
            const snapY = toolState.snapToGrid ? Math.round(y / toolState.gridSize) * toolState.gridSize : y;

            let fabricObject: fabric.FabricObject | null = null;

            switch (elementData.type) {
                case 'pole':
                    fabricObject = createPoleSymbol(elementData, snapX, snapY, getActiveLayerColor());
                    break;
                case 'box':
                    fabricObject = createBoxSymbol(elementData, snapX, snapY);
                    break;
                case 'network':
                    fabricObject = createNetworkPreview(elementData, snapX, snapY);
                    break;
                case 'duct':
                    fabricObject = createDuctSymbol(elementData, snapX, snapY);
                    break;
            }

            if (fabricObject) {
                canvas.add(fabricObject);
                canvas.setActiveObject(fabricObject);
                canvas.renderAll();
                pushHistory(); // Register change for auto-save

                // Auto-activate connection mode for network elements
                if (elementData.type === 'network') {
                    setActiveTool('connect');
                    // Set this as the connection start point
                    const center = fabricObject.getCenterPoint();
                    setConnectionStart({
                        element: fabricObject,
                        x: center.x,
                        y: center.y,
                    });
                    // Create temporary line
                    tempLineRef.current = new fabric.Line([center.x, center.y, center.x + 50, center.y], {
                        stroke: getActiveLayerColor(),
                        strokeWidth: 3,
                        selectable: false,
                        evented: false,
                        strokeDashArray: [5, 5],
                    });
                    canvas.add(tempLineRef.current);
                }
            }
        } catch (err) {
            console.error('Error dropping element:', err);
        }
    }, [toolState.snapToGrid, toolState.gridSize, activeLayerId, layers, pushHistory]);

    // Use Fabric 7.x findTarget for millimetric precision
    const getTargetUnderPointer = useCallback((e: React.MouseEvent) => {
        if (!fabricCanvasRef.current) return null;
        const canvas = fabricCanvasRef.current;

        // Find object under mouse using original native event for maximum precision
        const target = canvas.findTarget(e.nativeEvent);
        if (target && (target as unknown as FabricObjectWithData).customData?.id && !(target as unknown as FabricObjectWithData).customData?.isGrid) {
            return target as unknown as fabric.FabricObject;
        }
        return null;
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    // Handle click for connection mode
    const handleCanvasClick = useCallback((e: React.MouseEvent) => {
        if (!isConnecting || !fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;
        const target = getTargetUnderPointer(e);

        if (target) {
            const pointer = canvas.getScenePoint(e.nativeEvent);
            if (!connectionStart) {
                // First click - start connection
                setConnectionStart({
                    element: target,
                    x: pointer.x,
                    y: pointer.y,
                });

                // Create temporary line
                const center = target.getCenterPoint();
                tempLineRef.current = new fabric.Line([center.x, center.y, pointer.x, pointer.y], {
                    stroke: getActiveLayerColor(),
                    strokeWidth: 3,
                    selectable: false,
                    evented: false,
                    strokeDashArray: [5, 5],
                } as any);
                canvas.add(tempLineRef.current);
            } else {
                // Second click - complete connection
                const startCenter = connectionStart.element.getCenterPoint();
                const endCenter = target.getCenterPoint();

                // Create permanent connection line
                const connectionLine = new fabric.Line(
                    [startCenter.x, startCenter.y, endCenter.x, endCenter.y],
                    {
                        stroke: getActiveLayerColor(),
                        strokeWidth: 3,
                        selectable: true,
                        hasControls: false,
                        hasBorders: true,
                        lockMovementX: true,
                        lockMovementY: true,
                    } as any
                );

                const id = generateElementId();
                (connectionLine as unknown as FabricObjectWithData).customData = {
                    id,
                    type: 'connection',
                    startId: (connectionStart.element as unknown as FabricObjectWithData).customData?.id,
                    endId: (target as unknown as FabricObjectWithData).customData?.id,
                };

                // Remove temp line and add permanent
                if (tempLineRef.current) {
                    canvas.remove(tempLineRef.current);
                    tempLineRef.current = null;
                }
                canvas.add(connectionLine);
                canvas.sendObjectToBack(connectionLine);
                pushHistory();

                // Continuous mode: set current target as new start point
                setConnectionStart({
                    element: target,
                    x: endCenter.x,
                    y: endCenter.y,
                });

                // Create new temp line from the new start
                tempLineRef.current = new fabric.Line([endCenter.x, endCenter.y, pointer.x, pointer.y], {
                    stroke: getActiveLayerColor(),
                    strokeWidth: 3,
                    selectable: false,
                    evented: false,
                    strokeDashArray: [5, 5],
                } as any);
                canvas.add(tempLineRef.current);
                canvas.requestRenderAll();
            }
        }
    }, [isConnecting, connectionStart, activeLayerId, layers, pushHistory, getActiveLayerColor, getTargetUnderPointer]);

    // Update temp line position while connecting
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isConnecting || !connectionStart || !tempLineRef.current || !fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;
        const pointer = canvas.getScenePoint(e.nativeEvent);

        tempLineRef.current.set({ x2: pointer.x, y2: pointer.y });
        canvas.requestRenderAll();
    }, [isConnecting, connectionStart]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative"
            style={{
                backgroundColor: '#fafbfc',
                backgroundImage: toolState.gridEnabled
                    ? `linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px),
                       linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px),
                       linear-gradient(to right, rgba(0,0,0,0.25) 1px, transparent 1px),
                       linear-gradient(to bottom, rgba(0,0,0,0.25) 1px, transparent 1px)`
                    : 'none',
                backgroundSize: toolState.gridEnabled
                    ? `${toolState.gridSize}px ${toolState.gridSize}px,
                       ${toolState.gridSize}px ${toolState.gridSize}px,
                       ${toolState.gridSize * 5}px ${toolState.gridSize * 5}px,
                       ${toolState.gridSize * 5}px ${toolState.gridSize * 5}px`
                    : 'auto',
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
        >
            <canvas ref={canvasRef} />

            {/* Loading overlay */}
            {isLoadingCanvas && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium text-muted-foreground">Cargando lienzo...</span>
                    </div>
                </div>
            )}

            {/* Connection mode helper */}
            {isConnecting && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-[100] animate-in fade-in slide-in-from-top-4">
                    {connectionStart
                        ? '🎯 Haz clic en el segundo elemento para conectar'
                        : '🔌 Selección activa: Haz clic en el primer elemento para iniciar conexión'}
                    <button
                        onClick={() => setActiveTool('select')}
                        className="ml-3 bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-xs transition-colors"
                    >
                        Cancelar (Esc)
                    </button>
                </div>
            )}

            {/* Zoom indicator */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-sm border text-sm font-medium">
                🔍 {toolState.zoomLevel}%
            </div>

            {/* Scale indicator */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-sm border text-sm font-medium">
                📏 Escala: {toolState.measurementScale}
            </div>

            {/* Grid toggle hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-sm border text-xs text-muted-foreground">
                Cuadrícula: {toolState.gridEnabled ? '✓ Activa' : '✗ Inactiva'} |
                Ajustar: {toolState.snapToGrid ? '✓ Activo' : '✗ Inactivo'} |
                🖱️ Alt+Arrastrar para mover | Rueda para zoom
            </div>
        </div>
    );
}

// ============================================
// SYMBOL CREATION FUNCTIONS
// ============================================

function createPoleSymbol(data: Partial<PoleElement>, x: number, y: number, layerColor: string): fabric.FabricObject {
    const id = generateElementId();
    const color = data.poleType === 'ap' ? '#FFC107' : layerColor;

    // Pole base circle
    const base = new fabric.Circle({
        radius: 16,
        fill: color,
        stroke: '#1a1a1a',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
    });

    // Inner circle for anchor point
    const inner = new fabric.Circle({
        radius: 5,
        fill: '#ffffff',
        stroke: '#1a1a1a',
        strokeWidth: 1,
        originX: 'center',
        originY: 'center',
    });

    // Height label
    const label = new fabric.FabricText(data.height || '10m', {
        fontSize: 11,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        fill: '#1a1a1a',
        originX: 'center',
        originY: 'top',
        top: 20,
    });

    // Connection points (4 anchor points around the pole)
    const anchors: fabric.Circle[] = [];
    const anchorPositions = [
        { x: 0, y: -20 },  // Top
        { x: 20, y: 0 },   // Right
        { x: 0, y: 20 },   // Bottom
        { x: -20, y: 0 },  // Left
    ];

    anchorPositions.forEach(pos => {
        const anchor = new fabric.Circle({
            radius: 4,
            fill: '#22C55E',
            stroke: '#166534',
            strokeWidth: 1,
            originX: 'center',
            originY: 'center',
            left: pos.x,
            top: pos.y,
        });
        anchors.push(anchor);
    });

    const group = new fabric.Group([base, inner, ...anchors, label], {
        left: x,
        top: y,
        originX: 'center',
        originY: 'center',
        hasControls: true,
        hasBorders: true,
        subTargetCheck: true,
    });

    (group as FabricObjectWithData).customData = { id, type: 'pole', ...data };

    return group;
}

function createBoxSymbol(data: Partial<BoxElement>, x: number, y: number): fabric.FabricObject {
    const id = generateElementId();
    const width = Math.max(data.width || 50, 40);
    const height = Math.max(data.height || 50, 40);

    // Box rectangle with rounded corners
    const rect = new fabric.Rect({
        width: width,
        height: height,
        fill: '#e5e7eb',
        stroke: '#374151',
        strokeWidth: 2,
        rx: 4,
        ry: 4,
        originX: 'center',
        originY: 'center',
    });

    // Box type label
    const label = new fabric.FabricText(data.boxType || 'CS', {
        fontSize: 12,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        fill: '#1f2937',
        originX: 'center',
        originY: 'center',
    });

    // Connection points
    const anchors: fabric.Circle[] = [];
    const positions = [
        { x: 0, y: -(height / 2 + 5) },
        { x: width / 2 + 5, y: 0 },
        { x: 0, y: height / 2 + 5 },
        { x: -(width / 2 + 5), y: 0 },
    ];

    positions.forEach(pos => {
        anchors.push(new fabric.Circle({
            radius: 4,
            fill: '#22C55E',
            stroke: '#166534',
            strokeWidth: 1,
            originX: 'center',
            originY: 'center',
            left: pos.x,
            top: pos.y,
        }));
    });

    const group = new fabric.Group([rect, ...anchors, label], {
        left: x,
        top: y,
        originX: 'center',
        originY: 'center',
        hasControls: true,
        hasBorders: true,
    });

    (group as FabricObjectWithData).customData = { id, type: 'box', ...data };

    return group;
}

function createNetworkPreview(data: Record<string, unknown>, x: number, y: number): fabric.FabricObject {
    const id = generateElementId();
    const color = (data.color as string) || '#3B82F6';

    // Network line preview (horizontal line with label)
    const line = new fabric.Line([0, 0, 100, 0], {
        stroke: color,
        strokeWidth: 4,
        originX: 'center',
        originY: 'center',
    });

    const startDot = new fabric.Circle({
        radius: 5,
        fill: color,
        stroke: '#1a1a1a',
        strokeWidth: 1,
        left: -50,
        top: 0,
        originX: 'center',
        originY: 'center',
    });

    const endDot = new fabric.Circle({
        radius: 5,
        fill: color,
        stroke: '#1a1a1a',
        strokeWidth: 1,
        left: 50,
        top: 0,
        originX: 'center',
        originY: 'center',
    });

    const label = new fabric.FabricText((data.name as string) || 'Red', {
        fontSize: 10,
        fontFamily: 'Arial, sans-serif',
        fill: '#1a1a1a',
        originX: 'center',
        originY: 'top',
        top: 10,
    });

    const group = new fabric.Group([line, startDot, endDot, label], {
        left: x,
        top: y,
        originX: 'center',
        originY: 'center',
        hasControls: true,
        hasBorders: true,
    });

    (group as FabricObjectWithData).customData = { id, type: 'network', ...data };

    return group;
}

function createDuctSymbol(data: Record<string, unknown>, x: number, y: number): fabric.FabricObject {
    const id = generateElementId();

    // Duct rectangle
    const rect = new fabric.Rect({
        width: 80,
        height: 20,
        fill: '#FED7AA',
        stroke: '#EA580C',
        strokeWidth: 2,
        rx: 3,
        ry: 3,
        originX: 'center',
        originY: 'center',
    });

    // Inner pattern (duct pipes)
    const pipes: fabric.Rect[] = [];
    const pipeCount = 3;
    for (let i = 0; i < pipeCount; i++) {
        pipes.push(new fabric.Rect({
            width: 10,
            height: 10,
            fill: '#FDBA74',
            stroke: '#C2410C',
            strokeWidth: 1,
            rx: 2,
            ry: 2,
            left: -30 + i * 25,
            top: 0,
            originX: 'center',
            originY: 'center',
        }));
    }

    const label = new fabric.FabricText((data.size as string) || '2x3"', {
        fontSize: 8,
        fontFamily: 'Arial, sans-serif',
        fill: '#7C2D12',
        originX: 'center',
        originY: 'top',
        top: 14,
    });

    const group = new fabric.Group([rect, ...pipes, label], {
        left: x,
        top: y,
        originX: 'center',
        originY: 'center',
        hasControls: true,
        hasBorders: true,
    });

    (group as FabricObjectWithData).customData = { id, type: 'duct', ...data };

    return group;
}
