# 🧪 QA tools — আসল ব্রাউজারে / আসল অ্যাপে যাচাই

এই ফোল্ডারের দুটো tool app-এর dependency **নয়** (Playwright `package.json`-এ নেই), শুধু
delivery-র আগে নিজে যাচাই করার জন্য। jsdom smoke Node-এর ভিতরে চলে, তাই `Buffer`-এর মতো
ব্রাউজার-নয় এমন global ওখানে কাজ করে — কিন্তু deployed app-এ backend ব্রাউজারে চলে, যেখানে
ওগুলো নেই। **এই পার্থক্যেই একটা আসল bug (backup `Buffer is not defined`) শুধু লাইভ সাইটে
ধরা পড়েছিল।** তাই শেষ ধাপে সবসময় আসল ব্রাউজার/আসল অ্যাপে যাচাই করা হয়।

## প্রস্তুতি (একবার)

```bash
mkdir -p /tmp/qa && cd /tmp/qa && npm init -y && npm i playwright
npx playwright install chromium            # লিনাক্সে libnspr4/libnss3 ইত্যাদি না থাকলে সেগুলোও লাগবে
```

## ১) `browser-check.mjs` — ওয়েব অ্যাপ (৩৮টা check)

```bash
PLAYWRIGHT_HOME=/tmp/qa node tools/browser-check.mjs http://127.0.0.1:5173
# অথবা লাইভ সাইটে
PLAYWRIGHT_HOME=/tmp/qa node tools/browser-check.mjs https://study-hub-virid.vercel.app/
```

প্রতিটা screen খুলে দেখে কোথাও `undefined`/`NaN`/`[object Object]` ছাপে কি না, dashboard →
subject → chapter → topic navigation, topic complete করে reload দিয়ে data থাকছে কি না,
topic content নিজের subject-এর কি না, Exam Mode পুরোটা, analytics, PDF report + print,
Backup Now, আর ফোন layout — সাথে console error-ও গোনে।

`SHOT_DIR=/path` দিলে screenshot-ও রাখে।

## ২) `desktop-check.mjs` — ডেস্কটপ অ্যাপ (২৩টা check)

```bash
# আগে অ্যাপ চালু করো (dev: cd desktop && npm start
#  অথবা packaged: ./release/Study\ Hub-1.0.0.AppImage --remote-debugging-port=9222 --no-sandbox)
PLAYWRIGHT_HOME=/tmp/qa node tools/desktop-check.mjs 9222
```

দেখে: অ্যাপ `app://study-hub/` থেকে চলছে কি না, preload bridge কাজ করছে কি না, **শূন্য network
request** (সত্যিই offline), ১২টা screen + deep link, missing asset ৪০৪, path traversal বন্ধ,
data reload-এর পরও থাকে, ডেটা ফোল্ডারে database ফাইল আছে, console পরিষ্কার।

## ৩) `make-icons.py` — অ্যাপের আইকন

```bash
python3 tools/make-icons.py     # client/public/icons/* + favicon.ico (+ desktop/build/icon.png কপি করো)
```

ব্র্যান্ড রঙে (brand-700 → brand-500) graduation cap + rising bars — ফোন, ব্রাউজার আর
ডেস্কটপ তিন জায়গায় একই আইকন।

> লিনাক্স sandbox-এ (root নেই) এই tool গুলো চালাতে Xvfb + কিছু library লাগতে পারে;
> Details `docs/desktop-app-bn.md`-তে।
