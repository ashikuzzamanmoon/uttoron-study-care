'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../../../lib/api';
import { Button } from '../../../../../components/ui/Button';
import { Badge } from '../../../../../components/ui/Badge';
import { Card, CardBody, CardHeader } from '../../../../../components/ui/Card';
import { Spinner } from '../../../../../components/ui/Loader';
import {
  FiArrowLeft,
  FiFileText,
  FiAward,
  FiCheckCircle,
  FiSave,
  FiSend,
  FiAlertCircle,
  FiTrendingUp,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { calculateGrade, calculateGpa, toBengaliNumber, formatDate } from '../../../../../lib/utils';

interface StudentRosterRow {
  studentId: string;
  rollNumber?: number | null;
  student: {
    id: string;
    studentId: string;
    nameBn?: string | null;
    nameEn: string;
    phone?: string | null;
    guardianPhone?: string | null;
    photo?: string | null;
  };
  markId?: string | null;
  obtainedMarks: number | null | '';
  remarks?: string;
}

export default function ExamMarksEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const examId = resolvedParams.id;

  const [exam, setExam] = useState<any | null>(null);
  const [roster, setRoster] = useState<StudentRosterRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [publishImmediately, setPublishImmediately] = useState(true);
  const [sendResultSms, setSendResultSms] = useState(false);

  // Fetch exam roster & existing marks
  const fetchMarksData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/marks/exam/${examId}`);
      const data = res.data?.data || {};

      setExam(data.exam || null);

      const rawRoster = data.roster || [];
      const prepared: StudentRosterRow[] = rawRoster.map((item: any) => ({
        studentId: item.studentId,
        rollNumber: item.rollNumber,
        student: item.student,
        markId: item.markId,
        obtainedMarks: item.obtainedMarks !== null ? item.obtainedMarks : '',
        remarks: item.remarks || '',
      }));

      setRoster(prepared);
      if (data.exam) {
        setPublishImmediately(Boolean(data.exam.isPublished));
      }
    } catch (err: any) {
      console.error('Failed to load marks roster:', err);
      toast.error('মার্কস শিট লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchMarksData();
  }, [fetchMarksData]);

  // Handle single student marks change
  const handleMarksChange = (studentId: string, val: string) => {
    const num = val === '' ? '' : Math.max(0, Number(val));
    setRoster((prev) =>
      prev.map((row) => (row.studentId === studentId ? { ...row, obtainedMarks: num } : row)),
    );
  };

  // Handle remarks change
  const handleRemarksChange = (studentId: string, val: string) => {
    setRoster((prev) =>
      prev.map((row) => (row.studentId === studentId ? { ...row, remarks: val } : row)),
    );
  };

  // Quick keyboard navigation: Jump to next input on Enter
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextInput = document.getElementById(`mark-input-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  // Bulk submit
  const handleSaveMarks = async () => {
    const marksToSubmit = roster
      .filter((r) => r.obtainedMarks !== '' && r.obtainedMarks !== null)
      .map((r) => ({
        studentId: r.studentId,
        obtainedMarks: Number(r.obtainedMarks),
        remarks: r.remarks ? r.remarks.trim() : undefined,
      }));

    if (marksToSubmit.length === 0) {
      toast.error('অন্তত একজন শিক্ষার্থীর নম্বর প্রদান করুন');
      return;
    }

    // Validate marks does not exceed full marks
    const fullMarks = exam?.fullMarks || 100;
    const invalid = marksToSubmit.find((m) => m.obtainedMarks > fullMarks);
    if (invalid) {
      toast.error(`প্রাপ্ত নম্বর পূর্ণমানের (${fullMarks}) চেয়ে বেশি হতে পারে না`);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        marks: marksToSubmit,
        publishImmediately,
        sendResultSms,
      };

      const res = await api.post(`/marks/exam/${examId}`, payload);
      const data = res.data?.data || {};

      toast.success(res.data?.message || 'মার্কস সফলভাবে সংরক্ষিত হয়েছে');

      if (data.smsSentCount > 0) {
        toast.success(
          `${toBengaliNumber(data.smsSentCount)} জন অভিভাবকের কাছে ফলাফল এসএমএস পাঠানো হয়েছে`,
        );
      }

      fetchMarksData();
    } catch (err: any) {
      console.error('Failed to submit marks:', err);
      toast.error(err.response?.data?.message || 'মার্কস সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs sm:text-sm text-slate-500 font-medium">মার্কস শিট লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <Card>
        <CardBody className="py-16 text-center">
          <p className="text-slate-500 text-sm">পরীক্ষাটি খুঁজে পাওয়া যায়নি।</p>
          <Link href="/exams" className="mt-4 inline-block">
            <Button variant="secondary" size="sm" leftIcon={<FiArrowLeft />}>
              পরীক্ষার তালিকায় ফিরুন
            </Button>
          </Link>
        </CardBody>
      </Card>
    );
  }

  const fullMarks = exam.fullMarks || 100;
  const passMarks = exam.passMarks || 33;

  // Real-time roster statistics
  const enteredMarksList = roster
    .map((r) => r.obtainedMarks)
    .filter((m): m is number => m !== '' && m !== null);

  const highestEntered = enteredMarksList.length > 0 ? Math.max(...enteredMarksList) : 0;
  const passedEntered = enteredMarksList.filter((m) => m >= passMarks).length;
  const averageEntered =
    enteredMarksList.length > 0
      ? Math.round(
          (enteredMarksList.reduce((acc, curr) => acc + curr, 0) / enteredMarksList.length) * 10,
        ) / 10
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/exams">
            <Button variant="secondary" size="sm" leftIcon={<FiArrowLeft />}>
              ফিরে যান
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {exam.name}
              </h1>
              <Badge variant={exam.isPublished ? 'success' : 'neutral'}>
                {exam.isPublished ? 'প্রকাশিত (Published)' : 'অপ্রকাশিত'}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              ব্যাচ: <span className="font-semibold text-slate-800">{exam.batch?.name}</span> • বিষয়:{' '}
              <span className="font-semibold text-slate-800">{exam.subject?.name}</span> • পূর্ণমান:{' '}
              <span className="font-semibold text-slate-800">{toBengaliNumber(fullMarks)}</span> • পাস মার্ক:{' '}
              <span className="font-semibold text-slate-800">{toBengaliNumber(passMarks)}</span> • তারিখ:{' '}
              <span className="font-semibold text-slate-800">{formatDate(exam.examDate)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/results?examId=${exam.id}`}>
            <Button variant="secondary" size="md" leftIcon={<FiAward />}>
              মেরিট লিস্ট দেখুন
            </Button>
          </Link>

          <Button
            variant="primary"
            size="md"
            onClick={handleSaveMarks}
            isLoading={isSubmitting}
            leftIcon={<FiSave />}
          >
            মার্কস সংরক্ষণ করুন
          </Button>
        </div>
      </div>

      {/* Real-time KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              <FiFileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium">মার্কস এন্ট্রি সংখ্যা</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {toBengaliNumber(enteredMarksList.length)} / {toBengaliNumber(roster.length)} জন
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
              <FiAward className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium">সর্বোচ্চ নম্বর</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {enteredMarksList.length > 0 ? toBengaliNumber(highestEntered) : '—'} /{' '}
                {toBengaliNumber(fullMarks)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-sm">
              <FiTrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium">গড় নম্বর</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {enteredMarksList.length > 0 ? toBengaliNumber(averageEntered) : '—'}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium">উত্তীর্ণ শিক্ষার্থী</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {enteredMarksList.length > 0
                  ? `${toBengaliNumber(passedEntered)} জন (${toBengaliNumber(
                      Math.round((passedEntered / enteredMarksList.length) * 100),
                    )}%)`
                  : '—'}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Spreadsheet Marks Entry Table Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              স্প্রেডশিট মার্কস এন্ট্রি শিট
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              কীবোর্ডের <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px]">Tab</kbd> বা{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px]">Enter</kbd> প্রেস করে পরের ঘরে যান
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <span>মোট পূর্ণমান: <strong className="text-indigo-600">{toBengaliNumber(fullMarks)}</strong></span>
            <span>পাস নম্বর: <strong className="text-emerald-600">{toBengaliNumber(passMarks)}</strong></span>
          </div>
        </CardHeader>

        {roster.length === 0 ? (
          <CardBody className="py-16 text-center text-slate-500 text-sm">
            এই ব্যাচে কোনো শিক্ষার্থী নেই।
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700">
                  <th className="p-3 w-16 text-center font-bold">রোল</th>
                  <th className="p-3 font-bold min-w-48">শিক্ষার্থীর নাম</th>
                  <th className="p-3 font-bold w-28">আইডি</th>
                  <th className="p-3 font-bold w-40 text-center">প্রাপ্ত নম্বর (Marks)</th>
                  <th className="p-3 font-bold w-24 text-center">গ্রেড</th>
                  <th className="p-3 font-bold w-24 text-center">জিপিএ</th>
                  <th className="p-3 font-bold w-28 text-center">ফলাফল</th>
                  <th className="p-3 font-bold min-w-44">মন্তব্য (ঐচ্ছিক)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roster.map((row, idx) => {
                  const marksVal = row.obtainedMarks;
                  const hasMarks = marksVal !== '' && marksVal !== null;
                  const marksNum = Number(marksVal);
                  const grade = hasMarks ? calculateGrade(marksNum, fullMarks) : '—';
                  const gpa = hasMarks ? calculateGpa(grade) : '—';
                  const isPassed = hasMarks && marksNum >= passMarks;

                  return (
                    <tr
                      key={row.studentId}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Roll */}
                      <td className="p-3 text-center font-bold text-slate-700">
                        {row.rollNumber ? toBengaliNumber(row.rollNumber) : toBengaliNumber(idx + 1)}
                      </td>

                      {/* Name */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {(row.student.nameBn || row.student.nameEn || 'S').slice(0, 1)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block truncate">
                              {row.student.nameBn || row.student.nameEn}
                            </span>
                            {row.student.nameBn && (
                              <span className="text-[11px] text-slate-400 block truncate">
                                {row.student.nameEn}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Student ID */}
                      <td className="p-3 font-mono text-xs text-slate-500">
                        {row.student.studentId}
                      </td>

                      {/* Marks Input */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            id={`mark-input-${idx}`}
                            type="number"
                            min="0"
                            max={fullMarks}
                            step="0.5"
                            placeholder="0"
                            value={marksVal ?? ''}
                            tabIndex={idx + 1}
                            onChange={(e) => handleMarksChange(row.studentId, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            className={`w-24 px-3 py-1.5 text-center font-bold text-sm sm:text-base rounded-xl border transition-all focus:outline-hidden focus:ring-2 ${
                              marksNum > fullMarks
                                ? 'border-rose-500 bg-rose-50 text-rose-700 focus:ring-rose-500/20'
                                : hasMarks
                                ? 'border-indigo-300 bg-white text-indigo-900 focus:ring-indigo-500/20'
                                : 'border-slate-200 bg-slate-50 text-slate-800 focus:ring-indigo-500/20'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Real-time Grade */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-xs ${
                            grade === 'A+' || grade === 'A' || grade === 'A-'
                              ? 'bg-emerald-100 text-emerald-800'
                              : grade === 'B' || grade === 'C' || grade === 'D'
                              ? 'bg-amber-100 text-amber-800'
                              : grade === 'F'
                              ? 'bg-rose-100 text-rose-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {grade}
                        </span>
                      </td>

                      {/* Real-time GPA */}
                      <td className="p-3 text-center font-semibold text-slate-700">
                        {hasMarks ? toBengaliNumber(gpa) : '—'}
                      </td>

                      {/* Pass/Fail Status */}
                      <td className="p-3 text-center">
                        {hasMarks ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isPassed
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isPassed ? 'উত্তীর্ণ' : 'অকৃতকার্য'}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">বাকি</span>
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder="মন্তব্য..."
                          value={row.remarks || ''}
                          onChange={(e) => handleRemarksChange(row.studentId, e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Options & Save Bar */}
        <CardBody className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs font-semibold text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={publishImmediately}
                onChange={(e) => setPublishImmediately(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
              />
              <span>ফলাফল অবিলম্বে শিক্ষার্থীদের জন্য প্রকাশ (Publish) করুন</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendResultSms}
                onChange={(e) => setSendResultSms(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
              />
              <span>অভিভাবকদের নম্বরে স্বয়ংক্রিয় ফলাফল এসএমএস পাঠান</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveMarks}
              isLoading={isSubmitting}
              leftIcon={<FiSave />}
            >
              মার্কস সংরক্ষণ করুন
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
