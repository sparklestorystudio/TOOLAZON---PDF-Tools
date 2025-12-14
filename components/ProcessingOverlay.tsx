import React from 'react';

interface ProcessingOverlayProps {
  status: string;
  progress: number;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ status, progress }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center transition-opacity duration-300">
      <div className="relative mb-8">
        {/* Background Circle */}
        <svg className="w-40 h-40 transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-100"
          />
          {/* Progress Circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-brand-500 transition-all duration-300 ease-out"
            strokeLinecap="round"
          />
        </svg>
        {/* Percentage Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-800">{Math.round(progress)}%</span>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center px-4">{status}</h3>
      <div className="flex gap-2">
        <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"></span>
        <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-100"></span>
        <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-200"></span>
      </div>
      <p className="text-gray-500 mt-4 text-sm font-medium">Please do not close this window</p>
    </div>
  );
};

export default ProcessingOverlay;