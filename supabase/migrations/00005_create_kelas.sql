-- ============================================================
-- Migration 00005: Tabel kelas
-- Data kelas dengan wali kelas dan tahun ajaran
-- ============================================================

CREATE TABLE IF NOT EXISTS public.kelas (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nama             text NOT NULL,           -- contoh: "X-A", "XI-IPA-1"
    tingkat          text NOT NULL CHECK (tingkat IN ('X', 'XI', 'XII')),
    wali_kelas_id    uuid REFERENCES public.guru(id),
    tahun_ajaran_id  uuid REFERENCES public.tahun_ajaran(id),
    deleted_at       timestamptz,              -- soft delete
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Index untuk filter kelas berdasarkan tahun ajaran
CREATE INDEX idx_kelas_tahun_ajaran_id ON public.kelas(tahun_ajaran_id);

COMMENT ON TABLE public.kelas IS 'Data kelas (X, XI, XII). Soft delete via deleted_at.';
COMMENT ON COLUMN public.kelas.tingkat IS 'Tingkat kelas: X, XI, atau XII';
