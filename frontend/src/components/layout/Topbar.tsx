'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Breadcrumb } from './Breadcrumb';
import {
  FiMenu,
  FiBell,
  FiSearch,
  FiUser,
  FiKey,
  FiLogOut,
  FiChevronDown,
  FiCheckCircle,
} from 'react-icons/fi';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { GlobalSearchModal } from '../search/GlobalSearchModal';

interface TopbarProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Ctrl+K or Cmd+K Global Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    try {
      setIsSubmittingPassword(true);
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! পুনরায় লগইন করুন।');
      setIsChangePasswordOpen(false);
      logout();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে',
      );
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'সুপার অ্যাডমিন';
      case 'ADMIN':
        return 'অ্যাডমিন';
      case 'TEACHER':
        return 'শিক্ষক';
      case 'STAFF':
        return 'কর্মকর্তা';
      case 'STUDENT':
        return 'শিক্ষার্থী';
      default:
        return role || 'ইউজার';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between transition-all">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
          title="মেনু খুলুন/বন্ধ করুন"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Right: Search, Notifications & User Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Trigger Button */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="relative flex items-center justify-between w-48 sm:w-64 lg:w-72 px-3 py-1.5 text-xs bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/60 rounded-xl text-slate-500 hover:text-slate-800 transition-all text-left group"
        >
          <div className="flex items-center gap-2 truncate">
            <FiSearch className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            <span className="truncate">খুঁজুন (Search)...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white border border-slate-200 text-slate-500 rounded-md shadow-2xs">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        {/* Academic Year Badge */}
        <div className="hidden lg:block">
          <Badge variant="primary" size="sm">
            শিক্ষাবর্ষ ২০২৬
          </Badge>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative focus:outline-none"
            title="নোটিফিকেশন"
          >
            <FiBell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-scaleUp">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">
                  বিজ্ঞপ্তি ও সতর্কতা
                </h4>
                <span className="text-[11px] text-indigo-600 font-medium">
                  সবগুলো চিহ্নিত করুন
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                <div className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <p className="text-xs font-semibold text-slate-800">
                    আজকের উপস্থিতি গ্রহণ সম্পন্ন হয়েছে
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ১০ম শ্রেণি (ব্যাচ এ) এর মোট ৩৫ জন উপস্থিত।
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    ১০ মিনিট আগে
                  </span>
                </div>
                <div className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <p className="text-xs font-semibold text-slate-800">
                    এসএমএস ক্যাম্পেইন পাঠানো হয়েছে
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ফ্রি ক্লাসের জন্য ২৫০টি নম্বরে সফলভাবে পাঠানো হয়েছে।
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    ১ ঘণ্টা আগে
                  </span>
                </div>
              </div>
              <div className="px-4 pt-2 border-t border-slate-100 text-center">
                <Link
                  href="/dashboard/notices"
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  সকল নোটিশ দেখুন →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {user?.username || 'অ্যাডমিন'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {getRoleLabel(user?.role)}
              </p>
            </div>
            <FiChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-scaleUp">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">
                  {user?.username}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user?.email || 'admin@uttoron.edu.bd'}
                </p>
                <div className="mt-1.5">
                  <Badge variant="primary" size="sm">
                    {getRoleLabel(user?.role)}
                  </Badge>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <FiUser className="w-4 h-4 text-slate-400" />
                  আমার প্রোফাইল
                </Link>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left"
                >
                  <FiKey className="w-4 h-4 text-slate-400" />
                  পাসওয়ার্ড পরিবর্তন
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <FiLogOut className="w-4 h-4" />
                  লগআউট
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        title="পাসওয়ার্ড পরিবর্তন করুন"
        description="আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে শক্তিশালী পাসওয়ার্ড ব্যবহার করুন।"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="বর্তমান পাসওয়ার্ড"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="আপনার বর্তমান পাসওয়ার্ড"
            required
          />

          <Input
            label="নতুন পাসওয়ার্ড"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড"
            required
          />

          <Input
            label="নতুন পাসওয়ার্ড নিশ্চিত করুন"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="পুনরায় নতুন পাসওয়ার্ড লিখুন"
            required
          />

          <div className="pt-4 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsChangePasswordOpen(false)}
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingPassword}
            >
              পাসওয়ার্ড সেভ করুন
            </Button>
          </div>
        </form>
      </Modal>

      {/* Global Search Spotlight Command Palette Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
}
