'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { PaginationMeta } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card, CardBody } from '../../../components/ui/Card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { Spinner } from '../../../components/ui/Loader';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import {
  FiLayers,
  FiPlus,
  FiSearch,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiDollarSign,
  FiRefreshCw,
  FiGrid,
  FiList,
  FiBookOpen,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatCurrency, toBengaliNumber } from '../../../lib/utils';

interface BatchFormState {
  name: string;
  classLevel: string;
  group: string;
  section: string;
  year: number;
  maxStudents: number;
  monthlyFee: number;
  startDate: string;
  endDate: string;
}

const initialForm: BatchFormState = {
  name: '',
  classLevel: 'Class 10',
  group: 'Science',
  section: 'A',
  year: new Date().getFullYear(),
  maxStudents: 40,
  monthlyFee: 1500,
  startDate: '',
  endDate: '',
};

const CLASS_OPTIONS = [
  { value: 'Class 6', label: 'Class 6 (৬ষ্ঠ শ্রেণি)' },
  { value: 'Class 7', label: 'Class 7 (৭ম শ্রেণি)' },
  { value: 'Class 8', label: 'Class 8 (৮ম শ্রেণি)' },
  { value: 'Class 9', label: 'Class 9 (৯ম শ্রেণি)' },
  { value: 'Class 10', label: 'Class 10 (১০ম শ্রেণি / SSC)' },
  { value: 'HSC 1st Year', label: 'HSC ১ম বর্ষ (একাদশ)' },
  { value: 'HSC 2nd Year', label: 'HSC ২য় বর্ষ (দ্বাদশ)' },
];

const GROUP_OPTIONS = [
  { value: 'Science', label: 'বিজ্ঞান (Science)' },
  { value: 'Commerce', label: 'ব্যবসায় শিক্ষা (Commerce)' },
  { value: 'Arts', label: 'মানবিক (Arts)' },
  { value: 'General', label: 'সাধারণ (General)' },
];

export default function BatchesListPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter states
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any | null>(null);
  const [formData, setFormData] = useState<BatchFormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBatches = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const params: Record<string, any> = {
          page,
          limit: viewMode === 'grid' ? 9 : 10,
        };

        if (search.trim()) params.search = search.trim();
        if (classFilter) params.classLevel = classFilter;
        if (groupFilter) params.group = groupFilter;
        if (statusFilter) params.isActive = statusFilter === 'active';

        const res = await api.get('/batches', { params });
        const data = res.data?.data || [];
        setBatches(data);
        if (res.data?.meta) {
          setMeta(res.data.meta);
        }
      } catch (err: any) {
        console.error('Failed to load batches:', err);
        toast.error('ব্যাচ তালিকা লোড করতে সমস্যা হয়েছে');
      } finally {
        setIsLoading(false);
      }
    },
    [search, classFilter, groupFilter, statusFilter, viewMode],
  );

  useEffect(() => {
    fetchBatches(1);
  }, [fetchBatches]);

  const handleOpenCreateModal = () => {
    setEditingBatch(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (batch: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBatch(batch);
    setFormData({
      name: batch.name || '',
      classLevel: batch.classLevel || 'Class 10',
      group: batch.group || 'Science',
      section: batch.section || '',
      year: batch.year || new Date().getFullYear(),
      maxStudents: batch.maxStudents || 40,
      monthlyFee: batch.monthlyFee || 0,
      startDate: batch.startDate ? batch.startDate.slice(0, 10) : '',
      endDate: batch.endDate ? batch.endDate.slice(0, 10) : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('ব্যাচের নাম আবশ্যক');
      return;
    }
    if (!formData.classLevel) {
      toast.error('শ্রেণি নির্বাচন করুন');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        classLevel: formData.classLevel,
        group: formData.group || undefined,
        section: formData.section || undefined,
        year: Number(formData.year),
        maxStudents: Number(formData.maxStudents),
        monthlyFee: Number(formData.monthlyFee),
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      };

      if (editingBatch) {
        await api.put(`/batches/${editingBatch.id}`, payload);
        toast.success('ব্যাচের তথ্য সফলভাবে আপডেট করা হয়েছে');
      } else {
        await api.post('/batches', payload);
        toast.success('নতুন ব্যাচ সফলভাবে তৈরি করা হয়েছে');
      }

      setIsModalOpen(false);
      fetchBatches(meta.page);
    } catch (err: any) {
      console.error('Failed to save batch:', err);
      toast.error(err.response?.data?.message || 'ব্যাচ সংরক্ষণ করতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`আপনি কি নিশ্চিত যে "${name}" ব্যাচটি নিষ্ক্রিয়/ডিলিট করতে চান?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await api.delete(`/batches/${id}`);
      toast.success('ব্যাচটি সফলভাবে নিষ্ক্রিয় করা হয়েছে');
      fetchBatches(meta.page);
    } catch (err: any) {
      console.error('Failed to delete batch:', err);
      toast.error(err.response?.data?.message || 'ব্যাচ নিষ্ক্রিয় করতে ব্যর্থ হয়েছে');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FiLayers className="w-6 h-6" />
            </span>
            ব্যাচ ও শ্রেণী ব্যবস্থাপনা
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            কোচিংয়ের সকল ব্যাচ, আসন সংখ্যা, মাসিক ফি এবং ক্লাস শিডিউল পরিচালনা করুন
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="গ্রিড ভিউ"
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="টেবিল ভিউ"
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreateModal}
            leftIcon={<FiPlus />}
          >
            নতুন ব্যাচ তৈরি করুন
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ব্যাচের নাম খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
            </div>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            >
              <option value="">সকল শ্রেণি (All Classes)</option>
              {CLASS_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            >
              <option value="">সকল গ্রুপ (All Groups)</option>
              {GROUP_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              >
                <option value="">সকল স্ট্যাটাস</option>
                <option value="active">সক্রিয় (Active)</option>
                <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
              </select>

              {(search || classFilter || groupFilter || statusFilter) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setClassFilter('');
                    setGroupFilter('');
                    setStatusFilter('');
                  }}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                  title="ফিল্টার রিসেট"
                >
                  <FiRefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium animate-pulse">
            ব্যাচ তালিকা লোড হচ্ছে...
          </p>
        </div>
      ) : batches.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <FiLayers className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">কোনো ব্যাচ পাওয়া যায়নি</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {search || classFilter || groupFilter
                ? 'আপনার সার্চ ফিল্টারের সাথে মিলে এমন কোনো ব্যাচ নেই।'
                : 'এখনও কোনো ব্যাচ তৈরি করা হয়নি। নতুন ব্যাচ তৈরি করুন।'}
            </p>
            <div className="mt-5">
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateModal}
                leftIcon={<FiPlus />}
              >
                প্রথম ব্যাচ তৈরি করুন
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid / Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {batches.map((batch) => {
            const studentCount = batch._count?.batchStudents ?? 0;
            const maxStudents = batch.maxStudents || 40;
            const fillPercentage = Math.min(100, Math.round((studentCount / maxStudents) * 100));
            const primaryTeacher = batch.batchTeachers?.find((bt: any) => bt.isPrimary)?.teacher;
            const totalTeachers = batch.batchTeachers?.length || 0;
            const totalSubjects = batch.batchSubjects?.length || 0;

            return (
              <div
                key={batch.id}
                onClick={() => router.push(`/batches/${batch.id}`)}
                className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {batch.classLevel}
                        </span>
                        {batch.group && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                            {batch.group}
                          </span>
                        )}
                        {batch.section && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                            সেকশন {batch.section}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors pt-1 line-clamp-1">
                        {batch.name}
                      </h3>
                    </div>

                    <Badge variant={batch.isActive ? 'success' : 'neutral'}>
                      {batch.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </Badge>
                  </div>

                  {/* Student Capacity Progress Bar */}
                  <div className="space-y-1.5 my-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <FiUsers className="w-3.5 h-3.5 text-indigo-500" />
                        ভর্তিকৃত শিক্ষার্থী:
                      </span>
                      <span className="font-bold text-slate-800">
                        {toBengaliNumber(studentCount)} / {toBengaliNumber(maxStudents)} জন
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          fillPercentage >= 90
                            ? 'bg-rose-500'
                            : fillPercentage >= 70
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${fillPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Batch Highlights */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg">
                      <FiDollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">ফি: {formatCurrency(batch.monthlyFee || 0)}/মাস</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg">
                      <FiBookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">বিষয়: {toBengaliNumber(totalSubjects)} টি</span>
                    </div>
                  </div>

                  {/* Primary Teacher / Mentor */}
                  <div className="text-xs text-slate-500 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <span className="font-medium text-slate-400">দায়িত্বপ্রাপ্ত শিক্ষক:</span>
                    <span className="font-semibold text-slate-800 truncate">
                      {primaryTeacher ? (primaryTeacher.nameBn || primaryTeacher.nameEn) : (
                        totalTeachers > 0 ? `${toBengaliNumber(totalTeachers)} জন শিক্ষক` : 'নির্ধারিত হয়নি'
                      )}
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400">
                    শিক্ষাবর্ষ: {toBengaliNumber(batch.year)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEditModal(batch, e)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="এডিট করুন"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(batch.id, batch.name, e)}
                      disabled={deletingId === batch.id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="মুছুন / নিষ্ক্রিয় করুন"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      href={`/batches/${batch.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <span>বিস্তারিত</span>
                      <FiEye className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ব্যাচের নাম</TableHead>
                <TableHead>শ্রেণি ও গ্রুপ</TableHead>
                <TableHead>শিক্ষার্থী সংখ্যা</TableHead>
                <TableHead>দায়িত্বপ্রাপ্ত শিক্ষক</TableHead>
                <TableHead>মাসিক ফি</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                <TableHead className="text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => {
                const studentCount = batch._count?.batchStudents ?? 0;
                const maxStudents = batch.maxStudents || 40;
                const primaryTeacher = batch.batchTeachers?.find((bt: any) => bt.isPrimary)?.teacher;

                return (
                  <TableRow key={batch.id} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell>
                      <Link
                        href={`/batches/${batch.id}`}
                        className="font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {batch.name}
                      </Link>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        বছর: {toBengaliNumber(batch.year)} {batch.section ? `• সেকশন ${batch.section}` : ''}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-slate-800 text-xs">
                          {batch.classLevel}
                        </span>
                        {batch.group && (
                          <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                            {batch.group}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-800">
                          {toBengaliNumber(studentCount)} / {toBengaliNumber(maxStudents)}
                        </span>
                        <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.round((studentCount / maxStudents) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      {primaryTeacher ? (primaryTeacher.nameBn || primaryTeacher.nameEn) : 'নির্ধারিত নেই'}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-900">
                      {formatCurrency(batch.monthlyFee || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={batch.isActive ? 'success' : 'neutral'}>
                        {batch.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/batches/${batch.id}`}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="বিস্তারিত"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={(e) => handleOpenEditModal(batch, e)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="এডিট"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(batch.id, batch.name, e)}
                          disabled={deletingId === batch.id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="মুছুন"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {!isLoading && meta.totalPages > 1 && (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          onPageChange={(page) => fetchBatches(page)}
          totalItems={meta.total}
          pageSize={meta.limit}
        />
      )}

      {/* Create / Edit Batch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBatch ? 'ব্যাচের তথ্য সম্পাদনা করুন' : 'নতুন ব্যাচ তৈরি করুন'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="ব্যাচের নাম *"
            placeholder="উদাহরণ: Class 10 Science Morning - Batch A"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="শ্রেণি (Class Level) *"
              value={formData.classLevel}
              onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
              options={CLASS_OPTIONS}
              required
            />

            <Select
              label="গ্রুপ (Group)"
              value={formData.group}
              onChange={(e) => setFormData({ ...formData, group: e.target.value })}
              options={GROUP_OPTIONS}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="সেকশন / শিফট"
              placeholder="যেমন: A, B, Morning"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            />

            <Input
              label="শিক্ষাবর্ষ (Year) *"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              required
            />

            <Input
              label="সর্বোচ্চ শিক্ষার্থী (আসন)"
              type="number"
              value={formData.maxStudents}
              onChange={(e) => setFormData({ ...formData, maxStudents: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="মাসিক ফি (টাকা) *"
              type="number"
              value={formData.monthlyFee}
              onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
              required
            />

            <Input
              label="শুরুর তারিখ"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />

            <Input
              label="সমাপ্তির তারিখ"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              {editingBatch ? 'পরিবর্তন সংরক্ষণ করুন' : 'ব্যাচ তৈরি করুন'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
