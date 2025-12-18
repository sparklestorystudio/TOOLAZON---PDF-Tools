
import React, { useState, useRef } from 'react';
import { FileUp, Lock, Unlock, Download, Loader2, Check, RefreshCw, ChevronDown, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';
import ProcessingOverlay from '../ProcessingOverlay';

const UnlockPdf: React.FC = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'password' | 'processing' | 'success'>('upload');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStep('password');
      setPassword('');
      setError(null);
    }
  };

  const handleUnlock = async () => {
    if (!file) return;
    setStep('processing');
    setError(null);
    setProgress(0);

    const interval = setInterval(() => {
        setProgress(prev => Math.min(95, prev + (100 - prev) * 0.1));
    }, 150);

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Try to load with provided password
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password: password } as any);
      
      // If successful, save without encryption
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      clearInterval(interval);
      setProgress(100);
      setResultUrl(url);
      setStep('success');
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setStep('password');
      if (err.message && (err.message.toLowerCase().includes('password') || err.message.toLowerCase().includes('encrypted'))) {
         setError("Incorrect password. Please try again.");
      } else {
         setError("Failed to unlock PDF. The file might be corrupted or the password is wrong.");
      }
    }
  };

  const reset = () => {
    setFile(null);
    setStep('upload');
    setResultUrl(null);
    setPassword('');
    setError(null);
    setProgress(0);
  };

  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 py-20 px-4 font-sans transition-colors">
        <h1 className="text-4xl font-black text-gray-800 dark:text-gray-100 mb-3 text-center tracking-tight leading-tight">Unlock PDF</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 text-center font-medium max-w-xl">Remove PDF password security, giving you the freedom to use your data as you want.</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-7 rounded-2xl shadow-xl shadow-brand-200 dark:shadow-brand-900/20 transition-all flex items-center justify-center gap-4 text-2xl group transform hover:-translate-y-1"
           >
             <Unlock className="w-9 h-9 group-hover:-translate-y-1 transition-transform" />
             Upload PDF file
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
           <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4 font-bold uppercase tracking-widest">
             Or drag and drop file here
           </p>
        </div>

        <div className="mt-20 max-w-2xl text-center">
            <h3 className="font-black text-gray-700 dark:text-gray-300 mb-3 text-lg leading-tight">How to unlock PDF</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                Upload your password-protected PDF. Enter the password to verify you have the right to access the file. Once unlocked, you can download a version without restrictions. We never store your passwords.
            </p>
        </div>
      </div>
    );
  }

  if (step === 'password' || step === 'processing') {
      return (
          <div className="min-h-[80vh] bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-24 px-4 font-sans transition-colors">
              {step === 'processing' && <ProcessingOverlay status="Removing restrictions..." progress={progress} />}
              
              <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-2 tracking-tight">Enter Password</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">This document is protected with an open password.</p>

              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-md w-full animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-center mb-8">
                      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center shadow-inner">
                          <Lock className="w-10 h-10" />
                      </div>
                  </div>
                  
                  <div className="mb-4 text-center">
                      <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Target File</p>
                      <p className="text-sm text-gray-700 dark:text-gray-200 font-bold truncate px-4">{file?.name}</p>
                  </div>

                  {error && (
                      <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm rounded-xl flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium">{error}</span>
                      </div>
                  )}

                  <div className="relative mb-8">
                      <input 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          disabled={step === 'processing'}
                          className="w-full border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-white rounded-2xl py-4 pl-5 pr-14 focus:border-brand-500 focus:ring-0 outline-none transition-all font-medium disabled:opacity-50"
                          onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                          autoFocus
                      />
                      <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={step === 'processing'}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
                      >
                          {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                      </button>
                  </div>

                  <button 
                      onClick={handleUnlock}
                      disabled={step === 'processing' || !password}
                      className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-black py-4 rounded-2xl shadow-xl shadow-brand-100 dark:shadow-black/30 flex items-center justify-center gap-3 text-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                      <Unlock className="w-5 h-5" />
                      Unlock PDF
                  </button>
                  
                  <button 
                      onClick={reset}
                      className="w-full mt-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-sm font-bold uppercase tracking-widest transition-colors"
                  >
                      Cancel
                  </button>
              </div>
          </div>
      );
  }

  if (step === 'success' && resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-24 px-4 font-sans transition-colors">
        <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-8 tracking-tight">Access Unlocked!</h2>
        <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-2xl w-full text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-700">
                <Check className="w-12 h-12" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg font-medium">The document password and restrictions have been successfully removed.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={`unlocked_${file?.name}`} className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center gap-3 text-lg transition-all transform hover:-translate-y-1">
                    <Download className="w-6 h-6" /> Download PDF
                </a>
                <button onClick={reset} className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold py-4 px-8 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                    <RefreshCw className="w-5 h-5" /> Start Over
                </button>
            </div>
        </div>
      </div>
    );
  }

  return null;
};

export default UnlockPdf;
