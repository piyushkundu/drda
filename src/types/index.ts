// ============================================
// Type Definitions for Hindi Government Drafting App
// ============================================

export interface Document {
  id: string;
  title: string;
  content: string;
  plainText?: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
  isAutoSaved: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  children?: Folder[];
  documents?: Document[];
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  nameHindi: string;
  category: TemplateCategory;
  department: Department;
  content: string;
  description?: string;
}

export interface CustomWord {
  id: string;
  input: string;
  output: string;
  category?: string;
  createdAt: string;
}

export interface Settings {
  theme: 'dark' | 'light';
  defaultFont: string;
  defaultFontSize: number;
  aiModel: AIModel;
  autoCorrect: boolean;
  exportFormat: ExportFormat;
  language: 'hi' | 'en';
}

export type AIModel = 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant' | 'gemma2-9b-it' | 'mixtral-8x7b-32768';

export type ExportFormat = 'pdf' | 'docx';

export type TemplateCategory = 
  | 'complaint'
  | 'report'
  | 'letter'
  | 'order'
  | 'notice'
  | 'memo'
  | 'notesheet'
  | 'reminder'
  | 'reply'
  | 'application';

export type Department =
  | 'DRDA'
  | 'Social Audit'
  | 'Nagar Palika'
  | 'Panchayat'
  | 'Block Office'
  | 'Tehsil'
  | 'IGRS'
  | 'Rural Development'
  | 'CDO Office'
  | 'NIC'
  | 'General';

export type SidebarPanel =
  | 'dashboard'
  | 'editor'
  | 'templates'
  | 'ai-generator'
  | 'font-converter'
  | 'ocr'
  | 'dictionary'
  | 'files'
  | 'settings';

export type RibbonTab = 'home' | 'insert' | 'convert' | 'export' | 'ai';

export interface AICorrection {
  original: string;
  corrected: string;
  confidence: number;
}

export interface AIDraftRequest {
  topic: string;
  department: Department;
  letterType: TemplateCategory;
  additionalContext?: string;
}

export interface GovDictionaryEntry {
  hindi: string;
  english: string;
  hinglish: string;
  category: string;
  usage?: string;
}

export type FontConversionType =
  | 'hinglish-to-unicode'
  | 'hinglish-to-krutidev'
  | 'unicode-to-krutidev'
  | 'krutidev-to-unicode'
  | 'mangal-to-krutidev'
  | 'krutidev-to-mangal';
