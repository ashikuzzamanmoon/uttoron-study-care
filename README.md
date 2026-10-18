# 🎓 Uttoron Study Care (উত্তরণ স্টাডি কেয়ার)

> **All-in-One Coaching Management System & Smart SMS Campaign Engine**  
> A high-performance, full-stack enterprise coaching center management platform designed to streamline student admissions, faculty records, batch routine scheduling, attendance tracking with automated SMS, exams & merit processing, fee collection, expense accounting, PDF printing, Excel data import/export, and multi-channel SMS marketing campaigns.

---

## 🏛️ Architecture Overview (Monorepo)

The repository is structured as a cohesive, decoupled monorepo:

```
uttoron-study-care/
├── backend/            # NestJS 10 + Prisma ORM 6 + PostgreSQL REST API
│   ├── prisma/         # Prisma schema, migrations & seed scripts
│   ├── src/            # 16 modular feature services, controllers, guards, and DTOs
│   ├── Dockerfile      # Production multi-stage Docker build
│   └── .env.example    # Environment variable configuration template
├── frontend/           # Next.js 16 (Turbopack, App Router) + Tailwind CSS v4
│   ├── public/         # Static assets and logo branding
│   ├── src/            # 35 App routes, dashboard views, contexts, and UI primitives
│   ├── Dockerfile      # Production multi-stage Docker build
│   └── .env.example    # Frontend environment variable configuration template
├── docker-compose.yml  # One-click Docker container orchestration (Postgres + Backend + Frontend)
├── PROJECT_BLUEPRINT.md # Master architectural blueprint & execution specifications
└── README.md           # Project documentation and developer quickstart guide
```

---

## 🚀 Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js](https://nextjs.org/) 16 (App Router) | High-speed React framework with Partial Prerendering, SSR & Turbopack |
| **Styling & Design** | [Tailwind CSS](https://tailwindcss.com/) v4 | Custom design system with glassmorphism, responsive dashboards & CSS variables |
| **Icons & Media** | [React Icons](https://react-icons.github.io/react-icons/) | Feather Icons, Lucide & FontAwesome iconography |
| **Backend Framework** | [NestJS](https://nestjs.com/) 10 | Enterprise-grade, scalable TypeScript Node.js backend |
| **ORM** | [Prisma](https://www.prisma.io/) ORM 6 | Type-safe database queries, relation handling, and automated migrations |
| **Database** | [PostgreSQL](https://www.postgresql.org/) 16+ | Robust relational database with ACID guarantees |
| **Authentication** | Passport JWT | Access tokens + refresh token rotation with role-based guards (Super Admin, Admin, Teacher, Staff) |
| **API Documentation** | OpenAPI / Swagger UI | Interactive API playground at `/api/docs` with Bearer JWT testing |
| **SMS Gateway** | Greenweb BD / Custom API | Automated transactional SMS (Attendance/Results/Receipts) & bulk CSV/Excel campaigns |
| **Containerization** | Docker & Docker Compose | Multi-stage production container builds with Alpine Linux |

---

## ⚡ Quick Start (Two Ways to Run)

### Method 1: Using Docker Compose (Recommended for Production / Evaluation)

Ensure Docker and Docker Compose are installed, then run:

```bash
# Clone the repository
git clone https://github.com/ashikuzzamanmoon/uttoron-study-care.git
cd uttoron-study-care

# Launch PostgreSQL, Backend API, and Next.js Frontend
docker compose up -d --build
```

- **Frontend Web App:** [http://localhost:3000](http://localhost:3000)
- **Backend REST API:** [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Swagger API Docs:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

### Method 2: Local Development Setup

#### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **PostgreSQL**: Running locally or via cloud (Neon, Supabase, etc.)

#### 1. Backend Setup (`/backend`)

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secret

# Run database migrations and seed administrative data
npx prisma migrate dev --name init
npx prisma db seed

# Start development server (runs on http://localhost:5000)
npm run start:dev
```

#### 2. Frontend Setup (`/frontend`)

```bash
cd ../frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Start Next.js development server (runs on http://localhost:3000)
npm run dev
```

---

## 🔑 Default Administrative Credentials

The database seeder automatically initializes the master super-admin account:

- **Username / Identifier:** `admin`
- **Password:** `admin123`
- **Role:** `SUPER_ADMIN`

*(Note: Change this password immediately after the first login from the Topbar profile menu).*

---

## 🧩 Core Modules & Features

1. **👥 Student Information System (SIS)**:
   - Comprehensive profile management: English & Bengali names, photo, guardian contacts, blood group, school tracking.
   - Sequential unique Student ID generator: `USC-YYYY-XXXX`.
   - Excel Bulk Import with interactive client-side error validator, sample template download, and batch auto-assignment.
   - Excel Directory Export with one click.

2. **👨‍🏫 Teacher & Faculty Management**:
   - Faculty profiles, subject assignments, salary structures, contact directories, and active schedule overviews.

3. **📅 Batch & Dynamic Routine Engine**:
   - Multi-shift batch coordination, routine grid views, and real-time conflict detection (teacher, room, or time overlap).

4. **📋 Smart Attendance Tracker**:
   - Daily batch attendance marking with quick "Mark All Present" toggle.
   - Monthly calendar heatmaps, attendance percentages, and monthly register sheet printing.
   - Instant auto-SMS triggers to guardians of absent students.

5. **📊 Exams, Spreadsheet Marks Entry & Results**:
   - Exam scheduling and rapid keyboard-friendly spreadsheet marks entry (Enter/Tab auto-advance).
   - Live letter grading & GPA computation.
   - Batch merit list generation with tie-breaking rank calculations.
   - One-click bulk result SMS dispatch to parents.
   - Merit list Excel export.

6. **💳 Accounts & Fee Collection**:
   - Monthly tuition fee tracking, automated receipt numbering, due alerts, and expense management.
   - Dual-copy printable money receipts (Office copy + Student copy with cut line).
   - Financial summaries, profit margin audit, and Excel export.

7. **📲 Smart SMS Campaign Engine**:
   - Targeted promotional SMS campaigns with Excel contact list upload.
   - Sample recipient template download.
   - Character counter with Bangla/English SMS part calculation.
   - Batch announcements, custom templates with variable tags (`{{studentName}}`, `{{batch}}`), and live SMS history logs.

8. **🖨️ Print & PDF Center (`/print`)**:
   - **Student ID Card**: PVC card layout with photo, student roll, blood group, and barcode simulation (4 per A4 page).
   - **Money Receipt**: Dual-copy formatted receipt with transaction IDs and itemized breakdown.
   - **Result Card / Progress Report**: Subject marks, GPA, Letter grade, Rank, remarks, and signatures.
   - **Attendance Register Sheet**: 1–31 days matrix register sheet.
   - **Class Routine**: Weekly schedule layout ready for print.

9. **🔍 Advanced Search & Spotlight (`Ctrl+K`)**:
   - Global search modal accessible anywhere via keyboard shortcut `Ctrl+K`.
   - Collapsible advanced filter panel with URL search parameter synchronization.

10. **🌓 Dark Mode & Responsive Layout**:
    - One-click Sun/Moon toggle in Topbar with smooth transitions.
    - Automatic system preference detection (`prefers-color-scheme: dark`) and `localStorage` persistence.
    - Fully responsive across desktop, tablet (768px), and mobile (480px) with sliding drawer sidebar.

---

## 🗺️ Project Execution Progress (100% Complete)

| Phase | Description | Steps | Status |
| :---: | :--- | :---: | :---: |
| **Phase 1** | Project Setup, Database Schema, Auth & UI Component Library | Steps 1–10 | ✅ 100% Completed |
| **Phase 2** | Core Entities (Subjects, Students, Teachers, Batches, Routine) | Steps 11–18 | ✅ 100% Completed |
| **Phase 3** | Daily Attendance Tracking, Spreadsheet Marks Entry & Results | Steps 19–22 | ✅ 100% Completed |
| **Phase 4** | Accounts, Fee Collection, Expense Management & Financial Reports | Steps 23–24 | ✅ 100% Completed |
| **Phase 5** | SMS Marketing Engine, Campaign Hub & SMS Templates | Steps 25–26 | ✅ 100% Completed |
| **Phase 6** | Dashboard, Reports Hub, Notice Board & System Settings | Steps 27–30 | ✅ 100% Completed |
| **Phase 7** | Polish, Print/PDF, Excel Import/Export, Dark Mode & Deployment Prep | Steps 31–35 | ✅ 100% Completed |

*All 35 steps detailed in [`PROJECT_BLUEPRINT.md`](./PROJECT_BLUEPRINT.md) have been systematically implemented, validated, and pushed to the `main` branch.*

---

## 📄 License & Proprietary Notice

This project is proprietary software developed exclusively for **Uttoron Study Care (উত্তরণ স্টাডি কেয়ার)**. All rights reserved.
