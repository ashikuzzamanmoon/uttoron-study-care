'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Loader';
import { AppChart } from '../../../components/ui/Chart';
import { formatCurrency, formatDate, toBengaliNumber } from '../../../lib/utils';
import {
  FiUsers,
  FiUserCheck,
  FiDollarSign,
  FiAlertCircle,
  FiCheckCircle,
  FiMessageSquare,
  FiCalendar,
  FiActivity,
  FiArrowRight,
  FiPlus,
  FiRefreshCw,
  FiTrendingUp,
  FiPieChart,
  FiClock,
  FiBookOpen,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface QuickStats {
  totalStudents: number;
  totalTeachers: number;
  totalBatches: number;
  todayIncome: number;
  todayExpense: number;
  thisMonthIncome: number;
  thisMonthExpense: number;
  totalDues: number;
  todaySmsCount: number;
  todayAttendance: {
    total: number;
    present: number;
    absent: number;
    rate: number;
  };
}

interface MonthlyData {
  year: number;
  months: Array<{
    month: number;
    nameEn: string;
    nameBn: string;
    income: number;
    expense: number;
    netProfit: number;
  }>;
}

interface AttendanceData {
  total: number;
  presentRate: number;
  distribution: {
    PRESENT: number;
    ABSENT: number;
    LATE: number;
    EXCUSED: number;
  };
  dailyTrend: Array<{
    date: string;
    present: number;
    absent: number;
    total: number;
  }>;
}

interface ExpenseCategoryData {
  year: number;
  totalExpense: number;
  breakdown: Array<{
    category: string;
    categoryBn: string;
    amount: number;
    percentage: number;
  }>;
}

interface ActivityItem {
  id: string;
  type: 'ADMISSION' | 'FEE_COLLECTION' | 'EXAM';
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
}

interface UpcomingExam {
  id: string;
  name: string;
  examDate: string;
  examType: string;
  fullMarks: number;
  duration?: number;
  batch: { id: string; name: string; classLevel: string };
  subject: { id: string; name: string; code: string };
  teacher?: { id: string; nameEn: string; nameBn?: string };
}

interface DueAlert {
  studentId: string;
  systemId: string;
  nameEn: string;
  nameBn: string | null;
  phone: string;
  classLevel: string;
  batchName: string;
  totalDue: number;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [monthlyChart, setMonthlyChart] = useState<MonthlyData | null>(null);
  const [attendanceChart, setAttendanceChart] = useState<AttendanceData | null>(null);
  const [expenseChart, setExpenseChart] = useState<ExpenseCategoryData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [dueAlerts, setDueAlerts] = useState<DueAlert[]>([]);

  const [chartViewType, setChartViewType] = useState<'bar' | 'line'>('bar');

  // Fetch all dashboard metrics
  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [
        statsRes,
        monthlyRes,
        attendanceRes,
        expenseRes,
        activityRes,
        examsRes,
        duesRes,
      ] = await Promise.all([
        api.get('/dashboard/quick-stats'),
        api.get('/dashboard/charts/monthly-income'),
        api.get('/dashboard/charts/attendance'),
        api.get('/dashboard/charts/expense-categories'),
        api.get('/dashboard/recent-activities'),
        api.get('/dashboard/upcoming-exams'),
        api.get('/dashboard/due-alerts?limit=6'),
      ]);

      setQuickStats(statsRes.data);
      setMonthlyChart(monthlyRes.data);
      setAttendanceChart(attendanceRes.data);
      setExpenseChart(expenseRes.data);
      setActivities(activityRes.data || []);
      setUpcomingExams(examsRes.data || []);
      setDueAlerts(duesRes.data || []);

      if (isManualRefresh) {
        toast.success('ড্যাশবোর্ড ডাটা আপডেট সম্পন্ন হয়েছে');
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('ড্যাশবোর্ড ডাটা লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Time-based greetings in Bengali
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'শুভ সকাল';
    if (hour < 16) return 'শুভ দুপুর';
    if (hour < 19) return 'শুভ বিকেল';
    return 'শুভ সন্ধ্যা';
  };

  // Bengali Date String
  const getBengaliToday = () => {
    const today = new Date();
    const daysBn = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const monthsBn = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    return `${toBengaliNumber(today.getDate())} ${monthsBn[today.getMonth()]}, ${toBengaliNumber(today.getFullYear())} | ${daysBn[today.getDay()]}`;
  };

  // Chart datasets configuration
  const monthlyChartData = {
    labels: monthlyChart?.months.map((m) => m.nameBn) || [],
    datasets: [
      {
        label: 'আদায় (টাকা)',
        data: monthlyChart?.months.map((m) => m.income) || [],
        backgroundColor: 'rgba(79, 70, 229, 0.85)',
        borderColor: '#4f46e5',
        borderWidth: chartViewType === 'line' ? 3 : 1,
        borderRadius: chartViewType === 'bar' ? 6 : 0,
        tension: 0.35,
        fill: chartViewType === 'line' ? true : false,
      },
      {
        label: 'খরচ (টাকা)',
        data: monthlyChart?.months.map((m) => m.expense) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.75)',
        borderColor: '#ef4444',
        borderWidth: chartViewType === 'line' ? 3 : 1,
        borderRadius: chartViewType === 'bar' ? 6 : 0,
        tension: 0.35,
        fill: chartViewType === 'line' ? true : false,
      },
    ],
  };

  // Attendance doughnut dataset
  const attendanceChartData = {
    labels: ['উপস্থিত', 'দেরিতে', 'অনুপস্থিত', 'ছুটি'],
    datasets: [
      {
        data: [
          attendanceChart?.distribution.PRESENT || 0,
          attendanceChart?.distribution.LATE || 0,
          attendanceChart?.distribution.ABSENT || 0,
          attendanceChart?.distribution.EXCUSED || 0,
        ],
        backgroundColor: [
          '#10b981', // Emerald - Present
          '#f59e0b', // Amber - Late
          '#ef4444', // Red - Absent
          '#64748b', // Slate - Excused
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // Expense breakdown pie dataset
  const expenseChartData = {
    labels: expenseChart?.breakdown.map((b) => b.categoryBn) || [],
    datasets: [
      {
        data: expenseChart?.breakdown.map((b) => b.amount) || [],
        backgroundColor: [
          '#6366f1',
          '#ec4899',
          '#f97316',
          '#06b6d4',
          '#84cc16',
          '#8b5cf6',
          '#14b8a6',
          '#f43f5e',
          '#eab308',
          '#94a3b8',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" className="text-indigo-600" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          উত্তরণ ড্যাশবোর্ডের সার্বিক পরিসংখ্যান লোড করা হচ্ছে...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* 1. Hero / Welcome Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-indigo-700 via-indigo-600 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/15">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" className="bg-white/20 text-white border-white/20 text-xs font-medium">
                উত্তরণ স্টাডি কেয়ার
              </Badge>
              <span className="text-xs text-indigo-200 font-medium">
                {getBengaliToday()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {getGreeting()}, {user?.username || 'অ্যাডমিন'}!
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed">
              কোচিং ম্যানেজমেন্ট ও স্মার্ট এসএমএস ইঞ্জিনের লাইভ ওভারভিউ। সকল অ্যাকাডেমিক ও আর্থিক কর্মকাণ্ড এক নজরে দেখুন।
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/accounts/collect">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-sm border-0"
              >
                <FiDollarSign className="w-4 h-4 mr-1 text-emerald-600" />
                ফি আদায়
              </Button>
            </Link>
            <Link href="/attendance">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 backdrop-blur-xs"
              >
                <FiCheckCircle className="w-4 h-4 mr-1 text-emerald-300" />
                হাজিরা গ্রহণ
              </Button>
            </Link>
            <Link href="/sms/send">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 backdrop-blur-xs"
              >
                <FiMessageSquare className="w-4 h-4 mr-1 text-amber-300" />
                এসএমএস পাঠান
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
              className="bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 p-2"
              title="রিফ্রেশ করুন"
            >
              <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute left-1/2 top-0 -translate-y-1/2 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Top Metric Cards (6 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Active Students */}
        <Link href="/students" className="group">
          <Card hoverEffect className="h-full border-slate-200/80 hover:border-indigo-400 transition-all">
            <CardBody className="p-4 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  মোট শিক্ষার্থী
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FiUsers className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {toBengaliNumber(quickStats?.totalStudents || 0)} জন
                </p>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  সক্রিয় ব্যাচ: {toBengaliNumber(quickStats?.totalBatches || 0)}টি
                </p>
              </div>
            </CardBody>
          </Card>
        </Link>

        {/* Card 2: Active Teachers */}
        <Link href="/teachers" className="group">
          <Card hoverEffect className="h-full border-slate-200/80 hover:border-purple-400 transition-all">
            <CardBody className="p-4 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  শিক্ষকমণ্ডলী
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FiUserCheck className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {toBengaliNumber(quickStats?.totalTeachers || 0)} জন
                </p>
                <p className="text-[11px] font-medium text-purple-600 mt-0.5 font-semibold">
                  অ্যাকাডেমিক প্যানেল
                </p>
              </div>
            </CardBody>
          </Card>
        </Link>

        {/* Card 3: Today's Income */}
        <Link href="/accounts" className="group">
          <Card hoverEffect className="h-full border-slate-200/80 hover:border-emerald-400 transition-all">
            <CardBody className="p-4 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  আজকের আদায়
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FiDollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-600 tracking-tight">
                  {formatCurrency(quickStats?.todayIncome || 0)}
                </p>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  মাসের মোট: {formatCurrency(quickStats?.thisMonthIncome || 0)}
                </p>
              </div>
            </CardBody>
          </Card>
        </Link>

        {/* Card 4: Total Dues */}
        <Link href="/accounts/dues" className="group">
          <Card hoverEffect className="h-full border-slate-200/80 hover:border-red-400 transition-all">
            <CardBody className="p-4 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  মোট বকেয়া
                </span>
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FiAlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-red-600 tracking-tight">
                  {formatCurrency(quickStats?.totalDues || 0)}
                </p>
                <p className="text-[11px] font-medium text-red-500 mt-0.5">
                  জরুরি তাগাদা প্রয়োজন
                </p>
              </div>
            </CardBody>
          </Card>
        </Link>

        {/* Card 5: Attendance Rate */}
        <Link href="/attendance" className="group">
          <Card hoverEffect className="h-full border-slate-200/80 hover:border-teal-400 transition-all">
            <CardBody className="p-4 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  আজকের উপস্থিতি
                </span>
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FiCheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {toBengaliNumber(quickStats?.todayAttendance.rate || 0)}%
                </p>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  উপস্থিত: {toBengaliNumber(quickStats?.todayAttendance.present || 0)} / {toBengaliNumber(quickStats?.todayAttendance.total || 0)}
                </p>
              </div>
            </CardBody>
          </Card>
        </Link>

        {/* Card 6: SMS Sent Today */}
        <Link href="/sms" className="group">
          <Card hoverEffect className="h-full border-slate-200/80 hover:border-amber-400 transition-all">
            <CardBody className="p-4 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  আজকের এসএমএস
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FiMessageSquare className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {toBengaliNumber(quickStats?.todaySmsCount || 0)} টি
                </p>
                <p className="text-[11px] font-medium text-amber-600 mt-0.5 font-semibold">
                  স্মার্ট ইঞ্জিন সচল
                </p>
              </div>
            </CardBody>
          </Card>
        </Link>
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Income vs Expense Chart (2 cols) */}
        <Card className="lg:col-span-2 border-slate-200/80">
          <CardHeader
            title={`মাসিক আয় ও ব্যয়ের হিসাব (${toBengaliNumber(monthlyChart?.year || new Date().getFullYear())})`}
            subtitle="চলতি বছরের জানুয়ারি থেকে ডিসেম্বর পর্যন্ত আর্থিক তুলনামূলক চিত্র"
            action={
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setChartViewType('bar')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    chartViewType === 'bar'
                      ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  বার চার্ট
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewType('line')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    chartViewType === 'line'
                      ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  লাইন ট্রেন্ড
                </button>
              </div>
            }
          />
          <CardBody>
            <div className="h-72">
              <AppChart
                type={chartViewType}
                data={monthlyChartData}
                height={280}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">চলতি মাসের আয়</span>
                <span className="text-sm font-bold text-emerald-600">
                  {formatCurrency(quickStats?.thisMonthIncome || 0)}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">চলতি মাসের খরচ</span>
                <span className="text-sm font-bold text-red-500">
                  {formatCurrency(quickStats?.thisMonthExpense || 0)}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">নেট উদ্বৃত্ত / লাভ</span>
                <span className="text-sm font-bold text-indigo-600">
                  {formatCurrency((quickStats?.thisMonthIncome || 0) - (quickStats?.thisMonthExpense || 0))}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Attendance Distribution Doughnut (1 col) */}
        <Card className="border-slate-200/80">
          <CardHeader
            title="হাজিরা বিশ্লেষণ (৩০ দিন)"
            subtitle={`গড় উপস্থিতি হার: ${toBengaliNumber(attendanceChart?.presentRate || 0)}%`}
            action={
              <Link href="/attendance/report" className="text-xs font-semibold text-indigo-600 hover:underline">
                রিপোর্ট →
              </Link>
            }
          />
          <CardBody className="flex flex-col items-center justify-between">
            <div className="h-56 w-full flex items-center justify-center relative">
              <AppChart
                type="doughnut"
                data={attendanceChartData}
                height={220}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-800">
                  {toBengaliNumber(attendanceChart?.presentRate || 0)}%
                </span>
                <span className="text-[10px] font-medium text-slate-400">উপস্থিতি</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full mt-4 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-600">উপস্থিত: {toBengaliNumber(attendanceChart?.distribution.PRESENT || 0)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-slate-600">দেরি: {toBengaliNumber(attendanceChart?.distribution.LATE || 0)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <span className="text-slate-600">অনুপস্থিত: {toBengaliNumber(attendanceChart?.distribution.ABSENT || 0)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
                <span className="text-slate-600">ছুটি: {toBengaliNumber(attendanceChart?.distribution.EXCUSED || 0)}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 4. Lower Widgets: Upcoming Exams, Activity Feed & Due Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Widget 1: Upcoming Exams Schedule */}
        <Card className="border-slate-200/80">
          <CardHeader
            title="আসন্ন পরীক্ষা সমসূচী"
            subtitle="পরবর্তী নির্ধারিত পরীক্ষাগুলোর তালিকা"
            action={
              <Link href="/exams" className="text-xs font-semibold text-indigo-600 hover:underline">
                সকল পরীক্ষা →
              </Link>
            }
          />
          <CardBody>
            {upcomingExams.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <FiCalendar className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">আপাতত কোনো আসন্ন পরীক্ষা নির্ধারিত নেই</p>
                <Link href="/exams/create">
                  <Button variant="ghost" size="sm" className="text-indigo-600 text-xs">
                    + নতুন পরীক্ষা শিডিউল করুন
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-3 bg-slate-50/70 hover:bg-slate-100/80 rounded-xl transition-colors border border-slate-100 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{exam.name}</span>
                        <Badge variant="primary" className="text-[10px] py-0 px-1.5">
                          {exam.subject.name}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {exam.batch.name} • পূর্ণমান: {toBengaliNumber(exam.fullMarks)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-indigo-600 block">
                        {formatDate(exam.examDate, 'dd MMM')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {exam.duration ? `${toBengaliNumber(exam.duration)} মিনিট` : 'সময় নির্দিষ্ট নেই'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Widget 2: Recent Activity Timeline */}
        <Card className="border-slate-200/80">
          <CardHeader
            title="সাম্প্রতিক কার্যক্রম"
            subtitle="ভর্তি, ফি আদায় ও পরীক্ষার লাইভ ফিড"
          />
          <CardBody>
            {activities.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                কোনো সাম্প্রতিক কার্যক্রম পাওয়া যায়নি
              </div>
            ) : (
              <div className="space-y-3.5">
                {activities.map((act) => {
                  let icon = <FiActivity className="w-3.5 h-3.5 text-indigo-600" />;
                  let bg = 'bg-indigo-50';

                  if (act.type === 'ADMISSION') {
                    icon = <FiUsers className="w-3.5 h-3.5 text-emerald-600" />;
                    bg = 'bg-emerald-50';
                  } else if (act.type === 'FEE_COLLECTION') {
                    icon = <FiDollarSign className="w-3.5 h-3.5 text-amber-600" />;
                    bg = 'bg-amber-50';
                  } else if (act.type === 'EXAM') {
                    icon = <FiBookOpen className="w-3.5 h-3.5 text-purple-600" />;
                    bg = 'bg-purple-50';
                  }

                  return (
                    <div key={act.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {act.title}
                          </p>
                          {act.amount !== undefined && (
                            <span className="text-xs font-bold text-emerald-600 shrink-0">
                              {formatCurrency(act.amount)}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {act.description}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatDate(act.timestamp, 'dd MMM, hh:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Widget 3: Top Due Alerts & Quick Action */}
        <Card className="border-slate-200/80">
          <CardHeader
            title="শীর্ষ বকেয়া সতর্কতা"
            subtitle="সর্বাধিক বকেয়া থাকা শিক্ষার্থীদের তালিকা"
            action={
              <Link href="/accounts/dues" className="text-xs font-semibold text-red-600 hover:underline">
                সকল বকেয়া →
              </Link>
            }
          />
          <CardBody>
            {dueAlerts.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <FiCheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs text-slate-500">কোনো বকেয়া ফি নেই! সবাই পরিশোধ করেছেন।</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dueAlerts.map((due) => (
                  <div
                    key={due.systemId}
                    className="p-3 bg-red-50/50 hover:bg-red-50 rounded-xl transition-colors border border-red-100 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {due.nameBn || due.nameEn}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {due.classLevel} • {due.studentId}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        অভিভাবক: {due.phone || 'নম্বর নেই'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-red-600 block">
                        {formatCurrency(due.totalDue)}
                      </span>
                      <Link
                        href={`/accounts/collect?studentId=${due.systemId}`}
                        className="inline-block mt-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs"
                      >
                        ফি গ্রহণ →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* 5. Expense Category Distribution (if expenses exist) */}
      {expenseChart && expenseChart.breakdown.length > 0 && (
        <Card className="border-slate-200/80">
          <CardHeader
            title={`ক্যাটাগরি অনুযায়ী কোচিংয়ের ব্যয় বিশ্লেষণ (${toBengaliNumber(expenseChart.year)})`}
            subtitle={`সর্বমোট ব্যয়: ${formatCurrency(expenseChart.totalExpense)}`}
            action={
              <Link href="/accounts/expenses" className="text-xs font-semibold text-indigo-600 hover:underline">
                ব্যয় খতিয়ান →
              </Link>
            }
          />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="h-56 flex items-center justify-center">
                <AppChart
                  type="pie"
                  data={expenseChartData}
                  height={220}
                />
              </div>
              <div className="md:col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 self-center">
                {expenseChart.breakdown.slice(0, 6).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{item.categoryBn}</p>
                      <p className="text-[11px] text-slate-500">{toBengaliNumber(item.percentage)}% ব্যয়ের অংশ</p>
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
