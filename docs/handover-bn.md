# 🎓 Smart Semester Study Management System — Live হয়ে গেছে

## 🌐 লাইভ লিংক

| হোস্ট | লিংক | কেমন |
|---|---|---|
| **Vercel** | **https://study-hub-virid.vercel.app/** | মূল ডোমেইনে (`/`), `/report`, `/exam`, `/analytics` deep link সরাসরি খোলে |
| **GitHub Pages** | **https://md-abdullah-mulla.github.io/study-hub/** | `/study-hub/` path-এ, SPA fallback (404.html) দিয়ে deep link খোলে |
| **📱 App version** | ওয়েবসাইট → Settings → “App হিসেবে ইনস্টল করো” | হোম স্ক্রিনে/Start menu-তে আইকন, ইন্টারনেট ছাড়াও চলে |
| **🖥️ Desktop app** | GitHub → **Releases** (`.AppImage` / `.deb`) | পিসিতে আলাদা অ্যাপ, ব্রাউজার/সার্ভার/ইন্টারনেট কিছুই লাগে না |

দুই জায়গায় একই অ্যাপ — data ব্রাউজারের ভিতরেই (SQLite → WebAssembly) থাকে, তাই কোনো
সার্ভার বা ডেটাবেস হোস্টিং লাগে না, আর ইন্টারনেট ছাড়াও চলে।

ফোন, ল্যাপটপ, ট্যাব — যেকোনো ডিভাইসে খুললে অ্যাপ চলে যাবে। ফোনে Chrome খুলে
**⋮ → Add to Home screen** করলে অ্যাপের মতোই আইকন হয়ে যাবে।

---

## 🖼️ Illustration prompt কীভাবে কাজ করে (Phase 4, API ছাড়া)

প্রতিটি topic-এর পাশে **🖼️ Create Illustration** চাপলে একটা modal খুলবে — Subject, Chapter, Topic নিজে থেকেই বসে
থাকবে (আবার লিখতে হবে না)। type বেছে **Generate Prompt** চাপলেই পূর্ণ English prompt তৈরি হয়।

- **কোনো AI API নেই, কোনো API key নেই** — prompt পুরোটাই তোমার নিজের topic data থেকে অ্যাপ নিজেই বানায়।
- prompt-এ থাকে: concept, অংশগুলো (label সহ), ধাপ, অংশগুলোর সম্পর্ক, layout, design rules, avoid list,
  audience (Bangladeshi Diploma CST student) আর final check। ছবির ভেতরের label ছোট ইংরেজিতে, ব্যাখ্যা তোমার জন্য।
- **topic অনুযায়ী আলাদা**: MQTT → Publisher / Broker / Subscriber / Topic; Computer Network → client, switch,
  router, packet; Microcontroller → CPU, ROM/RAM, I/O, timer/interrupt।
- **নতুন topic হলেও কাজ করে**: যে topic খুঁজে না পাওয়া যায়, তার নাম + description + chapter + subject থেকে
  নিজেই অংশগুলো বের করে (যেমন "Ohms Law" + description "Voltage, current, resistance")।
- **🔄 Regenerate** — একই topic-এর জন্য প্রথমে অন্য variant (৩টা), তারপর পরের illustration type।
- **✏️ Edit Prompt** → textarea-তে নিজে বদলাও, **📋 Copy Prompt** → clipboard-এ copy, "Prompt copied successfully!" দেখাবে।
- copy করা prompt ChatGPT/Gemini-তে paste করে ছবি বানাও; ছবিটা এখন নিজে save করে রাখো (AI image সংরক্ষণ Phase 5-এ)।

## ✨ Study Content কীভাবে তৈরি হয় (Phase 4-এর দ্বিতীয় feature, API ছাড়া)

প্রতিটি topic-এর পাশে **✨ Study Content** চাপলে AI Assistant পেজ খোলে আর ওই topic আগেই বাছা থাকে।
**Content তৈরি করো** চাপলেই নয়টা part একসাথে তৈরি হয়:

| Part | কী থাকে |
|---|---|
| সহজ সংজ্ঞা | দুই লাইনে সহজ বাংলা সংজ্ঞা |
| ব্যাখ্যা | অংশগুলো + কাজের ধাপ + কোন অংশ কার সাথে যুক্ত |
| গুরুত্বপূর্ণ পয়েন্ট | পরীক্ষায় আসে এমন bullet point |
| উদাহরণ | বাস্তব উদাহরণ / কোথায় ব্যবহার হয় |
| পরীক্ষার সংক্ষিপ্ত উত্তর | ৩-৫ নম্বরের উত্তরের কাঠামো (সংজ্ঞা → অংশ → উদাহরণ) |
| সম্ভাব্য প্রশ্ন | পরীক্ষায় আসতে পারে এমন প্রশ্নের তালিকা |
| MCQ | প্রশ্ন + ৪টা option + **উত্তর নিচে লেখা** |
| Viva প্রশ্ন | প্রশ্ন + ছোট উত্তর |
| রিভিশন সামারি | পরীক্ষার আগের শেষ রিভিশন — এক পাতায় |

- **কোনো AI API নেই, API key নেই, ইন্টারনেট লাগে না** — লেখাগুলো অ্যাপের ভেতরে রাখা হাতে লেখা তথ্য
  (`banglaContent.js`, ২০টি concept: MQTT, CoAP, IoT layers, Sensor, DBMS, File System, Microcontroller,
  Memory, Timer/Interrupt, I/O port, Serial/Parallel, Surveillance, Access Control …) আর template থেকে আসে।
- **MCQ-তে ভুল উত্তর থাকতে পারে না**: সঠিক option-টা ওই topic-এরই অংশ, আর বাকি ৩টা option অন্য concept-এর অংশ —
  তাই একটাই উত্তর সঠিক হতে পারে। প্রতিটি প্রশ্নের নিচে উত্তর লেখা থাকে, নিজেই যাচাই করে নিতে পারবে।
- **নতুন topic হলেও কাজ করে**: যে topic-এর হাতে লেখা তথ্য নেই, সেখানে বানানো তথ্য নয় — **খালি কাঠামো (draft)**
  দেওয়া হয়, আর স্পষ্ট লেখা থাকে "নিজের বই থেকে পূরণ করো"। MCQ-এর জায়গায় সৎভাবে লেখা থাকে যে যথেষ্ট তথ্য নেই।
- **✏️ Edit** করে নিজের ভাষায় লিখে **Save** করলে ওটাই থেকে যাবে (Save করা content-এ "save করা আছে" ব্যাজ আসে)।
- **📋 Copy** দিয়ে যেকোনো part copy করা যায়, **🗑️ মুছে ফেলো** দিয়ে মুছে ফেলা যায়, **আবার তৈরি করো (Regenerate)**
  দিয়ে হাতে লেখা তথ্য থেকে সব নতুন করে আনা যায়।
- **AI note আলাদা**: "AI note-এ যোগ করো" চাপলে নোটটা যায় **Notes পেজের AI notes অংশে** — তোমার নিজের
  personal note-এর সাথে কখনো মেশে না। এখানে `model = pattern-library / pattern-draft` লেখা থাকে,
  কোথাও "AI দিয়ে লেখা" বলে দেখানো হয় না।

## Quiz কীভাবে ন্যায্য থাকে (Phase 3)

- **MCQ আর সত্য/মিথ্যা** কম্পিউটার নিজে যাচাই করে — উত্তর মিলিয়ে দেয় (স্পেস/বড়-ছোট হাতের অক্ষর ধরেও নেয়)।
- **সংক্ষিপ্ত আর Viva** লেখা উত্তর — কম্পিউটার এসবের নম্বর দিতে পারে না। তাই ওগুলো প্রথমে "মার্ক দাওনি (০)" থাকে,
  আর তুমি নিজে **সঠিক / আংশিক / ভুল** বেছে দিলে স্কোর আবার হিসাব হয়। বানানো নম্বর কখনো দেখায় না।
- **দুর্বল topic** তখনই বলা হয়, যখন সত্যি সত্যি প্রশ্নের উত্তর দিয়ে accuracy ৬০% এর নিচে নামে। যে topic নিয়ে
  প্রশ্নই করোনি, সেটাকে কখনো "দুর্বল" বলা হয় না।
- Quiz খোলার সময় প্রশ্নের সাথে **উত্তর পাঠানো হয় না** — উত্তর আসে শুধু জমা দেওয়ার পরে, তাই স্কোরের মানে থাকে।

## এটা কীভাবে কাজ করছে (গুরুত্বপূর্ণ)

এই লিংকে **আলাদা কোনো server নেই** — পুরো app তোমার ব্রাউজারের ভেতরেই চলে:

| অংশ | কোথায় চলছে |
|---|---|
| UI (React + Tailwind) | ব্রাউজার |
| API (Express — same ৬০টি route) | ব্রাউজার |
| ডেটাবেজ (SQLite) | ব্রাউজারে WebAssembly দিয়ে (sql.js) |
| ডেটা জমা থাকে | তোমার ব্রাউজারের **IndexedDB**-তে |

তাই server-এর business logic এক লাইনও duplicate করা হয়নি — Node server-এর **একই** route,
service, repository ফাইলগুলোই ব্রাউজারে চলছে। শুধু দুটি ফাইল বদলানো: `express → express-lite`,
`db/connection.js → connectionShim` (Vite alias দিয়ে)।

> ⚠️ **Data কোথায় থাকে:** ডেটা ওই ব্রাউজারেই থাকে। Phone-এর Chrome-এ পড়লে ল্যাপটপে সেই
> progress দেখবে না; আর ব্রাউজার data clear করলে চলে যাবে। তাই মাঝে মাঝে
> **Settings → Backup (JSON)** চেপে ফাইলটা নামিয়ে রাখো (CSV-ও আছে)।

---

## এখন কী কী কাজ করে (Live)

| স্ক্রিন | অবস্থা |
|---|---|
| **Dashboard** — semester progress + bar, statistics, subject-wise progress, Today's Target, Recommended Next Study (কারণ সহ), Revision Due, Recent Activity | ✅ সম্পূর্ণ |
| **Subjects / Chapters / Topics** — add, edit, delete, reorder, chapter import (paste করে auto structure) | ✅ সম্পূর্ণ |
| **Progress** — শুধু topic complete থেকে হিসাব (topic → chapter → subject → semester), কখনো হাতে বানানো যায় না | ✅ সম্পূর্ণ |
| **Revision** — Learned → Revision 1 → Revision 2 → Final, last/next date, "Revision Due" ব্যাজ, এক ক্লিকে done | ✅ সম্পূর্ণ |
| **Notes** — personal notes (topic-wise), খোঁজা যায় | ✅ সম্পূর্ণ |
| **Analytics** — basic statistics + **৭ দিনের study-time chart, এই সপ্তাহের সময়, গড় সেশন, সবচেয়ে বেশি/কম পড়া subject** | ✅ **সম্পূর্ণ (Phase 2)** |
| **Global Search** (`Ctrl/Cmd + K`) — subject, chapter, topic, note, question | ✅ সম্পূর্ণ |
| **Settings / Backup** — JSON backup + snapshot, CSV export, data reset | ✅ সম্পূর্ণ (server ছাড়াও) |
| **Study Session (timer)** — শুরু → টাইমার → শেষে আসল সময় + confidence + নোট + "revision দরকার" ফ্ল্যাগ, আজ/মোট/streak, সেশনের ইতিহাস | ✅ **সম্পূর্ণ (Phase 2)** |
| **Quiz** — chapter-wise MCQ / সত্য-মিথ্যা / সংক্ষিপ্ত / Viva, স্কোর + accuracy, **দুর্বল topic**, revision suggestion | ✅ **নতুন (Phase 3)** |
| **🖼️ Create Illustration (AI Image Prompt Generator)** — প্রতি topic-এর পাশে button, ৫ ধরনের illustration, topic-specific English prompt, edit + copy + regenerate; **কোনো AI API বা API key লাগে না** | ✅ **সম্পূর্ণ (Phase 4-এর প্রথম feature)** |
| **✨ Study Content (AI Assistant)** — প্রতি topic-এর পাশে button → নয়টা part (সংজ্ঞা, ব্যাখ্যা, point, উদাহরণ, পরীক্ষার উত্তর, সম্ভাব্য প্রশ্ন, MCQ, Viva, রিভিশন সামারি), save / edit / copy / regenerate / delete, AI note আলাদা; **কোনো AI API বা API key লাগে না** | ✅ **নতুন (Phase 4-এর দ্বিতীয় feature)** |
| **📝 Exam Mode** — subject / chapter / topic ধরে নিজে পরীক্ষা বানাও (প্রশ্ন সংখ্যা ১–৫০, সময় ১–৩০০ মিনিট), টাইমার + progress, জমা দিলে ফলাফল, দ্বিতীয়বার জমা দেওয়া যায় না, আগের পরীক্ষাগুলোর ফল সংরক্ষিত; প্রতি পরীক্ষায় badge দেখায় প্রশ্নটা pattern-based নাকি তোমার নিজের প্রশ্ন ব্যাংক থেকে। টাইমার exam-এর `startedAt` থেকে চলে, তাই page refresh করলেও সময় আবার শুরু হয় না; "Time Taken" server-এ মাপা হয় (নিজে কম দেখানো যায় না) | ✅ **নতুন (Task 2)** |
| **📈 Advanced Analytics** — subject-wise progress + accuracy, exam trend, daily/weekly/monthly activity, correct vs wrong, revision stage-wise হিসাব, weak/strong topic-এর রায় (৩টির কম উত্তর হলে রায় দেয় না — অনুমান করে না) | ✅ **নতুন (Task 3)** |
| **Insight Card (Dashboard)** — dashboard-এর উপরেই accuracy, exam গড়, topic complete, streak + সর্বোচ্চ ৩টি insight, চাইলে পুরো analytics-এ যাওয়ার লিংক | ✅ **নতুন (Task 3)** |
| **🧾 PDF Report (`/report`)** — student name (Settings থেকে), তারিখ, overall progress, subject/chapter performance, exam result, দুর্বল-শক্ত topic, **topic-wise progress**, study statistics, insights — মোট ৯টি section; ব্রাউজারের Print → Save as PDF দিয়ে **বাংলা ঠিকভাবে** বসে (ছবি নয়, আসল লেখা, তাই খোঁজাও যায়) | ✅ **নতুন (Task 4)** |
| **Auto Backup** — অ্যাপ চালু হলেই নিজে নিজে snapshot (১২ ঘণ্টা পেরোলে), সর্বশেষ ৫টি auto + ১০টি manual snapshot রাখে; download / restore / delete; restore-এর আগে safety snapshot + confirm; ডেটাবেস নষ্ট হলে app নিজেই recovery screen দেয় | ✅ **নতুন (Task 4)** |
| সত্যিকারের AI API দিয়ে content, আর prompt থেকে সত্যিকারের ছবি generation (তোমার API key লাগবে) | ⏳ Phase 5 — architecture আলাদা রাখা আছে, শুধু একটা function যোগ করলেই হবে |

Semester-এর শুরুতে দেওয়া structure-টাই লোড করা আছে: **৫ subject / ১৩ chapter / ৭৭ topic**
(Computer Network, IoT & IoT Architecture, DBMS, Microcontroller, Security-Based Surveillance System)।

---

## 🔧 এই ধাপে যা যোগ হলো (Task 1 → 4)

**1) ভুল concept match ঠিক করা** — Illustration prompt generator আগে "Architecture concepts",
"Harvard vs Von Neumann architecture", "RISC vs CISC", "Interrupt vector table" লেখাগুলোকে
কখনো ভুল family-র সাথে মিলিয়ে ফেলত। এখন প্রতিটি entry-তে `family` + `strong` + `weight` আছে
(`services/illustration/conceptLibrary.js`), আর selection হয় family gate
(`detectSubjectFamily()` / `matchesFamily()` দিয়ে — `services/illustration/topicAnalyzer.js`)
পেরিয়ে weighted weight অনুযায়ী। ফলে ওই চারটা লেখা এখন যথাক্রমে
`mcu-architecture`, `harvard-von-neumann`, `risc-cisc`, `interrupt-vector-table` prompt পায় —
server test দিয়ে যাচাই করা।

**2) Exam Mode** — `POST /api/exams` (subject/chapter/topic, ১–৫০ প্রশ্ন, ১–৩০০ মিনিট) →
`GET /api/exams`, `/stats`, `/availability`, `/:id`; `POST /:id/submit` (দ্বিতীয়বার দিলে 400),
`DELETE /:id`। ফ্রন্টএন্ডে `/exam` পেজ + `ExamRunner`। পরীক্ষার হিসাব বাস্তবসম্মত — কোনো extra
study load চাপিয়ে দেয় না, আর প্রশ্ন কোথা থেকে এসেছে সেটা সবসময় badge-এ দেখা যায় (এটা কখনো লুকায় না)।

**3) Advanced Analytics** — `services/advancedAnalyticsService.js` + `GET /api/analytics/advanced`।
UI: `pages/AnalyticsPage.jsx` + `components/analytics/AdvancedAnalytics.jsx` +
dashboard-এর `components/dashboard/InsightCard.jsx`। গুরুত্বপূর্ণ নীতি: **যেটা measure করা যায়নি
সেটা নিয়ে রায় দেওয়া হয় না** — `WEAK_ACCURACY 60`, `MIN_ANSWERS_FOR_VERDICT 3`; অর্থাৎ ৩টির কম
উত্তর থাকলে weak topic বলা হয় না, বরং "যথেষ্ট ডেটা নেই" দেখায়।

**4) PDF Report + Auto Backup** — `pages/ReportPage.jsx` (`/report` route, `@media print` CSS:
toolbar `.no-print`, body `.print-area`)। Backup: `repositories/backupRepo.js` +
`services/backupService.js` / `restoreService.js` + `/api/backups` (১২ ঘণ্টা পরে due,
৫টি auto + ১০টি manual রাখে, restore-এ `confirm:true` + আগে safety snapshot)।
Client-এ `components/backup/AutoBackupCard.jsx` (Settings), `lib/backup.js` — server mode-এ
`/api/backups`, offline (Pages/Vercel) mode-এ `recovery-<ISO>` নামে IndexedDB-তে কাঁচা DB copy (৩টি রাখে),
আর `main.jsx`-এ DB নষ্ট হলে recovery screen। Student-এর নাম রিপোর্টে hardcoded নয় —
Settings → `PATCH /api/profile` → `/api/meta` থেকেই বসে (`meta.studentName`)।

---

## 🧭 Content mapping rule (Task 1-এর নির্দেশ)

Content generate হওয়ার সময় সবসময় এই hierarchy মানা হয়:

> **Topic → Subject → Chapter → Content**

মানে Microcontroller-এর topic কখনো IoT বা DBMS-এর লেখা পাবে না — আর उল্টোটাও না।
নিয়মটা `server/src/services/illustration/topicAnalyzer.js`-এ 적용 করা:

1. প্রতিটি concept-এর একটা `family` আছে (`iot | network | dbms | microcontroller | security | general`)
   আর প্রতিটি topic-এর subject/chapter থেকে family বের করা হয় (`detectSubjectFamily`)।
2. ভিন্ন family-র concept শুধু তখনই ব্যবহার হয় যখন topic-এর **নিজের নাম** সেই concept-এর
   `strong` শব্দের সাথে হুবহু মেলে (যেমন যেকোনো subject-এ "File System" topic)।
3. একই লেভেলে একাধিক concept মিললে সবগুলোই নেওয়া হয় ("File System vs DBMS" দুটোই পায়),
   আর বেশি specific concept (উদাহরণ: Interrupt **Vector Table**) কম specific একটার
   (সাধারণ Interrupt) আগে জেতে — এজন্য `weight` আছে।

এতে যে চারটা ভুল আগে ছিল, সেগুলো এখন ঠিক:

| Topic (Microcontroller) | আগে (ভুল) | এখন (ঠিক) |
|---|---|---|
| Architecture concepts | IoT Layer-এর লেখা | `mcu-architecture` — CPU, ALU, Control Unit, Register, Memory, I/O, Bus |
| Harvard vs Von Neumann architecture | IoT Layer-এর লেখা | `harvard-von-neumann` — দুই architecture, memory organization, bus, speed, সুবিধা/অসুবিধা, তুলনা টেবিল |
| RISC vs CISC | IoT Layer-এর লেখা | `risc-cisc` — RISC/CISC সংজ্ঞা, instruction size/complexity, cycle, power, তুলনা টেবিল |
| Interrupt vector table | DBMS-এর লেখা | `interrupt-vector-table` — interrupt, IVT, vector address, ISR, reset vector, table |

**MCQ-র option-ও একই নিয়ম মানে:** ভুল option (distractor) শুধু topic-এর নিজের subject family
থেকে নেওয়া হয় (নিজের family-র অন্যান্য concept + `FAMILY_DISTRACTORS` তালিকা)। আগে সব family
মিশিয়ে নেওয়া হত — তাই Harvard-এর প্রশ্নে "CoAP Client" চলে আসত। এখন যাচাই করা:
৭৭টা topic-এর কোনো MCQ-তে অন্য subject-এর শব্দ নেই।

**Exam Mode-এর প্রশ্নও একই নিয়মে বানানো** (`Subject → Chapter → Topic → Question`) — selected
topic-এর বাইরের প্রশ্ন কখনো আসে না, আর প্রতি প্রশ্নে badge দেখায় সেটা pattern-based না তোমার
নিজের question bank-এর।

---

## Test-এর ফল (সবগুলো সবুজ)

| Test | ফল |
|---|---|
| Server API test (Node-এ) | ✅ 58/58 |
| Browser-mode backend test (sql.js) | ✅ 12/12 |
| **Offline UI smoke (server ছাড়া — live app যেমন)** | ✅ 63/63 |
| Server-mode full UI smoke (timer + analytics + quiz + illustration + study content + exam + report + backup সহ) | ✅ 132/132 |
| **App (PWA) check — আসল Chrome-এ installed app: manifest, আইকন, service worker, internet বন্ধ করে অ্যাপ + deep link + data save** | ✅ 13/13 |
| **Desktop app check — আসল Electron window: app://, preload bridge, ১২টা screen, ০ network request, data reload-এর পরও থাকে** | ✅ 23/23 (source + AppImage) |
| **Real-browser check (Chromium-এ deployed app)** | ✅ 38/38 (Vercel + Pages) |
| ৭৭ topic-এর content mapping sweep (cross-subject bleed) | ✅ 0 bleed, 0 draft |
| oxlint | ✅ 0 warning, 0 error (80 files) |
| Production + Pages + Vercel build | ✅ ঠিকঠাক (`dist/`, `dist-vercel/`) |

যাচাই করা হয়েছে: দুই হোস্টেই HTML, JS chunks, CSS, WASM **সবগুলো 200 OK** (lazy chunk সহ),
deep link (`/report`, `/exam`, `/analytics`, `/subjects/1`) সরাসরি খোলে, লাইভ bundle-এর MD5
অবিকল আমার নিজে rebuild করা bundle-এর সাথে মিলছে, আর bundle-এ নতুন feature (Exam Mode,
Report, Advanced Analytics, Auto Backup) আছে এবং কোনো AI API-র ঠিকানা (`openai`, `gemini`,
`anthropic`) নেই।

---

## 🧪 আসল ব্রাউজারে যাচাই (`tools/browser-check.mjs`)

jsdom smoke Node-এর ভিতরে চলে, তাই সেখানে `Buffer`-এর মতো global আছে — কিন্তু deployed app-এ
backend ব্রাউজারে চলে, যেখানে নেই। এই পার্থক্যের কারণেই দুটো bug শুধু **লাইভ সাইটে** ধরা পড়েছিল:

| Bug | কারণ | এখন |
|---|---|---|
| Backup ভাঙা (`Buffer is not defined`) | `backupRepo` সাইজ মাপতে `Buffer.byteLength` ব্যবহার করত | `server/src/utils/bytes.js` → `TextEncoder` (Node + ব্রাউজার দুই জায়গাতেই চলে) |
| Dashboard-এ "সেরা: undefined দিন" | UI `stats.longestStreak` পড়ত, কিন্তু dashboard API সেটা পাঠাত না | `dashboardService` এখন পাঠায় + UI-তে `?? 0` fallback |

তাই শেষ ধাপে সবসময় আসল ব্রাউজারে চালাও:

```bash
mkdir -p /tmp/qa && cd /tmp/qa && npm init -y && npm i playwright && npx playwright install chromium
PLAYWRIGHT_HOME=/tmp/qa node ~/study-hub/tools/browser-check.mjs https://study-hub-virid.vercel.app/
```

এটা প্রতিটা screen খুলে দেখে কোনো জায়গায় `undefined`/`NaN`/`[object Object]` ছাপে কি না, dashboard →
subject → chapter → topic navigation, topic complete করে reload দিয়ে **data সত্যিই থাকছে কি না**,
topic content নিজের subject-এর কি না, Exam Mode পুরোটা (start → উত্তর → next → submit → result),
analytics card + chart, PDF report-এর সব section + print, Backup Now, আর ফোন layout — সাথে console
error-ও গোনে। Playwright app-এর dependency নয় (package.json-এ যোগ করা নেই)।

---

## নিজে কিছু বদলালে আবার deploy করবে যেভাবে

```bash
cd ~/study-hub/client
npm run build:pages            # dist/ তৈরি করবে (404.html + .nojekyll সহ)
# তারপর dist/ ফোল্ডারটা gh-pages branch-এ push করে দিলেই লাইভ আপডেট
```

সহজ পথ: `docs/github-actions-deploy-pages.yml` ফাইলটা `.github/workflows/deploy-pages.yml`
নামে রাখলে প্রতি push-এ নিজে নিজে deploy হবে। (এটা এই token দিয়ে করা যায়নি —
token-এ `workflow` permission নেই; GitHub web-এ ফাইলটা বানালেই হবে।)

### Vercel-এ deploy (একই অ্যাপ, offline mode-এ)

GitHub Pages-এ অ্যাপ যেমন চলে (in-browser database, server লাগে না), Vercel-এও ঠিক তেমনি —
তাই আলাদা API/database সেটআপ লাগে না, অ্যাপ নিজেই ব্রাউজারে data রাখে।

**কেন deploy করতে হয় repo-র root থেকে (client/ থেকে নয়):** browser-এ চলা backend টা আসলে
`server/src/**`-এরই কোড (routes, services, repositories, schema.sql), শুধু `express` আর
`db/connection.js` দুটো browser-version দিয়ে বদলে দেওয়া (`client/src/browser-db/`)। তাই build করতে
`server/` ফোল্ডারটাও দরকার — `client/` থেকে deploy করলে সেই ফাইলগুলো আপলোড হয় না, build ভেঙে যায়।

```bash
cd ~/study-hub                 # repo root, client/ নয়
VERCEL_TOKEN=*** npx vercel@latest --prod --yes   # token শুধু environment-এ, কখনো repo/remote-এ নয়
```

root-এর `vercel.json`-এ সব সেট করা আছে: `installCommand: npm install --prefix client`,
`buildCommand: npm run build:vercel --prefix client`, `outputDirectory: client/dist-vercel`,
সব রুট `/index.html`-এ rewrite, আর `/assets/*`-কে immutable cache header।
`client/.env.vercel` → `VITE_API_MODE=local` (Pages-এর মতোই), আর root-এর `.vercelignore`
তোমার `data/` ফোল্ডার (তোমার পড়ার আসল ডেটা) কখনো আপলোড হয় না।

পুরোনো লিংক: https://study-3z7ek92ux-md-abdullah-mullas-projects.vercel.app (alias)


---

## 📱 App version (PWA) আর 🖥️ Desktop app — একই অ্যাপ, তিন জায়গায়

তিনটাই **একই কোড**: React UI + পুরো backend + SQLite (WebAssembly-তে) — তাই কোথাও সার্ভার
বা আলাদা database লাগে না।

| জিনিস | ফাইল | কেন দরকার |
|---|---|---|
| App install | `client/public/manifest.webmanifest` | ব্রাউজারকে বলে এটা একটা অ্যাপ (Bangla নাম, standalone, maskable আইকন) |
| Offline | `client/public/sw.js` | অ্যাপের copy রেখে দেয় → internet ছাড়াও খোলে। প্রতিটি build-এ `__BUILD__` stamp বদলায়, তাই পুরোনো cache নিজে পরিষ্কার হয় |
| আইকন | `client/public/icons/*` + `favicon.ico` | `tools/make-icons.py` ব্র্যান্ড রঙে বানায় (cap + rising bars), `desktop/build/icon.png`-ও এখান থেকেই |
| ইনস্টল UI | `client/src/components/pwa/InstallAppCard.jsx` (Settings-এ) | যেখানে সত্যিই ইনস্টল বাটন আছে সেখানে সেটা, নাহলে device-ভিত্তিক ধাপ; iOS-এ সৎভাবে শুধু ধাপ (ওখানে prompt নেই) |
| নতুন version | `client/src/components/pwa/UpdateBanner.jsx` | নতুন build এলে "নতুন version এসেছে → Reload" |
| ফন্ট | `client/public/fonts/` (`client/scripts/fetch-fonts.mjs`) | ফন্ট অ্যাপের সাথে থাকে → **কোনো third-party request নেই**, ডেস্কটপ অ্যাপে ০ network request |
| ডেস্কটপ shell | `desktop/main.cjs`, `desktop/preload.cjs` | `app://study-hub/` scheme-এ বিল্ট অ্যাপ serve করে, মেনু (Ctrl+1…5), window state, single instance |
| ইনস্টলার | `desktop/release/` (`npm run dist:linux`) | AppImage + deb (উইন্ডোজ/ম্যাকের কমান্ড `docs/desktop-app-bn.md`-তে) |

সত্যি কথা: ওয়েবসাইট, ফোনে ইনস্টল করা অ্যাপ আর ডেস্কটপ অ্যাপে **ডেটা আলাদা জায়গায়** থাকে
(প্রत्येकের নিজের storage) — তাই **Settings → Backup (JSON)** দিয়ে এক জায়গা থেকে আরেক জায়গায়
নেওয়া যায় (Auto Backup-এর snapshot-ও আছে)।

---

## বাকি যা আছে

সম্পূর্ণ হয়েছে: Phase 1 (structure + progress), Phase 2 (session tracker + analytics),
Phase 3 (quiz), Phase 4-এর দুই feature (illustration prompt + Study Content), তারপর
Exam Mode, Advanced Analytics, PDF Report + Auto Backup। অর্থাৎ spec-এর প্রায় ৯০% API ছাড়াই
হয়ে গেছে।

বাকি:

1. **Study Material** — database table (`study_materials`) আছে, কিন্তু UI/API এখনো বানানো হয়নি (নোট আলাদা আছে)।
2. **সত্যিকারের AI API-র content:** তোমার OpenAI/Gemini/Claude API key লাগবে — key ছাড়া যেটা সম্ভব (hand-written Bangla knowledge + template) সেটা Phase 4-এ করা হয়েছে, আর সেভ করা content সবসময় "pattern-based draft, একবার মিলিয়ে নাও" লেবেল নিয়ে থাকে।
3. **Prompt থেকে সত্যিকারের ছবি:** এখন prompt generator হয়েছে; Phase 5-এ ওই prompt সোজা AI image API-তে পাঠিয়ে ছবি generate → preview → save → download হবে। architecture আগেই আলাদা রাখা হয়েছে (`illustrationPromptService.js`-এ শুধু একটা function যোগ করলেই হবে)। সাথে advanced analytics + PDF export।
