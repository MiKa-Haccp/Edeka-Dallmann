# Workspace

## Overview

HACCP Management App - a food safety management system for a German supermarket chain with three branches (Leeder, Buching, MOD). Built as a pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React + Vite + Tailwind CSS
- **State management**: Zustand (for market/branch switching)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── haccp-app/          # React + Vite HACCP frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- **tenants** - Companies (multi-tenant)
- **markets** - Branches/locations (Leeder, Buching, MOD) with GPS coordinates (lat/lng), address, geoRadiusKm (default 10km)
- **categories** - HACCP categories (Allgemein, Markt, Metzgerei)
- **sections** - Numbered sections within categories (e.g., 1.1, 2.5, 3.14)
- **form_definitions** - Field definitions (temperature, boolean, text, photo, signature, pin)
- **form_instances** - Monthly containers per market+section
- **form_entries** - Daily data entries with timestamps
- **users** - Users with roles (SUPERADMIN, ADMIN, USER), initials, and PIN
- **training_topics** - Default training topics from EDEKA quality handbook (13 predefined)
- **training_sessions** - Training sessions per market with date, trainer, and notes
- **training_session_topics** - Topics covered in each training session (checkbox tracking)
- **training_attendances** - Employee attendance confirmations via PIN-only (unique per session+user)

## HACCP Categories

1. **HACCP 1 - Allgemein**: Sections 1.1-1.19 (general food safety)
2. **HACCP 2 - Markt**: Sections 2.1-2.13 (market operations, goods reception)
3. **HACCP 3 - Metzgerei**: Sections 3.1-3.21 (butcher department)

## Key Features

- Filial-Umschalter (branch switcher) in header
- Temperature validation (MoPro >7°C warning, Fleisch >2°C warning)
- Photo trigger when condition is "Nicht OK"
- **User Registration** (Section 1.2): Employees register with first name, last name, birth date → system suggests unique 2-3 letter initials → employee sets a 4-digit PIN
- **PIN Verification on HACCP entries**: Before saving any form entry, the user must enter their 4-digit PIN which identifies them automatically (no Kürzel needed). PINs are unique per tenant (enforced by DB constraint).
- **Admin PIN/Kürzel Reset**: Only admins can reset a user's initials and PIN
- **Admin Authentication**: Invite-only admin registration with scrypt password hashing. SUPERADMIN seeded (admin@haccp.de / admin1234). Admin session stored in Zustand with localStorage persistence.
- **Access Control on User Registry**: Non-admins see only Kürzel/Role/Date columns; admins see full names, birth dates, reset actions, and can invite new admins.
- **4-Level Role System**: SUPERADMIN (full access), ADMIN (cross-market), MARKTLEITER (assigned markets only), USER (own entries only)
- **Granular Permissions**: Per-user permission checkboxes (users.view, users.manage, entries.create, entries.view_all, entries.edit, entries.delete, reports.view, reports.export, settings.manage) manageable by SUPERADMINs
- **Market Assignments**: Marktleiter can be assigned to specific markets (Leeder, Buching, MOD)
- **Info Documentation (Section 1.3)**: Info Dokumentation und Ablagefristen — read-only information page showing retention periods for all HACCP-relevant documents, legal references (LMHV, VO (EG) 852/2004, IfSG, HGB/AO)
- **Annual Cleaning Plan (Section 1.5)**: Reinigungsplan Jahr — interactive yearly cleaning schedule with 3 areas and 15 items. Employees confirm each month's cleaning by PIN. Active months are determined by frequency (monatlich=all, vierteljährlich=Jan/Apr/Jul/Okt, halbjährlich=Jan/Jul, jährlich=Jan). Confirmations stored in `cleaning_plan_confirmations` table. Admins can delete confirmations.
- **Training Records (Section 1.4)**: Schulungsnachweise page — Admins/Marktleiter create training sessions, select topics from 13 EDEKA-standard topics (IfSG, Hygiene, Bio, Arzneimittel, etc.), assign a Schulungsleiter. Employees confirm attendance via PIN-only.
- **Auto-Logout**: Admin sessions automatically expire after 5 minutes of inactivity (useAutoLogout hook)
- **Auto-Return**: After 60 seconds of inactivity on any non-admin page, app navigates back to dashboard (useBookingAutoReturn hook) — prevents employee accounts from staying open
- **Device Whitelisting**: App shows full-screen lock on first access. Master password required (`DEVICE_MASTER_PASSWORD` env var, default `Dallmann2025!`). Authorization persisted in localStorage. Backend: `POST /api/device/verify`
- **GPS Geofencing**: On MarktwahlScreen, GPS is requested automatically. Each market has lat/lng/geoRadiusKm (default 10km). Nearest market within radius is auto-detected.
- **Role-based GPS Lock**: MARKTLEITER and users with no admin session are GPS-locked (cannot manually select a different market). ADMIN/SUPERADMIN/BEREICHSLEITUNG can override GPS and select manually.
- **GPS Status Badge**: Header shows "GPS" or "manuell" badge next to selected market. GPS-locked users see static market name with lock icon (no dropdown).
- Monthly form instances with daily entries
- Sidebar section 1.1 → Responsibilities page, section 1.2 → User Registry page, section 1.3 → Info Documentation page, section 1.4 → Training Records page

## Custom Pages

- `/responsibilities` — Section 1.1: Verantwortlichkeiten (market info, department responsibilities)
- `/user-registry` — Section 1.2: Kürzelliste (user registration form + registered user list with admin reset + admin invite section)
- `/info-documentation` — Section 1.3: Info Dokumentation und Ablagefristen (read-only info page with retention periods)
- `/training-records` — Section 1.4: Schulungsnachweise (training protocols with topic checklists, attendance via PIN-only)
- `/annual-cleaning-plan` — Section 1.5: Reinigungsplan Jahr (interactive yearly cleaning plan, PIN confirmation per month)
- `/betriebsbegehung` — Section 1.6: Betriebsbegehung (Eigenkontroll-Prüfliste, 13 Bereiche, 111 Prüfpunkte, Quartal/Jahr Navigation, OK/Mangel/N/A Bewertung, Aktionsplan bei Mängeln, gespeichert in `betriebsbegehung` DB-Tabelle)
- `/hinweisschild-gesperrte-ware` — Section 1.7: Hinweisschild gesperrte Ware
- `/produktfehlermeldung` — Section 1.8: Produktfehlermeldung (Formblatt mit Fotos, digitale Unterschriften Marktleiter + Kunde, Auto-Entwurf, PDF-Druck via Portal)
- `/probeentnahme` — Section 1.9: Probeentnahme (Probenahmebogen 3.22-1, Probenübergabeprotokoll 3.22-2 mit Signaturen, Foto-Upload Behördendokument, Auto-Entwurf)
- `/besprechungsprotokoll` — Section 1.10: Besprechungsprotokoll (EDEKA Formblatt 2.5; Marktleiter-Unterschrift digital; Teilnehmer bestätigen Anwesenheit per persönlichem PIN; gespeichert in `besprechungsprotokoll` + `besprechung_teilnehmer` DB-Tabellen)
- `/admin/login` — Admin login page (email + password)
- `/admin/register` — Admin registration via invitation token
- `/admin/users` — Benutzerverwaltung: Role management, permission checkboxes, market assignments (SUPERADMIN only)

## Role Hierarchy

| Role | Access | Example |
|------|--------|---------|
| SUPERADMIN | All functions, all markets, system settings | Michael Dallmann, Kai Martin |
| ADMIN | All markets, user management, reports | Sonja Wörishofer, Marina Kienle |
| MARKTLEITER | Assigned markets only, team entries, checklists | Marktleiter, Stellvertretung |
| USER | Own HACCP entries only (Kürzel + PIN) | All other employees |

## Database Schema (Permissions)

- **user_permissions** — Per-user permission flags (permissionType, resourceType, resourceId, granted)
- **user_market_assignments** — Links Marktleiter to specific markets

## API Endpoints

All endpoints are prefixed with `/api`:

- `GET /tenants` - List tenants
- `GET /markets` - List markets (optional tenantId filter)
- `GET /categories` - List HACCP categories
- `GET /categories/:categoryId/sections` - List sections for a category
- `GET /sections/:sectionId/form-definitions` - List form definitions
- `GET /form-instances` - List form instances (marketId required)
- `POST /form-instances` - Create form instance
- `GET /form-instances/:instanceId/entries` - List entries
- `POST /form-instances/:instanceId/entries` - Create entry
- `GET /users` - List users
- `POST /users/register` - Register new user with initials + PIN
- `POST /users/suggest-initials` - Suggest unique initials for a name
- `POST /users/verify-pin` - Verify user initials + PIN
- `PUT /users/:userId/reset` - Admin reset of initials/PIN
- `POST /admin/invite` - Create admin invitation (requires adminEmail)
- `GET /admin/invite/:token` - Validate invitation token
- `POST /admin/register` - Register as admin via invitation
- `POST /admin/login` - Admin login (email + password)
- `GET /admin/list-invitations` - List invitations for tenant
- `GET /permissions/areas` - List all permission areas, roles, and defaults
- `GET /permissions/user/:userId` - Get user's permissions and market assignments
- `PUT /permissions/user/:userId` - Update user's permissions and market assignments
- `PUT /permissions/user/:userId/role` - Change user's role (sets default permissions)
- `POST /seed` - Seed initial data

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with routes for HACCP management.

### `artifacts/haccp-app` (`@workspace/haccp-app`)

React + Vite frontend with Tailwind CSS. Features sidebar navigation with HACCP categories, header with branch switcher, and dashboard overview.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Contains schema for all HACCP entities.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec and Orval codegen config.

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client.

Production migrations are handled by Replit when publishing. In development, use `pnpm --filter @workspace/db run push`.
