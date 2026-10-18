'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Loader';
import { formatDate, toBengaliNumber } from '../../../lib/utils';
import toast from 'react-hot-toast';
import {
  FiBell,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiPrinter,
  FiAlertTriangle,
  FiCalendar,
  FiUser,
  FiClock,
  FiSearch,
  FiCheckCircle,
  FiX,
  FiInfo,
} from 'react-icons/fi';

interface NoticeItem {
  id: string;
  title: string;
  body: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isPublished: boolean;
  publishedAt: string;
  expiresAt: string | null;
  createdBy: {
    id: string;
    username: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function NoticesPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'STAFF';

  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formPriority, setFormPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal
  const [deleteNotice, setDeleteNotice] = useState<NoticeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Single Notice Print / Preview Modal
  const [previewNotice, setPreviewNotice] = useState<NoticeItem | null>(null);

  // Fetch Notices
  const fetchNotices = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/notices', {
        params: {
          limit: 100,
          search: searchTerm || undefined,
          priority: selectedPriority !== 'ALL' ? selectedPriority : undefined,
          isPublished: selectedStatus === 'PUBLISHED' ? true : selectedStatus === 'DRAFT' ? false : undefined,
        },
      });
      setNotices(res.data?.data || res.data || []);
    } catch (error) {
      console.error('Failed to load notices:', error);
      toast.error('নোটিশ লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedPriority, selectedStatus]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormTitle('');
    setFormBody('');
    setFormPriority('NORMAL');
    setFormIsPublished(true);
    setFormExpiresAt('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (notice: NoticeItem) => {
    setIsEditing(true);
    setCurrentId(notice.id);
    setFormTitle(notice.title);
    setFormBody(notice.body);
    setFormPriority(notice.priority);
    setFormIsPublished(notice.isPublished);
    setFormExpiresAt(notice.expiresAt ? notice.expiresAt.split('T')[0] : '');
    setIsModalOpen(true);
  };

  // Submit Notice (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('নোটিশের শিরোনাম লিখুন');
      return;
    }
    if (!formBody.trim()) {
      toast.error('নোটিশের বিস্তারিত বিবরণ লিখুন');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: formTitle.trim(),
        body: formBody.trim(),
        priority: formPriority,
        isPublished: formIsPublished,
        expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : undefined,
      };

      if (isEditing && currentId) {
        await api.put(`/notices/${currentId}`, payload);
        toast.success('নোটিশ সফলভাবে আপডেট করা হয়েছে');
      } else {
        await api.post('/notices', payload);
        toast.success('নতুন নোটিশ সফলভাবে প্রকাশ করা হয়েছে');
      }

      setIsModalOpen(false);
      fetchNotices();
    } catch (error: any) {
      console.error('Error saving notice:', error);
      toast.error(error.response?.data?.message || 'নোটিশ সংরক্ষণ করতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Publication
  const handleTogglePublish = async (notice: NoticeItem) => {
    try {
      await api.patch(`/notices/${notice.id}/publish`, {
        isPublished: !notice.isPublished,
      });
      toast.success(
        notice.isPublished
          ? 'নোটিশটির প্রকাশনা স্থগিত করা হয়েছে'
          : 'নোটিশটি সফলভাবে প্রকাশ করা হয়েছে',
      );
      fetchNotices();
    } catch (error) {
      toast.error('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteNotice) return;
    try {
      setIsDeleting(true);
      await api.delete(`/notices/${deleteNotice.id}`);
      toast.success('নোটিশটি সফলভাবে মুছে ফেলা হয়েছে');
      setDeleteNotice(null);
      fetchNotices();
    } catch (error) {
      toast.error('নোটিশ মুছে ফেলতে সমস্যা হয়েছে');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for priority badges
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
            অতি জরুরি
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            গুরুত্বপূর্ণ
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            সাধারণ
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            তথ্যমূলক
          </span>
        );
      default:
        return null;
    }
  };

  // Print single notice memo
  const handlePrintMemo = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FiBell className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              নোটিশ বোর্ড (Notice Board)
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            উত্তরণ স্টাডি কেয়ারের সকল অ্যাকাডেমিক ঘোষণা, পরীক্ষার রুটিন ও প্রাতিষ্ঠানিক ছুটির নোটিশ
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 shadow-md shadow-indigo-600/20"
          >
            <FiPlus className="w-4 h-4" />
            নতুন নোটিশ প্রকাশ
          </Button>
        )}
      </div>

      {/* 2. Filters & Search Bar */}
      <Card className="no-print border-slate-200">
        <CardBody className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="নোটিশের শিরোনাম বা বিষয়বস্তু খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Priority Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'ALL', label: 'সকল' },
              { key: 'URGENT', label: 'অতি জরুরি' },
              { key: 'HIGH', label: 'গুরুত্বপূর্ণ' },
              { key: 'NORMAL', label: 'সাধারণ' },
              { key: 'LOW', label: 'তথ্যমূলক' },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelectedPriority(p.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedPriority === p.key
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium ml-2"
            >
              <option value="ALL">সকল স্ট্যাটাস</option>
              <option value="PUBLISHED">প্রকাশিত (Published)</option>
              <option value="DRAFT">খসড়া (Draft)</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* 3. Notice Cards List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" className="text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500 animate-pulse">
            নোটিশ বোর্ড লোড করা হচ্ছে...
          </p>
        </div>
      ) : notices.length === 0 ? (
        <Card className="border-slate-200">
          <CardBody className="py-16 text-center space-y-3">
            <FiBell className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">কোনো নোটিশ পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              বর্তমানে কোনো নোটিশ প্রকাশিত নেই অথবা আপনার ফিল্টারের সাথে কোনো নোটিশ মেলেনি।
            </p>
            {canManage && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenCreateModal}
                className="mt-2 text-indigo-600"
              >
                + প্রথম নোটিশ তৈরি করুন
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {notices.map((notice) => {
            const isExpired = notice.expiresAt && new Date(notice.expiresAt) < new Date();

            return (
              <Card
                key={notice.id}
                hoverEffect
                className={`flex flex-col justify-between border transition-all ${
                  notice.priority === 'URGENT'
                    ? 'border-rose-200 bg-linear-to-b from-rose-50/20 to-transparent hover:border-rose-400'
                    : notice.priority === 'HIGH'
                    ? 'border-amber-200 bg-linear-to-b from-amber-50/20 to-transparent hover:border-amber-400'
                    : 'border-slate-200/90 hover:border-indigo-300'
                }`}
              >
                <CardBody className="p-5 space-y-4 flex-1">
                  {/* Top Meta Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(notice.priority)}
                      {!notice.isPublished ? (
                        <Badge variant="warning" className="text-[10px]">
                          খসড়া (অপ্রকাশিত)
                        </Badge>
                      ) : isExpired ? (
                        <Badge variant="danger" className="text-[10px]">
                          মেয়াদ শেষ
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px]">
                          সক্রিয়
                        </Badge>
                      )}
                    </div>

                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                      <FiClock className="w-3.5 h-3.5" />
                      {formatDate(notice.publishedAt || notice.createdAt, 'dd MMM yyyy')}
                    </span>
                  </div>

                  {/* Title & Body */}
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                      {notice.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line line-clamp-4">
                      {notice.body}
                    </p>
                  </div>
                </CardBody>

                {/* Footer Bar */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <FiUser className="w-3.5 h-3.5 text-slate-400" />
                    <span>{notice.createdBy?.username || 'অ্যাডমিন'}</span>
                    {notice.expiresAt && (
                      <span className="text-[10px] text-slate-400 ml-2">
                        (মেয়াদ: {formatDate(notice.expiresAt, 'dd MMM')})
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewNotice(notice)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                      title="নোটিশ দেখুন ও প্রিন্ট করুন"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>

                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(notice)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-white rounded-lg transition-colors"
                          title={notice.isPublished ? 'স্থগিত করুন' : 'প্রকাশ করুন'}
                        >
                          {notice.isPublished ? (
                            <FiEyeOff className="w-4 h-4" />
                          ) : (
                            <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(notice)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                          title="সম্পাদনা করুন"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteNotice(notice)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 4. Create / Edit Notice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'নোটিশ সম্পাদনা করুন' : 'নতুন নোটিশ তৈরি ও প্রকাশ'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              নোটিশের শিরোনাম <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="যেমন: মাসিক পরীক্ষার সংশোধিত রুটিন বা ছুটির ঘোষণা"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Priority & Expiration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">প্রায়োরিটি লেভেল</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="NORMAL">🔵 সাধারণ (NORMAL)</option>
                <option value="HIGH">🟠 গুরুত্বপূর্ণ (HIGH)</option>
                <option value="URGENT">🔴 অতি জরুরি (URGENT)</option>
                <option value="LOW">⚪ তথ্যমূলক (LOW)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">মেয়াদ শেষ তারিখ (ঐচ্ছিক)</label>
              <input
                type="date"
                value={formExpiresAt}
                onChange={(e) => setFormExpiresAt(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Body */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              নোটিশের বিস্তারিত বিবরণ <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              placeholder="নোটিশের বিস্তারিত তথ্য এখানে লিখুন..."
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white leading-relaxed"
            />
          </div>

          {/* Is Published Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPublishedCheck"
              checked={formIsPublished}
              onChange={(e) => setFormIsPublished(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="isPublishedCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
              তৈরি করার সাথে সাথেই নোটিশ বোর্ডে প্রকাশ করুন
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="shadow-sm shadow-indigo-600/20"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <Spinner size="sm" /> সংরক্ষণ হচ্ছে...
                </span>
              ) : isEditing ? (
                'হালনাগাদ সম্পন্ন করুন'
              ) : (
                'নোটিশ প্রকাশ করুন'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteNotice}
        onClose={() => setDeleteNotice(null)}
        title="নোটিশ মুছে ফেলার নিশ্চিতকরণ"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <FiAlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">আপনি কি নিশ্চিত?</p>
              <p className="mt-0.5 text-rose-700">
                "{deleteNotice?.title}" নোটিশটি স্থায়ীভাবে মুছে ফেলা হবে।
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteNotice(null)}
            >
              বাতিল
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 6. Single Notice Preview & Print Memo Modal */}
      {previewNotice && (
        <Modal
          isOpen={!!previewNotice}
          onClose={() => setPreviewNotice(null)}
          title="নোটিশ বিস্তারিত ও প্রিন্ট কপি"
          size="lg"
        >
          <div className="space-y-6">
            {/* Memo Letterhead for Print */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 print:border-0 print:p-0">
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <h2 className="text-xl font-black text-slate-900">উত্তরণ স্টাডি কেয়ার</h2>
                <p className="text-xs text-slate-500">কোচিং ম্যানেজমেন্ট ও স্মার্ট অ্যাকাডেমিক সিস্টেম</p>
                <div className="mt-2 inline-block px-3 py-1 bg-slate-900 text-white rounded-md text-xs font-bold uppercase tracking-wider">
                  বিজ্ঞপ্তি / নোটিশ
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>তারিখ: {formatDate(previewNotice.publishedAt || previewNotice.createdAt, 'dd MMMM yyyy')}</span>
                <span>কর্তৃপক্ষ: {previewNotice.createdBy?.username || 'অ্যাডমিন'}</span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    {previewNotice.title}
                  </h3>
                  {getPriorityBadge(previewNotice.priority)}
                </div>

                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                  {previewNotice.body}
                </div>
              </div>

              <div className="pt-8 flex justify-between items-end text-xs text-slate-500">
                <div>
                  <p className="text-[10px] text-slate-400">উত্তরণ স্টাডি কেয়ার ডিজিটাল নোটিশ বোর্ড</p>
                </div>
                <div className="text-center">
                  <div className="w-28 border-b border-slate-400 mb-1" />
                  <p className="font-semibold text-slate-700">পরিচালক / সমন্বয়ক</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="no-print flex items-center justify-end gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewNotice(null)}
              >
                বন্ধ করুন
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrintMemo}
                className="flex items-center gap-1.5"
              >
                <FiPrinter className="w-4 h-4" />
                প্রিন্ট করুন
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
