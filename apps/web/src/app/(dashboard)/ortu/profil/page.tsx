"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, UserCircle } from "lucide-react";
import type { Profile } from "@/types/database";

export default function OrtuProfilPage() {
  const supabase = createClient();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ nama: "", no_hp: "" });
  const [siswaInfo, setSiswaInfo] = useState<{ nama: string; kelas: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    async function loadProfile() {
      try {
        const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
        if (profile) {
          const p = profile as Profile;
          setForm({ nama: p.nama, no_hp: p.no_hp ?? "" });
        }
        // Load child info
        const { data: siswa } = await supabase.from("siswa").select("nama, kelas(nama)").eq("user_id", user!.id).single();
        if (siswa) {
          const kelasInfo = siswa.kelas as unknown as Record<string, unknown> | null;
          setSiswaInfo({ nama: siswa.nama, kelas: (kelasInfo?.nama as string) ?? "—" });
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    loadProfile();
  }, [user, supabase]);

  const handleSave = async () => {
    if (!form.nama.trim()) { setError("Nama wajib diisi"); return; }
    setSaving(true); setError(null); setSuccess(false);
    try {
      const { error: err } = await supabase.from("profiles").update({ nama: form.nama, no_hp: form.no_hp || null }).eq("user_id", user!.id);
      if (err) throw err;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Gagal menyimpan"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-6"><h1 className="text-3xl font-bold">Profil</h1><div className="animate-pulse h-48 bg-muted rounded-lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground">Update data kontak (HP, email) untuk notifikasi.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5" /> Data Orang Tua</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={form.nama} onChange={(e) => setForm({...form, nama: e.target.value})} /></div>
            <div className="space-y-2"><Label>No. HP</Label><Input value={form.no_hp} onChange={(e) => setForm({...form, no_hp: e.target.value})} placeholder="08xx" /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ""} disabled className="opacity-60" /><p className="text-xs text-muted-foreground">Email tidak bisa diubah</p></div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-green-600 dark:text-green-400">✓ Profil berhasil disimpan</p>}

            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="mr-2 h-4 w-4" /> Simpan</>}
            </Button>
          </CardContent>
        </Card>

        {siswaInfo && (
          <Card>
            <CardHeader><CardTitle>Data Anak</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Nama</span><span className="text-sm font-medium">{siswaInfo.nama}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Kelas</span><span className="text-sm font-medium">{siswaInfo.kelas}</span></div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
