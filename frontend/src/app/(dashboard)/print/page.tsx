'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '../../../lib/api';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Loader';
import { formatCurrency, formatDate, toBengaliNumber } from '../../../lib/utils';
import toast from 'react-hot-toast';
import {
  FiPrinter,
  FiCreditCard,
  FiFileText,
  FiAward,
  FiCalendar,
  FiClock,
  FiDownload,
  FiRefreshCw,
  FiCheckCircle,
  FiPhone,
  FiUser,
  FiMapPin,
  FiDollarSign,
  FiScissors,
} from 'react-icons/fi';

type PrintDocType = 'id_card' | 'receipt' | 'result_card' | 'attendance' | 'routine';

function PrintCenterContent() {
  const searchParams = useSearchParams();
  const initialDoc = (searchParams.get('type') as PrintDocType) || 'id_card';

  const [activeDoc, setActiveDoc] = useState<PrintDocType>(initialDoc);
  const [isLoading, setIsLoading] = useState(false);

  // Metadata
  const [batches, setBatches] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [instituteInfo, setInstituteInfo] = useState<any>({
    institute_name: 'উত্তরণ স্টাডি কেয়ার',
    institute_name_en: 'Uttoron Study Care',
    institute_address: 'প্রধান শাখা, কাচারী রোড, ঢাকা',
    institute_phone: '01712345678',
    institute_email: 'info@uttoronstudycare.com',
    institute_motto: 'জ্ঞানে উত্তরণ, সাফল্যে ভবিষ্যৎ',
  });

  // Selected filters for document generation
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedReceiptId, setSelectedReceiptId] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [attMonth, setAttMonth] = useState<number>(new Date().getMonth() + 1);
  const [attYear, setAttYear] = useState<number>(new Date().getFullYear());

  // Generated Document Data State
  const [generatedData, setGeneratedData] = useState<any | null>(null);

  // Load common metadata on mount
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const [batchRes, examRes, setRes, feesRes] = await Promise.all([
          api.get('/batches?limit=100'),
          api.get('/exams?limit=100'),
          api.get('/settings/dictionary'),
          api.get('/accounts/fees?limit=50'),
        ]);

        const batchList = batchRes.data?.data || batchRes.data || [];
        setBatches(batchList);
        if (batchList.length > 0) {
          setSelectedBatchId(batchList[0].id);
        }

        const examList = examRes.data?.data || examRes.data || [];
        setExams(examList);
        if (examList.length > 0) {
          setSelectedExamId(examList[0].id);
        }

        if (setRes.data) {
          setInstituteInfo((prev: any) => ({ ...prev, ...setRes.data }));
        }

        const feeList = feesRes.data?.data || feesRes.data?.collections || feesRes.data || [];
        setReceipts(feeList);
        if (feeList.length > 0) {
          setSelectedReceiptId(feeList[0].id);
        }
      } catch (err) {
        console.error('Metadata error:', err);
      }
    }
    fetchMetadata();
  }, []);

  // Fetch Students when batch changes
  useEffect(() => {
    async function fetchBatchStudents() {
      if (!selectedBatchId) return;
      try {
        const res = await api.get('/reports/students', {
          params: { batchId: selectedBatchId, status: 'ACTIVE' },
        });
        const list = res.data?.students || [];
        setStudents(list);
        if (list.length > 0) {
          setSelectedStudentId(list[0].id);
        }
      } catch (err) {
        console.error('Batch students error:', err);
      }
    }
    fetchBatchStudents();
  }, [selectedBatchId]);

  // Generate / Load Active Document
  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeDoc === 'id_card') {
        const res = await api.get('/reports/students', {
          params: {
            batchId: selectedBatchId !== 'ALL' ? selectedBatchId : undefined,
            status: 'ACTIVE',
          },
        });
        let list = res.data?.students || [];
        if (selectedStudentId && selectedStudentId !== 'ALL') {
          list = list.filter((s: any) => s.id === selectedStudentId);
        }
        setGeneratedData({ students: list });
      } else if (activeDoc === 'receipt') {
        if (!selectedReceiptId) {
          setGeneratedData(null);
          return;
        }
        const res = await api.get(`/accounts/fees/${selectedReceiptId}/receipt`);
        setGeneratedData(res.data);
      } else if (activeDoc === 'result_card') {
        if (!selectedExamId) {
          setGeneratedData(null);
          return;
        }
        const res = await api.get('/reports/exam-results', {
          params: { examId: selectedExamId },
        });
        let merits = res.data?.meritList || [];
        if (selectedStudentId && selectedStudentId !== 'ALL') {
          merits = merits.filter((m: any) => m.studentId === selectedStudentId || m.markId === selectedStudentId);
        }
        setGeneratedData({ exam: res.data?.exam, meritList: merits });
      } else if (activeDoc === 'attendance') {
        if (!selectedBatchId) {
          setGeneratedData(null);
          return;
        }
        const res = await api.get('/reports/attendance', {
          params: { batchId: selectedBatchId, month: attMonth, year: attYear },
        });
        setGeneratedData(res.data);
      } else if (activeDoc === 'routine') {
        if (!selectedBatchId) {
          setGeneratedData(null);
          return;
        }
        const res = await api.get(`/routine/batch/${selectedBatchId}`);
        const batchInfo = batches.find((b) => b.id === selectedBatchId);
        setGeneratedData({ batch: batchInfo, slots: res.data || [] });
      }
    } catch (error) {
      console.error('Document generation error:', error);
      toast.error('ডকুমেন্ট ডাটা লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  }, [
    activeDoc,
    selectedBatchId,
    selectedStudentId,
    selectedReceiptId,
    selectedExamId,
    attMonth,
    attYear,
    batches,
  ]);

  useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  // Trigger browser print dialog
  const handlePrint = () => {
    window.print();
  };

  const monthsBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Screen Header & Document Selector (Hidden on Print) */}
      <div className="no-print space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <FiPrinter className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                প্রিন্ট ও ডকুমেন্ট হাব (Print & PDF Center)
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              অফিশিয়াল ছাত্র আইডি কার্ড, মানি রসিদ, রেজাল্ট কার্ড, হাজিরা রেজিস্টার ও সাপ্তাহিক রুটিনের প্রিন্ট-রেডি ফরম্যাট
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handlePrint}
            className="flex items-center gap-2 shadow-md shadow-indigo-600/20"
          >
            <FiPrinter className="w-4 h-4" />
            প্রিন্ট / PDF সেভ করুন
          </Button>
        </div>

        {/* Document Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
          {[
            { key: 'id_card', label: 'ছাত্র আইডি কার্ড', icon: <FiCreditCard className="w-4 h-4" /> },
            { key: 'receipt', label: 'মানি রসিদ (২ কপি)', icon: <FiFileText className="w-4 h-4" /> },
            { key: 'result_card', label: 'ব্যক্তিগত রেজাল্ট কার্ড', icon: <FiAward className="w-4 h-4" /> },
            { key: 'attendance', label: 'হাজিরা রেজিস্টার শিট', icon: <FiCalendar className="w-4 h-4" /> },
            { key: 'routine', label: 'সাপ্তাহিক ক্লাস রুটিন', icon: <FiClock className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveDoc(tab.key as PrintDocType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeDoc === tab.key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Filter Controls */}
        <Card className="border-slate-200">
          <CardBody className="p-4 flex flex-wrap items-center gap-3">
            {/* 1. ID Card Controls */}
            {activeDoc === 'id_card' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">ব্যাচ:</span>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="ALL">সকল ব্যাচের শিক্ষার্থী</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">নির্দিষ্ট শিক্ষার্থী:</span>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="ALL">ব্যাচের সকল শিক্ষার্থী</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.nameBn || s.nameEn} ({s.studentId})</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* 2. Receipt Controls */}
            {activeDoc === 'receipt' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">রসিদ নির্বাচন:</span>
                <select
                  value={selectedReceiptId}
                  onChange={(e) => setSelectedReceiptId(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 min-w-[280px]"
                >
                  {receipts.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.receiptNo} - {r.student?.nameBn || r.student?.nameEn || r.studentName} (৳{r.paidAmount})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 3. Result Card Controls */}
            {activeDoc === 'result_card' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">পরীক্ষা:</span>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 min-w-[240px]"
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.subject?.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">শিক্ষার্থী:</span>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="ALL">সকল পরীক্ষার্থী</option>
                    {generatedData?.meritList?.map((m: any) => (
                      <option key={m.studentId} value={m.studentId}>
                        {m.nameBn || m.nameEn} (রোল: {m.rollNumber || '-'})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* 4. Attendance Controls */}
            {activeDoc === 'attendance' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">ব্যাচ:</span>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">মাস:</span>
                  <select
                    value={attMonth}
                    onChange={(e) => setAttMonth(parseInt(e.target.value, 10))}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    {monthsBn.map((m, idx) => (
                      <option key={idx} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">বছর:</span>
                  <select
                    value={attYear}
                    onChange={(e) => setAttYear(parseInt(e.target.value, 10))}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>{toBengaliNumber(y)}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* 5. Routine Controls */}
            {activeDoc === 'routine' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">ব্যাচ:</span>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerate}
              disabled={isLoading}
              className="ml-auto"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              রিলোড
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" className="text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500 animate-pulse">
            প্রিন্ট ডকুমেন্ট প্রস্তুত হচ্ছে...
          </p>
        </div>
      ) : (
        <div className="print-content">
          {/* ========================================================
              DOCUMENT 1: STUDENT ID CARDS (STANDARD PVC SIZE)
             ======================================================== */}
          {activeDoc === 'id_card' && generatedData?.students && (
            <div className="space-y-6">
              <div className="no-print bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
                <span className="font-semibold">
                  মোট {toBengaliNumber(generatedData.students.length)}টি ছাত্র আইডি কার্ড প্রিন্ট করার জন্য প্রস্তুত।
                </span>
                <span className="text-slate-500">A4 সাইজে প্রতিটি পেজে ৪টি কার্ড সুন্দরভাবে প্রিন্ট হবে।</span>
              </div>

              {/* Grid of ID Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:m-0">
                {generatedData.students.map((student: any) => (
                  <div
                    key={student.id}
                    className="break-inside-avoid border-2 border-indigo-900 rounded-2xl overflow-hidden bg-white shadow-md print:shadow-none w-full max-w-md mx-auto flex flex-col justify-between"
                    style={{ minHeight: '340px' }}
                  >
                    {/* ID Card Header */}
                    <div className="bg-indigo-900 text-white p-3.5 text-center relative">
                      <h3 className="text-sm font-black tracking-wide uppercase">
                        {instituteInfo.institute_name}
                      </h3>
                      <p className="text-[10px] text-indigo-200">
                        {instituteInfo.institute_motto}
                      </p>
                      <span className="mt-1 inline-block px-2.5 py-0.5 bg-amber-400 text-slate-900 font-extrabold text-[9px] rounded-full uppercase tracking-wider">
                        STUDENT ID CARD
                      </span>
                    </div>

                    {/* ID Card Body */}
                    <div className="p-4 flex gap-4 items-center">
                      {/* Photo / Avatar */}
                      <div className="w-24 h-28 rounded-xl border-2 border-slate-300 bg-slate-100 overflow-hidden flex flex-col items-center justify-center shrink-0">
                        {student.photo ? (
                          <img src={student.photo} alt={student.nameEn} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-700 font-black text-2xl">
                            {student.nameEn?.charAt(0).toUpperCase() || 'S'}
                          </div>
                        )}
                      </div>

                      {/* Info Details */}
                      <div className="space-y-1 text-xs text-slate-800 flex-1 min-w-0">
                        <p className="font-black text-sm text-indigo-900 truncate">
                          {student.nameBn || student.nameEn}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium truncate">
                          {student.nameEn}
                        </p>
                        <div className="pt-1 space-y-0.5 text-[11px]">
                          <p>
                            <span className="font-bold text-slate-600">আইডি নং:</span>{' '}
                            <span className="font-mono font-black text-indigo-600">{student.studentId}</span>
                          </p>
                          <p>
                            <span className="font-bold text-slate-600">রোল নং:</span>{' '}
                            <span className="font-bold">{student.rollNumber ? toBengaliNumber(student.rollNumber) : '-'}</span>
                          </p>
                          <p>
                            <span className="font-bold text-slate-600">শ্রেণি:</span>{' '}
                            <span>{student.classLevel}</span>
                          </p>
                          <p className="truncate">
                            <span className="font-bold text-slate-600">ব্যাচ:</span>{' '}
                            <span className="text-[10px]">{student.batchName}</span>
                          </p>
                          <p>
                            <span className="font-bold text-slate-600">জরুরি ফোন:</span>{' '}
                            <span className="font-mono">{student.guardianPhone || student.phone || '-'}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ID Card Footer / Signatures */}
                    <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
                      <div>
                        <p className="font-mono text-[8px] text-slate-400">VALID TILL: DEC 2026</p>
                        <p className="text-[8px]">{instituteInfo.institute_phone}</p>
                      </div>
                      <div className="text-center">
                        <div className="w-20 border-b border-slate-400 mb-0.5" />
                        <span className="font-bold text-slate-700">পরিচালক স্বাক্ষর</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              DOCUMENT 2: DUAL-COPY MONEY RECEIPT (OFFICE & STUDENT)
             ======================================================== */}
          {activeDoc === 'receipt' && generatedData && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="break-inside-avoid border-2 border-slate-800 p-6 rounded-2xl bg-white space-y-6">
                {/* 1. Student Copy */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">{instituteInfo.institute_name}</h2>
                      <p className="text-xs text-slate-600">{instituteInfo.institute_address}</p>
                      <p className="text-xs text-slate-500">হটলাইন: {instituteInfo.institute_phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-md">
                        মানি রসিদ (গ্রাহক কপি)
                      </span>
                      <p className="font-mono font-bold text-xs text-indigo-700 mt-1">
                        রসিদ নং: {generatedData.receiptNo}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        তারিখ: {formatDate(generatedData.paymentDate, 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <p><span className="font-bold">শিক্ষার্থীর নাম:</span> {generatedData.student?.nameBn || generatedData.student?.nameEn}</p>
                    <p><span className="font-bold">স্টুডেন্ট আইডি:</span> <span className="font-mono">{generatedData.student?.studentId}</span></p>
                    <p><span className="font-bold">শ্রেণি ও ব্যাচ:</span> {generatedData.student?.classLevel} - {generatedData.student?.batchName || 'নিয়মিত'}</p>
                    <p><span className="font-bold">পেমেন্ট মেথড:</span> {generatedData.paymentMethod}</p>
                  </div>

                  {/* Fee Table */}
                  <table className="w-full text-xs border border-slate-300">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-2 border border-slate-300 text-left">ফি-এর বিবরণ / মাস</th>
                        <th className="p-2 border border-slate-300 text-right">নির্ধারিত টাকা</th>
                        <th className="p-2 border border-slate-300 text-right">ছাড়</th>
                        <th className="p-2 border border-slate-300 text-right">আদায়কৃত টাকা</th>
                        <th className="p-2 border border-slate-300 text-right">অবশিষ্ট বকেয়া</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border border-slate-300 font-semibold">{generatedData.feeMonth || generatedData.feeType}</td>
                        <td className="p-2 border border-slate-300 text-right">{formatCurrency(generatedData.amount)}</td>
                        <td className="p-2 border border-slate-300 text-right text-red-500">{formatCurrency(generatedData.discount || 0)}</td>
                        <td className="p-2 border border-slate-300 text-right font-black text-slate-900">{formatCurrency(generatedData.paidAmount)}</td>
                        <td className="p-2 border border-slate-300 text-right text-red-600 font-bold">{formatCurrency(generatedData.dueAmount || 0)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Bottom Signatures */}
                  <div className="pt-8 flex justify-between items-end text-xs text-slate-500">
                    <div>
                      <p className="text-[10px] text-slate-400">ধন্যবাদ, নিয়মিত পড়াশোনা করুন।</p>
                    </div>
                    <div className="text-center">
                      <div className="w-28 border-b border-slate-400 mb-1" />
                      <span>আদায়কারীর স্বাক্ষর</span>
                    </div>
                  </div>
                </div>

                {/* Scissor Cut Line */}
                <div className="relative py-2 border-t-2 border-dashed border-slate-400 text-center">
                  <span className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-white px-2 text-slate-400 text-xs flex items-center gap-1 font-mono">
                    <FiScissors className="w-3.5 h-3.5" /> এখান থেকে কাটুন
                  </span>
                </div>

                {/* 2. Office Copy */}
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">{instituteInfo.institute_name}</h2>
                      <p className="text-xs text-slate-600">অফিস রেকর্ড কপি</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-indigo-900 text-white font-black text-xs uppercase tracking-wider rounded-md">
                        অফিস কপি
                      </span>
                      <p className="font-mono font-bold text-xs text-indigo-700 mt-1">
                        রসিদ নং: {generatedData.receiptNo}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        তারিখ: {formatDate(generatedData.paymentDate, 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <p><span className="font-bold">শিক্ষার্থীর নাম:</span> {generatedData.student?.nameBn || generatedData.student?.nameEn}</p>
                    <p><span className="font-bold">স্টুডেন্ট আইডি:</span> <span className="font-mono">{generatedData.student?.studentId}</span></p>
                    <p><span className="font-bold">আদায়কৃত অর্থ:</span> <span className="font-black text-emerald-700">{formatCurrency(generatedData.paidAmount)}</span></p>
                    <p><span className="font-bold">বকেয়া:</span> {formatCurrency(generatedData.dueAmount || 0)}</p>
                  </div>

                  <div className="pt-6 flex justify-between items-end text-xs text-slate-500">
                    <span className="text-[10px] text-slate-400">রেকর্ড ভেরিফাইড বাই সিস্টেম</span>
                    <div className="text-center">
                      <div className="w-28 border-b border-slate-400 mb-1" />
                      <span>অফিস সহকারী স্বাক্ষর</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              DOCUMENT 3: ACADEMIC RESULT CARD / PROGRESS REPORT
             ======================================================== */}
          {activeDoc === 'result_card' && generatedData?.meritList && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {generatedData.meritList.map((res: any) => (
                <div
                  key={res.studentId}
                  className="break-inside-avoid border-2 border-indigo-950 p-8 rounded-3xl bg-white space-y-6 shadow-sm print:shadow-none"
                >
                  {/* Result Header */}
                  <div className="text-center pb-4 border-b-2 border-indigo-900 space-y-1">
                    <h2 className="text-2xl font-black text-slate-900">{instituteInfo.institute_name}</h2>
                    <p className="text-xs text-slate-600">{instituteInfo.institute_address}</p>
                    <div className="pt-2">
                      <span className="inline-block px-4 py-1 bg-indigo-900 text-white font-black text-xs uppercase tracking-wider rounded-full">
                        একাডেমিক প্রগ্রেস ও রেজাল্ট কার্ড
                      </span>
                    </div>
                  </div>

                  {/* Student & Exam Details */}
                  <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p><span className="font-bold text-slate-600">শিক্ষার্থীর নাম:</span> <span className="font-bold text-slate-900">{res.nameBn || res.nameEn}</span></p>
                    <p><span className="font-bold text-slate-600">স্টুডেন্ট আইডি:</span> <span className="font-mono">{res.studentId}</span></p>
                    <p><span className="font-bold text-slate-600">রোল নম্বর:</span> <span className="font-bold text-indigo-600">{res.rollNumber ? toBengaliNumber(res.rollNumber) : '-'}</span></p>
                    <p><span className="font-bold text-slate-600">পরীক্ষার নাম:</span> <span className="font-bold">{generatedData.exam?.name}</span></p>
                  </div>

                  {/* Marks Table */}
                  <table className="w-full text-xs border border-slate-300">
                    <thead className="bg-indigo-50 font-bold text-indigo-900">
                      <tr>
                        <th className="p-2.5 border border-slate-300 text-left">বিষয়</th>
                        <th className="p-2.5 border border-slate-300 text-center">পূর্ণমান</th>
                        <th className="p-2.5 border border-slate-300 text-center">প্রাপ্ত নম্বর</th>
                        <th className="p-2.5 border border-slate-300 text-center">শতকরা (%)</th>
                        <th className="p-2.5 border border-slate-300 text-center">লেটার গ্রেড</th>
                        <th className="p-2.5 border border-slate-300 text-center">ফলাফল</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2.5 border border-slate-300 font-bold">{generatedData.exam?.subject?.name || 'বিষয়'}</td>
                        <td className="p-2.5 border border-slate-300 text-center">{toBengaliNumber(res.fullMarks)}</td>
                        <td className="p-2.5 border border-slate-300 text-center font-black text-indigo-700 text-sm">{toBengaliNumber(res.obtainedMarks)}</td>
                        <td className="p-2.5 border border-slate-300 text-center font-bold">{toBengaliNumber(res.percentage)}%</td>
                        <td className="p-2.5 border border-slate-300 text-center font-black text-sm">{res.grade}</td>
                        <td className="p-2.5 border border-slate-300 text-center font-bold">
                          {res.isPassed ? (
                            <span className="text-emerald-600">উত্তীর্ণ (Passed)</span>
                          ) : (
                            <span className="text-red-500">অনুত্তীর্ণ (Failed)</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Summary Box */}
                  <div className="grid grid-cols-3 gap-3 text-center p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block">মেধা স্থান (Rank)</span>
                      <span className="text-base font-black text-indigo-700">{toBengaliNumber(res.rank)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">প্রাপ্ত গ্রেড</span>
                      <span className="text-base font-black text-slate-900">{res.grade}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">মন্তব্য</span>
                      <span className="text-xs font-bold text-slate-700">
                        {res.percentage >= 80 ? 'অসাধারণ সাফল্য' : res.percentage >= 60 ? 'ভালো অগ্রগতি' : 'আরও যত্ন প্রয়োজন'}
                      </span>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="pt-12 flex justify-between items-end text-xs text-slate-600">
                    <div className="text-center">
                      <div className="w-28 border-b border-slate-400 mb-1" />
                      <span>শ্রেণি শিক্ষক</span>
                    </div>
                    <div className="text-center">
                      <div className="w-28 border-b border-slate-400 mb-1" />
                      <span>পরীক্ষা নিয়ন্ত্রক</span>
                    </div>
                    <div className="text-center">
                      <div className="w-28 border-b border-slate-400 mb-1" />
                      <span className="font-bold text-slate-900">পরিচালক / সমন্বয়ক</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========================================================
              DOCUMENT 4: MONTHLY ATTENDANCE REGISTER SHEET
             ======================================================== */}
          {activeDoc === 'attendance' && generatedData && (
            <div className="space-y-4 max-w-5xl mx-auto">
              <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
                <h2 className="text-xl font-black text-slate-900">{instituteInfo.institute_name}</h2>
                <h3 className="text-sm font-bold text-indigo-900">
                  মাসিক ছাত্র হাজিরা রেজিস্টার বিবরণী
                </h3>
                <p className="text-xs text-slate-600">
                  ব্যাচ: {generatedData.batch?.name} • মাস: {monthsBn[attMonth - 1]}, {toBengaliNumber(attYear)}
                </p>
              </div>

              <table className="w-full text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold">
                  <tr>
                    <th className="p-2 border border-slate-300 w-12 text-center">রোল</th>
                    <th className="p-2 border border-slate-300 text-left min-w-[120px]">শিক্ষার্থীর নাম</th>
                    {generatedData.workingDays?.map((d: number) => (
                      <th key={d} className="p-1 border border-slate-300 text-center w-6 text-[10px]">
                        {toBengaliNumber(d)}
                      </th>
                    ))}
                    <th className="p-2 border border-slate-300 text-center bg-emerald-50">উপস্থিত</th>
                    <th className="p-2 border border-slate-300 text-center bg-red-50">অনুপস্থিত</th>
                    <th className="p-2 border border-slate-300 text-right bg-indigo-50">হার (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedData.students?.map((s: any) => (
                    <tr key={s.studentId}>
                      <td className="p-2 border border-slate-300 text-center font-bold text-indigo-700">
                        {s.rollNumber ? toBengaliNumber(s.rollNumber) : '-'}
                      </td>
                      <td className="p-2 border border-slate-300 font-semibold">{s.nameBn || s.nameEn}</td>
                      {generatedData.workingDays?.map((d: number) => {
                        const st = s.dailyStatus[d];
                        return (
                          <td key={d} className="p-1 border border-slate-300 text-center text-[10px]">
                            {st === 'PRESENT' ? 'P' : st === 'LATE' ? 'L' : st === 'ABSENT' ? 'A' : '-'}
                          </td>
                        );
                      })}
                      <td className="p-2 border border-slate-300 text-center font-bold text-emerald-700">
                        {toBengaliNumber(s.presentCount + s.lateCount)}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-bold text-red-600">
                        {toBengaliNumber(s.absentCount)}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-black text-indigo-700">
                        {toBengaliNumber(s.attendanceRate)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-8 flex justify-between items-end text-xs text-slate-500">
                <span>হাজিরা গ্রহণকারী শিক্ষকের স্বাক্ষর: ___________________</span>
                <span>অধ্যক্ষ / পরিচালক স্বাক্ষর: ___________________</span>
              </div>
            </div>
          )}

          {/* ========================================================
              DOCUMENT 5: WEEKLY CLASS ROUTINE PRINT SHEET
             ======================================================== */}
          {activeDoc === 'routine' && generatedData && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
                <h2 className="text-xl font-black text-slate-900">{instituteInfo.institute_name}</h2>
                <h3 className="text-sm font-bold text-indigo-900">
                  সাপ্তাহিক অ্যাকাডেমিক ক্লাস রুটিন
                </h3>
                <p className="text-xs text-slate-600">
                  ব্যাচ: {generatedData.batch?.name || 'চলতি ব্যাচ'} ({generatedData.batch?.classLevel})
                </p>
              </div>

              <table className="w-full text-xs border border-slate-300">
                <thead className="bg-indigo-50 font-bold text-indigo-900">
                  <tr>
                    <th className="p-2.5 border border-slate-300 text-left">বার (Day)</th>
                    <th className="p-2.5 border border-slate-300 text-left">বিষয় (Subject)</th>
                    <th className="p-2.5 border border-slate-300 text-center">সময়সূচী (Time)</th>
                    <th className="p-2.5 border border-slate-300 text-center">রুম নং</th>
                    <th className="p-2.5 border border-slate-300 text-left">শিক্ষক (Teacher)</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedData.slots?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        এই ব্যাচের কোনো রুটিন এখনও তৈরি করা হয়নি
                      </td>
                    </tr>
                  ) : (
                    generatedData.slots.map((slot: any) => (
                      <tr key={slot.id} className="hover:bg-slate-50">
                        <td className="p-2.5 border border-slate-300 font-bold">{slot.day}</td>
                        <td className="p-2.5 border border-slate-300 font-semibold">{slot.subject?.name || 'বিষয়'}</td>
                        <td className="p-2.5 border border-slate-300 text-center font-mono font-medium text-indigo-700">
                          {slot.startTime} - {slot.endTime}
                        </td>
                        <td className="p-2.5 border border-slate-300 text-center">{slot.roomNo || '২০১'}</td>
                        <td className="p-2.5 border border-slate-300">{slot.teacher?.nameBn || slot.teacher?.nameEn || 'নির্ধারিত শিক্ষক'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="pt-8 flex justify-between items-end text-xs text-slate-500">
                <span>রুটিন প্রণয়নের তারিখ: {formatDate(new Date(), 'dd/MM/yyyy')}</span>
                <span>পরিচালক / কো-অর্ডিনেটর স্বাক্ষর: ___________________</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PrintCenterPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" className="text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500 animate-pulse">
            প্রিন্ট হাব প্রস্তুত হচ্ছে...
          </p>
        </div>
      }
    >
      <PrintCenterContent />
    </Suspense>
  );
}
