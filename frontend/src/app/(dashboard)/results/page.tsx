'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Loader';
import { Modal } from '../../../components/ui/Modal';
import {
  FiAward,
  FiPrinter,
  FiSend,
  FiEdit3,
  FiFileText,
  FiLayers,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiEye,
  FiDownload,
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { toBengaliNumber, formatDate } from '../../../lib/utils';

function ResultSheetContent() {
  const searchParams = useSearchParams();
  const queryExamId = searchParams.get('examId') || '';

  const [batches, setBatches] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>(queryExamId);

  const [resultData, setResultData] = useState<any | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Modal for individual result card
  const [selectedStudentResult, setSelectedStudentResult] = useState<any | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Action states
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Load batches & exams
  useEffect(() => {
    async function loadBatchesAndExams() {
      try {
        setIsLoadingMetadata(true);
        const [bRes, eRes] = await Promise.all([
          api.get('/batches', { params: { limit: 100 } }),
          api.get('/exams', { params: { limit: 100 } }),
        ]);

        const batchList = bRes.data?.data || [];
        const examList = eRes.data?.data || [];

        setBatches(batchList);
        setExams(examList);

        if (queryExamId && examList.some((e: any) => e.id === queryExamId)) {
          setSelectedExamId(queryExamId);
          const foundExam = examList.find((e: any) => e.id === queryExamId);
          if (foundExam?.batchId) {
            setSelectedBatchId(foundExam.batchId);
          }
        } else if (examList.length > 0) {
          setSelectedExamId(examList[0].id);
          if (examList[0].batchId) {
            setSelectedBatchId(examList[0].batchId);
          }
        }
      } catch (err) {
        console.error('Failed to load initial results metadata:', err);
        toast.error('মেটাডাটা লোড করতে সমস্যা হয়েছে');
      } finally {
        setIsLoadingMetadata(false);
      }
    }
    loadBatchesAndExams();
  }, [queryExamId]);

  // Fetch result sheet
  const fetchResultSheet = useCallback(async () => {
    if (!selectedExamId) return;

    try {
      setIsLoadingResults(true);
      const res = await api.get(`/marks/result/${selectedExamId}`);
      setResultData(res.data?.data || null);
    } catch (err: any) {
      console.error('Failed to load result sheet:', err);
      toast.error('রেজাল্ট শিট লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setIsLoadingResults(false);
    }
  }, [selectedExamId]);

  useEffect(() => {
    if (selectedExamId) {
      fetchResultSheet();
    }
  }, [selectedExamId, fetchResultSheet]);

  // Filter exams by batch
  const filteredExams = selectedBatchId
    ? exams.filter((e) => e.batchId === selectedBatchId)
    : exams;

  // Toggle publish
  const handleTogglePublish = async () => {
    if (!resultData?.exam?.id) return;
    try {
      setIsPublishing(true);
      const currentState = Boolean(resultData.exam.isPublished);
      const res = await api.patch(`/exams/${resultData.exam.id}/publish`, {
        isPublished: !currentState,
      });

      toast.success(res.data?.message || 'পাবলিশ স্ট্যাটাস সফলভাবে পরিবর্তিত হয়েছে');
      fetchResultSheet();
    } catch (err: any) {
      console.error('Failed to toggle publish:', err);
      toast.error(err.response?.data?.message || 'পাবলিশ স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে');
    } finally {
      setIsPublishing(false);
    }
  };

  // Trigger result SMS
  const handleSendResultSms = async () => {
    if (!selectedExamId) return;
    if (!confirm('আপনি কি এই পরীক্ষার সকল শিক্ষার্থীর অভিভাবকদের ফলাফল এসএমএস পাঠাতে চান?')) {
      return;
    }

    try {
      setIsSendingSms(true);
      const res = await api.post(`/marks/exam/${selectedExamId}/trigger-sms`);
      toast.success(res.data?.message || 'ফলাফল এসএমএস সফলভাবে পাঠানো হয়েছে');
    } catch (err: any) {
      console.error('Failed to send result SMS:', err);
      toast.error(err.response?.data?.message || 'এসএমএস পাঠাতে সমস্যা হয়েছে');
    } finally {
      setIsSendingSms(false);
    }
  };

  // Open individual result card modal
  const handleOpenResultCard = (studentResult: any) => {
    setSelectedStudentResult(studentResult);
    setIsCardModalOpen(true);
  };

  const exam = resultData?.exam;
  const stats = resultData?.stats;
  const meritList = resultData?.meritList || [];

  const handleExportExcel = () => {
    if (!resultData || meritList.length === 0) {
      toast.error('এক্সপোর্ট করার মতো কোনো ফলাফল ডাটা নেই');
      return;
    }

    const exportRows = meritList.map((item: any, idx: number) => ({
      'মেরিট র‍্যাংক': item.rank ?? idx + 1,
      'স্টুডেন্ট আইডি': item.student?.studentId || '-',
      'নাম (বাংলা)': item.student?.nameBn || '-',
      'নাম (ইংরেজি)': item.student?.nameEn || '-',
      'রোল নম্বর': item.rollNumber || '-',
      'শ্রেণি': exam?.batch?.classLevel || '-',
      'পরীক্ষার নাম': exam?.name || '-',
      'বিষয়': exam?.subject?.name || '-',
      'পূর্ণমান': exam?.totalMarks || 100,
      'প্রাপ্ত নম্বর': item.obtainedMarks ?? 0,
      'শতকরা (%)': `${item.percentage ?? 0}%`,
      'লেটার গ্রেড': item.grade || '-',
      'গ্রেড পয়েন্ট (GPA)': item.gpa ?? 0,
      'ফলাফল': (item.gpa ?? 0) > 0 ? 'উত্তীর্ণ (Pass)' : 'অনুত্তীর্ণ (Fail)',
      'মন্তব্য': item.remarks || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Merit List');
    const examTitle = (exam?.name || 'Exam').replace(/[^a-zA-Z0-9_-]/g, '_');
    XLSX.writeFile(workbook, `Uttoron_Merit_List_${examTitle}_${Date.now()}.xlsx`);
    toast.success('রেজাল্ট শিট সফলভাবে এক্সেল ফাইল হিসেবে ডাউনলোড হয়েছে');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FiAward className="w-6 h-6" />
            </span>
            পরীক্ষার ফলাফল ও মেরিট লিস্ট (Result Sheet)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            মেধাক্রম (Merit List) অনুযায়ী পরীক্ষার ফলাফল, রেজাল্ট কার্ড তৈরি ও এসএমএস বিতরণ
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportExcel}
            disabled={!resultData || meritList.length === 0}
            leftIcon={<FiDownload className="text-emerald-600" />}
          >
            এক্সেল এক্সপোর্ট
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => window.print()}
            disabled={!resultData || meritList.length === 0}
            leftIcon={<FiPrinter />}
          >
            প্রিন্ট শিট
          </Button>

          {exam && (
            <Link href={`/exams/${exam.id}/marks`}>
              <Button variant="secondary" size="md" leftIcon={<FiEdit3 />}>
                মার্কস এডিট
              </Button>
            </Link>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={handleSendResultSms}
            disabled={!resultData || meritList.length === 0}
            isLoading={isSendingSms}
            leftIcon={<FiSend />}
          >
            ফলাফল এসএমএস পাঠান
          </Button>
        </div>
      </div>

      {/* Selectors Card */}
      <Card className="print:hidden">
        <CardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Batch Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FiLayers className="w-3.5 h-3.5 text-indigo-600" />
                ব্যাচ নির্বাচন করুন
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  const firstExam = exams.find((ex) => ex.batchId === e.target.value);
                  if (firstExam) {
                    setSelectedExamId(firstExam.id);
                  } else {
                    setSelectedExamId('');
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                disabled={isLoadingMetadata}
              >
                <option value="">-- সকল ব্যাচ --</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.classLevel})
                  </option>
                ))}
              </select>
            </div>

            {/* Exam Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FiFileText className="w-3.5 h-3.5 text-indigo-600" />
                পরীক্ষা নির্বাচন করুন *
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                disabled={isLoadingMetadata || filteredExams.length === 0}
              >
                {filteredExams.length === 0 ? (
                  <option value="">কোনো পরীক্ষা পাওয়া যায়নি</option>
                ) : (
                  filteredExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({formatDate(ex.examDate)})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* KPI Stats Cards */}
      {stats && exam && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
          <Card>
            <CardBody className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                <FiUser className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium">মোট পরীক্ষার্থী</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {toBengaliNumber(stats.totalParticipants)} জন
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                <FiAward className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium">সর্বোচ্চ নম্বর</span>
                <p className="text-lg font-bold text-emerald-800 mt-0.5">
                  {toBengaliNumber(stats.highestMark)} / {toBengaliNumber(exam.fullMarks)}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-sm shrink-0">
                <FiTrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium">গড় নম্বর</span>
                <p className="text-lg font-bold text-sky-800 mt-0.5">
                  {toBengaliNumber(stats.averageMark)}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0">
                <FiCheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium">পাসের হার (Pass Rate)</span>
                <p className="text-lg font-bold text-amber-800 mt-0.5">
                  {toBengaliNumber(stats.passRate)}%
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Printable Header (Visible only on print) */}
      <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-slate-800">
        <h2 className="text-xl font-bold text-slate-900">উত্তরণ স্টাডি কেয়ার</h2>
        <p className="text-xs text-slate-600 mt-0.5">অফিশিয়াল মেরিট লিস্ট ও ফলাফল বিবরণী</p>
        {exam && (
          <p className="text-xs font-semibold text-slate-800 mt-1">
            পরীক্ষা: {exam.name} • ব্যাচ: {exam.batch?.name} • বিষয়: {exam.subject?.name} • তারিখ:{' '}
            {formatDate(exam.examDate)} • পূর্ণমান: {toBengaliNumber(exam.fullMarks)}
          </p>
        )}
      </div>

      {/* Main Merit List Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-slate-100 print:hidden">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <FiAward className="w-4 h-4 text-amber-500" />
              মেধাতালিকা (Merit List Roster)
            </h3>
            {exam && (
              <p className="text-xs text-slate-500 mt-0.5">
                পূর্ণমান: {toBengaliNumber(exam.fullMarks)} • পাস মার্ক: {toBengaliNumber(exam.passMarks)}
              </p>
            )}
          </div>

          {exam && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleTogglePublish}
                disabled={isPublishing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  exam.isPublished
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    exam.isPublished ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <span>{exam.isPublished ? 'ফলাফল প্রকাশিত' : 'ফলাফল অপ্রকাশিত'}</span>
              </button>
            </div>
          )}
        </CardHeader>

        {isLoadingResults ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-xs sm:text-sm text-slate-500 font-medium">মেরিট লিস্ট লোড হচ্ছে...</p>
          </div>
        ) : meritList.length === 0 ? (
          <CardBody className="py-16 text-center text-slate-500 text-sm">
            <FiAlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p>এই পরীক্ষায় এখনও কোনো মার্কস এন্ট্রি করা হয়নি।</p>
            {exam && (
              <Link href={`/exams/${exam.id}/marks`} className="mt-4 inline-block">
                <Button variant="primary" size="sm">
                  মার্কস এন্ট্রি করুন
                </Button>
              </Link>
            )}
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700">
                  <th className="p-3 w-20 text-center font-bold">স্থান (Rank)</th>
                  <th className="p-3 w-16 text-center font-bold">রোল</th>
                  <th className="p-3 font-bold min-w-44">শিক্ষার্থীর নাম</th>
                  <th className="p-3 font-bold w-28">আইডি</th>
                  <th className="p-3 font-bold w-32 text-center">প্রাপ্ত নম্বর</th>
                  <th className="p-3 font-bold w-24 text-center">শতকরা (%)</th>
                  <th className="p-3 font-bold w-20 text-center">গ্রেড</th>
                  <th className="p-3 font-bold w-20 text-center">জিপিএ</th>
                  <th className="p-3 font-bold w-28 text-center">স্ট্যাটাস</th>
                  <th className="p-3 font-bold w-28 text-right print:hidden">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {meritList.map((item: any) => {
                  const is1st = item.rank === 1;
                  const is2nd = item.rank === 2;
                  const is3rd = item.rank === 3;
                  const isPassed = item.status === 'PASSED';

                  return (
                    <tr
                      key={item.studentId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        is1st
                          ? 'bg-amber-50/40 font-semibold'
                          : is2nd
                          ? 'bg-slate-50/70 font-medium'
                          : is3rd
                          ? 'bg-orange-50/30 font-medium'
                          : ''
                      }`}
                    >
                      {/* Rank Position */}
                      <td className="p-3 text-center">
                        {is1st ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs shadow-xs">
                            🥇 ১ম
                          </span>
                        ) : is2nd ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-extrabold text-xs">
                            🥈 ২য়
                          </span>
                        ) : is3rd ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-900 font-extrabold text-xs">
                            🥉 ৩য়
                          </span>
                        ) : (
                          <span className="font-bold text-slate-600">
                            {toBengaliNumber(item.rank)}তম
                          </span>
                        )}
                      </td>

                      {/* Roll */}
                      <td className="p-3 text-center font-bold text-slate-700">
                        {toBengaliNumber(item.student?.rollNumber || item.rank)}
                      </td>

                      {/* Name */}
                      <td className="p-3 font-bold text-slate-900">
                        <Link
                          href={`/students/${item.studentId}`}
                          className="hover:text-indigo-600 transition-colors"
                        >
                          {item.student?.nameBn || item.student?.nameEn}
                        </Link>
                      </td>

                      {/* ID */}
                      <td className="p-3 font-mono text-xs text-slate-500">
                        {item.student?.studentId}
                      </td>

                      {/* Marks */}
                      <td className="p-3 text-center font-bold text-indigo-900">
                        {toBengaliNumber(item.obtainedMarks)} / {toBengaliNumber(item.fullMarks)}
                      </td>

                      {/* Percentage */}
                      <td className="p-3 text-center font-bold text-slate-700">
                        {toBengaliNumber(item.percentage)}%
                      </td>

                      {/* Grade */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs ${
                            item.grade === 'A+' || item.grade === 'A' || item.grade === 'A-'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.grade === 'F'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.grade}
                        </span>
                      </td>

                      {/* GPA */}
                      <td className="p-3 text-center font-semibold text-slate-700">
                        {toBengaliNumber(item.gpa)}
                      </td>

                      {/* Pass/Fail */}
                      <td className="p-3 text-center">
                        <Badge variant={isPassed ? 'success' : 'danger'}>
                          {isPassed ? 'উত্তীর্ণ' : 'অকৃতকার্য'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right print:hidden">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenResultCard(item)}
                          leftIcon={<FiEye />}
                        >
                          কার্ড
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Individual Result Card Modal */}
      <Modal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        title="শিক্ষার্থীর ফলাফল কার্ড (Result Card)"
        size="md"
      >
        {selectedStudentResult && exam && (
          <div className="space-y-4 text-slate-800">
            {/* Header of Certificate */}
            <div className="text-center pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-indigo-900">উত্তরণ স্টাডি কেয়ার</h3>
              <p className="text-xs text-slate-500">একাডেমিক মূল্যায়ন ও ফলাফল পত্র</p>
              <div className="mt-2 inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs">
                {exam.name}
              </div>
            </div>

            {/* Student & Exam Details */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">শিক্ষার্থীর নাম:</span>
                <span className="font-bold text-slate-900">
                  {selectedStudentResult.student?.nameBn || selectedStudentResult.student?.nameEn}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">শিক্ষার্থী আইডি:</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedStudentResult.student?.studentId}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">ব্যাচ:</span>
                <span className="font-semibold text-slate-800">{exam.batch?.name}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">বিষয়:</span>
                <span className="font-semibold text-slate-800">{exam.subject?.name}</span>
              </div>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                <span className="text-[11px] text-indigo-700 font-semibold block">প্রাপ্ত নম্বর</span>
                <p className="text-lg font-bold text-indigo-900 mt-1">
                  {toBengaliNumber(selectedStudentResult.obtainedMarks)} / {toBengaliNumber(exam.fullMarks)}
                </p>
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <span className="text-[11px] text-emerald-700 font-semibold block">গ্রেড ও জিপিএ</span>
                <p className="text-lg font-bold text-emerald-900 mt-1">
                  {selectedStudentResult.grade} ({toBengaliNumber(selectedStudentResult.gpa)})
                </p>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                <span className="text-[11px] text-amber-700 font-semibold block">মেধাক্রম</span>
                <p className="text-lg font-bold text-amber-900 mt-1">
                  {toBengaliNumber(selectedStudentResult.rank)}তম
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCardModalOpen(false)}
              >
                বন্ধ করুন
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<FiPrinter />}
              >
                প্রিন্ট করুন
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">রেজাল্ট পেজ লোড হচ্ছে...</p>
        </div>
      }
    >
      <ResultSheetContent />
    </Suspense>
  );
}
