# 🎓 উত্তরণ স্টাডি কেয়ার (Uttoron Study Care)

> **Coaching Management System & Smart SMS Marketing Hub**  
> একটি আধুনিক, দ্রুতগতির এবং সম্পূর্ণ কোচিং ম্যানেজমেন্ট সিস্টেম — যাতে রয়েছে ছাত্র-ছাত্রী, শিক্ষক, ব্যাচ, ক্লাস রুটিন, উপস্থিতি, পরীক্ষা ও ফলাফল, এবং পূর্ণাঙ্গ স্মার্ট এসএমএস ইঞ্জিন।

---

## 🏛️ আর্কিটেকচার (Monorepo)

```
uttoron-study-care/
├── backend/            # NestJS 10 + Prisma ORM + PostgreSQL REST API
├── frontend/           # Next.js 16 (App Router) + Tailwind CSS + TypeScript
├── PROJECT_BLUEPRINT.md # মাস্টার ডেভেলপমেন্ট ব্লুপ্রিন্ট ও স্পেসিফিকেশন
├── README.md           # প্রজেক্ট গাইড
└── .gitignore          # গিট কনফিগারেশন
```

---

## 🚀 টেকনোলজি স্ট্যাক

| লেয়ার | টেকনোলজি | বর্ণনা |
| :--- | :--- | :--- |
| **Frontend** | [Next.js](https://nextjs.org/) (App Router) | দ্রুত ও আধুনিক ইউজার ইন্টারফেস |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) v4 | প্রিমিয়াম ও রেসপন্সিভ ডিজাইন |
| **Icons** | [React Icons](https://react-icons.github.io/react-icons/) | Lucide, Heroicons, FontAwesome ইত্যাদি |
| **Backend** | [NestJS](https://nestjs.com/) | স্কেলেবল ও মডুলার আর্কিটেকচার |
| **ORM** | [Prisma ORM](https://www.prisma.io/) | টাইপ-সেফ ডাটাবেস হ্যান্ডলিং |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | শক্তিশালী রিলেশনাল ডাটাবেস |
| **Auth** | JWT (Access + Refresh Token) | সুরক্ষিত সেশন ম্যানেজমেন্ট |
| **SMS Gateway** | Greenweb / Custom API | স্বয়ংক্রিয় নোটিফিকেশন ও ক্যাম্পেইন |

---

## ⚡ লোকাল ডেভেলপমেন্ট সেটআপ (Quick Start)

### ১. রিপোজিটরি ক্লোন করুন
```bash
git clone https://github.com/<your-username>/uttoron-study-care.git
cd uttoron-study-care
```

---

### ২. ব্যাকএন্ড সেটআপ (`/backend`)
```bash
cd backend
npm install

# .env তৈরি করুন
cp .env.example .env
# .env ফাইলে আপনার PostgreSQL ডাটাবেস ইউআরএল ও সিক্রেট কী কনফিগার করুন

# ডাটাবেস মাইগ্রেশন ও সিড চালান
npx prisma migrate dev
npx prisma db seed

# ডেভেলপমেন্ট সার্ভার চালু করুন (Port: 5000)
npm run start:dev
```

---

### ৩. ফ্রন্টএন্ড সেটআপ (`/frontend`)
নতুন টার্মিনালে:
```bash
cd frontend
npm install

# .env.local তৈরি করুন
cp .env.example .env.local

# ডেভেলপমেন্ট সার্ভার চালু করুন (Port: 3000)
npm run dev
```

ব্রাউজারে ভিজিট করুন: [http://localhost:3000](http://localhost:3000)

---

## 🧩 মূল ফিচারসমূহ

- 👥 **Student & Teacher Management:** ছবি, অভিভাবক, ফোন নম্বর ও বিস্তারিত প্রোফাইল।
- 📚 **Batch & Routine System:** মাল্টিপল ব্যাচ, শিডিউল ও রুম/টিচার কনফ্লিক্ট প্রিভেনশন।
- 📋 **Smart Attendance:** দ্রুত উপস্থিতি এন্ট্রি, মাসিক ক্যালেন্ডার হিটম্যাপ ও স্বয়ংক্রিয় অনুপস্থিতি এসএমএস।
- 📝 **Exams & Marks Entry:** স্প্রেডশিট স্টাইল মার্কস এন্ট্রি, লাইভ লেটার গ্রেড/GPA ক্যালকুলেটর।
- 🏆 **Result & Merit List:** অটোমেটিক মেধা তালিকা, এক ক্লিকে অভিভাবকের কাছে রেজাল্ট এসএমএস ও প্রিন্টেবল রেজাল্ট কার্ড।
- 💰 **Accounts & Finance:** ফি আদায়, রশিদ জেনারেশন ও আয়-ব্যয় ট্র্যাকিং *(Phase 4)*।
- 📲 **SMS Marketing Hub:** ফিল্টার ভিত্তিক বাল্ক ক্যাম্পেইন, এসএমএস টেমপ্লেট ও ডেলিভারি হিস্ট্রি *(Phase 5)*।

---

## 📄 লাইসেন্স
এই প্রজেক্টটি **উত্তরণ স্টাডি কেয়ার**-এর জন্য ব্যক্তিগতভাবে তৈরি। সর্বস্বত্ব সংরক্ষিত।
