# Accessibility Audit Report: VA Form Builder (forms.html)
## 508 Compliance Assessment

**Date:** March 28, 2026
**Form:** `/sessions/eager-nice-euler/mnt/Aquia Form Builder/forms.html`
**WCAG Version Analyzed:** WCAG 2.1 Level AA (aligned with Section 508)

---

## Executive Summary

The VA Form Builder demonstrates **moderate accessibility support** with both strengths and critical gaps that must be addressed before 508-compliant publication. The form uses semantic HTML, implements basic label associations, and includes proper heading hierarchy, but lacks essential ARIA attributes, error handling messaging, and screen reader optimizations.

**Overall Accessibility Status:** ⚠️ **NEEDS IMPROVEMENT**
**Critical Issues Found:** 6
**Major Issues Found:** 8
**Minor Issues Found:** 7

---

## Detailed Findings

### PASSED: Strengths

#### 1. ✓ Semantic HTML Structure
- **Status:** PASS
- **Evidence:** Form uses proper semantic markup (`<form>`, `<label>`, `<input>`, `<select>`, `<textarea>`)
- **Details:** Elements like breadcrumbs, navigation buttons, and accordion are properly structured
- **WCAG Criterion:** 1.3.1 (Info and Relationships)

#### 2. ✓ Proper Language Declaration
- **Status:** PASS
- **Evidence:** `<html lang="en">` is declared
- **Details:** Allows screen readers to apply correct pronunciation rules
- **WCAG Criterion:** 3.1.1 (Language of Page)

#### 3. ✓ Heading Hierarchy Present
- **Status:** PASS
- **Evidence:** Form uses `<h1>`, `<h2>`, `<h3>` tags throughout
- **Details:**
  - Main form title: `<h1>`
  - Section titles: `<h2>` tags
  - Subsection titles: `<h3>` tags
- **WCAG Criterion:** 1.3.1 (Info and Relationships)

#### 4. ✓ Image Alt Text (Partial)
- **Status:** PARTIAL PASS
- **Evidence:** Critical images have alt text:
  - US flag: `alt="U.S. flag"`
  - VA logo: `alt="VA logo and Seal, U.S. Department of Veterans Affairs"`
- **WCAG Criterion:** 1.1.1 (Non-text Content)

#### 5. ✓ Form Label Association
- **Status:** PASS
- **Evidence:** Most form fields properly associate labels:
  ```html
  <label for="f_fieldId">Label Text</label>
  <input type="text" id="f_fieldId" name="fieldId">
  ```
- **Details:** Applies to text, email, tel, date, select, radio, checkbox, textarea inputs
- **WCAG Criterion:** 1.3.1 (Info and Relationships), 2.4.6 (Headings and Labels)

#### 6. ✓ Input Type Attributes
- **Status:** PASS
- **Evidence:** Appropriate input types used:
  - `type="text"`, `type="email"`, `type="tel"`, `type="date"`, `type="number"`, `type="checkbox"`, `type="radio"`
- **Details:** Enables native browser validation and mobile keyboard optimization
- **WCAG Criterion:** 2.1.1 (Keyboard), 3.2 (Predictable)

#### 7. ✓ Keyboard Navigation Support
- **Status:** PASS
- **Evidence:**
  - Form uses standard HTML controls (buttons, inputs, selects)
  - All interactive elements are natively keyboard-accessible
  - Navigation buttons present: "Back" and "Continue"
- **WCAG Criterion:** 2.1.1 (Keyboard), 2.1.2 (No Keyboard Trap)

#### 8. ✓ Focus Indicators (CSS Provided)
- **Status:** PASS
- **Evidence:** CSS includes focus styling:
  ```css
  .va-field input:focus, .va-field select:focus, .va-field textarea:focus {
      border-color: var(--vads-color-info);
  }
  .va-header-search:focus { border-color: var(--vads-color-info); }
  .va-review-accordion-header[aria-expanded="true"] ...
  ```
- **WCAG Criterion:** 2.4.7 (Focus Visible)

#### 9. ✓ Color Contrast (Design Tokens)
- **Status:** PASS
- **Evidence:** Form uses VADS color tokens with accessible contrast ratios:
  - Primary text: `#1b1b1b` on `#ffffff` (21:1 ratio - AAA)
  - Links in footer: white text maintained
- **WCAG Criterion:** 1.4.3 (Contrast Minimum)

---

### FAILED: Critical Issues (Must Fix)

#### 1. ❌ Missing ARIA Labels for Icon-Only Buttons
- **Severity:** CRITICAL
- **Location:** Lines 637, 1108, 1132
- **Issue:** Accordion buttons and navigation controls use icons without text alternatives
- **Example:**
  ```html
  <button class="va-review-accordion-header" aria-expanded="false" onclick="toggleAccordion(...)">
      <span>Section Title</span>
      <span class="va-accordion-icon">&#9660;</span>  <!-- Down arrow, no aria-label -->
  </button>
  ```
- **Screen Reader Impact:** Icons announce as "graphical character" or silence
- **Fix Required:** Add `aria-label` to all icon buttons
- **Recommended Fix:**
  ```html
  <button class="va-review-accordion-header"
          aria-expanded="false"
          aria-label="Expand Section Title details"
          onclick="toggleAccordion(...)">
  ```
- **WCAG Criterion:** 1.1.1 (Non-text Content), 4.1.2 (Name, Role, Value)

#### 2. ❌ No Fieldset/Legend for Radio and Checkbox Groups
- **Severity:** CRITICAL
- **Location:** Lines 1227-1232, 1241-1245 (radio and checkbox groups)
- **Issue:** Radio buttons and checkboxes are not grouped with `<fieldset>` and `<legend>`
- **Current Code:**
  ```html
  <div class="va-field">
      <div class="va-field-label">Label</div>
      <div class="va-radio-group">
          <input type="radio" id="f_fieldId_0" name="fieldId" value="val1">
          <label for="f_fieldId_0">Option 1</label>
      </div>
  </div>
  ```
- **Screen Reader Impact:** Relationship between group label and individual options is unclear
- **Fix Required:** Use proper `<fieldset>` and `<legend>`
- **Recommended Fix:**
  ```html
  <fieldset>
      <legend>Label Text</legend>
      <div class="va-radio-item">
          <input type="radio" id="f_fieldId_0" name="fieldId" value="val1">
          <label for="f_fieldId_0">Option 1</label>
      </div>
  </fieldset>
  ```
- **WCAG Criterion:** 1.3.1 (Info and Relationships)

#### 3. ❌ Missing aria-describedby for Error Messages (Future Enhancement)
- **Severity:** CRITICAL
- **Location:** Throughout form (1176-1310)
- **Issue:** No visible or programmatic error state messaging for form validation
- **Current Code:** Fields have `required` attribute but no error handling
  ```html
  <input type="text" id="f_fieldId" name="fieldId" required>
  ```
- **Screen Reader Impact:** When validation fails, users cannot understand why
- **Missing Feature:**
  - No error messages displayed
  - No `aria-invalid="true"` attribute
  - No `aria-describedby` linking to error text
- **Fix Required:** Implement client-side validation with error messaging
- **Recommended Enhancement:**
  ```html
  <div class="va-field">
      <label for="f_ssn">Social Security Number</label>
      <div id="ssn-error" class="va-field-error" role="alert" aria-live="polite"></div>
      <input type="text"
             id="f_ssn"
             name="ssn"
             required
             aria-describedby="ssn-error"
             aria-invalid="false">
  </div>
  ```
- **WCAG Criterion:** 3.3.1 (Error Identification), 3.3.4 (Error Prevention)

#### 4. ❌ No Skip to Main Content Link
- **Severity:** CRITICAL
- **Location:** Beginning of page (after `<body>`)
- **Issue:** No skip navigation link for users to bypass header/sidebar
- **Screen Reader Impact:** Users must navigate through all header content before reaching form
- **Fix Required:** Add skip link at very beginning of page
- **Recommended Fix:**
  ```html
  <body>
      <a href="#mainPanel" class="skip-link">Skip to main form content</a>
      <!-- Rest of page -->
  </body>

  <style>
  .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 100;
  }
  .skip-link:focus {
      top: 0;
  }
  </style>
  ```
- **WCAG Criterion:** 2.4.1 (Bypass Blocks)

#### 5. ❌ No aria-label for Search Input
- **Severity:** CRITICAL
- **Location:** Line 732
- **Current Code:**
  ```html
  <input type="text" class="va-header-search" id="searchBox" placeholder="Search forms...">
  ```
- **Issue:** Input has only placeholder text, no associated label
- **Screen Reader Impact:** Users cannot identify the search field's purpose
- **Fix Required:** Add aria-label or visible label
- **Recommended Fix:**
  ```html
  <label for="searchBox" class="sr-only">Search forms</label>
  <input type="text"
         class="va-header-search"
         id="searchBox"
         placeholder="Search forms..."
         aria-label="Search forms by number or name">
  ```
- **WCAG Criterion:** 1.3.1 (Info and Relationships), 4.1.2 (Name, Role, Value)

#### 6. ❌ Missing Main Landmark
- **Severity:** CRITICAL
- **Location:** Line 863 (`<div class="va-form-container">`)
- **Issue:** Form container is a `<div>`, not a `<main>` element
- **Current Code:**
  ```html
  <div class="va-form-container"><form id="vaForm" ...>
  ```
- **Screen Reader Impact:** Users cannot quickly navigate to main content
- **Fix Required:** Wrap form in `<main>` element
- **Recommended Fix:**
  ```html
  <main class="va-form-container" id="mainPanel">
      <form id="vaForm" ...>
  </main>
  ```
- **WCAG Criterion:** 1.3.1 (Info and Relationships), 2.4.1 (Bypass Blocks)

---

### FAILED: Major Issues (Should Fix)

#### 1. ❌ Progress Bar Not Marked as Presentation
- **Severity:** MAJOR
- **Location:** Lines 918-925
- **Issue:** Progress bar divs contain title attributes but no semantic meaning
- **Current Code:**
  ```html
  <div class="va-progress-bar">
      <div class="va-progress-segment completed" title="Section Title"></div>
      <div class="va-progress-segment active" title="Section Title"></div>
  </div>
  <div class="va-progress-label">Step 1 of 3: Section Title</div>
  ```
- **Screen Reader Impact:** Visual progress bar creates duplicate/confusing announcements
- **Fix Required:** Mark as presentation or provide ARIA role
- **Recommended Fix:**
  ```html
  <div class="va-progress-bar" aria-hidden="true">
      <div class="va-progress-segment completed" title="Section Title"></div>
      ...
  </div>
  <div class="va-progress-label" role="status" aria-live="polite">
      Step 1 of 3: Section Title
  </div>
  ```
- **WCAG Criterion:** 1.3.1 (Info and Relationships)

#### 2. ❌ Accordion Body Missing Dynamic State Communication
- **Severity:** MAJOR
- **Location:** Lines 1108-1120 (review accordion)
- **Issue:** When accordion opens/closes, screen readers don't announce state change
- **Current Code:**
  ```html
  <button class="va-review-accordion-header" aria-expanded="false"
          onclick="toggleAccordion('${accId}', this)">
  <div class="va-review-accordion-body" id="${accId}">
  ```
- **Missing Attributes:**
  - Accordion body should have `aria-hidden` toggled
  - Button should use aria-controls
- **Fix Required:**
  ```html
  <button class="va-review-accordion-header"
          aria-expanded="false"
          aria-controls="review-acc-0"
          onclick="toggleAccordion('review-acc-0', this)">
  <div class="va-review-accordion-body"
       id="review-acc-0"
       aria-hidden="true">
  ```
- **Updated JavaScript:**
  ```javascript
  function toggleAccordion(id, btn) {
      const body = document.getElementById(id);
      const isOpen = body.classList.contains('open');
      body.classList.toggle('open');
      btn.setAttribute('aria-expanded', !isOpen);
      body.setAttribute('aria-hidden', isOpen); // Add this
  }
  ```
- **WCAG Criterion:** 4.1.2 (Name, Role, Value), 4.1.3 (Status Messages)

#### 3. ❌ Required Field Indicator Not Programmatically Associated
- **Severity:** MAJOR
- **Location:** Lines 1182-1310
- **Issue:** Required fields show asterisk (*) visually but not programmatically
- **Current Code:**
  ```html
  <label for="f_fieldId">Field Label <span class="required-mark">(*Required)</span></label>
  <input type="text" id="f_fieldId" required>
  ```
- **Problem:** Asterisk is visual only; screen readers don't associate it properly
- **Screen Reader Impact:** May announce "Field Label" without indicating requirement
- **Fix Required:** Use aria-required or move required text into label content
- **Recommended Fix Option 1:**
  ```html
  <label for="f_fieldId">Field Label <span class="required-mark" aria-label="required">*</span></label>
  <input type="text" id="f_fieldId" required aria-required="true">
  ```
- **Recommended Fix Option 2:**
  ```html
  <label for="f_fieldId">Field Label (required)</label>
  <input type="text" id="f_fieldId" required aria-required="true">
  ```
- **WCAG Criterion:** 1.3.1 (Info and Relationships), 3.3.2 (Labels or Instructions)

#### 4. ❌ Breadcrumb Navigation Not Marked as Landmark
- **Severity:** MAJOR
- **Location:** Lines 904-909
- **Current Code:**
  ```html
  <div class="va-breadcrumb">
      <a href="forms.html">VA Forms</a> &rsaquo;
      <a href="forms.html">Organization</a> &rsaquo;
      <span>Form Title</span>
  </div>
  ```
- **Missing:** No semantic markup or ARIA role
- **Fix Required:**
  ```html
  <nav aria-label="Breadcrumb">
      <ol class="va-breadcrumb">
          <li><a href="forms.html">VA Forms</a></li>
          <li><a href="forms.html">Organization</a></li>
          <li><span aria-current="page">Form Title</span></li>
      </ol>
  </nav>
  ```
- **WCAG Criterion:** 1.3.1 (Info and Relationships), 2.4.8 (Location)

#### 5. ❌ Link Target Attributes Not Announced
- **Severity:** MAJOR
- **Location:** Line 1142 (Privacy Policy link)
- **Current Code:**
  ```html
  <a href="https://www.va.gov/privacy-policy/" target="_blank">privacy policy</a>
  ```
- **Issue:** External link opening in new window; users not warned
- **Screen Reader Impact:** Unexpected new window opens without notice
- **Fix Required:**
  ```html
  <a href="https://www.va.gov/privacy-policy/" target="_blank" aria-label="Privacy policy (opens in new tab)">
      privacy policy
  </a>
  ```
- **WCAG Criterion:** 3.2.2 (On Focus), 3.2.4 (Consistent Identification)

#### 6. ❌ Address Field Missing Logical Grouping
- **Severity:** MAJOR
- **Location:** Lines 1252-1283 (address widget)
- **Issue:** Address sub-fields (street, city, state, ZIP) not logically grouped
- **Current Code:**
  ```html
  <div class="va-field">
      <div class="va-field-label">Full Address (Required)</div>
      <div class="va-address-grid">
          <div class="va-field">
              <label for="f_address_street">Street address</label>
              <input type="text" id="f_address_street">
          </div>
          <!-- More fields -->
      </div>
  </div>
  ```
- **Problem:** Subfields lack semantic relationship to parent label
- **Fix Required:**
  ```html
  <fieldset>
      <legend>Full Address (Required)</legend>
      <div class="va-address-grid">
          <div class="va-field">
              <label for="f_address_street">Street address</label>
              <input type="text" id="f_address_street" required>
          </div>
          <!-- More fields -->
      </div>
  </fieldset>
  ```
- **WCAG Criterion:** 1.3.1 (Info and Relationships)

#### 7. ❌ Form Submission Not Announced
- **Severity:** MAJOR
- **Location:** Line 940 (Submit button)
- **Issue:** No aria-live region or status update on form submission
- **Current Code:**
  ```html
  <button class="va-btn va-btn--primary" onclick="exportFormData()">Submit application</button>
  ```
- **Missing:** Post-submission messaging, loading state, confirmation
- **Fix Required:** Add live region for feedback
  ```html
  <div id="formStatus" aria-live="polite" aria-atomic="true" role="status"></div>
  <button class="va-btn va-btn--primary" onclick="submitForm()">Submit application</button>

  <script>
  async function submitForm() {
      const statusDiv = document.getElementById('formStatus');
      statusDiv.textContent = 'Submitting form...';
      try {
          await exportFormData();
          statusDiv.textContent = 'Form submitted successfully!';
      } catch (e) {
          statusDiv.textContent = `Error: ${e.message}`;
      }
  }
  </script>
  ```
- **WCAG Criterion:** 3.3.4 (Error Prevention), 4.1.3 (Status Messages)

#### 8. ❌ Edit Button in Review Step Not Accessible
- **Severity:** MAJOR
- **Location:** Line 1132
- **Current Code:**
  ```html
  <button class="va-review-edit-link" onclick="navigateToStep(${stepIdx})">
      Edit ${esc(s.title)}
  </button>
  ```
- **Issue:** Button styled as link; unclear purpose to screen readers
- **Problem:** Semantically confusing (button vs link); navigation change not announced
- **Fix Required:**
  ```html
  <a href="javascript:navigateToStep(${stepIdx})" class="va-review-edit-link">
      Edit <span class="sr-only">${esc(s.title)}</span>
  </a>

  <script>
  function navigateToStep(stepIdx) {
      currentStep = stepIdx;
      renderVAForm(currentSchema, currentOrg);
      // Announce navigation
      const announce = document.createElement('div');
      announce.setAttribute('role', 'status');
      announce.setAttribute('aria-live', 'polite');
      announce.textContent = 'Navigated to ' + currentSchema['x-va-form'].formSections[stepIdx].title;
      document.body.appendChild(announce);
      setTimeout(() => announce.remove(), 3000);
  }
  </script>
  ```
- **WCAG Criterion:** 1.3.1 (Info and Relationships), 3.2.2 (On Focus)

---

### FAILED: Minor Issues (Nice to Have)

#### 1. ⚠️ Color-Dependent Instructions (SSN Field)
- **Severity:** MINOR
- **Location:** Line 1189
- **Current Code:**
  ```html
  <div class="va-field-hint">Format: XXX-XX-XXXX</div>
  ```
- **Issue:** Hint text is informational but relies on text color for distinction
- **Fix:** Add icon or emphasis
  ```html
  <div class="va-field-hint">
      <span class="va-hint-icon" aria-hidden="true">ℹ️</span>
      Format: XXX-XX-XXXX
  </div>
  ```
- **WCAG Criterion:** 1.4.1 (Use of Color)

#### 2. ⚠️ Select Option "-Select-" Not Marked
- **Severity:** MINOR
- **Location:** Line 1221
- **Current Code:**
  ```html
  <select id="f_fieldId" ...>
      <option value="">- Select -</option>
      <option>Option 1</option>
  </select>
  ```
- **Issue:** Placeholder option is not semantically marked
- **Fix:**
  ```html
  <select id="f_fieldId" required aria-label="Select an option">
      <option value="" disabled selected>-- Select --</option>
      <option>Option 1</option>
  </select>
  ```
- **WCAG Criterion:** 3.3.2 (Labels or Instructions)

#### 3. ⚠️ Loading Spinner Not Announced
- **Severity:** MINOR
- **Location:** Line 854
- **Current Code:**
  ```html
  <div class="loading"><div class="spinner"></div>Loading form...</div>
  ```
- **Issue:** Spinner animation is purely visual
- **Fix:**
  ```html
  <div class="loading" role="status" aria-live="polite">
      <div class="spinner" aria-hidden="true"></div>
      Loading form...
  </div>
  ```
- **WCAG Criterion:** 4.1.3 (Status Messages)

#### 4. ⚠️ Empty State Error Not Accessible
- **Severity:** MINOR
- **Location:** Line 862
- **Current Code:**
  ```html
  <div class="empty-state"><h2>Failed to load form</h2><p>${e.message}</p></div>
  ```
- **Issue:** Error is visual only, no role to announce
- **Fix:**
  ```html
  <div class="empty-state" role="alert">
      <h2>Failed to load form</h2>
      <p>${e.message}</p>
  </div>
  ```
- **WCAG Criterion:** 4.1.3 (Status Messages)

#### 5. ⚠️ Placeholder Text Strategy
- **Severity:** MINOR
- **Location:** Multiple fields (lines 1186, 1199, 1205, etc.)
- **Issue:** Placeholder text used but should not replace label
- **Current:** Labels are present, which is good, but placeholders may confuse
- **Recommendation:** Keep labels separate from placeholders
  ```html
  <label for="f_email">Email Address (Required)</label>
  <input type="email" id="f_email" placeholder="example@email.com" required>
  ```
- **WCAG Criterion:** 3.3.2 (Labels or Instructions)

#### 6. ⚠️ State Select Not Initialized
- **Severity:** MINOR
- **Location:** Line 1271
- **Current Code:**
  ```html
  <select id="f_${fieldId}_state" ...>
      <option value="">--</option>
      ${US_STATES.map(s => '<option>' + s + '</option>').join('')}
  </select>
  ```
- **Issue:** "--" placeholder is not descriptive
- **Fix:**
  ```html
  <select id="f_${fieldId}_state" ... required aria-label="Select state">
      <option value="" disabled selected>-- Select State --</option>
      ${US_STATES.map(s => '<option>' + s + '</option>').join('')}
  </select>
  ```
- **WCAG Criterion:** 3.3.2 (Labels or Instructions)

#### 7. ⚠️ Form Validation Feedback Not Present
- **Severity:** MINOR
- **Location:** Throughout form (lines 1176-1310)
- **Issue:** `required` attribute present but no JavaScript validation or feedback
- **Impact:** Browser default validation may not be accessible on all devices
- **Recommendation:** Implement JavaScript validation with `aria-invalid` and error messages
- **WCAG Criterion:** 3.3.1 (Error Identification)

---

## Remediation Priority & Timeline

### Phase 1: Critical Fixes (Required for 508 Compliance) - 1-2 weeks
1. Add skip-to-main-content link
2. Convert form container to `<main>` landmark
3. Add fieldset/legend to radio and checkbox groups
4. Add aria-label to icon-only buttons
5. Add aria-label to search input
6. Implement form validation with error messages

### Phase 2: Major Fixes (Highly Recommended) - 2-3 weeks
1. Add aria-controls and aria-hidden to accordion
2. Fix required field programming (aria-required)
3. Update breadcrumb with nav landmark
4. Add new-window warnings to external links
5. Wrap address fields in fieldset
6. Implement form submission feedback
7. Fix edit button semantics

### Phase 3: Minor Improvements (Polish) - 1 week
1. Improve placeholder strategies
2. Add role="status" to loading and error states
3. Enhance select option text
4. Add aria-hidden to decorative icons

---

## Testing Recommendations

### Automated Testing Tools
- **axe DevTools:** Run browser extension to identify remaining ARIA issues
- **WAVE (WebAIM):** Check for contrast, heading structure, form labels
- **Lighthouse:** Run in Chrome DevTools for accessibility audit
- **pa11y:** Command-line tool for continuous integration

### Manual Testing with Screen Readers
Test with at least two screen readers:
- **NVDA (Windows):** Free, open-source
- **JAWS (Windows):** Industry standard
- **macOS VoiceOver:** Built-in
- **Mobile:** iOS VoiceOver, Android TalkBack

### Test Scenarios
1. **Navigation Flow:** Tab through entire form start to finish
2. **Form Field Announcement:** Each field announces label, type, and requirements
3. **Error Handling:** Submit without required fields; hear error messages
4. **Accordion Usage:** Open/close review sections; hear state changes
5. **Button Purpose:** All buttons announce their action clearly
6. **Radio/Checkbox:** Group labels announce with each option
7. **Link Behavior:** External link opens new window; user warned

### Browser Compatibility
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Android)

---

## Code Examples for Remediation

### Example 1: Skip Link
```html
<body>
    <a href="#mainPanel" class="skip-to-main">Skip to main content</a>
    <!-- ... header, sidebar ... -->
    <main id="mainPanel" class="va-form-container">
        <!-- Form content -->
    </main>

    <style>
    .skip-to-main {
        position: absolute;
        top: -40px;
        left: 0;
        background: #000;
        color: #fff;
        padding: 8px 16px;
        text-decoration: none;
        z-index: 100;
        font-weight: 700;
    }
    .skip-to-main:focus {
        top: 0;
    }
    </style>
</body>
```

### Example 2: Accessible Radio Group
```html
<fieldset>
    <legend>Service Branch (Required)</legend>
    <div class="va-radio-group">
        <div class="va-radio-item">
            <input type="radio" id="f_branch_army" name="serviceBranch" value="army" required>
            <label for="f_branch_army">Army</label>
        </div>
        <div class="va-radio-item">
            <input type="radio" id="f_branch_navy" name="serviceBranch" value="navy" required>
            <label for="f_branch_navy">Navy</label>
        </div>
    </div>
</fieldset>
```

### Example 3: Form Validation with Errors
```html
<div class="va-field">
    <label for="f_ssn">Social Security Number (Required)</label>
    <div id="f_ssn_error" class="va-field-error" role="alert" aria-live="polite"></div>
    <input
        type="text"
        id="f_ssn"
        name="ssn"
        placeholder="000-00-0000"
        maxlength="11"
        pattern="\d{3}-?\d{2}-?\d{4}"
        aria-describedby="f_ssn_error"
        aria-invalid="false"
        required>
</div>

<script>
document.getElementById('f_ssn').addEventListener('blur', function() {
    const value = this.value.trim();
    const errorDiv = document.getElementById('f_ssn_error');
    const isValid = /^\d{3}-?\d{2}-?\d{4}$/.test(value);

    if (value && !isValid) {
        this.setAttribute('aria-invalid', 'true');
        errorDiv.textContent = 'Please enter a valid SSN format (XXX-XX-XXXX)';
    } else {
        this.setAttribute('aria-invalid', 'false');
        errorDiv.textContent = '';
    }
});
</script>
```

---

## Compliance Checklist

Before publishing, verify:

- [ ] Skip-to-main-content link implemented and functional
- [ ] Form wrapped in `<main>` element with id="mainPanel"
- [ ] All radio and checkbox groups use `<fieldset>` and `<legend>`
- [ ] All buttons with icons have `aria-label`
- [ ] Search input has accessible label
- [ ] Accordion buttons have `aria-controls` and `aria-hidden`
- [ ] Required fields marked with both HTML `required` and `aria-required="true"`
- [ ] Breadcrumb uses `<nav>` landmark
- [ ] External links have `aria-label` indicating new window
- [ ] Address fields grouped in `<fieldset>`
- [ ] Form submission feedback implemented with live region
- [ ] All form validation errors display with `aria-invalid` and `aria-describedby`
- [ ] Testing completed with 2+ screen readers
- [ ] Testing completed with keyboard-only navigation
- [ ] Automated accessibility tools pass (axe, WAVE, Lighthouse)

---

## Resources

- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **Section 508 Standards:** https://www.access-board.gov/law-and-regs/section-508/
- **ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/
- **VA Design System:** https://design.va.gov/
- **WebAIM Tools:** https://webaim.org/
- **Screen Reader Testing:** https://www.nvaccess.org/ (NVDA), https://www.jaws-screenreader.com/ (JAWS)

---

## Summary

The VA Form Builder has a **solid foundation** with semantic HTML and proper heading hierarchy, but requires **mandatory remediation** in six critical areas to achieve Section 508 compliance:

1. Skip navigation link
2. Main landmark element
3. Fieldset/legend for grouped inputs
4. ARIA labels for icon buttons and search
5. Form validation with error messaging
6. Accordion state communication

Upon completion of these fixes and retesting with screen readers, the form will be **508-compliant and accessible** to veterans and all users.

---

**Report Generated:** March 28, 2026
**Auditor:** Claude AI Accessibility Analyst
**Next Review:** After implementing Phase 1 fixes
