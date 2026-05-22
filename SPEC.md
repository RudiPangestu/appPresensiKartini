# SPEC.md — Sistem Presensi Terintegrasi SMA Kartini Batam

> **Instruksi untuk Agent:**
> Ini adalah dokumen spesifikasi utama proyek. Baca seluruh file ini sebelum menulis satu baris kode pun.
> Setiap kali memulai task baru, rujuk kembali ke dokumen ini untuk memastikan konsistensi.
> Jangan berasumsi — jika ada yang ambigu, tanyakan sebelum mengimplementasikan.

---

## 1. GAMBARAN PROYEK

Membangun sistem presensi digital terintegrasi untuk **SMA Kartini Batam** yang terdiri dari:
- **Web Dashboard** (Next.js) — untuk Admin dan Guru
- **Mobile App** (React Native + Expo) — untuk Guru dan Orang Tua/Murid
- **Backend** (Supabase) — database, auth, realtime, edge functions
- **Notifikasi** (FCM + Email) — push notification dan email ke orang tua

Semua tools yang digunakan harus **gratis (free tier)**.

---

## 2. TECH STACK (WAJIB, JANGAN DIGANTI)

| Layer | Teknologi | Versi |
|---|---|---|
| Web Frontend | Next.js (App Router) | 14+ |
| Web Styling | Tailwind CSS | 3+ |
| Mobile | React Native + Expo (managed workflow) | SDK 51+ |
| Database & Auth | Supabase (PostgreSQL) | latest |
| Push Notification | Firebase Cloud Messaging via Expo Notifications | latest |
| Email | Nodemailer + Gmail SMTP App Password | latest |
| Web Deploy | Vercel (free tier) | — |
| Mobile Build | Expo EAS Build (free tier) | — |
| Charts Web | Recharts | latest |
| Charts Mobile | Victory Native | latest |
| Form Validation | Zod + React Hook Form | latest |
| State/Cache | TanStack Query (React Query) | v5 |
| UI Components Web | shadcn/ui | latest |

---

## 3. STRUKTUR MONOREPO

```
sma-kartini-presensi/
├── apps/
│   ├── web/                  # Next.js 14 web dashboard
│   └── mobile/               # React Native + Expo
├── packages/
│   └── shared/               # Types, constants, utils bersama
├── supabase/
│   ├── migrations/           # SQL migration files
│   ├── functions/            # Edge Functions
│   └── seed.sql              # Data dummy untuk development
├── SPEC.md                   # File ini
├── .env.example
├── package.json              # Root package.json (pnpm workspace)
└── pnpm-workspace.yaml
```

---

## 4. ROLE & HAK AKSES

### 4.1 Admin
- Akses penuh ke **semua fitur dan semua data**
- CRUD semua entitas: user, kelas, siswa, guru, mata pelajaran, kegiatan
- Edit semua field dari semua entitas via GUI
- Assign role ke user (admin / guru / ortu)
- Lihat dan export semua laporan
- Kelola pengaturan notifikasi

### 4.2 Guru
- CRUD kelas dan mata pelajaran yang **diajarnya saja**
- Input presensi siswa untuk kelas/mapel yang ditugaskan
- Lihat rekap kehadiran siswa di kelas yang diajar
- Tidak bisa akses data kelas guru lain

### 4.3 Orang Tua / Wali Murid
- Hanya bisa melihat data **anak mereka sendiri**
- Lihat rekap kehadiran: per triwulan, semester, tahunan
- Lihat persentase kehadiran dengan breakdown: Hadir / Sakit / Izin / Alpha
- Terima push notification dan email saat anak absen
- Tidak bisa input atau mengubah data apapun

---

## 5. SCHEMA DATABASE (PostgreSQL via Supabase)

### 5.1 Daftar Tabel

#### `users` (extend auth.users Supabase)
```sql
id          uuid PRIMARY KEY references auth.users(id)
role        text NOT NULL CHECK (role IN ('admin', 'guru', 'ortu'))
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
```

#### `profiles`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES users(id) ON DELETE CASCADE
nama        text NOT NULL
no_hp       text
foto_url    text
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
```

#### `tahun_ajaran`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
nama            text NOT NULL          -- contoh: "2024/2025"
tanggal_mulai   date NOT NULL
tanggal_selesai date NOT NULL
aktif           boolean DEFAULT false
created_at      timestamptz DEFAULT now()
```

#### `kelas`
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
nama             text NOT NULL          -- contoh: "X-A", "XI-IPA-1"
tingkat          text NOT NULL CHECK (tingkat IN ('X', 'XI', 'XII'))
wali_kelas_id    uuid REFERENCES guru(id)
tahun_ajaran_id  uuid REFERENCES tahun_ajaran(id)
deleted_at       timestamptz            -- soft delete
created_at       timestamptz DEFAULT now()
updated_at       timestamptz DEFAULT now()
```

#### `guru`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES users(id) ON DELETE CASCADE
nip             text UNIQUE
nama            text NOT NULL
bidang_studi    text
deleted_at      timestamptz
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

#### `siswa`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
nisn            text UNIQUE NOT NULL
nama            text NOT NULL
jenis_kelamin   text CHECK (jenis_kelamin IN ('L', 'P'))
kelas_id        uuid REFERENCES kelas(id)
nama_ortu       text
hp_ortu         text
email_ortu      text
foto_url        text
user_id         uuid REFERENCES users(id)  -- akun ortu terhubung
deleted_at      timestamptz
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

#### `mata_pelajaran`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
nama        text NOT NULL
kode        text UNIQUE NOT NULL
guru_id     uuid REFERENCES guru(id)
kelas_id    uuid REFERENCES kelas(id)
hari        text CHECK (hari IN ('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'))
jam_mulai   time NOT NULL
jam_selesai time NOT NULL
deleted_at  timestamptz
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
```

#### `kegiatan_sekolah`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
nama         text NOT NULL
deskripsi    text
tanggal      date NOT NULL
jam_mulai    time NOT NULL
jam_selesai  time NOT NULL
created_by   uuid REFERENCES users(id)
deleted_at   timestamptz
created_at   timestamptz DEFAULT now()
updated_at   timestamptz DEFAULT now()
```

#### `kegiatan_kelas` (relasi kegiatan ↔ kelas)
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
kegiatan_id  uuid REFERENCES kegiatan_sekolah(id) ON DELETE CASCADE
kelas_id     uuid REFERENCES kelas(id) ON DELETE CASCADE
UNIQUE(kegiatan_id, kelas_id)
```

#### `presensi`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
siswa_id        uuid REFERENCES siswa(id)
mapel_id        uuid REFERENCES mata_pelajaran(id)  -- NULL jika kegiatan
kegiatan_id     uuid REFERENCES kegiatan_sekolah(id)  -- NULL jika mapel
tanggal         date NOT NULL
status          text NOT NULL CHECK (status IN ('hadir','sakit','izin','alpha'))
catatan         text
dicatat_oleh    uuid REFERENCES users(id)
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
UNIQUE(siswa_id, mapel_id, tanggal)  -- satu presensi per siswa per mapel per hari
```

#### `notifikasi_log`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
siswa_id    uuid REFERENCES siswa(id)
tipe        text CHECK (tipe IN ('absen','reminder_kegiatan','rekap_mingguan'))
pesan       text NOT NULL
dikirim_ke  text NOT NULL  -- nomor HP atau email
channel     text CHECK (channel IN ('push','email','whatsapp'))
status      text CHECK (status IN ('terkirim','gagal','pending'))
error_msg   text
created_at  timestamptz DEFAULT now()
```

#### `fcm_tokens`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES users(id) ON DELETE CASCADE
token       text NOT NULL
platform    text CHECK (platform IN ('ios','android'))
updated_at  timestamptz DEFAULT now()
UNIQUE(user_id, platform)
```

### 5.2 Views yang Wajib Dibuat

```sql
-- Rekap kehadiran per kelas hari ini
CREATE VIEW v_rekap_harian AS ...

-- Statistik kehadiran per siswa (fleksibel periode)
CREATE VIEW v_statistik_siswa AS ...

-- Siswa yang perlu perhatian (kehadiran < 75%)
CREATE VIEW v_siswa_perlu_perhatian AS ...
```

### 5.3 Index Wajib
```sql
CREATE INDEX idx_presensi_siswa_id ON presensi(siswa_id);
CREATE INDEX idx_presensi_tanggal ON presensi(tanggal);
CREATE INDEX idx_presensi_mapel_id ON presensi(mapel_id);
CREATE INDEX idx_siswa_kelas_id ON siswa(kelas_id);
CREATE INDEX idx_mapel_guru_id ON mata_pelajaran(guru_id);
CREATE INDEX idx_mapel_kelas_id ON mata_pelajaran(kelas_id);
```

---

## 6. ROW LEVEL SECURITY (RLS)

**Wajib aktifkan RLS di semua tabel.**

Gunakan pola berikut untuk cek role:
```sql
-- Cek role user yang sedang login
(SELECT role FROM users WHERE id = auth.uid()) = 'admin'
```

### Prinsip RLS per role:
- **Admin**: `USING (true)` — akses penuh semua baris
- **Guru**: akses hanya ke kelas/mapel yang ada di tabel penugasan guru
- **Ortu**: akses hanya ke baris yang terkait `siswa.user_id = auth.uid()`

---

## 7. SUPABASE EDGE FUNCTIONS

### `send-absence-notification`
- Trigger: dipanggil setelah guru submit presensi
- Logic: untuk setiap siswa dengan status `sakit/izin/alpha`, kirim push notif ke FCM token orang tua
- Simpan log ke `notifikasi_log`

### `send-event-reminder`
- Trigger: cron job setiap hari jam 15:00 WIB (UTC+7 = 08:00 UTC)
- Logic: query semua kegiatan yang `tanggal = today + 1`, kirim reminder ke semua siswa yang terlibat

### `generate-attendance-report`
- Input: `{ siswa_id, periode_mulai, periode_selesai }`
- Output: objek dengan persentase hadir/sakit/izin/alpha dan total hari

---

## 8. HALAMAN WEB (Next.js)

### Layout
- Sidebar navigasi responsif dengan role-based menu
- Dark/light mode toggle (next-themes)
- Protected routes via Next.js middleware + Supabase Auth

### Halaman Admin

| Route | Deskripsi |
|---|---|
| `/admin` | Dashboard: ringkasan, chart tren, siswa perlu perhatian |
| `/admin/users` | CRUD users, assign role, reset password |
| `/admin/kelas` | CRUD kelas, lihat siswa per kelas, edit semua field |
| `/admin/siswa` | CRUD siswa, search/filter/sort, import CSV |
| `/admin/guru` | CRUD guru, assign ke kelas/mapel |
| `/admin/mata-pelajaran` | CRUD jadwal pelajaran, tampilan timetable |
| `/admin/kegiatan` | CRUD kegiatan sekolah, set peserta |
| `/admin/laporan` | Rekap kehadiran, export PDF/Excel |
| `/admin/notifikasi` | Log notifikasi, kirim ulang, setting channel |

### Halaman Guru

| Route | Deskripsi |
|---|---|
| `/guru` | Dashboard: kelas hari ini, statistik cepat |
| `/guru/presensi` | Input presensi: pilih mapel → daftar siswa → submit |
| `/guru/history` | Riwayat presensi yang sudah diinput |

### Halaman Orang Tua

| Route | Deskripsi |
|---|---|
| `/ortu` | Dashboard: persentase kehadiran, chart, notif terbaru |
| `/ortu/kehadiran` | Detail kehadiran dengan filter periode |
| `/ortu/profil` | Update data kontak (HP, email) untuk notifikasi |

---

## 9. HALAMAN MOBILE (React Native + Expo)

### Navigasi
- **Auth Stack**: `LoginScreen`
- **Admin Tab**: Dashboard | Data Master | Users | Laporan
- **Guru Tab**: Dashboard | Daftar Kelas | Input Presensi | Kegiatan
- **Ortu Tab**: Dashboard | Kehadiran | Notifikasi | Profil

### Screen Prioritas

#### `LoginScreen`
- Email + password
- Handle redirect ke tab berdasarkan role setelah login
- Simpan session dengan AsyncStorage

#### `InputPresensiScreen` (Guru)
- Dropdown pilih mapel atau kegiatan hari ini
- List siswa dengan toggle status: Hadir / Sakit / Izin / Alpha
- Tidak bisa submit dua kali untuk mapel/hari yang sama
- Konfirmasi dialog sebelum submit

#### `DashboardOrangTuaScreen`
- Summary card: % kehadiran bulan ini
- Donut chart breakdown status
- Filter: Triwulan | Semester | Tahunan
- List 10 presensi terbaru

### Push Notification Setup
1. Install `expo-notifications` dan `expo-device`
2. Minta izin saat pertama login
3. Simpan token ke `fcm_tokens` di Supabase
4. Handle notifikasi foreground dan background
5. Tap notifikasi → navigate ke screen relevan

---

## 10. SISTEM NOTIFIKASI

### Channel yang Didukung
1. **Push Notification** (FCM via Expo) — utama
2. **Email** (Nodemailer + Gmail SMTP App Password) — backup
3. **WhatsApp** (Fonnte API, opsional) — bonus jika free tier mencukupi

### Event Notifikasi

| Event | Penerima | Channel |
|---|---|---|
| Siswa absen (sakit/izin/alpha) | Orang tua | Push + Email |
| Pengingat kegiatan H-1 | Orang tua + Siswa | Push + Email |
| Rekap mingguan (setiap Jumat) | Orang tua | Email |

---

## 11. UI/UX REQUIREMENTS

- Semua form wajib punya **validasi client-side** (Zod) dan **server-side** (Supabase constraints)
- Wajib handle: **loading state**, **empty state**, **error state**
- Semua tabel data harus bisa **search, filter, dan sort**
- Grafik menggunakan **Recharts** (web) atau **Victory Native** (mobile)
- Komponen reusable wajib dibuat untuk elemen berulang

### Komponen Reusable Wajib

```
AttendanceStatusBadge    — badge warna: Hadir=hijau, Sakit=kuning, Izin=biru, Alpha=merah
PercentageRing           — donut chart persentase kehadiran individual
StudentListItem          — foto + nama + NISN + status kehadiran
DataTable                — tabel dengan search/filter/sort/pagination
ConfirmDialog            — modal konfirmasi untuk aksi destruktif
LoadingSkeleton          — skeleton loading untuk tabel dan chart
EmptyState               — tampilan kosong yang informatif
```

---

## 12. ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Firebase FCM
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=           # Gmail App Password, bukan password biasa

# WhatsApp (opsional)
FONNTE_API_KEY=

# Expo
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 13. URUTAN PENGERJAAN (IKUTI URUTAN INI)

### Fase 1 — Fondasi
- [ ] Setup monorepo dengan pnpm workspaces
- [ ] Buat semua SQL migrations (tabel + index + trigger)
- [ ] Aktifkan RLS dan buat semua policies
- [ ] Buat views dan stored functions
- [ ] Setup Supabase Auth dengan custom user roles
- [ ] Seed data dummy untuk development

### Fase 2 — Web Core
- [ ] Setup Next.js 14 dengan Tailwind + shadcn/ui
- [ ] Implementasi auth middleware dan protected routes
- [ ] Layout komponen (Sidebar, Header)
- [ ] Halaman Admin: Users, Kelas, Siswa, Guru
- [ ] Halaman Admin: Mata Pelajaran, Kegiatan
- [ ] Halaman Guru: Input Presensi
- [ ] Halaman Ortu: Dashboard dan Rekap Kehadiran

### Fase 3 — Laporan & Statistik
- [ ] Komponen chart tren kehadiran (Recharts)
- [ ] Filter periode: hari/minggu/bulan/mid/semester/tahunan
- [ ] Persentase kehadiran individual: triwulan/semester/tahunan
- [ ] Export PDF dan Excel

### Fase 4 — Mobile App
- [ ] Setup Expo dengan navigasi (Expo Router)
- [ ] Implementasi auth + session management
- [ ] Screen Login, Dashboard (semua role)
- [ ] Screen Input Presensi (Guru)
- [ ] Screen Rekap Kehadiran (Ortu)
- [ ] Setup push notification (FCM via Expo)

### Fase 5 — Notifikasi & Polish
- [ ] Supabase Edge Function: kirim notif saat absen
- [ ] Supabase Edge Function: reminder H-1 kegiatan (cron)
- [ ] Setup Nodemailer untuk email notifikasi
- [ ] Admin panel log notifikasi
- [ ] Testing end-to-end semua fitur

---

## 14. ATURAN KODING (WAJIB DIIKUTI)

1. **TypeScript** di semua file — tidak boleh ada `any` kecuali terpaksa
2. **Zod schema** untuk semua input form dan API response
3. **Error handling** wajib di semua async function
4. **Komentar** untuk logic yang kompleks, terutama RLS dan perhitungan statistik
5. **Naming convention**: camelCase untuk variabel/fungsi, PascalCase untuk komponen
6. **Folder structure** harus konsisten: `/components`, `/hooks`, `/lib`, `/types`, `/app`
7. Gunakan **Server Components** Next.js sebisa mungkin, Client Components hanya jika perlu interaktivitas
8. Semua **query Supabase** harus handle error dan loading state
9. **Soft delete** untuk semua data penting (gunakan `deleted_at`, jangan hard delete)
10. Satu fungsi = satu tanggung jawab — jangan tulis fungsi > 50 baris

---

*Dokumen ini adalah source of truth. Semua implementasi harus konsisten dengan spesifikasi di sini.*
