import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, PDFName } from 'pdf-lib';

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Main entry point: parse a PDF file and extract form schema
 */
export async function parsePDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Run both extraction methods in parallel
  const [acroFields, textContent, pageImages] = await Promise.all([
    extractAcroFormFields(uint8Array),
    extractTextContent(uint8Array),
    renderPageThumbnails(uint8Array),
  ]);

  // Merge results: prefer AcroForm fields, supplement with text-inferred fields
  const schema = buildFormSchema(acroFields, textContent);

  return {
    schema,
    pageImages,
    metadata: textContent.metadata,
    pageCount: textContent.pages.length,
  };
}

/**
 * Extract XFA field label mappings from the PDF's XFA template stream.
 * XFA forms store human-readable labels in <toolTip> or <caption> elements
 * inside the template XML, keyed by field name.
 */
async function extractXFALabels(pdfDoc) {
  try {
    const catalog = pdfDoc.catalog;
    const acroFormDict = catalog.lookup(PDFName.of('AcroForm'));
    if (!acroFormDict) return {};

    const xfa = acroFormDict.lookup(PDFName.of('XFA'));
    if (!xfa) return {};

    // XFA is an array: [name1, stream1, name2, stream2, ...]
    // Find the "template" stream which contains field definitions
    let templateEntry = null;
    if (typeof xfa.asArray === 'function') {
      const arr = xfa.asArray();
      for (let i = 0; i < arr.length - 1; i++) {
        const entry = arr[i];
        let name = null;
        if (entry && typeof entry.asString === 'function') name = entry.asString();
        else if (entry && typeof entry.decodeText === 'function') name = entry.decodeText();
        if (name === 'template') {
          templateEntry = arr[i + 1];
          break;
        }
      }
    } else if (xfa.size) {
      for (let i = 0; i < xfa.size(); i += 2) {
        const key = xfa.get(i);
        if (key && key.toString().includes('template')) {
          templateEntry = xfa.get(i + 1);
          break;
        }
      }
    }

    if (!templateEntry) return {};

    // Resolve PDFRef if needed (XFA array entries are often indirect references)
    let templateStream = templateEntry;
    if (typeof templateEntry.getContents !== 'function' && pdfDoc.context) {
      try {
        templateStream = pdfDoc.context.lookup(templateEntry);
      } catch (e) {
        console.warn('XFA: could not resolve template ref:', e.message);
        return {};
      }
    }
    if (!templateStream || typeof templateStream.getContents !== 'function') return {};

    // Get raw compressed bytes
    const compressed = templateStream.getContents();
    if (!compressed || compressed.length === 0) return {};

    // Decompress the FlateDecode stream using the browser's DecompressionStream API
    let xmlText;
    try {
      const ds = new DecompressionStream('deflate');
      const writer = ds.writable.getWriter();
      writer.write(compressed);
      writer.close();

      const reader = ds.readable.getReader();
      const decompChunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        decompChunks.push(value);
      }
      let totalLen = 0;
      for (const c of decompChunks) totalLen += c.length;
      const decompressed = new Uint8Array(totalLen);
      let off = 0;
      for (const c of decompChunks) { decompressed.set(c, off); off += c.length; }
      xmlText = new TextDecoder().decode(decompressed);
    } catch (e) {
      // If deflate fails, try reading raw (might be uncompressed)
      xmlText = new TextDecoder().decode(compressed);
    }

    if (!xmlText || xmlText.length === 0) return {};

    // Parse field name → toolTip/caption mappings using DOMParser
    const labels = {};
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');
      const fields = doc.querySelectorAll('field');
      for (const field of fields) {
        const name = field.getAttribute('name');
        if (!name) continue;
        // Prefer toolTip inside assist element
        const assist = field.querySelector('assist');
        if (assist) {
          const toolTip = assist.querySelector('toolTip');
          if (toolTip && toolTip.textContent.trim()) {
            labels[name] = toolTip.textContent.trim();
            continue;
          }
        }
        // Fall back to caption > value > text
        const caption = field.querySelector('caption');
        if (caption) {
          const text = caption.querySelector('value > text');
          if (text && text.textContent.trim()) {
            labels[name] = text.textContent.trim();
          }
        }
      }
    } catch (parseErr) {
      console.warn('XFA: DOMParser failed, falling back to regex:', parseErr.message);
      const fieldRegex = /<field[^>]*name="([^"]*)"[^>]*>[\s\S]*?<toolTip>([\s\S]*?)<\/toolTip>/g;
      let match;
      while ((match = fieldRegex.exec(xmlText)) !== null) {
        if (match[2].trim()) labels[match[1]] = match[2].trim();
      }
    }

    return labels;
  } catch (e) {
    console.warn('XFA label extraction failed:', e.message);
    return {};
  }
}

/**
 * Clean up a raw label string into a proper form field label.
 * Handles XFA toolTip text, long descriptive field names, and numbered prefixes.
 */
function cleanFieldLabel(raw) {
  if (!raw || raw.length === 0) return raw;

  let label = raw;

  // Strip leading number + dot prefixes: "2. Reinforcing." → "Reinforcing"
  label = label.replace(/^\d+[a-z]?\.\s*/i, '');

  // Strip trailing periods and dashes
  label = label.replace(/[\.\-\s]+$/, '');

  // Strip instructional filler at the start
  label = label.replace(/^(please\s+)?(enter|provide|give|specify|type|input|indicate|list|state)\s+(your\s+|the\s+)?/i, '');

  // Strip trailing instructions like "- Enter nine digit..." or "(Enter 2-digit month...)"
  label = label.replace(/\s*[-–]\s*(enter|type|please|format|use)\s.*$/i, '');
  label = label.replace(/\s*\(?(enter|type|please|format|use)\s[^)]*\)?\s*$/i, '');

  // Clean up trailing dashes/periods again after instruction removal
  label = label.replace(/[\.\-\s]+$/, '');

  // Strip XFA path-like fragments that might remain
  label = label.replace(/\[\d+\]/g, '');

  // Collapse redundant whitespace
  label = label.replace(/\s+/g, ' ').trim();

  // Title-case if all-caps (common in VA forms)
  if (label === label.toUpperCase() && label.length > 3) {
    label = label.replace(/\b\w+/g, w =>
      w.length <= 2 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    );
  }

  // Ensure first letter is capitalized
  if (label.length > 0) {
    label = label.charAt(0).toUpperCase() + label.slice(1);
  }

  return label;
}

/**
 * Determine if a field name is a generic XFA auto-generated name
 * that carries no semantic meaning (e.g., TextField1, #field[66])
 */
function isGenericFieldName(name) {
  const leaf = name.split('.').pop().replace(/\[\d+\]$/, '');
  return /^(TextField|DateTimeField|NumericField|Button|ImageField|#field)\d*$/i.test(leaf);
}

/**
 * Extract AcroForm fields using pdf-lib
 */
async function extractAcroFormFields(uint8Array) {
  try {
    const pdfDoc = await PDFDocument.load(uint8Array, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    // Extract XFA label mappings (returns {} if no XFA data present)
    const xfaLabels = await extractXFALabels(pdfDoc);
    const hasXFA = Object.keys(xfaLabels).length > 0;

    return fields.map((field, index) => {
      const type = field.constructor.name;
      const name = field.getName();
      const widgets = field.acroField.getWidgets();

      // Get position from first widget
      let rect = null;
      let page = 0;
      if (widgets.length > 0) {
        const widget = widgets[0];
        rect = widget.getRectangle();
        // Try to determine page number
        const pageRef = widget.P();
        if (pageRef) {
          page = pdfDoc.getPages().findIndex(p => p.ref === pageRef) || 0;
        }
      }

      // Resolve the best available label for this field:
      // 1. XFA toolTip/caption label (most reliable for XFA forms)
      // 2. Humanized field name (for descriptive AcroForm names)
      // 3. Flag as needing review if generic/unresolvable
      const leafName = name.split('.').pop().replace(/\[\d+\]$/, '');
      const xfaLabel = xfaLabels[leafName];
      const isGeneric = isGenericFieldName(name);

      let label;
      let needsReview = false;

      if (xfaLabel) {
        // XFA label found — clean it up
        label = cleanFieldLabel(xfaLabel);
      } else if (isGeneric) {
        // Generic XFA name with no label available — flag for review
        label = humanizeFieldName(name);
        needsReview = true;
      } else {
        // Descriptive AcroForm name — humanize and clean
        label = cleanFieldLabel(humanizeFieldName(name));
      }

      let fieldInfo = {
        id: `field_${index}`,
        name: name,
        label: label,
        page: page,
        rect: rect,
        required: false,
        source: hasXFA ? 'xfa' : 'acroform',
        needsReview: needsReview,
      };

      switch (type) {
        case 'PDFTextField':
          fieldInfo.type = 'text';
          try { fieldInfo.defaultValue = field.getText() || ''; } catch (e) { fieldInfo.defaultValue = ''; }
          fieldInfo.maxLength = field.getMaxLength?.() || undefined;
          break;
        case 'PDFCheckBox':
          fieldInfo.type = 'checkbox';
          try { fieldInfo.defaultValue = field.isChecked(); } catch (e) { fieldInfo.defaultValue = false; }
          break;
        case 'PDFRadioGroup':
          fieldInfo.type = 'radio';
          try {
            fieldInfo.options = field.getOptions();
            fieldInfo.defaultValue = field.getSelected();
          } catch (e) {
            fieldInfo.options = [];
            fieldInfo.defaultValue = '';
          }
          break;
        case 'PDFDropdown':
          fieldInfo.type = 'select';
          try {
            fieldInfo.options = field.getOptions();
            fieldInfo.defaultValue = field.getSelected()?.[0] || '';
          } catch (e) {
            fieldInfo.options = [];
            fieldInfo.defaultValue = '';
          }
          break;
        case 'PDFOptionList':
          fieldInfo.type = 'select';
          fieldInfo.multiple = true;
          try {
            fieldInfo.options = field.getOptions();
            fieldInfo.defaultValue = field.getSelected() || [];
          } catch (e) {
            fieldInfo.options = [];
            fieldInfo.defaultValue = [];
          }
          break;
        case 'PDFSignature':
          fieldInfo.type = 'signature';
          fieldInfo.defaultValue = '';
          break;
        default:
          fieldInfo.type = 'text';
          fieldInfo.defaultValue = '';
      }

      return fieldInfo;
    });
  } catch (err) {
    console.warn('No AcroForm fields found or error parsing:', err.message);
    return [];
  }
}

/**
 * Extract text content from all pages using pdf.js
 */
async function extractTextContent(uint8Array) {
  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
  const metadata = await pdf.getMetadata().catch(() => ({}));

  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    const items = textContent.items.map(item => ({
      text: item.str,
      x: item.transform[4],
      y: viewport.height - item.transform[5], // flip y-axis
      width: item.width,
      height: item.height,
      fontSize: Math.abs(item.transform[0]),
    }));

    pages.push({
      pageNum: i,
      width: viewport.width,
      height: viewport.height,
      items,
    });
  }

  return {
    metadata: {
      title: metadata?.info?.Title || '',
      author: metadata?.info?.Author || '',
      creator: metadata?.info?.Creator || '',
      formNumber: extractFormNumber(pages),
    },
    pages,
  };
}

/**
 * Render page thumbnails for the PDF viewer
 */
async function renderPageThumbnails(uint8Array) {
  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
  const images = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 1.5;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: canvas.getContext('2d'),
      viewport,
    }).promise;

    images.push({
      pageNum: i,
      dataUrl: canvas.toDataURL('image/png'),
      width: viewport.width,
      height: viewport.height,
    });
  }

  return images;
}

/**
 * Try to extract the VA form number from text content
 */
function extractFormNumber(pages) {
  if (!pages.length) return '';
  const firstPageText = pages[0].items.map(i => i.text).join(' ');

  // Common patterns: "VA Form 10-10EZ", "VA FORM 21-526EZ", etc.
  const match = firstPageText.match(/VA\s+FORM\s+([\d]+-[\w]+)/i)
    || firstPageText.match(/FORM\s+([\d]+-[\w]+)/i)
    || firstPageText.match(/(SF|DD|VA)\s*([\d]+-?[\w]*)/i);

  return match ? match[0] : '';
}

/**
 * Infer form fields from text content when AcroForm fields aren't available
 */
function inferFieldsFromText(pages) {
  const fields = [];
  let fieldIndex = 0;

  for (const page of pages) {
    const items = page.items;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const text = item.text.trim();
      if (!text) continue;

      // Pattern: text ending with colon suggests a label
      if (text.endsWith(':') || text.endsWith('：')) {
        const label = text.replace(/[:：]\s*$/, '').trim();
        if (label.length > 1 && label.length < 100) {
          fields.push({
            id: `inferred_${fieldIndex++}`,
            name: sanitizeFieldName(label),
            label: label,
            type: inferFieldType(label),
            page: page.pageNum - 1,
            required: isLikelyRequired(label, items, i),
            defaultValue: '',
            source: 'inferred',
            rect: { x: item.x, y: item.y, width: 200, height: 20 },
          });
        }
      }

      // Pattern: numbered items like "1. First Name" or "1a. Last Name"
      const numberedMatch = text.match(/^(\d+[a-z]?)\.\s+(.+)/i);
      if (numberedMatch) {
        const label = numberedMatch[2].replace(/[:：]\s*$/, '').trim();
        if (label.length > 1 && label.length < 100 && !label.match(/^(section|part|page)/i)) {
          fields.push({
            id: `inferred_${fieldIndex++}`,
            name: sanitizeFieldName(label),
            label: label,
            type: inferFieldType(label),
            page: page.pageNum - 1,
            required: isLikelyRequired(label, items, i),
            defaultValue: '',
            source: 'inferred',
            rect: { x: item.x, y: item.y, width: 200, height: 20 },
          });
        }
      }

      // Pattern: YES/NO or checkbox indicators
      if (text.match(/^\s*(YES|NO)\s*$/i) || text.match(/^☐|☑|▢|▣/)) {
        // Look backward for the label
        for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
          const prevText = items[j].text.trim();
          if (prevText.length > 3 && prevText.length < 100) {
            fields.push({
              id: `inferred_${fieldIndex++}`,
              name: sanitizeFieldName(prevText),
              label: prevText,
              type: 'checkbox',
              page: page.pageNum - 1,
              required: false,
              defaultValue: false,
              source: 'inferred',
              rect: { x: items[j].x, y: items[j].y, width: 200, height: 20 },
            });
            break;
          }
        }
      }

      // Pattern: "Date" fields
      if (text.match(/\b(date|mm\/dd\/yyyy|mm-dd-yyyy)\b/i)) {
        const label = text.replace(/\(.*?\)/g, '').trim();
        if (label.length > 1) {
          fields.push({
            id: `inferred_${fieldIndex++}`,
            name: sanitizeFieldName(label),
            label: label,
            type: 'date',
            page: page.pageNum - 1,
            required: false,
            defaultValue: '',
            source: 'inferred',
            rect: { x: item.x, y: item.y, width: 200, height: 20 },
          });
        }
      }
    }
  }

  // Deduplicate by label similarity
  return deduplicateFields(fields);
}

/**
 * Merge AcroForm fields with text-inferred fields into a unified schema
 */
function buildFormSchema(acroFields, textContent) {
  let fields;

  if (acroFields.length > 0) {
    // If we have AcroForm fields, use them as primary and supplement
    fields = acroFields;

    // Try to enhance labels using nearby text
    for (const field of fields) {
      if (field.rect && field.label === field.name) {
        const betterLabel = findNearbyLabel(field, textContent.pages);
        if (betterLabel) {
          field.label = betterLabel;
        }
      }
    }
  } else {
    // No AcroForm fields — rely on text inference
    fields = inferFieldsFromText(textContent.pages);
  }

  // Detect sections/groups from the text
  const sections = detectSections(textContent.pages);

  // Assign fields to sections
  for (const field of fields) {
    field.section = findFieldSection(field, sections);
  }

  return {
    formId: textContent.metadata.formNumber || 'unknown-form',
    title: textContent.metadata.title || textContent.metadata.formNumber || 'Untitled Form',
    fields: fields,
    sections: sections,
    totalPages: textContent.pages.length,
  };
}

/**
 * Look for text near a form field to use as its label
 */
function findNearbyLabel(field, pages) {
  if (!field.rect || !pages[field.page]) return null;

  const page = pages[field.page];
  const fx = field.rect.x;
  const fy = field.rect.y;
  let bestLabel = null;
  let bestDist = Infinity;

  for (const item of page.items) {
    const text = item.text.trim();
    if (!text || text.length < 2 || text.length > 80) continue;

    // Look for text to the left or above the field
    const dx = fx - (item.x + item.width);
    const dy = fy - item.y;

    // Text should be to the left or above
    if (dx >= -10 && dx < 300 && Math.abs(dy) < 15) {
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist < bestDist) {
        bestDist = dist;
        bestLabel = text.replace(/[:：]\s*$/, '').trim();
      }
    }
    if (dy >= 0 && dy < 25 && Math.abs(item.x - fx) < 50) {
      const dist = dy + Math.abs(item.x - fx);
      if (dist < bestDist) {
        bestDist = dist;
        bestLabel = text.replace(/[:：]\s*$/, '').trim();
      }
    }
  }

  return bestLabel;
}

/**
 * Detect section headers from the text
 */
function detectSections(pages) {
  const sections = [];
  let sectionIndex = 0;

  for (const page of pages) {
    // Find text items that look like headers (larger font, bold patterns, etc.)
    const avgFontSize = page.items.reduce((sum, i) => sum + (i.fontSize || 10), 0) / Math.max(page.items.length, 1);

    for (const item of page.items) {
      const text = item.text.trim();
      if (!text) continue;

      const isLargerFont = item.fontSize > avgFontSize * 1.15;
      const isSectionPattern = text.match(/^(SECTION|PART|CHAPTER)\s+[\dIVXA-Z]+/i)
        || text.match(/^[IVX]+\.\s+/i)
        || (isLargerFont && text.length > 3 && text.length < 60 && text === text.toUpperCase());

      if (isSectionPattern) {
        sections.push({
          id: `section_${sectionIndex++}`,
          title: text,
          page: page.pageNum - 1,
          y: item.y,
        });
      }
    }
  }

  return sections;
}

/**
 * Determine which section a field belongs to
 */
function findFieldSection(field, sections) {
  if (!sections.length) return null;

  let bestSection = sections[0].id;
  for (const section of sections) {
    if (section.page < field.page || (section.page === field.page && section.y <= (field.rect?.y || 0))) {
      bestSection = section.id;
    }
  }
  return bestSection;
}

/**
 * Infer the HTML input type from a field label
 */
function inferFieldType(label) {
  const lower = label.toLowerCase();

  if (lower.match(/\b(email|e-mail)\b/)) return 'email';
  if (lower.match(/\b(phone|telephone|tel|fax|mobile|cell)\b/)) return 'tel';
  if (lower.match(/date[\s_]*of[\s_]*birth|birth[\s_]*date|\bdob\b|\bborn\b/)) return 'date';
  if (lower.match(/\bdate\b|datefield|date_of|mm[\s_]*dd/)) return 'date';
  if (lower.match(/\b(ssn|social[\s_]*security|ss\s*#|soc[\s_]*sec)\b/)) return 'ssn';
  if (lower.match(/va[\s_]*file|file[\s_]*number|c[\s_-]*file|claim[\s_]*number/)) return 'text';
  if (lower.match(/service[\s_]*number|military[\s_]*id/)) return 'text';
  if (lower.match(/\b(zip|postal)\b/)) return 'text';
  if (lower.match(/\b(state|country)\b/)) return 'select';
  if (lower.match(/\b(gender|sex|marital|status|branch|type|race)\b/)) return 'select';
  if (lower.match(/relationship|relation[\s_]*to/)) return 'select';
  if (lower.match(/\b(address|street|city|county|mailing|residence)\b/)) return 'text';
  if (lower.match(/first[\s_]*name|last[\s_]*name|middle[\s_]*name|middle[\s_]*initial|firstname|lastname/)) return 'text';
  if (lower.match(/\b(description|comments|remarks|reason|explain|additional|narrative|limitation|specify)\b/)) return 'textarea';
  if (lower.match(/\b(signature)\b/)) return 'signature';
  if (lower.match(/\b(amount|total|number|qty|quantity|salary|income|percentage|lump[\s_]*sum)\b/)) return 'number';
  if (lower.match(/\b(height|weight)\b/)) return 'number';
  if (lower.match(/\b(school|training|education|course|degree|institution|university|college)\b/)) return 'text';
  if (lower.match(/\b(insurance|policy|plan[\s_]*name)\b/)) return 'text';
  if (lower.match(/\b(employer|company|business|occupation|job[\s_]*title)\b/)) return 'text';
  if (lower.match(/certificate|decree|court[\s_]*paper|personnel[\s_]*record/)) return 'checkbox';
  if (lower.match(/\b(diagnosis|treatment|condition|symptom|medication|doctor|physician|hospital|clinic|medical)\b/)) return 'text';
  if (lower.match(/\b(dependent|child|minor|custody)\b/)) return 'text';
  if (lower.match(/\b(income|asset|expense|debt|net[\s_]*worth|financial)\b/)) return 'number';

  return 'text';
}

function humanizeFieldName(name) {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, c => c.toUpperCase());
}

function sanitizeFieldName(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 50);
}

function isLikelyRequired(label, items, index) {
  const lower = label.toLowerCase();
  if (lower.match(/\b(required|mandatory)\b/)) return true;
  // Check if there's an asterisk nearby
  for (let j = Math.max(0, index - 1); j <= Math.min(items.length - 1, index + 1); j++) {
    if (items[j].text.includes('*')) return true;
  }
  return false;
}

function deduplicateFields(fields) {
  const seen = new Set();
  return fields.filter(field => {
    const key = `${field.label.toLowerCase()}_${field.type}_${field.page}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Generate a JSON schema from the parsed form schema
 */
export function generateJSONSchema(schema) {
  const jsonSchema = {
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
      case 'text':
      case 'email':
      case 'tel':
      case 'ssn':
      case 'date':
      case 'textarea':
      case 'signature':
        prop.type = 'string';
        if (field.type === 'email') prop.format = 'email';
        if (field.type === 'date') prop.format = 'date';
        if (field.maxLength) prop.maxLength = field.maxLength;
        break;
      case 'number':
        prop.type = 'number';
        break;
      case 'checkbox':
        prop.type = 'boolean';
        break;
      case 'radio':
      case 'select':
        prop.type = 'string';
        if (field.options?.length) prop.enum = field.options;
        break;
      default:
        prop.type = 'string';
    }

    jsonSchema.properties[field.name] = prop;
    if (field.required) {
      jsonSchema.required.push(field.name);
    }
  }

  return jsonSchema;
}

/**
 * Generate an HTML form string from the parsed form schema
 */
export function generateHTMLForm(schema) {
  const fields = schema.fields;
  const sections = schema.sections;

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(schema.title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, sans-serif; background: #f1f1f1; color: #1b1b1b; line-height: 1.5; }
    .form-container { max-width: 720px; margin: 2rem auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,.1); overflow: hidden; }
    .form-header { background: #112e51; color: #fff; padding: 1.5rem 2rem; }
    .form-header h1 { font-size: 1.5rem; font-weight: 700; }
    .form-header .form-id { opacity: 0.8; font-size: 0.9rem; margin-top: 0.25rem; }
    .form-body { padding: 2rem; }
    .form-section { margin-bottom: 2rem; }
    .form-section h2 { font-size: 1.15rem; font-weight: 700; color: #112e51; border-bottom: 2px solid #0071bc; padding-bottom: 0.5rem; margin-bottom: 1rem; }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.95rem; }
    .form-group label .required { color: #e31c3d; margin-left: 2px; }
    .form-group input[type="text"], .form-group input[type="email"], .form-group input[type="tel"],
    .form-group input[type="number"], .form-group input[type="date"], .form-group select,
    .form-group textarea { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #aeb0b5; border-radius: 4px; font-size: 1rem; font-family: inherit; transition: border-color 0.15s; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #0071bc; box-shadow: 0 0 0 2px rgba(0,113,188,0.25); }
    .form-group textarea { min-height: 80px; resize: vertical; }
    .form-group .checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-weight: 400; cursor: pointer; }
    .form-group .checkbox-label input { width: 18px; height: 18px; }
    .radio-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .radio-group label { display: flex; align-items: center; gap: 0.5rem; font-weight: 400; cursor: pointer; }
    .radio-group input { width: 16px; height: 16px; }
    .form-actions { padding: 1.5rem 2rem; background: #f1f1f1; display: flex; gap: 1rem; }
    .btn { padding: 0.65rem 1.5rem; border: none; border-radius: 4px; font-size: 1rem; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #0071bc; color: #fff; }
    .btn-primary:hover { background: #205493; }
    .btn-secondary { background: #fff; color: #0071bc; border: 1px solid #0071bc; }
    .btn-secondary:hover { background: #e8f5ff; }
  </style>
</head>
<body>
  <div class="form-container">
    <div class="form-header">
      <h1>${escapeHTML(schema.title)}</h1>
      <div class="form-id">${escapeHTML(schema.formId)}</div>
    </div>
    <form class="form-body" onsubmit="handleSubmit(event)">
`;

  // Group fields by section
  const sectionMap = new Map();
  sectionMap.set(null, []);
  for (const s of sections) {
    sectionMap.set(s.id, []);
  }
  for (const field of fields) {
    const key = field.section || null;
    if (!sectionMap.has(key)) sectionMap.set(key, []);
    sectionMap.get(key).push(field);
  }

  // Render ungrouped fields first
  const ungrouped = sectionMap.get(null) || [];
  if (ungrouped.length > 0) {
    html += '      <div class="form-section">\n';
    for (const field of ungrouped) {
      html += renderFieldHTML(field);
    }
    html += '      </div>\n';
  }

  // Render sectioned fields
  for (const section of sections) {
    const sectionFields = sectionMap.get(section.id) || [];
    if (sectionFields.length === 0) continue;
    html += `      <div class="form-section">\n`;
    html += `        <h2>${escapeHTML(section.title)}</h2>\n`;
    for (const field of sectionFields) {
      html += renderFieldHTML(field);
    }
    html += '      </div>\n';
  }

  html += `    </form>
    <div class="form-actions">
      <button type="submit" form="form" class="btn btn-primary">Submit</button>
      <button type="reset" form="form" class="btn btn-secondary">Reset</button>
    </div>
  </div>
  <script>
    function handleSubmit(e) {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      console.log('Form submitted:', data);
      alert('Form data collected. Check console for details.');
    }
  </script>
</body>
</html>`;

  return html;
}

function renderFieldHTML(field) {
  const required = field.required ? ' required' : '';
  const requiredMark = field.required ? '<span class="required">*</span>' : '';
  const name = escapeAttr(field.name);
  const label = escapeHTML(field.label);

  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
    case 'ssn':
      return `        <div class="form-group">
          <label for="${name}">${label}${requiredMark}</label>
          <input type="${field.type === 'ssn' ? 'text' : field.type}" id="${name}" name="${name}" placeholder="${escapeAttr(field.label)}"${field.maxLength ? ` maxlength="${field.maxLength}"` : ''}${field.type === 'ssn' ? ' pattern="\\d{3}-?\\d{2}-?\\d{4}" placeholder="XXX-XX-XXXX"' : ''}${required}>
        </div>\n`;

    case 'number':
      return `        <div class="form-group">
          <label for="${name}">${label}${requiredMark}</label>
          <input type="number" id="${name}" name="${name}"${required}>
        </div>\n`;

    case 'date':
      return `        <div class="form-group">
          <label for="${name}">${label}${requiredMark}</label>
          <input type="date" id="${name}" name="${name}"${required}>
        </div>\n`;

    case 'textarea':
      return `        <div class="form-group">
          <label for="${name}">${label}${requiredMark}</label>
          <textarea id="${name}" name="${name}" rows="4"${required}></textarea>
        </div>\n`;

    case 'checkbox':
      return `        <div class="form-group">
          <label class="checkbox-label"><input type="checkbox" name="${name}"> ${label}</label>
        </div>\n`;

    case 'radio':
      let radioHtml = `        <div class="form-group">
          <label>${label}${requiredMark}</label>
          <div class="radio-group">\n`;
      for (const opt of (field.options || ['Yes', 'No'])) {
        radioHtml += `            <label><input type="radio" name="${name}" value="${escapeAttr(opt)}"${required}> ${escapeHTML(opt)}</label>\n`;
      }
      radioHtml += `          </div>
        </div>\n`;
      return radioHtml;

    case 'select':
      let selectHtml = `        <div class="form-group">
          <label for="${name}">${label}${requiredMark}</label>
          <select id="${name}" name="${name}"${field.multiple ? ' multiple' : ''}${required}>
            <option value="">-- Select --</option>\n`;
      for (const opt of (field.options || [])) {
        selectHtml += `            <option value="${escapeAttr(opt)}">${escapeHTML(opt)}</option>\n`;
      }
      selectHtml += `          </select>
        </div>\n`;
      return selectHtml;

    case 'signature':
      return `        <div class="form-group">
          <label for="${name}">${label}${requiredMark}</label>
          <input type="text" id="${name}" name="${name}" placeholder="Type full legal name as signature"${required}>
        </div>\n`;

    default:
      return `        <div class="form-group">
          <label for="${name}">${label}${requiredMark}</label>
          <input type="text" id="${name}" name="${name}"${required}>
        </div>\n`;
  }
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
