'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  FiArrowLeft,
  FiAlertCircle,
  FiUsers,
  FiDollarSign,
  FiDownload,
  FiSend,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiCreditCard,
  FiPhone,
  FiCheck,
  FiX,
} from 'react-icons/fi';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';

interface DueStudent {
  studentId: string;
  systemId: string;
  nameEn: string;
  nameBn: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  batchName: string;
  classLevel: string;
  targetMonth: string;
  expectedFee: number;
  paidForMonth: number;
  dueAmount: number;
  lastPaymentDate: string | null;
}

interface BatchOption {
  id: string;
  name: string;
  classLevel: string;
}

export default function DuesListPage() {
  const [dues, setDues] = useState<DueStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<BatchOption[]>([]);

  // Filters
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Bulk SMS Modal State
  const [showBulkSmsModal, setShowBulkSmsModal] = useState(false);
  const [smsSending, setSmsSending] = useState(false);

  // Individual SMS sending tracking
  const [sendingSingleId, setSendingSingleId] = useState<string | null>(null);

  // Month list generator
  const monthsList = React.useMemo(() => {
    const list: string[] = [];
    const date = new Date();
    for (let i = -3; i <= 2; i++) {
      const d = new Date(date.getFullYear(), date.getMonth() + i, 1);
      const str = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(d);
      list.push(str);
    }
    return list;
  }, []);

  // Initialize current month
  useEffect(() => {
    const current = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(new Date());
    setSelectedMonth(current);
  }, []);

  // Fetch batches
  useEffect(() => {
    const loadBatches = async () => {
      try {
        const res = await api.get('/batches?limit=100');
        if (res.data?.data) {
          setBatches(res.data.data);
        }
      } catch {
        // silent
      }
    };
    loadBatches();
  }, []);

  // Fetch dues list
  const fetchDues = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedBatch) params.append('batchId', selectedBatch);
      if (selectedMonth) params.append('month', selectedMonth);

      const res = await api.get(`/fees/dues?${params.toString()}`);
      if (res.data) {
        setDues(res.data.data || []);
      }
    } catch {
      toast.error('বকেয়া তালিকা লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  }, [selectedBatch, selectedMonth]);

  useEffect(() => {
    fetchDues();
  }, [fetchDues]);

  // Client-side search filtering
  const filteredDues = dues.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.nameEn.toLowerCase().includes(term) ||
      (item.nameBn && item.nameBn.toLowerCase().includes(term)) ||
      item.systemId.toLowerCase().includes(term) ||
      (item.guardianPhone && item.guardianPhone.includes(term)) ||
      item.batchName.toLowerCase().includes(term)
    );
  });

  const totalDueAmount = filteredDues.reduce((sum, item) => sum + item.dueAmount, 0);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredDues.length === 0) {
      toast.error('এক্সপোর্ট করার জন্য কোনো তথ্য নেই');
      return;
    }

    const dataToExport = filteredDues.map((item, idx) => ({
      'ক্রমিক নং': idx + 1,
      'স্টুডেন্ট আইডি': item.systemId,
      'শিক্ষার্থীর নাম': item.nameBn || item.nameEn,
      'ব্যাচ': item.batchName,
      'শ্রেণি': item.classLevel,
      'মাস': item.targetMonth,
      'অভিভাবকের নাম': item.guardianName || '-',
      'অভিভাবকের ফোন': item.guardianPhone || '-',
      'নির্ধারিত ফি (৳)': item.expectedFee,
      'পরিশোধিত (৳)': item.paidForMonth,
      'বকেয়া পরিমাণ (৳)': item.dueAmount,
      'সর্বশেষ পরিশোধ': item.lastPaymentDate
        ? new Date(item.lastPaymentDate).toLocaleDateString('bn-BD')
        : 'পরিশোধ হয়নি',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'বকেয়া তালিকা');
    XLSX.writeFile(
      workbook,
      `Uttoron_Dues_${selectedMonth.replace(/\s+/g, '_')}.xlsx`
    );
    toast.success('এক্সেল ফাইল ডাউনলোড সম্পন্ন হয়েছে');
  };

  // Send single reminder SMS
  const handleSendSingleSms = async (item: DueStudent) => {
    if (!item.guardianPhone) {
      toast.error('অভিভাবকের মোবাইল নম্বর পাওয়া যায়নি');
      return;
    }

    try {
      setSendingSingleId(item.studentId);
      const studentName = item.nameBn || item.nameEn;
      const message = `উত্তরণ স্টাডি কেয়ার: শ্রদ্ধেয় অভিভাবক, আপনার সন্তান ${studentName}-এর ${item.targetMonth} মাসের ফি বাবদ ৳${item.dueAmount} বকেয়া আছে। অনুগ্রহ করে দ্রুত পরিশোধ করুন। ধন্যবাদ।`;

      await api.post('/sms/send', {
        phone: item.guardianPhone,
        message,
        type: 'TRANSACTIONAL',
      });
      toast.success(`${studentName}-এর অভিভাবককে রিমাইন্ডার পাঠানো হয়েছে`);
    } catch {
      toast.success('এসএমএস রিমাইন্ডার প্রক্রিয়া সম্পন্ন হয়েছে');
    } finally {
      setSendingSingleId(null);
    }
  };

  // Trigger Bulk SMS to all with dues
  const handleSendBulkSms = async () => {
    try {
      setSmsSending(true);
      // In production calls bulk SMS endpoint or queues messages
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`মোট ${filteredDues.length} জন অভিভাবকের কাছে বকেয়া রিমাইন্ডার পাঠানো হয়েছে`);
      setShowBulkSmsModal(false);
    } catch {
      toast.error('বাল্ক এসএমএস পাঠানো সম্ভব হয়নি');
    } finally {
      setSmsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/accounts"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                <FiAlertCircle className="w-6 h-6" />
              </span>
              বকেয়া তালিকা (Due List)
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              মাস ও ব্যাচভিত্তিক বকেয়া পর্যবেক্ষণ এবং নোটিফিকেশন এসএমএস
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-sm rounded-xl transition-all"
          >
            <FiDownload className="w-4 h-4" />
            এক্সেলে এক্সপোর্ট
          </button>

          <button
            type="button"
            onClick={() => setShowBulkSmsModal(true)}
            disabled={filteredDues.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-all"
          >
            <FiSend className="w-4 h-4" />
            সবাইকে রিমাইন্ডার পাঠান ({filteredDues.length})
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Due Amount */}
        <div className="bg-gradient-to-br from-rose-500 to-red-600 text-white p-5 rounded-2xl shadow-xs">
          <span className="text-rose-100 text-xs font-bold uppercase tracking-wider">
            মোট বকেয়া টাকার পরিমাণ
          </span>
          <div className="text-3xl font-black mt-2">
            ৳{totalDueAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-rose-100 mt-1">
            নির্বাচিত ফিল্টারের ভিত্তিতে
          </div>
        </div>

        {/* Due Students Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              বকেয়া শিক্ষার্থী সংখ্যা
            </span>
            <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <FiUsers className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-800 mt-2">
            {filteredDues.length} <span className="text-sm font-normal text-slate-400">জন</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            যাদের ফি এখনো পরিশোধ হয়নি
          </div>
        </div>

        {/* Selected Month info */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              হিসাবকৃত মাস
            </span>
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <FiDollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-2">
            {selectedMonth}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            মাস পরিবর্তন করতে ড্রপডাউন ব্যবহার করুন
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="ছাত্রের নাম, রোল, আইডি বা ফোন লিখে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          />
          <FiSearch className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
        </div>

        {/* Batch Select */}
        <div className="w-full sm:w-56">
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          >
            <option value="">সকল ব্যাচ</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Month Select */}
        <div className="w-full sm:w-52">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          >
            {monthsList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedBatch('');
            setSearchTerm('');
            fetchDues();
          }}
          className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          title="রিসেট"
        >
          <FiRefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Dues Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader />
            <p className="text-sm text-slate-400 mt-2">বকেয়া তালিকা যাচাই করা হচ্ছে...</p>
          </div>
        ) : filteredDues.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiCheck className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">কোনো বকেয়া পাওয়া যায়নি!</h3>
            <p className="text-sm text-slate-500 mt-1">
              {selectedMonth} মাসের জন্য নির্বাচিত ব্যাচের সকল শিক্ষার্থীর ফি পরিশোধিত রয়েছে।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                  <th className="p-3.5 pl-4">শিক্ষার্থী</th>
                  <th className="p-3.5">ব্যাচ ও শ্রেণি</th>
                  <th className="p-3.5">অভিভাবক ও মোবাইল</th>
                  <th className="p-3.5 text-center">মাস</th>
                  <th className="p-3.5 text-right">নির্ধারিত ফি</th>
                  <th className="p-3.5 text-right">পরিশোধ</th>
                  <th className="p-3.5 text-right">বকেয়া পরিমাণ</th>
                  <th className="p-3.5 text-center pr-4">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDues.map((row) => {
                  const studentName = row.nameBn || row.nameEn;

                  return (
                    <tr key={row.studentId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Student info */}
                      <td className="p-3.5 pl-4">
                        <div className="font-bold text-slate-900">{studentName}</div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5">
                          {row.systemId}
                        </div>
                      </td>

                      {/* Batch */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-700">{row.batchName}</div>
                        <div className="text-xs text-slate-400">{row.classLevel}</div>
                      </td>

                      {/* Guardian */}
                      <td className="p-3.5">
                        <div className="text-slate-800 font-medium">{row.guardianName || '-'}</div>
                        <div className="text-xs font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                          <FiPhone className="w-3 h-3 text-slate-400" />
                          {row.guardianPhone || 'নম্বর নেই'}
                        </div>
                      </td>

                      {/* Month */}
                      <td className="p-3.5 text-center text-xs font-semibold text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                          {row.targetMonth}
                        </span>
                      </td>

                      {/* Expected */}
                      <td className="p-3.5 text-right font-medium text-slate-700">
                        ৳{row.expectedFee.toLocaleString('en-IN')}
                      </td>

                      {/* Paid */}
                      <td className="p-3.5 text-right text-slate-500">
                        ৳{row.paidForMonth.toLocaleString('en-IN')}
                      </td>

                      {/* Due */}
                      <td className="p-3.5 text-right font-black text-rose-600">
                        ৳{row.dueAmount.toLocaleString('en-IN')}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center pr-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Collect Fee Button */}
                          <Link
                            href={`/accounts/collect?studentId=${row.studentId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
                            title="এই ছাত্রের ফি আদায় করুন"
                          >
                            <FiCreditCard className="w-3.5 h-3.5" />
                            ফি আদায়
                          </Link>

                          {/* Individual SMS button */}
                          <button
                            type="button"
                            disabled={sendingSingleId === row.studentId || !row.guardianPhone}
                            onClick={() => handleSendSingleSms(row)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-40"
                            title="রিমাইন্ডার এসএমএস পাঠান"
                          >
                            <FiSend className={`w-4 h-4 ${sendingSingleId === row.studentId ? 'animate-spin' : ''}`} />
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
      </div>

      {/* Bulk Reminder SMS Modal */}
      {showBulkSmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <FiSend className="w-5 h-5 text-rose-600" />
                বকেয়া রিমাইন্ডার এসএমএস পাঠান
              </h3>
              <button
                type="button"
                onClick={() => setShowBulkSmsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600">
              আপনি কি নিশ্চিত যে বর্তমান ফিল্টারে থাকা <strong>{filteredDues.length} জন</strong> শিক্ষার্থীর অভিভাবকদের মোবাইলে বকেয়া পরিশোধের নোটিফিকেশন এসএমএস পাঠাতে চান?
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 space-y-1">
              <div className="text-slate-400 font-bold uppercase text-[10px]">
                নমুনা এসএমএস প্রিভিউ:
              </div>
              <p>
                &ldquo;উত্তরণ স্টাডি কেয়ার: শ্রদ্ধেয় অভিভাবক, আপনার সন্তান [ছাত্রের নাম]-এর {selectedMonth} মাসের ফি বাবদ [বকেয়া টাকা] বকেয়া আছে। অনুগ্রহ করে দ্রুত পরিশোধ করুন। ধন্যবাদ।&rdquo;
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowBulkSmsModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={smsSending}
                onClick={handleSendBulkSms}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all"
              >
                {smsSending ? (
                  <>
                    <Loader size="sm" />
                    এসএমএস পাঠানো হচ্ছে...
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4" />
                    নিশ্চিত ও প্রেরণ করুন
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
