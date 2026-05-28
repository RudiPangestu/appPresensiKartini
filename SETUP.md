# 🚀 Setup Project di Device Baru

## Prerequisites
- **Node.js** v18+ 
- **pnpm** (`npm install -g pnpm`)
- **Expo CLI** (`npm install -g expo-cli`) — untuk mobile

## Langkah Setup

### 1. Clone repository
```bash
git clone https://github.com/RudiPangestu/appPresensiKartini.git
cd appPresensiKartini
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Buat file environment variables

#### Web — `apps/web/.env.local`
```env
# ── Supabase ────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://ntxkuqykypckokglxsnj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY_JWT>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY_JWT>

# ── Email (opsional) ────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# ── Cron & Webhook ──────────────────────────────────────────
CRON_SECRET=
WEBHOOK_SECRET=
```

#### Mobile — `apps/mobile/.env`
```env
EXPO_PUBLIC_SUPABASE_URL=https://ntxkuqykypckokglxsnj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY_JWT>
```

> **PENTING:** Ambil key dari Supabase Dashboard → Settings → API → Legacy API Keys (format `eyJ...`)

### 4. Jalankan Web
```bash
cd apps/web
npm run dev
# → http://localhost:3000
```

### 5. Jalankan Mobile
```bash
cd apps/mobile
npx expo start
# → Scan QR code dengan Expo Go
```

## Akun Login

| Email | Password | Role |
|-------|----------|------|
| admin@smakartini.sch.id | Kartini2026! | Admin |
| budi@smakartini.sch.id | Kartini2026! | Guru |
| siti@smakartini.sch.id | Kartini2026! | Guru |
| hendra@gmail.com | Kartini2026! | Ortu |
| rina@gmail.com | Kartini2026! | Ortu |
