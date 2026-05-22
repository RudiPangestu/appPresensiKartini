-- ============================================================
-- Migration 00008: Tabel kegiatan_sekolah
-- Kegiatan/acara sekolah (upacara, ekskul, dll)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.kegiatan_sekolah (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nama         text NOT NULL,
    deskripsi    text,
    tanggal      date NOT NULL,
    jam_mulai    time NOT NULL,
    jam_selesai  time NOT NULL,
    created_by   uuid REFERENCES public.users(id),
    deleted_at   timestamptz,                 -- soft delete
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Constraint: jam_selesai harus setelah jam_mulai
ALTER TABLE public.kegiatan_sekolah
    ADD CONSTRAINT chk_kegiatan_jam
    CHECK (jam_selesai > jam_mulai);

-- Index untuk query kegiatan berdasarkan tanggal
CREATE INDEX idx_kegiatan_tanggal ON public.kegiatan_sekolah(tanggal);

COMMENT ON TABLE public.kegiatan_sekolah IS 'Kegiatan/acara sekolah. Soft delete via deleted_at.';
