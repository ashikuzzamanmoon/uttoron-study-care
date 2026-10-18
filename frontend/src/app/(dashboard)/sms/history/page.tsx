'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiClock,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiPhone,
  FiMessageSquare,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
} from 'react-icons/fi';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';

interface SmsLogItem {
  id: string;
  phone: string;
  message: string;
  type: string;
  status: string;
  gatewayResponse: string | null;
  cost: number | null;
  sentAt: string | null;
  createdAt: string;
}

export default function SmsHistoryPage() {
  const [logs, setLogs] = useState<SmsLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Summary counts
  const [stats, setStats] = useState<any | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (search.trim()) params.append('search', search.trim());
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (phoneFilter.trim()) params.append('phone', phoneFilter.trim());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const [logsRes, statsRes] = await Promise.all([
        api.get(`/sms/logs?${params.toString()}`),
        api.get('/sms/stats').catch(() => ({ data: null })),
      ]);

      if (logsRes.data) {
        setLogs(logsRes.data.data || []);
        if (logsRes.data.meta) {
          setTotalPages(logsRes.data.meta.totalPages || 1);
          setTotalCount(logsRes.data.meta.total || 0);
        }
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch {
      toast.error('এসএমএস হিস্ট্রি লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter, phoneFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setPhoneFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'TRANSACTIONAL':
        return <Badge variant="primary">স্বয়ংক্রিয়</Badge>;
      case 'CAMPAIGN':
        return <Badge variant="warning">ক্যাম্পেইন</Badge>;
      default:
        return <Badge variant="neutral">একক</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">সফল</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-700">ব্যর্থ</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700">পেন্ডিং</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/sms"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                <FiClock className="w-6 h-6" />
              </span>
              এসএমএস ডেলিভারি হিস্ট্রি ও লগ
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              প্রেরিত বার্তার বিস্তারিত বিবরণ, ডেলিভারি স্ট্যাটাস ও গেটওয়ে রেসপন্স ট্র্যাকার
            </p>
          </div>
        </div>

        <Link
          href="/sms/send"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all"
        >
          নতুন এসএমএস পাঠান
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            সর্বমোট প্রেরিত বার্তা
          </span>
          <div className="text-3xl font-black text-slate-800 mt-2">
            {(stats?.totalSent || 0).toLocaleString('en-IN')} <span className="text-sm font-normal text-slate-400">টি</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">কোচিং শুরুর পর থেকে মোট</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            আজকের সফল বার্তা
          </span>
          <div className="text-3xl font-black text-emerald-600 mt-2">
            {(stats?.todaySent || 0).toLocaleString('en-IN')} <span className="text-sm font-normal text-slate-400">টি</span>
          </div>
          <div className="text-xs text-emerald-600 mt-1">আজকের মোট ডেলিভারি</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            ব্যর্থ বার্তা
          </span>
          <div className="text-3xl font-black text-rose-600 mt-2">
            {(stats?.totalFailed || 0).toLocaleString('en-IN')} <span className="text-sm font-normal text-slate-400">টি</span>
          </div>
          <div className="text-xs text-rose-500 mt-1">ভুল নম্বর বা ব্যালেন্স ঘাটতি</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <input
              type="text"
              placeholder="মোবাইল নম্বর বা বার্তা লিখে খুঁজুন..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <FiSearch className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="">সকল ধরণ</option>
              <option value="TRANSACTIONAL">স্বয়ংক্রিয় (Transactional)</option>
              <option value="CAMPAIGN">মার্কেটিং ক্যাম্পেইন</option>
              <option value="INDIVIDUAL">একক বার্তা</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="">সকল স্ট্যাটাস</option>
              <option value="SENT">সফল (Sent)</option>
              <option value="FAILED">ব্যর্থ (Failed)</option>
              <option value="PENDING">পেন্ডিং (Pending)</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              title="শুরুর তারিখ"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              title="শেষ তারিখ"
            />
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              title="রিসেট"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-base">এসএমএস লগ টেবিল</h2>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
            {totalCount} টি লগ পাওয়া গেছে
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader />
            <p className="text-sm text-slate-400 mt-2">লগ লোড হচ্ছে...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiMessageSquare className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">কোনো এসএমএস লগ পাওয়া যায়নি</h3>
            <p className="text-sm text-slate-400 mt-1">নির্বাচিত ফিল্টারের ভিত্তিতে কোনো রেকর্ড নেই।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                  <th className="p-3.5 pl-4">মোবাইল নম্বর</th>
                  <th className="p-3.5">বার্তা বিবরণ</th>
                  <th className="p-3.5">ধরণ</th>
                  <th className="p-3.5 text-center">স্ট্যাটাস</th>
                  <th className="p-3.5">গেটওয়ে রেসপন্স</th>
                  <th className="p-3.5 text-right">খরচ</th>
                  <th className="p-3.5 text-right pr-4">সময় ও তারিখ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pl-4 font-mono font-bold text-slate-900 text-xs">
                      {row.phone}
                    </td>

                    <td className="p-3.5 max-w-sm text-xs text-slate-700 font-medium">
                      <div className="line-clamp-2">{row.message}</div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      {getTypeBadge(row.type)}
                    </td>

                    <td className="p-3.5 text-center whitespace-nowrap">
                      {getStatusBadge(row.status)}
                    </td>

                    <td className="p-3.5 text-xs text-slate-400 font-mono max-w-[140px] truncate">
                      {row.gatewayResponse || '-'}
                    </td>

                    <td className="p-3.5 text-right text-xs font-semibold text-slate-600">
                      {row.cost ? `৳${row.cost.toFixed(2)}` : '৳০.৪৫'}
                    </td>

                    <td className="p-3.5 text-right pr-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleDateString('bn-BD', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      <span className="text-slate-400">
                        {new Date(row.createdAt).toLocaleTimeString('bn-BD', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              পৃষ্ঠা {page} / {totalPages} (মোট {totalCount} টি রেকর্ড)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-slate-50 transition-all"
              >
                পূর্ববর্তী
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-slate-50 transition-all"
              >
                পরবর্তী
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
