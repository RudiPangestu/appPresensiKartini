-- ============================================================
-- Migration 00003: Tabel tahun_ajaran
-- Manajemen tahun akademik (contoh: "2024/2025")
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tahun_ajaran (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nama            text NOT NULL,           -- contoh: "2024/2025"
    tanggal_mulai   date NOT NULL,
    tanggal_selesai date NOT NULL,
    aktif           boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- Constraint: tanggal_selesai harus setelah tanggal_mulai
ALTER TABLE public.tahun_ajaran
    ADD CONSTRAINT chk_tahun_ajaran_tanggal
    CHECK (tanggal_selesai > tanggal_mulai);

-- Partial unique index: hanya boleh ada 1 tahun ajaran aktif
CREATE UNIQUE INDEX idx_tahun_ajaran_aktif
    ON public.tahun_ajaran(aktif)
    WHERE aktif = true;

COMMENT ON TABLE public.tahun_ajaran IS 'Tabel tahun akademik. Hanya satu record boleh aktif.';
