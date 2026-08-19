# Accessibility Playground Notes

## Architectural Comparison: Custom Implementation vs. Component Libraries (shadcn/Radix UI)

### 1. Modal Dialog
* **DOM Portals:** My manual implementation renders inline, meaning nested parent elements with hidden overflow or low stacking contexts (`z-index`) can clip the modal. shadcn/Radix uses `ReactDOM.createPortal` to render the dialog directly to the `document.body`.
* **Scroll Locking:** Manual implementation leaves the background document fully scrollable. shadcn/Radix injects a dynamic style body-lock (`overflow: hidden` + scrollbar padding adjustments) to prevent background content jitter.
* **Focus Management:** While manual focus trapping handles Tab / Shift+Tab looping, Radix handles edge case pointer-event blocking, outside-click detection, and restoring focus precisely to the activating element on close.

### 2. Tabs
* **Roving TabIndex / Keyboard Navigation:** Manual tabs require tracking focus arrays and handling keys (`ArrowLeft`, `ArrowRight`, `Home`, `End`) explicitly. shadcn/Radix primitives abstract this behavior into accessible composite widgets out of the box.

### 3. Disclosure
* **ARIA ID Generation:** Manual code requires careful unique ID handling for `aria-controls`. Component libraries leverage React's `useId()` under the hood safely to eliminate accessibility validation errors across server/client boundaries.