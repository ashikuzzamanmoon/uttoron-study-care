'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiChevronRight, FiHome } from 'react-icons/fi';

const routeNameMap: Record<string, string> = {
  dashboard: 'ড্যাশবোর্ড',
  students: 'ছাত্র-ছাত্রী',
  add: 'নতুন সংযোজন',
  teachers: 'শিক্ষক',
  batches: 'ব্যাচ ও ক্লাস',
  routine: 'সাপ্তাহিক রুটিন',
  attendance: 'হাজিরা',
  report: 'রিপোর্ট',
  exams: 'পরীক্ষা',
  marks: 'মার্কস এন্ট্রি',
  results: 'ফলাফল',
  accounts: 'হিসাব-নিকাশ',
  collect: 'ফি আদায়',
  dues: 'বকেয়া তালিকা',
  expenses: 'ব্যয় হিসাব',
  sms: 'এসএমএস ইঞ্জিন',
  send: 'এসএমএস পাঠান',
  campaign: 'ক্যাম্পেইন',
  templates: 'টেমপ্লেট',
  history: 'হিস্ট্রি',
  notices: 'নোটিশ বোর্ড',
  reports: 'রিপোর্ট হাব',
  settings: 'সেটিংস',
  profile: 'প্রোফাইল',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')) {
    return (
      <div className="flex items-center text-xs sm:text-sm text-slate-500 font-medium">
        <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">
          <FiHome className="w-3.5 h-3.5" />
          ড্যাশবোর্ড
        </span>
      </div>
    );
  }

  return (
    <nav className="flex items-center text-xs sm:text-sm text-slate-500 font-medium overflow-x-auto whitespace-nowrap py-1">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
      >
        <FiHome className="w-3.5 h-3.5" />
        <span>হোম</span>
      </Link>

      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;
        const displayName = routeNameMap[segment] || segment;

        return (
          <React.Fragment key={href}>
            <FiChevronRight className="w-3.5 h-3.5 mx-2 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="text-slate-900 font-semibold">{displayName}</span>
            ) : (
              <Link href={href} className="hover:text-indigo-600 transition-colors">
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
