'use client';

import React, { useState, useEffect, use } from 'react';
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
import { PageLoader, Spinner } from '../../../../components/ui/Loader';
import { formatDate, formatCurrency } from '../../../../lib/utils';
import {
  FiArrowLeft,
  FiPhone,
  FiMail,
  FiCalendar,
  FiClock,
  FiBook,
  FiMapPin,
  FiBriefcase,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const dayNamesBangla: Record<string, string> = {
  SATURDAY: 'শনিবার',
  SUNDAY: 'রবিবার',
  MONDAY: 'সোমবার',
  TUESDAY: 'মঙ্গলবার',
  WEDNESDAY: 'বুধবার',
  THURSDAY: 'বৃহস্পতিবার',
  FRIDAY: 'শুক্রবার',
};

export default function TeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [teacher, setTeacher] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    async function fetchTeacher() {
      try {
        setIsLoading(true);
        const res = await api.get(`/teachers/${id}`);
        setTeacher(res.data?.data || res.data);
      } catch (err) {
        toast.error('শিক্ষকের তথ্য লোড করতে ব্যর্থ হয়েছে');
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeacher();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'schedule' && schedule.length === 0) {
      setIsScheduleLoading(true);
      api
        .get(`/teachers/${id}/schedule`)
        .then((res) => {
          setSchedule(res.data?.data || res.data || []);
        })
        .catch(() => toast.error('ক্লাস শিডিউল লোড করতে সমস্যা হয়েছে'))
        .finally(() => setIsScheduleLoading(false));
    }
  }, [activeTab, id, schedule.length]);

  if (isLoading) {
    return <PageLoader text="শিক্ষকের প্রোফাইল লোড হচ্ছে..." />;
  }

  if (!teacher) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-slate-600">শিক্ষক পাওয়া যায়নি।</p>
        <Link href="/dashboard/teachers">
          <Button variant="primary">তালিকায় ফিরে যান</Button>
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: '👤 প্রোফাইল পরিচিতি' },
    { id: 'subjects', label: '📚 পাঠদানের বিষয়' },
    { id: 'schedule', label: '📅 সাপ্তাহিক ক্লাস শিডিউল' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/teachers"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          শিক্ষক তালিকায় ফিরে যান
        </Link>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-linear-to-tr from-purple-600 via-indigo-600 to-indigo-700 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg shadow-indigo-600/25 shrink-0">
            {teacher.nameEn.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {teacher.nameEn}
              </h1>
              {teacher.nameBn && (
                <span className="text-lg text-slate-500 font-medium">
                  ({teacher.nameBn})
                </span>
              )}
              <Badge variant={teacher.isActive ? 'success' : 'danger'} dot size="sm">
                {teacher.isActive ? 'সক্রিয় শিক্ষক' : 'নিষ্ক্রিয়'}
              </Badge>
            </div>

            <p className="text-sm font-semibold text-indigo-600">
              {teacher.designation || 'শিক্ষক'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-slate-500 font-medium">
              <span className="font-mono bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg border border-indigo-200/60 font-semibold">
                আইডি: {teacher.teacherId}
              </span>
              <span>• মোবাইল: <strong className="text-slate-800">{teacher.phone}</strong></span>
              {teacher.specialization && (
                <span>• বিষয়: <strong className="text-slate-800">{teacher.specialization}</strong></span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="পেশাগত ও শিক্ষাগত বিবরণী" />
            <CardBody className="divide-y divide-slate-100 text-sm">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">পদবি</span>
                <span className="font-semibold text-slate-800">{teacher.designation || '-'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">শিক্ষাগত যোগ্যতা</span>
                <span className="font-semibold text-slate-800">{teacher.qualification || '-'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">বিশেষ পারদর্শিতা</span>
                <span className="font-semibold text-slate-800">{teacher.specialization || '-'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">যোগদানের তারিখ</span>
                <span className="font-semibold text-slate-800">{formatDate(teacher.joiningDate)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">মাসিক বেতন/সম্মানী</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(teacher.monthlySalary)}</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="ব্যক্তিগত ও যোগাযোগ তথ্য" />
            <CardBody className="divide-y divide-slate-100 text-sm">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">মোবাইল নম্বর</span>
                <span className="font-semibold text-slate-800 font-mono">{teacher.phone}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">ইমেইল</span>
                <span className="font-semibold text-slate-800">{teacher.email || '-'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">লিঙ্গ</span>
                <span className="font-semibold text-slate-800">{teacher.gender === 'MALE' ? 'পুরুষ' : 'মহিলা'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">জাতীয় পরিচয়পত্র (NID)</span>
                <span className="font-semibold text-slate-800 font-mono">{teacher.nidNumber || '-'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">বর্তমান ঠিকানা</span>
                <span className="font-semibold text-slate-800">{teacher.address || '-'}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab 2: Assigned Subjects */}
      {activeTab === 'subjects' && (
        <Card>
          <CardHeader title="পাঠদানের জন্য নির্ধারিত বিষয়সমূহ" subtitle="অনুমোদিত সাবজেক্ট তালিকা" />
          <CardBody>
            {teacher.teacherSubjects && teacher.teacherSubjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teacher.teacherSubjects.map((ts: any) => (
                  <div
                    key={ts.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{ts.subject?.name}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">কোড: {ts.subject?.code}</p>
                    </div>
                    <Badge variant="primary" size="sm">
                      {ts.subject?.classLevel || 'সকল শ্রেণি'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic py-6 text-center">
                কোনো বিষয় অ্যাসাইন করা হয়নি।
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {/* Tab 3: Schedule */}
      {activeTab === 'schedule' && (
        <Card>
          <CardHeader title="সাপ্তাহিক ক্লাসের সময়সূচী" subtitle="রুটিন অনুসারে নির্ধারিত ক্লাস" />
          {isScheduleLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>বার / দিন</TableHead>
                  <TableHead>সময়</TableHead>
                  <TableHead>বিষয়</TableHead>
                  <TableHead>ব্যাচ ও ক্লাস</TableHead>
                  <TableHead>রুম নং</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.length > 0 ? (
                  schedule.map((slot: any) => (
                    <TableRow key={slot.id}>
                      <TableCell className="font-semibold text-slate-900">
                        {dayNamesBangla[slot.day] || slot.day}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-indigo-600 font-bold">
                        {slot.startTime} - {slot.endTime}
                      </TableCell>
                      <TableCell>{slot.subject?.name}</TableCell>
                      <TableCell>
                        <Badge variant="primary" size="sm">
                          {slot.batch?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>{slot.roomNo || 'রুম ২০২'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableEmpty
                    colSpan={5}
                    message="বর্তমানে কোনো ক্লাস রুটিন অ্যাসাইন করা নেই"
                    description="রুটিন মডিউল থেকে ক্লাস শিডিউল যোগ করুন।"
                  />
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
