import { LucideIcon } from 'lucide-react';

export type LanguageCode = 'en' | 'id' | 'de' | 'cs' | 'es' | 'fr' | 'it' | 'ja' | 'ko' | 'hu' | 'nl' | 'no' | 'pl' | 'pt' | 'ro' | 'fi' | 'sv' | 'th' | 'vi' | 'tr' | 'hi' | 'ur' | 'zh';

export type View = 'home' | 'extract-pages' | 'compress-pdf' | 'merge-pdf' | 'delete-pages' | 'crop-pdf' | 'pdf-editor' | 'pdf-to-word' | 'split-pdf' | 'edit-metadata' | 'organize-pdf' | 'header-footer' | 'excel-to-pdf' | 'pdf-to-jpg' | 'pdf-to-excel' | 'ocr-pdf' | 'create-forms' | 'unlock-pdf' | 'protect-pdf' | 'terms' | 'privacy' | 'cookies' | 'about';

export interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color?: string; // e.g., 'text-green-500'
  isNew?: boolean;
}

export interface ToolCategory {
  title: string;
  items: ToolItem[];
}

export interface GuideStep {
  text: string;
}

export interface Guide {
  title: string;
  description?: string;
  steps: GuideStep[];
  linkText: string;
}

export interface NavProps {
  onNavigate: (view: View) => void;
}