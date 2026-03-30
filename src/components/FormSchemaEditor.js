import React, { useState } from 'react';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'ssn', label: 'SSN' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Group' },
  { value: 'select', label: 'Dropdown' },
  { value: 'signature', label: 'Signature' },
];

export default function FormSchemaEditor({ schema, onSchemaChange }) {
  const [expandedField, setExpandedField] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dragIndex, setDragIndex] = useState(null);

  if (!schema) return null;

  const fields = schema.fields || [];

  const filteredFields = searchTerm
    ? fields.filter(f =>
        f.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : fields;

  const updateField = (fieldId, updates) => {
    const newFields = fields.map(f =>
      f.id === fieldId ? { ...f, ...updates } : f
    );
    onSchemaChange({ ...schema, fields: newFields });
  };

  const removeField = (fieldId) => {
    const newFields = fields.filter(f => f.id !== fieldId);
    onSchemaChange({ ...schema, fields: newFields });
    if (expandedField === fieldId) setExpandedField(null);
  };

  const addField = () => {
    const newField = {
      id: `field_new_${Date.now()}`,
      name: `new_field_${fields.length + 1}`,
      label: `New Field ${fields.length + 1}`,
      type: 'text',
      required: false,
      defaultValue: '',
      source: 'manual',
      page: 0,
      section: null,
    };
    onSchemaChange({ ...schema, fields: [...fields, newField] });
    setExpandedField(newField.id);
  };

  const duplicateField = (field) => {
    const newField = {
      ...field,
      id: `field_dup_${Date.now()}`,
      name: `${field.name}_copy`,
      label: `${field.label} (copy)`,
    };
    const idx = fields.findIndex(f => f.id === field.id);
    const newFields = [...fields];
    newFields.splice(idx + 1, 0, newField);
    onSchemaChange({ ...schema, fields: newFields });
    setExpandedField(newField.id);
  };

  const moveField = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= fields.length) return;
    const newFields = [...fields];
    const [moved] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, moved);
    onSchemaChange({ ...schema, fields: newFields });
  };

  const handleDragStart = (index) => setDragIndex(index);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (index) => {
    if (dragIndex !== null && dragIndex !== index) {
      moveField(dragIndex, index);
    }
    setDragIndex(null);
  };

  const updateFormMeta = (key, value) => {
    onSchemaChange({ ...schema, [key]: value });
  };

  return (
    <div className="schema-editor">
      <div className="editor-header">
        <div className="editor-meta">
          <div className="meta-row">
            <label>Form Title</label>
            <input
              type="text"
              value={schema.title || ''}
              onChange={e => updateFormMeta('title', e.target.value)}
              className="meta-input"
            />
          </div>
          <div className="meta-row">
            <label>Form ID</label>
            <input
              type="text"
              value={schema.formId || ''}
              onChange={e => updateFormMeta('formId', e.target.value)}
              className="meta-input"
            />
          </div>
        </div>

        <div className="editor-toolbar">
          <div className="field-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search fields..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-add-field" onClick={addField}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Field
          </button>
        </div>

        <div className="field-count">
          {fields.length} field{fields.length !== 1 ? 's' : ''} detected
          {fields.filter(f => f.source === 'acroform').length > 0 && (
            <span className="source-badge acro">
              {fields.filter(f => f.source === 'acroform').length} from PDF form fields
            </span>
          )}
          {fields.filter(f => f.source === 'inferred').length > 0 && (
            <span className="source-badge inferred">
              {fields.filter(f => f.source === 'inferred').length} inferred from text
            </span>
          )}
        </div>
      </div>

      <div className="fields-list">
        {filteredFields.map((field, index) => {
          const isExpanded = expandedField === field.id;
          const realIndex = fields.findIndex(f => f.id === field.id);

          return (
            <div
              key={field.id}
              className={`field-item ${isExpanded ? 'expanded' : ''} ${dragIndex === realIndex ? 'dragging' : ''}`}
              draggable
              onDragStart={() => handleDragStart(realIndex)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(realIndex)}
            >
              <div
                className="field-summary"
                onClick={() => setExpandedField(isExpanded ? null : field.id)}
              >
                <div className="drag-handle" title="Drag to reorder">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="8" cy="6" r="2"/><circle cx="16" cy="6" r="2"/>
                    <circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/>
                    <circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/>
                  </svg>
                </div>
                <div className="field-info">
                  <span className="field-label">{field.label}</span>
                  <span className="field-meta">
                    <span className={`type-badge ${field.type}`}>{field.type}</span>
                    {field.required && <span className="required-badge">Required</span>}
                    <span className="source-tag">{field.source}</span>
                  </span>
                </div>
                <div className="field-actions-mini">
                  <button
                    className="icon-btn"
                    onClick={(e) => { e.stopPropagation(); moveField(realIndex, realIndex - 1); }}
                    disabled={realIndex === 0}
                    title="Move up"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <button
                    className="icon-btn"
                    onClick={(e) => { e.stopPropagation(); moveField(realIndex, realIndex + 1); }}
                    disabled={realIndex === fields.length - 1}
                    title="Move down"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <svg className="expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {isExpanded
                      ? <polyline points="6 9 12 15 18 9"/>
                      : <polyline points="9 18 15 12 9 6"/>}
                  </svg>
                </div>
              </div>

              {isExpanded && (
                <div className="field-details">
                  <div className="detail-grid">
                    <div className="detail-group">
                      <label>Label</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={e => updateField(field.id, { label: e.target.value })}
                      />
                    </div>
                    <div className="detail-group">
                      <label>Field Name (ID)</label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={e => updateField(field.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="detail-group">
                      <label>Type</label>
                      <select
                        value={field.type}
                        onChange={e => updateField(field.id, { type: e.target.value })}
                      >
                        {FIELD_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="detail-group">
                      <label className="checkbox-inline">
                        <input
                          type="checkbox"
                          checked={field.required || false}
                          onChange={e => updateField(field.id, { required: e.target.checked })}
                        />
                        Required
                      </label>
                    </div>

                    {(field.type === 'select' || field.type === 'radio') && (
                      <div className="detail-group full-width">
                        <label>Options (one per line)</label>
                        <textarea
                          value={(field.options || []).join('\n')}
                          onChange={e => updateField(field.id, { options: e.target.value.split('\n').filter(Boolean) })}
                          rows={4}
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                        />
                      </div>
                    )}

                    {field.type === 'text' && (
                      <div className="detail-group">
                        <label>Max Length</label>
                        <input
                          type="number"
                          value={field.maxLength || ''}
                          onChange={e => updateField(field.id, { maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
                          placeholder="No limit"
                        />
                      </div>
                    )}

                    {field.type === 'text' && (
                      <div className="detail-group">
                        <label>Placeholder</label>
                        <input
                          type="text"
                          value={field.placeholder || ''}
                          onChange={e => updateField(field.id, { placeholder: e.target.value })}
                        />
                      </div>
                    )}
                  </div>

                  <div className="field-detail-actions">
                    <button className="btn-sm btn-duplicate" onClick={() => duplicateField(field)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                      Duplicate
                    </button>
                    <button className="btn-sm btn-delete" onClick={() => removeField(field.id)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredFields.length === 0 && searchTerm && (
          <div className="no-results">No fields matching "{searchTerm}"</div>
        )}
        {fields.length === 0 && (
          <div className="no-results">
            No fields detected. Click "Add Field" to create fields manually.
          </div>
        )}
      </div>
    </div>
  );
}
