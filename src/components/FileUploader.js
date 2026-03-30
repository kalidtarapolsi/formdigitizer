import React, { useState, useRef, useCallback } from 'react';

export default function FileUploader({ onFileSelected, isProcessing }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const validateFile = (file) => {
    if (!file) return 'No file selected.';
    if (file.type !== 'application/pdf') return 'Please upload a PDF file.';
    if (file.size > 50 * 1024 * 1024) return 'File is too large. Maximum size is 50MB.';
    return null;
  };

  const handleFile = useCallback((file) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onFileSelected(file);
  }, [onFileSelected]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    if (!isProcessing) fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div className="uploader-wrapper">
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />

        {isProcessing ? (
          <div className="processing-state">
            <div className="spinner" />
            <p className="drop-title">Analyzing PDF...</p>
            <p className="drop-subtitle">Extracting form fields and structure</p>
          </div>
        ) : (
          <div className="idle-state">
            <div className="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <polyline points="9 15 12 12 15 15" />
              </svg>
            </div>
            <p className="drop-title">
              {isDragging ? 'Drop your PDF here' : 'Drag & drop a VA form PDF'}
            </p>
            <p className="drop-subtitle">or click to browse files</p>
            <p className="drop-hint">Supports all VA, SF, and DD form PDFs up to 50MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="upload-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
