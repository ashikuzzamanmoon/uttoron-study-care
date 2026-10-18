'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { Student, PaginationMeta } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
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
  FiDownload,
  FiEye,
  FiFilter,
  FiPhone,
  FiRefreshCw,
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export default function StudentsListPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [group, setGroup] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchStudents = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const params: Record<string, any> = {
          page,
          limit: 10,
        };

        if (search.trim()) params.search = search.trim();
        if (classLevel) params.classLevel = classLevel;
        if (group) params.group = group;
        if (statusFilter) params.isActive = statusFilter === 'active';

        const res = await api.get('/students', { params });
        const responseData = res.data?.data || res.data;

        setStudents(responseData || []);
        if (res.data?.meta) {
          setMeta(res.data.meta);
        }
      } catch (err: any) {
        toast.error('শিক্ষার্থীদের তথ্য লোড করতে সমস্যা হয়েছে');
      } finally {
        setIsLoading(false);
      }
    },
    [search, classLevel, group, statusFilter],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  const handleExportExcel = () => {
    if (students.length === 0) {
      toast.error('এক্সপোর্ট করার মতো কোনো ডাটা নেই');
      return;
    }

    const exportData = students.map((s, idx) => ({
      ক্রমিক: idx + 1,
      'স্টুডেন্ট আইডি': s.studentId,
      'নাম (ইংরেজি)': s.nameEn,
      'নাম (বাংলা)': s.nameBn || '-',
      শ্রেণি: s.classLevel,
      বিভাগ: s.group || 'সাধারণ',
      'অভিভাবকের ফোন': s.guardianPhone,
      'পিতার নাম': s.fatherName,
      'মাসিক ফি': s.monthlyFee || 0,
      স্ট্যাটাস: s.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, `uttoron_students_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('এক্সেল ফাইল ডাউনলোড শুরু হয়েছে');
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            শিক্ষার্থী তালিকা
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            কোচিংয়ে ভর্তিকৃত সকল শিক্ষার্থীর প্রোফাইল, শ্রেণি, ব্যাচ ও তথ্য
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportExcel}
            leftIcon={<FiDownload />}
          >
            এক্সপোর্ট এক্সেল
          </Button>

          <Link href="/dashboard/students/add">
            <Button variant="primary" size="md" leftIcon={<FiUserPlus />}>
              নতুন ভর্তি
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FiSearch className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="নাম, আইডি বা ফোন দিয়ে খুঁজুন..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Class Filter */}
            <div>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-700"
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
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-700"
              >
                <option value="">সকল বিভাগ</option>
                <option value="Science">বিজ্ঞান (Science)</option>
                <option value="Commerce">ব্যবসায় শিক্ষা (Commerce)</option>
                <option value="Arts">মানবিক (Arts)</option>
              </select>
            </div>

            {/* Status Filter */}
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

              {(search || classLevel || group || statusFilter) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setClassLevel('');
                    setGroup('');
                    setStatusFilter('');
                  }}
                  className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                  title="ফিল্টার রিসেট করুন"
                >
                  <FiRefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Students Data Table */}
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
                <TableHead>শিক্ষার্থী</TableHead>
                <TableHead>শ্রেণি ও বিভাগ</TableHead>
                <TableHead>ব্যাচ</TableHead>
                <TableHead>অভিভাবকের ফোন (SMS)</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                <TableHead className="text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length > 0 ? (
                students.map((student) => (
                  <TableRow
                    key={student.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/students/${student.id}`)}
                  >
                    {/* Student Info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-indigo-500 to-indigo-700 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                          {student.nameEn.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {student.nameEn}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono text-indigo-600 font-medium">
                              {student.studentId}
                            </span>
                            {student.nameBn && <span>• {student.nameBn}</span>}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Class & Group */}
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-800">{student.classLevel}</p>
                        <p className="text-xs text-slate-500">{student.group || 'সাধারণ'}</p>
                      </div>
                    </TableCell>

                    {/* Batches */}
                    <TableCell>
                      {student.batchStudents && student.batchStudents.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {student.batchStudents.map((bs, i) => (
                            <Badge key={i} variant="primary" size="sm">
                              {bs.batch?.name || 'অ্যাসাইনড'}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">কোনো ব্যাচে নেই</span>
                      )}
                    </TableCell>

                    {/* Contact */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <FiPhone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-xs">{student.guardianPhone}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{student.fatherName}</p>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={student.isActive ? 'success' : 'danger'}
                        dot
                        size="sm"
                      >
                        {student.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/students/${student.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                        বিস্তারিত
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableEmpty
                  colSpan={6}
                  message="কোনো শিক্ষার্থী পাওয়া যায়নি"
                  description="অনুসন্ধানের মান পরিবর্তন করুন অথবা নতুন শিক্ষার্থী ভর্তি করুন।"
                  action={
                    <Link href="/dashboard/students/add">
                      <Button variant="primary" size="sm" leftIcon={<FiUserPlus />}>
                        নতুন ভর্তি ফরম
                      </Button>
                    </Link>
                  }
                />
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              totalItems={meta.total}
              pageSize={meta.limit}
              onPageChange={(page) => fetchStudents(page)}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
