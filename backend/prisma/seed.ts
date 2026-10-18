import { PrismaClient, UserRole, UserStatus, SmsType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Default Super Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@uttoron.edu.bd',
      password: adminPassword,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log('✅ Super Admin created:', adminUser.username);

  // 2. Create Default Subjects
  const subjects = [
    { name: 'বাংলা', code: 'BAN', fullMarks: 100, passMarks: 33 },
    { name: 'ইংরেজি', code: 'ENG', fullMarks: 100, passMarks: 33 },
    { name: 'সাধারণ গণিত', code: 'MATH', fullMarks: 100, passMarks: 33 },
    { name: 'পদার্থবিজ্ঞান', code: 'PHY', fullMarks: 100, passMarks: 33, group: 'Science' },
    { name: 'রসায়ন', code: 'CHE', fullMarks: 100, passMarks: 33, group: 'Science' },
    { name: 'জীববিজ্ঞান', code: 'BIO', fullMarks: 100, passMarks: 33, group: 'Science' },
    { name: 'উচ্চতর গণিত', code: 'H.MATH', fullMarks: 100, passMarks: 33, group: 'Science' },
    { name: 'তথ্য ও যোগাযোগ প্রযুক্তি', code: 'ICT', fullMarks: 100, passMarks: 33 },
    { name: 'হিসাববিজ্ঞান', code: 'ACC', fullMarks: 100, passMarks: 33, group: 'Commerce' },
    { name: 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা', code: 'BOM', fullMarks: 100, passMarks: 33, group: 'Commerce' },
    { name: 'ফিন্যান্স ও ব্যাংকিং', code: 'FIN', fullMarks: 100, passMarks: 33, group: 'Commerce' },
  ];

  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: {},
      create: subject,
    });
  }
  console.log(`✅ ${subjects.length} Subjects seeded`);

  // 3. Create Default Settings
  const settings = [
    {
      key: 'institute_name',
      value: 'উত্তরণ স্টাডি কেয়ার',
      group: 'institute',
      description: 'নাম ও ব্র্যান্ডিং',
    },
    {
      key: 'institute_tagline',
      value: 'জ্ঞানই শক্তি, শিক্ষাই উত্তরণ',
      group: 'institute',
      description: 'স্লোগান',
    },
    {
      key: 'institute_phone',
      value: '+8801700000000',
      group: 'institute',
      description: 'যোগাযোগের মোবাইল নম্বর',
    },
    {
      key: 'institute_email',
      value: 'info@uttoron.edu.bd',
      group: 'institute',
      description: 'অফিসিয়াল ইমেইল',
    },
    {
      key: 'institute_address',
      value: 'ঢাকা, বাংলাদেশ',
      group: 'institute',
      description: 'ঠিকানা',
    },
    {
      key: 'sms_sender_id',
      value: 'UTTORON',
      group: 'sms',
      description: 'এসএমএস সেন্ডার আইডি',
    },
    {
      key: 'currency_symbol',
      value: '৳',
      group: 'academic',
      description: 'মুদ্রা প্রতীক',
    },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`✅ ${settings.length} Settings seeded`);

  // 4. Create Default Academic Year
  const currentYear = new Date().getFullYear().toString();
  const existingAcademicYear = await prisma.academicYear.findFirst({
    where: { name: currentYear },
  });

  if (!existingAcademicYear) {
    await prisma.academicYear.create({
      data: {
        name: currentYear,
        startDate: new Date(`${currentYear}-01-01`),
        endDate: new Date(`${currentYear}-12-31`),
        isCurrent: true,
      },
    });
    console.log(`✅ Academic Year ${currentYear} created`);
  }

  // 5. Create Default SMS Templates
  const templates = [
    {
      name: 'অনুপস্থিতির নোটিশ',
      body: 'প্রিয় অভিভাবক, আপনার সন্তান {{studentName}} আজ {{date}} তারিখে ক্লাসে অনুপস্থিত ছিল। - উত্তরণ স্টাডি কেয়ার',
      type: SmsType.TRANSACTIONAL,
      isActive: true,
    },
    {
      name: 'ফি আদায় নিশ্চিতকরণ',
      body: 'উত্তরণ স্টাডি কেয়ার: {{studentName}}-এর {{feeMonth}} মাসের ফি বাবদ {{amount}} টাকা জমা হয়েছে। রসিদ নং: {{receiptNo}}। ধন্যবাদ।',
      type: SmsType.TRANSACTIONAL,
      isActive: true,
    },
    {
      name: 'পরীক্ষার ফলাফল',
      body: 'উত্তরণ স্টাডি কেয়ার: {{studentName}} {{examName}} পরীক্ষায় {{subjectName}} বিষয়ে {{fullMarks}}-এর মধ্যে {{obtainedMarks}} (গ্রেড: {{grade}}) পেয়েছে।',
      type: SmsType.TRANSACTIONAL,
      isActive: true,
    },
    {
      name: 'ফ্রি ক্লাসের আমন্ত্রণ ক্যাম্পেইন',
      body: 'উত্তরণ স্টাডি কেয়ার-এ ফ্রি স্পেশাল ক্লাস অনুষ্ঠিত হবে। রেজিস্ট্রেশন করতে কল করুন: {{phone}}। আসন সীমিত!',
      type: SmsType.CAMPAIGN,
      isActive: true,
    },
  ];

  for (const template of templates) {
    const existing = await prisma.smsTemplate.findFirst({
      where: { name: template.name },
    });
    if (!existing) {
      await prisma.smsTemplate.create({
        data: template,
      });
    }
  }
  console.log(`✅ ${templates.length} SMS Templates seeded`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
