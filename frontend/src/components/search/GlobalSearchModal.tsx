'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { useDebounce } from '../../hooks/useDebounce';
import {
  FiSearch,
  FiX,
  FiUsers,
  FiUserCheck,
  FiLayers,
  FiFileText,
  FiBell,
  FiDollarSign,
  FiArrowRight,
  FiCornerDownLeft,
} from 'react-icons/fi';
import { Spinner } from '../ui/Loader';
import { Badge } from '../ui/Badge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    students: any[];
    teachers: any[];
    batches: any[];
    exams: any[];
    notices: any[];
    fees: any[];
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
      setResults(null);
    }
  }, [isOpen]);

  // Execute Search
  const executeSearch = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.get('/search', { params: { q: q.trim() } });
      setResults(res.data?.results || null);
    } catch (err) {
      console.error('Global search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    executeSearch(debouncedSearch);
  }, [debouncedSearch, executeSearch]);

  // Handle item click / navigate
  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  // Keyboard shortcut listener (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalHits =
    (results?.students?.length || 0) +
    (results?.teachers?.length || 0) +
    (results?.batches?.length || 0) +
    (results?.exams?.length || 0) +
    (results?.notices?.length || 0) +
    (results?.fees?.length || 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-12 sm:pt-20 px-4 animate-fadeIn">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Command Palette Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-scaleUp">
        {/* Search Bar Input */}
        <div className="relative flex items-center border-b border-slate-100 p-4 sm:p-5">
          <FiSearch className="w-5 h-5 text-indigo-600 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="ছাত্র, শিক্ষক, ব্যাচ, পরীক্ষা, নোটিশ বা মানি রসিদ খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-hidden"
          />

          {isLoading ? (
            <Spinner size="sm" className="text-indigo-600 shrink-0" />
          ) : searchTerm ? (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <FiX className="w-4 h-4" />
            </button>
          ) : (
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 text-slate-500 rounded-md border border-slate-200">
              ESC
            </span>
          )}
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-thin">
          {/* Empty search: Quick Links */}
          {!searchTerm.trim() && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                কুইক নেভিগেশন ও শর্টকাট
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { label: 'শিক্ষার্থী তালিকা', href: '/students', icon: <FiUsers className="text-indigo-600" /> },
                  { label: 'ফি আদায় গ্রহণ', href: '/accounts/collect', icon: <FiDollarSign className="text-emerald-600" /> },
                  { label: 'হাজিরা রেজিস্টার', href: '/attendance', icon: <FiFileText className="text-amber-600" /> },
                  { label: 'এসএমএস পাঠান', href: '/sms/send', icon: <FiBell className="text-purple-600" /> },
                  { label: 'পরীক্ষা তালিকা', href: '/exams', icon: <FiLayers className="text-rose-600" /> },
                  { label: 'রিপোর্ট হাব', href: '/reports', icon: <FiArrowRight className="text-indigo-600" /> },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleNavigate(item.href)}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 border border-slate-100 transition-all text-left text-xs font-semibold text-slate-800"
                  >
                    <span className="p-1.5 rounded-lg bg-white shadow-2xs">
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Searched but No Results */}
          {searchTerm.trim().length >= 2 && !isLoading && totalHits === 0 && (
            <div className="py-12 text-center space-y-2">
              <FiSearch className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">কোনো ফলাফল পাওয়া যায়নি</p>
              <p className="text-xs text-slate-400">
                "{searchTerm}"-এর সাথে মিলে এমন কোনো শিক্ষার্থী, শিক্ষক বা ব্যাচ পাওয়া যায়নি।
              </p>
            </div>
          )}

          {/* 1. Students Results */}
          {results?.students && results.students.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <FiUsers className="w-3.5 h-3.5" /> শিক্ষার্থী ({results.students.length})
              </span>
              <div className="space-y-1.5">
                {results.students.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleNavigate(`/students/${s.id}`)}
                    className="p-3 bg-slate-50 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors flex items-center justify-between border border-transparent hover:border-indigo-100"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">
                        {s.nameBn || s.nameEn}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {s.studentId} • {s.classLevel} • {s.phone || s.guardianPhone || 'ফোন নেই'}
                      </span>
                    </div>
                    <FiArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Teachers Results */}
          {results?.teachers && results.teachers.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                <FiUserCheck className="w-3.5 h-3.5" /> শিক্ষক ({results.teachers.length})
              </span>
              <div className="space-y-1.5">
                {results.teachers.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleNavigate(`/teachers/${t.id}`)}
                    className="p-3 bg-slate-50 hover:bg-purple-50 rounded-xl cursor-pointer transition-colors flex items-center justify-between border border-transparent hover:border-purple-100"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">
                        {t.nameBn || t.nameEn}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {t.teacherId} • {t.designation || 'শিক্ষক'} • {t.phone}
                      </span>
                    </div>
                    <FiArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Batches Results */}
          {results?.batches && results.batches.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <FiLayers className="w-3.5 h-3.5" /> ব্যাচ ও ক্লাস ({results.batches.length})
              </span>
              <div className="space-y-1.5">
                {results.batches.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => handleNavigate(`/batches/${b.id}`)}
                    className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl cursor-pointer transition-colors flex items-center justify-between border border-transparent hover:border-emerald-100"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{b.name}</span>
                      <span className="text-[11px] text-slate-500">
                        {b.classLevel} • শিক্ষাবর্ষ {b.year}
                      </span>
                    </div>
                    <FiArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Exams Results */}
          {results?.exams && results.exams.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <FiFileText className="w-3.5 h-3.5" /> পরীক্ষা ({results.exams.length})
              </span>
              <div className="space-y-1.5">
                {results.exams.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => handleNavigate(`/exams/${ex.id}/marks`)}
                    className="p-3 bg-slate-50 hover:bg-amber-50 rounded-xl cursor-pointer transition-colors flex items-center justify-between border border-transparent hover:border-amber-100"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{ex.name}</span>
                      <span className="text-[11px] text-slate-500">
                        {ex.subject?.name} • {ex.batch?.name}
                      </span>
                    </div>
                    <FiArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Notices Results */}
          {results?.notices && results.notices.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                <FiBell className="w-3.5 h-3.5" /> নোটিশ ({results.notices.length})
              </span>
              <div className="space-y-1.5">
                {results.notices.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNavigate('/notices')}
                    className="p-3 bg-slate-50 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors flex items-center justify-between border border-transparent hover:border-rose-100"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{n.title}</span>
                      <span className="text-[11px] text-slate-500">
                        প্রায়োরিটি: {n.priority}
                      </span>
                    </div>
                    <FiArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Fees Results */}
          {results?.fees && results.fees.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <FiDollarSign className="w-3.5 h-3.5" /> মানি রসিদ ({results.fees.length})
              </span>
              <div className="space-y-1.5">
                {results.fees.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => handleNavigate('/accounts')}
                    className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl cursor-pointer transition-colors flex items-center justify-between border border-transparent hover:border-emerald-100"
                  >
                    <div>
                      <span className="font-mono font-bold text-indigo-600 text-xs block">
                        {f.receiptNo}
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {f.student?.nameBn || f.student?.nameEn} • পরিশোধিত: ৳{f.paidAmount}
                      </span>
                    </div>
                    <FiArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>ক্লিক করে পেজে প্রবেশ করুন</span>
          </div>
          <span>উত্তরণ স্মার্ট গ্লোবাল সার্চ</span>
        </div>
      </div>
    </div>
  );
}
