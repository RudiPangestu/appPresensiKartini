-- ============================================================
-- Migration 00002: Tabel profiles
-- Data profil user (nama, no HP, foto)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    nama        text NOT NULL,
    no_hp       text,
    foto_url    text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Index untuk lookup profil berdasarkan user_id
CREATE UNIQUE INDEX idx_profiles_user_id ON public.profiles(user_id);

COMMENT ON TABLE public.profiles IS 'Data profil lengkap user';
