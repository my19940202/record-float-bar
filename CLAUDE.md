# DemoCue Project Guide

## Overview

DemoCue is a macOS Tauri 2 app with a React 19 frontend. It generates structured presentation or recording outlines, stores them locally, and shows a transparent always-on-top floating guide window while recording.

## Directory Structure

- `src/`: React frontend source.
- `src/pages/`: Main routed pages for outline list, outline creation, outline editing, and settings.
- `src/components/`: Shared UI and feature components.
- `src/components/ui/`: Small local UI primitives such as buttons, cards, inputs, and tabs.
- `src/windows/`: Alternate window entry components, currently the floating outline window.
- `src/services/`: Frontend data and Tauri command adapters.
- `src/stores/`: Zustand stores for shared frontend state.
- `src/lib/`: Utility helpers and global app helpers such as i18n.
- `src/types/`: Shared TypeScript domain types and normalization helpers.
- `src-tauri/`: Rust backend, Tauri configuration, app icons, permissions, and generated schemas.
- `index.html`: Main app HTML entry.
- `floating.html`: Floating window HTML entry.

## Key Frontend Files

- `src/App.tsx`: Chooses between the main routed app and the floating window based on the current path. Wraps the main app in the global i18n provider.
- `src/components/AppLayout.tsx`: Main application shell with DemoCue branding, navigation, and shared page background.
- `src/lib/i18n.tsx`: Global Chinese/English language state, persisted in `localStorage` under `democue.language`.
- `src/pages/Home.tsx`: Lists saved outlines and opens an outline in the floating window.
- `src/pages/CreateOutline.tsx`: Creates a new outline from text or PDF/Markdown/TXT input.
- `src/pages/EditOutline.tsx`: Edits outline titles, chapters, and talking points.
- `src/pages/Settings.tsx`: Configures DMXAPI settings and toggles the global UI language.
- `src/components/FloatingPanel.tsx`: Floating guide bar UI, including theme, layout, font size, opacity, blur, and background color settings.
- `src/components/Chapter.tsx`: Editable chapter card used by the outline editor.
- `src/services/api.ts`: Tauri `invoke` wrappers and re-exports for local database helpers.
- `src/services/db.ts`: Frontend SQLite access through `@tauri-apps/plugin-sql`.
- `src/stores/outlineStore.ts`: Zustand state for outline lists, drafts, saving, and deletion.
- `src/index.css`: Tailwind import, design tokens, app theme, and floating window styles.

## Key Tauri Files

- `src-tauri/tauri.conf.json`: Product name, windows, bundle icon paths, build commands, and plugin config.
- `src-tauri/src/lib.rs`: Tauri builder setup, plugins, command registration, and global shortcut handling.
- `src-tauri/src/commands/mod.rs`: Tauri commands for settings, AI generation, floating window lifecycle, and floating settings.
- `src-tauri/src/state.rs`: Serializable app settings and in-memory floating window runtime state.
- `src-tauri/src/db.rs`: SQLite schema migrations and outline normalization on the Rust side.
- `src-tauri/src/dmx.rs`: DMXAPI Gemini request construction, response parsing, and error handling.
- `src-tauri/capabilities/default.json`: Tauri permission scope for the main and floating windows.
- `src-tauri/icons/icon.png`: App icon referenced by Tauri bundle config.

## Common Commands

```bash
pnpm install
pnpm tauri dev
pnpm exec tsc -b
pnpm run build
cd src-tauri && cargo check
```

## Implementation Notes

- Keep user-visible brand text as `DemoCue`.
- Do not change the Tauri bundle identifier unless intentionally creating a separate installed app. Changing it can break continuity for local data and macOS permissions.
- The main app supports global Chinese/English UI text through `useI18n()`. Add new user-facing page text to `src/lib/i18n.tsx`.
- The floating window is intentionally separate from the main app shell and is not required to use the global language provider.
- Floating panel settings are persisted through the Tauri store under `floatingSettings`; keep TypeScript and Rust settings structs in sync.
- Local outlines are stored in SQLite through the Tauri SQL plugin.
- DMXAPI endpoint and API key are stored locally via the Tauri store and are not bundled into the frontend.
