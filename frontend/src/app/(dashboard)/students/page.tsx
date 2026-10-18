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
  FiUploadCloud,
  FiEye,
  FiPhone,
  FiX,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertTriangle,
  FiFileText,
} from 'react-icons/fi';
import { Modal } from '../../../components/ui/Modal';
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

  // Import from Excel states
  const [showImportModal, setShowImportModal] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Fetch batches when import modal opens
  useEffect(() => {
    if (showImportModal && batches.length === 0) {
      api
        .get('/batches')
        .then((res) => {
          setBatches(res.data?.data || res.data || []);
        })
        .catch(() => {});
    }
  }, [showImportModal, batches.length]);

  const handleDownloadSampleTemplate = () => {
    const sampleRows = [
      {
        'Name (English) *': 'Tanvir Ahmed',
        'Name (Bangla)': 'তানভীর আহমেদ',
        'Gender (MALE/FEMALE) *': 'MALE',
        'Class Level *': 'Class 10',
        'Group': 'Science',
        'Father Name *': 'Md. Rafiqul Islam',
        'Guardian Phone *': '01812345678',
        'Father Phone': '01812345678',
        'Mother Name': 'Nasima Begum',
        'Present Address': 'House 12, Road 4, Dhanmondi, Dhaka',
        'Monthly Fee': 1200,
        'Admission Fee': 500,
        'Roll Number': 1,
      },
      {
        'Name (English) *': 'Sadia Sultana',
        'Name (Bangla)': 'সাদিয়া সুলতানা',
        'Gender (MALE/FEMALE) *': 'FEMALE',
        'Class Level *': 'Class 10',
        'Group': 'Science',
        'Father Name *': 'Anwar Hossain',
        'Guardian Phone *': '01712345679',
        'Father Phone': '01712345679',
        'Mother Name': 'Shirin Akhter',
        'Present Address': 'Mirpur-10, Dhaka',
        'Monthly Fee': 1200,
        'Admission Fee': 500,
        'Roll Number': 2,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students Template');
    XLSX.writeFile(workbook, 'Uttoron_Student_Import_Template.xlsx');
    toast.success('নমুনা এক্সেল টেমপ্লেট ডাউনলোড হয়েছে');
  };

  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          setFileError('এক্সেল ফাইলে কোনো ডাটা পাওয়া যায়নি।');
          return;
        }

        const validated = rawJson.map((row, idx) => {
          const findVal = (keys: string[]) => {
            for (const k of Object.keys(row)) {
              const lower = k.toLowerCase().trim();
              if (keys.some((cand) => lower.includes(cand))) {
                return row[k];
              }
            }
            return undefined;
          };

          const nameEn = String(findVal(['english', 'nameen', 'name en', 'name']) || '').trim();
          const nameBn = String(findVal(['bangla', 'namebn', 'নাম']) || '').trim();
          let gender = String(findVal(['gender', 'লিঙ্গ', 'sex']) || '').toUpperCase().trim();
          if (gender.includes('FEMALE') || gender.includes('মহিলা') || gender.includes('মেয়ে') || gender.includes('মেয়ে')) {
            gender = 'FEMALE';
          } else {
            gender = 'MALE';
          }

          const classLevel = String(findVal(['class', 'শ্রেণি', 'শ্রেণী', 'level']) || 'Class 10').trim();
          const group = String(findVal(['group', 'বিভাগ']) || '').trim();
          const fatherName = String(findVal(['father', 'পিতা', 'পিতার']) || '').trim();
          const rawPhone = String(findVal(['guardian', 'mobile', 'phone', 'মোবাইল', 'ফোন', 'যোগাযোগ']) || '').trim();
          const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
          const fatherPhone = String(findVal(['fatherphone', 'পিতার ফোন']) || '').trim();
          const motherName = String(findVal(['mother', 'মাতা', 'মাতার']) || '').trim();
          const presentAddress = String(findVal(['address', 'ঠিকানা']) || '').trim();
          const monthlyFee = Number(findVal(['monthly', 'মাসিক']) || 0);
          const admissionFee = Number(findVal(['admission', 'ভর্তি']) || 0);
          const rollNumber = Number(findVal(['roll', 'রোল']) || idx + 1);

          const errors: string[] = [];
          if (!nameEn) errors.push('ইংরেজি নাম আবশ্যক');
          if (!cleanPhone || cleanPhone.length < 11) errors.push('১১ ডিজিটের মোবাইল নম্বর আবশ্যক');

          return {
            rowNumber: idx + 1,
            nameEn,
            nameBn,
            gender,
            classLevel,
            group,
            fatherName: fatherName || (nameEn ? `${nameEn}'s Father` : ''),
            guardianPhone: cleanPhone,
            fatherPhone,
            motherName,
            presentAddress,
            monthlyFee,
            admissionFee,
            rollNumber,
            isValid: errors.length === 0,
            errors,
          };
        });

        setParsedRows(validated);
      } catch (err: any) {
        setFileError('এক্সেল ফাইল পার্স করতে ত্রুটি হয়েছে: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    const validStudents = parsedRows
      .filter((r) => r.isValid)
      .map((r) => ({
        nameEn: r.nameEn,
        nameBn: r.nameBn || undefined,
        gender: r.gender,
        classLevel: r.classLevel,
        group: r.group || undefined,
        fatherName: r.fatherName,
        guardianPhone: r.guardianPhone,
        fatherPhone: r.fatherPhone || undefined,
        motherName: r.motherName || undefined,
        presentAddress: r.presentAddress || undefined,
        monthlyFee: r.monthlyFee,
        admissionFee: r.admissionFee,
        rollNumber: r.rollNumber,
      }));

    if (validStudents.length === 0) {
      toast.error('ইম্পোর্ট করার মতো কোনো সঠিক শিক্ষার্থী রেকর্ড পাওয়া যায়নি');
      return;
    }

    try {
      setIsImporting(true);
      const res = await api.post('/students/bulk-import', {
        students: validStudents,
        defaultBatchId: selectedBatchId || undefined,
      });

      toast.success(res.data?.message || 'শিক্ষার্থীদের সফলভাবে ডাটাবেজে ইম্পোর্ট করা হয়েছে');
      setShowImportModal(false);
      setParsedRows([]);
      fetchStudents(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'ইম্পোর্ট করতে সমস্যা হয়েছে');
    } finally {
      setIsImporting(false);
    }
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

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5"
          >
            <FiDownload className="w-4 h-4 text-emerald-600" />
            এক্সেল এক্সপোর্ট
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 border-emerald-300 hover:bg-emerald-50 text-emerald-700"
          >
            <FiUploadCloud className="w-4 h-4 text-emerald-600" />
            এক্সেল ইম্পোর্ট
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

      {/* Excel Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          if (!isImporting) {
            setShowImportModal(false);
            setParsedRows([]);
            setFileError(null);
          }
        }}
        title="এক্সেল ফাইল থেকে বাল্ক শিক্ষার্থী ইম্পোর্ট"
        description="কম্পিউটার থেকে এক্সেল (.xlsx, .xls) ফাইল আপলোড করে একাধিক শিক্ষার্থীর ডাটা একসাথে কোচিং সিস্টেমে যুক্ত করুন"
        size="full"
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
            <div className="text-xs text-slate-500">
              {parsedRows.length > 0 ? (
                <span>
                  সঠিক রেকর্ড:{' '}
                  <strong className="text-emerald-700">
                    {parsedRows.filter((r) => r.isValid).length}
                  </strong>{' '}
                  | ত্রুটি:{' '}
                  <strong className="text-rose-700">
                    {parsedRows.filter((r) => !r.isValid).length}
                  </strong>
                </span>
              ) : (
                'ফাইল আপলোড করে প্রিভিউ দেখুন'
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setShowImportModal(false);
                  setParsedRows([]);
                  setFileError(null);
                }}
                disabled={isImporting}
              >
                বাতিল
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmImport}
                disabled={
                  isImporting ||
                  parsedRows.length === 0 ||
                  parsedRows.filter((r) => r.isValid).length === 0
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Spinner size="sm" className="text-white" />
                    ইম্পোর্ট হচ্ছে...
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="w-4 h-4" />
                    {parsedRows.filter((r) => r.isValid).length > 0
                      ? `${parsedRows.filter((r) => r.isValid).length} জন শিক্ষার্থী ইম্পোর্ট করুন`
                      : 'ইম্পোর্ট নিশ্চিত করুন'}
                  </>
                )}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Top Info & Template Download Box */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
            <div>
              <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                <FiFileText className="w-4 h-4 text-emerald-600" />
                এক্সেল ফরম্যাট নির্দেশিকা
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                ফাইলে অন্তত <strong>Name (English)</strong> ও <strong>Guardian Phone (১১ ডিজিট)</strong> হেডার থাকা আবশ্যক।
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadSampleTemplate}
              className="bg-white hover:bg-emerald-100/50 border-emerald-300 text-emerald-800 font-bold shrink-0 shadow-xs"
            >
              <FiDownload className="w-3.5 h-3.5 mr-1 text-emerald-700" />
              নমুনা এক্সেল ডাউনলোড (.xlsx)
            </Button>
          </div>

          {/* Upload Drop Area & Batch Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                আপনার তৈরি করা এক্সেল ফাইল বেছে নিন (.xlsx, .xls, .csv)
              </label>
              <div className="relative border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FiUploadCloud className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">
                  ফাইল এখানে টেনে আনুন অথবা ক্লিক করে আপলোড করুন
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  সমর্থিত ফাইল ফরম্যাট: .xlsx, .xls, .csv (সর্বোচ্চ ৫ মেগাবাইট)
                </p>
              </div>
              {fileError && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <FiAlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {fileError}
                </p>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ডিফল্ট ব্যাচ অ্যাসাইন (ঐচ্ছিক)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  ইম্পোর্টকৃত শিক্ষার্থীদের সরাসরি কোনো নির্দিষ্ট ব্যাচে যুক্ত করতে চাইলে নির্বাচন করুন:
                </p>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">কোনো ব্যাচ নয় (শুধুমাত্র ভর্তি)</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.classLevel || 'সকল'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px] text-slate-500">
                💡 প্রতিটি শিক্ষার্থীর জন্য সিস্টেম স্বয়ংক্রিয়ভাবে ইউনিক স্টুডেন্ট আইডি (যেমনঃ <span className="font-mono font-bold text-slate-700">USC-{new Date().getFullYear()}-XXXX</span>) তৈরি করে নেবে।
              </div>
            </div>
          </div>

          {/* Validation & Live Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                  ফাইল প্রিভিউ ও ডাটা ভ্যালিডেশন ({parsedRows.length} টি রেকর্ড)
                </h4>
                <div className="flex items-center gap-2">
                  <Badge variant="success">
                    {parsedRows.filter((r) => r.isValid).length} বৈধ
                  </Badge>
                  {parsedRows.filter((r) => !r.isValid).length > 0 && (
                    <Badge variant="danger">
                      {parsedRows.filter((r) => !r.isValid).length} ত্রুটিযুক্ত
                    </Badge>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-2xl shadow-inner">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">স্ট্যাটাস</th>
                      <th className="py-2 px-3">নাম (ইংরেজি)</th>
                      <th className="py-2 px-3">শ্রেণি</th>
                      <th className="py-2 px-3">পিতার নাম</th>
                      <th className="py-2 px-3">অভিভাবকের ফোন</th>
                      <th className="py-2 px-3">মাসিক ফি</th>
                      <th className="py-2 px-3">মন্তব্য / ত্রুটি</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50 hover:bg-rose-50'}
                      >
                        <td className="py-2 px-3 text-slate-400 font-mono">{row.rowNumber}</td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                              <FiCheckCircle className="w-3 h-3" /> সঠিক
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                              <FiAlertTriangle className="w-3 h-3" /> ভুল
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {row.nameEn || <span className="text-rose-500 italic">অনুপস্থিত</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{row.classLevel}</td>
                        <td className="py-2 px-3 text-slate-600">{row.fatherName || '-'}</td>
                        <td className="py-2 px-3 font-mono font-medium text-slate-700">
                          {row.guardianPhone || <span className="text-rose-500 italic">অনুপস্থিত</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-600 font-mono">৳{row.monthlyFee}</td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="text-emerald-600 text-[11px]">ইম্পোর্ট যোগ্য</span>
                          ) : (
                            <span className="text-rose-600 text-[11px] font-semibold">
                              {row.errors.join(', ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>
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
