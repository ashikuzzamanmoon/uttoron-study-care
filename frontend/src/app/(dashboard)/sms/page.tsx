'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FiMessageSquare,
  FiSend,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiList,
  FiFileText,
  FiPlus,
  FiUsers,
  FiRefreshCw,
  FiPhone,
  FiArrowRight,
} from 'react-icons/fi';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';

interface SmsStats {
  todaySent: number;
  totalSent: number;
  totalFailed: number;
  gatewayBalance: number;
  approximateSmsLeft: number;
}

interface SmsLogItem {
  id: string;
  phone: string;
  message: string;
  type: string;
  status: string;
  cost: number | null;
  sentAt: string | null;
  createdAt: string;
}

export default function SmsDashboardPage() {
  const [stats, setStats] = useState<SmsStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<SmsLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Send State
  const [quickPhone, setQuickPhone] = useState('');
  const [quickMessage, setQuickMessage] = useState('');
  const [sendingQuick, setSendingQuick] = useState(false);

  // Character calculation
  const isBangla = /[\u0980-\u09FF]/.test(quickMessage);
  const charLimit = isBangla ? 70 : 160;
  const multiLimit = isBangla ? 67 : 153;
  const charCount = quickMessage.length;
  const smsParts =
    charCount === 0
      ? 1
      : charCount <= charLimit
      ? 1
      : Math.ceil(charCount / multiLimit);

  // Fetch Dashboard Stats & Logs
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes] = await Promise.all([
        api.get('/sms/stats').catch(() => ({ data: null })),
        api.get('/sms/logs?limit=8').catch(() => ({ data: { data: [] } })),
      ]);

      if (statsRes.data) {
        setStats(statsRes.data);
      }
      if (logsRes.data?.data) {
        setRecentLogs(logsRes.data.data);
      }
    } catch {
      toast.error('এসএমএস ড্যাশবোর্ড তথ্য লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle Quick Send
  const handleQuickSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPhone.trim()) {
      toast.error('মোবাইল নম্বর প্রদান করুন');
      return;
    }
    if (!quickMessage.trim()) {
      toast.error('বার্তা লিখুন');
      return;
    }

    try {
      setSendingQuick(true);
      const res = await api.post('/sms/send', {
        phone: quickPhone.trim(),
        message: quickMessage.trim(),
        type: 'INDIVIDUAL',
      });

      if (res.data?.success) {
        toast.success('এসএমএস সফলভাবে পাঠানো হয়েছে!');
        setQuickPhone('');
        setQuickMessage('');
        fetchDashboardData();
      } else {
        toast.error(res.data?.error || 'এসএমএস প্রেরণ ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'এসএমএস প্রেরণ ব্যর্থ হয়েছে');
    } finally {
      setSendingQuick(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'TRANSACTIONAL':
        return <Badge variant="primary">স্বয়ংক্রিয়</Badge>;
      case 'CAMPAIGN':
        return <Badge variant="warning">ক্যাম্পেইন</Badge>;
      default:
        return <Badge variant="neutral">একক বার্তা</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
            <FiMessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              এসএমএস ইঞ্জিন ও নোটিফিকেশন হাব
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              অভিভাবক নোটিফিকেশন, বাল্ক মার্কেটিং ক্যাম্পেইন ও এসএমএস হিস্ট্রি ট্র্যাকার
            </p>
          </div>
        </div>

        {/* Quick Nav Links */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/sms/send"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-xs transition-all"
          >
            <FiSend className="w-4 h-4" />
            এসএমএস পাঠান
          </Link>
          <Link
            href="/sms/campaign"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-semibold text-sm rounded-xl transition-all"
          >
            <FiUsers className="w-4 h-4" />
            ক্যাম্পেইন
          </Link>
          <Link
            href="/sms/templates"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-all"
          >
            <FiFileText className="w-4 h-4" />
            টেমপ্লেট
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gateway Balance */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-5 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider">
              গেটওয়ে ব্যালেন্স
            </span>
            <span className="p-2 bg-white/20 rounded-xl">
              <FiDollarSign className="w-5 h-5 text-white" />
            </span>
          </div>
          <div className="text-3xl font-black mt-2">
            ৳{(stats?.gatewayBalance || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-indigo-200 mt-1">
            অবশিষ্ট আনুমানিক: ~{stats?.approximateSmsLeft || 0} টি এসএমএস
          </div>
        </div>

        {/* Today Sent */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-emerald-100 text-xs font-bold uppercase tracking-wider">
              আজ প্রেরিত বার্তা
            </span>
            <span className="p-2 bg-white/20 rounded-xl">
              <FiCheckCircle className="w-5 h-5 text-white" />
            </span>
          </div>
          <div className="text-3xl font-black mt-2">
            {stats?.todaySent || 0} <span className="text-sm font-normal text-emerald-100">টি</span>
          </div>
          <div className="text-xs text-emerald-100 mt-1">আজকের মোট সফল ডেলিভারি</div>
        </div>

        {/* Total All-Time Sent */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              সর্বমোট প্রেরিত
            </span>
            <span className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <FiMessageSquare className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-800 mt-2">
            {(stats?.totalSent || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">কোচিং শুরুর পর থেকে মোট</div>
        </div>

        {/* Failed Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              ব্যর্থ বার্তা
            </span>
            <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <FiAlertCircle className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-rose-600 mt-2">
            {stats?.totalFailed || 0}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">ভুল নম্বর বা নেটওয়ার্ক ত্রুটি</div>
        </div>
      </div>

      {/* Main Grid: Quick Send on Left, Recent Logs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Send Form Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FiSend className="w-4 h-4 text-indigo-600" />
              কুইক এসএমএস সেন্ড
            </h2>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              তাৎক্ষণিক
            </span>
          </div>

          <form onSubmit={handleQuickSend} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                প্রাপকের মোবাইল নম্বর <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="017xxxxxxxx"
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
                <FiPhone className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  বার্তা লিখুন <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-400">
                  {isBangla ? 'বাংলা' : 'ইংরেজি'}
                </span>
              </div>
              <textarea
                rows={4}
                placeholder="এখানে আপনার বার্তা লিখুন..."
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                required
              />

              {/* Character & Part Counter */}
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                <span>
                  ক্যারেক্টার: <strong>{charCount}</strong>
                </span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  এসএমএস পার্ট: {smsParts} টি
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={sendingQuick || !quickPhone.trim() || !quickMessage.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              {sendingQuick ? (
                <>
                  <Loader size="sm" /> বার্তা পাঠানো হচ্ছে...
                </>
              ) : (
                <>
                  <FiSend className="w-4 h-4" /> বার্তা প্রেরণ করুন
                </>
              )}
            </button>
          </form>
        </div>

        {/* Recent SMS History Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiClock className="w-4 h-4 text-slate-400" />
                <h2 className="text-base font-bold text-slate-800">সাম্প্রতিক বার্তা লগ</h2>
              </div>
              <Link
                href="/sms/history"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                সকল হিস্ট্রি দেখুন <FiArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <Loader />
                <p className="text-sm text-slate-400 mt-2">লগ লোড হচ্ছে...</p>
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FiMessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">এখনো কোনো এসএমএস পাঠানো হয়নি</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                    <tr>
                      <th className="p-3 pl-4">মোবাইল নম্বর</th>
                      <th className="p-3">বার্তা বিবরণ</th>
                      <th className="p-3">টাইপ</th>
                      <th className="p-3 text-center">স্ট্যাটাস</th>
                      <th className="p-3 pr-4 text-right">সময়</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 pl-4 font-mono font-bold text-slate-800">
                          {log.phone}
                        </td>
                        <td className="p-3 max-w-xs truncate text-slate-700">
                          {log.message}
                        </td>
                        <td className="p-3 whitespace-nowrap">{getTypeBadge(log.type)}</td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {log.status === 'SENT' ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                              সফল
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700">
                              ব্যর্থ
                            </span>
                          )}
                        </td>
                        <td className="p-3 pr-4 text-right text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleTimeString('bn-BD', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
            পূর্ণাঙ্গ ফিল্টারিং ও ডেলিভারি হিস্ট্রির জন্য{' '}
            <Link href="/sms/history" className="text-indigo-600 font-bold hover:underline">
              এসএমএস হিস্ট্রি পেজ
            </Link>{' '}
            ভিজিট করুন।
          </div>
        </div>
      </div>
    </div>
  );
}
