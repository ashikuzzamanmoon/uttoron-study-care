'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../../lib/api';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Loader';
import { formatCurrency, formatDate, toBengaliNumber } from '../../../lib/utils';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import {
  FiUsers,
  FiCalendar,
  FiAward,
  FiDollarSign,
  FiAlertCircle,
  FiBarChart2,
  FiMessageSquare,
  FiPrinter,
  FiDownload,
  FiFilter,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiInfo,
} from 'react-icons/fi';

type ReportTab =
  | 'students'
  | 'attendance'
  | 'exams'
  | 'fees'
  | 'dues'
  | 'finance'
  | 'sms';

export default function ReportsHubPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('students');
  const [isLoading, setIsLoading] = useState(false);

  // Common Metadata
  const [batches, setBatches] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  // 1. Students Filter
  const [studentBatch, setStudentBatch] = useState<string>('ALL');
  const [studentClass, setStudentClass] = useState<string>('ALL');
  const [studentStatus, setStudentStatus] = useState<string>('ACTIVE');
  const [studentsData, setStudentsData] = useState<any | null>(null);

  // 2. Attendance Filter
  const [attBatch, setAttBatch] = useState<string>('');
  const [attMonth, setAttMonth] = useState<number>(new Date().getMonth() + 1);
  const [attYear, setAttYear] = useState<number>(new Date().getFullYear());
  const [attendanceData, setAttendanceData] = useState<any | null>(null);

  // 3. Exams Filter
  const [examId, setExamId] = useState<string>('');
  const [examResultsData, setExamResultsData] = useState<any | null>(null);

  // 4. Fee Collections Filter
  const [feeStartDate, setFeeStartDate] = useState<string>('');
  const [feeEndDate, setFeeEndDate] = useState<string>('');
  const [feePaymentMethod, setFeePaymentMethod] = useState<string>('ALL');
  const [feeCollectionsData, setFeeCollectionsData] = useState<any | null>(null);

  // 5. Dues Filter
  const [dueBatch, setDueBatch] = useState<string>('ALL');
  const [dueMonth, setDueMonth] = useState<string>('ALL');
  const [duesData, setDuesData] = useState<any | null>(null);

  // 6. Finance Filter
  const [financeYear, setFinanceYear] = useState<number>(new Date().getFullYear());
  const [financeMonth, setFinanceMonth] = useState<string>('ALL');
  const [financeData, setFinanceData] = useState<any | null>(null);

  // 7. SMS Filter
  const [smsStartDate, setSmsStartDate] = useState<string>('');
  const [smsEndDate, setSmsEndDate] = useState<string>('');
  const [smsType, setSmsType] = useState<string>('ALL');
  const [smsStatus, setSmsStatus] = useState<string>('ALL');
  const [smsData, setSmsData] = useState<any | null>(null);

  const monthsBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  // Load Initial Metadata (Batches & Exams)
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const [batchRes, examRes] = await Promise.all([
          api.get('/batches?limit=100'),
          api.get('/exams?limit=100'),
        ]);
        const batchList = batchRes.data?.data || batchRes.data || [];
        setBatches(batchList);
        if (batchList.length > 0) {
          setAttBatch(batchList[0].id);
        }

        const examList = examRes.data?.data || examRes.data || [];
        setExams(examList);
        if (examList.length > 0) {
          setExamId(examList[0].id);
        }
      } catch (err) {
        console.error('Failed to load batches/exams metadata:', err);
      }
    }
    fetchMetadata();
  }, []);

  // Fetch Report based on active tab
  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'students') {
        const res = await api.get('/reports/students', {
          params: {
            batchId: studentBatch,
            classLevel: studentClass,
            status: studentStatus,
          },
        });
        setStudentsData(res.data);
      } else if (activeTab === 'attendance') {
        if (!attBatch) {
          setAttendanceData(null);
          setIsLoading(false);
          return;
        }
        const res = await api.get('/reports/attendance', {
          params: {
            batchId: attBatch,
            month: attMonth,
            year: attYear,
          },
        });
        setAttendanceData(res.data);
      } else if (activeTab === 'exams') {
        if (!examId) {
          setExamResultsData(null);
          setIsLoading(false);
          return;
        }
        const res = await api.get('/reports/exam-results', {
          params: { examId },
        });
        setExamResultsData(res.data);
      } else if (activeTab === 'fees') {
        const res = await api.get('/reports/fee-collections', {
          params: {
            startDate: feeStartDate || undefined,
            endDate: feeEndDate || undefined,
            paymentMethod: feePaymentMethod,
          },
        });
        setFeeCollectionsData(res.data);
      } else if (activeTab === 'dues') {
        const res = await api.get('/reports/dues', {
          params: {
            batchId: dueBatch,
            month: dueMonth,
          },
        });
        setDuesData(res.data);
      } else if (activeTab === 'finance') {
        const res = await api.get('/reports/income-expense', {
          params: {
            year: financeYear,
            month: financeMonth !== 'ALL' ? parseInt(financeMonth, 10) : undefined,
          },
        });
        setFinanceData(res.data);
      } else if (activeTab === 'sms') {
        const res = await api.get('/reports/sms', {
          params: {
            startDate: smsStartDate || undefined,
            endDate: smsEndDate || undefined,
            type: smsType,
            status: smsStatus,
          },
        });
        setSmsData(res.data);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
      toast.error('রিপোর্ট ডাটা লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  }, [
    activeTab,
    studentBatch,
    studentClass,
    studentStatus,
    attBatch,
    attMonth,
    attYear,
    examId,
    feeStartDate,
    feeEndDate,
    feePaymentMethod,
    dueBatch,
    dueMonth,
    financeYear,
    financeMonth,
    smsStartDate,
    smsEndDate,
    smsType,
    smsStatus,
  ]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Window Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Excel Exporter
  const handleExportExcel = () => {
    let sheetData: any[] = [];
    let fileName = `Uttoron_${activeTab}_Report_${Date.now()}.xlsx`;
    let sheetName = 'রিপোর্ট';

    if (activeTab === 'students' && studentsData?.students) {
      sheetName = 'ছাত্র তালিকা';
      fileName = `Uttoron_Students_Report.xlsx`;
      sheetData = studentsData.students.map((s: any, idx: number) => ({
        'ক্রমিক': idx + 1,
        'রোল': s.rollNumber || '-',
        'আইডি নম্বর': s.studentId,
        'শিক্ষার্থীর নাম': s.nameBn || s.nameEn,
        'লিঙ্গ': s.gender === 'MALE' ? 'ছাত্র' : 'ছাত্রী',
        'শ্রেণি': s.classLevel,
        'ব্যাচ': s.batchName,
        'অভিভাবকের নাম': s.guardianName || '-',
        'অভিভাবকের ফোন': s.guardianPhone || '-',
        'মাসিক ফি (৳)': s.monthlyFee,
        'ভর্তি তারিখ': s.admissionDate ? formatDate(s.admissionDate, 'dd/MM/yyyy') : '-',
      }));
    } else if (activeTab === 'attendance' && attendanceData?.students) {
      sheetName = 'হাজিরা শিট';
      fileName = `Uttoron_Attendance_${attendanceData.batch.name}_${monthsBn[attMonth - 1]}_${attYear}.xlsx`;
      sheetData = attendanceData.students.map((s: any, idx: number) => ({
        'ক্রমিক': idx + 1,
        'রোল': s.rollNumber || '-',
        'শিক্ষার্থী আইডি': s.studentId,
        'নাম': s.nameBn || s.nameEn,
        'উপস্থিত দিন': s.presentCount,
        'দেরিতে': s.lateCount,
        'অনুপস্থিত দিন': s.absentCount,
        'উপস্থিতি হার (%)': `${s.attendanceRate}%`,
      }));
    } else if (activeTab === 'exams' && examResultsData?.meritList) {
      sheetName = 'মেরিট লিস্ট';
      fileName = `Uttoron_Merit_List_${examResultsData.exam.name}.xlsx`;
      sheetData = examResultsData.meritList.map((m: any) => ({
        'মেধা স্থান': m.rank,
        'রোল': m.rollNumber || '-',
        'শিক্ষার্থী আইডি': m.studentId,
        'নাম': m.nameBn || m.nameEn,
        'পূর্ণমান': m.fullMarks,
        'প্রাপ্ত নম্বর': m.obtainedMarks,
        'শতকরা হার': `${m.percentage}%`,
        'গ্রেড': m.grade,
        'ফলাফল': m.isPassed ? 'উত্তীর্ণ' : 'অনুত্তীর্ণ',
      }));
    } else if (activeTab === 'fees' && feeCollectionsData?.collections) {
      sheetName = 'ফি কালেকশন';
      fileName = `Uttoron_Fee_Collections_Report.xlsx`;
      sheetData = feeCollectionsData.collections.map((c: any) => ({
        'রসিদ নং': c.receiptNo,
        'তারিখ': formatDate(c.paymentDate, 'dd/MM/yyyy'),
        'শিক্ষার্থী আইডি': c.studentId,
        'শিক্ষার্থীর নাম': c.studentName,
        'শ্রেণি ও ব্যাচ': `${c.classLevel} - ${c.batchName}`,
        'ফি-এর ধরন': c.feeType,
        'নির্ধারিত ফি': c.amount,
        'ছাড়': c.discount,
        'পরিশোধিত': c.paidAmount,
        'বকেয়া': c.dueAmount,
        'পেমেন্ট মেথড': c.paymentMethod,
      }));
    } else if (activeTab === 'dues' && duesData?.students) {
      sheetName = 'বকেয়া তালিকা';
      fileName = `Uttoron_Dues_Report.xlsx`;
      sheetData = duesData.students.map((d: any, idx: number) => ({
        'ক্রমিক': idx + 1,
        'রোল': d.rollNumber || '-',
        'শিক্ষার্থী আইডি': d.studentId,
        'নাম': d.nameBn || d.nameEn,
        'শ্রেণি': d.classLevel,
        'ব্যাচ': d.batchName,
        'অভিভাবক ফোন': d.guardianPhone || '-',
        'বকেয়ার পরিমাণ (৳)': d.totalDue,
        'বকেয়া মাসসমূহ': d.dueMonths.join(', '),
      }));
    } else if (activeTab === 'finance' && financeData?.summary) {
      sheetName = 'আয়-ব্যয় সামারি';
      fileName = `Uttoron_Finance_Summary_${financeYear}.xlsx`;
      sheetData = [
        { 'বিবরণ': 'মোট আদায়কৃত আয় (টাকা)', 'পরিমাণ': financeData.summary.totalIncome },
        { 'বিবরণ': 'মোট ব্যয় (টাকা)', 'পরিমাণ': financeData.summary.totalExpense },
        { 'বিবরণ': 'নেট উদ্বৃত্ত / লাভ (টাকা)', 'পরিমাণ': financeData.summary.netProfit },
        { 'বিবরণ': 'লাভের মার্জিন (%)', 'পরিমাণ': `${financeData.summary.profitMargin}%` },
      ];
    } else if (activeTab === 'sms' && smsData?.logs) {
      sheetName = 'এসএমএস রিপোর্ট';
      fileName = `Uttoron_SMS_Logs.xlsx`;
      sheetData = smsData.logs.map((l: any) => ({
        'তারিখ': formatDate(l.createdAt, 'dd/MM/yyyy hh:mm a'),
        'ফোন নম্বর': l.phone,
        'মেসেজ টাইপ': l.type,
        'স্ট্যাটাস': l.status,
        'মেসেজ বিষয়বস্তু': l.message,
      }));
    }

    if (sheetData.length === 0) {
      toast.error('এক্সপোর্ট করার জন্য কোনো ডাটা পাওয়া যায়নি');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
    toast.success('এক্সেল ফাইল ডাউনলোড সম্পন্ন হয়েছে');
  };

  // Report Title Helper for Print
  const getPrintTitle = () => {
    switch (activeTab) {
      case 'students':
        return 'শিক্ষার্থীদের ব্যাচভিত্তিক পূর্ণাঙ্গ তালিকা বিবরণী';
      case 'attendance':
        return `মাসিক হাজিরা সামারি বিবরণী (${monthsBn[attMonth - 1]} ${toBengaliNumber(attYear)})`;
      case 'exams':
        return `পরীক্ষার মেধা তালিকা ও রেজাল্ট শিট`;
      case 'fees':
        return 'ফি আদায় ও রাজস্ব বিবরণী রিপোর্ট';
      case 'dues':
        return 'বকেয়া ফি ও তাগাদা তালিকা বিবরণী';
      case 'finance':
        return `আয়-ব্যয় ও লাভ-ক্ষতির আর্থিক বিবরণী (${toBengaliNumber(financeYear)})`;
      case 'sms':
        return 'এসএমএস ডেলিভারি ও গেটওয়ে অডিট রিপোর্ট';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Print-Only Official Letterhead Header */}
      <div className="hidden print:block text-center pb-4 mb-4 border-b-2 border-slate-900">
        <h1 className="text-2xl font-black text-slate-900">উত্তরণ স্টাডি কেয়ার</h1>
        <p className="text-xs text-slate-600">
          কোচিং ম্যানেজমেন্ট ও স্মার্ট অ্যাকাডেমিক সিস্টেম • প্রাতিষ্ঠানিক অফিশিয়াল রিপোর্ট
        </p>
        <h2 className="text-sm font-bold text-indigo-900 mt-2 underline">
          {getPrintTitle()}
        </h2>
        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 px-1">
          <span>প্রিন্টের তারিখ ও সময়: {formatDate(new Date(), 'dd MMM yyyy, hh:mm a')}</span>
          <span>উত্তরণ স্টাডি কেয়ার ম্যানেজমেন্ট পোর্টাল</span>
        </div>
      </div>

      {/* Screen Header */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FiBarChart2 className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              রিপোর্ট ও অডিট হাব (Reports Hub)
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            শিক্ষার্থী, হাজিরা, মেধা তালিকা, ফি আদায়, বকেয়া, আয়-ব্যয় ও এসএমএস-এর পূর্ণাঙ্গ প্রিন্ট ও এক্সেল রিপোর্ট
          </p>
        </div>

        {/* Action Buttons: Print & Excel */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
          >
            <FiDownload className="w-4 h-4 text-emerald-600" />
            এক্সেল এক্সপোর্ট
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <FiPrinter className="w-4 h-4" />
            প্রিন্ট / PDF ডাউনলোড
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="no-print flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        {[
          { key: 'students', label: 'ছাত্র-ছাত্রী রিপোর্ট', icon: <FiUsers className="w-4 h-4" /> },
          { key: 'attendance', label: 'হাজিরা সামারি', icon: <FiCalendar className="w-4 h-4" /> },
          { key: 'exams', label: 'পরীক্ষার রেজাল্ট ও মেধা', icon: <FiAward className="w-4 h-4" /> },
          { key: 'fees', label: 'ফি কালেকশন রিপোর্ট', icon: <FiDollarSign className="w-4 h-4" /> },
          { key: 'dues', label: 'বকেয়া ফি তালিকা', icon: <FiAlertCircle className="w-4 h-4" /> },
          { key: 'finance', label: 'আয়-ব্যয় ও উদ্বৃত্ত', icon: <FiTrendingUp className="w-4 h-4" /> },
          { key: 'sms', label: 'এসএমএস লগ রিপোর্ট', icon: <FiMessageSquare className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as ReportTab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Panel (Dynamic based on Active Tab) */}
      <Card className="no-print border-slate-200">
        <CardBody className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <FiFilter className="text-indigo-600" /> ফিল্টারসমূহ:
            </span>

            {/* 1. Students Filters */}
            {activeTab === 'students' && (
              <>
                <select
                  value={studentBatch}
                  onChange={(e) => setStudentBatch(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">সকল ব্যাচ</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>

                <select
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">সকল শ্রেণি</option>
                  <option value="Class 6">Class 6</option>
                  <option value="Class 7">Class 7</option>
                  <option value="Class 8">Class 8</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="HSC 1st Year">HSC 1st Year</option>
                  <option value="HSC 2nd Year">HSC 2nd Year</option>
                </select>

                <select
                  value={studentStatus}
                  onChange={(e) => setStudentStatus(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ACTIVE">সক্রিয় ছাত্র-ছাত্রী</option>
                  <option value="INACTIVE">নিষ্ক্রিয় ছাত্র-ছাত্রী</option>
                  <option value="ALL">সকল স্ট্যাটাস</option>
                </select>
              </>
            )}

            {/* 2. Attendance Filters */}
            {activeTab === 'attendance' && (
              <>
                <select
                  value={attBatch}
                  onChange={(e) => setAttBatch(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>

                <select
                  value={attMonth}
                  onChange={(e) => setAttMonth(parseInt(e.target.value, 10))}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {monthsBn.map((m, idx) => (
                    <option key={idx} value={idx + 1}>{m}</option>
                  ))}
                </select>

                <select
                  value={attYear}
                  onChange={(e) => setAttYear(parseInt(e.target.value, 10))}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{toBengaliNumber(y)} সাল</option>
                  ))}
                </select>
              </>
            )}

            {/* 3. Exams Filter */}
            {activeTab === 'exams' && (
              <select
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 min-w-[240px]"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.subject?.name || 'বিষয়'})
                  </option>
                ))}
              </select>
            )}

            {/* 4. Fee Collections Filters */}
            {activeTab === 'fees' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">শুরু:</span>
                  <input
                    type="date"
                    value={feeStartDate}
                    onChange={(e) => setFeeStartDate(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">শেষ:</span>
                  <input
                    type="date"
                    value={feeEndDate}
                    onChange={(e) => setFeeEndDate(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800"
                  />
                </div>
                <select
                  value={feePaymentMethod}
                  onChange={(e) => setFeePaymentMethod(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                >
                  <option value="ALL">সকল পেমেন্ট মেথড</option>
                  <option value="CASH">ক্যাশ (Cash)</option>
                  <option value="BKASH">বিকাশ (bKash)</option>
                  <option value="NAGAD">নগদ (Nagad)</option>
                  <option value="ROCKET">রকেট (Rocket)</option>
                  <option value="BANK_TRANSFER">ব্যাংক</option>
                </select>
              </>
            )}

            {/* 5. Dues Filters */}
            {activeTab === 'dues' && (
              <select
                value={dueBatch}
                onChange={(e) => setDueBatch(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
              >
                <option value="ALL">সকল ব্যাচ</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}

            {/* 6. Finance Filters */}
            {activeTab === 'finance' && (
              <>
                <select
                  value={financeYear}
                  onChange={(e) => setFinanceYear(parseInt(e.target.value, 10))}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{toBengaliNumber(y)} সাল</option>
                  ))}
                </select>
                <select
                  value={financeMonth}
                  onChange={(e) => setFinanceMonth(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                >
                  <option value="ALL">সম্পূর্ণ বছর (বার্ষিক সামারি)</option>
                  {monthsBn.map((m, idx) => (
                    <option key={idx} value={(idx + 1).toString()}>{m}</option>
                  ))}
                </select>
              </>
            )}

            {/* 7. SMS Filters */}
            {activeTab === 'sms' && (
              <>
                <select
                  value={smsType}
                  onChange={(e) => setSmsType(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                >
                  <option value="ALL">সকল মেসেজ টাইপ</option>
                  <option value="TRANSACTIONAL">অটো এসএমএস (ট্রানজ্যাকশনাল)</option>
                  <option value="CAMPAIGN">ক্যাম্পেইন (মার্কেটিং)</option>
                  <option value="INDIVIDUAL">ব্যক্তিগত এসএমএস</option>
                </select>
                <select
                  value={smsStatus}
                  onChange={(e) => setSmsStatus(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                >
                  <option value="ALL">সকল স্ট্যাটাস</option>
                  <option value="SENT">সফল (Sent)</option>
                  <option value="FAILED">ব্যর্থ (Failed)</option>
                  <option value="PENDING">অপেক্ষমাণ (Pending)</option>
                </select>
              </>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchReport}
              disabled={isLoading}
              className="ml-auto flex items-center gap-1.5 text-xs"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              রিফ্রেশ
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" className="text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500 animate-pulse">
            রিপোর্ট জেনারেট করা হচ্ছে...
          </p>
        </div>
      ) : (
        <>
          {/* TAB 1: STUDENTS REPORT */}
          {activeTab === 'students' && studentsData && (
            <Card className="border-slate-200 overflow-hidden shadow-xs">
              <CardHeader
                title="শিক্ষার্থীদের ব্যাচভিত্তিক পূর্ণাঙ্গ তালিকা"
                subtitle={`মোট শিক্ষার্থী: ${toBengaliNumber(studentsData.totalStudents)} জন`}
                className="no-print"
              />
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                        <th className="p-3 w-12 text-center">ক্রমিক</th>
                        <th className="p-3 w-16 text-center">রোল</th>
                        <th className="p-3">আইডি</th>
                        <th className="p-3">নাম</th>
                        <th className="p-3">শ্রেণি ও ব্যাচ</th>
                        <th className="p-3">অভিভাবক ও ফোন</th>
                        <th className="p-3 text-right">মাসিক ফি</th>
                        <th className="p-3 text-center">ভর্তি তারিখ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentsData.students.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি
                          </td>
                        </tr>
                      ) : (
                        studentsData.students.map((s: any, idx: number) => (
                          <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3 text-center font-semibold text-slate-400">
                              {toBengaliNumber(idx + 1)}
                            </td>
                            <td className="p-3 text-center font-bold text-indigo-600">
                              {s.rollNumber ? toBengaliNumber(s.rollNumber) : '-'}
                            </td>
                            <td className="p-3 font-mono font-medium text-slate-700">
                              {s.studentId}
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900 block">
                                {s.nameBn || s.nameEn}
                              </span>
                              {s.nameBn && (
                                <span className="text-[10px] text-slate-400">{s.nameEn}</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-800 block">{s.classLevel}</span>
                              <span className="text-[10px] text-slate-500">{s.batchName}</span>
                            </td>
                            <td className="p-3">
                              <span className="text-slate-800 block">{s.guardianName || s.nameBn}</span>
                              <span className="font-mono text-[11px] text-slate-500">
                                {s.guardianPhone || s.phone || '-'}
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900">
                              {formatCurrency(s.monthlyFee)}
                            </td>
                            <td className="p-3 text-center text-slate-500">
                              {s.admissionDate ? formatDate(s.admissionDate, 'dd/MM/yyyy') : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* TAB 2: ATTENDANCE REPORT */}
          {activeTab === 'attendance' && attendanceData && (
            <Card className="border-slate-200 overflow-hidden shadow-xs">
              <CardHeader
                title={`মাসিক হাজিরা বিবরণী: ${attendanceData.batch.name}`}
                subtitle={`মাস: ${monthsBn[attMonth - 1]}, ${toBengaliNumber(attYear)} • মোট ক্লাস দিন: ${toBengaliNumber(attendanceData.workingDays.length)} দিন`}
                className="no-print"
              />
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="p-3 w-16 text-center">রোল</th>
                        <th className="p-3 min-w-[140px]">শিক্ষার্থীর নাম</th>
                        {/* Day columns */}
                        {attendanceData.workingDays.map((d: number) => (
                          <th key={d} className="p-2 text-center w-8 bg-slate-100/50 text-[11px]">
                            {toBengaliNumber(d)}
                          </th>
                        ))}
                        <th className="p-3 text-center bg-emerald-50 text-emerald-800">উপস্থিত</th>
                        <th className="p-3 text-center bg-red-50 text-red-800">অনুপস্থিত</th>
                        <th className="p-3 text-right bg-indigo-50 text-indigo-800">হার (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendanceData.students.length === 0 ? (
                        <tr>
                          <td colSpan={attendanceData.workingDays.length + 5} className="p-8 text-center text-slate-400">
                            এই মাসে কোনো হাজিরার ডাটা লিপিবদ্ধ হয়নি
                          </td>
                        </tr>
                      ) : (
                        attendanceData.students.map((s: any) => (
                          <tr key={s.systemId} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3 text-center font-bold text-indigo-600">
                              {s.rollNumber ? toBengaliNumber(s.rollNumber) : '-'}
                            </td>
                            <td className="p-3 font-semibold text-slate-900">
                              {s.nameBn || s.nameEn}
                            </td>
                            {attendanceData.workingDays.map((d: number) => {
                              const st = s.dailyStatus[d];
                              let badge = <span className="text-slate-300">-</span>;
                              if (st === 'PRESENT') {
                                badge = <span className="text-emerald-600 font-black">P</span>;
                              } else if (st === 'LATE') {
                                badge = <span className="text-amber-500 font-black">L</span>;
                              } else if (st === 'ABSENT') {
                                badge = <span className="text-red-500 font-black">A</span>;
                              } else if (st === 'EXCUSED') {
                                badge = <span className="text-slate-500 font-bold">E</span>;
                              }
                              return (
                                <td key={d} className="p-2 text-center">
                                  {badge}
                                </td>
                              );
                            })}
                            <td className="p-3 text-center font-bold text-emerald-600 bg-emerald-50/30">
                              {toBengaliNumber(s.presentCount + s.lateCount)}
                            </td>
                            <td className="p-3 text-center font-bold text-red-500 bg-red-50/30">
                              {toBengaliNumber(s.absentCount)}
                            </td>
                            <td className="p-3 text-right font-black text-indigo-600 bg-indigo-50/30">
                              {toBengaliNumber(s.attendanceRate)}%
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* TAB 3: EXAM RESULTS REPORT & MERIT LIST */}
          {activeTab === 'exams' && examResultsData && (
            <Card className="border-slate-200 overflow-hidden shadow-xs">
              <CardHeader
                title={`মেধা তালিকা (Merit List): ${examResultsData.exam.name}`}
                subtitle={`বিষয়: ${examResultsData.exam.subject.name} • ব্যাচ: ${examResultsData.exam.batch.name} • পূর্ণমান: ${toBengaliNumber(examResultsData.exam.fullMarks)}`}
                className="no-print"
                action={
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-emerald-600">
                      পাস হার: {toBengaliNumber(examResultsData.stats.passRate)}%
                    </span>
                    <span className="font-semibold text-indigo-600">
                      সর্বোচ্চ: {toBengaliNumber(examResultsData.stats.highestMarks)}
                    </span>
                  </div>
                }
              />
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="p-3 w-20 text-center">মেধা স্থান</th>
                        <th className="p-3 w-16 text-center">রোল</th>
                        <th className="p-3">আইডি</th>
                        <th className="p-3">শিক্ষার্থীর নাম</th>
                        <th className="p-3 text-center">পূর্ণমান</th>
                        <th className="p-3 text-center">প্রাপ্ত নম্বর</th>
                        <th className="p-3 text-center">শতকরা (%)</th>
                        <th className="p-3 text-center">গ্রেড</th>
                        <th className="p-3 text-center">ফলাফল</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {examResultsData.meritList.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400">
                            এই পরীক্ষার কোনো রেজাল্ট বা মার্কস এখনো এন্ট্রি করা হয়নি
                          </td>
                        </tr>
                      ) : (
                        examResultsData.meritList.map((m: any) => (
                          <tr key={m.markId} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3 text-center">
                              {m.rank <= 3 ? (
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-xs ${
                                  m.rank === 1 ? 'bg-amber-500 shadow-xs' : m.rank === 2 ? 'bg-slate-400' : 'bg-amber-700'
                                }`}>
                                  {toBengaliNumber(m.rank)}
                                </span>
                              ) : (
                                <span className="font-bold text-slate-600">
                                  {toBengaliNumber(m.rank)}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center font-bold text-indigo-600">
                              {m.rollNumber ? toBengaliNumber(m.rollNumber) : '-'}
                            </td>
                            <td className="p-3 font-mono text-slate-700">{m.studentId}</td>
                            <td className="p-3 font-bold text-slate-900">
                              {m.nameBn || m.nameEn}
                            </td>
                            <td className="p-3 text-center text-slate-500">
                              {toBengaliNumber(m.fullMarks)}
                            </td>
                            <td className="p-3 text-center font-black text-indigo-600 text-sm">
                              {toBengaliNumber(m.obtainedMarks)}
                            </td>
                            <td className="p-3 text-center font-semibold text-slate-700">
                              {toBengaliNumber(m.percentage)}%
                            </td>
                            <td className="p-3 text-center font-black">
                              <Badge
                                variant={
                                  m.grade === 'A+' ? 'success' : m.grade === 'F' ? 'danger' : 'primary'
                                }
                              >
                                {m.grade}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              {m.isPassed ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                                  <FiCheckCircle className="w-3.5 h-3.5" /> উত্তীর্ণ
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-500 font-bold">
                                  <FiXCircle className="w-3.5 h-3.5" /> অনুত্তীর্ণ
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* TAB 4: FEE COLLECTIONS REPORT */}
          {activeTab === 'fees' && feeCollectionsData && (
            <Card className="border-slate-200 overflow-hidden shadow-xs">
              <CardHeader
                title="ফি কালেকশন ও রাজস্ব বিবরণী"
                subtitle={`মোট আদায়কৃত রাজস্ব: ${formatCurrency(feeCollectionsData.summary.totalPaid)} • মোট রসিদ: ${toBengaliNumber(feeCollectionsData.totalRecords)}টি`}
                className="no-print"
              />
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="p-3">রসিদ নং</th>
                        <th className="p-3">তারিখ</th>
                        <th className="p-3">শিক্ষার্থী</th>
                        <th className="p-3">শ্রেণি ও ব্যাচ</th>
                        <th className="p-3">ফি-এর ধরন</th>
                        <th className="p-3 text-right">নির্ধারিত</th>
                        <th className="p-3 text-right">ছাড়</th>
                        <th className="p-3 text-right">আদায়কৃত</th>
                        <th className="p-3 text-center">পদ্ধতি</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {feeCollectionsData.collections.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400">
                            কোনো ফি কালেকশন রেকর্ড পাওয়া যায়নি
                          </td>
                        </tr>
                      ) : (
                        feeCollectionsData.collections.map((c: any) => (
                          <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3 font-mono font-bold text-indigo-600">
                              {c.receiptNo}
                            </td>
                            <td className="p-3 text-slate-600">
                              {formatDate(c.paymentDate, 'dd/MM/yyyy')}
                            </td>
                            <td className="p-3 font-semibold text-slate-900">
                              {c.studentName}
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {c.studentId}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600">
                              {c.classLevel} - {c.batchName}
                            </td>
                            <td className="p-3 text-slate-700">
                              {c.feeMonth || c.feeType}
                            </td>
                            <td className="p-3 text-right text-slate-500">
                              {formatCurrency(c.amount)}
                            </td>
                            <td className="p-3 text-right text-red-500 font-medium">
                              {c.discount > 0 ? `-${formatCurrency(c.discount)}` : '৳০'}
                            </td>
                            <td className="p-3 text-right font-black text-emerald-600">
                              {formatCurrency(c.paidAmount)}
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant="primary" className="text-[10px]">
                                {c.paymentMethod}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* TAB 5: DUES REPORT */}
          {activeTab === 'dues' && duesData && (
            <Card className="border-slate-200 overflow-hidden shadow-xs">
              <CardHeader
                title="বকেয়া ফি তালিকা বিবরণী"
                subtitle={`সর্বমোট বকেয়া: ${formatCurrency(duesData.grandTotalDue)} • মোট বকেয়াদার শিক্ষার্থী: ${toBengaliNumber(duesData.totalDueStudents)} জন`}
                className="no-print"
              />
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="p-3 w-12 text-center">ক্রমিক</th>
                        <th className="p-3 w-16 text-center">রোল</th>
                        <th className="p-3">আইডি</th>
                        <th className="p-3">শিক্ষার্থীর নাম</th>
                        <th className="p-3">শ্রেণি ও ব্যাচ</th>
                        <th className="p-3">অভিভাবকের ফোন</th>
                        <th className="p-3">বকেয়া মাসসমূহ</th>
                        <th className="p-3 text-right">বকেয়ার পরিমাণ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {duesData.students.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            কোনো বকেয়া ফি নেই!
                          </td>
                        </tr>
                      ) : (
                        duesData.students.map((d: any, idx: number) => (
                          <tr key={d.systemId} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3 text-center text-slate-400 font-semibold">
                              {toBengaliNumber(idx + 1)}
                            </td>
                            <td className="p-3 text-center font-bold text-indigo-600">
                              {d.rollNumber ? toBengaliNumber(d.rollNumber) : '-'}
                            </td>
                            <td className="p-3 font-mono text-slate-700">{d.studentId}</td>
                            <td className="p-3 font-bold text-slate-900">
                              {d.nameBn || d.nameEn}
                            </td>
                            <td className="p-3 text-slate-600">
                              {d.classLevel} - {d.batchName}
                            </td>
                            <td className="p-3 font-mono text-slate-600">
                              {d.guardianPhone || d.phone || '-'}
                            </td>
                            <td className="p-3 text-slate-600">
                              {d.dueMonths.length > 0 ? d.dueMonths.join(', ') : 'চলতি বকেয়া'}
                            </td>
                            <td className="p-3 text-right font-black text-red-600">
                              {formatCurrency(d.totalDue)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* TAB 6: FINANCE & BALANCE SHEET */}
          {activeTab === 'finance' && financeData && (
            <div className="space-y-6">
              {/* Summary 4-cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-slate-200">
                  <CardBody className="p-4 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">মোট আদায় (আয়)</span>
                    <p className="text-2xl font-black text-emerald-600">
                      {formatCurrency(financeData.summary.totalIncome)}
                    </p>
                  </CardBody>
                </Card>
                <Card className="border-slate-200">
                  <CardBody className="p-4 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">মোট খরচ (ব্যয়)</span>
                    <p className="text-2xl font-black text-red-500">
                      {formatCurrency(financeData.summary.totalExpense)}
                    </p>
                  </CardBody>
                </Card>
                <Card className="border-slate-200">
                  <CardBody className="p-4 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">নেট উদ্বৃত্ত / লাভ</span>
                    <p className="text-2xl font-black text-indigo-600">
                      {formatCurrency(financeData.summary.netProfit)}
                    </p>
                  </CardBody>
                </Card>
                <Card className="border-slate-200">
                  <CardBody className="p-4 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">লাভের মার্জিন</span>
                    <p className="text-2xl font-black text-slate-800">
                      {toBengaliNumber(financeData.summary.profitMargin)}%
                    </p>
                  </CardBody>
                </Card>
              </div>

              {/* Categorized Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-slate-200">
                  <CardHeader title="আয় বিবরণী (ফি-এর খাতসমূহ)" />
                  <CardBody className="p-4">
                    <div className="space-y-2.5">
                      {Object.entries(financeData.incomeByType).length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">কোনো আয়ের রেকর্ড নেই</p>
                      ) : (
                        Object.entries(financeData.incomeByType).map(([k, v]: any) => (
                          <div key={k} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                            <span className="font-semibold text-slate-700">{k}</span>
                            <span className="font-bold text-emerald-600">{formatCurrency(v)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </CardBody>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader title="ব্যয় বিবরণী (খরচের খাতসমূহ)" />
                  <CardBody className="p-4">
                    <div className="space-y-2.5">
                      {Object.entries(financeData.expenseByCategory).length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">কোনো ব্যয়ের রেকর্ড নেই</p>
                      ) : (
                        Object.entries(financeData.expenseByCategory).map(([k, v]: any) => (
                          <div key={k} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                            <span className="font-semibold text-slate-700">{k}</span>
                            <span className="font-bold text-red-500">{formatCurrency(v)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 7: SMS LOGS REPORT */}
          {activeTab === 'sms' && smsData && (
            <Card className="border-slate-200 overflow-hidden shadow-xs">
              <CardHeader
                title="এসএমএস ডেলিভারি ও গেটওয়ে অডিট"
                subtitle={`মোট প্রেরিত: ${toBengaliNumber(smsData.stats.totalSent)} • ব্যর্থ: ${toBengaliNumber(smsData.stats.totalFailed)} • ডেলিভারি হার: ${toBengaliNumber(smsData.stats.deliveryRate)}%`}
                className="no-print"
              />
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="p-3">তারিখ ও সময়</th>
                        <th className="p-3">প্রাপক ফোন</th>
                        <th className="p-3">টাইপ</th>
                        <th className="p-3">স্ট্যাটাস</th>
                        <th className="p-3">মেসেজ টেক্সট</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {smsData.logs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">
                            কোনো এসএমএস লগ পাওয়া যায়নি
                          </td>
                        </tr>
                      ) : (
                        smsData.logs.map((l: any) => (
                          <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3 text-slate-600 whitespace-nowrap">
                              {formatDate(l.createdAt, 'dd/MM/yyyy hh:mm a')}
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-800">
                              {l.phone}
                            </td>
                            <td className="p-3">
                              <Badge variant="primary" className="text-[10px]">
                                {l.type}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Badge variant={l.status === 'SENT' ? 'success' : 'danger'} className="text-[10px]">
                                {l.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-slate-600 max-w-md truncate">
                              {l.message}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
