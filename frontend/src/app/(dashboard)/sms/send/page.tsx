'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiSend,
  FiUser,
  FiUsers,
  FiPhone,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiSmartphone,
  FiInfo,
} from 'react-icons/fi';
import { Loader } from '@/components/ui/Loader';

interface BatchItem {
  id: string;
  name: string;
  classLevel: string;
  _count?: { batchStudents: number };
}

interface TemplateItem {
  id: string;
  name: string;
  body: string;
}

export default function SendSmsPage() {
  const [activeTab, setActiveTab] = useState<'individual' | 'batch' | 'custom'>('individual');

  // Form States
  const [phone, setPhone] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [customPhones, setCustomPhones] = useState('');
  const [message, setMessage] = useState('');

  // Dropdown Data
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [sending, setSending] = useState(false);

  // Student Search
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);

  // Character calculation
  const isBangla = /[\u0980-\u09FF]/.test(message);
  const charLimit = isBangla ? 70 : 160;
  const multiLimit = isBangla ? 67 : 153;
  const charCount = message.length;
  const smsParts =
    charCount === 0
      ? 1
      : charCount <= charLimit
      ? 1
      : Math.ceil(charCount / multiLimit);

  // Fetch batches & templates
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [batchRes, tempRes] = await Promise.all([
          api.get('/batches?limit=100').catch(() => ({ data: { data: [] } })),
          api.get('/sms/templates').catch(() => ({ data: [] })),
        ]);
        if (batchRes.data?.data) setBatches(batchRes.data.data);
        if (tempRes.data) setTemplates(Array.isArray(tempRes.data) ? tempRes.data : []);
      } catch {
        // silent
      }
    };
    fetchData();
  }, []);

  // Search student
  useEffect(() => {
    if (!studentSearch.trim() || studentSearch.length < 2) {
      setStudentsList([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearchingStudents(true);
        const res = await api.get(`/students?search=${encodeURIComponent(studentSearch.trim())}&limit=6`);
        if (res.data?.data) {
          setStudentsList(res.data.data);
        }
      } catch {
        // ignore
      } finally {
        setSearchingStudents(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  const handleSelectStudent = (stu: any) => {
    setPhone(stu.guardianPhone || stu.phone || '');
    setSelectedStudentName(stu.nameBn || stu.nameEn);
    setStudentSearch('');
    setStudentsList([]);
  };

  const handleApplyTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    if (!templateId) return;
    const t = templates.find((item) => item.id === templateId);
    if (t) {
      setMessage(t.body);
    }
  };

  // Parse custom phone numbers count
  const parsedCustomPhones = React.useMemo(() => {
    return customPhones
      .split(/[\n,;]+/)
      .map((p) => p.trim().replace(/[^0-9]/g, ''))
      .filter((p) => p.length >= 11);
  }, [customPhones]);

  // Handle Send Submit
  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('অনুগ্রহ করে বার্তার টেক্সট লিখুন');
      return;
    }

    try {
      setSending(true);

      if (activeTab === 'individual') {
        if (!phone.trim() || phone.length < 11) {
          toast.error('সঠিক ১১-সংখ্যার মোবাইল নম্বর দিন');
          return;
        }
        const res = await api.post('/sms/send', {
          phone: phone.trim(),
          message: message.trim(),
          type: 'INDIVIDUAL',
        });
        if (res.data?.success) {
          toast.success('এসএমএস সফলভাবে পাঠানো হয়েছে!');
          setPhone('');
          setMessage('');
          setSelectedStudentName(null);
        } else {
          toast.error(res.data?.error || 'এসএমএস প্রেরণ ব্যর্থ হয়েছে');
        }
      } else if (activeTab === 'batch') {
        if (!selectedBatch) {
          toast.error('একটি ব্যাচ নির্বাচন করুন');
          return;
        }
        const res = await api.post(`/sms/send-batch/${selectedBatch}`, {
          batchId: selectedBatch,
          message: message.trim(),
        });
        toast.success(res.data?.message || 'ব্যাচের অভিভাবকদের কাছে বার্তা পাঠানো সম্পন্ন হয়েছে');
        setMessage('');
      } else if (activeTab === 'custom') {
        if (parsedCustomPhones.length === 0) {
          toast.error('কমপক্ষে একটি সঠিক মোবাইল নম্বর লিখুন');
          return;
        }
        const res = await api.post('/sms/send-custom', {
          phones: parsedCustomPhones,
          message: message.trim(),
        });
        toast.success(res.data?.message || 'কাস্টম নম্বরে বার্তা প্রেরণ সম্পন্ন হয়েছে');
        setCustomPhones('');
        setMessage('');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'এসএমএস প্রেরণ করতে ব্যর্থ হয়েছে');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/sms"
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-all shadow-xs"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              এসএমএস পাঠান (Send SMS)
            </h1>
            <p className="text-sm text-slate-500">
              ব্যক্তিগত বার্তা, পুরো ব্যাচে নোটিফিকেশন অথবা কাস্টম নম্বরে এসএমএস প্রেরণ করুন
            </p>
          </div>
        </div>

        <Link
          href="/sms/history"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3.5 py-2 rounded-xl"
        >
          ডেলিভারি হিস্ট্রি দেখুন
        </Link>
      </div>

      {/* Main Grid: Form on Left (2 cols), Device Preview on Right (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {/* Target Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              প্রাপকের ধরণ নির্বাচন করুন
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('individual')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'individual'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FiUser className="w-3.5 h-3.5" />
                একক প্রাপক
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('batch')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'batch'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FiUsers className="w-3.5 h-3.5" />
                সম্পূর্ণ ব্যাচ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'custom'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FiPhone className="w-3.5 h-3.5" />
                কাস্টম নম্বর
              </button>
            </div>
          </div>

          <form onSubmit={handleSendSubmit} className="space-y-5">
            {/* TAB 1: INDIVIDUAL */}
            {activeTab === 'individual' && (
              <div className="space-y-3">
                {/* Search student to fill guardian phone */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    শিক্ষার্থী খুঁজে নম্বর নিন (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="নাম বা আইডি লিখলে অভিভাবকের নম্বর চলে আসবে..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  {searchingStudents && (
                    <div className="absolute right-3 top-8">
                      <Loader size="sm" />
                    </div>
                  )}

                  {/* Student Search Dropdown */}
                  {studentsList.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {studentsList.map((stu) => (
                        <button
                          key={stu.id}
                          type="button"
                          onClick={() => handleSelectStudent(stu)}
                          className="w-full p-2.5 text-left text-xs hover:bg-indigo-50 flex items-center justify-between"
                        >
                          <div>
                            <strong className="text-slate-800">{stu.nameBn || stu.nameEn}</strong>
                            <span className="text-slate-400 font-mono ml-2">({stu.studentId})</span>
                          </div>
                          <span className="font-mono text-indigo-700 font-bold">
                            {stu.guardianPhone || 'নম্বর নেই'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Student Tag */}
                {selectedStudentName && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-800 text-xs rounded-lg font-semibold">
                    <span>নির্বাচিত: {selectedStudentName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentName(null);
                        setPhone('');
                      }}
                      className="text-indigo-400 hover:text-indigo-900 ml-1"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Phone Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="017xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>
            )}

            {/* TAB 2: BATCH */}
            {activeTab === 'batch' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ব্যাচ নির্বাচন করুন <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                >
                  <option value="">-- ব্যাচ নির্বাচন করুন --</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.classLevel})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1.5">
                  এই ব্যাচের অন্তর্ভুক্ত সকল সক্রিয় শিক্ষার্থীর অভিভাবকদের নম্বরে বার্তা প্রেরিত হবে।
                </p>
              </div>
            )}

            {/* TAB 3: CUSTOM NUMBERS */}
            {activeTab === 'custom' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    মোবাইল নম্বরসমূহ (কমা বা নতুন লাইন দিয়ে লিখুন) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs font-bold text-indigo-700">
                    বৈধ নম্বর: {parsedCustomPhones.length} টি
                  </span>
                </div>
                <textarea
                  rows={3}
                  placeholder="01711111111, 01822222222, 01933333333..."
                  value={customPhones}
                  onChange={(e) => setCustomPhones(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
            )}

            {/* Template Selector */}
            {templates.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  টেমপ্লেট থেকে পূরণ করুন (ঐচ্ছিক)
                </label>
                <select
                  onChange={handleApplyTemplate}
                  defaultValue=""
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden transition-all"
                >
                  <option value="">-- টেমপ্লেট নির্বাচন করুন --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Message Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  বার্তার টেক্সট লিখুন <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-semibold text-slate-500">
                  এনকোডিং: <strong>{isBangla ? 'বাংলা (ইউনিকোড)' : 'ইংরেজি (GSM)'}</strong>
                </span>
              </div>
              <textarea
                rows={5}
                placeholder="আপনার কাঙ্ক্ষিত নোটিফিকেশন বা বার্তা লিখুন..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none leading-relaxed"
                required
              />

              {/* Character & Part Breakdown */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                <div className="text-slate-600">
                  মোট অক্ষর: <strong className="text-slate-900">{charCount}</strong> /{' '}
                  {isBangla ? '৭০ (১ম পার্ট)' : '১৬০ (১ম পার্ট)'}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-indigo-700 bg-indigo-100/60 px-2.5 py-1 rounded-md">
                    এসএমএস পার্ট: {smsParts} টি
                  </span>
                  <span className="text-slate-400">
                    আনুমানিক খরচ: ~৳{(smsParts * 0.45).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader size="sm" /> বার্তা পাঠানো হচ্ছে...
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4" /> বার্তা প্রেরণ করুন
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Mobile Simulator Preview */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 p-5 rounded-3xl shadow-xl border-4 border-slate-800 text-white relative max-w-sm mx-auto">
            {/* Phone Notch */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-900"></div>
            </div>

            {/* Phone Header */}
            <div className="text-center border-b border-slate-800 pb-3 mb-4">
              <div className="text-xs font-bold text-slate-300">UTTORON</div>
              <div className="text-[10px] text-slate-500">মেসেজ প্রিভিউ</div>
            </div>

            {/* Message Bubble Area */}
            <div className="min-h-[220px] flex flex-col justify-end p-2 space-y-2">
              {message.trim() ? (
                <div className="bg-indigo-600 text-white p-3.5 rounded-2xl rounded-br-xs text-xs leading-relaxed shadow-md animate-in fade-in duration-200">
                  <p className="whitespace-pre-wrap">{message}</p>
                  <div className="text-[9px] text-indigo-200 text-right mt-1.5 flex items-center justify-end gap-1">
                    <span>এখন</span>
                    <FiCheckCircle className="w-2.5 h-2.5" />
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-600 text-xs py-12">
                  <FiSmartphone className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                  বার্তা লিখলে এখানে মোবাইল প্রিভিউ দেখতে পাবেন
                </div>
              )}
            </div>

            {/* Bottom Bar */}
            <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-4"></div>
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-xs text-indigo-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <FiInfo className="w-4 h-4 text-indigo-700" />
              এসএমএস সংক্রান্ত নিয়মাবলী
            </div>
            <ul className="list-disc list-inside text-indigo-800/80 space-y-1 text-[11px]">
              <li>বাংলা টেক্সটের জন্য প্রথম পার্ট ৭০ অক্ষর, পরবর্তী প্রতি পার্ট ৬৭ অক্ষর।</li>
              <li>ইংরেজি টেক্সটের জন্য প্রথম পার্ট ১৬০ অক্ষর, পরবর্তী প্রতি পার্ট ১৫৩ অক্ষর।</li>
              <li>মেসেজের শুরুতে স্বয়ংক্রিয়ভাবে প্রতিষ্ঠানের নাম রাখা বাঞ্ছনীয়।</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
