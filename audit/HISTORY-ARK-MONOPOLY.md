# پروندهٔ تاریخی: ARK-Monopoly → CityForge
**نسخهٔ ۴ (بازسازی‌شده پس از چهارمین ریست سندباکس، 2026-11-09) · نوع: حسابرسی اعتبارسنجی فنی فقط-خواندنی · قید سخت: بدون هیچ تغییر کد/commit/push/merge روی پروژهٔ مورد حسابرسی · این ریپو = بک‌اپ شواهد و مستندات، نه کد پروژه**

## بخش الف — خط زمانی مستند (از دادهٔ API و شواهد عمومی)
| زمان (UTC) | رویداد | منبع |
|---|---|---|
| 2026-05-18 | ساخت اکانت CF `Account owner` (`98d8795e…`) و زون `kinetivent.eu.cc` | `cf-api/02_accounts.json`, `cf-api/15_zones.json` |
| 2026-08-01 | دیپلوی ورکر شخصی `my-vless-proxy` (quick_editor، فعال تا 08-02) + زون `404stranger.eu.cc` | `cf-api/04_services.json`, `cf-api/15_zones.json` |
| 2026-08-12 | زون `quantixlabs.eu.cc` | `cf-api/15_zones.json` |
| 2026-08-22 19:44–20:19 | دیپلوی کامل `cityforge-edge`: ۹ نسخه (v1 upload → v2,v3 secret → v4–v8 version_upload → v9 upload+deploy) با wrangler؛ migration_tag v2 (DO SQLite)؛ ست‌شدن `SESSION_SECRET` و `PROFILE_BRIDGE_SECRET` | `cf-api/06_deployments.json`, `cf-api/07_versions.json` |
| 2026-08-22 20:19:48 | آخرین modification ورکر — **منجمد شدن پروژه** | `cf-api/04_services.json` |
| ~پیش از 2026-11-08 | حذف پروژهٔ Manus میزبان (`cityforge-2z7rzsms.manus.space`) — پاسخ manus.im: «Permission denied — [not_found] project not found» | اسکرین‌شات cf-05 (در ریست سندباکس پاک شد؛ قابل بازتولید با لاگین manus.im) |
| 2026-11-09 11:11:40 | ساخت اکانت CF «Chalk Tangelo» (`780b9303…`) — منشأ دام اکانت | `cf-api/02_accounts.json` |
| 2026-11-09 ~17:24 | دیپ‌دایو عمومی: refetch آرتیفکت‌ها با سایز بایت‌به‌بایت یکسان → پایداری دیپلوی (F-CF14)؛ `__manus___debug-collector.js` هنوز سرو می‌شد (25,168 B) | `artifacts/README.md` |
| 2026-11-09/10 ~20:06–20:55 | حسابرسی عمومی → حسابرسی ایجنت (اکانت اشتباه) → **دو اجرای حسابرسی مستقیم کامل با توکن** | `cf-api/AUDIT-REPORT-DIRECT.md` |

## بخش ب — دیپ‌دایو عمومی CityForge (یافته‌های F-CF)
*هدف: `https://cityforge-edge.0o0r7-web3.workers.dev/` — همه از دسترس عمومی، بدون توکن.*

- **F-CF1** اپ Manus-scaffolded: Vite + React 19.2.1 + Tailwind + shadcn/ui + TanStack Query + tRPC + superjson + socket.io + viem/ox/abitype.
- **F-CF2** شل استاتیک سالم: `root.html` 368,243 B · `index-P14T8RX6.js` 793,128 B · `index-Pjaa9_yt.css` 134,224 B · `ArcOwnerControl-6aTkiLY4.js` 180,011 B · `__manus___debug-collector.js` 25,168 B (آخرین مورد از 2026-11-09 ~20:45 به‌دلیل F-EDGE-13 دیگر سرو نمی‌شود — کپی در این ریپو موجود نیست، فقط سایز/هش در متون ثبت است).
- **F-CF3** رانتایم Manus Previewer کامل (حدود ۳۶۷KB) داخل HTML اینلاین است — نشانهٔ scaffold و build داخل Manus.
- **F-CF4** نشت مسیر سورس: `/home/ubuntu/cityforge-arc-game/client/src/...` در سورس‌مپ/کامنت‌ها.
- **F-CF5** صفحهٔ owner-only `ArcOwnerControl.tsx` در باندل (کنترل مالکانه، بدون لینک از UI) — باندل آن در `artifacts/assets/` موجود است.
- **F-CF6** بنر UI: «The live city connection needs to reconnect» در صفحهٔ match (`/match/<64-hex>`، ~296KB) — علت ریشه‌ای بعداً در F-EDGE-1 مستند شد.
- **F-CF7** ~~claim قبلی «بک‌اند مرده (1101 همه‌جا)»~~ — **با حسابرسی مستقیم رد شد؛ به F-EDGE-2 مراجعه شود.** (حفظ در پرونده برای شفافیت روش)
- **F-CF8** پروژهٔ Manus حذف شده (`[not_found] project not found`) → origin سخت‌کدشدهٔ بک‌اند بی‌صاحب است.
- **F-CF9** Arc Testnet زنده: chainId `0x4cef52` (5042002) ✓ تطابق باندل، بلاک 71,561,447، گس 25 gwei، RPC `rpc.testnet.arc.network`، اکسپلورر `testnet.arcscan.app`.
- **F-CF10** multicall3 کانونی `0xcA11bde05977b3631167028862bE2a173976CA11` تنها قرارداد در باندل.
- **F-CF11** آدرس قرارداد city-mark در هیچ باندلی نیست — از بک‌اند می‌آمد → جریان claim NFT غیرقابل‌دسترس (مکانیزم کامل در F-EDGE-3).
- **F-CF12** سه bytecode ERC-20 کوچک embed شده (798 / 1,410 / 11,188 hex char) — در `artifacts/assets/index-P14T8RX6.js` قابل مشاهده.
- **F-CF13** دام اکانت: توکن اولیه فقط اکانت تازه‌ساز «Chalk Tangelo» را می‌دید که cityforge-edge در آن نیست (404 code 10007) — گزارش ایجنت هم فقط همین را دید.
- **F-CF14** refetch آرتیفکت‌ها با سایز بایت‌به‌بایت یکسان → دیپلوی پایدار/بی‌تغییر (سومین تأیید: اجرای دوم حسابرسی 2026-11-09 ~20:45).

## بخش ج — حسابرسی API کلادفلر (تکمیل‌شدهٔ گزارش ایجنت)
گزارش ایجنت (فقط اکانت Chalk Tangelo): subdomain `chalk-tangelo-780`، cityforge-edge در آن وجود ندارد (404/10007 در settings/deployments/versions). آن گزارش از نظر خودش درست بود اما **ناقص**: اکانت میزبان را نمی‌دید.
**تکمیل مستقیم (2026-11-09، دو اجرا):** توکن اکانت درست را هم می‌بیند؛ حسابرسی ۱۶ مرحله‌ای کامل شد → گزارش + شواهد: `cf-api/AUDIT-REPORT-DIRECT.md` و `cf-api/*.json`.

## بخش د — حسابرسی مستقیم با توکن: یافته‌های F-EDGE
**تعیین‌کننده‌ترین نتیجهٔ پرونده:**
1. **بک‌ند زنده است** — کل چرخهٔ بازی با curl پاس شد (session 201 → room 201 → state → roll(4) → buy(520−180=340 ✓) → endTurn + نوبت AI → راند ۲). موتور سروِر-اختیار، تاس crypto امن (rejection sampling)، AI چهار شخصیتی، سهمیهٔ ۴ اتاق/دقیقه با DO.
2. **ریشهٔ خرابی UX = CORS سخت‌کدشده** روی origin مردهٔ Manus (`cityforge-2z7rzsms.manus.space`)؛ فرانت روی workers.dev از مرورگر نمی‌تواند API خودش را صدا بزند، WebSocket هم 403 → همان بنر F-CF6.
3. **معمای 1101 حل شد:** 1101 فقط با بدنهٔ خالی/JSON نامعتبر بازتولید می‌شود (`request.json()` بدون try/catch در ۴ اندپوینت) → خطای تست قبلی خودمان بود، نه مرگ بک‌اند.
4. **جریان NFT/Monopoly-claim** (`profile-binding` → `winnerTicket` با HMAC، انقضای ۱۰ دقیقه) به بک‌اند حذف‌شدهٔ Manus وابسته است → مرده.
5. یافته‌های F-EDGE-4 تا F-EDGE-13 (CSRF/SameSite=None، نشت استوریج DO، اشتراک کلید HMAC، observability خاموش، انجماد از 2026-08-22، R2 غیرفعال در اکانت، 1101 قطعی مسیر debug-collector…) → جدول کامل در `cf-api/AUDIT-REPORT-DIRECT.md`.

**خروجی ارزشمند بک‌اپ:** سورس کامل ورکر (828 خط) از API `subinfo` بازیابی شد → `cf-api/cityforge-edge-worker-source.js` — تنها نسخهٔ شناخته‌شده از بک‌اند پس از حذف پروژهٔ Manus.

## اقلام باز
1. انتخاب A/B/C تجربهٔ گیم‌پلی کاتالوگ ۴۰ بازی (A=هر ۴۰ / B⭐=۱۵ partial + ۱۰ page_only / C=رفتن به گزارش Word).
2. اعتبارسنجی ادعا-به-کد `visual-review-en.md` (engine.ts، GameCanvas.tsx، render-v2.ts، نقض قطعیت Math.random).
3. گزارش Word نهایی (مقایسهٔ 2D/2.5D/3D + ماتریس امکان‌سنجی + توصیه).
4. اسکرین‌شات‌های cf-01..05 در ریست سندباکس پاک شدند — در صورت نیاز بازتولید شوند.
5. `__manus___debug-collector.js` (25,168 B) دیگر از سرور سرو نمی‌شود (F-EDGE-13) — بازسازی فقط از آرشیو خارجی ممکن است.

## داکترین‌های حسابرسی (ثابت)
- فقط-خواندنی روی کانفیگ CF؛ POST فقط روی API عمومی محصول (معادل بازیکن).
- توکن فقط در env همان دستور؛ هرگز روی دیسک/خروجی. پس از اعلام «rotate کنید» → کاربر rotate می‌کند.
- خطای اسکوپ (401/403) → بدون retry، ثبت می‌شود.
- ادعای قبلی بدون شواهد → با تست مستقیم ابطال/تأیید و ثبت صریح اصلاح (F-CF7 → F-EDGE-2).
