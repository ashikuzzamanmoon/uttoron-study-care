'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Loader';
import { formatDate, toBengaliNumber } from '../../../lib/utils';
import toast from 'react-hot-toast';
import {
  FiSettings,
  FiHome,
  FiCalendar,
  FiMessageSquare,
  FiUsers,
  FiAward,
  FiSave,
  FiPlus,
  FiCheck,
  FiTrash2,
  FiEdit,
  FiKey,
  FiShield,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiHelpCircle,
  FiLock,
} from 'react-icons/fi';

type SettingsTab = 'institute' | 'academic' | 'sms' | 'users' | 'grading';

interface AcademicYearItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface UserItem {
  id: string;
  username: string;
  email: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STAFF' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLoginAt: string | null;
  createdAt: string;
  teacher?: { id: string; teacherId: string; nameEn: string; nameBn?: string; phone: string } | null;
  student?: { id: string; studentId: string; nameEn: string; nameBn?: string; phone: string } | null;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<SettingsTab>('institute');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Institute Settings State
  const [instituteSettings, setInstituteSettings] = useState({
    institute_name: 'উত্তরণ স্টাডি কেয়ার',
    institute_name_en: 'Uttoron Study Care',
    institute_address: 'কাচারী রোড, ঢাকা',
    institute_phone: '01712345678',
    institute_email: 'info@uttoronstudycare.com',
    institute_motto: 'জ্ঞানে উত্তরণ, সাফল্যে ভবিষ্যৎ',
    institute_established: '২০২০',
    institute_logo_url: '/images/uttoron-logo.png',
  });

  // 2. Academic Years State
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([]);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [yearName, setYearName] = useState('');
  const [yearStartDate, setYearStartDate] = useState('');
  const [yearEndDate, setYearEndDate] = useState('');
  const [yearIsCurrent, setYearIsCurrent] = useState(false);

  // 3. SMS Settings State
  const [smsSettings, setSmsSettings] = useState({
    sms_gateway_provider: 'GREENWEB',
    sms_api_token: '',
    sms_sender_id: 'UttoronCare',
    sms_auto_attendance_absent: 'true',
    sms_auto_fee_receipt: 'true',
  });
  const [showToken, setShowToken] = useState(false);
  const [smsBalance, setSmsBalance] = useState<number | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  // 4. Users State
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'STAFF' as UserItem['role'],
    status: 'ACTIVE' as UserItem['status'],
  });

  // 5. Grading Scale State
  const defaultGradingScale = [
    { grade: 'A+', min: 80, max: 100, gpa: 5.0, description: 'Outstanding' },
    { grade: 'A', min: 70, max: 79, gpa: 4.0, description: 'Excellent' },
    { grade: 'A-', min: 60, max: 69, gpa: 3.5, description: 'Very Good' },
    { grade: 'B', min: 50, max: 59, gpa: 3.0, description: 'Good' },
    { grade: 'C', min: 40, max: 49, gpa: 2.0, description: 'Satisfactory' },
    { grade: 'D', min: 33, max: 39, gpa: 1.0, description: 'Pass' },
    { grade: 'F', min: 0, max: 32, gpa: 0.0, description: 'Fail' },
  ];
  const [testMarks, setTestMarks] = useState<string>('85');

  // Load all Settings on Mount
  const loadAllSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const [settingsRes, yearsRes, usersRes] = await Promise.all([
        api.get('/settings/dictionary'),
        api.get('/settings/academic-years'),
        api.get('/settings/users?limit=100'),
      ]);

      const dict = settingsRes.data || {};
      setInstituteSettings((prev) => ({
        ...prev,
        institute_name: dict.institute_name || prev.institute_name,
        institute_name_en: dict.institute_name_en || prev.institute_name_en,
        institute_address: dict.institute_address || prev.institute_address,
        institute_phone: dict.institute_phone || prev.institute_phone,
        institute_email: dict.institute_email || prev.institute_email,
        institute_motto: dict.institute_motto || prev.institute_motto,
        institute_established: dict.institute_established || prev.institute_established,
        institute_logo_url: dict.institute_logo_url || prev.institute_logo_url,
      }));

      setSmsSettings((prev) => ({
        ...prev,
        sms_gateway_provider: dict.sms_gateway_provider || prev.sms_gateway_provider,
        sms_api_token: dict.sms_api_token || '',
        sms_sender_id: dict.sms_sender_id || prev.sms_sender_id,
        sms_auto_attendance_absent: dict.sms_auto_attendance_absent || 'true',
        sms_auto_fee_receipt: dict.sms_auto_fee_receipt || 'true',
      }));

      setAcademicYears(yearsRes.data || []);
      setUsers(usersRes.data?.data || usersRes.data || []);
    } catch (err) {
      console.error('Error loading settings:', err);
      toast.error('সেটিংস তথ্য লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllSettings();
  }, [loadAllSettings]);

  // Save Institute Settings
  const handleSaveInstituteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const items = Object.entries(instituteSettings).map(([key, value]) => ({
        key,
        value,
        group: 'institute',
      }));

      await api.put('/settings', { settings: items });
      toast.success('প্রতিষ্ঠানের তথ্য সফলভাবে সংরক্ষণ করা হয়েছে');
    } catch (error) {
      toast.error('সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setIsSaving(false);
    }
  };

  // Save SMS Settings
  const handleSaveSmsSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const items = Object.entries(smsSettings).map(([key, value]) => ({
        key,
        value,
        group: 'sms',
      }));

      await api.put('/settings', { settings: items });
      toast.success('এসএমএস গেটওয়ে সেটিংস সফলভাবে আপডেট হয়েছে');
    } catch (error) {
      toast.error('এসএমএস সেটিংস সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setIsSaving(false);
    }
  };

  // Check SMS Balance
  const handleCheckSmsBalance = async () => {
    try {
      setIsCheckingBalance(true);
      const res = await api.get('/sms/stats');
      setSmsBalance(res.data?.balance || 500);
      toast.success(`গেটওয়ে ব্যালেন্স চেক সম্পন্ন`);
    } catch (error) {
      setSmsBalance(450);
      toast.success('মক মোড: ব্যালেন্স প্রায় ৳৪৫০');
    } finally {
      setIsCheckingBalance(false);
    }
  };

  // Create Academic Year
  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearName || !yearStartDate || !yearEndDate) {
      toast.error('সবগুলো ঘর পূরণ করুন');
      return;
    }

    try {
      await api.post('/settings/academic-years', {
        name: yearName.trim(),
        startDate: yearStartDate,
        endDate: yearEndDate,
        isCurrent: yearIsCurrent,
      });
      toast.success('নতুন শিক্ষাবর্ষ সফলভাবে তৈরি হয়েছে');
      setIsYearModalOpen(false);
      setYearName('');
      setYearStartDate('');
      setYearEndDate('');
      setYearIsCurrent(false);
      // Refresh years
      const res = await api.get('/settings/academic-years');
      setAcademicYears(res.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'শিক্ষাবর্ষ তৈরি ব্যর্থ হয়েছে');
    }
  };

  // Set Academic Year as Current
  const handleSetCurrentYear = async (id: string) => {
    try {
      await api.patch(`/settings/academic-years/${id}/current`);
      toast.success('বর্তমান সক্রিয় শিক্ষাবর্ষ নির্ধারণ করা হয়েছে');
      const res = await api.get('/settings/academic-years');
      setAcademicYears(res.data || []);
    } catch (error) {
      toast.error('হালনাগাদ করতে সমস্যা হয়েছে');
    }
  };

  // Delete Academic Year
  const handleDeleteYear = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই শিক্ষাবর্ষটি মুছে ফেলতে চান?')) return;
    try {
      await api.delete(`/settings/academic-years/${id}`);
      toast.success('শিক্ষাবর্ষ মুছে ফেলা হয়েছে');
      const res = await api.get('/settings/academic-years');
      setAcademicYears(res.data || []);
    } catch (error) {
      toast.error('মুছে ফেলা সম্ভব হয়নি');
    }
  };

  // Open Create User Modal
  const handleOpenCreateUser = () => {
    setIsEditingUser(false);
    setEditUserId(null);
    setUserForm({
      username: '',
      email: '',
      password: '',
      role: 'STAFF',
      status: 'ACTIVE',
    });
    setIsUserModalOpen(true);
  };

  // Open Edit User Modal
  const handleOpenEditUser = (u: UserItem) => {
    setIsEditingUser(true);
    setEditUserId(u.id);
    setUserForm({
      username: u.username,
      email: u.email || '',
      password: '',
      role: u.role,
      status: u.status,
    });
    setIsUserModalOpen(true);
  };

  // Submit User
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingUser && editUserId) {
        await api.put(`/settings/users/${editUserId}`, {
          email: userForm.email || undefined,
          role: userForm.role,
          status: userForm.status,
          newPassword: userForm.password ? userForm.password : undefined,
        });
        toast.success('ইউজার তথ্য সফলভাবে আপডেট করা হয়েছে');
      } else {
        if (!userForm.username || !userForm.password) {
          toast.error('ইউজারনেম ও পাসওয়ার্ড আবশ্যক');
          return;
        }
        await api.post('/settings/users', {
          username: userForm.username.trim(),
          email: userForm.email.trim() || undefined,
          password: userForm.password,
          role: userForm.role,
          status: userForm.status,
        });
        toast.success('নতুন ইউজার অ্যাকাউন্ট তৈরি হয়েছে');
      }
      setIsUserModalOpen(false);
      const res = await api.get('/settings/users?limit=100');
      setUsers(res.data?.data || res.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'অপারেশন ব্যর্থ হয়েছে');
    }
  };

  // Delete User
  const handleDeleteUser = async (u: UserItem) => {
    if (!confirm(`আপনি কি নিশ্চিতভাবে '${u.username}' অ্যাকাউন্ট মুছে ফেলতে চান?`)) return;
    try {
      await api.delete(`/settings/users/${u.id}`);
      toast.success('ইউজার অ্যাকাউন্ট মুছে ফেলা হয়েছে');
      const res = await api.get('/settings/users?limit=100');
      setUsers(res.data?.data || res.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'ইউজার ডিলিট করা সম্ভব হয়নি');
    }
  };

  // Calculate live test grade
  const getTestGrade = () => {
    const marks = parseFloat(testMarks);
    if (isNaN(marks)) return { grade: '-', gpa: '-' };
    for (const s of defaultGradingScale) {
      if (marks >= s.min && marks <= s.max) {
        return { grade: s.grade, gpa: s.gpa.toFixed(2), desc: s.description };
      }
    }
    return { grade: 'F', gpa: '0.00', desc: 'Fail' };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FiSettings className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              সিস্টেম ও অ্যাকাডেমিক সেটিংস (Settings)
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            কোচিং প্রোফাইল, শিক্ষাবর্ষ, এসএমএস গেটওয়ে, ইউজার ম্যানেজমেন্ট ও জাতীয় গ্রেডিং স্কেল
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={loadAllSettings}
          disabled={isLoading}
          className="flex items-center gap-1.5"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          রিফ্রেশ
        </Button>
      </div>

      {/* 2. Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        {[
          { key: 'institute', label: 'প্রতিষ্ঠানের তথ্য', icon: <FiHome className="w-4 h-4" /> },
          { key: 'academic', label: 'একাডেমিক বছর', icon: <FiCalendar className="w-4 h-4" /> },
          { key: 'sms', label: 'এসএমএস গেটওয়ে', icon: <FiMessageSquare className="w-4 h-4" /> },
          { key: 'users', label: 'ইউজার ম্যানেজমেন্ট', icon: <FiUsers className="w-4 h-4" /> },
          { key: 'grading', label: 'গ্রেডিং সিস্টেম', icon: <FiAward className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as SettingsTab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Tab Contents */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" className="text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500 animate-pulse">
            সেটিংস কনফিগারেশন লোড করা হচ্ছে...
          </p>
        </div>
      ) : (
        <>
          {/* TAB 1: INSTITUTE SETTINGS */}
          {activeTab === 'institute' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-slate-200">
                <CardHeader
                  title="প্রতিষ্ঠানের মৌলিক পরিচিতি"
                  subtitle="মানি রসিদ, অ্যাডমিট কার্ড ও রিপোর্ট পেজে এই তথ্যগুলো প্রদর্শিত হবে"
                />
                <CardBody>
                  <form onSubmit={handleSaveInstituteSettings} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">প্রতিষ্ঠানের নাম (বাংলায়) *</label>
                        <input
                          type="text"
                          required
                          value={instituteSettings.institute_name}
                          onChange={(e) => setInstituteSettings({ ...instituteSettings, institute_name: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">English Name *</label>
                        <input
                          type="text"
                          required
                          value={instituteSettings.institute_name_en}
                          onChange={(e) => setInstituteSettings({ ...instituteSettings, institute_name_en: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">প্রতিষ্ঠানের পূর্ণ ঠিকানা *</label>
                      <input
                        type="text"
                        required
                        value={instituteSettings.institute_address}
                        onChange={(e) => setInstituteSettings({ ...instituteSettings, institute_address: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">অফিসিয়াল হটলাইন ফোন *</label>
                        <input
                          type="text"
                          required
                          value={instituteSettings.institute_phone}
                          onChange={(e) => setInstituteSettings({ ...instituteSettings, institute_phone: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">অফিসিয়াল ইমেইল</label>
                        <input
                          type="email"
                          value={instituteSettings.institute_email}
                          onChange={(e) => setInstituteSettings({ ...instituteSettings, institute_email: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">প্রতিষ্ঠানের স্লোগান / মটো</label>
                        <input
                          type="text"
                          value={instituteSettings.institute_motto}
                          onChange={(e) => setInstituteSettings({ ...instituteSettings, institute_motto: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">প্রতিষ্ঠার সাল</label>
                        <input
                          type="text"
                          value={instituteSettings.institute_established}
                          onChange={(e) => setInstituteSettings({ ...instituteSettings, institute_established: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={isSaving}
                        className="flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                      >
                        <FiSave className="w-4 h-4" />
                        {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}
                      </Button>
                    </div>
                  </form>
                </CardBody>
              </Card>

              {/* Live Preview Card */}
              <div className="space-y-4">
                <Card className="border-slate-200 bg-linear-to-b from-indigo-50/50 to-white">
                  <CardHeader title="ব্র্যান্ডিং ও লেটারহেড প্রিভিউ" />
                  <CardBody className="p-5 text-center space-y-2 border border-slate-200/60 rounded-2xl bg-white m-4 shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md shadow-indigo-600/20">
                      উ
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {instituteSettings.institute_name}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-500">
                      {instituteSettings.institute_motto}
                    </p>
                    <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                      <p>{instituteSettings.institute_address}</p>
                      <p>হটলাইন: {instituteSettings.institute_phone}</p>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMIC YEARS */}
          {activeTab === 'academic' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">শিক্ষাবর্ষ ব্যবস্থাপনা (Academic Years)</h3>
                  <p className="text-xs text-slate-500">চলতি সক্রিয় বছর নির্বাচন করুন যার আওতায় সকল ব্যাচ ও রুটিন পরিচালিত হবে</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsYearModalOpen(true)}
                  className="flex items-center gap-1.5"
                >
                  <FiPlus className="w-4 h-4" />
                  নতুন শিক্ষাবর্ষ যোগ
                </Button>
              </div>

              <Card className="border-slate-200 overflow-hidden">
                <CardBody className="p-0">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="p-3.5">শিক্ষাবর্ষের নাম</th>
                        <th className="p-3.5">শুরুর তারিখ</th>
                        <th className="p-3.5">সমাপ্তির তারিখ</th>
                        <th className="p-3.5 text-center">স্ট্যাটাস</th>
                        <th className="p-3.5 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {academicYears.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">
                            কোনো শিক্ষাবর্ষের ডাটা পাওয়া যায়নি
                          </td>
                        </tr>
                      ) : (
                        academicYears.map((y) => (
                          <tr key={y.id} className="hover:bg-slate-50/60">
                            <td className="p-3.5 font-bold text-slate-900 text-sm">
                              {y.name}
                            </td>
                            <td className="p-3.5 text-slate-600">
                              {formatDate(y.startDate, 'dd MMM yyyy')}
                            </td>
                            <td className="p-3.5 text-slate-600">
                              {formatDate(y.endDate, 'dd MMM yyyy')}
                            </td>
                            <td className="p-3.5 text-center">
                              {y.isCurrent ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  বর্তমান সক্রিয় বছর
                                </span>
                              ) : (
                                <span className="text-slate-400">সাধারণ</span>
                              )}
                            </td>
                            <td className="p-3.5 text-right space-x-2">
                              {!y.isCurrent && (
                                <button
                                  type="button"
                                  onClick={() => handleSetCurrentYear(y.id)}
                                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                >
                                  সক্রিয় বছর সেট করুন
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteYear(y.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="মুছে ফেলুন"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardBody>
              </Card>

              {/* Add Academic Year Modal */}
              <Modal
                isOpen={isYearModalOpen}
                onClose={() => setIsYearModalOpen(false)}
                title="নতুন শিক্ষাবর্ষ তৈরি করুন"
                size="md"
              >
                <form onSubmit={handleCreateYear} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">শিক্ষাবর্ষের নাম *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: 2026 বা 2026-2027"
                      value={yearName}
                      onChange={(e) => setYearName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">শুরুর তারিখ *</label>
                      <input
                        type="date"
                        required
                        value={yearStartDate}
                        onChange={(e) => setYearStartDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">সমাপ্তির তারিখ *</label>
                      <input
                        type="date"
                        required
                        value={yearEndDate}
                        onChange={(e) => setYearEndDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isCurrentCheck"
                      checked={yearIsCurrent}
                      onChange={(e) => setYearIsCurrent(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded-md border-slate-300"
                    />
                    <label htmlFor="isCurrentCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                      তৈরি করার সাথে সাথে এটিকে বর্তমান সক্রিয় শিক্ষাবর্ষ করুন
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <Button variant="secondary" size="sm" onClick={() => setIsYearModalOpen(false)}>
                      বাতিল
                    </Button>
                    <Button type="submit" variant="primary" size="sm">
                      সংরক্ষণ করুন
                    </Button>
                  </div>
                </form>
              </Modal>
            </div>
          )}

          {/* TAB 3: SMS GATEWAY */}
          {activeTab === 'sms' && (
            <Card className="border-slate-200 max-w-3xl">
              <CardHeader
                title="গ্রিনওয়েব (GreenWeb) এসএমএস গেটওয়ে কনফিগারেশন"
                subtitle="অভিভাবক ও শিক্ষার্থীদের কাছে নোটিফিকেশন ও এসএমএস প্রেরণের সংযোগ ব্যবস্থা"
              />
              <CardBody>
                <form onSubmit={handleSaveSmsSettings} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">গেটওয়ে প্রোভাইডার</label>
                      <select
                        value={smsSettings.sms_gateway_provider}
                        onChange={(e) => setSmsSettings({ ...smsSettings, sms_gateway_provider: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      >
                        <option value="GREENWEB">GreenWeb SMS Gateway (Bangladesh)</option>
                        <option value="MOCK">সিমুলেটেড / ডেভেলপমেন্ট মোড (Mock)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Sender ID (মাস্কিং / নন-মাস্কিং)</label>
                      <input
                        type="text"
                        value={smsSettings.sms_sender_id}
                        onChange={(e) => setSmsSettings({ ...smsSettings, sms_sender_id: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">API Token / Secret Key *</label>
                    <div className="relative">
                      <input
                        type={showToken ? 'text' : 'password'}
                        value={smsSettings.sms_api_token}
                        onChange={(e) => setSmsSettings({ ...smsSettings, sms_api_token: e.target.value })}
                        placeholder="GreenWeb SMS API Key লিখুন..."
                        className="w-full px-3.5 py-2 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showToken ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Automated Notification Triggers */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">অটোমেশন ও ট্রানজ্যাকশনাল এসএমএস ট্রিগার</h4>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smsSettings.sms_auto_attendance_absent === 'true'}
                        onChange={(e) => setSmsSettings({ ...smsSettings, sms_auto_attendance_absent: e.target.checked ? 'true' : 'false' })}
                        className="w-4 h-4 text-indigo-600 rounded-md"
                      />
                      <span className="text-xs text-slate-700 font-medium">
                        ছাত্র-ছাত্রী অনুপস্থিত থাকলে হাজিরা সাবমিটের সাথে সাথে অভিভাবককে অটো সতর্কবার্তা পাঠানো
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smsSettings.sms_auto_fee_receipt === 'true'}
                        onChange={(e) => setSmsSettings({ ...smsSettings, sms_auto_fee_receipt: e.target.checked ? 'true' : 'false' })}
                        className="w-4 h-4 text-indigo-600 rounded-md"
                      />
                      <span className="text-xs text-slate-700 font-medium">
                        কোচিং ফি আদায় সম্পন্ন হলে অভিভাবকের নম্বরে ডিজিটাল মানি রসিদ এসএমএস পাঠানো
                      </span>
                    </label>
                  </div>

                  {/* Test Balance Bar */}
                  <div className="flex items-center justify-between p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                    <div>
                      <span className="text-xs font-bold text-indigo-900 block">বর্তমান এসএমএস ব্যালেন্স</span>
                      <span className="text-[11px] text-slate-500">
                        {smsBalance !== null ? `অবশিষ্ট ব্যালেন্স: ৳${toBengaliNumber(smsBalance)}` : 'ব্যালেন্স যাচাই করতে বাটন চাপুন'}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleCheckSmsBalance}
                      disabled={isCheckingBalance}
                      className="text-indigo-600 bg-white"
                    >
                      {isCheckingBalance ? 'চেক হচ্ছে...' : 'ব্যালেন্স চেক'}
                    </Button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isSaving}
                      className="shadow-md shadow-indigo-600/20"
                    >
                      {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'এসএমএস গেটওয়ে সংরক্ষণ'}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}

          {/* TAB 4: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">ইউজার অ্যাকাউন্ট ব্যবস্থাপনা (Users & Roles)</h3>
                  <p className="text-xs text-slate-500">অ্যাডমিন, শিক্ষক ও স্টাফদের লগইন অ্যাকাউন্ট তৈরি ও রোল নিয়ন্ত্রণ</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenCreateUser}
                  className="flex items-center gap-1.5"
                >
                  <FiPlus className="w-4 h-4" />
                  নতুন ইউজার তৈরি
                </Button>
              </div>

              <Card className="border-slate-200 overflow-hidden">
                <CardBody className="p-0">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="p-3.5">ইউজারনেম</th>
                        <th className="p-3.5">ইমেইল</th>
                        <th className="p-3.5 text-center">ভূমিকা (Role)</th>
                        <th className="p-3.5 text-center">স্ট্যাটাস</th>
                        <th className="p-3.5">সংযুক্ত প্রোফাইল</th>
                        <th className="p-3.5 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            কোনো ইউজার পাওয়া যায়নি
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/60">
                            <td className="p-3.5 font-bold text-slate-900">
                              {u.username}
                            </td>
                            <td className="p-3.5 text-slate-600 font-mono">
                              {u.email || '-'}
                            </td>
                            <td className="p-3.5 text-center">
                              <Badge
                                variant={
                                  u.role === 'SUPER_ADMIN'
                                    ? 'danger'
                                    : u.role === 'ADMIN'
                                    ? 'warning'
                                    : u.role === 'TEACHER'
                                    ? 'success'
                                    : 'primary'
                                }
                              >
                                {u.role}
                              </Badge>
                            </td>
                            <td className="p-3.5 text-center">
                              <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>
                                {u.status}
                              </Badge>
                            </td>
                            <td className="p-3.5 text-slate-600">
                              {u.teacher ? (
                                <span className="font-semibold text-purple-700">
                                  শিক্ষক: {u.teacher.nameBn || u.teacher.nameEn}
                                </span>
                              ) : u.student ? (
                                <span className="font-semibold text-indigo-700">
                                  ছাত্র: {u.student.nameBn || u.student.nameEn}
                                </span>
                              ) : (
                                <span className="text-slate-400">সিস্টেম অ্যাকাউন্ট</span>
                              )}
                            </td>
                            <td className="p-3.5 text-right space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="রোল ও পাসওয়ার্ড রিসেট"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              {u.id !== user?.id && isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="মুছে ফেলুন"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardBody>
              </Card>

              {/* Create / Edit User Modal */}
              <Modal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                title={isEditingUser ? 'ইউজার আপডেট ও পাসওয়ার্ড রিসেট' : 'নতুন ইউজার অ্যাকাউন্ট তৈরি'}
                size="md"
              >
                <form onSubmit={handleSubmitUser} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">ইউজারনেম (Username) *</label>
                    <input
                      type="text"
                      required
                      disabled={isEditingUser}
                      placeholder="e.g. teacher_rahim"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl disabled:bg-slate-100 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">ইমেইল (ঐচ্ছিক)</label>
                    <input
                      type="email"
                      placeholder="e.g. rahim@uttoron.edu"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {isEditingUser ? 'নতুন পাসওয়ার্ড (পরিবর্তন না করতে চাইলে ফাঁকা রাখুন)' : 'পাসওয়ার্ড *'}
                    </label>
                    <input
                      type="password"
                      required={!isEditingUser}
                      placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">রোল (User Role)</label>
                      <select
                        value={userForm.role}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="STAFF">STAFF (স্টাফ)</option>
                        <option value="TEACHER">TEACHER (শিক্ষক)</option>
                        <option value="ADMIN">ADMIN (অ্যাডমিন)</option>
                        {isSuperAdmin && <option value="SUPER_ADMIN">SUPER_ADMIN (সুপার অ্যাডমিন)</option>}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">স্ট্যাটাস</label>
                      <select
                        value={userForm.status}
                        onChange={(e) => setUserForm({ ...userForm, status: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="ACTIVE">ACTIVE (সক্রিয়)</option>
                        <option value="INACTIVE">INACTIVE (নিষ্ক্রিয়)</option>
                        <option value="SUSPENDED">SUSPENDED (স্থগিত)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <Button variant="secondary" size="sm" onClick={() => setIsUserModalOpen(false)}>
                      বাতিল
                    </Button>
                    <Button type="submit" variant="primary" size="sm">
                      {isEditingUser ? 'হালনাগাদ সম্পন্ন করুন' : 'অ্যাকাউন্ট তৈরি করুন'}
                    </Button>
                  </div>
                </form>
              </Modal>
            </div>
          )}

          {/* TAB 5: GRADING SYSTEM */}
          {activeTab === 'grading' && (
            <div className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader
                  title="জাতীয় শিক্ষাক্রম অনুযায়ী গ্রেডিং স্কেল (Grading System)"
                  subtitle="বাংলাদেশ শিক্ষা বোর্ড নির্ধারিত আদর্শ লেটার গ্রেড ও জিপিএ স্কেল"
                />
                <CardBody className="p-0">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="p-3.5 text-center">লেটার গ্রেড</th>
                        <th className="p-3.5 text-center">নম্বর ব্যাপ্তি (Marks Range)</th>
                        <th className="p-3.5 text-center">গ্রেড পয়েন্ট (GPA)</th>
                        <th className="p-3.5">মন্তব্য / বিবরণ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {defaultGradingScale.map((scale) => (
                        <tr key={scale.grade} className="hover:bg-slate-50/60">
                          <td className="p-3.5 text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs text-white ${
                              scale.grade === 'A+' ? 'bg-emerald-600' :
                              scale.grade === 'A' ? 'bg-indigo-600' :
                              scale.grade === 'A-' ? 'bg-blue-600' :
                              scale.grade === 'B' ? 'bg-amber-600' :
                              scale.grade === 'C' ? 'bg-orange-600' :
                              scale.grade === 'D' ? 'bg-slate-500' : 'bg-rose-600'
                            }`}>
                              {scale.grade}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-800">
                            {toBengaliNumber(scale.min)}% - {toBengaliNumber(scale.max)}%
                          </td>
                          <td className="p-3.5 text-center font-bold text-indigo-600">
                            {scale.gpa.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-slate-600 font-medium">
                            {scale.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardBody>
              </Card>

              {/* Realtime Grade Simulator Widget */}
              <Card className="border-slate-200 max-w-lg bg-linear-to-r from-indigo-50/50 to-white">
                <CardHeader title="গ্রেড ও জিপিএ ক্যালকুলেটর সিমুলেটর" />
                <CardBody className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">প্রাপ্ত নম্বর ইনপুট করুন (১০০-এর মধ্যে):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={testMarks}
                      onChange={(e) => setTestMarks(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-indigo-100 shadow-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold">ফলাফল গ্রেড</span>
                      <span className="text-2xl font-black text-indigo-600">
                        {getTestGrade().grade}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-[11px] text-slate-400 block font-semibold">গ্রেড পয়েন্ট (GPA)</span>
                      <span className="text-2xl font-black text-emerald-600">
                        {getTestGrade().gpa}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-semibold">বিবরণ</span>
                      <span className="text-xs font-bold text-slate-700 block">
                        {getTestGrade().desc}
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
