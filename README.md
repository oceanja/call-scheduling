# Mentoring Call Scheduling System

A full-stack mentoring platform with **role-based access control** (Users, Mentors, Admins), **availability** management, **rule-based mentor recommendations** by call type, and **admin-only booking**—similar in spirit to Cal.com / Acuity Scheduling.

| | |
|---|---|
| **Frontend** | React 18 · Vite 5 · Tailwind CSS · React Router |
| **Backend** | Node.js · Express · Prisma · PostgreSQL |
| **Auth** | JWT (email + password) — no OAuth |

Upstream repositories (starting point):

- [mentorque/availabilitytrackerfrontend](https://github.com/mentorque/availabilitytrackerfrontend)
- [mentorque/availability-trackerbackend](https://github.com/mentorque/availability-trackerbackend)

---

## Table of contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Repository layout](#repository-layout)
4. [Prerequisites](#prerequisites)
5. [Environment variables](#environment-variables)
6. [Local development](#local-development)
7. [Database: Neon vs Docker](#database-neon-vs-docker)
8. [Demo accounts](#demo-accounts)
9. [API overview](#api-overview)
10. [Assignment alignment](#assignment-alignment)
11. [Troubleshooting](#troubleshooting)
12. [Roadmap](#roadmap)

---

## Features

| Role | Capabilities |
|------|----------------|
| **User** | Edit **profile** (tags + description), manage **availability**. **Cannot** book calls. |
| **Mentor** | Manage **availability** only. Mentor **tags/description** are edited by **admin**. **Cannot** book calls. |
| **Admin** | List users & mentors, **recommend mentors** by call type, view **overlap**, **book** calls (optional video link), edit **mentor metadata**. |

**Call types** (admin selects when scheduling):

| Type | Intent |
|------|--------|
| **Resume Revamp** | Prefer mentors aligned with big tech / strong resume profile |
| **Job Market Guidance** | Prefer mentors strong on communication |
| **Mock Interview** | Prefer same “lane” (e.g. tech vs non-tech) and overlapping topics |

**Recommendations** use **tags + descriptions** with a **vectorless**, rule-based scorer (the brief allows this instead of full RAG).

---

## Architecture

```text
┌─────────────────┐     HTTPS / JSON      ┌─────────────────┐
│  React (Vite)   │ ◄──────────────────► │  Express API    │
│  localhost:5173 │   Authorization:     │  JWT middleware │
│                 │   Bearer <token>       │  + RBAC         │
└─────────────────┘                        └────────┬────────┘
                                                  │
                                                  │ Prisma
                                                  ▼
                                         ┌─────────────────┐
                                         │   PostgreSQL    │
                                         │ (Docker / Neon) │
                                         └─────────────────┘
```

---

## Repository layout

```text
call_scheduling/
├── README.md                      ← this file
├── availability-trackerbackend/   ← API + Prisma
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── index.js
│       ├── routes/
│       ├── controllers/
│       ├── middleware/
│       └── scripts/seed.js
└── availability-trackerfrontend/  ← React app
    ├── .env.example
    └── src/
```

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm**
- **PostgreSQL** reachable from your machine — either:
  - **Docker** (recommended for local dev), or
  - **Neon** / any hosted Postgres (see [Database](#database-neon-vs-docker))

---

## Environment variables

### Backend — `availability-trackerbackend/.env`

Copy from `availability-trackerbackend/.env.example` and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Postgres connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs (use a long random value) |
| `JWT_EXPIRES_IN` | No | Default: `7d` in code if omitted |
| `PORT` | No | API port (default **5000** in code) |
| `FRONTEND_URL` | No | CORS origin for the SPA (e.g. `http://localhost:5173`) |
| `NODE_ENV` | No | `development` / `production` |

**Removed** (by design): Google OAuth, `MAIN_SITE_JWT_SECRET`, Supabase client keys, `VITE_SUPABASE_*`.

### Frontend — `availability-trackerfrontend/.env`

Copy from `availability-trackerfrontend/.env.example`:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Base URL of the API **without** trailing slash (e.g. `http://localhost:5000` or `http://localhost:5001`) |

**Must match** the port your API actually listens on. After changing `.env`, restart `npm run dev` for Vite.

---

## Local development

### 1. Start PostgreSQL (Docker example)

```bash
docker run --name callsched-pg \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=appdb \
  -p 5432:5432 \
  -d postgres:16
```

If port **5432** is already in use, map **5433:5432** and use `127.0.0.1:5433` in `DATABASE_URL`.

### 2. Backend

```bash
cd availability-trackerbackend
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, PORT, FRONTEND_URL

npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

You should see: `Server running on port <PORT>`.

### 3. Frontend (second terminal)

```bash
cd availability-trackerfrontend
cp .env.example .env
# Set VITE_API_URL to match your API, e.g. http://localhost:5000

npm install
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**). Sign in with a [demo account](#demo-accounts).

### Production-style commands

| Goal | Command |
|------|---------|
| Regenerate Prisma Client | `npm run db:generate` |
| Apply migrations | `npm run db:migrate` or `npx prisma migrate deploy` |
| Prisma Studio (DB GUI) | `npm run db:studio` |
| Frontend production build | `npm run build` (in frontend folder) |

---

## Database: Neon vs Docker

| Option | When to use |
|--------|-------------|
| **Docker Postgres** | Fast local setup; no cloud account required. |
| **Neon** (or Supabase Postgres) | Matches the assignment wording; use the connection string from the provider dashboard. |

**Note:** Some networks block outbound connections to cloud DBs or have IPv6 quirks. If `prisma migrate` fails with **P1001**, try the **pooler** vs **direct** URL in the Neon UI, another network (e.g. hotspot), or stick to **Docker** locally.

---

## Demo accounts

Created by `npm run db:seed` in the backend.

| Role | Email | Password |
|------|--------|----------|
| **Admin** | `admin@example.com` | `admin123` |
| **Users** (×10) | `user1@example.com` … `user10@example.com` | `password123` |
| **Mentors** (×5) | `mentor1@example.com` … `mentor5@example.com` | `password123` |

---

## API overview

Base URL: `{VITE_API_URL}` (e.g. `http://localhost:5000`).

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| `GET` | `/health` | No | Liveness check |
| `POST` | `/api/auth/login` | No | `{ email, password }` → `{ user, token }` |
| `GET` | `/api/auth/me` | Yes | Current user |
| `PATCH` | `/api/auth/profile` | Yes | **USER** only — tags, description |
| `GET` | `/api/availability/weekly` | Yes | Weekly availability |
| `POST` | `/api/availability/batch` | Yes | Save availability slots |
| `GET` | `/api/meetings` | Yes | List meetings |
| `DELETE` | `/api/meetings/:id` | Admin | Delete meeting |
| `GET` | `/api/admin/users` | Admin | List users + profiles |
| `GET` | `/api/admin/mentors` | Admin | List mentors |
| `PATCH` | `/api/admin/mentors/:mentorId` | Admin | Mentor tags + description |
| `GET` | `/api/admin/recommendations` | Admin | `?userId=&callType=` |
| `POST` | `/api/admin/meetings` | Admin | Schedule (call type, mentee, mentor, times, optional `meetLink`) |

**Call type** values: `RESUME_REVAMP`, `JOB_MARKET_GUIDANCE`, `MOCK_INTERVIEW`.

---

## Assignment alignment

| Requirement | Implementation |
|-------------|------------------|
| RBAC (User / Mentor / Admin) | Routes + middleware |
| JWT login, no OAuth | `/api/auth/login` |
| No public signup | Seed script only |
| 10 users, 5 mentors, 1 admin + tags/descriptions | `src/scripts/seed.js` |
| Postgres | Prisma + `DATABASE_URL` |
| Admin: recommendations, overlap, booking | Admin routes + dashboard |
| Three call types | Enum + scheduling + recommendation logic |
| Vectorless / optional RAG | Rule-based scorer + tag/description overlap |

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| **`EADDRINUSE` on port 5000** | macOS AirPlay often uses 5000. Set `PORT=5001` in backend `.env` and `VITE_API_URL=http://localhost:5001` in frontend `.env`, restart both. |
| **`vite: command not found`** | Run `npm install` in `availability-trackerfrontend`. |
| **`DATABASE_URL` not found** | `.env` must live in **`availability-trackerbackend/`** next to `package.json`. |
| **Prisma P1001** (cannot reach DB) | Confirm DB is running (Docker), URL is correct; try Neon pooler vs direct URL; try another network. |
| **401 after login** | `VITE_API_URL` must match API origin and port; restart Vite after editing `.env`. |

---

## Roadmap

Planned follow-ups (not blocking core functionality):

- **UI polish** — Cal.com-style clarity, spacing, empty states, scheduling copy.
- **Deployment** — host API + SPA (e.g. Render, Railway, Fly.io + Vercel/Netlify); point `DATABASE_URL` at Neon or managed Postgres; set `FRONTEND_URL` and `VITE_API_URL` to production URLs.

---

## License

This project is built for an evaluation / assignment context. Refer to upstream Mentorque repositories for original licensing.
