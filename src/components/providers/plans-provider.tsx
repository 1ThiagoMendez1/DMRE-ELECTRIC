import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef, useMemo } from 'react';
import { saveCanvasState, getProyectoPlano, createPlanVersion } from '@/app/dashboard/sistema/plans/actions';
import { jsPDF } from 'jspdf';
import {
    Plan,
    PlanElement,
    PoleElement,
    NetworkLine,
    DuctElement,
    BoxElement,
    CustomElement,
    Layer,
    DEFAULT_LAYERS,
    ToolType,
    ToolState,
    CanvasState,
    NetworkType,
    NetworkVariant,
} from '@/types/plans';
import {
    GraphNode,
    GraphEdge,
    NodeMetadata,
    getNodeSupportedTension,
    getEdgesForNode,
    calculateDistance,
    serializeGraphState,
    deserializeGraphState,
    SerializedGraphState,
} from '@/types/graph-types';
import { getNetworkStyle } from '@/lib/plans/network-styles';
import { validarConexion, getValidTargets, ValidationResult } from '@/lib/plans/connection-validator';

// Debounce utility
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T & { cancel: () => void } {
    let timeoutId: NodeJS.Timeout | null = null;
    const debounced = ((...args: unknown[]) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    }) as T & { cancel: () => void };
    debounced.cancel = () => {
        if (timeoutId) clearTimeout(timeoutId);
    };
    return debounced;
}

// ============================================
// CONTEXT TYPE
// ============================================

interface PlansContextType {
    // Current plan
    currentPlan: Plan | null;
    setCurrentPlan: (plan: Plan | null) => void;

    // Layers
    layers: Layer[];
    setLayers: (layers: Layer[]) => void;
    activeLayerId: string;
    setActiveLayerId: (id: string) => void;
    toggleLayerVisibility: (layerId: string) => void;
    toggleLayerLock: (layerId: string) => void;

    // Elements (legacy — kept for PropertiesPanel compat)
    elements: (PoleElement | NetworkLine | DuctElement | BoxElement | CustomElement)[];
    addElement: (element: PoleElement | NetworkLine | DuctElement | BoxElement | CustomElement) => void;
    updateElement: (id: string, updates: Partial<PlanElement>) => void;
    deleteElement: (id: string) => void;
    selectedElementIds: string[];
    setSelectedElementIds: (ids: string[]) => void;

    // Tool state
    toolState: ToolState;
    setActiveTool: (tool: ToolType) => void;
    toggleGrid: () => void;
    toggleSnapToGrid: () => void;
    setZoomLevel: (zoom: number) => void;
    setGridSize: (size: number) => void;

    // Canvas state
    canvasState: CanvasState;
    setCanvasState: (state: Partial<CanvasState>) => void;

    // Undo/Redo
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;

    // Save/Load
    savePlan: (versionName?: string) => Promise<void>;
    loadPlan: (id: string) => Promise<void>;
    exportPlan: (format: 'pdf' | 'svg' | 'jpg' | 'png') => Promise<void>;

    // Canvas reference and history
    fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
    pushHistory: () => void;

    // Canvas state management
    canvasReady: boolean;
    setCanvasReady: (ready: boolean) => void;
    isLoadingCanvas: boolean;
    isSaving: boolean;
    hasUnsavedChanges: boolean;

    // ============================================
    // GRAPH STATE (NEW)
    // ============================================
    graphNodes: Map<string, GraphNode>;
    graphEdges: Map<string, GraphEdge>;
    graphNodesToEdges: Map<string, Set<string>>; // Added indexing O(1)

    // Graph CRUD
    addGraphNode: (node: GraphNode) => void;
    removeGraphNode: (nodeId: string) => void;
    moveGraphNode: (nodeId: string, x: number, y: number) => void;
    addGraphEdge: (edge: GraphEdge) => void;
    removeGraphEdge: (edgeId: string) => void;
    getNodeByFabricId: (fabricObjectId: string) => GraphNode | undefined;

    // Selected network for connection mode
    selectedNetworkType: NetworkType | null;
    selectedNetworkVariant: NetworkVariant | null;
    setSelectedNetwork: (type: NetworkType | null, variant: NetworkVariant | null) => void;

    // Validation
    validateConnection: (sourceNodeId: string, targetNodeId: string) => ValidationResult;
    getValidConnectionTargets: (sourceNodeId: string) => Set<string>;
}

const PlansContext = createContext<PlansContextType | undefined>(undefined);

// ============================================
// PROVIDER COMPONENT
// ============================================

export function PlansProvider({ children }: { children: ReactNode }) {
    // Plan state
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);
    const [activeLayerId, setActiveLayerId] = useState<string>(DEFAULT_LAYERS[1].id); // Default to projected
    const [elements, setElements] = useState<(PoleElement | NetworkLine | DuctElement | BoxElement | CustomElement)[]>([]);
    const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);

    // Tool state
    const [toolState, setToolState] = useState<ToolState>({
        activeTool: 'select',
        gridEnabled: true,
        snapToGrid: true,
        gridSize: 20,
        zoomLevel: 100,
        measurementScale: '1:100',
    });

    // Canvas state
    const [canvasState, setCanvasStateInternal] = useState<CanvasState>({
        zoom: 1,
        panX: 0,
        panY: 0,
        selectedElementIds: [],
        clipboard: undefined,
    });

    // History for undo/redo - stores canvas object snapshots (not strings for performance)
    const [history, setHistory] = useState<any[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const isRestoringHistory = useRef(false);

    // Canvas state management
    const [canvasReady, setCanvasReady] = useState(false);
    const [isLoadingCanvas, setIsLoadingCanvas] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Fabric.js canvas reference
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

    // ============================================
    // GRAPH STATE (NEW)
    // ============================================
    const [graphNodes, setGraphNodes] = useState<Map<string, GraphNode>>(new Map());
    const [graphEdges, setGraphEdges] = useState<Map<string, GraphEdge>>(new Map());
    const [graphNodesToEdges, setGraphNodesToEdges] = useState<Map<string, Set<string>>>(new Map());
    const [selectedNetworkType, setSelectedNetworkType] = useState<NetworkType | null>(null);
    const [selectedNetworkVariant, setSelectedNetworkVariant] = useState<NetworkVariant | null>(null);

    // Keep history index in a ref to keep pushHistory stable
    const historyIndexRef = useRef(historyIndex);
    useEffect(() => {
        historyIndexRef.current = historyIndex;
    }, [historyIndex]);

    // Debounced history push (500ms delay to batch rapid changes)
    const debouncedPushHistory = useMemo(() => debounce(() => {
        if (!fabricCanvasRef.current || isRestoringHistory.current) return;

        // Skip stringification for history storage to gain speed
        const canvasObj = fabricCanvasRef.current.toJSON(['customData']);
        setHistory(prev => {
            const newHistory = [...prev.slice(0, historyIndexRef.current + 1), canvasObj];
            if (newHistory.length > 30) { // Reduced from 50 to 30 for memory safety
                newHistory.shift();
                return newHistory;
            }
            return newHistory;
        });
        setHistoryIndex(i => Math.min(i + 1, 29));
        setHasUnsavedChanges(true);
    }, 500), []);

    // Push current canvas state to history (debounced)
    const pushHistory = useCallback(() => {
        debouncedPushHistory();
    }, [debouncedPushHistory]);

    // ============================================
    // LAYER ACTIONS
    // ============================================

    const toggleLayerVisibility = useCallback((layerId: string) => {
        setLayers(prev => prev.map(layer =>
            layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
        ));
    }, []);

    const toggleLayerLock = useCallback((layerId: string) => {
        setLayers(prev => prev.map(layer =>
            layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
        ));
    }, []);

    // ============================================
    // ELEMENT ACTIONS (legacy — kept for compat)
    // ============================================

    const addElement = useCallback((element: PoleElement | NetworkLine | DuctElement | BoxElement | CustomElement) => {
        const newElement = {
            ...element,
            layerId: activeLayerId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        } as PoleElement | NetworkLine | DuctElement | BoxElement | CustomElement;

        setElements(prev => {
            const newElements = [...prev, newElement] as (PoleElement | NetworkLine | DuctElement | BoxElement | CustomElement)[];
            return newElements;
        });
    }, [activeLayerId]);

    const updateElement = useCallback((id: string, updates: Partial<PlanElement>) => {
        setElements(prev => {
            const newElements = prev.map(el =>
                el.id === id ? { ...el, ...updates, updatedAt: new Date().toISOString() } as typeof el : el
            );
            return newElements;
        });
    }, []);

    const deleteElement = useCallback((id: string) => {
        setElements(prev => {
            const newElements = prev.filter(el => el.id !== id);
            return newElements;
        });
        setSelectedElementIds(prev => prev.filter(sid => sid !== id));
    }, []);

    // ============================================
    // GRAPH CRUD ACTIONS (NEW)
    // ============================================

    const addGraphNode = useCallback((node: GraphNode) => {
        setGraphNodes(prev => {
            const next = new Map(prev);
            next.set(node.id, node);
            return next;
        });
        setHasUnsavedChanges(true);
    }, []);

    const removeGraphNode = useCallback((nodeId: string) => {
        setGraphNodes(prev => {
            const next = new Map(prev);
            next.delete(nodeId);
            return next;
        });

        // Also remove all connected edges
        setGraphEdges(prev => {
            const next = new Map(prev);
            const edgesToRemove = getEdgesForNode(nodeId, prev);
            edgesToRemove.forEach(edge => next.delete(edge.id));
            return next;
        });

        // Update indexing
        setGraphNodesToEdges(prev => {
            const next = new Map(prev);
            next.delete(nodeId);
            return next;
        });

        setHasUnsavedChanges(true);
    }, []);

    const moveGraphNode = useCallback((nodeId: string, x: number, y: number) => {
        setGraphNodes(prev => {
            const node = prev.get(nodeId);
            if (!node) return prev;
            const next = new Map(prev);
            next.set(nodeId, { ...node, x, y });
            return next;
        });
        // Update edge lengths
        setGraphEdges(prev => {
            const next = new Map(prev);
            let changed = false;
            prev.forEach((edge, edgeId) => {
                if (edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId) {
                    // Recalculate length — we need both endpoint positions
                    // The positions are updated reactively by the canvas via Fabric.js
                    changed = true;
                }
            });
            // Length recalculation happens in the canvas component where we have Fabric coords
            return changed ? next : prev;
        });
    }, []);

    const addGraphEdge = useCallback((edge: GraphEdge) => {
        setGraphEdges(prev => {
            const next = new Map(prev);
            next.set(edge.id, edge);
            return next;
        });

        // Update indexing O(1)
        setGraphNodesToEdges(prev => {
            const next = new Map(prev);
            const sourceSet = new Set(next.get(edge.sourceNodeId) || []);
            const targetSet = new Set(next.get(edge.targetNodeId) || []);
            sourceSet.add(edge.id);
            targetSet.add(edge.id);
            next.set(edge.sourceNodeId, sourceSet);
            next.set(edge.targetNodeId, targetSet);
            return next;
        });

        setHasUnsavedChanges(true);
    }, []);

    const removeGraphEdge = useCallback((edgeId: string) => {
        setGraphEdges(prev => {
            const edge = prev.get(edgeId);
            if (!edge) return prev;

            // Update indexing O(1)
            setGraphNodesToEdges(oldIdx => {
                const nextIdx = new Map(oldIdx);
                const sourceSet = new Set(nextIdx.get(edge.sourceNodeId) || []);
                const targetSet = new Set(nextIdx.get(edge.targetNodeId) || []);
                sourceSet.delete(edgeId);
                targetSet.delete(edgeId);
                nextIdx.set(edge.sourceNodeId, sourceSet);
                nextIdx.set(edge.targetNodeId, targetSet);
                return nextIdx;
            });

            const next = new Map(prev);
            next.delete(edgeId);
            return next;
        });
        setHasUnsavedChanges(true);
    }, []);

    const getNodeByFabricId = useCallback((fabricObjectId: string): GraphNode | undefined => {
        for (const node of graphNodes.values()) {
            if (node.fabricObjectId === fabricObjectId) return node;
        }
        return undefined;
    }, [graphNodes]);

    // ============================================
    // SELECTED NETWORK
    // ============================================

    const setSelectedNetwork = useCallback((type: NetworkType | null, variant: NetworkVariant | null) => {
        setSelectedNetworkType(type);
        setSelectedNetworkVariant(variant);
    }, []);

    // ============================================
    // VALIDATION
    // ============================================

    const validateConnection = useCallback((sourceNodeId: string, targetNodeId: string): ValidationResult => {
        const sourceNode = graphNodes.get(sourceNodeId);
        const targetNode = graphNodes.get(targetNodeId);

        if (!sourceNode || !targetNode) {
            return { valid: false, reason: 'Nodo no encontrado en el grafo.' };
        }

        if (!selectedNetworkType || !selectedNetworkVariant) {
            return { valid: false, reason: 'Seleccione un tipo de red antes de conectar.' };
        }

        return validarConexion(sourceNode, targetNode, selectedNetworkType, selectedNetworkVariant, graphEdges);
    }, [graphNodes, graphEdges, selectedNetworkType, selectedNetworkVariant]);

    const getValidConnectionTargets = useCallback((sourceNodeId: string): Set<string> => {
        if (!selectedNetworkType || !selectedNetworkVariant) return new Set();
        return getValidTargets(sourceNodeId, selectedNetworkType, selectedNetworkVariant, graphNodes, graphEdges);
    }, [graphNodes, graphEdges, selectedNetworkType, selectedNetworkVariant]);

    // ============================================
    // TOOL ACTIONS
    // ============================================

    const setActiveTool = useCallback((tool: ToolType) => {
        setToolState(prev => ({ ...prev, activeTool: tool }));
    }, []);

    const toggleGrid = useCallback(() => {
        setToolState(prev => ({ ...prev, gridEnabled: !prev.gridEnabled }));
    }, []);

    const toggleSnapToGrid = useCallback(() => {
        setToolState(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }));
    }, []);

    const setZoomLevel = useCallback((zoom: number) => {
        setToolState(prev => ({ ...prev, zoomLevel: Math.min(400, Math.max(10, zoom)) }));
    }, []);

    const setGridSize = useCallback((size: number) => {
        setToolState(prev => ({ ...prev, gridSize: size }));
    }, []);

    // ============================================
    // CANVAS STATE
    // ============================================

    const setCanvasState = useCallback((state: Partial<CanvasState>) => {
        setCanvasStateInternal(prev => ({ ...prev, ...state }));
    }, []);

    // ============================================
    // UNDO/REDO
    // ============================================

    const undo = useCallback(async () => {
        if (historyIndex >= 0 && fabricCanvasRef.current) {
            isRestoringHistory.current = true;
            try {
                if (historyIndex > 0) {
                    const prevState = history[historyIndex - 1];
                    // No need to JSON.parse anymore
                    fabricCanvasRef.current.loadFromJSON(prevState, () => {
                        fabricCanvasRef.current?.renderAll();
                        setHistoryIndex(historyIndex - 1);
                        isRestoringHistory.current = false;
                    });
                } else {
                    // Return to empty state
                    fabricCanvasRef.current.clear();
                    fabricCanvasRef.current.renderAll();
                    setHistoryIndex(-1);
                }
            } catch (err) {
                console.error('Error during undo:', err);
            } finally {
                isRestoringHistory.current = false;
            }
        }
    }, [history, historyIndex]);

    const redo = useCallback(async () => {
        if (historyIndex < history.length - 1 && fabricCanvasRef.current) {
            isRestoringHistory.current = true;
            try {
                const nextState = history[historyIndex + 1];
                fabricCanvasRef.current.loadFromJSON(nextState, () => {
                    fabricCanvasRef.current?.renderAll();
                    setHistoryIndex(historyIndex + 1);
                    isRestoringHistory.current = false;
                });
            } catch (err) {
                console.error('Error during redo:', err);
            } finally {
                isRestoringHistory.current = false;
            }
        }
    }, [history, historyIndex]);

    const canUndo = useMemo(() => historyIndex >= 0, [historyIndex]);
    const canRedo = useMemo(() => historyIndex < history.length - 1, [historyIndex, history.length]);

    // ============================================
    // SAVE/LOAD/EXPORT
    // ============================================

    const savePlan = useCallback(async (versionName?: string) => {
        if (!currentPlan?.id || !fabricCanvasRef.current) return;

        setIsSaving(true);
        try {
            const canvasJson = fabricCanvasRef.current.toJSON([
                'id',
                'name',
                'customData',
                'subTargetCheck',
                'selectable',
                'evented',
                'hasControls',
                'hasBorders',
                'lockMovementX',
                'lockMovementY'
            ]);
            // Include graph state in the saved data
            const graphState = serializeGraphState(graphNodes, graphEdges);
            const saveData = {
                ...canvasJson,
                _graphState: graphState,
            };

            const { error: saveError } = await saveCanvasState(currentPlan.id, saveData);

            if (saveError) {
                console.error('Error saving plan:', saveError);
            } else {
                console.log('Plan saved successfully');
                setHasUnsavedChanges(false);

                // --- AUTOMATIC VERSIONING ---
                // Name based on manual/auto or specific name provided
                const name = versionName || `Estado Guardado - ${new Date().toLocaleTimeString()}`;
                await createPlanVersion(currentPlan.id, name, 'Copia de seguridad automática al guardar', saveData);
            }
        } finally {
            setIsSaving(false);
        }
    }, [currentPlan?.id, graphNodes, graphEdges]);

    // Auto-save every 30 seconds if there are unsaved changes
    useEffect(() => {
        if (!currentPlan?.id || !hasUnsavedChanges || !canvasReady) return;

        const autoSaveTimer = setTimeout(() => {
            savePlan();
        }, 30000); // 30 seconds

        return () => clearTimeout(autoSaveTimer);
    }, [currentPlan?.id, hasUnsavedChanges, canvasReady, savePlan]);

    const loadPlan = useCallback(async (id: string) => {
        setIsLoadingCanvas(true);
        const { data, error } = await getProyectoPlano(id);

        if (error || !data) {
            console.error('Error loading plan:', error);
            setIsLoadingCanvas(false);
            return;
        }

        // Extract graph state from canvas_state if present
        let canvasStateStr = undefined;
        if (data.canvas_state) {
            const stateObj = typeof data.canvas_state === 'string'
                ? JSON.parse(data.canvas_state)
                : data.canvas_state;

            // Extract and restore graph state
            if (stateObj._graphState) {
                const { nodes, edges } = deserializeGraphState(stateObj._graphState as SerializedGraphState);
                setGraphNodes(nodes);
                setGraphEdges(edges);
                // Remove _graphState from the object before passing to Fabric
                const { _graphState, ...fabricState } = stateObj;
                canvasStateStr = JSON.stringify(fabricState);
            } else {
                canvasStateStr = typeof data.canvas_state === 'string'
                    ? data.canvas_state
                    : JSON.stringify(data.canvas_state);
                // No graph state — will be reconstructed in useEffect
            }
        }

        setCurrentPlan({
            id: data.id,
            name: data.name,
            description: data.description || '',
            scale: data.scale,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            elements: [],
            layers: [],
            canvasState: canvasStateStr,
        });
    }, []);

    // Restore canvas when currentPlan changes, canvasReady is true
    useEffect(() => {
        if (!canvasReady || !fabricCanvasRef.current || !currentPlan) return;

        const canvas = fabricCanvasRef.current;

        if (currentPlan.canvasState) {
            setIsLoadingCanvas(true);
            isRestoringHistory.current = true;

            // Safety timeout to avoid getting stuck in loading state (5 seconds)
            const safetyTimeout = setTimeout(() => {
                if (isRestoringHistory.current) {
                    console.warn('Canvas loading timed out, unlocking UI');
                    setIsLoadingCanvas(false);
                    isRestoringHistory.current = false;
                }
            }, 5000);

            try {
                const canvasData = typeof currentPlan.canvasState === 'string'
                    ? JSON.parse(currentPlan.canvasState)
                    : currentPlan.canvasState;

                canvas.loadFromJSON(canvasData, () => {
                    try {
                        // --- OPTIMIZED RECONSTRUCTION ---
                        const newNodes = new Map<string, GraphNode>();
                        const newEdges = new Map<string, GraphEdge>();
                        const newIdx = new Map<string, Set<string>>();

                        canvas.getObjects().forEach(obj => {
                            const objId = (obj as any).id || (obj as any).customData?.id;
                            const data = (obj as any).customData || {};

                            if (!objId && !data.type) return;

                            // FORCED INTERACTIVITY FOR ALL OBJECTS
                            (obj as any).subTargetCheck = true;
                            (obj as any).selectable = true;
                            (obj as any).evented = true;

                            if (data.type === 'pole' || data.type === 'box' || data.type === 'duct' || objId?.startsWith('pole-') || objId?.startsWith('box-')) {
                                const id = data.graphNodeId || objId || generateElementId();
                                // If it's a known node, re-attach it to the graph
                                const center = obj.getCenterPoint();
                                const node: GraphNode = {
                                    id,
                                    elementType: data.type as any,
                                    fabricObjectId: data.id || id,
                                    x: center.x,
                                    y: center.y,
                                    metadata: { ...data, layerId: data.layerId || activeLayerId },
                                    supportedTension: getNodeSupportedTension(data.type, data),
                                    createdAt: new Date().toISOString(),
                                };
                                newNodes.set(id, node);
                                (obj as any).customData = { ...data, graphNodeId: id };
                            } else if (data.type === 'connection' && data.startId && data.endId) {
                                const id = data.graphEdgeId || data.id || generateElementId();
                                const line = obj as any;
                                const edge: GraphEdge = {
                                    id,
                                    sourceNodeId: data.startId,
                                    targetNodeId: data.endId,
                                    networkType: data.networkType || 'bt',
                                    variant: data.variant || 'aerial',
                                    fabricObjectId: data.id || id,
                                    length: calculateDistance(line.x1!, line.y1!, line.x2!, line.y2!),
                                    layerId: data.layerId || activeLayerId,
                                    createdAt: new Date().toISOString(),
                                };
                                newEdges.set(id, edge);

                                // Build Index
                                const sourceSet = newIdx.get(edge.sourceNodeId) || new Set();
                                const targetSet = newIdx.get(edge.targetNodeId) || new Set();
                                sourceSet.add(id);
                                targetSet.add(id);
                                newIdx.set(edge.sourceNodeId, sourceSet);
                                newIdx.set(edge.targetNodeId, targetSet);

                                (obj as any).customData = { ...data, graphEdgeId: id, sourceNodeId: data.startId, targetNodeId: data.endId };
                            }
                        });

                        // Batch update states
                        setGraphNodes(newNodes);
                        setGraphEdges(newEdges);
                        setGraphNodesToEdges(newIdx);

                        canvas.renderAll();
                        setHistory([]);
                        setHistoryIndex(-1);
                        setHasUnsavedChanges(false);
                        setTimeout(() => pushHistory(), 100);
                    } catch (err) {
                        console.error('Error in canvas reconstruction callback:', err);
                    } finally {
                        clearTimeout(safetyTimeout);
                        isRestoringHistory.current = false;
                        setIsLoadingCanvas(false);
                    }
                });
            } catch (e) {
                console.error('Error restoring canvas:', e);
                clearTimeout(safetyTimeout);
                isRestoringHistory.current = false;
                setIsLoadingCanvas(false);
            }
        } else {
            // New project or empty - clear state
            canvas.clear();
            setGraphNodes(new Map());
            setGraphEdges(new Map());
            setIsLoadingCanvas(false);
            setHistory([]);
            setHistoryIndex(-1);
            setHasUnsavedChanges(false);
        }
    }, [currentPlan, canvasReady]);

    const exportPlan = useCallback(async (format: 'pdf' | 'svg' | 'jpg' | 'png') => {
        if (!fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;

        // Save current background and set to white for export
        const originalBg = canvas.backgroundColor;
        canvas.backgroundColor = 'white';
        canvas.renderAll();

        try {
            switch (format) {
                case 'svg':
                    const svg = canvas.toSVG();
                    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
                    downloadBlob(svgBlob, `plan-${currentPlan?.name || 'export'}.svg`);
                    break;

                case 'jpg':
                case 'png':
                    const dataUrl = canvas.toDataURL({
                        format: format,
                        quality: 1,
                        multiplier: 2, // 2x resolution
                    });
                    const link = document.createElement('a');
                    link.download = `plan-${currentPlan?.name || 'export'}.${format}`;
                    link.href = dataUrl;
                    link.click();
                    break;

                case 'pdf':
                    const pdfDataUrl = canvas.toDataURL({
                        format: 'png',
                        quality: 1,
                        multiplier: 2,
                    });

                    const width = canvas.width || 800;
                    const height = canvas.height || 600;

                    const pdf = new jsPDF({
                        orientation: width > height ? 'landscape' : 'portrait',
                        unit: 'px',
                        format: [width * 2, height * 2]
                    });

                    pdf.addImage(pdfDataUrl, 'PNG', 0, 0, width * 2, height * 2);
                    pdf.save(`plan-${currentPlan?.name || 'export'}.pdf`);
                    break;
            }
        } catch (error) {
            console.error('Error exporting plan:', error);
        } finally {
            // Restore original background
            canvas.backgroundColor = originalBg;
            canvas.renderAll();
        }
    }, [currentPlan?.name]);

    // ============================================
    // CONTEXT VALUE
    // ============================================

    const contextValue: PlansContextType = {
        currentPlan,
        setCurrentPlan,
        layers,
        setLayers,
        activeLayerId,
        setActiveLayerId,
        toggleLayerVisibility,
        toggleLayerLock,
        elements,
        addElement,
        updateElement,
        deleteElement,
        selectedElementIds,
        setSelectedElementIds,
        toolState,
        setActiveTool,
        toggleGrid,
        toggleSnapToGrid,
        setZoomLevel,
        setGridSize,
        canvasState,
        setCanvasState,
        undo,
        redo,
        canUndo,
        canRedo,
        savePlan,
        loadPlan,
        exportPlan,
        fabricCanvasRef,
        pushHistory,
        canvasReady,
        setCanvasReady,
        isLoadingCanvas,
        isSaving,
        hasUnsavedChanges,

        // Graph state
        graphNodes,
        graphEdges,
        graphNodesToEdges,
        addGraphNode,
        removeGraphNode,
        moveGraphNode,
        addGraphEdge,
        removeGraphEdge,
        getNodeByFabricId,
        selectedNetworkType,
        selectedNetworkVariant,
        setSelectedNetwork,
        validateConnection,
        getValidConnectionTargets,
    };

    return (
        <PlansContext.Provider value={contextValue}>
            {children}
        </PlansContext.Provider>
    );
}

// ============================================
// HOOK
// ============================================

export function usePlans() {
    const context = useContext(PlansContext);
    if (!context) {
        throw new Error('usePlans must be used within a PlansProvider');
    }
    return context;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

// Generate unique ID
export function generateElementId(): string {
    return `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
