'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { Student } from '../../../../types';
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
import {
  formatDate,
  formatCurrency,
  toBengaliNumber,
} from '../../../../lib/utils';
import {
  FiArrowLeft,
  FiPhone,
  FiMail,
  FiCalendar,
  FiUser,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiAward,
  FiMessageSquare,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  // Attendance Tab Data
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);

  // Marks Tab Data
  const [marksData, setMarksData] = useState<any[]>([]);
  const [isMarksLoading, setIsMarksLoading] = useState(false);

  // Fee Tab Data
  const [feeData, setFeeData] = useState<any>(null);
  const [isFeeLoading, setIsFeeLoading] = useState(false);

  useEffect(() => {
    async function fetchStudent() {
      try {
        setIsLoading(true);
        const res = await api.get(`/students/${id}`);
        setStudent(res.data?.data || res.data);
      } catch (err) {
        toast.error('শিক্ষার্থীর তথ্য লোড করতে ব্যর্থ হয়েছে');
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudent();
  }, [id]);

  // Load Tab Specific Data
  useEffect(() => {
    if (activeTab === 'attendance' && !attendanceData) {
      setIsAttendanceLoading(true);
      api
        .get(`/students/${id}/attendance`)
        .then((res) => setAttendanceData(res.data?.data || res.data))
        .catch(() => toast.error('হাজিরা তথ্য লোড ব্যর্থ হয়েছে'))
        .finally(() => setIsAttendanceLoading(false));
    } else if (activeTab === 'marks' && marksData.length === 0) {
      setIsMarksLoading(true);
      api
        .get(`/students/${id}/marks`)
        .then((res) => setMarksData(res.data?.data || res.data))
        .catch(() => toast.error('মার্কস তথ্য লোড ব্যর্থ হয়েছে'))
        .finally(() => setIsMarksLoading(false));
    } else if (activeTab === 'fees' && !feeData) {
      setIsFeeLoading(true);
      api
        .get(`/students/${id}/fees`)
        .then((res) => setFeeData(res.data?.data || res.data))
        .catch(() => toast.error('ফি তথ্য লোড ব্যর্থ হয়েছে'))
        .finally(() => setIsFeeLoading(false));
    }
  }, [activeTab, id, attendanceData, marksData.length, feeData]);

  if (isLoading) {
    return <PageLoader text="শিক্ষার্থীর প্রোফাইল লোড হচ্ছে..." />;
  }

  if (!student) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-slate-600">শিক্ষার্থী পাওয়া যায়নি।</p>
        <Link href="/dashboard/students">
          <Button variant="primary">তালিকায় ফিরে যান</Button>
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: '👤 প্রোফাইল পরিচিতি' },
    { id: 'attendance', label: '📅 হাজিরা বিবরণী' },
    { id: 'marks', label: '📝 পরীক্ষার ফলাফল' },
    { id: 'fees', label: '💰 ফি ও পেমেন্ট হিস্ট্রি' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/students"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          শিক্ষার্থী তালিকায় ফিরে যান
        </Link>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg shadow-indigo-600/25 shrink-0">
            {student.nameEn.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {student.nameEn}
              </h1>
              {student.nameBn && (
                <span className="text-lg text-slate-500 font-medium">
                  ({student.nameBn})
                </span>
              )}
              <Badge variant={student.isActive ? 'success' : 'danger'} dot size="sm">
                {student.isActive ? 'সক্রিয় শিক্ষার্থী' : 'নিষ্ক্রিয়'}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-slate-500 font-medium">
              <span className="font-mono bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg border border-indigo-200/60 font-semibold">
                আইডি: {student.studentId}
              </span>
              <span>• শ্রেণি: <strong className="text-slate-800">{student.classLevel}</strong></span>
              <span>• বিভাগ: <strong className="text-slate-800">{student.group || 'সাধারণ'}</strong></span>
              <span>• ভর্তি: <strong className="text-slate-800">{formatDate(student.admissionDate)}</strong></span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/dashboard/sms/send?phone=${student.guardianPhone}`}>
              <Button variant="secondary" size="sm" leftIcon={<FiMessageSquare />}>
                এসএমএস পাঠান
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Tab 1: Profile Details */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info */}
          <Card>
            <CardHeader title="ব্যক্তিগত তথ্য" subtitle="শিক্ষার্থীর জন্ম ও যোগাযোগ" />
            <CardBody className="divide-y divide-slate-100 text-sm">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">জেন্ডার</span>
                <span className="font-semibold text-slate-800">{student.gender === 'MALE' ? 'ছাত্র' : 'ছাত্রী'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">জন্ম তারিখ</span>
                <span className="font-semibold text-slate-800">{formatDate(student.dateOfBirth)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">রক্তের গ্রুপ</span>
                <span className="font-semibold text-slate-800">{student.bloodGroup?.replace('_', ' ') || '-'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">নিজস্ব মোবাইল</span>
                <span className="font-semibold text-slate-800 font-mono">{student.phone || '-'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">ইমেইল</span>
                <span className="font-semibold text-slate-800">{student.email || '-'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">স্কুল / কলেজ</span>
                <span className="font-semibold text-slate-800">{student.instituteName || '-'}</span>
              </div>
            </CardBody>
          </Card>

          {/* Guardian Info */}
          <Card>
            <CardHeader title="অভিভাবকের তথ্য" subtitle="এসএমএস নোটিফিকেশনের মূল নম্বর" />
            <CardBody className="divide-y divide-slate-100 text-sm">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">পিতার নাম</span>
                <span className="font-semibold text-slate-800">{student.fatherName}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">পিতার মোবাইল</span>
                <span className="font-semibold text-slate-800 font-mono">{student.fatherPhone || '-'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">মাতার নাম</span>
                <span className="font-semibold text-slate-800">{student.motherName || '-'}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center bg-indigo-50/50 px-3 rounded-lg">
                <span className="text-indigo-900 font-medium">অভিভাবকের ফোন (SMS)</span>
                <span className="font-bold text-indigo-700 font-mono text-base">{student.guardianPhone}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">সম্পর্ক</span>
                <span className="font-semibold text-slate-800">{student.guardianRelation || 'পিতা'}</span>
              </div>
            </CardBody>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader title="ঠিকানা" />
            <CardBody className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">বর্তমান ঠিকানা</p>
                <p className="font-medium text-slate-800 mt-1">{student.presentAddress || 'উল্লেখ নেই'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">স্থায়ী ঠিকানা</p>
                <p className="font-medium text-slate-800 mt-1">{student.permanentAddress || 'উল্লেখ নেই'}</p>
              </div>
            </CardBody>
          </Card>

          {/* Fee Policy */}
          <Card>
            <CardHeader title="ফি কাঠামো" />
            <CardBody className="divide-y divide-slate-100 text-sm">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">ভর্তি ফি</span>
                <span className="font-semibold text-slate-800">{formatCurrency(student.admissionFee)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">মাসিক টিউশন ফি</span>
                <span className="font-semibold text-slate-800">{formatCurrency(student.monthlyFee)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">অনুমোদিত ছাড়</span>
                <span className="font-semibold text-emerald-600">{toBengaliNumber(student.discount || 0)}%</span>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab 2: Attendance */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {isAttendanceLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : attendanceData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardBody className="p-4 text-center">
                    <p className="text-xs text-slate-500">মোট ক্লাস</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {toBengaliNumber(attendanceData.summary.total)}
                    </p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="p-4 text-center">
                    <p className="text-xs text-emerald-600 font-semibold">উপস্থিতি</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                      {toBengaliNumber(attendanceData.summary.present)}
                    </p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="p-4 text-center">
                    <p className="text-xs text-rose-600 font-semibold">অনুপস্থিতি</p>
                    <p className="text-2xl font-bold text-rose-600 mt-1">
                      {toBengaliNumber(attendanceData.summary.absent)}
                    </p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="p-4 text-center">
                    <p className="text-xs text-amber-600 font-semibold">দেরি / ছুটি</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">
                      {toBengaliNumber(attendanceData.summary.late + attendanceData.summary.excused)}
                    </p>
                  </CardBody>
                </Card>
              </div>

              {/* Records Table */}
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>তারিখ</TableHead>
                      <TableHead>ব্যাচ</TableHead>
                      <TableHead>হাজিরা স্ট্যাটাস</TableHead>
                      <TableHead>এসএমএস পাঠানো হয়েছে?</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.records.length > 0 ? (
                      attendanceData.records.map((att: any) => (
                        <TableRow key={att.id}>
                          <TableCell>{formatDate(att.date)}</TableCell>
                          <TableCell>{att.batch?.name || '-'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                att.status === 'PRESENT'
                                  ? 'success'
                                  : att.status === 'ABSENT'
                                  ? 'danger'
                                  : 'warning'
                              }
                              size="sm"
                              dot
                            >
                              {att.status === 'PRESENT'
                                ? 'উপস্থিত'
                                : att.status === 'ABSENT'
                                ? 'অনুপস্থিত'
                                : 'দেরি'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {att.smsSent ? (
                              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                <FiCheckCircle /> পাঠানো হয়েছে
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableEmpty colSpan={4} message="কোনো হাজিরার রেকর্ড নেই" />
                    )}
                  </TableBody>
                </Table>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {/* Tab 3: Marks */}
      {activeTab === 'marks' && (
        <Card>
          <CardHeader title="পরীক্ষার ফলাফল তালিকা" subtitle="সকল পরীক্ষার প্রাপ্ত মার্কস ও গ্রেড" />
          {isMarksLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>পরীক্ষার নাম</TableHead>
                  <TableHead>বিষয়</TableHead>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>মোট নম্বর</TableHead>
                  <TableHead>প্রাপ্ত নম্বর</TableHead>
                  <TableHead>গ্রেড</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marksData.length > 0 ? (
                  marksData.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-semibold text-slate-900">{m.exam?.name}</TableCell>
                      <TableCell>{m.subject?.name}</TableCell>
                      <TableCell>{formatDate(m.exam?.examDate)}</TableCell>
                      <TableCell>{m.exam?.fullMarks}</TableCell>
                      <TableCell className="font-bold text-indigo-600">{m.obtainedMarks}</TableCell>
                      <TableCell>
                        <Badge variant="primary" size="sm">
                          {m.grade || 'A+'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableEmpty colSpan={6} message="এখনো কোনো পরীক্ষার মার্কস এন্ট্রি করা হয়নি" />
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Tab 4: Fees */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          {isFeeLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : feeData ? (
            <>
              {/* Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-emerald-50/50 border-emerald-200">
                  <CardBody className="p-5">
                    <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">মোট পরিশোধিত</p>
                    <p className="text-3xl font-extrabold text-emerald-700 mt-1">
                      {formatCurrency(feeData.totalPaid)}
                    </p>
                  </CardBody>
                </Card>
                <Card className="bg-rose-50/50 border-rose-200">
                  <CardBody className="p-5">
                    <p className="text-xs text-rose-700 font-semibold uppercase tracking-wider">মোট বকেয়া</p>
                    <p className="text-3xl font-extrabold text-rose-700 mt-1">
                      {formatCurrency(feeData.totalDue)}
                    </p>
                  </CardBody>
                </Card>
              </div>

              {/* History Table */}
              <Card>
                <CardHeader title="পেমেন্ট রসিদ হিস্ট্রি" />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>রসিদ নং</TableHead>
                      <TableHead>ফি বিবরণী</TableHead>
                      <TableHead>তারিখ</TableHead>
                      <TableHead>পরিশোধ</TableHead>
                      <TableHead>বকেয়া</TableHead>
                      <TableHead>পেমেন্ট মেথড</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeData.history.length > 0 ? (
                      feeData.history.map((fee: any) => (
                        <TableRow key={fee.id}>
                          <TableCell className="font-mono font-semibold text-indigo-600">
                            {fee.receiptNo}
                          </TableCell>
                          <TableCell>{fee.feeMonth || fee.feeType}</TableCell>
                          <TableCell>{formatDate(fee.paymentDate)}</TableCell>
                          <TableCell className="font-bold text-emerald-600">
                            {formatCurrency(fee.paidAmount)}
                          </TableCell>
                          <TableCell className="text-rose-600">
                            {fee.dueAmount > 0 ? formatCurrency(fee.dueAmount) : 'পরিশোধিত'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="neutral" size="sm">
                              {fee.paymentMethod}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableEmpty colSpan={6} message="কোনো পেমেন্ট হিস্ট্রি নেই" />
                    )}
                  </TableBody>
                </Table>
              </Card>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
