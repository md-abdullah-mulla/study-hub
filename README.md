# 🎓 Smart Semester Study Management System

### 🌐 Live app

| Host | Link |
|---|---|
| Vercel | **https://study-hub-virid.vercel.app/** |
| GitHub Pages | **https://md-abdullah-mulla.github.io/study-hub/** |

Both run the whole backend (SQLite compiled to WebAssembly) inside the browser, so the app works
with no server — and offline once loaded.

GitHub Pages-এ deploy করা version সম্পূর্ণ server-ছাড়া চলে — SQLite (WebAssembly) ব্রাউজারেই চলে,
তাই ফোন/ল্যাপটপ থেকে যেকোনো সময় খুলতে পারবে। ডেটা সেই ব্রাউজারের **IndexedDB**-তে জমা থাকে
(তাই অন্য ব্রাউজার/ডিভাইসে গেলে progress আলাদা থাকবে) — মাঝে মাঝে **Settings → Backup (JSON)** নামিয়ে রাখো।
নিজের server/changes চালাতে চাইলে নিচের “কীভাবে চালাব” দেখো।

**Diploma in Computer Science & Technology — Semester 6** এর জন্য নিজের personal study manager.
লক্ষ্য একটাই: **Study → Track → Analyse → Revise → Improve**

> **বর্তমান অবস্থা: Phase 1 (MVP) সম্পূর্ণ ✅**
> Dashboard, Subject/Chapter/Topic management, auto progress, কারণসহ recommendation,
> today's plan, revision queue, notes, import chapter, global search, backup/export — সবই কাজ করছে।

---

## 📦 Repository

| | |
| --- | --- |
| | |
| --- | --- |
| Repo | https://github.com/md-abdullah-mulla/study-hub |
| Stack | React 19 + Vite + Tailwind · Node 20 + Express · SQLite (better-sqlite3 on the server, sql.js/WASM in the browser) · Recharts |
| Status | Phase 1 (MVP) complete — 16 backend tests + 38 end-to-end UI checks passing |

<!-- CI badge: নিচের line-টা uncomment করো যখন docs/github-actions-ci.yml কে
     .github/workflows/ci.yml হিসেবে যোগ করবে (GitHub UI → Add file অথবা
     `workflow` scope সহ token দিয়ে push) -->
<!-- [![CI](https://github.com/md-abdullah-mulla/study-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/md-abdullah-mulla/study-hub/actions/workflows/ci.yml) -->

> **CI চালু করার ৩০ সেকেন্ডের কাজ:** `docs/github-actions-ci.yml` ফাইলটার content কপি করে GitHub-এ
> `.github/workflows/ci.yml` নামে নতুন file বানিয়ে paste করো (Add file → Create new file)।
> তখন প্রতি push-এ test + lint + build automatic চলবে। (Token-এ `workflow` scope না থাকায় এটা আমি
> সরাসরি push করতে পারিনি।)

### Live link (one click)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/md-abdullah-mulla/study-hub)

উপরে চাপলে Render তোমাকে GitHub দিয়ে login করাবে, তারপর `render.yaml` পড়ে **একটা service** বানিয়ে
পুরো app (UI + API) deploy করে দেবে — কোনো configuration লাগবে না। বিস্তারিত নিচে “Deploy” section-এ।

> ⚠️ Render free plan-এ disk ephemeral: প্রতিবার deploy-এ progress reset হবে। স্থায়ী data চাইলে persistent
> disk (paid) অথবা GitHub Pages version (data ব্রাউজারে থাকে) ব্যবহার করো।

### GitHub Pages (যেভাবে এই live link বানানো হয়েছে)

```bash
cd client
npm run build:pages      # ভেতরে: vite build --mode pages + 404.html ও .nojekyll তৈরি
# তারপর dist/ ফোল্ডারটাই gh-pages branch-এ push করা হয়েছে
```

`build:pages` mode-এ পুরো backend ব্রাউজারে চলে যায়: `client/.env.pages`-এর `VITE_API_MODE=local`,
`src/browser-db/` (sql.js adapter + express-lite router + fetch bridge) আর Vite alias দুটো —
`express → express-lite`, `db/connection.js → connectionShim`। ফলে server-এর **একই** routes,
services, repositories ব্রাউজারেও অপরিবর্তিতভাবে চলে (কোনো duplicate logic নেই)।

---

## 🚀 কীভাবে চালাব

দুইটা terminal লাগবে (backend + frontend)।

**1) Backend (API + database)**

```bash
cd study-hub/server
npm install          # প্রথমবার
npm run seed         # Semester 6 struktur বসায় (একবারই চালালেই হয়)
npm run dev          # http://localhost:4000  (auto-restart সহ)
```

**2) Frontend (web app)**

```bash
cd study-hub/client
npm install          # প্রথমবার
npm run dev          # http://localhost:5173  ← এটা ব্রাউজারে খুলুন
```

Browser-এ `http://localhost:5173` খুললেই app। Frontend থেকে `/api/...` call গুলো Vite নিজেই
backend-এ forward করে দেয় — তাই CORS বা localhost সমস্যা নেই।

**অন্য দরকারি commands**

| Command | কাজ |
| --- | --- |
| `cd server && npm run seed` | Semester 6 structure যোগ করে (বারবার চালালেও duplicate হবে না) |
| `cd server && npm run reset` | ⚠️ পুরো database মুছে নতুন করে seed করে (progress, notes সব মুছে যাবে) |
| `cd client && npm run build` | Production build |

---

## 📁 Folder structure

```
study-hub/
├── server/                        # Node + Express API
│   └── src/
│       ├── config.js              # port, db path, revision intervals (একজায়গায়)
│       ├── app.js                 # express app, routes mount, error handling
│       ├── index.js               # server start
│       ├── db/
│       │   ├── schema.sql         # পুরো database schema (PostgreSQL-compatible SQL)
│       │   ├── connection.js      # SQLite connection (পরে Postgres-এ বদলানোর জায়গা)
│       │   ├── migrate.js         # table তৈরি + default user
│       │   ├── seed.js            # Semester 6 starter data
│       │   └── reset.js           # reset helper
│       ├── repositories/          # সব SQL এখানে (subject, chapter, topic, note, plan, session, activity)
│       ├── services/              # business logic (progress, recommendation, planner, import, search, export)
│       ├── routes/                # HTTP endpoints
│       ├── domain/constants.js    # status enum + Bangla labels
│       └── utils/                 # date (Asia/Dhaka), row mapping, http helpers
│
├── client/                        # React + Tailwind
│   └── src/
│       ├── App.jsx                # routes
│       ├── api/client.js          # সব API call এক জায়গায়
│       ├── state/                 # AppDataContext (progress data), ToastContext
│       ├── components/
│       │   ├── layout/            # Sidebar, TopBar, BottomNav
│       │   ├── dashboard/         # Overall progress, Subject list, Plan, Recommendation, Revision, Activity
│       │   ├── topic/             # TopicRow, TopicStatusPicker, TopicNotes
│       │   ├── forms/             # Subject/Chapter/Topic add-edit modal
│       │   └── ui/                # Card, Button, Modal, ProgressBar, Donut, StatCard...
│       ├── lib/                   # date/percent formatter, status label
│       └── pages/                 # Dashboard, Subjects, Chapters, Import, Notes, Revision, Analytics, Settings
│
└── data/study.db                  # তোমার সব data (SQLite ফাইল) — backup নিলে এটাই মূল
```

---

## 🗄️ Database design

Hierarchy: **Subject → Chapter → Topic → (Study Material, Notes, Quiz, AI Content, Generated Image)**

| Table | কী রাখে |
| --- | --- |
| `users` | Phase 1-এ একজনই (id=1)। পরে auth যোগ হলে এখান থেকেই যাবে |
| `subjects` | name, বাংলা নাম, code, color, order, archive |
| `chapters` | subject_id, number, name, notes |
| `topics` | chapter_id, name, importance, **status**, confidence, revision stage/date, started/completed/last studied |
| `study_materials` | topic-ভিত্তিক link/PDF/text (Phase 2-এ UI আসবে) |
| `notes` | topic_id, source = `personal` / `ai` (দুই ধরনের নোট আলাদা থাকে) |
| `study_plan_items` | আজকের target (auto বা user-এর নিজের) |
| `activities` | Recent Activity feed |
| `study_sessions` | study time (Phase 2 timer এখানে লিখবে) |
| `revisions` | প্রতিটি revision-এর log (Phase 2-এ 더 পূর্ণ হবে) |
| `quizzes`, `quiz_questions`, `quiz_results` | Phase 3 quiz |
| `ai_contents`, `generated_images` | Phase 4–5 AI content ও illustration |

Relations: সব child table `ON DELETE CASCADE` — subject delete করলে তার chapter/topic/note সব চলে যায়।
Indexes: `subjects(user_id)`, `chapters(subject_id)`, `topics(chapter_id)`, `topics(status)`, `study_sessions(user_id, started_at)` ইত্যাদি।

DB বদলাতে চাইলে শুধু **`db/connection.js`** বদলাবে — schema-টা plain SQL, তাই PostgreSQL-এ যেতে
`INTEGER PRIMARY KEY AUTOINCREMENT → SERIAL`, `TEXT timestamps → TIMESTAMPTZ`, `0/1 → BOOLEAN` করলেই হয়।

---

## 📊 Progress কীভাবে হিসাব হয় (কখনো হাতে বসানো নয়)

* একটা topic **complete** ধরা হয় যখন status = `completed`। status = `needs_revision` হলে সে complete-ই থাকে
  (কারণ revision মানে পরে আবার পড়া, ভুলে যাওয়া নয়) — শুধু "দুর্বল" হিসেবে চিহ্নিত হয়।
* **Chapter %** = completed topic ÷ total topic × 100
* **Subject %** = ঐ subject-এর সব chapter-এর সব topic মিলিয়ে একই হিসাব
* **Semester %** = সব subject মিলিয়ে একই হিসাব

উদাহরণ: IoT Chapter 1-এ ৮/১২ topic শেষ = **৬৭%**, আর পুরো semester ৮/৭৭ = **১০%**।
কোনো topic-এর status বদলালেই উপরের সব % সাথে সাথে বদলে যায় — কারণ কোনোটাই আলাদা করে save করা নেই।

---

## 🧭 Recommendation কীভাবে হয় (spec §10)

প্রতিটি subject-কে একটা score দেওয়া হয়, তারপর সবচেয়ে বেশি score-এর subject দেখানো হয়:

| কারণ | Weight |
| --- | --- |
| কম completion | প্রতি ১% বাকি = ১ point |
| অনেক দিন পড়া হয়নি | প্রতিদিন ২.৫ point (সর্বোচ্চ ১৪ দিন) |
| Revision due | প্রতি topic = ৪ point |
| একবারও পড়া হয়নি | +৮ point |
| চালু আছে কিন্তু শেষ হয়নি | +৬ point |

Dashboard-এ প্রতিবার **কেন** সেটা লেখা থাকে — যেমন: "কম completion: ২৮% শেষ", "পড়া হয়নি: ৫ দিন",
"বাকি chapter: ৬টি"। কোনো আন্দাজি suggestion দেওয়া হয় না।

---

## 🔄 Revision system

`Learned` → `Revision 1` → `Revision 2` → `Final Revision`

* Topic complete করলে automatically **Learned**, এবং ৩ দিন পরে প্রথম revision date বসে
* Revision 1 → ৭ দিন পরে, Revision 2 → ১৪ দিন পরে, Final Revision-এর পরে আর date বসে না
* Date চলে এলে Dashboard + Revision page-এ "Revision due" badge দেখায় (দেরি হলে কত দিন সেটাও)
* "Revision complete" চাপলে পরের ধাপে যায়, `revision_count` বাড়ে

---

## 🔌 API endpoints (Phase 1)

| Method | Endpoint | কাজ |
| --- | --- | --- |
| GET | `/api/dashboard` | পুরো dashboard data (overall, subjects, plan, recommendation, revision, activity) |
| GET | `/api/progress-tree` | Subject → Chapter → Topic + সব progress |
| GET | `/api/statuses/summary` · `/api/statuses/revision-queue` | status count, revision queue |
| GET/POST/PATCH/DELETE | `/api/subjects` `/api/subjects/:id` | subject CRUD |
| GET/POST/PATCH/DELETE | `/api/chapters` `/api/chapters/:id` | chapter CRUD |
| PATCH | `/api/subjects/:id/chapters/:chapterId/status` | পুরো chapter-এর সব topic একসাথে status |
| GET/POST/PATCH/DELETE | `/api/topics` `/api/topics/:id` | topic CRUD |
| PATCH | `/api/topics/:id/status` | status বদল (progress auto হিসাব হয়) |
| POST | `/api/topics/:id/revision/complete` | revision-এর পরের ধাপে |
| GET/POST/PATCH/DELETE | `/api/notes` | personal/AI note |
| GET/POST/PATCH/DELETE | `/api/plan` + `POST /api/plan/regenerate` | আজকের target |
| POST | `/api/import/parse` · `/api/import/apply` | paste করা list থেকে subject/chapter/topic তৈরি |
| GET | `/api/search?q=` | global search (subject, chapter, topic, note, AI content) |
| GET | `/api/export/backup` · `/api/export/topics.csv` | backup (JSON) ও topic list (CSV) |

---

## 🧪 কীভাবে test করব

1. দুইটা server চালু করে `http://localhost:5173` খুলুন।
2. **Dashboard:** Semester 0% দেখাবে (কিছু complete না করায়) + ৩টা আজকের target + recommendation (কারণ সহ)।
3. **Subject → Computer Network → Chapter 1** খুলে কয়েকটা topic-এ ✅ চাপুন → % সাথে সাথে বদলাবে।
4. একটা topic-এ 🔄 (রিভিশন দরকার) চাপুন → progress কমবে না, "Revision due" badge আসবে।
5. **Revision page** → "Revision complete" চাপলে ধাপ এগোবে (Learned → Revision 1)।
6. **Import page** → উদাহরণ paste করে "Structure তৈরি করুন" → preview ঠিক করে Save করুন।
7. উপরের search box-এ `MQTT` লিখুন → IoT Chapter 1-এর MQTT topic আসবে।
8. **Settings** → backup JSON / CSV download হবে।

---

## 🗺️ পরের phase গুলো

| Phase | কী আসবে |
| --- | --- |
| **2** | Study session timer, study history, daily/weekly/monthly study time charts, পূর্ণ revision reminder |
| **3** | Quiz (MCQ / True-False / Short / Viva), weak topic detection, Exam Mode |
| **4** | AI Study Assistant: সহজ বাংলা explanation, note, MCQ, viva question generation |
| **5** | AI illustration (MQTT flow, IoT layers ইত্যাদি diagram), PDF export, advanced analytics |

Phase 1-এর ভিত্তি এমনভাবে বানানো যে পরের phase-গুলোতে নতুন করে structure বানাতে হবে না —
table, API আর UI-এর জায়গা আগে থেকেই রাখা আছে।

---

## 🧪 Automated tests

| Command | কী চেক করে | ফল |
| --- | --- | --- |
| `cd server && npm test` | API/business-logic: percentage maths, revision schedule, import parsing, search, plan, export, backup, exam, content mapping, byte helpers | ✅ 58/58 |
| `cd client && npm run smoke` | আসল app jsdom-এ render করে ১৩২টা interaction চালায় (status toggle, note, plan tick, quiz, illustration, Study Content, Exam Mode, analytics, report, backup) — **আগে `cd server && npm start` চালু থাকতে হবে** | ✅ 132/132 |
| `cd client && npm run test:browser` | ব্রাউজার-mode backend: seed, progress maths, exam clock, CRUD, reload-এর পর data ফিরে আসা | ✅ 12/12 |
| `cd client && npm run smoke:offline` | **server ছাড়া** পুরো UI (jsdom + sql.js) — live app যা করে ঠিক তাই | ✅ 63/63 |
| `node tools/browser-check.mjs <url>` | **আসল Chromium-এ deployed app**: প্রতিটা screen, dashboard → topic → Exam Mode → analytics → PDF → backup, ফোন layout (Playwright লাগে, app-এর dependency নয়) | ✅ 38/38 |
| `cd client && npm run lint` | oxlint (React hooks rules) | ✅ 0 warning |
| `cd client && npm run build` | production build | ✅ |

**কেন jsdom smoke যথেষ্ট নয়:** jsdom Node-এর ভিতরে চলে, তাই `Buffer`-এর মতো global সেখানে
আছে — কিন্তু deployed app-এ (Vercel/offline mode) backend ব্রাউজারে চলে, যেখানে ওগুলো নেই।
এই পার্থক্যেই একটা আসল bug লুকিয়ে ছিল (backup `Buffer is not defined` দিয়ে ভাঙছিল শুধু লাইভ
সাইটে) — তাই শেষ ধাপে `tools/browser-check.mjs` দিয়ে আসল ব্রাউজারে পুরো app যাচাই করা হয়।

Test রা তোমার আসল data ছুঁয়ে দেখে না: backend test একটা temp database-এ চলে, আর smoke test শেষে progress আবার `not started`-এ ফিরিয়ে দেয়।

---

## ☁️ Deploy (live link বানানোর নিয়ম)

### সবচেয়ে সহজ — Render (এক service, UI + API একসাথে)

1. Render → **New → Blueprint** → এই repo select করো (repo-তে `render.yaml` আছে) → Apply।
2. deploy শেষে যা URL পাবে, সেটাই তোমার app (`https://study-hub-xxxx.onrender.com`) — Dashboard, API, সব কিছু একই URL-এ।

⚠️ **Data সম্পর্কে সত্যি কথা:** Render-এর free plan-এ disk ephemeral — মানে প্রতিবার নতুন deploy/redeploy হলে তোমার progress মিলিয়ে যাবে। স্থায়ীভাবে নিজের data রাখতে চাইলে হয় Render-এ paid **persistent disk** (`render.yaml`-তে `disk:` অংশটা uncomment করো, mountPath `/data`), অথবা নিজের PC-তে চালাও।

### Docker দিয়ে (যেকোনো server-এ, data থাকবে)

```bash
docker build -t study-hub .
docker run -d -p 4000:4000 -v study-data:/data --name study-hub study-hub
# http://localhost:4000
```

### দুটো আলাদা host-এ (UI আর API আলাদা) — বিকল্প

1. Backend: যেকোনো Node host-এ `server/` deploy করো (`PORT`, `DB_FILE`, `CORS_ORIGIN` env set করে)।
2. Frontend build করার আগে `client/.env`-এ `VITE_API_URL=https://your-api-host` বসিয়ে `npm run build` → `client/dist` যেকোনো static host-এ (Vercel / Netlify / GitHub Pages) তুলে দাও।

### Production mode নিজের PC-তে test করতে

```bash
cd client && npm run build      # client/dist তৈরি হবে
cd ../server && npm start       # http://localhost:4000 — একই URL-এ UI + API
```

---

## 🔐 Authentication ও future-proofing

Phase 1-এ app একজনের (তোমার), তাই `users` টেবিলে একজন default user আছে আর API-তে user id আসে `x-user-id` header থেকে (না থাকলে default user)। পরে email/password auth যোগ করতে শুধু দুটো জায়গায় হাত দিলে হবে:

1. `server/src/app.js` → `getUserId()` ফাংশনটা session/JWT verification দিয়ে বদলাও
2. login/register route + UI যোগ করো

বাকি কোনো route বা UI component বদলাতে হবে না — কারণ সব query আগে থেকেই `user_id` দিয়ে filter হয়।

---

## 🛠️ Troubleshooting

* **"সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না"** → `server` চালু আছে কিনা দেখুন (`npm run dev`, port 4000)।
* **Port busy** → 4000/5173 ফ্রি করুন, অথবা `server/.env`-এর মতো করে `PORT=4100 npm run dev` চালান।
* **সব data মুছে নতুন করে শুরু** → `cd server && npm run reset` (আগে Settings থেকে backup নিন)।
