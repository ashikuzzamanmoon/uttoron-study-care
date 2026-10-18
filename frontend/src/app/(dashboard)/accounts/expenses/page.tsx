'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiTrendingDown,
  FiPlus,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiEdit3,
  FiCalendar,
  FiDollarSign,
  FiRefreshCw,
  FiCreditCard,
  FiCheck,
  FiX,
  FiTag,
} from 'react-icons/fi';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';

interface ExpenseItem {
  id: string;
  voucherNo: string;
  category: string;
  description: string;
  amount: number;
  paidTo: string | null;
  paymentMethod: string;
  expenseDate: string;
  remarks: string | null;
  createdAt: string;
}

const CATEGORY_MAP: Record<string, { label: string; badgeVariant: 'danger' | 'warning' | 'primary' | 'secondary' | 'neutral' | 'success' }> = {
  SALARY: { label: 'বেতন (Salary)', badgeVariant: 'primary' },
  RENT: { label: 'অফিস/রুম ভাড়া', badgeVariant: 'danger' },
  ELECTRICITY: { label: 'বিদ্যুৎ বিল', badgeVariant: 'warning' },
  INTERNET: { label: 'ইন্টারনেট বিল', badgeVariant: 'secondary' },
  STATIONERY: { label: 'স্টেশনারি ও খাতা', badgeVariant: 'neutral' },
  FURNITURE: { label: 'আসবাবপত্র ও সরঞ্জাম', badgeVariant: 'neutral' },
  MARKETING: { label: 'বিজ্ঞাপন ও প্রচার', badgeVariant: 'warning' },
  SMS_RECHARGE: { label: 'এসএমএস রিচার্জ', badgeVariant: 'success' },
  MAINTENANCE: { label: 'রক্ষণাবেক্ষণ', badgeVariant: 'secondary' },
  OTHER: { label: 'অন্যান্য খরচ', badgeVariant: 'neutral' },
};

export default function ExpensesTrackerPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State for New/Edit Expense
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formCategory, setFormCategory] = useState('OTHER');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formPaidTo, setFormPaidTo] = useState('');
  const [formMethod, setFormMethod] = useState('CASH');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formRemarks, setFormRemarks] = useState('');

  // Delete confirmation modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '15');
      if (search.trim()) params.append('search', search.trim());
      if (categoryFilter) params.append('category', categoryFilter);
      if (methodFilter) params.append('paymentMethod', methodFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/expenses?${params.toString()}`);
      if (res.data) {
        setExpenses(res.data.data || []);
        setTotalExpense(res.data.summary?.totalExpense || 0);
        if (res.data.meta) {
          setTotalCount(res.data.meta.total || 0);
          setTotalPages(res.data.meta.totalPages || 1);
        }
      }
    } catch {
      toast.error('ব্যয়ের তালিকা লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, methodFilter, startDate, endDate]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormCategory('OTHER');
    setFormDescription('');
    setFormAmount('');
    setFormPaidTo('');
    setFormMethod('CASH');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormRemarks('');
    setShowModal(true);
  };

  const handleOpenEditModal = (item: ExpenseItem) => {
    setEditingId(item.id);
    setFormCategory(item.category);
    setFormDescription(item.description);
    setFormAmount(item.amount);
    setFormPaidTo(item.paidTo || '');
    setFormMethod(item.paymentMethod);
    setFormDate(new Date(item.expenseDate).toISOString().slice(0, 10));
    setFormRemarks(item.remarks || '');
    setShowModal(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim()) {
      toast.error('খরচের বিবরণ আবশ্যক');
      return;
    }
    const numAmount = Number(formAmount);
    if (!numAmount || numAmount <= 0) {
      toast.error('সঠিক টাকার পরিমাণ লিখুন');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        category: formCategory,
        description: formDescription.trim(),
        amount: numAmount,
        paidTo: formPaidTo.trim() || undefined,
        paymentMethod: formMethod,
        expenseDate: formDate,
        remarks: formRemarks.trim() || undefined,
      };

      if (editingId) {
        await api.put(`/expenses/${editingId}`, payload);
        toast.success('ব্যয় সফলভাবে আপডেট করা হয়েছে');
      } else {
        await api.post('/expenses', payload);
        toast.success('নতুন ব্যয় ভাউচার সফলভাবে তৈরি হয়েছে');
      }

      setShowModal(false);
      fetchExpenses();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'ব্যয় সংরক্ষণ করতে ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('ব্যয় মুছে ফেলা হয়েছে');
      setDeletingId(null);
      fetchExpenses();
    } catch {
      toast.error('ব্যয় মুছে ফেলা সম্ভব হয়নি');
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
              <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                <FiTrendingDown className="w-6 h-6" />
              </span>
              ব্যয় হিসাব ও ভাউচার ট্র্যাকার
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              কোচিংয়ের বেতন, ভাড়া, ইউটিলিটি ও অন্যান্য ব্যয়ের ভাউচার সংরক্ষণ
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-xs transition-all"
        >
          <FiPlus className="w-4 h-4" />
          নতুন ব্যয় এন্ট্রি করুন
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Expense */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-5 rounded-2xl shadow-xs">
          <span className="text-indigo-100 text-xs font-bold uppercase tracking-wider">
            মোট ব্যয়ের পরিমাণ
          </span>
          <div className="text-3xl font-black mt-2">
            ৳{totalExpense.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-indigo-100 mt-1">
            বর্তমান ফিল্টারে থাকা সর্বমোট খরচ
          </div>
        </div>

        {/* Voucher count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            মোট ভাউচার সংখ্যা
          </span>
          <div className="text-3xl font-black text-slate-800 mt-2">
            {totalCount} <span className="text-sm font-normal text-slate-400">টি ভাউচার</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            সিস্টেমে সংরক্ষিত বিল ও ভাউচার
          </div>
        </div>

        {/* Average per voucher */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            গড় ভাউচার খরচ
          </span>
          <div className="text-3xl font-black text-indigo-700 mt-2">
            ৳{totalCount > 0 ? Math.round(totalExpense / totalCount).toLocaleString('en-IN') : 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            প্রতি ভাউচারে গড় খরচ
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="ভাউচার নং, বিবরণ বা গ্রহীতার নাম..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <FiSearch className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="">সকল ব্যয়ের খাত</option>
              {Object.entries(CATEGORY_MAP).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="">সকল পেমেন্ট মাধ্যম</option>
              <option value="CASH">ক্যাশ (Cash)</option>
              <option value="BKASH">বিকাশ (bKash)</option>
              <option value="NAGAD">নগদ (Nagad)</option>
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
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
                setMethodFilter('');
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              title="রিসেট"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader />
            <p className="text-sm text-slate-400 mt-2">ব্যয়ের ভাউচার লোড হচ্ছে...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiTrendingDown className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">কোনো খরচের ভাউচার পাওয়া যায়নি</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              নতুন ব্যয় এন্ট্রি করার জন্য &quot;নতুন ব্যয় এন্ট্রি করুন&quot; বাটনে ক্লিক করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                  <th className="p-3.5 pl-4">ভাউচার নং</th>
                  <th className="p-3.5">তারিখ</th>
                  <th className="p-3.5">ক্যাটাগরি</th>
                  <th className="p-3.5">বিবরণ</th>
                  <th className="p-3.5">প্রদানকারী / গ্রহীতা</th>
                  <th className="p-3.5 text-right">পরিমাণ (টাকা)</th>
                  <th className="p-3.5 text-center">মাধ্যম</th>
                  <th className="p-3.5 text-center pr-4">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((row) => {
                  const catConfig = CATEGORY_MAP[row.category] || {
                    label: row.category,
                    badgeVariant: 'neutral',
                  };

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Voucher No */}
                      <td className="p-3.5 pl-4 font-mono font-bold text-indigo-700 text-xs">
                        {row.voucherNo}
                      </td>

                      {/* Date */}
                      <td className="p-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(row.expenseDate).toLocaleDateString('bn-BD', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <Badge variant={catConfig.badgeVariant}>
                          {catConfig.label}
                        </Badge>
                      </td>

                      {/* Description */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{row.description}</div>
                        {row.remarks && (
                          <div className="text-xs text-slate-400 mt-0.5">{row.remarks}</div>
                        )}
                      </td>

                      {/* Paid To */}
                      <td className="p-3.5 text-slate-600 font-medium">
                        {row.paidTo || '-'}
                      </td>

                      {/* Amount */}
                      <td className="p-3.5 text-right font-black text-rose-600 text-base">
                        ৳{row.amount.toLocaleString('en-IN')}
                      </td>

                      {/* Method */}
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700">
                          {row.paymentMethod}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center pr-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(row)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="সম্পাদনা করুন"
                          >
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(row.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="মুছে ফেলুন"
                          >
                            <FiTrash2 className="w-4 h-4" />
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
              পৃষ্ঠা {page} / {totalPages} (মোট {totalCount} টি ভাউচার)
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

      {/* New / Edit Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <FiTag className="w-5 h-5 text-indigo-600" />
                {editingId ? 'ব্যয় ভাউচার সম্পাদনা' : 'নতুন ব্যয় ভাউচার তৈরি'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ব্যয়ের খাত / ক্যাটাগরি <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  {Object.entries(CATEGORY_MAP).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ব্যয়ের বিবরণ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: জানুয়ারি মাসের অফিস রুম ভাড়া"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    টাকার পরিমাণ (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value) || '')}
                    className="w-full px-3.5 py-2.5 text-sm font-bold text-rose-700 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পেমেন্ট মাধ্যম <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    <option value="CASH">ক্যাশ (Cash)</option>
                    <option value="BKASH">বিকাশ (bKash)</option>
                    <option value="NAGAD">নগদ (Nagad)</option>
                    <option value="BANK_TRANSFER">ব্যাংক ট্রান্সফার</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    প্রদানকারী / গ্রহীতা
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: বাড়িওয়ালা / শিক্ষক নাম"
                    value={formPaidTo}
                    onChange={(e) => setFormPaidTo(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ব্যয়ের তারিখ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মন্তব্য / অতিরিক্ত বিবরণ
                </label>
                <textarea
                  rows={2}
                  placeholder="প্রয়োজনে বিশেষ নোট লিখুন..."
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-xs transition-all"
                >
                  {saving ? (
                    <>
                      <Loader size="sm" /> সংরক্ষণ হচ্ছে...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" /> সংরক্ষণ করুন
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <FiTrash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-base">ব্যয় ভাউচার মুছে ফেলতে চান?</h3>
              <p className="text-xs text-slate-500 mt-1">
                এই ভাউচারটি একবার মুছে ফেললে হিসাব খাতা থেকে চিরতরে অপসারিত হবে।
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => handleDeleteExpense(deletingId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
