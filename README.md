# cityforge — بک‌اپ مستندات و شواهد حسابرسی

این ریپو، **بک‌اپ رسمی پژوهش و حسابرسی اعتبارسنجی فنی CityForge** (دنبالهٔ ARK-Monopoly از کاتالوگ Candle Climber) است که در 2026-11-09 ساخته شد تا در برابر ریست‌های سندباکس کاری، شواهد و سورس بازیابی‌شده برای آینده محفوظ بماند.

## چرا این بک‌اپ مهم است
- پروژهٔ Manus میزبان CityForge **حذف شده** (`[not_found] project not found`) و ورکر `cityforge-edge` از **2026-08-22** منجمد است.
- تنها نسخهٔ شناخته‌شدهٔ سورس بک‌اند (828 خط) از API `subinfo` کلادفلر بازیابی شد و فقط همین‌جاست: [`audit/cf-api/cityforge-edge-worker-source.js`](audit/cf-api/cityforge-edge-worker-source.js).
- اسنپ‌شوت فرانت‌اند منتشرشده (باندل‌ها) در [`artifacts/`](artifacts/README.md) با هش SHA-256 ثبت شده است.

## ساختار
```
cityforge/
├── README.md                        ← همین فایل
├── audit/
│   ├── HISTORY-ARK-MONOPOLY.md      ← پروندهٔ اصلی: خط زمانی + یافته‌های F-CF1..14 و F-EDGE-1..13
│   └── cf-api/
│       ├── AUDIT-REPORT-DIRECT.md   ← گزارش حسابرسی مستقیم Cloudflare API (۱۶ مرحله GET + تست زنده)
│       ├── 01_verify.json … 16_audit_logs.json   ← شواهد خام API (دو اجرا، سایز یکسان)
│       └── cityforge-edge-worker-source.js       ← سورس کامل ورکر بازیابی‌شده (828 خط)
├── artifacts/
│   ├── README.md                    ← اصل و نسب + هش‌ها + فایل غایب (debug-collector)
│   ├── root.html                    ← 368,243 B — شامل رانتایم Manus Previewer
│   ├── assets/index-P14T8RX6.js     ← 793,128 B — باندل اصلی (React/Arc/multicall3)
│   ├── assets/index-Pjaa9_yt.css    ← 134,224 B
│   ├── assets/ArcOwnerControl-6aTkiLY4.js ← 180,011 B — صفحهٔ owner-only
│   └── headers-root.txt             ← هدرهای پاسخ روت
└── tools/
    └── cf_edge_audit.sh             ← اسکریپت بازتولید حسابرسی (توکن از env، فقط GET)
```

## یافته‌های تعیین‌کننده (خلاصهٔ یک‌نگاهی)
| # | یافته |
|---|---|
| 1 | **بک‌ند زنده است** — کل چرخهٔ بازی (session→room→roll→buy→AI) با curl پاس شد؛ claim قبلی «1101 = مرگ بک‌اند» ابطال شد (1101 فقط با بدنهٔ JSON خراب). |
| 2 | **ریشهٔ خرابی UX:** CORS سخت‌کدشده روی origin مردهٔ Manus → فرانت workers.dev نمی‌تواند از مرورگر API خودش را صدا بزند؛ WebSocket هم 403. |
| 3 | **جریان NFT claim** (winnerTicket با HMAC، ۱۰ دقیقه اعتبار) به بک‌اند حذف‌شدهٔ Manus وابسته است → مرده. |
| 4 | تاس سروِر-اختیار با `crypto.getRandomValues` + rejection sampling (بدون `Math.random`)؛ نشست HMAC-SHA256 با مقایسهٔ constant-time. |
| 5 | ورکر از 2026-08-22T20:19:48Z منجمد؛ R2 روی اکانت غیرفعال؛ بدون KV/D1/Queues/Cron — معماری خالص DO+SQLite. |

## بازتولید حسابرسی
```bash
export CF_TOKEN='<توکن با اسکوپ Workers Scripts:Read روی اکانت 0o0r7>'
bash tools/cf_edge_audit.sh   # خروجی در audit/cf-api/*.json
```
داکترین: فقط GET؛ توکن فقط در env؛ خطای اسکوپ → بدون retry؛ پس از اتمام، توکن rotate شود.

## آنچه عمداً در این ریپو نیست
- هر توکن/کوکی/secret (مقادیر secret توسط خود CF redact می‌شوند و هرگز استخراج نشدند).
- فایل‌های `.env` پروژهٔ کاری و هر دادهٔ محرمانهٔ دیگر.
- اسکرین‌شات‌های cf-01..05 (در ریست سندباکس پاک شدند؛ قابل بازتولید).
- کد اپلیکیشن Candle Climber (ریپوی خودش را دارد).

## مجوز
مستندات و شواهد، متعلق به پژوهش حسابرسی 0o0r7 است. سورس بازیابی‌شدهٔ ورکر کد مالک اکانت (`[redacted-email]`) است و صرفاً به‌عنوان بک‌اپ شخصیِ همان مالک این‌جا نگهداری می‌شود.
