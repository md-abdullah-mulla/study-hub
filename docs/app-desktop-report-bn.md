# 📱 App Version + 🖥️ Desktop Version — Final Report

তারিখ: ২০২৬-০৯-২০ · শেষ commit: `bb786db` · লাইভ: **https://study-hub-virid.vercel.app/**
ডেস্কটপ ইনস্টলার: **https://github.com/md-abdullah-mulla/study-hub/releases/tag/desktop-v1.0.0**

---

## ১. কী বানানো হলো

| | কী | কোথায় পাবেন |
|---|---|---|
| **App version** | ওয়েবসাইটটাই এখন **ইনস্টল করা অ্যাপ** — হোম স্ক্রিনে/Start menu-তে আইকন, ব্রাউজারের ট্যাব ছাড়া নিজের উইন্ডোতে খোলে, **ইন্টারনেট ছাড়াও চলে** | সাইটে ঢুকে **Settings → “App হিসেবে ইনস্টল করো”** |
| **Desktop version — Windows** | পিসির জন্য আলাদা অ্যাপ (Electron), portable — unzip করে `Study Hub.exe` | **[⬇ ZIP](https://github.com/md-abdullah-mulla/study-hub/releases/download/desktop-v1.0.0/Study.Hub-1.0.0-win-x64-portable.zip)** |
| **Desktop version — Linux** | একই অ্যাপ, লিনাক্সে | **[⬇ AppImage](https://github.com/md-abdullah-mulla/study-hub/releases/download/desktop-v1.0.0/Study.Hub-1.0.0.AppImage)** · **[⬇ .deb](https://github.com/md-abdullah-mulla/study-hub/releases/download/desktop-v1.0.0/study-hub-desktop_1.0.0_amd64.deb)** |

দুটোই **একই কোড** — React UI + পুরো backend + SQLite (WebAssembly) — তাই কোথাও সার্ভার বা
আলাদা database লাগে না।

---

## ২. কোন কোন ফাইল তৈরি/পরিবর্তন হয়েছে

### App version (PWA)
| ফাইল | কাজ |
|---|---|
| `client/public/manifest.webmanifest` *(নতুন)* | ব্রাউজারকে বলে এটা একটা অ্যাপ: বাংলা নাম, standalone, theme রঙ, maskable আইকন, shortcuts (Dashboard / Exam / Analytics / Report) |
| `client/public/sw.js` *(নতুন)* | Service worker — অ্যাপের নিজের copy রাখে, তাই ইন্টারনেট ছাড়াও খোলে। `/api/*` কখনো cache করে না; প্রতি build-এ `__BUILD__` stamp বদলায় → পুরোনো cache নিজে মুছে যায় |
| `client/public/icons/*` + `client/public/favicon.ico` *(নতুন)* | ৮টা PNG (192/512/maskable/apple-touch/1024/16/32) + multi-size .ico |
| `tools/make-icons.py` *(নতুন)* | আইকন ব্র্যান্ড রঙে (brand-700 → brand-500) আঁকে — graduation cap + rising bars |
| `client/src/lib/pwa.js` *(নতুন)* | service worker registration (base-aware), install detection, platform-ভিত্তিক ইনস্টল ধাপ |
| `client/src/components/pwa/InstallAppCard.jsx` *(নতুন)* | Settings-এর কার্ড: সত্যিকারের ইনস্টল বাটন (যেখানে ব্রাউজার দেয়), নাহলে ধাপ ধাপ নির্দেশ; এখন কী চলছে (ব্রাউজার / ইনস্টল করা অ্যাপ / ডেস্কটপ) + Version |
| `client/src/components/pwa/UpdateBanner.jsx` *(নতুন)* | “নতুন version এসেছে → Reload” + “অ্যাপ এখন ইন্টারনেট ছাড়াও চলবে” জানানো |
| `client/index.html` | manifest/icon/apple meta; **ফন্ট অ্যাপের ভিতরে** (আর কোনো Google Fonts request নেই); path গুলো `%BASE_URL%` দিয়ে base-aware |
| `client/src/main.jsx` · `AppLayout.jsx` · `SettingsPage.jsx` | service worker চালু, banner + install card যুক্ত |
| `client/scripts/fetch-fonts.mjs` *(নতুন)* | Inter + Noto Sans Bengali woff2 once নামিয়ে `public/fonts/`-এ রাখে (৩৫৭ KB, ৪০টা @font-face) |
| `client/vite.config.js` | `--mode desktop` → `dist-desktop`; build stamp; `__APP_VERSION__` (package.json থেকে) |
| `client/.env.desktop` · `client/package.json` | desktop build mode + `build:desktop` / `preview:desktop` scripts |
| `vercel.json` | `/sw.js` → `Cache-Control: max-age=0` + `Service-Worker-Allowed: /`; manifest-এর cache |

### Desktop version (Electron)
| ফাইল | কাজ |
|---|---|
| `desktop/main.cjs` *(নতুন)* | মেইন প্রসেস: বিল্ট অ্যাপ `app://study-hub/` থেকে serve করে (file:// নয় — কারণ ওখানে IndexedDB/WASM storage ভাঙে), `/exam`-এর মতো আসল URL-ও খোলে (SPA fallback), নেই এমন ফাইল ৪০৪, `../..` বন্ধ, মেনু **Ctrl+1…5**, window size মনে রাখে, একটাই instance, বাইরের লিংক আসল ব্রাউজারে |
| `desktop/preload.cjs` *(নতুন)* | শুধু ছোট bridge: `studyHubDesktop { isDesktop, openDataFolder, openDownloadsFolder, info }` |
| `desktop/package.json` *(নতুন)* | electron ^33 + electron-builder; `prepare-app` / `start` / `pack` / `dist:linux` / `dist:win` / `dist:mac` |
| `desktop/scripts/prepare-app.mjs` *(নতুন)* | `client/dist-desktop` → `desktop/app` কপি করে; build না থাকলে স্পষ্ট error |
| `desktop/scripts/build-deb.sh` *(নতুন)* | `.deb` নিজে বানায় (dpkg-deb দিয়ে) — কারণ এই container-এ fpm-এর tar কাজ করে না |
| `desktop/build/icon.png` *(নতুন)* | অ্যাপের আইকন (1024px) |
| `desktop/.gitignore` | `app/`, `release/`, `node_modules/` — বিল্ট জিনিস git-এ যাবে না |

### QA tools (অ্যাপের dependency নয়)
`tools/pwa-check.mjs` *(নতুন, ১৩টা check)* · `tools/desktop-check.mjs` *(নতুন, ২৩টা check)* ·
`tools/browser-check.mjs` (এখন ৩৯টা check) · `tools/README-bn.md` *(নতুন)*

---

## ৩. নতুন dependency

| জায়গা | dependency | কেন |
|---|---|---|
| `desktop/package.json` | `electron` ^33, `electron-builder` ^25 | ডেস্কটপ অ্যাপ + ইনস্টলার (শুধু `desktop/`-এ, অ্যাপের ওয়েব build-এ কিছুই যোগ হয়নি) |
| QA (app-এ নয়) | Playwright | শুধু `/tmp/qa`-তে, `package.json`-এ নেই |

অ্যাপের নিজের dependency অপরিবর্তিত — কোনো নতুন library যোগ হয়নি, কোনো API key লাগে না।

---

## ৪. Build status

| Build | ফল |
|---|---|
| `client && npm run build` (dev/সার্ভার build) | ✅ |
| `client && npm run build:pages` (GitHub Pages) | ✅ 404.html + .nojekyll সহ |
| `client && npm run build:vercel` (Vercel) | ✅ |
| `client && npm run build:desktop` (ডেস্কটপ) | ✅ ✅ (fonts + manifest + icons + sw সহ) |
| `desktop && npm run pack` → `desktop/release/linux-unpacked` | ✅ |
| AppImage | ✅ **Study Hub-1.0.0.AppImage** (১০৪ MB) |
| deb | ✅ **study-hub-desktop_1.0.0_amd64.deb** (৭৫ MB) |
| Windows portable (ZIP, `Study Hub.exe`) | ✅ **Study Hub-1.0.0-win-x64-portable.zip** (১১১ MB) — লিনাক্স থেকেই বানানো (`--win dir --config.win.signAndEditExecutable=false`) |
| Windows NSIS installer (.exe setup) / macOS dmg | ⏳ Windows/ম্যাক মেশিন (বা CI) লাগে — কমান্ড প্রস্তুত (`npm run dist:win` / `dist:mac`) |

---

## ৫. Deployment status

| কী | কোথায় | অবস্থা |
|---|---|---|
| ওয়েবসাইট + App version | **https://study-hub-virid.vercel.app/** | ✅ live (নতুন deploy, alias verify করা) |
| ওয়েবসাইট + App version | **https://md-abdullah-mulla.github.io/study-hub/** | ✅ live |
| ডেস্কটপ ইনস্টলার | **github.com/md-abdullah-mulla/study-hub/releases** | ✅ release `desktop-v1.0.0`, **তিনটাই** upload: Windows ZIP + Linux AppImage + .deb (লিংক যাচাই করা) |
| কোড | `main @ bb786db` | ✅ push করা |

---

## ৬. যাচাই (আসল ব্রাউজার / আসল অ্যাপে — সব সবুজ)

| Test | ফল |
|---|---|
| Server API test | ✅ **58/58** |
| Browser-mode backend test | ✅ **12/12** |
| Full UI smoke (server mode) | ✅ **132/132** |
| Offline UI smoke (server ছাড়া) | ✅ **63/63** |
| oxlint | ✅ 0 warning / 0 error |
| **App version check — Vercel** | ✅ **13/13** |
| **App version check — GitHub Pages** | ✅ **13/13** |
| **Full app check — Vercel** | ✅ **39/39** |
| **Full app check — GitHub Pages** | ✅ **39/39** |
| **Desktop app check — source build** | ✅ **23/23** |
| **Desktop app check — packaged AppImage** | ✅ **23/23** |

App version check-এ প্রমাণিত: Chrome manifest পড়তে পারে, installation-এ কোনো বাধা নেই
(`installabilityErrors: []`), প্রতিটা আইকন PNG হিসেবেই লোড হয়, service worker register হয় ও
পেজ নিয়ন্ত্রণ করে, আর **নেটওয়ার্ক বন্ধ করে** অ্যাপ খোলে — এমনকি `/exam` deep link-ও — এবং
সেখানে topic complete করে save-ও কাজ করে।

Desktop check-এ প্রমাণিত: অ্যাপ `app://study-hub/` থেকে চলে, **শূন্য network request**,
১২টা screen (deep link সহ) খোলে, missing asset ৪০৪, path traversal বন্ধ, ডেটা reload-এর পরও
থাকে, ডেটা ফোল্ডারে database ফাইল সত্যিই আছে, console পরিষ্কার।

### এই ধাপে ধরা পড়া দুটো আসল bug (ঠিক করা হয়েছে)

| Bug | কারণ | সমাধান |
|---|---|---|
| deep link-এ **ফন্ট/ম্যানিফেস্ট ভাঙা** — console-এ “unsupported MIME type (text/html)” | `index.html`-এ path ছিল relative (`fonts/fonts.css`), তাই `/subjects/4/chapters/9`-এ গিয়ে ব্রাউজার `/subjects/4/chapters/fonts/fonts.css` চাইত → SPA rewrite HTML ফেরাত | Vite-এর `%BASE_URL%` ব্যবহার (`/` আর `/study-hub/` দুই জায়গাতেই ঠিক) + service worker-ও base-aware ভাবে register |
| ডেস্কটপ অ্যাপ **Google Fonts-এ request পাঠাচ্ছিল** (offline অ্যাপে অন্যায়) | ফন্ট CDN থেকে আসত | ফন্ট অ্যাপের ভিতরে (`public/fonts/`) — এখন ০টা বাইরের request |

---

## ৭. সীমাবদ্ধতা (যা এখনো নেই — লুকিয়ে রাখিনি)

1. **Windows installer (`.exe`) আর macOS (`.dmg`)** এখনো বানানো হয়নি — electron-builder-কে
   সেই OS-এ (বা CI-তে) চালাতে হয়। কমান্ড তৈরি: `cd desktop && npm run dist:win` / `dist:mac`
   (ধাপে ধাপে `docs/desktop-app-bn.md`)। লিনাক্সের AppImage + deb বানানো ও যাচাই করা হয়েছে।
2. **ডেটা প্রতিটি ইনস্টলে আলাদা** — ওয়েবসাইট, ফোনে ইনস্টল করা অ্যাপ, ডেস্কটপ অ্যাপ — তিনটাই
   নিজের storage ব্যবহার করে। বদলাতে হলে **Settings → Backup (JSON)** নামিয়ে অন্যটায় restore।
3. **iOS-এ ইনস্টল বাটন আসে না** (Apple-এর নিয়ম) — তাই iPhone-এ কার্ডে শুধু ধাপ দেখানো হয়
   (Share → Add to Home Screen)। বাকি সব জায়গায় আসল Install বাটন আসে।
4. **ডেস্কটপ অ্যাপ auto-update করে না** — নতুন version চাইলে GitHub Releases থেকে নতুন ফাইল
   নামিয়ে আবার ইনস্টল করতে হবে (ওয়েব/ফোনের অ্যাপে কিন্তু “নতুন version → Reload” আছে)।
5. **ইনস্টলার সাইন করা নয়** (কোড সাইনিং সার্টিফিকেট নেই) — উইন্ডোজে SmartScreen-এ “More info →
   Run anyway” লাগতে পারে; লিনাক্সে `.deb` `/opt/Study Hub`-এ বসে।
6. **Study Material UI/API**, **সত্যিকারের AI API content** (key লাগবে) আর **prompt → আসল ছবি**
   — আগের রিপোর্টের মতোই এখনো বাকি।

---

## ৮. ছোট করে ব্যবহারের নিয়ম

```bash
# 📱 ফোনে অ্যাপ বানাতে
https://study-hub-virid.vercel.app/ খুলুন → Settings → “App হিসেবে ইনস্টল করো”

# 🖥️ লিনাক্সে ডেস্কটপ অ্যাপ
wget https://github.com/md-abdullah-mulla/study-hub/releases/download/desktop-v1.0.0/study-hub-desktop_1.0.0_amd64.deb
sudo dpkg -i study-hub-desktop_1.0.0_amd64.deb && sudo apt-get -f install

# 🖥️ অথবা ইনস্টল ছাড়াই
wget -O "Study Hub.AppImage" https://github.com/md-abdullah-mulla/study-hub/releases/download/desktop-v1.0.0/Study.Hub-1.0.0.AppImage
chmod +x "Study Hub.AppImage" && ./"Study Hub.AppImage"
```
