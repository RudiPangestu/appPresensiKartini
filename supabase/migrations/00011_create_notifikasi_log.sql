-- ============================================================
-- Migration 00011: Tabel notifikasi_log
-- Log semua notifikasi yang dikirim (push, email, WhatsApp)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifikasi_log (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id    uuid REFERENCES public.siswa(id),
    tipe        text NOT NULL CHECK (tipe IN ('absen','reminder_kegiatan','rekap_mingguan')),
    pesan       text NOT NULL,
    dikirim_ke  text NOT NULL,                -- nomor HP atau email
    channel     text NOT NULL CHECK (channel IN ('push','email','whatsapp')),
    status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('terkirim','gagal','pending')),
    error_msg   text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index untuk query log per siswa
CREATE INDEX idx_notifikasi_siswa_id ON public.notifikasi_log(siswa_id);

-- Index untuk filter berdasarkan status (monitoring notif gagal)
CREATE INDEX idx_notifikasi_status ON public.notifikasi_log(status);

COMMENT ON TABLE public.notifikasi_log IS 'Log semua notifikasi yang dikirim ke orang tua/wali';
