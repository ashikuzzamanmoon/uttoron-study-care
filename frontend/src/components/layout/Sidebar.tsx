'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import {
  FiHome,
  FiUsers,
  FiUserCheck,
  FiLayers,
  FiCalendar,
  FiCheckSquare,
  FiFileText,
  FiDollarSign,
  FiMessageSquare,
  FiBell,
  FiBarChart2,
  FiSettings,
  FiChevronDown,
  FiChevronRight,
  FiBookOpen,
  FiPrinter,
  FiX,
} from 'react-icons/fi';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  href?: string;
  roles?: string[];
  submenu?: Array<{
    title: string;
    href: string;
    roles?: string[];
  }>;
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const userRole = user?.role || 'STAFF';

  // State to manage expanded submenus
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    accounts: pathname.includes('/accounts'),
    sms: pathname.includes('/sms'),
    exams: pathname.includes('/exams') || pathname.includes('/results'),
  });

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const menuItems: MenuItem[] = [
    {
      title: 'ড্যাশবোর্ড',
      icon: <FiHome className="w-5 h-5 shrink-0" />,
      href: '/dashboard',
    },
    {
      title: 'ছাত্র-ছাত্রী',
      icon: <FiUsers className="w-5 h-5 shrink-0" />,
      href: '/dashboard/students',
    },
    {
      title: 'শিক্ষক',
      icon: <FiUserCheck className="w-5 h-5 shrink-0" />,
      href: '/dashboard/teachers',
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      title: 'ব্যাচ ও ক্লাস',
      icon: <FiLayers className="w-5 h-5 shrink-0" />,
      href: '/dashboard/batches',
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      title: 'সাপ্তাহিক রুটিন',
      icon: <FiCalendar className="w-5 h-5 shrink-0" />,
      href: '/dashboard/routine',
    },
    {
      title: 'হাজিরা গ্রহণ',
      icon: <FiCheckSquare className="w-5 h-5 shrink-0" />,
      href: '/dashboard/attendance',
    },
    {
      title: 'পরীক্ষা ও রেজাল্ট',
      icon: <FiFileText className="w-5 h-5 shrink-0" />,
      submenu: [
        { title: 'পরীক্ষা তালিকা', href: '/dashboard/exams' },
        { title: 'রেজাল্ট ও মেরিট লিস্ট', href: '/dashboard/results' },
      ],
    },
    {
      title: 'হিসাব-নিকাশ',
      icon: <FiDollarSign className="w-5 h-5 shrink-0" />,
      roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
      submenu: [
        { title: 'ফি আদায় ও সারসংক্ষেপ', href: '/dashboard/accounts' },
        { title: 'বকেয়া তালিকা', href: '/dashboard/accounts/dues' },
        { title: 'ব্যয় হিসাব', href: '/dashboard/accounts/expenses' },
        { title: 'আর্থিক রিপোর্ট', href: '/dashboard/accounts/reports' },
      ],
    },
    {
      title: 'এসএমএস ইঞ্জিন',
      icon: <FiMessageSquare className="w-5 h-5 shrink-0" />,
      roles: ['SUPER_ADMIN', 'ADMIN'],
      submenu: [
        { title: 'এসএমএস পাঠান', href: '/dashboard/sms/send' },
        { title: 'মার্কেটিং ক্যাম্পেইন', href: '/dashboard/sms/campaign' },
        { title: 'এসএমএস টেমপ্লেট', href: '/dashboard/sms/templates' },
        { title: 'মেসেজ হিস্ট্রি', href: '/dashboard/sms/history' },
      ],
    },
    {
      title: 'নোটিশ বোর্ড',
      icon: <FiBell className="w-5 h-5 shrink-0" />,
      href: '/dashboard/notices',
    },
    {
      title: 'রিপোর্ট হাব',
      icon: <FiBarChart2 className="w-5 h-5 shrink-0" />,
      href: '/dashboard/reports',
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      title: 'প্রিন্ট ও ডকুমেন্টস',
      icon: <FiPrinter className="w-5 h-5 shrink-0" />,
      href: '/dashboard/print',
      roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
    },
    {
      title: 'সিস্টেম সেটিংস',
      icon: <FiSettings className="w-5 h-5 shrink-0" />,
      href: '/dashboard/settings',
      roles: ['SUPER_ADMIN'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    if (userRole === 'SUPER_ADMIN') return true;
    return item.roles.includes(userRole);
  });

  const isActiveLink = (href?: string) => {
    if (!href) return false;
    if (href === '/dashboard') return pathname === '/dashboard';
    const altHref = href.startsWith('/dashboard/') ? href.replace('/dashboard', '') : `/dashboard${href}`;
    return pathname.startsWith(href) || pathname.startsWith(altHref);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out border-r border-slate-800 shadow-2xl lg:shadow-none select-none',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/40">
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/30">
              <FiBookOpen className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-white text-sm tracking-tight truncate">
                  উত্তরণ স্টাডি কেয়ার
                </span>
                <span className="text-[10px] text-indigo-400 font-medium tracking-wide uppercase">
                  Coaching Management
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden focus:outline-hidden"
            title="মেনু বন্ধ করুন"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
          {filteredMenuItems.map((item, idx) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const submenuKey = `menu_${idx}`;
            const isSubmenuOpen = openSubmenus[submenuKey] ?? false;
            const isItemActive = hasSubmenu
              ? item.submenu?.some((sub) => {
                  const altSub = sub.href.startsWith('/dashboard/') ? sub.href.replace('/dashboard', '') : `/dashboard${sub.href}`;
                  return pathname.startsWith(sub.href) || pathname.startsWith(altSub);
                })
              : isActiveLink(item.href);

            if (hasSubmenu) {
              return (
                <div key={idx} className="space-y-1">
                  <button
                    onClick={() => toggleSubmenu(submenuKey)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group',
                      isItemActive
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
                      isCollapsed && 'justify-center px-2',
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(isItemActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white')}>
                        {item.icon}
                      </span>
                      {!isCollapsed && <span>{item.title}</span>}
                    </div>
                    {!isCollapsed && (
                      <span className="text-slate-500">
                        {isSubmenuOpen ? (
                          <FiChevronDown className="w-4 h-4" />
                        ) : (
                          <FiChevronRight className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </button>

                  {!isCollapsed && isSubmenuOpen && (
                    <div className="pl-9 pr-2 py-1 space-y-1">
                      {item.submenu?.map((sub, sIdx) => {
                        const altSubHref = sub.href.startsWith('/dashboard/') ? sub.href.replace('/dashboard', '') : `/dashboard${sub.href}`;
                        const isSubActive = pathname === sub.href || pathname === altSubHref;
                        return (
                          <Link
                            key={sIdx}
                            href={sub.href}
                            onClick={onCloseMobile}
                            className={cn(
                              'block px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                              isSubActive
                                ? 'bg-indigo-600 text-white font-semibold'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40',
                            )}
                          >
                            {sub.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={idx}
                href={item.href || '#'}
                onClick={onCloseMobile}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group',
                  isItemActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
                  isCollapsed && 'justify-center px-2',
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <span className={cn(isItemActive ? 'text-white' : 'text-slate-400 group-hover:text-white')}>
                  {item.icon}
                </span>
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </div>

        {/* Footer Collapse Toggle */}
        <div className="hidden lg:flex items-center justify-between p-3 border-t border-slate-800/80 bg-slate-950/40">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
            title={isCollapsed ? 'মেনু প্রসারিত করুন' : 'মেনু সংকুচিত করুন'}
          >
            {isCollapsed ? (
              <FiChevronRight className="w-4 h-4" />
            ) : (
              <>
                <FiChevronRight className="w-4 h-4 rotate-180" />
                <span>সংকুচিত করুন</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
