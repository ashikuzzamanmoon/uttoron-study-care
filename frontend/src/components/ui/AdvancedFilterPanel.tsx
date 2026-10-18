'use client';

import React, { useState } from 'react';
import { Card, CardBody } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { FiFilter, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';

interface AdvancedFilterPanelProps {
  title?: string;
  activeCount?: number;
  onClearAll?: () => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AdvancedFilterPanel({
  title = 'উন্নত ফিল্টার ও সার্চ প্যানেল (Advanced Filters)',
  activeCount = 0,
  onClearAll,
  defaultOpen = false,
  children,
  className = '',
}: AdvancedFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={`border-slate-200 shadow-xs transition-all ${className}`}>
      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-3">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <FiFilter className="w-4 h-4" />
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-800">
            {title}
          </span>
          {activeCount > 0 && (
            <Badge variant="primary" size="sm" className="bg-indigo-600 text-white font-bold">
              {activeCount}টি ফিল্টার প্রয়োগ করা হয়েছে
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
            >
              <FiX className="w-3.5 h-3.5" />
              ফিল্টার মুছুন
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
          >
            {isOpen ? (
              <>
                <span className="hidden sm:inline">সংকোচন করুন</span>
                <FiChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span className="hidden sm:inline">ফিল্টারসমূহ খুলুন</span>
                <FiChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Filter Body */}
      {isOpen && (
        <CardBody className="p-4 sm:p-5 bg-white space-y-4 animate-scaleUp">
          {children}
        </CardBody>
      )}
    </Card>
  );
}
