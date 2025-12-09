import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, FileText, Trash2, ArrowUp, ArrowDown, Download, RefreshCw, Plus } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';

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

  const handleMerge = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      const mergedPdf = await PDFDocument.create();
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        const uploadedFile = files[i];
        const arrayBuffer = await uploadedFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        
        // Update progress (allocating 90% for processing, 10% for saving)
        setProgress(Math.round(((i + 1) / totalFiles) * 90));
      }

      const pdfBytes = await mergedPdf.save();
      setProgress(100);
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);

    } catch (error) {
      console.error("Merge error:", error);
      alert("Failed to merge PDFs. Please ensure all files are valid PDFs.");
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

  // 1. Initial Upload View
  if (files.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4 font-sans">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">Merge PDF files online</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">Combine multiple PDFs and images into one</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-3 text-xl group"
           >
             <FileUp className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
             Upload PDF files
             <ChevronDown className="w-5 h-5 ml-2" />
           </button>
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={(e) => handleFiles(e.target.files)} 
             accept=".pdf" 
             multiple
             className="hidden" 
           />
           <p className="text-xs text-center text-gray-400 mt-4">
             Or drag and drop files here
           </p>
        </div>

        <div className="mt-16 max-w-2xl text-center">
            <h3 className="font-bold text-gray-700 mb-2">How to merge PDF files</h3>
            <p className="text-sm text-gray-500">
                Select multiple PDF files and merge them in seconds. Merge & combine PDF files online, easily and free.
            </p>
        </div>
      </div>
    );
  }

  // 3. Result View
  if (resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-12 px-4 font-sans">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Your document is ready</h2>
        
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-2xl w-full text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8" />
            </div>
            
            <p className="text-gray-500 mb-8">
                {files.length} PDF files merged successfully.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                    href={resultUrl} 
                    download="toolazon_merged.pdf"
                    className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2 transition-colors"
                >
                    <Download className="w-5 h-5" />
                    Download Merged PDF
                </a>
                <button 
                    onClick={reset}
                    className="bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Start Over
                </button>
            </div>
        </div>
      </div>
    );
  }

  // 2. Organize View
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 py-4 px-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm sticky top-[60px] z-30">
            <h2 className="text-xl font-bold text-gray-800">Merge PDF files</h2>
            <div className="flex gap-2">
                <button 
                  onClick={() => addMoreInputRef.current?.click()}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
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
                <button onClick={reset} className="text-brand-500 hover:text-brand-600 text-sm font-medium px-2">Clear all</button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map((fileData, index) => (
                    <div key={fileData.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 relative group hover:shadow-md transition-shadow">
                        <div className="h-32 bg-gray-50 rounded mb-3 flex items-center justify-center border border-gray-100">
                             <FileText className="w-12 h-12 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 truncate mb-1" title={fileData.file.name}>{fileData.file.name}</p>
                        <p className="text-xs text-gray-400">{(fileData.file.size / 1024 / 1024).toFixed(2)} MB</p>

                        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded p-1 shadow-sm">
                            <button onClick={() => removeFile(fileData.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        
                        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => moveFile(index, 'up')} 
                               disabled={index === 0}
                               className="p-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30"
                             >
                                <ArrowUp className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => moveFile(index, 'down')} 
                               disabled={index === files.length - 1}
                               className="p-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30"
                             >
                                <ArrowDown className="w-4 h-4" />
                             </button>
                        </div>
                    </div>
                ))}
                
                {/* Add Card */}
                <button 
                  onClick={() => addMoreInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center h-[220px] hover:bg-gray-50 hover:border-brand-300 transition-colors text-gray-400 hover:text-brand-500"
                >
                    <Plus className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Add more files</span>
                </button>
            </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-40">
            <div className="max-w-md mx-auto">
                {isProcessing && (
                    <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Merging files...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-brand-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}
                <button 
                    onClick={handleMerge}
                    disabled={isProcessing}
                    className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold py-4 rounded-lg shadow-md flex items-center justify-center text-lg transition-colors"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Processing...
                        </>
                    ) : (
                        'Merge PDF files'
                    )}
                </button>
            </div>
        </div>
    </div>
  );
};

export default MergePdf;