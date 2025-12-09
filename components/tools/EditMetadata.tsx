import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, Download, RefreshCw, Settings, FileText, User, Tag, BookOpen, Monitor } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';

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
      
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        setMeta({
          title: pdfDoc.getTitle() || '',
          author: pdfDoc.getAuthor() || '',
          subject: pdfDoc.getSubject() || '',
          keywords: pdfDoc.getKeywords() || '',
          creator: pdfDoc.getCreator() || '',
          producer: pdfDoc.getProducer() || ''
        });
        
        setStep('editor');
      } catch (error) {
        console.error("Error reading metadata", error);
        alert("Failed to read PDF metadata.");
        setFile(null);
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleSave = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Update metadata
      pdfDoc.setTitle(meta.title);
      pdfDoc.setAuthor(meta.author);
      pdfDoc.setSubject(meta.subject);
      
      // Keywords in pdf-lib usually accepts array
      if (meta.keywords) {
        pdfDoc.setKeywords(meta.keywords.split(',').map(k => k.trim()));
      } else {
        pdfDoc.setKeywords([]);
      }
      
      pdfDoc.setCreator(meta.creator);
      pdfDoc.setProducer(meta.producer);
      
      // Set modification date to now
      pdfDoc.setModificationDate(new Date());

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStep('success');

    } catch (e) {
      console.error(e);
      alert("Failed to update metadata.");
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setStep('upload');
    setResultUrl(null);
    setMeta({ title: '', author: '', subject: '', keywords: '', creator: '', producer: '' });
  };

  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4 font-sans">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">Edit PDF Metadata</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">Change PDF Author, Title, Keywords, Subject and other fields</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-3 text-xl group"
           >
             {processing ? <Loader2 className="w-8 h-8 animate-spin" /> : <FileUp className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />}
             {processing ? 'Reading file...' : 'Upload PDF file'}
             {!processing && <ChevronDown className="w-5 h-5 ml-2" />}
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
           <p className="text-xs text-center text-gray-400 mt-4">
             Or drag and drop file here
           </p>
        </div>

        <div className="mt-16 max-w-2xl text-center">
            <h3 className="font-bold text-gray-700 mb-2">How to edit PDF metadata</h3>
            <p className="text-sm text-gray-500">
                Upload your file. Modify the Title, Author, Subject and Keywords fields. Click 'Update PDF Metadata' to save and download.
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
            <p className="text-gray-500 mb-8">Metadata updated successfully.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={`metadata_${file?.name}`} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2 transition-colors">
                    <Download className="w-5 h-5" /> Download
                </a>
                <button onClick={reset} className="bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Start Over
                </button>
            </div>
        </div>
      </div>
    );
  }

  // Editor View
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between sticky top-[60px] z-30 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800">Edit Metadata</h2>
            <div className="text-sm text-gray-500">Selected: {file?.name}</div>
        </div>

        <div className="flex-1 flex justify-center py-12 px-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-2xl w-full h-fit">
                <h3 className="text-lg font-bold text-gray-700 mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-brand-500" />
                    PDF Properties
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" /> Title
                        </label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                            value={meta.title}
                            onChange={(e) => setMeta({...meta, title: e.target.value})}
                            placeholder="e.g. Annual Report 2024"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" /> Author
                            </label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                value={meta.author}
                                onChange={(e) => setMeta({...meta, author: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-gray-400" /> Subject
                            </label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                value={meta.subject}
                                onChange={(e) => setMeta({...meta, subject: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-gray-400" /> Keywords
                        </label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                            value={meta.keywords}
                            onChange={(e) => setMeta({...meta, keywords: e.target.value})}
                            placeholder="Separate keywords with comma"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                         <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Advanced</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                    <Monitor className="w-4 h-4 text-gray-400" /> Creator Application
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all bg-gray-50"
                                    value={meta.creator}
                                    onChange={(e) => setMeta({...meta, creator: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                    <Monitor className="w-4 h-4 text-gray-400" /> PDF Producer
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all bg-gray-50"
                                    value={meta.producer}
                                    onChange={(e) => setMeta({...meta, producer: e.target.value})}
                                />
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-[#fff9e6] border-t border-orange-100 p-4 sticky bottom-0 z-40">
             <div className="max-w-md mx-auto">
                 <button 
                     onClick={handleSave}
                     disabled={processing}
                     className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold py-4 rounded-lg shadow-md flex items-center justify-center text-lg transition-colors"
                 >
                     {processing ? (
                         <>
                             <Loader2 className="w-5 h-5 animate-spin mr-2" />
                             Updating Metadata...
                         </>
                     ) : (
                         'Update PDF Metadata'
                     )}
                 </button>
             </div>
        </div>
    </div>
  );
};

export default EditMetadata;