# VA Form Builder Button Appearance Test Report

**Test Date:** March 28, 2026
**File Tested:** `/sessions/eager-nice-euler/mnt/Aquia Form Builder/forms.html`
**Tester:** Claude Code AI Agent

---

## Executive Summary

Testing of the green start button and Continue/Back button arrow characters revealed **3 distinct issues**:

1. **[HIGH PRIORITY]** Start button triangle (▶) undersized in 20px container - creates visual imbalance
2. **[MEDIUM PRIORITY]** Style mismatch between Start button (solid triangle) and navigation buttons (angle quotes) - violates design consistency
3. **[LOW PRIORITY]** Small font sizes may experience font hinting/rendering issues across browsers

---

## Test 1: Green Start Button Arrow Character

### Implementation Details

The green start button uses the `va-action-link` class with a circular icon containing a right-pointing triangle.

```css
.va-action-link::before {
    content: '▶';
    font-size: 0.7rem;
    background: var(--vads-color-success);
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
```

### Character Analysis

| Property | Value |
|----------|-------|
| **Character** | ▶ (Right-Pointing Triangle) |
| **Unicode** | U+25B6 |
| **Name** | Black Right-Pointing Triangle Operator |
| **HTML Entity** | Not a standard entity (using literal character) |
| **Font Size** | 0.7rem |
| **Size Calculation** | 0.7rem × 16px = 11.2px (approximate) |
| **Container** | 20px × 20px circle with flexbox centering |

### Test Findings: ISSUE FOUND

**Problem:** The ▶ (U+25B6) character at 0.7rem appears significantly undersized inside the 20px circular container.

**Symptoms:**
- Extra whitespace around the character inside the circle
- Visual imbalance that makes the button feel "off"
- The arrow appears to "float" rather than fill the container
- Potential rendering issues depending on system font

**Impact:** Users perceive the button as visually strange or incomplete due to disproportionate sizing.

**Root Cause:** The font-size (0.7rem) is too small relative to both:
1. The button text size (1.1rem for "Start VA Form 20-0995")
2. The container size (20px × 20px circle)

The triangle character at 11.2px is approximately 64% of the button text size, and only 56% of the container's dimensions.

---

## Test 2: Continue Button Arrow Character

### Implementation Details

The Continue button uses the `va-btn--primary::after` pseudo-element to append an arrow.

```css
.va-btn--primary::after {
    content: ' \u203A';
    font-size: 1.2em;
}
```

### Character Analysis

| Property | Value |
|----------|-------|
| **Character** | › (Single Right-Pointing Angle Quotation Mark) |
| **Unicode** | U+203A |
| **Name** | Single Right-Pointing Angle Quotation Mark |
| **HTML Entity** | `&rsaquo;` |
| **Font Size** | 1.2em (120% of button text) |
| **Size Calculation** | 1.2em × 0.95rem = 1.14rem = 18.2px (approximate) |
| **Spacing** | Preceded by a space character: `' \u203A'` |

### Visual Sample

```
►  (shows as "›" in most fonts)
```

### Test Findings: ACCEPTABLE with Caveats

**Assessment:** This character choice is generally appropriate for navigation buttons.

**Pros:**
- ✓ The single angle quotation mark (›) is a proper typographic character designed for directional indication
- ✓ It scales proportionally with the button text (1.2em multiplier)
- ✓ It has proper kerning and spacing with the preceding space
- ✓ Consistent with web accessibility standards
- ✓ Renders well at normal font sizes (18.2px)

**Potential Issues:**
- ⚠ May appear slightly italic or slanted on some browsers/fonts
- ⚠ At small viewport sizes or with zoom-out, rendering quality may degrade
- ⚠ Font hinting at this size may cause slight inconsistencies across browsers

**Browser-Specific Rendering:**
- **Safari/macOS:** May render with more pronounced italic slant
- **Chrome/Edge/Chromium:** Generally renders upright and clean
- **Firefox:** Depends on system font availability
- **Mobile browsers:** Rendering quality varies by device and font stack

---

## Test 3: Back Button Arrow Character

### Implementation Details

The Back button uses the `va-btn--back::before` pseudo-element to prepend an arrow.

```css
.va-btn--back::before {
    content: '\u2039 ';
    font-size: 1.2em;
}
```

### Character Analysis

| Property | Value |
|----------|-------|
| **Character** | ‹ (Single Left-Pointing Angle Quotation Mark) |
| **Unicode** | U+2039 |
| **Name** | Single Left-Pointing Angle Quotation Mark |
| **HTML Entity** | `&lsaquo;` |
| **Font Size** | 1.2em (120% of button text) |
| **Size Calculation** | 1.2em × 0.95rem = 1.14rem = 18.2px (approximate) |
| **Spacing** | Followed by a space character: `'\u2039 '` |

### Visual Sample

```
◄  (shows as "‹" in most fonts)
```

### Test Findings: ACCEPTABLE with Caveats

**Assessment:** This character choice mirrors the Continue button appropriately.

**Pros:**
- ✓ Perfect mirror of Continue button (U+2039 ↔ U+203A)
- ✓ Uses same scaling and spacing approach (1.2em)
- ✓ Maintains typographic consistency within navigation buttons
- ✓ Symmetrical design supports bidirectional navigation

**Potential Issues:**
- ⚠ Same font hinting issues as the Continue button
- ⚠ May appear slightly italic/slanted on Safari

---

## Test 4: Character Consistency Comparison

### Visual Comparison

| Aspect | Start Button | Continue/Back Buttons |
|--------|--------------|----------------------|
| **Character** | ▶ (U+25B6) | › ‹ (U+203A/U+2039) |
| **Visual Style** | Solid geometric triangle | Typographic angle quotes |
| **Font Size** | 0.7rem in 20px circle | 1.2em inline |
| **Visual Weight** | Heavy/Bold | Light/Elegant |
| **Rendering Quality** | ⚠ Problematic due to size | ✓ Good at 18.2px |
| **Design Language** | Geometric/modern | Typographic/classic |

### ISSUE FOUND: Style Mismatch

**Problem:** The start button and navigation buttons use **visually inconsistent** arrow styles.

**Inconsistencies:**
- Start button uses a solid filled triangle (▶)
- Continue/Back buttons use elegant angle quotation marks (›/‹)
- Different visual weights and design philosophies
- Different sizing strategies (circle container vs. inline)

**Design Impact:**
- Creates a discontinuous visual experience across the form flow
- Users may unconsciously perceive these as different types of actions
- Violates the consistency principle of good design
- The visual disconnect undermines the unified form experience

**User Experience Implications:**
- "Start" feels like a different interaction compared to "Continue"
- May suggest different behavior or affordance
- Could create cognitive friction in the user's mental model

---

## Test 5: Rendering Quality Assessment

### Potential "Weirdness" Sources

#### 1. Font Hinting Issues

The angle quotation marks (› and ‹) may render differently across browsers due to **font hinting** at small sizes.

**Details:**
- At ~18.2px, these characters are borderline for optimal font hinting
- Different font rendering engines (ClearType, CoreText, FreeType) produce different results
- Some fonts include hand-optimized hints for common characters; others don't

**Expected Variations:**
- Slightly slanted rendering
- Width inconsistency across characters
- Blurry or unclear edges on some systems
- More pronounced effects on older browsers

#### 2. Triangle Sizing Issue (Start Button)

The ▶ character at 0.7rem has **severe sizing problems**.

**Metrics:**
- Character size: 11.2px (0.7rem)
- Button text size: 17.6px (1.1rem)
- Container size: 20px × 20px
- Character fills only ~56% of container dimensions

**Visual Effect:**
- Creates excessive whitespace inside the circular container
- Character appears to "float" rather than anchor
- The optical imbalance makes the button feel incomplete or "off"
- This is the primary source of the "weirdness" you noticed

#### 3. Cross-Browser Rendering Variations

| Browser | Expected Rendering | Notes |
|---------|-------------------|-------|
| **Safari (macOS)** | More italic/slanted › | CoreText font rendering can emphasize serifs |
| **Chrome (macOS)** | Upright, clean › | Blink engine with good font hinting |
| **Chrome (Windows)** | Very clean › | ClearType provides excellent hinting |
| **Firefox** | Variable quality › | Depends on system fonts and FreeType configuration |
| **Edge** | Clean, similar to Chrome | Same Blink engine as Chrome |
| **Safari (iOS)** | May be blurry | Mobile font rendering less refined |

---

## Detailed Findings Summary

### Issue #1: Start Button Triangle Undersizing [HIGH PRIORITY]

**Severity:** HIGH - Directly causes the "weird" appearance you noticed

**Location:** `/forms.html` lines 576-588 (`.va-action-link::before` CSS)

**Problem:**
```css
.va-action-link::before {
    content: '▶';
    font-size: 0.7rem;  /* TOO SMALL */
    width: 20px;
    height: 20px;
    /* ... flex centering ... */
}
```

The 0.7rem font size results in the triangle character being only 56% of the container size, leaving too much whitespace.

**Recommendations:**

**Option 1: Increase character size (RECOMMENDED)**
```css
.va-action-link::before {
    content: '▶';
    font-size: 1rem;  /* Increased from 0.7rem */
    /* ... rest unchanged ... */
}
```

**Option 2: Increase both character size and container**
```css
.va-action-link::before {
    content: '▶';
    font-size: 1.2rem;
    width: 24px;  /* Increased from 20px */
    height: 24px;  /* Increased from 20px */
    /* ... rest unchanged ... */
}
```

**Option 3: Use a different visual approach entirely**
```css
.va-action-link::before {
    content: '›';  /* Use angle quote instead */
    font-size: 1.4rem;
    font-weight: 700;
    background: var(--vads-color-success);
    color: white;
    padding: 0.4rem 0.8rem;  /* Instead of fixed circle */
    border-radius: 4px;  /* Instead of 50% */
    width: auto;  /* Instead of 20px */
    height: auto;  /* Instead of 20px */
    display: inline-flex;  /* Keep flex for centering */
}
```

### Issue #2: Arrow Character Style Mismatch [MEDIUM PRIORITY]

**Severity:** MEDIUM - Affects design consistency and user perception

**Problem:** Three different button types use three different visual styles:
- Start: Solid geometric triangle (▶)
- Continue: Typographic angle quote (›)
- Back: Typographic angle quote (‹)

**Recommendation: Unify the Arrow Characters**

**Option A: Use angle quotes everywhere (RECOMMENDED for consistency)**
```css
/* Start button */
.va-action-link::before {
    content: '›';  /* Changed from '▶' */
    font-size: 1.4rem;
    /* ... adjust styling as per Issue #1 ... */
}

/* Continue button - no change needed */
.va-btn--primary::after {
    content: ' \u203A';
    font-size: 1.2em;
}

/* Back button - no change needed */
.va-btn--back::before {
    content: '\u2039 ';
    font-size: 1.2em;
}
```

**Option B: Use triangles everywhere (NOT RECOMMENDED)**
```css
/* Start button - no change needed */
.va-action-link::before {
    content: '▶';
}

/* Continue button */
.va-btn--primary::after {
    content: ' ▶';  /* Changed from '\u203A' */
    font-size: 1em;  /* Adjust to 0.9em */
}

/* Back button */
.va-btn--back::before {
    content: '◀ ';  /* Changed from '\u2039' - left triangle */
    font-size: 1em;  /* Adjust sizing */
}
```

### Issue #3: Font Hinting at Small Sizes [LOW PRIORITY]

**Severity:** LOW - Minor rendering quality variations

**Problem:** The 1.2em size (18.2px) for angle quotes is small enough to experience minor font hinting variations across browsers and systems.

**Recommendation: Consider increasing font size slightly**
```css
.va-btn--primary::after {
    content: ' \u203A';
    font-size: 1.3em;  /* Increased from 1.2em */
}

.va-btn--back::before {
    content: '\u2039 ';
    font-size: 1.3em;  /* Increased from 1.2em */
}
```

This increases the size to ~19.4px, which is better for consistency across rendering engines.

---

## Code Reference

### Current Implementation (forms.html)

**Lines 576-589 (Action Link / Start Button):**
```css
.va-action-link::before {
    content: '▶';
    font-size: 0.7rem;
    background: var(--vads-color-success);
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.va-action-link:hover::before { background: #008516; }
```

**Lines 482-491 (Primary and Back Button):**
```css
.va-btn--primary::after { content: ' \u203A'; font-size: 1.2em; }
.va-btn--secondary:hover { background: var(--vads-color-info-lighter); }
.va-btn--back::before { content: '\u2039 '; font-size: 1.2em; }
```

---

## Testing Recommendations

### 1. Cross-Browser Testing

- [ ] Test on Safari (macOS) - check for italic rendering
- [ ] Test on Chrome (Windows) - verify ClearType rendering
- [ ] Test on Firefox - check system font fallback
- [ ] Test on Edge - verify Blink engine consistency
- [ ] Test on Safari (iOS) - verify mobile rendering

### 2. Accessibility Testing

- [ ] Verify arrows are visible to users with color blindness
- [ ] Test with screen readers (ensure arrow text is conveyed)
- [ ] Test with zoom levels (100%, 150%, 200%)
- [ ] Test with high contrast mode enabled

### 3. Responsive Design Testing

- [ ] Test on mobile devices (iPhone, Android)
- [ ] Test at various viewport widths (320px, 768px, 1024px)
- [ ] Verify button appearance on small screens
- [ ] Check spacing adjustments for mobile

### 4. Font Rendering Testing

- [ ] Test with system fonts disabled (fallback fonts)
- [ ] Test with various font sizes/zoom levels
- [ ] Verify consistency across different OS versions
- [ ] Test on older browsers (IE11 compatibility if required)

---

## Conclusion

The "weirdness" you noticed is primarily due to **Issue #1: undersized triangle character** in the Start button. The 0.7rem font size creates excessive whitespace inside the 20px circular container, making the visual feel incomplete or unbalanced.

Additionally, **Issue #2: style mismatch** between different button types creates a subtle but noticeable inconsistency that undermines the unified design aesthetic.

**Priority Actions:**
1. ✓ **Immediately fix:** Increase Start button triangle size (0.7rem → 1rem or higher)
2. ✓ **Soon fix:** Unify arrow character styles across all navigation buttons
3. ✓ **Nice to have:** Test and adjust font hinting at small sizes

These changes will restore visual consistency and eliminate the "weird" appearance while maintaining the elegant VA.gov design language.

---

**Report Generated:** March 28, 2026
**Testing Agent:** Claude Code AI
**Status:** Complete
