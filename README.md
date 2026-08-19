# Accessibility Playground

This branch introduces an accessibility playground designed to evaluate native, custom component implementations against W3C ARIA standards and component library primitives.

## Structure
* `playground/components/Modal.tsx` — Custom accessible modal dialog.
* `playground/components/Tabs.tsx` — Custom accessible tab list with roving tabindex.
* `playground/components/Disclosure.tsx` — Custom accessible disclosure toggle.
* `playground/NOTES.md` — Architectural analysis comparing custom implementations against headless UI primitives (Radix/shadcn).

## Features & Compliance
* Built from scratch in **React + TypeScript** with **no external component libraries**.
* Strictly follows **W3C ARIA Authoring Practices Guide (APAG)** patterns for roles, states, and keyboard navigation.
* Tested for keyboard-only interaction (focus trapping, escape handling, arrow-key navigation).