"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as AuthUser } from "@supabase/supabase-js";
import type { UserRole } from "@/types/database";

interface UserData {
  user: AuthUser | null;
  role: UserRole | null;
  loading: boolean;
}

/**
 * Hook untuk mendapatkan data user yang sedang login.
 * Mengembalikan auth user, role, dan loading state.
 */
export function useUser(): UserData {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          setUser(authUser);
          // Query role dari tabel users
          const { data: userData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("id", authUser.id)
            .single();

          setRole(userData?.role as UserRole ?? null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    }

    getUser();

    // Listen auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { user, role, loading };
}
