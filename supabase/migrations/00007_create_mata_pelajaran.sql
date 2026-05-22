-- ============================================================
-- Migration 00007: Tabel mata_pelajaran
-- Jadwal mata pelajaran per guru per kelas per hari
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mata_pelajaran (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nama        text NOT NULL,
    kode        text UNIQUE NOT NULL,
    guru_id     uuid REFERENCES public.guru(id),
    kelas_id    uuid REFERENCES public.kelas(id),
    hari        text CHECK (hari IN ('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu')),
    jam_mulai   time NOT NULL,
    jam_selesai time NOT NULL,
    deleted_at  timestamptz,                  -- soft delete
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Constraint: jam_selesai harus setelah jam_mulai
ALTER TABLE public.mata_pelajaran
    ADD CONSTRAINT chk_mapel_jam
    CHECK (jam_selesai > jam_mulai);

COMMENT ON TABLE public.mata_pelajaran IS 'Jadwal mata pelajaran. Satu record = satu slot jadwal.';
COMMENT ON COLUMN public.mata_pelajaran.kode IS 'Kode unik mata pelajaran, contoh: MTK-XA-SEN';
