# AI Coding Guidelines

This document defines all principles generative AI must follow — from architecture decisions to coding format and styling conventions. It is the single source of truth for how this frontend project is structured and written.

## Architecture

### Folder Structure

All code lives inside `./frontend/src`. The structure below is the single source of truth — do not create folders outside of it without explicit instruction.

```
frontend/
├── src/
│   ├── assets/                   # Design resources — no logic, no state
│   │   ├── icons/                # SVG icon components
│   │   ├── illustrations/        # Illustration components
│   │   ├── images/               # Raster images (PNG, JPG, WebP)
│   │   └── index.ts              # Barrel export for all assets
│   │
│   ├── components/               # Shared, reusable UI components (no page-specific logic)
│   │   └── index.tsx             # Barrel export for all components
│   │
│   ├── business-components/      # Shared business-aware components (use entities/hooks/services)
│   │   └── index.tsx             # Barrel export for all business components
│   │
│   ├── layouts/                  # Page-level layout wrappers
│   │   ├── errors/               # Error page layouts
│   │   └── index.tsx             # Barrel export for all layouts
│   │
│   ├── routes/                   # Route definitions for the app
│   │   
│   ├── context/                  # Global app state (redux/context stores)
│   │   ├── userLogged.tsx        # Logged user redux/context state
│   │   ├── theme.tsx             # Runtime theme state (light/dark + browser sync)
│   │   └── index.ts              # Barrel export for context stores
│   │
│   ├── hooks/                    # Backend data hooks per slice
│   │   ├── <slice>/              # Ex: auth, users
│   │   │   ├── use<Entity>Data.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── errors/                   # Frontend error normalization and mappings
│   │   ├── errorCodes.ts
│   │   ├── errorMessages.ts
│   │   ├── handleApiError.ts
│   │   └── index.ts
│   │
│   ├── types/                    # Global TypeScript type definitions — no runtime code
│   ├── styles/                   # Global design tokens and shared CSS primitives
│   │   ├── global.variables.scss # Color + typography tokens (light/dark pairs)
│   │   ├── _global.scss          # SCSS token bridge mapped to runtime CSS variables
│   │   ├── index.scss            # Global styles entry point
│   │
│   ├── App.css                   # Global app-level styles
│   ├── App.tsx                   # Root React component — router setup and global providers
│   ├── index.css                 # Base reset and CSS custom property declarations
│   ├── main.tsx                  # Application entry point (ReactDOM.createRoot)
│   └── routes.ts                 # Route definitions
│
├── .gitignore
├── eslint.config.js              # ESLint configuration
├── index.html                    # HTML entry point (Vite)
├── package.json                  # Dependencies and scripts
├── package-lock.json
├── README.md
├── tsconfig.json                 # Base TypeScript config
├── tsconfig.app.json             # App-specific TypeScript config
└── tsconfig.node.json            # Node / tooling TypeScript config
```

---

### Component & Layout Creation

Every component and layout follows a strict folder-per-unit convention. Each unit owns its markup, logic, and styles in isolation.

#### Simple component (no subcomponents)

```
NameOfComponent/
├── index.tsx          # Component logic and JSX
└── index.module.scss  # Scoped styles for this component only
```

#### Component with subcomponents

When a component contains smaller pieces, those pieces live in a subfolder. The rule for where subcomponents are defined depends on reusability:

- **Reusable across the app** → the subcomponent gets its own folder inside `/components` and is imported from there.
- **Only used within this component** → the subcomponent lives in a local `components/` subfolder inside the parent.

```
NameOfComponent/
├── components/                     # Local subcomponents (not reused elsewhere)
│   ├── NameOfSubComponent/
│   │   ├── index.tsx
│   │   └── index.module.scss
│   └── index.tsx                   # Barrel export for local subcomponents
├── index.tsx                       # Parent component — imports from ./components
└── index.module.scss               # Parent-level styles
```

> **Rule:** if a subcomponent is used in more than one place, it must be promoted to `/components` and referenced from there. Never duplicate component definitions.

### Business Components

`src/business-components/` is reserved for shared UI components that know about business entities, call hooks/services, or execute business requests.

Use this folder when a component:
- Accepts backend/domain entities (for example `AuthUserResponse`, `Recipe`, `Vehicle`).
- Performs persistence calls through hooks/services.
- Is reused across layouts/features with business behavior attached.

Do not use this folder for purely presentational UI pieces. Keep pure visual components in `/components`.

Example structure:

```
business-components/
├── ProfileEditor/
│   ├── index.tsx
│   └── index.module.scss
└── index.tsx
```

#### Decision tree

```
Need a new UI piece?
│
├── Does a component in /components already cover this need (or can be extended)?
│   └── YES → reuse or extend it — never create a duplicate
│
├── Is it reused across multiple features or pages?
│   ├── YES → create it in /components/nameOfComponent/
│   └── NO  → create it as a local subcomponent inside the parent's components/ folder
│
└── Does it represent a full page or route?
    ├── YES → create it in /layouts/nameOfLayout/
    └── NO  → it belongs in /components/
```

> **Rule:** before creating any new component, always check `/components` first. If a matching or closely related component already exists, reuse or extend it rather than building a new one from scratch. Duplication is never acceptable.

#### Layouts with sub-pages — no shared `components/` folder

When a layout contains multiple sub-page layouts (child routes), the parent layout folder must **not** have its own shared `components/` folder. Each sub-layout owns its own `components/` subfolder containing only what it exclusively uses. If a component is needed by more than one sub-layout, it must be promoted to `/components/` and imported via `@components`.

The parent layout folder itself must contain only:
- Sub-layout folders (one per child route)
- Shared context / provider files (e.g. `MealsContext.tsx`)
- `index.tsx` (the `<Outlet />` wrapper + optional provider)

```
ParentLayout/              ← no components/ here
├── SubPageA/
│   ├── components/        ← only what SubPageA uses exclusively
│   │   ├── WidgetA/
│   │   └── index.tsx
│   ├── index.tsx
│   └── index.module.scss
├── SubPageB/
│   ├── components/        ← only what SubPageB uses exclusively
│   │   ├── WidgetB/
│   │   └── index.tsx
│   ├── index.tsx
│   └── index.module.scss
├── SharedContext.tsx      ← context shared across sub-pages (valid)
└── index.tsx              ← <SharedProvider><Outlet /></SharedProvider>
```

> **Rule:** components shared between sub-pages of the same parent must be promoted to the global `/components/` folder, not kept in the parent layout folder. Never create a `components/` folder at the parent layout level when that layout has child routes.

---

### Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Component folders | `PascalCase` | `UserCard/`, `ComingSoon/` |
| Style files | `index.module.scss` | always this exact filename |
| Entry files | `index.tsx` | always this exact filename |
| Barrel files | `index.ts` or `index.tsx` | `index.ts` for pure types/assets, `index.tsx` if re-exporting JSX |
| Type files | `camelCase.ts` | `routes.ts`, `userTypes.ts` |
| SCSS class names | `camelCase` | `.cardTitle`, `.homeButton` |
| CSS custom properties | `--kebab-case` | `--primary-color`, `--font-mono` |

---

### Branding

HomeOps frontend visual identity must follow a dark base with green atmosphere and violet/blue highlights.

- Primary brand color: `--color-primary` (`#6366f1`) for key actions and emphasis.
- Secondary brand color: `--color-secondary` (`#22c55e`) for positive states and accent glow.
- Dark foundation: `--color-dark` (`#0b1113`) for auth backgrounds and immersive surfaces.
- Action/interactive tones: `--color-action` (`#3b82f6`) and `--color-hover` (`#4f46e5`).
- Login branding must use the dark logo asset from `src/assets/icons/business/homeops-logo-dark.svg`.
- Avoid light-auth screens for login; keep gradients and overlays within this brand direction.
- Typography scale must be controlled through CSS variables in `src/styles/global.variables.scss` using:
  `--font-xxxs` (12px), `--font-xxs` (14px), `--font-xs` (16px), `--font-sm` (18px), `--font-md` (20px), `--font-lg` (24px).
- Global theme variables must live in `src/styles/global.variables.scss`.
- SCSS modules must consume semantic tokens from `src/styles/_global.scss` via `@use`.
- Every semantic color token must be declared in both forms: `-light` and `-dark` suffixes.
- Runtime theme tokens (without suffix) must map to either light or dark values through:
  `:root[data-theme='light']`, `:root[data-theme='dark']`, and `@media (prefers-color-scheme: dark)` fallback.
- Minimum required semantic families include: title/subtitle font colors, form primary/secondary font colors, button primary font/background, button secondary font/background, link primary/secondary, input primary/secondary backgrounds, and page primary/secondary backgrounds.

---

## Exports and Imports

Every folder listed below **must** have a barrel file (`index.ts` or `index.tsx`) that re-exports all public members. This keeps imports clean, consistent, and refactorable from a single location.

### Folders that require a barrel

```
src/
├── assets/
│   ├── icons/               → index.tsx
│   ├── illustrations/       → index.tsx
│   └── images/              → index.tsx
│
├── components/              → index.tsx
├── business-components/     → index.tsx
│
├── layouts/
│   └── errors/              → index.tsx
│
└── types/                   → index.ts
```

### Barrel format

Each barrel uses named default re-exports. The export name must exactly match the component or type name.

```ts
// src/components/index.tsx
export { default as Sidebar } from './Sidebar';
export { default as Topbar } from './Topbar';
export { default as Button } from './Button';
```

```ts
// src/assets/icons/index.tsx
export { HomeIcon } from './HomeIcon';
```

### Import paths

Always import from the barrel, never from the internal file directly.

Correct way of importing:
```ts
import { ComingSoon, NotFound } from '@/layouts/errors';
import { DesktopHouse, MobileHouse } from '@/assets/illustrations';
import { Button, Input } from '@/components';
import { ProfileEditor } from '@business-components';
import type { User, House } from '@/types';
```
Incorrect way of importing:
```ts
import ComingSoon from '@/layouts/errors/ComingSoon/index';
import DesktopHouse from '@/assets/illustrations/DesktopHouse/index';
```
```ts
import MobilHouse from '@/assets/illustrations/DesktopHouse/index';
import DesktopHouse from '@/assets/illustrations/DesktopHouse/index';
```

> **Setup note:** `@/` must be configured as a path alias pointing to `./src` in both `tsconfig.app.json` and `vite.config.ts`.
> Add `@business-components` alias pointing to `./src/business-components/index.tsx`.

```ts
// tsconfig.app.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

```ts
// vite.config.ts
import path from 'path';

export default {
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  }
};
```

---

### SCSS Module Imports

All component stylesheets should be imported using the default import pattern:
```tsx
import styles from 'index.module.scss'
```

Classes are then applied via the styles object:
```tsx
<div className={styles.container} />
```

For multiple classes, use template literals or `clsx`:
```tsx
<div className={`${styles.card} ${styles.active}`} />
<div className={clsx(styles.card, isActive && styles.active)} />
```

**Rules:**
- Always name the import `styles`
- Always name the file `index.module.scss`
- Use camelCase class names to avoid bracket notation (`styles['my-class']`)

---

### Logos and Icons

- App logos must always come from `src/assets/icons/` (SVG/icon components).
- Do not use app logos from `src/assets/images/` inside components/layouts.
- Navigation/app-shell logo size is fixed to **14px**.
- Import icons through aliases/barrels (`@icons`, `@assets`) instead of deep relative paths.
- If a view defines a local icon that already exists in `assets/icons`, remove the local duplicate and reuse the shared icon.

For button icons:

- `Button` supports SVG component imports via `icon` and size via `iconSize`.
- Preferred usage with imported SVG:

```tsx
import EditIcon from '@/assets/icons/edit.svg?react';

<Button icon={EditIcon} iconSize={14} />
```

---

## Backend Connection

### Overview

All HTTP communication with the backend lives under `src/backend/`. The folder is organized as **vertical slices** — one subfolder per backend controller. Each slice is fully self-contained and owns its models, service, and barrel export.

### Folder Structure

```
src/backend/
├── api/
│   ├── api-repository.ts        # Generic axios wrapper (get, create, update)
│   └── <slice>/                 # One folder per backend controller
│       ├── models/
│       │   ├── <Name>Request.ts
│       │   ├── <Name>Response.ts
│       │   └── index.ts         # Barrel: exports all models in this slice
│       ├── <slice>.service.ts   # Service — uses ApiRepository
│       └── index.ts             # Barrel: exports service + all models
└── index.ts                     # Top-level barrel: re-exports every slice
```

**Example — auth slice:**
```
src/backend/
├── api/
│   ├── api-repository.ts
│   └── auth/
│       ├── models/
│       │   ├── LoginRequest.ts
│       │   ├── LoginResponse.ts
│       │   └── index.ts
│       ├── auth.service.ts
│       └── index.ts
└── index.ts
```

---

### ApiRepository

`api-repository.ts` is the single axios wrapper. It is **not** imported directly by components — only by services.

```ts
// src/backend/api/api-repository.ts
export class ApiRepository {
  constructor(baseUri: string) { ... }

  get<TResponse>(extraUri?: string, params?: QueryParams): Promise<TResponse>
  create<TPayload, TResponse>(payload: TPayload, extraUri?: string): Promise<TResponse>
  update<TPayload, TResponse>(id: string, payload: TPayload, extraUri?: string): Promise<TResponse>
}
```

- `baseURL` is read from `import.meta.env.VITE_API_URL` (set via `src/env/.env.*`).
- Each method appends `baseUri + extraUri` to the base URL.
- `update` appends `/{id}` after `extraUri`.

---

### Slice Service

Each service defines its own `BASE_URI` constant and creates its own `ApiRepository` instance with it.

```ts
// src/backend/api/auth/auth.service.ts
const BASE_URI = '/api/auth';
const api = new ApiRepository(BASE_URI);

export const authService = {
  async login(request: LoginRequest): Promise<void> {
    const response = await api.create<LoginRequest, LoginResponse>(request, '/login');
    localStorage.setItem('homeops_token', response.token);
  },
};
```

**Rules:**
- `BASE_URI` must be a `const` defined at the top of the service file.
- Never hard-code the full URL inside method calls — always use `BASE_URI` via `ApiRepository`.
- All payloads and responses must be strongly typed using the models defined in `./models/`.

### Backend Calls Through Hooks

All backend calls used by UI components must go through hooks under `src/hooks/<slice>/`.

Examples:
- `src/hooks/auth/useUserLoginData.ts`
- `src/hooks/users/useUpdateUserProfileData.ts`

Rules:
- Components and layouts must consume hooks (`use...`) instead of calling backend services directly.
- Hooks encapsulate service calls and return reusable actions/data for the UI layer.
- Hook filenames follow `use<Entity><Action>Data.ts` naming.

### Base vs Business Handling

Rules:
- Business components (`src/business-components/`) should expose UI behavior and callbacks, but must not own feature-specific handlers for attribute mutations such as profile image upload, password updates, or save orchestration.
- Attribute-specific handlers (for example: `handleImageUpload`, `handlePasswordChanged`, `handleSaved`, update-submit handlers) must live in the base feature components under `layouts/*/components` or the layout root.
- Business components may validate and format local form values, then delegate persistence through callback props handled by base components.

---

### Frontend Error Handling

All Axios/backend errors must be normalized by the centralized frontend error handler in `src/errors/`.

Rules:
- `ApiRepository` must pass thrown Axios errors through `toUserFriendlyError`.
- Frontend must replicate backend `error_code` values in `src/errors/errorCodes.ts`.
- UI must only receive user-friendly messages from the error layer.
- Do not map backend errors ad-hoc inside components.

---

### Models

Each slice owns its own `models/` folder. Request and response types live in separate files.

```ts
// models/LoginRequest.ts
export interface LoginRequest {
  email?: string;
  password?: string;
  googleIdToken?: string;
}

// models/LoginResponse.ts
export interface LoginResponse {
  token: string;
}

// models/index.ts
export type { LoginRequest } from './LoginRequest';
export type { LoginResponse } from './LoginResponse';
```

**Rules:**
- Model files are named `<Name>Request.ts` / `<Name>Response.ts` in PascalCase.
- Models are **pure TypeScript interfaces** — no runtime code.
- Always create a barrel `index.ts` inside `models/`.

---

### Barrel Exports

Every level has a barrel:

| File | Exports |
|---|---|
| `models/index.ts` | All request/response types for that slice |
| `<slice>/index.ts` | Service + re-export of all models |
| `backend/index.ts` | Everything from every slice |

Components always import from `@backend`, never from internal paths:

```ts
// ✅ Correct
import { authService } from '@backend';
import type { LoginRequest } from '@backend';

// ❌ Wrong
import { authService } from '@/backend/api/auth/auth.service';
```

The `@backend` alias points to `src/backend/index.ts` and is configured in both `vite.config.ts` and `tsconfig.app.json`.

---

## Current Cleanup Rules

- Do not reintroduce legacy style files under `src/styles/` (`global.css`, `index.css`) unless explicitly requested.
- Keep global style sources limited to:
  - `src/styles/global.variables.scss`
  - `src/styles/_global.scss`
  - `src/styles/index.scss`
- If documentation references deleted files or deprecated style paths, update docs in the same PR.

---

## Authentication State and Protected Routes

- App-level authenticated state must live under `src/context/`.
- The logged user state is defined in `src/context/userLogged.tsx` and is the source of truth for route access.
- Add an authenticated route wrapper (`AuthenticatedRoute`) that checks the logged user context.
- Any route that requires login must be nested inside this authenticated wrapper.
- If the logged user state is empty, authenticated routes must redirect to `/login`.

---

### Environment Variables

All `.env` files live in `src/env/` and are loaded by Vite via `envDir: './src/env'` in `vite.config.ts`.

| File | Used when |
|---|---|
| `.env.development` | `vite` (dev server) |
| `.env.production` | `vite build` |
| `.env.example` | Documentation — commit this, not the others |

All variables must be prefixed with `VITE_` and declared in `src/vite-env.d.ts`:

```ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}
```