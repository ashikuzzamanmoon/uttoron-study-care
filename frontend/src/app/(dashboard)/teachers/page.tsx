'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { Teacher, PaginationMeta } from '../../../types';
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
import {
  FiUserPlus,
  FiSearch,
  FiEye,
  FiPhone,
  FiBook,
  FiRefreshCw,
  FiCalendar,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TeachersListPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTeachers = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const params: Record<string, any> = {
          page,
          limit: 10,
        };

        if (search.trim()) params.search = search.trim();
        if (statusFilter) params.isActive = statusFilter === 'active';

        const res = await api.get('/teachers', { params });
        const responseData = res.data?.data || res.data;

        setTeachers(responseData || []);
        if (res.data?.meta) {
          setMeta(res.data.meta);
        }
      } catch (err) {
        toast.error('শিক্ষকদের তালিকা লোড করতে সমস্যা হয়েছে');
      } finally {
        setIsLoading(false);
      }
    },
    [search, statusFilter],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchTeachers]);

  return (
    <div className="space-y-6">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            শিক্ষক ও প্রশিক্ষক মণ্ডলী
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            কোচিংয়ের সম্মানিত শিক্ষকবৃন্দ, পদবি, বিশেষত্ব ও অ্যাসাইনড সাবজেক্ট
          </p>
        </div>

        <Link href="/dashboard/teachers/add">
          <Button variant="primary" size="md" leftIcon={<FiUserPlus />}>
            নতুন শিক্ষক নিবন্ধন
          </Button>
        </Link>
      </div>

      {/* Filter & Search */}
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FiSearch className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="শিক্ষকের নাম, আইডি, ফোন বা বিশেষত্ব দিয়ে খুঁজুন..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-700"
              >
                <option value="">সকল স্ট্যাটাস</option>
                <option value="active">সক্রিয় (Active)</option>
                <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
              </select>

              {(search || statusFilter) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                  }}
                  className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                  title="ফিল্টার রিসেট"
                >
                  <FiRefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Teachers Table */}
      <Card>
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs z-10 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>শিক্ষক</TableHead>
                <TableHead>পদবি ও যোগ্যতা</TableHead>
                <TableHead>পাঠদানের বিষয় (Subjects)</TableHead>
                <TableHead>যোগাযোগ</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                <TableHead className="text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <TableRow
                    key={teacher.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/teachers/${teacher.id}`)}
                  >
                    {/* Name & ID */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                          {teacher.nameEn.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {teacher.nameEn}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono text-indigo-600 font-medium">
                              {teacher.teacherId}
                            </span>
                            {teacher.nameBn && <span>• {teacher.nameBn}</span>}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Designation & Qualification */}
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-800">
                          {teacher.designation || 'শিক্ষক'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {teacher.qualification || teacher.specialization || '-'}
                        </p>
                      </div>
                    </TableCell>

                    {/* Assigned Subjects */}
                    <TableCell>
                      {teacher.teacherSubjects && teacher.teacherSubjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {teacher.teacherSubjects.map((ts: any, i: number) => (
                            <Badge key={i} variant="secondary" size="sm">
                              {ts.subject?.name || 'বিষয়'}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">কোনো বিষয় যুক্ত নেই</span>
                      )}
                    </TableCell>

                    {/* Contact */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <FiPhone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-xs">{teacher.phone}</span>
                      </div>
                      {teacher.email && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                          {teacher.email}
                        </p>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={teacher.isActive ? 'success' : 'danger'}
                        dot
                        size="sm"
                      >
                        {teacher.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/teachers/${teacher.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                        প্রোফাইল
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableEmpty
                  colSpan={6}
                  message="কোনো শিক্ষক পাওয়া যায়নি"
                  description="নতুন শিক্ষক নিবন্ধন করুন।"
                  action={
                    <Link href="/dashboard/teachers/add">
                      <Button variant="primary" size="sm" leftIcon={<FiUserPlus />}>
                        নতুন শিক্ষক নিবন্ধন ফরম
                      </Button>
                    </Link>
                  }
                />
              )}
            </TableBody>
          </Table>
        </div>

        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              totalItems={meta.total}
              pageSize={meta.limit}
              onPageChange={(page) => fetchTeachers(page)}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
