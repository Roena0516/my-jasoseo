# CLAUDE.md

Web editor that reproduces a Figma 자기소개서 layout 1:1 and exports it to A4 PDF.
Vite + React 19 + TypeScript, no UI library, no router, no backend.

## Workflow

- **Do not start the dev server** (`npm run dev`, `vite`, `vite preview`). The user runs it; ask them to start it if a browser check is needed.
- Verify changes with `npm run build` (runs `tsc --noEmit` then `vite build`).
- Deployed by the user on **Vercel** from `main`. Do not add GitHub Pages or other deploy workflows. Keep `base: './'` in `vite.config.ts`.
- UI copy, README and commit-facing text are in Korean.

## Source of truth: Figma

- File: `UHucXYwI2dkI13fqy6Z7kj` (이력서 자기소개서 양식), frame `138:11` (“Frame 47”) with pages `136:2` (1페이지) and `136:97` (2페이지).
- `src/defaultContent.json` is the Figma text copied verbatim (including leading spaces after `\n` and a trailing `\n` in 협업 활동). Don't retype or "clean up" it; regenerate from Figma if the design changes.
- `src/assets/logo.svg` (group “밝은 배경용”) and `src/assets/signature.png` are Figma exports.

## Layout rules (don't break these)

- Figma page 595 × 842 = A4 in **pt**, so everything inside `.page` is written in `pt` using Figma values directly. The page box itself is `210mm × 297mm`. Don't convert to px.
- Key measurements: side margins 40pt; logo at (466.6, 37) 88.4 × 11.9; page 1 header at top 37 (two 25pt lines = 50pt) then content at 112; later pages content at 84; section gap 18pt on page 1 / 28pt on others; section head → items 10pt; items gap 10pt; body 10pt/16pt, letter-spacing 0.3pt, `#1b1b1b`; section title Bold 14/15, -0.2pt; header SemiBold 24/25 with tagline Regular 14 `#3e6af2`.
- `.doc-header__tagline { line-height: 1 }` keeps the mixed-size second header line at 25pt. Without it the header grows to ~54pt.
- `.item__body::after { content: '\200b' }` makes a trailing `\n` render as an empty line, as Figma does.
- Korean wraps per syllable (default `word-break`), which matches Figma. Don't add `keep-all`.
- Signature image is positioned relative to the signature box's right edge (`right: -7pt; top: 32pt`) so it stays on "(인)".
- After layout changes, compare element positions against the Figma coordinates (measure `getBoundingClientRect` relative to `.page` × 0.75 = pt).

## PDF export

- `window.print()` plus the `@media print` / `@page { size: A4; margin: 0 }` rules in `styles.css`. Output is vector text with Pretendard embedded.
- Anything that is editor-only UI needs the `screen-only` class (hidden in print). Hover and focus styles for editing live under `@media screen`.
- In print, pages are fixed at 297mm with `overflow: hidden`. On screen they grow, and `.is-overflow` shows the 802pt safe line (`SAFE_BOTTOM_PT` in `Page.tsx`).
- Only Pretendard 400/600/700 are imported (`main.tsx`). Add a weight import if the design needs one.

## Code structure

- `src/store.ts` — `useDoc()`: state, 300ms debounced autosave to `localStorage` key `my-jasoseo:doc:v1`, and `update(fn)`, which mutates a `structuredClone` draft. Changing the `Doc` shape means bumping the key or migrating, and keeping `parseDoc` validation in sync.
- `src/components/Editable.tsx` — uncontrolled `contentEditable="plaintext-only"`. The DOM owns the text while focused (keeps caret and native undo). External values are written only when it's not focused. Don't turn it into a controlled component.
- `src/components/Page.tsx` — page, section and item rendering plus hover controls (positioned in the right gutter, outside the page).
- `src/components/ImageSlot.tsx` — logo/signature: `'default'` = bundled asset, `null` = hidden, otherwise a data URL (≤1.5MB).
- `src/App.tsx` — toolbar (zoom, JSON backup/restore, reset, PDF), header, signature, and section/item/page actions. The header only renders on page 1; the signature only on the last page.
