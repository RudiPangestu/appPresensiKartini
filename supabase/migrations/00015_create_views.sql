-- ============================================================
-- Migration 00015: Views
-- Views wajib sesuai SPEC.md section 5.2
-- ============================================================

-- ── View 1: Rekap kehadiran per kelas hari ini ─────────────
CREATE OR REPLACE VIEW public.v_rekap_harian AS
SELECT
    k.id                AS kelas_id,
    k.nama              AS kelas_nama,
    k.tingkat,
    p.tanggal,
    COUNT(*)                                          AS total_siswa,
    COUNT(*) FILTER (WHERE p.status = 'hadir')        AS jumlah_hadir,
    COUNT(*) FILTER (WHERE p.status = 'sakit')        AS jumlah_sakit,
    COUNT(*) FILTER (WHERE p.status = 'izin')         AS jumlah_izin,
    COUNT(*) FILTER (WHERE p.status = 'alpha')        AS jumlah_alpha,
    ROUND(
        COUNT(*) FILTER (WHERE p.status = 'hadir')::numeric
        / NULLIF(COUNT(*), 0) * 100,
        1
    )                                                  AS persen_hadir
FROM public.presensi p
JOIN public.siswa s ON s.id = p.siswa_id
JOIN public.kelas k ON k.id = s.kelas_id
WHERE p.tanggal = CURRENT_DATE
GROUP BY k.id, k.nama, k.tingkat, p.tanggal;

COMMENT ON VIEW public.v_rekap_harian IS 'Rekap kehadiran per kelas untuk hari ini';


-- ── View 2: Statistik kehadiran per siswa (semua waktu) ────
-- Untuk filter periode, gunakan WHERE tanggal BETWEEN ... di query
CREATE OR REPLACE VIEW public.v_statistik_siswa AS
SELECT
    s.id                AS siswa_id,
    s.nama              AS siswa_nama,
    s.nisn,
    k.id                AS kelas_id,
    k.nama              AS kelas_nama,
    COUNT(*)                                          AS total_pertemuan,
    COUNT(*) FILTER (WHERE p.status = 'hadir')        AS jumlah_hadir,
    COUNT(*) FILTER (WHERE p.status = 'sakit')        AS jumlah_sakit,
    COUNT(*) FILTER (WHERE p.status = 'izin')         AS jumlah_izin,
    COUNT(*) FILTER (WHERE p.status = 'alpha')        AS jumlah_alpha,
    ROUND(
        COUNT(*) FILTER (WHERE p.status = 'hadir')::numeric
        / NULLIF(COUNT(*), 0) * 100,
        1
    )                                                  AS persen_hadir
FROM public.siswa s
LEFT JOIN public.presensi p ON p.siswa_id = s.id
LEFT JOIN public.kelas k ON k.id = s.kelas_id
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.nama, s.nisn, k.id, k.nama;

COMMENT ON VIEW public.v_statistik_siswa IS 'Statistik kehadiran per siswa. Filter periode via WHERE di query.';


-- ── View 3: Siswa yang perlu perhatian (kehadiran < 75%) ───
CREATE OR REPLACE VIEW public.v_siswa_perlu_perhatian AS
SELECT *
FROM public.v_statistik_siswa
WHERE total_pertemuan > 0
  AND persen_hadir < 75;

COMMENT ON VIEW public.v_siswa_perlu_perhatian IS 'Siswa dengan persentase kehadiran di bawah 75%';
