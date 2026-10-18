'use client';

import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { FiUsers, FiDollarSign, FiCheckSquare, FiCalendar, FiArrowUpRight } from 'react-icons/fi';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'মোট ছাত্র-ছাত্রী',
      value: '১৫০ জন',
      change: '+১২% এই মাসে',
      icon: <FiUsers className="w-6 h-6 text-indigo-600" />,
      bg: 'bg-indigo-50',
      href: '/dashboard/students',
    },
    {
      title: 'আজকের উপস্থিতি',
      value: '৯৪%',
      change: '১৩৮ জন উপস্থিত',
      icon: <FiCheckSquare className="w-6 h-6 text-emerald-600" />,
      bg: 'bg-emerald-50',
      href: '/dashboard/attendance',
    },
    {
      title: 'চলতি মাসের আদায়',
      value: '৳১,২৫,০০০',
      change: 'বকেয়া: ৳৩৫,০০০',
      icon: <FiDollarSign className="w-6 h-6 text-amber-600" />,
      bg: 'bg-amber-50',
      href: '/dashboard/accounts',
    },
    {
      title: 'সক্রিয় ব্যাচ',
      value: '৮টি ব্যাচ',
      change: 'আজ ৪টি ক্লাস বাকি',
      icon: <FiCalendar className="w-6 h-6 text-purple-600" />,
      bg: 'bg-purple-50',
      href: '/dashboard/batches',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-indigo-700 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/15">
        <div className="relative z-10 max-w-2xl space-y-2">
          <Badge variant="primary" className="bg-white/15 text-white border-white/20">
            অ্যাকাডেমিক ম্যানেজমেন্ট সিস্টেম
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            স্বাগতম, {user?.username || 'অ্যাডমিন'}!
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed">
            উত্তরণ স্টাডি কেয়ার কোচিং ম্যানেজমেন্ট সিস্টেম ও স্মার্ট এসএমএস ইঞ্জিনের কেন্দ্রীয় নিয়ন্ত্রণ প্যানেল।
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => (
          <Link key={idx} href={stat.href}>
            <Card hoverEffect className="h-full">
              <CardBody className="flex items-center justify-between p-5">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <FiArrowUpRight className="text-emerald-500" />
                    {stat.change}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  {stat.icon}
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="আজকের ক্লাস সময়সূচী"
            subtitle="চলতি শিডিউল ও ব্যাচ রুটিন"
            action={
              <Link href="/dashboard/routine" className="text-xs font-semibold text-indigo-600 hover:underline">
                সম্পূর্ণ রুটিন →
              </Link>
            }
          />
          <CardBody>
            <div className="space-y-3">
              {[
                { time: '০৩:০০ PM - ০৪:৩০ PM', batch: '১০ম শ্রেণি - ব্যাচ ক (বিজ্ঞান)', subject: 'পদার্থবিজ্ঞান', room: 'রুম ২০২' },
                { time: '০৪:৩০ PM - ০৬:০০ PM', batch: '৯ম শ্রেণি - ব্যাচ খ (সাধারণ)', subject: 'উচ্চতর গণিত', room: 'রুম ২০১' },
                { time: '০৬:০০ PM - ০৭:৩০ PM', batch: 'দ্বাদশ শ্রেণি - এইচএসসি ব্যাচ', subject: 'রসায়ন', room: 'রুম ২০৩' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-900">{item.subject}</p>
                      <p className="text-[11px] text-slate-500">{item.batch}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-600 block">{item.time}</span>
                    <span className="text-[10px] text-slate-400">{item.room}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* SMS Quick Panel */}
        <Card>
          <CardHeader
            title="স্মার্ট এসএমএস কুইক অ্যাকশন"
            subtitle="সরাসরি মেসেজ পাঠানোর অপশন"
          />
          <CardBody className="space-y-3">
            <Link
              href="/dashboard/sms/send"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
            >
              <div>
                <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600">কুইক এসএমএস</p>
                <p className="text-[11px] text-slate-500">ব্যাচ বা নির্দিষ্ট ছাত্র নির্বাচন করুন</p>
              </div>
              <span className="text-slate-400 group-hover:text-indigo-600">→</span>
            </Link>

            <Link
              href="/dashboard/sms/campaign"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
            >
              <div>
                <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600">ফ্রি ক্লাস ক্যাম্পেইন</p>
                <p className="text-[11px] text-slate-500">এক্সেল ফাইল আপলোড করে বাল্ক এসএমএস</p>
              </div>
              <span className="text-slate-400 group-hover:text-indigo-600">→</span>
            </Link>

            <Link
              href="/dashboard/attendance"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
            >
              <div>
                <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600">অনুপস্থিতি অটো-এসএমএস</p>
                <p className="text-[11px] text-slate-500">হাজিরা নেওয়ার সাথে সাথে গার্ডিয়ানকে নোটিশ</p>
              </div>
              <span className="text-slate-400 group-hover:text-indigo-600">→</span>
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
