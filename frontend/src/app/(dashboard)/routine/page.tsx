'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Card, CardBody } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Loader';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import {
  FiCalendar,
  FiPlus,
  FiClock,
  FiMapPin,
  FiUser,
  FiEdit2,
  FiTrash2,
  FiPrinter,
  FiLayers,
  FiAlertCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { toBengaliNumber } from '../../../lib/utils';

const DAYS_BN: Record<string, string> = {
  SATURDAY: 'শনিবার',
  SUNDAY: 'রবিবার',
  MONDAY: 'সোমবার',
  TUESDAY: 'মঙ্গলবার',
  WEDNESDAY: 'বুধবার',
  THURSDAY: 'বৃহস্পতিবার',
  FRIDAY: 'শুক্রবার',
};

const DAY_OPTIONS = [
  { value: 'SATURDAY', label: 'শনিবার (Saturday)' },
  { value: 'SUNDAY', label: 'রবিবার (Sunday)' },
  { value: 'MONDAY', label: 'সোমবার (Monday)' },
  { value: 'TUESDAY', label: 'মঙ্গলবার (Tuesday)' },
  { value: 'WEDNESDAY', label: 'বুধবার (Wednesday)' },
  { value: 'THURSDAY', label: 'বৃহস্পতিবার (Thursday)' },
  { value: 'FRIDAY', label: 'শুক্রবার (Friday)' },
];

const ORDERED_DAYS = [
  'SATURDAY',
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
];

interface SlotFormState {
  batchId: string;
  day: string;
  startTime: string;
  endTime: string;
  subjectId: string;
  teacherId: string;
  roomNo: string;
}

const initialForm: SlotFormState = {
  batchId: '',
  day: 'SATURDAY',
  startTime: '09:00',
  endTime: '10:00',
  subjectId: '',
  teacherId: '',
  roomNo: '',
};

function RoutineContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBatchId = searchParams.get('batchId') || '';

  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatchId);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);

  const [slots, setSlots] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);

  // Available metadata for modals
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any | null>(null);
  const [formData, setFormData] = useState<SlotFormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch batches, subjects, teachers
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoadingBatches(true);
        const [batchRes, subRes, teachRes] = await Promise.all([
          api.get('/batches', { params: { limit: 100 } }),
          api.get('/subjects'),
          api.get('/teachers', { params: { limit: 100 } }),
        ]);

        const batchList = batchRes.data?.data || [];
        setBatches(batchList);
        setSubjects(subRes.data?.data || []);
        setTeachers(teachRes.data?.data || []);

        if (batchList.length > 0) {
          if (initialBatchId && batchList.some((b: any) => b.id === initialBatchId)) {
            setSelectedBatchId(initialBatchId);
          } else {
            setSelectedBatchId(batchList[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load initial routine data:', err);
        toast.error('ব্যাচ ও তথ্য লোড করতে সমস্যা হয়েছে');
      } finally {
        setIsLoadingBatches(false);
      }
    }
    loadInitialData();
  }, [initialBatchId]);

  // Fetch routine slots whenever selectedBatchId changes
  const fetchRoutine = useCallback(async () => {
    if (!selectedBatchId) return;

    try {
      setIsLoadingSlots(true);
      const res = await api.get(`/routine/batch/${selectedBatchId}`);
      const data = res.data?.data || {};
      setSelectedBatch(data.batch || null);
      setSlots(data.slots || []);
    } catch (err: any) {
      console.error('Failed to load routine slots:', err);
      toast.error('ক্লাস রুটিন লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsLoadingSlots(false);
    }
  }, [selectedBatchId]);

  useEffect(() => {
    if (selectedBatchId) {
      fetchRoutine();
    }
  }, [selectedBatchId, fetchRoutine]);

  const handleOpenCreateModal = (presetDay?: string) => {
    setEditingSlot(null);
    setFormData({
      ...initialForm,
      batchId: selectedBatchId,
      day: presetDay || 'SATURDAY',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slot: any) => {
    setEditingSlot(slot);
    setFormData({
      batchId: slot.batchId,
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      subjectId: slot.subjectId || '',
      teacherId: slot.teacherId || '',
      roomNo: slot.roomNo || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batchId) {
      toast.error('ব্যাচ নির্বাচন করুন');
      return;
    }
    if (formData.startTime >= formData.endTime) {
      toast.error('ক্লাস শুরুর সময় শেষ সময়ের পূর্বে হতে হবে');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        batchId: formData.batchId,
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
        subjectId: formData.subjectId || undefined,
        teacherId: formData.teacherId || undefined,
        roomNo: formData.roomNo?.trim() || undefined,
      };

      if (editingSlot) {
        await api.put(`/routine/${editingSlot.id}`, payload);
        toast.success('রুটিন স্লট সফলভাবে আপডেট হয়েছে');
      } else {
        await api.post('/routine', payload);
        toast.success('নতুন ক্লাস স্লট যুক্ত হয়েছে');
      }

      setIsModalOpen(false);
      fetchRoutine();
    } catch (err: any) {
      console.error('Failed to save slot:', err);
      toast.error(
        err.response?.data?.message || 'রুটিন সেভ করতে সমস্যা হয়েছে। সময়ের কনফ্লিক্ট যাচাই করুন।',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId: string, day: string, time: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে ${DAYS_BN[day]} এর (${time}) ক্লাসটি মুছে ফেলতে চান?`)) {
      return;
    }

    try {
      setDeletingId(slotId);
      await api.delete(`/routine/${slotId}`);
      toast.success('স্লট মুছে ফেলা হয়েছে');
      fetchRoutine();
    } catch (err: any) {
      console.error('Failed to delete slot:', err);
      toast.error(err.response?.data?.message || 'স্লট মুছতে ব্যর্থ হয়েছে');
    } finally {
      setDeletingId(null);
    }
  };

  // Group slots by day
  const slotsByDay: Record<string, any[]> = {};
  ORDERED_DAYS.forEach((d) => {
    slotsByDay[d] = slots.filter((s) => s.day === d);
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FiCalendar className="w-6 h-6" />
            </span>
            সাপ্তাহিক ক্লাস রুটিন
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ব্যাচভিত্তিক সাপ্তাহিক ক্লাসের সময়সূচী, বিষয়, শিক্ষক ও রুম বরাদ্দ
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="md"
            onClick={() => window.print()}
            leftIcon={<FiPrinter />}
          >
            রুটিন প্রিন্ট
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => handleOpenCreateModal()}
            disabled={!selectedBatchId}
            leftIcon={<FiPlus />}
          >
            নতুন স্লট যোগ করুন
          </Button>
        </div>
      </div>

      {/* Batch Selector Bar */}
      <Card className="print:hidden">
        <CardBody className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <span className="text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
              <FiLayers className="w-4 h-4 text-indigo-600" />
              ব্যাচ নির্বাচন:
            </span>
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                router.push(`/routine?batchId=${e.target.value}`);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.classLevel} {b.group ? `- ${b.group}` : ''})
                </option>
              ))}
            </select>
          </div>

          {selectedBatch && (
            <div className="flex items-center gap-2.5 flex-wrap text-xs">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-lg border border-indigo-100">
                {selectedBatch.classLevel}
              </span>
              {selectedBatch.group && (
                <span className="px-3 py-1 bg-slate-100 text-slate-700 font-medium rounded-lg">
                  গ্রুপ: {selectedBatch.group}
                </span>
              )}
              {selectedBatch.section && (
                <span className="px-3 py-1 bg-amber-50 text-amber-700 font-semibold rounded-lg border border-amber-200/60">
                  সেকশন: {selectedBatch.section}
                </span>
              )}
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-lg border border-emerald-100">
                মোট ক্লাস: {toBengaliNumber(slots.length)} টি/সপ্তাহ
              </span>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Printable Official Header (Visible ONLY on print) */}
      <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-slate-800">
        <h2 className="text-xl font-bold text-slate-900">উত্তরণ স্টাডি কেয়ার</h2>
        <p className="text-xs text-slate-600 mt-0.5">সাপ্তাহিক ক্লাস সময়সূচী (Class Routine)</p>
        {selectedBatch && (
          <div className="mt-2 text-sm font-semibold text-slate-800">
            ব্যাচ: {selectedBatch.name} • শ্রেণি: {selectedBatch.classLevel}
            {selectedBatch.group ? ` • গ্রুপ: ${selectedBatch.group}` : ''}
            {selectedBatch.section ? ` • সেকশন: ${selectedBatch.section}` : ''}
            • শিক্ষাবর্ষ: {toBengaliNumber(selectedBatch.year)}
          </div>
        )}
      </div>

      {/* Routine Timetable Grid */}
      {isLoadingSlots || isLoadingBatches ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">রুটিন লোড হচ্ছে...</p>
        </div>
      ) : batches.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center">
            <FiLayers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">কোনো ব্যাচ তৈরি করা নেই</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              রুটিন তৈরি করার পূর্বে অনুগ্রহ করে অন্তত একটি ব্যাচ তৈরি করুন।
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 print:grid-cols-7 print:gap-2">
          {ORDERED_DAYS.map((day) => {
            const daySlots = slotsByDay[day] || [];
            const isFriday = day === 'FRIDAY';

            return (
              <div
                key={day}
                className={`flex flex-col bg-white rounded-2xl border ${
                  isFriday ? 'border-rose-100 bg-rose-50/20' : 'border-slate-200/90'
                } overflow-hidden shadow-xs print:border-slate-400 print:rounded-none`}
              >
                {/* Day Header */}
                <div
                  className={`p-3 border-b flex items-center justify-between ${
                    isFriday
                      ? 'bg-rose-50 text-rose-800 border-rose-100'
                      : 'bg-slate-100/80 text-slate-800 border-slate-200'
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm tracking-wide">
                      {DAYS_BN[day]}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {toBengaliNumber(daySlots.length)} টি ক্লাস
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenCreateModal(day)}
                    className="p-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-white transition-colors print:hidden"
                    title={`${DAYS_BN[day]} বারে ক্লাস যোগ করুন`}
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                </div>

                {/* Slots List */}
                <div className="p-2 space-y-2 flex-1 flex flex-col justify-start">
                  {daySlots.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center gap-1.5 h-full">
                      <span className="text-xs italic">
                        {isFriday ? 'সাপ্তাহিক ছুটি' : 'ক্লাস নেই'}
                      </span>
                      <button
                        onClick={() => handleOpenCreateModal(day)}
                        className="text-[11px] text-indigo-600 hover:underline font-medium print:hidden"
                      >
                        + যোগ করুন
                      </button>
                    </div>
                  ) : (
                    daySlots.map((slot: any) => {
                      const subject = slot.subject;
                      const teacher = slot.teacher;

                      return (
                        <div
                          key={slot.id}
                          className="group relative p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all space-y-1.5 print:bg-white print:border-slate-300"
                        >
                          {/* Subject & Code */}
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-xs text-slate-900 line-clamp-1">
                              {subject ? subject.name : 'সাধারণ ক্লাস'}
                            </span>
                            {subject?.code && (
                              <span className="font-mono text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-sm shrink-0">
                                {subject.code}
                              </span>
                            )}
                          </div>

                          {/* Time */}
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                            <FiClock className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>

                          {/* Teacher & Room */}
                          <div className="space-y-0.5 pt-1 border-t border-slate-200/60 text-[10px] text-slate-600">
                            {teacher && (
                              <div className="flex items-center gap-1 truncate">
                                <FiUser className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="font-medium truncate">
                                  {teacher.nameBn || teacher.nameEn}
                                </span>
                              </div>
                            )}

                            {slot.roomNo && (
                              <div className="flex items-center gap-1 text-slate-500">
                                <FiMapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{slot.roomNo}</span>
                              </div>
                            )}
                          </div>

                          {/* Actions on Hover */}
                          <div className="hidden group-hover:flex items-center justify-end gap-1 pt-1 border-t border-slate-200/60 print:hidden">
                            <button
                              onClick={() => handleOpenEditModal(slot)}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                              title="এডিট"
                            >
                              <FiEdit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteSlot(
                                  slot.id,
                                  slot.day,
                                  `${slot.startTime}-${slot.endTime}`,
                                )
                              }
                              disabled={deletingId === slot.id}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="মুছুন"
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Slot Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSlot ? 'ক্লাস স্লট সম্পাদনা' : 'নতুন ক্লাস স্লট যুক্ত করুন'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="বার (Day of Week) *"
            value={formData.day}
            onChange={(e) => setFormData({ ...formData, day: e.target.value })}
            options={DAY_OPTIONS}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="শুরুর সময় (HH:MM) *"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />

            <Input
              label="সমাপ্তির সময় (HH:MM) *"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              পাঠ্য বিষয় (Subject)
            </label>
            <select
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- বিষয় নির্বাচন করুন (ঐচ্ছিক) --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              শিক্ষক (Teacher)
            </label>
            <select
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- শিক্ষক নির্বাচন করুন (ঐচ্ছিক) --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nameBn || t.nameEn} ({t.phone})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="ক্লাসরুম / কক্ষ নম্বর"
            placeholder="যেমন: Room 101, Science Lab..."
            value={formData.roomNo}
            onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
          />

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 flex items-start gap-2 text-xs text-amber-800">
            <FiAlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              সিস্টেম স্বয়ংক্রিয়ভাবে শিক্ষক, কক্ষ এবং ব্যাচের সময়সূচী কনফ্লিক্ট যাচাই করবে।
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              {editingSlot ? 'পরিবর্তন সংরক্ষণ করুন' : 'স্লট নিশ্চিত করুন'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function RoutinePage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">রুটিন পেজ লোড হচ্ছে...</p>
        </div>
      }
    >
      <RoutineContent />
    </Suspense>
  );
}
