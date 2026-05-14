# Figuritas Mundial — Project Reference

World Cup sticker album app. Users track which stickers they have, invite others to share albums, and trade repeated stickers.

---

## Stack

### Frontend (`/frontend`)
- React 19 + TypeScript (strict), Vite 7, React Router v7
- SCSS Modules (no CSS-in-JS, no Tailwind)
- No MUI — all icons are inline SVG components
- Firebase client SDK (auth)
- Axios via `ApiRepository` abstraction
- Path aliases: `@` → `src/`, `@backend` → `src/backend/index.ts`
- Dev: `npm run dev` (port 5173), envs in `src/env/`

### Backend (`/backend`)
- Express + TypeScript, deployed on Vercel
- MongoDB + Mongoose via generic `Repository<T>`
- Firebase Admin (token verification)
- JWT sessions, nodemailer, OTP (speakeasy)
- Dev: `npm run dev` (ts-node + tsconfig-paths)
- Three strict layers: `api/` (HTTP) → `businessLogic/` (domain) → `dataAccess/` (persistence)
- Full guidelines in `backend/backend-guidelines.md`

---

## Frontend Structure

```
src/
├── backend/          # API service layer (NOT backend code)
│   ├── index.ts      # Re-exports all services and types
│   └── api/
│       ├── api-repository.ts   # Axios wrapper (get/post/patch/delete)
│       ├── albums/             # albumsService + models
│       ├── auth/               # authService + models
│       └── me/                 # meService + models
├── context/
│   └── userLogged.tsx  # UserLoggedProvider — user state + album permissions cache
├── data/
│   └── worldCupAlbum.ts  # Static album template (48 teams, sticker definitions)
├── types/
│   └── album.ts        # WorldCupSticker, WorldCupTeam, WorldCupAlbumPage, etc.
├── layouts/
│   ├── Album/          # Main album view (owner + viewer modes)
│   ├── Home/           # Dashboard
│   ├── Auth/           # Login/register
│   ├── SharedAlbum/    # Public read-only album view
│   └── AcceptInvitation/
└── styles/             # Global styles
```

---

## Album Layout (`src/layouts/Album/`)

The main feature. Split into sub-components:

| File | Responsibility |
|---|---|
| `index.tsx` | Orchestrator — all state, API calls, modals |
| `MembersSection.tsx` | Accordion: member list, invite/export buttons |
| `ProgressSection.tsx` | Accordion: KPI grid + per-country progress bars |
| `StickersSection.tsx` | Mode tabs, filters, sticker grid with group headers |
| `TeamCodeDropdown.tsx` | Custom desktop country picker (searchable) |

Each component has its own SCSS module (`*.module.scss`). `index.module.scss` holds shared/layout styles.

### Key State (index.tsx)
- `album: AlbumResponse` — full album from API
- `statusMap: Map<string, StickerStatus>` — sticker code → "no_tengo" | "tengo" | "pegado"
- `repeatedMap: Map<string, number>` — sticker code → repeat count
- `selection: Set<string>` — bulk selection (homogeneous group: all missing OR all owned)
- `selectionGroup: "missing" | "owned" | null`
- `stickerMode` — "all" | "no_tengo" | "owned" | "tengo" | "pegado" | "repetidas" | "viewer_needs_my_repeated"
- `readOnlyAlbum: boolean` — viewer sees someone else's album (no selection, no edit)
- `hasMyAlbum: boolean` — viewer also has their own album (enables "repetidas que necesita" mode)

### Permissions
Fetched from `useUserLogged().getAlbumPermissions(albumId)`. Key codes:
- `"create-albumInvitation"` → `canInvite` (admin/owner; viewers get `shareAlbum` instead)
- `"updateById-album"` → `canEditAlbum`
- `"getAll-member"` → `canViewMembers`
- `"updateById-member"` → `canManageMember`
- `"deleteById-member"` → `canDeleteMember`

### Invite flow
- `canInvite = true` → calls `albumsService.inviteMember(albumId, { invitedEmail, roleId })` — sends proper invitation with role
- `canInvite = false` (viewer) → calls `albumsService.shareAlbum(albumId, invitedEmail)` — share link

### Bulk sticker actions
- Sequential API calls via `albumsService.bulkUpdateStickers(albumId, codes, status)` — returns last `AlbumResponse` which updates state
- Bulk repeated editing: `albumsService.updateStickerRepeated(albumId, code, repeated)` per sticker sequentially

---

## Data Model

### WorldCupSticker
```ts
{ id, number, stickerCode, type: "player"|"special", teamCode?, teamName?, playerName?, title, rarity, page }
```

### Sticker ordering in worldCupAlbum.ts
1. `00` — Cover (portada)
2. `FWX 1–8` — Special (Copas y Mascotas)
3. `MEX 1–20`, `RSA 1–20`, … (48 teams × 20 stickers each)
4. `FWC 9–19` — Special (Selecciones Campeonas)

### Teams (48 total)
Groups 1–12, four teams per group. Confederations: CONCACAF, CONMEBOL, UEFA, CAF, AFC, OFC.

---

## UI / Styling Conventions

- **Mobile-first**: default styles are mobile, desktop overrides at `@media (min-width: 760px)`, wide at `1040px`
- **Sticker grid**: 4 cols mobile → 5 cols ≥760px → 7 cols ≥1040px
- **Color palette**:
  - Brand black: `#101214`
  - Brand yellow: `#f7d719`
  - Brand green: `#b9e461`
  - Blue (primary action): `#2368c4`
  - Red (danger): `#c51632`
  - Success green: `#18a957`
  - Muted text: `#5a5d63`
  - Background: `#f8f7f1`
- **Border style**: `2px solid #101214` everywhere, box-shadow `N px N px 0 #101214` (neo-brutalist)
- **Font weights**: 900–1000 for emphasis, 700–800 for secondary
- **No MUI icons** — use inline SVG with `strokeWidth="2.5"` (search) or `"3"` (chevrons)
- **Accordions**: `<div role="button" aria-expanded={...}>` (NOT `<button>`), default open on desktop, closed on mobile — use `useState(() => window.matchMedia("(min-width: 760px)").matches)`
- **Sticker status colors**: no_tengo → white bg, tengo → `#fff3cd`, pegado → `#b9e461`
- **Tables** (neo-brutalist pattern):
  - Wrapper: `border: 2px solid #101214`, `border-radius: 8px`, `box-shadow: 4px 4px 0 #101214`, `overflow: hidden`
  - Header row: `background: #101214`, text `#f7d719`, `font-weight: 1000`, `text-transform: uppercase`, `font-size: 11px`, `letter-spacing: 0.04em`
  - Data rows: alternating `#ffffff` / `#f8f7f1`, `border-top: 1px solid #e8e9ea`, padding `8px 12px`
  - Column dividers inside rows: `border-right: 1px solid #e8e9ea` (not 2px — reserve 2px for outer borders)
  - Cell text: `font-weight: 900`, `font-size: 13px`, `color: #101214`
- **Group headers** (e.g. sticker groups, chip groups): `font-size: 10px`, `font-weight: 1000`, `text-transform: uppercase`, `letter-spacing: 0.04em`, `color: #5a5d63`, with a `<hr>` flex-line beside it (`border-top: 2px solid #e8e7e0`)
- **Chip/tag pattern**: `padding: 3px 8px`, `background: #f8f7f1`, `border: 2px solid #101214`, `border-radius: 5px`, `font-size: 12px`, `font-weight: 900`

---

## API Endpoints (relevant)

```
GET    /api/albums/my                               → AlbumResponse | null
GET    /api/albums/:id                              → AlbumResponse
GET    /api/albums/shared/:token                    → AlbumResponse
GET    /api/albums/:id/members                      → MemberResponse[]
GET    /api/albums/:id/roles                        → AlbumRoleResponse[]
PATCH  /api/albums/:id/stickers                     → AlbumResponse  (bulk status)
PATCH  /api/albums/:id/stickers/:code/repeated      → AlbumResponse
POST   /api/albums/:id/member-invites               → void  (admin invite with role)
POST   /api/albums/:id/share                        → InvitationResponse  (viewer share)
PATCH  /api/albums/:id/members/:memberId            → MemberResponse  (role change)
DELETE /api/albums/:id/members/:memberId            → void
```

---

## Running Locally

```bash
# Frontend
cd frontend && npm run dev        # http://localhost:5173

# Backend
cd backend && npm run dev         # requires .env.dev with MONGO_URI, JWT_SECRET, Firebase creds
```
