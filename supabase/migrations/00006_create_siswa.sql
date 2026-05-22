-- ============================================================
-- Migration 00006: Tabel siswa
-- Data siswa dengan NISN unik dan relasi ke kelas & akun ortu
-- ============================================================

CREATE TABLE IF NOT EXISTS public.siswa (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nisn            text UNIQUE NOT NULL,
    nama            text NOT NULL,
    jenis_kelamin   text CHECK (jenis_kelamin IN ('L', 'P')),
    kelas_id        uuid REFERENCES public.kelas(id),
    nama_ortu       text,
    hp_ortu         text,
    email_ortu      text,
    foto_url        text,
    user_id         uuid REFERENCES public.users(id),  -- akun ortu terhubung
    deleted_at      timestamptz,                         -- soft delete
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.siswa IS 'Data siswa. user_id menghubungkan siswa ke akun orang tua.';
COMMENT ON COLUMN public.siswa.nisn IS 'Nomor Induk Siswa Nasional, wajib unik';
COMMENT ON COLUMN public.siswa.user_id IS 'FK ke users — akun orang tua/wali yang terhubung';
