-- ============================================================
-- Migration 00016: Enable Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tahun_ajaran       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guru               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mata_pelajaran     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kegiatan_sekolah   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kegiatan_kelas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presensi           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifikasi_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcm_tokens         ENABLE ROW LEVEL SECURITY;
