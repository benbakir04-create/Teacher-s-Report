<!-- Copilot / AI agent instructions for contributors and automated agents -->
# Repo Overview — quick context

This is a small single-page React + Vite app (TypeScript) for teacher daily reports. Key runtime assumptions:
- RTL Arabic UI (see `index.html` lang/dir and Tailwind config).
- Local-first state stored in `localStorage` (keys: `teacher_report_data`, `teacher_report_archive`).
- A front-end AI integration lives in `services/geminiService.ts` and uses `@google/genai`.

# Big-picture architecture
- `App.tsx` is the central coordinator: it owns the `ReportData` state (see `types.ts`), synchronizes to `localStorage`, and renders top-level components (`Header`, `ProgressStepper`, `BottomNav`, the various step screens).
- UI primitives live in `components/` (notable patterns: `CheckboxGrid` for multi-select collapsible lists; `ProgressStepper`/`BottomNav` for navigation and status badges).
- Static/mock data is in `constants.ts` (`MOCK_DATA`) and drives select lists and options. Update it when adding new domain values.
- `services/geminiService.ts` contains the single AI call used to generate a report summary. The API key is injected via Vite (`GEMINI_API_KEY`) and mapped to `process.env.API_KEY` in `vite.config.ts`.

# Important developer workflows
- Install & run locally:
  - `npm install`
  - Add `GEMINI_API_KEY` to `.env.local` (used at build/dev time)
  - `npm run dev` (Vite dev server)
  - `npm run build` / `npm run preview` for production preview
- Live assets: `index.html` includes an importmap used by AI Studio builds — changes there affect hosted deployments.
- Service worker: `public/sw.js` is registered in `index.html` on page load.

# Conventions & patterns to preserve
- RTL first: CSS and markup assume right-to-left layout. Keep `dir="rtl"` and avoid flipping X/Y logic unless intentionally localizing.
- Local-first data: `App.tsx` persists the canonical report state. When changing the report shape, update `types.ts`, `App.tsx` (state init & localStorage load/save), and `services/geminiService.ts` prompt code.
- UI components are small and self-contained; prefer editing `components/*` before bloating `App.tsx`.
- Mock lists: add new subjects/levels/strategies in `constants.ts` to appear in selects and `MOCK_DATA.lessons`.

# Integration & security notes for AI agents
- `services/geminiService.ts` calls `@google/genai` directly using `process.env.API_KEY` (Vite defines this at build time). Be careful: the key may end up in client bundles if not proxied — prefer a backend proxy for production secrets.
- Prompt ownership: the prompt template lives in `services/geminiService.ts`. Update that file if you change what the AI must summarize.

# Quick code examples (how to make common edits)
- Add a new teaching strategy option: edit `constants.ts` → `MOCK_DATA.strategies` and ensure any UI text changes preserve Arabic/RTL.
- Change the persistent key name: update `App.tsx` (localStorage.getItem / setItem) and document migration logic for existing users.
- Add a new field to the report: update `types.ts`, add default in `App.tsx.initialReport`, update any form inputs and the `generateReportSummary` prompt.

# Files to inspect first when troubleshooting
- `App.tsx` — orchestrates state, persistence, and step rendering
- `types.ts` — canonical data shapes
- `constants.ts` — mock data and domain lists
- `services/geminiService.ts` — AI prompt + call
- `vite.config.ts` — how `GEMINI_API_KEY` is injected
- `index.html` — RTL, importmap, Tailwind CDN, and service-worker registration

# When you edit
- Make small, focused commits; update `constants.ts` and `types.ts` together when changing data shapes.
- Preserve existing className/Tailwind conventions and the Arabic copy unless asked to localize.

# Missing / not present
- There are no unit tests in this repository; add tests under a `__tests__` folder if introducing complex logic.

If anything here is unclear or you want the instructions adjusted (e.g., more examples, CI/PR conventions), tell me which parts to expand.
