import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { 
  FileUp, Download, Plus, Type, CheckSquare, List, AlignLeft, 
  Trash2, Settings, Save, Loader2, MousePointer, ChevronDown,
  Calendar, PenTool, AlertCircle, CircleDot, ZoomIn, ZoomOut, PlusCircle, Copy, X, Maximize, Undo, Minus
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// --- TYPES ---

type FieldType = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'textarea' | 'label' | 'date' | 'signature';

interface FormField {
  id: string;
  pageId: string; // Linked to a specific page
  type: FieldType;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string; // PDF Field Name (must be unique)
  label?: string; // Visible label or content
  placeholder?: string; // Placeholder text for inputs
  options?: string[]; // For dropdowns
  value?: string; // For radio button export value
  required?: boolean;
  fontSize?: number;
}

interface HistoryState {
    pages: string[];
    fields: FormField[];
}

// Constants for A4 size (approx 72 DPI)
// A4 is 595 x 842 points
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

const CreateForms: React.FC = () => {
  const { t } = useLanguage();
  
  // State
  const [pages, setPages] = useState<string[]>(['page-1']);
  const [fields, setFields] = useState<FormField[]>([]);
  const [activePageId, setActivePageId] = useState<string>('page-1');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  
  // History State
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Interaction State
  const [processing, setProcessing] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // Used for move offset or resize start pos
  const [validationError, setValidationError] = useState<string | null>(null);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // --- ACTIONS ---

  const saveHistory = () => {
      const currentState: HistoryState = {
          pages: [...pages],
          fields: JSON.parse(JSON.stringify(fields))
      };
      
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(currentState);
      
      // Limit history size if needed
      if (newHistory.length > 20) newHistory.shift();
      
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
      if (historyIndex > 0) {
          const prevState = history[historyIndex - 1];
          setPages(prevState.pages);
          setFields(prevState.fields);
          setHistoryIndex(historyIndex - 1);
          // If the selected field no longer exists, deselect
          if (selectedId && !prevState.fields.find(f => f.id === selectedId)) {
              setSelectedId(null);
          }
      }
  };

  // Initial history state
  useEffect(() => {
      if (history.length === 0) {
          saveHistory();
      }
  }, []);

  const handleFitWidth = () => {
      if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth;
          const availableWidth = containerWidth - 80; 
          const newScale = availableWidth / PAGE_WIDTH;
          setScale(Math.max(0.5, Math.min(newScale, 2.5)));
      }
  };

  useEffect(() => {
      const timer = setTimeout(handleFitWidth, 50);
      window.addEventListener('resize', handleFitWidth);
      return () => {
          clearTimeout(timer);
          window.removeEventListener('resize', handleFitWidth);
      };
  }, []);

  const addPage = (targetIndex: number = -1) => {
    saveHistory();
    const newPageId = `page-${Math.random().toString(36).substr(2, 9)}`;
    const newPages = [...pages];
    
    if (targetIndex === -1) {
        newPages.push(newPageId);
    } else {
        newPages.splice(targetIndex, 0, newPageId);
    }
    
    setPages(newPages);
    setActivePageId(newPageId);
  };

  const deletePage = (pageId: string) => {
      if (pages.length <= 1) {
          alert("At least one page is required.");
          return;
      }
      saveHistory();
      const newPages = pages.filter(p => p !== pageId);
      setPages(newPages);
      setFields(prev => prev.filter(f => f.pageId !== pageId));
      if (activePageId === pageId) {
          setActivePageId(newPages[0]);
      }
  };

  const addField = (type: FieldType) => {
    saveHistory();
    const id = Math.random().toString(36).substr(2, 9);
    const uniqueSuffix = Math.random().toString(36).substr(2, 5);
    
    let width = 150;
    let height = 30;
    let label = '';
    
    if (type === 'text') label = 'Text Field';
    if (type === 'checkbox') { width = 20; height = 20; label = 'Check'; }
    if (type === 'radio') { width = 20; height = 20; label = 'Radio'; }
    if (type === 'textarea') { width = 200; height = 80; label = 'Text Area'; }
    if (type === 'label') { width = 200; height = 24; label = 'Static Text'; }
    if (type === 'date') { width = 140; height = 30; label = 'Date'; }
    if (type === 'signature') { width = 200; height = 60; label = 'Sign Here'; }

    const fieldsOnPage = fields.filter(f => f.pageId === activePageId).length;

    const newField: FormField = {
      id,
      pageId: activePageId,
      type,
      x: 50 + (fieldsOnPage * 10) % 200,
      y: 50 + (fieldsOnPage * 30) % 600,
      width,
      height,
      name: type === 'radio' ? `RadioGroup_${uniqueSuffix}` : `${type}_${uniqueSuffix}`,
      label: label,
      placeholder: type === 'text' || type === 'textarea' ? 'Enter text...' : undefined,
      options: type === 'dropdown' ? ['Option 1', 'Option 2'] : undefined,
      value: type === 'radio' ? `Option_${uniqueSuffix}` : undefined,
      required: false,
      fontSize: 12
    };

    setFields([...fields, newField]);
    setSelectedId(id);
    setValidationError(null);
  };

  const addRadioOption = () => {
    const parentField = fields.find(f => f.id === selectedId);
    if (!parentField || parentField.type !== 'radio') return;
    
    saveHistory();
    const id = Math.random().toString(36).substr(2, 9);
    const uniqueSuffix = Math.random().toString(36).substr(2, 5);
    
    let newY = parentField.y + parentField.height + 10;
    if (newY + parentField.height > PAGE_HEIGHT) {
        newY = parentField.y;
    }

    const newField: FormField = {
      id,
      pageId: parentField.pageId,
      type: 'radio',
      x: parentField.x,
      y: newY,
      width: parentField.width,
      height: parentField.height,
      name: parentField.name, 
      label: 'Radio',
      value: `Option_${uniqueSuffix}`,
      required: parentField.required,
      fontSize: parentField.fontSize || 12
    };

    setFields([...fields, newField]);
    setSelectedId(id);
  };

  // Helper for text inputs to save history on blur
  const handlePropertyBlur = () => {
      saveHistory();
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id: string) => {
    saveHistory();
    setFields(fields.filter(f => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // --- MOUSE HANDLING (Drag & Resize) ---

  const handleMouseDown = (e: React.MouseEvent, id: string, pageId: string, isResizeHandle: boolean) => {
      e.stopPropagation();
      e.preventDefault(); 
      
      const field = fields.find(f => f.id === id);
      if (!field) return;

      const pageEl = document.getElementById(`page-container-${pageId}`);
      if (!pageEl) return;

      const pageRect = pageEl.getBoundingClientRect();
      const mouseX = e.clientX - pageRect.left;
      const mouseY = e.clientY - pageRect.top;
      const logicalMouseX = mouseX / scale;
      const logicalMouseY = mouseY / scale;

      setDraggedId(id);
      setSelectedId(id);
      setActivePageId(pageId);
      setIsResizing(isResizeHandle);

      if (isResizeHandle) {
          // Resize start
      } else {
          // Move logic
          setDragOffset({
              x: logicalMouseX - field.x,
              y: logicalMouseY - field.y
          });
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!draggedId) return;

      const field = fields.find(f => f.id === draggedId);
      if (!field) return;

      const pageEl = document.getElementById(`page-container-${field.pageId}`);
      if (!pageEl) return;

      const pageRect = pageEl.getBoundingClientRect();
      const mouseX = e.clientX - pageRect.left;
      const mouseY = e.clientY - pageRect.top;
      const logicalMouseX = mouseX / scale;
      const logicalMouseY = mouseY / scale;

      if (isResizing) {
          // Calculate new dimensions
          let newWidth = logicalMouseX - field.x;
          let newHeight = logicalMouseY - field.y;

          // Constraints
          newWidth = Math.max(10, newWidth); 
          newHeight = Math.max(10, newHeight); 
          
          // Max constraints
          if (field.x + newWidth > PAGE_WIDTH) newWidth = PAGE_WIDTH - field.x;
          if (field.y + newHeight > PAGE_HEIGHT) newHeight = PAGE_HEIGHT - field.y;

          setFields(prev => prev.map(f => f.id === draggedId ? { ...f, width: newWidth, height: newHeight } : f));

      } else {
          // Move Logic
          let newX = logicalMouseX - dragOffset.x;
          let newY = logicalMouseY - dragOffset.y;

          // Snap to grid (10px)
          newX = Math.round(newX / 10) * 10;
          newY = Math.round(newY / 10) * 10;

          // Bounds checking
          newX = Math.max(0, Math.min(newX, PAGE_WIDTH - field.width));
          newY = Math.max(0, Math.min(newY, PAGE_HEIGHT - field.height));

          setFields(prev => prev.map(f => f.id === draggedId ? { ...f, x: newX, y: newY } : f));
      }
  };

  const handleMouseUp = () => {
      if (draggedId) {
          // Dragging finished, save state
          saveHistory();
      }
      setDraggedId(null);
      setIsResizing(false);
  };

  // --- PDF GENERATION ---

  const generatePdf = async () => {
    const emptyNames = fields.filter(f => f.type !== 'label' && !f.name.trim());
    if (emptyNames.length > 0) {
        setValidationError(`All form fields must have a Field Name. (Type: ${emptyNames[0].type})`);
        return;
    }
    
    const names = fields.filter(f => f.type !== 'radio' && f.type !== 'label').map(f => f.name);
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
        setValidationError("Field Names must be unique (except Radio buttons).");
        return;
    }

    const invalidDropdown = fields.find(f => f.type === 'dropdown' && (!f.options || f.options.filter(o => o.trim()).length === 0));
    if (invalidDropdown) {
        setValidationError(`Dropdown field "${invalidDropdown.name}" must have at least one option.`);
        return;
    }

    const invalidRadio = fields.find(f => f.type === 'radio' && !f.value?.trim());
    if (invalidRadio) {
        setValidationError(`Radio button in group "${invalidRadio.name}" is missing an Option Value.`);
        return;
    }

    const radioFields = fields.filter(f => f.type === 'radio');
    const radioGroups: Record<string, Set<string>> = {};
    for (const f of radioFields) {
        const groupName = f.name;
        const val = f.value?.trim() || ''; 
        
        if (!radioGroups[groupName]) {
            radioGroups[groupName] = new Set();
        }
        
        if (radioGroups[groupName].has(val)) {
            setValidationError(`Radio Group "${groupName}" has duplicate option value: "${val}". Each button must have a unique value.`);
            return;
        }
        radioGroups[groupName].add(val);
    }

    setProcessing(true);
    setValidationError(null);

    try {
      const pdfDoc = await PDFDocument.create();
      const form = pdfDoc.getForm();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Iterate Pages
      for (const pageId of pages) {
          const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          const pageFields = fields.filter(f => f.pageId === pageId);

          for (const field of pageFields) {
              const x = Number(field.x) || 0;
              const y = Number(field.y) || 0;
              const width = Number(field.width) || 0;
              const height = Number(field.height) || 0;
              const name = String(field.name || '');
              const label = String(field.label || '');
              
              const pdfY = PAGE_HEIGHT - y - height;

              if (field.type === 'label') {
                  page.drawText(label, { x, y: pdfY + height - (field.fontSize || 12), size: field.fontSize || 12, font: helvetica });
                  continue;
              }

              if (field.type === 'radio') {
                  let radioGroup;
                  try {
                      radioGroup = form.getRadioGroup(name);
                  } catch (e) {
                      radioGroup = form.createRadioGroup(name);
                  }
                  
                  const optionValue = field.value!.trim();
                  radioGroup.addOptionToPage(optionValue, page, {
                      x, y: pdfY, width, height,
                      borderColor: rgb(0, 0, 0),
                      borderWidth: 1,
                  });
                  continue;
              }

              if (field.type === 'text') {
                  const textField = form.createTextField(name);
                  textField.addToPage(page, { x, y: pdfY, width, height });
                  if (field.placeholder) textField.setText(String(field.placeholder));
                  if (field.required) textField.enableRequired();
                  if (field.fontSize) textField.setFontSize(field.fontSize);
              }
              else if (field.type === 'date') {
                  const dateField = form.createTextField(name);
                  dateField.addToPage(page, { x, y: pdfY, width, height });
                  if (field.placeholder) dateField.setText(String(field.placeholder));
                  if (field.required) dateField.enableRequired();
                  if (field.fontSize) dateField.setFontSize(field.fontSize);
              }
              else if (field.type === 'textarea') {
                  const textField = form.createTextField(name);
                  textField.addToPage(page, { x, y: pdfY, width, height });
                  textField.enableMultiline();
                  if (field.placeholder) textField.setText(String(field.placeholder));
                  if (field.required) textField.enableRequired();
                  if (field.fontSize) textField.setFontSize(field.fontSize);
              }
              else if (field.type === 'checkbox') {
                  const checkBox = form.createCheckBox(name);
                  checkBox.addToPage(page, { x, y: pdfY, width, height });
                  if (field.required) checkBox.enableRequired();
              }
              else if (field.type === 'dropdown') {
                  const dropdown = form.createDropdown(name);
                  dropdown.addToPage(page, { x, y: pdfY, width, height });
                  if (field.options) dropdown.setOptions(field.options.filter(o => o.trim() !== ''));
                  if (field.required) dropdown.enableRequired();
                  if (field.fontSize) dropdown.setFontSize(field.fontSize);
              }
              else if (field.type === 'signature') {
                  const sigBtn = form.createButton(name);
                  sigBtn.addToPage('Sign Here', page, { 
                      x, y: pdfY, width, height, 
                      font: helvetica,
                      textColor: rgb(0.5, 0.5, 0.5),
                  });
                  if (field.fontSize) sigBtn.setFontSize(field.fontSize);
              }
          }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'custom_form.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error: any) {
        console.error("PDF Gen Error:", error);
        setValidationError(`Failed to generate: ${error.message || error}`);
    } finally {
        setProcessing(false);
    }
  };

  const selectedField = fields.find(f => f.id === selectedId);

  // --- VIEWS ---

  return (
    <div className="h-[calc(100vh-60px)] flex bg-gray-100 font-sans overflow-hidden">
      
      {/* LEFT TOOLBAR */}
      <div className="w-16 md:w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4 z-20">
        <ToolBtn icon={Type} label="Text" onClick={() => addField('text')} />
        <ToolBtn icon={List} label="Area" onClick={() => addField('textarea')} />
        <ToolBtn icon={CheckSquare} label="Check" onClick={() => addField('checkbox')} />
        <ToolBtn icon={CircleDot} label="Radio" onClick={() => addField('radio')} />
        <ToolBtn icon={ChevronDown} label="Drop" onClick={() => addField('dropdown')} />
        <ToolBtn icon={AlignLeft} label="Label" onClick={() => addField('label')} />
        <ToolBtn icon={Calendar} label="Date" onClick={() => addField('date')} />
        <ToolBtn icon={PenTool} label="Sign" onClick={() => addField('signature')} />
      </div>

      {/* CENTER CANVAS AREA */}
      <div 
        className="flex-1 bg-gray-100 overflow-auto relative flex flex-col items-center p-8 pb-32"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        ref={containerRef}
      >
        <div className="flex flex-col gap-8 items-center w-full">
            {pages.map((pageId, index) => (
                <div key={pageId} className="flex flex-col items-center gap-2">
                    
                    {/* Page Header */}
                    <div className="flex items-center gap-4 bg-white/50 px-4 py-1 rounded-full text-sm text-gray-500 backdrop-blur-sm">
                        <span>Page {index + 1}</span>
                        <button onClick={() => deletePage(pageId)} className="hover:text-red-500" title="Delete Page"><Trash2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => addPage(index)} className="hover:text-brand-500" title="Insert Page Before"><PlusCircle className="w-3.5 h-3.5" /></button>
                    </div>

                    {/* Page Canvas */}
                    <div 
                        id={`page-container-${pageId}`}
                        onClick={() => { setActivePageId(pageId); setSelectedId(null); }}
                        className={`relative bg-white shadow-lg transition-all ring-offset-4 ${activePageId === pageId ? 'ring-2 ring-brand-500' : 'hover:ring-2 hover:ring-gray-300'}`}
                        style={{ 
                            width: PAGE_WIDTH * scale, 
                            height: PAGE_HEIGHT * scale,
                        }}
                    >
                        {/* Grid Background */}
                        <div 
                            className="absolute inset-0 pointer-events-none opacity-10" 
                            style={{ 
                                backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`, 
                                backgroundSize: `${20 * scale}px ${20 * scale}px` 
                            }} 
                        />

                        {/* Fields */}
                        {fields.filter(f => f.pageId === pageId).map(field => {
                            const isSelected = selectedId === field.id;
                            const isGroupSibling = selectedField?.type === 'radio' && field.type === 'radio' && field.name === selectedField.name;
                            
                            return (
                                <div
                                    key={field.id}
                                    onMouseDown={(e) => handleMouseDown(e, field.id, pageId, false)}
                                    className={`
                                        absolute flex items-center px-2 text-sm border cursor-move select-none group overflow-hidden
                                        ${isSelected ? 'border-brand-500 bg-brand-50/20 z-10' : isGroupSibling ? 'border-brand-300 border-dashed z-0' : 'border-gray-400 bg-white hover:border-brand-300'}
                                    `}
                                    style={{
                                        left: field.x * scale,
                                        top: field.y * scale,
                                        width: field.width * scale,
                                        height: field.height * scale,
                                        fontSize: `${(field.fontSize || 12) * scale}px`, // Scaled font size
                                    }}
                                >
                                    {/* Render Visual Representation */}
                                    {field.type === 'label' ? (
                                        <span className="w-full truncate">{field.label}</span>
                                    ) : field.type === 'checkbox' ? (
                                        <div className="w-full h-full flex items-center justify-center pointer-events-none">
                                            <div className={`border border-gray-400 rounded-sm`} style={{ width: '70%', height: '70%' }} />
                                        </div>
                                    ) : field.type === 'radio' ? (
                                        <div className="w-full h-full flex items-center justify-center pointer-events-none">
                                            <div className={`border border-gray-400 rounded-full`} style={{ width: '70%', height: '70%' }}>
                                                <div className="w-full h-full rounded-full bg-gray-200 transform scale-50" />
                                            </div>
                                        </div>
                                    ) : field.type === 'signature' ? (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 italic">
                                            Sign Here
                                        </div>
                                    ) : (
                                        <div className="w-full text-gray-400 truncate pointer-events-none">
                                            {field.label} <span className="text-xs opacity-50">({field.name})</span>
                                        </div>
                                    )}

                                    {/* Resize handle */}
                                    {isSelected && (
                                        <div 
                                            className="absolute bottom-0 right-0 w-3 h-3 bg-brand-500 cursor-se-resize hover:scale-125 transition-transform z-50"
                                            onMouseDown={(e) => handleMouseDown(e, field.id, pageId, true)}
                                        />
                                    )}
                                    
                                    {/* Link indicator for grouped radios */}
                                    {isGroupSibling && !isSelected && (
                                        <div className="absolute top-0 right-0 p-0.5 bg-brand-100 text-brand-500 rounded-bl text-[8px]">Linked</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Add Page Big Button */}
            <button 
                onClick={() => addPage(-1)}
                className="flex flex-col items-center justify-center w-full max-w-[200px] h-32 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-brand-400 hover:text-brand-500 hover:bg-white transition-all gap-2"
            >
                <PlusCircle className="w-8 h-8" />
                <span className="font-medium">Add New Page</span>
            </button>
        </div>
      </div>

      {/* RIGHT SIDEBAR (Properties) */}
      <div className="w-72 bg-white border-l border-gray-200 flex flex-col z-20">
        <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Settings className="w-4 h-4" /> Properties
            </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {!selectedField ? (
                <div className="text-center text-gray-400 mt-10">
                    <MousePointer className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>Select a field to edit its properties</p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 uppercase">
                            {selectedField.type === 'radio' ? 'Group Name' : 'Field Name (Internal)'}
                        </label>
                        <input 
                            type="text" 
                            value={selectedField.name}
                            onChange={(e) => updateField(selectedField.id, { name: e.target.value.replace(/\s+/g, '_') })}
                            onBlur={handlePropertyBlur}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            placeholder="unique_name"
                        />
                        <p className="text-[10px] text-gray-400">Must be unique for PDF forms.</p>
                    </div>

                    {(selectedField.type === 'text' || selectedField.type === 'textarea' || selectedField.type === 'label') && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Label / Content</label>
                            <input 
                                type="text" 
                                value={selectedField.label}
                                onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                                onBlur={handlePropertyBlur}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                        </div>
                    )}

                    {(selectedField.type === 'text' || selectedField.type === 'textarea') && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Placeholder</label>
                            <input 
                                type="text" 
                                value={selectedField.placeholder || ''}
                                onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                                onBlur={handlePropertyBlur}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                        </div>
                    )}

                    {selectedField.type === 'radio' && (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Option Value</label>
                                <input 
                                    type="text" 
                                    value={selectedField.value || ''}
                                    onChange={(e) => updateField(selectedField.id, { value: e.target.value })}
                                    onBlur={handlePropertyBlur}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                />
                                <p className="text-[10px] text-gray-400">Radio buttons with same Name form a group.</p>
                            </div>
                            <div className="pt-2">
                                <button 
                                    onClick={addRadioOption}
                                    className="w-full py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded text-sm hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <PlusCircle className="w-4 h-4" /> Add Option to Group
                                </button>
                            </div>
                        </>
                    )}

                    {selectedField.type === 'dropdown' && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Options</label>
                            <textarea 
                                value={selectedField.options?.join('\n')}
                                onChange={(e) => updateField(selectedField.id, { options: e.target.value.split('\n') })}
                                onBlur={handlePropertyBlur}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm h-24"
                                placeholder="One option per line"
                            />
                        </div>
                    )}

                    {/* Font Size Control for relevant fields */}
                    {(['text', 'textarea', 'dropdown', 'label', 'date', 'signature'].includes(selectedField.type)) && (
                        <div className="pt-4 border-t border-gray-100">
                            <label className="text-xs font-bold text-gray-500 uppercase">Text Style</label>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] text-gray-400">Size</span>
                                <div className="flex items-center border border-gray-300 rounded bg-white">
                                    <button 
                                        onClick={() => {
                                            const newSize = Math.max(6, (selectedField.fontSize || 12) - 1);
                                            updateField(selectedField.id, { fontSize: newSize });
                                            saveHistory();
                                        }}
                                        className="px-2 py-1 hover:bg-gray-50 text-gray-600 border-r border-gray-300"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <input 
                                        type="number" 
                                        value={selectedField.fontSize || 12} 
                                        onChange={(e) => updateField(selectedField.id, { fontSize: Number(e.target.value) })}
                                        onBlur={handlePropertyBlur}
                                        className="w-12 text-center text-sm py-1 outline-none"
                                    />
                                    <button 
                                        onClick={() => {
                                            const newSize = Math.min(72, (selectedField.fontSize || 12) + 1);
                                            updateField(selectedField.id, { fontSize: newSize });
                                            saveHistory();
                                        }}
                                        className="px-2 py-1 hover:bg-gray-50 text-gray-600 border-l border-gray-300"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedField.type !== 'label' && selectedField.type !== 'radio' && (
                        <div className="flex items-center gap-2 pt-2">
                            <input 
                                type="checkbox" 
                                id="req"
                                checked={selectedField.required}
                                onChange={(e) => {
                                    updateField(selectedField.id, { required: e.target.checked });
                                    saveHistory();
                                }}
                                className="rounded text-brand-500 focus:ring-brand-500"
                            />
                            <label htmlFor="req" className="text-sm text-gray-700">Required Field</label>
                        </div>
                    )}

                    <div className="pt-4 border-t border-gray-100">
                        <label className="text-xs font-bold text-gray-500 uppercase">Layout</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400">Width</span>
                                <input 
                                    type="number" 
                                    value={Math.round(selectedField.width)} 
                                    onChange={(e) => updateField(selectedField.id, { width: Number(e.target.value) })} 
                                    onBlur={handlePropertyBlur}
                                    className="border rounded px-2 py-1 text-sm"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400">Height</span>
                                <input 
                                    type="number" 
                                    value={Math.round(selectedField.height)} 
                                    onChange={(e) => updateField(selectedField.id, { height: Number(e.target.value) })} 
                                    onBlur={handlePropertyBlur}
                                    className="border rounded px-2 py-1 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button 
                            onClick={() => deleteField(selectedField.id)}
                            className="w-full flex items-center justify-center gap-2 text-red-500 border border-red-200 hover:bg-red-50 py-2 rounded text-sm transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Delete Field
                        </button>
                    </div>
                </>
            )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
            {validationError && (
                <div className="mb-3 p-2 bg-red-100 border border-red-200 text-red-700 text-xs rounded flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {validationError}
                </div>
            )}
            <button 
                onClick={generatePdf}
                disabled={processing}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Download PDF Form
            </button>
        </div>
      </div>

      {/* Floating Zoom Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-md border border-gray-200 rounded-full px-4 py-2 flex items-center gap-4 z-30">
          <button onClick={() => setScale(Math.max(0.5, scale - 0.1))} className="text-gray-500 hover:text-brand-500"><ZoomOut className="w-4 h-4" /></button>
          <span className="text-xs font-medium w-8 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(Math.min(2.5, scale + 0.1))} className="text-gray-500 hover:text-brand-500"><ZoomIn className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-gray-200"></div>
          <button onClick={handleFitWidth} className="text-gray-500 hover:text-brand-500" title="Fit Width">
              <Maximize className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-gray-200"></div>
          <button 
            onClick={undo} 
            disabled={historyIndex <= 0}
            className="text-gray-500 hover:text-brand-500 disabled:opacity-30 disabled:cursor-not-allowed" 
            title="Undo"
          >
              <Undo className="w-4 h-4" />
          </button>
      </div>

    </div>
  );
};

// Subcomponent for Toolbar Buttons
const ToolBtn = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center w-12 h-12 rounded hover:bg-brand-50 text-gray-600 hover:text-brand-600 transition-colors"
        title={label}
    >
        <Icon className="w-5 h-5 mb-1" />
        <span className="text-[9px] font-medium">{label}</span>
    </button>
);

export default CreateForms;