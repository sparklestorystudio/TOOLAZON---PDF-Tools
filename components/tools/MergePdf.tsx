
import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, FileText, Trash2, ArrowUp, ArrowDown, Download, RefreshCw, Plus, GripVertical, Combine } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';
import ProcessingOverlay from '../ProcessingOverlay';

interface UploadedFile {
  id: string;
  file: File;
}

const MergePdf: React.FC = () => {
  const { t } = useLanguage();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState('Merging your PDF files...');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    
    const newFiles: UploadedFile[] = Array.from(fileList).map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === files.length - 1) return;

    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
    setFiles(newFiles);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // Drag and Drop Handlers
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newFiles = [...files];
    const [movedFile] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(dropIndex, 0, movedFile);
    
    setFiles(newFiles);
    setDraggedIndex(null);
  };

  const handleMerge = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setStatusMessage('Reading files...');

    try {
      const mergedPdf = await PDFDocument.create();
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        const uploadedFile = files[i];
        setStatusMessage(`Processing "${uploadedFile.file.name}" (${i+1} of ${totalFiles})...`);
        const arrayBuffer = await uploadedFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { password: '' } as any);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        
        setProgress(Math.round(((i + 1) / totalFiles) * 85));
      }

      setStatusMessage('Finalizing document structure...');
      const pdfBytes = await mergedPdf.save();
      setProgress(100);
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);

    } catch (error) {
      console.error("Merge error:", error);
      alert("Failed to merge PDFs. One of the files might be password protected. Please unlock it first.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setResultUrl(null);
    setProgress(0);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  };

  if (files.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 py-20 px-4 font-sans transition-colors">
        <h1 className="text-4xl font-black text-gray-800 dark:text-gray-100 mb-4 text-center tracking-tight">Merge PDF files online</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 text-center font-medium">Combine multiple PDFs and images into one</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-7 rounded-2xl shadow-xl shadow-brand-200 dark:shadow-brand-900/20 transition-all flex items-center justify-center gap-3 text-2xl group transform hover:-translate-y-1"
           >
             <FileUp className="w-9 h-9 group-hover:-translate-y-1 transition-transform" />
             Upload PDF files
           </button>
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={(e) => handleFiles(e.target.files)} 
             accept=".pdf" 
             multiple
             className="hidden" 
           />
           <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4 uppercase tracking-widest font-bold">
             Or drag and drop files here
           </p>
        </div>

        <div className="mt-20 max-w-2xl text-center">
            <h3 className="font-black text-gray-700 dark:text-gray-300 mb-3 text-lg">How to merge PDF files</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                Select multiple PDF files and merge them in seconds. Merge & combine PDF files online, easily and free. Your files are encrypted during processing and deleted permanently after 2 hours.
            </p>
        </div>
      </div>
    );
  }

  if (resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-12 px-4 font-sans transition-colors">
        <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-8 tracking-tight">Your document is ready</h2>
        
        <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl shadow-gray-200 dark:shadow-black/20 border border-gray-100 dark:border-gray-800 max-w-2xl w-full text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-700">
                <Check className="w-12 h-12" />
            </div>
            
            <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg font-medium">
                {files.length} PDF files merged successfully.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                    href={resultUrl} 
                    download="toolazon_merged.pdf"
                    className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center gap-3 text-lg transition-all transform hover:-translate-y-1"
                >
                    <Download className="w-6 h-6" />
                    Download Merged PDF
                </a>
                <button 
                    onClick={reset}
                    className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold py-4 px-8 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 transition-all"
                >
                    <RefreshCw className="w-5 h-5" />
                    Start Over
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col font-sans transition-colors">
        {isProcessing && <ProcessingOverlay status={statusMessage} progress={progress} />}
        
        {/* Top Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm sticky top-[70px] z-30">
            <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 tracking-tight">Merge PDF files</h2>
            <div className="flex items-center gap-4">
                <button 
                  onClick={() => addMoreInputRef.current?.click()}
                  className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-colors border border-gray-200 dark:border-gray-700"
                >
                    <Plus className="w-4 h-4" /> Add more files
                </button>
                <input 
                    type="file" 
                    ref={addMoreInputRef} 
                    onChange={(e) => handleFiles(e.target.files)} 
                    accept=".pdf" 
                    multiple
                    className="hidden" 
                />
                <button onClick={reset} className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 text-sm font-bold px-2 transition-colors">Clear all</button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {files.map((fileData, index) => (
                    <div 
                        key={fileData.id} 
                        className={`bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border-2 relative group transition-all cursor-move
                            ${draggedIndex === index 
                                ? 'border-brand-500 shadow-2xl opacity-50 scale-95' 
                                : 'border-transparent dark:border-gray-800 hover:shadow-xl hover:border-brand-200 dark:hover:border-brand-900'
                            }`}
                        draggable
                        onDragStart={(e) => onDragStart(e, index)}
                        onDragOver={(e) => onDragOver(e, index)}
                        onDrop={(e) => onDrop(e, index)}
                    >
                        <div className="h-40 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-4 flex items-center justify-center border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                             <FileText className="w-16 h-16 text-gray-300 dark:text-gray-700" />
                             
                             <div className="absolute top-3 left-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <GripVertical className="w-5 h-5" />
                             </div>
                             
                             <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 rounded-lg p-1.5 shadow-md">
                                <button onClick={() => removeFile(fileData.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                             </div>
                        </div>
                        <p className="text-sm font-black text-gray-800 dark:text-gray-100 truncate mb-1 px-1" title={fileData.file.name}>{fileData.file.name}</p>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">{(fileData.file.size / 1024 / 1024).toFixed(2)} MB</p>

                        <div className="mt-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => moveFile(index, 'up')} 
                               disabled={index === 0}
                               className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 disabled:opacity-30 transition-colors"
                             >
                                <ArrowUp className="w-4 h-4 mx-auto" />
                             </button>
                             <button 
                               onClick={() => moveFile(index, 'down')} 
                               disabled={index === files.length - 1}
                               className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 disabled:opacity-30 transition-colors"
                             >
                                <ArrowDown className="w-4 h-4 mx-auto" />
                             </button>
                        </div>
                    </div>
                ))}
                
                {/* Add Card */}
                <button 
                  onClick={() => addMoreInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center h-full min-h-[220px] hover:bg-white dark:hover:bg-gray-900 hover:border-brand-300 dark:hover:border-brand-900 transition-all text-gray-400 dark:text-gray-600 hover:text-brand-500 group"
                >
                    <Plus className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Add more files</span>
                </button>
            </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-[#fff9e6] dark:bg-gray-900 border-t border-orange-100 dark:border-gray-800 p-5 sticky bottom-0 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors">
            <div className="max-w-md mx-auto">
                <button 
                    onClick={handleMerge}
                    disabled={isProcessing}
                    className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-black py-4 rounded-2xl shadow-xl shadow-brand-200 dark:shadow-black/20 flex items-center justify-center gap-3 text-xl transition-all transform hover:-translate-y-1 active:translate-y-0"
                >
                    {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Combine className="w-6 h-6" />}
                    Merge PDF files
                </button>
            </div>
        </div>
    </div>
  );
};

export default MergePdf;
