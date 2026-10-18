'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../../../context/AuthContext';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { FiUser, FiLock, FiAlertCircle, FiArrowRight } from 'react-icons/fi';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('ইউজারনেম এবং পাসওয়ার্ড উভয়ই প্রয়োজনীয়');
      return;
    }

    setIsLoading(true);
    const success = await login(username.trim(), password);
    if (!success) {
      setError('ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    }
    setIsLoading(false);
  };

  const handleDemoFill = () => {
    setUsername('admin');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="w-full">
      {/* Login Card */}
      <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-indigo-950/50 overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-emerald-500" />

        {/* Brand & Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex p-2 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
            <Image
              src="/logo.jpg"
              alt="উত্তরণ স্টাডি কেয়ার"
              width={64}
              height={64}
              className="rounded-xl object-contain"
              priority
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              উত্তরণ স্টাডি কেয়ার
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              কোচিং ম্যানেজমেন্ট ও স্মার্ট এসএমএস পোর্টাল
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs sm:text-sm animate-fadeIn">
            <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              ইউজারনেম
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FiUser className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ইউজারনেম লিখুন (যেমন: admin)"
                disabled={isLoading}
                required
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-800/90 border border-slate-700/80 text-white rounded-xl placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              পাসওয়ার্ড
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FiLock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="আপনার গোপন পাসওয়ার্ড"
                disabled={isLoading}
                required
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-800/90 border border-slate-700/80 text-white rounded-xl placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full py-3.5 bg-linear-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-semibold shadow-lg shadow-indigo-600/30"
            rightIcon={<FiArrowRight className="w-4 h-4" />}
          >
            লগইন করুন
          </Button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400 mb-2">
            দ্রুত পরীক্ষার জন্য ডিফল্ট ক্রেডেনশিয়াল:
          </p>
          <button
            type="button"
            onClick={handleDemoFill}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 text-xs hover:bg-indigo-900/60 transition-colors"
          >
            <span className="font-semibold">admin</span> / <span className="font-semibold">admin123</span>
            <span className="text-[10px] text-indigo-400 underline">(ক্লিক করে পূরণ করুন)</span>
          </button>
        </div>
      </div>

      {/* Footer Copyright */}
      <p className="text-center text-xs text-slate-500 mt-6">
        © ২০২৫ উত্তরণ স্টাডি কেয়ার। সর্বস্বত্ব সংরক্ষিত।
      </p>
    </div>
  );
}
