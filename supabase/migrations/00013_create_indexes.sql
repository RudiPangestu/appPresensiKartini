-- ============================================================
-- Migration 00013: Indexes
-- Semua index wajib sesuai SPEC.md section 5.3
-- Plus index tambahan untuk performa
-- ============================================================

-- Index dari SPEC.md (yang belum dibuat di migrasi tabel)
CREATE INDEX IF NOT EXISTS idx_presensi_siswa_id  ON public.presensi(siswa_id);
CREATE INDEX IF NOT EXISTS idx_presensi_tanggal   ON public.presensi(tanggal);
CREATE INDEX IF NOT EXISTS idx_presensi_mapel_id  ON public.presensi(mapel_id);
CREATE INDEX IF NOT EXISTS idx_siswa_kelas_id     ON public.siswa(kelas_id);
CREATE INDEX IF NOT EXISTS idx_mapel_guru_id      ON public.mata_pelajaran(guru_id);
CREATE INDEX IF NOT EXISTS idx_mapel_kelas_id     ON public.mata_pelajaran(kelas_id);

-- Index tambahan untuk performa query umum
CREATE INDEX IF NOT EXISTS idx_presensi_kegiatan_id ON public.presensi(kegiatan_id);
CREATE INDEX IF NOT EXISTS idx_presensi_dicatat_oleh ON public.presensi(dicatat_oleh);
CREATE INDEX IF NOT EXISTS idx_siswa_user_id ON public.siswa(user_id);

-- Composite index untuk query presensi yang sering digunakan
CREATE INDEX IF NOT EXISTS idx_presensi_siswa_tanggal
    ON public.presensi(siswa_id, tanggal);
