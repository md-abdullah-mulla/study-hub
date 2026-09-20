# 🎓 Smart Semester Study Management System — Live হয়ে গেছে

## 🌐 লাইভ লিংক

**https://md-abdullah-mulla.github.io/study-hub/**

ফোন, ল্যাপটপ, ট্যাব — যেকোনো ডিভাইসে খুললে অ্যাপ চলে যাবে। ফোনে Chrome খুলে
**⋮ → Add to Home screen** করলে অ্যাপের মতোই আইকন হয়ে যাবে।

---

## এটা কীভাবে কাজ করছে (গুরুত্বপূর্ণ)

এই লিংকে **আলাদা কোনো server নেই** — পুরো app তোমার ব্রাউজারের ভেতরেই চলে:

| অংশ | কোথায় চলছে |
|---|---|
| UI (React + Tailwind) | ব্রাউজার |
| API (Express — same ৩৮টি route) | ব্রাউজার |
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
| **Analytics** — basic statistics + আসল Study Time (timer থেকে) | ✅ চলছে |
| **Global Search** (`Ctrl/Cmd + K`) — subject, chapter, topic, note, question | ✅ সম্পূর্ণ |
| **Settings / Backup** — JSON backup + snapshot, CSV export, data reset | ✅ সম্পূর্ণ (server ছাড়াও) |
| **Study Session (timer)** — শুরু → টাইমার → শেষে আসল সময় + confidence + নোট + "revision দরকার" ফ্ল্যাগ, আজ/মোট/streak, সেশনের ইতিহাস | ✅ **নতুন (Phase 2)** |
| **Quiz**, **AI Assistant** | ⏳ Phase 3/4 — "Coming soon" পেজে কী আসবে লেখা আছে |

Semester-এর শুরুতে দেওয়া structure-টাই লোড করা আছে: **৫ subject / ১৩ chapter / ৭৭ topic**
(Computer Network, IoT & IoT Architecture, DBMS, Microcontroller, Security-Based Surveillance System)।

---

## Test-এর ফল (সবগুলো সবুজ)

| Test | ফল |
|---|---|
| Server API test (Node-এ) | ✅ 24/24 |
| Browser-mode backend test (sql.js) | ✅ 6/6 |
| **Offline UI smoke (server ছাড়া — live app যেমন)** | ✅ 29/29 |
| Server-mode full UI smoke (timer সহ) | ✅ 46/46 |
| oxlint | ✅ 0 warning, 0 error |
| Production + Pages build | ✅ ঠিকঠাক |

যাচাই করা হয়েছে: লাইভ সাইটের সব ফাইল (HTML, JS, CSS, WASM, favicon) **200 OK**,
deep link (যেমন `/subjects/4`) ঠিকঠাক খোলে, আর লাইভ bundle-এর MD5 hash
অবিকল আমার নিজে rebuild করা bundle-এর সাথে মিলছে — মানে যেটা GitHub-এ আছে আর যেটা তুমি
ব্রাউজারে খুলছ সেটা একই জিনিস।

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

---

## পরের ধাপে যা করতে পারি (Phase 2 → 5)

1. **Phase 2 — Study Session Tracker:** timer দিয়ে পড়া track (subject/chapter/topic, সময়, confidence, revision needed) → তার থেকে daily/weekly analytics, streak, longest streak।
2. **Phase 3 — Quiz System:** MCQ/True-False/Short/Viva, score + accuracy, weak topic বের করা, সেই অনুযায়ী revision suggestion, Exam Mode (বাস্তবসম্মত schedule)।
3. **Phase 4 — AI Assistant:** topic-wise সহজ সংজ্ঞা, ব্যাখ্যা, গুরুত্বপূর্ণ পয়েন্ট, উদাহরণ, সংক্ষিপ্ত উত্তর, সম্ভাব্য প্রশ্ন, MCQ, Viva, revision summary — save/regenerate/edit/delete, আর AI note আলাদা রাখা।
4. **Phase 5 — AI Illustration:** concept বোঝার পর শিক্ষামূলক diagram generate → preview → save → download; সাথে advanced analytics + PDF/CSV export।
