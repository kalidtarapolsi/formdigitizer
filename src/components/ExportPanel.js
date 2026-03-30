import React, { useState } from 'react';
import { generateJSONSchema, generateHTMLForm } from '../utils/pdfParser';

export default function ExportPanel({ schema }) {
  const [exportStatus, setExportStatus] = useState(null);

  if (!schema) return null;

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    try {
      const jsonSchema = generateJSONSchema(schema);
      const content = JSON.stringify(jsonSchema, null, 2);
      const filename = `${schema.formId || 'form'}-schema.json`;
      downloadFile(content, filename, 'application/json');
      setExportStatus({ type: 'success', message: `Downloaded ${filename}` });
    } catch (err) {
      setExportStatus({ type: 'error', message: 'Failed to generate JSON schema.' });
    }
  };

  const handleExportHTML = () => {
    try {
      const html = generateHTMLForm(schema);
      const filename = `${schema.formId || 'form'}.html`;
      downloadFile(html, filename, 'text/html');
      setExportStatus({ type: 'success', message: `Downloaded ${filename}` });
    } catch (err) {
      setExportStatus({ type: 'error', message: 'Failed to generate HTML form.' });
    }
  };

  const handleCopyJSON = async () => {
    try {
      const jsonSchema = generateJSONSchema(schema);
      await navigator.clipboard.writeText(JSON.stringify(jsonSchema, null, 2));
      setExportStatus({ type: 'success', message: 'JSON schema copied to clipboard!' });
    } catch (err) {
      setExportStatus({ type: 'error', message: 'Failed to copy to clipboard.' });
    }
  };

  const handleExportRawSchema = () => {
    try {
      const content = JSON.stringify(schema, null, 2);
      const filename = `${schema.formId || 'form'}-raw-schema.json`;
      downloadFile(content, filename, 'application/json');
      setExportStatus({ type: 'success', message: `Downloaded ${filename}` });
    } catch (err) {
      setExportStatus({ type: 'error', message: 'Failed to export raw schema.' });
    }
  };

  return (
    <div className="export-panel">
      <h3 className="export-title">Export Options</h3>

      <div className="export-grid">
        <div className="export-card" onClick={handleExportHTML}>
          <div className="export-icon html-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <div className="export-info">
            <strong>HTML Form</strong>
            <span>Styled, fillable HTML form with VA design system</span>
          </div>
          <svg className="export-download" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </div>

        <div className="export-card" onClick={handleExportJSON}>
          <div className="export-icon json-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 7c0-1.1.9-2 2-2h1c1.1 0 2 .9 2 2v1c0 .6-.4 1-1 1H7" />
              <path d="M20 17c0 1.1-.9 2-2 2h-1c-1.1 0-2-.9-2-2v-1c0-.6.4-1 1-1h1" />
              <path d="M4 17c0 1.1.9 2 2 2h1c1.1 0 2-.9 2-2v-1c0-.6-.4-1-1-1H7" />
              <path d="M20 7c0-1.1-.9-2-2-2h-1c-1.1 0-2 .9-2 2v1c0 .6.4 1 1 1h1" />
            </svg>
          </div>
          <div className="export-info">
            <strong>JSON Schema</strong>
            <span>Standard JSON Schema for programmatic use</span>
          </div>
          <svg className="export-download" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </div>

        <div className="export-card" onClick={handleCopyJSON}>
          <div className="export-icon copy-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </div>
          <div className="export-info">
            <strong>Copy JSON</strong>
            <span>Copy JSON schema to clipboard</span>
          </div>
        </div>

        <div className="export-card" onClick={handleExportRawSchema}>
          <div className="export-icon raw-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="export-info">
            <strong>Raw Schema</strong>
            <span>Full internal schema with metadata and positions</span>
          </div>
          <svg className="export-download" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </div>
      </div>

      {exportStatus && (
        <div className={`export-toast ${exportStatus.type}`}>
          {exportStatus.type === 'success' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          )}
          {exportStatus.message}
        </div>
      )}

      <div className="export-stats">
        <div className="stat">
          <span className="stat-num">{schema.fields.length}</span>
          <span className="stat-label">Fields</span>
        </div>
        <div className="stat">
          <span className="stat-num">{schema.totalPages || '?'}</span>
          <span className="stat-label">Pages</span>
        </div>
        <div className="stat">
          <span className="stat-num">{schema.sections.length}</span>
          <span className="stat-label">Sections</span>
        </div>
        <div className="stat">
          <span className="stat-num">{schema.fields.filter(f => f.required).length}</span>
          <span className="stat-label">Required</span>
        </div>
      </div>
    </div>
  );
}
