'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../../../components/ui/Card';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Spinner } from '../../../../components/ui/Loader';
import {
  FiArrowLeft,
  FiFileText,
  FiLayers,
  FiBookOpen,
  FiUserCheck,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiSave,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const EXAM_TYPE_OPTIONS = [
  { value: 'CLASS_TEST', label: 'ক্লাস টেস্ট (Class Test)' },
  { value: 'WEEKLY_TEST', label: 'সাপ্তাহিক পরীক্ষা (Weekly Test)' },
  { value: 'MONTHLY_EXAM', label: 'মাসিক পরীক্ষা (Monthly Exam)' },
  { value: 'QUARTERLY_EXAM', label: 'ত্রৈমাসিক পরীক্ষা (Quarterly Exam)' },
  { value: 'HALF_YEARLY', label: 'অর্ধ-বার্ষিকী (Half Yearly)' },
  { value: 'YEARLY_FINAL', label: 'বার্ষিক পরীক্ষা (Yearly Final)' },
  { value: 'MODEL_TEST', label: 'মডেল টেস্ট (Model Test)' },
  { value: 'BOARD_MODEL', label: 'বোর্ড মডেল (Board Model)' },
];

export default function CreateExamPage() {
  const router = useRouter();

  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    examType: 'MONTHLY_EXAM',
    batchId: '',
    subjectId: '',
    teacherId: '',
    examDate: new Date().toISOString().slice(0, 10),
    fullMarks: 100,
    passMarks: 33,
    duration: 60,
    syllabus: '',
    isPublished: false,
  });

  // Fetch batches, subjects, teachers
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoadingMetadata(true);
        const [bRes, sRes, tRes] = await Promise.all([
          api.get('/batches', { params: { limit: 100 } }),
          api.get('/subjects'),
          api.get('/teachers', { params: { limit: 100 } }),
        ]);

        const batchList = bRes.data?.data || [];
        const subjectList = sRes.data?.data || [];
        const teacherList = tRes.data?.data || [];

        setBatches(batchList);
        setSubjects(subjectList);
        setTeachers(teacherList);

        if (batchList.length > 0) {
          setFormData((prev) => ({
            ...prev,
            batchId: batchList[0].id,
            subjectId: subjectList.length > 0 ? subjectList[0].id : '',
          }));
        }
      } catch (err) {
        console.error('Failed to load metadata for exam creation:', err);
        toast.error('প্রয়োজনীয় তথ্য লোড করতে সমস্যা হয়েছে');
      } finally {
        setIsLoadingMetadata(false);
      }
    }
    loadInitialData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('পরীক্ষার নাম লিখুন');
      return;
    }
    if (!formData.batchId) {
      toast.error('ব্যাচ নির্বাচন করুন');
      return;
    }
    if (!formData.subjectId) {
      toast.error('বিষয় নির্বাচন করুন');
      return;
    }
    if (formData.passMarks > formData.fullMarks) {
      toast.error('পাস মার্ক পূর্ণমানের চেয়ে বেশি হতে পারে না');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        examType: formData.examType,
        batchId: formData.batchId,
        subjectId: formData.subjectId,
        teacherId: formData.teacherId || undefined,
        examDate: formData.examDate,
        fullMarks: Number(formData.fullMarks),
        passMarks: Number(formData.passMarks),
        duration: formData.duration ? Number(formData.duration) : undefined,
        syllabus: formData.syllabus.trim() || undefined,
        isPublished: formData.isPublished,
      };

      await api.post('/exams', payload);
      toast.success('পরীক্ষা সফলভাবে তৈরি হয়েছে');
      router.push('/exams');
    } catch (err: any) {
      console.error('Failed to create exam:', err);
      toast.error(err.response?.data?.message || 'পরীক্ষা তৈরিতে ব্যর্থ হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingMetadata) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs sm:text-sm text-slate-500 font-medium">ফর্ম প্রস্তুত হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link href="/exams">
          <Button variant="secondary" size="sm" leftIcon={<FiArrowLeft />}>
            তালিকায় ফিরুন
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            নতুন পরীক্ষা তৈরি করুন
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            ব্যাচ, বিষয়, তারিখ ও নম্বর নির্ধারণ করে পরীক্ষা শিডিউল করুন
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Details Card */}
        <Card>
          <CardHeader className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <FiFileText className="w-4 h-4 text-indigo-600" />
              মৌলিক পরীক্ষার তথ্য
            </h3>
          </CardHeader>
          <CardBody className="p-5 space-y-4">
            <Input
              label="পরীক্ষার নাম *"
              placeholder="যেমন: Class 10 Physics Monthly Exam - October 2026"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="পরীক্ষার ধরন *"
                value={formData.examType}
                onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                options={EXAM_TYPE_OPTIONS}
                required
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FiLayers className="w-3.5 h-3.5 text-indigo-600" />
                  ব্যাচ নির্বাচন করুন *
                </label>
                <select
                  value={formData.batchId}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  required
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.classLevel} {b.group ? `- ${b.group}` : ''})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FiBookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  বিষয় নির্বাচন করুন *
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FiUserCheck className="w-3.5 h-3.5 text-sky-600" />
                  দায়িত্বপ্রাপ্ত শিক্ষক (ঐচ্ছিক)
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- শিক্ষক সিলেক্ট করুন (ঐচ্ছিক) --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameBn || t.nameEn} ({t.phone})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Schedule & Marks Card */}
        <Card>
          <CardHeader className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-indigo-600" />
              তারিখ, সময় ও নম্বর বণ্টন
            </h3>
          </CardHeader>
          <CardBody className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input
                label="পরীক্ষার তারিখ *"
                type="date"
                value={formData.examDate}
                onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                required
              />

              <Input
                label="পূর্ণমান (Full Marks) *"
                type="number"
                value={formData.fullMarks}
                onChange={(e) => setFormData({ ...formData, fullMarks: Number(e.target.value) })}
                required
              />

              <Input
                label="পাস মার্ক (Pass Marks) *"
                type="number"
                value={formData.passMarks}
                onChange={(e) => setFormData({ ...formData, passMarks: Number(e.target.value) })}
                required
              />

              <Input
                label="সময়কাল (মিনিট)"
                type="number"
                placeholder="যেমন: 60"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                সিলেবাস ও পরীক্ষার বিষয়বস্তু (Syllabus)
              </label>
              <textarea
                rows={3}
                placeholder="উদাহরণ: অধ্যায় ১ (ভৌত রাশি ও পরিমাপ) এবং অধ্যায় ২ (গতি)..."
                value={formData.syllabus}
                onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
              />
              <span className="text-xs sm:text-sm font-semibold text-slate-700">
                পরীক্ষা তৈরি করার সাথে সাথেই ফলাফল শিক্ষার্থীদের জন্য প্রকাশিত (Published) রাখুন
              </span>
            </label>
          </CardBody>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/exams">
            <Button type="button" variant="secondary" size="md">
              বাতিল
            </Button>
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            leftIcon={<FiSave />}
          >
            পরীক্ষা তৈরি নিশ্চিত করুন
          </Button>
        </div>
      </form>
    </div>
  );
}
