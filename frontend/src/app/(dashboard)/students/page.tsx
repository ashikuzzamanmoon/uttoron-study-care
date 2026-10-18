'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { Student, PaginationMeta } from '../../../types';
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
  TableEmpty,
} from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { Spinner } from '../../../components/ui/Loader';
import { AdvancedFilterPanel } from '../../../components/ui/AdvancedFilterPanel';
import { useDebounce } from '../../../hooks/useDebounce';
import {
  FiUserPlus,
  FiSearch,
  FiDownload,
  FiEye,
  FiPhone,
  FiX,
  FiRefreshCw,
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

function StudentsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial filter values from URL
  const initialSearch = searchParams.get('search') || '';
  const initialClass = searchParams.get('classLevel') || '';
  const initialGroup = searchParams.get('group') || '';
  const initialStatus = searchParams.get('status') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: initialPage,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState(initialSearch);
  const [classLevel, setClassLevel] = useState(initialClass);
  const [group, setGroup] = useState(initialGroup);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  // Debounced search term
  const debouncedSearch = useDebounce(search, 300);

  // Active filter count
  const activeFilterCount = [
    debouncedSearch.trim() ? 1 : 0,
    classLevel ? 1 : 0,
    group ? 1 : 0,
    statusFilter ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // Sync state with URL search parameters
  const updateUrlParams = useCallback(
    (page: number, q: string, cl: string, grp: string, st: string) => {
      const params = new URLSearchParams();
      if (page > 1) params.set('page', page.toString());
      if (q.trim()) params.set('search', q.trim());
      if (cl) params.set('classLevel', cl);
      if (grp) params.set('group', grp);
      if (st) params.set('status', st);

      const queryString = params.toString();
      const targetUrl = queryString ? `/students?${queryString}` : '/students';
      router.replace(targetUrl);
    },
    [router],
  );

  const fetchStudents = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const params: Record<string, any> = {
          page,
          limit: 10,
        };

        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (classLevel) params.classLevel = classLevel;
        if (group) params.group = group;
        if (statusFilter) params.isActive = statusFilter === 'active';

        const res = await api.get('/students', { params });
        const responseData = res.data?.data || res.data;

        setStudents(responseData || []);
        if (res.data?.meta) {
          setMeta(res.data.meta);
        }

        updateUrlParams(page, debouncedSearch, classLevel, group, statusFilter);
      } catch (err: any) {
        toast.error('শিক্ষার্থীদের তথ্য লোড করতে সমস্যা হয়েছে');
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, classLevel, group, statusFilter, updateUrlParams],
  );

  useEffect(() => {
    fetchStudents(1);
  }, [fetchStudents]);

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearch('');
    setClassLevel('');
    setGroup('');
    setStatusFilter('');
    router.replace('/students');
  };

  const handleExportExcel = () => {
    if (students.length === 0) {
      toast.error('এক্সপোর্ট করার মতো কোনো ডাটা নেই');
      return;
    }

    const exportData = students.map((s, idx) => ({
      'ক্রমিক': idx + 1,
      'স্টুডেন্ট আইডি': s.studentId,
      'নাম (ইংরেজি)': s.nameEn,
      'নাম (বাংলা)': s.nameBn || '-',
      'শ্রেণি': s.classLevel,
      'বিভাগ': s.group || 'সাধারণ',
      'অভিভাবকের নাম': s.guardianName || s.fatherName,
      'অভিভাবকের ফোন': s.guardianPhone,
      'রক্তের গ্রুপ': s.bloodGroup || '-',
      'স্ট্যাটাস': s.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, `Uttoron_Students_${Date.now()}.xlsx`);
    toast.success('এক্সেল ফাইল ডাউনলোড সম্পন্ন হয়েছে');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            শিক্ষার্থী তালিকা (Students Directory)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            কোচিংয়ে ভর্তিকৃত সকল শিক্ষার্থীর প্রোফাইল, শ্রেণি, ব্যাচ ও যোগাযোগের তথ্য
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5"
          >
            <FiDownload className="w-4 h-4 text-emerald-600" />
            এক্সপোর্ট এক্সেল
          </Button>

          <Link href="/students/add">
            <Button variant="primary" size="md" className="flex items-center gap-1.5 shadow-md shadow-indigo-600/20">
              <FiUserPlus className="w-4 h-4" />
              নতুন ভর্তি
            </Button>
          </Link>
        </div>
      </div>

      {/* Advanced Filter Panel (Collapsible with Active Filter Count) */}
      <AdvancedFilterPanel
        title="উন্নত সার্চ ও ফিল্টার প্যানেল"
        activeCount={activeFilterCount}
        onClearAll={handleClearAllFilters}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Debounced Search */}
          <div className="relative lg:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <FiSearch className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম, স্টুডেন্ট আইডি বা মোবাইল নম্বর লিখুন..."
              className="w-full pl-10 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900 placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-700"
            >
              <option value="">সকল শ্রেণি</option>
              <option value="Class 8">৮ম শ্রেণি (Class 8)</option>
              <option value="Class 9">৯ম শ্রেণি (Class 9)</option>
              <option value="Class 10">১০ম শ্রেণি (Class 10)</option>
              <option value="HSC 1st Year">একাদশ শ্রেণি (HSC 1st)</option>
              <option value="HSC 2nd Year">দ্বাদশ শ্রেণি (HSC 2nd)</option>
            </select>
          </div>

          {/* Group Filter */}
          <div>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-700"
            >
              <option value="">সকল বিভাগ</option>
              <option value="Science">বিজ্ঞান (Science)</option>
              <option value="Commerce">ব্যবসায় শিক্ষা (Commerce)</option>
              <option value="Arts">মানবিক (Arts)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-700"
            >
              <option value="">সকল স্ট্যাটাস</option>
              <option value="active">সক্রিয় (Active)</option>
              <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
            </select>
          </div>
        </div>
      </AdvancedFilterPanel>

      {/* Students Data Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="w-16">ছবি</TableHead>
                <TableHead>আইডি ও নাম</TableHead>
                <TableHead>শ্রেণি ও বিভাগ</TableHead>
                <TableHead>অভিভাবক ও ফোন</TableHead>
                <TableHead className="text-center">স্ট্যাটাস</TableHead>
                <TableHead className="text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Spinner size="lg" className="text-indigo-600" />
                      <span className="text-xs text-slate-500 font-medium animate-pulse">
                        শিক্ষার্থীদের তথ্য লোড হচ্ছে...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  message="কোনো শিক্ষার্থী পাওয়া যায়নি"
                  description="আপনার সার্চ বা ফিল্টারের সাথে মিলে এমন কোনো শিক্ষার্থী নেই।"
                />
              ) : (
                students.map((student) => (
                  <TableRow key={student.id} className="group">
                    <TableCell>
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                        {student.photo ? (
                          <img
                            src={student.photo}
                            alt={student.nameEn}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          student.nameEn?.charAt(0).toUpperCase() || 'S'
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block group-hover:text-indigo-600 transition-colors">
                          {student.nameBn || student.nameEn}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs text-slate-500 font-medium">
                            {student.studentId}
                          </span>
                          {student.nameBn && (
                            <span className="text-[11px] text-slate-400">
                              ({student.nameEn})
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-slate-800 block">
                          {student.classLevel}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {student.group || 'সাধারণ'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-slate-800 block">
                          {student.guardianName || student.fatherName || '-'}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                          <FiPhone className="w-3 h-3 text-slate-400" />
                          {student.guardianPhone}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant={student.isActive ? 'success' : 'danger'} size="sm">
                        {student.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Link href={`/students/${student.id}`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-1 text-xs"
                        >
                          <FiEye className="w-3.5 h-3.5" />
                          প্রোফাইল
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                মোট <span className="font-bold text-slate-700">{meta.total}</span> জনের মধ্যে{' '}
                <span className="font-bold text-slate-700">
                  {(meta.page - 1) * meta.limit + 1}
                </span>{' '}
                -{' '}
                <span className="font-bold text-slate-700">
                  {Math.min(meta.page * meta.limit, meta.total)}
                </span>{' '}
                প্রদর্শিত
              </p>
              <Pagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                onPageChange={(page) => fetchStudents(page)}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default function StudentsListPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" className="text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500 animate-pulse">
            শিক্ষার্থী তালিকা প্রস্তুত হচ্ছে...
          </p>
        </div>
      }
    >
      <StudentsListContent />
    </Suspense>
  );
}
