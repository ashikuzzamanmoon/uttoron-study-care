'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCalendar,
  FiPrinter,
  FiFileText,
  FiPieChart,
  FiBarChart2,
  FiRefreshCw,
  FiDownload,
} from 'react-icons/fi';
import { Loader } from '@/components/ui/Loader';

export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly' | 'collection' | 'expense'>('monthly');
  const [loading, setLoading] = useState(true);

  // Month & Year state
  const currentDate = new Date();
  const [targetYear, setTargetYear] = useState<number>(currentDate.getFullYear());
  const [targetMonth, setTargetMonth] = useState<number>(currentDate.getMonth() + 1);

  // Report Data States
  const [monthlyData, setMonthlyData] = useState<any | null>(null);
  const [yearlyData, setYearlyData] = useState<any | null>(null);
  const [collectionData, setCollectionData] = useState<any | null>(null);
  const [expenseData, setExpenseData] = useState<any | null>(null);

  // Fetch Monthly Summary
  const fetchMonthly = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/accounts/summary/monthly?month=${targetMonth}&year=${targetYear}`);
      if (res.data) {
        setMonthlyData(res.data);
      }
    } catch {
      toast.error('মাসিক রিপোর্ট লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  }, [targetMonth, targetYear]);

  // Fetch Yearly Summary
  const fetchYearly = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/accounts/summary/yearly?year=${targetYear}`);
      if (res.data) {
        setYearlyData(res.data);
      }
    } catch {
      toast.error('বার্ষিক রিপোর্ট লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  }, [targetYear]);

  // Fetch Collection Report
  const fetchCollection = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/accounts/collection-report');
      if (res.data) {
        setCollectionData(res.data);
      }
    } catch {
      toast.error('কালেকশন রিপোর্ট লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Expense Report
  const fetchExpense = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/accounts/expense-report');
      if (res.data) {
        setExpenseData(res.data);
      }
    } catch {
      toast.error('ব্যয় রিপোর্ট লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'monthly') fetchMonthly();
    else if (activeTab === 'yearly') fetchYearly();
    else if (activeTab === 'collection') fetchCollection();
    else if (activeTab === 'expense') fetchExpense();
  }, [activeTab, fetchMonthly, fetchYearly, fetchCollection, fetchExpense]);

  const monthNames = [
    'জানুয়ারি (January)',
    'ফেব্রুয়ারি (February)',
    'মার্চ (March)',
    'এপ্রিল (April)',
    'মে (May)',
    'জুন (June)',
    'জুলাই (July)',
    'আগস্ট (August)',
    'সেপ্টেম্বর (September)',
    'অক্টোবর (October)',
    'নভেম্বর (November)',
    'ডিসেম্বর (December)',
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200 print:hidden">
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
                <FiBarChart2 className="w-6 h-6" />
              </span>
              আর্থিক রিপোর্ট ও বিশ্লেষণ
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              মাসিক আয়-ব্যয় হিসাব, বার্ষিক পর্যালোচনা ও প্রফিট মার্জিন অডিট
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl shadow-xs transition-all"
          >
            <FiPrinter className="w-4 h-4" />
            রিপোর্ট প্রিন্ট করুন
          </button>
        </div>
      </div>

      {/* Tabs & Period Selectors */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'monthly'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            মাসিক পর্যালোচনা
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('yearly')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'yearly'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            বার্ষিক তুলনামূলক রিপোর্ট
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('collection')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'collection'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ফি কালেকশন রিপোর্ট
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expense')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'expense'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ব্যয় বিশ্লেষণ রিপোর্ট
          </button>
        </div>

        {/* Month / Year Selectors */}
        {(activeTab === 'monthly' || activeTab === 'yearly') && (
          <div className="flex items-center gap-2.5">
            {activeTab === 'monthly' && (
              <select
                value={targetMonth}
                onChange={(e) => setTargetMonth(Number(e.target.value))}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={targetYear}
              onChange={(e) => setTargetYear(Number(e.target.value))}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y} সাল
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 shadow-xs text-center">
          <Loader />
          <p className="text-sm text-slate-400 mt-2">আর্থিক তথ্য সংকলন করা হচ্ছে...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: MONTHLY SUMMARY */}
          {activeTab === 'monthly' && monthlyData && (
            <div className="space-y-6">
              {/* Monthly KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    মাসিক মোট আয়
                  </span>
                  <div className="text-3xl font-black text-emerald-600 mt-2">
                    ৳{monthlyData.kpis.totalIncome.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">টিউশন ফি ও অন্যান্য আদায়</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    মাসিক মোট ব্যয়
                  </span>
                  <div className="text-3xl font-black text-rose-600 mt-2">
                    ৳{monthlyData.kpis.totalExpense.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">সকল ধরণের খরচ ভাউচার</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    নিট ব্যালেন্স / প্রফিট
                  </span>
                  <div
                    className={`text-3xl font-black mt-2 ${
                      monthlyData.kpis.netProfit >= 0 ? 'text-indigo-700' : 'text-rose-600'
                    }`}
                  >
                    ৳{monthlyData.kpis.netProfit.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">আয় বিয়োগ ব্যয়</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    মুনাফার হার
                  </span>
                  <div className="text-3xl font-black text-slate-800 mt-2">
                    {monthlyData.kpis.profitMargin}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">প্রফিট মার্জিন রেশিও</div>
                </div>
              </div>

              {/* Income & Expense Breakdown Grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Income by FeeType */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    ফি এর খাতভিত্তিক আদায়
                  </h3>
                  {Object.keys(monthlyData.incomeByFeeType || {}).length === 0 ? (
                    <p className="text-xs text-slate-400 py-4">এই মাসে কোনো ফি আদায় হয়নি।</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(monthlyData.incomeByFeeType).map(([type, amt]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{type}</span>
                          <strong className="text-emerald-700 text-sm">
                            ৳{Number(amt).toLocaleString('en-IN')}
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expense by Category */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    ব্যয়ের খাতভিত্তিক বিশ্লেষণ
                  </h3>
                  {Object.keys(monthlyData.expenseByCategory || {}).length === 0 ? (
                    <p className="text-xs text-slate-400 py-4">এই মাসে কোনো খরচ এন্ট্রি নেই।</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(monthlyData.expenseByCategory).map(([cat, amt]: [string, any]) => (
                        <div key={cat} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{cat}</span>
                          <strong className="text-rose-600 text-sm">
                            ৳{Number(amt).toLocaleString('en-IN')}
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Daily Trend Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-base">
                    {monthlyData.monthName} — প্রতিদিনের আয়-ব্যয় বিবরণী
                  </h3>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 font-bold text-slate-700">
                      <tr>
                        <th className="p-3 pl-4">তারিখ</th>
                        <th className="p-3 text-right">আয় (৳)</th>
                        <th className="p-3 text-right">ব্যয় (৳)</th>
                        <th className="p-3 text-right pr-4">দৈনিক নিট (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthlyData.dailyData.map((d: any) => (
                        <tr key={d.day} className="hover:bg-slate-50">
                          <td className="p-3 pl-4 font-mono font-medium text-slate-700">
                            {d.date}
                          </td>
                          <td className="p-3 text-right text-emerald-700 font-semibold">
                            {d.income > 0 ? `৳${d.income.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="p-3 text-right text-rose-600 font-semibold">
                            {d.expense > 0 ? `৳${d.expense.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td
                            className={`p-3 text-right pr-4 font-bold ${
                              d.net > 0
                                ? 'text-emerald-700'
                                : d.net < 0
                                ? 'text-rose-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {d.net !== 0 ? `৳${d.net.toLocaleString('en-IN')}` : '০'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: YEARLY COMPARISON */}
          {activeTab === 'yearly' && yearlyData && (
            <div className="space-y-6">
              {/* Yearly KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-xs">
                  <span className="text-emerald-100 text-xs font-bold uppercase tracking-wider">
                    {yearlyData.year} সালের মোট আয়
                  </span>
                  <div className="text-3xl font-black mt-2">
                    ৳{yearlyData.kpis.totalIncome.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-emerald-100 mt-1">১২ মাসের সর্বমোট সংগ্রহ</div>
                </div>

                <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-5 rounded-2xl shadow-xs">
                  <span className="text-rose-100 text-xs font-bold uppercase tracking-wider">
                    {yearlyData.year} সালের মোট ব্যয়
                  </span>
                  <div className="text-3xl font-black mt-2">
                    ৳{yearlyData.kpis.totalExpense.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-rose-100 mt-1">১২ মাসের সর্বমোট ব্যয়</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    বার্ষিক নিট প্রফিট
                  </span>
                  <div
                    className={`text-3xl font-black mt-2 ${
                      yearlyData.kpis.netProfit >= 0 ? 'text-indigo-700' : 'text-rose-600'
                    }`}
                  >
                    ৳{yearlyData.kpis.netProfit.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-medium">
                    মুনাফার হার: {yearlyData.kpis.profitMargin}
                  </div>
                </div>
              </div>

              {/* 12 Months Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-base">
                    মাসভিত্তিক তুলনামূলক আর্থিক বিবরণী ({yearlyData.year})
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase">
                      <tr>
                        <th className="p-3.5 pl-4">মাস</th>
                        <th className="p-3.5 text-right">আদায় (৳)</th>
                        <th className="p-3.5 text-right">ব্যয় (৳)</th>
                        <th className="p-3.5 text-right pr-4">ব্যালেন্স / লাভ (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {yearlyData.months.map((m: any) => (
                        <tr key={m.month} className="hover:bg-slate-50">
                          <td className="p-3.5 pl-4 font-bold text-slate-800 text-sm">
                            {m.monthName}
                          </td>
                          <td className="p-3.5 text-right text-emerald-700 font-semibold text-sm">
                            ৳{m.income.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3.5 text-right text-rose-600 font-semibold text-sm">
                            ৳{m.expense.toLocaleString('en-IN')}
                          </td>
                          <td
                            className={`p-3.5 text-right pr-4 font-black text-sm ${
                              m.netBalance > 0
                                ? 'text-indigo-700'
                                : m.netBalance < 0
                                ? 'text-rose-600'
                                : 'text-slate-400'
                            }`}
                          >
                            ৳{m.netBalance.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COLLECTION REPORT */}
          {activeTab === 'collection' && collectionData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-slate-400 text-xs font-bold uppercase">মোট সংগৃহীত ফি</span>
                  <div className="text-3xl font-black text-emerald-700 mt-2">
                    ৳{collectionData.summary.totalPaid.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    মোট রসিদ: {collectionData.summary.totalRecords} টি
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-slate-400 text-xs font-bold uppercase">মোট প্রদত্ত ছাড়</span>
                  <div className="text-3xl font-black text-indigo-700 mt-2">
                    ৳{collectionData.summary.totalDiscount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">স্কলারশিপ ও বিশেষ ছাড়</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-slate-400 text-xs font-bold uppercase">রেকর্ডকৃত বকেয়া</span>
                  <div className="text-3xl font-black text-rose-600 mt-2">
                    ৳{collectionData.summary.totalDue.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">অনাদায়ী ফি</div>
                </div>
              </div>

              {/* Batch wise Collections */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-base">ব্যাচভিত্তিক ফি আদায়ের চিত্র</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {collectionData.byBatch?.map((b: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="font-bold text-slate-800 text-sm truncate">{b.batchName}</div>
                      <div className="text-xs text-slate-400 mt-0.5">রসিদ সংখ্যা: {b.count} টি</div>
                      <div className="text-base font-black text-emerald-700 mt-1.5">
                        ৳{b.total.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXPENSE REPORT */}
          {activeTab === 'expense' && expenseData && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-slate-400 text-xs font-bold uppercase">সর্বমোট ব্যয়</span>
                <div className="text-3xl font-black text-rose-600 mt-2">
                  ৳{expenseData.summary.totalExpense.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  মোট ভাউচার সংখ্যা: {expenseData.summary.totalRecords} টি
                </div>
              </div>

              {/* By Category */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-base">ক্যাটাগরিভিত্তিক ব্যয়ের বিভাজন</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(expenseData.byCategory || {}).map(([cat, val]: [string, any]) => (
                    <div key={cat} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="font-bold text-slate-800 text-sm">{cat}</div>
                      <div className="text-xs text-slate-400 mt-0.5">ভাউচার: {val.count} টি</div>
                      <div className="text-base font-black text-rose-600 mt-1.5">
                        ৳{val.total.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
