# آرتیفکت‌های عمومی CityForge — snapshot

**تاریخ گرفتن:** 2026-11-09 (UTC ~17:24 بار اول، ~20:45 بازگیری این ریپو)
**منبع:** `https://cityforge-edge.0o0r7-web3.workers.dev/` (دسترس عمومی، بدون توکن)
**کاربرد:** شواهد دیپ‌دایو (F-CF2 تا F-CF12 پروندهٔ `../audit/HISTORY-ARK-MONOPOLY.md`) — پس از حذف پروژهٔ Manus، این فایل‌ها تنها نسخه‌های شناخته‌شدهٔ فرانت‌اند منتشرشده‌اند.

## فایل‌ها و صحت‌سنجی (SHA-256)

| فایل | سایز (بایت) | SHA-256 (۱۶ کاراکتر اول) |
|---|---|---|
| `root.html` | 368,243 | `81586f6399f9465b` |
| `assets/index-P14T8RX6.js` | 793,128 | `a98f17db51d88efd` |
| `assets/index-Pjaa9_yt.css` | 134,224 | `8947efd669db608e` |
| `assets/ArcOwnerControl-6aTkiLY4.js` | 180,011 | `39ef54e858aedb07` |
| `headers-root.txt` | — | هدرهای پاسخ روت (تاریخ سرور، cf-ray، NEL) |

هش کامل با `sha256sum` قابل بازتولید است؛ مقدارهای کامل در تاریخچهٔ commit ثبت شده‌اند.

## یافته‌های کلیدی داخل این فایل‌ها
- `root.html` — رانتایم Manus Previewer (~367KB اینلاین)، scaffold Manus.
- `index-P14T8RX6.js` — باندل اصلی React 19.2.1؛ آرک‌چین: chainId `0x4cef52`، multicall3 `0xcA11bde05977b3631167028862bE2a173976CA11`، سه bytecode ERC-20 (798/1,410/11,188 hex)، نشت مسیر سورس `/home/ubuntu/cityforge-arc-game/client/src/...`؛ بدون آدرس قرارداد city-mark.
- `index-Pjaa9_yt.css` — استایل Tailwind + shadcn/ui.
- `ArcOwnerControl-6aTkiLY4.js` — صفحهٔ owner-only کنترل مالکانه (F-CF5).

## ⚠️ فایل غایب: `__manus___debug-collector.js`
در اسنپ‌شات 17:24 UTC هنوز سرو می‌شد (25,168 B) اما در بازگیری ~20:45 و پس از آن، مسیرش **500/error 1101 قطعی** می‌دهد (F-EDGE-13). کپی‌ای از آن در این ریپو وجود ندارد؛ در صورت نیاز به بازیابی: کش‌های عمومی (archive.org / Google cache) یا هر کپی محلی از اسنپ‌شات قبلی.

## نکتهٔ اصل و نسب
این فایل‌ها به‌صورت فقط-خواندنی از URL عمومی گرفته شده‌اند؛ هیچ تغییر روشن از 2026-08-22 در دیپلوی دیده نشده (سه refetch با سایز یکسان — F-CF14). بنابراین این اسنپ‌شوت معتبرِ «وضعیت منتشرشدهٔ پروژه» است.
