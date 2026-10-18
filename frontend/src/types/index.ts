// ============================================
// Uttoron Study Care - Frontend Type Definitions
// ============================================

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STAFF' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  username: string;
  email?: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: string | null;
  createdAt: string;
  teacher?: {
    id: string;
    teacherId: string;
    nameEn: string;
    nameBn?: string | null;
  } | null;
  student?: {
    id: string;
    studentId: string;
    nameEn: string;
    nameBn?: string | null;
  } | null;
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type BloodGroup =
  | 'A_POSITIVE'
  | 'A_NEGATIVE'
  | 'B_POSITIVE'
  | 'B_NEGATIVE'
  | 'O_POSITIVE'
  | 'O_NEGATIVE'
  | 'AB_POSITIVE'
  | 'AB_NEGATIVE';

export interface Student {
  id: string;
  studentId: string;
  userId?: string | null;
  nameEn: string;
  nameBn?: string | null;
  gender: Gender;
  dateOfBirth?: string | null;
  bloodGroup?: BloodGroup | null;
  photo?: string | null;
  phone?: string | null;
  email?: string | null;
  instituteName?: string | null;
  classLevel: string;
  group?: string | null;
  boardRollNo?: string | null;
  fatherName: string;
  fatherPhone?: string | null;
  motherName?: string | null;
  motherPhone?: string | null;
  guardianName?: string | null;
  guardianPhone: string;
  guardianRelation?: string | null;
  presentAddress?: string | null;
  permanentAddress?: string | null;
  admissionDate: string;
  admissionFee?: number | null;
  monthlyFee?: number | null;
  discount?: number | null;
  discountType?: 'PERCENTAGE' | 'FIXED' | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  batchStudents?: BatchStudent[];
}

export interface Teacher {
  id: string;
  teacherId: string;
  userId?: string | null;
  nameEn: string;
  nameBn?: string | null;
  gender: Gender;
  dateOfBirth?: string | null;
  photo?: string | null;
  phone: string;
  email?: string | null;
  nidNumber?: string | null;
  designation?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  joiningDate: string;
  monthlySalary?: number | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  classLevel?: string | null;
  group?: string | null;
  fullMarks: number;
  passMarks: number;
  isActive: boolean;
  createdAt: string;
}

export interface Batch {
  id: string;
  name: string;
  classLevel: string;
  group?: string | null;
  section?: string | null;
  year: number;
  maxStudents?: number | null;
  monthlyFee?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;
  batchStudents?: BatchStudent[];
  batchTeachers?: BatchTeacher[];
  batchSubjects?: BatchSubject[];
  _count?: {
    batchStudents?: number;
  };
}

export interface BatchStudent {
  id: string;
  batchId: string;
  studentId: string;
  rollNumber?: number | null;
  joinedAt: string;
  isActive: boolean;
  student?: Student;
  batch?: Batch;
}

export interface BatchTeacher {
  id: string;
  batchId: string;
  teacherId: string;
  isPrimary: boolean;
  teacher?: Teacher;
}

export interface BatchSubject {
  id: string;
  batchId: string;
  subjectId: string;
  subject?: Subject;
}

export type DayOfWeek =
  | 'SATURDAY'
  | 'SUNDAY'
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY';

export interface RoutineSlot {
  id: string;
  batchId: string;
  subjectId?: string | null;
  teacherId?: string | null;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  roomNo?: string | null;
  batch?: Batch;
  subject?: Subject | null;
  teacher?: Teacher | null;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface Attendance {
  id: string;
  batchId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string | null;
  takenById?: string | null;
  smsSent: boolean;
  student?: Student;
  batch?: Batch;
}

export type ExamType =
  | 'CLASS_TEST'
  | 'WEEKLY_TEST'
  | 'MONTHLY_EXAM'
  | 'QUARTERLY_EXAM'
  | 'HALF_YEARLY'
  | 'YEARLY_FINAL'
  | 'MODEL_TEST'
  | 'BOARD_MODEL';

export interface Exam {
  id: string;
  name: string;
  examType: ExamType;
  batchId: string;
  subjectId: string;
  teacherId?: string | null;
  examDate: string;
  fullMarks: number;
  passMarks: number;
  duration?: number | null;
  syllabus?: string | null;
  isPublished: boolean;
  batch?: Batch;
  subject?: Subject;
  teacher?: Teacher | null;
  marks?: Mark[];
}

export interface Mark {
  id: string;
  examId: string;
  studentId: string;
  subjectId: string;
  obtainedMarks: number;
  grade?: string | null;
  remarks?: string | null;
  student?: Student;
}

export type PaymentMethod =
  | 'CASH'
  | 'BKASH'
  | 'NAGAD'
  | 'ROCKET'
  | 'BANK_TRANSFER'
  | 'OTHER';

export type FeeType =
  | 'ADMISSION_FEE'
  | 'MONTHLY_FEE'
  | 'EXAM_FEE'
  | 'LAB_FEE'
  | 'BOOK_FEE'
  | 'FINE'
  | 'OTHER';

export interface FeeCollection {
  id: string;
  studentId: string;
  receiptNo: string;
  feeType: FeeType;
  feeMonth?: string | null;
  amount: number;
  discount?: number | null;
  fine?: number | null;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string | null;
  paymentDate: string;
  remarks?: string | null;
  student?: Student;
  receiptSmsSent: boolean;
}

export type ExpenseCategory =
  | 'SALARY'
  | 'RENT'
  | 'ELECTRICITY'
  | 'INTERNET'
  | 'STATIONERY'
  | 'FURNITURE'
  | 'MARKETING'
  | 'SMS_RECHARGE'
  | 'MAINTENANCE'
  | 'OTHER';

export interface Expense {
  id: string;
  voucherNo: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paidTo?: string | null;
  paymentMethod: PaymentMethod;
  expenseDate: string;
  remarks?: string | null;
}

export type SmsType = 'TRANSACTIONAL' | 'CAMPAIGN' | 'INDIVIDUAL';
export type SmsStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

export interface SmsTemplate {
  id: string;
  name: string;
  body: string;
  type: SmsType;
  isActive: boolean;
}

export interface SmsCampaign {
  id: string;
  name: string;
  message: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  scheduledAt?: string | null;
  sentAt?: string | null;
  status: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
}
