import React from 'react';
import { 
  FilePen, Minimize2, Trash2, Combine, Scissors, Crop, PenTool, FileText, 
  Files, ArrowRightLeft, Image, FileInput, Lock, Unlock, Stamp, Globe, 
  Settings, Camera, Type, Link, RefreshCw, LayoutTemplate, Printer, 
  Move, RotateCw, Wand2, FileSearch, HardDrive, Monitor, ShieldCheck,
  FileCheck, FileCode, Wrench, Hash, FileSpreadsheet, LockOpen
} from 'lucide-react';
import { ToolCategory, Guide } from './types';

// Helper icon component since Lucide doesn't have "Columns" exactly like I want
export const ColumnsIcon = React.forwardRef<SVGSVGElement, any>((props, ref) => {
  return (
    <svg 
      {...props}
      ref={ref}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="12" x2="12" y1="3" y2="21" />
    </svg>
  );
});

// Custom Compress Icon to match the "4 corners" style in the attachment
export const CompressIcon = React.forwardRef<SVGSVGElement, any>((props, ref) => {
  return (
    <svg 
      {...props}
      ref={ref}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M4 14V20H10" />
      <path d="M20 10V4H14" />
      <path d="M14 20H20V14" />
      <path d="M10 4H4V10" />
    </svg>
  );
});

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    title: "MOST POPULAR",
    items: [
      { id: 'pdf-editor', title: 'PDF Editor', description: 'Edit PDF files for free. Fill & sign PDF. Add text, links, images and shapes.', icon: FilePen, color: 'text-blue-500' },
      { id: 'compress', title: 'Compress', description: 'Reduce the size of your PDF', icon: CompressIcon, color: 'text-sky-500' },
      { id: 'delete-pages', title: 'Delete Pages', description: 'Remove pages from a PDF document', icon: Trash2, color: 'text-red-500' },
      { id: 'merge', title: 'Merge', description: 'Combine multiple PDFs and images into one', icon: Combine, color: 'text-amber-500' },
      { id: 'split', title: 'Split', description: 'Split specific page ranges or extract every page into a separate document', icon: Scissors, color: 'text-teal-500' },
      { id: 'crop', title: 'Crop', description: 'Trim PDF margins, change PDF page size', icon: Crop, color: 'text-purple-500' },
      { id: 'fill-sign', title: 'Fill & Sign', description: 'Add signature to PDF. Fill out PDF forms', icon: PenTool, color: 'text-blue-400' },
      { id: 'pdf-to-word', title: 'PDF To Word', description: 'Convert from PDF to DOC online', icon: FileText, color: 'text-blue-600' },
      { id: 'extract', title: 'Extract Pages', description: 'Get a new document containing only the desired pages', icon: Files, color: 'text-emerald-500' },
    ]
  },
  {
    title: "MERGE",
    items: [
      { id: 'alternate', title: 'Alternate & Mix', description: 'Mixes pages from 2 or more documents, alternating between them', icon: ArrowRightLeft, color: 'text-indigo-500' },
      { id: 'merge-2', title: 'Merge', description: 'Combine multiple PDFs and images into one', icon: Combine, color: 'text-amber-500' },
      { id: 'organize', title: 'Organize', description: 'Arrange and reorder PDF pages', icon: LayoutTemplate, color: 'text-orange-500' },
    ]
  },
  {
    title: "SPLIT",
    items: [
      { id: 'extract-2', title: 'Extract Pages', description: 'Get a new document containing only the desired pages', icon: Files, color: 'text-emerald-500' },
      { id: 'split-pages', title: 'Split By Pages', description: 'Split specific page ranges or extract every page into a separate document', icon: Scissors, color: 'text-teal-500' },
      { id: 'split-bookmarks', title: 'Split By Bookmarks', description: 'Extract chapters to separate documents based on the bookmarks', icon: FileSearch, color: 'text-cyan-500' },
      { id: 'split-half', title: 'Split In Half', description: 'Split two page layout scans, A3 to double A4 or A4 to double A5', icon: ColumnsIcon, color: 'text-sky-500' },
      { id: 'split-size', title: 'Split By Size', description: 'Get multiple smaller documents with specific file sizes', icon: HardDrive, color: 'text-gray-500' },
      { id: 'split-text', title: 'Split By Text', description: 'Extract separate documents when specific text changes from page to page', icon: Type, color: 'text-zinc-500' },
    ]
  },
  {
    title: "EDIT & SIGN",
    items: [
      { id: 'pdf-editor-2', title: 'PDF Editor', description: 'Edit PDF files for free. Fill & sign PDF.', icon: FilePen, color: 'text-blue-500' },
      { id: 'fill-sign-2', title: 'Fill & Sign', description: 'Add signature to PDF. Fill out PDF forms', icon: PenTool, color: 'text-blue-400' },
      { id: 'create-forms', title: 'Create Forms', description: 'Free PDF forms creator. Make existing PDF documents fillable', icon: FileInput, color: 'text-emerald-600' },
      { id: 'delete-pages-2', title: 'Delete Pages', description: 'Remove pages from a PDF document', icon: Trash2, color: 'text-red-500' },
      { id: 'edit-metadata', title: 'Edit Metadata', description: 'Change PDF Author, Title, Keywords, Subject and other metadata fields', icon: Settings, color: 'text-gray-600' },
      { id: 'page-numbers', title: 'Page Numbers', description: 'Add PDF page numbers', icon: Hash, color: 'text-pink-500' },
    ]
  },
  {
    title: "COMPRESS & SCANS",
    items: [
      { id: 'compress-2', title: 'Compress', description: 'Reduce the size of your PDF', icon: CompressIcon, color: 'text-sky-500' },
      { id: 'deskew', title: 'Deskew', description: 'Automatically straighten and deskew scanned PDF pages', icon: RotateCw, color: 'text-yellow-600' },
      { id: 'ocr', title: 'OCR', description: 'Convert PDF scans to searchable text and PDFs. Extract text from scans', icon: FileSearch, color: 'text-orange-600' },
      { id: 'grayscale', title: 'Grayscale', description: 'Make a PDF text and images grayscale', icon: Wand2, color: 'text-gray-400' },
    ]
  },
  {
    title: "SECURITY",
    items: [
      { id: 'protect', title: 'Protect', description: 'Protect file with password and permissions', icon: Lock, color: 'text-blue-600' },
      { id: 'unlock', title: 'Unlock', description: 'Remove restrictions and password from PDF files', icon: LockOpen, color: 'text-sky-500' },
      { id: 'watermark', title: 'Watermark', description: 'Add image or text watermark to PDF documents', icon: Stamp, color: 'text-purple-600' },
      { id: 'flatten', title: 'Flatten', description: 'Makes fillable PDFs read-only. Print & scan in one step', icon: Printer, color: 'text-gray-600' },
    ]
  },
  {
    title: "CONVERT FROM PDF",
    items: [
      { id: 'pdf-excel', title: 'PDF To Excel', description: 'Convert PDF to Excel or CSV online for free. Extract table data.', icon: FileSpreadsheet, color: 'text-green-600' },
      { id: 'pdf-jpg', title: 'PDF To JPG', description: 'Get PDF pages converted to JPG, PNG or TIFF images', icon: Image, color: 'text-yellow-500' },
      { id: 'pdf-ppt', title: 'PDF To PPT', description: 'Convert PDF to PowerPoint online', icon: Monitor, color: 'text-orange-500' },
      { id: 'pdf-text', title: 'PDF To Text', description: 'Convert your PDF to a simple text file', icon: Type, color: 'text-gray-500' },
      { id: 'pdf-word-2', title: 'PDF To Word', description: 'Convert from PDF to DOC online', icon: FileText, color: 'text-blue-600' },
    ]
  },
  {
    title: "CONVERT TO PDF",
    items: [
      { id: 'jpg-pdf', title: 'JPG To PDF', description: 'Convert images to PDF', icon: Image, color: 'text-yellow-500' },
      { id: 'word-pdf', title: 'Word To PDF', description: 'Create a PDF document from Microsoft Word .docx', icon: FileText, color: 'text-blue-600' },
      { id: 'ppt-pdf', title: 'PowerPoint To PDF', description: 'Convert PowerPoint presentations to PDF', icon: Monitor, color: 'text-orange-500' },
      { id: 'excel-pdf', title: 'Excel To PDF', description: 'Convert Excel spreadsheets to PDF', icon: FileSpreadsheet, color: 'text-green-600' },
      { id: 'html-pdf', title: 'HTML To PDF', description: 'Convert web pages or HTML files to PDF documents', icon: FileCode, color: 'text-pink-500' },
    ]
  },
  {
    title: "OTHERS",
    items: [
      { id: 'bates', title: 'Bates Numbering', description: 'Bates stamp multiple files at once', icon: Hash, color: 'text-gray-600' },
      { id: 'resize', title: 'Resize', description: 'Add page margins and padding, Change PDF page size', icon: Move, color: 'text-indigo-500' },
      { id: 'repair', title: 'Repair', description: 'Recover data from a corrupted or damaged PDF document', icon: Wrench, color: 'text-red-400' },
      { id: 'header-footer', title: 'Header & Footer', description: 'Apply page numbers or text labels to PDF files', icon: LayoutTemplate, color: 'text-cyan-600' },
    ]
  }
];

export const GUIDES: Guide[] = [
  {
    title: "How to edit PDF files",
    steps: [
      { text: "Open a file in the Online PDF editor" },
      { text: "Click on the Text tool in the top menu" },
      { text: "Add text on the PDF page. Change text by clicking on existing text to start editing" },
      { text: "Add images to the page. Click and drag to move, resize or rotate the image" },
      { text: "Fill out PDF forms and add signatures. Draw, type or upload an image of your signature" },
      { text: "Annotate PDF pages, highlight text and mark changes with strikethrough" },
      { text: "Add new links to web URLs or pages in the document. Easily edit existing hyperlinks in the PDF" },
      { text: "Easily find and replace all occurrences of words in a PDF. Whiteout parts of the page. Add shapes" },
      { text: "Click Apply changes and download an edited document" },
    ],
    linkText: "Edit PDF files",
  },
  {
    title: "How to convert a PDF to Word",
    steps: [
      { text: "Open your document with the PDF to Word converter" },
      { text: "Click Convert and download a Word document" },
    ],
    linkText: "PDF to DOC converter",
  },
  {
    title: "How to combine PDF files",
    steps: [
      { text: "Open the Merge PDF files tool" },
      { text: "Drag to reorder the files, or sort them alphabetically" },
      { text: "Optionally select only a collection of pages to pick from each file" },
      { text: "Select your documents, or just drag and drop them all to the page" },
      { text: "Generate bookmarks or an outline based on the inputs" },
      { text: "Add file names to the footer of each page" },
      { text: "Generate a nice table of contents based on the documents being merged" },
      { text: "Optionally specify a cover / title page(s)" },
      { text: "Merge Acroforms or flatten form fields" },
    ],
    linkText: "Merge PDF files",
  },
  {
    title: "How to convert PDF to JPG",
    steps: [
      { text: "Open your PDF with the PDF to JPG, PNG and TIFF converter" },
      { text: "Convert all pages or select only pages you want converted" },
      { text: "Select desired image format, PNG, TIFF or JPG" },
      { text: "Choose a higher resolution, 150 or 220" },
      { text: "Quickly convert a PDF page to PNG or JPG" },
      { text: "Download an archive with all the converted images" },
    ],
    linkText: "PDF to image converter",
  },
  {
    title: "How to delete pages from PDF",
    steps: [
      { text: "Open the file with the Delete PDF Pages tool" },
      { text: "Click the pages you want to remove" },
      { text: "Download a new document, with the pages removed" },
    ],
    linkText: "Delete PDF Pages",
  },
  {
    title: "How to edit PDF on Mac",
    steps: [
      { text: "Edit PDF files online in your Safari browser" },
      { text: "Download and install Toolazon Desktop and edit PDF documents offline" },
    ],
    linkText: "Edit PDF offline with Toolazon Desktop for Mac",
  },
  {
    title: "How to type on a PDF",
    steps: [
      { text: "Open you file using the PDF editor" },
      { text: "Select the Text tool in the top menu" },
      { text: "Click anywhere on the page to start typing" },
      { text: "Fill out PDF forms easily, even if no form inputs are present" },
      { text: "Save and download your filled out document" },
    ],
    linkText: "Fill out PDF files",
  },
  {
    title: "How to password protect a PDF",
    steps: [
      { text: "Open the Encrypt and Protect PDF tool" },
      { text: "Select your PDF document" },
      { text: "Choose a really strong password (16 characters or more recommended)" },
      { text: "Optionally, select a set of restrictions for your document: modifying, printing, copying text and graphics, etc" },
      { text: "Save and download your protected PDF" },
    ],
    linkText: "Protect PDF with password and restrictions",
  },
  {
    title: "How to compress a PDF",
    description: "How to reduce PDF file size",
    steps: [
      { text: "Open your document with the Compress PDF tool" },
      { text: "Configure image quality and resolution. This controls how small your PDF will become" },
      { text: "Compress and download your smaller PDF" },
    ],
    linkText: "Compress PDF online",
  }
];

export const NAV_LINKS = [
  { name: "All Tools", href: "#", hasDropdown: true },
  { name: "Compress", href: "#" },
  { name: "Edit", href: "#" },
  { name: "Fill & Sign", href: "#" },
  { name: "Merge", href: "#" },
  { name: "Delete Pages", href: "#" },
  { name: "Crop", href: "#" },
];