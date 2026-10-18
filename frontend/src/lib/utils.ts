import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isValid } from 'date-fns';

/**
 * Merge Tailwind classes cleanly
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format BDT currency
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '৳০';
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    currencyDisplay: 'narrowSymbol',
  })
    .format(amount)
    .replace('BDT', '৳');
}

/**
 * Format English numbers to Bengali numerals
 */
export function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num
    .toString()
    .replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
}

/**
 * Format Date cleanly
 */
export function formatDate(
  dateInput: string | Date | null | undefined,
  formatPattern: string = 'dd MMM yyyy',
): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!isValid(date)) return '-';
  return format(date, formatPattern);
}

/**
 * Calculate Grade according to National Curriculum
 */
export function calculateGrade(obtained: number, full: number = 100): string {
  if (full <= 0) return 'F';
  const percentage = (obtained / full) * 100;

  if (percentage >= 80) return 'A+';
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'A-';
  if (percentage >= 50) return 'B';
  if (percentage >= 40) return 'C';
  if (percentage >= 33) return 'D';
  return 'F';
}

/**
 * Calculate GPA according to National Curriculum
 */
export function calculateGpa(grade: string): number {
  switch (grade.toUpperCase()) {
    case 'A+':
      return 5.0;
    case 'A':
      return 4.0;
    case 'A-':
      return 3.5;
    case 'B':
      return 3.0;
    case 'C':
      return 2.0;
    case 'D':
      return 1.0;
    default:
      return 0.0;
  }
}

/**
 * Format and normalize Bangladesh phone number to 8801XXXXXXXXX
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('01')) return `88${digits}`;
  if (digits.length === 10 && digits.startsWith('1')) return `880${digits}`;
  return digits;
}

/**
 * Calculate SMS characters, type (GSM/Unicode), and SMS parts count
 */
export function getSmsInfo(message: string): {
  charCount: number;
  isUnicode: boolean;
  smsCount: number;
  charsPerSms: number;
  remainingChars: number;
} {
  // Check if contains non-GSM characters (like Bangla)
  // GSM 7-bit standard characters
  const isUnicode = /[^\u0000-\u007F]/.test(message);
  const charCount = message.length;

  if (isUnicode) {
    // Unicode (Bangla): 70 chars for 1 SMS, 67 chars per part if multi-part
    if (charCount <= 70) {
      return {
        charCount,
        isUnicode: true,
        smsCount: charCount === 0 ? 0 : 1,
        charsPerSms: 70,
        remainingChars: charCount === 0 ? 70 : 70 - charCount,
      };
    }
    const smsCount = Math.ceil(charCount / 67);
    const remainingChars = smsCount * 67 - charCount;
    return {
      charCount,
      isUnicode: true,
      smsCount,
      charsPerSms: 67,
      remainingChars,
    };
  } else {
    // English (GSM 7-bit): 160 chars for 1 SMS, 153 chars per part if multi-part
    if (charCount <= 160) {
      return {
        charCount,
        isUnicode: false,
        smsCount: charCount === 0 ? 0 : 1,
        charsPerSms: 160,
        remainingChars: charCount === 0 ? 160 : 160 - charCount,
      };
    }
    const smsCount = Math.ceil(charCount / 153);
    const remainingChars = smsCount * 153 - charCount;
    return {
      charCount,
      isUnicode: false,
      smsCount,
      charsPerSms: 153,
      remainingChars,
    };
  }
}
