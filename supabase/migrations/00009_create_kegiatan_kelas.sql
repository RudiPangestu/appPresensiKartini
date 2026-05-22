-- ============================================================
-- Migration 00009: Tabel kegiatan_kelas
-- Junction table: relasi many-to-many kegiatan ↔ kelas
-- ============================================================

CREATE TABLE IF NOT EXISTS public.kegiatan_kelas (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kegiatan_id  uuid NOT NULL REFERENCES public.kegiatan_sekolah(id) ON DELETE CASCADE,
    kelas_id     uuid NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,

    CONSTRAINT uq_kegiatan_kelas UNIQUE (kegiatan_id, kelas_id)
);

COMMENT ON TABLE public.kegiatan_kelas IS 'Relasi many-to-many antara kegiatan_sekolah dan kelas';
