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
- **markets** - Branches/locations (Leeder, Buching, MOD)
- **categories** - HACCP categories (Allgemein, Markt, Metzgerei)
- **sections** - Numbered sections within categories (e.g., 1.1, 2.5, 3.14)
- **form_definitions** - Field definitions (temperature, boolean, text, photo, signature, pin)
- **form_instances** - Monthly containers per market+section
- **form_entries** - Daily data entries with timestamps
- **users** - Users with roles (SUPERADMIN, ADMIN, USER), initials, and PIN

## HACCP Categories

1. **HACCP 1 - Allgemein**: Sections 1.1-1.18 (general food safety)
2. **HACCP 2 - Markt**: Sections 2.1-2.13 (market operations, goods reception)
3. **HACCP 3 - Metzgerei**: Sections 3.1-3.21 (butcher department)

## Key Features

- Filial-Umschalter (branch switcher) in header
- Temperature validation (MoPro >7°C warning, Fleisch >2°C warning)
- Photo trigger when condition is "Nicht OK"
- **User Registration** (Section 1.2): Employees register with first name, last name, birth date → system suggests unique 2-3 letter initials → employee sets a 4-digit PIN
- **PIN Verification on HACCP entries**: Before saving any form entry, the user must enter their Kürzel + 4-digit PIN which is verified against the database
- **Admin PIN/Kürzel Reset**: Only admins can reset a user's initials and PIN
- Monthly form instances with daily entries
- Sidebar section 1.1 → Responsibilities page, section 1.2 → User Registry page

## Custom Pages

- `/responsibilities` — Section 1.1: Verantwortlichkeiten (market info, department responsibilities)
- `/user-registry` — Section 1.2: Kürzelliste (user registration form + registered user list with admin reset)

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
