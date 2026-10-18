'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../../../components/ui/Card';
import { Spinner } from '../../../../components/ui/Loader';
import {
  FiArrowLeft,
  FiPrinter,
  FiDownload,
  FiLayers,
  FiCalendar,
  FiTrendingUp,
  FiAlertTriangle,
  FiUserCheck,
  FiBarChart2,
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { toBengaliNumber } from '../../../../lib/utils';

const MONTH_OPTIONS = [
  { value: 1, label: 'জানুয়ারি (January)' },
  { value: 2, label: 'ফেব্রুয়ারি (February)' },
  { value: 3, label: 'মার্চ (March)' },
  { value: 4, label: 'এপ্রিল (April)' },
  { value: 5, label: 'মে (May)' },
  { value: 6, label: 'জুন (June)' },
  { value: 7, label: 'জুলাই (July)' },
  { value: 8, label: 'আগস্ট (August)' },
  { value: 9, label: 'সেপ্টেম্বর (September)' },
  { value: 10, label: 'অক্টোবর (October)' },
  { value: 11, label: 'নভেম্বর (November)' },
  { value: 12, label: 'ডিসেম্বর (December)' },
];

function AttendanceReportContent() {
  const searchParams = useSearchParams();
  const queryBatchId = searchParams.get('batchId') || '';

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(queryBatchId);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Fetch batches
  useEffect(() => {
    async function fetchBatches() {
      try {
        setIsLoadingBatches(true);
        const res = await api.get('/batches', { params: { limit: 100 } });
        const list = res.data?.data || [];
        setBatches(list);

        if (list.length > 0) {
          if (queryBatchId && list.some((b: any) => b.id === queryBatchId)) {
            setSelectedBatchId(queryBatchId);
          } else {
            setSelectedBatchId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load batches:', err);
        toast.error('ব্যাচ তালিকা লোড করতে সমস্যা হয়েছে');
      } finally {
        setIsLoadingBatches(false);
      }
    }
    fetchBatches();
  }, [queryBatchId]);

  // Fetch monthly report
  const fetchReport = useCallback(async () => {
    if (!selectedBatchId) return;

    try {
      setIsLoadingReport(true);
      const res = await api.get('/attendance/report', {
        params: {
          batchId: selectedBatchId,
          month: selectedMonth,
          year: selectedYear,
        },
      });

      setReportData(res.data?.data || null);
    } catch (err: any) {
      console.error('Failed to load report:', err);
      toast.error('হাজিরা রিপোর্ট লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsLoadingReport(false);
    }
  }, [selectedBatchId, selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedBatchId) {
      fetchReport();
    }
  }, [selectedBatchId, selectedMonth, selectedYear, fetchReport]);

  // Export to Excel
  const handleExportExcel = () => {
    if (!reportData || !reportData.studentSummaries?.length) {
      toast.error('এক্সপোর্ট করার মতো কোনো ডেটা নেই');
      return;
    }

    const rows = reportData.studentSummaries.map((item: any, idx: number) => ({
      'রোল নং': item.rollNumber || idx + 1,
      'শিক্ষার্থীর নাম': item.student?.nameBn || item.student?.nameEn || '',
      'আইডি': item.student?.studentId || '',
      'মোট ক্লাস দিবস': reportData.totalClassDays,
      'উপস্থিত': item.summary.present,
      'দেরি': item.summary.late,
      'অনুপস্থিত': item.summary.absent,
      'ছুটি': item.summary.excused,
      'উপস্থিতির হার (%)': `${item.summary.percentage}%`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');
    XLSX.writeFile(
      workbook,
      `attendance_report_${reportData.batch?.name}_${selectedMonth}_${selectedYear}.xlsx`,
    );
    toast.success('এক্সেল ফাইল ডাউনলোড শুরু হয়েছে');
  };

  const totalClassDays = reportData?.totalClassDays || 0;
  const studentSummaries = reportData?.studentSummaries || [];
  const distinctDates = reportData?.distinctDates || [];

  // Calculate Batch Average Percentage
  const averagePercentage =
    studentSummaries.length > 0
      ? Math.round(
          studentSummaries.reduce((acc: number, curr: any) => acc + curr.summary.percentage, 0) /
            studentSummaries.length,
        )
      : 0;

  // Count students below 75%
  const lowAttendanceCount = studentSummaries.filter(
    (s: any) => s.summary.percentage < 75,
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link href={`/attendance?batchId=${selectedBatchId}`}>
            <Button variant="secondary" size="sm" leftIcon={<FiArrowLeft />}>
              হাজিরা গ্রহণে ফিরুন
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <FiBarChart2 className="w-6 h-6" />
              </span>
              মাসিক হাজিরা রিপোর্ট ও অ্যানালিটিক্স
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              ব্যাচভিত্তিক মাসিক ক্লাস উপস্থিতির হার, অ্যানালাইসিস ও প্রিন্ট প্রস্তুত শিট
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportExcel}
            disabled={!reportData || studentSummaries.length === 0}
            leftIcon={<FiDownload />}
          >
            এক্সপোর্ট এক্সেল
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => window.print()}
            disabled={!reportData || studentSummaries.length === 0}
            leftIcon={<FiPrinter />}
          >
            প্রিন্ট রিপোর্ট
          </Button>
        </div>
      </div>

      {/* Control Selector Bar */}
      <Card className="print:hidden">
        <CardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Batch Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FiLayers className="w-3.5 h-3.5 text-indigo-600" />
                ব্যাচ নির্বাচন করুন
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                disabled={isLoadingBatches}
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.classLevel} {b.group ? `- ${b.group}` : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FiCalendar className="w-3.5 h-3.5 text-indigo-600" />
                মাস নির্বাচন করুন
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FiCalendar className="w-3.5 h-3.5 text-indigo-600" />
                বছর (Year)
              </label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* KPI Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
          <Card>
            <CardBody className="p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <FiCalendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">মোট ক্লাস দিবস</p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {toBengaliNumber(totalClassDays)} দিন
                </h3>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <FiTrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">গড় উপস্থিতি হার</p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {toBengaliNumber(averagePercentage)}%
                </h3>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center shrink-0">
                <FiUserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">মোট শিক্ষার্থী</p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {toBengaliNumber(studentSummaries.length)} জন
                </h3>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                <FiAlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">ঝুঁকিপূর্ণ (&lt;৭৫%)</p>
                <h3 className="text-lg font-bold text-rose-600 mt-0.5">
                  {toBengaliNumber(lowAttendanceCount)} জন
                </h3>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Printable Header (Visible only on print) */}
      <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-slate-800">
        <h2 className="text-xl font-bold text-slate-900">উত্তরণ স্টাডি কেয়ার</h2>
        <p className="text-xs text-slate-600 mt-0.5">
          মাসিক উপস্থিতি বিবরণী (Monthly Attendance Sheet)
        </p>
        {reportData?.batch && (
          <p className="text-xs font-semibold text-slate-800 mt-1.5">
            ব্যাচ: {reportData.batch.name} • শ্রেণি: {reportData.batch.classLevel}
            {reportData.batch.group ? ` • গ্রুপ: ${reportData.batch.group}` : ''}
            • মাস: {MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label} • বছর: {toBengaliNumber(selectedYear)}
          </p>
        )}
      </div>

      {/* Detailed Attendance Matrix Table */}
      <Card>
        <CardHeader className="flex items-center justify-between p-4 border-b border-slate-100 print:hidden">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">
            শিক্ষার্থীভিত্তিক দৈনিক উপস্থিতি ও পার্সেন্টেজ
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> P = উপস্থিত
            </span>
            <span className="flex items-center gap-1 font-semibold text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> A = অনুপস্থিত
            </span>
            <span className="flex items-center gap-1 font-semibold text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> L = দেরি
            </span>
            <span className="flex items-center gap-1 font-semibold text-sky-700">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span> E = ছুটি
            </span>
          </div>
        </CardHeader>

        {isLoadingReport ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-xs sm:text-sm text-slate-500 font-medium">রিপোর্ট তৈরি হচ্ছে...</p>
          </div>
        ) : studentSummaries.length === 0 ? (
          <CardBody className="py-16 text-center">
            <FiBarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-sm text-slate-800">কোনো হাজিরা রেকর্ড পাওয়া যায়নি</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              এই মাসে উল্লেখিত ব্যাচে এখনও কোনো ক্লাসের হাজিরা গ্রহণ করা হয়নি।
            </p>
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700">
                  <th className="p-3 font-bold w-12 text-center">রোল</th>
                  <th className="p-3 font-bold min-w-44">শিক্ষার্থীর নাম</th>
                  <th className="p-3 font-bold min-w-28">আইডি</th>

                  {/* Day Date Headers */}
                  {distinctDates.map((dateStr: string) => {
                    const dayNum = dateStr.slice(8, 10);
                    return (
                      <th
                        key={dateStr}
                        className="p-2 font-bold text-center border-l border-slate-200/60 min-w-8"
                        title={dateStr}
                      >
                        {toBengaliNumber(Number(dayNum))}
                      </th>
                    );
                  })}

                  <th className="p-3 font-bold text-center bg-emerald-50/50 text-emerald-800 border-l border-slate-200">
                    উপস্থিত
                  </th>
                  <th className="p-3 font-bold text-center bg-rose-50/50 text-rose-800 border-l border-slate-200">
                    অনুপস্থিত
                  </th>
                  <th className="p-3 font-bold text-center bg-indigo-50/50 text-indigo-800 border-l border-slate-200 min-w-24">
                    হার (%)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentSummaries.map((item: any, idx: number) => {
                  const pct = item.summary.percentage;
                  return (
                    <tr
                      key={item.studentId}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="p-3 text-center font-bold text-slate-700">
                        {item.rollNumber ? toBengaliNumber(item.rollNumber) : toBengaliNumber(idx + 1)}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        <Link
                          href={`/students/${item.studentId}`}
                          className="hover:text-indigo-600 transition-colors"
                        >
                          {item.student?.nameBn || item.student?.nameEn}
                        </Link>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {item.student?.studentId}
                      </td>

                      {/* Day cells */}
                      {distinctDates.map((dateStr: string) => {
                        const status = item.attendanceByDate[dateStr];
                        if (status === 'PRESENT') {
                          return (
                            <td
                              key={dateStr}
                              className="p-1 text-center font-bold text-emerald-700 bg-emerald-50/40 border-l border-slate-100"
                            >
                              P
                            </td>
                          );
                        } else if (status === 'ABSENT') {
                          return (
                            <td
                              key={dateStr}
                              className="p-1 text-center font-bold text-rose-700 bg-rose-50/60 border-l border-slate-100"
                            >
                              A
                            </td>
                          );
                        } else if (status === 'LATE') {
                          return (
                            <td
                              key={dateStr}
                              className="p-1 text-center font-bold text-amber-700 bg-amber-50/40 border-l border-slate-100"
                            >
                              L
                            </td>
                          );
                        } else if (status === 'EXCUSED') {
                          return (
                            <td
                              key={dateStr}
                              className="p-1 text-center font-bold text-sky-700 bg-sky-50/40 border-l border-slate-100"
                            >
                              E
                            </td>
                          );
                        }
                        return (
                          <td
                            key={dateStr}
                            className="p-1 text-center text-slate-300 border-l border-slate-100"
                          >
                            —
                          </td>
                        );
                      })}

                      <td className="p-3 text-center font-bold text-emerald-700 border-l border-slate-200">
                        {toBengaliNumber(item.summary.present + item.summary.late)}
                      </td>
                      <td className="p-3 text-center font-bold text-rose-700 border-l border-slate-200">
                        {toBengaliNumber(item.summary.absent)}
                      </td>
                      <td className="p-3 border-l border-slate-200">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-xs ${
                              pct >= 80
                                ? 'text-emerald-700'
                                : pct >= 60
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {toBengaliNumber(pct)}%
                          </span>
                          <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden min-w-10">
                            <div
                              className={`h-full rounded-full ${
                                pct >= 80
                                  ? 'bg-emerald-600'
                                  : pct >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AttendanceReportPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">রিপোর্ট লোড হচ্ছে...</p>
        </div>
      }
    >
      <AttendanceReportContent />
    </Suspense>
  );
}
