import React from 'react';
import { TOOL_CATEGORIES } from '../constants';
import { ToolItem, NavProps } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ToolCardProps {
  item: ToolItem;
  onClick: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ item, onClick }) => {
  const { t } = useLanguage();
  const Icon = item.icon;
  
  // Dynamic translations
  const title = t(`tool.${item.id}.title`, item.title);
  const description = t(`tool.${item.id}.desc`, item.description);
  
  const bgColorClass = item.color ? item.color.replace('text-', 'bg-') : 'bg-gray-100';

  return (
    <div 
      onClick={onClick}
      className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full group"
    >
      <div className="flex items-start mb-3">
        <div className={`p-2 rounded-md bg-opacity-10 mr-3 ${bgColorClass}`}>
          <Icon className={`w-6 h-6 ${item.color || 'text-gray-600'}`} />
        </div>
        <h3 className="text-gray-800 font-semibold group-hover:text-brand-600 transition-colors">
            {title}
        </h3>
      </div>
      <p className="text-gray-500 text-xs leading-relaxed mt-1">
        {description}
      </p>
    </div>
  );
};

const ToolsGrid: React.FC<NavProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

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

  const handleToolClick = (toolId: string) => {
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
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pb-20 -mt-10 relative z-10">
      <div className="space-y-12">
        {TOOL_CATEGORIES.map((category) => (
          <div key={category.title}>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 inline-block">
              {getCatTitle(category.title)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {category.items.map((item) => (
                <ToolCard 
                  key={item.id} 
                  item={item} 
                  onClick={() => handleToolClick(item.id)} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolsGrid;