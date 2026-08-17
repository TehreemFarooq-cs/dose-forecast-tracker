# DoseForecast Tracker 💊 - Project Guidelines & Rules

## Project Rules

1. **Form Accessibility Standard:**
   - Every form input must pair an explicit `id` with a matching `<label htmlFor="...">`.
   - Dynamic error text must be rendered in an element with an `id` matching the input's `aria-describedby` attribute, alongside `aria-invalid`.

2. **Numeric Boundary Validation:**
   - Numeric form fields representing stock or thresholds must be sanitized using `parseInt()` or `Number()` prior to relational comparisons (e.g., verifying `threshold < inventory`).

3. **Entry Point & Export Preservation:**
   - AI generation tasks for new components must preserve root entry files (`src/App.tsx`, `src/main.tsx`, `index.html`) and explicitly wire new exports into the main rendering tree.
