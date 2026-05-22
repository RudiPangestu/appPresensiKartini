-- ============================================================
-- Migration 00014: Triggers
-- Auto-update updated_at timestamp pada semua tabel yang relevan
-- ============================================================

-- Function untuk auto-update updated_at
CREATE OR REPLACE FUNCTION public.fn_update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_update_updated_at()
    IS 'Trigger function: otomatis set updated_at = now() saat UPDATE';

-- ── Apply trigger ke semua tabel dengan kolom updated_at ───

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_guru_updated_at
    BEFORE UPDATE ON public.guru
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_kelas_updated_at
    BEFORE UPDATE ON public.kelas
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_siswa_updated_at
    BEFORE UPDATE ON public.siswa
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_mata_pelajaran_updated_at
    BEFORE UPDATE ON public.mata_pelajaran
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_kegiatan_sekolah_updated_at
    BEFORE UPDATE ON public.kegiatan_sekolah
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_presensi_updated_at
    BEFORE UPDATE ON public.presensi
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_fcm_tokens_updated_at
    BEFORE UPDATE ON public.fcm_tokens
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();
