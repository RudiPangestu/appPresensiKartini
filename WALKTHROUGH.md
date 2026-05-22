# Walkthrough: Sistem Presensi SMA Kartini Batam

## Progress Keseluruhan

| Fase | Status | Detail |
|------|--------|--------|
| **Fase 1** — Fondasi | ✅ Selesai | Monorepo + 17 SQL migrations |
| **Fase 2** — Web Core | ✅ Selesai | Next.js + Auth + Admin CRUD + Guru + Ortu |
| **Fase 3** — Laporan & Statistik | ✅ Selesai | Charts + Filter + Export PDF/Excel |
| **Fase 4** — Mobile App | ✅ Selesai | Expo SDK 54 + Auth + 11 Screens |
| **Fase 5** — Notifikasi & Polish | ✅ Selesai | Email + Push + 3 API Routes + Admin Panel |

---

## Fase 5 — Notifikasi & Polish ✅

### Notification Service

#### [NEW] [notifications.ts](file:///d:/appPresensiKartini/apps/web/src/lib/notifications.ts)
Service layer terpusat untuk semua channel notifikasi:
- **`sendEmail(to, subject, html)`** — Nodemailer + Gmail SMTP (lazy-init transporter)
- **`sendPushNotification(userId, title, body)`** — FCM v1 HTTP API (plug-and-play, aktif saat credentials diisi)
- **`logNotification(...)`** — Insert ke tabel `notifikasi_log`
- **`buildAbsenEmailHtml(...)`** — Template email ketidakhadiran (premium gradient header)
- **`buildKegiatanReminderHtml(...)`** — Template email pengingat kegiatan H-1
- Supabase Admin client **lazy-initialized** (mencegah error saat build)

### API Routes (3 endpoints)

#### [NEW] [/api/notify-absen](file:///d:/appPresensiKartini/apps/web/src/app/api/notify-absen/route.ts)
- **Trigger**: Supabase Database Webhook (INSERT on `presensi` WHERE status ≠ 'hadir') atau manual POST
- **Flow**: Ambil siswa → ambil mapel → kirim email + push ke ortu → log
- **Auth**: Bearer token (service key atau webhook secret)

#### [NEW] [/api/notify-kegiatan](file:///d:/appPresensiKartini/apps/web/src/app/api/notify-kegiatan/route.ts)
- **Trigger**: Vercel Cron Job, setiap hari 01:00 UTC (08:00 WIB)
- **Flow**: Query kegiatan besok → ambil kelas terkait → kirim email + push ke semua ortu siswa

#### [NEW] [/api/notify-rekap](file:///d:/appPresensiKartini/apps/web/src/app/api/notify-rekap/route.ts)
- **Trigger**: Vercel Cron Job, setiap Jumat 09:00 UTC (16:00 WIB)
- **Flow**: Ambil semua siswa → hitung presensi Senin-Jumat → kirim email rekap dengan statistik H/S/I/A + persentase

#### [NEW] [vercel.json](file:///d:/appPresensiKartini/apps/web/vercel.json)
```json
{
  "crons": [
    { "path": "/api/notify-kegiatan", "schedule": "0 1 * * *" },
    { "path": "/api/notify-rekap", "schedule": "0 9 * * 5" }
  ]
}
```

### Admin Notifikasi Panel

#### [MODIFY] [admin/notifikasi/page.tsx](file:///d:/appPresensiKartini/apps/web/src/app/(dashboard)/admin/notifikasi/page.tsx)
Mengganti stub placeholder dengan halaman lengkap:
- **4 stat cards**: Total, Terkirim (hijau), Gagal (merah), Pending (kuning)
- **Filter bar**: Search + dropdown Tipe (absen/kegiatan/rekap) + Channel (email/push) + Status
- **Log table**: Waktu, Siswa, Tipe badge, Channel icon, Tujuan, Pesan, Status badge, Error msg
- **Tombol kirim ulang** untuk notifikasi yang `status = 'gagal'`
- **Refresh button** dengan loading spinner

### Mobile Push Notification

#### [NEW] [lib/notifications.ts](file:///d:/appPresensiKartini/apps/mobile/lib/notifications.ts)
- `Notifications.setNotificationHandler()` — foreground display config
- `registerPushNotification(userId)` — request permission → get Expo Push Token → upsert ke `fcm_tokens`
- `unregisterPushNotification(userId)` — delete token saat logout
- `addNotificationListeners()` — handle receive + tap events
- Android notification channel setup (warna #2563EB)

#### [MODIFY] [context/auth.tsx](file:///d:/appPresensiKartini/apps/mobile/context/auth.tsx)
- Setelah login/session restore → `registerPushNotification(userId)`
- Sebelum logout → `unregisterPushNotification(userId)`

#### [MODIFY] [app.json](file:///d:/appPresensiKartini/apps/mobile/app.json)
- Nama: "SMA Kartini Presensi", slug: "sma-kartini-presensi"
- Plugin: `expo-notifications` (icon, color #2563eb)
- Bundle ID: `id.sch.smakartini.presensi`
- Google Services File: `./google-services.json` (placeholder)

### Updated Environment

#### [MODIFY] [.env.example](file:///d:/appPresensiKartini/.env.example)
Variabel baru:
- `CRON_SECRET` — validasi Vercel Cron Job
- `WEBHOOK_SECRET` — validasi Supabase webhook
- `EXPO_PUBLIC_PROJECT_ID` — Expo EAS project ID untuk push token

### Build Results
```
Web:
  ✅ 25 pages (22 pages + 3 API routes), exit code 0

Mobile:
  ✅ tsc --noEmit, exit code 0
```

---

## Setup untuk Production

### Supabase Webhook (untuk notify-absen)
1. Buka Supabase Dashboard → Database → Webhooks
2. Create webhook:
   - Table: `presensi`
   - Events: `INSERT`
   - URL: `https://your-domain.vercel.app/api/notify-absen`
   - Header: `Authorization: Bearer <WEBHOOK_SECRET>`

### Firebase FCM (untuk push notification)
1. Buat Firebase project
2. Download `google-services.json` → taruh di `apps/mobile/`
3. Isi env vars: `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
4. Push notification akan aktif otomatis

### Gmail SMTP
1. Enable 2FA di akun Gmail
2. Buat App Password: Google Account → Security → App Passwords
3. Isi: `SMTP_USER=email@gmail.com`, `SMTP_PASS=<app-password>`

### Vercel Deploy
1. Push ke GitHub
2. Connect repo ke Vercel
3. Set environment variables
4. Cron jobs aktif otomatis dari `vercel.json`
