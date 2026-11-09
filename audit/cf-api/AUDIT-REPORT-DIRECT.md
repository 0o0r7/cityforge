# گزارش حسابرسی مستقیم Cloudflare API — cityforge-edge
**تاریخ اجرا:** 2026-11-09 (UTC ~20:06–20:20، بازگیری مجدد ~20:45–20:55 پس از ریست سندباکس) · **روش:** Bearer token در env، فقط GET + تست عملکردی عمومی API بازی · **اصلاح جایگزین:** گزارش قبلی ایجنت Cloudflare (اکانت Chalk Tangelo) ناقص/مبتنی بر اکانت اشتباه بود و این‌جا کامل شد.

## ۰. خلاصهٔ مدیریتی
1. توکن `d3bac7fb…` حالا **دو اکانت** را می‌بیند: `0o0r7.web3@gmail.com's Account` (id `98d8795e246386dd8cfe24e22b128426`، subdomain **`0o0r7-web3`**) و `Chalk Tangelo` (`780b9303…`). گزارش قبلی ایجنت فقط اکانت دوم را می‌دید و به‌درستی «cityforge-edge نیست» گفت؛ حسابرسی روی اکانت درست **تکمیل شد**.
2. **بک‌اند زنده است.** نتیجه‌گیری قبلی پرونده («همهٔ /api/* → 1101، بک‌اند مرده») **رد شد**: خطای 1101 بازتولید شد فقط با POST بدون بدنهٔ JSON معتبر (`await request.json()` بدون try/catch). کل چرخهٔ بازی (session → room → state → roll → buy → endTurn + نوبت AI) با curl زنده پاس شد.
3. **ریشهٔ واقعی خرابی UX:** CORS سخت‌کدشده روی origin مردهٔ Manus (`https://cityforge-2z7rzsms.manus.space`) — فرانت‌اند دیپلوی‌شده روی workers.dev نمی‌تواند از مرورگر API خودش را صدا بزند و WebSocket هم 403 می‌گیرد.
4. ورکر از **2026-08-22T20:19:48Z منجمد** است؛ معماری: Worker + ASSETS + ۲ Durable Object (SQLite) + ۲ secret. بدون KV/D1/R2/Queues/Cron (R2 اصلاً روی اکانت فعال نیست — کد 10042).

## ۱. نتایج ۱۶ مرحلهٔ GET
| # | اندپوینت | وضعیت | نکته |
|---|---|---|---|
| 01 | /user/tokens/verify | ✅ 200 | active تا 2026-11-17 |
| 02 | /accounts | ✅ 200 | دو اکانت (بالا) |
| 03 | subdomain | ✅ 200 | `0o0r7-web3` |
| 04 | workers/services | ✅ 200 | cityforge-edge + my-vless-proxy |
| 05 | settings | ✅ 200 | bindings کامل (بخش ۲) |
| 06 | deployments | ✅ 200 | ۹ دیپلوی، همهٔ 2026-08-22 |
| 07 | versions | ✅ 200 | ۹ نسخه (v1–v9) |
| 08 | schedules | ✅ 200 | خالی (بدون cron) |
| 09 | subinfo | ✅ 200 | **سورس کامل ورکر** (multipart worker.js، 828 خط) |
| 10 | KV namespaces | ❌ 401 | اسکوپ توکن (داکترین: retry نشد) |
| 11 | R2 buckets | ❌ 403 10042 | «R2 را از داشبورد فعال کنید» → R2 روی اکانت **غیرفعال** (ساختاری، نه فقط اسکوپ) |
| 12 | D1 database | ❌ 401 | اسکوپ توکن |
| 13 | DO namespaces | ✅ 200 | دو namespace SQLite |
| 14 | queues | ✅ 200 | خالی |
| 15 | zones | ✅ 200 | سه زون eu.cc |
| 16 | audit_logs | ❌ 403 | اسکوپ توکن |

شواهد خام: همین پوشه، `01…16.json` + `cityforge-edge-worker-source.js`. دو اجرای مستقل (20:12 و 20:45 UTC) سایزهای بایت‌به‌بایت یکسان دادند → تأیید پایداری دیپلوی و تکرارپذیری حسابرسی.

## ۲. کانفیگ ورکر cityforge-edge
- **شناسه/tag:** script_tag `313fb7d4b34f4540a8256bf74ebeef0a` · created 2026-08-22T19:44:10Z · modified 2026-08-22T20:19:48Z
- **compatibility_date:** 2026-08-20 · **usage_model:** standard · placement پیش‌فرض
- **has_assets: true** (فرانت‌اند از خود ورکر سرو می‌شود) · **has_modules: true** · last_deployed_from: wrangler · migration_tag: v2
- **Bindings:** `CITYFORGE_QUOTA` → DO `CityforgeQuota` (`86b83ed9c2b543c7ae9634469d3cde76`) · `CITYFORGE_ROOMS` → DO `CityforgeRoom` (`eee6c991e4bf4cf5999ca6831b7347df`) · secrets: `PROFILE_BRIDGE_SECRET`، `SESSION_SECRET` (مقدارها redact)
- **DO namespaces:** هر دو `use_sqlite: true`
- **Cron/Queues:** هیچ‌کدام

## ۳. خط زمانی دیپلوی (همهٔ 2026-08-22 UTC)
| زمان | رویداد |
|---|---|
| 19:44:10 | ساخت سرویس، v1 (`upload`) |
| 19:44:20 → 19:48:49 | v2 و v3 (`secret` — ست‌شدن دو secret) |
| 19:48–19:55 | v4–v6 (`version_upload`) |
| 19:55:33 → 20:13:17 | v7–v8 + دیپلوی‌ها |
| 20:16:40 / 20:19:44 | آخرین دو دیپلوی (v9 `upload`) |
| 20:19:48 | آخرین modification — **از این لحظه منجمد** |

نویسندهٔ همه: `0o0r7.web3@gmail.com` از طریق wrangler.

## ۴. معماری از سورس (828 خط)
- **GameEngine سروِر-اختیار** داخل DO: ۲۰ منطقهٔ نام‌دار، ۲–۴ بازیکن، ۵۲۰ اعتبار اولیه، فازهای roll→resolve→(trade)→end، برنده: آخرین نفر فعال یا امتیاز برتر پس از راند ۱۸.
- **تاس امن:** `secureRandomInt` با rejection sampling روی `crypto.getRandomValues` — ترفند معروف `Math.random % n` نیست؛ روی سرور Math.random اصلاً استفاده نشده.
- **AI چهار شخصیتی** (Mira Vale/Cautious، Rowan Flint/Aggressive، Sage Flores/Opportunist، Toma Reed/Balanced) با آستانه‌های قطعی خرید/ارتقا/معامله.
- **نشست:** توکن سفارشی base64url + HMAC-SHA256، کوکی `cityforge_session` (HttpOnly، Secure، SameSite=None، ۳۰ روز)، مقایسهٔ امضا constant-time.
- **سهمیه:** DO `CityforgeQuota` — ۴ اتاق به‌ازای هر بازیکن در پنجرهٔ ۶۰ ثانیه‌ای.
- **جریان پروفایل/NFT:** `/api/session` با `profileTicket` (HMAC با PROFILE_BRIDGE_SECRET) → `profile-binding` در DO → بعد از برد، `/eligibility` بلیت `edge-winner` ۱۰ دقیقه‌ای صادر می‌کند → مصرف توسط بک‌اند Manus (که حذف شده).

## ۵. یافته‌های F-EDGE
| کد | شدت | یافته |
|---|---|---|
| F-EDGE-1 | 🔴 بحرانی (برای UX) | CORS سخت‌کدشده فقط روی origin مردهٔ Manus (`cityforge-2z7rzsms.manus.space`)؛ فرانت workers.dev بدون ACAO پاس می‌گیرد → بنر «reconnect». WebSocket `/connect` هم برای هر origin غیر از آن 403. |
| F-EDGE-2 | 🟠 بالا | **اصلاح یافتهٔ قبلی پرونده:** «بک‌اند مرده/1101 همه‌جا» نادرست بود؛ 1101 فقط با بدنهٔ خالی/JSON نامعتبر بازتولید می‌شود (`request.json()` بدون try/catch در ۴ اندپوینت). بک‌ند کاملاً کارآمد است. |
| F-EDGE-3 | 🟠 بالا | جریان profile-binding و winnerTicket به بک‌اند حذف‌شدهٔ Manus وابسته است → claim NFT از دسترس خارج (تأیید مجدد F-CF مربوط به پرونده). |
| F-EDGE-4 | 🟡 متوسط | نبود محافظت origin/CSRF روی HTTP API + کوکی SameSite=None: سایت ثالث با کوکی قربانی می‌تواند اکشن ثبت کند (در عمل نیازمند دانستن roomId شش‌ضدستی ۶۴ کاراکتری؛ ریسک کم اما واقعی). |
| F-EDGE-5 | 🟡 متوسط | Room DOها بدون پاک‌سازی/TTL/alarm انبار می‌شوند؛ `save()` هر turn یک کلید `event:<n>` اضافه می‌کند → نشت تدریجی استوریج DO. |
| F-EDGE-6 | 🟡 متوسط | عدم جداسازی کلید HMAC: `PROFILE_BRIDGE_SECRET` هم برای profileTicket و هم winnerTicket امضا می‌کند (اشتراک کلید بین دو purpose). |
| F-EDGE-7 | 🟡 متوسط | observability/logpush روی cityforge-edge خاموش است (برخلاف my-vless-proxy) → دیباگ کورکورانه؛ خطاهای 1101 هیچ‌جا ثبت نمی‌شوند. |
| F-EDGE-8 | 🟢 کم | `/api/session` سهمیه ندارد (فقط ساخت اتوب سهمیه دارد) → اسپم نشست ممکن است. |
| F-EDGE-9 | 🟢 کم | مسیر ثانویهٔ 1101: `load()` در DO برای roomId ناموجود throw می‌کند (بدون پاسخ 404 تمیز). |
| F-EDGE-10 | 🟢 مثبت | نقش‌های امنیتی درست پیاده شده: تاس crypto امن، امضای HMAC + مقایسهٔ constant-time، کوکی HttpOnly/Secure، سهمیهٔ DO، احراز هویت داخلی bridge با secret. |
| F-EDGE-11 | 🟢 ساختاری | اکانت: R2 غیرفعال (10042)؛ هیچ زون سفارشی برای بازی (۳ زون eu.cc بی‌ربط)؛ ورکر دوم (my-vless-proxy) شخصی و بی‌ربط. |
| F-EDGE-12 | 🟢 ثبات | منجمد از 2026-08-22 — ~۲.۵ ماه بدون دیپلوی؛ با مرگ پروژهٔ Manus (F-CF13/14) هم‌خوان است. |
| F-EDGE-13 | 🟢 مشاهده | مسیر `/__manus___debug-collector.js` (که در 2026-11-09 ~17:24 UTC هنوز 25,168 بایت سرو می‌شد) اکنون **1101 قطعی و قابل‌بازتولید** می‌دهد (500 text/plain، در تلاش‌های مکرر با UA و query مختلف)؛ سایر assetها سالم‌اند → لبهٔ خطای مسیریابی ASSETS روی این فایل خاص. فایل در بک‌اپ موجود نیست — نیازمند بازسازی از کش/آرشیو در صورت اهمیت. |

## ۶. تست عملکردی زنده (API عمومی محصول — بدون تغییر کانفیگ)
| گام | نتیجه |
|---|---|
| POST /api/session | 201 + کوکی معتبر |
| POST /api/rooms {aiCount:1} | 201 — اتاق با Mira Vale، ۲۰ منطقه |
| GET /api/room/:id/state | 200 |
| POST action roll | 200 — lastDice=4 |
| POST action buy | 200 — 520−180=340 ✓ (هزینهٔ district-5 دقیق) |
| POST action endTurn | 200 — AI بازی کرد، راند ۲ |
| POST بدون بدنه / JSON خراب | **500 + error code: 1101** (بازتولید معما) |
| GET state بدون session | 401 تمیز |

## ۷. محدودیت‌ها و داکترین
- اسکوپ‌های KV/D1/audit-logs روی توکن نبود → طبق داکترین بدون retry رها شد؛ R2 حتی با اسکوپ هم جواب نمی‌داد (غیرفعال در سطح اکانت).
- مقادیر secret توسط CF redact می‌شوند و در هیچ خروجی‌ای ظاهر نشدند.
- هیچ درخواست نوشتن (PUT/POST به API مدیریتی CF) صادر نشد؛ تست‌های POST فقط روی API عمومی خودِ محصول بودند (معادل رفتار یک بازیکن).
- **توکن پس از این گزارش قابل rotate است.** تمام شواهد در همین پوشه ذخیره شده‌اند.
