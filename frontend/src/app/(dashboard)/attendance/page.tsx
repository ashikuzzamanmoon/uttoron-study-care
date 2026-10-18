'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Loader';
import { Modal } from '../../../components/ui/Modal';
import {
  FiCheckSquare,
  FiCalendar,
  FiLayers,
  FiCheck,
  FiX,
  FiClock,
  FiAlertCircle,
  FiSend,
  FiBarChart2,
  FiUserCheck,
  FiCheckCircle,
  FiMessageSquare,
  FiSave,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { toBengaliNumber } from '../../../lib/utils';

type AttendanceStatusType = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

interface StudentRosterItem {
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
    gender: string;
  };
  attendanceId?: string | null;
  status: AttendanceStatusType;
  remarks?: string | null;
  smsSent: boolean;
}

function TakeAttendanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryBatchId = searchParams.get('batchId') || '';

  const getTodayDate = () => new Date().toISOString().slice(0, 10);

  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(queryBatchId);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());

  const [batchInfo, setBatchInfo] = useState<any | null>(null);
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [isRecorded, setIsRecorded] = useState<boolean>(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SMS & submission options
  const [autoSendSms, setAutoSendSms] = useState<boolean>(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [absentStudentsForSms, setAbsentStudentsForSms] = useState<any[]>([]);
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Fetch all batches
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
        toast.error('ব্যাচ তালিকা লোড করতে সমস্যা হয়েছে');
      } finally {
        setIsLoadingBatches(false);
      }
    }
    fetchBatches();
  }, [queryBatchId]);

  // Fetch roster & attendance for selected batch and date
  const fetchRoster = useCallback(async () => {
    if (!selectedBatchId || !selectedDate) return;

    try {
      setIsLoadingRoster(true);
      const res = await api.get(`/attendance/batch/${selectedBatchId}/date/${selectedDate}`);
      const data = res.data?.data || {};

      setBatchInfo(data.batch || null);
      setIsRecorded(Boolean(data.isRecorded));

      const rawRoster = data.roster || [];
      // If attendance was not recorded yet, default status is PRESENT
      const preparedRoster: StudentRosterItem[] = rawRoster.map((item: any) => ({
        studentId: item.studentId,
        rollNumber: item.rollNumber,
        student: item.student,
        attendanceId: item.attendanceId,
        status: item.status || 'PRESENT',
        remarks: item.remarks || '',
        smsSent: Boolean(item.smsSent),
      }));

      setRoster(preparedRoster);
    } catch (err: any) {
      console.error('Failed to load attendance roster:', err);
      toast.error('হাজিরা তালিকা লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setIsLoadingRoster(false);
    }
  }, [selectedBatchId, selectedDate]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  // Status counters
  const presentCount = roster.filter((r) => r.status === 'PRESENT').length;
  const absentCount = roster.filter((r) => r.status === 'ABSENT').length;
  const lateCount = roster.filter((r) => r.status === 'LATE').length;
  const excusedCount = roster.filter((r) => r.status === 'EXCUSED').length;

  // Single student status toggle
  const handleStatusChange = (studentId: string, status: AttendanceStatusType) => {
    setRoster((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, status } : item)),
    );
  };

  // Remarks change
  const handleRemarksChange = (studentId: string, remarks: string) => {
    setRoster((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, remarks } : item)),
    );
  };

  // Bulk status helpers
  const handleMarkAll = (status: AttendanceStatusType) => {
    setRoster((prev) => prev.map((item) => ({ ...item, status })));
    toast.success(`সকল শিক্ষার্থীকে "${status === 'PRESENT' ? 'উপস্থিত' : 'অনুপস্থিত'}" করা হয়েছে`);
  };

  // Submit attendance
  const handleSubmit = async () => {
    if (roster.length === 0) {
      toast.error('এই ব্যাচে কোনো শিক্ষার্থী নেই');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        batchId: selectedBatchId,
        date: selectedDate,
        sendAbsentSms: autoSendSms,
        records: roster.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          remarks: r.remarks ? r.remarks.trim() : undefined,
        })),
      };

      const res = await api.post(`/attendance/batch/${selectedBatchId}`, payload);
      const data = res.data?.data || {};

      toast.success(
        isRecorded
          ? 'হাজিরা সফলভাবে আপডেট করা হয়েছে'
          : 'হাজিরা সফলভাবে সংরক্ষণ করা হয়েছে',
      );

      // Check if there are absent students and auto SMS was not enabled
      const absents = roster.filter((r) => r.status === 'ABSENT' && !r.smsSent);
      if (!autoSendSms && absents.length > 0) {
        setAbsentStudentsForSms(absents);
        setIsSmsModalOpen(true);
      } else if (data.smsTriggeredCount > 0) {
        toast.success(
          `${toBengaliNumber(data.smsTriggeredCount)} জন অভিভাবককে অনুপস্থিতি এসএমএস পাঠানো হয়েছে`,
        );
      }

      fetchRoster();
    } catch (err: any) {
      console.error('Failed to submit attendance:', err);
      toast.error(err.response?.data?.message || 'হাজিরা সংরক্ষণ করতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger absent SMS from modal
  const handleTriggerAbsentSms = async () => {
    try {
      setIsSendingSms(true);
      const res = await api.post('/attendance/trigger-sms', {
        batchId: selectedBatchId,
        date: selectedDate,
      });

      toast.success(res.data?.message || 'অনুপস্থিতির এসএমএস সফলভাবে পাঠানো হয়েছে');
      setIsSmsModalOpen(false);
      fetchRoster();
    } catch (err: any) {
      console.error('Failed to send absent SMS:', err);
      toast.error(err.response?.data?.message || 'এসএমএস পাঠাতে সমস্যা হয়েছে');
    } finally {
      setIsSendingSms(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FiCheckSquare className="w-6 h-6" />
            </span>
            দৈনিক হাজিরা গ্রহণ (Attendance)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ব্যাচভিত্তিক শিক্ষার্থীদের দৈনিক উপস্থিতি ও অনুপস্থিতি গ্রহণ এবং অভিভাবকদের এসএমএস প্রেরণ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/attendance/report?batchId=${selectedBatchId}`}>
            <Button variant="secondary" size="md" leftIcon={<FiBarChart2 />}>
              হাজিরা রিপোর্ট দেখুন
            </Button>
          </Link>
        </div>
      </div>

      {/* Control & Filter Card */}
      <Card>
        <CardBody className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Batch Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FiLayers className="w-3.5 h-3.5 text-indigo-600" />
                ব্যাচ নির্বাচন করুন *
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  router.push(`/attendance?batchId=${e.target.value}`);
                }}
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

            {/* Date Picker */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FiCalendar className="w-3.5 h-3.5 text-indigo-600" />
                তারিখ নির্বাচন করুন *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setSelectedDate(getTodayDate())}
                  className="px-3 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors shrink-0"
                >
                  আজ
                </button>
              </div>
            </div>

            {/* Batch & Recording Status Chip */}
            <div className="pt-2 md:pt-4 flex items-center justify-between md:justify-end gap-3">
              {isRecorded ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>এই তারিখের হাজিরা সংগৃহীত</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                  <FiAlertCircle className="w-4 h-4 text-amber-600" />
                  <span>হাজিরা এখনও গ্রহণ করা হয়নি</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Counter Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500">মোট শিক্ষার্থী</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {toBengaliNumber(roster.length)} জন
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                {roster.length}
              </div>
            </div>

            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-emerald-700">উপস্থিত (Present)</span>
                <p className="text-lg font-bold text-emerald-800 mt-0.5">
                  {toBengaliNumber(presentCount)} জন
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                {presentCount}
              </div>
            </div>

            <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-rose-700">অনুপস্থিত (Absent)</span>
                <p className="text-lg font-bold text-rose-800 mt-0.5">
                  {toBengaliNumber(absentCount)} জন
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                {absentCount}
              </div>
            </div>

            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-amber-700">দেরি (Late)</span>
                <p className="text-lg font-bold text-amber-800 mt-0.5">
                  {toBengaliNumber(lateCount)} জন
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                {lateCount}
              </div>
            </div>

            <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-100 flex items-center justify-between col-span-2 sm:col-span-1">
              <div>
                <span className="text-[11px] font-medium text-sky-700">ছুটি (Excused)</span>
                <p className="text-lg font-bold text-sky-800 mt-0.5">
                  {toBengaliNumber(excusedCount)} জন
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                {excusedCount}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Roster List */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              শিক্ষার্থী উপস্থিতি তালিকা
            </h3>
            {batchInfo && (
              <p className="text-xs text-slate-500 mt-0.5">
                {batchInfo.name} ({batchInfo.classLevel}) • মোট শিক্ষার্থী: {toBengaliNumber(roster.length)} জন
              </p>
            )}
          </div>

          {/* Quick Mark Buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleMarkAll('PRESENT')}
              leftIcon={<FiCheck />}
            >
              সবাই উপস্থিত
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleMarkAll('ABSENT')}
              leftIcon={<FiX />}
            >
              সবাই অনুপস্থিত
            </Button>
          </div>
        </CardHeader>

        {isLoadingRoster ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-xs sm:text-sm text-slate-500 font-medium">হাজিরা শিট লোড হচ্ছে...</p>
          </div>
        ) : roster.length === 0 ? (
          <CardBody className="py-16 text-center">
            <FiUserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-sm text-slate-800">কোনো শিক্ষার্থী পাওয়া যায়নি</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              এই ব্যাচে এখনও কোনো সক্রিয় শিক্ষার্থী ভর্তি করা হয়নি।
            </p>
            <Link href={`/batches/${selectedBatchId}`} className="inline-block mt-4">
              <Button variant="primary" size="sm">
                ব্যাচে শিক্ষার্থী ভর্তি করুন
              </Button>
            </Link>
          </CardBody>
        ) : (
          <div className="divide-y divide-slate-100">
            {roster.map((item, index) => {
              const isPresent = item.status === 'PRESENT';
              const isAbsent = item.status === 'ABSENT';
              const isLate = item.status === 'LATE';
              const isExcused = item.status === 'EXCUSED';

              return (
                <div
                  key={item.studentId}
                  className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isAbsent
                      ? 'bg-rose-50/40 hover:bg-rose-50/70'
                      : isPresent
                      ? 'bg-white hover:bg-slate-50/80'
                      : isLate
                      ? 'bg-amber-50/40 hover:bg-amber-50/70'
                      : 'bg-sky-50/40 hover:bg-sky-50/70'
                  }`}
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                      {item.rollNumber ? toBengaliNumber(item.rollNumber) : toBengaliNumber(index + 1)}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/students/${item.student.id}`}
                          className="font-bold text-xs sm:text-sm text-slate-900 hover:text-indigo-600 transition-colors truncate"
                        >
                          {item.student.nameBn || item.student.nameEn}
                        </Link>
                        {item.smsSent && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1"
                            title="অনুপস্থিতির এসএমএস পাঠানো হয়েছে"
                          >
                            <FiSend className="w-2.5 h-2.5" /> এসএমএস প্রেরিত
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        আইডি: {item.student.studentId} • ফোন: {item.student.phone || 'নেই'}
                        {item.student.guardianPhone && ` • অভিভাবক: ${item.student.guardianPhone}`}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Remarks */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0">
                    {/* Status Toggle Buttons */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.studentId, 'PRESENT')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isPresent
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FiCheck className="w-3.5 h-3.5" />
                        <span>উপস্থিত</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.studentId, 'ABSENT')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isAbsent
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FiX className="w-3.5 h-3.5" />
                        <span>অনুপস্থিত</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.studentId, 'LATE')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isLate
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FiClock className="w-3.5 h-3.5" />
                        <span>দেরি</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.studentId, 'EXCUSED')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isExcused
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>ছুটি</span>
                      </button>
                    </div>

                    {/* Remarks Input */}
                    <input
                      type="text"
                      placeholder="মন্তব্য (ঐচ্ছিক)..."
                      value={item.remarks || ''}
                      onChange={(e) => handleRemarksChange(item.studentId, e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 w-full sm:w-36 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Submission Action Bar */}
        {roster.length > 0 && (
          <CardBody className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={autoSendSms}
                onChange={(e) => setAutoSendSms(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
              />
              <span>অনুপস্থিত শিক্ষার্থীদের অভিভাবকদের স্বয়ংক্রিয় এসএমএস অ্যালার্ট পাঠান</span>
            </label>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                leftIcon={<FiSave />}
              >
                {isRecorded ? 'হাজিরা আপডেট করুন' : 'হাজিরা সংরক্ষণ করুন'}
              </Button>
            </div>
          </CardBody>
        )}
      </Card>

      {/* Post-submission Absent SMS Modal */}
      <Modal
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        title="অনুপস্থিতির এসএমএস পাঠান"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-2.5">
            <FiMessageSquare className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800">
              <p className="font-bold">
                আজকের ক্লাসে {toBengaliNumber(absentStudentsForSms.length)} জন শিক্ষার্থী অনুপস্থিত রয়েছে।
              </p>
              <p className="mt-1 text-slate-600">
                আপনি কি তাদের অভিভাবকদের কাছে স্বয়ংক্রিয় অনুপস্থিতির এসএমএস নোটিফিকেশন পাঠাতে চান?
              </p>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 text-xs">
            {absentStudentsForSms.map((item) => (
              <div key={item.studentId} className="pt-1.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">
                    {item.student.nameBn || item.student.nameEn}
                  </span>
                  <span className="text-slate-400 text-[11px] ml-1.5">
                    (রোল: {item.rollNumber ? toBengaliNumber(item.rollNumber) : '—'})
                  </span>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">
                  {item.student.guardianPhone || item.student.phone || 'নম্বর নেই'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsSmsModalOpen(false)}
            >
              এখন নয়
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleTriggerAbsentSms}
              isLoading={isSendingSms}
              leftIcon={<FiSend />}
            >
              এসএমএস পাঠান
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function TakeAttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">হাজিরা পেজ লোড হচ্ছে...</p>
        </div>
      }
    >
      <TakeAttendanceContent />
    </Suspense>
  );
}
