'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Card, CardBody, CardHeader } from '../../../../components/ui/Card';
import { Tabs } from '../../../../components/ui/Tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '../../../../components/ui/Table';
import { Spinner } from '../../../../components/ui/Loader';
import { Modal } from '../../../../components/ui/Modal';
import { Input } from '../../../../components/ui/Input';
import {
  FiArrowLeft,
  FiUsers,
  FiUserCheck,
  FiBookOpen,
  FiCalendar,
  FiFileText,
  FiPlus,
  FiTrash2,
  FiUserPlus,
  FiCheckCircle,
  FiSearch,
  FiPhone,
  FiMapPin,
  FiDollarSign,
  FiEye,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatCurrency, toBengaliNumber, formatDate } from '../../../../lib/utils';

const DAYS_BN: Record<string, string> = {
  SATURDAY: 'শনিবার',
  SUNDAY: 'রবিবার',
  MONDAY: 'সোমবার',
  TUESDAY: 'মঙ্গলবার',
  WEDNESDAY: 'বুধবার',
  THURSDAY: 'বৃহস্পতিবার',
  FRIDAY: 'শুক্রবার',
};

const ORDERED_DAYS = [
  'SATURDAY',
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
];

export default function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const batchId = resolvedParams.id;

  const [batch, setBatch] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');

  // Search in students tab
  const [studentSearch, setStudentSearch] = useState('');

  // Modals
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAssignTeacherOpen, setIsAssignTeacherOpen] = useState(false);
  const [isAssignSubjectOpen, setIsAssignSubjectOpen] = useState(false);

  // Available data for modals
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [isLoadingModalData, setIsLoadingModalData] = useState(false);

  // Form selections
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentRollNo, setStudentRollNo] = useState<number | ''>('');

  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isPrimaryTeacher, setIsPrimaryTeacher] = useState(false);

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBatchDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/batches/${batchId}`);
      const data = res.data?.data || null;
      setBatch(data);
    } catch (err: any) {
      console.error('Failed to load batch details:', err);
      toast.error('ব্যাচ বিবরণ লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchBatchDetail();
  }, [fetchBatchDetail]);

  // Load available students for enrollment modal
  const handleOpenAddStudentModal = async () => {
    try {
      setIsLoadingModalData(true);
      setIsAddStudentOpen(true);
      setSelectedStudentId('');
      const currentCount = batch?.batchStudents?.length || 0;
      setStudentRollNo(currentCount + 1);

      const res = await api.get('/students', {
        params: {
          classLevel: batch?.classLevel,
          limit: 100,
        },
      });
      const allStudents = res.data?.data || [];
      // Filter out students already enrolled in this batch
      const enrolledIds = new Set(
        (batch?.batchStudents || []).map((bs: any) => bs.studentId),
      );
      const unassigned = allStudents.filter((s: any) => !enrolledIds.has(s.id));
      setAvailableStudents(unassigned);
    } catch (err) {
      console.error('Failed to load students:', err);
      toast.error('শিক্ষার্থী তালিকা লোড করা যায়নি');
    } finally {
      setIsLoadingModalData(false);
    }
  };

  // Submit enrollment
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.error('শিক্ষার্থী নির্বাচন করুন');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post(`/batches/${batchId}/students`, {
        students: [
          {
            studentId: selectedStudentId,
            rollNumber: studentRollNo ? Number(studentRollNo) : undefined,
          },
        ],
      });
      toast.success('শিক্ষার্থী সফলভাবে ব্যাচে ভর্তি করা হয়েছে');
      setIsAddStudentOpen(false);
      fetchBatchDetail();
    } catch (err: any) {
      console.error('Failed to enroll student:', err);
      toast.error(err.response?.data?.message || 'ভর্তি সম্পন্ন করা যায়নি');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove student from batch
  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (
      !confirm(
        `আপনি কি নিশ্চিত যে "${studentName}"-কে এই ব্যাচ থেকে বাদ দিতে চান?`,
      )
    ) {
      return;
    }

    try {
      await api.delete(`/batches/${batchId}/students/${studentId}`);
      toast.success('শিক্ষার্থীকে ব্যাচ থেকে বাদ দেওয়া হয়েছে');
      fetchBatchDetail();
    } catch (err: any) {
      console.error('Failed to remove student:', err);
      toast.error(
        err.response?.data?.message || 'শিক্ষার্থীকে বাদ দিতে ব্যর্থ হয়েছে',
      );
    }
  };

  // Load available teachers for assignment modal
  const handleOpenAssignTeacherModal = async () => {
    try {
      setIsLoadingModalData(true);
      setIsAssignTeacherOpen(true);
      setSelectedTeacherId('');
      setIsPrimaryTeacher(false);

      const res = await api.get('/teachers', { params: { limit: 100 } });
      const teachers = res.data?.data || [];
      setAvailableTeachers(teachers);
    } catch (err) {
      console.error('Failed to load teachers:', err);
      toast.error('শিক্ষক তালিকা লোড করা যায়নি');
    } finally {
      setIsLoadingModalData(false);
    }
  };

  // Submit teacher assignment
  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      toast.error('শিক্ষক নির্বাচন করুন');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post(`/batches/${batchId}/teachers`, {
        teachers: [
          {
            teacherId: selectedTeacherId,
            isPrimary: isPrimaryTeacher,
          },
        ],
      });
      toast.success('শিক্ষক সফলভাবে ব্যাচে নিযুক্ত হয়েছেন');
      setIsAssignTeacherOpen(false);
      fetchBatchDetail();
    } catch (err: any) {
      console.error('Failed to assign teacher:', err);
      toast.error(err.response?.data?.message || 'শিক্ষক নিযুক্ত করা যায়নি');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load subjects for assignment modal
  const handleOpenAssignSubjectModal = async () => {
    try {
      setIsLoadingModalData(true);
      setIsAssignSubjectOpen(true);
      const currentlyAssigned = (batch?.batchSubjects || []).map(
        (bs: any) => bs.subjectId,
      );
      setSelectedSubjectIds(currentlyAssigned);

      const res = await api.get('/subjects');
      const allSubjects = res.data?.data || [];
      setAvailableSubjects(allSubjects);
    } catch (err) {
      console.error('Failed to load subjects:', err);
      toast.error('পাঠ্যবিষয় লোড করা যায়নি');
    } finally {
      setIsLoadingModalData(false);
    }
  };

  // Submit subject assignment
  const handleAssignSubjects = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post(`/batches/${batchId}/subjects`, {
        subjectIds: selectedSubjectIds,
      });
      toast.success('পাঠ্যবিষয়সমূহ সফলভাবে আপডেট হয়েছে');
      setIsAssignSubjectOpen(false);
      fetchBatchDetail();
    } catch (err: any) {
      console.error('Failed to assign subjects:', err);
      toast.error(err.response?.data?.message || 'বিষয় যুক্ত করা যায়নি');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          ব্যাচের বিস্তারিত লোড হচ্ছে...
        </p>
      </div>
    );
  }

  if (!batch) {
    return (
      <Card>
        <CardBody className="py-16 text-center">
          <p className="text-slate-500 text-sm">ব্যাচটি খুঁজে পাওয়া যায়নি।</p>
          <Link href="/batches" className="mt-4 inline-block">
            <Button variant="secondary" size="sm" leftIcon={<FiArrowLeft />}>
              ব্যাচ তালিকায় ফিরে যান
            </Button>
          </Link>
        </CardBody>
      </Card>
    );
  }

  const enrolledStudents = (batch.batchStudents || []).filter((bs: any) => {
    if (!studentSearch.trim()) return true;
    const term = studentSearch.toLowerCase();
    const st = bs.student || {};
    return (
      (st.nameEn && st.nameEn.toLowerCase().includes(term)) ||
      (st.nameBn && st.nameBn.includes(term)) ||
      (st.studentId && st.studentId.toLowerCase().includes(term)) ||
      (bs.rollNumber && String(bs.rollNumber).includes(term))
    );
  });

  const studentCount = batch.batchStudents?.length || 0;
  const maxStudents = batch.maxStudents || 40;
  const assignedTeachers = batch.batchTeachers || [];
  const assignedSubjects = batch.batchSubjects || [];
  const routineSlots = batch.routineSlots || [];

  // Group routine by days
  const routineByDay: Record<string, any[]> = {};
  ORDERED_DAYS.forEach((day) => {
    routineByDay[day] = routineSlots.filter((slot: any) => slot.day === day);
  });

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/batches">
            <Button variant="secondary" size="sm" leftIcon={<FiArrowLeft />}>
              ফিরে যান
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {batch.name}
              </h1>
              <Badge variant={batch.isActive ? 'success' : 'neutral'}>
                {batch.isActive ? 'সক্রিয় ব্যাচ' : 'নিষ্ক্রিয়'}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              শ্রেণি: <span className="font-semibold text-slate-700">{batch.classLevel}</span>
              {batch.group && <span> • গ্রুপ: <span className="font-semibold text-slate-700">{batch.group}</span></span>}
              {batch.section && <span> • সেকশন: <span className="font-semibold text-slate-700">{batch.section}</span></span>}
              <span> • শিক্ষাবর্ষ: <span className="font-semibold text-slate-700">{toBengaliNumber(batch.year)}</span></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenAssignSubjectModal}
            leftIcon={<FiBookOpen />}
          >
            বিষয় অ্যাসাইন
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenAssignTeacherModal}
            leftIcon={<FiUserCheck />}
          >
            শিক্ষক অ্যাসাইন
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddStudentModal}
            leftIcon={<FiUserPlus />}
          >
            শিক্ষার্থী ভর্তি
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <FiUsers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">ভর্তিকৃত শিক্ষার্থী</p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {toBengaliNumber(studentCount)} / {toBengaliNumber(maxStudents)} জন
              </h3>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <FiDollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">মাসিক ফি</p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {formatCurrency(batch.monthlyFee || 0)}
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
              <p className="text-xs text-slate-500 font-medium">নিযুক্ত শিক্ষক</p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {toBengaliNumber(assignedTeachers.length)} জন
              </h3>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <FiCalendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">সাপ্তাহিক ক্লাস</p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {toBengaliNumber(routineSlots.length)} টি স্লট
              </h3>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        tabs={[
          {
            id: 'students',
            label: 'ছাত্র-ছাত্রী',
            icon: <FiUsers className="w-4 h-4" />,
            badge: toBengaliNumber(studentCount),
          },
          {
            id: 'teachers',
            label: 'শিক্ষকবৃন্দ',
            icon: <FiUserCheck className="w-4 h-4" />,
            badge: toBengaliNumber(assignedTeachers.length),
          },
          {
            id: 'subjects',
            label: 'পাঠ্য বিষয়সমূহ',
            icon: <FiBookOpen className="w-4 h-4" />,
            badge: toBengaliNumber(assignedSubjects.length),
          },
          {
            id: 'routine',
            label: 'সাপ্তাহিক রুটিন',
            icon: <FiCalendar className="w-4 h-4" />,
          },
          {
            id: 'exams',
            label: 'পরীক্ষা ও রেজাল্ট',
            icon: <FiFileText className="w-4 h-4" />,
          },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="pills"
      />

      {/* Tab 1: Students */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-slate-100">
              <div className="relative w-full sm:w-72">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="রোল, নাম বা আইডি দিয়ে খুঁজুন..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAddStudentModal}
                leftIcon={<FiUserPlus />}
              >
                নতুন শিক্ষার্থী যোগ করুন
              </Button>
            </CardHeader>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">রোল নং</TableHead>
                  <TableHead>শিক্ষার্থী</TableHead>
                  <TableHead>আইডি</TableHead>
                  <TableHead>ফোন নম্বর</TableHead>
                  <TableHead>অভিভাবকের ফোন</TableHead>
                  <TableHead>ভর্তির তারিখ</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolledStudents.length === 0 ? (
                  <TableEmpty
                    colSpan={7}
                    message={
                      studentSearch
                        ? 'কোনো শিক্ষার্থী খুঁজে পাওয়া যায়নি'
                        : 'এই ব্যাচে এখনও কোনো শিক্ষার্থী ভর্তি হয়নি'
                    }
                  />
                ) : (
                  enrolledStudents.map((bs: any) => {
                    const st = bs.student || {};
                    return (
                      <TableRow key={bs.id} className="hover:bg-slate-50/70 transition-colors">
                        <TableCell className="font-bold text-slate-900 text-xs">
                          {bs.rollNumber ? toBengaliNumber(bs.rollNumber) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {(st.nameBn || st.nameEn || 'S').slice(0, 1)}
                            </div>
                            <div>
                              <Link
                                href={`/students/${st.id}`}
                                className="font-bold text-xs sm:text-sm text-slate-900 hover:text-indigo-600 transition-colors"
                              >
                                {st.nameBn || st.nameEn}
                              </Link>
                              {st.nameBn && (
                                <p className="text-[11px] text-slate-400">{st.nameEn}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {st.studentId}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">
                          {st.phone || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">
                          {st.guardianPhone || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {formatDate(bs.joinedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/students/${st.id}`}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="প্রোফাইল দেখুন"
                            >
                              <FiEye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleRemoveStudent(st.id, st.nameBn || st.nameEn)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="ব্যাচ থেকে বাদ দিন"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Tab 2: Teachers */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">
              ব্যাচে নিয়োজিত শিক্ষকবৃন্দ
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAssignTeacherModal}
              leftIcon={<FiPlus />}
            >
              শিক্ষক যুক্ত করুন
            </Button>
          </div>

          {assignedTeachers.length === 0 ? (
            <Card>
              <CardBody className="py-12 text-center">
                <FiUserCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">এখনও কোনো শিক্ষক যুক্ত করা হয়নি</p>
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleOpenAssignTeacherModal}
                    leftIcon={<FiPlus />}
                  >
                    প্রথম শিক্ষক যুক্ত করুন
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedTeachers.map((bt: any) => {
                const t = bt.teacher || {};
                return (
                  <Card key={bt.id} className="hover:border-indigo-200 transition-all">
                    <CardBody className="p-4 flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                        {(t.nameBn || t.nameEn || 'T').slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 truncate">
                            {t.nameBn || t.nameEn}
                          </h4>
                          {bt.isPrimary && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              ক্লাস টিচার
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {t.designation || 'সহকারী শিক্ষক'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
                          <FiPhone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t.phone}</span>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100">
                          <Link
                            href={`/teachers/${t.id}`}
                            className="text-xs font-semibold text-indigo-600 hover:underline"
                          >
                            প্রোফাইল ও সময়সূচী দেখুন →
                          </Link>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Subjects */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">
              এই ব্যাচে পাঠদানকৃত বিষয়সমূহ
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAssignSubjectModal}
              leftIcon={<FiBookOpen />}
            >
              বিষয় পরিবর্তন / নির্বাচন
            </Button>
          </div>

          {assignedSubjects.length === 0 ? (
            <Card>
              <CardBody className="py-12 text-center">
                <FiBookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">এখনও কোনো বিষয় যুক্ত করা হয়নি</p>
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleOpenAssignSubjectModal}
                    leftIcon={<FiBookOpen />}
                  >
                    বিষয় নির্বাচন করুন
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedSubjects.map((bs: any) => {
                const s = bs.subject || {};
                return (
                  <Card key={bs.id}>
                    <CardBody className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {s.code}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 pt-1">
                          {s.name}
                        </h4>
                        <p className="text-xs text-slate-500">
                          পূর্ণমান: {toBengaliNumber(s.fullMarks || 100)} • পাস নম্বর: {toBengaliNumber(s.passMarks || 33)}
                        </p>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                        <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Weekly Routine */}
      {activeTab === 'routine' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                সাপ্তাহিক ক্লাস সময়সূচী
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                সপ্তাহের প্রতি দিনের ক্লাস, শিক্ষক এবং কক্ষ নম্বর
              </p>
            </div>
            <Link href="/routine">
              <Button variant="secondary" size="sm" leftIcon={<FiCalendar />}>
                পূর্ণাঙ্গ রুটিন ম্যানেজার
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ORDERED_DAYS.map((day) => {
              const slots = routineByDay[day] || [];
              return (
                <Card key={day} className="overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 tracking-wide">
                      {DAYS_BN[day]}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {toBengaliNumber(slots.length)} টি ক্লাস
                    </span>
                  </div>
                  <CardBody className="p-3 divide-y divide-slate-100">
                    {slots.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center italic">
                        কোনো ক্লাস নেই
                      </p>
                    ) : (
                      slots.map((slot: any) => (
                        <div key={slot.id} className="py-2.5 first:pt-1 last:pb-1 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">
                              {slot.subject?.name || 'সাধারণ পাঠ'}
                            </span>
                            <span className="font-mono text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{slot.teacher?.nameBn || slot.teacher?.nameEn || 'শিক্ষক নির্ধারিত নেই'}</span>
                            {slot.roomNo && (
                              <span className="flex items-center gap-1 text-slate-400">
                                <FiMapPin className="w-3 h-3" /> রুম: {slot.roomNo}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Exams */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">
                এই ব্যাচের পরীক্ষাসমূহ
              </h3>
              <Link href="/exams">
                <Button variant="secondary" size="sm" leftIcon={<FiPlus />}>
                  নতুন পরীক্ষা নিন
                </Button>
              </Link>
            </CardHeader>
            <CardBody className="p-8 text-center">
              <FiFileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-700">কোনো পরীক্ষা শিডিউল নেই</h4>
              <p className="text-xs text-slate-400 mt-1">
                এই ব্যাচের ক্লাস টেস্ট বা মাসিক পরীক্ষার মার্কস এবং ফলাফল এখানে প্রদর্শিত হবে।
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Modal 1: Enroll Student */}
      <Modal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        title="ব্যাচে শিক্ষার্থী ভর্তি / যুক্ত করুন"
        size="md"
      >
        <form onSubmit={handleEnrollStudent} className="space-y-4">
          {isLoadingModalData ? (
            <div className="py-8 flex justify-center">
              <Spinner size="md" />
            </div>
          ) : availableStudents.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-sm text-slate-600 font-medium">
                ভর্তিযোগ্য কোনো শিক্ষার্থী অবশিষ্ট নেই।
              </p>
              <p className="text-xs text-slate-400">
                এই শ্রেণির সকল শিক্ষার্থী ইতিমধ্যে ব্যাচে অন্তর্ভুক্ত রয়েছে অথবা শিক্ষার্থী যুক্ত করা হয়নি।
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  শিক্ষার্থী নির্বাচন করুন *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  required
                >
                  <option value="">-- শিক্ষার্থী সিলেক্ট করুন --</option>
                  {availableStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.nameBn || st.nameEn} (ID: {st.studentId})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="ব্যাচ রোল নম্বর *"
                type="number"
                placeholder="যেমন: 1, 2, 3..."
                value={studentRollNo}
                onChange={(e) => setStudentRollNo(e.target.value ? Number(e.target.value) : '')}
                required
              />
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddStudentOpen(false)}
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isLoadingModalData || availableStudents.length === 0}
            >
              ভর্তি নিশ্চিত করুন
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Assign Teacher */}
      <Modal
        isOpen={isAssignTeacherOpen}
        onClose={() => setIsAssignTeacherOpen(false)}
        title="ব্যাচে শিক্ষক নিযুক্ত করুন"
        size="md"
      >
        <form onSubmit={handleAssignTeacher} className="space-y-4">
          {isLoadingModalData ? (
            <div className="py-8 flex justify-center">
              <Spinner size="md" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  শিক্ষক নির্বাচন করুন *
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  required
                >
                  <option value="">-- শিক্ষক সিলেক্ট করুন --</option>
                  {availableTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameBn || t.nameEn} ({t.designation || 'শিক্ষক'}) - {t.phone}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrimaryTeacher}
                  onChange={(e) => setIsPrimaryTeacher(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
                />
                <span className="text-xs sm:text-sm font-medium text-slate-700">
                  ইনি এই ব্যাচের প্রধান শিক্ষক / ক্লাস টিচার (Class Teacher)
                </span>
              </label>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAssignTeacherOpen(false)}
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isLoadingModalData}
            >
              নিযুক্ত করুন
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Assign Subjects */}
      <Modal
        isOpen={isAssignSubjectOpen}
        onClose={() => setIsAssignSubjectOpen(false)}
        title="ব্যাচের পাঠ্য বিষয়সমূহ নির্বাচন করুন"
        size="lg"
      >
        <form onSubmit={handleAssignSubjects} className="space-y-4">
          {isLoadingModalData ? (
            <div className="py-8 flex justify-center">
              <Spinner size="md" />
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              <p className="text-xs text-slate-500 mb-2">
                এই ব্যাচের শিক্ষার্থীদের জন্য প্রযোজ্য সকল বিষয় টিকচিহ্ন দিন:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableSubjects.map((sub) => {
                  const isChecked = selectedSubjectIds.includes(sub.id);
                  return (
                    <label
                      key={sub.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-50/70 border-indigo-200 font-semibold text-indigo-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubjectIds([...selectedSubjectIds, sub.id]);
                          } else {
                            setSelectedSubjectIds(
                              selectedSubjectIds.filter((id) => id !== sub.id),
                            );
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
                      />
                      <span className="font-mono text-[11px] text-slate-500">{sub.code}</span>
                      <span className="truncate">{sub.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAssignSubjectOpen(false)}
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isLoadingModalData}
            >
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
