# 🎓 Smart Semester Study Management System — Live হয়ে গেছে

## 🌐 লাইভ লিংক

**https://md-abdullah-mulla.github.io/study-hub/**

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
| **Exam Mode**, আর সত্যিকারের AI API দিয়ে content (তোমার API key লাগবে) | ⏳ Phase 5 — "Coming soon" পেজে কী আসবে লেখা আছে |

Semester-এর শুরুতে দেওয়া structure-টাই লোড করা আছে: **৫ subject / ১৩ chapter / ৭৭ topic**
(Computer Network, IoT & IoT Architecture, DBMS, Microcontroller, Security-Based Surveillance System)।

---

## Test-এর ফল (সবগুলো সবুজ)

| Test | ফল |
|---|---|
| Server API test (Node-এ) | ✅ 42/42 |
| Browser-mode backend test (sql.js) | ✅ 7/7 |
| **Offline UI smoke (server ছাড়া — live app যেমন)** | ✅ 45/45 |
| Server-mode full UI smoke (timer + analytics + quiz + illustration + study content সহ) | ✅ 82/82 |
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
4. **Phase 5 — AI Illustration (image generation):** এখন prompt generator হয়েছে; Phase 5-এ ওই prompt সোজা AI image API-তে পাঠিয়ে ছবি generate → preview → save → download হবে। architecture আগেই আলাদা রাখা হয়েছে (`illustrationPromptService.js`-এ শুধু একটা function যোগ করলেই হবে)। সাথে advanced analytics + PDF export।
