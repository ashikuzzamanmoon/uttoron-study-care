'use client';

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiUser,
  FiSearch,
  FiDollarSign,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiPrinter,
  FiSend,
  FiLayers,
  FiPhone,
  FiX,
  FiRefreshCw,
} from 'react-icons/fi';
import { Loader } from '@/components/ui/Loader';

interface StudentSearchResult {
  id: string;
  studentId: string;
  nameEn: string;
  nameBn: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  monthlyFee: number | null;
  discount: number | null;
  admissionFee: number | null;
  batchStudents?: Array<{
    batch: {
      id: string;
      name: string;
      classLevel: string;
      monthlyFee: number | null;
    };
  }>;
}

interface StudentFeeHistory {
  student: any;
  summary: {
    totalTransactions: number;
    totalPaid: number;
    totalDiscount: number;
    totalDue: number;
  };
  history: any[];
}

export default function CollectFeePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedStudentId = searchParams.get('studentId');

  // Search & Student selection
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
  const [studentHistory, setStudentHistory] = useState<StudentFeeHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form Fields
  const [feeType, setFeeType] = useState('MONTHLY_FEE');
  const [feeMonth, setFeeMonth] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [discount, setDiscount] = useState<number>(0);
  const [fine, setFine] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState('');
  const [sendSms, setSendSms] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  // Success Receipt Modal
  const [createdReceipt, setCreatedReceipt] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Default months generator for selector
  const monthsList = React.useMemo(() => {
    const list: string[] = [];
    const date = new Date();
    // last 2 months + current month + next 2 months
    for (let i = -2; i <= 2; i++) {
      const d = new Date(date.getFullYear(), date.getMonth() + i, 1);
      const str = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(d);
      list.push(str);
    }
    return list;
  }, []);

  // Set default current month
  useEffect(() => {
    const currentMonth = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(new Date());
    setFeeMonth(currentMonth);
  }, []);

  // Handle student search with debounce
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await api.get(`/students?search=${encodeURIComponent(searchTerm.trim())}&limit=8`);
        if (res.data?.data) {
          setSearchResults(res.data.data);
        }
      } catch {
        // silent search error
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load student by ID if preselected from query param
  useEffect(() => {
    if (preselectedStudentId) {
      const loadPreselected = async () => {
        try {
          const res = await api.get(`/students/${preselectedStudentId}`);
          if (res.data) {
            handleSelectStudent(res.data);
          }
        } catch {
          // ignore
        }
      };
      loadPreselected();
    }
  }, [preselectedStudentId]);

  // When a student is selected
  const handleSelectStudent = async (student: StudentSearchResult) => {
    setSelectedStudent(student);
    setSearchTerm('');
    setSearchResults([]);

    // Calculate default fees
    const primaryBatch = student.batchStudents?.[0]?.batch;
    const defaultMonthly = student.monthlyFee && student.monthlyFee > 0
      ? student.monthlyFee
      : (primaryBatch?.monthlyFee || 0);

    const defaultDisc = student.discount || 0;
    const net = Math.max(0, defaultMonthly - defaultDisc);

    setAmount(defaultMonthly);
    setDiscount(defaultDisc);
    setFine(0);
    setPaidAmount(net);

    // Fetch fee history & outstanding due
    try {
      setLoadingHistory(true);
      const res = await api.get(`/fees/student/${student.id}`);
      if (res.data) {
        setStudentHistory(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  // Recompute paidAmount whenever amount, discount or fine changes
  const handleAmountChange = (newAmount: number) => {
    setAmount(newAmount);
    const net = Math.max(0, newAmount - discount + fine);
    setPaidAmount(net);
  };

  const handleDiscountChange = (newDiscount: number) => {
    setDiscount(newDiscount);
    const numAmount = typeof amount === 'number' ? amount : 0;
    const net = Math.max(0, numAmount - newDiscount + fine);
    setPaidAmount(net);
  };

  const handleFineChange = (newFine: number) => {
    setFine(newFine);
    const numAmount = typeof amount === 'number' ? amount : 0;
    const net = Math.max(0, numAmount - discount + newFine);
    setPaidAmount(net);
  };

  // Calculations for display
  const numAmount = typeof amount === 'number' ? amount : 0;
  const numPaid = typeof paidAmount === 'number' ? paidAmount : 0;
  const netPayable = Math.max(0, numAmount - discount + fine);
  const liveDue = Math.max(0, netPayable - numPaid);

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast.error('অনুগ্রহ করে প্রথমে একজন শিক্ষার্থী নির্বাচন করুন');
      return;
    }

    if (numAmount <= 0) {
      toast.error('নির্ধারিত ফি অবশ্যই ০ টাকার বেশি হতে হবে');
      return;
    }

    if (numPaid < 0) {
      toast.error('পরিশোধের পরিমাণ ঋণাত্মক হতে পারে না');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        studentId: selectedStudent.id,
        feeType,
        feeMonth: feeType === 'MONTHLY_FEE' ? feeMonth : null,
        amount: numAmount,
        discount,
        fine,
        paidAmount: numPaid,
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        paymentDate,
        remarks: remarks.trim() || undefined,
        sendSms,
      };

      const res = await api.post('/fees/collect', payload);
      toast.success(res.data?.message || 'ফি সফলভাবে গ্রহণ করা হয়েছে!');

      // Fetch structured receipt data for modal print view
      const feeId = res.data?.data?.id;
      if (feeId) {
        const receiptRes = await api.get(`/fees/receipt/${feeId}/print`);
        if (receiptRes.data) {
          setCreatedReceipt(receiptRes.data);
          setShowReceiptModal(true);
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'ফি সংরক্ষণ করতে ব্যর্থ হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSelectedStudent(null);
    setStudentHistory(null);
    setAmount('');
    setDiscount(0);
    setFine(0);
    setPaidAmount('');
    setTransactionId('');
    setRemarks('');
    setShowReceiptModal(false);
    setCreatedReceipt(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/accounts"
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-all shadow-xs"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              ফি গ্রহণ ও মানি রসিদ
            </h1>
            <p className="text-sm text-slate-500">
              শিক্ষার্থী নির্বাচন করে টিউশন ফি, ভর্তি ফি বা বকেয়া আদায় করুন
            </p>
          </div>
        </div>

        <Link
          href="/accounts/dues"
          className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl hover:bg-rose-100 transition-all"
        >
          বকেয়া তালিকা দেখুন
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student Search & Profile Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Student Search Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FiUser className="w-4 h-4 text-emerald-600" />
              শিক্ষার্থী খুঁজুন
            </h2>

            <div className="relative">
              <input
                type="text"
                placeholder="নাম, রোল, আইডি বা ফোন নম্বর লিখুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <FiSearch className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              {isSearching && (
                <div className="absolute right-3 top-3">
                  <Loader size="sm" />
                </div>
              )}
            </div>

            {/* Dropdown Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute left-5 right-5 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-64 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((stu) => {
                  const bName = stu.batchStudents?.[0]?.batch?.name || 'ব্যাচ নেই';
                  return (
                    <button
                      key={stu.id}
                      type="button"
                      onClick={() => handleSelectStudent(stu)}
                      className="w-full p-3 text-left hover:bg-emerald-50/70 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-800 text-sm">
                          {stu.nameBn || stu.nameEn}
                        </div>
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{stu.studentId}</span>
                          <span>•</span>
                          <span>{bName}</span>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        সিলেক্ট
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Student Profile Card */}
          {selectedStudent ? (
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs relative space-y-4">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                title="শিক্ষার্থী পরিবর্তন করুন"
              >
                <FiX className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-bold text-lg">
                  {(selectedStudent.nameBn || selectedStudent.nameEn).slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedStudent.nameBn || selectedStudent.nameEn}
                  </h3>
                  <div className="text-xs font-mono text-emerald-700 font-semibold">
                    আইডি: {selectedStudent.studentId}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">ব্যাচ:</span>
                  <strong className="text-slate-700">
                    {selectedStudent.batchStudents?.[0]?.batch?.name || 'কোনো ব্যাচে যুক্ত নেই'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">শ্রেণি:</span>
                  <span className="text-slate-700">
                    {selectedStudent.batchStudents?.[0]?.batch?.classLevel || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">অভিভাবক:</span>
                  <span className="text-slate-700">
                    {selectedStudent.guardianName || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">মোবাইল:</span>
                  <span className="font-mono text-slate-700">
                    {selectedStudent.guardianPhone || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">নির্ধারিত মাসিক ফি:</span>
                  <strong className="text-emerald-700 font-bold">
                    ৳{selectedStudent.monthlyFee || selectedStudent.batchStudents?.[0]?.batch?.monthlyFee || 0}
                  </strong>
                </div>
                {selectedStudent.discount ? (
                  <div className="flex justify-between">
                    <span className="text-slate-400">স্পেশাল ছাড়:</span>
                    <span className="text-rose-600 font-semibold">
                      -৳{selectedStudent.discount}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Student Outstanding Due Box */}
              {studentHistory && (
                <div className="border-t border-slate-100 pt-3">
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="text-amber-800 font-bold">পূর্ববর্তী মোট বকেয়া</div>
                      <div className="text-slate-500 text-[11px]">
                        মোট ট্রানজ্যাকশন: {studentHistory.summary.totalTransactions} টি
                      </div>
                    </div>
                    <div className="text-base font-black text-amber-700">
                      ৳{studentHistory.summary.totalDue.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-2xl text-center text-slate-400">
              <FiUser className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">
                প্রথমে শিক্ষার্থী খুঁজুন এবং সিলেক্ট করুন। সিলেক্ট করলে বিস্তারিত তথ্য ও ফি এখানে প্রদর্শিত হবে।
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Collection Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6"
          >
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FiDollarSign className="w-5 h-5 text-emerald-600" />
              ফি আদায়ের তথ্য পূরণ করুন
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Fee Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ফি এর ধরন <span className="text-rose-500">*</span>
                </label>
                <select
                  value={feeType}
                  onChange={(e) => setFeeType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                >
                  <option value="MONTHLY_FEE">মাসিক টিউশন ফি (Monthly Fee)</option>
                  <option value="ADMISSION_FEE">ভর্তি ফি (Admission Fee)</option>
                  <option value="EXAM_FEE">পরীক্ষা ফি (Exam Fee)</option>
                  <option value="BOOK_FEE">বই ও স্টাডি ম্যাটেরিয়াল ফি</option>
                  <option value="FINE">বিলম্ব জরিমানা (Fine)</option>
                  <option value="OTHER">অন্যান্য ফি (Other)</option>
                </select>
              </div>

              {/* Fee Month (if monthly fee) */}
              {feeType === 'MONTHLY_FEE' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ফি এর মাস <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={feeMonth}
                    onChange={(e) => setFeeMonth(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  >
                    {monthsList.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    রেফারেন্স / নোট
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: টার্ম ফাইনাল এক্সাম"
                    value={feeMonth}
                    onChange={(e) => setFeeMonth(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              )}

              {/* Original Fee Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নির্ধারিত ফি (টাকা) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => handleAmountChange(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  required
                />
              </div>

              {/* Discount Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ছাড় / স্কলারশিপ (টাকা)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  placeholder="0"
                  value={discount}
                  onChange={(e) => handleDiscountChange(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-sm font-bold text-emerald-700 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Fine Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  জরিমানা (টাকা)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  placeholder="0"
                  value={fine}
                  onChange={(e) => handleFineChange(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-sm font-bold text-rose-700 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পেমেন্টের তারিখ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Financial Summary Preview Box */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase">মোট প্রদেয়</span>
                <div className="text-lg font-black text-slate-800">
                  ৳{netPayable.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="border-x border-slate-200 px-2">
                <span className="text-[11px] text-emerald-600 font-bold uppercase">পরিশোধ</span>
                <div className="text-lg font-black text-emerald-700">
                  ৳{numPaid.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-rose-500 font-bold uppercase">বকেয়া থাকবে</span>
                <div
                  className={`text-lg font-black ${
                    liveDue > 0 ? 'text-rose-600' : 'text-slate-400'
                  }`}
                >
                  ৳{liveDue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Paid Amount Input */}
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    বর্তমান পরিশোধিত পরিমাণ (টাকা) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                    className="w-full px-4 py-3 text-base font-black text-emerald-700 rounded-xl border-2 border-emerald-300 bg-emerald-50/30 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    required
                  />
                  <div className="flex items-center gap-2 mt-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(netPayable)}
                      className="text-emerald-700 hover:underline font-semibold"
                    >
                      সম্পূর্ণ পরিশোধ (৳{netPayable})
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setPaidAmount(Math.floor(netPayable / 2))}
                      className="text-slate-500 hover:underline"
                    >
                      অর্ধেক পরিশোধ
                    </button>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    পেমেন্ট মাধ্যম <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-3 text-sm font-semibold rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  >
                    <option value="CASH">ক্যাশ (Cash)</option>
                    <option value="BKASH">বিকাশ (bKash)</option>
                    <option value="NAGAD">নগদ (Nagad)</option>
                    <option value="ROCKET">রকেট (Rocket)</option>
                    <option value="BANK_TRANSFER">ব্যাংক ট্রান্সফার (Bank)</option>
                    <option value="OTHER">অন্যান্য (Other)</option>
                  </select>
                </div>
              </div>

              {/* Transaction ID if digital */}
              {paymentMethod !== 'CASH' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ট্রানজ্যাকশন আইডি (TrxID)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: 9J37D82KS"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মন্তব্য / রসিদ নোট
                </label>
                <input
                  type="text"
                  placeholder="প্রয়োজনে বিশেষ নোট লিখুন..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Send SMS Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-3 p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendSms}
                    onChange={(e) => setSendSms(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <FiSend className="w-3.5 h-3.5 text-emerald-700" />
                      অভিভাবকের মোবাইলে সাথে সাথে এসএমএস রসিদ পাঠান
                    </span>
                    <p className="text-slate-500 mt-0.5">
                      টাকা গ্রহণ সফল হলে অভিভাবকের নম্বরে মানি রসিদ নং ও টাকার পরিমাণ স্বয়ংক্রিয়ভাবে যাবে।
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t border-slate-100 pt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
              >
                রিসেট
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedStudent}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-all"
              >
                {submitting ? (
                  <>
                    <Loader size="sm" />
                    সংরক্ষণ হচ্ছে...
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="w-4 h-4" />
                    ফি আদায় সম্পন্ন করুন ও রসিদ তৈরি করুন
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Receipt Modal */}
      {showReceiptModal && createdReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Top Bar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl print:hidden">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <FiCheckCircle className="w-4 h-4" />
                ফি সফলভাবে গৃহীত হয়েছে!
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all"
                >
                  <FiPrinter className="w-3.5 h-3.5" />
                  রসিদ প্রিন্ট করুন
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-all"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Area */}
            <div className="p-6 sm:p-8 space-y-6 bg-white">
              {/* Header */}
              <div className="text-center border-b-2 border-dashed border-slate-200 pb-5">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {createdReceipt.institute.name}
                </h2>
                <p className="text-xs text-emerald-700 font-bold tracking-wider uppercase mt-0.5">
                  {createdReceipt.institute.nameEn} • {createdReceipt.institute.slogan}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {createdReceipt.institute.address} | হটলাইন: {createdReceipt.institute.phone}
                </p>
                <div className="mt-3 inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full uppercase tracking-widest">
                  মানি রসিদ (MONEY RECEIPT)
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-400 font-medium">রসিদ নং: </span>
                    <strong className="font-mono text-emerald-800 text-sm">
                      {createdReceipt.receipt.receiptNo}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">শিক্ষার্থী: </span>
                    <strong className="text-slate-800">
                      {createdReceipt.student.nameBn || createdReceipt.student.nameEn}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">স্টুডেন্ট আইডি: </span>
                    <span className="font-mono text-slate-700">{createdReceipt.student.studentId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">অভিভাবক: </span>
                    <span className="text-slate-700">{createdReceipt.student.guardianName || '-'}</span>
                  </div>
                </div>

                <div className="space-y-1 text-right">
                  <div>
                    <span className="text-slate-400 font-medium">তারিখ: </span>
                    <strong className="text-slate-800">
                      {new Date(createdReceipt.receipt.paymentDate).toLocaleDateString('bn-BD', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">ব্যাচ: </span>
                    <span className="text-slate-700">{createdReceipt.student.batchName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">পেমেন্ট মাধ্যম: </span>
                    <span className="font-bold text-slate-800">{createdReceipt.receipt.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5 pl-3">বিবরণ</th>
                      <th className="p-2.5 text-center">মাস</th>
                      <th className="p-2.5 text-right">নির্ধারিত</th>
                      <th className="p-2.5 text-right">ছাড়</th>
                      <th className="p-2.5 text-right pr-3">পরিশোধ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 pl-3 font-medium text-slate-800">
                        {createdReceipt.receipt.feeType === 'MONTHLY_FEE'
                          ? 'মাসিক টিউশন ফি'
                          : createdReceipt.receipt.feeType}
                      </td>
                      <td className="p-2.5 text-center text-slate-600">
                        {createdReceipt.receipt.feeMonth || '-'}
                      </td>
                      <td className="p-2.5 text-right font-medium text-slate-700">
                        ৳{createdReceipt.receipt.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-right text-emerald-600 font-medium">
                        ৳{createdReceipt.receipt.discount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-right pr-3 font-bold text-slate-900">
                        ৳{createdReceipt.receipt.paidAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                    <tr>
                      <td colSpan={4} className="p-2.5 text-right">
                        মোট আদায়কৃত টাকা:
                      </td>
                      <td className="p-2.5 text-right pr-3 text-emerald-700 text-sm">
                        ৳{createdReceipt.receipt.paidAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    {createdReceipt.receipt.dueAmount > 0 && (
                      <tr className="text-rose-600">
                        <td colSpan={4} className="p-2.5 text-right">
                          অবশিষ্ট বকেয়া:
                        </td>
                        <td className="p-2.5 text-right pr-3 text-sm">
                          ৳{createdReceipt.receipt.dueAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>

              {/* In words */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <span className="text-slate-400 font-medium">কথায়: </span>
                <strong className="text-slate-800">{createdReceipt.receipt.inWords}</strong>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 flex items-center justify-between print:hidden">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  আরেকটি ফি আদায় করুন
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/accounts')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all"
                >
                  ফি ওভারভিউতে ফিরে যান
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
