'use client';

import React from 'react';
import { cn } from '../../lib/utils';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  totalItems?: number;
  pageSize?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  totalItems,
  pageSize,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Generate page numbers
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2',
        className,
      )}
    >
      {totalItems !== undefined && (
        <p className="text-xs sm:text-sm text-slate-500">
          মোট <span className="font-semibold text-slate-900">{totalItems}</span> টির মধ্যে{' '}
          <span className="font-semibold text-slate-900">
            {pageSize ? (currentPage - 1) * pageSize + 1 : 1}
          </span>{' '}
          থেকে{' '}
          <span className="font-semibold text-slate-900">
            {pageSize ? Math.min(currentPage * pageSize, totalItems) : totalItems}
          </span>{' '}
          দেখানো হচ্ছে
        </p>
      )}

      <div className="flex items-center space-x-1">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="পূর্ববর্তী পাতা"
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        {pages.map((p, idx) =>
          typeof p === 'number' ? (
            <button
              key={idx}
              onClick={() => onPageChange(p)}
              className={cn(
                'min-w-8 h-8 px-2 flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-all duration-150',
                p === currentPage
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
              )}
            >
              {p}
            </button>
          ) : (
            <span key={idx} className="px-2 text-slate-400 select-none text-xs">
              ...
            </span>
          ),
        )}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="পরবর্তী পাতা"
        >
          <FiChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
