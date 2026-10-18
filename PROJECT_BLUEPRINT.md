# 🎓 উত্তরণ স্টাডি কেয়ার — Coaching Management System
## Master Blueprint & Execution Prompts

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Project Rules & Conventions](#3-project-rules--conventions)
4. [Database Schema (All Models)](#4-database-schema-all-models)
5. [Backend Modules & API Endpoints](#5-backend-modules--api-endpoints)
6. [Frontend Pages & Components](#6-frontend-pages--components)
7. [SMS Engine Design](#7-sms-engine-design)
8. [Role-Based Access Control (RBAC)](#8-role-based-access-control-rbac)
9. [Step-by-Step Execution Prompts](#9-step-by-step-execution-prompts)

---

## 1. Project Overview

**Project Name:** উত্তরণ স্টাডি কেয়ার (Uttoron Study Care)
**Type:** Coaching Management System + SMS Marketing Hub
**Target Users:**
- **Super Admin:** সফটওয়্যারের সকল কিছু নিয়ন্ত্রণ করবে
- **Admin:** কোচিংয়ের দৈনন্দিন পরিচালনা
- **Teacher:** নিজের ক্লাস, হাজিরা, মার্কস এন্ট্রি
- **Student/Guardian:** রেজাল্ট দেখা, নোটিশ পাওয়া (ভবিষ্যৎ ফেজ)

**Core Features:**
1. ছাত্র-ছাত্রী ম্যানেজমেন্ট (Student Management)
2. শিক্ষক ম্যানেজমেন্ট (Teacher Management)
3. ব্যাচ ও ক্লাস শিডিউল (Batch & Routine)
4. হাজিরা ব্যবস্থাপনা (Attendance System)
5. পরীক্ষা ও রেজাল্ট (Exam & Result Management)
6. হিসাব-নিকাশ (Accounts & Finance)
7. এসএমএস ইঞ্জিন (SMS Hub — Transactional + Campaign)
8. ড্যাশবোর্ড ও রিপোর্ট (Dashboard & Reports)
9. সেটিংস (Institute Settings, SMS Gateway Config)

---

## 2. Tech Stack & Architecture

### Architecture: Decoupled (Separate Frontend + Backend)

```
┌─────────────────┐        REST API        ┌──────────────────┐
│                 │  ◄──────────────────►   │                  │
│   Frontend      │      (JSON, JWT)        │   Backend        │
│   Next.js       │                         │   NestJS         │
│   Port: 3000    │                         │   Port: 5000     │
│                 │                         │                  │
└─────────────────┘                         └────────┬─────────┘
                                                     │
                                                     │ Prisma ORM
                                                     │
                                            ┌────────▼─────────┐
                                            │                  │
                                            │   PostgreSQL     │
                                            │   Database       │
                                            │                  │
                                            └──────────────────┘
```

### Technology Details:

| Layer | Technology | Version |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) | Latest (15+) |
| **Frontend Styling** | Tailwind CSS (Utility-first) | Latest (v4) |
| **Frontend State** | React Context + SWR/TanStack Query | Latest |
| **Backend** | NestJS | Latest (10+) |
| **ORM** | Prisma | Latest (6+) |
| **Database** | PostgreSQL | 16+ |
| **Authentication** | JWT (Access + Refresh Tokens) | - |
| **API Docs** | Swagger (OpenAPI via @nestjs/swagger) | - |
| **SMS Queue** | BullMQ + Redis (Optional, Phase 2) | - |
| **Validation** | class-validator + class-transformer (Backend) | - |
| **File Upload** | Multer (NestJS built-in) | - |
| **PDF Generation** | puppeteer / pdfkit (for receipts, result cards) | - |

---

## 3. Project Rules & Conventions

### 3.1 Folder Structure

```
uttoron-study-care/
│
├── backend/                          # NestJS Application
│   ├── prisma/
│   │   ├── schema.prisma             # Database models
│   │   ├── seed.ts                   # Seed data (default admin, subjects, etc.)
│   │   └── migrations/              # Auto-generated migrations
│   ├── src/
│   │   ├── main.ts                   # App bootstrap
│   │   ├── app.module.ts             # Root module
│   │   ├── common/                   # Shared utilities
│   │   │   ├── decorators/           # Custom decorators (@CurrentUser, @Roles)
│   │   │   ├── guards/              # JWT Guard, Roles Guard
│   │   │   ├── interceptors/        # Response transform, Logging
│   │   │   ├── filters/             # Global exception filter
│   │   │   ├── pipes/               # Validation pipe
│   │   │   ├── dto/                 # Common DTOs (pagination, response)
│   │   │   └── utils/               # Helper functions
│   │   ├── config/                   # Configuration (database, jwt, sms)
│   │   └── modules/
│   │       ├── auth/                 # Authentication & Authorization
│   │       │   ├── auth.module.ts
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.service.ts
│   │       │   ├── strategies/       # JWT Strategy, Local Strategy
│   │       │   └── dto/
│   │       ├── users/                # User management (Admin creates users)
│   │       ├── students/             # Student CRUD + Guardian info
│   │       ├── teachers/             # Teacher CRUD + Subject assignment
│   │       ├── subjects/             # Subject master list
│   │       ├── batches/              # Batch/Class group management
│   │       ├── routine/              # Weekly class schedule
│   │       ├── attendance/           # Daily attendance
│   │       ├── exams/                # Exam types, schedules
│   │       ├── marks/                # Mark entry per student per exam
│   │       ├── results/              # Result calculation, merit list
│   │       ├── accounts/             # Fee structure, collection, expenses
│   │       ├── sms/                  # SMS sending, templates, history
│   │       ├── sms-campaigns/        # Bulk/Marketing SMS campaigns
│   │       ├── notices/              # Notice board
│   │       ├── dashboard/            # Dashboard statistics API
│   │       ├── reports/              # Report generation endpoints
│   │       └── settings/             # Institute settings, academic year
│   ├── test/                         # E2E tests
│   ├── .env                          # Environment variables
│   ├── .env.example                  # Example env file
│   ├── nest-cli.json
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                         # Next.js Application
│   ├── public/
│   │   ├── logo.png
│   │   └── favicon.ico
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # Root layout (font, metadata)
│   │   │   ├── page.tsx              # Landing/redirect to login
│   │   │   ├── globals.css           # Global styles & CSS variables
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx    # Login page
│   │   │   │   └── layout.tsx        # Auth layout (centered)
│   │   │   └── (dashboard)/
│   │   │       ├── layout.tsx        # Dashboard layout (sidebar + topbar)
│   │   │       ├── page.tsx          # Dashboard home (stats, charts)
│   │   │       ├── students/
│   │   │       │   ├── page.tsx      # Student list (table + search + filter)
│   │   │       │   ├── add/page.tsx  # Add student form
│   │   │       │   └── [id]/page.tsx # Student detail/edit
│   │   │       ├── teachers/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── add/page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       ├── batches/
│   │   │       │   ├── page.tsx      # Batch list
│   │   │       │   └── [id]/page.tsx # Batch detail + routine
│   │   │       ├── routine/
│   │   │       │   └── page.tsx      # Weekly routine viewer/editor
│   │   │       ├── attendance/
│   │   │       │   ├── page.tsx      # Take attendance (batch select)
│   │   │       │   └── report/page.tsx # Attendance report
│   │   │       ├── exams/
│   │   │       │   ├── page.tsx      # Exam list
│   │   │       │   ├── create/page.tsx
│   │   │       │   └── [id]/
│   │   │       │       ├── page.tsx  # Exam detail
│   │   │       │       └── marks/page.tsx # Mark entry
│   │   │       ├── results/
│   │   │       │   ├── page.tsx      # Result summary
│   │   │       │   └── [id]/page.tsx # Individual result card
│   │   │       ├── accounts/
│   │   │       │   ├── page.tsx      # Fee collection overview
│   │   │       │   ├── collect/page.tsx # Collect fee form
│   │   │       │   ├── dues/page.tsx # Due list
│   │   │       │   ├── expenses/page.tsx # Expense tracker
│   │   │       │   └── reports/page.tsx # Financial reports
│   │   │       ├── sms/
│   │   │       │   ├── page.tsx      # SMS dashboard
│   │   │       │   ├── send/page.tsx # Send SMS (select batch/custom)
│   │   │       │   ├── campaign/page.tsx # Bulk campaign (Excel upload)
│   │   │       │   ├── templates/page.tsx # SMS templates
│   │   │       │   └── history/page.tsx # SMS history/log
│   │   │       ├── notices/
│   │   │       │   └── page.tsx      # Notice board
│   │   │       ├── reports/
│   │   │       │   └── page.tsx      # All reports hub
│   │   │       └── settings/
│   │   │           └── page.tsx      # Institute, SMS gateway, users
│   │   ├── components/
│   │   │   ├── ui/                   # Base UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Tabs.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   ├── Loader.tsx
│   │   │   │   ├── Pagination.tsx
│   │   │   │   ├── DatePicker.tsx
│   │   │   │   ├── FileUpload.tsx
│   │   │   │   └── Chart.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   │   │   ├── Topbar.tsx        # Top navigation bar
│   │   │   │   └── Breadcrumb.tsx
│   │   │   └── shared/
│   │   │       ├── DataTable.tsx     # Advanced data table with sort/filter
│   │   │       ├── StatCard.tsx      # Dashboard stat card
│   │   │       ├── SearchFilter.tsx  # Search + filter bar
│   │   │       └── ConfirmDialog.tsx
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios/fetch instance with JWT
│   │   │   ├── auth.ts              # Auth helpers (login, logout, token)
│   │   │   └── utils.ts             # Utility functions
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useFetch.ts
│   │   │   └── useDebounce.ts
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   └── types/
│   │       └── index.ts             # TypeScript interfaces/types
│   ├── next.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── PROJECT_BLUEPRINT.md              # This file
└── README.md                         # Project documentation
```

### 3.2 Naming Conventions

| Item | Convention | Example |
| :--- | :--- | :--- |
| **Files (Backend)** | kebab-case | `student.controller.ts` |
| **Files (Frontend)** | PascalCase for components, camelCase for utils | `StudentList.tsx`, `useAuth.ts` |
| **Database Tables** | PascalCase (Prisma convention) | `Student`, `FeeCollection` |
| **API Endpoints** | kebab-case, plural nouns | `/api/v1/students`, `/api/v1/fee-collections` |
| **CSS Styling** | Tailwind CSS classes | `className="bg-primary text-white rounded-lg p-4"` |
| **Environment Variables** | UPPER_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET` |

### 3.3 API Response Format (Standard)

```json
// Success Response
{
  "success": true,
  "statusCode": 200,
  "message": "Students retrieved successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}

// Error Response
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "phone", "message": "Phone number is required" }
  ]
}
```

### 3.4 Environment Variables

```env
# Backend (.env)
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/uttoron_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="1d"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=development

# SMS Gateway (Example: Greenweb)
SMS_GATEWAY_URL="http://api.greenweb.com.bd/api.php"
SMS_GATEWAY_API_KEY="your-api-key"
SMS_SENDER_ID="UTTORON"

# Frontend (.env.local)
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
NEXT_PUBLIC_APP_NAME="উত্তরণ স্টাডি কেয়ার"
```

---

## 4. Database Schema (All Models)

### 4.1 User & Auth Models

```prisma
// ========================
// USER & AUTHENTICATION
// ========================

enum UserRole {
  SUPER_ADMIN
  ADMIN
  TEACHER
  STAFF
  STUDENT
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

model User {
  id            String     @id @default(uuid())
  username      String     @unique
  email         String?    @unique
  password      String     // bcrypt hashed
  role          UserRole   @default(STAFF)
  status        UserStatus @default(ACTIVE)
  lastLoginAt   DateTime?
  refreshToken  String?

  // Relations
  teacher       Teacher?
  student       Student?
  createdNotices Notice[]

  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@map("users")
}
```

### 4.2 Student Model

```prisma
// ========================
// STUDENT
// ========================

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum BloodGroup {
  A_POSITIVE
  A_NEGATIVE
  B_POSITIVE
  B_NEGATIVE
  O_POSITIVE
  O_NEGATIVE
  AB_POSITIVE
  AB_NEGATIVE
}

model Student {
  id                  String      @id @default(uuid())
  studentId           String      @unique // Auto-generated: USC-2024-0001
  userId              String?     @unique
  user                User?       @relation(fields: [userId], references: [id])

  // Personal Info
  nameEn              String      // Name in English
  nameBn              String?     // Name in Bangla
  gender              Gender
  dateOfBirth         DateTime?
  bloodGroup          BloodGroup?
  photo               String?     // Photo URL/path
  phone               String?
  email               String?

  // Academic Info
  instituteName       String?     // School/College name
  classLevel          String      // e.g., "Class 9", "Class 10", "HSC 1st Year"
  group               String?     // Science, Commerce, Arts
  boardRollNo         String?

  // Guardian Info
  fatherName          String
  fatherPhone         String?
  motherName          String?
  motherPhone         String?
  guardianName        String?     // If different from parents
  guardianPhone       String      // Primary contact for SMS
  guardianRelation    String?

  // Address
  presentAddress      String?
  permanentAddress    String?

  // Admission
  admissionDate       DateTime    @default(now())
  admissionFee        Float?      @default(0)
  monthlyFee          Float?      @default(0)
  discount            Float?      @default(0) // Percentage or fixed
  discountType        String?     @default("PERCENTAGE") // PERCENTAGE or FIXED

  // Status
  isActive            Boolean     @default(true)

  // Relations
  batchStudents       BatchStudent[]
  attendances         Attendance[]
  marks               Mark[]
  feeCollections      FeeCollection[]
  smsRecipients       SmsRecipient[]

  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  @@map("students")
}
```

### 4.3 Teacher Model

```prisma
// ========================
// TEACHER
// ========================

model Teacher {
  id                String    @id @default(uuid())
  teacherId         String    @unique // Auto-generated: TCH-001
  userId            String?   @unique
  user              User?     @relation(fields: [userId], references: [id])

  // Personal Info
  nameEn            String
  nameBn            String?
  gender            Gender
  dateOfBirth       DateTime?
  photo             String?
  phone             String
  email             String?
  nidNumber         String?   // National ID

  // Professional Info
  designation       String?   // Senior Teacher, Junior Teacher, etc.
  qualification     String?   // M.Sc, B.Sc, etc.
  specialization    String?   // Subject expertise
  joiningDate       DateTime  @default(now())
  monthlySalary     Float?    @default(0)

  // Address
  address           String?

  // Status
  isActive          Boolean   @default(true)

  // Relations
  teacherSubjects   TeacherSubject[]
  batchTeachers     BatchTeacher[]
  routineSlots      RoutineSlot[]
  attendancesTaken  Attendance[]  @relation("AttendanceTakenBy")
  examsCreated      Exam[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@map("teachers")
}
```

### 4.4 Subject Model

```prisma
// ========================
// SUBJECT
// ========================

model Subject {
  id            String    @id @default(uuid())
  name          String    // e.g., "পদার্থবিজ্ঞান", "Physics"
  code          String    @unique // e.g., "PHY", "MATH"
  classLevel    String?   // Associated class level
  group         String?   // Science, Commerce, Arts, or null (common)
  fullMarks     Int       @default(100)
  passMarks     Int       @default(33)
  isActive      Boolean   @default(true)

  // Relations
  teacherSubjects TeacherSubject[]
  batchSubjects   BatchSubject[]
  routineSlots    RoutineSlot[]
  exams           Exam[]
  marks           Mark[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("subjects")
}

model TeacherSubject {
  id          String  @id @default(uuid())
  teacherId   String
  subjectId   String
  teacher     Teacher @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  subject     Subject @relation(fields: [subjectId], references: [id], onDelete: Cascade)

  @@unique([teacherId, subjectId])
  @@map("teacher_subjects")
}
```

### 4.5 Batch Model

```prisma
// ========================
// BATCH (CLASS GROUP)
// ========================

model Batch {
  id            String    @id @default(uuid())
  name          String    // e.g., "Class 10 - Batch A (Science)"
  classLevel    String    // e.g., "Class 10"
  group         String?   // Science, Commerce, Arts
  section       String?   // A, B, C
  year          Int       // Academic year: 2024, 2025
  maxStudents   Int?      @default(40)
  monthlyFee    Float?    @default(0)
  startDate     DateTime?
  endDate       DateTime?
  isActive      Boolean   @default(true)

  // Relations
  batchStudents   BatchStudent[]
  batchTeachers   BatchTeacher[]
  batchSubjects   BatchSubject[]
  routineSlots    RoutineSlot[]
  attendances     Attendance[]
  exams           Exam[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("batches")
}

model BatchStudent {
  id          String    @id @default(uuid())
  batchId     String
  studentId   String
  rollNumber  Int?      // Roll within this batch
  joinedAt    DateTime  @default(now())
  leftAt      DateTime?
  isActive    Boolean   @default(true)

  batch       Batch     @relation(fields: [batchId], references: [id], onDelete: Cascade)
  student     Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([batchId, studentId])
  @@map("batch_students")
}

model BatchTeacher {
  id          String  @id @default(uuid())
  batchId     String
  teacherId   String
  isPrimary   Boolean @default(false) // Primary/Class teacher

  batch       Batch   @relation(fields: [batchId], references: [id], onDelete: Cascade)
  teacher     Teacher @relation(fields: [teacherId], references: [id], onDelete: Cascade)

  @@unique([batchId, teacherId])
  @@map("batch_teachers")
}

model BatchSubject {
  id          String  @id @default(uuid())
  batchId     String
  subjectId   String

  batch       Batch   @relation(fields: [batchId], references: [id], onDelete: Cascade)
  subject     Subject @relation(fields: [subjectId], references: [id], onDelete: Cascade)

  @@unique([batchId, subjectId])
  @@map("batch_subjects")
}
```

### 4.6 Routine (Weekly Schedule) Model

```prisma
// ========================
// ROUTINE (WEEKLY TIMETABLE)
// ========================

enum DayOfWeek {
  SATURDAY
  SUNDAY
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
}

model RoutineSlot {
  id          String    @id @default(uuid())
  batchId     String
  subjectId   String?
  teacherId   String?
  day         DayOfWeek
  startTime   String    // "09:00" (24hr format)
  endTime     String    // "10:00"
  roomNo      String?

  batch       Batch     @relation(fields: [batchId], references: [id], onDelete: Cascade)
  subject     Subject?  @relation(fields: [subjectId], references: [id])
  teacher     Teacher?  @relation(fields: [teacherId], references: [id])

  @@map("routine_slots")
}
```

### 4.7 Attendance Model

```prisma
// ========================
// ATTENDANCE
// ========================

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EXCUSED
}

model Attendance {
  id          String           @id @default(uuid())
  batchId     String
  studentId   String
  date        DateTime         @db.Date
  status      AttendanceStatus @default(PRESENT)
  remarks     String?
  takenById   String?          // Teacher who took attendance

  batch       Batch            @relation(fields: [batchId], references: [id], onDelete: Cascade)
  student     Student          @relation(fields: [studentId], references: [id], onDelete: Cascade)
  takenBy     Teacher?         @relation("AttendanceTakenBy", fields: [takenById], references: [id])

  // Auto SMS sent when absent?
  smsSent     Boolean          @default(false)

  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@unique([batchId, studentId, date])
  @@map("attendances")
}
```

### 4.8 Exam & Marks Model

```prisma
// ========================
// EXAM & MARKS
// ========================

enum ExamType {
  CLASS_TEST
  WEEKLY_TEST
  MONTHLY_EXAM
  QUARTERLY_EXAM
  HALF_YEARLY
  YEARLY_FINAL
  MODEL_TEST
  BOARD_MODEL
}

model Exam {
  id            String    @id @default(uuid())
  name          String    // "January Monthly Exam 2024"
  examType      ExamType
  batchId       String
  subjectId     String
  teacherId     String?   // Exam creator/conductor

  examDate      DateTime  @db.Date
  fullMarks     Int       @default(100)
  passMarks     Int       @default(33)
  duration      Int?      // In minutes
  syllabus      String?   // Exam syllabus description

  isPublished   Boolean   @default(false) // Results published?

  batch         Batch     @relation(fields: [batchId], references: [id], onDelete: Cascade)
  subject       Subject   @relation(fields: [subjectId], references: [id])
  teacher       Teacher?  @relation(fields: [teacherId], references: [id])
  marks         Mark[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("exams")
}

model Mark {
  id            String    @id @default(uuid())
  examId        String
  studentId     String
  subjectId     String
  obtainedMarks Float
  grade         String?   // Auto-calculated: A+, A, B, etc.
  remarks       String?

  exam          Exam      @relation(fields: [examId], references: [id], onDelete: Cascade)
  student       Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  subject       Subject   @relation(fields: [subjectId], references: [id])

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([examId, studentId, subjectId])
  @@map("marks")
}
```

### 4.9 Accounts & Finance Model

```prisma
// ========================
// ACCOUNTS & FINANCE
// ========================

enum PaymentMethod {
  CASH
  BKASH
  NAGAD
  ROCKET
  BANK_TRANSFER
  OTHER
}

enum FeeType {
  ADMISSION_FEE
  MONTHLY_FEE
  EXAM_FEE
  LAB_FEE
  BOOK_FEE
  FINE
  OTHER
}

model FeeCollection {
  id              String        @id @default(uuid())
  studentId       String
  receiptNo       String        @unique // Auto-generated: RCP-2024-0001
  feeType         FeeType       @default(MONTHLY_FEE)
  feeMonth        String?       // "January 2024", "February 2024"
  amount          Float
  discount        Float?        @default(0)
  fine            Float?        @default(0)
  paidAmount      Float
  dueAmount       Float         @default(0)
  paymentMethod   PaymentMethod @default(CASH)
  transactionId   String?       // bKash/Nagad transaction ID
  paymentDate     DateTime      @default(now())
  remarks         String?

  student         Student       @relation(fields: [studentId], references: [id], onDelete: Cascade)

  // SMS receipt sent?
  receiptSmsSent  Boolean       @default(false)

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@map("fee_collections")
}

enum ExpenseCategory {
  SALARY
  RENT
  ELECTRICITY
  INTERNET
  STATIONERY
  FURNITURE
  MARKETING
  SMS_RECHARGE
  MAINTENANCE
  OTHER
}

model Expense {
  id            String          @id @default(uuid())
  voucherNo     String          @unique // Auto-generated: EXP-2024-0001
  category      ExpenseCategory
  description   String
  amount        Float
  paidTo        String?         // Person/entity paid to
  paymentMethod PaymentMethod   @default(CASH)
  expenseDate   DateTime        @default(now())
  remarks       String?

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@map("expenses")
}
```

### 4.10 SMS Models

```prisma
// ========================
// SMS ENGINE
// ========================

enum SmsType {
  TRANSACTIONAL   // Auto SMS (attendance, result, fee)
  CAMPAIGN        // Bulk marketing SMS
  INDIVIDUAL      // Single SMS to a student/guardian
}

enum SmsStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
}

model SmsTemplate {
  id          String  @id @default(uuid())
  name        String  // "Attendance Alert", "Fee Reminder"
  body        String  // Template with placeholders: "Dear {{guardianName}}, {{studentName}} was absent on {{date}}"
  type        SmsType @default(TRANSACTIONAL)
  isActive    Boolean @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("sms_templates")
}

model SmsCampaign {
  id            String    @id @default(uuid())
  name          String    // "Free Physics Class - Nov 2024"
  message       String
  totalRecipients Int     @default(0)
  sentCount     Int       @default(0)
  failedCount   Int       @default(0)
  scheduledAt   DateTime? // If scheduled for later
  sentAt        DateTime?
  status        String    @default("DRAFT") // DRAFT, SENDING, COMPLETED, FAILED

  recipients    SmsRecipient[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("sms_campaigns")
}

model SmsRecipient {
  id            String    @id @default(uuid())
  campaignId    String?
  studentId     String?
  phone         String
  name          String?
  message       String
  status        SmsStatus @default(PENDING)
  gatewayResponse String? // Response from SMS gateway
  sentAt        DateTime?

  campaign      SmsCampaign? @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  student       Student?     @relation(fields: [studentId], references: [id])

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("sms_recipients")
}

model SmsLog {
  id            String    @id @default(uuid())
  phone         String
  message       String
  type          SmsType
  status        SmsStatus @default(PENDING)
  gatewayResponse String?
  cost          Float?    // Cost per SMS if tracked
  sentAt        DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("sms_logs")
}
```

### 4.11 Notice & Settings Models

```prisma
// ========================
// NOTICE BOARD
// ========================

model Notice {
  id          String    @id @default(uuid())
  title       String
  body        String
  priority    String    @default("NORMAL") // LOW, NORMAL, HIGH, URGENT
  isPublished Boolean   @default(true)
  publishedAt DateTime  @default(now())
  expiresAt   DateTime?
  createdById String

  createdBy   User      @relation(fields: [createdById], references: [id])

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("notices")
}

// ========================
// SETTINGS
// ========================

model Setting {
  id          String  @id @default(uuid())
  key         String  @unique // e.g., "institute_name", "sms_gateway_key"
  value       String
  group       String? // "institute", "sms", "academic", "system"
  description String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("settings")
}

// ========================
// ACADEMIC YEAR
// ========================

model AcademicYear {
  id          String    @id @default(uuid())
  name        String    // "2024", "2025"
  startDate   DateTime
  endDate     DateTime
  isCurrent   Boolean   @default(false)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("academic_years")
}
```

---

## 5. Backend Modules & API Endpoints

### 5.1 Auth Module

```
POST   /api/v1/auth/login              # Login (username + password)
POST   /api/v1/auth/refresh            # Refresh access token
POST   /api/v1/auth/logout             # Logout (invalidate refresh token)
GET    /api/v1/auth/profile            # Get current user profile
PUT    /api/v1/auth/change-password    # Change own password
```

### 5.2 Users Module (Admin only)

```
GET    /api/v1/users                   # List all users (paginated)
POST   /api/v1/users                   # Create user
GET    /api/v1/users/:id               # Get user by ID
PUT    /api/v1/users/:id               # Update user
DELETE /api/v1/users/:id               # Soft delete user
PATCH  /api/v1/users/:id/status        # Activate/Deactivate
PATCH  /api/v1/users/:id/reset-password # Reset user password (admin)
```

### 5.3 Students Module

```
GET    /api/v1/students                # List students (paginated, searchable, filterable)
POST   /api/v1/students                # Create student (admission)
GET    /api/v1/students/:id            # Get student detail
PUT    /api/v1/students/:id            # Update student
DELETE /api/v1/students/:id            # Soft delete (deactivate)
GET    /api/v1/students/:id/attendances  # Student's attendance history
GET    /api/v1/students/:id/marks      # Student's all marks/results
GET    /api/v1/students/:id/fees       # Student's fee history
GET    /api/v1/students/export/excel   # Export students to Excel
POST   /api/v1/students/import/excel   # Import students from Excel
```

### 5.4 Teachers Module

```
GET    /api/v1/teachers                # List teachers
POST   /api/v1/teachers                # Create teacher
GET    /api/v1/teachers/:id            # Get teacher detail
PUT    /api/v1/teachers/:id            # Update teacher
DELETE /api/v1/teachers/:id            # Soft delete
GET    /api/v1/teachers/:id/batches    # Teacher's assigned batches
GET    /api/v1/teachers/:id/routine    # Teacher's schedule
```

### 5.5 Subjects Module

```
GET    /api/v1/subjects                # List all subjects
POST   /api/v1/subjects                # Create subject
PUT    /api/v1/subjects/:id            # Update subject
DELETE /api/v1/subjects/:id            # Delete subject
```

### 5.6 Batches Module

```
GET    /api/v1/batches                 # List all batches
POST   /api/v1/batches                 # Create batch
GET    /api/v1/batches/:id             # Get batch detail
PUT    /api/v1/batches/:id             # Update batch
DELETE /api/v1/batches/:id             # Delete batch
POST   /api/v1/batches/:id/students    # Add students to batch
DELETE /api/v1/batches/:id/students/:studentId  # Remove student from batch
POST   /api/v1/batches/:id/teachers    # Assign teachers to batch
POST   /api/v1/batches/:id/subjects    # Add subjects to batch
GET    /api/v1/batches/:id/students    # List students in batch
GET    /api/v1/batches/:id/routine     # Get batch routine
```

### 5.7 Routine Module

```
GET    /api/v1/routine                 # Get all routine slots (filterable by batch, day)
POST   /api/v1/routine                 # Create routine slot
PUT    /api/v1/routine/:id             # Update routine slot
DELETE /api/v1/routine/:id             # Delete routine slot
POST   /api/v1/routine/bulk            # Bulk create/update routine for a batch
GET    /api/v1/routine/batch/:batchId  # Get complete routine for a batch
```

### 5.8 Attendance Module

```
GET    /api/v1/attendance              # List attendance records (filterable)
POST   /api/v1/attendance/batch/:batchId  # Submit attendance for a batch (date + list of student statuses)
GET    /api/v1/attendance/batch/:batchId/date/:date  # Get attendance for batch on specific date
GET    /api/v1/attendance/student/:studentId  # Get student's attendance history
GET    /api/v1/attendance/report       # Attendance summary report (by batch, month)
PUT    /api/v1/attendance/:id          # Update single attendance record
```

### 5.9 Exams Module

```
GET    /api/v1/exams                   # List all exams
POST   /api/v1/exams                   # Create exam
GET    /api/v1/exams/:id               # Get exam detail
PUT    /api/v1/exams/:id               # Update exam
DELETE /api/v1/exams/:id               # Delete exam
PATCH  /api/v1/exams/:id/publish       # Publish/Unpublish results
```

### 5.10 Marks Module

```
GET    /api/v1/marks/exam/:examId      # Get all marks for an exam
POST   /api/v1/marks/exam/:examId      # Bulk submit marks for an exam
PUT    /api/v1/marks/:id               # Update single mark
GET    /api/v1/marks/student/:studentId  # All marks for a student
GET    /api/v1/marks/result/:examId    # Result sheet with merit list
GET    /api/v1/marks/result-card/:studentId/:examId  # Individual result card
```

### 5.11 Accounts Module

```
# Fee Collection
GET    /api/v1/fees                    # List fee collections (filterable)
POST   /api/v1/fees/collect            # Collect fee (create receipt)
GET    /api/v1/fees/:id                # Get fee receipt detail
GET    /api/v1/fees/dues               # List students with due fees
GET    /api/v1/fees/student/:studentId # Fee history for student
GET    /api/v1/fees/receipt/:id/print  # Generate printable receipt

# Expenses
GET    /api/v1/expenses                # List expenses
POST   /api/v1/expenses                # Create expense
PUT    /api/v1/expenses/:id            # Update expense
DELETE /api/v1/expenses/:id            # Delete expense

# Reports
GET    /api/v1/accounts/summary        # Daily/Monthly/Yearly summary (income vs expense)
GET    /api/v1/accounts/collection-report  # Fee collection report
GET    /api/v1/accounts/expense-report  # Expense report
```

### 5.12 SMS Module

```
# Send SMS
POST   /api/v1/sms/send               # Send SMS to individual/group
POST   /api/v1/sms/send-batch/:batchId # Send SMS to entire batch
POST   /api/v1/sms/send-custom        # Send to custom phone numbers

# Templates
GET    /api/v1/sms/templates           # List SMS templates
POST   /api/v1/sms/templates           # Create template
PUT    /api/v1/sms/templates/:id       # Update template
DELETE /api/v1/sms/templates/:id       # Delete template

# Campaigns (Bulk Marketing)
GET    /api/v1/sms/campaigns           # List campaigns
POST   /api/v1/sms/campaigns           # Create campaign
GET    /api/v1/sms/campaigns/:id       # Campaign detail + stats
POST   /api/v1/sms/campaigns/:id/send  # Execute campaign
POST   /api/v1/sms/campaigns/upload    # Upload Excel/CSV contacts

# History & Logs
GET    /api/v1/sms/logs                # SMS sending history
GET    /api/v1/sms/balance             # Check SMS gateway balance
GET    /api/v1/sms/stats               # SMS usage statistics
```

### 5.13 Dashboard Module

```
GET    /api/v1/dashboard/stats         # Quick stats (total students, teachers, income, etc.)
GET    /api/v1/dashboard/income-chart  # Monthly income chart data
GET    /api/v1/dashboard/attendance-chart # Attendance trend chart data
GET    /api/v1/dashboard/recent-activities # Recent activities log
GET    /api/v1/dashboard/upcoming-exams # Upcoming exams
GET    /api/v1/dashboard/due-alerts    # Fee due alerts
```

### 5.14 Settings & Notice Module

```
# Settings
GET    /api/v1/settings                # Get all settings
PUT    /api/v1/settings                # Update settings (bulk)
GET    /api/v1/settings/:key           # Get specific setting
PUT    /api/v1/settings/:key           # Update specific setting

# Notices
GET    /api/v1/notices                 # List notices
POST   /api/v1/notices                 # Create notice
PUT    /api/v1/notices/:id             # Update notice
DELETE /api/v1/notices/:id             # Delete notice

# Academic Year
GET    /api/v1/academic-years          # List academic years
POST   /api/v1/academic-years          # Create academic year
PUT    /api/v1/academic-years/:id      # Update
PATCH  /api/v1/academic-years/:id/current # Set as current year
```

---

## 6. Frontend Pages & Components

### 6.1 Design System

**Color Palette (CSS Variables):**
```css
:root {
  /* Primary - Deep Indigo/Blue */
  --primary-50: #eef2ff;
  --primary-100: #e0e7ff;
  --primary-200: #c7d2fe;
  --primary-300: #a5b4fc;
  --primary-400: #818cf8;
  --primary-500: #6366f1;  /* Main primary */
  --primary-600: #4f46e5;
  --primary-700: #4338ca;
  --primary-800: #3730a3;
  --primary-900: #312e81;

  /* Accent - Emerald Green */
  --accent-50: #ecfdf5;
  --accent-500: #10b981;
  --accent-600: #059669;

  /* Warning - Amber */
  --warning-50: #fffbeb;
  --warning-500: #f59e0b;

  /* Danger - Rose Red */
  --danger-50: #fff1f2;
  --danger-500: #f43f5e;

  /* Neutral - Slate */
  --neutral-50: #f8fafc;
  --neutral-100: #f1f5f9;
  --neutral-200: #e2e8f0;
  --neutral-300: #cbd5e1;
  --neutral-400: #94a3b8;
  --neutral-500: #64748b;
  --neutral-600: #475569;
  --neutral-700: #334155;
  --neutral-800: #1e293b;
  --neutral-900: #0f172a;

  /* Backgrounds */
  --bg-primary: #0f172a;     /* Dark sidebar */
  --bg-secondary: #f8fafc;   /* Light page background */
  --bg-card: #ffffff;

  /* Text */
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --text-inverse: #ffffff;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 350ms ease;

  /* Typography */
  --font-family: 'Inter', 'Noto Sans Bengali', sans-serif;
}
```

**Dark Mode Support:**
```css
[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #334155;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
}
```

### 6.2 Page Descriptions

| Page | Route | Description |
| :--- | :--- | :--- |
| **Login** | `/login` | ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন। গ্লাসমরফিজম ডিজাইন। |
| **Dashboard** | `/` | মোট ছাত্র, শিক্ষক, আজকের আয়, বকেয়া, চার্ট (মাসভিত্তিক আয়, হাজিরার হার), আসন্ন পরীক্ষা, সাম্প্রতিক কার্যক্রম। |
| **Students List** | `/students` | সার্চ, ফিল্টার (ক্লাস, ব্যাচ, স্ট্যাটাস), পেজিনেশন সহ ছাত্র তালিকা। |
| **Add Student** | `/students/add` | ভর্তি ফরম — ব্যক্তিগত, একাডেমিক, অভিভাবক, ব্যাচ নির্বাচন। |
| **Student Detail** | `/students/[id]` | ট্যাব ভিউ: প্রোফাইল, হাজিরা, রেজাল্ট, ফি হিস্ট্রি। |
| **Teachers List** | `/teachers` | শিক্ষক তালিকা। |
| **Add Teacher** | `/teachers/add` | শিক্ষক নিবন্ধন ফরম। |
| **Teacher Detail** | `/teachers/[id]` | প্রোফাইল, অ্যাসাইনড ব্যাচ ও রুটিন। |
| **Batches** | `/batches` | ব্যাচ তালিকা (কার্ড ভিউ বা টেবিল ভিউ)। |
| **Batch Detail** | `/batches/[id]` | ব্যাচের ছাত্র, শিক্ষক, সাবজেক্ট, রুটিন ও পরীক্ষা। |
| **Routine** | `/routine` | ব্যাচ সিলেক্ট করে সাপ্তাহিক রুটিন দেখা ও সম্পাদনা। ক্যালেন্ডার/টাইমটেবিল ভিউ। |
| **Take Attendance** | `/attendance` | ব্যাচ ও তারিখ সিলেক্ট করে ছাত্রদের হাজিরা নেওয়া (Present/Absent টগল)। |
| **Attendance Report** | `/attendance/report` | ব্যাচভিত্তিক ও ছাত্রভিত্তিক হাজিরা রিপোর্ট। |
| **Exams** | `/exams` | পরীক্ষার তালিকা (আসন্ন, চলমান, সম্পন্ন)। |
| **Create Exam** | `/exams/create` | নতুন পরীক্ষা তৈরি ফরম। |
| **Mark Entry** | `/exams/[id]/marks` | পরীক্ষার মার্কস এন্ট্রি (স্প্রেডশিট স্টাইলে)। |
| **Results** | `/results` | রেজাল্ট শিট, মেরিট লিস্ট (প্রিন্টযোগ্য)। |
| **Fee Collection** | `/accounts` | আজকের কালেকশন, মাসিক সামারি। |
| **Collect Fee** | `/accounts/collect` | ছাত্র সিলেক্ট → ফি টাইপ → পরিশোধ → রসিদ জেনারেট। |
| **Due List** | `/accounts/dues` | বকেয়া তালিকা (মাস ও ব্যাচভিত্তিক ফিল্টার)। |
| **Expenses** | `/accounts/expenses` | ব্যয়ের তালিকা ও নতুন ব্যয় যোগ করা। |
| **Financial Reports** | `/accounts/reports` | আয়-ব্যয় রিপোর্ট, মাসিক/বার্ষিক সামারি, চার্ট। |
| **SMS Dashboard** | `/sms` | পাঠানো এসএমএস স্ট্যাটিস্টিকস, ব্যালেন্স, কুইক সেন্ড। |
| **Send SMS** | `/sms/send` | ব্যাচ/কাস্টম নম্বরে এসএমএস পাঠানো। |
| **SMS Campaign** | `/sms/campaign` | এক্সেল আপলোড করে বাল্ক এসএমএস ক্যাম্পেইন। |
| **SMS Templates** | `/sms/templates` | পূর্বনির্ধারিত এসএমএস টেমপ্লেট তৈরি ও সম্পাদনা। |
| **SMS History** | `/sms/history` | এসএমএস লগ ও ডেলিভারি রিপোর্ট। |
| **Notices** | `/notices` | নোটিশ বোর্ড — তৈরি, সম্পাদনা, মুছে ফেলা। |
| **Reports Hub** | `/reports` | সকল রিপোর্ট একসাথে — ছাত্র, হাজিরা, ফি, রেজাল্ট। |
| **Settings** | `/settings` | প্রতিষ্ঠানের তথ্য, একাডেমিক বছর, এসএমএস গেটওয়ে কনফিগারেশন, ইউজার ম্যানেজমেন্ট। |

---

## 7. SMS Engine Design

### 7.1 SMS Types

1. **Transactional (Auto):**
   - হাজিরা অ্যালার্ট: `"উত্তরণ স্টাডি কেয়ার: আপনার সন্তান {{studentName}} আজ ({{date}}) ক্লাসে অনুপস্থিত ছিল।"`
   - রেজাল্ট: `"উত্তরণ স্টাডি কেয়ার: {{studentName}} এর {{examName}} পরীক্ষার ফলাফল — {{subjectName}}: {{marks}}/{{fullMarks}} ({{grade}})"`
   - ফি রসিদ: `"উত্তরণ স্টাডি কেয়ার: {{studentName}} এর {{feeMonth}} এর ফি {{amount}} টাকা গৃহীত হয়েছে। রসিদ নং: {{receiptNo}}"`
   - বকেয়া রিমাইন্ডার: `"উত্তরণ স্টাডি কেয়ার: {{studentName}} এর {{dueMonths}} মাসের ফি {{dueAmount}} টাকা বকেয়া আছে। অনুগ্রহ করে পরিশোধ করুন।"`

2. **Campaign (Bulk Marketing):**
   - ফ্রি ক্লাস আমন্ত্রণ
   - নতুন ব্যাচ ঘোষণা
   - পরীক্ষার সময়সূচি
   - বিশেষ অফার/ডিসকাউন্ট

### 7.2 SMS Gateway Integration

**Supported Gateways (Bangladesh):**
- Greenweb SMS API
- Elitbuzz SMS API
- SSL Wireless
- BulkSMSBD

**Integration Pattern:**
```typescript
// Abstract SMS Gateway Interface
interface SmsGateway {
  sendSingle(phone: string, message: string): Promise<SmsResponse>;
  sendBulk(recipients: {phone: string, message: string}[]): Promise<SmsResponse[]>;
  checkBalance(): Promise<number>;
}
```

### 7.3 Character Count Rules (Bangla SMS)

| Language | Characters per SMS | Multi-part |
| :--- | :--- | :--- |
| English (GSM) | 160 chars (1 SMS) | 153 chars per part |
| Bangla (Unicode) | 70 chars (1 SMS) | 67 chars per part |

> **UI Feature:** রিয়েল-টাইমে মেসেজ টাইপ করার সাথে সাথে ক্যারেক্টার কাউন্ট ও প্রয়োজনীয় এসএমএস সংখ্যা দেখাবে।

---

## 8. Role-Based Access Control (RBAC)

### Permission Matrix

| Feature / Action | Super Admin | Admin | Teacher | Staff |
| :--- | :---: | :---: | :---: | :---: |
| Dashboard (Full) | ✅ | ✅ | ❌ | ❌ |
| Dashboard (Own) | ✅ | ✅ | ✅ | ❌ |
| Student - View | ✅ | ✅ | ✅ (own batch) | ✅ |
| Student - Create/Edit | ✅ | ✅ | ❌ | ✅ |
| Student - Delete | ✅ | ✅ | ❌ | ❌ |
| Teacher - View | ✅ | ✅ | ✅ (own) | ❌ |
| Teacher - Create/Edit | ✅ | ✅ | ❌ | ❌ |
| Batch - Manage | ✅ | ✅ | ❌ | ❌ |
| Routine - View | ✅ | ✅ | ✅ (own) | ✅ |
| Routine - Edit | ✅ | ✅ | ❌ | ❌ |
| Attendance - Take | ✅ | ✅ | ✅ (own batch) | ❌ |
| Attendance - View Report | ✅ | ✅ | ✅ (own batch) | ❌ |
| Exam - Create | ✅ | ✅ | ✅ | ❌ |
| Marks - Enter | ✅ | ✅ | ✅ (own exam) | ❌ |
| Results - Publish | ✅ | ✅ | ❌ | ❌ |
| Fee Collection | ✅ | ✅ | ❌ | ✅ |
| Expenses - Manage | ✅ | ✅ | ❌ | ❌ |
| Reports - Financial | ✅ | ✅ | ❌ | ❌ |
| SMS - Send (Batch) | ✅ | ✅ | ❌ | ❌ |
| SMS - Campaign (Bulk) | ✅ | ✅ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ |
| User Management | ✅ | ✅ | ❌ | ❌ |

---

## 9. Step-by-Step Execution Prompts

> **কিভাবে ব্যবহার করবেন:** নিচের প্রতিটি Step একটি স্বতন্ত্র Prompt। একটি Step সম্পূর্ণ হলে পরের Step-এ যাবেন। এভাবে Token-এর সীমাবদ্ধতায় পড়লেও প্রতিটি Step-এ কোথায় আছেন তা ট্র্যাক করা যাবে।

---

### ============================================
### PHASE 1: PROJECT SETUP & FOUNDATION
### ============================================

#### ✅ STEP 1: Backend Project Initialization
```
NestJS ব্যাকএন্ড প্রজেক্ট সেটআপ করো:

1. `backend/` ফোল্ডারে NestJS প্রজেক্ট ইনিশিয়ালাইজ করো (npx @nestjs/cli new)
2. প্রয়োজনীয় প্যাকেজ ইনস্টল করো:
   - @nestjs/config (environment variables)
   - @prisma/client, prisma (ORM)
   - @nestjs/swagger, swagger-ui-express (API docs)
   - @nestjs/jwt, @nestjs/passport, passport, passport-jwt, passport-local
   - bcrypt, @types/bcrypt
   - class-validator, class-transformer
   - @nestjs/serve-static (optional)
3. .env ও .env.example ফাইল তৈরি করো (DATABASE_URL, JWT_SECRET, PORT)
4. tsconfig.json এ strict mode চালু করো
5. main.ts এ CORS, Validation Pipe, Swagger, Global Prefix (/api/v1) সেটআপ করো
```

#### ✅ STEP 2: Database Schema & Prisma Setup
```
Prisma ডাটাবেজ স্কিমা তৈরি করো:

1. prisma/schema.prisma ফাইলে PROJECT_BLUEPRINT.md এর Section 4 অনুযায়ী সকল মডেল তৈরি করো:
   - User, Student, Teacher, Subject, TeacherSubject
   - Batch, BatchStudent, BatchTeacher, BatchSubject
   - RoutineSlot, Attendance
   - Exam, Mark
   - FeeCollection, Expense
   - SmsTemplate, SmsCampaign, SmsRecipient, SmsLog
   - Notice, Setting, AcademicYear
   - সকল Enum (UserRole, Gender, BloodGroup, DayOfWeek, AttendanceStatus, ExamType, PaymentMethod, FeeType, ExpenseCategory, SmsType, SmsStatus)
2. prisma migrate dev --name init দিয়ে মাইগ্রেশন রান করো
3. prisma generate দিয়ে Prisma Client জেনারেট করো
4. PrismaService তৈরি করো (NestJS Injectable)
```

#### ✅ STEP 3: Seed Data
```
prisma/seed.ts তৈরি করো:

1. Default Super Admin user তৈরি করো:
   - username: "admin"
   - password: "admin123" (bcrypt hashed)
   - role: SUPER_ADMIN
2. Default Subjects তৈরি করো:
   - বাংলা (BAN), ইংরেজি (ENG), গণিত (MATH)
   - পদার্থবিজ্ঞান (PHY), রসায়ন (CHE), জীববিজ্ঞান (BIO)
   - উচ্চতর গণিত (H.MATH), ICT (ICT)
   - হিসাববিজ্ঞান (ACC), ব্যবসায় সংগঠন (BOM), ফিন্যান্স (FIN)
3. Default Settings তৈরি করো:
   - institute_name: "উত্তরণ স্টাডি কেয়ার"
   - institute_phone, institute_address, etc.
4. Default Academic Year তৈরি করো (2024, isCurrent: true)
5. Default SMS Templates তৈরি করো (attendance alert, fee receipt, result SMS)
6. package.json এ seed script যোগ করো: "prisma": { "seed": "ts-node prisma/seed.ts" }
```

#### ✅ STEP 4: Common Module (Guards, Decorators, Interceptors, Filters)
```
backend/src/common/ এ shared utilities তৈরি করো:

1. guards/jwt-auth.guard.ts — JWT Authentication Guard
2. guards/roles.guard.ts — Role-based Authorization Guard
3. decorators/current-user.decorator.ts — @CurrentUser() parameter decorator
4. decorators/roles.decorator.ts — @Roles(UserRole.ADMIN) decorator
5. decorators/public.decorator.ts — @Public() decorator (skip auth)
6. interceptors/response-transform.interceptor.ts — Standard API response format
7. filters/all-exceptions.filter.ts — Global exception handler
8. pipes/validation.pipe.ts — Global validation pipe config
9. dto/pagination.dto.ts — Standard pagination query DTO (page, limit, search, sortBy, sortOrder)
10. dto/api-response.dto.ts — Standard response DTO
```

#### ✅ STEP 5: Auth Module
```
backend/src/modules/auth/ তৈরি করো:

1. strategies/local.strategy.ts — Username + Password validation
2. strategies/jwt.strategy.ts — JWT token validation
3. dto/login.dto.ts — { username, password }
4. dto/change-password.dto.ts — { currentPassword, newPassword }
5. auth.service.ts:
   - validateUser(username, password) — bcrypt compare
   - login(user) — Generate access + refresh JWT tokens
   - refreshToken(refreshToken) — Validate & issue new tokens
   - logout(userId) — Clear refresh token from DB
   - changePassword(userId, dto)
   - getProfile(userId)
6. auth.controller.ts:
   - POST /login
   - POST /refresh
   - POST /logout
   - GET /profile
   - PUT /change-password
7. auth.module.ts — Register JwtModule, PassportModule, strategies
```

#### ✅ STEP 6: Frontend Project Initialization
```
Next.js ফ্রন্টএন্ড প্রজেক্ট সেটআপ করো:

1. `frontend/` ফোল্ডারে Next.js প্রজেক্ট ইনিশিয়ালাইজ করো (npx create-next-app)
   - TypeScript: Yes
   - ESLint: Yes
   - App Router: Yes
   - src/ directory: Yes
2. প্রয়োজনীয় প্যাকেজ ইনস্টল করো:
   - axios (API calls)
   - react-icons (icons)
   - react-hot-toast (notifications)
   - chart.js, react-chartjs-2 (dashboard charts)
   - xlsx (Excel export/import for SMS campaigns)
   - date-fns (date formatting)
3. Google Fonts সেটআপ করো: Inter + Noto Sans Bengali
4. globals.css এ PROJECT_BLUEPRINT.md Section 6.1 অনুযায়ী CSS Variables সেটআপ করো
5. .env.local তৈরি করো (NEXT_PUBLIC_API_URL)
```

#### ✅ STEP 7: Frontend Foundation (Layout, API Client, Auth Context)
```
ফ্রন্টএন্ডের ভিত্তি তৈরি করো:

1. src/lib/api.ts — Axios instance with:
   - Base URL from env
   - JWT token auto-attach (Authorization header)
   - Response/Error interceptors
   - Auto refresh token on 401
2. src/context/AuthContext.tsx:
   - login(username, password)
   - logout()
   - user state (id, username, role)
   - isAuthenticated, isLoading
   - Token storage (localStorage + state)
3. src/hooks/useAuth.ts — useContext(AuthContext)
4. src/types/index.ts — TypeScript interfaces (User, Student, Teacher, Batch, etc.)
5. src/lib/utils.ts — Helper functions (formatDate, formatCurrency, getGrade, etc.)
```

#### ✅ STEP 8: UI Component Library
```
src/components/ui/ এ Base UI Components তৈরি করো:

1. Button.tsx — Primary, Secondary, Danger, Ghost variants + sizes + loading state
2. Input.tsx — Text, Email, Number, Password + label + error message
3. Select.tsx — Dropdown select with label + error
4. Modal.tsx — Reusable modal dialog with overlay + animations
5. Table.tsx — Responsive data table
6. Card.tsx — Content card with header, body, footer
7. Badge.tsx — Status badges (Active, Inactive, Present, Absent, etc.)
8. Tabs.tsx — Tab navigation component
9. Toast.tsx — react-hot-toast wrapper/config
10. Loader.tsx — Spinner + Skeleton loader
11. Pagination.tsx — Page navigation (Previous, 1, 2, ..., Next)
12. DatePicker.tsx — Date input with formatting
13. FileUpload.tsx — Drag & drop file upload
14. Chart.tsx — Chart.js wrapper

প্রতিটি component-এ:
- TypeScript props interface
- CSS Module বা inline styles (CSS Variables ব্যবহার করে)
- Proper accessibility (aria labels)
- Micro-animations (hover, focus, transitions)
```

#### ✅ STEP 9: Dashboard Layout (Sidebar + Topbar)
```
Dashboard Layout তৈরি করো:

1. src/components/layout/Sidebar.tsx:
   - লোগো ও প্রতিষ্ঠানের নাম
   - Navigation menu:
     * 🏠 ড্যাশবোর্ড
     * 👨‍🎓 ছাত্র-ছাত্রী
     * 👨‍🏫 শিক্ষক
     * 📚 ব্যাচ ও ক্লাস
     * 📅 রুটিন
     * ✅ হাজিরা
     * 📝 পরীক্ষা ও রেজাল্ট
     * 💰 হিসাব-নিকাশ (submenu: ফি আদায়, বকেয়া, ব্যয়, রিপোর্ট)
     * 📱 এসএমএস (submenu: পাঠান, ক্যাম্পেইন, টেমপ্লেট, হিস্ট্রি)
     * 📢 নোটিশ বোর্ড
     * 📊 রিপোর্ট
     * ⚙️ সেটিংস
   - Collapsible sidebar (toggle icon)
   - Active route highlighting
   - Role-based menu item visibility
   - Dark navy/indigo background with smooth transitions

2. src/components/layout/Topbar.tsx:
   - Search bar
   - Notification bell icon
   - User avatar + dropdown (Profile, Change Password, Logout)
   - Mobile hamburger menu toggle

3. src/components/layout/Breadcrumb.tsx:
   - Auto breadcrumb from route

4. src/app/(dashboard)/layout.tsx:
   - Sidebar + Topbar + main content area
   - Auth protection (redirect to /login if not authenticated)
   - Responsive: sidebar collapses on mobile
```

#### ✅ STEP 10: Login Page
```
লগইন পেজ তৈরি করো:

1. src/app/(auth)/layout.tsx — Centered layout (no sidebar)
2. src/app/(auth)/login/page.tsx:
   - প্রতিষ্ঠানের লোগো (generate_image tool দিয়ে তৈরি)
   - "উত্তরণ স্টাডি কেয়ার" শিরোনাম
   - Username input
   - Password input (show/hide toggle)
   - "লগইন করুন" button
   - Loading state
   - Error message display
   - Glassmorphism card design
   - Animated gradient background
   - Responsive for all devices
3. Auth redirect: Already logged in → redirect to dashboard
```

---

### ============================================
### PHASE 2: CORE MODULES (Backend + Frontend)
### ============================================

#### ✅ STEP 11: Subjects Module (Backend)
```
backend/src/modules/subjects/ তৈরি করো:

1. dto/create-subject.dto.ts
2. dto/update-subject.dto.ts
3. subjects.service.ts — CRUD operations
4. subjects.controller.ts — REST endpoints
5. subjects.module.ts
```

#### ✅ STEP 12: Students Module (Backend)
```
backend/src/modules/students/ তৈরি করো:

1. dto/create-student.dto.ts — সকল ফিল্ড ভ্যালিডেশন সহ
2. dto/update-student.dto.ts
3. dto/query-student.dto.ts — search, filter, pagination
4. students.service.ts:
   - create(dto) — Auto-generate studentId (USC-YYYY-NNNN)
   - findAll(query) — Paginated, searchable, filterable
   - findOne(id) — With relations (batches, attendances, marks, fees)
   - update(id, dto)
   - remove(id) — Soft delete (isActive = false)
   - getAttendanceHistory(id)
   - getMarksHistory(id)
   - getFeeHistory(id)
   - exportToExcel()
   - importFromExcel(file)
5. students.controller.ts — All endpoints from Section 5.3
6. students.module.ts
```

#### ✅ STEP 13: Students Module (Frontend)
```
ছাত্র-ছাত্রী ম্যানেজমেন্ট ফ্রন্টএন্ড তৈরি করো:

1. src/app/(dashboard)/students/page.tsx — Student List:
   - DataTable with columns: ID, নাম, ক্লাস, ব্যাচ, ফোন, স্ট্যাটাস, অ্যাকশন
   - Search bar (নাম, ID, ফোন দিয়ে সার্চ)
   - Filter: ক্লাস, ব্যাচ, গ্রুপ, স্ট্যাটাস (Active/Inactive)
   - Pagination
   - "নতুন ভর্তি" button
   - Export to Excel button
   - Row click → student detail page

2. src/app/(dashboard)/students/add/page.tsx — Admission Form:
   - Multi-step form বা single page with sections:
     * ব্যক্তিগত তথ্য (নাম, জেন্ডার, জন্ম তারিখ, ফোন, ছবি আপলোড)
     * একাডেমিক তথ্য (স্কুল/কলেজ, ক্লাস, গ্রুপ, বোর্ড রোল)
     * অভিভাবকের তথ্য (পিতা, মাতা, অভিভাবক ফোন)
     * ঠিকানা
     * ব্যাচ নির্বাচন ও ফি তথ্য (মাসিক ফি, ডিসকাউন্ট)
   - Form validation
   - Submit → API call → Toast → Redirect

3. src/app/(dashboard)/students/[id]/page.tsx — Student Detail:
   - Profile card (photo, name, ID, status badge)
   - Tabs: প্রোফাইল | হাজিরা | রেজাল্ট | ফি হিস্ট্রি
   - Edit button → modal বা inline edit
   - Delete (deactivate) with confirmation dialog
```

#### ✅ STEP 14: Teachers Module (Backend)
```
backend/src/modules/teachers/ তৈরি করো:

1. dto/create-teacher.dto.ts
2. dto/update-teacher.dto.ts
3. teachers.service.ts — CRUD + subject assignment + batch listing
4. teachers.controller.ts — All endpoints from Section 5.4
5. teachers.module.ts
```

#### ✅ STEP 15: Teachers Module (Frontend)
```
শিক্ষক ম্যানেজমেন্ট ফ্রন্টএন্ড তৈরি করো:

1. /teachers — Teacher list page (similar structure to students)
2. /teachers/add — Teacher registration form
3. /teachers/[id] — Teacher detail (profile, assigned subjects, batches, routine)
```

#### ✅ STEP 16: Batches Module (Backend)
```
backend/src/modules/batches/ তৈরি করো:

1. dto/create-batch.dto.ts
2. dto/update-batch.dto.ts
3. dto/add-student-to-batch.dto.ts
4. batches.service.ts:
   - CRUD operations
   - addStudents(batchId, studentIds[]) — batch enrollment
   - removeStudent(batchId, studentId)
   - assignTeachers(batchId, teacherIds[])
   - addSubjects(batchId, subjectIds[])
   - getStudents(batchId)
   - getRoutine(batchId)
5. batches.controller.ts — All endpoints from Section 5.6
6. batches.module.ts
```

#### ✅ STEP 17: Batches Module (Frontend)
```
ব্যাচ ম্যানেজমেন্ট ফ্রন্টএন্ড তৈরি করো:

1. /batches — Batch list (card view showing class, group, students count, teacher)
2. /batches/[id] — Batch detail page:
   - Tabs: ছাত্র তালিকা | শিক্ষক | সাবজেক্ট | রুটিন | পরীক্ষা
   - ছাত্র যোগ/বাদ দেওয়ার মডাল
   - শিক্ষক অ্যাসাইন করার মডাল
```

#### ✅ STEP 18: Routine Module (Backend + Frontend)
```
রুটিন/সাপ্তাহিক শিডিউল মডিউল:

Backend:
1. dto/create-routine-slot.dto.ts
2. routine.service.ts — CRUD + bulk create for a batch
3. routine.controller.ts — All endpoints from Section 5.7
4. routine.module.ts

Frontend:
1. /routine — ব্যাচ সিলেক্ট ড্রপডাউন
2. সাপ্তাহিক টাইমটেবিল গ্রিড (শনিবার-বৃহস্পতিবার, সময় স্লট)
3. ক্লিক করে নতুন স্লট যোগ (সাবজেক্ট + শিক্ষক + সময় + রুম)
4. ড্র্যাগ-এন্ড-ড্রপ বা ক্লিক-টু-এডিট
5. প্রিন্ট রুটিন বাটন
```

---

### ============================================
### PHASE 3: ATTENDANCE & EXAM SYSTEM
### ============================================

#### ✅ STEP 19: Attendance Module (Backend)
```
backend/src/modules/attendance/ তৈরি করো:

1. dto/submit-attendance.dto.ts — { batchId, date, records: [{studentId, status, remarks}] }
2. attendance.service.ts:
   - submitBatchAttendance(dto) — Insert/Update attendance for all students
   - getBatchAttendance(batchId, date)
   - getStudentAttendance(studentId, startDate, endDate)
   - getAttendanceReport(batchId, month, year)
   - triggerAbsentSms(attendanceIds[]) — Auto SMS for absent students
3. attendance.controller.ts — All endpoints from Section 5.8
4. attendance.module.ts
```

#### ✅ STEP 20: Attendance Module (Frontend)
```
হাজিরা ব্যবস্থাপনা ফ্রন্টএন্ড:

1. /attendance — Take Attendance page:
   - ব্যাচ সিলেক্ট ড্রপডাউন
   - তারিখ পিকার (default: আজ)
   - ছাত্র তালিকা (রোল নম্বর সহ) — প্রতিটির পাশে Present/Absent টগল বাটন
   - "সব উপস্থিত" বাটন (quick mark all present)
   - সাবমিট বাটন
   - সাবমিটের পর অনুপস্থিতদের জন্য এসএমএস পাঠানোর অপশন
   - সুন্দর কালার কোডিং (সবুজ = উপস্থিত, লাল = অনুপস্থিত)

2. /attendance/report — Attendance Report:
   - ব্যাচ ও মাস/সময়কাল সিলেক্ট
   - ক্যালেন্ডার হিটম্যাপ ভিউ
   - ছাত্রভিত্তিক উপস্থিতির শতাংশ
   - প্রিন্ট/এক্সপোর্ট বাটন
```

#### ✅ STEP 21: Exams & Marks Module (Backend)
```
পরীক্ষা ও মার্কস মডিউল (ব্যাকএন্ড):

1. Exams:
   - dto/create-exam.dto.ts
   - exams.service.ts — CRUD + publish/unpublish
   - exams.controller.ts

2. Marks:
   - dto/submit-marks.dto.ts — { examId, marks: [{studentId, obtainedMarks}] }
   - marks.service.ts:
     * submitBulkMarks(dto) — Bulk insert/update marks
     * calculateGrade(obtainedMarks, fullMarks) — Auto grade calculation
     * getResultSheet(examId) — Full result with merit list
     * getStudentResultCard(studentId, examId)
     * triggerResultSms(examId) — Send result SMS to guardians
   - marks.controller.ts
```

#### ✅ STEP 22: Exams & Marks Module (Frontend)
```
পরীক্ষা ও রেজাল্ট ফ্রন্টএন্ড:

1. /exams — Exam List:
   - ফিল্টার: ব্যাচ, সাবজেক্ট, পরীক্ষার ধরন
   - ট্যাব: আসন্ন | চলমান | সম্পন্ন
   - "নতুন পরীক্ষা" বাটন

2. /exams/create — Create Exam form:
   - পরীক্ষার নাম, ধরন, ব্যাচ, সাবজেক্ট, তারিখ, পূর্ণমান, পাসমার্ক, সিলেবাস

3. /exams/[id]/marks — Mark Entry (Spreadsheet-style):
   - ছাত্রদের তালিকা (রোল ক্রমে)
   - প্রতিটি ছাত্রের পাশে মার্কস ইনপুট ফিল্ড
   - রিয়েল-টাইমে গ্রেড দেখানো
   - Tab key দিয়ে পরের ফিল্ডে যাওয়া (keyboard friendly)
   - সেভ বাটন (bulk submit)

4. /results — Result Sheet:
   - ব্যাচ ও পরীক্ষা সিলেক্ট
   - মেরিট লিস্ট (position অনুযায়ী)
   - Publish/Unpublish toggle
   - "এসএমএস পাঠান" বাটন (result SMS to all guardians)
   - প্রিন্ট রেজাল্ট শিট
```

---

### ============================================
### PHASE 4: ACCOUNTS & FINANCE
### ============================================

#### ✅ STEP 23: Accounts Module (Backend)
```
হিসাব-নিকাশ মডিউল (ব্যাকএন্ড):

1. Fee Collection:
   - dto/collect-fee.dto.ts
   - fee.service.ts:
     * collectFee(dto) — Auto-generate receiptNo, calculate due
     * getDues(batchId?, month?) — List students with due fees
     * getStudentFeeHistory(studentId)
     * getCollectionReport(startDate, endDate)
     * generateReceipt(id) — PDF receipt generation
     * sendReceiptSms(id)
   - fee.controller.ts

2. Expenses:
   - dto/create-expense.dto.ts
   - expense.service.ts — CRUD
   - expense.controller.ts

3. Accounts Summary:
   - accounts.service.ts:
     * getDailySummary(date) — Today's income vs expense
     * getMonthlySummary(month, year)
     * getYearlySummary(year)
   - accounts.controller.ts
```

#### ✅ STEP 24: Accounts Module (Frontend)
```
হিসাব-নিকাশ ফ্রন্টএন্ড:

1. /accounts — Fee Collection Overview:
   - আজকের কালেকশন সামারি (মোট আদায়, বকেয়া, ব্যয়)
   - সাম্প্রতিক কালেকশন টেবিল
   - কুইক অ্যাকশন বাটন (ফি আদায়, বকেয়া দেখুন)

2. /accounts/collect — Collect Fee Form:
   - ছাত্র সার্চ ও সিলেক্ট (autocomplete)
   - সিলেক্ট করলেই ছাত্রের তথ্য ও বকেয়া দেখাবে
   - ফি টাইপ, মাস, পরিমাণ, ডিসকাউন্ট, জরিমানা
   - পেমেন্ট মেথড (ক্যাশ, বিকাশ, নগদ)
   - সাবমিট → রসিদ প্রিন্ট/ডাউনলোড + এসএমএস অপশন

3. /accounts/dues — Due List:
   - মাস ও ব্যাচভিত্তিক ফিল্টার
   - বকেয়া থাকা ছাত্রদের তালিকা (নাম, ব্যাচ, বকেয়া মাস, পরিমাণ)
   - "সবাইকে রিমাইন্ডার এসএমএস" বাটন
   - এক্সেলে এক্সপোর্ট

4. /accounts/expenses — Expense Tracker:
   - ব্যয়ের তালিকা + "নতুন ব্যয়" বাটন
   - ক্যাটাগরি অনুযায়ী ফিল্টার

5. /accounts/reports — Financial Reports:
   - মাসিক আয়-ব্যয় তুলনামূলক চার্ট (Bar/Line chart)
   - ক্যাটাগরি অনুযায়ী ব্যয়ের পাই চার্ট
   - ডাউনলোড/প্রিন্ট
```

---

### ============================================
### PHASE 5: SMS ENGINE
### ============================================

#### ✅ STEP 25: SMS Module (Backend)
```
এসএমএস ইঞ্জিন (ব্যাকএন্ড):

1. SMS Gateway Service:
   - sms-gateway.service.ts:
     * Abstract interface for multiple gateways
     * sendSingle(phone, message)
     * sendBulk(recipients[])
     * checkBalance()
   - গেটওয়ে ইমপ্লিমেন্টেশন: Greenweb, Elitbuzz (configurable via settings)

2. SMS Service:
   - sms.service.ts:
     * sendToStudent(studentId, message) — Send to guardian phone
     * sendToBatch(batchId, message) — Send to all guardians in batch
     * sendToCustomNumbers(phones[], message)
     * sendAttendanceAlert(attendanceId) — Auto SMS template
     * sendResultSms(examId) — Auto SMS template
     * sendFeeReceipt(feeCollectionId) — Auto SMS template
     * sendDueReminder(studentIds[])

3. SMS Campaign Service:
   - sms-campaign.service.ts:
     * createCampaign(dto)
     * uploadContacts(file) — Parse Excel/CSV
     * executeCampaign(campaignId) — Send bulk (with rate limiting)
     * getCampaignStats(campaignId)

4. SMS Template Service:
   - sms-template.service.ts — CRUD + template rendering with variables

5. SMS Log:
   - Log every SMS sent with status, cost, gateway response

6. Controllers: sms.controller.ts, sms-campaign.controller.ts, sms-template.controller.ts
7. Module: sms.module.ts
```

#### ✅ STEP 26: SMS Module (Frontend)
```
এসএমএস ম্যানেজমেন্ট ফ্রন্টএন্ড:

1. /sms — SMS Dashboard:
   - আজকের পাঠানো এসএমএস সংখ্যা
   - গেটওয়ে ব্যালেন্স
   - সাম্প্রতিক এসএমএস লগ
   - কুইক সেন্ড ফরম (ফোন নম্বর + মেসেজ)

2. /sms/send — Send SMS:
   - ট্যাব: ব্যাচে পাঠান | কাস্টম নম্বরে পাঠান
   - ব্যাচ সিলেক্ট → ছাত্র/অভিভাবক সিলেক্ট (চেকবক্স)
   - মেসেজ বক্স (character counter, SMS count calculator)
   - টেমপ্লেট থেকে বেছে নেওয়ার ড্রপডাউন
   - প্রিভিউ → কনফার্ম → সেন্ড

3. /sms/campaign — Bulk Campaign:
   - "নতুন ক্যাম্পেইন" বাটন
   - ক্যাম্পেইন নাম, মেসেজ লেখা
   - এক্সেল/সিএসভি ফাইল আপলোড (ড্র্যাগ-এন্ড-ড্রপ)
   - আপলোড করলে নম্বরগুলো প্রিভিউ দেখাবে (ভুল নম্বর হাইলাইট)
   - "পাঠান" বাটন → প্রগ্রেস বার দেখাবে
   - ক্যাম্পেইন লিস্ট (স্ট্যাটাস: ড্রাফট, সেন্ডিং, সম্পন্ন)

4. /sms/templates — SMS Templates:
   - টেমপ্লেট তালিকা (নাম, টাইপ, প্রিভিউ)
   - তৈরি/সম্পাদনা মডাল
   - Variable placeholders দেখানো ({{studentName}}, {{date}}, etc.)

5. /sms/history — SMS Log:
   - তারিখ, ফোন, মেসেজ, স্ট্যাটাস (Sent, Delivered, Failed)
   - ফিল্টার: তারিখ, স্ট্যাটাস, টাইপ
   - এক্সপোর্ট
```

---

### ============================================
### PHASE 6: DASHBOARD, REPORTS & SETTINGS
### ============================================

#### ✅ STEP 27: Dashboard (Backend + Frontend)
```
ড্যাশবোর্ড:

Backend — dashboard.service.ts:
1. getQuickStats():
   - মোট ছাত্র (সক্রিয়)
   - মোট শিক্ষক
   - মোট ব্যাচ
   - আজকের আয়
   - এই মাসের আয়
   - মোট বকেয়া
   - আজকের এসএমএস পাঠানো
2. getMonthlyIncomeChart(year) — ১২ মাসের আয়ের ডাটা
3. getAttendanceChart(batchId, month) — হাজিরার ট্রেন্ড
4. getRecentActivities() — সাম্প্রতিক ভর্তি, ফি আদায়, পরীক্ষা
5. getUpcomingExams() — আসন্ন ৫টি পরীক্ষা
6. getDueAlerts() — সবচেয়ে বেশি বকেয়া থাকা ছাত্রদের তালিকা

Frontend — / (Dashboard page):
1. Stat Cards (animated counters):
   - মোট ছাত্র | শিক্ষক | আজকের আয় | বকেয়া
2. Charts:
   - মাসিক আয় (Line/Bar chart)
   - হাজিরার হার (Doughnut chart)
   - ক্যাটাগরি অনুযায়ী ব্যয় (Pie chart)
3. Upcoming Exams card
4. Recent Activities feed
5. Due Alerts notification card
6. Quick Action buttons (ফি আদায়, হাজিরা, এসএমএস পাঠান)
```

#### ⬜ STEP 28: Reports Module
```
রিপোর্ট হাব:

Frontend — /reports:
1. ছাত্র রিপোর্ট: ব্যাচভিত্তিক ছাত্র তালিকা (প্রিন্টযোগ্য)
2. হাজিরা রিপোর্ট: মাসিক হাজিরা সামারি শিট
3. পরীক্ষার রেজাল্ট: ব্যাচভিত্তিক মেরিট লিস্ট
4. ফি কালেকশন রিপোর্ট: দৈনিক/মাসিক কালেকশন
5. বকেয়া রিপোর্ট: মাসভিত্তিক বকেয়া তালিকা
6. আয়-ব্যয় রিপোর্ট: মাসিক/বার্ষিক সামারি
7. এসএমএস রিপোর্ট: পাঠানো ও ব্যয়ের হিসাব

প্রতিটি রিপোর্ট:
- ফিল্টারযোগ্য (তারিখ, ব্যাচ, মাস)
- প্রিন্ট ফ্রেন্ডলি CSS (@media print)
- PDF ডাউনলোড অপশন
- Excel এক্সপোর্ট অপশন
```

#### ⬜ STEP 29: Notices Module
```
নোটিশ বোর্ড:

Backend:
1. notices.service.ts — CRUD + publish/expire
2. notices.controller.ts

Frontend — /notices:
1. নোটিশ তালিকা (কার্ড ভিউ — শিরোনাম, তারিখ, প্রায়োরিটি ব্যাজ)
2. "নতুন নোটিশ" বাটন → মডাল (শিরোনাম, বিস্তারিত, প্রায়োরিটি)
3. সম্পাদনা ও মুছে ফেলা
```

#### ⬜ STEP 30: Settings Module
```
সেটিংস পেজ:

Backend:
1. settings.service.ts — CRUD for key-value settings
2. academic-year.service.ts — CRUD + set current
3. user-management: User CRUD (create teacher/staff accounts)

Frontend — /settings:
1. ট্যাব ভিউ:
   - প্রতিষ্ঠানের তথ্য (নাম, ঠিকানা, ফোন, লোগো আপলোড)
   - একাডেমিক বছর (তৈরি, বর্তমান বছর সেট)
   - এসএমএস গেটওয়ে (গেটওয়ে সিলেক্ট, API Key, Sender ID, ব্যালেন্স চেক)
   - ইউজার ম্যানেজমেন্ট (ইউজার তালিকা, নতুন ইউজার, রোল পরিবর্তন, পাসওয়ার্ড রিসেট)
   - গ্রেডিং সিস্টেম (A+ = 80-100, A = 70-79, etc.)
```

---

### ============================================
### PHASE 7: POLISH & ADVANCED FEATURES
### ============================================

#### ⬜ STEP 31: Advanced Search & Filters
```
সকল লিস্ট পেজে উন্নত সার্চ ও ফিল্টার:

1. Global search bar (সকল মডিউলে সার্চ)
2. Advanced filter panel (collapsible)
3. URL-based filters (shareable filtered URLs)
4. Debounced search input
5. Clear all filters button
```

#### ⬜ STEP 32: Print & PDF
```
প্রিন্ট ও পিডিএফ ফিচার:

1. Fee Receipt — প্রিন্টযোগ্য রসিদ (প্রতিষ্ঠানের নাম, লোগো, ছাত্রের তথ্য, ফি বিবরণ)
2. Result Card — ব্যক্তিগত রেজাল্ট কার্ড (সকল সাবজেক্টের নম্বর, গ্রেড, মেরিট)
3. Attendance Sheet — মাসিক হাজিরা শিট
4. Student ID Card — ছাত্র আইডি কার্ড (ছবি, নাম, ক্লাস, ব্যাচ, আইডি নম্বর)
5. Routine Print — সাপ্তাহিক রুটিন প্রিন্ট
6. @media print CSS styles
```

#### ⬜ STEP 33: Data Import/Export
```
এক্সেল ইম্পোর্ট/এক্সপোর্ট:

1. ছাত্র তালিকা — Export to Excel / Import from Excel
2. ফোন নম্বর তালিকা — Import for SMS campaigns
3. ফি কালেকশন রিপোর্ট — Export to Excel
4. হাজিরা রিপোর্ট — Export to Excel
5. রেজাল্ট শিট — Export to Excel
```

#### ⬜ STEP 34: Dark Mode & Responsive Design
```
ডার্ক মোড ও রেসপন্সিভ ডিজাইন:

1. Dark mode toggle (Topbar এ)
2. localStorage এ থিম সংরক্ষণ
3. সকল কম্পোনেন্ট ও পেজে ডার্ক মোড CSS
4. Tablet responsive (768px)
5. Mobile responsive (480px)
6. Sidebar collapse on mobile
7. Touch-friendly buttons & inputs
```

#### ⬜ STEP 35: Final Testing & Deployment Prep
```
চূড়ান্ত পরীক্ষা ও ডিপ্লয়মেন্ট:

1. সকল API endpoint ম্যানুয়ালি টেস্ট (Swagger UI)
2. সকল ফ্রন্টএন্ড পেজ চেক
3. Error handling verify
4. Loading states verify
5. Empty states verify (কোনো ডাটা না থাকলে সুন্দর মেসেজ)
6. README.md — Installation guide, usage, screenshots
7. Docker Compose setup (optional)
8. Production build test
```

---

## 🏁 Execution Checklist

| Phase | Steps | Status |
| :--- | :--- | :---: |
| **Phase 1: Setup** | Steps 1-10 | ✅ |
| **Phase 2: Core Modules** | Steps 11-18 | ✅ |
| **Phase 3: Attendance & Exam** | Steps 19-22 | ✅ |
| **Phase 4: Accounts** | Steps 23-24 | ✅ |
| **Phase 5: SMS Engine** | Steps 25-26 | ✅ |
| **Phase 6: Dashboard & Reports** | Steps 27-30 | 🔄 (Step 27 Done) |
| **Phase 7: Polish** | Steps 31-35 | ⬜ |

---

> **নোট:** প্রতিটি Step সম্পূর্ণ হলে এই ফাইলে সেই Step-এর পাশে ✅ চিহ্ন দিয়ে আপডেট করা হবে। নতুন চ্যাট সেশনে এই ফাইলটি পড়ে যেখানে থেমেছিলেন সেখান থেকে কাজ চালিয়ে যেতে পারবেন।
