'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { Card, CardBody, CardHeader, CardFooter } from '../../../../components/ui/Card';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';
import {
  FiArrowLeft,
  FiUser,
  FiBook,
  FiUsers,
  FiMapPin,
  FiDollarSign,
  FiCheck,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AddStudentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Personal Info
    nameEn: '',
    nameBn: '',
    gender: 'MALE',
    dateOfBirth: '',
    bloodGroup: '',
    phone: '',
    email: '',

    // Academic Info
    instituteName: '',
    classLevel: 'Class 10',
    group: 'Science',
    boardRollNo: '',

    // Guardian Info
    fatherName: '',
    fatherPhone: '',
    motherName: '',
    motherPhone: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: 'Father',

    // Address
    presentAddress: '',
    permanentAddress: '',

    // Fee
    admissionDate: new Date().toISOString().slice(0, 10),
    admissionFee: 1000,
    monthlyFee: 2000,
    discount: 0,
    discountType: 'PERCENTAGE',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nameEn.trim()) {
      toast.error('শিক্ষার্থীর ইংরেজি নাম অবশ্যই দিতে হবে');
      return;
    }
    if (!formData.guardianPhone.trim()) {
      toast.error('অভিভাবকের মোবাইল নম্বর (SMS এর জন্য) আবশ্যক');
      return;
    }
    if (!formData.fatherName.trim()) {
      toast.error('পিতার নাম আবশ্যক');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Record<string, any> = {
        ...formData,
        admissionFee: Number(formData.admissionFee),
        monthlyFee: Number(formData.monthlyFee),
        discount: Number(formData.discount),
        bloodGroup: formData.bloodGroup || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        guardianName: formData.guardianName || formData.fatherName,
      };

      const res = await api.post('/students', payload);
      const student = res.data?.data || res.data;

      toast.success(
        `শিক্ষার্থী সফলভাবে ভর্তি হয়েছে! আইডি: ${student.studentId}`,
      );
      router.push('/dashboard/students');
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'শিক্ষার্থী ভর্তি করতে ব্যর্থ হয়েছে',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/students"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              নতুন শিক্ষার্থী ভর্তি ফরম
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              সকল সঠিক তথ্য পূরণ করে শিক্ষার্থী নিবন্ধন সম্পন্ন করুন
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal Info */}
        <Card>
          <CardHeader
            title="১. ব্যক্তিগত তথ্য"
            subtitle="শিক্ষার্থীর প্রাথমিক পরিচিতি"
          />
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="নাম (ইংরেজি)"
              name="nameEn"
              value={formData.nameEn}
              onChange={handleChange}
              placeholder="e.g. Tanvir Ahmed"
              required
            />

            <Input
              label="নাম (বাংলা)"
              name="nameBn"
              value={formData.nameBn}
              onChange={handleChange}
              placeholder="যেমন: তানভীর আহমেদ"
            />

            <Select
              label="জেন্ডার / লিঙ্গ"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={[
                { label: 'ছাত্র (Male)', value: 'MALE' },
                { label: 'ছাত্রী (Female)', value: 'FEMALE' },
                { label: 'অন্যান্য (Other)', value: 'OTHER' },
              ]}
              required
            />

            <Input
              label="জন্ম তারিখ"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
            />

            <Select
              label="রক্তের গ্রুপ"
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              options={[
                { label: 'রক্তের গ্রুপ নির্বাচন করুন', value: '' },
                { label: 'A Positive (A+)', value: 'A_POSITIVE' },
                { label: 'A Negative (A-)', value: 'A_NEGATIVE' },
                { label: 'B Positive (B+)', value: 'B_POSITIVE' },
                { label: 'B Negative (B-)', value: 'B_NEGATIVE' },
                { label: 'O Positive (O+)', value: 'O_POSITIVE' },
                { label: 'O Negative (O-)', value: 'O_NEGATIVE' },
                { label: 'AB Positive (AB+)', value: 'AB_POSITIVE' },
                { label: 'AB Negative (AB-)', value: 'AB_NEGATIVE' },
              ]}
            />

            <Input
              label="শিক্ষার্থীর নিজস্ব ফোন"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="01XXXXXXXXX"
            />
          </CardBody>
        </Card>

        {/* Section 2: Academic Info */}
        <Card>
          <CardHeader
            title="২. একাডেমিক তথ্য"
            subtitle="পূর্ববর্তী স্কুল/কলেজ ও বর্তমান শ্রেণি"
          />
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="স্কুল বা কলেজের নাম"
                name="instituteName"
                value={formData.instituteName}
                onChange={handleChange}
                placeholder="যেমন: আইডিয়াল স্কুল অ্যান্ড কলেজ"
              />
            </div>

            <Select
              label="শ্রেণি"
              name="classLevel"
              value={formData.classLevel}
              onChange={handleChange}
              options={[
                { label: '৮ম শ্রেণি (Class 8)', value: 'Class 8' },
                { label: '৯ম শ্রেণি (Class 9)', value: 'Class 9' },
                { label: '১০ম শ্রেণি (Class 10)', value: 'Class 10' },
                { label: 'একাদশ শ্রেণি (HSC 1st)', value: 'HSC 1st Year' },
                { label: 'দ্বাদশ শ্রেণি (HSC 2nd)', value: 'HSC 2nd Year' },
              ]}
              required
            />

            <Select
              label="বিভাগ / গ্রুপ"
              name="group"
              value={formData.group}
              onChange={handleChange}
              options={[
                { label: 'বিজ্ঞান (Science)', value: 'Science' },
                { label: 'ব্যবসায় শিক্ষা (Commerce)', value: 'Commerce' },
                { label: 'মানবিক (Arts)', value: 'Arts' },
                { label: 'সাধারণ (General)', value: 'General' },
              ]}
            />

            <Input
              label="বোর্ড রোল / রেজিস্ট্রেশন নং"
              name="boardRollNo"
              value={formData.boardRollNo}
              onChange={handleChange}
              placeholder="ঐচ্ছিক"
            />
          </CardBody>
        </Card>

        {/* Section 3: Guardian Info */}
        <Card>
          <CardHeader
            title="৩. অভিভাবকের তথ্য (এসএমএস যোগাযোগের মূল ঠিকানা)"
            subtitle="অনুপস্থিতি, নোটিশ ও ফলাফলের এসএমএস এই নম্বরে যাবে"
          />
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="পিতার নাম"
              name="fatherName"
              value={formData.fatherName}
              onChange={handleChange}
              placeholder="পিতার নাম লিখুন"
              required
            />

            <Input
              label="পিতার ফোন নম্বর"
              name="fatherPhone"
              value={formData.fatherPhone}
              onChange={handleChange}
              placeholder="01XXXXXXXXX"
            />

            <Input
              label="মাতার নাম"
              name="motherName"
              value={formData.motherName}
              onChange={handleChange}
              placeholder="মাতার নাম লিখুন"
            />

            <div className="sm:col-span-2">
              <Input
                label="অভিভাবকের মোবাইল নম্বর (SMS Notification Number)"
                name="guardianPhone"
                value={formData.guardianPhone}
                onChange={handleChange}
                placeholder="01XXXXXXXXX"
                helperText="হাজিরা ও পরীক্ষার ফলাফল এই নম্বরে স্বয়ংক্রিয়ভাবে যাবে"
                required
              />
            </div>

            <Select
              label="অভিভাবকের সম্পর্ক"
              name="guardianRelation"
              value={formData.guardianRelation}
              onChange={handleChange}
              options={[
                { label: 'পিতা (Father)', value: 'Father' },
                { label: 'মাতা (Mother)', value: 'Mother' },
                { label: 'ভাই / বোন (Sibling)', value: 'Sibling' },
                { label: 'অন্যান্য (Other)', value: 'Other' },
              ]}
            />
          </CardBody>
        </Card>

        {/* Section 4: Address */}
        <Card>
          <CardHeader title="৪. ঠিকানা" subtitle="বর্তমান ও স্থায়ী ঠিকানা" />
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="বর্তমান ঠিকানা"
              name="presentAddress"
              value={formData.presentAddress}
              onChange={handleChange}
              placeholder="বাসা নং, রোড, এলাকা, থানা, জেলা"
            />

            <Input
              label="স্থায়ী ঠিকানা"
              name="permanentAddress"
              value={formData.permanentAddress}
              onChange={handleChange}
              placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা"
            />
          </CardBody>
        </Card>

        {/* Section 5: Admission & Fees */}
        <Card>
          <CardHeader
            title="৫. ভর্তি ও ফি কাঠামো"
            subtitle="ভর্তি তারিখ ও নির্ধারিত ফি"
          />
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="ভর্তির তারিখ"
              name="admissionDate"
              type="date"
              value={formData.admissionDate}
              onChange={handleChange}
              required
            />

            <Input
              label="ভর্তি ফি (টাকা)"
              name="admissionFee"
              type="number"
              value={formData.admissionFee}
              onChange={handleChange}
              placeholder="1000"
            />

            <Input
              label="মাসিক টিউশন ফি (টাকা)"
              name="monthlyFee"
              type="number"
              value={formData.monthlyFee}
              onChange={handleChange}
              placeholder="2000"
            />

            <Input
              label="ডিসকাউন্ট / ছাড় (%)"
              name="discount"
              type="number"
              value={formData.discount}
              onChange={handleChange}
              placeholder="0"
            />
          </CardBody>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link href="/dashboard/students">
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
            ভর্তি নিশ্চিত করুন
          </Button>
        </div>
      </form>
    </div>
  );
}
