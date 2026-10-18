# 🎓 Uttoron Study Care (উত্তরণ স্টাডি কেয়ার)

> **All-in-One Coaching Management System & Smart SMS Campaign Engine**  
> A high-performance, full-stack coaching center management platform designed to streamline student admissions, faculty records, batch routine scheduling, attendance tracking, exams & merit processing, fee collection, accounting, and multi-channel SMS marketing campaigns.

---

## 🏛️ Architecture Overview (Monorepo)

The repository is structured as a cohesive decoupled monorepo:

```
uttoron-study-care/
├── backend/            # NestJS 10 + Prisma ORM + PostgreSQL REST API
│   ├── prisma/         # Prisma schema, migrations & seed scripts
│   └── src/            # Modular feature services, controllers, guards, and DTOs
├── frontend/           # Next.js 16 (Turbopack, App Router) + Tailwind CSS v4
│   ├── public/         # Static assets and logo branding
│   └── src/            # App routes, dashboard views, contexts, and UI primitives
├── PROJECT_BLUEPRINT.md # Master architectural blueprint & execution specifications
├── README.md           # Project documentation and developer quickstart guide
└── .gitignore          # Repository root ignore configuration
```

---

## 🚀 Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js](https://nextjs.org/) 16 (App Router) | High-speed React framework with Partial Prerendering & Turbopack |
| **Styling & Design** | [Tailwind CSS](https://tailwindcss.com/) v4 | Custom design system with glassmorphism, responsive dashboards & CSS variables |
| **Icons & Media** | [React Icons](https://react-icons.github.io/react-icons/) | Modern Lucide, Heroicons & FontAwesome iconography |
| **Backend Framework** | [NestJS](https://nestjs.com/) 10 | Enterprise-grade, scalable TypeScript Node.js backend |
| **ORM** | [Prisma](https://www.prisma.io/) ORM 6 | Type-safe database queries and automated migrations |
| **Database** | [PostgreSQL](https://www.postgresql.org/) 16+ | Robust relational database |
| **Authentication** | Passport JWT | Access tokens + refresh token rotation with role-based guards |
| **SMS Integration** | Greenweb BD / Custom Gateway | Automated transactional SMS (Attendance/Results/Receipts) & bulk campaigns |

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** or **pnpm**
- **PostgreSQL**: Running locally or via cloud (Neon, Supabase, etc.)
- **Git**

---

### 1. Clone Repository
```bash
git clone https://github.com/ashikuzzamanmoon/uttoron-study-care.git
cd uttoron-study-care
```

---

### 2. Backend Setup (`/backend`)

1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` with your PostgreSQL database credentials and JWT secret keys.*

3. Run Prisma migrations and seed default administrative data:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

4. Start the backend development server (runs on `http://localhost:5000`):
   ```bash
   npm run start:dev
   ```

---

### 3. Frontend Setup (`/frontend`)

1. Open a new terminal, navigate to the frontend directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   *Default API URL points to `http://localhost:5000/api/v1`.*

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🧩 Key Features & Capabilities

- 👥 **Student Information System (SIS):** Profile photos, guardian details, automated Student ID generation, blood group, school tracking, and batch enrollment history.
- 👨‍🏫 **Teacher & Faculty Management:** Subject assignments, salary structures, contact directories, and active schedule overviews.
- 📅 **Batch & Dynamic Routine Engine:** Multi-shift batch coordination, routine grid views, and conflict detection (teacher, room, or time overlap).
- 📋 **Smart Attendance Tracker:** Daily batch attendance marking with quick "Mark All Present" toggle, monthly calendar heatmaps, attendance percentages, and instant auto-SMS triggers to guardians of absent students.
- 📊 **Exams & Spreadsheet Marks Entry:** Exam scheduling, rapid keyboard-friendly marks entry (Enter/Tab auto-advance), live letter grading & GPA computation.
- 🏆 **Results, Merit Ranking & Official Report Cards:** Automated batch rank calculation with tie handling, one-click bulk result SMS dispatch to parents, and printable official student result cards.
- 💳 **Accounts & Fee Collection:** Monthly tuition fee tracking, automated receipt numbering, due reports, expense logs, and financial summaries *(Phase 4)*.
- 📲 **SMS Marketing & Communication Hub:** Targeted promotional SMS campaigns, batch announcements, customizable SMS templates, and live balance monitoring *(Phase 5)*.

---

## 🗺️ Project Roadmap & Execution Progress

| Phase | Description | Status |
| :---: | :--- | :---: |
| **Phase 1** | Project Setup, Database Schema, Auth & UI Component Library | ✅ Completed |
| **Phase 2** | Core Entities (Subjects, Students, Teachers, Batches, Class Routine) | ✅ Completed |
| **Phase 3** | Daily Attendance Tracking, Spreadsheet Marks Entry & Merit Results | ✅ Completed |
| **Phase 4** | Accounts, Fee Collection, Expense Management & Financial Reports | ⏳ In Progress |
| **Phase 5** | SMS Marketing Engine & Campaign Hub | ⬜ Pending |
| **Phase 6** | Reports, Analytics & Institute Settings | ⬜ Pending |
| **Phase 7** | System Hardening, Testing & Production Deployment | ⬜ Pending |

---

## 📄 License & Proprietary Notice

This project is proprietary software developed exclusively for **Uttoron Study Care (উত্তরণ স্টাডি কেয়ার)**. All rights reserved.
