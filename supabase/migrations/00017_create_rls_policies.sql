-- ============================================================
-- Migration 00017: RLS Policies
-- Semua policies per role sesuai SPEC.md section 6
-- ============================================================

-- ── Helper: cek role user yang login ───────────────────────
-- Digunakan di semua policies di bawah

-- ════════════════════════════════════════════════════════════
-- TABEL: users
-- ════════════════════════════════════════════════════════════

-- Admin: full access
CREATE POLICY "admin_full_access_users" ON public.users
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- Guru & Ortu: baca profil sendiri
CREATE POLICY "users_read_own" ON public.users
    FOR SELECT USING (id = auth.uid());

-- ════════════════════════════════════════════════════════════
-- TABEL: profiles
-- ════════════════════════════════════════════════════════════

CREATE POLICY "admin_full_access_profiles" ON public.profiles
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "profiles_read_own" ON public.profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════
-- TABEL: tahun_ajaran
-- ════════════════════════════════════════════════════════════

CREATE POLICY "admin_full_access_tahun_ajaran" ON public.tahun_ajaran
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- Semua role bisa baca tahun ajaran
CREATE POLICY "tahun_ajaran_read_all" ON public.tahun_ajaran
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- ════════════════════════════════════════════════════════════
-- TABEL: guru
-- ════════════════════════════════════════════════════════════

CREATE POLICY "admin_full_access_guru" ON public.guru
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- Guru: baca data sendiri
CREATE POLICY "guru_read_own" ON public.guru
    FOR SELECT USING (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════
-- TABEL: kelas
-- ════════════════════════════════════════════════════════════

CREATE POLICY "admin_full_access_kelas" ON public.kelas
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- Guru: baca kelas yang diajar (via mata_pelajaran atau wali_kelas)
CREATE POLICY "guru_read_own_kelas" ON public.kelas
    FOR SELECT USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'guru'
        AND (
            -- Wali kelas
            wali_kelas_id IN (SELECT id FROM public.guru WHERE user_id = auth.uid())
            OR
            -- Mengajar di kelas ini
            id IN (
                SELECT mp.kelas_id FROM public.mata_pelajaran mp
                JOIN public.guru g ON g.id = mp.guru_id
                WHERE g.user_id = auth.uid()
            )
        )
    );

-- Ortu: baca kelas anak
CREATE POLICY "ortu_read_child_kelas" ON public.kelas
    FOR SELECT USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'ortu'
        AND id IN (
            SELECT kelas_id FROM public.siswa WHERE user_id = auth.uid()
        )
    );

-- ════════════════════════════════════════════════════════════
-- TABEL: siswa
-- ════════════════════════════════════════════════════════════

CREATE POLICY "admin_full_access_siswa" ON public.siswa
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- Guru: baca siswa di kelas yang diajar
CREATE POLICY "guru_read_own_siswa" ON public.siswa
    FOR SELECT USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'guru'
        AND kelas_id IN (
            SELECT mp.kelas_id FROM public.mata_pelajaran mp
            JOIN public.guru g ON g.id = mp.guru_id
            WHERE g.user_id = auth.uid()
        )
    );

-- Ortu: baca data anak sendiri
CREATE POLICY "ortu_read_own_child" ON public.siswa
    FOR SELECT USING (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════
-- TABEL: mata_pelajaran
-- ════════════════════════════════════════════════════════════

CREATE POLICY "admin_full_access_mapel" ON public.mata_pelajaran
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- Guru: CRUD mapel yang diajar
CREATE POLICY "guru_manage_own_mapel" ON public.mata_pelajaran
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'guru'
        AND guru_id IN (SELECT id FROM public.guru WHERE user_id = auth.uid())
    );

-- Ortu: baca mapel anak
CREATE POLICY "ortu_read_child_mapel" ON public.mata_pelajaran
    FOR SELECT USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'ortu'
        AND kelas_id IN (
            SELECT kelas_id FROM public.siswa WHERE user_id = auth.uid()
        )
    );

-- ════════════════════════════════════════════════════════════
-- TABEL: kegiatan_sekolah
-- ════════════════════════════════════════════════════════════

CREATE POLICY "admin_full_access_kegiatan" ON public.kegiatan_sekolah
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- Semua user authenticated bisa baca kegiatan
CREATE POLICY "kegiatan_read_all" ON public.kegiatan_sekolah
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- ════════════════════════════════════════════════════════════
-- TABEL: kegiatan_kelas
-- ════════════════════════════════════════════════════════════

CREATE POLICY "admin_full_access_kegiatan_kelas" ON public.kegiatan_kelas
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "kegiatan_kelas_read_all" ON public.kegiatan_kelas
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- ════════════════════════════════════════════════════════════
-- TABEL: presensi
-- ════════════════════════════════════════════════════════════

CREATE POLICY "admin_full_access_presensi" ON public.presensi
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- Guru: INSERT & UPDATE presensi untuk kelas yang diajar
CREATE POLICY "guru_manage_presensi" ON public.presensi
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'guru'
        AND (
            -- Presensi mapel yang diajar
            mapel_id IN (
                SELECT mp.id FROM public.mata_pelajaran mp
                JOIN public.guru g ON g.id = mp.guru_id
                WHERE g.user_id = auth.uid()
            )
            OR
            -- Presensi kegiatan (guru bisa input)
            kegiatan_id IS NOT NULL
        )
    );

-- Ortu: baca presensi anak sendiri
CREATE POLICY "ortu_read_child_presensi" ON public.presensi
    FOR SELECT USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'ortu'
        AND siswa_id IN (
            SELECT id FROM public.siswa WHERE user_id = auth.uid()
        )
    );

-- ════════════════════════════════════════════════════════════
-- TABEL: notifikasi_log
-- ════════════════════════════════════════════════════════════

CREATE POLICY "admin_full_access_notifikasi" ON public.notifikasi_log
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- Ortu: baca notifikasi terkait anak
CREATE POLICY "ortu_read_own_notifikasi" ON public.notifikasi_log
    FOR SELECT USING (
        siswa_id IN (
            SELECT id FROM public.siswa WHERE user_id = auth.uid()
        )
    );

-- ════════════════════════════════════════════════════════════
-- TABEL: fcm_tokens
-- ════════════════════════════════════════════════════════════

CREATE POLICY "admin_full_access_fcm" ON public.fcm_tokens
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- User: manage token sendiri
CREATE POLICY "fcm_manage_own" ON public.fcm_tokens
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
