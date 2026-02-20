'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as fabric from 'fabric';
import { usePlans, generateElementId } from '@/components/providers/plans-provider';
import { PoleElement, BoxElement, NetworkType, NetworkVariant, NETWORK_CATALOG } from '@/types/plans';
import {
    GraphNode,
    GraphEdge,
    getNodeSupportedTension,
    calculateDistance,
} from '@/types/graph-types';
import { getNetworkStyle, NetworkStyle } from '@/lib/plans/network-styles';

// Extend fabric object to support custom data
interface FabricObjectWithData extends fabric.FabricObject {
    customData?: Record<string, unknown>;
}

// Connection point interface
interface ConnectionPoint {
    element: fabric.FabricObject;
    x: number;
    y: number;
    graphNodeId: string;
}

export function PlanCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [connectionStart, setConnectionStart] = useState<ConnectionPoint | null>(null);
    const [validTargetIds, setValidTargetIds] = useState<Set<string>>(new Set());
    const [validationWarning, setValidationWarning] = useState<string | null>(null);
    const tempLineRef = useRef<fabric.Line | null>(null);
    const highlightCirclesRef = useRef<fabric.Circle[]>([]);
    const [tooltipRef, setTooltipState] = useState<{ visible: boolean; content: string; x: number; y: number }>({
        visible: false,
        content: '',
        x: 0,
        y: 0,
    });

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

        // Graph state
        graphNodes,
        graphEdges,
        graphNodesToEdges, // Newly added index
        addGraphNode,
        removeGraphNode,
        moveGraphNode,
        addGraphEdge,
        removeGraphEdge,
        getNodeByFabricId,

        // Network selection
        selectedNetworkType,
        selectedNetworkVariant,
        setSelectedNetwork,

        // Validation
        validateConnection,
        getValidConnectionTargets,
    } = usePlans();

    const toolStateRef = useRef(toolState);
    const activeLayerIdRef = useRef(activeLayerId);
    const selectedNetworkTypeRef = useRef(selectedNetworkType);
    const selectedNetworkVariantRef = useRef(selectedNetworkVariant);
    const connectionStartRef = useRef<ConnectionPoint | null>(null);

    useEffect(() => {
        toolStateRef.current = toolState;
        activeLayerIdRef.current = activeLayerId;
        selectedNetworkTypeRef.current = selectedNetworkType;
        selectedNetworkVariantRef.current = selectedNetworkVariant;
    }, [toolState, activeLayerId, selectedNetworkType, selectedNetworkVariant]);

    // Compute state from toolState
    const isConnecting = toolState.activeTool === 'connect';

    // Get active layer color
    const getActiveLayerColor = () => {
        const layer = layers.find(l => l.id === activeLayerId);
        return layer?.color || '#2196F3';
    };

    // Style retrieval is now handled directly in listeners via Refs to avoid stale closures

    // Helper to get object display name
    const getObjectDisplayName = useCallback((obj: FabricObjectWithData): string => {
        let data = obj.customData;

        // RESILIENT FALLBACK: If no customData, try to find it in graph by ID
        if (!data || !data.type) {
            const objId = (obj as any).id || (obj as any).name;
            if (objId) {
                const node = graphNodes.get(objId);
                if (node) {
                    data = node.metadata as any;
                } else {
                    const edge = graphEdges.get(objId);
                    if (edge) {
                        data = { type: 'connection', ...edge } as any;
                    }
                }
            }
        }

        if (!data || !data.type) return '';

        try {
            switch (data.type) {
                case 'pole':
                    return (data.name as string) || (data.poleType as string) || 'Poste de Energía';
                case 'box':
                    return (data.name as string) || (data.boxType as string) || 'Caja de Inspección';
                case 'network':
                case 'connection': {
                    const type = (data.networkType || (data as any).type) as NetworkType;
                    const variant = ((data as any).variant || 'aerial') as NetworkVariant;
                    const style = getNetworkStyle(type, variant);
                    return style.label || 'Línea de Red';
                }
                case 'duct':
                    return (data.size as string) ? `Canalización ${data.size}` : 'Canalización';
                case 'drawing':
                    return 'Lápiz (Dibujo)';
                default:
                    return '';
            }
        } catch (err) {
            console.warn('Error getting display name:', err);
            return '';
        }
    }, [getNetworkStyle, graphNodes, graphEdges]);

    // ============================================
    // HIGHLIGHT VALID TARGETS
    // ============================================

    const clearHighlights = useCallback(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        highlightCirclesRef.current.forEach(circle => {
            canvas.remove(circle);
        });
        highlightCirclesRef.current = [];
        canvas.requestRenderAll();
    }, []);

    const showHighlights = useCallback((validIds: Set<string>) => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;

        clearHighlights();

        // Highlight valid target nodes with a green glow circle
        canvas.getObjects().forEach(obj => {
            const data = (obj as FabricObjectWithData).customData;
            if (!data?.graphNodeId) return;

            const nodeId = data.graphNodeId as string;
            if (validIds.has(nodeId)) {
                const center = obj.getCenterPoint();
                const glow = new fabric.Circle({
                    radius: 28,
                    fill: 'transparent',
                    stroke: '#22C55E',
                    strokeWidth: 3,
                    left: center.x,
                    top: center.y,
                    originX: 'center',
                    originY: 'center',
                    selectable: false,
                    evented: false,
                    strokeDashArray: [4, 3],
                    opacity: 0.8,
                });
                (glow as FabricObjectWithData).customData = { isHighlight: true };
                canvas.add(glow);
                highlightCirclesRef.current.push(glow);
            }
        });

        canvas.requestRenderAll();
    }, [clearHighlights]);

    // Update highlights when connection start changes
    useEffect(() => {
        if (isConnecting && connectionStart) {
            const targets = getValidConnectionTargets(connectionStart.graphNodeId);
            setValidTargetIds(targets);
            showHighlights(targets);
        } else {
            setValidTargetIds(new Set());
            clearHighlights();
        }
    }, [isConnecting, connectionStart, getValidConnectionTargets, showHighlights, clearHighlights]);

    // Clear highlights and connection state when leaving connection mode
    useEffect(() => {
        if (!isConnecting) {
            setConnectionStart(null);
            connectionStartRef.current = null;
            setValidationWarning(null);
            clearHighlights();
            if (tempLineRef.current && fabricCanvasRef.current) {
                fabricCanvasRef.current.remove(tempLineRef.current);
                tempLineRef.current = null;
                fabricCanvasRef.current.requestRenderAll();
            }
        }
    }, [isConnecting, clearHighlights]);

    // ============================================
    // INITIALIZE FABRIC.JS CANVAS
    // ============================================

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: container.clientWidth,
            height: container.clientHeight,
            backgroundColor: 'transparent',
            selection: true,
            preserveObjectStacking: true,
            renderOnAddRemove: false,
            centeredScaling: true,
            centeredRotation: true,
            enableRetinaScaling: false,
        });

        // Configure freehand brush
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = '#1a1a1a';
        canvas.freeDrawingBrush.width = 2;

        fabricCanvasRef.current = canvas;
        providerCanvasRef.current = canvas as any;

        canvas.renderAll();
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

        // Object movement with snap-to-grid + graph node position sync
        canvas.on('object:moving', (e) => {
            if (!e.target) return;

            // Snap to grid
            if (toolStateRef.current.snapToGrid) {
                const target = e.target;
                const gridSize = toolStateRef.current.gridSize;
                target.set({
                    left: Math.round((target.left || 0) / gridSize) * gridSize,
                    top: Math.round((target.top || 0) / gridSize) * gridSize,
                });
            }

            // Update connected lines (both graph-based and legacy)
            updateConnectedLines(canvas, e.target);

            // Update graph node position
            const data = (e.target as FabricObjectWithData).customData;
            if (data?.graphNodeId) {
                const center = e.target.getCenterPoint();
                moveGraphNode(data.graphNodeId as string, center.x, center.y);
            }
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

            // Sync graph node position after modification
            if (target?.customData?.graphNodeId) {
                const center = target.getCenterPoint();
                moveGraphNode(target.customData.graphNodeId as string, center.x, center.y);
            }

            pushHistory();
        });

        // Object added
        canvas.on('object:added', () => {
            canvas.requestRenderAll();
        });

        // Object removed
        canvas.on('object:removed', (e) => {
            const target = e.target as FabricObjectWithData;
            if (target && !target.customData?.isGrid && !target.customData?.isHighlight) {
                pushHistory();
            }
        });

        // Mouse wheel zoom
        canvas.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY;
            let zoom = canvas.getZoom();
            zoom *= 0.999 ** delta;
            zoom = Math.min(4, Math.max(0.1, zoom));

            const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
            canvas.zoomToPoint(point, zoom);

            const newZoomLevel = Math.round(zoom * 100);
            setZoomLevel(newZoomLevel);

            opt.e.preventDefault();
            opt.e.stopPropagation();
        });

        // Pan with tool or middle mouse or alt+drag
        let isPanning = false;
        let lastPosX = 0;
        let lastPosY = 0;

        canvas.on('mouse:down', (opt) => {
            const evt = opt.e as MouseEvent;
            const activeTool = toolStateRef.current.activeTool;

            // --- CONNECTION LOGIC (NATIVE) ---
            if (activeTool === 'connect') {
                const pointer = canvas.getScenePoint(evt);

                // Get target from opt.target or findTarget fallback (Fabric 7 cast fix)
                let target = opt.target as fabric.FabricObject | null;
                if (!target) {
                    target = (canvas.findTarget(evt) as unknown) as fabric.FabricObject | null;
                }

                // Traverse up to find the group with graphNodeId
                let graphNodeId: string | undefined;
                let current: any = target;
                while (current) {
                    if (current.customData?.graphNodeId) {
                        graphNodeId = current.customData.graphNodeId;
                        target = current;
                        break;
                    }
                    current = current.parent || current.group;
                }

                // --- FLEXIBLE CONNECTION LOGIC (Allows clicking anywhere) ---
                if (!connectionStartRef.current) {
                    // FIRST CLICK
                    connectionStartRef.current = {
                        element: target as any, // Might be null
                        x: (target && typeof target.getCenterPoint === 'function') ? target.getCenterPoint().x : pointer.x,
                        y: (target && typeof target.getCenterPoint === 'function') ? target.getCenterPoint().y : pointer.y,
                        graphNodeId: graphNodeId || '',
                    };

                    const startX = connectionStartRef.current.x;
                    const startY = connectionStartRef.current.y;
                    const type = selectedNetworkTypeRef.current || 'mt-13';
                    const variant = selectedNetworkVariantRef.current || 'aerial';
                    const style = getNetworkStyle(type as any, variant as any);

                    tempLineRef.current = new fabric.Line([startX, startY, pointer.x, pointer.y], {
                        stroke: style?.color || '#3b82f6',
                        strokeWidth: style?.strokeWidth || 4,
                        selectable: false,
                        evented: false,
                        strokeDashArray: style?.dashArray ? [...style.dashArray] : [5, 5],
                        opacity: 0.7,
                    } as any);

                    canvas.add(tempLineRef.current);
                    canvas.requestRenderAll();
                } else {
                    // SECOND CLICK
                    const start = connectionStartRef.current;
                    const endX = (target && typeof target.getCenterPoint === 'function') ? target.getCenterPoint().x : pointer.x;
                    const endY = (target && typeof target.getCenterPoint === 'function') ? target.getCenterPoint().y : pointer.y;
                    const type = selectedNetworkTypeRef.current || 'mt-13';
                    const variant = selectedNetworkVariantRef.current || 'aerial';
                    const style = getNetworkStyle(type as any, variant as any);
                    const edgeId = generateElementId();

                    const connectionLine = new fabric.Line(
                        [start.x, start.y, endX, endY],
                        {
                            stroke: style?.color || '#3b82f6',
                            strokeWidth: style?.strokeWidth || 4,
                            strokeDashArray: style?.dashArray ? [...style.dashArray] : undefined,
                            // FORCED INTERACTIVITY FOR TOOLTIPS
                            subTargetCheck: true,
                            selectable: true,
                            evented: true,
                            hasControls: false,
                            hasBorders: true,
                            lockMovementX: true,
                            lockMovementY: true,
                        } as any
                    );

                    (connectionLine as any).id = edgeId;
                    (connectionLine as any).name = style?.label || 'Conexión';

                    (connectionLine as unknown as FabricObjectWithData).customData = {
                        id: edgeId,
                        type: 'connection',
                        graphEdgeId: edgeId,
                        sourceNodeId: start.graphNodeId,
                        targetNodeId: graphNodeId,
                        networkType: selectedNetworkTypeRef.current,
                        variant: selectedNetworkVariantRef.current,
                    };

                    if (tempLineRef.current) {
                        canvas.remove(tempLineRef.current);
                        tempLineRef.current = null;
                    }

                    canvas.add(connectionLine);
                    canvas.sendObjectToBack(connectionLine);

                    // Register graph edge (only if both ends are nodes)
                    if (start.graphNodeId && graphNodeId) {
                        const edge: GraphEdge = {
                            id: edgeId,
                            sourceNodeId: start.graphNodeId,
                            targetNodeId: graphNodeId,
                            networkType: selectedNetworkTypeRef.current!,
                            variant: selectedNetworkVariantRef.current!,
                            fabricObjectId: edgeId,
                            length: calculateDistance(start.x, start.y, endX, endY),
                            layerId: activeLayerIdRef.current,
                            createdAt: new Date().toISOString(),
                        };
                        addGraphEdge(edge);
                    }

                    pushHistory();

                    // Continuous mode: move start to the end point
                    connectionStartRef.current = {
                        element: target as any,
                        x: endX,
                        y: endY,
                        graphNodeId: graphNodeId || '',
                    };

                    tempLineRef.current = new fabric.Line([endX, endY, pointer.x, pointer.y], {
                        stroke: style?.color || '#3b82f6',
                        strokeWidth: style?.strokeWidth || 4,
                        selectable: false,
                        evented: false,
                        strokeDashArray: style?.dashArray ? [...style.dashArray] : [5, 5],
                        opacity: 0.7,
                    } as any);
                    canvas.add(tempLineRef.current);
                    canvas.requestRenderAll();
                }
                return;
            }

            const isPanTool = activeTool === 'pan';
            if (evt.button === 1 || (evt.altKey && evt.button === 0) || (isPanTool && evt.button === 0)) {
                isPanning = true;
                lastPosX = evt.clientX;
                lastPosY = evt.clientY;
                canvas.selection = false;
                canvas.defaultCursor = 'grabbing';
            }
        });

        // Hover effect for connectable nodes and Tooltips
        canvas.on('mouse:over', (opt) => {
            if (!opt.target) return;

            let obj = opt.target as FabricObjectWithData;
            let displayObj: FabricObjectWithData | null = null;

            // Bubble up to find object with customData
            while (obj) {
                if (obj.customData) {
                    displayObj = obj;
                    break;
                }
                obj = (obj.parent || (obj as any).group) as FabricObjectWithData;
            }

            if (displayObj) {
                // Show Tooltip
                const name = getObjectDisplayName(displayObj);
                if (name) {
                    setTooltipState(prev => ({ ...prev, visible: true, content: name }));
                }

                // Connection highlighting logic
                if (toolStateRef.current.activeTool === 'connect' && displayObj.customData?.graphNodeId) {
                    displayObj.set({
                        shadow: new fabric.Shadow({
                            color: '#22C55E',
                            blur: 15,
                            offsetX: 0,
                            offsetY: 0,
                        }),
                    });
                    canvas.requestRenderAll();
                }
            }
        });

        canvas.on('mouse:move', (opt) => {
            const evt = opt.e as MouseEvent;
            const activeTool = toolStateRef.current.activeTool;

            // Update Tooltip position
            setTooltipState(prev => ({
                ...prev,
                x: evt.clientX,
                y: evt.clientY
            }));

            // --- CONNECTION MOVE LOGIC (NATIVE) ---
            if (activeTool === 'connect' && connectionStartRef.current && tempLineRef.current) {
                const pointer = canvas.getScenePoint(evt);
                tempLineRef.current.set({ x2: pointer.x, y2: pointer.y });
                canvas.requestRenderAll();
            }

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
            canvas.selection = toolStateRef.current.activeTool === 'select';
            canvas.defaultCursor = toolStateRef.current.activeTool === 'pan' ? 'grab' : 'default';
        });

        // Hover effect for connectable nodes
        canvas.on('mouse:over', (opt) => {
            if (toolStateRef.current.activeTool !== 'connect' || !opt.target) return;

            let obj = opt.target as FabricObjectWithData;
            let isConnectable = false;
            while (obj) {
                if (obj.customData?.graphNodeId) {
                    isConnectable = true;
                    break;
                }
                obj = (obj.parent || (obj as any).group) as FabricObjectWithData;
            }

            if (isConnectable && obj) {
                obj.set({
                    shadow: new fabric.Shadow({
                        color: '#22C55E',
                        blur: 15,
                        offsetX: 0,
                        offsetY: 0,
                    }),
                });
                canvas.requestRenderAll();
            }
        });

        canvas.on('mouse:out', (opt) => {
            setTooltipState(prev => ({ ...prev, visible: false }));
            if (!opt.target) return;

            let obj = opt.target as FabricObjectWithData;
            while (obj) {
                if (obj.customData?.graphNodeId) {
                    break;
                }
                obj = (obj.parent || (obj as any).group) as FabricObjectWithData;
            }

            if (obj) {
                obj.set({ shadow: null });
                canvas.requestRenderAll();
            }
        });

        // Handle path creation (freehand drawing complete)
        canvas.on('path:created', (e) => {
            const path = e.path as FabricObjectWithData;
            if (path) {
                const id = generateElementId();
                const type = selectedNetworkTypeRef.current || 'mt-13';
                const variant = selectedNetworkVariantRef.current || 'aerial';
                const style = getNetworkStyle(type as any, variant as any);

                (path as any).id = id;
                (path as any).name = selectedNetworkTypeRef.current ? (style.label || 'Red') : 'Dibujo Libre';

                path.customData = {
                    id,
                    type: selectedNetworkTypeRef.current ? 'network' : 'drawing',
                    networkType: selectedNetworkTypeRef.current,
                    variant: selectedNetworkVariantRef.current,
                };

                path.set({
                    selectable: true,
                    hasControls: true,
                    stroke: style?.color || path.stroke,
                    strokeWidth: style?.strokeWidth || path.strokeWidth,
                    strokeDashArray: style?.dashArray ? [...style.dashArray] : undefined,
                });

                canvas.renderAll();
                pushHistory();
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
            // Cancel connection trace
            if (e.key === 'Escape' && connectionStartRef.current) {
                if (tempLineRef.current) {
                    canvas.remove(tempLineRef.current);
                    tempLineRef.current = null;
                }
                connectionStartRef.current = null;
                setConnectionStart(null);
                canvas.requestRenderAll();
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                const activeObjects = canvas.getActiveObjects();
                activeObjects.forEach(obj => {
                    const data = (obj as FabricObjectWithData).customData;
                    if (!data?.isGrid && !data?.isHighlight) {
                        // If it's a graph node, remove from graph too
                        if (data?.graphNodeId) {
                            removeGraphNode(data.graphNodeId as string);
                        }
                        // If it's a graph edge, remove from graph
                        if (data?.graphEdgeId) {
                            removeGraphEdge(data.graphEdgeId as string);
                        }
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
                if (toolStateRef.current.activeTool === 'connect') {
                    setActiveTool('select');
                }
                setConnectionStart(null);
                setValidationWarning(null);
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
            setCanvasReady(false);
            canvas.dispose();
            fabricCanvasRef.current = null;
        };
    }, []); // Only on mount

    // Sync zoom from provider to fabric
    useEffect(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        const currentZoom = canvas.getZoom();
        const targetZoom = toolState.zoomLevel / 100;

        if (Math.abs(currentZoom - targetZoom) > 0.01) {
            const center = canvas.getVpCenter();
            canvas.zoomToPoint(center, targetZoom);
            canvas.requestRenderAll();
        }
    }, [toolState.zoomLevel]);

    // Update cursor and settings based on tool
    useEffect(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;

        // Reset states
        setConnectionStart(null);
        setValidationWarning(null);

        if (toolState.activeTool === 'connect') {
            canvas.defaultCursor = 'crosshair';
            canvas.hoverCursor = 'crosshair';
            // Auto-select network if none selected
            if (!selectedNetworkType) {
                const first = NETWORK_CATALOG[0];
                setSelectedNetwork(first.networkType, first.variant);
            }
        } else if (toolState.activeTool === 'pencil') {
            canvas.defaultCursor = 'crosshair';
            canvas.hoverCursor = 'crosshair';
        } else if (toolState.activeTool === 'pan') {
            canvas.defaultCursor = 'grab';
            canvas.hoverCursor = 'grabbing';
        } else {
            canvas.defaultCursor = 'default';
            canvas.hoverCursor = 'move';
        }

        canvas.selection = toolState.activeTool === 'select';
        canvas.isDrawingMode = toolState.activeTool === 'pencil' || isDrawingMode;

        if (canvas.isDrawingMode && canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = getActiveLayerColor();
            canvas.freeDrawingBrush.width = 2;
        }

        canvas.renderAll();
    }, [toolState.activeTool, isDrawingMode, activeLayerId, selectedNetworkType]);

    // ============================================
    // UPDATE CONNECTED LINES (O(1) Indexed)
    // ============================================

    const updateConnectedLines = useCallback((canvas: fabric.Canvas, movedObject: fabric.FabricObject) => {
        const movedData = (movedObject as FabricObjectWithData).customData;
        const nodeId = movedData?.graphNodeId as string;

        if (!nodeId) {
            // Legacy support (fallback to O(N))
            if (!movedData?.id) return;
            const center = movedObject.getCenterPoint();
            canvas.getObjects().forEach(obj => {
                const data = (obj as FabricObjectWithData).customData;
                if (data?.type === 'connection') {
                    const line = obj as fabric.Line;
                    if (data.startId === movedData.id) {
                        line.set({ x1: center.x, y1: center.y });
                        line.setCoords();
                    } else if (data.endId === movedData.id) {
                        line.set({ x2: center.x, y2: center.y });
                        line.setCoords();
                    }
                }
            });
            canvas.requestRenderAll();
            return;
        }

        // Graph-based: use the O(1) index from context
        const edgeIds = graphNodesToEdges.get(nodeId);
        if (!edgeIds || edgeIds.size === 0) return;

        const center = movedObject.getCenterPoint();

        // We still need to find the Fabric objects, but we only process if the ID is in our Set
        // This is significantly faster than checking multiple properties
        canvas.getObjects().forEach(obj => {
            const data = (obj as FabricObjectWithData).customData;
            if (!data) return;

            const edgeId = data.graphEdgeId as string;
            if (edgeId && edgeIds.has(edgeId)) {
                const line = obj as fabric.Line;
                if (data.sourceNodeId === nodeId) {
                    line.set({ x1: center.x, y1: center.y });
                } else if (data.targetNodeId === nodeId) {
                    line.set({ x2: center.x, y2: center.y });
                }
                line.setCoords();
            }
        });

        canvas.requestRenderAll();
    }, [graphNodesToEdges]);

    // Toggle drawing mode
    useEffect(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        const drawingEnabled = isDrawingMode || toolState.activeTool === 'pencil';
        canvas.isDrawingMode = drawingEnabled;

        if (drawingEnabled && canvas.freeDrawingBrush) {
            const type = selectedNetworkType || 'mt-13';
            const variant = selectedNetworkVariant || 'aerial';
            const style = getNetworkStyle(type, variant);

            canvas.freeDrawingBrush.color = style?.color || getActiveLayerColor();
            canvas.freeDrawingBrush.width = style?.strokeWidth || 3;
        }
    }, [isDrawingMode, toolState.activeTool, activeLayerId, layers, selectedNetworkType, selectedNetworkVariant]);

    // ============================================
    // HANDLE DROP FROM SIDEBAR
    // ============================================

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
            const elementId = generateElementId();

            switch (elementData.type) {
                case 'pole':
                    fabricObject = createPoleSymbol(elementData, snapX, snapY, getActiveLayerColor(), elementId);
                    break;
                case 'box':
                    fabricObject = createBoxSymbol(elementData, snapX, snapY, elementId);
                    break;
                case 'network': {
                    // Network drag = set selected network and activate connection mode
                    const nType = elementData.networkType as NetworkType;
                    const nVariant = elementData.variant as NetworkVariant;
                    setSelectedNetwork(nType, nVariant);
                    setActiveTool('connect');
                    return; // Don't create a fabric object for networks
                }
                case 'duct':
                    fabricObject = createDuctSymbol(elementData, snapX, snapY, elementId);
                    break;
            }

            if (fabricObject) {
                canvas.add(fabricObject);
                canvas.setActiveObject(fabricObject);
                canvas.renderAll();
                pushHistory();


                // Register as GraphNode
                const graphNodeId = elementId;
                const nodeType = elementData.type as GraphNode['elementType'];
                const center = fabricObject.getCenterPoint();

                const node: GraphNode = {
                    id: graphNodeId,
                    elementType: nodeType,
                    fabricObjectId: elementId,
                    x: center.x,
                    y: center.y,
                    metadata: {
                        layerId: activeLayerId,
                        name: elementData.name,
                        poleType: elementData.poleType,
                        height: elementData.height,
                        loadCapacity: elementData.loadCapacity,
                        isStreetLight: elementData.isStreetLight,
                        boxType: elementData.boxType,
                        boxWidth: elementData.width,
                        boxHeight: elementData.height,
                        ductSize: elementData.size,
                    },
                    supportedTension: getNodeSupportedTension(nodeType, {
                        layerId: activeLayerId,
                        poleType: elementData.poleType,
                        loadCapacity: elementData.loadCapacity,
                        boxType: elementData.boxType,
                    }),
                    createdAt: new Date().toISOString(),
                };

                addGraphNode(node);

                // Store graphNodeId in fabric object
                (fabricObject as FabricObjectWithData).customData = {
                    ...(fabricObject as FabricObjectWithData).customData,
                    graphNodeId,
                };
            }
        } catch (err) {
            console.error('Error dropping element:', err);
        }
    }, [toolState.snapToGrid, toolState.gridSize, activeLayerId, layers, pushHistory, addGraphNode, setSelectedNetwork, setActiveTool]);

    // Use Fabric 7.x findTarget for millimetric precision
    const getTargetUnderPointer = useCallback((e: React.MouseEvent) => {
        if (!fabricCanvasRef.current) return null;
        const canvas = fabricCanvasRef.current;

        // Optimization: check first for subtargets in case of groups
        const target = canvas.findTarget(e.nativeEvent);
        if (target) {
            // Check the target itself
            let data = (target as unknown as FabricObjectWithData).customData;
            if (data?.graphNodeId && !data?.isGrid && !data?.isHighlight) {
                return target as unknown as fabric.FabricObject;
            }

            // If it's a subtarget or a group, find the parent group with data
            let current: any = target;
            while (current && current.parent) {
                current = current.parent;
                data = current.customData;
                if (data?.graphNodeId) return current as fabric.FabricObject;
            }
        }
        return null;
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    // ============================================
    // HANDLE CLICK FOR CONNECTION MODE
    // ============================================

    const handleCanvasClick = useCallback((e: React.MouseEvent) => {
        if (!isConnecting || !fabricCanvasRef.current) return;

        // Check if we have a selected network type
        if (!selectedNetworkType || !selectedNetworkVariant) {
            setValidationWarning('Seleccione un tipo de red en el panel lateral antes de conectar.');
            return;
        }

        const canvas = fabricCanvasRef.current;
        const target = getTargetUnderPointer(e);

        if (target) {
            const targetData = (target as FabricObjectWithData).customData;
            const graphNodeId = targetData?.graphNodeId as string;

            if (!graphNodeId) return;

            const pointer = canvas.getScenePoint(e.nativeEvent);
            const type = selectedNetworkTypeRef.current || 'mt-13';
            const variant = selectedNetworkVariantRef.current || 'aerial';
            const style = getNetworkStyle(type as any, variant as any);

            if (!connectionStart) {
                // --- FIRST CLICK: Set connection start ---
                setConnectionStart({
                    element: target,
                    x: pointer.x,
                    y: pointer.y,
                    graphNodeId,
                });
                setValidationWarning(null);

                // Create ghost line with the correct network style
                const center = target.getCenterPoint();
                tempLineRef.current = new fabric.Line([center.x, center.y, pointer.x, pointer.y], {
                    stroke: style?.color || getActiveLayerColor(),
                    strokeWidth: style?.strokeWidth || 3,
                    selectable: false,
                    evented: false,
                    strokeDashArray: style?.dashArray ? [...style.dashArray] : [5, 5],
                    opacity: 0.6,
                } as any);
                canvas.add(tempLineRef.current);
                canvas.requestRenderAll();
            } else {
                // --- SECOND CLICK: Complete connection ---
                const result = validateConnection(connectionStart.graphNodeId, graphNodeId);

                if (!result.valid) {
                    // Show validation error
                    setValidationWarning(result.reason || 'Conexión no válida.');
                    return;
                }

                // Show warning if any (but allow connection)
                if (result.warning) {
                    setValidationWarning(result.warning);
                }
                const startCenter = connectionStart.element.getCenterPoint();
                const endCenter = target.getCenterPoint();
                const type = selectedNetworkTypeRef.current || 'mt-13';
                const variant = selectedNetworkVariantRef.current || 'aerial';
                const style = getNetworkStyle(type as any, variant as any);
                // Create permanent connection line with style dictionary
                const edgeId = generateElementId();
                const connectionLine = new fabric.Line(
                    [startCenter.x, startCenter.y, endCenter.x, endCenter.y],
                    {
                        stroke: style?.color || getActiveLayerColor(),
                        strokeWidth: style?.strokeWidth || 3,
                        strokeDashArray: style?.dashArray ? [...style.dashArray] : undefined,
                        selectable: true,
                        hasControls: false,
                        hasBorders: true,
                        lockMovementX: true,
                        lockMovementY: true,
                    } as any
                );

                (connectionLine as unknown as FabricObjectWithData).customData = {
                    id: edgeId,
                    type: 'connection',
                    graphEdgeId: edgeId,
                    sourceNodeId: connectionStart.graphNodeId,
                    targetNodeId: graphNodeId,
                    networkType: selectedNetworkType,
                    variant: selectedNetworkVariant,
                };

                // Remove temp line and add permanent
                if (tempLineRef.current) {
                    canvas.remove(tempLineRef.current);
                    tempLineRef.current = null;
                }
                canvas.add(connectionLine);
                canvas.sendObjectToBack(connectionLine);
                canvas.requestRenderAll();

                // Register graph edge
                const edge: GraphEdge = {
                    id: edgeId,
                    sourceNodeId: connectionStart.graphNodeId,
                    targetNodeId: graphNodeId,
                    networkType: selectedNetworkType,
                    variant: selectedNetworkVariant,
                    fabricObjectId: edgeId,
                    length: calculateDistance(startCenter.x, startCenter.y, endCenter.x, endCenter.y),
                    layerId: activeLayerId,
                    createdAt: new Date().toISOString(),
                };
                addGraphEdge(edge);
                pushHistory();

                // Continuous mode: set current target as new start point
                setConnectionStart({
                    element: target,
                    x: endCenter.x,
                    y: endCenter.y,
                    graphNodeId,
                });

                // Create new ghost line from the new start
                tempLineRef.current = new fabric.Line([endCenter.x, endCenter.y, pointer.x, pointer.y], {
                    stroke: style?.color || getActiveLayerColor(),
                    strokeWidth: style?.strokeWidth || 3,
                    selectable: false,
                    evented: false,
                    strokeDashArray: style?.dashArray ? [...style.dashArray] : [5, 5],
                    opacity: 0.6,
                } as any);
                canvas.add(tempLineRef.current);
                canvas.requestRenderAll();
            }
        }
    }, [isConnecting, connectionStart, selectedNetworkType, selectedNetworkVariant, activeLayerId, layers, pushHistory, validateConnection, addGraphEdge, getTargetUnderPointer]);

    // Update temp line position while connecting
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isConnecting || !connectionStart || !tempLineRef.current || !fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;
        const pointer = canvas.getScenePoint(e.nativeEvent);

        tempLineRef.current.set({ x2: pointer.x, y2: pointer.y });
        canvas.requestRenderAll();
    }, [isConnecting, connectionStart]);

    // Use refs for handlers to avoid stale closures in canvas events
    const handleCanvasClickRef = useRef(handleCanvasClick);
    const handleMouseMoveRef = useRef(handleMouseMove);
    useEffect(() => {
        handleCanvasClickRef.current = handleCanvasClick;
        handleMouseMoveRef.current = handleMouseMove;
    }, [handleCanvasClick, handleMouseMove]);

    // ============================================
    // NETWORK SELECTION INDICATOR
    // ============================================

    const networkStyleInfo = getNetworkStyle(selectedNetworkType || 'mt-13', selectedNetworkVariant || 'aerial');

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
        >
            <canvas ref={canvasRef} />

            {/* Tooltip */}
            {tooltipRef.visible && (
                <div
                    className="fixed pointer-events-none z-[1000] bg-zinc-900/90 text-white text-xs px-2.5 py-1.5 rounded-md shadow-xl border border-white/10 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-75"
                    style={{
                        left: tooltipRef.x + 15,
                        top: tooltipRef.y + 15
                    }}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        <span className="font-semibold whitespace-nowrap tracking-tight">{tooltipRef.content}</span>
                    </div>
                </div>
            )}

            {/* Loading overlay */}
            {isLoadingCanvas && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium text-muted-foreground">Cargando lienzo...</span>
                    </div>
                </div>
            )}

            {/* Mode indicators / Connection mode helper */}
            {(isConnecting || toolState.activeTool === 'pencil') && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[100] pointer-events-none">
                    {toolState.activeTool === 'pencil' ? (
                        <div className="bg-amber-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-top-4">
                            ✏️ Modo Dibujo Libre Activo
                        </div>
                    ) : selectedNetworkType ? (
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg text-sm text-white font-medium animate-in slide-in-from-top-4"
                            style={{ backgroundColor: networkStyleInfo?.color || '#333' }}
                        >
                            <span
                                className="w-6 h-0.5 rounded"
                                style={{
                                    backgroundColor: '#fff',
                                    borderBottom: networkStyleInfo?.dashArray ? '2px dashed #fff' : '2px solid #fff',
                                }}
                            />
                            {networkStyleInfo?.label || 'Conectando...'}
                        </div>
                    ) : (
                        <div className="bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
                            ⚠️ Seleccione un tipo de red en el panel lateral
                        </div>
                    )}

                    {isConnecting && (
                        <div className="bg-slate-800/90 backdrop-blur-md text-white px-4 py-2 rounded-lg shadow-lg text-sm pointer-events-auto flex items-center gap-3 border border-white/10">
                            <span>
                                {connectionStart
                                    ? '🎯 Clic en el elemento destino'
                                    : '🔌 Clic en el origen para conectar'}
                            </span>
                            <button
                                onClick={() => setActiveTool('select')}
                                className="bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded text-xs font-bold transition-colors uppercase tracking-wider"
                            >
                                Salir (Esc)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Validation warning */}
            {validationWarning && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-lg shadow-lg text-sm z-[100] animate-in fade-in max-w-md text-center">
                    ⚠️ {validationWarning}
                    <button
                        onClick={() => setValidationWarning(null)}
                        className="ml-2 text-amber-600 hover:text-amber-800 text-xs font-bold"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Zoom indicator */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-sm border text-sm font-medium">
                🔍 {toolState.zoomLevel}%
            </div>

            {/* Graph stats indicator */}
            <div className="absolute bottom-12 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-sm border text-xs text-muted-foreground">
                📊 {graphNodes.size} nodos · {graphEdges.size} aristas
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

function createPoleSymbol(data: Partial<PoleElement>, x: number, y: number, layerColor: string, elementId: string): fabric.FabricObject {
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
        selectable: true,
        evented: true,
    } as any);

    (group as any).id = elementId;
    (group as any).name = data.name || elementId;

    (group as FabricObjectWithData).customData = {
        id: elementId,
        type: 'pole',
        graphNodeId: elementId,
        ...data,
    };

    return group;
}

function createBoxSymbol(data: Partial<BoxElement>, x: number, y: number, elementId: string): fabric.FabricObject {
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
        subTargetCheck: true,
        selectable: true,
        evented: true,
    } as any);

    (group as any).id = elementId;
    (group as any).name = data.name || elementId;

    (group as FabricObjectWithData).customData = {
        id: elementId,
        type: 'box',
        graphNodeId: elementId,
        ...data,
    };

    return group;
}

function createDuctSymbol(data: Record<string, unknown>, x: number, y: number, elementId: string): fabric.FabricObject {
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

    // Connection points for duct
    const anchors: fabric.Circle[] = [];
    const positions = [
        { x: -40, y: 0 }, // Left
        { x: 40, y: 0 },  // Right
        { x: 0, y: -10 }, // Top
        { x: 0, y: 10 },  // Bottom
    ];

    positions.forEach(pos => {
        anchors.push(new fabric.Circle({
            radius: 3,
            fill: '#22C55E',
            stroke: '#166534',
            strokeWidth: 1,
            originX: 'center',
            originY: 'center',
            left: pos.x,
            top: pos.y,
        }));
    });

    const group = new fabric.Group([rect, ...pipes, ...anchors, label], {
        left: x,
        top: y,
        originX: 'center',
        originY: 'center',
        hasControls: true,
        hasBorders: true,
        subTargetCheck: true,
        selectable: true,
        evented: true,
    } as any);

    (group as any).id = elementId;
    (group as any).name = (data.name as string) || elementId;

    (group as FabricObjectWithData).customData = {
        id: elementId,
        type: 'duct',
        graphNodeId: elementId,
        ...data,
    };

    return group;
}
