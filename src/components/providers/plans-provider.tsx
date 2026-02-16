import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef, useMemo } from 'react';
import { saveCanvasState, getProyectoPlano } from '@/app/dashboard/sistema/plans/actions';
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
} from '@/types/plans';

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

    // Elements
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
    savePlan: () => Promise<void>;
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

    // History for undo/redo - stores canvas JSON snapshots
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const isRestoringHistory = useRef(false);

    // Canvas state management
    const [canvasReady, setCanvasReady] = useState(false);
    const [isLoadingCanvas, setIsLoadingCanvas] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Fabric.js canvas reference
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

    // Keep history index in a ref to keep pushHistory stable
    const historyIndexRef = useRef(historyIndex);
    useEffect(() => {
        historyIndexRef.current = historyIndex;
    }, [historyIndex]);

    // Debounced history push (300ms delay to batch rapid changes)
    const debouncedPushHistory = useMemo(() => debounce(() => {
        if (!fabricCanvasRef.current || isRestoringHistory.current) return;

        const json = JSON.stringify(fabricCanvasRef.current.toJSON(['customData']));
        setHistory(prev => {
            const newHistory = [...prev.slice(0, historyIndexRef.current + 1), json];
            if (newHistory.length > 50) {
                newHistory.shift();
                return newHistory;
            }
            return newHistory;
        });
        setHistoryIndex(i => Math.min(i + 1, 49));
        setHasUnsavedChanges(true);
    }, 300), []);

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
    // ELEMENT ACTIONS
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
                    // Reverting to callback signature to avoid TS issues with async overloads in some environments
                    fabricCanvasRef.current.loadFromJSON(JSON.parse(prevState), () => {
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
                fabricCanvasRef.current.loadFromJSON(JSON.parse(nextState), () => {
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

    const savePlan = useCallback(async () => {
        if (!currentPlan?.id || !fabricCanvasRef.current) return;

        setIsSaving(true);
        try {
            const canvasJson = fabricCanvasRef.current.toJSON(['customData']);
            const { error } = await saveCanvasState(currentPlan.id, canvasJson);

            if (error) {
                console.error('Error saving plan:', error);
            } else {
                console.log('Plan saved successfully');
                setHasUnsavedChanges(false);
            }
        } finally {
            setIsSaving(false);
        }
    }, [currentPlan?.id]);

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

        setCurrentPlan({
            id: data.id,
            name: data.name,
            description: data.description || '',
            scale: data.scale,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            elements: [],
            layers: [],
            canvasState: data.canvas_state ? JSON.stringify(data.canvas_state) : undefined,
        });
        // Note: isLoadingCanvas will be set to false after canvas restoration completes
    }, []);

    // Restore canvas when currentPlan changes, canvasReady is true, and has canvasState
    useEffect(() => {
        if (!canvasReady || !fabricCanvasRef.current) return;

        if (currentPlan?.canvasState) {
            setIsLoadingCanvas(true);
            isRestoringHistory.current = true;
            try {
                const canvasData = typeof currentPlan.canvasState === 'string'
                    ? JSON.parse(currentPlan.canvasState)
                    : currentPlan.canvasState;
                fabricCanvasRef.current.loadFromJSON(canvasData, () => {
                    fabricCanvasRef.current?.renderAll();
                    isRestoringHistory.current = false;
                    setIsLoadingCanvas(false);
                    // Reset history for new project
                    setHistory([]);
                    setHistoryIndex(-1);
                    setHasUnsavedChanges(false);
                    setTimeout(() => pushHistory(), 100);
                });
            } catch (e) {
                console.error('Error restoring canvas:', e);
                isRestoringHistory.current = false;
                setIsLoadingCanvas(false);
            }
        } else if (currentPlan && !currentPlan.canvasState) {
            // New project without canvas state - just reset
            setIsLoadingCanvas(false);
            setHistory([]);
            setHistoryIndex(-1);
            setHasUnsavedChanges(false);
        }
    }, [currentPlan?.id, currentPlan?.canvasState, canvasReady]); // Removed pushHistory from dependencies to avoid loops

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
