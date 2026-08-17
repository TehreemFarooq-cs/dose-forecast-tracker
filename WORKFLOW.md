# Workflow & Prompt Engineering Comparison Report

## Overview
This report evaluates the code quality, edge-case handling, accessibility, and developer review effort between two development iterations of the Dose Refill Settings Form component: `feature-vague` (Round 1) and `feature-precise` (Round 2).

---

## Key Diffs & Comparative Analysis

### 1. Correctness & Type Safety
* **`feature-vague`:** Generated a basic form shell with minimal validation. State management stored numeric field values as raw strings (`currentInventory: '0'`), leading to loose equality checks and potential string concatenation bugs during numeric boundary evaluation.
* **`feature-precise`:** Implemented explicit TypeScript interfaces (`FormData`, `FormErrors`) and strict client-side validation logic inside a dedicated `validate()` handler. It enforces integer parsing via `parseInt()` and strictly validates relational rules (`refillThreshold > 0 && refillThreshold < currentInventory`).

### 2. Accessibility (a11y)
* **`feature-vague`:** Rendered plain inputs without explicit structural association between form labels and inputs. Lacked dynamic ARIA attributes for screening tools.
* **`feature-precise`:** Added complete accessible markup:
  * Associated inputs and labels via explicit `htmlFor` and `id` bindings.
  * Dynamically attached `aria-invalid={!!errors[field]}`.
  * Linked error messages to input controls via `aria-describedby="${fieldName}-error"`.

### 3. Edge Cases & Error Recovery
* **`feature-vague`:** Showed no real-time error clearing or success feedback upon submit.
* **`feature-precise`:** Added dynamic error clearance inside `handleChange()` whenever a user modifies an invalid field. Added a 3-second temporary success banner and disabled form resubmission while active validation errors exist.

### 4. Review & Verification Effort
* **`feature-vague`:** Required manual line-by-line inspection to identify missing validation rules, missing accessibility attributes, and unhandled boundary cases. Zero automated test coverage.
* **`feature-precise`:** Shifted review effort from manual testing to automated verification. Includes a Vitest and React Testing Library suite (`DoseRefillSettingsForm.test.tsx`) covering initial renders, validation error triggers, and valid submit callbacks (`onSave`).

---

## AI Mistakes Caught & Lessons Learned

During the Round 2 generation, the AI agent made two distinct mistakes:
1. **Root File Deletion / Import Mismatch:** The AI refactored the component export to named `DoseRefillSettingsForm` but removed `src/App.tsx`, `src/main.tsx`, and `index.html` from the workspace, resulting in a completely blank browser view upon server start.
2. **Type Coercion in Tests:** The initial test suite expected string outputs (`'10'`) in the `onSave` callback assertion, while form state logic required strict numeric parsing for boundary checks.

**Takeaway:** Precise prompts drastically improve UI output and test coverage, but developer intervention remains essential to resolve project entry point mismatches and environment integration errors.