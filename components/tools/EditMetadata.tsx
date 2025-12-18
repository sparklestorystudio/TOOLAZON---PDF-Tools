
import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, Download, RefreshCw, Settings, FileText, User, Tag, BookOpen, Monitor, ArrowLeft } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';
import ProcessingOverlay from '../ProcessingOverlay';

interface MetadataForm {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}

const EditMetadata: React.FC = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'editor' | 'success'>('upload');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [meta, setMeta] = useState<MetadataForm>({
    title: '', author: '', subject: '', keywords: '', creator: '', producer: ''
  });
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setProcessing(true);
      setProgress(0);
      
      const interval = setInterval(() => setProgress(p => Math.min(90, p + 15)), 100);

      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { password: '' } as any);
        
        setMeta({
          title: pdfDoc.getTitle() || '',
          author: pdfDoc.getAuthor() || '',
          subject: pdfDoc.getSubject() || '',
          keywords: pdfDoc.getKeywords() || '',
          creator: pdfDoc.getCreator() || '',
          producer: pdfDoc.getProducer() || ''
        });
        
        clearInterval(interval);
        setProgress(100);
        setStep('editor');
      } catch (error: any) {
        clearInterval(interval);
        console.error("Error reading metadata", error);
        if (error.message && (error.message.includes('encrypted') || error.message.includes('password'))) {
            alert("This file is password protected. Please unlock it first.");
        } else {
            alert("Failed to read PDF metadata.");
        }
        setFile(null);
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleSave = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    
    const interval = setInterval(() => setProgress(p => Math.min(95, p + 5)), 200);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password: '' } as any);
      
      pdfDoc.setTitle(meta.title);
      pdfDoc.setAuthor(meta.author);
      pdfDoc.setSubject(meta.subject);
      pdfDoc.setKeywords(meta.keywords.split(',').map(k => k.trim()).filter(k => k));
      pdfDoc.setCreator(meta.creator);
      pdfDoc.setProducer(meta.producer);
      
      const pdfBytes = await pdfDoc.save();
      
      clearInterval(interval);
      setProgress(100);

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStep('success');
    } catch (error: any) {
      clearInterval(interval);
      console.error("Error saving metadata", error);
      alert("Failed to save PDF metadata.");
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setStep('upload');
    setResultUrl(null);
    setProgress(0);
    setMeta({ title: '', author: '', subject: '', keywords: '', creator: '', producer: '' });
  };

  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 py-20 px-4 font-sans transition-colors">
        <h1 className="text-4xl font-black text-gray-800 dark:text-white mb-2 text-center tracking-tight">Edit Metadata</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 text-center font-medium max-w-xl">Change PDF Author, Title, Keywords and other metadata fields instantly.</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-7 rounded-2xl shadow-xl shadow-brand-200 dark:shadow-brand-900/20 transition-all flex items-center justify-center gap-4 text-2xl group transform hover:-translate-y-1"
           >
             <Settings className="w-9 h-9 group-hover:-translate-y-1 transition-transform" />
             Upload PDF file
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
           <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4 font-black uppercase tracking-widest">
             Or drag and drop file here
           </p>
        </div>
      </div>
    );
  }

  if (step === 'success' && resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-24 px-4 font-sans transition-colors">
        <h2 className="text-4xl font-black text-gray-800 dark:text-white mb-8 tracking-tighter">Properties Updated!</h2>
        <div className="bg-white dark:bg-gray-900 p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 max-w-2xl w-full text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
                <Check className="w-12 h-12" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-12 font-medium">Your PDF document metadata has been successfully updated.</p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <a href={resultUrl} download={`metadata_${file?.name}`} className="bg-brand-500 hover:bg-brand-600 text-white font-black py-5 px-12 rounded-2xl shadow-xl shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center gap-3 text-xl transition-all transform hover:-translate-y-1 active:scale-95 active:translate-y-0">
                    <Download className="w-6 h-6" /> Download
                </a>
                <button onClick={reset} className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold py-5 px-8 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5" /> Start Over
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col font-sans transition-colors">
        {processing && <ProcessingOverlay status={step === 'editor' ? "Reading metadata..." : "Updating properties..."} progress={progress} />}
        
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6 flex items-center justify-between sticky top-[60px] z-30 shadow-sm transition-colors">
            <div className="flex items-center gap-4">
                <button onClick={reset} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><ArrowLeft className="w-5 h-5"/></button>
                <div>
                    <h2 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">Edit Metadata</h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px] md:max-w-xs">{file?.name}</div>
                </div>
            </div>
            <button 
                onClick={handleSave}
                disabled={processing}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-black py-2.5 px-8 rounded-xl shadow-lg shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center transition-all transform hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest text-xs"
            >
                Save Metadata
            </button>
        </div>

        <div className="flex-1 flex justify-center p-8 overflow-y-auto">
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 p-10 max-w-2xl w-full h-fit animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid gap-8">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> Document Title
                        </label>
                        <input 
                            type="text" 
                            value={meta.title}
                            onChange={(e) => setMeta({...meta, title: e.target.value})}
                            className="w-full border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-2xl px-5 py-4 text-sm font-bold focus:border-brand-500 outline-none transition-all"
                            placeholder="Enter title..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                <User className="w-3.5 h-3.5" /> Author
                            </label>
                            <input 
                                type="text" 
                                value={meta.author}
                                onChange={(e) => setMeta({...meta, author: e.target.value})}
                                className="w-full border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-2xl px-5 py-4 text-sm font-bold focus:border-brand-500 outline-none transition-all"
                                placeholder="Author name..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                <BookOpen className="w-3.5 h-3.5" /> Subject
                            </label>
                            <input 
                                type="text" 
                                value={meta.subject}
                                onChange={(e) => setMeta({...meta, subject: e.target.value})}
                                className="w-full border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-2xl px-5 py-4 text-sm font-bold focus:border-brand-500 outline-none transition-all"
                                placeholder="Subject keywords..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5" /> Keywords
                        </label>
                        <textarea 
                            value={meta.keywords}
                            onChange={(e) => setMeta({...meta, keywords: e.target.value})}
                            className="w-full border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-2xl px-5 py-4 text-sm font-bold focus:border-brand-500 outline-none transition-all h-28 resize-none"
                            placeholder="Tag1, Tag2, Business..."
                        />
                        <p className="text-[10px] font-bold text-gray-400 mt-1 px-1">Separate keywords with commas.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50 dark:border-gray-800">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                <Settings className="w-3.5 h-3.5" /> Creator App
                            </label>
                            <input 
                                type="text" 
                                value={meta.creator}
                                onChange={(e) => setMeta({...meta, creator: e.target.value})}
                                className="w-full border-2 border-gray-50 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl px-5 py-4 text-sm font-bold opacity-70"
                                placeholder="System created"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                <Monitor className="w-3.5 h-3.5" /> PDF Producer
                            </label>
                            <input 
                                type="text" 
                                value={meta.producer}
                                onChange={(e) => setMeta({...meta, producer: e.target.value})}
                                className="w-full border-2 border-gray-50 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl px-5 py-4 text-sm font-bold opacity-70"
                                placeholder="Library generator"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default EditMetadata;
