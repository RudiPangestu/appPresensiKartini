-- ============================================================
-- Migration 00012: Tabel fcm_tokens
-- Token Firebase Cloud Messaging per user per platform
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token       text NOT NULL,
    platform    text NOT NULL CHECK (platform IN ('ios','android')),
    updated_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_fcm_user_platform UNIQUE (user_id, platform)
);

COMMENT ON TABLE public.fcm_tokens IS 'Token FCM untuk push notification. Satu token per user per platform.';
