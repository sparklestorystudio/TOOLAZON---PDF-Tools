
import React from 'react';

interface ProcessingOverlayProps {
  status: string;
  progress: number;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ status, progress }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl flex flex-col items-center justify-center transition-all duration-500 animate-in fade-in"
      role="alert"
      aria-busy="true"
    >
      <div className="relative mb-12 scale-110 md:scale-125">
        {/* Deep Pulsing Glow */}
        <div className="absolute inset-0 bg-brand-500/20 blur-[60px] rounded-full scale-150 animate-pulse"></div>
        
        {/* Progress SVG Container */}
        <svg className="w-56 h-56 transform -rotate-90 relative">
          {/* Static Background Ring */}
          <circle
            cx="112"
            cy="112"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-100 dark:text-gray-800"
          />
          
          {/* Outer Decorative Spinning Ring */}
          <circle
            cx="112"
            cy="112"
            r={radius + 12}
            stroke="currentColor"
            strokeWidth="1"
            fill="transparent"
            strokeDasharray="10 20"
            className="text-brand-300 dark:text-brand-800 animate-[spin_8s_linear_infinite]"
          />

          {/* Actual Progress Ring with Gradient */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--brand-400)" />
              <stop offset="100%" stopColor="var(--brand-600)" />
            </linearGradient>
          </defs>
          <circle
            cx="112"
            cy="112"
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
            strokeLinecap="round"
          />
        </svg>
        
        {/* Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline">
            <span className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">{Math.round(progress)}</span>
            <span className="text-xl font-bold text-brand-500 ml-0.5">%</span>
          </div>
          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-2">Processing</span>
        </div>
      </div>
      
      <div className="text-center space-y-6 max-w-sm px-8">
        <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-800 dark:text-gray-100 tracking-tight leading-tight animate-in slide-in-from-bottom-2 duration-700">
                {status}
            </h3>
            <div className="flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                    <span 
                        key={i} 
                        className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" 
                        style={{ animationDelay: `${i * 200}ms` }}
                    />
                ))}
            </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 transition-colors">
            <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold leading-relaxed">
                Almost there! We're handling the heavy lifting securely on our servers. Your privacy is our priority.
            </p>
        </div>
      </div>

      {/* Reassuring Footer */}
      <div className="absolute bottom-12 flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
         <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
         Secure Encrypted Connection
      </div>
    </div>
  );
};

export default ProcessingOverlay;
