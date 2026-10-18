'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { Subject } from '../../../../types';
import { Card, CardBody, CardHeader } from '../../../../components/ui/Card';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';
import {
  FiArrowLeft,
  FiCheck,
  FiBook,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AddTeacherPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    nameEn: '',
    nameBn: '',
    gender: 'MALE',
    dateOfBirth: '',
    phone: '',
    email: '',
    nidNumber: '',
    designation: 'সিনিয়র শিক্ষক (Senior Teacher)',
    qualification: '',
    specialization: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    monthlySalary: 25000,
    address: '',
  });

  useEffect(() => {
    // Fetch available subjects to assign
    api
      .get('/subjects', { params: { limit: 50, isActive: true } })
      .then((res) => {
        const list = res.data?.data || res.data;
        setAvailableSubjects(list || []);
      })
      .catch(() => {
        // Graceful fallback
      });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleToggleSubject = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nameEn.trim()) {
      toast.error('শিক্ষকের ইংরেজি নাম আবশ্যক');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('মোবাইল নম্বর আবশ্যক');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Record<string, any> = {
        ...formData,
        monthlySalary: Number(formData.monthlySalary),
        dateOfBirth: formData.dateOfBirth || undefined,
        subjectIds: selectedSubjectIds,
      };

      const res = await api.post('/teachers', payload);
      const teacher = res.data?.data || res.data;

      toast.success(
        `শিক্ষক সফলভাবে নিবন্ধিত হয়েছেন! আইডি: ${teacher.teacherId}`,
      );
      router.push('/dashboard/teachers');
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'শিক্ষক নিবন্ধন ব্যর্থ হয়েছে',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/teachers"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            নতুন শিক্ষক নিবন্ধন ফরম
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            শিক্ষকের ব্যক্তিগত তথ্য, শিক্ষাগত যোগ্যতা ও পাঠদানের বিষয় নির্বাচন করুন
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal Info */}
        <Card>
          <CardHeader title="১. ব্যক্তিগত তথ্য" subtitle="যোগাযোগ ও পরিচিতি" />
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="শিক্ষকের নাম (ইংরেজি)"
              name="nameEn"
              value={formData.nameEn}
              onChange={handleChange}
              placeholder="e.g. Dr. Rafiqul Islam"
              required
            />

            <Input
              label="নাম (বাংলা)"
              name="nameBn"
              value={formData.nameBn}
              onChange={handleChange}
              placeholder="যেমন: ড. রফিকুল ইসলাম"
            />

            <Select
              label="জেন্ডার / লিঙ্গ"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={[
                { label: 'পুরুষ (Male)', value: 'MALE' },
                { label: 'মহিলা (Female)', value: 'FEMALE' },
                { label: 'অন্যান্য (Other)', value: 'OTHER' },
              ]}
              required
            />

            <Input
              label="মোবাইল নম্বর"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="01XXXXXXXXX"
              required
            />

            <Input
              label="ইমেইল অ্যাড্রেস"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="teacher@example.com"
            />

            <Input
              label="জাতীয় পরিচয়পত্র নং (NID)"
              name="nidNumber"
              value={formData.nidNumber}
              onChange={handleChange}
              placeholder="ঐচ্ছিক"
            />
          </CardBody>
        </Card>

        {/* Section 2: Professional Info */}
        <Card>
          <CardHeader title="২. পেশাগত ও একাডেমিক তথ্য" subtitle="পদবি, ডিগ্রি ও বেতন কাঠামো" />
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="পদবি (Designation)"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              placeholder="যেমন: সিনিয়র প্রভাষক"
            />

            <Input
              label="শিক্ষাগত যোগ্যতা (Degree)"
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
              placeholder="যেমন: M.Sc in Physics (DU)"
            />

            <Input
              label="বিশেষ পারদর্শিতা / বিষয়"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              placeholder="যেমন: পদার্থবিজ্ঞান, উচ্চতর গণিত"
            />

            <Input
              label="যোগদানের তারিখ"
              name="joiningDate"
              type="date"
              value={formData.joiningDate}
              onChange={handleChange}
            />

            <Input
              label="মাসিক সম্মানী / বেতন (টাকা)"
              name="monthlySalary"
              type="number"
              value={formData.monthlySalary}
              onChange={handleChange}
              placeholder="25000"
            />

            <Input
              label="ঠিকানা"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="বাসা, রোড, থানা, জেলা"
            />
          </CardBody>
        </Card>

        {/* Section 3: Subject Assignment */}
        <Card>
          <CardHeader
            title="৩. পাঠদানের বিষয় নির্বাচন (Assigned Subjects)"
            subtitle="এই শিক্ষক যে বিষয়গুলোতে ক্লাস নেবেন তা সিলেক্ট করুন"
          />
          <CardBody>
            {availableSubjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableSubjects.map((subject) => {
                  const isChecked = selectedSubjectIds.includes(subject.id);
                  return (
                    <label
                      key={subject.id}
                      onClick={() => handleToggleSubject(subject.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{subject.name}</p>
                        <p className="text-xs text-slate-500 font-mono">কোড: {subject.code}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic py-2">
                কোনো বিষয় পাওয়া যায়নি। পূর্বে সিড করা সাবজেক্ট লোড হচ্ছে...
              </p>
            )}
          </CardBody>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link href="/dashboard/teachers">
            <Button type="button" variant="secondary" size="lg">
              বাতিল
            </Button>
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            leftIcon={<FiCheck />}
          >
            শিক্ষক নিবন্ধন নিশ্চিত করুন
          </Button>
        </div>
      </form>
    </div>
  );
}
