-- ============================================================
-- Migration 00004: Tabel guru
-- Data guru dengan NIP unik dan bidang studi
-- ============================================================

CREATE TABLE IF NOT EXISTS public.guru (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    nip             text UNIQUE,
    nama            text NOT NULL,
    bidang_studi    text,
    deleted_at      timestamptz,              -- soft delete
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Index untuk lookup guru berdasarkan user_id
CREATE INDEX idx_guru_user_id ON public.guru(user_id);

COMMENT ON TABLE public.guru IS 'Data guru. Soft delete via deleted_at.';
COMMENT ON COLUMN public.guru.nip IS 'Nomor Induk Pegawai, unik per guru';
COMMENT ON COLUMN public.guru.deleted_at IS 'NULL = aktif, timestamp = soft-deleted';
