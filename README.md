<div align="center">

# 🗓️ Mentoring Call Scheduling System

**Role-based mentoring platform** — availability, smart mentor matching, and admin-led booking  
*Inspired by Cal.com & Acuity Scheduling*

[![Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Stack](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)](https://expressjs.com/)
[![Stack](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Auth](https://img.shields.io/badge/Auth-JWT-gold)](https://jwt.io/)

**Repository:** [github.com/oceanja/call-scheduling](https://github.com/oceanja/call-scheduling)

</div>

---

## ✨ Highlights

| | |
|:---:|:---|
| 👥 | **RBAC** — Users, Mentors, Admins with separate dashboards |
| 🔐 | **JWT login** — No OAuth, no Supabase keys, minimal `.env` |
| 🎯 | **3 call types** — Resume Revamp · Job Market Guidance · Mock Interview |
| 🤝 | **Recommendations** — Tags + descriptions + rule-based scoring |
| 📅 | **Admin books** — Users & mentors only add availability |

**Upstream starting points:**  
[availabilitytrackerfrontend](https://github.com/mentorque/availabilitytrackerfrontend) · [availability-trackerbackend](https://github.com/mentorque/availability-trackerbackend)

---

## 📑 Table of contents

| | Section |
|---|---------|
| 🎯 | [Features](#-features-at-a-glance) |
| 🏗️ | [Architecture](#️-architecture) |
| 📁 | [Repository layout](#-repository-layout) |
| 📦 | [Prerequisites](#-prerequisites) |
| 🔑 | [Environment variables](#-environment-variables) |
| 🚀 | [Local development](#-local-development) |
| 🐘 | [Database: Neon vs Docker](#-database-neon-vs-docker) |
| 🎭 | [Demo accounts](#-demo-accounts) |
| 🔌 | [API overview](#-api-overview) |
| ✅ | [Assignment alignment](#-assignment-alignment) |
| 🛠️ | [Troubleshooting](#️-troubleshooting) |
| 🗺️ | [Roadmap](#️-roadmap) |

---

## 🎯 Features at a glance

### Roles

| Role | What they do | 🚫 |
|------|----------------|-----|
| 👤 **User** | Profile (tags + description) · **Availability** | Cannot book calls |
| 🧑‍🏫 **Mentor** | **Availability** only (metadata by admin) | Cannot book calls |
| 🛠️ **Admin** | Recommendations · overlap · **book calls** · edit mentor profiles | Full control |

### Call types *(admin picks when scheduling)*

| Type | 💡 Intent |
|------|-----------|
| 📄 **Resume Revamp** | Lean toward big-tech / strong resume fit |
| 💬 **Job Market Guidance** | Lean toward communication strength |
| 🎤 **Mock Interview** | Same domain / lane + overlapping topics |

> 💭 **Matching:** Uses **tags + descriptions** with a **vectorless** rule-based scorer (assignment allows this instead of full RAG).

---

## 🏗️ Architecture

```text
┌──────────────────┐     HTTPS / JSON      ┌──────────────────┐
│  ⚛️ React (Vite)  │ ◄──────────────────► │  🟢 Express API   │
│  :5173           │   Authorization:      │  JWT + RBAC       │
│                  │   Bearer <token>      │                   │
└──────────────────┘                       └─────────┬─────────┘
                                                    │
                                                    │ Prisma ORM
                                                    ▼
                                          ┌──────────────────┐
                                          │  🐘 PostgreSQL   │
                                          │  Docker / Neon   │
                                          └──────────────────┘
```

---

## 📁 Repository layout

```text
call_scheduling/
├── 📄 README.md
├── 🖥️ availability-trackerbackend/     ← API + Prisma
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── index.js
│       ├── routes/ · controllers/
│       ├── middleware/
│       └── scripts/seed.js
└── 🌐 availability-trackerfrontend/       ← React SPA
    ├── .env.example
    └── src/
```

---

## 📦 Prerequisites

- ✅ **Node.js** 18+ (LTS recommended)
- ✅ **npm**
- ✅ **PostgreSQL** — Docker *(easy)* or Neon / hosted URL

---

## 🔑 Environment variables

### Backend → `availability-trackerbackend/.env`

Copy from `.env.example` and fill in:

| Variable | Required | 📝 |
|----------|:--------:|-----|
| `DATABASE_URL` | ✅ | Postgres connection string |
| `JWT_SECRET` | ✅ | Long random secret for JWT signing |
| `JWT_EXPIRES_IN` | ⬜ | Default `7d` in code |
| `PORT` | ⬜ | Default **5000** |
| `FRONTEND_URL` | ⬜ | CORS, e.g. `http://localhost:5173` |
| `NODE_ENV` | ⬜ | `development` / `production` |

🗑️ **Removed on purpose:** Google OAuth, `MAIN_SITE_JWT_SECRET`, Supabase client env vars.

### Frontend → `availability-trackerfrontend/.env`

| Variable | Required | 📝 |
|----------|:--------:|-----|
| `VITE_API_URL` | ✅ | API base **without** trailing slash, e.g. `http://localhost:5000` |

⚠️ **Must match** the real API port. Restart Vite after any change.

---

## 🚀 Local development

### 1️⃣ PostgreSQL (Docker example)

```bash
docker run --name callsched-pg \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=appdb \
  -p 5432:5432 \
  -d postgres:16
```

> If **5432** is busy → use `-p 5433:5432` and `127.0.0.1:5433` in `DATABASE_URL`.

### 2️⃣ Backend

```bash
cd availability-trackerbackend
cp .env.example .env
# Edit .env → DATABASE_URL, JWT_SECRET, PORT, FRONTEND_URL

npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

✅ Look for: `Server running on port …`

### 3️⃣ Frontend *(new terminal)*

```bash
cd availability-trackerfrontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000   # same port as API

npm install
npm run dev
```

🌐 Open **http://localhost:5173** → sign in with [demo accounts](#-demo-accounts).

### 🧰 Handy commands

| Goal | Command |
|------|---------|
| Prisma Client | `npm run db:generate` *(backend)* |
| Migrations | `npm run db:migrate` or `npx prisma migrate deploy` |
| DB GUI | `npm run db:studio` |
| Production build | `npm run build` *(frontend)* |

---

## 🐘 Database: Neon vs Docker

| Option | Best for |
|--------|----------|
| 🐳 **Docker** | Quick local dev, no cloud signup |
| ☁️ **Neon** | Matches assignment wording; use dashboard connection string |

> **P1001** (can’t reach DB)? Try pooler vs **direct** URL in Neon, another network, or stay on **Docker** locally.

---

## 🎭 Demo accounts

Run **`npm run db:seed`** in the backend first.

| Role | Email | Password |
|------|-------|----------|
| 🛠️ Admin | `admin@example.com` | `admin123` |
| 👤 Users ×10 | `user1@example.com` … `user10@example.com` | `password123` |
| 🧑‍🏫 Mentors ×5 | `mentor1@example.com` … `mentor5@example.com` | `password123` |

---

## 🔌 API overview

**Base:** `{VITE_API_URL}` (e.g. `http://localhost:5000`)

| Method | Path | Auth | Notes |
|:------:|------|:----:|-------|
| GET | `/health` | — | Health check |
| POST | `/api/auth/login` | — | `{ email, password }` → token |
| GET | `/api/auth/me` | ✅ | Current user |
| PATCH | `/api/auth/profile` | User | Tags + description |
| GET | `/api/availability/weekly` | ✅ | Weekly grid |
| POST | `/api/availability/batch` | ✅ | Save slots |
| GET | `/api/meetings` | ✅ | List meetings |
| DELETE | `/api/meetings/:id` | Admin | Remove meeting |
| GET | `/api/admin/users` | Admin | Users + profiles |
| GET | `/api/admin/mentors` | Admin | Mentors |
| PATCH | `/api/admin/mentors/:id` | Admin | Mentor metadata |
| GET | `/api/admin/recommendations` | Admin | `?userId=&callType=` |
| POST | `/api/admin/meetings` | Admin | Schedule call |

**`callType` values:** `RESUME_REVAMP` · `JOB_MARKET_GUIDANCE` · `MOCK_INTERVIEW`

---

## ✅ Assignment alignment

| Requirement | ✅ |
|-------------|---|
| RBAC (User / Mentor / Admin) | Middleware + routes |
| JWT, no OAuth | `/api/auth/login` |
| No public signup | Seed only |
| 10 + 5 + 1 with tags/descriptions | `src/scripts/seed.js` |
| Postgres | Prisma |
| Admin: recommendations, overlap, booking | Implemented |
| 3 call types | Enum + UI + API |
| Vectorless / optional RAG | Rule-based matcher |

---

## 🛠️ Troubleshooting

| Symptom | 💡 Fix |
|---------|--------|
| `EADDRINUSE` :5000 | macOS AirPlay uses 5000 → set `PORT=5001` + matching `VITE_API_URL` |
| `vite: command not found` | `npm install` in **frontend** folder |
| `DATABASE_URL` not found | `.env` must sit in **backend** folder next to `package.json` |
| Prisma **P1001** | DB running? Correct URL? Try Neon direct vs pooler or Docker |
| **401** after login | `VITE_API_URL` port must match API; restart Vite |

---

## 🗺️ Roadmap

- 🎨 **UI polish** — spacing, empty states, scheduling flow clarity  
- ☁️ **Deploy** — API + SPA; production `DATABASE_URL`, `FRONTEND_URL`, `VITE_API_URL`

---

## 📜 License

Built for an evaluation / assignment context. See upstream [Mentorque](https://github.com/mentorque) repos for original licensing.

---

<div align="center">

**Made with** ☕ **·** [Report an issue](https://github.com/oceanja/call-scheduling/issues)

</div>
