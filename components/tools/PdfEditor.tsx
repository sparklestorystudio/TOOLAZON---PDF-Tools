import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FileUp, ChevronDown, Check, Loader2, Type, Link as LinkIcon, Image as ImageIcon, 
  PenTool, Eraser, Undo, Trash2, RotateCw, RotateCcw, PlusCircle,
  Download, RefreshCw, X, Square, Circle, Minus, Save, Bold, Italic,
  ZoomIn, ZoomOut, Highlighter, MousePointer2, CheckSquare, Move, Copy, Palette, Plus, Hand, Search, ArrowLeft, ArrowRight
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';

// Safely handle pdfjs-dist import
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

// --- TYPES ---

type ToolType = 'cursor' | 'hand' | 'text' | 'link' | 'image' | 'whiteout' | 'annotate-pen' | 'annotate-highlight' | 'shape-rect' | 'shape-circle' | 'shape-line' | 'form-check' | 'form-cross' | 'sign' | 'search';

interface Annotation {
  id: string;
  type: 'text' | 'image' | 'whiteout' | 'path' | 'highlight' | 'link' | 'rect' | 'circle' | 'line' | 'form-check' | 'form-cross';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number; 
  content?: string; 
  url?: string;
  dataUrl?: string; 
  points?: {x: number, y: number}[]; 
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  strokeWidth?: number;
}

interface TextChange {
  id: string; 
  originalText: string;
  newText: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  viewportX?: number; 
  viewportY?: number;
  fontFamily: string;
  transform: number[]; 
  isDeleted?: boolean;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  color?: string;
  textDecoration?: 'none' | 'underline';
  isNew?: boolean; // Flag to trigger auto-edit
}

interface PageState {
  index: number;
  rotation: number;
  scale: number;
  annotations: Annotation[];
  textChanges: Record<string, TextChange>; 
  isInserted?: boolean;
}

interface SearchMatch {
  id: string;
  pageIndex: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

interface PdfTextItem {
    id: string;
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontName: string;
    transform: number[];
}

// --- HELPERS ---

const hexToRgb = (hex?: string) => {
    if (!hex) return rgb(0,0,0);
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
};

// --- SUB-COMPONENTS ---

const FloatingToolbar: React.FC<{ 
    currentStyle: { weight: string, style: string, color: string, size: number, family: string },
    onStyleChange: (key: string, val: any) => void,
    onDelete: () => void,
    onDuplicate: () => void
}> = ({ currentStyle, onStyleChange, onDelete, onDuplicate }) => {
    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div 
            className="absolute bottom-[110%] left-0 z-50 flex items-center gap-1 bg-white rounded-lg shadow-xl border border-blue-200 p-1 min-w-[320px] pointer-events-auto"
            onMouseDown={handleMouseDown} 
        >
            <button 
                onClick={() => onStyleChange('weight', currentStyle.weight === 'bold' ? 'normal' : 'bold')}
                className={`p-1.5 rounded hover:bg-blue-50 text-blue-600 ${currentStyle.weight === 'bold' ? 'bg-blue-100' : ''}`}
                title="Bold"
            >
                <Bold className="w-4 h-4" />
            </button>
            <button 
                onClick={() => onStyleChange('style', currentStyle.style === 'italic' ? 'normal' : 'italic')}
                className={`p-1.5 rounded hover:bg-blue-50 text-blue-600 ${currentStyle.style === 'italic' ? 'bg-blue-100' : ''}`}
                title="Italic"
            >
                <Italic className="w-4 h-4" />
            </button>
            
            <div className="h-4 w-px bg-gray-200 mx-1"></div>

            <div className="flex items-center text-blue-600 hover:bg-blue-50 rounded px-1 cursor-pointer">
                <Type className="w-4 h-4 mr-1" />
                <div className="flex items-center border border-gray-200 rounded mx-1 bg-white">
                    <button 
                        onMouseDown={handleMouseDown}
                        onClick={() => onStyleChange('size', Math.max(4, currentStyle.size - 2))}
                        className="p-1 hover:bg-gray-100 text-gray-600 rounded-l"
                    >
                        <Minus className="w-3 h-3" />
                    </button>
                    <input 
                        type="number" 
                        value={Math.round(currentStyle.size)} 
                        onChange={(e) => onStyleChange('size', Number(e.target.value))}
                        className="w-8 text-xs text-center border-none focus:ring-0 p-0"
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                    <button 
                        onMouseDown={handleMouseDown}
                        onClick={() => onStyleChange('size', Math.min(100, currentStyle.size + 2))}
                        className="p-1 hover:bg-gray-100 text-gray-600 rounded-r"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div className="h-4 w-px bg-gray-200 mx-1"></div>

            <select 
                value={currentStyle.family}
                onChange={(e) => onStyleChange('family', e.target.value)}
                className="text-xs text-blue-600 bg-transparent border-none focus:ring-0 max-w-[100px] cursor-pointer"
                onMouseDown={(e) => e.stopPropagation()} 
            >
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times Roman</option>
                <option value="Courier New">Courier</option>
            </select>

            <div className="h-4 w-px bg-gray-200 mx-1"></div>

            <div className="relative group">
                <button 
                    className="p-1.5 rounded hover:bg-blue-50 text-blue-600 flex items-center"
                >
                    <Palette className="w-4 h-4" />
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>
                <div className="hidden group-hover:grid absolute top-full left-0 bg-white shadow-lg border border-gray-100 p-2 gap-1 grid-cols-4 z-50 w-32">
                    {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'].map(c => (
                        <button 
                            key={c} 
                            className="w-6 h-6 rounded-full border border-gray-200" 
                            style={{ backgroundColor: c }}
                            onClick={() => onStyleChange('color', c)}
                        />
                    ))}
                </div>
            </div>

            <button className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Link">
                <LinkIcon className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-gray-200 mx-1"></div>

            <button className="p-1.5 rounded hover:bg-blue-50 text-blue-600 cursor-move" title="Move">
                <Move className="w-4 h-4" />
            </button>
            <button onClick={onDuplicate} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Duplicate">
                <Copy className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Delete">
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
};

const EditableTextItem: React.FC<{ 
    item: any, 
    text: string, 
    change?: TextChange,
    scale: number,
    onSave: (val: Partial<TextChange>) => void,
    onDuplicate: () => void,
    autoFocus?: boolean
}> = ({ item, text, change, scale, onSave, onDuplicate, autoFocus }) => {
    const [isEditing, setIsEditing] = useState(autoFocus || false);
    const [val, setVal] = useState(text);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setVal(text);
    }, [text]);

    useEffect(() => {
        if (autoFocus) {
            setIsEditing(true);
        }
    }, [autoFocus]);

    const styleState = {
        weight: change?.fontWeight || 'normal',
        style: change?.fontStyle || 'normal',
        color: change?.color || '#000000',
        size: change?.fontSize || item.fontSize, 
        family: change?.fontFamily || item.fontFamily
    };

    const adjustHeight = () => {
        const el = inputRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        }
    };

    useEffect(() => {
        if (isEditing) {
            adjustHeight();
            if (inputRef.current) {
                inputRef.current.focus();
                // inputRef.current.select(); // Don't always select all, maybe just focus
            }
        }
    }, [isEditing, val, styleState.size]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && containerRef.current.contains(event.target as Node)) {
                return;
            }
            if (isEditing) {
                handleBlur();
            }
        };
        if (isEditing) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditing, val, styleState]);

    const handleBlur = () => {
        setIsEditing(false);
        // Clear new flag
        if (change?.isNew) {
            onSave({ isNew: false, newText: val });
        } else if (val !== text) {
            onSave({ newText: val });
        }
    };

    const handleStyleChange = (key: string, value: any) => {
        const updates: any = {};
        if (key === 'weight') updates.fontWeight = value;
        if (key === 'style') updates.fontStyle = value;
        if (key === 'color') updates.color = value;
        if (key === 'size') updates.fontSize = value;
        if (key === 'family') updates.fontFamily = value;
        
        onSave(updates);
    };

    const handleDelete = () => {
        setIsEditing(false);
        onSave({ newText: '' });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') handleBlur();
    };

    const left = (item.viewportX || 0) * scale;
    const top = (item.viewportY || 0) * scale - (styleState.size * scale);

    const cssStyle: React.CSSProperties = {
        position: 'absolute',
        left: left,
        top: top,
        fontSize: `${styleState.size * scale}px`,
        fontFamily: styleState.family === 'Helvetica' ? 'sans-serif' : (styleState.family.includes('Times') ? 'serif' : 'monospace'),
        fontWeight: styleState.weight,
        fontStyle: styleState.style,
        color: styleState.color,
        lineHeight: 1.2,
        transformOrigin: '0 0',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        cursor: 'text',
    };

    if (isEditing) {
        return (
            <div 
                ref={containerRef} 
                style={{ position: 'absolute', left, top, zIndex: 100, pointerEvents: 'auto' }}
                onMouseDown={(e) => e.stopPropagation()} 
            >
                <FloatingToolbar 
                    currentStyle={styleState}
                    onStyleChange={handleStyleChange}
                    onDelete={handleDelete}
                    onDuplicate={onDuplicate}
                />
                <textarea 
                    ref={inputRef}
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ 
                        ...cssStyle, 
                        position: 'static', 
                        background: 'white', 
                        border: '1px solid #3b82f6', 
                        minWidth: Math.max(20, item.width * scale) + 'px',
                        minHeight: item.height * scale + 'px',
                        padding: 0,
                        margin: 0,
                        outline: 'none',
                        overflow: 'hidden',
                        resize: 'none',
                        userSelect: 'text',
                        WebkitUserSelect: 'text'
                    }}
                    className="select-text"
                />
            </div>
        );
    }

    // Always opaque white if it's a managed change, to cover the original PDF text
    const shouldCover = change !== undefined;

    return (
        <div 
            onClick={(e) => { 
                e.stopPropagation(); 
                setIsEditing(true); 
            }}
            className="group absolute pointer-events-auto hover:bg-blue-50 hover:outline hover:outline-1 hover:outline-blue-200 rounded-sm"
            style={{
                ...cssStyle,
                width: 'auto', 
                minWidth: item.width * scale,
                height: 'auto',
                minHeight: item.height * scale,
                backgroundColor: shouldCover ? '#ffffff' : 'transparent',
            }}
            title="Click to edit text"
        >
            <span>
                {text}
            </span>
        </div>
    );
};

const AnnotationItem: React.FC<{ 
    ann: Annotation, 
    isSelected: boolean, 
    onSelect: () => void, 
    scale: number, 
    onUpdate: (updates: Partial<Annotation>) => void 
}> = ({ ann, isSelected, onSelect, scale, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [isEditing]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsEditing(false);
            }
        };
        if (isEditing) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditing]);

    const style: React.CSSProperties = {
        position: 'absolute', 
        left: ann.x * scale, 
        top: ann.y * scale,
        width: (ann.width || 0) * scale, 
        height: (ann.height || 0) * scale,
        transform: `rotate(${ann.rotation || 0}deg)`,
        border: isSelected ? '1px solid #3b82f6' : 'none',
        zIndex: 40
    };

    if (ann.type === 'text') {
        const fontSize = (ann.fontSize || 14) * scale;
        const fontFamily = ann.fontFamily === 'Helvetica' ? 'sans-serif' : (ann.fontFamily?.includes('Times') ? 'serif' : 'monospace');
        
        const styleState = {
            weight: ann.fontWeight || 'normal',
            style: ann.fontStyle || 'normal',
            color: ann.color || '#000000',
            size: ann.fontSize || 14,
            family: ann.fontFamily || 'Helvetica'
        };

        const handleStyleChange = (key: string, value: any) => {
            if (!onUpdate) return;
            const updates: any = {};
            if (key === 'weight') updates.fontWeight = value;
            if (key === 'style') updates.fontStyle = value;
            if (key === 'color') updates.color = value;
            if (key === 'size') updates.fontSize = value;
            if (key === 'family') updates.fontFamily = value;
            onUpdate(updates);
        };

        if (isEditing && onUpdate) {
            return (
                <div 
                    ref={containerRef}
                    style={{ position: 'absolute', left: ann.x * scale, top: ann.y * scale, zIndex: 100, pointerEvents: 'auto' }}
                    onMouseDown={(e) => e.stopPropagation()} 
                >
                    <FloatingToolbar 
                        currentStyle={styleState}
                        onStyleChange={handleStyleChange}
                        onDelete={() => onUpdate({ content: '' })} 
                        onDuplicate={() => {}} 
                    />
                    <textarea 
                        ref={textareaRef}
                        value={ann.content || ''}
                        onChange={(e) => onUpdate({ content: e.target.value })}
                        style={{
                            fontSize: `${fontSize}px`,
                            fontFamily,
                            fontWeight: ann.fontWeight,
                            fontStyle: ann.fontStyle,
                            color: ann.color,
                            background: 'white',
                            border: '1px solid #3b82f6',
                            outline: 'none',
                            padding: 0,
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            overflow: 'hidden',
                            resize: 'none',
                            minWidth: '20px',
                            width: 'max-content'
                        }}
                    />
                </div>
            );
        }

        return (
            <div 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onSelect(); 
                    setIsEditing(true); 
                }} 
                style={{ 
                    ...style, 
                    width: 'auto', 
                    height: 'auto', 
                    fontSize: `${fontSize}px`, 
                    fontFamily, 
                    fontWeight: ann.fontWeight, 
                    fontStyle: ann.fontStyle, 
                    textDecoration: ann.textDecoration, 
                    color: ann.color, 
                    cursor: 'text',
                    whiteSpace: 'pre-wrap'
                }}
                className="hover:border hover:border-blue-200 p-0.5 rounded-sm"
            >
                {ann.content}
            </div>
        );
    }
    if (ann.type === 'image') return <img src={ann.dataUrl} style={style} onClick={(e) => { e.stopPropagation(); onSelect(); }} className="cursor-move" />;
    if (ann.type === 'rect') return <div style={{ ...style, border: `${(ann.strokeWidth || 2) * scale}px solid ${ann.color}` }} onClick={(e) => { e.stopPropagation(); onSelect(); }} />;
    if (ann.type === 'circle') return <div style={{ ...style, borderRadius: '50%', border: `${(ann.strokeWidth || 2) * scale}px solid ${ann.color}` }} onClick={(e) => { e.stopPropagation(); onSelect(); }} />;
    if (ann.type === 'whiteout') return <div style={{ ...style, backgroundColor: 'white', border: '1px solid #eee' }} onClick={(e) => { e.stopPropagation(); onSelect(); }} />;
    if (ann.type === 'link') return <div style={{ ...style, backgroundColor: 'rgba(0,0,255,0.1)', border: '1px dashed blue' }} onClick={(e) => { e.stopPropagation(); onSelect(); }} className="flex items-center justify-center text-[10px] text-blue-600 font-medium">LINK</div>;
    if (ann.type === 'form-check') return <div style={{ ...style, fontSize: 20 * scale }} onClick={(e) => { e.stopPropagation(); onSelect(); }}>✓</div>;
    if (ann.type === 'form-cross') return <div style={{ ...style, fontSize: 20 * scale }} onClick={(e) => { e.stopPropagation(); onSelect(); }}>✕</div>;
    
    if (ann.type === 'path' || ann.type === 'highlight' || ann.type === 'line') {
        if (!ann.points) return null;
        const pathData = `M ${ann.points.map(p => `${p.x * scale} ${p.y * scale}`).join(' L ')}`;
        return (
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
                <path 
                    d={pathData} 
                    stroke={ann.color} 
                    strokeWidth={(ann.strokeWidth || 2) * scale} 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    opacity={ann.type === 'highlight' ? 0.3 : 1
                    }
                    className="pointer-events-auto cursor-pointer hover:opacity-80"
                    onClick={(e) => { e.stopPropagation(); onSelect(); }}
                />
            </svg>
        );
    }

    return null;
};

// --- PDF RENDERER ---

interface PdfPageRendererProps {
  page: PageState;
  index: number;
  file: File | null;
  activeTool: ToolType;
  selectedId: string | null;
  isDrawing: boolean;
  currentPath: {x: number, y: number}[];
  dragStart: {x: number, y: number} | null;
  shapeSettings: { strokeColor: string, strokeWidth: number };
  searchResults: SearchMatch[];
  currentMatchId: string | null;
  onSelect: (id: string) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onEdit: (change: TextChange) => void;
  onDuplicate: (change: TextChange) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
}

const PdfPageRenderer: React.FC<PdfPageRendererProps> = ({
  page, index, file, activeTool, selectedId, isDrawing, currentPath, dragStart, shapeSettings, searchResults, currentMatchId,
  onSelect, onMouseDown, onMouseMove, onMouseUp, onEdit, onDuplicate, onUpdateAnnotation
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);
  const [originalDims, setOriginalDims] = useState<{width: number, height: number} | null>(null);
  const [textItems, setTextItems] = useState<PdfTextItem[]>([]);

  useEffect(() => {
    if (!file || !canvasRef.current) return;

    let isMounted = true;

    const renderPage = async () => {
      try {
        if (page.isInserted) {
            setOriginalDims({ width: 612, height: 792 });
            const viewportWidth = 612 * page.scale;
            const viewportHeight = 792 * page.scale;
            
            if (canvasRef.current) {
                canvasRef.current.width = viewportWidth;
                canvasRef.current.height = viewportHeight;
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
                }
            }
            if (isMounted) setRendered(true);
            return;
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const pdfPage = await pdf.getPage(page.index + 1);

        // Store original unscaled dimensions for layout calculation
        const unscaledViewport = pdfPage.getViewport({ scale: 1, rotation: page.rotation });
        setOriginalDims({ width: unscaledViewport.width, height: unscaledViewport.height });

        // Calculate actual render viewport
        const viewport = pdfPage.getViewport({ scale: page.scale, rotation: page.rotation });
        
        // Double buffering to avoid flicker
        const offscreen = document.createElement('canvas');
        offscreen.width = viewport.width;
        offscreen.height = viewport.height;
        const ctx = offscreen.getContext('2d');
        
        if (!ctx) return;
        
        // Render to offscreen canvas
        await pdfPage.render({
            canvasContext: ctx,
            viewport: viewport,
        }).promise;
        
        // Extract Text for Editing Overlay
        const textContent = await pdfPage.getTextContent();
        const items = textContent.items.map((item: any, i: number) => {
            const tx = item.transform;
            const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
            return {
                id: `original-${page.index}-${i}`,
                str: item.str,
                x: tx[4],
                y: tx[5],
                width: item.width,
                height: fontSize,
                fontName: item.fontName,
                transform: tx
            };
        });
        
        if (!isMounted) return;

        setTextItems(items);

        // Swap contents to visible canvas
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const destCtx = canvas.getContext('2d');
            destCtx?.drawImage(offscreen, 0, 0);
            setRendered(true);
        }
      } catch (error) {
        console.error("Error rendering page", error);
      }
    };

    renderPage();

    return () => { isMounted = false; };
  }, [file, page.index, page.rotation, page.scale, page.isInserted]);

  // Calculate container size using original dimensions to allow immediate CSS scaling
  const width = originalDims ? originalDims.width * page.scale : (612 * page.scale);
  const height = originalDims ? originalDims.height * page.scale : (792 * page.scale);

  // Filter matches for this page
  const pageMatches = searchResults.filter(m => m.pageIndex === index);

  return (
    <div 
      style={{ width, height, position: 'relative' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      className={`cursor-${activeTool === 'hand' ? 'grab' : 'crosshair'}`}
    >
      <canvas 
        ref={canvasRef} 
        className="block pointer-events-none shadow-sm origin-top-left" 
        style={{ width: '100%', height: '100%' }} // Allow CSS to scale existing canvas content during zoom
      />
      
      {/* Clickable Text Overlay Layer */}
      {!page.isInserted && originalDims && textItems.map(item => {
          // If this text is already converted to a TextChange, do not render the overlay
          if (page.textChanges[item.id]) return null;

          const pageHeight = originalDims.height;
          // Calculate screen position
          const fontSize = item.height * page.scale;
          const left = item.x * page.scale;
          // PDF Y is bottom-up. Convert to top-down. 
          // item.y is usually baseline. Bounding box top is approx y + height?
          // Actually PDF.js transform y is usually bottom-left of the glyph bounding box.
          // CSS top = (PageHeight - Y - Height) * scale
          const top = (pageHeight - item.y - item.height) * page.scale;
          const w = item.width * page.scale;

          return (
              <div
                  key={item.id}
                  onClick={(e) => {
                      e.stopPropagation();
                      if (activeTool !== 'cursor' && activeTool !== 'text') return;
                      
                      const change: TextChange = {
                          id: item.id,
                          originalText: item.str,
                          newText: item.str,
                          x: item.x,
                          y: item.y,
                          width: item.width,
                          height: item.height,
                          fontSize: item.height,
                          fontFamily: 'Helvetica',
                          transform: item.transform,
                          viewportX: item.x,
                          viewportY: pageHeight - item.y,
                          isNew: true
                      };
                      onEdit(change);
                  }}
                  style={{
                      position: 'absolute',
                      left,
                      top,
                      width: w,
                      height: fontSize * 1.3, // slightly taller for easier clicking
                      cursor: 'text',
                      zIndex: 10,
                  }}
                  className="hover:bg-blue-200/20 hover:outline hover:outline-1 hover:outline-blue-300"
                  title="Click to edit text"
              />
          );
      })}
      
      {/* Search Highlights */}
      {pageMatches.map(match => (
          <div 
            key={match.id}
            style={{
                position: 'absolute',
                left: match.x * page.scale,
                top: match.y * page.scale,
                width: match.width * page.scale,
                height: match.height * page.scale,
                backgroundColor: currentMatchId === match.id ? 'rgba(255, 165, 0, 0.5)' : 'rgba(255, 255, 0, 0.4)',
                border: currentMatchId === match.id ? '2px solid orange' : 'none',
                zIndex: 30,
                pointerEvents: 'none'
            }}
          />
      ))}

      {Object.values(page.textChanges).map((change: TextChange) => (
         <EditableTextItem 
            key={change.id}
            item={{...change, str: change.originalText}} 
            text={change.newText}
            change={change}
            scale={page.scale}
            onSave={(updates) => onEdit({ ...change, ...updates })}
            onDuplicate={() => onDuplicate(change)}
            autoFocus={change.isNew}
         />
      ))}

      {page.annotations.map(ann => (
        <AnnotationItem 
          key={ann.id}
          ann={ann}
          isSelected={selectedId === ann.id}
          onSelect={() => onSelect(ann.id)}
          scale={page.scale}
          onUpdate={(updates) => onUpdateAnnotation(ann.id, updates)}
        />
      ))}

      {isDrawing && (
         <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 50 }}>
            {(activeTool === 'annotate-pen' || activeTool === 'annotate-highlight' || activeTool === 'sign') && currentPath.length > 1 && (
                <path 
                    d={`M ${currentPath.map(p => `${p.x * page.scale} ${p.y * page.scale}`).join(' L ')}`}
                    stroke={activeTool === 'sign' ? 'black' : (activeTool === 'annotate-highlight' ? 'yellow' : 'blue')}
                    strokeWidth={(activeTool === 'annotate-highlight' ? 12 : 2) * page.scale}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={activeTool === 'annotate-highlight' ? 0.3 : 1}
                />
            )}
            {dragStart && currentPath.length > 0 && (activeTool.startsWith('shape-') || activeTool === 'link') && (
                (() => {
                    const startX = dragStart.x * page.scale;
                    const startY = dragStart.y * page.scale;
                    const endPt = currentPath[currentPath.length-1];
                    const currentX = endPt.x * page.scale;
                    const currentY = endPt.y * page.scale;
                    const x = Math.min(startX, currentX);
                    const y = Math.min(startY, currentY);
                    const w = Math.abs(currentX - startX);
                    const h = Math.abs(currentY - startY);
                    
                    if (activeTool === 'shape-line') {
                         return <line x1={startX} y1={startY} x2={currentX} y2={currentY} stroke={shapeSettings.strokeColor} strokeWidth={shapeSettings.strokeWidth * page.scale} />;
                    } else if (activeTool === 'shape-circle') {
                         return <ellipse cx={x + w/2} cy={y + h/2} rx={w/2} ry={h/2} stroke={shapeSettings.strokeColor} strokeWidth={shapeSettings.strokeWidth * page.scale} fill="none" />;
                    } else if (activeTool === 'shape-rect') {
                         return <rect x={x} y={y} width={w} height={h} stroke={shapeSettings.strokeColor} strokeWidth={shapeSettings.strokeWidth * page.scale} fill="none" />;
                    } else if (activeTool === 'link') {
                         return <rect x={x} y={y} width={w} height={h} stroke="blue" strokeWidth={1} fill="rgba(0,0,255,0.1)" strokeDasharray="4" />;
                    }
                    return null;
                })()
            )}
         </svg>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---

const PdfEditor: React.FC = () => {
  // ... (No changes needed to Main Component logic as it primarily handles state that PdfPageRenderer consumes)
  // Re-exporting the full component structure to ensure file integrity
  const { t } = useLanguage();
  
  // Workflow
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'editor' | 'success'>('upload');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  // Editor State
  const [pages, setPages] = useState<PageState[]>([]);
  const [history, setHistory] = useState<PageState[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeTool, setActiveTool] = useState<ToolType>('cursor');
  
  // Text Tool Settings
  const [textSettings, setTextSettings] = useState({
      fontSize: 14,
      fontFamily: 'Helvetica',
      color: '#000000',
      fontWeight: 'normal' as 'normal' | 'bold',
      fontStyle: 'normal' as 'normal' | 'italic'
  });

  // Shape Tool Settings
  const [shapeSettings, setShapeSettings] = useState({
      strokeColor: '#000000',
      strokeWidth: 2
  });
  
  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);

  // Selection
  const [selectedPageIdx, setSelectedPageIdx] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Status
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Pan State
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  
  // Input Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]); 
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null); 

  // --- HISTORY MANAGEMENT ---

  const updatePages = (newPages: PageState[], addToHistoryStack = true) => {
      setPages(newPages);
      if (addToHistoryStack) {
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newPages)));
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
      }
  };

  const undo = () => {
      if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setPages(JSON.parse(JSON.stringify(history[newIndex])));
          setSelectedId(null);
      }
  };

  // --- SEARCH LOGIC ---

  const performSearch = async () => {
    if (!file || !findText) return;
    setSearchLoading(true);
    setSearchResults([]);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const matches: SearchMatch[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const { width, height } = page.getViewport({ scale: 1 });
        const textContent = await page.getTextContent();
        
        textContent.items.forEach((item: any) => {
          if ('str' in item) {
            const text = item.str;
            const lowerText = text.toLowerCase();
            const lowerFind = findText.toLowerCase();
            let startIndex = 0;
            
            while ((startIndex = lowerText.indexOf(lowerFind, startIndex)) > -1) {
               // Approximate geometry
               // item.transform is [scaleX, skewY, skewX, scaleY, x, y]
               const fontSize = Math.sqrt(item.transform[0]*item.transform[0] + item.transform[1]*item.transform[1]);
               
               // Simple width approximation
               const fullWidth = item.width;
               const charWidth = fullWidth / text.length;
               
               const matchX = item.transform[4] + (startIndex * charWidth);
               const actualMatchWidth = charWidth * findText.length;

               // Bottom-left Y to Top-Left Y conversion
               const pdfY = item.transform[5];
               const appY = height - pdfY - fontSize * 0.8; 
               
               matches.push({
                 id: Math.random().toString(),
                 pageIndex: i - 1, 
                 text: item.str.substr(startIndex, findText.length),
                 x: matchX,
                 y: appY,
                 width: actualMatchWidth,
                 height: fontSize,
                 fontSize: fontSize
               });
               
               startIndex += findText.length;
            }
          }
        });
      }
      
      setSearchResults(matches);
      setCurrentMatchIndex(0);
      if (matches.length > 0) {
        setSelectedPageIdx(matches[0].pageIndex);
        // Ensure visible
        const el = document.getElementById(`page-${matches[0].pageIndex}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  const performReplace = () => {
    if (searchResults.length === 0) return;
    const match = searchResults[currentMatchIndex];
    
    // 1. Add Whiteout
    const whiteoutAnn: Annotation = {
        id: Math.random().toString(),
        type: 'whiteout',
        x: match.x - 2, 
        y: match.y - 2,
        width: match.width + 4,
        height: match.height + 4,
        color: 'white'
    };
    
    // 2. Add New Text
    const textAnn: Annotation = {
        id: Math.random().toString(),
        type: 'text',
        x: match.x,
        y: match.y, 
        content: replaceText,
        fontSize: match.fontSize,
        color: '#000000',
        fontFamily: 'Helvetica'
    };
    
    const newPages = [...pages];
    newPages[match.pageIndex].annotations.push(whiteoutAnn, textAnn);
    updatePages(newPages);
    
    // Remove from results and advance
    const newResults = [...searchResults];
    newResults.splice(currentMatchIndex, 1);
    setSearchResults(newResults);
    if (currentMatchIndex >= newResults.length) {
        setCurrentMatchIndex(Math.max(0, newResults.length - 1));
    }
  };

  const performReplaceAll = () => {
      const newPages = [...pages];
      
      searchResults.forEach(match => {
          const whiteoutAnn: Annotation = {
            id: Math.random().toString(),
            type: 'whiteout',
            x: match.x - 2, 
            y: match.y - 2,
            width: match.width + 4,
            height: match.height + 4,
            color: 'white'
          };
          const textAnn: Annotation = {
            id: Math.random().toString(),
            type: 'text',
            x: match.x,
            y: match.y, 
            content: replaceText,
            fontSize: match.fontSize,
            color: '#000000',
            fontFamily: 'Helvetica'
          };
          newPages[match.pageIndex].annotations.push(whiteoutAnn, textAnn);
      });
      
      updatePages(newPages);
      setSearchResults([]);
      setCurrentMatchIndex(0);
  };

  // --- FILE HANDLING ---

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      await loadPdf(selectedFile);
    }
  };

  const loadPdf = async (file: File) => {
    setLoading(true);
    setStep('editor');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const newPages: PageState[] = [];
      const limit = Math.min(pdf.numPages, 50);
      
      setHistory([]);
      setHistoryIndex(-1);
      
      for (let i = 1; i <= limit; i++) {
        newPages.push({
          index: i - 1,
          rotation: 0,
          scale: 1.5, // Default scale increased
          annotations: [],
          textChanges: {},
        });
      }
      const initialHistory = [JSON.parse(JSON.stringify(newPages))];
      setHistory(initialHistory);
      setHistoryIndex(0);
      setPages(newPages);

    } catch (err) {
      console.error(err);
      alert("Error loading PDF");
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---

  const insertPage = (index: number) => {
      const newPages = [...pages];
      newPages.splice(index, 0, {
          index: -1, 
          rotation: 0,
          scale: 1.5, 
          annotations: [],
          textChanges: {},
          isInserted: true
      });
      updatePages(newPages);
  };

  const rotatePage = (index: number, direction: 'cw' | 'ccw') => {
      const newPages = [...pages];
      const delta = direction === 'cw' ? 90 : -90;
      newPages[index].rotation = (newPages[index].rotation + delta + 360) % 360;
      updatePages(newPages);
  };

  const zoomPage = (index: number, delta: number) => {
      const newPages = [...pages];
      const newScale = Math.max(0.2, Math.min(5.0, newPages[index].scale + delta)); 
      newPages[index].scale = newScale;
      setPages(newPages);
  };

  const deletePage = (index: number) => {
      if (pages.length <= 1) {
          alert("Cannot delete the only page.");
          return;
      }
      const newPages = [...pages];
      newPages.splice(index, 1);
      updatePages(newPages);
  };

  const deleteSelected = () => {
      if (selectedPageIdx === null || !selectedId) return;
      const newPages = [...pages];
      const page = newPages[selectedPageIdx];
      page.annotations = page.annotations.filter(a => a.id !== selectedId);
      updatePages(newPages);
      setSelectedId(null);
  };

  const updateSelectedAnnotation = (updates: Partial<Annotation>) => {
      if (selectedPageIdx === null || !selectedId) return;
      const newPages = [...pages];
      const page = newPages[selectedPageIdx];
      const annIdx = page.annotations.findIndex(a => a.id === selectedId);
      if (annIdx !== -1) {
          page.annotations[annIdx] = { ...page.annotations[annIdx], ...updates };
          updatePages(newPages);
      }
  };

  const getSelectedAnnotation = () => {
      if (selectedPageIdx === null || !selectedId) return null;
      return pages[selectedPageIdx].annotations.find(a => a.id === selectedId);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  const targetPageIdx = selectedPageIdx !== null ? selectedPageIdx : 0;
                  const newAnn: Annotation = {
                      id: Math.random().toString(),
                      type: 'image',
                      x: 50, y: 50, width: 200, height: 150, rotation: 0,
                      dataUrl: event.target.result as string
                  };
                  const newPages = [...pages];
                  newPages[targetPageIdx].annotations.push(newAnn);
                  updatePages(newPages);
                  setSelectedId(newAnn.id);
                  setSelectedPageIdx(targetPageIdx);
                  setActiveTool('cursor'); 
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleGlobalMouseDown = (e: React.MouseEvent) => {
      if (activeTool === 'hand' && scrollContainerRef.current) {
          setIsPanning(true);
          setPanStart({
              x: e.clientX,
              y: e.clientY,
              scrollLeft: scrollContainerRef.current.scrollLeft,
              scrollTop: scrollContainerRef.current.scrollTop
          });
          e.preventDefault();
      }
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
      if (isPanning && scrollContainerRef.current) {
          const dx = e.clientX - panStart.x;
          const dy = e.clientY - panStart.y;
          scrollContainerRef.current.scrollLeft = panStart.scrollLeft - dx;
          scrollContainerRef.current.scrollTop = panStart.scrollTop - dy;
      }
  };

  const handleGlobalMouseUp = () => {
      setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey) {
          e.preventDefault();
          const deltaY = -e.deltaY;
          const sensitivity = 0.002; 
          const zoomChange = deltaY * sensitivity;

          const newPages = pages.map(p => {
              let newScale = p.scale * (1 + zoomChange);
              newScale = Math.max(0.2, Math.min(5.0, newScale));
              return { ...p, scale: newScale };
          });
          setPages(newPages);
      }
  };

  const handleMouseDown = (e: React.MouseEvent, pageIndex: number) => {
      if (activeTool === 'hand') return;

      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const scale = pages[pageIndex].scale;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      
      setSelectedPageIdx(pageIndex);

      if (activeTool === 'cursor') return;

      if (activeTool === 'text') {
           const newAnn: Annotation = {
              id: Math.random().toString(),
              type: 'text',
              x: x, y: y - 8,
              content: 'Type here',
              fontSize: textSettings.fontSize,
              fontFamily: textSettings.fontFamily,
              color: textSettings.color,
              fontWeight: textSettings.fontWeight,
              fontStyle: textSettings.fontStyle
           };
           const newPages = [...pages];
           newPages[pageIndex].annotations.push(newAnn);
           updatePages(newPages);
           setSelectedId(newAnn.id);
           setActiveTool('cursor');
      }
      else if (activeTool === 'whiteout') {
           const newAnn: Annotation = {
               id: Math.random().toString(),
               type: 'whiteout',
               x: x - 50, y: y - 10, width: 100, height: 20,
               color: 'white'
           };
           const newPages = [...pages];
           newPages[pageIndex].annotations.push(newAnn);
           updatePages(newPages);
           setSelectedId(newAnn.id);
           setActiveTool('cursor');
      }
      else if (activeTool === 'link') {
          setDragStart({x, y});
          setIsDrawing(true);
      }
      else if (activeTool === 'annotate-pen' || activeTool === 'annotate-highlight' || activeTool === 'sign') {
          setIsDrawing(true);
          setCurrentPath([{x, y}]);
      }
      else if (activeTool.startsWith('shape-')) {
          setIsDrawing(true);
          setDragStart({x, y});
      }
      else if (activeTool === 'form-check' || activeTool === 'form-cross') {
          const newAnn: Annotation = {
               id: Math.random().toString(),
               type: activeTool,
               x: x - 10, y: y - 10, width: 20, height: 20,
               color: '#000000'
           };
           const newPages = [...pages];
           newPages[pageIndex].annotations.push(newAnn);
           updatePages(newPages);
           setSelectedId(newAnn.id);
           setActiveTool('cursor');
      }
  };

  const handleMouseMove = (e: React.MouseEvent, pageIndex: number) => {
      if (activeTool === 'hand') return;
      if (!isDrawing) return;
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const scale = pages[pageIndex].scale;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      if (activeTool === 'annotate-pen' || activeTool === 'annotate-highlight' || activeTool === 'sign') {
          setCurrentPath(prev => [...prev, {x, y}]);
      } else if (activeTool.startsWith('shape-') || activeTool === 'link') {
          setCurrentPath([{x: dragStart!.x, y: dragStart!.y}, {x, y}]); 
      }
  };

  const handleMouseUp = (pageIndex: number) => {
      if (activeTool === 'hand') return;
      if (!isDrawing) return;
      setIsDrawing(false);

      const newPages = [...pages];

      if ((activeTool === 'annotate-pen' || activeTool === 'annotate-highlight' || activeTool === 'sign') && currentPath.length > 2) {
          const newAnn: Annotation = {
              id: Math.random().toString(),
              type: activeTool === 'annotate-highlight' ? 'highlight' : 'path',
              x: 0, y: 0,
              points: currentPath,
              color: activeTool === 'sign' ? 'black' : (activeTool === 'annotate-highlight' ? 'yellow' : 'blue'),
              strokeWidth: activeTool === 'annotate-highlight' ? 12 : 2
          };
          newPages[pageIndex].annotations.push(newAnn);
          updatePages(newPages);
      }
      else if ((activeTool.startsWith('shape-') || activeTool === 'link') && dragStart && currentPath.length > 0) {
          const endPoint = currentPath[1];
          const x = Math.min(dragStart.x, endPoint.x);
          const y = Math.min(dragStart.y, endPoint.y);
          const width = Math.abs(endPoint.x - dragStart.x);
          const height = Math.abs(endPoint.y - dragStart.y);

          if (width > 5 || height > 5) {
              const newAnn: Annotation = {
                  id: Math.random().toString(),
                  type: activeTool === 'link' ? 'link' : (activeTool === 'shape-rect' ? 'rect' : activeTool === 'shape-circle' ? 'circle' : 'line'),
                  x: activeTool === 'shape-line' ? dragStart.x : x,
                  y: activeTool === 'shape-line' ? dragStart.y : y,
                  width: activeTool === 'shape-line' ? 0 : width,
                  height: activeTool === 'shape-line' ? 0 : height,
                  color: activeTool === 'link' ? 'rgba(0,0,255,0.2)' : shapeSettings.strokeColor,
                  strokeWidth: shapeSettings.strokeWidth,
                  points: activeTool === 'shape-line' ? [{x: dragStart.x, y: dragStart.y}, {x: endPoint.x, y: endPoint.y}] : undefined,
                  url: activeTool === 'link' ? 'https://' : undefined
              };
              newPages[pageIndex].annotations.push(newAnn);
              updatePages(newPages);
              setSelectedId(newAnn.id);
          }
      }

      setCurrentPath([]);
      setDragStart(null);
      setActiveTool('cursor');
  };

  const savePdf = async () => {
      if (!file) return;
      setProcessing(true);
      try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);

          const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
          const helveticaBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
          const times = await pdfDoc.embedFont(StandardFonts.TimesRoman);
          const courier = await pdfDoc.embedFont(StandardFonts.Courier);
          
          const getFont = (family: string = 'Helvetica', weight: string = 'normal', style: string = 'normal') => {
              if (family.includes('Times')) return times;
              if (family.includes('Courier')) return courier;
              if (weight === 'bold' && style === 'italic') return helveticaBoldOblique;
              if (weight === 'bold') return helveticaBold;
              if (style === 'italic') return helveticaOblique;
              return helvetica;
          };

          const newPdf = await PDFDocument.create();
          
          for (let i = 0; i < pages.length; i++) {
              const pageState = pages[i];
              
              let pdfPage;
              let height;
              
              if (pageState.isInserted) {
                  pdfPage = newPdf.addPage([612, 792]);
                  height = 792;
              } else {
                  const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageState.index]);
                  pdfPage = newPdf.addPage(copiedPage);
                  height = pdfPage.getSize().height;
              }

              const currentRotation = pdfPage.getRotation().angle;
              pdfPage.setRotation(degrees(currentRotation + pageState.rotation));

              Object.values(pageState.textChanges).forEach((change: TextChange) => {
                   if (change.newText !== change.originalText || change.fontWeight || change.fontStyle || change.color || change.fontSize || change.isNew) {
                       // Only redraw if changed or new
                       // For existing text edits, whiteout original
                       if (!change.isNew || (change.isNew && change.newText !== change.originalText)) {
                           pdfPage.drawRectangle({
                               x: change.x,
                               y: change.y - (change.height * 0.2), 
                               width: change.width,
                               height: change.height * 1.2, 
                               color: rgb(1,1,1)
                           });
                       }

                       if (change.newText && change.newText.trim() !== '') {
                           pdfPage.drawText(change.newText, {
                               x: change.x,
                               y: change.y, 
                               size: change.fontSize,
                               font: getFont(change.fontFamily, change.fontWeight, change.fontStyle),
                               color: hexToRgb(change.color || '#000000'),
                           });
                       }
                   }
              });

              for (const ann of pageState.annotations) {
                  const annColor = hexToRgb(ann.color);
                  
                  if (ann.type === 'text' && ann.content) {
                      pdfPage.drawText(ann.content, {
                          x: ann.x,
                          y: height - ann.y - (ann.fontSize || 14),
                          size: ann.fontSize || 14,
                          font: getFont(ann.fontFamily, ann.fontWeight, ann.fontStyle),
                          color: annColor,
                      });
                  }
                  else if (ann.type === 'whiteout') {
                       pdfPage.drawRectangle({
                           x: ann.x,
                           y: height - ann.y - (ann.height || 20),
                           width: ann.width,
                           height: ann.height,
                           color: rgb(1, 1, 1),
                       });
                  }
                  else if (ann.type === 'image' && ann.dataUrl) {
                      const imgBytes = await fetch(ann.dataUrl).then(res => res.arrayBuffer());
                      let image;
                      if (ann.dataUrl.startsWith('data:image/png')) {
                          image = await newPdf.embedPng(imgBytes);
                      } else {
                          image = await newPdf.embedJpg(imgBytes);
                      }
                      const dims = image.scale(1);
                      const w = ann.width || dims.width;
                      const h = ann.height || dims.height;

                      pdfPage.drawImage(image, {
                          x: ann.x,
                          y: height - ann.y - h,
                          width: w,
                          height: h,
                          rotate: degrees(ann.rotation || 0)
                      });
                  }
                  else if ((ann.type === 'path' || ann.type === 'highlight') && ann.points && ann.points.length > 1) {
                      for(let j=0; j<ann.points.length-1; j++) {
                           pdfPage.drawLine({
                               start: { x: ann.points[j].x, y: height - ann.points[j].y },
                               end: { x: ann.points[j+1].x, y: height - ann.points[j+1].y },
                               thickness: ann.strokeWidth || 2,
                               color: annColor,
                               opacity: ann.type === 'highlight' ? 0.3 : 1
                           });
                      }
                  }
                  else if (ann.type === 'line' && ann.points && ann.points.length > 1) {
                        pdfPage.drawLine({
                           start: { x: ann.points[0].x, y: height - ann.points[0].y },
                           end: { x: ann.points[1].x, y: height - ann.points[1].y },
                           thickness: ann.strokeWidth || 2,
                           color: annColor,
                       });
                  }
                  else if (ann.type === 'rect') {
                      pdfPage.drawRectangle({
                          x: ann.x,
                          y: height - ann.y - (ann.height || 0),
                          width: ann.width,
                          height: ann.height,
                          borderColor: annColor,
                          borderWidth: ann.strokeWidth || 2,
                          color: undefined, 
                      });
                  }
                  else if (ann.type === 'circle') {
                      const rx = (ann.width || 0) / 2;
                      const ry = (ann.height || 0) / 2;
                      pdfPage.drawEllipse({
                          x: ann.x + rx,
                          y: height - (ann.y + ry),
                          xScale: rx,
                          yScale: ry,
                          borderColor: annColor,
                          borderWidth: ann.strokeWidth || 2,
                          color: undefined
                      });
                  }
                  else if (ann.type === 'form-check') {
                       pdfPage.drawText('✓', {
                           x: ann.x, y: height - ann.y - 14, size: 20, font: helvetica, color: annColor
                       });
                  }
                  else if (ann.type === 'form-cross') {
                       pdfPage.drawText('✕', {
                           x: ann.x, y: height - ann.y - 14, size: 20, font: helvetica, color: annColor
                       });
                  }
              }
          }
          
          const pdfBytes = await newPdf.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setResultUrl(url);
          setStep('success');

      } catch (err) {
          console.error(err);
          alert("Failed to save PDF: " + err);
      } finally {
          setProcessing(false);
      }
  };

  const reset = () => {
      setFile(null);
      setPages([]);
      setHistory([]);
      setStep('upload');
      setResultUrl(null);
  };

  const ToolbarButton = ({ 
      active, onClick, icon: Icon, label, dropdown, tooltip 
  }: { active?: boolean, onClick: () => void, icon: any, label: string, dropdown?: boolean, tooltip?: string }) => (
      <button 
          onClick={onClick}
          title={tooltip}
          className={`
              flex items-center gap-2 px-4 py-2.5 rounded text-sm font-medium transition-colors border whitespace-nowrap
              ${active 
                  ? 'bg-sky-100 text-sky-600 border-sky-300' 
                  : 'bg-white text-sky-600 border-transparent hover:bg-sky-50 hover:border-sky-200'
              }
          `}
      >
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span>{label}</span>
          {dropdown && <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />}
      </button>
  );

  const renderSejdaToolbar = () => (
      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-40 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
              
              <ToolbarButton 
                  icon={Hand} label="Pan" active={activeTool === 'hand'} 
                  onClick={() => setActiveTool(activeTool === 'hand' ? 'cursor' : 'hand')} 
                  tooltip="Pan tool (drag to scroll)"
              />

              <div className="h-6 w-px bg-gray-200 mx-1"></div>

              <ToolbarButton 
                  icon={Type} label="Text" active={activeTool === 'text'} 
                  onClick={() => setActiveTool(activeTool === 'text' ? 'cursor' : 'text')} 
                  dropdown
                  tooltip="Insert text into PDF"
              />
              
              <ToolbarButton 
                  icon={LinkIcon} label="Links" active={activeTool === 'link'} 
                  onClick={() => setActiveTool(activeTool === 'link' ? 'cursor' : 'link')} 
                  tooltip="Create a clickable link"
              />
              
              <div className="relative group">
                  <ToolbarButton icon={CheckSquare} label="Forms" dropdown onClick={() => {}} active={activeTool.startsWith('form')} tooltip="Insert form symbols" />
                  <div className="absolute top-full left-0 mt-1 bg-white shadow-lg border border-gray-100 rounded-lg p-2 hidden group-hover:block min-w-[140px] z-50">
                      <button onClick={() => setActiveTool('form-check')} className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700"><Check className="w-4 h-4"/> Checkmark</button>
                      <button onClick={() => setActiveTool('form-cross')} className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700"><X className="w-4 h-4"/> Cross</button>
                  </div>
              </div>

              <div className="relative group">
                  <ToolbarButton icon={ImageIcon} label="Images" dropdown onClick={() => {}} active={activeTool === 'image'} tooltip="Insert an image" />
                  <div className="absolute top-full left-0 mt-1 bg-white shadow-lg border border-gray-100 rounded-lg p-2 hidden group-hover:block min-w-[140px] z-50">
                       <button onClick={() => imageInputRef.current?.click()} className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700"><FileUp className="w-4 h-4"/> Upload Image</button>
                  </div>
              </div>
              <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

              <div className="relative group">
                  <ToolbarButton icon={PenTool} label="Sign" dropdown onClick={() => {}} active={activeTool === 'sign'} tooltip="Sign document" />
                   <div className="absolute top-full left-0 mt-1 bg-white shadow-lg border border-gray-100 rounded-lg p-2 hidden group-hover:block min-w-[140px] z-50">
                       <button onClick={() => setActiveTool('sign')} className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700"><PenTool className="w-4 h-4"/> New Signature</button>
                   </div>
              </div>
              
              <ToolbarButton 
                  icon={Eraser} label="Whiteout" active={activeTool === 'whiteout'}
                  onClick={() => setActiveTool(activeTool === 'whiteout' ? 'cursor' : 'whiteout')} 
                  tooltip="Hide content with whiteout"
              />
              
              <div className="relative group">
                  <ToolbarButton icon={MousePointer2} label="Annotate" dropdown onClick={() => {}} active={activeTool.startsWith('annotate')} tooltip="Draw or highlight" />
                  <div className="absolute top-full left-0 mt-1 bg-white shadow-lg border border-gray-100 rounded-lg p-2 hidden group-hover:block min-w-[140px] z-50">
                      <button onClick={() => setActiveTool('annotate-highlight')} className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700"><Highlighter className="w-4 h-4 text-yellow-500"/> Highlight</button>
                      <button onClick={() => setActiveTool('annotate-pen')} className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700"><PenTool className="w-4 h-4"/> Draw</button>
                  </div>
              </div>
              
              <div className="relative group">
                   <ToolbarButton icon={Square} label="Shapes" dropdown onClick={() => {}} active={activeTool.startsWith('shape')} tooltip="Insert shapes" />
                   <div className="absolute top-full left-0 mt-1 bg-white shadow-lg border border-gray-100 rounded-lg p-2 hidden group-hover:block min-w-[140px] z-50">
                       <button onClick={() => setActiveTool('shape-rect')} className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700"><Square className="w-4 h-4"/> Rectangle</button>
                       <button onClick={() => setActiveTool('shape-circle')} className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700"><Circle className="w-4 h-4"/> Ellipse</button>
                       <button onClick={() => setActiveTool('shape-line')} className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700"><Minus className="w-4 h-4"/> Line</button>
                   </div>
              </div>

              <div className="h-6 w-px bg-gray-200 mx-1"></div>

              <ToolbarButton 
                  icon={Search} label="Find & Replace" active={isSearchOpen}
                  onClick={() => setIsSearchOpen(!isSearchOpen)} 
                  tooltip="Find and replace text"
              />

              <div className="flex-1"></div>
              
              <button 
                onClick={undo} 
                disabled={historyIndex <= 0} 
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium text-sky-600 hover:bg-sky-50 disabled:opacity-50 disabled:hover:bg-transparent border border-sky-600 whitespace-nowrap"
                title="Undo last action"
              >
                  <Undo className="w-4 h-4"/> Undo
              </button>
          </div>
      </div>
  );

  const renderSearchPanel = () => {
      if (!isSearchOpen) return null;

      const currentMatch = searchResults[currentMatchIndex];

      return (
          <div className="absolute top-[130px] right-8 z-50 bg-white shadow-xl border border-gray-200 rounded-lg p-4 w-80 animate-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      <Search className="w-4 h-4" /> Find & Replace
                  </h3>
                  <button onClick={() => setIsSearchOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                  </button>
              </div>
              
              <div className="space-y-3">
                  <div>
                      <input 
                          type="text" 
                          placeholder="Find text..." 
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          value={findText}
                          onChange={(e) => setFindText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                      />
                  </div>
                  <div>
                      <input 
                          type="text" 
                          placeholder="Replace with..." 
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          value={replaceText}
                          onChange={(e) => setReplaceText(e.target.value)}
                      />
                  </div>
                  
                  <div className="flex items-center justify-between">
                      <button 
                          onClick={performSearch} 
                          disabled={searchLoading}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center"
                      >
                          {searchLoading && <Loader2 className="w-3 h-3 animate-spin mr-1" />} Find
                      </button>
                      
                      {searchResults.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                              <button 
                                  onClick={() => {
                                      setCurrentMatchIndex(prev => Math.max(0, prev - 1));
                                      const prevIdx = Math.max(0, currentMatchIndex - 1);
                                      const match = searchResults[prevIdx];
                                      if (match) {
                                          setSelectedPageIdx(match.pageIndex);
                                          document.getElementById(`page-${match.pageIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                      }
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded"
                              >
                                  <ArrowLeft className="w-3 h-3" />
                              </button>
                              <span>{currentMatchIndex + 1} / {searchResults.length}</span>
                              <button 
                                  onClick={() => {
                                      setCurrentMatchIndex(prev => Math.min(searchResults.length - 1, prev + 1));
                                      const nextIdx = Math.min(searchResults.length - 1, currentMatchIndex + 1);
                                      const match = searchResults[nextIdx];
                                      if (match) {
                                          setSelectedPageIdx(match.pageIndex);
                                          document.getElementById(`page-${match.pageIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                      }
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded"
                              >
                                  <ArrowRight className="w-3 h-3" />
                              </button>
                          </div>
                      )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button 
                          onClick={performReplace}
                          disabled={searchResults.length === 0}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50"
                      >
                          Replace
                      </button>
                      <button 
                          onClick={performReplaceAll}
                          disabled={searchResults.length === 0}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50"
                      >
                          Replace All
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  const renderToolProperties = () => {
      if (activeTool !== 'text' && !activeTool.startsWith('shape-')) return null;
      
      return (
        <div className="bg-gray-100 border-b border-gray-200 py-2 flex justify-center z-30 shadow-inner overflow-x-auto no-scrollbar">
            {activeTool === 'text' && (
                <div className="flex items-center gap-3 bg-white px-4 py-1.5 rounded shadow-sm border border-gray-200 whitespace-nowrap">
                    <span className="text-xs font-bold text-gray-500 uppercase mr-2 tracking-wide">Text Properties:</span>
                    <select 
                        value={textSettings.fontFamily}
                        onChange={(e) => setTextSettings({...textSettings, fontFamily: e.target.value})}
                        className="h-8 text-sm border border-gray-300 rounded px-2 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none bg-white"
                    >
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times</option>
                        <option value="Courier New">Courier</option>
                    </select>
                    <div className="h-4 w-px bg-gray-200 mx-1"></div>
                    <div className="flex items-center border border-gray-300 rounded bg-white overflow-hidden h-8">
                        <button 
                            onClick={() => setTextSettings({...textSettings, fontSize: Math.max(6, textSettings.fontSize - 2)})}
                            className="px-2 hover:bg-gray-50 border-r border-gray-200 text-gray-600"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <input 
                            type="number" 
                            value={textSettings.fontSize}
                            onChange={(e) => setTextSettings({...textSettings, fontSize: Number(e.target.value)})}
                            className="w-10 text-sm text-center focus:outline-none border-none p-0 h-full"
                            min={6} max={100}
                        />
                        <button 
                            onClick={() => setTextSettings({...textSettings, fontSize: Math.min(100, textSettings.fontSize + 2)})}
                            className="px-2 hover:bg-gray-50 border-l border-gray-200 text-gray-600"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="h-4 w-px bg-gray-200 mx-1"></div>
                    <div className="relative group">
                        <button 
                            className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center transition-transform hover:scale-105"
                            style={{ backgroundColor: textSettings.color }}
                            title="Text Color"
                        />
                         <div className="hidden group-hover:grid absolute top-full left-0 bg-white shadow-lg border border-gray-100 p-2 gap-1 grid-cols-4 z-50 w-32 mt-2 rounded-lg">
                            {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'].map(c => (
                                <button 
                                    key={c} 
                                    className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform shadow-sm" 
                                    style={{ backgroundColor: c }}
                                    onClick={() => setTextSettings({...textSettings, color: c})}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="h-4 w-px bg-gray-200 mx-1"></div>
                    <div className="flex bg-gray-50 rounded border border-gray-200">
                        <button 
                            onClick={() => setTextSettings({...textSettings, fontWeight: textSettings.fontWeight === 'bold' ? 'normal' : 'bold'})}
                            className={`p-1.5 px-3 transition-colors border-r border-gray-200 ${textSettings.fontWeight === 'bold' ? 'bg-sky-100 text-sky-600 font-bold' : 'hover:bg-gray-100 text-gray-600'}`}
                            title="Bold"
                        >
                            <Bold className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setTextSettings({...textSettings, fontStyle: textSettings.fontStyle === 'italic' ? 'normal' : 'italic'})}
                            className={`p-1.5 px-3 transition-colors ${textSettings.fontStyle === 'italic' ? 'bg-sky-100 text-sky-600 italic' : 'hover:bg-gray-100 text-gray-600'}`}
                            title="Italic"
                        >
                            <Italic className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
            
            {activeTool.startsWith('shape-') && (
                <div className="flex items-center gap-3 bg-white px-4 py-1.5 rounded shadow-sm border border-gray-200 whitespace-nowrap">
                    <span className="text-xs font-bold text-gray-500 uppercase mr-2 tracking-wide">Shape Properties:</span>
                    <div className="relative group flex items-center gap-2">
                        <span className="text-sm text-gray-600">Color:</span>
                        <button 
                            className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center"
                            style={{ backgroundColor: shapeSettings.strokeColor }}
                            title="Stroke Color"
                        />
                        <div className="hidden group-hover:grid absolute top-full left-0 bg-white shadow-lg border border-gray-100 p-2 gap-1 grid-cols-4 z-50 w-32 mt-2 rounded-lg">
                            {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'].map(c => (
                                <button 
                                    key={c} 
                                    className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform shadow-sm" 
                                    style={{ backgroundColor: c }}
                                    onClick={() => setShapeSettings({...shapeSettings, strokeColor: c})}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="h-4 w-px bg-gray-200 mx-1"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Thickness:</span>
                        <div className="flex items-center border border-gray-300 rounded bg-white overflow-hidden h-8">
                            <button 
                                onClick={() => setShapeSettings({...shapeSettings, strokeWidth: Math.max(1, shapeSettings.strokeWidth - 1)})}
                                className="px-2 hover:bg-gray-50 border-r border-gray-200 text-gray-600"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-sm text-center">{shapeSettings.strokeWidth}</span>
                            <button 
                                onClick={() => setShapeSettings({...shapeSettings, strokeWidth: Math.min(20, shapeSettings.strokeWidth + 1)})}
                                className="px-2 hover:bg-gray-50 border-l border-gray-200 text-gray-600"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      );
  };

  // --- VIEWS ---

  if (step === 'upload') {
     return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4 font-sans">
            <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">Online PDF Editor</h1>
            <p className="text-gray-500 text-lg mb-10 text-center">Edit PDF files for free. Fill & sign PDF.</p>
            <div className="w-full max-w-xl">
                <button onClick={() => fileInputRef.current?.click()} className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-lg shadow-md flex items-center justify-center gap-3 text-xl group transition-all">
                    <FileUp className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
                    Upload PDF file
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
            </div>
            <div className="mt-16 max-w-2xl text-center">
                <h3 className="font-bold text-gray-700 mb-2">How to edit a PDF file online</h3>
                <p className="text-sm text-gray-500">
                    Upload your file. Click on existing text to edit it, or use the toolbar to insert new text, images, and signatures. Click 'Apply changes' to download.
                </p>
            </div>
        </div>
     );
  }

  if (step === 'success' && resultUrl) {
      return (
        <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-12 px-4 font-sans">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Your document is ready</h2>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-2xl w-full text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8" />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href={resultUrl} download={`edited_${file?.name}`} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2">
                        <Download className="w-5 h-5" /> Download
                    </a>
                    <button onClick={reset} className="bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Start Over
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col font-sans relative">
        {renderSejdaToolbar()}
        {renderToolProperties()}
        {renderSearchPanel()}

        <div 
            ref={scrollContainerRef}
            className={`flex-1 flex justify-center py-12 px-4 overflow-y-auto ${activeTool === 'hand' ? 'cursor-grab active:cursor-grabbing' : ''}`}
            onClick={() => setSelectedId(null)}
            onMouseDown={handleGlobalMouseDown}
            onMouseMove={handleGlobalMouseMove}
            onMouseUp={handleGlobalMouseUp}
            onMouseLeave={handleGlobalMouseUp}
            onWheel={handleWheel}
        >
             <div className="flex flex-col items-center w-full">
                 {loading ? (
                     <div className="flex flex-col items-center mt-20">
                         <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
                         <p className="text-gray-500">Loading document...</p>
                     </div>
                 ) : (
                     <>
                        {pages.map((page, idx) => (
                             <div key={idx} id={`page-${idx}`} className="flex flex-col items-center mb-12">
                                 
                                 {/* Page Controls Bar */}
                                 <div className="flex items-center gap-2 mb-2">
                                     <span className="text-3xl text-gray-400 font-light mr-2">{idx + 1}</span>
                                     <div className="flex items-center border border-blue-300 rounded overflow-hidden bg-white text-blue-500 shadow-sm">
                                         <button onClick={() => deletePage(idx)} className="p-1.5 hover:bg-red-50 hover:text-red-500 border-r border-blue-100 transition-colors" title="Delete Page"><Trash2 className="w-4 h-4"/></button>
                                         <button onClick={() => zoomPage(idx, 0.1)} className="p-1.5 hover:bg-blue-50 border-r border-blue-100" title="Zoom In"><ZoomIn className="w-4 h-4"/></button>
                                         <button onClick={() => zoomPage(idx, -0.1)} className="p-1.5 hover:bg-blue-50 border-r border-blue-100" title="Zoom Out"><ZoomOut className="w-4 h-4"/></button>
                                         <button onClick={() => rotatePage(idx, 'ccw')} className="p-1.5 hover:bg-blue-50 border-r border-blue-100" title="Rotate Left"><RotateCcw className="w-4 h-4"/></button>
                                         <button onClick={() => rotatePage(idx, 'cw')} className="p-1.5 hover:bg-blue-50" title="Rotate Right"><RotateCw className="w-4 h-4"/></button>
                                     </div>
                                     <button 
                                        onClick={() => insertPage(idx)}
                                        className="ml-2 flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 border border-blue-300 rounded px-2 py-1 bg-white hover:bg-blue-50 shadow-sm transition-colors"
                                     >
                                         <PlusCircle className="w-4 h-4"/> Insert page here
                                     </button>
                                 </div>

                                 <div className="relative shadow-md inline-block bg-white">
                                     <PdfPageRenderer 
                                        page={page} 
                                        index={idx} 
                                        file={file}
                                        activeTool={activeTool}
                                        selectedId={selectedId}
                                        isDrawing={isDrawing && selectedPageIdx === idx}
                                        currentPath={currentPath}
                                        dragStart={dragStart}
                                        shapeSettings={shapeSettings}
                                        searchResults={searchResults}
                                        currentMatchId={searchResults[currentMatchIndex]?.id}
                                        onSelect={(id) => { setSelectedId(id); setSelectedPageIdx(idx); }}
                                        onMouseDown={(e) => handleMouseDown(e, idx)}
                                        onMouseMove={(e) => handleMouseMove(e, idx)}
                                        onMouseUp={() => handleMouseUp(idx)}
                                        onEdit={(change) => {
                                            const newChanges = { ...page.textChanges, [change.id]: change };
                                            const newPages = [...pages];
                                            newPages[idx].textChanges = newChanges;
                                            updatePages(newPages);
                                        }}
                                        onDuplicate={(change) => {
                                            const newAnn: Annotation = {
                                                id: Math.random().toString(),
                                                type: 'text',
                                                x: change.x, y: change.y - 20, 
                                                content: change.newText,
                                                fontSize: change.fontSize,
                                                fontFamily: change.fontFamily,
                                                color: change.color || '#000000',
                                                fontWeight: change.fontWeight,
                                                fontStyle: change.fontStyle
                                            };
                                            const newPages = [...pages];
                                            newPages[idx].annotations.push(newAnn);
                                            updatePages(newPages);
                                        }}
                                        onUpdateAnnotation={(id, updates) => {
                                            const newPages = [...pages];
                                            const annIndex = newPages[idx].annotations.findIndex(a => a.id === id);
                                            if (annIndex !== -1) {
                                                newPages[idx].annotations[annIndex] = { ...newPages[idx].annotations[annIndex], ...updates };
                                                updatePages(newPages, false);
                                            }
                                        }}
                                     />
                                 </div>
                             </div>
                         ))}
                         
                         <div className="flex flex-col items-center mb-12">
                             <button 
                                onClick={() => insertPage(pages.length)}
                                className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 border border-blue-300 rounded px-2 py-1 bg-white hover:bg-blue-50 shadow-sm transition-colors"
                             >
                                 <PlusCircle className="w-4 h-4"/> Insert page here
                             </button>
                         </div>
                     </>
                 )}
             </div>
        </div>

        <div className="bg-[#fff9e6] border-t border-orange-100 p-4 sticky bottom-0 z-50">
             <div className="max-w-md mx-auto">
                 <button 
                     onClick={savePdf}
                     disabled={processing || loading}
                     className="w-full bg-[#009b72] hover:bg-[#008a65] disabled:opacity-70 text-white font-bold py-3 rounded-lg shadow-md flex items-center justify-center text-lg transition-colors"
                 >
                     {processing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                     Apply changes
                 </button>
             </div>
        </div>
    </div>
  );
};

export default PdfEditor;
