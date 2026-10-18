'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertCircle,
  FiPlus,
  FiPrinter,
  FiSend,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiCreditCard,
  FiFileText,
  FiCalendar,
  FiUser,
  FiX,
  FiCheck,
} from 'react-icons/fi';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Loader } from '@/components/ui/Loader';

interface FeeRecord {
  id: string;
  receiptNo: string;
  feeType: string;
  feeMonth: string | null;
  amount: number;
  discount: number | null;
  fine: number | null;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  transactionId: string | null;
  paymentDate: string;
  receiptSmsSent: boolean;
  remarks: string | null;
  student: {
    id: string;
    studentId: string;
    nameEn: string;
    nameBn: string | null;
    guardianPhone: string | null;
    guardianName: string | null;
    batchStudents?: Array<{
      batch: {
        id: string;
        name: string;
        classLevel: string;
      };
    }>;
  };
}

interface SummaryKpis {
  totalAmount: number;
  totalDiscount: number;
  totalFine: number;
  totalPaid: number;
  totalDue: number;
}

interface DailyKpis {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalTransactions: number;
}

export default function AccountsOverviewPage() {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryKpis | null>(null);
  const [dailyKpi, setDailyKpi] = useState<DailyKpis | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [feeTypeFilter, setFeeTypeFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [sendingSmsId, setSendingSmsId] = useState<string | null>(null);

  // Fetch Daily KPI
  const fetchDailyKpi = async () => {
    try {
      const res = await api.get('/accounts/summary/daily');
      if (res.data?.kpis) {
        setDailyKpi(res.data.kpis);
      }
    } catch {
      // fallback silently
    }
  };

  // Fetch Fee collections list
  const fetchFees = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '15');
      if (search.trim()) params.append('search', search.trim());
      if (feeTypeFilter) params.append('feeType', feeTypeFilter);
      if (paymentMethodFilter) params.append('paymentMethod', paymentMethodFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/fees?${params.toString()}`);
      if (res.data) {
        setFees(res.data.data || []);
        setSummary(res.data.summary || null);
        if (res.data.meta) {
          setTotalPages(res.data.meta.totalPages || 1);
          setTotalCount(res.data.meta.total || 0);
        }
      }
    } catch {
      toast.error('ফি কালেকশন তালিকা লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  }, [page, search, feeTypeFilter, paymentMethodFilter, startDate, endDate]);

  useEffect(() => {
    fetchFees();
    fetchDailyKpi();
  }, [fetchFees]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFees();
  };

  const handleResetFilters = () => {
    setSearch('');
    setFeeTypeFilter('');
    setPaymentMethodFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Open Receipt Print View
  const handleOpenReceipt = async (id: string) => {
    try {
      setReceiptLoading(true);
      setShowReceiptModal(true);
      const res = await api.get(`/fees/receipt/${id}/print`);
      if (res.data) {
        setSelectedReceipt(res.data);
      }
    } catch {
      toast.error('রসিদের বিস্তারিত পাওয়া যায়নি');
      setShowReceiptModal(false);
    } finally {
      setReceiptLoading(false);
    }
  };

  // Send Receipt SMS
  const handleSendSms = async (id: string) => {
    try {
      setSendingSmsId(id);
      const res = await api.post(`/fees/receipt/${id}/sms`);
      toast.success(res.data?.message || 'রসিদ এসএমএস পাঠানো হয়েছে');
      // Update local state
      setFees((prev) =>
        prev.map((f) => (f.id === id ? { ...f, receiptSmsSent: true } : f))
      );
      if (selectedReceipt && selectedReceipt.receipt?.id === id) {
        setSelectedReceipt((prev: any) => ({
          ...prev,
          receipt: { ...prev.receipt, receiptSmsSent: true },
        }));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'এসএমএস পাঠানো ব্যর্থ হয়েছে');
    } finally {
      setSendingSmsId(null);
    }
  };

  const getFeeTypeBadge = (type: string) => {
    switch (type) {
      case 'MONTHLY_FEE':
        return <Badge variant="primary">মাসিক ফি</Badge>;
      case 'ADMISSION_FEE':
        return <Badge variant="success">ভর্তি ফি</Badge>;
      case 'EXAM_FEE':
        return <Badge variant="warning">পরীক্ষা ফি</Badge>;
      case 'BOOK_FEE':
        return <Badge variant="neutral">বই/নোট ফি</Badge>;
      case 'FINE':
        return <Badge variant="danger">জরিমানা</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'CASH':
        return <Badge variant="success">ক্যাশ</Badge>;
      case 'BKASH':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-pink-100 text-pink-700">বিকাশ</span>;
      case 'NAGAD':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">নগদ</span>;
      case 'ROCKET':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">রকেট</span>;
      case 'BANK_TRANSFER':
        return <Badge variant="primary">ব্যাংক</Badge>;
      default:
        return <Badge variant="neutral">{method}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <FiDollarSign className="w-6 h-6" />
            </span>
            হিসাব-নিকাশ ও ফি আদায়
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            দৈনিক ফি কালেকশন, বকেয়া পর্যবেক্ষণ, মানি রসিদ ও ব্যয়ের হিসাব
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/accounts/collect"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-xs transition-all"
          >
            <FiPlus className="w-4 h-4" />
            ফি আদায় করুন
          </Link>

          <Link
            href="/accounts/dues"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-sm rounded-xl transition-all"
          >
            <FiAlertCircle className="w-4 h-4" />
            বকেয়া তালিকা
          </Link>

          <Link
            href="/accounts/expenses"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-sm rounded-xl transition-all"
          >
            <FiTrendingDown className="w-4 h-4" />
            ব্যয় হিসাব
          </Link>

          <Link
            href="/accounts/reports"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-all"
          >
            <FiFileText className="w-4 h-4" />
            রিপোর্ট
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Income */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-emerald-100 text-xs font-bold uppercase tracking-wider">
              আজকের আদায়
            </span>
            <span className="p-2 bg-white/20 rounded-xl">
              <FiTrendingUp className="w-5 h-5 text-white" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black">
              ৳{(dailyKpi?.totalIncome || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-emerald-100 mt-1 font-medium">
              মোট কালেকশন ট্রানজ্যাকশন: {dailyKpi?.totalTransactions || 0} টি
            </div>
          </div>
        </div>

        {/* Today's Expense */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-5 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-rose-100 text-xs font-bold uppercase tracking-wider">
              আজকের ব্যয়
            </span>
            <span className="p-2 bg-white/20 rounded-xl">
              <FiTrendingDown className="w-5 h-5 text-white" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black">
              ৳{(dailyKpi?.totalExpense || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-rose-100 mt-1 font-medium">
              আজকের খরচ ভাউচার
            </div>
          </div>
        </div>

        {/* Today's Net Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              আজকের নিট ক্যাশ
            </span>
            <span className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <FiCreditCard className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div
              className={`text-3xl font-black ${
                (dailyKpi?.netBalance || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              ৳{(dailyKpi?.netBalance || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-medium">
              আদায় বিয়োগ ব্যয়
            </div>
          </div>
        </div>

        {/* Filtered Range Total Due */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              মোট বকেয়া (রেকর্ডকৃত)
            </span>
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <FiAlertCircle className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-amber-600">
              ৳{(summary?.totalDue || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-medium">
              মোট ছাড়: ৳{(summary?.totalDiscount || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search box */}
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              placeholder="রসিদ নং, ছাত্র আইডি বা নাম দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <FiSearch className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
          </div>

          {/* Fee Type Filter */}
          <div>
            <select
              value={feeTypeFilter}
              onChange={(e) => {
                setFeeTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="">সকল ফি টাইপ</option>
              <option value="MONTHLY_FEE">মাসিক ফি</option>
              <option value="ADMISSION_FEE">ভর্তি ফি</option>
              <option value="EXAM_FEE">পরীক্ষা ফি</option>
              <option value="BOOK_FEE">বই/নোট ফি</option>
              <option value="FINE">জরিমানা</option>
              <option value="OTHER">অন্যান্য</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={paymentMethodFilter}
              onChange={(e) => {
                setPaymentMethodFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="">সকল মাধ্যম</option>
              <option value="CASH">ক্যাশ (Cash)</option>
              <option value="BKASH">বিকাশ (bKash)</option>
              <option value="NAGAD">নগদ (Nagad)</option>
              <option value="ROCKET">রকেট (Rocket)</option>
              <option value="BANK_TRANSFER">ব্যাংক ট্রান্সফার</option>
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
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              title="শেষ তারিখ"
            />
            <button
              type="button"
              onClick={handleResetFilters}
              title="ফিল্টার রিসেট করুন"
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Fee Collections Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-800 text-base">ফি কালেকশন হিস্ট্রি</h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
              {totalCount} টি রেকর্ড
            </span>
          </div>

          {summary && (
            <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-500">
              <span>
                মোট আদায়: <strong className="text-emerald-600">৳{summary.totalPaid.toLocaleString('en-IN')}</strong>
              </span>
              <span>
                মোট বকেয়া: <strong className="text-amber-600">৳{summary.totalDue.toLocaleString('en-IN')}</strong>
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader />
            <p className="text-sm text-slate-400 mt-2">ফি রেকর্ড লোড হচ্ছে...</p>
          </div>
        ) : fees.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiDollarSign className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-700 text-base">কোনো ফি কালেকশন পাওয়া যায়নি</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              নতুন ফি গ্রহণের জন্য উপরে &quot;ফি আদায় করুন&quot; বাটনে ক্লিক করুন।
            </p>
            <Link
              href="/accounts/collect"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all"
            >
              <FiPlus className="w-4 h-4" /> নতুন ফি গ্রহণ করুন
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                  <th className="p-3.5 pl-4">রসিদ নং</th>
                  <th className="p-3.5">শিক্ষার্থী</th>
                  <th className="p-3.5">ফি বিবরণ / মাস</th>
                  <th className="p-3.5 text-right">নির্ধারিত</th>
                  <th className="p-3.5 text-right">পরিশোধিত</th>
                  <th className="p-3.5 text-right">বকেয়া</th>
                  <th className="p-3.5 text-center">মাধ্যম</th>
                  <th className="p-3.5">তারিখ</th>
                  <th className="p-3.5 text-center pr-4">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fees.map((row) => {
                  const studentName = row.student.nameBn || row.student.nameEn;
                  const batchName = row.student.batchStudents?.[0]?.batch?.name || '-';

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Receipt No */}
                      <td className="p-3.5 pl-4 font-mono font-bold text-emerald-700 text-xs">
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(row.id)}
                          className="hover:underline text-left cursor-pointer"
                          title="রসিদ দেখুন"
                        >
                          {row.receiptNo}
                        </button>
                      </td>

                      {/* Student info */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{studentName}</div>
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{row.student.studentId}</span>
                          <span>•</span>
                          <span className="truncate max-w-[120px]">{batchName}</span>
                        </div>
                      </td>

                      {/* Fee Month / Type */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getFeeTypeBadge(row.feeType)}
                          {row.feeMonth && (
                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              {row.feeMonth}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="p-3.5 text-right font-medium text-slate-700">
                        ৳{row.amount.toLocaleString('en-IN')}
                        {row.discount && row.discount > 0 ? (
                          <div className="text-[11px] text-emerald-600">
                            -৳{row.discount} ছাড়
                          </div>
                        ) : null}
                      </td>

                      {/* Paid Amount */}
                      <td className="p-3.5 text-right font-bold text-emerald-700">
                        ৳{row.paidAmount.toLocaleString('en-IN')}
                      </td>

                      {/* Due Amount */}
                      <td className="p-3.5 text-right font-bold">
                        {row.dueAmount > 0 ? (
                          <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md text-xs">
                            ৳{row.dueAmount.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">পরিশোধিত</span>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="p-3.5 text-center">
                        {getPaymentMethodBadge(row.paymentMethod)}
                        {row.transactionId && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {row.transactionId}
                          </div>
                        )}
                      </td>

                      {/* Payment Date */}
                      <td className="p-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(row.paymentDate).toLocaleDateString('bn-BD', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center pr-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Print Receipt */}
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(row.id)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                            title="রসিদ মুদ্রণ / দেখুন"
                          >
                            <FiPrinter className="w-4 h-4" />
                          </button>

                          {/* Send Receipt SMS */}
                          <button
                            type="button"
                            disabled={sendingSmsId === row.id}
                            onClick={() => handleSendSms(row.id)}
                            className={`p-1.5 rounded-lg transition-all ${
                              row.receiptSmsSent
                                ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                            }`}
                            title={
                              row.receiptSmsSent
                                ? 'রসিদ এসএমএস পাঠানো হয়েছে (পুনরায় পাঠাতে ক্লিক করুন)'
                                : 'অভিভাবককে এসএমএস পাঠান'
                            }
                          >
                            <FiSend className={`w-4 h-4 ${sendingSmsId === row.id ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Money Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {receiptLoading || !selectedReceipt ? (
              <div className="p-12 text-center">
                <Loader />
                <p className="text-sm text-slate-400 mt-2">রসিদ লোড হচ্ছে...</p>
              </div>
            ) : (
              <div>
                {/* Modal Top Actions */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl print:hidden">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    অফিসিয়াল মানি রসিদ প্রিভিউ
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendSms(selectedReceipt.receipt.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-all"
                    >
                      <FiSend className="w-3.5 h-3.5" />
                      এসএমএস পাঠান
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all"
                    >
                      <FiPrinter className="w-3.5 h-3.5" />
                      প্রিন্ট করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReceiptModal(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-all"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Printable Receipt Area */}
                <div id="money-receipt-print" className="p-6 sm:p-8 space-y-6 bg-white">
                  {/* Institute Header */}
                  <div className="text-center border-b-2 border-dashed border-slate-200 pb-5">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {selectedReceipt.institute.name}
                    </h2>
                    <p className="text-xs text-emerald-700 font-bold tracking-wider uppercase mt-0.5">
                      {selectedReceipt.institute.nameEn} • {selectedReceipt.institute.slogan}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedReceipt.institute.address} | হটলাইন: {selectedReceipt.institute.phone}
                    </p>
                    <div className="mt-3 inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full uppercase tracking-widest">
                      মানি রসিদ (MONEY RECEIPT)
                    </div>
                  </div>

                  {/* Receipt Meta Details */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <div>
                        <span className="text-slate-400 font-medium">রসিদ নং: </span>
                        <strong className="font-mono text-emerald-800 text-sm">
                          {selectedReceipt.receipt.receiptNo}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">শিক্ষার্থীর নাম: </span>
                        <strong className="text-slate-800">
                          {selectedReceipt.student.nameBn || selectedReceipt.student.nameEn}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">স্টুডেন্ট আইডি: </span>
                        <span className="font-mono text-slate-700">{selectedReceipt.student.studentId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">অভিভাবক: </span>
                        <span className="text-slate-700">
                          {selectedReceipt.student.guardianName || '-'} ({selectedReceipt.student.guardianPhone || '-'})
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-right">
                      <div>
                        <span className="text-slate-400 font-medium">তারিখ: </span>
                        <strong className="text-slate-800">
                          {new Date(selectedReceipt.receipt.paymentDate).toLocaleDateString('bn-BD', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">ব্যাচ ও শ্রেণি: </span>
                        <span className="text-slate-700">
                          {selectedReceipt.student.batchName} ({selectedReceipt.student.classLevel})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">রোল নম্বর: </span>
                        <span className="font-mono text-slate-700">{selectedReceipt.student.rollNo}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">পেমেন্ট মাধ্যম: </span>
                        <span className="font-bold text-slate-800">
                          {selectedReceipt.receipt.paymentMethod}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fee Items Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                        <tr>
                          <th className="p-2.5 pl-3">বিবরণ</th>
                          <th className="p-2.5 text-center">মাস</th>
                          <th className="p-2.5 text-right">নির্ধারিত ফি</th>
                          <th className="p-2.5 text-right">ছাড়</th>
                          <th className="p-2.5 text-right pr-3">পরিশোধ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-2.5 pl-3 font-medium text-slate-800">
                            {selectedReceipt.receipt.feeType === 'MONTHLY_FEE'
                              ? 'মাসিক টিউশন ফি'
                              : selectedReceipt.receipt.feeType}
                          </td>
                          <td className="p-2.5 text-center text-slate-600">
                            {selectedReceipt.receipt.feeMonth || '-'}
                          </td>
                          <td className="p-2.5 text-right font-medium text-slate-700">
                            ৳{selectedReceipt.receipt.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 text-right text-emerald-600 font-medium">
                            ৳{selectedReceipt.receipt.discount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 text-right pr-3 font-bold text-slate-900">
                            ৳{selectedReceipt.receipt.paidAmount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                        <tr>
                          <td colSpan={4} className="p-2.5 text-right">
                            মোট পরিশোধিত টাকা:
                          </td>
                          <td className="p-2.5 text-right pr-3 text-emerald-700 text-sm">
                            ৳{selectedReceipt.receipt.paidAmount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                        {selectedReceipt.receipt.dueAmount > 0 && (
                          <tr className="text-rose-600">
                            <td colSpan={4} className="p-2.5 text-right">
                              অবশিষ্ট বকেয়া:
                            </td>
                            <td className="p-2.5 text-right pr-3 text-sm">
                              ৳{selectedReceipt.receipt.dueAmount.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>

                  {/* Amount in Words */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <span className="text-slate-400 font-medium">কথায়: </span>
                    <strong className="text-slate-800 font-semibold">{selectedReceipt.receipt.inWords}</strong>
                  </div>

                  {/* Signatures */}
                  <div className="pt-8 flex items-end justify-between text-xs text-slate-500">
                    <div className="text-center">
                      <div className="w-28 border-b border-slate-300 mb-1"></div>
                      <span>অভিভাবকের স্বাক্ষর</span>
                    </div>

                    <div className="text-center">
                      <div className="w-32 border-b border-slate-300 mb-1"></div>
                      <span className="font-bold text-slate-800">আদায়কারীর স্বাক্ষর ও সিল</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
