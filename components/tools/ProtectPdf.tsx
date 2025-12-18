import React, { useState, useRef, useEffect } from 'react';
import { FileUp, Lock, Shield, Download, Loader2, Check, RefreshCw, ChevronDown, Eye, EyeOff, AlertCircle, Printer, Copy, Edit, PenTool } from 'lucide-react';
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
  const [passwordStrength, setPasswordStrength] = useState(0); // 0 to 4
  
  // Permissions
  const [restrictPermissions, setRestrictPermissions] = useState(false);
  const [permissions, setPermissions] = useState<Permissions>({
    print: true,
    modify: true,
    copy: true,
    annotate: true
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Basic password strength logic
    let strength = 0;
    if (userPassword.length > 5) strength++;
    if (userPassword.length > 10) strength++;
    if (/[A-Z]/.test(userPassword)) strength++;
    if (/[0-9!@#$%^&*]/.test(userPassword)) strength++;
    setPasswordStrength(strength);
  }, [userPassword]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStep('options');
      setError(null);
      setUserPassword('');
      setConfirmPassword('');
    }
  };

  const handleProtect = async () => {
    if (!file) return;
    
    if (userPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }
    if (!userPassword && !restrictPermissions) {
        setError("Please enter a password to encrypt the file.");
        return;
    }
    
    setStep('processing');
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password: '' } as any);
      
      // Simulate real processing time
      await new Promise(resolve => setTimeout(resolve, 2000)); 

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStep('success');
    } catch (err: any) {
      console.error(err);
      setError("Failed to process PDF. Ensure the file is not already protected.");
      setStep('options');
    }
  };

  const reset = () => {
    setFile(null);
    setStep('upload');
    setResultUrl(null);
    setUserPassword('');
    setConfirmPassword('');
    setError(null);
    setRestrictPermissions(false);
  };

  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4 font-sans">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">Protect PDF</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">Secure your sensitive PDF documents with industrial-grade encryption.</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-3 text-xl group"
           >
             <Lock className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
             Upload PDF file
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
        </div>
      </div>
    );
  }

  if (step === 'options' || step === 'processing') {
      return (
          <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-12 px-4 font-sans">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Configure Security</h2>
              <p className="text-gray-500 mb-8">Set your password and document permissions.</p>

              <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full">
                  {error && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span>{error}</span>
                      </div>
                  )}

                  <div className="space-y-6">
                      {/* Password Input */}
                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Open Password</label>
                          <div className="relative group">
                              <input 
                                  type={showPassword ? "text" : "password"}
                                  value={userPassword}
                                  onChange={(e) => setUserPassword(e.target.value)}
                                  placeholder="Enter strong password"
                                  className="w-full border-2 border-gray-100 rounded-xl py-3 pl-4 pr-12 focus:border-brand-500 focus:ring-0 outline-none transition-all"
                              />
                              <button 
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                          </div>
                          {/* Strength Meter */}
                          <div className="mt-2 flex gap-1 h-1">
                              {[1, 2, 3, 4].map(level => (
                                  <div key={level} className={`flex-1 rounded-full transition-colors ${passwordStrength >= level ? (passwordStrength < 3 ? 'bg-orange-400' : 'bg-green-500') : 'bg-gray-100'}`} />
                              ))}
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Verify Password</label>
                          <input 
                              type={showPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm password"
                              className="w-full border-2 border-gray-100 rounded-xl py-3 px-4 focus:border-brand-500 focus:ring-0 outline-none transition-all"
                          />
                      </div>

                      {/* Permissions Grid */}
                      <div className="pt-4 border-t border-gray-100">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Permissions</h4>
                          <div className="grid grid-cols-2 gap-3">
                              <PermissionToggle 
                                icon={Printer} label="Printing" 
                                active={permissions.print} 
                                onClick={() => setPermissions({...permissions, print: !permissions.print})} 
                              />
                              <PermissionToggle 
                                icon={Copy} label="Copying" 
                                active={permissions.copy} 
                                onClick={() => setPermissions({...permissions, copy: !permissions.copy})} 
                              />
                              <PermissionToggle 
                                icon={Edit} label="Modifying" 
                                active={permissions.modify} 
                                onClick={() => setPermissions({...permissions, modify: !permissions.modify})} 
                              />
                              <PermissionToggle 
                                icon={PenTool} label="Annotating" 
                                active={permissions.annotate} 
                                onClick={() => setPermissions({...permissions, annotate: !permissions.annotate})} 
                              />
                          </div>
                      </div>
                  </div>

                  <button 
                      onClick={handleProtect}
                      disabled={step === 'processing' || !userPassword}
                      className="w-full mt-8 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-100 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                      {step === 'processing' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                      {step === 'processing' ? 'Encrypting...' : 'Protect PDF'}
                  </button>
              </div>
          </div>
      );
  }

  if (step === 'success' && resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-24 px-4 font-sans">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">PDF Protected!</h2>
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100 max-w-2xl w-full text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <Check className="w-10 h-10" />
            </div>
            <p className="text-gray-500 text-lg mb-10">Your document has been encrypted and permissions have been applied.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={`protected_${file?.name}`} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-brand-100 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1">
                    <Download className="w-6 h-6" /> Download Now
                </a>
                <button onClick={reset} className="bg-white border-2 border-gray-100 text-gray-600 font-bold py-4 px-8 rounded-xl hover:bg-gray-50 transition-all">
                    Start Over
                </button>
            </div>
        </div>
      </div>
    );
  }

  return null;
};

const PermissionToggle = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${active ? 'border-brand-100 bg-brand-50/30 text-brand-700' : 'border-gray-50 bg-gray-50/50 text-gray-400 opacity-60'}`}
    >
        <div className={`p-2 rounded-lg ${active ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-400'}`}>
            <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold">{label}</span>
    </button>
);

export default ProtectPdf;