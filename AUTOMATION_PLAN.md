# Aquia Form Builder - Automated Digitizer Plan

## Current State
The digitizer (`index.html`) is a manual process:
1. User uploads a PDF
2. pdf.js + pdf-lib extract AcroForm/XFA fields
3. User manually labels, groups, and arranges fields
4. User exports JSON and copies it to the correct schema folder
5. User updates the org's `index.json` to register the new form

## Goal
When a new VA form PDF is uploaded, the system should:
1. **Auto-detect** the form number and VA organization (VBA, VHA, NCA, etc.)
2. **Auto-generate** an enriched schema following the BIO pattern
3. **Auto-route** the output JSON to the correct folder (`schemas/vba/`, `schemas/va/vha/`, etc.)
4. **Auto-register** the form in the appropriate `index.json`

---

## Phase 1: Auto-Routing by Form Number

### Form Number to Org Mapping
VA form numbers follow a consistent prefix convention:

| Prefix Pattern | Organization | Schema Path |
|---|---|---|
| `20-xxxx` | VBA (Compensation & Pension) | `schemas/vba/` |
| `21-xxxx`, `21P-xxxx` | VBA (Compensation & Pension) | `schemas/vba/` |
| `22-xxxx` | VBA (Education) | `schemas/vba/` |
| `26-xxxx` | VBA (Loan Guaranty) | `schemas/vba/` |
| `27-xxxx` | VBA (Insurance) | `schemas/vba/` |
| `28-xxxx` | VBA (Vocational Rehab) | `schemas/vba/` |
| `29-xxxx` | VBA (Insurance) | `schemas/vba/` |
| `10-xxxx` | VHA (Health) | `schemas/va/vha/` |
| `40-xxxx`, `VA40-xxxx` | NCA (National Cemetery) | `schemas/va/nca/` |
| `SF-xxxx` | Admin/Standard Forms | `schemas/va/admin/` |
| `VA-xxxx` | Admin/Other | `schemas/va/other/` |

### Implementation
Add a `detectOrg(formNumber)` function to the digitizer that:
- Parses the form number from the PDF metadata or filename
- Maps the numeric prefix to the correct org
- Returns `{ orgId, orgDir, schemaPath }`

---

## Phase 2: Auto-Enriched Schema Generation

### Current Problem
The digitizer outputs a basic JSON schema. The enriched format (`x-va-form`, `formSections`, `x-va-field`) is manually authored for the 4 BIO forms only.

### Solution: AI-Assisted Enrichment Pipeline

When a form is digitized, automatically:

1. **Extract form metadata** from the PDF:
   - Form number (from title or first-page text)
   - OMB control number (regex: `OMB No. \d{4}-\d{4}`)
   - Respondent burden (regex: `(\d+) minutes`)
   - Form title (from PDF title metadata or first heading)
   - Expiration date

2. **Group fields into sections** using heuristics:
   - PDF page boundaries (fields on same page = same section)
   - Section header detection (bold text, "SECTION I", "Part A", etc.)
   - Field name prefix clustering (`veteran_*` -> "Veteran Information")

3. **Map field types to VA widgets**:
   - SSN patterns -> `widget: "ssn"`, `format: "ssn"`
   - Date fields -> `widget: "date"`, `format: "date"`
   - State fields -> `widget: "state-select"`
   - Phone fields -> `widget: "phone"`
   - Yes/No fields -> `widget: "radio-yesno"`
   - Address groups -> `widget: "address"`

4. **Generate `x-va-form` metadata block**:
   ```json
   {
     "x-va-form": {
       "formNumber": "21-4192",
       "formTitle": "Request for Employment Information...",
       "ombNumber": "2900-0065",
       "respondentBurden": "15 minutes",
       "expirationDate": "09/30/2025",
       "instructions": "...",
       "formSections": [...]
     }
   }
   ```

5. **Generate `formSections` with rows/columns layout**:
   - Each section gets a title, instructions, and rows
   - Fields within a row are auto-sized (full-width for text areas, 1/3 for city/state/zip groups)

---

## Phase 3: One-Click Publish Pipeline

### Workflow
After the enriched schema is generated:

1. **Preview** the form in the wizard renderer (forms.html) using the BIO pattern
2. **Save** the JSON to the correct schema folder
3. **Update** the org's `index.json` to include the new form
4. **Git commit + push** to deploy to GitHub Pages automatically

### Implementation Options

**Option A: Client-Side (GitHub API)**
- Use GitHub's REST API from the browser
- Requires a GitHub personal access token (stored in localStorage)
- Creates files and commits directly via the API
- No server needed

**Option B: GitHub Actions Workflow**
- Upload the PDF to a `pending/` folder in the repo
- A GitHub Action triggers on push to `pending/`
- The Action runs a Node.js script that processes the PDF
- Outputs the enriched schema to the correct folder
- Auto-commits and pushes

**Option C: Local CLI Tool**
- A Node.js script that accepts a PDF path
- Runs the full pipeline locally
- Commits and pushes to the repo

### Recommended: Option B (GitHub Actions)
- No local setup needed for team members
- Auditable pipeline with logs
- Can integrate AI enrichment via Claude API for better field labeling
- Works with the existing GitHub Pages deployment

---

## Phase 4: AI-Powered Field Labeling (Future)

For the highest-quality enrichment matching BIO standards:

1. Send extracted field names + PDF text to Claude API
2. Claude returns:
   - Human-readable labels for each field
   - Logical section groupings with titles
   - Instructions for each section
   - Field hints and validation rules
3. This turns `TEXTFIELD_23` into `"Veteran's Last Name"` with proper `x-va-field` metadata

---

## Implementation Priority

1. **Now**: Add `detectOrg()` function + auto-routing in the digitizer UI
2. **Next**: Add auto-enrichment heuristics (metadata extraction, field grouping, widget mapping)
3. **Then**: Build the GitHub Actions pipeline for one-click publish
4. **Later**: Integrate Claude API for AI-powered field labeling

## Estimated Effort
- Phase 1: 2-3 hours (routing logic + UI updates)
- Phase 2: 1-2 days (enrichment heuristics + testing across form types)
- Phase 3: 4-6 hours (GitHub Actions workflow)
- Phase 4: 1 day (Claude API integration + prompt engineering)
