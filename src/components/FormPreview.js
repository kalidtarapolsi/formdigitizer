import React, { useState, useMemo } from 'react';

export default function FormPreview({ schema }) {
  const [formData, setFormData] = useState({});
  const [viewMode, setViewMode] = useState('form'); // 'form' | 'html' | 'json'

  if (!schema) return null;

  const fields = schema.fields || [];
  const sections = schema.sections || [];

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form data:', formData);
  };

  // Group fields by section
  const groupedFields = useMemo(() => {
    const groups = [];
    const sectionMap = {};

    for (const section of sections) {
      sectionMap[section.id] = { section, fields: [] };
    }

    const ungrouped = [];
    for (const field of fields) {
      if (field.section && sectionMap[field.section]) {
        sectionMap[field.section].fields.push(field);
      } else {
        ungrouped.push(field);
      }
    }

    if (ungrouped.length > 0) {
      groups.push({ section: null, fields: ungrouped });
    }
    for (const section of sections) {
      if (sectionMap[section.id].fields.length > 0) {
        groups.push(sectionMap[section.id]);
      }
    }

    return groups;
  }, [fields, sections]);

  const renderField = (field) => {
    const value = formData[field.name] ?? field.defaultValue ?? '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'ssn':
        return (
          <div key={field.id} className="preview-field">
            <label>
              {field.label}
              {field.required && <span className="req">*</span>}
            </label>
            <input
              type={field.type === 'ssn' ? 'text' : field.type}
              value={value}
              onChange={e => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder || field.label}
              required={field.required}
              maxLength={field.maxLength}
              pattern={field.type === 'ssn' ? '\\d{3}-?\\d{2}-?\\d{4}' : undefined}
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="preview-field">
            <label>
              {field.label}
              {field.required && <span className="req">*</span>}
            </label>
            <input
              type="number"
              value={value}
              onChange={e => handleChange(field.name, e.target.value)}
              required={field.required}
            />
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="preview-field">
            <label>
              {field.label}
              {field.required && <span className="req">*</span>}
            </label>
            <input
              type="date"
              value={value}
              onChange={e => handleChange(field.name, e.target.value)}
              required={field.required}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="preview-field">
            <label>
              {field.label}
              {field.required && <span className="req">*</span>}
            </label>
            <textarea
              value={value}
              onChange={e => handleChange(field.name, e.target.value)}
              required={field.required}
              rows={4}
            />
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="preview-field preview-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData[field.name] || false}
                onChange={e => handleChange(field.name, e.target.checked)}
              />
              {field.label}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="preview-field">
            <label>
              {field.label}
              {field.required && <span className="req">*</span>}
            </label>
            <div className="radio-options">
              {(field.options || ['Yes', 'No']).map(opt => (
                <label key={opt} className="radio-label">
                  <input
                    type="radio"
                    name={field.name}
                    value={opt}
                    checked={formData[field.name] === opt}
                    onChange={() => handleChange(field.name, opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="preview-field">
            <label>
              {field.label}
              {field.required && <span className="req">*</span>}
            </label>
            <select
              value={value}
              onChange={e => handleChange(field.name, e.target.value)}
              required={field.required}
            >
              <option value="">-- Select --</option>
              {(field.options || []).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        );

      case 'signature':
        return (
          <div key={field.id} className="preview-field preview-signature">
            <label>
              {field.label}
              {field.required && <span className="req">*</span>}
            </label>
            <input
              type="text"
              value={value}
              onChange={e => handleChange(field.name, e.target.value)}
              placeholder="Type full legal name as signature"
              className="signature-input"
              required={field.required}
            />
          </div>
        );

      default:
        return (
          <div key={field.id} className="preview-field">
            <label>{field.label}</label>
            <input
              type="text"
              value={value}
              onChange={e => handleChange(field.name, e.target.value)}
            />
          </div>
        );
    }
  };

  return (
    <div className="form-preview">
      <div className="preview-toolbar">
        <div className="preview-tabs">
          <button
            className={`preview-tab ${viewMode === 'form' ? 'active' : ''}`}
            onClick={() => setViewMode('form')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>
            Live Preview
          </button>
          <button
            className={`preview-tab ${viewMode === 'html' ? 'active' : ''}`}
            onClick={() => setViewMode('html')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            HTML Source
          </button>
          <button
            className={`preview-tab ${viewMode === 'json' ? 'active' : ''}`}
            onClick={() => setViewMode('json')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7c0-1.1.9-2 2-2h1c1.1 0 2 .9 2 2v1c0 .6-.4 1-1 1H7"/><path d="M18 17c0 1.1-.9 2-2 2h-1c-1.1 0-2-.9-2-2v-1c0-.6.4-1 1-1h1"/></svg>
            JSON Schema
          </button>
        </div>
      </div>

      {viewMode === 'form' && (
        <div className="preview-form-wrapper">
          <div className="preview-form-container">
            <div className="preview-form-header">
              <h2>{schema.title}</h2>
              <span className="preview-form-id">{schema.formId}</span>
            </div>
            <form onSubmit={handleSubmit} className="preview-form-body">
              {groupedFields.map((group, gi) => (
                <div key={gi} className="preview-section">
                  {group.section && (
                    <h3 className="preview-section-title">{group.section.title}</h3>
                  )}
                  {group.fields.map(renderField)}
                </div>
              ))}
              <div className="preview-form-actions">
                <button type="submit" className="btn-preview-submit">Submit Form</button>
                <button type="button" className="btn-preview-reset" onClick={() => setFormData({})}>
                  Clear All
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'html' && (
        <div className="code-preview">
          <HTMLSourceView schema={schema} />
        </div>
      )}

      {viewMode === 'json' && (
        <div className="code-preview">
          <JSONSchemaView schema={schema} />
        </div>
      )}
    </div>
  );
}

function HTMLSourceView({ schema }) {
  // Lazy import to avoid circular deps — we just generate inline
  const html = useMemo(() => {
    // Simplified HTML generation for preview
    let h = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <title>${schema.title}</title>\n</head>\n<body>\n  <form>\n`;
    for (const field of schema.fields) {
      h += `    <!-- ${field.label} -->\n`;
      h += `    <label for="${field.name}">${field.label}</label>\n`;
      switch (field.type) {
        case 'textarea':
          h += `    <textarea id="${field.name}" name="${field.name}"${field.required ? ' required' : ''}></textarea>\n`;
          break;
        case 'checkbox':
          h += `    <input type="checkbox" id="${field.name}" name="${field.name}" />\n`;
          break;
        case 'select':
          h += `    <select id="${field.name}" name="${field.name}">\n`;
          for (const o of (field.options || [])) {
            h += `      <option value="${o}">${o}</option>\n`;
          }
          h += `    </select>\n`;
          break;
        case 'radio':
          for (const o of (field.options || ['Yes', 'No'])) {
            h += `    <label><input type="radio" name="${field.name}" value="${o}" /> ${o}</label>\n`;
          }
          break;
        default:
          h += `    <input type="${field.type === 'ssn' ? 'text' : field.type}" id="${field.name}" name="${field.name}"${field.required ? ' required' : ''} />\n`;
      }
      h += '\n';
    }
    h += `  </form>\n</body>\n</html>`;
    return h;
  }, [schema]);

  return <pre className="source-code">{html}</pre>;
}

function JSONSchemaView({ schema }) {
  const jsonSchema = useMemo(() => {
    const s = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: schema.title,
      description: `Digitized VA form: ${schema.formId}`,
      type: 'object',
      properties: {},
      required: [],
    };

    for (const field of schema.fields) {
      const prop = { title: field.label };
      switch (field.type) {
        case 'checkbox': prop.type = 'boolean'; break;
        case 'number': prop.type = 'number'; break;
        case 'select': case 'radio':
          prop.type = 'string';
          if (field.options?.length) prop.enum = field.options;
          break;
        default:
          prop.type = 'string';
          if (field.type === 'email') prop.format = 'email';
          if (field.type === 'date') prop.format = 'date';
      }
      s.properties[field.name] = prop;
      if (field.required) s.required.push(field.name);
    }

    return JSON.stringify(s, null, 2);
  }, [schema]);

  return <pre className="source-code">{jsonSchema}</pre>;
}
