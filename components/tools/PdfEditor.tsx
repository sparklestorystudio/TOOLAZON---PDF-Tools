
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FileUp, ChevronDown, Check, Loader2, Type, Link as LinkIcon, Image as ImageIcon, 
  PenTool, Eraser, Undo, Trash2, RotateCw, RotateCcw, PlusCircle,
  Download, RefreshCw, X, Square, Circle, Minus, Save, Bold, Italic,
  ZoomIn, ZoomOut, Highlighter, MousePointer2, CheckSquare, Move, Copy, Palette, Plus, Hand, Search, ArrowLeft, ArrowRight, Underline
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';
import ProcessingOverlay from '../ProcessingOverlay';

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
  isNew?: boolean; 
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

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// --- SUB-COMPONENTS ---

const FloatingToolbar: React.FC<{ 
    currentStyle: { weight: string, style: string, decoration: string, color: string, size: number, family: string },
    onStyleChange: (key: string, val: any) => void,
    onDelete: () => void,
    onDuplicate: () => void,
    isNearTop?: boolean
}> = ({ currentStyle, onStyleChange, onDelete, onDuplicate, isNearTop }) => {
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
            className={`absolute ${isNearTop ? 'top-full mt-2' : 'bottom-full mb-2'} left-1/2 -translate-x-1/2 z-[110] flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-1.5 min-w-max pointer-events-auto ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100`}
            onMouseDown={handleMouseDown} 
        >
            <button 
                onClick={() => onStyleChange('weight', currentStyle.weight === 'bold' ? 'normal' : 'bold')}
                className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors ${currentStyle.weight === 'bold' ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400' : ''}`}
                title="Bold"
            >
                <Bold className="w-4 h-4" />
            </button>
            <button 
                onClick={() => onStyleChange('style', currentStyle.style === 'italic' ? 'normal' : 'italic')}
                className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors ${currentStyle.style === 'italic' ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400' : ''}`}
                title="Italic"
            >
                <Italic className="w-4 h-4" />
            </button>
            <button 
                onClick={() => onStyleChange('decoration', currentStyle.decoration === 'underline' ? 'none' : 'underline')}
                className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors ${currentStyle.decoration === 'underline' ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400' : ''}`}
                title="Underline"
            >
                <Underline className="w-4 h-4" />
            </button>
            
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1.5"></div>

            <div className="flex items-center text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 rounded-md px-1 py-0.5 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center">
                    <button 
                        onMouseDown={handleMouseDown}
                        onClick={() => onStyleChange('size', Math.max(4, currentStyle.size - 1))}
                        className="p-1 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors"
                    >
                        <Minus className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    </button>
                    <input 
                        type="number" 
                        value={Math.round(currentStyle.size)} 
                        onChange={(e) => onStyleChange('size', Number(e.target.value))}
                        className="w-10 text-[11px] font-bold text-center border-none focus:ring-0 p-0 bg-transparent text-gray-800 dark:text-gray-100"
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                    <button 
                        onMouseDown={handleMouseDown}
                        onClick={() => onStyleChange('size', Math.min(144, currentStyle.size + 1))}
                        className="p-1 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors"
                    >
                        <Plus className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    </button>
                </div>
            </div>

            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1.5"></div>

            <select 
                value={currentStyle.family}
                onChange={(e) => onStyleChange('family', e.target.value)}
                className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-md focus:ring-0 px-2 py-1 max-w-[120px] cursor-pointer"
                onMouseDown={(e) => e.stopPropagation()} 
            >
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times Roman</option>
                <option value="Courier New">Courier</option>
            </select>

            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1.5"></div>

            <div className="relative group/color">
                <button 
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                    <div className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600" style={{ backgroundColor: currentStyle.color }}></div>
                    <ChevronDown className="w-3 h-3 ml-1 text-gray-400 dark:text-gray-500" />
                </button>
                <div className="hidden group-hover/color:grid absolute top-full left-0 bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 p-2.5 gap-1.5 grid-cols-4 z-[120] w-36 mt-1 rounded-lg animate-in fade-in slide-in-from-top-1">
                    {['#000000', '#FFFFFF', '#666666', '#FF0000', '#0000FF', '#008000', '#FFFF00', '#FFA500'].map(c => (
                        <button 
                            key={c} 
                            className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform shadow-sm" 
                            style={{ backgroundColor: c }}
                            onClick={() => onStyleChange('color', c)}
                        />
                    ))}
                </div>
            </div>

            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1.5"></div>

            <button onClick={onDuplicate} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400" title="Duplicate">
                <Copy className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Delete">
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
    isSelected: boolean,
    onSelect: () => void,
    autoFocus?: boolean
}> = ({ item, text, change, scale, onSave, onDuplicate, isSelected, onSelect, autoFocus }) => {
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

    useEffect(() => {
        if (!isSelected && isEditing) {
            handleBlur();
        }
    }, [isSelected]);

    const styleState = {
        weight: change?.fontWeight || 'normal',
        style: change?.fontStyle || 'normal',
        decoration: change?.textDecoration || 'none',
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
                // If it was just opened by autofocus, select everything
                if (autoFocus) {
                  inputRef.current.select();
                } else {
                  inputRef.current.selectionStart = inputRef.current.value.length;
                  inputRef.current.selectionEnd = inputRef.current.value.length;
                }
            }
        }
    }, [isEditing, styleState.size]);

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
        if (key === 'decoration') updates.textDecoration = value;
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
        if (e.key === 'Enter' && !e.shiftKey && !change?.originalText.includes('\n')) {
            e.preventDefault();
            handleBlur();
        }
    };

    const left = (item.viewportX || 0) * scale;
    const top = (item.viewportY || 0) * scale - (styleState.size * scale);
    
    // Check if item is near top of page to flip toolbar
    const isNearTop = top < 100;

    const cssStyle: React.CSSProperties = {
        fontSize: `${styleState.size * scale}px`,
        fontFamily: styleState.family === 'Helvetica' ? 'sans-serif' : (styleState.family.includes('Times') ? 'serif' : 'monospace'),
        fontWeight: styleState.weight,
        fontStyle: styleState.style,
        textDecoration: styleState.decoration,
        color: styleState.color,
        lineHeight: 1.2,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        cursor: 'text',
        outline: 'none',
        border: 'none',
        background: 'transparent',
        padding: 0,
        margin: 0,
    };

    const shouldCover = change !== undefined;

    return (
        <div 
            ref={containerRef}
            onClick={(e) => { 
                e.stopPropagation(); 
                onSelect(); 
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
            className={`absolute group pointer-events-auto rounded-sm ${isSelected ? 'ring-2 ring-sky-500 bg-sky-500/5' : 'hover:ring-1 hover:ring-sky-300'}`}
            style={{
                left: left,
                top: top,
                zIndex: isSelected || isEditing ? 100 : 20,
                minWidth: Math.max(30, item.width * scale) + 'px',
                minHeight: (item.height || 20) * scale + 'px',
                backgroundColor: shouldCover ? '#ffffff' : 'transparent',
                transition: 'background-color 0.1s ease',
            }}
        >
            {isSelected && (
                <FloatingToolbar 
                    currentStyle={styleState}
                    onStyleChange={handleStyleChange}
                    onDelete={handleDelete}
                    onDuplicate={onDuplicate}
                    isNearTop={isNearTop}
                />
            )}
            
            {isEditing ? (
                <div className="relative w-full h-full min-w-[50px] bg-white p-0.5 rounded shadow-sm overflow-visible z-[101]">
                    <textarea 
                        ref={inputRef}
                        value={val}
                        onChange={(e) => {
                            setVal(e.target.value);
                            adjustHeight();
                        }}
                        onKeyDown={handleKeyDown}
                        style={{ 
                            ...cssStyle, 
                            width: '100%',
                            minHeight: '1.2em',
                            background: 'white', 
                            overflow: 'hidden',
                            resize: 'none',
                            display: 'block',
                        }}
                        className="select-text text-black"
                    />
                </div>
            ) : (
                <div style={cssStyle} className="px-0.5">
                    {text || (isSelected ? <span className="opacity-30 italic">Type here</span> : '')}
                </div>
            )}
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
        if (!isSelected && isEditing) {
            setIsEditing(false);
        }
    }, [isSelected]);

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
        border: isSelected && !isEditing ? '1px solid #3b82f6' : 'none',
        zIndex: isSelected ? 50 : 40
    };

    if (ann.type === 'text') {
        const fontSize = (ann.fontSize || 14) * scale;
        const fontFamily = ann.fontFamily === 'Helvetica' ? 'sans-serif' : (ann.fontFamily?.includes('Times') ? 'serif' : 'monospace');
        
        const styleState = {
            weight: ann.fontWeight || 'normal',
            style: ann.fontStyle || 'normal',
            decoration: ann.textDecoration || 'none',
            color: ann.color || '#000000',
            size: ann.fontSize || 14,
            family: ann.fontFamily || 'Helvetica'
        };

        const isNearTop = (ann.y * scale) < 100;

        const handleStyleChange = (key: string, value: any) => {
            if (!onUpdate) return;
            const updates: any = {};
            if (key === 'weight') updates.fontWeight = value;
            if (key === 'style') updates.fontStyle = value;
            if (key === 'decoration') updates.textDecoration = value;
            if (key === 'color') updates.color = value;
            if (key === 'size') updates.fontSize = value;
            if (key === 'family') updates.fontFamily = value;
            onUpdate(updates);
        };

        return (
            <div 
                ref={containerRef}
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onSelect(); 
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                }}
                style={{ 
                    position: 'absolute',
                    left: ann.x * scale,
                    top: ann.y * scale,
                    zIndex: isSelected || isEditing ? 100 : 40,
                    minWidth: '20px'
                }}
            >
                {isSelected && (
                    <FloatingToolbar 
                        currentStyle={styleState}
                        onStyleChange={handleStyleChange}
                        onDelete={() => onUpdate({ content: '' })} 
                        onDuplicate={() => {}} 
                        isNearTop={isNearTop}
                    />
                )}
                
                {isEditing ? (
                    <div className="bg-white ring-2 ring-sky-400 p-0.5 rounded shadow-lg min-w-[50px]">
                        <textarea 
                            ref={textareaRef}
                            value={ann.content || ''}
                            onChange={(e) => onUpdate({ content: e.target.value })}
                            style={{
                                fontSize: `${fontSize}px`,
                                fontFamily,
                                fontWeight: ann.fontWeight,
                                fontStyle: ann.fontStyle,
                                textDecoration: ann.textDecoration,
                                color: ann.color,
                                background: 'white',
                                outline: 'none',
                                border: 'none',
                                padding: 0,
                                margin: 0,
                                whiteSpace: 'pre-wrap',
                                overflow: 'hidden',
                                resize: 'none',
                                minWidth: '20px',
                                width: '100%'
                            }}
                        />
                    </div>
                ) : (
                    <div 
                        style={{ 
                            fontSize: `${fontSize}px`, 
                            fontFamily, 
                            fontWeight: ann.fontWeight, 
                            fontStyle: ann.fontStyle, 
                            textDecoration: ann.textDecoration, 
                            color: ann.color, 
                            cursor: 'text',
                            whiteSpace: 'pre-wrap',
                            border: isSelected ? '2px solid transparent' : 'none',
                        }}
                        className={`hover:ring-1 hover:ring-sky-200 p-0.5 rounded-sm ${isSelected ? 'ring-2 ring-sky-500 bg-sky-500/5' : ''}`}
                    >
                        {ann.content || (isSelected ? <span className="opacity-30 italic">Type here</span> : '')}
                    </div>
                )}
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
        const unscaledViewport = pdfPage.getViewport({ scale: 1, rotation: page.rotation });
        setOriginalDims({ width: unscaledViewport.width, height: unscaledViewport.height });

        const viewport = pdfPage.getViewport({ scale: page.scale, rotation: page.rotation });
        
        const offscreen = document.createElement('canvas');
        offscreen.width = viewport.width;
        offscreen.height = viewport.height;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return;
        
        await pdfPage.render({
            canvasContext: ctx,
            viewport: viewport,
        }).promise;
        
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

  const width = originalDims ? originalDims.width * page.scale : (612 * page.scale);
  const height = originalDims ? originalDims.height * page.scale : (792 * page.scale);
  const pageMatches = searchResults.filter(m => m.pageIndex === index);

  return (
    <div 
      style={{ width, height, position: 'relative' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      className={`bg-white shadow-xl ${activeTool === 'hand' ? 'cursor-grab' : 'cursor-crosshair'}`}
    >
      <canvas 
        ref={canvasRef} 
        className="block pointer-events-none origin-top-left" 
        style={{ width: '100%', height: '100%' }} 
      />
      
      {/* Invisible layer for detecting existing PDF text - only shown in cursor/text mode */}
      {!page.isInserted && originalDims && (activeTool === 'cursor' || activeTool === 'text') && textItems.map(item => {
          if (page.textChanges[item.id]) return null;

          const pageHeight = originalDims.height;
          const fontSize = item.height * page.scale;
          const left = item.x * page.scale;
          const top = (pageHeight - item.y - item.height) * page.scale;
          const w = item.width * page.scale;

          return (
              <div
                  key={item.id}
                  onDoubleClick={(e) => {
                      e.stopPropagation();
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
                      onSelect(item.id);
                  }}
                  style={{
                      position: 'absolute',
                      left,
                      top,
                      width: Math.max(10, w),
                      height: Math.max(10, fontSize * 1.2),
                      cursor: 'text',
                      zIndex: 10,
                  }}
                  className="hover:bg-sky-500/10 hover:ring-2 hover:ring-sky-400 transition-all rounded-sm"
                  title="Double-click to edit"
              />
          );
      })}
      
      {/* Highlights */}
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
            isSelected={selectedId === change.id}
            onSelect={() => onSelect(change.id)}
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
         <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 150 }}>
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

const PdfEditor: React.FC = () => {
  const { t } = useLanguage();
  
  // Workflow
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'editor' | 'success'>('upload');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  // State
  const [pages, setPages] = useState<PageState[]>([]);
  const [history, setHistory] = useState<PageState[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeTool, setActiveTool] = useState<ToolType>('cursor');
  
  const [textSettings, setTextSettings] = useState({
      fontSize: 14,
      fontFamily: 'Helvetica',
      color: '#000000',
      fontWeight: 'normal' as 'normal' | 'bold',
      fontStyle: 'normal' as 'normal' | 'italic'
  });

  const [shapeSettings, setShapeSettings] = useState({
      strokeColor: '#000000',
      strokeWidth: 2
  });
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  const [selectedPageIdx, setSelectedPageIdx] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]); 
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null); 

  // --- ACTIONS ---

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

  const performSearch = async () => {
    if (!file || !findText) return;
    setSearchLoading(true);
    setSearchResults([]);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const matches: SearchMatch[] = [];

      const pattern = wholeWord ? `\\b${escapeRegExp(findText)}\\b` : escapeRegExp(findText);
      const flags = matchCase ? 'g' : 'gi';
      const regex = new RegExp(pattern, flags);

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const { width, height } = page.getViewport({ scale: 1 });
        const textContent = await page.getTextContent();
        
        textContent.items.forEach((item: any) => {
          if ('str' in item) {
            const text = item.str;
            regex.lastIndex = 0;
            let match;
            while ((match = regex.exec(text)) !== null) {
               const fontSize = Math.sqrt(item.transform[0]*item.transform[0] + item.transform[1]*item.transform[1]);
               const fullWidth = item.width;
               const charWidth = fullWidth / text.length;
               const startIndex = match.index;
               const matchLength = match[0].length;
               const matchX = item.transform[4] + (startIndex * charWidth);
               const actualMatchWidth = charWidth * matchLength;
               const pdfY = item.transform[5];
               const appY = height - pdfY - fontSize * 0.8; 
               
               matches.push({
                 id: Math.random().toString(),
                 pageIndex: i - 1, 
                 text: match[0],
                 x: matchX,
                 y: appY,
                 width: actualMatchWidth,
                 height: fontSize,
                 fontSize: fontSize
               });
            }
          }
        });
      }
      
      setSearchResults(matches);
      setCurrentMatchIndex(0);
      if (matches.length > 0) {
        setSelectedPageIdx(matches[0].pageIndex);
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
    
    const newPages = [...pages];
    newPages[match.pageIndex].annotations.push(whiteoutAnn, textAnn);
    updatePages(newPages);
    
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
          scale: 1.5, 
          annotations: [],
          textChanges: {},
        });
      }
      const initialHistory = [JSON.parse(JSON.stringify(newPages))];
      setHistory(initialHistory);
      setHistoryIndex(0);
      setPages(newPages);

    } catch (err: any) {
      console.error(err);
      if (err.name === 'PasswordException') {
          alert("This file is password protected. Please unlock it first.");
      } else {
          alert("Error loading PDF");
      }
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

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
          const zoomChange = deltaY * 0.002;
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
              content: '',
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
      setSaveProgress(0);
      try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, { password: '' } as any);
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
                   if (change.newText !== change.originalText || change.fontWeight || change.fontStyle || change.textDecoration || change.color || change.fontSize || change.isNew) {
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
                           if (change.textDecoration === 'underline') {
                               const width = getFont(change.fontFamily, change.fontWeight, change.fontStyle).widthOfTextAtSize(change.newText, change.fontSize);
                               pdfPage.drawLine({
                                   start: { x: change.x, y: change.y - 2 },
                                   end: { x: change.x + width, y: change.y - 2 },
                                   thickness: 1,
                                   color: hexToRgb(change.color || '#000000'),
                               });
                           }
                       }
                   }
              });

              for (const ann of pageState.annotations) {
                  const annColor = hexToRgb(ann.color);
                  if (ann.type === 'text' && ann.content) {
                      const font = getFont(ann.fontFamily, ann.fontWeight, ann.fontStyle);
                      const size = ann.fontSize || 14;
                      pdfPage.drawText(ann.content, {
                          x: ann.x, y: height - ann.y - size,
                          size: size, font: font, color: annColor,
                      });
                      if (ann.textDecoration === 'underline') {
                           const width = font.widthOfTextAtSize(ann.content, size);
                           pdfPage.drawLine({
                               start: { x: ann.x, y: height - ann.y - size - 2 },
                               end: { x: ann.x + width, y: height - ann.y - size - 2 },
                               thickness: 1, color: annColor,
                           });
                      }
                  } else if (ann.type === 'whiteout') {
                       pdfPage.drawRectangle({
                           x: ann.x, y: height - ann.y - (ann.height || 20),
                           width: ann.width, height: ann.height, color: rgb(1, 1, 1),
                       });
                  } else if (ann.type === 'image' && ann.dataUrl) {
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
                          x: ann.x, y: height - ann.y - h,
                          width: w, height: h, rotate: degrees(ann.rotation || 0)
                      });
                  } else if ((ann.type === 'path' || ann.type === 'highlight') && ann.points && ann.points.length > 1) {
                      for(let j=0; j<ann.points.length-1; j++) {
                           pdfPage.drawLine({
                               start: { x: ann.points[j].x, y: height - ann.points[j].y },
                               end: { x: ann.points[j+1].x, y: height - ann.points[j+1].y },
                               thickness: ann.strokeWidth || 2, color: annColor,
                               opacity: ann.type === 'highlight' ? 0.3 : 1
                           });
                      }
                  } else if (ann.type === 'line' && ann.points && ann.points.length > 1) {
                        pdfPage.drawLine({
                           start: { x: ann.points[0].x, y: height - ann.points[0].y },
                           end: { x: ann.points[1].x, y: height - ann.points[1].y },
                           thickness: ann.strokeWidth || 2, color: annColor,
                       });
                  } else if (ann.type === 'rect') {
                      pdfPage.drawRectangle({
                          x: ann.x, y: height - ann.y - (ann.height || 0),
                          width: ann.width, height: ann.height,
                          borderColor: annColor, borderWidth: ann.strokeWidth || 2,
                      });
                  } else if (ann.type === 'circle') {
                      const rx = (ann.width || 0) / 2;
                      const ry = (ann.height || 0) / 2;
                      pdfPage.drawEllipse({
                          x: ann.x + rx, y: height - (ann.y + ry),
                          xScale: rx, yScale: ry, borderColor: annColor,
                          borderWidth: ann.strokeWidth || 2,
                      });
                  } else if (ann.type === 'form-check') {
                       pdfPage.drawText('✓', {
                           x: ann.x, y: height - ann.y - 14, size: 20, font: helvetica, color: annColor
                       });
                  } else if (ann.type === 'form-cross') {
                       pdfPage.drawText('✕', {
                           x: ann.x, y: height - ann.y - 14, size: 20, font: helvetica, color: annColor
                       });
                  }
              }
              setSaveProgress(Math.round(((i + 1) / pages.length) * 100));
          }
          
          const pdfBytes = await newPdf.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setResultUrl(url);
          setStep('success');

      } catch (err: any) {
          console.error(err);
          if (err.message && (err.message.includes('encrypted') || err.message.includes('password'))) {
              alert("This file is password protected. Please unlock it first.");
          } else {
              alert("Failed to save PDF: " + err);
          }
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
              flex items-center gap-2 px-4 py-2.5 rounded text-sm font-semibold transition-all border whitespace-nowrap
              ${active 
                  ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-800 shadow-sm' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-transparent dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-sky-600 dark:hover:text-sky-400'
              }
          `}
      >
          <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-sky-500'}`} />
          <span>{label}</span>
          {dropdown && <ChevronDown className={`w-3 h-3 ml-0.5 opacity-50 transition-transform ${active ? 'rotate-180' : ''}`} />}
      </button>
  );

  const renderSejdaToolbar = () => (
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-[60px] z-40 shadow-sm py-2 transition-colors duration-300">
          <div className="max-w-[1440px] mx-auto px-6 flex items-center gap-2 flex-wrap min-h-[44px]">
              
              {/* NAVIGATION GROUP */}
              <div className="flex bg-gray-50/80 dark:bg-gray-800/80 rounded-xl p-1 border border-gray-100 dark:border-gray-700 items-center">
                  <ToolbarButton 
                      icon={MousePointer2} label="Select" active={activeTool === 'cursor'} 
                      onClick={() => setActiveTool('cursor')} 
                      tooltip="Select and move items"
                  />
                  <ToolbarButton 
                      icon={Hand} label="Pan" active={activeTool === 'hand'} 
                      onClick={() => setActiveTool('hand')} 
                      tooltip="Pan tool (drag to scroll)"
                  />
              </div>

              <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

              {/* CONTENT GROUP */}
              <div className="flex gap-1 items-center">
                  <ToolbarButton 
                      icon={Type} label="Text" active={activeTool === 'text'} 
                      onClick={() => setActiveTool(activeTool === 'text' ? 'cursor' : 'text')} 
                      tooltip="Insert text into PDF"
                  />
                  <ToolbarButton 
                      icon={LinkIcon} label="Links" active={activeTool === 'link'} 
                      onClick={() => setActiveTool(activeTool === 'link' ? 'cursor' : 'link')} 
                      tooltip="Create a clickable link"
                  />
                  <div className="relative group">
                      <ToolbarButton icon={ImageIcon} label="Images" dropdown onClick={() => {}} active={activeTool === 'image'} tooltip="Insert an image" />
                      <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 rounded-xl p-2 hidden group-hover:block min-w-[160px] z-[60]">
                           <button onClick={() => imageInputRef.current?.click()} className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"><FileUp className="w-4 h-4 text-sky-500 dark:text-sky-400"/> Upload Image</button>
                      </div>
                  </div>
              </div>

              <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

              {/* FILL & SIGN GROUP */}
              <div className="flex gap-1 items-center">
                  <div className="relative group">
                      <ToolbarButton icon={PenTool} label="Sign" dropdown onClick={() => {}} active={activeTool === 'sign'} tooltip="Sign document" />
                       <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 rounded-xl p-2 hidden group-hover:block min-w-[160px] z-[60]">
                           <button onClick={() => setActiveTool('sign')} className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"><PenTool className="w-4 h-4 text-sky-500 dark:text-sky-400"/> New Signature</button>
                       </div>
                  </div>
                  <div className="relative group">
                      <ToolbarButton icon={CheckSquare} label="Forms" dropdown onClick={() => {}} active={activeTool.startsWith('form')} tooltip="Insert form symbols" />
                      <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 rounded-xl p-2 hidden group-hover:block min-w-[160px] z-[60]">
                          <button onClick={() => setActiveTool('form-check')} className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"><Check className="w-4 h-4 text-green-500 dark:text-green-400"/> Checkmark</button>
                          <button onClick={() => setActiveTool('form-cross')} className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"><X className="w-4 h-4 text-red-500 dark:text-red-400"/> Cross</button>
                      </div>
                  </div>
              </div>

              <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

              {/* DRAW & MOD GROUP */}
              <div className="flex gap-1 items-center">
                  <ToolbarButton 
                      icon={Eraser} label="Whiteout" active={activeTool === 'whiteout'}
                      onClick={() => setActiveTool(activeTool === 'whiteout' ? 'cursor' : 'whiteout')} 
                      tooltip="Hide content with whiteout"
                  />
                  <div className="relative group">
                      <ToolbarButton icon={Highlighter} label="Annotate" dropdown onClick={() => {}} active={activeTool.startsWith('annotate')} tooltip="Draw or highlight" />
                      <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 rounded-xl p-2 hidden group-hover:block min-w-[160px] z-[60]">
                          <button onClick={() => setActiveTool('annotate-highlight')} className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"><Highlighter className="w-4 h-4 text-yellow-500 dark:text-yellow-400"/> Highlight</button>
                          <button onClick={() => setActiveTool('annotate-pen')} className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"><PenTool className="w-4 h-4 text-sky-500 dark:text-sky-400"/> Free Draw</button>
                      </div>
                  </div>
                  <div className="relative group">
                       <ToolbarButton icon={Square} label="Shapes" dropdown onClick={() => {}} active={activeTool.startsWith('shape')} tooltip="Insert shapes" />
                       <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 rounded-xl p-2 hidden group-hover:block min-w-[160px] z-[60]">
                           <button onClick={() => setActiveTool('shape-rect')} className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"><Square className="w-4 h-4 text-sky-500 dark:text-sky-400"/> Rectangle</button>
                           <button onClick={() => setActiveTool('shape-circle')} className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"><Circle className="w-4 h-4 text-sky-500 dark:text-sky-400"/> Ellipse</button>
                           <button onClick={() => setActiveTool('shape-line')} className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"><Minus className="w-4 h-4 text-sky-500 dark:text-sky-400"/> Line</button>
                       </div>
                  </div>
              </div>

              <div className="hidden lg:block h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
              
              <ToolbarButton 
                  icon={Search} label="Find" active={isSearchOpen}
                  onClick={() => setIsSearchOpen(!isSearchOpen)} 
                  tooltip="Find and replace text"
              />

              <div className="flex-1 min-w-[20px]"></div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={undo} 
                  disabled={historyIndex <= 0} 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 disabled:opacity-30 border border-sky-100 dark:border-sky-900/50 whitespace-nowrap transition-all"
                  title="Undo last action"
                >
                    <Undo className="w-4 h-4"/> Undo
                </button>
              </div>
          </div>
      </div>
  );

  const renderSearchPanel = () => {
      if (!isSearchOpen) return null;
      return (
          <div className="absolute top-[135px] right-8 z-50 bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-85 animate-in slide-in-from-top-4 transition-colors">
              <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <Search className="w-4 h-4 text-sky-500 dark:text-sky-400" /> Find & Replace
                  </h3>
                  <button onClick={() => setIsSearchOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <X className="w-4 h-4" />
                  </button>
              </div>
              <div className="space-y-4">
                  <div>
                      <input 
                          type="text" 
                          placeholder="Find text..." 
                          className="w-full border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:border-sky-500 outline-none transition-all"
                          value={findText}
                          onChange={(e) => setFindText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                      />
                  </div>
                  <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                          <input type="checkbox" checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} className="rounded text-sky-600 focus:ring-sky-500 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"/> Match case
                      </label>
                      <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                          <input type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} className="rounded text-sky-600 focus:ring-sky-500 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"/> Whole words
                      </label>
                  </div>
                  <div>
                      <input 
                          type="text" 
                          placeholder="Replace with..." 
                          className="w-full border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:border-sky-500 outline-none transition-all"
                          value={replaceText}
                          onChange={(e) => setReplaceText(e.target.value)}
                      />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                      <button onClick={performSearch} disabled={searchLoading} className="bg-sky-600 dark:bg-sky-500 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-50 flex items-center shadow-lg shadow-sky-100 dark:shadow-sky-900/20 transition-all">
                          {searchLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Find
                      </button>
                      {searchResults.length > 0 && (
                          <div className="flex items-center gap-3 text-xs font-black text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                              <button onClick={() => { setCurrentMatchIndex(prev => Math.max(0, prev - 1)); const p = searchResults[Math.max(0, currentMatchIndex - 1)]; if(p) { setSelectedPageIdx(p.pageIndex); document.getElementById(`page-${p.pageIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }} className="p-1 hover:text-sky-600 dark:hover:text-sky-400"><ArrowLeft className="w-4 h-4" /></button>
                              <span>{currentMatchIndex + 1} / {searchResults.length}</span>
                              <button onClick={() => { setCurrentMatchIndex(prev => Math.min(searchResults.length - 1, prev + 1)); const n = searchResults[Math.min(searchResults.length - 1, currentMatchIndex + 1)]; if(n) { setSelectedPageIdx(n.pageIndex); document.getElementById(`page-${n.pageIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }} className="p-1 hover:text-sky-600 dark:hover:text-sky-400"><ArrowRight className="w-4 h-4" /></button>
                          </div>
                      )}
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <button onClick={performReplace} disabled={searchResults.length === 0} className="flex-1 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-2.5 rounded-xl text-xs font-bold transition-all">Replace</button>
                      <button onClick={performReplaceAll} disabled={searchResults.length === 0} className="flex-1 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-2.5 rounded-xl text-xs font-bold transition-all">Replace All</button>
                  </div>
              </div>
          </div>
      );
  };

  const renderToolProperties = () => {
      if (activeTool !== 'text' && !activeTool.startsWith('shape-')) return null;
      return (
        <div className="bg-gray-100/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 py-3 flex justify-center z-30 animate-in slide-in-from-top-1 transition-colors">
            <div className="flex items-center gap-4 bg-white dark:bg-gray-900 px-6 py-2.5 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700 whitespace-nowrap ring-1 ring-black/5 dark:ring-white/5">
                {activeTool === 'text' && (
                    <>
                        <div className="flex items-center gap-2 mr-2">
                            <Palette className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Text Style</span>
                        </div>
                        <select value={textSettings.fontFamily} onChange={(e) => setTextSettings({...textSettings, fontFamily: e.target.value})} className="h-10 text-sm font-semibold border-2 border-gray-50 dark:border-gray-800 rounded-xl px-3 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:border-sky-500 outline-none transition-all">
                            <option value="Helvetica">Helvetica</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Courier New">Courier</option>
                        </select>
                        <div className="flex items-center border-2 border-gray-50 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-950 overflow-hidden h-10">
                            <button onClick={() => setTextSettings({...textSettings, fontSize: Math.max(6, textSettings.fontSize - 1)})} className="px-3 hover:bg-white dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                            <input type="number" value={textSettings.fontSize} onChange={(e) => setTextSettings({...textSettings, fontSize: Number(e.target.value)})} className="w-12 text-xs font-black text-center bg-transparent border-none p-0 h-full text-gray-800 dark:text-gray-100" />
                            <button onClick={() => setTextSettings({...textSettings, fontSize: Math.min(144, textSettings.fontSize + 1)})} className="px-3 hover:bg-white dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="relative group/cp">
                            <button className="w-10 h-10 rounded-xl border-2 border-gray-50 dark:border-gray-800 flex items-center justify-center transition-all hover:scale-105 shadow-sm" style={{ backgroundColor: textSettings.color }} />
                            <div className="hidden group-hover/cp:grid absolute top-full left-0 bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 p-4 gap-2 grid-cols-4 z-50 w-44 mt-3 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                {['#000000', '#FFFFFF', '#666666', '#FF0000', '#0000FF', '#008000', '#FFFF00', '#FFA500'].map(c => (
                                    <button key={c} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: c }} onClick={() => setTextSettings({...textSettings, color: c})} />
                                ))}
                            </div>
                        </div>
                        <div className="flex bg-gray-50 dark:bg-gray-950 rounded-xl border-2 border-gray-50 dark:border-gray-800 overflow-hidden">
                            <button onClick={() => setTextSettings({...textSettings, fontWeight: textSettings.fontWeight === 'bold' ? 'normal' : 'bold'})} className={`h-10 w-11 flex items-center justify-center transition-all ${textSettings.fontWeight === 'bold' ? 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-400 shadow-inner' : 'text-gray-400 dark:text-gray-500 hover:bg-white dark:hover:bg-gray-800'}`}><Bold className="w-4 h-4" /></button>
                            <button onClick={() => setTextSettings({...textSettings, fontStyle: textSettings.fontStyle === 'italic' ? 'normal' : 'italic'})} className={`h-10 w-11 flex items-center justify-center transition-all ${textSettings.fontStyle === 'italic' ? 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-400 shadow-inner' : 'text-gray-400 dark:text-gray-500 hover:bg-white dark:hover:bg-gray-800'}`}><Italic className="w-4 h-4" /></button>
                        </div>
                    </>
                )}
                {activeTool.startsWith('shape-') && (
                    <>
                        <div className="flex items-center gap-2 mr-2">
                            <Palette className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Shape Style</span>
                        </div>
                        <div className="relative group/scp flex items-center gap-3">
                            <button className="w-10 h-10 rounded-xl border-2 border-gray-50 dark:border-gray-800 transition-all hover:scale-105 shadow-sm" style={{ backgroundColor: shapeSettings.strokeColor }} />
                            <div className="hidden group-hover/scp:grid absolute top-full left-0 bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 p-4 gap-2 grid-cols-4 z-50 w-44 mt-3 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'].map(c => (
                                    <button key={c} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: c }} onClick={() => setShapeSettings({...shapeSettings, strokeColor: c})} />
                                ))}
                            </div>
                        </div>
                        <div className="h-6 w-px bg-gray-100 dark:bg-gray-700"></div>
                        <div className="flex items-center border-2 border-gray-50 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-950 overflow-hidden h-10">
                            <button onClick={() => setShapeSettings({...shapeSettings, strokeWidth: Math.max(1, shapeSettings.strokeWidth - 1)})} className="px-3 hover:bg-white dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                            <span className="w-10 text-xs font-black text-center text-gray-700 dark:text-gray-300">{shapeSettings.strokeWidth}</span>
                            <button onClick={() => setShapeSettings({...shapeSettings, strokeWidth: Math.min(50, shapeSettings.strokeWidth + 1)})} className="px-3 hover:bg-white dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                    </>
                )}
            </div>
        </div>
      );
  };

  if (step === 'upload') {
     return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 py-20 px-4 font-sans transition-colors duration-300">
            <h1 className="text-4xl font-black text-gray-800 dark:text-gray-100 mb-3 text-center tracking-tight">Online PDF Editor</h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 text-center font-medium">Professional editing, signing, and filling for free.</p>
            <div className="w-full max-w-xl">
                <button onClick={() => fileInputRef.current?.click()} className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-7 rounded-2xl shadow-xl shadow-brand-200 dark:shadow-brand-900/20 flex items-center justify-center gap-4 text-2xl group transition-all transform hover:-translate-y-1">
                    <FileUp className="w-9 h-9 group-hover:-translate-y-1 transition-transform" />
                    Upload PDF file
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
            </div>
            <div className="mt-20 max-w-3xl text-center grid md:grid-cols-2 gap-8">
                <div className="text-left bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="font-black text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2"><Type className="w-5 h-5 text-brand-500" /> Edit Existing Text</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Double-click any text on the page to modify it directly. Change fonts, colors, and styles instantly.</p>
                </div>
                <div className="text-left bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="font-black text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2"><PenTool className="w-5 h-5 text-brand-500" /> Fill & Sign</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Add signatures, checkmarks, and custom images. Perfect for processing forms and contracts online.</p>
                </div>
            </div>
        </div>
     );
  }

  if (step === 'success' && resultUrl) {
      return (
        <div className="min-h-[80vh] bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-12 px-4 font-sans transition-colors duration-300">
            <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-8 tracking-tight">Your document is ready</h2>
            <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl shadow-gray-200 dark:shadow-black/20 border border-gray-100 dark:border-gray-800 max-w-2xl w-full text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-700">
                    <Check className="w-12 h-12" />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href={resultUrl} download={`edited_${file?.name}`} className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center gap-3 text-lg transition-all transform hover:-translate-y-1">
                        <Download className="w-6 h-6" /> Download
                    </a>
                    <button onClick={reset} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold py-4 px-8 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                        <RefreshCw className="w-5 h-5" /> Start Over
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 flex flex-col font-sans relative transition-colors duration-300">
        {processing && <ProcessingOverlay status="Applying your changes..." progress={saveProgress} />}
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
                     <div className="flex flex-col items-center mt-32">
                         <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-6" />
                         <p className="text-gray-600 dark:text-gray-400 font-black tracking-tight text-xl">Preparing your document...</p>
                     </div>
                 ) : (
                     <div className="flex flex-col items-center gap-12 pb-24">
                        {pages.map((page, idx) => (
                             <div key={idx} id={`page-${idx}`} className="flex flex-col items-center group/page">
                                 <div className="flex items-center gap-3 mb-4 transition-all opacity-40 group-hover/page:opacity-100">
                                     <span className="text-4xl text-gray-200 dark:text-gray-800 font-black group-hover/page:text-gray-400 dark:group-hover/page:text-gray-600 transition-colors">{idx + 1}</span>
                                     <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 shadow-sm">
                                         <button onClick={() => deletePage(idx)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 border-r border-gray-100 dark:border-gray-700 transition-colors" title="Delete Page"><Trash2 className="w-4 h-4"/></button>
                                         <button onClick={() => zoomPage(idx, 0.1)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 border-r border-gray-100 dark:border-gray-700" title="Zoom In"><ZoomIn className="w-4 h-4"/></button>
                                         <button onClick={() => zoomPage(idx, -0.1)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 border-r border-gray-100 dark:border-gray-700" title="Zoom Out"><ZoomOut className="w-4 h-4"/></button>
                                         <button onClick={() => rotatePage(idx, 'ccw')} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 border-r border-gray-100 dark:border-gray-700" title="Rotate Left"><RotateCcw className="w-4 h-4"/></button>
                                         <button onClick={() => rotatePage(idx, 'cw')} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800" title="Rotate Right"><RotateCw className="w-4 h-4"/></button>
                                     </div>
                                     <button 
                                        onClick={() => insertPage(idx)}
                                        className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 border border-sky-100 dark:border-sky-900 rounded-xl px-4 py-2 bg-white dark:bg-gray-900 shadow-sm transition-all"
                                     >
                                         <PlusCircle className="w-4 h-4"/> Insert Page
                                     </button>
                                 </div>
                                 <div className="shadow-2xl shadow-black/10 dark:shadow-black/40 rounded-sm">
                                     <PdfPageRenderer 
                                        page={page} index={idx} file={file}
                                        activeTool={activeTool} selectedId={selectedId}
                                        isDrawing={isDrawing && selectedPageIdx === idx}
                                        currentPath={currentPath} dragStart={dragStart}
                                        shapeSettings={shapeSettings} searchResults={searchResults}
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
                                                x: change.x + 10, y: change.y - 10, 
                                                content: change.newText,
                                                fontSize: change.fontSize,
                                                fontFamily: change.fontFamily,
                                                color: change.color || '#000000',
                                                fontWeight: change.fontWeight,
                                                fontStyle: change.fontStyle,
                                                textDecoration: change.textDecoration
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
                        <button 
                            onClick={() => insertPage(pages.length)}
                            className="flex flex-col items-center justify-center gap-3 p-10 border-4 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl text-gray-400 dark:text-gray-600 hover:text-brand-500 hover:border-brand-200 dark:hover:border-brand-900 hover:bg-white dark:hover:bg-gray-900 transition-all w-[300px] group"
                        >
                            <PlusCircle className="w-12 h-12 group-hover:scale-110 transition-transform"/>
                            <span className="font-black uppercase tracking-widest text-sm">Add New Page</span>
                        </button>
                     </div>
                 )}
             </div>
        </div>

        <div className="bg-[#fff9e6] dark:bg-gray-900 border-t border-orange-100 dark:border-gray-800 p-5 sticky bottom-0 z-50 flex justify-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors">
             <div className="max-w-md w-full">
                 <button 
                     onClick={savePdf}
                     disabled={processing || loading}
                     className="w-full bg-[#009b72] dark:bg-[#007b5a] hover:bg-[#008a65] disabled:opacity-70 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-200 dark:shadow-black/20 flex items-center justify-center gap-3 text-xl transition-all transform hover:-translate-y-1"
                 >
                     {processing ? <Loader2 className="w-6 h-6 animate-spin mr-1" /> : <Save className="w-6 h-6 mr-1" />}
                     Apply changes
                 </button>
             </div>
        </div>
    </div>
  );
};

export default PdfEditor;
