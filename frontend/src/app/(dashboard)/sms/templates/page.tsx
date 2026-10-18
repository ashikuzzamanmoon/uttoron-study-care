'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiFileText,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiCheck,
  FiX,
  FiTag,
  FiCopy,
} from 'react-icons/fi';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';

interface TemplateItem {
  id: string;
  name: string;
  body: string;
  type: string;
  isActive: boolean;
  createdAt: string;
}

const VARIABLE_TAGS = [
  { tag: '{{studentName}}', label: 'ছাত্রের নাম' },
  { tag: '{{guardianName}}', label: 'অভিভাবকের নাম' },
  { tag: '{{date}}', label: 'তারিখ' },
  { tag: '{{examName}}', label: 'পরীক্ষার নাম' },
  { tag: '{{marks}}', label: 'প্রাপ্ত নম্বর' },
  { tag: '{{fullMarks}}', label: 'পূর্ণমান' },
  { tag: '{{grade}}', label: 'গ্রেড' },
  { tag: '{{receiptNo}}', label: 'রসিদ নং' },
  { tag: '{{amount}}', label: 'পরিশোধিত টাকা' },
  { tag: '{{dueAmount}}', label: 'বকেয়া টাকা' },
  { tag: '{{feeMonth}}', label: 'ফি এর মাস' },
];

export default function SmsTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('TRANSACTIONAL');
  const [saving, setSaving] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/sms/templates');
      if (res.data) {
        setTemplates(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      toast.error('টেমপ্লেট তালিকা লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setName('');
    setBody('');
    setType('TRANSACTIONAL');
    setShowModal(true);
  };

  const handleOpenEditModal = (item: TemplateItem) => {
    setEditingId(item.id);
    setName(item.name);
    setBody(item.body);
    setType(item.type);
    setShowModal(true);
  };

  // Insert variable tag at cursor position
  const handleInsertTag = (tag: string) => {
    if (!textareaRef.current) {
      setBody((prev) => prev + tag);
      return;
    }
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newBody = body.substring(0, start) + tag + body.substring(end);
    setBody(newBody);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  // Save template
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('টেমপ্লেটের নাম আবশ্যক');
      return;
    }
    if (!body.trim()) {
      toast.error('টেমপ্লেটের টেক্সট বডি লিখুন');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        body: body.trim(),
        type,
      };

      if (editingId) {
        await api.put(`/sms/templates/${editingId}`, payload);
        toast.success('টেমপ্লেট সফলভাবে আপডেট করা হয়েছে');
      } else {
        await api.post('/sms/templates', payload);
        toast.success('নতুন এসএমএস টেমপ্লেট সফলভাবে তৈরি হয়েছে');
      }

      setShowModal(false);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'টেমপ্লেট সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  // Delete template
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('আপনি কি এই টেমপ্লেটটি মুছে ফেলতে চান?')) return;
    try {
      await api.delete(`/sms/templates/${id}`);
      toast.success('টেমপ্লেট মুছে ফেলা হয়েছে');
      fetchTemplates();
    } catch {
      toast.error('টেমপ্লেট মোছা সম্ভব হয়নি');
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
                <FiFileText className="w-6 h-6" />
              </span>
              এসএমএস টেমপ্লেটসমূহ
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              হাজিরা, পরীক্ষার ফলাফল, ফি রসিদ ও নোটিফিকেশনের জন্য নির্ধারিত বার্তা ফরম্যাট
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-xs transition-all"
        >
          <FiPlus className="w-4 h-4" />
          নতুন টেমপ্লেট তৈরি করুন
        </button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center">
          <Loader />
          <p className="text-sm text-slate-400 mt-2">টেমপ্লেট লোড হচ্ছে...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiFileText className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">কোনো টেমপ্লেট পাওয়া যায়নি</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            দ্রুত বার্তা প্রেরণের জন্য নতুন টেমপ্লেট যুক্ত করুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 text-base">{item.name}</h3>
                  <Badge variant={item.type === 'TRANSACTIONAL' ? 'primary' : 'warning'}>
                    {item.type === 'TRANSACTIONAL' ? 'স্বয়ংক্রিয়' : 'মার্কেটিং'}
                  </Badge>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
                  {item.body}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString('bn-BD')}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="সম্পাদনা"
                  >
                    <FiEdit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="মুছে ফেলুন"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New / Edit Template Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <FiTag className="w-5 h-5 text-indigo-600" />
                {editingId ? 'টেমপ্লেট সম্পাদনা' : 'নতুন টেমপ্লেট তৈরি'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  টেমপ্লেটের নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মাসিক ফি রসিদ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  টেমপ্লেটের ধরণ
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="TRANSACTIONAL">স্বয়ংক্রিয় নোটিফিকেশন (Transactional)</option>
                  <option value="CAMPAIGN">মার্কেটিং ক্যাম্পেইন (Campaign)</option>
                  <option value="INDIVIDUAL">সাধারণ বার্তা (Individual)</option>
                </select>
              </div>

              {/* Dynamic Variable Insertion Helper Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ভ্যারিয়েবল ট্যাগ ইনসার্ট করুন (ক্লিক করলেই যুক্ত হবে):
                </label>
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {VARIABLE_TAGS.map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => handleInsertTag(v.tag)}
                      className="px-2 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg text-[11px] font-mono font-medium transition-all"
                      title={v.label}
                    >
                      {v.tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বার্তার টেক্সট বডি <span className="text-rose-500">*</span>
                </label>
                <textarea
                  ref={textareaRef}
                  rows={4}
                  placeholder="উত্তরণ স্টাডি কেয়ার: আপনার সন্তান {{studentName}} আজ ক্লাসে অনুপস্থিত ছিল..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none leading-relaxed"
                  required
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
    </div>
  );
}
