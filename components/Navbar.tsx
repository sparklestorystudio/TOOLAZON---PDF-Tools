import React, { useState } from 'react';
import { ChevronDown, Menu, Globe, X } from 'lucide-react';
import { NAV_LINKS, TOOL_CATEGORIES } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ToolCategory, NavProps } from '../types';
import LanguageModal from './LanguageModal';

const CategoryList = ({ category, onToolClick, t }: { category: ToolCategory | undefined, onToolClick: (id: string, e: React.MouseEvent) => void, t: any }) => {
  if (!category) return null;
  
  const getCatTitle = (key: string) => {
    const map: Record<string, string> = {
      'MOST POPULAR': 'cat.popular',
      'MERGE': 'cat.merge',
      'SPLIT': 'cat.split',
      'EDIT & SIGN': 'cat.edit_sign',
      'COMPRESS & SCANS': 'cat.compress',
      'SECURITY': 'cat.security',
      'CONVERT FROM PDF': 'cat.convert_from',
      'CONVERT TO PDF': 'cat.convert_to',
      'OTHERS': 'cat.others',
    };
    return t(map[key] || key);
  };

  return (
    <div className="mb-6 break-inside-avoid">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">
        {getCatTitle(category.title)}
      </h3>
      <ul className="space-y-2">
        {category.items.map((item) => (
          <li key={item.id}>
            <a 
              href="#" 
              onClick={(e) => onToolClick(item.id, e)}
              className="flex items-center text-gray-600 hover:text-brand-600 group/item transition-colors"
            >
              <item.icon className={`w-4 h-4 mr-2 ${item.color || 'text-gray-400'} flex-shrink-0`} />
              <span className="text-sm font-medium group-hover:text-brand-600">
                {t(`tool.${item.id}.title`, item.title)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Navbar: React.FC<NavProps> = ({ onNavigate }) => {
  const { themeColor, setThemeColor } = useTheme();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Helper to find category by title
  const getCategory = (title: string): ToolCategory | undefined => 
    TOOL_CATEGORIES.find(c => c.title === title);

  const handleToolClick = (toolId: string, e: React.MouseEvent) => {
    e.preventDefault();
    // Normalize ID checks
    if (toolId === 'extract' || toolId === 'extract-2') {
      onNavigate('extract-pages');
    } else if (toolId === 'compress' || toolId === 'compress-2') {
      onNavigate('compress-pdf');
    } else if (toolId === 'merge' || toolId === 'merge-2') {
      onNavigate('merge-pdf');
    } else if (toolId === 'delete-pages' || toolId === 'delete-pages-2') {
      onNavigate('delete-pages');
    } else if (toolId === 'crop') {
      onNavigate('crop-pdf');
    } else if (toolId === 'pdf-editor' || toolId === 'pdf-editor-2') {
      onNavigate('pdf-editor');
    } else if (toolId === 'pdf-to-word' || toolId === 'pdf-word-2') {
      onNavigate('pdf-to-word');
    } else if (toolId === 'split' || toolId === 'split-pages') {
      onNavigate('split-pdf');
    } else if (toolId === 'edit-metadata') {
      onNavigate('edit-metadata');
    } else if (toolId === 'organize') {
      onNavigate('organize-pdf');
    } else if (toolId === 'header-footer') {
      onNavigate('header-footer');
    } else if (toolId === 'excel-pdf') {
      onNavigate('excel-to-pdf');
    } else if (toolId === 'pdf-jpg') {
      onNavigate('pdf-to-jpg');
    } else if (toolId === 'pdf-excel') {
      onNavigate('pdf-to-excel');
    } else if (toolId === 'ocr') {
      onNavigate('ocr-pdf');
    } else if (toolId === 'create-forms') {
      onNavigate('create-forms');
    } else if (toolId === 'unlock') {
      onNavigate('unlock-pdf');
    } else if (toolId === 'protect') {
      onNavigate('protect-pdf');
    } else {
      onNavigate('home');
    }
    setMobileMenuOpen(false);
    setIsDropdownOpen(false); // Close mega menu
  };

  return (
    <>
    <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-md rounded-b-2xl border-b border-gray-100 transition-all font-sans">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 md:px-8 h-[70px]">
        {/* Logo and Main Nav */}
        <div className="flex items-center gap-8 h-full">
          <div 
            className="flex items-center space-x-2 cursor-pointer flex-shrink-0"
            onClick={() => onNavigate('home')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-200">
              T
            </div>
            <span className="text-2xl font-bold text-gray-800 tracking-tight">Toolazon</span>
          </div>
          
          <div className="hidden md:flex items-center h-full space-x-2 text-sm font-medium text-gray-600">
            {NAV_LINKS.map((link) => {
              const linkLabel = link.name === 'All Tools' ? t('nav.all_tools') :
                                link.name === 'Compress' ? t('nav.compress') :
                                link.name === 'Edit' ? t('nav.edit') :
                                link.name === 'Fill & Sign' ? t('nav.fill_sign') :
                                link.name === 'Merge' ? t('nav.merge') :
                                link.name === 'Delete Pages' ? t('nav.delete_pages') :
                                link.name === 'Crop' ? t('nav.crop') : link.name;

              if (link.name === 'All Tools') {
                return (
                  <div 
                    key={link.name} 
                    className="relative group h-full flex items-center"
                    onMouseEnter={() => setIsDropdownOpen(true)}
                    onMouseLeave={() => setIsDropdownOpen(false)}
                  >
                    <button 
                        className={`flex items-center px-4 py-2 group-hover:bg-gray-50/80 rounded-lg transition-colors font-semibold ${isDropdownOpen ? 'text-brand-600' : 'text-gray-700'}`}
                    >
                      {linkLabel}
                      <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Mega Menu - Controlled by State */}
                    {isDropdownOpen && (
                      <div className="absolute top-[60px] left-0 pt-2 w-[750px] lg:w-[960px] block z-50">
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 grid grid-cols-4 gap-8 max-h-[85vh] overflow-y-auto">
                          <div className="col-span-1"><CategoryList category={getCategory('MOST POPULAR')} onToolClick={handleToolClick} t={t} /></div>
                          <div className="col-span-1">
                            <CategoryList category={getCategory('MERGE')} onToolClick={handleToolClick} t={t} />
                            <CategoryList category={getCategory('SPLIT')} onToolClick={handleToolClick} t={t} />
                          </div>
                          <div className="col-span-1">
                            <CategoryList category={getCategory('EDIT & SIGN')} onToolClick={handleToolClick} t={t} />
                            <CategoryList category={getCategory('COMPRESS & SCANS')} onToolClick={handleToolClick} t={t} />
                            <CategoryList category={getCategory('SECURITY')} onToolClick={handleToolClick} t={t} />
                          </div>
                          <div className="col-span-1">
                            <CategoryList category={getCategory('CONVERT FROM PDF')} onToolClick={handleToolClick} t={t} />
                            <CategoryList category={getCategory('CONVERT TO PDF')} onToolClick={handleToolClick} t={t} />
                            <CategoryList category={getCategory('OTHERS')} onToolClick={handleToolClick} t={t} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <a 
                  key={link.name} 
                  href={link.href}
                  onClick={(e) => {
                      e.preventDefault();
                      setIsDropdownOpen(false); // Ensure menu closed if clicked elsewhere
                      if (link.name === 'Extract Pages') onNavigate('extract-pages');
                      else if (link.name === 'Compress') onNavigate('compress-pdf');
                      else if (link.name === 'Merge') onNavigate('merge-pdf');
                      else if (link.name === 'Delete Pages') onNavigate('delete-pages');
                      else if (link.name === 'Crop') onNavigate('crop-pdf');
                      else if (link.name === 'Edit') onNavigate('pdf-editor');
                      else onNavigate('home');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-brand-600 hover:bg-gray-50/80 rounded-lg transition-colors font-medium whitespace-nowrap"
                >
                  {linkLabel}
                </a>
              );
            })}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4 text-sm font-medium">
          <button 
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <button 
              onClick={() => setLangModalOpen(true)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
               <Globe className="w-5 h-5" />
            </button>
            <div className="relative w-6 h-6 rounded-full overflow-hidden shadow-sm cursor-pointer hover:scale-110 transition-transform">
                <input 
                type="color" 
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                title="Choose theme color"
                className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer border-none p-0 m-0"
                />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl py-4 px-4 flex flex-col space-y-2 z-40 max-h-[85vh] overflow-y-auto rounded-b-2xl">
           {NAV_LINKS.filter(l => l.name !== 'All Tools').map((link) => {
              const linkLabel = link.name === 'Compress' ? t('nav.compress') :
                                link.name === 'Edit' ? t('nav.edit') :
                                link.name === 'Fill & Sign' ? t('nav.fill_sign') :
                                link.name === 'Merge' ? t('nav.merge') :
                                link.name === 'Delete Pages' ? t('nav.delete_pages') :
                                link.name === 'Crop' ? t('nav.crop') : link.name;
              return (
                 <a 
                   key={link.name}
                   href={link.href}
                   onClick={(e) => {
                     e.preventDefault();
                     setMobileMenuOpen(false);
                     if (link.name === 'Compress') onNavigate('compress-pdf');
                     else if (link.name === 'Merge') onNavigate('merge-pdf');
                     else if (link.name === 'Extract Pages') onNavigate('extract-pages');
                     else if (link.name === 'Delete Pages') onNavigate('delete-pages');
                     else if (link.name === 'Crop') onNavigate('crop-pdf');
                     else if (link.name === 'Edit') onNavigate('pdf-editor');
                     else onNavigate('home');
                   }}
                   className="py-3 px-4 hover:bg-gray-50 rounded-xl text-gray-700 font-medium"
                 >
                   {linkLabel}
                 </a>
              );
           })}
           <div className="border-t border-gray-100 my-2 pt-4">
             <p className="px-4 text-xs font-bold text-gray-400 uppercase mb-3">{t('nav.all_tools')}</p>
             {TOOL_CATEGORIES.map(cat => (
               <div key={cat.title} className="mb-6 px-4">
                 <p className="text-xs font-bold text-brand-600 mb-2">{t(cat.title === 'MOST POPULAR' ? 'cat.popular' : 'cat.others')}</p>
                 <div className="pl-3 border-l-2 border-gray-100 space-y-2">
                   {cat.items.slice(0, 4).map(item => (
                     <a 
                       key={item.id} 
                       href="#" 
                       onClick={(e) => handleToolClick(item.id, e)}
                       className="block text-sm text-gray-600 py-1 hover:text-brand-600"
                     >
                        {t(`tool.${item.id}.title`, item.title)}
                     </a>
                   ))}
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </nav>
    <LanguageModal isOpen={langModalOpen} onClose={() => setLangModalOpen(false)} />
    </>
  );
};

export default Navbar;