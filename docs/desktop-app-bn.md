# 🖥️ Desktop App — Study Hub (Windows / Linux / macOS)

একই অ্যাপ, কিন্তু পিসিতে **আলাদা অ্যাপের মতো** — ব্রাউজার খুলতে হয় না, ইন্টারনেটও লাগে না।
ভেতরে ঠিক একই জিনিস চলে: React UI + পুরো backend + SQLite (WebAssembly-তে) — অর্থাৎ অ্যাপ নিজেই
নিজের database, কোনো সার্ভার লাগে না।

---

## ১. আপনার জন্য কোন ফাইলটা

| আপনি যা চান | ফাইল | ডাউনলোড |
|---|---|---|
| উবুন্টু / ডেবিয়ান / লিনাক্স মিন্ট | `study-hub-desktop_1.0.0_amd64.deb` (৭৫ MB) | **[⬇ download](https://github.com/md-abdullah-mulla/study-hub/releases/download/desktop-v1.0.0/study-hub-desktop_1.0.0_amd64.deb)** |
| যেকোনো লিনাক্স (ইনস্টল ছাড়াই চলে) | `Study Hub-1.0.0.AppImage` (১০৪ MB) | **[⬇ download](https://github.com/md-abdullah-mulla/study-hub/releases/download/desktop-v1.0.0/Study.Hub-1.0.0.AppImage)** |
| উইন্ডোজ | `Study Hub Setup 1.0.0.exe` | নিজে বানাতে হবে (ধাপ ৪) — উইন্ডোজ মেশিনে |
| ম্যাক | `Study Hub-1.0.0.dmg` | নিজে বানাতে হবে — ম্যাক মেশিনে |

সব ফাইল একসাথে: **https://github.com/md-abdullah-mulla/study-hub/releases**

লিনাক্সে ইনস্টল:

```bash
# ডেবিয়ান/উবুন্টু — টার্মিনালে
sudo dpkg -i study-hub-desktop_1.0.0_amd64.deb
# কিছু dependency বাদ পড়লে:
sudo apt-get -f install

# AppImage (ইনস্টল লাগে না)
chmod +x "Study Hub-1.0.0.AppImage"
./"Study Hub-1.0.0.AppImage"
```

ইনস্টল হয়ে গেলে Start menu / Applications-এ **Study Hub** নামে আইকন পাবেন।

---

## ২. ডেটা কোথায় থাকে

| প্ল্যাটফর্ম | ফোল্ডার |
|---|---|
| লিনাক্স | `~/.config/Study Hub/` |
| উইন্ডোজ | `%APPDATA%\Study Hub\` |
| ম্যাক | `~/Library/Application Support/Study Hub/` |

ওই ফোল্ডারে Chrome-এর storage (IndexedDB) থাকে — ওখানেই তোমার progress, note, quiz, exam সব।
অ্যাপের মেনু থেকে **Study Hub → ডেটা ফোল্ডার খুলো** চাপলেই সরাসরি খুলে যাবে।

> ⚠️ **দুই জায়গার ডেটা আলাদা:** ওয়েবসাইট (Vercel/Pages), ফোনে ইনস্টল করা অ্যাপ, আর এই
> ডেস্কটপ অ্যাপ — তিনটাই আলাদা storage ব্যবহার করে। তাই বদল করতে হলে
> **Settings → Backup (JSON)** নামিয়ে অন্যটায় restore করতে হবে।

---

## ৩. কী কী কাজ করে

পুরো ফিচার সেটই আছে (ওয়েবসাইটের সাথে ১০০% একই কোড):

- Dashboard, Subject → Chapter → Topic, auto progress (কখনো হাতে বসানো যায় না)
- Study Session timer, Revision (Learned → R1 → R2 → Final), Quiz, Notes, Import Chapter
- AI Assistant (pattern-based, কোনো API key লাগে না, সেভ করা content "draft — যাচাই করো" লেবেল সহ)
- **Exam Mode** (refresh-Proof timer, প্রশ্ন আসে শুধু বাছা scope থেকে, পূর্ণ result summary + review + retry)
- Advanced Analytics, **PDF Report** (৯টা section → Print → Save as PDF)
- Auto Backup + Backup Now + restore

ডেস্কটপ-বিশেষ সুবিধা:

- মেনুবার থেকে সোজা যাওয়া: **Dashboard (Ctrl+1) · Exam (Ctrl+2) · Analytics (Ctrl+3) · PDF Report (Ctrl+4) · Settings (Ctrl+5)**
- window-এর size/position মনে রাখে, একটাই instance চলে (একই database দুইবার খুলে নষ্ট হবে না)
- বাইরের লিংক ক্লিক করলে সেটা আসল ব্রাউজারে খোলে, অ্যাপের ভিতরে না
- ইন্টারনেট/text কখনো বাইরে যায় না — QA check-এ প্রমাণ করা আছে: **০টা network request**

---

## ৪. নিজে build করতে চাইলে

```bash
# ১) ওয়েব অ্যাপটাকে desktop-এর জন্য build করো
cd ~/study-hub/client
npm install
npm run build:desktop            # → client/dist-desktop/

# ২) desktop shell চালাও (ডেভেলপমেন্টে)
cd ../desktop
npm install
npm start                        # electron উইন্ডো খুলবে

# ৩) ইনস্টলার বানাও
npm run dist:linux               # AppImage + deb   (লিনাক্সে চলে)
npm run dist:win                 # NSIS installer + portable (উইন্ডোজে চালাতে হবে)
npm run dist:mac                 # dmg (ম্যাকে চালাতে হবে)
```

আউটপুট থাকে `desktop/release/`-এ। `npm start` / `dist:*` আগে `prepare-app` নিজেই চলে, যেটা
`client/dist-desktop` → `desktop/app` কপি করে এবং build না থাকলে স্পষ্ট error দেয়।

**উইন্ডোজ/ম্যাক installer কেন এখানে বানানো যায়নি:** electron-builder উইন্ডোজের `.exe` বানাতে
নিজের NSIS toolchain (বা wine) লাগে, আর ম্যাকের `.dmg` বানাতে ম্যাক লাগে। তাই লিনাক্সের
AppImage + deb বানিয়ে যাচাই করা হয়েছে, আর উইন্ডোজ/ম্যাকের কমান্ড দুটো উপরের মতো দিলাম —
নিজের মেশিনে একবার চালালেই তৈরি।

---

## ৫. ভিতরে কী আছে (যে ক’টা ফাইল)

```
desktop/
├─ main.cjs                 # Electron main: app:// scheme-এ অ্যাপ serve করে, মেনু, window state, single instance
├─ preload.cjs              # শুধু একটা ছোট bridge: studyHubDesktop { isDesktop, openDataFolder, ... }
├─ package.json             # electron + electron-builder, dist:linux / dist:win / dist:mac
├─ scripts/prepare-app.mjs  # client/dist-desktop → desktop/app (build ছাড়া চলবে না)
├─ scripts/build-deb.sh     # .deb নিজে বানানো (fpm ছাড়া, dpkg-deb দিয়ে)
└─ build/icon.png           # অ্যাপের আইকন (tools/make-icons.py থেকে)
```

**কেন `file://` নয়, `app://`:** Chromium `file://` পেজকে "opaque origin" ধরে, আর সেখানে
IndexedDB/WebAssembly storage ঠিকভাবে কাজ করে না — অর্থাৎ progress হারানোর ভয় থাকে।
`app://study-hub/` একটা নিবন্ধিত standard + secure scheme, ওয়েবসাইটের মতোই আচরণ করে।
(এটা app ready হওয়ার **আগে** register করতে হয় — কোডে ওই কারণেই comment দেওয়া আছে।)

---

## ৬. যাচাই করা হয়েছে (প্রমাণ)

```bash
# অ্যাপ চালু রেখে (npm start, অথবা AppImage --remote-debugging-port=9222)
PLAYWRIGHT_HOME=/tmp/qa node tools/desktop-check.mjs 9222
```

ফলাফল **23/23** (source build এবং packaged AppImage — দুটোতেই):

- `app://study-hub/index.html` থেকে চলে (localhost/সার্ভার কিছুই লাগে না)
- **০টা network request** — সত্যিই offline
- ১২টা screen খোলে (deep link সহ: `/exam`, `/analytics`, `/report` …)
- যা নেই সেটা ৪০৪ দেয়, আর `../../package.json` (path traversal) আটকানো
- topic complete করে reload দিলেও data থাকে; ডেটা ফোল্ডারে database ফাইল সত্যিই আছে
- console-এ কোনো error নেই
