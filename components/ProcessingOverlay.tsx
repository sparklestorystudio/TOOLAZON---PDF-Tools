
import React from 'react';

interface ProcessingOverlayProps {
  status: string;
  progress: number;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ status, progress }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[100] bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl flex flex-col items-center justify-center transition-all duration-500 animate-in fade-in">
      <div className="relative mb-10 scale-110 md:scale-125">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
        
        {/* Background Circle */}
        <svg className="w-48 h-48 transform -rotate-90 relative">
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            className="text-gray-100 dark:text-gray-800"
          />
          {/* Progress Circle with Gradient */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--brand-400)" />
              <stop offset="100%" stopColor="var(--brand-600)" />
            </linearGradient>
          </defs>
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
            strokeLinecap="round"
          />
        </svg>
        
        {/* Percentage Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">{Math.round(progress)}%</span>
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Progress</span>
        </div>
      </div>
      
      <div className="text-center space-y-4 max-w-sm px-6">
        <h3 className="text-2xl font-black text-gray-800 dark:text-gray-100 tracking-tight leading-tight">
            {status}
        </h3>
        
        <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
                <span 
                    key={i} 
                    className="w-2.5 h-2.5 bg-brand-500 rounded-full animate-bounce" 
                    style={{ animationDelay: `${i * 150}ms` }}
                />
            ))}
        </div>
        
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium pt-2">
            Please keep this tab open while we process your request. Our servers are working hard to ensure quality.
        </p>
      </div>
    </div>
  );
};

export default ProcessingOverlay;
