'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card, CardBody } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Loader';
import {
  FiFileText,
  FiPlus,
  FiCalendar,
  FiLayers,
  FiBookOpen,
  FiSearch,
  FiCheckCircle,
  FiEye,
  FiEdit3,
  FiTrash2,
  FiAward,
  FiClock,
  FiTrendingUp,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { toBengaliNumber, formatDate } from '../../../lib/utils';

const EXAM_TYPE_LABELS: Record<string, string> = {
  CLASS_TEST: 'ক্লাস টেস্ট',
  WEEKLY_TEST: 'সাপ্তাহিক পরীক্ষা',
  MONTHLY_EXAM: 'মাসিক পরীক্ষা',
  QUARTERLY_EXAM: 'ত্রৈমাসিক পরীক্ষা',
  HALF_YEARLY: 'অর্ধ-বার্ষিকী',
  YEARLY_FINAL: 'বার্ষিক পরীক্ষা',
  MODEL_TEST: 'মডেল টেস্ট',
  BOARD_MODEL: 'বোর্ড মডেল',
};

function ExamListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryBatchId = searchParams.get('batchId') || '';

  const [exams, setExams] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'ALL' | 'UPCOMING' | 'ONGOING' | 'COMPLETED'>('ALL');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(queryBatchId);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Load batches & subjects for filter
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const [bRes, sRes] = await Promise.all([
          api.get('/batches', { params: { limit: 100 } }),
          api.get('/subjects'),
        ]);
        setBatches(bRes.data?.data || []);
        setSubjects(sRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    }
    fetchMetadata();
  }, []);

  // Fetch exams
  const fetchExams = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {
        limit: 100,
      };

      if (selectedBatchId) params.batchId = selectedBatchId;
      if (selectedSubjectId) params.subjectId = selectedSubjectId;
      if (selectedType) params.examType = selectedType;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/exams', { params });
      setExams(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load exams:', err);
      toast.error('পরীক্ষার তালিকা লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBatchId, selectedSubjectId, selectedType, search]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // Toggle publish
  const handleTogglePublish = async (examId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setPublishingId(examId);
      const res = await api.patch(`/exams/${examId}/publish`, {
        isPublished: !currentStatus,
      });
      toast.success(res.data?.message || 'পাবলিশ স্ট্যাটাস পরিবর্তিত হয়েছে');
      fetchExams();
    } catch (err: any) {
      console.error('Failed to toggle publish:', err);
      toast.error(err.response?.data?.message || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে');
    } finally {
      setPublishingId(null);
    }
  };

  // Delete exam
  const handleDeleteExam = async (examId: string, examName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`আপনি কি নিশ্চিত যে "${examName}" পরীক্ষা এবং এর সকল মার্কস মুছে ফেলতে চান?`)) {
      return;
    }

    try {
      await api.delete(`/exams/${examId}`);
      toast.success('পরীক্ষা মুছে ফেলা হয়েছে');
      fetchExams();
    } catch (err: any) {
      console.error('Failed to delete exam:', err);
      toast.error(err.response?.data?.message || 'পরীক্ষা মুছতে ব্যর্থ হয়েছে');
    }
  };

  // Filter by status tab
  const filteredExams = exams.filter((exam) => {
    if (activeTab === 'ALL') return true;
    return exam.status === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FiFileText className="w-6 h-6" />
            </span>
            পরীক্ষা ও মূল্যায়ন ব্যবস্থাপনা (Exams)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ক্লাস টেস্ট, মডেল টেস্ট ও মাসিক পরীক্ষা শিডিউল, স্প্রেডশিট মার্কস এন্ট্রি ও ফলাফল প্রস্তুত
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/results">
            <Button variant="secondary" size="md" leftIcon={<FiAward />}>
              মেরিট লিস্ট ও রেজাল্ট শিট
            </Button>
          </Link>

          <Link href="/exams/create">
            <Button variant="primary" size="md" leftIcon={<FiPlus />}>
              নতুন পরীক্ষা তৈরি করুন
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs & Search Filter Card */}
      <Card>
        <CardBody className="p-4 space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
            {[
              { key: 'ALL', label: 'সকল পরীক্ষা', count: exams.length },
              {
                key: 'UPCOMING',
                label: 'আসন্ন পরীক্ষা',
                count: exams.filter((e) => e.status === 'UPCOMING').length,
              },
              {
                key: 'ONGOING',
                label: 'চলমান (আজ)',
                count: exams.filter((e) => e.status === 'ONGOING').length,
              },
              {
                key: 'COMPLETED',
                label: 'সম্পন্ন',
                count: exams.filter((e) => e.status === 'COMPLETED').length,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {toBengaliNumber(tab.count)}
                </span>
              </button>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="পরীক্ষার নাম বা সিলেবাস খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">সকল ব্যাচ (All Batches)</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.classLevel})
                </option>
              ))}
            </select>

            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">সকল বিষয় (All Subjects)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">সকল ধরন (All Types)</option>
              {Object.entries(EXAM_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Main Content: Exam Cards Grid */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">পরীক্ষার তালিকা লোড হচ্ছে...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center">
            <FiFileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">কোনো পরীক্ষা পাওয়া যায়নি</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {search || selectedBatchId || selectedSubjectId
                ? 'আপনার সার্চ ফিল্টারের সাথে মিলে এমন কোনো পরীক্ষা নেই।'
                : 'এখনও কোনো পরীক্ষা তৈরি করা হয়নি। নতুন পরীক্ষা শিডিউল করুন।'}
            </p>
            <div className="mt-5">
              <Link href="/exams/create">
                <Button variant="primary" size="sm" leftIcon={<FiPlus />}>
                  প্রথম পরীক্ষা তৈরি করুন
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => {
            const isCompleted = exam.status === 'COMPLETED';
            const isOngoing = exam.status === 'ONGOING';
            const totalStudents = exam.totalStudents || 0;
            const marksEntered = exam.marksEntered || 0;
            const entryPercentage =
              totalStudents > 0 ? Math.round((marksEntered / totalStudents) * 100) : 0;

            return (
              <div
                key={exam.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:shadow-xl hover:border-indigo-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {EXAM_TYPE_LABELS[exam.examType] || exam.examType}
                    </span>

                    <Badge
                      variant={
                        isOngoing ? 'warning' : isCompleted ? 'neutral' : 'primary'
                      }
                    >
                      {isOngoing ? 'আজ চলমান' : isCompleted ? 'সম্পন্ন' : 'আসন্ন'}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {exam.name}
                  </h3>

                  {/* Batch & Subject Highlights */}
                  <div className="space-y-1.5 mt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <FiLayers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {exam.batch?.name} ({exam.batch?.classLevel})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <FiBookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800">
                        {exam.subject?.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        ({exam.subject?.code})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500">
                      <FiCalendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDate(exam.examDate)}</span>
                      {exam.duration && (
                        <span className="flex items-center gap-1 ml-2 text-slate-400">
                          <FiClock className="w-3 h-3" /> {toBengaliNumber(exam.duration)} মিনিট
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Marks & Syllabus Info */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-medium">পূর্ণমান / পাস</span>
                      <span className="font-bold text-slate-900">
                        {toBengaliNumber(exam.fullMarks)} / {toBengaliNumber(exam.passMarks)}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-medium">ফলাফল স্ট্যাটাস</span>
                      <span
                        className={`font-bold ${
                          exam.isPublished ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {exam.isPublished ? 'প্রকাশিত' : 'অপ্রকাশিত'}
                      </span>
                    </div>
                  </div>

                  {/* Marks Entry Progress */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">মার্কস এন্ট্রি অগ্রগতি:</span>
                      <span className="font-bold text-slate-800">
                        {toBengaliNumber(marksEntered)} / {toBengaliNumber(totalStudents)} জন
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${entryPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleTogglePublish(exam.id, exam.isPublished, e)}
                      disabled={publishingId === exam.id}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        exam.isPublished
                          ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                      title={exam.isPublished ? 'অপ্রকাশিত করুন' : 'ফলাফল প্রকাশ করুন'}
                    >
                      {exam.isPublished ? 'আনপাবলিশ' : 'পাবলিশ'}
                    </button>

                    <button
                      onClick={(e) => handleDeleteExam(exam.id, exam.name, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link href={`/exams/${exam.id}/marks`}>
                      <button
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white text-xs font-bold transition-all"
                        title="মার্কস এন্ট্রি শিট"
                      >
                        <FiEdit3 className="w-3.5 h-3.5" />
                        <span>মার্কস</span>
                      </button>
                    </Link>

                    <Link href={`/results?examId=${exam.id}`}>
                      <button
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-all"
                        title="রেজাল্ট ও মেরিট লিস্ট"
                      >
                        <FiAward className="w-3.5 h-3.5" />
                        <span>রেজাল্ট</span>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ExamsListPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">পরীক্ষা পেজ লোড হচ্ছে...</p>
        </div>
      }
    >
      <ExamListContent />
    </Suspense>
  );
}
