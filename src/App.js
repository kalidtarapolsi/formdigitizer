import React, { useState, useCallback } from 'react';
import FileUploader from './components/FileUploader';
import PDFViewer from './components/PDFViewer';
import FormSchemaEditor from './components/FormSchemaEditor';
import FormPreview from './components/FormPreview';
import ExportPanel from './components/ExportPanel';
import { parsePDF } from './utils/pdfParser';
import './styles/App.css';

const TABS = [
  { id: 'editor', label: 'Field Editor', icon: 'edit' },
  { id: 'preview', label: 'Form Preview', icon: 'eye' },
  { id: 'export', label: 'Export', icon: 'download' },
];

export default function App() {
  const [schema, setSchema] = useState(null);
  const [pageImages, setPageImages] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState('editor');
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFileSelected = useCallback(async (file) => {
    setIsProcessing(true);
    setError(null);
    setFileName(file.name);

    try {
      const result = await parsePDF(file);
      setSchema(result.schema);
      setPageImages(result.pageImages);
      setMetadata(result.metadata);
      setCurrentPage(0);
      setActiveTab('editor');
    } catch (err) {
      console.error('PDF parsing error:', err);
      setError(`Failed to parse PDF: ${err.message}`);
      setSchema(null);
      setPageImages([]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleReset = () => {
    setSchema(null);
    setPageImages([]);
    setMetadata(null);
    setFileName('');
    setError(null);
    setCurrentPage(0);
    setActiveTab('editor');
  };

  const tabIcon = (id) => {
    switch (id) {
      case 'editor':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
      case 'preview':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
      case 'export':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
      default: return null;
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="6" fill="#112e51" />
              <text x="16" y="23" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold" fontFamily="serif">VA</text>
            </svg>
            <div className="logo-text">
              <span className="logo-title">VA Form Digitizer</span>
              <span className="logo-subtitle">PDF to Digital Form Converter</span>
            </div>
          </div>
        </div>
        {schema && (
          <div className="header-right">
            <span className="file-name">{fileName}</span>
            <button className="btn-reset" onClick={handleReset}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              New Form
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="app-main">
        {!schema && !isProcessing ? (
          <div className="upload-screen">
            <div className="upload-hero">
              <h1>Digitize Any VA Form</h1>
              <p>
                Upload a VA PDF form and instantly convert it into an interactive, fillable
                digital form. Supports all VA, SF, and DD form types.
              </p>
            </div>
            <FileUploader onFileSelected={handleFileSelected} isProcessing={isProcessing} />

            <div className="features-grid">
              <div className="feature">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                </div>
                <h3>Smart Field Detection</h3>
                <p>Automatically extracts form fields from PDF AcroForm data and intelligently infers fields from text patterns.</p>
              </div>
              <div className="feature">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <h3>Full Customization</h3>
                <p>Edit field labels, types, ordering, and validation. Add or remove fields. Full control over the output.</p>
              </div>
              <div className="feature">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                </div>
                <h3>HTML + JSON Export</h3>
                <p>Download as a styled HTML form ready for deployment, or export as JSON Schema for integration into any system.</p>
              </div>
            </div>

            {error && (
              <div className="global-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}
          </div>
        ) : isProcessing ? (
          <div className="upload-screen">
            <FileUploader onFileSelected={handleFileSelected} isProcessing={true} />
          </div>
        ) : (
          <div className="workspace">
            {/* Tab navigation */}
            <div className="workspace-tabs">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`workspace-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tabIcon(tab.id)}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="workspace-content">
              {/* Left panel: PDF viewer */}
              <div className="workspace-left">
                <PDFViewer
                  pageImages={pageImages}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </div>

              {/* Right panel: active tab content */}
              <div className="workspace-right">
                {activeTab === 'editor' && (
                  <FormSchemaEditor
                    schema={schema}
                    onSchemaChange={setSchema}
                  />
                )}
                {activeTab === 'preview' && (
                  <FormPreview schema={schema} />
                )}
                {activeTab === 'export' && (
                  <ExportPanel schema={schema} />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
