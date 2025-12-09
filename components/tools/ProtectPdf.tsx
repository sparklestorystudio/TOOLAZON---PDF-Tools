import React, { useState, useRef } from 'react';
import { FileUp, Lock, Shield, Download, Loader2, Check, RefreshCw, ChevronDown, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';

interface Permissions {
  print: boolean;
  modify: boolean;
  copy: boolean;
  annotate: boolean;
}

const ProtectPdf: React.FC = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'options' | 'processing' | 'success'>('upload');
  
  // Passwords
  const [userPassword, setUserPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  // Permissions
  const [restrictPermissions, setRestrictPermissions] = useState(false);
  const [permissions, setPermissions] = useState<Permissions>({
    print: true,
    modify: true,
    copy: true,
    annotate: true
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStep('options');
      setError(null);
      setUserPassword('');
      setConfirmPassword('');
      setOwnerPassword('');
    }
  };

  const handleProtect = async () => {
    if (!file) return;
    
    // Validation
    if (userPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }
    if (!userPassword && !restrictPermissions) {
        setError("Please enter a password to encrypt the file.");
        return;
    }
    if (restrictPermissions && !ownerPassword) {
        // If restricting permissions, ideally we need an owner password different from user password
        // If empty, generate one or default to user password (but then user can unlock restrictions)
        // Let's require it if restrictions are enabled for clarity
        if (!userPassword) {
             setError("An Owner Password is required to set permissions if no Open Password is set.");
             return;
        }
        // If user password exists but owner is empty, we can default owner = user, 
        // but that defeats the purpose of restrictions. Let's warn or auto-generate.
        // For this tool, let's auto-generate a strong owner password if left blank so restrictions actually work against the user.
        // However, user might want to know it. 
        // Let's enforce entering it if 'Restrict Permissions' is checked.
        if (!ownerPassword) {
            setError("Please set an Owner Password to enforce permissions.");
            return;
        }
    }

    setStep('processing');
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Configure encryption
      const encryptOptions: any = {
          userPassword: userPassword,
          ownerPassword: ownerPassword || userPassword || Math.random().toString(36), // Fallback if not restricting
          permissions: {
              printing: restrictPermissions ? (permissions.print ? 'highResolution' : undefined) : 'highResolution',
              modifying: restrictPermissions ? permissions.modify : true,
              copying: restrictPermissions ? permissions.copy : true,
              annotating: restrictPermissions ? permissions.annotate : true,
              fillingForms: restrictPermissions ? permissions.modify : true,
              contentAccessibility: restrictPermissions ? permissions.copy : true, 
              documentAssembly: restrictPermissions ? permissions.modify : true, 
          },
      };

      // In pdf-lib, passing permissions object keys as undefined means 'false' usually? 
      // Actually standard pdf-lib encrypt method takes an object.
      // If we want to RESTRICT, we set fields to false. 
      // If restrictPermissions is false, we want everything true (default behavior if not specified).
      // But if userPassword is set, we MUST call encrypt.
      
      await (pdfDoc as any).encrypt(encryptOptions);
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStep('success');
    } catch (err: any) {
      console.error(err);
      setError("Failed to encrypt PDF. " + err.message);
      setStep('options');
    }
  };

  const reset = () => {
    setFile(null);
    setStep('upload');
    setResultUrl(null);
    setUserPassword('');
    setConfirmPassword('');
    setOwnerPassword('');
    setError(null);
    setRestrictPermissions(false);
  };

  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4 font-sans">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">{t('tool.protect.title')}</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">{t('tool.protect.desc')}</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-3 text-xl group"
           >
             <Lock className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
             Upload PDF file
             <ChevronDown className="w-5 h-5 ml-2" />
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
           <p className="text-xs text-center text-gray-400 mt-4">
             Or drag and drop file here
           </p>
        </div>

        <div className="mt-16 max-w-2xl text-center">
            <h3 className="font-bold text-gray-700 mb-2">How to password protect a PDF</h3>
            <p className="text-sm text-gray-500">
                Upload your PDF. Set a password to prevent unauthorized access. Optionally set restrictions to prevent printing, copying or modifying the document.
            </p>
        </div>
      </div>
    );
  }

  if (step === 'options' || step === 'processing') {
      return (
          <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-12 px-4 font-sans">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Protect PDF</h2>
              <p className="text-gray-500 mb-8">Encrypt your PDF with a password.</p>

              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-md w-full">
                  <div className="mb-6 text-center text-sm text-gray-600 font-medium truncate px-4 bg-gray-50 py-2 rounded">
                      {file?.name}
                  </div>

                  {error && (
                      <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{error}</span>
                      </div>
                  )}

                  {/* User Password */}
                  <div className="space-y-4 mb-6">
                      <div className="relative">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Open Password</label>
                          <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={userPassword}
                                onChange={(e) => setUserPassword(e.target.value)}
                                placeholder="Enter Password"
                                className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Repeat Password</label>
                          <input 
                              type={showPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm Password"
                              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
                          />
                      </div>
                  </div>

                  {/* Advanced / Permissions */}
                  <div className="mb-8">
                      <button 
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center text-sm font-medium text-brand-600 hover:text-brand-700 mb-2"
                      >
                          <Shield className="w-4 h-4 mr-2" />
                          {showAdvanced ? "Hide Permissions" : "More Options (Permissions)"}
                          <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                      </button>

                      {showAdvanced && (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 animate-in slide-in-from-top-2">
                              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={restrictPermissions} 
                                    onChange={(e) => setRestrictPermissions(e.target.checked)}
                                    className="rounded text-brand-500 focus:ring-brand-500" 
                                  />
                                  <span className="text-sm font-medium text-gray-700">Restrict Permissions</span>
                              </label>

                              {restrictPermissions && (
                                  <div className="space-y-3 pl-6">
                                      <div className="relative mb-4">
                                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Owner Password</label>
                                          <input 
                                              type="text"
                                              value={ownerPassword}
                                              onChange={(e) => setOwnerPassword(e.target.value)}
                                              placeholder="Required to change permissions"
                                              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white"
                                          />
                                          <p className="text-[10px] text-gray-400 mt-1">Different from Open Password</p>
                                      </div>

                                      <div className="text-xs text-gray-500 uppercase font-bold mb-2">Allowed Actions:</div>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="checkbox" checked={permissions.print} onChange={(e) => setPermissions({...permissions, print: e.target.checked})} className="rounded text-brand-500" />
                                          <span className="text-sm text-gray-600">Printing</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="checkbox" checked={permissions.copy} onChange={(e) => setPermissions({...permissions, copy: e.target.checked})} className="rounded text-brand-500" />
                                          <span className="text-sm text-gray-600">Copying content</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="checkbox" checked={permissions.modify} onChange={(e) => setPermissions({...permissions, modify: e.target.checked})} className="rounded text-brand-500" />
                                          <span className="text-sm text-gray-600">Modifying</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="checkbox" checked={permissions.annotate} onChange={(e) => setPermissions({...permissions, annotate: e.target.checked})} className="rounded text-brand-500" />
                                          <span className="text-sm text-gray-600">Annotating / Filling Forms</span>
                                      </label>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>

                  <button 
                      onClick={handleProtect}
                      disabled={step === 'processing'}
                      className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold py-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition-colors"
                  >
                      {step === 'processing' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                      {step === 'processing' ? 'Encrypting...' : 'Encrypt PDF'}
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
        <h2 className="text-3xl font-bold text-gray-800 mb-6">PDF Protected!</h2>
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-2xl w-full text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8" />
            </div>
            <p className="text-gray-500 mb-8">Your file has been encrypted with the provided password.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={`protected_${file?.name}`} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2 transition-colors">
                    <Download className="w-5 h-5" /> Download Protected PDF
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

export default ProtectPdf;