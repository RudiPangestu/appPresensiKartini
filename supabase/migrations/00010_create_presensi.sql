-- ============================================================
-- Migration 00010: Tabel presensi
-- Tabel utama pencatatan kehadiran siswa
-- Bisa untuk mata pelajaran (mapel_id) ATAU kegiatan (kegiatan_id)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.presensi (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id        uuid NOT NULL REFERENCES public.siswa(id),
    mapel_id        uuid REFERENCES public.mata_pelajaran(id),     -- NULL jika kegiatan
    kegiatan_id     uuid REFERENCES public.kegiatan_sekolah(id),   -- NULL jika mapel
    tanggal         date NOT NULL,
    status          text NOT NULL CHECK (status IN ('hadir','sakit','izin','alpha')),
    catatan         text,
    dicatat_oleh    uuid REFERENCES public.users(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),

    -- Satu presensi per siswa per mapel per hari
    CONSTRAINT uq_presensi_siswa_mapel_tanggal UNIQUE (siswa_id, mapel_id, tanggal)
);

-- Constraint: harus isi salah satu (mapel_id XOR kegiatan_id)
-- Bisa keduanya NULL (misal presensi umum), tapi tidak boleh keduanya terisi
ALTER TABLE public.presensi
    ADD CONSTRAINT chk_presensi_tipe
    CHECK (
        NOT (mapel_id IS NOT NULL AND kegiatan_id IS NOT NULL)
    );

COMMENT ON TABLE public.presensi IS 'Catatan kehadiran siswa. Per mapel atau per kegiatan.';
COMMENT ON COLUMN public.presensi.mapel_id IS 'Diisi jika presensi untuk mata pelajaran';
COMMENT ON COLUMN public.presensi.kegiatan_id IS 'Diisi jika presensi untuk kegiatan sekolah';
COMMENT ON COLUMN public.presensi.dicatat_oleh IS 'User (guru/admin) yang menginput presensi';
