import React, { useState, useRef } from 'react';
import { FileUp, Lock, Unlock, Download, Loader2, Check, RefreshCw, ChevronDown, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';

const UnlockPdf: React.FC = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'password' | 'processing' | 'success'>('upload');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
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

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Try to load with provided password
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password: password } as any);
      
      // If successful, save without encryption
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStep('success');
    } catch (err: any) {
      console.error(err);
      setStep('password');
      // Naive error check, in real app better to check error code/type
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
  };

  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4 font-sans">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">Unlock PDF</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">Remove PDF password security, giving you the freedom to use your data as you want.</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-3 text-xl group"
           >
             <Unlock className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
             Upload PDF file
             <ChevronDown className="w-5 h-5 ml-2" />
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
           <p className="text-xs text-center text-gray-400 mt-4">
             Or drag and drop file here
           </p>
        </div>

        <div className="mt-16 max-w-2xl text-center">
            <h3 className="font-bold text-gray-700 mb-2">How to unlock PDF</h3>
            <p className="text-sm text-gray-500">
                Upload your password-protected PDF. Enter the password to verify you have the right to access the file. Once unlocked, you can download a version without restrictions.
            </p>
        </div>
      </div>
    );
  }

  if (step === 'password' || step === 'processing') {
      return (
          <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-24 px-4 font-sans">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {step === 'processing' ? 'Processing...' : 'Enter Password'}
              </h2>
              <p className="text-gray-500 mb-8">
                  {step === 'processing' ? 'Unlocking document...' : 'This document is encrypted.'}
              </p>

              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-md w-full">
                  <div className="flex items-center justify-center mb-6">
                      <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                          {step === 'processing' ? <Loader2 className="w-8 h-8 animate-spin" /> : <Lock className="w-8 h-8" />}
                      </div>
                  </div>
                  
                  <div className="mb-2 text-center text-sm text-gray-600 font-medium truncate px-4">
                      {file?.name}
                  </div>

                  {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{error}</span>
                      </div>
                  )}

                  <div className="relative mb-6">
                      <input 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter PDF Password"
                          disabled={step === 'processing'}
                          className="w-full border border-gray-300 rounded-md py-3 pl-4 pr-12 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none disabled:bg-gray-50"
                          onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                      />
                      <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={step === 'processing'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                  </div>

                  <button 
                      onClick={handleUnlock}
                      disabled={step === 'processing' || !password}
                      className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold py-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition-colors"
                  >
                      {step === 'processing' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Unlock className="w-5 h-5" />}
                      {step === 'processing' ? 'Unlocking...' : 'Unlock PDF'}
                  </button>
                  
                  <button 
                      onClick={reset}
                      className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                      Cancel
                  </button>
              </div>
          </div>
      );
  }

  if (step === 'success' && resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-24 px-4 font-sans">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Your PDF is unlocked!</h2>
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-2xl w-full text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8" />
            </div>
            <p className="text-gray-500 mb-8">Password and restrictions have been removed.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={`unlocked_${file?.name}`} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2 transition-colors">
                    <Download className="w-5 h-5" /> Download PDF
                </a>
                <button onClick={reset} className="bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Start Over
                </button>
            </div>
        </div>
      </div>
    );
  }

  return null;
};

export default UnlockPdf;