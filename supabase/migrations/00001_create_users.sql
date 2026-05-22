-- ============================================================
-- Migration 00001: Tabel users
-- Extends auth.users Supabase dengan role-based access
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
    id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role        text NOT NULL CHECK (role IN ('admin', 'guru', 'ortu')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Komentar tabel
COMMENT ON TABLE public.users IS 'Tabel user utama yang extends auth.users dengan field role';
COMMENT ON COLUMN public.users.role IS 'Role user: admin, guru, atau ortu';
