import React, { useState } from 'react';

export default function PDFViewer({ pageImages, currentPage, onPageChange }) {
  const [zoom, setZoom] = useState(1);

  if (!pageImages || pageImages.length === 0) return null;

  const page = pageImages[currentPage] || pageImages[0];

  return (
    <div className="pdf-viewer">
      <div className="pdf-toolbar">
        <span className="pdf-title">Original PDF</span>
        <div className="pdf-nav">
          <button
            className="pdf-nav-btn"
            disabled={currentPage === 0}
            onClick={() => onPageChange(currentPage - 1)}
            title="Previous page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="pdf-page-info">
            Page {currentPage + 1} of {pageImages.length}
          </span>
          <button
            className="pdf-nav-btn"
            disabled={currentPage === pageImages.length - 1}
            onClick={() => onPageChange(currentPage + 1)}
            title="Next page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
        <div className="pdf-zoom">
          <button className="pdf-nav-btn" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} title="Zoom out">-</button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button className="pdf-nav-btn" onClick={() => setZoom(z => Math.min(3, z + 0.25))} title="Zoom in">+</button>
        </div>
      </div>
      <div className="pdf-canvas-wrapper">
        <img
          src={page.dataUrl}
          alt={`Page ${currentPage + 1}`}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          className="pdf-page-image"
        />
      </div>
    </div>
  );
}
