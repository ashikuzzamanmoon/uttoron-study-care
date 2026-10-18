'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiUsers,
  FiPlus,
  FiSend,
  FiUploadCloud,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiPlay,
  FiFileText,
  FiRefreshCw,
  FiX,
  FiCheck,
} from 'react-icons/fi';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';

interface CampaignItem {
  id: string;
  name: string;
  message: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export default function SmsCampaignPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // New Campaign Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignMessage, setCampaignMessage] = useState('');
  const [uploadedContacts, setUploadedContacts] = useState<Array<{ phone: string; name?: string }>>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [creating, setCreating] = useState(false);

  // Execute confirmation
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [runningCampaign, setRunningCampaign] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Character calculation
  const isBangla = /[\u0980-\u09FF]/.test(campaignMessage);
  const charLimit = isBangla ? 70 : 160;
  const multiLimit = isBangla ? 67 : 153;
  const charCount = campaignMessage.length;
  const smsParts =
    charCount === 0
      ? 1
      : charCount <= charLimit
      ? 1
      : Math.ceil(charCount / multiLimit);

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/sms/campaigns?page=${page}&limit=15`);
      if (res.data) {
        setCampaigns(res.data.data || []);
        if (res.data.meta) {
          setTotalPages(res.data.meta.totalPages || 1);
          setTotalCount(res.data.meta.total || 0);
        }
      }
    } catch {
      toast.error('ক্যাম্পেইন তালিকা লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Handle Excel/CSV file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingFile(true);
      const res = await api.post('/sms/campaigns/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.contacts) {
        setUploadedContacts(res.data.contacts);
        toast.success(res.data.message || 'ফাইল থেকে নম্বর সফলভাবে লোড হয়েছে');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'ফাইল আপলোড ব্যর্থ হয়েছে');
    } finally {
      setUploadingFile(false);
    }
  };

  // Create Campaign Submit
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      toast.error('ক্যাম্পেইনের নাম আবশ্যক');
      return;
    }
    if (!campaignMessage.trim()) {
      toast.error('ক্যাম্পেইন বার্তা লিখুন');
      return;
    }
    if (uploadedContacts.length === 0) {
      toast.error('অনুগ্রহ করে এক্সেল ফাইল আপলোড করে প্রাপক যুক্ত করুন');
      return;
    }

    try {
      setCreating(true);
      const payload = {
        name: campaignName.trim(),
        message: campaignMessage.trim(),
        recipients: uploadedContacts,
      };

      await api.post('/sms/campaigns', payload);
      toast.success('এসএমএস ক্যাম্পেইন সফলভাবে তৈরি হয়েছে');

      setShowCreateModal(false);
      setCampaignName('');
      setCampaignMessage('');
      setUploadedContacts([]);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'ক্যাম্পেইন তৈরিতে ত্রুটি হয়েছে');
    } finally {
      setCreating(false);
    }
  };

  // Execute Campaign
  const handleExecuteCampaign = async (id: string) => {
    try {
      setRunningCampaign(true);
      const res = await api.post(`/sms/campaigns/${id}/send`);
      toast.success(res.data?.message || 'ক্যাম্পেইন সফলভাবে সম্পন্ন হয়েছে!');
      setExecutingId(null);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'ক্যাম্পেইন প্রেরণ ব্যর্থ হয়েছে');
    } finally {
      setRunningCampaign(false);
    }
  };

  // Delete Campaign
  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('আপনি কি এই ক্যাম্পেইনটি মুছে ফেলতে চান?')) return;
    try {
      await api.delete(`/sms/campaigns/${id}`);
      toast.success('ক্যাম্পেইন মুছে ফেলা হয়েছে');
      fetchCampaigns();
    } catch {
      toast.error('ক্যাম্পেইন মোছা সম্ভব হয়নি');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">সম্পন্ন</Badge>;
      case 'SENDING':
        return <Badge variant="warning">প্রেরণাধীন...</Badge>;
      case 'FAILED':
        return <Badge variant="danger">ব্যর্থ</Badge>;
      default:
        return <Badge variant="neutral">খসড়া (Draft)</Badge>;
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
              <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                <FiUsers className="w-6 h-6" />
              </span>
              এসএমএস মার্কেটিং ক্যাম্পেইন
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              এক্সেল ফাইল আপলোড করে বাল্ক নোটিফিকেশন, অফার বা ঘোষণা প্রেরণ করুন
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-sm rounded-xl shadow-xs transition-all"
        >
          <FiPlus className="w-4 h-4" />
          নতুন ক্যাম্পেইন তৈরি করুন
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-base">সকল ক্যাম্পেইন</h2>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
            {totalCount} টি ক্যাম্পেইন
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader />
            <p className="text-sm text-slate-400 mt-2">ক্যাম্পেইন তালিকা লোড হচ্ছে...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiUsers className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">কোনো ক্যাম্পেইন পাওয়া যায়নি</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              নতুন ক্যাম্পেইন তৈরি করতে উপরে &quot;নতুন ক্যাম্পেইন তৈরি করুন&quot; বাটনে ক্লিক করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                  <th className="p-3.5 pl-4">ক্যাম্পেইনের নাম</th>
                  <th className="p-3.5">বার্তার প্রিভিউ</th>
                  <th className="p-3.5 text-center">মোট প্রাপক</th>
                  <th className="p-3.5 text-center">ডেলিভারি স্ট্যাটাস</th>
                  <th className="p-3.5 text-center">অবস্থা</th>
                  <th className="p-3.5">তারিখ</th>
                  <th className="p-3.5 text-center pr-4">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name */}
                    <td className="p-3.5 pl-4 font-bold text-slate-900">
                      {camp.name}
                    </td>

                    {/* Message */}
                    <td className="p-3.5 max-w-xs truncate text-xs text-slate-600">
                      {camp.message}
                    </td>

                    {/* Total Recipients */}
                    <td className="p-3.5 text-center font-bold text-slate-800 font-mono">
                      {camp.totalRecipients} জন
                    </td>

                    {/* Sent vs Failed */}
                    <td className="p-3.5 text-center text-xs">
                      <span className="text-emerald-700 font-bold">{camp.sentCount} সফল</span>
                      {camp.failedCount > 0 && (
                        <span className="text-rose-600 font-bold ml-1.5">
                          • {camp.failedCount} ব্যর্থ
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {getStatusBadge(camp.status)}
                    </td>

                    {/* Date */}
                    <td className="p-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(camp.createdAt).toLocaleDateString('bn-BD', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center pr-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {camp.status !== 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => setExecutingId(camp.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
                            title="ক্যাম্পেইন শুরু করুন"
                          >
                            <FiPlay className="w-3.5 h-3.5" />
                            সেন্ড
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(camp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="মুছে ফেলুন"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <FiUsers className="w-5 h-5 text-amber-600" />
                নতুন এসএমএস ক্যাম্পেইন
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ক্যাম্পেইনের শিরোনাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: পদার্থবিজ্ঞান ফ্রি ওয়ার্কশপ - নভেম্বর ২০২৪"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  required
                />
              </div>

              {/* Excel Upload Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  প্রাপকদের এক্সেল ফাইল আপলোড করুন (.xlsx, .csv) <span className="text-rose-500">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 p-5 rounded-2xl text-center cursor-pointer transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {uploadingFile ? (
                    <div className="space-y-1">
                      <Loader size="sm" />
                      <p className="text-xs text-slate-500">ফাইল প্রসেসিং হচ্ছে...</p>
                    </div>
                  ) : uploadedContacts.length > 0 ? (
                    <div className="space-y-1">
                      <FiCheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                      <p className="text-xs font-bold text-emerald-700">
                        {uploadedContacts.length} টি কন্টাক্ট নম্বর সফলভাবে আপলোড হয়েছে!
                      </p>
                      <p className="text-[11px] text-slate-400">ফাইল পরিবর্তন করতে আবার ক্লিক করুন</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <FiUploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">এখানে ক্লিক করে এক্সেল ফাইল আপলোড করুন</p>
                      <p className="text-[11px] text-slate-400">কলামে &apos;Phone&apos; বা &apos;মোবাইল&apos; হেডার থাকতে হবে</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Campaign Message */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    ক্যাম্পেইন বার্তা <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {isBangla ? 'বাংলা' : 'ইংরেজি'}
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder="উত্তরণ স্টাডি কেয়ার: বিশেষ ফ্রি ক্লাসে অংশ নিতে রেজিস্ট্রেশন করুন..."
                  value={campaignMessage}
                  onChange={(e) => setCampaignMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none leading-relaxed"
                  required
                />
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                  <span>অক্ষর: {charCount}</span>
                  <span className="font-bold text-amber-700">এসএমএস পার্ট: {smsParts} টি</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={creating || uploadedContacts.length === 0 || !campaignMessage.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-sm rounded-xl shadow-xs transition-all"
                >
                  {creating ? (
                    <>
                      <Loader size="sm" /> তৈরি হচ্ছে...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" /> ক্যাম্পেইন সেভ করুন
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Execute Confirmation Modal */}
      {executingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
              <FiSend className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-base">ক্যাম্পেইন শুরু করতে চান?</h3>
              <p className="text-xs text-slate-500 mt-1">
                এই ক্যাম্পেইনের সকল প্রাপকদের নম্বরে তাৎক্ষণিকভাবে বার্তা প্রেরণ শুরু হবে।
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setExecutingId(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={runningCampaign}
                onClick={() => handleExecuteCampaign(executingId)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl"
              >
                {runningCampaign ? (
                  <>
                    <Loader size="sm" /> পাঠানো হচ্ছে...
                  </>
                ) : (
                  <>
                    <FiPlay className="w-3.5 h-3.5" /> হ্যাঁ, শুরু করুন
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
