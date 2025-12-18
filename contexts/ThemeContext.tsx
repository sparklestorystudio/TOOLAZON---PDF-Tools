
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  themeColor: string;
  setThemeColor: (color: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Purple #9333ea
  const [themeColor, setThemeColor] = useState('#9333ea'); 
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('toolazon_dark_mode') === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Dark Mode Handling
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('toolazon_dark_mode', String(isDarkMode));

    // Brand Color Handling
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 147, g: 51, b: 234 }; // Default fallback
    };

    const rgb = hexToRgb(themeColor);
    
    const mix = (c1: {r:number, g:number, b:number}, c2: {r:number, g:number, b:number}, weight: number) => {
        const r = Math.round(c1.r * (1 - weight) + c2.r * weight);
        const g = Math.round(c1.g * (1 - weight) + c2.g * weight);
        const b = Math.round(c1.b * (1 - weight) + c2.b * weight);
        return `rgb(${r}, ${g}, ${b})`;
    };
    
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };
    
    root.style.setProperty('--brand-50', mix(rgb, white, 0.9));
    root.style.setProperty('--brand-100', mix(rgb, white, 0.8));
    root.style.setProperty('--brand-200', mix(rgb, white, 0.6));
    root.style.setProperty('--brand-300', mix(rgb, white, 0.4));
    root.style.setProperty('--brand-400', mix(rgb, white, 0.2));
    root.style.setProperty('--brand-500', `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    root.style.setProperty('--brand-600', mix(rgb, black, 0.1));
    root.style.setProperty('--brand-700', mix(rgb, black, 0.2));
    root.style.setProperty('--brand-800', mix(rgb, black, 0.3));
    root.style.setProperty('--brand-900', mix(rgb, black, 0.4));

  }, [themeColor, isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor, isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
