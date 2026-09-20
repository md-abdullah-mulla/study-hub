# ডেস্কটপ ইনস্টলার কোথায়

এই ফোল্ডারে (`desktop/release/`) যে বড় ফাইলগুলো তৈরি হয়, সেগুলো workspace-এ রাখা হয় না
(সাইজ বড়), কিন্তু **প্রকাশ করা হয়ে গেছে** — GitHub Releases থেকে সবাই নামাতে পারে:

| ফাইল | সাইজ | লিংক |
|---|---|---|
| `Study Hub-1.0.0.AppImage` | ১০৪ MB | https://github.com/md-abdullah-mulla/study-hub/releases/download/desktop-v1.0.0/Study.Hub-1.0.0.AppImage |
| `study-hub-desktop_1.0.0_amd64.deb` | ৭৫ MB | https://github.com/md-abdullah-mulla/study-hub/releases/download/desktop-v1.0.0/study-hub-desktop_1.0.0_amd64.deb |

আবার নিজে বানাতে চাইলে:

```bash
cd client && npm run build:desktop     # ওয়েব অ্যাপ → dist-desktop
cd ../desktop && npm install
npm run dist:linux                     # AppImage + deb  → release/
# Windows/macOS: npm run dist:win / dist:mac  (ঐ OS-এ চালাতে হবে)
```

`node tools/desktop-check.mjs 9222` দিয়ে যাচাই করা ফল (source build ও packaged AppImage — দুটোতেই):
**23/23** · `docs/app-desktop-report-bn.md`-এ পূর্ণ রিপোর্ট।
