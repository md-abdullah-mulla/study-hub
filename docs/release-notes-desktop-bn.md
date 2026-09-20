## 🖥️ Study Hub — Desktop App (v1.0.0)

একই Study Hub, কিন্তু পিসিতে **আলাদা অ্যাপের মতো** — ব্রাউজার খুলতে হয় না, ইন্টারনেটও লাগে না।
ভিতরে পুরো অ্যাপটাই আছে (React UI + backend + SQLite/WebAssembly), তাই কোনো সার্ভার বা আলাদা
database দরকার নেই।

### কোন ফাইল নামাবেন

| আপনার সিস্টেম | ফাইল | কতটা |
|---|---|---|
| **Windows 10/11 (64-bit)** | `Study Hub-1.0.0-win-x64-portable.zip` | ১১১ MB |
| **উবুন্টু / ডেবিয়ান / লিনাক্স মিন্ট** | `study-hub-desktop_1.0.0_amd64.deb` | ৭৫ MB |
| **যেকোনো লিনাক্স** (ইনস্টল ছাড়াই) | `Study Hub-1.0.0.AppImage` | ১০৪ MB |
| macOS | এখনো নেই — `docs/desktop-app-bn.md`-এর ধাপ ৪ (`npm run dist:mac`) | — |

### 🪟 Windows-এ চালানো (portable — ইনস্টল লাগে না)

1. ZIP ফাইলটা নামিয়ে **Extract All** করুন (ZIP-এর ভিতর থেকেই চালাবেন না)।
2. ফল্ডারের ভিতরে **`Study Hub.exe`** — ডাবল-ক্লিক করলেই অ্যাপ খুলবে।
3. চাইলে ডেস্কটপে shortcut বানিয়ে নিন (`Study Hub.exe` → Right click → Send to → Desktop)।

> Windows SmartScreen প্রথমবার "Windows protected your PC" দেখাতে পারে — কারণ ফাইলটা সাইন করা
> নয় (কোড সাইনিং সার্টিফিকেট নেই)। **More info → Run anyway** চাপলেই চলবে।

### 🐧 Linux-এ

```bash
# Debian/Ubuntu
sudo dpkg -i study-hub-desktop_1.0.0_amd64.deb
sudo apt-get -f install          # কোনো dependency বাদ পড়লে

# AppImage (ইনস্টল লাগে না)
chmod +x "Study Hub-1.0.0.AppImage"
./"Study Hub-1.0.0.AppImage"
```

### ডেটা কোথায় থাকে

Windows-এ `%APPDATA%\Study Hub\`, লিনাক্সে `~/.config/Study Hub/` — অ্যাপের মেনু থেকে
**Study Hub → ডেটা ফোল্ডার খুলো** চাপলেই খুলে যাবে। নিয়মিত **Settings → Backup (JSON)**
নামিয়ে রাখলে যেকোনো ডিভাইসে ফিরিয়ে আনা যায় (ওয়েবসাইট / ফোনের অ্যাপ / ডেস্কটপ — তিনটার
storage আলাদা)।

### যা কাজ করে

Dashboard · Subject → Chapter → Topic · auto progress · Study Session timer · Revision
(Learned → R1 → R2 → Final) · Quiz · Notes · Import Chapter · AI Assistant (API key ছাড়া,
pattern-based ও সৎভাবে লেবেল করা) · **Exam Mode** (refresh-proof timer, scope-এর বাইরের প্রশ্ন নেই,
পূর্ণ result + review + retry) · Advanced Analytics · **PDF Report** (৯ section → Print → Save as PDF) ·
Auto Backup + Backup Now + restore।

ডেস্কটপ-বিশেষ: মেনু **Ctrl+1…5** (Dashboard / Exam / Analytics / PDF Report / Settings),
window size মনে রাখে, একটাই instance চলে, বাইরের লিংক আসল ব্রাউজারে খোলে।

### যাচাই করা হয়েছে (সৎভাবে)

```
23/23 desktop checks   — Linux (source build + packaged AppImage), আসল Electron window-এ:
- app://study-hub/ থেকে চলে (localhost/serve লাগে না), খুললেই সোজা dashboard
- ০টা network request (সত্যিই offline — ফন্টও অ্যাপের ভিতরে)
- ১২টা screen + deep link (/exam, /analytics, /report …)
- যা নেই সেটা ৪০৪, path traversal আটকানো
- topic complete করে reload দিলেও data থাকে; ডেটা ফোল্ডারে database ফাইল আছে
- console-এ কোনো error নেই
```

⚠️ **Windows-এর `.exe`** ঠিক একই কোড থেকে বানানো, কিন্তু এখানে Windows মেশিন না থাকায়
**চালিয়ে টেস্ট করা হয়নি** — শুধু ফাইল গঠন যাচাই করা (PE32+ x64, ভিতরে অ্যাপের সব ফাইল,
`app://` স্টার্ট ঠিক আছে)। চালিয়ে কোনো সমস্যা হলে জানাবেন, ঠিক করে দেব।

📄 বিস্তারিত: `docs/desktop-app-bn.md` · 🌐 ওয়েব ভার্সন: https://study-hub-virid.vercel.app/
