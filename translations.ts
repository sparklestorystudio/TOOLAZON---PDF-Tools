import { LanguageCode } from './types';

export const LANGUAGES: { code: LanguageCode; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'ro', name: 'Română' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'th', name: 'ภาษาไทย' },
  { code: 'sv', name: 'Svenska' },
  { code: 'no', name: 'Norsk' },
  { code: 'fi', name: 'Suomi' },
  { code: 'hu', name: 'Magyar' },
  { code: 'cs', name: 'Čeština' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ur', name: 'اردو' },
];

type Translations = Record<string, string>;

// --- ENGLISH (Source) ---
const en: Translations = {
  // Navbar
  'nav.all_tools': 'All Tools',
  'nav.compress': 'Compress',
  'nav.edit': 'Edit',
  'nav.fill_sign': 'Fill & Sign',
  'nav.merge': 'Merge',
  'nav.delete_pages': 'Delete Pages',
  'nav.crop': 'Crop',
  'nav.pricing': 'Pricing',
  'nav.desktop': 'Desktop',
  'nav.login': 'Log in',

  // Hero
  'hero.title': 'We help with your PDF tasks',
  'hero.subtitle': 'Easy, pleasant and productive PDF editor',
  'hero.cta_main': 'Edit a PDF document',
  'hero.cta_free': "it's free",
  'hero.cta_secondary': 'or choose one of our 30+ PDF tools',
  'ui.upload': 'Upload PDF file',

  // Categories
  'cat.popular': 'MOST POPULAR',
  'cat.merge': 'MERGE',
  'cat.split': 'SPLIT',
  'cat.edit_sign': 'EDIT & SIGN',
  'cat.compress': 'COMPRESS & SCANS',
  'cat.security': 'SECURITY',
  'cat.convert_from': 'CONVERT FROM PDF',
  'cat.convert_to': 'CONVERT TO PDF',
  'cat.others': 'OTHERS',
  'cat.automate': 'AUTOMATE',
  'cat.scans': 'SCANS',

  // Feature Section
  'feature.title': 'Works the way you work',
  'feature.subtitle': 'Online or offline — in the cloud or as a desktop application',
  'feature.web.title': 'Toolazon Web',
  'feature.web.desc': 'Works in the browser. Our servers process the files for you. Files stay secure. After processing, they are permanently deleted.',
  'feature.web.cta': 'Get started — it\'s free',
  'feature.desktop.title': 'Toolazon Desktop',
  'feature.desktop.desc': 'Works offline. Same features as the online service, and the files never leave your computer. Compatible with MacOS, Windows and Linux.',
  'feature.desktop.cta': 'Download now — it\'s free',

  // Footer
  'footer.resources': 'Resources',
  'footer.tools': 'Tools',
  'footer.more_tools': 'More Tools',
  'footer.languages': 'Languages',
  'footer.contact': 'Contact',
  'footer.made_in': 'Made in Amsterdam',

  // Assistant
  'ai.welcome': "Hi! I'm your Toolazon smart assistant. Can I help you find a PDF tool or guide?",
  'ai.placeholder': "How do I merge PDFs?",
  'ai.title': "Toolazon Assistant",
  'ai.ask': "Ask Assistant",

  // --- TOOLS ---
  'tool.pdf-editor.title': 'PDF Editor',
  'tool.pdf-editor.desc': 'Edit PDF files for free. Fill & sign PDF. Add text, links, images and shapes.',
  'tool.pdf-editor-2.title': 'PDF Editor',
  'tool.pdf-editor-2.desc': 'Edit PDF files for free. Fill & sign PDF.',
  
  'tool.compress.title': 'Compress',
  'tool.compress.desc': 'Reduce the size of your PDF',
  'tool.compress-2.title': 'Compress',
  'tool.compress-2.desc': 'Reduce the size of your PDF',

  'tool.delete-pages.title': 'Delete Pages',
  'tool.delete-pages.desc': 'Remove pages from a PDF document',
  'tool.delete-pages-2.title': 'Delete Pages',
  'tool.delete-pages-2.desc': 'Remove pages from a PDF document',

  'tool.merge.title': 'Merge',
  'tool.merge.desc': 'Combine multiple PDFs and images into one',
  'tool.merge-2.title': 'Merge',
  'tool.merge-2.desc': 'Combine multiple PDFs and images into one',

  'tool.split.title': 'Split',
  'tool.split.desc': 'Split specific page ranges or extract every page into a separate document',
  'tool.split-pages.title': 'Split By Pages',
  'tool.split-pages.desc': 'Split specific page ranges or extract every page into a separate document',

  'tool.crop.title': 'Crop',
  'tool.crop.desc': 'Trim PDF margins, change PDF page size',

  'tool.fill-sign.title': 'Fill & Sign',
  'tool.fill-sign.desc': 'Add signature to PDF. Fill out PDF forms',
  'tool.fill-sign-2.title': 'Fill & Sign',
  'tool.fill-sign-2.desc': 'Add signature to PDF. Fill out PDF forms',

  'tool.pdf-to-word.title': 'PDF To Word',
  'tool.pdf-to-word.desc': 'Convert from PDF to DOC online',
  'tool.pdf-word-2.title': 'PDF To Word',
  'tool.pdf-word-2.desc': 'Convert from PDF to DOC online',

  'tool.extract.title': 'Extract Pages',
  'tool.extract.desc': 'Get a new document containing only the desired pages',
  'tool.extract-2.title': 'Extract Pages',
  'tool.extract-2.desc': 'Get a new document containing only the desired pages',

  'tool.alternate.title': 'Alternate & Mix',
  'tool.alternate.desc': 'Mixes pages from 2 or more documents, alternating between them',

  'tool.organize.title': 'Organize',
  'tool.organize.desc': 'Arrange and reorder PDF pages',

  'tool.split-bookmarks.title': 'Split By Bookmarks',
  'tool.split-bookmarks.desc': 'Extract chapters to separate documents based on the bookmarks',

  'tool.split-half.title': 'Split In Half',
  'tool.split-half.desc': 'Split two page layout scans, A3 to double A4 or A4 to double A5',

  'tool.split-size.title': 'Split By Size',
  'tool.split-size.desc': 'Get multiple smaller documents with specific file sizes',

  'tool.split-text.title': 'Split By Text',
  'tool.split-text.desc': 'Extract separate documents when specific text changes from page to page',

  'tool.create-forms.title': 'Create Forms',
  'tool.create-forms.desc': 'Free PDF forms creator. Make existing PDF documents fillable',

  'tool.edit-metadata.title': 'Edit Metadata',
  'tool.edit-metadata.desc': 'Change PDF Author, Title, Keywords, Subject and other metadata fields',

  'tool.page-numbers.title': 'Page Numbers',
  'tool.page-numbers.desc': 'Add PDF page numbers',

  'tool.deskew.title': 'Deskew',
  'tool.deskew.desc': 'Automatically straighten and deskew scanned PDF pages',

  'tool.ocr.title': 'OCR',
  'tool.ocr.desc': 'Convert PDF scans to searchable text and PDFs. Extract text from scans',

  'tool.grayscale.title': 'Grayscale',
  'tool.grayscale.desc': 'Make a PDF text and images grayscale',

  'tool.protect.title': 'Protect',
  'tool.protect.desc': 'Protect file with password and permissions',

  'tool.unlock.title': 'Unlock',
  'tool.unlock.desc': 'Remove restrictions and password from PDF files',

  'tool.watermark.title': 'Watermark',
  'tool.watermark.desc': 'Add image or text watermark to PDF documents',

  'tool.flatten.title': 'Flatten',
  'tool.flatten.desc': 'Makes fillable PDFs read-only. Print & scan in one step',

  'tool.pdf-excel.title': 'PDF To Excel',
  'tool.pdf-excel.desc': 'Convert PDF to Excel or CSV online for free. Extract table data.',

  'tool.pdf-jpg.title': 'PDF To JPG',
  'tool.pdf-jpg.desc': 'Get PDF pages converted to JPG, PNG or TIFF images',

  'tool.pdf-ppt.title': 'PDF To PPT',
  'tool.pdf-ppt.desc': 'Convert PDF to PowerPoint online',

  'tool.pdf-text.title': 'PDF To Text',
  'tool.pdf-text.desc': 'Convert your PDF to a simple text file',

  'tool.jpg-pdf.title': 'JPG To PDF',
  'tool.jpg-pdf.desc': 'Convert images to PDF',

  'tool.word-pdf.title': 'Word To PDF',
  'tool.word-pdf.desc': 'Create a PDF document from Microsoft Word .docx',

  'tool.ppt-pdf.title': 'PowerPoint To PDF',
  'tool.ppt-pdf.desc': 'Convert PowerPoint presentations to PDF',

  'tool.excel-pdf.title': 'Excel To PDF',
  'tool.excel-pdf.desc': 'Convert Excel spreadsheets to PDF',

  'tool.html-pdf.title': 'HTML To PDF',
  'tool.html-pdf.desc': 'Convert web pages or HTML files to PDF documents',

  'tool.bates.title': 'Bates Numbering',
  'tool.bates.desc': 'Bates stamp multiple files at once',

  'tool.resize.title': 'Resize',
  'tool.resize.desc': 'Add page margins and padding, Change PDF page size',

  'tool.repair.title': 'Repair',
  'tool.repair.desc': 'Recover data from a corrupted or damaged PDF document',

  'tool.header-footer.title': 'Header & Footer',
  'tool.header-footer.desc': 'Apply page numbers or text labels to PDF files',
  'headerfooter.apply': 'Apply Header & Footer',
  'headerfooter.style': 'Style',
  'headerfooter.content': 'Content',
  'headerfooter.header': 'Header',
  'headerfooter.footer': 'Footer',

  // --- GUIDES ---
  'guides.title': 'How-To PDF Guides',

  // Guide 0: Edit
  'guide.0.title': 'How to edit PDF files',
  'guide.0.link': 'Edit PDF files',
  'guide.0.step.0': 'Open a file in the Online PDF editor',
  'guide.0.step.1': 'Click on the Text tool in the top menu',
  'guide.0.step.2': 'Add text on the PDF page. Change text by clicking on existing text to start editing',
  'guide.0.step.3': 'Add images to the page. Click and drag to move, resize or rotate the image',
  'guide.0.step.4': 'Fill out PDF forms and add signatures. Draw, type or upload an image of your signature',
  'guide.0.step.5': 'Annotate PDF pages, highlight text and mark changes with strikethrough',
  'guide.0.step.6': 'Add new links to web URLs or pages in the document. Easily edit existing hyperlinks in the PDF',
  'guide.0.step.7': 'Easily find and replace all occurrences of words in a PDF. Whiteout parts of the page. Add shapes',
  'guide.0.step.8': 'Click Apply changes and download an edited document',

  // Guide 1: Convert to Word
  'guide.1.title': 'How to convert a PDF to Word',
  'guide.1.link': 'PDF to DOC converter',
  'guide.1.step.0': 'Open your document with the PDF to Word converter',
  'guide.1.step.1': 'Click Convert and download a Word document',

  // Guide 2: Merge
  'guide.2.title': 'How to combine PDF files',
  'guide.2.link': 'Merge PDF files',
  'guide.2.step.0': 'Open the Merge PDF files tool',
  'guide.2.step.1': 'Drag to reorder the files, or sort them alphabetically',
  'guide.2.step.2': 'Optionally select only a collection of pages to pick from each file',
  'guide.2.step.3': 'Select your documents, or just drag and drop them all to the page',
  'guide.2.step.4': 'Generate bookmarks or an outline based on the inputs',
  'guide.2.step.5': 'Add file names to the footer of each page',
  'guide.2.step.6': 'Generate a nice table of contents based on the documents being merged',
  'guide.2.step.7': 'Optionally specify a cover / title page(s)',
  'guide.2.step.8': 'Merge Acroforms or flatten form fields',

  // Guide 3: PDF to JPG
  'guide.3.title': 'How to convert PDF to JPG',
  'guide.3.link': 'PDF to image converter',
  'guide.3.step.0': 'Open your PDF with the PDF to JPG, PNG and TIFF converter',
  'guide.3.step.1': 'Convert all pages or select only pages you want converted',
  'guide.3.step.2': 'Select desired image format, PNG, TIFF or JPG',
  'guide.3.step.3': 'Choose a higher resolution, 150 or 220',
  'guide.3.step.4': 'Quickly convert a PDF page to PNG or JPG',
  'guide.3.step.5': 'Download an archive with all the converted images',

  // Guide 4: Delete Pages
  'guide.4.title': 'How to delete pages from PDF',
  'guide.4.link': 'Delete PDF Pages',
  'guide.4.step.0': 'Open the file with the Delete PDF Pages tool',
  'guide.4.step.1': 'Click the pages you want to remove',
  'guide.4.step.2': 'Download a new document, with the pages removed',

  // Guide 5: Mac
  'guide.5.title': 'How to edit PDF on Mac',
  'guide.5.link': 'Edit PDF offline with Toolazon Desktop for Mac',
  'guide.5.step.0': 'Edit PDF files online in your Safari browser',
  'guide.5.step.1': 'Download and install Toolazon Desktop and edit PDF documents offline',

  // Guide 6: Type
  'guide.6.title': 'How to type on a PDF',
  'guide.6.link': 'Fill out PDF files',
  'guide.6.step.0': 'Open you file using the PDF editor',
  'guide.6.step.1': 'Select the Text tool in the top menu',
  'guide.6.step.2': 'Click anywhere on the page to start typing',
  'guide.6.step.3': 'Fill out PDF forms easily, even if no form inputs are present',
  'guide.6.step.4': 'Save and download your filled out document',

  // Guide 7: Protect
  'guide.7.title': 'How to password protect a PDF',
  'guide.7.link': 'Protect PDF with password and restrictions',
  'guide.7.step.0': 'Open the Encrypt and Protect PDF tool',
  'guide.7.step.1': 'Select your PDF document',
  'guide.7.step.2': 'Choose a really strong password (16 characters or more recommended)',
  'guide.7.step.3': 'Optionally, select a set of restrictions for your document: modifying, printing, copying text and graphics, etc',
  'guide.7.step.4': 'Save and download your protected PDF',

  // Guide 8: Compress
  'guide.8.title': 'How to compress a PDF',
  'guide.8.desc': 'How to reduce PDF file size',
  'guide.8.link': 'Compress PDF online',
  'guide.8.step.0': 'Open your document with the Compress PDF tool',
  'guide.8.step.1': 'Configure image quality and resolution. This controls how small your PDF will become',
  'guide.8.step.2': 'Compress and download your smaller PDF',
};

// Helper to merge overrides
const createTranslation = (langCode: string, overrides: Partial<Translations>): Translations => {
  return { ...en, ...overrides };
};

// --- TRANSLATIONS ---

const es: Translations = createTranslation('es', {
  'nav.all_tools': 'Todas las herramientas',
  'nav.compress': 'Comprimir',
  'nav.edit': 'Editar',
  'nav.fill_sign': 'Rellenar y firmar',
  'nav.merge': 'Unir',
  'nav.delete_pages': 'Eliminar páginas',
  'nav.crop': 'Recortar',
  'hero.title': 'Ayudamos con sus tareas de PDF',
  'hero.subtitle': 'Editor de PDF fácil, agradable y productivo',
  'cat.popular': 'MÁS POPULAR',
  'cat.merge': 'UNIR',
  'cat.split': 'DIVIDIR',
  'cat.edit_sign': 'EDITAR Y FIRMAR',
  'cat.compress': 'COMPRIMIR Y ESCANEAR',
  'cat.security': 'SEGURIDAD',
  'cat.convert_from': 'CONVERTIR DESDE PDF',
  'cat.convert_to': 'CONVERTIR A PDF',
  'cat.others': 'OTROS',
  'guides.title': 'Guías de PDF',
  
  // Tools
  'tool.pdf-editor.title': 'Editor de PDF',
  'tool.pdf-editor.desc': 'Edita archivos PDF gratis. Rellena y firma PDF.',
  'tool.compress.title': 'Comprimir',
  'tool.compress.desc': 'Reduce el tamaño de tu PDF',
  'tool.merge.title': 'Unir',
  'tool.merge.desc': 'Combina múltiples PDFs e imágenes',
  'tool.split.title': 'Dividir',
  'tool.split.desc': 'Divide rangos de páginas o extrae páginas',
  'tool.crop.title': 'Recortar',
  'tool.crop.desc': 'Recorta márgenes, cambia tamaño de página',
  'tool.pdf-to-word.title': 'PDF a Word',
  'tool.pdf-to-word.desc': 'Convierte de PDF a DOC en línea',
  'tool.extract.title': 'Extraer Páginas',
  'tool.extract.desc': 'Obtén un nuevo documento con solo las páginas deseadas',
  'tool.alternate.title': 'Alternar y Mezclar',
  'tool.alternate.desc': 'Mezcla páginas de 2 o más documentos',
  'tool.organize.title': 'Organizar',
  'tool.organize.desc': 'Ordena y reordena páginas PDF',
  'tool.header-footer.title': 'Encabezado y pie de página',
  'tool.header-footer.desc': 'Añadir números de página o texto al PDF',
  'tool.excel-pdf.title': 'Excel a PDF',
  'tool.excel-pdf.desc': 'Convierte hojas de cálculo Excel a PDF',
  'tool.pdf-excel.title': 'PDF a Excel',
  'tool.pdf-excel.desc': 'Convierte PDF a Excel o CSV',
  'tool.pdf-jpg.title': 'PDF a JPG',
  'tool.pdf-jpg.desc': 'Convierte páginas de PDF a imágenes',
  'tool.ocr.title': 'OCR',
  'tool.ocr.desc': 'Reconocimiento de texto en documentos escaneados',
  'tool.create-forms.title': 'Crear Formularios',
  'tool.create-forms.desc': 'Creador de formularios PDF gratuito.',
  
  // Header Footer Tool
  'headerfooter.apply': 'Aplicar cambios',
  'headerfooter.style': 'Estilo',
  'headerfooter.content': 'Contenido',
  'headerfooter.header': 'Encabezado',
  'headerfooter.footer': 'Pie de página',

  // Guides
  'guide.0.title': 'Cómo editar archivos PDF',
  'guide.0.link': 'Editar archivos PDF',
  'guide.0.step.0': 'Abre un archivo en el editor de PDF en línea',
  'guide.0.step.1': 'Haz clic en la herramienta Texto en el menú superior',
  'guide.0.step.2': 'Añade texto en la página. Haz clic en texto existente para editar',
  'guide.0.step.8': 'Haz clic en Aplicar cambios y descarga el documento editado',

  'guide.1.title': 'Cómo convertir un PDF a Word',
  'guide.1.link': 'Convertidor PDF a DOC',
  
  'guide.2.title': 'Cómo combinar archivos PDF',
  'guide.2.link': 'Unir archivos PDF',
  
  'guide.4.title': 'Cómo eliminar páginas de PDF',
  'guide.4.link': 'Eliminar páginas PDF',

  'guide.8.title': 'Cómo comprimir un PDF',
  'guide.8.desc': 'Cómo reducir el tamaño de archivo PDF',
});

const fr: Translations = createTranslation('fr', {
  'nav.all_tools': 'Tous les outils',
  'nav.compress': 'Compresser',
  'nav.edit': 'Éditer',
  'nav.fill_sign': 'Remplir et signer',
  'nav.merge': 'Fusionner',
  'nav.delete_pages': 'Supprimer des pages',
  'nav.crop': 'Rogner',
  'hero.title': 'Nous vous aidons avec vos tâches PDF',
  'hero.subtitle': 'Éditeur PDF facile, agréable et productif',
  'cat.popular': 'LES PLUS POPULAIRES',
  'cat.merge': 'FUSIONNER',
  'cat.split': 'DIVISER',
  'cat.edit_sign': 'ÉDITER & SIGNER',
  'cat.compress': 'COMPRESSER',
  'cat.security': 'SÉCURITÉ',
  'cat.convert_from': 'CONVERTIR DEPUIS PDF',
  'cat.convert_to': 'CONVERTIR EN PDF',
  'cat.others': 'AUTRES',
  'guides.title': 'Guides PDF',
  'tool.pdf-editor.title': 'Éditeur PDF',
  'tool.pdf-editor.desc': 'Modifiez des fichiers PDF gratuitement. Remplissez et signez.',
  'tool.compress.title': 'Compresser',
  'tool.compress.desc': 'Réduisez la taille de votre PDF',
  'tool.merge.title': 'Fusionner',
  'tool.merge.desc': 'Combinez plusieurs PDF et images en un seul',
  'tool.split.title': 'Diviser',
  'tool.split.desc': 'Divisez des plages de pages ou extrayez des pages',
  'tool.pdf-to-word.title': 'PDF en Word',
  'tool.pdf-to-word.desc': 'Convertissez de PDF en DOC en ligne',
  'tool.header-footer.title': 'En-tête et pied de page',
  'tool.header-footer.desc': 'Ajouter des numéros de page ou du texte',
  'tool.create-forms.title': 'Créer des formulaires',
  'headerfooter.apply': 'Appliquer les changements',
  'guide.0.title': 'Comment éditer des fichiers PDF',
  'guide.1.title': 'Comment convertir un PDF en Word',
});

const de: Translations = createTranslation('de', {
  'nav.all_tools': 'Alle Werkzeuge',
  'nav.compress': 'Komprimieren',
  'nav.edit': 'Bearbeiten',
  'nav.fill_sign': 'Ausfüllen & Unterschreiben',
  'nav.merge': 'Zusammenfügen',
  'nav.delete_pages': 'Seiten löschen',
  'nav.crop': 'Zuschneiden',
  'hero.title': 'Wir helfen bei Ihren PDF-Aufgaben',
  'hero.subtitle': 'Einfacher, angenehmer und produktiver PDF-Editor',
  'cat.popular': 'BELIEBTESTE',
  'cat.merge': 'ZUSAMMENFÜGEN',
  'cat.split': 'TEILEN',
  'cat.edit_sign': 'BEARBEITEN',
  'cat.compress': 'KOMPRIMIEREN',
  'cat.security': 'SICHERHEIT',
  'cat.convert_from': 'UMWANDELN VON PDF',
  'cat.convert_to': 'UMWANDELN IN PDF',
  'cat.others': 'ANDERE',
  'guides.title': 'PDF-Anleitungen',
  'tool.pdf-editor.title': 'PDF-Editor',
  'tool.pdf-editor.desc': 'PDF-Dateien kostenlos bearbeiten.',
  'tool.compress.title': 'Komprimieren',
  'tool.compress.desc': 'Reduzieren Sie die Größe Ihrer PDF',
  'tool.merge.title': 'Zusammenfügen',
  'tool.merge.desc': 'Mehrere PDFs und Bilder zusammenfügen',
  'tool.split.title': 'Teilen',
  'tool.split.desc': 'Seitenbereiche teilen oder extrahieren',
  'tool.pdf-to-word.title': 'PDF in Word',
  'tool.pdf-to-word.desc': 'PDF online in DOC umwandeln',
  'tool.header-footer.title': 'Kopf- und Fußzeile',
  'tool.header-footer.desc': 'Seitennummern oder Text hinzufügen',
  'tool.create-forms.title': 'Formulare erstellen',
  'headerfooter.apply': 'Änderungen anwenden',
  'guide.0.title': 'Wie man PDF-Dateien bearbeitet',
  'guide.1.title': 'Wie man ein PDF in Word umwandelt',
});

const it: Translations = createTranslation('it', {
  'nav.all_tools': 'Tutti gli strumenti',
  'nav.compress': 'Comprimi',
  'nav.edit': 'Modifica',
  'nav.fill_sign': 'Compila e Firma',
  'nav.merge': 'Unire',
  'nav.delete_pages': 'Elimina pagine',
  'nav.crop': 'Ritaglia',
  'hero.title': 'Ti aiutiamo con i tuoi PDF',
  'hero.subtitle': 'Editor PDF facile, piacevole e produttivo',
  'cat.popular': 'PIÙ POPOLARI',
  'cat.merge': 'UNIRE',
  'cat.split': 'DIVIDERE',
  'cat.edit_sign': 'MODIFICA E FIRMA',
  'cat.compress': 'COMPRIMI',
  'cat.security': 'SICUREZZA',
  'cat.convert_from': 'CONVERTI DA PDF',
  'cat.convert_to': 'CONVERTI IN PDF',
  'guides.title': 'Guide PDF',
  'tool.pdf-editor.title': 'Editor PDF',
  'tool.pdf-editor.desc': 'Modifica file PDF gratuitamente.',
  'tool.compress.title': 'Comprimi',
  'tool.compress.desc': 'Riduci le dimensioni del tuo PDF',
  'tool.merge.title': 'Unire',
  'tool.merge.desc': 'Combina più PDF in uno solo',
  'tool.header-footer.title': 'Intestazione e piè di pagina',
  'headerfooter.apply': 'Applica modifiche',
  'guide.0.title': 'Come modificare file PDF',
});

const pt: Translations = createTranslation('pt', {
  'nav.all_tools': 'Todas as ferramentas',
  'nav.compress': 'Comprimir',
  'nav.edit': 'Editar',
  'nav.fill_sign': 'Preencher e Assinar',
  'nav.merge': 'Juntar',
  'nav.delete_pages': 'Excluir páginas',
  'nav.crop': 'Cortar',
  'hero.title': 'Ajudamos com seus PDFs',
  'hero.subtitle': 'Editor de PDF fácil, agradável e produtivo',
  'cat.popular': 'MAIS POPULARES',
  'cat.merge': 'JUNTAR',
  'cat.split': 'DIVIDIR',
  'cat.edit_sign': 'EDITAR & ASSINAR',
  'cat.compress': 'COMPRIMIR',
  'cat.security': 'SEGURANÇA',
  'cat.convert_from': 'CONVERTER DE PDF',
  'cat.convert_to': 'CONVERTER PARA PDF',
  'guides.title': 'Guias PDF',
  'tool.pdf-editor.title': 'Editor de PDF',
  'tool.pdf-editor.desc': 'Edite arquivos PDF gratuitamente.',
  'tool.compress.title': 'Comprimir',
  'tool.compress.desc': 'Reduza o tamanho do seu PDF',
  'tool.merge.title': 'Juntar',
  'tool.merge.desc': 'Combine vários PDFs em um',
  'tool.header-footer.title': 'Cabeçalho e rodapé',
  'headerfooter.apply': 'Aplicar alterações',
  'guide.0.title': 'Como editar arquivos PDF',
});

const id: Translations = createTranslation('id', {
  'nav.all_tools': 'Semua Alat',
  'nav.compress': 'Kompres',
  'nav.edit': 'Edit',
  'nav.fill_sign': 'Isi & Tanda Tangan',
  'nav.merge': 'Gabungkan',
  'nav.delete_pages': 'Hapus Halaman',
  'hero.title': 'Kami membantu tugas PDF Anda',
  'hero.subtitle': 'Editor PDF yang mudah dan produktif',
  'cat.popular': 'PALING POPULER',
  'guides.title': 'Panduan PDF',
  'tool.pdf-editor.title': 'Editor PDF',
  'tool.pdf-editor.desc': 'Edit file PDF secara gratis.',
});

const nl: Translations = createTranslation('nl', {
  'nav.all_tools': 'Alle tools',
  'nav.compress': 'Comprimeren',
  'nav.edit': 'Bewerken',
  'nav.merge': 'Samenvoegen',
  'hero.title': 'Wij helpen met uw PDF-taken',
  'hero.subtitle': 'Makkelijke en productieve PDF-editor',
  'cat.popular': 'POPULAIRSTE',
  'guides.title': 'PDF Handleidingen',
  'tool.pdf-editor.title': 'PDF Editor',
  'tool.pdf-editor.desc': 'Bewerk PDF-bestanden gratis.',
});

const pl: Translations = createTranslation('pl', {
  'nav.all_tools': 'Wszystkie narzędzia',
  'nav.compress': 'Kompresuj',
  'nav.edit': 'Edytuj',
  'nav.merge': 'Połącz',
  'hero.title': 'Pomożemy z Twoimi zadaniami PDF',
  'hero.subtitle': 'Łatwy i produktywny edytor PDF',
  'cat.popular': 'NAJPOPULARNIEJSZE',
  'guides.title': 'Przewodniki PDF',
  'tool.pdf-editor.title': 'Edytor PDF',
  'tool.pdf-editor.desc': 'Edytuj pliki PDF za darmo.',
});

const tr: Translations = createTranslation('tr', {
  'nav.all_tools': 'Tüm Araçlar',
  'nav.compress': 'Sıkıştır',
  'nav.edit': 'Düzenle',
  'nav.merge': 'Birleştir',
  'hero.title': 'PDF işlerinizde size yardımcı oluyoruz',
  'hero.subtitle': 'Kolay ve verimli PDF düzenleyici',
  'cat.popular': 'EN POPÜLER',
  'guides.title': 'PDF Rehberleri',
  'tool.pdf-editor.title': 'PDF Düzenleyici',
  'tool.pdf-editor.desc': 'PDF dosyalarını ücretsiz düzenleyin.',
});

const zh: Translations = createTranslation('zh', {
  'nav.all_tools': '所有工具',
  'nav.compress': '压缩',
  'nav.edit': '编辑',
  'nav.merge': '合并',
  'hero.title': '我们帮助您处理 PDF 任务',
  'hero.subtitle': '简单、高效的 PDF 编辑器',
  'cat.popular': '最受欢迎',
  'guides.title': 'PDF 指南',
  'tool.pdf-editor.title': 'PDF 编辑器',
  'tool.pdf-editor.desc': '免费编辑 PDF 文件。',
});

const ja: Translations = createTranslation('ja', {
  'nav.all_tools': 'すべてのツール',
  'nav.compress': '圧縮',
  'nav.edit': '編集',
  'nav.merge': '結合',
  'hero.title': 'PDFタスクをお手伝いします',
  'hero.subtitle': '簡単で生産的なPDFエディター',
  'cat.popular': '人気',
  'guides.title': 'PDFガイド',
  'tool.pdf-editor.title': 'PDFエディター',
  'tool.pdf-editor.desc': '無料でPDFファイルを編集します。',
});

const ko: Translations = createTranslation('ko', {
  'nav.all_tools': '모든 도구',
  'nav.compress': '압축',
  'nav.edit': '편집',
  'nav.merge': '병합',
  'hero.title': 'PDF 작업을 도와드립니다',
  'hero.subtitle': '쉽고 생산적인 PDF 편집기',
  'cat.popular': '인기',
  'guides.title': 'PDF 가이드',
  'tool.pdf-editor.title': 'PDF 편집기',
  'tool.pdf-editor.desc': 'PDF 파일을 무료로 편집하세요.',
});

const ru: Translations = createTranslation('ru', { // Fallback map if code not in type, but handled by generic structure
  'nav.all_tools': 'Все инструменты',
  'nav.compress': 'Сжать',
  'nav.edit': 'Редактировать',
  'nav.merge': 'Объединить',
  'hero.title': 'Мы поможем с вашими PDF',
  'hero.subtitle': 'Простой и удобный PDF-редактор',
});

export const TRANS_DICT: Record<LanguageCode, Translations> = {
  en,
  es,
  fr,
  de,
  it,
  pt,
  id,
  nl,
  pl,
  tr,
  zh,
  ja,
  ko,
  // Mapping other languages to English with Hero translation overrides where available or just English fallback
  ro: createTranslation('ro', { 'hero.title': 'Vă ajutăm cu sarcinile PDF' }),
  vi: createTranslation('vi', { 'hero.title': 'Chúng tôi giúp bạn với các tác vụ PDF' }),
  th: createTranslation('th', { 'hero.title': 'เราช่วยคุณจัดการงาน PDF' }),
  sv: createTranslation('sv', { 'hero.title': 'Vi hjälper dig med dina PDF-uppgifter' }),
  no: createTranslation('no', { 'hero.title': 'Vi hjelper deg med dine PDF-oppgaver' }),
  fi: createTranslation('fi', { 'hero.title': 'Autamme sinua PDF-tehtävissäsi' }),
  hu: createTranslation('hu', { 'hero.title': 'Segítünk a PDF feladatokban' }),
  cs: createTranslation('cs', { 'hero.title': 'Pomůžeme vám s úkoly PDF' }),
  hi: createTranslation('hi', { 'hero.title': 'हम आपके PDF कार्यों में मदद करते हैं' }),
  ur: createTranslation('ur', { 'hero.title': 'ہم آپ کے پی ڈی ایف کاموں میں مدد کرتے ہیں' }),
};